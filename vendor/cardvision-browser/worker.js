var Pr=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var up="geometric-index-packed";var pI="cardvision-geometric-index",wt=class extends Error{code;constructor(t,n){super(n),this.name="GeometricIndexError",this.code=t}},hI=/^[0-9a-f]{16}$/,Ps=/^[0-9a-f]{64}$/,lp=40,mn=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),gn=e=>typeof e=="number"&&Number.isInteger(e)&&e>=0,rt=e=>{throw new wt("manifest",e)};function fI(e){return typeof e!="string"||e.trim()===""||e.includes("\\")||e.includes("://")||e.startsWith("/")||/^[A-Za-z]:/.test(e)?!1:!e.split("/").includes("..")}function mI(e){if(!mn(e))return rt("the manifest is not an object");if(e.kind!==up)return rt(`the manifest's kind is not ${up}`);if(e.schemaVersion!==1)return rt(`schemaVersion ${String(e.schemaVersion)} is not 1`);let t=e.source,n=e.bank;if(!mn(t)||typeof t.sha256!="string"||!Ps.test(t.sha256))return rt("source.sha256 must be 64 hex digits");if(!mn(n)||typeof n.sha256!="string"||!Ps.test(n.sha256))return rt("bank.sha256 must be 64 hex digits");if(typeof e.opencv!="string")return rt("opencv must be a version string");let o=e.features;if(!mn(o)||o.type!=="orb")return rt("features.type must be orb: only ORB indexes are packed");if(!Array.isArray(e.shards)||e.shards.length===0)return rt("shards must be a non-empty list");if(!Array.isArray(e.cards))return rt("cards must be a list");let u=[],l=[],d=0;for(let[a,p]of e.shards.entries()){if(!mn(p)||!fI(p.path)||typeof p.sha256!="string"||!Ps.test(p.sha256)||!gn(p.rows))return rt(`shards[${a}] must have a relative path, a 64-hex sha256 and a row count`);u.push({path:p.path,sha256:p.sha256,rows:p.rows}),l.push(d),d+=p.rows}let c=u.map(()=>0),s=new Set,r=[],i=0;for(let[a,p]of e.cards.entries()){if(!mn(p)||typeof p.cardId!="string"||p.cardId===""||s.has(p.cardId))return rt(`cards[${a}] has a missing or repeated cardId`);let h=`cards[${a}] (${p.cardId})`;if(typeof p.artV!="string"||!hI.test(p.artV))return rt(`${h}: artV must be 16 lowercase hex digits`);if(!gn(p.width)||!gn(p.height)||!gn(p.n)||!gn(p.shard)||!gn(p.offset))return rt(`${h}: width, height, n, shard and offset must be whole numbers`);let{shard:m,offset:b,n:x}=p;if(m>=u.length)return rt(`${h}: shard ${m} does not exist`);if(m<i)return rt(`${h}: cards must be in the shards' order`);if(b!==c[m])return rt(`${h}: offset ${b} is not where the shard's cards leave off (${c[m]})`);i=m,c[m]=b+x,s.add(p.cardId),r.push({cardId:p.cardId,artV:p.artV,width:p.width,height:p.height,start:l[m]+b,n:x})}for(let[a,p]of u.entries())if(c[a]!==p.rows)return rt(`shards[${a}] has ${p.rows} rows but its cards hold ${c[a]}`);return{sourceSha256:t.sha256,bankSha256:n.sha256,opencv:e.opencv,features:o,cards:r,shards:u,shardStart:l,rows:d}}var Cs=class{constructor(t){this.manifest=t;this.desc=new Uint8Array(t.rows*32),this.xy=new Float32Array(t.rows*2)}manifest;desc;xy;place(t,n){let o=this.manifest.shards[t];if(n.byteLength!==o.rows*lp)throw new wt("shard",`${o.path}: ${n.byteLength} bytes is not ${o.rows} rows of ${lp}`);let u=this.manifest.shardStart[t];this.desc.set(new Uint8Array(n,0,o.rows*32),u*32),this.xy.set(new Float32Array(n,o.rows*32,o.rows*2),u*2)}finish(){let{manifest:t}=this,n=new Uint32Array(t.rows);for(let[o,u]of t.cards.entries())n.fill(o,u.start,u.start+u.n);return{cards:t.cards,desc:this.desc,xy:this.xy,rowCard:n,rows:t.rows,sourceSha256:t.sourceSha256,bankSha256:t.bankSha256,opencv:t.opencv,features:t.features}}};async function ks(e){let t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t),n=>n.toString(16).padStart(2,"0")).join("")}function gI(e,t,n){if(e.bankSha256!==t)throw new wt("bank-sha",`the index was built for bank ${e.bankSha256.slice(0,16)}, the release's is ${t.slice(0,16)}`);let o=new Set(e.cards.map(l=>l.cardId)),u=n.filter(l=>!o.has(l));if(u.length>0)throw new wt("bank-ids",`the index has no entry for ${u.length} card(s) of the bank (e.g. ${u.slice(0,3).join(", ")})`)}async function dp(e,t){let n=t.fetch??((T,I)=>fetch(T,I)),o=t.cache??(typeof caches>"u"?void 0:caches),u=typeof AbortController>"u"?null:new AbortController,l=async(T,I)=>{let A;try{A=await n(T,u?{signal:u.signal}:void 0)}catch(k){throw new wt("shard",`${I}: ${k instanceof Error?k.message:String(k)}`)}if(!A.ok)throw new wt("shard",`${I}: HTTP ${A.status}`);return A},d,c=await(await l(e,"manifest")).arrayBuffer().catch(T=>{throw new wt("shard",`manifest: ${T instanceof Error?T.message:String(T)}`)});if(t.manifestSha256!==void 0){let T=await ks(c);if(T!==t.manifestSha256.toLowerCase())throw new wt("manifest-sha",`the manifest's SHA-256 ${T.slice(0,16)} is not the pinned ${t.manifestSha256.slice(0,16)}`)}try{d=JSON.parse(new TextDecoder().decode(c))}catch(T){throw new wt("manifest",`the manifest is not JSON: ${T instanceof Error?T.message:String(T)}`)}let s=mI(d),r=new URL(e,globalThis.location?.href).href;gI(s,t.bankSha256,t.bankIds);let i=o?await o.open(pI).catch(()=>{}):void 0,a=new Cs(s),p=async T=>{let I=s.shards[T],A=new URL(I.path,r).href,k=i?await i.match(A).catch(()=>{}):void 0;if(k){let G=await k.arrayBuffer();if(await ks(G)===I.sha256)return G;await i?.delete(A).catch(()=>!1)}let O=await(await l(A,I.path)).arrayBuffer(),z=await ks(O);if(z!==I.sha256)throw new wt("hash",`${I.path}: SHA-256 ${z.slice(0,16)} is not the manifest's ${I.sha256.slice(0,16)}`);return await i?.put(A,new Response(O.slice(0))).catch(()=>{}),O},h=0,m=!1,b=async()=>{try{for(;;){if(m)return;let T=h++;if(T>=s.shards.length)return;let I=await p(T);if(m)return;a.place(T,I)}}catch(T){if(!m)throw m=!0,u?.abort(),T}},x=Array.from({length:Math.min(2,s.shards.length)},b),y=(await Promise.allSettled(x)).find(T=>T.status==="rejected");if(y)throw y.reason;let S=a.finish();return i&&await bI(i,new URL(".",r).href),S}async function bI(e,t){try{let n=await e.keys();await Promise.all(n.filter(o=>!o.url.startsWith(t)).map(o=>e.delete(o)))}catch{}}var Ds=new Map;function cp(e,t={}){let n=String(e),o=Ds.get(n);return o===void 0&&(o=(async()=>{let u=await import(n);if(typeof u.default!="function")throw new Error(`${n}: not an OpenCV.js ES module (no default export)`);let l={};t.wasmBinary!==void 0&&(l.wasmBinary=t.wasmBinary);let d=await u.default(l);if(typeof d.ORB!="function"||typeof d.estimateAffine2D!="function")throw new Error(`${n}: this OpenCV.js lacks the functions the geometric stage needs`);return d})(),o.catch(()=>Ds.delete(n)),Ds.set(n,o)),o}function yI(e){if(e.length%32!==0)throw new Error(`queries: ${e.length} bytes is not a whole number of 32-byte descriptors`);return e.length/32}function _I(e){if(e.length%32!==0)throw new Error(`descriptors: ${e.length} bytes is not a whole number of 32-byte descriptors`);return e.length/32}function wI(e){return{best:new Uint32Array(e).fill(4294967295),second:new Uint32Array(e).fill(4294967295),dBest:new Uint16Array(e).fill(65535),dSecond:new Uint16Array(e).fill(65535)}}var Ji=23,Rs=(1<<Ji)-1,pp=Rs,hp=4294967295,vI={workgroupSize:64,queriesPerInvocation:2,tileRows:256,chunkRows:8192,maxQueriesPerDispatch:6144};function fp(e){return{maxStorageBufferBindingSize:e.limits.maxStorageBufferBindingSize,maxBufferSize:e.limits.maxBufferSize}}function xI(e,t,n){let o=u=>Array.from({length:t},(l,d)=>u(d)).join(`
`);return`
struct Params { queries: u32, rows: u32, base: u32, chunkRows: u32, firstChunk: u32, chunks: u32 }
@group(0) @binding(0) var<storage, read> desc: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> queries: array<vec4<u32>>;
@group(0) @binding(2) var<storage, read_write> partial: array<vec2<u32>>;
@group(0) @binding(3) var<uniform> p: Params;
var<workgroup> tile: array<vec4<u32>, ${n*2}>;

@compute @workgroup_size(${e})
fn main(@builtin(workgroup_id) wg: vec3<u32>, @builtin(local_invocation_index) li: u32) {
  let first = (wg.y * ${e}u + li) * ${t}u;
${o(u=>`  let qi${u} = min(first + ${u}u, max(p.queries, 1u) - 1u);
  let qa${u} = queries[qi${u} * 2u];
  let qb${u} = queries[qi${u} * 2u + 1u];
  var b${u} = 0xffffffffu;
  var s${u} = 0xffffffffu;`)}
  let start = wg.x * p.chunkRows;
  let end = min(start + p.chunkRows, p.rows);
  for (var t = start; t < end; t += ${n}u) {
    let n = min(${n}u, end - t);
    workgroupBarrier();
    for (var i = li; i < n * 2u; i += ${e}u) {
      tile[i] = desc[t * 2u + i];
    }
    workgroupBarrier();
    let row0 = p.base + t;
    for (var r = 0u; r < n; r++) {
      let a = tile[r * 2u];
      let b = tile[r * 2u + 1u];
      let row = row0 + r;
${o(u=>`      {
        let c = countOneBits(qa${u} ^ a) + countOneBits(qb${u} ^ b);
        let k = ((c.x + c.y + c.z + c.w) << ${Ji}u) | row;
        s${u} = min(s${u}, max(b${u}, k));
        b${u} = min(b${u}, k);
      }`)}
    }
  }
${o(u=>`  if (first + ${u}u < p.queries) {
    partial[(first + ${u}u) * p.chunks + p.firstChunk + wg.x] = vec2<u32>(b${u}, s${u});
  }`)}
}
`}var $I=`
struct Params { queries: u32, chunks: u32 }
@group(0) @binding(0) var<storage, read> partial: array<vec2<u32>>;
@group(0) @binding(1) var<storage, read_write> merged: array<vec2<u32>>;
@group(0) @binding(2) var<uniform> p: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let q = id.x;
  if (q >= p.queries) { return; }
  var b = 0xffffffffu;
  var s = 0xffffffffu;
  for (var c = 0u; c < p.chunks; c++) {
    let k = partial[q * p.chunks + c];
    s = min(min(s, k.y), max(b, k.x));
    b = min(b, k.x);
  }
  merged[q] = vec2<u32>(b, s);
}
`;async function mp(e,t,n={}){let o=_I(t);if(o>pp)throw new Error(`descriptors: ${o} rows; the GPU vote holds at most ${pp}`);let u={...vI,...n};for(let[D,Q]of Object.entries(u))if(Q!==void 0&&(!Number.isInteger(Q)||Q<1))throw new Error(`gpuVoter: ${D} must be a positive integer`);if(u.chunkRows%u.tileRows!==0)throw new Error("gpuVoter: chunkRows must be a multiple of tileRows");let l=e.limits,d=Math.min(l.maxStorageBufferBindingSize,l.maxBufferSize),c=Math.floor(d/32/u.chunkRows)*u.chunkRows;n.maxRowsPerBuffer!==void 0&&(c=Math.min(c,Math.floor(n.maxRowsPerBuffer/u.chunkRows)*u.chunkRows));let s=l.maxComputeWorkgroupsPerDimension;if(c=Math.min(c,s*u.chunkRows),c<u.chunkRows)throw new Error("gpuVoter: one chunk of rows does not fit in a storage buffer; lower chunkRows");let r=Math.max(1,Math.ceil(o/u.chunkRows)),i=u.workgroupSize*u.queriesPerInvocation,a=Math.floor(d/(r*8)),p=Math.max(1,Math.min(u.maxQueriesPerDispatch,a,s*i));if(u.tileRows*2*16>l.maxComputeWorkgroupStorageSize)throw new Error("gpuVoter: tileRows exceeds the device's workgroup memory");if(u.workgroupSize>l.maxComputeInvocationsPerWorkgroup)throw new Error("gpuVoter: workgroupSize exceeds the device's limit");e.pushErrorScope("validation"),e.pushErrorScope("out-of-memory");let h=await e.createComputePipelineAsync({layout:"auto",compute:{module:e.createShaderModule({code:xI(u.workgroupSize,u.queriesPerInvocation,u.tileRows)}),entryPoint:"main"}}),m=await e.createComputePipelineAsync({layout:"auto",compute:{module:e.createShaderModule({code:$I}),entryPoint:"main"}}),b=[];for(let D=0;D<o||b.length===0;D+=c){let Q=Math.min(c,o-D),w=e.createBuffer({size:Math.max(Q,1)*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});Q>0&&e.queue.writeBuffer(w,0,t,D*32,Q*32);let C=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});if(b.push({buffer:w,rows:Q,base:D,firstChunk:D/u.chunkRows,chunks:Math.max(1,Math.ceil(Q/u.chunkRows)),params:C}),Q<=0)break}let x=e.createBuffer({size:p*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),_=e.createBuffer({size:p*r*8,usage:GPUBufferUsage.STORAGE}),y=e.createBuffer({size:p*8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),S=e.createBuffer({size:p*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),T=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),I=b.map(D=>e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:D.buffer}},{binding:1,resource:{buffer:x}},{binding:2,resource:{buffer:_}},{binding:3,resource:{buffer:D.params}}]})),A=e.createBindGroup({layout:m.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:_}},{binding:1,resource:{buffer:y}},{binding:2,resource:{buffer:T}}]}),k=await e.popErrorScope(),O=await e.popErrorScope(),z=k??O;if(z)throw new Error(`gpuVoter: ${z.message}`);let G=!1,Y=Promise.resolve();async function W(D,Q,w,C){e.queue.writeBuffer(x,0,D.buffer,D.byteOffset,Q*32);for(let q of b)e.queue.writeBuffer(q.params,0,new Uint32Array([Q,q.rows,q.base,u.chunkRows,q.firstChunk,r,0,0]));e.queue.writeBuffer(T,0,new Uint32Array([Q,r,0,0]));let F=e.createCommandEncoder(),V=F.beginComputePass();V.setPipeline(h),b.forEach((q,M)=>{V.setBindGroup(0,I[M]),V.dispatchWorkgroups(q.chunks,Math.ceil(Q/i))}),V.setPipeline(m),V.setBindGroup(0,A),V.dispatchWorkgroups(Math.ceil(Q/64)),V.end(),F.copyBufferToBuffer(y,0,S,0,Q*8),e.queue.submit([F.finish()]),await S.mapAsync(GPUMapMode.READ,0,Q*8);let U=new Uint32Array(S.getMappedRange(0,Q*8).slice(0));S.unmap();for(let q=0;q<Q;q+=1){let M=U[q*2],Z=U[q*2+1];M!==hp&&(w.best[C+q]=M&Rs,w.dBest[C+q]=M>>>Ji),Z!==hp&&(w.second[C+q]=Z&Rs,w.dSecond[C+q]=Z>>>Ji)}}return{knn2(D){let Q=async()=>{if(G)throw new Error("gpuVoter: used after dispose");let C=yI(D),F=wI(C);if(o===0)return F;for(let V=0;V<C;V+=p){let U=Math.min(p,C-V),q=D.subarray(V*32,(V+U)*32);q.byteOffset%4!==0&&(q=q.slice()),await W(q,U,F,V)}return F},w=Y.then(Q,Q);return Y=w.catch(()=>{}),w},dispose(){G||(G=!0,Y.then(()=>{for(let D of b)D.buffer.destroy(),D.params.destroy();for(let D of[x,_,y,S,T])D.destroy()}))}}}var TI=Object.create,Do=Object.defineProperty,SI=Object.getOwnPropertyDescriptor,II=Object.getOwnPropertyNames,OI=Object.getPrototypeOf,EI=Object.prototype.hasOwnProperty,pu=(e=>typeof Pr<"u"?Pr:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof Pr<"u"?Pr:t)[n]}):e)(function(e){if(typeof Pr<"u")return Pr.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),R=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(o){throw n=[o],o}},ie=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}},un=(e,t)=>{for(var n in t)Do(e,n,{get:t[n],enumerable:!0})},wy=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let u of II(t))!EI.call(e,u)&&u!==n&&Do(e,u,{get:()=>t[u],enumerable:!(o=SI(t,u))||o.enumerable});return e},ce=(e,t,n)=>(n=e!=null?TI(OI(e)):{},wy(t||!e||!e.__esModule?Do(n,"default",{value:e,enumerable:!0}):n,e)),Tn=e=>wy(Do({},"__esModule",{value:!0}),e),Hn,ar,en,gp,vy,xy=R(()=>{"use strict";Hn=new Map,ar=[],en=(e,t,n)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let o=Hn.get(e);if(o===void 0)Hn.set(e,{backend:t,priority:n});else{if(o.priority>n)return;if(o.priority===n&&o.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${n}`)}if(n>=0){let u=ar.indexOf(e);u!==-1&&ar.splice(u,1);for(let l=0;l<ar.length;l++)if(Hn.get(ar[l]).priority<=n){ar.splice(l,0,e);return}ar.push(e)}return}throw new TypeError("not a valid backend")},gp=async e=>{let t=Hn.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let n=!!t.initPromise;try{return n||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(o){return n||(t.error=`${o}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},vy=async e=>{let t=e.executionProviders||[],n=t.map(s=>typeof s=="string"?s:s.name),o=n.length===0?ar:n,u,l=[],d=new Set;for(let s of o){let r=await gp(s);typeof r=="string"?l.push({name:s,err:r}):(u||(u=r),u===r&&d.add(s))}if(!u)throw new Error(`no available backend found. ERR: ${l.map(s=>`[${s.name}] ${s.err}`).join(", ")}`);for(let{name:s,err:r}of l)n.includes(s)&&console.warn(`removing requested execution provider "${s}" from session options because it is not available: ${r}`);let c=t.filter(s=>d.has(typeof s=="string"?s:s.name));return[u,new Proxy(e,{get:(s,r)=>r==="executionProviders"?c:Reflect.get(s,r)})]}}),AI=R(()=>{"use strict";xy()}),$y,PI=R(()=>{"use strict";$y="1.29.0"}),Ns,et,Ty=R(()=>{"use strict";PI(),Ns="warning",et={wasm:{},webgl:{},webgpu:{},versions:{common:$y},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ns=e}},get logLevel(){return Ns}},Object.defineProperty(et,"logLevel",{enumerable:!0})}),le,kI=R(()=>{"use strict";Ty(),le=et}),Sy,Iy,CI=R(()=>{"use strict";Sy=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);n.width=e.dims[3],n.height=e.dims[2];let o=n.getContext("2d");if(o!=null){let u,l;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(u=e.dims[2],l=e.dims[3]):(u=e.dims[3],l=e.dims[2]);let d=t?.format!==void 0?t.format:"RGB",c=t?.norm,s,r;c===void 0||c.mean===void 0?s=[255,255,255,255]:typeof c.mean=="number"?s=[c.mean,c.mean,c.mean,c.mean]:(s=[c.mean[0],c.mean[1],c.mean[2],0],c.mean[3]!==void 0&&(s[3]=c.mean[3])),c===void 0||c.bias===void 0?r=[0,0,0,0]:typeof c.bias=="number"?r=[c.bias,c.bias,c.bias,c.bias]:(r=[c.bias[0],c.bias[1],c.bias[2],0],c.bias[3]!==void 0&&(r[3]=c.bias[3]));let i=l*u,a=0,p=i,h=i*2,m=-1;d==="RGBA"?(a=0,p=i,h=i*2,m=i*3):d==="RGB"?(a=0,p=i,h=i*2):d==="RBG"&&(a=0,h=i,p=i*2);for(let b=0;b<l;b++)for(let x=0;x<u;x++){let _=(e.data[a++]-r[0])*s[0],y=(e.data[p++]-r[1])*s[1],S=(e.data[h++]-r[2])*s[2],T=m===-1?255:(e.data[m++]-r[3])*s[3];o.fillStyle="rgba("+_+","+y+","+S+","+T+")",o.fillRect(x,b,1,1)}if("toDataURL"in n)return n.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Iy=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),o;if(n!=null){let u,l,d;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(u=e.dims[2],l=e.dims[1],d=e.dims[3]):(u=e.dims[3],l=e.dims[2],d=e.dims[1]);let c=t!==void 0&&t.format!==void 0?t.format:"RGB",s=t?.norm,r,i;s===void 0||s.mean===void 0?r=[255,255,255,255]:typeof s.mean=="number"?r=[s.mean,s.mean,s.mean,s.mean]:(r=[s.mean[0],s.mean[1],s.mean[2],255],s.mean[3]!==void 0&&(r[3]=s.mean[3])),s===void 0||s.bias===void 0?i=[0,0,0,0]:typeof s.bias=="number"?i=[s.bias,s.bias,s.bias,s.bias]:(i=[s.bias[0],s.bias[1],s.bias[2],0],s.bias[3]!==void 0&&(i[3]=s.bias[3]));let a=l*u;if(t!==void 0&&(t.format!==void 0&&d===4&&t.format!=="RGBA"||d===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let p=4,h=0,m=1,b=2,x=3,_=0,y=a,S=a*2,T=-1;c==="RGBA"?(_=0,y=a,S=a*2,T=a*3):c==="RGB"?(_=0,y=a,S=a*2):c==="RBG"&&(_=0,S=a,y=a*2),o=n.createImageData(u,l);for(let I=0;I<l*u;h+=p,m+=p,b+=p,x+=p,I++)o.data[h]=(e.data[_++]-i[0])*r[0],o.data[m]=(e.data[y++]-i[1])*r[1],o.data[b]=(e.data[S++]-i[2])*r[2],o.data[x]=T===-1?255:(e.data[T++]-i[3])*r[3]}else throw new Error("Can not access image data");return o}}),Yi,Oy,Ey,Ay,Py,ky,DI=R(()=>{"use strict";yl(),Yi=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:n,width:o}=t,u=t.norm??{mean:255,bias:0},l,d;typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:l=[u.mean[0],u.mean[1],u.mean[2],u.mean[3]??255],typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:d=[u.bias[0],u.bias[1],u.bias[2],u.bias[3]??0];let c=t.format!==void 0?t.format:"RGBA",s=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",r=n*o,i=s==="RGBA"?new Float32Array(r*4):new Float32Array(r*3),a=4,p=0,h=1,m=2,b=3,x=0,_=r,y=r*2,S=-1;c==="RGB"&&(a=3,p=0,h=1,m=2,b=-1),s==="RGBA"?S=r*3:s==="RBG"?(x=0,y=r,_=r*2):s==="BGR"&&(y=0,_=r,x=r*2);for(let T=0;T<r;T++,p+=a,m+=a,h+=a,b+=a)i[x++]=(e[p]+d[0])/l[0],i[_++]=(e[h]+d[1])/l[1],i[y++]=(e[m]+d[2])/l[2],S!==-1&&b!==-1&&(i[S++]=(e[b]+d[3])/l[3]);return s==="RGBA"?new ft("float32",i,[1,4,n,o]):new ft("float32",i,[1,3,n,o])},Oy=async(e,t)=>{let n=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,o=typeof ImageData<"u"&&e instanceof ImageData,u=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,l=typeof e=="string",d,c=t??{},s=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},r=i=>typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||i instanceof OffscreenCanvas?i.getContext("2d"):null;if(n){let i=s();i.width=e.width,i.height=e.height;let a=r(i);if(a!=null){let p=e.height,h=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(p=t.resizedHeight,h=t.resizedWidth),t!==void 0){if(c=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");c.tensorFormat="RGBA",c.height=p,c.width=h}else c.tensorFormat="RGBA",c.height=p,c.width=h;a.drawImage(e,0,0),d=a.getImageData(0,0,h,p).data}else throw new Error("Can not access image data")}else if(o){let i,a;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(i=t.resizedHeight,a=t.resizedWidth):(i=e.height,a=e.width),t!==void 0&&(c=t),c.format="RGBA",c.height=i,c.width=a,t!==void 0){let p=s();p.width=a,p.height=i;let h=r(p);if(h!=null)h.putImageData(e,0,0),d=h.getImageData(0,0,a,i).data;else throw new Error("Can not access image data")}else d=e.data}else if(u){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let i=s();i.width=e.width,i.height=e.height;let a=r(i);if(a!=null){let p=e.height,h=e.width;return a.drawImage(e,0,0,h,p),d=a.getImageData(0,0,h,p).data,c.height=p,c.width=h,Yi(d,c)}else throw new Error("Can not access image data")}else{if(l)return new Promise((i,a)=>{let p=s(),h=r(p);if(!e||!h)return a();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{p.width=m.width,p.height=m.height,h.drawImage(m,0,0,p.width,p.height);let b=h.getImageData(0,0,p.width,p.height);c.height=p.height,c.width=p.width,i(Yi(b.data,c))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(d!==void 0)return Yi(d,c);throw new Error("Input data provided is not supported - aborted tensor creation")},Ey=(e,t)=>{let{width:n,height:o,download:u,dispose:l}=t,d=[1,o,n,4];return new ft({location:"texture",type:"float32",texture:e,dims:d,download:u,dispose:l})},Ay=(e,t)=>{let{dataType:n,dims:o,download:u,dispose:l}=t;return new ft({location:"gpu-buffer",type:n??"float32",gpuBuffer:e,dims:o,download:u,dispose:l})},Py=(e,t)=>{let{dataType:n,dims:o,download:u,dispose:l}=t;return new ft({location:"ml-tensor",type:n??"float32",mlTensor:e,dims:o,download:u,dispose:l})},ky=(e,t,n)=>new ft({location:"cpu-pinned",type:e,data:t,dims:n??[t.length]})}),Xr,li,zs,Cy,RI=R(()=>{"use strict";Xr=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),li=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),zs=!1,Cy=()=>{if(!zs){zs=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,n=globalThis.Float16Array,o=typeof n<"u"&&n.from;e&&(Xr.set("int64",BigInt64Array),li.set(BigInt64Array,"int64")),t&&(Xr.set("uint64",BigUint64Array),li.set(BigUint64Array,"uint64")),o?(Xr.set("float16",n),li.set(n,"float16")):Xr.set("float16",Uint16Array)}}}),Dy,Ry,NI=R(()=>{"use strict";yl(),Dy=e=>{let t=1;for(let n=0;n<e.length;n++){let o=e[n];if(typeof o!="number"||!Number.isSafeInteger(o))throw new TypeError(`dims[${n}] must be an integer, got: ${o}`);if(o<0)throw new RangeError(`dims[${n}] must be a non-negative integer, got: ${o}`);t*=o}return t},Ry=(e,t)=>{switch(e.location){case"cpu":return new ft(e.type,e.data,t);case"cpu-pinned":return new ft({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new ft({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new ft({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new ft({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),ft,yl=R(()=>{"use strict";CI(),DI(),RI(),NI(),ft=class{constructor(e,t,n){Cy();let o,u;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,o=e.type,u=e.dims,e.location){case"cpu-pinned":{let d=Xr.get(o);if(!d)throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);if(!(e.data instanceof d))throw new TypeError(`buffer should be of type ${d.name}`);this.cpuData=e.data;break}case"texture":{if(o!=="float32")throw new TypeError(`unsupported type "${o}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint64"&&o!=="int8"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let d,c;if(typeof e=="string")if(o=e,c=n,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");d=t}else{let s=Xr.get(e);if(s===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&s===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${s.name} as data.`);e==="uint64"||e==="int64"?d=s.from(t,BigInt):d=s.from(t)}else if(t instanceof s)d=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")d=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&s!==Uint16Array)d=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${o} tensor's data must be type of ${s}`)}else if(c=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let s=typeof e[0];if(s==="string")o="string",d=e;else if(s==="boolean")o="bool",d=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${s}.`)}else if(e instanceof Uint8ClampedArray)o="uint8",d=Uint8Array.from(e);else{let s=li.get(e.constructor);if(s===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);o=s,d=e}if(c===void 0)c=[d.length];else if(!Array.isArray(c))throw new TypeError("A tensor's dims must be a number array");u=c,this.cpuData=d,this.dataLocation="cpu"}let l=Dy(u);if(this.cpuData&&l!==this.cpuData.length&&!((o==="uint4"||o==="int4")&&Math.ceil(l/2)===this.cpuData.length))throw new Error(`Tensor's size(${l}) does not match data length(${this.cpuData.length}).`);this.type=o,this.dims=u,this.size=l}static async fromImage(e,t){return Oy(e,t)}static fromTexture(e,t){return Ey(e,t)}static fromGpuBuffer(e,t){return Ay(e,t)}static fromMLTensor(e,t){return Py(e,t)}static fromPinnedBuffer(e,t,n){return ky(e,t,n)}toDataURL(e){return Sy(this,e)}toImageData(e){return Iy(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Ry(this,e)}}}),mt,Ny=R(()=>{"use strict";yl(),mt=ft}),vo,Bs,Gt,zt,tn,rn,zy=R(()=>{"use strict";Ty(),vo=(e,t)=>{(typeof et.trace>"u"?!et.wasm.trace:!et.trace)||console.timeStamp(`${e}::ORT::${t}`)},Bs=(e,t)=>{let n=new Error().stack?.split(/\r\n|\r|\n/g)||[],o=!1;for(let u=0;u<n.length;u++){if(o&&!n[u].includes("TRACE_FUNC")){let l=`FUNC_${e}::${n[u].trim().split(" ")[1]}`;t&&(l+=`::${t}`),vo("CPU",l);return}n[u].includes("TRACE_FUNC")&&(o=!0)}},Gt=e=>{(typeof et.trace>"u"?!et.wasm.trace:!et.trace)||Bs("BEGIN",e)},zt=e=>{(typeof et.trace>"u"?!et.wasm.trace:!et.trace)||Bs("END",e)},tn=e=>{(typeof et.trace>"u"?!et.wasm.trace:!et.trace)||console.time(`ORT::${e}`)},rn=e=>{(typeof et.trace>"u"?!et.wasm.trace:!et.trace)||console.timeEnd(`ORT::${e}`)}}),By,zI=R(()=>{"use strict";xy(),Ny(),zy(),By=class My{constructor(t){this.handler=t}async run(t,n,o){Gt(),tn("InferenceSession.run");let u={},l={};if(typeof t!="object"||t===null||t instanceof mt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let d=!0;if(typeof n=="object"){if(n===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(n instanceof mt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(n)){if(n.length===0)throw new TypeError("'fetches' cannot be an empty array.");d=!1;for(let r of n){if(typeof r!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(r)===-1)throw new RangeError(`'fetches' contains invalid output name: ${r}.`);u[r]=null}if(typeof o=="object"&&o!==null)l=o;else if(typeof o<"u")throw new TypeError("'options' must be an object.")}else{let r=!1,i=Object.getOwnPropertyNames(n);for(let a of this.outputNames)if(i.indexOf(a)!==-1){let p=n[a];(p===null||p instanceof mt)&&(r=!0,d=!1,u[a]=p)}if(r){if(typeof o=="object"&&o!==null)l=o;else if(typeof o<"u")throw new TypeError("'options' must be an object.")}else l=n}}else if(typeof n<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let r of this.inputNames)if(typeof t[r]>"u")throw new Error(`input '${r}' is missing in 'feeds'.`);if(d)for(let r of this.outputNames)u[r]=null;let c=await this.handler.run(t,u,l),s={};for(let r in c)if(Object.hasOwnProperty.call(c,r)){let i=c[r];i instanceof mt?s[r]=i:s[r]=new mt(i.type,i.data,i.dims)}return rn("InferenceSession.run"),zt(),s}async release(){return this.handler.dispose()}static async create(t,n,o,u){Gt(),tn("InferenceSession.create");let l,d={};if(typeof t=="string"){if(l=t,typeof n=="object"&&n!==null)d=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(l=t,typeof n=="object"&&n!==null)d=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let i=t,a=0,p=t.byteLength;if(typeof n=="object"&&n!==null)d=n;else if(typeof n=="number"){if(a=n,!Number.isSafeInteger(a))throw new RangeError("'byteOffset' must be an integer.");if(a<0||a>=i.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${i.byteLength}).`);if(p=t.byteLength-a,typeof o=="number"){if(p=o,!Number.isSafeInteger(p))throw new RangeError("'byteLength' must be an integer.");if(p<=0||a+p>i.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${i.byteLength-a}].`);if(typeof u=="object"&&u!==null)d=u;else if(typeof u<"u")throw new TypeError("'options' must be an object.")}else if(typeof o<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof n<"u")throw new TypeError("'options' must be an object.");l=new Uint8Array(i,a,p)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[c,s]=await vy(d),r=await c.createInferenceSessionHandler(l,s);return rn("InferenceSession.create"),zt(),new My(r)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Ro,BI=R(()=>{"use strict";zI(),Ro=By}),MI=R(()=>{"use strict"}),FI=R(()=>{"use strict"}),jI=R(()=>{"use strict"}),LI=R(()=>{"use strict"}),VI={};un(VI,{InferenceSession:()=>Ro,TRACE:()=>vo,TRACE_EVENT_BEGIN:()=>tn,TRACE_EVENT_END:()=>rn,TRACE_FUNC_BEGIN:()=>Gt,TRACE_FUNC_END:()=>zt,Tensor:()=>mt,env:()=>le,registerBackend:()=>en});var ot=R(()=>{"use strict";AI(),kI(),BI(),Ny(),MI(),FI(),zy(),jI(),LI()});function Zr(e,t,n,o){if(t===void 0)return UI(e);if(n===void 0)Qi(e,t,1);else if(typeof n=="number"&&o===void 0)Qi(e,t,n);else if(typeof n=="string"&&o===void 0)Qi(e,n,1,t);else if(typeof n=="string"&&typeof o=="number")Qi(e,n,o,t);else throw new TypeError("input is valid")}function UI(e){return{verbose:Zr.verbose.bind(null,e),info:Zr.info.bind(null,e),warning:Zr.warning.bind(null,e),error:Zr.error.bind(null,e),fatal:Zr.fatal.bind(null,e)}}function Qi(e,t,n,o){let u=xn[o||""]||xn[""];hu[e]<hu[u.minimalSeverity]||(u.logDateTime&&(t=`${new Date().toISOString()}|${t}`),u.logSourceLocation,Fy[u.provider].log(e,t,o))}var bp,yp,hu,Fy,Ms,xn,We,Fs,js,jy,Wn,Bt=R(()=>{"use strict";bp=class{log(e,t,n){}},yp=class{log(e,t,n){console.log(`${this.color(e)} ${n?"\x1B[35m"+n+"\x1B[0m ":""}${t}`)}color(e){switch(e){case"verbose":return"\x1B[34;40mv\x1B[0m";case"info":return"\x1B[32mi\x1B[0m";case"warning":return"\x1B[30;43mw\x1B[0m";case"error":return"\x1B[31;40me\x1B[0m";case"fatal":return"\x1B[101mf\x1B[0m";default:throw new Error(`unsupported severity: ${e}`)}}},hu={verbose:1e3,info:2e3,warning:4e3,error:5e3,fatal:6e3},Fy={none:new bp,console:new yp},Ms={provider:"console",minimalSeverity:"warning",logDateTime:!0,logSourceLocation:!1},xn={"":Ms},(e=>{function t(r,i){e("verbose",r,i)}e.verbose=t;function n(r,i){e("info",r,i)}e.info=n;function o(r,i){e("warning",r,i)}e.warning=o;function u(r,i){e("error",r,i)}e.error=u;function l(r,i){e("fatal",r,i)}e.fatal=l;function d(r){xn={},c("",r||{})}e.reset=d;function c(r,i){if(r==="*")d(i);else{let a=xn[r]||Ms;xn[r]={provider:i.provider||a.provider,minimalSeverity:i.minimalSeverity||a.minimalSeverity,logDateTime:i.logDateTime===void 0?a.logDateTime:i.logDateTime,logSourceLocation:i.logSourceLocation===void 0?a.logSourceLocation:i.logSourceLocation}}}e.set=c;function s(r){let i={};r.logLevel&&(i.minimalSeverity=r.logLevel),c("",i)}e.setWithEnv=s})(Zr||={}),We=Zr,Fs=class{constructor(e,t,n,o,u,l){this.category=e,this.name=t,this.startTime=n,this.endCallback=o,this.timer=u,this.ctx=l}async end(){return this.endCallback(this)}async checkTimer(){if(this.ctx===void 0||this.timer===void 0)throw new Error("No webgl timer found");return this.ctx.endTimer(),this.ctx.waitForQueryAndGetTime(this.timer)}},js=class{constructor(e,t,n,o){this.category=e,this.name=t,this.startTime=n,this.endTime=o}},jy=class{constructor(e,t,n){this._started=!1,this._flushPointer=0,this._started=!1,this._maxNumberEvents=e===void 0?1e4:e,this._flushBatchSize=t===void 0?10:t,this._flushIntervalInMilliseconds=n===void 0?5e3:n}static create(e){return e===void 0?new this:new this(e.maxNumberEvents,e.flushBatchSize,e.flushIntervalInMilliseconds)}start(){this._started=!0,this._timingEvents=[],this._flushTime=Wn(),this._flushPointer=0}stop(){for(this._started=!1;this._flushPointer<this._timingEvents.length;this._flushPointer++)this.logOneEvent(this._timingEvents[this._flushPointer])}event(e,t,n,o){let u=this._started?this.begin(e,t,o):void 0,l=!1,d=n();if(d&&typeof d.then=="function")return l=!0,new Promise((c,s)=>{d.then(async r=>{u&&await u.end(),c(r)},async r=>{u&&await u.end(),s(r)})});if(!l&&u){let c=u.end();if(c&&typeof c.then=="function")return new Promise((s,r)=>{c.then(()=>{s(d)},i=>{r(i)})})}return d}begin(e,t,n){if(!this._started)throw new Error("profiler is not started yet");if(n===void 0){let o=Wn();return this.flush(o),new Fs(e,t,o,u=>this.endSync(u))}else{let o=n.beginTimer();return new Fs(e,t,0,async u=>this.end(u),o,n)}}async end(e){let t=await e.checkTimer();this._timingEvents.length<this._maxNumberEvents&&(this._timingEvents.push(new js(e.category,e.name,e.startTime,t)),this.flush(t))}endSync(e){let t=Wn();this._timingEvents.length<this._maxNumberEvents&&(this._timingEvents.push(new js(e.category,e.name,e.startTime,t)),this.flush(t))}logOneEvent(e){We.verbose(`Profiler.${e.category}`,`${(e.endTime-e.startTime).toFixed(2)}ms on event '${e.name}' at ${e.endTime.toFixed(2)}`)}flush(e){if(this._timingEvents.length-this._flushPointer>=this._flushBatchSize||e-this._flushTime>=this._flushIntervalInMilliseconds){for(let t=this._flushPointer;this._flushPointer<t+this._flushBatchSize&&this._flushPointer<this._timingEvents.length;this._flushPointer++)this.logOneEvent(this._timingEvents[this._flushPointer]);this._flushTime=Wn()}}get started(){return this._started}},Wn=typeof performance<"u"&&performance.now?()=>performance.now():Date.now});function GI(e,t,n){for(let o of n){let u=o[0],l=o[1],d=o[2],c=o[3],s=o[4];if(e.opType===u){for(let r of t)if((r.domain===l||r.domain==="ai.onnx"&&l==="")&&qI(r.version,d))return{opImpl:c,opInit:s}}}throw new TypeError(`cannot resolve operator '${e.opType}' with opsets: ${t.map(o=>`${o.domain||"ai.onnx"} v${o.version}`).join(", ")}`)}function qI(e,t){if(t.endsWith("+")){let n=Number.parseInt(t.substring(0,t.length-1),10);return!isNaN(n)&&n<=e}else if(t.split("-").length===2){let n=t.split("-"),o=Number.parseInt(n[0],10),u=Number.parseInt(n[1],10);return!isNaN(o)&&!isNaN(u)&&o<=e&&e<=u}else return Number.parseInt(t,10)===e}var HI=R(()=>{"use strict"}),WI=ie(e=>{"use strict";e.__esModule=!0;var t=(function(){function n(o){if(!o)throw new TypeError("Invalid argument; `value` has no value.");this.value=n.EMPTY,o&&n.isGuid(o)&&(this.value=o)}return n.isGuid=function(o){var u=o.toString();return o&&(o instanceof n||n.validator.test(u))},n.create=function(){return new n([n.gen(2),n.gen(1),n.gen(1),n.gen(1),n.gen(3)].join("-"))},n.createEmpty=function(){return new n("emptyguid")},n.parse=function(o){return new n(o)},n.raw=function(){return[n.gen(2),n.gen(1),n.gen(1),n.gen(1),n.gen(3)].join("-")},n.gen=function(o){for(var u="",l=0;l<o;l++)u+=((1+Math.random())*65536|0).toString(16).substring(1);return u},n.prototype.equals=function(o){return n.isGuid(o)&&this.value===o.toString()},n.prototype.isEmpty=function(){return this.value===n.EMPTY},n.prototype.toString=function(){return this.value},n.prototype.toJSON=function(){return{value:this.value}},n.validator=new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$","i"),n.EMPTY="00000000-0000-0000-0000-000000000000",n})();e.Guid=t});function De(e,t,n){this.low=e|0,this.high=t|0,this.unsigned=!!n}function it(e){return(e&&e.__isLong__)===!0}function _p(e){var t=Math.clz32(e&-e);return e?31-t:t}function kr(e,t){var n,o,u;return t?(e>>>=0,(u=0<=e&&e<256)&&(o=mu[e],o)?o:(n=Ee(e,0,!0),u&&(mu[e]=n),n)):(e|=0,(u=-128<=e&&e<128)&&(o=fu[e],o)?o:(n=Ee(e,e<0?-1:0,!1),u&&(fu[e]=n),n))}function It(e,t){if(isNaN(e))return t?Vt:St;if(t){if(e<0)return Vt;if(e>=gu)return _u}else{if(e<=-bu)return at;if(e+1>=bu)return yu}return e<0?It(-e,t).neg():Ee(e%Jr|0,e/Jr|0,t)}function Ee(e,t,n){return new De(e,t,n)}function _l(e,t,n){if(e.length===0)throw Error("empty string");if(typeof t=="number"?(n=t,t=!1):t=!!t,e==="NaN"||e==="Infinity"||e==="+Infinity"||e==="-Infinity")return t?Vt:St;if(n=n||10,n<2||36<n)throw RangeError("radix");var o;if((o=e.indexOf("-"))>0)throw Error("interior hyphen");if(o===0)return _l(e.substring(1),t,n).neg();for(var u=It(bi(n,8)),l=St,d=0;d<e.length;d+=8){var c=Math.min(8,e.length-d),s=parseInt(e.substring(d,d+c),n);if(c<8){var r=It(bi(n,c));l=l.mul(r).add(It(s))}else l=l.mul(u),l=l.add(It(s))}return l.unsigned=t,l}function vt(e,t){return typeof e=="number"?It(e,t):typeof e=="string"?_l(e,t):Ee(e.low,e.high,typeof t=="boolean"?t:e.unsigned)}var dt,fu,mu,bi,Ls,wp,Jr,gu,bu,Vs,St,Vt,Cr,Us,eo,yu,_u,at,K,nn,Ly=R(()=>{dt=null;try{dt=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}De.prototype.__isLong__,Object.defineProperty(De.prototype,"__isLong__",{value:!0}),De.isLong=it,fu={},mu={},De.fromInt=kr,De.fromNumber=It,De.fromBits=Ee,bi=Math.pow,De.fromString=_l,De.fromValue=vt,Ls=65536,wp=1<<24,Jr=Ls*Ls,gu=Jr*Jr,bu=gu/2,Vs=kr(wp),St=kr(0),De.ZERO=St,Vt=kr(0,!0),De.UZERO=Vt,Cr=kr(1),De.ONE=Cr,Us=kr(1,!0),De.UONE=Us,eo=kr(-1),De.NEG_ONE=eo,yu=Ee(-1,2147483647,!1),De.MAX_VALUE=yu,_u=Ee(-1,-1,!0),De.MAX_UNSIGNED_VALUE=_u,at=Ee(0,-2147483648,!1),De.MIN_VALUE=at,K=De.prototype,K.toInt=function(){return this.unsigned?this.low>>>0:this.low},K.toNumber=function(){return this.unsigned?(this.high>>>0)*Jr+(this.low>>>0):this.high*Jr+(this.low>>>0)},K.toString=function(e){if(e=e||10,e<2||36<e)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(at)){var t=It(e),n=this.div(t),o=n.mul(t).sub(this);return n.toString(e)+o.toInt().toString(e)}else return"-"+this.neg().toString(e);for(var u=It(bi(e,6),this.unsigned),l=this,d="";;){var c=l.div(u),s=l.sub(c.mul(u)).toInt()>>>0,r=s.toString(e);if(l=c,l.isZero())return r+d;for(;r.length<6;)r="0"+r;d=""+r+d}},K.getHighBits=function(){return this.high},K.getHighBitsUnsigned=function(){return this.high>>>0},K.getLowBits=function(){return this.low},K.getLowBitsUnsigned=function(){return this.low>>>0},K.getNumBitsAbs=function(){if(this.isNegative())return this.eq(at)?64:this.neg().getNumBitsAbs();for(var e=this.high!=0?this.high:this.low,t=31;t>0&&(e&1<<t)==0;t--);return this.high!=0?t+33:t+1},K.isSafeInteger=function(){var e=this.high>>21;return e?this.unsigned?!1:e===-1&&!(this.low===0&&this.high===-2097152):!0},K.isZero=function(){return this.high===0&&this.low===0},K.eqz=K.isZero,K.isNegative=function(){return!this.unsigned&&this.high<0},K.isPositive=function(){return this.unsigned||this.high>=0},K.isOdd=function(){return(this.low&1)===1},K.isEven=function(){return(this.low&1)===0},K.equals=function(e){return it(e)||(e=vt(e)),this.unsigned!==e.unsigned&&this.high>>>31===1&&e.high>>>31===1?!1:this.high===e.high&&this.low===e.low},K.eq=K.equals,K.notEquals=function(e){return!this.eq(e)},K.neq=K.notEquals,K.ne=K.notEquals,K.lessThan=function(e){return this.comp(e)<0},K.lt=K.lessThan,K.lessThanOrEqual=function(e){return this.comp(e)<=0},K.lte=K.lessThanOrEqual,K.le=K.lessThanOrEqual,K.greaterThan=function(e){return this.comp(e)>0},K.gt=K.greaterThan,K.greaterThanOrEqual=function(e){return this.comp(e)>=0},K.gte=K.greaterThanOrEqual,K.ge=K.greaterThanOrEqual,K.compare=function(e){if(it(e)||(e=vt(e)),this.eq(e))return 0;var t=this.isNegative(),n=e.isNegative();return t&&!n?-1:!t&&n?1:this.unsigned?e.high>>>0>this.high>>>0||e.high===this.high&&e.low>>>0>this.low>>>0?-1:1:this.sub(e).isNegative()?-1:1},K.comp=K.compare,K.negate=function(){return!this.unsigned&&this.eq(at)?at:this.not().add(Cr)},K.neg=K.negate,K.add=function(e){it(e)||(e=vt(e));var t=this.high>>>16,n=this.high&65535,o=this.low>>>16,u=this.low&65535,l=e.high>>>16,d=e.high&65535,c=e.low>>>16,s=e.low&65535,r=0,i=0,a=0,p=0;return p+=u+s,a+=p>>>16,p&=65535,a+=o+c,i+=a>>>16,a&=65535,i+=n+d,r+=i>>>16,i&=65535,r+=t+l,r&=65535,Ee(a<<16|p,r<<16|i,this.unsigned)},K.subtract=function(e){return it(e)||(e=vt(e)),this.add(e.neg())},K.sub=K.subtract,K.multiply=function(e){if(this.isZero())return this;if(it(e)||(e=vt(e)),dt){var t=dt.mul(this.low,this.high,e.low,e.high);return Ee(t,dt.get_high(),this.unsigned)}if(e.isZero())return this.unsigned?Vt:St;if(this.eq(at))return e.isOdd()?at:St;if(e.eq(at))return this.isOdd()?at:St;if(this.isNegative())return e.isNegative()?this.neg().mul(e.neg()):this.neg().mul(e).neg();if(e.isNegative())return this.mul(e.neg()).neg();if(this.lt(Vs)&&e.lt(Vs))return It(this.toNumber()*e.toNumber(),this.unsigned);var n=this.high>>>16,o=this.high&65535,u=this.low>>>16,l=this.low&65535,d=e.high>>>16,c=e.high&65535,s=e.low>>>16,r=e.low&65535,i=0,a=0,p=0,h=0;return h+=l*r,p+=h>>>16,h&=65535,p+=u*r,a+=p>>>16,p&=65535,p+=l*s,a+=p>>>16,p&=65535,a+=o*r,i+=a>>>16,a&=65535,a+=u*s,i+=a>>>16,a&=65535,a+=l*c,i+=a>>>16,a&=65535,i+=n*r+o*s+u*c+l*d,i&=65535,Ee(p<<16|h,i<<16|a,this.unsigned)},K.mul=K.multiply,K.divide=function(e){if(it(e)||(e=vt(e)),e.isZero())throw Error("division by zero");if(dt){if(!this.unsigned&&this.high===-2147483648&&e.low===-1&&e.high===-1)return this;var t=(this.unsigned?dt.div_u:dt.div_s)(this.low,this.high,e.low,e.high);return Ee(t,dt.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?Vt:St;var n,o,u;if(this.unsigned){if(e.unsigned||(e=e.toUnsigned()),e.gt(this))return Vt;if(e.gt(this.shru(1)))return Us;u=Vt}else{if(this.eq(at)){if(e.eq(Cr)||e.eq(eo))return at;if(e.eq(at))return Cr;var l=this.shr(1);return n=l.div(e).shl(1),n.eq(St)?e.isNegative()?Cr:eo:(o=this.sub(e.mul(n)),u=n.add(o.div(e)),u)}else if(e.eq(at))return this.unsigned?Vt:St;if(this.isNegative())return e.isNegative()?this.neg().div(e.neg()):this.neg().div(e).neg();if(e.isNegative())return this.div(e.neg()).neg();u=St}for(o=this;o.gte(e);){n=Math.max(1,Math.floor(o.toNumber()/e.toNumber()));for(var d=Math.ceil(Math.log(n)/Math.LN2),c=d<=48?1:bi(2,d-48),s=It(n),r=s.mul(e);r.isNegative()||r.gt(o);)n-=c,s=It(n,this.unsigned),r=s.mul(e);s.isZero()&&(s=Cr),u=u.add(s),o=o.sub(r)}return u},K.div=K.divide,K.modulo=function(e){if(it(e)||(e=vt(e)),dt){var t=(this.unsigned?dt.rem_u:dt.rem_s)(this.low,this.high,e.low,e.high);return Ee(t,dt.get_high(),this.unsigned)}return this.sub(this.div(e).mul(e))},K.mod=K.modulo,K.rem=K.modulo,K.not=function(){return Ee(~this.low,~this.high,this.unsigned)},K.countLeadingZeros=function(){return this.high?Math.clz32(this.high):Math.clz32(this.low)+32},K.clz=K.countLeadingZeros,K.countTrailingZeros=function(){return this.low?_p(this.low):_p(this.high)+32},K.ctz=K.countTrailingZeros,K.and=function(e){return it(e)||(e=vt(e)),Ee(this.low&e.low,this.high&e.high,this.unsigned)},K.or=function(e){return it(e)||(e=vt(e)),Ee(this.low|e.low,this.high|e.high,this.unsigned)},K.xor=function(e){return it(e)||(e=vt(e)),Ee(this.low^e.low,this.high^e.high,this.unsigned)},K.shiftLeft=function(e){return it(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ee(this.low<<e,this.high<<e|this.low>>>32-e,this.unsigned):Ee(0,this.low<<e-32,this.unsigned)},K.shl=K.shiftLeft,K.shiftRight=function(e){return it(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ee(this.low>>>e|this.high<<32-e,this.high>>e,this.unsigned):Ee(this.high>>e-32,this.high>=0?0:-1,this.unsigned)},K.shr=K.shiftRight,K.shiftRightUnsigned=function(e){return it(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ee(this.low>>>e|this.high<<32-e,this.high>>>e,this.unsigned):e===32?Ee(this.high,0,this.unsigned):Ee(this.high>>>e-32,0,this.unsigned)},K.shru=K.shiftRightUnsigned,K.shr_u=K.shiftRightUnsigned,K.rotateLeft=function(e){var t;return it(e)&&(e=e.toInt()),(e&=63)===0?this:e===32?Ee(this.high,this.low,this.unsigned):e<32?(t=32-e,Ee(this.low<<e|this.high>>>t,this.high<<e|this.low>>>t,this.unsigned)):(e-=32,t=32-e,Ee(this.high<<e|this.low>>>t,this.low<<e|this.high>>>t,this.unsigned))},K.rotl=K.rotateLeft,K.rotateRight=function(e){var t;return it(e)&&(e=e.toInt()),(e&=63)===0?this:e===32?Ee(this.high,this.low,this.unsigned):e<32?(t=32-e,Ee(this.high<<t|this.low>>>e,this.low<<t|this.high>>>e,this.unsigned)):(e-=32,t=32-e,Ee(this.low<<t|this.high>>>e,this.high<<t|this.low>>>e,this.unsigned))},K.rotr=K.rotateRight,K.toSigned=function(){return this.unsigned?Ee(this.low,this.high,!1):this},K.toUnsigned=function(){return this.unsigned?this:Ee(this.low,this.high,!0)},K.toBytes=function(e){return e?this.toBytesLE():this.toBytesBE()},K.toBytesLE=function(){var e=this.high,t=this.low;return[t&255,t>>>8&255,t>>>16&255,t>>>24,e&255,e>>>8&255,e>>>16&255,e>>>24]},K.toBytesBE=function(){var e=this.high,t=this.low;return[e>>>24,e>>>16&255,e>>>8&255,e&255,t>>>24,t>>>16&255,t>>>8&255,t&255]},De.fromBytes=function(e,t,n){return n?De.fromBytesLE(e,t):De.fromBytesBE(e,t)},De.fromBytesLE=function(e,t){return new De(e[0]|e[1]<<8|e[2]<<16|e[3]<<24,e[4]|e[5]<<8|e[6]<<16|e[7]<<24,t)},De.fromBytesBE=function(e,t){return new De(e[4]<<24|e[5]<<16|e[6]<<8|e[7],e[0]<<24|e[1]<<16|e[2]<<8|e[3],t)},typeof BigInt=="function"&&(De.fromBigInt=function(e,t){var n=Number(BigInt.asIntN(32,e)),o=Number(BigInt.asIntN(32,e>>BigInt(32)));return Ee(n,o,t)},De.fromValue=function(e,t){return typeof e=="bigint"?De.fromBigInt(e,t):vt(e,t)},K.toBigInt=function(){var e=BigInt(this.low>>>0),t=BigInt(this.unsigned?this.high>>>0:this.high);return t<<BigInt(32)|e}),nn=De}),Vy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.ArgType=void 0;var t;(function(n){n[n.INPUT=0]="INPUT",n[n.OUTPUT=1]="OUTPUT"})(t||(e.ArgType=t={}))}),wl=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.SIZE_PREFIX_LENGTH=e.FILE_IDENTIFIER_LENGTH=e.SIZEOF_INT=e.SIZEOF_SHORT=void 0,e.SIZEOF_SHORT=2,e.SIZEOF_INT=4,e.FILE_IDENTIFIER_LENGTH=4,e.SIZE_PREFIX_LENGTH=4}),Uy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.isLittleEndian=e.float64=e.float32=e.int32=void 0,e.int32=new Int32Array(2),e.float32=new Float32Array(e.int32.buffer),e.float64=new Float64Array(e.int32.buffer),e.isLittleEndian=new Uint16Array(new Uint8Array([1,0]).buffer)[0]===1}),Gy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Encoding=void 0;var t;(function(n){n[n.UTF8_BYTES=1]="UTF8_BYTES",n[n.UTF16_STRING=2]="UTF16_STRING"})(t||(e.Encoding=t={}))}),qy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.ByteBuffer=void 0;var t=wl(),n=Gy(),o=Uy(),u=class Hy{constructor(d){this.bytes_=d,this.position_=0,this.text_decoder_=new TextDecoder}static allocate(d){return new Hy(new Uint8Array(d))}clear(){this.position_=0}bytes(){return this.bytes_}position(){return this.position_}setPosition(d){this.position_=d}capacity(){return this.bytes_.length}readInt8(d){return this.readUint8(d)<<24>>24}readUint8(d){return this.bytes_[d]}readInt16(d){return this.readUint16(d)<<16>>16}readUint16(d){return this.bytes_[d]|this.bytes_[d+1]<<8}readInt32(d){return this.bytes_[d]|this.bytes_[d+1]<<8|this.bytes_[d+2]<<16|this.bytes_[d+3]<<24}readUint32(d){return this.readInt32(d)>>>0}readInt64(d){return BigInt.asIntN(64,BigInt(this.readUint32(d))+(BigInt(this.readUint32(d+4))<<BigInt(32)))}readUint64(d){return BigInt.asUintN(64,BigInt(this.readUint32(d))+(BigInt(this.readUint32(d+4))<<BigInt(32)))}readFloat32(d){return o.int32[0]=this.readInt32(d),o.float32[0]}readFloat64(d){return o.int32[o.isLittleEndian?0:1]=this.readInt32(d),o.int32[o.isLittleEndian?1:0]=this.readInt32(d+4),o.float64[0]}writeInt8(d,c){this.bytes_[d]=c}writeUint8(d,c){this.bytes_[d]=c}writeInt16(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8}writeUint16(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8}writeInt32(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8,this.bytes_[d+2]=c>>16,this.bytes_[d+3]=c>>24}writeUint32(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8,this.bytes_[d+2]=c>>16,this.bytes_[d+3]=c>>24}writeInt64(d,c){this.writeInt32(d,Number(BigInt.asIntN(32,c))),this.writeInt32(d+4,Number(BigInt.asIntN(32,c>>BigInt(32))))}writeUint64(d,c){this.writeUint32(d,Number(BigInt.asUintN(32,c))),this.writeUint32(d+4,Number(BigInt.asUintN(32,c>>BigInt(32))))}writeFloat32(d,c){o.float32[0]=c,this.writeInt32(d,o.int32[0])}writeFloat64(d,c){o.float64[0]=c,this.writeInt32(d,o.int32[o.isLittleEndian?0:1]),this.writeInt32(d+4,o.int32[o.isLittleEndian?1:0])}getBufferIdentifier(){if(this.bytes_.length<this.position_+t.SIZEOF_INT+t.FILE_IDENTIFIER_LENGTH)throw new Error("FlatBuffers: ByteBuffer is too short to contain an identifier.");let d="";for(let c=0;c<t.FILE_IDENTIFIER_LENGTH;c++)d+=String.fromCharCode(this.readInt8(this.position_+t.SIZEOF_INT+c));return d}__offset(d,c){let s=d-this.readInt32(d);return c<this.readInt16(s)?this.readInt16(s+c):0}__union(d,c){return d.bb_pos=c+this.readInt32(c),d.bb=this,d}__string(d,c){d+=this.readInt32(d);let s=this.readInt32(d);d+=t.SIZEOF_INT;let r=this.bytes_.subarray(d,d+s);return c===n.Encoding.UTF8_BYTES?r:this.text_decoder_.decode(r)}__union_with_string(d,c){return typeof d=="string"?this.__string(c):this.__union(d,c)}__indirect(d){return d+this.readInt32(d)}__vector(d){return d+this.readInt32(d)+t.SIZEOF_INT}__vector_len(d){return this.readInt32(d+this.readInt32(d))}__has_identifier(d){if(d.length!=t.FILE_IDENTIFIER_LENGTH)throw new Error("FlatBuffers: file identifier must be length "+t.FILE_IDENTIFIER_LENGTH);for(let c=0;c<t.FILE_IDENTIFIER_LENGTH;c++)if(d.charCodeAt(c)!=this.readInt8(this.position()+t.SIZEOF_INT+c))return!1;return!0}createScalarList(d,c){let s=[];for(let r=0;r<c;++r){let i=d(r);i!==null&&s.push(i)}return s}createObjList(d,c){let s=[];for(let r=0;r<c;++r){let i=d(r);i!==null&&s.push(i.unpack())}return s}};e.ByteBuffer=u}),KI=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Builder=void 0;var t=qy(),n=wl(),o=class Wy{constructor(l){this.minalign=1,this.vtable=null,this.vtable_in_use=0,this.isNested=!1,this.object_start=0,this.vtables=[],this.vector_num_elems=0,this.force_defaults=!1,this.string_maps=null,this.text_encoder=new TextEncoder;let d;l?d=l:d=1024,this.bb=t.ByteBuffer.allocate(d),this.space=d}clear(){this.bb.clear(),this.space=this.bb.capacity(),this.minalign=1,this.vtable=null,this.vtable_in_use=0,this.isNested=!1,this.object_start=0,this.vtables=[],this.vector_num_elems=0,this.force_defaults=!1,this.string_maps=null}forceDefaults(l){this.force_defaults=l}dataBuffer(){return this.bb}asUint8Array(){return this.bb.bytes().subarray(this.bb.position(),this.bb.position()+this.offset())}prep(l,d){l>this.minalign&&(this.minalign=l);let c=~(this.bb.capacity()-this.space+d)+1&l-1;for(;this.space<c+l+d;){let s=this.bb.capacity();this.bb=Wy.growByteBuffer(this.bb),this.space+=this.bb.capacity()-s}this.pad(c)}pad(l){for(let d=0;d<l;d++)this.bb.writeInt8(--this.space,0)}writeInt8(l){this.bb.writeInt8(this.space-=1,l)}writeInt16(l){this.bb.writeInt16(this.space-=2,l)}writeInt32(l){this.bb.writeInt32(this.space-=4,l)}writeInt64(l){this.bb.writeInt64(this.space-=8,l)}writeFloat32(l){this.bb.writeFloat32(this.space-=4,l)}writeFloat64(l){this.bb.writeFloat64(this.space-=8,l)}addInt8(l){this.prep(1,0),this.writeInt8(l)}addInt16(l){this.prep(2,0),this.writeInt16(l)}addInt32(l){this.prep(4,0),this.writeInt32(l)}addInt64(l){this.prep(8,0),this.writeInt64(l)}addFloat32(l){this.prep(4,0),this.writeFloat32(l)}addFloat64(l){this.prep(8,0),this.writeFloat64(l)}addFieldInt8(l,d,c){(this.force_defaults||d!=c)&&(this.addInt8(d),this.slot(l))}addFieldInt16(l,d,c){(this.force_defaults||d!=c)&&(this.addInt16(d),this.slot(l))}addFieldInt32(l,d,c){(this.force_defaults||d!=c)&&(this.addInt32(d),this.slot(l))}addFieldInt64(l,d,c){(this.force_defaults||d!==c)&&(this.addInt64(d),this.slot(l))}addFieldFloat32(l,d,c){(this.force_defaults||d!=c)&&(this.addFloat32(d),this.slot(l))}addFieldFloat64(l,d,c){(this.force_defaults||d!=c)&&(this.addFloat64(d),this.slot(l))}addFieldOffset(l,d,c){(this.force_defaults||d!=c)&&(this.addOffset(d),this.slot(l))}addFieldStruct(l,d,c){d!=c&&(this.nested(d),this.slot(l))}nested(l){if(l!=this.offset())throw new TypeError("FlatBuffers: struct must be serialized inline.")}notNested(){if(this.isNested)throw new TypeError("FlatBuffers: object serialization must not be nested.")}slot(l){this.vtable!==null&&(this.vtable[l]=this.offset())}offset(){return this.bb.capacity()-this.space}static growByteBuffer(l){let d=l.capacity();if(d&3221225472)throw new Error("FlatBuffers: cannot grow buffer beyond 2 gigabytes.");let c=d<<1,s=t.ByteBuffer.allocate(c);return s.setPosition(c-d),s.bytes().set(l.bytes(),c-d),s}addOffset(l){this.prep(n.SIZEOF_INT,0),this.writeInt32(this.offset()-l+n.SIZEOF_INT)}startObject(l){this.notNested(),this.vtable==null&&(this.vtable=[]),this.vtable_in_use=l;for(let d=0;d<l;d++)this.vtable[d]=0;this.isNested=!0,this.object_start=this.offset()}endObject(){if(this.vtable==null||!this.isNested)throw new Error("FlatBuffers: endObject called without startObject");this.addInt32(0);let l=this.offset(),d=this.vtable_in_use-1;for(;d>=0&&this.vtable[d]==0;d--);let c=d+1;for(;d>=0;d--)this.addInt16(this.vtable[d]!=0?l-this.vtable[d]:0);let s=2;this.addInt16(l-this.object_start);let r=(c+s)*n.SIZEOF_SHORT;this.addInt16(r);let i=0,a=this.space;e:for(d=0;d<this.vtables.length;d++){let p=this.bb.capacity()-this.vtables[d];if(r==this.bb.readInt16(p)){for(let h=n.SIZEOF_SHORT;h<r;h+=n.SIZEOF_SHORT)if(this.bb.readInt16(a+h)!=this.bb.readInt16(p+h))continue e;i=this.vtables[d];break}}return i?(this.space=this.bb.capacity()-l,this.bb.writeInt32(this.space,i-l)):(this.vtables.push(this.offset()),this.bb.writeInt32(this.bb.capacity()-l,this.offset()-l)),this.isNested=!1,l}finish(l,d,c){let s=c?n.SIZE_PREFIX_LENGTH:0;if(d){let r=d;if(this.prep(this.minalign,n.SIZEOF_INT+n.FILE_IDENTIFIER_LENGTH+s),r.length!=n.FILE_IDENTIFIER_LENGTH)throw new TypeError("FlatBuffers: file identifier must be length "+n.FILE_IDENTIFIER_LENGTH);for(let i=n.FILE_IDENTIFIER_LENGTH-1;i>=0;i--)this.writeInt8(r.charCodeAt(i))}this.prep(this.minalign,n.SIZEOF_INT+s),this.addOffset(l),s&&this.addInt32(this.bb.capacity()-this.space),this.bb.setPosition(this.space)}finishSizePrefixed(l,d){this.finish(l,d,!0)}requiredField(l,d){let c=this.bb.capacity()-l,s=c-this.bb.readInt32(c);if(!(d<this.bb.readInt16(s)&&this.bb.readInt16(s+d)!=0))throw new TypeError("FlatBuffers: field "+d+" must be set")}startVector(l,d,c){this.notNested(),this.vector_num_elems=d,this.prep(n.SIZEOF_INT,l*d),this.prep(c,l*d)}endVector(){return this.writeInt32(this.vector_num_elems),this.offset()}createSharedString(l){if(!l)return 0;if(this.string_maps||(this.string_maps=new Map),this.string_maps.has(l))return this.string_maps.get(l);let d=this.createString(l);return this.string_maps.set(l,d),d}createString(l){if(l==null)return 0;let d;return l instanceof Uint8Array?d=l:d=this.text_encoder.encode(l),this.addInt8(0),this.startVector(1,d.length,1),this.bb.setPosition(this.space-=d.length),this.bb.bytes().set(d,this.space),this.endVector()}createByteVector(l){return l==null?0:(this.startVector(1,l.length,1),this.bb.setPosition(this.space-=l.length),this.bb.bytes().set(l,this.space),this.endVector())}createObjectOffset(l){return l===null?0:typeof l=="string"?this.createString(l):l.pack(this)}createObjectOffsetList(l){let d=[];for(let c=0;c<l.length;++c){let s=l[c];if(s!==null)d.push(this.createObjectOffset(s));else throw new TypeError("FlatBuffers: Argument for createObjectOffsetList cannot contain null.")}return d}createStructOffsetList(l,d){return d(this,l.length),this.createObjectOffsetList(l.slice().reverse()),this.endVector()}};e.Builder=o}),Pe=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Encoding=e.ByteBuffer=e.Builder=e.isLittleEndian=e.int32=e.float64=e.float32=e.SIZE_PREFIX_LENGTH=e.SIZEOF_SHORT=e.SIZEOF_INT=e.FILE_IDENTIFIER_LENGTH=void 0;var t=wl();Object.defineProperty(e,"FILE_IDENTIFIER_LENGTH",{enumerable:!0,get:function(){return t.FILE_IDENTIFIER_LENGTH}}),Object.defineProperty(e,"SIZEOF_INT",{enumerable:!0,get:function(){return t.SIZEOF_INT}}),Object.defineProperty(e,"SIZEOF_SHORT",{enumerable:!0,get:function(){return t.SIZEOF_SHORT}}),Object.defineProperty(e,"SIZE_PREFIX_LENGTH",{enumerable:!0,get:function(){return t.SIZE_PREFIX_LENGTH}});var n=Uy();Object.defineProperty(e,"float32",{enumerable:!0,get:function(){return n.float32}}),Object.defineProperty(e,"float64",{enumerable:!0,get:function(){return n.float64}}),Object.defineProperty(e,"int32",{enumerable:!0,get:function(){return n.int32}}),Object.defineProperty(e,"isLittleEndian",{enumerable:!0,get:function(){return n.isLittleEndian}});var o=KI();Object.defineProperty(e,"Builder",{enumerable:!0,get:function(){return o.Builder}});var u=qy();Object.defineProperty(e,"ByteBuffer",{enumerable:!0,get:function(){return u.ByteBuffer}});var l=Gy();Object.defineProperty(e,"Encoding",{enumerable:!0,get:function(){return l.Encoding}})}),Ky=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.ArgTypeAndIndex=void 0;var u=o(Pe()),l=Vy(),d=class Mr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsArgTypeAndIndex(s,r){return(r||new Mr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsArgTypeAndIndex(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Mr).__init(s.readInt32(s.position())+s.position(),s)}argType(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readInt8(this.bb_pos+s):l.ArgType.INPUT}index(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint32(this.bb_pos+s):0}static startArgTypeAndIndex(s){s.startObject(2)}static addArgType(s,r){s.addFieldInt8(0,r,l.ArgType.INPUT)}static addIndex(s,r){s.addFieldInt32(1,r,0)}static endArgTypeAndIndex(s){return s.endObject()}static createArgTypeAndIndex(s,r,i){return Mr.startArgTypeAndIndex(s),Mr.addArgType(s,r),Mr.addIndex(s,i),Mr.endArgTypeAndIndex(s)}};e.ArgTypeAndIndex=d}),Xy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.AttributeType=void 0;var t;(function(n){n[n.UNDEFINED=0]="UNDEFINED",n[n.FLOAT=1]="FLOAT",n[n.INT=2]="INT",n[n.STRING=3]="STRING",n[n.TENSOR=4]="TENSOR",n[n.GRAPH=5]="GRAPH",n[n.FLOATS=6]="FLOATS",n[n.INTS=7]="INTS",n[n.STRINGS=8]="STRINGS",n[n.TENSORS=9]="TENSORS",n[n.GRAPHS=10]="GRAPHS",n[n.SPARSE_TENSOR=11]="SPARSE_TENSOR",n[n.SPARSE_TENSORS=12]="SPARSE_TENSORS"})(t||(e.AttributeType=t={}))}),Zy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.NodeType=void 0;var t;(function(n){n[n.Primitive=0]="Primitive",n[n.Fused=1]="Fused"})(t||(e.NodeType=t={}))}),Jy=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Node=void 0;var u=o(Pe()),l=f0(),d=Zy(),c=class Qe{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsNode(r,i){return(i||new Qe).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsNode(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new Qe).__init(r.readInt32(r.position())+r.position(),r)}name(r){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.__string(this.bb_pos+i,r):null}docString(r){let i=this.bb.__offset(this.bb_pos,6);return i?this.bb.__string(this.bb_pos+i,r):null}domain(r){let i=this.bb.__offset(this.bb_pos,8);return i?this.bb.__string(this.bb_pos+i,r):null}sinceVersion(){let r=this.bb.__offset(this.bb_pos,10);return r?this.bb.readInt32(this.bb_pos+r):0}index(){let r=this.bb.__offset(this.bb_pos,12);return r?this.bb.readUint32(this.bb_pos+r):0}opType(r){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.__string(this.bb_pos+i,r):null}type(){let r=this.bb.__offset(this.bb_pos,16);return r?this.bb.readInt32(this.bb_pos+r):d.NodeType.Primitive}executionProviderType(r){let i=this.bb.__offset(this.bb_pos,18);return i?this.bb.__string(this.bb_pos+i,r):null}inputs(r,i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}inputsLength(){let r=this.bb.__offset(this.bb_pos,20);return r?this.bb.__vector_len(this.bb_pos+r):0}outputs(r,i){let a=this.bb.__offset(this.bb_pos,22);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}outputsLength(){let r=this.bb.__offset(this.bb_pos,22);return r?this.bb.__vector_len(this.bb_pos+r):0}attributes(r,i){let a=this.bb.__offset(this.bb_pos,24);return a?(i||new l.Attribute).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+a)+r*4),this.bb):null}attributesLength(){let r=this.bb.__offset(this.bb_pos,24);return r?this.bb.__vector_len(this.bb_pos+r):0}inputArgCounts(r){let i=this.bb.__offset(this.bb_pos,26);return i?this.bb.readInt32(this.bb.__vector(this.bb_pos+i)+r*4):0}inputArgCountsLength(){let r=this.bb.__offset(this.bb_pos,26);return r?this.bb.__vector_len(this.bb_pos+r):0}inputArgCountsArray(){let r=this.bb.__offset(this.bb_pos,26);return r?new Int32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+r),this.bb.__vector_len(this.bb_pos+r)):null}implicitInputs(r,i){let a=this.bb.__offset(this.bb_pos,28);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}implicitInputsLength(){let r=this.bb.__offset(this.bb_pos,28);return r?this.bb.__vector_len(this.bb_pos+r):0}static startNode(r){r.startObject(13)}static addName(r,i){r.addFieldOffset(0,i,0)}static addDocString(r,i){r.addFieldOffset(1,i,0)}static addDomain(r,i){r.addFieldOffset(2,i,0)}static addSinceVersion(r,i){r.addFieldInt32(3,i,0)}static addIndex(r,i){r.addFieldInt32(4,i,0)}static addOpType(r,i){r.addFieldOffset(5,i,0)}static addType(r,i){r.addFieldInt32(6,i,d.NodeType.Primitive)}static addExecutionProviderType(r,i){r.addFieldOffset(7,i,0)}static addInputs(r,i){r.addFieldOffset(8,i,0)}static createInputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startInputsVector(r,i){r.startVector(4,i,4)}static addOutputs(r,i){r.addFieldOffset(9,i,0)}static createOutputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startOutputsVector(r,i){r.startVector(4,i,4)}static addAttributes(r,i){r.addFieldOffset(10,i,0)}static createAttributesVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startAttributesVector(r,i){r.startVector(4,i,4)}static addInputArgCounts(r,i){r.addFieldOffset(11,i,0)}static createInputArgCountsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addInt32(i[a]);return r.endVector()}static startInputArgCountsVector(r,i){r.startVector(4,i,4)}static addImplicitInputs(r,i){r.addFieldOffset(12,i,0)}static createImplicitInputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startImplicitInputsVector(r,i){r.startVector(4,i,4)}static endNode(r){return r.endObject()}static createNode(r,i,a,p,h,m,b,x,_,y,S,T,I,A){return Qe.startNode(r),Qe.addName(r,i),Qe.addDocString(r,a),Qe.addDomain(r,p),Qe.addSinceVersion(r,h),Qe.addIndex(r,m),Qe.addOpType(r,b),Qe.addType(r,x),Qe.addExecutionProviderType(r,_),Qe.addInputs(r,y),Qe.addOutputs(r,S),Qe.addAttributes(r,T),Qe.addInputArgCounts(r,I),Qe.addImplicitInputs(r,A),Qe.endNode(r)}};e.Node=c}),Yy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.EdgeEnd=void 0;var t=class{constructor(){this.bb=null,this.bb_pos=0}__init(n,o){return this.bb_pos=n,this.bb=o,this}nodeIndex(){return this.bb.readUint32(this.bb_pos)}srcArgIndex(){return this.bb.readInt32(this.bb_pos+4)}dstArgIndex(){return this.bb.readInt32(this.bb_pos+8)}static sizeOf(){return 12}static createEdgeEnd(n,o,u,l){return n.prep(4,12),n.writeInt32(l),n.writeInt32(u),n.writeInt32(o),n.offset()}};e.EdgeEnd=t}),Qy=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.NodeEdge=void 0;var u=o(Pe()),l=Yy(),d=class pr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsNodeEdge(s,r){return(r||new pr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsNodeEdge(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new pr).__init(s.readInt32(s.position())+s.position(),s)}nodeIndex(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb_pos+s):0}inputEdges(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.EdgeEnd).__init(this.bb.__vector(this.bb_pos+i)+s*12,this.bb):null}inputEdgesLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}outputEdges(s,r){let i=this.bb.__offset(this.bb_pos,8);return i?(r||new l.EdgeEnd).__init(this.bb.__vector(this.bb_pos+i)+s*12,this.bb):null}outputEdgesLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}static startNodeEdge(s){s.startObject(3)}static addNodeIndex(s,r){s.addFieldInt32(0,r,0)}static addInputEdges(s,r){s.addFieldOffset(1,r,0)}static startInputEdgesVector(s,r){s.startVector(12,r,4)}static addOutputEdges(s,r){s.addFieldOffset(2,r,0)}static startOutputEdgesVector(s,r){s.startVector(12,r,4)}static endNodeEdge(s){return s.endObject()}static createNodeEdge(s,r,i,a){return pr.startNodeEdge(s),pr.addNodeIndex(s,r),pr.addInputEdges(s,i),pr.addOutputEdges(s,a),pr.endNodeEdge(s)}};e.NodeEdge=d}),e0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.NodesToOptimizeIndices=void 0;var u=o(Pe()),l=class $t{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsNodesToOptimizeIndices(c,s){return(s||new $t).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsNodesToOptimizeIndices(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new $t).__init(c.readInt32(c.position())+c.position(),c)}nodeIndices(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb.__vector(this.bb_pos+s)+c*4):0}nodeIndicesLength(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.__vector_len(this.bb_pos+c):0}nodeIndicesArray(){let c=this.bb.__offset(this.bb_pos,4);return c?new Uint32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+c),this.bb.__vector_len(this.bb_pos+c)):null}numInputs(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readUint32(this.bb_pos+c):0}numOutputs(){let c=this.bb.__offset(this.bb_pos,8);return c?this.bb.readUint32(this.bb_pos+c):0}hasVariadicInput(){let c=this.bb.__offset(this.bb_pos,10);return c?!!this.bb.readInt8(this.bb_pos+c):!1}hasVariadicOutput(){let c=this.bb.__offset(this.bb_pos,12);return c?!!this.bb.readInt8(this.bb_pos+c):!1}numVariadicInputs(){let c=this.bb.__offset(this.bb_pos,14);return c?this.bb.readUint32(this.bb_pos+c):0}numVariadicOutputs(){let c=this.bb.__offset(this.bb_pos,16);return c?this.bb.readUint32(this.bb_pos+c):0}static startNodesToOptimizeIndices(c){c.startObject(7)}static addNodeIndices(c,s){c.addFieldOffset(0,s,0)}static createNodeIndicesVector(c,s){c.startVector(4,s.length,4);for(let r=s.length-1;r>=0;r--)c.addInt32(s[r]);return c.endVector()}static startNodeIndicesVector(c,s){c.startVector(4,s,4)}static addNumInputs(c,s){c.addFieldInt32(1,s,0)}static addNumOutputs(c,s){c.addFieldInt32(2,s,0)}static addHasVariadicInput(c,s){c.addFieldInt8(3,+s,0)}static addHasVariadicOutput(c,s){c.addFieldInt8(4,+s,0)}static addNumVariadicInputs(c,s){c.addFieldInt32(5,s,0)}static addNumVariadicOutputs(c,s){c.addFieldInt32(6,s,0)}static endNodesToOptimizeIndices(c){return c.endObject()}static createNodesToOptimizeIndices(c,s,r,i,a,p,h,m){return $t.startNodesToOptimizeIndices(c),$t.addNodeIndices(c,s),$t.addNumInputs(c,r),$t.addNumOutputs(c,i),$t.addHasVariadicInput(c,a),$t.addHasVariadicOutput(c,p),$t.addNumVariadicInputs(c,h),$t.addNumVariadicOutputs(c,m),$t.endNodesToOptimizeIndices(c)}};e.NodesToOptimizeIndices=l}),t0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizationRecord=void 0;var u=o(Pe()),l=e0(),d=class wu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizationRecord(s,r){return(r||new wu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizationRecord(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new wu).__init(s.readInt32(s.position())+s.position(),s)}actionId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}nodesToOptimizeIndices(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.NodesToOptimizeIndices).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}producedOpIds(s,r){let i=this.bb.__offset(this.bb_pos,10);return i?this.bb.__string(this.bb.__vector(this.bb_pos+i)+s*4,r):null}producedOpIdsLength(){let s=this.bb.__offset(this.bb_pos,10);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizationRecord(s){s.startObject(4)}static addActionId(s,r){s.addFieldOffset(0,r,0)}static addNodesToOptimizeIndices(s,r){s.addFieldOffset(1,r,0)}static addProducedOpIds(s,r){s.addFieldOffset(3,r,0)}static createProducedOpIdsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startProducedOpIdsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizationRecord(s){return s.endObject()}};e.RuntimeOptimizationRecord=d}),r0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizationRecordContainerEntry=void 0;var u=o(Pe()),l=t0(),d=class Fr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizationRecordContainerEntry(s,r){return(r||new Fr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizationRecordContainerEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Fr).__init(s.readInt32(s.position())+s.position(),s)}optimizerName(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}runtimeOptimizationRecords(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.RuntimeOptimizationRecord).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}runtimeOptimizationRecordsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizationRecordContainerEntry(s){s.startObject(2)}static addOptimizerName(s,r){s.addFieldOffset(0,r,0)}static addRuntimeOptimizationRecords(s,r){s.addFieldOffset(1,r,0)}static createRuntimeOptimizationRecordsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startRuntimeOptimizationRecordsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizationRecordContainerEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createRuntimeOptimizationRecordContainerEntry(s,r,i){return Fr.startRuntimeOptimizationRecordContainerEntry(s),Fr.addOptimizerName(s,r),Fr.addRuntimeOptimizationRecords(s,i),Fr.endRuntimeOptimizationRecordContainerEntry(s)}};e.RuntimeOptimizationRecordContainerEntry=d}),n0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizations=void 0;var u=o(Pe()),l=r0(),d=class yn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizations(s,r){return(r||new yn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizations(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new yn).__init(s.readInt32(s.position())+s.position(),s)}records(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.RuntimeOptimizationRecordContainerEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}recordsLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizations(s){s.startObject(1)}static addRecords(s,r){s.addFieldOffset(0,r,0)}static createRecordsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startRecordsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizations(s){return s.endObject()}static createRuntimeOptimizations(s,r){return yn.startRuntimeOptimizations(s),yn.addRecords(s,r),yn.endRuntimeOptimizations(s)}};e.RuntimeOptimizations=d}),No=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.TensorDataType=void 0;var t;(function(n){n[n.UNDEFINED=0]="UNDEFINED",n[n.FLOAT=1]="FLOAT",n[n.UINT8=2]="UINT8",n[n.INT8=3]="INT8",n[n.UINT16=4]="UINT16",n[n.INT16=5]="INT16",n[n.INT32=6]="INT32",n[n.INT64=7]="INT64",n[n.STRING=8]="STRING",n[n.BOOL=9]="BOOL",n[n.FLOAT16=10]="FLOAT16",n[n.DOUBLE=11]="DOUBLE",n[n.UINT32=12]="UINT32",n[n.UINT64=13]="UINT64",n[n.COMPLEX64=14]="COMPLEX64",n[n.COMPLEX128=15]="COMPLEX128",n[n.BFLOAT16=16]="BFLOAT16",n[n.FLOAT8E4M3FN=17]="FLOAT8E4M3FN",n[n.FLOAT8E4M3FNUZ=18]="FLOAT8E4M3FNUZ",n[n.FLOAT8E5M2=19]="FLOAT8E5M2",n[n.FLOAT8E5M2FNUZ=20]="FLOAT8E5M2FNUZ"})(t||(e.TensorDataType=t={}))}),zo=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Tensor=void 0;var u=o(Pe()),l=No(),d=class Tt{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsTensor(s,r){return(r||new Tt).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsTensor(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Tt).__init(s.readInt32(s.position())+s.position(),s)}name(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}docString(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}dims(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.readInt64(this.bb.__vector(this.bb_pos+r)+s*8):BigInt(0)}dimsLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}dataType(){let s=this.bb.__offset(this.bb_pos,10);return s?this.bb.readInt32(this.bb_pos+s):l.TensorDataType.UNDEFINED}rawData(s){let r=this.bb.__offset(this.bb_pos,12);return r?this.bb.readUint8(this.bb.__vector(this.bb_pos+r)+s):0}rawDataLength(){let s=this.bb.__offset(this.bb_pos,12);return s?this.bb.__vector_len(this.bb_pos+s):0}rawDataArray(){let s=this.bb.__offset(this.bb_pos,12);return s?new Uint8Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+s),this.bb.__vector_len(this.bb_pos+s)):null}stringData(s,r){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.__string(this.bb.__vector(this.bb_pos+i)+s*4,r):null}stringDataLength(){let s=this.bb.__offset(this.bb_pos,14);return s?this.bb.__vector_len(this.bb_pos+s):0}externalDataOffset(){let s=this.bb.__offset(this.bb_pos,16);return s?this.bb.readInt64(this.bb_pos+s):BigInt("-1")}static startTensor(s){s.startObject(7)}static addName(s,r){s.addFieldOffset(0,r,0)}static addDocString(s,r){s.addFieldOffset(1,r,0)}static addDims(s,r){s.addFieldOffset(2,r,0)}static createDimsVector(s,r){s.startVector(8,r.length,8);for(let i=r.length-1;i>=0;i--)s.addInt64(r[i]);return s.endVector()}static startDimsVector(s,r){s.startVector(8,r,8)}static addDataType(s,r){s.addFieldInt32(3,r,l.TensorDataType.UNDEFINED)}static addRawData(s,r){s.addFieldOffset(4,r,0)}static createRawDataVector(s,r){s.startVector(1,r.length,1);for(let i=r.length-1;i>=0;i--)s.addInt8(r[i]);return s.endVector()}static startRawDataVector(s,r){s.startVector(1,r,1)}static addStringData(s,r){s.addFieldOffset(5,r,0)}static createStringDataVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startStringDataVector(s,r){s.startVector(4,r,4)}static addExternalDataOffset(s,r){s.addFieldInt64(6,r,BigInt("-1"))}static endTensor(s){return s.endObject()}static createTensor(s,r,i,a,p,h,m,b){return Tt.startTensor(s),Tt.addName(s,r),Tt.addDocString(s,i),Tt.addDims(s,a),Tt.addDataType(s,p),Tt.addRawData(s,h),Tt.addStringData(s,m),Tt.addExternalDataOffset(s,b),Tt.endTensor(s)}};e.Tensor=d}),i0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.SparseTensor=void 0;var u=o(Pe()),l=zo(),d=class vu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsSparseTensor(s,r){return(r||new vu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsSparseTensor(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new vu).__init(s.readInt32(s.position())+s.position(),s)}values(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.Tensor).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}indices(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.Tensor).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}dims(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.readInt64(this.bb.__vector(this.bb_pos+r)+s*8):BigInt(0)}dimsLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}static startSparseTensor(s){s.startObject(3)}static addValues(s,r){s.addFieldOffset(0,r,0)}static addIndices(s,r){s.addFieldOffset(1,r,0)}static addDims(s,r){s.addFieldOffset(2,r,0)}static createDimsVector(s,r){s.startVector(8,r.length,8);for(let i=r.length-1;i>=0;i--)s.addInt64(r[i]);return s.endVector()}static startDimsVector(s,r){s.startVector(8,r,8)}static endSparseTensor(s){return s.endObject()}};e.SparseTensor=d}),o0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.MapType=void 0;var u=o(Pe()),l=No(),d=Bo(),c=class xu{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsMapType(r,i){return(i||new xu).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsMapType(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new xu).__init(r.readInt32(r.position())+r.position(),r)}keyType(){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.readInt32(this.bb_pos+r):l.TensorDataType.UNDEFINED}valueType(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new d.TypeInfo).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startMapType(r){r.startObject(2)}static addKeyType(r,i){r.addFieldInt32(0,i,l.TensorDataType.UNDEFINED)}static addValueType(r,i){r.addFieldOffset(1,i,0)}static endMapType(r){return r.endObject()}};e.MapType=c}),s0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.SequenceType=void 0;var u=o(Pe()),l=Bo(),d=class _n{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsSequenceType(s,r){return(r||new _n).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsSequenceType(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new _n).__init(s.readInt32(s.position())+s.position(),s)}elemType(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.TypeInfo).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startSequenceType(s){s.startObject(1)}static addElemType(s,r){s.addFieldOffset(0,r,0)}static endSequenceType(s){return s.endObject()}static createSequenceType(s,r){return _n.startSequenceType(s),_n.addElemType(s,r),_n.endSequenceType(s)}};e.SequenceType=d}),a0=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.DimensionValueType=void 0;var t;(function(n){n[n.UNKNOWN=0]="UNKNOWN",n[n.VALUE=1]="VALUE",n[n.PARAM=2]="PARAM"})(t||(e.DimensionValueType=t={}))}),u0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DimensionValue=void 0;var u=o(Pe()),l=a0(),d=class hr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDimensionValue(s,r){return(r||new hr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDimensionValue(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new hr).__init(s.readInt32(s.position())+s.position(),s)}dimType(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readInt8(this.bb_pos+s):l.DimensionValueType.UNKNOWN}dimValue(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readInt64(this.bb_pos+s):BigInt("0")}dimParam(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.__string(this.bb_pos+r,s):null}static startDimensionValue(s){s.startObject(3)}static addDimType(s,r){s.addFieldInt8(0,r,l.DimensionValueType.UNKNOWN)}static addDimValue(s,r){s.addFieldInt64(1,r,BigInt("0"))}static addDimParam(s,r){s.addFieldOffset(2,r,0)}static endDimensionValue(s){return s.endObject()}static createDimensionValue(s,r,i,a){return hr.startDimensionValue(s),hr.addDimType(s,r),hr.addDimValue(s,i),hr.addDimParam(s,a),hr.endDimensionValue(s)}};e.DimensionValue=d}),l0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Dimension=void 0;var u=o(Pe()),l=u0(),d=class jr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDimension(s,r){return(r||new jr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDimension(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new jr).__init(s.readInt32(s.position())+s.position(),s)}value(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.DimensionValue).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}denotation(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}static startDimension(s){s.startObject(2)}static addValue(s,r){s.addFieldOffset(0,r,0)}static addDenotation(s,r){s.addFieldOffset(1,r,0)}static endDimension(s){return s.endObject()}static createDimension(s,r,i){return jr.startDimension(s),jr.addValue(s,r),jr.addDenotation(s,i),jr.endDimension(s)}};e.Dimension=d}),d0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Shape=void 0;var u=o(Pe()),l=l0(),d=class wn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsShape(s,r){return(r||new wn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsShape(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new wn).__init(s.readInt32(s.position())+s.position(),s)}dim(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.Dimension).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}dimLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startShape(s){s.startObject(1)}static addDim(s,r){s.addFieldOffset(0,r,0)}static createDimVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startDimVector(s,r){s.startVector(4,r,4)}static endShape(s){return s.endObject()}static createShape(s,r){return wn.startShape(s),wn.addDim(s,r),wn.endShape(s)}};e.Shape=d}),c0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.TensorTypeAndShape=void 0;var u=o(Pe()),l=d0(),d=No(),c=class $u{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsTensorTypeAndShape(r,i){return(i||new $u).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsTensorTypeAndShape(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new $u).__init(r.readInt32(r.position())+r.position(),r)}elemType(){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.readInt32(this.bb_pos+r):d.TensorDataType.UNDEFINED}shape(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.Shape).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startTensorTypeAndShape(r){r.startObject(2)}static addElemType(r,i){r.addFieldInt32(0,i,d.TensorDataType.UNDEFINED)}static addShape(r,i){r.addFieldOffset(1,i,0)}static endTensorTypeAndShape(r){return r.endObject()}};e.TensorTypeAndShape=c}),p0=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.TypeInfoValue=void 0,e.unionToTypeInfoValue=l,e.unionListToTypeInfoValue=d;var t=o0(),n=s0(),o=c0(),u;(function(c){c[c.NONE=0]="NONE",c[c.tensor_type=1]="tensor_type",c[c.sequence_type=2]="sequence_type",c[c.map_type=3]="map_type"})(u||(e.TypeInfoValue=u={}));function l(c,s){switch(u[c]){case"NONE":return null;case"tensor_type":return s(new o.TensorTypeAndShape);case"sequence_type":return s(new n.SequenceType);case"map_type":return s(new t.MapType);default:return null}}function d(c,s,r){switch(u[c]){case"NONE":return null;case"tensor_type":return s(r,new o.TensorTypeAndShape);case"sequence_type":return s(r,new n.SequenceType);case"map_type":return s(r,new t.MapType);default:return null}}}),Bo=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.TypeInfo=void 0;var u=o(Pe()),l=p0(),d=class fr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsTypeInfo(s,r){return(r||new fr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsTypeInfo(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new fr).__init(s.readInt32(s.position())+s.position(),s)}denotation(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}valueType(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint8(this.bb_pos+s):l.TypeInfoValue.NONE}value(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.__union(s,this.bb_pos+r):null}static startTypeInfo(s){s.startObject(3)}static addDenotation(s,r){s.addFieldOffset(0,r,0)}static addValueType(s,r){s.addFieldInt8(1,r,l.TypeInfoValue.NONE)}static addValue(s,r){s.addFieldOffset(2,r,0)}static endTypeInfo(s){return s.endObject()}static createTypeInfo(s,r,i,a){return fr.startTypeInfo(s),fr.addDenotation(s,r),fr.addValueType(s,i),fr.addValue(s,a),fr.endTypeInfo(s)}};e.TypeInfo=d}),h0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.ValueInfo=void 0;var u=o(Pe()),l=Bo(),d=class Tu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsValueInfo(s,r){return(r||new Tu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsValueInfo(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Tu).__init(s.readInt32(s.position())+s.position(),s)}name(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}docString(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}type(s){let r=this.bb.__offset(this.bb_pos,8);return r?(s||new l.TypeInfo).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startValueInfo(s){s.startObject(3)}static addName(s,r){s.addFieldOffset(0,r,0)}static addDocString(s,r){s.addFieldOffset(1,r,0)}static addType(s,r){s.addFieldOffset(2,r,0)}static endValueInfo(s){return s.endObject()}};e.ValueInfo=d}),vl=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(p,h,m,b){b===void 0&&(b=m);var x=Object.getOwnPropertyDescriptor(h,m);(!x||("get"in x?!h.__esModule:x.writable||x.configurable))&&(x={enumerable:!0,get:function(){return h[m]}}),Object.defineProperty(p,b,x)}:function(p,h,m,b){b===void 0&&(b=m),p[b]=h[m]}),n=e&&e.__setModuleDefault||(Object.create?function(p,h){Object.defineProperty(p,"default",{enumerable:!0,value:h})}:function(p,h){p.default=h}),o=e&&e.__importStar||(function(){var p=function(h){return p=Object.getOwnPropertyNames||function(m){var b=[];for(var x in m)Object.prototype.hasOwnProperty.call(m,x)&&(b[b.length]=x);return b},p(h)};return function(h){if(h&&h.__esModule)return h;var m={};if(h!=null)for(var b=p(h),x=0;x<b.length;x++)b[x]!=="default"&&t(m,h,b[x]);return n(m,h),m}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Graph=void 0;var u=o(Pe()),l=Jy(),d=Qy(),c=n0(),s=i0(),r=zo(),i=h0(),a=class Su{constructor(){this.bb=null,this.bb_pos=0}__init(h,m){return this.bb_pos=h,this.bb=m,this}static getRootAsGraph(h,m){return(m||new Su).__init(h.readInt32(h.position())+h.position(),h)}static getSizePrefixedRootAsGraph(h,m){return h.setPosition(h.position()+u.SIZE_PREFIX_LENGTH),(m||new Su).__init(h.readInt32(h.position())+h.position(),h)}initializers(h,m){let b=this.bb.__offset(this.bb_pos,4);return b?(m||new r.Tensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}initializersLength(){let h=this.bb.__offset(this.bb_pos,4);return h?this.bb.__vector_len(this.bb_pos+h):0}nodeArgs(h,m){let b=this.bb.__offset(this.bb_pos,6);return b?(m||new i.ValueInfo).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodeArgsLength(){let h=this.bb.__offset(this.bb_pos,6);return h?this.bb.__vector_len(this.bb_pos+h):0}nodes(h,m){let b=this.bb.__offset(this.bb_pos,8);return b?(m||new l.Node).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodesLength(){let h=this.bb.__offset(this.bb_pos,8);return h?this.bb.__vector_len(this.bb_pos+h):0}maxNodeIndex(){let h=this.bb.__offset(this.bb_pos,10);return h?this.bb.readUint32(this.bb_pos+h):0}nodeEdges(h,m){let b=this.bb.__offset(this.bb_pos,12);return b?(m||new d.NodeEdge).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodeEdgesLength(){let h=this.bb.__offset(this.bb_pos,12);return h?this.bb.__vector_len(this.bb_pos+h):0}inputs(h,m){let b=this.bb.__offset(this.bb_pos,14);return b?this.bb.__string(this.bb.__vector(this.bb_pos+b)+h*4,m):null}inputsLength(){let h=this.bb.__offset(this.bb_pos,14);return h?this.bb.__vector_len(this.bb_pos+h):0}outputs(h,m){let b=this.bb.__offset(this.bb_pos,16);return b?this.bb.__string(this.bb.__vector(this.bb_pos+b)+h*4,m):null}outputsLength(){let h=this.bb.__offset(this.bb_pos,16);return h?this.bb.__vector_len(this.bb_pos+h):0}sparseInitializers(h,m){let b=this.bb.__offset(this.bb_pos,18);return b?(m||new s.SparseTensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}sparseInitializersLength(){let h=this.bb.__offset(this.bb_pos,18);return h?this.bb.__vector_len(this.bb_pos+h):0}runtimeOptimizations(h){let m=this.bb.__offset(this.bb_pos,20);return m?(h||new c.RuntimeOptimizations).__init(this.bb.__indirect(this.bb_pos+m),this.bb):null}static startGraph(h){h.startObject(9)}static addInitializers(h,m){h.addFieldOffset(0,m,0)}static createInitializersVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startInitializersVector(h,m){h.startVector(4,m,4)}static addNodeArgs(h,m){h.addFieldOffset(1,m,0)}static createNodeArgsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodeArgsVector(h,m){h.startVector(4,m,4)}static addNodes(h,m){h.addFieldOffset(2,m,0)}static createNodesVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodesVector(h,m){h.startVector(4,m,4)}static addMaxNodeIndex(h,m){h.addFieldInt32(3,m,0)}static addNodeEdges(h,m){h.addFieldOffset(4,m,0)}static createNodeEdgesVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodeEdgesVector(h,m){h.startVector(4,m,4)}static addInputs(h,m){h.addFieldOffset(5,m,0)}static createInputsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startInputsVector(h,m){h.startVector(4,m,4)}static addOutputs(h,m){h.addFieldOffset(6,m,0)}static createOutputsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startOutputsVector(h,m){h.startVector(4,m,4)}static addSparseInitializers(h,m){h.addFieldOffset(7,m,0)}static createSparseInitializersVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startSparseInitializersVector(h,m){h.startVector(4,m,4)}static addRuntimeOptimizations(h,m){h.addFieldOffset(8,m,0)}static endGraph(h){return h.endObject()}};e.Graph=a}),f0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(r,i,a,p){p===void 0&&(p=a);var h=Object.getOwnPropertyDescriptor(i,a);(!h||("get"in h?!i.__esModule:h.writable||h.configurable))&&(h={enumerable:!0,get:function(){return i[a]}}),Object.defineProperty(r,p,h)}:function(r,i,a,p){p===void 0&&(p=a),r[p]=i[a]}),n=e&&e.__setModuleDefault||(Object.create?function(r,i){Object.defineProperty(r,"default",{enumerable:!0,value:i})}:function(r,i){r.default=i}),o=e&&e.__importStar||(function(){var r=function(i){return r=Object.getOwnPropertyNames||function(a){var p=[];for(var h in a)Object.prototype.hasOwnProperty.call(a,h)&&(p[p.length]=h);return p},r(i)};return function(i){if(i&&i.__esModule)return i;var a={};if(i!=null)for(var p=r(i),h=0;h<p.length;h++)p[h]!=="default"&&t(a,i,p[h]);return n(a,i),a}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Attribute=void 0;var u=o(Pe()),l=Xy(),d=vl(),c=zo(),s=class Iu{constructor(){this.bb=null,this.bb_pos=0}__init(i,a){return this.bb_pos=i,this.bb=a,this}static getRootAsAttribute(i,a){return(a||new Iu).__init(i.readInt32(i.position())+i.position(),i)}static getSizePrefixedRootAsAttribute(i,a){return i.setPosition(i.position()+u.SIZE_PREFIX_LENGTH),(a||new Iu).__init(i.readInt32(i.position())+i.position(),i)}name(i){let a=this.bb.__offset(this.bb_pos,4);return a?this.bb.__string(this.bb_pos+a,i):null}docString(i){let a=this.bb.__offset(this.bb_pos,6);return a?this.bb.__string(this.bb_pos+a,i):null}type(){let i=this.bb.__offset(this.bb_pos,8);return i?this.bb.readInt32(this.bb_pos+i):l.AttributeType.UNDEFINED}f(){let i=this.bb.__offset(this.bb_pos,10);return i?this.bb.readFloat32(this.bb_pos+i):0}i(){let i=this.bb.__offset(this.bb_pos,12);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}s(i){let a=this.bb.__offset(this.bb_pos,14);return a?this.bb.__string(this.bb_pos+a,i):null}t(i){let a=this.bb.__offset(this.bb_pos,16);return a?(i||new c.Tensor).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}g(i){let a=this.bb.__offset(this.bb_pos,18);return a?(i||new d.Graph).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}floats(i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.readFloat32(this.bb.__vector(this.bb_pos+a)+i*4):0}floatsLength(){let i=this.bb.__offset(this.bb_pos,20);return i?this.bb.__vector_len(this.bb_pos+i):0}floatsArray(){let i=this.bb.__offset(this.bb_pos,20);return i?new Float32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+i),this.bb.__vector_len(this.bb_pos+i)):null}ints(i){let a=this.bb.__offset(this.bb_pos,22);return a?this.bb.readInt64(this.bb.__vector(this.bb_pos+a)+i*8):BigInt(0)}intsLength(){let i=this.bb.__offset(this.bb_pos,22);return i?this.bb.__vector_len(this.bb_pos+i):0}strings(i,a){let p=this.bb.__offset(this.bb_pos,24);return p?this.bb.__string(this.bb.__vector(this.bb_pos+p)+i*4,a):null}stringsLength(){let i=this.bb.__offset(this.bb_pos,24);return i?this.bb.__vector_len(this.bb_pos+i):0}tensors(i,a){let p=this.bb.__offset(this.bb_pos,26);return p?(a||new c.Tensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}tensorsLength(){let i=this.bb.__offset(this.bb_pos,26);return i?this.bb.__vector_len(this.bb_pos+i):0}graphs(i,a){let p=this.bb.__offset(this.bb_pos,28);return p?(a||new d.Graph).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}graphsLength(){let i=this.bb.__offset(this.bb_pos,28);return i?this.bb.__vector_len(this.bb_pos+i):0}static startAttribute(i){i.startObject(13)}static addName(i,a){i.addFieldOffset(0,a,0)}static addDocString(i,a){i.addFieldOffset(1,a,0)}static addType(i,a){i.addFieldInt32(2,a,l.AttributeType.UNDEFINED)}static addF(i,a){i.addFieldFloat32(3,a,0)}static addI(i,a){i.addFieldInt64(4,a,BigInt("0"))}static addS(i,a){i.addFieldOffset(5,a,0)}static addT(i,a){i.addFieldOffset(6,a,0)}static addG(i,a){i.addFieldOffset(7,a,0)}static addFloats(i,a){i.addFieldOffset(8,a,0)}static createFloatsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addFloat32(a[p]);return i.endVector()}static startFloatsVector(i,a){i.startVector(4,a,4)}static addInts(i,a){i.addFieldOffset(9,a,0)}static createIntsVector(i,a){i.startVector(8,a.length,8);for(let p=a.length-1;p>=0;p--)i.addInt64(a[p]);return i.endVector()}static startIntsVector(i,a){i.startVector(8,a,8)}static addStrings(i,a){i.addFieldOffset(10,a,0)}static createStringsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startStringsVector(i,a){i.startVector(4,a,4)}static addTensors(i,a){i.addFieldOffset(11,a,0)}static createTensorsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startTensorsVector(i,a){i.startVector(4,a,4)}static addGraphs(i,a){i.addFieldOffset(12,a,0)}static createGraphsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startGraphsVector(i,a){i.startVector(4,a,4)}static endAttribute(i){return i.endObject()}};e.Attribute=s}),m0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedKernelCreateInfos=void 0;var u=o(Pe()),l=class Lr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsDeprecatedKernelCreateInfos(c,s){return(s||new Lr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsDeprecatedKernelCreateInfos(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Lr).__init(c.readInt32(c.position())+c.position(),c)}nodeIndices(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb.__vector(this.bb_pos+s)+c*4):0}nodeIndicesLength(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.__vector_len(this.bb_pos+c):0}nodeIndicesArray(){let c=this.bb.__offset(this.bb_pos,4);return c?new Uint32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+c),this.bb.__vector_len(this.bb_pos+c)):null}kernelDefHashes(c){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint64(this.bb.__vector(this.bb_pos+s)+c*8):BigInt(0)}kernelDefHashesLength(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.__vector_len(this.bb_pos+c):0}static startDeprecatedKernelCreateInfos(c){c.startObject(2)}static addNodeIndices(c,s){c.addFieldOffset(0,s,0)}static createNodeIndicesVector(c,s){c.startVector(4,s.length,4);for(let r=s.length-1;r>=0;r--)c.addInt32(s[r]);return c.endVector()}static startNodeIndicesVector(c,s){c.startVector(4,s,4)}static addKernelDefHashes(c,s){c.addFieldOffset(1,s,0)}static createKernelDefHashesVector(c,s){c.startVector(8,s.length,8);for(let r=s.length-1;r>=0;r--)c.addInt64(s[r]);return c.endVector()}static startKernelDefHashesVector(c,s){c.startVector(8,s,8)}static endDeprecatedKernelCreateInfos(c){return c.endObject()}static createDeprecatedKernelCreateInfos(c,s,r){return Lr.startDeprecatedKernelCreateInfos(c),Lr.addNodeIndices(c,s),Lr.addKernelDefHashes(c,r),Lr.endDeprecatedKernelCreateInfos(c)}};e.DeprecatedKernelCreateInfos=l}),XI=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedNodeIndexAndKernelDefHash=void 0;var u=o(Pe()),l=class Vr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsDeprecatedNodeIndexAndKernelDefHash(c,s){return(s||new Vr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsDeprecatedNodeIndexAndKernelDefHash(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Vr).__init(c.readInt32(c.position())+c.position(),c)}nodeIndex(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.readUint32(this.bb_pos+c):0}kernelDefHash(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readUint64(this.bb_pos+c):BigInt("0")}static startDeprecatedNodeIndexAndKernelDefHash(c){c.startObject(2)}static addNodeIndex(c,s){c.addFieldInt32(0,s,0)}static addKernelDefHash(c,s){c.addFieldInt64(1,s,BigInt("0"))}static endDeprecatedNodeIndexAndKernelDefHash(c){return c.endObject()}static createDeprecatedNodeIndexAndKernelDefHash(c,s,r){return Vr.startDeprecatedNodeIndexAndKernelDefHash(c),Vr.addNodeIndex(c,s),Vr.addKernelDefHash(c,r),Vr.endDeprecatedNodeIndexAndKernelDefHash(c)}};e.DeprecatedNodeIndexAndKernelDefHash=l}),g0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedSubGraphSessionState=void 0;var u=o(Pe()),l=b0(),d=class Ou{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDeprecatedSubGraphSessionState(s,r){return(r||new Ou).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDeprecatedSubGraphSessionState(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Ou).__init(s.readInt32(s.position())+s.position(),s)}graphId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}sessionState(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.DeprecatedSessionState).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startDeprecatedSubGraphSessionState(s){s.startObject(2)}static addGraphId(s,r){s.addFieldOffset(0,r,0)}static addSessionState(s,r){s.addFieldOffset(1,r,0)}static endDeprecatedSubGraphSessionState(s){let r=s.endObject();return s.requiredField(r,4),r}};e.DeprecatedSubGraphSessionState=d}),b0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedSessionState=void 0;var u=o(Pe()),l=m0(),d=g0(),c=class Ur{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsDeprecatedSessionState(r,i){return(i||new Ur).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsDeprecatedSessionState(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new Ur).__init(r.readInt32(r.position())+r.position(),r)}kernels(r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.DeprecatedKernelCreateInfos).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}subGraphSessionStates(r,i){let a=this.bb.__offset(this.bb_pos,6);return a?(i||new d.DeprecatedSubGraphSessionState).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+a)+r*4),this.bb):null}subGraphSessionStatesLength(){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__vector_len(this.bb_pos+r):0}static startDeprecatedSessionState(r){r.startObject(2)}static addKernels(r,i){r.addFieldOffset(0,i,0)}static addSubGraphSessionStates(r,i){r.addFieldOffset(1,i,0)}static createSubGraphSessionStatesVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startSubGraphSessionStatesVector(r,i){r.startVector(4,i,4)}static endDeprecatedSessionState(r){return r.endObject()}static createDeprecatedSessionState(r,i,a){return Ur.startDeprecatedSessionState(r),Ur.addKernels(r,i),Ur.addSubGraphSessionStates(r,a),Ur.endDeprecatedSessionState(r)}};e.DeprecatedSessionState=c}),y0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.KernelTypeStrArgsEntry=void 0;var u=o(Pe()),l=Ky(),d=class Gr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsKernelTypeStrArgsEntry(s,r){return(r||new Gr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsKernelTypeStrArgsEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Gr).__init(s.readInt32(s.position())+s.position(),s)}kernelTypeStr(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}args(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.ArgTypeAndIndex).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}argsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startKernelTypeStrArgsEntry(s){s.startObject(2)}static addKernelTypeStr(s,r){s.addFieldOffset(0,r,0)}static addArgs(s,r){s.addFieldOffset(1,r,0)}static createArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startArgsVector(s,r){s.startVector(4,r,4)}static endKernelTypeStrArgsEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createKernelTypeStrArgsEntry(s,r,i){return Gr.startKernelTypeStrArgsEntry(s),Gr.addKernelTypeStr(s,r),Gr.addArgs(s,i),Gr.endKernelTypeStrArgsEntry(s)}};e.KernelTypeStrArgsEntry=d}),_0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.OpIdKernelTypeStrArgsEntry=void 0;var u=o(Pe()),l=y0(),d=class qr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsOpIdKernelTypeStrArgsEntry(s,r){return(r||new qr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsOpIdKernelTypeStrArgsEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new qr).__init(s.readInt32(s.position())+s.position(),s)}opId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}kernelTypeStrArgs(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.KernelTypeStrArgsEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}kernelTypeStrArgsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startOpIdKernelTypeStrArgsEntry(s){s.startObject(2)}static addOpId(s,r){s.addFieldOffset(0,r,0)}static addKernelTypeStrArgs(s,r){s.addFieldOffset(1,r,0)}static createKernelTypeStrArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startKernelTypeStrArgsVector(s,r){s.startVector(4,r,4)}static endOpIdKernelTypeStrArgsEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createOpIdKernelTypeStrArgsEntry(s,r,i){return qr.startOpIdKernelTypeStrArgsEntry(s),qr.addOpId(s,r),qr.addKernelTypeStrArgs(s,i),qr.endOpIdKernelTypeStrArgsEntry(s)}};e.OpIdKernelTypeStrArgsEntry=d}),w0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.KernelTypeStrResolver=void 0;var u=o(Pe()),l=_0(),d=class vn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsKernelTypeStrResolver(s,r){return(r||new vn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsKernelTypeStrResolver(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new vn).__init(s.readInt32(s.position())+s.position(),s)}opKernelTypeStrArgs(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.OpIdKernelTypeStrArgsEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}opKernelTypeStrArgsLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startKernelTypeStrResolver(s){s.startObject(1)}static addOpKernelTypeStrArgs(s,r){s.addFieldOffset(0,r,0)}static createOpKernelTypeStrArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startOpKernelTypeStrArgsVector(s,r){s.startVector(4,r,4)}static endKernelTypeStrResolver(s){return s.endObject()}static createKernelTypeStrResolver(s,r){return vn.startKernelTypeStrResolver(s),vn.addOpKernelTypeStrArgs(s,r),vn.endKernelTypeStrResolver(s)}};e.KernelTypeStrResolver=d}),v0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.OperatorSetId=void 0;var u=o(Pe()),l=class Hr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsOperatorSetId(c,s){return(s||new Hr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsOperatorSetId(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Hr).__init(c.readInt32(c.position())+c.position(),c)}domain(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__string(this.bb_pos+s,c):null}version(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readInt64(this.bb_pos+c):BigInt("0")}static startOperatorSetId(c){c.startObject(2)}static addDomain(c,s){c.addFieldOffset(0,s,0)}static addVersion(c,s){c.addFieldInt64(1,s,BigInt("0"))}static endOperatorSetId(c){return c.endObject()}static createOperatorSetId(c,s,r){return Hr.startOperatorSetId(c),Hr.addDomain(c,s),Hr.addVersion(c,r),Hr.endOperatorSetId(c)}};e.OperatorSetId=l}),x0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.StringStringEntry=void 0;var u=o(Pe()),l=class Wr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsStringStringEntry(c,s){return(s||new Wr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsStringStringEntry(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Wr).__init(c.readInt32(c.position())+c.position(),c)}key(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__string(this.bb_pos+s,c):null}value(c){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__string(this.bb_pos+s,c):null}static startStringStringEntry(c){c.startObject(2)}static addKey(c,s){c.addFieldOffset(0,s,0)}static addValue(c,s){c.addFieldOffset(1,s,0)}static endStringStringEntry(c){return c.endObject()}static createStringStringEntry(c,s,r){return Wr.startStringStringEntry(c),Wr.addKey(c,s),Wr.addValue(c,r),Wr.endStringStringEntry(c)}};e.StringStringEntry=l}),$0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(r,i,a,p){p===void 0&&(p=a);var h=Object.getOwnPropertyDescriptor(i,a);(!h||("get"in h?!i.__esModule:h.writable||h.configurable))&&(h={enumerable:!0,get:function(){return i[a]}}),Object.defineProperty(r,p,h)}:function(r,i,a,p){p===void 0&&(p=a),r[p]=i[a]}),n=e&&e.__setModuleDefault||(Object.create?function(r,i){Object.defineProperty(r,"default",{enumerable:!0,value:i})}:function(r,i){r.default=i}),o=e&&e.__importStar||(function(){var r=function(i){return r=Object.getOwnPropertyNames||function(a){var p=[];for(var h in a)Object.prototype.hasOwnProperty.call(a,h)&&(p[p.length]=h);return p},r(i)};return function(i){if(i&&i.__esModule)return i;var a={};if(i!=null)for(var p=r(i),h=0;h<p.length;h++)p[h]!=="default"&&t(a,i,p[h]);return n(a,i),a}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Model=void 0;var u=o(Pe()),l=vl(),d=v0(),c=x0(),s=class Eu{constructor(){this.bb=null,this.bb_pos=0}__init(i,a){return this.bb_pos=i,this.bb=a,this}static getRootAsModel(i,a){return(a||new Eu).__init(i.readInt32(i.position())+i.position(),i)}static getSizePrefixedRootAsModel(i,a){return i.setPosition(i.position()+u.SIZE_PREFIX_LENGTH),(a||new Eu).__init(i.readInt32(i.position())+i.position(),i)}irVersion(){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}opsetImport(i,a){let p=this.bb.__offset(this.bb_pos,6);return p?(a||new d.OperatorSetId).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}opsetImportLength(){let i=this.bb.__offset(this.bb_pos,6);return i?this.bb.__vector_len(this.bb_pos+i):0}producerName(i){let a=this.bb.__offset(this.bb_pos,8);return a?this.bb.__string(this.bb_pos+a,i):null}producerVersion(i){let a=this.bb.__offset(this.bb_pos,10);return a?this.bb.__string(this.bb_pos+a,i):null}domain(i){let a=this.bb.__offset(this.bb_pos,12);return a?this.bb.__string(this.bb_pos+a,i):null}modelVersion(){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}docString(i){let a=this.bb.__offset(this.bb_pos,16);return a?this.bb.__string(this.bb_pos+a,i):null}graph(i){let a=this.bb.__offset(this.bb_pos,18);return a?(i||new l.Graph).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}graphDocString(i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.__string(this.bb_pos+a,i):null}metadataProps(i,a){let p=this.bb.__offset(this.bb_pos,22);return p?(a||new c.StringStringEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}metadataPropsLength(){let i=this.bb.__offset(this.bb_pos,22);return i?this.bb.__vector_len(this.bb_pos+i):0}static startModel(i){i.startObject(10)}static addIrVersion(i,a){i.addFieldInt64(0,a,BigInt("0"))}static addOpsetImport(i,a){i.addFieldOffset(1,a,0)}static createOpsetImportVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startOpsetImportVector(i,a){i.startVector(4,a,4)}static addProducerName(i,a){i.addFieldOffset(2,a,0)}static addProducerVersion(i,a){i.addFieldOffset(3,a,0)}static addDomain(i,a){i.addFieldOffset(4,a,0)}static addModelVersion(i,a){i.addFieldInt64(5,a,BigInt("0"))}static addDocString(i,a){i.addFieldOffset(6,a,0)}static addGraph(i,a){i.addFieldOffset(7,a,0)}static addGraphDocString(i,a){i.addFieldOffset(8,a,0)}static addMetadataProps(i,a){i.addFieldOffset(9,a,0)}static createMetadataPropsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startMetadataPropsVector(i,a){i.startVector(4,a,4)}static endModel(i){return i.endObject()}};e.Model=s}),ZI=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.InferenceSession=void 0;var u=o(Pe()),l=w0(),d=$0(),c=class Au{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsInferenceSession(r,i){return(i||new Au).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsInferenceSession(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new Au).__init(r.readInt32(r.position())+r.position(),r)}static bufferHasIdentifier(r){return r.__has_identifier("ORTM")}ortVersion(r){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.__string(this.bb_pos+i,r):null}model(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new d.Model).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}kernelTypeStrResolver(r){let i=this.bb.__offset(this.bb_pos,10);return i?(r||new l.KernelTypeStrResolver).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startInferenceSession(r){r.startObject(4)}static addOrtVersion(r,i){r.addFieldOffset(0,i,0)}static addModel(r,i){r.addFieldOffset(1,i,0)}static addKernelTypeStrResolver(r,i){r.addFieldOffset(3,i,0)}static endInferenceSession(r){return r.endObject()}static finishInferenceSessionBuffer(r,i){r.finish(i,"ORTM")}static finishSizePrefixedInferenceSessionBuffer(r,i){r.finish(i,"ORTM",!0)}};e.InferenceSession=c}),JI,YI,Pu,Rt,QI,e3,t3,r3,n3,i3,o3,s3,T0,S0,a3,u3,l3,d3,I0,c3,p3,h3,f3,m3,g3,b3,y3,_3,w3,v3,x3,$3,bo,O0,T3,E0,S3,I3=R(()=>{"use strict";JI=ce(Vy()),YI=ce(Ky()),Pu=ce(f0()),Rt=ce(Xy()),QI=ce(m0()),e3=ce(XI()),t3=ce(b0()),r3=ce(g0()),n3=ce(l0()),i3=ce(u0()),o3=ce(a0()),s3=ce(Yy()),T0=ce(vl()),S0=ce(ZI()),a3=ce(y0()),u3=ce(w0()),l3=ce(o0()),d3=ce($0()),I0=ce(Jy()),c3=ce(Qy()),p3=ce(Zy()),h3=ce(e0()),f3=ce(_0()),m3=ce(v0()),g3=ce(t0()),b3=ce(r0()),y3=ce(n0()),_3=ce(s0()),w3=ce(d0()),v3=ce(i0()),x3=ce(x0()),$3=ce(zo()),bo=ce(No()),O0=ce(c0()),T3=ce(Bo()),E0=ce(p0()),S3=ce(h0())}),Mo=R(()=>{"use strict";I3()}),O3=ie((e,t)=>{"use strict";t.exports=n;function n(o,u){for(var l=new Array(arguments.length-1),d=0,c=2,s=!0;c<arguments.length;)l[d++]=arguments[c++];return new Promise(function(r,i){l[d]=function(a){if(s)if(s=!1,a)i(a);else{for(var p=new Array(arguments.length-1),h=0;h<p.length;)p[h++]=arguments[h];r.apply(null,p)}};try{o.apply(u||null,l)}catch(a){s&&(s=!1,i(a))}})}}),E3=ie(e=>{"use strict";var t=e;t.length=function(d){var c=d.length;if(!c)return 0;for(var s=0;--c%4>1&&d.charAt(c)==="=";)++s;return Math.ceil(d.length*3)/4-s};var n=new Array(64),o=new Array(123);for(u=0;u<64;)o[n[u]=u<26?u+65:u<52?u+71:u<62?u-4:u-59|43]=u++;var u;t.encode=function(d,c,s){for(var r=null,i=[],a=0,p=0,h;c<s;){var m=d[c++];switch(p){case 0:i[a++]=n[m>>2],h=(m&3)<<4,p=1;break;case 1:i[a++]=n[h|m>>4],h=(m&15)<<2,p=2;break;case 2:i[a++]=n[h|m>>6],i[a++]=n[m&63],p=0;break}a>8191&&((r||(r=[])).push(String.fromCharCode.apply(String,i)),a=0)}return p&&(i[a++]=n[h],i[a++]=61,p===1&&(i[a++]=61)),r?(a&&r.push(String.fromCharCode.apply(String,i.slice(0,a))),r.join("")):String.fromCharCode.apply(String,i.slice(0,a))};var l="invalid encoding";t.decode=function(d,c,s){for(var r=s,i=0,a,p=0;p<d.length;){var h=d.charCodeAt(p++);if(h===61&&i>1)break;if((h=o[h])===void 0)throw Error(l);switch(i){case 0:a=h,i=1;break;case 1:c[s++]=a<<2|(h&48)>>4,a=h,i=2;break;case 2:c[s++]=(a&15)<<4|(h&60)>>2,a=h,i=3;break;case 3:c[s++]=(a&3)<<6|h,i=0;break}}if(i===1)throw Error(l);return s-r},t.test=function(d){return/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(d)}}),A3=ie((e,t)=>{"use strict";t.exports=n;function n(){this._listeners=Object.create(null)}n.prototype.on=function(o,u,l){return(this._listeners[o]||(this._listeners[o]=[])).push({fn:u,ctx:l||this}),this},n.prototype.off=function(o,u){if(o===void 0)this._listeners=Object.create(null);else if(u===void 0)this._listeners[o]=[];else{var l=this._listeners[o];if(!l)return this;for(var d=0;d<l.length;)l[d].fn===u?l.splice(d,1):++d}return this},n.prototype.emit=function(o){var u=this._listeners[o];if(u){for(var l=[],d=1;d<arguments.length;)l.push(arguments[d++]);for(d=0;d<u.length;)u[d].fn.apply(u[d++].ctx,l)}return this}}),P3=ie((e,t)=>{"use strict";t.exports=n(n);function n(c){return typeof Float32Array<"u"?(function(){var s=new Float32Array([-0]),r=new Uint8Array(s.buffer),i=r[3]===128;function a(b,x,_){s[0]=b,x[_]=r[0],x[_+1]=r[1],x[_+2]=r[2],x[_+3]=r[3]}function p(b,x,_){s[0]=b,x[_]=r[3],x[_+1]=r[2],x[_+2]=r[1],x[_+3]=r[0]}c.writeFloatLE=i?a:p,c.writeFloatBE=i?p:a;function h(b,x){return r[0]=b[x],r[1]=b[x+1],r[2]=b[x+2],r[3]=b[x+3],s[0]}function m(b,x){return r[3]=b[x],r[2]=b[x+1],r[1]=b[x+2],r[0]=b[x+3],s[0]}c.readFloatLE=i?h:m,c.readFloatBE=i?m:h})():(function(){function s(i,a,p,h){var m=a<0?1:0;if(m&&(a=-a),a===0)i(1/a>0?0:2147483648,p,h);else if(isNaN(a))i(2143289344,p,h);else if(a>34028234663852886e22)i((m<<31|2139095040)>>>0,p,h);else if(a<11754943508222875e-54)i((m<<31|Math.round(a/1401298464324817e-60))>>>0,p,h);else{var b=Math.floor(Math.log(a)/Math.LN2),x=Math.round(a*Math.pow(2,-b)*8388608)&8388607;i((m<<31|b+127<<23|x)>>>0,p,h)}}c.writeFloatLE=s.bind(null,o),c.writeFloatBE=s.bind(null,u);function r(i,a,p){var h=i(a,p),m=(h>>31)*2+1,b=h>>>23&255,x=h&8388607;return b===255?x?NaN:m*(1/0):b===0?m*1401298464324817e-60*x:m*Math.pow(2,b-150)*(x+8388608)}c.readFloatLE=r.bind(null,l),c.readFloatBE=r.bind(null,d)})(),typeof Float64Array<"u"?(function(){var s=new Float64Array([-0]),r=new Uint8Array(s.buffer),i=r[7]===128;function a(b,x,_){s[0]=b,x[_]=r[0],x[_+1]=r[1],x[_+2]=r[2],x[_+3]=r[3],x[_+4]=r[4],x[_+5]=r[5],x[_+6]=r[6],x[_+7]=r[7]}function p(b,x,_){s[0]=b,x[_]=r[7],x[_+1]=r[6],x[_+2]=r[5],x[_+3]=r[4],x[_+4]=r[3],x[_+5]=r[2],x[_+6]=r[1],x[_+7]=r[0]}c.writeDoubleLE=i?a:p,c.writeDoubleBE=i?p:a;function h(b,x){return r[0]=b[x],r[1]=b[x+1],r[2]=b[x+2],r[3]=b[x+3],r[4]=b[x+4],r[5]=b[x+5],r[6]=b[x+6],r[7]=b[x+7],s[0]}function m(b,x){return r[7]=b[x],r[6]=b[x+1],r[5]=b[x+2],r[4]=b[x+3],r[3]=b[x+4],r[2]=b[x+5],r[1]=b[x+6],r[0]=b[x+7],s[0]}c.readDoubleLE=i?h:m,c.readDoubleBE=i?m:h})():(function(){function s(i,a,p,h,m,b){var x=h<0?1:0;if(x&&(h=-h),h===0)i(0,m,b+a),i(1/h>0?0:2147483648,m,b+p);else if(isNaN(h))i(0,m,b+a),i(2146959360,m,b+p);else if(h>17976931348623157e292)i(0,m,b+a),i((x<<31|2146435072)>>>0,m,b+p);else{var _;if(h<22250738585072014e-324)_=h/5e-324,i(_>>>0,m,b+a),i((x<<31|_/4294967296)>>>0,m,b+p);else{var y=Math.floor(Math.log(h)/Math.LN2);y===1024&&(y=1023),_=h*Math.pow(2,-y),i(_*4503599627370496>>>0,m,b+a),i((x<<31|y+1023<<20|_*1048576&1048575)>>>0,m,b+p)}}}c.writeDoubleLE=s.bind(null,o,0,4),c.writeDoubleBE=s.bind(null,u,4,0);function r(i,a,p,h,m){var b=i(h,m+a),x=i(h,m+p),_=(x>>31)*2+1,y=x>>>20&2047,S=4294967296*(x&1048575)+b;return y===2047?S?NaN:_*(1/0):y===0?_*5e-324*S:_*Math.pow(2,y-1075)*(S+4503599627370496)}c.readDoubleLE=r.bind(null,l,0,4),c.readDoubleBE=r.bind(null,d,4,0)})(),c}function o(c,s,r){s[r]=c&255,s[r+1]=c>>>8&255,s[r+2]=c>>>16&255,s[r+3]=c>>>24}function u(c,s,r){s[r]=c>>>24,s[r+1]=c>>>16&255,s[r+2]=c>>>8&255,s[r+3]=c&255}function l(c,s){return(c[s]|c[s+1]<<8|c[s+2]<<16|c[s+3]<<24)>>>0}function d(c,s){return(c[s]<<24|c[s+1]<<16|c[s+2]<<8|c[s+3])>>>0}}),k3=ie((e,t)=>{"use strict";t.exports=n;function n(o){try{if(typeof pu!="function")return null;var u=pu(o);return u&&(u.length||Object.keys(u).length)?u:null}catch{return null}}}),C3=ie(e=>{"use strict";var t=e,n="\uFFFD";t.length=function(o){for(var u=0,l=0,d=0;d<o.length;++d)l=o.charCodeAt(d),l<128?u+=1:l<2048?u+=2:(l&64512)===55296&&(o.charCodeAt(d+1)&64512)===56320?(++d,u+=4):u+=3;return u},t.read=function(o,u,l){if(l-u<1)return"";for(var d="",c=u;c<l;){var s=o[c++];if(s<=127)d+=String.fromCharCode(s);else if(s>=192&&s<224){var r=(s&31)<<6|o[c++]&63;d+=r>=128?String.fromCharCode(r):n}else if(s>=224&&s<240){var i=(s&15)<<12|(o[c++]&63)<<6|o[c++]&63;d+=i>=2048?String.fromCharCode(i):n}else if(s>=240){var a=(s&7)<<18|(o[c++]&63)<<12|(o[c++]&63)<<6|o[c++]&63;a<65536||a>1114111?d+=n:(a-=65536,d+=String.fromCharCode(55296+(a>>10)),d+=String.fromCharCode(56320+(a&1023)))}}return d},t.write=function(o,u,l){for(var d=l,c,s,r=0;r<o.length;++r)c=o.charCodeAt(r),c<128?u[l++]=c:c<2048?(u[l++]=c>>6|192,u[l++]=c&63|128):(c&64512)===55296&&((s=o.charCodeAt(r+1))&64512)===56320?(c=65536+((c&1023)<<10)+(s&1023),++r,u[l++]=c>>18|240,u[l++]=c>>12&63|128,u[l++]=c>>6&63|128,u[l++]=c&63|128):(u[l++]=c>>12|224,u[l++]=c>>6&63|128,u[l++]=c&63|128);return l-d}}),D3=ie((e,t)=>{"use strict";t.exports=n;function n(o,u,l){var d=l||8192,c=d>>>1,s=null,r=d;return function(i){if(i<1||i>c)return o(i);r+i>d&&(s=o(d),r=0);var a=u.call(s,r,r+=i);return r&7&&(r=(r|7)+1),a}}}),R3=ie((e,t)=>{"use strict";t.exports=o;var n=ln();function o(c,s){this.lo=c>>>0,this.hi=s>>>0}var u=o.zero=new o(0,0);u.toNumber=function(){return 0},u.zzEncode=u.zzDecode=function(){return this},u.length=function(){return 1};var l=o.zeroHash="\0\0\0\0\0\0\0\0";o.fromNumber=function(c){if(c===0)return u;var s=c<0;s&&(c=-c);var r=c>>>0,i=(c-r)/4294967296>>>0;return s&&(i=~i>>>0,r=~r>>>0,++r>4294967295&&(r=0,++i>4294967295&&(i=0))),new o(r,i)},o.from=function(c){if(typeof c=="number")return o.fromNumber(c);if(n.isString(c))if(n.Long)c=n.Long.fromString(c);else return o.fromNumber(parseInt(c,10));return c.low||c.high?new o(c.low>>>0,c.high>>>0):u},o.prototype.toNumber=function(c){if(!c&&this.hi>>>31){var s=~this.lo+1>>>0,r=~this.hi>>>0;return s||(r=r+1>>>0),-(s+r*4294967296)}return this.lo+this.hi*4294967296},o.prototype.toLong=function(c){return n.Long?new n.Long(this.lo|0,this.hi|0,!!c):{low:this.lo|0,high:this.hi|0,unsigned:!!c}};var d=String.prototype.charCodeAt;o.fromHash=function(c){return c===l?u:new o((d.call(c,0)|d.call(c,1)<<8|d.call(c,2)<<16|d.call(c,3)<<24)>>>0,(d.call(c,4)|d.call(c,5)<<8|d.call(c,6)<<16|d.call(c,7)<<24)>>>0)},o.prototype.toHash=function(){return String.fromCharCode(this.lo&255,this.lo>>>8&255,this.lo>>>16&255,this.lo>>>24,this.hi&255,this.hi>>>8&255,this.hi>>>16&255,this.hi>>>24)},o.prototype.zzEncode=function(){var c=this.hi>>31;return this.hi=((this.hi<<1|this.lo>>>31)^c)>>>0,this.lo=(this.lo<<1^c)>>>0,this},o.prototype.zzDecode=function(){var c=-(this.lo&1);return this.lo=((this.lo>>>1|this.hi<<31)^c)>>>0,this.hi=(this.hi>>>1^c)>>>0,this},o.prototype.length=function(){var c=this.lo,s=(this.lo>>>28|this.hi<<4)>>>0,r=this.hi>>>24;return r===0?s===0?c<16384?c<128?1:2:c<2097152?3:4:s<16384?s<128?5:6:s<2097152?7:8:r<128?9:10}}),N3=ie((e,t)=>{(function(n,o){function u(l){return l.default||l}typeof define=="function"&&define.amd?define([],function(){var l={};return o(l),u(l)}):typeof e=="object"?(o(e),typeof t=="object"&&(t.exports=u(e))):(function(){var l={};o(l),n.Long=u(l)})()})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:e,function(n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.default=void 0;var o=null;try{o=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}function u(w,C,F){this.low=w|0,this.high=C|0,this.unsigned=!!F}u.prototype.__isLong__,Object.defineProperty(u.prototype,"__isLong__",{value:!0});function l(w){return(w&&w.__isLong__)===!0}function d(w){var C=Math.clz32(w&-w);return w?31-C:C}u.isLong=l;var c={},s={};function r(w,C){var F,V,U;return C?(w>>>=0,(U=0<=w&&w<256)&&(V=s[w],V)?V:(F=a(w,0,!0),U&&(s[w]=F),F)):(w|=0,(U=-128<=w&&w<128)&&(V=c[w],V)?V:(F=a(w,w<0?-1:0,!1),U&&(c[w]=F),F))}u.fromInt=r;function i(w,C){if(isNaN(w))return C?A:I;if(C){if(w<0)return A;if(w>=y)return Y}else{if(w<=-S)return W;if(w+1>=S)return G}return w<0?i(-w,C).neg():a(w%_|0,w/_|0,C)}u.fromNumber=i;function a(w,C,F){return new u(w,C,F)}u.fromBits=a;var p=Math.pow;function h(w,C,F){if(w.length===0)throw Error("empty string");if(typeof C=="number"?(F=C,C=!1):C=!!C,w==="NaN"||w==="Infinity"||w==="+Infinity"||w==="-Infinity")return C?A:I;if(F=F||10,F<2||36<F)throw RangeError("radix");var V;if((V=w.indexOf("-"))>0)throw Error("interior hyphen");if(V===0)return h(w.substring(1),C,F).neg();for(var U=i(p(F,8)),q=I,M=0;M<w.length;M+=8){var Z=Math.min(8,w.length-M),X=parseInt(w.substring(M,M+Z),F);if(Z<8){var H=i(p(F,Z));q=q.mul(H).add(i(X))}else q=q.mul(U),q=q.add(i(X))}return q.unsigned=C,q}u.fromString=h;function m(w,C){return typeof w=="number"?i(w,C):typeof w=="string"?h(w,C):a(w.low,w.high,typeof C=="boolean"?C:w.unsigned)}u.fromValue=m;var b=65536,x=1<<24,_=b*b,y=_*_,S=y/2,T=r(x),I=r(0);u.ZERO=I;var A=r(0,!0);u.UZERO=A;var k=r(1);u.ONE=k;var O=r(1,!0);u.UONE=O;var z=r(-1);u.NEG_ONE=z;var G=a(-1,2147483647,!1);u.MAX_VALUE=G;var Y=a(-1,-1,!0);u.MAX_UNSIGNED_VALUE=Y;var W=a(0,-2147483648,!1);u.MIN_VALUE=W;var D=u.prototype;D.toInt=function(){return this.unsigned?this.low>>>0:this.low},D.toNumber=function(){return this.unsigned?(this.high>>>0)*_+(this.low>>>0):this.high*_+(this.low>>>0)},D.toString=function(w){if(w=w||10,w<2||36<w)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(W)){var C=i(w),F=this.div(C),V=F.mul(C).sub(this);return F.toString(w)+V.toInt().toString(w)}else return"-"+this.neg().toString(w);for(var U=i(p(w,6),this.unsigned),q=this,M="";;){var Z=q.div(U),X=q.sub(Z.mul(U)).toInt()>>>0,H=X.toString(w);if(q=Z,q.isZero())return H+M;for(;H.length<6;)H="0"+H;M=""+H+M}},D.getHighBits=function(){return this.high},D.getHighBitsUnsigned=function(){return this.high>>>0},D.getLowBits=function(){return this.low},D.getLowBitsUnsigned=function(){return this.low>>>0},D.getNumBitsAbs=function(){if(this.isNegative())return this.eq(W)?64:this.neg().getNumBitsAbs();for(var w=this.high!=0?this.high:this.low,C=31;C>0&&(w&1<<C)==0;C--);return this.high!=0?C+33:C+1},D.isSafeInteger=function(){var w=this.high>>21;return w?this.unsigned?!1:w===-1&&!(this.low===0&&this.high===-2097152):!0},D.isZero=function(){return this.high===0&&this.low===0},D.eqz=D.isZero,D.isNegative=function(){return!this.unsigned&&this.high<0},D.isPositive=function(){return this.unsigned||this.high>=0},D.isOdd=function(){return(this.low&1)===1},D.isEven=function(){return(this.low&1)===0},D.equals=function(w){return l(w)||(w=m(w)),this.unsigned!==w.unsigned&&this.high>>>31===1&&w.high>>>31===1?!1:this.high===w.high&&this.low===w.low},D.eq=D.equals,D.notEquals=function(w){return!this.eq(w)},D.neq=D.notEquals,D.ne=D.notEquals,D.lessThan=function(w){return this.comp(w)<0},D.lt=D.lessThan,D.lessThanOrEqual=function(w){return this.comp(w)<=0},D.lte=D.lessThanOrEqual,D.le=D.lessThanOrEqual,D.greaterThan=function(w){return this.comp(w)>0},D.gt=D.greaterThan,D.greaterThanOrEqual=function(w){return this.comp(w)>=0},D.gte=D.greaterThanOrEqual,D.ge=D.greaterThanOrEqual,D.compare=function(w){if(l(w)||(w=m(w)),this.eq(w))return 0;var C=this.isNegative(),F=w.isNegative();return C&&!F?-1:!C&&F?1:this.unsigned?w.high>>>0>this.high>>>0||w.high===this.high&&w.low>>>0>this.low>>>0?-1:1:this.sub(w).isNegative()?-1:1},D.comp=D.compare,D.negate=function(){return!this.unsigned&&this.eq(W)?W:this.not().add(k)},D.neg=D.negate,D.add=function(w){l(w)||(w=m(w));var C=this.high>>>16,F=this.high&65535,V=this.low>>>16,U=this.low&65535,q=w.high>>>16,M=w.high&65535,Z=w.low>>>16,X=w.low&65535,H=0,pe=0,fe=0,ye=0;return ye+=U+X,fe+=ye>>>16,ye&=65535,fe+=V+Z,pe+=fe>>>16,fe&=65535,pe+=F+M,H+=pe>>>16,pe&=65535,H+=C+q,H&=65535,a(fe<<16|ye,H<<16|pe,this.unsigned)},D.subtract=function(w){return l(w)||(w=m(w)),this.add(w.neg())},D.sub=D.subtract,D.multiply=function(w){if(this.isZero())return this;if(l(w)||(w=m(w)),o){var C=o.mul(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}if(w.isZero())return this.unsigned?A:I;if(this.eq(W))return w.isOdd()?W:I;if(w.eq(W))return this.isOdd()?W:I;if(this.isNegative())return w.isNegative()?this.neg().mul(w.neg()):this.neg().mul(w).neg();if(w.isNegative())return this.mul(w.neg()).neg();if(this.lt(T)&&w.lt(T))return i(this.toNumber()*w.toNumber(),this.unsigned);var F=this.high>>>16,V=this.high&65535,U=this.low>>>16,q=this.low&65535,M=w.high>>>16,Z=w.high&65535,X=w.low>>>16,H=w.low&65535,pe=0,fe=0,ye=0,Me=0;return Me+=q*H,ye+=Me>>>16,Me&=65535,ye+=U*H,fe+=ye>>>16,ye&=65535,ye+=q*X,fe+=ye>>>16,ye&=65535,fe+=V*H,pe+=fe>>>16,fe&=65535,fe+=U*X,pe+=fe>>>16,fe&=65535,fe+=q*Z,pe+=fe>>>16,fe&=65535,pe+=F*H+V*X+U*Z+q*M,pe&=65535,a(ye<<16|Me,pe<<16|fe,this.unsigned)},D.mul=D.multiply,D.divide=function(w){if(l(w)||(w=m(w)),w.isZero())throw Error("division by zero");if(o){if(!this.unsigned&&this.high===-2147483648&&w.low===-1&&w.high===-1)return this;var C=(this.unsigned?o.div_u:o.div_s)(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?A:I;var F,V,U;if(this.unsigned){if(w.unsigned||(w=w.toUnsigned()),w.gt(this))return A;if(w.gt(this.shru(1)))return O;U=A}else{if(this.eq(W)){if(w.eq(k)||w.eq(z))return W;if(w.eq(W))return k;var q=this.shr(1);return F=q.div(w).shl(1),F.eq(I)?w.isNegative()?k:z:(V=this.sub(w.mul(F)),U=F.add(V.div(w)),U)}else if(w.eq(W))return this.unsigned?A:I;if(this.isNegative())return w.isNegative()?this.neg().div(w.neg()):this.neg().div(w).neg();if(w.isNegative())return this.div(w.neg()).neg();U=I}for(V=this;V.gte(w);){F=Math.max(1,Math.floor(V.toNumber()/w.toNumber()));for(var M=Math.ceil(Math.log(F)/Math.LN2),Z=M<=48?1:p(2,M-48),X=i(F),H=X.mul(w);H.isNegative()||H.gt(V);)F-=Z,X=i(F,this.unsigned),H=X.mul(w);X.isZero()&&(X=k),U=U.add(X),V=V.sub(H)}return U},D.div=D.divide,D.modulo=function(w){if(l(w)||(w=m(w)),o){var C=(this.unsigned?o.rem_u:o.rem_s)(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}return this.sub(this.div(w).mul(w))},D.mod=D.modulo,D.rem=D.modulo,D.not=function(){return a(~this.low,~this.high,this.unsigned)},D.countLeadingZeros=function(){return this.high?Math.clz32(this.high):Math.clz32(this.low)+32},D.clz=D.countLeadingZeros,D.countTrailingZeros=function(){return this.low?d(this.low):d(this.high)+32},D.ctz=D.countTrailingZeros,D.and=function(w){return l(w)||(w=m(w)),a(this.low&w.low,this.high&w.high,this.unsigned)},D.or=function(w){return l(w)||(w=m(w)),a(this.low|w.low,this.high|w.high,this.unsigned)},D.xor=function(w){return l(w)||(w=m(w)),a(this.low^w.low,this.high^w.high,this.unsigned)},D.shiftLeft=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low<<w,this.high<<w|this.low>>>32-w,this.unsigned):a(0,this.low<<w-32,this.unsigned)},D.shl=D.shiftLeft,D.shiftRight=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low>>>w|this.high<<32-w,this.high>>w,this.unsigned):a(this.high>>w-32,this.high>=0?0:-1,this.unsigned)},D.shr=D.shiftRight,D.shiftRightUnsigned=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low>>>w|this.high<<32-w,this.high>>>w,this.unsigned):w===32?a(this.high,0,this.unsigned):a(this.high>>>w-32,0,this.unsigned)},D.shru=D.shiftRightUnsigned,D.shr_u=D.shiftRightUnsigned,D.rotateLeft=function(w){var C;return l(w)&&(w=w.toInt()),(w&=63)===0?this:w===32?a(this.high,this.low,this.unsigned):w<32?(C=32-w,a(this.low<<w|this.high>>>C,this.high<<w|this.low>>>C,this.unsigned)):(w-=32,C=32-w,a(this.high<<w|this.low>>>C,this.low<<w|this.high>>>C,this.unsigned))},D.rotl=D.rotateLeft,D.rotateRight=function(w){var C;return l(w)&&(w=w.toInt()),(w&=63)===0?this:w===32?a(this.high,this.low,this.unsigned):w<32?(C=32-w,a(this.high<<C|this.low>>>w,this.low<<C|this.high>>>w,this.unsigned)):(w-=32,C=32-w,a(this.low<<C|this.high>>>w,this.high<<C|this.low>>>w,this.unsigned))},D.rotr=D.rotateRight,D.toSigned=function(){return this.unsigned?a(this.low,this.high,!1):this},D.toUnsigned=function(){return this.unsigned?this:a(this.low,this.high,!0)},D.toBytes=function(w){return w?this.toBytesLE():this.toBytesBE()},D.toBytesLE=function(){var w=this.high,C=this.low;return[C&255,C>>>8&255,C>>>16&255,C>>>24,w&255,w>>>8&255,w>>>16&255,w>>>24]},D.toBytesBE=function(){var w=this.high,C=this.low;return[w>>>24,w>>>16&255,w>>>8&255,w&255,C>>>24,C>>>16&255,C>>>8&255,C&255]},u.fromBytes=function(w,C,F){return F?u.fromBytesLE(w,C):u.fromBytesBE(w,C)},u.fromBytesLE=function(w,C){return new u(w[0]|w[1]<<8|w[2]<<16|w[3]<<24,w[4]|w[5]<<8|w[6]<<16|w[7]<<24,C)},u.fromBytesBE=function(w,C){return new u(w[4]<<24|w[5]<<16|w[6]<<8|w[7],w[0]<<24|w[1]<<16|w[2]<<8|w[3],C)},typeof BigInt=="function"&&(u.fromBigInt=function(w,C){var F=Number(BigInt.asIntN(32,w)),V=Number(BigInt.asIntN(32,w>>BigInt(32)));return a(F,V,C)},u.fromValue=function(w,C){return typeof w=="bigint"?u.fromBigInt(w,C):m(w,C)},D.toBigInt=function(){var w=BigInt(this.low>>>0),C=BigInt(this.unsigned?this.high>>>0:this.high);return C<<BigInt(32)|w});var Q=n.default=u})}),ln=ie(e=>{"use strict";var t=e;t.asPromise=O3(),t.base64=E3(),t.EventEmitter=A3(),t.float=P3(),t.inquire=k3(),t.utf8=C3(),t.pool=D3(),t.LongBits=R3();function n(l){return l==="__proto__"||l==="prototype"||l==="constructor"}t.isUnsafeProperty=n,t.isNode=!!(typeof global<"u"&&global&&global.process&&global.process.versions&&global.process.versions.node),t.global=t.isNode&&global||typeof window<"u"&&window||typeof self<"u"&&self||e,t.emptyArray=Object.freeze?Object.freeze([]):[],t.emptyObject=Object.freeze?Object.freeze({}):{},t.isInteger=Number.isInteger||function(l){return typeof l=="number"&&isFinite(l)&&Math.floor(l)===l},t.isString=function(l){return typeof l=="string"||l instanceof String},t.isObject=function(l){return l&&typeof l=="object"},t.isset=t.isSet=function(l,d){var c=l[d];return c!=null&&Object.hasOwnProperty.call(l,d)?typeof c!="object"||(Array.isArray(c)?c.length:Object.keys(c).length)>0:!1},t.Buffer=(function(){try{var l=t.global.Buffer;return l.prototype.utf8Write?l:null}catch{return null}})(),t._Buffer_from=null,t._Buffer_allocUnsafe=null,t.newBuffer=function(l){return typeof l=="number"?t.Buffer?t._Buffer_allocUnsafe(l):new t.Array(l):t.Buffer?t._Buffer_from(l):typeof Uint8Array>"u"?l:new Uint8Array(l)},t.Array=typeof Uint8Array<"u"?Uint8Array:Array,t.Long=t.global.dcodeIO&&t.global.dcodeIO.Long||t.global.Long||(function(){try{var l=N3();return l&&l.isLong?l:null}catch{return null}})(),t.key2Re=/^true|false|0|1$/,t.key32Re=/^-?(?:0|[1-9][0-9]*)$/,t.key64Re=/^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/,t.longToHash=function(l){return l?t.LongBits.from(l).toHash():t.LongBits.zeroHash},t.longFromHash=function(l,d){var c=t.LongBits.fromHash(l);return t.Long?t.Long.fromBits(c.lo,c.hi,d):c.toNumber(!!d)};function o(l){var d=typeof arguments[arguments.length-1]=="boolean",c=d?arguments.length-1:arguments.length;d=d&&arguments[arguments.length-1];for(var s=1;s<c;++s){var r=arguments[s];if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)!n(i[a])&&(l[i[a]]===void 0||!d)&&(l[i[a]]=r[i[a]])}return l}t.merge=o,t.nestingLimit=32,t.recursionLimit=100,t.makeProp=function(l,d){Object.defineProperty(l,d,{enumerable:!0,configurable:!0,writable:!0})},t.lcFirst=function(l){return l.charAt(0).toLowerCase()+l.substring(1)};function u(l){function d(c,s){if(!(this instanceof d))return new d(c,s);Object.defineProperty(this,"message",{get:function(){return c}}),Error.captureStackTrace?Error.captureStackTrace(this,d):Object.defineProperty(this,"stack",{value:new Error().stack||""}),s&&o(this,s)}return d.prototype=Object.create(Error.prototype,{constructor:{value:d,writable:!0,enumerable:!1,configurable:!0},name:{get:function(){return l},set:void 0,enumerable:!1,configurable:!0},toString:{value:function(){return this.name+": "+this.message},writable:!0,enumerable:!1,configurable:!0}}),d}t.newError=u,t.ProtocolError=u("ProtocolError"),t.oneOfGetter=function(l){for(var d={},c=0;c<l.length;++c)d[l[c]]=1;return function(){for(var s=Object.keys(this),r=s.length-1;r>-1;--r)if(d[s[r]]===1&&this[s[r]]!==void 0&&this[s[r]]!==null)return s[r]}},t.oneOfSetter=function(l){return function(d){for(var c=0;c<l.length;++c)l[c]!==d&&delete this[l[c]]}},t.toJSONOptions={longs:String,enums:String,bytes:String,json:!0},t._configure=function(){var l=t.Buffer;if(!l){t._Buffer_from=t._Buffer_allocUnsafe=null;return}t._Buffer_from=l.from!==Uint8Array.from&&l.from||function(d,c){return new l(d,c)},t._Buffer_allocUnsafe=l.allocUnsafe||function(d){return new l(d)}}}),A0=ie((e,t)=>{"use strict";t.exports=i;var n=ln(),o,u=n.LongBits,l=n.base64,d=n.utf8;function c(y,S,T){this.fn=y,this.len=S,this.next=void 0,this.val=T}function s(){}function r(y){this.head=y.head,this.tail=y.tail,this.len=y.len,this.next=y.states}function i(){this.len=0,this.head=new c(s,0,0),this.tail=this.head,this.states=null}var a=function(){return n.Buffer?function(){return(i.create=function(){return new o})()}:function(){return new i}};i.create=a(),i.alloc=function(y){return new n.Array(y)},n.Array!==Array&&(i.alloc=n.pool(i.alloc,n.Array.prototype.subarray)),i.prototype._push=function(y,S,T){return this.tail=this.tail.next=new c(y,S,T),this.len+=S,this};function p(y,S,T){S[T]=y&255}function h(y,S,T){for(;y>127;)S[T++]=y&127|128,y>>>=7;S[T]=y}function m(y,S){this.len=y,this.next=void 0,this.val=S}m.prototype=Object.create(c.prototype),m.prototype.fn=h,i.prototype.uint32=function(y){return this.len+=(this.tail=this.tail.next=new m((y=y>>>0)<128?1:y<16384?2:y<2097152?3:y<268435456?4:5,y)).len,this},i.prototype.int32=function(y){return(y|=0)<0?this._push(b,10,u.fromNumber(y)):this.uint32(y)},i.prototype.sint32=function(y){return this.uint32((y<<1^y>>31)>>>0)};function b(y,S,T){for(var I=y.lo,A=y.hi;A;)S[T++]=I&127|128,I=(I>>>7|A<<25)>>>0,A>>>=7;for(;I>127;)S[T++]=I&127|128,I=I>>>7;S[T++]=I}i.prototype.uint64=function(y){var S=u.from(y);return this._push(b,S.length(),S)},i.prototype.int64=i.prototype.uint64,i.prototype.sint64=function(y){var S=u.from(y).zzEncode();return this._push(b,S.length(),S)},i.prototype.bool=function(y){return this._push(p,1,y?1:0)};function x(y,S,T){S[T]=y&255,S[T+1]=y>>>8&255,S[T+2]=y>>>16&255,S[T+3]=y>>>24}i.prototype.fixed32=function(y){return this._push(x,4,y>>>0)},i.prototype.sfixed32=i.prototype.fixed32,i.prototype.fixed64=function(y){var S=u.from(y);return this._push(x,4,S.lo)._push(x,4,S.hi)},i.prototype.sfixed64=i.prototype.fixed64,i.prototype.float=function(y){return this._push(n.float.writeFloatLE,4,y)},i.prototype.double=function(y){return this._push(n.float.writeDoubleLE,8,y)};var _=n.Array.prototype.set?function(y,S,T){S.set(y,T)}:function(y,S,T){for(var I=0;I<y.length;++I)S[T+I]=y[I]};i.prototype.bytes=function(y){var S=y.length>>>0;if(!S)return this._push(p,1,0);if(n.isString(y)){var T=i.alloc(S=l.length(y));l.decode(y,T,0),y=T}return this.uint32(S)._push(_,S,y)},i.prototype.string=function(y){var S=d.length(y);return S?this.uint32(S)._push(d.write,S,y):this._push(p,1,0)},i.prototype.fork=function(){return this.states=new r(this),this.head=this.tail=new c(s,0,0),this.len=0,this},i.prototype.reset=function(){return this.states?(this.head=this.states.head,this.tail=this.states.tail,this.len=this.states.len,this.states=this.states.next):(this.head=this.tail=new c(s,0,0),this.len=0),this},i.prototype.ldelim=function(){var y=this.head,S=this.tail,T=this.len;return this.reset().uint32(T),T&&(this.tail.next=y.next,this.tail=S,this.len+=T),this},i.prototype.finish=function(){for(var y=this.head.next,S=this.constructor.alloc(this.len),T=0;y;)y.fn(y.val,S,T),T+=y.len,y=y.next;return S},i._configure=function(y){o=y,i.create=a(),o._configure()}}),z3=ie((e,t)=>{"use strict";t.exports=u;var n=A0();(u.prototype=Object.create(n.prototype)).constructor=u;var o=ln();function u(){n.call(this)}u._configure=function(){u.alloc=o._Buffer_allocUnsafe,u.writeBytesBuffer=o.Buffer&&o.Buffer.prototype instanceof Uint8Array&&o.Buffer.prototype.set.name==="set"?function(d,c,s){c.set(d,s)}:function(d,c,s){if(d.copy)d.copy(c,s,0,d.length);else for(var r=0;r<d.length;)c[s++]=d[r++]}},u.prototype.bytes=function(d){o.isString(d)&&(d=o._Buffer_from(d,"base64"));var c=d.length>>>0;return this.uint32(c),c&&this._push(u.writeBytesBuffer,c,d),this};function l(d,c,s){d.length<40?o.utf8.write(d,c,s):c.utf8Write?c.utf8Write(d,s):c.write(d,s)}u.prototype.string=function(d){var c=o.Buffer.byteLength(d);return this.uint32(c),c&&this._push(l,c,d),this},u._configure()}),P0=ie((e,t)=>{"use strict";t.exports=c;var n=ln(),o,u=n.LongBits,l=n.utf8;function d(h,m){return RangeError("index out of range: "+h.pos+" + "+(m||1)+" > "+h.len)}function c(h){this.buf=h,this.pos=0,this.len=h.length}var s=typeof Uint8Array<"u"?function(h){if(h instanceof Uint8Array||Array.isArray(h))return new c(h);throw Error("illegal buffer")}:function(h){if(Array.isArray(h))return new c(h);throw Error("illegal buffer")},r=function(){return n.Buffer?function(h){return(c.create=function(m){return n.Buffer.isBuffer(m)?new o(m):s(m)})(h)}:s};c.create=r(),c.prototype._slice=n.Array.prototype.subarray||n.Array.prototype.slice,c.prototype.uint32=(function(){var h=4294967295;return function(){if(h=(this.buf[this.pos]&127)>>>0,this.buf[this.pos++]<128||(h=(h|(this.buf[this.pos]&127)<<7)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&127)<<14)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&127)<<21)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&15)<<28)>>>0,this.buf[this.pos++]<128))return h;if((this.pos+=5)>this.len)throw this.pos=this.len,d(this,10);return h}})(),c.prototype.int32=function(){return this.uint32()|0},c.prototype.sint32=function(){var h=this.uint32();return h>>>1^-(h&1)|0};function i(){var h=new u(0,0),m=0;if(this.len-this.pos>4){for(;m<4;++m)if(h.lo=(h.lo|(this.buf[this.pos]&127)<<m*7)>>>0,this.buf[this.pos++]<128)return h;if(h.lo=(h.lo|(this.buf[this.pos]&127)<<28)>>>0,h.hi=(h.hi|(this.buf[this.pos]&127)>>4)>>>0,this.buf[this.pos++]<128)return h;m=0}else{for(;m<3;++m){if(this.pos>=this.len)throw d(this);if(h.lo=(h.lo|(this.buf[this.pos]&127)<<m*7)>>>0,this.buf[this.pos++]<128)return h}return h.lo=(h.lo|(this.buf[this.pos++]&127)<<m*7)>>>0,h}if(this.len-this.pos>4){for(;m<5;++m)if(h.hi=(h.hi|(this.buf[this.pos]&127)<<m*7+3)>>>0,this.buf[this.pos++]<128)return h}else for(;m<5;++m){if(this.pos>=this.len)throw d(this);if(h.hi=(h.hi|(this.buf[this.pos]&127)<<m*7+3)>>>0,this.buf[this.pos++]<128)return h}throw Error("invalid varint encoding")}c.prototype.bool=function(){return this.uint32()!==0};function a(h,m){return(h[m-4]|h[m-3]<<8|h[m-2]<<16|h[m-1]<<24)>>>0}c.prototype.fixed32=function(){if(this.pos+4>this.len)throw d(this,4);return a(this.buf,this.pos+=4)},c.prototype.sfixed32=function(){if(this.pos+4>this.len)throw d(this,4);return a(this.buf,this.pos+=4)|0};function p(){if(this.pos+8>this.len)throw d(this,8);return new u(a(this.buf,this.pos+=4),a(this.buf,this.pos+=4))}c.prototype.float=function(){if(this.pos+4>this.len)throw d(this,4);var h=n.float.readFloatLE(this.buf,this.pos);return this.pos+=4,h},c.prototype.double=function(){if(this.pos+8>this.len)throw d(this,4);var h=n.float.readDoubleLE(this.buf,this.pos);return this.pos+=8,h},c.prototype.bytes=function(){var h=this.uint32(),m=this.pos,b=this.pos+h;if(b>this.len)throw d(this,h);if(this.pos+=h,Array.isArray(this.buf))return this.buf.slice(m,b);if(m===b){var x=n.Buffer;return x?x.alloc(0):new this.buf.constructor(0)}return this._slice.call(this.buf,m,b)},c.prototype.string=function(){var h=this.bytes();return l.read(h,0,h.length)},c.prototype.skip=function(h){if(typeof h=="number"){if(this.pos+h>this.len)throw d(this,h);this.pos+=h}else do if(this.pos>=this.len)throw d(this);while(this.buf[this.pos++]&128);return this},c.recursionLimit=n.recursionLimit,c.prototype.skipType=function(h,m){if(m===void 0&&(m=0),m>c.recursionLimit)throw Error("maximum nesting depth exceeded");switch(h){case 0:this.skip();break;case 1:this.skip(8);break;case 2:this.skip(this.uint32());break;case 3:for(;(h=this.uint32()&7)!==4;)this.skipType(h,m+1);break;case 5:this.skip(4);break;default:throw Error("invalid wire type "+h+" at offset "+this.pos)}return this},c._configure=function(h){o=h,c.create=r(),o._configure();var m=n.Long?"toLong":"toNumber";n.merge(c.prototype,{int64:function(){return i.call(this)[m](!1)},uint64:function(){return i.call(this)[m](!0)},sint64:function(){return i.call(this).zzDecode()[m](!1)},fixed64:function(){return p.call(this)[m](!0)},sfixed64:function(){return p.call(this)[m](!1)}})}}),B3=ie((e,t)=>{"use strict";t.exports=u;var n=P0();(u.prototype=Object.create(n.prototype)).constructor=u;var o=ln();function u(l){n.call(this,l)}u._configure=function(){o.Buffer&&(u.prototype._slice=o.Buffer.prototype.slice)},u.prototype.string=function(){var l=this.uint32();return this.buf.utf8Slice?this.buf.utf8Slice(this.pos,this.pos=Math.min(this.pos+l,this.len)):this.buf.toString("utf-8",this.pos,this.pos=Math.min(this.pos+l,this.len))},u._configure()}),M3=ie((e,t)=>{"use strict";t.exports=o;var n=ln();(o.prototype=Object.create(n.EventEmitter.prototype)).constructor=o;function o(u,l,d){if(typeof u!="function")throw TypeError("rpcImpl must be a function");n.EventEmitter.call(this),this.rpcImpl=u,this.requestDelimited=!!l,this.responseDelimited=!!d}o.prototype.rpcCall=function u(l,d,c,s,r){if(!s)throw TypeError("request must be specified");var i=this;if(!r)return n.asPromise(u,i,l,d,c,s);if(!i.rpcImpl){setTimeout(function(){r(Error("already ended"))},0);return}try{return i.rpcImpl(l,d[i.requestDelimited?"encodeDelimited":"encode"](s).finish(),function(a,p){if(a)return i.emit("error",a,l),r(a);if(p===null){i.end(!0);return}if(!(p instanceof c))try{p=c[i.responseDelimited?"decodeDelimited":"decode"](p)}catch(h){return i.emit("error",h,l),r(h)}return i.emit("data",p,l),r(null,p)})}catch(a){i.emit("error",a,l),setTimeout(function(){r(a)},0);return}},o.prototype.end=function(u){return this.rpcImpl&&(u||this.rpcImpl(null,null,null),this.rpcImpl=null,this.emit("end").off()),this}}),F3=ie(e=>{"use strict";var t=e;t.Service=M3()}),j3=ie((e,t)=>{"use strict";t.exports=Object.create(null)}),L3=ie(e=>{"use strict";var t=e;t.build="minimal",t.Writer=A0(),t.BufferWriter=z3(),t.Reader=P0(),t.BufferReader=B3(),t.util=ln(),t.rpc=F3(),t.roots=j3(),t.configure=n;function n(){t.util._configure(),t.Writer._configure(t.BufferWriter),t.Reader._configure(t.BufferReader)}n()}),V3=ie((e,t)=>{"use strict";t.exports=L3()}),Ii=ie((e,t)=>{"use strict";var n=V3(),o=n.Reader,u=n.Writer,l=n.util,d=n.roots.default||(n.roots.default={});d.onnx=(function(){var c={};return c.Version=(function(){var s={},r=Object.create(s);return r[s[0]="_START_VERSION"]=0,r[s[1]="IR_VERSION_2017_10_10"]=1,r[s[2]="IR_VERSION_2017_10_30"]=2,r[s[3]="IR_VERSION_2017_11_3"]=3,r[s[4]="IR_VERSION_2019_1_22"]=4,r[s[5]="IR_VERSION_2019_3_18"]=5,r[s[6]="IR_VERSION_2019_9_19"]=6,r[s[7]="IR_VERSION_2020_5_8"]=7,r[s[8]="IR_VERSION_2021_7_30"]=8,r[s[9]="IR_VERSION"]=9,r})(),c.AttributeProto=(function(){function s(r){if(this.floats=[],this.ints=[],this.strings=[],this.tensors=[],this.graphs=[],this.sparseTensors=[],this.typeProtos=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.refAttrName="",s.prototype.docString="",s.prototype.type=0,s.prototype.f=0,s.prototype.i=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.s=l.newBuffer([]),s.prototype.t=null,s.prototype.g=null,s.prototype.sparseTensor=null,s.prototype.tp=null,s.prototype.floats=l.emptyArray,s.prototype.ints=l.emptyArray,s.prototype.strings=l.emptyArray,s.prototype.tensors=l.emptyArray,s.prototype.graphs=l.emptyArray,s.prototype.sparseTensors=l.emptyArray,s.prototype.typeProtos=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.f!=null&&Object.hasOwnProperty.call(r,"f")&&i.uint32(21).float(r.f),r.i!=null&&Object.hasOwnProperty.call(r,"i")&&i.uint32(24).int64(r.i),r.s!=null&&Object.hasOwnProperty.call(r,"s")&&i.uint32(34).bytes(r.s),r.t!=null&&Object.hasOwnProperty.call(r,"t")&&d.onnx.TensorProto.encode(r.t,i.uint32(42).fork()).ldelim(),r.g!=null&&Object.hasOwnProperty.call(r,"g")&&d.onnx.GraphProto.encode(r.g,i.uint32(50).fork()).ldelim(),r.floats!=null&&r.floats.length){i.uint32(58).fork();for(var a=0;a<r.floats.length;++a)i.float(r.floats[a]);i.ldelim()}if(r.ints!=null&&r.ints.length){i.uint32(66).fork();for(var a=0;a<r.ints.length;++a)i.int64(r.ints[a]);i.ldelim()}if(r.strings!=null&&r.strings.length)for(var a=0;a<r.strings.length;++a)i.uint32(74).bytes(r.strings[a]);if(r.tensors!=null&&r.tensors.length)for(var a=0;a<r.tensors.length;++a)d.onnx.TensorProto.encode(r.tensors[a],i.uint32(82).fork()).ldelim();if(r.graphs!=null&&r.graphs.length)for(var a=0;a<r.graphs.length;++a)d.onnx.GraphProto.encode(r.graphs[a],i.uint32(90).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(106).string(r.docString),r.tp!=null&&Object.hasOwnProperty.call(r,"tp")&&d.onnx.TypeProto.encode(r.tp,i.uint32(114).fork()).ldelim(),r.typeProtos!=null&&r.typeProtos.length)for(var a=0;a<r.typeProtos.length;++a)d.onnx.TypeProto.encode(r.typeProtos[a],i.uint32(122).fork()).ldelim();if(r.type!=null&&Object.hasOwnProperty.call(r,"type")&&i.uint32(160).int32(r.type),r.refAttrName!=null&&Object.hasOwnProperty.call(r,"refAttrName")&&i.uint32(170).string(r.refAttrName),r.sparseTensor!=null&&Object.hasOwnProperty.call(r,"sparseTensor")&&d.onnx.SparseTensorProto.encode(r.sparseTensor,i.uint32(178).fork()).ldelim(),r.sparseTensors!=null&&r.sparseTensors.length)for(var a=0;a<r.sparseTensors.length;++a)d.onnx.SparseTensorProto.encode(r.sparseTensors[a],i.uint32(186).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.AttributeProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 21:{p.refAttrName=r.string();break}case 13:{p.docString=r.string();break}case 20:{p.type=r.int32();break}case 2:{p.f=r.float();break}case 3:{p.i=r.int64();break}case 4:{p.s=r.bytes();break}case 5:{p.t=d.onnx.TensorProto.decode(r,r.uint32());break}case 6:{p.g=d.onnx.GraphProto.decode(r,r.uint32());break}case 22:{p.sparseTensor=d.onnx.SparseTensorProto.decode(r,r.uint32());break}case 14:{p.tp=d.onnx.TypeProto.decode(r,r.uint32());break}case 7:{if(p.floats&&p.floats.length||(p.floats=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.floats.push(r.float());else p.floats.push(r.float());break}case 8:{if(p.ints&&p.ints.length||(p.ints=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.ints.push(r.int64());else p.ints.push(r.int64());break}case 9:{p.strings&&p.strings.length||(p.strings=[]),p.strings.push(r.bytes());break}case 10:{p.tensors&&p.tensors.length||(p.tensors=[]),p.tensors.push(d.onnx.TensorProto.decode(r,r.uint32()));break}case 11:{p.graphs&&p.graphs.length||(p.graphs=[]),p.graphs.push(d.onnx.GraphProto.decode(r,r.uint32()));break}case 23:{p.sparseTensors&&p.sparseTensors.length||(p.sparseTensors=[]),p.sparseTensors.push(d.onnx.SparseTensorProto.decode(r,r.uint32()));break}case 15:{p.typeProtos&&p.typeProtos.length||(p.typeProtos=[]),p.typeProtos.push(d.onnx.TypeProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.refAttrName!=null&&r.hasOwnProperty("refAttrName")&&!l.isString(r.refAttrName))return"refAttrName: string expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.type!=null&&r.hasOwnProperty("type"))switch(r.type){default:return"type: enum value expected";case 0:case 1:case 2:case 3:case 4:case 5:case 11:case 13:case 6:case 7:case 8:case 9:case 10:case 12:case 14:break}if(r.f!=null&&r.hasOwnProperty("f")&&typeof r.f!="number")return"f: number expected";if(r.i!=null&&r.hasOwnProperty("i")&&!l.isInteger(r.i)&&!(r.i&&l.isInteger(r.i.low)&&l.isInteger(r.i.high)))return"i: integer|Long expected";if(r.s!=null&&r.hasOwnProperty("s")&&!(r.s&&typeof r.s.length=="number"||l.isString(r.s)))return"s: buffer expected";if(r.t!=null&&r.hasOwnProperty("t")){var i=d.onnx.TensorProto.verify(r.t);if(i)return"t."+i}if(r.g!=null&&r.hasOwnProperty("g")){var i=d.onnx.GraphProto.verify(r.g);if(i)return"g."+i}if(r.sparseTensor!=null&&r.hasOwnProperty("sparseTensor")){var i=d.onnx.SparseTensorProto.verify(r.sparseTensor);if(i)return"sparseTensor."+i}if(r.tp!=null&&r.hasOwnProperty("tp")){var i=d.onnx.TypeProto.verify(r.tp);if(i)return"tp."+i}if(r.floats!=null&&r.hasOwnProperty("floats")){if(!Array.isArray(r.floats))return"floats: array expected";for(var a=0;a<r.floats.length;++a)if(typeof r.floats[a]!="number")return"floats: number[] expected"}if(r.ints!=null&&r.hasOwnProperty("ints")){if(!Array.isArray(r.ints))return"ints: array expected";for(var a=0;a<r.ints.length;++a)if(!l.isInteger(r.ints[a])&&!(r.ints[a]&&l.isInteger(r.ints[a].low)&&l.isInteger(r.ints[a].high)))return"ints: integer|Long[] expected"}if(r.strings!=null&&r.hasOwnProperty("strings")){if(!Array.isArray(r.strings))return"strings: array expected";for(var a=0;a<r.strings.length;++a)if(!(r.strings[a]&&typeof r.strings[a].length=="number"||l.isString(r.strings[a])))return"strings: buffer[] expected"}if(r.tensors!=null&&r.hasOwnProperty("tensors")){if(!Array.isArray(r.tensors))return"tensors: array expected";for(var a=0;a<r.tensors.length;++a){var i=d.onnx.TensorProto.verify(r.tensors[a]);if(i)return"tensors."+i}}if(r.graphs!=null&&r.hasOwnProperty("graphs")){if(!Array.isArray(r.graphs))return"graphs: array expected";for(var a=0;a<r.graphs.length;++a){var i=d.onnx.GraphProto.verify(r.graphs[a]);if(i)return"graphs."+i}}if(r.sparseTensors!=null&&r.hasOwnProperty("sparseTensors")){if(!Array.isArray(r.sparseTensors))return"sparseTensors: array expected";for(var a=0;a<r.sparseTensors.length;++a){var i=d.onnx.SparseTensorProto.verify(r.sparseTensors[a]);if(i)return"sparseTensors."+i}}if(r.typeProtos!=null&&r.hasOwnProperty("typeProtos")){if(!Array.isArray(r.typeProtos))return"typeProtos: array expected";for(var a=0;a<r.typeProtos.length;++a){var i=d.onnx.TypeProto.verify(r.typeProtos[a]);if(i)return"typeProtos."+i}}return null},s.fromObject=function(r){if(r instanceof d.onnx.AttributeProto)return r;var i=new d.onnx.AttributeProto;switch(r.name!=null&&(i.name=String(r.name)),r.refAttrName!=null&&(i.refAttrName=String(r.refAttrName)),r.docString!=null&&(i.docString=String(r.docString)),r.type){default:if(typeof r.type=="number"){i.type=r.type;break}break;case"UNDEFINED":case 0:i.type=0;break;case"FLOAT":case 1:i.type=1;break;case"INT":case 2:i.type=2;break;case"STRING":case 3:i.type=3;break;case"TENSOR":case 4:i.type=4;break;case"GRAPH":case 5:i.type=5;break;case"SPARSE_TENSOR":case 11:i.type=11;break;case"TYPE_PROTO":case 13:i.type=13;break;case"FLOATS":case 6:i.type=6;break;case"INTS":case 7:i.type=7;break;case"STRINGS":case 8:i.type=8;break;case"TENSORS":case 9:i.type=9;break;case"GRAPHS":case 10:i.type=10;break;case"SPARSE_TENSORS":case 12:i.type=12;break;case"TYPE_PROTOS":case 14:i.type=14;break}if(r.f!=null&&(i.f=Number(r.f)),r.i!=null&&(l.Long?(i.i=l.Long.fromValue(r.i)).unsigned=!1:typeof r.i=="string"?i.i=parseInt(r.i,10):typeof r.i=="number"?i.i=r.i:typeof r.i=="object"&&(i.i=new l.LongBits(r.i.low>>>0,r.i.high>>>0).toNumber())),r.s!=null&&(typeof r.s=="string"?l.base64.decode(r.s,i.s=l.newBuffer(l.base64.length(r.s)),0):r.s.length>=0&&(i.s=r.s)),r.t!=null){if(typeof r.t!="object")throw TypeError(".onnx.AttributeProto.t: object expected");i.t=d.onnx.TensorProto.fromObject(r.t)}if(r.g!=null){if(typeof r.g!="object")throw TypeError(".onnx.AttributeProto.g: object expected");i.g=d.onnx.GraphProto.fromObject(r.g)}if(r.sparseTensor!=null){if(typeof r.sparseTensor!="object")throw TypeError(".onnx.AttributeProto.sparseTensor: object expected");i.sparseTensor=d.onnx.SparseTensorProto.fromObject(r.sparseTensor)}if(r.tp!=null){if(typeof r.tp!="object")throw TypeError(".onnx.AttributeProto.tp: object expected");i.tp=d.onnx.TypeProto.fromObject(r.tp)}if(r.floats){if(!Array.isArray(r.floats))throw TypeError(".onnx.AttributeProto.floats: array expected");i.floats=[];for(var a=0;a<r.floats.length;++a)i.floats[a]=Number(r.floats[a])}if(r.ints){if(!Array.isArray(r.ints))throw TypeError(".onnx.AttributeProto.ints: array expected");i.ints=[];for(var a=0;a<r.ints.length;++a)l.Long?(i.ints[a]=l.Long.fromValue(r.ints[a])).unsigned=!1:typeof r.ints[a]=="string"?i.ints[a]=parseInt(r.ints[a],10):typeof r.ints[a]=="number"?i.ints[a]=r.ints[a]:typeof r.ints[a]=="object"&&(i.ints[a]=new l.LongBits(r.ints[a].low>>>0,r.ints[a].high>>>0).toNumber())}if(r.strings){if(!Array.isArray(r.strings))throw TypeError(".onnx.AttributeProto.strings: array expected");i.strings=[];for(var a=0;a<r.strings.length;++a)typeof r.strings[a]=="string"?l.base64.decode(r.strings[a],i.strings[a]=l.newBuffer(l.base64.length(r.strings[a])),0):r.strings[a].length>=0&&(i.strings[a]=r.strings[a])}if(r.tensors){if(!Array.isArray(r.tensors))throw TypeError(".onnx.AttributeProto.tensors: array expected");i.tensors=[];for(var a=0;a<r.tensors.length;++a){if(typeof r.tensors[a]!="object")throw TypeError(".onnx.AttributeProto.tensors: object expected");i.tensors[a]=d.onnx.TensorProto.fromObject(r.tensors[a])}}if(r.graphs){if(!Array.isArray(r.graphs))throw TypeError(".onnx.AttributeProto.graphs: array expected");i.graphs=[];for(var a=0;a<r.graphs.length;++a){if(typeof r.graphs[a]!="object")throw TypeError(".onnx.AttributeProto.graphs: object expected");i.graphs[a]=d.onnx.GraphProto.fromObject(r.graphs[a])}}if(r.sparseTensors){if(!Array.isArray(r.sparseTensors))throw TypeError(".onnx.AttributeProto.sparseTensors: array expected");i.sparseTensors=[];for(var a=0;a<r.sparseTensors.length;++a){if(typeof r.sparseTensors[a]!="object")throw TypeError(".onnx.AttributeProto.sparseTensors: object expected");i.sparseTensors[a]=d.onnx.SparseTensorProto.fromObject(r.sparseTensors[a])}}if(r.typeProtos){if(!Array.isArray(r.typeProtos))throw TypeError(".onnx.AttributeProto.typeProtos: array expected");i.typeProtos=[];for(var a=0;a<r.typeProtos.length;++a){if(typeof r.typeProtos[a]!="object")throw TypeError(".onnx.AttributeProto.typeProtos: object expected");i.typeProtos[a]=d.onnx.TypeProto.fromObject(r.typeProtos[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.floats=[],a.ints=[],a.strings=[],a.tensors=[],a.graphs=[],a.typeProtos=[],a.sparseTensors=[]),i.defaults){if(a.name="",a.f=0,l.Long){var p=new l.Long(0,0,!1);a.i=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.i=i.longs===String?"0":0;i.bytes===String?a.s="":(a.s=[],i.bytes!==Array&&(a.s=l.newBuffer(a.s))),a.t=null,a.g=null,a.docString="",a.tp=null,a.type=i.enums===String?"UNDEFINED":0,a.refAttrName="",a.sparseTensor=null}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.f!=null&&r.hasOwnProperty("f")&&(a.f=i.json&&!isFinite(r.f)?String(r.f):r.f),r.i!=null&&r.hasOwnProperty("i")&&(typeof r.i=="number"?a.i=i.longs===String?String(r.i):r.i:a.i=i.longs===String?l.Long.prototype.toString.call(r.i):i.longs===Number?new l.LongBits(r.i.low>>>0,r.i.high>>>0).toNumber():r.i),r.s!=null&&r.hasOwnProperty("s")&&(a.s=i.bytes===String?l.base64.encode(r.s,0,r.s.length):i.bytes===Array?Array.prototype.slice.call(r.s):r.s),r.t!=null&&r.hasOwnProperty("t")&&(a.t=d.onnx.TensorProto.toObject(r.t,i)),r.g!=null&&r.hasOwnProperty("g")&&(a.g=d.onnx.GraphProto.toObject(r.g,i)),r.floats&&r.floats.length){a.floats=[];for(var h=0;h<r.floats.length;++h)a.floats[h]=i.json&&!isFinite(r.floats[h])?String(r.floats[h]):r.floats[h]}if(r.ints&&r.ints.length){a.ints=[];for(var h=0;h<r.ints.length;++h)typeof r.ints[h]=="number"?a.ints[h]=i.longs===String?String(r.ints[h]):r.ints[h]:a.ints[h]=i.longs===String?l.Long.prototype.toString.call(r.ints[h]):i.longs===Number?new l.LongBits(r.ints[h].low>>>0,r.ints[h].high>>>0).toNumber():r.ints[h]}if(r.strings&&r.strings.length){a.strings=[];for(var h=0;h<r.strings.length;++h)a.strings[h]=i.bytes===String?l.base64.encode(r.strings[h],0,r.strings[h].length):i.bytes===Array?Array.prototype.slice.call(r.strings[h]):r.strings[h]}if(r.tensors&&r.tensors.length){a.tensors=[];for(var h=0;h<r.tensors.length;++h)a.tensors[h]=d.onnx.TensorProto.toObject(r.tensors[h],i)}if(r.graphs&&r.graphs.length){a.graphs=[];for(var h=0;h<r.graphs.length;++h)a.graphs[h]=d.onnx.GraphProto.toObject(r.graphs[h],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.tp!=null&&r.hasOwnProperty("tp")&&(a.tp=d.onnx.TypeProto.toObject(r.tp,i)),r.typeProtos&&r.typeProtos.length){a.typeProtos=[];for(var h=0;h<r.typeProtos.length;++h)a.typeProtos[h]=d.onnx.TypeProto.toObject(r.typeProtos[h],i)}if(r.type!=null&&r.hasOwnProperty("type")&&(a.type=i.enums===String?d.onnx.AttributeProto.AttributeType[r.type]===void 0?r.type:d.onnx.AttributeProto.AttributeType[r.type]:r.type),r.refAttrName!=null&&r.hasOwnProperty("refAttrName")&&(a.refAttrName=r.refAttrName),r.sparseTensor!=null&&r.hasOwnProperty("sparseTensor")&&(a.sparseTensor=d.onnx.SparseTensorProto.toObject(r.sparseTensor,i)),r.sparseTensors&&r.sparseTensors.length){a.sparseTensors=[];for(var h=0;h<r.sparseTensors.length;++h)a.sparseTensors[h]=d.onnx.SparseTensorProto.toObject(r.sparseTensors[h],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.AttributeProto"},s.AttributeType=(function(){var r={},i=Object.create(r);return i[r[0]="UNDEFINED"]=0,i[r[1]="FLOAT"]=1,i[r[2]="INT"]=2,i[r[3]="STRING"]=3,i[r[4]="TENSOR"]=4,i[r[5]="GRAPH"]=5,i[r[11]="SPARSE_TENSOR"]=11,i[r[13]="TYPE_PROTO"]=13,i[r[6]="FLOATS"]=6,i[r[7]="INTS"]=7,i[r[8]="STRINGS"]=8,i[r[9]="TENSORS"]=9,i[r[10]="GRAPHS"]=10,i[r[12]="SPARSE_TENSORS"]=12,i[r[14]="TYPE_PROTOS"]=14,i})(),s})(),c.ValueInfoProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.type=null,s.prototype.docString="",s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.type!=null&&Object.hasOwnProperty.call(r,"type")&&d.onnx.TypeProto.encode(r.type,i.uint32(18).fork()).ldelim(),r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(26).string(r.docString),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.ValueInfoProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 2:{p.type=d.onnx.TypeProto.decode(r,r.uint32());break}case 3:{p.docString=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.type!=null&&r.hasOwnProperty("type")){var i=d.onnx.TypeProto.verify(r.type);if(i)return"type."+i}return r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString)?"docString: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.ValueInfoProto)return r;var i=new d.onnx.ValueInfoProto;if(r.name!=null&&(i.name=String(r.name)),r.type!=null){if(typeof r.type!="object")throw TypeError(".onnx.ValueInfoProto.type: object expected");i.type=d.onnx.TypeProto.fromObject(r.type)}return r.docString!=null&&(i.docString=String(r.docString)),i},s.toObject=function(r,i){i||(i={});var a={};return i.defaults&&(a.name="",a.type=null,a.docString=""),r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.type!=null&&r.hasOwnProperty("type")&&(a.type=d.onnx.TypeProto.toObject(r.type,i)),r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.ValueInfoProto"},s})(),c.NodeProto=(function(){function s(r){if(this.input=[],this.output=[],this.attribute=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.name="",s.prototype.opType="",s.prototype.domain="",s.prototype.attribute=l.emptyArray,s.prototype.docString="",s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)i.uint32(10).string(r.input[a]);if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)i.uint32(18).string(r.output[a]);if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(26).string(r.name),r.opType!=null&&Object.hasOwnProperty.call(r,"opType")&&i.uint32(34).string(r.opType),r.attribute!=null&&r.attribute.length)for(var a=0;a<r.attribute.length;++a)d.onnx.AttributeProto.encode(r.attribute[a],i.uint32(42).fork()).ldelim();return r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(50).string(r.docString),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(58).string(r.domain),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.NodeProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.input&&p.input.length||(p.input=[]),p.input.push(r.string());break}case 2:{p.output&&p.output.length||(p.output=[]),p.output.push(r.string());break}case 3:{p.name=r.string();break}case 4:{p.opType=r.string();break}case 7:{p.domain=r.string();break}case 5:{p.attribute&&p.attribute.length||(p.attribute=[]),p.attribute.push(d.onnx.AttributeProto.decode(r,r.uint32()));break}case 6:{p.docString=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i)if(!l.isString(r.input[i]))return"input: string[] expected"}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i)if(!l.isString(r.output[i]))return"output: string[] expected"}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.opType!=null&&r.hasOwnProperty("opType")&&!l.isString(r.opType))return"opType: string expected";if(r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain))return"domain: string expected";if(r.attribute!=null&&r.hasOwnProperty("attribute")){if(!Array.isArray(r.attribute))return"attribute: array expected";for(var i=0;i<r.attribute.length;++i){var a=d.onnx.AttributeProto.verify(r.attribute[i]);if(a)return"attribute."+a}}return r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString)?"docString: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.NodeProto)return r;var i=new d.onnx.NodeProto;if(r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.NodeProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a)i.input[a]=String(r.input[a])}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.NodeProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a)i.output[a]=String(r.output[a])}if(r.name!=null&&(i.name=String(r.name)),r.opType!=null&&(i.opType=String(r.opType)),r.domain!=null&&(i.domain=String(r.domain)),r.attribute){if(!Array.isArray(r.attribute))throw TypeError(".onnx.NodeProto.attribute: array expected");i.attribute=[];for(var a=0;a<r.attribute.length;++a){if(typeof r.attribute[a]!="object")throw TypeError(".onnx.NodeProto.attribute: object expected");i.attribute[a]=d.onnx.AttributeProto.fromObject(r.attribute[a])}}return r.docString!=null&&(i.docString=String(r.docString)),i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.input=[],a.output=[],a.attribute=[]),i.defaults&&(a.name="",a.opType="",a.docString="",a.domain=""),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=r.input[p]}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=r.output[p]}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.opType!=null&&r.hasOwnProperty("opType")&&(a.opType=r.opType),r.attribute&&r.attribute.length){a.attribute=[];for(var p=0;p<r.attribute.length;++p)a.attribute[p]=d.onnx.AttributeProto.toObject(r.attribute[p],i)}return r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.NodeProto"},s})(),c.TrainingInfoProto=(function(){function s(r){if(this.initializationBinding=[],this.updateBinding=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.initialization=null,s.prototype.algorithm=null,s.prototype.initializationBinding=l.emptyArray,s.prototype.updateBinding=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.initialization!=null&&Object.hasOwnProperty.call(r,"initialization")&&d.onnx.GraphProto.encode(r.initialization,i.uint32(10).fork()).ldelim(),r.algorithm!=null&&Object.hasOwnProperty.call(r,"algorithm")&&d.onnx.GraphProto.encode(r.algorithm,i.uint32(18).fork()).ldelim(),r.initializationBinding!=null&&r.initializationBinding.length)for(var a=0;a<r.initializationBinding.length;++a)d.onnx.StringStringEntryProto.encode(r.initializationBinding[a],i.uint32(26).fork()).ldelim();if(r.updateBinding!=null&&r.updateBinding.length)for(var a=0;a<r.updateBinding.length;++a)d.onnx.StringStringEntryProto.encode(r.updateBinding[a],i.uint32(34).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TrainingInfoProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.initialization=d.onnx.GraphProto.decode(r,r.uint32());break}case 2:{p.algorithm=d.onnx.GraphProto.decode(r,r.uint32());break}case 3:{p.initializationBinding&&p.initializationBinding.length||(p.initializationBinding=[]),p.initializationBinding.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 4:{p.updateBinding&&p.updateBinding.length||(p.updateBinding=[]),p.updateBinding.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.initialization!=null&&r.hasOwnProperty("initialization")){var i=d.onnx.GraphProto.verify(r.initialization);if(i)return"initialization."+i}if(r.algorithm!=null&&r.hasOwnProperty("algorithm")){var i=d.onnx.GraphProto.verify(r.algorithm);if(i)return"algorithm."+i}if(r.initializationBinding!=null&&r.hasOwnProperty("initializationBinding")){if(!Array.isArray(r.initializationBinding))return"initializationBinding: array expected";for(var a=0;a<r.initializationBinding.length;++a){var i=d.onnx.StringStringEntryProto.verify(r.initializationBinding[a]);if(i)return"initializationBinding."+i}}if(r.updateBinding!=null&&r.hasOwnProperty("updateBinding")){if(!Array.isArray(r.updateBinding))return"updateBinding: array expected";for(var a=0;a<r.updateBinding.length;++a){var i=d.onnx.StringStringEntryProto.verify(r.updateBinding[a]);if(i)return"updateBinding."+i}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TrainingInfoProto)return r;var i=new d.onnx.TrainingInfoProto;if(r.initialization!=null){if(typeof r.initialization!="object")throw TypeError(".onnx.TrainingInfoProto.initialization: object expected");i.initialization=d.onnx.GraphProto.fromObject(r.initialization)}if(r.algorithm!=null){if(typeof r.algorithm!="object")throw TypeError(".onnx.TrainingInfoProto.algorithm: object expected");i.algorithm=d.onnx.GraphProto.fromObject(r.algorithm)}if(r.initializationBinding){if(!Array.isArray(r.initializationBinding))throw TypeError(".onnx.TrainingInfoProto.initializationBinding: array expected");i.initializationBinding=[];for(var a=0;a<r.initializationBinding.length;++a){if(typeof r.initializationBinding[a]!="object")throw TypeError(".onnx.TrainingInfoProto.initializationBinding: object expected");i.initializationBinding[a]=d.onnx.StringStringEntryProto.fromObject(r.initializationBinding[a])}}if(r.updateBinding){if(!Array.isArray(r.updateBinding))throw TypeError(".onnx.TrainingInfoProto.updateBinding: array expected");i.updateBinding=[];for(var a=0;a<r.updateBinding.length;++a){if(typeof r.updateBinding[a]!="object")throw TypeError(".onnx.TrainingInfoProto.updateBinding: object expected");i.updateBinding[a]=d.onnx.StringStringEntryProto.fromObject(r.updateBinding[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.initializationBinding=[],a.updateBinding=[]),i.defaults&&(a.initialization=null,a.algorithm=null),r.initialization!=null&&r.hasOwnProperty("initialization")&&(a.initialization=d.onnx.GraphProto.toObject(r.initialization,i)),r.algorithm!=null&&r.hasOwnProperty("algorithm")&&(a.algorithm=d.onnx.GraphProto.toObject(r.algorithm,i)),r.initializationBinding&&r.initializationBinding.length){a.initializationBinding=[];for(var p=0;p<r.initializationBinding.length;++p)a.initializationBinding[p]=d.onnx.StringStringEntryProto.toObject(r.initializationBinding[p],i)}if(r.updateBinding&&r.updateBinding.length){a.updateBinding=[];for(var p=0;p<r.updateBinding.length;++p)a.updateBinding[p]=d.onnx.StringStringEntryProto.toObject(r.updateBinding[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TrainingInfoProto"},s})(),c.ModelProto=(function(){function s(r){if(this.opsetImport=[],this.metadataProps=[],this.trainingInfo=[],this.functions=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.irVersion=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.opsetImport=l.emptyArray,s.prototype.producerName="",s.prototype.producerVersion="",s.prototype.domain="",s.prototype.modelVersion=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.docString="",s.prototype.graph=null,s.prototype.metadataProps=l.emptyArray,s.prototype.trainingInfo=l.emptyArray,s.prototype.functions=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.irVersion!=null&&Object.hasOwnProperty.call(r,"irVersion")&&i.uint32(8).int64(r.irVersion),r.producerName!=null&&Object.hasOwnProperty.call(r,"producerName")&&i.uint32(18).string(r.producerName),r.producerVersion!=null&&Object.hasOwnProperty.call(r,"producerVersion")&&i.uint32(26).string(r.producerVersion),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(34).string(r.domain),r.modelVersion!=null&&Object.hasOwnProperty.call(r,"modelVersion")&&i.uint32(40).int64(r.modelVersion),r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(50).string(r.docString),r.graph!=null&&Object.hasOwnProperty.call(r,"graph")&&d.onnx.GraphProto.encode(r.graph,i.uint32(58).fork()).ldelim(),r.opsetImport!=null&&r.opsetImport.length)for(var a=0;a<r.opsetImport.length;++a)d.onnx.OperatorSetIdProto.encode(r.opsetImport[a],i.uint32(66).fork()).ldelim();if(r.metadataProps!=null&&r.metadataProps.length)for(var a=0;a<r.metadataProps.length;++a)d.onnx.StringStringEntryProto.encode(r.metadataProps[a],i.uint32(114).fork()).ldelim();if(r.trainingInfo!=null&&r.trainingInfo.length)for(var a=0;a<r.trainingInfo.length;++a)d.onnx.TrainingInfoProto.encode(r.trainingInfo[a],i.uint32(162).fork()).ldelim();if(r.functions!=null&&r.functions.length)for(var a=0;a<r.functions.length;++a)d.onnx.FunctionProto.encode(r.functions[a],i.uint32(202).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.ModelProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.irVersion=r.int64();break}case 8:{p.opsetImport&&p.opsetImport.length||(p.opsetImport=[]),p.opsetImport.push(d.onnx.OperatorSetIdProto.decode(r,r.uint32()));break}case 2:{p.producerName=r.string();break}case 3:{p.producerVersion=r.string();break}case 4:{p.domain=r.string();break}case 5:{p.modelVersion=r.int64();break}case 6:{p.docString=r.string();break}case 7:{p.graph=d.onnx.GraphProto.decode(r,r.uint32());break}case 14:{p.metadataProps&&p.metadataProps.length||(p.metadataProps=[]),p.metadataProps.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 20:{p.trainingInfo&&p.trainingInfo.length||(p.trainingInfo=[]),p.trainingInfo.push(d.onnx.TrainingInfoProto.decode(r,r.uint32()));break}case 25:{p.functions&&p.functions.length||(p.functions=[]),p.functions.push(d.onnx.FunctionProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.irVersion!=null&&r.hasOwnProperty("irVersion")&&!l.isInteger(r.irVersion)&&!(r.irVersion&&l.isInteger(r.irVersion.low)&&l.isInteger(r.irVersion.high)))return"irVersion: integer|Long expected";if(r.opsetImport!=null&&r.hasOwnProperty("opsetImport")){if(!Array.isArray(r.opsetImport))return"opsetImport: array expected";for(var i=0;i<r.opsetImport.length;++i){var a=d.onnx.OperatorSetIdProto.verify(r.opsetImport[i]);if(a)return"opsetImport."+a}}if(r.producerName!=null&&r.hasOwnProperty("producerName")&&!l.isString(r.producerName))return"producerName: string expected";if(r.producerVersion!=null&&r.hasOwnProperty("producerVersion")&&!l.isString(r.producerVersion))return"producerVersion: string expected";if(r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain))return"domain: string expected";if(r.modelVersion!=null&&r.hasOwnProperty("modelVersion")&&!l.isInteger(r.modelVersion)&&!(r.modelVersion&&l.isInteger(r.modelVersion.low)&&l.isInteger(r.modelVersion.high)))return"modelVersion: integer|Long expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.graph!=null&&r.hasOwnProperty("graph")){var a=d.onnx.GraphProto.verify(r.graph);if(a)return"graph."+a}if(r.metadataProps!=null&&r.hasOwnProperty("metadataProps")){if(!Array.isArray(r.metadataProps))return"metadataProps: array expected";for(var i=0;i<r.metadataProps.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.metadataProps[i]);if(a)return"metadataProps."+a}}if(r.trainingInfo!=null&&r.hasOwnProperty("trainingInfo")){if(!Array.isArray(r.trainingInfo))return"trainingInfo: array expected";for(var i=0;i<r.trainingInfo.length;++i){var a=d.onnx.TrainingInfoProto.verify(r.trainingInfo[i]);if(a)return"trainingInfo."+a}}if(r.functions!=null&&r.hasOwnProperty("functions")){if(!Array.isArray(r.functions))return"functions: array expected";for(var i=0;i<r.functions.length;++i){var a=d.onnx.FunctionProto.verify(r.functions[i]);if(a)return"functions."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.ModelProto)return r;var i=new d.onnx.ModelProto;if(r.irVersion!=null&&(l.Long?(i.irVersion=l.Long.fromValue(r.irVersion)).unsigned=!1:typeof r.irVersion=="string"?i.irVersion=parseInt(r.irVersion,10):typeof r.irVersion=="number"?i.irVersion=r.irVersion:typeof r.irVersion=="object"&&(i.irVersion=new l.LongBits(r.irVersion.low>>>0,r.irVersion.high>>>0).toNumber())),r.opsetImport){if(!Array.isArray(r.opsetImport))throw TypeError(".onnx.ModelProto.opsetImport: array expected");i.opsetImport=[];for(var a=0;a<r.opsetImport.length;++a){if(typeof r.opsetImport[a]!="object")throw TypeError(".onnx.ModelProto.opsetImport: object expected");i.opsetImport[a]=d.onnx.OperatorSetIdProto.fromObject(r.opsetImport[a])}}if(r.producerName!=null&&(i.producerName=String(r.producerName)),r.producerVersion!=null&&(i.producerVersion=String(r.producerVersion)),r.domain!=null&&(i.domain=String(r.domain)),r.modelVersion!=null&&(l.Long?(i.modelVersion=l.Long.fromValue(r.modelVersion)).unsigned=!1:typeof r.modelVersion=="string"?i.modelVersion=parseInt(r.modelVersion,10):typeof r.modelVersion=="number"?i.modelVersion=r.modelVersion:typeof r.modelVersion=="object"&&(i.modelVersion=new l.LongBits(r.modelVersion.low>>>0,r.modelVersion.high>>>0).toNumber())),r.docString!=null&&(i.docString=String(r.docString)),r.graph!=null){if(typeof r.graph!="object")throw TypeError(".onnx.ModelProto.graph: object expected");i.graph=d.onnx.GraphProto.fromObject(r.graph)}if(r.metadataProps){if(!Array.isArray(r.metadataProps))throw TypeError(".onnx.ModelProto.metadataProps: array expected");i.metadataProps=[];for(var a=0;a<r.metadataProps.length;++a){if(typeof r.metadataProps[a]!="object")throw TypeError(".onnx.ModelProto.metadataProps: object expected");i.metadataProps[a]=d.onnx.StringStringEntryProto.fromObject(r.metadataProps[a])}}if(r.trainingInfo){if(!Array.isArray(r.trainingInfo))throw TypeError(".onnx.ModelProto.trainingInfo: array expected");i.trainingInfo=[];for(var a=0;a<r.trainingInfo.length;++a){if(typeof r.trainingInfo[a]!="object")throw TypeError(".onnx.ModelProto.trainingInfo: object expected");i.trainingInfo[a]=d.onnx.TrainingInfoProto.fromObject(r.trainingInfo[a])}}if(r.functions){if(!Array.isArray(r.functions))throw TypeError(".onnx.ModelProto.functions: array expected");i.functions=[];for(var a=0;a<r.functions.length;++a){if(typeof r.functions[a]!="object")throw TypeError(".onnx.ModelProto.functions: object expected");i.functions[a]=d.onnx.FunctionProto.fromObject(r.functions[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.opsetImport=[],a.metadataProps=[],a.trainingInfo=[],a.functions=[]),i.defaults){if(l.Long){var p=new l.Long(0,0,!1);a.irVersion=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.irVersion=i.longs===String?"0":0;if(a.producerName="",a.producerVersion="",a.domain="",l.Long){var p=new l.Long(0,0,!1);a.modelVersion=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.modelVersion=i.longs===String?"0":0;a.docString="",a.graph=null}if(r.irVersion!=null&&r.hasOwnProperty("irVersion")&&(typeof r.irVersion=="number"?a.irVersion=i.longs===String?String(r.irVersion):r.irVersion:a.irVersion=i.longs===String?l.Long.prototype.toString.call(r.irVersion):i.longs===Number?new l.LongBits(r.irVersion.low>>>0,r.irVersion.high>>>0).toNumber():r.irVersion),r.producerName!=null&&r.hasOwnProperty("producerName")&&(a.producerName=r.producerName),r.producerVersion!=null&&r.hasOwnProperty("producerVersion")&&(a.producerVersion=r.producerVersion),r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.modelVersion!=null&&r.hasOwnProperty("modelVersion")&&(typeof r.modelVersion=="number"?a.modelVersion=i.longs===String?String(r.modelVersion):r.modelVersion:a.modelVersion=i.longs===String?l.Long.prototype.toString.call(r.modelVersion):i.longs===Number?new l.LongBits(r.modelVersion.low>>>0,r.modelVersion.high>>>0).toNumber():r.modelVersion),r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.graph!=null&&r.hasOwnProperty("graph")&&(a.graph=d.onnx.GraphProto.toObject(r.graph,i)),r.opsetImport&&r.opsetImport.length){a.opsetImport=[];for(var h=0;h<r.opsetImport.length;++h)a.opsetImport[h]=d.onnx.OperatorSetIdProto.toObject(r.opsetImport[h],i)}if(r.metadataProps&&r.metadataProps.length){a.metadataProps=[];for(var h=0;h<r.metadataProps.length;++h)a.metadataProps[h]=d.onnx.StringStringEntryProto.toObject(r.metadataProps[h],i)}if(r.trainingInfo&&r.trainingInfo.length){a.trainingInfo=[];for(var h=0;h<r.trainingInfo.length;++h)a.trainingInfo[h]=d.onnx.TrainingInfoProto.toObject(r.trainingInfo[h],i)}if(r.functions&&r.functions.length){a.functions=[];for(var h=0;h<r.functions.length;++h)a.functions[h]=d.onnx.FunctionProto.toObject(r.functions[h],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.ModelProto"},s})(),c.StringStringEntryProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.key="",s.prototype.value="",s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.key!=null&&Object.hasOwnProperty.call(r,"key")&&i.uint32(10).string(r.key),r.value!=null&&Object.hasOwnProperty.call(r,"value")&&i.uint32(18).string(r.value),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.StringStringEntryProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.key=r.string();break}case 2:{p.value=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){return typeof r!="object"||r===null?"object expected":r.key!=null&&r.hasOwnProperty("key")&&!l.isString(r.key)?"key: string expected":r.value!=null&&r.hasOwnProperty("value")&&!l.isString(r.value)?"value: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.StringStringEntryProto)return r;var i=new d.onnx.StringStringEntryProto;return r.key!=null&&(i.key=String(r.key)),r.value!=null&&(i.value=String(r.value)),i},s.toObject=function(r,i){i||(i={});var a={};return i.defaults&&(a.key="",a.value=""),r.key!=null&&r.hasOwnProperty("key")&&(a.key=r.key),r.value!=null&&r.hasOwnProperty("value")&&(a.value=r.value),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.StringStringEntryProto"},s})(),c.TensorAnnotation=(function(){function s(r){if(this.quantParameterTensorNames=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.tensorName="",s.prototype.quantParameterTensorNames=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.tensorName!=null&&Object.hasOwnProperty.call(r,"tensorName")&&i.uint32(10).string(r.tensorName),r.quantParameterTensorNames!=null&&r.quantParameterTensorNames.length)for(var a=0;a<r.quantParameterTensorNames.length;++a)d.onnx.StringStringEntryProto.encode(r.quantParameterTensorNames[a],i.uint32(18).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorAnnotation;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.tensorName=r.string();break}case 2:{p.quantParameterTensorNames&&p.quantParameterTensorNames.length||(p.quantParameterTensorNames=[]),p.quantParameterTensorNames.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.tensorName!=null&&r.hasOwnProperty("tensorName")&&!l.isString(r.tensorName))return"tensorName: string expected";if(r.quantParameterTensorNames!=null&&r.hasOwnProperty("quantParameterTensorNames")){if(!Array.isArray(r.quantParameterTensorNames))return"quantParameterTensorNames: array expected";for(var i=0;i<r.quantParameterTensorNames.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.quantParameterTensorNames[i]);if(a)return"quantParameterTensorNames."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorAnnotation)return r;var i=new d.onnx.TensorAnnotation;if(r.tensorName!=null&&(i.tensorName=String(r.tensorName)),r.quantParameterTensorNames){if(!Array.isArray(r.quantParameterTensorNames))throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: array expected");i.quantParameterTensorNames=[];for(var a=0;a<r.quantParameterTensorNames.length;++a){if(typeof r.quantParameterTensorNames[a]!="object")throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: object expected");i.quantParameterTensorNames[a]=d.onnx.StringStringEntryProto.fromObject(r.quantParameterTensorNames[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.quantParameterTensorNames=[]),i.defaults&&(a.tensorName=""),r.tensorName!=null&&r.hasOwnProperty("tensorName")&&(a.tensorName=r.tensorName),r.quantParameterTensorNames&&r.quantParameterTensorNames.length){a.quantParameterTensorNames=[];for(var p=0;p<r.quantParameterTensorNames.length;++p)a.quantParameterTensorNames[p]=d.onnx.StringStringEntryProto.toObject(r.quantParameterTensorNames[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorAnnotation"},s})(),c.GraphProto=(function(){function s(r){if(this.node=[],this.initializer=[],this.sparseInitializer=[],this.input=[],this.output=[],this.valueInfo=[],this.quantizationAnnotation=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.node=l.emptyArray,s.prototype.name="",s.prototype.initializer=l.emptyArray,s.prototype.sparseInitializer=l.emptyArray,s.prototype.docString="",s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.valueInfo=l.emptyArray,s.prototype.quantizationAnnotation=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.node!=null&&r.node.length)for(var a=0;a<r.node.length;++a)d.onnx.NodeProto.encode(r.node[a],i.uint32(10).fork()).ldelim();if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(18).string(r.name),r.initializer!=null&&r.initializer.length)for(var a=0;a<r.initializer.length;++a)d.onnx.TensorProto.encode(r.initializer[a],i.uint32(42).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(82).string(r.docString),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)d.onnx.ValueInfoProto.encode(r.input[a],i.uint32(90).fork()).ldelim();if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)d.onnx.ValueInfoProto.encode(r.output[a],i.uint32(98).fork()).ldelim();if(r.valueInfo!=null&&r.valueInfo.length)for(var a=0;a<r.valueInfo.length;++a)d.onnx.ValueInfoProto.encode(r.valueInfo[a],i.uint32(106).fork()).ldelim();if(r.quantizationAnnotation!=null&&r.quantizationAnnotation.length)for(var a=0;a<r.quantizationAnnotation.length;++a)d.onnx.TensorAnnotation.encode(r.quantizationAnnotation[a],i.uint32(114).fork()).ldelim();if(r.sparseInitializer!=null&&r.sparseInitializer.length)for(var a=0;a<r.sparseInitializer.length;++a)d.onnx.SparseTensorProto.encode(r.sparseInitializer[a],i.uint32(122).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.GraphProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.node&&p.node.length||(p.node=[]),p.node.push(d.onnx.NodeProto.decode(r,r.uint32()));break}case 2:{p.name=r.string();break}case 5:{p.initializer&&p.initializer.length||(p.initializer=[]),p.initializer.push(d.onnx.TensorProto.decode(r,r.uint32()));break}case 15:{p.sparseInitializer&&p.sparseInitializer.length||(p.sparseInitializer=[]),p.sparseInitializer.push(d.onnx.SparseTensorProto.decode(r,r.uint32()));break}case 10:{p.docString=r.string();break}case 11:{p.input&&p.input.length||(p.input=[]),p.input.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 12:{p.output&&p.output.length||(p.output=[]),p.output.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 13:{p.valueInfo&&p.valueInfo.length||(p.valueInfo=[]),p.valueInfo.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 14:{p.quantizationAnnotation&&p.quantizationAnnotation.length||(p.quantizationAnnotation=[]),p.quantizationAnnotation.push(d.onnx.TensorAnnotation.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.node!=null&&r.hasOwnProperty("node")){if(!Array.isArray(r.node))return"node: array expected";for(var i=0;i<r.node.length;++i){var a=d.onnx.NodeProto.verify(r.node[i]);if(a)return"node."+a}}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.initializer!=null&&r.hasOwnProperty("initializer")){if(!Array.isArray(r.initializer))return"initializer: array expected";for(var i=0;i<r.initializer.length;++i){var a=d.onnx.TensorProto.verify(r.initializer[i]);if(a)return"initializer."+a}}if(r.sparseInitializer!=null&&r.hasOwnProperty("sparseInitializer")){if(!Array.isArray(r.sparseInitializer))return"sparseInitializer: array expected";for(var i=0;i<r.sparseInitializer.length;++i){var a=d.onnx.SparseTensorProto.verify(r.sparseInitializer[i]);if(a)return"sparseInitializer."+a}}if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i){var a=d.onnx.ValueInfoProto.verify(r.input[i]);if(a)return"input."+a}}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i){var a=d.onnx.ValueInfoProto.verify(r.output[i]);if(a)return"output."+a}}if(r.valueInfo!=null&&r.hasOwnProperty("valueInfo")){if(!Array.isArray(r.valueInfo))return"valueInfo: array expected";for(var i=0;i<r.valueInfo.length;++i){var a=d.onnx.ValueInfoProto.verify(r.valueInfo[i]);if(a)return"valueInfo."+a}}if(r.quantizationAnnotation!=null&&r.hasOwnProperty("quantizationAnnotation")){if(!Array.isArray(r.quantizationAnnotation))return"quantizationAnnotation: array expected";for(var i=0;i<r.quantizationAnnotation.length;++i){var a=d.onnx.TensorAnnotation.verify(r.quantizationAnnotation[i]);if(a)return"quantizationAnnotation."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.GraphProto)return r;var i=new d.onnx.GraphProto;if(r.node){if(!Array.isArray(r.node))throw TypeError(".onnx.GraphProto.node: array expected");i.node=[];for(var a=0;a<r.node.length;++a){if(typeof r.node[a]!="object")throw TypeError(".onnx.GraphProto.node: object expected");i.node[a]=d.onnx.NodeProto.fromObject(r.node[a])}}if(r.name!=null&&(i.name=String(r.name)),r.initializer){if(!Array.isArray(r.initializer))throw TypeError(".onnx.GraphProto.initializer: array expected");i.initializer=[];for(var a=0;a<r.initializer.length;++a){if(typeof r.initializer[a]!="object")throw TypeError(".onnx.GraphProto.initializer: object expected");i.initializer[a]=d.onnx.TensorProto.fromObject(r.initializer[a])}}if(r.sparseInitializer){if(!Array.isArray(r.sparseInitializer))throw TypeError(".onnx.GraphProto.sparseInitializer: array expected");i.sparseInitializer=[];for(var a=0;a<r.sparseInitializer.length;++a){if(typeof r.sparseInitializer[a]!="object")throw TypeError(".onnx.GraphProto.sparseInitializer: object expected");i.sparseInitializer[a]=d.onnx.SparseTensorProto.fromObject(r.sparseInitializer[a])}}if(r.docString!=null&&(i.docString=String(r.docString)),r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.GraphProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a){if(typeof r.input[a]!="object")throw TypeError(".onnx.GraphProto.input: object expected");i.input[a]=d.onnx.ValueInfoProto.fromObject(r.input[a])}}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.GraphProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a){if(typeof r.output[a]!="object")throw TypeError(".onnx.GraphProto.output: object expected");i.output[a]=d.onnx.ValueInfoProto.fromObject(r.output[a])}}if(r.valueInfo){if(!Array.isArray(r.valueInfo))throw TypeError(".onnx.GraphProto.valueInfo: array expected");i.valueInfo=[];for(var a=0;a<r.valueInfo.length;++a){if(typeof r.valueInfo[a]!="object")throw TypeError(".onnx.GraphProto.valueInfo: object expected");i.valueInfo[a]=d.onnx.ValueInfoProto.fromObject(r.valueInfo[a])}}if(r.quantizationAnnotation){if(!Array.isArray(r.quantizationAnnotation))throw TypeError(".onnx.GraphProto.quantizationAnnotation: array expected");i.quantizationAnnotation=[];for(var a=0;a<r.quantizationAnnotation.length;++a){if(typeof r.quantizationAnnotation[a]!="object")throw TypeError(".onnx.GraphProto.quantizationAnnotation: object expected");i.quantizationAnnotation[a]=d.onnx.TensorAnnotation.fromObject(r.quantizationAnnotation[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.node=[],a.initializer=[],a.input=[],a.output=[],a.valueInfo=[],a.quantizationAnnotation=[],a.sparseInitializer=[]),i.defaults&&(a.name="",a.docString=""),r.node&&r.node.length){a.node=[];for(var p=0;p<r.node.length;++p)a.node[p]=d.onnx.NodeProto.toObject(r.node[p],i)}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.initializer&&r.initializer.length){a.initializer=[];for(var p=0;p<r.initializer.length;++p)a.initializer[p]=d.onnx.TensorProto.toObject(r.initializer[p],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=d.onnx.ValueInfoProto.toObject(r.input[p],i)}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=d.onnx.ValueInfoProto.toObject(r.output[p],i)}if(r.valueInfo&&r.valueInfo.length){a.valueInfo=[];for(var p=0;p<r.valueInfo.length;++p)a.valueInfo[p]=d.onnx.ValueInfoProto.toObject(r.valueInfo[p],i)}if(r.quantizationAnnotation&&r.quantizationAnnotation.length){a.quantizationAnnotation=[];for(var p=0;p<r.quantizationAnnotation.length;++p)a.quantizationAnnotation[p]=d.onnx.TensorAnnotation.toObject(r.quantizationAnnotation[p],i)}if(r.sparseInitializer&&r.sparseInitializer.length){a.sparseInitializer=[];for(var p=0;p<r.sparseInitializer.length;++p)a.sparseInitializer[p]=d.onnx.SparseTensorProto.toObject(r.sparseInitializer[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.GraphProto"},s})(),c.TensorProto=(function(){function s(r){if(this.dims=[],this.floatData=[],this.int32Data=[],this.stringData=[],this.int64Data=[],this.externalData=[],this.doubleData=[],this.uint64Data=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.dims=l.emptyArray,s.prototype.dataType=0,s.prototype.segment=null,s.prototype.floatData=l.emptyArray,s.prototype.int32Data=l.emptyArray,s.prototype.stringData=l.emptyArray,s.prototype.int64Data=l.emptyArray,s.prototype.name="",s.prototype.docString="",s.prototype.rawData=l.newBuffer([]),s.prototype.externalData=l.emptyArray,s.prototype.dataLocation=0,s.prototype.doubleData=l.emptyArray,s.prototype.uint64Data=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.dims!=null&&r.dims.length){i.uint32(10).fork();for(var a=0;a<r.dims.length;++a)i.int64(r.dims[a]);i.ldelim()}if(r.dataType!=null&&Object.hasOwnProperty.call(r,"dataType")&&i.uint32(16).int32(r.dataType),r.segment!=null&&Object.hasOwnProperty.call(r,"segment")&&d.onnx.TensorProto.Segment.encode(r.segment,i.uint32(26).fork()).ldelim(),r.floatData!=null&&r.floatData.length){i.uint32(34).fork();for(var a=0;a<r.floatData.length;++a)i.float(r.floatData[a]);i.ldelim()}if(r.int32Data!=null&&r.int32Data.length){i.uint32(42).fork();for(var a=0;a<r.int32Data.length;++a)i.int32(r.int32Data[a]);i.ldelim()}if(r.stringData!=null&&r.stringData.length)for(var a=0;a<r.stringData.length;++a)i.uint32(50).bytes(r.stringData[a]);if(r.int64Data!=null&&r.int64Data.length){i.uint32(58).fork();for(var a=0;a<r.int64Data.length;++a)i.int64(r.int64Data[a]);i.ldelim()}if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(66).string(r.name),r.rawData!=null&&Object.hasOwnProperty.call(r,"rawData")&&i.uint32(74).bytes(r.rawData),r.doubleData!=null&&r.doubleData.length){i.uint32(82).fork();for(var a=0;a<r.doubleData.length;++a)i.double(r.doubleData[a]);i.ldelim()}if(r.uint64Data!=null&&r.uint64Data.length){i.uint32(90).fork();for(var a=0;a<r.uint64Data.length;++a)i.uint64(r.uint64Data[a]);i.ldelim()}if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(98).string(r.docString),r.externalData!=null&&r.externalData.length)for(var a=0;a<r.externalData.length;++a)d.onnx.StringStringEntryProto.encode(r.externalData[a],i.uint32(106).fork()).ldelim();return r.dataLocation!=null&&Object.hasOwnProperty.call(r,"dataLocation")&&i.uint32(112).int32(r.dataLocation),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{if(p.dims&&p.dims.length||(p.dims=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.dims.push(r.int64());else p.dims.push(r.int64());break}case 2:{p.dataType=r.int32();break}case 3:{p.segment=d.onnx.TensorProto.Segment.decode(r,r.uint32());break}case 4:{if(p.floatData&&p.floatData.length||(p.floatData=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.floatData.push(r.float());else p.floatData.push(r.float());break}case 5:{if(p.int32Data&&p.int32Data.length||(p.int32Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.int32Data.push(r.int32());else p.int32Data.push(r.int32());break}case 6:{p.stringData&&p.stringData.length||(p.stringData=[]),p.stringData.push(r.bytes());break}case 7:{if(p.int64Data&&p.int64Data.length||(p.int64Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.int64Data.push(r.int64());else p.int64Data.push(r.int64());break}case 8:{p.name=r.string();break}case 12:{p.docString=r.string();break}case 9:{p.rawData=r.bytes();break}case 13:{p.externalData&&p.externalData.length||(p.externalData=[]),p.externalData.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 14:{p.dataLocation=r.int32();break}case 10:{if(p.doubleData&&p.doubleData.length||(p.doubleData=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.doubleData.push(r.double());else p.doubleData.push(r.double());break}case 11:{if(p.uint64Data&&p.uint64Data.length||(p.uint64Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.uint64Data.push(r.uint64());else p.uint64Data.push(r.uint64());break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.dims!=null&&r.hasOwnProperty("dims")){if(!Array.isArray(r.dims))return"dims: array expected";for(var i=0;i<r.dims.length;++i)if(!l.isInteger(r.dims[i])&&!(r.dims[i]&&l.isInteger(r.dims[i].low)&&l.isInteger(r.dims[i].high)))return"dims: integer|Long[] expected"}if(r.dataType!=null&&r.hasOwnProperty("dataType")&&!l.isInteger(r.dataType))return"dataType: integer expected";if(r.segment!=null&&r.hasOwnProperty("segment")){var a=d.onnx.TensorProto.Segment.verify(r.segment);if(a)return"segment."+a}if(r.floatData!=null&&r.hasOwnProperty("floatData")){if(!Array.isArray(r.floatData))return"floatData: array expected";for(var i=0;i<r.floatData.length;++i)if(typeof r.floatData[i]!="number")return"floatData: number[] expected"}if(r.int32Data!=null&&r.hasOwnProperty("int32Data")){if(!Array.isArray(r.int32Data))return"int32Data: array expected";for(var i=0;i<r.int32Data.length;++i)if(!l.isInteger(r.int32Data[i]))return"int32Data: integer[] expected"}if(r.stringData!=null&&r.hasOwnProperty("stringData")){if(!Array.isArray(r.stringData))return"stringData: array expected";for(var i=0;i<r.stringData.length;++i)if(!(r.stringData[i]&&typeof r.stringData[i].length=="number"||l.isString(r.stringData[i])))return"stringData: buffer[] expected"}if(r.int64Data!=null&&r.hasOwnProperty("int64Data")){if(!Array.isArray(r.int64Data))return"int64Data: array expected";for(var i=0;i<r.int64Data.length;++i)if(!l.isInteger(r.int64Data[i])&&!(r.int64Data[i]&&l.isInteger(r.int64Data[i].low)&&l.isInteger(r.int64Data[i].high)))return"int64Data: integer|Long[] expected"}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.rawData!=null&&r.hasOwnProperty("rawData")&&!(r.rawData&&typeof r.rawData.length=="number"||l.isString(r.rawData)))return"rawData: buffer expected";if(r.externalData!=null&&r.hasOwnProperty("externalData")){if(!Array.isArray(r.externalData))return"externalData: array expected";for(var i=0;i<r.externalData.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.externalData[i]);if(a)return"externalData."+a}}if(r.dataLocation!=null&&r.hasOwnProperty("dataLocation"))switch(r.dataLocation){default:return"dataLocation: enum value expected";case 0:case 1:break}if(r.doubleData!=null&&r.hasOwnProperty("doubleData")){if(!Array.isArray(r.doubleData))return"doubleData: array expected";for(var i=0;i<r.doubleData.length;++i)if(typeof r.doubleData[i]!="number")return"doubleData: number[] expected"}if(r.uint64Data!=null&&r.hasOwnProperty("uint64Data")){if(!Array.isArray(r.uint64Data))return"uint64Data: array expected";for(var i=0;i<r.uint64Data.length;++i)if(!l.isInteger(r.uint64Data[i])&&!(r.uint64Data[i]&&l.isInteger(r.uint64Data[i].low)&&l.isInteger(r.uint64Data[i].high)))return"uint64Data: integer|Long[] expected"}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorProto)return r;var i=new d.onnx.TensorProto;if(r.dims){if(!Array.isArray(r.dims))throw TypeError(".onnx.TensorProto.dims: array expected");i.dims=[];for(var a=0;a<r.dims.length;++a)l.Long?(i.dims[a]=l.Long.fromValue(r.dims[a])).unsigned=!1:typeof r.dims[a]=="string"?i.dims[a]=parseInt(r.dims[a],10):typeof r.dims[a]=="number"?i.dims[a]=r.dims[a]:typeof r.dims[a]=="object"&&(i.dims[a]=new l.LongBits(r.dims[a].low>>>0,r.dims[a].high>>>0).toNumber())}if(r.dataType!=null&&(i.dataType=r.dataType|0),r.segment!=null){if(typeof r.segment!="object")throw TypeError(".onnx.TensorProto.segment: object expected");i.segment=d.onnx.TensorProto.Segment.fromObject(r.segment)}if(r.floatData){if(!Array.isArray(r.floatData))throw TypeError(".onnx.TensorProto.floatData: array expected");i.floatData=[];for(var a=0;a<r.floatData.length;++a)i.floatData[a]=Number(r.floatData[a])}if(r.int32Data){if(!Array.isArray(r.int32Data))throw TypeError(".onnx.TensorProto.int32Data: array expected");i.int32Data=[];for(var a=0;a<r.int32Data.length;++a)i.int32Data[a]=r.int32Data[a]|0}if(r.stringData){if(!Array.isArray(r.stringData))throw TypeError(".onnx.TensorProto.stringData: array expected");i.stringData=[];for(var a=0;a<r.stringData.length;++a)typeof r.stringData[a]=="string"?l.base64.decode(r.stringData[a],i.stringData[a]=l.newBuffer(l.base64.length(r.stringData[a])),0):r.stringData[a].length>=0&&(i.stringData[a]=r.stringData[a])}if(r.int64Data){if(!Array.isArray(r.int64Data))throw TypeError(".onnx.TensorProto.int64Data: array expected");i.int64Data=[];for(var a=0;a<r.int64Data.length;++a)l.Long?(i.int64Data[a]=l.Long.fromValue(r.int64Data[a])).unsigned=!1:typeof r.int64Data[a]=="string"?i.int64Data[a]=parseInt(r.int64Data[a],10):typeof r.int64Data[a]=="number"?i.int64Data[a]=r.int64Data[a]:typeof r.int64Data[a]=="object"&&(i.int64Data[a]=new l.LongBits(r.int64Data[a].low>>>0,r.int64Data[a].high>>>0).toNumber())}if(r.name!=null&&(i.name=String(r.name)),r.docString!=null&&(i.docString=String(r.docString)),r.rawData!=null&&(typeof r.rawData=="string"?l.base64.decode(r.rawData,i.rawData=l.newBuffer(l.base64.length(r.rawData)),0):r.rawData.length>=0&&(i.rawData=r.rawData)),r.externalData){if(!Array.isArray(r.externalData))throw TypeError(".onnx.TensorProto.externalData: array expected");i.externalData=[];for(var a=0;a<r.externalData.length;++a){if(typeof r.externalData[a]!="object")throw TypeError(".onnx.TensorProto.externalData: object expected");i.externalData[a]=d.onnx.StringStringEntryProto.fromObject(r.externalData[a])}}switch(r.dataLocation){default:if(typeof r.dataLocation=="number"){i.dataLocation=r.dataLocation;break}break;case"DEFAULT":case 0:i.dataLocation=0;break;case"EXTERNAL":case 1:i.dataLocation=1;break}if(r.doubleData){if(!Array.isArray(r.doubleData))throw TypeError(".onnx.TensorProto.doubleData: array expected");i.doubleData=[];for(var a=0;a<r.doubleData.length;++a)i.doubleData[a]=Number(r.doubleData[a])}if(r.uint64Data){if(!Array.isArray(r.uint64Data))throw TypeError(".onnx.TensorProto.uint64Data: array expected");i.uint64Data=[];for(var a=0;a<r.uint64Data.length;++a)l.Long?(i.uint64Data[a]=l.Long.fromValue(r.uint64Data[a])).unsigned=!0:typeof r.uint64Data[a]=="string"?i.uint64Data[a]=parseInt(r.uint64Data[a],10):typeof r.uint64Data[a]=="number"?i.uint64Data[a]=r.uint64Data[a]:typeof r.uint64Data[a]=="object"&&(i.uint64Data[a]=new l.LongBits(r.uint64Data[a].low>>>0,r.uint64Data[a].high>>>0).toNumber(!0))}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dims=[],a.floatData=[],a.int32Data=[],a.stringData=[],a.int64Data=[],a.doubleData=[],a.uint64Data=[],a.externalData=[]),i.defaults&&(a.dataType=0,a.segment=null,a.name="",i.bytes===String?a.rawData="":(a.rawData=[],i.bytes!==Array&&(a.rawData=l.newBuffer(a.rawData))),a.docString="",a.dataLocation=i.enums===String?"DEFAULT":0),r.dims&&r.dims.length){a.dims=[];for(var p=0;p<r.dims.length;++p)typeof r.dims[p]=="number"?a.dims[p]=i.longs===String?String(r.dims[p]):r.dims[p]:a.dims[p]=i.longs===String?l.Long.prototype.toString.call(r.dims[p]):i.longs===Number?new l.LongBits(r.dims[p].low>>>0,r.dims[p].high>>>0).toNumber():r.dims[p]}if(r.dataType!=null&&r.hasOwnProperty("dataType")&&(a.dataType=r.dataType),r.segment!=null&&r.hasOwnProperty("segment")&&(a.segment=d.onnx.TensorProto.Segment.toObject(r.segment,i)),r.floatData&&r.floatData.length){a.floatData=[];for(var p=0;p<r.floatData.length;++p)a.floatData[p]=i.json&&!isFinite(r.floatData[p])?String(r.floatData[p]):r.floatData[p]}if(r.int32Data&&r.int32Data.length){a.int32Data=[];for(var p=0;p<r.int32Data.length;++p)a.int32Data[p]=r.int32Data[p]}if(r.stringData&&r.stringData.length){a.stringData=[];for(var p=0;p<r.stringData.length;++p)a.stringData[p]=i.bytes===String?l.base64.encode(r.stringData[p],0,r.stringData[p].length):i.bytes===Array?Array.prototype.slice.call(r.stringData[p]):r.stringData[p]}if(r.int64Data&&r.int64Data.length){a.int64Data=[];for(var p=0;p<r.int64Data.length;++p)typeof r.int64Data[p]=="number"?a.int64Data[p]=i.longs===String?String(r.int64Data[p]):r.int64Data[p]:a.int64Data[p]=i.longs===String?l.Long.prototype.toString.call(r.int64Data[p]):i.longs===Number?new l.LongBits(r.int64Data[p].low>>>0,r.int64Data[p].high>>>0).toNumber():r.int64Data[p]}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.rawData!=null&&r.hasOwnProperty("rawData")&&(a.rawData=i.bytes===String?l.base64.encode(r.rawData,0,r.rawData.length):i.bytes===Array?Array.prototype.slice.call(r.rawData):r.rawData),r.doubleData&&r.doubleData.length){a.doubleData=[];for(var p=0;p<r.doubleData.length;++p)a.doubleData[p]=i.json&&!isFinite(r.doubleData[p])?String(r.doubleData[p]):r.doubleData[p]}if(r.uint64Data&&r.uint64Data.length){a.uint64Data=[];for(var p=0;p<r.uint64Data.length;++p)typeof r.uint64Data[p]=="number"?a.uint64Data[p]=i.longs===String?String(r.uint64Data[p]):r.uint64Data[p]:a.uint64Data[p]=i.longs===String?l.Long.prototype.toString.call(r.uint64Data[p]):i.longs===Number?new l.LongBits(r.uint64Data[p].low>>>0,r.uint64Data[p].high>>>0).toNumber(!0):r.uint64Data[p]}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.externalData&&r.externalData.length){a.externalData=[];for(var p=0;p<r.externalData.length;++p)a.externalData[p]=d.onnx.StringStringEntryProto.toObject(r.externalData[p],i)}return r.dataLocation!=null&&r.hasOwnProperty("dataLocation")&&(a.dataLocation=i.enums===String?d.onnx.TensorProto.DataLocation[r.dataLocation]===void 0?r.dataLocation:d.onnx.TensorProto.DataLocation[r.dataLocation]:r.dataLocation),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorProto"},s.DataType=(function(){var r={},i=Object.create(r);return i[r[0]="UNDEFINED"]=0,i[r[1]="FLOAT"]=1,i[r[2]="UINT8"]=2,i[r[3]="INT8"]=3,i[r[4]="UINT16"]=4,i[r[5]="INT16"]=5,i[r[6]="INT32"]=6,i[r[7]="INT64"]=7,i[r[8]="STRING"]=8,i[r[9]="BOOL"]=9,i[r[10]="FLOAT16"]=10,i[r[11]="DOUBLE"]=11,i[r[12]="UINT32"]=12,i[r[13]="UINT64"]=13,i[r[14]="COMPLEX64"]=14,i[r[15]="COMPLEX128"]=15,i[r[16]="BFLOAT16"]=16,i[r[17]="FLOAT8E4M3FN"]=17,i[r[18]="FLOAT8E4M3FNUZ"]=18,i[r[19]="FLOAT8E5M2"]=19,i[r[20]="FLOAT8E5M2FNUZ"]=20,i})(),s.Segment=(function(){function r(i){if(i)for(var a=Object.keys(i),p=0;p<a.length;++p)i[a[p]]!=null&&(this[a[p]]=i[a[p]])}return r.prototype.begin=l.Long?l.Long.fromBits(0,0,!1):0,r.prototype.end=l.Long?l.Long.fromBits(0,0,!1):0,r.create=function(i){return new r(i)},r.encode=function(i,a){return a||(a=u.create()),i.begin!=null&&Object.hasOwnProperty.call(i,"begin")&&a.uint32(8).int64(i.begin),i.end!=null&&Object.hasOwnProperty.call(i,"end")&&a.uint32(16).int64(i.end),a},r.encodeDelimited=function(i,a){return this.encode(i,a).ldelim()},r.decode=function(i,a){i instanceof o||(i=o.create(i));for(var p=a===void 0?i.len:i.pos+a,h=new d.onnx.TensorProto.Segment;i.pos<p;){var m=i.uint32();switch(m>>>3){case 1:{h.begin=i.int64();break}case 2:{h.end=i.int64();break}default:i.skipType(m&7);break}}return h},r.decodeDelimited=function(i){return i instanceof o||(i=new o(i)),this.decode(i,i.uint32())},r.verify=function(i){return typeof i!="object"||i===null?"object expected":i.begin!=null&&i.hasOwnProperty("begin")&&!l.isInteger(i.begin)&&!(i.begin&&l.isInteger(i.begin.low)&&l.isInteger(i.begin.high))?"begin: integer|Long expected":i.end!=null&&i.hasOwnProperty("end")&&!l.isInteger(i.end)&&!(i.end&&l.isInteger(i.end.low)&&l.isInteger(i.end.high))?"end: integer|Long expected":null},r.fromObject=function(i){if(i instanceof d.onnx.TensorProto.Segment)return i;var a=new d.onnx.TensorProto.Segment;return i.begin!=null&&(l.Long?(a.begin=l.Long.fromValue(i.begin)).unsigned=!1:typeof i.begin=="string"?a.begin=parseInt(i.begin,10):typeof i.begin=="number"?a.begin=i.begin:typeof i.begin=="object"&&(a.begin=new l.LongBits(i.begin.low>>>0,i.begin.high>>>0).toNumber())),i.end!=null&&(l.Long?(a.end=l.Long.fromValue(i.end)).unsigned=!1:typeof i.end=="string"?a.end=parseInt(i.end,10):typeof i.end=="number"?a.end=i.end:typeof i.end=="object"&&(a.end=new l.LongBits(i.end.low>>>0,i.end.high>>>0).toNumber())),a},r.toObject=function(i,a){a||(a={});var p={};if(a.defaults){if(l.Long){var h=new l.Long(0,0,!1);p.begin=a.longs===String?h.toString():a.longs===Number?h.toNumber():h}else p.begin=a.longs===String?"0":0;if(l.Long){var h=new l.Long(0,0,!1);p.end=a.longs===String?h.toString():a.longs===Number?h.toNumber():h}else p.end=a.longs===String?"0":0}return i.begin!=null&&i.hasOwnProperty("begin")&&(typeof i.begin=="number"?p.begin=a.longs===String?String(i.begin):i.begin:p.begin=a.longs===String?l.Long.prototype.toString.call(i.begin):a.longs===Number?new l.LongBits(i.begin.low>>>0,i.begin.high>>>0).toNumber():i.begin),i.end!=null&&i.hasOwnProperty("end")&&(typeof i.end=="number"?p.end=a.longs===String?String(i.end):i.end:p.end=a.longs===String?l.Long.prototype.toString.call(i.end):a.longs===Number?new l.LongBits(i.end.low>>>0,i.end.high>>>0).toNumber():i.end),p},r.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},r.getTypeUrl=function(i){return i===void 0&&(i="type.googleapis.com"),i+"/onnx.TensorProto.Segment"},r})(),s.DataLocation=(function(){var r={},i=Object.create(r);return i[r[0]="DEFAULT"]=0,i[r[1]="EXTERNAL"]=1,i})(),s})(),c.SparseTensorProto=(function(){function s(r){if(this.dims=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.values=null,s.prototype.indices=null,s.prototype.dims=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.values!=null&&Object.hasOwnProperty.call(r,"values")&&d.onnx.TensorProto.encode(r.values,i.uint32(10).fork()).ldelim(),r.indices!=null&&Object.hasOwnProperty.call(r,"indices")&&d.onnx.TensorProto.encode(r.indices,i.uint32(18).fork()).ldelim(),r.dims!=null&&r.dims.length){i.uint32(26).fork();for(var a=0;a<r.dims.length;++a)i.int64(r.dims[a]);i.ldelim()}return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.SparseTensorProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.values=d.onnx.TensorProto.decode(r,r.uint32());break}case 2:{p.indices=d.onnx.TensorProto.decode(r,r.uint32());break}case 3:{if(p.dims&&p.dims.length||(p.dims=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.dims.push(r.int64());else p.dims.push(r.int64());break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.values!=null&&r.hasOwnProperty("values")){var i=d.onnx.TensorProto.verify(r.values);if(i)return"values."+i}if(r.indices!=null&&r.hasOwnProperty("indices")){var i=d.onnx.TensorProto.verify(r.indices);if(i)return"indices."+i}if(r.dims!=null&&r.hasOwnProperty("dims")){if(!Array.isArray(r.dims))return"dims: array expected";for(var a=0;a<r.dims.length;++a)if(!l.isInteger(r.dims[a])&&!(r.dims[a]&&l.isInteger(r.dims[a].low)&&l.isInteger(r.dims[a].high)))return"dims: integer|Long[] expected"}return null},s.fromObject=function(r){if(r instanceof d.onnx.SparseTensorProto)return r;var i=new d.onnx.SparseTensorProto;if(r.values!=null){if(typeof r.values!="object")throw TypeError(".onnx.SparseTensorProto.values: object expected");i.values=d.onnx.TensorProto.fromObject(r.values)}if(r.indices!=null){if(typeof r.indices!="object")throw TypeError(".onnx.SparseTensorProto.indices: object expected");i.indices=d.onnx.TensorProto.fromObject(r.indices)}if(r.dims){if(!Array.isArray(r.dims))throw TypeError(".onnx.SparseTensorProto.dims: array expected");i.dims=[];for(var a=0;a<r.dims.length;++a)l.Long?(i.dims[a]=l.Long.fromValue(r.dims[a])).unsigned=!1:typeof r.dims[a]=="string"?i.dims[a]=parseInt(r.dims[a],10):typeof r.dims[a]=="number"?i.dims[a]=r.dims[a]:typeof r.dims[a]=="object"&&(i.dims[a]=new l.LongBits(r.dims[a].low>>>0,r.dims[a].high>>>0).toNumber())}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dims=[]),i.defaults&&(a.values=null,a.indices=null),r.values!=null&&r.hasOwnProperty("values")&&(a.values=d.onnx.TensorProto.toObject(r.values,i)),r.indices!=null&&r.hasOwnProperty("indices")&&(a.indices=d.onnx.TensorProto.toObject(r.indices,i)),r.dims&&r.dims.length){a.dims=[];for(var p=0;p<r.dims.length;++p)typeof r.dims[p]=="number"?a.dims[p]=i.longs===String?String(r.dims[p]):r.dims[p]:a.dims[p]=i.longs===String?l.Long.prototype.toString.call(r.dims[p]):i.longs===Number?new l.LongBits(r.dims[p].low>>>0,r.dims[p].high>>>0).toNumber():r.dims[p]}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.SparseTensorProto"},s})(),c.TensorShapeProto=(function(){function s(r){if(this.dim=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.dim=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.dim!=null&&r.dim.length)for(var a=0;a<r.dim.length;++a)d.onnx.TensorShapeProto.Dimension.encode(r.dim[a],i.uint32(10).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorShapeProto;r.pos<a;){var h=r.uint32();h>>>3===1?(p.dim&&p.dim.length||(p.dim=[]),p.dim.push(d.onnx.TensorShapeProto.Dimension.decode(r,r.uint32()))):r.skipType(h&7)}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.dim!=null&&r.hasOwnProperty("dim")){if(!Array.isArray(r.dim))return"dim: array expected";for(var i=0;i<r.dim.length;++i){var a=d.onnx.TensorShapeProto.Dimension.verify(r.dim[i]);if(a)return"dim."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorShapeProto)return r;var i=new d.onnx.TensorShapeProto;if(r.dim){if(!Array.isArray(r.dim))throw TypeError(".onnx.TensorShapeProto.dim: array expected");i.dim=[];for(var a=0;a<r.dim.length;++a){if(typeof r.dim[a]!="object")throw TypeError(".onnx.TensorShapeProto.dim: object expected");i.dim[a]=d.onnx.TensorShapeProto.Dimension.fromObject(r.dim[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dim=[]),r.dim&&r.dim.length){a.dim=[];for(var p=0;p<r.dim.length;++p)a.dim[p]=d.onnx.TensorShapeProto.Dimension.toObject(r.dim[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorShapeProto"},s.Dimension=(function(){function r(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}r.prototype.dimValue=null,r.prototype.dimParam=null,r.prototype.denotation="";var i;return Object.defineProperty(r.prototype,"value",{get:l.oneOfGetter(i=["dimValue","dimParam"]),set:l.oneOfSetter(i)}),r.create=function(a){return new r(a)},r.encode=function(a,p){return p||(p=u.create()),a.dimValue!=null&&Object.hasOwnProperty.call(a,"dimValue")&&p.uint32(8).int64(a.dimValue),a.dimParam!=null&&Object.hasOwnProperty.call(a,"dimParam")&&p.uint32(18).string(a.dimParam),a.denotation!=null&&Object.hasOwnProperty.call(a,"denotation")&&p.uint32(26).string(a.denotation),p},r.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},r.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TensorShapeProto.Dimension;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.dimValue=a.int64();break}case 2:{m.dimParam=a.string();break}case 3:{m.denotation=a.string();break}default:a.skipType(b&7);break}}return m},r.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},r.verify=function(a){if(typeof a!="object"||a===null)return"object expected";var p={};if(a.dimValue!=null&&a.hasOwnProperty("dimValue")&&(p.value=1,!l.isInteger(a.dimValue)&&!(a.dimValue&&l.isInteger(a.dimValue.low)&&l.isInteger(a.dimValue.high))))return"dimValue: integer|Long expected";if(a.dimParam!=null&&a.hasOwnProperty("dimParam")){if(p.value===1)return"value: multiple values";if(p.value=1,!l.isString(a.dimParam))return"dimParam: string expected"}return a.denotation!=null&&a.hasOwnProperty("denotation")&&!l.isString(a.denotation)?"denotation: string expected":null},r.fromObject=function(a){if(a instanceof d.onnx.TensorShapeProto.Dimension)return a;var p=new d.onnx.TensorShapeProto.Dimension;return a.dimValue!=null&&(l.Long?(p.dimValue=l.Long.fromValue(a.dimValue)).unsigned=!1:typeof a.dimValue=="string"?p.dimValue=parseInt(a.dimValue,10):typeof a.dimValue=="number"?p.dimValue=a.dimValue:typeof a.dimValue=="object"&&(p.dimValue=new l.LongBits(a.dimValue.low>>>0,a.dimValue.high>>>0).toNumber())),a.dimParam!=null&&(p.dimParam=String(a.dimParam)),a.denotation!=null&&(p.denotation=String(a.denotation)),p},r.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.denotation=""),a.dimValue!=null&&a.hasOwnProperty("dimValue")&&(typeof a.dimValue=="number"?h.dimValue=p.longs===String?String(a.dimValue):a.dimValue:h.dimValue=p.longs===String?l.Long.prototype.toString.call(a.dimValue):p.longs===Number?new l.LongBits(a.dimValue.low>>>0,a.dimValue.high>>>0).toNumber():a.dimValue,p.oneofs&&(h.value="dimValue")),a.dimParam!=null&&a.hasOwnProperty("dimParam")&&(h.dimParam=a.dimParam,p.oneofs&&(h.value="dimParam")),a.denotation!=null&&a.hasOwnProperty("denotation")&&(h.denotation=a.denotation),h},r.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},r.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TensorShapeProto.Dimension"},r})(),s})(),c.TypeProto=(function(){function s(i){if(i)for(var a=Object.keys(i),p=0;p<a.length;++p)i[a[p]]!=null&&(this[a[p]]=i[a[p]])}s.prototype.tensorType=null,s.prototype.sequenceType=null,s.prototype.mapType=null,s.prototype.optionalType=null,s.prototype.sparseTensorType=null,s.prototype.denotation="";var r;return Object.defineProperty(s.prototype,"value",{get:l.oneOfGetter(r=["tensorType","sequenceType","mapType","optionalType","sparseTensorType"]),set:l.oneOfSetter(r)}),s.create=function(i){return new s(i)},s.encode=function(i,a){return a||(a=u.create()),i.tensorType!=null&&Object.hasOwnProperty.call(i,"tensorType")&&d.onnx.TypeProto.Tensor.encode(i.tensorType,a.uint32(10).fork()).ldelim(),i.sequenceType!=null&&Object.hasOwnProperty.call(i,"sequenceType")&&d.onnx.TypeProto.Sequence.encode(i.sequenceType,a.uint32(34).fork()).ldelim(),i.mapType!=null&&Object.hasOwnProperty.call(i,"mapType")&&d.onnx.TypeProto.Map.encode(i.mapType,a.uint32(42).fork()).ldelim(),i.denotation!=null&&Object.hasOwnProperty.call(i,"denotation")&&a.uint32(50).string(i.denotation),i.sparseTensorType!=null&&Object.hasOwnProperty.call(i,"sparseTensorType")&&d.onnx.TypeProto.SparseTensor.encode(i.sparseTensorType,a.uint32(66).fork()).ldelim(),i.optionalType!=null&&Object.hasOwnProperty.call(i,"optionalType")&&d.onnx.TypeProto.Optional.encode(i.optionalType,a.uint32(74).fork()).ldelim(),a},s.encodeDelimited=function(i,a){return this.encode(i,a).ldelim()},s.decode=function(i,a){i instanceof o||(i=o.create(i));for(var p=a===void 0?i.len:i.pos+a,h=new d.onnx.TypeProto;i.pos<p;){var m=i.uint32();switch(m>>>3){case 1:{h.tensorType=d.onnx.TypeProto.Tensor.decode(i,i.uint32());break}case 4:{h.sequenceType=d.onnx.TypeProto.Sequence.decode(i,i.uint32());break}case 5:{h.mapType=d.onnx.TypeProto.Map.decode(i,i.uint32());break}case 9:{h.optionalType=d.onnx.TypeProto.Optional.decode(i,i.uint32());break}case 8:{h.sparseTensorType=d.onnx.TypeProto.SparseTensor.decode(i,i.uint32());break}case 6:{h.denotation=i.string();break}default:i.skipType(m&7);break}}return h},s.decodeDelimited=function(i){return i instanceof o||(i=new o(i)),this.decode(i,i.uint32())},s.verify=function(i){if(typeof i!="object"||i===null)return"object expected";var a={};if(i.tensorType!=null&&i.hasOwnProperty("tensorType")){a.value=1;{var p=d.onnx.TypeProto.Tensor.verify(i.tensorType);if(p)return"tensorType."+p}}if(i.sequenceType!=null&&i.hasOwnProperty("sequenceType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Sequence.verify(i.sequenceType);if(p)return"sequenceType."+p}}if(i.mapType!=null&&i.hasOwnProperty("mapType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Map.verify(i.mapType);if(p)return"mapType."+p}}if(i.optionalType!=null&&i.hasOwnProperty("optionalType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Optional.verify(i.optionalType);if(p)return"optionalType."+p}}if(i.sparseTensorType!=null&&i.hasOwnProperty("sparseTensorType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.SparseTensor.verify(i.sparseTensorType);if(p)return"sparseTensorType."+p}}return i.denotation!=null&&i.hasOwnProperty("denotation")&&!l.isString(i.denotation)?"denotation: string expected":null},s.fromObject=function(i){if(i instanceof d.onnx.TypeProto)return i;var a=new d.onnx.TypeProto;if(i.tensorType!=null){if(typeof i.tensorType!="object")throw TypeError(".onnx.TypeProto.tensorType: object expected");a.tensorType=d.onnx.TypeProto.Tensor.fromObject(i.tensorType)}if(i.sequenceType!=null){if(typeof i.sequenceType!="object")throw TypeError(".onnx.TypeProto.sequenceType: object expected");a.sequenceType=d.onnx.TypeProto.Sequence.fromObject(i.sequenceType)}if(i.mapType!=null){if(typeof i.mapType!="object")throw TypeError(".onnx.TypeProto.mapType: object expected");a.mapType=d.onnx.TypeProto.Map.fromObject(i.mapType)}if(i.optionalType!=null){if(typeof i.optionalType!="object")throw TypeError(".onnx.TypeProto.optionalType: object expected");a.optionalType=d.onnx.TypeProto.Optional.fromObject(i.optionalType)}if(i.sparseTensorType!=null){if(typeof i.sparseTensorType!="object")throw TypeError(".onnx.TypeProto.sparseTensorType: object expected");a.sparseTensorType=d.onnx.TypeProto.SparseTensor.fromObject(i.sparseTensorType)}return i.denotation!=null&&(a.denotation=String(i.denotation)),a},s.toObject=function(i,a){a||(a={});var p={};return a.defaults&&(p.denotation=""),i.tensorType!=null&&i.hasOwnProperty("tensorType")&&(p.tensorType=d.onnx.TypeProto.Tensor.toObject(i.tensorType,a),a.oneofs&&(p.value="tensorType")),i.sequenceType!=null&&i.hasOwnProperty("sequenceType")&&(p.sequenceType=d.onnx.TypeProto.Sequence.toObject(i.sequenceType,a),a.oneofs&&(p.value="sequenceType")),i.mapType!=null&&i.hasOwnProperty("mapType")&&(p.mapType=d.onnx.TypeProto.Map.toObject(i.mapType,a),a.oneofs&&(p.value="mapType")),i.denotation!=null&&i.hasOwnProperty("denotation")&&(p.denotation=i.denotation),i.sparseTensorType!=null&&i.hasOwnProperty("sparseTensorType")&&(p.sparseTensorType=d.onnx.TypeProto.SparseTensor.toObject(i.sparseTensorType,a),a.oneofs&&(p.value="sparseTensorType")),i.optionalType!=null&&i.hasOwnProperty("optionalType")&&(p.optionalType=d.onnx.TypeProto.Optional.toObject(i.optionalType,a),a.oneofs&&(p.value="optionalType")),p},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(i){return i===void 0&&(i="type.googleapis.com"),i+"/onnx.TypeProto"},s.Tensor=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=0,i.prototype.shape=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&p.uint32(8).int32(a.elemType),a.shape!=null&&Object.hasOwnProperty.call(a,"shape")&&d.onnx.TensorShapeProto.encode(a.shape,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Tensor;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.elemType=a.int32();break}case 2:{m.shape=d.onnx.TensorShapeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")&&!l.isInteger(a.elemType))return"elemType: integer expected";if(a.shape!=null&&a.hasOwnProperty("shape")){var p=d.onnx.TensorShapeProto.verify(a.shape);if(p)return"shape."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Tensor)return a;var p=new d.onnx.TypeProto.Tensor;if(a.elemType!=null&&(p.elemType=a.elemType|0),a.shape!=null){if(typeof a.shape!="object")throw TypeError(".onnx.TypeProto.Tensor.shape: object expected");p.shape=d.onnx.TensorShapeProto.fromObject(a.shape)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=0,h.shape=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=a.elemType),a.shape!=null&&a.hasOwnProperty("shape")&&(h.shape=d.onnx.TensorShapeProto.toObject(a.shape,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Tensor"},i})(),s.Sequence=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&d.onnx.TypeProto.encode(a.elemType,p.uint32(10).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Sequence;a.pos<h;){var b=a.uint32();b>>>3===1?m.elemType=d.onnx.TypeProto.decode(a,a.uint32()):a.skipType(b&7)}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")){var p=d.onnx.TypeProto.verify(a.elemType);if(p)return"elemType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Sequence)return a;var p=new d.onnx.TypeProto.Sequence;if(a.elemType!=null){if(typeof a.elemType!="object")throw TypeError(".onnx.TypeProto.Sequence.elemType: object expected");p.elemType=d.onnx.TypeProto.fromObject(a.elemType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=d.onnx.TypeProto.toObject(a.elemType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Sequence"},i})(),s.Map=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.keyType=0,i.prototype.valueType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.keyType!=null&&Object.hasOwnProperty.call(a,"keyType")&&p.uint32(8).int32(a.keyType),a.valueType!=null&&Object.hasOwnProperty.call(a,"valueType")&&d.onnx.TypeProto.encode(a.valueType,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Map;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.keyType=a.int32();break}case 2:{m.valueType=d.onnx.TypeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.keyType!=null&&a.hasOwnProperty("keyType")&&!l.isInteger(a.keyType))return"keyType: integer expected";if(a.valueType!=null&&a.hasOwnProperty("valueType")){var p=d.onnx.TypeProto.verify(a.valueType);if(p)return"valueType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Map)return a;var p=new d.onnx.TypeProto.Map;if(a.keyType!=null&&(p.keyType=a.keyType|0),a.valueType!=null){if(typeof a.valueType!="object")throw TypeError(".onnx.TypeProto.Map.valueType: object expected");p.valueType=d.onnx.TypeProto.fromObject(a.valueType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.keyType=0,h.valueType=null),a.keyType!=null&&a.hasOwnProperty("keyType")&&(h.keyType=a.keyType),a.valueType!=null&&a.hasOwnProperty("valueType")&&(h.valueType=d.onnx.TypeProto.toObject(a.valueType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Map"},i})(),s.Optional=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&d.onnx.TypeProto.encode(a.elemType,p.uint32(10).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Optional;a.pos<h;){var b=a.uint32();b>>>3===1?m.elemType=d.onnx.TypeProto.decode(a,a.uint32()):a.skipType(b&7)}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")){var p=d.onnx.TypeProto.verify(a.elemType);if(p)return"elemType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Optional)return a;var p=new d.onnx.TypeProto.Optional;if(a.elemType!=null){if(typeof a.elemType!="object")throw TypeError(".onnx.TypeProto.Optional.elemType: object expected");p.elemType=d.onnx.TypeProto.fromObject(a.elemType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=d.onnx.TypeProto.toObject(a.elemType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Optional"},i})(),s.SparseTensor=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=0,i.prototype.shape=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&p.uint32(8).int32(a.elemType),a.shape!=null&&Object.hasOwnProperty.call(a,"shape")&&d.onnx.TensorShapeProto.encode(a.shape,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.SparseTensor;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.elemType=a.int32();break}case 2:{m.shape=d.onnx.TensorShapeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")&&!l.isInteger(a.elemType))return"elemType: integer expected";if(a.shape!=null&&a.hasOwnProperty("shape")){var p=d.onnx.TensorShapeProto.verify(a.shape);if(p)return"shape."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.SparseTensor)return a;var p=new d.onnx.TypeProto.SparseTensor;if(a.elemType!=null&&(p.elemType=a.elemType|0),a.shape!=null){if(typeof a.shape!="object")throw TypeError(".onnx.TypeProto.SparseTensor.shape: object expected");p.shape=d.onnx.TensorShapeProto.fromObject(a.shape)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=0,h.shape=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=a.elemType),a.shape!=null&&a.hasOwnProperty("shape")&&(h.shape=d.onnx.TensorShapeProto.toObject(a.shape,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.SparseTensor"},i})(),s})(),c.OperatorSetIdProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.domain="",s.prototype.version=l.Long?l.Long.fromBits(0,0,!1):0,s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(10).string(r.domain),r.version!=null&&Object.hasOwnProperty.call(r,"version")&&i.uint32(16).int64(r.version),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.OperatorSetIdProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.domain=r.string();break}case 2:{p.version=r.int64();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){return typeof r!="object"||r===null?"object expected":r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain)?"domain: string expected":r.version!=null&&r.hasOwnProperty("version")&&!l.isInteger(r.version)&&!(r.version&&l.isInteger(r.version.low)&&l.isInteger(r.version.high))?"version: integer|Long expected":null},s.fromObject=function(r){if(r instanceof d.onnx.OperatorSetIdProto)return r;var i=new d.onnx.OperatorSetIdProto;return r.domain!=null&&(i.domain=String(r.domain)),r.version!=null&&(l.Long?(i.version=l.Long.fromValue(r.version)).unsigned=!1:typeof r.version=="string"?i.version=parseInt(r.version,10):typeof r.version=="number"?i.version=r.version:typeof r.version=="object"&&(i.version=new l.LongBits(r.version.low>>>0,r.version.high>>>0).toNumber())),i},s.toObject=function(r,i){i||(i={});var a={};if(i.defaults)if(a.domain="",l.Long){var p=new l.Long(0,0,!1);a.version=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.version=i.longs===String?"0":0;return r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.version!=null&&r.hasOwnProperty("version")&&(typeof r.version=="number"?a.version=i.longs===String?String(r.version):r.version:a.version=i.longs===String?l.Long.prototype.toString.call(r.version):i.longs===Number?new l.LongBits(r.version.low>>>0,r.version.high>>>0).toNumber():r.version),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.OperatorSetIdProto"},s})(),c.OperatorStatus=(function(){var s={},r=Object.create(s);return r[s[0]="EXPERIMENTAL"]=0,r[s[1]="STABLE"]=1,r})(),c.FunctionProto=(function(){function s(r){if(this.input=[],this.output=[],this.attribute=[],this.attributeProto=[],this.node=[],this.opsetImport=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.attribute=l.emptyArray,s.prototype.attributeProto=l.emptyArray,s.prototype.node=l.emptyArray,s.prototype.docString="",s.prototype.opsetImport=l.emptyArray,s.prototype.domain="",s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)i.uint32(34).string(r.input[a]);if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)i.uint32(42).string(r.output[a]);if(r.attribute!=null&&r.attribute.length)for(var a=0;a<r.attribute.length;++a)i.uint32(50).string(r.attribute[a]);if(r.node!=null&&r.node.length)for(var a=0;a<r.node.length;++a)d.onnx.NodeProto.encode(r.node[a],i.uint32(58).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(66).string(r.docString),r.opsetImport!=null&&r.opsetImport.length)for(var a=0;a<r.opsetImport.length;++a)d.onnx.OperatorSetIdProto.encode(r.opsetImport[a],i.uint32(74).fork()).ldelim();if(r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(82).string(r.domain),r.attributeProto!=null&&r.attributeProto.length)for(var a=0;a<r.attributeProto.length;++a)d.onnx.AttributeProto.encode(r.attributeProto[a],i.uint32(90).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.FunctionProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 4:{p.input&&p.input.length||(p.input=[]),p.input.push(r.string());break}case 5:{p.output&&p.output.length||(p.output=[]),p.output.push(r.string());break}case 6:{p.attribute&&p.attribute.length||(p.attribute=[]),p.attribute.push(r.string());break}case 11:{p.attributeProto&&p.attributeProto.length||(p.attributeProto=[]),p.attributeProto.push(d.onnx.AttributeProto.decode(r,r.uint32()));break}case 7:{p.node&&p.node.length||(p.node=[]),p.node.push(d.onnx.NodeProto.decode(r,r.uint32()));break}case 8:{p.docString=r.string();break}case 9:{p.opsetImport&&p.opsetImport.length||(p.opsetImport=[]),p.opsetImport.push(d.onnx.OperatorSetIdProto.decode(r,r.uint32()));break}case 10:{p.domain=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i)if(!l.isString(r.input[i]))return"input: string[] expected"}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i)if(!l.isString(r.output[i]))return"output: string[] expected"}if(r.attribute!=null&&r.hasOwnProperty("attribute")){if(!Array.isArray(r.attribute))return"attribute: array expected";for(var i=0;i<r.attribute.length;++i)if(!l.isString(r.attribute[i]))return"attribute: string[] expected"}if(r.attributeProto!=null&&r.hasOwnProperty("attributeProto")){if(!Array.isArray(r.attributeProto))return"attributeProto: array expected";for(var i=0;i<r.attributeProto.length;++i){var a=d.onnx.AttributeProto.verify(r.attributeProto[i]);if(a)return"attributeProto."+a}}if(r.node!=null&&r.hasOwnProperty("node")){if(!Array.isArray(r.node))return"node: array expected";for(var i=0;i<r.node.length;++i){var a=d.onnx.NodeProto.verify(r.node[i]);if(a)return"node."+a}}if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.opsetImport!=null&&r.hasOwnProperty("opsetImport")){if(!Array.isArray(r.opsetImport))return"opsetImport: array expected";for(var i=0;i<r.opsetImport.length;++i){var a=d.onnx.OperatorSetIdProto.verify(r.opsetImport[i]);if(a)return"opsetImport."+a}}return r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain)?"domain: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.FunctionProto)return r;var i=new d.onnx.FunctionProto;if(r.name!=null&&(i.name=String(r.name)),r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.FunctionProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a)i.input[a]=String(r.input[a])}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.FunctionProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a)i.output[a]=String(r.output[a])}if(r.attribute){if(!Array.isArray(r.attribute))throw TypeError(".onnx.FunctionProto.attribute: array expected");i.attribute=[];for(var a=0;a<r.attribute.length;++a)i.attribute[a]=String(r.attribute[a])}if(r.attributeProto){if(!Array.isArray(r.attributeProto))throw TypeError(".onnx.FunctionProto.attributeProto: array expected");i.attributeProto=[];for(var a=0;a<r.attributeProto.length;++a){if(typeof r.attributeProto[a]!="object")throw TypeError(".onnx.FunctionProto.attributeProto: object expected");i.attributeProto[a]=d.onnx.AttributeProto.fromObject(r.attributeProto[a])}}if(r.node){if(!Array.isArray(r.node))throw TypeError(".onnx.FunctionProto.node: array expected");i.node=[];for(var a=0;a<r.node.length;++a){if(typeof r.node[a]!="object")throw TypeError(".onnx.FunctionProto.node: object expected");i.node[a]=d.onnx.NodeProto.fromObject(r.node[a])}}if(r.docString!=null&&(i.docString=String(r.docString)),r.opsetImport){if(!Array.isArray(r.opsetImport))throw TypeError(".onnx.FunctionProto.opsetImport: array expected");i.opsetImport=[];for(var a=0;a<r.opsetImport.length;++a){if(typeof r.opsetImport[a]!="object")throw TypeError(".onnx.FunctionProto.opsetImport: object expected");i.opsetImport[a]=d.onnx.OperatorSetIdProto.fromObject(r.opsetImport[a])}}return r.domain!=null&&(i.domain=String(r.domain)),i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.input=[],a.output=[],a.attribute=[],a.node=[],a.opsetImport=[],a.attributeProto=[]),i.defaults&&(a.name="",a.docString="",a.domain=""),r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=r.input[p]}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=r.output[p]}if(r.attribute&&r.attribute.length){a.attribute=[];for(var p=0;p<r.attribute.length;++p)a.attribute[p]=r.attribute[p]}if(r.node&&r.node.length){a.node=[];for(var p=0;p<r.node.length;++p)a.node[p]=d.onnx.NodeProto.toObject(r.node[p],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.opsetImport&&r.opsetImport.length){a.opsetImport=[];for(var p=0;p<r.opsetImport.length;++p)a.opsetImport[p]=d.onnx.OperatorSetIdProto.toObject(r.opsetImport[p],i)}if(r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.attributeProto&&r.attributeProto.length){a.attributeProto=[];for(var p=0;p<r.attributeProto.length;++p)a.attributeProto[p]=d.onnx.AttributeProto.toObject(r.attributeProto[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.FunctionProto"},s})(),c})(),t.exports=d});function xo(e,t){if(!e)throw new Error(typeof t=="string"?t:t())}function ku(e){return new TextDecoder().decode(e)}var ze,di,vp,qt,k0,ht,Ut,he,Cu,$o,xi,$i,ke=R(()=>{"use strict";Ly(),ze=ce(Ii()),En(),di=class{static arraysEqual(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}},vp=class{static preprocessInputShapes(e,t){let n=e.length===1?[1,e[0]]:e,o=t.length===1?[t[0],1]:t;return[n,o]}static postprocessOutputShape(e,t,n){t===1&&e.splice(e.length-2,1),n===1&&e.pop()}static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},qt=class ci{static calcShape(t,n,o=!1){let u=t.length,l=n.length;if(u===0)return n;if(l===0)return t;let d=Math.max(t.length,n.length),c=new Array(d);if(o){if(u<2||l<2)return;let s=vp.calcMatMulShape([t[u-2],t[u-1]],[n[l-2],n[l-1]]);if(s===void 0)return;[c[d-2],c[d-1]]=s}for(let s=o?3:1;s<=d;s++){let r=u-s<0?1:t[u-s],i=l-s<0?1:n[l-s];if(r!==i&&r>1&&i>1)return;c[d-s]=Math.max(r,i)}return c}static index(t,n){let o=new Array(n.length);return ci.fillIndex(t,n,o),o}static fillIndex(t,n,o){let u=t.length-n.length;for(let l=0;l<n.length;l++)o[l]=t[u+l]%n[l]}static calc(t,n,o,u,l){let d=ci.calcShape(t.dims,n.dims);if(d){if(u&&!he.areEqual(d,t.dims))return;let c=he.size(d),s=u?t:new gt(d,l||t.type);if(d.length===0)s.set([],o(t.get([]),n.get([])));else{let r=new Array(d.length),i=new Array(t.dims.length),a=new Array(n.dims.length),p=0,h=0,m=!1,b=!1;t.dims.length===0&&(p=t.get([]),m=!0),n.dims.length===0&&(h=n.get([]),b=!0);let x;for(let _=0;_<c;_++){x=_;for(let y=d.length-1;y>=0;y--)r[y]=x%d[y],x=Math.floor(x/d[y]);m||(ci.fillIndex(r,t.dims,i),p=t.get(i)),b||(ci.fillIndex(r,n.dims,a),h=n.get(a)),s.set(r,o(p,h))}}return s}}static isValidBroadcast(t,n){let o=t.length,u=n.length;if(o>u)return!1;for(let l=1;l<=o;l++)if(t[o-l]!==1&&t[o-l]!==n[u-l])return!1;return!0}static getBroadcastDims(t,n){let o=t.length,u=[];for(let l=0;l<o;l++){let d=o-1-l,c=t[d]||1;(n[n.length-1-l]||1)>1&&c===1&&u.unshift(d)}return u}},k0=class{static getShapeOfGemmResult(e,t,n,o,u){if(e.length!==2||n.length!==2)throw new Error("shape need to be of size 2");let l,d,c;t?(l=e[1],d=e[0]):(l=e[0],d=e[1]);let s=-1;if(o?(c=n[0],s=1):(c=n[1],s=0),n[s]!==d)throw new Error("dimension mismatch");if(l<=0||c<=0||d<=0)throw new Error("invalid shape specified");if(u&&!qt.isValidBroadcast(u,[l,c]))throw new Error("gemm: invalid bias shape for broadcast");return[l,c,d]}},ht=class Du{static tensorDataTypeFromProto(t){switch(t){case ze.onnx.TensorProto.DataType.INT8:return"int8";case ze.onnx.TensorProto.DataType.UINT8:return"uint8";case ze.onnx.TensorProto.DataType.BOOL:return"bool";case ze.onnx.TensorProto.DataType.INT16:return"int16";case ze.onnx.TensorProto.DataType.UINT16:return"uint16";case ze.onnx.TensorProto.DataType.INT32:return"int32";case ze.onnx.TensorProto.DataType.UINT32:return"uint32";case ze.onnx.TensorProto.DataType.FLOAT:return"float32";case ze.onnx.TensorProto.DataType.DOUBLE:return"float64";case ze.onnx.TensorProto.DataType.STRING:return"string";case ze.onnx.TensorProto.DataType.INT64:return"int32";case ze.onnx.TensorProto.DataType.UINT64:return"uint32";default:throw new Error(`unsupported data type: ${ze.onnx.TensorProto.DataType[t]}`)}}static tensorDataTypeStringToEnum(t){switch(t){case"int8":return ze.onnx.TensorProto.DataType.INT8;case"uint8":return ze.onnx.TensorProto.DataType.UINT8;case"bool":return ze.onnx.TensorProto.DataType.BOOL;case"int16":return ze.onnx.TensorProto.DataType.INT16;case"uint16":return ze.onnx.TensorProto.DataType.UINT16;case"int32":return ze.onnx.TensorProto.DataType.INT32;case"uint32":return ze.onnx.TensorProto.DataType.UINT32;case"float32":return ze.onnx.TensorProto.DataType.FLOAT;case"float64":return ze.onnx.TensorProto.DataType.DOUBLE;case"string":return ze.onnx.TensorProto.DataType.STRING;case"int64":return ze.onnx.TensorProto.DataType.INT64;case"uint64":return ze.onnx.TensorProto.DataType.UINT64;default:throw new Error(`unsupported data type: ${t}`)}}static tensorDimsFromProto(t){return t.map(n=>nn.isLong(n)?n.toNumber():n)}static tensorValueTypeFromProto(t){return{tensorType:Du.tensorDataTypeFromProto(t.elemType),shape:{dims:Du.tensorDimsFromProto(t.shape.dim.map(n=>n.dimValue))}}}static tensorDimsFromORTFormat(t){let n=[];for(let o=0;o<t.dimsLength();o++)n.push(Ut.longToNumber(t.dims(o)));return n}static tensorAttributesFromORTFormat(t){let n=[];for(let o=0;o<t.attributesLength();o++)n.push(t.attributes(o));return n}},Ut=class{static longToNumber(e){return nn.isLong(e)?e.toNumber():typeof e=="bigint"?Number(e):e}static isLong(e){return nn.isLong(e)||typeof e=="bigint"}},he=class mr{static size(t){return mr.getSizeFromDimensionRange(t,0,t.length)}static sizeFromDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return mr.getSizeFromDimensionRange(t,n,t.length)}static sizeToDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeToDimension as Tensor has ${t.length} dimensions.`);return mr.getSizeFromDimensionRange(t,0,n)}static getSizeFromDimensionRange(t,n,o){let u=1;for(let l=n;l<o;l++){if(t[l]<=0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains 0 or negative values in them.");u*=t[l]}return u}static computeStrides(t){let n=t.length;if(n===0)return[];if(n===1)return[1];let o=new Array(n);o[n-1]=1,o[n-2]=t[n-1];for(let u=n-3;u>=0;--u)o[u]=o[u+1]*t[u+1];return o}static transpose(t){return t.slice().reverse()}static indicesToOffset(t,n,o){o===void 0&&(o=t.length);let u=0;for(let l=0;l<o;++l)u+=n[l]*t[l];return u}static offsetToIndices(t,n){let o=n.length;if(o===0)return[];if(o===1)return[t*n[0]];let u=new Array(n.length);for(let l=0;l<u.length-1;++l)u[l]=Math.floor(t/n[l]),t-=u[l]*n[l];return u[u.length-1]=t,u}static normalizeAxis(t,n){if(t<-n&&t>=n)throw new Error("unsupported axis for this operation.");return t<0?t+n:t}static normalizeAxes(t,n){return t.map(o=>this.normalizeAxis(o,n))}static incrementIndex(t,n,o){if(n.length===0||t.length===0)throw new Error("Index incrementing unsupported for scalar Tensor");if(o===void 0)o=n.length;else if(o<=0||o>n.length)throw new Error("Incorrect axis to increment on");for(let u=o-1;u>=0&&(t[u]++,!(t[u]<n[u]));--u)t[u]=0}static calculateReshapedDims(t,n){if(n.length===0){if(t.length===0||mr.size(t)===1)return[];throw new Error("cannot reshape to a scalar Tensor")}let o=n.length,u=new Array(o),l=-1,d=1;for(let s=0;s<o;s++){if(n[s]<-1)throw new Error("a dimension in shape hints cannot be less than -1");if(n[s]===-1){if(l!==-1)throw new Error("at most one dimension in shape hints can be -1");l=s}else{if(n[s]===0){if(s>=t.length)throw new Error("the dimension with value zero exceeds the dimension size of the input tensor");u[s]=t[s]}else u[s]=n[s];d*=u[s]}}let c=mr.size(t);if(l!==-1){if(c%d!==0)throw new Error(`the input tensor cannot be reshaped to the requested shape. Input shape: [${t}] Output shape: [${n}]`);u[l]=c/d}else if(d!==c)throw new Error("reshapedDims and originalDims don't have matching sizes");return u}static sortBasedOnPerm(t,n){return n?n.map(o=>t[o]):t.slice().reverse()}static padShape(t,n){let o=t.length;return t.map((u,l)=>u+n[l]+n[l+o])}static areEqual(t,n){return t.length!==n.length?!1:t.every((o,u)=>o===n[u])}static validateDimsAndCalcSize(t){if(t.length>6)throw new TypeError("Only rank 0 to 6 is supported for tensor shape.");let n=1;for(let o of t){if(!Number.isInteger(o))throw new TypeError(`Invalid shape: ${o} is not an integer`);if(o<0||o>2147483647)throw new TypeError(`Invalid shape: length ${o} is not allowed`);n*=o}return n}static flattenShape(t,n){n<0&&(n+=t.length);let o=t.reduce((l,d)=>l*d,1),u=t.slice(n).reduce((l,d)=>l*d,1);return[o/u,u]}static squeezeShape(t,n){let o=new Array;n=mr.normalizeAxes(n,t.length);for(let u=0;u<t.length;u++){let l=n.indexOf(u)>=0;if(l&&t[u]!==1)throw new Error("squeeze an axis of size different than 1");(n.length===0&&t[u]>1||n.length>0&&!l)&&o.push(t[u])}return o}static unsqueezeShape(t,n){let o=new Array(t.length+n.length);o.fill(0);for(let l=0;l<n.length;l++){let d=mr.normalizeAxis(n[l],o.length);if(d>=o.length)throw new Error("'axes' has an out of range axis");if(o[d]!==0)throw new Error("'axes' has a duplicate axis");o[d]=1}let u=0;for(let l=0;l<o.length;l++)o[l]===0&&(o[l]=t[u++]);if(u!==t.length)throw new Error("the unsqueezed dimension could not be established");return o}},Cu=class C0{static splitShape(t,n,o,u){if(o.length===0){if(!u)throw new Error("need to know number of outputs when the 'split' attribute is not specified");C0.determineSplit(t[n],u,o)}let l=[],d=[0];for(let c=0;c<o.length;++c){c!==0&&d.push(d[c-1]+o[c-1]);let s=t.slice();s[n]=o[c],l.push(s)}return[l,d]}static determineSplit(t,n,o){if(t%n!==0)throw new Error("cannot split tensor to equal sized parts");for(let u=0;u<n;++u)o.push(t/n)}},$o=class gr{static adjustPoolAttributes(t,n,o,u,l,d){if(!t&&o.length!==n.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let c=0;c<n.length-2;c++)c>=o.length?o.push(n[c+2]):o[c]=n[c+2];for(let c=0;c<o.length;c++)if(c<u.length){if(u[c]<0)throw new Error("strides should be greater than or equal to 1")}else u.push(1);for(let c=0;c<o.length;c++)if(c<l.length){if(l[c]<0)throw new Error("dilations should be greater than or equal to 1")}else l.push(1);for(let c=0;c<o.length*2;c++)if(c<d.length){if(d[c]<0)throw new Error("pad should be greater than or equal to 1")}else d.push(0);for(let c=0;c<o.length;c++){if(o[c]<=0)throw new Error("kernel shapes need to be greater than 0");if(d[c]>=o[c]||d[c+o.length]>=o[c])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,n,o,u,l,d){if(d){if(l.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(u.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let c=0;c<t.length-2;c++)gr.adjustPadAndReturnShape(t[c+2],n[c],o[c],u[c],l,c,c+t.length-2,d)}}static computePoolOutputShape(t,n,o,u,l,d,c,s=0){if(n.length<=0)throw new Error("input shape must be of size greater than 0");let r=[n[0],n[1]];return gr.computeShapeHelper(t,n,r,o,u,l,d,c,s),r}static computeConvOutputShape(t,n,o,u,l,d,c){if(t.length<=0||n.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let s=[t[0],n[0]];return gr.computeShapeHelper(!1,t,s,o,u,l,d,c),s}static computeShapeHelper(t,n,o,u,l,d,c,s,r=0){if(t)for(let i=0;i<n.length-2;i++)o.push(1);else for(let i=0;i<n.length-2;i++)o.push(gr.adjustPadAndReturnShape(n[i+2],u[i],l[i],d[i],c,i,i+n.length-2,s,r))}static computeOutputSize(t,n,o,u,l){let d=Math.floor(t/n)+1;return l===1&&(d=Math.ceil(t/n)+1,(d-1)*n>=o+u&&(d-=1)),d}static adjustPadAndReturnShape(t,n,o,u,l,d,c,s,r=0){let i=o*(u-1)+1;if(s&&s!=="NOTSET")switch(s){case"VALID":return l[d]=0,l[c]=0,gr.computeOutputSize(t-i,n,t,0,r);case"SAME_LOWER":case"SAME_UPPER":if(o!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let a=(Math.floor((t+n-1)/n)-1)*n+u-t;return l[d]=Math.floor(s==="SAME_LOWER"?(a+1)/2:a/2),l[c]=a-l[d],gr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}default:throw new Error("Unsupported AutoPad type")}else return gr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}},xi=-34028234663852886e22,$i=34028234663852886e22});function U3(e){switch(e){case"bool":case"int8":case"uint8":return 1;case"int16":case"uint16":return 2;case"int32":case"uint32":case"float32":return 4;case"float64":return 8;default:throw new Error(`cannot calculate sizeof() on type ${e}`)}}function xp(e){switch(e){case be.onnx.TensorProto.DataType.UINT8:case be.onnx.TensorProto.DataType.INT8:case be.onnx.TensorProto.DataType.BOOL:return 1;case be.onnx.TensorProto.DataType.UINT16:case be.onnx.TensorProto.DataType.INT16:return 2;case be.onnx.TensorProto.DataType.FLOAT:case be.onnx.TensorProto.DataType.INT32:case be.onnx.TensorProto.DataType.UINT32:return 4;case be.onnx.TensorProto.DataType.INT64:case be.onnx.TensorProto.DataType.DOUBLE:case be.onnx.TensorProto.DataType.UINT64:return 8;default:throw new Error(`cannot calculate sizeof() on type ${be.onnx.TensorProto.DataType[e]}`)}}function G3(e,t){return new(D0(t))(e)}function D0(e){switch(e){case"bool":case"uint8":return Uint8Array;case"int8":return Int8Array;case"int16":return Int16Array;case"uint16":return Uint16Array;case"int32":return Int32Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"float32":return Float32Array;case"float64":return Float64Array;default:throw new Error("unspecified error")}}function Ru(e,t){if(t===be.onnx.TensorProto.DataType.INT64||t===bo.TensorDataType.INT64){if(e.greaterThanOrEqual(2147483648)||e.lessThan(-2147483648))throw new TypeError("int64 is not supported")}else if(t===be.onnx.TensorProto.DataType.UINT32||t===bo.TensorDataType.UINT32||t===be.onnx.TensorProto.DataType.UINT64||t===bo.TensorDataType.UINT64){if(e.greaterThanOrEqual(4294967296)||e.lessThan(0))throw new TypeError("uint64 is not supported")}else throw new TypeError(`not a LONG type: ${be.onnx.TensorProto.DataType[t]}`);return e.toNumber()}function $p(e,t,n){switch(t){case be.onnx.TensorProto.DataType.BOOL:case be.onnx.TensorProto.DataType.UINT8:return e.getUint8(n);case be.onnx.TensorProto.DataType.INT8:return e.getInt8(n);case be.onnx.TensorProto.DataType.UINT16:return e.getUint16(n,!0);case be.onnx.TensorProto.DataType.INT16:return e.getInt16(n,!0);case be.onnx.TensorProto.DataType.FLOAT:return e.getFloat32(n,!0);case be.onnx.TensorProto.DataType.INT32:return e.getInt32(n,!0);case be.onnx.TensorProto.DataType.UINT32:return e.getUint32(n,!0);case be.onnx.TensorProto.DataType.INT64:return Ru(nn.fromBits(e.getUint32(n,!0),e.getUint32(n+4,!0),!1),t);case be.onnx.TensorProto.DataType.DOUBLE:return e.getFloat64(n,!0);case be.onnx.TensorProto.DataType.UINT64:return Ru(nn.fromBits(e.getUint32(n,!0),e.getUint32(n+4,!0),!0),t);default:throw new Error(`cannot read from DataView for type ${be.onnx.TensorProto.DataType[t]}`)}}var Tp,be,gt,En=R(()=>{"use strict";Tp=ce(WI()),Ly(),Mo(),be=ce(Ii()),ke(),gt=class yo{constructor(t,n,o,u,l,d=Tp.Guid.create()){this.dims=t,this.type=n,this.dataProvider=o,this.asyncDataProvider=u,this.cache=l,this.dataId=d,this.size=he.validateDimsAndCalcSize(t);let c=this.size,s=o===void 0&&u===void 0&&l===void 0;if(l!==void 0&&l.length!==c)throw new RangeError("Input dims doesn't match data length.");if(n==="string"){if(l!==void 0&&(!Array.isArray(l)||!l.every(r=>typeof r=="string")))throw new TypeError("cache should be a string array");s&&(this.cache=new Array(c))}else{if(l!==void 0){let r=D0(n);if(!(l instanceof r))throw new TypeError(`cache should be type ${r.name}`)}if(s){let r=new ArrayBuffer(c*U3(n));this.cache=G3(r,n)}}}get data(){if(this.cache===void 0){let t=this.dataProvider(this.dataId);if(t.length!==this.size)throw new Error("Length of data provided by the Data Provider is inconsistent with the dims of this Tensor.");this.cache=t}return this.cache}get stringData(){if(this.type!=="string")throw new TypeError("data type is not string");return this.data}get integerData(){switch(this.type){case"uint8":case"int8":case"uint16":case"int16":case"int32":case"uint32":case"bool":return this.data;default:throw new TypeError("data type is not integer (uint8, int8, uint16, int16, int32, uint32, bool)")}}get floatData(){switch(this.type){case"float32":case"float64":return this.data;default:throw new TypeError("data type is not float (float32, float64)")}}get numberData(){if(this.type!=="string")return this.data;throw new TypeError("type cannot be non-number (string)")}get(t){return this.data[he.indicesToOffset(t,this.strides)]}set(t,n){this.data[he.indicesToOffset(t,this.strides)]=n}async getData(){return this.cache===void 0&&(this.cache=await this.asyncDataProvider(this.dataId)),this.cache}get strides(){return this._strides||(this._strides=he.computeStrides(this.dims)),this._strides}static fromProto(t){if(!t)throw new Error("cannot construct Value from an empty tensor");let n=ht.tensorDataTypeFromProto(t.dataType),o=ht.tensorDimsFromProto(t.dims),u=new yo(o,n);if(n==="string")t.stringData.forEach((l,d)=>{u.data[d]=ku(l)});else if(t.rawData&&typeof t.rawData.byteLength=="number"&&t.rawData.byteLength>0){let l=u.data,d=new DataView(t.rawData.buffer,t.rawData.byteOffset,t.rawData.byteLength),c=xp(t.dataType),s=t.rawData.byteLength/c;if(t.rawData.byteLength%c!==0)throw new Error("invalid buffer length");if(l.length!==s)throw new Error("buffer length mismatch");for(let r=0;r<s;r++){let i=$p(d,t.dataType,r*c);l[r]=i}}else{let l;switch(t.dataType){case be.onnx.TensorProto.DataType.FLOAT:l=t.floatData;break;case be.onnx.TensorProto.DataType.INT32:case be.onnx.TensorProto.DataType.INT16:case be.onnx.TensorProto.DataType.UINT16:case be.onnx.TensorProto.DataType.INT8:case be.onnx.TensorProto.DataType.UINT8:case be.onnx.TensorProto.DataType.BOOL:l=t.int32Data;break;case be.onnx.TensorProto.DataType.INT64:l=t.int64Data;break;case be.onnx.TensorProto.DataType.DOUBLE:l=t.doubleData;break;case be.onnx.TensorProto.DataType.UINT32:case be.onnx.TensorProto.DataType.UINT64:l=t.uint64Data;break;default:throw new Error("unspecific error")}if(l==null)throw new Error("failed to populate data from a tensorproto value");let d=u.data;if(d.length!==l.length)throw new Error("array length mismatch");for(let c=0;c<l.length;c++){let s=l[c];nn.isLong(s)?d[c]=Ru(s,t.dataType):d[c]=s}}return u}static fromData(t,n,o){return new yo(n,o,void 0,void 0,t)}static fromOrtTensor(t){if(!t)throw new Error("cannot construct Value from an empty tensor");let n=ht.tensorDimsFromORTFormat(t),o=ht.tensorDataTypeFromProto(t.dataType()),u=new yo(n,o);if(o==="string")for(let l=0;l<t.stringDataLength();l++)u.data[l]=t.stringData(l);else if(t.rawDataArray()&&typeof t.rawDataLength()=="number"&&t.rawDataLength()>0){let l=u.data,d=new DataView(t.rawDataArray().buffer,t.rawDataArray().byteOffset,t.rawDataLength()),c=xp(t.dataType()),s=t.rawDataLength()/c;if(t.rawDataLength()%c!==0)throw new Error("invalid buffer length");if(l.length!==s)throw new Error("buffer length mismatch");for(let r=0;r<s;r++){let i=$p(d,t.dataType(),r*c);l[r]=i}}return u}}});function Te(e){return e===1?R0:N0}function q3(e){let t=Te(e);return`${t.version}
      precision highp float;
      ${t.attribute} vec3 position;
      ${t.attribute} vec2 textureCoord;

      ${t.varyingVertex} vec2 TexCoords;

      void main()
      {
          gl_Position = vec4(position, 1.0);
          TexCoords = textureCoord;
      }`}function H3(e){let t=Te(e);return`${t.version}
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    ${t.varyingFrag} vec2 TexCoords;
    ${t.outputDeclaration}
    const vec2 halfCR = vec2(0.5, 0.5);

    // Custom vector types to handle higher dimenalities.
    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    `}function W3(e,t){let n=Te(e);return`
  void main() {
    int indices[${t}];
    toVec(TexCoords, indices);
    vec4 result = vec4(process(indices));
    ${n.output} = result;
  }
  `}var R0,N0,Ge=R(()=>{"use strict";R0={version:"",attribute:"attribute",varyingVertex:"varying",varyingFrag:"varying",texture2D:"texture2D",output:"gl_FragColor",outputDeclaration:""},N0={version:"#version 300 es",attribute:"in",varyingVertex:"out",varyingFrag:"in",texture2D:"texture",output:"outputColor",outputDeclaration:"out vec4 outputColor;"}}),Ie=R(()=>{"use strict"});async function Sp(e,t=o=>0,n){return new Promise((o,u)=>{let l=0,d=()=>{if(e()){o();return}l++;let c=t(l);if(n!=null&&l>=n){u();return}setTimeout(d,c)};d()})}function Gs(e){return xo(typeof e<"u"&&e.length!==0,()=>"empty string found for sampler name"),"get"+e.charAt(0).toUpperCase()+e.slice(1)}function K3(e){return xo(typeof e<"u"&&e.length!==0,()=>"empty string found for sampler name"),"get"+e.charAt(0).toUpperCase()+e.slice(1)+"AtOutCoords"}function Kn(e,t){let n=JSON.parse(JSON.stringify(e));return n=t,n}function Xn(e,t){return t.map(n=>e[n]).join(", ")}function _r(e){if(e<=1)return"int";if(e===2)return"ivec2";if(e===3)return"ivec3";if(e===4)return"ivec4";if(e===5)return"ivec5";if(e===6)return"ivec6";throw Error(`GPU for rank ${e} is not yet supported`)}function Sn(e=6){return["x","y","z","w","u","v"].slice(0,e)}var Yt=R(()=>{"use strict";ke()});function X3(e,t){return Sn(t).map(n=>`${e}.${n}`)}function xl(e,t){return t===1?[e]:X3(e,t)}function Oi(){return`
    float getChannel(vec4 frag, int dim) {
      int modCoord = imod(dim, 2);
      return modCoord == 0 ? frag.r : frag.g;
    }

    float getChannel(vec4 frag, vec2 innerDims) {
      vec2 modCoord = mod(innerDims, 2.);
      return modCoord.x == 0. ?
        (modCoord.y == 0. ? frag.r : frag.g) :
        (modCoord.y == 0. ? frag.b : frag.a);
    }
  `}var An=R(()=>{"use strict";Yt()});function Z3(e,t,n){if(e===0)return"false";if(e===1)return`rc > ${t[0]}`;let o="";for(let u=e-2;u<e;u++)o+=`${n[u]} >= ${t[u-e+2]}`,u<e-1&&(o+="||");return o}function J3(e,t){let n=e.length;if(n===0)return"getA(), 0, 0, 0";if(n===1)return`getA(rc),
            rc + 1 >= ${e[0]} ? 0. : getA(rc + 1),
            0, 0`;let o="r, c",u="r, cp1",l="rp1, c",d="rp1, cp1",c="";if(n>2)for(let s=0;s<n-2;++s)c=c+`${t[s]},`;return`getA(${c}${o}),
          rEdge ? 0. : getA(${c}${l}),
          cEdge ? 0. : getA(${c}${u}),
          rEdge || cEdge ? 0. : getA(${c}${d})`}function Y3(e,t,n,o){return e===0||e===1?"":`
    int r = ${t[e-2]};
    int c = ${t[e-1]};
    int rp1 = ${t[e-2]} + 1;
    int cp1 = ${t[e-1]} + 1;
    bool rEdge = rp1 >= ${o};
    bool cEdge = cp1 >= ${n};
    `}var qs,Ip,z0,Q3=R(()=>{"use strict";Ge(),Ie(),Yt(),An(),qs={name:"pack",inputNames:["A"],inputTypes:[1]},Ip=(e,t)=>{let n=Te(e.session.backend.glContext.version),o=t.dims,u=o.length,l=t.dims.length,d=_r(l),c=xl("rc",l),s=Y3(l,c,o[o.length-2],o[o.length-1]),r;u===0?r=[1,1]:u===1?r=[o[0],1]:r=[o[l-1],o[l-2]];let i=Z3(l,r,c),a=J3(o,c),p=`
        void main() {
          ${d} rc = getOutputCoords();

          if(${i}) {
            ${n.output} = vec4(0);
          } else {
            ${s}

            ${n.output} = vec4(${a});
          }
        }
      `;return{...qs,hasMain:!0,output:{dims:t.dims,type:t.type,textureType:2},shaderSource:p}},z0=(e,t)=>({...qs,get:()=>Ip(e,t)})});function Op(e){if(e.length===0)return[1,1,1];let t=1;for(let n=0;n<e.length-2;++n)t*=e[n];return[t,e.length>1?e[e.length-2]:1,e[e.length-1]]}function eO(e,t){let n=!1;return e.length===0||t.length===0?n=!0:e.length<2||t.length<2?n=e[e.length-1]===t[t.length-1]:n=e[e.length-1]===t[t.length-1]&&e[e.length-2]===t[t.length-2],n}function tO(e){let t=he.computeStrides(e),n=["b","r","c"],o="index";return`
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${t.map((u,l)=>{let d=`int ${n[l]} = ${o} / ${u}`,c=l===t.length-1?`int ${n[l+1]} = ${o} - ${n[l]} * ${u}`:`index -= ${n[l]} * ${u}`;return`${d}; ${c};`}).join("")}
      return ivec3(b, r, c);
    }
  `}function rO(e){let t=he.computeStrides(e);return`
  int getFlattenedIndex(ivec3 coords) {
    // reverse y, z order
    return coords.x * ${t[0]} + coords.z * ${t[1]} + coords.y;
  }
`}var Ep,Ap,B0,nO=R(()=>{"use strict";ke(),Ge(),Ie(),An(),Ep=e=>({name:"Reshape (packed)",inputTypes:[2],inputNames:["A"],cacheHint:`${e}`}),Ap=(e,t,n,o)=>{let u=t.dims,l=o,d="";for(let r=0;r<4;r++){let i="";switch(r){case 0:i="outputCoords = rc;";break;case 1:i="outputCoords = ivec3(rc.x, rc.y+1, rc.z);";break;case 2:i="outputCoords = ivec3(rc.x, rc.y, rc.z+1);";break;case 3:i="outputCoords = ivec3(rc.x, rc.y+1, rc.z+1);";break;default:throw new Error}d+=`
        ${i}
        ${r>0?"if(outputCoords.y < rows && outputCoords.z < cols){":""}
          int flattenedIndex = getFlattenedIndex(outputCoords);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flattenedIndex);
          vec2 innerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${r}] = getChannel(getA(inputRC.x, inputRC.y, inputRC.z), innerDims);

        ${r>0?"}":""}
      `}let c=Te(e.session.backend.glContext.version),s=`
      ${tO(u)}
      ${rO(l)}
      ${Oi()}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.0);

        ivec3 outputCoords;
        int rows = ${l[2]};
        int cols = ${l[1]};

        ${d}
        ${c.output} = result;
      }
    `;return{...n,output:{dims:l,type:t.type,textureType:2},shaderSource:s,hasMain:!0}},B0=(e,t,n)=>{let o=Ep(n);return{...o,get:()=>Ap(e,t,o,n)}}}),Nu,iO=R(()=>{"use strict";Ge(),Ie(),Nu=(e,t)=>{let n=t.shape,o=Te(e.session.backend.glContext.version),u=`
    const float FLOAT_MAX = 1.70141184e38;
    const float FLOAT_MIN = 1.17549435e-38;

    bool isNaN(float val) {
      return (val < 1.0 || 0.0 < val || val == 0.0) ? false : true;
    }

    highp vec4 encodeAsUint8(highp float v) {
      if (isNaN(v)) {
        return vec4(255, 255, 255, 255);
      }

      highp float av = abs(v);

      if(av < FLOAT_MIN) {
        return vec4(0.0, 0.0, 0.0, 0.0);
      } else if(v > FLOAT_MAX) {
        return vec4(0.0, 0.0, 128.0, 127.0) / 255.0;
      } else if(v < -FLOAT_MAX) {
        return vec4(0.0, 0.0,  128.0, 255.0) / 255.0;
      }

      highp vec4 c = vec4(0,0,0,0);

      highp float e = floor(log2(av));
      highp float m = exp2(fract(log2(av))) - 1.0;

      c[2] = floor(128.0 * m);
      m -= c[2] / 128.0;
      c[1] = floor(32768.0 * m);
      m -= c[1] / 32768.0;
      c[0] = floor(8388608.0 * m);

      highp float ebias = e + 127.0;
      c[3] = floor(ebias / 2.0);
      ebias -= c[3] * 2.0;
      c[2] += floor(ebias) * 128.0;

      c[3] += 128.0 * step(0.0, -v);

      return c / 255.0;
    }

    void main() {
      float value = ${o.texture2D}(X,TexCoords).r;
      ${o.output} = encodeAsUint8(value);
    }`,l={name:"Uint8Encode",inputTypes:[0],inputNames:["X"],output:{dims:n,type:t.tensor.type,textureType:3},shaderSource:u,hasMain:!0};return e.executeProgram(l,[t.tensor])}});function oO(e,t){if(e===1)return"rc";let n="";for(let o=0;o<e;o++)n+=t[o],o<e-1&&(n+=",");return n}var Hs,Pp,M0,sO=R(()=>{"use strict";Ge(),Ie(),Yt(),An(),Hs={name:"unpack",inputNames:["A"],inputTypes:[2]},Pp=(e,t)=>{let n=t.dims.length,o=xl("rc",n),u=o.slice(-2),l=_r(n),d=Oi(),c=t.dims.length===0?"":oO(n,o),s=n<=1?"rc":`vec2(${u.join(",")})`,r=Te(e.session.backend.glContext.version),i=`
    ${d}
    void main() {
      ${l} rc = getOutputCoords();

       // Sample the texture with the coords to get the rgba channel value.
       vec4 packedInput = getA(${c});

       ${r.output} = vec4(getChannel(packedInput, ${s}), 0, 0, 0);
     }
   `;return{...Hs,hasMain:!0,output:{dims:t.dims,type:t.type,textureType:0},shaderSource:i}},M0=(e,t)=>({...Hs,get:()=>Pp(e,t)})}),F0,zu,j0,To=R(()=>{"use strict";Bt(),F0=class{constructor(e,t=1){if(t===1)this.internalFormat=e.R32F,this.format=e.RED,this.textureType=e.FLOAT,this.channelSize=t;else if(t===4)this.internalFormat=e.RGBA32F,this.format=e.RGBA,this.textureType=e.FLOAT,this.channelSize=t;else throw new Error(`Invalid number of channels: ${t}`)}encode(e,t){let n,o;return e.constructor!==Float32Array&&(We.warning("Encoder","data was not of type Float32; creating new Float32Array"),o=new Float32Array(e)),t*this.channelSize>e.length?(We.warning("Encoder","Source data too small. Allocating larger array"),o=e,n=this.allocate(t*this.channelSize),o.forEach((u,l)=>n[l]=u)):(o=e,n=o),n}allocate(e){return new Float32Array(e*4)}decode(e,t){return this.channelSize===1?e.filter((n,o)=>o%4===0).subarray(0,t):e.subarray(0,t)}},zu=class{constructor(e,t=1,n){if(t!==1&&t!==4)throw new Error(`Invalid number of channels: ${t}`);this.internalFormat=e.RGBA,this.format=e.RGBA,this.channelSize=t,this.textureType=n||e.FLOAT}encode(e,t){let n=e;return this.channelSize===1&&(We.verbose("Encoder","Exploding into a larger array"),n=this.allocate(t),e.forEach((o,u)=>n[u*4]=o)),n}allocate(e){return new Float32Array(e*4)}decode(e,t){return this.channelSize===1?e.filter((n,o)=>o%4===0).subarray(0,t):e.subarray(0,t)}},j0=class{constructor(e,t=1){if(this.channelSize=4,t===1)this.internalFormat=e.ALPHA,this.format=e.ALPHA,this.textureType=e.UNSIGNED_BYTE,this.channelSize=t;else if(t===4)this.internalFormat=e.RGBA,this.format=e.RGBA,this.textureType=e.UNSIGNED_BYTE,this.channelSize=t;else throw new Error(`Invalid number of channels: ${t}`)}encode(e,t){return new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}allocate(e){return new Uint8Array(e*this.channelSize)}decode(e,t){if(e instanceof Uint8Array)return e.subarray(0,t);throw new Error(`Invalid array type: ${e.constructor}`)}}}),yi,L0,Bu,aO=R(()=>{"use strict";ke(),Ie(),yi=(e,t,n)=>{let o=n===0||n===1?1:4,u=n===2,l=n===1||n===2,d=n===4?t.length-1:void 0,c=n===4?t.map((s,r)=>r===t.length-1?s*4:s):void 0;return Bu(e,t,o,c,{isPacked:u,reverseWH:l,breakAxis:d})},L0=(e,t,n)=>{let o=yi(e,t,n);return[o.width,o.height]},Bu=(e,t,n=1,o,u)=>{let l=!!(u&&u.isPacked),[d,c]=e.computeTextureWH(l&&o||t,u),s=t.length,r=t.slice(0);if(s===0&&(r=[1]),n===1)o=t;else if(l){if(n!==4)throw new Error("a packed texture must be 4-channel");o=t,s>0&&(r[s-1]=Math.ceil(r[s-1]/2)),s>1&&(r[s-2]=Math.ceil(r[s-2]/2))}else if(!o)throw new Error("Unpacked shape is needed when using channels > 1");return{width:d,height:c,channels:n,isPacked:l,shape:r,strides:he.computeStrides(r),unpackedShape:o,reversedWH:u&&u.reverseWH}}}),kp,V0,uO=R(()=>{"use strict";Bt(),En(),ke(),Q3(),nO(),iO(),sO(),To(),aO(),Ie(),kp=(e,t)=>{let n=t.map(u=>`${u.unpackedShape.join(",")};${u.width}x${u.height}`).join("_"),o=e.name;return e.cacheHint&&(o+="["+e.cacheHint+"]"),o+=":"+n,o},V0=class{constructor(e){this.session=e,this.packedTextureDataCache=new Map,this.unpackedTextureDataCache=new Map}calculateTextureWidthAndHeight(e,t){return L0(this.session.layoutStrategy,e,t)}executeProgram(e,t){if(t.length<e.inputNames.length)throw new Error(`Input size mustn't be less than ${e.inputNames.length}.`);if(e.inputNames.length!==e.inputTypes.length)throw new Error("input names size does not match input types");let n=[];for(let s=0;s<e.inputNames.length;++s)n[s]=this.getOrCreateTextureData(t[s],e.inputTypes[s]);let o=kp(e,n),u=this.session.programManager.getArtifact(o),l=u?u.programInfo:typeof e.get=="function"?e.get():e,d=yi(this.session.layoutStrategy,l.output.dims,l.output.textureType),c=this.createTextureData(d,l.output.type);return u||(u=this.session.programManager.build(l,n,c),this.session.programManager.setArtifact(o,u)),this.runProgram(u,n,c),c}run(e,t){return this.executeProgram(e,t).tensor}runProgram(e,t,n){for(let o=0;o<t.length;++o)if(!!t[o].isPacked!=(e.programInfo.inputTypes[o]===2))throw new Error(`input[${o}] property packed inconsistent`);if(!!n.isPacked!=(e.programInfo.output.textureType===2))throw new Error("output property packed inconsistent");this.session.programManager.run(e,t,n)}getOrCreateTextureData(e,t){let n=this.getTextureData(e.dataId,t===2);if(!n&&(n=this.getTextureData(e.dataId,t!==2),n))return t===2?this.pack(n):this.unpack(n);if(!n){let o=yi(this.session.layoutStrategy,e.dims,t);if(t===4){let u=e.dims;if(u.length===4){let l=[u[0],Math.ceil(u[1]*u[2]*u[3]/4)],d=yi(this.session.layoutStrategy,l,t),c=e.numberData;if(u[1]*u[2]*u[3]%4!==0){let s=u[0],r=u[1]*u[2]*u[3],i=Math.ceil(r*1/4)*4,a=s*i;c=new Float32Array(a);for(let p=0;p<s;++p){let h=p*r,m=p*i+p%1*r;c.set(e.numberData.subarray(h,h+r),m)}}return this.createTextureData(d,e.type,c,e,1)}}if(t===2){let u=Bu(this.session.layoutStrategy,e.dims,1,[],{reverseWH:!0}),l=this.createTextureData(u,e.type,e.numberData,e,1);n=this.pack(l)}else n=this.createTextureData(o,e.type,e.numberData,e,1)}return n}createTextureDataFromLayoutBindTensor(e,t,n,o){return this.createTextureData(e,t,n,o,1)}createTextureData(e,t,n,o,u){We.verbose("InferenceHandler",`Creating TextureData: layout:[${JSON.stringify(e)}]`);let l=this.session.textureManager.createTextureFromLayout(t,e,n,u);return this.createTextureDataFromTexture(e,t,l,o)}reshapeUnpacked(e,t){let n=this.getOrCreateTextureData(e,0),o={channels:n.channels,height:n.height,width:n.width,shape:t.length!==0?t:[1],strides:he.computeStrides(t),unpackedShape:t};return this.createTextureDataFromTexture(o,e.type,n.texture).tensor}reshapePacked(e,t){let n=this.getOrCreateTextureData(e,2);if(eO(e.dims,t)){let c={channels:n.channels,height:n.height,width:n.width,shape:t.length!==0?t:[1],strides:he.computeStrides(t),unpackedShape:t,isPacked:!0};return this.createTextureDataFromTexture(c,e.type,n.texture).tensor}let o=Op(e.dims),u=Op(t),l=this.reshapePacked(e,o),d=this.run(B0(this,l,u),[l]);return this.reshapePacked(d,t)}cast(e,t){let n=this.getOrCreateTextureData(e,0);return this.createTextureDataFromTexture(n,t,n.texture).tensor}createTextureDataFromTexture(e,t,n,o,u){let l={...e,tensor:o||new gt(e.unpackedShape,t,d=>this.readTexture(l),async d=>this.readTextureAsync(l),void 0,u),texture:n};return this.setTextureData(l.tensor.dataId,l,e.isPacked),l}getTextureData(e,t=!1){return this.session.isInitializer(e)?this.session.getTextureData(e,t):t?this.packedTextureDataCache.get(e):this.unpackedTextureDataCache.get(e)}setTextureData(e,t,n=!1){this.session.isInitializer(e)?this.session.setTextureData(e,t,n):(n?this.packedTextureDataCache:this.unpackedTextureDataCache).set(e,t)}isTextureLayoutCached(e,t=!1){return!!this.getTextureData(e.dataId,t)}dispose(){this.session.textureManager.clearActiveTextures(),this.packedTextureDataCache.forEach(e=>this.session.textureManager.releaseTexture(e)),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache.forEach(e=>this.session.textureManager.releaseTexture(e)),this.unpackedTextureDataCache=new Map}readTexture(e){return e.isPacked?this.readTexture(this.unpack(e)):this.session.backend.glContext.isFloat32DownloadSupported?this.session.textureManager.readTexture(e,e.tensor.type,e.channels):this.session.textureManager.readUint8TextureAsFloat(Nu(this,e))}async readTextureAsync(e){return e.isPacked?this.readTextureAsync(this.unpack(e)):this.session.backend.glContext.isFloat32DownloadSupported?this.session.textureManager.readTextureAsync(e,e.tensor.type,e.channels):this.session.textureManager.readUint8TextureAsFloat(Nu(this,e))}pack(e){return this.executeProgram(z0(this,e.tensor),[e.tensor])}unpack(e){return this.executeProgram(M0(this,e.tensor),[e.tensor])}}}),Cp,Be,nt=R(()=>{"use strict";Cp=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Be=e=>new Cp(e)}),Ws,U0,G0,Dp,Rp,lO=R(()=>{"use strict";nt(),Ge(),Ie(),Ws={name:"BatchNormalization",inputNames:["A","Scale","B","Mean","Variance"],inputTypes:[0,0,0,0,0]},U0=(e,t,n)=>(Rp(t),[e.run({...Ws,cacheHint:n.cacheKey,get:()=>Dp(e,t,n)},t)]),G0=e=>{let t=e.attributes.getFloat("epsilon",1e-5),n=e.attributes.getFloat("momentum",.9),o=e.attributes.getInt("spatial",1);return Be({epsilon:t,momentum:n,spatial:o})},Dp=(e,t,n)=>{let o=Te(e.session.backend.glContext.version),u=t[0].dims.length,[l,d]=e.calculateTextureWidthAndHeight(t[1].dims,0),c=`
  float process(int[${u}] indices) {
    vec2 position = offsetToCoords(indices[1], ${l}, ${d});
    float scale = getColorAsFloat(${o.texture2D}(Scale, position));
    float mean = getColorAsFloat(${o.texture2D}(Mean, position));
    float variance = getColorAsFloat(${o.texture2D}(Variance, position));
    float b = getColorAsFloat(${o.texture2D}(B, position));

    return scale * ( (_A(indices) - mean) / sqrt(variance + float(${n.epsilon})) ) + b;
  }`;return{...Ws,output:{dims:t[0].dims,type:t[0].type,textureType:0},shaderSource:c}},Rp=e=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs.");let t=e[0],n=e[1],o=e[2],u=e[3],l=e[4];if(t.dims.length<3||n.dims.length!==1||o.dims.length!==1||u.dims.length!==1||l.dims.length!==1)throw new Error("invalid input shape.");if(n.dims[0]!==t.dims[1]||o.dims[0]!==t.dims[1]||u.dims[0]!==t.dims[1]||l.dims[0]!==t.dims[1])throw new Error("invalid input shape.");if(t.type!=="float32"&&t.type!=="float64"||n.type!=="float32"&&n.type!=="float64"||o.type!=="float32"&&o.type!=="float64"||u.type!=="float32"&&u.type!=="float64"||l.type!=="float32"&&l.type!=="float64")throw new Error("invalid input tensor types.")}}),q0,Pn,te,Mu,H0,vr=R(()=>{"use strict";q0=class{constructor(e,t,n,o){this.glContext=e,this.programInfo=t,this.inputTextureLayouts=n,this.outputTextureLayout=o}},Pn=class{constructor(e){this.context=e}},te=class{constructor(e,t){this.routineBody=e,this.dependencies=t}},Mu=class{constructor(e,t,n){this.name=e,n?this.dependencies=n:this.dependencies=[],t&&(this.routineBody=t)}addDependency(e){e&&this.dependencies.push(e)}},H0=class{static returnOrderedNodes(e){if(!e||e.length===0)return[];if(e.length===1)return e;let t=new Set,n=new Set,o=new Array;return this.createOrderedNodes(e,t,n,o),o}static createOrderedNodes(e,t,n,o){for(let u=0;u<e.length;++u)this.dfsTraverse(e[u],t,n,o)}static dfsTraverse(e,t,n,o){if(!e||n.has(e.name))return;if(t.has(e.name))throw new Error("Cyclic dependency detected. Can't topologically sort routines needed for shader.");t.add(e.name);let u=e.dependencies;if(u&&u.length>0)for(let l=0;l<u.length;++l)this.dfsTraverse(u[l],t,n,o);o.push(e),n.add(e.name),t.delete(e.name)}}});function dO(){let e="add_";return{body:`
  float ${e}(float a, float b) {
    return a + b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 + v2;
  }
  `,name:e,type:0}}function cO(){let e="div_";return{body:`
  float ${e}(float a, float b) {
    return a / b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 / v2;
  }
  `,name:e,type:0}}function pO(){let e="mul_";return{body:`
  float ${e}(float a, float b) {
    return a * b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 * v2;
  }
  `,name:e,type:0}}function hO(){let e="sub_";return{body:`
  float ${e}(float a, float b) {
    return a - b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 - v2;
  }
  `,name:e,type:0}}function fO(){let e="equal_";return{body:`
  float ${e}(float a, float b) {
    return float(a == b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4(equal(v1, v2));
  }
  `,name:e,type:0}}function mO(){let e="greater_";return{body:`
  float ${e}(float a, float b) {
    return float(a > b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4( v1.r > v2.r ,
      v1.g > v2.g,
      v1.b > v2.b,
      v1.a > v2.a );
  }
  `,name:e,type:0}}function gO(){let e="less_";return{body:`
  float ${e}(float a, float b) {
    return float(a < b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4( v1.r < v2.r ,
                v1.g < v2.g,
                v1.b < v2.b,
                v1.a < v2.a );
  }
  `,name:e,type:0}}function bO(){let e="and_";return{body:`
  float ${e}(float a, float b) {
    return float( bool(a) && bool(b) );
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r && b2.r ,
                b1.g && b2.g,
                b1.b && b2.b,
                b1.a && b2.a );
  }
  `,name:e,type:0}}function yO(){return{body:`
  float or_(float a, float b) {
    return float( bool(a) || bool(b) );
  }
  vec4 or_(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r || b2.r ,
                b1.g || b2.g,
                b1.b || b2.b,
                b1.a || b2.a );
  }
  `,name:"or_",type:0}}function _O(){let e="xor_";return{body:`
  float ${e}(float a, float b) {
    return float( bool(a) ^^ bool(b) );
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r ^^ b2.r ,
                b1.g ^^ b2.g,
                b1.b ^^ b2.b,
                b1.a ^^ b2.a );
  }
  `,name:e,type:0}}function wO(){return xO("pow")}function vO(){let e="prelu_";return{body:`
  float ${e}(float a, float b) {
    return a < 0.0 ? a * b: a;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4(
      v1.r < 0.0 ? v1.r * v2.r: v1.r,
      v1.g < 0.0 ? v1.g * v2.g: v1.g,
      v1.b < 0.0 ? v1.b * v2.b: v1.b,
      v1.a < 0.0 ? v1.a * v2.a: v1.a
      );
  }
  `,name:e,type:0}}function xO(e){let t=`${e}_`;return{body:`
  float ${t}(float a, float b) {
    return ${e}(a, b);
  }
  vec4 ${t}(vec4 v1, vec4 v2) {
    return ${e}(v1, v2);
  }
  `,name:t,type:0}}var ct,Np,W0,K0,X0,Z0,J0,Y0,Q0,e_,t_,r_,n_,i_,$O=R(()=>{"use strict";ke(),vr(),Ge(),Ie(),ct=(e,t,n,o=t[0].type,u)=>{let l=e.session.pack?2:0;return{name:n.name,inputNames:["A","B"],inputTypes:[l,l],cacheHint:u,get:()=>Np(e,t,n,o)}},Np=(e,t,n,o=t[0].type)=>{let u=e.session.pack?2:0,l=!he.areEqual(t[0].dims,t[1].dims),d=t[0].dims,c=e.session.pack;if(l){let i=qt.calcShape(t[0].dims,t[1].dims,!1);if(!i)throw new Error("Can't perform binary op on the given tensors");d=i;let a=d.length,p=t[0].dims.length!==0?t[0].dims.length:1,h=t[1].dims.length!==0?t[1].dims.length:1,m=t[0].dims.length!==0?"bcastIndices_A(indices, aindices);":"aindices[0] = 0;",b=t[1].dims.length!==0?"bcastIndices_B(indices, bindices);":"bindices[0] = 0;",x=Te(e.session.backend.glContext.version),_=c?`
      ${n.body}
      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();
        vec4 result = ${n.name}(a, b);
        ${x.output} = result;
      }`:`
      ${n.body}
      float process(int indices[${a}]) {
        int aindices[${p}];
        int bindices[${h}];
        ${m}
        ${b}
        return ${n.name}(_A(aindices), _B(bindices));
      }`;return{name:n.name,inputNames:["A","B"],inputTypes:[u,u],output:{dims:d,type:o,textureType:u},shaderSource:_,hasMain:c}}let s=Te(e.session.backend.glContext.version),r=`
    ${n.body}
    void main() {
      vec4 v1 = ${s.texture2D}(A, TexCoords);
      vec4 v2 = ${s.texture2D}(B, TexCoords);
      vec4 result = ${n.name}(v1, v2);
      ${s.output} = result;
    }
    `;return{name:n.name,inputNames:["A","B"],inputTypes:[u,u],output:{dims:t[0].dims,type:o,textureType:u},shaderSource:r,hasMain:!0}},W0=(e,t)=>[e.run(ct(e,t,dO()),t)],K0=(e,t)=>[e.run(ct(e,t,bO(),"bool"),t)],X0=(e,t)=>[e.run(ct(e,t,cO()),t)],Z0=(e,t)=>[e.run(ct(e,t,fO(),"bool"),t)],J0=(e,t)=>[e.run(ct(e,t,mO(),"bool"),t)],Y0=(e,t)=>[e.run(ct(e,t,gO(),"bool"),t)],Q0=(e,t)=>[e.run(ct(e,t,pO()),t)],e_=(e,t)=>[e.run(ct(e,t,yO(),"bool"),t)],t_=(e,t)=>[e.run(ct(e,t,wO()),t)],r_=(e,t)=>[e.run(ct(e,t,vO()),t)],n_=(e,t)=>[e.run(ct(e,t,hO()),t)],i_=(e,t)=>[e.run(ct(e,t,_O(),"bool"),t)]}),o_,s_,zp,TO=R(()=>{"use strict";ke(),o_=(e,t,n)=>(zp(t),[e.cast(t[0],n)]),s_=e=>ht.tensorDataTypeFromProto(e.attributes.getInt("to")),zp=e=>{if(!e||e.length!==1)throw new Error("Cast requires 1 input.");if(e[0].type==="string")throw new Error("Invalid input type.")}}),Bp,Mp,a_,Zn,SO=R(()=>{"use strict";Ge(),Ie(),Yt(),An(),Bp=(e,t)=>({name:"Concat (packed)",inputNames:Array.from({length:e},(n,o)=>`X${o}`),inputTypes:Array(e).fill(2),cacheHint:t}),Mp=(e,t,n,o)=>{let u=n[0].dims.slice();if(o>=u.length||o<-1*u.length)throw new Error("axis specified for concat doesn't match input dimensionality");o<0&&(o=u.length+o);let l=u.slice(0);for(let I=1;I<n.length;I++){let A=n[I].dims.slice();for(let k=0;k<u.length;k++)if(k===o)l[o]+=A[k];else if(u[k]!==A[k])throw new Error("non concat dimensions must match")}let d=l.length,c=xl("coords",d),s=_r(d),r=Oi(),i=n.map(I=>I.dims),a=Sn(d),p=new Array(i.length-1);p[0]=i[0][o];for(let I=1;I<p.length;I++)p[I]=p[I-1]+i[I][o];let h=a[o],m=a.slice(-2),b=a.join(),x=`if (${h} < ${p[0]}) {
        return getChannel(
            getX0(${b}), vec2(${m.join()}));
        }`;for(let I=1;I<p.length;I++){let A=p[I-1];x+=`
            if (${h} < ${p[I]}  && ${h} >= ${p[I-1]}) {
              return getChannel(
                getX${I}(${Zn(a,h,A)}),
                vec2(${Zn(m,h,A)}));
            }`}let _=p.length,y=p[p.length-1];x+=`
            return getChannel(
              getX${_}(${Zn(a,h,y)}),
              vec2(${Zn(m,h,y)}));`;let S=Te(e.session.backend.glContext.version),T=`
          ${r}
          float getValue(${a.map(I=>"int "+I)}) {
            ${x}
          }

          void main() {
            ${s} coords = getOutputCoords();
            int lastDim = coords.${a[d-1]};
            coords.${a[d-1]} = coords.${a[d-2]};
            coords.${a[d-2]} = lastDim;

            vec4 result = vec4(getValue(${c}), 0., 0., 0.);

            ${c[d-1]} = ${c[d-1]} + 1;
            if (${c[d-1]} < ${l[d-1]}) {
              result.g = getValue(${c});
            }

            ${c[d-2]} = ${c[d-2]} + 1;
            if (${c[d-2]} < ${l[d-2]}) {
              result.a = getValue(${c});
            }

            ${c[d-1]} = ${c[d-1]} - 1;
            if (${c[d-2]} < ${l[d-2]} &&
                ${c[d-1]} < ${l[d-1]}) {
              result.b = getValue(${c});
            }
            ${S.output} = result;
          }
        `;return{...t,output:{dims:l,type:n[0].type,textureType:2},shaderSource:T,hasMain:!0}},a_=(e,t,n)=>{let o=Bp(t.length,n.cacheKey);return{...o,get:()=>Mp(e,o,t,n.axis)}},Zn=(e,t,n)=>{let o=e.indexOf(t);return e.map((u,l)=>l===o?`${u} - ${n}`:u).join()}}),u_,Fp,jp,Lp,Ks,Vp,Up,Gp,l_,qp,IO=R(()=>{"use strict";nt(),Ie(),SO(),u_=(e,t,n)=>(qp(t),e.session.pack&&t[0].dims.length>1?[e.run(a_(e,t,n),t)]:[e.run(Lp(e,t,n),t)]),Fp=(e,t)=>({name:"Concat",inputNames:Array.from({length:e},(n,o)=>`X${o}`),inputTypes:Array(e).fill(0),cacheHint:t}),jp=(e,t,n,o)=>{let u=n[0].dims.slice();if(o>=u.length||o<-1*u.length)throw new Error("axis specified for concat doesn't match input dimensionality");o<0&&(o=u.length+o);let l=u.slice(0);for(let h=1;h<n.length;h++){let m=n[h].dims.slice();for(let b=0;b<u.length;b++)if(b===o)l[o]+=m[b];else if(u[b]!==m[b])throw new Error("non concat dimensions must match")}let d=l.length,c=new Array(n.length),s=0;for(let h=0;h<c.length;++h)s+=n[h].dims[o],c[h]=s;let r="";n.length<5?r=Ks(c):r=Vp(c);let i=Up(n.length,d),a=Gp(c),p=`
        ${i}
        ${a}
        ${r}
        float process(int indices[${d}]) {
          int textureIndex = getTextureWhereDataResides (indices[${o}]);

          if(textureIndex != 0) {
            indices[${o}] = indices[${o}] - int(getSizeInConcatAxisValueFromIndex(textureIndex-int(1)));
          }

          return fetchDataFromCorrectTexture(textureIndex, indices);
        }`;return{...t,output:{dims:l,type:n[0].type,textureType:0},shaderSource:p}},Lp=(e,t,n)=>{let o=Fp(t.length,n.cacheKey);return{...o,get:()=>jp(e,o,t,n.axis)}},Ks=e=>`int getTextureWhereDataResides(int index) {
      ${e.map((t,n)=>`if(index<${t}) {return ${n};}
`).join("")}
    }`,Vp=e=>Ks(e),Up=(e,t)=>{let n=[`float fetchDataFromCorrectTexture(int textureIndex, int indices[${t}]) {`];for(let o=0;o<e;++o)o===0?n.push(`	if (textureIndex == ${o}) { return _X${o}(indices); }`):o===e-1?n.push(`	else { return _X${o}(indices); }`):n.push(`	else if (textureIndex == ${o}) { return _X${o}(indices); }`);return n.push("	}"),n.join(`
`)},Gp=e=>{let t=["int getSizeInConcatAxisValueFromIndex(int index) {"];for(let n=0;n<e.length;++n)n===0?t.push(`	if (index == ${n}) { return ${e[n]}; }`):n===e.length-1?t.push(`	else { return ${e[n]}; }`):t.push(`	else if (index == ${n}) { return ${e[n]}; }`);return t.push("	}"),t.join(`
`)},l_=e=>Be({axis:e.attributes.getInt("axis")}),qp=e=>{if(!e||e.length<1)throw new Error("too few inputs");let t=e[0].type,n=e[0].dims.length;if(t==="string")throw new Error("string tensor is not supported yet");for(let o of e){if(o.type!==t)throw new Error("input tensors should be one type");if(o.dims.length!==n)throw new Error("input tensors should have the same shape")}}});function OO(){return Ot("abs")}function EO(){return Ot("acos")}function AO(){return Ot("asin")}function PO(){return Ot("atan")}function kO(){return Ot("ceil")}function CO(){return Ot("cos")}function DO(e){return{body:`
  const float alpha = float(${e});

  float elu_(float a) {
    return a >= 0.0 ? a: (exp(a) - 1.0) * alpha;
  }
  vec4 elu_(vec4 v) {
    return vec4(elu_(v.x), elu_(v.y), elu_(v.z), elu_(v.w));
  }
  `,name:"elu",type:0}}function RO(){return Ot("exp")}function NO(){return Ot("floor")}function d_(e,t){let n="clip";return{body:`
  const float min = float(${e});
  const float max = float(${t});

  float ${n}_(float a) {
    return clamp(a, min, max);
  }
  vec4 ${n}_(vec4 v) {
    return clamp(v, min, max);
  }
  `,name:n,type:0}}function zO(){let e="indentity";return{body:`
  float ${e}_(float a) {
    return a;
  }
  vec4 ${e}_(vec4 v) {
    return v;
  }
  `,name:e,type:0}}function BO(e){let t="leakyRelu";return{body:`
  const float alpha = float(${e});

  float ${t}_(float a) {
    return a < 0.0 ? a * alpha : a;
  }
  vec4 ${t}_(vec4 v) {
    return vec4(${t}_(v.x), ${t}_(v.y), ${t}_(v.z), ${t}_(v.w));
  }
  `,name:t,type:0}}function MO(){return Ot("log")}function FO(){return{body:`
  float neg_(float a) {
    return -a;
  }
  vec4 neg_(vec4 v) {
    return -v;
  }
  `,name:"neg",type:0}}function jO(){return{body:`
  float not_(float a) {
    return float( ! bool(a) );
  }
  bool not_(bool a) {
    return !a;
  }
  vec4 not_(vec4 v) {
    return vec4(!bool(v.x), !bool(v.y), !bool(v.z), !bool(v.w));
  }
  bvec4 not_(bvec4 v) {
    return bvec4(!v.x, !v.y, !v.z, !v.w);
  }
  `,name:"not",type:0}}function LO(){return Ot("sin")}function c_(){let e="relu";return{body:`
  float ${e}_(float a) {
    return max( a, 0.0 );
  }
  vec4 ${e}_(vec4 v) {
    return max( v, 0.0 );
  }
  `,name:e,type:0}}function p_(){let e="sigmoid";return{body:`
  float ${e}_(float a) {
    return 1.0 / (1.0 + exp(-a));
  }
  vec4 ${e}_(vec4 v) {
    return 1.0 / (1.0 + exp(-v));
  }
  `,name:e,type:0}}function VO(){return Ot("sqrt")}function UO(){return Ot("tan")}function GO(){let e="tanh";return{body:`
  float ${e}_(float a) {
    a = clamp(a, -10., 10.);
    a = exp(2.*a);
    return (a - 1.) / (a + 1.);
  }
  vec4 ${e}_(vec4 v) {
    v = clamp(v, -10., 10.);
    v = exp(2.*v);
    return (v - 1.) / (v + 1.);
  }
  `,name:e,type:0}}function Ot(e){return{body:`
  float ${e}_(float a) {
    return ${e}(a);
  }
  vec4 ${e}_(vec4 v) {
    return ${e}(v);
  }
  `,name:e,type:0}}var Hp,He,h_,f_,m_,g_,Fu,b_,y_,Wp,__,w_,v_,x_,$_,T_,ju,S_,I_,O_,E_,A_,P_,k_,C_,D_,R_,N_,z_=R(()=>{"use strict";nt(),ke(),vr(),Ge(),Ie(),Hp=(e,t,n,o)=>{let u=e.session.pack?2:0,l=Te(e.session.backend.glContext.version);return{...t,output:{dims:n.dims,type:n.type,textureType:u},shaderSource:`
     ${o.body}
     void main() {
       vec4 v = ${l.texture2D}(A, TexCoords);
       v = ${o.name}_(v);
       ${l.output} = v;
     }
     `,hasMain:!0}},He=(e,t,n,o)=>{let u=e.session.pack?2:0,l={name:n.name,inputTypes:[u],inputNames:["A"],cacheHint:o};return{...l,get:()=>Hp(e,l,t,n)}},h_=(e,t)=>[e.run(He(e,t[0],OO()),t)],f_=(e,t)=>[e.run(He(e,t[0],EO()),t)],m_=(e,t)=>[e.run(He(e,t[0],AO()),t)],g_=(e,t)=>[e.run(He(e,t[0],PO()),t)],Fu=(e,t,n)=>[e.run(He(e,t[0],d_(n.min,n.max),n.cacheKey),t)],b_=e=>Be({min:e.attributes.getFloat("min",xi),max:e.attributes.getFloat("max",$i)}),y_=(e,t)=>{let n=Wp(e,t);return Fu(e,[t[0]],n)},Wp=(e,t)=>{if(t.length>=3&&(!e.session.isInitializer(t[1].dataId)||!e.session.isInitializer(t[2].dataId)))throw new Error("dynamic clip attributes are not allowed");let n=t.length>=3?t[1].numberData[0]:xi,o=t.length>=3?t[2].numberData[0]:$i;return Be({min:n,max:o})},__=(e,t)=>[e.run(He(e,t[0],kO()),t)],w_=(e,t)=>[e.run(He(e,t[0],CO()),t)],v_=(e,t,n)=>[e.run(He(e,t[0],DO(n.alpha),n.cacheKey),t)],x_=e=>Be({alpha:e.attributes.getFloat("alpha",1)}),$_=(e,t)=>[e.run(He(e,t[0],RO()),t)],T_=(e,t)=>[e.run(He(e,t[0],NO()),t)],ju=(e,t)=>[e.run(He(e,t[0],zO()),t)],S_=(e,t,n)=>[e.run(He(e,t[0],BO(n.alpha),n.cacheKey),t)],I_=e=>Be({alpha:e.attributes.getFloat("alpha",.01)}),O_=(e,t)=>[e.run(He(e,t[0],MO()),t)],E_=(e,t)=>[e.run(He(e,t[0],FO()),t)],A_=(e,t)=>[e.run(He(e,t[0],jO()),t)],P_=(e,t)=>[e.run(He(e,t[0],c_()),t)],k_=(e,t)=>[e.run(He(e,t[0],p_()),t)],C_=(e,t)=>[e.run(He(e,t[0],LO()),t)],D_=(e,t)=>[e.run(He(e,t[0],VO()),t)],R_=(e,t)=>[e.run(He(e,t[0],UO()),t)],N_=(e,t)=>[e.run(He(e,t[0],GO()),t)]});function Ei(e){let t;switch(e.activation){case"Relu":t=c_();break;case"Sigmoid":t=p_();break;case"Clip":t=d_(e.clipMin,e.clipMax);break;default:return{activationFunction:"",applyActivation:""}}let n=t.name,o=t.body,u=`value = ${n}_(value);`;return{activationFunction:o,applyActivation:u}}var Fo,kn=R(()=>{"use strict";ke(),z_(),Fo=e=>{let t=e.getString("activation","");if(t==="Clip"){let[n,o]=e.getFloats("activation_params",[xi,$i]);return{activation:t,clipMax:o,clipMin:n,activationCacheKey:`${t}:${n},${o}`}}return{activation:t,activationCacheKey:t}}}),Kp,Xp,B_,qO=R(()=>{"use strict";Bt(),Ge(),Ie(),Sl(),kn(),Kp=(e,t)=>({name:"GroupedConv",inputNames:e?["X","W","Bias"]:["X","W"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),Xp=(e,t,n,o)=>{let u=t.length>2?"value += getBias(output_channel);":"",l=t[0].dims.slice(),d=t[1].dims.slice(),c=d[0]/o.group;We.verbose("GroupedConv",`autpPad:${o.autoPad}, dilations:${o.dilations}, group:${o.group}, kernelShape:${o.kernelShape}, pads:${o.pads}, strides:${o.strides}`);let s=_i(l,d,o.dilations,o.pads,o.strides),r=Te(e.session.backend.glContext.version),{activationFunction:i,applyActivation:a}=Ei(o),p=`
  const ivec2 strides = ivec2(${o.strides[0]}, ${o.strides[1]});
  const ivec2 pads = ivec2(${o.pads[0]}, ${o.pads[1]});
  ${i}
  void main() {
    ivec4 coords = getOutputCoords();
    int batch = coords.x;
    int output_channel = coords.y;
    ivec2 xRCCorner = coords.zw * strides - pads;
    int group_id = output_channel / ${c};

    float value = 0.0;
    for (int wInChannel = 0; wInChannel < ${d[1]}; wInChannel++) {
      int input_channel = group_id * ${d[1]} + wInChannel;
      for (int wHeight = 0; wHeight < ${d[2]}; wHeight++) {
        int xHeight = xRCCorner.x + wHeight * ${o.dilations[0]};

        if (xHeight < 0 || xHeight >= ${l[2]}) {
          continue;
        }

        for (int wWidth = 0; wWidth < ${d[3]}; wWidth++) {
          int xWidth = xRCCorner.y + wWidth * ${o.dilations[1]};
          if (xWidth < 0 || xWidth >= ${l[3]}) {
            continue;
          }

          float xVal = getX(batch, input_channel, xWidth, xHeight);
          float wVal = getW(output_channel, wInChannel, wWidth, wHeight);
          value += xVal*wVal;
        }
      }
    }
    ${u}
    ${a}
    ${r.output} = vec4(value, .0, .0, .0);
  }
`;return{...n,output:{dims:s,type:t[0].type,textureType:0},shaderSource:p,hasMain:!0}},B_=(e,t,n)=>{let o=Kp(t.length>2,n.cacheKey);return{...o,get:()=>Xp(e,t,o,n)}}}),Zp,Jp,M_,HO=R(()=>{"use strict";Ge(),Ie(),An(),Zp=e=>({name:"Im2Col (packed)",inputNames:["A"],inputTypes:[2],cacheHint:e}),Jp=(e,t,n,o,u,l)=>{let d=n.dims,c=o.dims,s=2,r=3,i=u.length,a=[c[1]*c[2]*c[3],u[2]*u[3]],p=c[2]*c[3],h=Oi(),m=Te(e.session.backend.glContext.version),b="";for(let _=0;_<=1;_++)for(let y=0;y<=1;y++)b+=`
            blockIndex = rc.x + ${y};
            pos = rc.y + ${_};

            if(blockIndex < ${a[1]} && pos < ${a[0]}) {
              offsetY = int(blockIndex / (${u[i-1]})) * ${l.strides[0]} -
                ${l.pads[0]};
              d0 = offsetY + ${l.dilations[0]} * (imod(pos, ${p}) / ${c[2]});

              if(d0 < ${d[s]} && d0 >= 0) {
                offsetX = imod(blockIndex, ${u[i-1]}) * ${l.strides[1]} -
                  ${l.pads[1]};
                d1 = offsetX + ${l.dilations[1]} * imod(imod(pos, ${p}), ${c[2]});

                if(d1 < ${d[r]} && d1 >= 0) {

                  ch = int(float(pos)/ ${p}.);
                    innerDims = vec2(d0, d1);
                    result[${_*2+y}] = getChannel(
                      getA(0, ch, int(innerDims.x),
                      int(innerDims.y)), innerDims);
                }
              }
            }

          `;let x=`
      ${h}

      void main() {
        ivec2 rc = getOutputCoords();
          vec4 result = vec4(0.0);
          int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
          vec2 innerDims;
          ${b}
          ${m.output} = result;
      }
            `;return{...t,output:{dims:a,type:n.type,textureType:2},shaderSource:x,hasMain:!0}},M_=(e,t,n,o,u)=>{let l=Zp(u.cacheKey);return{...l,get:()=>Jp(e,l,t,n,o,u)}}});function WO(e,t,n){let o=t[0].dims,u=t[1].dims,l=qt.calcShape(o,u,!0);if(!l)throw new Error("Can't use matmul on the given tensors");let d=_r(l.length),c=Sn(),{activationFunction:s,applyActivation:r}=Ei(n),i=t.length>2,a=i?"value += getBiasForMatmul();":"",p=i?`${j_(d,c,t[2].dims,l,!1)}`:"",h=l.length,m=o.length,b=u.length,x=o[o.length-1],_=`
    ${s}
    ${p}
    float process(int indices[${h}]) {
        int a[${m}];
        int b[${b}];
        bcastMatmulIndices_A(indices, a);
        bcastMatmulIndices_B(indices, b);

        float value;
        for (int k=0; k<${x}; ++k) {
            a[${m-1}] = k;
            b[${b-2}] = k;
            value += _A(a) * _B(b);
        }
        ${a}
        ${r}
        return value;
    }`;return{...e,output:{dims:l,type:t[0].type,textureType:0},shaderSource:_}}function F_(e,t){let n=U_(e.length>2,t.activationCacheKey);return{...n,get:()=>WO(n,e,t)}}function j_(e,t,n,o,u){let l="",d=n.length,c=o.length,s=c-d;c<2&&d>0?l="coords":l=n.map((p,h)=>`coords.${t[h+s]}`).join(", ");let r=qt.getBroadcastDims(n,o).map(p=>`coords.${t[p+s]} = 0;`).join(`
`),i=he.size(n)===1,a="vec4(outputValue.xx, outputValue.yy)";return i&&(a="vec4(outputValue.x)"),u?`
vec4 getBiasForMatmul() {
  ${e} coords = getOutputCoords();
  ${r}
  vec4 outputValue = getBias(${l});
  return ${a};
}`:`
float getBiasForMatmul() {
  ${e} coords = getOutputCoords();
  ${r}
  return getBias(coords.x);
}`}var L_,V_,U_,Yp,$l=R(()=>{"use strict";ke(),Ie(),Yt(),kn(),G_(),L_=(e,t,n)=>(Yp(t),e.session.pack?[e.run(Tl(e,t,n),t)]:[e.run(F_(t,n),t)]),V_=e=>Fo(e.attributes),U_=(e,t)=>({name:"MatMul",inputNames:e?["A","B","Bias"]:["A","B"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),Yp=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.");if(e[0].type!=="float32"&&e[0].type!=="float64"||e[1].type!=="float32"&&e[1].type!=="float64")throw new Error("inputs should be float type");if(e[0].type!==e[1].type)throw new Error("inputs types should match")}});function KO(e,t,n,o){let u=[],l=[],d=n[0].dims,c=n[1].dims,s=d.length,r=c.length,i=o.length,a=i-s,p=i-r;u=d.map((y,S)=>`coords.${t[S+a]}`),u[s-1]="i*2",u.join(", "),l=c.map((y,S)=>`coords.${t[S+p]}`),l[r-2]="i*2",l.join(", ");let h=qt.getBroadcastDims(d,o),m=qt.getBroadcastDims(c,o),b=h.map(y=>`coords.${t[y+a]} = 0;`).join(`
`),x=m.map(y=>`coords.${t[y+p]} = 0;`).join(`
`),_=`int lastDim = coords.${t[i-1]};
  coords.${t[i-1]} = coords.${t[i-2]};
  coords.${t[i-2]} = lastDim;`;return`
vec4 getAAtOutCoordsMatmul(int i) {
  ${e} coords = getOutputCoords();
  ${_}
  ${b}
  vec4 outputValue = getA(${u});
  return outputValue;
}

vec4 getBAtOutCoordsMatmul(int i) {
  ${e} coords = getOutputCoords();
  ${_}
  ${x}
  vec4 outputValue = getB(${l});
  return outputValue;
}`}function XO(e,t){let n="";for(let o=0;o<t-2;o++)n+=`rc.${e[o]}, `;return n+=`rc.${e[t-2]}, i*2`,n}function ZO(e,t){let n="";for(let o=0;o<t-2;o++)n+=`rc.${e[o]}, `;return n+=`i*2, rc.${e[t-1]}`,n}var Qp,eh,Tl,G_=R(()=>{"use strict";ke(),Ge(),Ie(),Yt(),kn(),$l(),Qp=(e,t)=>({name:"MatMul (packed)",inputNames:e?["A","B","Bias"]:["A","B"],inputTypes:e?[2,2,2]:[2,2],cacheHint:t}),eh=(e,t,n,o)=>{let u=n.length>2,l=u?"value += getBiasForMatmul();":"",d=n[0].dims,c=n[1].dims,s=qt.calcShape(d,c,!0),r=!he.areEqual(n[0].dims,n[1].dims);if(!s)throw new Error("Can't use matmul on the given tensors");let i=d[d.length-1],a=Math.ceil(i/2),p=d.length,h=c.length,m=Te(e.session.backend.glContext.version),b=_r(s.length),x=s.length,_=Sn(),{activationFunction:y,applyActivation:S}=Ei(o),T=u?`${j_(b,_,n[2].dims,s,!0)}`:"",I=r?`${KO(b,_,n,s)}`:"",A=r?"getAAtOutCoordsMatmul(i)":`getA(${XO(_,p)})`,k=r?"getBAtOutCoordsMatmul(i)":`getB(${ZO(_,h)})`,O=r?"":`${b} rc =
          getOutputCoords(); int lastDim = rc.${_[x-1]}; rc.${_[x-1]} =
          rc.${_[x-2]}; rc.${_[x-2]} = lastDim;
      `,z=`
            ${I}
            ${T}
            ${y}
            void main() {
              ${O}

              vec4 value = vec4(0);
              for (int i = 0; i < ${a}; i++) {
                vec4 a = ${A};
                vec4 b = ${k};

                value += (a.rrbb * b.rgrg);
                value += (a.ggaa * b.baba);
              }
              ${l}
              ${S}
              ${m.output} = value;
            }`;return{...t,output:{dims:s,type:n[0].type,textureType:2},shaderSource:z,hasMain:!0}},Tl=(e,t,n)=>{let o=Qp(t.length>2,n.activationCacheKey);return{...o,get:()=>eh(e,o,t,n)}}}),q_,JO=R(()=>{"use strict";Sl(),HO(),G_(),q_=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=_i(o,u,n.dilations,n.pads,n.strides),d=e.run(M_(e,t[0],t[1],l,n),[t[0]]),c=e.reshapePacked(t[1],[u[0],u[1]*u[2]*u[3]]),s=t.length===3?[c,d,t[2]]:[c,d],r=e.run(Tl(e,s,n),s);return e.reshapePacked(r,l)}}),th,rh,H_,Lu,W_=R(()=>{"use strict";Ie(),th=e=>({name:"Im2Col",inputNames:["X"],inputTypes:[0],cacheHint:e}),rh=(e,t,n,o,u,l)=>{let d=n.dims,c=o.dims,s=u.length,r=Lu(d,c,u,4),i=`
        const int XC = ${d[1]};
        const int XH = ${d[2]};
        const int XW = ${d[3]};
        const int KH = ${l.kernelShape[0]};
        const int KW = ${l.kernelShape[1]};
        const int dilationH = ${l.dilations[0]};
        const int dilationW = ${l.dilations[1]};
        const int strideH = ${l.strides[0]};
        const int strideW = ${l.strides[1]};
        const int padH = ${l.pads[0]};
        const int padW = ${l.pads[1]};
        const int KHKW = KH*KW;
        const int XCKHKW = XC * KHKW;
        const int outputChannels = 4;
        vec4 process(int indices[${s}]) {
          int b  = indices[0]; // batch size
          int oh = indices[1] * strideH - padH; //output height
          int ow = indices[2] * strideW - padW; //output width
          int p = indices[3] * outputChannels; //patch
          vec4 value = vec4(0.0);
          for(int i=0; i < outputChannels; ++i) {
            if(p < XCKHKW) {
              int patchC = p / KHKW;
              int patchH = (p - patchC*KHKW) / KW;
              int patchW = (p - patchC*KHKW) - patchH * KW;
              int xh2 = oh + patchH * dilationH;
              int xw2 = ow + patchW * dilationW;
              int x[${d.length}];
              x[0] = b;
              x[1] = patchC;
              x[2] = xh2;
              x[3] = xw2;
              if(xh2 >= 0 &&
                  xh2 < XH &&
                  xw2 >= 0 &&
                  xw2 < XW) {
                value[i] = _X(x);
              }
            }
            ++p;
          }
          return value;
        }
        `;return{...t,output:{dims:r,type:n.type,textureType:4},shaderSource:i}},H_=(e,t,n,o,u)=>{let l=th(u.cacheKey);return{...l,get:()=>rh(e,l,t,n,o,u)}},Lu=(e,t,n,o=4)=>[n[0],n[2],n[3],Math.ceil(e[1]*t[2]*t[3]/o)]}),nh,ih,K_,YO=R(()=>{"use strict";ke(),Ge(),Ie(),kn(),W_(),nh=(e,t)=>({name:"ConvDotProduct",inputNames:e?["Im2Col","K","B"]:["Im2Col","K"],inputTypes:e?[0,4,0]:[0,4],cacheKey:t.activationCacheKey}),ih=(e,t,n,o,u)=>{let l=n[0].dims,d=n[1].dims,c=[d[0],Math.ceil(l[1]*d[2]*d[3]/4)],s=Lu(l,d,o),[r,i]=e.calculateTextureWidthAndHeight(c,4),a=he.computeStrides(s),[p,h]=e.calculateTextureWidthAndHeight(s,4),m=o.length,b=n.length<3?"0.0":"_B(b)",x=Math.ceil(l[1]*d[2]*d[3]/4),{activationFunction:_,applyActivation:y}=Ei(u),S=Te(e.session.backend.glContext.version),T=`
${_}
float process(int indices[${m}]) {
  int b[1];
  b[0] = indices[1];
  int im2col[4];
  im2col[0] = indices[0];
  im2col[1] = indices[2];
  im2col[2] = indices[3];
  int im2colOffset = im2col[0] * ${a[0]} + im2col[1] * ${a[1]} + im2col[2] * ${a[2]};
  int kernelOffset = indices[1] * ${c[1]};
  float value = ${b};
  for (int i = 0; i < ${x}; ++i) {
    vec2 im2colCoords = offsetToCoords(im2colOffset, ${p}, ${h});
    vec2 kernelCoords = offsetToCoords(kernelOffset, ${r}, ${i});
    value += dot(${S.texture2D}(Im2Col, im2colCoords), ${S.texture2D}(K, kernelCoords));
    ++im2colOffset;
    ++kernelOffset;
  }
  ${y}
  return value;
}`;return{...t,output:{dims:o,type:n[0].type,textureType:0},shaderSource:T}},K_=(e,t,n,o)=>{let u=nh(t.length>2,o);return{...u,get:()=>ih(e,u,t,n,o)}}}),_i,Vu,oh,sh,ah,uh,Uu,lh,Sl=R(()=>{"use strict";nt(),ke(),qO(),JO(),YO(),kn(),W_(),$l(),_i=(e,t,n,o,u)=>{let l=e[0],d=e.slice(2),c=d.length,s=t[0],r=t.slice(2).map((a,p)=>a+(a-1)*(n[p]-1)),i=d.map((a,p)=>a+o[p]+o[p+c]).map((a,p)=>Math.floor((a-r[p]+u[p])/u[p]));return[l,s].concat(...i)},Vu=(e,t,n)=>(lh(t,n),oh(e,t,n)),oh=(e,t,n)=>{let o=uh(n,t),u=e.session.pack,l=o.kernelShape[0]===1&&o.kernelShape[1]===1;return o.group>1?[e.run(B_(e,t,o),t)]:l&&u?[sh(e,t,o)]:u&&t[0].dims.length===4&&t[0].dims[0]===1&&!l?[q_(e,t,o)]:[ah(e,t,o)]},sh=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=_i(o,u,n.dilations,n.pads,n.strides),d=e.reshapeUnpacked(t[0],[o[1],o[2]*o[3]]),c=e.reshapeUnpacked(t[1],[u[0],u[1]]),s=t.length>2?[c,d,t[2]]:[c,d],r=e.run(F_(s,n),s);return e.reshapeUnpacked(r,l)},ah=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=_i(o,u,n.dilations,n.pads,n.strides),d=e.run(H_(e,t[0],t[1],l,n),[t[0]]),c=t.length===3?[d,t[1],t[2]]:[d,t[1]];return e.run(K_(e,t,l,n),c)},uh=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0)for(let l=2;l<t[1].dims.length;++l)n.push(t[1].dims[l]);let o=e.pads.slice();$o.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,n,o,e.autoPad);let u=Object.assign({},e);return Object.assign(u,{kernelShape:n,pads:o,cacheKey:e.cacheKey}),u},Uu=e=>{let t=e.attributes,n=Fo(t),o=t.getString("auto_pad","NOTSET"),u=t.getInts("dilations",[1,1]),l=t.getInt("group",1),d=t.getInts("kernel_shape",[]),c=t.getInts("pads",[0,0,0,0]),s=t.getInts("strides",[1,1]);return Be({autoPad:o,dilations:u,group:l,kernelShape:d,pads:c,strides:s,...n})},lh=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4||e[1].dims.length!==4)throw new Error("currently only support 2-dimensional conv");let n=e[0].dims[1],o=e[1].dims[1]*t.group;if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let u=e[0].dims.length-2;if(t.dilations.length!==u)throw new Error(`dilations should be ${u}D`);if(t.strides.length!==u)throw new Error(`strides should be ${u}D`);if(t.pads.length!==u*2)throw new Error(`pads should be ${u*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(e[0].type!=="float32"||e[1].type!=="float32")throw new Error("Conv input(X,W) should be float tensor");if(e.length===3&&e[2].type!=="float32")throw new Error("Conv input(bias) should be float tensor")}}),dh,ch,ph,X_,hh,fh,mh,gh,bh,yh,Z_,_h,QO=R(()=>{"use strict";nt(),Ge(),Ie(),kn(),dh=(e,t,n,o,u,l)=>(e-1)*t+n+(o-1)*u+1-l,ch=(e,t,n,o,u)=>{let l=Math.floor(e/2);t==="SAME_UPPER"?(n[o]=l,n[u]=e-l):t==="SAME_LOWER"&&(n[o]=e-l,n[u]=l)},ph=(e,t,n,o,u,l,d,c)=>{let s=e.length-2,r=c.length===0;for(let i=0;i<s;++i){let a=r?e[i+2]*l[i]:c[i],p=dh(e[i+2],l[i],u[i],t[i],n[i],a);ch(p,o,u,i,i+s),r&&c.push(l[i]*(e[i+2]-1)+d[i]+(t[i]-1)*n[i]+1-u[i]-u[i+s])}},X_=(e,t,n)=>(_h(t,n),hh(e,t,n)),hh=(e,t,n)=>{let o=yh(n,t);return[bh(e,t,o)]},fh=(e,t)=>({name:"ConvTranspose",inputNames:e?["X","W","B"]:["X","W"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),mh=(e,t,n,o)=>{let u=t.length>2?"getB(output_channel)":"0.0",l=t[0].dims,d=t[1].dims,c=d[1],s=d[0]/o.group,r=[t[0].dims[0],t[1].dims[1]*o.group,...o.outputShape],i=Te(e.session.backend.glContext.version),{activationFunction:a,applyActivation:p}=Ei(o),h=`
  const ivec2 strides = ivec2(${o.strides[0]}, ${o.strides[1]});
  const ivec2 pads = ivec2(${o.pads[0]}, ${o.pads[1]});
  ${a}
  void main() {
    ivec4 coords = getOutputCoords();
    int batch = coords.x;
    int output_channel = coords.y;

    ivec2 loc = coords.zw + pads;

    int group_id = output_channel / ${c};
    int wOutChannel = output_channel - group_id * ${c};

    float value = ${u};
    for (int inChannelOffset = 0; inChannelOffset < ${s}; inChannelOffset++) {
      int input_channel = group_id * ${s} + inChannelOffset;
      for (int wWOff = 0; wWOff < ${d[2]}; wWOff++) {
        for (int wHOff = 0; wHOff < ${d[3]}; wHOff++) {
          ivec2 wOff = ivec2(wWOff * ${o.dilations[0]}, wHOff * ${o.dilations[1]});
          ivec2 wLoc = loc - wOff;
          ivec2 wLocIn = wLoc / strides;
          if (
            wLocIn * strides == wLoc &&
            wLocIn.x >= 0 && wLocIn.x < ${l[2]} &&
            wLocIn.y >= 0 && wLocIn.y < ${l[3]}
          ) {
            float xVal = getX(batch, input_channel, wLocIn.y, wLocIn.x);
            float wVal = getW(input_channel, wOutChannel, wHOff, wWOff);
            value += xVal * wVal;
          }
        }
      }
    }
    ${p}
    ${i.output} = vec4(value, .0, .0, .0);
  }
`;return{...n,output:{dims:r,type:t[0].type,textureType:0},shaderSource:h,hasMain:!0}},gh=(e,t,n)=>{let o=fh(t.length>2,n.cacheKey);return{...o,get:()=>mh(e,t,o,n)}},bh=(e,t,n)=>e.run(gh(e,t,n),t),yh=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0)for(let c=2;c<t[1].dims.length;++c)n.push(t[1].dims[c]);let o=e.pads.slice(),u=e.outputShape.slice(),l=t[0].dims;ph(l,n,e.dilations,e.autoPad,o,e.strides,e.outputPadding,u);let d=Object.assign({},e);return Object.assign(d,{kernelShape:n,pads:o,outputShape:u,cacheKey:e.cacheKey}),d},Z_=e=>{let t=e.attributes,n=Fo(t),o=t.getString("auto_pad","NOTSET"),u=t.getInts("dilations",[1,1]),l=t.getInt("group",1),d=t.getInts("kernel_shape",[]),c=t.getInts("output_padding",[0,0]),s=t.getInts("output_shape",[]),r=t.getInts("pads",[0,0,0,0]),i=t.getInts("strides",[1,1]);return Be({autoPad:o,dilations:u,group:l,kernelShape:d,outputPadding:c,outputShape:s,pads:r,strides:i,...n})},_h=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4||e[1].dims.length!==4)throw new Error("currently only support 2-dimensional conv");let n=e[0].dims[1],o=e[1].dims[0];if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let u=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==u))throw new Error("invalid bias");let l=e[0].dims.length-2;if(t.dilations.length!==l)throw new Error(`dilations should be ${l}D`);if(t.strides.length!==l)throw new Error(`strides should be ${l}D`);if(t.pads.length!==l*2)throw new Error(`pads should be ${l*2}D`);if(t.outputPadding.length!==l)throw new Error(`output_padding should be ${l}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape");if(e[0].type!=="float32"||e[1].type!=="float32")throw new Error("ConvTranspose input(X,W) should be float tensor");if(e.length===3&&e[2].type!=="float32")throw new Error("ConvTranspose input(bias) should be float tensor")}}),Xs,Ti,J_,wh,Zs,vh,xh,$h,Il=R(()=>{"use strict";nt(),ke(),Ie(),Xs={name:"Transpose",inputNames:["A"],inputTypes:[0]},Ti=(e,t,n)=>($h(t),[e.run({...Xs,cacheHint:n.cacheKey,get:()=>wh(e,t[0],n.perm)},t)]),J_=e=>Be({perm:e.attributes.getInts("perm",[])}),wh=(e,t,n)=>{let o=t.dims;n=Zs(o,n);let u=vh(o,n),l=o.length,d=`
      ${xh("perm",n,l)}
      float process(int indices[${l}]) {
        int a[${l}];
        perm(a, indices);
        return _A(a);
      }`;return{...Xs,output:{dims:u,type:t.type,textureType:0},shaderSource:d}},Zs=(e,t)=>(t&&t.length!==e.length&&(t=[...e.keys()].reverse()),t),vh=(e,t)=>(t=Zs(e,t),he.sortBasedOnPerm(e,t)),xh=(e,t,n)=>{let o=[];o.push(`void ${e}(out int a[${n}], int src[${n}]) {`);for(let u=0;u<n;++u)o.push(`	a[${t[u]}]=src[${u}];`);return o.push("	}"),o.join(`
`)},$h=e=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("input should be float tensor")}}),Y_,Q_,Th,eE=R(()=>{"use strict";Il(),Y_=(e,t,n)=>{Th(t);let o=n.blocksize,u=o*o,l=n.mode==="DCR"?[0,3,4,1,5,2]:[0,1,4,2,5,3],d=n.mode==="DCR"?[t[0].dims[0],o,o,t[0].dims[1]/u,t[0].dims[2],t[0].dims[3]]:[t[0].dims[0],t[0].dims[1]/u,o,o,t[0].dims[2],t[0].dims[3]],c=e.reshapeUnpacked(t[0],d),s={perm:l,cacheKey:`${l}`},[r]=Ti(e,[c],s),i=[t[0].dims[0],t[0].dims[1]/u,t[0].dims[2]*o,t[0].dims[3]*o];return[e.reshapeUnpacked(r,i)]},Q_=e=>{let t=e.attributes.getInt("blocksize");if(t<1)throw new Error(`blocksize must be >= 1, but got : ${t} for DepthToSpace`);let n=e.attributes.getString("mode","DCR");if(n!=="DCR"&&n!=="CRD")throw new Error(`unrecognized mode: ${n} for DepthToSpace`);return{mode:n,blocksize:t}},Th=e=>{if(e.length!==1)throw new Error(`DepthToSpace expect 1 inputs, but got ${e.length}`);if(e[0].type==="string"||e[0].dims.length!==4)throw new TypeError("DepthToSpace input should be a 4-D numeric tensor")}}),ew,tw,Sh,tE=R(()=>{"use strict";ke(),ew=(e,t,n)=>{Sh(t,n);let o=he.flattenShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},tw=e=>e.attributes.getInt("axis",1),Sh=(e,t)=>{if(!e||e.length!==1)throw new Error("Flatten requires 1 input.");let n=e[0].dims.length;if(n===0)throw new Error("scalar tensor is not supported.");if(t<-n||t>n)throw new Error("Invalid axis");if(e[0].type==="string")throw new Error("string tensor is not supported.")}}),Ai,jo=R(()=>{"use strict";Ai=["float32","float64","int32","int16","int8","uint16","uint32","uint8"]}),rw,nw,Ih,Oh,Eh,Ah,rE=R(()=>{"use strict";nt(),jo(),ke(),Ie(),rw=(e,t,n)=>(Ah(t,n.axis),[e.run(Eh(e,t,n),t)]),nw=e=>Be({axis:e.attributes.getInt("axis",0)}),Ih={name:"Gather",inputNames:["A","B"],inputTypes:[0,0]},Oh=(e,t,n,o)=>{let u=n[0].dims.slice(),l=n[1].dims.slice(),d=new Array(u.length+l.length-1);o=he.normalizeAxis(o,u.length);let c=[];for(let p=0;p<d.length;p++)p<o?(d[p]=u[p],c.push(`inputIdx[${p}] = outputIdx[${p}];`)):p<o+l.length?(d[p]=l[p-o],c.push(`indexDataIdx[${p-o}] = outputIdx[${p}];`)):(d[p]=u[p-l.length+1],c.push(`inputIdx[${p-l.length+1}] = outputIdx[${p}];`));let s=d.length||1,r=u.length,i=l.length||1,a=`
      float process(int outputIdx[${s}]) {
        int inputIdx[${r}];
        int indexDataIdx[${i}];
        indexDataIdx[0] = 0;
        ${c.join(`
        `)}
        int idx = int(_B(indexDataIdx));
        inputIdx[${o}] = idx < 0 ? idx + ${u[o]} : idx;
        return _A(inputIdx);
      }`;return{...t,output:{dims:d,type:n[0].type,textureType:0},shaderSource:a}},Eh=(e,t,n)=>{let o={...Ih,cacheHint:n.cacheKey};return{...o,get:()=>Oh(e,o,t,n.axis)}},Ah=(e,t)=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.");let n=e[0].dims.length;if(n<1)throw new Error("Invalid input shape.");if(t<-n||t>n-1)throw new Error("Invalid axis.");if(Ai.indexOf(e[0].type)===-1)throw new Error("Invaid input type.");if(e[1].type!=="int32"&&e[1].type!=="int16")throw new Error("Invaid input type.")}}),Gu,Js,iw,ow,Ph,kh,Ch,nE=R(()=>{"use strict";nt(),ke(),Ie(),Gu=(e,t,n)=>(Ch(t,n),[e.run(Ph(t,n),t)]),Js=(e,t)=>{let n=e.attributes.getInt("transA",0)!==0,o=e.attributes.getInt("transB",0)!==0,u=e.attributes.getFloat("alpha",1),l=e.attributes.getFloat("beta",1);return Be({transA:n,transB:o,alpha:u,beta:l,isOptionalC:t})},iw=e=>Js(e,!1),ow=e=>Js(e,!0),Ph=(e,t)=>{let n={name:"Gemm",inputNames:e.length===3?["A","B","C"]:["A","B"],inputTypes:e.length===3?[0,0,0]:[0,0],key:t.cacheKey};return{...n,get:()=>kh(n,e,t)}},kh=(e,t,n)=>{let o=t[0].dims.slice(),u=t[1].dims.slice(),[l,d]=k0.getShapeOfGemmResult(o,n.transA,u,n.transB,t.length===3?t[2].dims:void 0),c=[l,d];if(!c)throw new Error("Can't use gemm on the given tensors");let s=o[o.length-1],r="";n.transA&&(s=o[0]),n.transA&&n.transB?r="value += _A_T(a) * _B_T(b);":n.transA&&!n.transB?r="value += _A_T(a) * _B(b);":!n.transA&&n.transB?r="value += _A(a) * _B_T(b);":!n.transA&&!n.transB&&(r="value += _A(a) * _B(b);");let i=c.length,a=t.length===3?`int c[${t[2].dims.length}];`:"",p=t.length===3?"bcastIndices_C(indices, c);":"",h=t.length===3?"value += beta * _C(c);":"",m=`
      float process(int indices[${i}]) {
          int a[${i}];
          int b[${i}];
          ${a}

          copyVec(indices, a);
          copyVec(indices, b);
          ${p}

          float value = 0.0;
          for (int k=0; k<${s}; ++k) {
              a[${i-1}] = k;
              b[${i-2}] = k;
              ${r}
          }

          value = value * alpha;
          ${h}
          return value;
      }`;return{...e,output:{dims:c,type:t[0].type,textureType:0},variables:[{name:"alpha",type:"float",data:n.alpha},{name:"beta",type:"float",data:n.beta}],shaderSource:m}},Ch=(e,t)=>{if(!e)throw new Error("Input is missing");if(t.isOptionalC&&(e.length<2||e.length>3))throw new Error("Invaid input shape.");if(!t.isOptionalC&&e.length!==3)throw new Error("Gemm requires 3 inputs");if(e.length===3&&e[2].dims.length!==1&&e[2].dims.length!==2)throw new Error("Invalid input shape of C");if(e[0].type!=="float32"&&e[0].type!=="float64"||e[1].type!=="float32"&&e[1].type!=="float64"||e.length===3&&e[2].type!=="float32"&&e[2].type!=="float64")throw new Error("Invalid input type.");if(e[0].type!==e[1].type||e.length===3&&e[0].type!==e[2].type)throw new Error("Input types are mismatched")}}),sw,aw,Dh,Rh,Nh,zh,Bh,iE=R(()=>{"use strict";nt(),Ie(),sw=(e,t,n)=>(Bh(t),[e.run(Nh(e,t,n),t)]),aw=e=>{let t=e.attributes.getFloat("scale"),n=e.attributes.getFloats("bias");return Be({scale:t,bias:n})},Dh={name:"ImageScaler",inputNames:["X"],inputTypes:[0]},Rh=(e,t,n,o)=>{let u=n[0].dims.slice(),l=u.length,d=`
      ${zh(o.bias.length)}
      float process(int indices[${l}]) {
        return _X(indices) * scale + getBias(bias, indices[1]);
      }`;return{...t,output:{dims:u,type:n[0].type,textureType:0},variables:[{name:"bias",type:"float",arrayLength:o.bias.length,data:o.bias},{name:"scale",type:"float",data:o.scale}],shaderSource:d}},Nh=(e,t,n)=>{let o={...Dh,cacheHint:n.cacheKey};return{...o,get:()=>Rh(e,o,t,n)}},zh=e=>{let t=[`float getBias(float bias[${e}], int channel) {`];for(let n=0;n<e;++n)n===0?t.push(`	if (channel == ${n}) { return bias[${n}]; }`):n===e-1?t.push(`	else { return bias[${n}]; }`):t.push(`	else if (channel == ${n}) { return bias[${n}]; }`);return t.push("	}"),t.join(`
`)},Bh=e=>{if(!e||e.length!==1)throw new Error("ImageScaler requires 1 input.");if(e[0].dims.length!==4)throw new Error("Invalid input shape.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")}}),uw,lw,Ys,Mh,Fh,jh,Lh,Vh,Uh,oE=R(()=>{"use strict";Ge(),Ie(),uw=(e,t,n)=>{Uh(t);let o=e.run(Fh(t[0]),t);return[e.run(Vh(e,t[0],n,o.dims),[t[0],o,t[1],t[2]])]},lw=e=>e.attributes.getFloat("epsilon",1e-5),Ys={name:"InstanceNormalization_MeanAndVariance",inputNames:["X"],inputTypes:[0]},Mh=(e,t)=>{let n=t.dims.slice(),o=n[1],u=n[2]*n[3],l=[n[0],o],d=`
      vec4 process(int[2] indices) {
        vec4 v = vec4(0.0);
        int a[4];
        a[0] = indices[0];
        a[1] = indices[1];
        float temp = 0.0;
        for(int a2=0; a2<${n[2]}; a2++) {
          a[2] = a2;
          for(int a3=0; a3<${n[3]}; a3++) {
            a[3] = a3;
            float x = _X(a);
            temp += x;
          }
        }
        float mean = temp / float(${u});
        temp = 0.0;
        for(int a2=0; a2<${n[2]}; a2++) {
          a[2] = a2;
          for(int a3=0; a3<${n[3]}; a3++) {
            a[3] = a3;
            float x = _X(a);
            temp += (x - mean) * (x - mean);
          }
        }
        v.r = mean;
        v.g = temp / float(${u});

        return v;
      }`;return{...e,output:{dims:l,type:t.type,textureType:4},shaderSource:d}},Fh=e=>({...Ys,get:()=>Mh(Ys,e)}),jh={name:"InstanceNormalization_ComputeOutput",inputNames:["X","MeanAndVariance","Scale","B"],inputTypes:[0,4,0,0]},Lh=(e,t,n,o,u)=>{let l=Te(e.session.backend.glContext.version),[d,c]=e.calculateTextureWidthAndHeight(u,4),[s,r]=[d/4,c],i=`
      vec4 get_MeanAndVariance(int[2] mv) {
        int offset = indicesToOffset_MeanAndVariance(mv);
        vec2 coords = offsetToCoords(offset, ${s}, ${r});
        return ${l.texture2D}(MeanAndVariance, coords);
      }

      float process(int[4] indices) {
        int mv[2];
        mv[0] = indices[0];
        mv[1] = indices[1];
        vec4 mean_and_variance = get_MeanAndVariance(mv);
        float mean = mean_and_variance.r;
        float variance = mean_and_variance.g;

        int sb[1];
        sb[0] = indices[1];
        float scale = _Scale(sb);
        float b = _B(sb);

        return scale * (_X(indices) - mean) / sqrt(variance + epsilon) + b;
      }`;return{...t,output:{dims:n.dims,type:n.type,textureType:0},variables:[{name:"epsilon",type:"float",data:o}],shaderSource:i}},Vh=(e,t,n,o)=>{let u={...jh,cacheHint:`${n}`};return{...u,get:()=>Lh(e,u,t,n,o)}},Uh=e=>{if(!e||e.length!==3)throw new Error("InstanceNormalization requires 3 inputs.");let t=e[0],n=e[1],o=e[2];if(t.dims.length<3||n.dims.length!==1||o.dims.length!==1)throw new Error("Invalid input shape.");if(n.dims[0]!==t.dims[1]||o.dims[0]!==t.dims[1])throw new Error("Input shapes are mismatched.");if(t.type!=="float32"&&t.type!=="float64"||n.type!=="float32"&&n.type!=="float64"||o.type!=="float32"&&o.type!=="float64")throw new Error("Invalid input type.");if(e[0].dims.length!==4)throw new Error("Only support 4-D input shape.")}});function sE(e,t){let n=e[0].dims[1],o=e[0].dims.length,u=-Math.floor((t.size-1)/2),l=Math.ceil((t.size-1)/2),d=`float(${t.alpha}) / float(${t.size})`,c=`float(${t.bias})`,s=`float(${t.beta})`,r=`
    float process(int indices[${o}]) {
        int c = indices[1];
        float x = _X(indices);
        float square_sum = 0.0;

        for (int i = ${u}; i <= ${l}; i++) {
          int idx = c + i;
          if (c >= 0 && c < ${n}) {
            indices[1] = idx;
            float j = _X(indices);
            square_sum += j * j;
          }
        }
        return x / pow(${c} + ${d} * square_sum, ${s});
    }`;return{...Ol,cacheHint:t.cacheKey,output:{dims:e[0].dims,type:e[0].type,textureType:0},shaderSource:r}}function aE(e,t){return{...Ol,cacheHint:t.cacheKey,get:()=>sE(e,t)}}var dw,cw,Ol,Gh,uE=R(()=>{"use strict";nt(),Ie(),dw=(e,t,n)=>(Gh(t),[e.run(aE(t,n),t)]),cw=e=>{let t=e.attributes.getFloat("alpha",1e-4),n=e.attributes.getFloat("beta",.75),o=e.attributes.getFloat("bias",1),u=e.attributes.getInt("size");return Be({alpha:t,beta:n,bias:o,size:u})},Ol={name:"LRN",inputNames:["X"],inputTypes:[0]},Gh=e=>{if(!e||e.length!==1)throw new Error("LRN requires 1 input.");if(e[0].dims.length!==4)throw new Error('currently only support LRN for input with "NCHW" format');if(e[0].type!=="float32")throw new Error("input should be float type")}}),qh,qu,pw,hw,fw,Hh,Wh,Kh,Xh,Zh,Jh,Yh,Qh,lE=R(()=>{"use strict";nt(),ke(),Ge(),Ie(),qh={name:"Pad",inputNames:["A"],inputTypes:[0]},qu=(e,t,n)=>(Kh(t),[e.run({...qh,cacheHint:n.cacheKey,get:()=>Wh(e,t[0],n)},t)]),pw=e=>{let t=e.attributes.getString("mode","constant"),n=e.attributes.getFloat("value",0),o=e.attributes.getInts("pads");return Be({mode:t,value:n,pads:o})},hw=(e,t,n)=>{Xh(t);let o=Hh(e,t,n);return qu(e,[t[0]],o)},fw=e=>e.attributes.getString("mode","constant"),Hh=(e,t,n)=>{if(!e.session.isInitializer(t[1].dataId)||t.length>=3&&!e.session.isInitializer(t[2].dataId))throw new Error("dynamic pad attributes are not allowed");let o=Array.from(t[1].integerData),u=t.length>=3?t[2].floatData[0]:0;return Be({mode:n,pads:o,value:u})},Wh=(e,t,n)=>{let o=he.padShape(t.dims.slice(),n.pads),u=o.length,l=`
      ${Zh(e,t,n)}
      float process(int[${u}] indices) {
          return padA(indices);
      }`;return{name:"Pad",inputNames:["A"],inputTypes:[0],output:{dims:o,type:t.type,textureType:0},shaderSource:l}},Kh=e=>{if(!e||e.length!==1)throw new Error("Pad requires 1 input");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")},Xh=e=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Pad requires 2 or 3 inputs");if(e[1].type!=="int32")throw new Error("Invalid input type.");if(e.length>=3&&e[2].type==="string")throw new Error("Invalid input type.")},Zh=(e,t,n)=>{let o=Te(e.session.backend.glContext.version),[u,l]=e.calculateTextureWidthAndHeight(t.dims,0),d=he.computeStrides(t.dims);switch(n.mode){case"constant":return Jh(o,t.dims,d,u,l,n.pads,n.value);case"reflect":return Yh(o,t.dims,d,u,l,n.pads);case"edge":return Qh(o,t.dims,d,u,l,n.pads);default:throw new Error("Invalid mode")}},Jh=(e,t,n,o,u,l,d)=>{let c=t.length,s="";for(let r=c-1;r>=0;--r)s+=`
        k = m[${r}] - ${l[r]};
        if (k < 0)  return constant;
        if (k >= ${t[r]}) return constant;
        offset += k * ${n[r]};
        `;return`
      float padA(int m[${c}]) {
        const float constant = float(${d});
        int offset = 0;
        int k = 0;
        ${s}
        vec2 coords = offsetToCoords(offset, ${o}, ${u});
        float value = getColorAsFloat(${e.texture2D}(A, coords));
        return value;
      }
      `},Yh=(e,t,n,o,u,l)=>{let d=t.length,c="";for(let s=d-1;s>=0;--s)c+=`
        k = m[${s}] - ${l[s]};
        if (k < 0) { k = -k; }
        {
          const int _2n_1 = ${2*(t[s]-1)};
          k = int( mod( float(k), float(_2n_1) ) ) ;
          if(k >= ${t[s]}) { k = _2n_1 - k; }
        }
        offset += k * ${n[s]};
        `;return`
      float padA(int m[${d}]) {
        int offset = 0;
        int k = 0;
        ${c}
        vec2 coords = offsetToCoords(offset, ${o}, ${u});
        float value = getColorAsFloat(${e.texture2D}(A, coords));
        return value;
      }
      `},Qh=(e,t,n,o,u,l)=>{let d=t.length,c="";for(let s=d-1;s>=0;--s)c+=`
        k = m[${s}] - ${l[s]};
        if (k < 0)  k = 0;
        if (k >= ${t[s]}) k = ${t[s]-1};
        offset += k * ${n[s]};
      `;return`
      float padA(int m[${d}]) {
        int offset = 0;
        int k = 0;
        ${c}
        vec2 coords = offsetToCoords(offset, ${o}, ${u});
        float value = getColorAsFloat(${e.texture2D}(A, coords));
        return value;
      }
      `}}),mw,gw,Qs,bw,yw,_w,ww,ea,ta,ef,ra,vw,Jn,na,Yn,tf,dE=R(()=>{"use strict";nt(),ke(),Ie(),mw=(e,t,n)=>{Jn(t);let o={name:"AveragePool",inputNames:["X"],inputTypes:[0],cacheHint:n.cacheKey};return[e.run({...o,get:()=>Qs(t,o,!1,n)},t)]},gw=e=>{let t=e.attributes.getString("auto_pad","NOTSET"),n=e.attributes.getInt("ceil_mode",0),o=e.attributes.getInt("count_include_pad",0)!==0,u=e.attributes.getInts("kernel_shape"),l=e.attributes.getInts("strides",[]),d=e.attributes.getInts("pads",[]);if(n!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");return Be({autoPad:t,ceilMode:n,countIncludePad:o,kernelShape:u,strides:l,pads:d})},Qs=(e,t,n,o)=>{let[u,l]=ta(e,o,n),d=he.size(u.kernelShape),c="value += _X(x);",s="";u.countIncludePad?s+=`value /= float(${d});`:s+=`value /= float(${d} - pad);`;let r=`
        ${na(e[0].dims,u,c,s,"0.0")}
      `;return{...t,output:{dims:l,type:e[0].type,textureType:0},shaderSource:r}},bw=(e,t,n)=>{Jn(t);let o={name:"GlobalAveragePool",inputNames:["X"],inputTypes:[0],cacheHint:`${n.countIncludePad}`};return[e.run({...o,get:()=>Qs(t,o,!0,n)},t)]},yw=e=>{let t=e.attributes.getInt("count_include_pad",0)!==0;return Be({autoPad:"",ceilMode:0,countIncludePad:t,kernelShape:[],strides:[],pads:[]})},_w=(e,t,n)=>{Jn(t);let o={name:"MaxPool",inputNames:["X"],inputTypes:[0],cacheHint:n.cacheKey};return[e.run({...o,get:()=>ea(t,o,!1,n)},t)]},ww=e=>{let t=e.attributes.getString("auto_pad","NOTSET"),n=e.attributes.getInt("ceil_mode",0),o=e.attributes.getInts("kernel_shape"),u=e.attributes.getInts("strides",[]),l=e.attributes.getInts("pads",[]),d=e.attributes.getInt("storage_order",0),c=e.attributes.getInts("dilations",[]);if(d!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");return Be({autoPad:t,ceilMode:n,countIncludePad:!1,kernelShape:o,strides:u,pads:l,storageOrder:d,dilations:c})},ea=(e,t,n,o)=>{let[u,l]=ta(e,o,n),d=`
      ${na(e[0].dims,u,`
      value = max(_X(x), value);
    `,"","-1e5")}
    `;return{...t,output:{dims:l,type:e[0].type,textureType:0},shaderSource:d}},ta=(e,t,n)=>{let o=e[0].dims.slice(),u=Object.hasOwnProperty.call(t,"dilations"),l=t.kernelShape.slice(),d=t.strides.slice(),c=u?t.dilations.slice():[],s=t.pads.slice();$o.adjustPoolAttributes(n,o,l,d,c,s);let r=$o.computePoolOutputShape(n,o,d,c,l,s,t.autoPad),i=Object.assign({},t);return u?Object.assign(i,{kernelShape:l,strides:d,pads:s,dilations:c,cacheKey:t.cacheKey}):Object.assign(i,{kernelShape:l,strides:d,pads:s,cacheKey:t.cacheKey}),[i,r]},ef={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[],cacheKey:""},ra={name:"GlobalMaxPool",inputNames:["X"],inputTypes:[0]},vw=(e,t)=>(Jn(t),[e.run({...ra,get:()=>ea(t,ra,!0,ef)},t)]),Jn=e=>{if(!e||e.length!==1)throw new Error("Pool ops requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")},na=(e,t,n,o,u)=>{let l=e.length;if(t.kernelShape.length<=2){let d=t.kernelShape[t.kernelShape.length-1],c=t.strides[t.strides.length-1],s=t.pads[t.pads.length/2-1],r=t.pads[t.pads.length-1],i=e[l-1],a="",p="",h="";if(s+r!==0?a=`
          for (int i = 0; i < ${d}; i++) {
            x[${l} - 1] = indices[${l} - 1] * ${c} - ${s} + i;
            if (x[${l} - 1] < 0 || x[${l} - 1] >= ${i}) {
              pad++;
              continue;
            }
            ${n}
          }`:a=`
          for (int i = 0; i < ${d}; i++) {
            x[${l} - 1] = indices[${l} - 1] * ${c} - ${s} + i;
            ${n}
          }`,t.kernelShape.length===2){let m=t.kernelShape[t.kernelShape.length-2],b=t.strides[t.strides.length-2],x=t.pads[t.pads.length/2-2],_=t.pads[t.pads.length-2],y=e[l-2];x+_!==0?p=`
            for (int j = 0; j < ${m}; j++) {
              x[${l} - 2] = indices[${l} - 2] * ${b} - ${x} + j;
              if (x[${l} - 2] < 0 || x[${l} - 2] >= ${y}) {
                pad+= ${d};
                continue;
              }
          `:p=`
            for (int j = 0; j < ${m}; j++) {
              x[${l} - 2] = indices[${l} - 2] * ${b} - ${x} + j;
            `,h=`
          }
        `}return`
        float process(int indices[${l}]) {
          int x[${l}];
          copyVec(indices, x);

          float value = ${u};
          int pad = 0;
          ${p}
          ${a}
          ${h}
          ${o}
          return value;
        }
      `}else{let d=he.size(t.kernelShape),c=he.computeStrides(t.kernelShape),s=c.length,r=t.pads.length,i=tf(s),a=Yn(e,"inputDims"),p=Yn(t.pads,"pads"),h=Yn(c,"kernelStrides"),m=Yn(t.strides,"strides"),b=t.pads.reduce((_,y)=>_+y),x="";return b?x=`
            if (x[j] >= inputDims[j] || x[j] < 0) {
              pad++;
              isPad = true;
              break;
            }
          }
          if (!isPad) {
            ${n}
          }`:x=`
          }
          ${n}
        `,`
        ${i}
        float process(int indices[${l}]) {
          int x[${l}];
          copyVec(indices, x);
          int offset[${s}];
          int pads[${r}];
          int inputDims[${l}];
          int kernelStrides[${s}];
          int strides[${s}];
          ${p}
          ${a}
          ${m}
          ${h}

          float value = ${u};
          int pad = 0;
          bool isPad = false;
          for (int i = 0; i < ${d}; i++) {
            offsetToIndices(i, kernelStrides, offset);
            isPad = false;
            for (int j = ${l} - ${s}; j < ${l}; j++) {
              x[j] = indices[j] * strides[j - ${l} + ${s}]
                + offset[j - ${l} + ${s}] - pads[j - 2];
              ${x}
          }
          ${o}

          return value;
        }
      `}},Yn=(e,t)=>{let n="";for(let o=0;o<e.length;o++)n+=`
      ${t}[${o}] = ${e[o]};
    `;return n},tf=e=>`
  void offsetToIndices(int offset, int[${e}] strides, out int[${e}] indices) {
    if (${e} == 0) {
      return;
    }
    for (int i = 0; i < ${e} - 1; ++i) {
      indices[i] = offset / strides[i];
      offset -= indices[i] * strides[i];
    }
    indices[${e} - 1] = offset;
  }`}),ur,br,rf,nf,xw,$w,Tw,Sw,Iw,Ow,Ew,cE=R(()=>{"use strict";nt(),jo(),ke(),Ie(),ur=(e,t,n,o,u)=>{nf(t);let l={name:o,inputNames:["A"],inputTypes:[0]};return[e.run({...l,cacheHint:n.cacheKey,get:()=>rf(e,t,n,o,u,l)},t)]},br=e=>{let t=e.attributes.getInts("axes",[]),n=e.attributes.getInt("keepdims",1)===1;return Be({axes:t,keepDims:n})},rf=(e,t,n,o,u,l)=>{let d=[],c=t[0].dims.length||1,s=[],r=he.normalizeAxes(n.axes,t[0].dims.length),i=u(t,r),a=i[1];for(let h=0;h<t[0].dims.length;h++)r.indexOf(h)>=0||r.length===0?(n.keepDims&&d.push(1),a=`
          for(int j${h} = 0; j${h} < ${t[0].dims[h]}; j${h}++) {
            inputIdx[${h}] = j${h};
            ${a}
          }`):(s.push(`inputIdx[${h}] = outputIdx[${d.length}];`),d.push(t[0].dims[h]));let p=`
      float process(int outputIdx[${d.length||1}]) {
        float value;                 // final result
        int inputIdx[${c}];      // addressing input data
        ${s.join(`
`)}
        ${i[0]}       // init ops for reduce max/min
        ${a}
        ${i[2]}       // final computation for reduce mean
        return value;
      }`;return{...l,output:{dims:d,type:t[0].type,textureType:0},shaderSource:p}},nf=e=>{if(!e||e.length!==1)throw new Error("Reduce op requires 1 input.");if(Ai.indexOf(e[0].type)===-1)throw new Error("Invalid input type.")},xw=(e,t,n)=>ur(e,t,n,"ReduceSum",()=>["value = 0.0;","value += _A(inputIdx);",""]),$w=(e,t,n)=>ur(e,t,n,"ReduceMean",(o,u)=>{let l=1;for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&(l*=o[0].dims[d]);return["value = 0.0;","value += _A(inputIdx);",`value /= ${l}.;`]}),Tw=(e,t,n)=>ur(e,t,n,"ReduceMax",(o,u)=>{let l=[];for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`inputIdx[${d}] = 0;`);return[`${l.join(`
`)}
value = _A(inputIdx);`,"value = max(value, _A(inputIdx));",""]}),Sw=(e,t,n)=>ur(e,t,n,"ReduceMin",(o,u)=>{let l=[];for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`inputIdx[${d}] = 0;`);return[`${l.join(`
`)}
value = _A(inputIdx);`,"value = min(value, _A(inputIdx));",""]}),Iw=(e,t,n)=>ur(e,t,n,"ReduceProd",()=>["value = 1.0;","value *= _A(inputIdx);",""]),Ow=(e,t,n)=>ur(e,t,n,"ReduceLogSum",()=>["value = 0.0;","value += _A(inputIdx);","value = log(value);"]),Ew=(e,t,n)=>ur(e,t,n,"ReduceLogSumSquare",()=>["float t; value = 0.0;","t = _A(inputIdx); value += t * t;",""])}),Aw,pE=R(()=>{"use strict";ke(),Aw=(e,t)=>{let n=he.calculateReshapedDims(t[0].dims,t[1].integerData);return e.session.pack?[e.reshapePacked(t[0],n)]:[e.reshapeUnpacked(t[0],n)]}}),ia,Hu,Pw,kw,wi,of,Wu,So,Cw=R(()=>{"use strict";nt(),Ge(),Ie(),ia={name:"Upsample",inputNames:["X"],inputTypes:[0]},Hu=(e,t,n)=>(Wu(t,n),[e.run({...ia,cacheHint:n.cacheKey,get:()=>of(e,t,n)},t)]),Pw=e=>wi(e,7),kw=e=>wi(e,9),wi=(e,t)=>{let n=t>=10,o=e.attributes.getString("mode","nearest");if(o!=="nearest"&&o!=="linear"&&(t<11||o!=="cubic"))throw new Error(`unrecognized mode: ${o}`);let u=[];t<9&&(u=e.attributes.getFloats("scales"),So(u,o,n));let l=e.attributes.getFloat("extrapolation_value",0),d=t>10?e.attributes.getString("coordinate_transformation_mode","half_pixel"):"asymmetric";if(["asymmetric","pytorch_half_pixel","tf_half_pixel_for_nn","align_corners","tf_crop_and_resize","half_pixel"].indexOf(d)===-1)throw new Error(`coordinate_transform_mode '${d}' is not supported`);let c=d==="tf_crop_and_resize",s=c,r=o==="nearest"&&t>=11?e.attributes.getString("nearest_mode","round_prefer_floor"):"";if(["round_prefer_floor","round_prefer_ceil","floor","ceil",""].indexOf(r)===-1)throw new Error(`nearest_mode '${r}' is not supported`);let i=e.attributes.getFloat("cubic_coeff_a",-.75),a=e.attributes.getInt("exclude_outside",0)!==0;if(a&&o!=="cubic")throw new Error("exclude_outside can be set to 1 only when mode is CUBIC.");let p=t<11?!0:o==="nearest"&&d==="asymmetric"&&r==="floor",h=0,m=0,b=0;return t>10?e.inputs.length>2?(h=1,m=2,b=3):(m=1,b=2):t===9&&(m=1),Be({opset:t,isResize:n,mode:o,scales:u,extrapolationValue:l,coordinateTransformMode:d,useExtrapolation:s,needRoiInput:c,nearestMode:r,cubicCoefficientA:i,excludeOutside:a,useNearest2xOptimization:p,roiInputIdx:h,scalesInputIdx:m,sizesInputIdx:b})},of=(e,t,n)=>{let o=Te(e.session.backend.glContext.version),[u,l]=e.calculateTextureWidthAndHeight(t[0].dims,0),d=t[0].dims.map((b,x)=>Math.floor(b*n.scales[x])),[c,s]=e.calculateTextureWidthAndHeight(d,0),r=d.length,i=new Array(r),a=new Array(r),p=`
      int output_pitches[${r}];
      int input_pitches[${r}];
      `;for(let b=r-1;b>=0;b--)i[b]=b===r-1?1:i[b+1]*d[b+1],a[b]=b===r-1?1:a[b+1]*t[0].dims[b+1],p+=`
        output_pitches[${b}] = ${i[b]};
        input_pitches[${b}] = ${a[b]};
        `;let h=`
      float getInputFloat(int index) {
        vec2 coords = offsetToCoords(index, ${u}, ${l});
        float value = getColorAsFloat(${o.texture2D}(X, coords));
        return value;
      }
      `,m=n.mode==="nearest"?`
    ${h}
    float process(int indices[${r}]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${c}, ${s});

      ${p}

      int d, m;
      for (int dim = 0; dim < ${r}; ++dim) {
        d = output_index / output_pitches[dim];
        m = output_index - d * output_pitches[dim];
        output_index = m;

        if (scales[dim] != 1 && d > 0) {
          int d2 = d / scales[dim];
          m = d - d2 * scales[dim];
          d = d2;
        }
        input_index += input_pitches[dim] * d;
      }

      return getInputFloat(input_index);
    }`:r===4?`
    ${h}
    float process(int indices[4]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${c}, ${s});

      ${p}

      int m;
      int index_of_dim0, index_of_dim1, index_of_dim2, index_of_dim3;
      index_of_dim0 = output_index / output_pitches[0];
      m = output_index - index_of_dim0 * output_pitches[0];
      index_of_dim1 = m / output_pitches[1];
      m = m - index_of_dim1 * output_pitches[1];
      index_of_dim2 = m / output_pitches[2];
      m = m - index_of_dim2 * output_pitches[2];
      index_of_dim3 = m;

      int index_of_input_dim2, index_of_input_dim3, x_offset, y_offset;
      index_of_input_dim2 = index_of_dim2 / scales[2];
      y_offset = index_of_dim2 - index_of_input_dim2 * scales[2];
      index_of_input_dim3 = index_of_dim3 / scales[3];
      x_offset = index_of_dim3 - index_of_input_dim3 * scales[3];

      input_index = index_of_dim0 * input_pitches[0] +
            index_of_dim1 * input_pitches[1] +
            index_of_input_dim2 * input_pitches[2] +
            index_of_input_dim3;

      float x00 = getInputFloat(input_index);
      float x10, x01, x11;

      bool end_of_dim2 = false;
      if (index_of_input_dim2 == (${t[0].dims[2]} - 1)) {
        // It's the end in dimension 2
        x01 = x00;
        end_of_dim2 = true;
      } else {
        x01 = getInputFloat(input_index + input_pitches[2]);
      }

      if (index_of_input_dim3 == (input_pitches[2] - 1)) {
        // It's the end in dimension 3
        x10 = x00;
        x11 = x01;
      }
      else {
        x10 = getInputFloat(input_index + 1);
        x11 = end_of_dim2 ? x10 : getInputFloat(input_index + input_pitches[2] + 1);
      }

      float y0 = x00 + float(y_offset) * (x01 - x00) / float(scales[2]);
      float y1 = x10 + float(y_offset) * (x11 - x10) / float(scales[2]);
      return y0 + float(x_offset) * (y1 - y0) / float(scales[3]);
    }`:`
    ${h}
    float process(int indices[2]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${c}, ${s});

      ${p}

      int m;
      int index_of_dim0, index_of_dim1;
      index_of_dim0 = output_index / output_pitches[0];
      m = output_index - index_of_dim0 * output_pitches[0];
      index_of_dim1 = m;

      int index_of_input_dim0, index_of_input_dim1, x_offset, y_offset;
      index_of_input_dim0 = index_of_dim0 / scales[0];
      y_offset = index_of_dim0 - index_of_input_dim0 * scales[0];
      index_of_input_dim1 = index_of_dim1 / scales[1];
      x_offset = index_of_dim1 - index_of_input_dim1 * scales[1];

      input_index = index_of_input_dim0 * input_pitches[0] + index_of_input_dim1;

      float x00 = getInputFloat(input_index);
      float x10, x01, x11;

      bool end_of_dim0 = false;
      if (index_of_input_dim0 == (${t[0].dims[0]} - 1)) {
        // It's the end in dimension 0
        x01 = x00;
        end_of_dim0 = true;
      } else {
        x01 = getInputFloat(input_index + input_pitches[0]);
      }

      if (index_of_input_dim1 == (input_pitches[0] - 1)) {
        // It's the end in dimension 1
        x10 = x00;
        x11 = x01;
      }
      else {
        x10 = getInputFloat(input_index + 1);
        x11 = end_of_dim0 ? x10 : getInputFloat(input_index + input_pitches[0] + 1);
      }

      float y0 = x00 + float(y_offset) * (x01 - x00) / float(scales[0]);
      float y1 = x10 + float(y_offset) * (x11 - x10) / float(scales[0]);
      return y0 + float(x_offset) * (y1 - y0) / float(scales[1]);
    }`;return{...ia,output:{dims:d,type:t[0].type,textureType:0},shaderSource:m,variables:[{name:"scales",type:"int",arrayLength:n.scales.length,data:n.scales.map(b=>Math.ceil(b))}]}},Wu=(e,t)=>{if(!e||t.opset<9&&e.length!==1||t.opset>=9&&t.opset<11&&e.length!==2||t.opset>=11&&e.length<2)throw new Error("invalid inputs.");if(t.scales.length>0&&e[0].dims.length!==t.scales.length)throw new Error("Invalid input shape.");if(e[0].type==="string")throw new Error("Invalid input tensor types.")},So=(e,t,n)=>{if(n){for(let o of e)if(o<=0)throw new Error("Scale value should be greater than 0.")}else for(let o of e)if(o<1)throw new Error("Scale value should be greater than or equal to 1.");if((t==="linear"||t==="cubic")&&e.length!==2&&(e.length!==4||e[0]!==1||e[1]!==1))throw new Error(`'Linear' mode and 'Cubic' mode only support 2-D inputs ('Bilinear', 'Bicubic')         or 4-D inputs with the corresponding outermost 2 scale values being 1         in the ${n?"Resize":"Upsample"} opeartor.`)}}),to,Ku,Dw,Rw,sf,af,uf,lf,hE=R(()=>{"use strict";Ge(),Ie(),Yt(),An(),Cw(),to={name:"Resize",inputNames:["A"],inputTypes:[2]},Ku=(e,t,n)=>(Wu(t,n),[e.run({...to,cacheHint:n.cacheKey,get:()=>sf(e,t,n)},t)]),Dw=e=>wi(e,10),Rw=e=>wi(e,11),sf=(e,t,n)=>{let o=Te(e.session.backend.glContext.version),[u,l]=af(t,n);if(u.every(y=>y===1)&&n.coordinateTransformMode!=="tf_crop_and_resize")return{...to,output:{dims:l,type:t[0].type,textureType:2},hasMain:!0,shaderSource:`void main() {
                    vec4 v = ${o.texture2D}(X, TexCoords);
                    ${o.output} = v;
                }`};let d=l.length;if(d<2)throw new Error(`output dimension should be at least 2, but got ${d}`);let c=l[d-2],s=l[d-1],r=t[0].dims;if(d!==r.length)throw new Error(`output dimension should match input ${r.length}, but got ${d}`);let i=r[d-2],a=r[d-1],p=u[d-2],h=u[d-1],m="";if(n.mode!=="linear")throw new Error(`resize (packed) does not support mode: '${n.mode}'`);switch(n.coordinateTransformMode){case"asymmetric":m=`
                    vec4 getSourceFracIndex(ivec4 coords) {
                        return vec4(coords) / scaleWHWH;
                    }
                `;break;case"half_pixel":m=`
                    vec4 getSourceFracIndex(ivec4 coords) {
                        return (vec4(coords) + 0.5) / scaleWHWH - 0.5;
                    }
                `;break;case"pytorch_half_pixel":m=`
                    vec4 getSourceFracIndex(ivec4 coords) {
                        vec4 fcoords = vec4(coords);
                        return vec4(
                            ${s}.0 > 1.0 ? (fcoords.x + 0.5) / scaleWHWH.x - 0.5 : 0.0,
                            ${c}.0 > 1.0 ? (fcoords.y + 0.5) / scaleWHWH.y - 0.5 : 0.0,
                            ${s}.0 > 1.0 ? (fcoords.z + 0.5) / scaleWHWH.z - 0.5 : 0.0,
                            ${c}.0 > 1.0 ? (fcoords.w + 0.5) / scaleWHWH.w - 0.5 : 0.0
                          );
                    }
                `;break;case"align_corners":m=`
                    vec4 getSourceFracIndex(ivec4 coords) {
                        vec4 resized = vec4(${s}.0 - 1.0, ${c}.0 - 1.0, ${s}.0 - 1.0,
                            ${c}.0 - 1.0);
                        vec4 original = vec4(${a}.0 - 1.0, ${i}.0 - 1.0, ${a}.0 - 1.0,
                            ${i}.0 - 1.0);
                        vec4 new_scale = original / resized;
                        return vec4(coords) * new_scale;
                    }
                `;break;default:throw new Error(`resize (packed) does not support coordinateTransformMode:                                 '${n.coordinateTransformMode}'`)}let b=_r(d),x=Oi(),_=`
            const vec2 inputWH = vec2(${i}.0, ${a}.0);
            const vec4 scaleWHWH = vec4(float(${p}), float(${h}), float(${p}), float(${h}));
            ${x}
            ${m}
            float getAValue(int x10, int r, int c, int d) {
                return getChannel(getA(x10, r, c, d), vec2(c, d));
            }
            void main() {
                ${b} rc = getOutputCoords();

                int batch = rc[0];
                int depth = rc[1];

                // retrieve the 4 coordinates that is used in the 4 packed output values.
                ivec4 coords = ivec4(rc.wz, rc.w + 1, rc.z + 1);

                // calculate the source index in fraction
                vec4 sourceFrac = getSourceFracIndex(coords);

                // get the lower and upper bound of the 4 values that will be packed into one texel.
                ivec4 x00 = ivec4(max(sourceFrac.xy, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.xy)));
                ivec4 x01 = ivec4(max(sourceFrac.xw, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.xw)));
                ivec4 x10 = ivec4(max(sourceFrac.zy, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.zy)));
                ivec4 x11 = ivec4(max(sourceFrac.zw, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.zw)));

                bool hasNextRow = rc.w < ${c-1};
                bool hasNextCol = rc.z < ${s-1};

                // pack x00, x01, x10, x11's top-left corner into one vec4 structure
                vec4 topLeft = vec4(
                    getAValue(batch, depth, x00.x, x00.y),
                    hasNextCol ? getAValue(batch, depth, x01.x, x01.y) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.x, x10.y) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.x, x11.y) : 0.0);

                // pack x00, x01, x10, x11's top-right corner into one vec4 structure
                vec4 topRight = vec4(
                    getAValue(batch, depth, x00.x, x00.w),
                    hasNextCol ? getAValue(batch, depth, x01.x, x01.w) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.x, x10.w) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.x, x11.w) : 0.0);

                // pack x00, x01, x10, x11's bottom-left corner into one vec4 structure
                vec4 bottomLeft = vec4(
                    getAValue(batch, depth, x00.z, x00.y),
                    hasNextCol ? getAValue(batch, depth, x01.z, x01.y) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.z, x10.y) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.z, x11.y) : 0.0);

                // pack x00, x01, x10, x11's bottom-right corner into one vec4 structure
                vec4 bottomRight = vec4(
                    getAValue(batch, depth, x00.z, x00.w),
                    hasNextCol ? getAValue(batch, depth, x01.z, x01.w) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.z, x10.w) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.z, x11.w) : 0.0);

                // calculate the interpolation fraction on u and v direction
                vec4 frac = vec4(sourceFrac) - floor(sourceFrac);
                vec4 clampFrac = clamp(frac, vec4(0.0), vec4(1.0));

                vec4 top = mix(topLeft, topRight, clampFrac.ywyw);
                vec4 bottom = mix(bottomLeft, bottomRight, clampFrac.ywyw);
                vec4 newValue = mix(top, bottom, clampFrac.xxzz);

                ${o.output} = vec4(newValue);
            }
        `;return{...to,output:{dims:l,type:t[0].type,textureType:2},hasMain:!0,shaderSource:_}},af=(e,t)=>{let n=e[0].dims,o=t.scales,u;if(o.length===0){let d=e[t.scalesInputIdx];if(d&&d.size!==0){if(e[t.sizesInputIdx])throw new Error("Only one of scales or sizes must be provided as input.");o=uf(d,t.mode,t.isResize)}else{let c=e[t.sizesInputIdx];if(!c||c.size===0)throw new Error("Either scales or sizes MUST be provided as input.");u=Array.from(c.integerData),o=lf(u,n,t.mode,t.isResize)}}else if(e[t.sizesInputIdx])throw new Error("Only one of scales or sizes must be provided as input.");let l=u||n.map((d,c)=>Math.floor(d*o[c]));return[o,l]},uf=(e,t,n)=>{let o=Array.from(e.floatData);return So(o,t,n),o},lf=(e,t,n,o)=>{let u=t.length,l=new Array(u);for(let d=0,c=u;d<c;d++)if(t[d]===0){if(e[d]!==0)throw new Error("Input dim is zero but required output dim is non-zero.");l[d]=1}else l[d]=e[d]/t[d];return So(l,n,o),l}}),Nw,df,fE=R(()=>{"use strict";En(),Nw=(e,t)=>(df(t),[new gt([t[0].dims.length],"int32",void 0,void 0,new Int32Array(t[0].dims))]),df=e=>{if(!e||e.length!==1)throw new Error("Shape requires 1 input.")}}),ro,zw,Bw,oa,cf,Mw,pf,hf,mE=R(()=>{"use strict";nt(),jo(),ke(),Ie(),ro={name:"Slice",inputNames:["A"],inputTypes:[0]},zw=(e,t,n)=>(cf(t),[e.run({...ro,cacheHint:n.cacheKey,get:()=>oa(e,t[0],n)},t)]),Bw=e=>{let t=e.attributes.getInts("starts"),n=e.attributes.getInts("ends"),o=e.attributes.getInts("axes",[]);return Be({starts:t,ends:n,axes:o})},oa=(e,t,n)=>{let o=n.axes.length===0?t.dims.slice(0).map((i,a)=>a):n.axes,u=he.normalizeAxes(o,t.dims.length),l=n.starts.map((i,a)=>i>t.dims[u[a]]-1?t.dims[u[a]]:he.normalizeAxis(i,t.dims[u[a]])),d=n.ends.map((i,a)=>i>t.dims[u[a]]-1?t.dims[u[a]]:he.normalizeAxis(i,t.dims[u[a]])),c=t.dims.slice(),s=[];for(let i=0;i<u.length;i++)c[u[i]]=d[i]-l[i],l[i]>0&&s.push(`outputIdx[${u[i]}] += ${l[i]};`);let r=`
      float process(int outputIdx[${c.length}]) {
        ${s.join(`
      `)}
        return _A(outputIdx);
      }`;return{...ro,output:{dims:c,type:t.type,textureType:0},shaderSource:r}},cf=e=>{if(!e||e.length!==1)throw new Error("Slice requires 1 input.");if(Ai.indexOf(e[0].type)===-1)throw new Error("Invalid input type.")},Mw=(e,t)=>{hf(t);let n=pf(e,t);return[e.run({...ro,cacheHint:n.cacheKey,get:()=>oa(e,t[0],n)},[t[0]])]},pf=(e,t)=>{if(!e.session.isInitializer(t[1].dataId)||!e.session.isInitializer(t[2].dataId)||t.length>=4&&!e.session.isInitializer(t[3].dataId)||t.length>=5&&!e.session.isInitializer(t[4].dataId))throw new Error("dynamic slice attributes are not allowed");if(t.length>=5&&t[4].integerData.some(d=>d!==1))throw new Error("currently non-1 steps is not supported for Slice");let n=Array.from(t[1].integerData),o=Array.from(t[2].integerData),u=t.length>=4?Array.from(t[3].integerData):[],l=`${u};${n};${o}`;return{starts:n,ends:o,axes:u,cacheKey:l}},hf=e=>{if(!e||e.length<3||e.length>5)throw new Error("Invalid input number.");if(e[1].type!=="int32"||e[1].dims.length!==1)throw new Error("Invalid input type.");if(e[2].type!=="int32"||e[2].dims.length!==1)throw new Error("Invalid input type.");if(e.length>=4&&(e[3].type!=="int32"||e[3].dims.length!==1))throw new Error("Invalid input type.");if(e.length>=5&&(e[4].type!=="int32"||e[4].dims.length!==1))throw new Error("Invalid input type.")}}),sa,aa,ua,Fw,jw,Lw,Vw,la,ff,mf,gf,da,gE=R(()=>{"use strict";nt(),ke(),Ge(),Ie(),Il(),sa={name:"SoftmaxComputeMax",inputNames:["A"],inputTypes:[0]},aa={name:"SoftmaxComputeScale",inputNames:["A","Max"],inputTypes:[0,0]},ua={name:"SoftMax",inputNames:["A","Max","Norm"],inputTypes:[0,0,0]},Fw=(e,t,n)=>{da(t);let o=t[0].dims.slice(),u=he.normalizeAxis(n.axis,o.length),l=he.sizeToDimension(o,u),d=he.sizeFromDimension(o,u);return la(e,t,n,l,d)},jw=e=>Be({axis:e.attributes.getInt("axis",1)}),Lw=e=>Be({axis:e.attributes.getInt("axis",-1)}),Vw=(e,t,n)=>{da(t);let o=t[0].dims.slice(),u=he.normalizeAxis(n.axis,o.length),l=o.length,d=u!==l-1,c=[],s=[],r=[],i;d&&(s=Array.from({length:l}).map((m,b)=>b),s[u]=l-1,s[l-1]=u,s.map(m=>c.push(o[m])),i=Be({perm:s}),r=Ti(e,t,i));let a=d?he.sizeToDimension(c,l-1):he.sizeToDimension(o,l-1),p=d?he.sizeFromDimension(c,l-1):he.sizeFromDimension(o,l-1),h=la(e,d?r:t,n,a,p);return d?Ti(e,h,i):h},la=(e,t,n,o,u)=>{let l=ff(e,t[0],o,u,[o]),d=e.run({...sa,cacheHint:n.cacheKey,get:()=>l},t),c=mf(e,t[0],o,u,l.output.dims,[o]),s=e.run({...aa,cacheHint:n.cacheKey,get:()=>c},[t[0],d]),r=gf(e,t[0],o,u,l.output.dims,c.output.dims);return[e.run({...ua,cacheHint:n.cacheKey,get:()=>r},[t[0],d,s])]},ff=(e,t,n,o,u)=>{let[l,d]=e.calculateTextureWidthAndHeight(t.dims,0),c=u.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(u.length!==1)throw new Error("Dimensionality of the output should be 1");if(u[0]!==n)throw new Error("Shape of the output should be equal to logical row count");let s=Te(e.session.backend.glContext.version),r=`
      float process(int[${c}] indices) {
        int logical_row_start_offset = indices[0] * ${o};

        float max = getColorAsFloat(${s.texture2D}(A, offsetToCoords(logical_row_start_offset, ${l},
        ${d} )));
        for(int i=1; i<${o}; ++i)
        {
          float current = getColorAsFloat(${s.texture2D}(A, offsetToCoords(logical_row_start_offset + i,
            ${l}, ${d})));
          if(current > max)
          max = current;
        }

        return max;
      }`;return{...sa,output:{dims:u,type:t.type,textureType:0},shaderSource:r}},mf=(e,t,n,o,u,l)=>{let[d,c]=e.calculateTextureWidthAndHeight(t.dims,0),s=l.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(l.length!==1)throw new Error("Dimensionality of the output should be 1");if(l[0]!==n)throw new Error("Shape of the output should be equal to logical row count");if(u.length!==1)throw new Error("Dimensionality of the intermediate results should be 1");if(u[0]!==n)throw new Error("Shape of the intermediate results should be equal to logical row count");let r=Te(e.session.backend.glContext.version),i=`
      float process(int[${s}] indices) {
        int logical_row_start_offset = indices[0] * ${o};

        float norm_factor = 0.0;
        float max = _Max(indices);
        for(int i=0; i<${o}; ++i)
        {
          norm_factor += exp(getColorAsFloat(${r.texture2D}(A, offsetToCoords(logical_row_start_offset + i,
            ${d}, ${c}))) - max);
        }

        return norm_factor;
      }`;return{...aa,output:{dims:l,type:t.type,textureType:0},shaderSource:i}},gf=(e,t,n,o,u,l)=>{let[d,c]=e.calculateTextureWidthAndHeight(t.dims,0),s=t.dims.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(u.length!==1||l.length!==1)throw new Error("Dimensionality of the intermediate results should be 1");if(u[0]!==n||l[0]!==n)throw new Error("Shape of the intermediate results should be equal to logical row count");let r=`
      float process(int[${s}] indices) {

      // get offset of current logical tensor index from the 2-D texture coordinates (TexCoords)
      int offset = coordsToOffset(TexCoords, ${d}, ${c});

      //determine the logical row for this index
      int logical_row_index[1];
      logical_row_index[0] = offset / ${o};

      float norm_factor = _Norm(logical_row_index);

      // avoid possible division by 0
      // if norm_facor is 0, all elements are zero
      // if so, return 0
      if(norm_factor == 0.0)
        return 0.0;

      return exp(_A(indices) - _Max(logical_row_index)) / norm_factor;
    }`;return{...ua,output:{dims:t.dims,type:t.type,textureType:0},shaderSource:r}},da=e=>{if(!e||e.length!==1)throw new Error("Softmax requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type")}}),ca,Uw,Gw,bf,yf,_f,bE=R(()=>{"use strict";nt(),ke(),Ie(),ca={name:"Split",inputNames:["A"],inputTypes:[0]},Uw=(e,t,n)=>{_f(t);let o=he.normalizeAxis(n.axis,t[0].dims.length),u=bf(e,t,o,n),l=[];for(let d=0;d<u;++d)l.push(e.run({...ca,cacheHint:`${n.cacheKey};${d}`,get:()=>yf(e,t[0],n,o,d)},t));return l},Gw=e=>{let t=e.attributes.getInt("axis",0),n=e.attributes.getInts("split",[]),o=e.outputs.length;return Be({axis:t,split:n,numOutputs:o})},bf=(e,t,n,o)=>{let[,u]=Cu.splitShape(t[0].dims,n,o.split,o.numOutputs);return u.length},yf=(e,t,n,o,u)=>{let[l,d]=Cu.splitShape(t.dims,o,n.split,n.numOutputs),c=d[u],s=l[u],r=`
      float process(int indices[${s.length}]) {
        indices[${o}] += ${c};
        return _A(indices);
      }
    `;return{...ca,cacheHint:`${n.cacheKey}:${u}`,output:{dims:s,type:t.type,textureType:0},shaderSource:r}},_f=e=>{if(!e||e.length!==1)throw new Error("Split requires one input.");if(e[0].type!=="int8"&&e[0].type!=="uint8"&&e[0].type!=="int16"&&e[0].type!=="uint16"&&e[0].type!=="int32"&&e[0].type!=="uint32"&&e[0].type!=="float32"&&e[0].type!=="float64"&&e[0].type!=="bool")throw new Error("Invalid input type.")}}),Xu,qw,Hw,wf,vf,yE=R(()=>{"use strict";ke(),Xu=(e,t,n)=>{wf(t);let o=he.squeezeShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},qw=(e,t)=>(vf(t),Xu(e,[t[0]],Array.from(t[1].integerData))),Hw=e=>e.attributes.getInts("axes"),wf=e=>{if(!e||e.length!==1)throw new Error("Squeeze requires 1 input.");if(e[0].type==="string")throw new Error("invalid input tensor types.")},vf=e=>{if(!e||e.length!==2)throw new Error("Squeeze requires 2 inputs.");if(e[1].type!=="int32")throw new Error("Invalid input type.")}}),Ww,xf,$f,_E=R(()=>{"use strict";Ge(),Ie(),Ww=(e,t)=>{$f(t);let n={name:"Sum",inputNames:t.map((o,u)=>`X${u}`),inputTypes:new Array(t.length).fill(0)};return[e.run({...n,get:()=>xf(e,t,n)},t)]},xf=(e,t,n)=>{let o=Te(e.session.backend.glContext.version),u=t[0].dims.slice(),l=`
      void main() {
        vec4 result = ${t.map((d,c)=>`${o.texture2D}(X${c},TexCoords)`).join(" + ")};
        ${o.output} = result;
      }
    `;return{...n,output:{dims:u,type:t[0].type,textureType:0},hasMain:!0,shaderSource:l}},$f=e=>{if(!e||e.length===0)throw new Error("Sum requires inputs.");let t=e[0].dims.length;for(let n=1;n<e.length;n++){if(t!==e[n].dims.length)throw new Error("Input shapes are mismatched.");for(let o=0;o<t;o++)if(e[0].dims[o]!==e[n].dims[o])throw new Error("Input shapes are not matched.")}if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.");for(let n=1;n<e.length;n++)if(e[0].type!==e[n].type)throw new Error("Input types are not matched.")}}),Kw,Tf,Sf,wE=R(()=>{"use strict";jo(),Ie(),Kw=(e,t)=>{Sf(t);let n={name:"Tile",inputNames:["A"],inputTypes:[0]};return[e.run({...n,get:()=>Tf(e,t,n)},t)]},Tf=(e,t,n)=>{let o=t[0].dims.slice(),u=new Array(o.length),l=[];for(let s=0;s<o.length;s++)u[s]=o[s]*t[1].numberData[s],l.push(`inputIdx[${s}] = int(mod(float(outputIdx[${s}]), ${o[s]}.));`);let d=u.length,c=`
      float process(int outputIdx[${d}]) {
        int inputIdx[${d}];
        ${l.join(`
`)}
        return _A(inputIdx);
      }
    `;return{...n,output:{dims:u,type:t[0].type,textureType:0},shaderSource:c}},Sf=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 input.");if(e[1].dims.length!==1)throw new Error("The second input shape must 1 dimension.");if(e[1].dims[0]!==e[0].dims.length)throw new Error("Invalid input shape.");if(Ai.indexOf(e[0].type)===-1)throw new Error("Invalid input type.");if(e[1].type!=="int32"&&e[1].type!=="int16")throw new Error("Invalid repeat type.")}}),Zu,Xw,Zw,If,Of,vE=R(()=>{"use strict";ke(),Zu=(e,t,n)=>{If(t);let o=he.unsqueezeShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},Xw=(e,t)=>(Of(t),Zu(e,[t[0]],Array.from(t[1].integerData))),Zw=e=>e.attributes.getInts("axes"),If=e=>{if(!e||e.length!==1)throw new Error("Unsqueeze requires 1 input.");if(e[0].type==="string")throw new Error("invalid input tensor types.")},Of=e=>{if(!e||e.length!==2)throw new Error("Unsqueeze requires 2 inputs.");if(e[1].type!=="int32")throw new Error("Invalid input type.")}}),Jw,xE=R(()=>{"use strict";lO(),$O(),TO(),IO(),Sl(),QO(),eE(),tE(),rE(),nE(),iE(),oE(),uE(),$l(),lE(),dE(),cE(),pE(),hE(),fE(),mE(),gE(),bE(),yE(),_E(),wE(),Il(),z_(),vE(),Cw(),Jw=[["Abs","","6+",h_],["Acos","","7+",f_],["Add","","7+",W0],["And","","7+",K0],["Asin","","7+",m_],["Atan","","7+",g_],["AveragePool","","7+",mw,gw],["BatchNormalization","","7+",U0,G0],["Cast","","6+",o_,s_],["Ceil","","6+",__],["Clip","","6-10",Fu,b_],["Clip","","11+",y_],["Concat","","4+",u_,l_],["Conv","","1+",Vu,Uu],["ConvTranspose","","1+",X_,Z_],["Cos","","7+",w_],["Div","","7+",X0],["Dropout","","7+",ju],["DepthToSpace","","1+",Y_,Q_],["Equal","","7+",Z0],["Elu","","6+",v_,x_],["Exp","","6+",$_],["Flatten","","1+",ew,tw],["Floor","","6+",T_],["FusedConv","com.microsoft","1+",Vu,Uu],["Gather","","1+",rw,nw],["Gemm","","7-10",Gu,iw],["Gemm","","11+",Gu,ow],["GlobalAveragePool","","1+",bw,yw],["GlobalMaxPool","","1+",vw],["Greater","","7+",J0],["Identity","","1+",ju],["ImageScaler","","1+",sw,aw],["InstanceNormalization","","6+",uw,lw],["LeakyRelu","","6+",S_,I_],["Less","","7+",Y0],["LRN","","1+",dw,cw],["Log","","6+",O_],["MatMul","","1+",L_,V_],["MaxPool","","1+",_w,ww],["Mul","","7+",Q0],["Neg","","6+",E_],["Not","","1+",A_],["Or","","7+",e_],["Pad","","2-10",qu,pw],["Pad","","11+",hw,fw],["Pow","","7+",t_],["PRelu","","7+",r_],["ReduceLogSum","","1+",Ow,br],["ReduceMax","","1+",Tw,br],["ReduceMean","","1+",$w,br],["ReduceMin","","1+",Sw,br],["ReduceProd","","1+",Iw,br],["ReduceSum","","1-12",xw,br],["ReduceSumSquare","","1+",Ew,br],["Relu","","6+",P_],["Reshape","","5+",Aw],["Resize","","10",Ku,Dw],["Resize","","11+",Ku,Rw],["Shape","","1+",Nw],["Sigmoid","","6+",k_],["Sin","","7+",C_],["Slice","","10+",Mw],["Slice","","1-9",zw,Bw],["Softmax","","1-12",Fw,jw],["Softmax","","13+",Vw,Lw],["Split","","2-12",Uw,Gw],["Sqrt","","6+",D_],["Squeeze","","1-12",Xu,Hw],["Squeeze","","13+",qw],["Sub","","7+",n_],["Sum","","6+",Ww],["Tan","","7+",R_],["Tanh","","6+",N_],["Tile","","6+",Kw],["Transpose","","1+",Ti,J_],["Upsample","","7-8",Hu,Pw],["Upsample","","9",Hu,kw],["Unsqueeze","","1-12",Zu,Zw],["Unsqueeze","","13+",Xw],["Xor","","7+",i_]]});function $E(e){let t={},n;for(;(n=Ju.exec(e))!==null;){let o=n[3].split(",").map(u=>{let l=u.trim().split(" ");return l&&l.length===2?{type:l[0],name:l[1]}:null}).filter(u=>u!==null);t[n[2]]={params:o,body:n[4]}}for(let o in t){let u=Yw.replace("__FUNC__",o),l=new RegExp(u,"gm");for(;(n=l.exec(e))!==null;){let d=n[1],c=n[2],s=n[3].split(","),r=d?`${d} ${c};`:"",i=t[o].body,a="";t[o].params.forEach((h,m)=>{h&&(a+=`${h.type} ${h.name} = ${s[m]};
`)}),i=`${a}
 ${i}`,i=i.replace("return",`${c} = `);let p=`
      ${r}
      {
        ${i}
      }
      `;e=e.replace(n[0],p)}}return e=e.replace(Ju,""),e}var Ju,Yw,TE=R(()=>{"use strict";Ju=/@inline[\s\n\r]+(\w+)[\s\n\r]+([0-9a-zA-Z_]+)\s*\(([^)]*)\)\s*{(([^}]|[\n\r])*)}/gm,Yw="(\\w+)?\\s+([_0-9a-zA-Z]+)\\s+=\\s+__FUNC__\\((.*)\\)\\s*;"});function pi(e,t){let n=[],o=[],u=t!=null&&Array.isArray(t)&&t.length===0,l=t==null||u?null:SE(t,e).sort(),d=0;for(let c=0;c<e.length;++c){if(l!=null){if(l[d]===c&&e[c]!==1)throw new Error(`Can't squeeze axis ${c} since its dim '${e[c]}' is not 1`);(l[d]==null||l[d]>c)&&e[c]===1&&(n.push(e[c]),o.push(c)),l[d]<=c&&d++}e[c]!==1&&(n.push(e[c]),o.push(c))}return{newShape:n,keptDims:o}}function SE(e,t){let n=t.length;return e=e==null?t.map((o,u)=>u):[].concat(e),xo(e.every(o=>o>=-n&&o<n),()=>`All values in axis param must be in range [-${n}, ${n}) but got axis ${e}`),xo(e.every(IE),()=>`All values in axis param must be integers but got axis ${e}`),e.map(o=>o<0?n+o:o)}function IE(e){return e%1===0}function OE(e){if(e.length===0)return 1;let t=e[0];for(let n=1;n<e.length;n++)t*=e[n];return t}function Ef(e){let t=Math.ceil(Math.sqrt(e));return[t,Math.ceil(e/t)]}var Qw,ev=R(()=>{"use strict";Bt(),ke(),Qw=class{constructor(e){this.maxTextureSize=e}computeTextureWH(e,t){let n=this.computeTexture(e,t);return t&&t.isPacked&&(n[0]/=2,n[1]/=2),t&&t.reverseWH?[n[1],n[0]]:n}computeTexture(e,t){let n=t&&t.isPacked;if(e.length===0)return n?[2,2]:[1,1];let o=this.maxTextureSize;if(t&&t.breakAxis!==void 0){let d=t.breakAxis>=e.length?1:e.slice(t.breakAxis).reduce((s,r)=>s*r),c=t.breakAxis<=0?1:e.slice(0,t.breakAxis).reduce((s,r)=>s*r);if(d>o||c>o)We.verbose("TextureLayout",`Given width/height preferences were unattainable: shape:${e}, breakAxis:${t.breakAxis}`);else return[d,c]}let u=e.slice(0);n&&(o=o*2,u=u.map((d,c)=>c>=u.length-2?u[c]%2===0?u[c]:u[c]+1:u[c]),u.length===1&&(u=[2,u[0]])),u.length!==2&&(u=pi(u).newShape);let l=OE(u);return u.length<=1&&l<=o?[1,l]:u.length===2&&u[0]<=o&&u[1]<=o?u:u.length===3&&u[0]*u[1]<=o&&u[2]<=o?[u[0]*u[1],u[2]]:u.length===3&&u[0]<=o&&u[1]*u[2]<=o?[u[0],u[1]*u[2]]:u.length===4&&u[0]*u[1]*u[2]<=o&&u[3]<=o?[u[0]*u[1]*u[2],u[3]]:u.length===4&&u[0]<=o&&u[1]*u[2]*u[3]<=o?[u[0],u[1]*u[2]*u[3]]:n?Ef(l/4).map(d=>d*2):Ef(l)}}}),tv,EE=R(()=>{"use strict";ke(),vr(),Ge(),ev(),Yt(),tv=class extends Pn{constructor(e){super(e)}getFunctions(){return{...this.offsetToCoords(),...this.coordsToOffset(),...this.toVec(),...this.valueFrom(),...this.getCommonUtilFuncs(),...this.getInputsSamplingSnippets(),...this.getOutputSamplingSnippet()}}getCustomTypes(){return{}}offsetToCoords(){let e="offsetToCoords";return{offsetToCoords:new te(`
      vec2 ${e}(int offset, int width, int height) {
        int t = offset / width;
        int s = offset - t*width;
        vec2 coords = (vec2(s,t) + vec2(0.5,0.5)) / vec2(width, height);
        return coords;
      }
      `)}}coordsToOffset(){let e="coordsToOffset";return{coordsToOffset:new te(`
      int ${e}(vec2 coords, int width, int height) {
        float s = coords.s * float(width);
        float t = coords.t * float(height);
        int offset = int(t) * width + int(s);
        return offset;
      }
      `)}}getOutputSamplingSnippet(){let e=this.context.outputTextureLayout;return e.isPacked?this.getPackedOutputSamplingSnippet(e):this.getUnpackedOutputSamplingSnippet(e)}getPackedOutputSamplingSnippet(e){let t=e.unpackedShape,n=[e.width,e.height],o={},u="getOutputCoords";switch(t.length){case 0:o[u]=this.getOutputScalarCoords();break;case 1:o[u]=this.getOutputPacked1DCoords(t,n);break;case 2:o[u]=this.getOutputPacked2DCoords(t,n);break;case 3:o[u]=this.getOutputPacked3DCoords(t,n);break;default:o[u]=this.getOutputPackedNDCoords(t,n)}let l=`
      void setOutput(vec4 val) {
        ${Te(this.context.glContext.version).output} = val;
      }
    `,d="floatTextureSetRGBA";return o[d]=new te(l),o}getUnpackedOutputSamplingSnippet(e){let t=e.unpackedShape,n=[e.width,e.height],o={},u="getOutputCoords";switch(t.length){case 0:o[u]=this.getOutputScalarCoords();break;case 1:o[u]=this.getOutputUnpacked1DCoords(t,n);break;case 2:o[u]=this.getOutputUnpacked2DCoords(t,n);break;case 3:o[u]=this.getOutputUnpacked3DCoords(t,n);break;case 4:o[u]=this.getOutputUnpacked4DCoords(t,n);break;case 5:o[u]=this.getOutputUnpacked5DCoords(t,n);break;case 6:o[u]=this.getOutputUnpacked6DCoords(t,n);break;default:throw new Error(`Unsupported output dimensionality: ${t.length}`)}let l=`
        void setOutput(float val) {
          ${Te(this.context.glContext.version).output} = vec4(val, 0, 0, 0);
        }
    `,d="floatTextureSetR";return o[d]=new te(l),o}getOutputScalarCoords(){return new te(`
      int getOutputCoords() {
        return 0;
      }
    `)}getOutputPacked1DCoords(e,t){let n=t,o="";return n[0]===1?(o=`
          int getOutputCoords() {
            return 2 * int(TexCoords.y * ${n[1]}.0);
          }
        `,new te(o)):n[1]===1?(o=`
          int getOutputCoords() {
            return 2 * int(TexCoords.x * ${n[0]}.0);
          }
        `,new te(o)):(o=`
        int getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                 vec2(${n[0]}, ${n[1]}));
          return 2 * (resTexRC.y * ${n[0]} + resTexRC.x);
        }
      `,new te(o))}getOutputPacked2DCoords(e,t){let n="";if(di.arraysEqual(e,t))return n=`
        ivec2 getOutputCoords() {
          return 2 * ivec2(TexCoords.xy * vec2(${t[0]}, ${t[1]}));
        }
      `,new te(n);let o=t,u=Math.ceil(e[1]/2);return n=`
        ivec2 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${o[0]}, ${o[1]}));

          int index = resTexRC.y * ${o[0]} + resTexRC.x;

          // reverse r and c order for packed texture
          int r = imod(index, ${u}) * 2;
          int c = 2 * (index / ${u});

          return ivec2(r, c);
        }
      `,new te(n)}getOutputPacked3DCoords(e,t){let n=[t[0],t[1]],o=Math.ceil(e[2]/2),u=o*Math.ceil(e[1]/2),l=`
        ivec3 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${n[0]}, ${n[1]}));
          int index = resTexRC.y * ${n[0]} + resTexRC.x;

          int b = index / ${u};
          index -= b * ${u};

          // reverse r and c order for packed texture
          int r = imod(index, ${o}) * 2;
          int c = 2 * (index / ${o});

          return ivec3(b, r, c);
        }
      `;return new te(l)}getOutputPackedNDCoords(e,t){let n=[t[0],t[1]],o=Math.ceil(e[e.length-1]/2),u=o*Math.ceil(e[e.length-2]/2),l=u,d="",c="b, r, c";for(let r=2;r<e.length-1;r++)l*=e[e.length-r-1],d=`
      int b${r} = index / ${l};
      index -= b${r} * ${l};
    `+d,c=`b${r}, `+c;let s=`
      ivec${e.length} getOutputCoords() {
        ivec2 resTexRC = ivec2(TexCoords.xy *
                              vec2(${n[0]}, ${n[1]}));
        int index = resTexRC.y * ${n[0]} + resTexRC.x;

        ${d}

        int b = index / ${u};
        index -= b * ${u};

        // reverse r and c order for packed texture
        int r = imod(index, ${o}) * 2;
        int c = 2 * (index / ${o});

        return ivec${e.length}(${c});
      }
    `;return new te(s)}getOutputUnpacked1DCoords(e,t){let n=`
        int getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${t[0]}, ${t[1]}));
          return resTexRC.y * ${t[0]} + resTexRC.x;
        }
      `;return new te(n)}getOutputUnpacked2DCoords(e,t){let n=`
        ivec2 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${t[0]}, ${t[1]}));
          int index = resTexRC.y * ${t[0]} + resTexRC.x;
          int r = index / ${e[1]};
          int c = index - r * ${e[1]};
          return ivec2(r, c);
        }
      `;return new te(n)}getOutputUnpacked3DCoords(e,t){let n="",o=e.length,u=null;o<2&&(u=[]),u=new Array(o-1),u[o-2]=e[o-1];for(let c=o-3;c>=0;--c)u[c]=u[c+1]*e[c+1];let l=["r","c","d"],d=u.map((c,s)=>{let r=`int ${l[s]} = index / ${c}`,i=s===u.length-1?`int ${l[s+1]} = index - ${l[s]} * ${c}`:`index -= ${l[s]} * ${c}`;return`${r}; ${i};`}).join("");return n=`
        ivec3 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${t[0]}, ${t[1]}));
          int index = resTexRC.y * ${t[0]} + resTexRC.x;
          ${d}
          return ivec3(r, c, d);
        }
      `,new te(n)}getOutputUnpacked4DCoords(e,t){let n="",o=e.length,u=null;o<2&&(u=[]),u=new Array(o-1),u[o-2]=e[o-1];for(let c=o-3;c>=0;--c)u[c]=u[c+1]*e[c+1];let l=["r","c","d","d2"],d=u.map((c,s)=>{let r=`int ${l[s]} = index / ${c}`,i=s===u.length-1?`int ${l[s+1]} = index - ${l[s]} * ${c}`:`index -= ${l[s]} * ${c}`;return`${r}; ${i};`}).join("");return n=`
      ivec4 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${t[0]}, ${t[1]}));
          int index = resTexRC.y * ${t[0]} + resTexRC.x;
          ${d}
          return ivec4(r, c, d, d2);
        }
      `,new te(n)}getOutputUnpacked5DCoords(e,t){let n="",o=e.length,u=null;o<2&&(u=[]),u=new Array(o-1),u[o-2]=e[o-1];for(let c=o-3;c>=0;--c)u[c]=u[c+1]*e[c+1];let l=["r","c","d","d2","d3"],d=u.map((c,s)=>{let r=`int ${l[s]} = index / ${c}`,i=s===u.length-1?`int ${l[s+1]} = index - ${l[s]} * ${c}`:`index -= ${l[s]} * ${c}`;return`${r}; ${i};`}).join("");return n=`
      ivec5 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${t[0]}, ${t[1]}));
          int index = resTexRC.y * ${t[0]} + resTexRC.x;
          ${d}
          return ivec5(r, c, d, d2, d3);
        }
      `,new te(n)}getOutputUnpacked6DCoords(e,t){let n="",o=e.length,u=null;o<2&&(u=[]),u=new Array(o-1),u[o-2]=e[o-1];for(let c=o-3;c>=0;--c)u[c]=u[c+1]*e[c+1];let l=["r","c","d","d2","d3","d4"],d=u.map((c,s)=>{let r=`int ${l[s]} = index / ${c}`,i=s===u.length-1?`int ${l[s+1]} = index - ${l[s]} * ${c}`:`index -= ${l[s]} * ${c}`;return`${r}; ${i};`}).join("");return n=`
     ivec6 getOutputCoords() {
         ivec2 resTexRC = ivec2(TexCoords.xy *
                               vec2(${t[0]}, ${t[1]}));
         int index = resTexRC.y * ${t[0]} + resTexRC.x;
         ${d}
         return ivec6(r, c, d, d2, d3, d4);
       }
     `,new te(n)}getCommonUtilFuncs(){let e={},t="uvFromFlat";e[t]=new te(`
    vec2 uvFromFlat(int texNumR, int texNumC, int index) {
      int texC = index / texNumR;
      int texR = index - texC * texNumR;
      // TODO: swap texR, texC order in following function so row is corresponding to u and column is corresponding to
      //       v.
      return (vec2(texR, texC) + halfCR) / vec2(texNumR, texNumC);
    }
    `),t="packedUVfrom1D",e[t]=new te(`
      vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
        int texelIndex = index / 2;
        int texR = texelIndex / texNumC;
        int texC = texelIndex - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `),t="packedUVfrom2D",e[t]=new te(`
      vec2 packedUVfrom2D(int texNumR, int texNumC, int texelsInLogicalRow, int row, int col) {
        int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
        int texR = texelIndex / texNumC;
        int texC = texelIndex - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `),t="packedUVfrom3D",e[t]=new te(`
      vec2 packedUVfrom3D(int texNumR, int texNumC,
          int texelsInBatch, int texelsInLogicalRow, int b,
          int row, int col) {
        int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
        int texR = index / texNumC;
        int texC = index - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `),t="sampleTexture";let n=Te(this.context.glContext.version);return e[t]=new te(`
        float sampleTexture(sampler2D textureSampler, vec2 uv) {
            return ${n.texture2D}(textureSampler, uv).r;
        }`),e}getInputsSamplingSnippets(){let e={},t=this.context.outputTextureLayout;return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o],l=Gs(n);u.isPacked?e[l]=this.getPackedSamplerFromInput(l,n,u):e[l]=this.getUnpackedSamplerFromInput(l,n,u);let d=K3(n);u.unpackedShape.length<=t.unpackedShape.length&&(u.isPacked?e[d]=this.getPackedSamplerAtOutputCoords(d,u,t,n):e[d]=this.getUnpackedSamplerAtOutputCoords(d,u,t,n))}),e}getPackedSamplerAtOutputCoords(e,t,n,o){let u=t.unpackedShape,l=n.unpackedShape,d=Gs(o),c=u.length,s=l.length,r=qt.getBroadcastDims(u,l),i=_r(s),a=s-c,p,h=Sn();c===0?p="":s<2&&r.length>=1?p="coords = 0;":p=r.map(T=>`coords.${h[T+a]} = 0;`).join(`
`);let m="";s<2&&c>0?m="coords":m=u.map((T,I)=>`coords.${h[I+a]}`).join(", ");let b="return outputValue;",x=he.size(u)===1,_=he.size(l)===1;if(c===1&&!x&&!_)b=`
        return vec4(outputValue.xy, outputValue.xy);
      `;else if(x&&!_)s===1?b=`
          return vec4(outputValue.x, outputValue.x, 0., 0.);
        `:b=`
          return vec4(outputValue.x);
        `;else if(r.length){let T=c-2,I=c-1;r.indexOf(T)>-1&&r.indexOf(I)>-1?b="return vec4(outputValue.x);":r.indexOf(T)>-1?b="return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);":r.indexOf(I)>-1&&(b="return vec4(outputValue.xx, outputValue.zz);")}let y=`
        int lastDim = coords.${h[s-1]};
        coords.${h[s-1]} = coords.${h[s-2]};
        coords.${h[s-2]} = lastDim;
      `,S=`
      vec4 ${e}() {
        ${i} coords = getOutputCoords();
        ${y}
        ${p}
        vec4 outputValue = ${d}(${m});
        ${b}
      }
    `;return new te(S,["coordinates.getOutputCoords"])}getUnpackedSamplerAtOutputCoords(e,t,n,o){let u=[n.width,n.height],l=[t.width,t.height],d=t.unpackedShape.length,c=n.unpackedShape.length,s=t.unpackedShape,r=n.unpackedShape,i=Gs(o);if(d===c&&di.arraysEqual(l,u)){let y=`
          float ${e}() {
            return sampleTexture(${o}, TexCoords);
          }
        `;return new te(y,["coordinates.sampleTexture"])}let a=_r(c),p=qt.getBroadcastDims(s,r),h=c-d,m,b=Sn();d===0?m="":c<2&&p.length>=1?m="coords = 0;":m=p.map(y=>`coords.${b[y+h]} = 0;`).join(`
`);let x="";c<2&&d>0?x="coords":x=t.unpackedShape.map((y,S)=>`coords.${b[S+h]}`).join(", ");let _=`
        float ${e}() {
          ${a} coords = getOutputCoords();
          ${m}
          return ${i}(${x});
        }
      `;return new te(_,["coordinates.getOutputCoords"])}getPackedSamplerFromInput(e,t,n){switch(n.unpackedShape.length){case 0:return this.getPackedSamplerScalar(e,t);case 1:return this.getPackedSampler1D(e,t,n);case 2:return this.getPackedSampler2D(e,t,n);case 3:return this.getPackedSampler3D(e,t,n);default:return this.getPackedSamplerND(e,t,n)}}getUnpackedSamplerFromInput(e,t,n){let o=n.unpackedShape;switch(o.length){case 0:return this.getUnpackedSamplerScalar(e,t,n);case 1:return this.getUnpackedSampler1D(e,t,n);case 2:return this.getUnpackedSampler2D(e,t,n);case 3:return this.getUnpackedSampler3D(e,t,n);case 4:return this.getUnpackedSampler4D(e,t,n);case 5:return this.getUnpackedSampler5D(e,t,n);case 6:return this.getUnpackedSampler6D(e,t,n);default:throw new Error(`Unsupported dimension ${o.length}-D`)}}getPackedSamplerScalar(e,t){let n=Te(this.context.glContext.version),o=`
          vec4 ${e}() {
            return ${n.texture2D}(${t}, halfCR);
          }
        `;return new te(o)}getPackedSampler1D(e,t,n){let o=[n.width,n.height],u=[o[1],o[0]],l=Te(this.context.glContext.version),d=`vec4 ${e}(int index) {
      vec2 uv = packedUVfrom1D(
      ${u[0]}, ${u[1]}, index);
      return ${l.texture2D}(${t}, uv);
    }`;return new te(d,["coordinates.packedUVfrom1D"])}getPackedSampler2D(e,t,n){let o=n.unpackedShape,u=[n.width,n.height],l=Te(this.context.glContext.version),d=u[0],c=u[1];if(u!=null&&di.arraysEqual(o,u)){let a=`vec4 ${e}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${c}.0, ${d}.0);
        return ${l.texture2D}(${t}, uv);
      }`;return new te(a)}let s=u,r=Math.ceil(o[1]/2),i=`vec4 ${e}(int row, int col) {
      vec2 uv = packedUVfrom2D(${s[1]}, ${s[0]}, ${r}, row, col);
      return ${l.texture2D}(${t}, uv);
    }`;return new te(i,["coordinates.packedUVfrom2D"])}getPackedSampler3D(e,t,n){let o=n.unpackedShape,u=[n.width,n.height],l=[u[0],u[1]],d=Te(this.context.glContext.version);if(o[0]===1){let p=o.slice(1),h=[1,2],m=Kn(o,p),b=["b","row","col"],x=JSON.parse(JSON.stringify(n));x.unpackedShape=m;let _=this.getPackedSamplerFromInput(e,t,x),y=`${_.routineBody}
      vec4 ${e}(int b, int row, int col) {
        return ${e}(${Xn(b,h)});
      } `;return new te(y,_.dependencies)}let c=l[0],s=l[1],r=Math.ceil(o[2]/2),i=r*Math.ceil(o[1]/2),a=`vec4 ${e}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${s}, ${c}, ${i}, ${r}, b, row, col);
      return ${d.texture2D}(${t}, uv);}`;return new te(a,["coordinates.packedUVfrom3D"])}getPackedSamplerND(e,t,n){let o=n.unpackedShape,u=o.length,l=[n.width,n.height],d=Te(this.context.glContext.version),c=[l[0],l[1]],s=c[1],r=c[0],i=Math.ceil(o[u-1]/2),a=i*Math.ceil(o[u-2]/2),p="int b, int row, int col",h=`b * ${a} + (row / 2) * ${i} + (col / 2)`;for(let b=2;b<u-1;b++)p=`int b${b}, `+p,a*=o[u-b-1],h=`b${b} * ${a} + `+h;let m=`vec4 ${e}(${p}) {
      int index = ${h};
      int texR = index / ${r};
      int texC = index - texR * ${r};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${r}, ${s});
      return ${d.texture2D}(${t}, uv);
    }`;return new te(m)}getUnpackedSamplerScalar(e,t,n){let[o,u]=[n.width,n.height];if(o===1&&u===1){let d=`
          float ${e}() {
            return sampleTexture(${t}, halfCR);
          }
        `;return new te(d,["coordinates.sampleTexture"])}let l=`
        float ${e}() {
          int offset_${t} = coordsToOffset(TexCoords, ${o}, ${u});
          vec2 uv = uvFromFlat(${o}, ${u}, offset_${t});
          return sampleTexture(${t}, uv);
        }
      `;return new te(l,["coordinates.uvFromFlat","coordinates.sampleTexture","coordinates.coordsToOffset"])}getUnpackedSampler1D(e,t,n){let o=n.width,u=n.height;if(u===1&&o===1){let d=`
        float ${e}(int index) {
          return sampleTexture(${t}, halfCR);
        }
      `;return new te(d,["coordinates.sampleTexture"])}if(u===1){let d=`
          float ${e}(int index) {
            vec2 uv = vec2((float(index) + 0.5) / ${o}.0, 0.5);
            return sampleTexture(${t}, uv);
          }
        `;return new te(d,["coordinates.sampleTexture"])}if(o===1){let d=`
          float ${e}(int index) {
            vec2 uv = vec2(0.5, (float(index) + 0.5) / ${u}.0);
            return sampleTexture(${t}, uv);
          }
        `;return new te(d,["coordinates.sampleTexture"])}let l=`
        float ${e}(int index) {
          vec2 uv = uvFromFlat(${o}, ${u}, index);
          return sampleTexture(${t}, uv);
        }
      `;return new te(l,["coordinates.uvFromFlat","coordinates.sampleTexture"])}getUnpackedSampler2D(e,t,n){let o=n.unpackedShape,u=[n.height,n.width];if(u!=null&&di.arraysEqual(o,u)){let a=u[1],p=u[0],h=`
          float ${e}(int row, int col) {
            vec2 uv = (vec2(row, col) + halfCR) / vec2(${a}.0, ${p}.0);
            return sampleTexture(${t}, uv);
          }
        `;return new te(h,["coordinates.sampleTexture"])}let{newShape:l,keptDims:d}=pi(o),c=l;if(c.length<o.length){let a=Kn(o,c),p=JSON.parse(JSON.stringify(n));p.unpackedShape=a;let h=["col","row"],m=`
          ${this.getUnpackedSamplerFromInput(e,t,p).routineBody}
          float ${e}(int row, int col) {
            return ${e}(${Xn(h,d)});
          }
        `;return new te(m,["coordinates.sampleTexture"])}let s=u[1],r=u[0];if(r===1){let a=`
          float ${e}(int row, int col) {
            int offset_${t} = coordsToOffset(TexCoords, ${s}, ${r});
            float index = dot(vec3(row, col, offset_${t}), vec3(${o[1]}, 1, 1));
            vec2 uv = vec2(0.5, (index + 0.5) / ${s}.0);
            return sampleTexture(${t}, uv);
          }
        `;return new te(a,["coordinates.sampleTexture","coordinates.coordsToOffset"])}if(s===1){let a=`
          float ${e}(int row, int col) {
            int offset_${t} = coordsToOffset(TexCoords, ${s}, ${r});
            float index = dot(vec3(row, col, offset_${t}), vec3(${o[1]}, 1, 1));
            vec2 uv = vec2((index + 0.5) / ${r}.0, 0.5);
            return sampleTexture(${t}, uv);
          }
        `;return new te(a,["coordinates.sampleTexture","coordinates.coordsToOffset"])}let i=`
        float ${e}(int row, int col) {
          int index = col * ${o[1]} + row;
          vec2 uv = uvFromFlat(${s}, ${r}, index);
          return sampleTexture(${t}, uv);
        }
      `;return new te(i,["coordinates.uvFromFlat","coordinates.sampleTexture","coordinates.coordsToOffset"])}getUnpackedSampler3D(e,t,n){let o=n.unpackedShape,u=o[1]*o[2],l=o[2],{newShape:d,keptDims:c}=pi(o),s=d;if(s.length<o.length){let p=Kn(o,s),h=["batch","col","row"],m=JSON.parse(JSON.stringify(n));m.unpackedShape=p;let b=this.getUnpackedSamplerFromInput(e,t,m),x=c.reverse(),_=`
          ${b.routineBody}
          float ${e}(int batch, int row, int col) {
            return ${e}(${Xn(h,x)});
          }
        `;return new te(_,b.dependencies)}let r=n.width,i=n.height,a=`
          float ${e}(int depth, int row, int col) {
            // Explicitly use integer operations as dot() only works on floats.
            int index = depth * ${u} + col * ${l} + row;
            vec2 uv = uvFromFlat(${r}, ${i}, index);
            return sampleTexture(${t}, uv);
          }
      `;return new te(a,["coordinates.uvFromFlat","coordinates.sampleTexture","coordinates.coordsToOffset"])}getUnpackedSampler4D(e,t,n){let o=n.unpackedShape,u=o[3],l=o[2]*u,d=o[1]*l,c=n.width,s=n.height,r=`
        float ${e}(int row, int col, int depth, int depth2) {
          int index = row * ${d} + col * ${l} +
              depth2 * ${u} + depth;
          vec2 uv = uvFromFlat(${c}, ${s}, index);
          return sampleTexture(${t}, uv);
        }
      `;return new te(r,["coordinates.uvFromFlat","coordinates.sampleTexture"])}getUnpackedSampler5D(e,t,n){let o=n.unpackedShape,u=o[4],l=o[3]*u,d=o[2]*l,c=o[1]*d,{newShape:s,keptDims:r}=pi(o);if(s.length<o.length){let h=Kn(o,s),m=["row","col","depth","depth2","depth3"],b=JSON.parse(JSON.stringify(n));b.unpackedShape=h;let x=`
          ${this.getUnpackedSamplerFromInput(e,t,b).routineBody}
          float ${e}(int row, int col, int depth, int depth2, int depth3) {
            return ${e}(${Xn(m,r)});
          }
        `;return new te(x,["coordinates.sampleTexture","coordinates.uvFromFlat"])}let i=n.width,a=n.height,p=`
        float ${e}(int row, int col, int depth, int depth2, int depth3) {
          int index = row * ${c} + col * ${d} + depth * ${l} +
          depth3 * ${u} + depth2;
          vec2 uv = uvFromFlat(${i}, ${a}, index);
          return sampleTexture(${t}, uv);
        }
      `;return new te(p,["coordinates.sampleTexture","coordinates.uvFromFlat"])}getUnpackedSampler6D(e,t,n){let o=n.unpackedShape,u=o[5],l=o[4]*u,d=o[3]*l,c=o[2]*d,s=o[1]*c,{newShape:r,keptDims:i}=pi(o);if(r.length<o.length){let m=Kn(o,r),b=["row","col","depth","depth2","depth3","depth4"],x=JSON.parse(JSON.stringify(n));x.unpackedShape=m;let _=`
            ${this.getUnpackedSamplerFromInput(e,t,x).routineBody}
            float ${e}(int row, int col, int depth,
              int depth2, int depth3, int depth4) {
              return ${e}(${Xn(b,i)});
            }
          `;return new te(_,["coordinates.sampleTexture","coordinates.uvFromFlat"])}let a=n.width,p=n.height,h=`
          float ${e}(int row, int col, int depth,
            int depth2, int depth3, int depth4) {
            int index = row * ${s} + col * ${c} + depth * ${d} +
            depth2 * ${l} + depth3 * ${u} + depth4;
            vec2 uv = uvFromFlat(${a}, ${p}, index);
            return sampleTexture(${t}, uv);
          }
        `;return new te(h,["coordinates.uvFromFlat","coordinates.sampleTexture","coordinates.coordsToOffset"])}toVec(){let e=this.context.outputTextureLayout,t=e.shape.length,n=e.strides,o=e.width,u=e.height,l=[];for(let c=0;c<t-1;++c)l.push(`
        c[${c}] = offset / ${n[c]};`),l.push(`
        offset -= c[${c}] * ${n[c]};`);l.push(`
        c[${t-1}] = offset;`);let d=`
      void toVec(vec2 texCoords, out int c[${t}]) {
        int offset = coordsToOffset(texCoords, ${o}, ${u});
        ${l.join("")}
      }
      void toVec(int offset, out int c[${t}]) {
        ${l.join("")}
      }
    `;return{toVec:new te(d,["coordinates.coordsToOffset"])}}valueFrom(){let e={};return this.context.programInfo.inputNames.forEach((t,n)=>{let o=this.context.inputTextureLayouts[n],u=(o.unpackedShape.length>0?o.unpackedShape:o.shape).length,l=`_${t}`;e[l]=new te(this.getValueFromSingle(t,u,o.width,o.height,!1),[`shapeUtils.indicesToOffset${l}`,"coordinates.offsetToCoords","fragcolor.getColorAsFloat"]),l=l+"_T",e[l]=new te(this.getValueFromSingle(t,u,o.width,o.height,!0),[`shapeUtils.indicesToOffset${l}`,"coordinates.offsetToCoords","fragcolor.getColorAsFloat"])}),e}getValueFromSingle(e,t,n,o,u){let l=`_${e}`;u&&(l=l+"_T");let d=Te(this.context.glContext.version);return`
        float ${l}(int m[${t}]) {
          int offset = indicesToOffset${l}(m);
          vec2 coords = offsetToCoords(offset, ${n}, ${o});
          float value = getColorAsFloat(${d.texture2D}(${e}, coords));
          return value;
        }
        `}getPackedValueFrom(e,t,n,o,u){let l=`_${e}_Pack`;u&&(l=l+"_T");let d=Te(this.context.glContext.version);return`
        vec4 ${l}(int m[${t}]) {
          int offset = indicesToOffset_${e}(m);
          vec2 coords = offsetToCoords(offset, ${n}, ${o});
          return ${d.texture2D}(${e}, coords);
        }
        `}}}),rv,AE=R(()=>{"use strict";vr(),rv=class Yu extends Pn{constructor(t){super(t)}getFunctions(){return{...this.encodeFloat32(),...this.decodeFloat32()}}getCustomTypes(){return{}}encodeFloat32(){return{encode:new te(`highp vec4 encode(highp float f) {
        return vec4(f, 0.0, 0.0, 0.0);
      }
        `)}}decodeFloat32(){return{decode:new te(`highp float decode(highp vec4 rgba) {
        return rgba.r;
      }
        `)}}encodeUint8(){let t=Yu.isLittleEndian()?"rgba.rgba=rgba.abgr;":"";return{encode:new te(`
      highp vec4 encode(highp float f) {
        highp float F = abs(f);
        highp float Sign = step(0.0,-f);
        highp float Exponent = floor(log2(F));
        highp float Mantissa = (exp2(- Exponent) * F);
        Exponent = floor(log2(F) + 127.0) + floor(log2(Mantissa));
        highp vec4 rgba;
        rgba[0] = 128.0 * Sign  + floor(Exponent*exp2(-1.0));
        rgba[1] = 128.0 * mod(Exponent,2.0) + mod(floor(Mantissa*128.0),128.0);
        rgba[2] = floor(mod(floor(Mantissa*exp2(23.0 -8.0)),exp2(8.0)));
        rgba[3] = floor(exp2(23.0)*mod(Mantissa,exp2(-15.0)));
        ${t}
        rgba = rgba / 255.0; // values need to be normalized to [0,1]
        return rgba;
    }
        `)}}decodeUint8(){let t=Yu.isLittleEndian()?"rgba.rgba=rgba.abgr;":"";return{decode:new te(`
        highp float decode(highp vec4 rgba) {
          rgba = rgba * 255.0; // values need to be de-normalized from [0,1] to [0,255]
          ${t}
          highp float Sign = 1.0 - step(128.0,rgba[0])*2.0;
          highp float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0;
          highp float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);
          highp float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 ));
          return Result;
      }
        `)}}static isLittleEndian(){let t=new ArrayBuffer(4),n=new Uint32Array(t),o=new Uint8Array(t);if(n[0]=3735928559,o[0]===239)return!0;if(o[0]===222)return!1;throw new Error("unknown endianness")}}}),nv,PE=R(()=>{"use strict";vr(),Ge(),nv=class extends Pn{constructor(e){super(e)}getFunctions(){return{...this.setFragColor(),...this.getColorAsFloat()}}getCustomTypes(){return{}}setFragColor(){let e=Te(this.context.glContext.version);return{setFragColor:new te(`
        void setFragColor(float value) {
            ${e.output} = encode(value);
        }
        `,["encoding.encode"])}}getColorAsFloat(){return{getColorAsFloat:new te(`
        float getColorAsFloat(vec4 color) {
            return decode(color);
        }
        `,["encoding.decode"])}}}}),iv,kE=R(()=>{"use strict";vr(),iv=class hi extends Pn{constructor(t){super(t)}getFunctions(){return{...this.bcastIndex(),...this.bcastMatmulIndex(),...this.offsetToIndices(),...this.indicesToOffset(),...this.incrementIndices()}}getCustomTypes(){return{}}bcastIndex(){let t=this.context.outputTextureLayout.shape.length,n={};return this.context.programInfo.inputNames.forEach((o,u)=>{let l=this.context.inputTextureLayouts[u].unpackedShape;if(l.length<=t){let d=l.length,c=t-d,s=`bcastIndices_${o}`,r="";for(let a=0;a<d;++a)r+=`
          realIndices[${a}] = int( mod(float(bcastedIndices[${c+a}]), ${l[a]}.0) );
          `;let i=`
        void ${s} (int bcastedIndices[${t}], out int realIndices[${d}]) {
          ${r}
        }
        `;n[s]=new te(i)}}),n}bcastMatmulIndex(){let t=this.context.outputTextureLayout.shape.length,n={};return this.context.programInfo.inputNames.forEach((o,u)=>{let l=this.context.inputTextureLayouts[u].shape;if(!(l.length<2||l.length>t)){let d=l.length,c=t-d,s=`bcastMatmulIndices_${o}`,r="";for(let a=0;a<d-2;++a)r+=`
          realIndices[${a}] = int( mod(float(bcastedIndices[${c+a}]), ${l[a]}.0) );
          `;let i=`
        void ${s}(int bcastedIndices[${t}], out int realIndices[${d}]) {
          ${r}
          realIndices[${d-1}] = bcastedIndices[${t-1}];
          realIndices[${d-2}] = bcastedIndices[${t-2}];
        }
        `;n[s]=new te(i)}}),n}indicesToOffset(){let t={};return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o].shape,l=this.context.inputTextureLayouts[o].strides,d=u.length,c=`indicesToOffset_${n}`;t[c]=new te(hi.indexToOffsetSingle(c,d,l)),c=`indicesToOffset_${n}_T`,t[c]=new te(hi.indexToOffsetSingle(c,d,l.slice().reverse()))}),t}static indexToOffsetSingle(t,n,o){let u="";for(let l=n-1;l>=0;--l)u+=`
        offset += indices[${l}] * ${o[l]};
        `;return`
      int ${t}(int indices[${n}]) {
        int offset = 0;
        ${u}
        return offset;
      }
      `}offsetToIndices(){let t={};return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o].shape,l=this.context.inputTextureLayouts[o].strides,d=u.length,c=`offsetToIndices_${n}`;t[c]=new te(hi.offsetToIndicesSingle(c,d,l)),c=`offsetToIndices_${n}_T`,t[c]=new te(hi.offsetToIndicesSingle(c,d,l.slice().reverse()))}),t}static offsetToIndicesSingle(t,n,o){let u=[];for(let l=0;l<n-1;++l)u.push(`
      indices[${l}] = offset / ${o[l]};`),u.push(`
        offset -= indices[${l}] * ${o[l]};`);return u.push(`
      indices[${n-1}] = offset;`),`
      void ${t}(int offset, out int indices[${n}]) {
        ${u.join("")}
      }
      `}incrementIndices(){let t={};return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o].shape,l=u.length,d=`incrementIndices_${n}`,c="";for(let r=0;r<l;++r)c+=`
        shape[${r}] = ${u[r]};`;let s=`
        void ${d}(int axis, out int indices[${l}]) {
          int shape[${l}];
          ${c};
          for(int i = ${l} -1 ; i >= 0; --i) {
            if(i > axis) continue;
            indices[i] += 1;
            if(indices[i] < shape[i]) {
              break;
            }
            indices[i] = 0;
          }
        }
        `;t[d]=new te(s)}),t}}}),ov,CE=R(()=>{"use strict";vr(),ov=class extends Pn{constructor(e){super(e)}getCustomTypes(){return{}}getFunctions(){return{...this.binaryVecFunctions(),...this.copyVec(),...this.setVecItem(),...this.getVecItem()}}binaryVecFunctions(){let e=this.context.outputTextureLayout.shape.length,t={add:"+=",sub:"-=",mul:"*=",div:"/="},n={};for(let o in t){let u=`${o}Vec`,l="";for(let c=0;c<e;++c)l+=`
          dest[${c}] ${t[o]} src[${c}];
          `;let d=`
        void ${u}(int src[${e}], out int dest[${e}]) {
          ${l}
        }
        `;n[u]=new te(d)}return n}copyVec(){let e=this.context.outputTextureLayout.shape.length,t="";for(let o=0;o<e;++o)t+=`
        dest[${o}] = src[${o}];
        `;let n=`
      void copyVec(int src[${e}], out int dest[${e}]) {
        ${t}
      }
      `;return{copyVec:new te(n)}}setVecItem(){let e=this.context.outputTextureLayout.shape.length,t=`
        if(index < 0)
            index =${e} + index;
        if (index == 0)
            m[0] = value;
        `;for(let o=1;o<e-1;++o)t+=`
        else if (index == ${o})
            m[${o}] = value;
            `;t+=`
        else
            m[${e-1}] = value;
        `;let n=`
      void setVecItem(out int m[${e}], int index, int value) {
        ${t}
      }
        `;return{setVecItem:new te(n)}}getVecItem(){let e=this.context.outputTextureLayout.shape.length,t=`
        if(index < 0)
            index = ${e} + index;
        if (index == 0)
            return m[0];
      `;for(let o=1;o<e-1;++o)t+=`
        else if (index == ${o})
            return m[${o}];
      `;t+=`
        else
            return m[${e-1}];
        `;let n=`
      int getVecItem(int m[${e}], int index) {
        ${t}
      }
    `;return{getVecItem:new te(n)}}}}),Qu,DE=R(()=>{"use strict";EE(),AE(),PE(),kE(),CE(),Qu={encoding:rv,fragcolor:nv,vec:ov,shapeUtils:iv,coordinates:tv}}),sv,RE=R(()=>{"use strict";vr(),TE(),DE(),Ge(),sv=class{constructor(e,t,n,o){this.libs={},this.glslLibRoutineDependencyGraph={},this.context=new q0(e,t,n,o),Object.keys(Qu).forEach(l=>{let d=new Qu[l](this.context);this.libs[l]=d});let u=this.glslLibRoutineDependencyGraph;for(let l in this.libs){let d=this.libs[l].getFunctions();for(let c in d){let s=l+"."+c,r;u[s]?(r=u[s],r.routineBody=d[c].routineBody):(r=new Mu(s,d[c].routineBody),u[s]=r);let i=d[c].dependencies;if(i)for(let a=0;a<i.length;++a)if(u[i[a]])r.addDependency(u[i[a]]);else{let p=new Mu(i[a]);u[i[a]]=p,r.addDependency(p)}}}}preprocess(){let e=this.context.programInfo,t=e.shaderSource;return this.context.programInfo.hasMain||(t=`${t}
      ${W3(this.context.glContext.version,this.context.outputTextureLayout.shape.length)}`),t=$E(t),`${H3(this.context.glContext.version)}
    ${this.getUniforms(e.inputNames,e.variables)}
    ${this.getImports(t)}
    ${t}`}getImports(e){let t=this.selectGlslLibRoutinesToBeIncluded(e);if(t.length===0)return"";let n="";for(let o=0;o<t.length;++o)if(t[o].routineBody)n+=t[o].routineBody+`
`;else throw new Error(`Missing body for the Glsl Library routine: ${t[o].name}`);return n}selectGlslLibRoutinesToBeIncluded(e){let t=[];return Object.keys(this.glslLibRoutineDependencyGraph).forEach(n=>{let o=n.split(".")[1];e.indexOf(o)!==-1&&t.push(this.glslLibRoutineDependencyGraph[n])}),H0.returnOrderedNodes(t)}getUniforms(e,t){let n=[];if(e)for(let o of e)n.push(`uniform sampler2D ${o};`);if(t)for(let o of t)n.push(`uniform ${o.type} ${o.name}${o.arrayLength?`[${o.arrayLength}]`:""};`);return n.join(`
`)}}}),av,NE=R(()=>{"use strict";ot(),Bt(),RE(),Ge(),av=class{constructor(e,t,n){this.profiler=e,this.glContext=t,this.textureLayoutStrategy=n,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,n){this.profiler.event("op",`ProgramManager.run ${e.programInfo.name??"unknown kernel"}`,()=>{let o=this.glContext.gl,u=e.program;o.useProgram(u);try{this.bindOutput(n),this.attributesBound||this.bindAttributes(e.attribLocations),this.bindUniforms(e.uniformLocations,e.programInfo.variables??[],t)}catch(l){throw We.error("ProgramManager",e.programInfo.shaderSource),l}this.profiler.event("backend","GlContext.draw()",()=>{this.glContext.draw()})},this.glContext)}dispose(){this.vertexShader&&this.glContext.deleteShader(this.vertexShader),this.repo.forEach(e=>this.glContext.deleteProgram(e.program))}build(e,t,n){return this.profiler.event("backend","ProgramManager.build",()=>{let o=new sv(this.glContext,e,t,n),u=o.preprocess(),l=this.compile(u);return{programInfo:e,program:l,uniformLocations:this.getUniformLocations(l,o.context.programInfo.inputNames,o.context.programInfo.variables),attribLocations:this.getAttribLocations(l)}})}compile(e){if(!this.vertexShader){We.verbose("ProrgramManager","Compiling and caching Vertex shader for the first time");let o=q3(this.glContext.version);this.vertexShader=this.glContext.compileShader(o,this.glContext.gl.VERTEX_SHADER)}le.debug&&We.verbose("ProrgramManager",`FragShader:
${e}
`);let t=this.glContext.compileShader(e,this.glContext.gl.FRAGMENT_SHADER),n=this.glContext.createProgram(this.vertexShader,t);return this.glContext.deleteShader(t),n}bindOutput(e){let t=e.width,n=e.height;We.verbose("ProrgramManager",`Binding output texture to Framebuffer: w/h=${t}/${n}, shape=${e.shape}, type=${e.tensor.type}`),this.glContext.attachFramebuffer(e.texture,t,n)}bindAttributes(e){let t=e.position,n=e.textureCoord;this.glContext.setVertexAttributes(t,n),this.attributesBound=!0}bindUniforms(e,t,n){let o=this.glContext.gl,u=0;for(let{name:l,type:d,location:c,arrayLength:s}of e){let r=t.find(i=>i.name===l)?.data;if(d!=="sampler2D"&&!r)throw new Error(`variable '${l}' does not have data defined in program info`);switch(d){case"sampler2D":this.bindTexture(n[u],c,u),u++;break;case"float":s?o.uniform1fv(c,r):o.uniform1f(c,r);break;case"int":s?o.uniform1iv(c,r):o.uniform1i(c,r);break;default:throw new Error(`Uniform not implemented: ${d}`)}}}bindTexture(e,t,n){this.glContext.bindTextureToUniform(e.texture,n,t)}getAttribLocations(e){return{position:this.getAttribLocation(e,"position"),textureCoord:this.getAttribLocation(e,"textureCoord")}}getUniformLocations(e,t,n){let o=[];if(t)for(let u of t)o.push({name:u,type:"sampler2D",location:this.getUniformLocation(e,u)});if(n)for(let u of n)o.push({...u,location:this.getUniformLocation(e,u.name)});return o}getUniformLocation(e,t){let n=this.glContext.gl.getUniformLocation(e,t);if(n===null)throw new Error(`Uniform ${t} not found.`);return n}getAttribLocation(e,t){return this.glContext.gl.getAttribLocation(e,t)}}}),uv,zE=R(()=>{"use strict";Bt(),To(),uv=class{constructor(e,t,n,o){this.glContext=e,this.layoutStrategy=t,this.profiler=n,this.config=o,this.pendingRead=new Map,o.reuseTextures&&(this.inUseTextures=new Map,this.idleTextures=new Map,this.textureLookup=new Map)}createTextureFromLayout(e,t,n,o){let u=this.toEncoderType(e),l=this.glContext.getEncoder(u,t.channels||1,o);if(t.isPacked&&o===1)throw new Error("not implemented");let d=t.width,c=t.height,s,r;if(this.config.reuseTextures){s=`${d}x${c}_${l.format}_${l.internalFormat}_${l.textureType}`,r=this.inUseTextures.get(s),r||(r=[],this.inUseTextures.set(s,r));let a=this.idleTextures.get(s);if(a&&a.length>0){let p=a.pop();return r.push(p),o===1&&this.glContext.updateTexture(p,d,c,l,this.toTextureData(e,n)),p}}We.verbose("TextureManager",`Creating new texture of size ${t.width}x${t.height}`);let i=this.glContext.allocateTexture(d,c,l,this.toTextureData(e,n));return this.config.reuseTextures&&(r.push(i),this.textureLookup.set(i,s)),i}readTexture(e,t,n){return n||(n=1),this.profiler.event("backend","TextureManager.readTexture",()=>{let o=e.shape.reduce((l,d)=>l*d)*n,u=this.glContext.readTexture(e.texture,e.width,e.height,o,this.toEncoderType(t),n);return this.toTensorData(t,u)})}async readTextureAsync(e,t,n){let o=e.tensor.dataId;if(n||(n=1),this.pendingRead.has(o)){let u=this.pendingRead.get(o);return new Promise(l=>u?.push(l))}return this.profiler.event("backend","TextureManager.readTextureAsync",async()=>{this.pendingRead.set(o,[]);let u=e.shape.reduce((s,r)=>s*r)*n;await this.glContext.createAndWaitForFence();let l=this.glContext.readTexture(e.texture,e.width,e.height,u,this.toEncoderType(t),n),d=this.toTensorData(t,l),c=this.pendingRead.get(o);return this.pendingRead.delete(o),c?.forEach(s=>s(d)),d})}readUint8TextureAsFloat(e){return this.profiler.event("backend","TextureManager.readUint8TextureAsFloat",()=>{let t=e.shape.reduce((o,u)=>o*u),n=this.glContext.readTexture(e.texture,e.width,e.height,t*4,"byte",4);return new Float32Array(n.buffer,n.byteOffset,t)})}releaseTexture(e,t){let n;if(this.config.reuseTextures&&(n=this.textureLookup.get(e.texture),n)){t&&this.textureLookup.delete(n);let o=this.inUseTextures.get(n);if(o){let u=o.indexOf(e.texture);if(u!==-1){o.splice(u,1);let l=this.idleTextures.get(n);l||(l=[],this.idleTextures.set(n,l)),l.push(e.texture)}}}(!n||t)&&(We.verbose("TextureManager",`Deleting texture of size ${e.width}x${e.height}`),this.glContext.deleteTexture(e.texture))}toTensorData(e,t){switch(e){case"int16":return t instanceof Int16Array?t:Int16Array.from(t);case"int32":return t instanceof Int32Array?t:Int32Array.from(t);case"int8":return t instanceof Int8Array?t:Int8Array.from(t);case"uint16":return t instanceof Uint16Array?t:Uint16Array.from(t);case"uint32":return t instanceof Uint32Array?t:Uint32Array.from(t);case"uint8":case"bool":return t instanceof Uint8Array?t:Uint8Array.from(t);case"float32":return t instanceof Float32Array?t:Float32Array.from(t);case"float64":return t instanceof Float64Array?t:Float64Array.from(t);default:throw new Error(`TensorData type ${e} is not supported`)}}toTextureData(e,t){if(t)return t instanceof Float32Array?t:new Float32Array(t)}toEncoderType(e){return"float"}clearActiveTextures(){this.glContext.clearActiveTextures()}}}),lv,BE=R(()=>{"use strict";Bt(),HI(),uO(),xE(),NE(),ev(),zE(),lv=class{constructor(e,t){this.backend=e,this.context=t,this.layoutStrategy=new Qw(e.glContext.maxTextureSize),this.programManager=new av(this.context.profiler,e.glContext,this.layoutStrategy),this.textureManager=new uv(e.glContext,this.layoutStrategy,this.context.profiler,{reuseTextures:e.textureCacheMode==="full"}),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache=new Map,this.pack=e.pack,this.pack2unpackMap=new Map,this.unpack2packMap=new Map}createInferenceHandler(){return new V0(this)}onGraphInitialized(e){let t=e.getValues().filter(n=>n.from===-1&&n.tensor).map(n=>n.tensor.dataId);this.initializers=new Set(t)}isInitializer(e){return this.initializers?this.initializers.has(e):!1}addInitializer(e){this.initializers.add(e)}getTextureData(e,t){return t?this.packedTextureDataCache.get(e):this.unpackedTextureDataCache.get(e)}setTextureData(e,t,n=!1){We.verbose("WebGLSessionHandler","Storing Texture data in cache"),n?this.packedTextureDataCache.set(e,t):this.unpackedTextureDataCache.set(e,t)}dispose(){this.programManager.dispose(),this.textureManager.clearActiveTextures(),this.packedTextureDataCache.forEach(e=>this.textureManager.releaseTexture(e,!0)),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache.forEach(e=>this.textureManager.releaseTexture(e,!0)),this.unpackedTextureDataCache=new Map}resolve(e,t,n){let o=GI(e,t,Jw);return{impl:o.opImpl,context:o.opInit?o.opInit(e,n):e}}}});function ME(e){let t=0;for(;t<e.length&&e[t]();++t);return t-1}var el,FE=R(()=>{"use strict";ot(),To(),To(),Yt(),el=class{constructor(e,t){this.frameBufferBound=!1,this.itemsToPoll=[],this.gl=e,this.version=t,this.getExtensions(),this.vertexbuffer=this.createVertexbuffer(),this.framebuffer=this.createFramebuffer(),this.queryVitalParameters()}allocateTexture(e,t,n,o){let u=this.gl,l=u.createTexture();u.bindTexture(u.TEXTURE_2D,l),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MIN_FILTER,u.NEAREST),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MAG_FILTER,u.NEAREST),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_S,u.CLAMP_TO_EDGE),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_T,u.CLAMP_TO_EDGE);let d=o?n.encode(o,e*t):null;return u.texImage2D(u.TEXTURE_2D,0,n.internalFormat,e,t,0,n.format,n.textureType,d),this.checkError(),l}updateTexture(e,t,n,o,u){let l=this.gl;l.bindTexture(l.TEXTURE_2D,e);let d=o.encode(u,t*n);l.texSubImage2D(l.TEXTURE_2D,0,0,0,t,n,o.format,o.textureType,d),this.checkError()}attachFramebuffer(e,t,n){let o=this.gl;o.bindTexture(o.TEXTURE_2D,e),o.bindFramebuffer(o.FRAMEBUFFER,this.framebuffer),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,e,0),this.checkError(),o.viewport(0,0,t,n),o.scissor(0,0,t,n)}readTexture(e,t,n,o,u,l){let d=this.gl;l||(l=1),this.frameBufferBound||this.attachFramebuffer(e,t,n);let c=this.getEncoder(u,l),s=c.allocate(t*n);return d.bindTexture(d.TEXTURE_2D,e),d.framebufferTexture2D(d.FRAMEBUFFER,d.COLOR_ATTACHMENT0,d.TEXTURE_2D,e,0),d.readPixels(0,0,t,n,d.RGBA,c.textureType,s),this.checkError(),c.decode(s,o)}isFramebufferReady(){return!0}getActiveTexture(){let e=this.gl;return`TEXTURE${e.getParameter(this.gl.ACTIVE_TEXTURE)-e.TEXTURE0}`}getTextureBinding(){return this.gl.getParameter(this.gl.TEXTURE_BINDING_2D)}getFramebufferBinding(){return this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING)}setVertexAttributes(e,t){let n=this.gl;n.vertexAttribPointer(e,3,n.FLOAT,!1,20,0),n.enableVertexAttribArray(e),t!==-1&&(n.vertexAttribPointer(t,2,n.FLOAT,!1,20,12),n.enableVertexAttribArray(t)),this.checkError()}createProgram(e,t){let n=this.gl,o=n.createProgram();return n.attachShader(o,e),n.attachShader(o,t),n.linkProgram(o),o}compileShader(e,t){let n=this.gl,o=n.createShader(t);if(!o)throw new Error(`createShader() returned null with type ${t}`);if(n.shaderSource(o,e),n.compileShader(o),n.getShaderParameter(o,n.COMPILE_STATUS)===!1)throw new Error(`Failed to compile shader: ${n.getShaderInfoLog(o)}
Shader source:
${e}`);return o}deleteShader(e){this.gl.deleteShader(e)}bindTextureToUniform(e,t,n){let o=this.gl;o.activeTexture(o.TEXTURE0+t),this.checkError(),o.bindTexture(o.TEXTURE_2D,e),this.checkError(),o.uniform1i(n,t),this.checkError()}draw(){this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.checkError()}checkError(){if(le.debug){let e=this.gl,t=e.getError(),n="";switch(t){case e.NO_ERROR:return;case e.INVALID_ENUM:n="INVALID_ENUM";break;case e.INVALID_VALUE:n="INVALID_VALUE";break;case e.INVALID_OPERATION:n="INVALID_OPERATION";break;case e.INVALID_FRAMEBUFFER_OPERATION:n="INVALID_FRAMEBUFFER_OPERATION";break;case e.OUT_OF_MEMORY:n="OUT_OF_MEMORY";break;case e.CONTEXT_LOST_WEBGL:n="CONTEXT_LOST_WEBGL";break;default:n=`Unknown WebGL Error: ${t.toString(16)}`}throw new Error(n)}}deleteTexture(e){this.gl.deleteTexture(e)}deleteProgram(e){this.gl.deleteProgram(e)}getEncoder(e,t,n=0){if(this.version===2)return new F0(this.gl,t);switch(e){case"float":return n===1||this.isRenderFloat32Supported?new zu(this.gl,t):new zu(this.gl,t,this.textureHalfFloatExtension.HALF_FLOAT_OES);case"int":throw new Error("not implemented");case"byte":return new j0(this.gl,t);default:throw new Error(`Invalid dataType: ${e}`)}}clearActiveTextures(){let e=this.gl;for(let t=0;t<this.maxTextureImageUnits;++t)e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,null)}dispose(){if(this.disposed)return;let e=this.gl;e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteFramebuffer(this.framebuffer),e.bindBuffer(e.ARRAY_BUFFER,null),e.deleteBuffer(this.vertexbuffer),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null),e.finish(),this.disposed=!0}createDefaultGeometry(){return new Float32Array([-1,1,0,0,1,-1,-1,0,0,0,1,1,0,1,1,1,-1,0,1,0])}createVertexbuffer(){let e=this.gl,t=e.createBuffer();if(!t)throw new Error("createBuffer() returned null");let n=this.createDefaultGeometry();return e.bindBuffer(e.ARRAY_BUFFER,t),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),this.checkError(),t}createFramebuffer(){let e=this.gl.createFramebuffer();if(!e)throw new Error("createFramebuffer returned null");return e}queryVitalParameters(){let e=this.gl;if(this.isFloatTextureAttachableToFrameBuffer=this.checkFloatTextureAttachableToFrameBuffer(),this.isRenderFloat32Supported=this.checkRenderFloat32(),this.isFloat32DownloadSupported=this.checkFloat32Download(),this.version===1&&!this.textureHalfFloatExtension&&!this.isRenderFloat32Supported)throw new Error("both float32 and float16 TextureType are not supported");this.isBlendSupported=!this.isRenderFloat32Supported||this.checkFloat32Blend(),this.maxTextureSize=e.getParameter(e.MAX_TEXTURE_SIZE),this.maxTextureImageUnits=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),this.version}getExtensions(){this.version===2?(this.colorBufferFloatExtension=this.gl.getExtension("EXT_color_buffer_float"),this.disjointTimerQueryWebgl2Extension=this.gl.getExtension("EXT_disjoint_timer_query_webgl2")):(this.textureFloatExtension=this.gl.getExtension("OES_texture_float"),this.textureHalfFloatExtension=this.gl.getExtension("OES_texture_half_float"))}checkFloatTextureAttachableToFrameBuffer(){let e=this.gl,t=e.createTexture();e.bindTexture(e.TEXTURE_2D,t);let n=this.version===2?e.RGBA32F:e.RGBA;e.texImage2D(e.TEXTURE_2D,0,n,1,1,0,e.RGBA,e.FLOAT,null);let o=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0);let u=e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE;return e.bindTexture(e.TEXTURE_2D,null),e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteTexture(t),e.deleteFramebuffer(o),u}checkRenderFloat32(){if(this.version===2){if(!this.colorBufferFloatExtension)return!1}else if(!this.textureFloatExtension)return!1;return this.isFloatTextureAttachableToFrameBuffer}checkFloat32Download(){if(this.version===2){if(!this.colorBufferFloatExtension)return!1}else if(!this.textureFloatExtension||!this.gl.getExtension("WEBGL_color_buffer_float"))return!1;return this.isFloatTextureAttachableToFrameBuffer}checkFloat32Blend(){let e=this.gl,t,n,o,u,l;try{t=e.createTexture(),n=e.createFramebuffer(),e.bindTexture(e.TEXTURE_2D,t);let d=this.version===2?e.RGBA32F:e.RGBA;return e.texImage2D(e.TEXTURE_2D,0,d,1,1,0,e.RGBA,e.FLOAT,null),e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),e.enable(e.BLEND),o=e.createShader(e.VERTEX_SHADER),!o||(e.shaderSource(o,"void main(){}"),e.compileShader(o),u=e.createShader(e.FRAGMENT_SHADER),!u)||(e.shaderSource(u,"precision highp float;void main(){gl_FragColor=vec4(0.5);}"),e.compileShader(u),l=e.createProgram(),!l)?!1:(e.attachShader(l,o),e.attachShader(l,u),e.linkProgram(l),e.useProgram(l),e.drawArrays(e.POINTS,0,1),e.getError()===e.NO_ERROR)}finally{e.disable(e.BLEND),l&&e.deleteProgram(l),o&&e.deleteShader(o),u&&e.deleteShader(u),n&&(e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteFramebuffer(n)),t&&(e.bindTexture(e.TEXTURE_2D,null),e.deleteTexture(t))}}beginTimer(){if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let e=this.gl,t=this.disjointTimerQueryWebgl2Extension,n=e.createQuery();return e.beginQuery(t.TIME_ELAPSED_EXT,n),n}else throw new Error("WebGL1 profiling currently not supported.")}endTimer(){if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let e=this.gl,t=this.disjointTimerQueryWebgl2Extension;e.endQuery(t.TIME_ELAPSED_EXT);return}else throw new Error("WebGL1 profiling currently not supported")}isTimerResultAvailable(e){let t=!1,n=!1;if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let o=this.gl,u=this.disjointTimerQueryWebgl2Extension;t=o.getQueryParameter(e,o.QUERY_RESULT_AVAILABLE),n=o.getParameter(u.GPU_DISJOINT_EXT)}else throw new Error("WebGL1 profiling currently not supported");return t&&!n}getTimerResult(e){let t=0;if(this.version===2){let n=this.gl;t=n.getQueryParameter(e,n.QUERY_RESULT),n.deleteQuery(e)}else throw new Error("WebGL1 profiling currently not supported");return t/1e6}async waitForQueryAndGetTime(e){return await Sp(()=>this.isTimerResultAvailable(e)),this.getTimerResult(e)}async createAndWaitForFence(){let e=this.createFence(this.gl);return this.pollFence(e)}createFence(e){let t,n=e,o=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);return e.flush(),o===null?t=()=>!0:t=()=>{let u=n.clientWaitSync(o,0,0);return u===n.ALREADY_SIGNALED||u===n.CONDITION_SATISFIED},{query:o,isFencePassed:t}}async pollFence(e){return new Promise(t=>{this.addItemToPoll(()=>e.isFencePassed(),()=>t())})}pollItems(){let e=ME(this.itemsToPoll.map(t=>t.isDoneFn));for(let t=0;t<=e;++t){let{resolveFn:n}=this.itemsToPoll[t];n()}this.itemsToPoll=this.itemsToPoll.slice(e+1)}async addItemToPoll(e,t){this.itemsToPoll.push({isDoneFn:e,resolveFn:t}),!(this.itemsToPoll.length>1)&&await Sp(()=>(this.pollItems(),this.itemsToPoll.length===0))}}});function dv(e){let t;if((!e||e==="webgl2")&&"webgl2"in Kr?t=Kr.webgl2:(!e||e==="webgl")&&"webgl"in Kr&&(t=Kr.webgl),!t)try{let o=LE();t=Af(o,e)}catch{let o=jE();t=Af(o,e)}e=e||t.version===1?"webgl":"webgl2";let n=t.gl;return Kr[e]=t,n.isContextLost()?(delete Kr[e],dv(e)):(n.disable(n.DEPTH_TEST),n.disable(n.STENCIL_TEST),n.disable(n.BLEND),n.disable(n.DITHER),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SAMPLE_COVERAGE),n.enable(n.SCISSOR_TEST),n.enable(n.CULL_FACE),n.cullFace(n.BACK),t)}function Af(e,t){let n={alpha:!1,depth:!1,antialias:!1,stencil:!1,preserveDrawingBuffer:!1,premultipliedAlpha:!1,failIfMajorPerformanceCaveat:!1},o,u=n;if((!t||t==="webgl2")&&(o=e.getContext("webgl2",u),o))try{return new el(o,2)}catch(l){We.warning("GlContextFactory",`failed to create WebGLContext using contextId 'webgl2'. Error: ${l}`)}if((!t||t==="webgl")&&(o=e.getContext("webgl",u)||e.getContext("experimental-webgl",u),o))try{return new el(o,1)}catch(l){We.warning("GlContextFactory",`failed to create WebGLContext using contextId 'webgl' or 'experimental-webgl'. Error: ${l}`)}throw new Error("WebGL is not supported")}function jE(){if(typeof document>"u")throw new TypeError("failed to create canvas: document is not supported");let e=document.createElement("canvas");return e.width=1,e.height=1,e}function LE(){if(typeof OffscreenCanvas>"u")throw new TypeError("failed to create offscreen canvas: OffscreenCanvas is not supported");return new OffscreenCanvas(1,1)}var Kr,VE=R(()=>{"use strict";Bt(),FE(),Kr={}}),cv,UE=R(()=>{"use strict";ot(),Bt(),BE(),VE(),cv=class{get contextId(){return le.webgl.contextId}set contextId(e){le.webgl.contextId=e}get matmulMaxBatchSize(){return le.webgl.matmulMaxBatchSize}set matmulMaxBatchSize(e){le.webgl.matmulMaxBatchSize=e}get textureCacheMode(){return le.webgl.textureCacheMode}set textureCacheMode(e){le.webgl.textureCacheMode=e}get pack(){return le.webgl.pack}set pack(e){le.webgl.pack=e}get async(){return le.webgl.async}set async(e){le.webgl.async=e}initialize(){try{return this.glContext=dv(this.contextId),typeof this.matmulMaxBatchSize!="number"&&(this.matmulMaxBatchSize=16),typeof this.textureCacheMode!="string"&&(this.textureCacheMode="full"),typeof this.pack!="boolean"&&(this.pack=!1),typeof this.async!="boolean"&&(this.async=!1),We.setWithEnv(le),le.webgl.context||Object.defineProperty(le.webgl,"context",{value:this.glContext.gl}),We.verbose("WebGLBackend",`Created WebGLContext: ${typeof this.glContext} with matmulMaxBatchSize: ${this.matmulMaxBatchSize}; textureCacheMode: ${this.textureCacheMode}; pack: ${this.pack}; async: ${this.async}.`),!0}catch(e){return We.warning("WebGLBackend",`Unable to initialize WebGLBackend. ${e}`),!1}}createSessionHandler(e){return new lv(this,e)}dispose(){this.glContext.dispose()}}});async function pv(e){if(e){let t=typeof e=="string"?[e]:e;for(let n of t){let o=El.get(n);if(o)return o;let u=await GE(n);if(u)return u}}else return pv(["webgl"]);throw new Error("no available backend to use")}async function GE(e){let t=hv;if(typeof t[e]<"u"&&qE(t[e])){let n=t[e],o=n.initialize();if(typeof o=="object"&&"then"in o&&(o=await o),o)return El.set(e,n),n}}function qE(e){let t=e;return"initialize"in t&&typeof t.initialize=="function"&&"createSessionHandler"in t&&typeof t.createSessionHandler=="function"&&"dispose"in t&&typeof t.dispose=="function"}var El,hv,HE=R(()=>{"use strict";UE(),El=new Map,hv={webgl:new cv}}),Pf,fv,WE=R(()=>{"use strict";Bt(),Pf=class{constructor(e,t){this.op=e,this.node=t}},fv=class{constructor(e,t,n){this.graph=e,this.profiler=n,this.initialize(t)}initialize(e){this.profiler.event("session","ExecutionPlan.initialize",()=>{let t=this.graph.getNodes();if(t.length!==e.length)throw new Error("The size of nodes and OPs do not match.");this._ops=e.map((n,o)=>new Pf(n,t[o])),this.reset(),this._starter=[],this._ops.forEach((n,o)=>{let u=!0;for(let l of n.node.inputs)if(!this._values[l]&&this.graph.getInputIndices().indexOf(l)===-1){u=!1;break}u&&this._starter.push(o)})})}reset(){this._values=this.graph.getValues().map(e=>e.tensor)}async execute(e,t){return this.profiler.event("session","ExecutionPlan.execute",async()=>{this.reset();let n=e.createInferenceHandler(),o=this.graph.getInputIndices();if(t.length!==o.length)throw new Error(`number of input tensors don't match the number of inputs to the model: actual: ${t.length} expected: ${o.length}`);t.forEach((r,i)=>{let a=o[i];this._values[a]=r});let u=this._starter.slice(0),l=this.graph.getValues(),d=this.graph.getNodes(),c=0;for(;c<u.length;){let r=u[c++],i=this._ops[r],a=i.node.inputs.map(b=>this._values[b]);if(a.indexOf(void 0)!==-1)throw new Error(`unresolved input detected: op: ${i.node}`);let p=a;We.verbose("ExecPlan",`Running op:${i.node.name} (${p.map((b,x)=>`'${i.node.inputs[x]}': ${b.type}[${b.dims.join(",")}]`).join(", ")})`);let h=await this.profiler.event("node",i.node.name,async()=>i.op.impl(n,p,i.op.context));if(h.length!==i.node.outputs.length)throw new Error("the size of output does not match model definition.");h.forEach((b,x)=>{let _=i.node.outputs[x];if(this._values[_])throw new Error(`output [${_}] already has value: op:${i.node.name}`);this._values[_]=b});let m=new Set;h.forEach((b,x)=>{let _=i.node.outputs[x];for(let y of l[_].to){let S=d[y],T=!0;for(let I of S.inputs)if(!this._values[I]){T=!1;break}T&&m.add(y)}}),u.push(...m)}let s=[];for(let r=0;r<this.graph.getOutputIndices().length;r++){let i=this.graph.getOutputIndices()[r],a=this._values[i];if(a===void 0)throw new Error(`required output [${i}] does not have value`);i===0?await a.getData():a.data,s.push(a)}return We.verbose("ExecPlan","disposing of inferenceHandler"),n.dispose(),s})}}}),we,tl,KE=R(()=>{"use strict";Mo(),we=ce(Ii()),En(),ke(),tl=class fi{constructor(t){if(this._attributes=new Map,t!=null){for(let n of t)n instanceof we.onnx.AttributeProto?this._attributes.set(n.name,[fi.getValue(n),fi.getType(n)]):n instanceof Pu.Attribute&&this._attributes.set(n.name(),[fi.getValue(n),fi.getType(n)]);if(this._attributes.size<t.length)throw new Error("duplicated attribute names")}}set(t,n,o){this._attributes.set(t,[o,n])}delete(t){this._attributes.delete(t)}getFloat(t,n){return this.get(t,"float",n)}getInt(t,n){return this.get(t,"int",n)}getString(t,n){return this.get(t,"string",n)}getTensor(t,n){return this.get(t,"tensor",n)}getFloats(t,n){return this.get(t,"floats",n)}getInts(t,n){return this.get(t,"ints",n)}getStrings(t,n){return this.get(t,"strings",n)}getTensors(t,n){return this.get(t,"tensors",n)}get(t,n,o){let u=this._attributes.get(t);if(u===void 0){if(o!==void 0)return o;throw new Error(`required attribute not found: ${t}`)}if(u[1]!==n)throw new Error(`type mismatch: expected ${n} but got ${u[1]}`);return u[0]}static getType(t){let n=t instanceof we.onnx.AttributeProto?t.type:t.type();switch(n){case we.onnx.AttributeProto.AttributeType.FLOAT:return"float";case we.onnx.AttributeProto.AttributeType.INT:return"int";case we.onnx.AttributeProto.AttributeType.STRING:return"string";case we.onnx.AttributeProto.AttributeType.TENSOR:return"tensor";case we.onnx.AttributeProto.AttributeType.FLOATS:return"floats";case we.onnx.AttributeProto.AttributeType.INTS:return"ints";case we.onnx.AttributeProto.AttributeType.STRINGS:return"strings";case we.onnx.AttributeProto.AttributeType.TENSORS:return"tensors";default:throw new Error(`attribute type is not supported yet: ${we.onnx.AttributeProto.AttributeType[n]}`)}}static getValue(t){let n=t instanceof we.onnx.AttributeProto?t.type:t.type();if(n===we.onnx.AttributeProto.AttributeType.GRAPH||n===we.onnx.AttributeProto.AttributeType.GRAPHS)throw new Error("graph attribute is not supported yet");let o=this.getValueNoCheck(t);if(n===we.onnx.AttributeProto.AttributeType.INT&&Ut.isLong(o))return Ut.longToNumber(o);if(n===we.onnx.AttributeProto.AttributeType.INTS){let u=o,l=new Array(u.length);for(let d=0;d<u.length;d++){let c=u[d];l[d]=Ut.longToNumber(c)}return l}if(n===we.onnx.AttributeProto.AttributeType.TENSOR)return t instanceof we.onnx.AttributeProto?gt.fromProto(o):gt.fromOrtTensor(o);if(n===we.onnx.AttributeProto.AttributeType.TENSORS){if(t instanceof we.onnx.AttributeProto)return o.map(u=>gt.fromProto(u));if(t instanceof Pu.Attribute)return o.map(u=>gt.fromOrtTensor(u))}return n===we.onnx.AttributeProto.AttributeType.STRING&&t instanceof we.onnx.AttributeProto?ku(o):n===we.onnx.AttributeProto.AttributeType.STRINGS&&t instanceof we.onnx.AttributeProto?o.map(ku):o}static getValueNoCheck(t){return t instanceof we.onnx.AttributeProto?this.getValueNoCheckFromOnnxFormat(t):this.getValueNoCheckFromOrtFormat(t)}static getValueNoCheckFromOnnxFormat(t){switch(t.type){case we.onnx.AttributeProto.AttributeType.FLOAT:return t.f;case we.onnx.AttributeProto.AttributeType.INT:return t.i;case we.onnx.AttributeProto.AttributeType.STRING:return t.s;case we.onnx.AttributeProto.AttributeType.TENSOR:return t.t;case we.onnx.AttributeProto.AttributeType.GRAPH:return t.g;case we.onnx.AttributeProto.AttributeType.FLOATS:return t.floats;case we.onnx.AttributeProto.AttributeType.INTS:return t.ints;case we.onnx.AttributeProto.AttributeType.STRINGS:return t.strings;case we.onnx.AttributeProto.AttributeType.TENSORS:return t.tensors;case we.onnx.AttributeProto.AttributeType.GRAPHS:return t.graphs;default:throw new Error(`unsupported attribute type: ${we.onnx.AttributeProto.AttributeType[t.type]}`)}}static getValueNoCheckFromOrtFormat(t){switch(t.type()){case Rt.AttributeType.FLOAT:return t.f();case Rt.AttributeType.INT:return t.i();case Rt.AttributeType.STRING:return t.s();case Rt.AttributeType.TENSOR:return t.t();case Rt.AttributeType.GRAPH:return t.g();case Rt.AttributeType.FLOATS:return t.floatsArray();case Rt.AttributeType.INTS:{let n=[];for(let o=0;o<t.intsLength();o++)n.push(t.ints(o));return n}case Rt.AttributeType.STRINGS:{let n=[];for(let o=0;o<t.stringsLength();o++)n.push(t.strings(o));return n}case Rt.AttributeType.TENSORS:{let n=[];for(let o=0;o<t.tensorsLength();o++)n.push(t.tensors(o));return n}default:throw new Error(`unsupported attribute type: ${Rt.AttributeType[t.type()]}`)}}}}),pa,rl,Kt,ha,kf,XE=R(()=>{"use strict";KE(),Mo(),pa=ce(Ii()),En(),ke(),rl={from:(e,t)=>new kf(e,t)},Kt=class{constructor(e){this._from=void 0,this._to=[],this.tensor=void 0,this.type=void 0,e&&(this.type=ht.tensorValueTypeFromProto(e.type.tensorType))}get from(){return this._from}get to(){return this._to}},ha=class{constructor(e,t){e instanceof pa.onnx.NodeProto?(this.name=e.name,this.opType=e.opType,this.attributes=new tl(e.attribute)):e instanceof I0.Node&&(this.name=t??e.name(),this.opType=e.opType(),this.attributes=new tl(ht.tensorAttributesFromORTFormat(e))),this.inputs=[],this.outputs=[],this.executeNode=!0}},kf=class{constructor(e,t){if(!e)throw new TypeError("graph is empty");this.buildGraph(e),this.transformGraph(t),this.checkIsAcyclic()}getInputIndices(){return this._allInputIndices}getInputNames(){return this._allInputNames}getOutputIndices(){return this._allOutputIndices}getOutputNames(){return this._allOutputNames}getValues(){return this._allData}getNodes(){return this._nodes}buildGraph(e){if(e instanceof pa.onnx.GraphProto)this.buildGraphFromOnnxFormat(e);else if(e instanceof T0.Graph)this.buildGraphFromOrtFormat(e);else throw new TypeError("Graph type is not supported.")}buildGraphFromOnnxFormat(e){let t=new Map;this._allData=[],this._allInputIndices=[],this._allInputNames=[],this._allOutputIndices=[],this._allOutputNames=[],this._nodes=[];let n=new Map;if(!e.input)throw new Error("missing information in graph: input");let o=[];for(let u of e.input){if(t.has(u.name))throw new Error(`duplicated input name: ${u.name}`);let l=this._allData.push(new Kt(u))-1;t.set(u.name,l),o.push(u.name)}if(!e.initializer)throw new Error("missing information in graph: initializer");for(let u of e.initializer){let l=t.get(u.name);if(l===void 0){let d=new Kt;d.type={shape:{dims:ht.tensorDimsFromProto(u.dims)},tensorType:ht.tensorDataTypeFromProto(u.dataType)},l=this._allData.push(d)-1,t.set(u.name,l)}this._allData[l]._from=-1,this._allData[l].tensor=gt.fromProto(u)}for(let u=0;u<this._allData.length;u++)this._allData[u].tensor||(this._allInputIndices.push(u),this._allInputNames.push(o[u]));if(!e.output)throw new Error("missing information in graph: output");for(let u of e.output){if(t.has(u.name))throw new Error(`duplicated output name: ${u.name}`);let l=this._allData.push(new Kt(u))-1;t.set(u.name,l),this._allOutputIndices.push(l),this._allOutputNames.push(u.name)}if(!e.node)throw new Error("missing information in graph: node");for(let u of e.node){if(!u.name)for(let d=0;;d++){let c=`unnamed_${u.opType}_${d}`;if(!n.has(c)){u.name=c;break}}if(n.has(u.name))throw new Error(`duplicated node name: ${u.name}`);let l=this._nodes.push(new ha(u))-1;n.set(u.name,l)}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.node[u];if(!d.output)throw new Error(`missing output for node: ${d.name}`);for(let c of d.output){let s=t.get(c);if(typeof s>"u"&&(s=this._allData.push(new Kt)-1,t.set(c,s)),l.outputs.push(s),this._allData[s]._from!==void 0)throw new Error(`multiple nodes output to one data value: ${s}`);if(this._allData[s]._from=u,d.opType==="Constant"){if(!d.attribute||d.attribute.length!==1||!d.attribute[0].t)throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");if(!d.output||d.output.length!==1)throw new Error("missing output or incorrect number of outputs for this Constant operator");l.outputs.pop(),l.executeNode=!1,this._allData[s]._from=-1,this._allData[s].tensor=gt.fromProto(d.attribute[0].t)}}}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.node[u];if(!d.input)throw new Error(`missing input for node: ${d.name}`);for(let c of d.input){let s=t.get(c);if(typeof s>"u"){if(c===""&&(d.input.length===3||d.input.length===4)&&d.opType==="Resize")continue;throw new Error(`unrecognized input '${c}' for node: ${d.name}`)}l.inputs.push(s),this._allData[s]._to.push(u)}}return!0}buildGraphFromOrtFormat(e){let t=new Map;this._allData=[],this._allInputIndices=[],this._allInputNames=[],this._allOutputIndices=[],this._allOutputNames=[],this._nodes=[];let n=new Map,o=[];for(let u=0;u<e.inputsLength();u++){let l=e.inputs(u);if(t.has(l))throw new Error(`duplicated input name: ${l}`);for(let d=0;d<e.nodeArgsLength();d++)if(e.nodeArgs(d)?.name()===l){let c=new Kt;if(e.nodeArgs(d)?.type()?.valueType()!==E0.TypeInfoValue.tensor_type)throw new Error("Unexpected value type for the nodeArg.");let s=e.nodeArgs(d).type().value(new O0.TensorTypeAndShape),r=ht.tensorDataTypeFromProto(s.elemType()),i=s.shape(),a=[];for(let h=0;h<i.dimLength();h++)a.push(Ut.longToNumber(i.dim(h).value().dimValue()));c.type={shape:{dims:a},tensorType:r};let p=this._allData.push(c)-1;t.set(l,p),o.push(l)}}for(let u=0;u<e.initializersLength();u++){let l=e.initializers(u),d=t.get(l.name());if(d===void 0){let c=new Kt,s=ht.tensorDimsFromORTFormat(l),r=ht.tensorDataTypeFromProto(l.dataType());c.type={shape:{dims:s},tensorType:r},d=this._allData.push(c)-1,t.set(l.name(),d)}this._allData[d]._from=-1,this._allData[d].tensor=gt.fromOrtTensor(l)}for(let u=0;u<this._allData.length;u++)this._allData[u].tensor||(this._allInputIndices.push(u),this._allInputNames.push(o[u]));for(let u=0;u<e.outputsLength();u++){let l=e.outputs(u);if(t.has(l))throw new Error(`duplicated output name: ${l}`);let d=this._allData.push(new Kt)-1;t.set(l,d),this._allOutputIndices.push(d),this._allOutputNames.push(l)}if(!e.nodes)throw new Error("missing information in graph: node");for(let u=0;u<e.nodesLength();u++){let l=e.nodes(u),d=l.name();if(!d)for(let s=0;d=`unnamed_${l.opType()}_${s}`,!!n.has(d);s++);if(n.has(d))throw new Error(`duplicated node name: ${d}`);let c=this._nodes.push(new ha(l,d))-1;n.set(d,c)}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.nodes(u);if(d==null)throw new Error(`No node exists at index ${u}`);if(d?.outputsLength()===0)throw new Error(`missing output for node: ${d.name}`);for(let c=0;c<d?.outputsLength();c++){let s=d?.outputs(c),r=t.get(s);if(typeof r>"u"&&(r=this._allData.push(new Kt)-1,t.set(s,r)),l.outputs.push(r),this._allData[r]._from!==void 0)throw new Error(`multiple nodes output to one data value: ${r}`);if(this._allData[r]._from=u,d.opType()==="Constant"){if(d.attributesLength()!==1||!d.attributes(0).t())throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");if(d.outputsLength()!==1)throw new Error("missing output or incorrect number of outputs for this Constant operator");l.outputs.pop(),l.executeNode=!1,this._allData[r]._from=-1,this._allData[r].tensor=gt.fromOrtTensor(d.attributes(0).t())}}}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.nodes(u);if(d.inputsLength()===0)throw new Error(`missing input for node: ${d.name}`);for(let c=0;c<d.inputsLength();c++){let s=d.inputs(c),r=t.get(s);if(typeof r>"u")throw new Error(`unrecognized input '${s}' for node: ${d.name()}`);l.inputs.push(r),this._allData[r]._to.push(u)}}}checkIsAcyclic(){let e=new Set;this._allInputIndices.forEach(o=>{this._allData[o]._to.forEach(u=>{e.add(u)})});let t=Array.from(e),n=new Array(this._nodes.length).fill("white");for(;t.length>0;){let o=t.pop();n[o]==="gray"?n[o]="black":(t.push(o),n[o]="gray",this._nodes[o].outputs.forEach(u=>{let l=this._allData[u];if(typeof l.tensor<"u")throw new Error("node outputs should not be initialized");if(l._from!==o)throw new Error("from property of the Value object doesn't match index of Node being processed");l._to.forEach(d=>{if(n[d]==="gray")throw new Error("model graph is cyclic");n[d]==="white"&&t.push(d)})}))}}transformGraph(e){this.removeAllIdentityNodes(),this.removeAllDropoutNodes(),this.fuseConvActivationNodes(),e&&e.transformGraph(this),this.finalizeGraph()}finalizeGraph(){let e=0,t=new Array(this._nodes.length,0),n=0;for(let o=0;o<this._nodes.length;o++)t[o]=n,this._nodes[o].executeNode?(n!==o&&(this._nodes[n]=this._nodes[o]),n++):this._nodes[o].outputs.forEach(u=>{this._allData[u]._from=-2});this._nodes.splice(n,this._nodes.length-n);for(let o=0;o<this._allData.length;o++){let u=this._allData[o];u._from!==void 0&&u._from!==-1&&u._from!==-2&&(u._from=t[u._from]);for(let l=0;l<u._to.length;l++)if(u._to[l]>=0)u._to[l]=t[u._to[l]];else throw new Error("Trying to update a removed node")}e=0;for(let o=0;o<this._allData.length;o++){if(this._allData[o].from===-2&&this._allOutputIndices.indexOf(o+e)===-1){e++,this._allData.splice(o,1),o--;continue}if(e>0){let u=-1;this._allData[o].from!==void 0&&this._allData[o].from!==-1?(u=this._nodes[this._allData[o].from].outputs.indexOf(o+e),u!==-1&&(this._nodes[this._allData[o].from].outputs[u]=o)):(u=this._allInputIndices.indexOf(o+e),u!==-1&&(this._allInputIndices[u]=o)),this._allData[o].to.forEach(l=>{u=this._nodes[l].inputs.indexOf(o+e),u!==-1&&(this._nodes[l].inputs[u]=o)}),this._allData[o].to.length===0&&(u=this._allOutputIndices.indexOf(o+e),u!==-1&&(this._allOutputIndices[u]=o))}}}deleteNode(e){let t=this._nodes[e];if(t.outputs.length>1){for(let d=1;d<t.outputs.length;d++)if(this._allData[t.outputs[d]].to.length>0)throw new Error("Node deletion with more than one output connected to other nodes is not supported. ")}t.executeNode=!1;let n=t.inputs[0],o=t.outputs[0],u=this._allData[o].to;for(let d=0;d<t.inputs.length;d++){let c=this._allData[t.inputs[d]].to.indexOf(e);if(c===-1)throw new Error("The Value object doesn't have the current Node in it's 'to' property ");this._allData[t.inputs[d]].to.splice(c,1)}this._allData[o]._to=[];let l=this._allOutputIndices.indexOf(o);if(l!==-1&&(this._allOutputIndices[l]=n),u&&u.length>0)for(let d of u){let c=this._nodes[d].inputs.indexOf(o);if(c===-1)throw new Error("The Node object doesn't have the output Value in it's 'inputs' property ");this._nodes[d].inputs[c]=n,this._allData[n].to.push(d)}}removeAllDropoutNodes(){let e=0;for(let t of this._nodes){if(t.opType==="Dropout"){if(t.inputs.length!==1)throw new Error("Dropout nodes should only contain one input. ");if(t.outputs.length!==1&&t.outputs.length!==2)throw new Error("Dropout nodes should contain either 1 or 2 output(s)");if(t.outputs.length===2&&this._allData[t.outputs[1]]._to.length!==0)throw new Error("Dropout nodes's second output should not be referenced by other nodes");this.deleteNode(e)}e++}}removeAllIdentityNodes(){let e=0;for(let t of this._nodes)t.opType==="Identity"&&this.deleteNode(e),e++}isActivation(e){switch(e.opType){case"Relu":case"Sigmoid":case"Clip":return!0;default:return!1}}fuseConvActivationNodes(){for(let e of this._nodes)if(e.opType==="Conv"){let t=this._allData[e.outputs[0]]._to;if(t.length===1&&this.isActivation(this._nodes[t[0]])){let n=this._nodes[t[0]];if(n.opType==="Clip")if(n.inputs.length===1)try{e.attributes.set("activation_params","floats",[n.attributes.getFloat("min"),n.attributes.getFloat("max")])}catch{e.attributes.set("activation_params","floats",[xi,$i])}else if(n.inputs.length>=3&&this._allData[n.inputs[1]].tensor!==void 0&&this._allData[n.inputs[2]].tensor!==void 0)e.attributes.set("activation_params","floats",[this._allData[n.inputs[1]].tensor.floatData[0],this._allData[n.inputs[2]].tensor.floatData[0]]);else continue;e.attributes.set("activation","string",n.opType),this.deleteNode(t[0])}}}}}),Cf,Df,mv,ZE=R(()=>{"use strict";Cf=ce(Pe()),XE(),Mo(),Df=ce(Ii()),ke(),mv=class{constructor(){}load(e,t,n){let o;if(!n)try{this.loadFromOnnxFormat(e,t);return}catch(u){if(n!==void 0)throw u;o=u}try{this.loadFromOrtFormat(e,t)}catch(u){throw n!==void 0?u:new Error(`Failed to load model as ONNX format: ${o}
as ORT format: ${u}`)}}loadFromOnnxFormat(e,t){let n=Df.onnx.ModelProto.decode(e);if(Ut.longToNumber(n.irVersion)<3)throw new Error("only support ONNX model with IR_VERSION>=3");this._opsets=n.opsetImport.map(o=>({domain:o.domain,version:Ut.longToNumber(o.version)})),this._graph=rl.from(n.graph,t)}loadFromOrtFormat(e,t){let n=new Cf.ByteBuffer(e),o=S0.InferenceSession.getRootAsInferenceSession(n).model();if(Ut.longToNumber(o.irVersion())<3)throw new Error("only support ONNX model with IR_VERSION>=3");this._opsets=[];for(let u=0;u<o.opsetImportLength();u++){let l=o.opsetImport(u);this._opsets.push({domain:l?.domain(),version:Ut.longToNumber(l.version())})}this._graph=rl.from(o.graph(),t)}get graph(){return this._graph}get opsets(){return this._opsets}}}),gv,JE=R(()=>{"use strict";HE(),WE(),Bt(),ZE(),gv=class{constructor(e={}){this._initialized=!1,this.backendHint=e.backendHint,this.profiler=jy.create(e.profiler),this.context={profiler:this.profiler,graphInputTypes:[],graphInputDims:[]}}get inputNames(){return this._model.graph.getInputNames()}get outputNames(){return this._model.graph.getOutputNames()}startProfiling(){this.profiler.start()}endProfiling(){this.profiler.stop()}async loadModel(e,t,n){await this.profiler.event("session","Session.loadModel",async()=>{let o=await pv(this.backendHint);if(this.sessionHandler=o.createSessionHandler(this.context),this._model=new mv,typeof e=="string"){let u=e.endsWith(".ort");{let l=await(await fetch(e)).arrayBuffer();this.initialize(new Uint8Array(l),u)}}else if(ArrayBuffer.isView(e))this.initialize(e);else{let u=new Uint8Array(e,t||0,n||e.byteLength);this.initialize(u)}})}initialize(e,t){if(this._initialized)throw new Error("already initialized");this.profiler.event("session","Session.initialize",()=>{let n=this.sessionHandler.transformGraph?this.sessionHandler:void 0;this._model.load(e,n,t),this.sessionHandler.onGraphInitialized&&this.sessionHandler.onGraphInitialized(this._model.graph),this.initializeOps(this._model.graph),this._executionPlan=new fv(this._model.graph,this._ops,this.profiler)}),this._initialized=!0}async run(e){if(!this._initialized)throw new Error("session not initialized yet");return this.profiler.event("session","Session.run",async()=>{let t=this.normalizeAndValidateInputs(e),n=await this._executionPlan.execute(this.sessionHandler,t);return this.createOutput(n)})}normalizeAndValidateInputs(e){let t=this._model.graph.getInputNames();if(Array.isArray(e)){if(e.length!==t.length)throw new Error(`incorrect input array length: expected ${t.length} but got ${e.length}`)}else{if(e.size!==t.length)throw new Error(`incorrect input map size: expected ${t.length} but got ${e.size}`);let n=new Array(e.size),o=0;for(let u=0;u<t.length;++u){let l=e.get(t[u]);if(!l)throw new Error(`missing input tensor for: '${name}'`);n[o++]=l}e=n}if(!this.context.graphInputTypes||this.context.graphInputTypes.length===0||!this.context.graphInputDims||this.context.graphInputDims.length===0){let n=this._model.graph.getInputIndices(),o=this._model.graph.getValues(),u=new Array(n.length);for(let l=0;l<n.length;++l){let d=o[n[l]];u[l]=d.type.shape.dims,this.context.graphInputTypes.push(d.type.tensorType),this.context.graphInputDims.push(e[l].dims)}this.validateInputTensorDims(u,e,!0)}else this.validateInputTensorDims(this.context.graphInputDims,e,!1);return this.validateInputTensorTypes(this.context.graphInputTypes,e),e}validateInputTensorTypes(e,t){for(let n=0;n<t.length;n++){let o=e[n],u=t[n].type;if(o!==u)throw new Error(`input tensor[${n}] check failed: expected type '${o}' but got ${u}`)}}validateInputTensorDims(e,t,n){for(let o=0;o<t.length;o++){let u=e[o],l=t[o].dims;if(!this.compareTensorDims(u,l,n))throw new Error(`input tensor[${o}] check failed: expected shape '[${u.join(",")}]' but got [${l.join(",")}]`)}}compareTensorDims(e,t,n){if(e.length!==t.length)return!1;for(let o=0;o<e.length;++o)if(e[o]!==t[o]&&(!n||e[o]!==0))return!1;return!0}createOutput(e){let t=this._model.graph.getOutputNames();if(e.length!==t.length)throw new Error("expected number of outputs do not match number of generated outputs");let n=new Map;for(let o=0;o<t.length;++o)n.set(t[o],e[o]);return n}initializeOps(e){let t=e.getNodes();this._ops=new Array(t.length);for(let n=0;n<t.length;n++)this._ops[n]=this.sessionHandler.resolve(t[n],this._model.opsets,e)}}}),bv,YE=R(()=>{"use strict";ot(),En(),bv=class{constructor(e){this.session=e,this.inputNames=this.session.inputNames,this.outputNames=this.session.outputNames}get inputMetadata(){throw new Error("Getting model metadata is not supported in webgl backend.")}get outputMetadata(){throw new Error("Getting model metadata is not supported in webgl backend.")}async dispose(){}async run(e,t,n){let o=new Map;for(let d in e)if(Object.hasOwnProperty.call(e,d)){let c=e[d];o.set(d,new gt(c.dims,c.type,void 0,void 0,c.data))}let u=await this.session.run(o),l={};return u.forEach((d,c)=>{l[c]=new mt(d.type,d.data,d.dims)}),l}startProfiling(){this.session.startProfiling()}endProfiling(){this.session.endProfiling()}}}),yv={};un(yv,{onnxjsBackend:()=>_v});var Rf,_v,QE=R(()=>{"use strict";JE(),YE(),Rf=class{async init(){}async createInferenceSessionHandler(e,t){let n=new gv(t);return typeof e=="string"?await n.loadModel(e):await n.loadModel(e),new bv(n)}},_v=new Rf}),Al=R(()=>{"use strict"}),wv={};un(wv,{default:()=>vv});var fa,ma,vv,eA=R(()=>{"use strict";A2(),dn(),Pl(),fa="ort-wasm-proxy-worker",ma=globalThis.self?.name===fa,ma&&(self.onmessage=e=>{let{type:t,in:n}=e.data;try{switch(t){case"init-wasm":kl(n.wasm).then(()=>{Kl(n).then(()=>{postMessage({type:t})},o=>{postMessage({type:t,err:o})})},o=>{postMessage({type:t,err:o})});break;case"init-ep":{let{epName:o,env:u}=n;Xl(u,o).then(()=>{postMessage({type:t})},l=>{postMessage({type:t,err:l})});break}case"copy-from":{let{buffer:o}=n,u=Co(o);postMessage({type:t,out:u});break}case"create":{let{model:o,options:u}=n;Zl(o,u).then(l=>{postMessage({type:t,out:l})},l=>{postMessage({type:t,err:l})});break}case"release":Jl(n),postMessage({type:t});break;case"run":{let{sessionId:o,inputIndices:u,inputs:l,outputIndices:d,options:c}=n;Yl(o,u,l,d,new Array(d.length).fill(null),c).then(s=>{s.some(r=>r[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:s},ed([...l,...s]))},s=>{postMessage({type:t,err:s})});break}case"end-profiling":Ql(n),postMessage({type:t});break;default:}}catch(o){postMessage({type:t,err:o})}}),vv=ma?null:e=>new Worker(e??pt,{type:"module",name:fa})}),xv={};un(xv,{default:()=>$v});async function Nf(e={}){var t=e,n=!!globalThis.window,o=!!globalThis.WorkerGlobalScope,u=o&&self.name?.startsWith("em-pthread");t.mountExternalData=(f,g)=>{f.startsWith("./")&&(f=f.substring(2)),(t.Yc||(t.Yc=new Map)).set(f,g)},t.unmountExternalData=()=>{delete t.Yc,delete t.Zd,delete t.Yd,delete t.$d},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let l=f=>async(...g)=>{try{if(t.Xc)throw Error("Session already started");let $=t.Xc={Kd:g[0],errors:[]},v=await f(...g);if(t.Xc!==$)throw Error("Session mismatch");t.dd?.flush();let E=$.errors;if(0<E.length){let P=await Promise.all(E);if(P=P.filter(N=>N),0<P.length)throw Error(P.join(`
`))}return v}finally{t.Xc=null}};t.jsepInit=(f,g)=>{if(f==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=g;let $=t.dd;t.jsepRegisterBuffer=(v,E,P,N)=>$.registerBuffer(v,E,P,N),t.jsepGetBuffer=v=>$.getBuffer(v),t.jsepCreateDownloader=(v,E,P)=>$.createDownloader(v,E,P),t.jsepOnCreateSession=v=>{$.onCreateSession(v)},t.jsepOnReleaseSession=v=>{$.onReleaseSession(v)},t.jsepOnRunStart=v=>$.onRunStart(v),t.Id=(v,E)=>{$.upload(v,E)}}else if(f==="webnn"){let $=g[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=g.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=v=>$.onRunStart(v),t.webnnOnRunEnd=$.onRunEnd.bind($),t.webnnOnReleaseSession=v=>{$.onReleaseSession(v)},t.webnnCreateMLTensorDownloader=(v,E)=>$.createMLTensorDownloader(v,E),t.webnnRegisterMLTensor=(v,E,P,N)=>$.registerMLTensor(v,E,P,N),t.webnnCreateMLContext=v=>$.createMLContext(v),t.webnnRegisterGraphInput=$.registerGraphInput.bind($),t.webnnIsGraphInput=$.isGraphInput.bind($),t.webnnRegisterGraphOutput=$.registerGraphOutput.bind($),t.webnnIsGraphOutput=$.isGraphOutput.bind($),t.webnnCreateTemporaryTensor=$.createTemporaryTensor.bind($),t.webnnIsGraphInputOutputTypeSupported=$.isGraphInputOutputTypeSupported.bind($)}};let d=()=>{let f=g=>(...$)=>{let v=Ft;return $=g(...$),Ft!=v?new Promise((E,P)=>{bs={resolve:E,reject:P}}):$};(()=>{for(let g of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[g]=f(t[g])})(),l!==void 0&&(t._OrtRun=l(t._OrtRun),t._OrtRunWithBinding=l(t._OrtRunWithBinding)),d=void 0};t.asyncInit=()=>{d?.()};var c,s,r=(f,g)=>{throw g},i=import.meta.url,a="";if(n||o){try{a=new URL(".",i).href}catch{}o&&(s=f=>{var g=new XMLHttpRequest;return g.open("GET",f,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}),c=async f=>{if(k(f))return new Promise(($,v)=>{var E=new XMLHttpRequest;E.open("GET",f,!0),E.responseType="arraybuffer",E.onload=()=>{E.status==200||E.status==0&&E.response?$(E.response):v(E.status)},E.onerror=v,E.send(null)});var g=await fetch(f,{credentials:"same-origin"});if(g.ok)return g.arrayBuffer();throw Error(g.status+" : "+g.url)}}var p,h,m,b,x,_,y=console.log.bind(console),S=console.error.bind(console),T=y,I=S,A=!1,k=f=>f.startsWith("file://");function O(){nr.buffer!=Y.buffer&&X()}if(u){let f=function(g){try{var $=g.data,v=$.Sc;if(v==="load"){let E=[];self.onmessage=P=>E.push(P),_=()=>{postMessage({Sc:"loaded"});for(let P of E)f(P);self.onmessage=f};for(let P of $.xd)t[P]&&!t[P].proxy||(t[P]=(...N)=>{postMessage({Sc:"callHandler",vd:P,args:N})},P=="print"&&(T=t[P]),P=="printErr"&&(I=t[P]));nr=$.Od,X(),h=$.Pd,ye(),Zi()}else if(v==="run"){(function(E){var P=(O(),C)[E+52>>>2>>>0];E=(O(),C)[E+56>>>2>>>0],yc(P,P-E),me(P)})($.Rc),xs($.Rc,0,0,1,0,0),_d(),fs($.Rc),G||(pc(),G=!0);try{rT($.Md,$.bd)}catch(E){if(E!="unwind")throw E}}else $.target!=="setimmediate"&&(v==="checkMailbox"?G&&Ui():v&&(I(`worker: received unknown command ${v}`),I($)))}catch(E){throw hc(),E}};var z=f,G=!1;self.onunhandledrejection=g=>{throw g.reason||g},self.onmessage=f}var Y,W,D,Q,w,C,F,V,U,q,M,Z=!1;function X(){var f=nr.buffer;t.HEAP8=Y=new Int8Array(f),D=new Int16Array(f),t.HEAPU8=W=new Uint8Array(f),Q=new Uint16Array(f),t.HEAP32=w=new Int32Array(f),t.HEAPU32=C=new Uint32Array(f),F=new Float32Array(f),V=new Float64Array(f),U=new BigInt64Array(f),q=new BigUint64Array(f)}function H(){Z=!0,u?_():Wt.sb()}function pe(f){throw I(f="Aborted("+f+")"),A=!0,f=new WebAssembly.RuntimeError(f+". Build with -sASSERTIONS for more info."),x?.(f),f}function fe(){return{a:{ma:OS,hb:IS,g:nT,J:iT,f:oT,o:sT,i:aT,$:uT,b:lT,S:dT,Ia:Sd,n:cT,aa:Ad,Ya:Pd,Ea:kd,Ga:Cd,Za:Dd,Wa:Rd,Pa:Nd,Va:zd,ka:Bd,Fa:Md,Ca:Fd,Xa:jd,Da:Ld,cb:pT,fa:fT,xa:mT,va:bT,ea:_T,N:wT,H:vT,wa:xT,_:AT,ya:PT,Sa:kT,Aa:DT,Ja:RT,ta:NT,ga:zT,Ra:fs,$a:BT,Q:LT,r:HT,c:ps,ib:WT,y:KT,M:XT,D:ZT,l:JT,s:Xd,jb:YT,I:QT,R:eS,j:tS,u:rS,q:nS,k:iS,Ma:oS,Na:sS,Oa:aS,Ka:Qd,La:ec,ua:tc,eb:lS,bb:pS,v:hS,ba:fS,ha:mS,ab:dS,V:gS,_a:bS,Ba:yS,F:uS,T:_S,la:Ki,za:vS,gb:wS,fb:xS,Ta:oc,Ua:sc,Ha:as,U:ac,ja:uc,Qa:lc,ia:dc,lb:lI,na:iI,mb:uI,oa:nI,G:WS,e:kS,t:AS,w:ES,B:LS,nb:eI,Z:QS,x:RS,pa:tI,X:oI,ca:YS,ob:JS,pb:ZS,O:VS,qa:XS,qb:KS,L:qS,Y:rI,d:PS,A:DS,m:CS,kb:dI,p:zS,z:BS,C:NS,E:MS,K:US,ra:HS,P:sI,da:GS,W:aI,rb:jS,sa:FS,h:TS,a:nr,db:ss}}}async function ye(){function f(v,E){var P=Wt=v.exports;v={};for(let[N,L]of Object.entries(P))typeof L=="function"?(P=MT(L),v[N]=P):v[N]=L;return Wt=v,Wt=(function(){var N=Wt,L=ee=>de=>ee(de)>>>0,J=ee=>()=>ee()>>>0;return(N=Object.assign({},N)).tb=L(N.tb),N.Xb=J(N.Xb),N.Zb=L(N.Zb),N.lc=L(N.lc),N.mc=J(N.mc),N.qc=L(N.qc),N})(),bd.push(Wt._b),cc=(v=Wt).tb,pc=v.ub,t._OrtInit=v.vb,t._OrtGetLastError=v.wb,t._OrtCreateSessionOptions=v.xb,t._OrtAppendExecutionProvider=v.yb,t._OrtAddFreeDimensionOverride=v.zb,t._OrtAddSessionConfigEntry=v.Ab,t._OrtReleaseSessionOptions=v.Bb,t._OrtCreateSession=v.Cb,t._OrtReleaseSession=v.Db,t._OrtGetInputOutputCount=v.Eb,t._OrtGetInputOutputMetadata=v.Fb,t._OrtFree=v.Gb,t._OrtCreateTensor=v.Hb,t._OrtGetTensorData=v.Ib,t._OrtReleaseTensor=v.Jb,t._OrtCreateRunOptions=v.Kb,t._OrtAddRunConfigEntry=v.Lb,t._OrtReleaseRunOptions=v.Mb,t._OrtCreateBinding=v.Nb,t._OrtBindInput=v.Ob,t._OrtBindOutput=v.Pb,t._OrtClearBoundOutputs=v.Qb,t._OrtReleaseBinding=v.Rb,t._OrtRunWithBinding=v.Sb,t._OrtRun=v.Tb,t._OrtEndProfiling=v.Ub,t._JsepOutput=v.Vb,t._JsepGetNodeName=v.Wb,Xi=v.Xb,jt=t._free=v.Yb,Gn=t._malloc=v.Zb,xs=v.ac,hc=v.bc,fc=v.cc,mc=v.dc,$s=v.ec,gc=v.fc,bc=v.gc,_e=v.hc,qn=v.ic,yc=v.jc,me=v.kc,Ts=v.lc,ge=v.mc,_c=v.nc,Ss=v.oc,wc=v.pc,vc=v.qc,xc=v.rc,Is=v.sc,$c=v.tc,Tc=v.uc,Sc=v.vc,Ic=v.wc,Oc=v.xc,Ec=v.yc,Ac=v.zc,Pc=v.Ac,kc=v.Bc,Cc=v.Cc,Dc=v.Dc,Rc=v.Ec,Nc=v.Fc,zc=v.Gc,Bc=v.Hc,Mc=v.Ic,Fc=v.Jc,jc=v.Kc,Lc=v.Lc,Vc=v.Mc,Uc=v.Nc,Gc=v.Pc,qc=v.Qc,Hc=v.$c,Wc=v.ad,Kc=v.fd,Xc=v.kd,Zc=v.ld,Jc=v.md,Yc=v.nd,Qc=v.od,ep=v.pd,tp=v.qd,rp=v.rd,np=v.wd,ip=v.Ud,op=v.Vd,sp=v.Wd,ap=v.Xd,h=E,Wt}var g,$=fe();return t.instantiateWasm?new Promise(v=>{t.instantiateWasm($,(E,P)=>{v(f(E,P))})}):u?f(new WebAssembly.Instance(h,fe()),h):(M??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",a):a+"ort-wasm-simd-threaded.jsep.wasm":new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href,g=await(async function(v){var E=M;if(!p&&!k(E))try{var P=fetch(E,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(P,v)}catch(N){I(`wasm streaming compile failed: ${N}`),I("falling back to ArrayBuffer instantiation")}return(async function(N,L){try{var J=await(async function(ee){if(!p)try{var de=await c(ee);return new Uint8Array(de)}catch{}if(ee==M&&p)ee=new Uint8Array(p);else{if(!s)throw"both async and sync fetching of the wasm failed";ee=s(ee)}return ee})(N);return await WebAssembly.instantiate(J,L)}catch(ee){I(`failed to asynchronously prepare wasm: ${ee}`),pe(ee)}})(E,v)})($),f(g.instance,g.module))}class Me{name="ExitStatus";constructor(g){this.message=`Program terminated with exit(${g})`,this.status=g}}var Oe=f=>{f.terminate(),f.onmessage=()=>{}},Le=[],ut=0,Ir=null,Mi=f=>{rr.length==0&&(vd(),wd(rr[0]));var g=rr.pop();if(!g)return 6;Vn.push(g),Or[f.Rc]=g,g.Rc=f.Rc;var $={Sc:"run",Md:f.Ld,bd:f.bd,Rc:f.Rc};return g.postMessage($,f.jd),0},tr=0,Fe=(f,g,...$)=>{var v,E=16*$.length,P=ge(),N=Ts(E),L=N>>>3;for(v of $)typeof v=="bigint"?((O(),U)[L++>>>0]=1n,(O(),U)[L++>>>0]=v):((O(),U)[L++>>>0]=0n,(O(),V)[L++>>>0]=v);return f=fc(f,0,E,N,g),me(P),f};function ss(f){if(u)return Fe(0,1,f);if(m=f,!(0<tr)){for(var g of Vn)Oe(g);for(g of rr)Oe(g);rr=[],Vn=[],Or={},A=!0}r(0,new Me(f))}function gd(f){if(u)return Fe(1,0,f);as(f)}var as=f=>{if(m=f,u)throw gd(f),"unwind";ss(f)},rr=[],Vn=[],bd=[],Or={},yd=f=>{var g=f.Rc;delete Or[g],rr.push(f),Vn.splice(Vn.indexOf(f),1),f.Rc=0,mc(g)};function _d(){bd.forEach(f=>f())}var wd=f=>new Promise(g=>{f.onmessage=E=>{var P=E.data;if(E=P.Sc,P.Zc&&P.Zc!=Xi()){var N=Or[P.Zc];N?N.postMessage(P,P.jd):I(`Internal error! Worker sent a message "${E}" to target pthread ${P.Zc}, but that thread no longer exists!`)}else E==="checkMailbox"?Ui():E==="spawnThread"?Mi(P):E==="cleanupThread"?Vi(()=>{yd(Or[P.Nd])}):E==="loaded"?(f.loaded=!0,g(f)):P.target==="setimmediate"?f.postMessage(P):E==="uncaughtException"?f.onerror(P.error):E==="callHandler"?t[P.vd](...P.args):E&&I(`worker sent an unknown command ${E}`)},f.onerror=E=>{throw I(`worker sent an error! ${E.filename}:${E.lineno}: ${E.message}`),E};var $,v=[];for($ of[])t.propertyIsEnumerable($)&&v.push($);f.postMessage({Sc:"load",xd:v,Od:nr,Pd:h})});function vd(){var f=new Worker((()=>{let g=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new g("ort.all.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});rr.push(f)}var nr,rT=(f,g)=>{tr=0,f=Is(f,g),0<tr?m=f:$s(f)},Fi=[],ji=0;function nT(f){var g=new us(f>>>=0);return(O(),Y)[g.Tc+12>>>0]==0&&(xd(g,!0),ji--),$d(g,!1),Fi.push(g),vc(f)}var hn=0,iT=()=>{_e(0,0);var f=Fi.pop();_c(f.cd),hn=0};function xd(f,g){g=g?1:0,(O(),Y)[f.Tc+12>>>0]=g}function $d(f,g){g=g?1:0,(O(),Y)[f.Tc+13>>>0]=g}class us{constructor(g){this.cd=g,this.Tc=g-24}}var ls=f=>{var g=hn;if(!g)return qn(0),0;var $=new us(g);(O(),C)[$.Tc+16>>>2>>>0]=g;var v=(O(),C)[$.Tc+4>>>2>>>0];if(!v)return qn(0),g;for(var E of f){if(E===0||E===v)break;if(wc(E,v,$.Tc+16))return qn(E),g}return qn(v),g};function oT(){return ls([])}function sT(f){return ls([f>>>0])}function aT(f,g,$,v){return ls([f>>>0,g>>>0,$>>>0,v>>>0])}var uT=()=>{var f=Fi.pop();f||pe("no exception to throw");var g=f.cd;throw(O(),Y)[f.Tc+13>>>0]==0&&(Fi.push(f),$d(f,!0),xd(f,!1),ji++),Ss(g),hn=g};function lT(f,g,$){var v=new us(f>>>=0);throw g>>>=0,$>>>=0,(O(),C)[v.Tc+16>>>2>>>0]=0,(O(),C)[v.Tc+4>>>2>>>0]=g,(O(),C)[v.Tc+8>>>2>>>0]=$,Ss(f),ji++,hn=f}var dT=()=>ji;function Td(f,g,$,v){return u?Fe(2,1,f,g,$,v):Sd(f,g,$,v)}function Sd(f,g,$,v){if(f>>>=0,g>>>=0,$>>>=0,v>>>=0,!globalThis.SharedArrayBuffer)return 6;var E=[];return u&&E.length===0?Td(f,g,$,v):(f={Ld:$,Rc:f,bd:v,jd:E},u?(f.Sc="spawnThread",postMessage(f,E),0):Mi(f))}function cT(f){throw hn||=f>>>0,hn}var Id=globalThis.TextDecoder&&new TextDecoder,Od=(f,g,$,v)=>{if($=g+$,v)return $;for(;f[g]&&!(g>=$);)++g;return g},Ed=(f,g=0,$,v)=>{if(16<($=Od(f,g>>>=0,$,v))-g&&f.buffer&&Id)return Id.decode(f.buffer instanceof ArrayBuffer?f.subarray(g,$):f.slice(g,$));for(v="";g<$;){var E=f[g++];if(128&E){var P=63&f[g++];if((224&E)==192)v+=String.fromCharCode((31&E)<<6|P);else{var N=63&f[g++];65536>(E=(240&E)==224?(15&E)<<12|P<<6|N:(7&E)<<18|P<<12|N<<6|63&f[g++])?v+=String.fromCharCode(E):(E-=65536,v+=String.fromCharCode(55296|E>>10,56320|1023&E))}}else v+=String.fromCharCode(E)}return v},Xe=(f,g,$)=>(f>>>=0)?Ed((O(),W),f,g,$):"";function Ad(f,g,$){return u?Fe(3,1,f,g,$):0}function Pd(f,g){if(u)return Fe(4,1,f,g)}function kd(f,g){if(u)return Fe(5,1,f,g)}function Cd(f,g,$){if(u)return Fe(6,1,f,g,$)}function Dd(f,g,$){return u?Fe(7,1,f,g,$):0}function Rd(f,g){if(u)return Fe(8,1,f,g)}function Nd(f,g,$){if(u)return Fe(9,1,f,g,$)}function zd(f,g,$,v){if(u)return Fe(10,1,f,g,$,v)}function Bd(f,g,$,v){if(u)return Fe(11,1,f,g,$,v)}function Md(f,g,$,v){if(u)return Fe(12,1,f,g,$,v)}function Fd(f){if(u)return Fe(13,1,f)}function jd(f,g){if(u)return Fe(14,1,f,g)}function Ld(f,g,$){if(u)return Fe(15,1,f,g,$)}var pT=()=>pe(""),Mt=f=>{f>>>=0;for(var g="";;){var $=(O(),W)[f++>>>0];if(!$)return g;g+=String.fromCharCode($)}},ds={},cs={},hT={},fn=class extends Error{constructor(f){super(f),this.name="BindingError"}};function Ht(f,g,$={}){return(function(v,E,P={}){var N=E.name;if(!v)throw new fn(`type "${N}" must have a positive integer typeid pointer`);if(cs.hasOwnProperty(v)){if(P.yd)return;throw new fn(`Cannot register type '${N}' twice`)}cs[v]=E,delete hT[v],ds.hasOwnProperty(v)&&(E=ds[v],delete ds[v],E.forEach(L=>L()))})(f,g,$)}var Vd=(f,g,$)=>{switch(g){case 1:return $?v=>(O(),Y)[v>>>0]:v=>(O(),W)[v>>>0];case 2:return $?v=>(O(),D)[v>>>1>>>0]:v=>(O(),Q)[v>>>1>>>0];case 4:return $?v=>(O(),w)[v>>>2>>>0]:v=>(O(),C)[v>>>2>>>0];case 8:return $?v=>(O(),U)[v>>>3>>>0]:v=>(O(),q)[v>>>3>>>0];default:throw new TypeError(`invalid integer width (${g}): ${f}`)}};function fT(f,g,$,v,E){f>>>=0,$>>>=0,g=Mt(g>>>0);let P=N=>N;if(v=v===0n){let N=8*$;P=L=>BigInt.asUintN(N,L),E=P(E)}Ht(f,{name:g,Oc:P,Vc:(N,L)=>(typeof L=="number"&&(L=BigInt(L)),L),Uc:Vd(g,$,!v),Wc:null})}function mT(f,g,$,v){Ht(f>>>=0,{name:g=Mt(g>>>0),Oc:function(E){return!!E},Vc:function(E,P){return P?$:v},Uc:function(E){return this.Oc((O(),W)[E>>>0])},Wc:null})}var Ud=[],Er=[0,1,,1,null,1,!0,1,!1,1];function ps(f){9<(f>>>=0)&&--Er[f+1]===0&&(Er[f]=void 0,Ud.push(f))}var _t=f=>{if(!f)throw new fn(`Cannot use deleted val. handle = ${f}`);return Er[f]},Et=f=>{switch(f){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let g=Ud.pop()||Er.length;return Er[g]=f,Er[g+1]=1,g}};function hs(f){return this.Oc((O(),C)[f>>>2>>>0])}var gT={name:"emscripten::val",Oc:f=>{var g=_t(f);return ps(f),g},Vc:(f,g)=>Et(g),Uc:hs,Wc:null};function bT(f){return Ht(f>>>0,gT)}var yT=(f,g)=>{switch(g){case 4:return function($){return this.Oc((O(),F)[$>>>2>>>0])};case 8:return function($){return this.Oc((O(),V)[$>>>3>>>0])};default:throw new TypeError(`invalid float width (${g}): ${f}`)}};function _T(f,g,$){$>>>=0,Ht(f>>>=0,{name:g=Mt(g>>>0),Oc:v=>v,Vc:(v,E)=>E,Uc:yT(g,$),Wc:null})}function wT(f,g,$,v,E){f>>>=0,$>>>=0,g=Mt(g>>>0);let P=L=>L;if(v===0){var N=32-8*$;P=L=>L<<N>>>N,E=P(E)}Ht(f,{name:g,Oc:P,Vc:(L,J)=>J,Uc:Vd(g,$,v!==0),Wc:null})}function vT(f,g,$){function v(P){var N=(O(),C)[P>>>2>>>0];return P=(O(),C)[P+4>>>2>>>0],new E((O(),Y).buffer,P,N)}var E=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][g];Ht(f>>>=0,{name:$=Mt($>>>0),Oc:v,Uc:v},{yd:!0})}var ir=(f,g,$)=>{var v=(O(),W);if(g>>>=0,0<$){var E=g;$=g+$-1;for(var P=0;P<f.length;++P){var N=f.codePointAt(P);if(127>=N){if(g>=$)break;v[g++>>>0]=N}else if(2047>=N){if(g+1>=$)break;v[g++>>>0]=192|N>>6,v[g++>>>0]=128|63&N}else if(65535>=N){if(g+2>=$)break;v[g++>>>0]=224|N>>12,v[g++>>>0]=128|N>>6&63,v[g++>>>0]=128|63&N}else{if(g+3>=$)break;v[g++>>>0]=240|N>>18,v[g++>>>0]=128|N>>12&63,v[g++>>>0]=128|N>>6&63,v[g++>>>0]=128|63&N,P++}}v[g>>>0]=0,f=g-E}else f=0;return f},Li=f=>{for(var g=0,$=0;$<f.length;++$){var v=f.charCodeAt($);127>=v?g++:2047>=v?g+=2:55296<=v&&57343>=v?(g+=4,++$):g+=3}return g};function xT(f,g){Ht(f>>>=0,{name:g=Mt(g>>>0),Oc($){var v=(O(),C)[$>>>2>>>0];return v=Xe($+4,v,!0),jt($),v},Vc($,v){v instanceof ArrayBuffer&&(v=new Uint8Array(v));var E=typeof v=="string";if(!(E||ArrayBuffer.isView(v)&&v.BYTES_PER_ELEMENT==1))throw new fn("Cannot pass non-string to std::string");var P=E?Li(v):v.length,N=Gn(4+P+1),L=N+4;return(O(),C)[N>>>2>>>0]=P,E?ir(v,L,P+1):(O(),W).set(v,L>>>0),$!==null&&$.push(jt,N),N},Uc:hs,Wc($){jt($)}})}var Gd=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,$T=(f,g,$)=>{if(f>>>=1,16<(g=Od((O(),Q),f,g/2,$))-f&&Gd)return Gd.decode((O(),Q).slice(f,g));for($="";f<g;++f){var v=(O(),Q)[f>>>0];$+=String.fromCharCode(v)}return $},TT=(f,g,$)=>{if($??=2147483647,2>$)return 0;var v=g;$=($-=2)<2*f.length?$/2:f.length;for(var E=0;E<$;++E){var P=f.charCodeAt(E);(O(),D)[g>>>1>>>0]=P,g+=2}return(O(),D)[g>>>1>>>0]=0,g-v},ST=f=>2*f.length,IT=(f,g,$)=>{var v="";f>>>=2;for(var E=0;!(E>=g/4);E++){var P=(O(),C)[f+E>>>0];if(!P&&!$)break;v+=String.fromCodePoint(P)}return v},OT=(f,g,$)=>{if(g>>>=0,$??=2147483647,4>$)return 0;var v=g;$=v+$-4;for(var E=0;E<f.length;++E){var P=f.codePointAt(E);if(65535<P&&E++,(O(),w)[g>>>2>>>0]=P,(g+=4)+4>$)break}return(O(),w)[g>>>2>>>0]=0,g-v},ET=f=>{for(var g=0,$=0;$<f.length;++$)65535<f.codePointAt($)&&$++,g+=4;return g};function AT(f,g,$){if(f>>>=0,g>>>=0,$=Mt($>>>=0),g===2)var v=$T,E=TT,P=ST;else v=IT,E=OT,P=ET;Ht(f,{name:$,Oc:N=>{var L=(O(),C)[N>>>2>>>0];return L=v(N+4,L*g,!0),jt(N),L},Vc:(N,L)=>{if(typeof L!="string")throw new fn(`Cannot pass non-string to C++ string type ${$}`);var J=P(L),ee=Gn(4+J+g);return(O(),C)[ee>>>2>>>0]=J/g,E(L,ee+4,J+g),N!==null&&N.push(jt,ee),ee},Uc:hs,Wc(N){jt(N)}})}function PT(f,g){Ht(f>>>=0,{zd:!0,name:g=Mt(g>>>0),Oc:()=>{},Vc:()=>{}})}function kT(f){xs(f>>>0,!o,1,!n,131072,!1),_d()}var Vi=f=>{if(!A)try{if(f(),!(0<tr))try{u?Xi()&&$s(m):as(m)}catch(g){g instanceof Me||g=="unwind"||r(0,g)}}catch(g){g instanceof Me||g=="unwind"||r(0,g)}},CT=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function fs(f){f>>>=0,CT||(Atomics.waitAsync((O(),w),f>>>2,f).value.then(Ui),f+=128,Atomics.store((O(),w),f>>>2,1))}var Ui=()=>Vi(()=>{var f=Xi();f&&(fs(f),bc())});function DT(f,g){(f>>>=0)==g>>>0?setTimeout(Ui):u?postMessage({Zc:f,Sc:"checkMailbox"}):(f=Or[f])&&f.postMessage({Sc:"checkMailbox"})}var ms=[];function RT(f,g,$,v,E){for(g>>>=0,E>>>=0,ms.length=0,$=E>>>3,v=E+v>>>3;$<v;){var P;P=(O(),U)[$++>>>0]?(O(),U)[$++>>>0]:(O(),V)[$++>>>0],ms.push(P)}return(g?Os[g]:SS[f])(...ms)}var NT=()=>{tr=0};function zT(f){f>>>=0,u?postMessage({Sc:"cleanupThread",Nd:f}):yd(Or[f])}function BT(f){}var Gi=f=>{try{f()}catch(g){pe(g)}};function MT(f){var g=(...$)=>{qi.push(f);try{return f(...$)}finally{A||(qi.pop(),Ft&&or===1&&qi.length===0&&(or=0,tr+=1,Gi(op),typeof Fibers<"u"&&Fibers.be()))}};return Wd.set(f,g),g}var or=0,Ft=null,qd=0,qi=[],gs=new Map,Hd=new Map,Wd=new Map,FT=0,bs=null,jT=[],Kd=f=>(function(g){if(!A){if(or===0){var $=!1,v=!1;g((E=0)=>{if(!A&&(qd=E,$=!0,v)){or=2,Gi(()=>sp(Ft)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),E=!1;try{var P=(function(){var J=(O(),w)[Ft+8>>>2>>>0];return J=Hd.get(J),J=Wd.get(J),--tr,J()})()}catch(J){P=J,E=!0}var N=!1;if(!Ft){var L=bs;L&&(bs=null,(E?L.reject:L.resolve)(P),N=!0)}if(E&&!N)throw P}}),v=!0,$||(or=1,Ft=(function(){var E=Gn(65548),P=E+12;if((O(),C)[E>>>2>>>0]=P,(O(),C)[E+4>>>2>>>0]=P+65536,P=qi[0],!gs.has(P)){var N=FT++;gs.set(P,N),Hd.set(N,P)}return P=gs.get(P),(O(),w)[E+8>>>2>>>0]=P,E})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Gi(()=>ip(Ft)))}else or===2?(or=0,Gi(ap),jt(Ft),Ft=null,jT.forEach(Vi)):pe(`invalid state: ${or}`);return qd}})(g=>{f().then(g)});function LT(f){return f>>>=0,Kd(async()=>{var g=await _t(f);return Et(g)})}var ys=[],VT=f=>{var g=ys.length;return ys.push(f),g},UT=(f,g)=>{for(var $=Array(f),v=0;v<f;++v){var E=v,P=(O(),C)[g+4*v>>>2>>>0],N=cs[P];if(N===void 0)throw f=`parameter ${v}`,P=cc(P),g=Mt(P),jt(P),new fn(`${f} has unknown type ${g}`);$[E]=N}return $},GT=(f,g,$)=>{var v=[];return f=f(v,$),v.length&&((O(),C)[g>>>2>>>0]=Et(v)),f},qT={},Hi=f=>{var g=qT[f];return g===void 0?Mt(f):g};function HT(f,g,$){var[v,...E]=UT(f,g>>>0);g=v.Vc.bind(v);var P=E.map(J=>J.Uc.bind(J));f--;var N={toValue:_t};switch(f=P.map((J,ee)=>{var de=`argFromPtr${ee}`;return N[de]=J,`${de}(args${ee?"+"+8*ee:""})`}),$){case 0:var L="toValue(handle)";break;case 2:L="new (toValue(handle))";break;case 3:L="";break;case 1:N.getStringOrSymbol=Hi,L="toValue(handle)[getStringOrSymbol(methodName)]"}return L+=`(${f})`,v.zd||(N.toReturnWire=g,N.emval_returnValue=GT,L=`return emval_returnValue(toReturnWire, destructorsRef, ${L})`),L=`return function (handle, methodName, destructorsRef, args) {
  ${L}
  }`,$=new Function(Object.keys(N),L)(...Object.values(N)),L=`methodCaller<(${E.map(J=>J.name)}) => ${v.name}>`,VT(Object.defineProperty($,"name",{value:L}))}function WT(f,g){return g>>>=0,(f=_t(f>>>0))==_t(g)}function KT(f){return(f>>>=0)?(f=Hi(f),Et(globalThis[f])):Et(globalThis)}function XT(f){return f=Hi(f>>>0),Et(t[f])}function ZT(f,g){return g>>>=0,f=_t(f>>>0),g=_t(g),Et(f[g])}function JT(f){9<(f>>>=0)&&(Er[f+1]+=1)}function Xd(f,g,$,v,E){return ys[f>>>0](g>>>0,$>>>0,v>>>0,E>>>0)}function YT(f,g,$,v,E){return Xd(f>>>0,g>>>0,$>>>0,v>>>0,E>>>0)}function QT(){return Et([])}function eS(f){f=_t(f>>>0);for(var g=Array(f.length),$=0;$<f.length;$++)g[$]=f[$];return Et(g)}function tS(f){return Et(Hi(f>>>0))}function rS(){return Et({})}function nS(f){for(var g=_t(f>>>=0);g.length;){var $=g.pop();g.pop()($)}ps(f)}function iS(f,g,$){g>>>=0,$>>>=0,f=_t(f>>>0),g=_t(g),$=_t($),f[g]=$}function oS(f,g){f=-9007199254740992>f||9007199254740992<f?NaN:Number(f),g>>>=0,f=new Date(1e3*f),(O(),w)[g>>>2>>>0]=f.getUTCSeconds(),(O(),w)[g+4>>>2>>>0]=f.getUTCMinutes(),(O(),w)[g+8>>>2>>>0]=f.getUTCHours(),(O(),w)[g+12>>>2>>>0]=f.getUTCDate(),(O(),w)[g+16>>>2>>>0]=f.getUTCMonth(),(O(),w)[g+20>>>2>>>0]=f.getUTCFullYear()-1900,(O(),w)[g+24>>>2>>>0]=f.getUTCDay(),f=(f.getTime()-Date.UTC(f.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(O(),w)[g+28>>>2>>>0]=f}var Zd=f=>f%4==0&&(f%100!=0||f%400==0),Jd=[0,31,60,91,121,152,182,213,244,274,305,335],Yd=[0,31,59,90,120,151,181,212,243,273,304,334];function sS(f,g){f=-9007199254740992>f||9007199254740992<f?NaN:Number(f),g>>>=0,f=new Date(1e3*f),(O(),w)[g>>>2>>>0]=f.getSeconds(),(O(),w)[g+4>>>2>>>0]=f.getMinutes(),(O(),w)[g+8>>>2>>>0]=f.getHours(),(O(),w)[g+12>>>2>>>0]=f.getDate(),(O(),w)[g+16>>>2>>>0]=f.getMonth(),(O(),w)[g+20>>>2>>>0]=f.getFullYear()-1900,(O(),w)[g+24>>>2>>>0]=f.getDay();var $=(Zd(f.getFullYear())?Jd:Yd)[f.getMonth()]+f.getDate()-1|0;(O(),w)[g+28>>>2>>>0]=$,(O(),w)[g+36>>>2>>>0]=-60*f.getTimezoneOffset(),$=new Date(f.getFullYear(),6,1).getTimezoneOffset();var v=new Date(f.getFullYear(),0,1).getTimezoneOffset();f=0|($!=v&&f.getTimezoneOffset()==Math.min(v,$)),(O(),w)[g+32>>>2>>>0]=f}function aS(f){f>>>=0;var g=new Date((O(),w)[f+20>>>2>>>0]+1900,(O(),w)[f+16>>>2>>>0],(O(),w)[f+12>>>2>>>0],(O(),w)[f+8>>>2>>>0],(O(),w)[f+4>>>2>>>0],(O(),w)[f>>>2>>>0],0),$=(O(),w)[f+32>>>2>>>0],v=g.getTimezoneOffset(),E=new Date(g.getFullYear(),6,1).getTimezoneOffset(),P=new Date(g.getFullYear(),0,1).getTimezoneOffset(),N=Math.min(P,E);return 0>$?(O(),w)[f+32>>>2>>>0]=+(E!=P&&N==v):0<$!=(N==v)&&(E=Math.max(P,E),g.setTime(g.getTime()+6e4*((0<$?N:E)-v))),(O(),w)[f+24>>>2>>>0]=g.getDay(),$=(Zd(g.getFullYear())?Jd:Yd)[g.getMonth()]+g.getDate()-1|0,(O(),w)[f+28>>>2>>>0]=$,(O(),w)[f>>>2>>>0]=g.getSeconds(),(O(),w)[f+4>>>2>>>0]=g.getMinutes(),(O(),w)[f+8>>>2>>>0]=g.getHours(),(O(),w)[f+12>>>2>>>0]=g.getDate(),(O(),w)[f+16>>>2>>>0]=g.getMonth(),(O(),w)[f+20>>>2>>>0]=g.getYear(),f=g.getTime(),BigInt(isNaN(f)?-1:f/1e3)}function Qd(f,g,$,v,E,P,N){return u?Fe(16,1,f,g,$,v,E,P,N):-52}function ec(f,g,$,v,E,P){if(u)return Fe(17,1,f,g,$,v,E,P)}var Un={},uS=()=>performance.timeOrigin+performance.now();function tc(f,g){if(u)return Fe(18,1,f,g);if(Un[f]&&(clearTimeout(Un[f].id),delete Un[f]),!g)return 0;var $=setTimeout(()=>{delete Un[f],Vi(()=>gc(f,performance.timeOrigin+performance.now()))},g);return Un[f]={id:$,ae:g},0}function lS(f,g,$,v){f>>>=0,g>>>=0,$>>>=0,v>>>=0;var E=new Date().getFullYear(),P=new Date(E,0,1).getTimezoneOffset();E=new Date(E,6,1).getTimezoneOffset();var N=Math.max(P,E);(O(),C)[f>>>2>>>0]=60*N,(O(),w)[g>>>2>>>0]=+(P!=E),f=(g=L=>{var J=Math.abs(L);return`UTC${0<=L?"-":"+"}${String(Math.floor(J/60)).padStart(2,"0")}${String(J%60).padStart(2,"0")}`})(P),g=g(E),E<P?(ir(f,$,17),ir(g,v,17)):(ir(f,v,17),ir(g,$,17))}var dS=()=>Date.now(),cS=1;function pS(f,g,$){if($>>>=0,!(0<=f&&3>=f))return 28;if(f===0)f=Date.now();else{if(!cS)return 52;f=performance.timeOrigin+performance.now()}return f=Math.round(1e6*f),(O(),U)[$>>>3>>>0]=BigInt(f),0}var _s=[],rc=(f,g)=>{_s.length=0;for(var $;$=(O(),W)[f++>>>0];){var v=$!=105;g+=(v&=$!=112)&&g%8?4:0,_s.push($==112?(O(),C)[g>>>2>>>0]:$==106?(O(),U)[g>>>3>>>0]:$==105?(O(),w)[g>>>2>>>0]:(O(),V)[g>>>3>>>0]),g+=v?8:4}return _s};function hS(f,g,$){return f>>>=0,g=rc(g>>>0,$>>>0),Os[f](...g)}function fS(f,g,$){return f>>>=0,g=rc(g>>>0,$>>>0),Os[f](...g)}var mS=()=>{};function gS(f,g){return I(Xe(f>>>0,g>>>0))}var bS=()=>{throw tr+=1,"unwind"};function yS(){return 4294901760}var _S=()=>navigator.hardwareConcurrency,Ar={},Wi=f=>{var g;return(g=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(f))?+g[1]:(g=/:(\d+):\d+(?:\)|$)/.exec(f))?2147483648|+g[1]:0},nc=f=>{for(var g of f)(f=Wi(g))&&(Ar[f]=g)};function wS(){var f=Error().stack.toString().split(`
`);return f[0]=="Error"&&f.shift(),nc(f),Ar.gd=Wi(f[3]),Ar.Jd=f,Ar.gd}function Ki(f){if(!(f=Ar[f>>>0]))return 0;var g;if(g=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(f))f=g[1];else if(g=/^\s+at (.*) \(.*\)$/.exec(f))f=g[1];else{if(!(g=/^(.+?)@/.exec(f)))return 0;f=g[1]}jt(Ki.hd??0),g=Li(f)+1;var $=Gn(g);return $&&ir(f,$,g),Ki.hd=$,Ki.hd}function vS(f){f>>>=0;var g=(O(),W).length;if(f<=g||4294901760<f)return!1;for(var $=1;4>=$;$*=2){var v=g*(1+.2/$);v=Math.min(v,f+100663296);e:{v=(Math.min(4294901760,65536*Math.ceil(Math.max(f,v)/65536))-nr.buffer.byteLength+65535)/65536|0;try{nr.grow(v),X();var E=1;break e}catch{}E=void 0}if(E)return!0}return!1}function xS(f,g,$){if(f>>>=0,g>>>=0,Ar.gd==f)var v=Ar.Jd;else(v=Error().stack.toString().split(`
`))[0]=="Error"&&v.shift(),nc(v);for(var E=3;v[E]&&Wi(v[E])!=f;)++E;for(f=0;f<$&&v[f+E];++f)(O(),w)[g+4*f>>>2>>>0]=Wi(v[f+E]);return f}var ws,vs={},ic=()=>{if(!ws){var f,g={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(f in vs)vs[f]===void 0?delete g[f]:g[f]=vs[f];var $=[];for(f in g)$.push(`${f}=${g[f]}`);ws=$}return ws};function oc(f,g){if(u)return Fe(19,1,f,g);f>>>=0,g>>>=0;var $,v=0,E=0;for($ of ic()){var P=g+v;(O(),C)[f+E>>>2>>>0]=P,v+=ir($,P,1/0)+1,E+=4}return 0}function sc(f,g){if(u)return Fe(20,1,f,g);f>>>=0,g>>>=0;var $=ic();for(var v of((O(),C)[f>>>2>>>0]=$.length,f=0,$))f+=Li(v)+1;return(O(),C)[g>>>2>>>0]=f,0}function ac(f){return u?Fe(21,1,f):52}function uc(f,g,$,v){return u?Fe(22,1,f,g,$,v):52}function lc(f,g,$,v){return u?Fe(23,1,f,g,$,v):70}var $S=[null,[],[]];function dc(f,g,$,v){if(u)return Fe(24,1,f,g,$,v);g>>>=0,$>>>=0,v>>>=0;for(var E=0,P=0;P<$;P++){var N=(O(),C)[g>>>2>>>0],L=(O(),C)[g+4>>>2>>>0];g+=8;for(var J=0;J<L;J++){var ee=f,de=(O(),W)[N+J>>>0],xe=$S[ee];de===0||de===10?((ee===1?T:I)(Ed(xe)),xe.length=0):xe.push(de)}E+=L}return(O(),C)[v>>>2>>>0]=E,0}function TS(f){return f>>>0}u||(function(){for(var f=t.numThreads-1;f--;)vd();Le.push(async()=>{var g=(async function(){if(!u)return Promise.all(rr.map(wd))})();ut++,await g,--ut==0&&Ir&&(g=Ir,Ir=null,g())})})(),u||(nr=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),X()),t.wasmBinary&&(p=t.wasmBinary),t.stackSave=()=>ge(),t.stackRestore=f=>me(f),t.stackAlloc=f=>Ts(f),t.setValue=function(f,g,$="i8"){switch($.endsWith("*")&&($="*"),$){case"i1":case"i8":(O(),Y)[f>>>0]=g;break;case"i16":(O(),D)[f>>>1>>>0]=g;break;case"i32":(O(),w)[f>>>2>>>0]=g;break;case"i64":(O(),U)[f>>>3>>>0]=BigInt(g);break;case"float":(O(),F)[f>>>2>>>0]=g;break;case"double":(O(),V)[f>>>3>>>0]=g;break;case"*":(O(),C)[f>>>2>>>0]=g;break;default:pe(`invalid type for setValue: ${$}`)}},t.getValue=function(f,g="i8"){switch(g.endsWith("*")&&(g="*"),g){case"i1":case"i8":return(O(),Y)[f>>>0];case"i16":return(O(),D)[f>>>1>>>0];case"i32":return(O(),w)[f>>>2>>>0];case"i64":return(O(),U)[f>>>3>>>0];case"float":return(O(),F)[f>>>2>>>0];case"double":return(O(),V)[f>>>3>>>0];case"*":return(O(),C)[f>>>2>>>0];default:pe(`invalid type for getValue: ${g}`)}},t.UTF8ToString=Xe,t.stringToUTF8=ir,t.lengthBytesUTF8=Li;var cc,pc,Xi,jt,Gn,xs,hc,fc,mc,$s,gc,bc,_e,qn,yc,me,Ts,ge,_c,Ss,wc,vc,xc,Is,$c,Tc,Sc,Ic,Oc,Ec,Ac,Pc,kc,Cc,Dc,Rc,Nc,zc,Bc,Mc,Fc,jc,Lc,Vc,Uc,Gc,qc,Hc,Wc,Kc,Xc,Zc,Jc,Yc,Qc,ep,tp,rp,np,ip,op,sp,ap,Wt,SS=[ss,gd,Td,Ad,Pd,kd,Cd,Dd,Rd,Nd,zd,Bd,Md,Fd,jd,Ld,Qd,ec,tc,oc,sc,ac,uc,lc,dc],Os={1055492:(f,g,$,v,E)=>{if(t===void 0||!t.Yc)return 1;if((f=Xe(Number(f>>>0))).startsWith("./")&&(f=f.substring(2)),!(f=t.Yc.get(f)))return 2;if(g=Number(g>>>0),$=Number($>>>0),v=Number(v>>>0),g+$>f.byteLength)return 3;try{let P=f.subarray(g,g+$);switch(E){case 0:(O(),W).set(P,v>>>0);break;case 1:t.Qd?t.Qd(v,P):t.Id(v,P);break;default:return 4}return 0}catch{return 4}},1056316:(f,g,$)=>{t.td(f,(O(),W).subarray(g>>>0,g+$>>>0))},1056380:()=>t.Sd(),1056422:f=>{t.sd(f)},1056459:()=>{t.Bd()},1056490:()=>{t.Cd()},1056519:()=>{t.Gd()},1056544:f=>t.Ad(f),1056577:f=>t.Ed(f),1056609:(f,g,$)=>{t.ed(Number(f),Number(g),Number($),!0)},1056672:(f,g,$)=>{t.ed(Number(f),Number(g),Number($))},1056729:()=>typeof wasmOffsetConverter<"u",1056786:f=>{t.$b("Abs",f,void 0)},1056837:f=>{t.$b("Neg",f,void 0)},1056888:f=>{t.$b("Floor",f,void 0)},1056941:f=>{t.$b("Ceil",f,void 0)},1056993:f=>{t.$b("Reciprocal",f,void 0)},1057051:f=>{t.$b("Sqrt",f,void 0)},1057103:f=>{t.$b("Exp",f,void 0)},1057154:f=>{t.$b("Erf",f,void 0)},1057205:f=>{t.$b("Sigmoid",f,void 0)},1057260:(f,g,$)=>{t.$b("HardSigmoid",f,{alpha:g,beta:$})},1057339:f=>{t.$b("HardSwish",f,void 0)},1057396:f=>{t.$b("Log",f,void 0)},1057447:f=>{t.$b("Sin",f,void 0)},1057498:f=>{t.$b("Cos",f,void 0)},1057549:f=>{t.$b("Tan",f,void 0)},1057600:f=>{t.$b("Asin",f,void 0)},1057652:f=>{t.$b("Acos",f,void 0)},1057704:f=>{t.$b("Atan",f,void 0)},1057756:f=>{t.$b("Sinh",f,void 0)},1057808:f=>{t.$b("Cosh",f,void 0)},1057860:f=>{t.$b("Asinh",f,void 0)},1057913:f=>{t.$b("Acosh",f,void 0)},1057966:f=>{t.$b("Atanh",f,void 0)},1058019:f=>{t.$b("Tanh",f,void 0)},1058071:f=>{t.$b("Not",f,void 0)},1058122:(f,g,$)=>{t.$b("Clip",f,{min:g,max:$})},1058191:f=>{t.$b("Clip",f,void 0)},1058243:(f,g)=>{t.$b("Elu",f,{alpha:g})},1058301:f=>{t.$b("Gelu",f,void 0)},1058353:f=>{t.$b("Relu",f,void 0)},1058405:(f,g)=>{t.$b("LeakyRelu",f,{alpha:g})},1058469:(f,g)=>{t.$b("ThresholdedRelu",f,{alpha:g})},1058539:(f,g)=>{t.$b("Cast",f,{to:g})},1058597:f=>{t.$b("Add",f,void 0)},1058648:f=>{t.$b("Sub",f,void 0)},1058699:f=>{t.$b("Mul",f,void 0)},1058750:f=>{t.$b("Div",f,void 0)},1058801:f=>{t.$b("Pow",f,void 0)},1058852:f=>{t.$b("Equal",f,void 0)},1058905:f=>{t.$b("Greater",f,void 0)},1058960:f=>{t.$b("GreaterOrEqual",f,void 0)},1059022:f=>{t.$b("Less",f,void 0)},1059074:f=>{t.$b("LessOrEqual",f,void 0)},1059133:(f,g,$,v,E)=>{t.$b("ReduceMean",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1059308:(f,g,$,v,E)=>{t.$b("ReduceMax",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1059482:(f,g,$,v,E)=>{t.$b("ReduceMin",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1059656:(f,g,$,v,E)=>{t.$b("ReduceProd",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1059831:(f,g,$,v,E)=>{t.$b("ReduceSum",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060005:(f,g,$,v,E)=>{t.$b("ReduceL1",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060178:(f,g,$,v,E)=>{t.$b("ReduceL2",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060351:(f,g,$,v,E)=>{t.$b("ReduceLogSum",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060528:(f,g,$,v,E)=>{t.$b("ReduceSumSquare",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060708:(f,g,$,v,E)=>{t.$b("ReduceLogSumExp",f,{keepDims:!!g,noopWithEmptyAxes:!!$,axes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1060888:f=>{t.$b("Where",f,void 0)},1060941:(f,g,$)=>{t.$b("Transpose",f,{perm:g?Array.from((O(),w).subarray(Number(g)>>>0,Number($)>>>0)):[]})},1061065:(f,g,$,v)=>{t.$b("DepthToSpace",f,{blocksize:g,mode:Xe($),format:v?"NHWC":"NCHW"})},1061198:(f,g,$,v)=>{t.$b("DepthToSpace",f,{blocksize:g,mode:Xe($),format:v?"NHWC":"NCHW"})},1061331:(f,g,$,v)=>{t.$b("DFT",f,{axis:g,inverse:$,onesided:v})},1061423:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne,sr)=>{t.$b("ConvTranspose",f,{format:J?"NHWC":"NCHW",autoPad:g,dilations:[$],group:v,kernelShape:[E],pads:[P,N],strides:[L],wIsConst:()=>!!(O(),Y)[ee>>>0],outputPadding:de?Array.from((O(),w).subarray(Number(de)>>>0,Number(xe)>>>0)):[],outputShape:Ce?Array.from((O(),w).subarray(Number(Ce)>>>0,Number(Ne)>>>0)):[],activation:Xe(sr)})},1061856:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("ConvTranspose",f,{format:L?"NHWC":"NCHW",autoPad:g,dilations:Array.from((O(),w).subarray(Number($)>>>0,(Number($)>>>0)+2>>>0)),group:v,kernelShape:Array.from((O(),w).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),pads:Array.from((O(),w).subarray(Number(P)>>>0,(Number(P)>>>0)+4>>>0)),strides:Array.from((O(),w).subarray(Number(N)>>>0,(Number(N)>>>0)+2>>>0)),wIsConst:()=>!!(O(),Y)[J>>>0],outputPadding:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],outputShape:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[],activation:Xe(Ne)})},1062517:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne,sr)=>{t.$b("ConvTranspose",f,{format:J?"NHWC":"NCHW",autoPad:g,dilations:[$],group:v,kernelShape:[E],pads:[P,N],strides:[L],wIsConst:()=>!!(O(),Y)[ee>>>0],outputPadding:de?Array.from((O(),w).subarray(Number(de)>>>0,Number(xe)>>>0)):[],outputShape:Ce?Array.from((O(),w).subarray(Number(Ce)>>>0,Number(Ne)>>>0)):[],activation:Xe(sr)})},1062950:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("ConvTranspose",f,{format:L?"NHWC":"NCHW",autoPad:g,dilations:Array.from((O(),w).subarray(Number($)>>>0,(Number($)>>>0)+2>>>0)),group:v,kernelShape:Array.from((O(),w).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),pads:Array.from((O(),w).subarray(Number(P)>>>0,(Number(P)>>>0)+4>>>0)),strides:Array.from((O(),w).subarray(Number(N)>>>0,(Number(N)>>>0)+2>>>0)),wIsConst:()=>!!(O(),Y)[J>>>0],outputPadding:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],outputShape:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[],activation:Xe(Ne)})},1063611:(f,g)=>{t.$b("GlobalAveragePool",f,{format:g?"NHWC":"NCHW"})},1063702:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("AveragePool",f,{format:Ne?"NHWC":"NCHW",auto_pad:g,ceil_mode:$,count_include_pad:v,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[],kernel_shape:L?Array.from((O(),w).subarray(Number(L)>>>0,Number(J)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],strides:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[]})},1064181:(f,g)=>{t.$b("GlobalAveragePool",f,{format:g?"NHWC":"NCHW"})},1064272:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("AveragePool",f,{format:Ne?"NHWC":"NCHW",auto_pad:g,ceil_mode:$,count_include_pad:v,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[],kernel_shape:L?Array.from((O(),w).subarray(Number(L)>>>0,Number(J)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],strides:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[]})},1064751:(f,g)=>{t.$b("GlobalMaxPool",f,{format:g?"NHWC":"NCHW"})},1064838:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("MaxPool",f,{format:Ne?"NHWC":"NCHW",auto_pad:g,ceil_mode:$,count_include_pad:v,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[],kernel_shape:L?Array.from((O(),w).subarray(Number(L)>>>0,Number(J)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],strides:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[]})},1065313:(f,g)=>{t.$b("GlobalMaxPool",f,{format:g?"NHWC":"NCHW"})},1065400:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne)=>{t.$b("MaxPool",f,{format:Ne?"NHWC":"NCHW",auto_pad:g,ceil_mode:$,count_include_pad:v,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[],kernel_shape:L?Array.from((O(),w).subarray(Number(L)>>>0,Number(J)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],strides:xe?Array.from((O(),w).subarray(Number(xe)>>>0,Number(Ce)>>>0)):[]})},1065875:(f,g,$,v,E)=>{t.$b("Gemm",f,{alpha:g,beta:$,transA:v,transB:E})},1065979:f=>{t.$b("MatMul",f,void 0)},1066033:(f,g,$,v)=>{t.$b("ArgMax",f,{keepDims:!!g,selectLastIndex:!!$,axis:v})},1066141:(f,g,$,v)=>{t.$b("ArgMin",f,{keepDims:!!g,selectLastIndex:!!$,axis:v})},1066249:(f,g)=>{t.$b("Softmax",f,{axis:g})},1066312:(f,g)=>{t.$b("Concat",f,{axis:g})},1066372:(f,g,$,v,E)=>{t.$b("Split",f,{axis:g,numOutputs:$,splitSizes:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1066528:f=>{t.$b("Expand",f,void 0)},1066582:(f,g)=>{t.$b("Gather",f,{axis:Number(g)})},1066653:(f,g)=>{t.$b("GatherElements",f,{axis:Number(g)})},1066732:(f,g)=>{t.$b("GatherND",f,{batch_dims:Number(g)})},1066811:(f,g,$,v,E,P,N,L,J,ee,de)=>{t.$b("Resize",f,{antialias:g,axes:$?Array.from((O(),w).subarray(Number($)>>>0,Number(v)>>>0)):[],coordinateTransformMode:Xe(E),cubicCoeffA:P,excludeOutside:N,extrapolationValue:L,keepAspectRatioPolicy:Xe(J),mode:Xe(ee),nearestMode:Xe(de)})},1067173:(f,g,$,v,E,P,N)=>{t.$b("Slice",f,{starts:g?Array.from((O(),w).subarray(Number(g)>>>0,Number($)>>>0)):[],ends:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[],axes:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[]})},1067437:f=>{t.$b("Tile",f,void 0)},1067489:(f,g,$)=>{t.$b("InstanceNormalization",f,{epsilon:g,format:$?"NHWC":"NCHW"})},1067603:(f,g,$)=>{t.$b("InstanceNormalization",f,{epsilon:g,format:$?"NHWC":"NCHW"})},1067717:f=>{t.$b("Range",f,void 0)},1067770:(f,g)=>{t.$b("Einsum",f,{equation:Xe(g)})},1067851:(f,g,$,v,E)=>{t.$b("Pad",f,{mode:g,value:$,pads:v?Array.from((O(),w).subarray(Number(v)>>>0,Number(E)>>>0)):[]})},1067994:(f,g,$,v,E,P)=>{t.$b("BatchNormalization",f,{epsilon:g,momentum:$,spatial:!!E,trainingMode:!!v,format:P?"NHWC":"NCHW"})},1068163:(f,g,$,v,E,P)=>{t.$b("BatchNormalization",f,{epsilon:g,momentum:$,spatial:!!E,trainingMode:!!v,format:P?"NHWC":"NCHW"})},1068332:(f,g,$)=>{t.$b("CumSum",f,{exclusive:Number(g),reverse:Number($)})},1068429:(f,g,$)=>{t.$b("DequantizeLinear",f,{axis:g,blockSize:$})},1068519:(f,g,$,v,E)=>{t.$b("GridSample",f,{align_corners:g,mode:Xe($),padding_mode:Xe(v),format:E?"NHWC":"NCHW"})},1068689:(f,g,$,v,E)=>{t.$b("GridSample",f,{align_corners:g,mode:Xe($),padding_mode:Xe(v),format:E?"NHWC":"NCHW"})},1068859:(f,g)=>{t.$b("ScatterND",f,{reduction:Xe(g)})},1068944:(f,g,$,v,E,P,N,L,J)=>{t.$b("Attention",f,{numHeads:g,isUnidirectional:$,maskFilterValue:v,scale:E,doRotary:P,qkvHiddenSizes:N?Array.from((O(),w).subarray(Number(L)>>>0,Number(L)+N>>>0)):[],pastPresentShareBuffer:!!J})},1069216:f=>{t.$b("BiasAdd",f,void 0)},1069271:f=>{t.$b("BiasSplitGelu",f,void 0)},1069332:f=>{t.$b("FastGelu",f,void 0)},1069388:(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne,sr,Es)=>{t.$b("Conv",f,{format:xe?"NHWC":"NCHW",auto_pad:g,dilations:$?Array.from((O(),w).subarray(Number($)>>>0,Number(v)>>>0)):[],group:E,kernel_shape:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(N)>>>0)):[],pads:L?Array.from((O(),w).subarray(Number(L)>>>0,Number(J)>>>0)):[],strides:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(de)>>>0)):[],w_is_const:()=>!!(O(),Y)[Number(Ce)>>>0],activation:Xe(Ne),activation_params:sr?Array.from((O(),F).subarray(Number(sr)>>>0,Number(Es)>>>0)):[]})},1069972:f=>{t.$b("Gelu",f,void 0)},1070024:(f,g,$,v,E,P,N,L,J)=>{t.$b("GroupQueryAttention",f,{numHeads:g,kvNumHeads:$,scale:v,softcap:E,doRotary:P,rotaryInterleaved:N,smoothSoftmax:L,localWindowSize:J})},1070241:(f,g,$,v)=>{t.$b("LayerNormalization",f,{axis:g,epsilon:$,simplified:!!v})},1070352:(f,g,$,v)=>{t.$b("LayerNormalization",f,{axis:g,epsilon:$,simplified:!!v})},1070463:(f,g,$,v,E,P)=>{t.$b("MatMulNBits",f,{k:g,n:$,accuracyLevel:v,bits:E,blockSize:P})},1070590:(f,g,$,v,E,P)=>{t.$b("MultiHeadAttention",f,{numHeads:g,isUnidirectional:$,maskFilterValue:v,scale:E,doRotary:P})},1070749:(f,g)=>{t.$b("QuickGelu",f,{alpha:g})},1070813:(f,g,$,v,E)=>{t.$b("RotaryEmbedding",f,{interleaved:!!g,numHeads:$,rotaryEmbeddingDim:v,scale:E})},1070952:(f,g,$)=>{t.$b("SkipLayerNormalization",f,{epsilon:g,simplified:!!$})},1071054:(f,g,$)=>{t.$b("SkipLayerNormalization",f,{epsilon:g,simplified:!!$})},1071156:(f,g,$,v)=>{t.$b("GatherBlockQuantized",f,{gatherAxis:g,quantizeAxis:$,blockSize:v})},1071277:f=>{t.Fd(f)},1071311:(f,g)=>t.Hd(Number(f),Number(g),t.Xc.Kd,t.Xc.errors)};function IS(f,g,$){return Kd(async()=>{await t.Dd(Number(f),Number(g),Number($))})}function OS(){return typeof wasmOffsetConverter<"u"}function ES(f,g,$,v){var E=ge();try{return Pc(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function AS(f,g,$){var v=ge();try{return Ic(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;_e(1,0)}}function PS(f){var g=ge();try{$c(f)}catch($){if(me(g),$!==$+0)throw $;_e(1,0)}}function kS(f,g){var $=ge();try{return Is(f,g)}catch(v){if(me($),v!==v+0)throw v;_e(1,0)}}function CS(f,g,$){var v=ge();try{xc(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;_e(1,0)}}function DS(f,g){var $=ge();try{kc(f,g)}catch(v){if(me($),v!==v+0)throw v;_e(1,0)}}function RS(f,g,$,v,E,P,N){var L=ge();try{return Ec(f,g,$,v,E,P,N)}catch(J){if(me(L),J!==J+0)throw J;_e(1,0)}}function NS(f,g,$,v,E,P){var N=ge();try{Tc(f,g,$,v,E,P)}catch(L){if(me(N),L!==L+0)throw L;_e(1,0)}}function zS(f,g,$,v){var E=ge();try{Ac(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function BS(f,g,$,v,E){var P=ge();try{Sc(f,g,$,v,E)}catch(N){if(me(P),N!==N+0)throw N;_e(1,0)}}function MS(f,g,$,v,E,P,N){var L=ge();try{Dc(f,g,$,v,E,P,N)}catch(J){if(me(L),J!==J+0)throw J;_e(1,0)}}function FS(f,g,$,v,E,P,N){var L=ge();try{Rc(f,g,$,v,E,P,N)}catch(J){if(me(L),J!==J+0)throw J;_e(1,0)}}function jS(f,g,$,v,E,P,N,L){var J=ge();try{Mc(f,g,$,v,E,P,N,L)}catch(ee){if(me(J),ee!==ee+0)throw ee;_e(1,0)}}function LS(f,g,$,v,E){var P=ge();try{return Cc(f,g,$,v,E)}catch(N){if(me(P),N!==N+0)throw N;_e(1,0)}}function VS(f,g,$){var v=ge();try{return Fc(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;_e(1,0)}}function US(f,g,$,v,E,P,N,L){var J=ge();try{jc(f,g,$,v,E,P,N,L)}catch(ee){if(me(J),ee!==ee+0)throw ee;_e(1,0)}}function GS(f,g,$,v,E,P,N,L,J,ee,de,xe){var Ce=ge();try{Nc(f,g,$,v,E,P,N,L,J,ee,de,xe)}catch(Ne){if(me(Ce),Ne!==Ne+0)throw Ne;_e(1,0)}}function qS(f,g,$){var v=ge();try{return Lc(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;return _e(1,0),0n}}function HS(f,g,$,v,E,P,N,L,J){var ee=ge();try{Oc(f,g,$,v,E,P,N,L,J)}catch(de){if(me(ee),de!==de+0)throw de;_e(1,0)}}function WS(f){var g=ge();try{return Vc(f)}catch($){if(me(g),$!==$+0)throw $;_e(1,0)}}function KS(f,g){var $=ge();try{return np(f,g)}catch(v){if(me($),v!==v+0)throw v;return _e(1,0),0n}}function XS(f){var g=ge();try{return Uc(f)}catch($){if(me(g),$!==$+0)throw $;return _e(1,0),0n}}function ZS(f,g,$,v){var E=ge();try{return Xc(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function JS(f,g,$,v,E){var P=ge();try{return Zc(f,g,$,v,E)}catch(N){if(me(P),N!==N+0)throw N;_e(1,0)}}function YS(f,g,$,v,E,P){var N=ge();try{return Jc(f,g,$,v,E,P)}catch(L){if(me(N),L!==L+0)throw L;_e(1,0)}}function QS(f,g,$,v,E,P){var N=ge();try{return zc(f,g,$,v,E,P)}catch(L){if(me(N),L!==L+0)throw L;_e(1,0)}}function eI(f,g,$,v,E,P){var N=ge();try{return Yc(f,g,$,v,E,P)}catch(L){if(me(N),L!==L+0)throw L;_e(1,0)}}function tI(f,g,$,v,E,P,N,L){var J=ge();try{return Bc(f,g,$,v,E,P,N,L)}catch(ee){if(me(J),ee!==ee+0)throw ee;_e(1,0)}}function rI(f,g,$,v,E){var P=ge();try{return Qc(f,g,$,v,E)}catch(N){if(me(P),N!==N+0)throw N;return _e(1,0),0n}}function nI(f,g,$,v){var E=ge();try{return ep(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function iI(f,g,$,v){var E=ge();try{return tp(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function oI(f,g,$,v,E,P,N,L,J,ee,de,xe){var Ce=ge();try{return rp(f,g,$,v,E,P,N,L,J,ee,de,xe)}catch(Ne){if(me(Ce),Ne!==Ne+0)throw Ne;_e(1,0)}}function sI(f,g,$,v,E,P,N,L,J,ee,de){var xe=ge();try{Wc(f,g,$,v,E,P,N,L,J,ee,de)}catch(Ce){if(me(xe),Ce!==Ce+0)throw Ce;_e(1,0)}}function aI(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne,sr,Es){var cI=ge();try{Kc(f,g,$,v,E,P,N,L,J,ee,de,xe,Ce,Ne,sr,Es)}catch(As){if(me(cI),As!==As+0)throw As;_e(1,0)}}function uI(f,g,$){var v=ge();try{return Gc(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;_e(1,0)}}function lI(f,g,$){var v=ge();try{return qc(f,g,$)}catch(E){if(me(v),E!==E+0)throw E;_e(1,0)}}function dI(f,g,$,v){var E=ge();try{Hc(f,g,$,v)}catch(P){if(me(E),P!==P+0)throw P;_e(1,0)}}function Zi(){if(0<ut)Ir=Zi;else if(u)b?.(t),H();else{for(var f=Le;0<f.length;)f.shift()(t);0<ut?Ir=Zi:(t.calledRun=!0,A||(H(),b?.(t)))}}return u||(Wt=await ye(),Zi()),t.PTR_SIZE=4,Z?t:new Promise((f,g)=>{b=f,x=g})}var $v,zf,tA=R(()=>{"use strict";$v=Nf,zf=globalThis.self?.name?.startsWith("em-pthread"),zf&&Nf()}),ga,nl,Bf,pt,Tv,no,Mf,Ff,ba,jf,ya,Sv,_a,Iv,Pl=R(()=>{"use strict";Al(),ga=typeof location>"u"?void 0:location.origin,nl=import.meta.url>"file:"&&import.meta.url<"file;",Bf=()=>{if(nl){let e=URL;return new URL(new e("ort.all.bundle.min.mjs",import.meta.url).href,ga).href}return import.meta.url},pt=Bf(),Tv=()=>{if(pt&&!pt.startsWith("blob:"))return pt.substring(0,pt.lastIndexOf("/")+1)},no=(e,t)=>{try{let n=t??pt;return(n?new URL(e,n):new URL(e)).origin===ga}catch{return!1}},Mf=(e,t)=>{let n=t??pt;try{return(n?new URL(e,n):new URL(e)).href}catch{return}},Ff=(e,t)=>`${t??"./"}${e}`,ba=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},jf=async e=>(await import(e)).default,ya=(eA(),Tn(wv)).default,Sv=async()=>{if(!pt)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(no(pt))return[void 0,ya()];let e=await ba(pt);return[e,ya(e)]},_a=(tA(),Tn(xv)).default,Iv=async(e,t,n,o)=>{let u=_a&&!(e||t);if(u)if(pt)u=no(pt)||o&&!n;else if(o&&!n)u=!0;else throw new Error("cannot determine the script source URL.");if(u)return[void 0,_a];{let l="ort-wasm-simd-threaded.jsep.mjs",d=e??Mf(l,t),c=n&&d&&!no(d,t),s=c?await ba(d):d??Ff(l,t);return[c?s:void 0,await jf(s)]}}}),wa,io,Qn,va,Lf,Vf,Uf,kl,Re,dn=R(()=>{"use strict";Pl(),io=!1,Qn=!1,va=!1,Lf=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Vf=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Uf=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},kl=async e=>{if(io)return Promise.resolve();if(Qn)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(va)throw new Error("previous call to 'initializeWebAssembly()' failed.");Qn=!0;let t=e.initTimeout,n=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Uf())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Vf())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let o=Lf();n>1&&!o&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+n+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=n=1);let u=e.wasmPaths,l=typeof u=="string"?u:void 0,d=u?.mjs,c=d?.href??d,s=u?.wasm,r=s?.href??s,i=e.wasmBinary,[a,p]=await Iv(c,l,n>1,!!i||!!r),h=!1,m=[];if(t>0&&m.push(new Promise(b=>{setTimeout(()=>{h=!0,b()},t)})),m.push(new Promise((b,x)=>{let _={numThreads:n};if(i)_.wasmBinary=i,_.locateFile=y=>y;else if(r||l)_.locateFile=y=>r??l+y;else if(c&&c.indexOf("blob:")!==0)_.locateFile=y=>new URL(y,c).href;else if(a){let y=Tv();y&&(_.locateFile=S=>y+S)}p(_).then(y=>{Qn=!1,io=!0,wa=y,b(),a&&URL.revokeObjectURL(a)},y=>{Qn=!1,va=!0,x(y)})})),await Promise.race(m),h)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},Re=()=>{if(io&&wa)return wa;throw new Error("WebAssembly is not initialized yet.")}}),Nt,Io,Ae,Cl=R(()=>{"use strict";dn(),Nt=(e,t)=>{let n=Re(),o=n.lengthBytesUTF8(e)+1,u=n._malloc(o);return n.stringToUTF8(e,u,o),t.push(u),u},Io=(e,t,n,o)=>{if(typeof e=="object"&&e!==null){if(n.has(e))throw new Error("Circular reference in options");n.add(e)}Object.entries(e).forEach(([u,l])=>{let d=t?t+u:u;if(typeof l=="object")Io(l,d+".",n,o);else if(typeof l=="string"||typeof l=="number")o(d,l.toString());else if(typeof l=="boolean")o(d,l?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof l}`)})},Ae=e=>{let t=Re(),n=t.stackSave();try{let o=t.PTR_SIZE,u=t.stackAlloc(2*o);t._OrtGetLastError(u,u+o);let l=Number(t.getValue(u,o===4?"i32":"i64")),d=t.getValue(u+o,"*"),c=d?t.UTF8ToString(d):"";throw new Error(`${e} ERROR_CODE: ${l}, ERROR_MESSAGE: ${c}`)}finally{t.stackRestore(n)}}}),Ov,rA=R(()=>{"use strict";dn(),Cl(),Ov=e=>{let t=Re(),n=0,o=[],u=e||{};try{if(e?.logSeverityLevel===void 0)u.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)u.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(u.terminate=!1);let l=0;return e?.tag!==void 0&&(l=Nt(e.tag,o)),n=t._OrtCreateRunOptions(u.logSeverityLevel,u.logVerbosityLevel,!!u.terminate,l),n===0&&Ae("Can't create run options."),e?.extra!==void 0&&Io(e.extra,"",new WeakSet,(d,c)=>{let s=Nt(d,o),r=Nt(c,o);t._OrtAddRunConfigEntry(n,s,r)!==0&&Ae(`Can't set a run config entry: ${d} - ${c}.`)}),[n,o]}catch(l){throw n!==0&&t._OrtReleaseRunOptions(n),o.forEach(d=>t._free(d)),l}}}),Gf,qf,Hf,Dr,Wf,Ev,nA=R(()=>{"use strict";dn(),Cl(),Gf=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},qf=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Hf=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(n=>(typeof n=="string"?n:n.name)==="webgpu")&&(e.enableMemPattern=!1)},Dr=(e,t,n,o)=>{let u=Nt(t,o),l=Nt(n,o);Re()._OrtAddSessionConfigEntry(e,u,l)!==0&&Ae(`Can't set a session config entry: ${t} - ${n}.`)},Wf=async(e,t,n)=>{let o=t.executionProviders;for(let u of o){let l=typeof u=="string"?u:u.name,d=[];switch(l){case"webnn":if(l="WEBNN",Dr(e,"session.disable_quant_qdq","1",n),Dr(e,"session.disable_qdq_constant_folding","1",n),typeof u!="string"){let a=u?.deviceType;a&&Dr(e,"deviceType",a,n)}break;case"webgpu":if(l="JS",typeof u!="string"){let a=u;if(a?.preferredLayout){if(a.preferredLayout!=="NCHW"&&a.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${a.preferredLayout}`);Dr(e,"preferredLayout",a.preferredLayout,n)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${l}`)}let c=Nt(l,n),s=d.length,r=0,i=0;if(s>0){r=Re()._malloc(s*Re().PTR_SIZE),n.push(r),i=Re()._malloc(s*Re().PTR_SIZE),n.push(i);for(let a=0;a<s;a++)Re().setValue(r+a*Re().PTR_SIZE,d[a][0],"*"),Re().setValue(i+a*Re().PTR_SIZE,d[a][1],"*")}await Re()._OrtAppendExecutionProvider(e,c,r,i,s)!==0&&Ae(`Can't append execution provider: ${l}.`)}},Ev=async e=>{let t=Re(),n=0,o=[],u=e||{};Hf(u);try{let l=Gf(u.graphOptimizationLevel??"all"),d=qf(u.executionMode??"sequential"),c=typeof u.logId=="string"?Nt(u.logId,o):0,s=u.logSeverityLevel??2;if(!Number.isInteger(s)||s<0||s>4)throw new Error(`log severity level is not valid: ${s}`);let r=u.logVerbosityLevel??0;if(!Number.isInteger(r)||r<0||r>4)throw new Error(`log verbosity level is not valid: ${r}`);let i=typeof u.optimizedModelFilePath=="string"?Nt(u.optimizedModelFilePath,o):0;if(n=t._OrtCreateSessionOptions(l,!!u.enableCpuMemArena,!!u.enableMemPattern,d,!!u.enableProfiling,0,c,s,r,i),n===0&&Ae("Can't create session options."),u.executionProviders&&await Wf(n,u,o),u.enableGraphCapture!==void 0){if(typeof u.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${u.enableGraphCapture}`);Dr(n,"enableGraphCapture",u.enableGraphCapture.toString(),o)}if(u.freeDimensionOverrides)for(let[a,p]of Object.entries(u.freeDimensionOverrides)){if(typeof a!="string")throw new Error(`free dimension override name must be a string: ${a}`);if(typeof p!="number"||!Number.isInteger(p)||p<0)throw new Error(`free dimension override value must be a non-negative integer: ${p}`);let h=Nt(a,o);t._OrtAddFreeDimensionOverride(n,h,p)!==0&&Ae(`Can't set a free dimension override: ${a} - ${p}.`)}return u.extra!==void 0&&Io(u.extra,"",new WeakSet,(a,p)=>{Dr(n,a,p,o)}),[n,o]}catch(l){throw n!==0&&t._OrtReleaseSessionOptions(n)!==0&&Ae("Can't release session options."),o.forEach(d=>t._free(d)),l}}}),Yr,Jt,Qr,Lo,Oo,Dl,Rl,il,se=R(()=>{"use strict";Yr=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},Jt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Qr=(e,t)=>{let n=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],o=typeof t=="number"?t:t.reduce((u,l)=>u*l,1);return n>0?Math.ceil(o*n):void 0},Lo=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Oo=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Dl=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Rl=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",il=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Nl,Av=R(()=>{"use strict";Al(),Nl=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let n=t.headers.get("Content-Length"),o=n?parseInt(n,10):0;if(o<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let u=t.body.getReader(),l;try{l=new ArrayBuffer(o)}catch(c){if(c instanceof RangeError){let s=Math.ceil(o/65536);l=new WebAssembly.Memory({initial:s,maximum:s}).buffer}else throw c}let d=0;for(;;){let{done:c,value:s}=await u.read();if(c)break;let r=s.byteLength;new Uint8Array(l,d,r).set(s),d+=r}return new Uint8Array(l,0,o)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Kf,Xf,Zf,Jf,zl,Yf,ve,Qt=R(()=>{"use strict";se(),Kf=["V","I","W","E","F"],Xf=(e,t)=>{console.log(`[${Kf[e]},${new Date().toISOString()}]${t}`)},zl=(e,t)=>{Zf=e,Jf=t},Yf=(e,t)=>{let n=Oo(e),o=Oo(Zf);n>=o&&Xf(n,typeof t=="function"?t():t)},ve=(...e)=>{Jf&&Yf(...e)}}),Qf,In,B,Eo,Pv,kv,Cv,ae=R(()=>{"use strict";Qf=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},In=class{static calcShape(e,t,n=!1){let o=e.length,u=t.length;if(o===0)return t;if(u===0)return e;let l=Math.max(e.length,t.length),d=new Array(l);if(n){if(o<2||u<2)return;let c=Qf.calcMatMulShape([e[o-2],e[o-1]],[t[u-2],t[u-1]]);if(c===void 0)return;[d[l-2],d[l-1]]=c}for(let c=n?3:1;c<=l;c++){let s=o-c<0?1:e[o-c],r=u-c<0?1:t[u-c];if(s!==r&&s>1&&r>1)return;let i=Math.max(s,r);if(s&&r)d[l-c]=Math.max(s,r);else{if(i>1)return;d[l-c]=0}}return d}static isValidBroadcast(e,t){let n=e.length,o=t.length;if(n>o)return!1;for(let u=1;u<=n;u++)if(e[n-u]!==1&&e[n-u]!==t[o-u])return!1;return!0}},B=class _o{static size(t){return _o.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,n=4){let o=t.length;if(o===0)return[];let u=new Array(o),l=o-1;for(;l>=0;){if(t[l]%n===0){u[l]=t[l]/n;break}if(n%t[l]!==0)throw new Error("cannot convert shape");u[l]=1,n/=t[l],l--}for(l--;l>=0;l--)u[l]=t[l];return u}static sizeFromDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return _o.getSizeFromDimensionRange(t,n,t.length)}static sizeToDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeToDimension as Tensor has ${t.length} dimensions.`);return _o.getSizeFromDimensionRange(t,0,n)}static getSizeFromDimensionRange(t,n,o){let u=1;for(let l=n;l<o;l++){if(t[l]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");u*=Number(t[l])}return u}static computeStrides(t){let n=t.length;if(n===0)return[];if(n===1)return[1];let o=new Array(n);o[n-1]=1,o[n-2]=t[n-1];for(let u=n-3;u>=0;--u)o[u]=o[u+1]*t[u+1];return o}static normalizeAxis(t,n){if(t<-n&&t>=n)throw new Error("unsupported axis for this operation.");return t<0?t+n:t}static normalizeAxes(t,n){return t.map(o=>this.normalizeAxis(o,n??t.length))}static sortBasedOnPerm(t,n){return n?n.map(o=>t[o]):t.slice().reverse()}static padShape(t,n){let o=t.length;return t.map((u,l)=>u+n[l]+n[l+o])}static areEqual(t,n){return t.length!==n.length?!1:t.every((o,u)=>o===n[u])}},Eo=class yr{static adjustPoolAttributes(t,n,o,u,l,d){if(!t&&o.length!==n.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let c=0;c<n.length-2;c++)c>=o.length?o.push(n[c+2]):o[c]=n[c+2];for(let c=0;c<o.length;c++)if(c<u.length){if(u[c]<0)throw new Error("strides should be greater than or equal to 1")}else u.push(1);for(let c=0;c<o.length;c++)if(c<l.length){if(l[c]<0)throw new Error("dilations should be greater than or equal to 1")}else l.push(1);for(let c=0;c<o.length*2;c++)if(c<d.length){if(d[c]<0)throw new Error("pad should be greater than or equal to 1")}else d.push(0);for(let c=0;c<o.length;c++){if(o[c]<=0)throw new Error("kernel shapes need to be greater than 0");if(d[c]>=o[c]||d[c+o.length]>=o[c])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,n,o,u,l,d,c){if(c){if(l.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(u.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let s=0;s<t.length-2;s++)yr.adjustPadAndReturnShape(t[s+(d?1:2)],n[s],o[s],u[s],l,s,s+t.length-2,c)}}static computePoolOutputShape(t,n,o,u,l,d,c,s=0){if(n.length<=0)throw new Error("input shape must be of size greater than 0");let r=[n[0],n[1]];return yr.computeShapeHelper(t,n,r,o,u,l,d,c,s),r}static computeConvOutputShape(t,n,o,u,l,d,c){if(t.length<=0||n.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let s=[t[0],n[0]];return yr.computeShapeHelper(!1,t,s,o,u,l,d,c),s}static computeShapeHelper(t,n,o,u,l,d,c,s,r=0){if(t)for(let i=0;i<n.length-2;i++)o.push(1);else for(let i=0;i<n.length-2;i++)o.push(yr.adjustPadAndReturnShape(n[i+2],u[i],l[i],d[i],c,i,i+n.length-2,s,r))}static computeOutputSize(t,n,o,u,l){let d=Math.floor(t/n)+1;return l===1&&(d=Math.ceil(t/n)+1,(d-1)*n>=o+u&&(d-=1)),d}static adjustPadAndReturnShape(t,n,o,u,l,d,c,s,r=0){let i=o*(u-1)+1;if(s&&s!=="NOTSET")switch(s){case"VALID":return l[d]=0,l[c]=0,yr.computeOutputSize(t-i,n,t,0,r);case"SAME_LOWER":case"SAME_UPPER":if(o!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let a=(Math.floor((t+n-1)/n)-1)*n+u-t;return l[d]=Math.floor(s==="SAME_LOWER"?(a+1)/2:a/2),l[c]=a-l[d],yr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}default:throw new Error("Unsupported AutoPad type")}else return yr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}},Pv=class{static getShapeOfGemmResult(e,t,n,o,u){if(e.length!==2||n.length!==2)throw new Error("shape need to be of size 2");let l,d,c;t?(l=e[1],d=e[0]):(l=e[0],d=e[1]);let s=-1;if(o?(c=n[0],s=1):(c=n[1],s=0),n[s]!==d)throw new Error("dimension mismatch");if(l<=0||c<=0||d<=0)throw new Error("invalid shape specified");if(u&&!In.isValidBroadcast(u,[l,c]))throw new Error("gemm: invalid bias shape for broadcast");return[l,c,d]}},kv=-34028234663852886e22,Cv=34028234663852886e22}),Bl,Dv=R(()=>{"use strict";se(),Bl=(e,t)=>new(Lo(t))(e)}),xa,em,$a,tm,Ta,rm,Sa,Ia,Oa,nm,Rv,iA=R(()=>{"use strict";se(),Qt(),xa=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),em=(e,t)=>{if(t==="int32")return e;let n=xa.get(t);if(!n)throw new Error(`WebNN backend does not support data type: ${t}`);let o=n/8;if(e.byteLength%o!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${o}.`);let u=e.byteLength/o,l=new(Lo(t))(e.buffer,e.byteOffset,u);switch(t){case"int64":case"uint64":{let d=new Int32Array(u);for(let c=0;c<u;c++){let s=l[c];if(s>2147483647n||s<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");d[c]=Number(s)}return new Uint8Array(d.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&l.some(c=>c>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let d=Int32Array.from(l,Number);return new Uint8Array(d.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},$a=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let n=e.byteLength/4,o=new Int32Array(e.buffer,e.byteOffset,n);switch(t){case"int64":{let u=BigInt64Array.from(o,BigInt);return new Uint8Array(u.buffer)}case"uint64":{if(o.some(l=>l<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let u=BigUint64Array.from(o,BigInt);return new Uint8Array(u.buffer)}case"int8":{if(o.some(l=>l<-128||l>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let u=Int8Array.from(o,Number);return new Uint8Array(u.buffer)}case"uint8":{if(o.some(u=>u<0||u>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(o,Number)}case"uint32":{if(o.some(l=>l<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let u=Uint32Array.from(o,Number);return new Uint8Array(u.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},tm=1,Ta=()=>tm++,rm=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Sa=(e,t)=>{let n=xa.get(e);if(!n)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((o,u)=>o*u)*n/8):0},Ia=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:n,tensor:o,dataType:u,shape:l,fallbackDataType:d}=e;this.sessionId=t,this.mlContext=n,this.mlTensor=o,this.dataType=u,this.tensorShape=l,this.fallbackDataType=d}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Sa(this.dataType,this.tensorShape)}destroy(){ve("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),n=$a(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(n);return}else return new Uint8Array(n).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,n){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===n.length&&this.tensorShape.every((o,u)=>o===n[u])}setIsDataConverted(e){this.isDataConverted=e}},Oa=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,n,o){let u=this.tensorManager.getMLContext(e),l=this.tensorManager.getMLOpSupportLimits(e),d;if(!l?.input.dataTypes.includes(t)){if(d=rm.get(t),!d||l?.input.dataTypes.includes(d))throw new Error(`WebNN backend does not support data type: ${t}`);ve("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${d}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(u,t,n))return this.wrapper.tensor;if(o){if(this.wrapper.byteLength!==Sa(t,n))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let c=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,n,c,!0,!0,d),o&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=em(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else ve("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?$a(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},nm=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=Ta();return this.tensorTrackersById.set(e,new Oa(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,n,o,u){ve("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${n}, shape: ${o}, copyOld: ${u}}`);let l=this.tensorTrackersById.get(t);if(!l)throw new Error("Tensor not found.");return l.ensureTensor(e,n,o,u)}upload(e,t){let n=this.tensorTrackersById.get(e);if(!n)throw new Error("Tensor not found.");n.upload(t)}async download(e,t){ve("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let n=this.tensorTrackersById.get(e);if(!n)throw new Error("Tensor not found.");return n.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,n,o){let u=this.getMLContext(e),l=Ta(),d=new Ia({sessionId:e,context:u,tensor:t,dataType:n,shape:o});return this.tensorTrackersById.set(l,new Oa(this,d)),this.externalTensors.add(d),l}async getCachedTensor(e,t,n,o,u,l,d){let c=this.getMLContext(e);for(let[r,i]of this.freeTensors.entries())if(i.canReuseTensor(c,t,n)){ve("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${d?`fallbackDataType: ${d},`:""} shape: ${n}`);let a=this.freeTensors.splice(r,1)[0];return a.sessionId=e,a}ve("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${d?`fallbackDataType: ${d},`:""} shape: ${n}}`);let s=await c.createTensor({dataType:d??t,shape:n,dimensions:n,usage:o,writable:u,readable:l});return new Ia({sessionId:e,context:c,tensor:s,dataType:t,shape:n,fallbackDataType:d})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Rv=(...e)=>new nm(...e)}),ei,im,Nv,oA=R(()=>{"use strict";se(),dn(),Dv(),iA(),Qt(),ei=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),im=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let n=Object.keys(e).sort(),o=Object.keys(t).sort();return n.length===o.length&&n.every((u,l)=>u===o[l]&&e[u]===t[u])},Nv=class{constructor(e){this.tensorManager=Rv(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,zl(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){ve("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){ve("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let n of t)ve("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${n}}`),this.tensorManager.releaseTensorId(n);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let n=this.mlContextCache.findIndex(o=>o.gpuDevice===e);if(n!==-1)return this.mlContextCache[n].mlContext;{let o=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:o}),o}}else if(e===void 0){let n=this.mlContextCache.findIndex(o=>o.options===void 0&&o.gpuDevice===void 0);if(n!==-1)return this.mlContextCache[n].mlContext;{let o=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:o}),o}}let t=this.mlContextCache.findIndex(n=>im(n.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:n}),n}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let n=this.sessionIdsByMLContext.get(t);n||(n=new Set,this.sessionIdsByMLContext.set(t,n)),n.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let n=this.sessionIdsByMLContext.get(t);if(n.delete(e),n.size===0){this.sessionIdsByMLContext.delete(t);let o=this.mlContextCache.findIndex(u=>u.mlContext===t);o!==-1&&this.mlContextCache.splice(o,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){ve("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,n,o,u){let l=ei.get(n);if(!l)throw new Error(`Unsupported ONNX data type: ${n}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,l,o,u)}async createTemporaryTensor(e,t,n){ve("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${n}}`);let o=ei.get(t);if(!o)throw new Error(`Unsupported ONNX data type: ${t}`);let u=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,u,o,n,!1);let l=this.temporarySessionTensorIds.get(e);return l?l.push(u):this.temporarySessionTensorIds.set(e,[u]),u}uploadTensor(e,t){if(!Re().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");ve("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let n=await this.tensorManager.download(e);return Bl(n,t)}}registerMLTensor(e,t,n,o){let u=ei.get(n);if(!u)throw new Error(`Unsupported ONNX data type: ${n}`);let l=this.tensorManager.registerTensor(e,t,u,o);return ve("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${u}, dimensions: ${o}} -> {tensorId: ${l}}`),l}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let n=this.sessionGraphInputs.get(e);return n?n.includes(t):!1}isGraphOutput(e,t){let n=this.sessionGraphOutputs.get(e);return n?n.includes(t):!1}isGraphInputOutputTypeSupported(e,t,n=!0){let o=ei.get(Yr(t)),u=this.mlOpSupportLimitsBySessionId.get(e);return typeof o>"u"?!1:n?!!u?.input.dataTypes.includes(o):!!u?.output.dataTypes.includes(o)}flush(){}}}),Ml=R(()=>{"use strict"}),Ea,oo,so,om,sm,Aa,ol,am,zv,sA=R(()=>{"use strict";Qt(),Ml(),Ea=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),oo=[],so=e=>Math.ceil(Number(e)/16)*16,om=e=>{for(let t=0;t<oo.length;t++){let n=oo[t];if(e<=n)return n}return Math.ceil(e/16)*16},sm=1,Aa=()=>sm++,ol=async(e,t,n,o)=>{let u=so(n),l=e.device.createBuffer({size:u,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let d=e.getCommandEncoder();e.endComputePass(),d.copyBufferToBuffer(t,0,l,0,u),e.flush(),await l.mapAsync(GPUMapMode.READ);let c=l.getMappedRange();if(o){let s=o();return s.set(new Uint8Array(c,0,n)),s}else return new Uint8Array(c.slice(0,n))}finally{l.destroy()}},am=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Ea)oo.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let n=t.buffer,o=t.byteOffset,u=t.byteLength,l=so(u),d=this.storageCache.get(e);if(!d)throw new Error("gpu data for uploading does not exist");if(Number(d.originalSize)!==u)throw new Error(`inconsistent data size. gpu data size=${d.originalSize}, data size=${u}`);if(l===u&&o%4===0)this.backend.device.queue.writeBuffer(d.gpuData.buffer,0,n,o,u);else{let c=new Uint8Array(l);c.set(t),this.backend.device.queue.writeBuffer(d.gpuData.buffer,0,c,0,l)}ve("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let n=this.storageCache.get(e);if(!n)throw new Error("source gpu data for memcpy does not exist");let o=this.storageCache.get(t);if(!o)throw new Error("destination gpu data for memcpy does not exist");if(n.originalSize!==o.originalSize)throw new Error("inconsistent source and destination gpu data size");let u=so(n.originalSize),l=this.backend.getCommandEncoder();this.backend.endComputePass(),l.copyBufferToBuffer(n.gpuData.buffer,0,o.gpuData.buffer,0,u)}registerExternalBuffer(e,t,n){let o;if(n){if(o=n[0],e===n[1])return ve("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${o}, buffer is the same, skip.`),o;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else o=Aa();return this.storageCache.set(o,{gpuData:{id:o,type:0,buffer:e},originalSize:t}),ve("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${o}, registered.`),o}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),ve("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let n=om(e),o,u=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,l=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(u||l){let c=(u?this.freeBuffers:this.freeUniformBuffers).get(n);c?c.length>0?o=c.pop():o=this.backend.device.createBuffer({size:n,usage:t}):o=this.backend.device.createBuffer({size:n,usage:t})}else o=this.backend.device.createBuffer({size:n,usage:t});let d={id:Aa(),type:0,buffer:o};return this.storageCache.set(d.id,{gpuData:d,originalSize:Number(e)}),ve("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${d.id}`),d}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,n=this.storageCache.get(t);if(!n){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return ve("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${n.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(n.gpuData.buffer),n.originalSize}async download(e,t){let n=this.storageCache.get(Number(e));if(!n)throw new Error("data does not exist");await ol(this.backend,n.gpuData.buffer,n.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Ea.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let n=this.freeBuffers.get(e.size)||[];t===void 0||n.length>=t?e.destroy():n.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let n=this.freeUniformBuffers.get(e.size)||[];t===void 0||n.length>=t?e.destroy():n.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(n=>{n.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(ve("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(n=>{n.gpuData.buffer.destroy()}),this.storageCache=new Map)}},zv=(...e)=>new am(...e)}),um,Se,Ue=R(()=>{"use strict";um=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Se=e=>new um(e)}),On,ao,Ye,Je,oe,Ve,sl,$n,wr,ne,ti,j,re,Bv,Fl,lm,Mv,ue=R(()=>{"use strict";se(),ae(),On=64,ao=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Ye=(e,t=1)=>{let n=ao(e,t);return typeof n=="string"?n:n[0]},Je=(e,t=1)=>{let n=ao(e,t);return typeof n=="string"?n:n[1]},oe=(...e)=>{let t=[];return e.forEach(n=>{n.length!==0&&t.push({type:12,data:n},{type:12,data:B.computeStrides(n)})}),t},Ve=e=>e%4===0?4:e%2===0?2:1,sl=(e="f32",t,n="0")=>!t||t===1?`${e}(${n})`:`vec${t}<${e}>(${n})`,$n=(e,t,n)=>e==="f32"?n:t===1?`f32(${n})`:`vec${t}<f32>(${n})`,wr=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,ne=(e,t,n,o)=>e.startsWith("uniforms.")&&n>4?typeof t=="string"?o==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:o==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:n>1?`${e}[${t}]`:e,ti=(e,t,n,o,u)=>{let l=typeof n=="number",d=l?n:n.length,c=[...new Array(d).keys()],s=d<2?"u32":d<=4?`vec${d}<u32>`:`array<u32, ${d}>`,r=ao(t,u),i=typeof r=="string"?r:r[1],a=typeof r=="string"?r:r[0],p={indices:s,value:i,storage:a,tensor:t},h=M=>typeof M=="string"?M:`${M}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=l?"uniforms.":"",x=`${b}${e}_shape`,_=`${b}${e}_strides`,y="";for(let M=0;M<d-1;M++)y+=`
    let dim${M} = current / ${ne(_,M,d)};
    let rest${M} = current % ${ne(_,M,d)};
    indices[${M}] = dim${M};
    current = rest${M};
    `;y+=`indices[${d-1}] = current;`;let S=d<2?"":`
  fn o2i_${e}(offset: u32) -> ${p.indices} {
    var indices: ${p.indices};
    var current = offset;
    ${y}
    return indices;
  }`,T=M=>(m.offsetToIndices=!0,d<2?M:`o2i_${e}(${M})`),I=[];if(d>=2)for(let M=d-1;M>=0;M--)I.push(`${ne(_,M,d)} * (indices[${M}])`);let A=d<2?"":`
  fn i2o_${e}(indices: ${p.indices}) -> u32 {
    return ${I.join("+")};
  }`,k=M=>(m.indicesToOffset=!0,d<2?M:`i2o_${e}(${M})`),O=(...M)=>d===0?"0u":`${p.indices}(${M.map(h).join(",")})`,z=(M,Z)=>d<2?`${M}`:`${ne(M,Z,d)}`,G=(M,Z,X)=>d<2?`${M}=${X};`:`${ne(M,Z,d)}=${X};`,Y={},W=(M,Z)=>{m.broadcastedIndicesToOffset=!0;let X=`${Z.name}broadcastedIndicesTo${e}Offset`;if(X in Y)return`${X}(${M})`;let H=[];for(let pe=d-1;pe>=0;pe--){let fe=Z.indicesGet("outputIndices",pe+Z.rank-d);H.push(`${z(_,pe)} * (${fe} % ${z(x,pe)})`)}return Y[X]=`fn ${X}(outputIndices: ${Z.type.indices}) -> u32 {
             return ${H.length>0?H.join("+"):"0u"};
           }`,`${X}(${M})`},D=(M,Z)=>(()=>{if(p.storage===p.value)return`${e}[${M}]=${Z};`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`${e}[${M}]=vec2<u32>(u32(${Z}), select(0u, 0xFFFFFFFFu, ${Z} < 0));`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`${e}[${M}]=vec2<u32>(u32(${Z}), 0u);`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`${e}[${M}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${Z}));`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),Q=M=>(()=>{if(p.storage===p.value)return`${e}[${M}]`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`i32(${e}[${M}].x)`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`u32(${e}[${M}].x)`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${M}] & 0xFFu), bool(${e}[${M}] & 0xFF00u), bool(${e}[${M}] & 0xFF0000u), bool(${e}[${M}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),w=d<2?"":`
  fn get_${e}ByIndices(indices: ${p.indices}) -> ${i} {
    return ${Q(`i2o_${e}(indices)`)};
  }`,C=d<2?"":(()=>{let M=c.map(X=>`d${X}: u32`).join(", "),Z=c.map(X=>`d${X}`).join(", ");return`
  fn get_${e}(${M}) -> ${i} {
    return get_${e}ByIndices(${O(Z)});
  }`})(),F=(...M)=>{if(M.length!==d)throw new Error(`indices length must be ${d}`);let Z=M.map(h).join(",");return d===0?Q("0u"):d===1?Q(Z[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${Z})`)},V=M=>d<2?Q(M):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${M})`),U=d<2?"":`
  fn set_${e}ByIndices(indices: ${p.indices}, value: ${i}) {
    ${D(`i2o_${e}(indices)`,"value")}
  }`,q=d<2?"":(()=>{let M=c.map(X=>`d${X}: u32`).join(", "),Z=c.map(X=>`d${X}`).join(", ");return`
  fn set_${e}(${M}, value: ${i}) {
    set_${e}ByIndices(${O(Z)}, value);
  }`})();return{impl:()=>{let M=[],Z=!1;return m.offsetToIndices&&(M.push(S),Z=!0),m.indicesToOffset&&(M.push(A),Z=!0),m.broadcastedIndicesToOffset&&(Object.values(Y).forEach(X=>M.push(X)),Z=!0),m.set&&(M.push(q),Z=!0),m.setByIndices&&(M.push(U),Z=!0),m.get&&(M.push(C),Z=!0),m.getByIndices&&(M.push(w),Z=!0),!l&&Z&&M.unshift(`const ${x} = ${p.indices}(${n.join(",")});`,`const ${_} = ${p.indices}(${B.computeStrides(n).join(",")});`),M.join(`
`)},type:p,offsetToIndices:T,indicesToOffset:k,broadcastedIndicesToOffset:W,indices:O,indicesGet:z,indicesSet:G,set:(...M)=>{if(M.length!==d+1)throw new Error(`indices length must be ${d}`);let Z=M[d];if(typeof Z!="string")throw new Error("value must be string");let X=M.slice(0,d).map(h).join(",");return d===0?D("0u",Z):d===1?D(X[0],Z):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${X}, ${Z})`)},setByOffset:D,setByIndices:(M,Z)=>d<2?D(M,Z):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${M}, ${Z});`),get:F,getByOffset:Q,getByIndices:V,usage:o,name:e,strides:_,shape:x,rank:d}},j=(e,t,n,o=1)=>ti(e,t,n,"input",o),re=(e,t,n,o=1)=>ti(e,t,n,"output",o),Bv=(e,t,n)=>ti(e,t,n,"atomicOutput",1),Fl=(e,t,n,o=1)=>ti(e,t,n,"internal",o),lm=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=On){let t=typeof e=="number"?e:e[0],n=typeof e=="number"?1:e[1],o=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||n>this.limits.maxComputeWorkgroupSizeY||o>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${n}, ${o}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*n*o>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${n}, ${o}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let u=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,l=u?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,d=u?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*n*o}u + local_idx;`;return`@compute @workgroup_size(${t}, ${n}, ${o})
  fn main(${l}) {
    ${d}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let n=e.usage==="input"?"read":"read_write",o=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${n}> ${e.name}: array<${o}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,n=1){return this.uniforms.push({name:e,type:t,length:n}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:n,length:o}of this.uniforms)if(o&&o>4)n==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${n}>, ${Math.ceil(o/8)}>`):e.push(`${t}:array<vec4<${n}>, ${Math.ceil(o/4)}>`);else{let u=o==null||o===1?n:`vec${o}<${n}>`;e.push(`${t}:${u}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Mv=(e,t)=>new lm(e,t)}),dm,Pa,cm,pm,hm,fm,bt,Fv,jv,xr=R(()=>{"use strict";se(),ae(),Ue(),ue(),dm=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Pa=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),cm=(e,t)=>B.sortBasedOnPerm(e,Pa(e.length,t)),pm=(e,t,n,o)=>{let u=`fn perm(i: ${o.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`;for(let l=0;l<t;++l)u+=`a[${e[l]}]=i[${l}];`;return u+="return a;}"},hm=(e,t)=>{let n=[],o=[];for(let u=0;u<e.length;++u)e[u]!==1&&n.push(e[u]),e[t[u]]!==1&&o.push(t[u]);return{newShape:n,newPerm:o}},fm=(e,t)=>{let n=0;for(let o=0;o<e.length;++o)if(t[e[o]]!==1){if(e[o]<n)return!1;n=e[o]}return!0},bt=(e,t)=>{let n=e.dataType,o=e.dims.length,u=Pa(o,t),l=cm(e.dims,u),d=e.dims,c=l,s=o<2||fm(u,e.dims),r;if(s)return r=m=>{let b=j("input",n,d,4),x=re("output",n,c,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=B.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:r};let{newShape:i,newPerm:a}=hm(e.dims,u),p=B.areEqual(a,[2,3,1]),h=B.areEqual(a,[3,1,2]);if(i.length===2||p||h){d=p?[i[0],i[1]*i[2]]:h?[i[0]*i[1],i[2]]:i,c=[d[1],d[0]];let m=16;return r=b=>{let x=j("a",n,d.length),_=re("output",n,c.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(x,_)}
  var<workgroup> tile : array<array<${_.type.value}, ${m+1}>, ${m}>;
  ${b.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${x.getByIndices(`${x.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${_.setByIndices(`${_.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=B.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(c[1]/m),y:Math.ceil(c[0]/m)},programUniforms:[{type:12,data:b},...oe(d,c)]}},getShaderSource:r}}return r=m=>{let b=j("a",n,d.length),x=re("output",n,c.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}

  ${pm(u,o,b,x)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=B.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(d,c)]}},getShaderSource:r}},Fv=(e,t)=>{dm(e.inputs,t.perm),e.compute(bt(e.inputs[0],t.perm))},jv=e=>Se({perm:e.perm})}),mm,gm,bm,ym,_m,wm,vm,xm,$m,Tm,At,Lv,Vv,Uv,Gv,qv,Hv,Wv,Kv,Xv,Zv,aA=R(()=>{"use strict";se(),ae(),ue(),jl(),xr(),mm={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},gm={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},bm={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ym={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},_m=(e,t)=>{let n=[];for(let o=t-e;o<t;++o)n.push(o);return n},wm=(e,t)=>{let n=[],o=e.length;for(let l=0;l<o;l++)t.indexOf(l)===-1&&n.push(e[l]);let u=t.map(l=>e[l]);return[n,u]},vm=(e,t)=>{let n=e.length+t.length,o=[],u=0;for(let l=0;l<n;l++)t.indexOf(l)===-1?o.push(e[u++]):o.push(1);return o},xm=(e,t)=>{for(let n=0;n<e.length;++n)if(e[e.length-n-1]!==t-1-n)return!1;return!0},$m=(e,t)=>{let n=[];if(!xm(e,t)){for(let o=0;o<t;++o)e.indexOf(o)===-1&&n.push(o);e.forEach(o=>n.push(o))}return n},Tm=(e,t,n,o,u,l,d)=>{let c=n[0].dims,s=B.size(l),r=B.size(d),i=j("_A",n[0].dataType,c),a=re("output",u,l),p=64;s===1&&(p=256);let h=`
          var<workgroup> aBestValues : array<f32, ${p}>;
       `,m=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(i,a)}
        ${h}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(p)}

          let outputIndex = global_idx / ${p};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${bm[o]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${p}) {
           let candidate = f32(${i.getByOffset("offset + k")});
           bestValue = ${mm[o]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${p}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${gm[o]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${a.setByOffset("outputIndex",`${o==="mean"?`${a.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${a.type.storage}(${ym[o]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${p}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:l,dataType:u}],dispatchGroup:{x:s},programUniforms:[{type:12,data:r}]})}},At=(e,t,n,o)=>{let u=e.inputs.length===1?n:al(e.inputs,n),l=u.axes;l.length===0&&!u.noopWithEmptyAxes&&(l=e.inputs[0].dims.map((h,m)=>m));let d=B.normalizeAxes(l,e.inputs[0].dims.length),c=d,s=e.inputs[0],r=$m(c,e.inputs[0].dims.length);r.length>0&&(s=e.compute(bt(e.inputs[0],r),{inputs:[0],outputs:[-1]})[0],c=_m(c.length,s.dims.length));let[i,a]=wm(s.dims,c),p=i;u.keepDims&&(p=vm(i,d)),e.compute(Tm(t,u.cacheKey,[s],o,e.inputs[0].dataType,p,a),{inputs:[s]})},Lv=(e,t)=>{At(e,"ReduceMeanShared",t,"mean")},Vv=(e,t)=>{At(e,"ReduceL1Shared",t,"l1")},Uv=(e,t)=>{At(e,"ReduceL2Shared",t,"l2")},Gv=(e,t)=>{At(e,"ReduceLogSumExpShared",t,"logSumExp")},qv=(e,t)=>{At(e,"ReduceMaxShared",t,"max")},Hv=(e,t)=>{At(e,"ReduceMinShared",t,"min")},Wv=(e,t)=>{At(e,"ReduceProdShared",t,"prod")},Kv=(e,t)=>{At(e,"ReduceSumShared",t,"sum")},Xv=(e,t)=>{At(e,"ReduceSumSquareShared",t,"sumSquare")},Zv=(e,t)=>{At(e,"ReduceLogSumShared",t,"logSum")}}),Pt,Sm,Ao,al,kt,Im,Om,Em,Am,Pm,km,Cm,Dm,Rm,Nm,Ct,Jv,Yv,Qv,ex,tx,rx,nx,ix,ox,sx,jl=R(()=>{"use strict";se(),ae(),Ue(),ue(),aA(),Pt=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Sm=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Ao=(e,t,n,o,u,l,d=!1,c=!1)=>{let s=[],r=n[0].dims,i=r.length,a=B.normalizeAxes(u,i),p=!c&&a.length===0;r.forEach((b,x)=>{p||a.indexOf(x)>=0?d&&s.push(1):s.push(b)});let h=s.length,m=B.size(s);return{name:e,shaderCache:t,getShaderSource:b=>{let x=[],_=j("_A",n[0].dataType,i),y=re("output",l,h),S=o(_,y,a),T=S[2];for(let I=0,A=0;I<i;I++)p||a.indexOf(I)>=0?(d&&A++,T=`for(var j${I}: u32 = 0; j${I} < ${r[I]}; j${I}++) {
                  ${S[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${_.indicesSet("input_indices",I,`j${I}`)}
                  ${T}
                }`):(x.push(`${_.indicesSet("input_indices",I,y.indicesGet("output_indices",A))};`),A++);return`

        ${b.registerUniform("output_size","u32").declareVariables(_,y)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${_.type.indices};
          let output_indices = ${y.offsetToIndices("global_idx")};

          ${x.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${T}
          ${S[3]}
          ${S.length===4?y.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:s,dataType:l}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(r,s)]})}},al=(e,t)=>{let n=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(o=>n.push(Number(o))),Se({axes:n,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},kt=(e,t,n,o)=>{let u=e.inputs,l=u.length===1?n:al(u,n);e.compute(Ao(t,{hint:l.cacheKey,inputDependencies:["rank"]},[u[0]],l.noopWithEmptyAxes&&l.axes.length===0?Sm:o,l.axes,u[0].dataType,l.keepDims,l.noopWithEmptyAxes),{inputs:[0]})},Im=(e,t)=>{Pt(e.inputs),kt(e,"ReduceLogSum",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${n.getByIndices("input_indices")};`,"value = log(value);"])},Om=(e,t)=>{Pt(e.inputs),kt(e,"ReduceL1",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += abs(${n.getByIndices("input_indices")});`,""])},Em=(e,t)=>{Pt(e.inputs),kt(e,"ReduceL2",t,(n,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${n.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Am=(e,t)=>{Pt(e.inputs),kt(e,"ReduceLogSumExp",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += exp(${n.getByIndices("input_indices")});`,"value = log(value);"])},Pm=(e,t)=>{Pt(e.inputs),kt(e,"ReduceMax",t,(n,o,u)=>{let l=[];for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(n.indicesSet("input_indices",d,0));return[`${l.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};`,`value = max(value, ${n.getByIndices("input_indices")});`,""]})},km=(e,t)=>{Pt(e.inputs),kt(e,"ReduceMean",t,(n,o,u)=>{let l=1;for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&(l*=e.inputs[0].dims[d]);return["var sum = f32(0);","",`sum += f32(${n.getByIndices("input_indices")});`,`let value = ${o.type.value}(sum / ${l});`]})},Cm=(e,t)=>{Pt(e.inputs),kt(e,"ReduceMin",t,(n,o,u)=>{let l=[];for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`input_indices[${d}] = 0;`);return[`${l.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};`,`value = min(value, ${n.getByIndices("input_indices")});`,""]})},Dm=(e,t)=>{Pt(e.inputs),kt(e,"ReduceProd",t,(n,o)=>[`var value = ${o.type.storage}(1);`,"",`value *= ${n.getByIndices("input_indices")};`,""])},Rm=(e,t)=>{Pt(e.inputs),kt(e,"ReduceSum",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${n.getByIndices("input_indices")};`,""])},Nm=(e,t)=>{Pt(e.inputs),kt(e,"ReduceSumSquare",t,(n,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${n.getByIndices("input_indices")}; value += t * t;`,""])},Ct=(e,t,n)=>{if(t.length===0)return n;let o=1,u=1;for(let l=0;l<t.length;l++)t.indexOf(l)===-1?o*=e[l]:u*=e[l];return u<32&&o>1024},Jv=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?km(e,t):Lv(e,t)},Yv=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Om(e,t):Vv(e,t)},Qv=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Em(e,t):Uv(e,t)},ex=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Am(e,t):Gv(e,t)},tx=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Pm(e,t):qv(e,t)},rx=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cm(e,t):Hv(e,t)},nx=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Dm(e,t):Wv(e,t)},ix=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Rm(e,t):Kv(e,t)},ox=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Nm(e,t):Xv(e,t)},sx=(e,t)=>{Ct(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Im(e,t):Zv(e,t)}}),ka,ax,ux,ul,uA=R(()=>{"use strict";se(),Ue(),jl(),ka=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},ax=(e,t)=>{ka(e.inputs);let n=(o,u,l)=>{let d=[];for(let c=0;c<o.rank;c++)(l.indexOf(c)>=0||l.length===0)&&d.push(`input_indices[${c}] = 0;`);return[`${d.join(`
`)}`,`var value = ${o.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${o.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${o.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",u.setByOffset("global_idx","best_index")]};e.compute(Ao("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},ux=(e,t)=>{ka(e.inputs);let n=(o,u,l)=>{let d=[];for(let c=0;c<o.rank;c++)(l.indexOf(c)>=0||l.length===0)&&d.push(`input_indices[${c}] = 0;`);return[`${d.join(`
`)}`,`var value = ${o.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${o.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${o.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",u.setByOffset("global_idx","best_index")]};e.compute(Ao("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},ul=e=>Se(e)}),zm,uo,Bm,Mm,Fm,Si,jm,lx,Ll=R(()=>{"use strict";se(),ae(),Ml(),ue(),zm=(e,t)=>{let n=e[0],o=e[1],u=e[2],l=e[3],d=e[4],c=e[5];if(d&&c)throw new Error("Attention cannot have both past and attention_bias");if(n.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let s=n.dims[0],r=n.dims[1],i=n.dims[2];if(u.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(o.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(o.dims[0]!==i)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(u.dims[0]!==o.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let a=u.dims[0]/3,p=a,h=p;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");a=t.qkvHiddenSizes[0],p=t.qkvHiddenSizes[1],h=t.qkvHiddenSizes[2]}let m=r;if(a!==p)throw new Error("qkv_hidden_sizes first element should be same as the second");if(u.dims[0]!==a+p+h)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(d){if(p!==h)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(d.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(d.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(d.dims[1]!==s)throw new Error('Input "past" second dimension must be batch_size');if(d.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(d.dims[4]!==p/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=d.dims[3])}let x=m+b,_=-1,y=0;if(l)throw new Error("Mask not supported");if(d)throw new Error("past is not supported");if(c){if(c.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(c.dims[0]!==s||c.dims[1]!==t.numHeads||c.dims[2]!==r||c.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:s,sequenceLength:r,pastSequenceLength:b,kvSequenceLength:m,totalSequenceLength:x,maxSequenceLength:_,inputHiddenSize:i,hiddenSize:a,vHiddenSize:h,headSize:Math.floor(a/t.numHeads),vHeadSize:Math.floor(h/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},uo=(e,t,n)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${n?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,Bm=(e,t,n,o,u,l,d,c)=>{let s=Ve(d?1:l),r=64,i=l/s;i<r&&(r=32);let a=Math.ceil(l/s/r),p=[{type:12,data:t},{type:12,data:n},{type:12,data:o},{type:12,data:u},{type:12,data:i},{type:12,data:a}],h=Ye(e.dataType,s),m=Je(1,s),b=["type"];d&&b.push("type"),c&&b.push("type");let x=_=>{let y=re("x",e.dataType,e.dims,s),S=[y],T=d?j("seq_lens",d.dataType,d.dims):void 0;T&&S.push(T);let I=c?j("total_sequence_length_input",c.dataType,c.dims):void 0;I&&S.push(I);let A=Je(e.dataType),k=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${r}>;
  var<workgroup> thread_sum: array<f32, ${r}>;
  ${_.registerUniforms(k).declareVariables(...S)}
  ${_.mainStart([r,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${uo(T,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${r}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${d?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${m}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${m}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(s){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${s}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${r}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${m}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${m}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(s){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${s}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${r}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${y.type.value}(${A}(1.0) / ${A}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${y.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${d?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${y.type.value}(${A}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${r};${h};${s}`,inputDependencies:b},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:u,z:t*n},programUniforms:p})}},Mm=(e,t,n,o,u,l,d,c,s)=>{let r=d+l.kvSequenceLength,i=[l.batchSize,l.numHeads,l.sequenceLength,r],a=e>1&&o,p=l.kvNumHeads?l.kvNumHeads:l.numHeads,h=a?[l.batchSize,p,r,l.headSize]:void 0,m=l.nReps?l.nReps:1,b=l.scale===0?1/Math.sqrt(l.headSize):l.scale,x=Ve(l.headSize),_=l.headSize/x,y=12,S={x:Math.ceil(r/y),y:Math.ceil(l.sequenceLength/y),z:l.batchSize*l.numHeads},T=[{type:12,data:l.sequenceLength},{type:12,data:_},{type:12,data:r},{type:12,data:l.numHeads},{type:12,data:l.headSize},{type:1,data:b},{type:12,data:d},{type:12,data:l.kvSequenceLength},{type:12,data:m}],I=a&&o&&B.size(o.dims)>0,A=["type","type"];I&&A.push("type"),u&&A.push("type"),c&&A.push("type"),s&&A.push("type");let k=[{dims:i,dataType:t.dataType,gpuDataType:0}];a&&k.push({dims:h,dataType:t.dataType,gpuDataType:0});let O=z=>{let G=j("q",t.dataType,t.dims,x),Y=j("key",n.dataType,n.dims,x),W=[G,Y];if(I){let U=j("past_key",o.dataType,o.dims,x);W.push(U)}u&&W.push(j("attention_bias",u.dataType,u.dims));let D=c?j("seq_lens",c.dataType,c.dims):void 0;D&&W.push(D);let Q=s?j("total_sequence_length_input",s.dataType,s.dims):void 0;Q&&W.push(Q);let w=re("output",t.dataType,i),C=[w];a&&C.push(re("present_key",t.dataType,h,x));let F=Je(1,x),V=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;

  var<workgroup> tileQ: array<${G.type.storage}, ${y*y}>;
  var<workgroup> tileK: array<${G.type.storage}, ${y*y}>;
  ${z.registerUniforms(V).declareVariables(...W,...C)}
  ${z.mainStart([y,y,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${uo(D,Q,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&a?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${a?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${F}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${I&&a?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${a?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${F}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(x){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${x}`)}})()};
        output[outputIdx] = ${w.type.value} (sum * uniforms.alpha) + ${u?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${u!==void 0};${o!==void 0};${e}`,inputDependencies:A},getRunData:()=>({outputs:k,dispatchGroup:S,programUniforms:T}),getShaderSource:O}},Fm=(e,t,n,o,u,l,d=void 0,c=void 0)=>{let s=l+u.kvSequenceLength,r=u.nReps?u.nReps:1,i=u.vHiddenSize*r,a=e>1&&o,p=u.kvNumHeads?u.kvNumHeads:u.numHeads,h=a?[u.batchSize,p,s,u.headSize]:void 0,m=[u.batchSize,u.sequenceLength,i],b=12,x={x:Math.ceil(u.vHeadSize/b),y:Math.ceil(u.sequenceLength/b),z:u.batchSize*u.numHeads},_=[{type:12,data:u.sequenceLength},{type:12,data:s},{type:12,data:u.vHeadSize},{type:12,data:u.numHeads},{type:12,data:u.headSize},{type:12,data:i},{type:12,data:l},{type:12,data:u.kvSequenceLength},{type:12,data:r}],y=a&&o&&B.size(o.dims)>0,S=["type","type"];y&&S.push("type"),d&&S.push("type"),c&&S.push("type");let T=[{dims:m,dataType:t.dataType,gpuDataType:0}];a&&T.push({dims:h,dataType:t.dataType,gpuDataType:0});let I=A=>{let k=j("probs",t.dataType,t.dims),O=j("v",n.dataType,n.dims),z=[k,O];y&&z.push(j("past_value",o.dataType,o.dims));let G=d?j("seq_lens",d.dataType,d.dims):void 0;d&&z.push(G);let Y=c?j("total_sequence_length_input",c.dataType,c.dims):void 0;c&&z.push(Y);let W=[re("output",t.dataType,m)];a&&W.push(re("present_value",t.dataType,h));let D=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${k.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${k.type.value}, ${b*b}>;
  ${A.registerUniforms(D).declareVariables(...z,...W)}
  ${A.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${r===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${r===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${uo(G,Y,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${y&&a?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${a?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${k.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${y&&a?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${a?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${o!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:T,dispatchGroup:x,programUniforms:_}),getShaderSource:I}},Si=(e,t,n,o,u,l,d,c,s,r,i=void 0,a=void 0)=>{let p=Math.min(e.outputCount,1+(d?1:0)+(c?1:0)),h=p>1?d:void 0,m=p>1?c:void 0,b=p>1?r.pastSequenceLength:0,x=b+r.kvSequenceLength,_=s&&B.size(s.dims)>0?s:void 0,y=[t,n];h&&B.size(h.dims)>0&&y.push(h),_&&y.push(_),i&&y.push(i),a&&y.push(a);let S=e.compute(Mm(p,t,n,h,_,r,b,i,a),{inputs:y,outputs:p>1?[-1,1]:[-1]})[0];e.compute(Bm(S,r.batchSize,r.numHeads,b,r.sequenceLength,x,i,a),{inputs:i&&a?[S,i,a]:[S],outputs:[]});let T=[S,o];m&&B.size(m.dims)>0&&T.push(m),i&&T.push(i),a&&T.push(a),e.compute(Fm(p,S,o,m,r,b,i,a),{inputs:T,outputs:p>1?[0,2]:[0]})},jm=(e,t)=>{let n=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],o=t.sequenceLength,u=t.inputHiddenSize,l=t.headSize,d=12,c={x:Math.ceil(t.headSize/d),y:Math.ceil(t.sequenceLength/d),z:t.batchSize*t.numHeads},s=[e.inputs[0],e.inputs[1],e.inputs[2]],r=[{type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],i=a=>{let p=re("output_q",s[0].dataType,n),h=re("output_k",s[0].dataType,n),m=re("output_v",s[0].dataType,n),b=j("input",s[0].dataType,s[0].dims),x=j("weight",s[1].dataType,s[1].dims),_=j("bias",s[2].dataType,s[2].dims),y=b.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${d}u;
  var<workgroup> tileInput: array<${y}, ${d*d}>;
  var<workgroup> tileWeightQ: array<${y}, ${d*d}>;
  var<workgroup> tileWeightK: array<${y}, ${d*d}>;
  var<workgroup> tileWeightV: array<${y}, ${d*d}>;
  ${a.registerUniforms(S).declareVariables(b,x,_,p,h,m)}
  ${a.mainStart([d,d,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${y}(0);
    var valueK = ${y}(0);
    var valueV = ${y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:c,programUniforms:r}),getShaderSource:i},{inputs:s,outputs:[-1,-1,-1]})},lx=(e,t)=>{let n=zm(e.inputs,t),[o,u,l]=jm(e,n);return Si(e,o,u,l,e.inputs[4],void 0,void 0,void 0,e.inputs[5],n)}}),Lm,Vm,Um,dx,lA=R(()=>{"use strict";ot(),se(),ae(),Ue(),ue(),Lm=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let n=(o,u,l)=>{let d=u.length;if(d!==o.length)throw new Error(`${l}: num dimensions != ${d}`);u.forEach((c,s)=>{if(c!==o[s])throw new Error(`${l}: dim[${s}] do not match`)})};if(e[0].dims.length>1){let o=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);n(e[1].dims,o,"Invalid input scale"),n(e[2].dims,o,"Invalid input B"),n(e[3].dims,o,"Invalid input mean"),n(e[4].dims,o,"Invalid input var")}else n(e[1].dims,[1],"Invalid input scale"),n(e[2].dims,[1],"Invalid input B"),n(e[3].dims,[1],"Invalid input mean"),n(e[4].dims,[1],"Invalid input var")},Vm=(e,t)=>{let{epsilon:n,spatial:o,format:u}=t,l=e[0].dims,d=o?Ve(l[l.length-1]):1,c=u==="NHWC"&&l.length>1?d:1,s=B.size(l)/d,r=o,i=r?l.length:l,a=j("x",e[0].dataType,e[0].dims,d),p=j("scale",e[1].dataType,e[1].dims,c),h=j("bias",e[2].dataType,e[2].dims,c),m=j("inputMean",e[3].dataType,e[3].dims,c),b=j("inputVar",e[4].dataType,e[4].dims,c),x=re("y",e[0].dataType,i,d),_=()=>{let S="";if(o)S=`let cOffset = ${l.length===1?"0u":u==="NHWC"?`outputIndices[${l.length-1}] / ${d}`:"outputIndices[1]"};`;else if(u==="NCHW")S=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${p.type.indices}(0);
                       cIndices[0] = outputIndices[${l.length-1}];`;for(let T=1;T<p.rank;T++)S+=`cIndices[${T}] = outputIndices[${T}];`;S+=`let cOffset = ${p.indicesToOffset("cIndices")};`}return S},y=S=>`
  const epsilon = ${n};
  ${S.registerUniform("outputSize","u32").declareVariables(a,p,h,m,b,x)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${d}`)};
    ${_()}
    let scale = ${p.getByOffset("cOffset")};
    let bias = ${h.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${a.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${o}_${d}`,inputDependencies:r?["rank","type","type","type","type"]:void 0},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:r?[{type:12,data:s},...oe(l)]:[{type:12,data:s}]})}},Um=e=>Se(e),dx=(e,t)=>{let{inputs:n,outputCount:o}=e,u=Um({...t,outputCount:o});if(le.webgpu.validateInputContent&&Lm(n,u),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Vm(n,u))}}),Gm,qm,cx,dA=R(()=>{"use strict";ae(),ue(),Gm=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},qm=e=>{let t=e[0].dims,n=e[0].dims[2],o=B.size(t)/4,u=e[0].dataType,l=j("input",u,t,4),d=j("bias",u,[n],4),c=j("residual",u,t,4),s=re("output",u,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)}}),getShaderSource:r=>`
  const channels = ${n}u / 4;
  ${r.declareVariables(l,d,c,s)}

  ${r.mainStart()}
    ${r.guardAgainstOutOfBoundsWorkgroupSizes(o)}
    let value = ${l.getByOffset("global_idx")}
      + ${d.getByOffset("global_idx % channels")} + ${c.getByOffset("global_idx")};
    ${s.setByOffset("global_idx","value")}
  }`}},cx=e=>{Gm(e.inputs),e.compute(qm(e.inputs))}}),Hm,$e,px,hx,fx,mx,gx,bx,yx,_x,wx,Wm,vx,xx,$x,Tx,mi,Sx,wo,Ix,Ox,Ex,Ax,Px,kx,Cx,Dx,Rx,Nx,zx,Bx,Mx,Fx,jx,Lx,Vx,Ca,Ux,ll,dl,Gx,qx,Hx,Km,Xm,Wx,Vl=R(()=>{"use strict";se(),ae(),Ue(),ue(),Hm=(e,t,n,o,u,l,d)=>{let c=Math.ceil(t/4),s="";typeof u=="string"?s=`${u}(a)`:s=u("a");let r=j("inputData",n,[c],4),i=re("outputData",o,[c],4),a=[{name:"vec_size",type:"u32"}];return d&&a.push(...d),`
      ${e.registerUniforms(a).declareVariables(r,i)}

  ${l??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${r.getByOffset("global_idx")};
    ${i.setByOffset("global_idx",s)}
  }`},$e=(e,t,n,o,u,l=e.dataType,d,c)=>{let s=[{type:12,data:Math.ceil(B.size(e.dims)/4)}];return d&&s.push(...d),{name:t,shaderCache:{hint:u,inputDependencies:["type"]},getShaderSource:r=>Hm(r,B.size(e.dims),e.dataType,l,n,o,c),getRunData:r=>({outputs:[{dims:e.dims,dataType:l}],dispatchGroup:{x:Math.ceil(B.size(r[0].dims)/64/4)},programUniforms:s})}},px=e=>{e.compute($e(e.inputs[0],"Abs","abs"))},hx=e=>{e.compute($e(e.inputs[0],"Acos","acos"))},fx=e=>{e.compute($e(e.inputs[0],"Acosh","acosh"))},mx=e=>{e.compute($e(e.inputs[0],"Asin","asin"))},gx=e=>{e.compute($e(e.inputs[0],"Asinh","asinh"))},bx=e=>{e.compute($e(e.inputs[0],"Atan","atan"))},yx=e=>{e.compute($e(e.inputs[0],"Atanh","atanh"))},_x=e=>Se(e),wx=(e,t)=>{let n;switch(t.to){case 10:n="vec4<f16>";break;case 1:n="vec4<f32>";break;case 12:n="vec4<u32>";break;case 6:n="vec4<i32>";break;case 9:n="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute($e(e.inputs[0],"Cast",n,void 0,t.cacheKey,t.to))},Wm=e=>{let t,n,o=e.length>=2&&e[1].data!==0,u=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=o?e[1].getFloat32Array()[0]:-34028234663852886e22,n=u?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=o?e[1].getUint16Array()[0]:64511,n=u?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Se({min:t,max:n})},vx=(e,t)=>{let n=t||Wm(e.inputs),o=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"Clip",u=>`clamp(${u}, vec4<${o}>(uniforms.min), vec4<${o}>(uniforms.max))`,void 0,n.cacheKey,void 0,[{type:e.inputs[0].dataType,data:n.min},{type:e.inputs[0].dataType,data:n.max}],[{name:"min",type:o},{name:"max",type:o}]),{inputs:[0]})},xx=e=>{e.compute($e(e.inputs[0],"Ceil","ceil"))},$x=e=>{e.compute($e(e.inputs[0],"Cos","cos"))},Tx=e=>{e.compute($e(e.inputs[0],"Cosh","cosh"))},mi=e=>Se(e),Sx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"Elu",o=>`elu_vf32(${o})`,`
  const elu_alpha_ = ${n}(${t.alpha});

  fn elu_f32(a: ${n}) -> ${n} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${n}>) -> vec4<${n}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},wo=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,Ix=e=>{let t=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"Erf",n=>`erf_vf32(${n})`,wo(t)))},Ox=e=>{e.compute($e(e.inputs[0],"Exp","exp"))},Ex=e=>{e.compute($e(e.inputs[0],"Floor","floor"))},Ax=e=>{let t=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"Gelu",n=>`0.5 * ${n} * (1.0 + erf_vf32(${n} * 0.7071067811865475))`,wo(t)))},Px=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"LeakyRelu",o=>`select(leaky_relu_alpha_ * ${o}, ${o}, ${o} >= vec4<${n}>(0.0))`,`const leaky_relu_alpha_ = ${n}(${t.alpha});`,t.cacheKey))},kx=e=>{e.compute($e(e.inputs[0],"Not",t=>`!${t}`))},Cx=e=>{e.compute($e(e.inputs[0],"Neg",t=>`-${t}`))},Dx=e=>{e.compute($e(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Rx=e=>{let t=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"Relu",n=>`select(vec4<${t}>(0.0), ${n}, ${n} > vec4<${t}>(0.0))`))},Nx=e=>{e.compute($e(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},zx=e=>Se(e),Bx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"HardSigmoid",o=>`max(vec4<${n}>(0.0), min(vec4<${n}>(1.0), ${t.alpha} * ${o} + vec4<${n}>(${t.beta})))`,void 0,t.cacheKey))},Mx=e=>{let t=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"HardSwish",n=>`${n} * max(vec4<${t}>(0.0), min(vec4<${t}>(1.0), vec4<${t}>(${t}(1.0 / 6.0)) * ${n} + vec4<${t}>(0.5)))`))},Fx=e=>{e.compute($e(e.inputs[0],"Sin","sin"))},jx=e=>{e.compute($e(e.inputs[0],"Sinh","sinh"))},Lx=e=>{e.compute($e(e.inputs[0],"Sqrt","sqrt"))},Vx=e=>{e.compute($e(e.inputs[0],"Tan","tan"))},Ca=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Ux=e=>{e.compute($e(e.inputs[0],"Tanh",Ca))},ll=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ca("v")};
}
`,dl=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Gx=e=>{let t=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"FastGelu",dl,ll(t),void 0,e.inputs[0].dataType))},qx=(e,t)=>{let n=Je(e.inputs[0].dataType);return e.compute($e(e.inputs[0],"ThresholdedRelu",o=>`select(vec4<${n}>(0.0), ${o}, ${o} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${n}>(${t.alpha});`,t.cacheKey)),0},Hx=e=>{e.compute($e(e.inputs[0],"Log","log"))},Km=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Xm=e=>`quick_gelu_impl(${e})`,Wx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute($e(e.inputs[0],"QuickGelu",Xm,Km(n,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Zm,Jm,Kx,cA=R(()=>{"use strict";ae(),ue(),Vl(),Zm=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Jm=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let n=j("input",e[0].dataType,e[0].dims,4),o=j("bias",e[0].dataType,[e[0].dims[2]],4),u=re("output",e[0].dataType,t,4),l=B.size(t)/4,d=Ye(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)}}),getShaderSource:c=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${c.declareVariables(n,o,u)}

  ${wo(d)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes(l)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${u.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Kx=e=>{Zm(e.inputs),e.compute(Jm(e.inputs))}}),Ym,Qm,Dt,Xx,Zx,Jx,Yx,Qx,e1,t1,r1,n1,i1,pA=R(()=>{"use strict";se(),ae(),ue(),Ym=(e,t,n,o,u,l,d,c,s,r,i,a)=>{let p,h;typeof c=="string"?p=h=(y,S)=>`${c}((${y}),(${S}))`:typeof c=="function"?p=h=c:(p=c.scalar,h=c.vector);let m=re("outputData",i,o.length,4),b=j("aData",s,t.length,4),x=j("bData",r,n.length,4),_;if(u)if(l){let y=B.size(t)===1,S=B.size(n)===1,T=t.length>0&&t[t.length-1]%4===0,I=n.length>0&&n[n.length-1]%4===0;y||S?_=m.setByOffset("global_idx",h(y?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),S?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):_=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",h(d||T?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,d||I?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else _=m.setByOffset("global_idx",h(b.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!l)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let y=(S,T,I="")=>{let A=`aData[indexA${T}][componentA${T}]`,k=`bData[indexB${T}][componentB${T}]`;return`
            let outputIndices${T} = ${m.offsetToIndices(`global_idx * 4u + ${T}u`)};
            let offsetA${T} = ${b.broadcastedIndicesToOffset(`outputIndices${T}`,m)};
            let offsetB${T} = ${x.broadcastedIndicesToOffset(`outputIndices${T}`,m)};
            let indexA${T} = offsetA${T} / 4u;
            let indexB${T} = offsetB${T} / 4u;
            let componentA${T} = offsetA${T} % 4u;
            let componentB${T} = offsetB${T} % 4u;
            ${S}[${T}] = ${I}(${p(A,k)});
          `};i===9?_=`
            var data = vec4<u32>(0);
            ${y("data",0,"u32")}
            ${y("data",1,"u32")}
            ${y("data",2,"u32")}
            ${y("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:_=`
            ${y("outputData[global_idx]",0)}
            ${y("outputData[global_idx]",1)}
            ${y("outputData[global_idx]",2)}
            ${y("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(b,x,m)}

        ${a??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${_}
      }`},Qm=(e,t,n,o,u,l,d=n.dataType)=>{let c=n.dims.map(Number),s=o.dims.map(Number),r=!B.areEqual(c,s),i=c,a=B.size(c),p=!1,h=!1,m=[r];if(r){let b=In.calcShape(c,s,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");i=b.slice(),a=B.size(i);let x=B.size(c)===1,_=B.size(s)===1,y=c.length>0&&c[c.length-1]%4===0,S=s.length>0&&s[s.length-1]%4===0;m.push(x),m.push(_),m.push(y),m.push(S);let T=1;for(let I=1;I<i.length;I++){let A=c[c.length-I],k=s[s.length-I];if(A===k)T*=A;else break}T%4===0?(h=!0,p=!0):(x||_||y||S)&&(p=!0)}else p=!0;return m.push(p),{name:e,shaderCache:{hint:t+m.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>Ym(b,c,s,i,p,r,h,u,n.dataType,o.dataType,d,l),getRunData:()=>({outputs:[{dims:i,dataType:d}],dispatchGroup:{x:Math.ceil(a/64/4)},programUniforms:[{type:12,data:Math.ceil(B.size(i)/4)},...oe(c,s,i)]})}},Dt=(e,t,n,o,u,l)=>{e.compute(Qm(t,u??"",e.inputs[0],e.inputs[1],n,o,l))},Xx=e=>{Dt(e,"Add",(t,n)=>`${t}+${n}`)},Zx=e=>{Dt(e,"Div",(t,n)=>`${t}/${n}`)},Jx=e=>{Dt(e,"Equal",{scalar:(t,n)=>`u32(${t}==${n})`,vector:(t,n)=>`vec4<u32>(${t}==${n})`},void 0,void 0,9)},Yx=e=>{Dt(e,"Mul",(t,n)=>`${t}*${n}`)},Qx=e=>{let t=j("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Dt(e,"Pow",{scalar:(n,o)=>`pow_custom(${n},${o})`,vector:(n,o)=>`pow_vector_custom(${n},${o})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},e1=e=>{Dt(e,"Sub",(t,n)=>`${t}-${n}`)},t1=e=>{Dt(e,"Greater",{scalar:(t,n)=>`u32(${t}>${n})`,vector:(t,n)=>`vec4<u32>(${t}>${n})`},void 0,void 0,9)},r1=e=>{Dt(e,"Less",{scalar:(t,n)=>`u32(${t}<${n})`,vector:(t,n)=>`vec4<u32>(${t}<${n})`},void 0,void 0,9)},n1=e=>{Dt(e,"GreaterOrEqual",{scalar:(t,n)=>`u32(${t}>=${n})`,vector:(t,n)=>`vec4<u32>(${t}>=${n})`},void 0,void 0,9)},i1=e=>{Dt(e,"LessOrEqual",{scalar:(t,n)=>`u32(${t}<=${n})`,vector:(t,n)=>`vec4<u32>(${t}<=${n})`},void 0,void 0,9)}}),eg,tg,rg,ng,o1,s1,hA=R(()=>{"use strict";se(),ae(),Ue(),ue(),eg=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let n=0,o=e[n],u=o.dataType,l=o.dims.length;e.forEach((d,c)=>{if(c!==n){if(d.dataType!==u)throw new Error("input tensors should be one type");if(d.dims.length!==l)throw new Error("input tensors should have the same shape");d.dims.forEach((s,r)=>{if(r!==t&&s!==o.dims[r])throw new Error("non concat dimensions must match")})}})},tg=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,rg=(e,t)=>{let n=e.length,o=[];for(let u=0;u<n;++u){let l=t.setByOffset("global_idx",e[u].getByIndices("indices"));n===1?o.push(l):u===0?o.push(`if (inputIndex == ${u}u) { ${l} }`):u===n-1?o.push(`else { ${l} }`):o.push(`else if (inputIndex == ${u}) { ${l} }`)}return o.join(`
`)},ng=(e,t,n,o)=>{let u=B.size(n),l=new Array(e.length),d=new Array(e.length),c=0,s=[],r=[],i=[{type:12,data:u}];for(let b=0;b<e.length;++b)c+=e[b].dims[t],l[b]=c,r.push(e[b].dims.length),d[b]=j(`input${b}`,o,r[b]),s.push("rank"),i.push({type:12,data:l[b]});for(let b=0;b<e.length;++b)i.push(...oe(e[b].dims));i.push(...oe(n));let a=re("output",o,n.length),p=a.indicesGet("indices",t),h=Array.from(Array(l.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),m=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)b.registerUniform(`sizeInConcatAxis${x}`,"u32");return b.declareVariables(...d,a)})()}

  ${tg(l.length,h)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${a.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${p});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${l.length}u>(${h});
      ${p} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${rg(d,a)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:s},getRunData:()=>({outputs:[{dims:n,dataType:o}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:i}),getShaderSource:m}},o1=(e,t)=>{let n=e.inputs,o=n[0].dims,u=B.normalizeAxis(t.axis,o.length);eg(n,u);let l=o.slice();l[u]=n.reduce((c,s)=>c+(s.dims.length>u?s.dims[u]:0),0);let d=n.filter(c=>B.size(c.dims)>0);e.compute(ng(d,u,l,n[0].dataType),{inputs:d})},s1=e=>Se({axis:e.axis})}),on,sn,an,Ul,cn=R(()=>{"use strict";se(),ae(),on=(e,t,n="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${n}(uniforms.clip_min)), ${t}(${n}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${n}(uniforms.alpha) * value + ${n}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${n}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},sn=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},an=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ul=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[n,o]=e?.activation_params||[.2,.5];return{activation:t,alpha:n,beta:o}}else if(t==="Clip"){let[n,o]=e?.activation_params||[kv,Cv];return{activation:t,clipMax:o,clipMin:n}}else if(t==="LeakyRelu"){let[n]=e?.activation_params||[.01];return{activation:t,alpha:n}}return{activation:t}}}),tt,a1,Gl=R(()=>{"use strict";tt=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},a1=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),u1,fA=R(()=>{"use strict";u1=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),vi,ql,Hl=R(()=>{"use strict";se(),ae(),ue(),cn(),vi=(e,t,n,o,u)=>{let l=o-n;return`
      ${Array.from({length:n}).map((d,c)=>`
      if (${ne(t.shape,c,t.rank)} != 1) {
        ${t.indicesSet(e,c,ne(u,c+l,o))}
      } else {
        ${t.indicesSet(e,c,0)}
      }`).join("")}
`},ql=(e,t,n,o,u=!1,l)=>{let d=e[0].dims,c=e[1].dims,s=d[d.length-2],r=c[c.length-1],i=d[d.length-1],a=Ve(r),p=Ve(i),h=Ve(s),m=B.size(n)/a/h,b=e.length>2,x=o?o.slice(0,-2):n.slice(0,-2),_=[B.size(x),s,r],y=[{type:12,data:m},{type:12,data:s},{type:12,data:r},{type:12,data:i}];sn(t,y),y.push(...oe(x,d,c)),b&&y.push(...oe(e[2].dims)),y.push(...oe(_));let S=T=>{let I=Fl("batch_dims",e[0].dataType,x.length),A=j("a",e[0].dataType,d.length,p),k=j("b",e[1].dataType,c.length,a),O=re("output",e[0].dataType,_.length,a),z=Ye(O.type.tensor),G=on(t,O.type.value,z),Y=[A,k],W="";if(b){let w=u?a:1;Y.push(j("bias",e[2].dataType,e[2].dims.length,w)),W=`${u?`value += bias[col / ${w}];`:`value += ${O.type.value}(bias[row + i]);`}`}let D=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];an(t,D);let Q=()=>{let w=`var a_data: ${A.type.value};`;for(let C=0;C<p;C++)w+=`
              let b_data${C} = b[(b_offset + (k + ${C}) * uniforms.N + col) / ${a}];`;for(let C=0;C<h;C++){w+=`a_data = a[(a_offset + (row + ${C}) * uniforms.K + k) / ${p}];`;for(let F=0;F<p;F++)w+=`
            values[${C}] = fma(${k.type.value}(a_data${p===1?"":`[${F}]`}), b_data${F}, values[${C}]);
`}return w};return`
  ${T.registerUniforms(D).registerInternalVariables(I).declareVariables(...Y,O)}
  ${T.mainStart()}
    ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${a})) * ${a};
    var index1 = global_idx / (uniforms.N / ${a});
    let stride1 = uniforms.M / ${h};
    let row = (index1 % stride1) * ${h};
    let batch = index1 / stride1;

    ${n.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${A.type.indices};
    ${vi("a_indices",A,A.rank-2,I.rank,"batch_indices")}
    ${A.indicesSet("a_indices",A.rank-2,0)}
    ${A.indicesSet("a_indices",A.rank-1,0)}
    let a_offset = ${A.indicesToOffset("a_indices")};

    var b_indices: ${k.type.indices};
    ${vi("b_indices",k,k.rank-2,I.rank,"batch_indices")}
    ${k.indicesSet("b_indices",k.rank-2,0)}
    ${k.indicesSet("b_indices",k.rank-1,0)}
    let b_offset = ${k.indicesToOffset("b_indices")};
    var values: array<${O.type.value}, ${h}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${p}) {
      ${Q()}
    }
    for (var i = 0u; i < ${h}u; i++) {
      var value = values[i];
      ${W}
      ${G}
      let cur_indices = ${O.type.indices}(batch, row + i, col);
      let offset = ${O.indicesToOffset("cur_indices")};
      ${O.setByOffset(`offset / ${a}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${a};${p};${h};${u}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:l?l(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:y}),getShaderSource:S}}}),ig,og,cl,Da,sg,pl,ag,Po,Wl=R(()=>{"use strict";se(),ae(),ue(),cn(),Hl(),Gl(),ig=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,og=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,cl=(e,t,n="f32",o,u=!1,l=32,d=!1,c=32)=>{let s=t[1]*e[1],r=t[0]*e[0],i=u?s:l,a=u?l:s,p=i/t[0],h=l/t[1];if(!((u&&p===4&&e[1]===4||!u&&(p===3||p===4))&&i%t[0]===0&&l%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${u} is true, innerElementSize ${p} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${p} must be 3 or 4.
  tileAWidth ${i} must be divisible by workgroupSize[0]${t[0]}. tileInner ${l} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${p}<${n}>, ${i/p}>, ${a}>;
var<workgroup> mm_Bsub: array<array<vec4<${n}>, ${r/e[0]}>, ${l}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${p};
const tileInner = ${l};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${d?"0":"i32(globalId.z)"};
  ${o?`let batchIndices = ${o.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${s};

  let num_tiles = ${d?`${Math.ceil(c/l)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${d?`i32(globalId.z) * ${c}`:"0"};

  var acc: array<vec4<${n}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${h};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${ig(u,o)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${h}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${o?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${p===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${og(u,p)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Da=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,sg=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",pl=(e,t,n="f32",o,u=!1,l=32,d=!1,c=32,s=!1)=>{let r=e[1]*t[1],i=e[0]*t[0],a=u?r:l,p=u?l:r;if(!(p%t[1]===0&&a%t[0]===0&&l%t[1]===0))throw new Error(`tileAHight ${p} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${a} must be divisible by workgroupSize[0]${t[0]}, tileInner ${l} must be divisible by workgroupSize[1]${t[1]}`);let h=p/t[1],m=a/t[0],b=l/t[1],x=s?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${r};
    let globalColStart = i32(workgroupId.x) * ${i};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${p}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${a}; inputCol = inputCol + ${t[0]}) {
          ${Da(u,o)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${l}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${i}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${o?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${n}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${u?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${r};

let tileRowA = i32(localId.y) * ${h};
let tileColA = i32(localId.x) * ${m};
let tileRowB = i32(localId.y) * ${b};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${h}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Da(u,o)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${b}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${o?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${n}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${sg(u)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${n}, ${a}>, ${p}>;
  var<workgroup> mm_Bsub : array<array<${n}, ${i}>, ${l}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${l};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${d?"0":"i32(globalId.z)"};
    ${o?`let batchIndices = ${o.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${d?`${Math.ceil(c/l)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${d?`i32(globalId.z) * ${c}`:"0"};

    var acc : array<array<${n}, colPerThread>, rowPerThread>;
    ${x}
  }
`},ag=(e,t,n,o,u=!1)=>{let[l,d,c,s]=o,r=Ye(o[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${l.type.indices}) -> ${tt(e,r)} {
      var value = ${tt(e,r)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${d.type.indices};
        ${vi("aIndices",d,d.rank-2,l.rank,"batchIndices")}
        ${d.indicesSet("aIndices",d.rank-2,"u32(row)")}
        ${d.indicesSet("aIndices",d.rank-1,"u32(colIn)")}
        value = ${d.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${l.type.indices}) -> ${tt(e,r)} {
      var value = ${tt(e,r)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${c.type.indices};
        ${vi("bIndices",c,c.rank-2,l.rank,"batchIndices")}
        ${c.indicesSet("bIndices",c.rank-2,"u32(row)")}
        ${c.indicesSet("bIndices",c.rank-1,"u32(colIn)")}
        value = ${c.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${tt(e,r)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${u?"bias[colIn]":`${tt(e,r)}(bias[row])`};`:""}
        ${n}
        ${s.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Po=(e,t,n,o,u=!1,l)=>{let d=e[0].dims,c=e[1].dims,s=d.slice(0,-2),r=c.slice(0,-2),i=o?o.slice(0,-2):n.slice(0,-2),a=B.size(i),p=d[d.length-2],h=d[d.length-1],m=c[c.length-1],b=h%4===0&&m%4===0,x=p<=8?[4,1,1]:[4,4,1],_=[8,8,1],y=[Math.ceil(m/_[0]/x[0]),Math.ceil(p/_[1]/x[1]),Math.ceil(a/_[2]/x[2])],S=b?4:1,T=[...s,p,h/S],I=T.length,A=[...r,h,m/S],k=A.length,O=[a,p,m/S],z=[{type:6,data:p},{type:6,data:m},{type:6,data:h}];sn(t,z),z.push(...oe(i,T,A));let G=["rank","rank"],Y=e.length>2;Y&&(z.push(...oe(e[2].dims)),G.push("rank")),z.push(...oe(O));let W=D=>{let Q=i.length,w=Fl("batchDims",e[0].dataType,Q,1),C=Ye(e[0].dataType),F=j("a",e[0].dataType,I,S),V=j("b",e[1].dataType,k,S),U=re("result",e[0].dataType,O.length,S),q=[F,V];if(Y){let pe=u?S:1;q.push(j("bias",e[2].dataType,e[2].dims.length,pe))}let M=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];an(t,M);let Z=Ye(U.type.tensor),X=on(t,U.type.value,Z),H=ag(S,Y,X,[w,F,V,U],u);return`
  ${D.registerUniforms(M).registerInternalVariables(w).declareVariables(...q,U)}
  ${H}
  ${b?cl(x,_,C,w):pl(x,_,C,w)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${b};${u}`,inputDependencies:G},getRunData:()=>({outputs:[{dims:l?l(n):n,dataType:e[0].dataType}],dispatchGroup:{x:y[0],y:y[1],z:y[2]},programUniforms:z}),getShaderSource:W}}}),ug,l1,mA=R(()=>{"use strict";se(),Qt(),ue(),cn(),Gl(),fA(),Wl(),ug=(e,t,n,o,u=!1,l,d=4,c=4,s=4,r="f32")=>{let i=z=>{switch(z){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${r}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},a=z=>{switch(z){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},p=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,h=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",x=e?"row":"col",_=e?"col":"row",y=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${x} / outWidth;
    let outCol = ${x} % outWidth;

    let WRow = ${_} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${_} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${_} % inChannels;
    var resData = ${tt(d,r)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${b}) {
      ${p}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${i(d)}
    }
    return resData;`,S=e?t&&o?`
    let col = colIn * ${d};
    ${y}`:`
    let col = colIn * ${d};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${y}
    }
    return ${tt(d,r)}(0.0);`:o&&n?`
    let col = colIn * ${d};
    ${y}`:`
    let col = colIn * ${d};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${y}
    }
    return ${tt(d,r)}(0.0);`,T=e?o&&n?a(c):`
    let col = colIn * ${c};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${a(c)}
    }
    return ${tt(c,r)}(0.0);`:`
    let col = colIn * ${c};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${a(c)}
    }
    return ${tt(c,r)}(0.0);`,I=tt(s,r),A=tt(e?d:c,r),k=tt(e?c:d,r),O=on(l,I,r);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${A} {
      ${e?S:T}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${k} {
      ${e?T:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${s};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${h}
      ${a1(u)}
      ${O}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},l1=(e,t,n,o,u,l,d,c,s)=>{let r=t.format==="NHWC",i=r?e[0].dims[3]:e[0].dims[1],a=n[0],p=r?n[2]:n[3],h=r?n[1]:n[2],m=r?n[3]:n[1],b=r&&(i%4===0||i%3===0)&&m%4===0,x=r?m:p*h,_=r?p*h:m,y=[8,8,1],S=o<=8?[4,1,1]:[4,4,1],T=[Math.ceil(x/y[0]/S[0]),Math.ceil(_/y[1]/S[1]),Math.ceil(a/y[2]/S[2])];ve("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${T}`);let I=b?r&&i%4!==0?3:4:1,A=y[1]*S[1],k=y[0]*S[0],O=Math.max(y[0]*I,y[1]),z=o%A===0,G=u%k===0,Y=l%O===0,W=b?[I,4,4]:[1,1,1],D=[{type:6,data:o},{type:6,data:u},{type:6,data:l},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];sn(t,D),D.push(...oe(e[0].dims,e[1].dims));let Q=["rank","rank"];d&&(D.push(...oe(e[2].dims)),Q.push("rank")),D.push(...oe(n));let w=C=>{let F=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];an(t,F);let V=b?4:1,U=Ye(e[0].dataType),q=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${U}>`:U}) {
        result[flatIndex] = ${b?`vec4<${U}>`:U}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${U}>`:U}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,M=j("x",e[0].dataType,e[0].dims.length,I===3?1:I),Z=j("w",e[1].dataType,e[1].dims.length,V),X=[M,Z],H=re("result",e[0].dataType,n.length,V);if(d){let pe=j("bias",e[2].dataType,e[2].dims.length,V);X.push(pe),q+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${U}>`:U} {
          return bias[coords.${r?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${u1("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${C.registerUniforms(F).declareVariables(...X,H)}
        ${q}
        ${ug(r,z,G,Y,d,t,W[0],W[1],W[2],U)}
        ${b?cl(S,y,U,void 0,!r,O):pl(S,y,U,void 0,!r,O,!1,void 0,c)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${b};${z};${G};${Y};${A};${k};${O}`,inputDependencies:Q},getRunData:()=>({outputs:[{dims:s?s(n):n,dataType:e[0].dataType}],dispatchGroup:{x:T[0],y:T[1],z:T[2]},programUniforms:D}),getShaderSource:w}}}),lg,Ra,ri,dg,Na,cg,d1,c1,gA=R(()=>{"use strict";se(),Qt(),ae(),ue(),cn(),Gl(),lg=e=>{let t=1;for(let n=0;n<e.length;n++)t*=e[n];return t},Ra=e=>typeof e=="number"?[e,e,e]:e,ri=(e,t)=>t<=1?e:e+(e-1)*(t-1),dg=(e,t,n,o=1)=>{let u=ri(t,o);return Math.floor((e[0]*(n-1)-n+u)/2)},Na=(e,t,n,o,u)=>{u==null&&(u=dg(e,t[0],o[0]));let l=[0,0,0,n];for(let d=0;d<3;d++)e[d]+2*u>=t[d]&&(l[d]=Math.trunc((e[d]-t[d]+2*u)/o[d]+1));return l},cg=(e,t,n,o,u,l,d,c,s,r)=>{let i,a,p,h;if(e==="VALID"&&(e=0),typeof e=="number"){i={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=Na([t,n,o,1],[c,s,r],1,[u,l,d],e);a=m[0],p=m[1],h=m[2]}else if(Array.isArray(e)){if(!e.every((b,x,_)=>b===_[0]))throw Error(`Unsupported padding parameter: ${e}`);i={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=Na([t,n,o,1],[c,s,r],1,[u,l,d],e[0]);a=m[0],p=m[1],h=m[2]}else if(e==="SAME_UPPER"){a=Math.ceil(t/u),p=Math.ceil(n/l),h=Math.ceil(o/d);let m=(a-1)*u+c-t,b=(p-1)*l+s-n,x=(h-1)*d+r-o,_=Math.floor(m/2),y=m-_,S=Math.floor(b/2),T=b-S,I=Math.floor(x/2),A=x-I;i={top:S,bottom:T,left:I,right:A,front:_,back:y}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:i,outDepth:a,outHeight:p,outWidth:h}},d1=(e,t,n,o,u,l=!1,d="channelsLast")=>{let c,s,r,i,a;if(d==="channelsLast")[c,s,r,i,a]=e;else if(d==="channelsFirst")[c,a,s,r,i]=e;else throw new Error(`Unknown dataFormat ${d}`);let[p,,h,m,b]=t,[x,_,y]=Ra(n),[S,T,I]=Ra(o),A=ri(h,S),k=ri(m,T),O=ri(b,I),{padInfo:z,outDepth:G,outHeight:Y,outWidth:W}=cg(u,s,r,i,x,_,y,A,k,O),D=l?p*a:p,Q=[0,0,0,0,0];return d==="channelsFirst"?Q=[c,D,G,Y,W]:d==="channelsLast"&&(Q=[c,G,Y,W,D]),{batchSize:c,dataFormat:d,inDepth:s,inHeight:r,inWidth:i,inChannels:a,outDepth:G,outHeight:Y,outWidth:W,outChannels:D,padInfo:z,strideDepth:x,strideHeight:_,strideWidth:y,filterDepth:h,filterHeight:m,filterWidth:b,effectiveFilterDepth:A,effectiveFilterHeight:k,effectiveFilterWidth:O,dilationDepth:S,dilationHeight:T,dilationWidth:I,inShape:e,outShape:Q,filterShape:t}},c1=(e,t,n,o,u,l)=>{let d=l==="channelsLast",c=d?e[0].dims[3]:e[0].dims[1],s=!1,r=[64,1,1],i={x:n.map((y,S)=>S)},a=[Math.ceil(lg(i.x.map(y=>n[y]))/r[0]),1,1];ve("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${a}`);let p=s?d&&c%4!==0?3:4:1,h=B.size(n),m=[{type:12,data:h},{type:12,data:o},{type:12,data:u},{type:12,data:t.strides},{type:12,data:t.dilations}];sn(t,m),m.push(...oe(e[0].dims,e[1].dims));let b=["rank","rank"],x=e.length===3;x&&(m.push(...oe(e[2].dims)),b.push("rank")),m.push(...oe(n));let _=y=>{let S=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:o.length},{name:"pads",type:"u32",length:u.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];an(t,S);let T=s?4:1,I=Ye(e[0].dataType),A=j("x",e[0].dataType,e[0].dims.length,p===3?1:p),k=j("W",e[1].dataType,e[1].dims.length,T),O=[A,k],z=re("result",e[0].dataType,n.length,T),G="";if(x){let D=j("bias",e[2].dataType,e[2].dims.length,T);O.push(D),G+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${s?`vec4<${I}>`:I} {
          return bias[${d?ne("coords",4,5):ne("coords",1,5)}${s?"/ 4":""}];
        }`}let Y=tt(p,I),W=on(t,Y,I);return`
            ${G}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${A.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${k.getByIndices("aIndices")};
            }
          ${y.registerUniforms(S).declareVariables(...O,z)}
          ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${z.offsetToIndices("global_idx")};
              let batch = ${ne("coords",0,A.rank)};
              let d2 = ${d?ne("coords",A.rank-1,A.rank):ne("coords",1,A.rank)};
              let xFRCCorner = vec3<u32>(${d?ne("coords",1,A.rank):ne("coords",2,A.rank)},
              ${d?ne("coords",2,A.rank):ne("coords",3,A.rank)},
              ${d?ne("coords",3,A.rank):ne("coords",4,A.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${d?ne("uniforms.x_shape",1,A.rank):ne("uniforms.x_shape",2,A.rank)};
              let xShapeZ = ${d?ne("uniforms.x_shape",2,A.rank):ne("uniforms.x_shape",3,A.rank)};
              let xShapeW = ${d?ne("uniforms.x_shape",3,A.rank):ne("uniforms.x_shape",4,A.rank)};
              let xShapeU = ${d?ne("uniforms.x_shape",4,A.rank):ne("uniforms.x_shape",1,A.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${d?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${d?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${d?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${d?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${x?"value = value + getBiasByOutputCoords(coords)":""};
              ${W}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${d};${p};${x}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:a[0],y:a[1],z:a[2]},programUniforms:m}),getShaderSource:_}}}),p1,h1,bA=R(()=>{"use strict";se(),ae(),ue(),cn(),p1=(e,t,n,o)=>{let u=e.length>2,l=u?"value += b[output_channel];":"",d=e[0].dims,c=e[1].dims,s=t.format==="NHWC",r=s?n[3]:n[1],i=r/t.group,a=s&&i>=4?Ve(r):1,p=B.size(n)/a,h=[{type:12,data:p},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:i}];sn(t,h),h.push(...oe(d,[c[0],c[1],c[2],c[3]/a]));let m=u?["rank","rank","rank"]:["rank","rank"];h.push(...oe([n[0],n[1],n[2],n[3]/a]));let b=x=>{let _=re("output",e[0].dataType,n.length,a),y=Ye(_.type.tensor),S=on(t,_.type.value,y),T=j("x",e[0].dataType,d.length),I=j("w",e[1].dataType,c.length,a),A=[T,I];u&&A.push(j("b",e[2].dataType,e[2].dims,a));let k=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];an(t,k);let O=s?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${T.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${I.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${T.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${I.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${x.registerUniforms(k).declareVariables(...A,_)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${_.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${s?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${s?1:2}], outputIndices[${s?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${a} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${s?2:1}];

    var value: ${_.type.value} = ${_.type.value}(0);
    ${O}
    ${l}
    ${S}
    ${_.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${a}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o?o(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:h}),getShaderSource:b}},h1=(e,t,n,o)=>{let u=e.length>2,l=Ve(n[3]),d=Ve(n[2]),c=B.size(n)/l/d,s=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/l],r=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/l],i=[n[0],n[1],n[2],n[3]/l],a=[{type:12,data:c},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];sn(t,a),a.push(...oe(s,r,i));let p=(d-1)*t.strides[1]+r[1],h=m=>{let b=re("output",e[0].dataType,i.length,l),x=Ye(b.type.tensor),_=on(t,b.type.value,x),y=j("x",e[0].dataType,s.length,l),S=j("w",e[1].dataType,r.length,l),T=[y,S];u&&T.push(j("b",e[2].dataType,e[2].dims,l));let I=u?"value += b[output_channel];":"",A=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return an(t,A),`
  ${m.registerUniforms(A).declareVariables(...T,b)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${d}u;
    let col = (index1 % width1) * ${d}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${y.type.value}, ${p}>;
    var values: array<${b.type.value}, ${d}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${r[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${p}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${y.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${y.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${r[1]}; w_width++) {
          let w_val = ${S.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${d}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${d}u; i++) {
      var value = values[i];
      ${I}
      ${_}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${l};${d};${p};${r[0]};${r[1]}`,inputDependencies:u?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:o?o(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:a}),getShaderSource:h}}}),pg,lo,hg,co,hl,za,fg,mg,fl,yA=R(()=>{"use strict";ae(),mA(),gA(),Wl(),bA(),cn(),Hl(),xr(),pg=(e,t,n,o,u,l)=>{let d=e[0],c=e.slice(l?1:2,l?3:4),s=c.length,r=t[0],i=t.slice(2).map((p,h)=>p+(p-1)*(n[h]-1)),a=c.map((p,h)=>p+o[h]+o[h+s]).map((p,h)=>Math.floor((p-i[h]+u[h])/u[h]));return a.splice(0,0,d),a.splice(l?3:1,0,r),a},lo=[2,3,1,0],hg=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],o=e[1].dims[1]*t.group;if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let u=e[0].dims.length-2;if(t.dilations.length!==u)throw new Error(`dilations should be ${u}D`);if(t.strides.length!==u)throw new Error(`strides should be ${u}D`);if(t.pads.length!==u*2)throw new Error(`pads should be ${u*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},co=(e,t)=>{let n=e.kernelShape.slice();n.length<t[1].dims.length-2&&n.push(...Array(t[1].dims.length-2-n.length).fill(0));for(let l=2;l<t[1].dims.length;++l)n[l-2]===0&&(n[l-2]=t[1].dims[l]);let o=e.pads.slice();Eo.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,n,o,e.format==="NHWC",e.autoPad);let u=Object.assign({},e);return Object.assign(u,{kernelShape:n,pads:o}),u},hl=e=>{let t=Ul(e),n=e.format,o=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],u=e.dilations,l=e.group,d=e.kernel_shape,c=e.pads,s=e.strides,r=e.w_is_const();return{autoPad:o,format:n,dilations:u,group:l,kernelShape:d,pads:c,strides:s,wIsConst:r,...t,cacheKey:`${e.format};${t.activation};`}},za=(e,t,n,o)=>{let u=n.format==="NHWC",l=pg(t[0].dims,t[1].dims,n.dilations,n.pads,n.strides,u);if(n.group!==1){let A=[t[0]];if(u){let k=e.kernelCustomData.wT??e.compute(bt(t[1],lo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=k),A.push(k)}else A.push(t[1]);t.length===3&&A.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&u&&t[1].dims[0]===n.group&&t[1].dims[1]===1&&n.dilations[0]===1&&n.dilations[1]===1?e.compute(h1(A,n,l,o),{inputs:A}):e.compute(p1(A,n,l,o),{inputs:A});return}let d=t.length===3,c=t[0].dims[u?1:2],s=t[0].dims[u?2:3],r=t[0].dims[u?3:1],i=t[1].dims[2],a=t[1].dims[3],p=l[u?1:2],h=l[u?2:3],m=l[u?3:1],b=u&&i===c&&a===s&&n.pads[0]===0&&n.pads[1]===0;if(b||i===1&&a===1&&n.dilations[0]===1&&n.dilations[1]===1&&n.strides[0]===1&&n.strides[1]===1&&n.pads[0]===0&&n.pads[1]===0){let A=l[0],k,O,z,G=[];if(u){let D=e.kernelCustomData.wT??e.compute(bt(t[1],lo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];if(n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=D),b){let Q=c*s*r;k=t[0].reshape([1,A,Q]),O=D.reshape([1,Q,m]),z=[1,A,m]}else k=t[0].reshape([A,c*s,r]),O=D.reshape([1,r,m]),z=[A,p*h,m];G.push(k),G.push(O)}else k=t[0].reshape([A,r,c*s]),O=t[1].reshape([1,m,r]),z=[A,m,p*h],G.push(O),G.push(k);d&&G.push(t[2]);let Y=z[2],W=G[0].dims[G[0].dims.length-1];Y<8&&W<8?e.compute(ql(G,n,l,z,u,o),{inputs:G}):e.compute(Po(G,n,l,z,u,o),{inputs:G});return}let x=!0,_=e.kernelCustomData.wT??e.compute(bt(t[1],lo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=_);let y=[t[0],_];d&&y.push(t[2]);let S=u?p*h:m,T=u?m:p*h,I=i*a*r;e.compute(l1(y,n,l,S,T,I,d,x,o),{inputs:y})},fg=(e,t)=>{let n=t.format==="NHWC",o=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&o.push(e.inputs[2]);let u=[0,t.pads[0],0,t.pads[1]],l=[1].concat(t.strides),d=[1].concat(t.dilations),c=[1].concat(t.kernelShape),s=co({...t,pads:u,strides:l,dilations:d,kernelShape:c},o);za(e,o,s,r=>n?[r[0],r[2],r[3]]:[r[0],r[1],r[3]])},mg=(e,t,n)=>{let o=n.format==="NHWC"?"channelsLast":"channelsFirst",u=co(n,t),l=n.autoPad==="NOTSET"?n.pads:n.autoPad,d=d1(t[0].dims,t[1].dims,n.strides,n.dilations,l,!1,o);e.compute(c1(t,u,d.outShape,[d.filterDepth,d.filterHeight,d.filterWidth],[d.padInfo.front,d.padInfo.top,d.padInfo.left],o))},fl=(e,t)=>{if(hg(e.inputs,t),e.inputs[0].dims.length===3)fg(e,t);else if(e.inputs[0].dims.length===5)mg(e,e.inputs,t);else{let n=co(t,e.inputs);za(e,e.inputs,n)}}}),f1,_A=R(()=>{"use strict";se(),Qt(),ae(),ue(),f1=(e,t,n)=>{let o=e.length>2,u=t.outputShape,l=t.format==="NHWC",d=t.group,c=e[1].dims,s=c[2]/d,r=c[3],i=l?Ve(s):1,a=l&&r===1&&s>=4,p=a?Math.floor(s/4)*4:Math.floor(s/i)*i,h=s-p,m=l?Ve(r):1,b=l?r===1?i:m:1,x=B.size(u)/m,_=[Math.ceil(x/64),1,1];ve("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${_}`);let y=["rank","rank"],S=[t.strides[0],t.strides[1]],T=[t.kernelShape[l?1:2],t.kernelShape[l?2:3]],I=[t.dilations[0],t.dilations[1]],A=[T[0]+(t.dilations[0]<=1?0:(t.kernelShape[l?1:2]-1)*(t.dilations[0]-1)),T[1]+(t.dilations[1]<=1?0:(t.kernelShape[l?2:3]-1)*(t.dilations[1]-1))],k=[A[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),A[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],O=[{type:12,data:x},{type:12,data:S},{type:12,data:T},{type:12,data:I},{type:12,data:A},{type:6,data:k},{type:12,data:p},{type:12,data:s},{type:12,data:r},...oe(e[0].dims,e[1].dims)];o&&(O.push(...oe(e[2].dims)),y.push("rank")),O.push(...oe(u));let z=G=>{let Y=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:T.length},{name:"dilations",type:"u32",length:T.length},{name:"effective_filter_dims",type:"u32",length:A.length},{name:"pads",type:"i32",length:k.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],W=Ye(e[0].dataType),D=l?1:2,Q=l?2:3,w=l?3:1,C=j("W",e[1].dataType,e[1].dims.length,b),F=j("Dy",e[0].dataType,e[0].dims.length,i),V=[F,C];o&&V.push(j("bias",e[2].dataType,[u[w]].length,m));let U=re("result",e[0].dataType,u.length,m),q=()=>{let X="";if(a)i===4?X+=`
        let xValue = ${F.getByOffset("x_offset")};
        let wValue = ${C.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:i===2?X+=`
          dotProd = dotProd + dot(vec4<${W}>(${F.getByOffset("x_offset")}, ${F.getByOffset("x_offset + 1u")}), vec4<${W}>(${C.getByOffset("w_offset")}, ${C.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:i===1&&(X+=`
          dotProd = dotProd + dot(vec4<${W}>(${F.getByOffset("x_offset")}, ${F.getByOffset("x_offset + 1u")}, ${F.getByOffset("x_offset + 2u")}, ${F.getByOffset("x_offset + 3u")}), vec4<${W}>(${C.getByOffset("w_offset")}, ${C.getByOffset("w_offset + 1u")}, ${C.getByOffset("w_offset + 2u")}, ${C.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(X+=`
                  let xValue = ${l?F.getByOffset(`${F.indicesToOffset(`${F.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${i}`):F.get("batch","inputChannel","idyR","idyC")};
        `,i===1)X+=`
          let w_offset = ${C.indicesToOffset(`${C.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${C.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let H=0;H<i;H++)X+=`
            let wValue${H} = ${C.getByOffset(`${C.indicesToOffset(`${C.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${H}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${H}] * wValue${H};`;return X},M=()=>{if(h===0)return"";if(!a)throw new Error(`packInputAs4 ${a} is not true.`);let X="";if(i===1){X+="dotProd = dotProd";for(let H=0;H<h;H++)X+=`
            + ${F.getByOffset(`x_offset + ${H}`)} * ${C.getByOffset(`w_offset + ${H}`)}`;X+=";"}else if(i===2){if(h!==2)throw new Error(`Invalid inputChannelsRemainder ${h}.`);X+=`
          let xValue = ${F.getByOffset("x_offset")};
          let wValue = ${C.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return X},Z=`
            let outputIndices = ${U.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${U.indicesGet("outputIndices",0)};
            let d1 = ${U.indicesGet("outputIndices",w)};
            let r = ${U.indicesGet("outputIndices",D)};
            let c = ${U.indicesGet("outputIndices",Q)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${U.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${W}(dyRCorner) + ${W}(wR)) / ${W}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${W}(uniforms.Dy_shape[${D}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${W}(dyCCorner) + ${W}(wC)) / ${W}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${W}(uniforms.Dy_shape[${Q}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${a?`
                var x_offset = ${F.indicesToOffset(`${F.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${i};
                var w_offset = ${C.indicesToOffset(`${C.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${a?4:i}) {
                  ${q()}
                  inputChannel = inputChannel + ${a?4:i};
                }
                ${M()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${o?` + bias[d1 / ${m}]`:""};
            ${U.setByOffset("global_idx","value")};
          `;return`
    ${G.registerUniforms(Y).declareVariables(...V,U)}
      ${G.mainStart()}
      ${G.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${Z}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${i}${b}${m}${a}${h}`,inputDependencies:y},getRunData:()=>({dispatchGroup:{x:_[0],y:_[1],z:_[2]},outputs:[{dims:n?n(u):u,dataType:e[0].dataType}],programUniforms:O}),getShaderSource:z}}}),gg,bg,yg,Ba,m1,_g,Ma,wg,g1,wA=R(()=>{"use strict";_A(),cn(),xr(),gg=(e,t,n,o,u,l)=>(e-1)*t+n+(o-1)*u+1-l,bg=(e,t,n,o,u)=>{let l=Math.floor(e/2);t==="SAME_UPPER"?(n[o]=l,n[u]=e-l):t==="SAME_LOWER"&&(n[o]=e-l,n[u]=l)},yg=(e,t,n,o,u,l,d,c,s,r)=>{let i=e.length-2,a=r.length===0;s.length<i&&s.push(...Array(i-s.length).fill(0));let p=e[0],h=t[c?3:1]*u;for(let m=0,b=e.length-i-(c?1:0);m<i;++m,++b){let x=e[b],_=a?x*d[m]:r[m],y=gg(x,d[m],l[m],t[b],n[m],_);bg(y,o,l,m,m+i),a&&r.push(d[m]*(x-1)+s[m]+(t[b]-1)*n[m]+1-l[m]-l[m+i])}r.splice(0,0,p),r.splice(c?3:1,0,h)},Ba=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((a,p)=>a*p,1)===0){n.length=0;for(let a=2;a<t[1].dims.length;++a)n.push(t[1].dims[a])}let o=e.format==="NHWC";n.splice(0,0,t[1].dims[0]),n.splice(o?3:1,0,t[1].dims[1]);let u=e.pads.slice(),l=e.outputShape.slice(),d=e.outputPadding.slice(),c=t[0].dims,s=e.dilations.slice();if(s.reduce((a,p)=>a+p,0)===0){let a=t[0].dims.length-2;s=new Array(a).fill(1)}let r=e.strides.slice();if(r.reduce((a,p)=>a+p,0)===0){let a=t[0].dims.length-2;r=new Array(a).fill(1)}yg(c,n,s,e.autoPad,e.group,u,r,o,d,l);let i=Object.assign({},e);return Object.assign(i,{kernelShape:n,pads:u,outputPadding:d,outputShape:l,dilations:s,strides:r}),i},m1=e=>{let t=Ul(e),n=e.format,o=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],u=e.dilations,l=e.group??1,d=e.kernelShape,c=e.pads,s=e.strides,r=e.wIsConst(),i=e.outputPadding,a=e.outputShape;return{autoPad:o,format:n,dilations:u,group:l,kernelShape:d,outputPadding:i,outputShape:a,pads:c,strides:s,wIsConst:r,...t,cacheKey:`${e.format};${t.activation};`}},_g=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],o=e[1].dims[0];if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let u=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==u))throw new Error("invalid bias");let l=e[0].dims.length-2;if(t.dilations.reduce((d,c)=>d+c,0)>0&&t.dilations.length!==l)throw new Error(`dilations should be ${l}D`);if(t.strides.reduce((d,c)=>d+c,0)>0&&t.strides.length!==l)throw new Error(`strides should be ${l}D`);if(t.pads.reduce((d,c)=>d+c,0)>0&&t.pads.length!==l*2)throw new Error(`pads should be ${l*2}D`);if(t.outputPadding.length!==l&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${l}D`);if(t.kernelShape.reduce((d,c)=>d+c,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Ma=(e,t,n,o)=>{let u=e.kernelCustomData.wT??e.compute(bt(t[1],[2,3,0,1]),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=u);let l=[t[0],u];t.length===3&&l.push(t[2]),e.compute(f1(l,n,o),{inputs:l})},wg=(e,t)=>{let n=t.format==="NHWC",o=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&o.push(e.inputs[2]);let u=t.kernelShape;(u.length===0||u[0]===0)&&(u=[e.inputs[1].dims[2]]);let l=t.dilations;(l.length===0||l[0]===0)&&(l=[1]);let d=t.strides;(d.length===0||d[0]===0)&&(d=[1]);let c=t.pads;c.length===0&&(c=[0,0]),c=[0,c[0],0,c[1]],d=[1].concat(d),l=[1].concat(l),u=[1].concat(u);let s=t.outputPadding;s=[0].concat(s);let r=Ba({...t,pads:c,strides:d,dilations:l,kernelShape:u,outputPadding:s},o);Ma(e,o,r,i=>n?[i[0],i[2],i[3]]:[i[0],i[1],i[3]])},g1=(e,t)=>{if(_g(e.inputs,t),e.inputs[0].dims.length===3)wg(e,t);else{let n=Ba(t,e.inputs);Ma(e,e.inputs,n)}}}),vg,b1,y1,vA=R(()=>{"use strict";se(),ae(),Ue(),ue(),vg=(e,t,n,o)=>{let u=B.size(t),l=t.length,d=j("input",e,l),c=re("output",e,l),s=n.dataType===6?n.getInt32Array()[0]:Number(n.getBigInt64Array()[0]),r=B.normalizeAxis(s,l),i=a=>{let p=` i32(${d.indicesGet("inputIndices","uniforms.axis")}) `,h=ne("uniforms.input_shape","uniforms.axis",l),m=o.reverse?p+(o.exclusive?" + 1":""):"0",b=o.reverse?h:p+(o.exclusive?"":" + 1");return`
                ${a.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(d,c)}
                ${a.mainStart()}
                  ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${c.offsetToIndices("global_idx")};
                  var sum = ${c.type.value}(0);
                  let first : i32 = ${m};
                  let last : i32 = ${b};
                  for (var i : i32 = first; i < last; i++) {
                    ${d.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${d.getByIndices("inputIndices")};
                  }
                  ${c.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:o.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:[{type:12,data:u},{type:12,data:r},...oe(t,t)]}),getShaderSource:i}},b1=(e,t)=>{let n=e.inputs[0].dims,o=e.inputs[0].dataType,u=e.inputs[1];e.compute(vg(o,n,u,t),{inputs:[0]})},y1=e=>{let t=e.exclusive===1,n=e.reverse===1;return Se({exclusive:t,reverse:n})}}),xg,$g,Tg,_1,w1,xA=R(()=>{"use strict";se(),ae(),Ue(),ue(),xg=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},$g=(e,t,n,o)=>{let u=[];u.push(`fn perm(i: ${o.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`);for(let l=0;l<t;++l)u.push(n.indicesSet("a",e[l],`i[${l}]`));return u.push("return a;}"),u.join(`
`)},Tg=(e,t)=>{let n,o,u,l,d,c,s=t.format==="NHWC",r=t.blocksize,i=t.mode==="DCR";s?([n,o,u,l]=e.dims,d=i?[n,o,u,r,r,l/r**2]:[n,o,u,l/r**2,r,r],c=i?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([n,o,u,l]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],d=i?[n,r,r,l/r**2,o,u]:[n,l/r**2,r,r,o,u],c=i?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let a=e.reshape(d),p=a.dims.length,h=e.dataType,m=j("a",h,p),b=re("output",h,p),x=_=>`
  ${_.registerUniform("output_size","u32").declareVariables(m,b)}

  ${$g(c,p,m,b)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:_=>{let y=s?[n,o*r,u*r,l/r**2]:[n,l/r**2,o*r,u*r],S=B.size(y),T=a.dims,I=B.sortBasedOnPerm(T,c);return{outputs:[{dims:y,dataType:_[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...oe(T,I)]}},getShaderSource:x}},_1=(e,t)=>{xg(e.inputs),e.compute(Tg(e.inputs[0],t))},w1=e=>Se({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Xt,ni,po,Fa,lr,Sg,Ig,Og,ja,La,Va,Eg,Ag,Ua,Pg,v1,x1,$A=R(()=>{"use strict";se(),ae(),Ue(),ue(),Xt=256,ni=512,po=2*Math.PI,Fa=e=>{let t=[],n=e;for(let o of[4,2,3,5])for(;n%o===0;)t.push(o),n/=o;return n===1?t:void 0},lr=e=>{let t=e.toPrecision(9);return/[.eE]/.test(t)?t:`${t}.0`},Sg=(e,t,n,o,u)=>{let l=n/e,d=ni-o,c=r=>`smem[${d}u + base + ${r*t}u]`,s=`  for (var t = local_idx; t < ${l}u; t += ${Xt}u) {
`;s+=`    let twiddleIndex = t % ${t}u;
    let angleUnit = f32(twiddleIndex);
`,s+=`    var leg: array<vec2<f32>, 5>;
`;for(let r=0;r<e;r++){let i=`${o}u + t + ${r*l}u`;if(r===0)s+=`    leg[0] = smem[${i}];
`;else{let a=u*po*r/(e*t);s+=`    { let a = ${lr(a)} * angleUnit; leg[${r}] = cmul(smem[${i}], vec2<f32>(cos(a), sin(a))); }
`}}if(s+=`    let base = (t / ${t}u) * ${t*e}u + twiddleIndex;
`,e===2)s+=`    ${c(0)} = leg[0] + leg[1];
    ${c(1)} = leg[0] - leg[1];
`;else if(e===4){let r=u<0?"vec2<f32>(oddDiff.y, -oddDiff.x)":"vec2<f32>(-oddDiff.y, oddDiff.x)";s+=`    let evenSum = leg[0] + leg[2]; let evenDiff = leg[0] - leg[2];
`,s+=`    let oddSum = leg[1] + leg[3]; let oddDiff = leg[1] - leg[3];
`,s+=`    let oddRot = ${r};
`,s+=`    ${c(0)} = evenSum + oddSum;
    ${c(1)} = evenDiff + oddRot;
`,s+=`    ${c(2)} = evenSum - oddSum;
    ${c(3)} = evenDiff - oddRot;
`}else for(let r=0;r<e;r++){let i=["leg[0]"];for(let a=1;a<e;a++){let p=u*po*(a*r)/e,h=lr(Math.cos(p)),m=lr(Math.sin(p));i.push(`vec2<f32>(leg[${a}].x*${h} - leg[${a}].y*${m}, leg[${a}].x*${m} + leg[${a}].y*${h})`)}s+=`    ${c(r)} = ${i.join(" + ")};
`}return`${s}  }
  workgroupBarrier();
`},Ig=(e,t,n)=>{let o="",u=1,l=0;for(let d of e)o+=Sg(d,u,t,l,n),u*=d,l=ni-l;return{code:o,resultOffset:l}},Og=(e,t,n,o,u)=>{let l=e.dims,d=l.length,c=l[d-1],s=l[t],r=n&&o?(s-1)*2:s;u!==void 0&&(r=u);let i=n&&o?1:2,a=o&&!n?Math.floor(r/2)+1:r,p=l.slice();p[t]=a,p[d-1]=i;let h=1;for(let b=t+1;b<d-1;b++)h*=l[b];let m=B.size(l)/c/s;return{dataType:e.dataType,outputDims:p,length:r,signalLength:s,inner:h,batch:m,inputComponents:c,outputComponents:i,outputLength:a,inverse:n,onesided:o}},ja=(e,t)=>[t,e.length,e.inputComponents,e.outputComponents,e.inverse,e.onesided].join(";"),La=e=>[{type:12,data:e.batch},{type:12,data:e.signalLength},{type:12,data:e.inner},{type:12,data:e.outputLength}],Va=(e,t,n)=>e.registerUniform("batch","u32").registerUniform("signalLength","u32").registerUniform("inner","u32").registerUniform("outputLength","u32").declareVariables(t,n),Eg=e=>{let{dataType:t,length:n,inputComponents:o,outputComponents:u,inverse:l,onesided:d}=e,c=Je(t),s=l?1:-1,r=l?1/n:1,i=Fa(n),a=p=>{let h=j("x",t,[1]),m=re("y",t,[1]),b=I=>{let A=`inBase + (${I}) * uniforms.inner * ${o}u`,k=`f32(${h.getByOffset(A)})`,O=o===2?`f32(${h.getByOffset(`${A} + 1u`)})`:"0.0";return`vec2<f32>(${k}, ${O})`},x;if(l&&d){let I=Math.floor(n/2)+1,A=n%2===0?`select(provided, provided - 1u, provided == ${I}u)`:"provided";x=`
    let provided = min(uniforms.signalLength, ${I}u);
    for (var i = local_idx; i < ${n}u; i += ${Xt}u) {
      if (i < provided) { smem[i] = ${b("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();
    for (var k = local_idx + 1u; k < ${A}; k += ${Xt}u) {
      let h = smem[k];
      smem[${n}u - k] = vec2<f32>(h.x, -h.y);
    }
    workgroupBarrier();`}else x=`
    let loadCount = min(uniforms.signalLength, ${n}u);
    for (var i = local_idx; i < ${n}u; i += ${Xt}u) {
      if (i < loadCount) { smem[i] = ${b("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();`;let{code:_,resultOffset:y}=Ig(i,n,s),S=r===1?`smem[${y}u + i]`:`smem[${y}u + i] * ${lr(r)}`,T=u===2?m.setByOffset("off + 1u",`${c}(v.y)`):"";return`
  ${Va(p,h,m)}
  var<workgroup> smem: array<vec2<f32>, ${2*ni}>;
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${p.mainStart(Xt)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${o}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${u}u;
    ${x}
${_}    for (var i = local_idx; i < uniforms.outputLength; i += ${Xt}u) {
      let v = ${S};
      let off = outBase + i * uniforms.inner * ${u}u;
      ${m.setByOffset("off",`${c}(v.x)`)}
      ${T}
    }
  }`};return{name:"DFT",shaderCache:{hint:ja(e,"fft"),inputDependencies:["type"]},getShaderSource:a,getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:La(e),dispatchGroup:{x:e.batch}})}},Ag=e=>{let{dataType:t,length:n,inputComponents:o,outputComponents:u,inverse:l,onesided:d}=e,c=Je(t),s=l?1:-1,r=l?1/n:1,i=a=>{let p=j("x",t,[1]),h=re("y",t,[1]),m=S=>{let T=`inBase + (${S}) * uniforms.inner * ${o}u`,I=`f32(${p.getByOffset(T)})`,A=o===2?`f32(${p.getByOffset(`${T} + 1u`)})`:"0.0";return`vec2<f32>(${I}, ${A})`},b=l&&d?`fn spectrum(inBase: u32, k: u32) -> vec2<f32> {
    let provided = min(uniforms.signalLength, ${Math.floor(n/2)+1}u);
    if (k < provided) { return ${m("k")}; }
    let m = ${n}u - k;
    if (m < provided) {
      let h = ${m("m")};
      return vec2<f32>(h.x, -h.y);
    }
    return vec2<f32>(0.0, 0.0);
  }`:`fn spectrum(inBase: u32, n: u32) -> vec2<f32> {
    if (n < uniforms.signalLength) { return ${m("n")}; }
    return vec2<f32>(0.0, 0.0);
  }`,x=`
      let angle = ${lr(s*po)} * f32(knMod) / ${lr(n)};
      acc += cmul(spectrum(inBase, n), vec2<f32>(cos(angle), sin(angle)));
      knMod += k;
      if (knMod >= ${n}u) { knMod -= ${n}u; }`,_=u===2?h.setByOffset("off + 1u",`${c}(v.y)`):"",y=r===1?"acc":`acc * ${lr(r)}`;return`
  ${Va(a,p,h)}
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${b}
  ${a.mainStart(Xt)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${o}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${u}u;
    for (var k = local_idx; k < uniforms.outputLength; k += ${Xt}u) {
      var acc = vec2<f32>(0.0, 0.0);
      var knMod = 0u;
      for (var n = 0u; n < ${n}u; n++) {${x}
      }
      let v = ${y};
      let off = outBase + k * uniforms.inner * ${u}u;
      ${h.setByOffset("off",`${c}(v.x)`)}
      ${_}
    }
  }`};return{name:"DFT",shaderCache:{hint:ja(e,"direct"),inputDependencies:["type"]},getShaderSource:i,getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:La(e),dispatchGroup:{x:e.batch}})}},Ua=e=>{if(!e||e.dataType===0)return;if(B.size(e.dims)!==1)throw new Error("DFT optional scalar inputs must have exactly 1 element.");if(e.dataType===6)return e.getInt32Array()[0];let t=Number(e.getBigInt64Array()[0]);if(!Number.isSafeInteger(t))throw new Error("DFT optional scalar inputs are out of JavaScript safe integer range.");return t},Pg=e=>{if(!e||e.length<1)throw new Error("DFT requires at least 1 input.");let t=e[0].dims;if(t.length<2)throw new Error("DFT input must have at least 2 dimensions.");let n=t[t.length-1];if(n!==1&&n!==2)throw new Error("DFT input's innermost dimension must be 1 (real) or 2 (complex).")},v1=(e,t)=>{Pg(e.inputs);let n=e.inputs[0],o=n.dims.length,u=t.inverse!==0,l=t.onesided!==0,d=Ua(e.inputs[1]);if(d!==void 0&&d<=0)throw new Error("dft_length must be greater than zero.");let c=B.normalizeAxis(Ua(e.inputs[2])??t.axis,o);if(c===o-1)throw new Error("DFT axis must refer to a signal dimension, not the innermost (real/imaginary) dimension.");if(u&&l&&n.dims[o-1]!==2)throw new Error("Inverse one-sided DFT (IRFFT) requires complex-valued input (innermost dimension 2).");let s=Og(n,c,u,l,d);if(s.length<=0)throw new Error(`Invalid DFT length: ${s.length}`);let r=s.length<=ni&&Fa(s.length)!==void 0?Eg(s):Ag(s);e.compute(r,{inputs:[0]})},x1=e=>Se({axis:e.axis??1,inverse:e.inverse??0,onesided:e.onesided??0})}),ho,ii,Ga,kg,Cg,Dg,Rg,qa,Ng,$1,T1,TA=R(()=>{"use strict";se(),ae(),Ue(),ue(),ho="[a-zA-Z]|\\.\\.\\.",ii="("+ho+")+",Ga="^"+ii+"$",kg="("+ii+",)*"+ii,Cg="^"+kg+"$",Dg=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let n=this.symbolToIndices.get(e);n===void 0?n=[t]:n.push(t),this.symbolToIndices.set(e,n)}},Rg=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[n,o]=t.includes("->")?t.split("->",2):[t,""];if(!n.match(RegExp(Cg)))throw new Error("Invalid LHS term");if(n.split(",").forEach((u,l)=>{let d=e[l].dims.slice();if(!u.match(RegExp(Ga)))throw new Error("Invalid LHS term");let c=this.processTerm(u,!0,d,l);this.lhs.push(c)}),o==="")o+=[...this.symbolToInfo.entries()].filter(([u,l])=>l.count===1||u==="...").map(([u])=>u).join("");else if(!o.match(RegExp(ii)))throw new Error("Invalid RHS");o.match(RegExp(ho,"g"))?.forEach(u=>{if(u==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let l=this.symbolToInfo.get(u);if(l===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(l.dimValue)}}),this.rhs=this.processTerm(o,!1,this.outputDims)}addSymbol(e,t,n){let o=this.symbolToInfo.get(e);if(o!==void 0){if(o.dimValue!==t&&o.count!==1)throw new Error("Dimension mismatch");o.count++,o.inputIndices.push(n)}else o={count:1,dimValue:t,inputIndices:[n]};this.symbolToInfo.set(e,o)}processTerm(e,t,n,o=-1){let u=n.length,l=!1,d=[],c=0;if(!e.match(RegExp(Ga))&&!t&&e!=="")throw new Error("Invalid LHS term");let s=e.match(RegExp(ho,"g")),r=new Dg(o);return s?.forEach((i,a)=>{if(i==="..."){if(l)throw new Error("Only one ellipsis is allowed per input term");l=!0;let p=u-s.length+1;if(p<0)throw new Error("Ellipsis out of bounds");if(d=n.slice(c,c+p),this.hasEllipsis){if(this.ellipsisDims.length!==d.length||this.ellipsisDims.toString()!==d.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=d;else throw new Error("Ellipsis must be specified in the LHS");for(let h=0;h<d.length;h++){let m=String.fromCharCode(48+h);r.addSymbol(m,a+h),this.addSymbol(m,n[c++],o)}}else r.addSymbol(i,a+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(i,n[c++],o)}),r}},qa=e=>e+"_max",Ng=(e,t,n,o)=>{let u=e.map(r=>r.length).map((r,i)=>j(`input${i}`,t,r)),l=B.size(o),d=re("output",t,o.length),c=[...n.symbolToInfo.keys()].filter(r=>!n.rhs.symbolToIndices.has(r)),s=r=>{let i=[],a="var prod = 1.0;",p="var sum = 0.0;",h="sum += prod;",m=[],b=[],x=[],_=[],y=n.symbolToInfo.size===n.rhs.symbolToIndices.size;n.symbolToInfo.forEach((T,I)=>{if(n.rhs.symbolToIndices.has(I)){let A=n.rhs.symbolToIndices.get(I)?.[0];A!==void 0&&n.lhs.forEach((k,O)=>{if(T.inputIndices.includes(O)){let z=k.symbolToIndices.get(I);if(z===void 0)throw new Error("Invalid symbol error");z.forEach(G=>{i.push(`${u[O].indicesSet(`input${O}Indices`,G,d.indicesGet("outputIndices",A))}`)})}})}else n.lhs.forEach((A,k)=>{if(T.inputIndices.includes(k)){let O=A.symbolToIndices.get(I);if(O===void 0)throw new Error("Invalid symbol error");O.forEach(z=>{m.push(`${u[k].indicesSet(`input${k}Indices`,z,`${I}`)}`)}),_.push(`prod *= ${u[k].getByIndices(`input${k}Indices`)};`)}}),b.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${qa(I)}; ${I}++) {`),x.push("}")});let S=y?[...i,`let sum = ${u.map((T,I)=>T.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...i,p,...b,...m,a,..._,h,...x];return`
            ${r.registerUniforms(c.map(T=>({name:`${qa(T)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...u,d)}

            ${r.mainStart()}
            ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${d.offsetToIndices("global_idx")};
            ${u.map((T,I)=>`var input${I}Indices: ${u[I].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${d.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:n.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let r=c.filter(a=>n.symbolToInfo.has(a)).map(a=>({type:12,data:n.symbolToInfo.get(a)?.dimValue||0}));r.push({type:12,data:l});let i=e.map((a,p)=>[...oe(a)]).reduce((a,p)=>a.concat(p),r);return i.push(...oe(o)),{outputs:[{dims:o,dataType:t}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:i}},getShaderSource:s}},$1=(e,t)=>{let n=new Rg(e.inputs,t.equation),o=n.outputDims,u=e.inputs.map((l,d)=>l.dims);e.compute(Ng(u,e.inputs[0].dataType,n,o))},T1=e=>{let t=e.equation.replace(/\s+/g,"");return Se({equation:t})}}),zg,Ha,Bg,Mg,S1,SA=R(()=>{"use strict";se(),ae(),ue(),zg=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),o=n.length<t.length?0:n.length-t.length,u=t.length<n.length?0:t.length-n.length;for(;o<n.length&&u<t.length;++o,++u)if(n[o]!==t[u]&&n[o]!==1&&t[u]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Ha=(e,t)=>{let n=e.length-t.length,o=[];for(let u=0;u<n;++u)o.push(e[u]);for(let u=0;u<t.length;++u)o.push(t[u]===1?e[u+n]:t[u]);return o},Bg=(e,t)=>e.length>t.length?Ha(e,t):Ha(t,e),Mg=e=>{let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),o=Bg(t,n),u=e[0].dataType,l=u===9||B.size(t)===1,d=u===9||t.length>0&&t[t.length-1]%4===0?4:1,c=l||o.length>0&&o[o.length-1]%4===0?4:1,s=Math.ceil(B.size(o)/c),r=a=>{let p=j("input",u,t.length,d),h=re("output",u,o.length,c),m;if(u===9){let b=(x,_,y="")=>`
          let outputIndices${_} = ${h.offsetToIndices(`outputOffset + ${_}u`)};
          let offset${_} = ${p.broadcastedIndicesToOffset(`outputIndices${_}`,h)};
          let index${_} = offset${_} / 4u;
          let component${_} = offset${_} % 4u;
          ${x}[${_}] = ${y}(${p.getByOffset(`index${_}`)}[component${_}]);
        `;m=`
        let outputOffset = global_idx * ${c};
        var data = vec4<u32>(0);
        ${b("data",0,"u32")}
        ${b("data",1,"u32")}
        ${b("data",2,"u32")}
        ${b("data",3,"u32")}
        ${h.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${h.offsetToIndices(`global_idx * ${c}`)};
        let inputOffset = ${p.broadcastedIndicesToOffset("outputIndices",h)};
        let data = ${h.type.value}(${p.getByOffset(`inputOffset / ${d}`)});
        ${h.setByOffset("global_idx","data")}
      }`;return`
    ${a.registerUniform("vec_size","u32").declareVariables(p,h)}
    ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},i=[{type:12,data:s},...oe(t,o)];return{name:"Expand",shaderCache:{hint:`${o.length};${d}${c}`,inputDependencies:["rank"]},getShaderSource:r,getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:i})}},S1=e=>{zg(e.inputs),e.compute(Mg(e.inputs),{inputs:[0]})}}),Fg,I1,IA=R(()=>{"use strict";se(),ae(),ue(),Vl(),Fg=e=>{let t=e[0].dataType,n=B.size(e[0].dims),o=B.size(e[1].dims),u=o%4===0,l=d=>{let c=j("x",t,[1],4),s=j("bias",t,[1],4),r=re("y",t,[1],4),i=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],a=h=>`
      let bias${h}_offset: u32 = (global_idx * 4 + ${h}) % uniforms.bias_size;
      let bias${h} = ${s.getByOffset(`bias${h}_offset / 4`)}[bias${h}_offset % 4];`,p=u?`
      let bias = ${s.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${a(0)}${a(1)}${a(2)}${a(3)}
      let bias = ${c.type.value}(bias0, bias1, bias2, bias3);`;return`${d.registerUniforms(i).declareVariables(c,s,r)}

    ${ll(Je(t))}

    ${d.mainStart(On)}
      ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${c.getByOffset("global_idx")};
      ${p}
      let x_in = x + bias;
      ${r.setByOffset("global_idx",dl("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${u}`,inputDependencies:["type","type"]},getShaderSource:l,getRunData:d=>({outputs:[{dims:d[0].dims,dataType:d[0].dataType}],programUniforms:[{type:12,data:Math.ceil(n/4)},{type:12,data:o}],dispatchGroup:{x:Math.ceil(n/On/4)}})}},I1=e=>{e.inputs.length<2||B.size(e.inputs[1].dims)===0?Gx(e):e.compute(Fg(e.inputs))}}),jg,Lg,O1,E1,OA=R(()=>{"use strict";se(),ae(),Ue(),ue(),jg=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Lg=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n.length,l=B.normalizeAxis(t.axis,u),d=n.slice(0);d.splice(l,1,...o);let c=n[l],s=e[0].dataType===9?4:1,r=Math.ceil(B.size(d)/s),i=[{type:12,data:r},{type:6,data:c},{type:12,data:l},...oe(e[0].dims,e[1].dims,d)],a=p=>{let h=j("data",e[0].dataType,e[0].dims.length,s),m=j("inputIndices",e[1].dataType,e[1].dims.length),b=re("output",e[0].dataType,d.length,s),x=y=>{let S=o.length,T=`var indicesIndices${y}  = ${m.type.indices}(0);`;for(let I=0;I<S;I++)T+=`${S>1?`indicesIndices${y}[${I}]`:`indicesIndices${y}`} = ${d.length>1?`outputIndices${y}[uniforms.axis + ${I}]`:`outputIndices${y}`};`;T+=`
          var idx${y} = ${m.getByIndices(`indicesIndices${y}`)};
          if (idx${y} < 0) {
            idx${y} = idx${y} + uniforms.axisDimLimit;
          }
          var dataIndices${y} : ${h.type.indices};
        `;for(let I=0,A=0;I<u;I++)I===l?(T+=`${u>1?`dataIndices${y}[${I}]`:`dataIndices${y}`} = u32(idx${y});`,A+=S):(T+=`${u>1?`dataIndices${y}[${I}]`:`dataIndices${y}`} = ${d.length>1?`outputIndices${y}[${A}]`:`outputIndices${y}`};`,A++);return T},_;if(e[0].dataType===9){let y=(S,T,I="")=>`
          let outputIndices${T} = ${b.offsetToIndices(`outputOffset + ${T}u`)};
          ${x(T)};
          let offset${T} = ${h.indicesToOffset(`dataIndices${T}`)};
          let index${T} = offset${T} / 4u;
          let component${T} = offset${T} % 4u;
          ${S}[${T}] = ${I}(${h.getByOffset(`index${T}`)}[component${T}]);
        `;_=`
        let outputOffset = global_idx * ${s};
        var value = vec4<u32>(0);
        ${y("value",0,"u32")}
        ${y("value",1,"u32")}
        ${y("value",2,"u32")}
        ${y("value",3,"u32")}
        ${b.setByOffset("global_idx","value")}
      `}else _=`
      let outputIndices = ${b.offsetToIndices("global_idx")};
      ${x("")};
      let value = ${h.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${p.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,m,b)}
      ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${_}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:i}),getShaderSource:a}},O1=e=>Se({axis:e.axis}),E1=(e,t)=>{let n=e.inputs;jg(n),e.compute(Lg(e.inputs,t))}}),Vg,A1,P1,EA=R(()=>{"use strict";se(),ae(),ue(),Vg=(e,t,n,o,u,l,d,c,s)=>{let r=[{type:12,data:l},{type:12,data:o},{type:12,data:u},{type:12,data:n},{type:12,data:d},{type:12,data:c},{type:12,data:s}],i=[l];r.push(...oe(t.dims,i));let a=p=>{let h=j("indices_data",t.dataType,t.dims.length),m=re("input_slice_offsets_data",12,1,1),b=[h,m],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:u.length},{name:"sizes_from_slice_dims_data",type:"u32",length:n.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${p.registerUniforms(x).declareVariables(...b)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${u.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${n.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${u.length}_${n.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:r}),getShaderSource:a},{inputs:[t],outputs:[-1]})[0]},A1=(e,t)=>{let n=e.inputs,o=n[0].dims,u=n[0].dataType,l=n[1].dims,d=l[l.length-1],c=B.sizeToDimension(l,l.length-1),s=B.sizeFromDimension(o,t.batchDims+d),r=B.sizeToDimension(o,t.batchDims),i=B.sizeFromDimension(o,t.batchDims),a=c/r,p=new Array(d),h=s;for(let T=0;T<d;++T)p[d-1-T]=h,h*=o[t.batchDims+d-1-T];let m=Vg(e,n[1],p,t.batchDims,o,c,a,i,d),b=t.batchDims+d;if(b>o.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=l.slice(0,-1).concat(o.slice(b)),_=B.size(x),y=[{type:12,data:_},{type:12,data:s},...oe(n[0].dims,m.dims,x)],S=T=>{let I=j("data",n[0].dataType,n[0].dims.length),A=j("slice_offsets",12,m.dims.length),k=re("output",n[0].dataType,x.length);return`
          ${T.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,A,k)}
            ${T.mainStart()}
            ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:u}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:y}),getShaderSource:S},{inputs:[n[0],m]})},P1=e=>({batchDims:e.batch_dims,cacheKey:""})}),Ug,Gg,k1,C1,AA=R(()=>{"use strict";se(),ae(),Ue(),ue(),Ug=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let n=B.normalizeAxis(t.quantizeAxis,e[0].dims.length),o=t.blockSize,u=e[0],l=e[2],d=e.length===4?e[3]:void 0;if(l.dims.length!==u.dims.length||!u.dims.map((c,s)=>s===n?Math.ceil(c/o)===l.dims[s]:c===l.dims[s]).reduce((c,s)=>c&&s,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(d){if(d.dataType!==u.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(d.dims.length!==l.dims.length||!d.dims.map((c,s)=>c===l.dims[s]).reduce((c,s)=>c&&s,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Gg=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n.length,l=B.normalizeAxis(t.gatherAxis,u),d=B.normalizeAxis(t.quantizeAxis,u),c=n.slice(0);c.splice(l,1,...o);let s=B.size(c),r=e[2].dataType,i=e[0].dataType===22,a=[{type:12,data:s},{type:12,data:d},{type:12,data:l},{type:12,data:t.blockSize},...oe(...e.map((h,m)=>h.dims),c)],p=h=>{let m=j("data",e[0].dataType,e[0].dims.length),b=j("inputIndices",e[1].dataType,e[1].dims.length),x=j("scales",e[2].dataType,e[2].dims.length),_=e.length>3?j("zeroPoint",e[3].dataType,e[3].dims.length):void 0,y=re("output",r,c.length),S=[m,b,x];_&&S.push(_);let T=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${h.registerUniforms(T).declareVariables(...S,y)}
        ${h.mainStart()}
        let output_indices = ${y.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${o.length>1?`
          for (var i: u32 = 0; i < ${o.length}; i++) {
            let index = ${y.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${b.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${y.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${m.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${y.indicesGet("output_indices","i")};
          ${m.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${b.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${n[l]};
        }
        ${m.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${c.length}; i++) {
          let index = ${y.indicesGet("output_indices",`i + ${o.length} - 1`)};
          ${m.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${m.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${m.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${i?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${x.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${x.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${x.getByIndices("scale_indices")};
        ${_?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${_.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${_.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${i?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Je(r)}(quantized_data - zero_point) * scale;
        ${y.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((h,m)=>m!==1).map(h=>h.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(h,m)=>"rank")},getRunData:()=>({outputs:[{dims:c,dataType:r}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:a}),getShaderSource:p}},k1=(e,t)=>{let n=e.inputs;Ug(n,t),e.compute(Gg(e.inputs,t))},C1=e=>Se({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),qg,Hg,D1,R1,PA=R(()=>{"use strict";se(),ae(),Ue(),ue(),qg=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},Hg=(e,t)=>{let n=e[0].dims,o=e[0].dataType,u=n.length,l=e[1].dims,d=e[1].dataType,c=B.normalizeAxis(t.axis,u),s=n[c],r=l.slice(0),i=B.size(r),a=j("input",o,u),p=j("indicesInput",d,l.length),h=re("output",o,r.length),m=[{type:12,data:i},{type:6,data:s},{type:12,data:c}];return m.push(...oe(n,l,r)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:m}),getShaderSource:b=>`
      ${b.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(a,p,h)}
      ${b.mainStart()}
      ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${h.offsetToIndices("global_idx")};

      var idx = ${p.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${a.type.indices}(outputIndices);
      ${a.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${a.getByIndices("inputIndices")};

      ${h.setByOffset("global_idx","value")};
  }`}},D1=e=>Se({axis:e.axis}),R1=(e,t)=>{let n=e.inputs;qg(n),e.compute(Hg(e.inputs,t))}}),Wg,Kg,N1,z1,kA=R(()=>{"use strict";se(),ae(),ue(),Wg=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},Kg=(e,t)=>{let n=e[0].dims.slice(),o=e[1].dims.slice(),[u,l,d]=Pv.getShapeOfGemmResult(n,t.transA,o,t.transB,e.length===3?e[2].dims:void 0),c=[u,l];if(!c)throw new Error("Can't use gemm on the given tensors");let s=16,r=Math.ceil(l/s),i=Math.ceil(u/s),a=!0,p=B.size(c),h=[{type:12,data:a?r:p},{type:12,data:u},{type:12,data:l},{type:12,data:d},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(h.push(...oe(e[2].dims)),m.push("rank")),h.push(...oe(c));let b=_=>{let y="";t.transA&&t.transB?y="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?y="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?y="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(y="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",T=j("a",e[0].dataType,e[0].dims),I=j("b",e[1].dataType,e[1].dims),A=T.type.value,k=null,O=[T,I];e.length===3&&(k=j("c",e[2].dataType,e[2].dims.length),O.push(k));let z=re("output",e[0].dataType,c.length);O.push(z);let G=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${_.registerUniforms(G).declareVariables(...O)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${A}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${y}
    }

    ${S}
    ${k!=null?`let cOffset = ${k.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${A}(uniforms.beta) * ${k.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=_=>{let y=j("a",e[0].dataType,e[0].dims),S=j("b",e[1].dataType,e[1].dims),T=null,I=[y,S];e.length===3&&(T=j("c",e[2].dataType,e[2].dims.length),I.push(T));let A=re("output",e[0].dataType,c.length);I.push(A);let k=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],O="",z="";t.transA&&t.transB?(z=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,O="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(z=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,O="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(z=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,O="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(z=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,O="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let G=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${_.registerUniforms(k).declareVariables(...I)}
  var<workgroup> tile_a: array<array<${y.type.storage}, ${s}>, ${s}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${s}>, ${s}>;
  ${_.mainStart([s,s,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${s};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${s};
    let num_tiles = (uniforms.K - 1) / ${s} + 1;
    var k_start = 0u;
    var value = ${A.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${z}
      k_start = k_start + ${s};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${s}; k++) {
        ${O}
      }
      workgroupBarrier();
    }

    ${G}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${T!=null?`let cOffset = ${T.broadcastedIndicesToOffset("vec2(m, n)",A)}; value += ${A.type.value}(uniforms.beta) * ${T.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return a?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:c,dataType:e[0].dataType}],dispatchGroup:{x:r*i},programUniforms:h}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:c,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:h}),getShaderSource:b}},N1=e=>{let t=e.transA,n=e.transB,o=e.alpha,u=e.beta;return{transA:t,transB:n,alpha:o,beta:u,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},z1=(e,t)=>{Wg(e.inputs),e.compute(Kg(e.inputs,t))}}),Lt,Zt,Rr,Nr,Xg,Zg,Jg,Yg,Qg,eb,tb,rb,B1,M1,CA=R(()=>{"use strict";se(),ae(),Ue(),ue(),[Lt,Zt,Rr,Nr]=[0,1,2,3],Xg=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Zg=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Jg=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Yg=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Qg=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,eb=(e,t,n)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Lt}] = batch;
     indices[${Zt}] = channel;`+(()=>{switch(n.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Rr}] = u32(r);
            indices[${Nr}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Rr}] = u32(clamp(r, 0, H - 1));
          indices[${Nr}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Rr}] = gs_reflect(r, border[1], border[3]);
          indices[${Nr}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${n.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,tb=(e,t,n)=>(()=>{switch(n.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Lt}], indices[${Zt}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Lt}], indices[${Zt}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Lt}], indices[${Zt}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Lt}], indices[${Zt}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Lt}], indices[${Zt}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Lt}], indices[${Zt}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${n.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,rb=(e,t)=>{let n=j("x",e[0].dataType,e[0].dims.length),o=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],u=j("grid",e[1].dataType,o.length,2),l=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(l=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Lt,Zt,Rr,Nr]=[0,3,1,2]);let d=re("output",e[0].dataType,l.length),c=n.type.value,s=B.size(l),r=[{type:12,data:s},...oe(e[0].dims,o,l)],i=a=>`
  ${a.registerUniform("output_size","u32").declareVariables(n,u,d)}
  ${Zg}
  ${Jg(c)}
  ${Yg(t)}
  ${Qg(t)}
  ${eb(n,c,t)}

  ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Rr}]);
      let W_in = i32(uniforms.x_shape[${Nr}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${d.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Lt}], indices[${Rr}], indices[${Nr}]);
      let nxy = ${u.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${tb(d,c,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:a=>{let p=B.size(l);return{outputs:[{dims:l,dataType:a[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:r}},getShaderSource:i}},B1=(e,t)=>{Xg(e.inputs),e.compute(rb(e.inputs,t))},M1=e=>Se({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),st,nb,F1,Wa,ib,gi,j1,L1=R(()=>{"use strict";se(),ae(),Ue(),Ml(),Ll(),ue(),xr(),st=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,nb=(e,t)=>{let n=e[0],o=st(e,1),u=st(e,2),l=st(e,3),d=st(e,4),c=st(e,5),s=st(e,6),r=st(e,7);if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let i=n.dims[0],a=n.dims[1],p=n.dims.length===3?n.dims[2]:t.numHeads*n.dims[4],h=a,m=0,b=0,x=Math.floor(p/t.numHeads);if(s&&r&&B.size(s.dims)&&B.size(r.dims)){if(s.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims[0]!==i||s.dims[1]!==t.numHeads||s.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(r.dims[0]!==i||r.dims[1]!==t.numHeads||r.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(s.dims[2]!==r.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(r.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=s.dims[2],b=s.dims[2]}else if(s&&B.size(s.dims)||r&&B.size(r.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _;if(o&&B.size(o.dims)>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(o.dims.length<3||o.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(o.dims.length===3){if(o.dims[2]!==n.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');_=2,h=o.dims[1]}else if(o.dims.length===5){if(o.dims[2]!==t.numHeads||o.dims[3]!==2||o.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(u)throw new Error('Expect "value" be none when "key" has packed kv format.');_=5,h=o.dims[1]}else{if(o.dims[1]!==t.numHeads||o.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');_=0,h=o.dims[2]}}else{if(n.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(n.dims[2]!==t.numHeads||n.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}if(l&&B.size(l.dims)>0){if(l.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(o&&o.dims.length===5&&o.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let y=m+h,S=0;if(d&&B.size(d.dims)>0){S=8;let k=d.dims;throw k.length===1?k[0]===i?S=1:k[0]===3*i+2&&(S=3):k.length===2&&k[0]===i&&k[1]===y&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let T=!1,I=p;if(u&&B.size(u.dims)>0){if(u.dims.length!==3&&u.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==u.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(u.dims.length===3){if(h!==u.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=u.dims[2]}else{if(h!==u.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=u.dims[1]*u.dims[3],T=!0}}let A=!1;if(d&&B.size(d.dims)>0)throw new Error("Key padding mask is not supported");if(c&&B.size(c.dims)>0){if(c.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(c.dims[0]!==i||c.dims[1]!==t.numHeads||c.dims[2]!==a||c.dims[3]!==y)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:i,sequenceLength:a,pastSequenceLength:m,kvSequenceLength:h,totalSequenceLength:y,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:p,vHiddenSize:I,headSize:x,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:A,passPastInKv:T,qkvFormat:_}},F1=e=>Se({...e}),Wa=Se({perm:[0,2,1,3]}),ib=(e,t,n,o,u,l,d)=>{let c=[o,u,l],s=B.size(c),r=[{type:12,data:s},{type:12,data:d},{type:12,data:l}],i=a=>{let p=re("qkv_with_bias",t.dataType,c),h=j("qkv",t.dataType,c),m=j("bias",n.dataType,c),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${a.registerUniforms(b).declareVariables(h,m,p)}
  ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:c,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:r}),getShaderSource:i},{inputs:[t,n],outputs:[-1]})[0]},gi=(e,t,n,o,u,l,d,c)=>{let s=l;if(d&&B.size(d.dims)>0){if(o===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return s=ib(e,l,d,t,o,n*u,c),s=s.reshape([t,o,n,u]),n===1||o===1?s:e.compute(bt(s,Wa.perm),{inputs:[s],outputs:[-1]})[0]}else return l.dims.length===3&&(s=l.reshape([t,o,n,u])),n===1||o===1?s:e.compute(bt(s,Wa.perm),{inputs:[s],outputs:[-1]})[0]},j1=(e,t)=>{let n=nb(e.inputs,t),o=e.inputs[0],u=st(e.inputs,1),l=st(e.inputs,2),d=st(e.inputs,3),c=st(e.inputs,4),s=st(e.inputs,5),r=st(e.inputs,6),i=st(e.inputs,7);if(o.dims.length===5)throw new Error("Packed QKV is not implemented");if(u?.dims.length===5)throw new Error("Packed KV is not implemented");let a=u&&l&&u.dims.length===4&&l.dims.length===4,p=gi(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,o,d,0);if(a)return Si(e,p,u,l,c,void 0,r,i,s,n);if(!u||!l)throw new Error("key and value must be provided");let h=gi(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.headSize,u,d,n.hiddenSize),m=gi(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.vHeadSize,l,d,2*n.hiddenSize);Si(e,p,h,m,c,void 0,r,i,s,n)}}),ob,sb,ab,ub,ml,V1,U1,G1=R(()=>{"use strict";se(),ae(),Ue(),ue(),ob=e=>{if(!e||e.length<1)throw new Error("too few inputs")},sb=(e,t)=>{let n=[],o=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(u=>n.push(Number(u))),o=n.length),Se({numOutputs:o,axis:t.axis,splitSizes:n})},ab=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${ne("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,ub=e=>{let t=e.length,n=[];for(let o=0;o<t;++o){let u=e[o].setByIndices("indices","input[global_idx]");t===1?n.push(u):o===0?n.push(`if (output_number == ${o}u) { ${u} }`):o===t-1?n.push(`else { ${u} }`):n.push(`else if (output_number == ${o}) { ${u} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${n.join(`
`)}
      }`},ml=(e,t)=>{let n=e[0].dims,o=B.size(n),u=e[0].dataType,l=B.normalizeAxis(t.axis,n.length),d=new Array(t.numOutputs),c=j("input",u,n.length),s=new Array(t.numOutputs),r=[],i=[],a=0,p=[{type:12,data:o}];for(let m=0;m<t.numOutputs;m++){a+=t.splitSizes[m],s[m]=a;let b=n.slice();b[l]=t.splitSizes[m],i.push(b),d[m]=re(`output${m}`,u,b.length),r.push({dims:i[m],dataType:e[0].dataType})}p.push({type:12,data:s},...oe(n,...i));let h=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",s.length).declareVariables(c,...d)}
  ${ab(s.length)}
  ${ub(d)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${c.offsetToIndices("global_idx")};
    var index = ${c.indicesGet("indices",l)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${ne("uniforms.size_in_split_axis","output_number - 1u",s.length)};
      ${c.indicesSet("indices",l,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:h,getRunData:()=>({outputs:r,dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p})}},V1=(e,t)=>{ob(e.inputs);let n=e.inputs.length===1?t:sb(e.inputs,t);e.compute(ml(e.inputs,n),{inputs:[0]})},U1=e=>{let t=e.axis,n=e.splitSizes,o=e.numOutputs<0?n.length:e.numOutputs;if(o!==n.length)throw new Error("numOutputs and splitSizes length must be equal");return Se({axis:t,numOutputs:o,splitSizes:n})}}),lb,ko,q1,H1=R(()=>{"use strict";se(),ae(),Ue(),ue(),lb=(e,t)=>{let[n,o,u,l]=e,{numHeads:d,rotaryEmbeddingDim:c}=t;if(n.dims.length!==3&&n.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${n.dims.length}`);if(!B.areEqual(o.dims,[])&&!B.areEqual(o.dims,[1])&&o.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${o.dims.length}`);if(u.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${u.dims.length}`);if(l.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${l.dims.length}`);if(!B.areEqual(u.dims,l.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(c>0&&d===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let s=n.dims[0],r=n.dims[n.dims.length-2],i=u.dims[0],a=B.sizeFromDimension(n.dims,1)/r,p=c===0?u.dims[1]*2:a/d;if(c>p)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(o.dims.length===2){if(s!==o.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${o.dims[0]}`);if(r!==o.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${o.dims[1]}`)}if(r>i)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(p/2!==u.dims[1]&&c/2!==u.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${u.dims[1]}`)},ko=(e,t)=>{let{interleaved:n,numHeads:o,rotaryEmbeddingDim:u,scale:l}=t,d=e[0].dims[0],c=B.sizeFromDimension(e[0].dims,1),s=e[0].dims[e[0].dims.length-2],r=c/s,i=e[2].dims[1],a=u===0?i*2:r/o,p=new Array(d,s,r/a,a-i),h=B.computeStrides(p),m=[{type:1,data:l},{type:12,data:p},{type:12,data:h},...e[0].dims.length===3?new Array({type:12,data:[c,r,a,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[c,a,s*a,1]}):[],...oe(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=x=>{let _=j("input",e[0].dataType,e[0].dims.length),y=j("position_ids",e[1].dataType,e[1].dims.length),S=j("cos_cache",e[2].dataType,e[2].dims.length),T=j("sin_cache",e[3].dataType,e[3].dims.length),I=re("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:p.length},{name:"global_strides",type:"u32",length:h.length},{name:"input_output_strides",type:"u32",length:h.length}]),`
        ${x.declareVariables(_,y,S,T,I)}

        ${x.mainStart(On)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${y.broadcastedIndicesToOffset("bsnh.xy",re("",y.type.tensor,2))};
            let position_id =
                u32(${y.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${n});
            let j = i + select(half_rotary_emb_dim, 1, ${n});
            let re = ${_.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${_.getByOffset("j")} * ${T.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${_.getByOffset("i")} * ${T.get("position_id","bsnh[3]")} +
                ${_.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",_.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:Se({interleaved:n}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(B.size(p)/On)},programUniforms:m})}},q1=(e,t)=>{lb(e.inputs,t),e.compute(ko(e.inputs,t))}}),db,cb,Ka,pb,W1,DA=R(()=>{"use strict";Ue(),se(),Ll(),L1(),G1(),xr(),H1(),ue(),db=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let n=e[0],o=e[1],u=e[2],l=e[3],d=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=!1,s=n.dims[0],r=n.dims[1],i=n.dims.length===3?c?n.dims[2]/3:n.dims[2]:t.numHeads*n.dims[4],a=r,p=0,h=!o||o.dims.length===0,m=Math.floor(h?i/(t.numHeads+2*t.kvNumHeads):i/t.numHeads);h&&(i=m*t.numHeads);let b=l&&l.dims.length!==0,x=d&&d.dims.length!==0;if(b&&l.dims.length===4&&l.dims[0]===s&&l.dims[1]!==t.kvNumHeads&&l.dims[2]===t.kvNumHeads&&l.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&x){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');p=l.dims[2]}else if(b||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _=1;if(o&&o.dims.length>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(o.dims.length<3||o.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(o.dims.length===3){if(n.dims[2]%o.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');a=o.dims[1]}else if(o.dims.length===5){if(o.dims[2]!==t.numHeads||o.dims[3]!==2||o.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(u)throw new Error('Expect "value" be none when "key" has packed kv format.');a=o.dims[1]}else{if(o.dims[1]!==t.numHeads||o.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');a=o.dims[2]}}else{if(n.dims.length!==3&&n.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(n.dims.length===5&&(n.dims[2]!==t.numHeads||n.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}let y=0,S=!1,T=t.kvNumHeads?m*t.kvNumHeads:i;if(u&&u.dims.length>0){if(u.dims.length!==3&&u.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==u.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(u.dims.length===3){if(a!==u.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');T=u.dims[2]}else{if(a!==u.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');T=u.dims[1]*u.dims[3],S=!0}}let I=e.length>4?e[5]:void 0;if(I){if(I.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let A=I.dims.reduce((k,O)=>k*O,1);if(A!==s)throw new Error(`seqlens_k must have batch_size (${s}) elements, got ${A}.`);for(let k=0;k<I.dims.length;k++)if(I.dims[k]!==1&&I.dims[k]!==s)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${s}), got dims[${k}] = ${I.dims[k]}.`)}return{batchSize:s,sequenceLength:r,pastSequenceLength:p,kvSequenceLength:a,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:i,vHiddenSize:T,headSize:m,vHeadSize:Math.floor(T/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:_}},cb=Se({perm:[0,2,1,3]}),Ka=(e,t,n)=>{let o=t,u=n.kvNumHeads;return t.dims.length===3&&n.kvSequenceLength!==0&&(o=t.reshape([n.batchSize,n.kvSequenceLength,u,n.headSize]),o=e.compute(bt(o,cb.perm),{inputs:[o],outputs:[-1]})[0]),o},pb=(e,t,n,o)=>{let u=7,l=["type","type"],d=[e*t],c=e*t,s=[{type:12,data:c},{type:12,data:t},{type:12,data:e}],r=i=>{let a=j("seq_lens",n.dataType,n.dims),p=j("total_seq_lens",o.dataType,o.dims),h=re("pos_ids",u,d),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${i.registerUniforms(m).declareVariables(a,p,h)}
  ${i.mainStart()}
    ${i.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${p.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${a.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${h.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${h.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${h.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:d,dataType:u}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:s}),getShaderSource:r}},W1=(e,t)=>{if(e.inputs.length>14&&e.inputs[14]||e.inputs.length>15&&e.inputs[15])throw new Error("GroupQueryAttention (JSEP): q_norm_weight / k_norm_weight inputs are not supported. The per-head Q/K RMS normalization prologue is implemented only on the CUDA and native WebGPU EPs.");let n=db(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let o=e.inputs[0],u=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,l=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,d=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,c=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,s=e.inputs.length>4?e.inputs[5]:void 0,r=e.inputs.length>5?e.inputs[6]:void 0,i=n.kvNumHeads?n.kvNumHeads:n.numHeads,a=Se({axis:2,numOutputs:3,splitSizes:[n.numHeads*n.headSize,i*n.headSize,i*n.headSize]}),[p,h,m]=!u&&!l?e.compute(ml([o],a),{inputs:[o],outputs:[-1,-1,-1]}):[o,u,l],b,x;if(t.doRotary){let T=e.compute(pb(n.batchSize,n.sequenceLength,s,r),{inputs:[s,r],outputs:[-1]})[0],I=e.inputs[7],A=e.inputs[8],k=Se({interleaved:t.rotaryInterleaved!==0,numHeads:n.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),O=[p,T,I,A],z=[-1];b=e.compute(ko(O,k),{inputs:O,outputs:z})[0],O.splice(0,1,h);let G=Se({interleaved:t.rotaryInterleaved!==0,numHeads:n.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(ko(O,G),{inputs:O,outputs:z})[0]}let _=gi(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,t.doRotary?b:p,void 0,0),y=Ka(e,t.doRotary?x:h,n),S=Ka(e,m,n);Si(e,_,y,S,void 0,void 0,d,c,void 0,n,s,r)}}),Xa,hb,fb,K1,RA=R(()=>{"use strict";se(),ae(),xr(),ue(),Xa=(e,t,n,o,u,l,d,c)=>{let s=Ve(l),r=s===1?"f32":`vec${s}f`,i=s===1?"vec2f":`mat2x${s}f`,a=u*d,p=64;a===1&&(p=256);let h=[u,d,l/s],m=[u,d,2],b=["rank","type","type"],x=[];x.push(...oe(h,m));let _=y=>{let S=j("x",t.dataType,3,s),T=j("scale",n.dataType,n.dims),I=j("bias",o.dataType,o.dims),A=re("output",1,3,2),k=[S,T,I,A];return`
  var<workgroup> workgroup_shared : array<${i}, ${p}>;
  const workgroup_size = ${p}u;
  ${y.declareVariables(...k)}
  ${y.mainStart(p)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${r}(0);
    var squared_sum = ${r}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${r}(${S.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${i}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${wr("workgroup_shared[0][0]",s)} / f32(hight * ${s});
      let squared_sum_final = ${wr("workgroup_shared[0][1]",s)} / f32(hight * ${s});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${c}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${s};${c};${p}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:a},programUniforms:x}),getShaderSource:_},{inputs:[t,n,o],outputs:[-1]})[0]},hb=(e,t,n)=>{let o=t[0].dims,u=o,l=2,d=o[0],c=o[1],s=B.sizeFromDimension(o,l),r=Ve(s),i=B.size(u)/r,a=Xa(e,t[0],t[1],t[2],d,s,c,n.epsilon),p=[d,c,s/r],h=[d,c],m=["type","none"],b=x=>{let _=j("x",t[0].dataType,p.length,r),y=j("scale_shift",1,h.length,2),S=re("output",t[0].dataType,p.length,r),T=[_,y,S];return`
  ${x.registerUniform("output_size","u32").declareVariables(...T)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${y.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${_.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${r}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:u,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},...oe(p,h,p)]}),getShaderSource:b},{inputs:[t[0],a]})},fb=(e,t,n)=>{let o=t[0].dims,u=o,l=o[0],d=o[o.length-1],c=B.sizeFromDimension(o,1)/d,s=Ve(d),r=B.size(u)/s,i=[{type:12,data:c},{type:12,data:Math.floor(d/s)}],a=["type","type"],p=!1,h=[0,o.length-1];for(let _=0;_<o.length-2;_++)p=p||o[_+1]!==1,h.push(_+1);p=p&&o[o.length-1]!==1;let m=p?e.compute(bt(e.inputs[0],h),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:o.length},(_,y)=>o[h[y]])),b=Xa(e,m,t[1],t[2],l,c,d,n.epsilon),x=_=>{let y=Ye(t[0].dataType),S=s===1?"vec2f":`mat${s}x2f`,T=k=>{let O=k===0?"x":"y",z=s===1?"f32":`vec${s}f`;switch(s){case 1:return`${y}(${z}(scale.${O}))`;case 2:return`vec2<${y}>(${z}(scale[0].${O}, scale[1].${O}))`;case 4:return`vec4<${y}>(${z}(scale[0].${O}, scale[1].${O}, scale[2].${O}, scale[3].${O}))`;default:throw new Error(`Not supported compoents ${s}`)}},I=j("input",t[0].dataType,t[0].dims,s),A=re("output",t[0].dataType,u,s);return`
  @group(0) @binding(0) var<storage, read> input : array<${I.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${S}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${A.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${_.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${T(0)}, ${T(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${s}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:u,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:i}),getShaderSource:x},{inputs:[t[0],b]})},K1=(e,t)=>{t.format==="NHWC"?fb(e,e.inputs,t):hb(e,e.inputs,t)}}),mb,gb,X1,NA=R(()=>{"use strict";se(),ae(),ue(),mb=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},gb=(e,t,n)=>{let o=t.simplified,u=e[0].dims,l=e[1],d=!o&&e[2],c=u,s=B.normalizeAxis(t.axis,u.length),r=B.sizeToDimension(u,s),i=B.sizeFromDimension(u,s),a=B.size(l.dims),p=d?B.size(d.dims):0;if(a!==i||d&&p!==i)throw new Error(`Size of X.shape()[axis:] == ${i}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${a} and bias size of ${p}`);let h=[];for(let I=0;I<u.length;++I)I<s?h.push(u[I]):h.push(1);let m=Ve(i),b=["type","type"],x=[{type:12,data:r},{type:1,data:i},{type:12,data:Math.floor(i/m)},{type:1,data:t.epsilon}];d&&b.push("type");let _=n>1,y=n>2,S=I=>{let A=Ye(e[0].dataType),k=[j("x",e[0].dataType,e[0].dims,m),j("scale",l.dataType,l.dims,m)];d&&k.push(j("bias",d.dataType,d.dims,m)),k.push(re("output",e[0].dataType,c,m)),_&&k.push(re("mean_data_output",1,h)),y&&k.push(re("inv_std_output",1,h));let O=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(O).declareVariables(...k)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${sl("f32",m)};
    var mean_square_vector = ${sl("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${$n(A,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${wr("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${wr("mean_square_vector",m)} / uniforms.norm_size ${o?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${$n(A,m,"x[j + offset]")};
      let f32scale = ${$n(A,m,"scale[j]")};
      output[j + offset] = ${k[0].type.value}((f32input ${o?"":"- mean"}) * inv_std_dev * f32scale
        ${d?`+ ${$n(A,m,"bias[j]")}`:""}
      );
    }

    ${_?"mean_data_output[global_idx] = mean":""};
    ${y?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},T=[{dims:c,dataType:e[0].dataType}];return _&&T.push({dims:h,dataType:1}),y&&T.push({dims:h,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${n};${o}`,inputDependencies:b},getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(r/64)},programUniforms:x}),getShaderSource:S}},X1=(e,t)=>{mb(e.inputs),e.compute(gb(e.inputs,t,e.outputCount))}}),bb,Z1,zA=R(()=>{"use strict";ae(),Hl(),Wl(),bb=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Z1=e=>{bb(e.inputs);let t=In.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let n=t[t.length-1],o=e.inputs[0].dims[e.inputs[0].dims.length-1];if(n<8&&o<8)e.compute(ql(e.inputs,{activation:""},t));else{let u=t[t.length-2],l=B.size(e.inputs[0].dims.slice(0,-2)),d=B.size(e.inputs[1].dims.slice(0,-2));if(l!==1&&u===1&&d===1){let c=e.inputs[0].reshape([1,l,o]),s=e.inputs[1].reshape([1,o,n]),r=[1,l,n],i=[c,s];e.compute(Po(i,{activation:""},t,r),{inputs:i})}else e.compute(Po(e.inputs,{activation:""},t))}}}),yb,_b,wb,J1,Y1,BA=R(()=>{"use strict";se(),ae(),Ue(),ue(),yb=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let n=e[0],o=n.dims.length;if(n.dims[o-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let u=Math.floor((t.k+t.blockSize-1)/t.blockSize),l=t.blockSize/8*t.bits,d=e[1];if(!B.areEqual(d.dims,[t.n,u,l]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let c=e[2].dims;if(B.size(c)!==t.n*u)throw new Error("scales input size error.");if(e.length===4){let s=e[3].dims,r=t.n*(t.bits===8?u:Math.floor((u*t.bits+7)/8));if(B.size(s)!==r)throw new Error("zeroPoints input size error.")}},_b=(e,t)=>{let n=e[0].dims,o=n.length,u=n[o-2],l=t.k,d=t.n,c=n.slice(0,o-2),s=B.size(c),r=e[1].dims[2]/4,i=e[0].dataType,a=Ve(t.k),p=Ve(r),h=Ve(d),m=c.concat([u,d]),b=u>1&&d/h%2===0?2:1,x=B.size(m)/h/b,_=64,y=[],S=[s,u,l/a],T=B.convertShape(e[1].dims).slice();T.splice(-1,1,r/p),y.push(...oe(S)),y.push(...oe(T)),y.push(...oe(e[2].dims)),e.length===4&&y.push(...oe(B.convertShape(e[3].dims)));let I=[s,u,d/h];y.push(...oe(I));let A=k=>{let O=S.length,z=j("a",e[0].dataType,O,a),G=j("b",12,T.length,p),Y=j("scales",e[2].dataType,e[2].dims.length),W=[z,G,Y],D=e.length===4?j("zero_points",12,e[3].dims.length):void 0;D&&W.push(D);let Q=I.length,w=re("output",e[0].dataType,Q,h),C=Ye(e[0].dataType),F=(()=>{switch(a){case 1:return`array<${C}, 8>`;case 2:return`mat4x2<${C}>`;case 4:return`mat2x4<${C}>`;default:throw new Error(`${a}-component is not supported.`)}})(),V=Math.floor(32/t.bits),U=Math.floor(V/8),q=()=>{let X="";for(let H=0;H<U;H++){let pe=H*t.bits*4,fe=pe+t.bits;X+=`
          // reuse a data (pass ${H})
            var input_offset${H>0?H:""} = ${H===0?z.indicesToOffset(`${z.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${H>0?H:""}: ${F};
            for (var j${H>0?H:""}: u32 = 0; j${H>0?H:""} < ${8/a}; j${H>0?H:""}++) {
              a_data${H>0?H:""}[j${H>0?H:""}] = ${z.getByOffset(`input_offset${H>0?H:""}`)};
              input_offset${H>0?H:""}++;
            }
          `;for(let ye=0;ye<h*b;ye++)X+=`
            b_value = ${p===1?`b${ye}_data`:`b${ye}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${H*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${pe}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${fe}u) & b_mask);`}
            b_quantized_values = ${F}(${Array.from({length:4},(Me,Oe)=>`${C}(b_value_lower[${Oe}]), ${C}(b_value_upper[${Oe}])`).join(", ")});
            b_dequantized_values = ${a===1?`${F}(${Array.from({length:8},(Me,Oe)=>`(b_quantized_values[${Oe}] - ${D?`zero_point${ye}`:"zero_point"}) * scale${ye}`).join(", ")});`:`(b_quantized_values - ${F}(${Array(8).fill(`${D?`zero_point${ye}`:"zero_point"}`).join(",")})) * scale${ye};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(ye/h)}]${h>1?`[${ye%h}]`:""} += ${Array.from({length:8/a},(Me,Oe)=>`${a===1?`a_data${H>0?H:""}[${Oe}] * b_dequantized_values[${Oe}]`:`dot(a_data${H>0?H:""}[${Oe}], b_dequantized_values[${Oe}])`}`).join(" + ")};
          `}return X},M=()=>{let X=`
            var col_index = col * ${h};
            ${D?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${C}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let H=0;H<h*b;H++)X+=`
            let scale${H} = ${Y.getByOffset("col_index * nBlocksPerCol + block")};
            ${D?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${D.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${H} = ${C}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return X},Z=()=>{let X=`col_index = col * ${h};`;for(let H=0;H<h*b;H++)X+=`
            let b${H}_data = ${G.getByIndices(`${G.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return X+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${F};
            var b_dequantized_values: ${F};`,X};return`
        var<workgroup> workgroup_shared: array<${w.type.value}, ${b*_}>;
        ${k.declareVariables(...W,w)}
        ${k.mainStart([_,1,1])}
          let output_indices = ${w.offsetToIndices(`(global_idx / ${_}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${_}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/a};
            ${M()}
            for (var word: u32 = 0; word < ${r}; word += ${p}) {
              ${Z()}
              for (var i: u32 = 0; i < ${p}; i++) {
                ${q()}
                word_offset += ${V/a};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${w.type.value} = ${w.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${_}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${w.setByIndices(`${w.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${a};${p};${h};${b};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:i}],dispatchGroup:{x},programUniforms:y}),getShaderSource:A}},wb=(e,t)=>{let n=e[0].dims,o=n.length,u=n[o-2],l=t.k,d=t.n,c=n.slice(0,o-2),s=B.size(c),r=e[1].dims[2]/4,i=e[0].dataType,a=Ve(t.k),p=Ve(r),h=c.concat([u,d]),m=128,b=d%8===0?8:d%4===0?4:1,x=m/b,_=Math.floor(32/t.bits),y=x*p*_,S=y/a,T=y/t.blockSize,I=B.size(h)/b,A=[],k=[s,u,l/a],O=B.convertShape(e[1].dims).slice();O.splice(-1,1,r/p),A.push(...oe(k)),A.push(...oe(O)),A.push(...oe(e[2].dims)),e.length===4&&A.push(...oe(B.convertShape(e[3].dims)));let z=[s,u,d];A.push(...oe(z));let G=Y=>{let W=k.length,D=j("a",e[0].dataType,W,a),Q=j("b",12,O.length,p),w=j("scales",e[2].dataType,e[2].dims.length),C=[D,Q,w],F=e.length===4?j("zero_points",12,e[3].dims.length):void 0;F&&C.push(F);let V=z.length,U=re("output",e[0].dataType,V),q=Ye(e[0].dataType),M=()=>{switch(a){case 1:return`
          let a_data0 = vec4<${q}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${q}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${q}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${q}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${a}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${D.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${U.type.value}, ${x}>, ${b}>;
        ${Y.declareVariables(...C,U)}
        ${Y.mainStart([x,b,1])}
          let output_indices = ${U.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${T} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${S};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${S}; a_offset += ${m})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${D.getByIndices(`${D.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${D.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${T} + local_id.x;
            ${F?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${F.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${q}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${q}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${w.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${Q.getByIndices(`${Q.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/a};
            for (var i: u32 = 0; i < ${p}; i++) {
              let b_value = ${p===1?"b_data":"b_data[i]"};
              ${(()=>{let Z=Math.floor(_/8),X="";for(let H=0;H<Z;H++){let pe=H*t.bits*4,fe=pe+t.bits;X+=`
              ${M()}
              {${t.bits===2?`
                let half_word = b_value >> ${H*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${pe}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${fe}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${q}>(${Array.from({length:4},(ye,Me)=>`${q}(b_value_lower[${Me}]), ${q}(b_value_upper[${Me}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${q}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(ye,Me)=>`${`dot(a_data${Me}, b_dequantized_values[${Me}])`}`).join(" + ")};
              }
              word_offset += ${8/a};`}return X})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${U.type.value} = ${U.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${U.setByIndices(`${U.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${a};${p};${x};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:h,dataType:i}],dispatchGroup:{x:I},programUniforms:A}),getShaderSource:G}},J1=(e,t)=>{yb(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(wb(e.inputs,t)):e.compute(_b(e.inputs,t))},Y1=e=>Se(e)}),vb,xb,$b,Tb,Sb,Ib,Ob,Eb,Q1,MA=R(()=>{"use strict";se(),ae(),ue(),vb=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},xb=(e,t,n)=>{let o="";for(let u=t-1;u>=0;--u)o+=`
            k = i32(${e.indicesGet("indices",u)}) - ${ne("uniforms.pads",u,n)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${ne("uniforms.x_shape",u,t)})) {
              break;
            }
            offset += k * i32(${ne("uniforms.x_strides",u,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${o}
            value = x[offset];
          }
      `},$b=(e,t,n)=>{let o="";for(let u=t-1;u>=0;--u)o+=`
                k = i32(${e.indicesGet("indices",u)}) - ${ne("uniforms.pads",u,n)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${ne("uniforms.x_shape",u,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${ne("uniforms.x_shape",u,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${ne("uniforms.x_strides",u,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${o}
              value = x[offset];
          `},Tb=(e,t,n)=>{let o="";for(let u=t-1;u>=0;--u)o+=`
                k = i32(${e.indicesGet("indices",u)}) - ${ne("uniforms.pads",u,n)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${ne("uniforms.x_shape",u,t)})) {
                  k = i32(${ne("uniforms.x_shape",u,t)}) - 1;
                }
                offset += k * i32(${ne("uniforms.x_strides",u,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${o}
              value = x[offset];
          `},Sb=(e,t,n)=>{let o="";for(let u=t-1;u>=0;--u)o+=`
                k = i32(${e.indicesGet("indices",u)}) - ${ne("uniforms.pads",u,n)};
                if (k < 0)  {
                  k += i32(${ne("uniforms.x_shape",u,t)}]);
                }
                if (k >= i32(${ne("uniforms.x_shape",u,t)})) {
                  k -= i32(${ne("uniforms.x_shape",u,t)});
                }
                offset += k * i32(${ne("uniforms.x_strides",u,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${o}
              value = x[offset];
          `},Ib=(e,t,n)=>{switch(n.mode){case 0:return xb(e,t,n.pads.length);case 1:return $b(e,t,n.pads.length);case 2:return Tb(e,t,n.pads.length);case 3:return Sb(e,t,n.pads.length);default:throw new Error("Invalid mode")}},Ob=(e,t)=>{let n=B.padShape(e[0].dims.slice(),t.pads),o=e[0].dims,u=B.size(n),l=[{type:12,data:u},{type:6,data:t.pads}],d=e.length>=3&&e[2].data;t.mode===0&&l.push({type:d?e[2].dataType:1,data:t.value}),l.push(...oe(e[0].dims,n));let c=["rank"],s=r=>{let i=re("output",e[0].dataType,n.length),a=j("x",e[0].dataType,o.length),p=a.type.value,h=Ib(i,o.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:d?p:"f32"}),`
            ${r.registerUniforms(m).declareVariables(a,i)}
            ${r.mainStart()}
            ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${i.offsetToIndices("global_idx")};

            var value = ${p}(0);
            ${h}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${d}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(B.size(n)/64)},programUniforms:l}),getShaderSource:s}},Eb=(e,t)=>{if(e.length>1){let n=e[1].getBigInt64Array(),o=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,u=e[0].dims.length,l=new Int32Array(2*u).fill(0);if(e.length>=4){let c=e[3].getBigInt64Array();for(let s=0;s<c.length;s++)l[Number(c[s])]=Number(n[s]),l[Number(c[s])+u]=Number(n[s+c.length])}else n.forEach((c,s)=>l[Number(s)]=Number(c));let d=[];return l.forEach(c=>d.push(c)),{mode:t.mode,value:o,pads:d}}else return t},Q1=(e,t)=>{vb(e.inputs);let n=Eb(e.inputs,t);e.compute(Ob(e.inputs,n),{inputs:[0]})}}),oi,Za,Ja,Ya,Qa,Ab,Pb,eu,tu,e2,t2,ru,r2,n2,nu,i2,o2,s2,a2,FA=R(()=>{"use strict";ot(),se(),ae(),ue(),oi=e=>{if(le.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Za=(e,t,n)=>{let o=t.format==="NHWC",u=e.dims.slice();o&&u.splice(1,0,u.pop());let l=Object.hasOwnProperty.call(t,"dilations"),d=t.kernelShape.slice(),c=t.strides.slice(),s=l?t.dilations.slice():[],r=t.pads.slice();Eo.adjustPoolAttributes(n,u,d,c,s,r);let i=Eo.computePoolOutputShape(n,u,c,s,d,r,t.autoPad,t.ceilMode),a=Object.assign({},t);l?Object.assign(a,{kernelShape:d,strides:c,pads:r,dilations:s,cacheKey:t.cacheKey}):Object.assign(a,{kernelShape:d,strides:c,pads:r,cacheKey:t.cacheKey});let p=i.slice();return p.push(p.splice(1,1)[0]),[a,o?p:i]},Ja=(e,t)=>{let n=t.format==="NHWC",o=B.size(e),u=B.size(t.kernelShape),l=[{type:12,data:o},{type:12,data:u}],d=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let c=t.kernelShape[t.kernelShape.length-1],s=t.strides[t.strides.length-1],r=t.pads[t.pads.length/2-1],i=t.pads[t.pads.length-1],a=!!(r+i);l.push({type:12,data:c},{type:12,data:s},{type:12,data:r},{type:12,data:i}),d.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let p=!1;if(t.kernelShape.length===2){let h=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];p=!!(b+x),l.push({type:12,data:h},{type:12,data:m},{type:12,data:b},{type:12,data:x}),d.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[l,d,!0,a,p]}else{if(n)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let c=B.computeStrides(t.kernelShape);l.push({type:12,data:c},{type:12,data:t.pads},{type:12,data:t.strides}),d.push({name:"kernelStrides",type:"u32",length:c.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let s=t.pads.reduce((r,i)=>r+i);return[l,d,!!s,!1,!1]}},Ya=(e,t,n,o,u,l,d,c,s,r,i,a)=>{let p=u.format==="NHWC",h=t.type.value,m=re("output",t.type.tensor,o);if(u.kernelShape.length<=2){let b="",x="",_="",y=n-(p?2:1);if(i?b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${y}] = indices[${y}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${y}] < 0 || xIndices[${y}]
                      >= uniforms.x_shape[${y}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${l}
                }`:b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${y}] = indices[${y}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${l}
                }`,u.kernelShape.length===2){let S=n-(p?3:2);a?x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                `,_=`
              }
            `}return`
            ${e.registerUniforms(s).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${h}(${c});
              var pad = 0;
              ${x}
              ${b}
              ${_}
              ${d}

              output[global_idx] = value;
            }`}else{if(p)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=u.kernelShape.length,x=u.pads.length,_="";return r?_=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${l}
              }`:_=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${l}
            `,`
            ${e.registerUniforms(s).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var offsets: array<u32, ${b}>;

              var value = ${h}(${c});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${b-1}u; j++) {
                  offsets[j] = offset / ${ne("uniforms.kernelStrides","j",b)};
                  offset -= offsets[j] * ${ne("uniforms.kernelStrides","j",b)};
                }
                offsets[${b-1}] = offset;

                isPad = false;
                for (var j = ${n-b}u; j < ${n}u; j++) {
                  xIndices[j] = indices[j] * ${ne("uniforms.strides",`j - ${n-b}u`,b)}
                    + offsets[j - ${n-b}u] - ${ne("uniforms.pads","j - 2u",x)};
                  ${_}
              }
              ${d}

              output[global_idx] = value;
            }`}},Qa=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Ab=e=>`${Qa(e)};${e.countIncludePad}`,Pb=e=>`${Qa(e)};${e.storageOrder};${e.dilations}`,eu=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),tu=(e,t,n,o)=>{let[u,l]=Za(t,o,n),d=j("x",t.dataType,t.dims.length),c=d.type.value,s="value += x_val;",r="";u.countIncludePad?r+=`value /= ${c}(uniforms.kernelSize);`:r+=`value /= ${c}(i32(uniforms.kernelSize) - pad);`;let[i,a,p,h,m]=Ja(l,u);i.push(...oe(t.dims,l));let b=["rank"];return{name:e,shaderCache:{hint:`${o.cacheKey};${p};${h};${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:l,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(B.size(l)/64)},programUniforms:i}),getShaderSource:x=>Ya(x,d,t.dims.length,l.length,u,s,r,0,a,p,h,m)}},e2=e=>{let t=e.count_include_pad!==0,n=eu(e);if(n.ceilMode!==0)throw new Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding/divisor) is not yet implemented in the WebGPU AveragePool kernel");let o={countIncludePad:t,...n,cacheKey:""};return{...o,cacheKey:Ab(o)}},t2=(e,t)=>{oi(e.inputs),e.compute(tu("AveragePool",e.inputs[0],!1,t))},ru={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},r2=e=>{let t=e.format;return{format:t,...ru,cacheKey:t}},n2=(e,t)=>{oi(e.inputs),e.compute(tu("GlobalAveragePool",e.inputs[0],!0,t))},nu=(e,t,n,o)=>{let[u,l]=Za(t,o,n),d=`
      value = max(x_val, value);
    `,c="",s=j("x",t.dataType,t.dims.length),r=["rank"],[i,a,p,h,m]=Ja(l,u);return i.push(...oe(t.dims,l)),{name:e,shaderCache:{hint:`${o.cacheKey};${p};${h};${m}`,inputDependencies:r},getRunData:()=>({outputs:[{dims:l,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(B.size(l)/64)},programUniforms:i}),getShaderSource:b=>Ya(b,s,t.dims.length,l.length,u,d,c,t.dataType===10?-65504:-1e5,a,p,h,m)}},i2=(e,t)=>{oi(e.inputs),e.compute(nu("MaxPool",e.inputs[0],!1,t))},o2=e=>{let t=e.storage_order,n=e.dilations,o=eu(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(o.ceilMode!==0)throw new Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding) is not yet implemented in the WebGPU MaxPool kernel");let u={storageOrder:t,dilations:n,...o,cacheKey:""};return{...u,cacheKey:Pb(u)}},s2=e=>{let t=e.format;return{format:t,...ru,cacheKey:t}},a2=(e,t)=>{oi(e.inputs),e.compute(nu("GlobalMaxPool",e.inputs[0],!0,t))}}),kb,Cb,u2,l2,jA=R(()=>{"use strict";se(),ae(),Ue(),ue(),kb=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((n,o)=>n===e[2].dims[o]).reduce((n,o)=>n&&o,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((u,l)=>l===t.axis||u===e[0].dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let n=e[0].dims[t.axis],o=e[1].dims[t.axis];if(t.blockSize<Math.ceil(n/o)||t.blockSize>Math.ceil(n/(o-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Cb=(e,t)=>{let n=B.normalizeAxis(t.axis,e[0].dims.length),o=e[0].dataType,u=o===3,l=e[0].dims,d=e[1].dataType,c=B.size(l),s=o===3||o===2,r=s?[Math.ceil(B.size(e[0].dims)/4)]:e[0].dims,i=e[1].dims,a=e.length>2?e[2]:void 0,p=a?s?[Math.ceil(B.size(a.dims)/4)]:a.dims:void 0,h=i.length===0||i.length===1&&i[0]===1,m=h===!1&&i.length===1,b=Ve(c),x=h&&(!s||b===4),_=x?b:1,y=x&&!s?b:1,S=j("input",s?12:o,r.length,y),T=j("scale",d,i.length),I=a?j("zero_point",s?12:o,p.length):void 0,A=re("output",d,l.length,_),k=[S,T];I&&k.push(I);let O=[r,i];a&&O.push(p);let z=[{type:12,data:c/_},{type:12,data:n},{type:12,data:t.blockSize},...oe(...O,l)],G=Y=>{let W=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${Y.registerUniforms(W).declareVariables(...k,A)}
      ${Y.mainStart()}
          ${Y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${A.offsetToIndices("global_idx")};

          // Set input x
          ${s?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${u?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${_===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${h?`let scale_value= ${T.getByOffset("0")}`:m?`
            let scale_index = ${A.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${T.getByOffset("scale_index")};`:`
            var scale_indices: ${T.type.indices} = output_indices;
            let index = ${T.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${T.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${T.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?h?s?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:m?s?`
                let zero_point_index = ${A.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${A.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:s?`
                let zero_point_offset = ${T.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${s?u?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${A.setByOffset("global_idx",`${A.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:G,getRunData:()=>({outputs:[{dims:l,dataType:d}],dispatchGroup:{x:Math.ceil(c/_/64),y:1,z:1},programUniforms:z})}},u2=(e,t)=>{kb(e.inputs,t),e.compute(Cb(e.inputs,t))},l2=e=>Se({axis:e.axis,blockSize:e.blockSize})}),Db,Rb,d2,LA=R(()=>{"use strict";ot(),se(),ue(),Db=(e,t,n)=>{let o=e===t,u=e<t&&n<0,l=e>t&&n>0;if(o||u||l)throw new Error("Range these inputs' contents are invalid.")},Rb=(e,t,n,o)=>{let u=Math.abs(Math.ceil((t-e)/n)),l=[u],d=u,c=[{type:12,data:d},{type:o,data:e},{type:o,data:n},...oe(l)],s=r=>{let i=re("output",o,l.length),a=i.type.value,p=[{name:"outputSize",type:"u32"},{name:"start",type:a},{name:"delta",type:a}];return`
        ${r.registerUniforms(p).declareVariables(i)}
        ${r.mainStart()}
        ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${a}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${o}`},getShaderSource:s,getRunData:()=>({outputs:[{dims:l,dataType:o}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c})}},d2=e=>{let t=0,n=0,o=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],n=e.inputs[1].getInt32Array()[0],o=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],n=e.inputs[1].getFloat32Array()[0],o=e.inputs[2].getFloat32Array()[0]),le.webgpu.validateInputContent&&Db(t,n,o),e.compute(Rb(t,n,o,e.inputs[0].dataType),{inputs:[]})}}),Nb,zb,c2,p2,VA=R(()=>{"use strict";se(),ae(),Ue(),ue(),Nb=(e,t,n,o)=>{if(e!=="none"&&o!=="i32"&&o!=="u32"&&o!=="f32")throw new Error(`Input ${o} is not supported with reduction ${e}.`);let u=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,l=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${n};`;case"add":return o==="i32"||o==="u32"?`atomicAdd(&${t}, bitcast<${o}>(${n}));`:`
              ${u}bitcast<${o}>(oldValue) + (${n})${l}`;case"max":return o==="i32"||o==="u32"?`atomicMax(&${t}, bitcast<${o}>(${n}));`:`
                ${u}max(bitcast<f32>(oldValue), (${n}))${l}`;case"min":return o==="i32"||o==="u32"?`atomicMin(&${t}, bitcast<${o}>(${n}));`:`${u}min(bitcast<${o}>(oldValue), (${n}))${l}`;case"mul":return`${u}(bitcast<${o}>(oldValue) * (${n}))${l}`;default:throw new Error(`Reduction ${e} is not supported.`)}},zb=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n,l=1,d=Math.ceil(B.sizeToDimension(o,o.length-1)/l),c=o[o.length-1],s=B.sizeFromDimension(n,c),r=[{type:12,data:d},{type:12,data:c},{type:12,data:s},...oe(e[1].dims,e[2].dims,u)],i=a=>{let p=j("indices",e[1].dataType,e[1].dims.length),h=j("updates",e[2].dataType,e[2].dims.length,l),m=t.reduction!=="none"&&t.reduction!==""?Bv("output",e[0].dataType,u.length):re("output",e[0].dataType,u.length,l);return`
      ${a.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(p,h,m)}
      ${a.mainStart()}
        ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${Nb(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:r}),getShaderSource:i}},c2=e=>Se({reduction:e.reduction}),p2=(e,t)=>{e.compute(zb(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Bb,Mb,Fb,iu,jb,Lb,Vb,Ub,Gb,qb,Hb,Wb,ou,Kb,Xb,Zb,Jb,Yb,h2,f2,UA=R(()=>{"use strict";se(),ae(),Ue(),ue(),Bb=(e,t)=>{if(e.every(n=>n>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Mb=(e,t,n)=>{t.every(u=>u>=0&&u<n||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let o=new Array(n).fill(1);return t.forEach((u,l)=>o[u]=e[l]),o},Fb=(e,t,n,o,u,l)=>{let[d,c,s]=n>10?[1,2,3]:[-1,e.length>1?1:-1,-1],r=e[0].dims.length;if(d>0&&e.length>d&&e[d].dims.length>0)e[d].getFloat32Array().forEach(i=>l.push(i));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(c>0&&e.length>c&&e[c].dims.length===1&&e[c].dims[0]>0){if(e[c].getFloat32Array().forEach(i=>o.push(i)),o.length!==0&&o.length!==r&&n>=18&&o.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Bb(o,t),t.axes.length>0&&Mb(o,t.axes,r).forEach((i,a)=>o[a]=i)}if(s>0&&e.length>s&&e[s].dims.length===1&&e[s].dims[0]>0&&(e[s].getBigInt64Array().forEach(i=>u.push(Number(i))),u.length!==0&&u.length!==r&&n>=18&&u.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(o.length!==0&&o.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(u.length!==0&&u.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof o<"u"&&typeof u<"u"&&o.length>0&&u.length>r)throw new Error("Resize requires only of scales or sizes to be specified")},iu=(e,t,n,o)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${o}(big / (${n}));
  let fract = ${o}(big % (${n})) / ${o}(${n});
  return whole + fract;
`,jb=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${iu("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${iu("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Lb=(e,t,n)=>`fn getNearestPixelFromOriginal(xOriginal: ${n}, isDownSample: bool) -> ${n} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Vb=(e,t,n)=>{let o=new Array(n).fill(0).concat(new Array(n).fill(1)),u=e.length===0?o:e.slice();return t.length>0?(t.forEach((l,d)=>{o[l]=u[d],o[d+n]=u[t.length+d]}),o):u},Ub=(e,t,n,o)=>{let u=[];if(n.length>0)if(o.length>0){if(e.forEach(l=>u.push(l)),Math.max(...o)>e.length)throw new Error("axes is out of bound");o.forEach((l,d)=>u[l]=n[d])}else n.forEach(l=>u.push(l));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");u=e.map((l,d)=>Math.round(l*t[d]))}return u},Gb=(e,t,n)=>{let o=(()=>{switch(n.keepAspectRatioPolicy){case"not_larger":return n.axes.length>0?Math.min(...n.axes.map(l=>t[l]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return n.axes.length>0?Math.max(...n.axes.map(l=>t[l]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${n.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let u=e.slice();return n.axes.length>0?(n.axes.forEach(l=>t[l]=o),n.axes.forEach(l=>u[l]=Math.round(e[l]*t[l]))):(t.fill(o,0,t.length),u.forEach((l,d)=>u[d]=Math.round(l*t[d]))),u},qb=(e,t,n,o,u)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${n.length}> {
      var original_indices: array<${e.type.value}, ${n.length}>;
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${ne("uniforms.scales","i",o)};
        var roi_low = ${ne("uniforms.roi","i",u)};
        var roi_hi = ${ne("uniforms.roi",`i + ${t.length}`,u)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${ne("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${ne("uniforms.output_shape","i",n.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,Hb=(e,t,n,o,u,l,d)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${o.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${ne("uniforms.scales","i",u)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${ne("uniforms.roi","i",l)};
          var roi_hi = ${ne("uniforms.roi",`i + ${n.length}`,l)};
          var input_shape_i = ${ne("uniforms.input_shape","i",n.length)};
          var output_shape_i = ${ne("uniforms.output_shape","i",o.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${d} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Wb=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${ne("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,ou=(e,t,n,o)=>e.rank>o?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",n,"batch")};
`:"",Kb=(e,t,n,o,u)=>{let[l,d,c,s]=n.length===2?[-1,0,1,-1]:[0,2,3,1],r=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${r} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",d,`max(0, min(row, ${n[d]} - 1))`)};
      ${e.indicesSet("input_indices",c,`max(0, min(col, ${n[c]} - 1))`)};
      ${ou(e,s,l,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${r} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${r} = originalIndices[${d}];
      var col:${r} = originalIndices[${c}];
      ${o?`if (row < 0 || row > (${n[d]} - 1) || col < 0 || col > (${n[c]} - 1)) {
        return ${u};
      }`:""};
      row = max(0, min(row, ${n[d]} - 1));
      col = max(0, min(col, ${n[c]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${n.length>2?`u32(originalIndices[${s}])`:"0"};
      var batch: u32 =  ${n.length>2?`u32(originalIndices[${l}])`:"0"};
      var x11: ${r} = getInputValue(batch, channel, row1, col1);
      var x12: ${r} = getInputValue(batch, channel, row1, col2);
      var x21: ${r} = getInputValue(batch, channel, row2, col1);
      var x22: ${r} = getInputValue(batch, channel, row2, col2);
      var dx1: ${r} = abs(row - ${r}(row1));
      var dx2: ${r} = abs(${r}(row2) - row);
      var dy1: ${r} = abs(col - ${r}(col1));
      var dy2: ${r} = abs(${r}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Xb=(e,t,n,o,u,l,d,c,s,r)=>{let i=n.length===2,a=!0,[p,h]=i?[0,1]:a?[2,3]:[1,2],m=e.type.value,b=x=>{let _=x===p?"row":"col";return`
      fn ${_}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${m} {
        var output_index = ${t.indicesGet("output_indices",x)};
        var originalIdx: ${m} = getOriginalCoordinateFromResizedCoordinate(output_index, ${u[x]},
        ${o[x]}, ${n[x]}, ${l[x]}, ${l[x]} + ${n.length});
        var fractOriginalIdx: ${m} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${c} && (originalIdx < 0 || originalIdx > (${n[x]} - 1))) {
          return ${s};
        }
        var data: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${_}: ${m} = originalIdx + ${m}(i);
          if (${_} < 0 || ${_} >= ${n[x]}) {
            ${r?`coefs[i + 1] = 0.0;
                        continue;`:c?`return ${s};`:`${_} = max(0, min(${_}, ${n[x]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",x,`u32(${_})`)};
          data[i + 1] = ${x===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${b(p)};
    ${b(h)};
  fn getCubicInterpolationCoefs(s: ${m}) -> array<${m}, 4> {
    var absS = abs(s);
    var coeffs: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${m} = 1.0 - absS;
    var twoMinusAbsS: ${m} = 2.0 - absS;
    var onePlusAbsS: ${m} = 1.0 + absS;
    coeffs[0] = ((${d} * onePlusAbsS - 5 * ${d}) * onePlusAbsS + 8 * ${d}) * onePlusAbsS - 4 * ${d};
    coeffs[1] = ((${d} + 2) * absS - (${d} + 3)) * absS * absS + 1;
    coeffs[2] = ((${d} + 2) * oneMinusAbsS - (${d} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${d} * twoMinusAbsS - 5 * ${d}) * twoMinusAbsS + 8 * ${d}) * twoMinusAbsS - 4 * ${d};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${m}, 4>, coefs: array<${m}, 4>) -> ${m} {
    var coefsSum: ${m} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${m} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Zb=(e,t,n,o,u)=>{let[l,d,c,s,r]=n.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],i=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${i} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",d,`max(0, min(depth, ${n[d]} - 1))`)};
      ${e.indicesSet("input_indices",c,`max(0, min(height, ${n[c]} - 1))`)};
      ${e.indicesSet("input_indices",s,`max(0, min(width, ${n[s]} - 1))`)};
      ${ou(e,r,l,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${i} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${i} = originalIndices[${d}];
      var height:${i} = originalIndices[${c}];
      var width:${i} = originalIndices[${s}];
      ${o?`if (depth < 0 || depth > (${n[d]} - 1) || height < 0 || height > (${n[c]} - 1) || width < 0 || (width > ${n[s]} - 1)) {
      return ${u};
        }`:""};

    depth = max(0, min(depth, ${n[d]} - 1));
      height = max(0, min(height, ${n[c]} - 1));
      width = max(0, min(width, ${n[s]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${n.length>3?`u32(originalIndices[${r}])`:"0"};
      var batch: u32 =  ${n.length>3?`u32(originalIndices[${l}])`:"0"};

      var x111: ${i} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${i} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${i} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${i} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${i} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${i} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${i} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${i} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${i} = abs(depth - ${i}(depth1));
      var dx2: ${i} = abs(${i}(depth2) - depth);
      var dy1: ${i} = abs(height - ${i}(height1));
      var dy2: ${i} = abs(${i}(height2) - height);
      var dz1: ${i} = abs(width - ${i}(width1));
      var dz2: ${i} = abs(${i}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},Jb=(e,t,n,o,u,l)=>{let d=e.dims,c=Vb(l,t.axes,d.length),s=Ub(d,o,u,t.axes),r=o.slice();o.length===0&&(r=d.map((y,S)=>y===0?1:s[S]/y),t.keepAspectRatioPolicy!=="stretch"&&(s=Gb(d,r,t)));let i=re("output",e.dataType,s.length),a=j("input",e.dataType,d.length),p=B.size(s),h=d.length===s.length&&d.every((y,S)=>y===s[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,x=a.type.value,_=y=>`
      ${h?"":`
      ${jb(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Wb(a,d)};
              ${Lb(t.nearestMode,n,x)};
              ${Hb(a,i,d,s,r.length,c.length,m)};
              `;case"linear":return`
              ${qb(i,d,s,r.length,c.length)};
              ${(()=>{if(d.length===2||d.length===4)return`${Kb(a,i,d,m,b)}`;if(d.length===3||d.length===5)return`${Zb(a,i,d,m,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(d.length===2||d.length===4)return`${Xb(a,i,d,s,r,c,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${y.registerUniform("output_size","u32").registerUniform("scales","f32",r.length).registerUniform("roi","f32",c.length).declareVariables(a,i)}
      ${y.mainStart()}
        ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${h?"output[global_idx] = input[global_idx];":`
        let output_indices = ${i.offsetToIndices("global_idx")};
        var input_indices: ${a.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${a.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${d.length===2||d.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${n}|${r.length>0?t.mode==="cubic"?r:r.length:""}|${u.length>0?u:""}|${c.length>0?c:""}|${h}|${t.mode==="nearest"?d.length:d}`,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:s,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},{type:1,data:r},{type:1,data:c},...oe(d,s)]})}},Yb=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},h2=(e,t)=>{let n=[],o=[],u=[],l=Yb(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Fb(e.inputs,t,l,n,o,u),e.compute(Jb(e.inputs[0],t,l,n,o,u),{inputs:[0]})},f2=e=>{let t=e.antialias,n=e.axes,o=e.coordinateTransformMode,u=e.cubicCoeffA,l=e.excludeOutside!==0,d=e.extrapolationValue,c=e.keepAspectRatioPolicy,s=e.mode,r=e.nearestMode===""?"simple":e.nearestMode;return Se({antialias:t,axes:n,coordinateTransformMode:o,cubicCoeffA:u,excludeOutside:l,extrapolationValue:d,keepAspectRatioPolicy:c,mode:s,nearestMode:r})}}),Qb,ey,m2,GA=R(()=>{"use strict";se(),ae(),ue(),Qb=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],n=e[1],o=e[2];if(t.dataType!==n.dataType||t.dataType!==o.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(n.dims.length!==3&&n.dims.length!==2)throw new Error("Skip must be 2D or 3D");let u=t.dims[t.dims.length-1],l=t.dims[t.dims.length-2];if(n.dims[n.dims.length-1]!==u)throw new Error("Skip must have the same hidden size as input");if(n.dims[n.dims.length-2]!==l)throw new Error("Skip must have the same sequence length as input");if(o.dims.length!==1)throw new Error("Gamma must be 1D");if(o.dims[o.dims.length-1]!==u)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let d=e[3];if(d.dims.length!==1)throw new Error("Beta must be 1D");if(d.dims[d.dims.length-1]!==u)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let d=e[4];if(d.dims.length!==1)throw new Error("Bias must be 1D");if(d.dims[d.dims.length-1]!==u)throw new Error("Bias must have the same hidden size as input")}},ey=(e,t,n,o)=>{let u=t.simplified,l=e[0].dims,d=B.size(l),c=l,s=d,r=l.slice(-1)[0],i=o?l.slice(0,-1).concat(1):[],a=!u&&e.length>3,p=e.length>4,h=o&&n>1,m=o&&n>2,b=n>3,x=64,_=Ve(r),y=[{type:12,data:s},{type:12,data:_},{type:12,data:r},{type:1,data:t.epsilon}],S=I=>{let A=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],k=[j("x",e[0].dataType,e[0].dims,_),j("skip",e[1].dataType,e[1].dims,_),j("gamma",e[2].dataType,e[2].dims,_)];a&&k.push(j("beta",e[3].dataType,e[3].dims,_)),p&&k.push(j("bias",e[4].dataType,e[4].dims,_)),k.push(re("output",e[0].dataType,c,_)),h&&k.push(re("mean_output",1,i)),m&&k.push(re("inv_std_output",1,i)),b&&k.push(re("input_skip_bias_sum",e[0].dataType,c,_));let O=Ye(e[0].dataType),z=Ye(1,_);return`

      ${I.registerUniforms(A).declareVariables(...k)}
      var<workgroup> sum_shared : array<${z}, ${x}>;
      var<workgroup> sum_squared_shared : array<${z}, ${x}>;

      ${I.mainStart([x,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${x};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${x};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${x-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${p?"bias[offset1d + i]":O+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${b?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${$n(O,_,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${x};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${wr("sum",_)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${wr("square_sum",_)} / f32(uniforms.hidden_size) ${u?"":"- mean * mean"} + uniforms.epsilon);
        ${h?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${u?"":`- ${O}(mean)`}) *
            ${O}(inv_std_dev) * gamma[offset1d + i]
            ${a?"+ beta[offset1d + i]":""};
        }
      }`},T=[{dims:c,dataType:e[0].dataType}];return n>1&&T.push({dims:i,dataType:1}),n>2&&T.push({dims:i,dataType:1}),n>3&&T.push({dims:l,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${_};${h};${m};${b}`,inputDependencies:e.map((I,A)=>"type")},getShaderSource:S,getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(s/r)},programUniforms:y})}},m2=(e,t)=>{Qb(e.inputs);let n=[0];e.outputCount>1&&n.push(-3),e.outputCount>2&&n.push(-3),e.outputCount>3&&n.push(3),e.compute(ey(e.inputs,t,e.outputCount,!1),{outputs:n})}}),ty,si,ry,su,ny,iy,g2,b2,qA=R(()=>{"use strict";se(),ae(),Ue(),ue(),ty=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((n,o)=>{if(e[o+1].dataType!==6&&e[o+1].dataType!==7)throw new Error(`Input ${o} must be an array of int32 or int64`)})},si=(e,t)=>{let n=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(o=>n.push(Number(o)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(o=>n.push(Number(o)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return n},ry=(e,t)=>{if(e.length>1){let n=si(e,1),o=si(e,2),u=si(e,3);return u.length===0&&(u=[...Array(e[0].dims.length).keys()]),Se({starts:n,ends:o,axes:u})}else return t},su=(e,t,n,o,u)=>{let l=e;return e<0&&(l+=n[o[t]]),u[t]<0?Math.max(0,Math.min(l,n[o[t]]-1)):Math.max(0,Math.min(l,n[o[t]]))},ny=(e,t,n)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${n.length-1}; i >= 0; i--) {
            let input_shape_i = ${ne("uniforms.input_shape","i",n.length)};
            let steps_i = ${ne("uniforms.steps","i",n.length)};
            let signs_i = ${ne("uniforms.signs","i",n.length)};
            let starts_i = ${ne("uniforms.starts","i",n.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,iy=(e,t)=>{let n=e[0].dims,o=B.size(n),u=t.axes.length>0?B.normalizeAxes(t.axes,n.length):[...Array(n.length).keys()],l=si(e,4);l.forEach(_=>_!==0||(()=>{throw new Error("step cannot be 0")})),l.length===0&&(l=Array(u.length).fill(1));let d=t.starts.map((_,y)=>su(_,y,n,u,l)),c=t.ends.map((_,y)=>su(_,y,n,u,l));if(u.length!==d.length||u.length!==c.length)throw new Error("start, ends and axes should have the same number of elements");if(u.length!==n.length)for(let _=0;_<n.length;++_)u.includes(_)||(d.splice(_,0,0),c.splice(_,0,n[_]),l.splice(_,0,1));let s=l.map(_=>Math.sign(_));l.forEach((_,y,S)=>{if(_<0){let T=(c[y]-d[y])/_,I=d[y],A=I+T*l[y];d[y]=A,c[y]=I,S[y]=-_}});let r=n.slice(0);u.forEach((_,y)=>{r[_]=Math.ceil((c[_]-d[_])/l[_])});let i={dims:r,dataType:e[0].dataType},a=re("output",e[0].dataType,r.length),p=j("input",e[0].dataType,e[0].dims.length),h=B.size(r),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:d.length},{name:"signs",type:"i32",length:s.length},{name:"steps",type:"u32",length:l.length}],b=[{type:12,data:h},{type:12,data:d},{type:6,data:s},{type:12,data:l},...oe(e[0].dims,r)],x=_=>`
      ${_.registerUniforms(m).declareVariables(p,a)}
        ${ny(p,a,n)}
        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${a.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${a.setByOffset("global_idx",p.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${s.length}_${d.length}_${l.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[i],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:b})}},g2=(e,t)=>{ty(e.inputs,t);let n=ry(e.inputs,t);e.compute(iy(e.inputs,n),{inputs:[0]})},b2=e=>{let t=e.starts,n=e.ends,o=e.axes;return Se({starts:t,ends:n,axes:o})}}),oy,sy,y2,_2,HA=R(()=>{"use strict";se(),ae(),Ue(),xr(),ue(),oy=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},sy=(e,t)=>{let n=e.inputs[0],o=n.dims,u=B.size(o),l=o.length,d=B.normalizeAxis(t.axis,l),c=d<o.length-1,s,r=[];c?(r=Array.from({length:l},(k,O)=>O),r[d]=l-1,r[l-1]=d,s=e.compute(bt(n,r),{inputs:[n],outputs:[-1]})[0]):s=n;let i=s.dims,a=i[l-1],p=u/a,h=Ve(a),m=a/h,b=64;p===1&&(b=256);let x=(k,O)=>O===4?`max(max(${k}.x, ${k}.y), max(${k}.z, ${k}.w))`:O===2?`max(${k}.x, ${k}.y)`:O===3?`max(max(${k}.x, ${k}.y), ${k}.z)`:k,_=j("x",s.dataType,s.dims,h),y=re("result",s.dataType,s.dims,h),S=_.type.value,T=Ye(s.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,I=k=>`
      var<workgroup> rowMaxShared : ${S};
      var<workgroup> rowSumShared : ${S};
      var<workgroup> threadShared : array<${S}, ${b}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${S} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${S}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${k.registerUniform("packedCols","i32").declareVariables(_,y)}
      ${k.mainStart(b)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${b};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${T}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${S}(${x("threadShared[0]",h)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${S}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${S}(${wr("threadShared[0]",h)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,A=e.compute({name:"Softmax",shaderCache:{hint:`${h};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:i,dataType:s.dataType}],dispatchGroup:{x:p},programUniforms:[{type:6,data:m}]}),getShaderSource:I},{inputs:[s],outputs:[c?-1:0]})[0];c&&e.compute(bt(A,r),{inputs:[A]})},y2=(e,t)=>{oy(e.inputs),sy(e,t)},_2=e=>Se({axis:e.axis})}),au,ay,uy,ly,w2,WA=R(()=>{"use strict";se(),ae(),ue(),au=e=>Array.from(e.getBigInt64Array(),Number),ay=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(au(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},uy=(e,t)=>{let n=[];for(let o=0;o<e.length;++o)n.push(e[o]*t[o]);return n},ly=(e,t)=>{let n=e[0].dims,o=t??au(e[1]),u=uy(n,o),l=B.size(u),d=e[0].dataType,c=j("input",d,n.length),s=re("output",d,u.length),r=i=>`
      const inputShape = ${c.indices(...n)};
      ${i.registerUniform("output_size","u32").declareVariables(c,s)}
      ${i.mainStart()}
      ${i.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${s.offsetToIndices("global_idx")};
      var input_indices: ${c.type.indices};
      for (var i = 0; i < ${n.length}; i++) {
        let input_dim_i = ${c.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${s.indicesGet("output_indices","i")}  % input_dim_i;

        ${c.indicesSet("input_indices","i","input_dim_value")}
      }
      ${s.setByOffset("global_idx",c.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${o}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:[{type:12,data:l},...oe(e[0].dims,u)]}),getShaderSource:r}},w2=e=>{ay(e.inputs),e.compute(ly(e.inputs),{inputs:[0]})}}),dy,cy,v2,KA=R(()=>{"use strict";se(),ae(),ue(),dy=(e,t,n,o,u)=>{let l=re("output_data",u,n.length,4),d=j("a_data",t[1].dataType,t[1].dims.length,4),c=j("b_data",t[2].dataType,t[2].dims.length,4),s=j("c_data",t[0].dataType,t[0].dims.length,4),r,i=(a,p,h)=>`select(${p}, ${a}, ${h})`;if(!o)r=l.setByOffset("global_idx",i(d.getByOffset("global_idx"),c.getByOffset("global_idx"),s.getByOffset("global_idx")));else{let a=(p,h,m="")=>{let b=`a_data[index_a${h}][component_a${h}]`,x=`b_data[index_b${h}][component_b${h}]`,_=`bool(c_data[index_c${h}] & (0xffu << (component_c${h} * 8)))`;return`
            let output_indices${h} = ${l.offsetToIndices(`global_idx * 4u + ${h}u`)};
            let offset_a${h} = ${d.broadcastedIndicesToOffset(`output_indices${h}`,l)};
            let offset_b${h} = ${c.broadcastedIndicesToOffset(`output_indices${h}`,l)};
            let offset_c${h} = ${s.broadcastedIndicesToOffset(`output_indices${h}`,l)};
            let index_a${h} = offset_a${h} / 4u;
            let index_b${h} = offset_b${h} / 4u;
            let index_c${h} = offset_c${h} / 4u;
            let component_a${h} = offset_a${h} % 4u;
            let component_b${h} = offset_b${h} % 4u;
            let component_c${h} = offset_c${h} % 4u;
            ${p}[${h}] = ${m}(${i(b,x,_)});
          `};u===9?r=`
            var data = vec4<u32>(0);
            ${a("data",0,"u32")}
            ${a("data",1,"u32")}
            ${a("data",2,"u32")}
            ${a("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:r=`
            ${a("output_data[global_idx]",0)}
            ${a("output_data[global_idx]",1)}
            ${a("output_data[global_idx]",2)}
            ${a("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(s,d,c,l)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${r}
      }`},cy=e=>{let t=e[1].dims,n=e[2].dims,o=e[0].dims,u=e[1].dataType,l=!(B.areEqual(t,n)&&B.areEqual(n,o)),d=t,c=B.size(t);if(l){let r=In.calcShape(In.calcShape(t,n,!1),o,!1);if(!r)throw new Error("Can't perform where op on the given tensors");d=r,c=B.size(d)}let s=Math.ceil(c/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:r=>dy(r,e,d,l,u),getRunData:()=>({outputs:[{dims:d,dataType:u}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:s},...oe(o,t,n,d)]})}},v2=e=>{e.compute(cy(e.inputs))}}),x2,XA=R(()=>{"use strict";uA(),Ll(),lA(),dA(),cA(),pA(),hA(),yA(),wA(),vA(),xA(),$A(),TA(),SA(),IA(),OA(),EA(),AA(),PA(),kA(),CA(),DA(),RA(),NA(),zA(),BA(),L1(),MA(),FA(),jA(),LA(),VA(),jl(),UA(),H1(),GA(),qA(),HA(),G1(),WA(),xr(),Vl(),KA(),x2=new Map([["Abs",[px]],["Acos",[hx]],["Acosh",[fx]],["Add",[Xx]],["ArgMax",[ux,ul]],["ArgMin",[ax,ul]],["Asin",[mx]],["Asinh",[gx]],["Atan",[bx]],["Atanh",[yx]],["Attention",[lx]],["AveragePool",[t2,e2]],["BatchNormalization",[dx]],["BiasAdd",[cx]],["BiasSplitGelu",[Kx]],["Cast",[wx,_x]],["Ceil",[xx]],["Clip",[vx]],["Concat",[o1,s1]],["Conv",[fl,hl]],["ConvTranspose",[g1,m1]],["Cos",[$x]],["Cosh",[Tx]],["CumSum",[b1,y1]],["DepthToSpace",[_1,w1]],["DequantizeLinear",[u2,l2]],["DFT",[v1,x1]],["Div",[Zx]],["Einsum",[$1,T1]],["Elu",[Sx,mi]],["Equal",[Jx]],["Erf",[Ix]],["Exp",[Ox]],["Expand",[S1]],["FastGelu",[I1]],["Floor",[Ex]],["FusedConv",[fl,hl]],["Gather",[E1,O1]],["GatherElements",[R1,D1]],["GatherBlockQuantized",[k1,C1]],["GatherND",[A1,P1]],["Gelu",[Ax]],["Gemm",[z1,N1]],["GlobalAveragePool",[n2,r2]],["GlobalMaxPool",[a2,s2]],["Greater",[t1]],["GreaterOrEqual",[n1]],["GridSample",[B1,M1]],["GroupQueryAttention",[W1]],["HardSigmoid",[Bx,zx]],["HardSwish",[Mx]],["InstanceNormalization",[K1]],["LayerNormalization",[X1]],["LeakyRelu",[Px,mi]],["Less",[r1]],["LessOrEqual",[i1]],["Log",[Hx]],["MatMul",[Z1]],["MatMulNBits",[J1,Y1]],["MaxPool",[i2,o2]],["Mul",[Yx]],["MultiHeadAttention",[j1,F1]],["Neg",[Cx]],["Not",[kx]],["Pad",[Q1]],["Pow",[Qx]],["QuickGelu",[Wx,mi]],["Range",[d2]],["Reciprocal",[Dx]],["ReduceMin",[rx]],["ReduceMean",[Jv]],["ReduceMax",[tx]],["ReduceSum",[ix]],["ReduceProd",[nx]],["ReduceL1",[Yv]],["ReduceL2",[Qv]],["ReduceLogSum",[sx]],["ReduceLogSumExp",[ex]],["ReduceSumSquare",[ox]],["Relu",[Rx]],["Resize",[h2,f2]],["RotaryEmbedding",[q1]],["ScatterND",[p2,c2]],["Sigmoid",[Nx]],["Sin",[Fx]],["Sinh",[jx]],["Slice",[g2,b2]],["SkipLayerNormalization",[m2]],["Split",[V1,U1]],["Sqrt",[Lx]],["Softmax",[y2,_2]],["Sub",[e1]],["Tan",[Vx]],["Tanh",[Ux]],["ThresholdedRelu",[qx,mi]],["Tile",[w2]],["Transpose",[Fv,jv]],["Where",[v2]]])}),$2,ZA=R(()=>{"use strict";ot(),Qt(),ue(),$2=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,n,o,u){Gt(e.programInfo.name);let l=this.backend.device,d=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let c=[];for(let r of t)c.push({binding:c.length,resource:{buffer:r.buffer}});for(let r of n)c.push({binding:c.length,resource:{buffer:r.buffer}});u&&c.push({binding:c.length,resource:u});let s=l.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:c,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let r={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:s,dispatchGroup:o};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(r)}d.setPipeline(e.computePipeline),d.setBindGroup(0,s),d.dispatchWorkgroups(...o),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),zt(e.programInfo.name)}dispose(){}build(e,t){Gt(e.name);let n=this.backend.device,o=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(r=>{n.features.has(r.feature)&&o.push(`enable ${r.extension};`)});let u=Mv(t,this.backend.device.limits),l=e.getShaderSource(u),d=`${o.join(`
`)}
${u.additionalImplementations}
${l}`,c=n.createShaderModule({code:d,label:e.name});ve("verbose",()=>`[WebGPU] ${e.name} shader code: ${d}`);let s=n.createComputePipeline({compute:{module:c,entryPoint:"main"},layout:"auto",label:e.name});return zt(e.name),{programInfo:e,computePipeline:s,uniformVariablesInfo:u.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,n=typeof e=="number"?1:e.y||1,o=typeof e=="number"?1:e.z||1,u=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=u&&n<=u&&o<=u)return[t,n,o];let l=t*n*o,d=Math.ceil(Math.sqrt(l));if(d>u){if(d=Math.ceil(Math.cbrt(l)),d>u)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[d,d,d]}else return[d,d,1]}}}),T2={};un(T2,{WebGpuBackend:()=>S2});var py,hy,fy,S2,JA=R(()=>{"use strict";ot(),se(),Qt(),Dv(),sA(),XA(),ZA(),py=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let n=[];for(let o=0;o<e.length;++o){let u=e[o].dataType;switch(t[o]){case"none":{n.push("");break}case"type":{n.push(`${u}`);break}case"rank":{let l=e[o].dims.length;n.push(`${u};${l}`);break}case"dims":{let l=e[o].dims.join(",");n.push(`${u};${l}`);break}default:throw new Error(`unsupported input dependency: ${t[o]}`)}}return n.join("|")},hy=(e,t,n)=>{let o=e.name;return e.shaderCache?.hint&&(o+="["+e.shaderCache.hint+"]"),o+=":"+n+`:${py(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,o},fy=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},S2=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let n=[],o={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:n},u=c=>t.features.has(c)&&n.push(c)&&!0;u("chromium-experimental-timestamp-query-inside-passes")||u("timestamp-query"),u("shader-f16"),u("subgroups"),this.device=await t.requestDevice(o);let l=t,d=t.info??(typeof l.requestAdapterInfo=="function"?await l.requestAdapterInfo():void 0);this.adapterInfo=new fy(d),this.gpuDataManager=zv(this),this.programManager=new $2(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,zl(e.logLevel,!!e.debug),this.device.onuncapturederror=c=>{c.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${c.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Gt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),n=this.pendingQueries.get(e);for(let o=0;o<t.length/2;o++){let u=n[o],l=u.kernelId,d=this.kernels.get(l),c=d.kernelType,s=d.kernelName,r=u.programName,i=u.inputTensorViews,a=u.outputTensorViews,p=t[o*2],h=t[o*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=p);let m=Number(p-this.queryTimeBase),b=Number(h-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:i.map(x=>({dims:x.dims,dataType:Jt(x.dataType)})),outputsMetadata:a.map(x=>({dims:x.dims,dataType:Jt(x.dataType)})),kernelId:l,kernelType:c,kernelName:s,programName:r,startTime:m,endTime:b});else{let x="";i.forEach((y,S)=>{x+=`input[${S}]: [${y.dims}] | ${Jt(y.dataType)}, `});let _="";a.forEach((y,S)=>{_+=`output[${S}]: [${y.dims}] | ${Jt(y.dataType)}, `}),console.log(`[profiling] kernel "${l}|${c}|${s}|${r}" ${x}${_}start time: ${m} ns, execution time: ${b-m} ns`)}vo("GPU",`${r}::${p}::${h}`)}e.unmap(),this.pendingQueries.delete(e)}),zt()}run(e,t,n,o,u,l){Gt(e.name);let d=[];for(let y=0;y<t.length;++y){let S=t[y].data;if(S===0)continue;let T=this.gpuDataManager.get(S);if(!T)throw new Error(`no GPU data for input: ${S}`);d.push(T)}let{outputs:c,dispatchGroup:s,programUniforms:r}=e.getRunData(t),i=n.length===0?c.map((y,S)=>S):n;if(i.length!==c.length)throw new Error(`Output size ${i.length} must be equal to ${c.length}.`);let a=[],p=[];for(let y=0;y<c.length;++y){if(!Number.isInteger(i[y])||i[y]<-3||i[y]>=l)throw new Error(`Invalid output index: ${i[y]}`);if(i[y]===-3)continue;let S=i[y]===-1,T=i[y]===-2,I=S||T?u(c[y].dataType,c[y].dims):o(i[y],c[y].dataType,c[y].dims);if(a.push(I),I.data===0)continue;let A=this.gpuDataManager.get(I.data);if(!A)throw new Error(`no GPU data for output: ${I.data}`);if(S&&this.temporaryData.push(A),T){let k=this.kernelPersistentData.get(this.currentKernelId);k||(k=[],this.kernelPersistentData.set(this.currentKernelId,k)),k.push(A)}p.push(A)}if(d.length!==t.length||p.length!==a.length){if(p.length===0)return zt(e.name),a;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let h;if(r){let y=0,S=[];r.forEach(k=>{let O=typeof k.data=="number"?[k.data]:k.data;if(O.length===0)return;let z=k.type===10?2:4,G,Y;k.type===10?(Y=O.length>4?16:O.length>2?8:O.length*z,G=O.length>4?16:z*O.length):(Y=O.length<=2?O.length*z:16,G=16),y=Math.ceil(y/Y)*Y,S.push(y);let W=k.type===10?8:4;y+=O.length>4?Math.ceil(O.length/W)*G:O.length*z});let T=16;y=Math.ceil(y/T)*T;let I=new ArrayBuffer(y);r.forEach((k,O)=>{let z=S[O],G=typeof k.data=="number"?[k.data]:k.data;if(k.type===6)new Int32Array(I,z,G.length).set(G);else if(k.type===12)new Uint32Array(I,z,G.length).set(G);else if(k.type===10)new Uint16Array(I,z,G.length).set(G);else if(k.type===1)new Float32Array(I,z,G.length).set(G);else throw new Error(`Unsupported uniform type: ${Jt(k.type)}`)});let A=this.gpuDataManager.create(y,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(A.buffer,0,I,0,y),this.gpuDataManager.release(A.id),h={offset:0,size:y,buffer:A.buffer}}let m=this.programManager.normalizeDispatchGroupSize(s),b=m[1]===1&&m[2]===1,x=hy(e,t,b),_=this.programManager.getArtifact(x);if(_||(_=this.programManager.build(e,m),this.programManager.setArtifact(x,_),ve("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),r&&_.uniformVariablesInfo){if(r.length!==_.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${_.uniformVariablesInfo.length}, got ${r.length} in program "${_.programInfo.name}".`);for(let y=0;y<r.length;y++){let S=r[y],T=S.type,I=typeof S.data=="number"?1:S.data.length,[A,k]=_.uniformVariablesInfo[y];if(T!==A||I!==k)throw new Error(`Uniform variable ${y} mismatch: expect type ${A} with size ${k}, got type ${T} with size ${I} in program "${_.programInfo.name}".`)}}if(ve("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let y={kernelId:this.currentKernelId,programName:_.programInfo.name,inputTensorViews:t,outputTensorViews:a};this.pendingKernels.push(y),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(y)}return this.programManager.run(_,d,p,m,h),zt(e.name),a}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,n,o){let u=x2.get(e);if(!u)throw new Error(`kernel not implemented: ${e}`);let l={kernelType:e,kernelName:o,kernelEntry:u[0],attributes:[u[1],n]};this.kernels.set(t,l)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let n of t)this.gpuDataManager.release(n.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,n){let o=this.kernels.get(e);if(!o)throw new Error(`kernel not created: ${e}`);let u=o.kernelType,l=o.kernelName,d=o.kernelEntry,c=o.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${u}] ${l}" is not allowed to be called recursively`);this.currentKernelId=e,c[0]&&(c[1]=c[0](c[1]),c[0]=void 0),ve("info",()=>`[WebGPU] Start to run kernel "[${u}] ${l}"...`);let s=this.env.debug;this.temporaryData=[];try{return s&&this.device.pushErrorScope("validation"),d(t,c[1]),0}catch(r){return n.push(Promise.resolve(`[WebGPU] Kernel "[${u}] ${l}" failed. ${r}`)),1}finally{s&&n.push(this.device.popErrorScope().then(r=>r?`GPU validation error for kernel "[${u}] ${l}": ${r.message}`:null));for(let r of this.temporaryData)this.gpuDataManager.release(r.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,n,o){let u=this.sessionExternalDataMapping.get(e);u||(u=new Map,this.sessionExternalDataMapping.set(e,u));let l=u.get(t),d=this.gpuDataManager.registerExternalBuffer(n,o,l);return u.set(t,[d,n]),d}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(n=>this.gpuDataManager.unregisterExternalBuffer(n[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,n){return async()=>{let o=await ol(this,e,t);return Bl(o.buffer,n)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){ve("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){ve("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){ve("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),n=e.length;this.pendingKernels=[];for(let o=0;o<n;o++){let u=this.getComputePassEncoder(),l=e[o];this.writeTimestamp(this.pendingDispatchNumber*2),u.setPipeline(l.computePipeline),u.setBindGroup(0,l.bindGroup),u.dispatchWorkgroups(...l.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[o]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),I2={};un(I2,{init:()=>O2});var fo,my,O2,YA=R(()=>{"use strict";se(),Qt(),ae(),oA(),fo=class E2{constructor(t,n,o,u){this.module=t,this.dataType=n,this.data=o,this.dims=u}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(B.size(t)!==B.size(this.dims))throw new Error("Invalid new shape");return new E2(this.module,this.dataType,this.data,t)}},my=class{constructor(e,t,n){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let o=e.PTR_SIZE,u=n/e.PTR_SIZE,l=o===4?"i32":"i64";this.opKernelContext=Number(e.getValue(o*u++,l));let d=Number(e.getValue(o*u++,l));this.outputCount=Number(e.getValue(o*u++,l)),this.customDataOffset=Number(e.getValue(o*u++,"*")),this.customDataSize=Number(e.getValue(o*u++,l));let c=[];for(let s=0;s<d;s++){let r=Number(e.getValue(o*u++,l)),i=Number(e.getValue(o*u++,"*")),a=Number(e.getValue(o*u++,l)),p=[];for(let h=0;h<a;h++)p.push(Number(e.getValue(o*u++,l)));c.push(new fo(e,r,i,p))}this.inputs=c}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let n=t?.inputs?.map(d=>typeof d=="number"?this.inputs[d]:d)??this.inputs,o=t?.outputs??[],u=(d,c,s)=>new fo(this.module,c,this.output(d,s),s),l=(d,c)=>{let s=Qr(d,c);if(!s)throw new Error(`Unsupported data type: ${d}`);let r=s>0?this.backend.gpuDataManager.create(s).id:0;return new fo(this.module,d,r,c)};return this.backend.run(e,n,o,u,l,this.outputCount)}output(e,t){let n=this.module.stackSave();try{let o=this.module.PTR_SIZE,u=o===4?"i32":"i64",l=this.module.stackAlloc((1+t.length)*o);this.module.setValue(l,t.length,u);for(let d=0;d<t.length;d++)this.module.setValue(l+o*(d+1),t[d],u);return this.module._JsepOutput(this.opKernelContext,e,l)}catch(o){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${o}`)}finally{this.module.stackRestore(n)}}},O2=async(e,t,n,o)=>{let u=t.jsepInit;if(!u)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let l=(JA(),Tn(T2)).WebGpuBackend,d=new l;await d.initialize(n,o),u("webgpu",[d,c=>d.alloc(Number(c)),c=>d.free(c),(c,s,r,i=!1)=>{if(i)ve("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(c)}, dst=${Number(s)}, size=${Number(r)}`),d.memcpy(Number(c),Number(s));else{ve("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(c)}, gpuDataId=${Number(s)}, size=${Number(r)}`);let a=t.HEAPU8.subarray(Number(c>>>0),Number(c>>>0)+Number(r));d.upload(Number(s),a)}},async(c,s,r)=>{ve("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${c}, dataOffset=${s}, size=${r}`),await d.download(Number(c),()=>t.HEAPU8.subarray(Number(s)>>>0,Number(s+r)>>>0))},(c,s,r)=>d.createKernel(c,Number(s),r,t.UTF8ToString(t._JsepGetNodeName(Number(s)))),c=>d.releaseKernel(c),(c,s,r,i)=>{ve("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${r}, kernel=${c}, contextDataOffset=${s}`);let a=new my(t,d,Number(s));return d.computeKernel(Number(c),a,i)},()=>d.captureBegin(),()=>d.captureEnd(),()=>d.replay()])}else{let l=new Nv(n);u("webnn",[l,()=>l.reserveTensorId(),d=>l.releaseTensorId(d),async(d,c,s,r,i)=>l.ensureTensor(d,c,s,r,i),(d,c)=>{l.uploadTensor(d,c)},async(d,c)=>l.downloadTensor(d,c),(d,c)=>l.registerMLContext(d,c),!!n.trace])}}}),gy,Kl,Xl,dr,by,uu,Co,Zl,Jl,lu,Yl,Ql,ed,A2=R(()=>{"use strict";ot(),rA(),nA(),se(),dn(),Cl(),Av(),gy=(e,t)=>{Re()._OrtInit(e,t)!==0&&Ae("Can't initialize onnxruntime.")},Kl=async e=>{gy(e.wasm.numThreads,Oo(e.logLevel))},Xl=async(e,t)=>{Re().asyncInit?.();let n=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(n){if(typeof n.limits!="object"||typeof n.features!="object"||typeof n.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let o=e.webgpu.powerPreference;if(o!==void 0&&o!=="low-power"&&o!=="high-performance")throw new Error(`Invalid powerPreference setting: "${o}"`);let u=e.webgpu.forceFallbackAdapter;if(u!==void 0&&typeof u!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${u}"`);if(n=await navigator.gpu.requestAdapter({powerPreference:o,forceFallbackAdapter:u}),!n)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let o=(YA(),Tn(I2)).init;t==="webgpu"&&await o("webgpu",Re(),e,n),t==="webnn"&&await o("webnn",Re(),e)}},dr=new Map,by=e=>{let t=Re(),n=t.stackSave();try{let o=t.PTR_SIZE,u=t.stackAlloc(2*o);t._OrtGetInputOutputCount(e,u,u+o)!==0&&Ae("Can't get session input/output count.");let l=o===4?"i32":"i64";return[Number(t.getValue(u,l)),Number(t.getValue(u+o,l))]}finally{t.stackRestore(n)}},uu=(e,t)=>{let n=Re(),o=n.stackSave(),u=0;try{let l=n.PTR_SIZE,d=n.stackAlloc(2*l);n._OrtGetInputOutputMetadata(e,t,d,d+l)!==0&&Ae("Can't get session input/output metadata.");let c=Number(n.getValue(d,"*"));u=Number(n.getValue(d+l,"*"));let s=n.HEAP32[u/4];if(s===0)return[c,0];let r=n.HEAPU32[u/4+1],i=[];for(let a=0;a<r;a++){let p=Number(n.getValue(u+8+a*l,"*"));i.push(p!==0?n.UTF8ToString(p):Number(n.getValue(u+8+(a+r)*l,"*")))}return[c,s,i]}finally{n.stackRestore(o),u!==0&&n._OrtFree(u)}},Co=e=>{let t=Re(),n=t._malloc(e.byteLength);if(n===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,n),[n,e.byteLength]},Zl=async(e,t)=>{let n,o,u=Re();Array.isArray(e)?[n,o]=e:e.buffer===u.HEAPU8.buffer?[n,o]=[e.byteOffset,e.byteLength]:[n,o]=Co(e);let l=0,d=0,c=0,s=[],r=[],i=[];try{if([d,s]=await Ev(t),t?.externalData&&u.mountExternalData){let T=[];for(let I of t.externalData){let A=typeof I=="string"?I:I.path,k=typeof I=="string"?I:I.data;T.push(Nl(k).then(O=>{u.mountExternalData(A,O)}))}await Promise.all(T)}for(let T of t?.executionProviders??[])if((typeof T=="string"?T:T.name)==="webnn"){if(u.shouldTransferToMLTensor=!1,typeof T!="string"){let I=T,A=I?.context,k=I?.gpuDevice,O=I?.deviceType,z=I?.powerPreference;A?u.currentContext=A:k?u.currentContext=await u.webnnCreateMLContext(k):u.currentContext=await u.webnnCreateMLContext({deviceType:O,powerPreference:z})}else u.currentContext=await u.webnnCreateMLContext();break}l=await u._OrtCreateSession(n,o,d),u.webgpuOnCreateSession?.(l),l===0&&Ae("Can't create a session."),u.jsepOnCreateSession?.(),u.currentContext&&(u.webnnRegisterMLContext(l,u.currentContext),u.currentContext=void 0,u.shouldTransferToMLTensor=!0);let[a,p]=by(l),h=!!t?.enableGraphCapture,m=[],b=[],x=[],_=[],y=[];for(let T=0;T<a;T++){let[I,A,k]=uu(l,T);I===0&&Ae("Can't get an input name."),r.push(I);let O=u.UTF8ToString(I);m.push(O),x.push(A===0?{name:O,isTensor:!1}:{name:O,isTensor:!0,type:Jt(A),shape:k})}for(let T=0;T<p;T++){let[I,A,k]=uu(l,T+a);I===0&&Ae("Can't get an output name."),i.push(I);let O=u.UTF8ToString(I);b.push(O),_.push(A===0?{name:O,isTensor:!1}:{name:O,isTensor:!0,type:Jt(A),shape:k});{if(h&&t?.preferredOutputLocation===void 0){y.push("gpu-buffer");continue}let z=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[O]??"cpu",G=u.webnnIsGraphOutput;if(z==="cpu"&&G&&G(l,O)){y.push("ml-tensor-cpu-output");continue}if(z!=="cpu"&&z!=="cpu-pinned"&&z!=="gpu-buffer"&&z!=="ml-tensor")throw new Error(`Not supported preferred output location: ${z}.`);if(h&&z!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${z}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);y.push(z)}}let S=null;return y.some(T=>T==="gpu-buffer"||T==="ml-tensor"||T==="ml-tensor-cpu-output")&&(c=u._OrtCreateBinding(l),c===0&&Ae("Can't create IO binding."),S={handle:c,outputPreferredLocations:y,outputPreferredLocationsEncoded:y.map(T=>T==="ml-tensor-cpu-output"?"ml-tensor":T).map(T=>il(T))}),dr.set(l,[l,r,i,S,h,!1]),[l,m,b,x,_]}catch(a){throw r.forEach(p=>u._OrtFree(p)),i.forEach(p=>u._OrtFree(p)),c!==0&&u._OrtReleaseBinding(c)!==0&&Ae("Can't release IO binding."),l!==0&&u._OrtReleaseSession(l)!==0&&Ae("Can't release session."),a}finally{u._free(n),d!==0&&u._OrtReleaseSessionOptions(d)!==0&&Ae("Can't release session options."),s.forEach(a=>u._free(a)),u.unmountExternalData?.()}},Jl=e=>{let t=Re(),n=dr.get(e);if(!n)throw new Error(`cannot release session. invalid session id: ${e}`);let[o,u,l,d,c]=n;d&&(c&&t._OrtClearBoundOutputs(d.handle)!==0&&Ae("Can't clear bound outputs."),t._OrtReleaseBinding(d.handle)!==0&&Ae("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),u.forEach(s=>t._OrtFree(s)),l.forEach(s=>t._OrtFree(s)),t._OrtReleaseSession(o)!==0&&Ae("Can't release session."),dr.delete(e)},lu=async(e,t,n,o,u,l,d=!1)=>{if(!e){t.push(0);return}let c=Re(),s=c.PTR_SIZE,r=e[0],i=e[1],a=e[3],p=a,h,m;if(r==="string"&&(a==="gpu-buffer"||a==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(d&&a!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${l} when enableGraphCapture is true.`);if(a==="gpu-buffer"){let _=e[2].gpuBuffer;m=Qr(Yr(r),i);{let y=c.jsepRegisterBuffer;if(!y)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');h=y(o,l,_,m)}}else if(a==="ml-tensor"){let _=e[2].mlTensor;m=Qr(Yr(r),i);let y=c.webnnRegisterMLTensor;if(!y)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');h=y(o,_,Yr(r),i)}else{let _=e[2];if(Array.isArray(_)){m=s*_.length,h=c._malloc(m),n.push(h);for(let y=0;y<_.length;y++){if(typeof _[y]!="string")throw new TypeError(`tensor data at index ${y} is not a string`);c.setValue(h+y*s,Nt(_[y],n),"*")}}else{let y=c.webnnIsGraphInput,S=c.webnnIsGraphOutput;if(r!=="string"&&y&&S){let T=c.UTF8ToString(u);if(y(o,T)||S(o,T)){let I=Yr(r);m=Qr(I,i),p="ml-tensor";let A=c.webnnCreateTemporaryTensor,k=c.webnnUploadTensor;if(!A||!k)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let O=await A(o,I,i);k(O,new Uint8Array(_.buffer,_.byteOffset,_.byteLength)),h=O}else m=_.byteLength,h=c._malloc(m),n.push(h),c.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),h)}else m=_.byteLength,h=c._malloc(m),n.push(h),c.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),h)}}let b=c.stackSave(),x=c.stackAlloc(4*i.length);try{i.forEach((y,S)=>c.setValue(x+S*s,y,s===4?"i32":"i64"));let _=c._OrtCreateTensor(Yr(r),h,m,x,i.length,il(p));_===0&&Ae(`Can't create tensor for input/output. session=${o}, index=${l}.`),t.push(_)}finally{c.stackRestore(b)}},Yl=async(e,t,n,o,u,l)=>{let d=Re(),c=d.PTR_SIZE,s=dr.get(e);if(!s)throw new Error(`cannot run inference. invalid session id: ${e}`);let r=s[0],i=s[1],a=s[2],p=s[3],h=s[4],m=s[5],b=t.length,x=o.length,_=0,y=[],S=[],T=[],I=[],A=[],k=d.stackSave(),O=d.stackAlloc(b*c),z=d.stackAlloc(b*c),G=d.stackAlloc(x*c),Y=d.stackAlloc(x*c);try{[_,y]=Ov(l),tn("wasm prepareInputOutputTensor");for(let w=0;w<b;w++)await lu(n[w],S,I,e,i[t[w]],t[w],h);for(let w=0;w<x;w++)await lu(u[w],T,I,e,a[o[w]],b+o[w],h);rn("wasm prepareInputOutputTensor");for(let w=0;w<b;w++)d.setValue(O+w*c,S[w],"*"),d.setValue(z+w*c,i[t[w]],"*");for(let w=0;w<x;w++)d.setValue(G+w*c,T[w],"*"),d.setValue(Y+w*c,a[o[w]],"*");if(p&&!m){let{handle:w,outputPreferredLocations:C,outputPreferredLocationsEncoded:F}=p;if(i.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${i.length}).`);tn("wasm bindInputsOutputs");for(let V=0;V<b;V++){let U=t[V];await d._OrtBindInput(w,i[U],S[V])!==0&&Ae(`Can't bind input[${V}] for session=${e}.`)}for(let V=0;V<x;V++){let U=o[V];u[V]?.[3]?(A.push(T[V]),d._OrtBindOutput(w,a[U],T[V],0)!==0&&Ae(`Can't bind pre-allocated output[${V}] for session=${e}.`)):d._OrtBindOutput(w,a[U],0,F[U])!==0&&Ae(`Can't bind output[${V}] to ${C[V]} for session=${e}.`)}rn("wasm bindInputsOutputs"),dr.set(e,[r,i,a,p,h,!0])}d.jsepOnRunStart?.(r),d.webnnOnRunStart?.(r);let W;p?W=await d._OrtRunWithBinding(r,p.handle,x,G,_):W=await d._OrtRun(r,z,O,b,Y,x,G,_),W!==0&&Ae("failed to call OrtRun().");let D=[],Q=[];tn("wasm ProcessOutputTensor");for(let w=0;w<x;w++){let C=Number(d.getValue(G+w*c,"*"));if(C===T[w]||A.includes(T[w])){D.push(u[w]),C!==T[w]&&d._OrtReleaseTensor(C)!==0&&Ae("Can't release tensor.");continue}let F=d.stackSave(),V=d.stackAlloc(4*c),U=!1,q,M=0;try{d._OrtGetTensorData(C,V,V+c,V+2*c,V+3*c)!==0&&Ae(`Can't access output tensor data on index ${w}.`);let Z=c===4?"i32":"i64",X=Number(d.getValue(V,Z));M=d.getValue(V+c,"*");let H=d.getValue(V+c*2,"*"),pe=Number(d.getValue(V+c*3,Z)),fe=[];for(let Oe=0;Oe<pe;Oe++)fe.push(Number(d.getValue(H+Oe*c,Z)));d._OrtFree(H)!==0&&Ae("Can't free memory for tensor dims.");let ye=fe.reduce((Oe,Le)=>Oe*Le,1);q=Jt(X);let Me=p?.outputPreferredLocations[o[w]];if(q==="string"){if(Me==="gpu-buffer"||Me==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let Oe=[];for(let Le=0;Le<ye;Le++){let ut=d.getValue(M+Le*c,"*"),Ir=d.getValue(M+(Le+1)*c,"*"),Mi=Le===ye-1?void 0:Ir-ut;Oe.push(d.UTF8ToString(ut,Mi))}D.push([q,fe,Oe,"cpu"])}else if(Me==="gpu-buffer"&&ye>0){let Oe=d.jsepGetBuffer;if(!Oe)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Le=Oe(M),ut=Qr(X,ye);if(ut===void 0||!Dl(q))throw new Error(`Unsupported data type: ${q}`);U=!0,D.push([q,fe,{gpuBuffer:Le,download:d.jsepCreateDownloader(Le,ut,q),dispose:()=>{d._OrtReleaseTensor(C)!==0&&Ae("Can't release tensor.")}},"gpu-buffer"])}else if(Me==="ml-tensor"&&ye>0){let Oe=d.webnnEnsureTensor,Le=d.webnnIsGraphInputOutputTypeSupported;if(!Oe||!Le)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Qr(X,ye)===void 0||!Rl(q))throw new Error(`Unsupported data type: ${q}`);if(!Le(e,q,!1))throw new Error(`preferredLocation "ml-tensor" for ${q} output is not supported by current WebNN Context.`);let ut=await Oe(e,M,X,fe,!1);U=!0,D.push([q,fe,{mlTensor:ut,download:d.webnnCreateMLTensorDownloader(M,q),dispose:()=>{d.webnnReleaseTensorId(M),d._OrtReleaseTensor(C)}},"ml-tensor"])}else if(Me==="ml-tensor-cpu-output"&&ye>0){let Oe=d.webnnCreateMLTensorDownloader(M,q)(),Le=D.length;U=!0,Q.push((async()=>{let ut=[Le,await Oe];return d.webnnReleaseTensorId(M),d._OrtReleaseTensor(C),ut})()),D.push([q,fe,[],"cpu"])}else{let Oe=Lo(q),Le=new Oe(ye);new Uint8Array(Le.buffer,Le.byteOffset,Le.byteLength).set(d.HEAPU8.subarray(M,M+Le.byteLength)),D.push([q,fe,Le,"cpu"])}}finally{d.stackRestore(F),q==="string"&&M&&d._free(M),U||d._OrtReleaseTensor(C)}}p&&!h&&(d._OrtClearBoundOutputs(p.handle)!==0&&Ae("Can't clear bound outputs."),dr.set(e,[r,i,a,p,h,!1]));for(let[w,C]of await Promise.all(Q))D[w][2]=C;return rn("wasm ProcessOutputTensor"),D}finally{d.webnnOnRunEnd?.(r),d.stackRestore(k),S.forEach(W=>d._OrtReleaseTensor(W)),T.forEach(W=>d._OrtReleaseTensor(W)),I.forEach(W=>d._free(W)),_!==0&&d._OrtReleaseRunOptions(_),y.forEach(W=>d._free(W))}},Ql=e=>{let t=Re(),n=dr.get(e);if(!n)throw new Error("invalid session id");let o=n[0],u=t._OrtEndProfiling(o);u===0&&Ae("Can't get an profile file name."),t._OrtFree(u)},ed=e=>{let t=[];for(let n of e){let o=n[2];!Array.isArray(o)&&"buffer"in o&&t.push(o.buffer)}return t}}),cr,xt,bn,ai,ui,mo,du,go,zr,Br,yy,P2,k2,C2,D2,R2,N2,z2,B2=R(()=>{"use strict";ot(),A2(),dn(),Pl(),cr=()=>!!le.wasm.proxy&&typeof document<"u",bn=!1,ai=!1,ui=!1,go=new Map,zr=(e,t)=>{let n=go.get(e);n?n.push(t):go.set(e,[t])},Br=()=>{if(bn||!ai||ui||!xt)throw new Error("worker not ready")},yy=e=>{switch(e.data.type){case"init-wasm":bn=!1,e.data.err?(ui=!0,du[1](e.data.err)):(ai=!0,du[0]()),mo&&(URL.revokeObjectURL(mo),mo=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=go.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},P2=async()=>{if(!ai){if(bn)throw new Error("multiple calls to 'initWasm()' detected.");if(ui)throw new Error("previous call to 'initWasm()' failed.");if(bn=!0,cr())return new Promise((e,t)=>{xt?.terminate(),Sv().then(([n,o])=>{try{xt=o,xt.onerror=l=>t(l),xt.onmessage=yy,du=[e,t];let u={type:"init-wasm",in:le};!u.in.wasm.wasmPaths&&(n||nl)&&(u.in.wasm.wasmPaths={wasm:new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href}),xt.postMessage(u),mo=n}catch(u){t(u)}},t)});try{await kl(le.wasm),await Kl(le),ai=!0}catch(e){throw ui=!0,e}finally{bn=!1}}},k2=async e=>{if(cr())return Br(),new Promise((t,n)=>{zr("init-ep",[t,n]);let o={type:"init-ep",in:{epName:e,env:le}};xt.postMessage(o)});await Xl(le,e)},C2=async e=>cr()?(Br(),new Promise((t,n)=>{zr("copy-from",[t,n]);let o={type:"copy-from",in:{buffer:e}};xt.postMessage(o,[e.buffer])})):Co(e),D2=async(e,t)=>{if(cr()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Br(),new Promise((n,o)=>{zr("create",[n,o]);let u={type:"create",in:{model:e,options:{...t}}},l=[];e instanceof Uint8Array&&l.push(e.buffer),xt.postMessage(u,l)})}else return Zl(e,t)},R2=async e=>{if(cr())return Br(),new Promise((t,n)=>{zr("release",[t,n]);let o={type:"release",in:e};xt.postMessage(o)});Jl(e)},N2=async(e,t,n,o,u,l)=>{if(cr()){if(n.some(d=>d[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(u.some(d=>d))throw new Error("pre-allocated output tensor is not supported for proxy.");return Br(),new Promise((d,c)=>{zr("run",[d,c]);let s=n,r={type:"run",in:{sessionId:e,inputIndices:t,inputs:s,outputIndices:o,options:l}};xt.postMessage(r,ed(s))})}else return Yl(e,t,n,o,u,l)},z2=async e=>{if(cr())return Br(),new Promise((t,n)=>{zr("end-profiling",[t,n]);let o={type:"end-profiling",in:e};xt.postMessage(o)});Ql(e)}}),cu,_y,M2,QA=R(()=>{"use strict";ot(),B2(),se(),Al(),Av(),cu=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},_y=e=>{switch(e[3]){case"cpu":return new mt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Dl(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:n,download:o,dispose:u}=e[2];return mt.fromGpuBuffer(n,{dataType:t,dims:e[1],download:o,dispose:u})}case"ml-tensor":{let t=e[0];if(!Rl(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:n,download:o,dispose:u}=e[2];return mt.fromMLTensor(n,{dataType:t,dims:e[1],download:o,dispose:u})}default:throw new Error(`invalid data location: ${e[3]}`)}},M2=class{async fetchModelAndCopyToWasmMemory(e){return C2(await Nl(e))}async loadModel(e,t){Gt();let n;typeof e=="string"?n=await this.fetchModelAndCopyToWasmMemory(e):n=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await D2(n,t),zt()}async dispose(){return R2(this.sessionId)}async run(e,t,n){Gt();let o=[],u=[];Object.entries(e).forEach(a=>{let p=a[0],h=a[1],m=this.inputNames.indexOf(p);if(m===-1)throw new Error(`invalid input '${p}'`);o.push(h),u.push(m)});let l=[],d=[];Object.entries(t).forEach(a=>{let p=a[0],h=a[1],m=this.outputNames.indexOf(p);if(m===-1)throw new Error(`invalid output '${p}'`);l.push(h),d.push(m)});let c=o.map((a,p)=>cu(a,()=>`input "${this.inputNames[u[p]]}"`)),s=l.map((a,p)=>a?cu(a,()=>`output "${this.outputNames[d[p]]}"`):null),r=await N2(this.sessionId,u,c,d,s,n),i={};for(let a=0;a<r.length;a++)i[this.outputNames[d[a]]]=l[a]??_y(r[a]);return zt(),i}startProfiling(){}endProfiling(){z2(this.sessionId)}}}),F2={};un(F2,{OnnxruntimeWebAssemblyBackend:()=>bl,initializeFlags:()=>gl,wasmBackend:()=>j2});var gl,bl,j2,eP=R(()=>{"use strict";ot(),B2(),QA(),gl=()=>{(typeof le.wasm.initTimeout!="number"||le.wasm.initTimeout<0)&&(le.wasm.initTimeout=0);let e=le.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),le.wasm.simd=!1),typeof le.wasm.proxy!="boolean"&&(le.wasm.proxy=!1),typeof le.wasm.trace!="boolean"&&(le.wasm.trace=!1),typeof le.wasm.numThreads!="number"||!Number.isInteger(le.wasm.numThreads)||le.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)le.wasm.numThreads=1;else{let t=typeof navigator>"u"?pu("node:os").cpus().length:navigator.hardwareConcurrency;le.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},bl=class{async init(e){gl(),await P2(),await k2(e)}async createInferenceSessionHandler(e,t){let n=new M2;return await n.loadModel(e,t),n}},j2=new bl});ot();ot();ot();var tP="1.29.0";{let e=(QE(),Tn(yv)).onnxjsBackend;en("webgl",e,-10)}{let e=(eP(),Tn(F2)).wasmBackend;en("webgpu",e,5),en("webnn",e,5),en("cpu",e,10),en("wasm",e,10)}Object.defineProperty(le.versions,"web",{value:tP,enumerable:!0});function L2(){return le.versions.web??""}function V2(e={}){le.wasm.numThreads=e.wasmThreads??1,e.wasmPaths!==void 0&&(le.wasm.wasmPaths=e.wasmPaths)}var Vo=[];function td(){let e=Vo;return Vo=[],e}async function Uo(e,t,n){for(let o of t){let u=null;try{if(u=await Ro.create(e.slice().buffer,{executionProviders:[o]}),await n(u))return{session:u,ep:o};Vo.push(`${o}: the model does not have the inputs and outputs the release describes`)}catch(l){Vo.push(`${o}: ${l instanceof Error?l.message:String(l)}`.slice(0,300))}await u?.release().catch(()=>{})}return null}function Cn(e,t){return new mt("float32",e,t)}function rd(e){return{cx:e.x+e.width/2,cy:e.y+e.height/2,w:e.width,h:e.height,angle:0}}function Pi(e,t){let n=Math.max(e.x,t.x),o=Math.max(e.y,t.y),u=Math.min(e.x+e.width,t.x+t.width),l=Math.min(e.y+e.height,t.y+t.height);if(u<=n||l<=o)return 0;let d=(u-n)*(l-o);return d/(e.width*e.height+t.width*t.height-d)}function U2(e,t,n,o){let u=[...e].sort((d,c)=>n(c)-n(d)),l=[];for(let d of u){let c=t(d);l.every(s=>Pi(c,t(s))<o)&&l.push(d)}return l}var $r=0;var pn=5,G2={threshold:.3,nmsIou:.45,maxProposals:80},Dn=24,Ke=Math.fround,nP=Ke(1e-9);function iP(e,t,n,o=G2){if(!Number.isInteger(t)||t<=pn)throw new Error(`decodeDetections: ${t} columns leave no class score`);if(e.length%t!==0)throw new Error(`decodeDetections: ${e.length} values is not a multiple of ${t}`);let u=e.length/t,l=Ke(o.threshold),d=Ke(o.nmsIou),c=[],s=[],r=[];for(let _=0;_<u;_++){let y=_*t,S=e[y+4],T=0,I=Ke(S*e[y+pn]);for(let A=1;A<t-pn;A++){let k=Ke(S*e[y+pn+A]);k>I&&(I=k,T=A)}I>=l&&(c.push(_),s.push(I),r.push(T))}let i=c.length;if(i===0)return[];let a=new Float32Array(i),p=new Float32Array(i),h=new Float32Array(i),m=new Float32Array(i);for(let _=0;_<i;_++){let y=c[_]*t,S=e[y],T=e[y+1],I=Ke(e[y+2]/2),A=Ke(e[y+3]/2);a[_]=S-I,p[_]=T-A,h[_]=S+I,m[_]=T+A}let b=Array.from({length:i},(_,y)=>y).sort((_,y)=>s[y]-s[_]||_-y),x=[];for(;b.length>0;){let _=b[0];if(x.push(_),b.length===1)break;let y=Ke(Ke(h[_]-a[_])*Ke(m[_]-p[_])),S=[];for(let T=1;T<b.length;T++){let I=b[T],A=Math.max(Ke(Math.min(h[_],h[I])-Math.max(a[_],a[I])),0),k=Math.max(Ke(Math.min(m[_],m[I])-Math.max(p[_],p[I])),0),O=Ke(A*k),z=Ke(Ke(h[I]-a[I])*Ke(m[I]-p[I]));Ke(O/Ke(Ke(Ke(y+z)-O)+nP))<=d&&S.push(I)}b=S}return x.slice(0,o.maxProposals).map(_=>{let y={x:a[_]/n,y:p[_]/n,width:Ke(h[_]-a[_])/n,height:Ke(m[_]-p[_])/n};return{aabb:y,rect:rd(y),score:s[_],cls:r[_]}})}function nd(e,t,n,o=Dn){let u=Math.trunc(Math.max(0,e.x)),l=Math.trunc(Math.max(0,e.y)),d=Math.trunc(Math.min(t,e.x+e.width)),c=Math.trunc(Math.min(n,e.y+e.height));return d-u>=o&&c-l>=o}function q2(e,t,n,o,u,l=G2,d=Dn){return iP(e,t,n,l).filter(c=>nd(c.aabb,o,u,d))}function oP(e,t,n,o,u){let l=o/t,d=u/n;return[Math.max(0,e.x*l),Math.max(0,e.y*d),Math.min(o,(e.x+e.width)*l),Math.min(u,(e.y+e.height)*d)]}function H2(e,t){let n=e.aabb;if(n.x>=0&&n.y>=0&&n.x+n.width<=t.width&&n.y+n.height<=t.height)return e;let[o,u,l,d]=oP(n,t.width,t.height,t.width,t.height),c={x:o,y:u,width:Math.max(0,l-o),height:Math.max(0,d-u)};return{...e,aabb:c,rect:rd(c)}}function W2(e,t=$r){let n=[],o=[];for(let u of e)(u.cls===t?n:o).push(u);return{faces:n,others:o}}function sP(e){return e<0&&(e=-e),e<1?1-e:0}function K2(e,t){let n=e/t,o=n<1?1:n,u=o,l=Math.ceil(u)*2+1,d=new Int32Array(t*2),c=new Int32Array(t*l),s=new Float64Array(l);for(let r=0;r<t;r++){let i=(r+.5)*n,a=0,p=1/o,h=Math.trunc(i-u+.5);h<0&&(h=0);let m=Math.trunc(i+u+.5);m>e&&(m=e),m-=h;for(let b=0;b<m;b++){let x=sP((b+h-i+.5)*p);s[b]=x,a+=x}for(let b=0;b<m;b++)a!==0&&(s[b]=s[b]/a);for(let b=m;b<l;b++)s[b]=0;for(let b=0;b<l;b++){let x=s[b];c[r*l+b]=x<0?Math.trunc(-.5+x*4194304):Math.trunc(.5+x*4194304)}d[r*2]=h,d[r*2+1]=m}return{ksize:l,bounds:d,kk:c}}function Go(e){let t=e>>22;return t<0?0:t>255?255:t}var X2="",id=null,od=null;function aP(e,t,n,o){let u=`${e}x${t}>${n}x${o}`;return(u!==X2||!id||!od)&&(id=K2(e,n),od=K2(t,o),X2=u),{h:id,v:od}}function Z2(e,t,n,o,u){let{h:l,v:d}=aP(t,n,o,u),c=o!==t,s=u!==n,r,i;if(c){let _=s?d.bounds[0]:0,S=(s?d.bounds[u*2-2]+d.bounds[u*2-1]:n)-_;i=_,r=new Uint8Array(o*S*3);let{ksize:T,bounds:I,kk:A}=l;for(let k=0;k<S;k++){let O=(k+_)*t*4,z=k*o*3;for(let G=0;G<o;G++){let Y=I[G*2],W=I[G*2+1],D=G*T,Q=2097152,w=2097152,C=2097152,F=O+Y*4;for(let U=0;U<W;U++,F+=4){let q=A[D+U];Q+=e[F]*q,w+=e[F+1]*q,C+=e[F+2]*q}let V=z+G*3;r[V]=Go(Q),r[V+1]=Go(w),r[V+2]=Go(C)}}}else{i=0,r=new Uint8Array(t*n*3);for(let _=0,y=0;_<r.length;_+=3,y+=4)r[_]=e[y],r[_+1]=e[y+1],r[_+2]=e[y+2]}if(!s)return r;let a=new Uint8Array(o*u*3),p=o*3,h=new Int32Array(p),{ksize:m,bounds:b,kk:x}=d;for(let _=0;_<u;_++){let y=b[_*2]-i,S=b[_*2+1],T=_*m;h.fill(2097152);for(let A=0;A<S;A++){let k=x[T+A],O=(A+y)*p;for(let z=0;z<p;z++)h[z]=h[z]+r[O+z]*k}let I=_*p;for(let A=0;A<p;A++)a[I+A]=Go(h[A])}return a}var Y2={width:640,height:384,pad:114};function J2(e){let t=Math.floor(e),n=e-t;return n>.5?t+1:n<.5||t%2===0?t:t+1}function uP(e,t,n=Y2){let o=Math.min(n.height/t,n.width/e);return{ratio:o,width:J2(e*o),height:J2(t*o)}}function Q2(e,t,n,o=Y2){let u=uP(t,n,o),l=Z2(e,t,n,u.width,u.height),d=o.width*o.height,c=new Float32Array(3*d).fill(o.pad);for(let s=0;s<u.height;s++)for(let r=0;r<u.width;r++){let i=(s*u.width+r)*3,a=s*o.width+r;c[a]=l[i+2],c[d+a]=l[i+1],c[2*d+a]=l[i]}return{...u,tensor:c}}var qo=class e{constructor(t,n,o){this.session=t;this.ep=n;this.settings=o;this.columns=pn+o.classes.length}session;ep;settings;lastTimings=null;columns;static async create(t,n,o){let{width:u,height:l}=n.letterbox,d=pn+n.classes.length,c=await Uo(t,o,async s=>{let i=(await s.run({[n.inputName]:Cn(new Float32Array(3*u*l),[1,3,l,u])}))[n.outputName]?.dims??[];return i.length===3&&i[0]===1&&i[1]===n.anchors&&i[2]===d});return c?new e(c.session,c.ep,n):null}async propose(t){let{letterbox:n,inputName:o,outputName:u,decode:l,minCropPx:d}=this.settings,c=performance.now(),{tensor:s,ratio:r}=Q2(t.data,t.width,t.height,n),i=performance.now(),a=await this.session.run({[o]:Cn(s,[1,3,n.height,n.width])});return this.lastTimings={preprocessMs:i-c,inferMs:performance.now()-i},q2(a[u].data,this.columns,r,t.width,t.height,l,d)}async release(){await this.session.release().catch(()=>{})}};var lP=32;async function dP(e,t,n,o,u=lP){if(n<=u)return e(t,n);let l=t.length/n,d=new Float32Array(n*o);for(let c=0;c<n;c+=u){let s=Math.min(u,n-c),r=await e(t.slice(c*l,(c+s)*l),s);if(r.length!==s*o)throw new Error(`unexpected embedding size ${r.length} for ${s} crops`);d.set(r,c*o)}return d}var Ho=class e{constructor(t,n,o){this.session=t;this.ep=n;this.settings=o}session;ep;settings;static async create(t,n,o){let u=n.inputSize,l=await Uo(t,o,async d=>(await d.run({[n.inputName]:Cn(new Float32Array(3*u*u),[1,3,u,u])}))[n.outputName]?.data.length===n.dim);return l?new e(l.session,l.ep,n):null}async embedBatch(t,n){return dP((o,u)=>this.run(o,u),t,n,this.settings.dim)}async run(t,n){let{inputName:o,outputName:u,inputSize:l,dim:d}=this.settings,s=(await this.session.run({[o]:Cn(t,[n,3,l,l])}))[u].data;if(s.length!==n*d)throw new Error(`unexpected embedding size ${s.length} for ${n} crops`);return s}async release(){await this.session.release().catch(()=>{})}};var sd=["orb","akaze","sift"],e$=["none","median"],t$=["bf","flann"],r$=["homography","affine","similarity"],n$=["ransac","usac"],s$={orb:[["scaleFactor",1.2,!1],["nLevels",8,!0],["edgeThreshold",15,!0],["patchSize",15,!0],["fastThreshold",10,!0]],akaze:[["threshold",.001,!1],["nOctaves",4,!0],["nOctaveLayers",4,!0]],sift:[["nOctaveLayers",3,!0],["contrastThreshold",.04,!1],["edgeThreshold",10,!1],["sigma",1.6,!1]]},WC=Object.fromEntries(sd.map(e=>[e,Object.fromEntries(s$[e].map(([t,n])=>[t,n]))])),i$=Object.freeze({seed:0,features:{type:"orb",maxFeatures:300,artLongSide:320,mask:[],params:{}},crop:{longSide:320,maxFeatures:500},candidates:{embeddingTopK:5,voteTopN:0},vote:{matcher:"bf",ratio:.8,lshTables:12,lshKeySize:20,lshProbes:2,kdTrees:4,checks:64},match:{ratio:.8},ransac:{model:"homography",method:"ransac",threshold:6,maxIters:2e3,confidence:.995,minAreaRatio:.25,maxAreaRatio:4},fusion:{weight:.1,minInliers:8,fullInliers:30,penalty:0,baseline:"none",reorder:!0},gate:{belowAccept:!1,sources:null}}),a$=["features","crop","candidates","vote","match","ransac","fusion","gate"],o$=["index","seed",...a$],cP=/^[0-9a-f]{64}$/,ki=class extends Error{errors;constructor(t){super(t.join("; ")),this.name="GeometricConfigError",this.errors=[...t]}},ad=class{constructor(t,n=null,o=null){this.indexPath=n;this.indexSha256=o;this.settings=u$(structuredClone(t))}indexPath;indexSha256;settings;get seed(){return this.settings.seed}get features(){return this.settings.features}toJson(){return structuredClone(this.settings)}};function u$(e){if(typeof e=="object"&&e!==null&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.values(e))u$(t)}return e}function Wo(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function Rn(e){return typeof e=="number"&&Number.isInteger(e)}function Tr(e){return typeof e=="number"}function pP(e){let t=e.includes("'")&&!e.includes('"')?'"':"'",n="";for(let o of e){let u=o.codePointAt(0);o==="\\"?n+="\\\\":o===t?n+=`\\${t}`:o===`
`?n+="\\n":o==="\r"?n+="\\r":o==="	"?n+="\\t":u<32||u===127?n+=`\\x${u.toString(16).padStart(2,"0")}`:n+=o}return t+n+t}function yt(e){return typeof e=="string"?pP(e):e==null?"None":typeof e=="boolean"?e?"True":"False":Array.isArray(e)?`[${e.map(yt).join(", ")}]`:typeof e=="number"?(Number.isInteger(e),String(e)):JSON.stringify(e)}function Ci(e){return[...e].sort((t,n)=>t<n?-1:t>n?1:0)}function Nn(e){return Object.keys(e)}function zn(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function hP(e,t){let n=structuredClone(i$);zn(e,"seed")&&(n.seed=e.seed);for(let o of a$){let u=zn(e,o)?e[o]:{};if(!Wo(u)){t.push(`${o} must be an object`);continue}let l=Nn(i$[o]),d=Ci(Nn(u).filter(s=>!l.includes(s)));d.length>0&&t.push(`${o} has unknown key(s) ${yt(d)} (expected ${yt(Ci(l))})`);let c=n[o];for(let s of Nn(u))l.includes(s)&&(c[s]=structuredClone(u[s]))}return n}function fP(e,t){let n=e.type;if(typeof n!="string"||!sd.includes(n)){t.push(`features.type must be one of ${yt([...sd])}, got ${yt(n)}`);return}for(let i of["maxFeatures","artLongSide"]){let a=e[i];(!Rn(a)||a<1)&&t.push(`features.${i} must be a whole number of at least 1`)}let o=e.mask,u=i=>Array.isArray(i)&&i.length===4&&i.every(a=>Tr(a)&&0<=a&&a<=1)&&i[0]<i[2]&&i[1]<i[3];(!Array.isArray(o)||!o.every(u))&&t.push("features.mask must be a list of [x0, y0, x1, y1] fractions from 0 to 1, x0 < x1 and y0 < y1");let l=e.params;if(!Wo(l)){t.push("features.params must be an object");return}let d=s$[n],c=d.map(([i])=>i),s=Ci(Nn(l).filter(i=>!c.includes(i)));s.length>0&&t.push(`features.params has unknown key(s) ${yt(s)} for ${n} (expected ${yt(Ci(c))})`);let r={};for(let[i,a]of d)r[i]=zn(l,i)?l[i]:a;for(let[i,,a]of d){let p=r[i];(a&&!Rn(p)||!Tr(p)||p<=0)&&t.push(`features.params.${i} must be a ${a?"whole ":""}number above 0`)}e.params=r}function mP(e,t){let n=e.seed;(!Rn(n)||n<0)&&t.push("seed must be a whole number of 0 or more"),fP(e.features,t);let o=e.crop,u=e.candidates,l=e.vote,d=e.match,c=e.ransac,s=e.fusion,r=[["crop",o,"longSide",1],["crop",o,"maxFeatures",1],["candidates",u,"embeddingTopK",0],["candidates",u,"voteTopN",0],["ransac",c,"maxIters",1],["vote",l,"lshTables",1],["vote",l,"lshKeySize",1],["vote",l,"lshProbes",0],["vote",l,"kdTrees",1],["vote",l,"checks",1],["fusion",s,"minInliers",0],["fusion",s,"fullInliers",1]];for(let[m,b,x,_]of r){let y=b[x];(!Rn(y)||y<_)&&t.push(`${m}.${x} must be a whole number of at least ${_}`)}Rn(u.embeddingTopK)&&Rn(u.voteTopN)&&u.embeddingTopK+u.voteTopN===0&&t.push("candidates: embeddingTopK and voteTopN cannot both be 0"),t$.includes(l.matcher)||t.push(`vote.matcher must be one of ${yt([...t$])}`);for(let[m,b]of[["vote",l],["match",d]]){let x=b.ratio;(!Tr(x)||!(0<x&&x<=1))&&t.push(`${m}.ratio must be a number above 0 and at most 1`)}r$.includes(c.model)||t.push(`ransac.model must be one of ${yt([...r$])}`),n$.includes(c.method)?c.method==="usac"&&c.model==="similarity"&&t.push('ransac.method "usac" is not available for the "similarity" model in OpenCV; use "ransac"'):t.push(`ransac.method must be one of ${yt([...n$])}`),(!Tr(c.threshold)||c.threshold<=0)&&t.push("ransac.threshold must be a number above 0"),(!Tr(c.confidence)||!(0<c.confidence&&c.confidence<1))&&t.push("ransac.confidence must be a number above 0 and below 1");let i=c.minAreaRatio,a=c.maxAreaRatio;(!Tr(i)||!Tr(a)||i<0||a<0||a!==0&&i>a)&&t.push("ransac.minAreaRatio and maxAreaRatio must be numbers of 0 or more, the first at most the second");for(let m of["weight","penalty"]){let b=s[m];(!Tr(b)||b<0)&&t.push(`fusion.${m} must be a number of 0 or more`)}let p=e.gate;typeof p.belowAccept!="boolean"&&t.push("gate.belowAccept must be true or false");let h=p.sources;h!==null&&(!Array.isArray(h)||h.length===0||!h.every(m=>typeof m=="string"&&m.length>0))&&t.push('gate.sources must be null or a non-empty list of source types or patterns, e.g. ["physical/*"]'),e$.includes(s.baseline)||t.push(`fusion.baseline must be one of ${yt([...e$])}`),typeof s.reorder!="boolean"&&t.push("fusion.reorder must be true or false")}function gP(e,t=null,n="geometric settings"){if(!Wo(e))throw new ki([`${n}: must be a JSON object`]);let o=[],u=Ci(Nn(e).filter(r=>!o$.includes(r)));u.length>0&&o.push(`unknown key(s) ${yt(u)} (expected ${yt(o$)})`);let l=zn(e,"index")?e.index:{},d=null,c=null;if(!Wo(l)||Nn(l).some(r=>r!=="path"&&r!=="sha256"))o.push('index must be an object with the keys "path" and "sha256"');else{let r=zn(l,"path")?l.path:null;r!=null&&(typeof r!="string"||r.length===0?o.push("index.path must be a file path"):d=t===null?r:new URL(r,t).href);let i=zn(l,"sha256")?l.sha256:null;i!=null&&(typeof i!="string"||!cP.test(i)?o.push("index.sha256 must be 64 lowercase hex digits"):c=i)}let s=hP(e,o);if(mP(s,o),o.length>0)throw new ki(o.map(r=>`${n}: ${r}`));return new ad(Object.freeze(s),d,c)}function l$(e,t=null,n="geometric settings"){let o;try{o=JSON.parse(e)}catch(u){throw new ki([`${n}: not valid JSON: ${u instanceof Error?u.message:String(u)}`])}return gP(o,t,n)}function d$(e){let t=Math.round(e);return t-e===.5&&t%2!==0?t-1:t}function bP(e,t,n){let o=n/Math.max(t,e);return o===1?{size:[e,t],scale:o}:{size:[Math.max(1,d$(e*o)),Math.max(1,d$(t*o))],scale:o}}function yP(e,t,n,o,u){let l=new e.Mat(o,n,e.CV_8UC4),d=new e.Mat;try{l.data.set(t.subarray(0,n*o*4)),e.cvtColor(l,d,e.COLOR_RGBA2GRAY)}finally{l.delete()}let{size:c,scale:s}=bP(n,o,u);if(s===1)return d;let r=new e.Mat;try{e.resize(d,r,new e.Size(c[0],c[1]),0,0,s<1?e.INTER_AREA:e.INTER_LINEAR)}catch(i){throw r.delete(),i}finally{d.delete()}return r}function _P(e,t,n){return new e.ORB(t,n.scaleFactor,n.nLevels,n.edgeThreshold,0,2,e.ORB_HARRIS_SCORE,n.patchSize,n.fastThreshold)}function wP(e,t){let n=Array.from({length:e.length},(o,u)=>u);return n.sort((o,u)=>e[u]-e[o]),n.slice(0,t)}function c$(e,t,n,o,u,l,d){let c=yP(e,t,n,o,u),s=[c.cols,c.rows],r=_P(e,l,d),i=new e.KeyPointVector,a=new e.Mat,p=new e.Mat;try{r.detectAndCompute(c,p,i,a,!1);let h=i.size();if(h===0||a.empty()||a.rows===0)return{n:0,xy:new Float32Array(0),desc:new Uint8Array(0),size:s};let m=a.cols,b=new Float64Array(h),x=new Float32Array(h*2);for(let I=0;I<h;I++){let A=i.get(I);b[I]=A.response,x[2*I]=A.pt.x,x[2*I+1]=A.pt.y}let _=wP(b,l),y=new Float32Array(_.length*2),S=new Uint8Array(_.length*m),T=a.data;return _.forEach((I,A)=>{y[2*A]=x[2*I],y[2*A+1]=x[2*I+1],S.set(T.subarray(I*m,(I+1)*m),A*m)}),{n:_.length,xy:y,desc:S,size:s}}finally{c.delete(),r.delete(),i.delete(),a.delete(),p.delete()}}var p$="embedding",h$="vote",f$="both";function m$(e,t,n){return t>=n.minInliers?e+n.weight*Math.min(t,n.fullInliers)/n.fullInliers:e-n.penalty}function vP(e){let t=[...e].sort((u,l)=>u-l),n=t.length;if(n===0)return Number.NaN;let o=n>>1;return n%2===1?t[o]:(t[o-1]+t[o])/2}function g$(e,t){return t.baseline==="median"&&e.length>0?vP(e):0}function b$(e,t){return Math.max(0,e-t)}function y$(e,t,n){let o=new Float64Array(e);for(let u of t){let l=u.fused-u.cosine;for(let d of n(u.cardId))o[d]=o[d]+l}return o}var xP=10n;function $P(e){let t=new DataView(new ArrayBuffer(8));t.setFloat64(0,e);let n=t.getUint32(0),o=t.getUint32(4),u=n>>>31?-1n:1n,l=n>>>20&2047,d=BigInt(n&1048575)<<32n|BigInt(o),c;return l===0?c=-1074:(d|=1n<<52n,c=l-1075),{mantissa:u*d,exponent:c}}function Di(e,t){if(!Number.isFinite(e)||e===0)return e;let{mantissa:n,exponent:o}=$P(e),u=n<0n,d=(u?-n:n)*xP**BigInt(t),c=1n;o>=0?d<<=BigInt(o):c<<=BigInt(-o);let s=d/c,i=2n*(d-s*c);if((i>c||i===c&&s%2n===1n)&&(s+=1n),s===0n)return u?-0:0;let a=`${u?"-":""}${s.toString()}e-${t}`;return Number(a)}function TP(e){return{cardId:e.cardId,cosine:Di(e.cosine,6),foundBy:e.foundBy,votes:e.votes,matches:e.matches,inliers:e.inliers,evidence:Di(e.evidence,6),fused:Di(e.fused,6)}}function _$(e,t){return{before:{topId:e.topId,similarity:Di(e.similarity,6),margin:Di(e.margin,6),accepted:e.accepted},candidates:t.candidates.map(TP)}}function v$(e,t,n,o,u,l,d){let c=new Map;for(let s=n;s<n+t;s++){let r=e.best[s];if(r===4294967295)continue;let i=o[r],a=e.second[s];if(a!==4294967295){let p=o[a];if(p!==i&&u[p]!==u[i]&&l[p]!==l[i]&&e.dBest[s]>=d*e.dSecond[s])continue}c.set(i,(c.get(i)??0)+1)}return c}function x$(e,t,n,o,u,l,d=32){let c=new e.Mat(n,d,e.CV_8UC1),s=new e.Mat(u,d,e.CV_8UC1),r=new e.BFMatcher(e.NORM_HAMMING,!1),i=new e.DMatchVectorVector;try{c.data.set(t.subarray(0,n*d)),s.data.set(o.subarray(0,u*d)),r.knnMatch(c,s,i,2);let a=[],p=i.size();for(let h=0;h<p;h++){let m=i.get(h);try{if(m.size()!==2)continue;let b=m.get(0),x=m.get(1);b.distance<l*x.distance&&a.push({queryIdx:b.queryIdx,trainIdx:b.trainIdx})}finally{m.delete?.()}}return a}finally{c.delete(),s.delete(),r.delete(),i.delete()}}var SP={homography:4,affine:3,similarity:2};function $$(e,t){return t.model==="homography"&&(typeof e.findHomography!="function"||typeof e.perspectiveTransform!="function")?'this OpenCV build has no findHomography (the "homography" model)':t.model==="similarity"&&typeof e.estimateAffinePartial2D!="function"?'this OpenCV build has no estimateAffinePartial2D (the "similarity" model)':t.method==="usac"&&typeof e.USAC_MAGSAC!="number"?'this OpenCV build has no USAC ("usac" method)':null}function IP(e,t){let[n,o]=t;return e.matFromArray(4,1,e.CV_32FC2,[0,0,n,0,n,o,0,o])}function OP(e,t,n,o,u){let l=IP(e,o),d=new e.Mat;try{t.rows===3&&t.cols===3?e.perspectiveTransform(l,d,t):e.transform(l,d,t);let c=new Float32Array(d.data.buffer,d.data.byteOffset,8);for(let r=0;r<8;r++)if(!Number.isFinite(c[r]))return!1;if(!e.isContourConvex(d))return!1;let s=Math.abs(e.contourArea(d,!1))/(n[0]*n[1]);return u.minAreaRatio<=s&&s<=u.maxAreaRatio}finally{l.delete(),d.delete()}}function T$(e,t,n,o,u,l){let d=t.length/2;if(d<SP[l.model])return 0;let c=l.method==="ransac"?e.RANSAC:e.USAC_MAGSAC,s=e.matFromArray(d,1,e.CV_32FC2,t),r=e.matFromArray(d,1,e.CV_32FC2,n),i=new e.Mat,a=null;try{let{threshold:p,maxIters:h,confidence:m}=l;if(l.model==="homography"?a=e.findHomography(s,r,c,p,i,h,m):l.model==="affine"?a=e.estimateAffine2D(s,r,i,c,p,h,m,10):a=e.estimateAffinePartial2D(s,r,i,c,p,h,m),!a||a.empty()||a.rows===0||i.empty()||l.maxAreaRatio>0&&!OP(e,a,o,u,l))return 0;let b=0,x=i.data;for(let _=0;_<x.length;_++)x[_]!==0&&(b+=1);return b}finally{s.delete(),r.delete(),i.delete(),a?.delete()}}var Bn=32,Ko=()=>typeof performance<"u"?performance.now():Date.now();function S$(e,t){let n=e.settings;return n.features.type!=="orb"?`features.type ${JSON.stringify(n.features.type)} is not ported (only "orb")`:n.candidates.voteTopN>0&&n.vote.matcher!=="bf"?`vote.matcher ${JSON.stringify(n.vote.matcher)} is not ported (only "bf")`:$$(t,n.ransac)}var ud=class{constructor(t,n,o,u,l=new Map){this.config=t;this.index=n;this.voter=o;this.cv=u;let d=S$(t,u);if(d)throw new Error(d);n.cards.forEach((c,s)=>this.position.set(c.cardId,s)),this.identity=n.cards.map(c=>l.get(c.cardId)??c.cardId),this.image=n.cards.map(c=>c.artV??c.cardId)}config;index;voter;cv;position=new Map;identity;image;get reorder(){return this.config.settings.fusion.reorder}applies(t,n){let o=this.config.settings.gate;return o.belowAccept&&n?!1:o.sources===null?!0:t!==null&&o.sources.some(u=>EP(t,u))}dispose(){this.voter.dispose()}cropFeatures(t){let{crop:n,features:o}=this.config.settings;return c$(this.cv,t.rgba,t.width,t.height,n.longSide,n.maxFeatures,o.params)}inliers(t,n){let o=this.index.cards[n];if(t.n<2||o.n<2)return[0,0];let u=this.index.desc.subarray(o.start*Bn,(o.start+o.n)*Bn),l=x$(this.cv,t.desc,t.n,u,o.n,this.config.settings.match.ratio,Bn);if(l.length===0)return[0,0];let d=new Float32Array(l.length*2),c=new Float32Array(l.length*2),s=this.index.xy;return l.forEach((r,i)=>{d[2*i]=s[2*(o.start+r.trainIdx)],d[2*i+1]=s[2*(o.start+r.trainIdx)+1],c[2*i]=t.xy[2*r.queryIdx],c[2*i+1]=t.xy[2*r.queryIdx+1]}),[l.length,T$(this.cv,d,c,t.size,[o.width,o.height],this.config.settings.ransac)]}async verify(t,n){return(await this.verifyBatch([t],n))[0]}async verifyBatch(t,n){let o=this.config.settings,u=t.map(()=>0),l=t.map((c,s)=>{this.cv.setRNGSeed?.(o.seed);let r=Ko(),i=this.cropFeatures(c);return u[s]=u[s]+Ko()-r,i}),d=t.map(()=>new Map);if(o.candidates.voteTopN>0&&this.index.rows>0){let c=l.reduce((s,r)=>s+r.n,0);if(c>0){let s=new Uint8Array(c*Bn),r=[],i=0;for(let p of l)r.push(i),s.set(p.desc.subarray(0,p.n*Bn),i*Bn),i+=p.n;let a=await this.voter.knn2(s);l.forEach((p,h)=>{p.n<1||(d[h]=v$(a,p.n,r[h],this.index.rowCard,this.identity,this.image,o.vote.ratio))})}}return t.map((c,s)=>{let r=Ko(),i=this.finish(c,l[s],d[s],n);return u[s]=u[s]+Ko()-r,{...i,ms:Math.round(u[s]*1e3)/1e3}})}finish(t,n,o,u){let l=this.config.settings,d=new Map;for(let{cardId:S,cosine:T}of t.ranked)d.has(S)||d.set(S,T);let c=[...d.keys()];c.sort((S,T)=>d.get(T)-d.get(S));let s=0,r=!0;for(let S of d.values())(r||S<s)&&(s=S),r=!1;let i=c.slice(0,l.candidates.embeddingTopK),a=new Map;for(let[S,T]of o)a.set(this.index.cards[S].cardId,T);let p=[...a.keys()].filter(S=>u===void 0||u.has(S)).sort((S,T)=>a.get(T)-a.get(S)||this.position.get(S)-this.position.get(T)).slice(0,l.candidates.voteTopN),h=[...new Set([...i,...p])],m=new Map;for(let S of h){let T=this.position.get(S);T!==void 0&&m.set(S,this.inliers(n,T))}let b=g$([...m.values()].map(([,S])=>S),l.fusion),x=new Set(i),_=new Set(p);return{candidates:h.map(S=>{let T=x.has(S)&&_.has(S)?f$:x.has(S)?p$:h$,I=d.get(S)??s,A=m.get(S);if(A===void 0)return{cardId:S,cosine:I,foundBy:T,votes:0,matches:0,inliers:0,evidence:0,fused:I,indexed:!1};let[k,O]=A,z=b$(O,b);return{cardId:S,cosine:I,foundBy:T,votes:a.get(S)??0,matches:k,inliers:O,evidence:z,fused:m$(I,z,l.fusion),indexed:!0}}),cropKeypoints:n.n,ms:0}}};function EP(e,t){let n="";for(let o=0;o<t.length;o++){let u=t[o];if(u==="*")n+="[\\s\\S]*";else if(u==="?")n+="[\\s\\S]";else if(u==="["){let l=o+1;for(t[l]==="!"&&l++,t[l]==="]"&&l++;l<t.length&&t[l]!=="]";)l++;if(l>=t.length)n+="\\[";else{let d=t.slice(o+1,l).replace(/\\/g,"\\\\");d.startsWith("!")?d="^"+d.slice(1):d.startsWith("^")&&(d="\\"+d),n+=`[${d}]`,o=l}}else n+=u.replace(/[.*+?^${}()|[\]\\/]/g,"\\$&")}return new RegExp(`^(?:${n})$`).test(e)}function I$(e,t,n){let o=new Map;for(let u of e)o.set(u.id,t==="printing"?u.printingOf??u.id:u.name);if(n)for(let u of n.groups){let l=u.find(d=>!n.representative.has(d))??[...u].sort()[0];for(let d of u)o.set(d,`group:${n.representative.get(d)??l}`)}return o}var Xo=class{constructor(t=1500,n=2){this.limitMs=t;this.frames=n}limitMs;frames;run=0;observe(t){return this.run=t>this.limitMs?this.run+1:0,this.run>=this.frames}reset(){this.run=0}};function ld(e,t){if(e===t)return!0;if(Array.isArray(e)||Array.isArray(t))return Array.isArray(e)&&Array.isArray(t)&&e.length===t.length&&e.every((u,l)=>ld(u,t[l]));if(typeof e!="object"||typeof t!="object"||e===null||t===null)return!1;let n=Object.keys(e),o=Object.keys(t);return n.length===o.length&&n.every(u=>Object.hasOwn(t,u)&&ld(e[u],t[u]))}function AP(e,t){return[...new Set([...Object.keys(e),...Object.keys(t)])].filter(o=>!ld(e[o],t[o])).sort()}function PP(e,t){let n=/Version control:\s*(\S+)/.exec(t.getBuildInformation?.()??"")?.[1]??"";return e===n?null:`the descriptor index was built with OpenCV ${e||"of an unrecorded version"} and OpenCV ${n||"of an unknown version"} is running; keypoints may differ slightly from the index's`}async function O$(e,t){let n=l$(await t.fetchText(e),e,e.split("/").pop()||"geometric settings");if(n.indexPath===null||n.indexSha256===null)throw new Error("index.path and index.sha256 are both needed");let o=await t.loadIndex(n.indexPath,{bankSha256:t.bankSha256,bankIds:t.bankIds});if(o.sourceSha256!==n.indexSha256)throw new Error(`the packed index repacks ${o.sourceSha256}, not the ${n.indexSha256} the settings pin`);let u=AP(n.settings.features,o.features);if(u.length>0)throw new Error(`the index was built with other features settings (differing: ${u.join(", ")}); build it again with cardvision build-features`);let l=await t.loadCv(),d=S$(n,l);if(d)throw new Error(d);let c=await t.makeVoter(o.desc);try{return{stage:new ud(n,o,c,l,t.identities),bytes:o.desc.byteLength+o.xy.byteLength,note:PP(o.opencv,l)}}catch(s){throw c.dispose(),s}}var er={full128:{id:"full128",size:128,centerMask:!1,poolVersion:2,crop:"truncate"}};function dd(e){return typeof e=="string"&&Object.prototype.hasOwnProperty.call(er,e)}function Zo(e){if(typeof e!="object"||e===null||Array.isArray(e))return null;let t=e;if(!dd(t.id))return null;let n=er[t.id],o=Object.keys(t);return o.length===Object.keys(n).length&&o.every(l=>n[l]===t[l])?t.id:null}function kP(e,t,n,o,u,l){let d=new Float64Array(o*u*3),c=new Uint32Array(o*u);for(let a=0;a<n;a++){let p=Math.min(u-1,Math.floor(a*u/n));for(let h=0;h<t;h++){let m=Math.min(o-1,Math.floor(h*o/t)),b=(a*t+h)*4,x=(p*o+m)*3;d[x]=d[x]+e[b],d[x+1]=d[x+1]+e[b+1],d[x+2]=d[x+2]+e[b+2],c[p*o+m]=c[p*o+m]+1}}for(let a=0;a<c.length;a++){let p=c[a];p>0&&(d[a*3]=d[a*3]/p,d[a*3+1]=d[a*3+1]/p,d[a*3+2]=d[a*3+2]/p)}if(l===1||t>=o&&n>=u||t<=0||n<=0)return d;let s=E$(n,u),r=E$(t,o),i=new Float64Array(d.length);for(let a=0;a<u;a++)for(let p=0;p<o;p++){let h=(s[a]*o+r[p])*3,m=(a*o+p)*3;i[m]=d[h],i[m+1]=d[h+1],i[m+2]=d[h+2]}return i}function E$(e,t){let n=new Uint8Array(t);for(let u=0;u<e;u++)n[Math.min(t-1,Math.floor(u*t/e))]=1;let o=new Int32Array(t);for(let u=0;u<t;u++){if(n[u]){o[u]=u;continue}let l=u-1;for(;l>=0&&!n[l];)l--;let d=u+1;for(;d<t&&!n[d];)d++;o[u]=l>=0&&(d>=t||u-l<=d-u)?l:d}return o}function A$(e,t,n,o){let u=o.size,l=kP(e,t,n,u,u,o.poolVersion),d=new Float32Array(3*u*u),c=u*u;for(let s=0;s<c;s++)for(let r=0;r<3;r++){let i=Math.fround(l[s*3+r]);i=Math.fround(i/255),i=Math.fround(i-.5),i=Math.fround(i/.5),d[r*c+s]=i}return d}function P$(e,t,n){let o=n*n;if(e.length!==3*o)throw new Error(`rotateTensor90: a tensor of ${e.length} values is not 3 x ${n} x ${n}`);let u=(t%4+4)%4;if(u===0)return e;let l=new Float32Array(e.length);for(let d=0;d<3;d++)for(let c=0;c<n;c++)for(let s=0;s<n;s++){let r,i;u===1?(r=n-1-s,i=c):u===2?(r=n-1-c,i=n-1-s):(r=s,i=n-1-c),l[d*o+r*n+i]=e[d*o+c*n+s]}return l}var CP="embedding-bank";function DP(e,t){let n;try{n=atob(e)}catch{return null}if(n.length!==t*2)return null;let o=new Float32Array(t);for(let u=0;u<t;u++){let l=n.charCodeAt(u*2)|n.charCodeAt(u*2+1)<<8,d=l&32768?-1:1,c=l>>10&31,s=l&1023;c===0?o[u]=d*s*2**-24:c===31?o[u]=s?NaN:d*(1/0):o[u]=d*(1+s/1024)*2**(c-15)}return o}function RP(e){return dd(e)?e:Zo(e)}function k$(e){if(typeof e!="object"||e===null)return null;let t=e;if(t.kind!==CP||typeof t.version!="number"||!Number.isInteger(t.version)||typeof t.model!="string"||typeof t.dim!="number"||!Number.isInteger(t.dim)||t.dim<=0||!Array.isArray(t.entries)||t.entries.length===0)return null;let n=RP(t.preprocessing);if(n===null||t.centerMask!==void 0&&t.centerMask!==er[n].centerMask||t.tau!==void 0&&typeof t.tau!="number")return null;let o=t.dim,u=[],l=new Float32Array(t.entries.length*o);for(let d=0;d<t.entries.length;d++){let c=t.entries[d];if(typeof c!="object"||c===null||typeof c.cardId!="string"||typeof c.vec!="string")return null;let s=DP(c.vec,o);if(!s)return null;let r=0;for(let i=0;i<o;i++)r+=s[i]*s[i];if(r=Math.sqrt(r),!(r>0)||!Number.isFinite(r))return null;for(let i=0;i<o;i++)l[d*o+i]=s[i]/r;u.push(c.cardId)}return{ids:u,matrix:l,dim:o,version:t.version,model:t.model,preprocessing:n,tau:typeof t.tau=="number"?t.tau:null}}function Mn(e){return e<0?0:e>1?1:e}function Jo(e,t){let{frameWidth:n,frameHeight:o,names:u}=t;return e.map(l=>{let{aabb:d,rect:c}=l,s={instanceId:l.instanceId,bounds:{x:Mn(d.x/n),y:Mn(d.y/o),width:Mn(d.width/n),height:Mn(d.height/o)},rotation:(c.angle+45)%90-45,localWidth:Mn(c.w/n),localHeight:Mn(c.h/o),landscape:c.w>c.h,cardId:null,name:null};if(l.identity){let r=u.get(l.identity);r!==void 0&&(s.cardId=l.identity,s.name=r)}return s})}var NP=["accepted-nms","best-score","detector-score"];function D$(e){return typeof e=="string"&&NP.includes(e)}var cd="accepted-nms",zP=.5,BP="hover_";function C$(e){return e.width*e.height}function MP(e,t){let n=t==="accepted-nms"?e.kept:e.proposals.map((u,l)=>l),o=(u,l)=>{let d=e.proposals[u],c=e.proposals[l];if(t==="detector-score")return d.detectorScore!==c.detectorScore?d.detectorScore<c.detectorScore?-1:1:l-u;let s=C$(c.aabb)-C$(d.aabb),r=d.score-c.score,i=t==="accepted-nms"?s:r,a=t==="accepted-nms"?r:s;return i!==0?i:a!==0?a:l-u};return[...n].sort(o)}function R$(e,t=cd){return MP(e,t).map((n,o)=>{let u=e.proposals[n];return{proposal:n,aabb:u.aabb,rect:u.rect,identity:u.accepted?u.displayId:null,score:u.score,zIndex:o+1}})}var Yo=class{prev=[];nextId=1;reset(){this.prev=[]}assign(t){let n=new Set,o=t.map((l,d)=>d).sort((l,d)=>t[d].zIndex-t[l].zIndex),u=new Array(t.length);for(let l of o){let d=t[l],c=-1,s=zP;for(let r=0;r<this.prev.length;r++){if(n.has(r)||this.prev[r].identity!==d.identity)continue;let i=Pi(d.aabb,this.prev[r].aabb);i>=s&&(c<0||i>s)&&(c=r,s=i)}c>=0?(n.add(c),u[l]=this.prev[c].id):u[l]=`${BP}${String(this.nextId++).padStart(4,"0")}`}return this.prev=t.map((l,d)=>({id:u[d],aabb:l.aabb,identity:l.identity})),u}};function N$(e,t,n,o=u=>u){return Jo(e.map((l,d)=>({instanceId:t[d],aabb:l.aabb,rect:l.rect,identity:l.identity})),n).map((l,d)=>({...l,zIndex:e[d].zIndex,boxIndex:o(e[d].proposal)}))}var FP="identity-groups";function B$(e){if(typeof e!="object"||e===null)return null;let t=e;if(t.schemaVersion!==1||t.kind!==FP||typeof t.version!="number"||!Number.isInteger(t.version)||!Array.isArray(t.groups)||typeof t.representative!="object"||t.representative===null||Array.isArray(t.representative))return null;let n=new Map,o=[];for(let l of t.groups){if(!Array.isArray(l)||l.length<2)return null;let d=[];for(let c of l){if(typeof c!="string"||c.length===0||n.has(c))return null;n.set(c,o.length),d.push(c)}o.push(d)}let u=new Map;for(let[l,d]of Object.entries(t.representative)){if(typeof d!="string"||l===d)return null;let c=n.get(l);if(c===void 0||n.get(d)!==c)return null;u.set(l,d)}for(let l of o){let d=l.filter(c=>!u.has(c));if(d.length!==1||l.some(c=>u.has(c)&&u.get(c)!==d[0]))return null}return{version:t.version,groups:o,representative:u}}var jP=["name","printing"];function pd(e){return jP.includes(e)}function M$(e,t){return t==="printing"?e.printingOf??e.id:e.name}function F$(e,t){let n=new Map;for(let o of[...new Set(e)].sort(z$)){let u=t.get(o);if(u===void 0)continue;let l=n.get(u);l?l.push(o):n.set(u,[o])}return[...n.values()].filter(o=>o.length>=2).sort((o,u)=>z$(o[0],u[0]))}function z$(e,t){return e<t?-1:e>t?1:0}var Fn=class{rep=new Map;display;constructor(t=null,n,o="representative"){if(this.display=o,!!t)for(let[u,l]of t.representative)o==="representative"&&n&&!n(l)||this.rep.set(u,l)}of(t){return this.rep.get(t)??t}shown(t){return this.display==="best-printing"?t:this.of(t)}get collapsedCount(){return this.rep.size}};var hd=["webgpu","wasm"];var LP=.3;function VP(e,t){let n=Math.max(0,Math.floor(t.x)),o=Math.max(0,Math.floor(t.y)),u=Math.min(e.width,Math.floor(t.x+t.width)),l=Math.min(e.height,Math.floor(t.y+t.height)),d=Math.max(0,u-n),c=Math.max(0,l-o),s=new Uint8ClampedArray(d*c*4);for(let r=0;r<c;r++){let i=((o+r)*e.width+n)*4;s.set(e.data.subarray(i,i+d*4),r*d*4)}return{rgba:s,width:d,height:c}}function jn(e,t){return e.similarity>=t.tau&&e.margin>=t.delta}function UP(e,t,n){if(jn(e,n)||!n.rotationRetry)return{orientation:0,match:e,retried:!1};let o=[e,...t()],u=-1;for(let l=0;l<o.length;l++)jn(o[l],n)&&(u<0||o[l].similarity>o[u].similarity)&&(u=l);if(u<0){u=0;for(let l=1;l<o.length;l++)o[l].similarity>o[u].similarity&&(u=l)}return{orientation:u,match:o[u],retried:!0}}function j$(e){let t=[],n=[];return e.forEach((o,u)=>{o.tauPassed&&(o.orientation===0?t:n).push(u)}),[...t,...n]}function L$(e,t){let n=(t??e.map((o,u)=>u)).filter(o=>e[o].tauPassed);return U2(n,o=>e[o].aabb,o=>e[o].score,LP)}async function V$(e,t,n,o,u=Dn,l=null){let d=n.preprocessing,c=n.rule,s=d.size,r=n.dim,i=[],a=[],p=[];for(let w of o){let C=VP(e,w.aabb),{rgba:F,width:V,height:U}=C;V<u||U<u||(i.push(A$(F,V,U,d)),a.push(w),l&&p.push(C))}if(a.length===0)return{proposals:[],kept:[],retried:0,embeddings:0,...l?{geometricMs:0}:{}};let h=3*s*s,m=new Float32Array(a.length*h);for(let w=0;w<i.length;w++)m.set(i[w],w*h);let b=await t.embedBatch(m,a.length),x=a.map((w,C)=>n.matchScored(b,C*r)),_=[];if(c.rotationRetry)for(let w=0;w<a.length;w++)jn(x[w],c)||_.push(w);let y=new Map(_.map((w,C)=>[w,C])),S=null;if(_.length>0){let w=new Float32Array(_.length*3*h);for(let C=0;C<_.length;C++){let F=i[_[C]];for(let V=1;V<=3;V++)w.set(P$(F,V,s),(C*3+V-1)*h)}S=await t.embedBatch(w,_.length*3)}let T=(w,C)=>{let F=y.get(w);if(F===void 0||S===null)throw new Error(`the turned looks of proposal ${w} were not embedded`);return(F*3+C-1)*r},I=a.map((w,C)=>UP(x[C],()=>[1,2,3].map(F=>n.matchScored(S,T(C,F))),c)),A=w=>I[w].orientation===0?{embs:b,off:w*r}:{embs:S,off:T(w,I[w].orientation)},k=new Map,O,z,G=!1;if(l)try{let w=performance.now(),C=[],F=[],V=[];for(let U=0;U<a.length;U++){if(!l.applies(null,jn(I[U].match,c)))continue;let{embs:q,off:M}=A(U),Z=n.scoreRow(q,M);C.push(U),F.push(Z),V.push({...p[U],ranked:n.rankCards(Z)})}if(V.length>0){let U=await l.verifyBatch(V,n.bankIds);C.forEach((q,M)=>{let Z=U[M],X=F[M],H=I[q].match,pe=y$(X,Z.candidates,Oe=>n.columnsOf(Oe)),fe=l.reorder?n.lookOf(pe):n.lookWithin(pe,n.lookOf(X).row),{row:ye,...Me}=fe;k.set(q,{match:Me,geometric:_$({topId:H.topId,similarity:H.similarity,margin:H.margin,accepted:jn(H,c)},Z)})})}O=performance.now()-w}catch(w){G=!0,z=w,k.clear(),O=void 0}let Y=w=>{let C=[];for(let F=0;F<a.length;F++){let V=I[F],U=w?k.get(F):void 0,{orientation:q,retried:M}=V,Z=U?U.match:V.match,X=Z.cardId!==null,H=null;if(X){let{embs:pe,off:fe}=A(F);H=pe.slice(fe,fe+r)}C.push({aabb:a[F].aabb,rect:a[F].rect,detectorScore:a[F].score,topId:Z.topId,identity:Z.identity,displayId:Z.displayId,score:Z.similarity,margin:Z.margin,orientation:q,retried:M,tauPassed:X,accepted:jn(Z,c),embedding:H,...U?{geometric:U.geometric}:{}})}return C},W=Y(!0),Q=l!==null&&!G?Y(!1):null;return{proposals:W,kept:L$(W,j$(W)),retried:_.length,embeddings:a.length+3*_.length,...O!==void 0?{geometricMs:O}:{},...Q?{base:{proposals:Q,kept:L$(Q,j$(Q))}}:{},...G?{geometricError:z}:{}}}var fd={tau:.62,delta:.05,rotationRetry:!0},Qo=-2,es=class{constructor(t,n=fd,o=new Fn){this.bank=t;this.rule=n;this.contract=er[t.preprocessing],this.rowShown=t.ids.map(l=>o.shown(l));let u=new Map;this.rowIdent=new Int32Array(t.ids.length);for(let l=0;l<t.ids.length;l++){let d=o.of(t.ids[l]),c=u.get(d);c===void 0&&(c=this.identRep.length,u.set(d,c),this.identRep.push(d)),this.rowIdent[l]=c}this.scratch=new Float64Array(t.ids.length)}bank;rule;rowIdent;identRep=[];rowShown;scratch;contract;get size(){return this.bank.ids.length}get dim(){return this.bank.dim}get tau(){return this.rule.tau}get preprocessing(){return this.contract}topAndOther(t,n){let{matrix:o,dim:u,ids:l}=this.bank,d=this.scratch,c=Qo,s=-1;for(let a=0;a<l.length;a++){let p=0,h=a*u;for(let m=0;m<u;m++)p+=o[h+m]*t[n+m];d[a]=p,p>c&&(c=p,s=a)}let r=Qo,i=s>=0?this.rowIdent[s]:-1;for(let a=0;a<l.length;a++)this.rowIdent[a]!==i&&d[a]>r&&(r=d[a]);return{bestRow:s,best:c,other:r}}matchScored(t,n){let{bestRow:o,best:u,other:l}=this.topAndOther(t,n),d=this.bank.ids[o];return{cardId:u>=this.rule.tau?d:null,similarity:u,topId:d,identity:this.identRep[this.rowIdent[o]],displayId:this.rowShown[o],margin:u-l}}scoreRow(t,n){let{matrix:o,dim:u,ids:l}=this.bank,d=new Float64Array(l.length);for(let c=0;c<l.length;c++){let s=0,r=c*u;for(let i=0;i<u;i++)s+=o[r+i]*t[n+i];d[c]=s}return d}rankCards(t){let n=Array.from({length:t.length},(l,d)=>d);n.sort((l,d)=>t[d]-t[l]);let o=new Set,u=[];for(let l of n){let d=this.bank.ids[l];o.has(d)||(o.add(d),u.push({cardId:d,cosine:t[l]}))}return u}columns=null;columnsOf(t){return this.columns===null&&(this.columns=new Map,this.bank.ids.forEach((n,o)=>{let u=this.columns.get(n);u?u.push(o):this.columns.set(n,[o])})),this.columns.get(t)??[]}bankIdSet=null;get bankIds(){return this.columnsOf(""),this.bankIdSet??=new Set(this.columns.keys()),this.bankIdSet}scored(t,n,o){let u=this.bank.ids[t];return{cardId:n>=this.rule.tau?u:null,similarity:n,topId:u,identity:this.identRep[this.rowIdent[t]],displayId:this.rowShown[t],margin:n-o,row:t}}lookOf(t){let n=0;for(let d=1;d<t.length;d++)t[d]>t[n]&&(n=d);let o=this.rowIdent[n],u=Qo,l=!1;for(let d=0;d<t.length;d++)this.rowIdent[d]!==o&&((!l||t[d]>u)&&(u=t[d]),l=!0);return this.scored(n,t[n],u)}lookWithin(t,n){let o=this.rowIdent[n],u=-1,l=Qo,d=!1;for(let c=0;c<t.length;c++)this.rowIdent[c]===o?(u<0||t[c]>t[u])&&(u=c):((!d||t[c]>l)&&(l=t[c]),d=!0);return this.scored(u,t[u],l)}matchPooled(t,n=this.rule.delta){let{bestRow:o,best:u,other:l}=this.topAndOther(t,0),d=u-l;return{cardId:u>=this.rule.tau&&d>=n?this.rowShown[o]:null,similarity:u,margin:d}}};var ts=class{constructor(t=3){this.k=t;if(!Number.isInteger(t)||t<1)throw new RangeError(`k must be a positive integer, got ${t}`)}k;run=0;misses=0;showing=!1;reset(){this.run=0,this.misses=0,this.showing=!1}observe(t){return t?(this.run+=1,this.misses=0,this.run>=this.k&&(this.showing=!0)):(this.run=0,this.misses+=1,this.misses>=this.k&&(this.showing=!1)),{confirmed:this.showing,consecutive:this.run}}};var GP=.4,qP=2,HP=5,WP=2,KP="track_";function XP(e){let t=e[0].length,n=new Float32Array(t);for(let l of e)for(let d=0;d<t;d++)n[d]=n[d]+l[d];let o=0;for(let l=0;l<t;l++)o+=n[l]*n[l];let u=Math.sqrt(o);if(!(u>0))return null;for(let l=0;l<t;l++)n[l]=n[l]/u;return n}var rs=class{constructor(t){this.identityResolver=t}identityResolver;tracks=[];nextId=1;reset(){this.tracks=[]}identityOf(t){if(t.embeddings.length===0)return null;let n=XP(t.embeddings);return n?this.identityResolver(n):null}update(t){let n=new Set(t.map((o,u)=>u));for(let o of this.tracks){let u=-1,l=GP;for(let d of n){let c=Pi(o.detection.aabb,t[d].aabb);c>l&&(l=c,u=d)}if(u>=0){let d=t[u];o.detection=d,o.misses=0,o.age+=1,o.embeddings.push(d.embedding),o.embeddings.length>HP&&o.embeddings.shift(),n.delete(u)}else o.misses+=1}this.tracks=this.tracks.filter(o=>o.misses<=qP);for(let o of n){let u=t[o];this.tracks.push({instanceId:`${KP}${String(this.nextId++).padStart(4,"0")}`,detection:u,embeddings:[u.embedding],misses:0,age:1})}return this.tracks.filter(o=>o.misses===0).map(o=>({instanceId:o.instanceId,detection:o.detection,identity:o.age>=WP?this.identityOf(o):null}))}};var JP=.25,YP=5;function QP(e,t){if(e===null||t===void 0)return!1;let n=t-e;return n<-JP||n>YP}function ek(e){return[e.x,e.y,e.width,e.height]}var ns=class{hoverSelection;detector;embedder;recognizer;names;classNames;faceClass;minCropPx;now;tracker;gate=new ts(3);hoverIds=new Yo;heldCards=[];lastVideoTimeSec=null;geometric;geometricFailure=null;constructor(t){this.detector=t.detector,this.embedder=t.embedder,this.names=t.names,this.classNames=t.classNames??["face","back"],this.faceClass=t.faceClass??$r,this.minCropPx=t.minCropPx??Dn,this.hoverSelection=t.hoverSelection??cd,this.now=t.now??(()=>performance.now()),this.geometric=t.geometric??null;let n=new Fn(t.identityGroups??null,o=>this.names.has(o),t.identityDisplay??"best-printing");this.recognizer=new es(t.bank,t.accept??fd,n),this.tracker=new rs(o=>this.recognizer.matchPooled(o).cardId)}get size(){return this.recognizer.size}takeGeometricFailure(){let t=this.geometricFailure;return this.geometricFailure=null,t}get geometricStage(){return this.geometric}setGeometric(t){this.geometric=t,this.geometricFailure=null}reset(){this.tracker.reset(),this.gate.reset(),this.heldCards=[],this.hoverIds.reset(),this.lastVideoTimeSec=null}async analyze(t,n){let o=this.now(),u=QP(this.lastVideoTimeSec,n);u&&this.reset(),n!==void 0&&(this.lastVideoTimeSec=n);let l=await this.detector.propose(t),d=this.now()-o,c=l.filter(A=>nd(A.aabb,t.width,t.height,this.minCropPx)).map(A=>H2(A,t)),{faces:s}=W2(c,this.faceClass),r=this.now(),i=await V$(t,this.embedder,this.recognizer,s,this.minCropPx,this.geometric),a=this.now()-r;if(i.geometricError!==void 0&&this.geometric&&(this.geometricFailure={stage:this.geometric,error:i.geometricError},this.geometric=null),i.proposals.length!==s.length)throw new Error("pipeline: a valid face box was not recognized");let p={frameWidth:t.width,frameHeight:t.height,names:this.names},h=R$(i,this.hoverSelection),m=s.map(A=>c.indexOf(A)),b=N$(h,this.hoverIds.assign(h),p,A=>m[A]),x=i.base??i,_=x.kept.map(A=>{let k=x.proposals[A];return{aabb:k.aabb,rect:k.rect,cardId:k.topId,embedding:k.embedding}}),y=this.tracker.update(_),S=_.length>0,T=this.gate.observe(S),I;return T.confirmed?S?(I=Jo(y.map(A=>({instanceId:A.instanceId,aabb:A.detection.aabb,rect:A.detection.rect,identity:A.identity})),p),this.heldCards=I):I=this.heldCards:(this.heldCards=[],I=[]),{frame:{width:t.width,height:t.height},boxes:this.boxResults(c,s,i),hover:{selection:this.hoverSelection,cards:b},tracks:{shown:T.confirmed,cards:I},discontinuity:u,retried:i.retried,embeddings:i.embeddings,timings:{detectorMs:d,recognizeMs:a,analyzeMs:this.now()-o,...i.geometricMs!==void 0?{geometricMs:i.geometricMs}:{}}}}boxResults(t,n,o){let u=new Map(n.map((d,c)=>[d,c])),l=new Set(o.kept);return t.map(d=>{let c=u.get(d),s=null;if(c!==void 0){let r=o.proposals[c],i=r.accepted&&this.names.has(r.displayId)?r.displayId:null;s={topId:r.topId,topName:this.names.get(r.topId)??null,similarity:r.score,margin:r.margin,look:r.orientation,retried:r.retried,tauPassed:r.tauPassed,accepted:r.accepted,cardId:i,name:i===null?null:this.names.get(i)??null,kept:l.has(c),...r.geometric?{geometric:r.geometric}:{}}}return{box:ek(d.aabb),score:d.score,cls:d.cls,className:this.classNames[d.cls]??String(d.cls),face:s}})}};var U$=1,G$="vision-release",tk=[8,16,32];function q$(e,t){return tk.reduce((n,o)=>n+Math.floor(e/o)*Math.floor(t/o),0)}var rk=/^[0-9a-f]{16}$/,nk=/^[0-9a-f]{64}$/,ik=/^\d+\.\d+\.\d+$/,ok=["schemaVersion","kind","id","game","locale","detector","recognizer","bank","identity","catalog","accept","hover","runtime"],H$=["tau","delta","rotationRetry"],je=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),lt=e=>typeof e=="number"&&Number.isInteger(e)&&e>0,zi=e=>typeof e=="number"&&Number.isFinite(e),Ze=e=>typeof e=="string"&&e.trim()!=="";function sk(e){return!Ze(e)||e.includes("\\")||e.includes("://")||e.startsWith("/")||/^[A-Za-z]:/.test(e)?!1:!e.split("/").includes("..")}function Ri(e){return!je(e)||!sk(e.path)||typeof e.sha256!="string"||!nk.test(e.sha256)||!lt(e.bytes)?null:{path:e.path,sha256:e.sha256,bytes:e.bytes}}function ak(e){let t=e.input,n=e.decode;if(!je(t)||!lt(t.width)||!lt(t.height))return"detector.input must give a width and a height";if(!je(n))return"detector.decode must be an object";if(!Ze(n.inputName)||!Ze(n.outputName))return"detector.decode must name the model's input and output";let o=[["layout","NCHW"],["channels","BGR"],["scale","0-255"],["score","obj * max(cls)"],["class","argmax(cls)"]];for(let[i,a]of o)if(n[i]!==a)return`detector.decode.${i} is not ${JSON.stringify(a)}, the contract this runtime implements`;let u=n.letterbox;if(!je(u)||u.width!==t.width||u.height!==t.height)return"detector.decode.letterbox differs from detector.input";if(typeof u.pad!="number"||!Number.isInteger(u.pad)||u.pad<0||u.pad>255)return"detector.decode.letterbox.pad must be a whole number from 0 to 255";let l=[["anchor","top-left"],["resize","pillow-bilinear"],["ratio","min(height / frameHeight, width / frameWidth)"],["size","round(frame * ratio)"]];for(let[i,a]of l)if(u[i]!==a)return`detector.decode.letterbox.${i} is not ${JSON.stringify(a)}`;let d=n.classes;if(!Array.isArray(d)||d.length===0||!d.every(Ze)||new Set(d).size!==d.length)return"detector.decode.classes must be a list of distinct class names";if(e.faceClass!==$r||d[$r]!=="face")return`detector.faceClass must be ${$r} and that class must be named "face"`;let c=n.output,s=["cx","cy","w","h","obj",...d.map(i=>`cls_${i}`)];if(!je(c)||!Array.isArray(c.columns)||c.columns.length!==s.length||!c.columns.every((i,a)=>i===s[a]))return"detector.decode.output.columns must be cx, cy, w, h, obj and one cls_<name> per class";if(c.anchors!==q$(t.width,t.height))return`detector.decode.output.anchors must be ${q$(t.width,t.height)} for a ${t.width} x ${t.height} input`;if(!zi(n.threshold)||!(n.threshold>0&&n.threshold<1))return"detector.decode.threshold must be a number between 0 and 1";if(n.threshold<.01)return`detector.decode.threshold ${n.threshold} is below 0.01, the lowest score at which the detector export checks box parity`;let r=n.nms;return!je(r)||!zi(r.iou)||!(r.iou>0&&r.iou<=1)||r.classAgnostic!==!0||r.greedy!==!0?"detector.decode.nms must give an iou above 0 and at most 1, with classAgnostic and greedy both true":lt(n.maxProposals)?lt(e.minCropPx)?{inputName:n.inputName,outputName:n.outputName,letterbox:{width:t.width,height:t.height,pad:u.pad},anchors:c.anchors,classes:d,decode:{threshold:n.threshold,nmsIou:r.iou,maxProposals:n.maxProposals},faceClass:$r,minCropPx:e.minCropPx}:"detector.minCropPx must be a whole number above 0":"detector.decode.maxProposals must be a whole number above 0"}function uk(e){let t=I=>({error:I});if(!je(e)||e.schemaVersion!==U$||e.kind!==G$)return t(`not a "${G$}" document of schema version ${U$}`);let n=Object.keys(e).filter(I=>!ok.includes(I));if(n.length>0)return t(`unknown key(s) ${n.sort().join(", ")}`);if(typeof e.id!="string"||!rk.test(e.id))return t("id must be 16 lowercase hex digits");if(!Ze(e.game)||!Ze(e.locale))return t("game and locale must be non-empty strings");let o=e.detector;if(!je(o))return t("incomplete release: detector missing (a release is all-or-nothing)");let u=Ri(o);if(!u||!Ze(o.version)||!Ze(o.weights))return t("detector must pin a file and carry a version and a weights label");if(o.arm!=="yolox")return t(`detector.arm ${JSON.stringify(o.arm)} is not one this runtime implements`);let l=ak(o);if(typeof l=="string")return t(l);let d=e.recognizer;if(!je(d))return t("incomplete release: recognizer missing (a release is all-or-nothing)");let c=Ri(d);if(!c||!Ze(d.version)||!Ze(d.weights)||!lt(d.dim))return t("recognizer must pin a file and carry a version, a weights label and a dim");if(!Ze(d.inputName)||!Ze(d.outputName))return t("recognizer must name the model's input and output");let s=Zo(d.preprocessing);if(s===null)return t(`recognizer.preprocessing is not a contract this runtime implements (known: ${Object.keys(er).join(", ")})`);let r=e.bank;if(!je(r))return t("incomplete release: bank missing (a release is all-or-nothing)");let i=Ri(r);if(!i||!lt(r.version)||!lt(r.cardCount)||!lt(r.entryCount))return t("bank must pin a file and carry a version, a cardCount and an entryCount");if(r.aggregation!=="mean")return t('bank.aggregation must be "mean"');let a=e.identity;if(!je(a)||!pd(a.level))return t('identity.level must be "name" or "printing"');let p=a.groups,h=Ri(p);if(!h||!je(p)||!lt(p.version))return t("incomplete release: identity.groups must pin a file and carry a version");if(a.display!=="best-printing"&&a.display!=="representative")return t(`identity.display ${JSON.stringify(a.display)} is not one of best-printing, representative`);let m=e.catalog,b=Ri(m);if(!b||!je(m)||!lt(m.cardCount))return t("incomplete release: catalog must pin a file and carry a cardCount");let x=e.accept;if(!je(x))return t("incomplete release: accept missing (a release is all-or-nothing)");if(Object.keys(x).some(I=>!H$.includes(I)))return t(`accept has unknown key(s) (expected ${H$.join(", ")})`);if(!zi(x.tau)||!(x.tau>0&&x.tau<=1))return t("accept.tau must be a number above 0 and at most 1");if(!zi(x.delta)||!(x.delta>=0&&x.delta<1))return t("accept.delta must be a number from 0 to below 1");if(typeof x.rotationRetry!="boolean")return t("accept.rotationRetry must be true or false");let _=e.hover;if(!je(_)||!D$(_.selection))return t("hover.selection is not one of accepted-nms, best-score, detector-score");if(!lt(_.maxAgeMs))return t("hover.maxAgeMs must be a whole number above 0");let y=e.runtime;if(!je(y)||typeof y.ortWeb!="string"||!ik.test(y.ortWeb))return t("runtime.ortWeb must be an exact version of the form 1.2.3");if(y.wasmThreads!==1)return t("runtime.wasmThreads must be 1");let S=y.executionProviders;if(!Array.isArray(S)||S.length===0||new Set(S).size!==S.length||!S.every(I=>hd.includes(I)))return t(`runtime.executionProviders must list one or more of ${hd.join(", ")}, each once`);let T=y.analysisWidth;return!je(T)||!lt(T.min)||!lt(T.max)||T.min>T.max?t("runtime.analysisWidth must give whole numbers min <= max above 0"):{release:{id:e.id,game:e.game,locale:e.locale,detector:{...u,arm:"yolox",version:o.version,weights:o.weights,settings:l},recognizer:{...c,version:d.version,weights:d.weights,dim:d.dim,inputName:d.inputName,outputName:d.outputName,preprocessing:s},bank:{...i,version:r.version,cardCount:r.cardCount,entryCount:r.entryCount},identity:{level:a.level,groups:{...h,version:p.version},display:a.display},catalog:{...b,cardCount:m.cardCount},accept:{tau:x.tau,delta:x.delta,rotationRetry:x.rotationRetry},hover:{selection:_.selection,maxAgeMs:_.maxAgeMs},runtime:{ortWeb:y.ortWeb,executionProviders:S,wasmThreads:1,analysisWidth:{min:T.min,max:T.max}}}}}function lk(e){let t=0,n=()=>{throw new Error("not JSON")},o=()=>{for(;t<e.length&&` 	
\r`.includes(e[t]);)t++},u=()=>{let c=t;for(e[t]!=='"'&&n(),t++;t<e.length&&e[t]!=='"';)t+=e[t]==="\\"?2:1;return t>=e.length&&n(),t++,JSON.parse(e.slice(c,t))},l=c=>{o();let s=e[t];if(s==="{"){t++;let i=[];if(o(),e[t]==="}")t++;else for(;;){o();let a=u();o(),e[t]!==":"&&n(),t++;let p=l(!1);if(c&&a==="id"||i.push([a,p]),o(),e[t]===",")t++;else if(e[t]==="}"){t++;break}else n()}return i.sort((a,p)=>a[0]<p[0]?-1:a[0]>p[0]?1:0),`{${i.map(([a,p])=>`${JSON.stringify(a)}:${p}`).join(",")}}`}if(s==="["){t++;let i=[];if(o(),e[t]==="]")t++;else for(;;)if(i.push(l(!1)),o(),e[t]===",")t++;else if(e[t]==="]"){t++;break}else n();return`[${i.join(",")}]`}if(s==='"')return JSON.stringify(u());let r=/^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(e.slice(t,t+64));return r?(t+=r[0].length,r[0]):n()};o(),e[t]!=="{"&&n();let d=l(!0);return o(),t!==e.length&&n(),d}async function dk(e,t){let n=new TextEncoder().encode(lk(e));return(await t(n.buffer)).slice(0,16)}async function ck(e){let t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t),n=>n.toString(16).padStart(2,"0")).join("")}var md={fetchFn:e=>fetch(e),digestSha256Hex:ck};function pk(e,t){let n=l=>/^(\d+)\.(\d+)\.\d+/.exec(l),o=n(e),u=n(t);return o!==null&&u!==null&&o[1]===u[1]&&o[2]===u[2]}var qe=class extends Error{};async function K$(e,t,n){let o;try{o=await e.fetchFn(t)}catch(u){throw new qe(`${n}: fetch failed (${String(u)})`)}if(!o.ok)throw new qe(`${n}: HTTP ${o.status}`);return o.arrayBuffer()}async function Ni(e,t,n,o){let u=await K$(e,new URL(n.path,t).href,o);if(u.byteLength!==n.bytes)throw new qe(`${o}: ${n.path} is ${u.byteLength} bytes, the release says ${n.bytes}`);if(await e.digestSha256Hex(u)!==n.sha256)throw new qe(`${o}: sha256 of ${n.path} does not match the release`);return u}function is(e,t){try{return JSON.parse(new TextDecoder("utf-8",{fatal:!0}).decode(e))}catch{throw new qe(`${t}: the file is not JSON`)}}var hk=/^[a-z][a-zA-Z0-9]*$/,fk=["key","label","values","type"],W$=e=>typeof e=="string"?"text":"number",Sr=e=>JSON.stringify(e)??String(e);function X$(e,t,n){for(let o=0;o<e.length;o++){let u=e[o];if(!(Ze(u)||zi(u)))return`${n}: ${Sr(u)} is not a facet value (a non-empty string or a number)`;if(t=t??W$(u),W$(u)!==t)return`${n}: ${Sr(u)} is not ${t==="text"?"text":"a number"}, and the facet's values are ${t==="text"?"text":"numbers"}`;if(e.slice(0,o).includes(u))return`${n}: ${Sr(u)} is listed twice`}return t}function mk(e){if(!Array.isArray(e))return'"facets" must be a list of objects, each with a "key" and a "label"';let t=[];for(let[n,o]of e.entries()){let u=`facets[${n}]`;if(!je(o)||!("key"in o)||!("label"in o))return`${u} must be an object with a "key" and a "label"`;let l=Object.keys(o).filter(r=>!fk.includes(r));if(l.length>0)return`${u}: unknown key(s) ${l.join(", ")}`;if(typeof o.key!="string"||!hk.test(o.key))return`${u}: "key" ${Sr(o.key)} must be a lowercase letter, then letters and digits only`;let d=o.key;if(d==="kind")return`${u}: "key" "kind" is reserved: the card's kind is always the first filter`;if(t.some(r=>r.key===d))return`${u}: duplicate key ${Sr(d)}`;if(!Ze(o.label))return`${u} (${d}): "label" must be a non-empty string`;let c=null;if("type"in o){if(o.type!=="text"&&o.type!=="number")return`${u} (${d}): "type" must be "text" or "number", not ${Sr(o.type)}`;c=o.type}let s=null;if("values"in o){if(!Array.isArray(o.values)||o.values.length===0)return`${u} (${d}): "values" must be a non-empty list`;let r=X$(o.values,c,`${u} (${d}) values`);if(r!=="text"&&r!=="number")return r;c=r,s=o.values}t.push({key:d,label:o.label,type:c,values:s})}return t}function gk(e,t,n,o){let u=`card ${n}`;if(!je(e))return`${u}: "facets" must be an object of facet key to a value or a list of values`;for(let[l,d]of Object.entries(e)){let c=t.find(i=>i.key===l);if(c===void 0)return`${u}: facets.${l}: the catalog declares no facet ${Sr(l)}`;let s=Array.isArray(d)?d:[d];if(s.length===0)return`${u}: facets.${l} is an empty list (leave the key out instead)`;let r=X$(s,c.type,`${u}: facets.${l}`);if(r!=="text"&&r!=="number")return r;c.type=r;for(let i of s){if(c.values!==null&&!c.values.includes(i))return`${u}: facets.${l}: ${Sr(i)} is not one of the declared values`;let a=o.get(l)??[];a.includes(i)||a.push(i),o.set(l,a)}}return null}function bk(e){if(!je(e)||!Ze(e.game)||!Ze(e.locale)||!Array.isArray(e.cards)||e.cards.length===0)return"the file is not a catalog (game, locale and a list of cards)";let t=e.identity===void 0?"name":e.identity;if(!pd(t))return`"identity" must be "name" or "printing", not ${JSON.stringify(e.identity)}`;let n=e.facets===void 0?[]:mk(e.facets);if(typeof n=="string")return n;let o=new Map,u=new Map,l=[];for(let c of e.cards){if(!je(c)||!Ze(c.id)||!Ze(c.name))return"every card needs an id, a name and an art path";if(!("art"in c)||c.art!==null&&!Ze(c.art))return`card ${c.id}: "art" must be an art path (a file path or an http(s) URL), or null for a card without art`;if(u.has(c.id))return`card id ${c.id} appears twice`;let s=c.printingOf??null;if(s!==null&&!Ze(s))return`card ${c.id}: "printingOf" must be a card id or null`;let r=c.facets===void 0?null:gk(c.facets,n,c.id,o);if(r!==null)return r;let i={id:c.id,name:c.name,art:c.art,printingOf:s};u.set(i.id,i),l.push(i)}if(t==="printing")for(let c of l){if(c.printingOf===null)continue;let s=u.get(c.printingOf);if(s===void 0||s===c)return`card ${c.id}: "printingOf" names ${c.printingOf}, which is not another card`;if(s.printingOf!==null)return`card ${c.id}: "printingOf" names ${c.printingOf}, which is itself a printing of ${s.printingOf}`}let d=n.map(c=>{let s=c.values??[...o.get(c.key)??[]];return c.values===null&&c.type==="number"&&s.sort((r,i)=>r-i),{key:c.key,label:c.label,type:c.type??"text",values:[...s]}});return{game:e.game,locale:e.locale,identity:t,cards:l,facets:d}}async function Z$(e,t=md,n={}){try{let o=await K$(t,e,"release"),u=uk(is(o,"release"));if("error"in u)throw new qe(`release: ${u.error}`);let l=u.release,d=await dk(new TextDecoder().decode(o),t.digestSha256Hex);if(d!==l.id)throw new qe(`release: id ${l.id} is not the hash of the document (which is ${d})`);if(n.ortWeb!==void 0&&!pk(l.runtime.ortWeb,n.ortWeb))throw new qe(`release: measured on onnxruntime-web ${l.runtime.ortWeb}, this build runs ${n.ortWeb} (major and minor version must match)`);let[c,s,r,i,a]=await Promise.all([Ni(t,e,l.detector,"detector"),Ni(t,e,l.recognizer,"recognizer"),Ni(t,e,l.bank,"bank"),Ni(t,e,l.identity.groups,"identity.groups"),Ni(t,e,l.catalog,"catalog")]),p=k$(is(r,"bank"));if(!p)throw new qe("bank: the file is not a bank this runtime can read");let h=[[p.version===l.bank.version,"bank.version differs from the bank file's"],[p.model===l.recognizer.version,`bank: the file's model ${JSON.stringify(p.model)} is not recognizer.version ${JSON.stringify(l.recognizer.version)}`],[p.dim===l.recognizer.dim,"bank: the vector size differs from recognizer.dim"],[p.preprocessing===l.recognizer.preprocessing,"bank: the file's preprocessing differs from recognizer.preprocessing"],[p.ids.length===l.bank.entryCount,"bank.entryCount is not the number of entries in the bank file"],[new Set(p.ids).size===l.bank.cardCount,"bank.cardCount is not the number of distinct card ids in the bank file"],[p.tau===null||p.tau===l.accept.tau,`bank: the file records tau ${p.tau}, accept.tau is ${l.accept.tau}`]];for(let[O,z]of h)if(!O)throw new qe(z);let m=bk(is(a,"catalog"));if(typeof m=="string")throw new qe(`catalog: ${m}`);if(m.game!==l.game||m.locale!==l.locale)throw new qe("catalog: the file is for another game or locale");if(m.cards.length!==l.catalog.cardCount)throw new qe(`catalog.cardCount ${l.catalog.cardCount} is not the file's ${m.cards.length} cards`);let b=new Map(m.cards.map(O=>[O.id,O.name])),x=p.ids.filter(O=>!b.has(O));if(x.length>0)throw new qe(`${new Set(x).size} bank id(s) are not in the catalog (e.g. ${x[0]})`);let _=is(i,"identity.groups"),y=B$(_);if(!y)throw new qe("identity.groups: the file is not an identity-groups document");if(y.version!==l.identity.groups.version)throw new qe("identity.groups.version differs from the file's");if((je(_)&&je(_.bank)?_.bank.sha256:void 0)!==l.bank.sha256)throw new qe("identity.groups: the file was not made for this release's bank (its bank sha256 differs)");let T=m.identity;if(l.identity.level!==T)throw new qe(`identity.level is "${l.identity.level}", and the catalog states the identity rule "${T}": a release is used with the rule its catalog states`);if((je(_)&&je(_.rule)?_.rule.level:void 0)!==T)throw new qe(`identity.groups: the file's groups are not by ${T}`);let A=new Map(m.cards.map(O=>[O.id,M$(O,T)])),k=O=>JSON.stringify(O.map(z=>[...z].sort()).sort((z,G)=>z[0]<G[0]?-1:z[0]>G[0]?1:0));if(k(y.groups)!==k(F$(p.ids,A)))throw new qe(`identity.groups: the groups are not the ones the catalog's ${T==="name"?"names give":"identity rule gives"} for the bank's ids`);return{ok:!0,data:{release:l,detectorBytes:new Uint8Array(c),recognizerBytes:new Uint8Array(s),bank:p,identityGroups:y,cards:m.cards,names:b}}}catch(o){return{ok:!1,reason:o instanceof qe?o.message:`unexpected: ${String(o)}`}}}async function yk(e){for(let t of e)try{await t?.release?.()}catch{}}async function J$(e,t,n=e.release.runtime.executionProviders){let{release:o}=e,u=null,l=null,d=async c=>(await yk([u,l]),{error:c});try{if(n.length===0)return await d("no execution provider to try");let c=o.recognizer;return u=await t.embedder(e.recognizerBytes,{inputName:c.inputName,outputName:c.outputName,inputSize:er[c.preprocessing].size,dim:c.dim},n),u?(l=await t.detector(e.detectorBytes,o.detector.settings,n),l?{pipeline:new ns({detector:l,embedder:u,bank:e.bank,accept:o.accept,identityGroups:e.identityGroups,identityDisplay:o.identity.display,names:e.names,hoverSelection:o.hover.selection,classNames:o.detector.settings.classes,faceClass:o.detector.settings.faceClass,minCropPx:o.detector.settings.minCropPx}),embedder:u,detector:l,providers:[...n]}:await d("detector: the model did not initialize on any execution provider, or is not the model the release describes")):await d("recognizer: the model did not initialize on any execution provider, or is not the model the release describes")}catch(c){return await d(`unexpected while building: ${String(c)}`)}}var Ln=class extends Error{constructor(n){super(`the release could not be loaded: ${n}`);this.reason=n;this.name="ReleaseError"}reason},_k={embedder:(e,t,n)=>Ho.create(e,t,n),detector:(e,t,n)=>qo.create(e,t,n)};async function Y$(e,t={}){let n=typeof location<"u"?location.href:void 0,o=new URL(e,n).href,u=await Z$(o,{...md,...t.deps},{ortWeb:L2()});if(!u.ok)throw new Ln(u.reason);let{data:l}=u;V2({wasmThreads:l.release.runtime.wasmThreads,...t.wasmPaths!==void 0?{wasmPaths:t.wasmPaths}:{}}),td();let d=await J$(l,_k,t.providers??l.release.runtime.executionProviders);if("error"in d){let c=td();throw new Ln(c.length>0?`${d.error} (${c.join("; ")})`:d.error)}return{release:l.release,pipeline:d.pipeline,backend:{detector:d.detector.ep,recognizer:d.embedder.ep},cards:l.cards,names:l.names,stageInputs:{bankSha256:l.release.bank.sha256,bankIds:[...new Set(l.bank.ids)],identities:I$(l.cards,l.release.identity.level,l.identityGroups)},dispose:async()=>{await d.embedder.release?.(),await d.detector.release?.()}}}async function Q$(e,t,n){let o=typeof location<"u"?location.href:void 0,u=new URL(t,o).href,l=n.fetchText??(async d=>{let c=await fetch(d);if(!c.ok)throw new Error(`${d}: HTTP ${c.status}`);return c.text()});return O$(u,{...n,fetchText:l,...e.stageInputs})}var eT=e=>e instanceof Error?e.message:String(e);function tT(e){let t=e.now??(()=>performance.now()),n=e.watchdog??new Xo,o=null,u=!1,l=!1,d=null,c=!1;function s(_,y=null,S=null,T=null){e.post({kind:"geometric-status",state:_,reason:y,bytes:S,...T!==null?{note:T}:{}})}function r(){if(!(l||!o)){if(c){let _=o.pipeline.geometricStage;_&&(o.pipeline.setGeometric(null),_.dispose()),d?.dispose(),d=null;return}d!==null&&(o.pipeline.setGeometric(d),d=null)}}function i(_){c||(c=!0,r(),s("off",_))}async function a(_,y,S){s("loading");let T=null,I=!1;try{if(T=await e.voteDevice(),T===null){c=!0,s("off","no-webgpu");return}T.lost.then(z=>{z.reason!=="destroyed"&&i(`device-lost: ${z.message||z.reason}`)});let{stage:A,bytes:k,note:O}=await e.openStage(_,y,T,S);if(I=!0,c){A.dispose();return}d=A,r(),s("ready",null,k,O)}catch(A){T!==null&&!I&&e.releaseDevice(T),c||(c=!0,s("off",`load-failed: ${eT(A)}`))}}function p(_){if(!o)return;let y=o.pipeline.takeGeometricFailure();if(y){y.stage.dispose(),i(`runtime: ${eT(y.error)}`);return}let S=_.timings.geometricMs;S!==void 0&&n.observe(S)&&i(`watchdog: the stage took over ${n.limitMs} ms of a frame on ${n.frames} frames in a row`)}function h(_){return{kind:"release-status",ok:!1,error:_,release:null,cards:[]}}function m(_){if(u)return Promise.resolve();u=!0;let y=_.wasmPaths??e.wasmPaths;return e.loadRelease(_.releaseUrl,{wasmPaths:y,..._.providers?{providers:_.providers}:{}}).then(async S=>{o=S;let T=S.release;e.post({kind:"release-status",ok:!0,error:null,release:{id:T.id,game:T.game,locale:T.locale,detector:{version:T.detector.version,ep:S.backend.detector},recognizer:{version:T.recognizer.version,ep:S.backend.recognizer},bankCards:T.bank.cardCount,catalogCards:T.catalog.cardCount,identityLevel:T.identity.level,decode:{...T.detector.settings.decode,minCropPx:T.detector.settings.minCropPx},accept:{...T.accept},hoverSelection:T.hover.selection,hoverMaxAgeMs:T.hover.maxAgeMs,analysisWidth:T.runtime.analysisWidth,ortWeb:T.runtime.ortWeb},cards:S.cards}),_.geometricUrl!==void 0&&await a(S,_.geometricUrl,_.geometricManifestSha256)}).catch(S=>{o||e.post(h(S instanceof Ln?S.reason:`unexpected error while loading (${String(S)})`))})}function b(_,y){let{envelope:S,error:T,videoTimeSec:I,width:A,height:k,t0:O}=y;return{kind:"frame-result",envelope:S,...T!==void 0?{error:T}:{},videoTimeSec:I,width:A,height:k,workerMs:+(t()-O).toFixed(2),analysis:_}}async function x(_){let{bitmap:y,videoTimeSec:S,envelope:T}=_,I=t(),{width:A,height:k}=y,O=z=>e.post(b(null,{envelope:T,error:z,videoTimeSec:S,width:A,height:k,t0:I}));if(l){y.close(),O("busy");return}l=!0;try{if(!o){O("no-release");return}let z=e.readBitmap(y);if(!z){O("no-2d-context");return}let G=await o.pipeline.analyze({data:z.data,width:z.width,height:z.height},S);p(G),e.post(b(G,{envelope:T,videoTimeSec:S,width:z.width,height:z.height,t0:I}))}catch(z){O(`analysis-failed: ${String(z)}`)}finally{y.close(),l=!1,r()}}return{async handle(_){_.kind==="ping"?e.post({kind:"pong"}):_.kind==="load"?await m(_):_.kind==="frame"&&await x(_)}}}var wk=new URL("./opencv.mjs",self.location.href).href,Bi=null,os=null;function vk(e){let{width:t,height:n}=e;return(!Bi||Bi.width!==t||Bi.height!==n)&&(Bi=new OffscreenCanvas(t,n),os=Bi.getContext("2d",{willReadFrequently:!0})),os?(os.drawImage(e,0,0),os.getImageData(0,0,t,n)):null}async function xk(){let e=navigator.gpu;if(!e)return null;let t=await e.requestAdapter();return t?t.requestDevice({requiredLimits:fp(t)}):null}var $k=tT({post:e=>self.postMessage(e),loadRelease:Y$,wasmPaths:new URL("./",self.location.href).href,voteDevice:xk,openStage:(e,t,n,o)=>Q$(e,t,{loadIndex:(u,l)=>dp(u,{...l,...o!==void 0?{manifestSha256:o}:{}}),loadCv:()=>cp(wk),makeVoter:async u=>{let l=await mp(n,u);return{knn2:d=>l.knn2(d),dispose:()=>{l.dispose(),n.destroy()}}}}),releaseDevice:e=>e.destroy(),readBitmap:vk});self.onmessage=e=>{$k.handle(e.data)};
/*! For license information please see worker.js.LEGAL.txt */
