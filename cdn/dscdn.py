#!/usr/bin/env python3
"""Card-art CDN: plan, publish and verify.

Runs on the maintainer's machine, where the mirrored images live; nothing image-bearing is ever
committed. Uploads to a Cloudflare R2 bucket in the project's own account, never another
project's. See README.md (setup, usage) and SETTINGS.md (the config.json contract).

  dscdn.py plan    --catalog C --images DIR [--details F] [--config F] [--offline]
  dscdn.py publish --catalog C --images DIR [--details F] [--config F] [--dry-run]
  dscdn.py publish --details F --config F     # the card details file, then config.json
  dscdn.py publish --config F                 # config.json only
  dscdn.py publish --page F                   # a page, e.g. privacy.html (scripts/privacy-page.mjs)
  dscdn.py verify  [--samples N]
  dscdn.py publish-release --release DIR --min-version X [--max-version Y] [--legal DIR] [--details F]
                   [--config F [--set-pointer]] [--sessions] [--fix-metadata] [--dry-run]
  dscdn.py verify-release-live [--candidate ID | --config-url U] [--expect-id ID] [--sessions]
  dscdn.py selftest

Credentials (environment or --env-file; only DSCDN_* entries are read):
  DSCDN_R2_ACCOUNT_ID, DSCDN_R2_ACCESS_KEY_ID, DSCDN_R2_SECRET_ACCESS_KEY,
  DSCDN_BUCKET, DSCDN_PUBLIC_BASE (e.g. https://cdn.example.org, no trailing slash)
  DSCDN_EXTENSION_IDS (verify-release-live: the store and unpacked extension ids, comma-separated)

--sessions starts both ONNX Runtime sessions of the release in Node (scripts/verify-remote-release.mjs);
use it whenever the detector or recognizer differs from the live release's. If Node cannot do it on some
machine, the fallback is the toolkit's Python check: `cardvision verify-release DIR/release.json`, then an
onnxruntime InferenceSession on each of the two .onnx files.
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
# The card details file (scripts/card-details.mjs): a versioned name, so it never changes in place.
DATA_PREFIX = "data/"
DETAILS_CACHE = "public, max-age=31536000, immutable"
DETAILS_NAME = re.compile(r"^details-([0-9a-f]{8})\.json$")
DETAILS_PATH = re.compile(r"^(?:[A-Za-z0-9_-][A-Za-z0-9._-]*/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.json$")
MAX_DETAILS_BYTES = 32 * 1024 * 1024
# Pages served from the CDN's root (the privacy policy the store listing links to): a fixed list of
# names, plain self-contained HTML, no script.
PAGE_NAMES = ("privacy.html",)
PAGE_CACHE = "public, max-age=3600"
MAX_PAGE_BYTES = 1024 * 1024
MAX_IMAGE_BYTES = 5 * 1024 * 1024
CONTENT_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
PLACEHOLDERS = ("{art}", "{file}", "{cardId}", "{printedId}")
FORBIDDEN_WORDS = ("riftsight", "riftbound", "riftatlas", "kenbunshoku", "onepiece")
USER_AGENT = "duelsight-cdn-verify/1"
ENV_KEYS = ("DSCDN_R2_ACCOUNT_ID", "DSCDN_R2_ACCESS_KEY_ID", "DSCDN_R2_SECRET_ACCESS_KEY", "DSCDN_BUCKET", "DSCDN_PUBLIC_BASE")


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
        if key.startswith("DSCDN_"):
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
    wanted = ENV_KEYS if need_secrets else ("DSCDN_PUBLIC_BASE",)
    missing = [k for k in wanted if not env.get(k)]
    if missing:
        raise Refused(f"missing environment: {', '.join(missing)} (README.md, 'Credentials')")
    t = Target(
        account=env.get("DSCDN_R2_ACCOUNT_ID", ""),
        key_id=env.get("DSCDN_R2_ACCESS_KEY_ID", ""),
        secret=env.get("DSCDN_R2_SECRET_ACCESS_KEY", ""),
        bucket=env.get("DSCDN_BUCKET", ""),
        public_base=env["DSCDN_PUBLIC_BASE"].rstrip("/"),
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
        out.append(f"DSCDN_R2_ACCOUNT_ID should be 32 lowercase hex characters (the id in dash.cloudflare.com/<id>/…); "
                   f"it has {shape(t.account)}.{hint}")
    if not re.fullmatch(r"[0-9a-f]{32}", t.key_id):
        out.append(f"DSCDN_R2_ACCESS_KEY_ID should be the token's 32-character Access Key ID; it has {shape(t.key_id)}")
    if not re.fullmatch(r"[0-9a-f]{64}", t.secret):
        out.append(f"DSCDN_R2_SECRET_ACCESS_KEY should be the token's 64-character Secret Access Key (not the "
                   f"'Token value'); it has {shape(t.secret)}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,61}[a-z0-9]", t.bucket):
        out.append(f"DSCDN_BUCKET should be the bucket's name only (lowercase letters, digits, hyphens); it has {shape(t.bucket)}")
    return out


def check_target(t: Target, env: dict[str, str]) -> None:
    """The decoupling guard: this tool must never touch another project's account, bucket or domain
    (the R2_* credentials of another project, if present in the environment; FORBIDDEN_WORDS)."""
    if t.account and env.get("R2_ACCOUNT_ID") and t.account == env["R2_ACCOUNT_ID"]:
        raise Refused("DSCDN_R2_ACCOUNT_ID equals the environment's R2_ACCOUNT_ID (another project's): this tool only publishes to the project's own account")
    if t.key_id and env.get("R2_ACCESS_KEY_ID") and t.key_id == env["R2_ACCESS_KEY_ID"]:
        raise Refused("DSCDN_R2_ACCESS_KEY_ID equals the environment's R2_ACCESS_KEY_ID (another project's)")
    for label, value in (("DSCDN_BUCKET", t.bucket), ("DSCDN_PUBLIC_BASE", t.public_base)):
        if any(w in value.lower() for w in FORBIDDEN_WORDS):
            raise Refused(f"{label} names another project ({value!r}); this CDN is a separate service")
    if not t.public_base.startswith("https://"):
        raise Refused("DSCDN_PUBLIC_BASE must be an https:// URL")


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

def validate_config(cfg: object, public_base: Optional[str]) -> list[str]:
    """Errors against SETTINGS.md (schema 1). `public_base`, when given, must host `primary`."""
    errs: list[str] = []
    if not isinstance(cfg, dict):
        return ["config: not a JSON object"]
    if cfg.get("schemaVersion") != 1 or isinstance(cfg.get("schemaVersion"), bool):
        errs.append("config: schemaVersion must be exactly 1")
    if not isinstance(cfg.get("namesOnly"), bool):
        errs.append("config: namesOnly must be true or false")
    if not isinstance(cfg.get("updatedAt"), str):
        errs.append("config: updatedAt must be an ISO-8601 string")

    def check_template(label: str, tpl: object) -> None:
        out = errs
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
        if public_base and isinstance(tpl, str) and not tpl.startswith(public_base.rstrip("/") + "/" + ART_PREFIX):
            errs.append(f"config: primary.template must start with {public_base.rstrip('/')}/{ART_PREFIX} (DSCDN_PUBLIC_BASE)")
    fallbacks = cfg.get("fallbacks")
    if not isinstance(fallbacks, list):
        errs.append("config: fallbacks must be an array (may be empty)")
    else:
        for i, src in enumerate(fallbacks):
            check_source(f"fallbacks[{i}]", src)
    details = cfg.get("details")
    if details is not None:
        # The extension ignores a malformed one; refused here so that it is never published.
        if not isinstance(details, dict) or not isinstance(details.get("path"), str) or not isinstance(details.get("sha256"), str):
            errs.append("config: details must be {path, sha256} or absent")
        else:
            path = details["path"]
            if not DETAILS_PATH.match(path) or any(part in (".", "..") for part in path.split("/")):
                errs.append(f"config: details.path {path!r} is not a clean relative path to a .json file")
            if not re.fullmatch(r"[0-9a-f]{64}", details["sha256"]):
                errs.append("config: details.sha256 must be 64 lowercase hex digits")
    errs += release_pointer_problems(cfg.get("release"))
    return errs


# ---------------------------------------------------------------------------- the card details file

@dataclass
class DetailsFile:
    key: str        # data/details-<sha8>.json
    data: bytes
    sha256: str
    cards: int


def load_details(path: Path) -> DetailsFile:
    """The card details file as scripts/card-details.mjs wrote it: a versioned name that is the
    start of its own SHA-256, and a JSON object of schema version 1 with a `cards` object."""
    m = DETAILS_NAME.match(path.name)
    if not m:
        raise Refused(f"details: {path.name} is not named details-<8 hex digits>.json (scripts/card-details.mjs)")
    data = path.read_bytes()
    if len(data) > MAX_DETAILS_BYTES:
        raise Refused(f"details: {len(data)} bytes, over {MAX_DETAILS_BYTES}")
    sha = hashlib.sha256(data).hexdigest()
    if not sha.startswith(m.group(1)):
        raise Refused(f"details: {path.name} does not match its contents (sha256 starts {sha[:8]}); rebuild it")
    try:
        doc = json.loads(data)
    except json.JSONDecodeError as e:
        raise Refused(f"details: not JSON ({e})")
    if not isinstance(doc, dict) or doc.get("schemaVersion") != 1 or isinstance(doc.get("schemaVersion"), bool) or not isinstance(doc.get("cards"), dict):
        raise Refused("details: expected {schemaVersion: 1, cards: {...}}")
    return DetailsFile(DATA_PREFIX + path.name, data, sha, len(doc["cards"]))


@dataclass
class PageFile:
    key: str        # privacy.html
    data: bytes
    sha256: str


def load_page(path: Path) -> PageFile:
    """A page for the CDN's root, as scripts/privacy-page.mjs writes it: one of PAGE_NAMES, an HTML
    document with no script."""
    if path.name not in PAGE_NAMES:
        raise Refused(f"page: {path.name} is not a page this CDN serves ({', '.join(PAGE_NAMES)})")
    data = path.read_bytes()
    if len(data) > MAX_PAGE_BYTES:
        raise Refused(f"page: {len(data)} bytes, over {MAX_PAGE_BYTES}")
    if not data.lstrip().lower().startswith(b"<!doctype html>"):
        raise Refused(f"page: {path.name} is not an HTML document")
    if re.search(rb"<script|\son[a-z]+\s*=|javascript:", data, re.I):
        raise Refused(f"page: {path.name} holds a script; the CDN's pages are plain HTML")
    return PageFile(path.name, data, hashlib.sha256(data).hexdigest())


def details_config_problem(cfg_bytes: Optional[bytes], details: Optional[DetailsFile]) -> Optional[str]:
    """A config.json published with a details file must name that file, path and sha256."""
    if cfg_bytes is None or details is None:
        return None
    named = json.loads(cfg_bytes).get("details")
    want = {"path": details.key, "sha256": details.sha256}
    if named != want:
        return f"config: details must be {json.dumps(want)} for the file being published (it is {json.dumps(named)})"
    return None


def load_config(path: Path, public_base: Optional[str]) -> bytes:
    raw = path.read_bytes()
    try:
        cfg = json.loads(raw)
    except json.JSONDecodeError as e:
        raise Refused(f"config: {path} is not JSON ({e})")
    errs = validate_config(cfg, public_base)
    if errs:
        raise Refused("\n".join(errs))
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


def print_plan(plan: Plan, config: Optional[bytes], details: Optional[DetailsFile] = None) -> None:
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
    if details is not None:
        print(f"details: {details.key} ({details.cards} cards, {len(details.data) / 1e6:.1f} MB), after the index")
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
            log: Callable[[str], None] = print, details: Optional[DetailsFile] = None,
            page: Optional[PageFile] = None) -> int:
    """Images, then the index (of what actually landed), then the card details file, then
    config.json. Returns failures. `plan` None publishes the details file and config.json alone."""
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
    if details is not None:
        try:
            s3.put_object(Bucket=bucket, Key=details.key, Body=details.data,
                          ContentType="application/json", CacheControl=DETAILS_CACHE)
        except Exception as e:
            log(f"FAILED {details.key}: {e}; config.json NOT written. Re-run to retry.")
            return 1
        log(f"details: {details.key} written")
    if page is not None:
        try:
            s3.put_object(Bucket=bucket, Key=page.key, Body=page.data,
                          ContentType="text/html; charset=utf-8", CacheControl=PAGE_CACHE)
        except Exception as e:
            log(f"FAILED {page.key}: {e}; config.json NOT written. Re-run to retry.")
            return 1
        log(f"page: {page.key} written")
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


def http_get(url: str, origin: Optional[str] = None, method: str = "GET", headers: Optional[dict] = None) -> tuple[int, dict, bytes]:
    hdrs = {"User-Agent": USER_AGENT, **(headers or {})}
    if origin:
        hdrs["Origin"] = origin
    req = urllib.request.Request(url, headers=hdrs, method=method)
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
            named = cfg.get("details")
            if named:
                d_status, d_h, d_body = get(f"{public_base}/{named['path']}?{bust}")
                if d_status != 200:
                    fail(f"{named['path']}: HTTP {d_status} (config.json names it: publish it with --details)")
                elif hashlib.sha256(d_body).hexdigest() != named["sha256"]:
                    fail(f"{named['path']}: sha256 differs from config.json's details.sha256")
                elif "application/json" not in d_h.get("content-type", ""):
                    fail(f"{named['path']}: content-type {d_h.get('content-type')!r}")
                elif d_h.get("cache-control") != DETAILS_CACHE:
                    fail(f"{named['path']}: cache-control {d_h.get('cache-control')!r}, want {DETAILS_CACHE!r}")
                elif nel_problem(d_h):
                    fail(f"{named['path']}: {nel_problem(d_h)}")
                else:
                    print(f"ok   {named['path']}: {len(d_body)} bytes, sha256 as config.json names it")

    for name in PAGE_NAMES:
        p_status, p_h, p_body = get(f"{public_base}/{name}?{bust}")
        if p_status == 404:
            print(f"note {name}: not on the CDN (publish it with --page; docs/store-listing.md)")
        elif p_status != 200:
            fail(f"{name}: HTTP {p_status}")
        elif not p_h.get("content-type", "").startswith("text/html"):
            fail(f"{name}: content-type {p_h.get('content-type')!r}")
        elif p_h.get("cache-control") != PAGE_CACHE:
            fail(f"{name}: cache-control {p_h.get('cache-control')!r}, want {PAGE_CACHE!r}")
        elif nel_problem(p_h):
            fail(f"{name}: {nel_problem(p_h)}")
        else:
            print(f"ok   {name}: {len(p_body)} bytes")

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


# ---------------------------------------------------------------------------- remote releases (SETTINGS.md "release")

RELEASES_PREFIX = "vision/releases/"
RELEASES_INDEX_KEY = "vision/releases/index.json"
RELEASE_CACHE = "public, max-age=31536000, immutable"
RELEASE_ID = re.compile(r"^[0-9a-f]{16}$")
FLAT_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")
# The extension reads a release document no further than this (src/release/remote-load.ts DOCUMENT_MAX_BYTES).
MAX_RELEASE_DOC_BYTES = 256 * 1024
# Published beside the weights: the release's license, notice and provenance (release-legal/).
LEGAL_TYPES = {"LICENSE": "text/plain; charset=utf-8", "NOTICE": "text/plain; charset=utf-8",
               "PROVENANCE.md": "text/markdown; charset=utf-8"}
REPO = Path(__file__).resolve().parent.parent
RUNTIMES_PATH = Path(__file__).with_name("RUNTIMES.json")


def version_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(x) for x in v.split("."))


def release_pointer_problems(rel: object) -> list[str]:
    """The config's `release` field (SETTINGS.md, schema 1, additive). The extension ignores a
    malformed one (and loads its bundled release); refused here so that it is never published."""
    if rel is None:
        return []
    if not isinstance(rel, dict):
        return ["config: release must be an object or null"]
    errs = []
    rid = rel.get("id")
    if not isinstance(rid, str) or not RELEASE_ID.match(rid):
        errs.append("config: release.id must be 16 lowercase hex digits")
    elif rel.get("path") != f"{RELEASES_PREFIX}{rid}/release.json":
        errs.append(f"config: release.path must be exactly {RELEASES_PREFIX}{rid}/release.json")
    if not isinstance(rel.get("sha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", rel["sha256"]):
        errs.append("config: release.sha256 must be 64 lowercase hex digits")
    if not isinstance(rel.get("minimumExtensionVersion"), str) or not VERSION_RE.match(rel["minimumExtensionVersion"]):
        errs.append("config: release.minimumExtensionVersion is required, x.y.z")
    if "maximumExtensionVersion" in rel and (not isinstance(rel["maximumExtensionVersion"], str) or not VERSION_RE.match(rel["maximumExtensionVersion"])):
        errs.append("config: release.maximumExtensionVersion must be x.y.z (or left out)")
    if "geometric" in rel:
        errs.append("config: release.geometric is another product's field; DuelSight has no geometric stage")
    return errs


@dataclass
class ReleaseFile:
    key: str
    data: bytes
    sha256: str
    content_type: str


@dataclass
class LocalRelease:
    id: str
    doc: dict
    doc_bytes: bytes
    pinned: list[ReleaseFile]
    legal: list[ReleaseFile]

    @property
    def doc_file(self) -> ReleaseFile:
        return ReleaseFile(f"{RELEASES_PREFIX}{self.id}/release.json", self.doc_bytes,
                           hashlib.sha256(self.doc_bytes).hexdigest(), "application/json")


def pinned_refs(doc: dict) -> list[dict]:
    return [doc.get("detector"), doc.get("recognizer"), doc.get("bank"), (doc.get("identity") or {}).get("groups"), doc.get("catalog")]


def load_local_release(folder: Path, legal_dir: Path) -> LocalRelease:
    """Step 1, the local seal: the document parses, its id is the folder's name, every pinned file is
    a flat name present with its size and SHA-256, and the legal files name this release."""
    doc_path = folder / "release.json"
    if not doc_path.is_file():
        raise Refused(f"{doc_path}: no release document")
    doc_bytes = doc_path.read_bytes()
    if len(doc_bytes) > MAX_RELEASE_DOC_BYTES:
        raise Refused(f"{doc_path}: {len(doc_bytes)} bytes; the extension reads a release document only up to {MAX_RELEASE_DOC_BYTES}")
    try:
        doc = json.loads(doc_bytes)
    except json.JSONDecodeError:
        raise Refused(f"{doc_path}: not JSON")
    rid = doc.get("id") if isinstance(doc, dict) else None
    if not isinstance(rid, str) or not RELEASE_ID.match(rid):
        raise Refused(f"{doc_path}: no 16-hex release id")
    if folder.resolve().name != rid:
        raise Refused(f"the release folder is named {folder.resolve().name!r}; name it after its id ({rid}) so that the "
                      "CDN folder and the local one are the same")
    pinned = []
    for ref in pinned_refs(doc):
        if not isinstance(ref, dict) or not isinstance(ref.get("path"), str):
            raise Refused(f"{doc_path}: a pinned file is missing")
        path = ref["path"]
        if not FLAT_NAME.match(path):
            raise Refused(f"{doc_path}: pinned path {path!r} is not a flat name (letters, digits, '.', '_', '-')")
        f = folder / path
        if not f.is_file():
            raise Refused(f"{f}: missing")
        data = f.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        if len(data) != ref.get("bytes") or sha != ref.get("sha256"):
            raise Refused(f"{f}: size or sha256 differs from the release document")
        ctype = "application/octet-stream" if path.endswith(".onnx") else "application/json"
        pinned.append(ReleaseFile(f"{RELEASES_PREFIX}{rid}/{path}", data, sha, ctype))
    legal = []
    for name, ctype in LEGAL_TYPES.items():
        f = legal_dir / name
        if not f.is_file():
            raise Refused(f"{f}: missing (the release's license files go beside its weights)")
        data = f.read_bytes()
        legal.append(ReleaseFile(f"{RELEASES_PREFIX}{rid}/{name}", data, hashlib.sha256(data).hexdigest(), ctype))
    notice_first = legal[1].data.decode("utf-8").split("\n", 1)[0]
    if rid not in notice_first:
        raise Refused(f"{legal_dir / 'NOTICE'}: its first line does not name release {rid}; update NOTICE and PROVENANCE.md "
                      "for this release (as for a build) before publishing it")
    return LocalRelease(rid, doc, doc_bytes, pinned, legal)


def node_verify(args: list[str], run=None) -> dict:
    """scripts/verify-remote-release.mjs: the vendored runtime's own checks (and, with --sessions,
    ONNX Runtime sessions in Node)."""
    import subprocess

    run = run or subprocess.run
    r = run(["node", str(REPO / "scripts" / "verify-remote-release.mjs"), *args], capture_output=True, text=True)
    lines = [l for l in (r.stdout or "").splitlines() if l.startswith("{")]
    try:
        out = json.loads(lines[-1]) if lines else {}
    except json.JSONDecodeError:
        out = {}
    if not out:
        out = {"ok": False, "reason": f"verify-remote-release.mjs gave no result: {(r.stderr or '').strip()[-300:]}"}
    return out


def runtime_problems(doc: dict, min_v: str, max_v: Optional[str], runtimes: dict) -> list[str]:
    """Step 2: every pointer-aware version the pointer would reach can load the release (ONNX
    Runtime major.minor). A version it would not reach is fine; none at all is refused."""
    want = str((doc.get("runtime") or {}).get("ortWeb", ""))
    mm = lambda v: ".".join(v.split(".")[:2])
    reached = [v for v in runtimes if VERSION_RE.match(v) and version_tuple(v) >= version_tuple(min_v) and (max_v is None or version_tuple(v) < version_tuple(max_v))]
    if not reached:
        return [f"no extension version in cdn/RUNTIMES.json is in [{min_v}, {max_v or '∞'}): nothing would load it"]
    return [f"extension {v} runs onnxruntime-web {runtimes[v]['ortWeb']}, the release needs {want} (major.minor): raise --min-version"
            for v in reached if mm(runtimes[v]["ortWeb"]) != mm(want)]


def remote_state(s3, bucket: str, files: list[ReleaseFile], fix_metadata: bool) -> tuple[list[ReleaseFile], list[ReleaseFile]]:
    """Step 4, through the S3 API only (never the public URL, so that no 404 is cached at the edge
    before the upload). Returns (to upload, already there). Another file's bytes under one of the keys
    refuses the whole run before anything is uploaded."""
    upload, there = [], []
    for f in files:
        try:
            head = s3.head_object(Bucket=bucket, Key=f.key)
        except Exception as e:
            code = str(getattr(e, "response", {}).get("Error", {}).get("Code", ""))
            if code in ("404", "NoSuchKey", "NotFound"):
                upload.append(f)
                continue
            raise
        meta = (head.get("Metadata") or {}).get("sha256")
        headers_ok = head.get("ContentType") == f.content_type and head.get("CacheControl") == RELEASE_CACHE
        if meta == f.sha256 and head.get("ContentLength") == len(f.data) and headers_ok:
            there.append(f)
            continue
        if meta != f.sha256 or head.get("ContentLength") != len(f.data):
            body = s3.get_object(Bucket=bucket, Key=f.key)["Body"].read()
            if hashlib.sha256(body).hexdigest() != f.sha256:
                raise Refused(f"{f.key} is already on the CDN with other bytes: release folders are never overwritten "
                              "(a changed release is a new id)")
        if not fix_metadata:
            raise Refused(f"{f.key}: same bytes, but its sha256 metadata, Content-Type or Cache-Control is not what "
                          "the contract says; re-run with --fix-metadata")
        upload.append(f)
    return upload, there


def upload_release(s3, bucket: str, lr: LocalRelease, todo: list[ReleaseFile], log: Callable[[str], None] = print) -> int:
    """Step 5: the pinned and legal files, then release.json last within the folder; each one
    HEAD-checked. Stops at the first failure: nothing after it is written."""
    doc = lr.doc_file
    order = [f for f in todo if f.key != doc.key] + [f for f in todo if f.key == doc.key]
    for f in order:
        try:
            s3.put_object(Bucket=bucket, Key=f.key, Body=f.data, ContentType=f.content_type,
                          CacheControl=RELEASE_CACHE, Metadata={"sha256": f.sha256})
            head = s3.head_object(Bucket=bucket, Key=f.key)
            if head.get("ContentLength") != len(f.data) or (head.get("Metadata") or {}).get("sha256") != f.sha256:
                raise RuntimeError("the uploaded object does not match")
        except Exception as e:
            log(f"FAILED {f.key}: {e}; nothing after it was written. Re-run to retry.")
            return 1
        log(f"release: {f.key} written ({len(f.data)} bytes)")
    return 0


def write_release_index(s3, bucket: str, lr: LocalRelease, log: Callable[[str], None] = print) -> None:
    """The tool's own record of what was published (not part of the contract)."""
    try:
        idx = json.loads(s3.get_object(Bucket=bucket, Key=RELEASES_INDEX_KEY)["Body"].read())
    except Exception:
        idx = {"schemaVersion": 1, "releases": {}}
    idx.setdefault("releases", {})[lr.id] = {"publishedAt": utc_now(), "bytes": {f.key.rsplit("/", 1)[1]: len(f.data) for f in lr.pinned}}
    s3.put_object(Bucket=bucket, Key=RELEASES_INDEX_KEY, Body=json.dumps(idx, indent=1).encode(),
                  ContentType="application/json", CacheControl=INDEX_CACHE)
    log(f"index: {RELEASES_INDEX_KEY} written")


def pointer_block(lr: LocalRelease, min_v: str, max_v: Optional[str]) -> dict:
    block = {"id": lr.id, "path": f"{RELEASES_PREFIX}{lr.id}/release.json", "sha256": hashlib.sha256(lr.doc_bytes).hexdigest(),
             "minimumExtensionVersion": min_v}
    if max_v:
        block["maximumExtensionVersion"] = max_v
    return block


def bundled_release_id(path: Optional[Path] = None) -> Optional[str]:
    """The id of the release the current build bundles (dist/release/release.json), when there is one."""
    p = path or REPO / "dist" / "release" / "release.json"
    try:
        return json.loads(p.read_text()).get("id")
    except Exception:
        return None


def verify_release_live(public_base: str, candidate: Optional[str] = None, expect_id: Optional[str] = None,
                        sessions: bool = False, expect_sha: Optional[str] = None, extension_ids: Optional[list[str]] = None,
                        get=None, node=node_verify, config_url: Optional[str] = None,
                        expect_files: Optional[dict[str, str]] = None) -> int:
    """verify-release-live (SETTINGS.md): the pointer (or a candidate id), its document, the
    runtime's own checks over https, and every file's headers. Returns failures."""
    get = get or http_get
    bad = 0

    def fail(msg: str) -> None:
        nonlocal bad
        bad += 1
        print(f"FAIL {msg}")

    bust = f"cb={random.getrandbits(32):x}"
    pointer = None
    if candidate:
        if not RELEASE_ID.match(candidate):
            fail(f"--candidate {candidate!r} is not a 16-hex id")
            return bad
        rid = candidate
    else:
        url = config_url or f"{public_base}/{CONFIG_KEY}"
        status, h, body = get(f"{url}{'&' if '?' in url else '?'}{bust}")
        if status == 0:
            err = h.get("x-error", "")
            hint = " This Python trusts no certificate authority: run it from cdn/.venv (README), or pip install certifi." if "CERTIFICATE" in err.upper() else ""
            fail(f"config.json: no answer ({err}).{hint}")
            return bad
        if status != 200:
            fail(f"config.json: HTTP {status}")
            return bad
        cfg = json.loads(body)
        pointer = cfg.get("release")
        if pointer is None:
            if expect_id:
                fail(f"config.json has no release pointer, and {expect_id} was expected")
                return bad
            print("ok   config.json: no release pointer (installs run their bundled release)")
            return 0
        errs = release_pointer_problems(pointer)
        for e in errs:
            fail(e)
        if errs:
            return bad
        rid = pointer["id"]
        expect_sha = pointer["sha256"]
    if expect_id and rid != expect_id:
        fail(f"release {rid} is not the expected {expect_id}")
    doc_url = f"{public_base}/{RELEASES_PREFIX}{rid}/release.json"
    status, h, doc_bytes = get(f"{doc_url}?{bust}")
    if status != 200:
        fail(f"release.json: HTTP {status}")
        return bad
    sha = hashlib.sha256(doc_bytes).hexdigest()
    if expect_sha and sha != expect_sha:
        fail(f"release.json: sha256 {sha} is not the pointer's {expect_sha}")
    result = node(["--url", doc_url, "--expect-id", rid, *(["--sessions"] if sessions else [])])
    if not result.get("ok"):
        fail(f"runtime check: {result.get('reason')}")
    else:
        print(f"ok   runtime check: release {result['id']}, bank {result['bankEntries']} entries / {result['bankCards']} cards, "
              f"catalog {result['catalogCards']} cards, sessions {result['sessions']}")
    doc = json.loads(doc_bytes)
    ids = extension_ids if extension_ids is not None else [x.strip() for x in os.environ.get("DSCDN_EXTENSION_IDS", "").split(",") if x.strip()]
    if not ids:
        fail("DSCDN_EXTENSION_IDS is not set: the CORS check needs each real extension id (store and unpacked)")
    checks = [(f"release.json", "application/json", sha)] + [(r["path"], "application/octet-stream" if r["path"].endswith(".onnx") else "application/json", r["sha256"]) for r in pinned_refs(doc)]
    checks += [(name, ctype, (expect_files or {}).get(name)) for name, ctype in LEGAL_TYPES.items()]
    for name, ctype, want_sha in checks:
        url = f"{public_base}/{RELEASES_PREFIX}{rid}/{name}"
        status, h, data = get(f"{url}?{bust}", origin=f"chrome-extension://{ids[0]}" if ids else None)
        if status != 200:
            fail(f"{name}: HTTP {status}")
            continue
        problems = []
        if want_sha and hashlib.sha256(data).hexdigest() != want_sha:
            problems.append("sha256 differs from the release document")
        if h.get("content-type") != ctype:
            problems.append(f"content-type {h.get('content-type')!r}, want {ctype!r}")
        if h.get("cache-control") != RELEASE_CACHE:
            problems.append(f"cache-control {h.get('cache-control')!r}, want {RELEASE_CACHE!r}")
        if nel_problem(h):
            problems.append(nel_problem(h))
        for ext in ids:
            origin = f"chrome-extension://{ext}"
            _, ch, _ = get(f"{url}?{bust}", origin=origin, method="HEAD")
            if ch.get("access-control-allow-origin") not in ("*", origin):
                problems.append(f"no CORS header for {origin}")
        if problems:
            fail(f"{name}: " + "; ".join(problems))
            continue
        note = ""
        if ctype == "application/json":
            # A GET: a CDN may leave content-encoding off a HEAD answer. The body is not decoded or used.
            _, eh, _ = get(f"{url}?{bust}", headers={"Accept-Encoding": "gzip, br, zstd"})
            enc = eh.get("content-encoding")
            note = f", content-encoding {enc}" if enc else ", WARNING: served uncompressed"
        print(f"ok   {name}: {len(data)} bytes{note}")
    print(f"verify-release-live {rid}: " + ("all checks passed" if not bad else f"{bad} failure(s)"))
    return bad


def live_models(public_base: str, runtimes: dict, min_v: str, max_v: Optional[str], get=None) -> list[tuple[str, str, str]]:
    """The models installs run now: the live pointer's release, else the release bundled in each
    extension version the new pointer would reach (cdn/RUNTIMES.json). (label, detector sha256,
    recognizer sha256) each."""
    get = get or http_get
    status, _, body = get(f"{public_base}/{CONFIG_KEY}?cb={random.getrandbits(32):x}")
    rel = json.loads(body).get("release") if status == 200 else None
    if rel and not release_pointer_problems(rel):
        s2, _, doc_bytes = get(f"{public_base}/{rel['path']}?cb={random.getrandbits(32):x}")
        if s2 == 200:
            doc = json.loads(doc_bytes)
            return [(f"live release {rel['id']}", doc["detector"]["sha256"], doc["recognizer"]["sha256"])]
    out = []
    for v, row in runtimes.items():
        if not VERSION_RE.match(v) or version_tuple(v) < version_tuple(min_v) or (max_v and version_tuple(v) >= version_tuple(max_v)):
            continue
        b = row.get("bundledRelease") or {}
        out.append((f"{v}'s bundled release {b.get('id')}", b.get("detectorSha256", ""), b.get("recognizerSha256", "")))
    return out


def planned_config(args, lr: LocalRelease, block: dict, details: Optional["DetailsFile"], public_base: str) -> Optional[bytes]:
    """The config.json this run would publish (step 7), checked before anything is uploaded. None:
    no --config (the folder is published, the pointer not moved)."""
    if not args.config:
        return None
    cfg = json.loads(Path(args.config).read_text())
    if args.set_pointer:
        cfg["release"] = block
        if details is not None:
            cfg["details"] = {"path": details.key, "sha256": details.sha256}
    elif cfg.get("release") != block:
        raise Refused(f"{args.config}: its release field is not this release's pointer; set it to\n{json.dumps(block, indent=2)}\n(or pass --set-pointer)")
    errs = validate_config(cfg, public_base)
    if errs:
        raise Refused("; ".join(errs))
    data = (json.dumps(cfg, indent=2) + "\n").encode()
    problem = details_config_problem(data, details)
    if problem:
        raise Refused(problem + " (pass --set-pointer to write it)")
    return data


def publish_release(args, t: Target, s3=None, verify_live=None, node=node_verify, log: Callable[[str], None] = print,
                    get=None, runtimes: Optional[dict] = None) -> int:
    """publish-release (SETTINGS.md, "Publishing a release"): every check first (seal, runtimes,
    models vs --sessions, details, the config it would write, remote state), then upload, verify
    live, details, and config.json last. A dry run makes every check and writes nothing."""
    lr = load_local_release(Path(args.release), Path(args.legal) if args.legal else REPO / "release-legal")
    min_v, max_v = args.min_version, args.max_version
    if not min_v or not VERSION_RE.match(min_v) or (max_v and not VERSION_RE.match(max_v)):
        raise Refused("--min-version x.y.z is required (and --max-version, when given, is x.y.z)")
    runtimes = runtimes if runtimes is not None else json.loads(RUNTIMES_PATH.read_text())
    problems = runtime_problems(lr.doc, min_v, max_v, runtimes)
    if problems:
        raise Refused("; ".join(problems))
    changed = [label for label, d, r in live_models(t.public_base, runtimes, min_v, max_v, get=get)
               if (d, r) != (lr.doc["detector"]["sha256"], lr.doc["recognizer"]["sha256"])]
    if changed and not args.sessions:
        raise Refused(f"the models differ from {', '.join(changed)}: re-run with --sessions (both ONNX Runtime sessions in Node)")
    local = node(["--dir", str(Path(args.release)), "--expect-id", lr.id, *(["--sessions"] if args.sessions else [])])
    if not local.get("ok"):
        raise Refused(f"the runtime's own check refused the release: {local.get('reason')}")
    log(f"seal: release {lr.id} ok (bank {local['bankEntries']} entries, catalog {local['catalogCards']} cards, sessions {local['sessions']})")
    details = load_details(Path(args.details)) if args.details else None
    block = pointer_block(lr, min_v, max_v)
    config = planned_config(args, lr, block, details, t.public_base)
    problem = details_gate(t.public_base, config, details, get=get)
    if problem:
        raise Refused(problem + "; nothing written")
    s3 = s3 or r2_client(t)
    todo, there = remote_state(s3, t.bucket, lr.pinned + lr.legal + [lr.doc_file], args.fix_metadata)
    log(f"remote: {len(todo)} to upload, {len(there)} already there")
    for f in todo:
        log(f"  upload {f.key} ({len(f.data)} bytes)")
    if details is not None:
        log(f"  then the details file {details.key}")
    log("pointer: " + json.dumps(block) + ("" if config is not None else " (no --config: not moved)"))
    if bundled_release_id() == lr.id:
        log(f"note: {lr.id} is the release the current build bundles: a pointer to it downloads nothing (a no-op move)")
    if args.dry_run:
        return 0
    if upload_release(s3, t.bucket, lr, todo, log):
        return 1
    if todo:
        write_release_index(s3, t.bucket, lr, log)
    verify_live = verify_live or verify_release_live
    if verify_live(t.public_base, candidate=lr.id, expect_sha=block["sha256"], sessions=args.sessions,
                   expect_files={f.key.rsplit("/", 1)[1]: f.sha256 for f in lr.legal}):
        log("the release folder did not verify live: config.json NOT written")
        return 1
    if details is not None and execute(s3, t.bucket, None, None, details=details, log=log):
        return 1
    if config is None:
        log("no --config: the release folder is published; the pointer is not moved")
        return 0
    if args.set_pointer:
        Path(args.config).write_bytes(config)
        log(f"{args.config}: release (and details) set")
    if execute(s3, t.bucket, None, config, log=log):
        return 1
    return 1 if verify(t.public_base, 4) else 0


def pointer_gate(public_base: str, rel: dict, get=None, runtimes: Optional[dict] = None, verify_live=None) -> Optional[str]:
    """`publish --config` with a pointer: why it may not go out, or None. The same pointer as the live
    config's needs no new check (an emergency `namesOnly` must not wait on it); a new one must verify
    live and be loadable by every extension version it reaches."""
    get = get or http_get
    status, _, body = get(f"{public_base}/{CONFIG_KEY}?cb={random.getrandbits(32):x}")
    if status == 200 and json.loads(body).get("release") == rel:
        print(f"note: the pointer is the live one ({rel['id']}); not checked again")
        return None
    # Cache-busted: never leave a cached 404 at the edge under a release's real URL.
    s2, _, doc_bytes = get(f"{public_base}/{rel['path']}?cb={random.getrandbits(32):x}")
    if s2 != 200:
        return f"release {rel['id']}: its document is not on the CDN (HTTP {s2})"
    runtimes = runtimes if runtimes is not None else json.loads(RUNTIMES_PATH.read_text())
    problems = runtime_problems(json.loads(doc_bytes), rel["minimumExtensionVersion"], rel.get("maximumExtensionVersion"), runtimes)
    if problems:
        return "; ".join(problems)
    if (verify_live or verify_release_live)(public_base, candidate=rel["id"], expect_sha=rel["sha256"]):
        return f"config.json points at release {rel['id']}, which does not verify live"
    return None


def details_gate(public_base: str, cfg_bytes: Optional[bytes], details: Optional[DetailsFile], get=None) -> Optional[str]:
    """A config.json about to be published: why its `details` entry may not go out, or None. It must
    name the details file this run publishes (before the config), or one already on the CDN with
    exactly those bytes. Otherwise every viewer's details panel would ask for a file that is not
    there (2026-10-26: a stale repository config named a details file that was never published)."""
    if cfg_bytes is None:
        return None
    named = json.loads(cfg_bytes).get("details")
    if not named:
        return None
    if details is not None and named == {"path": details.key, "sha256": details.sha256}:
        return None
    get = get or http_get
    # Cache-busted: never leave a cached 404 at the edge under a real URL.
    status, _, body = get(f"{public_base}/{named['path']}?cb={random.getrandbits(32):x}")
    if status == 200 and hashlib.sha256(body).hexdigest() == named["sha256"]:
        return None
    why = f"HTTP {status}" if status != 200 else "other bytes than its sha256"
    hint = "publish that file with --details, or name the details file that is live"
    s2, _, live_body = get(f"{public_base}/{CONFIG_KEY}?cb={random.getrandbits(32):x}")
    try:
        live = json.loads(live_body).get("details") if s2 == 200 else None
    except (json.JSONDecodeError, AttributeError):
        live = None
    if live and live != named:
        hint = f"the live config.json names {json.dumps(live)}: copy that entry into the config, or publish {named['path']} with --details"
    return f"config.json names {named['path']}, which is not on the CDN ({why}); {hint}"


# ---------------------------------------------------------------------------- CLI

def build(args, public_base: Optional[str]) -> tuple[list[LocalFile], int, int, Optional[bytes], Optional[DetailsFile]]:
    config = load_config(Path(args.config), public_base) if args.config else None
    details = load_details(Path(args.details)) if args.details else None
    problem = details_config_problem(config, details)
    if problem:
        raise Refused(problem)
    if config is not None and details is None and json.loads(config).get("details") and getattr(args, "offline", False):
        print(f"note: config.json names {json.loads(config)['details']['path']}; it must already be on the CDN "
              "(publish checks it before anything is written)")
    if not args.catalog:
        return [], 0, 0, config, details
    if not args.images:
        raise Refused("--catalog needs --images")
    paths, artless = catalog_art_paths(json.loads(Path(args.catalog).read_text()))
    files = scan_images(paths, Path(args.images))
    return files, artless, sum(len(v) for v in paths.values()), config, details


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=("plan", "publish", "verify", "selftest", "publish-release", "verify-release-live"))
    ap.add_argument("--catalog", help="catalog JSON (entries with an id and an `art` path or null)")
    ap.add_argument("--images", help="directory the `art` paths are relative to")
    ap.add_argument("--config", help="config.json to publish (SETTINGS.md); uploaded last")
    ap.add_argument("--details", help="the card details file to publish (data/details-<sha8>.json from scripts/card-details.mjs)")
    ap.add_argument("--page", help="a page to publish at the CDN's root: privacy.html from scripts/privacy-page.mjs")
    ap.add_argument("--env-file", help="read DSCDN_* entries from this file")
    ap.add_argument("--offline", action="store_true", help="plan: no credentials, treat the CDN as empty")
    ap.add_argument("--dry-run", action="store_true", help="publish: read the live index, print the plan, upload nothing")
    ap.add_argument("--samples", type=int, default=8, help="verify: images to fetch")
    ap.add_argument("--release", help="publish-release: the release folder (named after its id; cardvision build-release)")
    ap.add_argument("--min-version", help="publish-release: the pointer's minimumExtensionVersion (x.y.z)")
    ap.add_argument("--max-version", help="publish-release: maximumExtensionVersion (exclusive); leave it out unless needed")
    ap.add_argument("--legal", help="publish-release: LICENSE, NOTICE, PROVENANCE.md for this release (default release-legal/)")
    ap.add_argument("--set-pointer", action="store_true", help="publish-release: write the pointer into --config first")
    ap.add_argument("--fix-metadata", action="store_true", help="publish-release: re-upload same-bytes objects whose sha256 metadata is wrong")
    ap.add_argument("--sessions", action="store_true", help="also start the ONNX Runtime sessions in Node (a new model)")
    ap.add_argument("--candidate", help="verify-release-live: a release id on the CDN, without a pointer")
    ap.add_argument("--config-url", help="verify-release-live: read the pointer from this config.json")
    ap.add_argument("--expect-id", help="verify-release-live: the id the pointer must name")
    args = ap.parse_args(argv)

    if args.command == "selftest":
        return selftest()
    if args.env_file:
        load_env_file(Path(args.env_file))
    try:
        if args.command == "verify":
            return 1 if verify(target_from_env(need_secrets=False).public_base, args.samples) else 0
        if args.command == "verify-release-live":
            base = target_from_env(need_secrets=False).public_base
            return 1 if verify_release_live(base, candidate=args.candidate, expect_id=args.expect_id, sessions=args.sessions,
                                            config_url=args.config_url) else 0
        if args.command == "publish-release":
            if not args.release:
                raise Refused("publish-release needs --release DIR")
            return publish_release(args, target_from_env())
        if args.command == "plan" and args.offline:
            base = os.environ.get("DSCDN_PUBLIC_BASE")
            files, artless, cards, config, details = build(args, base.rstrip("/") if base else None)
            if args.page:
                print(f"page: {load_page(Path(args.page)).key} (checked)")
            print_plan(make_plan(files, {}, artless, cards), config, details)
            return 0
        page = load_page(Path(args.page)) if args.page else None
        if not args.catalog and not args.config and not args.details and page is None:
            raise Refused("nothing to do: give --catalog/--images, --details, --page and/or --config")
        t = target_from_env()
        files, artless, cards, config, details = build(args, t.public_base)
        # A pointer only ever moves to a folder that verifies live (this covers rollbacks too).
        rel = json.loads(config).get("release") if config is not None else None
        if rel and args.command == "publish":  # a dry run checks it too
            problem = pointer_gate(t.public_base, rel)
            if problem:
                raise Refused(problem + "; nothing written")
        if args.command == "publish":  # a dry run checks it too
            problem = details_gate(t.public_base, config, details)
            if problem:
                raise Refused(problem + "; nothing written")
        s3 = r2_client(t)
        live = read_live_index(s3, t.bucket)
        plan = make_plan(files, live, artless, cards) if args.catalog else None
        print(f"target: bucket {t.bucket}, served at {t.public_base}")
        if plan:
            print_plan(plan, config, details)
        else:
            if details is not None:
                print(f"details: {details.key} ({details.cards} cards, {len(details.data) / 1e6:.1f} MB)")
            if page is not None:
                print(f"page: {page.key} ({len(page.data)} bytes, sha256 {page.sha256[:16]})")
            print("config: config.json" + (", uploaded last" if config is not None else " not uploaded (no --config)"))
        if args.command == "plan" or args.dry_run:
            return 0
        return 1 if execute(s3, t.bucket, plan, config, details=details, page=page) else 0
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
    env = {"DSCDN_R2_ACCOUNT_ID": acct, "DSCDN_R2_ACCESS_KEY_ID": kid, "DSCDN_R2_SECRET_ACCESS_KEY": sec,
           "DSCDN_PUBLIC_BASE": base, "DSCDN_BUCKET": "card-art"}
    assert target_from_env(env).public_base == base
    assert refused(lambda: target_from_env(env | {"R2_ACCOUNT_ID": acct})), "same account as another project"
    for k, v in (("DSCDN_R2_ACCOUNT_ID", f"https://{acct}.r2.cloudflarestorage.com"),
                 ("DSCDN_R2_ACCOUNT_ID", acct + " "), ("DSCDN_R2_ACCOUNT_ID", acct.upper()),
                 ("DSCDN_R2_ACCESS_KEY_ID", "x" * 40), ("DSCDN_R2_SECRET_ACCESS_KEY", "tokenvalue"),
                 ("DSCDN_BUCKET", "s3://card-art")):
        assert refused(lambda: target_from_env(env | {k: v})), (k, v)
    try:
        target_from_env(env | {"DSCDN_R2_SECRET_ACCESS_KEY": "s3cr3t-value"})
    except Refused as e:
        assert "s3cr3t" not in str(e), "never echo a credential"
    assert refused(lambda: target_from_env(env | {"DSCDN_BUCKET": "riftsight-assets"}))
    assert refused(lambda: target_from_env(env | {"DSCDN_PUBLIC_BASE": "https://assets.riftsight.gg"}))
    assert refused(lambda: target_from_env(env | {"DSCDN_PUBLIC_BASE": "http://cdn.example.org"}))
    assert refused(lambda: target_from_env({"DSCDN_PUBLIC_BASE": base}))
    assert target_from_env({"DSCDN_PUBLIC_BASE": base}, need_secrets=False)

    # catalog shapes and path rules
    for shape in ([{"id": "89631139", "art": "89631139.jpg"}, {"id": "X", "art": None}],
                  {"cards": [{"cardId": "89631139", "art": "89631139.jpg"}, {"cardId": "X", "art": None}]},
                  {"cards": {"89631139": {"art": "89631139.jpg"}, "X": {"art": None}}}):
        paths, artless = catalog_art_paths(shape)
        assert paths == {"89631139.jpg": ["89631139"]} and artless == 1, shape
    for bad in ("../x.jpg", "/x.jpg", "a//b.jpg", "x.gif", "a\\b.jpg", ""):
        assert refused(lambda b=bad: catalog_art_paths([{"id": "A", "art": b}])), bad
    assert refused(lambda: catalog_art_paths([{"id": "A"}])), "art field required"
    shared, _ = catalog_art_paths([{"id": "A", "art": "s.png"}, {"id": "B", "art": "s.png"}])
    assert shared == {"s.png": ["A", "B"]}

    # config contract
    assert validate_config(good_cfg, None) == []
    good_cfg_here = good_cfg | {"primary": {"id": "cdn", "template": base + "/art/{art}"}}
    assert validate_config(good_cfg_here, base) == []
    assert validate_config(good_cfg, "https://other.example.org"), "primary must be on our base"
    for mutate in ({"schemaVersion": 2}, {"schemaVersion": True}, {"namesOnly": "no"},
                   {"fallbacks": None}, {"fallbacks": [{"id": "c", "template": "http://x/{cardId}"}]},
                   {"fallbacks": [{"id": "c", "template": "https://x/{name}"}]},
                   {"fallbacks": [{"id": "c", "template": "https://assets.riftsight.gg/{cardId}"}]}, {"primary": {"template": "https://x/{art}"}},
                   {"primary": {"id": "cdn", "template": "https://cdn.example.org/art/{sourceFile}"}}):
        assert validate_config(good_cfg | mutate, None), mutate
    no_primary = dict(good_cfg); del no_primary["primary"]
    assert validate_config(no_primary, None), "primary required"
    assert validate_config(good_cfg | {"primary": None, "namesOnly": True, "fallbacks": []}, base) == []

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "images"
        (root / "jp").mkdir(parents=True)
        (root / "89631139.jpg").write_bytes(jpg)
        (root / "jp" / "46986414.png").write_bytes(png)
        (root / "fake.png").write_bytes(b"<html>not found</html>")
        (root / "png-named.jpg").write_bytes(png)
        (Path(tmp) / "outside.jpg").write_bytes(jpg)

        paths = {"89631139.jpg": ["89631139"], "jp/46986414.png": ["46986414"]}
        files = scan_images(paths, root)
        assert [f.path for f in files] == ["89631139.jpg", "jp/46986414.png"]
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
            "89631139.jpg": {"sha256": files[0].sha256, "bytes": files[0].bytes},
            "jp/46986414.png": {"sha256": "0" * 64, "bytes": 1},
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
        assert set(keys[:2]) == {"art/89631139.jpg", "art/jp/46986414.png"}
        assert keys[2:] == [INDEX_KEY, CONFIG_KEY], keys
        assert dict((p[0], (p[1], p[2])) for p in s3.puts)["art/jp/46986414.png"] == ("image/png", ART_CACHE)
        assert s3.puts[-1][2] == CONFIG_CACHE

        s3 = FakeS3(fail_keys={"art/jp/46986414.png"})
        assert execute(s3, "b", make_plan(files, {}, 0, 2), cfg_bytes, workers=1, log=lambda _: None) == 1
        keys = [p[0] for p in s3.puts]
        assert CONFIG_KEY not in keys, "no config after a failed image"
        index = json.loads(next(p[3] for p in s3.puts if p[0] == INDEX_KEY))
        assert "jp/46986414.png" not in index["files"] and "89631139.jpg" in index["files"]

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
            "art/89631139.jpg": (200, {"content-type": "image/jpeg", "cache-control": ART_CACHE}, jpg),
            "art/jp/46986414.png": (200, {"content-type": "image/png", "cache-control": ART_CACHE}, png),
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
            store["art/jp/46986414.png"] = (200, {"content-type": "image/png", "cache-control": ART_CACHE}, png + b"!")
            assert verify(base, 5, get=fake_get) == 1, "sha mismatch"
            store[CONFIG_KEY] = (200, {"content-type": "application/json", "cache-control": CONFIG_CACHE}, cfg_bytes)
            assert verify(base, 5, get=fake_get) == 2, "missing CORS"
            assert verify(base, 5, get=lambda url, origin=None: (0, {"x-error": "gaierror: no such host"}, b"")) == 1
        finally:
            sys.stdout = stdout
            quiet.close()

        # env file reads only DSCDN_* entries
        envf = Path(tmp) / ".env"
        envf.write_text("export DSCDN_BUCKET='card-art'\nR2_SECRET_ACCESS_KEY=nope\n# c\n")
        saved = {k: os.environ.get(k) for k in ("DSCDN_BUCKET", "R2_SECRET_ACCESS_KEY")}
        try:
            os.environ.pop("R2_SECRET_ACCESS_KEY", None)
            load_env_file(envf)
            assert os.environ["DSCDN_BUCKET"] == "card-art" and "R2_SECRET_ACCESS_KEY" not in os.environ
        finally:
            for k, v in saved.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v

    # the card details file: name, contents, config consistency, order, verify
    with tempfile.TemporaryDirectory() as tmp:
        doc = json.dumps({"schemaVersion": 1, "cards": {"1": ["spell", "Invented text.", "Normal Spell"]}}).encode()
        sha = hashlib.sha256(doc).hexdigest()
        good = Path(tmp) / f"details-{sha[:8]}.json"
        good.write_bytes(doc)
        d = load_details(good)
        assert (d.key, d.sha256, d.cards) == (f"data/details-{sha[:8]}.json", sha, 1)
        wrong_name = Path(tmp) / "details-00000000.json"
        wrong_name.write_bytes(doc)
        assert refused(lambda: load_details(wrong_name)), "name must match the contents"
        assert refused(lambda: load_details(Path(tmp) / "details.json")), "versioned name required"
        bad_doc = b'{"schemaVersion": 2, "cards": {}}'
        bad = Path(tmp) / f"details-{hashlib.sha256(bad_doc).hexdigest()[:8]}.json"
        bad.write_bytes(bad_doc)
        assert refused(lambda: load_details(bad)), "schema version 1"

        named = good_cfg_here | {"details": {"path": d.key, "sha256": sha}}
        assert validate_config(named, base) == []
        for wrong in ({"path": "../x.json", "sha256": sha}, {"path": "/data/x.json", "sha256": sha},
                      {"path": "data/x.json", "sha256": "ABC"}, {"path": "data/x.js", "sha256": sha}, "data/x.json"):
            assert validate_config(good_cfg_here | {"details": wrong}, base), wrong
        assert details_config_problem(json.dumps(named).encode(), d) is None
        assert details_config_problem(json.dumps(good_cfg_here).encode(), d), "config must name the file"
        assert details_config_problem(json.dumps(good_cfg_here | {"details": {"path": d.key, "sha256": "0" * 64}}).encode(), d)

        class Rec2:
            def __init__(self, fail_keys=()):
                self.puts, self.fail_keys = [], set(fail_keys)

            def put_object(self, *, Bucket, Key, Body, ContentType, CacheControl):
                if Key in self.fail_keys:
                    raise RuntimeError("boom")
                self.puts.append((Key, ContentType, CacheControl))

        cfg_named = json.dumps(named).encode()
        s3d = Rec2()
        assert execute(s3d, "b", None, cfg_named, log=lambda _: None, details=d) == 0
        assert [p[0] for p in s3d.puts] == [d.key, CONFIG_KEY], "details before config"
        assert s3d.puts[0][1:] == ("application/json", DETAILS_CACHE)
        s3d = Rec2(fail_keys={d.key})
        assert execute(s3d, "b", None, cfg_named, log=lambda _: None, details=d) == 1
        assert CONFIG_KEY not in [p[0] for p in s3d.puts], "no config after a failed details upload"

        cfg_head = {"content-type": "application/json", "cache-control": CONFIG_CACHE, "access-control-allow-origin": "*"}
        idx = json.dumps({"schemaVersion": 1, "files": {}}).encode()
        store2 = {CONFIG_KEY: (200, cfg_head, cfg_named), INDEX_KEY: (200, {"content-type": "application/json"}, idx),
                  d.key: (200, {"content-type": "application/json", "cache-control": DETAILS_CACHE}, doc)}

        def get2(url, origin=None):
            key = urllib.parse.unquote(url[len(base) + 1:].split("?")[0])
            return store2.get(key, (404, {}, b""))

        quiet = open(os.devnull, "w")
        stdout, sys.stdout = sys.stdout, quiet
        try:
            assert verify(base, 0, get=get2) == 0
            store2[d.key] = (200, {"content-type": "application/json", "cache-control": DETAILS_CACHE}, doc + b" ")
            assert verify(base, 0, get=get2) == 1, "details sha mismatch"
            del store2[d.key]
            assert verify(base, 0, get=get2) == 1, "details named but missing"
        finally:
            sys.stdout = stdout
            quiet.close()

    # pages (privacy.html): fixed names, plain HTML, published before config.json
    with tempfile.TemporaryDirectory() as tmp:
        good_html = b"<!doctype html>\n<html><body><h1>Privacy</h1></body></html>\n"
        pg = Path(tmp) / "privacy.html"
        pg.write_bytes(good_html)
        page = load_page(pg)
        assert (page.key, page.sha256) == ("privacy.html", hashlib.sha256(good_html).hexdigest())
        other = Path(tmp) / "index.html"
        other.write_bytes(good_html)
        assert refused(lambda: load_page(other)), "only the listed page names"
        for bad_html in (b"<!doctype html><script>x()</script>", b"<!doctype html><a href='javascript:x()'>a</a>",
                         b"<!doctype html><body onload=x()>", b"{\"not\": \"html\"}"):
            pg.write_bytes(bad_html)
            assert refused(lambda: load_page(pg)), bad_html

        class Rec3:
            def __init__(self, fail_keys=()):
                self.puts, self.fail_keys = [], set(fail_keys)

            def put_object(self, *, Bucket, Key, Body, ContentType, CacheControl):
                if Key in self.fail_keys:
                    raise RuntimeError("boom")
                self.puts.append((Key, ContentType, CacheControl))

        s3p = Rec3()
        cfg_bytes = json.dumps(good_cfg).encode()
        assert execute(s3p, "b", None, cfg_bytes, log=lambda _: None, page=page) == 0
        assert [p[0] for p in s3p.puts] == ["privacy.html", CONFIG_KEY], "page before config"
        assert s3p.puts[0][1:] == ("text/html; charset=utf-8", PAGE_CACHE)
        s3p = Rec3(fail_keys={"privacy.html"})
        assert execute(s3p, "b", None, cfg_bytes, log=lambda _: None, page=page) == 1
        assert CONFIG_KEY not in [p[0] for p in s3p.puts], "no config after a failed page upload"
        s3p = Rec3()
        assert execute(s3p, "b", None, None, log=lambda _: None, page=page) == 0
        assert [p[0] for p in s3p.puts] == ["privacy.html"], "a page alone"

    selftest_releases(refused)
    print("selftest: ok")
    return 0


def selftest_releases(refused) -> None:
    """publish-release and verify-release-live, with a fake bucket, a fake Node check and a fake CDN."""
    import tempfile
    from types import SimpleNamespace

    rid = "0123456789abcdef"
    ok_ptr = {"id": rid, "path": f"vision/releases/{rid}/release.json", "sha256": "a" * 64, "minimumExtensionVersion": "0.3.0"}
    assert release_pointer_problems(None) == [] and release_pointer_problems(ok_ptr) == []
    for bad in ({**ok_ptr, "path": f"vision/releases/{rid}/../x/release.json"}, {**ok_ptr, "id": "ABC"},
                {**ok_ptr, "sha256": "x"}, {k: v for k, v in ok_ptr.items() if k != "minimumExtensionVersion"},
                {**ok_ptr, "maximumExtensionVersion": "1"}, {**ok_ptr, "geometric": {}}, [ok_ptr]):
        assert release_pointer_problems(bad), bad
    cfg = json.loads(Path(__file__).with_name("config.example.json").read_text())
    assert not validate_config({**cfg, "release": ok_ptr}, None)
    assert validate_config({**cfg, "release": {**ok_ptr, "path": "x"}}, None)

    runtimes = {"$comment": "x", "0.3.0": {"ortWeb": "1.29.0"}, "0.4.0": {"ortWeb": "1.30.1"}}
    doc = {"runtime": {"ortWeb": "1.29.0"}}
    assert runtime_problems(doc, "0.3.0", "0.4.0", runtimes) == []
    assert runtime_problems(doc, "0.3.0", None, runtimes), "0.4.0 runs another ORT minor"
    assert runtime_problems(doc, "9.0.0", None, runtimes), "nothing reached"

    with tempfile.TemporaryDirectory() as tmp:
        folder, legal = Path(tmp) / rid, Path(tmp) / "legal"
        folder.mkdir()
        legal.mkdir()
        refs = {}
        for key, name in (("detector", "detector.onnx"), ("recognizer", "recognizer.onnx"), ("bank", "bank.json"),
                          ("groups", "identity-groups.json"), ("catalog", "catalog.json")):
            data = f"{name}-bytes".encode()
            (folder / name).write_bytes(data)
            refs[key] = {"path": name, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
        d = {"id": rid, "detector": refs["detector"], "recognizer": refs["recognizer"], "bank": refs["bank"],
             "identity": {"groups": refs["groups"]}, "catalog": refs["catalog"], "runtime": {"ortWeb": "1.29.0"}}
        (folder / "release.json").write_text(json.dumps(d))
        (legal / "LICENSE").write_text("license")
        (legal / "NOTICE").write_text(f"DuelSight models (release {rid})\nmore")
        (legal / "PROVENANCE.md").write_text("provenance")
        lr = load_local_release(folder, legal)
        assert [f.key.rsplit("/", 1)[1] for f in lr.pinned] == ["detector.onnx", "recognizer.onnx", "bank.json", "identity-groups.json", "catalog.json"]
        assert lr.pinned[0].content_type == "application/octet-stream" and lr.pinned[2].content_type == "application/json"
        other = Path(tmp) / "elsewhere"
        other.mkdir()
        for f in folder.iterdir():
            (other / f.name).write_bytes(f.read_bytes())
        assert refused(lambda: load_local_release(other, legal)), "folder not named after its id"
        (legal / "NOTICE").write_text("DuelSight models (release ffffffffffffffff)")
        assert refused(lambda: load_local_release(folder, legal)), "NOTICE names another release"
        (legal / "NOTICE").write_text(f"DuelSight models (release {rid})")
        (folder / "bank.json").write_bytes(b"changed")
        assert refused(lambda: load_local_release(folder, legal)), "a pinned file changed"
        (folder / "bank.json").write_text("bank.json-bytes")
        bad_doc = json.loads((folder / "release.json").read_text())
        bad_doc["catalog"] = {**refs["catalog"], "path": "sub/catalog.json"}
        (folder / "release.json").write_text(json.dumps(bad_doc))
        assert refused(lambda: load_local_release(folder, legal)), "a pinned path is not a flat name"
        (folder / "release.json").write_text(json.dumps({**d, "padding": "x" * MAX_RELEASE_DOC_BYTES}))
        assert refused(lambda: load_local_release(folder, legal)), "a document the extension would not read whole"
        (folder / "release.json").write_text(json.dumps(d))
        lr = load_local_release(folder, legal)

        class NoKey(Exception):
            response = {"Error": {"Code": "404"}}

        class FakeS3:
            """objects: key -> (bytes, metadata[, content type, cache control])."""
            def __init__(self, objects=None, fail=()):
                self.objects = {k: (v + (None, None))[:4] if len(v) == 2 else v for k, v in (objects or {}).items()}
                self.puts, self.fail = [], set(fail)

            def head_object(self, *, Bucket, Key):
                if Key not in self.objects:
                    raise NoKey()
                data, meta, ctype, cache = self.objects[Key]
                return {"ContentLength": len(data), "Metadata": meta, "ContentType": ctype, "CacheControl": cache}

            def get_object(self, *, Bucket, Key):
                if Key not in self.objects:
                    raise NoKey()
                return {"Body": SimpleNamespace(read=lambda: self.objects[Key][0])}

            def put_object(self, *, Bucket, Key, Body, ContentType, CacheControl, Metadata=None):
                if Key in self.fail:
                    raise RuntimeError("boom")
                self.objects[Key] = (Body, Metadata or {}, ContentType, CacheControl)
                self.puts.append((Key, ContentType, CacheControl))

        files = lr.pinned + lr.legal + [lr.doc_file]
        todo, there = remote_state(FakeS3(), "b", files, False)
        assert len(todo) == 9 and not there
        f0 = lr.pinned[0]
        good = (f0.data, {"sha256": f0.sha256}, f0.content_type, RELEASE_CACHE)
        todo, there = remote_state(FakeS3({f0.key: good}), "b", files, False)
        assert len(todo) == 8 and there == [f0], "same bytes, metadata and headers: skipped"
        assert refused(lambda: remote_state(FakeS3({f0.key: (b"other", {"sha256": "x"}, f0.content_type, RELEASE_CACHE)}), "b", files, True)), "other bytes refuse the run"
        assert refused(lambda: remote_state(FakeS3({f0.key: (f0.data, {}, f0.content_type, RELEASE_CACHE)}), "b", files, False)), "missing metadata"
        assert refused(lambda: remote_state(FakeS3({f0.key: (f0.data, {"sha256": f0.sha256}, "text/plain", RELEASE_CACHE)}), "b", files, False)), "wrong type"
        assert refused(lambda: remote_state(FakeS3({f0.key: (f0.data, {"sha256": f0.sha256}, f0.content_type, "no-cache")}), "b", files, False)), "wrong cache"
        todo, _ = remote_state(FakeS3({f0.key: (f0.data, {}, f0.content_type, RELEASE_CACHE)}), "b", files, True)
        assert f0 in todo, "--fix-metadata re-uploads it"

        s3 = FakeS3()
        assert upload_release(s3, "b", lr, files, log=lambda _: None) == 0
        assert s3.puts[-1][0] == lr.doc_file.key, "release.json last within the folder"
        assert all(p[2] == RELEASE_CACHE for p in s3.puts)
        s3 = FakeS3(fail={lr.pinned[2].key})
        assert upload_release(s3, "b", lr, files, log=lambda _: None) == 1
        assert lr.doc_file.key not in s3.objects, "nothing after a failure, release.json above all"

        node_ok = lambda args: {"ok": True, "id": rid, "bankEntries": 1, "bankCards": 1, "catalogCards": 1, "sessions": "skipped"}
        cfg_file = Path(tmp) / "config.json"
        cfg_file.write_text(json.dumps(cfg))
        tgt = Target("a" * 32, "b" * 32, "c" * 64, "card-art", "https://cdn.example.org")
        same_models = {"0.3.0": {"ortWeb": "1.29.0", "bundledRelease": {"id": "f" * 16, "detectorSha256": refs["detector"]["sha256"], "recognizerSha256": refs["recognizer"]["sha256"]}}}
        new_models = {"0.3.0": {"ortWeb": "1.29.0", "bundledRelease": {"id": "f" * 16, "detectorSha256": "1" * 64, "recognizerSha256": refs["recognizer"]["sha256"]}}}
        no_pointer = lambda url, **k: (200, {}, json.dumps(cfg).encode()) if url.split("?")[0].endswith(CONFIG_KEY) else (404, {}, b"")
        details_data = json.dumps({"schemaVersion": 1, "cards": {}}).encode()
        details_path = Path(tmp) / f"details-{hashlib.sha256(details_data).hexdigest()[:8]}.json"
        details_path.write_bytes(details_data)
        args = SimpleNamespace(release=str(folder), legal=str(legal), min_version="0.3.0", max_version=None, sessions=False,
                               fix_metadata=False, dry_run=True, details=None, config=str(cfg_file), set_pointer=False)
        pr = lambda a, s3, **k: publish_release(a, tgt, s3=s3, node=k.pop("node", node_ok), log=lambda _: None, get=no_pointer,
                                                runtimes=k.pop("runtimes", same_models), **k)
        assert refused(lambda: pr(args, FakeS3())), "dry run: a config without the pointer is refused before anything"
        s3 = FakeS3()
        assert pr(SimpleNamespace(**{**vars(args), "set_pointer": True}), s3) == 0 and not s3.puts, "dry run writes nothing"
        assert cfg_file.read_text() == json.dumps(cfg), "a dry run leaves the config file as it was"
        assert refused(lambda: pr(SimpleNamespace(**{**vars(args), "min_version": None}), FakeS3()))
        assert refused(lambda: pr(args, FakeS3(), node=lambda a: {"ok": False, "reason": "x"})), "the runtime's check refuses"
        assert refused(lambda: pr(SimpleNamespace(**{**vars(args), "set_pointer": True}), FakeS3(), runtimes=new_models)), "a new model needs --sessions"
        assert pr(SimpleNamespace(**{**vars(args), "set_pointer": True, "sessions": True}), FakeS3(), runtimes=new_models) == 0
        s3 = FakeS3()
        assert refused(lambda: pr(SimpleNamespace(**{**vars(args), "details": str(details_path)}), s3)), "details not named in the config: refused before uploads"
        assert not s3.puts
        args.dry_run = False
        s3 = FakeS3()
        assert pr(SimpleNamespace(**{**vars(args), "set_pointer": True}), s3, verify_live=lambda *a, **k: 1) == 1, "not live: stop"
        assert CONFIG_KEY not in s3.objects and cfg_file.read_text() == json.dumps(cfg), "nothing written to the config"
        args.set_pointer = True
        args.details = str(details_path)
        s3 = FakeS3()
        global verify
        real_verify, verify = verify, (lambda base, samples, get=None: 0)
        try:
            assert pr(args, s3, verify_live=lambda *a, **k: 0) == 0
        finally:
            verify = real_verify
        keys = [p[0] for p in s3.puts]
        assert keys[-1] == CONFIG_KEY and keys.index(lr.doc_file.key) < keys.index(f"data/{details_path.name}") < keys.index(CONFIG_KEY), "release, details, config last"
        written = json.loads(cfg_file.read_text())
        assert written["release"] == pointer_block(lr, "0.3.0", None) and "maximumExtensionVersion" not in written["release"]
        assert written["details"] == {"path": f"data/{details_path.name}", "sha256": hashlib.sha256(details_data).hexdigest()}, "--set-pointer writes details too"

        # verify-release-live against a fake CDN
        served = {f"{RELEASES_PREFIX}{rid}/{f.key.rsplit('/', 1)[1]}": f for f in files}
        def fake_get(url, origin=None, method="GET", headers=None, cors=True, sha_ok=True, pointer=True, legal_ok=True):
            path = url.split("cdn.example.org/", 1)[1].split("?")[0]
            if path == CONFIG_KEY:
                return 200, {"content-type": "application/json"}, json.dumps({**cfg, **({"release": pointer_block(lr, "0.3.0", None)} if pointer else {})}).encode()
            f = served.get(path)
            if not f:
                return 404, {}, b""
            h = {"content-type": f.content_type, "cache-control": RELEASE_CACHE}
            if cors and origin:
                h["access-control-allow-origin"] = origin
            if headers and f.content_type == "application/json":
                h["content-encoding"] = "zstd"
            data = f.data if sha_ok or not path.endswith("bank.json") else b"x"
            return 200, h, (b"changed" if not legal_ok and path.endswith("NOTICE") else data)
        legal_shas = {f.key.rsplit("/", 1)[1]: f.sha256 for f in lr.legal}
        import contextlib, io
        with contextlib.redirect_stdout(io.StringIO()):
            assert verify_release_live("https://cdn.example.org", get=fake_get, node=node_ok, extension_ids=["e" * 32]) == 0
            assert verify_release_live("https://cdn.example.org", candidate=rid, get=fake_get, node=node_ok, extension_ids=["e" * 32], expect_files=legal_shas) == 0
            assert verify_release_live("https://cdn.example.org", candidate=rid, get=lambda *a, **k: fake_get(*a, **k, legal_ok=False), node=node_ok, extension_ids=["e" * 32], expect_files=legal_shas) > 0, "a legal file changed"
            assert verify_release_live("https://cdn.example.org", get=fake_get, node=node_ok, extension_ids=[]) > 0, "no extension ids"
            assert verify_release_live("https://cdn.example.org", get=lambda *a, **k: fake_get(*a, **k, cors=False), node=node_ok, extension_ids=["e" * 32]) > 0
            assert verify_release_live("https://cdn.example.org", get=lambda *a, **k: fake_get(*a, **k, sha_ok=False), node=node_ok, extension_ids=["e" * 32]) > 0
            assert verify_release_live("https://cdn.example.org", get=fake_get, node=lambda a: {"ok": False, "reason": "x"}, extension_ids=["e" * 32]) > 0
            assert verify_release_live("https://cdn.example.org", expect_id="ffffffffffffffff", get=fake_get, node=node_ok, extension_ids=["e" * 32]) > 0
            assert verify_release_live("https://cdn.example.org", expect_id=rid, get=lambda *a, **k: fake_get(*a, **k, pointer=False), node=node_ok, extension_ids=["e" * 32]) > 0, "expected a pointer, none live"
            assert verify_release_live("https://cdn.example.org", get=lambda *a, **k: fake_get(*a, **k, pointer=False), node=node_ok, extension_ids=["e" * 32]) == 0, "no pointer, none expected"

            # the publish --config gate
            ptr = pointer_block(lr, "0.3.0", None)
            assert pointer_gate("https://cdn.example.org", ptr, get=fake_get, runtimes=same_models, verify_live=lambda *a, **k: 1) is None, "the live pointer again: not re-checked"
            seen: list[str] = []
            pointer_gate("https://cdn.example.org", ptr, get=lambda url, **k: (seen.append(url), fake_get(url, **k, pointer=False))[1],
                         runtimes=same_models, verify_live=lambda *a, **k: 0)
            assert seen and all("?cb=" in u for u in seen), "the gate never asks for a bare public URL"
            off = lambda *a, **k: fake_get(*a, **k, pointer=False)
            assert pointer_gate("https://cdn.example.org", ptr, get=off, runtimes=same_models, verify_live=lambda *a, **k: 0) is None
            assert pointer_gate("https://cdn.example.org", ptr, get=off, runtimes=same_models, verify_live=lambda *a, **k: 1), "a new pointer that does not verify"
            assert pointer_gate("https://cdn.example.org", ptr, get=off, runtimes={"0.3.0": {"ortWeb": "1.30.0"}}, verify_live=lambda *a, **k: 0), "another ORT minor"
            assert pointer_gate("https://cdn.example.org", {**ptr, "id": "f" * 16, "path": f"vision/releases/{'f' * 16}/release.json"}, get=off, runtimes=same_models, verify_live=lambda *a, **k: 0), "no document"

            # details gate: a config may only name a details file this run publishes, or one live with those bytes
            live_d = json.dumps({"schemaVersion": 1, "cards": {"1": ["A", None, None]}}).encode()
            live_entry = {"path": f"data/details-{hashlib.sha256(live_d).hexdigest()[:8]}.json", "sha256": hashlib.sha256(live_d).hexdigest()}
            stale_entry = {"path": "data/details-2442d28d.json", "sha256": "2442d28d" + "0" * 56}
            live_cfg = json.dumps(cfg | {"details": live_entry}).encode()

            def cdn(url, **k):
                path = url.split("?")[0].removeprefix("https://cdn.example.org/")
                if path == CONFIG_KEY:
                    return 200, {}, live_cfg
                return (200, {}, live_d) if path == live_entry["path"] else (404, {}, b"")

            gate = lambda entry, d=None, get=cdn: details_gate("https://cdn.example.org", json.dumps(cfg | ({"details": entry} if entry else {})).encode(), d, get=get)
            assert gate(None) is None, "no details entry"
            assert gate(live_entry) is None, "the live file, same bytes"
            msg = gate(stale_entry)
            assert msg and "HTTP 404" in msg and live_entry["path"] in msg, "a file never published: refused, naming the live entry"
            assert gate({**live_entry, "sha256": "0" * 64}), "the live path with other bytes"
            assert gate(stale_entry, get=lambda url, **k: (0, {"x-error": "offline"}, b"")), "cannot confirm: refused"
            mine = load_details(details_path)
            asked = []
            assert gate({"path": mine.key, "sha256": mine.sha256}, mine, get=lambda url, **k: asked.append(url)) is None and not asked, \
                "the file this run publishes first: no fetch"

            # 2026-10-26 replayed: publish-release --set-pointer, no --details, a config naming a file that is not there
            stale_file = Path(tmp) / "stale-config.json"
            stale_file.write_text(json.dumps(cfg | {"details": stale_entry}))
            replay = SimpleNamespace(**{**vars(args), "config": str(stale_file), "details": None, "set_pointer": True, "dry_run": True})
            s3 = FakeS3()
            assert refused(lambda: publish_release(replay, tgt, s3=s3, node=node_ok, log=lambda _: None, get=cdn, runtimes=same_models)), \
                "the dry run refuses it"
            assert not s3.puts and json.loads(stale_file.read_text())["details"] == stale_entry, "nothing written, config untouched"
            fixed = SimpleNamespace(**{**vars(replay), "config": str(Path(tmp) / "fixed-config.json")})
            Path(fixed.config).write_text(json.dumps(cfg | {"details": live_entry}))
            assert publish_release(fixed, tgt, s3=FakeS3(), node=node_ok, log=lambda _: None, get=cdn, runtimes=same_models) == 0, \
                "with the live entry it goes ahead"


if __name__ == "__main__":
    sys.exit(main())
