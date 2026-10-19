#!/usr/bin/env python3
"""One Piece card-art CDN: plan, publish and verify.

Runs on the maintainer's machine, where the mirrored images live; nothing image-bearing is ever
committed. Uploads to a Cloudflare R2 bucket in the project's own account, never another
project's. See README.md (setup, usage) and SETTINGS.md (the config.json contract).

  opcdn.py plan    --catalog C --images DIR [--config F] [--offline]
  opcdn.py publish --catalog C --images DIR [--config F] [--dry-run]
  opcdn.py publish --config F                 # config.json only
  opcdn.py verify  [--samples N]
  opcdn.py publish-geo --dir PACKED --expect-sha256 SHA [--dry-run] [--fix-metadata]
  opcdn.py verify-geo  --dir PACKED --expect-sha256 SHA
  opcdn.py selftest

Credentials (environment or --env-file; only OPCDN_* entries are read):
  OPCDN_R2_ACCOUNT_ID, OPCDN_R2_ACCESS_KEY_ID, OPCDN_R2_SECRET_ACCESS_KEY,
  OPCDN_BUCKET, OPCDN_PUBLIC_BASE (e.g. https://cdn.example.org, no trailing slash)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Callable, Optional

ART_PREFIX = "art/"
INDEX_KEY = "art/index.json"
CONFIG_KEY = "config.json"
ART_CACHE = "public, max-age=86400"
CONFIG_CACHE = "public, max-age=300"
INDEX_CACHE = "no-cache"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
CONTENT_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
PLACEHOLDERS = ("{art}", "{file}", "{cardId}", "{printedId}", "{sourceFile}")
FORBIDDEN_WORDS = ("riftsight", "riftbound", "riftatlas")
USER_AGENT = "op-cdn-verify/1"
GEO_PREFIX = "vision/geo/"
GEO_CACHE = "public, max-age=31536000, immutable"
GEO_SHARD = re.compile(r"shard-[0-9]+\.bin")
HEX64 = re.compile(r"[0-9a-f]{64}")
ENV_KEYS = ("OPCDN_R2_ACCOUNT_ID", "OPCDN_R2_ACCESS_KEY_ID", "OPCDN_R2_SECRET_ACCESS_KEY", "OPCDN_BUCKET", "OPCDN_PUBLIC_BASE")


class Refused(Exception):
    """A guard refused the run; nothing has been uploaded when this is raised before the first put."""


# ---------------------------------------------------------------------------- environment

def load_env_file(path: Path) -> None:
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip().removeprefix("export ").strip()
        if key.startswith("OPCDN_"):
            os.environ[key] = value.strip().strip('"').strip("'")


@dataclass
class Target:
    account: str
    key_id: str
    secret: str
    bucket: str
    public_base: str


def target_from_env(env: dict[str, str] | None = None, need_secrets: bool = True) -> Target:
    env = dict(os.environ) if env is None else env
    wanted = ENV_KEYS if need_secrets else ("OPCDN_PUBLIC_BASE",)
    missing = [k for k in wanted if not env.get(k)]
    if missing:
        raise Refused(f"missing environment: {', '.join(missing)} (README.md, 'Credentials')")
    t = Target(
        account=env.get("OPCDN_R2_ACCOUNT_ID", ""),
        key_id=env.get("OPCDN_R2_ACCESS_KEY_ID", ""),
        secret=env.get("OPCDN_R2_SECRET_ACCESS_KEY", ""),
        bucket=env.get("OPCDN_BUCKET", ""),
        public_base=env["OPCDN_PUBLIC_BASE"].rstrip("/"),
    )
    check_target(t, env)
    if need_secrets:
        problems = credential_problems(t)
        if problems:
            raise Refused("credentials in the wrong format (values not shown):\n  " + "\n  ".join(problems))
    return t


def credential_problems(t: Target) -> list[str]:
    """Format checks that never echo a value: a wrong account id builds a hostname Cloudflare has
    no certificate for, which surfaces as an opaque TLS handshake failure."""
    import re

    def shape(v: str) -> str:
        return f"{len(v)} characters" + (", contains spaces or quotes" if re.search(r"[\s'\"]", v) else "")

    out = []
    if not re.fullmatch(r"[0-9a-f]{32}", t.account):
        hint = ""
        if "cloudflarestorage" in t.account or "://" in t.account:
            hint = " It looks like the endpoint URL: keep only the 32-character part before .r2.cloudflarestorage.com."
        out.append(f"OPCDN_R2_ACCOUNT_ID should be 32 lowercase hex characters (the id in dash.cloudflare.com/<id>/…); "
                   f"it has {shape(t.account)}.{hint}")
    if not re.fullmatch(r"[0-9a-f]{32}", t.key_id):
        out.append(f"OPCDN_R2_ACCESS_KEY_ID should be the token's 32-character Access Key ID; it has {shape(t.key_id)}")
    if not re.fullmatch(r"[0-9a-f]{64}", t.secret):
        out.append(f"OPCDN_R2_SECRET_ACCESS_KEY should be the token's 64-character Secret Access Key (not the "
                   f"'Token value'); it has {shape(t.secret)}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,61}[a-z0-9]", t.bucket):
        out.append(f"OPCDN_BUCKET should be the bucket's name only (lowercase letters, digits, hyphens); it has {shape(t.bucket)}")
    return out


def check_target(t: Target, env: dict[str, str]) -> None:
    """The decoupling guard: this tool must never touch another project's account, bucket or domain
    (the R2_* credentials of another project, if present in the environment; FORBIDDEN_WORDS)."""
    if t.account and env.get("R2_ACCOUNT_ID") and t.account == env["R2_ACCOUNT_ID"]:
        raise Refused("OPCDN_R2_ACCOUNT_ID equals the environment's R2_ACCOUNT_ID (another project's): this tool only publishes to the project's own account")
    if t.key_id and env.get("R2_ACCESS_KEY_ID") and t.key_id == env["R2_ACCESS_KEY_ID"]:
        raise Refused("OPCDN_R2_ACCESS_KEY_ID equals the environment's R2_ACCESS_KEY_ID (another project's)")
    for label, value in (("OPCDN_BUCKET", t.bucket), ("OPCDN_PUBLIC_BASE", t.public_base)):
        if any(w in value.lower() for w in FORBIDDEN_WORDS):
            raise Refused(f"{label} names another project ({value!r}); this CDN is a separate service")
    if not t.public_base.startswith("https://"):
        raise Refused("OPCDN_PUBLIC_BASE must be an https:// URL")


# ---------------------------------------------------------------------------- catalog and files

def catalog_art_paths(catalog: object) -> tuple[dict[str, list[str]], int]:
    """Map art path -> card ids, and count art-less cards. Accepts a list of entries, or an
    object whose `cards` is a list or an id-keyed object."""
    if isinstance(catalog, dict) and "cards" in catalog:
        catalog = catalog["cards"]
    if isinstance(catalog, dict):
        entries = [(k, v) for k, v in catalog.items()]
    elif isinstance(catalog, list):
        entries = [(None, v) for v in catalog]
    else:
        raise Refused("catalog: expected a list of entries or an object with `cards`")
    paths: dict[str, list[str]] = {}
    artless = 0
    for key, entry in entries:
        if not isinstance(entry, dict):
            raise Refused(f"catalog: entry {key!r} is not an object")
        card_id = entry.get("id") or entry.get("cardId") or key
        if not isinstance(card_id, str) or not card_id:
            raise Refused(f"catalog: entry without an id: {json.dumps(entry)[:120]}")
        if "art" not in entry:
            raise Refused(f"catalog: {card_id} has no `art` field (null means no art)")
        art = entry["art"]
        if art is None:
            artless += 1
            continue
        check_art_path(art, card_id)
        paths.setdefault(art, []).append(card_id)
    return paths, artless


def check_art_path(art: object, card_id: str) -> None:
    if not isinstance(art, str) or not art:
        raise Refused(f"catalog: {card_id} art is not a non-empty string")
    p = PurePosixPath(art)
    if art.startswith("/") or "\\" in art or any(part in ("", ".", "..") for part in art.split("/")):
        raise Refused(f"catalog: {card_id} art path {art!r} is not a clean relative path")
    if p.suffix.lower() not in CONTENT_TYPES:
        raise Refused(f"catalog: {card_id} art {art!r} is not jpg/png/webp")


def sniff_type(data: bytes) -> Optional[str]:
    """The image's real content type from its bytes, whatever its file name says (mirrors keep
    upstream names, and a `.jpg` may hold PNG or WebP bytes). None = not an image we serve."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def head_repr(data: bytes) -> str:
    return repr(data[:16])[2:-1]


@dataclass
class LocalFile:
    path: str          # art path == key under art/
    file: Path
    sha256: str
    bytes: int
    content_type: str  # from the bytes, not the name


def scan_images(paths: dict[str, list[str]], images: Path) -> list[LocalFile]:
    root = images.resolve()
    problems: list[str] = []
    out: list[LocalFile] = []
    for art in sorted(paths):
        f = (root / art).resolve()
        if root not in f.parents:
            problems.append(f"{art}: resolves outside --images")
            continue
        if not f.is_file():
            problems.append(f"{art}: missing (cards {', '.join(paths[art][:3])})")
            continue
        data = f.read_bytes()
        if len(data) > MAX_IMAGE_BYTES:
            problems.append(f"{art}: {len(data)} bytes, over {MAX_IMAGE_BYTES}")
            continue
        ctype = sniff_type(data)
        if ctype is None:
            problems.append(f"{art}: not a JPEG/PNG/WebP image (starts {head_repr(data)})")
            continue
        out.append(LocalFile(art, f, hashlib.sha256(data).hexdigest(), len(data), ctype))
    if problems:
        shown = "\n  ".join(problems[:20])
        more = f"\n  … and {len(problems) - 20} more" if len(problems) > 20 else ""
        raise Refused(f"{len(problems)} image problem(s):\n  {shown}{more}")
    return out


# ---------------------------------------------------------------------------- config.json

def validate_config(cfg: object, public_base: Optional[str], warnings: Optional[list[str]] = None) -> list[str]:
    """Errors against SETTINGS.md (schema 1). `public_base`, when given, must host `primary`.
    Problems that do not stop a publish (the obsolete `cardLink`) go to `warnings` when given."""
    errs: list[str] = []
    warn = warnings if warnings is not None else []
    if not isinstance(cfg, dict):
        return ["config: not a JSON object"]
    if cfg.get("schemaVersion") != 1 or isinstance(cfg.get("schemaVersion"), bool):
        errs.append("config: schemaVersion must be exactly 1")
    if not isinstance(cfg.get("namesOnly"), bool):
        errs.append("config: namesOnly must be true or false")
    if not isinstance(cfg.get("updatedAt"), str):
        errs.append("config: updatedAt must be an ISO-8601 string")

    def check_template(label: str, tpl: object, into: Optional[list[str]] = None) -> None:
        out = errs if into is None else into
        # Another project's address is refused whatever its scheme or case (checked first, so an
        # http:// or HTTPS:// link to it is not merely "not https").
        if isinstance(tpl, str) and any(w in tpl.lower() for w in FORBIDDEN_WORDS):
            out.append(f"config: {label} points at another project ({tpl})")
            return
        if not isinstance(tpl, str) or not tpl.startswith("https://"):
            out.append(f"config: {label} must be an https:// template")
            return
        rest = tpl
        for ph in PLACEHOLDERS:
            rest = rest.replace(ph, "")
        if "{" in rest or "}" in rest:
            out.append(f"config: {label} has an unknown placeholder ({tpl})")

    def check_source(label: str, src: object) -> None:
        if not isinstance(src, dict) or not isinstance(src.get("id"), str) or not src.get("id"):
            errs.append(f"config: {label} must be {{id, template}}")
            return
        check_template(f"{label}.template", src.get("template"))

    if "primary" not in cfg:
        errs.append("config: primary is required (null skips our CDN)")
    elif cfg["primary"] is not None:
        check_source("primary", cfg["primary"])
        tpl = cfg["primary"].get("template") if isinstance(cfg["primary"], dict) else None
        if isinstance(tpl, str) and "{sourceFile}" in tpl:
            errs.append("config: primary.template cannot use {sourceFile} (our CDN is keyed by {art})")
        if public_base and isinstance(tpl, str) and not tpl.startswith(public_base.rstrip("/") + "/" + ART_PREFIX):
            errs.append(f"config: primary.template must start with {public_base.rstrip('/')}/{ART_PREFIX} (OPCDN_PUBLIC_BASE)")
    fallbacks = cfg.get("fallbacks")
    if not isinstance(fallbacks, list):
        errs.append("config: fallbacks must be an array (may be empty)")
    else:
        for i, src in enumerate(fallbacks):
            check_source(f"fallbacks[{i}]", src)
    if "geometric" in cfg and cfg["geometric"] is not None and not isinstance(cfg["geometric"], bool):
        errs.append("config: geometric must be true, false or null (or absent)")
    # cardLink is obsolete (extensions 0.1.0+ ignore it; earlier development builds required a
    # template or null), so it is only warned about; pointing at another project still refuses.
    if "cardLink" not in cfg:
        warn.append("config: cardLink is absent; 0.1.0+ ignore it, earlier development builds refuse the file without it")
    elif cfg["cardLink"] is not None:
        link_errs: list[str] = []
        check_template("cardLink", cfg["cardLink"], link_errs)
        for e in link_errs:
            (errs if "another project" in e else warn).append(e)
    return errs


def load_config(path: Path, public_base: Optional[str]) -> bytes:
    raw = path.read_bytes()
    try:
        cfg = json.loads(raw)
    except json.JSONDecodeError as e:
        raise Refused(f"config: {path} is not JSON ({e})")
    warnings: list[str] = []
    errs = validate_config(cfg, public_base, warnings)
    if errs:
        raise Refused("\n".join(errs))
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    return raw


# ---------------------------------------------------------------------------- plan

@dataclass
class Plan:
    new: list[LocalFile]
    changed: list[LocalFile]
    unchanged: int
    live_only: int          # paths on the CDN no longer in the catalog (kept: uploads are additive)
    artless: int
    cards: int
    index: dict             # the merged index to write after the uploads
    mismatched: dict = None  # "<.ext> holding <type>" -> count


def make_plan(files: list[LocalFile], live_index: dict, artless: int, cards: int) -> Plan:
    live = live_index.get("files", {}) if isinstance(live_index, dict) else {}
    new, changed, unchanged = [], [], 0
    for f in files:
        rec = live.get(f.path)
        if rec is None:
            new.append(f)
        elif rec.get("sha256") != f.sha256:
            changed.append(f)
        else:
            unchanged += 1
    local_paths = {f.path for f in files}
    merged = dict(live)
    for f in files:
        merged[f.path] = {"sha256": f.sha256, "bytes": f.bytes, "contentType": f.content_type}
    index = {"schemaVersion": 1, "updatedAt": utc_now(), "files": dict(sorted(merged.items()))}
    mismatched: dict[str, int] = {}
    for f in files:
        if CONTENT_TYPES[f.file.suffix.lower()] != f.content_type:
            k = f"{f.file.suffix.lower()} holding {f.content_type}"
            mismatched[k] = mismatched.get(k, 0) + 1
    return Plan(new, changed, unchanged, len(set(live) - local_paths), artless, cards, index, mismatched)


def print_plan(plan: Plan, config: Optional[bytes]) -> None:
    mb = sum(f.bytes for f in plan.new + plan.changed) / 1e6
    print(f"catalog: {plan.cards} cards with art, {plan.artless} without (nothing to host)")
    print(f"images: {len(plan.new)} new, {len(plan.changed)} changed, {plan.unchanged} unchanged ({mb:.1f} MB to upload)")
    if plan.changed:
        print("  changed: " + ", ".join(f.path for f in plan.changed[:15]) + (" …" if len(plan.changed) > 15 else ""))
        print("  (a changed image reaches viewers within a day, or at once after a Cloudflare purge)")
    if plan.live_only:
        print(f"note: {plan.live_only} path(s) on the CDN are no longer in the catalog; they are kept")
    if plan.mismatched:
        kinds = ", ".join(f"{n} {k}" for k, n in sorted(plan.mismatched.items()))
        print(f"note: file name and bytes disagree for {sum(plan.mismatched.values())} image(s) ({kinds});"
              " served with the type of the bytes")
    print(f"index: {INDEX_KEY} ({len(plan.index['files'])} paths)")
    print(f"config: {'config.json, uploaded last' if config is not None else 'not uploaded (no --config)'}")


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# ---------------------------------------------------------------------------- R2

def r2_client(t: Target):
    import boto3  # lazily: plan --offline, verify and selftest need no boto3

    return boto3.client(
        "s3",
        endpoint_url=f"https://{t.account}.r2.cloudflarestorage.com",
        aws_access_key_id=t.key_id,
        aws_secret_access_key=t.secret,
        region_name="auto",
    )


def read_live_index(s3, bucket: str) -> dict:
    try:
        body = s3.get_object(Bucket=bucket, Key=INDEX_KEY)["Body"].read()
    except Exception as e:  # botocore's NoSuchKey; anything else is a real error
        code = getattr(e, "response", {}).get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404"):
            return {}
        raise
    idx = json.loads(body)
    if not isinstance(idx, dict) or idx.get("schemaVersion") != 1 or not isinstance(idx.get("files"), dict):
        raise Refused(f"live {INDEX_KEY} is malformed; refusing to merge into it")
    return idx


def execute(s3, bucket: str, plan: Optional[Plan], config: Optional[bytes], workers: int = 8,
            log: Callable[[str], None] = print) -> int:
    """Images, then the index (of what actually landed), then config.json. Returns failures.
    `plan` None publishes config.json alone."""
    if plan is None:
        plan = Plan([], [], 0, 0, 0, 0, {})
    todo = plan.new + plan.changed
    failed: list[str] = []

    def put(f: LocalFile) -> None:
        s3.put_object(Bucket=bucket, Key=ART_PREFIX + f.path, Body=f.file.read_bytes(),
                      ContentType=f.content_type, CacheControl=ART_CACHE)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(put, f): f for f in todo}
        for n, fut in enumerate(as_completed(futures), 1):
            f = futures[fut]
            try:
                fut.result()
            except Exception as e:
                failed.append(f.path)
                log(f"FAILED {f.path}: {e}")
            if n % 250 == 0 or n == len(todo):
                log(f"images: {n}/{len(todo)}")
    for path in failed:  # the index records only what is really on the CDN: a re-run retries the rest
        plan.index["files"].pop(path, None)
    if plan.index:
        s3.put_object(Bucket=bucket, Key=INDEX_KEY, Body=json.dumps(plan.index, indent=1).encode(),
                      ContentType="application/json", CacheControl=INDEX_CACHE)
        log(f"index: {INDEX_KEY} written ({len(plan.index['files'])} paths)")
    if failed:
        log(f"{len(failed)} upload(s) failed; config.json NOT written. Re-run to retry.")
        return len(failed)
    if config is not None:
        s3.put_object(Bucket=bucket, Key=CONFIG_KEY, Body=config,
                      ContentType="application/json", CacheControl=CONFIG_CACHE)
        log("config.json written")
    return 0


# ---------------------------------------------------------------------------- verify (public, read-only)

_SSL_CONTEXT = None


def ssl_context():
    """Trust roots that do not depend on how Python was installed: python.org's macOS builds
    ship with an empty store until "Install Certificates.command" is run. Prefer certifi, then
    the bundle botocore ships (boto3 is installed for publishing), then the system default."""
    global _SSL_CONTEXT
    if _SSL_CONTEXT is None:
        import ssl

        cafile = None
        try:
            import certifi
            cafile = certifi.where()
        except ImportError:
            try:
                from botocore.httpsession import DEFAULT_CA_BUNDLE
                cafile = DEFAULT_CA_BUNDLE if os.path.exists(DEFAULT_CA_BUNDLE) else None
            except ImportError:
                pass
        _SSL_CONTEXT = ssl.create_default_context(cafile=cafile)
    return _SSL_CONTEXT


def http_get(url: str, origin: Optional[str] = None) -> tuple[int, dict, bytes]:
    headers = {"User-Agent": USER_AGENT}
    if origin:
        headers["Origin"] = origin
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ssl_context()) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, b""
    except (urllib.error.URLError, OSError) as e:  # DNS, TLS, refused: no HTTP status at all
        reason = getattr(e, "reason", e)
        return 0, {"x-error": f"{type(reason).__name__}: {reason}"}, b""


def nel_problem(h: dict) -> Optional[str]:
    """Cloudflare's Network Error Logging makes every viewer's browser send reports to a third
    party (a.nel.cloudflare.com). The zone must not send `NEL` or `Report-To` (README, setup)."""
    found = [name for name in ("nel", "report-to") if name in h]
    return f"sends {' and '.join(n.upper() if n == 'nel' else 'Report-To' for n in found)} (turn off Network Error Logging for the zone)" if found else None


def verify(public_base: str, samples: int, get=http_get) -> int:
    bad = 0

    def fail(msg: str) -> None:
        nonlocal bad
        bad += 1
        print(f"FAIL {msg}")

    bust = f"cb={random.getrandbits(32):x}"  # never leave a cached 404 under a real URL
    status, h, body = get(f"{public_base}/{CONFIG_KEY}?{bust}", origin="https://www.youtube.com")
    if status == 0:
        host = urllib.parse.urlsplit(public_base).hostname
        err = h.get("x-error", "")
        if "gaierror" in err:
            hint = (f"Is the bucket's custom domain connected and Active (R2 → bucket → Settings → Custom Domains), "
                    f"and does `dig +short {host}` return addresses? A Mac may cache 'no such host' for up to "
                    f"30 minutes: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder")
        elif "CERTIFICATE" in err.upper():
            hint = "This Python trusts no certificate authority: .venv/bin/pip install certifi, then re-run."
        else:
            hint = "Check the network (VPN, firewall) and re-run."
        fail(f"cannot reach {host} ({err}). {hint}")
        print("verify: 1 failure(s)")
        return bad
    if status != 200:
        fail(f"config.json: HTTP {status}")
    else:
        try:
            errs = validate_config(json.loads(body), public_base)
        except json.JSONDecodeError:
            errs = ["config: not JSON"]
        for e in errs:
            fail(e)
        if "application/json" not in h.get("content-type", ""):
            fail(f"config.json content-type {h.get('content-type')!r}")
        if h.get("cache-control") != CONFIG_CACHE:
            fail(f"config.json cache-control {h.get('cache-control')!r}, want {CONFIG_CACHE!r}")
        if h.get("access-control-allow-origin") not in ("*", "https://www.youtube.com"):
            fail("config.json: no CORS header for a youtube.com origin (bucket CORS policy, README step 4)")
        if nel_problem(h):
            fail(f"config.json: {nel_problem(h)}")
        if not errs:
            cfg = json.loads(body)
            print(f"ok   config.json: namesOnly={cfg['namesOnly']}, primary={'on' if cfg['primary'] else 'off'}, {len(cfg['fallbacks'])} fallback(s)")

    status, _, body = get(f"{public_base}/{INDEX_KEY}?{bust}")
    if status != 200:
        fail(f"{INDEX_KEY}: HTTP {status}")
        return bad
    files = json.loads(body).get("files", {})
    print(f"ok   {INDEX_KEY}: {len(files)} paths")
    for path in random.sample(sorted(files), min(samples, len(files))):
        url = f"{public_base}/{ART_PREFIX}{urllib.parse.quote(path)}?{bust}"
        status, h, data = get(url)
        want_type = files[path].get("contentType") or CONTENT_TYPES[PurePosixPath(path).suffix.lower()]
        if status != 200:
            fail(f"{path}: HTTP {status}")
        elif hashlib.sha256(data).hexdigest() != files[path]["sha256"]:
            fail(f"{path}: sha256 differs from the index")
        elif h.get("content-type") != want_type:
            fail(f"{path}: content-type {h.get('content-type')!r}, want {want_type}")
        elif h.get("cache-control") != ART_CACHE:
            fail(f"{path}: cache-control {h.get('cache-control')!r}, want {ART_CACHE!r}")
        elif nel_problem(h):
            fail(f"{path}: {nel_problem(h)}")
        else:
            print(f"ok   {path}")
    print("verify: " + ("all checks passed" if not bad else f"{bad} failure(s)"))
    return bad


# ---------------------------------------------------------------------------- CLI

# ---------------------------------------------------------------------------- the geometric index

@dataclass
class GeoFile:
    name: str           # file name in the folder (manifest.json, shard-N.bin)
    data: bytes
    sha256: str
    content_type: str


def geo_plan(folder: Path, expect_sha256: str) -> tuple[str, list[GeoFile]]:
    """The packed index of `cardvision pack-features` in `folder`: its manifest must have the
    SHA-256 the extension pins (`expect_sha256`), and every shard the manifest names must be
    present with its SHA-256. Returns the CDN folder, `vision/geo/<first 16 hex of the source
    index's sha256>/`, and the files to upload, shards first and the manifest last."""
    if not HEX64.fullmatch(expect_sha256 or ""):
        raise Refused("--expect-sha256 must be 64 lowercase hex digits (the manifest's SHA-256 the extension pins)")
    mpath = folder / "manifest.json"
    if not mpath.is_file():
        raise Refused(f"{mpath}: missing")
    mbytes = mpath.read_bytes()
    msha = hashlib.sha256(mbytes).hexdigest()
    if msha != expect_sha256:
        raise Refused(f"manifest.json has SHA-256 {msha}, not the expected {expect_sha256}")
    try:
        m = json.loads(mbytes)
    except json.JSONDecodeError as e:
        raise Refused(f"manifest.json is not JSON ({e})")
    if not isinstance(m, dict) or m.get("schemaVersion") != 1 or m.get("kind") != "geometric-index-packed":
        raise Refused("manifest.json is not a packed geometric index (schemaVersion 1, kind geometric-index-packed)")
    source = (m.get("source") or {}).get("sha256") if isinstance(m.get("source"), dict) else None
    if not isinstance(source, str) or not HEX64.fullmatch(source):
        raise Refused("manifest.json: source.sha256 must be 64 lowercase hex digits")
    shards = m.get("shards")
    if not isinstance(shards, list) or not shards:
        raise Refused("manifest.json: shards must be a non-empty list")
    files: list[GeoFile] = []
    seen: set[str] = set()
    for i, sh in enumerate(shards):
        name = sh.get("path") if isinstance(sh, dict) else None
        sha = sh.get("sha256") if isinstance(sh, dict) else None
        if not isinstance(name, str) or not GEO_SHARD.fullmatch(name) or name in seen:
            raise Refused(f"manifest.json: shards[{i}].path must be a distinct shard-N.bin name")
        if not isinstance(sha, str) or not HEX64.fullmatch(sha):
            raise Refused(f"manifest.json: shards[{i}].sha256 must be 64 lowercase hex digits")
        seen.add(name)
        p = folder / name
        if not p.is_file():
            raise Refused(f"{p}: missing")
        data = p.read_bytes()
        got = hashlib.sha256(data).hexdigest()
        if got != sha:
            raise Refused(f"{name}: SHA-256 {got}, the manifest says {sha}")
        files.append(GeoFile(name, data, sha, "application/octet-stream"))
    files.append(GeoFile("manifest.json", mbytes, msha, "application/json"))
    return f"{GEO_PREFIX}{source[:16]}/", files


def _remote(s3, bucket: str, key: str) -> Optional[dict]:
    """HEAD of an object, or None when there is none."""
    try:
        return s3.head_object(Bucket=bucket, Key=key)
    except Exception as e:  # botocore's ClientError 404; anything else is a real error
        code = str(getattr(e, "response", {}).get("Error", {}).get("Code", ""))
        if code in ("404", "NoSuchKey", "NotFound"):
            return None
        raise


def _remote_sha(s3, bucket: str, key: str, head: dict) -> str:
    """The object's SHA-256: from the metadata this tool writes, else by reading it."""
    meta = {k.lower(): v for k, v in (head.get("Metadata") or {}).items()}
    if HEX64.fullmatch(meta.get("sha256", "")):
        return meta["sha256"]
    return hashlib.sha256(s3.get_object(Bucket=bucket, Key=key)["Body"].read()).hexdigest()


def _metadata_problems(head: dict, f: GeoFile) -> list[str]:
    out = []
    if head.get("ContentType") != f.content_type:
        out.append(f"content-type {head.get('ContentType')!r}, want {f.content_type!r}")
    if head.get("CacheControl") != GEO_CACHE:
        out.append(f"cache-control {head.get('CacheControl')!r}, want {GEO_CACHE!r}")
    return out


def _check(s3, bucket: str, key: str, f: GeoFile) -> Optional[str]:
    """Why the object at `key` is not exactly `f` (bytes, type, caching), or None."""
    head = _remote(s3, bucket, key)
    if head is None:
        return "missing"
    if head.get("ContentLength") != len(f.data) or _remote_sha(s3, bucket, key, head) != f.sha256:
        return "other bytes"
    problems = _metadata_problems(head, f)
    return "; ".join(problems) if problems else None


def publish_geo(s3, bucket: str, folder: str, files: list[GeoFile], dry_run: bool = False,
                fix_metadata: bool = False, log: Callable[[str], None] = print) -> int:
    """Upload the index under `folder`, shards first, then the manifest only once every shard is
    checked (size, SHA-256, Content-Type, Cache-Control). Nothing is ever overwritten with other
    bytes: such an object refuses the run before anything is uploaded. An object with the same
    bytes but the wrong Content-Type or Cache-Control refuses it too, unless `fix_metadata`,
    which rewrites its metadata in place (a copy onto itself; the bytes do not change). Returns
    the number of failures (0: all published and checked)."""
    todo: list[GeoFile] = []
    to_fix: list[GeoFile] = []
    wrong_meta: list[str] = []
    for f in files:
        key = folder + f.name
        head = _remote(s3, bucket, key)
        if head is None:
            todo.append(f)
            continue
        if head.get("ContentLength") != len(f.data) or _remote_sha(s3, bucket, key, head) != f.sha256:
            raise Refused(f"{key} is already on the CDN with other bytes; an index folder is never overwritten")
        problems = _metadata_problems(head, f)
        if problems:
            wrong_meta.append(f"{key}: {'; '.join(problems)}")
            to_fix.append(f)
        else:
            log(f"same  {key} (already there)")
    if wrong_meta and not fix_metadata:
        raise Refused("already on the CDN with the right bytes but wrong metadata (re-run with --fix-metadata to "
                      "rewrite the metadata only): " + " | ".join(wrong_meta))
    for f in todo:
        log(f"{'would upload' if dry_run else 'upload'} {folder + f.name} ({len(f.data)} bytes)")
    for f in to_fix:
        log(f"{'would fix metadata of' if dry_run else 'fix metadata of'} {folder + f.name}")
    if dry_run:
        log(f"dry run: {len(todo)} to upload, {len(to_fix)} to fix, {len(files) - len(todo) - len(to_fix)} already there; nothing changed")
        return 0

    def put(f: GeoFile) -> Optional[str]:
        key = folder + f.name
        try:
            if f in to_fix:
                s3.copy_object(Bucket=bucket, Key=key, CopySource={"Bucket": bucket, "Key": key}, MetadataDirective="REPLACE",
                               ContentType=f.content_type, CacheControl=GEO_CACHE, Metadata={"sha256": f.sha256})
            elif f in todo:
                s3.put_object(Bucket=bucket, Key=key, Body=f.data, ContentType=f.content_type,
                              CacheControl=GEO_CACHE, Metadata={"sha256": f.sha256})
        except Exception as e:
            return f"upload failed: {e}"
        return _check(s3, bucket, key, f)

    shards = [f for f in files if f.name != "manifest.json"]
    manifest = [f for f in files if f.name == "manifest.json"]
    bad = 0
    for f in shards:
        problem = put(f)
        if problem:
            bad += 1
            log(f"FAILED {folder + f.name}: {problem}")
        else:
            log(f"ok    {folder + f.name}")
    if bad:
        # A manifest is never live before every shard it names is there and right.
        log(f"{bad} shard(s) failed; manifest.json NOT uploaded. Re-run to retry.")
        return bad
    for f in manifest:
        problem = put(f)
        if problem:
            bad += 1
            log(f"FAILED {folder + f.name}: {problem}")
        else:
            log(f"ok    {folder + f.name}")
    return bad


def verify_geo(public_base: str, folder: str, files: list[GeoFile], get=http_get) -> int:
    """Read the index back over HTTPS: every file's bytes, its Cache-Control, and the CORS header
    an extension's request gets."""
    bad = 0
    for f in files:
        url = f"{public_base}/{folder}{f.name}"
        status, h, body = get(url, origin="chrome-extension://kenbunshoku")
        problems = []
        if status != 200:
            problems.append(f"HTTP {status} {h.get('x-error', '')}".strip())
        else:
            if hashlib.sha256(body).hexdigest() != f.sha256:
                problems.append("bytes differ from the local file")
            if h.get("cache-control") != GEO_CACHE:
                problems.append(f"cache-control {h.get('cache-control')!r}, want {GEO_CACHE!r}")
            if (h.get("content-type") or "").split(";")[0].strip() != f.content_type:
                problems.append(f"content-type {h.get('content-type')!r}, want {f.content_type!r}")
            if nel_problem(h):
                problems.append(nel_problem(h))
            if h.get("access-control-allow-origin") not in ("*", "chrome-extension://kenbunshoku"):
                problems.append("no CORS header for an extension origin")
        if problems:
            bad += 1
            print(f"FAIL {url}: {'; '.join(problems)}")
        else:
            print(f"ok   {url} ({len(body)} bytes)")
    return bad


def build(args, public_base: Optional[str]) -> tuple[list[LocalFile], int, int, Optional[bytes]]:
    config = load_config(Path(args.config), public_base) if args.config else None
    if not args.catalog:
        return [], 0, 0, config
    if not args.images:
        raise Refused("--catalog needs --images")
    paths, artless = catalog_art_paths(json.loads(Path(args.catalog).read_text()))
    files = scan_images(paths, Path(args.images))
    return files, artless, sum(len(v) for v in paths.values()), config


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=("plan", "publish", "verify", "publish-geo", "verify-geo", "selftest"))
    ap.add_argument("--catalog", help="catalog JSON (entries with an id and an `art` path or null)")
    ap.add_argument("--images", help="directory the `art` paths are relative to")
    ap.add_argument("--config", help="config.json to publish (SETTINGS.md); uploaded last")
    ap.add_argument("--env-file", help="read OPCDN_* entries from this file")
    ap.add_argument("--offline", action="store_true", help="plan: no credentials, treat the CDN as empty")
    ap.add_argument("--dry-run", action="store_true", help="publish: read the live index, print the plan, upload nothing")
    ap.add_argument("--samples", type=int, default=8, help="verify: images to fetch")
    ap.add_argument("--dir", help="publish-geo/verify-geo: the packed geometric index (manifest.json, shard-N.bin)")
    ap.add_argument("--expect-sha256", help="publish-geo/verify-geo: the manifest's SHA-256 the extension pins")
    ap.add_argument("--fix-metadata", action="store_true",
                    help="publish-geo: rewrite the Content-Type/Cache-Control of objects already there with the right bytes (bytes never change)")
    args = ap.parse_args(argv)

    if args.command == "selftest":
        return selftest()
    if args.env_file:
        load_env_file(Path(args.env_file))
    try:
        if args.command == "verify":
            return 1 if verify(target_from_env(need_secrets=False).public_base, args.samples) else 0
        if args.command in ("publish-geo", "verify-geo"):
            if not args.dir:
                raise Refused(f"{args.command} needs --dir")
            folder, files = geo_plan(Path(args.dir), args.expect_sha256 or "")
            if args.command == "verify-geo":
                return 1 if verify_geo(target_from_env(need_secrets=False).public_base, folder, files) else 0
            t = target_from_env()
            print(f"target: bucket {t.bucket}, served at {t.public_base}; folder {folder}")
            return 1 if publish_geo(r2_client(t), t.bucket, folder, files, dry_run=args.dry_run, fix_metadata=args.fix_metadata) else 0
        if args.command == "plan" and args.offline:
            base = os.environ.get("OPCDN_PUBLIC_BASE")
            files, artless, cards, config = build(args, base.rstrip("/") if base else None)
            print_plan(make_plan(files, {}, artless, cards), config)
            return 0
        if not args.catalog and not args.config:
            raise Refused("nothing to do: give --catalog/--images and/or --config")
        t = target_from_env()
        files, artless, cards, config = build(args, t.public_base)
        s3 = r2_client(t)
        live = read_live_index(s3, t.bucket)
        plan = make_plan(files, live, artless, cards) if args.catalog else None
        print(f"target: bucket {t.bucket}, served at {t.public_base}")
        if plan:
            print_plan(plan, config)
        else:
            print("config: config.json only")
        if args.command == "plan" or args.dry_run:
            return 0
        return 1 if execute(s3, t.bucket, plan, config) else 0
    except Refused as e:
        print(f"REFUSED: {e}", file=sys.stderr)
        return 3


# ---------------------------------------------------------------------------- selftest

def selftest() -> int:
    import tempfile

    def refused(fn) -> bool:
        try:
            fn()
        except Refused:
            return True
        return False

    jpg = b"\xff\xd8\xff\xe0" + b"x" * 100
    png = b"\x89PNG\r\n\x1a\n" + b"y" * 100
    base = "https://cdn.example.org"
    good_cfg = json.loads(Path(__file__).with_name("config.example.json").read_text())

    # target guards
    acct, kid, sec = "a" * 32, "b" * 32, "c" * 64
    env = {"OPCDN_R2_ACCOUNT_ID": acct, "OPCDN_R2_ACCESS_KEY_ID": kid, "OPCDN_R2_SECRET_ACCESS_KEY": sec,
           "OPCDN_PUBLIC_BASE": base, "OPCDN_BUCKET": "op-art"}
    assert target_from_env(env).public_base == base
    assert refused(lambda: target_from_env(env | {"R2_ACCOUNT_ID": acct})), "same account as another project"
    for k, v in (("OPCDN_R2_ACCOUNT_ID", f"https://{acct}.r2.cloudflarestorage.com"),
                 ("OPCDN_R2_ACCOUNT_ID", acct + " "), ("OPCDN_R2_ACCOUNT_ID", acct.upper()),
                 ("OPCDN_R2_ACCESS_KEY_ID", "x" * 40), ("OPCDN_R2_SECRET_ACCESS_KEY", "tokenvalue"),
                 ("OPCDN_BUCKET", "s3://op-art")):
        assert refused(lambda: target_from_env(env | {k: v})), (k, v)
    try:
        target_from_env(env | {"OPCDN_R2_SECRET_ACCESS_KEY": "s3cr3t-value"})
    except Refused as e:
        assert "s3cr3t" not in str(e), "never echo a credential"
    assert refused(lambda: target_from_env(env | {"OPCDN_BUCKET": "riftsight-assets"}))
    assert refused(lambda: target_from_env(env | {"OPCDN_PUBLIC_BASE": "https://assets.riftsight.gg"}))
    assert refused(lambda: target_from_env(env | {"OPCDN_PUBLIC_BASE": "http://cdn.example.org"}))
    assert refused(lambda: target_from_env({"OPCDN_PUBLIC_BASE": base}))
    assert target_from_env({"OPCDN_PUBLIC_BASE": base}, need_secrets=False)

    # catalog shapes and path rules
    for shape in ([{"id": "OP01-001", "art": "OP01-001.jpg"}, {"id": "X", "art": None}],
                  {"cards": [{"cardId": "OP01-001", "art": "OP01-001.jpg"}, {"cardId": "X", "art": None}]},
                  {"cards": {"OP01-001": {"art": "OP01-001.jpg"}, "X": {"art": None}}}):
        paths, artless = catalog_art_paths(shape)
        assert paths == {"OP01-001.jpg": ["OP01-001"]} and artless == 1, shape
    for bad in ("../x.jpg", "/x.jpg", "a//b.jpg", "x.gif", "a\\b.jpg", ""):
        assert refused(lambda b=bad: catalog_art_paths([{"id": "A", "art": b}])), bad
    assert refused(lambda: catalog_art_paths([{"id": "A"}])), "art field required"
    shared, _ = catalog_art_paths([{"id": "A", "art": "s.png"}, {"id": "B", "art": "s.png"}])
    assert shared == {"s.png": ["A", "B"]}

    # config contract
    assert validate_config(good_cfg, None) == []
    assert validate_config(good_cfg | {"cardLink": "https://x.example/?q={printedId}"}, None) == []
    good_cfg_here = good_cfg | {"primary": {"id": "cdn", "template": base + "/art/{art}"}}
    assert validate_config(good_cfg_here, base) == []
    assert validate_config(good_cfg, "https://other.example.org"), "primary must be on our base"
    for mutate in ({"schemaVersion": 2}, {"schemaVersion": True}, {"namesOnly": "no"},
                   {"fallbacks": None}, {"fallbacks": [{"id": "c", "template": "http://x/{cardId}"}]},
                   {"fallbacks": [{"id": "c", "template": "https://x/{name}"}]},
                   {"cardLink": "https://assets.riftsight.gg/{cardId}"}, {"primary": {"template": "https://x/{art}"}},
                   {"primary": {"id": "cdn", "template": "https://cdn.example.org/art/{sourceFile}"}}):
        assert validate_config(good_cfg | mutate, None), mutate
    for value in (True, False, None):
        assert validate_config(good_cfg | {"geometric": value}, None) == [], value
    for value in ("false", 0, 1, {}):
        assert validate_config(good_cfg | {"geometric": value}, None), value
    no_primary = dict(good_cfg); del no_primary["primary"]
    assert validate_config(no_primary, None), "primary required"
    assert validate_config(good_cfg | {"primary": None, "namesOnly": True, "fallbacks": [], "cardLink": None}, base) == []
    # cardLink is obsolete: absent or malformed only warns; pointing at another project still refuses
    no_link = dict(good_cfg); no_link.pop("cardLink", None)
    warned: list[str] = []
    assert validate_config(no_link, None, warned) == [] and warned, "cardLink absent: a warning, not a refusal"
    warned = []
    assert validate_config(good_cfg | {"cardLink": "http://x.example/{cardId}"}, None, warned) == [] and warned
    assert validate_config(good_cfg | {"cardLink": "https://assets.riftsight.gg/{cardId}"}, None), "another project"
    for foreign in ("http://assets.riftsight.gg/{cardId}", "HTTPS://Assets.RiftSight.gg/{cardId}"):
        warned = []
        assert validate_config(good_cfg | {"cardLink": foreign}, None, warned), f"another project, any scheme: {foreign}"

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "images"
        (root / "jp").mkdir(parents=True)
        (root / "OP01-001.jpg").write_bytes(jpg)
        (root / "jp" / "P-001.png").write_bytes(png)
        (root / "fake.png").write_bytes(b"<html>not found</html>")
        (root / "png-named.jpg").write_bytes(png)
        (Path(tmp) / "outside.jpg").write_bytes(jpg)

        paths = {"OP01-001.jpg": ["OP01-001"], "jp/P-001.png": ["P-001"]}
        files = scan_images(paths, root)
        assert [f.path for f in files] == ["OP01-001.jpg", "jp/P-001.png"]
        assert refused(lambda: scan_images({"missing.jpg": ["M"]}, root))
        assert refused(lambda: scan_images({"fake.png": ["F"]}, root)), "not an image"
        renamed = scan_images({"png-named.jpg": ["R"]}, root)
        assert renamed[0].content_type == "image/png", "type comes from the bytes"
        assert make_plan(renamed, {}, 0, 1).mismatched == {".jpg holding image/png": 1}
        s3r = []
        class Rec:
            def put_object(self, **kw): s3r.append(kw)
        execute(Rec(), "b", make_plan(renamed, {}, 0, 1), None, workers=1, log=lambda _: None)
        assert s3r[0]["Key"] == "art/png-named.jpg" and s3r[0]["ContentType"] == "image/png"
        (root / "escape.jpg").symlink_to(Path(tmp) / "outside.jpg")
        assert refused(lambda: scan_images({"escape.jpg": ["E"]}, root)), "symlink escape"

        # plan: new / changed / unchanged / live-only, merged index
        live = {"schemaVersion": 1, "files": {
            "OP01-001.jpg": {"sha256": files[0].sha256, "bytes": files[0].bytes},
            "jp/P-001.png": {"sha256": "0" * 64, "bytes": 1},
            "OLD-001.jpg": {"sha256": "1" * 64, "bytes": 1}}}
        plan = make_plan(files, live, 0, 2)
        assert (len(plan.new), len(plan.changed), plan.unchanged, plan.live_only) == (0, 1, 1, 1)
        assert "OLD-001.jpg" in plan.index["files"], "uploads are additive"
        fresh = make_plan(files, {}, 0, 2)
        assert len(fresh.new) == 2 and fresh.live_only == 0

        # execute: order, headers, failure handling
        class FakeS3:
            def __init__(self, fail_keys=()):
                self.puts, self.fail_keys = [], set(fail_keys)

            def put_object(self, *, Bucket, Key, Body, ContentType, CacheControl):
                if Key in self.fail_keys:
                    raise RuntimeError("boom")
                self.puts.append((Key, ContentType, CacheControl, Body))

        cfg_bytes = json.dumps(good_cfg_here).encode()
        s3 = FakeS3()
        assert execute(s3, "b", make_plan(files, {}, 0, 2), cfg_bytes, workers=1, log=lambda _: None) == 0
        keys = [p[0] for p in s3.puts]
        assert set(keys[:2]) == {"art/OP01-001.jpg", "art/jp/P-001.png"}
        assert keys[2:] == [INDEX_KEY, CONFIG_KEY], keys
        assert dict((p[0], (p[1], p[2])) for p in s3.puts)["art/jp/P-001.png"] == ("image/png", ART_CACHE)
        assert s3.puts[-1][2] == CONFIG_CACHE

        s3 = FakeS3(fail_keys={"art/jp/P-001.png"})
        assert execute(s3, "b", make_plan(files, {}, 0, 2), cfg_bytes, workers=1, log=lambda _: None) == 1
        keys = [p[0] for p in s3.puts]
        assert CONFIG_KEY not in keys, "no config after a failed image"
        index = json.loads(next(p[3] for p in s3.puts if p[0] == INDEX_KEY))
        assert "jp/P-001.png" not in index["files"] and "OP01-001.jpg" in index["files"]

        s3 = FakeS3()
        assert execute(s3, "b", make_plan(files, {"schemaVersion": 1, "files": {
            f.path: {"sha256": f.sha256, "bytes": f.bytes} for f in files}}, 0, 2), None,
            workers=1, log=lambda _: None) == 0
        assert [p[0] for p in s3.puts] == [INDEX_KEY], "nothing changed: only the index"

        s3 = FakeS3()
        assert execute(s3, "b", None, cfg_bytes, log=lambda _: None) == 0
        assert [p[0] for p in s3.puts] == [CONFIG_KEY], "config-only publish leaves the index alone"

        # verify against a fake public CDN
        index_body = json.dumps({"schemaVersion": 1, "files": {f.path: {"sha256": f.sha256, "bytes": f.bytes, "contentType": f.content_type} for f in files}}).encode()
        store = {
            CONFIG_KEY: (200, {"content-type": "application/json", "cache-control": CONFIG_CACHE, "access-control-allow-origin": "*"}, cfg_bytes),
            INDEX_KEY: (200, {"content-type": "application/json"}, index_body),
            "art/OP01-001.jpg": (200, {"content-type": "image/jpeg", "cache-control": ART_CACHE}, jpg),
            "art/jp/P-001.png": (200, {"content-type": "image/png", "cache-control": ART_CACHE}, png),
        }

        def fake_get(url, origin=None):
            key = urllib.parse.unquote(url[len(base) + 1:].split("?")[0])
            return store.get(key, (404, {}, b""))

        quiet = open(os.devnull, "w")
        stdout, sys.stdout = sys.stdout, quiet
        try:
            assert verify(base, 5, get=fake_get) == 0
            good_config = store[CONFIG_KEY]
            store[CONFIG_KEY] = (200, {**good_config[1], "nel": '{"report_to":"cf-nel"}', "report-to": "{}"}, cfg_bytes)
            assert verify(base, 5, get=fake_get) == 1, "NEL/Report-To on the zone"
            store[CONFIG_KEY] = good_config
            store["art/jp/P-001.png"] = (200, {"content-type": "image/png", "cache-control": ART_CACHE}, png + b"!")
            assert verify(base, 5, get=fake_get) == 1, "sha mismatch"
            store[CONFIG_KEY] = (200, {"content-type": "application/json", "cache-control": CONFIG_CACHE}, cfg_bytes)
            assert verify(base, 5, get=fake_get) == 2, "missing CORS"
            assert verify(base, 5, get=lambda url, origin=None: (0, {"x-error": "gaierror: no such host"}, b"")) == 1
        finally:
            sys.stdout = stdout
            quiet.close()

        # env file reads only OPCDN_* entries
        envf = Path(tmp) / ".env"
        envf.write_text("export OPCDN_BUCKET='op-art'\nR2_SECRET_ACCESS_KEY=nope\n# c\n")
        saved = {k: os.environ.get(k) for k in ("OPCDN_BUCKET", "R2_SECRET_ACCESS_KEY")}
        try:
            os.environ.pop("R2_SECRET_ACCESS_KEY", None)
            load_env_file(envf)
            assert os.environ["OPCDN_BUCKET"] == "op-art" and "R2_SECRET_ACCESS_KEY" not in os.environ
        finally:
            for k, v in saved.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v

    # the geometric index: plan, publish (fake R2), verify (fake HTTPS)
    class FakeS3:
        def __init__(self, corrupt: bool = False, fail_on: Optional[str] = None):
            self.objects: dict[str, dict] = {}
            self.puts: list[str] = []
            self.copies: list[str] = []
            self.corrupt = corrupt
            self.fail_on = fail_on

        def copy_object(self, Bucket, Key, CopySource, MetadataDirective, ContentType, CacheControl, Metadata):
            assert CopySource == {"Bucket": Bucket, "Key": Key} and MetadataDirective == "REPLACE"
            self.copies.append(Key)
            o = self.objects[Key]
            o.update(ContentType=ContentType, CacheControl=CacheControl, Metadata=Metadata)

        def head_object(self, Bucket, Key):
            o = self.objects.get(Key)
            if o is None:
                e = Exception("404")
                e.response = {"Error": {"Code": "404"}}
                raise e
            return {"ContentLength": len(o["Body"]), "Metadata": dict(o.get("Metadata", {})),
                    "ContentType": o.get("ContentType"), "CacheControl": o.get("CacheControl")}

        def get_object(self, Bucket, Key):
            import io
            return {"Body": io.BytesIO(self.objects[Key]["Body"])}

        def put_object(self, Bucket, Key, Body, ContentType, CacheControl, Metadata):
            if self.fail_on and Key.endswith(self.fail_on):
                raise OSError("connection reset")
            self.puts.append(Key)
            self.objects[Key] = {"Body": (Body + b"!" if self.corrupt else Body), "ContentType": ContentType,
                                 "CacheControl": CacheControl, "Metadata": Metadata}

    with tempfile.TemporaryDirectory() as tmp:
        g = Path(tmp) / "packed"
        g.mkdir()
        shard0, shard1 = b"\x01" * 64, b"\x02" * 96
        src = "cd676903704f456d" + "e" * 48
        man = {"schemaVersion": 1, "kind": "geometric-index-packed", "source": {"sha256": src},
               "shards": [{"path": "shard-0.bin", "sha256": hashlib.sha256(shard0).hexdigest(), "rows": 2},
                          {"path": "shard-1.bin", "sha256": hashlib.sha256(shard1).hexdigest(), "rows": 3}]}
        (g / "shard-0.bin").write_bytes(shard0)
        (g / "shard-1.bin").write_bytes(shard1)
        mbytes = json.dumps(man).encode()
        (g / "manifest.json").write_bytes(mbytes)
        msha = hashlib.sha256(mbytes).hexdigest()
        assert refused(lambda: geo_plan(g, "0" * 64)), "manifest sha must be the pinned one"
        assert refused(lambda: geo_plan(g, "")), "the pin is required"
        folder, gfiles = geo_plan(g, msha)
        assert folder == "vision/geo/cd676903704f456d/", folder
        assert [f.name for f in gfiles] == ["shard-0.bin", "shard-1.bin", "manifest.json"], "shards first, manifest last"
        assert [f.content_type for f in gfiles] == ["application/octet-stream"] * 2 + ["application/json"]
        quiet = lambda _m: None

        s3 = FakeS3()
        assert publish_geo(s3, "b", folder, gfiles, dry_run=True, log=quiet) == 0 and s3.puts == [], "dry run uploads nothing"
        assert publish_geo(s3, "b", folder, gfiles, log=quiet) == 0
        assert s3.puts == [folder + "shard-0.bin", folder + "shard-1.bin", folder + "manifest.json"]
        o = s3.objects[folder + "manifest.json"]
        assert o["ContentType"] == "application/json" and o["CacheControl"] == GEO_CACHE == "public, max-age=31536000, immutable"
        assert s3.objects[folder + "shard-0.bin"]["ContentType"] == "application/octet-stream"
        assert publish_geo(s3, "b", folder, gfiles, log=quiet) == 0 and len(s3.puts) == 3, "a re-run keeps what is there"
        s3.objects[folder + "shard-1.bin"]["Metadata"] = {}
        assert publish_geo(s3, "b", folder, gfiles, log=quiet) == 0 and len(s3.puts) == 3, "same bytes without metadata: read and kept"
        s3.objects[folder + "shard-1.bin"]["Body"] = b"\x03" * 96
        assert refused(lambda: publish_geo(s3, "b", folder, gfiles, log=quiet)), "never overwrite other bytes"
        assert len(s3.puts) == 3, "a conflict uploads nothing"
        corrupt = FakeS3(corrupt=True)
        assert publish_geo(corrupt, "b", folder, gfiles, log=quiet) == 2, "the HEAD check catches bad shards"
        assert folder + "manifest.json" not in corrupt.objects, "no manifest before every shard checks out"
        broken = FakeS3(fail_on="shard-1.bin")
        assert publish_geo(broken, "b", folder, gfiles, log=quiet) == 1, "a PUT that throws mid-run"
        assert folder + "manifest.json" not in broken.objects and folder + "shard-0.bin" in broken.objects
        assert publish_geo(FakeS3(), "b", folder, gfiles, log=quiet) == 0
        # The same bytes with the wrong metadata: refused, or fixed in place with --fix-metadata.
        meta = FakeS3()
        publish_geo(meta, "b", folder, gfiles, log=quiet)
        meta.objects[folder + "shard-0.bin"]["CacheControl"] = "public, max-age=60"
        meta.objects[folder + "manifest.json"]["ContentType"] = "text/plain"
        before_bytes = {k: v["Body"] for k, v in meta.objects.items()}
        assert refused(lambda: publish_geo(meta, "b", folder, gfiles, log=quiet)), "wrong metadata is reported, not kept"
        assert publish_geo(meta, "b", folder, gfiles, dry_run=True, fix_metadata=True, log=quiet) == 0 and meta.copies == []
        assert publish_geo(meta, "b", folder, gfiles, fix_metadata=True, log=quiet) == 0
        assert sorted(meta.copies) == sorted([folder + "shard-0.bin", folder + "manifest.json"]) and len(meta.puts) == 3
        assert {k: v["Body"] for k, v in meta.objects.items()} == before_bytes, "metadata fixes never change bytes"
        assert meta.objects[folder + "shard-0.bin"]["CacheControl"] == GEO_CACHE
        assert meta.objects[folder + "manifest.json"]["ContentType"] == "application/json"

        (g / "shard-1.bin").write_bytes(b"\x09" * 96)
        assert refused(lambda: geo_plan(g, msha)), "a shard that does not match the manifest"
        (g / "shard-1.bin").write_bytes(shard1)
        bad_man = json.dumps(man | {"shards": [{"path": "../shard-0.bin", "sha256": man["shards"][0]["sha256"]}]}).encode()
        (g / "manifest.json").write_bytes(bad_man)
        assert refused(lambda: geo_plan(g, hashlib.sha256(bad_man).hexdigest())), "shard names are plain"
        (g / "manifest.json").write_bytes(mbytes)

        served = {f"{base}/{folder}{f.name}": f.data for f in gfiles}

        def geo_get(url, origin=None, cache="public, max-age=31536000, immutable", cors="*", body=None, ctype=None, extra=None):
            if url not in served:
                return 404, {}, b""
            t = ctype or ("application/json" if url.endswith(".json") else "application/octet-stream")
            return 200, {"cache-control": cache, "access-control-allow-origin": cors, "content-type": t, **(extra or {})}, body if body is not None else served[url]

        import contextlib, io
        with contextlib.redirect_stdout(io.StringIO()):
            assert verify_geo(base, folder, gfiles, get=geo_get) == 0
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, cache="public, max-age=60")) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, cors="")) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, body=b"x")) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: (404, {}, b"")) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, ctype="text/plain")) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, extra={"nel": '{"report_to":"cf-nel"}'})) == 3
            assert verify_geo(base, folder, gfiles, get=lambda u, origin=None: geo_get(u, origin, extra={"report-to": "{}"})) == 3

    print("selftest: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
