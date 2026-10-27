var Or=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var WS=Object.create,Co=Object.defineProperty,KS=Object.getOwnPropertyDescriptor,XS=Object.getOwnPropertyNames,ZS=Object.getPrototypeOf,YS=Object.prototype.hasOwnProperty,au=(e=>typeof Or<"u"?Or:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof Or<"u"?Or:t)[n]}):e)(function(e){if(typeof Or<"u")return Or.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),D=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(o){throw n=[o],o}},ie=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}},on=(e,t)=>{for(var n in t)Co(e,n,{get:t[n],enumerable:!0})},wy=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let u of XS(t))!YS.call(e,u)&&u!==n&&Co(e,u,{get:()=>t[u],enumerable:!(o=KS(t,u))||o.enumerable});return e},ge=(e,t,n)=>(n=e!=null?WS(ZS(e)):{},wy(t||!e||!e.__esModule?Co(n,"default",{value:e,enumerable:!0}):n,e)),vn=e=>wy(Co({},"__esModule",{value:!0}),e),Ln,ar,Yr,gp,vy,xy=D(()=>{"use strict";Ln=new Map,ar=[],Yr=(e,t,n)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let o=Ln.get(e);if(o===void 0)Ln.set(e,{backend:t,priority:n});else{if(o.priority>n)return;if(o.priority===n&&o.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${n}`)}if(n>=0){let u=ar.indexOf(e);u!==-1&&ar.splice(u,1);for(let l=0;l<ar.length;l++)if(Ln.get(ar[l]).priority<=n){ar.splice(l,0,e);return}ar.push(e)}return}throw new TypeError("not a valid backend")},gp=async e=>{let t=Ln.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let n=!!t.initPromise;try{return n||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(o){return n||(t.error=`${o}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},vy=async e=>{let t=e.executionProviders||[],n=t.map(s=>typeof s=="string"?s:s.name),o=n.length===0?ar:n,u,l=[],d=new Set;for(let s of o){let r=await gp(s);typeof r=="string"?l.push({name:s,err:r}):(u||(u=r),u===r&&d.add(s))}if(!u)throw new Error(`no available backend found. ERR: ${l.map(s=>`[${s.name}] ${s.err}`).join(", ")}`);for(let{name:s,err:r}of l)n.includes(s)&&console.warn(`removing requested execution provider "${s}" from session options because it is not available: ${r}`);let c=t.filter(s=>d.has(typeof s=="string"?s:s.name));return[u,new Proxy(e,{get:(s,r)=>r==="executionProviders"?c:Reflect.get(s,r)})]}}),JS=D(()=>{"use strict";xy()}),$y,QS=D(()=>{"use strict";$y="1.29.0"}),Ps,tt,Ty=D(()=>{"use strict";QS(),Ps="warning",tt={wasm:{},webgl:{},webgpu:{},versions:{common:$y},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ps=e}},get logLevel(){return Ps}},Object.defineProperty(tt,"logLevel",{enumerable:!0})}),fe,eI=D(()=>{"use strict";Ty(),fe=tt}),Sy,Iy,tI=D(()=>{"use strict";Sy=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);n.width=e.dims[3],n.height=e.dims[2];let o=n.getContext("2d");if(o!=null){let u,l;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(u=e.dims[2],l=e.dims[3]):(u=e.dims[3],l=e.dims[2]);let d=t?.format!==void 0?t.format:"RGB",c=t?.norm,s,r;c===void 0||c.mean===void 0?s=[255,255,255,255]:typeof c.mean=="number"?s=[c.mean,c.mean,c.mean,c.mean]:(s=[c.mean[0],c.mean[1],c.mean[2],0],c.mean[3]!==void 0&&(s[3]=c.mean[3])),c===void 0||c.bias===void 0?r=[0,0,0,0]:typeof c.bias=="number"?r=[c.bias,c.bias,c.bias,c.bias]:(r=[c.bias[0],c.bias[1],c.bias[2],0],c.bias[3]!==void 0&&(r[3]=c.bias[3]));let i=l*u,a=0,p=i,h=i*2,m=-1;d==="RGBA"?(a=0,p=i,h=i*2,m=i*3):d==="RGB"?(a=0,p=i,h=i*2):d==="RBG"&&(a=0,h=i,p=i*2);for(let b=0;b<l;b++)for(let $=0;$<u;$++){let v=(e.data[a++]-r[0])*s[0],y=(e.data[p++]-r[1])*s[1],T=(e.data[h++]-r[2])*s[2],I=m===-1?255:(e.data[m++]-r[3])*s[3];o.fillStyle="rgba("+v+","+y+","+T+","+I+")",o.fillRect($,b,1,1)}if("toDataURL"in n)return n.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Iy=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),o;if(n!=null){let u,l,d;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(u=e.dims[2],l=e.dims[1],d=e.dims[3]):(u=e.dims[3],l=e.dims[2],d=e.dims[1]);let c=t!==void 0&&t.format!==void 0?t.format:"RGB",s=t?.norm,r,i;s===void 0||s.mean===void 0?r=[255,255,255,255]:typeof s.mean=="number"?r=[s.mean,s.mean,s.mean,s.mean]:(r=[s.mean[0],s.mean[1],s.mean[2],255],s.mean[3]!==void 0&&(r[3]=s.mean[3])),s===void 0||s.bias===void 0?i=[0,0,0,0]:typeof s.bias=="number"?i=[s.bias,s.bias,s.bias,s.bias]:(i=[s.bias[0],s.bias[1],s.bias[2],0],s.bias[3]!==void 0&&(i[3]=s.bias[3]));let a=l*u;if(t!==void 0&&(t.format!==void 0&&d===4&&t.format!=="RGBA"||d===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let p=4,h=0,m=1,b=2,$=3,v=0,y=a,T=a*2,I=-1;c==="RGBA"?(v=0,y=a,T=a*2,I=a*3):c==="RGB"?(v=0,y=a,T=a*2):c==="RBG"&&(v=0,T=a,y=a*2),o=n.createImageData(u,l);for(let S=0;S<l*u;h+=p,m+=p,b+=p,$+=p,S++)o.data[h]=(e.data[v++]-i[0])*r[0],o.data[m]=(e.data[y++]-i[1])*r[1],o.data[b]=(e.data[T++]-i[2])*r[2],o.data[$]=I===-1?255:(e.data[I++]-i[3])*r[3]}else throw new Error("Can not access image data");return o}}),Yi,Oy,Ey,Ay,Py,ky,rI=D(()=>{"use strict";hl(),Yi=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:n,width:o}=t,u=t.norm??{mean:255,bias:0},l,d;typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:l=[u.mean[0],u.mean[1],u.mean[2],u.mean[3]??255],typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:d=[u.bias[0],u.bias[1],u.bias[2],u.bias[3]??0];let c=t.format!==void 0?t.format:"RGBA",s=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",r=n*o,i=s==="RGBA"?new Float32Array(r*4):new Float32Array(r*3),a=4,p=0,h=1,m=2,b=3,$=0,v=r,y=r*2,T=-1;c==="RGB"&&(a=3,p=0,h=1,m=2,b=-1),s==="RGBA"?T=r*3:s==="RBG"?($=0,y=r,v=r*2):s==="BGR"&&(y=0,v=r,$=r*2);for(let I=0;I<r;I++,p+=a,m+=a,h+=a,b+=a)i[$++]=(e[p]+d[0])/l[0],i[v++]=(e[h]+d[1])/l[1],i[y++]=(e[m]+d[2])/l[2],T!==-1&&b!==-1&&(i[T++]=(e[b]+d[3])/l[3]);return s==="RGBA"?new mt("float32",i,[1,4,n,o]):new mt("float32",i,[1,3,n,o])},Oy=async(e,t)=>{let n=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,o=typeof ImageData<"u"&&e instanceof ImageData,u=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,l=typeof e=="string",d,c=t??{},s=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},r=i=>typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||i instanceof OffscreenCanvas?i.getContext("2d"):null;if(n){let i=s();i.width=e.width,i.height=e.height;let a=r(i);if(a!=null){let p=e.height,h=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(p=t.resizedHeight,h=t.resizedWidth),t!==void 0){if(c=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");c.tensorFormat="RGBA",c.height=p,c.width=h}else c.tensorFormat="RGBA",c.height=p,c.width=h;a.drawImage(e,0,0),d=a.getImageData(0,0,h,p).data}else throw new Error("Can not access image data")}else if(o){let i,a;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(i=t.resizedHeight,a=t.resizedWidth):(i=e.height,a=e.width),t!==void 0&&(c=t),c.format="RGBA",c.height=i,c.width=a,t!==void 0){let p=s();p.width=a,p.height=i;let h=r(p);if(h!=null)h.putImageData(e,0,0),d=h.getImageData(0,0,a,i).data;else throw new Error("Can not access image data")}else d=e.data}else if(u){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let i=s();i.width=e.width,i.height=e.height;let a=r(i);if(a!=null){let p=e.height,h=e.width;return a.drawImage(e,0,0,h,p),d=a.getImageData(0,0,h,p).data,c.height=p,c.width=h,Yi(d,c)}else throw new Error("Can not access image data")}else{if(l)return new Promise((i,a)=>{let p=s(),h=r(p);if(!e||!h)return a();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{p.width=m.width,p.height=m.height,h.drawImage(m,0,0,p.width,p.height);let b=h.getImageData(0,0,p.width,p.height);c.height=p.height,c.width=p.width,i(Yi(b.data,c))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(d!==void 0)return Yi(d,c);throw new Error("Input data provided is not supported - aborted tensor creation")},Ey=(e,t)=>{let{width:n,height:o,download:u,dispose:l}=t,d=[1,o,n,4];return new mt({location:"texture",type:"float32",texture:e,dims:d,download:u,dispose:l})},Ay=(e,t)=>{let{dataType:n,dims:o,download:u,dispose:l}=t;return new mt({location:"gpu-buffer",type:n??"float32",gpuBuffer:e,dims:o,download:u,dispose:l})},Py=(e,t)=>{let{dataType:n,dims:o,download:u,dispose:l}=t;return new mt({location:"ml-tensor",type:n??"float32",mlTensor:e,dims:o,download:u,dispose:l})},ky=(e,t,n)=>new mt({location:"cpu-pinned",type:e,data:t,dims:n??[t.length]})}),Hr,ni,ks,Cy,nI=D(()=>{"use strict";Hr=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),ni=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),ks=!1,Cy=()=>{if(!ks){ks=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,n=globalThis.Float16Array,o=typeof n<"u"&&n.from;e&&(Hr.set("int64",BigInt64Array),ni.set(BigInt64Array,"int64")),t&&(Hr.set("uint64",BigUint64Array),ni.set(BigUint64Array,"uint64")),o?(Hr.set("float16",n),ni.set(n,"float16")):Hr.set("float16",Uint16Array)}}}),Dy,Ry,iI=D(()=>{"use strict";hl(),Dy=e=>{let t=1;for(let n=0;n<e.length;n++){let o=e[n];if(typeof o!="number"||!Number.isSafeInteger(o))throw new TypeError(`dims[${n}] must be an integer, got: ${o}`);if(o<0)throw new RangeError(`dims[${n}] must be a non-negative integer, got: ${o}`);t*=o}return t},Ry=(e,t)=>{switch(e.location){case"cpu":return new mt(e.type,e.data,t);case"cpu-pinned":return new mt({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new mt({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new mt({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new mt({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),mt,hl=D(()=>{"use strict";tI(),rI(),nI(),iI(),mt=class{constructor(e,t,n){Cy();let o,u;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,o=e.type,u=e.dims,e.location){case"cpu-pinned":{let d=Hr.get(o);if(!d)throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);if(!(e.data instanceof d))throw new TypeError(`buffer should be of type ${d.name}`);this.cpuData=e.data;break}case"texture":{if(o!=="float32")throw new TypeError(`unsupported type "${o}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint64"&&o!=="int8"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let d,c;if(typeof e=="string")if(o=e,c=n,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");d=t}else{let s=Hr.get(e);if(s===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&s===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${s.name} as data.`);e==="uint64"||e==="int64"?d=s.from(t,BigInt):d=s.from(t)}else if(t instanceof s)d=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")d=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&s!==Uint16Array)d=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${o} tensor's data must be type of ${s}`)}else if(c=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let s=typeof e[0];if(s==="string")o="string",d=e;else if(s==="boolean")o="bool",d=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${s}.`)}else if(e instanceof Uint8ClampedArray)o="uint8",d=Uint8Array.from(e);else{let s=ni.get(e.constructor);if(s===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);o=s,d=e}if(c===void 0)c=[d.length];else if(!Array.isArray(c))throw new TypeError("A tensor's dims must be a number array");u=c,this.cpuData=d,this.dataLocation="cpu"}let l=Dy(u);if(this.cpuData&&l!==this.cpuData.length&&!((o==="uint4"||o==="int4")&&Math.ceil(l/2)===this.cpuData.length))throw new Error(`Tensor's size(${l}) does not match data length(${this.cpuData.length}).`);this.type=o,this.dims=u,this.size=l}static async fromImage(e,t){return Oy(e,t)}static fromTexture(e,t){return Ey(e,t)}static fromGpuBuffer(e,t){return Ay(e,t)}static fromMLTensor(e,t){return Py(e,t)}static fromPinnedBuffer(e,t,n){return ky(e,t,n)}toDataURL(e){return Sy(this,e)}toImageData(e){return Iy(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Ry(this,e)}}}),gt,Ny=D(()=>{"use strict";hl(),gt=mt}),wo,Cs,Vt,Nt,Jr,Qr,zy=D(()=>{"use strict";Ty(),wo=(e,t)=>{(typeof tt.trace>"u"?!tt.wasm.trace:!tt.trace)||console.timeStamp(`${e}::ORT::${t}`)},Cs=(e,t)=>{let n=new Error().stack?.split(/\r\n|\r|\n/g)||[],o=!1;for(let u=0;u<n.length;u++){if(o&&!n[u].includes("TRACE_FUNC")){let l=`FUNC_${e}::${n[u].trim().split(" ")[1]}`;t&&(l+=`::${t}`),wo("CPU",l);return}n[u].includes("TRACE_FUNC")&&(o=!0)}},Vt=e=>{(typeof tt.trace>"u"?!tt.wasm.trace:!tt.trace)||Cs("BEGIN",e)},Nt=e=>{(typeof tt.trace>"u"?!tt.wasm.trace:!tt.trace)||Cs("END",e)},Jr=e=>{(typeof tt.trace>"u"?!tt.wasm.trace:!tt.trace)||console.time(`ORT::${e}`)},Qr=e=>{(typeof tt.trace>"u"?!tt.wasm.trace:!tt.trace)||console.timeEnd(`ORT::${e}`)}}),My,oI=D(()=>{"use strict";xy(),Ny(),zy(),My=class By{constructor(t){this.handler=t}async run(t,n,o){Vt(),Jr("InferenceSession.run");let u={},l={};if(typeof t!="object"||t===null||t instanceof gt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let d=!0;if(typeof n=="object"){if(n===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(n instanceof gt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(n)){if(n.length===0)throw new TypeError("'fetches' cannot be an empty array.");d=!1;for(let r of n){if(typeof r!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(r)===-1)throw new RangeError(`'fetches' contains invalid output name: ${r}.`);u[r]=null}if(typeof o=="object"&&o!==null)l=o;else if(typeof o<"u")throw new TypeError("'options' must be an object.")}else{let r=!1,i=Object.getOwnPropertyNames(n);for(let a of this.outputNames)if(i.indexOf(a)!==-1){let p=n[a];(p===null||p instanceof gt)&&(r=!0,d=!1,u[a]=p)}if(r){if(typeof o=="object"&&o!==null)l=o;else if(typeof o<"u")throw new TypeError("'options' must be an object.")}else l=n}}else if(typeof n<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let r of this.inputNames)if(typeof t[r]>"u")throw new Error(`input '${r}' is missing in 'feeds'.`);if(d)for(let r of this.outputNames)u[r]=null;let c=await this.handler.run(t,u,l),s={};for(let r in c)if(Object.hasOwnProperty.call(c,r)){let i=c[r];i instanceof gt?s[r]=i:s[r]=new gt(i.type,i.data,i.dims)}return Qr("InferenceSession.run"),Nt(),s}async release(){return this.handler.dispose()}static async create(t,n,o,u){Vt(),Jr("InferenceSession.create");let l,d={};if(typeof t=="string"){if(l=t,typeof n=="object"&&n!==null)d=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(l=t,typeof n=="object"&&n!==null)d=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let i=t,a=0,p=t.byteLength;if(typeof n=="object"&&n!==null)d=n;else if(typeof n=="number"){if(a=n,!Number.isSafeInteger(a))throw new RangeError("'byteOffset' must be an integer.");if(a<0||a>=i.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${i.byteLength}).`);if(p=t.byteLength-a,typeof o=="number"){if(p=o,!Number.isSafeInteger(p))throw new RangeError("'byteLength' must be an integer.");if(p<=0||a+p>i.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${i.byteLength-a}].`);if(typeof u=="object"&&u!==null)d=u;else if(typeof u<"u")throw new TypeError("'options' must be an object.")}else if(typeof o<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof n<"u")throw new TypeError("'options' must be an object.");l=new Uint8Array(i,a,p)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[c,s]=await vy(d),r=await c.createInferenceSessionHandler(l,s);return Qr("InferenceSession.create"),Nt(),new By(r)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Do,sI=D(()=>{"use strict";oI(),Do=My}),aI=D(()=>{"use strict"}),uI=D(()=>{"use strict"}),lI=D(()=>{"use strict"}),dI=D(()=>{"use strict"}),cI={};on(cI,{InferenceSession:()=>Do,TRACE:()=>wo,TRACE_EVENT_BEGIN:()=>Jr,TRACE_EVENT_END:()=>Qr,TRACE_FUNC_BEGIN:()=>Vt,TRACE_FUNC_END:()=>Nt,Tensor:()=>gt,env:()=>fe,registerBackend:()=>Yr});var at=D(()=>{"use strict";JS(),eI(),sI(),Ny(),aI(),uI(),zy(),lI(),dI()});function Wr(e,t,n,o){if(t===void 0)return pI(e);if(n===void 0)Ji(e,t,1);else if(typeof n=="number"&&o===void 0)Ji(e,t,n);else if(typeof n=="string"&&o===void 0)Ji(e,n,1,t);else if(typeof n=="string"&&typeof o=="number")Ji(e,n,o,t);else throw new TypeError("input is valid")}function pI(e){return{verbose:Wr.verbose.bind(null,e),info:Wr.info.bind(null,e),warning:Wr.warning.bind(null,e),error:Wr.error.bind(null,e),fatal:Wr.fatal.bind(null,e)}}function Ji(e,t,n,o){let u=_n[o||""]||_n[""];uu[e]<uu[u.minimalSeverity]||(u.logDateTime&&(t=`${new Date().toISOString()}|${t}`),u.logSourceLocation,Fy[u.provider].log(e,t,o))}var bp,yp,uu,Fy,Ds,_n,Ke,Rs,Ns,Ly,jn,zt=D(()=>{"use strict";bp=class{log(e,t,n){}},yp=class{log(e,t,n){console.log(`${this.color(e)} ${n?"\x1B[35m"+n+"\x1B[0m ":""}${t}`)}color(e){switch(e){case"verbose":return"\x1B[34;40mv\x1B[0m";case"info":return"\x1B[32mi\x1B[0m";case"warning":return"\x1B[30;43mw\x1B[0m";case"error":return"\x1B[31;40me\x1B[0m";case"fatal":return"\x1B[101mf\x1B[0m";default:throw new Error(`unsupported severity: ${e}`)}}},uu={verbose:1e3,info:2e3,warning:4e3,error:5e3,fatal:6e3},Fy={none:new bp,console:new yp},Ds={provider:"console",minimalSeverity:"warning",logDateTime:!0,logSourceLocation:!1},_n={"":Ds},(e=>{function t(r,i){e("verbose",r,i)}e.verbose=t;function n(r,i){e("info",r,i)}e.info=n;function o(r,i){e("warning",r,i)}e.warning=o;function u(r,i){e("error",r,i)}e.error=u;function l(r,i){e("fatal",r,i)}e.fatal=l;function d(r){_n={},c("",r||{})}e.reset=d;function c(r,i){if(r==="*")d(i);else{let a=_n[r]||Ds;_n[r]={provider:i.provider||a.provider,minimalSeverity:i.minimalSeverity||a.minimalSeverity,logDateTime:i.logDateTime===void 0?a.logDateTime:i.logDateTime,logSourceLocation:i.logSourceLocation===void 0?a.logSourceLocation:i.logSourceLocation}}}e.set=c;function s(r){let i={};r.logLevel&&(i.minimalSeverity=r.logLevel),c("",i)}e.setWithEnv=s})(Wr||={}),Ke=Wr,Rs=class{constructor(e,t,n,o,u,l){this.category=e,this.name=t,this.startTime=n,this.endCallback=o,this.timer=u,this.ctx=l}async end(){return this.endCallback(this)}async checkTimer(){if(this.ctx===void 0||this.timer===void 0)throw new Error("No webgl timer found");return this.ctx.endTimer(),this.ctx.waitForQueryAndGetTime(this.timer)}},Ns=class{constructor(e,t,n,o){this.category=e,this.name=t,this.startTime=n,this.endTime=o}},Ly=class{constructor(e,t,n){this._started=!1,this._flushPointer=0,this._started=!1,this._maxNumberEvents=e===void 0?1e4:e,this._flushBatchSize=t===void 0?10:t,this._flushIntervalInMilliseconds=n===void 0?5e3:n}static create(e){return e===void 0?new this:new this(e.maxNumberEvents,e.flushBatchSize,e.flushIntervalInMilliseconds)}start(){this._started=!0,this._timingEvents=[],this._flushTime=jn(),this._flushPointer=0}stop(){for(this._started=!1;this._flushPointer<this._timingEvents.length;this._flushPointer++)this.logOneEvent(this._timingEvents[this._flushPointer])}event(e,t,n,o){let u=this._started?this.begin(e,t,o):void 0,l=!1,d=n();if(d&&typeof d.then=="function")return l=!0,new Promise((c,s)=>{d.then(async r=>{u&&await u.end(),c(r)},async r=>{u&&await u.end(),s(r)})});if(!l&&u){let c=u.end();if(c&&typeof c.then=="function")return new Promise((s,r)=>{c.then(()=>{s(d)},i=>{r(i)})})}return d}begin(e,t,n){if(!this._started)throw new Error("profiler is not started yet");if(n===void 0){let o=jn();return this.flush(o),new Rs(e,t,o,u=>this.endSync(u))}else{let o=n.beginTimer();return new Rs(e,t,0,async u=>this.end(u),o,n)}}async end(e){let t=await e.checkTimer();this._timingEvents.length<this._maxNumberEvents&&(this._timingEvents.push(new Ns(e.category,e.name,e.startTime,t)),this.flush(t))}endSync(e){let t=jn();this._timingEvents.length<this._maxNumberEvents&&(this._timingEvents.push(new Ns(e.category,e.name,e.startTime,t)),this.flush(t))}logOneEvent(e){Ke.verbose(`Profiler.${e.category}`,`${(e.endTime-e.startTime).toFixed(2)}ms on event '${e.name}' at ${e.endTime.toFixed(2)}`)}flush(e){if(this._timingEvents.length-this._flushPointer>=this._flushBatchSize||e-this._flushTime>=this._flushIntervalInMilliseconds){for(let t=this._flushPointer;this._flushPointer<t+this._flushBatchSize&&this._flushPointer<this._timingEvents.length;this._flushPointer++)this.logOneEvent(this._timingEvents[this._flushPointer]);this._flushTime=jn()}}get started(){return this._started}},jn=typeof performance<"u"&&performance.now?()=>performance.now():Date.now});function hI(e,t,n){for(let o of n){let u=o[0],l=o[1],d=o[2],c=o[3],s=o[4];if(e.opType===u){for(let r of t)if((r.domain===l||r.domain==="ai.onnx"&&l==="")&&fI(r.version,d))return{opImpl:c,opInit:s}}}throw new TypeError(`cannot resolve operator '${e.opType}' with opsets: ${t.map(o=>`${o.domain||"ai.onnx"} v${o.version}`).join(", ")}`)}function fI(e,t){if(t.endsWith("+")){let n=Number.parseInt(t.substring(0,t.length-1),10);return!isNaN(n)&&n<=e}else if(t.split("-").length===2){let n=t.split("-"),o=Number.parseInt(n[0],10),u=Number.parseInt(n[1],10);return!isNaN(o)&&!isNaN(u)&&o<=e&&e<=u}else return Number.parseInt(t,10)===e}var mI=D(()=>{"use strict"}),gI=ie(e=>{"use strict";e.__esModule=!0;var t=(function(){function n(o){if(!o)throw new TypeError("Invalid argument; `value` has no value.");this.value=n.EMPTY,o&&n.isGuid(o)&&(this.value=o)}return n.isGuid=function(o){var u=o.toString();return o&&(o instanceof n||n.validator.test(u))},n.create=function(){return new n([n.gen(2),n.gen(1),n.gen(1),n.gen(1),n.gen(3)].join("-"))},n.createEmpty=function(){return new n("emptyguid")},n.parse=function(o){return new n(o)},n.raw=function(){return[n.gen(2),n.gen(1),n.gen(1),n.gen(1),n.gen(3)].join("-")},n.gen=function(o){for(var u="",l=0;l<o;l++)u+=((1+Math.random())*65536|0).toString(16).substring(1);return u},n.prototype.equals=function(o){return n.isGuid(o)&&this.value===o.toString()},n.prototype.isEmpty=function(){return this.value===n.EMPTY},n.prototype.toString=function(){return this.value},n.prototype.toJSON=function(){return{value:this.value}},n.validator=new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$","i"),n.EMPTY="00000000-0000-0000-0000-000000000000",n})();e.Guid=t});function Me(e,t,n){this.low=e|0,this.high=t|0,this.unsigned=!!n}function st(e){return(e&&e.__isLong__)===!0}function _p(e){var t=Math.clz32(e&-e);return e?31-t:t}function Er(e,t){var n,o,u;return t?(e>>>=0,(u=0<=e&&e<256)&&(o=du[e],o)?o:(n=Ce(e,0,!0),u&&(du[e]=n),n)):(e|=0,(u=-128<=e&&e<128)&&(o=lu[e],o)?o:(n=Ce(e,e<0?-1:0,!1),u&&(lu[e]=n),n))}function St(e,t){if(isNaN(e))return t?jt:Tt;if(t){if(e<0)return jt;if(e>=cu)return fu}else{if(e<=-pu)return lt;if(e+1>=pu)return hu}return e<0?St(-e,t).neg():Ce(e%Kr|0,e/Kr|0,t)}function Ce(e,t,n){return new Me(e,t,n)}function fl(e,t,n){if(e.length===0)throw Error("empty string");if(typeof t=="number"?(n=t,t=!1):t=!!t,e==="NaN"||e==="Infinity"||e==="+Infinity"||e==="-Infinity")return t?jt:Tt;if(n=n||10,n<2||36<n)throw RangeError("radix");var o;if((o=e.indexOf("-"))>0)throw Error("interior hyphen");if(o===0)return fl(e.substring(1),t,n).neg();for(var u=St(ci(n,8)),l=Tt,d=0;d<e.length;d+=8){var c=Math.min(8,e.length-d),s=parseInt(e.substring(d,d+c),n);if(c<8){var r=St(ci(n,c));l=l.mul(r).add(St(s))}else l=l.mul(u),l=l.add(St(s))}return l.unsigned=t,l}function wt(e,t){return typeof e=="number"?St(e,t):typeof e=="string"?fl(e,t):Ce(e.low,e.high,typeof t=="boolean"?t:e.unsigned)}var ct,lu,du,ci,zs,wp,Kr,cu,pu,Ms,Tt,jt,Ar,Bs,Qi,hu,fu,lt,W,en,jy=D(()=>{ct=null;try{ct=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}Me.prototype.__isLong__,Object.defineProperty(Me.prototype,"__isLong__",{value:!0}),Me.isLong=st,lu={},du={},Me.fromInt=Er,Me.fromNumber=St,Me.fromBits=Ce,ci=Math.pow,Me.fromString=fl,Me.fromValue=wt,zs=65536,wp=1<<24,Kr=zs*zs,cu=Kr*Kr,pu=cu/2,Ms=Er(wp),Tt=Er(0),Me.ZERO=Tt,jt=Er(0,!0),Me.UZERO=jt,Ar=Er(1),Me.ONE=Ar,Bs=Er(1,!0),Me.UONE=Bs,Qi=Er(-1),Me.NEG_ONE=Qi,hu=Ce(-1,2147483647,!1),Me.MAX_VALUE=hu,fu=Ce(-1,-1,!0),Me.MAX_UNSIGNED_VALUE=fu,lt=Ce(0,-2147483648,!1),Me.MIN_VALUE=lt,W=Me.prototype,W.toInt=function(){return this.unsigned?this.low>>>0:this.low},W.toNumber=function(){return this.unsigned?(this.high>>>0)*Kr+(this.low>>>0):this.high*Kr+(this.low>>>0)},W.toString=function(e){if(e=e||10,e<2||36<e)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(lt)){var t=St(e),n=this.div(t),o=n.mul(t).sub(this);return n.toString(e)+o.toInt().toString(e)}else return"-"+this.neg().toString(e);for(var u=St(ci(e,6),this.unsigned),l=this,d="";;){var c=l.div(u),s=l.sub(c.mul(u)).toInt()>>>0,r=s.toString(e);if(l=c,l.isZero())return r+d;for(;r.length<6;)r="0"+r;d=""+r+d}},W.getHighBits=function(){return this.high},W.getHighBitsUnsigned=function(){return this.high>>>0},W.getLowBits=function(){return this.low},W.getLowBitsUnsigned=function(){return this.low>>>0},W.getNumBitsAbs=function(){if(this.isNegative())return this.eq(lt)?64:this.neg().getNumBitsAbs();for(var e=this.high!=0?this.high:this.low,t=31;t>0&&(e&1<<t)==0;t--);return this.high!=0?t+33:t+1},W.isSafeInteger=function(){var e=this.high>>21;return e?this.unsigned?!1:e===-1&&!(this.low===0&&this.high===-2097152):!0},W.isZero=function(){return this.high===0&&this.low===0},W.eqz=W.isZero,W.isNegative=function(){return!this.unsigned&&this.high<0},W.isPositive=function(){return this.unsigned||this.high>=0},W.isOdd=function(){return(this.low&1)===1},W.isEven=function(){return(this.low&1)===0},W.equals=function(e){return st(e)||(e=wt(e)),this.unsigned!==e.unsigned&&this.high>>>31===1&&e.high>>>31===1?!1:this.high===e.high&&this.low===e.low},W.eq=W.equals,W.notEquals=function(e){return!this.eq(e)},W.neq=W.notEquals,W.ne=W.notEquals,W.lessThan=function(e){return this.comp(e)<0},W.lt=W.lessThan,W.lessThanOrEqual=function(e){return this.comp(e)<=0},W.lte=W.lessThanOrEqual,W.le=W.lessThanOrEqual,W.greaterThan=function(e){return this.comp(e)>0},W.gt=W.greaterThan,W.greaterThanOrEqual=function(e){return this.comp(e)>=0},W.gte=W.greaterThanOrEqual,W.ge=W.greaterThanOrEqual,W.compare=function(e){if(st(e)||(e=wt(e)),this.eq(e))return 0;var t=this.isNegative(),n=e.isNegative();return t&&!n?-1:!t&&n?1:this.unsigned?e.high>>>0>this.high>>>0||e.high===this.high&&e.low>>>0>this.low>>>0?-1:1:this.sub(e).isNegative()?-1:1},W.comp=W.compare,W.negate=function(){return!this.unsigned&&this.eq(lt)?lt:this.not().add(Ar)},W.neg=W.negate,W.add=function(e){st(e)||(e=wt(e));var t=this.high>>>16,n=this.high&65535,o=this.low>>>16,u=this.low&65535,l=e.high>>>16,d=e.high&65535,c=e.low>>>16,s=e.low&65535,r=0,i=0,a=0,p=0;return p+=u+s,a+=p>>>16,p&=65535,a+=o+c,i+=a>>>16,a&=65535,i+=n+d,r+=i>>>16,i&=65535,r+=t+l,r&=65535,Ce(a<<16|p,r<<16|i,this.unsigned)},W.subtract=function(e){return st(e)||(e=wt(e)),this.add(e.neg())},W.sub=W.subtract,W.multiply=function(e){if(this.isZero())return this;if(st(e)||(e=wt(e)),ct){var t=ct.mul(this.low,this.high,e.low,e.high);return Ce(t,ct.get_high(),this.unsigned)}if(e.isZero())return this.unsigned?jt:Tt;if(this.eq(lt))return e.isOdd()?lt:Tt;if(e.eq(lt))return this.isOdd()?lt:Tt;if(this.isNegative())return e.isNegative()?this.neg().mul(e.neg()):this.neg().mul(e).neg();if(e.isNegative())return this.mul(e.neg()).neg();if(this.lt(Ms)&&e.lt(Ms))return St(this.toNumber()*e.toNumber(),this.unsigned);var n=this.high>>>16,o=this.high&65535,u=this.low>>>16,l=this.low&65535,d=e.high>>>16,c=e.high&65535,s=e.low>>>16,r=e.low&65535,i=0,a=0,p=0,h=0;return h+=l*r,p+=h>>>16,h&=65535,p+=u*r,a+=p>>>16,p&=65535,p+=l*s,a+=p>>>16,p&=65535,a+=o*r,i+=a>>>16,a&=65535,a+=u*s,i+=a>>>16,a&=65535,a+=l*c,i+=a>>>16,a&=65535,i+=n*r+o*s+u*c+l*d,i&=65535,Ce(p<<16|h,i<<16|a,this.unsigned)},W.mul=W.multiply,W.divide=function(e){if(st(e)||(e=wt(e)),e.isZero())throw Error("division by zero");if(ct){if(!this.unsigned&&this.high===-2147483648&&e.low===-1&&e.high===-1)return this;var t=(this.unsigned?ct.div_u:ct.div_s)(this.low,this.high,e.low,e.high);return Ce(t,ct.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?jt:Tt;var n,o,u;if(this.unsigned){if(e.unsigned||(e=e.toUnsigned()),e.gt(this))return jt;if(e.gt(this.shru(1)))return Bs;u=jt}else{if(this.eq(lt)){if(e.eq(Ar)||e.eq(Qi))return lt;if(e.eq(lt))return Ar;var l=this.shr(1);return n=l.div(e).shl(1),n.eq(Tt)?e.isNegative()?Ar:Qi:(o=this.sub(e.mul(n)),u=n.add(o.div(e)),u)}else if(e.eq(lt))return this.unsigned?jt:Tt;if(this.isNegative())return e.isNegative()?this.neg().div(e.neg()):this.neg().div(e).neg();if(e.isNegative())return this.div(e.neg()).neg();u=Tt}for(o=this;o.gte(e);){n=Math.max(1,Math.floor(o.toNumber()/e.toNumber()));for(var d=Math.ceil(Math.log(n)/Math.LN2),c=d<=48?1:ci(2,d-48),s=St(n),r=s.mul(e);r.isNegative()||r.gt(o);)n-=c,s=St(n,this.unsigned),r=s.mul(e);s.isZero()&&(s=Ar),u=u.add(s),o=o.sub(r)}return u},W.div=W.divide,W.modulo=function(e){if(st(e)||(e=wt(e)),ct){var t=(this.unsigned?ct.rem_u:ct.rem_s)(this.low,this.high,e.low,e.high);return Ce(t,ct.get_high(),this.unsigned)}return this.sub(this.div(e).mul(e))},W.mod=W.modulo,W.rem=W.modulo,W.not=function(){return Ce(~this.low,~this.high,this.unsigned)},W.countLeadingZeros=function(){return this.high?Math.clz32(this.high):Math.clz32(this.low)+32},W.clz=W.countLeadingZeros,W.countTrailingZeros=function(){return this.low?_p(this.low):_p(this.high)+32},W.ctz=W.countTrailingZeros,W.and=function(e){return st(e)||(e=wt(e)),Ce(this.low&e.low,this.high&e.high,this.unsigned)},W.or=function(e){return st(e)||(e=wt(e)),Ce(this.low|e.low,this.high|e.high,this.unsigned)},W.xor=function(e){return st(e)||(e=wt(e)),Ce(this.low^e.low,this.high^e.high,this.unsigned)},W.shiftLeft=function(e){return st(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ce(this.low<<e,this.high<<e|this.low>>>32-e,this.unsigned):Ce(0,this.low<<e-32,this.unsigned)},W.shl=W.shiftLeft,W.shiftRight=function(e){return st(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ce(this.low>>>e|this.high<<32-e,this.high>>e,this.unsigned):Ce(this.high>>e-32,this.high>=0?0:-1,this.unsigned)},W.shr=W.shiftRight,W.shiftRightUnsigned=function(e){return st(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?Ce(this.low>>>e|this.high<<32-e,this.high>>>e,this.unsigned):e===32?Ce(this.high,0,this.unsigned):Ce(this.high>>>e-32,0,this.unsigned)},W.shru=W.shiftRightUnsigned,W.shr_u=W.shiftRightUnsigned,W.rotateLeft=function(e){var t;return st(e)&&(e=e.toInt()),(e&=63)===0?this:e===32?Ce(this.high,this.low,this.unsigned):e<32?(t=32-e,Ce(this.low<<e|this.high>>>t,this.high<<e|this.low>>>t,this.unsigned)):(e-=32,t=32-e,Ce(this.high<<e|this.low>>>t,this.low<<e|this.high>>>t,this.unsigned))},W.rotl=W.rotateLeft,W.rotateRight=function(e){var t;return st(e)&&(e=e.toInt()),(e&=63)===0?this:e===32?Ce(this.high,this.low,this.unsigned):e<32?(t=32-e,Ce(this.high<<t|this.low>>>e,this.low<<t|this.high>>>e,this.unsigned)):(e-=32,t=32-e,Ce(this.low<<t|this.high>>>e,this.high<<t|this.low>>>e,this.unsigned))},W.rotr=W.rotateRight,W.toSigned=function(){return this.unsigned?Ce(this.low,this.high,!1):this},W.toUnsigned=function(){return this.unsigned?this:Ce(this.low,this.high,!0)},W.toBytes=function(e){return e?this.toBytesLE():this.toBytesBE()},W.toBytesLE=function(){var e=this.high,t=this.low;return[t&255,t>>>8&255,t>>>16&255,t>>>24,e&255,e>>>8&255,e>>>16&255,e>>>24]},W.toBytesBE=function(){var e=this.high,t=this.low;return[e>>>24,e>>>16&255,e>>>8&255,e&255,t>>>24,t>>>16&255,t>>>8&255,t&255]},Me.fromBytes=function(e,t,n){return n?Me.fromBytesLE(e,t):Me.fromBytesBE(e,t)},Me.fromBytesLE=function(e,t){return new Me(e[0]|e[1]<<8|e[2]<<16|e[3]<<24,e[4]|e[5]<<8|e[6]<<16|e[7]<<24,t)},Me.fromBytesBE=function(e,t){return new Me(e[4]<<24|e[5]<<16|e[6]<<8|e[7],e[0]<<24|e[1]<<16|e[2]<<8|e[3],t)},typeof BigInt=="function"&&(Me.fromBigInt=function(e,t){var n=Number(BigInt.asIntN(32,e)),o=Number(BigInt.asIntN(32,e>>BigInt(32)));return Ce(n,o,t)},Me.fromValue=function(e,t){return typeof e=="bigint"?Me.fromBigInt(e,t):wt(e,t)},W.toBigInt=function(){var e=BigInt(this.low>>>0),t=BigInt(this.unsigned?this.high>>>0:this.high);return t<<BigInt(32)|e}),en=Me}),Uy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.ArgType=void 0;var t;(function(n){n[n.INPUT=0]="INPUT",n[n.OUTPUT=1]="OUTPUT"})(t||(e.ArgType=t={}))}),ml=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.SIZE_PREFIX_LENGTH=e.FILE_IDENTIFIER_LENGTH=e.SIZEOF_INT=e.SIZEOF_SHORT=void 0,e.SIZEOF_SHORT=2,e.SIZEOF_INT=4,e.FILE_IDENTIFIER_LENGTH=4,e.SIZE_PREFIX_LENGTH=4}),Vy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.isLittleEndian=e.float64=e.float32=e.int32=void 0,e.int32=new Int32Array(2),e.float32=new Float32Array(e.int32.buffer),e.float64=new Float64Array(e.int32.buffer),e.isLittleEndian=new Uint16Array(new Uint8Array([1,0]).buffer)[0]===1}),Gy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Encoding=void 0;var t;(function(n){n[n.UTF8_BYTES=1]="UTF8_BYTES",n[n.UTF16_STRING=2]="UTF16_STRING"})(t||(e.Encoding=t={}))}),qy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.ByteBuffer=void 0;var t=ml(),n=Gy(),o=Vy(),u=class Hy{constructor(d){this.bytes_=d,this.position_=0,this.text_decoder_=new TextDecoder}static allocate(d){return new Hy(new Uint8Array(d))}clear(){this.position_=0}bytes(){return this.bytes_}position(){return this.position_}setPosition(d){this.position_=d}capacity(){return this.bytes_.length}readInt8(d){return this.readUint8(d)<<24>>24}readUint8(d){return this.bytes_[d]}readInt16(d){return this.readUint16(d)<<16>>16}readUint16(d){return this.bytes_[d]|this.bytes_[d+1]<<8}readInt32(d){return this.bytes_[d]|this.bytes_[d+1]<<8|this.bytes_[d+2]<<16|this.bytes_[d+3]<<24}readUint32(d){return this.readInt32(d)>>>0}readInt64(d){return BigInt.asIntN(64,BigInt(this.readUint32(d))+(BigInt(this.readUint32(d+4))<<BigInt(32)))}readUint64(d){return BigInt.asUintN(64,BigInt(this.readUint32(d))+(BigInt(this.readUint32(d+4))<<BigInt(32)))}readFloat32(d){return o.int32[0]=this.readInt32(d),o.float32[0]}readFloat64(d){return o.int32[o.isLittleEndian?0:1]=this.readInt32(d),o.int32[o.isLittleEndian?1:0]=this.readInt32(d+4),o.float64[0]}writeInt8(d,c){this.bytes_[d]=c}writeUint8(d,c){this.bytes_[d]=c}writeInt16(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8}writeUint16(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8}writeInt32(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8,this.bytes_[d+2]=c>>16,this.bytes_[d+3]=c>>24}writeUint32(d,c){this.bytes_[d]=c,this.bytes_[d+1]=c>>8,this.bytes_[d+2]=c>>16,this.bytes_[d+3]=c>>24}writeInt64(d,c){this.writeInt32(d,Number(BigInt.asIntN(32,c))),this.writeInt32(d+4,Number(BigInt.asIntN(32,c>>BigInt(32))))}writeUint64(d,c){this.writeUint32(d,Number(BigInt.asUintN(32,c))),this.writeUint32(d+4,Number(BigInt.asUintN(32,c>>BigInt(32))))}writeFloat32(d,c){o.float32[0]=c,this.writeInt32(d,o.int32[0])}writeFloat64(d,c){o.float64[0]=c,this.writeInt32(d,o.int32[o.isLittleEndian?0:1]),this.writeInt32(d+4,o.int32[o.isLittleEndian?1:0])}getBufferIdentifier(){if(this.bytes_.length<this.position_+t.SIZEOF_INT+t.FILE_IDENTIFIER_LENGTH)throw new Error("FlatBuffers: ByteBuffer is too short to contain an identifier.");let d="";for(let c=0;c<t.FILE_IDENTIFIER_LENGTH;c++)d+=String.fromCharCode(this.readInt8(this.position_+t.SIZEOF_INT+c));return d}__offset(d,c){let s=d-this.readInt32(d);return c<this.readInt16(s)?this.readInt16(s+c):0}__union(d,c){return d.bb_pos=c+this.readInt32(c),d.bb=this,d}__string(d,c){d+=this.readInt32(d);let s=this.readInt32(d);d+=t.SIZEOF_INT;let r=this.bytes_.subarray(d,d+s);return c===n.Encoding.UTF8_BYTES?r:this.text_decoder_.decode(r)}__union_with_string(d,c){return typeof d=="string"?this.__string(c):this.__union(d,c)}__indirect(d){return d+this.readInt32(d)}__vector(d){return d+this.readInt32(d)+t.SIZEOF_INT}__vector_len(d){return this.readInt32(d+this.readInt32(d))}__has_identifier(d){if(d.length!=t.FILE_IDENTIFIER_LENGTH)throw new Error("FlatBuffers: file identifier must be length "+t.FILE_IDENTIFIER_LENGTH);for(let c=0;c<t.FILE_IDENTIFIER_LENGTH;c++)if(d.charCodeAt(c)!=this.readInt8(this.position()+t.SIZEOF_INT+c))return!1;return!0}createScalarList(d,c){let s=[];for(let r=0;r<c;++r){let i=d(r);i!==null&&s.push(i)}return s}createObjList(d,c){let s=[];for(let r=0;r<c;++r){let i=d(r);i!==null&&s.push(i.unpack())}return s}};e.ByteBuffer=u}),bI=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Builder=void 0;var t=qy(),n=ml(),o=class Wy{constructor(l){this.minalign=1,this.vtable=null,this.vtable_in_use=0,this.isNested=!1,this.object_start=0,this.vtables=[],this.vector_num_elems=0,this.force_defaults=!1,this.string_maps=null,this.text_encoder=new TextEncoder;let d;l?d=l:d=1024,this.bb=t.ByteBuffer.allocate(d),this.space=d}clear(){this.bb.clear(),this.space=this.bb.capacity(),this.minalign=1,this.vtable=null,this.vtable_in_use=0,this.isNested=!1,this.object_start=0,this.vtables=[],this.vector_num_elems=0,this.force_defaults=!1,this.string_maps=null}forceDefaults(l){this.force_defaults=l}dataBuffer(){return this.bb}asUint8Array(){return this.bb.bytes().subarray(this.bb.position(),this.bb.position()+this.offset())}prep(l,d){l>this.minalign&&(this.minalign=l);let c=~(this.bb.capacity()-this.space+d)+1&l-1;for(;this.space<c+l+d;){let s=this.bb.capacity();this.bb=Wy.growByteBuffer(this.bb),this.space+=this.bb.capacity()-s}this.pad(c)}pad(l){for(let d=0;d<l;d++)this.bb.writeInt8(--this.space,0)}writeInt8(l){this.bb.writeInt8(this.space-=1,l)}writeInt16(l){this.bb.writeInt16(this.space-=2,l)}writeInt32(l){this.bb.writeInt32(this.space-=4,l)}writeInt64(l){this.bb.writeInt64(this.space-=8,l)}writeFloat32(l){this.bb.writeFloat32(this.space-=4,l)}writeFloat64(l){this.bb.writeFloat64(this.space-=8,l)}addInt8(l){this.prep(1,0),this.writeInt8(l)}addInt16(l){this.prep(2,0),this.writeInt16(l)}addInt32(l){this.prep(4,0),this.writeInt32(l)}addInt64(l){this.prep(8,0),this.writeInt64(l)}addFloat32(l){this.prep(4,0),this.writeFloat32(l)}addFloat64(l){this.prep(8,0),this.writeFloat64(l)}addFieldInt8(l,d,c){(this.force_defaults||d!=c)&&(this.addInt8(d),this.slot(l))}addFieldInt16(l,d,c){(this.force_defaults||d!=c)&&(this.addInt16(d),this.slot(l))}addFieldInt32(l,d,c){(this.force_defaults||d!=c)&&(this.addInt32(d),this.slot(l))}addFieldInt64(l,d,c){(this.force_defaults||d!==c)&&(this.addInt64(d),this.slot(l))}addFieldFloat32(l,d,c){(this.force_defaults||d!=c)&&(this.addFloat32(d),this.slot(l))}addFieldFloat64(l,d,c){(this.force_defaults||d!=c)&&(this.addFloat64(d),this.slot(l))}addFieldOffset(l,d,c){(this.force_defaults||d!=c)&&(this.addOffset(d),this.slot(l))}addFieldStruct(l,d,c){d!=c&&(this.nested(d),this.slot(l))}nested(l){if(l!=this.offset())throw new TypeError("FlatBuffers: struct must be serialized inline.")}notNested(){if(this.isNested)throw new TypeError("FlatBuffers: object serialization must not be nested.")}slot(l){this.vtable!==null&&(this.vtable[l]=this.offset())}offset(){return this.bb.capacity()-this.space}static growByteBuffer(l){let d=l.capacity();if(d&3221225472)throw new Error("FlatBuffers: cannot grow buffer beyond 2 gigabytes.");let c=d<<1,s=t.ByteBuffer.allocate(c);return s.setPosition(c-d),s.bytes().set(l.bytes(),c-d),s}addOffset(l){this.prep(n.SIZEOF_INT,0),this.writeInt32(this.offset()-l+n.SIZEOF_INT)}startObject(l){this.notNested(),this.vtable==null&&(this.vtable=[]),this.vtable_in_use=l;for(let d=0;d<l;d++)this.vtable[d]=0;this.isNested=!0,this.object_start=this.offset()}endObject(){if(this.vtable==null||!this.isNested)throw new Error("FlatBuffers: endObject called without startObject");this.addInt32(0);let l=this.offset(),d=this.vtable_in_use-1;for(;d>=0&&this.vtable[d]==0;d--);let c=d+1;for(;d>=0;d--)this.addInt16(this.vtable[d]!=0?l-this.vtable[d]:0);let s=2;this.addInt16(l-this.object_start);let r=(c+s)*n.SIZEOF_SHORT;this.addInt16(r);let i=0,a=this.space;e:for(d=0;d<this.vtables.length;d++){let p=this.bb.capacity()-this.vtables[d];if(r==this.bb.readInt16(p)){for(let h=n.SIZEOF_SHORT;h<r;h+=n.SIZEOF_SHORT)if(this.bb.readInt16(a+h)!=this.bb.readInt16(p+h))continue e;i=this.vtables[d];break}}return i?(this.space=this.bb.capacity()-l,this.bb.writeInt32(this.space,i-l)):(this.vtables.push(this.offset()),this.bb.writeInt32(this.bb.capacity()-l,this.offset()-l)),this.isNested=!1,l}finish(l,d,c){let s=c?n.SIZE_PREFIX_LENGTH:0;if(d){let r=d;if(this.prep(this.minalign,n.SIZEOF_INT+n.FILE_IDENTIFIER_LENGTH+s),r.length!=n.FILE_IDENTIFIER_LENGTH)throw new TypeError("FlatBuffers: file identifier must be length "+n.FILE_IDENTIFIER_LENGTH);for(let i=n.FILE_IDENTIFIER_LENGTH-1;i>=0;i--)this.writeInt8(r.charCodeAt(i))}this.prep(this.minalign,n.SIZEOF_INT+s),this.addOffset(l),s&&this.addInt32(this.bb.capacity()-this.space),this.bb.setPosition(this.space)}finishSizePrefixed(l,d){this.finish(l,d,!0)}requiredField(l,d){let c=this.bb.capacity()-l,s=c-this.bb.readInt32(c);if(!(d<this.bb.readInt16(s)&&this.bb.readInt16(s+d)!=0))throw new TypeError("FlatBuffers: field "+d+" must be set")}startVector(l,d,c){this.notNested(),this.vector_num_elems=d,this.prep(n.SIZEOF_INT,l*d),this.prep(c,l*d)}endVector(){return this.writeInt32(this.vector_num_elems),this.offset()}createSharedString(l){if(!l)return 0;if(this.string_maps||(this.string_maps=new Map),this.string_maps.has(l))return this.string_maps.get(l);let d=this.createString(l);return this.string_maps.set(l,d),d}createString(l){if(l==null)return 0;let d;return l instanceof Uint8Array?d=l:d=this.text_encoder.encode(l),this.addInt8(0),this.startVector(1,d.length,1),this.bb.setPosition(this.space-=d.length),this.bb.bytes().set(d,this.space),this.endVector()}createByteVector(l){return l==null?0:(this.startVector(1,l.length,1),this.bb.setPosition(this.space-=l.length),this.bb.bytes().set(l,this.space),this.endVector())}createObjectOffset(l){return l===null?0:typeof l=="string"?this.createString(l):l.pack(this)}createObjectOffsetList(l){let d=[];for(let c=0;c<l.length;++c){let s=l[c];if(s!==null)d.push(this.createObjectOffset(s));else throw new TypeError("FlatBuffers: Argument for createObjectOffsetList cannot contain null.")}return d}createStructOffsetList(l,d){return d(this,l.length),this.createObjectOffsetList(l.slice().reverse()),this.endVector()}};e.Builder=o}),Re=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.Encoding=e.ByteBuffer=e.Builder=e.isLittleEndian=e.int32=e.float64=e.float32=e.SIZE_PREFIX_LENGTH=e.SIZEOF_SHORT=e.SIZEOF_INT=e.FILE_IDENTIFIER_LENGTH=void 0;var t=ml();Object.defineProperty(e,"FILE_IDENTIFIER_LENGTH",{enumerable:!0,get:function(){return t.FILE_IDENTIFIER_LENGTH}}),Object.defineProperty(e,"SIZEOF_INT",{enumerable:!0,get:function(){return t.SIZEOF_INT}}),Object.defineProperty(e,"SIZEOF_SHORT",{enumerable:!0,get:function(){return t.SIZEOF_SHORT}}),Object.defineProperty(e,"SIZE_PREFIX_LENGTH",{enumerable:!0,get:function(){return t.SIZE_PREFIX_LENGTH}});var n=Vy();Object.defineProperty(e,"float32",{enumerable:!0,get:function(){return n.float32}}),Object.defineProperty(e,"float64",{enumerable:!0,get:function(){return n.float64}}),Object.defineProperty(e,"int32",{enumerable:!0,get:function(){return n.int32}}),Object.defineProperty(e,"isLittleEndian",{enumerable:!0,get:function(){return n.isLittleEndian}});var o=bI();Object.defineProperty(e,"Builder",{enumerable:!0,get:function(){return o.Builder}});var u=qy();Object.defineProperty(e,"ByteBuffer",{enumerable:!0,get:function(){return u.ByteBuffer}});var l=Gy();Object.defineProperty(e,"Encoding",{enumerable:!0,get:function(){return l.Encoding}})}),Ky=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.ArgTypeAndIndex=void 0;var u=o(Re()),l=Uy(),d=class Nr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsArgTypeAndIndex(s,r){return(r||new Nr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsArgTypeAndIndex(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Nr).__init(s.readInt32(s.position())+s.position(),s)}argType(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readInt8(this.bb_pos+s):l.ArgType.INPUT}index(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint32(this.bb_pos+s):0}static startArgTypeAndIndex(s){s.startObject(2)}static addArgType(s,r){s.addFieldInt8(0,r,l.ArgType.INPUT)}static addIndex(s,r){s.addFieldInt32(1,r,0)}static endArgTypeAndIndex(s){return s.endObject()}static createArgTypeAndIndex(s,r,i){return Nr.startArgTypeAndIndex(s),Nr.addArgType(s,r),Nr.addIndex(s,i),Nr.endArgTypeAndIndex(s)}};e.ArgTypeAndIndex=d}),Xy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.AttributeType=void 0;var t;(function(n){n[n.UNDEFINED=0]="UNDEFINED",n[n.FLOAT=1]="FLOAT",n[n.INT=2]="INT",n[n.STRING=3]="STRING",n[n.TENSOR=4]="TENSOR",n[n.GRAPH=5]="GRAPH",n[n.FLOATS=6]="FLOATS",n[n.INTS=7]="INTS",n[n.STRINGS=8]="STRINGS",n[n.TENSORS=9]="TENSORS",n[n.GRAPHS=10]="GRAPHS",n[n.SPARSE_TENSOR=11]="SPARSE_TENSOR",n[n.SPARSE_TENSORS=12]="SPARSE_TENSORS"})(t||(e.AttributeType=t={}))}),Zy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.NodeType=void 0;var t;(function(n){n[n.Primitive=0]="Primitive",n[n.Fused=1]="Fused"})(t||(e.NodeType=t={}))}),Yy=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Node=void 0;var u=o(Re()),l=f0(),d=Zy(),c=class et{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsNode(r,i){return(i||new et).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsNode(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new et).__init(r.readInt32(r.position())+r.position(),r)}name(r){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.__string(this.bb_pos+i,r):null}docString(r){let i=this.bb.__offset(this.bb_pos,6);return i?this.bb.__string(this.bb_pos+i,r):null}domain(r){let i=this.bb.__offset(this.bb_pos,8);return i?this.bb.__string(this.bb_pos+i,r):null}sinceVersion(){let r=this.bb.__offset(this.bb_pos,10);return r?this.bb.readInt32(this.bb_pos+r):0}index(){let r=this.bb.__offset(this.bb_pos,12);return r?this.bb.readUint32(this.bb_pos+r):0}opType(r){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.__string(this.bb_pos+i,r):null}type(){let r=this.bb.__offset(this.bb_pos,16);return r?this.bb.readInt32(this.bb_pos+r):d.NodeType.Primitive}executionProviderType(r){let i=this.bb.__offset(this.bb_pos,18);return i?this.bb.__string(this.bb_pos+i,r):null}inputs(r,i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}inputsLength(){let r=this.bb.__offset(this.bb_pos,20);return r?this.bb.__vector_len(this.bb_pos+r):0}outputs(r,i){let a=this.bb.__offset(this.bb_pos,22);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}outputsLength(){let r=this.bb.__offset(this.bb_pos,22);return r?this.bb.__vector_len(this.bb_pos+r):0}attributes(r,i){let a=this.bb.__offset(this.bb_pos,24);return a?(i||new l.Attribute).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+a)+r*4),this.bb):null}attributesLength(){let r=this.bb.__offset(this.bb_pos,24);return r?this.bb.__vector_len(this.bb_pos+r):0}inputArgCounts(r){let i=this.bb.__offset(this.bb_pos,26);return i?this.bb.readInt32(this.bb.__vector(this.bb_pos+i)+r*4):0}inputArgCountsLength(){let r=this.bb.__offset(this.bb_pos,26);return r?this.bb.__vector_len(this.bb_pos+r):0}inputArgCountsArray(){let r=this.bb.__offset(this.bb_pos,26);return r?new Int32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+r),this.bb.__vector_len(this.bb_pos+r)):null}implicitInputs(r,i){let a=this.bb.__offset(this.bb_pos,28);return a?this.bb.__string(this.bb.__vector(this.bb_pos+a)+r*4,i):null}implicitInputsLength(){let r=this.bb.__offset(this.bb_pos,28);return r?this.bb.__vector_len(this.bb_pos+r):0}static startNode(r){r.startObject(13)}static addName(r,i){r.addFieldOffset(0,i,0)}static addDocString(r,i){r.addFieldOffset(1,i,0)}static addDomain(r,i){r.addFieldOffset(2,i,0)}static addSinceVersion(r,i){r.addFieldInt32(3,i,0)}static addIndex(r,i){r.addFieldInt32(4,i,0)}static addOpType(r,i){r.addFieldOffset(5,i,0)}static addType(r,i){r.addFieldInt32(6,i,d.NodeType.Primitive)}static addExecutionProviderType(r,i){r.addFieldOffset(7,i,0)}static addInputs(r,i){r.addFieldOffset(8,i,0)}static createInputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startInputsVector(r,i){r.startVector(4,i,4)}static addOutputs(r,i){r.addFieldOffset(9,i,0)}static createOutputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startOutputsVector(r,i){r.startVector(4,i,4)}static addAttributes(r,i){r.addFieldOffset(10,i,0)}static createAttributesVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startAttributesVector(r,i){r.startVector(4,i,4)}static addInputArgCounts(r,i){r.addFieldOffset(11,i,0)}static createInputArgCountsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addInt32(i[a]);return r.endVector()}static startInputArgCountsVector(r,i){r.startVector(4,i,4)}static addImplicitInputs(r,i){r.addFieldOffset(12,i,0)}static createImplicitInputsVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startImplicitInputsVector(r,i){r.startVector(4,i,4)}static endNode(r){return r.endObject()}static createNode(r,i,a,p,h,m,b,$,v,y,T,I,S,A){return et.startNode(r),et.addName(r,i),et.addDocString(r,a),et.addDomain(r,p),et.addSinceVersion(r,h),et.addIndex(r,m),et.addOpType(r,b),et.addType(r,$),et.addExecutionProviderType(r,v),et.addInputs(r,y),et.addOutputs(r,T),et.addAttributes(r,I),et.addInputArgCounts(r,S),et.addImplicitInputs(r,A),et.endNode(r)}};e.Node=c}),Jy=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.EdgeEnd=void 0;var t=class{constructor(){this.bb=null,this.bb_pos=0}__init(n,o){return this.bb_pos=n,this.bb=o,this}nodeIndex(){return this.bb.readUint32(this.bb_pos)}srcArgIndex(){return this.bb.readInt32(this.bb_pos+4)}dstArgIndex(){return this.bb.readInt32(this.bb_pos+8)}static sizeOf(){return 12}static createEdgeEnd(n,o,u,l){return n.prep(4,12),n.writeInt32(l),n.writeInt32(u),n.writeInt32(o),n.offset()}};e.EdgeEnd=t}),Qy=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.NodeEdge=void 0;var u=o(Re()),l=Jy(),d=class pr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsNodeEdge(s,r){return(r||new pr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsNodeEdge(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new pr).__init(s.readInt32(s.position())+s.position(),s)}nodeIndex(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb_pos+s):0}inputEdges(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.EdgeEnd).__init(this.bb.__vector(this.bb_pos+i)+s*12,this.bb):null}inputEdgesLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}outputEdges(s,r){let i=this.bb.__offset(this.bb_pos,8);return i?(r||new l.EdgeEnd).__init(this.bb.__vector(this.bb_pos+i)+s*12,this.bb):null}outputEdgesLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}static startNodeEdge(s){s.startObject(3)}static addNodeIndex(s,r){s.addFieldInt32(0,r,0)}static addInputEdges(s,r){s.addFieldOffset(1,r,0)}static startInputEdgesVector(s,r){s.startVector(12,r,4)}static addOutputEdges(s,r){s.addFieldOffset(2,r,0)}static startOutputEdgesVector(s,r){s.startVector(12,r,4)}static endNodeEdge(s){return s.endObject()}static createNodeEdge(s,r,i,a){return pr.startNodeEdge(s),pr.addNodeIndex(s,r),pr.addInputEdges(s,i),pr.addOutputEdges(s,a),pr.endNodeEdge(s)}};e.NodeEdge=d}),e0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.NodesToOptimizeIndices=void 0;var u=o(Re()),l=class xt{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsNodesToOptimizeIndices(c,s){return(s||new xt).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsNodesToOptimizeIndices(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new xt).__init(c.readInt32(c.position())+c.position(),c)}nodeIndices(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb.__vector(this.bb_pos+s)+c*4):0}nodeIndicesLength(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.__vector_len(this.bb_pos+c):0}nodeIndicesArray(){let c=this.bb.__offset(this.bb_pos,4);return c?new Uint32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+c),this.bb.__vector_len(this.bb_pos+c)):null}numInputs(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readUint32(this.bb_pos+c):0}numOutputs(){let c=this.bb.__offset(this.bb_pos,8);return c?this.bb.readUint32(this.bb_pos+c):0}hasVariadicInput(){let c=this.bb.__offset(this.bb_pos,10);return c?!!this.bb.readInt8(this.bb_pos+c):!1}hasVariadicOutput(){let c=this.bb.__offset(this.bb_pos,12);return c?!!this.bb.readInt8(this.bb_pos+c):!1}numVariadicInputs(){let c=this.bb.__offset(this.bb_pos,14);return c?this.bb.readUint32(this.bb_pos+c):0}numVariadicOutputs(){let c=this.bb.__offset(this.bb_pos,16);return c?this.bb.readUint32(this.bb_pos+c):0}static startNodesToOptimizeIndices(c){c.startObject(7)}static addNodeIndices(c,s){c.addFieldOffset(0,s,0)}static createNodeIndicesVector(c,s){c.startVector(4,s.length,4);for(let r=s.length-1;r>=0;r--)c.addInt32(s[r]);return c.endVector()}static startNodeIndicesVector(c,s){c.startVector(4,s,4)}static addNumInputs(c,s){c.addFieldInt32(1,s,0)}static addNumOutputs(c,s){c.addFieldInt32(2,s,0)}static addHasVariadicInput(c,s){c.addFieldInt8(3,+s,0)}static addHasVariadicOutput(c,s){c.addFieldInt8(4,+s,0)}static addNumVariadicInputs(c,s){c.addFieldInt32(5,s,0)}static addNumVariadicOutputs(c,s){c.addFieldInt32(6,s,0)}static endNodesToOptimizeIndices(c){return c.endObject()}static createNodesToOptimizeIndices(c,s,r,i,a,p,h,m){return xt.startNodesToOptimizeIndices(c),xt.addNodeIndices(c,s),xt.addNumInputs(c,r),xt.addNumOutputs(c,i),xt.addHasVariadicInput(c,a),xt.addHasVariadicOutput(c,p),xt.addNumVariadicInputs(c,h),xt.addNumVariadicOutputs(c,m),xt.endNodesToOptimizeIndices(c)}};e.NodesToOptimizeIndices=l}),t0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizationRecord=void 0;var u=o(Re()),l=e0(),d=class mu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizationRecord(s,r){return(r||new mu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizationRecord(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new mu).__init(s.readInt32(s.position())+s.position(),s)}actionId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}nodesToOptimizeIndices(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.NodesToOptimizeIndices).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}producedOpIds(s,r){let i=this.bb.__offset(this.bb_pos,10);return i?this.bb.__string(this.bb.__vector(this.bb_pos+i)+s*4,r):null}producedOpIdsLength(){let s=this.bb.__offset(this.bb_pos,10);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizationRecord(s){s.startObject(4)}static addActionId(s,r){s.addFieldOffset(0,r,0)}static addNodesToOptimizeIndices(s,r){s.addFieldOffset(1,r,0)}static addProducedOpIds(s,r){s.addFieldOffset(3,r,0)}static createProducedOpIdsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startProducedOpIdsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizationRecord(s){return s.endObject()}};e.RuntimeOptimizationRecord=d}),r0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizationRecordContainerEntry=void 0;var u=o(Re()),l=t0(),d=class zr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizationRecordContainerEntry(s,r){return(r||new zr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizationRecordContainerEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new zr).__init(s.readInt32(s.position())+s.position(),s)}optimizerName(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}runtimeOptimizationRecords(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.RuntimeOptimizationRecord).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}runtimeOptimizationRecordsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizationRecordContainerEntry(s){s.startObject(2)}static addOptimizerName(s,r){s.addFieldOffset(0,r,0)}static addRuntimeOptimizationRecords(s,r){s.addFieldOffset(1,r,0)}static createRuntimeOptimizationRecordsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startRuntimeOptimizationRecordsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizationRecordContainerEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createRuntimeOptimizationRecordContainerEntry(s,r,i){return zr.startRuntimeOptimizationRecordContainerEntry(s),zr.addOptimizerName(s,r),zr.addRuntimeOptimizationRecords(s,i),zr.endRuntimeOptimizationRecordContainerEntry(s)}};e.RuntimeOptimizationRecordContainerEntry=d}),n0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.RuntimeOptimizations=void 0;var u=o(Re()),l=r0(),d=class mn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsRuntimeOptimizations(s,r){return(r||new mn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsRuntimeOptimizations(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new mn).__init(s.readInt32(s.position())+s.position(),s)}records(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.RuntimeOptimizationRecordContainerEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}recordsLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startRuntimeOptimizations(s){s.startObject(1)}static addRecords(s,r){s.addFieldOffset(0,r,0)}static createRecordsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startRecordsVector(s,r){s.startVector(4,r,4)}static endRuntimeOptimizations(s){return s.endObject()}static createRuntimeOptimizations(s,r){return mn.startRuntimeOptimizations(s),mn.addRecords(s,r),mn.endRuntimeOptimizations(s)}};e.RuntimeOptimizations=d}),Ro=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.TensorDataType=void 0;var t;(function(n){n[n.UNDEFINED=0]="UNDEFINED",n[n.FLOAT=1]="FLOAT",n[n.UINT8=2]="UINT8",n[n.INT8=3]="INT8",n[n.UINT16=4]="UINT16",n[n.INT16=5]="INT16",n[n.INT32=6]="INT32",n[n.INT64=7]="INT64",n[n.STRING=8]="STRING",n[n.BOOL=9]="BOOL",n[n.FLOAT16=10]="FLOAT16",n[n.DOUBLE=11]="DOUBLE",n[n.UINT32=12]="UINT32",n[n.UINT64=13]="UINT64",n[n.COMPLEX64=14]="COMPLEX64",n[n.COMPLEX128=15]="COMPLEX128",n[n.BFLOAT16=16]="BFLOAT16",n[n.FLOAT8E4M3FN=17]="FLOAT8E4M3FN",n[n.FLOAT8E4M3FNUZ=18]="FLOAT8E4M3FNUZ",n[n.FLOAT8E5M2=19]="FLOAT8E5M2",n[n.FLOAT8E5M2FNUZ=20]="FLOAT8E5M2FNUZ"})(t||(e.TensorDataType=t={}))}),No=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Tensor=void 0;var u=o(Re()),l=Ro(),d=class $t{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsTensor(s,r){return(r||new $t).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsTensor(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new $t).__init(s.readInt32(s.position())+s.position(),s)}name(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}docString(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}dims(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.readInt64(this.bb.__vector(this.bb_pos+r)+s*8):BigInt(0)}dimsLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}dataType(){let s=this.bb.__offset(this.bb_pos,10);return s?this.bb.readInt32(this.bb_pos+s):l.TensorDataType.UNDEFINED}rawData(s){let r=this.bb.__offset(this.bb_pos,12);return r?this.bb.readUint8(this.bb.__vector(this.bb_pos+r)+s):0}rawDataLength(){let s=this.bb.__offset(this.bb_pos,12);return s?this.bb.__vector_len(this.bb_pos+s):0}rawDataArray(){let s=this.bb.__offset(this.bb_pos,12);return s?new Uint8Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+s),this.bb.__vector_len(this.bb_pos+s)):null}stringData(s,r){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.__string(this.bb.__vector(this.bb_pos+i)+s*4,r):null}stringDataLength(){let s=this.bb.__offset(this.bb_pos,14);return s?this.bb.__vector_len(this.bb_pos+s):0}externalDataOffset(){let s=this.bb.__offset(this.bb_pos,16);return s?this.bb.readInt64(this.bb_pos+s):BigInt("-1")}static startTensor(s){s.startObject(7)}static addName(s,r){s.addFieldOffset(0,r,0)}static addDocString(s,r){s.addFieldOffset(1,r,0)}static addDims(s,r){s.addFieldOffset(2,r,0)}static createDimsVector(s,r){s.startVector(8,r.length,8);for(let i=r.length-1;i>=0;i--)s.addInt64(r[i]);return s.endVector()}static startDimsVector(s,r){s.startVector(8,r,8)}static addDataType(s,r){s.addFieldInt32(3,r,l.TensorDataType.UNDEFINED)}static addRawData(s,r){s.addFieldOffset(4,r,0)}static createRawDataVector(s,r){s.startVector(1,r.length,1);for(let i=r.length-1;i>=0;i--)s.addInt8(r[i]);return s.endVector()}static startRawDataVector(s,r){s.startVector(1,r,1)}static addStringData(s,r){s.addFieldOffset(5,r,0)}static createStringDataVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startStringDataVector(s,r){s.startVector(4,r,4)}static addExternalDataOffset(s,r){s.addFieldInt64(6,r,BigInt("-1"))}static endTensor(s){return s.endObject()}static createTensor(s,r,i,a,p,h,m,b){return $t.startTensor(s),$t.addName(s,r),$t.addDocString(s,i),$t.addDims(s,a),$t.addDataType(s,p),$t.addRawData(s,h),$t.addStringData(s,m),$t.addExternalDataOffset(s,b),$t.endTensor(s)}};e.Tensor=d}),i0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.SparseTensor=void 0;var u=o(Re()),l=No(),d=class gu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsSparseTensor(s,r){return(r||new gu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsSparseTensor(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new gu).__init(s.readInt32(s.position())+s.position(),s)}values(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.Tensor).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}indices(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.Tensor).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}dims(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.readInt64(this.bb.__vector(this.bb_pos+r)+s*8):BigInt(0)}dimsLength(){let s=this.bb.__offset(this.bb_pos,8);return s?this.bb.__vector_len(this.bb_pos+s):0}static startSparseTensor(s){s.startObject(3)}static addValues(s,r){s.addFieldOffset(0,r,0)}static addIndices(s,r){s.addFieldOffset(1,r,0)}static addDims(s,r){s.addFieldOffset(2,r,0)}static createDimsVector(s,r){s.startVector(8,r.length,8);for(let i=r.length-1;i>=0;i--)s.addInt64(r[i]);return s.endVector()}static startDimsVector(s,r){s.startVector(8,r,8)}static endSparseTensor(s){return s.endObject()}};e.SparseTensor=d}),o0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.MapType=void 0;var u=o(Re()),l=Ro(),d=zo(),c=class bu{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsMapType(r,i){return(i||new bu).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsMapType(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new bu).__init(r.readInt32(r.position())+r.position(),r)}keyType(){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.readInt32(this.bb_pos+r):l.TensorDataType.UNDEFINED}valueType(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new d.TypeInfo).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startMapType(r){r.startObject(2)}static addKeyType(r,i){r.addFieldInt32(0,i,l.TensorDataType.UNDEFINED)}static addValueType(r,i){r.addFieldOffset(1,i,0)}static endMapType(r){return r.endObject()}};e.MapType=c}),s0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.SequenceType=void 0;var u=o(Re()),l=zo(),d=class gn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsSequenceType(s,r){return(r||new gn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsSequenceType(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new gn).__init(s.readInt32(s.position())+s.position(),s)}elemType(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.TypeInfo).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startSequenceType(s){s.startObject(1)}static addElemType(s,r){s.addFieldOffset(0,r,0)}static endSequenceType(s){return s.endObject()}static createSequenceType(s,r){return gn.startSequenceType(s),gn.addElemType(s,r),gn.endSequenceType(s)}};e.SequenceType=d}),a0=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.DimensionValueType=void 0;var t;(function(n){n[n.UNKNOWN=0]="UNKNOWN",n[n.VALUE=1]="VALUE",n[n.PARAM=2]="PARAM"})(t||(e.DimensionValueType=t={}))}),u0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DimensionValue=void 0;var u=o(Re()),l=a0(),d=class hr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDimensionValue(s,r){return(r||new hr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDimensionValue(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new hr).__init(s.readInt32(s.position())+s.position(),s)}dimType(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readInt8(this.bb_pos+s):l.DimensionValueType.UNKNOWN}dimValue(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readInt64(this.bb_pos+s):BigInt("0")}dimParam(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.__string(this.bb_pos+r,s):null}static startDimensionValue(s){s.startObject(3)}static addDimType(s,r){s.addFieldInt8(0,r,l.DimensionValueType.UNKNOWN)}static addDimValue(s,r){s.addFieldInt64(1,r,BigInt("0"))}static addDimParam(s,r){s.addFieldOffset(2,r,0)}static endDimensionValue(s){return s.endObject()}static createDimensionValue(s,r,i,a){return hr.startDimensionValue(s),hr.addDimType(s,r),hr.addDimValue(s,i),hr.addDimParam(s,a),hr.endDimensionValue(s)}};e.DimensionValue=d}),l0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Dimension=void 0;var u=o(Re()),l=u0(),d=class Mr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDimension(s,r){return(r||new Mr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDimension(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Mr).__init(s.readInt32(s.position())+s.position(),s)}value(s){let r=this.bb.__offset(this.bb_pos,4);return r?(s||new l.DimensionValue).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}denotation(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}static startDimension(s){s.startObject(2)}static addValue(s,r){s.addFieldOffset(0,r,0)}static addDenotation(s,r){s.addFieldOffset(1,r,0)}static endDimension(s){return s.endObject()}static createDimension(s,r,i){return Mr.startDimension(s),Mr.addValue(s,r),Mr.addDenotation(s,i),Mr.endDimension(s)}};e.Dimension=d}),d0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Shape=void 0;var u=o(Re()),l=l0(),d=class bn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsShape(s,r){return(r||new bn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsShape(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new bn).__init(s.readInt32(s.position())+s.position(),s)}dim(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.Dimension).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}dimLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startShape(s){s.startObject(1)}static addDim(s,r){s.addFieldOffset(0,r,0)}static createDimVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startDimVector(s,r){s.startVector(4,r,4)}static endShape(s){return s.endObject()}static createShape(s,r){return bn.startShape(s),bn.addDim(s,r),bn.endShape(s)}};e.Shape=d}),c0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.TensorTypeAndShape=void 0;var u=o(Re()),l=d0(),d=Ro(),c=class yu{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsTensorTypeAndShape(r,i){return(i||new yu).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsTensorTypeAndShape(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new yu).__init(r.readInt32(r.position())+r.position(),r)}elemType(){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.readInt32(this.bb_pos+r):d.TensorDataType.UNDEFINED}shape(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.Shape).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startTensorTypeAndShape(r){r.startObject(2)}static addElemType(r,i){r.addFieldInt32(0,i,d.TensorDataType.UNDEFINED)}static addShape(r,i){r.addFieldOffset(1,i,0)}static endTensorTypeAndShape(r){return r.endObject()}};e.TensorTypeAndShape=c}),p0=ie(e=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.TypeInfoValue=void 0,e.unionToTypeInfoValue=l,e.unionListToTypeInfoValue=d;var t=o0(),n=s0(),o=c0(),u;(function(c){c[c.NONE=0]="NONE",c[c.tensor_type=1]="tensor_type",c[c.sequence_type=2]="sequence_type",c[c.map_type=3]="map_type"})(u||(e.TypeInfoValue=u={}));function l(c,s){switch(u[c]){case"NONE":return null;case"tensor_type":return s(new o.TensorTypeAndShape);case"sequence_type":return s(new n.SequenceType);case"map_type":return s(new t.MapType);default:return null}}function d(c,s,r){switch(u[c]){case"NONE":return null;case"tensor_type":return s(r,new o.TensorTypeAndShape);case"sequence_type":return s(r,new n.SequenceType);case"map_type":return s(r,new t.MapType);default:return null}}}),zo=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.TypeInfo=void 0;var u=o(Re()),l=p0(),d=class fr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsTypeInfo(s,r){return(r||new fr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsTypeInfo(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new fr).__init(s.readInt32(s.position())+s.position(),s)}denotation(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}valueType(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint8(this.bb_pos+s):l.TypeInfoValue.NONE}value(s){let r=this.bb.__offset(this.bb_pos,8);return r?this.bb.__union(s,this.bb_pos+r):null}static startTypeInfo(s){s.startObject(3)}static addDenotation(s,r){s.addFieldOffset(0,r,0)}static addValueType(s,r){s.addFieldInt8(1,r,l.TypeInfoValue.NONE)}static addValue(s,r){s.addFieldOffset(2,r,0)}static endTypeInfo(s){return s.endObject()}static createTypeInfo(s,r,i,a){return fr.startTypeInfo(s),fr.addDenotation(s,r),fr.addValueType(s,i),fr.addValue(s,a),fr.endTypeInfo(s)}};e.TypeInfo=d}),h0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.ValueInfo=void 0;var u=o(Re()),l=zo(),d=class _u{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsValueInfo(s,r){return(r||new _u).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsValueInfo(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new _u).__init(s.readInt32(s.position())+s.position(),s)}name(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}docString(s){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__string(this.bb_pos+r,s):null}type(s){let r=this.bb.__offset(this.bb_pos,8);return r?(s||new l.TypeInfo).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startValueInfo(s){s.startObject(3)}static addName(s,r){s.addFieldOffset(0,r,0)}static addDocString(s,r){s.addFieldOffset(1,r,0)}static addType(s,r){s.addFieldOffset(2,r,0)}static endValueInfo(s){return s.endObject()}};e.ValueInfo=d}),gl=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(p,h,m,b){b===void 0&&(b=m);var $=Object.getOwnPropertyDescriptor(h,m);(!$||("get"in $?!h.__esModule:$.writable||$.configurable))&&($={enumerable:!0,get:function(){return h[m]}}),Object.defineProperty(p,b,$)}:function(p,h,m,b){b===void 0&&(b=m),p[b]=h[m]}),n=e&&e.__setModuleDefault||(Object.create?function(p,h){Object.defineProperty(p,"default",{enumerable:!0,value:h})}:function(p,h){p.default=h}),o=e&&e.__importStar||(function(){var p=function(h){return p=Object.getOwnPropertyNames||function(m){var b=[];for(var $ in m)Object.prototype.hasOwnProperty.call(m,$)&&(b[b.length]=$);return b},p(h)};return function(h){if(h&&h.__esModule)return h;var m={};if(h!=null)for(var b=p(h),$=0;$<b.length;$++)b[$]!=="default"&&t(m,h,b[$]);return n(m,h),m}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Graph=void 0;var u=o(Re()),l=Yy(),d=Qy(),c=n0(),s=i0(),r=No(),i=h0(),a=class wu{constructor(){this.bb=null,this.bb_pos=0}__init(h,m){return this.bb_pos=h,this.bb=m,this}static getRootAsGraph(h,m){return(m||new wu).__init(h.readInt32(h.position())+h.position(),h)}static getSizePrefixedRootAsGraph(h,m){return h.setPosition(h.position()+u.SIZE_PREFIX_LENGTH),(m||new wu).__init(h.readInt32(h.position())+h.position(),h)}initializers(h,m){let b=this.bb.__offset(this.bb_pos,4);return b?(m||new r.Tensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}initializersLength(){let h=this.bb.__offset(this.bb_pos,4);return h?this.bb.__vector_len(this.bb_pos+h):0}nodeArgs(h,m){let b=this.bb.__offset(this.bb_pos,6);return b?(m||new i.ValueInfo).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodeArgsLength(){let h=this.bb.__offset(this.bb_pos,6);return h?this.bb.__vector_len(this.bb_pos+h):0}nodes(h,m){let b=this.bb.__offset(this.bb_pos,8);return b?(m||new l.Node).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodesLength(){let h=this.bb.__offset(this.bb_pos,8);return h?this.bb.__vector_len(this.bb_pos+h):0}maxNodeIndex(){let h=this.bb.__offset(this.bb_pos,10);return h?this.bb.readUint32(this.bb_pos+h):0}nodeEdges(h,m){let b=this.bb.__offset(this.bb_pos,12);return b?(m||new d.NodeEdge).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}nodeEdgesLength(){let h=this.bb.__offset(this.bb_pos,12);return h?this.bb.__vector_len(this.bb_pos+h):0}inputs(h,m){let b=this.bb.__offset(this.bb_pos,14);return b?this.bb.__string(this.bb.__vector(this.bb_pos+b)+h*4,m):null}inputsLength(){let h=this.bb.__offset(this.bb_pos,14);return h?this.bb.__vector_len(this.bb_pos+h):0}outputs(h,m){let b=this.bb.__offset(this.bb_pos,16);return b?this.bb.__string(this.bb.__vector(this.bb_pos+b)+h*4,m):null}outputsLength(){let h=this.bb.__offset(this.bb_pos,16);return h?this.bb.__vector_len(this.bb_pos+h):0}sparseInitializers(h,m){let b=this.bb.__offset(this.bb_pos,18);return b?(m||new s.SparseTensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+b)+h*4),this.bb):null}sparseInitializersLength(){let h=this.bb.__offset(this.bb_pos,18);return h?this.bb.__vector_len(this.bb_pos+h):0}runtimeOptimizations(h){let m=this.bb.__offset(this.bb_pos,20);return m?(h||new c.RuntimeOptimizations).__init(this.bb.__indirect(this.bb_pos+m),this.bb):null}static startGraph(h){h.startObject(9)}static addInitializers(h,m){h.addFieldOffset(0,m,0)}static createInitializersVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startInitializersVector(h,m){h.startVector(4,m,4)}static addNodeArgs(h,m){h.addFieldOffset(1,m,0)}static createNodeArgsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodeArgsVector(h,m){h.startVector(4,m,4)}static addNodes(h,m){h.addFieldOffset(2,m,0)}static createNodesVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodesVector(h,m){h.startVector(4,m,4)}static addMaxNodeIndex(h,m){h.addFieldInt32(3,m,0)}static addNodeEdges(h,m){h.addFieldOffset(4,m,0)}static createNodeEdgesVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startNodeEdgesVector(h,m){h.startVector(4,m,4)}static addInputs(h,m){h.addFieldOffset(5,m,0)}static createInputsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startInputsVector(h,m){h.startVector(4,m,4)}static addOutputs(h,m){h.addFieldOffset(6,m,0)}static createOutputsVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startOutputsVector(h,m){h.startVector(4,m,4)}static addSparseInitializers(h,m){h.addFieldOffset(7,m,0)}static createSparseInitializersVector(h,m){h.startVector(4,m.length,4);for(let b=m.length-1;b>=0;b--)h.addOffset(m[b]);return h.endVector()}static startSparseInitializersVector(h,m){h.startVector(4,m,4)}static addRuntimeOptimizations(h,m){h.addFieldOffset(8,m,0)}static endGraph(h){return h.endObject()}};e.Graph=a}),f0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(r,i,a,p){p===void 0&&(p=a);var h=Object.getOwnPropertyDescriptor(i,a);(!h||("get"in h?!i.__esModule:h.writable||h.configurable))&&(h={enumerable:!0,get:function(){return i[a]}}),Object.defineProperty(r,p,h)}:function(r,i,a,p){p===void 0&&(p=a),r[p]=i[a]}),n=e&&e.__setModuleDefault||(Object.create?function(r,i){Object.defineProperty(r,"default",{enumerable:!0,value:i})}:function(r,i){r.default=i}),o=e&&e.__importStar||(function(){var r=function(i){return r=Object.getOwnPropertyNames||function(a){var p=[];for(var h in a)Object.prototype.hasOwnProperty.call(a,h)&&(p[p.length]=h);return p},r(i)};return function(i){if(i&&i.__esModule)return i;var a={};if(i!=null)for(var p=r(i),h=0;h<p.length;h++)p[h]!=="default"&&t(a,i,p[h]);return n(a,i),a}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Attribute=void 0;var u=o(Re()),l=Xy(),d=gl(),c=No(),s=class vu{constructor(){this.bb=null,this.bb_pos=0}__init(i,a){return this.bb_pos=i,this.bb=a,this}static getRootAsAttribute(i,a){return(a||new vu).__init(i.readInt32(i.position())+i.position(),i)}static getSizePrefixedRootAsAttribute(i,a){return i.setPosition(i.position()+u.SIZE_PREFIX_LENGTH),(a||new vu).__init(i.readInt32(i.position())+i.position(),i)}name(i){let a=this.bb.__offset(this.bb_pos,4);return a?this.bb.__string(this.bb_pos+a,i):null}docString(i){let a=this.bb.__offset(this.bb_pos,6);return a?this.bb.__string(this.bb_pos+a,i):null}type(){let i=this.bb.__offset(this.bb_pos,8);return i?this.bb.readInt32(this.bb_pos+i):l.AttributeType.UNDEFINED}f(){let i=this.bb.__offset(this.bb_pos,10);return i?this.bb.readFloat32(this.bb_pos+i):0}i(){let i=this.bb.__offset(this.bb_pos,12);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}s(i){let a=this.bb.__offset(this.bb_pos,14);return a?this.bb.__string(this.bb_pos+a,i):null}t(i){let a=this.bb.__offset(this.bb_pos,16);return a?(i||new c.Tensor).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}g(i){let a=this.bb.__offset(this.bb_pos,18);return a?(i||new d.Graph).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}floats(i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.readFloat32(this.bb.__vector(this.bb_pos+a)+i*4):0}floatsLength(){let i=this.bb.__offset(this.bb_pos,20);return i?this.bb.__vector_len(this.bb_pos+i):0}floatsArray(){let i=this.bb.__offset(this.bb_pos,20);return i?new Float32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+i),this.bb.__vector_len(this.bb_pos+i)):null}ints(i){let a=this.bb.__offset(this.bb_pos,22);return a?this.bb.readInt64(this.bb.__vector(this.bb_pos+a)+i*8):BigInt(0)}intsLength(){let i=this.bb.__offset(this.bb_pos,22);return i?this.bb.__vector_len(this.bb_pos+i):0}strings(i,a){let p=this.bb.__offset(this.bb_pos,24);return p?this.bb.__string(this.bb.__vector(this.bb_pos+p)+i*4,a):null}stringsLength(){let i=this.bb.__offset(this.bb_pos,24);return i?this.bb.__vector_len(this.bb_pos+i):0}tensors(i,a){let p=this.bb.__offset(this.bb_pos,26);return p?(a||new c.Tensor).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}tensorsLength(){let i=this.bb.__offset(this.bb_pos,26);return i?this.bb.__vector_len(this.bb_pos+i):0}graphs(i,a){let p=this.bb.__offset(this.bb_pos,28);return p?(a||new d.Graph).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}graphsLength(){let i=this.bb.__offset(this.bb_pos,28);return i?this.bb.__vector_len(this.bb_pos+i):0}static startAttribute(i){i.startObject(13)}static addName(i,a){i.addFieldOffset(0,a,0)}static addDocString(i,a){i.addFieldOffset(1,a,0)}static addType(i,a){i.addFieldInt32(2,a,l.AttributeType.UNDEFINED)}static addF(i,a){i.addFieldFloat32(3,a,0)}static addI(i,a){i.addFieldInt64(4,a,BigInt("0"))}static addS(i,a){i.addFieldOffset(5,a,0)}static addT(i,a){i.addFieldOffset(6,a,0)}static addG(i,a){i.addFieldOffset(7,a,0)}static addFloats(i,a){i.addFieldOffset(8,a,0)}static createFloatsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addFloat32(a[p]);return i.endVector()}static startFloatsVector(i,a){i.startVector(4,a,4)}static addInts(i,a){i.addFieldOffset(9,a,0)}static createIntsVector(i,a){i.startVector(8,a.length,8);for(let p=a.length-1;p>=0;p--)i.addInt64(a[p]);return i.endVector()}static startIntsVector(i,a){i.startVector(8,a,8)}static addStrings(i,a){i.addFieldOffset(10,a,0)}static createStringsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startStringsVector(i,a){i.startVector(4,a,4)}static addTensors(i,a){i.addFieldOffset(11,a,0)}static createTensorsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startTensorsVector(i,a){i.startVector(4,a,4)}static addGraphs(i,a){i.addFieldOffset(12,a,0)}static createGraphsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startGraphsVector(i,a){i.startVector(4,a,4)}static endAttribute(i){return i.endObject()}};e.Attribute=s}),m0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedKernelCreateInfos=void 0;var u=o(Re()),l=class Br{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsDeprecatedKernelCreateInfos(c,s){return(s||new Br).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsDeprecatedKernelCreateInfos(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Br).__init(c.readInt32(c.position())+c.position(),c)}nodeIndices(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.readUint32(this.bb.__vector(this.bb_pos+s)+c*4):0}nodeIndicesLength(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.__vector_len(this.bb_pos+c):0}nodeIndicesArray(){let c=this.bb.__offset(this.bb_pos,4);return c?new Uint32Array(this.bb.bytes().buffer,this.bb.bytes().byteOffset+this.bb.__vector(this.bb_pos+c),this.bb.__vector_len(this.bb_pos+c)):null}kernelDefHashes(c){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.readUint64(this.bb.__vector(this.bb_pos+s)+c*8):BigInt(0)}kernelDefHashesLength(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.__vector_len(this.bb_pos+c):0}static startDeprecatedKernelCreateInfos(c){c.startObject(2)}static addNodeIndices(c,s){c.addFieldOffset(0,s,0)}static createNodeIndicesVector(c,s){c.startVector(4,s.length,4);for(let r=s.length-1;r>=0;r--)c.addInt32(s[r]);return c.endVector()}static startNodeIndicesVector(c,s){c.startVector(4,s,4)}static addKernelDefHashes(c,s){c.addFieldOffset(1,s,0)}static createKernelDefHashesVector(c,s){c.startVector(8,s.length,8);for(let r=s.length-1;r>=0;r--)c.addInt64(s[r]);return c.endVector()}static startKernelDefHashesVector(c,s){c.startVector(8,s,8)}static endDeprecatedKernelCreateInfos(c){return c.endObject()}static createDeprecatedKernelCreateInfos(c,s,r){return Br.startDeprecatedKernelCreateInfos(c),Br.addNodeIndices(c,s),Br.addKernelDefHashes(c,r),Br.endDeprecatedKernelCreateInfos(c)}};e.DeprecatedKernelCreateInfos=l}),yI=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedNodeIndexAndKernelDefHash=void 0;var u=o(Re()),l=class Fr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsDeprecatedNodeIndexAndKernelDefHash(c,s){return(s||new Fr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsDeprecatedNodeIndexAndKernelDefHash(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Fr).__init(c.readInt32(c.position())+c.position(),c)}nodeIndex(){let c=this.bb.__offset(this.bb_pos,4);return c?this.bb.readUint32(this.bb_pos+c):0}kernelDefHash(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readUint64(this.bb_pos+c):BigInt("0")}static startDeprecatedNodeIndexAndKernelDefHash(c){c.startObject(2)}static addNodeIndex(c,s){c.addFieldInt32(0,s,0)}static addKernelDefHash(c,s){c.addFieldInt64(1,s,BigInt("0"))}static endDeprecatedNodeIndexAndKernelDefHash(c){return c.endObject()}static createDeprecatedNodeIndexAndKernelDefHash(c,s,r){return Fr.startDeprecatedNodeIndexAndKernelDefHash(c),Fr.addNodeIndex(c,s),Fr.addKernelDefHash(c,r),Fr.endDeprecatedNodeIndexAndKernelDefHash(c)}};e.DeprecatedNodeIndexAndKernelDefHash=l}),g0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedSubGraphSessionState=void 0;var u=o(Re()),l=b0(),d=class xu{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsDeprecatedSubGraphSessionState(s,r){return(r||new xu).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsDeprecatedSubGraphSessionState(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new xu).__init(s.readInt32(s.position())+s.position(),s)}graphId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}sessionState(s){let r=this.bb.__offset(this.bb_pos,6);return r?(s||new l.DeprecatedSessionState).__init(this.bb.__indirect(this.bb_pos+r),this.bb):null}static startDeprecatedSubGraphSessionState(s){s.startObject(2)}static addGraphId(s,r){s.addFieldOffset(0,r,0)}static addSessionState(s,r){s.addFieldOffset(1,r,0)}static endDeprecatedSubGraphSessionState(s){let r=s.endObject();return s.requiredField(r,4),r}};e.DeprecatedSubGraphSessionState=d}),b0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.DeprecatedSessionState=void 0;var u=o(Re()),l=m0(),d=g0(),c=class Lr{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsDeprecatedSessionState(r,i){return(i||new Lr).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsDeprecatedSessionState(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new Lr).__init(r.readInt32(r.position())+r.position(),r)}kernels(r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.DeprecatedKernelCreateInfos).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}subGraphSessionStates(r,i){let a=this.bb.__offset(this.bb_pos,6);return a?(i||new d.DeprecatedSubGraphSessionState).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+a)+r*4),this.bb):null}subGraphSessionStatesLength(){let r=this.bb.__offset(this.bb_pos,6);return r?this.bb.__vector_len(this.bb_pos+r):0}static startDeprecatedSessionState(r){r.startObject(2)}static addKernels(r,i){r.addFieldOffset(0,i,0)}static addSubGraphSessionStates(r,i){r.addFieldOffset(1,i,0)}static createSubGraphSessionStatesVector(r,i){r.startVector(4,i.length,4);for(let a=i.length-1;a>=0;a--)r.addOffset(i[a]);return r.endVector()}static startSubGraphSessionStatesVector(r,i){r.startVector(4,i,4)}static endDeprecatedSessionState(r){return r.endObject()}static createDeprecatedSessionState(r,i,a){return Lr.startDeprecatedSessionState(r),Lr.addKernels(r,i),Lr.addSubGraphSessionStates(r,a),Lr.endDeprecatedSessionState(r)}};e.DeprecatedSessionState=c}),y0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.KernelTypeStrArgsEntry=void 0;var u=o(Re()),l=Ky(),d=class jr{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsKernelTypeStrArgsEntry(s,r){return(r||new jr).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsKernelTypeStrArgsEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new jr).__init(s.readInt32(s.position())+s.position(),s)}kernelTypeStr(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}args(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.ArgTypeAndIndex).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}argsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startKernelTypeStrArgsEntry(s){s.startObject(2)}static addKernelTypeStr(s,r){s.addFieldOffset(0,r,0)}static addArgs(s,r){s.addFieldOffset(1,r,0)}static createArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startArgsVector(s,r){s.startVector(4,r,4)}static endKernelTypeStrArgsEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createKernelTypeStrArgsEntry(s,r,i){return jr.startKernelTypeStrArgsEntry(s),jr.addKernelTypeStr(s,r),jr.addArgs(s,i),jr.endKernelTypeStrArgsEntry(s)}};e.KernelTypeStrArgsEntry=d}),_0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.OpIdKernelTypeStrArgsEntry=void 0;var u=o(Re()),l=y0(),d=class Ur{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsOpIdKernelTypeStrArgsEntry(s,r){return(r||new Ur).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsOpIdKernelTypeStrArgsEntry(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new Ur).__init(s.readInt32(s.position())+s.position(),s)}opId(s){let r=this.bb.__offset(this.bb_pos,4);return r?this.bb.__string(this.bb_pos+r,s):null}kernelTypeStrArgs(s,r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new l.KernelTypeStrArgsEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}kernelTypeStrArgsLength(){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__vector_len(this.bb_pos+s):0}static startOpIdKernelTypeStrArgsEntry(s){s.startObject(2)}static addOpId(s,r){s.addFieldOffset(0,r,0)}static addKernelTypeStrArgs(s,r){s.addFieldOffset(1,r,0)}static createKernelTypeStrArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startKernelTypeStrArgsVector(s,r){s.startVector(4,r,4)}static endOpIdKernelTypeStrArgsEntry(s){let r=s.endObject();return s.requiredField(r,4),r}static createOpIdKernelTypeStrArgsEntry(s,r,i){return Ur.startOpIdKernelTypeStrArgsEntry(s),Ur.addOpId(s,r),Ur.addKernelTypeStrArgs(s,i),Ur.endOpIdKernelTypeStrArgsEntry(s)}};e.OpIdKernelTypeStrArgsEntry=d}),w0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(c,s,r,i){i===void 0&&(i=r);var a=Object.getOwnPropertyDescriptor(s,r);(!a||("get"in a?!s.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return s[r]}}),Object.defineProperty(c,i,a)}:function(c,s,r,i){i===void 0&&(i=r),c[i]=s[r]}),n=e&&e.__setModuleDefault||(Object.create?function(c,s){Object.defineProperty(c,"default",{enumerable:!0,value:s})}:function(c,s){c.default=s}),o=e&&e.__importStar||(function(){var c=function(s){return c=Object.getOwnPropertyNames||function(r){var i=[];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(i[i.length]=a);return i},c(s)};return function(s){if(s&&s.__esModule)return s;var r={};if(s!=null)for(var i=c(s),a=0;a<i.length;a++)i[a]!=="default"&&t(r,s,i[a]);return n(r,s),r}})();Object.defineProperty(e,"__esModule",{value:!0}),e.KernelTypeStrResolver=void 0;var u=o(Re()),l=_0(),d=class yn{constructor(){this.bb=null,this.bb_pos=0}__init(s,r){return this.bb_pos=s,this.bb=r,this}static getRootAsKernelTypeStrResolver(s,r){return(r||new yn).__init(s.readInt32(s.position())+s.position(),s)}static getSizePrefixedRootAsKernelTypeStrResolver(s,r){return s.setPosition(s.position()+u.SIZE_PREFIX_LENGTH),(r||new yn).__init(s.readInt32(s.position())+s.position(),s)}opKernelTypeStrArgs(s,r){let i=this.bb.__offset(this.bb_pos,4);return i?(r||new l.OpIdKernelTypeStrArgsEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+i)+s*4),this.bb):null}opKernelTypeStrArgsLength(){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__vector_len(this.bb_pos+s):0}static startKernelTypeStrResolver(s){s.startObject(1)}static addOpKernelTypeStrArgs(s,r){s.addFieldOffset(0,r,0)}static createOpKernelTypeStrArgsVector(s,r){s.startVector(4,r.length,4);for(let i=r.length-1;i>=0;i--)s.addOffset(r[i]);return s.endVector()}static startOpKernelTypeStrArgsVector(s,r){s.startVector(4,r,4)}static endKernelTypeStrResolver(s){return s.endObject()}static createKernelTypeStrResolver(s,r){return yn.startKernelTypeStrResolver(s),yn.addOpKernelTypeStrArgs(s,r),yn.endKernelTypeStrResolver(s)}};e.KernelTypeStrResolver=d}),v0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.OperatorSetId=void 0;var u=o(Re()),l=class Vr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsOperatorSetId(c,s){return(s||new Vr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsOperatorSetId(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Vr).__init(c.readInt32(c.position())+c.position(),c)}domain(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__string(this.bb_pos+s,c):null}version(){let c=this.bb.__offset(this.bb_pos,6);return c?this.bb.readInt64(this.bb_pos+c):BigInt("0")}static startOperatorSetId(c){c.startObject(2)}static addDomain(c,s){c.addFieldOffset(0,s,0)}static addVersion(c,s){c.addFieldInt64(1,s,BigInt("0"))}static endOperatorSetId(c){return c.endObject()}static createOperatorSetId(c,s,r){return Vr.startOperatorSetId(c),Vr.addDomain(c,s),Vr.addVersion(c,r),Vr.endOperatorSetId(c)}};e.OperatorSetId=l}),x0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(d,c,s,r){r===void 0&&(r=s);var i=Object.getOwnPropertyDescriptor(c,s);(!i||("get"in i?!c.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return c[s]}}),Object.defineProperty(d,r,i)}:function(d,c,s,r){r===void 0&&(r=s),d[r]=c[s]}),n=e&&e.__setModuleDefault||(Object.create?function(d,c){Object.defineProperty(d,"default",{enumerable:!0,value:c})}:function(d,c){d.default=c}),o=e&&e.__importStar||(function(){var d=function(c){return d=Object.getOwnPropertyNames||function(s){var r=[];for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&(r[r.length]=i);return r},d(c)};return function(c){if(c&&c.__esModule)return c;var s={};if(c!=null)for(var r=d(c),i=0;i<r.length;i++)r[i]!=="default"&&t(s,c,r[i]);return n(s,c),s}})();Object.defineProperty(e,"__esModule",{value:!0}),e.StringStringEntry=void 0;var u=o(Re()),l=class Gr{constructor(){this.bb=null,this.bb_pos=0}__init(c,s){return this.bb_pos=c,this.bb=s,this}static getRootAsStringStringEntry(c,s){return(s||new Gr).__init(c.readInt32(c.position())+c.position(),c)}static getSizePrefixedRootAsStringStringEntry(c,s){return c.setPosition(c.position()+u.SIZE_PREFIX_LENGTH),(s||new Gr).__init(c.readInt32(c.position())+c.position(),c)}key(c){let s=this.bb.__offset(this.bb_pos,4);return s?this.bb.__string(this.bb_pos+s,c):null}value(c){let s=this.bb.__offset(this.bb_pos,6);return s?this.bb.__string(this.bb_pos+s,c):null}static startStringStringEntry(c){c.startObject(2)}static addKey(c,s){c.addFieldOffset(0,s,0)}static addValue(c,s){c.addFieldOffset(1,s,0)}static endStringStringEntry(c){return c.endObject()}static createStringStringEntry(c,s,r){return Gr.startStringStringEntry(c),Gr.addKey(c,s),Gr.addValue(c,r),Gr.endStringStringEntry(c)}};e.StringStringEntry=l}),$0=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(r,i,a,p){p===void 0&&(p=a);var h=Object.getOwnPropertyDescriptor(i,a);(!h||("get"in h?!i.__esModule:h.writable||h.configurable))&&(h={enumerable:!0,get:function(){return i[a]}}),Object.defineProperty(r,p,h)}:function(r,i,a,p){p===void 0&&(p=a),r[p]=i[a]}),n=e&&e.__setModuleDefault||(Object.create?function(r,i){Object.defineProperty(r,"default",{enumerable:!0,value:i})}:function(r,i){r.default=i}),o=e&&e.__importStar||(function(){var r=function(i){return r=Object.getOwnPropertyNames||function(a){var p=[];for(var h in a)Object.prototype.hasOwnProperty.call(a,h)&&(p[p.length]=h);return p},r(i)};return function(i){if(i&&i.__esModule)return i;var a={};if(i!=null)for(var p=r(i),h=0;h<p.length;h++)p[h]!=="default"&&t(a,i,p[h]);return n(a,i),a}})();Object.defineProperty(e,"__esModule",{value:!0}),e.Model=void 0;var u=o(Re()),l=gl(),d=v0(),c=x0(),s=class $u{constructor(){this.bb=null,this.bb_pos=0}__init(i,a){return this.bb_pos=i,this.bb=a,this}static getRootAsModel(i,a){return(a||new $u).__init(i.readInt32(i.position())+i.position(),i)}static getSizePrefixedRootAsModel(i,a){return i.setPosition(i.position()+u.SIZE_PREFIX_LENGTH),(a||new $u).__init(i.readInt32(i.position())+i.position(),i)}irVersion(){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}opsetImport(i,a){let p=this.bb.__offset(this.bb_pos,6);return p?(a||new d.OperatorSetId).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}opsetImportLength(){let i=this.bb.__offset(this.bb_pos,6);return i?this.bb.__vector_len(this.bb_pos+i):0}producerName(i){let a=this.bb.__offset(this.bb_pos,8);return a?this.bb.__string(this.bb_pos+a,i):null}producerVersion(i){let a=this.bb.__offset(this.bb_pos,10);return a?this.bb.__string(this.bb_pos+a,i):null}domain(i){let a=this.bb.__offset(this.bb_pos,12);return a?this.bb.__string(this.bb_pos+a,i):null}modelVersion(){let i=this.bb.__offset(this.bb_pos,14);return i?this.bb.readInt64(this.bb_pos+i):BigInt("0")}docString(i){let a=this.bb.__offset(this.bb_pos,16);return a?this.bb.__string(this.bb_pos+a,i):null}graph(i){let a=this.bb.__offset(this.bb_pos,18);return a?(i||new l.Graph).__init(this.bb.__indirect(this.bb_pos+a),this.bb):null}graphDocString(i){let a=this.bb.__offset(this.bb_pos,20);return a?this.bb.__string(this.bb_pos+a,i):null}metadataProps(i,a){let p=this.bb.__offset(this.bb_pos,22);return p?(a||new c.StringStringEntry).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos+p)+i*4),this.bb):null}metadataPropsLength(){let i=this.bb.__offset(this.bb_pos,22);return i?this.bb.__vector_len(this.bb_pos+i):0}static startModel(i){i.startObject(10)}static addIrVersion(i,a){i.addFieldInt64(0,a,BigInt("0"))}static addOpsetImport(i,a){i.addFieldOffset(1,a,0)}static createOpsetImportVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startOpsetImportVector(i,a){i.startVector(4,a,4)}static addProducerName(i,a){i.addFieldOffset(2,a,0)}static addProducerVersion(i,a){i.addFieldOffset(3,a,0)}static addDomain(i,a){i.addFieldOffset(4,a,0)}static addModelVersion(i,a){i.addFieldInt64(5,a,BigInt("0"))}static addDocString(i,a){i.addFieldOffset(6,a,0)}static addGraph(i,a){i.addFieldOffset(7,a,0)}static addGraphDocString(i,a){i.addFieldOffset(8,a,0)}static addMetadataProps(i,a){i.addFieldOffset(9,a,0)}static createMetadataPropsVector(i,a){i.startVector(4,a.length,4);for(let p=a.length-1;p>=0;p--)i.addOffset(a[p]);return i.endVector()}static startMetadataPropsVector(i,a){i.startVector(4,a,4)}static endModel(i){return i.endObject()}};e.Model=s}),_I=ie(e=>{"use strict";var t=e&&e.__createBinding||(Object.create?function(s,r,i,a){a===void 0&&(a=i);var p=Object.getOwnPropertyDescriptor(r,i);(!p||("get"in p?!r.__esModule:p.writable||p.configurable))&&(p={enumerable:!0,get:function(){return r[i]}}),Object.defineProperty(s,a,p)}:function(s,r,i,a){a===void 0&&(a=i),s[a]=r[i]}),n=e&&e.__setModuleDefault||(Object.create?function(s,r){Object.defineProperty(s,"default",{enumerable:!0,value:r})}:function(s,r){s.default=r}),o=e&&e.__importStar||(function(){var s=function(r){return s=Object.getOwnPropertyNames||function(i){var a=[];for(var p in i)Object.prototype.hasOwnProperty.call(i,p)&&(a[a.length]=p);return a},s(r)};return function(r){if(r&&r.__esModule)return r;var i={};if(r!=null)for(var a=s(r),p=0;p<a.length;p++)a[p]!=="default"&&t(i,r,a[p]);return n(i,r),i}})();Object.defineProperty(e,"__esModule",{value:!0}),e.InferenceSession=void 0;var u=o(Re()),l=w0(),d=$0(),c=class Tu{constructor(){this.bb=null,this.bb_pos=0}__init(r,i){return this.bb_pos=r,this.bb=i,this}static getRootAsInferenceSession(r,i){return(i||new Tu).__init(r.readInt32(r.position())+r.position(),r)}static getSizePrefixedRootAsInferenceSession(r,i){return r.setPosition(r.position()+u.SIZE_PREFIX_LENGTH),(i||new Tu).__init(r.readInt32(r.position())+r.position(),r)}static bufferHasIdentifier(r){return r.__has_identifier("ORTM")}ortVersion(r){let i=this.bb.__offset(this.bb_pos,4);return i?this.bb.__string(this.bb_pos+i,r):null}model(r){let i=this.bb.__offset(this.bb_pos,6);return i?(r||new d.Model).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}kernelTypeStrResolver(r){let i=this.bb.__offset(this.bb_pos,10);return i?(r||new l.KernelTypeStrResolver).__init(this.bb.__indirect(this.bb_pos+i),this.bb):null}static startInferenceSession(r){r.startObject(4)}static addOrtVersion(r,i){r.addFieldOffset(0,i,0)}static addModel(r,i){r.addFieldOffset(1,i,0)}static addKernelTypeStrResolver(r,i){r.addFieldOffset(3,i,0)}static endInferenceSession(r){return r.endObject()}static finishInferenceSessionBuffer(r,i){r.finish(i,"ORTM")}static finishSizePrefixedInferenceSessionBuffer(r,i){r.finish(i,"ORTM",!0)}};e.InferenceSession=c}),wI,vI,Su,Dt,xI,$I,TI,SI,II,OI,EI,AI,T0,S0,PI,kI,CI,DI,I0,RI,NI,zI,MI,BI,FI,LI,jI,UI,VI,GI,qI,HI,go,O0,WI,E0,KI,XI=D(()=>{"use strict";wI=ge(Uy()),vI=ge(Ky()),Su=ge(f0()),Dt=ge(Xy()),xI=ge(m0()),$I=ge(yI()),TI=ge(b0()),SI=ge(g0()),II=ge(l0()),OI=ge(u0()),EI=ge(a0()),AI=ge(Jy()),T0=ge(gl()),S0=ge(_I()),PI=ge(y0()),kI=ge(w0()),CI=ge(o0()),DI=ge($0()),I0=ge(Yy()),RI=ge(Qy()),NI=ge(Zy()),zI=ge(e0()),MI=ge(_0()),BI=ge(v0()),FI=ge(t0()),LI=ge(r0()),jI=ge(n0()),UI=ge(s0()),VI=ge(d0()),GI=ge(i0()),qI=ge(x0()),HI=ge(No()),go=ge(Ro()),O0=ge(c0()),WI=ge(zo()),E0=ge(p0()),KI=ge(h0())}),Mo=D(()=>{"use strict";XI()}),ZI=ie((e,t)=>{"use strict";t.exports=n;function n(o,u){for(var l=new Array(arguments.length-1),d=0,c=2,s=!0;c<arguments.length;)l[d++]=arguments[c++];return new Promise(function(r,i){l[d]=function(a){if(s)if(s=!1,a)i(a);else{for(var p=new Array(arguments.length-1),h=0;h<p.length;)p[h++]=arguments[h];r.apply(null,p)}};try{o.apply(u||null,l)}catch(a){s&&(s=!1,i(a))}})}}),YI=ie(e=>{"use strict";var t=e;t.length=function(d){var c=d.length;if(!c)return 0;for(var s=0;--c%4>1&&d.charAt(c)==="=";)++s;return Math.ceil(d.length*3)/4-s};var n=new Array(64),o=new Array(123);for(u=0;u<64;)o[n[u]=u<26?u+65:u<52?u+71:u<62?u-4:u-59|43]=u++;var u;t.encode=function(d,c,s){for(var r=null,i=[],a=0,p=0,h;c<s;){var m=d[c++];switch(p){case 0:i[a++]=n[m>>2],h=(m&3)<<4,p=1;break;case 1:i[a++]=n[h|m>>4],h=(m&15)<<2,p=2;break;case 2:i[a++]=n[h|m>>6],i[a++]=n[m&63],p=0;break}a>8191&&((r||(r=[])).push(String.fromCharCode.apply(String,i)),a=0)}return p&&(i[a++]=n[h],i[a++]=61,p===1&&(i[a++]=61)),r?(a&&r.push(String.fromCharCode.apply(String,i.slice(0,a))),r.join("")):String.fromCharCode.apply(String,i.slice(0,a))};var l="invalid encoding";t.decode=function(d,c,s){for(var r=s,i=0,a,p=0;p<d.length;){var h=d.charCodeAt(p++);if(h===61&&i>1)break;if((h=o[h])===void 0)throw Error(l);switch(i){case 0:a=h,i=1;break;case 1:c[s++]=a<<2|(h&48)>>4,a=h,i=2;break;case 2:c[s++]=(a&15)<<4|(h&60)>>2,a=h,i=3;break;case 3:c[s++]=(a&3)<<6|h,i=0;break}}if(i===1)throw Error(l);return s-r},t.test=function(d){return/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(d)}}),JI=ie((e,t)=>{"use strict";t.exports=n;function n(){this._listeners=Object.create(null)}n.prototype.on=function(o,u,l){return(this._listeners[o]||(this._listeners[o]=[])).push({fn:u,ctx:l||this}),this},n.prototype.off=function(o,u){if(o===void 0)this._listeners=Object.create(null);else if(u===void 0)this._listeners[o]=[];else{var l=this._listeners[o];if(!l)return this;for(var d=0;d<l.length;)l[d].fn===u?l.splice(d,1):++d}return this},n.prototype.emit=function(o){var u=this._listeners[o];if(u){for(var l=[],d=1;d<arguments.length;)l.push(arguments[d++]);for(d=0;d<u.length;)u[d].fn.apply(u[d++].ctx,l)}return this}}),QI=ie((e,t)=>{"use strict";t.exports=n(n);function n(c){return typeof Float32Array<"u"?(function(){var s=new Float32Array([-0]),r=new Uint8Array(s.buffer),i=r[3]===128;function a(b,$,v){s[0]=b,$[v]=r[0],$[v+1]=r[1],$[v+2]=r[2],$[v+3]=r[3]}function p(b,$,v){s[0]=b,$[v]=r[3],$[v+1]=r[2],$[v+2]=r[1],$[v+3]=r[0]}c.writeFloatLE=i?a:p,c.writeFloatBE=i?p:a;function h(b,$){return r[0]=b[$],r[1]=b[$+1],r[2]=b[$+2],r[3]=b[$+3],s[0]}function m(b,$){return r[3]=b[$],r[2]=b[$+1],r[1]=b[$+2],r[0]=b[$+3],s[0]}c.readFloatLE=i?h:m,c.readFloatBE=i?m:h})():(function(){function s(i,a,p,h){var m=a<0?1:0;if(m&&(a=-a),a===0)i(1/a>0?0:2147483648,p,h);else if(isNaN(a))i(2143289344,p,h);else if(a>34028234663852886e22)i((m<<31|2139095040)>>>0,p,h);else if(a<11754943508222875e-54)i((m<<31|Math.round(a/1401298464324817e-60))>>>0,p,h);else{var b=Math.floor(Math.log(a)/Math.LN2),$=Math.round(a*Math.pow(2,-b)*8388608)&8388607;i((m<<31|b+127<<23|$)>>>0,p,h)}}c.writeFloatLE=s.bind(null,o),c.writeFloatBE=s.bind(null,u);function r(i,a,p){var h=i(a,p),m=(h>>31)*2+1,b=h>>>23&255,$=h&8388607;return b===255?$?NaN:m*(1/0):b===0?m*1401298464324817e-60*$:m*Math.pow(2,b-150)*($+8388608)}c.readFloatLE=r.bind(null,l),c.readFloatBE=r.bind(null,d)})(),typeof Float64Array<"u"?(function(){var s=new Float64Array([-0]),r=new Uint8Array(s.buffer),i=r[7]===128;function a(b,$,v){s[0]=b,$[v]=r[0],$[v+1]=r[1],$[v+2]=r[2],$[v+3]=r[3],$[v+4]=r[4],$[v+5]=r[5],$[v+6]=r[6],$[v+7]=r[7]}function p(b,$,v){s[0]=b,$[v]=r[7],$[v+1]=r[6],$[v+2]=r[5],$[v+3]=r[4],$[v+4]=r[3],$[v+5]=r[2],$[v+6]=r[1],$[v+7]=r[0]}c.writeDoubleLE=i?a:p,c.writeDoubleBE=i?p:a;function h(b,$){return r[0]=b[$],r[1]=b[$+1],r[2]=b[$+2],r[3]=b[$+3],r[4]=b[$+4],r[5]=b[$+5],r[6]=b[$+6],r[7]=b[$+7],s[0]}function m(b,$){return r[7]=b[$],r[6]=b[$+1],r[5]=b[$+2],r[4]=b[$+3],r[3]=b[$+4],r[2]=b[$+5],r[1]=b[$+6],r[0]=b[$+7],s[0]}c.readDoubleLE=i?h:m,c.readDoubleBE=i?m:h})():(function(){function s(i,a,p,h,m,b){var $=h<0?1:0;if($&&(h=-h),h===0)i(0,m,b+a),i(1/h>0?0:2147483648,m,b+p);else if(isNaN(h))i(0,m,b+a),i(2146959360,m,b+p);else if(h>17976931348623157e292)i(0,m,b+a),i(($<<31|2146435072)>>>0,m,b+p);else{var v;if(h<22250738585072014e-324)v=h/5e-324,i(v>>>0,m,b+a),i(($<<31|v/4294967296)>>>0,m,b+p);else{var y=Math.floor(Math.log(h)/Math.LN2);y===1024&&(y=1023),v=h*Math.pow(2,-y),i(v*4503599627370496>>>0,m,b+a),i(($<<31|y+1023<<20|v*1048576&1048575)>>>0,m,b+p)}}}c.writeDoubleLE=s.bind(null,o,0,4),c.writeDoubleBE=s.bind(null,u,4,0);function r(i,a,p,h,m){var b=i(h,m+a),$=i(h,m+p),v=($>>31)*2+1,y=$>>>20&2047,T=4294967296*($&1048575)+b;return y===2047?T?NaN:v*(1/0):y===0?v*5e-324*T:v*Math.pow(2,y-1075)*(T+4503599627370496)}c.readDoubleLE=r.bind(null,l,0,4),c.readDoubleBE=r.bind(null,d,4,0)})(),c}function o(c,s,r){s[r]=c&255,s[r+1]=c>>>8&255,s[r+2]=c>>>16&255,s[r+3]=c>>>24}function u(c,s,r){s[r]=c>>>24,s[r+1]=c>>>16&255,s[r+2]=c>>>8&255,s[r+3]=c&255}function l(c,s){return(c[s]|c[s+1]<<8|c[s+2]<<16|c[s+3]<<24)>>>0}function d(c,s){return(c[s]<<24|c[s+1]<<16|c[s+2]<<8|c[s+3])>>>0}}),e3=ie((e,t)=>{"use strict";t.exports=n;function n(o){try{if(typeof au!="function")return null;var u=au(o);return u&&(u.length||Object.keys(u).length)?u:null}catch{return null}}}),t3=ie(e=>{"use strict";var t=e,n="\uFFFD";t.length=function(o){for(var u=0,l=0,d=0;d<o.length;++d)l=o.charCodeAt(d),l<128?u+=1:l<2048?u+=2:(l&64512)===55296&&(o.charCodeAt(d+1)&64512)===56320?(++d,u+=4):u+=3;return u},t.read=function(o,u,l){if(l-u<1)return"";for(var d="",c=u;c<l;){var s=o[c++];if(s<=127)d+=String.fromCharCode(s);else if(s>=192&&s<224){var r=(s&31)<<6|o[c++]&63;d+=r>=128?String.fromCharCode(r):n}else if(s>=224&&s<240){var i=(s&15)<<12|(o[c++]&63)<<6|o[c++]&63;d+=i>=2048?String.fromCharCode(i):n}else if(s>=240){var a=(s&7)<<18|(o[c++]&63)<<12|(o[c++]&63)<<6|o[c++]&63;a<65536||a>1114111?d+=n:(a-=65536,d+=String.fromCharCode(55296+(a>>10)),d+=String.fromCharCode(56320+(a&1023)))}}return d},t.write=function(o,u,l){for(var d=l,c,s,r=0;r<o.length;++r)c=o.charCodeAt(r),c<128?u[l++]=c:c<2048?(u[l++]=c>>6|192,u[l++]=c&63|128):(c&64512)===55296&&((s=o.charCodeAt(r+1))&64512)===56320?(c=65536+((c&1023)<<10)+(s&1023),++r,u[l++]=c>>18|240,u[l++]=c>>12&63|128,u[l++]=c>>6&63|128,u[l++]=c&63|128):(u[l++]=c>>12|224,u[l++]=c>>6&63|128,u[l++]=c&63|128);return l-d}}),r3=ie((e,t)=>{"use strict";t.exports=n;function n(o,u,l){var d=l||8192,c=d>>>1,s=null,r=d;return function(i){if(i<1||i>c)return o(i);r+i>d&&(s=o(d),r=0);var a=u.call(s,r,r+=i);return r&7&&(r=(r|7)+1),a}}}),n3=ie((e,t)=>{"use strict";t.exports=o;var n=sn();function o(c,s){this.lo=c>>>0,this.hi=s>>>0}var u=o.zero=new o(0,0);u.toNumber=function(){return 0},u.zzEncode=u.zzDecode=function(){return this},u.length=function(){return 1};var l=o.zeroHash="\0\0\0\0\0\0\0\0";o.fromNumber=function(c){if(c===0)return u;var s=c<0;s&&(c=-c);var r=c>>>0,i=(c-r)/4294967296>>>0;return s&&(i=~i>>>0,r=~r>>>0,++r>4294967295&&(r=0,++i>4294967295&&(i=0))),new o(r,i)},o.from=function(c){if(typeof c=="number")return o.fromNumber(c);if(n.isString(c))if(n.Long)c=n.Long.fromString(c);else return o.fromNumber(parseInt(c,10));return c.low||c.high?new o(c.low>>>0,c.high>>>0):u},o.prototype.toNumber=function(c){if(!c&&this.hi>>>31){var s=~this.lo+1>>>0,r=~this.hi>>>0;return s||(r=r+1>>>0),-(s+r*4294967296)}return this.lo+this.hi*4294967296},o.prototype.toLong=function(c){return n.Long?new n.Long(this.lo|0,this.hi|0,!!c):{low:this.lo|0,high:this.hi|0,unsigned:!!c}};var d=String.prototype.charCodeAt;o.fromHash=function(c){return c===l?u:new o((d.call(c,0)|d.call(c,1)<<8|d.call(c,2)<<16|d.call(c,3)<<24)>>>0,(d.call(c,4)|d.call(c,5)<<8|d.call(c,6)<<16|d.call(c,7)<<24)>>>0)},o.prototype.toHash=function(){return String.fromCharCode(this.lo&255,this.lo>>>8&255,this.lo>>>16&255,this.lo>>>24,this.hi&255,this.hi>>>8&255,this.hi>>>16&255,this.hi>>>24)},o.prototype.zzEncode=function(){var c=this.hi>>31;return this.hi=((this.hi<<1|this.lo>>>31)^c)>>>0,this.lo=(this.lo<<1^c)>>>0,this},o.prototype.zzDecode=function(){var c=-(this.lo&1);return this.lo=((this.lo>>>1|this.hi<<31)^c)>>>0,this.hi=(this.hi>>>1^c)>>>0,this},o.prototype.length=function(){var c=this.lo,s=(this.lo>>>28|this.hi<<4)>>>0,r=this.hi>>>24;return r===0?s===0?c<16384?c<128?1:2:c<2097152?3:4:s<16384?s<128?5:6:s<2097152?7:8:r<128?9:10}}),i3=ie((e,t)=>{(function(n,o){function u(l){return l.default||l}typeof define=="function"&&define.amd?define([],function(){var l={};return o(l),u(l)}):typeof e=="object"?(o(e),typeof t=="object"&&(t.exports=u(e))):(function(){var l={};o(l),n.Long=u(l)})()})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:e,function(n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.default=void 0;var o=null;try{o=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}function u(w,C,j){this.low=w|0,this.high=C|0,this.unsigned=!!j}u.prototype.__isLong__,Object.defineProperty(u.prototype,"__isLong__",{value:!0});function l(w){return(w&&w.__isLong__)===!0}function d(w){var C=Math.clz32(w&-w);return w?31-C:C}u.isLong=l;var c={},s={};function r(w,C){var j,H,V;return C?(w>>>=0,(V=0<=w&&w<256)&&(H=s[w],H)?H:(j=a(w,0,!0),V&&(s[w]=j),j)):(w|=0,(V=-128<=w&&w<128)&&(H=c[w],H)?H:(j=a(w,w<0?-1:0,!1),V&&(c[w]=j),j))}u.fromInt=r;function i(w,C){if(isNaN(w))return C?A:S;if(C){if(w<0)return A;if(w>=y)return Y}else{if(w<=-T)return q;if(w+1>=T)return U}return w<0?i(-w,C).neg():a(w%v|0,w/v|0,C)}u.fromNumber=i;function a(w,C,j){return new u(w,C,j)}u.fromBits=a;var p=Math.pow;function h(w,C,j){if(w.length===0)throw Error("empty string");if(typeof C=="number"?(j=C,C=!1):C=!!C,w==="NaN"||w==="Infinity"||w==="+Infinity"||w==="-Infinity")return C?A:S;if(j=j||10,j<2||36<j)throw RangeError("radix");var H;if((H=w.indexOf("-"))>0)throw Error("interior hyphen");if(H===0)return h(w.substring(1),C,j).neg();for(var V=i(p(j,8)),J=S,M=0;M<w.length;M+=8){var X=Math.min(8,w.length-M),K=parseInt(w.substring(M,M+X),j);if(X<8){var G=i(p(j,X));J=J.mul(G).add(i(K))}else J=J.mul(V),J=J.add(i(K))}return J.unsigned=C,J}u.fromString=h;function m(w,C){return typeof w=="number"?i(w,C):typeof w=="string"?h(w,C):a(w.low,w.high,typeof C=="boolean"?C:w.unsigned)}u.fromValue=m;var b=65536,$=1<<24,v=b*b,y=v*v,T=y/2,I=r($),S=r(0);u.ZERO=S;var A=r(0,!0);u.UZERO=A;var k=r(1);u.ONE=k;var O=r(1,!0);u.UONE=O;var L=r(-1);u.NEG_ONE=L;var U=a(-1,2147483647,!1);u.MAX_VALUE=U;var Y=a(-1,-1,!0);u.MAX_UNSIGNED_VALUE=Y;var q=a(0,-2147483648,!1);u.MIN_VALUE=q;var N=u.prototype;N.toInt=function(){return this.unsigned?this.low>>>0:this.low},N.toNumber=function(){return this.unsigned?(this.high>>>0)*v+(this.low>>>0):this.high*v+(this.low>>>0)},N.toString=function(w){if(w=w||10,w<2||36<w)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(q)){var C=i(w),j=this.div(C),H=j.mul(C).sub(this);return j.toString(w)+H.toInt().toString(w)}else return"-"+this.neg().toString(w);for(var V=i(p(w,6),this.unsigned),J=this,M="";;){var X=J.div(V),K=J.sub(X.mul(V)).toInt()>>>0,G=K.toString(w);if(J=X,J.isZero())return G+M;for(;G.length<6;)G="0"+G;M=""+G+M}},N.getHighBits=function(){return this.high},N.getHighBitsUnsigned=function(){return this.high>>>0},N.getLowBits=function(){return this.low},N.getLowBitsUnsigned=function(){return this.low>>>0},N.getNumBitsAbs=function(){if(this.isNegative())return this.eq(q)?64:this.neg().getNumBitsAbs();for(var w=this.high!=0?this.high:this.low,C=31;C>0&&(w&1<<C)==0;C--);return this.high!=0?C+33:C+1},N.isSafeInteger=function(){var w=this.high>>21;return w?this.unsigned?!1:w===-1&&!(this.low===0&&this.high===-2097152):!0},N.isZero=function(){return this.high===0&&this.low===0},N.eqz=N.isZero,N.isNegative=function(){return!this.unsigned&&this.high<0},N.isPositive=function(){return this.unsigned||this.high>=0},N.isOdd=function(){return(this.low&1)===1},N.isEven=function(){return(this.low&1)===0},N.equals=function(w){return l(w)||(w=m(w)),this.unsigned!==w.unsigned&&this.high>>>31===1&&w.high>>>31===1?!1:this.high===w.high&&this.low===w.low},N.eq=N.equals,N.notEquals=function(w){return!this.eq(w)},N.neq=N.notEquals,N.ne=N.notEquals,N.lessThan=function(w){return this.comp(w)<0},N.lt=N.lessThan,N.lessThanOrEqual=function(w){return this.comp(w)<=0},N.lte=N.lessThanOrEqual,N.le=N.lessThanOrEqual,N.greaterThan=function(w){return this.comp(w)>0},N.gt=N.greaterThan,N.greaterThanOrEqual=function(w){return this.comp(w)>=0},N.gte=N.greaterThanOrEqual,N.ge=N.greaterThanOrEqual,N.compare=function(w){if(l(w)||(w=m(w)),this.eq(w))return 0;var C=this.isNegative(),j=w.isNegative();return C&&!j?-1:!C&&j?1:this.unsigned?w.high>>>0>this.high>>>0||w.high===this.high&&w.low>>>0>this.low>>>0?-1:1:this.sub(w).isNegative()?-1:1},N.comp=N.compare,N.negate=function(){return!this.unsigned&&this.eq(q)?q:this.not().add(k)},N.neg=N.negate,N.add=function(w){l(w)||(w=m(w));var C=this.high>>>16,j=this.high&65535,H=this.low>>>16,V=this.low&65535,J=w.high>>>16,M=w.high&65535,X=w.low>>>16,K=w.low&65535,G=0,he=0,de=0,ye=0;return ye+=V+K,de+=ye>>>16,ye&=65535,de+=H+X,he+=de>>>16,de&=65535,he+=j+M,G+=he>>>16,he&=65535,G+=C+J,G&=65535,a(de<<16|ye,G<<16|he,this.unsigned)},N.subtract=function(w){return l(w)||(w=m(w)),this.add(w.neg())},N.sub=N.subtract,N.multiply=function(w){if(this.isZero())return this;if(l(w)||(w=m(w)),o){var C=o.mul(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}if(w.isZero())return this.unsigned?A:S;if(this.eq(q))return w.isOdd()?q:S;if(w.eq(q))return this.isOdd()?q:S;if(this.isNegative())return w.isNegative()?this.neg().mul(w.neg()):this.neg().mul(w).neg();if(w.isNegative())return this.mul(w.neg()).neg();if(this.lt(I)&&w.lt(I))return i(this.toNumber()*w.toNumber(),this.unsigned);var j=this.high>>>16,H=this.high&65535,V=this.low>>>16,J=this.low&65535,M=w.high>>>16,X=w.high&65535,K=w.low>>>16,G=w.low&65535,he=0,de=0,ye=0,se=0;return se+=J*G,ye+=se>>>16,se&=65535,ye+=V*G,de+=ye>>>16,ye&=65535,ye+=J*K,de+=ye>>>16,ye&=65535,de+=H*G,he+=de>>>16,de&=65535,de+=V*K,he+=de>>>16,de&=65535,de+=J*X,he+=de>>>16,de&=65535,he+=j*G+H*K+V*X+J*M,he&=65535,a(ye<<16|se,he<<16|de,this.unsigned)},N.mul=N.multiply,N.divide=function(w){if(l(w)||(w=m(w)),w.isZero())throw Error("division by zero");if(o){if(!this.unsigned&&this.high===-2147483648&&w.low===-1&&w.high===-1)return this;var C=(this.unsigned?o.div_u:o.div_s)(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?A:S;var j,H,V;if(this.unsigned){if(w.unsigned||(w=w.toUnsigned()),w.gt(this))return A;if(w.gt(this.shru(1)))return O;V=A}else{if(this.eq(q)){if(w.eq(k)||w.eq(L))return q;if(w.eq(q))return k;var J=this.shr(1);return j=J.div(w).shl(1),j.eq(S)?w.isNegative()?k:L:(H=this.sub(w.mul(j)),V=j.add(H.div(w)),V)}else if(w.eq(q))return this.unsigned?A:S;if(this.isNegative())return w.isNegative()?this.neg().div(w.neg()):this.neg().div(w).neg();if(w.isNegative())return this.div(w.neg()).neg();V=S}for(H=this;H.gte(w);){j=Math.max(1,Math.floor(H.toNumber()/w.toNumber()));for(var M=Math.ceil(Math.log(j)/Math.LN2),X=M<=48?1:p(2,M-48),K=i(j),G=K.mul(w);G.isNegative()||G.gt(H);)j-=X,K=i(j,this.unsigned),G=K.mul(w);K.isZero()&&(K=k),V=V.add(K),H=H.sub(G)}return V},N.div=N.divide,N.modulo=function(w){if(l(w)||(w=m(w)),o){var C=(this.unsigned?o.rem_u:o.rem_s)(this.low,this.high,w.low,w.high);return a(C,o.get_high(),this.unsigned)}return this.sub(this.div(w).mul(w))},N.mod=N.modulo,N.rem=N.modulo,N.not=function(){return a(~this.low,~this.high,this.unsigned)},N.countLeadingZeros=function(){return this.high?Math.clz32(this.high):Math.clz32(this.low)+32},N.clz=N.countLeadingZeros,N.countTrailingZeros=function(){return this.low?d(this.low):d(this.high)+32},N.ctz=N.countTrailingZeros,N.and=function(w){return l(w)||(w=m(w)),a(this.low&w.low,this.high&w.high,this.unsigned)},N.or=function(w){return l(w)||(w=m(w)),a(this.low|w.low,this.high|w.high,this.unsigned)},N.xor=function(w){return l(w)||(w=m(w)),a(this.low^w.low,this.high^w.high,this.unsigned)},N.shiftLeft=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low<<w,this.high<<w|this.low>>>32-w,this.unsigned):a(0,this.low<<w-32,this.unsigned)},N.shl=N.shiftLeft,N.shiftRight=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low>>>w|this.high<<32-w,this.high>>w,this.unsigned):a(this.high>>w-32,this.high>=0?0:-1,this.unsigned)},N.shr=N.shiftRight,N.shiftRightUnsigned=function(w){return l(w)&&(w=w.toInt()),(w&=63)===0?this:w<32?a(this.low>>>w|this.high<<32-w,this.high>>>w,this.unsigned):w===32?a(this.high,0,this.unsigned):a(this.high>>>w-32,0,this.unsigned)},N.shru=N.shiftRightUnsigned,N.shr_u=N.shiftRightUnsigned,N.rotateLeft=function(w){var C;return l(w)&&(w=w.toInt()),(w&=63)===0?this:w===32?a(this.high,this.low,this.unsigned):w<32?(C=32-w,a(this.low<<w|this.high>>>C,this.high<<w|this.low>>>C,this.unsigned)):(w-=32,C=32-w,a(this.high<<w|this.low>>>C,this.low<<w|this.high>>>C,this.unsigned))},N.rotl=N.rotateLeft,N.rotateRight=function(w){var C;return l(w)&&(w=w.toInt()),(w&=63)===0?this:w===32?a(this.high,this.low,this.unsigned):w<32?(C=32-w,a(this.high<<C|this.low>>>w,this.low<<C|this.high>>>w,this.unsigned)):(w-=32,C=32-w,a(this.low<<C|this.high>>>w,this.high<<C|this.low>>>w,this.unsigned))},N.rotr=N.rotateRight,N.toSigned=function(){return this.unsigned?a(this.low,this.high,!1):this},N.toUnsigned=function(){return this.unsigned?this:a(this.low,this.high,!0)},N.toBytes=function(w){return w?this.toBytesLE():this.toBytesBE()},N.toBytesLE=function(){var w=this.high,C=this.low;return[C&255,C>>>8&255,C>>>16&255,C>>>24,w&255,w>>>8&255,w>>>16&255,w>>>24]},N.toBytesBE=function(){var w=this.high,C=this.low;return[w>>>24,w>>>16&255,w>>>8&255,w&255,C>>>24,C>>>16&255,C>>>8&255,C&255]},u.fromBytes=function(w,C,j){return j?u.fromBytesLE(w,C):u.fromBytesBE(w,C)},u.fromBytesLE=function(w,C){return new u(w[0]|w[1]<<8|w[2]<<16|w[3]<<24,w[4]|w[5]<<8|w[6]<<16|w[7]<<24,C)},u.fromBytesBE=function(w,C){return new u(w[4]<<24|w[5]<<16|w[6]<<8|w[7],w[0]<<24|w[1]<<16|w[2]<<8|w[3],C)},typeof BigInt=="function"&&(u.fromBigInt=function(w,C){var j=Number(BigInt.asIntN(32,w)),H=Number(BigInt.asIntN(32,w>>BigInt(32)));return a(j,H,C)},u.fromValue=function(w,C){return typeof w=="bigint"?u.fromBigInt(w,C):m(w,C)},N.toBigInt=function(){var w=BigInt(this.low>>>0),C=BigInt(this.unsigned?this.high>>>0:this.high);return C<<BigInt(32)|w});var ue=n.default=u})}),sn=ie(e=>{"use strict";var t=e;t.asPromise=ZI(),t.base64=YI(),t.EventEmitter=JI(),t.float=QI(),t.inquire=e3(),t.utf8=t3(),t.pool=r3(),t.LongBits=n3();function n(l){return l==="__proto__"||l==="prototype"||l==="constructor"}t.isUnsafeProperty=n,t.isNode=!!(typeof global<"u"&&global&&global.process&&global.process.versions&&global.process.versions.node),t.global=t.isNode&&global||typeof window<"u"&&window||typeof self<"u"&&self||e,t.emptyArray=Object.freeze?Object.freeze([]):[],t.emptyObject=Object.freeze?Object.freeze({}):{},t.isInteger=Number.isInteger||function(l){return typeof l=="number"&&isFinite(l)&&Math.floor(l)===l},t.isString=function(l){return typeof l=="string"||l instanceof String},t.isObject=function(l){return l&&typeof l=="object"},t.isset=t.isSet=function(l,d){var c=l[d];return c!=null&&Object.hasOwnProperty.call(l,d)?typeof c!="object"||(Array.isArray(c)?c.length:Object.keys(c).length)>0:!1},t.Buffer=(function(){try{var l=t.global.Buffer;return l.prototype.utf8Write?l:null}catch{return null}})(),t._Buffer_from=null,t._Buffer_allocUnsafe=null,t.newBuffer=function(l){return typeof l=="number"?t.Buffer?t._Buffer_allocUnsafe(l):new t.Array(l):t.Buffer?t._Buffer_from(l):typeof Uint8Array>"u"?l:new Uint8Array(l)},t.Array=typeof Uint8Array<"u"?Uint8Array:Array,t.Long=t.global.dcodeIO&&t.global.dcodeIO.Long||t.global.Long||(function(){try{var l=i3();return l&&l.isLong?l:null}catch{return null}})(),t.key2Re=/^true|false|0|1$/,t.key32Re=/^-?(?:0|[1-9][0-9]*)$/,t.key64Re=/^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/,t.longToHash=function(l){return l?t.LongBits.from(l).toHash():t.LongBits.zeroHash},t.longFromHash=function(l,d){var c=t.LongBits.fromHash(l);return t.Long?t.Long.fromBits(c.lo,c.hi,d):c.toNumber(!!d)};function o(l){var d=typeof arguments[arguments.length-1]=="boolean",c=d?arguments.length-1:arguments.length;d=d&&arguments[arguments.length-1];for(var s=1;s<c;++s){var r=arguments[s];if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)!n(i[a])&&(l[i[a]]===void 0||!d)&&(l[i[a]]=r[i[a]])}return l}t.merge=o,t.nestingLimit=32,t.recursionLimit=100,t.makeProp=function(l,d){Object.defineProperty(l,d,{enumerable:!0,configurable:!0,writable:!0})},t.lcFirst=function(l){return l.charAt(0).toLowerCase()+l.substring(1)};function u(l){function d(c,s){if(!(this instanceof d))return new d(c,s);Object.defineProperty(this,"message",{get:function(){return c}}),Error.captureStackTrace?Error.captureStackTrace(this,d):Object.defineProperty(this,"stack",{value:new Error().stack||""}),s&&o(this,s)}return d.prototype=Object.create(Error.prototype,{constructor:{value:d,writable:!0,enumerable:!1,configurable:!0},name:{get:function(){return l},set:void 0,enumerable:!1,configurable:!0},toString:{value:function(){return this.name+": "+this.message},writable:!0,enumerable:!1,configurable:!0}}),d}t.newError=u,t.ProtocolError=u("ProtocolError"),t.oneOfGetter=function(l){for(var d={},c=0;c<l.length;++c)d[l[c]]=1;return function(){for(var s=Object.keys(this),r=s.length-1;r>-1;--r)if(d[s[r]]===1&&this[s[r]]!==void 0&&this[s[r]]!==null)return s[r]}},t.oneOfSetter=function(l){return function(d){for(var c=0;c<l.length;++c)l[c]!==d&&delete this[l[c]]}},t.toJSONOptions={longs:String,enums:String,bytes:String,json:!0},t._configure=function(){var l=t.Buffer;if(!l){t._Buffer_from=t._Buffer_allocUnsafe=null;return}t._Buffer_from=l.from!==Uint8Array.from&&l.from||function(d,c){return new l(d,c)},t._Buffer_allocUnsafe=l.allocUnsafe||function(d){return new l(d)}}}),A0=ie((e,t)=>{"use strict";t.exports=i;var n=sn(),o,u=n.LongBits,l=n.base64,d=n.utf8;function c(y,T,I){this.fn=y,this.len=T,this.next=void 0,this.val=I}function s(){}function r(y){this.head=y.head,this.tail=y.tail,this.len=y.len,this.next=y.states}function i(){this.len=0,this.head=new c(s,0,0),this.tail=this.head,this.states=null}var a=function(){return n.Buffer?function(){return(i.create=function(){return new o})()}:function(){return new i}};i.create=a(),i.alloc=function(y){return new n.Array(y)},n.Array!==Array&&(i.alloc=n.pool(i.alloc,n.Array.prototype.subarray)),i.prototype._push=function(y,T,I){return this.tail=this.tail.next=new c(y,T,I),this.len+=T,this};function p(y,T,I){T[I]=y&255}function h(y,T,I){for(;y>127;)T[I++]=y&127|128,y>>>=7;T[I]=y}function m(y,T){this.len=y,this.next=void 0,this.val=T}m.prototype=Object.create(c.prototype),m.prototype.fn=h,i.prototype.uint32=function(y){return this.len+=(this.tail=this.tail.next=new m((y=y>>>0)<128?1:y<16384?2:y<2097152?3:y<268435456?4:5,y)).len,this},i.prototype.int32=function(y){return(y|=0)<0?this._push(b,10,u.fromNumber(y)):this.uint32(y)},i.prototype.sint32=function(y){return this.uint32((y<<1^y>>31)>>>0)};function b(y,T,I){for(var S=y.lo,A=y.hi;A;)T[I++]=S&127|128,S=(S>>>7|A<<25)>>>0,A>>>=7;for(;S>127;)T[I++]=S&127|128,S=S>>>7;T[I++]=S}i.prototype.uint64=function(y){var T=u.from(y);return this._push(b,T.length(),T)},i.prototype.int64=i.prototype.uint64,i.prototype.sint64=function(y){var T=u.from(y).zzEncode();return this._push(b,T.length(),T)},i.prototype.bool=function(y){return this._push(p,1,y?1:0)};function $(y,T,I){T[I]=y&255,T[I+1]=y>>>8&255,T[I+2]=y>>>16&255,T[I+3]=y>>>24}i.prototype.fixed32=function(y){return this._push($,4,y>>>0)},i.prototype.sfixed32=i.prototype.fixed32,i.prototype.fixed64=function(y){var T=u.from(y);return this._push($,4,T.lo)._push($,4,T.hi)},i.prototype.sfixed64=i.prototype.fixed64,i.prototype.float=function(y){return this._push(n.float.writeFloatLE,4,y)},i.prototype.double=function(y){return this._push(n.float.writeDoubleLE,8,y)};var v=n.Array.prototype.set?function(y,T,I){T.set(y,I)}:function(y,T,I){for(var S=0;S<y.length;++S)T[I+S]=y[S]};i.prototype.bytes=function(y){var T=y.length>>>0;if(!T)return this._push(p,1,0);if(n.isString(y)){var I=i.alloc(T=l.length(y));l.decode(y,I,0),y=I}return this.uint32(T)._push(v,T,y)},i.prototype.string=function(y){var T=d.length(y);return T?this.uint32(T)._push(d.write,T,y):this._push(p,1,0)},i.prototype.fork=function(){return this.states=new r(this),this.head=this.tail=new c(s,0,0),this.len=0,this},i.prototype.reset=function(){return this.states?(this.head=this.states.head,this.tail=this.states.tail,this.len=this.states.len,this.states=this.states.next):(this.head=this.tail=new c(s,0,0),this.len=0),this},i.prototype.ldelim=function(){var y=this.head,T=this.tail,I=this.len;return this.reset().uint32(I),I&&(this.tail.next=y.next,this.tail=T,this.len+=I),this},i.prototype.finish=function(){for(var y=this.head.next,T=this.constructor.alloc(this.len),I=0;y;)y.fn(y.val,T,I),I+=y.len,y=y.next;return T},i._configure=function(y){o=y,i.create=a(),o._configure()}}),o3=ie((e,t)=>{"use strict";t.exports=u;var n=A0();(u.prototype=Object.create(n.prototype)).constructor=u;var o=sn();function u(){n.call(this)}u._configure=function(){u.alloc=o._Buffer_allocUnsafe,u.writeBytesBuffer=o.Buffer&&o.Buffer.prototype instanceof Uint8Array&&o.Buffer.prototype.set.name==="set"?function(d,c,s){c.set(d,s)}:function(d,c,s){if(d.copy)d.copy(c,s,0,d.length);else for(var r=0;r<d.length;)c[s++]=d[r++]}},u.prototype.bytes=function(d){o.isString(d)&&(d=o._Buffer_from(d,"base64"));var c=d.length>>>0;return this.uint32(c),c&&this._push(u.writeBytesBuffer,c,d),this};function l(d,c,s){d.length<40?o.utf8.write(d,c,s):c.utf8Write?c.utf8Write(d,s):c.write(d,s)}u.prototype.string=function(d){var c=o.Buffer.byteLength(d);return this.uint32(c),c&&this._push(l,c,d),this},u._configure()}),P0=ie((e,t)=>{"use strict";t.exports=c;var n=sn(),o,u=n.LongBits,l=n.utf8;function d(h,m){return RangeError("index out of range: "+h.pos+" + "+(m||1)+" > "+h.len)}function c(h){this.buf=h,this.pos=0,this.len=h.length}var s=typeof Uint8Array<"u"?function(h){if(h instanceof Uint8Array||Array.isArray(h))return new c(h);throw Error("illegal buffer")}:function(h){if(Array.isArray(h))return new c(h);throw Error("illegal buffer")},r=function(){return n.Buffer?function(h){return(c.create=function(m){return n.Buffer.isBuffer(m)?new o(m):s(m)})(h)}:s};c.create=r(),c.prototype._slice=n.Array.prototype.subarray||n.Array.prototype.slice,c.prototype.uint32=(function(){var h=4294967295;return function(){if(h=(this.buf[this.pos]&127)>>>0,this.buf[this.pos++]<128||(h=(h|(this.buf[this.pos]&127)<<7)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&127)<<14)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&127)<<21)>>>0,this.buf[this.pos++]<128)||(h=(h|(this.buf[this.pos]&15)<<28)>>>0,this.buf[this.pos++]<128))return h;if((this.pos+=5)>this.len)throw this.pos=this.len,d(this,10);return h}})(),c.prototype.int32=function(){return this.uint32()|0},c.prototype.sint32=function(){var h=this.uint32();return h>>>1^-(h&1)|0};function i(){var h=new u(0,0),m=0;if(this.len-this.pos>4){for(;m<4;++m)if(h.lo=(h.lo|(this.buf[this.pos]&127)<<m*7)>>>0,this.buf[this.pos++]<128)return h;if(h.lo=(h.lo|(this.buf[this.pos]&127)<<28)>>>0,h.hi=(h.hi|(this.buf[this.pos]&127)>>4)>>>0,this.buf[this.pos++]<128)return h;m=0}else{for(;m<3;++m){if(this.pos>=this.len)throw d(this);if(h.lo=(h.lo|(this.buf[this.pos]&127)<<m*7)>>>0,this.buf[this.pos++]<128)return h}return h.lo=(h.lo|(this.buf[this.pos++]&127)<<m*7)>>>0,h}if(this.len-this.pos>4){for(;m<5;++m)if(h.hi=(h.hi|(this.buf[this.pos]&127)<<m*7+3)>>>0,this.buf[this.pos++]<128)return h}else for(;m<5;++m){if(this.pos>=this.len)throw d(this);if(h.hi=(h.hi|(this.buf[this.pos]&127)<<m*7+3)>>>0,this.buf[this.pos++]<128)return h}throw Error("invalid varint encoding")}c.prototype.bool=function(){return this.uint32()!==0};function a(h,m){return(h[m-4]|h[m-3]<<8|h[m-2]<<16|h[m-1]<<24)>>>0}c.prototype.fixed32=function(){if(this.pos+4>this.len)throw d(this,4);return a(this.buf,this.pos+=4)},c.prototype.sfixed32=function(){if(this.pos+4>this.len)throw d(this,4);return a(this.buf,this.pos+=4)|0};function p(){if(this.pos+8>this.len)throw d(this,8);return new u(a(this.buf,this.pos+=4),a(this.buf,this.pos+=4))}c.prototype.float=function(){if(this.pos+4>this.len)throw d(this,4);var h=n.float.readFloatLE(this.buf,this.pos);return this.pos+=4,h},c.prototype.double=function(){if(this.pos+8>this.len)throw d(this,4);var h=n.float.readDoubleLE(this.buf,this.pos);return this.pos+=8,h},c.prototype.bytes=function(){var h=this.uint32(),m=this.pos,b=this.pos+h;if(b>this.len)throw d(this,h);if(this.pos+=h,Array.isArray(this.buf))return this.buf.slice(m,b);if(m===b){var $=n.Buffer;return $?$.alloc(0):new this.buf.constructor(0)}return this._slice.call(this.buf,m,b)},c.prototype.string=function(){var h=this.bytes();return l.read(h,0,h.length)},c.prototype.skip=function(h){if(typeof h=="number"){if(this.pos+h>this.len)throw d(this,h);this.pos+=h}else do if(this.pos>=this.len)throw d(this);while(this.buf[this.pos++]&128);return this},c.recursionLimit=n.recursionLimit,c.prototype.skipType=function(h,m){if(m===void 0&&(m=0),m>c.recursionLimit)throw Error("maximum nesting depth exceeded");switch(h){case 0:this.skip();break;case 1:this.skip(8);break;case 2:this.skip(this.uint32());break;case 3:for(;(h=this.uint32()&7)!==4;)this.skipType(h,m+1);break;case 5:this.skip(4);break;default:throw Error("invalid wire type "+h+" at offset "+this.pos)}return this},c._configure=function(h){o=h,c.create=r(),o._configure();var m=n.Long?"toLong":"toNumber";n.merge(c.prototype,{int64:function(){return i.call(this)[m](!1)},uint64:function(){return i.call(this)[m](!0)},sint64:function(){return i.call(this).zzDecode()[m](!1)},fixed64:function(){return p.call(this)[m](!0)},sfixed64:function(){return p.call(this)[m](!1)}})}}),s3=ie((e,t)=>{"use strict";t.exports=u;var n=P0();(u.prototype=Object.create(n.prototype)).constructor=u;var o=sn();function u(l){n.call(this,l)}u._configure=function(){o.Buffer&&(u.prototype._slice=o.Buffer.prototype.slice)},u.prototype.string=function(){var l=this.uint32();return this.buf.utf8Slice?this.buf.utf8Slice(this.pos,this.pos=Math.min(this.pos+l,this.len)):this.buf.toString("utf-8",this.pos,this.pos=Math.min(this.pos+l,this.len))},u._configure()}),a3=ie((e,t)=>{"use strict";t.exports=o;var n=sn();(o.prototype=Object.create(n.EventEmitter.prototype)).constructor=o;function o(u,l,d){if(typeof u!="function")throw TypeError("rpcImpl must be a function");n.EventEmitter.call(this),this.rpcImpl=u,this.requestDelimited=!!l,this.responseDelimited=!!d}o.prototype.rpcCall=function u(l,d,c,s,r){if(!s)throw TypeError("request must be specified");var i=this;if(!r)return n.asPromise(u,i,l,d,c,s);if(!i.rpcImpl){setTimeout(function(){r(Error("already ended"))},0);return}try{return i.rpcImpl(l,d[i.requestDelimited?"encodeDelimited":"encode"](s).finish(),function(a,p){if(a)return i.emit("error",a,l),r(a);if(p===null){i.end(!0);return}if(!(p instanceof c))try{p=c[i.responseDelimited?"decodeDelimited":"decode"](p)}catch(h){return i.emit("error",h,l),r(h)}return i.emit("data",p,l),r(null,p)})}catch(a){i.emit("error",a,l),setTimeout(function(){r(a)},0);return}},o.prototype.end=function(u){return this.rpcImpl&&(u||this.rpcImpl(null,null,null),this.rpcImpl=null,this.emit("end").off()),this}}),u3=ie(e=>{"use strict";var t=e;t.Service=a3()}),l3=ie((e,t)=>{"use strict";t.exports=Object.create(null)}),d3=ie(e=>{"use strict";var t=e;t.build="minimal",t.Writer=A0(),t.BufferWriter=o3(),t.Reader=P0(),t.BufferReader=s3(),t.util=sn(),t.rpc=u3(),t.roots=l3(),t.configure=n;function n(){t.util._configure(),t.Writer._configure(t.BufferWriter),t.Reader._configure(t.BufferReader)}n()}),c3=ie((e,t)=>{"use strict";t.exports=d3()}),wi=ie((e,t)=>{"use strict";var n=c3(),o=n.Reader,u=n.Writer,l=n.util,d=n.roots.default||(n.roots.default={});d.onnx=(function(){var c={};return c.Version=(function(){var s={},r=Object.create(s);return r[s[0]="_START_VERSION"]=0,r[s[1]="IR_VERSION_2017_10_10"]=1,r[s[2]="IR_VERSION_2017_10_30"]=2,r[s[3]="IR_VERSION_2017_11_3"]=3,r[s[4]="IR_VERSION_2019_1_22"]=4,r[s[5]="IR_VERSION_2019_3_18"]=5,r[s[6]="IR_VERSION_2019_9_19"]=6,r[s[7]="IR_VERSION_2020_5_8"]=7,r[s[8]="IR_VERSION_2021_7_30"]=8,r[s[9]="IR_VERSION"]=9,r})(),c.AttributeProto=(function(){function s(r){if(this.floats=[],this.ints=[],this.strings=[],this.tensors=[],this.graphs=[],this.sparseTensors=[],this.typeProtos=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.refAttrName="",s.prototype.docString="",s.prototype.type=0,s.prototype.f=0,s.prototype.i=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.s=l.newBuffer([]),s.prototype.t=null,s.prototype.g=null,s.prototype.sparseTensor=null,s.prototype.tp=null,s.prototype.floats=l.emptyArray,s.prototype.ints=l.emptyArray,s.prototype.strings=l.emptyArray,s.prototype.tensors=l.emptyArray,s.prototype.graphs=l.emptyArray,s.prototype.sparseTensors=l.emptyArray,s.prototype.typeProtos=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.f!=null&&Object.hasOwnProperty.call(r,"f")&&i.uint32(21).float(r.f),r.i!=null&&Object.hasOwnProperty.call(r,"i")&&i.uint32(24).int64(r.i),r.s!=null&&Object.hasOwnProperty.call(r,"s")&&i.uint32(34).bytes(r.s),r.t!=null&&Object.hasOwnProperty.call(r,"t")&&d.onnx.TensorProto.encode(r.t,i.uint32(42).fork()).ldelim(),r.g!=null&&Object.hasOwnProperty.call(r,"g")&&d.onnx.GraphProto.encode(r.g,i.uint32(50).fork()).ldelim(),r.floats!=null&&r.floats.length){i.uint32(58).fork();for(var a=0;a<r.floats.length;++a)i.float(r.floats[a]);i.ldelim()}if(r.ints!=null&&r.ints.length){i.uint32(66).fork();for(var a=0;a<r.ints.length;++a)i.int64(r.ints[a]);i.ldelim()}if(r.strings!=null&&r.strings.length)for(var a=0;a<r.strings.length;++a)i.uint32(74).bytes(r.strings[a]);if(r.tensors!=null&&r.tensors.length)for(var a=0;a<r.tensors.length;++a)d.onnx.TensorProto.encode(r.tensors[a],i.uint32(82).fork()).ldelim();if(r.graphs!=null&&r.graphs.length)for(var a=0;a<r.graphs.length;++a)d.onnx.GraphProto.encode(r.graphs[a],i.uint32(90).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(106).string(r.docString),r.tp!=null&&Object.hasOwnProperty.call(r,"tp")&&d.onnx.TypeProto.encode(r.tp,i.uint32(114).fork()).ldelim(),r.typeProtos!=null&&r.typeProtos.length)for(var a=0;a<r.typeProtos.length;++a)d.onnx.TypeProto.encode(r.typeProtos[a],i.uint32(122).fork()).ldelim();if(r.type!=null&&Object.hasOwnProperty.call(r,"type")&&i.uint32(160).int32(r.type),r.refAttrName!=null&&Object.hasOwnProperty.call(r,"refAttrName")&&i.uint32(170).string(r.refAttrName),r.sparseTensor!=null&&Object.hasOwnProperty.call(r,"sparseTensor")&&d.onnx.SparseTensorProto.encode(r.sparseTensor,i.uint32(178).fork()).ldelim(),r.sparseTensors!=null&&r.sparseTensors.length)for(var a=0;a<r.sparseTensors.length;++a)d.onnx.SparseTensorProto.encode(r.sparseTensors[a],i.uint32(186).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.AttributeProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 21:{p.refAttrName=r.string();break}case 13:{p.docString=r.string();break}case 20:{p.type=r.int32();break}case 2:{p.f=r.float();break}case 3:{p.i=r.int64();break}case 4:{p.s=r.bytes();break}case 5:{p.t=d.onnx.TensorProto.decode(r,r.uint32());break}case 6:{p.g=d.onnx.GraphProto.decode(r,r.uint32());break}case 22:{p.sparseTensor=d.onnx.SparseTensorProto.decode(r,r.uint32());break}case 14:{p.tp=d.onnx.TypeProto.decode(r,r.uint32());break}case 7:{if(p.floats&&p.floats.length||(p.floats=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.floats.push(r.float());else p.floats.push(r.float());break}case 8:{if(p.ints&&p.ints.length||(p.ints=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.ints.push(r.int64());else p.ints.push(r.int64());break}case 9:{p.strings&&p.strings.length||(p.strings=[]),p.strings.push(r.bytes());break}case 10:{p.tensors&&p.tensors.length||(p.tensors=[]),p.tensors.push(d.onnx.TensorProto.decode(r,r.uint32()));break}case 11:{p.graphs&&p.graphs.length||(p.graphs=[]),p.graphs.push(d.onnx.GraphProto.decode(r,r.uint32()));break}case 23:{p.sparseTensors&&p.sparseTensors.length||(p.sparseTensors=[]),p.sparseTensors.push(d.onnx.SparseTensorProto.decode(r,r.uint32()));break}case 15:{p.typeProtos&&p.typeProtos.length||(p.typeProtos=[]),p.typeProtos.push(d.onnx.TypeProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.refAttrName!=null&&r.hasOwnProperty("refAttrName")&&!l.isString(r.refAttrName))return"refAttrName: string expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.type!=null&&r.hasOwnProperty("type"))switch(r.type){default:return"type: enum value expected";case 0:case 1:case 2:case 3:case 4:case 5:case 11:case 13:case 6:case 7:case 8:case 9:case 10:case 12:case 14:break}if(r.f!=null&&r.hasOwnProperty("f")&&typeof r.f!="number")return"f: number expected";if(r.i!=null&&r.hasOwnProperty("i")&&!l.isInteger(r.i)&&!(r.i&&l.isInteger(r.i.low)&&l.isInteger(r.i.high)))return"i: integer|Long expected";if(r.s!=null&&r.hasOwnProperty("s")&&!(r.s&&typeof r.s.length=="number"||l.isString(r.s)))return"s: buffer expected";if(r.t!=null&&r.hasOwnProperty("t")){var i=d.onnx.TensorProto.verify(r.t);if(i)return"t."+i}if(r.g!=null&&r.hasOwnProperty("g")){var i=d.onnx.GraphProto.verify(r.g);if(i)return"g."+i}if(r.sparseTensor!=null&&r.hasOwnProperty("sparseTensor")){var i=d.onnx.SparseTensorProto.verify(r.sparseTensor);if(i)return"sparseTensor."+i}if(r.tp!=null&&r.hasOwnProperty("tp")){var i=d.onnx.TypeProto.verify(r.tp);if(i)return"tp."+i}if(r.floats!=null&&r.hasOwnProperty("floats")){if(!Array.isArray(r.floats))return"floats: array expected";for(var a=0;a<r.floats.length;++a)if(typeof r.floats[a]!="number")return"floats: number[] expected"}if(r.ints!=null&&r.hasOwnProperty("ints")){if(!Array.isArray(r.ints))return"ints: array expected";for(var a=0;a<r.ints.length;++a)if(!l.isInteger(r.ints[a])&&!(r.ints[a]&&l.isInteger(r.ints[a].low)&&l.isInteger(r.ints[a].high)))return"ints: integer|Long[] expected"}if(r.strings!=null&&r.hasOwnProperty("strings")){if(!Array.isArray(r.strings))return"strings: array expected";for(var a=0;a<r.strings.length;++a)if(!(r.strings[a]&&typeof r.strings[a].length=="number"||l.isString(r.strings[a])))return"strings: buffer[] expected"}if(r.tensors!=null&&r.hasOwnProperty("tensors")){if(!Array.isArray(r.tensors))return"tensors: array expected";for(var a=0;a<r.tensors.length;++a){var i=d.onnx.TensorProto.verify(r.tensors[a]);if(i)return"tensors."+i}}if(r.graphs!=null&&r.hasOwnProperty("graphs")){if(!Array.isArray(r.graphs))return"graphs: array expected";for(var a=0;a<r.graphs.length;++a){var i=d.onnx.GraphProto.verify(r.graphs[a]);if(i)return"graphs."+i}}if(r.sparseTensors!=null&&r.hasOwnProperty("sparseTensors")){if(!Array.isArray(r.sparseTensors))return"sparseTensors: array expected";for(var a=0;a<r.sparseTensors.length;++a){var i=d.onnx.SparseTensorProto.verify(r.sparseTensors[a]);if(i)return"sparseTensors."+i}}if(r.typeProtos!=null&&r.hasOwnProperty("typeProtos")){if(!Array.isArray(r.typeProtos))return"typeProtos: array expected";for(var a=0;a<r.typeProtos.length;++a){var i=d.onnx.TypeProto.verify(r.typeProtos[a]);if(i)return"typeProtos."+i}}return null},s.fromObject=function(r){if(r instanceof d.onnx.AttributeProto)return r;var i=new d.onnx.AttributeProto;switch(r.name!=null&&(i.name=String(r.name)),r.refAttrName!=null&&(i.refAttrName=String(r.refAttrName)),r.docString!=null&&(i.docString=String(r.docString)),r.type){default:if(typeof r.type=="number"){i.type=r.type;break}break;case"UNDEFINED":case 0:i.type=0;break;case"FLOAT":case 1:i.type=1;break;case"INT":case 2:i.type=2;break;case"STRING":case 3:i.type=3;break;case"TENSOR":case 4:i.type=4;break;case"GRAPH":case 5:i.type=5;break;case"SPARSE_TENSOR":case 11:i.type=11;break;case"TYPE_PROTO":case 13:i.type=13;break;case"FLOATS":case 6:i.type=6;break;case"INTS":case 7:i.type=7;break;case"STRINGS":case 8:i.type=8;break;case"TENSORS":case 9:i.type=9;break;case"GRAPHS":case 10:i.type=10;break;case"SPARSE_TENSORS":case 12:i.type=12;break;case"TYPE_PROTOS":case 14:i.type=14;break}if(r.f!=null&&(i.f=Number(r.f)),r.i!=null&&(l.Long?(i.i=l.Long.fromValue(r.i)).unsigned=!1:typeof r.i=="string"?i.i=parseInt(r.i,10):typeof r.i=="number"?i.i=r.i:typeof r.i=="object"&&(i.i=new l.LongBits(r.i.low>>>0,r.i.high>>>0).toNumber())),r.s!=null&&(typeof r.s=="string"?l.base64.decode(r.s,i.s=l.newBuffer(l.base64.length(r.s)),0):r.s.length>=0&&(i.s=r.s)),r.t!=null){if(typeof r.t!="object")throw TypeError(".onnx.AttributeProto.t: object expected");i.t=d.onnx.TensorProto.fromObject(r.t)}if(r.g!=null){if(typeof r.g!="object")throw TypeError(".onnx.AttributeProto.g: object expected");i.g=d.onnx.GraphProto.fromObject(r.g)}if(r.sparseTensor!=null){if(typeof r.sparseTensor!="object")throw TypeError(".onnx.AttributeProto.sparseTensor: object expected");i.sparseTensor=d.onnx.SparseTensorProto.fromObject(r.sparseTensor)}if(r.tp!=null){if(typeof r.tp!="object")throw TypeError(".onnx.AttributeProto.tp: object expected");i.tp=d.onnx.TypeProto.fromObject(r.tp)}if(r.floats){if(!Array.isArray(r.floats))throw TypeError(".onnx.AttributeProto.floats: array expected");i.floats=[];for(var a=0;a<r.floats.length;++a)i.floats[a]=Number(r.floats[a])}if(r.ints){if(!Array.isArray(r.ints))throw TypeError(".onnx.AttributeProto.ints: array expected");i.ints=[];for(var a=0;a<r.ints.length;++a)l.Long?(i.ints[a]=l.Long.fromValue(r.ints[a])).unsigned=!1:typeof r.ints[a]=="string"?i.ints[a]=parseInt(r.ints[a],10):typeof r.ints[a]=="number"?i.ints[a]=r.ints[a]:typeof r.ints[a]=="object"&&(i.ints[a]=new l.LongBits(r.ints[a].low>>>0,r.ints[a].high>>>0).toNumber())}if(r.strings){if(!Array.isArray(r.strings))throw TypeError(".onnx.AttributeProto.strings: array expected");i.strings=[];for(var a=0;a<r.strings.length;++a)typeof r.strings[a]=="string"?l.base64.decode(r.strings[a],i.strings[a]=l.newBuffer(l.base64.length(r.strings[a])),0):r.strings[a].length>=0&&(i.strings[a]=r.strings[a])}if(r.tensors){if(!Array.isArray(r.tensors))throw TypeError(".onnx.AttributeProto.tensors: array expected");i.tensors=[];for(var a=0;a<r.tensors.length;++a){if(typeof r.tensors[a]!="object")throw TypeError(".onnx.AttributeProto.tensors: object expected");i.tensors[a]=d.onnx.TensorProto.fromObject(r.tensors[a])}}if(r.graphs){if(!Array.isArray(r.graphs))throw TypeError(".onnx.AttributeProto.graphs: array expected");i.graphs=[];for(var a=0;a<r.graphs.length;++a){if(typeof r.graphs[a]!="object")throw TypeError(".onnx.AttributeProto.graphs: object expected");i.graphs[a]=d.onnx.GraphProto.fromObject(r.graphs[a])}}if(r.sparseTensors){if(!Array.isArray(r.sparseTensors))throw TypeError(".onnx.AttributeProto.sparseTensors: array expected");i.sparseTensors=[];for(var a=0;a<r.sparseTensors.length;++a){if(typeof r.sparseTensors[a]!="object")throw TypeError(".onnx.AttributeProto.sparseTensors: object expected");i.sparseTensors[a]=d.onnx.SparseTensorProto.fromObject(r.sparseTensors[a])}}if(r.typeProtos){if(!Array.isArray(r.typeProtos))throw TypeError(".onnx.AttributeProto.typeProtos: array expected");i.typeProtos=[];for(var a=0;a<r.typeProtos.length;++a){if(typeof r.typeProtos[a]!="object")throw TypeError(".onnx.AttributeProto.typeProtos: object expected");i.typeProtos[a]=d.onnx.TypeProto.fromObject(r.typeProtos[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.floats=[],a.ints=[],a.strings=[],a.tensors=[],a.graphs=[],a.typeProtos=[],a.sparseTensors=[]),i.defaults){if(a.name="",a.f=0,l.Long){var p=new l.Long(0,0,!1);a.i=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.i=i.longs===String?"0":0;i.bytes===String?a.s="":(a.s=[],i.bytes!==Array&&(a.s=l.newBuffer(a.s))),a.t=null,a.g=null,a.docString="",a.tp=null,a.type=i.enums===String?"UNDEFINED":0,a.refAttrName="",a.sparseTensor=null}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.f!=null&&r.hasOwnProperty("f")&&(a.f=i.json&&!isFinite(r.f)?String(r.f):r.f),r.i!=null&&r.hasOwnProperty("i")&&(typeof r.i=="number"?a.i=i.longs===String?String(r.i):r.i:a.i=i.longs===String?l.Long.prototype.toString.call(r.i):i.longs===Number?new l.LongBits(r.i.low>>>0,r.i.high>>>0).toNumber():r.i),r.s!=null&&r.hasOwnProperty("s")&&(a.s=i.bytes===String?l.base64.encode(r.s,0,r.s.length):i.bytes===Array?Array.prototype.slice.call(r.s):r.s),r.t!=null&&r.hasOwnProperty("t")&&(a.t=d.onnx.TensorProto.toObject(r.t,i)),r.g!=null&&r.hasOwnProperty("g")&&(a.g=d.onnx.GraphProto.toObject(r.g,i)),r.floats&&r.floats.length){a.floats=[];for(var h=0;h<r.floats.length;++h)a.floats[h]=i.json&&!isFinite(r.floats[h])?String(r.floats[h]):r.floats[h]}if(r.ints&&r.ints.length){a.ints=[];for(var h=0;h<r.ints.length;++h)typeof r.ints[h]=="number"?a.ints[h]=i.longs===String?String(r.ints[h]):r.ints[h]:a.ints[h]=i.longs===String?l.Long.prototype.toString.call(r.ints[h]):i.longs===Number?new l.LongBits(r.ints[h].low>>>0,r.ints[h].high>>>0).toNumber():r.ints[h]}if(r.strings&&r.strings.length){a.strings=[];for(var h=0;h<r.strings.length;++h)a.strings[h]=i.bytes===String?l.base64.encode(r.strings[h],0,r.strings[h].length):i.bytes===Array?Array.prototype.slice.call(r.strings[h]):r.strings[h]}if(r.tensors&&r.tensors.length){a.tensors=[];for(var h=0;h<r.tensors.length;++h)a.tensors[h]=d.onnx.TensorProto.toObject(r.tensors[h],i)}if(r.graphs&&r.graphs.length){a.graphs=[];for(var h=0;h<r.graphs.length;++h)a.graphs[h]=d.onnx.GraphProto.toObject(r.graphs[h],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.tp!=null&&r.hasOwnProperty("tp")&&(a.tp=d.onnx.TypeProto.toObject(r.tp,i)),r.typeProtos&&r.typeProtos.length){a.typeProtos=[];for(var h=0;h<r.typeProtos.length;++h)a.typeProtos[h]=d.onnx.TypeProto.toObject(r.typeProtos[h],i)}if(r.type!=null&&r.hasOwnProperty("type")&&(a.type=i.enums===String?d.onnx.AttributeProto.AttributeType[r.type]===void 0?r.type:d.onnx.AttributeProto.AttributeType[r.type]:r.type),r.refAttrName!=null&&r.hasOwnProperty("refAttrName")&&(a.refAttrName=r.refAttrName),r.sparseTensor!=null&&r.hasOwnProperty("sparseTensor")&&(a.sparseTensor=d.onnx.SparseTensorProto.toObject(r.sparseTensor,i)),r.sparseTensors&&r.sparseTensors.length){a.sparseTensors=[];for(var h=0;h<r.sparseTensors.length;++h)a.sparseTensors[h]=d.onnx.SparseTensorProto.toObject(r.sparseTensors[h],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.AttributeProto"},s.AttributeType=(function(){var r={},i=Object.create(r);return i[r[0]="UNDEFINED"]=0,i[r[1]="FLOAT"]=1,i[r[2]="INT"]=2,i[r[3]="STRING"]=3,i[r[4]="TENSOR"]=4,i[r[5]="GRAPH"]=5,i[r[11]="SPARSE_TENSOR"]=11,i[r[13]="TYPE_PROTO"]=13,i[r[6]="FLOATS"]=6,i[r[7]="INTS"]=7,i[r[8]="STRINGS"]=8,i[r[9]="TENSORS"]=9,i[r[10]="GRAPHS"]=10,i[r[12]="SPARSE_TENSORS"]=12,i[r[14]="TYPE_PROTOS"]=14,i})(),s})(),c.ValueInfoProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.type=null,s.prototype.docString="",s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.type!=null&&Object.hasOwnProperty.call(r,"type")&&d.onnx.TypeProto.encode(r.type,i.uint32(18).fork()).ldelim(),r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(26).string(r.docString),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.ValueInfoProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 2:{p.type=d.onnx.TypeProto.decode(r,r.uint32());break}case 3:{p.docString=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.type!=null&&r.hasOwnProperty("type")){var i=d.onnx.TypeProto.verify(r.type);if(i)return"type."+i}return r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString)?"docString: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.ValueInfoProto)return r;var i=new d.onnx.ValueInfoProto;if(r.name!=null&&(i.name=String(r.name)),r.type!=null){if(typeof r.type!="object")throw TypeError(".onnx.ValueInfoProto.type: object expected");i.type=d.onnx.TypeProto.fromObject(r.type)}return r.docString!=null&&(i.docString=String(r.docString)),i},s.toObject=function(r,i){i||(i={});var a={};return i.defaults&&(a.name="",a.type=null,a.docString=""),r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.type!=null&&r.hasOwnProperty("type")&&(a.type=d.onnx.TypeProto.toObject(r.type,i)),r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.ValueInfoProto"},s})(),c.NodeProto=(function(){function s(r){if(this.input=[],this.output=[],this.attribute=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.name="",s.prototype.opType="",s.prototype.domain="",s.prototype.attribute=l.emptyArray,s.prototype.docString="",s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)i.uint32(10).string(r.input[a]);if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)i.uint32(18).string(r.output[a]);if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(26).string(r.name),r.opType!=null&&Object.hasOwnProperty.call(r,"opType")&&i.uint32(34).string(r.opType),r.attribute!=null&&r.attribute.length)for(var a=0;a<r.attribute.length;++a)d.onnx.AttributeProto.encode(r.attribute[a],i.uint32(42).fork()).ldelim();return r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(50).string(r.docString),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(58).string(r.domain),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.NodeProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.input&&p.input.length||(p.input=[]),p.input.push(r.string());break}case 2:{p.output&&p.output.length||(p.output=[]),p.output.push(r.string());break}case 3:{p.name=r.string();break}case 4:{p.opType=r.string();break}case 7:{p.domain=r.string();break}case 5:{p.attribute&&p.attribute.length||(p.attribute=[]),p.attribute.push(d.onnx.AttributeProto.decode(r,r.uint32()));break}case 6:{p.docString=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i)if(!l.isString(r.input[i]))return"input: string[] expected"}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i)if(!l.isString(r.output[i]))return"output: string[] expected"}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.opType!=null&&r.hasOwnProperty("opType")&&!l.isString(r.opType))return"opType: string expected";if(r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain))return"domain: string expected";if(r.attribute!=null&&r.hasOwnProperty("attribute")){if(!Array.isArray(r.attribute))return"attribute: array expected";for(var i=0;i<r.attribute.length;++i){var a=d.onnx.AttributeProto.verify(r.attribute[i]);if(a)return"attribute."+a}}return r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString)?"docString: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.NodeProto)return r;var i=new d.onnx.NodeProto;if(r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.NodeProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a)i.input[a]=String(r.input[a])}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.NodeProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a)i.output[a]=String(r.output[a])}if(r.name!=null&&(i.name=String(r.name)),r.opType!=null&&(i.opType=String(r.opType)),r.domain!=null&&(i.domain=String(r.domain)),r.attribute){if(!Array.isArray(r.attribute))throw TypeError(".onnx.NodeProto.attribute: array expected");i.attribute=[];for(var a=0;a<r.attribute.length;++a){if(typeof r.attribute[a]!="object")throw TypeError(".onnx.NodeProto.attribute: object expected");i.attribute[a]=d.onnx.AttributeProto.fromObject(r.attribute[a])}}return r.docString!=null&&(i.docString=String(r.docString)),i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.input=[],a.output=[],a.attribute=[]),i.defaults&&(a.name="",a.opType="",a.docString="",a.domain=""),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=r.input[p]}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=r.output[p]}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.opType!=null&&r.hasOwnProperty("opType")&&(a.opType=r.opType),r.attribute&&r.attribute.length){a.attribute=[];for(var p=0;p<r.attribute.length;++p)a.attribute[p]=d.onnx.AttributeProto.toObject(r.attribute[p],i)}return r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.NodeProto"},s})(),c.TrainingInfoProto=(function(){function s(r){if(this.initializationBinding=[],this.updateBinding=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.initialization=null,s.prototype.algorithm=null,s.prototype.initializationBinding=l.emptyArray,s.prototype.updateBinding=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.initialization!=null&&Object.hasOwnProperty.call(r,"initialization")&&d.onnx.GraphProto.encode(r.initialization,i.uint32(10).fork()).ldelim(),r.algorithm!=null&&Object.hasOwnProperty.call(r,"algorithm")&&d.onnx.GraphProto.encode(r.algorithm,i.uint32(18).fork()).ldelim(),r.initializationBinding!=null&&r.initializationBinding.length)for(var a=0;a<r.initializationBinding.length;++a)d.onnx.StringStringEntryProto.encode(r.initializationBinding[a],i.uint32(26).fork()).ldelim();if(r.updateBinding!=null&&r.updateBinding.length)for(var a=0;a<r.updateBinding.length;++a)d.onnx.StringStringEntryProto.encode(r.updateBinding[a],i.uint32(34).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TrainingInfoProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.initialization=d.onnx.GraphProto.decode(r,r.uint32());break}case 2:{p.algorithm=d.onnx.GraphProto.decode(r,r.uint32());break}case 3:{p.initializationBinding&&p.initializationBinding.length||(p.initializationBinding=[]),p.initializationBinding.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 4:{p.updateBinding&&p.updateBinding.length||(p.updateBinding=[]),p.updateBinding.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.initialization!=null&&r.hasOwnProperty("initialization")){var i=d.onnx.GraphProto.verify(r.initialization);if(i)return"initialization."+i}if(r.algorithm!=null&&r.hasOwnProperty("algorithm")){var i=d.onnx.GraphProto.verify(r.algorithm);if(i)return"algorithm."+i}if(r.initializationBinding!=null&&r.hasOwnProperty("initializationBinding")){if(!Array.isArray(r.initializationBinding))return"initializationBinding: array expected";for(var a=0;a<r.initializationBinding.length;++a){var i=d.onnx.StringStringEntryProto.verify(r.initializationBinding[a]);if(i)return"initializationBinding."+i}}if(r.updateBinding!=null&&r.hasOwnProperty("updateBinding")){if(!Array.isArray(r.updateBinding))return"updateBinding: array expected";for(var a=0;a<r.updateBinding.length;++a){var i=d.onnx.StringStringEntryProto.verify(r.updateBinding[a]);if(i)return"updateBinding."+i}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TrainingInfoProto)return r;var i=new d.onnx.TrainingInfoProto;if(r.initialization!=null){if(typeof r.initialization!="object")throw TypeError(".onnx.TrainingInfoProto.initialization: object expected");i.initialization=d.onnx.GraphProto.fromObject(r.initialization)}if(r.algorithm!=null){if(typeof r.algorithm!="object")throw TypeError(".onnx.TrainingInfoProto.algorithm: object expected");i.algorithm=d.onnx.GraphProto.fromObject(r.algorithm)}if(r.initializationBinding){if(!Array.isArray(r.initializationBinding))throw TypeError(".onnx.TrainingInfoProto.initializationBinding: array expected");i.initializationBinding=[];for(var a=0;a<r.initializationBinding.length;++a){if(typeof r.initializationBinding[a]!="object")throw TypeError(".onnx.TrainingInfoProto.initializationBinding: object expected");i.initializationBinding[a]=d.onnx.StringStringEntryProto.fromObject(r.initializationBinding[a])}}if(r.updateBinding){if(!Array.isArray(r.updateBinding))throw TypeError(".onnx.TrainingInfoProto.updateBinding: array expected");i.updateBinding=[];for(var a=0;a<r.updateBinding.length;++a){if(typeof r.updateBinding[a]!="object")throw TypeError(".onnx.TrainingInfoProto.updateBinding: object expected");i.updateBinding[a]=d.onnx.StringStringEntryProto.fromObject(r.updateBinding[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.initializationBinding=[],a.updateBinding=[]),i.defaults&&(a.initialization=null,a.algorithm=null),r.initialization!=null&&r.hasOwnProperty("initialization")&&(a.initialization=d.onnx.GraphProto.toObject(r.initialization,i)),r.algorithm!=null&&r.hasOwnProperty("algorithm")&&(a.algorithm=d.onnx.GraphProto.toObject(r.algorithm,i)),r.initializationBinding&&r.initializationBinding.length){a.initializationBinding=[];for(var p=0;p<r.initializationBinding.length;++p)a.initializationBinding[p]=d.onnx.StringStringEntryProto.toObject(r.initializationBinding[p],i)}if(r.updateBinding&&r.updateBinding.length){a.updateBinding=[];for(var p=0;p<r.updateBinding.length;++p)a.updateBinding[p]=d.onnx.StringStringEntryProto.toObject(r.updateBinding[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TrainingInfoProto"},s})(),c.ModelProto=(function(){function s(r){if(this.opsetImport=[],this.metadataProps=[],this.trainingInfo=[],this.functions=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.irVersion=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.opsetImport=l.emptyArray,s.prototype.producerName="",s.prototype.producerVersion="",s.prototype.domain="",s.prototype.modelVersion=l.Long?l.Long.fromBits(0,0,!1):0,s.prototype.docString="",s.prototype.graph=null,s.prototype.metadataProps=l.emptyArray,s.prototype.trainingInfo=l.emptyArray,s.prototype.functions=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.irVersion!=null&&Object.hasOwnProperty.call(r,"irVersion")&&i.uint32(8).int64(r.irVersion),r.producerName!=null&&Object.hasOwnProperty.call(r,"producerName")&&i.uint32(18).string(r.producerName),r.producerVersion!=null&&Object.hasOwnProperty.call(r,"producerVersion")&&i.uint32(26).string(r.producerVersion),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(34).string(r.domain),r.modelVersion!=null&&Object.hasOwnProperty.call(r,"modelVersion")&&i.uint32(40).int64(r.modelVersion),r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(50).string(r.docString),r.graph!=null&&Object.hasOwnProperty.call(r,"graph")&&d.onnx.GraphProto.encode(r.graph,i.uint32(58).fork()).ldelim(),r.opsetImport!=null&&r.opsetImport.length)for(var a=0;a<r.opsetImport.length;++a)d.onnx.OperatorSetIdProto.encode(r.opsetImport[a],i.uint32(66).fork()).ldelim();if(r.metadataProps!=null&&r.metadataProps.length)for(var a=0;a<r.metadataProps.length;++a)d.onnx.StringStringEntryProto.encode(r.metadataProps[a],i.uint32(114).fork()).ldelim();if(r.trainingInfo!=null&&r.trainingInfo.length)for(var a=0;a<r.trainingInfo.length;++a)d.onnx.TrainingInfoProto.encode(r.trainingInfo[a],i.uint32(162).fork()).ldelim();if(r.functions!=null&&r.functions.length)for(var a=0;a<r.functions.length;++a)d.onnx.FunctionProto.encode(r.functions[a],i.uint32(202).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.ModelProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.irVersion=r.int64();break}case 8:{p.opsetImport&&p.opsetImport.length||(p.opsetImport=[]),p.opsetImport.push(d.onnx.OperatorSetIdProto.decode(r,r.uint32()));break}case 2:{p.producerName=r.string();break}case 3:{p.producerVersion=r.string();break}case 4:{p.domain=r.string();break}case 5:{p.modelVersion=r.int64();break}case 6:{p.docString=r.string();break}case 7:{p.graph=d.onnx.GraphProto.decode(r,r.uint32());break}case 14:{p.metadataProps&&p.metadataProps.length||(p.metadataProps=[]),p.metadataProps.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 20:{p.trainingInfo&&p.trainingInfo.length||(p.trainingInfo=[]),p.trainingInfo.push(d.onnx.TrainingInfoProto.decode(r,r.uint32()));break}case 25:{p.functions&&p.functions.length||(p.functions=[]),p.functions.push(d.onnx.FunctionProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.irVersion!=null&&r.hasOwnProperty("irVersion")&&!l.isInteger(r.irVersion)&&!(r.irVersion&&l.isInteger(r.irVersion.low)&&l.isInteger(r.irVersion.high)))return"irVersion: integer|Long expected";if(r.opsetImport!=null&&r.hasOwnProperty("opsetImport")){if(!Array.isArray(r.opsetImport))return"opsetImport: array expected";for(var i=0;i<r.opsetImport.length;++i){var a=d.onnx.OperatorSetIdProto.verify(r.opsetImport[i]);if(a)return"opsetImport."+a}}if(r.producerName!=null&&r.hasOwnProperty("producerName")&&!l.isString(r.producerName))return"producerName: string expected";if(r.producerVersion!=null&&r.hasOwnProperty("producerVersion")&&!l.isString(r.producerVersion))return"producerVersion: string expected";if(r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain))return"domain: string expected";if(r.modelVersion!=null&&r.hasOwnProperty("modelVersion")&&!l.isInteger(r.modelVersion)&&!(r.modelVersion&&l.isInteger(r.modelVersion.low)&&l.isInteger(r.modelVersion.high)))return"modelVersion: integer|Long expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.graph!=null&&r.hasOwnProperty("graph")){var a=d.onnx.GraphProto.verify(r.graph);if(a)return"graph."+a}if(r.metadataProps!=null&&r.hasOwnProperty("metadataProps")){if(!Array.isArray(r.metadataProps))return"metadataProps: array expected";for(var i=0;i<r.metadataProps.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.metadataProps[i]);if(a)return"metadataProps."+a}}if(r.trainingInfo!=null&&r.hasOwnProperty("trainingInfo")){if(!Array.isArray(r.trainingInfo))return"trainingInfo: array expected";for(var i=0;i<r.trainingInfo.length;++i){var a=d.onnx.TrainingInfoProto.verify(r.trainingInfo[i]);if(a)return"trainingInfo."+a}}if(r.functions!=null&&r.hasOwnProperty("functions")){if(!Array.isArray(r.functions))return"functions: array expected";for(var i=0;i<r.functions.length;++i){var a=d.onnx.FunctionProto.verify(r.functions[i]);if(a)return"functions."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.ModelProto)return r;var i=new d.onnx.ModelProto;if(r.irVersion!=null&&(l.Long?(i.irVersion=l.Long.fromValue(r.irVersion)).unsigned=!1:typeof r.irVersion=="string"?i.irVersion=parseInt(r.irVersion,10):typeof r.irVersion=="number"?i.irVersion=r.irVersion:typeof r.irVersion=="object"&&(i.irVersion=new l.LongBits(r.irVersion.low>>>0,r.irVersion.high>>>0).toNumber())),r.opsetImport){if(!Array.isArray(r.opsetImport))throw TypeError(".onnx.ModelProto.opsetImport: array expected");i.opsetImport=[];for(var a=0;a<r.opsetImport.length;++a){if(typeof r.opsetImport[a]!="object")throw TypeError(".onnx.ModelProto.opsetImport: object expected");i.opsetImport[a]=d.onnx.OperatorSetIdProto.fromObject(r.opsetImport[a])}}if(r.producerName!=null&&(i.producerName=String(r.producerName)),r.producerVersion!=null&&(i.producerVersion=String(r.producerVersion)),r.domain!=null&&(i.domain=String(r.domain)),r.modelVersion!=null&&(l.Long?(i.modelVersion=l.Long.fromValue(r.modelVersion)).unsigned=!1:typeof r.modelVersion=="string"?i.modelVersion=parseInt(r.modelVersion,10):typeof r.modelVersion=="number"?i.modelVersion=r.modelVersion:typeof r.modelVersion=="object"&&(i.modelVersion=new l.LongBits(r.modelVersion.low>>>0,r.modelVersion.high>>>0).toNumber())),r.docString!=null&&(i.docString=String(r.docString)),r.graph!=null){if(typeof r.graph!="object")throw TypeError(".onnx.ModelProto.graph: object expected");i.graph=d.onnx.GraphProto.fromObject(r.graph)}if(r.metadataProps){if(!Array.isArray(r.metadataProps))throw TypeError(".onnx.ModelProto.metadataProps: array expected");i.metadataProps=[];for(var a=0;a<r.metadataProps.length;++a){if(typeof r.metadataProps[a]!="object")throw TypeError(".onnx.ModelProto.metadataProps: object expected");i.metadataProps[a]=d.onnx.StringStringEntryProto.fromObject(r.metadataProps[a])}}if(r.trainingInfo){if(!Array.isArray(r.trainingInfo))throw TypeError(".onnx.ModelProto.trainingInfo: array expected");i.trainingInfo=[];for(var a=0;a<r.trainingInfo.length;++a){if(typeof r.trainingInfo[a]!="object")throw TypeError(".onnx.ModelProto.trainingInfo: object expected");i.trainingInfo[a]=d.onnx.TrainingInfoProto.fromObject(r.trainingInfo[a])}}if(r.functions){if(!Array.isArray(r.functions))throw TypeError(".onnx.ModelProto.functions: array expected");i.functions=[];for(var a=0;a<r.functions.length;++a){if(typeof r.functions[a]!="object")throw TypeError(".onnx.ModelProto.functions: object expected");i.functions[a]=d.onnx.FunctionProto.fromObject(r.functions[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.opsetImport=[],a.metadataProps=[],a.trainingInfo=[],a.functions=[]),i.defaults){if(l.Long){var p=new l.Long(0,0,!1);a.irVersion=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.irVersion=i.longs===String?"0":0;if(a.producerName="",a.producerVersion="",a.domain="",l.Long){var p=new l.Long(0,0,!1);a.modelVersion=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.modelVersion=i.longs===String?"0":0;a.docString="",a.graph=null}if(r.irVersion!=null&&r.hasOwnProperty("irVersion")&&(typeof r.irVersion=="number"?a.irVersion=i.longs===String?String(r.irVersion):r.irVersion:a.irVersion=i.longs===String?l.Long.prototype.toString.call(r.irVersion):i.longs===Number?new l.LongBits(r.irVersion.low>>>0,r.irVersion.high>>>0).toNumber():r.irVersion),r.producerName!=null&&r.hasOwnProperty("producerName")&&(a.producerName=r.producerName),r.producerVersion!=null&&r.hasOwnProperty("producerVersion")&&(a.producerVersion=r.producerVersion),r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.modelVersion!=null&&r.hasOwnProperty("modelVersion")&&(typeof r.modelVersion=="number"?a.modelVersion=i.longs===String?String(r.modelVersion):r.modelVersion:a.modelVersion=i.longs===String?l.Long.prototype.toString.call(r.modelVersion):i.longs===Number?new l.LongBits(r.modelVersion.low>>>0,r.modelVersion.high>>>0).toNumber():r.modelVersion),r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.graph!=null&&r.hasOwnProperty("graph")&&(a.graph=d.onnx.GraphProto.toObject(r.graph,i)),r.opsetImport&&r.opsetImport.length){a.opsetImport=[];for(var h=0;h<r.opsetImport.length;++h)a.opsetImport[h]=d.onnx.OperatorSetIdProto.toObject(r.opsetImport[h],i)}if(r.metadataProps&&r.metadataProps.length){a.metadataProps=[];for(var h=0;h<r.metadataProps.length;++h)a.metadataProps[h]=d.onnx.StringStringEntryProto.toObject(r.metadataProps[h],i)}if(r.trainingInfo&&r.trainingInfo.length){a.trainingInfo=[];for(var h=0;h<r.trainingInfo.length;++h)a.trainingInfo[h]=d.onnx.TrainingInfoProto.toObject(r.trainingInfo[h],i)}if(r.functions&&r.functions.length){a.functions=[];for(var h=0;h<r.functions.length;++h)a.functions[h]=d.onnx.FunctionProto.toObject(r.functions[h],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.ModelProto"},s})(),c.StringStringEntryProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.key="",s.prototype.value="",s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.key!=null&&Object.hasOwnProperty.call(r,"key")&&i.uint32(10).string(r.key),r.value!=null&&Object.hasOwnProperty.call(r,"value")&&i.uint32(18).string(r.value),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.StringStringEntryProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.key=r.string();break}case 2:{p.value=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){return typeof r!="object"||r===null?"object expected":r.key!=null&&r.hasOwnProperty("key")&&!l.isString(r.key)?"key: string expected":r.value!=null&&r.hasOwnProperty("value")&&!l.isString(r.value)?"value: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.StringStringEntryProto)return r;var i=new d.onnx.StringStringEntryProto;return r.key!=null&&(i.key=String(r.key)),r.value!=null&&(i.value=String(r.value)),i},s.toObject=function(r,i){i||(i={});var a={};return i.defaults&&(a.key="",a.value=""),r.key!=null&&r.hasOwnProperty("key")&&(a.key=r.key),r.value!=null&&r.hasOwnProperty("value")&&(a.value=r.value),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.StringStringEntryProto"},s})(),c.TensorAnnotation=(function(){function s(r){if(this.quantParameterTensorNames=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.tensorName="",s.prototype.quantParameterTensorNames=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.tensorName!=null&&Object.hasOwnProperty.call(r,"tensorName")&&i.uint32(10).string(r.tensorName),r.quantParameterTensorNames!=null&&r.quantParameterTensorNames.length)for(var a=0;a<r.quantParameterTensorNames.length;++a)d.onnx.StringStringEntryProto.encode(r.quantParameterTensorNames[a],i.uint32(18).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorAnnotation;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.tensorName=r.string();break}case 2:{p.quantParameterTensorNames&&p.quantParameterTensorNames.length||(p.quantParameterTensorNames=[]),p.quantParameterTensorNames.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.tensorName!=null&&r.hasOwnProperty("tensorName")&&!l.isString(r.tensorName))return"tensorName: string expected";if(r.quantParameterTensorNames!=null&&r.hasOwnProperty("quantParameterTensorNames")){if(!Array.isArray(r.quantParameterTensorNames))return"quantParameterTensorNames: array expected";for(var i=0;i<r.quantParameterTensorNames.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.quantParameterTensorNames[i]);if(a)return"quantParameterTensorNames."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorAnnotation)return r;var i=new d.onnx.TensorAnnotation;if(r.tensorName!=null&&(i.tensorName=String(r.tensorName)),r.quantParameterTensorNames){if(!Array.isArray(r.quantParameterTensorNames))throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: array expected");i.quantParameterTensorNames=[];for(var a=0;a<r.quantParameterTensorNames.length;++a){if(typeof r.quantParameterTensorNames[a]!="object")throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: object expected");i.quantParameterTensorNames[a]=d.onnx.StringStringEntryProto.fromObject(r.quantParameterTensorNames[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.quantParameterTensorNames=[]),i.defaults&&(a.tensorName=""),r.tensorName!=null&&r.hasOwnProperty("tensorName")&&(a.tensorName=r.tensorName),r.quantParameterTensorNames&&r.quantParameterTensorNames.length){a.quantParameterTensorNames=[];for(var p=0;p<r.quantParameterTensorNames.length;++p)a.quantParameterTensorNames[p]=d.onnx.StringStringEntryProto.toObject(r.quantParameterTensorNames[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorAnnotation"},s})(),c.GraphProto=(function(){function s(r){if(this.node=[],this.initializer=[],this.sparseInitializer=[],this.input=[],this.output=[],this.valueInfo=[],this.quantizationAnnotation=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.node=l.emptyArray,s.prototype.name="",s.prototype.initializer=l.emptyArray,s.prototype.sparseInitializer=l.emptyArray,s.prototype.docString="",s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.valueInfo=l.emptyArray,s.prototype.quantizationAnnotation=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.node!=null&&r.node.length)for(var a=0;a<r.node.length;++a)d.onnx.NodeProto.encode(r.node[a],i.uint32(10).fork()).ldelim();if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(18).string(r.name),r.initializer!=null&&r.initializer.length)for(var a=0;a<r.initializer.length;++a)d.onnx.TensorProto.encode(r.initializer[a],i.uint32(42).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(82).string(r.docString),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)d.onnx.ValueInfoProto.encode(r.input[a],i.uint32(90).fork()).ldelim();if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)d.onnx.ValueInfoProto.encode(r.output[a],i.uint32(98).fork()).ldelim();if(r.valueInfo!=null&&r.valueInfo.length)for(var a=0;a<r.valueInfo.length;++a)d.onnx.ValueInfoProto.encode(r.valueInfo[a],i.uint32(106).fork()).ldelim();if(r.quantizationAnnotation!=null&&r.quantizationAnnotation.length)for(var a=0;a<r.quantizationAnnotation.length;++a)d.onnx.TensorAnnotation.encode(r.quantizationAnnotation[a],i.uint32(114).fork()).ldelim();if(r.sparseInitializer!=null&&r.sparseInitializer.length)for(var a=0;a<r.sparseInitializer.length;++a)d.onnx.SparseTensorProto.encode(r.sparseInitializer[a],i.uint32(122).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.GraphProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.node&&p.node.length||(p.node=[]),p.node.push(d.onnx.NodeProto.decode(r,r.uint32()));break}case 2:{p.name=r.string();break}case 5:{p.initializer&&p.initializer.length||(p.initializer=[]),p.initializer.push(d.onnx.TensorProto.decode(r,r.uint32()));break}case 15:{p.sparseInitializer&&p.sparseInitializer.length||(p.sparseInitializer=[]),p.sparseInitializer.push(d.onnx.SparseTensorProto.decode(r,r.uint32()));break}case 10:{p.docString=r.string();break}case 11:{p.input&&p.input.length||(p.input=[]),p.input.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 12:{p.output&&p.output.length||(p.output=[]),p.output.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 13:{p.valueInfo&&p.valueInfo.length||(p.valueInfo=[]),p.valueInfo.push(d.onnx.ValueInfoProto.decode(r,r.uint32()));break}case 14:{p.quantizationAnnotation&&p.quantizationAnnotation.length||(p.quantizationAnnotation=[]),p.quantizationAnnotation.push(d.onnx.TensorAnnotation.decode(r,r.uint32()));break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.node!=null&&r.hasOwnProperty("node")){if(!Array.isArray(r.node))return"node: array expected";for(var i=0;i<r.node.length;++i){var a=d.onnx.NodeProto.verify(r.node[i]);if(a)return"node."+a}}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.initializer!=null&&r.hasOwnProperty("initializer")){if(!Array.isArray(r.initializer))return"initializer: array expected";for(var i=0;i<r.initializer.length;++i){var a=d.onnx.TensorProto.verify(r.initializer[i]);if(a)return"initializer."+a}}if(r.sparseInitializer!=null&&r.hasOwnProperty("sparseInitializer")){if(!Array.isArray(r.sparseInitializer))return"sparseInitializer: array expected";for(var i=0;i<r.sparseInitializer.length;++i){var a=d.onnx.SparseTensorProto.verify(r.sparseInitializer[i]);if(a)return"sparseInitializer."+a}}if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i){var a=d.onnx.ValueInfoProto.verify(r.input[i]);if(a)return"input."+a}}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i){var a=d.onnx.ValueInfoProto.verify(r.output[i]);if(a)return"output."+a}}if(r.valueInfo!=null&&r.hasOwnProperty("valueInfo")){if(!Array.isArray(r.valueInfo))return"valueInfo: array expected";for(var i=0;i<r.valueInfo.length;++i){var a=d.onnx.ValueInfoProto.verify(r.valueInfo[i]);if(a)return"valueInfo."+a}}if(r.quantizationAnnotation!=null&&r.hasOwnProperty("quantizationAnnotation")){if(!Array.isArray(r.quantizationAnnotation))return"quantizationAnnotation: array expected";for(var i=0;i<r.quantizationAnnotation.length;++i){var a=d.onnx.TensorAnnotation.verify(r.quantizationAnnotation[i]);if(a)return"quantizationAnnotation."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.GraphProto)return r;var i=new d.onnx.GraphProto;if(r.node){if(!Array.isArray(r.node))throw TypeError(".onnx.GraphProto.node: array expected");i.node=[];for(var a=0;a<r.node.length;++a){if(typeof r.node[a]!="object")throw TypeError(".onnx.GraphProto.node: object expected");i.node[a]=d.onnx.NodeProto.fromObject(r.node[a])}}if(r.name!=null&&(i.name=String(r.name)),r.initializer){if(!Array.isArray(r.initializer))throw TypeError(".onnx.GraphProto.initializer: array expected");i.initializer=[];for(var a=0;a<r.initializer.length;++a){if(typeof r.initializer[a]!="object")throw TypeError(".onnx.GraphProto.initializer: object expected");i.initializer[a]=d.onnx.TensorProto.fromObject(r.initializer[a])}}if(r.sparseInitializer){if(!Array.isArray(r.sparseInitializer))throw TypeError(".onnx.GraphProto.sparseInitializer: array expected");i.sparseInitializer=[];for(var a=0;a<r.sparseInitializer.length;++a){if(typeof r.sparseInitializer[a]!="object")throw TypeError(".onnx.GraphProto.sparseInitializer: object expected");i.sparseInitializer[a]=d.onnx.SparseTensorProto.fromObject(r.sparseInitializer[a])}}if(r.docString!=null&&(i.docString=String(r.docString)),r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.GraphProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a){if(typeof r.input[a]!="object")throw TypeError(".onnx.GraphProto.input: object expected");i.input[a]=d.onnx.ValueInfoProto.fromObject(r.input[a])}}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.GraphProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a){if(typeof r.output[a]!="object")throw TypeError(".onnx.GraphProto.output: object expected");i.output[a]=d.onnx.ValueInfoProto.fromObject(r.output[a])}}if(r.valueInfo){if(!Array.isArray(r.valueInfo))throw TypeError(".onnx.GraphProto.valueInfo: array expected");i.valueInfo=[];for(var a=0;a<r.valueInfo.length;++a){if(typeof r.valueInfo[a]!="object")throw TypeError(".onnx.GraphProto.valueInfo: object expected");i.valueInfo[a]=d.onnx.ValueInfoProto.fromObject(r.valueInfo[a])}}if(r.quantizationAnnotation){if(!Array.isArray(r.quantizationAnnotation))throw TypeError(".onnx.GraphProto.quantizationAnnotation: array expected");i.quantizationAnnotation=[];for(var a=0;a<r.quantizationAnnotation.length;++a){if(typeof r.quantizationAnnotation[a]!="object")throw TypeError(".onnx.GraphProto.quantizationAnnotation: object expected");i.quantizationAnnotation[a]=d.onnx.TensorAnnotation.fromObject(r.quantizationAnnotation[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.node=[],a.initializer=[],a.input=[],a.output=[],a.valueInfo=[],a.quantizationAnnotation=[],a.sparseInitializer=[]),i.defaults&&(a.name="",a.docString=""),r.node&&r.node.length){a.node=[];for(var p=0;p<r.node.length;++p)a.node[p]=d.onnx.NodeProto.toObject(r.node[p],i)}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.initializer&&r.initializer.length){a.initializer=[];for(var p=0;p<r.initializer.length;++p)a.initializer[p]=d.onnx.TensorProto.toObject(r.initializer[p],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=d.onnx.ValueInfoProto.toObject(r.input[p],i)}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=d.onnx.ValueInfoProto.toObject(r.output[p],i)}if(r.valueInfo&&r.valueInfo.length){a.valueInfo=[];for(var p=0;p<r.valueInfo.length;++p)a.valueInfo[p]=d.onnx.ValueInfoProto.toObject(r.valueInfo[p],i)}if(r.quantizationAnnotation&&r.quantizationAnnotation.length){a.quantizationAnnotation=[];for(var p=0;p<r.quantizationAnnotation.length;++p)a.quantizationAnnotation[p]=d.onnx.TensorAnnotation.toObject(r.quantizationAnnotation[p],i)}if(r.sparseInitializer&&r.sparseInitializer.length){a.sparseInitializer=[];for(var p=0;p<r.sparseInitializer.length;++p)a.sparseInitializer[p]=d.onnx.SparseTensorProto.toObject(r.sparseInitializer[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.GraphProto"},s})(),c.TensorProto=(function(){function s(r){if(this.dims=[],this.floatData=[],this.int32Data=[],this.stringData=[],this.int64Data=[],this.externalData=[],this.doubleData=[],this.uint64Data=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.dims=l.emptyArray,s.prototype.dataType=0,s.prototype.segment=null,s.prototype.floatData=l.emptyArray,s.prototype.int32Data=l.emptyArray,s.prototype.stringData=l.emptyArray,s.prototype.int64Data=l.emptyArray,s.prototype.name="",s.prototype.docString="",s.prototype.rawData=l.newBuffer([]),s.prototype.externalData=l.emptyArray,s.prototype.dataLocation=0,s.prototype.doubleData=l.emptyArray,s.prototype.uint64Data=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.dims!=null&&r.dims.length){i.uint32(10).fork();for(var a=0;a<r.dims.length;++a)i.int64(r.dims[a]);i.ldelim()}if(r.dataType!=null&&Object.hasOwnProperty.call(r,"dataType")&&i.uint32(16).int32(r.dataType),r.segment!=null&&Object.hasOwnProperty.call(r,"segment")&&d.onnx.TensorProto.Segment.encode(r.segment,i.uint32(26).fork()).ldelim(),r.floatData!=null&&r.floatData.length){i.uint32(34).fork();for(var a=0;a<r.floatData.length;++a)i.float(r.floatData[a]);i.ldelim()}if(r.int32Data!=null&&r.int32Data.length){i.uint32(42).fork();for(var a=0;a<r.int32Data.length;++a)i.int32(r.int32Data[a]);i.ldelim()}if(r.stringData!=null&&r.stringData.length)for(var a=0;a<r.stringData.length;++a)i.uint32(50).bytes(r.stringData[a]);if(r.int64Data!=null&&r.int64Data.length){i.uint32(58).fork();for(var a=0;a<r.int64Data.length;++a)i.int64(r.int64Data[a]);i.ldelim()}if(r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(66).string(r.name),r.rawData!=null&&Object.hasOwnProperty.call(r,"rawData")&&i.uint32(74).bytes(r.rawData),r.doubleData!=null&&r.doubleData.length){i.uint32(82).fork();for(var a=0;a<r.doubleData.length;++a)i.double(r.doubleData[a]);i.ldelim()}if(r.uint64Data!=null&&r.uint64Data.length){i.uint32(90).fork();for(var a=0;a<r.uint64Data.length;++a)i.uint64(r.uint64Data[a]);i.ldelim()}if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(98).string(r.docString),r.externalData!=null&&r.externalData.length)for(var a=0;a<r.externalData.length;++a)d.onnx.StringStringEntryProto.encode(r.externalData[a],i.uint32(106).fork()).ldelim();return r.dataLocation!=null&&Object.hasOwnProperty.call(r,"dataLocation")&&i.uint32(112).int32(r.dataLocation),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{if(p.dims&&p.dims.length||(p.dims=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.dims.push(r.int64());else p.dims.push(r.int64());break}case 2:{p.dataType=r.int32();break}case 3:{p.segment=d.onnx.TensorProto.Segment.decode(r,r.uint32());break}case 4:{if(p.floatData&&p.floatData.length||(p.floatData=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.floatData.push(r.float());else p.floatData.push(r.float());break}case 5:{if(p.int32Data&&p.int32Data.length||(p.int32Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.int32Data.push(r.int32());else p.int32Data.push(r.int32());break}case 6:{p.stringData&&p.stringData.length||(p.stringData=[]),p.stringData.push(r.bytes());break}case 7:{if(p.int64Data&&p.int64Data.length||(p.int64Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.int64Data.push(r.int64());else p.int64Data.push(r.int64());break}case 8:{p.name=r.string();break}case 12:{p.docString=r.string();break}case 9:{p.rawData=r.bytes();break}case 13:{p.externalData&&p.externalData.length||(p.externalData=[]),p.externalData.push(d.onnx.StringStringEntryProto.decode(r,r.uint32()));break}case 14:{p.dataLocation=r.int32();break}case 10:{if(p.doubleData&&p.doubleData.length||(p.doubleData=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.doubleData.push(r.double());else p.doubleData.push(r.double());break}case 11:{if(p.uint64Data&&p.uint64Data.length||(p.uint64Data=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.uint64Data.push(r.uint64());else p.uint64Data.push(r.uint64());break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.dims!=null&&r.hasOwnProperty("dims")){if(!Array.isArray(r.dims))return"dims: array expected";for(var i=0;i<r.dims.length;++i)if(!l.isInteger(r.dims[i])&&!(r.dims[i]&&l.isInteger(r.dims[i].low)&&l.isInteger(r.dims[i].high)))return"dims: integer|Long[] expected"}if(r.dataType!=null&&r.hasOwnProperty("dataType")&&!l.isInteger(r.dataType))return"dataType: integer expected";if(r.segment!=null&&r.hasOwnProperty("segment")){var a=d.onnx.TensorProto.Segment.verify(r.segment);if(a)return"segment."+a}if(r.floatData!=null&&r.hasOwnProperty("floatData")){if(!Array.isArray(r.floatData))return"floatData: array expected";for(var i=0;i<r.floatData.length;++i)if(typeof r.floatData[i]!="number")return"floatData: number[] expected"}if(r.int32Data!=null&&r.hasOwnProperty("int32Data")){if(!Array.isArray(r.int32Data))return"int32Data: array expected";for(var i=0;i<r.int32Data.length;++i)if(!l.isInteger(r.int32Data[i]))return"int32Data: integer[] expected"}if(r.stringData!=null&&r.hasOwnProperty("stringData")){if(!Array.isArray(r.stringData))return"stringData: array expected";for(var i=0;i<r.stringData.length;++i)if(!(r.stringData[i]&&typeof r.stringData[i].length=="number"||l.isString(r.stringData[i])))return"stringData: buffer[] expected"}if(r.int64Data!=null&&r.hasOwnProperty("int64Data")){if(!Array.isArray(r.int64Data))return"int64Data: array expected";for(var i=0;i<r.int64Data.length;++i)if(!l.isInteger(r.int64Data[i])&&!(r.int64Data[i]&&l.isInteger(r.int64Data[i].low)&&l.isInteger(r.int64Data[i].high)))return"int64Data: integer|Long[] expected"}if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.rawData!=null&&r.hasOwnProperty("rawData")&&!(r.rawData&&typeof r.rawData.length=="number"||l.isString(r.rawData)))return"rawData: buffer expected";if(r.externalData!=null&&r.hasOwnProperty("externalData")){if(!Array.isArray(r.externalData))return"externalData: array expected";for(var i=0;i<r.externalData.length;++i){var a=d.onnx.StringStringEntryProto.verify(r.externalData[i]);if(a)return"externalData."+a}}if(r.dataLocation!=null&&r.hasOwnProperty("dataLocation"))switch(r.dataLocation){default:return"dataLocation: enum value expected";case 0:case 1:break}if(r.doubleData!=null&&r.hasOwnProperty("doubleData")){if(!Array.isArray(r.doubleData))return"doubleData: array expected";for(var i=0;i<r.doubleData.length;++i)if(typeof r.doubleData[i]!="number")return"doubleData: number[] expected"}if(r.uint64Data!=null&&r.hasOwnProperty("uint64Data")){if(!Array.isArray(r.uint64Data))return"uint64Data: array expected";for(var i=0;i<r.uint64Data.length;++i)if(!l.isInteger(r.uint64Data[i])&&!(r.uint64Data[i]&&l.isInteger(r.uint64Data[i].low)&&l.isInteger(r.uint64Data[i].high)))return"uint64Data: integer|Long[] expected"}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorProto)return r;var i=new d.onnx.TensorProto;if(r.dims){if(!Array.isArray(r.dims))throw TypeError(".onnx.TensorProto.dims: array expected");i.dims=[];for(var a=0;a<r.dims.length;++a)l.Long?(i.dims[a]=l.Long.fromValue(r.dims[a])).unsigned=!1:typeof r.dims[a]=="string"?i.dims[a]=parseInt(r.dims[a],10):typeof r.dims[a]=="number"?i.dims[a]=r.dims[a]:typeof r.dims[a]=="object"&&(i.dims[a]=new l.LongBits(r.dims[a].low>>>0,r.dims[a].high>>>0).toNumber())}if(r.dataType!=null&&(i.dataType=r.dataType|0),r.segment!=null){if(typeof r.segment!="object")throw TypeError(".onnx.TensorProto.segment: object expected");i.segment=d.onnx.TensorProto.Segment.fromObject(r.segment)}if(r.floatData){if(!Array.isArray(r.floatData))throw TypeError(".onnx.TensorProto.floatData: array expected");i.floatData=[];for(var a=0;a<r.floatData.length;++a)i.floatData[a]=Number(r.floatData[a])}if(r.int32Data){if(!Array.isArray(r.int32Data))throw TypeError(".onnx.TensorProto.int32Data: array expected");i.int32Data=[];for(var a=0;a<r.int32Data.length;++a)i.int32Data[a]=r.int32Data[a]|0}if(r.stringData){if(!Array.isArray(r.stringData))throw TypeError(".onnx.TensorProto.stringData: array expected");i.stringData=[];for(var a=0;a<r.stringData.length;++a)typeof r.stringData[a]=="string"?l.base64.decode(r.stringData[a],i.stringData[a]=l.newBuffer(l.base64.length(r.stringData[a])),0):r.stringData[a].length>=0&&(i.stringData[a]=r.stringData[a])}if(r.int64Data){if(!Array.isArray(r.int64Data))throw TypeError(".onnx.TensorProto.int64Data: array expected");i.int64Data=[];for(var a=0;a<r.int64Data.length;++a)l.Long?(i.int64Data[a]=l.Long.fromValue(r.int64Data[a])).unsigned=!1:typeof r.int64Data[a]=="string"?i.int64Data[a]=parseInt(r.int64Data[a],10):typeof r.int64Data[a]=="number"?i.int64Data[a]=r.int64Data[a]:typeof r.int64Data[a]=="object"&&(i.int64Data[a]=new l.LongBits(r.int64Data[a].low>>>0,r.int64Data[a].high>>>0).toNumber())}if(r.name!=null&&(i.name=String(r.name)),r.docString!=null&&(i.docString=String(r.docString)),r.rawData!=null&&(typeof r.rawData=="string"?l.base64.decode(r.rawData,i.rawData=l.newBuffer(l.base64.length(r.rawData)),0):r.rawData.length>=0&&(i.rawData=r.rawData)),r.externalData){if(!Array.isArray(r.externalData))throw TypeError(".onnx.TensorProto.externalData: array expected");i.externalData=[];for(var a=0;a<r.externalData.length;++a){if(typeof r.externalData[a]!="object")throw TypeError(".onnx.TensorProto.externalData: object expected");i.externalData[a]=d.onnx.StringStringEntryProto.fromObject(r.externalData[a])}}switch(r.dataLocation){default:if(typeof r.dataLocation=="number"){i.dataLocation=r.dataLocation;break}break;case"DEFAULT":case 0:i.dataLocation=0;break;case"EXTERNAL":case 1:i.dataLocation=1;break}if(r.doubleData){if(!Array.isArray(r.doubleData))throw TypeError(".onnx.TensorProto.doubleData: array expected");i.doubleData=[];for(var a=0;a<r.doubleData.length;++a)i.doubleData[a]=Number(r.doubleData[a])}if(r.uint64Data){if(!Array.isArray(r.uint64Data))throw TypeError(".onnx.TensorProto.uint64Data: array expected");i.uint64Data=[];for(var a=0;a<r.uint64Data.length;++a)l.Long?(i.uint64Data[a]=l.Long.fromValue(r.uint64Data[a])).unsigned=!0:typeof r.uint64Data[a]=="string"?i.uint64Data[a]=parseInt(r.uint64Data[a],10):typeof r.uint64Data[a]=="number"?i.uint64Data[a]=r.uint64Data[a]:typeof r.uint64Data[a]=="object"&&(i.uint64Data[a]=new l.LongBits(r.uint64Data[a].low>>>0,r.uint64Data[a].high>>>0).toNumber(!0))}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dims=[],a.floatData=[],a.int32Data=[],a.stringData=[],a.int64Data=[],a.doubleData=[],a.uint64Data=[],a.externalData=[]),i.defaults&&(a.dataType=0,a.segment=null,a.name="",i.bytes===String?a.rawData="":(a.rawData=[],i.bytes!==Array&&(a.rawData=l.newBuffer(a.rawData))),a.docString="",a.dataLocation=i.enums===String?"DEFAULT":0),r.dims&&r.dims.length){a.dims=[];for(var p=0;p<r.dims.length;++p)typeof r.dims[p]=="number"?a.dims[p]=i.longs===String?String(r.dims[p]):r.dims[p]:a.dims[p]=i.longs===String?l.Long.prototype.toString.call(r.dims[p]):i.longs===Number?new l.LongBits(r.dims[p].low>>>0,r.dims[p].high>>>0).toNumber():r.dims[p]}if(r.dataType!=null&&r.hasOwnProperty("dataType")&&(a.dataType=r.dataType),r.segment!=null&&r.hasOwnProperty("segment")&&(a.segment=d.onnx.TensorProto.Segment.toObject(r.segment,i)),r.floatData&&r.floatData.length){a.floatData=[];for(var p=0;p<r.floatData.length;++p)a.floatData[p]=i.json&&!isFinite(r.floatData[p])?String(r.floatData[p]):r.floatData[p]}if(r.int32Data&&r.int32Data.length){a.int32Data=[];for(var p=0;p<r.int32Data.length;++p)a.int32Data[p]=r.int32Data[p]}if(r.stringData&&r.stringData.length){a.stringData=[];for(var p=0;p<r.stringData.length;++p)a.stringData[p]=i.bytes===String?l.base64.encode(r.stringData[p],0,r.stringData[p].length):i.bytes===Array?Array.prototype.slice.call(r.stringData[p]):r.stringData[p]}if(r.int64Data&&r.int64Data.length){a.int64Data=[];for(var p=0;p<r.int64Data.length;++p)typeof r.int64Data[p]=="number"?a.int64Data[p]=i.longs===String?String(r.int64Data[p]):r.int64Data[p]:a.int64Data[p]=i.longs===String?l.Long.prototype.toString.call(r.int64Data[p]):i.longs===Number?new l.LongBits(r.int64Data[p].low>>>0,r.int64Data[p].high>>>0).toNumber():r.int64Data[p]}if(r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.rawData!=null&&r.hasOwnProperty("rawData")&&(a.rawData=i.bytes===String?l.base64.encode(r.rawData,0,r.rawData.length):i.bytes===Array?Array.prototype.slice.call(r.rawData):r.rawData),r.doubleData&&r.doubleData.length){a.doubleData=[];for(var p=0;p<r.doubleData.length;++p)a.doubleData[p]=i.json&&!isFinite(r.doubleData[p])?String(r.doubleData[p]):r.doubleData[p]}if(r.uint64Data&&r.uint64Data.length){a.uint64Data=[];for(var p=0;p<r.uint64Data.length;++p)typeof r.uint64Data[p]=="number"?a.uint64Data[p]=i.longs===String?String(r.uint64Data[p]):r.uint64Data[p]:a.uint64Data[p]=i.longs===String?l.Long.prototype.toString.call(r.uint64Data[p]):i.longs===Number?new l.LongBits(r.uint64Data[p].low>>>0,r.uint64Data[p].high>>>0).toNumber(!0):r.uint64Data[p]}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.externalData&&r.externalData.length){a.externalData=[];for(var p=0;p<r.externalData.length;++p)a.externalData[p]=d.onnx.StringStringEntryProto.toObject(r.externalData[p],i)}return r.dataLocation!=null&&r.hasOwnProperty("dataLocation")&&(a.dataLocation=i.enums===String?d.onnx.TensorProto.DataLocation[r.dataLocation]===void 0?r.dataLocation:d.onnx.TensorProto.DataLocation[r.dataLocation]:r.dataLocation),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorProto"},s.DataType=(function(){var r={},i=Object.create(r);return i[r[0]="UNDEFINED"]=0,i[r[1]="FLOAT"]=1,i[r[2]="UINT8"]=2,i[r[3]="INT8"]=3,i[r[4]="UINT16"]=4,i[r[5]="INT16"]=5,i[r[6]="INT32"]=6,i[r[7]="INT64"]=7,i[r[8]="STRING"]=8,i[r[9]="BOOL"]=9,i[r[10]="FLOAT16"]=10,i[r[11]="DOUBLE"]=11,i[r[12]="UINT32"]=12,i[r[13]="UINT64"]=13,i[r[14]="COMPLEX64"]=14,i[r[15]="COMPLEX128"]=15,i[r[16]="BFLOAT16"]=16,i[r[17]="FLOAT8E4M3FN"]=17,i[r[18]="FLOAT8E4M3FNUZ"]=18,i[r[19]="FLOAT8E5M2"]=19,i[r[20]="FLOAT8E5M2FNUZ"]=20,i})(),s.Segment=(function(){function r(i){if(i)for(var a=Object.keys(i),p=0;p<a.length;++p)i[a[p]]!=null&&(this[a[p]]=i[a[p]])}return r.prototype.begin=l.Long?l.Long.fromBits(0,0,!1):0,r.prototype.end=l.Long?l.Long.fromBits(0,0,!1):0,r.create=function(i){return new r(i)},r.encode=function(i,a){return a||(a=u.create()),i.begin!=null&&Object.hasOwnProperty.call(i,"begin")&&a.uint32(8).int64(i.begin),i.end!=null&&Object.hasOwnProperty.call(i,"end")&&a.uint32(16).int64(i.end),a},r.encodeDelimited=function(i,a){return this.encode(i,a).ldelim()},r.decode=function(i,a){i instanceof o||(i=o.create(i));for(var p=a===void 0?i.len:i.pos+a,h=new d.onnx.TensorProto.Segment;i.pos<p;){var m=i.uint32();switch(m>>>3){case 1:{h.begin=i.int64();break}case 2:{h.end=i.int64();break}default:i.skipType(m&7);break}}return h},r.decodeDelimited=function(i){return i instanceof o||(i=new o(i)),this.decode(i,i.uint32())},r.verify=function(i){return typeof i!="object"||i===null?"object expected":i.begin!=null&&i.hasOwnProperty("begin")&&!l.isInteger(i.begin)&&!(i.begin&&l.isInteger(i.begin.low)&&l.isInteger(i.begin.high))?"begin: integer|Long expected":i.end!=null&&i.hasOwnProperty("end")&&!l.isInteger(i.end)&&!(i.end&&l.isInteger(i.end.low)&&l.isInteger(i.end.high))?"end: integer|Long expected":null},r.fromObject=function(i){if(i instanceof d.onnx.TensorProto.Segment)return i;var a=new d.onnx.TensorProto.Segment;return i.begin!=null&&(l.Long?(a.begin=l.Long.fromValue(i.begin)).unsigned=!1:typeof i.begin=="string"?a.begin=parseInt(i.begin,10):typeof i.begin=="number"?a.begin=i.begin:typeof i.begin=="object"&&(a.begin=new l.LongBits(i.begin.low>>>0,i.begin.high>>>0).toNumber())),i.end!=null&&(l.Long?(a.end=l.Long.fromValue(i.end)).unsigned=!1:typeof i.end=="string"?a.end=parseInt(i.end,10):typeof i.end=="number"?a.end=i.end:typeof i.end=="object"&&(a.end=new l.LongBits(i.end.low>>>0,i.end.high>>>0).toNumber())),a},r.toObject=function(i,a){a||(a={});var p={};if(a.defaults){if(l.Long){var h=new l.Long(0,0,!1);p.begin=a.longs===String?h.toString():a.longs===Number?h.toNumber():h}else p.begin=a.longs===String?"0":0;if(l.Long){var h=new l.Long(0,0,!1);p.end=a.longs===String?h.toString():a.longs===Number?h.toNumber():h}else p.end=a.longs===String?"0":0}return i.begin!=null&&i.hasOwnProperty("begin")&&(typeof i.begin=="number"?p.begin=a.longs===String?String(i.begin):i.begin:p.begin=a.longs===String?l.Long.prototype.toString.call(i.begin):a.longs===Number?new l.LongBits(i.begin.low>>>0,i.begin.high>>>0).toNumber():i.begin),i.end!=null&&i.hasOwnProperty("end")&&(typeof i.end=="number"?p.end=a.longs===String?String(i.end):i.end:p.end=a.longs===String?l.Long.prototype.toString.call(i.end):a.longs===Number?new l.LongBits(i.end.low>>>0,i.end.high>>>0).toNumber():i.end),p},r.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},r.getTypeUrl=function(i){return i===void 0&&(i="type.googleapis.com"),i+"/onnx.TensorProto.Segment"},r})(),s.DataLocation=(function(){var r={},i=Object.create(r);return i[r[0]="DEFAULT"]=0,i[r[1]="EXTERNAL"]=1,i})(),s})(),c.SparseTensorProto=(function(){function s(r){if(this.dims=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.values=null,s.prototype.indices=null,s.prototype.dims=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.values!=null&&Object.hasOwnProperty.call(r,"values")&&d.onnx.TensorProto.encode(r.values,i.uint32(10).fork()).ldelim(),r.indices!=null&&Object.hasOwnProperty.call(r,"indices")&&d.onnx.TensorProto.encode(r.indices,i.uint32(18).fork()).ldelim(),r.dims!=null&&r.dims.length){i.uint32(26).fork();for(var a=0;a<r.dims.length;++a)i.int64(r.dims[a]);i.ldelim()}return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.SparseTensorProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.values=d.onnx.TensorProto.decode(r,r.uint32());break}case 2:{p.indices=d.onnx.TensorProto.decode(r,r.uint32());break}case 3:{if(p.dims&&p.dims.length||(p.dims=[]),(h&7)===2)for(var m=r.uint32()+r.pos;r.pos<m;)p.dims.push(r.int64());else p.dims.push(r.int64());break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.values!=null&&r.hasOwnProperty("values")){var i=d.onnx.TensorProto.verify(r.values);if(i)return"values."+i}if(r.indices!=null&&r.hasOwnProperty("indices")){var i=d.onnx.TensorProto.verify(r.indices);if(i)return"indices."+i}if(r.dims!=null&&r.hasOwnProperty("dims")){if(!Array.isArray(r.dims))return"dims: array expected";for(var a=0;a<r.dims.length;++a)if(!l.isInteger(r.dims[a])&&!(r.dims[a]&&l.isInteger(r.dims[a].low)&&l.isInteger(r.dims[a].high)))return"dims: integer|Long[] expected"}return null},s.fromObject=function(r){if(r instanceof d.onnx.SparseTensorProto)return r;var i=new d.onnx.SparseTensorProto;if(r.values!=null){if(typeof r.values!="object")throw TypeError(".onnx.SparseTensorProto.values: object expected");i.values=d.onnx.TensorProto.fromObject(r.values)}if(r.indices!=null){if(typeof r.indices!="object")throw TypeError(".onnx.SparseTensorProto.indices: object expected");i.indices=d.onnx.TensorProto.fromObject(r.indices)}if(r.dims){if(!Array.isArray(r.dims))throw TypeError(".onnx.SparseTensorProto.dims: array expected");i.dims=[];for(var a=0;a<r.dims.length;++a)l.Long?(i.dims[a]=l.Long.fromValue(r.dims[a])).unsigned=!1:typeof r.dims[a]=="string"?i.dims[a]=parseInt(r.dims[a],10):typeof r.dims[a]=="number"?i.dims[a]=r.dims[a]:typeof r.dims[a]=="object"&&(i.dims[a]=new l.LongBits(r.dims[a].low>>>0,r.dims[a].high>>>0).toNumber())}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dims=[]),i.defaults&&(a.values=null,a.indices=null),r.values!=null&&r.hasOwnProperty("values")&&(a.values=d.onnx.TensorProto.toObject(r.values,i)),r.indices!=null&&r.hasOwnProperty("indices")&&(a.indices=d.onnx.TensorProto.toObject(r.indices,i)),r.dims&&r.dims.length){a.dims=[];for(var p=0;p<r.dims.length;++p)typeof r.dims[p]=="number"?a.dims[p]=i.longs===String?String(r.dims[p]):r.dims[p]:a.dims[p]=i.longs===String?l.Long.prototype.toString.call(r.dims[p]):i.longs===Number?new l.LongBits(r.dims[p].low>>>0,r.dims[p].high>>>0).toNumber():r.dims[p]}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.SparseTensorProto"},s})(),c.TensorShapeProto=(function(){function s(r){if(this.dim=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.dim=l.emptyArray,s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.dim!=null&&r.dim.length)for(var a=0;a<r.dim.length;++a)d.onnx.TensorShapeProto.Dimension.encode(r.dim[a],i.uint32(10).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.TensorShapeProto;r.pos<a;){var h=r.uint32();h>>>3===1?(p.dim&&p.dim.length||(p.dim=[]),p.dim.push(d.onnx.TensorShapeProto.Dimension.decode(r,r.uint32()))):r.skipType(h&7)}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.dim!=null&&r.hasOwnProperty("dim")){if(!Array.isArray(r.dim))return"dim: array expected";for(var i=0;i<r.dim.length;++i){var a=d.onnx.TensorShapeProto.Dimension.verify(r.dim[i]);if(a)return"dim."+a}}return null},s.fromObject=function(r){if(r instanceof d.onnx.TensorShapeProto)return r;var i=new d.onnx.TensorShapeProto;if(r.dim){if(!Array.isArray(r.dim))throw TypeError(".onnx.TensorShapeProto.dim: array expected");i.dim=[];for(var a=0;a<r.dim.length;++a){if(typeof r.dim[a]!="object")throw TypeError(".onnx.TensorShapeProto.dim: object expected");i.dim[a]=d.onnx.TensorShapeProto.Dimension.fromObject(r.dim[a])}}return i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.dim=[]),r.dim&&r.dim.length){a.dim=[];for(var p=0;p<r.dim.length;++p)a.dim[p]=d.onnx.TensorShapeProto.Dimension.toObject(r.dim[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.TensorShapeProto"},s.Dimension=(function(){function r(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}r.prototype.dimValue=null,r.prototype.dimParam=null,r.prototype.denotation="";var i;return Object.defineProperty(r.prototype,"value",{get:l.oneOfGetter(i=["dimValue","dimParam"]),set:l.oneOfSetter(i)}),r.create=function(a){return new r(a)},r.encode=function(a,p){return p||(p=u.create()),a.dimValue!=null&&Object.hasOwnProperty.call(a,"dimValue")&&p.uint32(8).int64(a.dimValue),a.dimParam!=null&&Object.hasOwnProperty.call(a,"dimParam")&&p.uint32(18).string(a.dimParam),a.denotation!=null&&Object.hasOwnProperty.call(a,"denotation")&&p.uint32(26).string(a.denotation),p},r.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},r.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TensorShapeProto.Dimension;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.dimValue=a.int64();break}case 2:{m.dimParam=a.string();break}case 3:{m.denotation=a.string();break}default:a.skipType(b&7);break}}return m},r.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},r.verify=function(a){if(typeof a!="object"||a===null)return"object expected";var p={};if(a.dimValue!=null&&a.hasOwnProperty("dimValue")&&(p.value=1,!l.isInteger(a.dimValue)&&!(a.dimValue&&l.isInteger(a.dimValue.low)&&l.isInteger(a.dimValue.high))))return"dimValue: integer|Long expected";if(a.dimParam!=null&&a.hasOwnProperty("dimParam")){if(p.value===1)return"value: multiple values";if(p.value=1,!l.isString(a.dimParam))return"dimParam: string expected"}return a.denotation!=null&&a.hasOwnProperty("denotation")&&!l.isString(a.denotation)?"denotation: string expected":null},r.fromObject=function(a){if(a instanceof d.onnx.TensorShapeProto.Dimension)return a;var p=new d.onnx.TensorShapeProto.Dimension;return a.dimValue!=null&&(l.Long?(p.dimValue=l.Long.fromValue(a.dimValue)).unsigned=!1:typeof a.dimValue=="string"?p.dimValue=parseInt(a.dimValue,10):typeof a.dimValue=="number"?p.dimValue=a.dimValue:typeof a.dimValue=="object"&&(p.dimValue=new l.LongBits(a.dimValue.low>>>0,a.dimValue.high>>>0).toNumber())),a.dimParam!=null&&(p.dimParam=String(a.dimParam)),a.denotation!=null&&(p.denotation=String(a.denotation)),p},r.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.denotation=""),a.dimValue!=null&&a.hasOwnProperty("dimValue")&&(typeof a.dimValue=="number"?h.dimValue=p.longs===String?String(a.dimValue):a.dimValue:h.dimValue=p.longs===String?l.Long.prototype.toString.call(a.dimValue):p.longs===Number?new l.LongBits(a.dimValue.low>>>0,a.dimValue.high>>>0).toNumber():a.dimValue,p.oneofs&&(h.value="dimValue")),a.dimParam!=null&&a.hasOwnProperty("dimParam")&&(h.dimParam=a.dimParam,p.oneofs&&(h.value="dimParam")),a.denotation!=null&&a.hasOwnProperty("denotation")&&(h.denotation=a.denotation),h},r.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},r.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TensorShapeProto.Dimension"},r})(),s})(),c.TypeProto=(function(){function s(i){if(i)for(var a=Object.keys(i),p=0;p<a.length;++p)i[a[p]]!=null&&(this[a[p]]=i[a[p]])}s.prototype.tensorType=null,s.prototype.sequenceType=null,s.prototype.mapType=null,s.prototype.optionalType=null,s.prototype.sparseTensorType=null,s.prototype.denotation="";var r;return Object.defineProperty(s.prototype,"value",{get:l.oneOfGetter(r=["tensorType","sequenceType","mapType","optionalType","sparseTensorType"]),set:l.oneOfSetter(r)}),s.create=function(i){return new s(i)},s.encode=function(i,a){return a||(a=u.create()),i.tensorType!=null&&Object.hasOwnProperty.call(i,"tensorType")&&d.onnx.TypeProto.Tensor.encode(i.tensorType,a.uint32(10).fork()).ldelim(),i.sequenceType!=null&&Object.hasOwnProperty.call(i,"sequenceType")&&d.onnx.TypeProto.Sequence.encode(i.sequenceType,a.uint32(34).fork()).ldelim(),i.mapType!=null&&Object.hasOwnProperty.call(i,"mapType")&&d.onnx.TypeProto.Map.encode(i.mapType,a.uint32(42).fork()).ldelim(),i.denotation!=null&&Object.hasOwnProperty.call(i,"denotation")&&a.uint32(50).string(i.denotation),i.sparseTensorType!=null&&Object.hasOwnProperty.call(i,"sparseTensorType")&&d.onnx.TypeProto.SparseTensor.encode(i.sparseTensorType,a.uint32(66).fork()).ldelim(),i.optionalType!=null&&Object.hasOwnProperty.call(i,"optionalType")&&d.onnx.TypeProto.Optional.encode(i.optionalType,a.uint32(74).fork()).ldelim(),a},s.encodeDelimited=function(i,a){return this.encode(i,a).ldelim()},s.decode=function(i,a){i instanceof o||(i=o.create(i));for(var p=a===void 0?i.len:i.pos+a,h=new d.onnx.TypeProto;i.pos<p;){var m=i.uint32();switch(m>>>3){case 1:{h.tensorType=d.onnx.TypeProto.Tensor.decode(i,i.uint32());break}case 4:{h.sequenceType=d.onnx.TypeProto.Sequence.decode(i,i.uint32());break}case 5:{h.mapType=d.onnx.TypeProto.Map.decode(i,i.uint32());break}case 9:{h.optionalType=d.onnx.TypeProto.Optional.decode(i,i.uint32());break}case 8:{h.sparseTensorType=d.onnx.TypeProto.SparseTensor.decode(i,i.uint32());break}case 6:{h.denotation=i.string();break}default:i.skipType(m&7);break}}return h},s.decodeDelimited=function(i){return i instanceof o||(i=new o(i)),this.decode(i,i.uint32())},s.verify=function(i){if(typeof i!="object"||i===null)return"object expected";var a={};if(i.tensorType!=null&&i.hasOwnProperty("tensorType")){a.value=1;{var p=d.onnx.TypeProto.Tensor.verify(i.tensorType);if(p)return"tensorType."+p}}if(i.sequenceType!=null&&i.hasOwnProperty("sequenceType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Sequence.verify(i.sequenceType);if(p)return"sequenceType."+p}}if(i.mapType!=null&&i.hasOwnProperty("mapType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Map.verify(i.mapType);if(p)return"mapType."+p}}if(i.optionalType!=null&&i.hasOwnProperty("optionalType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.Optional.verify(i.optionalType);if(p)return"optionalType."+p}}if(i.sparseTensorType!=null&&i.hasOwnProperty("sparseTensorType")){if(a.value===1)return"value: multiple values";a.value=1;{var p=d.onnx.TypeProto.SparseTensor.verify(i.sparseTensorType);if(p)return"sparseTensorType."+p}}return i.denotation!=null&&i.hasOwnProperty("denotation")&&!l.isString(i.denotation)?"denotation: string expected":null},s.fromObject=function(i){if(i instanceof d.onnx.TypeProto)return i;var a=new d.onnx.TypeProto;if(i.tensorType!=null){if(typeof i.tensorType!="object")throw TypeError(".onnx.TypeProto.tensorType: object expected");a.tensorType=d.onnx.TypeProto.Tensor.fromObject(i.tensorType)}if(i.sequenceType!=null){if(typeof i.sequenceType!="object")throw TypeError(".onnx.TypeProto.sequenceType: object expected");a.sequenceType=d.onnx.TypeProto.Sequence.fromObject(i.sequenceType)}if(i.mapType!=null){if(typeof i.mapType!="object")throw TypeError(".onnx.TypeProto.mapType: object expected");a.mapType=d.onnx.TypeProto.Map.fromObject(i.mapType)}if(i.optionalType!=null){if(typeof i.optionalType!="object")throw TypeError(".onnx.TypeProto.optionalType: object expected");a.optionalType=d.onnx.TypeProto.Optional.fromObject(i.optionalType)}if(i.sparseTensorType!=null){if(typeof i.sparseTensorType!="object")throw TypeError(".onnx.TypeProto.sparseTensorType: object expected");a.sparseTensorType=d.onnx.TypeProto.SparseTensor.fromObject(i.sparseTensorType)}return i.denotation!=null&&(a.denotation=String(i.denotation)),a},s.toObject=function(i,a){a||(a={});var p={};return a.defaults&&(p.denotation=""),i.tensorType!=null&&i.hasOwnProperty("tensorType")&&(p.tensorType=d.onnx.TypeProto.Tensor.toObject(i.tensorType,a),a.oneofs&&(p.value="tensorType")),i.sequenceType!=null&&i.hasOwnProperty("sequenceType")&&(p.sequenceType=d.onnx.TypeProto.Sequence.toObject(i.sequenceType,a),a.oneofs&&(p.value="sequenceType")),i.mapType!=null&&i.hasOwnProperty("mapType")&&(p.mapType=d.onnx.TypeProto.Map.toObject(i.mapType,a),a.oneofs&&(p.value="mapType")),i.denotation!=null&&i.hasOwnProperty("denotation")&&(p.denotation=i.denotation),i.sparseTensorType!=null&&i.hasOwnProperty("sparseTensorType")&&(p.sparseTensorType=d.onnx.TypeProto.SparseTensor.toObject(i.sparseTensorType,a),a.oneofs&&(p.value="sparseTensorType")),i.optionalType!=null&&i.hasOwnProperty("optionalType")&&(p.optionalType=d.onnx.TypeProto.Optional.toObject(i.optionalType,a),a.oneofs&&(p.value="optionalType")),p},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(i){return i===void 0&&(i="type.googleapis.com"),i+"/onnx.TypeProto"},s.Tensor=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=0,i.prototype.shape=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&p.uint32(8).int32(a.elemType),a.shape!=null&&Object.hasOwnProperty.call(a,"shape")&&d.onnx.TensorShapeProto.encode(a.shape,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Tensor;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.elemType=a.int32();break}case 2:{m.shape=d.onnx.TensorShapeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")&&!l.isInteger(a.elemType))return"elemType: integer expected";if(a.shape!=null&&a.hasOwnProperty("shape")){var p=d.onnx.TensorShapeProto.verify(a.shape);if(p)return"shape."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Tensor)return a;var p=new d.onnx.TypeProto.Tensor;if(a.elemType!=null&&(p.elemType=a.elemType|0),a.shape!=null){if(typeof a.shape!="object")throw TypeError(".onnx.TypeProto.Tensor.shape: object expected");p.shape=d.onnx.TensorShapeProto.fromObject(a.shape)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=0,h.shape=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=a.elemType),a.shape!=null&&a.hasOwnProperty("shape")&&(h.shape=d.onnx.TensorShapeProto.toObject(a.shape,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Tensor"},i})(),s.Sequence=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&d.onnx.TypeProto.encode(a.elemType,p.uint32(10).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Sequence;a.pos<h;){var b=a.uint32();b>>>3===1?m.elemType=d.onnx.TypeProto.decode(a,a.uint32()):a.skipType(b&7)}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")){var p=d.onnx.TypeProto.verify(a.elemType);if(p)return"elemType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Sequence)return a;var p=new d.onnx.TypeProto.Sequence;if(a.elemType!=null){if(typeof a.elemType!="object")throw TypeError(".onnx.TypeProto.Sequence.elemType: object expected");p.elemType=d.onnx.TypeProto.fromObject(a.elemType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=d.onnx.TypeProto.toObject(a.elemType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Sequence"},i})(),s.Map=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.keyType=0,i.prototype.valueType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.keyType!=null&&Object.hasOwnProperty.call(a,"keyType")&&p.uint32(8).int32(a.keyType),a.valueType!=null&&Object.hasOwnProperty.call(a,"valueType")&&d.onnx.TypeProto.encode(a.valueType,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Map;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.keyType=a.int32();break}case 2:{m.valueType=d.onnx.TypeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.keyType!=null&&a.hasOwnProperty("keyType")&&!l.isInteger(a.keyType))return"keyType: integer expected";if(a.valueType!=null&&a.hasOwnProperty("valueType")){var p=d.onnx.TypeProto.verify(a.valueType);if(p)return"valueType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Map)return a;var p=new d.onnx.TypeProto.Map;if(a.keyType!=null&&(p.keyType=a.keyType|0),a.valueType!=null){if(typeof a.valueType!="object")throw TypeError(".onnx.TypeProto.Map.valueType: object expected");p.valueType=d.onnx.TypeProto.fromObject(a.valueType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.keyType=0,h.valueType=null),a.keyType!=null&&a.hasOwnProperty("keyType")&&(h.keyType=a.keyType),a.valueType!=null&&a.hasOwnProperty("valueType")&&(h.valueType=d.onnx.TypeProto.toObject(a.valueType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Map"},i})(),s.Optional=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&d.onnx.TypeProto.encode(a.elemType,p.uint32(10).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.Optional;a.pos<h;){var b=a.uint32();b>>>3===1?m.elemType=d.onnx.TypeProto.decode(a,a.uint32()):a.skipType(b&7)}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")){var p=d.onnx.TypeProto.verify(a.elemType);if(p)return"elemType."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.Optional)return a;var p=new d.onnx.TypeProto.Optional;if(a.elemType!=null){if(typeof a.elemType!="object")throw TypeError(".onnx.TypeProto.Optional.elemType: object expected");p.elemType=d.onnx.TypeProto.fromObject(a.elemType)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=d.onnx.TypeProto.toObject(a.elemType,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.Optional"},i})(),s.SparseTensor=(function(){function i(a){if(a)for(var p=Object.keys(a),h=0;h<p.length;++h)a[p[h]]!=null&&(this[p[h]]=a[p[h]])}return i.prototype.elemType=0,i.prototype.shape=null,i.create=function(a){return new i(a)},i.encode=function(a,p){return p||(p=u.create()),a.elemType!=null&&Object.hasOwnProperty.call(a,"elemType")&&p.uint32(8).int32(a.elemType),a.shape!=null&&Object.hasOwnProperty.call(a,"shape")&&d.onnx.TensorShapeProto.encode(a.shape,p.uint32(18).fork()).ldelim(),p},i.encodeDelimited=function(a,p){return this.encode(a,p).ldelim()},i.decode=function(a,p){a instanceof o||(a=o.create(a));for(var h=p===void 0?a.len:a.pos+p,m=new d.onnx.TypeProto.SparseTensor;a.pos<h;){var b=a.uint32();switch(b>>>3){case 1:{m.elemType=a.int32();break}case 2:{m.shape=d.onnx.TensorShapeProto.decode(a,a.uint32());break}default:a.skipType(b&7);break}}return m},i.decodeDelimited=function(a){return a instanceof o||(a=new o(a)),this.decode(a,a.uint32())},i.verify=function(a){if(typeof a!="object"||a===null)return"object expected";if(a.elemType!=null&&a.hasOwnProperty("elemType")&&!l.isInteger(a.elemType))return"elemType: integer expected";if(a.shape!=null&&a.hasOwnProperty("shape")){var p=d.onnx.TensorShapeProto.verify(a.shape);if(p)return"shape."+p}return null},i.fromObject=function(a){if(a instanceof d.onnx.TypeProto.SparseTensor)return a;var p=new d.onnx.TypeProto.SparseTensor;if(a.elemType!=null&&(p.elemType=a.elemType|0),a.shape!=null){if(typeof a.shape!="object")throw TypeError(".onnx.TypeProto.SparseTensor.shape: object expected");p.shape=d.onnx.TensorShapeProto.fromObject(a.shape)}return p},i.toObject=function(a,p){p||(p={});var h={};return p.defaults&&(h.elemType=0,h.shape=null),a.elemType!=null&&a.hasOwnProperty("elemType")&&(h.elemType=a.elemType),a.shape!=null&&a.hasOwnProperty("shape")&&(h.shape=d.onnx.TensorShapeProto.toObject(a.shape,p)),h},i.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},i.getTypeUrl=function(a){return a===void 0&&(a="type.googleapis.com"),a+"/onnx.TypeProto.SparseTensor"},i})(),s})(),c.OperatorSetIdProto=(function(){function s(r){if(r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.domain="",s.prototype.version=l.Long?l.Long.fromBits(0,0,!1):0,s.create=function(r){return new s(r)},s.encode=function(r,i){return i||(i=u.create()),r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(10).string(r.domain),r.version!=null&&Object.hasOwnProperty.call(r,"version")&&i.uint32(16).int64(r.version),i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.OperatorSetIdProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.domain=r.string();break}case 2:{p.version=r.int64();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){return typeof r!="object"||r===null?"object expected":r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain)?"domain: string expected":r.version!=null&&r.hasOwnProperty("version")&&!l.isInteger(r.version)&&!(r.version&&l.isInteger(r.version.low)&&l.isInteger(r.version.high))?"version: integer|Long expected":null},s.fromObject=function(r){if(r instanceof d.onnx.OperatorSetIdProto)return r;var i=new d.onnx.OperatorSetIdProto;return r.domain!=null&&(i.domain=String(r.domain)),r.version!=null&&(l.Long?(i.version=l.Long.fromValue(r.version)).unsigned=!1:typeof r.version=="string"?i.version=parseInt(r.version,10):typeof r.version=="number"?i.version=r.version:typeof r.version=="object"&&(i.version=new l.LongBits(r.version.low>>>0,r.version.high>>>0).toNumber())),i},s.toObject=function(r,i){i||(i={});var a={};if(i.defaults)if(a.domain="",l.Long){var p=new l.Long(0,0,!1);a.version=i.longs===String?p.toString():i.longs===Number?p.toNumber():p}else a.version=i.longs===String?"0":0;return r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.version!=null&&r.hasOwnProperty("version")&&(typeof r.version=="number"?a.version=i.longs===String?String(r.version):r.version:a.version=i.longs===String?l.Long.prototype.toString.call(r.version):i.longs===Number?new l.LongBits(r.version.low>>>0,r.version.high>>>0).toNumber():r.version),a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.OperatorSetIdProto"},s})(),c.OperatorStatus=(function(){var s={},r=Object.create(s);return r[s[0]="EXPERIMENTAL"]=0,r[s[1]="STABLE"]=1,r})(),c.FunctionProto=(function(){function s(r){if(this.input=[],this.output=[],this.attribute=[],this.attributeProto=[],this.node=[],this.opsetImport=[],r)for(var i=Object.keys(r),a=0;a<i.length;++a)r[i[a]]!=null&&(this[i[a]]=r[i[a]])}return s.prototype.name="",s.prototype.input=l.emptyArray,s.prototype.output=l.emptyArray,s.prototype.attribute=l.emptyArray,s.prototype.attributeProto=l.emptyArray,s.prototype.node=l.emptyArray,s.prototype.docString="",s.prototype.opsetImport=l.emptyArray,s.prototype.domain="",s.create=function(r){return new s(r)},s.encode=function(r,i){if(i||(i=u.create()),r.name!=null&&Object.hasOwnProperty.call(r,"name")&&i.uint32(10).string(r.name),r.input!=null&&r.input.length)for(var a=0;a<r.input.length;++a)i.uint32(34).string(r.input[a]);if(r.output!=null&&r.output.length)for(var a=0;a<r.output.length;++a)i.uint32(42).string(r.output[a]);if(r.attribute!=null&&r.attribute.length)for(var a=0;a<r.attribute.length;++a)i.uint32(50).string(r.attribute[a]);if(r.node!=null&&r.node.length)for(var a=0;a<r.node.length;++a)d.onnx.NodeProto.encode(r.node[a],i.uint32(58).fork()).ldelim();if(r.docString!=null&&Object.hasOwnProperty.call(r,"docString")&&i.uint32(66).string(r.docString),r.opsetImport!=null&&r.opsetImport.length)for(var a=0;a<r.opsetImport.length;++a)d.onnx.OperatorSetIdProto.encode(r.opsetImport[a],i.uint32(74).fork()).ldelim();if(r.domain!=null&&Object.hasOwnProperty.call(r,"domain")&&i.uint32(82).string(r.domain),r.attributeProto!=null&&r.attributeProto.length)for(var a=0;a<r.attributeProto.length;++a)d.onnx.AttributeProto.encode(r.attributeProto[a],i.uint32(90).fork()).ldelim();return i},s.encodeDelimited=function(r,i){return this.encode(r,i).ldelim()},s.decode=function(r,i){r instanceof o||(r=o.create(r));for(var a=i===void 0?r.len:r.pos+i,p=new d.onnx.FunctionProto;r.pos<a;){var h=r.uint32();switch(h>>>3){case 1:{p.name=r.string();break}case 4:{p.input&&p.input.length||(p.input=[]),p.input.push(r.string());break}case 5:{p.output&&p.output.length||(p.output=[]),p.output.push(r.string());break}case 6:{p.attribute&&p.attribute.length||(p.attribute=[]),p.attribute.push(r.string());break}case 11:{p.attributeProto&&p.attributeProto.length||(p.attributeProto=[]),p.attributeProto.push(d.onnx.AttributeProto.decode(r,r.uint32()));break}case 7:{p.node&&p.node.length||(p.node=[]),p.node.push(d.onnx.NodeProto.decode(r,r.uint32()));break}case 8:{p.docString=r.string();break}case 9:{p.opsetImport&&p.opsetImport.length||(p.opsetImport=[]),p.opsetImport.push(d.onnx.OperatorSetIdProto.decode(r,r.uint32()));break}case 10:{p.domain=r.string();break}default:r.skipType(h&7);break}}return p},s.decodeDelimited=function(r){return r instanceof o||(r=new o(r)),this.decode(r,r.uint32())},s.verify=function(r){if(typeof r!="object"||r===null)return"object expected";if(r.name!=null&&r.hasOwnProperty("name")&&!l.isString(r.name))return"name: string expected";if(r.input!=null&&r.hasOwnProperty("input")){if(!Array.isArray(r.input))return"input: array expected";for(var i=0;i<r.input.length;++i)if(!l.isString(r.input[i]))return"input: string[] expected"}if(r.output!=null&&r.hasOwnProperty("output")){if(!Array.isArray(r.output))return"output: array expected";for(var i=0;i<r.output.length;++i)if(!l.isString(r.output[i]))return"output: string[] expected"}if(r.attribute!=null&&r.hasOwnProperty("attribute")){if(!Array.isArray(r.attribute))return"attribute: array expected";for(var i=0;i<r.attribute.length;++i)if(!l.isString(r.attribute[i]))return"attribute: string[] expected"}if(r.attributeProto!=null&&r.hasOwnProperty("attributeProto")){if(!Array.isArray(r.attributeProto))return"attributeProto: array expected";for(var i=0;i<r.attributeProto.length;++i){var a=d.onnx.AttributeProto.verify(r.attributeProto[i]);if(a)return"attributeProto."+a}}if(r.node!=null&&r.hasOwnProperty("node")){if(!Array.isArray(r.node))return"node: array expected";for(var i=0;i<r.node.length;++i){var a=d.onnx.NodeProto.verify(r.node[i]);if(a)return"node."+a}}if(r.docString!=null&&r.hasOwnProperty("docString")&&!l.isString(r.docString))return"docString: string expected";if(r.opsetImport!=null&&r.hasOwnProperty("opsetImport")){if(!Array.isArray(r.opsetImport))return"opsetImport: array expected";for(var i=0;i<r.opsetImport.length;++i){var a=d.onnx.OperatorSetIdProto.verify(r.opsetImport[i]);if(a)return"opsetImport."+a}}return r.domain!=null&&r.hasOwnProperty("domain")&&!l.isString(r.domain)?"domain: string expected":null},s.fromObject=function(r){if(r instanceof d.onnx.FunctionProto)return r;var i=new d.onnx.FunctionProto;if(r.name!=null&&(i.name=String(r.name)),r.input){if(!Array.isArray(r.input))throw TypeError(".onnx.FunctionProto.input: array expected");i.input=[];for(var a=0;a<r.input.length;++a)i.input[a]=String(r.input[a])}if(r.output){if(!Array.isArray(r.output))throw TypeError(".onnx.FunctionProto.output: array expected");i.output=[];for(var a=0;a<r.output.length;++a)i.output[a]=String(r.output[a])}if(r.attribute){if(!Array.isArray(r.attribute))throw TypeError(".onnx.FunctionProto.attribute: array expected");i.attribute=[];for(var a=0;a<r.attribute.length;++a)i.attribute[a]=String(r.attribute[a])}if(r.attributeProto){if(!Array.isArray(r.attributeProto))throw TypeError(".onnx.FunctionProto.attributeProto: array expected");i.attributeProto=[];for(var a=0;a<r.attributeProto.length;++a){if(typeof r.attributeProto[a]!="object")throw TypeError(".onnx.FunctionProto.attributeProto: object expected");i.attributeProto[a]=d.onnx.AttributeProto.fromObject(r.attributeProto[a])}}if(r.node){if(!Array.isArray(r.node))throw TypeError(".onnx.FunctionProto.node: array expected");i.node=[];for(var a=0;a<r.node.length;++a){if(typeof r.node[a]!="object")throw TypeError(".onnx.FunctionProto.node: object expected");i.node[a]=d.onnx.NodeProto.fromObject(r.node[a])}}if(r.docString!=null&&(i.docString=String(r.docString)),r.opsetImport){if(!Array.isArray(r.opsetImport))throw TypeError(".onnx.FunctionProto.opsetImport: array expected");i.opsetImport=[];for(var a=0;a<r.opsetImport.length;++a){if(typeof r.opsetImport[a]!="object")throw TypeError(".onnx.FunctionProto.opsetImport: object expected");i.opsetImport[a]=d.onnx.OperatorSetIdProto.fromObject(r.opsetImport[a])}}return r.domain!=null&&(i.domain=String(r.domain)),i},s.toObject=function(r,i){i||(i={});var a={};if((i.arrays||i.defaults)&&(a.input=[],a.output=[],a.attribute=[],a.node=[],a.opsetImport=[],a.attributeProto=[]),i.defaults&&(a.name="",a.docString="",a.domain=""),r.name!=null&&r.hasOwnProperty("name")&&(a.name=r.name),r.input&&r.input.length){a.input=[];for(var p=0;p<r.input.length;++p)a.input[p]=r.input[p]}if(r.output&&r.output.length){a.output=[];for(var p=0;p<r.output.length;++p)a.output[p]=r.output[p]}if(r.attribute&&r.attribute.length){a.attribute=[];for(var p=0;p<r.attribute.length;++p)a.attribute[p]=r.attribute[p]}if(r.node&&r.node.length){a.node=[];for(var p=0;p<r.node.length;++p)a.node[p]=d.onnx.NodeProto.toObject(r.node[p],i)}if(r.docString!=null&&r.hasOwnProperty("docString")&&(a.docString=r.docString),r.opsetImport&&r.opsetImport.length){a.opsetImport=[];for(var p=0;p<r.opsetImport.length;++p)a.opsetImport[p]=d.onnx.OperatorSetIdProto.toObject(r.opsetImport[p],i)}if(r.domain!=null&&r.hasOwnProperty("domain")&&(a.domain=r.domain),r.attributeProto&&r.attributeProto.length){a.attributeProto=[];for(var p=0;p<r.attributeProto.length;++p)a.attributeProto[p]=d.onnx.AttributeProto.toObject(r.attributeProto[p],i)}return a},s.prototype.toJSON=function(){return this.constructor.toObject(this,n.util.toJSONOptions)},s.getTypeUrl=function(r){return r===void 0&&(r="type.googleapis.com"),r+"/onnx.FunctionProto"},s})(),c})(),t.exports=d});function vo(e,t){if(!e)throw new Error(typeof t=="string"?t:t())}function Iu(e){return new TextDecoder().decode(e)}var Le,ii,vp,Gt,k0,ft,Ut,be,Ou,xo,gi,bi,Ne=D(()=>{"use strict";jy(),Le=ge(wi()),Sn(),ii=class{static arraysEqual(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}},vp=class{static preprocessInputShapes(e,t){let n=e.length===1?[1,e[0]]:e,o=t.length===1?[t[0],1]:t;return[n,o]}static postprocessOutputShape(e,t,n){t===1&&e.splice(e.length-2,1),n===1&&e.pop()}static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Gt=class oi{static calcShape(t,n,o=!1){let u=t.length,l=n.length;if(u===0)return n;if(l===0)return t;let d=Math.max(t.length,n.length),c=new Array(d);if(o){if(u<2||l<2)return;let s=vp.calcMatMulShape([t[u-2],t[u-1]],[n[l-2],n[l-1]]);if(s===void 0)return;[c[d-2],c[d-1]]=s}for(let s=o?3:1;s<=d;s++){let r=u-s<0?1:t[u-s],i=l-s<0?1:n[l-s];if(r!==i&&r>1&&i>1)return;c[d-s]=Math.max(r,i)}return c}static index(t,n){let o=new Array(n.length);return oi.fillIndex(t,n,o),o}static fillIndex(t,n,o){let u=t.length-n.length;for(let l=0;l<n.length;l++)o[l]=t[u+l]%n[l]}static calc(t,n,o,u,l){let d=oi.calcShape(t.dims,n.dims);if(d){if(u&&!be.areEqual(d,t.dims))return;let c=be.size(d),s=u?t:new bt(d,l||t.type);if(d.length===0)s.set([],o(t.get([]),n.get([])));else{let r=new Array(d.length),i=new Array(t.dims.length),a=new Array(n.dims.length),p=0,h=0,m=!1,b=!1;t.dims.length===0&&(p=t.get([]),m=!0),n.dims.length===0&&(h=n.get([]),b=!0);let $;for(let v=0;v<c;v++){$=v;for(let y=d.length-1;y>=0;y--)r[y]=$%d[y],$=Math.floor($/d[y]);m||(oi.fillIndex(r,t.dims,i),p=t.get(i)),b||(oi.fillIndex(r,n.dims,a),h=n.get(a)),s.set(r,o(p,h))}}return s}}static isValidBroadcast(t,n){let o=t.length,u=n.length;if(o>u)return!1;for(let l=1;l<=o;l++)if(t[o-l]!==1&&t[o-l]!==n[u-l])return!1;return!0}static getBroadcastDims(t,n){let o=t.length,u=[];for(let l=0;l<o;l++){let d=o-1-l,c=t[d]||1;(n[n.length-1-l]||1)>1&&c===1&&u.unshift(d)}return u}},k0=class{static getShapeOfGemmResult(e,t,n,o,u){if(e.length!==2||n.length!==2)throw new Error("shape need to be of size 2");let l,d,c;t?(l=e[1],d=e[0]):(l=e[0],d=e[1]);let s=-1;if(o?(c=n[0],s=1):(c=n[1],s=0),n[s]!==d)throw new Error("dimension mismatch");if(l<=0||c<=0||d<=0)throw new Error("invalid shape specified");if(u&&!Gt.isValidBroadcast(u,[l,c]))throw new Error("gemm: invalid bias shape for broadcast");return[l,c,d]}},ft=class Eu{static tensorDataTypeFromProto(t){switch(t){case Le.onnx.TensorProto.DataType.INT8:return"int8";case Le.onnx.TensorProto.DataType.UINT8:return"uint8";case Le.onnx.TensorProto.DataType.BOOL:return"bool";case Le.onnx.TensorProto.DataType.INT16:return"int16";case Le.onnx.TensorProto.DataType.UINT16:return"uint16";case Le.onnx.TensorProto.DataType.INT32:return"int32";case Le.onnx.TensorProto.DataType.UINT32:return"uint32";case Le.onnx.TensorProto.DataType.FLOAT:return"float32";case Le.onnx.TensorProto.DataType.DOUBLE:return"float64";case Le.onnx.TensorProto.DataType.STRING:return"string";case Le.onnx.TensorProto.DataType.INT64:return"int32";case Le.onnx.TensorProto.DataType.UINT64:return"uint32";default:throw new Error(`unsupported data type: ${Le.onnx.TensorProto.DataType[t]}`)}}static tensorDataTypeStringToEnum(t){switch(t){case"int8":return Le.onnx.TensorProto.DataType.INT8;case"uint8":return Le.onnx.TensorProto.DataType.UINT8;case"bool":return Le.onnx.TensorProto.DataType.BOOL;case"int16":return Le.onnx.TensorProto.DataType.INT16;case"uint16":return Le.onnx.TensorProto.DataType.UINT16;case"int32":return Le.onnx.TensorProto.DataType.INT32;case"uint32":return Le.onnx.TensorProto.DataType.UINT32;case"float32":return Le.onnx.TensorProto.DataType.FLOAT;case"float64":return Le.onnx.TensorProto.DataType.DOUBLE;case"string":return Le.onnx.TensorProto.DataType.STRING;case"int64":return Le.onnx.TensorProto.DataType.INT64;case"uint64":return Le.onnx.TensorProto.DataType.UINT64;default:throw new Error(`unsupported data type: ${t}`)}}static tensorDimsFromProto(t){return t.map(n=>en.isLong(n)?n.toNumber():n)}static tensorValueTypeFromProto(t){return{tensorType:Eu.tensorDataTypeFromProto(t.elemType),shape:{dims:Eu.tensorDimsFromProto(t.shape.dim.map(n=>n.dimValue))}}}static tensorDimsFromORTFormat(t){let n=[];for(let o=0;o<t.dimsLength();o++)n.push(Ut.longToNumber(t.dims(o)));return n}static tensorAttributesFromORTFormat(t){let n=[];for(let o=0;o<t.attributesLength();o++)n.push(t.attributes(o));return n}},Ut=class{static longToNumber(e){return en.isLong(e)?e.toNumber():typeof e=="bigint"?Number(e):e}static isLong(e){return en.isLong(e)||typeof e=="bigint"}},be=class mr{static size(t){return mr.getSizeFromDimensionRange(t,0,t.length)}static sizeFromDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return mr.getSizeFromDimensionRange(t,n,t.length)}static sizeToDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeToDimension as Tensor has ${t.length} dimensions.`);return mr.getSizeFromDimensionRange(t,0,n)}static getSizeFromDimensionRange(t,n,o){let u=1;for(let l=n;l<o;l++){if(t[l]<=0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains 0 or negative values in them.");u*=t[l]}return u}static computeStrides(t){let n=t.length;if(n===0)return[];if(n===1)return[1];let o=new Array(n);o[n-1]=1,o[n-2]=t[n-1];for(let u=n-3;u>=0;--u)o[u]=o[u+1]*t[u+1];return o}static transpose(t){return t.slice().reverse()}static indicesToOffset(t,n,o){o===void 0&&(o=t.length);let u=0;for(let l=0;l<o;++l)u+=n[l]*t[l];return u}static offsetToIndices(t,n){let o=n.length;if(o===0)return[];if(o===1)return[t*n[0]];let u=new Array(n.length);for(let l=0;l<u.length-1;++l)u[l]=Math.floor(t/n[l]),t-=u[l]*n[l];return u[u.length-1]=t,u}static normalizeAxis(t,n){if(t<-n&&t>=n)throw new Error("unsupported axis for this operation.");return t<0?t+n:t}static normalizeAxes(t,n){return t.map(o=>this.normalizeAxis(o,n))}static incrementIndex(t,n,o){if(n.length===0||t.length===0)throw new Error("Index incrementing unsupported for scalar Tensor");if(o===void 0)o=n.length;else if(o<=0||o>n.length)throw new Error("Incorrect axis to increment on");for(let u=o-1;u>=0&&(t[u]++,!(t[u]<n[u]));--u)t[u]=0}static calculateReshapedDims(t,n){if(n.length===0){if(t.length===0||mr.size(t)===1)return[];throw new Error("cannot reshape to a scalar Tensor")}let o=n.length,u=new Array(o),l=-1,d=1;for(let s=0;s<o;s++){if(n[s]<-1)throw new Error("a dimension in shape hints cannot be less than -1");if(n[s]===-1){if(l!==-1)throw new Error("at most one dimension in shape hints can be -1");l=s}else{if(n[s]===0){if(s>=t.length)throw new Error("the dimension with value zero exceeds the dimension size of the input tensor");u[s]=t[s]}else u[s]=n[s];d*=u[s]}}let c=mr.size(t);if(l!==-1){if(c%d!==0)throw new Error(`the input tensor cannot be reshaped to the requested shape. Input shape: [${t}] Output shape: [${n}]`);u[l]=c/d}else if(d!==c)throw new Error("reshapedDims and originalDims don't have matching sizes");return u}static sortBasedOnPerm(t,n){return n?n.map(o=>t[o]):t.slice().reverse()}static padShape(t,n){let o=t.length;return t.map((u,l)=>u+n[l]+n[l+o])}static areEqual(t,n){return t.length!==n.length?!1:t.every((o,u)=>o===n[u])}static validateDimsAndCalcSize(t){if(t.length>6)throw new TypeError("Only rank 0 to 6 is supported for tensor shape.");let n=1;for(let o of t){if(!Number.isInteger(o))throw new TypeError(`Invalid shape: ${o} is not an integer`);if(o<0||o>2147483647)throw new TypeError(`Invalid shape: length ${o} is not allowed`);n*=o}return n}static flattenShape(t,n){n<0&&(n+=t.length);let o=t.reduce((l,d)=>l*d,1),u=t.slice(n).reduce((l,d)=>l*d,1);return[o/u,u]}static squeezeShape(t,n){let o=new Array;n=mr.normalizeAxes(n,t.length);for(let u=0;u<t.length;u++){let l=n.indexOf(u)>=0;if(l&&t[u]!==1)throw new Error("squeeze an axis of size different than 1");(n.length===0&&t[u]>1||n.length>0&&!l)&&o.push(t[u])}return o}static unsqueezeShape(t,n){let o=new Array(t.length+n.length);o.fill(0);for(let l=0;l<n.length;l++){let d=mr.normalizeAxis(n[l],o.length);if(d>=o.length)throw new Error("'axes' has an out of range axis");if(o[d]!==0)throw new Error("'axes' has a duplicate axis");o[d]=1}let u=0;for(let l=0;l<o.length;l++)o[l]===0&&(o[l]=t[u++]);if(u!==t.length)throw new Error("the unsqueezed dimension could not be established");return o}},Ou=class C0{static splitShape(t,n,o,u){if(o.length===0){if(!u)throw new Error("need to know number of outputs when the 'split' attribute is not specified");C0.determineSplit(t[n],u,o)}let l=[],d=[0];for(let c=0;c<o.length;++c){c!==0&&d.push(d[c-1]+o[c-1]);let s=t.slice();s[n]=o[c],l.push(s)}return[l,d]}static determineSplit(t,n,o){if(t%n!==0)throw new Error("cannot split tensor to equal sized parts");for(let u=0;u<n;++u)o.push(t/n)}},xo=class gr{static adjustPoolAttributes(t,n,o,u,l,d){if(!t&&o.length!==n.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let c=0;c<n.length-2;c++)c>=o.length?o.push(n[c+2]):o[c]=n[c+2];for(let c=0;c<o.length;c++)if(c<u.length){if(u[c]<0)throw new Error("strides should be greater than or equal to 1")}else u.push(1);for(let c=0;c<o.length;c++)if(c<l.length){if(l[c]<0)throw new Error("dilations should be greater than or equal to 1")}else l.push(1);for(let c=0;c<o.length*2;c++)if(c<d.length){if(d[c]<0)throw new Error("pad should be greater than or equal to 1")}else d.push(0);for(let c=0;c<o.length;c++){if(o[c]<=0)throw new Error("kernel shapes need to be greater than 0");if(d[c]>=o[c]||d[c+o.length]>=o[c])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,n,o,u,l,d){if(d){if(l.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(u.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let c=0;c<t.length-2;c++)gr.adjustPadAndReturnShape(t[c+2],n[c],o[c],u[c],l,c,c+t.length-2,d)}}static computePoolOutputShape(t,n,o,u,l,d,c,s=0){if(n.length<=0)throw new Error("input shape must be of size greater than 0");let r=[n[0],n[1]];return gr.computeShapeHelper(t,n,r,o,u,l,d,c,s),r}static computeConvOutputShape(t,n,o,u,l,d,c){if(t.length<=0||n.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let s=[t[0],n[0]];return gr.computeShapeHelper(!1,t,s,o,u,l,d,c),s}static computeShapeHelper(t,n,o,u,l,d,c,s,r=0){if(t)for(let i=0;i<n.length-2;i++)o.push(1);else for(let i=0;i<n.length-2;i++)o.push(gr.adjustPadAndReturnShape(n[i+2],u[i],l[i],d[i],c,i,i+n.length-2,s,r))}static computeOutputSize(t,n,o,u,l){let d=Math.floor(t/n)+1;return l===1&&(d=Math.ceil(t/n)+1,(d-1)*n>=o+u&&(d-=1)),d}static adjustPadAndReturnShape(t,n,o,u,l,d,c,s,r=0){let i=o*(u-1)+1;if(s&&s!=="NOTSET")switch(s){case"VALID":return l[d]=0,l[c]=0,gr.computeOutputSize(t-i,n,t,0,r);case"SAME_LOWER":case"SAME_UPPER":if(o!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let a=(Math.floor((t+n-1)/n)-1)*n+u-t;return l[d]=Math.floor(s==="SAME_LOWER"?(a+1)/2:a/2),l[c]=a-l[d],gr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}default:throw new Error("Unsupported AutoPad type")}else return gr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}},gi=-34028234663852886e22,bi=34028234663852886e22});function p3(e){switch(e){case"bool":case"int8":case"uint8":return 1;case"int16":case"uint16":return 2;case"int32":case"uint32":case"float32":return 4;case"float64":return 8;default:throw new Error(`cannot calculate sizeof() on type ${e}`)}}function xp(e){switch(e){case ve.onnx.TensorProto.DataType.UINT8:case ve.onnx.TensorProto.DataType.INT8:case ve.onnx.TensorProto.DataType.BOOL:return 1;case ve.onnx.TensorProto.DataType.UINT16:case ve.onnx.TensorProto.DataType.INT16:return 2;case ve.onnx.TensorProto.DataType.FLOAT:case ve.onnx.TensorProto.DataType.INT32:case ve.onnx.TensorProto.DataType.UINT32:return 4;case ve.onnx.TensorProto.DataType.INT64:case ve.onnx.TensorProto.DataType.DOUBLE:case ve.onnx.TensorProto.DataType.UINT64:return 8;default:throw new Error(`cannot calculate sizeof() on type ${ve.onnx.TensorProto.DataType[e]}`)}}function h3(e,t){return new(D0(t))(e)}function D0(e){switch(e){case"bool":case"uint8":return Uint8Array;case"int8":return Int8Array;case"int16":return Int16Array;case"uint16":return Uint16Array;case"int32":return Int32Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"float32":return Float32Array;case"float64":return Float64Array;default:throw new Error("unspecified error")}}function Au(e,t){if(t===ve.onnx.TensorProto.DataType.INT64||t===go.TensorDataType.INT64){if(e.greaterThanOrEqual(2147483648)||e.lessThan(-2147483648))throw new TypeError("int64 is not supported")}else if(t===ve.onnx.TensorProto.DataType.UINT32||t===go.TensorDataType.UINT32||t===ve.onnx.TensorProto.DataType.UINT64||t===go.TensorDataType.UINT64){if(e.greaterThanOrEqual(4294967296)||e.lessThan(0))throw new TypeError("uint64 is not supported")}else throw new TypeError(`not a LONG type: ${ve.onnx.TensorProto.DataType[t]}`);return e.toNumber()}function $p(e,t,n){switch(t){case ve.onnx.TensorProto.DataType.BOOL:case ve.onnx.TensorProto.DataType.UINT8:return e.getUint8(n);case ve.onnx.TensorProto.DataType.INT8:return e.getInt8(n);case ve.onnx.TensorProto.DataType.UINT16:return e.getUint16(n,!0);case ve.onnx.TensorProto.DataType.INT16:return e.getInt16(n,!0);case ve.onnx.TensorProto.DataType.FLOAT:return e.getFloat32(n,!0);case ve.onnx.TensorProto.DataType.INT32:return e.getInt32(n,!0);case ve.onnx.TensorProto.DataType.UINT32:return e.getUint32(n,!0);case ve.onnx.TensorProto.DataType.INT64:return Au(en.fromBits(e.getUint32(n,!0),e.getUint32(n+4,!0),!1),t);case ve.onnx.TensorProto.DataType.DOUBLE:return e.getFloat64(n,!0);case ve.onnx.TensorProto.DataType.UINT64:return Au(en.fromBits(e.getUint32(n,!0),e.getUint32(n+4,!0),!0),t);default:throw new Error(`cannot read from DataView for type ${ve.onnx.TensorProto.DataType[t]}`)}}var Tp,ve,bt,Sn=D(()=>{"use strict";Tp=ge(gI()),jy(),Mo(),ve=ge(wi()),Ne(),bt=class bo{constructor(t,n,o,u,l,d=Tp.Guid.create()){this.dims=t,this.type=n,this.dataProvider=o,this.asyncDataProvider=u,this.cache=l,this.dataId=d,this.size=be.validateDimsAndCalcSize(t);let c=this.size,s=o===void 0&&u===void 0&&l===void 0;if(l!==void 0&&l.length!==c)throw new RangeError("Input dims doesn't match data length.");if(n==="string"){if(l!==void 0&&(!Array.isArray(l)||!l.every(r=>typeof r=="string")))throw new TypeError("cache should be a string array");s&&(this.cache=new Array(c))}else{if(l!==void 0){let r=D0(n);if(!(l instanceof r))throw new TypeError(`cache should be type ${r.name}`)}if(s){let r=new ArrayBuffer(c*p3(n));this.cache=h3(r,n)}}}get data(){if(this.cache===void 0){let t=this.dataProvider(this.dataId);if(t.length!==this.size)throw new Error("Length of data provided by the Data Provider is inconsistent with the dims of this Tensor.");this.cache=t}return this.cache}get stringData(){if(this.type!=="string")throw new TypeError("data type is not string");return this.data}get integerData(){switch(this.type){case"uint8":case"int8":case"uint16":case"int16":case"int32":case"uint32":case"bool":return this.data;default:throw new TypeError("data type is not integer (uint8, int8, uint16, int16, int32, uint32, bool)")}}get floatData(){switch(this.type){case"float32":case"float64":return this.data;default:throw new TypeError("data type is not float (float32, float64)")}}get numberData(){if(this.type!=="string")return this.data;throw new TypeError("type cannot be non-number (string)")}get(t){return this.data[be.indicesToOffset(t,this.strides)]}set(t,n){this.data[be.indicesToOffset(t,this.strides)]=n}async getData(){return this.cache===void 0&&(this.cache=await this.asyncDataProvider(this.dataId)),this.cache}get strides(){return this._strides||(this._strides=be.computeStrides(this.dims)),this._strides}static fromProto(t){if(!t)throw new Error("cannot construct Value from an empty tensor");let n=ft.tensorDataTypeFromProto(t.dataType),o=ft.tensorDimsFromProto(t.dims),u=new bo(o,n);if(n==="string")t.stringData.forEach((l,d)=>{u.data[d]=Iu(l)});else if(t.rawData&&typeof t.rawData.byteLength=="number"&&t.rawData.byteLength>0){let l=u.data,d=new DataView(t.rawData.buffer,t.rawData.byteOffset,t.rawData.byteLength),c=xp(t.dataType),s=t.rawData.byteLength/c;if(t.rawData.byteLength%c!==0)throw new Error("invalid buffer length");if(l.length!==s)throw new Error("buffer length mismatch");for(let r=0;r<s;r++){let i=$p(d,t.dataType,r*c);l[r]=i}}else{let l;switch(t.dataType){case ve.onnx.TensorProto.DataType.FLOAT:l=t.floatData;break;case ve.onnx.TensorProto.DataType.INT32:case ve.onnx.TensorProto.DataType.INT16:case ve.onnx.TensorProto.DataType.UINT16:case ve.onnx.TensorProto.DataType.INT8:case ve.onnx.TensorProto.DataType.UINT8:case ve.onnx.TensorProto.DataType.BOOL:l=t.int32Data;break;case ve.onnx.TensorProto.DataType.INT64:l=t.int64Data;break;case ve.onnx.TensorProto.DataType.DOUBLE:l=t.doubleData;break;case ve.onnx.TensorProto.DataType.UINT32:case ve.onnx.TensorProto.DataType.UINT64:l=t.uint64Data;break;default:throw new Error("unspecific error")}if(l==null)throw new Error("failed to populate data from a tensorproto value");let d=u.data;if(d.length!==l.length)throw new Error("array length mismatch");for(let c=0;c<l.length;c++){let s=l[c];en.isLong(s)?d[c]=Au(s,t.dataType):d[c]=s}}return u}static fromData(t,n,o){return new bo(n,o,void 0,void 0,t)}static fromOrtTensor(t){if(!t)throw new Error("cannot construct Value from an empty tensor");let n=ft.tensorDimsFromORTFormat(t),o=ft.tensorDataTypeFromProto(t.dataType()),u=new bo(n,o);if(o==="string")for(let l=0;l<t.stringDataLength();l++)u.data[l]=t.stringData(l);else if(t.rawDataArray()&&typeof t.rawDataLength()=="number"&&t.rawDataLength()>0){let l=u.data,d=new DataView(t.rawDataArray().buffer,t.rawDataArray().byteOffset,t.rawDataLength()),c=xp(t.dataType()),s=t.rawDataLength()/c;if(t.rawDataLength()%c!==0)throw new Error("invalid buffer length");if(l.length!==s)throw new Error("buffer length mismatch");for(let r=0;r<s;r++){let i=$p(d,t.dataType(),r*c);l[r]=i}}return u}}});function Ee(e){return e===1?R0:N0}function f3(e){let t=Ee(e);return`${t.version}
      precision highp float;
      ${t.attribute} vec3 position;
      ${t.attribute} vec2 textureCoord;

      ${t.varyingVertex} vec2 TexCoords;

      void main()
      {
          gl_Position = vec4(position, 1.0);
          TexCoords = textureCoord;
      }`}function m3(e){let t=Ee(e);return`${t.version}
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

    `}function g3(e,t){let n=Ee(e);return`
  void main() {
    int indices[${t}];
    toVec(TexCoords, indices);
    vec4 result = vec4(process(indices));
    ${n.output} = result;
  }
  `}var R0,N0,He=D(()=>{"use strict";R0={version:"",attribute:"attribute",varyingVertex:"varying",varyingFrag:"varying",texture2D:"texture2D",output:"gl_FragColor",outputDeclaration:""},N0={version:"#version 300 es",attribute:"in",varyingVertex:"out",varyingFrag:"in",texture2D:"texture",output:"outputColor",outputDeclaration:"out vec4 outputColor;"}}),ke=D(()=>{"use strict"});async function Sp(e,t=o=>0,n){return new Promise((o,u)=>{let l=0,d=()=>{if(e()){o();return}l++;let c=t(l);if(n!=null&&l>=n){u();return}setTimeout(d,c)};d()})}function Fs(e){return vo(typeof e<"u"&&e.length!==0,()=>"empty string found for sampler name"),"get"+e.charAt(0).toUpperCase()+e.slice(1)}function b3(e){return vo(typeof e<"u"&&e.length!==0,()=>"empty string found for sampler name"),"get"+e.charAt(0).toUpperCase()+e.slice(1)+"AtOutCoords"}function Un(e,t){let n=JSON.parse(JSON.stringify(e));return n=t,n}function Vn(e,t){return t.map(n=>e[n]).join(", ")}function _r(e){if(e<=1)return"int";if(e===2)return"ivec2";if(e===3)return"ivec3";if(e===4)return"ivec4";if(e===5)return"ivec5";if(e===6)return"ivec6";throw Error(`GPU for rank ${e} is not yet supported`)}function xn(e=6){return["x","y","z","w","u","v"].slice(0,e)}var Qt=D(()=>{"use strict";Ne()});function y3(e,t){return xn(t).map(n=>`${e}.${n}`)}function bl(e,t){return t===1?[e]:y3(e,t)}function vi(){return`
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
  `}var In=D(()=>{"use strict";Qt()});function _3(e,t,n){if(e===0)return"false";if(e===1)return`rc > ${t[0]}`;let o="";for(let u=e-2;u<e;u++)o+=`${n[u]} >= ${t[u-e+2]}`,u<e-1&&(o+="||");return o}function w3(e,t){let n=e.length;if(n===0)return"getA(), 0, 0, 0";if(n===1)return`getA(rc),
            rc + 1 >= ${e[0]} ? 0. : getA(rc + 1),
            0, 0`;let o="r, c",u="r, cp1",l="rp1, c",d="rp1, cp1",c="";if(n>2)for(let s=0;s<n-2;++s)c=c+`${t[s]},`;return`getA(${c}${o}),
          rEdge ? 0. : getA(${c}${l}),
          cEdge ? 0. : getA(${c}${u}),
          rEdge || cEdge ? 0. : getA(${c}${d})`}function v3(e,t,n,o){return e===0||e===1?"":`
    int r = ${t[e-2]};
    int c = ${t[e-1]};
    int rp1 = ${t[e-2]} + 1;
    int cp1 = ${t[e-1]} + 1;
    bool rEdge = rp1 >= ${o};
    bool cEdge = cp1 >= ${n};
    `}var Ls,Ip,z0,x3=D(()=>{"use strict";He(),ke(),Qt(),In(),Ls={name:"pack",inputNames:["A"],inputTypes:[1]},Ip=(e,t)=>{let n=Ee(e.session.backend.glContext.version),o=t.dims,u=o.length,l=t.dims.length,d=_r(l),c=bl("rc",l),s=v3(l,c,o[o.length-2],o[o.length-1]),r;u===0?r=[1,1]:u===1?r=[o[0],1]:r=[o[l-1],o[l-2]];let i=_3(l,r,c),a=w3(o,c),p=`
        void main() {
          ${d} rc = getOutputCoords();

          if(${i}) {
            ${n.output} = vec4(0);
          } else {
            ${s}

            ${n.output} = vec4(${a});
          }
        }
      `;return{...Ls,hasMain:!0,output:{dims:t.dims,type:t.type,textureType:2},shaderSource:p}},z0=(e,t)=>({...Ls,get:()=>Ip(e,t)})});function Op(e){if(e.length===0)return[1,1,1];let t=1;for(let n=0;n<e.length-2;++n)t*=e[n];return[t,e.length>1?e[e.length-2]:1,e[e.length-1]]}function $3(e,t){let n=!1;return e.length===0||t.length===0?n=!0:e.length<2||t.length<2?n=e[e.length-1]===t[t.length-1]:n=e[e.length-1]===t[t.length-1]&&e[e.length-2]===t[t.length-2],n}function T3(e){let t=be.computeStrides(e),n=["b","r","c"],o="index";return`
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${t.map((u,l)=>{let d=`int ${n[l]} = ${o} / ${u}`,c=l===t.length-1?`int ${n[l+1]} = ${o} - ${n[l]} * ${u}`:`index -= ${n[l]} * ${u}`;return`${d}; ${c};`}).join("")}
      return ivec3(b, r, c);
    }
  `}function S3(e){let t=be.computeStrides(e);return`
  int getFlattenedIndex(ivec3 coords) {
    // reverse y, z order
    return coords.x * ${t[0]} + coords.z * ${t[1]} + coords.y;
  }
`}var Ep,Ap,M0,I3=D(()=>{"use strict";Ne(),He(),ke(),In(),Ep=e=>({name:"Reshape (packed)",inputTypes:[2],inputNames:["A"],cacheHint:`${e}`}),Ap=(e,t,n,o)=>{let u=t.dims,l=o,d="";for(let r=0;r<4;r++){let i="";switch(r){case 0:i="outputCoords = rc;";break;case 1:i="outputCoords = ivec3(rc.x, rc.y+1, rc.z);";break;case 2:i="outputCoords = ivec3(rc.x, rc.y, rc.z+1);";break;case 3:i="outputCoords = ivec3(rc.x, rc.y+1, rc.z+1);";break;default:throw new Error}d+=`
        ${i}
        ${r>0?"if(outputCoords.y < rows && outputCoords.z < cols){":""}
          int flattenedIndex = getFlattenedIndex(outputCoords);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flattenedIndex);
          vec2 innerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${r}] = getChannel(getA(inputRC.x, inputRC.y, inputRC.z), innerDims);

        ${r>0?"}":""}
      `}let c=Ee(e.session.backend.glContext.version),s=`
      ${T3(u)}
      ${S3(l)}
      ${vi()}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.0);

        ivec3 outputCoords;
        int rows = ${l[2]};
        int cols = ${l[1]};

        ${d}
        ${c.output} = result;
      }
    `;return{...n,output:{dims:l,type:t.type,textureType:2},shaderSource:s,hasMain:!0}},M0=(e,t,n)=>{let o=Ep(n);return{...o,get:()=>Ap(e,t,o,n)}}}),Pu,O3=D(()=>{"use strict";He(),ke(),Pu=(e,t)=>{let n=t.shape,o=Ee(e.session.backend.glContext.version),u=`
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
    }`,l={name:"Uint8Encode",inputTypes:[0],inputNames:["X"],output:{dims:n,type:t.tensor.type,textureType:3},shaderSource:u,hasMain:!0};return e.executeProgram(l,[t.tensor])}});function E3(e,t){if(e===1)return"rc";let n="";for(let o=0;o<e;o++)n+=t[o],o<e-1&&(n+=",");return n}var js,Pp,B0,A3=D(()=>{"use strict";He(),ke(),Qt(),In(),js={name:"unpack",inputNames:["A"],inputTypes:[2]},Pp=(e,t)=>{let n=t.dims.length,o=bl("rc",n),u=o.slice(-2),l=_r(n),d=vi(),c=t.dims.length===0?"":E3(n,o),s=n<=1?"rc":`vec2(${u.join(",")})`,r=Ee(e.session.backend.glContext.version),i=`
    ${d}
    void main() {
      ${l} rc = getOutputCoords();

       // Sample the texture with the coords to get the rgba channel value.
       vec4 packedInput = getA(${c});

       ${r.output} = vec4(getChannel(packedInput, ${s}), 0, 0, 0);
     }
   `;return{...js,hasMain:!0,output:{dims:t.dims,type:t.type,textureType:0},shaderSource:i}},B0=(e,t)=>({...js,get:()=>Pp(e,t)})}),F0,ku,L0,$o=D(()=>{"use strict";zt(),F0=class{constructor(e,t=1){if(t===1)this.internalFormat=e.R32F,this.format=e.RED,this.textureType=e.FLOAT,this.channelSize=t;else if(t===4)this.internalFormat=e.RGBA32F,this.format=e.RGBA,this.textureType=e.FLOAT,this.channelSize=t;else throw new Error(`Invalid number of channels: ${t}`)}encode(e,t){let n,o;return e.constructor!==Float32Array&&(Ke.warning("Encoder","data was not of type Float32; creating new Float32Array"),o=new Float32Array(e)),t*this.channelSize>e.length?(Ke.warning("Encoder","Source data too small. Allocating larger array"),o=e,n=this.allocate(t*this.channelSize),o.forEach((u,l)=>n[l]=u)):(o=e,n=o),n}allocate(e){return new Float32Array(e*4)}decode(e,t){return this.channelSize===1?e.filter((n,o)=>o%4===0).subarray(0,t):e.subarray(0,t)}},ku=class{constructor(e,t=1,n){if(t!==1&&t!==4)throw new Error(`Invalid number of channels: ${t}`);this.internalFormat=e.RGBA,this.format=e.RGBA,this.channelSize=t,this.textureType=n||e.FLOAT}encode(e,t){let n=e;return this.channelSize===1&&(Ke.verbose("Encoder","Exploding into a larger array"),n=this.allocate(t),e.forEach((o,u)=>n[u*4]=o)),n}allocate(e){return new Float32Array(e*4)}decode(e,t){return this.channelSize===1?e.filter((n,o)=>o%4===0).subarray(0,t):e.subarray(0,t)}},L0=class{constructor(e,t=1){if(this.channelSize=4,t===1)this.internalFormat=e.ALPHA,this.format=e.ALPHA,this.textureType=e.UNSIGNED_BYTE,this.channelSize=t;else if(t===4)this.internalFormat=e.RGBA,this.format=e.RGBA,this.textureType=e.UNSIGNED_BYTE,this.channelSize=t;else throw new Error(`Invalid number of channels: ${t}`)}encode(e,t){return new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}allocate(e){return new Uint8Array(e*this.channelSize)}decode(e,t){if(e instanceof Uint8Array)return e.subarray(0,t);throw new Error(`Invalid array type: ${e.constructor}`)}}}),pi,j0,Cu,P3=D(()=>{"use strict";Ne(),ke(),pi=(e,t,n)=>{let o=n===0||n===1?1:4,u=n===2,l=n===1||n===2,d=n===4?t.length-1:void 0,c=n===4?t.map((s,r)=>r===t.length-1?s*4:s):void 0;return Cu(e,t,o,c,{isPacked:u,reverseWH:l,breakAxis:d})},j0=(e,t,n)=>{let o=pi(e,t,n);return[o.width,o.height]},Cu=(e,t,n=1,o,u)=>{let l=!!(u&&u.isPacked),[d,c]=e.computeTextureWH(l&&o||t,u),s=t.length,r=t.slice(0);if(s===0&&(r=[1]),n===1)o=t;else if(l){if(n!==4)throw new Error("a packed texture must be 4-channel");o=t,s>0&&(r[s-1]=Math.ceil(r[s-1]/2)),s>1&&(r[s-2]=Math.ceil(r[s-2]/2))}else if(!o)throw new Error("Unpacked shape is needed when using channels > 1");return{width:d,height:c,channels:n,isPacked:l,shape:r,strides:be.computeStrides(r),unpackedShape:o,reversedWH:u&&u.reverseWH}}}),kp,U0,k3=D(()=>{"use strict";zt(),Sn(),Ne(),x3(),I3(),O3(),A3(),$o(),P3(),ke(),kp=(e,t)=>{let n=t.map(u=>`${u.unpackedShape.join(",")};${u.width}x${u.height}`).join("_"),o=e.name;return e.cacheHint&&(o+="["+e.cacheHint+"]"),o+=":"+n,o},U0=class{constructor(e){this.session=e,this.packedTextureDataCache=new Map,this.unpackedTextureDataCache=new Map}calculateTextureWidthAndHeight(e,t){return j0(this.session.layoutStrategy,e,t)}executeProgram(e,t){if(t.length<e.inputNames.length)throw new Error(`Input size mustn't be less than ${e.inputNames.length}.`);if(e.inputNames.length!==e.inputTypes.length)throw new Error("input names size does not match input types");let n=[];for(let s=0;s<e.inputNames.length;++s)n[s]=this.getOrCreateTextureData(t[s],e.inputTypes[s]);let o=kp(e,n),u=this.session.programManager.getArtifact(o),l=u?u.programInfo:typeof e.get=="function"?e.get():e,d=pi(this.session.layoutStrategy,l.output.dims,l.output.textureType),c=this.createTextureData(d,l.output.type);return u||(u=this.session.programManager.build(l,n,c),this.session.programManager.setArtifact(o,u)),this.runProgram(u,n,c),c}run(e,t){return this.executeProgram(e,t).tensor}runProgram(e,t,n){for(let o=0;o<t.length;++o)if(!!t[o].isPacked!=(e.programInfo.inputTypes[o]===2))throw new Error(`input[${o}] property packed inconsistent`);if(!!n.isPacked!=(e.programInfo.output.textureType===2))throw new Error("output property packed inconsistent");this.session.programManager.run(e,t,n)}getOrCreateTextureData(e,t){let n=this.getTextureData(e.dataId,t===2);if(!n&&(n=this.getTextureData(e.dataId,t!==2),n))return t===2?this.pack(n):this.unpack(n);if(!n){let o=pi(this.session.layoutStrategy,e.dims,t);if(t===4){let u=e.dims;if(u.length===4){let l=[u[0],Math.ceil(u[1]*u[2]*u[3]/4)],d=pi(this.session.layoutStrategy,l,t),c=e.numberData;if(u[1]*u[2]*u[3]%4!==0){let s=u[0],r=u[1]*u[2]*u[3],i=Math.ceil(r*1/4)*4,a=s*i;c=new Float32Array(a);for(let p=0;p<s;++p){let h=p*r,m=p*i+p%1*r;c.set(e.numberData.subarray(h,h+r),m)}}return this.createTextureData(d,e.type,c,e,1)}}if(t===2){let u=Cu(this.session.layoutStrategy,e.dims,1,[],{reverseWH:!0}),l=this.createTextureData(u,e.type,e.numberData,e,1);n=this.pack(l)}else n=this.createTextureData(o,e.type,e.numberData,e,1)}return n}createTextureDataFromLayoutBindTensor(e,t,n,o){return this.createTextureData(e,t,n,o,1)}createTextureData(e,t,n,o,u){Ke.verbose("InferenceHandler",`Creating TextureData: layout:[${JSON.stringify(e)}]`);let l=this.session.textureManager.createTextureFromLayout(t,e,n,u);return this.createTextureDataFromTexture(e,t,l,o)}reshapeUnpacked(e,t){let n=this.getOrCreateTextureData(e,0),o={channels:n.channels,height:n.height,width:n.width,shape:t.length!==0?t:[1],strides:be.computeStrides(t),unpackedShape:t};return this.createTextureDataFromTexture(o,e.type,n.texture).tensor}reshapePacked(e,t){let n=this.getOrCreateTextureData(e,2);if($3(e.dims,t)){let c={channels:n.channels,height:n.height,width:n.width,shape:t.length!==0?t:[1],strides:be.computeStrides(t),unpackedShape:t,isPacked:!0};return this.createTextureDataFromTexture(c,e.type,n.texture).tensor}let o=Op(e.dims),u=Op(t),l=this.reshapePacked(e,o),d=this.run(M0(this,l,u),[l]);return this.reshapePacked(d,t)}cast(e,t){let n=this.getOrCreateTextureData(e,0);return this.createTextureDataFromTexture(n,t,n.texture).tensor}createTextureDataFromTexture(e,t,n,o,u){let l={...e,tensor:o||new bt(e.unpackedShape,t,d=>this.readTexture(l),async d=>this.readTextureAsync(l),void 0,u),texture:n};return this.setTextureData(l.tensor.dataId,l,e.isPacked),l}getTextureData(e,t=!1){return this.session.isInitializer(e)?this.session.getTextureData(e,t):t?this.packedTextureDataCache.get(e):this.unpackedTextureDataCache.get(e)}setTextureData(e,t,n=!1){this.session.isInitializer(e)?this.session.setTextureData(e,t,n):(n?this.packedTextureDataCache:this.unpackedTextureDataCache).set(e,t)}isTextureLayoutCached(e,t=!1){return!!this.getTextureData(e.dataId,t)}dispose(){this.session.textureManager.clearActiveTextures(),this.packedTextureDataCache.forEach(e=>this.session.textureManager.releaseTexture(e)),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache.forEach(e=>this.session.textureManager.releaseTexture(e)),this.unpackedTextureDataCache=new Map}readTexture(e){return e.isPacked?this.readTexture(this.unpack(e)):this.session.backend.glContext.isFloat32DownloadSupported?this.session.textureManager.readTexture(e,e.tensor.type,e.channels):this.session.textureManager.readUint8TextureAsFloat(Pu(this,e))}async readTextureAsync(e){return e.isPacked?this.readTextureAsync(this.unpack(e)):this.session.backend.glContext.isFloat32DownloadSupported?this.session.textureManager.readTextureAsync(e,e.tensor.type,e.channels):this.session.textureManager.readUint8TextureAsFloat(Pu(this,e))}pack(e){return this.executeProgram(z0(this,e.tensor),[e.tensor])}unpack(e){return this.executeProgram(B0(this,e.tensor),[e.tensor])}}}),Cp,je,it=D(()=>{"use strict";Cp=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},je=e=>new Cp(e)}),Us,V0,G0,Dp,Rp,C3=D(()=>{"use strict";it(),He(),ke(),Us={name:"BatchNormalization",inputNames:["A","Scale","B","Mean","Variance"],inputTypes:[0,0,0,0,0]},V0=(e,t,n)=>(Rp(t),[e.run({...Us,cacheHint:n.cacheKey,get:()=>Dp(e,t,n)},t)]),G0=e=>{let t=e.attributes.getFloat("epsilon",1e-5),n=e.attributes.getFloat("momentum",.9),o=e.attributes.getInt("spatial",1);return je({epsilon:t,momentum:n,spatial:o})},Dp=(e,t,n)=>{let o=Ee(e.session.backend.glContext.version),u=t[0].dims.length,[l,d]=e.calculateTextureWidthAndHeight(t[1].dims,0),c=`
  float process(int[${u}] indices) {
    vec2 position = offsetToCoords(indices[1], ${l}, ${d});
    float scale = getColorAsFloat(${o.texture2D}(Scale, position));
    float mean = getColorAsFloat(${o.texture2D}(Mean, position));
    float variance = getColorAsFloat(${o.texture2D}(Variance, position));
    float b = getColorAsFloat(${o.texture2D}(B, position));

    return scale * ( (_A(indices) - mean) / sqrt(variance + float(${n.epsilon})) ) + b;
  }`;return{...Us,output:{dims:t[0].dims,type:t[0].type,textureType:0},shaderSource:c}},Rp=e=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs.");let t=e[0],n=e[1],o=e[2],u=e[3],l=e[4];if(t.dims.length<3||n.dims.length!==1||o.dims.length!==1||u.dims.length!==1||l.dims.length!==1)throw new Error("invalid input shape.");if(n.dims[0]!==t.dims[1]||o.dims[0]!==t.dims[1]||u.dims[0]!==t.dims[1]||l.dims[0]!==t.dims[1])throw new Error("invalid input shape.");if(t.type!=="float32"&&t.type!=="float64"||n.type!=="float32"&&n.type!=="float64"||o.type!=="float32"&&o.type!=="float64"||u.type!=="float32"&&u.type!=="float64"||l.type!=="float32"&&l.type!=="float64")throw new Error("invalid input tensor types.")}}),q0,On,te,Du,H0,vr=D(()=>{"use strict";q0=class{constructor(e,t,n,o){this.glContext=e,this.programInfo=t,this.inputTextureLayouts=n,this.outputTextureLayout=o}},On=class{constructor(e){this.context=e}},te=class{constructor(e,t){this.routineBody=e,this.dependencies=t}},Du=class{constructor(e,t,n){this.name=e,n?this.dependencies=n:this.dependencies=[],t&&(this.routineBody=t)}addDependency(e){e&&this.dependencies.push(e)}},H0=class{static returnOrderedNodes(e){if(!e||e.length===0)return[];if(e.length===1)return e;let t=new Set,n=new Set,o=new Array;return this.createOrderedNodes(e,t,n,o),o}static createOrderedNodes(e,t,n,o){for(let u=0;u<e.length;++u)this.dfsTraverse(e[u],t,n,o)}static dfsTraverse(e,t,n,o){if(!e||n.has(e.name))return;if(t.has(e.name))throw new Error("Cyclic dependency detected. Can't topologically sort routines needed for shader.");t.add(e.name);let u=e.dependencies;if(u&&u.length>0)for(let l=0;l<u.length;++l)this.dfsTraverse(u[l],t,n,o);o.push(e),n.add(e.name),t.delete(e.name)}}});function D3(){let e="add_";return{body:`
  float ${e}(float a, float b) {
    return a + b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 + v2;
  }
  `,name:e,type:0}}function R3(){let e="div_";return{body:`
  float ${e}(float a, float b) {
    return a / b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 / v2;
  }
  `,name:e,type:0}}function N3(){let e="mul_";return{body:`
  float ${e}(float a, float b) {
    return a * b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 * v2;
  }
  `,name:e,type:0}}function z3(){let e="sub_";return{body:`
  float ${e}(float a, float b) {
    return a - b;
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return v1 - v2;
  }
  `,name:e,type:0}}function M3(){let e="equal_";return{body:`
  float ${e}(float a, float b) {
    return float(a == b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4(equal(v1, v2));
  }
  `,name:e,type:0}}function B3(){let e="greater_";return{body:`
  float ${e}(float a, float b) {
    return float(a > b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4( v1.r > v2.r ,
      v1.g > v2.g,
      v1.b > v2.b,
      v1.a > v2.a );
  }
  `,name:e,type:0}}function F3(){let e="less_";return{body:`
  float ${e}(float a, float b) {
    return float(a < b);
  }
  vec4 ${e}(vec4 v1, vec4 v2) {
    return vec4( v1.r < v2.r ,
                v1.g < v2.g,
                v1.b < v2.b,
                v1.a < v2.a );
  }
  `,name:e,type:0}}function L3(){let e="and_";return{body:`
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
  `,name:e,type:0}}function j3(){return{body:`
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
  `,name:"or_",type:0}}function U3(){let e="xor_";return{body:`
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
  `,name:e,type:0}}function V3(){return q3("pow")}function G3(){let e="prelu_";return{body:`
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
  `,name:e,type:0}}function q3(e){let t=`${e}_`;return{body:`
  float ${t}(float a, float b) {
    return ${e}(a, b);
  }
  vec4 ${t}(vec4 v1, vec4 v2) {
    return ${e}(v1, v2);
  }
  `,name:t,type:0}}var pt,Np,W0,K0,X0,Z0,Y0,J0,Q0,e_,t_,r_,n_,i_,H3=D(()=>{"use strict";Ne(),vr(),He(),ke(),pt=(e,t,n,o=t[0].type,u)=>{let l=e.session.pack?2:0;return{name:n.name,inputNames:["A","B"],inputTypes:[l,l],cacheHint:u,get:()=>Np(e,t,n,o)}},Np=(e,t,n,o=t[0].type)=>{let u=e.session.pack?2:0,l=!be.areEqual(t[0].dims,t[1].dims),d=t[0].dims,c=e.session.pack;if(l){let i=Gt.calcShape(t[0].dims,t[1].dims,!1);if(!i)throw new Error("Can't perform binary op on the given tensors");d=i;let a=d.length,p=t[0].dims.length!==0?t[0].dims.length:1,h=t[1].dims.length!==0?t[1].dims.length:1,m=t[0].dims.length!==0?"bcastIndices_A(indices, aindices);":"aindices[0] = 0;",b=t[1].dims.length!==0?"bcastIndices_B(indices, bindices);":"bindices[0] = 0;",$=Ee(e.session.backend.glContext.version),v=c?`
      ${n.body}
      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();
        vec4 result = ${n.name}(a, b);
        ${$.output} = result;
      }`:`
      ${n.body}
      float process(int indices[${a}]) {
        int aindices[${p}];
        int bindices[${h}];
        ${m}
        ${b}
        return ${n.name}(_A(aindices), _B(bindices));
      }`;return{name:n.name,inputNames:["A","B"],inputTypes:[u,u],output:{dims:d,type:o,textureType:u},shaderSource:v,hasMain:c}}let s=Ee(e.session.backend.glContext.version),r=`
    ${n.body}
    void main() {
      vec4 v1 = ${s.texture2D}(A, TexCoords);
      vec4 v2 = ${s.texture2D}(B, TexCoords);
      vec4 result = ${n.name}(v1, v2);
      ${s.output} = result;
    }
    `;return{name:n.name,inputNames:["A","B"],inputTypes:[u,u],output:{dims:t[0].dims,type:o,textureType:u},shaderSource:r,hasMain:!0}},W0=(e,t)=>[e.run(pt(e,t,D3()),t)],K0=(e,t)=>[e.run(pt(e,t,L3(),"bool"),t)],X0=(e,t)=>[e.run(pt(e,t,R3()),t)],Z0=(e,t)=>[e.run(pt(e,t,M3(),"bool"),t)],Y0=(e,t)=>[e.run(pt(e,t,B3(),"bool"),t)],J0=(e,t)=>[e.run(pt(e,t,F3(),"bool"),t)],Q0=(e,t)=>[e.run(pt(e,t,N3()),t)],e_=(e,t)=>[e.run(pt(e,t,j3(),"bool"),t)],t_=(e,t)=>[e.run(pt(e,t,V3()),t)],r_=(e,t)=>[e.run(pt(e,t,G3()),t)],n_=(e,t)=>[e.run(pt(e,t,z3()),t)],i_=(e,t)=>[e.run(pt(e,t,U3(),"bool"),t)]}),o_,s_,zp,W3=D(()=>{"use strict";Ne(),o_=(e,t,n)=>(zp(t),[e.cast(t[0],n)]),s_=e=>ft.tensorDataTypeFromProto(e.attributes.getInt("to")),zp=e=>{if(!e||e.length!==1)throw new Error("Cast requires 1 input.");if(e[0].type==="string")throw new Error("Invalid input type.")}}),Mp,Bp,a_,Gn,K3=D(()=>{"use strict";He(),ke(),Qt(),In(),Mp=(e,t)=>({name:"Concat (packed)",inputNames:Array.from({length:e},(n,o)=>`X${o}`),inputTypes:Array(e).fill(2),cacheHint:t}),Bp=(e,t,n,o)=>{let u=n[0].dims.slice();if(o>=u.length||o<-1*u.length)throw new Error("axis specified for concat doesn't match input dimensionality");o<0&&(o=u.length+o);let l=u.slice(0);for(let S=1;S<n.length;S++){let A=n[S].dims.slice();for(let k=0;k<u.length;k++)if(k===o)l[o]+=A[k];else if(u[k]!==A[k])throw new Error("non concat dimensions must match")}let d=l.length,c=bl("coords",d),s=_r(d),r=vi(),i=n.map(S=>S.dims),a=xn(d),p=new Array(i.length-1);p[0]=i[0][o];for(let S=1;S<p.length;S++)p[S]=p[S-1]+i[S][o];let h=a[o],m=a.slice(-2),b=a.join(),$=`if (${h} < ${p[0]}) {
        return getChannel(
            getX0(${b}), vec2(${m.join()}));
        }`;for(let S=1;S<p.length;S++){let A=p[S-1];$+=`
            if (${h} < ${p[S]}  && ${h} >= ${p[S-1]}) {
              return getChannel(
                getX${S}(${Gn(a,h,A)}),
                vec2(${Gn(m,h,A)}));
            }`}let v=p.length,y=p[p.length-1];$+=`
            return getChannel(
              getX${v}(${Gn(a,h,y)}),
              vec2(${Gn(m,h,y)}));`;let T=Ee(e.session.backend.glContext.version),I=`
          ${r}
          float getValue(${a.map(S=>"int "+S)}) {
            ${$}
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
            ${T.output} = result;
          }
        `;return{...t,output:{dims:l,type:n[0].type,textureType:2},shaderSource:I,hasMain:!0}},a_=(e,t,n)=>{let o=Mp(t.length,n.cacheKey);return{...o,get:()=>Bp(e,o,t,n.axis)}},Gn=(e,t,n)=>{let o=e.indexOf(t);return e.map((u,l)=>l===o?`${u} - ${n}`:u).join()}}),u_,Fp,Lp,jp,Vs,Up,Vp,Gp,l_,qp,X3=D(()=>{"use strict";it(),ke(),K3(),u_=(e,t,n)=>(qp(t),e.session.pack&&t[0].dims.length>1?[e.run(a_(e,t,n),t)]:[e.run(jp(e,t,n),t)]),Fp=(e,t)=>({name:"Concat",inputNames:Array.from({length:e},(n,o)=>`X${o}`),inputTypes:Array(e).fill(0),cacheHint:t}),Lp=(e,t,n,o)=>{let u=n[0].dims.slice();if(o>=u.length||o<-1*u.length)throw new Error("axis specified for concat doesn't match input dimensionality");o<0&&(o=u.length+o);let l=u.slice(0);for(let h=1;h<n.length;h++){let m=n[h].dims.slice();for(let b=0;b<u.length;b++)if(b===o)l[o]+=m[b];else if(u[b]!==m[b])throw new Error("non concat dimensions must match")}let d=l.length,c=new Array(n.length),s=0;for(let h=0;h<c.length;++h)s+=n[h].dims[o],c[h]=s;let r="";n.length<5?r=Vs(c):r=Up(c);let i=Vp(n.length,d),a=Gp(c),p=`
        ${i}
        ${a}
        ${r}
        float process(int indices[${d}]) {
          int textureIndex = getTextureWhereDataResides (indices[${o}]);

          if(textureIndex != 0) {
            indices[${o}] = indices[${o}] - int(getSizeInConcatAxisValueFromIndex(textureIndex-int(1)));
          }

          return fetchDataFromCorrectTexture(textureIndex, indices);
        }`;return{...t,output:{dims:l,type:n[0].type,textureType:0},shaderSource:p}},jp=(e,t,n)=>{let o=Fp(t.length,n.cacheKey);return{...o,get:()=>Lp(e,o,t,n.axis)}},Vs=e=>`int getTextureWhereDataResides(int index) {
      ${e.map((t,n)=>`if(index<${t}) {return ${n};}
`).join("")}
    }`,Up=e=>Vs(e),Vp=(e,t)=>{let n=[`float fetchDataFromCorrectTexture(int textureIndex, int indices[${t}]) {`];for(let o=0;o<e;++o)o===0?n.push(`	if (textureIndex == ${o}) { return _X${o}(indices); }`):o===e-1?n.push(`	else { return _X${o}(indices); }`):n.push(`	else if (textureIndex == ${o}) { return _X${o}(indices); }`);return n.push("	}"),n.join(`
`)},Gp=e=>{let t=["int getSizeInConcatAxisValueFromIndex(int index) {"];for(let n=0;n<e.length;++n)n===0?t.push(`	if (index == ${n}) { return ${e[n]}; }`):n===e.length-1?t.push(`	else { return ${e[n]}; }`):t.push(`	else if (index == ${n}) { return ${e[n]}; }`);return t.push("	}"),t.join(`
`)},l_=e=>je({axis:e.attributes.getInt("axis")}),qp=e=>{if(!e||e.length<1)throw new Error("too few inputs");let t=e[0].type,n=e[0].dims.length;if(t==="string")throw new Error("string tensor is not supported yet");for(let o of e){if(o.type!==t)throw new Error("input tensors should be one type");if(o.dims.length!==n)throw new Error("input tensors should have the same shape")}}});function Z3(){return It("abs")}function Y3(){return It("acos")}function J3(){return It("asin")}function Q3(){return It("atan")}function eO(){return It("ceil")}function tO(){return It("cos")}function rO(e){return{body:`
  const float alpha = float(${e});

  float elu_(float a) {
    return a >= 0.0 ? a: (exp(a) - 1.0) * alpha;
  }
  vec4 elu_(vec4 v) {
    return vec4(elu_(v.x), elu_(v.y), elu_(v.z), elu_(v.w));
  }
  `,name:"elu",type:0}}function nO(){return It("exp")}function iO(){return It("floor")}function d_(e,t){let n="clip";return{body:`
  const float min = float(${e});
  const float max = float(${t});

  float ${n}_(float a) {
    return clamp(a, min, max);
  }
  vec4 ${n}_(vec4 v) {
    return clamp(v, min, max);
  }
  `,name:n,type:0}}function oO(){let e="indentity";return{body:`
  float ${e}_(float a) {
    return a;
  }
  vec4 ${e}_(vec4 v) {
    return v;
  }
  `,name:e,type:0}}function sO(e){let t="leakyRelu";return{body:`
  const float alpha = float(${e});

  float ${t}_(float a) {
    return a < 0.0 ? a * alpha : a;
  }
  vec4 ${t}_(vec4 v) {
    return vec4(${t}_(v.x), ${t}_(v.y), ${t}_(v.z), ${t}_(v.w));
  }
  `,name:t,type:0}}function aO(){return It("log")}function uO(){return{body:`
  float neg_(float a) {
    return -a;
  }
  vec4 neg_(vec4 v) {
    return -v;
  }
  `,name:"neg",type:0}}function lO(){return{body:`
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
  `,name:"not",type:0}}function dO(){return It("sin")}function c_(){let e="relu";return{body:`
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
  `,name:e,type:0}}function cO(){return It("sqrt")}function pO(){return It("tan")}function hO(){let e="tanh";return{body:`
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
  `,name:e,type:0}}function It(e){return{body:`
  float ${e}_(float a) {
    return ${e}(a);
  }
  vec4 ${e}_(vec4 v) {
    return ${e}(v);
  }
  `,name:e,type:0}}var Hp,We,h_,f_,m_,g_,Ru,b_,y_,Wp,__,w_,v_,x_,$_,T_,Nu,S_,I_,O_,E_,A_,P_,k_,C_,D_,R_,N_,z_=D(()=>{"use strict";it(),Ne(),vr(),He(),ke(),Hp=(e,t,n,o)=>{let u=e.session.pack?2:0,l=Ee(e.session.backend.glContext.version);return{...t,output:{dims:n.dims,type:n.type,textureType:u},shaderSource:`
     ${o.body}
     void main() {
       vec4 v = ${l.texture2D}(A, TexCoords);
       v = ${o.name}_(v);
       ${l.output} = v;
     }
     `,hasMain:!0}},We=(e,t,n,o)=>{let u=e.session.pack?2:0,l={name:n.name,inputTypes:[u],inputNames:["A"],cacheHint:o};return{...l,get:()=>Hp(e,l,t,n)}},h_=(e,t)=>[e.run(We(e,t[0],Z3()),t)],f_=(e,t)=>[e.run(We(e,t[0],Y3()),t)],m_=(e,t)=>[e.run(We(e,t[0],J3()),t)],g_=(e,t)=>[e.run(We(e,t[0],Q3()),t)],Ru=(e,t,n)=>[e.run(We(e,t[0],d_(n.min,n.max),n.cacheKey),t)],b_=e=>je({min:e.attributes.getFloat("min",gi),max:e.attributes.getFloat("max",bi)}),y_=(e,t)=>{let n=Wp(e,t);return Ru(e,[t[0]],n)},Wp=(e,t)=>{if(t.length>=3&&(!e.session.isInitializer(t[1].dataId)||!e.session.isInitializer(t[2].dataId)))throw new Error("dynamic clip attributes are not allowed");let n=t.length>=3?t[1].numberData[0]:gi,o=t.length>=3?t[2].numberData[0]:bi;return je({min:n,max:o})},__=(e,t)=>[e.run(We(e,t[0],eO()),t)],w_=(e,t)=>[e.run(We(e,t[0],tO()),t)],v_=(e,t,n)=>[e.run(We(e,t[0],rO(n.alpha),n.cacheKey),t)],x_=e=>je({alpha:e.attributes.getFloat("alpha",1)}),$_=(e,t)=>[e.run(We(e,t[0],nO()),t)],T_=(e,t)=>[e.run(We(e,t[0],iO()),t)],Nu=(e,t)=>[e.run(We(e,t[0],oO()),t)],S_=(e,t,n)=>[e.run(We(e,t[0],sO(n.alpha),n.cacheKey),t)],I_=e=>je({alpha:e.attributes.getFloat("alpha",.01)}),O_=(e,t)=>[e.run(We(e,t[0],aO()),t)],E_=(e,t)=>[e.run(We(e,t[0],uO()),t)],A_=(e,t)=>[e.run(We(e,t[0],lO()),t)],P_=(e,t)=>[e.run(We(e,t[0],c_()),t)],k_=(e,t)=>[e.run(We(e,t[0],p_()),t)],C_=(e,t)=>[e.run(We(e,t[0],dO()),t)],D_=(e,t)=>[e.run(We(e,t[0],cO()),t)],R_=(e,t)=>[e.run(We(e,t[0],pO()),t)],N_=(e,t)=>[e.run(We(e,t[0],hO()),t)]});function xi(e){let t;switch(e.activation){case"Relu":t=c_();break;case"Sigmoid":t=p_();break;case"Clip":t=d_(e.clipMin,e.clipMax);break;default:return{activationFunction:"",applyActivation:""}}let n=t.name,o=t.body,u=`value = ${n}_(value);`;return{activationFunction:o,applyActivation:u}}var Bo,En=D(()=>{"use strict";Ne(),z_(),Bo=e=>{let t=e.getString("activation","");if(t==="Clip"){let[n,o]=e.getFloats("activation_params",[gi,bi]);return{activation:t,clipMax:o,clipMin:n,activationCacheKey:`${t}:${n},${o}`}}return{activation:t,activationCacheKey:t}}}),Kp,Xp,M_,fO=D(()=>{"use strict";zt(),He(),ke(),wl(),En(),Kp=(e,t)=>({name:"GroupedConv",inputNames:e?["X","W","Bias"]:["X","W"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),Xp=(e,t,n,o)=>{let u=t.length>2?"value += getBias(output_channel);":"",l=t[0].dims.slice(),d=t[1].dims.slice(),c=d[0]/o.group;Ke.verbose("GroupedConv",`autpPad:${o.autoPad}, dilations:${o.dilations}, group:${o.group}, kernelShape:${o.kernelShape}, pads:${o.pads}, strides:${o.strides}`);let s=hi(l,d,o.dilations,o.pads,o.strides),r=Ee(e.session.backend.glContext.version),{activationFunction:i,applyActivation:a}=xi(o),p=`
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
`;return{...n,output:{dims:s,type:t[0].type,textureType:0},shaderSource:p,hasMain:!0}},M_=(e,t,n)=>{let o=Kp(t.length>2,n.cacheKey);return{...o,get:()=>Xp(e,t,o,n)}}}),Zp,Yp,B_,mO=D(()=>{"use strict";He(),ke(),In(),Zp=e=>({name:"Im2Col (packed)",inputNames:["A"],inputTypes:[2],cacheHint:e}),Yp=(e,t,n,o,u,l)=>{let d=n.dims,c=o.dims,s=2,r=3,i=u.length,a=[c[1]*c[2]*c[3],u[2]*u[3]],p=c[2]*c[3],h=vi(),m=Ee(e.session.backend.glContext.version),b="";for(let v=0;v<=1;v++)for(let y=0;y<=1;y++)b+=`
            blockIndex = rc.x + ${y};
            pos = rc.y + ${v};

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
                    result[${v*2+y}] = getChannel(
                      getA(0, ch, int(innerDims.x),
                      int(innerDims.y)), innerDims);
                }
              }
            }

          `;let $=`
      ${h}

      void main() {
        ivec2 rc = getOutputCoords();
          vec4 result = vec4(0.0);
          int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
          vec2 innerDims;
          ${b}
          ${m.output} = result;
      }
            `;return{...t,output:{dims:a,type:n.type,textureType:2},shaderSource:$,hasMain:!0}},B_=(e,t,n,o,u)=>{let l=Zp(u.cacheKey);return{...l,get:()=>Yp(e,l,t,n,o,u)}}});function gO(e,t,n){let o=t[0].dims,u=t[1].dims,l=Gt.calcShape(o,u,!0);if(!l)throw new Error("Can't use matmul on the given tensors");let d=_r(l.length),c=xn(),{activationFunction:s,applyActivation:r}=xi(n),i=t.length>2,a=i?"value += getBiasForMatmul();":"",p=i?`${L_(d,c,t[2].dims,l,!1)}`:"",h=l.length,m=o.length,b=u.length,$=o[o.length-1],v=`
    ${s}
    ${p}
    float process(int indices[${h}]) {
        int a[${m}];
        int b[${b}];
        bcastMatmulIndices_A(indices, a);
        bcastMatmulIndices_B(indices, b);

        float value;
        for (int k=0; k<${$}; ++k) {
            a[${m-1}] = k;
            b[${b-2}] = k;
            value += _A(a) * _B(b);
        }
        ${a}
        ${r}
        return value;
    }`;return{...e,output:{dims:l,type:t[0].type,textureType:0},shaderSource:v}}function F_(e,t){let n=V_(e.length>2,t.activationCacheKey);return{...n,get:()=>gO(n,e,t)}}function L_(e,t,n,o,u){let l="",d=n.length,c=o.length,s=c-d;c<2&&d>0?l="coords":l=n.map((p,h)=>`coords.${t[h+s]}`).join(", ");let r=Gt.getBroadcastDims(n,o).map(p=>`coords.${t[p+s]} = 0;`).join(`
`),i=be.size(n)===1,a="vec4(outputValue.xx, outputValue.yy)";return i&&(a="vec4(outputValue.x)"),u?`
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
}`}var j_,U_,V_,Jp,yl=D(()=>{"use strict";Ne(),ke(),Qt(),En(),G_(),j_=(e,t,n)=>(Jp(t),e.session.pack?[e.run(_l(e,t,n),t)]:[e.run(F_(t,n),t)]),U_=e=>Bo(e.attributes),V_=(e,t)=>({name:"MatMul",inputNames:e?["A","B","Bias"]:["A","B"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),Jp=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.");if(e[0].type!=="float32"&&e[0].type!=="float64"||e[1].type!=="float32"&&e[1].type!=="float64")throw new Error("inputs should be float type");if(e[0].type!==e[1].type)throw new Error("inputs types should match")}});function bO(e,t,n,o){let u=[],l=[],d=n[0].dims,c=n[1].dims,s=d.length,r=c.length,i=o.length,a=i-s,p=i-r;u=d.map((y,T)=>`coords.${t[T+a]}`),u[s-1]="i*2",u.join(", "),l=c.map((y,T)=>`coords.${t[T+p]}`),l[r-2]="i*2",l.join(", ");let h=Gt.getBroadcastDims(d,o),m=Gt.getBroadcastDims(c,o),b=h.map(y=>`coords.${t[y+a]} = 0;`).join(`
`),$=m.map(y=>`coords.${t[y+p]} = 0;`).join(`
`),v=`int lastDim = coords.${t[i-1]};
  coords.${t[i-1]} = coords.${t[i-2]};
  coords.${t[i-2]} = lastDim;`;return`
vec4 getAAtOutCoordsMatmul(int i) {
  ${e} coords = getOutputCoords();
  ${v}
  ${b}
  vec4 outputValue = getA(${u});
  return outputValue;
}

vec4 getBAtOutCoordsMatmul(int i) {
  ${e} coords = getOutputCoords();
  ${v}
  ${$}
  vec4 outputValue = getB(${l});
  return outputValue;
}`}function yO(e,t){let n="";for(let o=0;o<t-2;o++)n+=`rc.${e[o]}, `;return n+=`rc.${e[t-2]}, i*2`,n}function _O(e,t){let n="";for(let o=0;o<t-2;o++)n+=`rc.${e[o]}, `;return n+=`i*2, rc.${e[t-1]}`,n}var Qp,eh,_l,G_=D(()=>{"use strict";Ne(),He(),ke(),Qt(),En(),yl(),Qp=(e,t)=>({name:"MatMul (packed)",inputNames:e?["A","B","Bias"]:["A","B"],inputTypes:e?[2,2,2]:[2,2],cacheHint:t}),eh=(e,t,n,o)=>{let u=n.length>2,l=u?"value += getBiasForMatmul();":"",d=n[0].dims,c=n[1].dims,s=Gt.calcShape(d,c,!0),r=!be.areEqual(n[0].dims,n[1].dims);if(!s)throw new Error("Can't use matmul on the given tensors");let i=d[d.length-1],a=Math.ceil(i/2),p=d.length,h=c.length,m=Ee(e.session.backend.glContext.version),b=_r(s.length),$=s.length,v=xn(),{activationFunction:y,applyActivation:T}=xi(o),I=u?`${L_(b,v,n[2].dims,s,!0)}`:"",S=r?`${bO(b,v,n,s)}`:"",A=r?"getAAtOutCoordsMatmul(i)":`getA(${yO(v,p)})`,k=r?"getBAtOutCoordsMatmul(i)":`getB(${_O(v,h)})`,O=r?"":`${b} rc =
          getOutputCoords(); int lastDim = rc.${v[$-1]}; rc.${v[$-1]} =
          rc.${v[$-2]}; rc.${v[$-2]} = lastDim;
      `,L=`
            ${S}
            ${I}
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
              ${T}
              ${m.output} = value;
            }`;return{...t,output:{dims:s,type:n[0].type,textureType:2},shaderSource:L,hasMain:!0}},_l=(e,t,n)=>{let o=Qp(t.length>2,n.activationCacheKey);return{...o,get:()=>eh(e,o,t,n)}}}),q_,wO=D(()=>{"use strict";wl(),mO(),G_(),q_=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=hi(o,u,n.dilations,n.pads,n.strides),d=e.run(B_(e,t[0],t[1],l,n),[t[0]]),c=e.reshapePacked(t[1],[u[0],u[1]*u[2]*u[3]]),s=t.length===3?[c,d,t[2]]:[c,d],r=e.run(_l(e,s,n),s);return e.reshapePacked(r,l)}}),th,rh,H_,zu,W_=D(()=>{"use strict";ke(),th=e=>({name:"Im2Col",inputNames:["X"],inputTypes:[0],cacheHint:e}),rh=(e,t,n,o,u,l)=>{let d=n.dims,c=o.dims,s=u.length,r=zu(d,c,u,4),i=`
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
        `;return{...t,output:{dims:r,type:n.type,textureType:4},shaderSource:i}},H_=(e,t,n,o,u)=>{let l=th(u.cacheKey);return{...l,get:()=>rh(e,l,t,n,o,u)}},zu=(e,t,n,o=4)=>[n[0],n[2],n[3],Math.ceil(e[1]*t[2]*t[3]/o)]}),nh,ih,K_,vO=D(()=>{"use strict";Ne(),He(),ke(),En(),W_(),nh=(e,t)=>({name:"ConvDotProduct",inputNames:e?["Im2Col","K","B"]:["Im2Col","K"],inputTypes:e?[0,4,0]:[0,4],cacheKey:t.activationCacheKey}),ih=(e,t,n,o,u)=>{let l=n[0].dims,d=n[1].dims,c=[d[0],Math.ceil(l[1]*d[2]*d[3]/4)],s=zu(l,d,o),[r,i]=e.calculateTextureWidthAndHeight(c,4),a=be.computeStrides(s),[p,h]=e.calculateTextureWidthAndHeight(s,4),m=o.length,b=n.length<3?"0.0":"_B(b)",$=Math.ceil(l[1]*d[2]*d[3]/4),{activationFunction:v,applyActivation:y}=xi(u),T=Ee(e.session.backend.glContext.version),I=`
${v}
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
  for (int i = 0; i < ${$}; ++i) {
    vec2 im2colCoords = offsetToCoords(im2colOffset, ${p}, ${h});
    vec2 kernelCoords = offsetToCoords(kernelOffset, ${r}, ${i});
    value += dot(${T.texture2D}(Im2Col, im2colCoords), ${T.texture2D}(K, kernelCoords));
    ++im2colOffset;
    ++kernelOffset;
  }
  ${y}
  return value;
}`;return{...t,output:{dims:o,type:n[0].type,textureType:0},shaderSource:I}},K_=(e,t,n,o)=>{let u=nh(t.length>2,o);return{...u,get:()=>ih(e,u,t,n,o)}}}),hi,Mu,oh,sh,ah,uh,Bu,lh,wl=D(()=>{"use strict";it(),Ne(),fO(),wO(),vO(),En(),W_(),yl(),hi=(e,t,n,o,u)=>{let l=e[0],d=e.slice(2),c=d.length,s=t[0],r=t.slice(2).map((a,p)=>a+(a-1)*(n[p]-1)),i=d.map((a,p)=>a+o[p]+o[p+c]).map((a,p)=>Math.floor((a-r[p]+u[p])/u[p]));return[l,s].concat(...i)},Mu=(e,t,n)=>(lh(t,n),oh(e,t,n)),oh=(e,t,n)=>{let o=uh(n,t),u=e.session.pack,l=o.kernelShape[0]===1&&o.kernelShape[1]===1;return o.group>1?[e.run(M_(e,t,o),t)]:l&&u?[sh(e,t,o)]:u&&t[0].dims.length===4&&t[0].dims[0]===1&&!l?[q_(e,t,o)]:[ah(e,t,o)]},sh=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=hi(o,u,n.dilations,n.pads,n.strides),d=e.reshapeUnpacked(t[0],[o[1],o[2]*o[3]]),c=e.reshapeUnpacked(t[1],[u[0],u[1]]),s=t.length>2?[c,d,t[2]]:[c,d],r=e.run(F_(s,n),s);return e.reshapeUnpacked(r,l)},ah=(e,t,n)=>{let o=t[0].dims,u=t[1].dims,l=hi(o,u,n.dilations,n.pads,n.strides),d=e.run(H_(e,t[0],t[1],l,n),[t[0]]),c=t.length===3?[d,t[1],t[2]]:[d,t[1]];return e.run(K_(e,t,l,n),c)},uh=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0)for(let l=2;l<t[1].dims.length;++l)n.push(t[1].dims[l]);let o=e.pads.slice();xo.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,n,o,e.autoPad);let u=Object.assign({},e);return Object.assign(u,{kernelShape:n,pads:o,cacheKey:e.cacheKey}),u},Bu=e=>{let t=e.attributes,n=Bo(t),o=t.getString("auto_pad","NOTSET"),u=t.getInts("dilations",[1,1]),l=t.getInt("group",1),d=t.getInts("kernel_shape",[]),c=t.getInts("pads",[0,0,0,0]),s=t.getInts("strides",[1,1]);return je({autoPad:o,dilations:u,group:l,kernelShape:d,pads:c,strides:s,...n})},lh=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4||e[1].dims.length!==4)throw new Error("currently only support 2-dimensional conv");let n=e[0].dims[1],o=e[1].dims[1]*t.group;if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let u=e[0].dims.length-2;if(t.dilations.length!==u)throw new Error(`dilations should be ${u}D`);if(t.strides.length!==u)throw new Error(`strides should be ${u}D`);if(t.pads.length!==u*2)throw new Error(`pads should be ${u*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(e[0].type!=="float32"||e[1].type!=="float32")throw new Error("Conv input(X,W) should be float tensor");if(e.length===3&&e[2].type!=="float32")throw new Error("Conv input(bias) should be float tensor")}}),dh,ch,ph,X_,hh,fh,mh,gh,bh,yh,Z_,_h,xO=D(()=>{"use strict";it(),He(),ke(),En(),dh=(e,t,n,o,u,l)=>(e-1)*t+n+(o-1)*u+1-l,ch=(e,t,n,o,u)=>{let l=Math.floor(e/2);t==="SAME_UPPER"?(n[o]=l,n[u]=e-l):t==="SAME_LOWER"&&(n[o]=e-l,n[u]=l)},ph=(e,t,n,o,u,l,d,c)=>{let s=e.length-2,r=c.length===0;for(let i=0;i<s;++i){let a=r?e[i+2]*l[i]:c[i],p=dh(e[i+2],l[i],u[i],t[i],n[i],a);ch(p,o,u,i,i+s),r&&c.push(l[i]*(e[i+2]-1)+d[i]+(t[i]-1)*n[i]+1-u[i]-u[i+s])}},X_=(e,t,n)=>(_h(t,n),hh(e,t,n)),hh=(e,t,n)=>{let o=yh(n,t);return[bh(e,t,o)]},fh=(e,t)=>({name:"ConvTranspose",inputNames:e?["X","W","B"]:["X","W"],inputTypes:e?[0,0,0]:[0,0],cacheHint:t}),mh=(e,t,n,o)=>{let u=t.length>2?"getB(output_channel)":"0.0",l=t[0].dims,d=t[1].dims,c=d[1],s=d[0]/o.group,r=[t[0].dims[0],t[1].dims[1]*o.group,...o.outputShape],i=Ee(e.session.backend.glContext.version),{activationFunction:a,applyActivation:p}=xi(o),h=`
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
`;return{...n,output:{dims:r,type:t[0].type,textureType:0},shaderSource:h,hasMain:!0}},gh=(e,t,n)=>{let o=fh(t.length>2,n.cacheKey);return{...o,get:()=>mh(e,t,o,n)}},bh=(e,t,n)=>e.run(gh(e,t,n),t),yh=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0)for(let c=2;c<t[1].dims.length;++c)n.push(t[1].dims[c]);let o=e.pads.slice(),u=e.outputShape.slice(),l=t[0].dims;ph(l,n,e.dilations,e.autoPad,o,e.strides,e.outputPadding,u);let d=Object.assign({},e);return Object.assign(d,{kernelShape:n,pads:o,outputShape:u,cacheKey:e.cacheKey}),d},Z_=e=>{let t=e.attributes,n=Bo(t),o=t.getString("auto_pad","NOTSET"),u=t.getInts("dilations",[1,1]),l=t.getInt("group",1),d=t.getInts("kernel_shape",[]),c=t.getInts("output_padding",[0,0]),s=t.getInts("output_shape",[]),r=t.getInts("pads",[0,0,0,0]),i=t.getInts("strides",[1,1]);return je({autoPad:o,dilations:u,group:l,kernelShape:d,outputPadding:c,outputShape:s,pads:r,strides:i,...n})},_h=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4||e[1].dims.length!==4)throw new Error("currently only support 2-dimensional conv");let n=e[0].dims[1],o=e[1].dims[0];if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let u=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==u))throw new Error("invalid bias");let l=e[0].dims.length-2;if(t.dilations.length!==l)throw new Error(`dilations should be ${l}D`);if(t.strides.length!==l)throw new Error(`strides should be ${l}D`);if(t.pads.length!==l*2)throw new Error(`pads should be ${l*2}D`);if(t.outputPadding.length!==l)throw new Error(`output_padding should be ${l}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape");if(e[0].type!=="float32"||e[1].type!=="float32")throw new Error("ConvTranspose input(X,W) should be float tensor");if(e.length===3&&e[2].type!=="float32")throw new Error("ConvTranspose input(bias) should be float tensor")}}),Gs,yi,Y_,wh,qs,vh,xh,$h,vl=D(()=>{"use strict";it(),Ne(),ke(),Gs={name:"Transpose",inputNames:["A"],inputTypes:[0]},yi=(e,t,n)=>($h(t),[e.run({...Gs,cacheHint:n.cacheKey,get:()=>wh(e,t[0],n.perm)},t)]),Y_=e=>je({perm:e.attributes.getInts("perm",[])}),wh=(e,t,n)=>{let o=t.dims;n=qs(o,n);let u=vh(o,n),l=o.length,d=`
      ${xh("perm",n,l)}
      float process(int indices[${l}]) {
        int a[${l}];
        perm(a, indices);
        return _A(a);
      }`;return{...Gs,output:{dims:u,type:t.type,textureType:0},shaderSource:d}},qs=(e,t)=>(t&&t.length!==e.length&&(t=[...e.keys()].reverse()),t),vh=(e,t)=>(t=qs(e,t),be.sortBasedOnPerm(e,t)),xh=(e,t,n)=>{let o=[];o.push(`void ${e}(out int a[${n}], int src[${n}]) {`);for(let u=0;u<n;++u)o.push(`	a[${t[u]}]=src[${u}];`);return o.push("	}"),o.join(`
`)},$h=e=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("input should be float tensor")}}),J_,Q_,Th,$O=D(()=>{"use strict";vl(),J_=(e,t,n)=>{Th(t);let o=n.blocksize,u=o*o,l=n.mode==="DCR"?[0,3,4,1,5,2]:[0,1,4,2,5,3],d=n.mode==="DCR"?[t[0].dims[0],o,o,t[0].dims[1]/u,t[0].dims[2],t[0].dims[3]]:[t[0].dims[0],t[0].dims[1]/u,o,o,t[0].dims[2],t[0].dims[3]],c=e.reshapeUnpacked(t[0],d),s={perm:l,cacheKey:`${l}`},[r]=yi(e,[c],s),i=[t[0].dims[0],t[0].dims[1]/u,t[0].dims[2]*o,t[0].dims[3]*o];return[e.reshapeUnpacked(r,i)]},Q_=e=>{let t=e.attributes.getInt("blocksize");if(t<1)throw new Error(`blocksize must be >= 1, but got : ${t} for DepthToSpace`);let n=e.attributes.getString("mode","DCR");if(n!=="DCR"&&n!=="CRD")throw new Error(`unrecognized mode: ${n} for DepthToSpace`);return{mode:n,blocksize:t}},Th=e=>{if(e.length!==1)throw new Error(`DepthToSpace expect 1 inputs, but got ${e.length}`);if(e[0].type==="string"||e[0].dims.length!==4)throw new TypeError("DepthToSpace input should be a 4-D numeric tensor")}}),ew,tw,Sh,TO=D(()=>{"use strict";Ne(),ew=(e,t,n)=>{Sh(t,n);let o=be.flattenShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},tw=e=>e.attributes.getInt("axis",1),Sh=(e,t)=>{if(!e||e.length!==1)throw new Error("Flatten requires 1 input.");let n=e[0].dims.length;if(n===0)throw new Error("scalar tensor is not supported.");if(t<-n||t>n)throw new Error("Invalid axis");if(e[0].type==="string")throw new Error("string tensor is not supported.")}}),$i,Fo=D(()=>{"use strict";$i=["float32","float64","int32","int16","int8","uint16","uint32","uint8"]}),rw,nw,Ih,Oh,Eh,Ah,SO=D(()=>{"use strict";it(),Fo(),Ne(),ke(),rw=(e,t,n)=>(Ah(t,n.axis),[e.run(Eh(e,t,n),t)]),nw=e=>je({axis:e.attributes.getInt("axis",0)}),Ih={name:"Gather",inputNames:["A","B"],inputTypes:[0,0]},Oh=(e,t,n,o)=>{let u=n[0].dims.slice(),l=n[1].dims.slice(),d=new Array(u.length+l.length-1);o=be.normalizeAxis(o,u.length);let c=[];for(let p=0;p<d.length;p++)p<o?(d[p]=u[p],c.push(`inputIdx[${p}] = outputIdx[${p}];`)):p<o+l.length?(d[p]=l[p-o],c.push(`indexDataIdx[${p-o}] = outputIdx[${p}];`)):(d[p]=u[p-l.length+1],c.push(`inputIdx[${p-l.length+1}] = outputIdx[${p}];`));let s=d.length||1,r=u.length,i=l.length||1,a=`
      float process(int outputIdx[${s}]) {
        int inputIdx[${r}];
        int indexDataIdx[${i}];
        indexDataIdx[0] = 0;
        ${c.join(`
        `)}
        int idx = int(_B(indexDataIdx));
        inputIdx[${o}] = idx < 0 ? idx + ${u[o]} : idx;
        return _A(inputIdx);
      }`;return{...t,output:{dims:d,type:n[0].type,textureType:0},shaderSource:a}},Eh=(e,t,n)=>{let o={...Ih,cacheHint:n.cacheKey};return{...o,get:()=>Oh(e,o,t,n.axis)}},Ah=(e,t)=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.");let n=e[0].dims.length;if(n<1)throw new Error("Invalid input shape.");if(t<-n||t>n-1)throw new Error("Invalid axis.");if($i.indexOf(e[0].type)===-1)throw new Error("Invaid input type.");if(e[1].type!=="int32"&&e[1].type!=="int16")throw new Error("Invaid input type.")}}),Fu,Hs,iw,ow,Ph,kh,Ch,IO=D(()=>{"use strict";it(),Ne(),ke(),Fu=(e,t,n)=>(Ch(t,n),[e.run(Ph(t,n),t)]),Hs=(e,t)=>{let n=e.attributes.getInt("transA",0)!==0,o=e.attributes.getInt("transB",0)!==0,u=e.attributes.getFloat("alpha",1),l=e.attributes.getFloat("beta",1);return je({transA:n,transB:o,alpha:u,beta:l,isOptionalC:t})},iw=e=>Hs(e,!1),ow=e=>Hs(e,!0),Ph=(e,t)=>{let n={name:"Gemm",inputNames:e.length===3?["A","B","C"]:["A","B"],inputTypes:e.length===3?[0,0,0]:[0,0],key:t.cacheKey};return{...n,get:()=>kh(n,e,t)}},kh=(e,t,n)=>{let o=t[0].dims.slice(),u=t[1].dims.slice(),[l,d]=k0.getShapeOfGemmResult(o,n.transA,u,n.transB,t.length===3?t[2].dims:void 0),c=[l,d];if(!c)throw new Error("Can't use gemm on the given tensors");let s=o[o.length-1],r="";n.transA&&(s=o[0]),n.transA&&n.transB?r="value += _A_T(a) * _B_T(b);":n.transA&&!n.transB?r="value += _A_T(a) * _B(b);":!n.transA&&n.transB?r="value += _A(a) * _B_T(b);":!n.transA&&!n.transB&&(r="value += _A(a) * _B(b);");let i=c.length,a=t.length===3?`int c[${t[2].dims.length}];`:"",p=t.length===3?"bcastIndices_C(indices, c);":"",h=t.length===3?"value += beta * _C(c);":"",m=`
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
      }`;return{...e,output:{dims:c,type:t[0].type,textureType:0},variables:[{name:"alpha",type:"float",data:n.alpha},{name:"beta",type:"float",data:n.beta}],shaderSource:m}},Ch=(e,t)=>{if(!e)throw new Error("Input is missing");if(t.isOptionalC&&(e.length<2||e.length>3))throw new Error("Invaid input shape.");if(!t.isOptionalC&&e.length!==3)throw new Error("Gemm requires 3 inputs");if(e.length===3&&e[2].dims.length!==1&&e[2].dims.length!==2)throw new Error("Invalid input shape of C");if(e[0].type!=="float32"&&e[0].type!=="float64"||e[1].type!=="float32"&&e[1].type!=="float64"||e.length===3&&e[2].type!=="float32"&&e[2].type!=="float64")throw new Error("Invalid input type.");if(e[0].type!==e[1].type||e.length===3&&e[0].type!==e[2].type)throw new Error("Input types are mismatched")}}),sw,aw,Dh,Rh,Nh,zh,Mh,OO=D(()=>{"use strict";it(),ke(),sw=(e,t,n)=>(Mh(t),[e.run(Nh(e,t,n),t)]),aw=e=>{let t=e.attributes.getFloat("scale"),n=e.attributes.getFloats("bias");return je({scale:t,bias:n})},Dh={name:"ImageScaler",inputNames:["X"],inputTypes:[0]},Rh=(e,t,n,o)=>{let u=n[0].dims.slice(),l=u.length,d=`
      ${zh(o.bias.length)}
      float process(int indices[${l}]) {
        return _X(indices) * scale + getBias(bias, indices[1]);
      }`;return{...t,output:{dims:u,type:n[0].type,textureType:0},variables:[{name:"bias",type:"float",arrayLength:o.bias.length,data:o.bias},{name:"scale",type:"float",data:o.scale}],shaderSource:d}},Nh=(e,t,n)=>{let o={...Dh,cacheHint:n.cacheKey};return{...o,get:()=>Rh(e,o,t,n)}},zh=e=>{let t=[`float getBias(float bias[${e}], int channel) {`];for(let n=0;n<e;++n)n===0?t.push(`	if (channel == ${n}) { return bias[${n}]; }`):n===e-1?t.push(`	else { return bias[${n}]; }`):t.push(`	else if (channel == ${n}) { return bias[${n}]; }`);return t.push("	}"),t.join(`
`)},Mh=e=>{if(!e||e.length!==1)throw new Error("ImageScaler requires 1 input.");if(e[0].dims.length!==4)throw new Error("Invalid input shape.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")}}),uw,lw,Ws,Bh,Fh,Lh,jh,Uh,Vh,EO=D(()=>{"use strict";He(),ke(),uw=(e,t,n)=>{Vh(t);let o=e.run(Fh(t[0]),t);return[e.run(Uh(e,t[0],n,o.dims),[t[0],o,t[1],t[2]])]},lw=e=>e.attributes.getFloat("epsilon",1e-5),Ws={name:"InstanceNormalization_MeanAndVariance",inputNames:["X"],inputTypes:[0]},Bh=(e,t)=>{let n=t.dims.slice(),o=n[1],u=n[2]*n[3],l=[n[0],o],d=`
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
      }`;return{...e,output:{dims:l,type:t.type,textureType:4},shaderSource:d}},Fh=e=>({...Ws,get:()=>Bh(Ws,e)}),Lh={name:"InstanceNormalization_ComputeOutput",inputNames:["X","MeanAndVariance","Scale","B"],inputTypes:[0,4,0,0]},jh=(e,t,n,o,u)=>{let l=Ee(e.session.backend.glContext.version),[d,c]=e.calculateTextureWidthAndHeight(u,4),[s,r]=[d/4,c],i=`
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
      }`;return{...t,output:{dims:n.dims,type:n.type,textureType:0},variables:[{name:"epsilon",type:"float",data:o}],shaderSource:i}},Uh=(e,t,n,o)=>{let u={...Lh,cacheHint:`${n}`};return{...u,get:()=>jh(e,u,t,n,o)}},Vh=e=>{if(!e||e.length!==3)throw new Error("InstanceNormalization requires 3 inputs.");let t=e[0],n=e[1],o=e[2];if(t.dims.length<3||n.dims.length!==1||o.dims.length!==1)throw new Error("Invalid input shape.");if(n.dims[0]!==t.dims[1]||o.dims[0]!==t.dims[1])throw new Error("Input shapes are mismatched.");if(t.type!=="float32"&&t.type!=="float64"||n.type!=="float32"&&n.type!=="float64"||o.type!=="float32"&&o.type!=="float64")throw new Error("Invalid input type.");if(e[0].dims.length!==4)throw new Error("Only support 4-D input shape.")}});function AO(e,t){let n=e[0].dims[1],o=e[0].dims.length,u=-Math.floor((t.size-1)/2),l=Math.ceil((t.size-1)/2),d=`float(${t.alpha}) / float(${t.size})`,c=`float(${t.bias})`,s=`float(${t.beta})`,r=`
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
    }`;return{...xl,cacheHint:t.cacheKey,output:{dims:e[0].dims,type:e[0].type,textureType:0},shaderSource:r}}function PO(e,t){return{...xl,cacheHint:t.cacheKey,get:()=>AO(e,t)}}var dw,cw,xl,Gh,kO=D(()=>{"use strict";it(),ke(),dw=(e,t,n)=>(Gh(t),[e.run(PO(t,n),t)]),cw=e=>{let t=e.attributes.getFloat("alpha",1e-4),n=e.attributes.getFloat("beta",.75),o=e.attributes.getFloat("bias",1),u=e.attributes.getInt("size");return je({alpha:t,beta:n,bias:o,size:u})},xl={name:"LRN",inputNames:["X"],inputTypes:[0]},Gh=e=>{if(!e||e.length!==1)throw new Error("LRN requires 1 input.");if(e[0].dims.length!==4)throw new Error('currently only support LRN for input with "NCHW" format');if(e[0].type!=="float32")throw new Error("input should be float type")}}),qh,Lu,pw,hw,fw,Hh,Wh,Kh,Xh,Zh,Yh,Jh,Qh,CO=D(()=>{"use strict";it(),Ne(),He(),ke(),qh={name:"Pad",inputNames:["A"],inputTypes:[0]},Lu=(e,t,n)=>(Kh(t),[e.run({...qh,cacheHint:n.cacheKey,get:()=>Wh(e,t[0],n)},t)]),pw=e=>{let t=e.attributes.getString("mode","constant"),n=e.attributes.getFloat("value",0),o=e.attributes.getInts("pads");return je({mode:t,value:n,pads:o})},hw=(e,t,n)=>{Xh(t);let o=Hh(e,t,n);return Lu(e,[t[0]],o)},fw=e=>e.attributes.getString("mode","constant"),Hh=(e,t,n)=>{if(!e.session.isInitializer(t[1].dataId)||t.length>=3&&!e.session.isInitializer(t[2].dataId))throw new Error("dynamic pad attributes are not allowed");let o=Array.from(t[1].integerData),u=t.length>=3?t[2].floatData[0]:0;return je({mode:n,pads:o,value:u})},Wh=(e,t,n)=>{let o=be.padShape(t.dims.slice(),n.pads),u=o.length,l=`
      ${Zh(e,t,n)}
      float process(int[${u}] indices) {
          return padA(indices);
      }`;return{name:"Pad",inputNames:["A"],inputTypes:[0],output:{dims:o,type:t.type,textureType:0},shaderSource:l}},Kh=e=>{if(!e||e.length!==1)throw new Error("Pad requires 1 input");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")},Xh=e=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Pad requires 2 or 3 inputs");if(e[1].type!=="int32")throw new Error("Invalid input type.");if(e.length>=3&&e[2].type==="string")throw new Error("Invalid input type.")},Zh=(e,t,n)=>{let o=Ee(e.session.backend.glContext.version),[u,l]=e.calculateTextureWidthAndHeight(t.dims,0),d=be.computeStrides(t.dims);switch(n.mode){case"constant":return Yh(o,t.dims,d,u,l,n.pads,n.value);case"reflect":return Jh(o,t.dims,d,u,l,n.pads);case"edge":return Qh(o,t.dims,d,u,l,n.pads);default:throw new Error("Invalid mode")}},Yh=(e,t,n,o,u,l,d)=>{let c=t.length,s="";for(let r=c-1;r>=0;--r)s+=`
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
      `},Jh=(e,t,n,o,u,l)=>{let d=t.length,c="";for(let s=d-1;s>=0;--s)c+=`
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
      `}}),mw,gw,Ks,bw,yw,_w,ww,Xs,Zs,ef,Ys,vw,qn,Js,Hn,tf,DO=D(()=>{"use strict";it(),Ne(),ke(),mw=(e,t,n)=>{qn(t);let o={name:"AveragePool",inputNames:["X"],inputTypes:[0],cacheHint:n.cacheKey};return[e.run({...o,get:()=>Ks(t,o,!1,n)},t)]},gw=e=>{let t=e.attributes.getString("auto_pad","NOTSET"),n=e.attributes.getInt("ceil_mode",0),o=e.attributes.getInt("count_include_pad",0)!==0,u=e.attributes.getInts("kernel_shape"),l=e.attributes.getInts("strides",[]),d=e.attributes.getInts("pads",[]);if(n!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");return je({autoPad:t,ceilMode:n,countIncludePad:o,kernelShape:u,strides:l,pads:d})},Ks=(e,t,n,o)=>{let[u,l]=Zs(e,o,n),d=be.size(u.kernelShape),c="value += _X(x);",s="";u.countIncludePad?s+=`value /= float(${d});`:s+=`value /= float(${d} - pad);`;let r=`
        ${Js(e[0].dims,u,c,s,"0.0")}
      `;return{...t,output:{dims:l,type:e[0].type,textureType:0},shaderSource:r}},bw=(e,t,n)=>{qn(t);let o={name:"GlobalAveragePool",inputNames:["X"],inputTypes:[0],cacheHint:`${n.countIncludePad}`};return[e.run({...o,get:()=>Ks(t,o,!0,n)},t)]},yw=e=>{let t=e.attributes.getInt("count_include_pad",0)!==0;return je({autoPad:"",ceilMode:0,countIncludePad:t,kernelShape:[],strides:[],pads:[]})},_w=(e,t,n)=>{qn(t);let o={name:"MaxPool",inputNames:["X"],inputTypes:[0],cacheHint:n.cacheKey};return[e.run({...o,get:()=>Xs(t,o,!1,n)},t)]},ww=e=>{let t=e.attributes.getString("auto_pad","NOTSET"),n=e.attributes.getInt("ceil_mode",0),o=e.attributes.getInts("kernel_shape"),u=e.attributes.getInts("strides",[]),l=e.attributes.getInts("pads",[]),d=e.attributes.getInt("storage_order",0),c=e.attributes.getInts("dilations",[]);if(d!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");return je({autoPad:t,ceilMode:n,countIncludePad:!1,kernelShape:o,strides:u,pads:l,storageOrder:d,dilations:c})},Xs=(e,t,n,o)=>{let[u,l]=Zs(e,o,n),d=`
      ${Js(e[0].dims,u,`
      value = max(_X(x), value);
    `,"","-1e5")}
    `;return{...t,output:{dims:l,type:e[0].type,textureType:0},shaderSource:d}},Zs=(e,t,n)=>{let o=e[0].dims.slice(),u=Object.hasOwnProperty.call(t,"dilations"),l=t.kernelShape.slice(),d=t.strides.slice(),c=u?t.dilations.slice():[],s=t.pads.slice();xo.adjustPoolAttributes(n,o,l,d,c,s);let r=xo.computePoolOutputShape(n,o,d,c,l,s,t.autoPad),i=Object.assign({},t);return u?Object.assign(i,{kernelShape:l,strides:d,pads:s,dilations:c,cacheKey:t.cacheKey}):Object.assign(i,{kernelShape:l,strides:d,pads:s,cacheKey:t.cacheKey}),[i,r]},ef={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[],cacheKey:""},Ys={name:"GlobalMaxPool",inputNames:["X"],inputTypes:[0]},vw=(e,t)=>(qn(t),[e.run({...Ys,get:()=>Xs(t,Ys,!0,ef)},t)]),qn=e=>{if(!e||e.length!==1)throw new Error("Pool ops requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.")},Js=(e,t,n,o,u)=>{let l=e.length;if(t.kernelShape.length<=2){let d=t.kernelShape[t.kernelShape.length-1],c=t.strides[t.strides.length-1],s=t.pads[t.pads.length/2-1],r=t.pads[t.pads.length-1],i=e[l-1],a="",p="",h="";if(s+r!==0?a=`
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
          }`,t.kernelShape.length===2){let m=t.kernelShape[t.kernelShape.length-2],b=t.strides[t.strides.length-2],$=t.pads[t.pads.length/2-2],v=t.pads[t.pads.length-2],y=e[l-2];$+v!==0?p=`
            for (int j = 0; j < ${m}; j++) {
              x[${l} - 2] = indices[${l} - 2] * ${b} - ${$} + j;
              if (x[${l} - 2] < 0 || x[${l} - 2] >= ${y}) {
                pad+= ${d};
                continue;
              }
          `:p=`
            for (int j = 0; j < ${m}; j++) {
              x[${l} - 2] = indices[${l} - 2] * ${b} - ${$} + j;
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
      `}else{let d=be.size(t.kernelShape),c=be.computeStrides(t.kernelShape),s=c.length,r=t.pads.length,i=tf(s),a=Hn(e,"inputDims"),p=Hn(t.pads,"pads"),h=Hn(c,"kernelStrides"),m=Hn(t.strides,"strides"),b=t.pads.reduce((v,y)=>v+y),$="";return b?$=`
            if (x[j] >= inputDims[j] || x[j] < 0) {
              pad++;
              isPad = true;
              break;
            }
          }
          if (!isPad) {
            ${n}
          }`:$=`
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
              ${$}
          }
          ${o}

          return value;
        }
      `}},Hn=(e,t)=>{let n="";for(let o=0;o<e.length;o++)n+=`
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
  }`}),ur,br,rf,nf,xw,$w,Tw,Sw,Iw,Ow,Ew,RO=D(()=>{"use strict";it(),Fo(),Ne(),ke(),ur=(e,t,n,o,u)=>{nf(t);let l={name:o,inputNames:["A"],inputTypes:[0]};return[e.run({...l,cacheHint:n.cacheKey,get:()=>rf(e,t,n,o,u,l)},t)]},br=e=>{let t=e.attributes.getInts("axes",[]),n=e.attributes.getInt("keepdims",1)===1;return je({axes:t,keepDims:n})},rf=(e,t,n,o,u,l)=>{let d=[],c=t[0].dims.length||1,s=[],r=be.normalizeAxes(n.axes,t[0].dims.length),i=u(t,r),a=i[1];for(let h=0;h<t[0].dims.length;h++)r.indexOf(h)>=0||r.length===0?(n.keepDims&&d.push(1),a=`
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
      }`;return{...l,output:{dims:d,type:t[0].type,textureType:0},shaderSource:p}},nf=e=>{if(!e||e.length!==1)throw new Error("Reduce op requires 1 input.");if($i.indexOf(e[0].type)===-1)throw new Error("Invalid input type.")},xw=(e,t,n)=>ur(e,t,n,"ReduceSum",()=>["value = 0.0;","value += _A(inputIdx);",""]),$w=(e,t,n)=>ur(e,t,n,"ReduceMean",(o,u)=>{let l=1;for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&(l*=o[0].dims[d]);return["value = 0.0;","value += _A(inputIdx);",`value /= ${l}.;`]}),Tw=(e,t,n)=>ur(e,t,n,"ReduceMax",(o,u)=>{let l=[];for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`inputIdx[${d}] = 0;`);return[`${l.join(`
`)}
value = _A(inputIdx);`,"value = max(value, _A(inputIdx));",""]}),Sw=(e,t,n)=>ur(e,t,n,"ReduceMin",(o,u)=>{let l=[];for(let d=0;d<o[0].dims.length;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`inputIdx[${d}] = 0;`);return[`${l.join(`
`)}
value = _A(inputIdx);`,"value = min(value, _A(inputIdx));",""]}),Iw=(e,t,n)=>ur(e,t,n,"ReduceProd",()=>["value = 1.0;","value *= _A(inputIdx);",""]),Ow=(e,t,n)=>ur(e,t,n,"ReduceLogSum",()=>["value = 0.0;","value += _A(inputIdx);","value = log(value);"]),Ew=(e,t,n)=>ur(e,t,n,"ReduceLogSumSquare",()=>["float t; value = 0.0;","t = _A(inputIdx); value += t * t;",""])}),Aw,NO=D(()=>{"use strict";Ne(),Aw=(e,t)=>{let n=be.calculateReshapedDims(t[0].dims,t[1].integerData);return e.session.pack?[e.reshapePacked(t[0],n)]:[e.reshapeUnpacked(t[0],n)]}}),Qs,ju,Pw,kw,fi,of,Uu,To,Cw=D(()=>{"use strict";it(),He(),ke(),Qs={name:"Upsample",inputNames:["X"],inputTypes:[0]},ju=(e,t,n)=>(Uu(t,n),[e.run({...Qs,cacheHint:n.cacheKey,get:()=>of(e,t,n)},t)]),Pw=e=>fi(e,7),kw=e=>fi(e,9),fi=(e,t)=>{let n=t>=10,o=e.attributes.getString("mode","nearest");if(o!=="nearest"&&o!=="linear"&&(t<11||o!=="cubic"))throw new Error(`unrecognized mode: ${o}`);let u=[];t<9&&(u=e.attributes.getFloats("scales"),To(u,o,n));let l=e.attributes.getFloat("extrapolation_value",0),d=t>10?e.attributes.getString("coordinate_transformation_mode","half_pixel"):"asymmetric";if(["asymmetric","pytorch_half_pixel","tf_half_pixel_for_nn","align_corners","tf_crop_and_resize","half_pixel"].indexOf(d)===-1)throw new Error(`coordinate_transform_mode '${d}' is not supported`);let c=d==="tf_crop_and_resize",s=c,r=o==="nearest"&&t>=11?e.attributes.getString("nearest_mode","round_prefer_floor"):"";if(["round_prefer_floor","round_prefer_ceil","floor","ceil",""].indexOf(r)===-1)throw new Error(`nearest_mode '${r}' is not supported`);let i=e.attributes.getFloat("cubic_coeff_a",-.75),a=e.attributes.getInt("exclude_outside",0)!==0;if(a&&o!=="cubic")throw new Error("exclude_outside can be set to 1 only when mode is CUBIC.");let p=t<11?!0:o==="nearest"&&d==="asymmetric"&&r==="floor",h=0,m=0,b=0;return t>10?e.inputs.length>2?(h=1,m=2,b=3):(m=1,b=2):t===9&&(m=1),je({opset:t,isResize:n,mode:o,scales:u,extrapolationValue:l,coordinateTransformMode:d,useExtrapolation:s,needRoiInput:c,nearestMode:r,cubicCoefficientA:i,excludeOutside:a,useNearest2xOptimization:p,roiInputIdx:h,scalesInputIdx:m,sizesInputIdx:b})},of=(e,t,n)=>{let o=Ee(e.session.backend.glContext.version),[u,l]=e.calculateTextureWidthAndHeight(t[0].dims,0),d=t[0].dims.map((b,$)=>Math.floor(b*n.scales[$])),[c,s]=e.calculateTextureWidthAndHeight(d,0),r=d.length,i=new Array(r),a=new Array(r),p=`
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
    }`;return{...Qs,output:{dims:d,type:t[0].type,textureType:0},shaderSource:m,variables:[{name:"scales",type:"int",arrayLength:n.scales.length,data:n.scales.map(b=>Math.ceil(b))}]}},Uu=(e,t)=>{if(!e||t.opset<9&&e.length!==1||t.opset>=9&&t.opset<11&&e.length!==2||t.opset>=11&&e.length<2)throw new Error("invalid inputs.");if(t.scales.length>0&&e[0].dims.length!==t.scales.length)throw new Error("Invalid input shape.");if(e[0].type==="string")throw new Error("Invalid input tensor types.")},To=(e,t,n)=>{if(n){for(let o of e)if(o<=0)throw new Error("Scale value should be greater than 0.")}else for(let o of e)if(o<1)throw new Error("Scale value should be greater than or equal to 1.");if((t==="linear"||t==="cubic")&&e.length!==2&&(e.length!==4||e[0]!==1||e[1]!==1))throw new Error(`'Linear' mode and 'Cubic' mode only support 2-D inputs ('Bilinear', 'Bicubic')         or 4-D inputs with the corresponding outermost 2 scale values being 1         in the ${n?"Resize":"Upsample"} opeartor.`)}}),eo,Vu,Dw,Rw,sf,af,uf,lf,zO=D(()=>{"use strict";He(),ke(),Qt(),In(),Cw(),eo={name:"Resize",inputNames:["A"],inputTypes:[2]},Vu=(e,t,n)=>(Uu(t,n),[e.run({...eo,cacheHint:n.cacheKey,get:()=>sf(e,t,n)},t)]),Dw=e=>fi(e,10),Rw=e=>fi(e,11),sf=(e,t,n)=>{let o=Ee(e.session.backend.glContext.version),[u,l]=af(t,n);if(u.every(y=>y===1)&&n.coordinateTransformMode!=="tf_crop_and_resize")return{...eo,output:{dims:l,type:t[0].type,textureType:2},hasMain:!0,shaderSource:`void main() {
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
                `;break;default:throw new Error(`resize (packed) does not support coordinateTransformMode:                                 '${n.coordinateTransformMode}'`)}let b=_r(d),$=vi(),v=`
            const vec2 inputWH = vec2(${i}.0, ${a}.0);
            const vec4 scaleWHWH = vec4(float(${p}), float(${h}), float(${p}), float(${h}));
            ${$}
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
        `;return{...eo,output:{dims:l,type:t[0].type,textureType:2},hasMain:!0,shaderSource:v}},af=(e,t)=>{let n=e[0].dims,o=t.scales,u;if(o.length===0){let d=e[t.scalesInputIdx];if(d&&d.size!==0){if(e[t.sizesInputIdx])throw new Error("Only one of scales or sizes must be provided as input.");o=uf(d,t.mode,t.isResize)}else{let c=e[t.sizesInputIdx];if(!c||c.size===0)throw new Error("Either scales or sizes MUST be provided as input.");u=Array.from(c.integerData),o=lf(u,n,t.mode,t.isResize)}}else if(e[t.sizesInputIdx])throw new Error("Only one of scales or sizes must be provided as input.");let l=u||n.map((d,c)=>Math.floor(d*o[c]));return[o,l]},uf=(e,t,n)=>{let o=Array.from(e.floatData);return To(o,t,n),o},lf=(e,t,n,o)=>{let u=t.length,l=new Array(u);for(let d=0,c=u;d<c;d++)if(t[d]===0){if(e[d]!==0)throw new Error("Input dim is zero but required output dim is non-zero.");l[d]=1}else l[d]=e[d]/t[d];return To(l,n,o),l}}),Nw,df,MO=D(()=>{"use strict";Sn(),Nw=(e,t)=>(df(t),[new bt([t[0].dims.length],"int32",void 0,void 0,new Int32Array(t[0].dims))]),df=e=>{if(!e||e.length!==1)throw new Error("Shape requires 1 input.")}}),to,zw,Mw,ea,cf,Bw,pf,hf,BO=D(()=>{"use strict";it(),Fo(),Ne(),ke(),to={name:"Slice",inputNames:["A"],inputTypes:[0]},zw=(e,t,n)=>(cf(t),[e.run({...to,cacheHint:n.cacheKey,get:()=>ea(e,t[0],n)},t)]),Mw=e=>{let t=e.attributes.getInts("starts"),n=e.attributes.getInts("ends"),o=e.attributes.getInts("axes",[]);return je({starts:t,ends:n,axes:o})},ea=(e,t,n)=>{let o=n.axes.length===0?t.dims.slice(0).map((i,a)=>a):n.axes,u=be.normalizeAxes(o,t.dims.length),l=n.starts.map((i,a)=>i>t.dims[u[a]]-1?t.dims[u[a]]:be.normalizeAxis(i,t.dims[u[a]])),d=n.ends.map((i,a)=>i>t.dims[u[a]]-1?t.dims[u[a]]:be.normalizeAxis(i,t.dims[u[a]])),c=t.dims.slice(),s=[];for(let i=0;i<u.length;i++)c[u[i]]=d[i]-l[i],l[i]>0&&s.push(`outputIdx[${u[i]}] += ${l[i]};`);let r=`
      float process(int outputIdx[${c.length}]) {
        ${s.join(`
      `)}
        return _A(outputIdx);
      }`;return{...to,output:{dims:c,type:t.type,textureType:0},shaderSource:r}},cf=e=>{if(!e||e.length!==1)throw new Error("Slice requires 1 input.");if($i.indexOf(e[0].type)===-1)throw new Error("Invalid input type.")},Bw=(e,t)=>{hf(t);let n=pf(e,t);return[e.run({...to,cacheHint:n.cacheKey,get:()=>ea(e,t[0],n)},[t[0]])]},pf=(e,t)=>{if(!e.session.isInitializer(t[1].dataId)||!e.session.isInitializer(t[2].dataId)||t.length>=4&&!e.session.isInitializer(t[3].dataId)||t.length>=5&&!e.session.isInitializer(t[4].dataId))throw new Error("dynamic slice attributes are not allowed");if(t.length>=5&&t[4].integerData.some(d=>d!==1))throw new Error("currently non-1 steps is not supported for Slice");let n=Array.from(t[1].integerData),o=Array.from(t[2].integerData),u=t.length>=4?Array.from(t[3].integerData):[],l=`${u};${n};${o}`;return{starts:n,ends:o,axes:u,cacheKey:l}},hf=e=>{if(!e||e.length<3||e.length>5)throw new Error("Invalid input number.");if(e[1].type!=="int32"||e[1].dims.length!==1)throw new Error("Invalid input type.");if(e[2].type!=="int32"||e[2].dims.length!==1)throw new Error("Invalid input type.");if(e.length>=4&&(e[3].type!=="int32"||e[3].dims.length!==1))throw new Error("Invalid input type.");if(e.length>=5&&(e[4].type!=="int32"||e[4].dims.length!==1))throw new Error("Invalid input type.")}}),ta,ra,na,Fw,Lw,jw,Uw,ia,ff,mf,gf,oa,FO=D(()=>{"use strict";it(),Ne(),He(),ke(),vl(),ta={name:"SoftmaxComputeMax",inputNames:["A"],inputTypes:[0]},ra={name:"SoftmaxComputeScale",inputNames:["A","Max"],inputTypes:[0,0]},na={name:"SoftMax",inputNames:["A","Max","Norm"],inputTypes:[0,0,0]},Fw=(e,t,n)=>{oa(t);let o=t[0].dims.slice(),u=be.normalizeAxis(n.axis,o.length),l=be.sizeToDimension(o,u),d=be.sizeFromDimension(o,u);return ia(e,t,n,l,d)},Lw=e=>je({axis:e.attributes.getInt("axis",1)}),jw=e=>je({axis:e.attributes.getInt("axis",-1)}),Uw=(e,t,n)=>{oa(t);let o=t[0].dims.slice(),u=be.normalizeAxis(n.axis,o.length),l=o.length,d=u!==l-1,c=[],s=[],r=[],i;d&&(s=Array.from({length:l}).map((m,b)=>b),s[u]=l-1,s[l-1]=u,s.map(m=>c.push(o[m])),i=je({perm:s}),r=yi(e,t,i));let a=d?be.sizeToDimension(c,l-1):be.sizeToDimension(o,l-1),p=d?be.sizeFromDimension(c,l-1):be.sizeFromDimension(o,l-1),h=ia(e,d?r:t,n,a,p);return d?yi(e,h,i):h},ia=(e,t,n,o,u)=>{let l=ff(e,t[0],o,u,[o]),d=e.run({...ta,cacheHint:n.cacheKey,get:()=>l},t),c=mf(e,t[0],o,u,l.output.dims,[o]),s=e.run({...ra,cacheHint:n.cacheKey,get:()=>c},[t[0],d]),r=gf(e,t[0],o,u,l.output.dims,c.output.dims);return[e.run({...na,cacheHint:n.cacheKey,get:()=>r},[t[0],d,s])]},ff=(e,t,n,o,u)=>{let[l,d]=e.calculateTextureWidthAndHeight(t.dims,0),c=u.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(u.length!==1)throw new Error("Dimensionality of the output should be 1");if(u[0]!==n)throw new Error("Shape of the output should be equal to logical row count");let s=Ee(e.session.backend.glContext.version),r=`
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
      }`;return{...ta,output:{dims:u,type:t.type,textureType:0},shaderSource:r}},mf=(e,t,n,o,u,l)=>{let[d,c]=e.calculateTextureWidthAndHeight(t.dims,0),s=l.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(l.length!==1)throw new Error("Dimensionality of the output should be 1");if(l[0]!==n)throw new Error("Shape of the output should be equal to logical row count");if(u.length!==1)throw new Error("Dimensionality of the intermediate results should be 1");if(u[0]!==n)throw new Error("Shape of the intermediate results should be equal to logical row count");let r=Ee(e.session.backend.glContext.version),i=`
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
      }`;return{...ra,output:{dims:l,type:t.type,textureType:0},shaderSource:i}},gf=(e,t,n,o,u,l)=>{let[d,c]=e.calculateTextureWidthAndHeight(t.dims,0),s=t.dims.length;if(n<1||o<1)throw new Error("Logical row count N and feature count D must be greater than or equal to 1");if(u.length!==1||l.length!==1)throw new Error("Dimensionality of the intermediate results should be 1");if(u[0]!==n||l[0]!==n)throw new Error("Shape of the intermediate results should be equal to logical row count");let r=`
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
    }`;return{...na,output:{dims:t.dims,type:t.type,textureType:0},shaderSource:r}},oa=e=>{if(!e||e.length!==1)throw new Error("Softmax requires 1 input.");if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type")}}),sa,Vw,Gw,bf,yf,_f,LO=D(()=>{"use strict";it(),Ne(),ke(),sa={name:"Split",inputNames:["A"],inputTypes:[0]},Vw=(e,t,n)=>{_f(t);let o=be.normalizeAxis(n.axis,t[0].dims.length),u=bf(e,t,o,n),l=[];for(let d=0;d<u;++d)l.push(e.run({...sa,cacheHint:`${n.cacheKey};${d}`,get:()=>yf(e,t[0],n,o,d)},t));return l},Gw=e=>{let t=e.attributes.getInt("axis",0),n=e.attributes.getInts("split",[]),o=e.outputs.length;return je({axis:t,split:n,numOutputs:o})},bf=(e,t,n,o)=>{let[,u]=Ou.splitShape(t[0].dims,n,o.split,o.numOutputs);return u.length},yf=(e,t,n,o,u)=>{let[l,d]=Ou.splitShape(t.dims,o,n.split,n.numOutputs),c=d[u],s=l[u],r=`
      float process(int indices[${s.length}]) {
        indices[${o}] += ${c};
        return _A(indices);
      }
    `;return{...sa,cacheHint:`${n.cacheKey}:${u}`,output:{dims:s,type:t.type,textureType:0},shaderSource:r}},_f=e=>{if(!e||e.length!==1)throw new Error("Split requires one input.");if(e[0].type!=="int8"&&e[0].type!=="uint8"&&e[0].type!=="int16"&&e[0].type!=="uint16"&&e[0].type!=="int32"&&e[0].type!=="uint32"&&e[0].type!=="float32"&&e[0].type!=="float64"&&e[0].type!=="bool")throw new Error("Invalid input type.")}}),Gu,qw,Hw,wf,vf,jO=D(()=>{"use strict";Ne(),Gu=(e,t,n)=>{wf(t);let o=be.squeezeShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},qw=(e,t)=>(vf(t),Gu(e,[t[0]],Array.from(t[1].integerData))),Hw=e=>e.attributes.getInts("axes"),wf=e=>{if(!e||e.length!==1)throw new Error("Squeeze requires 1 input.");if(e[0].type==="string")throw new Error("invalid input tensor types.")},vf=e=>{if(!e||e.length!==2)throw new Error("Squeeze requires 2 inputs.");if(e[1].type!=="int32")throw new Error("Invalid input type.")}}),Ww,xf,$f,UO=D(()=>{"use strict";He(),ke(),Ww=(e,t)=>{$f(t);let n={name:"Sum",inputNames:t.map((o,u)=>`X${u}`),inputTypes:new Array(t.length).fill(0)};return[e.run({...n,get:()=>xf(e,t,n)},t)]},xf=(e,t,n)=>{let o=Ee(e.session.backend.glContext.version),u=t[0].dims.slice(),l=`
      void main() {
        vec4 result = ${t.map((d,c)=>`${o.texture2D}(X${c},TexCoords)`).join(" + ")};
        ${o.output} = result;
      }
    `;return{...n,output:{dims:u,type:t[0].type,textureType:0},hasMain:!0,shaderSource:l}},$f=e=>{if(!e||e.length===0)throw new Error("Sum requires inputs.");let t=e[0].dims.length;for(let n=1;n<e.length;n++){if(t!==e[n].dims.length)throw new Error("Input shapes are mismatched.");for(let o=0;o<t;o++)if(e[0].dims[o]!==e[n].dims[o])throw new Error("Input shapes are not matched.")}if(e[0].type!=="float32"&&e[0].type!=="float64")throw new Error("Invalid input type.");for(let n=1;n<e.length;n++)if(e[0].type!==e[n].type)throw new Error("Input types are not matched.")}}),Kw,Tf,Sf,VO=D(()=>{"use strict";Fo(),ke(),Kw=(e,t)=>{Sf(t);let n={name:"Tile",inputNames:["A"],inputTypes:[0]};return[e.run({...n,get:()=>Tf(e,t,n)},t)]},Tf=(e,t,n)=>{let o=t[0].dims.slice(),u=new Array(o.length),l=[];for(let s=0;s<o.length;s++)u[s]=o[s]*t[1].numberData[s],l.push(`inputIdx[${s}] = int(mod(float(outputIdx[${s}]), ${o[s]}.));`);let d=u.length,c=`
      float process(int outputIdx[${d}]) {
        int inputIdx[${d}];
        ${l.join(`
`)}
        return _A(inputIdx);
      }
    `;return{...n,output:{dims:u,type:t[0].type,textureType:0},shaderSource:c}},Sf=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 input.");if(e[1].dims.length!==1)throw new Error("The second input shape must 1 dimension.");if(e[1].dims[0]!==e[0].dims.length)throw new Error("Invalid input shape.");if($i.indexOf(e[0].type)===-1)throw new Error("Invalid input type.");if(e[1].type!=="int32"&&e[1].type!=="int16")throw new Error("Invalid repeat type.")}}),qu,Xw,Zw,If,Of,GO=D(()=>{"use strict";Ne(),qu=(e,t,n)=>{If(t);let o=be.unsqueezeShape(t[0].dims,n);return[e.reshapeUnpacked(t[0],o)]},Xw=(e,t)=>(Of(t),qu(e,[t[0]],Array.from(t[1].integerData))),Zw=e=>e.attributes.getInts("axes"),If=e=>{if(!e||e.length!==1)throw new Error("Unsqueeze requires 1 input.");if(e[0].type==="string")throw new Error("invalid input tensor types.")},Of=e=>{if(!e||e.length!==2)throw new Error("Unsqueeze requires 2 inputs.");if(e[1].type!=="int32")throw new Error("Invalid input type.")}}),Yw,qO=D(()=>{"use strict";C3(),H3(),W3(),X3(),wl(),xO(),$O(),TO(),SO(),IO(),OO(),EO(),kO(),yl(),CO(),DO(),RO(),NO(),zO(),MO(),BO(),FO(),LO(),jO(),UO(),VO(),vl(),z_(),GO(),Cw(),Yw=[["Abs","","6+",h_],["Acos","","7+",f_],["Add","","7+",W0],["And","","7+",K0],["Asin","","7+",m_],["Atan","","7+",g_],["AveragePool","","7+",mw,gw],["BatchNormalization","","7+",V0,G0],["Cast","","6+",o_,s_],["Ceil","","6+",__],["Clip","","6-10",Ru,b_],["Clip","","11+",y_],["Concat","","4+",u_,l_],["Conv","","1+",Mu,Bu],["ConvTranspose","","1+",X_,Z_],["Cos","","7+",w_],["Div","","7+",X0],["Dropout","","7+",Nu],["DepthToSpace","","1+",J_,Q_],["Equal","","7+",Z0],["Elu","","6+",v_,x_],["Exp","","6+",$_],["Flatten","","1+",ew,tw],["Floor","","6+",T_],["FusedConv","com.microsoft","1+",Mu,Bu],["Gather","","1+",rw,nw],["Gemm","","7-10",Fu,iw],["Gemm","","11+",Fu,ow],["GlobalAveragePool","","1+",bw,yw],["GlobalMaxPool","","1+",vw],["Greater","","7+",Y0],["Identity","","1+",Nu],["ImageScaler","","1+",sw,aw],["InstanceNormalization","","6+",uw,lw],["LeakyRelu","","6+",S_,I_],["Less","","7+",J0],["LRN","","1+",dw,cw],["Log","","6+",O_],["MatMul","","1+",j_,U_],["MaxPool","","1+",_w,ww],["Mul","","7+",Q0],["Neg","","6+",E_],["Not","","1+",A_],["Or","","7+",e_],["Pad","","2-10",Lu,pw],["Pad","","11+",hw,fw],["Pow","","7+",t_],["PRelu","","7+",r_],["ReduceLogSum","","1+",Ow,br],["ReduceMax","","1+",Tw,br],["ReduceMean","","1+",$w,br],["ReduceMin","","1+",Sw,br],["ReduceProd","","1+",Iw,br],["ReduceSum","","1-12",xw,br],["ReduceSumSquare","","1+",Ew,br],["Relu","","6+",P_],["Reshape","","5+",Aw],["Resize","","10",Vu,Dw],["Resize","","11+",Vu,Rw],["Shape","","1+",Nw],["Sigmoid","","6+",k_],["Sin","","7+",C_],["Slice","","10+",Bw],["Slice","","1-9",zw,Mw],["Softmax","","1-12",Fw,Lw],["Softmax","","13+",Uw,jw],["Split","","2-12",Vw,Gw],["Sqrt","","6+",D_],["Squeeze","","1-12",Gu,Hw],["Squeeze","","13+",qw],["Sub","","7+",n_],["Sum","","6+",Ww],["Tan","","7+",R_],["Tanh","","6+",N_],["Tile","","6+",Kw],["Transpose","","1+",yi,Y_],["Upsample","","7-8",ju,Pw],["Upsample","","9",ju,kw],["Unsqueeze","","1-12",qu,Zw],["Unsqueeze","","13+",Xw],["Xor","","7+",i_]]});function HO(e){let t={},n;for(;(n=Hu.exec(e))!==null;){let o=n[3].split(",").map(u=>{let l=u.trim().split(" ");return l&&l.length===2?{type:l[0],name:l[1]}:null}).filter(u=>u!==null);t[n[2]]={params:o,body:n[4]}}for(let o in t){let u=Jw.replace("__FUNC__",o),l=new RegExp(u,"gm");for(;(n=l.exec(e))!==null;){let d=n[1],c=n[2],s=n[3].split(","),r=d?`${d} ${c};`:"",i=t[o].body,a="";t[o].params.forEach((h,m)=>{h&&(a+=`${h.type} ${h.name} = ${s[m]};
`)}),i=`${a}
 ${i}`,i=i.replace("return",`${c} = `);let p=`
      ${r}
      {
        ${i}
      }
      `;e=e.replace(n[0],p)}}return e=e.replace(Hu,""),e}var Hu,Jw,WO=D(()=>{"use strict";Hu=/@inline[\s\n\r]+(\w+)[\s\n\r]+([0-9a-zA-Z_]+)\s*\(([^)]*)\)\s*{(([^}]|[\n\r])*)}/gm,Jw="(\\w+)?\\s+([_0-9a-zA-Z]+)\\s+=\\s+__FUNC__\\((.*)\\)\\s*;"});function si(e,t){let n=[],o=[],u=t!=null&&Array.isArray(t)&&t.length===0,l=t==null||u?null:KO(t,e).sort(),d=0;for(let c=0;c<e.length;++c){if(l!=null){if(l[d]===c&&e[c]!==1)throw new Error(`Can't squeeze axis ${c} since its dim '${e[c]}' is not 1`);(l[d]==null||l[d]>c)&&e[c]===1&&(n.push(e[c]),o.push(c)),l[d]<=c&&d++}e[c]!==1&&(n.push(e[c]),o.push(c))}return{newShape:n,keptDims:o}}function KO(e,t){let n=t.length;return e=e==null?t.map((o,u)=>u):[].concat(e),vo(e.every(o=>o>=-n&&o<n),()=>`All values in axis param must be in range [-${n}, ${n}) but got axis ${e}`),vo(e.every(XO),()=>`All values in axis param must be integers but got axis ${e}`),e.map(o=>o<0?n+o:o)}function XO(e){return e%1===0}function ZO(e){if(e.length===0)return 1;let t=e[0];for(let n=1;n<e.length;n++)t*=e[n];return t}function Ef(e){let t=Math.ceil(Math.sqrt(e));return[t,Math.ceil(e/t)]}var Qw,ev=D(()=>{"use strict";zt(),Ne(),Qw=class{constructor(e){this.maxTextureSize=e}computeTextureWH(e,t){let n=this.computeTexture(e,t);return t&&t.isPacked&&(n[0]/=2,n[1]/=2),t&&t.reverseWH?[n[1],n[0]]:n}computeTexture(e,t){let n=t&&t.isPacked;if(e.length===0)return n?[2,2]:[1,1];let o=this.maxTextureSize;if(t&&t.breakAxis!==void 0){let d=t.breakAxis>=e.length?1:e.slice(t.breakAxis).reduce((s,r)=>s*r),c=t.breakAxis<=0?1:e.slice(0,t.breakAxis).reduce((s,r)=>s*r);if(d>o||c>o)Ke.verbose("TextureLayout",`Given width/height preferences were unattainable: shape:${e}, breakAxis:${t.breakAxis}`);else return[d,c]}let u=e.slice(0);n&&(o=o*2,u=u.map((d,c)=>c>=u.length-2?u[c]%2===0?u[c]:u[c]+1:u[c]),u.length===1&&(u=[2,u[0]])),u.length!==2&&(u=si(u).newShape);let l=ZO(u);return u.length<=1&&l<=o?[1,l]:u.length===2&&u[0]<=o&&u[1]<=o?u:u.length===3&&u[0]*u[1]<=o&&u[2]<=o?[u[0]*u[1],u[2]]:u.length===3&&u[0]<=o&&u[1]*u[2]<=o?[u[0],u[1]*u[2]]:u.length===4&&u[0]*u[1]*u[2]<=o&&u[3]<=o?[u[0]*u[1]*u[2],u[3]]:u.length===4&&u[0]<=o&&u[1]*u[2]*u[3]<=o?[u[0],u[1]*u[2]*u[3]]:n?Ef(l/4).map(d=>d*2):Ef(l)}}}),tv,YO=D(()=>{"use strict";Ne(),vr(),He(),ev(),Qt(),tv=class extends On{constructor(e){super(e)}getFunctions(){return{...this.offsetToCoords(),...this.coordsToOffset(),...this.toVec(),...this.valueFrom(),...this.getCommonUtilFuncs(),...this.getInputsSamplingSnippets(),...this.getOutputSamplingSnippet()}}getCustomTypes(){return{}}offsetToCoords(){let e="offsetToCoords";return{offsetToCoords:new te(`
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
        ${Ee(this.context.glContext.version).output} = val;
      }
    `,d="floatTextureSetRGBA";return o[d]=new te(l),o}getUnpackedOutputSamplingSnippet(e){let t=e.unpackedShape,n=[e.width,e.height],o={},u="getOutputCoords";switch(t.length){case 0:o[u]=this.getOutputScalarCoords();break;case 1:o[u]=this.getOutputUnpacked1DCoords(t,n);break;case 2:o[u]=this.getOutputUnpacked2DCoords(t,n);break;case 3:o[u]=this.getOutputUnpacked3DCoords(t,n);break;case 4:o[u]=this.getOutputUnpacked4DCoords(t,n);break;case 5:o[u]=this.getOutputUnpacked5DCoords(t,n);break;case 6:o[u]=this.getOutputUnpacked6DCoords(t,n);break;default:throw new Error(`Unsupported output dimensionality: ${t.length}`)}let l=`
        void setOutput(float val) {
          ${Ee(this.context.glContext.version).output} = vec4(val, 0, 0, 0);
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
      `,new te(o))}getOutputPacked2DCoords(e,t){let n="";if(ii.arraysEqual(e,t))return n=`
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
      `),t="sampleTexture";let n=Ee(this.context.glContext.version);return e[t]=new te(`
        float sampleTexture(sampler2D textureSampler, vec2 uv) {
            return ${n.texture2D}(textureSampler, uv).r;
        }`),e}getInputsSamplingSnippets(){let e={},t=this.context.outputTextureLayout;return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o],l=Fs(n);u.isPacked?e[l]=this.getPackedSamplerFromInput(l,n,u):e[l]=this.getUnpackedSamplerFromInput(l,n,u);let d=b3(n);u.unpackedShape.length<=t.unpackedShape.length&&(u.isPacked?e[d]=this.getPackedSamplerAtOutputCoords(d,u,t,n):e[d]=this.getUnpackedSamplerAtOutputCoords(d,u,t,n))}),e}getPackedSamplerAtOutputCoords(e,t,n,o){let u=t.unpackedShape,l=n.unpackedShape,d=Fs(o),c=u.length,s=l.length,r=Gt.getBroadcastDims(u,l),i=_r(s),a=s-c,p,h=xn();c===0?p="":s<2&&r.length>=1?p="coords = 0;":p=r.map(I=>`coords.${h[I+a]} = 0;`).join(`
`);let m="";s<2&&c>0?m="coords":m=u.map((I,S)=>`coords.${h[S+a]}`).join(", ");let b="return outputValue;",$=be.size(u)===1,v=be.size(l)===1;if(c===1&&!$&&!v)b=`
        return vec4(outputValue.xy, outputValue.xy);
      `;else if($&&!v)s===1?b=`
          return vec4(outputValue.x, outputValue.x, 0., 0.);
        `:b=`
          return vec4(outputValue.x);
        `;else if(r.length){let I=c-2,S=c-1;r.indexOf(I)>-1&&r.indexOf(S)>-1?b="return vec4(outputValue.x);":r.indexOf(I)>-1?b="return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);":r.indexOf(S)>-1&&(b="return vec4(outputValue.xx, outputValue.zz);")}let y=`
        int lastDim = coords.${h[s-1]};
        coords.${h[s-1]} = coords.${h[s-2]};
        coords.${h[s-2]} = lastDim;
      `,T=`
      vec4 ${e}() {
        ${i} coords = getOutputCoords();
        ${y}
        ${p}
        vec4 outputValue = ${d}(${m});
        ${b}
      }
    `;return new te(T,["coordinates.getOutputCoords"])}getUnpackedSamplerAtOutputCoords(e,t,n,o){let u=[n.width,n.height],l=[t.width,t.height],d=t.unpackedShape.length,c=n.unpackedShape.length,s=t.unpackedShape,r=n.unpackedShape,i=Fs(o);if(d===c&&ii.arraysEqual(l,u)){let y=`
          float ${e}() {
            return sampleTexture(${o}, TexCoords);
          }
        `;return new te(y,["coordinates.sampleTexture"])}let a=_r(c),p=Gt.getBroadcastDims(s,r),h=c-d,m,b=xn();d===0?m="":c<2&&p.length>=1?m="coords = 0;":m=p.map(y=>`coords.${b[y+h]} = 0;`).join(`
`);let $="";c<2&&d>0?$="coords":$=t.unpackedShape.map((y,T)=>`coords.${b[T+h]}`).join(", ");let v=`
        float ${e}() {
          ${a} coords = getOutputCoords();
          ${m}
          return ${i}(${$});
        }
      `;return new te(v,["coordinates.getOutputCoords"])}getPackedSamplerFromInput(e,t,n){switch(n.unpackedShape.length){case 0:return this.getPackedSamplerScalar(e,t);case 1:return this.getPackedSampler1D(e,t,n);case 2:return this.getPackedSampler2D(e,t,n);case 3:return this.getPackedSampler3D(e,t,n);default:return this.getPackedSamplerND(e,t,n)}}getUnpackedSamplerFromInput(e,t,n){let o=n.unpackedShape;switch(o.length){case 0:return this.getUnpackedSamplerScalar(e,t,n);case 1:return this.getUnpackedSampler1D(e,t,n);case 2:return this.getUnpackedSampler2D(e,t,n);case 3:return this.getUnpackedSampler3D(e,t,n);case 4:return this.getUnpackedSampler4D(e,t,n);case 5:return this.getUnpackedSampler5D(e,t,n);case 6:return this.getUnpackedSampler6D(e,t,n);default:throw new Error(`Unsupported dimension ${o.length}-D`)}}getPackedSamplerScalar(e,t){let n=Ee(this.context.glContext.version),o=`
          vec4 ${e}() {
            return ${n.texture2D}(${t}, halfCR);
          }
        `;return new te(o)}getPackedSampler1D(e,t,n){let o=[n.width,n.height],u=[o[1],o[0]],l=Ee(this.context.glContext.version),d=`vec4 ${e}(int index) {
      vec2 uv = packedUVfrom1D(
      ${u[0]}, ${u[1]}, index);
      return ${l.texture2D}(${t}, uv);
    }`;return new te(d,["coordinates.packedUVfrom1D"])}getPackedSampler2D(e,t,n){let o=n.unpackedShape,u=[n.width,n.height],l=Ee(this.context.glContext.version),d=u[0],c=u[1];if(u!=null&&ii.arraysEqual(o,u)){let a=`vec4 ${e}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${c}.0, ${d}.0);
        return ${l.texture2D}(${t}, uv);
      }`;return new te(a)}let s=u,r=Math.ceil(o[1]/2),i=`vec4 ${e}(int row, int col) {
      vec2 uv = packedUVfrom2D(${s[1]}, ${s[0]}, ${r}, row, col);
      return ${l.texture2D}(${t}, uv);
    }`;return new te(i,["coordinates.packedUVfrom2D"])}getPackedSampler3D(e,t,n){let o=n.unpackedShape,u=[n.width,n.height],l=[u[0],u[1]],d=Ee(this.context.glContext.version);if(o[0]===1){let p=o.slice(1),h=[1,2],m=Un(o,p),b=["b","row","col"],$=JSON.parse(JSON.stringify(n));$.unpackedShape=m;let v=this.getPackedSamplerFromInput(e,t,$),y=`${v.routineBody}
      vec4 ${e}(int b, int row, int col) {
        return ${e}(${Vn(b,h)});
      } `;return new te(y,v.dependencies)}let c=l[0],s=l[1],r=Math.ceil(o[2]/2),i=r*Math.ceil(o[1]/2),a=`vec4 ${e}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${s}, ${c}, ${i}, ${r}, b, row, col);
      return ${d.texture2D}(${t}, uv);}`;return new te(a,["coordinates.packedUVfrom3D"])}getPackedSamplerND(e,t,n){let o=n.unpackedShape,u=o.length,l=[n.width,n.height],d=Ee(this.context.glContext.version),c=[l[0],l[1]],s=c[1],r=c[0],i=Math.ceil(o[u-1]/2),a=i*Math.ceil(o[u-2]/2),p="int b, int row, int col",h=`b * ${a} + (row / 2) * ${i} + (col / 2)`;for(let b=2;b<u-1;b++)p=`int b${b}, `+p,a*=o[u-b-1],h=`b${b} * ${a} + `+h;let m=`vec4 ${e}(${p}) {
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
      `;return new te(l,["coordinates.uvFromFlat","coordinates.sampleTexture"])}getUnpackedSampler2D(e,t,n){let o=n.unpackedShape,u=[n.height,n.width];if(u!=null&&ii.arraysEqual(o,u)){let a=u[1],p=u[0],h=`
          float ${e}(int row, int col) {
            vec2 uv = (vec2(row, col) + halfCR) / vec2(${a}.0, ${p}.0);
            return sampleTexture(${t}, uv);
          }
        `;return new te(h,["coordinates.sampleTexture"])}let{newShape:l,keptDims:d}=si(o),c=l;if(c.length<o.length){let a=Un(o,c),p=JSON.parse(JSON.stringify(n));p.unpackedShape=a;let h=["col","row"],m=`
          ${this.getUnpackedSamplerFromInput(e,t,p).routineBody}
          float ${e}(int row, int col) {
            return ${e}(${Vn(h,d)});
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
      `;return new te(i,["coordinates.uvFromFlat","coordinates.sampleTexture","coordinates.coordsToOffset"])}getUnpackedSampler3D(e,t,n){let o=n.unpackedShape,u=o[1]*o[2],l=o[2],{newShape:d,keptDims:c}=si(o),s=d;if(s.length<o.length){let p=Un(o,s),h=["batch","col","row"],m=JSON.parse(JSON.stringify(n));m.unpackedShape=p;let b=this.getUnpackedSamplerFromInput(e,t,m),$=c.reverse(),v=`
          ${b.routineBody}
          float ${e}(int batch, int row, int col) {
            return ${e}(${Vn(h,$)});
          }
        `;return new te(v,b.dependencies)}let r=n.width,i=n.height,a=`
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
      `;return new te(r,["coordinates.uvFromFlat","coordinates.sampleTexture"])}getUnpackedSampler5D(e,t,n){let o=n.unpackedShape,u=o[4],l=o[3]*u,d=o[2]*l,c=o[1]*d,{newShape:s,keptDims:r}=si(o);if(s.length<o.length){let h=Un(o,s),m=["row","col","depth","depth2","depth3"],b=JSON.parse(JSON.stringify(n));b.unpackedShape=h;let $=`
          ${this.getUnpackedSamplerFromInput(e,t,b).routineBody}
          float ${e}(int row, int col, int depth, int depth2, int depth3) {
            return ${e}(${Vn(m,r)});
          }
        `;return new te($,["coordinates.sampleTexture","coordinates.uvFromFlat"])}let i=n.width,a=n.height,p=`
        float ${e}(int row, int col, int depth, int depth2, int depth3) {
          int index = row * ${c} + col * ${d} + depth * ${l} +
          depth3 * ${u} + depth2;
          vec2 uv = uvFromFlat(${i}, ${a}, index);
          return sampleTexture(${t}, uv);
        }
      `;return new te(p,["coordinates.sampleTexture","coordinates.uvFromFlat"])}getUnpackedSampler6D(e,t,n){let o=n.unpackedShape,u=o[5],l=o[4]*u,d=o[3]*l,c=o[2]*d,s=o[1]*c,{newShape:r,keptDims:i}=si(o);if(r.length<o.length){let m=Un(o,r),b=["row","col","depth","depth2","depth3","depth4"],$=JSON.parse(JSON.stringify(n));$.unpackedShape=m;let v=`
            ${this.getUnpackedSamplerFromInput(e,t,$).routineBody}
            float ${e}(int row, int col, int depth,
              int depth2, int depth3, int depth4) {
              return ${e}(${Vn(b,i)});
            }
          `;return new te(v,["coordinates.sampleTexture","coordinates.uvFromFlat"])}let a=n.width,p=n.height,h=`
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
    `;return{toVec:new te(d,["coordinates.coordsToOffset"])}}valueFrom(){let e={};return this.context.programInfo.inputNames.forEach((t,n)=>{let o=this.context.inputTextureLayouts[n],u=(o.unpackedShape.length>0?o.unpackedShape:o.shape).length,l=`_${t}`;e[l]=new te(this.getValueFromSingle(t,u,o.width,o.height,!1),[`shapeUtils.indicesToOffset${l}`,"coordinates.offsetToCoords","fragcolor.getColorAsFloat"]),l=l+"_T",e[l]=new te(this.getValueFromSingle(t,u,o.width,o.height,!0),[`shapeUtils.indicesToOffset${l}`,"coordinates.offsetToCoords","fragcolor.getColorAsFloat"])}),e}getValueFromSingle(e,t,n,o,u){let l=`_${e}`;u&&(l=l+"_T");let d=Ee(this.context.glContext.version);return`
        float ${l}(int m[${t}]) {
          int offset = indicesToOffset${l}(m);
          vec2 coords = offsetToCoords(offset, ${n}, ${o});
          float value = getColorAsFloat(${d.texture2D}(${e}, coords));
          return value;
        }
        `}getPackedValueFrom(e,t,n,o,u){let l=`_${e}_Pack`;u&&(l=l+"_T");let d=Ee(this.context.glContext.version);return`
        vec4 ${l}(int m[${t}]) {
          int offset = indicesToOffset_${e}(m);
          vec2 coords = offsetToCoords(offset, ${n}, ${o});
          return ${d.texture2D}(${e}, coords);
        }
        `}}}),rv,JO=D(()=>{"use strict";vr(),rv=class Wu extends On{constructor(t){super(t)}getFunctions(){return{...this.encodeFloat32(),...this.decodeFloat32()}}getCustomTypes(){return{}}encodeFloat32(){return{encode:new te(`highp vec4 encode(highp float f) {
        return vec4(f, 0.0, 0.0, 0.0);
      }
        `)}}decodeFloat32(){return{decode:new te(`highp float decode(highp vec4 rgba) {
        return rgba.r;
      }
        `)}}encodeUint8(){let t=Wu.isLittleEndian()?"rgba.rgba=rgba.abgr;":"";return{encode:new te(`
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
        `)}}decodeUint8(){let t=Wu.isLittleEndian()?"rgba.rgba=rgba.abgr;":"";return{decode:new te(`
        highp float decode(highp vec4 rgba) {
          rgba = rgba * 255.0; // values need to be de-normalized from [0,1] to [0,255]
          ${t}
          highp float Sign = 1.0 - step(128.0,rgba[0])*2.0;
          highp float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0;
          highp float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);
          highp float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 ));
          return Result;
      }
        `)}}static isLittleEndian(){let t=new ArrayBuffer(4),n=new Uint32Array(t),o=new Uint8Array(t);if(n[0]=3735928559,o[0]===239)return!0;if(o[0]===222)return!1;throw new Error("unknown endianness")}}}),nv,QO=D(()=>{"use strict";vr(),He(),nv=class extends On{constructor(e){super(e)}getFunctions(){return{...this.setFragColor(),...this.getColorAsFloat()}}getCustomTypes(){return{}}setFragColor(){let e=Ee(this.context.glContext.version);return{setFragColor:new te(`
        void setFragColor(float value) {
            ${e.output} = encode(value);
        }
        `,["encoding.encode"])}}getColorAsFloat(){return{getColorAsFloat:new te(`
        float getColorAsFloat(vec4 color) {
            return decode(color);
        }
        `,["encoding.decode"])}}}}),iv,eE=D(()=>{"use strict";vr(),iv=class ai extends On{constructor(t){super(t)}getFunctions(){return{...this.bcastIndex(),...this.bcastMatmulIndex(),...this.offsetToIndices(),...this.indicesToOffset(),...this.incrementIndices()}}getCustomTypes(){return{}}bcastIndex(){let t=this.context.outputTextureLayout.shape.length,n={};return this.context.programInfo.inputNames.forEach((o,u)=>{let l=this.context.inputTextureLayouts[u].unpackedShape;if(l.length<=t){let d=l.length,c=t-d,s=`bcastIndices_${o}`,r="";for(let a=0;a<d;++a)r+=`
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
        `;n[s]=new te(i)}}),n}indicesToOffset(){let t={};return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o].shape,l=this.context.inputTextureLayouts[o].strides,d=u.length,c=`indicesToOffset_${n}`;t[c]=new te(ai.indexToOffsetSingle(c,d,l)),c=`indicesToOffset_${n}_T`,t[c]=new te(ai.indexToOffsetSingle(c,d,l.slice().reverse()))}),t}static indexToOffsetSingle(t,n,o){let u="";for(let l=n-1;l>=0;--l)u+=`
        offset += indices[${l}] * ${o[l]};
        `;return`
      int ${t}(int indices[${n}]) {
        int offset = 0;
        ${u}
        return offset;
      }
      `}offsetToIndices(){let t={};return this.context.programInfo.inputNames.forEach((n,o)=>{let u=this.context.inputTextureLayouts[o].shape,l=this.context.inputTextureLayouts[o].strides,d=u.length,c=`offsetToIndices_${n}`;t[c]=new te(ai.offsetToIndicesSingle(c,d,l)),c=`offsetToIndices_${n}_T`,t[c]=new te(ai.offsetToIndicesSingle(c,d,l.slice().reverse()))}),t}static offsetToIndicesSingle(t,n,o){let u=[];for(let l=0;l<n-1;++l)u.push(`
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
        `;t[d]=new te(s)}),t}}}),ov,tE=D(()=>{"use strict";vr(),ov=class extends On{constructor(e){super(e)}getCustomTypes(){return{}}getFunctions(){return{...this.binaryVecFunctions(),...this.copyVec(),...this.setVecItem(),...this.getVecItem()}}binaryVecFunctions(){let e=this.context.outputTextureLayout.shape.length,t={add:"+=",sub:"-=",mul:"*=",div:"/="},n={};for(let o in t){let u=`${o}Vec`,l="";for(let c=0;c<e;++c)l+=`
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
    `;return{getVecItem:new te(n)}}}}),Ku,rE=D(()=>{"use strict";YO(),JO(),QO(),eE(),tE(),Ku={encoding:rv,fragcolor:nv,vec:ov,shapeUtils:iv,coordinates:tv}}),sv,nE=D(()=>{"use strict";vr(),WO(),rE(),He(),sv=class{constructor(e,t,n,o){this.libs={},this.glslLibRoutineDependencyGraph={},this.context=new q0(e,t,n,o),Object.keys(Ku).forEach(l=>{let d=new Ku[l](this.context);this.libs[l]=d});let u=this.glslLibRoutineDependencyGraph;for(let l in this.libs){let d=this.libs[l].getFunctions();for(let c in d){let s=l+"."+c,r;u[s]?(r=u[s],r.routineBody=d[c].routineBody):(r=new Du(s,d[c].routineBody),u[s]=r);let i=d[c].dependencies;if(i)for(let a=0;a<i.length;++a)if(u[i[a]])r.addDependency(u[i[a]]);else{let p=new Du(i[a]);u[i[a]]=p,r.addDependency(p)}}}}preprocess(){let e=this.context.programInfo,t=e.shaderSource;return this.context.programInfo.hasMain||(t=`${t}
      ${g3(this.context.glContext.version,this.context.outputTextureLayout.shape.length)}`),t=HO(t),`${m3(this.context.glContext.version)}
    ${this.getUniforms(e.inputNames,e.variables)}
    ${this.getImports(t)}
    ${t}`}getImports(e){let t=this.selectGlslLibRoutinesToBeIncluded(e);if(t.length===0)return"";let n="";for(let o=0;o<t.length;++o)if(t[o].routineBody)n+=t[o].routineBody+`
`;else throw new Error(`Missing body for the Glsl Library routine: ${t[o].name}`);return n}selectGlslLibRoutinesToBeIncluded(e){let t=[];return Object.keys(this.glslLibRoutineDependencyGraph).forEach(n=>{let o=n.split(".")[1];e.indexOf(o)!==-1&&t.push(this.glslLibRoutineDependencyGraph[n])}),H0.returnOrderedNodes(t)}getUniforms(e,t){let n=[];if(e)for(let o of e)n.push(`uniform sampler2D ${o};`);if(t)for(let o of t)n.push(`uniform ${o.type} ${o.name}${o.arrayLength?`[${o.arrayLength}]`:""};`);return n.join(`
`)}}}),av,iE=D(()=>{"use strict";at(),zt(),nE(),He(),av=class{constructor(e,t,n){this.profiler=e,this.glContext=t,this.textureLayoutStrategy=n,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,n){this.profiler.event("op",`ProgramManager.run ${e.programInfo.name??"unknown kernel"}`,()=>{let o=this.glContext.gl,u=e.program;o.useProgram(u);try{this.bindOutput(n),this.attributesBound||this.bindAttributes(e.attribLocations),this.bindUniforms(e.uniformLocations,e.programInfo.variables??[],t)}catch(l){throw Ke.error("ProgramManager",e.programInfo.shaderSource),l}this.profiler.event("backend","GlContext.draw()",()=>{this.glContext.draw()})},this.glContext)}dispose(){this.vertexShader&&this.glContext.deleteShader(this.vertexShader),this.repo.forEach(e=>this.glContext.deleteProgram(e.program))}build(e,t,n){return this.profiler.event("backend","ProgramManager.build",()=>{let o=new sv(this.glContext,e,t,n),u=o.preprocess(),l=this.compile(u);return{programInfo:e,program:l,uniformLocations:this.getUniformLocations(l,o.context.programInfo.inputNames,o.context.programInfo.variables),attribLocations:this.getAttribLocations(l)}})}compile(e){if(!this.vertexShader){Ke.verbose("ProrgramManager","Compiling and caching Vertex shader for the first time");let o=f3(this.glContext.version);this.vertexShader=this.glContext.compileShader(o,this.glContext.gl.VERTEX_SHADER)}fe.debug&&Ke.verbose("ProrgramManager",`FragShader:
${e}
`);let t=this.glContext.compileShader(e,this.glContext.gl.FRAGMENT_SHADER),n=this.glContext.createProgram(this.vertexShader,t);return this.glContext.deleteShader(t),n}bindOutput(e){let t=e.width,n=e.height;Ke.verbose("ProrgramManager",`Binding output texture to Framebuffer: w/h=${t}/${n}, shape=${e.shape}, type=${e.tensor.type}`),this.glContext.attachFramebuffer(e.texture,t,n)}bindAttributes(e){let t=e.position,n=e.textureCoord;this.glContext.setVertexAttributes(t,n),this.attributesBound=!0}bindUniforms(e,t,n){let o=this.glContext.gl,u=0;for(let{name:l,type:d,location:c,arrayLength:s}of e){let r=t.find(i=>i.name===l)?.data;if(d!=="sampler2D"&&!r)throw new Error(`variable '${l}' does not have data defined in program info`);switch(d){case"sampler2D":this.bindTexture(n[u],c,u),u++;break;case"float":s?o.uniform1fv(c,r):o.uniform1f(c,r);break;case"int":s?o.uniform1iv(c,r):o.uniform1i(c,r);break;default:throw new Error(`Uniform not implemented: ${d}`)}}}bindTexture(e,t,n){this.glContext.bindTextureToUniform(e.texture,n,t)}getAttribLocations(e){return{position:this.getAttribLocation(e,"position"),textureCoord:this.getAttribLocation(e,"textureCoord")}}getUniformLocations(e,t,n){let o=[];if(t)for(let u of t)o.push({name:u,type:"sampler2D",location:this.getUniformLocation(e,u)});if(n)for(let u of n)o.push({...u,location:this.getUniformLocation(e,u.name)});return o}getUniformLocation(e,t){let n=this.glContext.gl.getUniformLocation(e,t);if(n===null)throw new Error(`Uniform ${t} not found.`);return n}getAttribLocation(e,t){return this.glContext.gl.getAttribLocation(e,t)}}}),uv,oE=D(()=>{"use strict";zt(),$o(),uv=class{constructor(e,t,n,o){this.glContext=e,this.layoutStrategy=t,this.profiler=n,this.config=o,this.pendingRead=new Map,o.reuseTextures&&(this.inUseTextures=new Map,this.idleTextures=new Map,this.textureLookup=new Map)}createTextureFromLayout(e,t,n,o){let u=this.toEncoderType(e),l=this.glContext.getEncoder(u,t.channels||1,o);if(t.isPacked&&o===1)throw new Error("not implemented");let d=t.width,c=t.height,s,r;if(this.config.reuseTextures){s=`${d}x${c}_${l.format}_${l.internalFormat}_${l.textureType}`,r=this.inUseTextures.get(s),r||(r=[],this.inUseTextures.set(s,r));let a=this.idleTextures.get(s);if(a&&a.length>0){let p=a.pop();return r.push(p),o===1&&this.glContext.updateTexture(p,d,c,l,this.toTextureData(e,n)),p}}Ke.verbose("TextureManager",`Creating new texture of size ${t.width}x${t.height}`);let i=this.glContext.allocateTexture(d,c,l,this.toTextureData(e,n));return this.config.reuseTextures&&(r.push(i),this.textureLookup.set(i,s)),i}readTexture(e,t,n){return n||(n=1),this.profiler.event("backend","TextureManager.readTexture",()=>{let o=e.shape.reduce((l,d)=>l*d)*n,u=this.glContext.readTexture(e.texture,e.width,e.height,o,this.toEncoderType(t),n);return this.toTensorData(t,u)})}async readTextureAsync(e,t,n){let o=e.tensor.dataId;if(n||(n=1),this.pendingRead.has(o)){let u=this.pendingRead.get(o);return new Promise(l=>u?.push(l))}return this.profiler.event("backend","TextureManager.readTextureAsync",async()=>{this.pendingRead.set(o,[]);let u=e.shape.reduce((s,r)=>s*r)*n;await this.glContext.createAndWaitForFence();let l=this.glContext.readTexture(e.texture,e.width,e.height,u,this.toEncoderType(t),n),d=this.toTensorData(t,l),c=this.pendingRead.get(o);return this.pendingRead.delete(o),c?.forEach(s=>s(d)),d})}readUint8TextureAsFloat(e){return this.profiler.event("backend","TextureManager.readUint8TextureAsFloat",()=>{let t=e.shape.reduce((o,u)=>o*u),n=this.glContext.readTexture(e.texture,e.width,e.height,t*4,"byte",4);return new Float32Array(n.buffer,n.byteOffset,t)})}releaseTexture(e,t){let n;if(this.config.reuseTextures&&(n=this.textureLookup.get(e.texture),n)){t&&this.textureLookup.delete(n);let o=this.inUseTextures.get(n);if(o){let u=o.indexOf(e.texture);if(u!==-1){o.splice(u,1);let l=this.idleTextures.get(n);l||(l=[],this.idleTextures.set(n,l)),l.push(e.texture)}}}(!n||t)&&(Ke.verbose("TextureManager",`Deleting texture of size ${e.width}x${e.height}`),this.glContext.deleteTexture(e.texture))}toTensorData(e,t){switch(e){case"int16":return t instanceof Int16Array?t:Int16Array.from(t);case"int32":return t instanceof Int32Array?t:Int32Array.from(t);case"int8":return t instanceof Int8Array?t:Int8Array.from(t);case"uint16":return t instanceof Uint16Array?t:Uint16Array.from(t);case"uint32":return t instanceof Uint32Array?t:Uint32Array.from(t);case"uint8":case"bool":return t instanceof Uint8Array?t:Uint8Array.from(t);case"float32":return t instanceof Float32Array?t:Float32Array.from(t);case"float64":return t instanceof Float64Array?t:Float64Array.from(t);default:throw new Error(`TensorData type ${e} is not supported`)}}toTextureData(e,t){if(t)return t instanceof Float32Array?t:new Float32Array(t)}toEncoderType(e){return"float"}clearActiveTextures(){this.glContext.clearActiveTextures()}}}),lv,sE=D(()=>{"use strict";zt(),mI(),k3(),qO(),iE(),ev(),oE(),lv=class{constructor(e,t){this.backend=e,this.context=t,this.layoutStrategy=new Qw(e.glContext.maxTextureSize),this.programManager=new av(this.context.profiler,e.glContext,this.layoutStrategy),this.textureManager=new uv(e.glContext,this.layoutStrategy,this.context.profiler,{reuseTextures:e.textureCacheMode==="full"}),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache=new Map,this.pack=e.pack,this.pack2unpackMap=new Map,this.unpack2packMap=new Map}createInferenceHandler(){return new U0(this)}onGraphInitialized(e){let t=e.getValues().filter(n=>n.from===-1&&n.tensor).map(n=>n.tensor.dataId);this.initializers=new Set(t)}isInitializer(e){return this.initializers?this.initializers.has(e):!1}addInitializer(e){this.initializers.add(e)}getTextureData(e,t){return t?this.packedTextureDataCache.get(e):this.unpackedTextureDataCache.get(e)}setTextureData(e,t,n=!1){Ke.verbose("WebGLSessionHandler","Storing Texture data in cache"),n?this.packedTextureDataCache.set(e,t):this.unpackedTextureDataCache.set(e,t)}dispose(){this.programManager.dispose(),this.textureManager.clearActiveTextures(),this.packedTextureDataCache.forEach(e=>this.textureManager.releaseTexture(e,!0)),this.packedTextureDataCache=new Map,this.unpackedTextureDataCache.forEach(e=>this.textureManager.releaseTexture(e,!0)),this.unpackedTextureDataCache=new Map}resolve(e,t,n){let o=hI(e,t,Yw);return{impl:o.opImpl,context:o.opInit?o.opInit(e,n):e}}}});function aE(e){let t=0;for(;t<e.length&&e[t]();++t);return t-1}var Xu,uE=D(()=>{"use strict";at(),$o(),$o(),Qt(),Xu=class{constructor(e,t){this.frameBufferBound=!1,this.itemsToPoll=[],this.gl=e,this.version=t,this.getExtensions(),this.vertexbuffer=this.createVertexbuffer(),this.framebuffer=this.createFramebuffer(),this.queryVitalParameters()}allocateTexture(e,t,n,o){let u=this.gl,l=u.createTexture();u.bindTexture(u.TEXTURE_2D,l),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MIN_FILTER,u.NEAREST),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MAG_FILTER,u.NEAREST),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_S,u.CLAMP_TO_EDGE),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_T,u.CLAMP_TO_EDGE);let d=o?n.encode(o,e*t):null;return u.texImage2D(u.TEXTURE_2D,0,n.internalFormat,e,t,0,n.format,n.textureType,d),this.checkError(),l}updateTexture(e,t,n,o,u){let l=this.gl;l.bindTexture(l.TEXTURE_2D,e);let d=o.encode(u,t*n);l.texSubImage2D(l.TEXTURE_2D,0,0,0,t,n,o.format,o.textureType,d),this.checkError()}attachFramebuffer(e,t,n){let o=this.gl;o.bindTexture(o.TEXTURE_2D,e),o.bindFramebuffer(o.FRAMEBUFFER,this.framebuffer),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,e,0),this.checkError(),o.viewport(0,0,t,n),o.scissor(0,0,t,n)}readTexture(e,t,n,o,u,l){let d=this.gl;l||(l=1),this.frameBufferBound||this.attachFramebuffer(e,t,n);let c=this.getEncoder(u,l),s=c.allocate(t*n);return d.bindTexture(d.TEXTURE_2D,e),d.framebufferTexture2D(d.FRAMEBUFFER,d.COLOR_ATTACHMENT0,d.TEXTURE_2D,e,0),d.readPixels(0,0,t,n,d.RGBA,c.textureType,s),this.checkError(),c.decode(s,o)}isFramebufferReady(){return!0}getActiveTexture(){let e=this.gl;return`TEXTURE${e.getParameter(this.gl.ACTIVE_TEXTURE)-e.TEXTURE0}`}getTextureBinding(){return this.gl.getParameter(this.gl.TEXTURE_BINDING_2D)}getFramebufferBinding(){return this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING)}setVertexAttributes(e,t){let n=this.gl;n.vertexAttribPointer(e,3,n.FLOAT,!1,20,0),n.enableVertexAttribArray(e),t!==-1&&(n.vertexAttribPointer(t,2,n.FLOAT,!1,20,12),n.enableVertexAttribArray(t)),this.checkError()}createProgram(e,t){let n=this.gl,o=n.createProgram();return n.attachShader(o,e),n.attachShader(o,t),n.linkProgram(o),o}compileShader(e,t){let n=this.gl,o=n.createShader(t);if(!o)throw new Error(`createShader() returned null with type ${t}`);if(n.shaderSource(o,e),n.compileShader(o),n.getShaderParameter(o,n.COMPILE_STATUS)===!1)throw new Error(`Failed to compile shader: ${n.getShaderInfoLog(o)}
Shader source:
${e}`);return o}deleteShader(e){this.gl.deleteShader(e)}bindTextureToUniform(e,t,n){let o=this.gl;o.activeTexture(o.TEXTURE0+t),this.checkError(),o.bindTexture(o.TEXTURE_2D,e),this.checkError(),o.uniform1i(n,t),this.checkError()}draw(){this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.checkError()}checkError(){if(fe.debug){let e=this.gl,t=e.getError(),n="";switch(t){case e.NO_ERROR:return;case e.INVALID_ENUM:n="INVALID_ENUM";break;case e.INVALID_VALUE:n="INVALID_VALUE";break;case e.INVALID_OPERATION:n="INVALID_OPERATION";break;case e.INVALID_FRAMEBUFFER_OPERATION:n="INVALID_FRAMEBUFFER_OPERATION";break;case e.OUT_OF_MEMORY:n="OUT_OF_MEMORY";break;case e.CONTEXT_LOST_WEBGL:n="CONTEXT_LOST_WEBGL";break;default:n=`Unknown WebGL Error: ${t.toString(16)}`}throw new Error(n)}}deleteTexture(e){this.gl.deleteTexture(e)}deleteProgram(e){this.gl.deleteProgram(e)}getEncoder(e,t,n=0){if(this.version===2)return new F0(this.gl,t);switch(e){case"float":return n===1||this.isRenderFloat32Supported?new ku(this.gl,t):new ku(this.gl,t,this.textureHalfFloatExtension.HALF_FLOAT_OES);case"int":throw new Error("not implemented");case"byte":return new L0(this.gl,t);default:throw new Error(`Invalid dataType: ${e}`)}}clearActiveTextures(){let e=this.gl;for(let t=0;t<this.maxTextureImageUnits;++t)e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,null)}dispose(){if(this.disposed)return;let e=this.gl;e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteFramebuffer(this.framebuffer),e.bindBuffer(e.ARRAY_BUFFER,null),e.deleteBuffer(this.vertexbuffer),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null),e.finish(),this.disposed=!0}createDefaultGeometry(){return new Float32Array([-1,1,0,0,1,-1,-1,0,0,0,1,1,0,1,1,1,-1,0,1,0])}createVertexbuffer(){let e=this.gl,t=e.createBuffer();if(!t)throw new Error("createBuffer() returned null");let n=this.createDefaultGeometry();return e.bindBuffer(e.ARRAY_BUFFER,t),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),this.checkError(),t}createFramebuffer(){let e=this.gl.createFramebuffer();if(!e)throw new Error("createFramebuffer returned null");return e}queryVitalParameters(){let e=this.gl;if(this.isFloatTextureAttachableToFrameBuffer=this.checkFloatTextureAttachableToFrameBuffer(),this.isRenderFloat32Supported=this.checkRenderFloat32(),this.isFloat32DownloadSupported=this.checkFloat32Download(),this.version===1&&!this.textureHalfFloatExtension&&!this.isRenderFloat32Supported)throw new Error("both float32 and float16 TextureType are not supported");this.isBlendSupported=!this.isRenderFloat32Supported||this.checkFloat32Blend(),this.maxTextureSize=e.getParameter(e.MAX_TEXTURE_SIZE),this.maxTextureImageUnits=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),this.version}getExtensions(){this.version===2?(this.colorBufferFloatExtension=this.gl.getExtension("EXT_color_buffer_float"),this.disjointTimerQueryWebgl2Extension=this.gl.getExtension("EXT_disjoint_timer_query_webgl2")):(this.textureFloatExtension=this.gl.getExtension("OES_texture_float"),this.textureHalfFloatExtension=this.gl.getExtension("OES_texture_half_float"))}checkFloatTextureAttachableToFrameBuffer(){let e=this.gl,t=e.createTexture();e.bindTexture(e.TEXTURE_2D,t);let n=this.version===2?e.RGBA32F:e.RGBA;e.texImage2D(e.TEXTURE_2D,0,n,1,1,0,e.RGBA,e.FLOAT,null);let o=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0);let u=e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE;return e.bindTexture(e.TEXTURE_2D,null),e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteTexture(t),e.deleteFramebuffer(o),u}checkRenderFloat32(){if(this.version===2){if(!this.colorBufferFloatExtension)return!1}else if(!this.textureFloatExtension)return!1;return this.isFloatTextureAttachableToFrameBuffer}checkFloat32Download(){if(this.version===2){if(!this.colorBufferFloatExtension)return!1}else if(!this.textureFloatExtension||!this.gl.getExtension("WEBGL_color_buffer_float"))return!1;return this.isFloatTextureAttachableToFrameBuffer}checkFloat32Blend(){let e=this.gl,t,n,o,u,l;try{t=e.createTexture(),n=e.createFramebuffer(),e.bindTexture(e.TEXTURE_2D,t);let d=this.version===2?e.RGBA32F:e.RGBA;return e.texImage2D(e.TEXTURE_2D,0,d,1,1,0,e.RGBA,e.FLOAT,null),e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),e.enable(e.BLEND),o=e.createShader(e.VERTEX_SHADER),!o||(e.shaderSource(o,"void main(){}"),e.compileShader(o),u=e.createShader(e.FRAGMENT_SHADER),!u)||(e.shaderSource(u,"precision highp float;void main(){gl_FragColor=vec4(0.5);}"),e.compileShader(u),l=e.createProgram(),!l)?!1:(e.attachShader(l,o),e.attachShader(l,u),e.linkProgram(l),e.useProgram(l),e.drawArrays(e.POINTS,0,1),e.getError()===e.NO_ERROR)}finally{e.disable(e.BLEND),l&&e.deleteProgram(l),o&&e.deleteShader(o),u&&e.deleteShader(u),n&&(e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteFramebuffer(n)),t&&(e.bindTexture(e.TEXTURE_2D,null),e.deleteTexture(t))}}beginTimer(){if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let e=this.gl,t=this.disjointTimerQueryWebgl2Extension,n=e.createQuery();return e.beginQuery(t.TIME_ELAPSED_EXT,n),n}else throw new Error("WebGL1 profiling currently not supported.")}endTimer(){if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let e=this.gl,t=this.disjointTimerQueryWebgl2Extension;e.endQuery(t.TIME_ELAPSED_EXT);return}else throw new Error("WebGL1 profiling currently not supported")}isTimerResultAvailable(e){let t=!1,n=!1;if(this.version===2&&this.disjointTimerQueryWebgl2Extension){let o=this.gl,u=this.disjointTimerQueryWebgl2Extension;t=o.getQueryParameter(e,o.QUERY_RESULT_AVAILABLE),n=o.getParameter(u.GPU_DISJOINT_EXT)}else throw new Error("WebGL1 profiling currently not supported");return t&&!n}getTimerResult(e){let t=0;if(this.version===2){let n=this.gl;t=n.getQueryParameter(e,n.QUERY_RESULT),n.deleteQuery(e)}else throw new Error("WebGL1 profiling currently not supported");return t/1e6}async waitForQueryAndGetTime(e){return await Sp(()=>this.isTimerResultAvailable(e)),this.getTimerResult(e)}async createAndWaitForFence(){let e=this.createFence(this.gl);return this.pollFence(e)}createFence(e){let t,n=e,o=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);return e.flush(),o===null?t=()=>!0:t=()=>{let u=n.clientWaitSync(o,0,0);return u===n.ALREADY_SIGNALED||u===n.CONDITION_SATISFIED},{query:o,isFencePassed:t}}async pollFence(e){return new Promise(t=>{this.addItemToPoll(()=>e.isFencePassed(),()=>t())})}pollItems(){let e=aE(this.itemsToPoll.map(t=>t.isDoneFn));for(let t=0;t<=e;++t){let{resolveFn:n}=this.itemsToPoll[t];n()}this.itemsToPoll=this.itemsToPoll.slice(e+1)}async addItemToPoll(e,t){this.itemsToPoll.push({isDoneFn:e,resolveFn:t}),!(this.itemsToPoll.length>1)&&await Sp(()=>(this.pollItems(),this.itemsToPoll.length===0))}}});function dv(e){let t;if((!e||e==="webgl2")&&"webgl2"in qr?t=qr.webgl2:(!e||e==="webgl")&&"webgl"in qr&&(t=qr.webgl),!t)try{let o=dE();t=Af(o,e)}catch{let o=lE();t=Af(o,e)}e=e||t.version===1?"webgl":"webgl2";let n=t.gl;return qr[e]=t,n.isContextLost()?(delete qr[e],dv(e)):(n.disable(n.DEPTH_TEST),n.disable(n.STENCIL_TEST),n.disable(n.BLEND),n.disable(n.DITHER),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SAMPLE_COVERAGE),n.enable(n.SCISSOR_TEST),n.enable(n.CULL_FACE),n.cullFace(n.BACK),t)}function Af(e,t){let n={alpha:!1,depth:!1,antialias:!1,stencil:!1,preserveDrawingBuffer:!1,premultipliedAlpha:!1,failIfMajorPerformanceCaveat:!1},o,u=n;if((!t||t==="webgl2")&&(o=e.getContext("webgl2",u),o))try{return new Xu(o,2)}catch(l){Ke.warning("GlContextFactory",`failed to create WebGLContext using contextId 'webgl2'. Error: ${l}`)}if((!t||t==="webgl")&&(o=e.getContext("webgl",u)||e.getContext("experimental-webgl",u),o))try{return new Xu(o,1)}catch(l){Ke.warning("GlContextFactory",`failed to create WebGLContext using contextId 'webgl' or 'experimental-webgl'. Error: ${l}`)}throw new Error("WebGL is not supported")}function lE(){if(typeof document>"u")throw new TypeError("failed to create canvas: document is not supported");let e=document.createElement("canvas");return e.width=1,e.height=1,e}function dE(){if(typeof OffscreenCanvas>"u")throw new TypeError("failed to create offscreen canvas: OffscreenCanvas is not supported");return new OffscreenCanvas(1,1)}var qr,cE=D(()=>{"use strict";zt(),uE(),qr={}}),cv,pE=D(()=>{"use strict";at(),zt(),sE(),cE(),cv=class{get contextId(){return fe.webgl.contextId}set contextId(e){fe.webgl.contextId=e}get matmulMaxBatchSize(){return fe.webgl.matmulMaxBatchSize}set matmulMaxBatchSize(e){fe.webgl.matmulMaxBatchSize=e}get textureCacheMode(){return fe.webgl.textureCacheMode}set textureCacheMode(e){fe.webgl.textureCacheMode=e}get pack(){return fe.webgl.pack}set pack(e){fe.webgl.pack=e}get async(){return fe.webgl.async}set async(e){fe.webgl.async=e}initialize(){try{return this.glContext=dv(this.contextId),typeof this.matmulMaxBatchSize!="number"&&(this.matmulMaxBatchSize=16),typeof this.textureCacheMode!="string"&&(this.textureCacheMode="full"),typeof this.pack!="boolean"&&(this.pack=!1),typeof this.async!="boolean"&&(this.async=!1),Ke.setWithEnv(fe),fe.webgl.context||Object.defineProperty(fe.webgl,"context",{value:this.glContext.gl}),Ke.verbose("WebGLBackend",`Created WebGLContext: ${typeof this.glContext} with matmulMaxBatchSize: ${this.matmulMaxBatchSize}; textureCacheMode: ${this.textureCacheMode}; pack: ${this.pack}; async: ${this.async}.`),!0}catch(e){return Ke.warning("WebGLBackend",`Unable to initialize WebGLBackend. ${e}`),!1}}createSessionHandler(e){return new lv(this,e)}dispose(){this.glContext.dispose()}}});async function pv(e){if(e){let t=typeof e=="string"?[e]:e;for(let n of t){let o=$l.get(n);if(o)return o;let u=await hE(n);if(u)return u}}else return pv(["webgl"]);throw new Error("no available backend to use")}async function hE(e){let t=hv;if(typeof t[e]<"u"&&fE(t[e])){let n=t[e],o=n.initialize();if(typeof o=="object"&&"then"in o&&(o=await o),o)return $l.set(e,n),n}}function fE(e){let t=e;return"initialize"in t&&typeof t.initialize=="function"&&"createSessionHandler"in t&&typeof t.createSessionHandler=="function"&&"dispose"in t&&typeof t.dispose=="function"}var $l,hv,mE=D(()=>{"use strict";pE(),$l=new Map,hv={webgl:new cv}}),Pf,fv,gE=D(()=>{"use strict";zt(),Pf=class{constructor(e,t){this.op=e,this.node=t}},fv=class{constructor(e,t,n){this.graph=e,this.profiler=n,this.initialize(t)}initialize(e){this.profiler.event("session","ExecutionPlan.initialize",()=>{let t=this.graph.getNodes();if(t.length!==e.length)throw new Error("The size of nodes and OPs do not match.");this._ops=e.map((n,o)=>new Pf(n,t[o])),this.reset(),this._starter=[],this._ops.forEach((n,o)=>{let u=!0;for(let l of n.node.inputs)if(!this._values[l]&&this.graph.getInputIndices().indexOf(l)===-1){u=!1;break}u&&this._starter.push(o)})})}reset(){this._values=this.graph.getValues().map(e=>e.tensor)}async execute(e,t){return this.profiler.event("session","ExecutionPlan.execute",async()=>{this.reset();let n=e.createInferenceHandler(),o=this.graph.getInputIndices();if(t.length!==o.length)throw new Error(`number of input tensors don't match the number of inputs to the model: actual: ${t.length} expected: ${o.length}`);t.forEach((r,i)=>{let a=o[i];this._values[a]=r});let u=this._starter.slice(0),l=this.graph.getValues(),d=this.graph.getNodes(),c=0;for(;c<u.length;){let r=u[c++],i=this._ops[r],a=i.node.inputs.map(b=>this._values[b]);if(a.indexOf(void 0)!==-1)throw new Error(`unresolved input detected: op: ${i.node}`);let p=a;Ke.verbose("ExecPlan",`Running op:${i.node.name} (${p.map((b,$)=>`'${i.node.inputs[$]}': ${b.type}[${b.dims.join(",")}]`).join(", ")})`);let h=await this.profiler.event("node",i.node.name,async()=>i.op.impl(n,p,i.op.context));if(h.length!==i.node.outputs.length)throw new Error("the size of output does not match model definition.");h.forEach((b,$)=>{let v=i.node.outputs[$];if(this._values[v])throw new Error(`output [${v}] already has value: op:${i.node.name}`);this._values[v]=b});let m=new Set;h.forEach((b,$)=>{let v=i.node.outputs[$];for(let y of l[v].to){let T=d[y],I=!0;for(let S of T.inputs)if(!this._values[S]){I=!1;break}I&&m.add(y)}}),u.push(...m)}let s=[];for(let r=0;r<this.graph.getOutputIndices().length;r++){let i=this.graph.getOutputIndices()[r],a=this._values[i];if(a===void 0)throw new Error(`required output [${i}] does not have value`);i===0?await a.getData():a.data,s.push(a)}return Ke.verbose("ExecPlan","disposing of inferenceHandler"),n.dispose(),s})}}}),Te,Zu,bE=D(()=>{"use strict";Mo(),Te=ge(wi()),Sn(),Ne(),Zu=class ui{constructor(t){if(this._attributes=new Map,t!=null){for(let n of t)n instanceof Te.onnx.AttributeProto?this._attributes.set(n.name,[ui.getValue(n),ui.getType(n)]):n instanceof Su.Attribute&&this._attributes.set(n.name(),[ui.getValue(n),ui.getType(n)]);if(this._attributes.size<t.length)throw new Error("duplicated attribute names")}}set(t,n,o){this._attributes.set(t,[o,n])}delete(t){this._attributes.delete(t)}getFloat(t,n){return this.get(t,"float",n)}getInt(t,n){return this.get(t,"int",n)}getString(t,n){return this.get(t,"string",n)}getTensor(t,n){return this.get(t,"tensor",n)}getFloats(t,n){return this.get(t,"floats",n)}getInts(t,n){return this.get(t,"ints",n)}getStrings(t,n){return this.get(t,"strings",n)}getTensors(t,n){return this.get(t,"tensors",n)}get(t,n,o){let u=this._attributes.get(t);if(u===void 0){if(o!==void 0)return o;throw new Error(`required attribute not found: ${t}`)}if(u[1]!==n)throw new Error(`type mismatch: expected ${n} but got ${u[1]}`);return u[0]}static getType(t){let n=t instanceof Te.onnx.AttributeProto?t.type:t.type();switch(n){case Te.onnx.AttributeProto.AttributeType.FLOAT:return"float";case Te.onnx.AttributeProto.AttributeType.INT:return"int";case Te.onnx.AttributeProto.AttributeType.STRING:return"string";case Te.onnx.AttributeProto.AttributeType.TENSOR:return"tensor";case Te.onnx.AttributeProto.AttributeType.FLOATS:return"floats";case Te.onnx.AttributeProto.AttributeType.INTS:return"ints";case Te.onnx.AttributeProto.AttributeType.STRINGS:return"strings";case Te.onnx.AttributeProto.AttributeType.TENSORS:return"tensors";default:throw new Error(`attribute type is not supported yet: ${Te.onnx.AttributeProto.AttributeType[n]}`)}}static getValue(t){let n=t instanceof Te.onnx.AttributeProto?t.type:t.type();if(n===Te.onnx.AttributeProto.AttributeType.GRAPH||n===Te.onnx.AttributeProto.AttributeType.GRAPHS)throw new Error("graph attribute is not supported yet");let o=this.getValueNoCheck(t);if(n===Te.onnx.AttributeProto.AttributeType.INT&&Ut.isLong(o))return Ut.longToNumber(o);if(n===Te.onnx.AttributeProto.AttributeType.INTS){let u=o,l=new Array(u.length);for(let d=0;d<u.length;d++){let c=u[d];l[d]=Ut.longToNumber(c)}return l}if(n===Te.onnx.AttributeProto.AttributeType.TENSOR)return t instanceof Te.onnx.AttributeProto?bt.fromProto(o):bt.fromOrtTensor(o);if(n===Te.onnx.AttributeProto.AttributeType.TENSORS){if(t instanceof Te.onnx.AttributeProto)return o.map(u=>bt.fromProto(u));if(t instanceof Su.Attribute)return o.map(u=>bt.fromOrtTensor(u))}return n===Te.onnx.AttributeProto.AttributeType.STRING&&t instanceof Te.onnx.AttributeProto?Iu(o):n===Te.onnx.AttributeProto.AttributeType.STRINGS&&t instanceof Te.onnx.AttributeProto?o.map(Iu):o}static getValueNoCheck(t){return t instanceof Te.onnx.AttributeProto?this.getValueNoCheckFromOnnxFormat(t):this.getValueNoCheckFromOrtFormat(t)}static getValueNoCheckFromOnnxFormat(t){switch(t.type){case Te.onnx.AttributeProto.AttributeType.FLOAT:return t.f;case Te.onnx.AttributeProto.AttributeType.INT:return t.i;case Te.onnx.AttributeProto.AttributeType.STRING:return t.s;case Te.onnx.AttributeProto.AttributeType.TENSOR:return t.t;case Te.onnx.AttributeProto.AttributeType.GRAPH:return t.g;case Te.onnx.AttributeProto.AttributeType.FLOATS:return t.floats;case Te.onnx.AttributeProto.AttributeType.INTS:return t.ints;case Te.onnx.AttributeProto.AttributeType.STRINGS:return t.strings;case Te.onnx.AttributeProto.AttributeType.TENSORS:return t.tensors;case Te.onnx.AttributeProto.AttributeType.GRAPHS:return t.graphs;default:throw new Error(`unsupported attribute type: ${Te.onnx.AttributeProto.AttributeType[t.type]}`)}}static getValueNoCheckFromOrtFormat(t){switch(t.type()){case Dt.AttributeType.FLOAT:return t.f();case Dt.AttributeType.INT:return t.i();case Dt.AttributeType.STRING:return t.s();case Dt.AttributeType.TENSOR:return t.t();case Dt.AttributeType.GRAPH:return t.g();case Dt.AttributeType.FLOATS:return t.floatsArray();case Dt.AttributeType.INTS:{let n=[];for(let o=0;o<t.intsLength();o++)n.push(t.ints(o));return n}case Dt.AttributeType.STRINGS:{let n=[];for(let o=0;o<t.stringsLength();o++)n.push(t.strings(o));return n}case Dt.AttributeType.TENSORS:{let n=[];for(let o=0;o<t.tensorsLength();o++)n.push(t.tensors(o));return n}default:throw new Error(`unsupported attribute type: ${Dt.AttributeType[t.type()]}`)}}}}),aa,Yu,Xt,ua,kf,yE=D(()=>{"use strict";bE(),Mo(),aa=ge(wi()),Sn(),Ne(),Yu={from:(e,t)=>new kf(e,t)},Xt=class{constructor(e){this._from=void 0,this._to=[],this.tensor=void 0,this.type=void 0,e&&(this.type=ft.tensorValueTypeFromProto(e.type.tensorType))}get from(){return this._from}get to(){return this._to}},ua=class{constructor(e,t){e instanceof aa.onnx.NodeProto?(this.name=e.name,this.opType=e.opType,this.attributes=new Zu(e.attribute)):e instanceof I0.Node&&(this.name=t??e.name(),this.opType=e.opType(),this.attributes=new Zu(ft.tensorAttributesFromORTFormat(e))),this.inputs=[],this.outputs=[],this.executeNode=!0}},kf=class{constructor(e,t){if(!e)throw new TypeError("graph is empty");this.buildGraph(e),this.transformGraph(t),this.checkIsAcyclic()}getInputIndices(){return this._allInputIndices}getInputNames(){return this._allInputNames}getOutputIndices(){return this._allOutputIndices}getOutputNames(){return this._allOutputNames}getValues(){return this._allData}getNodes(){return this._nodes}buildGraph(e){if(e instanceof aa.onnx.GraphProto)this.buildGraphFromOnnxFormat(e);else if(e instanceof T0.Graph)this.buildGraphFromOrtFormat(e);else throw new TypeError("Graph type is not supported.")}buildGraphFromOnnxFormat(e){let t=new Map;this._allData=[],this._allInputIndices=[],this._allInputNames=[],this._allOutputIndices=[],this._allOutputNames=[],this._nodes=[];let n=new Map;if(!e.input)throw new Error("missing information in graph: input");let o=[];for(let u of e.input){if(t.has(u.name))throw new Error(`duplicated input name: ${u.name}`);let l=this._allData.push(new Xt(u))-1;t.set(u.name,l),o.push(u.name)}if(!e.initializer)throw new Error("missing information in graph: initializer");for(let u of e.initializer){let l=t.get(u.name);if(l===void 0){let d=new Xt;d.type={shape:{dims:ft.tensorDimsFromProto(u.dims)},tensorType:ft.tensorDataTypeFromProto(u.dataType)},l=this._allData.push(d)-1,t.set(u.name,l)}this._allData[l]._from=-1,this._allData[l].tensor=bt.fromProto(u)}for(let u=0;u<this._allData.length;u++)this._allData[u].tensor||(this._allInputIndices.push(u),this._allInputNames.push(o[u]));if(!e.output)throw new Error("missing information in graph: output");for(let u of e.output){if(t.has(u.name))throw new Error(`duplicated output name: ${u.name}`);let l=this._allData.push(new Xt(u))-1;t.set(u.name,l),this._allOutputIndices.push(l),this._allOutputNames.push(u.name)}if(!e.node)throw new Error("missing information in graph: node");for(let u of e.node){if(!u.name)for(let d=0;;d++){let c=`unnamed_${u.opType}_${d}`;if(!n.has(c)){u.name=c;break}}if(n.has(u.name))throw new Error(`duplicated node name: ${u.name}`);let l=this._nodes.push(new ua(u))-1;n.set(u.name,l)}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.node[u];if(!d.output)throw new Error(`missing output for node: ${d.name}`);for(let c of d.output){let s=t.get(c);if(typeof s>"u"&&(s=this._allData.push(new Xt)-1,t.set(c,s)),l.outputs.push(s),this._allData[s]._from!==void 0)throw new Error(`multiple nodes output to one data value: ${s}`);if(this._allData[s]._from=u,d.opType==="Constant"){if(!d.attribute||d.attribute.length!==1||!d.attribute[0].t)throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");if(!d.output||d.output.length!==1)throw new Error("missing output or incorrect number of outputs for this Constant operator");l.outputs.pop(),l.executeNode=!1,this._allData[s]._from=-1,this._allData[s].tensor=bt.fromProto(d.attribute[0].t)}}}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.node[u];if(!d.input)throw new Error(`missing input for node: ${d.name}`);for(let c of d.input){let s=t.get(c);if(typeof s>"u"){if(c===""&&(d.input.length===3||d.input.length===4)&&d.opType==="Resize")continue;throw new Error(`unrecognized input '${c}' for node: ${d.name}`)}l.inputs.push(s),this._allData[s]._to.push(u)}}return!0}buildGraphFromOrtFormat(e){let t=new Map;this._allData=[],this._allInputIndices=[],this._allInputNames=[],this._allOutputIndices=[],this._allOutputNames=[],this._nodes=[];let n=new Map,o=[];for(let u=0;u<e.inputsLength();u++){let l=e.inputs(u);if(t.has(l))throw new Error(`duplicated input name: ${l}`);for(let d=0;d<e.nodeArgsLength();d++)if(e.nodeArgs(d)?.name()===l){let c=new Xt;if(e.nodeArgs(d)?.type()?.valueType()!==E0.TypeInfoValue.tensor_type)throw new Error("Unexpected value type for the nodeArg.");let s=e.nodeArgs(d).type().value(new O0.TensorTypeAndShape),r=ft.tensorDataTypeFromProto(s.elemType()),i=s.shape(),a=[];for(let h=0;h<i.dimLength();h++)a.push(Ut.longToNumber(i.dim(h).value().dimValue()));c.type={shape:{dims:a},tensorType:r};let p=this._allData.push(c)-1;t.set(l,p),o.push(l)}}for(let u=0;u<e.initializersLength();u++){let l=e.initializers(u),d=t.get(l.name());if(d===void 0){let c=new Xt,s=ft.tensorDimsFromORTFormat(l),r=ft.tensorDataTypeFromProto(l.dataType());c.type={shape:{dims:s},tensorType:r},d=this._allData.push(c)-1,t.set(l.name(),d)}this._allData[d]._from=-1,this._allData[d].tensor=bt.fromOrtTensor(l)}for(let u=0;u<this._allData.length;u++)this._allData[u].tensor||(this._allInputIndices.push(u),this._allInputNames.push(o[u]));for(let u=0;u<e.outputsLength();u++){let l=e.outputs(u);if(t.has(l))throw new Error(`duplicated output name: ${l}`);let d=this._allData.push(new Xt)-1;t.set(l,d),this._allOutputIndices.push(d),this._allOutputNames.push(l)}if(!e.nodes)throw new Error("missing information in graph: node");for(let u=0;u<e.nodesLength();u++){let l=e.nodes(u),d=l.name();if(!d)for(let s=0;d=`unnamed_${l.opType()}_${s}`,!!n.has(d);s++);if(n.has(d))throw new Error(`duplicated node name: ${d}`);let c=this._nodes.push(new ua(l,d))-1;n.set(d,c)}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.nodes(u);if(d==null)throw new Error(`No node exists at index ${u}`);if(d?.outputsLength()===0)throw new Error(`missing output for node: ${d.name}`);for(let c=0;c<d?.outputsLength();c++){let s=d?.outputs(c),r=t.get(s);if(typeof r>"u"&&(r=this._allData.push(new Xt)-1,t.set(s,r)),l.outputs.push(r),this._allData[r]._from!==void 0)throw new Error(`multiple nodes output to one data value: ${r}`);if(this._allData[r]._from=u,d.opType()==="Constant"){if(d.attributesLength()!==1||!d.attributes(0).t())throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");if(d.outputsLength()!==1)throw new Error("missing output or incorrect number of outputs for this Constant operator");l.outputs.pop(),l.executeNode=!1,this._allData[r]._from=-1,this._allData[r].tensor=bt.fromOrtTensor(d.attributes(0).t())}}}for(let u=0;u<this._nodes.length;u++){let l=this._nodes[u],d=e.nodes(u);if(d.inputsLength()===0)throw new Error(`missing input for node: ${d.name}`);for(let c=0;c<d.inputsLength();c++){let s=d.inputs(c),r=t.get(s);if(typeof r>"u")throw new Error(`unrecognized input '${s}' for node: ${d.name()}`);l.inputs.push(r),this._allData[r]._to.push(u)}}}checkIsAcyclic(){let e=new Set;this._allInputIndices.forEach(o=>{this._allData[o]._to.forEach(u=>{e.add(u)})});let t=Array.from(e),n=new Array(this._nodes.length).fill("white");for(;t.length>0;){let o=t.pop();n[o]==="gray"?n[o]="black":(t.push(o),n[o]="gray",this._nodes[o].outputs.forEach(u=>{let l=this._allData[u];if(typeof l.tensor<"u")throw new Error("node outputs should not be initialized");if(l._from!==o)throw new Error("from property of the Value object doesn't match index of Node being processed");l._to.forEach(d=>{if(n[d]==="gray")throw new Error("model graph is cyclic");n[d]==="white"&&t.push(d)})}))}}transformGraph(e){this.removeAllIdentityNodes(),this.removeAllDropoutNodes(),this.fuseConvActivationNodes(),e&&e.transformGraph(this),this.finalizeGraph()}finalizeGraph(){let e=0,t=new Array(this._nodes.length,0),n=0;for(let o=0;o<this._nodes.length;o++)t[o]=n,this._nodes[o].executeNode?(n!==o&&(this._nodes[n]=this._nodes[o]),n++):this._nodes[o].outputs.forEach(u=>{this._allData[u]._from=-2});this._nodes.splice(n,this._nodes.length-n);for(let o=0;o<this._allData.length;o++){let u=this._allData[o];u._from!==void 0&&u._from!==-1&&u._from!==-2&&(u._from=t[u._from]);for(let l=0;l<u._to.length;l++)if(u._to[l]>=0)u._to[l]=t[u._to[l]];else throw new Error("Trying to update a removed node")}e=0;for(let o=0;o<this._allData.length;o++){if(this._allData[o].from===-2&&this._allOutputIndices.indexOf(o+e)===-1){e++,this._allData.splice(o,1),o--;continue}if(e>0){let u=-1;this._allData[o].from!==void 0&&this._allData[o].from!==-1?(u=this._nodes[this._allData[o].from].outputs.indexOf(o+e),u!==-1&&(this._nodes[this._allData[o].from].outputs[u]=o)):(u=this._allInputIndices.indexOf(o+e),u!==-1&&(this._allInputIndices[u]=o)),this._allData[o].to.forEach(l=>{u=this._nodes[l].inputs.indexOf(o+e),u!==-1&&(this._nodes[l].inputs[u]=o)}),this._allData[o].to.length===0&&(u=this._allOutputIndices.indexOf(o+e),u!==-1&&(this._allOutputIndices[u]=o))}}}deleteNode(e){let t=this._nodes[e];if(t.outputs.length>1){for(let d=1;d<t.outputs.length;d++)if(this._allData[t.outputs[d]].to.length>0)throw new Error("Node deletion with more than one output connected to other nodes is not supported. ")}t.executeNode=!1;let n=t.inputs[0],o=t.outputs[0],u=this._allData[o].to;for(let d=0;d<t.inputs.length;d++){let c=this._allData[t.inputs[d]].to.indexOf(e);if(c===-1)throw new Error("The Value object doesn't have the current Node in it's 'to' property ");this._allData[t.inputs[d]].to.splice(c,1)}this._allData[o]._to=[];let l=this._allOutputIndices.indexOf(o);if(l!==-1&&(this._allOutputIndices[l]=n),u&&u.length>0)for(let d of u){let c=this._nodes[d].inputs.indexOf(o);if(c===-1)throw new Error("The Node object doesn't have the output Value in it's 'inputs' property ");this._nodes[d].inputs[c]=n,this._allData[n].to.push(d)}}removeAllDropoutNodes(){let e=0;for(let t of this._nodes){if(t.opType==="Dropout"){if(t.inputs.length!==1)throw new Error("Dropout nodes should only contain one input. ");if(t.outputs.length!==1&&t.outputs.length!==2)throw new Error("Dropout nodes should contain either 1 or 2 output(s)");if(t.outputs.length===2&&this._allData[t.outputs[1]]._to.length!==0)throw new Error("Dropout nodes's second output should not be referenced by other nodes");this.deleteNode(e)}e++}}removeAllIdentityNodes(){let e=0;for(let t of this._nodes)t.opType==="Identity"&&this.deleteNode(e),e++}isActivation(e){switch(e.opType){case"Relu":case"Sigmoid":case"Clip":return!0;default:return!1}}fuseConvActivationNodes(){for(let e of this._nodes)if(e.opType==="Conv"){let t=this._allData[e.outputs[0]]._to;if(t.length===1&&this.isActivation(this._nodes[t[0]])){let n=this._nodes[t[0]];if(n.opType==="Clip")if(n.inputs.length===1)try{e.attributes.set("activation_params","floats",[n.attributes.getFloat("min"),n.attributes.getFloat("max")])}catch{e.attributes.set("activation_params","floats",[gi,bi])}else if(n.inputs.length>=3&&this._allData[n.inputs[1]].tensor!==void 0&&this._allData[n.inputs[2]].tensor!==void 0)e.attributes.set("activation_params","floats",[this._allData[n.inputs[1]].tensor.floatData[0],this._allData[n.inputs[2]].tensor.floatData[0]]);else continue;e.attributes.set("activation","string",n.opType),this.deleteNode(t[0])}}}}}),Cf,Df,mv,_E=D(()=>{"use strict";Cf=ge(Re()),yE(),Mo(),Df=ge(wi()),Ne(),mv=class{constructor(){}load(e,t,n){let o;if(!n)try{this.loadFromOnnxFormat(e,t);return}catch(u){if(n!==void 0)throw u;o=u}try{this.loadFromOrtFormat(e,t)}catch(u){throw n!==void 0?u:new Error(`Failed to load model as ONNX format: ${o}
as ORT format: ${u}`)}}loadFromOnnxFormat(e,t){let n=Df.onnx.ModelProto.decode(e);if(Ut.longToNumber(n.irVersion)<3)throw new Error("only support ONNX model with IR_VERSION>=3");this._opsets=n.opsetImport.map(o=>({domain:o.domain,version:Ut.longToNumber(o.version)})),this._graph=Yu.from(n.graph,t)}loadFromOrtFormat(e,t){let n=new Cf.ByteBuffer(e),o=S0.InferenceSession.getRootAsInferenceSession(n).model();if(Ut.longToNumber(o.irVersion())<3)throw new Error("only support ONNX model with IR_VERSION>=3");this._opsets=[];for(let u=0;u<o.opsetImportLength();u++){let l=o.opsetImport(u);this._opsets.push({domain:l?.domain(),version:Ut.longToNumber(l.version())})}this._graph=Yu.from(o.graph(),t)}get graph(){return this._graph}get opsets(){return this._opsets}}}),gv,wE=D(()=>{"use strict";mE(),gE(),zt(),_E(),gv=class{constructor(e={}){this._initialized=!1,this.backendHint=e.backendHint,this.profiler=Ly.create(e.profiler),this.context={profiler:this.profiler,graphInputTypes:[],graphInputDims:[]}}get inputNames(){return this._model.graph.getInputNames()}get outputNames(){return this._model.graph.getOutputNames()}startProfiling(){this.profiler.start()}endProfiling(){this.profiler.stop()}async loadModel(e,t,n){await this.profiler.event("session","Session.loadModel",async()=>{let o=await pv(this.backendHint);if(this.sessionHandler=o.createSessionHandler(this.context),this._model=new mv,typeof e=="string"){let u=e.endsWith(".ort");{let l=await(await fetch(e)).arrayBuffer();this.initialize(new Uint8Array(l),u)}}else if(ArrayBuffer.isView(e))this.initialize(e);else{let u=new Uint8Array(e,t||0,n||e.byteLength);this.initialize(u)}})}initialize(e,t){if(this._initialized)throw new Error("already initialized");this.profiler.event("session","Session.initialize",()=>{let n=this.sessionHandler.transformGraph?this.sessionHandler:void 0;this._model.load(e,n,t),this.sessionHandler.onGraphInitialized&&this.sessionHandler.onGraphInitialized(this._model.graph),this.initializeOps(this._model.graph),this._executionPlan=new fv(this._model.graph,this._ops,this.profiler)}),this._initialized=!0}async run(e){if(!this._initialized)throw new Error("session not initialized yet");return this.profiler.event("session","Session.run",async()=>{let t=this.normalizeAndValidateInputs(e),n=await this._executionPlan.execute(this.sessionHandler,t);return this.createOutput(n)})}normalizeAndValidateInputs(e){let t=this._model.graph.getInputNames();if(Array.isArray(e)){if(e.length!==t.length)throw new Error(`incorrect input array length: expected ${t.length} but got ${e.length}`)}else{if(e.size!==t.length)throw new Error(`incorrect input map size: expected ${t.length} but got ${e.size}`);let n=new Array(e.size),o=0;for(let u=0;u<t.length;++u){let l=e.get(t[u]);if(!l)throw new Error(`missing input tensor for: '${name}'`);n[o++]=l}e=n}if(!this.context.graphInputTypes||this.context.graphInputTypes.length===0||!this.context.graphInputDims||this.context.graphInputDims.length===0){let n=this._model.graph.getInputIndices(),o=this._model.graph.getValues(),u=new Array(n.length);for(let l=0;l<n.length;++l){let d=o[n[l]];u[l]=d.type.shape.dims,this.context.graphInputTypes.push(d.type.tensorType),this.context.graphInputDims.push(e[l].dims)}this.validateInputTensorDims(u,e,!0)}else this.validateInputTensorDims(this.context.graphInputDims,e,!1);return this.validateInputTensorTypes(this.context.graphInputTypes,e),e}validateInputTensorTypes(e,t){for(let n=0;n<t.length;n++){let o=e[n],u=t[n].type;if(o!==u)throw new Error(`input tensor[${n}] check failed: expected type '${o}' but got ${u}`)}}validateInputTensorDims(e,t,n){for(let o=0;o<t.length;o++){let u=e[o],l=t[o].dims;if(!this.compareTensorDims(u,l,n))throw new Error(`input tensor[${o}] check failed: expected shape '[${u.join(",")}]' but got [${l.join(",")}]`)}}compareTensorDims(e,t,n){if(e.length!==t.length)return!1;for(let o=0;o<e.length;++o)if(e[o]!==t[o]&&(!n||e[o]!==0))return!1;return!0}createOutput(e){let t=this._model.graph.getOutputNames();if(e.length!==t.length)throw new Error("expected number of outputs do not match number of generated outputs");let n=new Map;for(let o=0;o<t.length;++o)n.set(t[o],e[o]);return n}initializeOps(e){let t=e.getNodes();this._ops=new Array(t.length);for(let n=0;n<t.length;n++)this._ops[n]=this.sessionHandler.resolve(t[n],this._model.opsets,e)}}}),bv,vE=D(()=>{"use strict";at(),Sn(),bv=class{constructor(e){this.session=e,this.inputNames=this.session.inputNames,this.outputNames=this.session.outputNames}get inputMetadata(){throw new Error("Getting model metadata is not supported in webgl backend.")}get outputMetadata(){throw new Error("Getting model metadata is not supported in webgl backend.")}async dispose(){}async run(e,t,n){let o=new Map;for(let d in e)if(Object.hasOwnProperty.call(e,d)){let c=e[d];o.set(d,new bt(c.dims,c.type,void 0,void 0,c.data))}let u=await this.session.run(o),l={};return u.forEach((d,c)=>{l[c]=new gt(d.type,d.data,d.dims)}),l}startProfiling(){this.session.startProfiling()}endProfiling(){this.session.endProfiling()}}}),yv={};on(yv,{onnxjsBackend:()=>_v});var Rf,_v,xE=D(()=>{"use strict";wE(),vE(),Rf=class{async init(){}async createInferenceSessionHandler(e,t){let n=new gv(t);return typeof e=="string"?await n.loadModel(e):await n.loadModel(e),new bv(n)}},_v=new Rf}),Tl=D(()=>{"use strict"}),wv={};on(wv,{default:()=>vv});var la,da,vv,$E=D(()=>{"use strict";A2(),an(),Sl(),la="ort-wasm-proxy-worker",da=globalThis.self?.name===la,da&&(self.onmessage=e=>{let{type:t,in:n}=e.data;try{switch(t){case"init-wasm":Il(n.wasm).then(()=>{Vl(n).then(()=>{postMessage({type:t})},o=>{postMessage({type:t,err:o})})},o=>{postMessage({type:t,err:o})});break;case"init-ep":{let{epName:o,env:u}=n;Gl(u,o).then(()=>{postMessage({type:t})},l=>{postMessage({type:t,err:l})});break}case"copy-from":{let{buffer:o}=n,u=ko(o);postMessage({type:t,out:u});break}case"create":{let{model:o,options:u}=n;ql(o,u).then(l=>{postMessage({type:t,out:l})},l=>{postMessage({type:t,err:l})});break}case"release":Hl(n),postMessage({type:t});break;case"run":{let{sessionId:o,inputIndices:u,inputs:l,outputIndices:d,options:c}=n;Wl(o,u,l,d,new Array(d.length).fill(null),c).then(s=>{s.some(r=>r[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:s},Xl([...l,...s]))},s=>{postMessage({type:t,err:s})});break}case"end-profiling":Kl(n),postMessage({type:t});break;default:}}catch(o){postMessage({type:t,err:o})}}),vv=da?null:e=>new Worker(e??ht,{type:"module",name:la})}),xv={};on(xv,{default:()=>$v});async function Nf(e={}){var t=e,n=!!globalThis.window,o=!!globalThis.WorkerGlobalScope,u=o&&self.name?.startsWith("em-pthread");t.mountExternalData=(f,g)=>{f.startsWith("./")&&(f=f.substring(2)),(t.Yc||(t.Yc=new Map)).set(f,g)},t.unmountExternalData=()=>{delete t.Yc,delete t.Zd,delete t.Yd,delete t.$d},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let l=f=>async(...g)=>{try{if(t.Xc)throw Error("Session already started");let x=t.Xc={Kd:g[0],errors:[]},_=await f(...g);if(t.Xc!==x)throw Error("Session mismatch");t.dd?.flush();let E=x.errors;if(0<E.length){let P=await Promise.all(E);if(P=P.filter(R=>R),0<P.length)throw Error(P.join(`
`))}return _}finally{t.Xc=null}};t.jsepInit=(f,g)=>{if(f==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=g;let x=t.dd;t.jsepRegisterBuffer=(_,E,P,R)=>x.registerBuffer(_,E,P,R),t.jsepGetBuffer=_=>x.getBuffer(_),t.jsepCreateDownloader=(_,E,P)=>x.createDownloader(_,E,P),t.jsepOnCreateSession=_=>{x.onCreateSession(_)},t.jsepOnReleaseSession=_=>{x.onReleaseSession(_)},t.jsepOnRunStart=_=>x.onRunStart(_),t.Id=(_,E)=>{x.upload(_,E)}}else if(f==="webnn"){let x=g[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=g.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=_=>x.onRunStart(_),t.webnnOnRunEnd=x.onRunEnd.bind(x),t.webnnOnReleaseSession=_=>{x.onReleaseSession(_)},t.webnnCreateMLTensorDownloader=(_,E)=>x.createMLTensorDownloader(_,E),t.webnnRegisterMLTensor=(_,E,P,R)=>x.registerMLTensor(_,E,P,R),t.webnnCreateMLContext=_=>x.createMLContext(_),t.webnnRegisterGraphInput=x.registerGraphInput.bind(x),t.webnnIsGraphInput=x.isGraphInput.bind(x),t.webnnRegisterGraphOutput=x.registerGraphOutput.bind(x),t.webnnIsGraphOutput=x.isGraphOutput.bind(x),t.webnnCreateTemporaryTensor=x.createTemporaryTensor.bind(x),t.webnnIsGraphInputOutputTypeSupported=x.isGraphInputOutputTypeSupported.bind(x)}};let d=()=>{let f=g=>(...x)=>{let _=Bt;return x=g(...x),Bt!=_?new Promise((E,P)=>{bs={resolve:E,reject:P}}):x};(()=>{for(let g of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[g]=f(t[g])})(),l!==void 0&&(t._OrtRun=l(t._OrtRun),t._OrtRunWithBinding=l(t._OrtRunWithBinding)),d=void 0};t.asyncInit=()=>{d?.()};var c,s,r=(f,g)=>{throw g},i=import.meta.url,a="";if(n||o){try{a=new URL(".",i).href}catch{}o&&(s=f=>{var g=new XMLHttpRequest;return g.open("GET",f,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}),c=async f=>{if(k(f))return new Promise((x,_)=>{var E=new XMLHttpRequest;E.open("GET",f,!0),E.responseType="arraybuffer",E.onload=()=>{E.status==200||E.status==0&&E.response?x(E.response):_(E.status)},E.onerror=_,E.send(null)});var g=await fetch(f,{credentials:"same-origin"});if(g.ok)return g.arrayBuffer();throw Error(g.status+" : "+g.url)}}var p,h,m,b,$,v,y=console.log.bind(console),T=console.error.bind(console),I=y,S=T,A=!1,k=f=>f.startsWith("file://");function O(){nr.buffer!=Y.buffer&&K()}if(u){let f=function(g){try{var x=g.data,_=x.Sc;if(_==="load"){let E=[];self.onmessage=P=>E.push(P),v=()=>{postMessage({Sc:"loaded"});for(let P of E)f(P);self.onmessage=f};for(let P of x.xd)t[P]&&!t[P].proxy||(t[P]=(...R)=>{postMessage({Sc:"callHandler",vd:P,args:R})},P=="print"&&(I=t[P]),P=="printErr"&&(S=t[P]));nr=x.Od,K(),h=x.Pd,ye(),Zi()}else if(_==="run"){(function(E){var P=(O(),C)[E+52>>>2>>>0];E=(O(),C)[E+56>>>2>>>0],Ic(P,P-E),_e(P)})(x.Rc),xs(x.Rc,0,0,1,0,0),Od(),fs(x.Rc),U||(wc(),U=!0);try{M$(x.Md,x.bd)}catch(E){if(E!="unwind")throw E}}else x.target!=="setimmediate"&&(_==="checkMailbox"?U&&Vi():_&&(S(`worker: received unknown command ${_}`),S(x)))}catch(E){throw vc(),E}};var L=f,U=!1;self.onunhandledrejection=g=>{throw g.reason||g},self.onmessage=f}var Y,q,N,ue,w,C,j,H,V,J,M,X=!1;function K(){var f=nr.buffer;t.HEAP8=Y=new Int8Array(f),N=new Int16Array(f),t.HEAPU8=q=new Uint8Array(f),ue=new Uint16Array(f),t.HEAP32=w=new Int32Array(f),t.HEAPU32=C=new Uint32Array(f),j=new Float32Array(f),H=new Float64Array(f),V=new BigInt64Array(f),J=new BigUint64Array(f)}function G(){X=!0,u?v():Kt.sb()}function he(f){throw S(f="Aborted("+f+")"),A=!0,f=new WebAssembly.RuntimeError(f+". Build with -sASSERTIONS for more info."),$?.(f),f}function de(){return{a:{ma:uS,hb:aS,g:B$,J:F$,f:L$,o:j$,i:U$,$:V$,b:G$,S:q$,Ia:Dd,n:H$,aa:Md,Ya:Bd,Ea:Fd,Ga:Ld,Za:jd,Wa:Ud,Pa:Vd,Va:Gd,ka:qd,Fa:Hd,Ca:Wd,Xa:Kd,Da:Xd,cb:W$,fa:X$,xa:Z$,va:J$,ea:eT,N:tT,H:rT,wa:nT,_:dT,ya:cT,Sa:pT,Aa:fT,Ja:mT,ta:gT,ga:bT,Ra:fs,$a:yT,Q:xT,r:OT,c:ps,ib:ET,y:AT,M:PT,D:kT,l:CT,s:nc,jb:DT,I:RT,R:NT,j:zT,u:MT,q:BT,k:FT,Ma:LT,Na:jT,Oa:UT,Ka:ac,La:uc,ua:lc,eb:GT,bb:WT,v:KT,ba:XT,ha:ZT,ab:qT,V:YT,_a:JT,Ba:QT,F:VT,T:eS,la:Ki,za:rS,gb:tS,fb:nS,Ta:hc,Ua:fc,Ha:as,U:mc,ja:gc,Qa:bc,ia:yc,lb:GS,na:FS,mb:VS,oa:BS,G:ES,e:pS,t:dS,w:lS,B:xS,nb:NS,Z:RS,x:mS,pa:zS,X:LS,ca:DS,ob:CS,pb:kS,O:$S,qa:PS,qb:AS,L:IS,Y:MS,d:cS,A:fS,m:hS,kb:qS,p:bS,z:yS,C:gS,E:_S,K:TS,ra:OS,P:jS,da:SS,W:US,rb:vS,sa:wS,h:oS,a:nr,db:ss}}}async function ye(){function f(_,E){var P=Kt=_.exports;_={};for(let[R,F]of Object.entries(P))typeof F=="function"?(P=_T(F),_[R]=P):_[R]=F;return Kt=_,Kt=(function(){var R=Kt,F=ee=>me=>ee(me)>>>0,Z=ee=>()=>ee()>>>0;return(R=Object.assign({},R)).tb=F(R.tb),R.Xb=Z(R.Xb),R.Zb=F(R.Zb),R.lc=F(R.lc),R.mc=Z(R.mc),R.qc=F(R.qc),R})(),Sd.push(Kt._b),_c=(_=Kt).tb,wc=_.ub,t._OrtInit=_.vb,t._OrtGetLastError=_.wb,t._OrtCreateSessionOptions=_.xb,t._OrtAppendExecutionProvider=_.yb,t._OrtAddFreeDimensionOverride=_.zb,t._OrtAddSessionConfigEntry=_.Ab,t._OrtReleaseSessionOptions=_.Bb,t._OrtCreateSession=_.Cb,t._OrtReleaseSession=_.Db,t._OrtGetInputOutputCount=_.Eb,t._OrtGetInputOutputMetadata=_.Fb,t._OrtFree=_.Gb,t._OrtCreateTensor=_.Hb,t._OrtGetTensorData=_.Ib,t._OrtReleaseTensor=_.Jb,t._OrtCreateRunOptions=_.Kb,t._OrtAddRunConfigEntry=_.Lb,t._OrtReleaseRunOptions=_.Mb,t._OrtCreateBinding=_.Nb,t._OrtBindInput=_.Ob,t._OrtBindOutput=_.Pb,t._OrtClearBoundOutputs=_.Qb,t._OrtReleaseBinding=_.Rb,t._OrtRunWithBinding=_.Sb,t._OrtRun=_.Tb,t._OrtEndProfiling=_.Ub,t._JsepOutput=_.Vb,t._JsepGetNodeName=_.Wb,Xi=_.Xb,Ft=t._free=_.Yb,Bn=t._malloc=_.Zb,xs=_.ac,vc=_.bc,xc=_.cc,$c=_.dc,$s=_.ec,Tc=_.fc,Sc=_.gc,xe=_.hc,Fn=_.ic,Ic=_.jc,_e=_.kc,Ts=_.lc,we=_.mc,Oc=_.nc,Ss=_.oc,Ec=_.pc,Ac=_.qc,Pc=_.rc,Is=_.sc,kc=_.tc,Cc=_.uc,Dc=_.vc,Rc=_.wc,Nc=_.xc,zc=_.yc,Mc=_.zc,Bc=_.Ac,Fc=_.Bc,Lc=_.Cc,jc=_.Dc,Uc=_.Ec,Vc=_.Fc,Gc=_.Gc,qc=_.Hc,Hc=_.Ic,Wc=_.Jc,Kc=_.Kc,Xc=_.Lc,Zc=_.Mc,Yc=_.Nc,Jc=_.Pc,Qc=_.Qc,ep=_.$c,tp=_.ad,rp=_.fd,np=_.kd,ip=_.ld,op=_.md,sp=_.nd,ap=_.od,up=_.pd,lp=_.qd,dp=_.rd,cp=_.wd,pp=_.Ud,hp=_.Vd,fp=_.Wd,mp=_.Xd,h=E,Kt}var g,x=de();return t.instantiateWasm?new Promise(_=>{t.instantiateWasm(x,(E,P)=>{_(f(E,P))})}):u?f(new WebAssembly.Instance(h,de()),h):(M??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",a):a+"ort-wasm-simd-threaded.jsep.wasm":new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href,g=await(async function(_){var E=M;if(!p&&!k(E))try{var P=fetch(E,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(P,_)}catch(R){S(`wasm streaming compile failed: ${R}`),S("falling back to ArrayBuffer instantiation")}return(async function(R,F){try{var Z=await(async function(ee){if(!p)try{var me=await c(ee);return new Uint8Array(me)}catch{}if(ee==M&&p)ee=new Uint8Array(p);else{if(!s)throw"both async and sync fetching of the wasm failed";ee=s(ee)}return ee})(R);return await WebAssembly.instantiate(Z,F)}catch(ee){S(`failed to asynchronously prepare wasm: ${ee}`),he(ee)}})(E,_)})(x),f(g.instance,g.module))}class se{name="ExitStatus";constructor(g){this.message=`Program terminated with exit(${g})`,this.status=g}}var Q=f=>{f.terminate(),f.onmessage=()=>{}},le=[],Ae=0,ot=null,Ht=f=>{rr.length==0&&(Ad(),Ed(rr[0]));var g=rr.pop();if(!g)return 6;zn.push(g),Tr[f.Rc]=g,g.Rc=f.Rc;var x={Sc:"run",Md:f.Ld,bd:f.bd,Rc:f.Rc};return g.postMessage(x,f.jd),0},nt=0,$e=(f,g,...x)=>{var _,E=16*x.length,P=we(),R=Ts(E),F=R>>>3;for(_ of x)typeof _=="bigint"?((O(),V)[F++>>>0]=1n,(O(),V)[F++>>>0]=_):((O(),V)[F++>>>0]=0n,(O(),H)[F++>>>0]=_);return f=xc(f,0,E,R,g),_e(P),f};function ss(f){if(u)return $e(0,1,f);if(m=f,!(0<nt)){for(var g of zn)Q(g);for(g of rr)Q(g);rr=[],zn=[],Tr={},A=!0}r(0,new se(f))}function Td(f){if(u)return $e(1,0,f);as(f)}var as=f=>{if(m=f,u)throw Td(f),"unwind";ss(f)},rr=[],zn=[],Sd=[],Tr={},Id=f=>{var g=f.Rc;delete Tr[g],rr.push(f),zn.splice(zn.indexOf(f),1),f.Rc=0,$c(g)};function Od(){Sd.forEach(f=>f())}var Ed=f=>new Promise(g=>{f.onmessage=E=>{var P=E.data;if(E=P.Sc,P.Zc&&P.Zc!=Xi()){var R=Tr[P.Zc];R?R.postMessage(P,P.jd):S(`Internal error! Worker sent a message "${E}" to target pthread ${P.Zc}, but that thread no longer exists!`)}else E==="checkMailbox"?Vi():E==="spawnThread"?Ht(P):E==="cleanupThread"?Ui(()=>{Id(Tr[P.Nd])}):E==="loaded"?(f.loaded=!0,g(f)):P.target==="setimmediate"?f.postMessage(P):E==="uncaughtException"?f.onerror(P.error):E==="callHandler"?t[P.vd](...P.args):E&&S(`worker sent an unknown command ${E}`)},f.onerror=E=>{throw S(`worker sent an error! ${E.filename}:${E.lineno}: ${E.message}`),E};var x,_=[];for(x of[])t.propertyIsEnumerable(x)&&_.push(x);f.postMessage({Sc:"load",xd:_,Od:nr,Pd:h})});function Ad(){var f=new Worker((()=>{let g=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new g("ort.all.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});rr.push(f)}var nr,M$=(f,g)=>{nt=0,f=Is(f,g),0<nt?m=f:$s(f)},Fi=[],Li=0;function B$(f){var g=new us(f>>>=0);return(O(),Y)[g.Tc+12>>>0]==0&&(Pd(g,!0),Li--),kd(g,!1),Fi.push(g),Ac(f)}var pn=0,F$=()=>{xe(0,0);var f=Fi.pop();Oc(f.cd),pn=0};function Pd(f,g){g=g?1:0,(O(),Y)[f.Tc+12>>>0]=g}function kd(f,g){g=g?1:0,(O(),Y)[f.Tc+13>>>0]=g}class us{constructor(g){this.cd=g,this.Tc=g-24}}var ls=f=>{var g=pn;if(!g)return Fn(0),0;var x=new us(g);(O(),C)[x.Tc+16>>>2>>>0]=g;var _=(O(),C)[x.Tc+4>>>2>>>0];if(!_)return Fn(0),g;for(var E of f){if(E===0||E===_)break;if(Ec(E,_,x.Tc+16))return Fn(E),g}return Fn(_),g};function L$(){return ls([])}function j$(f){return ls([f>>>0])}function U$(f,g,x,_){return ls([f>>>0,g>>>0,x>>>0,_>>>0])}var V$=()=>{var f=Fi.pop();f||he("no exception to throw");var g=f.cd;throw(O(),Y)[f.Tc+13>>>0]==0&&(Fi.push(f),kd(f,!0),Pd(f,!1),Li++),Ss(g),pn=g};function G$(f,g,x){var _=new us(f>>>=0);throw g>>>=0,x>>>=0,(O(),C)[_.Tc+16>>>2>>>0]=0,(O(),C)[_.Tc+4>>>2>>>0]=g,(O(),C)[_.Tc+8>>>2>>>0]=x,Ss(f),Li++,pn=f}var q$=()=>Li;function Cd(f,g,x,_){return u?$e(2,1,f,g,x,_):Dd(f,g,x,_)}function Dd(f,g,x,_){if(f>>>=0,g>>>=0,x>>>=0,_>>>=0,!globalThis.SharedArrayBuffer)return 6;var E=[];return u&&E.length===0?Cd(f,g,x,_):(f={Ld:x,Rc:f,bd:_,jd:E},u?(f.Sc="spawnThread",postMessage(f,E),0):Ht(f))}function H$(f){throw pn||=f>>>0,pn}var Rd=globalThis.TextDecoder&&new TextDecoder,Nd=(f,g,x,_)=>{if(x=g+x,_)return x;for(;f[g]&&!(g>=x);)++g;return g},zd=(f,g=0,x,_)=>{if(16<(x=Nd(f,g>>>=0,x,_))-g&&f.buffer&&Rd)return Rd.decode(f.buffer instanceof ArrayBuffer?f.subarray(g,x):f.slice(g,x));for(_="";g<x;){var E=f[g++];if(128&E){var P=63&f[g++];if((224&E)==192)_+=String.fromCharCode((31&E)<<6|P);else{var R=63&f[g++];65536>(E=(240&E)==224?(15&E)<<12|P<<6|R:(7&E)<<18|P<<12|R<<6|63&f[g++])?_+=String.fromCharCode(E):(E-=65536,_+=String.fromCharCode(55296|E>>10,56320|1023&E))}}else _+=String.fromCharCode(E)}return _},Ze=(f,g,x)=>(f>>>=0)?zd((O(),q),f,g,x):"";function Md(f,g,x){return u?$e(3,1,f,g,x):0}function Bd(f,g){if(u)return $e(4,1,f,g)}function Fd(f,g){if(u)return $e(5,1,f,g)}function Ld(f,g,x){if(u)return $e(6,1,f,g,x)}function jd(f,g,x){return u?$e(7,1,f,g,x):0}function Ud(f,g){if(u)return $e(8,1,f,g)}function Vd(f,g,x){if(u)return $e(9,1,f,g,x)}function Gd(f,g,x,_){if(u)return $e(10,1,f,g,x,_)}function qd(f,g,x,_){if(u)return $e(11,1,f,g,x,_)}function Hd(f,g,x,_){if(u)return $e(12,1,f,g,x,_)}function Wd(f){if(u)return $e(13,1,f)}function Kd(f,g){if(u)return $e(14,1,f,g)}function Xd(f,g,x){if(u)return $e(15,1,f,g,x)}var W$=()=>he(""),Mt=f=>{f>>>=0;for(var g="";;){var x=(O(),q)[f++>>>0];if(!x)return g;g+=String.fromCharCode(x)}},ds={},cs={},K$={},hn=class extends Error{constructor(f){super(f),this.name="BindingError"}};function Wt(f,g,x={}){return(function(_,E,P={}){var R=E.name;if(!_)throw new hn(`type "${R}" must have a positive integer typeid pointer`);if(cs.hasOwnProperty(_)){if(P.yd)return;throw new hn(`Cannot register type '${R}' twice`)}cs[_]=E,delete K$[_],ds.hasOwnProperty(_)&&(E=ds[_],delete ds[_],E.forEach(F=>F()))})(f,g,x)}var Zd=(f,g,x)=>{switch(g){case 1:return x?_=>(O(),Y)[_>>>0]:_=>(O(),q)[_>>>0];case 2:return x?_=>(O(),N)[_>>>1>>>0]:_=>(O(),ue)[_>>>1>>>0];case 4:return x?_=>(O(),w)[_>>>2>>>0]:_=>(O(),C)[_>>>2>>>0];case 8:return x?_=>(O(),V)[_>>>3>>>0]:_=>(O(),J)[_>>>3>>>0];default:throw new TypeError(`invalid integer width (${g}): ${f}`)}};function X$(f,g,x,_,E){f>>>=0,x>>>=0,g=Mt(g>>>0);let P=R=>R;if(_=_===0n){let R=8*x;P=F=>BigInt.asUintN(R,F),E=P(E)}Wt(f,{name:g,Oc:P,Vc:(R,F)=>(typeof F=="number"&&(F=BigInt(F)),F),Uc:Zd(g,x,!_),Wc:null})}function Z$(f,g,x,_){Wt(f>>>=0,{name:g=Mt(g>>>0),Oc:function(E){return!!E},Vc:function(E,P){return P?x:_},Uc:function(E){return this.Oc((O(),q)[E>>>0])},Wc:null})}var Yd=[],Sr=[0,1,,1,null,1,!0,1,!1,1];function ps(f){9<(f>>>=0)&&--Sr[f+1]===0&&(Sr[f]=void 0,Yd.push(f))}var _t=f=>{if(!f)throw new hn(`Cannot use deleted val. handle = ${f}`);return Sr[f]},Ot=f=>{switch(f){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let g=Yd.pop()||Sr.length;return Sr[g]=f,Sr[g+1]=1,g}};function hs(f){return this.Oc((O(),C)[f>>>2>>>0])}var Y$={name:"emscripten::val",Oc:f=>{var g=_t(f);return ps(f),g},Vc:(f,g)=>Ot(g),Uc:hs,Wc:null};function J$(f){return Wt(f>>>0,Y$)}var Q$=(f,g)=>{switch(g){case 4:return function(x){return this.Oc((O(),j)[x>>>2>>>0])};case 8:return function(x){return this.Oc((O(),H)[x>>>3>>>0])};default:throw new TypeError(`invalid float width (${g}): ${f}`)}};function eT(f,g,x){x>>>=0,Wt(f>>>=0,{name:g=Mt(g>>>0),Oc:_=>_,Vc:(_,E)=>E,Uc:Q$(g,x),Wc:null})}function tT(f,g,x,_,E){f>>>=0,x>>>=0,g=Mt(g>>>0);let P=F=>F;if(_===0){var R=32-8*x;P=F=>F<<R>>>R,E=P(E)}Wt(f,{name:g,Oc:P,Vc:(F,Z)=>Z,Uc:Zd(g,x,_!==0),Wc:null})}function rT(f,g,x){function _(P){var R=(O(),C)[P>>>2>>>0];return P=(O(),C)[P+4>>>2>>>0],new E((O(),Y).buffer,P,R)}var E=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][g];Wt(f>>>=0,{name:x=Mt(x>>>0),Oc:_,Uc:_},{yd:!0})}var ir=(f,g,x)=>{var _=(O(),q);if(g>>>=0,0<x){var E=g;x=g+x-1;for(var P=0;P<f.length;++P){var R=f.codePointAt(P);if(127>=R){if(g>=x)break;_[g++>>>0]=R}else if(2047>=R){if(g+1>=x)break;_[g++>>>0]=192|R>>6,_[g++>>>0]=128|63&R}else if(65535>=R){if(g+2>=x)break;_[g++>>>0]=224|R>>12,_[g++>>>0]=128|R>>6&63,_[g++>>>0]=128|63&R}else{if(g+3>=x)break;_[g++>>>0]=240|R>>18,_[g++>>>0]=128|R>>12&63,_[g++>>>0]=128|R>>6&63,_[g++>>>0]=128|63&R,P++}}_[g>>>0]=0,f=g-E}else f=0;return f},ji=f=>{for(var g=0,x=0;x<f.length;++x){var _=f.charCodeAt(x);127>=_?g++:2047>=_?g+=2:55296<=_&&57343>=_?(g+=4,++x):g+=3}return g};function nT(f,g){Wt(f>>>=0,{name:g=Mt(g>>>0),Oc(x){var _=(O(),C)[x>>>2>>>0];return _=Ze(x+4,_,!0),Ft(x),_},Vc(x,_){_ instanceof ArrayBuffer&&(_=new Uint8Array(_));var E=typeof _=="string";if(!(E||ArrayBuffer.isView(_)&&_.BYTES_PER_ELEMENT==1))throw new hn("Cannot pass non-string to std::string");var P=E?ji(_):_.length,R=Bn(4+P+1),F=R+4;return(O(),C)[R>>>2>>>0]=P,E?ir(_,F,P+1):(O(),q).set(_,F>>>0),x!==null&&x.push(Ft,R),R},Uc:hs,Wc(x){Ft(x)}})}var Jd=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,iT=(f,g,x)=>{if(f>>>=1,16<(g=Nd((O(),ue),f,g/2,x))-f&&Jd)return Jd.decode((O(),ue).slice(f,g));for(x="";f<g;++f){var _=(O(),ue)[f>>>0];x+=String.fromCharCode(_)}return x},oT=(f,g,x)=>{if(x??=2147483647,2>x)return 0;var _=g;x=(x-=2)<2*f.length?x/2:f.length;for(var E=0;E<x;++E){var P=f.charCodeAt(E);(O(),N)[g>>>1>>>0]=P,g+=2}return(O(),N)[g>>>1>>>0]=0,g-_},sT=f=>2*f.length,aT=(f,g,x)=>{var _="";f>>>=2;for(var E=0;!(E>=g/4);E++){var P=(O(),C)[f+E>>>0];if(!P&&!x)break;_+=String.fromCodePoint(P)}return _},uT=(f,g,x)=>{if(g>>>=0,x??=2147483647,4>x)return 0;var _=g;x=_+x-4;for(var E=0;E<f.length;++E){var P=f.codePointAt(E);if(65535<P&&E++,(O(),w)[g>>>2>>>0]=P,(g+=4)+4>x)break}return(O(),w)[g>>>2>>>0]=0,g-_},lT=f=>{for(var g=0,x=0;x<f.length;++x)65535<f.codePointAt(x)&&x++,g+=4;return g};function dT(f,g,x){if(f>>>=0,g>>>=0,x=Mt(x>>>=0),g===2)var _=iT,E=oT,P=sT;else _=aT,E=uT,P=lT;Wt(f,{name:x,Oc:R=>{var F=(O(),C)[R>>>2>>>0];return F=_(R+4,F*g,!0),Ft(R),F},Vc:(R,F)=>{if(typeof F!="string")throw new hn(`Cannot pass non-string to C++ string type ${x}`);var Z=P(F),ee=Bn(4+Z+g);return(O(),C)[ee>>>2>>>0]=Z/g,E(F,ee+4,Z+g),R!==null&&R.push(Ft,ee),ee},Uc:hs,Wc(R){Ft(R)}})}function cT(f,g){Wt(f>>>=0,{zd:!0,name:g=Mt(g>>>0),Oc:()=>{},Vc:()=>{}})}function pT(f){xs(f>>>0,!o,1,!n,131072,!1),Od()}var Ui=f=>{if(!A)try{if(f(),!(0<nt))try{u?Xi()&&$s(m):as(m)}catch(g){g instanceof se||g=="unwind"||r(0,g)}}catch(g){g instanceof se||g=="unwind"||r(0,g)}},hT=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function fs(f){f>>>=0,hT||(Atomics.waitAsync((O(),w),f>>>2,f).value.then(Vi),f+=128,Atomics.store((O(),w),f>>>2,1))}var Vi=()=>Ui(()=>{var f=Xi();f&&(fs(f),Sc())});function fT(f,g){(f>>>=0)==g>>>0?setTimeout(Vi):u?postMessage({Zc:f,Sc:"checkMailbox"}):(f=Tr[f])&&f.postMessage({Sc:"checkMailbox"})}var ms=[];function mT(f,g,x,_,E){for(g>>>=0,E>>>=0,ms.length=0,x=E>>>3,_=E+_>>>3;x<_;){var P;P=(O(),V)[x++>>>0]?(O(),V)[x++>>>0]:(O(),H)[x++>>>0],ms.push(P)}return(g?Os[g]:sS[f])(...ms)}var gT=()=>{nt=0};function bT(f){f>>>=0,u?postMessage({Sc:"cleanupThread",Nd:f}):Id(Tr[f])}function yT(f){}var Gi=f=>{try{f()}catch(g){he(g)}};function _T(f){var g=(...x)=>{qi.push(f);try{return f(...x)}finally{A||(qi.pop(),Bt&&or===1&&qi.length===0&&(or=0,nt+=1,Gi(hp),typeof Fibers<"u"&&Fibers.be()))}};return tc.set(f,g),g}var or=0,Bt=null,Qd=0,qi=[],gs=new Map,ec=new Map,tc=new Map,wT=0,bs=null,vT=[],rc=f=>(function(g){if(!A){if(or===0){var x=!1,_=!1;g((E=0)=>{if(!A&&(Qd=E,x=!0,_)){or=2,Gi(()=>fp(Bt)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),E=!1;try{var P=(function(){var Z=(O(),w)[Bt+8>>>2>>>0];return Z=ec.get(Z),Z=tc.get(Z),--nt,Z()})()}catch(Z){P=Z,E=!0}var R=!1;if(!Bt){var F=bs;F&&(bs=null,(E?F.reject:F.resolve)(P),R=!0)}if(E&&!R)throw P}}),_=!0,x||(or=1,Bt=(function(){var E=Bn(65548),P=E+12;if((O(),C)[E>>>2>>>0]=P,(O(),C)[E+4>>>2>>>0]=P+65536,P=qi[0],!gs.has(P)){var R=wT++;gs.set(P,R),ec.set(R,P)}return P=gs.get(P),(O(),w)[E+8>>>2>>>0]=P,E})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Gi(()=>pp(Bt)))}else or===2?(or=0,Gi(mp),Ft(Bt),Bt=null,vT.forEach(Ui)):he(`invalid state: ${or}`);return Qd}})(g=>{f().then(g)});function xT(f){return f>>>=0,rc(async()=>{var g=await _t(f);return Ot(g)})}var ys=[],$T=f=>{var g=ys.length;return ys.push(f),g},TT=(f,g)=>{for(var x=Array(f),_=0;_<f;++_){var E=_,P=(O(),C)[g+4*_>>>2>>>0],R=cs[P];if(R===void 0)throw f=`parameter ${_}`,P=_c(P),g=Mt(P),Ft(P),new hn(`${f} has unknown type ${g}`);x[E]=R}return x},ST=(f,g,x)=>{var _=[];return f=f(_,x),_.length&&((O(),C)[g>>>2>>>0]=Ot(_)),f},IT={},Hi=f=>{var g=IT[f];return g===void 0?Mt(f):g};function OT(f,g,x){var[_,...E]=TT(f,g>>>0);g=_.Vc.bind(_);var P=E.map(Z=>Z.Uc.bind(Z));f--;var R={toValue:_t};switch(f=P.map((Z,ee)=>{var me=`argFromPtr${ee}`;return R[me]=Z,`${me}(args${ee?"+"+8*ee:""})`}),x){case 0:var F="toValue(handle)";break;case 2:F="new (toValue(handle))";break;case 3:F="";break;case 1:R.getStringOrSymbol=Hi,F="toValue(handle)[getStringOrSymbol(methodName)]"}return F+=`(${f})`,_.zd||(R.toReturnWire=g,R.emval_returnValue=ST,F=`return emval_returnValue(toReturnWire, destructorsRef, ${F})`),F=`return function (handle, methodName, destructorsRef, args) {
  ${F}
  }`,x=new Function(Object.keys(R),F)(...Object.values(R)),F=`methodCaller<(${E.map(Z=>Z.name)}) => ${_.name}>`,$T(Object.defineProperty(x,"name",{value:F}))}function ET(f,g){return g>>>=0,(f=_t(f>>>0))==_t(g)}function AT(f){return(f>>>=0)?(f=Hi(f),Ot(globalThis[f])):Ot(globalThis)}function PT(f){return f=Hi(f>>>0),Ot(t[f])}function kT(f,g){return g>>>=0,f=_t(f>>>0),g=_t(g),Ot(f[g])}function CT(f){9<(f>>>=0)&&(Sr[f+1]+=1)}function nc(f,g,x,_,E){return ys[f>>>0](g>>>0,x>>>0,_>>>0,E>>>0)}function DT(f,g,x,_,E){return nc(f>>>0,g>>>0,x>>>0,_>>>0,E>>>0)}function RT(){return Ot([])}function NT(f){f=_t(f>>>0);for(var g=Array(f.length),x=0;x<f.length;x++)g[x]=f[x];return Ot(g)}function zT(f){return Ot(Hi(f>>>0))}function MT(){return Ot({})}function BT(f){for(var g=_t(f>>>=0);g.length;){var x=g.pop();g.pop()(x)}ps(f)}function FT(f,g,x){g>>>=0,x>>>=0,f=_t(f>>>0),g=_t(g),x=_t(x),f[g]=x}function LT(f,g){f=-9007199254740992>f||9007199254740992<f?NaN:Number(f),g>>>=0,f=new Date(1e3*f),(O(),w)[g>>>2>>>0]=f.getUTCSeconds(),(O(),w)[g+4>>>2>>>0]=f.getUTCMinutes(),(O(),w)[g+8>>>2>>>0]=f.getUTCHours(),(O(),w)[g+12>>>2>>>0]=f.getUTCDate(),(O(),w)[g+16>>>2>>>0]=f.getUTCMonth(),(O(),w)[g+20>>>2>>>0]=f.getUTCFullYear()-1900,(O(),w)[g+24>>>2>>>0]=f.getUTCDay(),f=(f.getTime()-Date.UTC(f.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(O(),w)[g+28>>>2>>>0]=f}var ic=f=>f%4==0&&(f%100!=0||f%400==0),oc=[0,31,60,91,121,152,182,213,244,274,305,335],sc=[0,31,59,90,120,151,181,212,243,273,304,334];function jT(f,g){f=-9007199254740992>f||9007199254740992<f?NaN:Number(f),g>>>=0,f=new Date(1e3*f),(O(),w)[g>>>2>>>0]=f.getSeconds(),(O(),w)[g+4>>>2>>>0]=f.getMinutes(),(O(),w)[g+8>>>2>>>0]=f.getHours(),(O(),w)[g+12>>>2>>>0]=f.getDate(),(O(),w)[g+16>>>2>>>0]=f.getMonth(),(O(),w)[g+20>>>2>>>0]=f.getFullYear()-1900,(O(),w)[g+24>>>2>>>0]=f.getDay();var x=(ic(f.getFullYear())?oc:sc)[f.getMonth()]+f.getDate()-1|0;(O(),w)[g+28>>>2>>>0]=x,(O(),w)[g+36>>>2>>>0]=-60*f.getTimezoneOffset(),x=new Date(f.getFullYear(),6,1).getTimezoneOffset();var _=new Date(f.getFullYear(),0,1).getTimezoneOffset();f=0|(x!=_&&f.getTimezoneOffset()==Math.min(_,x)),(O(),w)[g+32>>>2>>>0]=f}function UT(f){f>>>=0;var g=new Date((O(),w)[f+20>>>2>>>0]+1900,(O(),w)[f+16>>>2>>>0],(O(),w)[f+12>>>2>>>0],(O(),w)[f+8>>>2>>>0],(O(),w)[f+4>>>2>>>0],(O(),w)[f>>>2>>>0],0),x=(O(),w)[f+32>>>2>>>0],_=g.getTimezoneOffset(),E=new Date(g.getFullYear(),6,1).getTimezoneOffset(),P=new Date(g.getFullYear(),0,1).getTimezoneOffset(),R=Math.min(P,E);return 0>x?(O(),w)[f+32>>>2>>>0]=+(E!=P&&R==_):0<x!=(R==_)&&(E=Math.max(P,E),g.setTime(g.getTime()+6e4*((0<x?R:E)-_))),(O(),w)[f+24>>>2>>>0]=g.getDay(),x=(ic(g.getFullYear())?oc:sc)[g.getMonth()]+g.getDate()-1|0,(O(),w)[f+28>>>2>>>0]=x,(O(),w)[f>>>2>>>0]=g.getSeconds(),(O(),w)[f+4>>>2>>>0]=g.getMinutes(),(O(),w)[f+8>>>2>>>0]=g.getHours(),(O(),w)[f+12>>>2>>>0]=g.getDate(),(O(),w)[f+16>>>2>>>0]=g.getMonth(),(O(),w)[f+20>>>2>>>0]=g.getYear(),f=g.getTime(),BigInt(isNaN(f)?-1:f/1e3)}function ac(f,g,x,_,E,P,R){return u?$e(16,1,f,g,x,_,E,P,R):-52}function uc(f,g,x,_,E,P){if(u)return $e(17,1,f,g,x,_,E,P)}var Mn={},VT=()=>performance.timeOrigin+performance.now();function lc(f,g){if(u)return $e(18,1,f,g);if(Mn[f]&&(clearTimeout(Mn[f].id),delete Mn[f]),!g)return 0;var x=setTimeout(()=>{delete Mn[f],Ui(()=>Tc(f,performance.timeOrigin+performance.now()))},g);return Mn[f]={id:x,ae:g},0}function GT(f,g,x,_){f>>>=0,g>>>=0,x>>>=0,_>>>=0;var E=new Date().getFullYear(),P=new Date(E,0,1).getTimezoneOffset();E=new Date(E,6,1).getTimezoneOffset();var R=Math.max(P,E);(O(),C)[f>>>2>>>0]=60*R,(O(),w)[g>>>2>>>0]=+(P!=E),f=(g=F=>{var Z=Math.abs(F);return`UTC${0<=F?"-":"+"}${String(Math.floor(Z/60)).padStart(2,"0")}${String(Z%60).padStart(2,"0")}`})(P),g=g(E),E<P?(ir(f,x,17),ir(g,_,17)):(ir(f,_,17),ir(g,x,17))}var qT=()=>Date.now(),HT=1;function WT(f,g,x){if(x>>>=0,!(0<=f&&3>=f))return 28;if(f===0)f=Date.now();else{if(!HT)return 52;f=performance.timeOrigin+performance.now()}return f=Math.round(1e6*f),(O(),V)[x>>>3>>>0]=BigInt(f),0}var _s=[],dc=(f,g)=>{_s.length=0;for(var x;x=(O(),q)[f++>>>0];){var _=x!=105;g+=(_&=x!=112)&&g%8?4:0,_s.push(x==112?(O(),C)[g>>>2>>>0]:x==106?(O(),V)[g>>>3>>>0]:x==105?(O(),w)[g>>>2>>>0]:(O(),H)[g>>>3>>>0]),g+=_?8:4}return _s};function KT(f,g,x){return f>>>=0,g=dc(g>>>0,x>>>0),Os[f](...g)}function XT(f,g,x){return f>>>=0,g=dc(g>>>0,x>>>0),Os[f](...g)}var ZT=()=>{};function YT(f,g){return S(Ze(f>>>0,g>>>0))}var JT=()=>{throw nt+=1,"unwind"};function QT(){return 4294901760}var eS=()=>navigator.hardwareConcurrency,Ir={},Wi=f=>{var g;return(g=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(f))?+g[1]:(g=/:(\d+):\d+(?:\)|$)/.exec(f))?2147483648|+g[1]:0},cc=f=>{for(var g of f)(f=Wi(g))&&(Ir[f]=g)};function tS(){var f=Error().stack.toString().split(`
`);return f[0]=="Error"&&f.shift(),cc(f),Ir.gd=Wi(f[3]),Ir.Jd=f,Ir.gd}function Ki(f){if(!(f=Ir[f>>>0]))return 0;var g;if(g=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(f))f=g[1];else if(g=/^\s+at (.*) \(.*\)$/.exec(f))f=g[1];else{if(!(g=/^(.+?)@/.exec(f)))return 0;f=g[1]}Ft(Ki.hd??0),g=ji(f)+1;var x=Bn(g);return x&&ir(f,x,g),Ki.hd=x,Ki.hd}function rS(f){f>>>=0;var g=(O(),q).length;if(f<=g||4294901760<f)return!1;for(var x=1;4>=x;x*=2){var _=g*(1+.2/x);_=Math.min(_,f+100663296);e:{_=(Math.min(4294901760,65536*Math.ceil(Math.max(f,_)/65536))-nr.buffer.byteLength+65535)/65536|0;try{nr.grow(_),K();var E=1;break e}catch{}E=void 0}if(E)return!0}return!1}function nS(f,g,x){if(f>>>=0,g>>>=0,Ir.gd==f)var _=Ir.Jd;else(_=Error().stack.toString().split(`
`))[0]=="Error"&&_.shift(),cc(_);for(var E=3;_[E]&&Wi(_[E])!=f;)++E;for(f=0;f<x&&_[f+E];++f)(O(),w)[g+4*f>>>2>>>0]=Wi(_[f+E]);return f}var ws,vs={},pc=()=>{if(!ws){var f,g={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(f in vs)vs[f]===void 0?delete g[f]:g[f]=vs[f];var x=[];for(f in g)x.push(`${f}=${g[f]}`);ws=x}return ws};function hc(f,g){if(u)return $e(19,1,f,g);f>>>=0,g>>>=0;var x,_=0,E=0;for(x of pc()){var P=g+_;(O(),C)[f+E>>>2>>>0]=P,_+=ir(x,P,1/0)+1,E+=4}return 0}function fc(f,g){if(u)return $e(20,1,f,g);f>>>=0,g>>>=0;var x=pc();for(var _ of((O(),C)[f>>>2>>>0]=x.length,f=0,x))f+=ji(_)+1;return(O(),C)[g>>>2>>>0]=f,0}function mc(f){return u?$e(21,1,f):52}function gc(f,g,x,_){return u?$e(22,1,f,g,x,_):52}function bc(f,g,x,_){return u?$e(23,1,f,g,x,_):70}var iS=[null,[],[]];function yc(f,g,x,_){if(u)return $e(24,1,f,g,x,_);g>>>=0,x>>>=0,_>>>=0;for(var E=0,P=0;P<x;P++){var R=(O(),C)[g>>>2>>>0],F=(O(),C)[g+4>>>2>>>0];g+=8;for(var Z=0;Z<F;Z++){var ee=f,me=(O(),q)[R+Z>>>0],Ie=iS[ee];me===0||me===10?((ee===1?I:S)(zd(Ie)),Ie.length=0):Ie.push(me)}E+=F}return(O(),C)[_>>>2>>>0]=E,0}function oS(f){return f>>>0}u||(function(){for(var f=t.numThreads-1;f--;)Ad();le.push(async()=>{var g=(async function(){if(!u)return Promise.all(rr.map(Ed))})();Ae++,await g,--Ae==0&&ot&&(g=ot,ot=null,g())})})(),u||(nr=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),K()),t.wasmBinary&&(p=t.wasmBinary),t.stackSave=()=>we(),t.stackRestore=f=>_e(f),t.stackAlloc=f=>Ts(f),t.setValue=function(f,g,x="i8"){switch(x.endsWith("*")&&(x="*"),x){case"i1":case"i8":(O(),Y)[f>>>0]=g;break;case"i16":(O(),N)[f>>>1>>>0]=g;break;case"i32":(O(),w)[f>>>2>>>0]=g;break;case"i64":(O(),V)[f>>>3>>>0]=BigInt(g);break;case"float":(O(),j)[f>>>2>>>0]=g;break;case"double":(O(),H)[f>>>3>>>0]=g;break;case"*":(O(),C)[f>>>2>>>0]=g;break;default:he(`invalid type for setValue: ${x}`)}},t.getValue=function(f,g="i8"){switch(g.endsWith("*")&&(g="*"),g){case"i1":case"i8":return(O(),Y)[f>>>0];case"i16":return(O(),N)[f>>>1>>>0];case"i32":return(O(),w)[f>>>2>>>0];case"i64":return(O(),V)[f>>>3>>>0];case"float":return(O(),j)[f>>>2>>>0];case"double":return(O(),H)[f>>>3>>>0];case"*":return(O(),C)[f>>>2>>>0];default:he(`invalid type for getValue: ${g}`)}},t.UTF8ToString=Ze,t.stringToUTF8=ir,t.lengthBytesUTF8=ji;var _c,wc,Xi,Ft,Bn,xs,vc,xc,$c,$s,Tc,Sc,xe,Fn,Ic,_e,Ts,we,Oc,Ss,Ec,Ac,Pc,Is,kc,Cc,Dc,Rc,Nc,zc,Mc,Bc,Fc,Lc,jc,Uc,Vc,Gc,qc,Hc,Wc,Kc,Xc,Zc,Yc,Jc,Qc,ep,tp,rp,np,ip,op,sp,ap,up,lp,dp,cp,pp,hp,fp,mp,Kt,sS=[ss,Td,Cd,Md,Bd,Fd,Ld,jd,Ud,Vd,Gd,qd,Hd,Wd,Kd,Xd,ac,uc,lc,hc,fc,mc,gc,bc,yc],Os={1055492:(f,g,x,_,E)=>{if(t===void 0||!t.Yc)return 1;if((f=Ze(Number(f>>>0))).startsWith("./")&&(f=f.substring(2)),!(f=t.Yc.get(f)))return 2;if(g=Number(g>>>0),x=Number(x>>>0),_=Number(_>>>0),g+x>f.byteLength)return 3;try{let P=f.subarray(g,g+x);switch(E){case 0:(O(),q).set(P,_>>>0);break;case 1:t.Qd?t.Qd(_,P):t.Id(_,P);break;default:return 4}return 0}catch{return 4}},1056316:(f,g,x)=>{t.td(f,(O(),q).subarray(g>>>0,g+x>>>0))},1056380:()=>t.Sd(),1056422:f=>{t.sd(f)},1056459:()=>{t.Bd()},1056490:()=>{t.Cd()},1056519:()=>{t.Gd()},1056544:f=>t.Ad(f),1056577:f=>t.Ed(f),1056609:(f,g,x)=>{t.ed(Number(f),Number(g),Number(x),!0)},1056672:(f,g,x)=>{t.ed(Number(f),Number(g),Number(x))},1056729:()=>typeof wasmOffsetConverter<"u",1056786:f=>{t.$b("Abs",f,void 0)},1056837:f=>{t.$b("Neg",f,void 0)},1056888:f=>{t.$b("Floor",f,void 0)},1056941:f=>{t.$b("Ceil",f,void 0)},1056993:f=>{t.$b("Reciprocal",f,void 0)},1057051:f=>{t.$b("Sqrt",f,void 0)},1057103:f=>{t.$b("Exp",f,void 0)},1057154:f=>{t.$b("Erf",f,void 0)},1057205:f=>{t.$b("Sigmoid",f,void 0)},1057260:(f,g,x)=>{t.$b("HardSigmoid",f,{alpha:g,beta:x})},1057339:f=>{t.$b("HardSwish",f,void 0)},1057396:f=>{t.$b("Log",f,void 0)},1057447:f=>{t.$b("Sin",f,void 0)},1057498:f=>{t.$b("Cos",f,void 0)},1057549:f=>{t.$b("Tan",f,void 0)},1057600:f=>{t.$b("Asin",f,void 0)},1057652:f=>{t.$b("Acos",f,void 0)},1057704:f=>{t.$b("Atan",f,void 0)},1057756:f=>{t.$b("Sinh",f,void 0)},1057808:f=>{t.$b("Cosh",f,void 0)},1057860:f=>{t.$b("Asinh",f,void 0)},1057913:f=>{t.$b("Acosh",f,void 0)},1057966:f=>{t.$b("Atanh",f,void 0)},1058019:f=>{t.$b("Tanh",f,void 0)},1058071:f=>{t.$b("Not",f,void 0)},1058122:(f,g,x)=>{t.$b("Clip",f,{min:g,max:x})},1058191:f=>{t.$b("Clip",f,void 0)},1058243:(f,g)=>{t.$b("Elu",f,{alpha:g})},1058301:f=>{t.$b("Gelu",f,void 0)},1058353:f=>{t.$b("Relu",f,void 0)},1058405:(f,g)=>{t.$b("LeakyRelu",f,{alpha:g})},1058469:(f,g)=>{t.$b("ThresholdedRelu",f,{alpha:g})},1058539:(f,g)=>{t.$b("Cast",f,{to:g})},1058597:f=>{t.$b("Add",f,void 0)},1058648:f=>{t.$b("Sub",f,void 0)},1058699:f=>{t.$b("Mul",f,void 0)},1058750:f=>{t.$b("Div",f,void 0)},1058801:f=>{t.$b("Pow",f,void 0)},1058852:f=>{t.$b("Equal",f,void 0)},1058905:f=>{t.$b("Greater",f,void 0)},1058960:f=>{t.$b("GreaterOrEqual",f,void 0)},1059022:f=>{t.$b("Less",f,void 0)},1059074:f=>{t.$b("LessOrEqual",f,void 0)},1059133:(f,g,x,_,E)=>{t.$b("ReduceMean",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1059308:(f,g,x,_,E)=>{t.$b("ReduceMax",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1059482:(f,g,x,_,E)=>{t.$b("ReduceMin",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1059656:(f,g,x,_,E)=>{t.$b("ReduceProd",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1059831:(f,g,x,_,E)=>{t.$b("ReduceSum",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060005:(f,g,x,_,E)=>{t.$b("ReduceL1",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060178:(f,g,x,_,E)=>{t.$b("ReduceL2",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060351:(f,g,x,_,E)=>{t.$b("ReduceLogSum",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060528:(f,g,x,_,E)=>{t.$b("ReduceSumSquare",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060708:(f,g,x,_,E)=>{t.$b("ReduceLogSumExp",f,{keepDims:!!g,noopWithEmptyAxes:!!x,axes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1060888:f=>{t.$b("Where",f,void 0)},1060941:(f,g,x)=>{t.$b("Transpose",f,{perm:g?Array.from((O(),w).subarray(Number(g)>>>0,Number(x)>>>0)):[]})},1061065:(f,g,x,_)=>{t.$b("DepthToSpace",f,{blocksize:g,mode:Ze(x),format:_?"NHWC":"NCHW"})},1061198:(f,g,x,_)=>{t.$b("DepthToSpace",f,{blocksize:g,mode:Ze(x),format:_?"NHWC":"NCHW"})},1061331:(f,g,x,_)=>{t.$b("DFT",f,{axis:g,inverse:x,onesided:_})},1061423:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe,sr)=>{t.$b("ConvTranspose",f,{format:Z?"NHWC":"NCHW",autoPad:g,dilations:[x],group:_,kernelShape:[E],pads:[P,R],strides:[F],wIsConst:()=>!!(O(),Y)[ee>>>0],outputPadding:me?Array.from((O(),w).subarray(Number(me)>>>0,Number(Ie)>>>0)):[],outputShape:ze?Array.from((O(),w).subarray(Number(ze)>>>0,Number(Fe)>>>0)):[],activation:Ze(sr)})},1061856:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("ConvTranspose",f,{format:F?"NHWC":"NCHW",autoPad:g,dilations:Array.from((O(),w).subarray(Number(x)>>>0,(Number(x)>>>0)+2>>>0)),group:_,kernelShape:Array.from((O(),w).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),pads:Array.from((O(),w).subarray(Number(P)>>>0,(Number(P)>>>0)+4>>>0)),strides:Array.from((O(),w).subarray(Number(R)>>>0,(Number(R)>>>0)+2>>>0)),wIsConst:()=>!!(O(),Y)[Z>>>0],outputPadding:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],outputShape:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[],activation:Ze(Fe)})},1062517:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe,sr)=>{t.$b("ConvTranspose",f,{format:Z?"NHWC":"NCHW",autoPad:g,dilations:[x],group:_,kernelShape:[E],pads:[P,R],strides:[F],wIsConst:()=>!!(O(),Y)[ee>>>0],outputPadding:me?Array.from((O(),w).subarray(Number(me)>>>0,Number(Ie)>>>0)):[],outputShape:ze?Array.from((O(),w).subarray(Number(ze)>>>0,Number(Fe)>>>0)):[],activation:Ze(sr)})},1062950:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("ConvTranspose",f,{format:F?"NHWC":"NCHW",autoPad:g,dilations:Array.from((O(),w).subarray(Number(x)>>>0,(Number(x)>>>0)+2>>>0)),group:_,kernelShape:Array.from((O(),w).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),pads:Array.from((O(),w).subarray(Number(P)>>>0,(Number(P)>>>0)+4>>>0)),strides:Array.from((O(),w).subarray(Number(R)>>>0,(Number(R)>>>0)+2>>>0)),wIsConst:()=>!!(O(),Y)[Z>>>0],outputPadding:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],outputShape:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[],activation:Ze(Fe)})},1063611:(f,g)=>{t.$b("GlobalAveragePool",f,{format:g?"NHWC":"NCHW"})},1063702:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("AveragePool",f,{format:Fe?"NHWC":"NCHW",auto_pad:g,ceil_mode:x,count_include_pad:_,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[],kernel_shape:F?Array.from((O(),w).subarray(Number(F)>>>0,Number(Z)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],strides:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[]})},1064181:(f,g)=>{t.$b("GlobalAveragePool",f,{format:g?"NHWC":"NCHW"})},1064272:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("AveragePool",f,{format:Fe?"NHWC":"NCHW",auto_pad:g,ceil_mode:x,count_include_pad:_,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[],kernel_shape:F?Array.from((O(),w).subarray(Number(F)>>>0,Number(Z)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],strides:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[]})},1064751:(f,g)=>{t.$b("GlobalMaxPool",f,{format:g?"NHWC":"NCHW"})},1064838:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("MaxPool",f,{format:Fe?"NHWC":"NCHW",auto_pad:g,ceil_mode:x,count_include_pad:_,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[],kernel_shape:F?Array.from((O(),w).subarray(Number(F)>>>0,Number(Z)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],strides:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[]})},1065313:(f,g)=>{t.$b("GlobalMaxPool",f,{format:g?"NHWC":"NCHW"})},1065400:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe)=>{t.$b("MaxPool",f,{format:Fe?"NHWC":"NCHW",auto_pad:g,ceil_mode:x,count_include_pad:_,storage_order:E,dilations:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[],kernel_shape:F?Array.from((O(),w).subarray(Number(F)>>>0,Number(Z)>>>0)):[],pads:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],strides:Ie?Array.from((O(),w).subarray(Number(Ie)>>>0,Number(ze)>>>0)):[]})},1065875:(f,g,x,_,E)=>{t.$b("Gemm",f,{alpha:g,beta:x,transA:_,transB:E})},1065979:f=>{t.$b("MatMul",f,void 0)},1066033:(f,g,x,_)=>{t.$b("ArgMax",f,{keepDims:!!g,selectLastIndex:!!x,axis:_})},1066141:(f,g,x,_)=>{t.$b("ArgMin",f,{keepDims:!!g,selectLastIndex:!!x,axis:_})},1066249:(f,g)=>{t.$b("Softmax",f,{axis:g})},1066312:(f,g)=>{t.$b("Concat",f,{axis:g})},1066372:(f,g,x,_,E)=>{t.$b("Split",f,{axis:g,numOutputs:x,splitSizes:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1066528:f=>{t.$b("Expand",f,void 0)},1066582:(f,g)=>{t.$b("Gather",f,{axis:Number(g)})},1066653:(f,g)=>{t.$b("GatherElements",f,{axis:Number(g)})},1066732:(f,g)=>{t.$b("GatherND",f,{batch_dims:Number(g)})},1066811:(f,g,x,_,E,P,R,F,Z,ee,me)=>{t.$b("Resize",f,{antialias:g,axes:x?Array.from((O(),w).subarray(Number(x)>>>0,Number(_)>>>0)):[],coordinateTransformMode:Ze(E),cubicCoeffA:P,excludeOutside:R,extrapolationValue:F,keepAspectRatioPolicy:Ze(Z),mode:Ze(ee),nearestMode:Ze(me)})},1067173:(f,g,x,_,E,P,R)=>{t.$b("Slice",f,{starts:g?Array.from((O(),w).subarray(Number(g)>>>0,Number(x)>>>0)):[],ends:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[],axes:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[]})},1067437:f=>{t.$b("Tile",f,void 0)},1067489:(f,g,x)=>{t.$b("InstanceNormalization",f,{epsilon:g,format:x?"NHWC":"NCHW"})},1067603:(f,g,x)=>{t.$b("InstanceNormalization",f,{epsilon:g,format:x?"NHWC":"NCHW"})},1067717:f=>{t.$b("Range",f,void 0)},1067770:(f,g)=>{t.$b("Einsum",f,{equation:Ze(g)})},1067851:(f,g,x,_,E)=>{t.$b("Pad",f,{mode:g,value:x,pads:_?Array.from((O(),w).subarray(Number(_)>>>0,Number(E)>>>0)):[]})},1067994:(f,g,x,_,E,P)=>{t.$b("BatchNormalization",f,{epsilon:g,momentum:x,spatial:!!E,trainingMode:!!_,format:P?"NHWC":"NCHW"})},1068163:(f,g,x,_,E,P)=>{t.$b("BatchNormalization",f,{epsilon:g,momentum:x,spatial:!!E,trainingMode:!!_,format:P?"NHWC":"NCHW"})},1068332:(f,g,x)=>{t.$b("CumSum",f,{exclusive:Number(g),reverse:Number(x)})},1068429:(f,g,x)=>{t.$b("DequantizeLinear",f,{axis:g,blockSize:x})},1068519:(f,g,x,_,E)=>{t.$b("GridSample",f,{align_corners:g,mode:Ze(x),padding_mode:Ze(_),format:E?"NHWC":"NCHW"})},1068689:(f,g,x,_,E)=>{t.$b("GridSample",f,{align_corners:g,mode:Ze(x),padding_mode:Ze(_),format:E?"NHWC":"NCHW"})},1068859:(f,g)=>{t.$b("ScatterND",f,{reduction:Ze(g)})},1068944:(f,g,x,_,E,P,R,F,Z)=>{t.$b("Attention",f,{numHeads:g,isUnidirectional:x,maskFilterValue:_,scale:E,doRotary:P,qkvHiddenSizes:R?Array.from((O(),w).subarray(Number(F)>>>0,Number(F)+R>>>0)):[],pastPresentShareBuffer:!!Z})},1069216:f=>{t.$b("BiasAdd",f,void 0)},1069271:f=>{t.$b("BiasSplitGelu",f,void 0)},1069332:f=>{t.$b("FastGelu",f,void 0)},1069388:(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe,sr,Es)=>{t.$b("Conv",f,{format:Ie?"NHWC":"NCHW",auto_pad:g,dilations:x?Array.from((O(),w).subarray(Number(x)>>>0,Number(_)>>>0)):[],group:E,kernel_shape:P?Array.from((O(),w).subarray(Number(P)>>>0,Number(R)>>>0)):[],pads:F?Array.from((O(),w).subarray(Number(F)>>>0,Number(Z)>>>0)):[],strides:ee?Array.from((O(),w).subarray(Number(ee)>>>0,Number(me)>>>0)):[],w_is_const:()=>!!(O(),Y)[Number(ze)>>>0],activation:Ze(Fe),activation_params:sr?Array.from((O(),j).subarray(Number(sr)>>>0,Number(Es)>>>0)):[]})},1069972:f=>{t.$b("Gelu",f,void 0)},1070024:(f,g,x,_,E,P,R,F,Z)=>{t.$b("GroupQueryAttention",f,{numHeads:g,kvNumHeads:x,scale:_,softcap:E,doRotary:P,rotaryInterleaved:R,smoothSoftmax:F,localWindowSize:Z})},1070241:(f,g,x,_)=>{t.$b("LayerNormalization",f,{axis:g,epsilon:x,simplified:!!_})},1070352:(f,g,x,_)=>{t.$b("LayerNormalization",f,{axis:g,epsilon:x,simplified:!!_})},1070463:(f,g,x,_,E,P)=>{t.$b("MatMulNBits",f,{k:g,n:x,accuracyLevel:_,bits:E,blockSize:P})},1070590:(f,g,x,_,E,P)=>{t.$b("MultiHeadAttention",f,{numHeads:g,isUnidirectional:x,maskFilterValue:_,scale:E,doRotary:P})},1070749:(f,g)=>{t.$b("QuickGelu",f,{alpha:g})},1070813:(f,g,x,_,E)=>{t.$b("RotaryEmbedding",f,{interleaved:!!g,numHeads:x,rotaryEmbeddingDim:_,scale:E})},1070952:(f,g,x)=>{t.$b("SkipLayerNormalization",f,{epsilon:g,simplified:!!x})},1071054:(f,g,x)=>{t.$b("SkipLayerNormalization",f,{epsilon:g,simplified:!!x})},1071156:(f,g,x,_)=>{t.$b("GatherBlockQuantized",f,{gatherAxis:g,quantizeAxis:x,blockSize:_})},1071277:f=>{t.Fd(f)},1071311:(f,g)=>t.Hd(Number(f),Number(g),t.Xc.Kd,t.Xc.errors)};function aS(f,g,x){return rc(async()=>{await t.Dd(Number(f),Number(g),Number(x))})}function uS(){return typeof wasmOffsetConverter<"u"}function lS(f,g,x,_){var E=we();try{return Bc(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function dS(f,g,x){var _=we();try{return Rc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;xe(1,0)}}function cS(f){var g=we();try{kc(f)}catch(x){if(_e(g),x!==x+0)throw x;xe(1,0)}}function pS(f,g){var x=we();try{return Is(f,g)}catch(_){if(_e(x),_!==_+0)throw _;xe(1,0)}}function hS(f,g,x){var _=we();try{Pc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;xe(1,0)}}function fS(f,g){var x=we();try{Fc(f,g)}catch(_){if(_e(x),_!==_+0)throw _;xe(1,0)}}function mS(f,g,x,_,E,P,R){var F=we();try{return zc(f,g,x,_,E,P,R)}catch(Z){if(_e(F),Z!==Z+0)throw Z;xe(1,0)}}function gS(f,g,x,_,E,P){var R=we();try{Cc(f,g,x,_,E,P)}catch(F){if(_e(R),F!==F+0)throw F;xe(1,0)}}function bS(f,g,x,_){var E=we();try{Mc(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function yS(f,g,x,_,E){var P=we();try{Dc(f,g,x,_,E)}catch(R){if(_e(P),R!==R+0)throw R;xe(1,0)}}function _S(f,g,x,_,E,P,R){var F=we();try{jc(f,g,x,_,E,P,R)}catch(Z){if(_e(F),Z!==Z+0)throw Z;xe(1,0)}}function wS(f,g,x,_,E,P,R){var F=we();try{Uc(f,g,x,_,E,P,R)}catch(Z){if(_e(F),Z!==Z+0)throw Z;xe(1,0)}}function vS(f,g,x,_,E,P,R,F){var Z=we();try{Hc(f,g,x,_,E,P,R,F)}catch(ee){if(_e(Z),ee!==ee+0)throw ee;xe(1,0)}}function xS(f,g,x,_,E){var P=we();try{return Lc(f,g,x,_,E)}catch(R){if(_e(P),R!==R+0)throw R;xe(1,0)}}function $S(f,g,x){var _=we();try{return Wc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;xe(1,0)}}function TS(f,g,x,_,E,P,R,F){var Z=we();try{Kc(f,g,x,_,E,P,R,F)}catch(ee){if(_e(Z),ee!==ee+0)throw ee;xe(1,0)}}function SS(f,g,x,_,E,P,R,F,Z,ee,me,Ie){var ze=we();try{Vc(f,g,x,_,E,P,R,F,Z,ee,me,Ie)}catch(Fe){if(_e(ze),Fe!==Fe+0)throw Fe;xe(1,0)}}function IS(f,g,x){var _=we();try{return Xc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;return xe(1,0),0n}}function OS(f,g,x,_,E,P,R,F,Z){var ee=we();try{Nc(f,g,x,_,E,P,R,F,Z)}catch(me){if(_e(ee),me!==me+0)throw me;xe(1,0)}}function ES(f){var g=we();try{return Zc(f)}catch(x){if(_e(g),x!==x+0)throw x;xe(1,0)}}function AS(f,g){var x=we();try{return cp(f,g)}catch(_){if(_e(x),_!==_+0)throw _;return xe(1,0),0n}}function PS(f){var g=we();try{return Yc(f)}catch(x){if(_e(g),x!==x+0)throw x;return xe(1,0),0n}}function kS(f,g,x,_){var E=we();try{return np(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function CS(f,g,x,_,E){var P=we();try{return ip(f,g,x,_,E)}catch(R){if(_e(P),R!==R+0)throw R;xe(1,0)}}function DS(f,g,x,_,E,P){var R=we();try{return op(f,g,x,_,E,P)}catch(F){if(_e(R),F!==F+0)throw F;xe(1,0)}}function RS(f,g,x,_,E,P){var R=we();try{return Gc(f,g,x,_,E,P)}catch(F){if(_e(R),F!==F+0)throw F;xe(1,0)}}function NS(f,g,x,_,E,P){var R=we();try{return sp(f,g,x,_,E,P)}catch(F){if(_e(R),F!==F+0)throw F;xe(1,0)}}function zS(f,g,x,_,E,P,R,F){var Z=we();try{return qc(f,g,x,_,E,P,R,F)}catch(ee){if(_e(Z),ee!==ee+0)throw ee;xe(1,0)}}function MS(f,g,x,_,E){var P=we();try{return ap(f,g,x,_,E)}catch(R){if(_e(P),R!==R+0)throw R;return xe(1,0),0n}}function BS(f,g,x,_){var E=we();try{return up(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function FS(f,g,x,_){var E=we();try{return lp(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function LS(f,g,x,_,E,P,R,F,Z,ee,me,Ie){var ze=we();try{return dp(f,g,x,_,E,P,R,F,Z,ee,me,Ie)}catch(Fe){if(_e(ze),Fe!==Fe+0)throw Fe;xe(1,0)}}function jS(f,g,x,_,E,P,R,F,Z,ee,me){var Ie=we();try{tp(f,g,x,_,E,P,R,F,Z,ee,me)}catch(ze){if(_e(Ie),ze!==ze+0)throw ze;xe(1,0)}}function US(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe,sr,Es){var HS=we();try{rp(f,g,x,_,E,P,R,F,Z,ee,me,Ie,ze,Fe,sr,Es)}catch(As){if(_e(HS),As!==As+0)throw As;xe(1,0)}}function VS(f,g,x){var _=we();try{return Jc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;xe(1,0)}}function GS(f,g,x){var _=we();try{return Qc(f,g,x)}catch(E){if(_e(_),E!==E+0)throw E;xe(1,0)}}function qS(f,g,x,_){var E=we();try{ep(f,g,x,_)}catch(P){if(_e(E),P!==P+0)throw P;xe(1,0)}}function Zi(){if(0<Ae)ot=Zi;else if(u)b?.(t),G();else{for(var f=le;0<f.length;)f.shift()(t);0<Ae?ot=Zi:(t.calledRun=!0,A||(G(),b?.(t)))}}return u||(Kt=await ye(),Zi()),t.PTR_SIZE=4,X?t:new Promise((f,g)=>{b=f,$=g})}var $v,zf,TE=D(()=>{"use strict";$v=Nf,zf=globalThis.self?.name?.startsWith("em-pthread"),zf&&Nf()}),ca,Ju,Mf,ht,Tv,ro,Bf,Ff,pa,Lf,ha,Sv,fa,Iv,Sl=D(()=>{"use strict";Tl(),ca=typeof location>"u"?void 0:location.origin,Ju=import.meta.url>"file:"&&import.meta.url<"file;",Mf=()=>{if(Ju){let e=URL;return new URL(new e("ort.all.bundle.min.mjs",import.meta.url).href,ca).href}return import.meta.url},ht=Mf(),Tv=()=>{if(ht&&!ht.startsWith("blob:"))return ht.substring(0,ht.lastIndexOf("/")+1)},ro=(e,t)=>{try{let n=t??ht;return(n?new URL(e,n):new URL(e)).origin===ca}catch{return!1}},Bf=(e,t)=>{let n=t??ht;try{return(n?new URL(e,n):new URL(e)).href}catch{return}},Ff=(e,t)=>`${t??"./"}${e}`,pa=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},Lf=async e=>(await import(e)).default,ha=($E(),vn(wv)).default,Sv=async()=>{if(!ht)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(ro(ht))return[void 0,ha()];let e=await pa(ht);return[e,ha(e)]},fa=(TE(),vn(xv)).default,Iv=async(e,t,n,o)=>{let u=fa&&!(e||t);if(u)if(ht)u=ro(ht)||o&&!n;else if(o&&!n)u=!0;else throw new Error("cannot determine the script source URL.");if(u)return[void 0,fa];{let l="ort-wasm-simd-threaded.jsep.mjs",d=e??Bf(l,t),c=n&&d&&!ro(d,t),s=c?await pa(d):d??Ff(l,t);return[c?s:void 0,await Lf(s)]}}}),ma,no,Wn,ga,jf,Uf,Vf,Il,Be,an=D(()=>{"use strict";Sl(),no=!1,Wn=!1,ga=!1,jf=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Uf=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Vf=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Il=async e=>{if(no)return Promise.resolve();if(Wn)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(ga)throw new Error("previous call to 'initializeWebAssembly()' failed.");Wn=!0;let t=e.initTimeout,n=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Vf())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Uf())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let o=jf();n>1&&!o&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+n+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=n=1);let u=e.wasmPaths,l=typeof u=="string"?u:void 0,d=u?.mjs,c=d?.href??d,s=u?.wasm,r=s?.href??s,i=e.wasmBinary,[a,p]=await Iv(c,l,n>1,!!i||!!r),h=!1,m=[];if(t>0&&m.push(new Promise(b=>{setTimeout(()=>{h=!0,b()},t)})),m.push(new Promise((b,$)=>{let v={numThreads:n};if(i)v.wasmBinary=i,v.locateFile=y=>y;else if(r||l)v.locateFile=y=>r??l+y;else if(c&&c.indexOf("blob:")!==0)v.locateFile=y=>new URL(y,c).href;else if(a){let y=Tv();y&&(v.locateFile=T=>y+T)}p(v).then(y=>{Wn=!1,no=!0,ma=y,b(),a&&URL.revokeObjectURL(a)},y=>{Wn=!1,ga=!0,$(y)})})),await Promise.race(m),h)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},Be=()=>{if(no&&ma)return ma;throw new Error("WebAssembly is not initialized yet.")}}),Rt,So,De,Ol=D(()=>{"use strict";an(),Rt=(e,t)=>{let n=Be(),o=n.lengthBytesUTF8(e)+1,u=n._malloc(o);return n.stringToUTF8(e,u,o),t.push(u),u},So=(e,t,n,o)=>{if(typeof e=="object"&&e!==null){if(n.has(e))throw new Error("Circular reference in options");n.add(e)}Object.entries(e).forEach(([u,l])=>{let d=t?t+u:u;if(typeof l=="object")So(l,d+".",n,o);else if(typeof l=="string"||typeof l=="number")o(d,l.toString());else if(typeof l=="boolean")o(d,l?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof l}`)})},De=e=>{let t=Be(),n=t.stackSave();try{let o=t.PTR_SIZE,u=t.stackAlloc(2*o);t._OrtGetLastError(u,u+o);let l=Number(t.getValue(u,o===4?"i32":"i64")),d=t.getValue(u+o,"*"),c=d?t.UTF8ToString(d):"";throw new Error(`${e} ERROR_CODE: ${l}, ERROR_MESSAGE: ${c}`)}finally{t.stackRestore(n)}}}),Ov,SE=D(()=>{"use strict";an(),Ol(),Ov=e=>{let t=Be(),n=0,o=[],u=e||{};try{if(e?.logSeverityLevel===void 0)u.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)u.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(u.terminate=!1);let l=0;return e?.tag!==void 0&&(l=Rt(e.tag,o)),n=t._OrtCreateRunOptions(u.logSeverityLevel,u.logVerbosityLevel,!!u.terminate,l),n===0&&De("Can't create run options."),e?.extra!==void 0&&So(e.extra,"",new WeakSet,(d,c)=>{let s=Rt(d,o),r=Rt(c,o);t._OrtAddRunConfigEntry(n,s,r)!==0&&De(`Can't set a run config entry: ${d} - ${c}.`)}),[n,o]}catch(l){throw n!==0&&t._OrtReleaseRunOptions(n),o.forEach(d=>t._free(d)),l}}}),Gf,qf,Hf,Pr,Wf,Ev,IE=D(()=>{"use strict";an(),Ol(),Gf=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},qf=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Hf=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(n=>(typeof n=="string"?n:n.name)==="webgpu")&&(e.enableMemPattern=!1)},Pr=(e,t,n,o)=>{let u=Rt(t,o),l=Rt(n,o);Be()._OrtAddSessionConfigEntry(e,u,l)!==0&&De(`Can't set a session config entry: ${t} - ${n}.`)},Wf=async(e,t,n)=>{let o=t.executionProviders;for(let u of o){let l=typeof u=="string"?u:u.name,d=[];switch(l){case"webnn":if(l="WEBNN",Pr(e,"session.disable_quant_qdq","1",n),Pr(e,"session.disable_qdq_constant_folding","1",n),typeof u!="string"){let a=u?.deviceType;a&&Pr(e,"deviceType",a,n)}break;case"webgpu":if(l="JS",typeof u!="string"){let a=u;if(a?.preferredLayout){if(a.preferredLayout!=="NCHW"&&a.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${a.preferredLayout}`);Pr(e,"preferredLayout",a.preferredLayout,n)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${l}`)}let c=Rt(l,n),s=d.length,r=0,i=0;if(s>0){r=Be()._malloc(s*Be().PTR_SIZE),n.push(r),i=Be()._malloc(s*Be().PTR_SIZE),n.push(i);for(let a=0;a<s;a++)Be().setValue(r+a*Be().PTR_SIZE,d[a][0],"*"),Be().setValue(i+a*Be().PTR_SIZE,d[a][1],"*")}await Be()._OrtAppendExecutionProvider(e,c,r,i,s)!==0&&De(`Can't append execution provider: ${l}.`)}},Ev=async e=>{let t=Be(),n=0,o=[],u=e||{};Hf(u);try{let l=Gf(u.graphOptimizationLevel??"all"),d=qf(u.executionMode??"sequential"),c=typeof u.logId=="string"?Rt(u.logId,o):0,s=u.logSeverityLevel??2;if(!Number.isInteger(s)||s<0||s>4)throw new Error(`log severity level is not valid: ${s}`);let r=u.logVerbosityLevel??0;if(!Number.isInteger(r)||r<0||r>4)throw new Error(`log verbosity level is not valid: ${r}`);let i=typeof u.optimizedModelFilePath=="string"?Rt(u.optimizedModelFilePath,o):0;if(n=t._OrtCreateSessionOptions(l,!!u.enableCpuMemArena,!!u.enableMemPattern,d,!!u.enableProfiling,0,c,s,r,i),n===0&&De("Can't create session options."),u.executionProviders&&await Wf(n,u,o),u.enableGraphCapture!==void 0){if(typeof u.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${u.enableGraphCapture}`);Pr(n,"enableGraphCapture",u.enableGraphCapture.toString(),o)}if(u.freeDimensionOverrides)for(let[a,p]of Object.entries(u.freeDimensionOverrides)){if(typeof a!="string")throw new Error(`free dimension override name must be a string: ${a}`);if(typeof p!="number"||!Number.isInteger(p)||p<0)throw new Error(`free dimension override value must be a non-negative integer: ${p}`);let h=Rt(a,o);t._OrtAddFreeDimensionOverride(n,h,p)!==0&&De(`Can't set a free dimension override: ${a} - ${p}.`)}return u.extra!==void 0&&So(u.extra,"",new WeakSet,(a,p)=>{Pr(n,a,p,o)}),[n,o]}catch(l){throw n!==0&&t._OrtReleaseSessionOptions(n)!==0&&De("Can't release session options."),o.forEach(d=>t._free(d)),l}}}),Xr,Jt,Zr,Lo,Io,El,Al,Qu,ae=D(()=>{"use strict";Xr=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},Jt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Zr=(e,t)=>{let n=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],o=typeof t=="number"?t:t.reduce((u,l)=>u*l,1);return n>0?Math.ceil(o*n):void 0},Lo=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Io=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},El=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Al=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Qu=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Pl,Av=D(()=>{"use strict";Tl(),Pl=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let n=t.headers.get("Content-Length"),o=n?parseInt(n,10):0;if(o<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let u=t.body.getReader(),l;try{l=new ArrayBuffer(o)}catch(c){if(c instanceof RangeError){let s=Math.ceil(o/65536);l=new WebAssembly.Memory({initial:s,maximum:s}).buffer}else throw c}let d=0;for(;;){let{done:c,value:s}=await u.read();if(c)break;let r=s.byteLength;new Uint8Array(l,d,r).set(s),d+=r}return new Uint8Array(l,0,o)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Kf,Xf,Zf,Yf,kl,Jf,Se,er=D(()=>{"use strict";ae(),Kf=["V","I","W","E","F"],Xf=(e,t)=>{console.log(`[${Kf[e]},${new Date().toISOString()}]${t}`)},kl=(e,t)=>{Zf=e,Yf=t},Jf=(e,t)=>{let n=Io(e),o=Io(Zf);n>=o&&Xf(n,typeof t=="function"?t():t)},Se=(...e)=>{Yf&&Jf(...e)}}),Qf,$n,z,Oo,Pv,kv,Cv,ce=D(()=>{"use strict";Qf=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},$n=class{static calcShape(e,t,n=!1){let o=e.length,u=t.length;if(o===0)return t;if(u===0)return e;let l=Math.max(e.length,t.length),d=new Array(l);if(n){if(o<2||u<2)return;let c=Qf.calcMatMulShape([e[o-2],e[o-1]],[t[u-2],t[u-1]]);if(c===void 0)return;[d[l-2],d[l-1]]=c}for(let c=n?3:1;c<=l;c++){let s=o-c<0?1:e[o-c],r=u-c<0?1:t[u-c];if(s!==r&&s>1&&r>1)return;let i=Math.max(s,r);if(s&&r)d[l-c]=Math.max(s,r);else{if(i>1)return;d[l-c]=0}}return d}static isValidBroadcast(e,t){let n=e.length,o=t.length;if(n>o)return!1;for(let u=1;u<=n;u++)if(e[n-u]!==1&&e[n-u]!==t[o-u])return!1;return!0}},z=class yo{static size(t){return yo.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,n=4){let o=t.length;if(o===0)return[];let u=new Array(o),l=o-1;for(;l>=0;){if(t[l]%n===0){u[l]=t[l]/n;break}if(n%t[l]!==0)throw new Error("cannot convert shape");u[l]=1,n/=t[l],l--}for(l--;l>=0;l--)u[l]=t[l];return u}static sizeFromDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return yo.getSizeFromDimensionRange(t,n,t.length)}static sizeToDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeToDimension as Tensor has ${t.length} dimensions.`);return yo.getSizeFromDimensionRange(t,0,n)}static getSizeFromDimensionRange(t,n,o){let u=1;for(let l=n;l<o;l++){if(t[l]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");u*=Number(t[l])}return u}static computeStrides(t){let n=t.length;if(n===0)return[];if(n===1)return[1];let o=new Array(n);o[n-1]=1,o[n-2]=t[n-1];for(let u=n-3;u>=0;--u)o[u]=o[u+1]*t[u+1];return o}static normalizeAxis(t,n){if(t<-n&&t>=n)throw new Error("unsupported axis for this operation.");return t<0?t+n:t}static normalizeAxes(t,n){return t.map(o=>this.normalizeAxis(o,n??t.length))}static sortBasedOnPerm(t,n){return n?n.map(o=>t[o]):t.slice().reverse()}static padShape(t,n){let o=t.length;return t.map((u,l)=>u+n[l]+n[l+o])}static areEqual(t,n){return t.length!==n.length?!1:t.every((o,u)=>o===n[u])}},Oo=class yr{static adjustPoolAttributes(t,n,o,u,l,d){if(!t&&o.length!==n.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let c=0;c<n.length-2;c++)c>=o.length?o.push(n[c+2]):o[c]=n[c+2];for(let c=0;c<o.length;c++)if(c<u.length){if(u[c]<0)throw new Error("strides should be greater than or equal to 1")}else u.push(1);for(let c=0;c<o.length;c++)if(c<l.length){if(l[c]<0)throw new Error("dilations should be greater than or equal to 1")}else l.push(1);for(let c=0;c<o.length*2;c++)if(c<d.length){if(d[c]<0)throw new Error("pad should be greater than or equal to 1")}else d.push(0);for(let c=0;c<o.length;c++){if(o[c]<=0)throw new Error("kernel shapes need to be greater than 0");if(d[c]>=o[c]||d[c+o.length]>=o[c])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,n,o,u,l,d,c){if(c){if(l.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(u.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let s=0;s<t.length-2;s++)yr.adjustPadAndReturnShape(t[s+(d?1:2)],n[s],o[s],u[s],l,s,s+t.length-2,c)}}static computePoolOutputShape(t,n,o,u,l,d,c,s=0){if(n.length<=0)throw new Error("input shape must be of size greater than 0");let r=[n[0],n[1]];return yr.computeShapeHelper(t,n,r,o,u,l,d,c,s),r}static computeConvOutputShape(t,n,o,u,l,d,c){if(t.length<=0||n.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let s=[t[0],n[0]];return yr.computeShapeHelper(!1,t,s,o,u,l,d,c),s}static computeShapeHelper(t,n,o,u,l,d,c,s,r=0){if(t)for(let i=0;i<n.length-2;i++)o.push(1);else for(let i=0;i<n.length-2;i++)o.push(yr.adjustPadAndReturnShape(n[i+2],u[i],l[i],d[i],c,i,i+n.length-2,s,r))}static computeOutputSize(t,n,o,u,l){let d=Math.floor(t/n)+1;return l===1&&(d=Math.ceil(t/n)+1,(d-1)*n>=o+u&&(d-=1)),d}static adjustPadAndReturnShape(t,n,o,u,l,d,c,s,r=0){let i=o*(u-1)+1;if(s&&s!=="NOTSET")switch(s){case"VALID":return l[d]=0,l[c]=0,yr.computeOutputSize(t-i,n,t,0,r);case"SAME_LOWER":case"SAME_UPPER":if(o!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let a=(Math.floor((t+n-1)/n)-1)*n+u-t;return l[d]=Math.floor(s==="SAME_LOWER"?(a+1)/2:a/2),l[c]=a-l[d],yr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}default:throw new Error("Unsupported AutoPad type")}else return yr.computeOutputSize(t+l[d]+l[c]-i,n,t,l[d],r)}},Pv=class{static getShapeOfGemmResult(e,t,n,o,u){if(e.length!==2||n.length!==2)throw new Error("shape need to be of size 2");let l,d,c;t?(l=e[1],d=e[0]):(l=e[0],d=e[1]);let s=-1;if(o?(c=n[0],s=1):(c=n[1],s=0),n[s]!==d)throw new Error("dimension mismatch");if(l<=0||c<=0||d<=0)throw new Error("invalid shape specified");if(u&&!$n.isValidBroadcast(u,[l,c]))throw new Error("gemm: invalid bias shape for broadcast");return[l,c,d]}},kv=-34028234663852886e22,Cv=34028234663852886e22}),Cl,Dv=D(()=>{"use strict";ae(),Cl=(e,t)=>new(Lo(t))(e)}),ba,em,ya,tm,_a,rm,wa,va,xa,nm,Rv,OE=D(()=>{"use strict";ae(),er(),ba=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),em=(e,t)=>{if(t==="int32")return e;let n=ba.get(t);if(!n)throw new Error(`WebNN backend does not support data type: ${t}`);let o=n/8;if(e.byteLength%o!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${o}.`);let u=e.byteLength/o,l=new(Lo(t))(e.buffer,e.byteOffset,u);switch(t){case"int64":case"uint64":{let d=new Int32Array(u);for(let c=0;c<u;c++){let s=l[c];if(s>2147483647n||s<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");d[c]=Number(s)}return new Uint8Array(d.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&l.some(c=>c>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let d=Int32Array.from(l,Number);return new Uint8Array(d.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},ya=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let n=e.byteLength/4,o=new Int32Array(e.buffer,e.byteOffset,n);switch(t){case"int64":{let u=BigInt64Array.from(o,BigInt);return new Uint8Array(u.buffer)}case"uint64":{if(o.some(l=>l<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let u=BigUint64Array.from(o,BigInt);return new Uint8Array(u.buffer)}case"int8":{if(o.some(l=>l<-128||l>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let u=Int8Array.from(o,Number);return new Uint8Array(u.buffer)}case"uint8":{if(o.some(u=>u<0||u>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(o,Number)}case"uint32":{if(o.some(l=>l<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let u=Uint32Array.from(o,Number);return new Uint8Array(u.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},tm=1,_a=()=>tm++,rm=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),wa=(e,t)=>{let n=ba.get(e);if(!n)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((o,u)=>o*u)*n/8):0},va=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:n,tensor:o,dataType:u,shape:l,fallbackDataType:d}=e;this.sessionId=t,this.mlContext=n,this.mlTensor=o,this.dataType=u,this.tensorShape=l,this.fallbackDataType=d}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return wa(this.dataType,this.tensorShape)}destroy(){Se("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),n=ya(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(n);return}else return new Uint8Array(n).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,n){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===n.length&&this.tensorShape.every((o,u)=>o===n[u])}setIsDataConverted(e){this.isDataConverted=e}},xa=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,n,o){let u=this.tensorManager.getMLContext(e),l=this.tensorManager.getMLOpSupportLimits(e),d;if(!l?.input.dataTypes.includes(t)){if(d=rm.get(t),!d||l?.input.dataTypes.includes(d))throw new Error(`WebNN backend does not support data type: ${t}`);Se("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${d}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(u,t,n))return this.wrapper.tensor;if(o){if(this.wrapper.byteLength!==wa(t,n))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let c=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,n,c,!0,!0,d),o&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=em(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else Se("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?ya(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},nm=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=_a();return this.tensorTrackersById.set(e,new xa(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,n,o,u){Se("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${n}, shape: ${o}, copyOld: ${u}}`);let l=this.tensorTrackersById.get(t);if(!l)throw new Error("Tensor not found.");return l.ensureTensor(e,n,o,u)}upload(e,t){let n=this.tensorTrackersById.get(e);if(!n)throw new Error("Tensor not found.");n.upload(t)}async download(e,t){Se("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let n=this.tensorTrackersById.get(e);if(!n)throw new Error("Tensor not found.");return n.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,n,o){let u=this.getMLContext(e),l=_a(),d=new va({sessionId:e,context:u,tensor:t,dataType:n,shape:o});return this.tensorTrackersById.set(l,new xa(this,d)),this.externalTensors.add(d),l}async getCachedTensor(e,t,n,o,u,l,d){let c=this.getMLContext(e);for(let[r,i]of this.freeTensors.entries())if(i.canReuseTensor(c,t,n)){Se("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${d?`fallbackDataType: ${d},`:""} shape: ${n}`);let a=this.freeTensors.splice(r,1)[0];return a.sessionId=e,a}Se("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${d?`fallbackDataType: ${d},`:""} shape: ${n}}`);let s=await c.createTensor({dataType:d??t,shape:n,dimensions:n,usage:o,writable:u,readable:l});return new va({sessionId:e,context:c,tensor:s,dataType:t,shape:n,fallbackDataType:d})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Rv=(...e)=>new nm(...e)}),Kn,im,Nv,EE=D(()=>{"use strict";ae(),an(),Dv(),OE(),er(),Kn=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),im=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let n=Object.keys(e).sort(),o=Object.keys(t).sort();return n.length===o.length&&n.every((u,l)=>u===o[l]&&e[u]===t[u])},Nv=class{constructor(e){this.tensorManager=Rv(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,kl(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){Se("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){Se("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let n of t)Se("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${n}}`),this.tensorManager.releaseTensorId(n);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let n=this.mlContextCache.findIndex(o=>o.gpuDevice===e);if(n!==-1)return this.mlContextCache[n].mlContext;{let o=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:o}),o}}else if(e===void 0){let n=this.mlContextCache.findIndex(o=>o.options===void 0&&o.gpuDevice===void 0);if(n!==-1)return this.mlContextCache[n].mlContext;{let o=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:o}),o}}let t=this.mlContextCache.findIndex(n=>im(n.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:n}),n}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let n=this.sessionIdsByMLContext.get(t);n||(n=new Set,this.sessionIdsByMLContext.set(t,n)),n.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let n=this.sessionIdsByMLContext.get(t);if(n.delete(e),n.size===0){this.sessionIdsByMLContext.delete(t);let o=this.mlContextCache.findIndex(u=>u.mlContext===t);o!==-1&&this.mlContextCache.splice(o,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){Se("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,n,o,u){let l=Kn.get(n);if(!l)throw new Error(`Unsupported ONNX data type: ${n}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,l,o,u)}async createTemporaryTensor(e,t,n){Se("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${n}}`);let o=Kn.get(t);if(!o)throw new Error(`Unsupported ONNX data type: ${t}`);let u=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,u,o,n,!1);let l=this.temporarySessionTensorIds.get(e);return l?l.push(u):this.temporarySessionTensorIds.set(e,[u]),u}uploadTensor(e,t){if(!Be().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");Se("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let n=await this.tensorManager.download(e);return Cl(n,t)}}registerMLTensor(e,t,n,o){let u=Kn.get(n);if(!u)throw new Error(`Unsupported ONNX data type: ${n}`);let l=this.tensorManager.registerTensor(e,t,u,o);return Se("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${u}, dimensions: ${o}} -> {tensorId: ${l}}`),l}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let n=this.sessionGraphInputs.get(e);return n?n.includes(t):!1}isGraphOutput(e,t){let n=this.sessionGraphOutputs.get(e);return n?n.includes(t):!1}isGraphInputOutputTypeSupported(e,t,n=!0){let o=Kn.get(Xr(t)),u=this.mlOpSupportLimitsBySessionId.get(e);return typeof o>"u"?!1:n?!!u?.input.dataTypes.includes(o):!!u?.output.dataTypes.includes(o)}flush(){}}}),Dl=D(()=>{"use strict"}),$a,io,oo,om,sm,Ta,el,am,zv,AE=D(()=>{"use strict";er(),Dl(),$a=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),io=[],oo=e=>Math.ceil(Number(e)/16)*16,om=e=>{for(let t=0;t<io.length;t++){let n=io[t];if(e<=n)return n}return Math.ceil(e/16)*16},sm=1,Ta=()=>sm++,el=async(e,t,n,o)=>{let u=oo(n),l=e.device.createBuffer({size:u,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let d=e.getCommandEncoder();e.endComputePass(),d.copyBufferToBuffer(t,0,l,0,u),e.flush(),await l.mapAsync(GPUMapMode.READ);let c=l.getMappedRange();if(o){let s=o();return s.set(new Uint8Array(c,0,n)),s}else return new Uint8Array(c.slice(0,n))}finally{l.destroy()}},am=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of $a)io.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let n=t.buffer,o=t.byteOffset,u=t.byteLength,l=oo(u),d=this.storageCache.get(e);if(!d)throw new Error("gpu data for uploading does not exist");if(Number(d.originalSize)!==u)throw new Error(`inconsistent data size. gpu data size=${d.originalSize}, data size=${u}`);if(l===u&&o%4===0)this.backend.device.queue.writeBuffer(d.gpuData.buffer,0,n,o,u);else{let c=new Uint8Array(l);c.set(t),this.backend.device.queue.writeBuffer(d.gpuData.buffer,0,c,0,l)}Se("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let n=this.storageCache.get(e);if(!n)throw new Error("source gpu data for memcpy does not exist");let o=this.storageCache.get(t);if(!o)throw new Error("destination gpu data for memcpy does not exist");if(n.originalSize!==o.originalSize)throw new Error("inconsistent source and destination gpu data size");let u=oo(n.originalSize),l=this.backend.getCommandEncoder();this.backend.endComputePass(),l.copyBufferToBuffer(n.gpuData.buffer,0,o.gpuData.buffer,0,u)}registerExternalBuffer(e,t,n){let o;if(n){if(o=n[0],e===n[1])return Se("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${o}, buffer is the same, skip.`),o;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else o=Ta();return this.storageCache.set(o,{gpuData:{id:o,type:0,buffer:e},originalSize:t}),Se("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${o}, registered.`),o}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),Se("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let n=om(e),o,u=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,l=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(u||l){let c=(u?this.freeBuffers:this.freeUniformBuffers).get(n);c?c.length>0?o=c.pop():o=this.backend.device.createBuffer({size:n,usage:t}):o=this.backend.device.createBuffer({size:n,usage:t})}else o=this.backend.device.createBuffer({size:n,usage:t});let d={id:Ta(),type:0,buffer:o};return this.storageCache.set(d.id,{gpuData:d,originalSize:Number(e)}),Se("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${d.id}`),d}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,n=this.storageCache.get(t);if(!n){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return Se("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${n.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(n.gpuData.buffer),n.originalSize}async download(e,t){let n=this.storageCache.get(Number(e));if(!n)throw new Error("data does not exist");await el(this.backend,n.gpuData.buffer,n.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=$a.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let n=this.freeBuffers.get(e.size)||[];t===void 0||n.length>=t?e.destroy():n.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let n=this.freeUniformBuffers.get(e.size)||[];t===void 0||n.length>=t?e.destroy():n.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(n=>{n.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(Se("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(n=>{n.gpuData.buffer.destroy()}),this.storageCache=new Map)}},zv=(...e)=>new am(...e)}),um,Pe,Ge=D(()=>{"use strict";um=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Pe=e=>new um(e)}),Tn,so,Qe,Je,oe,Ve,tl,wn,wr,ne,Xn,B,re,Mv,Rl,lm,Bv,pe=D(()=>{"use strict";ae(),ce(),Tn=64,so=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Qe=(e,t=1)=>{let n=so(e,t);return typeof n=="string"?n:n[0]},Je=(e,t=1)=>{let n=so(e,t);return typeof n=="string"?n:n[1]},oe=(...e)=>{let t=[];return e.forEach(n=>{n.length!==0&&t.push({type:12,data:n},{type:12,data:z.computeStrides(n)})}),t},Ve=e=>e%4===0?4:e%2===0?2:1,tl=(e="f32",t,n="0")=>!t||t===1?`${e}(${n})`:`vec${t}<${e}>(${n})`,wn=(e,t,n)=>e==="f32"?n:t===1?`f32(${n})`:`vec${t}<f32>(${n})`,wr=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,ne=(e,t,n,o)=>e.startsWith("uniforms.")&&n>4?typeof t=="string"?o==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:o==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:n>1?`${e}[${t}]`:e,Xn=(e,t,n,o,u)=>{let l=typeof n=="number",d=l?n:n.length,c=[...new Array(d).keys()],s=d<2?"u32":d<=4?`vec${d}<u32>`:`array<u32, ${d}>`,r=so(t,u),i=typeof r=="string"?r:r[1],a=typeof r=="string"?r:r[0],p={indices:s,value:i,storage:a,tensor:t},h=M=>typeof M=="string"?M:`${M}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=l?"uniforms.":"",$=`${b}${e}_shape`,v=`${b}${e}_strides`,y="";for(let M=0;M<d-1;M++)y+=`
    let dim${M} = current / ${ne(v,M,d)};
    let rest${M} = current % ${ne(v,M,d)};
    indices[${M}] = dim${M};
    current = rest${M};
    `;y+=`indices[${d-1}] = current;`;let T=d<2?"":`
  fn o2i_${e}(offset: u32) -> ${p.indices} {
    var indices: ${p.indices};
    var current = offset;
    ${y}
    return indices;
  }`,I=M=>(m.offsetToIndices=!0,d<2?M:`o2i_${e}(${M})`),S=[];if(d>=2)for(let M=d-1;M>=0;M--)S.push(`${ne(v,M,d)} * (indices[${M}])`);let A=d<2?"":`
  fn i2o_${e}(indices: ${p.indices}) -> u32 {
    return ${S.join("+")};
  }`,k=M=>(m.indicesToOffset=!0,d<2?M:`i2o_${e}(${M})`),O=(...M)=>d===0?"0u":`${p.indices}(${M.map(h).join(",")})`,L=(M,X)=>d<2?`${M}`:`${ne(M,X,d)}`,U=(M,X,K)=>d<2?`${M}=${K};`:`${ne(M,X,d)}=${K};`,Y={},q=(M,X)=>{m.broadcastedIndicesToOffset=!0;let K=`${X.name}broadcastedIndicesTo${e}Offset`;if(K in Y)return`${K}(${M})`;let G=[];for(let he=d-1;he>=0;he--){let de=X.indicesGet("outputIndices",he+X.rank-d);G.push(`${L(v,he)} * (${de} % ${L($,he)})`)}return Y[K]=`fn ${K}(outputIndices: ${X.type.indices}) -> u32 {
             return ${G.length>0?G.join("+"):"0u"};
           }`,`${K}(${M})`},N=(M,X)=>(()=>{if(p.storage===p.value)return`${e}[${M}]=${X};`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`${e}[${M}]=vec2<u32>(u32(${X}), select(0u, 0xFFFFFFFFu, ${X} < 0));`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`${e}[${M}]=vec2<u32>(u32(${X}), 0u);`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`${e}[${M}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${X}));`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),ue=M=>(()=>{if(p.storage===p.value)return`${e}[${M}]`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`i32(${e}[${M}].x)`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`u32(${e}[${M}].x)`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${M}] & 0xFFu), bool(${e}[${M}] & 0xFF00u), bool(${e}[${M}] & 0xFF0000u), bool(${e}[${M}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),w=d<2?"":`
  fn get_${e}ByIndices(indices: ${p.indices}) -> ${i} {
    return ${ue(`i2o_${e}(indices)`)};
  }`,C=d<2?"":(()=>{let M=c.map(K=>`d${K}: u32`).join(", "),X=c.map(K=>`d${K}`).join(", ");return`
  fn get_${e}(${M}) -> ${i} {
    return get_${e}ByIndices(${O(X)});
  }`})(),j=(...M)=>{if(M.length!==d)throw new Error(`indices length must be ${d}`);let X=M.map(h).join(",");return d===0?ue("0u"):d===1?ue(X[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${X})`)},H=M=>d<2?ue(M):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${M})`),V=d<2?"":`
  fn set_${e}ByIndices(indices: ${p.indices}, value: ${i}) {
    ${N(`i2o_${e}(indices)`,"value")}
  }`,J=d<2?"":(()=>{let M=c.map(K=>`d${K}: u32`).join(", "),X=c.map(K=>`d${K}`).join(", ");return`
  fn set_${e}(${M}, value: ${i}) {
    set_${e}ByIndices(${O(X)}, value);
  }`})();return{impl:()=>{let M=[],X=!1;return m.offsetToIndices&&(M.push(T),X=!0),m.indicesToOffset&&(M.push(A),X=!0),m.broadcastedIndicesToOffset&&(Object.values(Y).forEach(K=>M.push(K)),X=!0),m.set&&(M.push(J),X=!0),m.setByIndices&&(M.push(V),X=!0),m.get&&(M.push(C),X=!0),m.getByIndices&&(M.push(w),X=!0),!l&&X&&M.unshift(`const ${$} = ${p.indices}(${n.join(",")});`,`const ${v} = ${p.indices}(${z.computeStrides(n).join(",")});`),M.join(`
`)},type:p,offsetToIndices:I,indicesToOffset:k,broadcastedIndicesToOffset:q,indices:O,indicesGet:L,indicesSet:U,set:(...M)=>{if(M.length!==d+1)throw new Error(`indices length must be ${d}`);let X=M[d];if(typeof X!="string")throw new Error("value must be string");let K=M.slice(0,d).map(h).join(",");return d===0?N("0u",X):d===1?N(K[0],X):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${K}, ${X})`)},setByOffset:N,setByIndices:(M,X)=>d<2?N(M,X):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${M}, ${X});`),get:j,getByOffset:ue,getByIndices:H,usage:o,name:e,strides:v,shape:$,rank:d}},B=(e,t,n,o=1)=>Xn(e,t,n,"input",o),re=(e,t,n,o=1)=>Xn(e,t,n,"output",o),Mv=(e,t,n)=>Xn(e,t,n,"atomicOutput",1),Rl=(e,t,n,o=1)=>Xn(e,t,n,"internal",o),lm=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=Tn){let t=typeof e=="number"?e:e[0],n=typeof e=="number"?1:e[1],o=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||n>this.limits.maxComputeWorkgroupSizeY||o>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${n}, ${o}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*n*o>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${n}, ${o}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let u=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,l=u?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Bv=(e,t)=>new lm(e,t)}),dm,Sa,cm,pm,hm,fm,yt,Fv,Lv,xr=D(()=>{"use strict";ae(),ce(),Ge(),pe(),dm=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Sa=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),cm=(e,t)=>z.sortBasedOnPerm(e,Sa(e.length,t)),pm=(e,t,n,o)=>{let u=`fn perm(i: ${o.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`;for(let l=0;l<t;++l)u+=`a[${e[l]}]=i[${l}];`;return u+="return a;}"},hm=(e,t)=>{let n=[],o=[];for(let u=0;u<e.length;++u)e[u]!==1&&n.push(e[u]),e[t[u]]!==1&&o.push(t[u]);return{newShape:n,newPerm:o}},fm=(e,t)=>{let n=0;for(let o=0;o<e.length;++o)if(t[e[o]]!==1){if(e[o]<n)return!1;n=e[o]}return!0},yt=(e,t)=>{let n=e.dataType,o=e.dims.length,u=Sa(o,t),l=cm(e.dims,u),d=e.dims,c=l,s=o<2||fm(u,e.dims),r;if(s)return r=m=>{let b=B("input",n,d,4),$=re("output",n,c,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,$)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=z.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:r};let{newShape:i,newPerm:a}=hm(e.dims,u),p=z.areEqual(a,[2,3,1]),h=z.areEqual(a,[3,1,2]);if(i.length===2||p||h){d=p?[i[0],i[1]*i[2]]:h?[i[0]*i[1],i[2]]:i,c=[d[1],d[0]];let m=16;return r=b=>{let $=B("a",n,d.length),v=re("output",n,c.length);return`
  ${b.registerUniform("output_size","u32").declareVariables($,v)}
  var<workgroup> tile : array<array<${v.type.value}, ${m+1}>, ${m}>;
  ${b.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${$.getByIndices(`${$.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${v.setByIndices(`${v.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=z.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(c[1]/m),y:Math.ceil(c[0]/m)},programUniforms:[{type:12,data:b},...oe(d,c)]}},getShaderSource:r}}return r=m=>{let b=B("a",n,d.length),$=re("output",n,c.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,$)}

  ${pm(u,o,b,$)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${$.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${$.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=z.size(l);return{outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(d,c)]}},getShaderSource:r}},Fv=(e,t)=>{dm(e.inputs,t.perm),e.compute(yt(e.inputs[0],t.perm))},Lv=e=>Pe({perm:e.perm})}),mm,gm,bm,ym,_m,wm,vm,xm,$m,Tm,Et,jv,Uv,Vv,Gv,qv,Hv,Wv,Kv,Xv,Zv,PE=D(()=>{"use strict";ae(),ce(),pe(),Nl(),xr(),mm={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},gm={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},bm={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ym={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},_m=(e,t)=>{let n=[];for(let o=t-e;o<t;++o)n.push(o);return n},wm=(e,t)=>{let n=[],o=e.length;for(let l=0;l<o;l++)t.indexOf(l)===-1&&n.push(e[l]);let u=t.map(l=>e[l]);return[n,u]},vm=(e,t)=>{let n=e.length+t.length,o=[],u=0;for(let l=0;l<n;l++)t.indexOf(l)===-1?o.push(e[u++]):o.push(1);return o},xm=(e,t)=>{for(let n=0;n<e.length;++n)if(e[e.length-n-1]!==t-1-n)return!1;return!0},$m=(e,t)=>{let n=[];if(!xm(e,t)){for(let o=0;o<t;++o)e.indexOf(o)===-1&&n.push(o);e.forEach(o=>n.push(o))}return n},Tm=(e,t,n,o,u,l,d)=>{let c=n[0].dims,s=z.size(l),r=z.size(d),i=B("_A",n[0].dataType,c),a=re("output",u,l),p=64;s===1&&(p=256);let h=`
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
        }`;return{name:e,shaderCache:{hint:`${t};${p}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:l,dataType:u}],dispatchGroup:{x:s},programUniforms:[{type:12,data:r}]})}},Et=(e,t,n,o)=>{let u=e.inputs.length===1?n:rl(e.inputs,n),l=u.axes;l.length===0&&!u.noopWithEmptyAxes&&(l=e.inputs[0].dims.map((h,m)=>m));let d=z.normalizeAxes(l,e.inputs[0].dims.length),c=d,s=e.inputs[0],r=$m(c,e.inputs[0].dims.length);r.length>0&&(s=e.compute(yt(e.inputs[0],r),{inputs:[0],outputs:[-1]})[0],c=_m(c.length,s.dims.length));let[i,a]=wm(s.dims,c),p=i;u.keepDims&&(p=vm(i,d)),e.compute(Tm(t,u.cacheKey,[s],o,e.inputs[0].dataType,p,a),{inputs:[s]})},jv=(e,t)=>{Et(e,"ReduceMeanShared",t,"mean")},Uv=(e,t)=>{Et(e,"ReduceL1Shared",t,"l1")},Vv=(e,t)=>{Et(e,"ReduceL2Shared",t,"l2")},Gv=(e,t)=>{Et(e,"ReduceLogSumExpShared",t,"logSumExp")},qv=(e,t)=>{Et(e,"ReduceMaxShared",t,"max")},Hv=(e,t)=>{Et(e,"ReduceMinShared",t,"min")},Wv=(e,t)=>{Et(e,"ReduceProdShared",t,"prod")},Kv=(e,t)=>{Et(e,"ReduceSumShared",t,"sum")},Xv=(e,t)=>{Et(e,"ReduceSumSquareShared",t,"sumSquare")},Zv=(e,t)=>{Et(e,"ReduceLogSumShared",t,"logSum")}}),At,Sm,Eo,rl,Pt,Im,Om,Em,Am,Pm,km,Cm,Dm,Rm,Nm,kt,Yv,Jv,Qv,ex,tx,rx,nx,ix,ox,sx,Nl=D(()=>{"use strict";ae(),ce(),Ge(),pe(),PE(),At=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Sm=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Eo=(e,t,n,o,u,l,d=!1,c=!1)=>{let s=[],r=n[0].dims,i=r.length,a=z.normalizeAxes(u,i),p=!c&&a.length===0;r.forEach((b,$)=>{p||a.indexOf($)>=0?d&&s.push(1):s.push(b)});let h=s.length,m=z.size(s);return{name:e,shaderCache:t,getShaderSource:b=>{let $=[],v=B("_A",n[0].dataType,i),y=re("output",l,h),T=o(v,y,a),I=T[2];for(let S=0,A=0;S<i;S++)p||a.indexOf(S)>=0?(d&&A++,I=`for(var j${S}: u32 = 0; j${S} < ${r[S]}; j${S}++) {
                  ${T[2].includes("last_index")?`let last_index = j${S};`:""}
                  ${v.indicesSet("input_indices",S,`j${S}`)}
                  ${I}
                }`):($.push(`${v.indicesSet("input_indices",S,y.indicesGet("output_indices",A))};`),A++);return`

        ${b.registerUniform("output_size","u32").declareVariables(v,y)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${v.type.indices};
          let output_indices = ${y.offsetToIndices("global_idx")};

          ${$.join(`
`)}
          ${T[0]}       // init ops for reduce max/min
          ${T[1]}
          ${I}
          ${T[3]}
          ${T.length===4?y.setByOffset("global_idx","value"):T.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:s,dataType:l}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(r,s)]})}},rl=(e,t)=>{let n=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(o=>n.push(Number(o))),Pe({axes:n,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Pt=(e,t,n,o)=>{let u=e.inputs,l=u.length===1?n:rl(u,n);e.compute(Eo(t,{hint:l.cacheKey,inputDependencies:["rank"]},[u[0]],l.noopWithEmptyAxes&&l.axes.length===0?Sm:o,l.axes,u[0].dataType,l.keepDims,l.noopWithEmptyAxes),{inputs:[0]})},Im=(e,t)=>{At(e.inputs),Pt(e,"ReduceLogSum",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${n.getByIndices("input_indices")};`,"value = log(value);"])},Om=(e,t)=>{At(e.inputs),Pt(e,"ReduceL1",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += abs(${n.getByIndices("input_indices")});`,""])},Em=(e,t)=>{At(e.inputs),Pt(e,"ReduceL2",t,(n,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${n.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Am=(e,t)=>{At(e.inputs),Pt(e,"ReduceLogSumExp",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += exp(${n.getByIndices("input_indices")});`,"value = log(value);"])},Pm=(e,t)=>{At(e.inputs),Pt(e,"ReduceMax",t,(n,o,u)=>{let l=[];for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(n.indicesSet("input_indices",d,0));return[`${l.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};`,`value = max(value, ${n.getByIndices("input_indices")});`,""]})},km=(e,t)=>{At(e.inputs),Pt(e,"ReduceMean",t,(n,o,u)=>{let l=1;for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&(l*=e.inputs[0].dims[d]);return["var sum = f32(0);","",`sum += f32(${n.getByIndices("input_indices")});`,`let value = ${o.type.value}(sum / ${l});`]})},Cm=(e,t)=>{At(e.inputs),Pt(e,"ReduceMin",t,(n,o,u)=>{let l=[];for(let d=0;d<n.rank;d++)(u.indexOf(d)>=0||u.length===0)&&l.push(`input_indices[${d}] = 0;`);return[`${l.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};`,`value = min(value, ${n.getByIndices("input_indices")});`,""]})},Dm=(e,t)=>{At(e.inputs),Pt(e,"ReduceProd",t,(n,o)=>[`var value = ${o.type.storage}(1);`,"",`value *= ${n.getByIndices("input_indices")};`,""])},Rm=(e,t)=>{At(e.inputs),Pt(e,"ReduceSum",t,(n,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${n.getByIndices("input_indices")};`,""])},Nm=(e,t)=>{At(e.inputs),Pt(e,"ReduceSumSquare",t,(n,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${n.getByIndices("input_indices")}; value += t * t;`,""])},kt=(e,t,n)=>{if(t.length===0)return n;let o=1,u=1;for(let l=0;l<t.length;l++)t.indexOf(l)===-1?o*=e[l]:u*=e[l];return u<32&&o>1024},Yv=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?km(e,t):jv(e,t)},Jv=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Om(e,t):Uv(e,t)},Qv=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Em(e,t):Vv(e,t)},ex=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Am(e,t):Gv(e,t)},tx=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Pm(e,t):qv(e,t)},rx=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cm(e,t):Hv(e,t)},nx=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Dm(e,t):Wv(e,t)},ix=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Rm(e,t):Kv(e,t)},ox=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Nm(e,t):Xv(e,t)},sx=(e,t)=>{kt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Im(e,t):Zv(e,t)}}),Ia,ax,ux,nl,kE=D(()=>{"use strict";ae(),Ge(),Nl(),Ia=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},ax=(e,t)=>{Ia(e.inputs);let n=(o,u,l)=>{let d=[];for(let c=0;c<o.rank;c++)(l.indexOf(c)>=0||l.length===0)&&d.push(`input_indices[${c}] = 0;`);return[`${d.join(`
`)}`,`var value = ${o.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${o.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${o.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",u.setByOffset("global_idx","best_index")]};e.compute(Eo("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},ux=(e,t)=>{Ia(e.inputs);let n=(o,u,l)=>{let d=[];for(let c=0;c<o.rank;c++)(l.indexOf(c)>=0||l.length===0)&&d.push(`input_indices[${c}] = 0;`);return[`${d.join(`
`)}`,`var value = ${o.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${o.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${o.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",u.setByOffset("global_idx","best_index")]};e.compute(Eo("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},nl=e=>Pe(e)}),zm,ao,Mm,Bm,Fm,_i,Lm,lx,zl=D(()=>{"use strict";ae(),ce(),Dl(),pe(),zm=(e,t)=>{let n=e[0],o=e[1],u=e[2],l=e[3],d=e[4],c=e[5];if(d&&c)throw new Error("Attention cannot have both past and attention_bias");if(n.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let s=n.dims[0],r=n.dims[1],i=n.dims[2];if(u.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(o.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(o.dims[0]!==i)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(u.dims[0]!==o.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let a=u.dims[0]/3,p=a,h=p;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let T of t.qkvHiddenSizes)if(T%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");a=t.qkvHiddenSizes[0],p=t.qkvHiddenSizes[1],h=t.qkvHiddenSizes[2]}let m=r;if(a!==p)throw new Error("qkv_hidden_sizes first element should be same as the second");if(u.dims[0]!==a+p+h)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(d){if(p!==h)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(d.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(d.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(d.dims[1]!==s)throw new Error('Input "past" second dimension must be batch_size');if(d.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(d.dims[4]!==p/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=d.dims[3])}let $=m+b,v=-1,y=0;if(l)throw new Error("Mask not supported");if(d)throw new Error("past is not supported");if(c){if(c.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(c.dims[0]!==s||c.dims[1]!==t.numHeads||c.dims[2]!==r||c.dims[3]!==$)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:s,sequenceLength:r,pastSequenceLength:b,kvSequenceLength:m,totalSequenceLength:$,maxSequenceLength:v,inputHiddenSize:i,hiddenSize:a,vHiddenSize:h,headSize:Math.floor(a/t.numHeads),vHeadSize:Math.floor(h/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},ao=(e,t,n)=>t&&e?`
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
    `,Mm=(e,t,n,o,u,l,d,c)=>{let s=Ve(d?1:l),r=64,i=l/s;i<r&&(r=32);let a=Math.ceil(l/s/r),p=[{type:12,data:t},{type:12,data:n},{type:12,data:o},{type:12,data:u},{type:12,data:i},{type:12,data:a}],h=Qe(e.dataType,s),m=Je(1,s),b=["type"];d&&b.push("type"),c&&b.push("type");let $=v=>{let y=re("x",e.dataType,e.dims,s),T=[y],I=d?B("seq_lens",d.dataType,d.dims):void 0;I&&T.push(I);let S=c?B("total_sequence_length_input",c.dataType,c.dims):void 0;S&&T.push(S);let A=Je(e.dataType),k=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${r}>;
  var<workgroup> thread_sum: array<f32, ${r}>;
  ${v.registerUniforms(k).declareVariables(...T)}
  ${v.mainStart([r,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${ao(I,S,!1)}
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
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${r};${h};${s}`,inputDependencies:b},getShaderSource:$,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:u,z:t*n},programUniforms:p})}},Bm=(e,t,n,o,u,l,d,c,s)=>{let r=d+l.kvSequenceLength,i=[l.batchSize,l.numHeads,l.sequenceLength,r],a=e>1&&o,p=l.kvNumHeads?l.kvNumHeads:l.numHeads,h=a?[l.batchSize,p,r,l.headSize]:void 0,m=l.nReps?l.nReps:1,b=l.scale===0?1/Math.sqrt(l.headSize):l.scale,$=Ve(l.headSize),v=l.headSize/$,y=12,T={x:Math.ceil(r/y),y:Math.ceil(l.sequenceLength/y),z:l.batchSize*l.numHeads},I=[{type:12,data:l.sequenceLength},{type:12,data:v},{type:12,data:r},{type:12,data:l.numHeads},{type:12,data:l.headSize},{type:1,data:b},{type:12,data:d},{type:12,data:l.kvSequenceLength},{type:12,data:m}],S=a&&o&&z.size(o.dims)>0,A=["type","type"];S&&A.push("type"),u&&A.push("type"),c&&A.push("type"),s&&A.push("type");let k=[{dims:i,dataType:t.dataType,gpuDataType:0}];a&&k.push({dims:h,dataType:t.dataType,gpuDataType:0});let O=L=>{let U=B("q",t.dataType,t.dims,$),Y=B("key",n.dataType,n.dims,$),q=[U,Y];if(S){let V=B("past_key",o.dataType,o.dims,$);q.push(V)}u&&q.push(B("attention_bias",u.dataType,u.dims));let N=c?B("seq_lens",c.dataType,c.dims):void 0;N&&q.push(N);let ue=s?B("total_sequence_length_input",s.dataType,s.dims):void 0;ue&&q.push(ue);let w=re("output",t.dataType,i),C=[w];a&&C.push(re("present_key",t.dataType,h,$));let j=Je(1,$),H=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;

  var<workgroup> tileQ: array<${U.type.storage}, ${y*y}>;
  var<workgroup> tileK: array<${U.type.storage}, ${y*y}>;
  ${L.registerUniforms(H).declareVariables(...q,...C)}
  ${L.mainStart([y,y,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${ao(N,ue,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${S&&a?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${a?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${j}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${S&&a?`
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
          value += ${j}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch($){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${$}`)}})()};
        output[outputIdx] = ${w.type.value} (sum * uniforms.alpha) + ${u?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${$};${u!==void 0};${o!==void 0};${e}`,inputDependencies:A},getRunData:()=>({outputs:k,dispatchGroup:T,programUniforms:I}),getShaderSource:O}},Fm=(e,t,n,o,u,l,d=void 0,c=void 0)=>{let s=l+u.kvSequenceLength,r=u.nReps?u.nReps:1,i=u.vHiddenSize*r,a=e>1&&o,p=u.kvNumHeads?u.kvNumHeads:u.numHeads,h=a?[u.batchSize,p,s,u.headSize]:void 0,m=[u.batchSize,u.sequenceLength,i],b=12,$={x:Math.ceil(u.vHeadSize/b),y:Math.ceil(u.sequenceLength/b),z:u.batchSize*u.numHeads},v=[{type:12,data:u.sequenceLength},{type:12,data:s},{type:12,data:u.vHeadSize},{type:12,data:u.numHeads},{type:12,data:u.headSize},{type:12,data:i},{type:12,data:l},{type:12,data:u.kvSequenceLength},{type:12,data:r}],y=a&&o&&z.size(o.dims)>0,T=["type","type"];y&&T.push("type"),d&&T.push("type"),c&&T.push("type");let I=[{dims:m,dataType:t.dataType,gpuDataType:0}];a&&I.push({dims:h,dataType:t.dataType,gpuDataType:0});let S=A=>{let k=B("probs",t.dataType,t.dims),O=B("v",n.dataType,n.dims),L=[k,O];y&&L.push(B("past_value",o.dataType,o.dims));let U=d?B("seq_lens",d.dataType,d.dims):void 0;d&&L.push(U);let Y=c?B("total_sequence_length_input",c.dataType,c.dims):void 0;c&&L.push(Y);let q=[re("output",t.dataType,m)];a&&q.push(re("present_value",t.dataType,h));let N=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${k.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${k.type.value}, ${b*b}>;
  ${A.registerUniforms(N).declareVariables(...L,...q)}
  ${A.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${r===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${r===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${ao(U,Y,!0)}
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${o!==void 0};${e}`,inputDependencies:T},getRunData:()=>({outputs:I,dispatchGroup:$,programUniforms:v}),getShaderSource:S}},_i=(e,t,n,o,u,l,d,c,s,r,i=void 0,a=void 0)=>{let p=Math.min(e.outputCount,1+(d?1:0)+(c?1:0)),h=p>1?d:void 0,m=p>1?c:void 0,b=p>1?r.pastSequenceLength:0,$=b+r.kvSequenceLength,v=s&&z.size(s.dims)>0?s:void 0,y=[t,n];h&&z.size(h.dims)>0&&y.push(h),v&&y.push(v),i&&y.push(i),a&&y.push(a);let T=e.compute(Bm(p,t,n,h,v,r,b,i,a),{inputs:y,outputs:p>1?[-1,1]:[-1]})[0];e.compute(Mm(T,r.batchSize,r.numHeads,b,r.sequenceLength,$,i,a),{inputs:i&&a?[T,i,a]:[T],outputs:[]});let I=[T,o];m&&z.size(m.dims)>0&&I.push(m),i&&I.push(i),a&&I.push(a),e.compute(Fm(p,T,o,m,r,b,i,a),{inputs:I,outputs:p>1?[0,2]:[0]})},Lm=(e,t)=>{let n=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],o=t.sequenceLength,u=t.inputHiddenSize,l=t.headSize,d=12,c={x:Math.ceil(t.headSize/d),y:Math.ceil(t.sequenceLength/d),z:t.batchSize*t.numHeads},s=[e.inputs[0],e.inputs[1],e.inputs[2]],r=[{type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],i=a=>{let p=re("output_q",s[0].dataType,n),h=re("output_k",s[0].dataType,n),m=re("output_v",s[0].dataType,n),b=B("input",s[0].dataType,s[0].dims),$=B("weight",s[1].dataType,s[1].dims),v=B("bias",s[2].dataType,s[2].dims),y=b.type.storage,T=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${d}u;
  var<workgroup> tileInput: array<${y}, ${d*d}>;
  var<workgroup> tileWeightQ: array<${y}, ${d*d}>;
  var<workgroup> tileWeightK: array<${y}, ${d*d}>;
  var<workgroup> tileWeightV: array<${y}, ${d*d}>;
  ${a.registerUniforms(T).declareVariables(b,$,v,p,h,m)}
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:c,programUniforms:r}),getShaderSource:i},{inputs:s,outputs:[-1,-1,-1]})},lx=(e,t)=>{let n=zm(e.inputs,t),[o,u,l]=Lm(e,n);return _i(e,o,u,l,e.inputs[4],void 0,void 0,void 0,e.inputs[5],n)}}),jm,Um,Vm,dx,CE=D(()=>{"use strict";at(),ae(),ce(),Ge(),pe(),jm=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let n=(o,u,l)=>{let d=u.length;if(d!==o.length)throw new Error(`${l}: num dimensions != ${d}`);u.forEach((c,s)=>{if(c!==o[s])throw new Error(`${l}: dim[${s}] do not match`)})};if(e[0].dims.length>1){let o=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);n(e[1].dims,o,"Invalid input scale"),n(e[2].dims,o,"Invalid input B"),n(e[3].dims,o,"Invalid input mean"),n(e[4].dims,o,"Invalid input var")}else n(e[1].dims,[1],"Invalid input scale"),n(e[2].dims,[1],"Invalid input B"),n(e[3].dims,[1],"Invalid input mean"),n(e[4].dims,[1],"Invalid input var")},Um=(e,t)=>{let{epsilon:n,spatial:o,format:u}=t,l=e[0].dims,d=o?Ve(l[l.length-1]):1,c=u==="NHWC"&&l.length>1?d:1,s=z.size(l)/d,r=o,i=r?l.length:l,a=B("x",e[0].dataType,e[0].dims,d),p=B("scale",e[1].dataType,e[1].dims,c),h=B("bias",e[2].dataType,e[2].dims,c),m=B("inputMean",e[3].dataType,e[3].dims,c),b=B("inputVar",e[4].dataType,e[4].dims,c),$=re("y",e[0].dataType,i,d),v=()=>{let T="";if(o)T=`let cOffset = ${l.length===1?"0u":u==="NHWC"?`outputIndices[${l.length-1}] / ${d}`:"outputIndices[1]"};`;else if(u==="NCHW")T=`
            ${$.indicesSet("outputIndices","0","0")}
            let cOffset = ${$.indicesToOffset("outputIndices")};`;else{T=`var cIndices = ${p.type.indices}(0);
                       cIndices[0] = outputIndices[${l.length-1}];`;for(let I=1;I<p.rank;I++)T+=`cIndices[${I}] = outputIndices[${I}];`;T+=`let cOffset = ${p.indicesToOffset("cIndices")};`}return T},y=T=>`
  const epsilon = ${n};
  ${T.registerUniform("outputSize","u32").declareVariables(a,p,h,m,b,$)}
  ${T.mainStart()}
  ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${$.offsetToIndices(`global_idx * ${d}`)};
    ${v()}
    let scale = ${p.getByOffset("cOffset")};
    let bias = ${h.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${a.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${$.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${o}_${d}`,inputDependencies:r?["rank","type","type","type","type"]:void 0},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:r?[{type:12,data:s},...oe(l)]:[{type:12,data:s}]})}},Vm=e=>Pe(e),dx=(e,t)=>{let{inputs:n,outputCount:o}=e,u=Vm({...t,outputCount:o});if(fe.webgpu.validateInputContent&&jm(n,u),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Um(n,u))}}),Gm,qm,cx,DE=D(()=>{"use strict";ce(),pe(),Gm=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},qm=e=>{let t=e[0].dims,n=e[0].dims[2],o=z.size(t)/4,u=e[0].dataType,l=B("input",u,t,4),d=B("bias",u,[n],4),c=B("residual",u,t,4),s=re("output",u,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)}}),getShaderSource:r=>`
  const channels = ${n}u / 4;
  ${r.declareVariables(l,d,c,s)}

  ${r.mainStart()}
    ${r.guardAgainstOutOfBoundsWorkgroupSizes(o)}
    let value = ${l.getByOffset("global_idx")}
      + ${d.getByOffset("global_idx % channels")} + ${c.getByOffset("global_idx")};
    ${s.setByOffset("global_idx","value")}
  }`}},cx=e=>{Gm(e.inputs),e.compute(qm(e.inputs))}}),Hm,Oe,px,hx,fx,mx,gx,bx,yx,_x,wx,Wm,vx,xx,$x,Tx,li,Sx,_o,Ix,Ox,Ex,Ax,Px,kx,Cx,Dx,Rx,Nx,zx,Mx,Bx,Fx,Lx,jx,Ux,Oa,Vx,il,ol,Gx,qx,Hx,Km,Xm,Wx,Ml=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Hm=(e,t,n,o,u,l,d)=>{let c=Math.ceil(t/4),s="";typeof u=="string"?s=`${u}(a)`:s=u("a");let r=B("inputData",n,[c],4),i=re("outputData",o,[c],4),a=[{name:"vec_size",type:"u32"}];return d&&a.push(...d),`
      ${e.registerUniforms(a).declareVariables(r,i)}

  ${l??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${r.getByOffset("global_idx")};
    ${i.setByOffset("global_idx",s)}
  }`},Oe=(e,t,n,o,u,l=e.dataType,d,c)=>{let s=[{type:12,data:Math.ceil(z.size(e.dims)/4)}];return d&&s.push(...d),{name:t,shaderCache:{hint:u,inputDependencies:["type"]},getShaderSource:r=>Hm(r,z.size(e.dims),e.dataType,l,n,o,c),getRunData:r=>({outputs:[{dims:e.dims,dataType:l}],dispatchGroup:{x:Math.ceil(z.size(r[0].dims)/64/4)},programUniforms:s})}},px=e=>{e.compute(Oe(e.inputs[0],"Abs","abs"))},hx=e=>{e.compute(Oe(e.inputs[0],"Acos","acos"))},fx=e=>{e.compute(Oe(e.inputs[0],"Acosh","acosh"))},mx=e=>{e.compute(Oe(e.inputs[0],"Asin","asin"))},gx=e=>{e.compute(Oe(e.inputs[0],"Asinh","asinh"))},bx=e=>{e.compute(Oe(e.inputs[0],"Atan","atan"))},yx=e=>{e.compute(Oe(e.inputs[0],"Atanh","atanh"))},_x=e=>Pe(e),wx=(e,t)=>{let n;switch(t.to){case 10:n="vec4<f16>";break;case 1:n="vec4<f32>";break;case 12:n="vec4<u32>";break;case 6:n="vec4<i32>";break;case 9:n="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(Oe(e.inputs[0],"Cast",n,void 0,t.cacheKey,t.to))},Wm=e=>{let t,n,o=e.length>=2&&e[1].data!==0,u=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=o?e[1].getFloat32Array()[0]:-34028234663852886e22,n=u?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=o?e[1].getUint16Array()[0]:64511,n=u?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Pe({min:t,max:n})},vx=(e,t)=>{let n=t||Wm(e.inputs),o=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Clip",u=>`clamp(${u}, vec4<${o}>(uniforms.min), vec4<${o}>(uniforms.max))`,void 0,n.cacheKey,void 0,[{type:e.inputs[0].dataType,data:n.min},{type:e.inputs[0].dataType,data:n.max}],[{name:"min",type:o},{name:"max",type:o}]),{inputs:[0]})},xx=e=>{e.compute(Oe(e.inputs[0],"Ceil","ceil"))},$x=e=>{e.compute(Oe(e.inputs[0],"Cos","cos"))},Tx=e=>{e.compute(Oe(e.inputs[0],"Cosh","cosh"))},li=e=>Pe(e),Sx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Elu",o=>`elu_vf32(${o})`,`
  const elu_alpha_ = ${n}(${t.alpha});

  fn elu_f32(a: ${n}) -> ${n} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${n}>) -> vec4<${n}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},_o=(e="f32")=>`
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
}`,Ix=e=>{let t=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Erf",n=>`erf_vf32(${n})`,_o(t)))},Ox=e=>{e.compute(Oe(e.inputs[0],"Exp","exp"))},Ex=e=>{e.compute(Oe(e.inputs[0],"Floor","floor"))},Ax=e=>{let t=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Gelu",n=>`0.5 * ${n} * (1.0 + erf_vf32(${n} * 0.7071067811865475))`,_o(t)))},Px=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"LeakyRelu",o=>`select(leaky_relu_alpha_ * ${o}, ${o}, ${o} >= vec4<${n}>(0.0))`,`const leaky_relu_alpha_ = ${n}(${t.alpha});`,t.cacheKey))},kx=e=>{e.compute(Oe(e.inputs[0],"Not",t=>`!${t}`))},Cx=e=>{e.compute(Oe(e.inputs[0],"Neg",t=>`-${t}`))},Dx=e=>{e.compute(Oe(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Rx=e=>{let t=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Relu",n=>`select(vec4<${t}>(0.0), ${n}, ${n} > vec4<${t}>(0.0))`))},Nx=e=>{e.compute(Oe(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},zx=e=>Pe(e),Mx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"HardSigmoid",o=>`max(vec4<${n}>(0.0), min(vec4<${n}>(1.0), ${t.alpha} * ${o} + vec4<${n}>(${t.beta})))`,void 0,t.cacheKey))},Bx=e=>{let t=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"HardSwish",n=>`${n} * max(vec4<${t}>(0.0), min(vec4<${t}>(1.0), vec4<${t}>(${t}(1.0 / 6.0)) * ${n} + vec4<${t}>(0.5)))`))},Fx=e=>{e.compute(Oe(e.inputs[0],"Sin","sin"))},Lx=e=>{e.compute(Oe(e.inputs[0],"Sinh","sinh"))},jx=e=>{e.compute(Oe(e.inputs[0],"Sqrt","sqrt"))},Ux=e=>{e.compute(Oe(e.inputs[0],"Tan","tan"))},Oa=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Vx=e=>{e.compute(Oe(e.inputs[0],"Tanh",Oa))},il=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Oa("v")};
}
`,ol=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Gx=e=>{let t=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"FastGelu",ol,il(t),void 0,e.inputs[0].dataType))},qx=(e,t)=>{let n=Je(e.inputs[0].dataType);return e.compute(Oe(e.inputs[0],"ThresholdedRelu",o=>`select(vec4<${n}>(0.0), ${o}, ${o} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${n}>(${t.alpha});`,t.cacheKey)),0},Hx=e=>{e.compute(Oe(e.inputs[0],"Log","log"))},Km=(e,t)=>`
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
`,Xm=e=>`quick_gelu_impl(${e})`,Wx=(e,t)=>{let n=Je(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"QuickGelu",Xm,Km(n,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Zm,Ym,Kx,RE=D(()=>{"use strict";ce(),pe(),Ml(),Zm=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ym=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let n=B("input",e[0].dataType,e[0].dims,4),o=B("bias",e[0].dataType,[e[0].dims[2]],4),u=re("output",e[0].dataType,t,4),l=z.size(t)/4,d=Qe(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)}}),getShaderSource:c=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${c.declareVariables(n,o,u)}

  ${_o(d)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes(l)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${u.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Kx=e=>{Zm(e.inputs),e.compute(Ym(e.inputs))}}),Jm,Qm,Ct,Xx,Zx,Yx,Jx,Qx,e1,t1,r1,n1,i1,NE=D(()=>{"use strict";ae(),ce(),pe(),Jm=(e,t,n,o,u,l,d,c,s,r,i,a)=>{let p,h;typeof c=="string"?p=h=(y,T)=>`${c}((${y}),(${T}))`:typeof c=="function"?p=h=c:(p=c.scalar,h=c.vector);let m=re("outputData",i,o.length,4),b=B("aData",s,t.length,4),$=B("bData",r,n.length,4),v;if(u)if(l){let y=z.size(t)===1,T=z.size(n)===1,I=t.length>0&&t[t.length-1]%4===0,S=n.length>0&&n[n.length-1]%4===0;y||T?v=m.setByOffset("global_idx",h(y?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),T?`${$.type.value}(${$.getByOffset("0")}.x)`:$.getByOffset("global_idx"))):v=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${$.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",h(d||I?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,d||S?$.getByOffset("offsetB / 4u"):`${$.type.value}(${$.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else v=m.setByOffset("global_idx",h(b.getByOffset("global_idx"),$.getByOffset("global_idx")));else{if(!l)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let y=(T,I,S="")=>{let A=`aData[indexA${I}][componentA${I}]`,k=`bData[indexB${I}][componentB${I}]`;return`
            let outputIndices${I} = ${m.offsetToIndices(`global_idx * 4u + ${I}u`)};
            let offsetA${I} = ${b.broadcastedIndicesToOffset(`outputIndices${I}`,m)};
            let offsetB${I} = ${$.broadcastedIndicesToOffset(`outputIndices${I}`,m)};
            let indexA${I} = offsetA${I} / 4u;
            let indexB${I} = offsetB${I} / 4u;
            let componentA${I} = offsetA${I} % 4u;
            let componentB${I} = offsetB${I} % 4u;
            ${T}[${I}] = ${S}(${p(A,k)});
          `};i===9?v=`
            var data = vec4<u32>(0);
            ${y("data",0,"u32")}
            ${y("data",1,"u32")}
            ${y("data",2,"u32")}
            ${y("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:v=`
            ${y("outputData[global_idx]",0)}
            ${y("outputData[global_idx]",1)}
            ${y("outputData[global_idx]",2)}
            ${y("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(b,$,m)}

        ${a??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${v}
      }`},Qm=(e,t,n,o,u,l,d=n.dataType)=>{let c=n.dims.map(Number),s=o.dims.map(Number),r=!z.areEqual(c,s),i=c,a=z.size(c),p=!1,h=!1,m=[r];if(r){let b=$n.calcShape(c,s,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");i=b.slice(),a=z.size(i);let $=z.size(c)===1,v=z.size(s)===1,y=c.length>0&&c[c.length-1]%4===0,T=s.length>0&&s[s.length-1]%4===0;m.push($),m.push(v),m.push(y),m.push(T);let I=1;for(let S=1;S<i.length;S++){let A=c[c.length-S],k=s[s.length-S];if(A===k)I*=A;else break}I%4===0?(h=!0,p=!0):($||v||y||T)&&(p=!0)}else p=!0;return m.push(p),{name:e,shaderCache:{hint:t+m.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>Jm(b,c,s,i,p,r,h,u,n.dataType,o.dataType,d,l),getRunData:()=>({outputs:[{dims:i,dataType:d}],dispatchGroup:{x:Math.ceil(a/64/4)},programUniforms:[{type:12,data:Math.ceil(z.size(i)/4)},...oe(c,s,i)]})}},Ct=(e,t,n,o,u,l)=>{e.compute(Qm(t,u??"",e.inputs[0],e.inputs[1],n,o,l))},Xx=e=>{Ct(e,"Add",(t,n)=>`${t}+${n}`)},Zx=e=>{Ct(e,"Div",(t,n)=>`${t}/${n}`)},Yx=e=>{Ct(e,"Equal",{scalar:(t,n)=>`u32(${t}==${n})`,vector:(t,n)=>`vec4<u32>(${t}==${n})`},void 0,void 0,9)},Jx=e=>{Ct(e,"Mul",(t,n)=>`${t}*${n}`)},Qx=e=>{let t=B("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Ct(e,"Pow",{scalar:(n,o)=>`pow_custom(${n},${o})`,vector:(n,o)=>`pow_vector_custom(${n},${o})`},`
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
      `)},e1=e=>{Ct(e,"Sub",(t,n)=>`${t}-${n}`)},t1=e=>{Ct(e,"Greater",{scalar:(t,n)=>`u32(${t}>${n})`,vector:(t,n)=>`vec4<u32>(${t}>${n})`},void 0,void 0,9)},r1=e=>{Ct(e,"Less",{scalar:(t,n)=>`u32(${t}<${n})`,vector:(t,n)=>`vec4<u32>(${t}<${n})`},void 0,void 0,9)},n1=e=>{Ct(e,"GreaterOrEqual",{scalar:(t,n)=>`u32(${t}>=${n})`,vector:(t,n)=>`vec4<u32>(${t}>=${n})`},void 0,void 0,9)},i1=e=>{Ct(e,"LessOrEqual",{scalar:(t,n)=>`u32(${t}<=${n})`,vector:(t,n)=>`vec4<u32>(${t}<=${n})`},void 0,void 0,9)}}),eg,tg,rg,ng,o1,s1,zE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),eg=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let n=0,o=e[n],u=o.dataType,l=o.dims.length;e.forEach((d,c)=>{if(c!==n){if(d.dataType!==u)throw new Error("input tensors should be one type");if(d.dims.length!==l)throw new Error("input tensors should have the same shape");d.dims.forEach((s,r)=>{if(r!==t&&s!==o.dims[r])throw new Error("non concat dimensions must match")})}})},tg=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,rg=(e,t)=>{let n=e.length,o=[];for(let u=0;u<n;++u){let l=t.setByOffset("global_idx",e[u].getByIndices("indices"));n===1?o.push(l):u===0?o.push(`if (inputIndex == ${u}u) { ${l} }`):u===n-1?o.push(`else { ${l} }`):o.push(`else if (inputIndex == ${u}) { ${l} }`)}return o.join(`
`)},ng=(e,t,n,o)=>{let u=z.size(n),l=new Array(e.length),d=new Array(e.length),c=0,s=[],r=[],i=[{type:12,data:u}];for(let b=0;b<e.length;++b)c+=e[b].dims[t],l[b]=c,r.push(e[b].dims.length),d[b]=B(`input${b}`,o,r[b]),s.push("rank"),i.push({type:12,data:l[b]});for(let b=0;b<e.length;++b)i.push(...oe(e[b].dims));i.push(...oe(n));let a=re("output",o,n.length),p=a.indicesGet("indices",t),h=Array.from(Array(l.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),m=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let $=0;$<e.length;$++)b.registerUniform(`sizeInConcatAxis${$}`,"u32");return b.declareVariables(...d,a)})()}

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
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:s},getRunData:()=>({outputs:[{dims:n,dataType:o}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:i}),getShaderSource:m}},o1=(e,t)=>{let n=e.inputs,o=n[0].dims,u=z.normalizeAxis(t.axis,o.length);eg(n,u);let l=o.slice();l[u]=n.reduce((c,s)=>c+(s.dims.length>u?s.dims[u]:0),0);let d=n.filter(c=>z.size(c.dims)>0);e.compute(ng(d,u,l,n[0].dataType),{inputs:d})},s1=e=>Pe({axis:e.axis})}),tn,rn,nn,Bl,un=D(()=>{"use strict";ae(),ce(),tn=(e,t,n="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${n}(uniforms.clip_min)), ${t}(${n}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${n}(uniforms.alpha) * value + ${n}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${n}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},rn=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},nn=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Bl=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[n,o]=e?.activation_params||[.2,.5];return{activation:t,alpha:n,beta:o}}else if(t==="Clip"){let[n,o]=e?.activation_params||[kv,Cv];return{activation:t,clipMax:o,clipMin:n}}else if(t==="LeakyRelu"){let[n]=e?.activation_params||[.01];return{activation:t,alpha:n}}return{activation:t}}}),rt,a1,Fl=D(()=>{"use strict";rt=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},a1=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),u1,ME=D(()=>{"use strict";u1=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),mi,Ll,jl=D(()=>{"use strict";ae(),ce(),pe(),un(),mi=(e,t,n,o,u)=>{let l=o-n;return`
      ${Array.from({length:n}).map((d,c)=>`
      if (${ne(t.shape,c,t.rank)} != 1) {
        ${t.indicesSet(e,c,ne(u,c+l,o))}
      } else {
        ${t.indicesSet(e,c,0)}
      }`).join("")}
`},Ll=(e,t,n,o,u=!1,l)=>{let d=e[0].dims,c=e[1].dims,s=d[d.length-2],r=c[c.length-1],i=d[d.length-1],a=Ve(r),p=Ve(i),h=Ve(s),m=z.size(n)/a/h,b=e.length>2,$=o?o.slice(0,-2):n.slice(0,-2),v=[z.size($),s,r],y=[{type:12,data:m},{type:12,data:s},{type:12,data:r},{type:12,data:i}];rn(t,y),y.push(...oe($,d,c)),b&&y.push(...oe(e[2].dims)),y.push(...oe(v));let T=I=>{let S=Rl("batch_dims",e[0].dataType,$.length),A=B("a",e[0].dataType,d.length,p),k=B("b",e[1].dataType,c.length,a),O=re("output",e[0].dataType,v.length,a),L=Qe(O.type.tensor),U=tn(t,O.type.value,L),Y=[A,k],q="";if(b){let w=u?a:1;Y.push(B("bias",e[2].dataType,e[2].dims.length,w)),q=`${u?`value += bias[col / ${w}];`:`value += ${O.type.value}(bias[row + i]);`}`}let N=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];nn(t,N);let ue=()=>{let w=`var a_data: ${A.type.value};`;for(let C=0;C<p;C++)w+=`
              let b_data${C} = b[(b_offset + (k + ${C}) * uniforms.N + col) / ${a}];`;for(let C=0;C<h;C++){w+=`a_data = a[(a_offset + (row + ${C}) * uniforms.K + k) / ${p}];`;for(let j=0;j<p;j++)w+=`
            values[${C}] = fma(${k.type.value}(a_data${p===1?"":`[${j}]`}), b_data${j}, values[${C}]);
`}return w};return`
  ${I.registerUniforms(N).registerInternalVariables(S).declareVariables(...Y,O)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${a})) * ${a};
    var index1 = global_idx / (uniforms.N / ${a});
    let stride1 = uniforms.M / ${h};
    let row = (index1 % stride1) * ${h};
    let batch = index1 / stride1;

    ${n.length===2?"":`let batch_indices = ${S.offsetToIndices("batch")};`}

    var a_indices: ${A.type.indices};
    ${mi("a_indices",A,A.rank-2,S.rank,"batch_indices")}
    ${A.indicesSet("a_indices",A.rank-2,0)}
    ${A.indicesSet("a_indices",A.rank-1,0)}
    let a_offset = ${A.indicesToOffset("a_indices")};

    var b_indices: ${k.type.indices};
    ${mi("b_indices",k,k.rank-2,S.rank,"batch_indices")}
    ${k.indicesSet("b_indices",k.rank-2,0)}
    ${k.indicesSet("b_indices",k.rank-1,0)}
    let b_offset = ${k.indicesToOffset("b_indices")};
    var values: array<${O.type.value}, ${h}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${p}) {
      ${ue()}
    }
    for (var i = 0u; i < ${h}u; i++) {
      var value = values[i];
      ${q}
      ${U}
      let cur_indices = ${O.type.indices}(batch, row + i, col);
      let offset = ${O.indicesToOffset("cur_indices")};
      ${O.setByOffset(`offset / ${a}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${a};${p};${h};${u}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:l?l(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:y}),getShaderSource:T}}}),ig,og,sl,Ea,sg,al,ag,Ao,Ul=D(()=>{"use strict";ae(),ce(),pe(),un(),jl(),Fl(),ig=(e,t)=>e?`
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
        }`,sl=(e,t,n="f32",o,u=!1,l=32,d=!1,c=32)=>{let s=t[1]*e[1],r=t[0]*e[0],i=u?s:l,a=u?l:s,p=i/t[0],h=l/t[1];if(!((u&&p===4&&e[1]===4||!u&&(p===3||p===4))&&i%t[0]===0&&l%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${u} is true, innerElementSize ${p} and workPerThread[1] ${e[1]} must be 4.
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
}`},Ea=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,sg=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",al=(e,t,n="f32",o,u=!1,l=32,d=!1,c=32,s=!1)=>{let r=e[1]*t[1],i=e[0]*t[0],a=u?r:l,p=u?l:r;if(!(p%t[1]===0&&a%t[0]===0&&l%t[1]===0))throw new Error(`tileAHight ${p} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${a} must be divisible by workgroupSize[0]${t[0]}, tileInner ${l} must be divisible by workgroupSize[1]${t[1]}`);let h=p/t[1],m=a/t[0],b=l/t[1],$=s?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${r};
    let globalColStart = i32(workgroupId.x) * ${i};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${p}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${a}; inputCol = inputCol + ${t[0]}) {
          ${Ea(u,o)}
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
      ${Ea(u,o)}
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
    ${$}
  }
`},ag=(e,t,n,o,u=!1)=>{let[l,d,c,s]=o,r=Qe(o[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${l.type.indices}) -> ${rt(e,r)} {
      var value = ${rt(e,r)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${d.type.indices};
        ${mi("aIndices",d,d.rank-2,l.rank,"batchIndices")}
        ${d.indicesSet("aIndices",d.rank-2,"u32(row)")}
        ${d.indicesSet("aIndices",d.rank-1,"u32(colIn)")}
        value = ${d.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${l.type.indices}) -> ${rt(e,r)} {
      var value = ${rt(e,r)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${c.type.indices};
        ${mi("bIndices",c,c.rank-2,l.rank,"batchIndices")}
        ${c.indicesSet("bIndices",c.rank-2,"u32(row)")}
        ${c.indicesSet("bIndices",c.rank-1,"u32(colIn)")}
        value = ${c.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${rt(e,r)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${u?"bias[colIn]":`${rt(e,r)}(bias[row])`};`:""}
        ${n}
        ${s.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Ao=(e,t,n,o,u=!1,l)=>{let d=e[0].dims,c=e[1].dims,s=d.slice(0,-2),r=c.slice(0,-2),i=o?o.slice(0,-2):n.slice(0,-2),a=z.size(i),p=d[d.length-2],h=d[d.length-1],m=c[c.length-1],b=h%4===0&&m%4===0,$=p<=8?[4,1,1]:[4,4,1],v=[8,8,1],y=[Math.ceil(m/v[0]/$[0]),Math.ceil(p/v[1]/$[1]),Math.ceil(a/v[2]/$[2])],T=b?4:1,I=[...s,p,h/T],S=I.length,A=[...r,h,m/T],k=A.length,O=[a,p,m/T],L=[{type:6,data:p},{type:6,data:m},{type:6,data:h}];rn(t,L),L.push(...oe(i,I,A));let U=["rank","rank"],Y=e.length>2;Y&&(L.push(...oe(e[2].dims)),U.push("rank")),L.push(...oe(O));let q=N=>{let ue=i.length,w=Rl("batchDims",e[0].dataType,ue,1),C=Qe(e[0].dataType),j=B("a",e[0].dataType,S,T),H=B("b",e[1].dataType,k,T),V=re("result",e[0].dataType,O.length,T),J=[j,H];if(Y){let he=u?T:1;J.push(B("bias",e[2].dataType,e[2].dims.length,he))}let M=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];nn(t,M);let X=Qe(V.type.tensor),K=tn(t,V.type.value,X),G=ag(T,Y,K,[w,j,H,V],u);return`
  ${N.registerUniforms(M).registerInternalVariables(w).declareVariables(...J,V)}
  ${G}
  ${b?sl($,v,C,w):al($,v,C,w)}
                   `};return{name:"MatMul",shaderCache:{hint:`${$};${t.activation};${b};${u}`,inputDependencies:U},getRunData:()=>({outputs:[{dims:l?l(n):n,dataType:e[0].dataType}],dispatchGroup:{x:y[0],y:y[1],z:y[2]},programUniforms:L}),getShaderSource:q}}}),ug,l1,BE=D(()=>{"use strict";ae(),er(),pe(),un(),Fl(),ME(),Ul(),ug=(e,t,n,o,u=!1,l,d=4,c=4,s=4,r="f32")=>{let i=L=>{switch(L){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${r}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${L} is not supported.`)}},a=L=>{switch(L){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${L} is not supported.`)}},p=e?`
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
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",$=e?"row":"col",v=e?"col":"row",y=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${$} / outWidth;
    let outCol = ${$} % outWidth;

    let WRow = ${v} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${v} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${v} % inChannels;
    var resData = ${rt(d,r)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${b}) {
      ${p}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${i(d)}
    }
    return resData;`,T=e?t&&o?`
    let col = colIn * ${d};
    ${y}`:`
    let col = colIn * ${d};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${y}
    }
    return ${rt(d,r)}(0.0);`:o&&n?`
    let col = colIn * ${d};
    ${y}`:`
    let col = colIn * ${d};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${y}
    }
    return ${rt(d,r)}(0.0);`,I=e?o&&n?a(c):`
    let col = colIn * ${c};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${a(c)}
    }
    return ${rt(c,r)}(0.0);`:`
    let col = colIn * ${c};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${a(c)}
    }
    return ${rt(c,r)}(0.0);`,S=rt(s,r),A=rt(e?d:c,r),k=rt(e?c:d,r),O=tn(l,S,r);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${A} {
      ${e?T:I}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${k} {
      ${e?I:T}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${S}) {
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
    }`},l1=(e,t,n,o,u,l,d,c,s)=>{let r=t.format==="NHWC",i=r?e[0].dims[3]:e[0].dims[1],a=n[0],p=r?n[2]:n[3],h=r?n[1]:n[2],m=r?n[3]:n[1],b=r&&(i%4===0||i%3===0)&&m%4===0,$=r?m:p*h,v=r?p*h:m,y=[8,8,1],T=o<=8?[4,1,1]:[4,4,1],I=[Math.ceil($/y[0]/T[0]),Math.ceil(v/y[1]/T[1]),Math.ceil(a/y[2]/T[2])];Se("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${I}`);let S=b?r&&i%4!==0?3:4:1,A=y[1]*T[1],k=y[0]*T[0],O=Math.max(y[0]*S,y[1]),L=o%A===0,U=u%k===0,Y=l%O===0,q=b?[S,4,4]:[1,1,1],N=[{type:6,data:o},{type:6,data:u},{type:6,data:l},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];rn(t,N),N.push(...oe(e[0].dims,e[1].dims));let ue=["rank","rank"];d&&(N.push(...oe(e[2].dims)),ue.push("rank")),N.push(...oe(n));let w=C=>{let j=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];nn(t,j);let H=b?4:1,V=Qe(e[0].dataType),J=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${V}>`:V}) {
        result[flatIndex] = ${b?`vec4<${V}>`:V}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${V}>`:V}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,M=B("x",e[0].dataType,e[0].dims.length,S===3?1:S),X=B("w",e[1].dataType,e[1].dims.length,H),K=[M,X],G=re("result",e[0].dataType,n.length,H);if(d){let he=B("bias",e[2].dataType,e[2].dims.length,H);K.push(he),J+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${V}>`:V} {
          return bias[coords.${r?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${u1("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${C.registerUniforms(j).declareVariables(...K,G)}
        ${J}
        ${ug(r,L,U,Y,d,t,q[0],q[1],q[2],V)}
        ${b?sl(T,y,V,void 0,!r,O):al(T,y,V,void 0,!r,O,!1,void 0,c)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${S};${b};${L};${U};${Y};${A};${k};${O}`,inputDependencies:ue},getRunData:()=>({outputs:[{dims:s?s(n):n,dataType:e[0].dataType}],dispatchGroup:{x:I[0],y:I[1],z:I[2]},programUniforms:N}),getShaderSource:w}}}),lg,Aa,Zn,dg,Pa,cg,d1,c1,FE=D(()=>{"use strict";ae(),er(),ce(),pe(),un(),Fl(),lg=e=>{let t=1;for(let n=0;n<e.length;n++)t*=e[n];return t},Aa=e=>typeof e=="number"?[e,e,e]:e,Zn=(e,t)=>t<=1?e:e+(e-1)*(t-1),dg=(e,t,n,o=1)=>{let u=Zn(t,o);return Math.floor((e[0]*(n-1)-n+u)/2)},Pa=(e,t,n,o,u)=>{u==null&&(u=dg(e,t[0],o[0]));let l=[0,0,0,n];for(let d=0;d<3;d++)e[d]+2*u>=t[d]&&(l[d]=Math.trunc((e[d]-t[d]+2*u)/o[d]+1));return l},cg=(e,t,n,o,u,l,d,c,s,r)=>{let i,a,p,h;if(e==="VALID"&&(e=0),typeof e=="number"){i={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=Pa([t,n,o,1],[c,s,r],1,[u,l,d],e);a=m[0],p=m[1],h=m[2]}else if(Array.isArray(e)){if(!e.every((b,$,v)=>b===v[0]))throw Error(`Unsupported padding parameter: ${e}`);i={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=Pa([t,n,o,1],[c,s,r],1,[u,l,d],e[0]);a=m[0],p=m[1],h=m[2]}else if(e==="SAME_UPPER"){a=Math.ceil(t/u),p=Math.ceil(n/l),h=Math.ceil(o/d);let m=(a-1)*u+c-t,b=(p-1)*l+s-n,$=(h-1)*d+r-o,v=Math.floor(m/2),y=m-v,T=Math.floor(b/2),I=b-T,S=Math.floor($/2),A=$-S;i={top:T,bottom:I,left:S,right:A,front:v,back:y}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:i,outDepth:a,outHeight:p,outWidth:h}},d1=(e,t,n,o,u,l=!1,d="channelsLast")=>{let c,s,r,i,a;if(d==="channelsLast")[c,s,r,i,a]=e;else if(d==="channelsFirst")[c,a,s,r,i]=e;else throw new Error(`Unknown dataFormat ${d}`);let[p,,h,m,b]=t,[$,v,y]=Aa(n),[T,I,S]=Aa(o),A=Zn(h,T),k=Zn(m,I),O=Zn(b,S),{padInfo:L,outDepth:U,outHeight:Y,outWidth:q}=cg(u,s,r,i,$,v,y,A,k,O),N=l?p*a:p,ue=[0,0,0,0,0];return d==="channelsFirst"?ue=[c,N,U,Y,q]:d==="channelsLast"&&(ue=[c,U,Y,q,N]),{batchSize:c,dataFormat:d,inDepth:s,inHeight:r,inWidth:i,inChannels:a,outDepth:U,outHeight:Y,outWidth:q,outChannels:N,padInfo:L,strideDepth:$,strideHeight:v,strideWidth:y,filterDepth:h,filterHeight:m,filterWidth:b,effectiveFilterDepth:A,effectiveFilterHeight:k,effectiveFilterWidth:O,dilationDepth:T,dilationHeight:I,dilationWidth:S,inShape:e,outShape:ue,filterShape:t}},c1=(e,t,n,o,u,l)=>{let d=l==="channelsLast",c=d?e[0].dims[3]:e[0].dims[1],s=!1,r=[64,1,1],i={x:n.map((y,T)=>T)},a=[Math.ceil(lg(i.x.map(y=>n[y]))/r[0]),1,1];Se("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${a}`);let p=s?d&&c%4!==0?3:4:1,h=z.size(n),m=[{type:12,data:h},{type:12,data:o},{type:12,data:u},{type:12,data:t.strides},{type:12,data:t.dilations}];rn(t,m),m.push(...oe(e[0].dims,e[1].dims));let b=["rank","rank"],$=e.length===3;$&&(m.push(...oe(e[2].dims)),b.push("rank")),m.push(...oe(n));let v=y=>{let T=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:o.length},{name:"pads",type:"u32",length:u.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];nn(t,T);let I=s?4:1,S=Qe(e[0].dataType),A=B("x",e[0].dataType,e[0].dims.length,p===3?1:p),k=B("W",e[1].dataType,e[1].dims.length,I),O=[A,k],L=re("result",e[0].dataType,n.length,I),U="";if($){let N=B("bias",e[2].dataType,e[2].dims.length,I);O.push(N),U+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${s?`vec4<${S}>`:S} {
          return bias[${d?ne("coords",4,5):ne("coords",1,5)}${s?"/ 4":""}];
        }`}let Y=rt(p,S),q=tn(t,Y,S);return`
            ${U}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${A.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${k.getByIndices("aIndices")};
            }
          ${y.registerUniforms(T).declareVariables(...O,L)}
          ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${L.offsetToIndices("global_idx")};
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
              ${$?"value = value + getBiasByOutputCoords(coords)":""};
              ${q}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${d};${p};${$}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:a[0],y:a[1],z:a[2]},programUniforms:m}),getShaderSource:v}}}),p1,h1,LE=D(()=>{"use strict";ae(),ce(),pe(),un(),p1=(e,t,n,o)=>{let u=e.length>2,l=u?"value += b[output_channel];":"",d=e[0].dims,c=e[1].dims,s=t.format==="NHWC",r=s?n[3]:n[1],i=r/t.group,a=s&&i>=4?Ve(r):1,p=z.size(n)/a,h=[{type:12,data:p},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:i}];rn(t,h),h.push(...oe(d,[c[0],c[1],c[2],c[3]/a]));let m=u?["rank","rank","rank"]:["rank","rank"];h.push(...oe([n[0],n[1],n[2],n[3]/a]));let b=$=>{let v=re("output",e[0].dataType,n.length,a),y=Qe(v.type.tensor),T=tn(t,v.type.value,y),I=B("x",e[0].dataType,d.length),S=B("w",e[1].dataType,c.length,a),A=[I,S];u&&A.push(B("b",e[2].dataType,e[2].dims,a));let k=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];nn(t,k);let O=s?`
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
            let xVal = ${I.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${S.get("wHeight","wWidth","wInChannel","output_channel")};
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

            let xVal = ${I.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${S.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${$.registerUniforms(k).declareVariables(...A,v)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${v.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${s?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${s?1:2}], outputIndices[${s?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${a} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${s?2:1}];

    var value: ${v.type.value} = ${v.type.value}(0);
    ${O}
    ${l}
    ${T}
    ${v.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${a}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o?o(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:h}),getShaderSource:b}},h1=(e,t,n,o)=>{let u=e.length>2,l=Ve(n[3]),d=Ve(n[2]),c=z.size(n)/l/d,s=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/l],r=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/l],i=[n[0],n[1],n[2],n[3]/l],a=[{type:12,data:c},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];rn(t,a),a.push(...oe(s,r,i));let p=(d-1)*t.strides[1]+r[1],h=m=>{let b=re("output",e[0].dataType,i.length,l),$=Qe(b.type.tensor),v=tn(t,b.type.value,$),y=B("x",e[0].dataType,s.length,l),T=B("w",e[1].dataType,r.length,l),I=[y,T];u&&I.push(B("b",e[2].dataType,e[2].dims,l));let S=u?"value += b[output_channel];":"",A=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return nn(t,A),`
  ${m.registerUniforms(A).declareVariables(...I,b)}
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
          let w_val = ${T.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${d}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${d}u; i++) {
      var value = values[i];
      ${S}
      ${v}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${l};${d};${p};${r[0]};${r[1]}`,inputDependencies:u?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:o?o(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:a}),getShaderSource:h}}}),pg,uo,hg,lo,ul,ka,fg,mg,ll,jE=D(()=>{"use strict";ce(),BE(),FE(),Ul(),LE(),un(),jl(),xr(),pg=(e,t,n,o,u,l)=>{let d=e[0],c=e.slice(l?1:2,l?3:4),s=c.length,r=t[0],i=t.slice(2).map((p,h)=>p+(p-1)*(n[h]-1)),a=c.map((p,h)=>p+o[h]+o[h+s]).map((p,h)=>Math.floor((p-i[h]+u[h])/u[h]));return a.splice(0,0,d),a.splice(l?3:1,0,r),a},uo=[2,3,1,0],hg=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],o=e[1].dims[1]*t.group;if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let u=e[0].dims.length-2;if(t.dilations.length!==u)throw new Error(`dilations should be ${u}D`);if(t.strides.length!==u)throw new Error(`strides should be ${u}D`);if(t.pads.length!==u*2)throw new Error(`pads should be ${u*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},lo=(e,t)=>{let n=e.kernelShape.slice();n.length<t[1].dims.length-2&&n.push(...Array(t[1].dims.length-2-n.length).fill(0));for(let l=2;l<t[1].dims.length;++l)n[l-2]===0&&(n[l-2]=t[1].dims[l]);let o=e.pads.slice();Oo.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,n,o,e.format==="NHWC",e.autoPad);let u=Object.assign({},e);return Object.assign(u,{kernelShape:n,pads:o}),u},ul=e=>{let t=Bl(e),n=e.format,o=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],u=e.dilations,l=e.group,d=e.kernel_shape,c=e.pads,s=e.strides,r=e.w_is_const();return{autoPad:o,format:n,dilations:u,group:l,kernelShape:d,pads:c,strides:s,wIsConst:r,...t,cacheKey:`${e.format};${t.activation};`}},ka=(e,t,n,o)=>{let u=n.format==="NHWC",l=pg(t[0].dims,t[1].dims,n.dilations,n.pads,n.strides,u);if(n.group!==1){let A=[t[0]];if(u){let k=e.kernelCustomData.wT??e.compute(yt(t[1],uo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=k),A.push(k)}else A.push(t[1]);t.length===3&&A.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&u&&t[1].dims[0]===n.group&&t[1].dims[1]===1&&n.dilations[0]===1&&n.dilations[1]===1?e.compute(h1(A,n,l,o),{inputs:A}):e.compute(p1(A,n,l,o),{inputs:A});return}let d=t.length===3,c=t[0].dims[u?1:2],s=t[0].dims[u?2:3],r=t[0].dims[u?3:1],i=t[1].dims[2],a=t[1].dims[3],p=l[u?1:2],h=l[u?2:3],m=l[u?3:1],b=u&&i===c&&a===s&&n.pads[0]===0&&n.pads[1]===0;if(b||i===1&&a===1&&n.dilations[0]===1&&n.dilations[1]===1&&n.strides[0]===1&&n.strides[1]===1&&n.pads[0]===0&&n.pads[1]===0){let A=l[0],k,O,L,U=[];if(u){let N=e.kernelCustomData.wT??e.compute(yt(t[1],uo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];if(n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=N),b){let ue=c*s*r;k=t[0].reshape([1,A,ue]),O=N.reshape([1,ue,m]),L=[1,A,m]}else k=t[0].reshape([A,c*s,r]),O=N.reshape([1,r,m]),L=[A,p*h,m];U.push(k),U.push(O)}else k=t[0].reshape([A,r,c*s]),O=t[1].reshape([1,m,r]),L=[A,m,p*h],U.push(O),U.push(k);d&&U.push(t[2]);let Y=L[2],q=U[0].dims[U[0].dims.length-1];Y<8&&q<8?e.compute(Ll(U,n,l,L,u,o),{inputs:U}):e.compute(Ao(U,n,l,L,u,o),{inputs:U});return}let $=!0,v=e.kernelCustomData.wT??e.compute(yt(t[1],uo),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=v);let y=[t[0],v];d&&y.push(t[2]);let T=u?p*h:m,I=u?m:p*h,S=i*a*r;e.compute(l1(y,n,l,T,I,S,d,$,o),{inputs:y})},fg=(e,t)=>{let n=t.format==="NHWC",o=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&o.push(e.inputs[2]);let u=[0,t.pads[0],0,t.pads[1]],l=[1].concat(t.strides),d=[1].concat(t.dilations),c=[1].concat(t.kernelShape),s=lo({...t,pads:u,strides:l,dilations:d,kernelShape:c},o);ka(e,o,s,r=>n?[r[0],r[2],r[3]]:[r[0],r[1],r[3]])},mg=(e,t,n)=>{let o=n.format==="NHWC"?"channelsLast":"channelsFirst",u=lo(n,t),l=n.autoPad==="NOTSET"?n.pads:n.autoPad,d=d1(t[0].dims,t[1].dims,n.strides,n.dilations,l,!1,o);e.compute(c1(t,u,d.outShape,[d.filterDepth,d.filterHeight,d.filterWidth],[d.padInfo.front,d.padInfo.top,d.padInfo.left],o))},ll=(e,t)=>{if(hg(e.inputs,t),e.inputs[0].dims.length===3)fg(e,t);else if(e.inputs[0].dims.length===5)mg(e,e.inputs,t);else{let n=lo(t,e.inputs);ka(e,e.inputs,n)}}}),f1,UE=D(()=>{"use strict";ae(),er(),ce(),pe(),f1=(e,t,n)=>{let o=e.length>2,u=t.outputShape,l=t.format==="NHWC",d=t.group,c=e[1].dims,s=c[2]/d,r=c[3],i=l?Ve(s):1,a=l&&r===1&&s>=4,p=a?Math.floor(s/4)*4:Math.floor(s/i)*i,h=s-p,m=l?Ve(r):1,b=l?r===1?i:m:1,$=z.size(u)/m,v=[Math.ceil($/64),1,1];Se("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${v}`);let y=["rank","rank"],T=[t.strides[0],t.strides[1]],I=[t.kernelShape[l?1:2],t.kernelShape[l?2:3]],S=[t.dilations[0],t.dilations[1]],A=[I[0]+(t.dilations[0]<=1?0:(t.kernelShape[l?1:2]-1)*(t.dilations[0]-1)),I[1]+(t.dilations[1]<=1?0:(t.kernelShape[l?2:3]-1)*(t.dilations[1]-1))],k=[A[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),A[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],O=[{type:12,data:$},{type:12,data:T},{type:12,data:I},{type:12,data:S},{type:12,data:A},{type:6,data:k},{type:12,data:p},{type:12,data:s},{type:12,data:r},...oe(e[0].dims,e[1].dims)];o&&(O.push(...oe(e[2].dims)),y.push("rank")),O.push(...oe(u));let L=U=>{let Y=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:T.length},{name:"filter_dims",type:"u32",length:I.length},{name:"dilations",type:"u32",length:I.length},{name:"effective_filter_dims",type:"u32",length:A.length},{name:"pads",type:"i32",length:k.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],q=Qe(e[0].dataType),N=l?1:2,ue=l?2:3,w=l?3:1,C=B("W",e[1].dataType,e[1].dims.length,b),j=B("Dy",e[0].dataType,e[0].dims.length,i),H=[j,C];o&&H.push(B("bias",e[2].dataType,[u[w]].length,m));let V=re("result",e[0].dataType,u.length,m),J=()=>{let K="";if(a)i===4?K+=`
        let xValue = ${j.getByOffset("x_offset")};
        let wValue = ${C.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:i===2?K+=`
          dotProd = dotProd + dot(vec4<${q}>(${j.getByOffset("x_offset")}, ${j.getByOffset("x_offset + 1u")}), vec4<${q}>(${C.getByOffset("w_offset")}, ${C.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:i===1&&(K+=`
          dotProd = dotProd + dot(vec4<${q}>(${j.getByOffset("x_offset")}, ${j.getByOffset("x_offset + 1u")}, ${j.getByOffset("x_offset + 2u")}, ${j.getByOffset("x_offset + 3u")}), vec4<${q}>(${C.getByOffset("w_offset")}, ${C.getByOffset("w_offset + 1u")}, ${C.getByOffset("w_offset + 2u")}, ${C.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(K+=`
                  let xValue = ${l?j.getByOffset(`${j.indicesToOffset(`${j.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${i}`):j.get("batch","inputChannel","idyR","idyC")};
        `,i===1)K+=`
          let w_offset = ${C.indicesToOffset(`${C.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${C.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let G=0;G<i;G++)K+=`
            let wValue${G} = ${C.getByOffset(`${C.indicesToOffset(`${C.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${G}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${G}] * wValue${G};`;return K},M=()=>{if(h===0)return"";if(!a)throw new Error(`packInputAs4 ${a} is not true.`);let K="";if(i===1){K+="dotProd = dotProd";for(let G=0;G<h;G++)K+=`
            + ${j.getByOffset(`x_offset + ${G}`)} * ${C.getByOffset(`w_offset + ${G}`)}`;K+=";"}else if(i===2){if(h!==2)throw new Error(`Invalid inputChannelsRemainder ${h}.`);K+=`
          let xValue = ${j.getByOffset("x_offset")};
          let wValue = ${C.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return K},X=`
            let outputIndices = ${V.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${V.indicesGet("outputIndices",0)};
            let d1 = ${V.indicesGet("outputIndices",w)};
            let r = ${V.indicesGet("outputIndices",N)};
            let c = ${V.indicesGet("outputIndices",ue)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${V.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${q}(dyRCorner) + ${q}(wR)) / ${q}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${q}(uniforms.Dy_shape[${N}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${q}(dyCCorner) + ${q}(wC)) / ${q}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${q}(uniforms.Dy_shape[${ue}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${a?`
                var x_offset = ${j.indicesToOffset(`${j.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${i};
                var w_offset = ${C.indicesToOffset(`${C.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${a?4:i}) {
                  ${J()}
                  inputChannel = inputChannel + ${a?4:i};
                }
                ${M()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${o?` + bias[d1 / ${m}]`:""};
            ${V.setByOffset("global_idx","value")};
          `;return`
    ${U.registerUniforms(Y).declareVariables(...H,V)}
      ${U.mainStart()}
      ${U.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${X}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${i}${b}${m}${a}${h}`,inputDependencies:y},getRunData:()=>({dispatchGroup:{x:v[0],y:v[1],z:v[2]},outputs:[{dims:n?n(u):u,dataType:e[0].dataType}],programUniforms:O}),getShaderSource:L}}}),gg,bg,yg,Ca,m1,_g,Da,wg,g1,VE=D(()=>{"use strict";UE(),un(),xr(),gg=(e,t,n,o,u,l)=>(e-1)*t+n+(o-1)*u+1-l,bg=(e,t,n,o,u)=>{let l=Math.floor(e/2);t==="SAME_UPPER"?(n[o]=l,n[u]=e-l):t==="SAME_LOWER"&&(n[o]=e-l,n[u]=l)},yg=(e,t,n,o,u,l,d,c,s,r)=>{let i=e.length-2,a=r.length===0;s.length<i&&s.push(...Array(i-s.length).fill(0));let p=e[0],h=t[c?3:1]*u;for(let m=0,b=e.length-i-(c?1:0);m<i;++m,++b){let $=e[b],v=a?$*d[m]:r[m],y=gg($,d[m],l[m],t[b],n[m],v);bg(y,o,l,m,m+i),a&&r.push(d[m]*($-1)+s[m]+(t[b]-1)*n[m]+1-l[m]-l[m+i])}r.splice(0,0,p),r.splice(c?3:1,0,h)},Ca=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((a,p)=>a*p,1)===0){n.length=0;for(let a=2;a<t[1].dims.length;++a)n.push(t[1].dims[a])}let o=e.format==="NHWC";n.splice(0,0,t[1].dims[0]),n.splice(o?3:1,0,t[1].dims[1]);let u=e.pads.slice(),l=e.outputShape.slice(),d=e.outputPadding.slice(),c=t[0].dims,s=e.dilations.slice();if(s.reduce((a,p)=>a+p,0)===0){let a=t[0].dims.length-2;s=new Array(a).fill(1)}let r=e.strides.slice();if(r.reduce((a,p)=>a+p,0)===0){let a=t[0].dims.length-2;r=new Array(a).fill(1)}yg(c,n,s,e.autoPad,e.group,u,r,o,d,l);let i=Object.assign({},e);return Object.assign(i,{kernelShape:n,pads:u,outputPadding:d,outputShape:l,dilations:s,strides:r}),i},m1=e=>{let t=Bl(e),n=e.format,o=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],u=e.dilations,l=e.group??1,d=e.kernelShape,c=e.pads,s=e.strides,r=e.wIsConst(),i=e.outputPadding,a=e.outputShape;return{autoPad:o,format:n,dilations:u,group:l,kernelShape:d,outputPadding:i,outputShape:a,pads:c,strides:s,wIsConst:r,...t,cacheKey:`${e.format};${t.activation};`}},_g=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],o=e[1].dims[0];if(n!==o)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let u=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==u))throw new Error("invalid bias");let l=e[0].dims.length-2;if(t.dilations.reduce((d,c)=>d+c,0)>0&&t.dilations.length!==l)throw new Error(`dilations should be ${l}D`);if(t.strides.reduce((d,c)=>d+c,0)>0&&t.strides.length!==l)throw new Error(`strides should be ${l}D`);if(t.pads.reduce((d,c)=>d+c,0)>0&&t.pads.length!==l*2)throw new Error(`pads should be ${l*2}D`);if(t.outputPadding.length!==l&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${l}D`);if(t.kernelShape.reduce((d,c)=>d+c,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Da=(e,t,n,o)=>{let u=e.kernelCustomData.wT??e.compute(yt(t[1],[2,3,0,1]),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=u);let l=[t[0],u];t.length===3&&l.push(t[2]),e.compute(f1(l,n,o),{inputs:l})},wg=(e,t)=>{let n=t.format==="NHWC",o=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&o.push(e.inputs[2]);let u=t.kernelShape;(u.length===0||u[0]===0)&&(u=[e.inputs[1].dims[2]]);let l=t.dilations;(l.length===0||l[0]===0)&&(l=[1]);let d=t.strides;(d.length===0||d[0]===0)&&(d=[1]);let c=t.pads;c.length===0&&(c=[0,0]),c=[0,c[0],0,c[1]],d=[1].concat(d),l=[1].concat(l),u=[1].concat(u);let s=t.outputPadding;s=[0].concat(s);let r=Ca({...t,pads:c,strides:d,dilations:l,kernelShape:u,outputPadding:s},o);Da(e,o,r,i=>n?[i[0],i[2],i[3]]:[i[0],i[1],i[3]])},g1=(e,t)=>{if(_g(e.inputs,t),e.inputs[0].dims.length===3)wg(e,t);else{let n=Ca(t,e.inputs);Da(e,e.inputs,n)}}}),vg,b1,y1,GE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),vg=(e,t,n,o)=>{let u=z.size(t),l=t.length,d=B("input",e,l),c=re("output",e,l),s=n.dataType===6?n.getInt32Array()[0]:Number(n.getBigInt64Array()[0]),r=z.normalizeAxis(s,l),i=a=>{let p=` i32(${d.indicesGet("inputIndices","uniforms.axis")}) `,h=ne("uniforms.input_shape","uniforms.axis",l),m=o.reverse?p+(o.exclusive?" + 1":""):"0",b=o.reverse?h:p+(o.exclusive?"":" + 1");return`
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
                }`};return{name:"CumSum",shaderCache:{hint:o.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:[{type:12,data:u},{type:12,data:r},...oe(t,t)]}),getShaderSource:i}},b1=(e,t)=>{let n=e.inputs[0].dims,o=e.inputs[0].dataType,u=e.inputs[1];e.compute(vg(o,n,u,t),{inputs:[0]})},y1=e=>{let t=e.exclusive===1,n=e.reverse===1;return Pe({exclusive:t,reverse:n})}}),xg,$g,Tg,_1,w1,qE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),xg=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},$g=(e,t,n,o)=>{let u=[];u.push(`fn perm(i: ${o.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`);for(let l=0;l<t;++l)u.push(n.indicesSet("a",e[l],`i[${l}]`));return u.push("return a;}"),u.join(`
`)},Tg=(e,t)=>{let n,o,u,l,d,c,s=t.format==="NHWC",r=t.blocksize,i=t.mode==="DCR";s?([n,o,u,l]=e.dims,d=i?[n,o,u,r,r,l/r**2]:[n,o,u,l/r**2,r,r],c=i?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([n,o,u,l]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],d=i?[n,r,r,l/r**2,o,u]:[n,l/r**2,r,r,o,u],c=i?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let a=e.reshape(d),p=a.dims.length,h=e.dataType,m=B("a",h,p),b=re("output",h,p),$=v=>`
  ${v.registerUniform("output_size","u32").declareVariables(m,b)}

  ${$g(c,p,m,b)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:v=>{let y=s?[n,o*r,u*r,l/r**2]:[n,l/r**2,o*r,u*r],T=z.size(y),I=a.dims,S=z.sortBasedOnPerm(I,c);return{outputs:[{dims:y,dataType:v[0].dataType}],dispatchGroup:{x:Math.ceil(T/64)},programUniforms:[{type:12,data:T},...oe(I,S)]}},getShaderSource:$}},_1=(e,t)=>{xg(e.inputs),e.compute(Tg(e.inputs[0],t))},w1=e=>Pe({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Zt,Yn,co,Ra,lr,Sg,Ig,Og,Na,za,Ma,Eg,Ag,Ba,Pg,v1,x1,HE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Zt=256,Yn=512,co=2*Math.PI,Ra=e=>{let t=[],n=e;for(let o of[4,2,3,5])for(;n%o===0;)t.push(o),n/=o;return n===1?t:void 0},lr=e=>{let t=e.toPrecision(9);return/[.eE]/.test(t)?t:`${t}.0`},Sg=(e,t,n,o,u)=>{let l=n/e,d=Yn-o,c=r=>`smem[${d}u + base + ${r*t}u]`,s=`  for (var t = local_idx; t < ${l}u; t += ${Zt}u) {
`;s+=`    let twiddleIndex = t % ${t}u;
    let angleUnit = f32(twiddleIndex);
`,s+=`    var leg: array<vec2<f32>, 5>;
`;for(let r=0;r<e;r++){let i=`${o}u + t + ${r*l}u`;if(r===0)s+=`    leg[0] = smem[${i}];
`;else{let a=u*co*r/(e*t);s+=`    { let a = ${lr(a)} * angleUnit; leg[${r}] = cmul(smem[${i}], vec2<f32>(cos(a), sin(a))); }
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
`}else for(let r=0;r<e;r++){let i=["leg[0]"];for(let a=1;a<e;a++){let p=u*co*(a*r)/e,h=lr(Math.cos(p)),m=lr(Math.sin(p));i.push(`vec2<f32>(leg[${a}].x*${h} - leg[${a}].y*${m}, leg[${a}].x*${m} + leg[${a}].y*${h})`)}s+=`    ${c(r)} = ${i.join(" + ")};
`}return`${s}  }
  workgroupBarrier();
`},Ig=(e,t,n)=>{let o="",u=1,l=0;for(let d of e)o+=Sg(d,u,t,l,n),u*=d,l=Yn-l;return{code:o,resultOffset:l}},Og=(e,t,n,o,u)=>{let l=e.dims,d=l.length,c=l[d-1],s=l[t],r=n&&o?(s-1)*2:s;u!==void 0&&(r=u);let i=n&&o?1:2,a=o&&!n?Math.floor(r/2)+1:r,p=l.slice();p[t]=a,p[d-1]=i;let h=1;for(let b=t+1;b<d-1;b++)h*=l[b];let m=z.size(l)/c/s;return{dataType:e.dataType,outputDims:p,length:r,signalLength:s,inner:h,batch:m,inputComponents:c,outputComponents:i,outputLength:a,inverse:n,onesided:o}},Na=(e,t)=>[t,e.length,e.inputComponents,e.outputComponents,e.inverse,e.onesided].join(";"),za=e=>[{type:12,data:e.batch},{type:12,data:e.signalLength},{type:12,data:e.inner},{type:12,data:e.outputLength}],Ma=(e,t,n)=>e.registerUniform("batch","u32").registerUniform("signalLength","u32").registerUniform("inner","u32").registerUniform("outputLength","u32").declareVariables(t,n),Eg=e=>{let{dataType:t,length:n,inputComponents:o,outputComponents:u,inverse:l,onesided:d}=e,c=Je(t),s=l?1:-1,r=l?1/n:1,i=Ra(n),a=p=>{let h=B("x",t,[1]),m=re("y",t,[1]),b=S=>{let A=`inBase + (${S}) * uniforms.inner * ${o}u`,k=`f32(${h.getByOffset(A)})`,O=o===2?`f32(${h.getByOffset(`${A} + 1u`)})`:"0.0";return`vec2<f32>(${k}, ${O})`},$;if(l&&d){let S=Math.floor(n/2)+1,A=n%2===0?`select(provided, provided - 1u, provided == ${S}u)`:"provided";$=`
    let provided = min(uniforms.signalLength, ${S}u);
    for (var i = local_idx; i < ${n}u; i += ${Zt}u) {
      if (i < provided) { smem[i] = ${b("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();
    for (var k = local_idx + 1u; k < ${A}; k += ${Zt}u) {
      let h = smem[k];
      smem[${n}u - k] = vec2<f32>(h.x, -h.y);
    }
    workgroupBarrier();`}else $=`
    let loadCount = min(uniforms.signalLength, ${n}u);
    for (var i = local_idx; i < ${n}u; i += ${Zt}u) {
      if (i < loadCount) { smem[i] = ${b("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();`;let{code:v,resultOffset:y}=Ig(i,n,s),T=r===1?`smem[${y}u + i]`:`smem[${y}u + i] * ${lr(r)}`,I=u===2?m.setByOffset("off + 1u",`${c}(v.y)`):"";return`
  ${Ma(p,h,m)}
  var<workgroup> smem: array<vec2<f32>, ${2*Yn}>;
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${p.mainStart(Zt)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${o}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${u}u;
    ${$}
${v}    for (var i = local_idx; i < uniforms.outputLength; i += ${Zt}u) {
      let v = ${T};
      let off = outBase + i * uniforms.inner * ${u}u;
      ${m.setByOffset("off",`${c}(v.x)`)}
      ${I}
    }
  }`};return{name:"DFT",shaderCache:{hint:Na(e,"fft"),inputDependencies:["type"]},getShaderSource:a,getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:za(e),dispatchGroup:{x:e.batch}})}},Ag=e=>{let{dataType:t,length:n,inputComponents:o,outputComponents:u,inverse:l,onesided:d}=e,c=Je(t),s=l?1:-1,r=l?1/n:1,i=a=>{let p=B("x",t,[1]),h=re("y",t,[1]),m=T=>{let I=`inBase + (${T}) * uniforms.inner * ${o}u`,S=`f32(${p.getByOffset(I)})`,A=o===2?`f32(${p.getByOffset(`${I} + 1u`)})`:"0.0";return`vec2<f32>(${S}, ${A})`},b=l&&d?`fn spectrum(inBase: u32, k: u32) -> vec2<f32> {
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
  }`,$=`
      let angle = ${lr(s*co)} * f32(knMod) / ${lr(n)};
      acc += cmul(spectrum(inBase, n), vec2<f32>(cos(angle), sin(angle)));
      knMod += k;
      if (knMod >= ${n}u) { knMod -= ${n}u; }`,v=u===2?h.setByOffset("off + 1u",`${c}(v.y)`):"",y=r===1?"acc":`acc * ${lr(r)}`;return`
  ${Ma(a,p,h)}
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${b}
  ${a.mainStart(Zt)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${o}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${u}u;
    for (var k = local_idx; k < uniforms.outputLength; k += ${Zt}u) {
      var acc = vec2<f32>(0.0, 0.0);
      var knMod = 0u;
      for (var n = 0u; n < ${n}u; n++) {${$}
      }
      let v = ${y};
      let off = outBase + k * uniforms.inner * ${u}u;
      ${h.setByOffset("off",`${c}(v.x)`)}
      ${v}
    }
  }`};return{name:"DFT",shaderCache:{hint:Na(e,"direct"),inputDependencies:["type"]},getShaderSource:i,getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:za(e),dispatchGroup:{x:e.batch}})}},Ba=e=>{if(!e||e.dataType===0)return;if(z.size(e.dims)!==1)throw new Error("DFT optional scalar inputs must have exactly 1 element.");if(e.dataType===6)return e.getInt32Array()[0];let t=Number(e.getBigInt64Array()[0]);if(!Number.isSafeInteger(t))throw new Error("DFT optional scalar inputs are out of JavaScript safe integer range.");return t},Pg=e=>{if(!e||e.length<1)throw new Error("DFT requires at least 1 input.");let t=e[0].dims;if(t.length<2)throw new Error("DFT input must have at least 2 dimensions.");let n=t[t.length-1];if(n!==1&&n!==2)throw new Error("DFT input's innermost dimension must be 1 (real) or 2 (complex).")},v1=(e,t)=>{Pg(e.inputs);let n=e.inputs[0],o=n.dims.length,u=t.inverse!==0,l=t.onesided!==0,d=Ba(e.inputs[1]);if(d!==void 0&&d<=0)throw new Error("dft_length must be greater than zero.");let c=z.normalizeAxis(Ba(e.inputs[2])??t.axis,o);if(c===o-1)throw new Error("DFT axis must refer to a signal dimension, not the innermost (real/imaginary) dimension.");if(u&&l&&n.dims[o-1]!==2)throw new Error("Inverse one-sided DFT (IRFFT) requires complex-valued input (innermost dimension 2).");let s=Og(n,c,u,l,d);if(s.length<=0)throw new Error(`Invalid DFT length: ${s.length}`);let r=s.length<=Yn&&Ra(s.length)!==void 0?Eg(s):Ag(s);e.compute(r,{inputs:[0]})},x1=e=>Pe({axis:e.axis??1,inverse:e.inverse??0,onesided:e.onesided??0})}),po,Jn,Fa,kg,Cg,Dg,Rg,La,Ng,$1,T1,WE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),po="[a-zA-Z]|\\.\\.\\.",Jn="("+po+")+",Fa="^"+Jn+"$",kg="("+Jn+",)*"+Jn,Cg="^"+kg+"$",Dg=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let n=this.symbolToIndices.get(e);n===void 0?n=[t]:n.push(t),this.symbolToIndices.set(e,n)}},Rg=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[n,o]=t.includes("->")?t.split("->",2):[t,""];if(!n.match(RegExp(Cg)))throw new Error("Invalid LHS term");if(n.split(",").forEach((u,l)=>{let d=e[l].dims.slice();if(!u.match(RegExp(Fa)))throw new Error("Invalid LHS term");let c=this.processTerm(u,!0,d,l);this.lhs.push(c)}),o==="")o+=[...this.symbolToInfo.entries()].filter(([u,l])=>l.count===1||u==="...").map(([u])=>u).join("");else if(!o.match(RegExp(Jn)))throw new Error("Invalid RHS");o.match(RegExp(po,"g"))?.forEach(u=>{if(u==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let l=this.symbolToInfo.get(u);if(l===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(l.dimValue)}}),this.rhs=this.processTerm(o,!1,this.outputDims)}addSymbol(e,t,n){let o=this.symbolToInfo.get(e);if(o!==void 0){if(o.dimValue!==t&&o.count!==1)throw new Error("Dimension mismatch");o.count++,o.inputIndices.push(n)}else o={count:1,dimValue:t,inputIndices:[n]};this.symbolToInfo.set(e,o)}processTerm(e,t,n,o=-1){let u=n.length,l=!1,d=[],c=0;if(!e.match(RegExp(Fa))&&!t&&e!=="")throw new Error("Invalid LHS term");let s=e.match(RegExp(po,"g")),r=new Dg(o);return s?.forEach((i,a)=>{if(i==="..."){if(l)throw new Error("Only one ellipsis is allowed per input term");l=!0;let p=u-s.length+1;if(p<0)throw new Error("Ellipsis out of bounds");if(d=n.slice(c,c+p),this.hasEllipsis){if(this.ellipsisDims.length!==d.length||this.ellipsisDims.toString()!==d.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=d;else throw new Error("Ellipsis must be specified in the LHS");for(let h=0;h<d.length;h++){let m=String.fromCharCode(48+h);r.addSymbol(m,a+h),this.addSymbol(m,n[c++],o)}}else r.addSymbol(i,a+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(i,n[c++],o)}),r}},La=e=>e+"_max",Ng=(e,t,n,o)=>{let u=e.map(r=>r.length).map((r,i)=>B(`input${i}`,t,r)),l=z.size(o),d=re("output",t,o.length),c=[...n.symbolToInfo.keys()].filter(r=>!n.rhs.symbolToIndices.has(r)),s=r=>{let i=[],a="var prod = 1.0;",p="var sum = 0.0;",h="sum += prod;",m=[],b=[],$=[],v=[],y=n.symbolToInfo.size===n.rhs.symbolToIndices.size;n.symbolToInfo.forEach((I,S)=>{if(n.rhs.symbolToIndices.has(S)){let A=n.rhs.symbolToIndices.get(S)?.[0];A!==void 0&&n.lhs.forEach((k,O)=>{if(I.inputIndices.includes(O)){let L=k.symbolToIndices.get(S);if(L===void 0)throw new Error("Invalid symbol error");L.forEach(U=>{i.push(`${u[O].indicesSet(`input${O}Indices`,U,d.indicesGet("outputIndices",A))}`)})}})}else n.lhs.forEach((A,k)=>{if(I.inputIndices.includes(k)){let O=A.symbolToIndices.get(S);if(O===void 0)throw new Error("Invalid symbol error");O.forEach(L=>{m.push(`${u[k].indicesSet(`input${k}Indices`,L,`${S}`)}`)}),v.push(`prod *= ${u[k].getByIndices(`input${k}Indices`)};`)}}),b.push(`for(var ${S}: u32 = 0; ${S} < uniforms.${La(S)}; ${S}++) {`),$.push("}")});let T=y?[...i,`let sum = ${u.map((I,S)=>I.getByIndices(`input${S}Indices`)).join(" * ")};`]:[...i,p,...b,...m,a,...v,h,...$];return`
            ${r.registerUniforms(c.map(I=>({name:`${La(I)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...u,d)}

            ${r.mainStart()}
            ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${d.offsetToIndices("global_idx")};
            ${u.map((I,S)=>`var input${S}Indices: ${u[S].type.indices};`).join(`
`)}
            ${T.join(`
`)};
            ${d.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:n.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let r=c.filter(a=>n.symbolToInfo.has(a)).map(a=>({type:12,data:n.symbolToInfo.get(a)?.dimValue||0}));r.push({type:12,data:l});let i=e.map((a,p)=>[...oe(a)]).reduce((a,p)=>a.concat(p),r);return i.push(...oe(o)),{outputs:[{dims:o,dataType:t}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:i}},getShaderSource:s}},$1=(e,t)=>{let n=new Rg(e.inputs,t.equation),o=n.outputDims,u=e.inputs.map((l,d)=>l.dims);e.compute(Ng(u,e.inputs[0].dataType,n,o))},T1=e=>{let t=e.equation.replace(/\s+/g,"");return Pe({equation:t})}}),zg,ja,Mg,Bg,S1,KE=D(()=>{"use strict";ae(),ce(),pe(),zg=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),o=n.length<t.length?0:n.length-t.length,u=t.length<n.length?0:t.length-n.length;for(;o<n.length&&u<t.length;++o,++u)if(n[o]!==t[u]&&n[o]!==1&&t[u]!==1)throw new Error("Expand requires shape to be broadcastable to input")},ja=(e,t)=>{let n=e.length-t.length,o=[];for(let u=0;u<n;++u)o.push(e[u]);for(let u=0;u<t.length;++u)o.push(t[u]===1?e[u+n]:t[u]);return o},Mg=(e,t)=>e.length>t.length?ja(e,t):ja(t,e),Bg=e=>{let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),o=Mg(t,n),u=e[0].dataType,l=u===9||z.size(t)===1,d=u===9||t.length>0&&t[t.length-1]%4===0?4:1,c=l||o.length>0&&o[o.length-1]%4===0?4:1,s=Math.ceil(z.size(o)/c),r=a=>{let p=B("input",u,t.length,d),h=re("output",u,o.length,c),m;if(u===9){let b=($,v,y="")=>`
          let outputIndices${v} = ${h.offsetToIndices(`outputOffset + ${v}u`)};
          let offset${v} = ${p.broadcastedIndicesToOffset(`outputIndices${v}`,h)};
          let index${v} = offset${v} / 4u;
          let component${v} = offset${v} % 4u;
          ${$}[${v}] = ${y}(${p.getByOffset(`index${v}`)}[component${v}]);
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
    ${m}`},i=[{type:12,data:s},...oe(t,o)];return{name:"Expand",shaderCache:{hint:`${o.length};${d}${c}`,inputDependencies:["rank"]},getShaderSource:r,getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:i})}},S1=e=>{zg(e.inputs),e.compute(Bg(e.inputs),{inputs:[0]})}}),Fg,I1,XE=D(()=>{"use strict";ae(),ce(),pe(),Ml(),Fg=e=>{let t=e[0].dataType,n=z.size(e[0].dims),o=z.size(e[1].dims),u=o%4===0,l=d=>{let c=B("x",t,[1],4),s=B("bias",t,[1],4),r=re("y",t,[1],4),i=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],a=h=>`
      let bias${h}_offset: u32 = (global_idx * 4 + ${h}) % uniforms.bias_size;
      let bias${h} = ${s.getByOffset(`bias${h}_offset / 4`)}[bias${h}_offset % 4];`,p=u?`
      let bias = ${s.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${a(0)}${a(1)}${a(2)}${a(3)}
      let bias = ${c.type.value}(bias0, bias1, bias2, bias3);`;return`${d.registerUniforms(i).declareVariables(c,s,r)}

    ${il(Je(t))}

    ${d.mainStart(Tn)}
      ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${c.getByOffset("global_idx")};
      ${p}
      let x_in = x + bias;
      ${r.setByOffset("global_idx",ol("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${u}`,inputDependencies:["type","type"]},getShaderSource:l,getRunData:d=>({outputs:[{dims:d[0].dims,dataType:d[0].dataType}],programUniforms:[{type:12,data:Math.ceil(n/4)},{type:12,data:o}],dispatchGroup:{x:Math.ceil(n/Tn/4)}})}},I1=e=>{e.inputs.length<2||z.size(e.inputs[1].dims)===0?Gx(e):e.compute(Fg(e.inputs))}}),Lg,jg,O1,E1,ZE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Lg=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},jg=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n.length,l=z.normalizeAxis(t.axis,u),d=n.slice(0);d.splice(l,1,...o);let c=n[l],s=e[0].dataType===9?4:1,r=Math.ceil(z.size(d)/s),i=[{type:12,data:r},{type:6,data:c},{type:12,data:l},...oe(e[0].dims,e[1].dims,d)],a=p=>{let h=B("data",e[0].dataType,e[0].dims.length,s),m=B("inputIndices",e[1].dataType,e[1].dims.length),b=re("output",e[0].dataType,d.length,s),$=y=>{let T=o.length,I=`var indicesIndices${y}  = ${m.type.indices}(0);`;for(let S=0;S<T;S++)I+=`${T>1?`indicesIndices${y}[${S}]`:`indicesIndices${y}`} = ${d.length>1?`outputIndices${y}[uniforms.axis + ${S}]`:`outputIndices${y}`};`;I+=`
          var idx${y} = ${m.getByIndices(`indicesIndices${y}`)};
          if (idx${y} < 0) {
            idx${y} = idx${y} + uniforms.axisDimLimit;
          }
          var dataIndices${y} : ${h.type.indices};
        `;for(let S=0,A=0;S<u;S++)S===l?(I+=`${u>1?`dataIndices${y}[${S}]`:`dataIndices${y}`} = u32(idx${y});`,A+=T):(I+=`${u>1?`dataIndices${y}[${S}]`:`dataIndices${y}`} = ${d.length>1?`outputIndices${y}[${A}]`:`outputIndices${y}`};`,A++);return I},v;if(e[0].dataType===9){let y=(T,I,S="")=>`
          let outputIndices${I} = ${b.offsetToIndices(`outputOffset + ${I}u`)};
          ${$(I)};
          let offset${I} = ${h.indicesToOffset(`dataIndices${I}`)};
          let index${I} = offset${I} / 4u;
          let component${I} = offset${I} % 4u;
          ${T}[${I}] = ${S}(${h.getByOffset(`index${I}`)}[component${I}]);
        `;v=`
        let outputOffset = global_idx * ${s};
        var value = vec4<u32>(0);
        ${y("value",0,"u32")}
        ${y("value",1,"u32")}
        ${y("value",2,"u32")}
        ${y("value",3,"u32")}
        ${b.setByOffset("global_idx","value")}
      `}else v=`
      let outputIndices = ${b.offsetToIndices("global_idx")};
      ${$("")};
      let value = ${h.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${p.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,m,b)}
      ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${v}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:i}),getShaderSource:a}},O1=e=>Pe({axis:e.axis}),E1=(e,t)=>{let n=e.inputs;Lg(n),e.compute(jg(e.inputs,t))}}),Ug,A1,P1,YE=D(()=>{"use strict";ae(),ce(),pe(),Ug=(e,t,n,o,u,l,d,c,s)=>{let r=[{type:12,data:l},{type:12,data:o},{type:12,data:u},{type:12,data:n},{type:12,data:d},{type:12,data:c},{type:12,data:s}],i=[l];r.push(...oe(t.dims,i));let a=p=>{let h=B("indices_data",t.dataType,t.dims.length),m=re("input_slice_offsets_data",12,1,1),b=[h,m],$=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:u.length},{name:"sizes_from_slice_dims_data",type:"u32",length:n.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${p.registerUniforms($).declareVariables(...b)}
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
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${u.length}_${n.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:r}),getShaderSource:a},{inputs:[t],outputs:[-1]})[0]},A1=(e,t)=>{let n=e.inputs,o=n[0].dims,u=n[0].dataType,l=n[1].dims,d=l[l.length-1],c=z.sizeToDimension(l,l.length-1),s=z.sizeFromDimension(o,t.batchDims+d),r=z.sizeToDimension(o,t.batchDims),i=z.sizeFromDimension(o,t.batchDims),a=c/r,p=new Array(d),h=s;for(let I=0;I<d;++I)p[d-1-I]=h,h*=o[t.batchDims+d-1-I];let m=Ug(e,n[1],p,t.batchDims,o,c,a,i,d),b=t.batchDims+d;if(b>o.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let $=l.slice(0,-1).concat(o.slice(b)),v=z.size($),y=[{type:12,data:v},{type:12,data:s},...oe(n[0].dims,m.dims,$)],T=I=>{let S=B("data",n[0].dataType,n[0].dims.length),A=B("slice_offsets",12,m.dims.length),k=re("output",n[0].dataType,$.length);return`
          ${I.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(S,A,k)}
            ${I.mainStart()}
            ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:$,dataType:u}],dispatchGroup:{x:Math.ceil(v/64)},programUniforms:y}),getShaderSource:T},{inputs:[n[0],m]})},P1=e=>({batchDims:e.batch_dims,cacheKey:""})}),Vg,Gg,k1,C1,JE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Vg=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let n=z.normalizeAxis(t.quantizeAxis,e[0].dims.length),o=t.blockSize,u=e[0],l=e[2],d=e.length===4?e[3]:void 0;if(l.dims.length!==u.dims.length||!u.dims.map((c,s)=>s===n?Math.ceil(c/o)===l.dims[s]:c===l.dims[s]).reduce((c,s)=>c&&s,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(d){if(d.dataType!==u.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(d.dims.length!==l.dims.length||!d.dims.map((c,s)=>c===l.dims[s]).reduce((c,s)=>c&&s,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Gg=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n.length,l=z.normalizeAxis(t.gatherAxis,u),d=z.normalizeAxis(t.quantizeAxis,u),c=n.slice(0);c.splice(l,1,...o);let s=z.size(c),r=e[2].dataType,i=e[0].dataType===22,a=[{type:12,data:s},{type:12,data:d},{type:12,data:l},{type:12,data:t.blockSize},...oe(...e.map((h,m)=>h.dims),c)],p=h=>{let m=B("data",e[0].dataType,e[0].dims.length),b=B("inputIndices",e[1].dataType,e[1].dims.length),$=B("scales",e[2].dataType,e[2].dims.length),v=e.length>3?B("zeroPoint",e[3].dataType,e[3].dims.length):void 0,y=re("output",r,c.length),T=[m,b,$];v&&T.push(v);let I=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${h.registerUniforms(I).declareVariables(...T,y)}
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
        let quantize_axis_index = ${$.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${$.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${$.getByIndices("scale_indices")};
        ${v?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${v.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${v.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${i?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Je(r)}(quantized_data - zero_point) * scale;
        ${y.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((h,m)=>m!==1).map(h=>h.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(h,m)=>"rank")},getRunData:()=>({outputs:[{dims:c,dataType:r}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:a}),getShaderSource:p}},k1=(e,t)=>{let n=e.inputs;Vg(n,t),e.compute(Gg(e.inputs,t))},C1=e=>Pe({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),qg,Hg,D1,R1,QE=D(()=>{"use strict";ae(),ce(),Ge(),pe(),qg=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},Hg=(e,t)=>{let n=e[0].dims,o=e[0].dataType,u=n.length,l=e[1].dims,d=e[1].dataType,c=z.normalizeAxis(t.axis,u),s=n[c],r=l.slice(0),i=z.size(r),a=B("input",o,u),p=B("indicesInput",d,l.length),h=re("output",o,r.length),m=[{type:12,data:i},{type:6,data:s},{type:12,data:c}];return m.push(...oe(n,l,r)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:m}),getShaderSource:b=>`
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
  }`}},D1=e=>Pe({axis:e.axis}),R1=(e,t)=>{let n=e.inputs;qg(n),e.compute(Hg(e.inputs,t))}}),Wg,Kg,N1,z1,eA=D(()=>{"use strict";ae(),ce(),pe(),Wg=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},Kg=(e,t)=>{let n=e[0].dims.slice(),o=e[1].dims.slice(),[u,l,d]=Pv.getShapeOfGemmResult(n,t.transA,o,t.transB,e.length===3?e[2].dims:void 0),c=[u,l];if(!c)throw new Error("Can't use gemm on the given tensors");let s=16,r=Math.ceil(l/s),i=Math.ceil(u/s),a=!0,p=z.size(c),h=[{type:12,data:a?r:p},{type:12,data:u},{type:12,data:l},{type:12,data:d},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(h.push(...oe(e[2].dims)),m.push("rank")),h.push(...oe(c));let b=v=>{let y="";t.transA&&t.transB?y="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?y="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?y="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(y="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let T=t.alpha===1?"":"value *= uniforms.alpha;",I=B("a",e[0].dataType,e[0].dims),S=B("b",e[1].dataType,e[1].dims),A=I.type.value,k=null,O=[I,S];e.length===3&&(k=B("c",e[2].dataType,e[2].dims.length),O.push(k));let L=re("output",e[0].dataType,c.length);O.push(L);let U=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${v.registerUniforms(U).declareVariables(...O)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${A}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${y}
    }

    ${T}
    ${k!=null?`let cOffset = ${k.broadcastedIndicesToOffset("vec2(m, n)",L)}; value += ${A}(uniforms.beta) * ${k.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},$=v=>{let y=B("a",e[0].dataType,e[0].dims),T=B("b",e[1].dataType,e[1].dims),I=null,S=[y,T];e.length===3&&(I=B("c",e[2].dataType,e[2].dims.length),S.push(I));let A=re("output",e[0].dataType,c.length);S.push(A);let k=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],O="",L="";t.transA&&t.transB?(L=`
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
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,O="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(L=`
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
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,O="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(L=`
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
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,O="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(L=`
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
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,O="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let U=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${v.registerUniforms(k).declareVariables(...S)}
  var<workgroup> tile_a: array<array<${y.type.storage}, ${s}>, ${s}>;
  var<workgroup> tile_b: array<array<${T.type.storage}, ${s}>, ${s}>;
  ${v.mainStart([s,s,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${s};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${s};
    let num_tiles = (uniforms.K - 1) / ${s} + 1;
    var k_start = 0u;
    var value = ${A.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${L}
      k_start = k_start + ${s};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${s}; k++) {
        ${O}
      }
      workgroupBarrier();
    }

    ${U}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${I!=null?`let cOffset = ${I.broadcastedIndicesToOffset("vec2(m, n)",A)}; value += ${A.type.value}(uniforms.beta) * ${I.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return a?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:c,dataType:e[0].dataType}],dispatchGroup:{x:r*i},programUniforms:h}),getShaderSource:$}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:c,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:h}),getShaderSource:b}},N1=e=>{let t=e.transA,n=e.transB,o=e.alpha,u=e.beta;return{transA:t,transB:n,alpha:o,beta:u,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},z1=(e,t)=>{Wg(e.inputs),e.compute(Kg(e.inputs,t))}}),Lt,Yt,kr,Cr,Xg,Zg,Yg,Jg,Qg,eb,tb,rb,M1,B1,tA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),[Lt,Yt,kr,Cr]=[0,1,2,3],Xg=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Zg=`
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
`,Yg=e=>`
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
`,Jg=e=>`
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
     indices[${Yt}] = channel;`+(()=>{switch(n.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${kr}] = u32(r);
            indices[${Cr}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${kr}] = u32(clamp(r, 0, H - 1));
          indices[${Cr}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${kr}] = gs_reflect(r, border[1], border[3]);
          indices[${Cr}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${n.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,tb=(e,t,n)=>(()=>{switch(n.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Lt}], indices[${Yt}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Lt}], indices[${Yt}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Lt}], indices[${Yt}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Lt}], indices[${Yt}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Lt}], indices[${Yt}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Lt}], indices[${Yt}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${n.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,rb=(e,t)=>{let n=B("x",e[0].dataType,e[0].dims.length),o=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],u=B("grid",e[1].dataType,o.length,2),l=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(l=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Lt,Yt,kr,Cr]=[0,3,1,2]);let d=re("output",e[0].dataType,l.length),c=n.type.value,s=z.size(l),r=[{type:12,data:s},...oe(e[0].dims,o,l)],i=a=>`
  ${a.registerUniform("output_size","u32").declareVariables(n,u,d)}
  ${Zg}
  ${Yg(c)}
  ${Jg(t)}
  ${Qg(t)}
  ${eb(n,c,t)}

  ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${kr}]);
      let W_in = i32(uniforms.x_shape[${Cr}]);

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
      var grid_indices = vec3<u32>(indices[${Lt}], indices[${kr}], indices[${Cr}]);
      let nxy = ${u.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${tb(d,c,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:a=>{let p=z.size(l);return{outputs:[{dims:l,dataType:a[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:r}},getShaderSource:i}},M1=(e,t)=>{Xg(e.inputs),e.compute(rb(e.inputs,t))},B1=e=>Pe({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),ut,nb,F1,Ua,ib,di,L1,j1=D(()=>{"use strict";ae(),ce(),Ge(),Dl(),zl(),pe(),xr(),ut=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,nb=(e,t)=>{let n=e[0],o=ut(e,1),u=ut(e,2),l=ut(e,3),d=ut(e,4),c=ut(e,5),s=ut(e,6),r=ut(e,7);if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let i=n.dims[0],a=n.dims[1],p=n.dims.length===3?n.dims[2]:t.numHeads*n.dims[4],h=a,m=0,b=0,$=Math.floor(p/t.numHeads);if(s&&r&&z.size(s.dims)&&z.size(r.dims)){if(s.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims[0]!==i||s.dims[1]!==t.numHeads||s.dims[3]!==$)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(r.dims[0]!==i||r.dims[1]!==t.numHeads||r.dims[3]!==$)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(s.dims[2]!==r.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(r.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=s.dims[2],b=s.dims[2]}else if(s&&z.size(s.dims)||r&&z.size(r.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v;if(o&&z.size(o.dims)>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(o.dims.length<3||o.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(o.dims.length===3){if(o.dims[2]!==n.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');v=2,h=o.dims[1]}else if(o.dims.length===5){if(o.dims[2]!==t.numHeads||o.dims[3]!==2||o.dims[4]!==$)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(u)throw new Error('Expect "value" be none when "key" has packed kv format.');v=5,h=o.dims[1]}else{if(o.dims[1]!==t.numHeads||o.dims[3]!==$)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');v=0,h=o.dims[2]}}else{if(n.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(n.dims[2]!==t.numHeads||n.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}if(l&&z.size(l.dims)>0){if(l.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(o&&o.dims.length===5&&o.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let y=m+h,T=0;if(d&&z.size(d.dims)>0){T=8;let k=d.dims;throw k.length===1?k[0]===i?T=1:k[0]===3*i+2&&(T=3):k.length===2&&k[0]===i&&k[1]===y&&(T=5),T===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let I=!1,S=p;if(u&&z.size(u.dims)>0){if(u.dims.length!==3&&u.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==u.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(u.dims.length===3){if(h!==u.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');S=u.dims[2]}else{if(h!==u.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');S=u.dims[1]*u.dims[3],I=!0}}let A=!1;if(d&&z.size(d.dims)>0)throw new Error("Key padding mask is not supported");if(c&&z.size(c.dims)>0){if(c.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(c.dims[0]!==i||c.dims[1]!==t.numHeads||c.dims[2]!==a||c.dims[3]!==y)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:i,sequenceLength:a,pastSequenceLength:m,kvSequenceLength:h,totalSequenceLength:y,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:p,vHiddenSize:S,headSize:$,vHeadSize:Math.floor(S/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:T,scale:t.scale,broadcastResPosBias:A,passPastInKv:I,qkvFormat:v}},F1=e=>Pe({...e}),Ua=Pe({perm:[0,2,1,3]}),ib=(e,t,n,o,u,l,d)=>{let c=[o,u,l],s=z.size(c),r=[{type:12,data:s},{type:12,data:d},{type:12,data:l}],i=a=>{let p=re("qkv_with_bias",t.dataType,c),h=B("qkv",t.dataType,c),m=B("bias",n.dataType,c),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${a.registerUniforms(b).declareVariables(h,m,p)}
  ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:c,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:r}),getShaderSource:i},{inputs:[t,n],outputs:[-1]})[0]},di=(e,t,n,o,u,l,d,c)=>{let s=l;if(d&&z.size(d.dims)>0){if(o===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return s=ib(e,l,d,t,o,n*u,c),s=s.reshape([t,o,n,u]),n===1||o===1?s:e.compute(yt(s,Ua.perm),{inputs:[s],outputs:[-1]})[0]}else return l.dims.length===3&&(s=l.reshape([t,o,n,u])),n===1||o===1?s:e.compute(yt(s,Ua.perm),{inputs:[s],outputs:[-1]})[0]},L1=(e,t)=>{let n=nb(e.inputs,t),o=e.inputs[0],u=ut(e.inputs,1),l=ut(e.inputs,2),d=ut(e.inputs,3),c=ut(e.inputs,4),s=ut(e.inputs,5),r=ut(e.inputs,6),i=ut(e.inputs,7);if(o.dims.length===5)throw new Error("Packed QKV is not implemented");if(u?.dims.length===5)throw new Error("Packed KV is not implemented");let a=u&&l&&u.dims.length===4&&l.dims.length===4,p=di(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,o,d,0);if(a)return _i(e,p,u,l,c,void 0,r,i,s,n);if(!u||!l)throw new Error("key and value must be provided");let h=di(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.headSize,u,d,n.hiddenSize),m=di(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.vHeadSize,l,d,2*n.hiddenSize);_i(e,p,h,m,c,void 0,r,i,s,n)}}),ob,sb,ab,ub,dl,U1,V1,G1=D(()=>{"use strict";ae(),ce(),Ge(),pe(),ob=e=>{if(!e||e.length<1)throw new Error("too few inputs")},sb=(e,t)=>{let n=[],o=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(u=>n.push(Number(u))),o=n.length),Pe({numOutputs:o,axis:t.axis,splitSizes:n})},ab=e=>`
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
      }`},dl=(e,t)=>{let n=e[0].dims,o=z.size(n),u=e[0].dataType,l=z.normalizeAxis(t.axis,n.length),d=new Array(t.numOutputs),c=B("input",u,n.length),s=new Array(t.numOutputs),r=[],i=[],a=0,p=[{type:12,data:o}];for(let m=0;m<t.numOutputs;m++){a+=t.splitSizes[m],s[m]=a;let b=n.slice();b[l]=t.splitSizes[m],i.push(b),d[m]=re(`output${m}`,u,b.length),r.push({dims:i[m],dataType:e[0].dataType})}p.push({type:12,data:s},...oe(n,...i));let h=m=>`
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
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:h,getRunData:()=>({outputs:r,dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p})}},U1=(e,t)=>{ob(e.inputs);let n=e.inputs.length===1?t:sb(e.inputs,t);e.compute(dl(e.inputs,n),{inputs:[0]})},V1=e=>{let t=e.axis,n=e.splitSizes,o=e.numOutputs<0?n.length:e.numOutputs;if(o!==n.length)throw new Error("numOutputs and splitSizes length must be equal");return Pe({axis:t,numOutputs:o,splitSizes:n})}}),lb,Po,q1,H1=D(()=>{"use strict";ae(),ce(),Ge(),pe(),lb=(e,t)=>{let[n,o,u,l]=e,{numHeads:d,rotaryEmbeddingDim:c}=t;if(n.dims.length!==3&&n.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${n.dims.length}`);if(!z.areEqual(o.dims,[])&&!z.areEqual(o.dims,[1])&&o.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${o.dims.length}`);if(u.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${u.dims.length}`);if(l.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${l.dims.length}`);if(!z.areEqual(u.dims,l.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(c>0&&d===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let s=n.dims[0],r=n.dims[n.dims.length-2],i=u.dims[0],a=z.sizeFromDimension(n.dims,1)/r,p=c===0?u.dims[1]*2:a/d;if(c>p)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(o.dims.length===2){if(s!==o.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${o.dims[0]}`);if(r!==o.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${o.dims[1]}`)}if(r>i)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(p/2!==u.dims[1]&&c/2!==u.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${u.dims[1]}`)},Po=(e,t)=>{let{interleaved:n,numHeads:o,rotaryEmbeddingDim:u,scale:l}=t,d=e[0].dims[0],c=z.sizeFromDimension(e[0].dims,1),s=e[0].dims[e[0].dims.length-2],r=c/s,i=e[2].dims[1],a=u===0?i*2:r/o,p=new Array(d,s,r/a,a-i),h=z.computeStrides(p),m=[{type:1,data:l},{type:12,data:p},{type:12,data:h},...e[0].dims.length===3?new Array({type:12,data:[c,r,a,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[c,a,s*a,1]}):[],...oe(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=$=>{let v=B("input",e[0].dataType,e[0].dims.length),y=B("position_ids",e[1].dataType,e[1].dims.length),T=B("cos_cache",e[2].dataType,e[2].dims.length),I=B("sin_cache",e[3].dataType,e[3].dims.length),S=re("output",e[0].dataType,e[0].dims.length);return $.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:p.length},{name:"global_strides",type:"u32",length:h.length},{name:"input_output_strides",type:"u32",length:h.length}]),`
        ${$.declareVariables(v,y,T,I,S)}

        ${$.mainStart(Tn)}
          let half_rotary_emb_dim = uniforms.${T.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${y.broadcastedIndicesToOffset("bsnh.xy",re("",y.type.tensor,2))};
            let position_id =
                u32(${y.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${n});
            let j = i + select(half_rotary_emb_dim, 1, ${n});
            let re = ${v.getByOffset("i")} * ${T.get("position_id","bsnh[3]")} -
                ${v.getByOffset("j")} * ${I.get("position_id","bsnh[3]")};
            ${S.setByOffset("i","re")}
            let im = ${v.getByOffset("i")} * ${I.get("position_id","bsnh[3]")} +
                ${v.getByOffset("j")} * ${T.get("position_id","bsnh[3]")};
            ${S.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${S.setByOffset("k",v.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:Pe({interleaved:n}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(z.size(p)/Tn)},programUniforms:m})}},q1=(e,t)=>{lb(e.inputs,t),e.compute(Po(e.inputs,t))}}),db,cb,Va,pb,W1,rA=D(()=>{"use strict";Ge(),ae(),zl(),j1(),G1(),xr(),H1(),pe(),db=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let n=e[0],o=e[1],u=e[2],l=e[3],d=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=!1,s=n.dims[0],r=n.dims[1],i=n.dims.length===3?c?n.dims[2]/3:n.dims[2]:t.numHeads*n.dims[4],a=r,p=0,h=!o||o.dims.length===0,m=Math.floor(h?i/(t.numHeads+2*t.kvNumHeads):i/t.numHeads);h&&(i=m*t.numHeads);let b=l&&l.dims.length!==0,$=d&&d.dims.length!==0;if(b&&l.dims.length===4&&l.dims[0]===s&&l.dims[1]!==t.kvNumHeads&&l.dims[2]===t.kvNumHeads&&l.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&$){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');p=l.dims[2]}else if(b||$)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v=1;if(o&&o.dims.length>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(o.dims.length<3||o.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(o.dims.length===3){if(n.dims[2]%o.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');a=o.dims[1]}else if(o.dims.length===5){if(o.dims[2]!==t.numHeads||o.dims[3]!==2||o.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(u)throw new Error('Expect "value" be none when "key" has packed kv format.');a=o.dims[1]}else{if(o.dims[1]!==t.numHeads||o.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');a=o.dims[2]}}else{if(n.dims.length!==3&&n.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(n.dims.length===5&&(n.dims[2]!==t.numHeads||n.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}let y=0,T=!1,I=t.kvNumHeads?m*t.kvNumHeads:i;if(u&&u.dims.length>0){if(u.dims.length!==3&&u.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==u.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(u.dims.length===3){if(a!==u.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=u.dims[2]}else{if(a!==u.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');I=u.dims[1]*u.dims[3],T=!0}}let S=e.length>4?e[5]:void 0;if(S){if(S.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let A=S.dims.reduce((k,O)=>k*O,1);if(A!==s)throw new Error(`seqlens_k must have batch_size (${s}) elements, got ${A}.`);for(let k=0;k<S.dims.length;k++)if(S.dims[k]!==1&&S.dims[k]!==s)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${s}), got dims[${k}] = ${S.dims[k]}.`)}return{batchSize:s,sequenceLength:r,pastSequenceLength:p,kvSequenceLength:a,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:i,vHiddenSize:I,headSize:m,vHeadSize:Math.floor(I/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:T,qkvFormat:v}},cb=Pe({perm:[0,2,1,3]}),Va=(e,t,n)=>{let o=t,u=n.kvNumHeads;return t.dims.length===3&&n.kvSequenceLength!==0&&(o=t.reshape([n.batchSize,n.kvSequenceLength,u,n.headSize]),o=e.compute(yt(o,cb.perm),{inputs:[o],outputs:[-1]})[0]),o},pb=(e,t,n,o)=>{let u=7,l=["type","type"],d=[e*t],c=e*t,s=[{type:12,data:c},{type:12,data:t},{type:12,data:e}],r=i=>{let a=B("seq_lens",n.dataType,n.dims),p=B("total_seq_lens",o.dataType,o.dims),h=re("pos_ids",u,d),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:d,dataType:u}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:s}),getShaderSource:r}},W1=(e,t)=>{if(e.inputs.length>14&&e.inputs[14]||e.inputs.length>15&&e.inputs[15])throw new Error("GroupQueryAttention (JSEP): q_norm_weight / k_norm_weight inputs are not supported. The per-head Q/K RMS normalization prologue is implemented only on the CUDA and native WebGPU EPs.");let n=db(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let o=e.inputs[0],u=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,l=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,d=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,c=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,s=e.inputs.length>4?e.inputs[5]:void 0,r=e.inputs.length>5?e.inputs[6]:void 0,i=n.kvNumHeads?n.kvNumHeads:n.numHeads,a=Pe({axis:2,numOutputs:3,splitSizes:[n.numHeads*n.headSize,i*n.headSize,i*n.headSize]}),[p,h,m]=!u&&!l?e.compute(dl([o],a),{inputs:[o],outputs:[-1,-1,-1]}):[o,u,l],b,$;if(t.doRotary){let I=e.compute(pb(n.batchSize,n.sequenceLength,s,r),{inputs:[s,r],outputs:[-1]})[0],S=e.inputs[7],A=e.inputs[8],k=Pe({interleaved:t.rotaryInterleaved!==0,numHeads:n.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),O=[p,I,S,A],L=[-1];b=e.compute(Po(O,k),{inputs:O,outputs:L})[0],O.splice(0,1,h);let U=Pe({interleaved:t.rotaryInterleaved!==0,numHeads:n.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});$=e.compute(Po(O,U),{inputs:O,outputs:L})[0]}let v=di(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,t.doRotary?b:p,void 0,0),y=Va(e,t.doRotary?$:h,n),T=Va(e,m,n);_i(e,v,y,T,void 0,void 0,d,c,void 0,n,s,r)}}),Ga,hb,fb,K1,nA=D(()=>{"use strict";ae(),ce(),xr(),pe(),Ga=(e,t,n,o,u,l,d,c)=>{let s=Ve(l),r=s===1?"f32":`vec${s}f`,i=s===1?"vec2f":`mat2x${s}f`,a=u*d,p=64;a===1&&(p=256);let h=[u,d,l/s],m=[u,d,2],b=["rank","type","type"],$=[];$.push(...oe(h,m));let v=y=>{let T=B("x",t.dataType,3,s),I=B("scale",n.dataType,n.dims),S=B("bias",o.dataType,o.dims),A=re("output",1,3,2),k=[T,I,S,A];return`
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
      let value = ${r}(${T.get("batch","channel","h")});
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
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${s};${c};${p}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:a},programUniforms:$}),getShaderSource:v},{inputs:[t,n,o],outputs:[-1]})[0]},hb=(e,t,n)=>{let o=t[0].dims,u=o,l=2,d=o[0],c=o[1],s=z.sizeFromDimension(o,l),r=Ve(s),i=z.size(u)/r,a=Ga(e,t[0],t[1],t[2],d,s,c,n.epsilon),p=[d,c,s/r],h=[d,c],m=["type","none"],b=$=>{let v=B("x",t[0].dataType,p.length,r),y=B("scale_shift",1,h.length,2),T=re("output",t[0].dataType,p.length,r),I=[v,y,T];return`
  ${$.registerUniform("output_size","u32").declareVariables(...I)}
  ${$.mainStart()}
  ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${T.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${y.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${v.getByOffset("global_idx")} * ${T.type.value}(scale_shift.x) + ${T.type.value}(scale_shift.y);
      ${T.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${r}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:u,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},...oe(p,h,p)]}),getShaderSource:b},{inputs:[t[0],a]})},fb=(e,t,n)=>{let o=t[0].dims,u=o,l=o[0],d=o[o.length-1],c=z.sizeFromDimension(o,1)/d,s=Ve(d),r=z.size(u)/s,i=[{type:12,data:c},{type:12,data:Math.floor(d/s)}],a=["type","type"],p=!1,h=[0,o.length-1];for(let v=0;v<o.length-2;v++)p=p||o[v+1]!==1,h.push(v+1);p=p&&o[o.length-1]!==1;let m=p?e.compute(yt(e.inputs[0],h),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:o.length},(v,y)=>o[h[y]])),b=Ga(e,m,t[1],t[2],l,c,d,n.epsilon),$=v=>{let y=Qe(t[0].dataType),T=s===1?"vec2f":`mat${s}x2f`,I=k=>{let O=k===0?"x":"y",L=s===1?"f32":`vec${s}f`;switch(s){case 1:return`${y}(${L}(scale.${O}))`;case 2:return`vec2<${y}>(${L}(scale[0].${O}, scale[1].${O}))`;case 4:return`vec4<${y}>(${L}(scale[0].${O}, scale[1].${O}, scale[2].${O}, scale[3].${O}))`;default:throw new Error(`Not supported compoents ${s}`)}},S=B("input",t[0].dataType,t[0].dims,s),A=re("output",t[0].dataType,u,s);return`
  @group(0) @binding(0) var<storage, read> input : array<${S.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${T}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${A.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${v.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${I(0)}, ${I(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${s}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:u,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:i}),getShaderSource:$},{inputs:[t[0],b]})},K1=(e,t)=>{t.format==="NHWC"?fb(e,e.inputs,t):hb(e,e.inputs,t)}}),mb,gb,X1,iA=D(()=>{"use strict";ae(),ce(),pe(),mb=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},gb=(e,t,n)=>{let o=t.simplified,u=e[0].dims,l=e[1],d=!o&&e[2],c=u,s=z.normalizeAxis(t.axis,u.length),r=z.sizeToDimension(u,s),i=z.sizeFromDimension(u,s),a=z.size(l.dims),p=d?z.size(d.dims):0;if(a!==i||d&&p!==i)throw new Error(`Size of X.shape()[axis:] == ${i}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${a} and bias size of ${p}`);let h=[];for(let S=0;S<u.length;++S)S<s?h.push(u[S]):h.push(1);let m=Ve(i),b=["type","type"],$=[{type:12,data:r},{type:1,data:i},{type:12,data:Math.floor(i/m)},{type:1,data:t.epsilon}];d&&b.push("type");let v=n>1,y=n>2,T=S=>{let A=Qe(e[0].dataType),k=[B("x",e[0].dataType,e[0].dims,m),B("scale",l.dataType,l.dims,m)];d&&k.push(B("bias",d.dataType,d.dims,m)),k.push(re("output",e[0].dataType,c,m)),v&&k.push(re("mean_data_output",1,h)),y&&k.push(re("inv_std_output",1,h));let O=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${S.registerUniforms(O).declareVariables(...k)}
  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${tl("f32",m)};
    var mean_square_vector = ${tl("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${wn(A,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${wr("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${wr("mean_square_vector",m)} / uniforms.norm_size ${o?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${wn(A,m,"x[j + offset]")};
      let f32scale = ${wn(A,m,"scale[j]")};
      output[j + offset] = ${k[0].type.value}((f32input ${o?"":"- mean"}) * inv_std_dev * f32scale
        ${d?`+ ${wn(A,m,"bias[j]")}`:""}
      );
    }

    ${v?"mean_data_output[global_idx] = mean":""};
    ${y?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},I=[{dims:c,dataType:e[0].dataType}];return v&&I.push({dims:h,dataType:1}),y&&I.push({dims:h,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${n};${o}`,inputDependencies:b},getRunData:()=>({outputs:I,dispatchGroup:{x:Math.ceil(r/64)},programUniforms:$}),getShaderSource:T}},X1=(e,t)=>{mb(e.inputs),e.compute(gb(e.inputs,t,e.outputCount))}}),bb,Z1,oA=D(()=>{"use strict";ce(),jl(),Ul(),bb=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Z1=e=>{bb(e.inputs);let t=$n.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let n=t[t.length-1],o=e.inputs[0].dims[e.inputs[0].dims.length-1];if(n<8&&o<8)e.compute(Ll(e.inputs,{activation:""},t));else{let u=t[t.length-2],l=z.size(e.inputs[0].dims.slice(0,-2)),d=z.size(e.inputs[1].dims.slice(0,-2));if(l!==1&&u===1&&d===1){let c=e.inputs[0].reshape([1,l,o]),s=e.inputs[1].reshape([1,o,n]),r=[1,l,n],i=[c,s];e.compute(Ao(i,{activation:""},t,r),{inputs:i})}else e.compute(Ao(e.inputs,{activation:""},t))}}}),yb,_b,wb,Y1,J1,sA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),yb=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let n=e[0],o=n.dims.length;if(n.dims[o-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let u=Math.floor((t.k+t.blockSize-1)/t.blockSize),l=t.blockSize/8*t.bits,d=e[1];if(!z.areEqual(d.dims,[t.n,u,l]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let c=e[2].dims;if(z.size(c)!==t.n*u)throw new Error("scales input size error.");if(e.length===4){let s=e[3].dims,r=t.n*(t.bits===8?u:Math.floor((u*t.bits+7)/8));if(z.size(s)!==r)throw new Error("zeroPoints input size error.")}},_b=(e,t)=>{let n=e[0].dims,o=n.length,u=n[o-2],l=t.k,d=t.n,c=n.slice(0,o-2),s=z.size(c),r=e[1].dims[2]/4,i=e[0].dataType,a=Ve(t.k),p=Ve(r),h=Ve(d),m=c.concat([u,d]),b=u>1&&d/h%2===0?2:1,$=z.size(m)/h/b,v=64,y=[],T=[s,u,l/a],I=z.convertShape(e[1].dims).slice();I.splice(-1,1,r/p),y.push(...oe(T)),y.push(...oe(I)),y.push(...oe(e[2].dims)),e.length===4&&y.push(...oe(z.convertShape(e[3].dims)));let S=[s,u,d/h];y.push(...oe(S));let A=k=>{let O=T.length,L=B("a",e[0].dataType,O,a),U=B("b",12,I.length,p),Y=B("scales",e[2].dataType,e[2].dims.length),q=[L,U,Y],N=e.length===4?B("zero_points",12,e[3].dims.length):void 0;N&&q.push(N);let ue=S.length,w=re("output",e[0].dataType,ue,h),C=Qe(e[0].dataType),j=(()=>{switch(a){case 1:return`array<${C}, 8>`;case 2:return`mat4x2<${C}>`;case 4:return`mat2x4<${C}>`;default:throw new Error(`${a}-component is not supported.`)}})(),H=Math.floor(32/t.bits),V=Math.floor(H/8),J=()=>{let K="";for(let G=0;G<V;G++){let he=G*t.bits*4,de=he+t.bits;K+=`
          // reuse a data (pass ${G})
            var input_offset${G>0?G:""} = ${G===0?L.indicesToOffset(`${L.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${G>0?G:""}: ${j};
            for (var j${G>0?G:""}: u32 = 0; j${G>0?G:""} < ${8/a}; j${G>0?G:""}++) {
              a_data${G>0?G:""}[j${G>0?G:""}] = ${L.getByOffset(`input_offset${G>0?G:""}`)};
              input_offset${G>0?G:""}++;
            }
          `;for(let ye=0;ye<h*b;ye++)K+=`
            b_value = ${p===1?`b${ye}_data`:`b${ye}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${G*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${he}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${de}u) & b_mask);`}
            b_quantized_values = ${j}(${Array.from({length:4},(se,Q)=>`${C}(b_value_lower[${Q}]), ${C}(b_value_upper[${Q}])`).join(", ")});
            b_dequantized_values = ${a===1?`${j}(${Array.from({length:8},(se,Q)=>`(b_quantized_values[${Q}] - ${N?`zero_point${ye}`:"zero_point"}) * scale${ye}`).join(", ")});`:`(b_quantized_values - ${j}(${Array(8).fill(`${N?`zero_point${ye}`:"zero_point"}`).join(",")})) * scale${ye};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(ye/h)}]${h>1?`[${ye%h}]`:""} += ${Array.from({length:8/a},(se,Q)=>`${a===1?`a_data${G>0?G:""}[${Q}] * b_dequantized_values[${Q}]`:`dot(a_data${G>0?G:""}[${Q}], b_dequantized_values[${Q}])`}`).join(" + ")};
          `}return K},M=()=>{let K=`
            var col_index = col * ${h};
            ${N?`
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
            `;for(let G=0;G<h*b;G++)K+=`
            let scale${G} = ${Y.getByOffset("col_index * nBlocksPerCol + block")};
            ${N?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${N.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${G} = ${C}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return K},X=()=>{let K=`col_index = col * ${h};`;for(let G=0;G<h*b;G++)K+=`
            let b${G}_data = ${U.getByIndices(`${U.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return K+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${j};
            var b_dequantized_values: ${j};`,K};return`
        var<workgroup> workgroup_shared: array<${w.type.value}, ${b*v}>;
        ${k.declareVariables(...q,w)}
        ${k.mainStart([v,1,1])}
          let output_indices = ${w.offsetToIndices(`(global_idx / ${v}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${v}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/a};
            ${M()}
            for (var word: u32 = 0; word < ${r}; word += ${p}) {
              ${X()}
              for (var i: u32 = 0; i < ${p}; i++) {
                ${J()}
                word_offset += ${H/a};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${w.type.value} = ${w.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${v}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${w.setByIndices(`${w.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${a};${p};${h};${b};${v}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:i}],dispatchGroup:{x:$},programUniforms:y}),getShaderSource:A}},wb=(e,t)=>{let n=e[0].dims,o=n.length,u=n[o-2],l=t.k,d=t.n,c=n.slice(0,o-2),s=z.size(c),r=e[1].dims[2]/4,i=e[0].dataType,a=Ve(t.k),p=Ve(r),h=c.concat([u,d]),m=128,b=d%8===0?8:d%4===0?4:1,$=m/b,v=Math.floor(32/t.bits),y=$*p*v,T=y/a,I=y/t.blockSize,S=z.size(h)/b,A=[],k=[s,u,l/a],O=z.convertShape(e[1].dims).slice();O.splice(-1,1,r/p),A.push(...oe(k)),A.push(...oe(O)),A.push(...oe(e[2].dims)),e.length===4&&A.push(...oe(z.convertShape(e[3].dims)));let L=[s,u,d];A.push(...oe(L));let U=Y=>{let q=k.length,N=B("a",e[0].dataType,q,a),ue=B("b",12,O.length,p),w=B("scales",e[2].dataType,e[2].dims.length),C=[N,ue,w],j=e.length===4?B("zero_points",12,e[3].dims.length):void 0;j&&C.push(j);let H=L.length,V=re("output",e[0].dataType,H),J=Qe(e[0].dataType),M=()=>{switch(a){case 1:return`
          let a_data0 = vec4<${J}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${J}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${J}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${J}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${a}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${N.type.value}, ${T}>;
        var<workgroup> inter_results: array<array<${V.type.value}, ${$}>, ${b}>;
        ${Y.declareVariables(...C,V)}
        ${Y.mainStart([$,b,1])}
          let output_indices = ${V.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${I} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${T};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${T}; a_offset += ${m})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${N.getByIndices(`${N.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${N.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${I} + local_id.x;
            ${j?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${j.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${J}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${J}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${w.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${ue.getByIndices(`${ue.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/a};
            for (var i: u32 = 0; i < ${p}; i++) {
              let b_value = ${p===1?"b_data":"b_data[i]"};
              ${(()=>{let X=Math.floor(v/8),K="";for(let G=0;G<X;G++){let he=G*t.bits*4,de=he+t.bits;K+=`
              ${M()}
              {${t.bits===2?`
                let half_word = b_value >> ${G*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${he}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${de}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${J}>(${Array.from({length:4},(ye,se)=>`${J}(b_value_lower[${se}]), ${J}(b_value_upper[${se}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${J}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(ye,se)=>`${`dot(a_data${se}, b_dequantized_values[${se}])`}`).join(" + ")};
              }
              word_offset += ${8/a};`}return K})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${V.type.value} = ${V.type.value}(0);
            for (var b = 0u; b < ${$}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${V.setByIndices(`${V.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${a};${p};${$};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:h,dataType:i}],dispatchGroup:{x:S},programUniforms:A}),getShaderSource:U}},Y1=(e,t)=>{yb(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(wb(e.inputs,t)):e.compute(_b(e.inputs,t))},J1=e=>Pe(e)}),vb,xb,$b,Tb,Sb,Ib,Ob,Eb,Q1,aA=D(()=>{"use strict";ae(),ce(),pe(),vb=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},xb=(e,t,n)=>{let o="";for(let u=t-1;u>=0;--u)o+=`
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
          `},Ib=(e,t,n)=>{switch(n.mode){case 0:return xb(e,t,n.pads.length);case 1:return $b(e,t,n.pads.length);case 2:return Tb(e,t,n.pads.length);case 3:return Sb(e,t,n.pads.length);default:throw new Error("Invalid mode")}},Ob=(e,t)=>{let n=z.padShape(e[0].dims.slice(),t.pads),o=e[0].dims,u=z.size(n),l=[{type:12,data:u},{type:6,data:t.pads}],d=e.length>=3&&e[2].data;t.mode===0&&l.push({type:d?e[2].dataType:1,data:t.value}),l.push(...oe(e[0].dims,n));let c=["rank"],s=r=>{let i=re("output",e[0].dataType,n.length),a=B("x",e[0].dataType,o.length),p=a.type.value,h=Ib(i,o.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:d?p:"f32"}),`
            ${r.registerUniforms(m).declareVariables(a,i)}
            ${r.mainStart()}
            ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${i.offsetToIndices("global_idx")};

            var value = ${p}(0);
            ${h}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${d}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(z.size(n)/64)},programUniforms:l}),getShaderSource:s}},Eb=(e,t)=>{if(e.length>1){let n=e[1].getBigInt64Array(),o=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,u=e[0].dims.length,l=new Int32Array(2*u).fill(0);if(e.length>=4){let c=e[3].getBigInt64Array();for(let s=0;s<c.length;s++)l[Number(c[s])]=Number(n[s]),l[Number(c[s])+u]=Number(n[s+c.length])}else n.forEach((c,s)=>l[Number(s)]=Number(c));let d=[];return l.forEach(c=>d.push(c)),{mode:t.mode,value:o,pads:d}}else return t},Q1=(e,t)=>{vb(e.inputs);let n=Eb(e.inputs,t);e.compute(Ob(e.inputs,n),{inputs:[0]})}}),Qn,qa,Ha,Wa,Ka,Ab,Pb,Xa,Za,e2,t2,Ya,r2,n2,Ja,i2,o2,s2,a2,uA=D(()=>{"use strict";at(),ae(),ce(),pe(),Qn=e=>{if(fe.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},qa=(e,t,n)=>{let o=t.format==="NHWC",u=e.dims.slice();o&&u.splice(1,0,u.pop());let l=Object.hasOwnProperty.call(t,"dilations"),d=t.kernelShape.slice(),c=t.strides.slice(),s=l?t.dilations.slice():[],r=t.pads.slice();Oo.adjustPoolAttributes(n,u,d,c,s,r);let i=Oo.computePoolOutputShape(n,u,c,s,d,r,t.autoPad,t.ceilMode),a=Object.assign({},t);l?Object.assign(a,{kernelShape:d,strides:c,pads:r,dilations:s,cacheKey:t.cacheKey}):Object.assign(a,{kernelShape:d,strides:c,pads:r,cacheKey:t.cacheKey});let p=i.slice();return p.push(p.splice(1,1)[0]),[a,o?p:i]},Ha=(e,t)=>{let n=t.format==="NHWC",o=z.size(e),u=z.size(t.kernelShape),l=[{type:12,data:o},{type:12,data:u}],d=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let c=t.kernelShape[t.kernelShape.length-1],s=t.strides[t.strides.length-1],r=t.pads[t.pads.length/2-1],i=t.pads[t.pads.length-1],a=!!(r+i);l.push({type:12,data:c},{type:12,data:s},{type:12,data:r},{type:12,data:i}),d.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let p=!1;if(t.kernelShape.length===2){let h=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],$=t.pads[t.pads.length-2];p=!!(b+$),l.push({type:12,data:h},{type:12,data:m},{type:12,data:b},{type:12,data:$}),d.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[l,d,!0,a,p]}else{if(n)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let c=z.computeStrides(t.kernelShape);l.push({type:12,data:c},{type:12,data:t.pads},{type:12,data:t.strides}),d.push({name:"kernelStrides",type:"u32",length:c.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let s=t.pads.reduce((r,i)=>r+i);return[l,d,!!s,!1,!1]}},Wa=(e,t,n,o,u,l,d,c,s,r,i,a)=>{let p=u.format==="NHWC",h=t.type.value,m=re("output",t.type.tensor,o);if(u.kernelShape.length<=2){let b="",$="",v="",y=n-(p?2:1);if(i?b=`
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
                }`,u.kernelShape.length===2){let T=n-(p?3:2);a?$=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${T}] = indices[${T}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${T}] < 0 || xIndices[${T}] >= uniforms.x_shape[${T}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:$=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${T}] = indices[${T}] * uniforms.sh - uniforms.phStart + j;
                `,v=`
              }
            `}return`
            ${e.registerUniforms(s).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${h}(${c});
              var pad = 0;
              ${$}
              ${b}
              ${v}
              ${d}

              output[global_idx] = value;
            }`}else{if(p)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=u.kernelShape.length,$=u.pads.length,v="";return r?v=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${l}
              }`:v=`
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
                    + offsets[j - ${n-b}u] - ${ne("uniforms.pads","j - 2u",$)};
                  ${v}
              }
              ${d}

              output[global_idx] = value;
            }`}},Ka=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Ab=e=>`${Ka(e)};${e.countIncludePad}`,Pb=e=>`${Ka(e)};${e.storageOrder};${e.dilations}`,Xa=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Za=(e,t,n,o)=>{let[u,l]=qa(t,o,n),d=B("x",t.dataType,t.dims.length),c=d.type.value,s="value += x_val;",r="";u.countIncludePad?r+=`value /= ${c}(uniforms.kernelSize);`:r+=`value /= ${c}(i32(uniforms.kernelSize) - pad);`;let[i,a,p,h,m]=Ha(l,u);i.push(...oe(t.dims,l));let b=["rank"];return{name:e,shaderCache:{hint:`${o.cacheKey};${p};${h};${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:l,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(z.size(l)/64)},programUniforms:i}),getShaderSource:$=>Wa($,d,t.dims.length,l.length,u,s,r,0,a,p,h,m)}},e2=e=>{let t=e.count_include_pad!==0,n=Xa(e);if(n.ceilMode!==0)throw new Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding/divisor) is not yet implemented in the WebGPU AveragePool kernel");let o={countIncludePad:t,...n,cacheKey:""};return{...o,cacheKey:Ab(o)}},t2=(e,t)=>{Qn(e.inputs),e.compute(Za("AveragePool",e.inputs[0],!1,t))},Ya={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},r2=e=>{let t=e.format;return{format:t,...Ya,cacheKey:t}},n2=(e,t)=>{Qn(e.inputs),e.compute(Za("GlobalAveragePool",e.inputs[0],!0,t))},Ja=(e,t,n,o)=>{let[u,l]=qa(t,o,n),d=`
      value = max(x_val, value);
    `,c="",s=B("x",t.dataType,t.dims.length),r=["rank"],[i,a,p,h,m]=Ha(l,u);return i.push(...oe(t.dims,l)),{name:e,shaderCache:{hint:`${o.cacheKey};${p};${h};${m}`,inputDependencies:r},getRunData:()=>({outputs:[{dims:l,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(z.size(l)/64)},programUniforms:i}),getShaderSource:b=>Wa(b,s,t.dims.length,l.length,u,d,c,t.dataType===10?-65504:-1e5,a,p,h,m)}},i2=(e,t)=>{Qn(e.inputs),e.compute(Ja("MaxPool",e.inputs[0],!1,t))},o2=e=>{let t=e.storage_order,n=e.dilations,o=Xa(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(o.ceilMode!==0)throw new Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding) is not yet implemented in the WebGPU MaxPool kernel");let u={storageOrder:t,dilations:n,...o,cacheKey:""};return{...u,cacheKey:Pb(u)}},s2=e=>{let t=e.format;return{format:t,...Ya,cacheKey:t}},a2=(e,t)=>{Qn(e.inputs),e.compute(Ja("GlobalMaxPool",e.inputs[0],!0,t))}}),kb,Cb,u2,l2,lA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),kb=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((n,o)=>n===e[2].dims[o]).reduce((n,o)=>n&&o,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((u,l)=>l===t.axis||u===e[0].dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let n=e[0].dims[t.axis],o=e[1].dims[t.axis];if(t.blockSize<Math.ceil(n/o)||t.blockSize>Math.ceil(n/(o-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Cb=(e,t)=>{let n=z.normalizeAxis(t.axis,e[0].dims.length),o=e[0].dataType,u=o===3,l=e[0].dims,d=e[1].dataType,c=z.size(l),s=o===3||o===2,r=s?[Math.ceil(z.size(e[0].dims)/4)]:e[0].dims,i=e[1].dims,a=e.length>2?e[2]:void 0,p=a?s?[Math.ceil(z.size(a.dims)/4)]:a.dims:void 0,h=i.length===0||i.length===1&&i[0]===1,m=h===!1&&i.length===1,b=Ve(c),$=h&&(!s||b===4),v=$?b:1,y=$&&!s?b:1,T=B("input",s?12:o,r.length,y),I=B("scale",d,i.length),S=a?B("zero_point",s?12:o,p.length):void 0,A=re("output",d,l.length,v),k=[T,I];S&&k.push(S);let O=[r,i];a&&O.push(p);let L=[{type:12,data:c/v},{type:12,data:n},{type:12,data:t.blockSize},...oe(...O,l)],U=Y=>{let q=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${Y.registerUniforms(q).declareVariables(...k,A)}
      ${Y.mainStart()}
          ${Y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${A.offsetToIndices("global_idx")};

          // Set input x
          ${s?`
            let input = ${T.getByOffset("global_idx / 4")};
            let x_vec = ${u?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${v===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${T.getByOffset("global_idx")};`};

          // Set scale input
          ${h?`let scale_value= ${I.getByOffset("0")}`:m?`
            let scale_index = ${A.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${I.getByOffset("scale_index")};`:`
            var scale_indices: ${I.type.indices} = output_indices;
            let index = ${I.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${I.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${I.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${S?h?s?`
                let zero_point_input = ${S.getByOffset("0")};
                let zero_point_vec =  ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${S.getByOffset("0")}`:m?s?`
                let zero_point_index = ${A.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${S.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${A.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${S.getByOffset("zero_point_index")};`:s?`
                let zero_point_offset = ${I.indicesToOffset("scale_indices")};
                let zero_point_input = ${S.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${u?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${S.getByIndices("scale_indices")};`:`let zero_point_value = ${s?u?"i32":"u32":T.type.value}(0);`};
      // Compute and write output
      ${A.setByOffset("global_idx",`${A.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:S?["rank","rank","rank"]:["rank","rank"]},getShaderSource:U,getRunData:()=>({outputs:[{dims:l,dataType:d}],dispatchGroup:{x:Math.ceil(c/v/64),y:1,z:1},programUniforms:L})}},u2=(e,t)=>{kb(e.inputs,t),e.compute(Cb(e.inputs,t))},l2=e=>Pe({axis:e.axis,blockSize:e.blockSize})}),Db,Rb,d2,dA=D(()=>{"use strict";at(),ae(),pe(),Db=(e,t,n)=>{let o=e===t,u=e<t&&n<0,l=e>t&&n>0;if(o||u||l)throw new Error("Range these inputs' contents are invalid.")},Rb=(e,t,n,o)=>{let u=Math.abs(Math.ceil((t-e)/n)),l=[u],d=u,c=[{type:12,data:d},{type:o,data:e},{type:o,data:n},...oe(l)],s=r=>{let i=re("output",o,l.length),a=i.type.value,p=[{name:"outputSize",type:"u32"},{name:"start",type:a},{name:"delta",type:a}];return`
        ${r.registerUniforms(p).declareVariables(i)}
        ${r.mainStart()}
        ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${a}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${o}`},getShaderSource:s,getRunData:()=>({outputs:[{dims:l,dataType:o}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c})}},d2=e=>{let t=0,n=0,o=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],n=e.inputs[1].getInt32Array()[0],o=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],n=e.inputs[1].getFloat32Array()[0],o=e.inputs[2].getFloat32Array()[0]),fe.webgpu.validateInputContent&&Db(t,n,o),e.compute(Rb(t,n,o,e.inputs[0].dataType),{inputs:[]})}}),Nb,zb,c2,p2,cA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Nb=(e,t,n,o)=>{if(e!=="none"&&o!=="i32"&&o!=="u32"&&o!=="f32")throw new Error(`Input ${o} is not supported with reduction ${e}.`);let u=`{
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
                ${u}max(bitcast<f32>(oldValue), (${n}))${l}`;case"min":return o==="i32"||o==="u32"?`atomicMin(&${t}, bitcast<${o}>(${n}));`:`${u}min(bitcast<${o}>(oldValue), (${n}))${l}`;case"mul":return`${u}(bitcast<${o}>(oldValue) * (${n}))${l}`;default:throw new Error(`Reduction ${e} is not supported.`)}},zb=(e,t)=>{let n=e[0].dims,o=e[1].dims,u=n,l=1,d=Math.ceil(z.sizeToDimension(o,o.length-1)/l),c=o[o.length-1],s=z.sizeFromDimension(n,c),r=[{type:12,data:d},{type:12,data:c},{type:12,data:s},...oe(e[1].dims,e[2].dims,u)],i=a=>{let p=B("indices",e[1].dataType,e[1].dims.length),h=B("updates",e[2].dataType,e[2].dims.length,l),m=t.reduction!=="none"&&t.reduction!==""?Mv("output",e[0].dataType,u.length):re("output",e[0].dataType,u.length,l);return`
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

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:r}),getShaderSource:i}},c2=e=>Pe({reduction:e.reduction}),p2=(e,t)=>{e.compute(zb(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Mb,Bb,Fb,Qa,Lb,jb,Ub,Vb,Gb,qb,Hb,Wb,eu,Kb,Xb,Zb,Yb,Jb,h2,f2,pA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),Mb=(e,t)=>{if(e.every(n=>n>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Bb=(e,t,n)=>{t.every(u=>u>=0&&u<n||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let o=new Array(n).fill(1);return t.forEach((u,l)=>o[u]=e[l]),o},Fb=(e,t,n,o,u,l)=>{let[d,c,s]=n>10?[1,2,3]:[-1,e.length>1?1:-1,-1],r=e[0].dims.length;if(d>0&&e.length>d&&e[d].dims.length>0)e[d].getFloat32Array().forEach(i=>l.push(i));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(c>0&&e.length>c&&e[c].dims.length===1&&e[c].dims[0]>0){if(e[c].getFloat32Array().forEach(i=>o.push(i)),o.length!==0&&o.length!==r&&n>=18&&o.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Mb(o,t),t.axes.length>0&&Bb(o,t.axes,r).forEach((i,a)=>o[a]=i)}if(s>0&&e.length>s&&e[s].dims.length===1&&e[s].dims[0]>0&&(e[s].getBigInt64Array().forEach(i=>u.push(Number(i))),u.length!==0&&u.length!==r&&n>=18&&u.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(o.length!==0&&o.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(u.length!==0&&u.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof o<"u"&&typeof u<"u"&&o.length>0&&u.length>r)throw new Error("Resize requires only of scales or sizes to be specified")},Qa=(e,t,n,o)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${o}(big / (${n}));
  let fract = ${o}(big % (${n})) / ${o}(${n});
  return whole + fract;
`,Lb=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Qa("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Qa("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",jb=(e,t,n)=>`fn getNearestPixelFromOriginal(xOriginal: ${n}, isDownSample: bool) -> ${n} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Ub=(e,t,n)=>{let o=new Array(n).fill(0).concat(new Array(n).fill(1)),u=e.length===0?o:e.slice();return t.length>0?(t.forEach((l,d)=>{o[l]=u[d],o[d+n]=u[t.length+d]}),o):u},Vb=(e,t,n,o)=>{let u=[];if(n.length>0)if(o.length>0){if(e.forEach(l=>u.push(l)),Math.max(...o)>e.length)throw new Error("axes is out of bound");o.forEach((l,d)=>u[l]=n[d])}else n.forEach(l=>u.push(l));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");u=e.map((l,d)=>Math.round(l*t[d]))}return u},Gb=(e,t,n)=>{let o=(()=>{switch(n.keepAspectRatioPolicy){case"not_larger":return n.axes.length>0?Math.min(...n.axes.map(l=>t[l]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return n.axes.length>0?Math.max(...n.axes.map(l=>t[l]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${n.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let u=e.slice();return n.axes.length>0?(n.axes.forEach(l=>t[l]=o),n.axes.forEach(l=>u[l]=Math.round(e[l]*t[l]))):(t.fill(o,0,t.length),u.forEach((l,d)=>u[d]=Math.round(l*t[d]))),u},qb=(e,t,n,o,u)=>`
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
    }`,eu=(e,t,n,o)=>e.rank>o?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",n,"batch")};
`:"",Kb=(e,t,n,o,u)=>{let[l,d,c,s]=n.length===2?[-1,0,1,-1]:[0,2,3,1],r=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${r} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",d,`max(0, min(row, ${n[d]} - 1))`)};
      ${e.indicesSet("input_indices",c,`max(0, min(col, ${n[c]} - 1))`)};
      ${eu(e,s,l,2)}
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
    }`},Xb=(e,t,n,o,u,l,d,c,s,r)=>{let i=n.length===2,a=!0,[p,h]=i?[0,1]:a?[2,3]:[1,2],m=e.type.value,b=$=>{let v=$===p?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${m} {
        var output_index = ${t.indicesGet("output_indices",$)};
        var originalIdx: ${m} = getOriginalCoordinateFromResizedCoordinate(output_index, ${u[$]},
        ${o[$]}, ${n[$]}, ${l[$]}, ${l[$]} + ${n.length});
        var fractOriginalIdx: ${m} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${c} && (originalIdx < 0 || originalIdx > (${n[$]} - 1))) {
          return ${s};
        }
        var data: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${m} = originalIdx + ${m}(i);
          if (${v} < 0 || ${v} >= ${n[$]}) {
            ${r?`coefs[i + 1] = 0.0;
                        continue;`:c?`return ${s};`:`${v} = max(0, min(${v}, ${n[$]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",$,`u32(${v})`)};
          data[i + 1] = ${$===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
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
      ${eu(e,r,l,3)}
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
    }`},Yb=(e,t,n,o,u,l)=>{let d=e.dims,c=Ub(l,t.axes,d.length),s=Vb(d,o,u,t.axes),r=o.slice();o.length===0&&(r=d.map((y,T)=>y===0?1:s[T]/y),t.keepAspectRatioPolicy!=="stretch"&&(s=Gb(d,r,t)));let i=re("output",e.dataType,s.length),a=B("input",e.dataType,d.length),p=z.size(s),h=d.length===s.length&&d.every((y,T)=>y===s[T]),m=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,$=a.type.value,v=y=>`
      ${h?"":`
      ${Lb(t.coordinateTransformMode,$)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Wb(a,d)};
              ${jb(t.nearestMode,n,$)};
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
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${n}|${r.length>0?t.mode==="cubic"?r:r.length:""}|${u.length>0?u:""}|${c.length>0?c:""}|${h}|${t.mode==="nearest"?d.length:d}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[{dims:s,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},{type:1,data:r},{type:1,data:c},...oe(d,s)]})}},Jb=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},h2=(e,t)=>{let n=[],o=[],u=[],l=Jb(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Fb(e.inputs,t,l,n,o,u),e.compute(Yb(e.inputs[0],t,l,n,o,u),{inputs:[0]})},f2=e=>{let t=e.antialias,n=e.axes,o=e.coordinateTransformMode,u=e.cubicCoeffA,l=e.excludeOutside!==0,d=e.extrapolationValue,c=e.keepAspectRatioPolicy,s=e.mode,r=e.nearestMode===""?"simple":e.nearestMode;return Pe({antialias:t,axes:n,coordinateTransformMode:o,cubicCoeffA:u,excludeOutside:l,extrapolationValue:d,keepAspectRatioPolicy:c,mode:s,nearestMode:r})}}),Qb,ey,m2,hA=D(()=>{"use strict";ae(),ce(),pe(),Qb=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],n=e[1],o=e[2];if(t.dataType!==n.dataType||t.dataType!==o.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(n.dims.length!==3&&n.dims.length!==2)throw new Error("Skip must be 2D or 3D");let u=t.dims[t.dims.length-1],l=t.dims[t.dims.length-2];if(n.dims[n.dims.length-1]!==u)throw new Error("Skip must have the same hidden size as input");if(n.dims[n.dims.length-2]!==l)throw new Error("Skip must have the same sequence length as input");if(o.dims.length!==1)throw new Error("Gamma must be 1D");if(o.dims[o.dims.length-1]!==u)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let d=e[3];if(d.dims.length!==1)throw new Error("Beta must be 1D");if(d.dims[d.dims.length-1]!==u)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let d=e[4];if(d.dims.length!==1)throw new Error("Bias must be 1D");if(d.dims[d.dims.length-1]!==u)throw new Error("Bias must have the same hidden size as input")}},ey=(e,t,n,o)=>{let u=t.simplified,l=e[0].dims,d=z.size(l),c=l,s=d,r=l.slice(-1)[0],i=o?l.slice(0,-1).concat(1):[],a=!u&&e.length>3,p=e.length>4,h=o&&n>1,m=o&&n>2,b=n>3,$=64,v=Ve(r),y=[{type:12,data:s},{type:12,data:v},{type:12,data:r},{type:1,data:t.epsilon}],T=S=>{let A=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],k=[B("x",e[0].dataType,e[0].dims,v),B("skip",e[1].dataType,e[1].dims,v),B("gamma",e[2].dataType,e[2].dims,v)];a&&k.push(B("beta",e[3].dataType,e[3].dims,v)),p&&k.push(B("bias",e[4].dataType,e[4].dims,v)),k.push(re("output",e[0].dataType,c,v)),h&&k.push(re("mean_output",1,i)),m&&k.push(re("inv_std_output",1,i)),b&&k.push(re("input_skip_bias_sum",e[0].dataType,c,v));let O=Qe(e[0].dataType),L=Qe(1,v);return`

      ${S.registerUniforms(A).declareVariables(...k)}
      var<workgroup> sum_shared : array<${L}, ${$}>;
      var<workgroup> sum_squared_shared : array<${L}, ${$}>;

      ${S.mainStart([$,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${$};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${$};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${$-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${p?"bias[offset1d + i]":O+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${b?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${wn(O,v,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${$};
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
        let mean = ${wr("sum",v)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${wr("square_sum",v)} / f32(uniforms.hidden_size) ${u?"":"- mean * mean"} + uniforms.epsilon);
        ${h?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${u?"":`- ${O}(mean)`}) *
            ${O}(inv_std_dev) * gamma[offset1d + i]
            ${a?"+ beta[offset1d + i]":""};
        }
      }`},I=[{dims:c,dataType:e[0].dataType}];return n>1&&I.push({dims:i,dataType:1}),n>2&&I.push({dims:i,dataType:1}),n>3&&I.push({dims:l,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${v};${h};${m};${b}`,inputDependencies:e.map((S,A)=>"type")},getShaderSource:T,getRunData:()=>({outputs:I,dispatchGroup:{x:Math.ceil(s/r)},programUniforms:y})}},m2=(e,t)=>{Qb(e.inputs);let n=[0];e.outputCount>1&&n.push(-3),e.outputCount>2&&n.push(-3),e.outputCount>3&&n.push(3),e.compute(ey(e.inputs,t,e.outputCount,!1),{outputs:n})}}),ty,ei,ry,tu,ny,iy,g2,b2,fA=D(()=>{"use strict";ae(),ce(),Ge(),pe(),ty=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((n,o)=>{if(e[o+1].dataType!==6&&e[o+1].dataType!==7)throw new Error(`Input ${o} must be an array of int32 or int64`)})},ei=(e,t)=>{let n=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(o=>n.push(Number(o)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(o=>n.push(Number(o)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return n},ry=(e,t)=>{if(e.length>1){let n=ei(e,1),o=ei(e,2),u=ei(e,3);return u.length===0&&(u=[...Array(e[0].dims.length).keys()]),Pe({starts:n,ends:o,axes:u})}else return t},tu=(e,t,n,o,u)=>{let l=e;return e<0&&(l+=n[o[t]]),u[t]<0?Math.max(0,Math.min(l,n[o[t]]-1)):Math.max(0,Math.min(l,n[o[t]]))},ny=(e,t,n)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
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
      }`,iy=(e,t)=>{let n=e[0].dims,o=z.size(n),u=t.axes.length>0?z.normalizeAxes(t.axes,n.length):[...Array(n.length).keys()],l=ei(e,4);l.forEach(v=>v!==0||(()=>{throw new Error("step cannot be 0")})),l.length===0&&(l=Array(u.length).fill(1));let d=t.starts.map((v,y)=>tu(v,y,n,u,l)),c=t.ends.map((v,y)=>tu(v,y,n,u,l));if(u.length!==d.length||u.length!==c.length)throw new Error("start, ends and axes should have the same number of elements");if(u.length!==n.length)for(let v=0;v<n.length;++v)u.includes(v)||(d.splice(v,0,0),c.splice(v,0,n[v]),l.splice(v,0,1));let s=l.map(v=>Math.sign(v));l.forEach((v,y,T)=>{if(v<0){let I=(c[y]-d[y])/v,S=d[y],A=S+I*l[y];d[y]=A,c[y]=S,T[y]=-v}});let r=n.slice(0);u.forEach((v,y)=>{r[v]=Math.ceil((c[v]-d[v])/l[v])});let i={dims:r,dataType:e[0].dataType},a=re("output",e[0].dataType,r.length),p=B("input",e[0].dataType,e[0].dims.length),h=z.size(r),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:d.length},{name:"signs",type:"i32",length:s.length},{name:"steps",type:"u32",length:l.length}],b=[{type:12,data:h},{type:12,data:d},{type:6,data:s},{type:12,data:l},...oe(e[0].dims,r)],$=v=>`
      ${v.registerUniforms(m).declareVariables(p,a)}
        ${ny(p,a,n)}
        ${v.mainStart()}
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${a.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${a.setByOffset("global_idx",p.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${s.length}_${d.length}_${l.length}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[i],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:b})}},g2=(e,t)=>{ty(e.inputs,t);let n=ry(e.inputs,t);e.compute(iy(e.inputs,n),{inputs:[0]})},b2=e=>{let t=e.starts,n=e.ends,o=e.axes;return Pe({starts:t,ends:n,axes:o})}}),oy,sy,y2,_2,mA=D(()=>{"use strict";ae(),ce(),Ge(),xr(),pe(),oy=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},sy=(e,t)=>{let n=e.inputs[0],o=n.dims,u=z.size(o),l=o.length,d=z.normalizeAxis(t.axis,l),c=d<o.length-1,s,r=[];c?(r=Array.from({length:l},(k,O)=>O),r[d]=l-1,r[l-1]=d,s=e.compute(yt(n,r),{inputs:[n],outputs:[-1]})[0]):s=n;let i=s.dims,a=i[l-1],p=u/a,h=Ve(a),m=a/h,b=64;p===1&&(b=256);let $=(k,O)=>O===4?`max(max(${k}.x, ${k}.y), max(${k}.z, ${k}.w))`:O===2?`max(${k}.x, ${k}.y)`:O===3?`max(max(${k}.x, ${k}.y), ${k}.z)`:k,v=B("x",s.dataType,s.dims,h),y=re("result",s.dataType,s.dims,h),T=v.type.value,I=Qe(s.dataType)==="f32"?`var threadMax = ${T}(-3.4028234663852886e+38f);`:`var threadMax = ${T}(-65504.0h);`,S=k=>`
      var<workgroup> rowMaxShared : ${T};
      var<workgroup> rowSumShared : ${T};
      var<workgroup> threadShared : array<${T}, ${b}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${T} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${T}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${k.registerUniform("packedCols","i32").declareVariables(v,y)}
      ${k.mainStart(b)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${b};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${I}
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
          rowMaxShared = ${T}(${$("threadShared[0]",h)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${T}(0.0);
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
          rowSumShared = ${T}(${wr("threadShared[0]",h)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${T}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,A=e.compute({name:"Softmax",shaderCache:{hint:`${h};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:i,dataType:s.dataType}],dispatchGroup:{x:p},programUniforms:[{type:6,data:m}]}),getShaderSource:S},{inputs:[s],outputs:[c?-1:0]})[0];c&&e.compute(yt(A,r),{inputs:[A]})},y2=(e,t)=>{oy(e.inputs),sy(e,t)},_2=e=>Pe({axis:e.axis})}),ru,ay,uy,ly,w2,gA=D(()=>{"use strict";ae(),ce(),pe(),ru=e=>Array.from(e.getBigInt64Array(),Number),ay=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(ru(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},uy=(e,t)=>{let n=[];for(let o=0;o<e.length;++o)n.push(e[o]*t[o]);return n},ly=(e,t)=>{let n=e[0].dims,o=t??ru(e[1]),u=uy(n,o),l=z.size(u),d=e[0].dataType,c=B("input",d,n.length),s=re("output",d,u.length),r=i=>`
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
    }`;return{name:"Tile",shaderCache:{hint:`${o}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:[{type:12,data:l},...oe(e[0].dims,u)]}),getShaderSource:r}},w2=e=>{ay(e.inputs),e.compute(ly(e.inputs),{inputs:[0]})}}),dy,cy,v2,bA=D(()=>{"use strict";ae(),ce(),pe(),dy=(e,t,n,o,u)=>{let l=re("output_data",u,n.length,4),d=B("a_data",t[1].dataType,t[1].dims.length,4),c=B("b_data",t[2].dataType,t[2].dims.length,4),s=B("c_data",t[0].dataType,t[0].dims.length,4),r,i=(a,p,h)=>`select(${p}, ${a}, ${h})`;if(!o)r=l.setByOffset("global_idx",i(d.getByOffset("global_idx"),c.getByOffset("global_idx"),s.getByOffset("global_idx")));else{let a=(p,h,m="")=>{let b=`a_data[index_a${h}][component_a${h}]`,$=`b_data[index_b${h}][component_b${h}]`,v=`bool(c_data[index_c${h}] & (0xffu << (component_c${h} * 8)))`;return`
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
            ${p}[${h}] = ${m}(${i(b,$,v)});
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
      }`},cy=e=>{let t=e[1].dims,n=e[2].dims,o=e[0].dims,u=e[1].dataType,l=!(z.areEqual(t,n)&&z.areEqual(n,o)),d=t,c=z.size(t);if(l){let r=$n.calcShape($n.calcShape(t,n,!1),o,!1);if(!r)throw new Error("Can't perform where op on the given tensors");d=r,c=z.size(d)}let s=Math.ceil(c/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:r=>dy(r,e,d,l,u),getRunData:()=>({outputs:[{dims:d,dataType:u}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:s},...oe(o,t,n,d)]})}},v2=e=>{e.compute(cy(e.inputs))}}),x2,yA=D(()=>{"use strict";kE(),zl(),CE(),DE(),RE(),NE(),zE(),jE(),VE(),GE(),qE(),HE(),WE(),KE(),XE(),ZE(),YE(),JE(),QE(),eA(),tA(),rA(),nA(),iA(),oA(),sA(),j1(),aA(),uA(),lA(),dA(),cA(),Nl(),pA(),H1(),hA(),fA(),mA(),G1(),gA(),xr(),Ml(),bA(),x2=new Map([["Abs",[px]],["Acos",[hx]],["Acosh",[fx]],["Add",[Xx]],["ArgMax",[ux,nl]],["ArgMin",[ax,nl]],["Asin",[mx]],["Asinh",[gx]],["Atan",[bx]],["Atanh",[yx]],["Attention",[lx]],["AveragePool",[t2,e2]],["BatchNormalization",[dx]],["BiasAdd",[cx]],["BiasSplitGelu",[Kx]],["Cast",[wx,_x]],["Ceil",[xx]],["Clip",[vx]],["Concat",[o1,s1]],["Conv",[ll,ul]],["ConvTranspose",[g1,m1]],["Cos",[$x]],["Cosh",[Tx]],["CumSum",[b1,y1]],["DepthToSpace",[_1,w1]],["DequantizeLinear",[u2,l2]],["DFT",[v1,x1]],["Div",[Zx]],["Einsum",[$1,T1]],["Elu",[Sx,li]],["Equal",[Yx]],["Erf",[Ix]],["Exp",[Ox]],["Expand",[S1]],["FastGelu",[I1]],["Floor",[Ex]],["FusedConv",[ll,ul]],["Gather",[E1,O1]],["GatherElements",[R1,D1]],["GatherBlockQuantized",[k1,C1]],["GatherND",[A1,P1]],["Gelu",[Ax]],["Gemm",[z1,N1]],["GlobalAveragePool",[n2,r2]],["GlobalMaxPool",[a2,s2]],["Greater",[t1]],["GreaterOrEqual",[n1]],["GridSample",[M1,B1]],["GroupQueryAttention",[W1]],["HardSigmoid",[Mx,zx]],["HardSwish",[Bx]],["InstanceNormalization",[K1]],["LayerNormalization",[X1]],["LeakyRelu",[Px,li]],["Less",[r1]],["LessOrEqual",[i1]],["Log",[Hx]],["MatMul",[Z1]],["MatMulNBits",[Y1,J1]],["MaxPool",[i2,o2]],["Mul",[Jx]],["MultiHeadAttention",[L1,F1]],["Neg",[Cx]],["Not",[kx]],["Pad",[Q1]],["Pow",[Qx]],["QuickGelu",[Wx,li]],["Range",[d2]],["Reciprocal",[Dx]],["ReduceMin",[rx]],["ReduceMean",[Yv]],["ReduceMax",[tx]],["ReduceSum",[ix]],["ReduceProd",[nx]],["ReduceL1",[Jv]],["ReduceL2",[Qv]],["ReduceLogSum",[sx]],["ReduceLogSumExp",[ex]],["ReduceSumSquare",[ox]],["Relu",[Rx]],["Resize",[h2,f2]],["RotaryEmbedding",[q1]],["ScatterND",[p2,c2]],["Sigmoid",[Nx]],["Sin",[Fx]],["Sinh",[Lx]],["Slice",[g2,b2]],["SkipLayerNormalization",[m2]],["Split",[U1,V1]],["Sqrt",[jx]],["Softmax",[y2,_2]],["Sub",[e1]],["Tan",[Ux]],["Tanh",[Vx]],["ThresholdedRelu",[qx,li]],["Tile",[w2]],["Transpose",[Fv,Lv]],["Where",[v2]]])}),$2,_A=D(()=>{"use strict";at(),er(),pe(),$2=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,n,o,u){Vt(e.programInfo.name);let l=this.backend.device,d=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let c=[];for(let r of t)c.push({binding:c.length,resource:{buffer:r.buffer}});for(let r of n)c.push({binding:c.length,resource:{buffer:r.buffer}});u&&c.push({binding:c.length,resource:u});let s=l.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:c,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let r={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:s,dispatchGroup:o};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(r)}d.setPipeline(e.computePipeline),d.setBindGroup(0,s),d.dispatchWorkgroups(...o),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Nt(e.programInfo.name)}dispose(){}build(e,t){Vt(e.name);let n=this.backend.device,o=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(r=>{n.features.has(r.feature)&&o.push(`enable ${r.extension};`)});let u=Bv(t,this.backend.device.limits),l=e.getShaderSource(u),d=`${o.join(`
`)}
${u.additionalImplementations}
${l}`,c=n.createShaderModule({code:d,label:e.name});Se("verbose",()=>`[WebGPU] ${e.name} shader code: ${d}`);let s=n.createComputePipeline({compute:{module:c,entryPoint:"main"},layout:"auto",label:e.name});return Nt(e.name),{programInfo:e,computePipeline:s,uniformVariablesInfo:u.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,n=typeof e=="number"?1:e.y||1,o=typeof e=="number"?1:e.z||1,u=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=u&&n<=u&&o<=u)return[t,n,o];let l=t*n*o,d=Math.ceil(Math.sqrt(l));if(d>u){if(d=Math.ceil(Math.cbrt(l)),d>u)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[d,d,d]}else return[d,d,1]}}}),T2={};on(T2,{WebGpuBackend:()=>S2});var py,hy,fy,S2,wA=D(()=>{"use strict";at(),ae(),er(),Dv(),AE(),yA(),_A(),py=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let n=[];for(let o=0;o<e.length;++o){let u=e[o].dataType;switch(t[o]){case"none":{n.push("");break}case"type":{n.push(`${u}`);break}case"rank":{let l=e[o].dims.length;n.push(`${u};${l}`);break}case"dims":{let l=e[o].dims.join(",");n.push(`${u};${l}`);break}default:throw new Error(`unsupported input dependency: ${t[o]}`)}}return n.join("|")},hy=(e,t,n)=>{let o=e.name;return e.shaderCache?.hint&&(o+="["+e.shaderCache.hint+"]"),o+=":"+n+`:${py(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,o},fy=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},S2=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let n=[],o={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:n},u=c=>t.features.has(c)&&n.push(c)&&!0;u("chromium-experimental-timestamp-query-inside-passes")||u("timestamp-query"),u("shader-f16"),u("subgroups"),this.device=await t.requestDevice(o);let l=t,d=t.info??(typeof l.requestAdapterInfo=="function"?await l.requestAdapterInfo():void 0);this.adapterInfo=new fy(d),this.gpuDataManager=zv(this),this.programManager=new $2(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,kl(e.logLevel,!!e.debug),this.device.onuncapturederror=c=>{c.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${c.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Vt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),n=this.pendingQueries.get(e);for(let o=0;o<t.length/2;o++){let u=n[o],l=u.kernelId,d=this.kernels.get(l),c=d.kernelType,s=d.kernelName,r=u.programName,i=u.inputTensorViews,a=u.outputTensorViews,p=t[o*2],h=t[o*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=p);let m=Number(p-this.queryTimeBase),b=Number(h-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:i.map($=>({dims:$.dims,dataType:Jt($.dataType)})),outputsMetadata:a.map($=>({dims:$.dims,dataType:Jt($.dataType)})),kernelId:l,kernelType:c,kernelName:s,programName:r,startTime:m,endTime:b});else{let $="";i.forEach((y,T)=>{$+=`input[${T}]: [${y.dims}] | ${Jt(y.dataType)}, `});let v="";a.forEach((y,T)=>{v+=`output[${T}]: [${y.dims}] | ${Jt(y.dataType)}, `}),console.log(`[profiling] kernel "${l}|${c}|${s}|${r}" ${$}${v}start time: ${m} ns, execution time: ${b-m} ns`)}wo("GPU",`${r}::${p}::${h}`)}e.unmap(),this.pendingQueries.delete(e)}),Nt()}run(e,t,n,o,u,l){Vt(e.name);let d=[];for(let y=0;y<t.length;++y){let T=t[y].data;if(T===0)continue;let I=this.gpuDataManager.get(T);if(!I)throw new Error(`no GPU data for input: ${T}`);d.push(I)}let{outputs:c,dispatchGroup:s,programUniforms:r}=e.getRunData(t),i=n.length===0?c.map((y,T)=>T):n;if(i.length!==c.length)throw new Error(`Output size ${i.length} must be equal to ${c.length}.`);let a=[],p=[];for(let y=0;y<c.length;++y){if(!Number.isInteger(i[y])||i[y]<-3||i[y]>=l)throw new Error(`Invalid output index: ${i[y]}`);if(i[y]===-3)continue;let T=i[y]===-1,I=i[y]===-2,S=T||I?u(c[y].dataType,c[y].dims):o(i[y],c[y].dataType,c[y].dims);if(a.push(S),S.data===0)continue;let A=this.gpuDataManager.get(S.data);if(!A)throw new Error(`no GPU data for output: ${S.data}`);if(T&&this.temporaryData.push(A),I){let k=this.kernelPersistentData.get(this.currentKernelId);k||(k=[],this.kernelPersistentData.set(this.currentKernelId,k)),k.push(A)}p.push(A)}if(d.length!==t.length||p.length!==a.length){if(p.length===0)return Nt(e.name),a;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let h;if(r){let y=0,T=[];r.forEach(k=>{let O=typeof k.data=="number"?[k.data]:k.data;if(O.length===0)return;let L=k.type===10?2:4,U,Y;k.type===10?(Y=O.length>4?16:O.length>2?8:O.length*L,U=O.length>4?16:L*O.length):(Y=O.length<=2?O.length*L:16,U=16),y=Math.ceil(y/Y)*Y,T.push(y);let q=k.type===10?8:4;y+=O.length>4?Math.ceil(O.length/q)*U:O.length*L});let I=16;y=Math.ceil(y/I)*I;let S=new ArrayBuffer(y);r.forEach((k,O)=>{let L=T[O],U=typeof k.data=="number"?[k.data]:k.data;if(k.type===6)new Int32Array(S,L,U.length).set(U);else if(k.type===12)new Uint32Array(S,L,U.length).set(U);else if(k.type===10)new Uint16Array(S,L,U.length).set(U);else if(k.type===1)new Float32Array(S,L,U.length).set(U);else throw new Error(`Unsupported uniform type: ${Jt(k.type)}`)});let A=this.gpuDataManager.create(y,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(A.buffer,0,S,0,y),this.gpuDataManager.release(A.id),h={offset:0,size:y,buffer:A.buffer}}let m=this.programManager.normalizeDispatchGroupSize(s),b=m[1]===1&&m[2]===1,$=hy(e,t,b),v=this.programManager.getArtifact($);if(v||(v=this.programManager.build(e,m),this.programManager.setArtifact($,v),Se("info",()=>`[artifact] key: ${$}, programName: ${e.name}`)),r&&v.uniformVariablesInfo){if(r.length!==v.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${v.uniformVariablesInfo.length}, got ${r.length} in program "${v.programInfo.name}".`);for(let y=0;y<r.length;y++){let T=r[y],I=T.type,S=typeof T.data=="number"?1:T.data.length,[A,k]=v.uniformVariablesInfo[y];if(I!==A||S!==k)throw new Error(`Uniform variable ${y} mismatch: expect type ${A} with size ${k}, got type ${I} with size ${S} in program "${v.programInfo.name}".`)}}if(Se("info",()=>`[ProgramManager] run "${e.name}" (key=${$}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let y={kernelId:this.currentKernelId,programName:v.programInfo.name,inputTensorViews:t,outputTensorViews:a};this.pendingKernels.push(y),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(y)}return this.programManager.run(v,d,p,m,h),Nt(e.name),a}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,n,o){let u=x2.get(e);if(!u)throw new Error(`kernel not implemented: ${e}`);let l={kernelType:e,kernelName:o,kernelEntry:u[0],attributes:[u[1],n]};this.kernels.set(t,l)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let n of t)this.gpuDataManager.release(n.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,n){let o=this.kernels.get(e);if(!o)throw new Error(`kernel not created: ${e}`);let u=o.kernelType,l=o.kernelName,d=o.kernelEntry,c=o.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${u}] ${l}" is not allowed to be called recursively`);this.currentKernelId=e,c[0]&&(c[1]=c[0](c[1]),c[0]=void 0),Se("info",()=>`[WebGPU] Start to run kernel "[${u}] ${l}"...`);let s=this.env.debug;this.temporaryData=[];try{return s&&this.device.pushErrorScope("validation"),d(t,c[1]),0}catch(r){return n.push(Promise.resolve(`[WebGPU] Kernel "[${u}] ${l}" failed. ${r}`)),1}finally{s&&n.push(this.device.popErrorScope().then(r=>r?`GPU validation error for kernel "[${u}] ${l}": ${r.message}`:null));for(let r of this.temporaryData)this.gpuDataManager.release(r.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,n,o){let u=this.sessionExternalDataMapping.get(e);u||(u=new Map,this.sessionExternalDataMapping.set(e,u));let l=u.get(t),d=this.gpuDataManager.registerExternalBuffer(n,o,l);return u.set(t,[d,n]),d}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(n=>this.gpuDataManager.unregisterExternalBuffer(n[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,n){return async()=>{let o=await el(this,e,t);return Cl(o.buffer,n)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){Se("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){Se("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){Se("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),n=e.length;this.pendingKernels=[];for(let o=0;o<n;o++){let u=this.getComputePassEncoder(),l=e[o];this.writeTimestamp(this.pendingDispatchNumber*2),u.setPipeline(l.computePipeline),u.setBindGroup(0,l.bindGroup),u.dispatchWorkgroups(...l.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[o]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),I2={};on(I2,{init:()=>O2});var ho,my,O2,vA=D(()=>{"use strict";ae(),er(),ce(),EE(),ho=class E2{constructor(t,n,o,u){this.module=t,this.dataType=n,this.data=o,this.dims=u}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=z.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=z.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=z.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=z.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(z.size(t)!==z.size(this.dims))throw new Error("Invalid new shape");return new E2(this.module,this.dataType,this.data,t)}},my=class{constructor(e,t,n){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let o=e.PTR_SIZE,u=n/e.PTR_SIZE,l=o===4?"i32":"i64";this.opKernelContext=Number(e.getValue(o*u++,l));let d=Number(e.getValue(o*u++,l));this.outputCount=Number(e.getValue(o*u++,l)),this.customDataOffset=Number(e.getValue(o*u++,"*")),this.customDataSize=Number(e.getValue(o*u++,l));let c=[];for(let s=0;s<d;s++){let r=Number(e.getValue(o*u++,l)),i=Number(e.getValue(o*u++,"*")),a=Number(e.getValue(o*u++,l)),p=[];for(let h=0;h<a;h++)p.push(Number(e.getValue(o*u++,l)));c.push(new ho(e,r,i,p))}this.inputs=c}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let n=t?.inputs?.map(d=>typeof d=="number"?this.inputs[d]:d)??this.inputs,o=t?.outputs??[],u=(d,c,s)=>new ho(this.module,c,this.output(d,s),s),l=(d,c)=>{let s=Zr(d,c);if(!s)throw new Error(`Unsupported data type: ${d}`);let r=s>0?this.backend.gpuDataManager.create(s).id:0;return new ho(this.module,d,r,c)};return this.backend.run(e,n,o,u,l,this.outputCount)}output(e,t){let n=this.module.stackSave();try{let o=this.module.PTR_SIZE,u=o===4?"i32":"i64",l=this.module.stackAlloc((1+t.length)*o);this.module.setValue(l,t.length,u);for(let d=0;d<t.length;d++)this.module.setValue(l+o*(d+1),t[d],u);return this.module._JsepOutput(this.opKernelContext,e,l)}catch(o){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${o}`)}finally{this.module.stackRestore(n)}}},O2=async(e,t,n,o)=>{let u=t.jsepInit;if(!u)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let l=(wA(),vn(T2)).WebGpuBackend,d=new l;await d.initialize(n,o),u("webgpu",[d,c=>d.alloc(Number(c)),c=>d.free(c),(c,s,r,i=!1)=>{if(i)Se("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(c)}, dst=${Number(s)}, size=${Number(r)}`),d.memcpy(Number(c),Number(s));else{Se("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(c)}, gpuDataId=${Number(s)}, size=${Number(r)}`);let a=t.HEAPU8.subarray(Number(c>>>0),Number(c>>>0)+Number(r));d.upload(Number(s),a)}},async(c,s,r)=>{Se("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${c}, dataOffset=${s}, size=${r}`),await d.download(Number(c),()=>t.HEAPU8.subarray(Number(s)>>>0,Number(s+r)>>>0))},(c,s,r)=>d.createKernel(c,Number(s),r,t.UTF8ToString(t._JsepGetNodeName(Number(s)))),c=>d.releaseKernel(c),(c,s,r,i)=>{Se("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${r}, kernel=${c}, contextDataOffset=${s}`);let a=new my(t,d,Number(s));return d.computeKernel(Number(c),a,i)},()=>d.captureBegin(),()=>d.captureEnd(),()=>d.replay()])}else{let l=new Nv(n);u("webnn",[l,()=>l.reserveTensorId(),d=>l.releaseTensorId(d),async(d,c,s,r,i)=>l.ensureTensor(d,c,s,r,i),(d,c)=>{l.uploadTensor(d,c)},async(d,c)=>l.downloadTensor(d,c),(d,c)=>l.registerMLContext(d,c),!!n.trace])}}}),gy,Vl,Gl,dr,by,nu,ko,ql,Hl,iu,Wl,Kl,Xl,A2=D(()=>{"use strict";at(),SE(),IE(),ae(),an(),Ol(),Av(),gy=(e,t)=>{Be()._OrtInit(e,t)!==0&&De("Can't initialize onnxruntime.")},Vl=async e=>{gy(e.wasm.numThreads,Io(e.logLevel))},Gl=async(e,t)=>{Be().asyncInit?.();let n=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(n){if(typeof n.limits!="object"||typeof n.features!="object"||typeof n.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let o=e.webgpu.powerPreference;if(o!==void 0&&o!=="low-power"&&o!=="high-performance")throw new Error(`Invalid powerPreference setting: "${o}"`);let u=e.webgpu.forceFallbackAdapter;if(u!==void 0&&typeof u!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${u}"`);if(n=await navigator.gpu.requestAdapter({powerPreference:o,forceFallbackAdapter:u}),!n)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let o=(vA(),vn(I2)).init;t==="webgpu"&&await o("webgpu",Be(),e,n),t==="webnn"&&await o("webnn",Be(),e)}},dr=new Map,by=e=>{let t=Be(),n=t.stackSave();try{let o=t.PTR_SIZE,u=t.stackAlloc(2*o);t._OrtGetInputOutputCount(e,u,u+o)!==0&&De("Can't get session input/output count.");let l=o===4?"i32":"i64";return[Number(t.getValue(u,l)),Number(t.getValue(u+o,l))]}finally{t.stackRestore(n)}},nu=(e,t)=>{let n=Be(),o=n.stackSave(),u=0;try{let l=n.PTR_SIZE,d=n.stackAlloc(2*l);n._OrtGetInputOutputMetadata(e,t,d,d+l)!==0&&De("Can't get session input/output metadata.");let c=Number(n.getValue(d,"*"));u=Number(n.getValue(d+l,"*"));let s=n.HEAP32[u/4];if(s===0)return[c,0];let r=n.HEAPU32[u/4+1],i=[];for(let a=0;a<r;a++){let p=Number(n.getValue(u+8+a*l,"*"));i.push(p!==0?n.UTF8ToString(p):Number(n.getValue(u+8+(a+r)*l,"*")))}return[c,s,i]}finally{n.stackRestore(o),u!==0&&n._OrtFree(u)}},ko=e=>{let t=Be(),n=t._malloc(e.byteLength);if(n===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,n),[n,e.byteLength]},ql=async(e,t)=>{let n,o,u=Be();Array.isArray(e)?[n,o]=e:e.buffer===u.HEAPU8.buffer?[n,o]=[e.byteOffset,e.byteLength]:[n,o]=ko(e);let l=0,d=0,c=0,s=[],r=[],i=[];try{if([d,s]=await Ev(t),t?.externalData&&u.mountExternalData){let I=[];for(let S of t.externalData){let A=typeof S=="string"?S:S.path,k=typeof S=="string"?S:S.data;I.push(Pl(k).then(O=>{u.mountExternalData(A,O)}))}await Promise.all(I)}for(let I of t?.executionProviders??[])if((typeof I=="string"?I:I.name)==="webnn"){if(u.shouldTransferToMLTensor=!1,typeof I!="string"){let S=I,A=S?.context,k=S?.gpuDevice,O=S?.deviceType,L=S?.powerPreference;A?u.currentContext=A:k?u.currentContext=await u.webnnCreateMLContext(k):u.currentContext=await u.webnnCreateMLContext({deviceType:O,powerPreference:L})}else u.currentContext=await u.webnnCreateMLContext();break}l=await u._OrtCreateSession(n,o,d),u.webgpuOnCreateSession?.(l),l===0&&De("Can't create a session."),u.jsepOnCreateSession?.(),u.currentContext&&(u.webnnRegisterMLContext(l,u.currentContext),u.currentContext=void 0,u.shouldTransferToMLTensor=!0);let[a,p]=by(l),h=!!t?.enableGraphCapture,m=[],b=[],$=[],v=[],y=[];for(let I=0;I<a;I++){let[S,A,k]=nu(l,I);S===0&&De("Can't get an input name."),r.push(S);let O=u.UTF8ToString(S);m.push(O),$.push(A===0?{name:O,isTensor:!1}:{name:O,isTensor:!0,type:Jt(A),shape:k})}for(let I=0;I<p;I++){let[S,A,k]=nu(l,I+a);S===0&&De("Can't get an output name."),i.push(S);let O=u.UTF8ToString(S);b.push(O),v.push(A===0?{name:O,isTensor:!1}:{name:O,isTensor:!0,type:Jt(A),shape:k});{if(h&&t?.preferredOutputLocation===void 0){y.push("gpu-buffer");continue}let L=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[O]??"cpu",U=u.webnnIsGraphOutput;if(L==="cpu"&&U&&U(l,O)){y.push("ml-tensor-cpu-output");continue}if(L!=="cpu"&&L!=="cpu-pinned"&&L!=="gpu-buffer"&&L!=="ml-tensor")throw new Error(`Not supported preferred output location: ${L}.`);if(h&&L!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${L}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);y.push(L)}}let T=null;return y.some(I=>I==="gpu-buffer"||I==="ml-tensor"||I==="ml-tensor-cpu-output")&&(c=u._OrtCreateBinding(l),c===0&&De("Can't create IO binding."),T={handle:c,outputPreferredLocations:y,outputPreferredLocationsEncoded:y.map(I=>I==="ml-tensor-cpu-output"?"ml-tensor":I).map(I=>Qu(I))}),dr.set(l,[l,r,i,T,h,!1]),[l,m,b,$,v]}catch(a){throw r.forEach(p=>u._OrtFree(p)),i.forEach(p=>u._OrtFree(p)),c!==0&&u._OrtReleaseBinding(c)!==0&&De("Can't release IO binding."),l!==0&&u._OrtReleaseSession(l)!==0&&De("Can't release session."),a}finally{u._free(n),d!==0&&u._OrtReleaseSessionOptions(d)!==0&&De("Can't release session options."),s.forEach(a=>u._free(a)),u.unmountExternalData?.()}},Hl=e=>{let t=Be(),n=dr.get(e);if(!n)throw new Error(`cannot release session. invalid session id: ${e}`);let[o,u,l,d,c]=n;d&&(c&&t._OrtClearBoundOutputs(d.handle)!==0&&De("Can't clear bound outputs."),t._OrtReleaseBinding(d.handle)!==0&&De("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),u.forEach(s=>t._OrtFree(s)),l.forEach(s=>t._OrtFree(s)),t._OrtReleaseSession(o)!==0&&De("Can't release session."),dr.delete(e)},iu=async(e,t,n,o,u,l,d=!1)=>{if(!e){t.push(0);return}let c=Be(),s=c.PTR_SIZE,r=e[0],i=e[1],a=e[3],p=a,h,m;if(r==="string"&&(a==="gpu-buffer"||a==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(d&&a!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${l} when enableGraphCapture is true.`);if(a==="gpu-buffer"){let v=e[2].gpuBuffer;m=Zr(Xr(r),i);{let y=c.jsepRegisterBuffer;if(!y)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');h=y(o,l,v,m)}}else if(a==="ml-tensor"){let v=e[2].mlTensor;m=Zr(Xr(r),i);let y=c.webnnRegisterMLTensor;if(!y)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');h=y(o,v,Xr(r),i)}else{let v=e[2];if(Array.isArray(v)){m=s*v.length,h=c._malloc(m),n.push(h);for(let y=0;y<v.length;y++){if(typeof v[y]!="string")throw new TypeError(`tensor data at index ${y} is not a string`);c.setValue(h+y*s,Rt(v[y],n),"*")}}else{let y=c.webnnIsGraphInput,T=c.webnnIsGraphOutput;if(r!=="string"&&y&&T){let I=c.UTF8ToString(u);if(y(o,I)||T(o,I)){let S=Xr(r);m=Zr(S,i),p="ml-tensor";let A=c.webnnCreateTemporaryTensor,k=c.webnnUploadTensor;if(!A||!k)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let O=await A(o,S,i);k(O,new Uint8Array(v.buffer,v.byteOffset,v.byteLength)),h=O}else m=v.byteLength,h=c._malloc(m),n.push(h),c.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,m),h)}else m=v.byteLength,h=c._malloc(m),n.push(h),c.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,m),h)}}let b=c.stackSave(),$=c.stackAlloc(4*i.length);try{i.forEach((y,T)=>c.setValue($+T*s,y,s===4?"i32":"i64"));let v=c._OrtCreateTensor(Xr(r),h,m,$,i.length,Qu(p));v===0&&De(`Can't create tensor for input/output. session=${o}, index=${l}.`),t.push(v)}finally{c.stackRestore(b)}},Wl=async(e,t,n,o,u,l)=>{let d=Be(),c=d.PTR_SIZE,s=dr.get(e);if(!s)throw new Error(`cannot run inference. invalid session id: ${e}`);let r=s[0],i=s[1],a=s[2],p=s[3],h=s[4],m=s[5],b=t.length,$=o.length,v=0,y=[],T=[],I=[],S=[],A=[],k=d.stackSave(),O=d.stackAlloc(b*c),L=d.stackAlloc(b*c),U=d.stackAlloc($*c),Y=d.stackAlloc($*c);try{[v,y]=Ov(l),Jr("wasm prepareInputOutputTensor");for(let w=0;w<b;w++)await iu(n[w],T,S,e,i[t[w]],t[w],h);for(let w=0;w<$;w++)await iu(u[w],I,S,e,a[o[w]],b+o[w],h);Qr("wasm prepareInputOutputTensor");for(let w=0;w<b;w++)d.setValue(O+w*c,T[w],"*"),d.setValue(L+w*c,i[t[w]],"*");for(let w=0;w<$;w++)d.setValue(U+w*c,I[w],"*"),d.setValue(Y+w*c,a[o[w]],"*");if(p&&!m){let{handle:w,outputPreferredLocations:C,outputPreferredLocationsEncoded:j}=p;if(i.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${i.length}).`);Jr("wasm bindInputsOutputs");for(let H=0;H<b;H++){let V=t[H];await d._OrtBindInput(w,i[V],T[H])!==0&&De(`Can't bind input[${H}] for session=${e}.`)}for(let H=0;H<$;H++){let V=o[H];u[H]?.[3]?(A.push(I[H]),d._OrtBindOutput(w,a[V],I[H],0)!==0&&De(`Can't bind pre-allocated output[${H}] for session=${e}.`)):d._OrtBindOutput(w,a[V],0,j[V])!==0&&De(`Can't bind output[${H}] to ${C[H]} for session=${e}.`)}Qr("wasm bindInputsOutputs"),dr.set(e,[r,i,a,p,h,!0])}d.jsepOnRunStart?.(r),d.webnnOnRunStart?.(r);let q;p?q=await d._OrtRunWithBinding(r,p.handle,$,U,v):q=await d._OrtRun(r,L,O,b,Y,$,U,v),q!==0&&De("failed to call OrtRun().");let N=[],ue=[];Jr("wasm ProcessOutputTensor");for(let w=0;w<$;w++){let C=Number(d.getValue(U+w*c,"*"));if(C===I[w]||A.includes(I[w])){N.push(u[w]),C!==I[w]&&d._OrtReleaseTensor(C)!==0&&De("Can't release tensor.");continue}let j=d.stackSave(),H=d.stackAlloc(4*c),V=!1,J,M=0;try{d._OrtGetTensorData(C,H,H+c,H+2*c,H+3*c)!==0&&De(`Can't access output tensor data on index ${w}.`);let X=c===4?"i32":"i64",K=Number(d.getValue(H,X));M=d.getValue(H+c,"*");let G=d.getValue(H+c*2,"*"),he=Number(d.getValue(H+c*3,X)),de=[];for(let Q=0;Q<he;Q++)de.push(Number(d.getValue(G+Q*c,X)));d._OrtFree(G)!==0&&De("Can't free memory for tensor dims.");let ye=de.reduce((Q,le)=>Q*le,1);J=Jt(K);let se=p?.outputPreferredLocations[o[w]];if(J==="string"){if(se==="gpu-buffer"||se==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let Q=[];for(let le=0;le<ye;le++){let Ae=d.getValue(M+le*c,"*"),ot=d.getValue(M+(le+1)*c,"*"),Ht=le===ye-1?void 0:ot-Ae;Q.push(d.UTF8ToString(Ae,Ht))}N.push([J,de,Q,"cpu"])}else if(se==="gpu-buffer"&&ye>0){let Q=d.jsepGetBuffer;if(!Q)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let le=Q(M),Ae=Zr(K,ye);if(Ae===void 0||!El(J))throw new Error(`Unsupported data type: ${J}`);V=!0,N.push([J,de,{gpuBuffer:le,download:d.jsepCreateDownloader(le,Ae,J),dispose:()=>{d._OrtReleaseTensor(C)!==0&&De("Can't release tensor.")}},"gpu-buffer"])}else if(se==="ml-tensor"&&ye>0){let Q=d.webnnEnsureTensor,le=d.webnnIsGraphInputOutputTypeSupported;if(!Q||!le)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Zr(K,ye)===void 0||!Al(J))throw new Error(`Unsupported data type: ${J}`);if(!le(e,J,!1))throw new Error(`preferredLocation "ml-tensor" for ${J} output is not supported by current WebNN Context.`);let Ae=await Q(e,M,K,de,!1);V=!0,N.push([J,de,{mlTensor:Ae,download:d.webnnCreateMLTensorDownloader(M,J),dispose:()=>{d.webnnReleaseTensorId(M),d._OrtReleaseTensor(C)}},"ml-tensor"])}else if(se==="ml-tensor-cpu-output"&&ye>0){let Q=d.webnnCreateMLTensorDownloader(M,J)(),le=N.length;V=!0,ue.push((async()=>{let Ae=[le,await Q];return d.webnnReleaseTensorId(M),d._OrtReleaseTensor(C),Ae})()),N.push([J,de,[],"cpu"])}else{let Q=Lo(J),le=new Q(ye);new Uint8Array(le.buffer,le.byteOffset,le.byteLength).set(d.HEAPU8.subarray(M,M+le.byteLength)),N.push([J,de,le,"cpu"])}}finally{d.stackRestore(j),J==="string"&&M&&d._free(M),V||d._OrtReleaseTensor(C)}}p&&!h&&(d._OrtClearBoundOutputs(p.handle)!==0&&De("Can't clear bound outputs."),dr.set(e,[r,i,a,p,h,!1]));for(let[w,C]of await Promise.all(ue))N[w][2]=C;return Qr("wasm ProcessOutputTensor"),N}finally{d.webnnOnRunEnd?.(r),d.stackRestore(k),T.forEach(q=>d._OrtReleaseTensor(q)),I.forEach(q=>d._OrtReleaseTensor(q)),S.forEach(q=>d._free(q)),v!==0&&d._OrtReleaseRunOptions(v),y.forEach(q=>d._free(q))}},Kl=e=>{let t=Be(),n=dr.get(e);if(!n)throw new Error("invalid session id");let o=n[0],u=t._OrtEndProfiling(o);u===0&&De("Can't get an profile file name."),t._OrtFree(u)},Xl=e=>{let t=[];for(let n of e){let o=n[2];!Array.isArray(o)&&"buffer"in o&&t.push(o.buffer)}return t}}),cr,vt,fn,ti,ri,fo,ou,mo,Dr,Rr,yy,P2,k2,C2,D2,R2,N2,z2,M2=D(()=>{"use strict";at(),A2(),an(),Sl(),cr=()=>!!fe.wasm.proxy&&typeof document<"u",fn=!1,ti=!1,ri=!1,mo=new Map,Dr=(e,t)=>{let n=mo.get(e);n?n.push(t):mo.set(e,[t])},Rr=()=>{if(fn||!ti||ri||!vt)throw new Error("worker not ready")},yy=e=>{switch(e.data.type){case"init-wasm":fn=!1,e.data.err?(ri=!0,ou[1](e.data.err)):(ti=!0,ou[0]()),fo&&(URL.revokeObjectURL(fo),fo=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=mo.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},P2=async()=>{if(!ti){if(fn)throw new Error("multiple calls to 'initWasm()' detected.");if(ri)throw new Error("previous call to 'initWasm()' failed.");if(fn=!0,cr())return new Promise((e,t)=>{vt?.terminate(),Sv().then(([n,o])=>{try{vt=o,vt.onerror=l=>t(l),vt.onmessage=yy,ou=[e,t];let u={type:"init-wasm",in:fe};!u.in.wasm.wasmPaths&&(n||Ju)&&(u.in.wasm.wasmPaths={wasm:new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href}),vt.postMessage(u),fo=n}catch(u){t(u)}},t)});try{await Il(fe.wasm),await Vl(fe),ti=!0}catch(e){throw ri=!0,e}finally{fn=!1}}},k2=async e=>{if(cr())return Rr(),new Promise((t,n)=>{Dr("init-ep",[t,n]);let o={type:"init-ep",in:{epName:e,env:fe}};vt.postMessage(o)});await Gl(fe,e)},C2=async e=>cr()?(Rr(),new Promise((t,n)=>{Dr("copy-from",[t,n]);let o={type:"copy-from",in:{buffer:e}};vt.postMessage(o,[e.buffer])})):ko(e),D2=async(e,t)=>{if(cr()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Rr(),new Promise((n,o)=>{Dr("create",[n,o]);let u={type:"create",in:{model:e,options:{...t}}},l=[];e instanceof Uint8Array&&l.push(e.buffer),vt.postMessage(u,l)})}else return ql(e,t)},R2=async e=>{if(cr())return Rr(),new Promise((t,n)=>{Dr("release",[t,n]);let o={type:"release",in:e};vt.postMessage(o)});Hl(e)},N2=async(e,t,n,o,u,l)=>{if(cr()){if(n.some(d=>d[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(u.some(d=>d))throw new Error("pre-allocated output tensor is not supported for proxy.");return Rr(),new Promise((d,c)=>{Dr("run",[d,c]);let s=n,r={type:"run",in:{sessionId:e,inputIndices:t,inputs:s,outputIndices:o,options:l}};vt.postMessage(r,Xl(s))})}else return Wl(e,t,n,o,u,l)},z2=async e=>{if(cr())return Rr(),new Promise((t,n)=>{Dr("end-profiling",[t,n]);let o={type:"end-profiling",in:e};vt.postMessage(o)});Kl(e)}}),su,_y,B2,xA=D(()=>{"use strict";at(),M2(),ae(),Tl(),Av(),su=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},_y=e=>{switch(e[3]){case"cpu":return new gt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!El(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:n,download:o,dispose:u}=e[2];return gt.fromGpuBuffer(n,{dataType:t,dims:e[1],download:o,dispose:u})}case"ml-tensor":{let t=e[0];if(!Al(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:n,download:o,dispose:u}=e[2];return gt.fromMLTensor(n,{dataType:t,dims:e[1],download:o,dispose:u})}default:throw new Error(`invalid data location: ${e[3]}`)}},B2=class{async fetchModelAndCopyToWasmMemory(e){return C2(await Pl(e))}async loadModel(e,t){Vt();let n;typeof e=="string"?n=await this.fetchModelAndCopyToWasmMemory(e):n=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await D2(n,t),Nt()}async dispose(){return R2(this.sessionId)}async run(e,t,n){Vt();let o=[],u=[];Object.entries(e).forEach(a=>{let p=a[0],h=a[1],m=this.inputNames.indexOf(p);if(m===-1)throw new Error(`invalid input '${p}'`);o.push(h),u.push(m)});let l=[],d=[];Object.entries(t).forEach(a=>{let p=a[0],h=a[1],m=this.outputNames.indexOf(p);if(m===-1)throw new Error(`invalid output '${p}'`);l.push(h),d.push(m)});let c=o.map((a,p)=>su(a,()=>`input "${this.inputNames[u[p]]}"`)),s=l.map((a,p)=>a?su(a,()=>`output "${this.outputNames[d[p]]}"`):null),r=await N2(this.sessionId,u,c,d,s,n),i={};for(let a=0;a<r.length;a++)i[this.outputNames[d[a]]]=l[a]??_y(r[a]);return Nt(),i}startProfiling(){}endProfiling(){z2(this.sessionId)}}}),F2={};on(F2,{OnnxruntimeWebAssemblyBackend:()=>pl,initializeFlags:()=>cl,wasmBackend:()=>L2});var cl,pl,L2,$A=D(()=>{"use strict";at(),M2(),xA(),cl=()=>{(typeof fe.wasm.initTimeout!="number"||fe.wasm.initTimeout<0)&&(fe.wasm.initTimeout=0);let e=fe.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),fe.wasm.simd=!1),typeof fe.wasm.proxy!="boolean"&&(fe.wasm.proxy=!1),typeof fe.wasm.trace!="boolean"&&(fe.wasm.trace=!1),typeof fe.wasm.numThreads!="number"||!Number.isInteger(fe.wasm.numThreads)||fe.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)fe.wasm.numThreads=1;else{let t=typeof navigator>"u"?au("node:os").cpus().length:navigator.hardwareConcurrency;fe.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},pl=class{async init(e){cl(),await P2(),await k2(e)}async createInferenceSessionHandler(e,t){let n=new B2;return await n.loadModel(e,t),n}},L2=new pl});at();at();at();var TA="1.29.0";{let e=(xE(),vn(yv)).onnxjsBackend;Yr("webgl",e,-10)}{let e=($A(),vn(F2)).wasmBackend;Yr("webgpu",e,5),Yr("webnn",e,5),Yr("cpu",e,10),Yr("wasm",e,10)}Object.defineProperty(fe.versions,"web",{value:TA,enumerable:!0});function j2(){return fe.versions.web??""}function U2(e={}){fe.wasm.numThreads=e.wasmThreads??1,e.wasmPaths!==void 0&&(fe.wasm.wasmPaths=e.wasmPaths)}var jo=[];function Zl(){let e=jo;return jo=[],e}async function Uo(e,t,n){for(let o of t){let u=null;try{if(u=await Do.create(e.slice().buffer,{executionProviders:[o]}),await n(u))return{session:u,ep:o};jo.push(`${o}: the model does not have the inputs and outputs the release describes`)}catch(l){jo.push(`${o}: ${l instanceof Error?l.message:String(l)}`.slice(0,300))}await u?.release().catch(()=>{})}return null}function An(e,t){return new gt("float32",e,t)}function Yl(e){return{cx:e.x+e.width/2,cy:e.y+e.height/2,w:e.width,h:e.height,angle:0}}function Pn(e,t){let n=Math.max(e.x,t.x),o=Math.max(e.y,t.y),u=Math.min(e.x+e.width,t.x+t.width),l=Math.min(e.y+e.height,t.y+t.height);if(u<=n||l<=o)return 0;let d=(u-n)*(l-o);return d/(e.width*e.height+t.width*t.height-d)}function Jl(e,t,n,o){let u=[...e].sort((d,c)=>n(c)-n(d)),l=[];for(let d of u){let c=t(d);l.every(s=>Pn(c,t(s))<o)&&l.push(d)}return l}var $r=0;var ln=5,Ql={threshold:.3,nmsIou:.45,maxProposals:80},kn=24,Xe=Math.fround,IA=Xe(1e-9);function V2(e,t,n,o=Ql){if(!Number.isInteger(t)||t<=ln)throw new Error(`decodeDetections: ${t} columns leave no class score`);if(e.length%t!==0)throw new Error(`decodeDetections: ${e.length} values is not a multiple of ${t}`);let u=e.length/t,l=Xe(o.threshold),d=Xe(o.nmsIou),c=[],s=[],r=[];for(let v=0;v<u;v++){let y=v*t,T=e[y+4],I=0,S=Xe(T*e[y+ln]);for(let A=1;A<t-ln;A++){let k=Xe(T*e[y+ln+A]);k>S&&(S=k,I=A)}S>=l&&(c.push(v),s.push(S),r.push(I))}let i=c.length;if(i===0)return[];let a=new Float32Array(i),p=new Float32Array(i),h=new Float32Array(i),m=new Float32Array(i);for(let v=0;v<i;v++){let y=c[v]*t,T=e[y],I=e[y+1],S=Xe(e[y+2]/2),A=Xe(e[y+3]/2);a[v]=T-S,p[v]=I-A,h[v]=T+S,m[v]=I+A}let b=Array.from({length:i},(v,y)=>y).sort((v,y)=>s[y]-s[v]||v-y),$=[];for(;b.length>0;){let v=b[0];if($.push(v),b.length===1)break;let y=Xe(Xe(h[v]-a[v])*Xe(m[v]-p[v])),T=[];for(let I=1;I<b.length;I++){let S=b[I],A=Math.max(Xe(Math.min(h[v],h[S])-Math.max(a[v],a[S])),0),k=Math.max(Xe(Math.min(m[v],m[S])-Math.max(p[v],p[S])),0),O=Xe(A*k),L=Xe(Xe(h[S]-a[S])*Xe(m[S]-p[S]));Xe(O/Xe(Xe(Xe(y+L)-O)+IA))<=d&&T.push(S)}b=T}return $.slice(0,o.maxProposals).map(v=>{let y={x:a[v]/n,y:p[v]/n,width:Xe(h[v]-a[v])/n,height:Xe(m[v]-p[v])/n};return{aabb:y,rect:Yl(y),score:s[v],cls:r[v]}})}function Vo(e,t,n,o=kn){let u=Math.trunc(Math.max(0,e.x)),l=Math.trunc(Math.max(0,e.y)),d=Math.trunc(Math.min(t,e.x+e.width)),c=Math.trunc(Math.min(n,e.y+e.height));return d-u>=o&&c-l>=o}function G2(e,t,n,o,u,l=Ql,d=kn){return V2(e,t,n,l).filter(c=>Vo(c.aabb,o,u,d))}function OA(e,t,n,o,u){let l=o/t,d=u/n;return[Math.max(0,e.x*l),Math.max(0,e.y*d),Math.min(o,(e.x+e.width)*l),Math.min(u,(e.y+e.height)*d)]}function q2(e,t){let n=e.aabb;if(n.x>=0&&n.y>=0&&n.x+n.width<=t.width&&n.y+n.height<=t.height)return e;let[o,u,l,d]=OA(n,t.width,t.height,t.width,t.height),c={x:o,y:u,width:Math.max(0,l-o),height:Math.max(0,d-u)};return{...e,aabb:c,rect:Yl(c)}}function H2(e,t=$r){let n=[],o=[];for(let u of e)(u.cls===t?n:o).push(u);return{faces:n,others:o}}function EA(e){return e<0&&(e=-e),e<1?1-e:0}function W2(e,t){let n=e/t,o=n<1?1:n,u=o,l=Math.ceil(u)*2+1,d=new Int32Array(t*2),c=new Int32Array(t*l),s=new Float64Array(l);for(let r=0;r<t;r++){let i=(r+.5)*n,a=0,p=1/o,h=Math.trunc(i-u+.5);h<0&&(h=0);let m=Math.trunc(i+u+.5);m>e&&(m=e),m-=h;for(let b=0;b<m;b++){let $=EA((b+h-i+.5)*p);s[b]=$,a+=$}for(let b=0;b<m;b++)a!==0&&(s[b]=s[b]/a);for(let b=m;b<l;b++)s[b]=0;for(let b=0;b<l;b++){let $=s[b];c[r*l+b]=$<0?Math.trunc(-.5+$*4194304):Math.trunc(.5+$*4194304)}d[r*2]=h,d[r*2+1]=m}return{ksize:l,bounds:d,kk:c}}function Go(e){let t=e>>22;return t<0?0:t>255?255:t}var K2="",ed=null,td=null;function AA(e,t,n,o){let u=`${e}x${t}>${n}x${o}`;return(u!==K2||!ed||!td)&&(ed=W2(e,n),td=W2(t,o),K2=u),{h:ed,v:td}}function qo(e,t,n,o,u){let{h:l,v:d}=AA(t,n,o,u),c=o!==t,s=u!==n,r,i;if(c){let v=s?d.bounds[0]:0,T=(s?d.bounds[u*2-2]+d.bounds[u*2-1]:n)-v;i=v,r=new Uint8Array(o*T*3);let{ksize:I,bounds:S,kk:A}=l;for(let k=0;k<T;k++){let O=(k+v)*t*4,L=k*o*3;for(let U=0;U<o;U++){let Y=S[U*2],q=S[U*2+1],N=U*I,ue=2097152,w=2097152,C=2097152,j=O+Y*4;for(let V=0;V<q;V++,j+=4){let J=A[N+V];ue+=e[j]*J,w+=e[j+1]*J,C+=e[j+2]*J}let H=L+U*3;r[H]=Go(ue),r[H+1]=Go(w),r[H+2]=Go(C)}}}else{i=0,r=new Uint8Array(t*n*3);for(let v=0,y=0;v<r.length;v+=3,y+=4)r[v]=e[y],r[v+1]=e[y+1],r[v+2]=e[y+2]}if(!s)return r;let a=new Uint8Array(o*u*3),p=o*3,h=new Int32Array(p),{ksize:m,bounds:b,kk:$}=d;for(let v=0;v<u;v++){let y=b[v*2]-i,T=b[v*2+1],I=v*m;h.fill(2097152);for(let A=0;A<T;A++){let k=$[I+A],O=(A+y)*p;for(let L=0;L<p;L++)h[L]=h[L]+r[O+L]*k}let S=v*p;for(let A=0;A<p;A++)a[S+A]=Go(h[A])}return a}var Ho={width:640,height:384,pad:114};function X2(e){let t=Math.floor(e),n=e-t;return n>.5?t+1:n<.5||t%2===0?t:t+1}function rd(e,t,n=Ho){let o=Math.min(n.height/t,n.width/e);return{ratio:o,width:X2(e*o),height:X2(t*o)}}function PA(e,t,n,o=Ho){let u=rd(t,n,o),l=qo(e,t,n,u.width,u.height),d=new Uint8Array(o.width*o.height*3).fill(o.pad);for(let c=0;c<u.height;c++)for(let s=0;s<u.width;s++){let r=(c*u.width+s)*3,i=(c*o.width+s)*3;d[i]=l[r+2],d[i+1]=l[r+1],d[i+2]=l[r]}return{...u,canvas:d}}function nd(e,t,n,o=Ho){let u=rd(t,n,o),l=qo(e,t,n,u.width,u.height),d=o.width*o.height,c=new Float32Array(3*d).fill(o.pad);for(let s=0;s<u.height;s++)for(let r=0;r<u.width;r++){let i=(s*u.width+r)*3,a=s*o.width+r;c[a]=l[i+2],c[d+a]=l[i+1],c[2*d+a]=l[i]}return{...u,tensor:c}}var Ti=class e{constructor(t,n,o){this.session=t;this.ep=n;this.settings=o;this.columns=ln+o.classes.length}session;ep;settings;lastTimings=null;columns;static async create(t,n,o){let{width:u,height:l}=n.letterbox,d=ln+n.classes.length,c=await Uo(t,o,async s=>{let i=(await s.run({[n.inputName]:An(new Float32Array(3*u*l),[1,3,l,u])}))[n.outputName]?.dims??[];return i.length===3&&i[0]===1&&i[1]===n.anchors&&i[2]===d});return c?new e(c.session,c.ep,n):null}async propose(t){let{letterbox:n,inputName:o,outputName:u,decode:l,minCropPx:d}=this.settings,c=performance.now(),{tensor:s,ratio:r}=nd(t.data,t.width,t.height,n),i=performance.now(),a=await this.session.run({[o]:An(s,[1,3,n.height,n.width])});return this.lastTimings={preprocessMs:i-c,inferMs:performance.now()-i},G2(a[u].data,this.columns,r,t.width,t.height,l,d)}async release(){await this.session.release().catch(()=>{})}};var kA=32;async function CA(e,t,n,o,u=kA){if(n<=u)return e(t,n);let l=t.length/n,d=new Float32Array(n*o);for(let c=0;c<n;c+=u){let s=Math.min(u,n-c),r=await e(t.slice(c*l,(c+s)*l),s);if(r.length!==s*o)throw new Error(`unexpected embedding size ${r.length} for ${s} crops`);d.set(r,c*o)}return d}var Si=class e{constructor(t,n,o){this.session=t;this.ep=n;this.settings=o}session;ep;settings;static async create(t,n,o){let u=n.inputSize,l=await Uo(t,o,async d=>(await d.run({[n.inputName]:An(new Float32Array(3*u*u),[1,3,u,u])}))[n.outputName]?.data.length===n.dim);return l?new e(l.session,l.ep,n):null}async embedBatch(t,n){return CA((o,u)=>this.run(o,u),t,n,this.settings.dim)}async run(t,n){let{inputName:o,outputName:u,inputSize:l,dim:d}=this.settings,s=(await this.session.run({[o]:An(t,[n,3,l,l])}))[u].data;if(s.length!==n*d)throw new Error(`unexpected embedding size ${s.length} for ${n} crops`);return s}async release(){await this.session.release().catch(()=>{})}};var DA=["orb","akaze","sift"];var RA={orb:[["scaleFactor",1.2,!1],["nLevels",8,!0],["edgeThreshold",15,!0],["patchSize",15,!0],["fastThreshold",10,!0]],akaze:[["threshold",.001,!1],["nOctaves",4,!0],["nOctaveLayers",4,!0]],sift:[["nOctaveLayers",3,!0],["contrastThreshold",.04,!1],["edgeThreshold",10,!1],["sigma",1.6,!1]]},pC=Object.fromEntries(DA.map(e=>[e,Object.fromEntries(RA[e].map(([t,n])=>[t,n]))])),hC=Object.freeze({seed:0,features:{type:"orb",maxFeatures:300,artLongSide:320,mask:[],params:{}},crop:{longSide:320,maxFeatures:500},candidates:{embeddingTopK:5,voteTopN:0},vote:{matcher:"bf",ratio:.8,lshTables:12,lshKeySize:20,lshProbes:2,kdTrees:4,checks:64},match:{ratio:.8},ransac:{model:"homography",method:"ransac",threshold:6,maxIters:2e3,confidence:.995,minAreaRatio:.25,maxAreaRatio:4},fusion:{weight:.1,minInliers:8,fullInliers:30,penalty:0,baseline:"none",reorder:!0},gate:{belowAccept:!1,sources:null}}),NA=["features","crop","candidates","vote","match","ransac","fusion","gate"],fC=["index","seed",...NA];var gC=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]);function Z2(e,t,n){let o=new Float64Array(e);for(let u of t){let l=u.fused-u.cosine;for(let d of n(u.cardId))o[d]=o[d]+l}return o}var zA=10n;function MA(e){let t=new DataView(new ArrayBuffer(8));t.setFloat64(0,e);let n=t.getUint32(0),o=t.getUint32(4),u=n>>>31?-1n:1n,l=n>>>20&2047,d=BigInt(n&1048575)<<32n|BigInt(o),c;return l===0?c=-1074:(d|=1n<<52n,c=l-1075),{mantissa:u*d,exponent:c}}function Ii(e,t){if(!Number.isFinite(e)||e===0)return e;let{mantissa:n,exponent:o}=MA(e),u=n<0n,d=(u?-n:n)*zA**BigInt(t),c=1n;o>=0?d<<=BigInt(o):c<<=BigInt(-o);let s=d/c,i=2n*(d-s*c);if((i>c||i===c&&s%2n===1n)&&(s+=1n),s===0n)return u?-0:0;let a=`${u?"-":""}${s.toString()}e-${t}`;return Number(a)}function BA(e){return{cardId:e.cardId,cosine:Ii(e.cosine,6),foundBy:e.foundBy,votes:e.votes,matches:e.matches,inliers:e.inliers,evidence:Ii(e.evidence,6),fused:Ii(e.fused,6)}}function Y2(e,t){return{before:{topId:e.topId,similarity:Ii(e.similarity,6),margin:Ii(e.margin,6),accepted:e.accepted},candidates:t.candidates.map(BA),...t.debug?{debug:t.debug}:{}}}var FA=23,wC=(1<<FA)-1;function J2(e,t,n){let o=new Map;for(let u of e)o.set(u.id,t==="printing"?u.printingOf??u.id:u.name);if(n)for(let u of n.groups){let l=u.find(d=>!n.representative.has(d))??[...u].sort()[0];for(let d of u)o.set(d,`group:${n.representative.get(d)??l}`)}return o}var Cn="file:///";function Q2(e){let t=new URL(e,Cn).href.slice(Cn.length);try{return decodeURIComponent(t)}catch{return t}}var qt={full128:{id:"full128",size:128,centerMask:!1,poolVersion:2,crop:"truncate"}};function id(e){return typeof e=="string"&&Object.prototype.hasOwnProperty.call(qt,e)}function Wo(e){if(typeof e!="object"||e===null||Array.isArray(e))return null;let t=e;if(!id(t.id))return null;let n=qt[t.id],o=Object.keys(t);return o.length===Object.keys(n).length&&o.every(l=>n[l]===t[l])?t.id:null}function t$(e,t,n,o,u,l){let d=new Float64Array(o*u*3),c=new Uint32Array(o*u);for(let a=0;a<n;a++){let p=Math.min(u-1,Math.floor(a*u/n));for(let h=0;h<t;h++){let m=Math.min(o-1,Math.floor(h*o/t)),b=(a*t+h)*4,$=(p*o+m)*3;d[$]=d[$]+e[b],d[$+1]=d[$+1]+e[b+1],d[$+2]=d[$+2]+e[b+2],c[p*o+m]=c[p*o+m]+1}}for(let a=0;a<c.length;a++){let p=c[a];p>0&&(d[a*3]=d[a*3]/p,d[a*3+1]=d[a*3+1]/p,d[a*3+2]=d[a*3+2]/p)}if(l===1||t>=o&&n>=u||t<=0||n<=0)return d;let s=e$(n,u),r=e$(t,o),i=new Float64Array(d.length);for(let a=0;a<u;a++)for(let p=0;p<o;p++){let h=(s[a]*o+r[p])*3,m=(a*o+p)*3;i[m]=d[h],i[m+1]=d[h+1],i[m+2]=d[h+2]}return i}function e$(e,t){let n=new Uint8Array(t);for(let u=0;u<e;u++)n[Math.min(t-1,Math.floor(u*t/e))]=1;let o=new Int32Array(t);for(let u=0;u<t;u++){if(n[u]){o[u]=u;continue}let l=u-1;for(;l>=0&&!n[l];)l--;let d=u+1;for(;d<t&&!n[d];)d++;o[u]=l>=0&&(d>=t||u-l<=d-u)?l:d}return o}function od(e,t,n,o){let u=o.size,l=t$(e,t,n,u,u,o.poolVersion),d=new Float32Array(3*u*u),c=u*u;for(let s=0;s<c;s++)for(let r=0;r<3;r++){let i=Math.fround(l[s*3+r]);i=Math.fround(i/255),i=Math.fround(i-.5),i=Math.fround(i/.5),d[r*c+s]=i}return d}function sd(e,t,n){let o=n*n;if(e.length!==3*o)throw new Error(`rotateTensor90: a tensor of ${e.length} values is not 3 x ${n} x ${n}`);let u=(t%4+4)%4;if(u===0)return e;let l=new Float32Array(e.length);for(let d=0;d<3;d++)for(let c=0;c<n;c++)for(let s=0;s<n;s++){let r,i;u===1?(r=n-1-s,i=c):u===2?(r=n-1-c,i=n-1-s):(r=s,i=n-1-c),l[d*o+r*n+i]=e[d*o+c*n+s]}return l}var LA="embedding-bank",Dn=[67,86,66,65,78,75,0],Ko=1,Oi=Dn.length+1+4;function r$(e,t,n){let o=new Float32Array(n);for(let u=0;u<n;u++){let l=e[t+u*2]|e[t+u*2+1]<<8,d=l&32768?-1:1,c=l>>10&31,s=l&1023;c===0?o[u]=d*s*2**-24:c===31?o[u]=s?NaN:d*(1/0):o[u]=d*(1+s/1024)*2**(c-15)}return o}function jA(e,t){let n;try{n=atob(e)}catch{return null}if(n.length!==t*2)return null;let o=new Uint8Array(n.length);for(let u=0;u<n.length;u++)o[u]=n.charCodeAt(u);return r$(o,0,t)}function UA(e){return id(e)?e:Wo(e)}function n$(e){if(e.kind!==LA||typeof e.version!="number"||!Number.isInteger(e.version)||typeof e.model!="string"||typeof e.dim!="number"||!Number.isInteger(e.dim)||e.dim<=0)return null;let t=UA(e.preprocessing);return t===null||e.centerMask!==void 0&&e.centerMask!==qt[t].centerMask||e.tau!==void 0&&typeof e.tau!="number"?null:{dim:e.dim,version:e.version,model:e.model,preprocessing:t,tau:typeof e.tau=="number"?e.tau:null}}function i$(e,t,n){let o=n.length,u=0;for(let l=0;l<o;l++)u+=n[l]*n[l];if(u=Math.sqrt(u),!(u>0)||!Number.isFinite(u))return!1;for(let l=0;l<o;l++)e[t*o+l]=n[l]/u;return!0}function ad(e){if(typeof e!="object"||e===null)return null;let t=e,n=n$(t);if(n===null||!Array.isArray(t.entries)||t.entries.length===0)return null;let o=n.dim,u=[],l=new Float32Array(t.entries.length*o);for(let d=0;d<t.entries.length;d++){let c=t.entries[d];if(typeof c!="object"||c===null||typeof c.cardId!="string"||typeof c.vec!="string")return null;let s=jA(c.vec,o);if(!s||!i$(l,d,s))return null;u.push(c.cardId)}return{ids:u,matrix:l,...n}}function ud(e){return e.length>=Dn.length&&Dn.every((t,n)=>e[n]===t)}function ld(e){return ud(e)&&e.length>Dn.length?e[Dn.length]:null}function o$(e){let t=e instanceof Uint8Array?e:new Uint8Array(e);if(ld(t)!==Ko||t.length<Oi)return null;let n=new DataView(t.buffer,t.byteOffset,t.byteLength).getUint32(Dn.length+1,!0);if(t.length<Oi+n)return null;let o;try{o=JSON.parse(new TextDecoder("utf-8",{fatal:!0}).decode(t.subarray(Oi,Oi+n)))}catch{return null}if(typeof o!="object"||o===null||Array.isArray(o))return null;let u=o,l=n$(u);if(l===null||"entries"in u||u.dtype!==void 0&&u.dtype!=="fp16")return null;let d=u.cardIds;if(!Array.isArray(d)||d.length===0||!d.every(a=>typeof a=="string")||u.entryCount!==d.length)return null;let c=u.artVs;if(c!==void 0&&(!Array.isArray(c)||c.length!==d.length||!c.every(a=>a===null||typeof a=="string")))return null;let s=l.dim,r=Oi+n;if(t.length-r!==d.length*s*2)return null;let i=new Float32Array(d.length*s);for(let a=0;a<d.length;a++)if(!i$(i,a,r$(t,r+a*s*2,s)))return null;return{ids:d,matrix:i,...l}}function VA(e){let t=e.localWidth??e.bounds.width,n=e.localHeight??e.bounds.height,o=e.bounds.x+e.bounds.width/2,u=e.bounds.y+e.bounds.height/2;return{left:o-t/2,top:u-n/2,width:t,height:n}}function dd(e,t){let n=VA(e),o=(n.left+n.width/2)*t.width,u=(n.top+n.height/2)*t.height,l=n.width/2*t.width,d=n.height/2*t.height,c=e.rotation*Math.PI/180,s=Math.cos(c),r=Math.sin(c);return{points:[{x:-l,y:-d},{x:l,y:-d},{x:l,y:d},{x:-l,y:d}].map(({x:p,y:h})=>({x:o+p*s-h*r,y:u+p*r+h*s}))}}function s$(e,t){let{points:n}=t,o=0;for(let u=0;u<n.length;u++){let l=n[u],d=n[(u+1)%n.length],c=d.x-l.x,s=d.y-l.y,r=e.x-l.x,i=e.y-l.y,a=c*i-s*r;if(a===0)continue;let p=a>0?1:-1;if(o===0)o=p;else if(p!==o)return!1}return!0}function cd(e,t){let n=null;for(let o of t)s$(e,o.quad)&&(!n||o.zIndex>=n.zIndex)&&(n=o);return n?n.card:null}function Rn(e){return e<0?0:e>1?1:e}function Xo(e,t){let{frameWidth:n,frameHeight:o,names:u}=t;return e.map(l=>{let{aabb:d,rect:c}=l,s={instanceId:l.instanceId,bounds:{x:Rn(d.x/n),y:Rn(d.y/o),width:Rn(d.width/n),height:Rn(d.height/o)},rotation:(c.angle+45)%90-45,localWidth:Rn(c.w/n),localHeight:Rn(c.h/o),landscape:c.w>c.h,cardId:null,name:null};if(l.identity){let r=u.get(l.identity);r!==void 0&&(s.cardId=l.identity,s.name=r)}return s})}var u$=["accepted-nms","best-score","detector-score"];function l$(e){return typeof e=="string"&&u$.includes(e)}var pd="accepted-nms",GA=.5,qA="hover_";function a$(e){return e.width*e.height}function d$(e,t){let n=t==="accepted-nms"?e.kept:e.proposals.map((u,l)=>l),o=(u,l)=>{let d=e.proposals[u],c=e.proposals[l];if(t==="detector-score")return d.detectorScore!==c.detectorScore?d.detectorScore<c.detectorScore?-1:1:l-u;let s=a$(c.aabb)-a$(d.aabb),r=d.score-c.score,i=t==="accepted-nms"?s:r,a=t==="accepted-nms"?r:s;return i!==0?i:a!==0?a:l-u};return[...n].sort(o)}function Yo(e,t=pd){return d$(e,t).map((n,o)=>{let u=e.proposals[n];return{proposal:n,aabb:u.aabb,rect:u.rect,identity:u.accepted?u.displayId:null,score:u.score,zIndex:o+1}})}var Zo=class{prev=[];nextId=1;reset(){this.prev=[]}assign(t){let n=new Set,o=t.map((l,d)=>d).sort((l,d)=>t[d].zIndex-t[l].zIndex),u=new Array(t.length);for(let l of o){let d=t[l],c=-1,s=GA;for(let r=0;r<this.prev.length;r++){if(n.has(r)||this.prev[r].identity!==d.identity)continue;let i=Pn(d.aabb,this.prev[r].aabb);i>=s&&(c<0||i>s)&&(c=r,s=i)}c>=0?(n.add(c),u[l]=this.prev[c].id):u[l]=`${qA}${String(this.nextId++).padStart(4,"0")}`}return this.prev=t.map((l,d)=>({id:u[d],aabb:l.aabb,identity:l.identity})),u}};function hd(e,t,n,o=u=>u){return Xo(e.map((l,d)=>({instanceId:t[d],aabb:l.aabb,rect:l.rect,identity:l.identity})),n).map((l,d)=>({...l,zIndex:e[d].zIndex,boxIndex:o(e[d].proposal)}))}var HA={card:null,boxIndex:null,box:null,cardId:null,name:null};function fd(e,t,n){let o=e.map(l=>({card:l,quad:dd(l,n),zIndex:l.zIndex??0})),u=cd(t,o);return u?{card:u,boxIndex:u.boxIndex??null,box:{x:u.bounds.x*n.width,y:u.bounds.y*n.height,width:u.bounds.width*n.width,height:u.bounds.height*n.height},cardId:u.cardId,name:u.name}:HA}var WA="identity-groups";function md(e){if(typeof e!="object"||e===null)return null;let t=e;if(t.schemaVersion!==1||t.kind!==WA||typeof t.version!="number"||!Number.isInteger(t.version)||!Array.isArray(t.groups)||typeof t.representative!="object"||t.representative===null||Array.isArray(t.representative))return null;let n=new Map,o=[];for(let l of t.groups){if(!Array.isArray(l)||l.length<2)return null;let d=[];for(let c of l){if(typeof c!="string"||c.length===0||n.has(c))return null;n.set(c,o.length),d.push(c)}o.push(d)}let u=new Map;for(let[l,d]of Object.entries(t.representative)){if(typeof d!="string"||l===d)return null;let c=n.get(l);if(c===void 0||n.get(d)!==c)return null;u.set(l,d)}for(let l of o){let d=l.filter(c=>!u.has(c));if(d.length!==1||l.some(c=>u.has(c)&&u.get(c)!==d[0]))return null}return{version:t.version,groups:o,representative:u}}var KA=["name","printing"];function gd(e){return KA.includes(e)}function p$(e,t){return t==="printing"?e.printingOf??e.id:e.name}function h$(e,t){let n=new Map;for(let o of[...new Set(e)].sort(c$)){let u=t.get(o);if(u===void 0)continue;let l=n.get(u);l?l.push(o):n.set(u,[o])}return[...n.values()].filter(o=>o.length>=2).sort((o,u)=>c$(o[0],u[0]))}function c$(e,t){return e<t?-1:e>t?1:0}var dn=class{rep=new Map;display;constructor(t=null,n,o="representative"){if(this.display=o,!!t)for(let[u,l]of t.representative)o==="representative"&&n&&!n(l)||this.rep.set(u,l)}of(t){return this.rep.get(t)??t}shown(t){return this.display==="best-printing"?t:this.of(t)}get collapsedCount(){return this.rep.size}};var Jo=["webgpu","wasm"];var XA=.3;function g$(e,t){let n=Math.max(0,Math.floor(t.x)),o=Math.max(0,Math.floor(t.y)),u=Math.min(e.width,Math.floor(t.x+t.width)),l=Math.min(e.height,Math.floor(t.y+t.height)),d=Math.max(0,u-n),c=Math.max(0,l-o),s=new Uint8ClampedArray(d*c*4);for(let r=0;r<c;r++){let i=((o+r)*e.width+n)*4;s.set(e.data.subarray(i,i+d*4),r*d*4)}return{rgba:s,width:d,height:c}}function cn(e,t){return e.similarity>=t.tau&&e.margin>=t.delta}function b$(e,t,n){if(cn(e,n)||!n.rotationRetry)return{orientation:0,match:e,retried:!1};let o=[e,...t()],u=-1;for(let l=0;l<o.length;l++)cn(o[l],n)&&(u<0||o[l].similarity>o[u].similarity)&&(u=l);if(u<0){u=0;for(let l=1;l<o.length;l++)o[l].similarity>o[u].similarity&&(u=l)}return{orientation:u,match:o[u],retried:!0}}function f$(e){let t=[],n=[];return e.forEach((o,u)=>{o.tauPassed&&(o.orientation===0?t:n).push(u)}),[...t,...n]}function m$(e,t){let n=(t??e.map((o,u)=>u)).filter(o=>e[o].tauPassed);return Jl(n,o=>e[o].aabb,o=>e[o].score,XA)}async function bd(e,t,n,o,u=kn,l=null){let d=n.preprocessing,c=n.rule,s=d.size,r=n.dim,i=[],a=[],p=[];for(let w of o){let C=g$(e,w.aabb),{rgba:j,width:H,height:V}=C;H<u||V<u||(i.push(od(j,H,V,d)),a.push(w),l&&p.push(C))}if(a.length===0)return{proposals:[],kept:[],retried:0,embeddings:0,...l?{geometricMs:0}:{}};let h=3*s*s,m=new Float32Array(a.length*h);for(let w=0;w<i.length;w++)m.set(i[w],w*h);let b=await t.embedBatch(m,a.length),$=a.map((w,C)=>n.matchScored(b,C*r)),v=[];if(c.rotationRetry)for(let w=0;w<a.length;w++)cn($[w],c)||v.push(w);let y=new Map(v.map((w,C)=>[w,C])),T=null;if(v.length>0){let w=new Float32Array(v.length*3*h);for(let C=0;C<v.length;C++){let j=i[v[C]];for(let H=1;H<=3;H++)w.set(sd(j,H,s),(C*3+H-1)*h)}T=await t.embedBatch(w,v.length*3)}let I=(w,C)=>{let j=y.get(w);if(j===void 0||T===null)throw new Error(`the turned looks of proposal ${w} were not embedded`);return(j*3+C-1)*r},S=a.map((w,C)=>b$($[C],()=>[1,2,3].map(j=>n.matchScored(T,I(C,j))),c)),A=w=>S[w].orientation===0?{embs:b,off:w*r}:{embs:T,off:I(w,S[w].orientation)},k=new Map,O,L,U=!1;if(l)try{let w=performance.now(),C=[],j=[],H=[];for(let V=0;V<a.length;V++){if(!l.applies(null,cn(S[V].match,c)))continue;let{embs:J,off:M}=A(V),X=n.scoreRow(J,M);C.push(V),j.push(X),H.push({...p[V],ranked:n.rankCards(X)})}if(H.length>0){let V=await l.verifyBatch(H,n.bankIds);C.forEach((J,M)=>{let X=V[M],K=j[M],G=S[J].match,he=Z2(K,X.candidates,Q=>n.columnsOf(Q)),de=l.reorder?n.lookOf(he):n.lookWithin(he,n.lookOf(K).row),{row:ye,...se}=de;k.set(J,{match:se,geometric:Y2({topId:G.topId,similarity:G.similarity,margin:G.margin,accepted:cn(G,c)},X)})})}O=performance.now()-w}catch(w){U=!0,L=w,k.clear(),O=void 0}let Y=w=>{let C=[];for(let j=0;j<a.length;j++){let H=S[j],V=w?k.get(j):void 0,{orientation:J,retried:M}=H,X=V?V.match:H.match,K=X.cardId!==null,G=null;if(K){let{embs:he,off:de}=A(j);G=he.slice(de,de+r)}C.push({aabb:a[j].aabb,rect:a[j].rect,detectorScore:a[j].score,topId:X.topId,identity:X.identity,displayId:X.displayId,score:X.similarity,margin:X.margin,orientation:J,retried:M,tauPassed:K,accepted:cn(X,c),embedding:G,...V?{geometric:V.geometric}:{}})}return C},q=Y(!0),ue=l!==null&&!U?Y(!1):null;return{proposals:q,kept:m$(q,f$(q)),retried:v.length,embeddings:a.length+3*v.length,...O!==void 0?{geometricMs:O}:{},...ue?{base:{proposals:ue,kept:m$(ue,f$(ue))}}:{},...U?{geometricError:L}:{}}}var es={tau:.62,delta:.05,rotationRetry:!0},Qo=-2,Ei=class{constructor(t,n=es,o=new dn){this.bank=t;this.rule=n;this.contract=qt[t.preprocessing],this.rowShown=t.ids.map(l=>o.shown(l));let u=new Map;this.rowIdent=new Int32Array(t.ids.length);for(let l=0;l<t.ids.length;l++){let d=o.of(t.ids[l]),c=u.get(d);c===void 0&&(c=this.identRep.length,u.set(d,c),this.identRep.push(d)),this.rowIdent[l]=c}this.scratch=new Float64Array(t.ids.length)}bank;rule;rowIdent;identRep=[];rowShown;scratch;contract;get size(){return this.bank.ids.length}get dim(){return this.bank.dim}get tau(){return this.rule.tau}get preprocessing(){return this.contract}topAndOther(t,n){let{matrix:o,dim:u,ids:l}=this.bank,d=this.scratch,c=Qo,s=-1;for(let a=0;a<l.length;a++){let p=0,h=a*u;for(let m=0;m<u;m++)p+=o[h+m]*t[n+m];d[a]=p,p>c&&(c=p,s=a)}let r=Qo,i=s>=0?this.rowIdent[s]:-1;for(let a=0;a<l.length;a++)this.rowIdent[a]!==i&&d[a]>r&&(r=d[a]);return{bestRow:s,best:c,other:r}}matchScored(t,n){let{bestRow:o,best:u,other:l}=this.topAndOther(t,n),d=this.bank.ids[o];return{cardId:u>=this.rule.tau?d:null,similarity:u,topId:d,identity:this.identRep[this.rowIdent[o]],displayId:this.rowShown[o],margin:u-l}}scoreRow(t,n){let{matrix:o,dim:u,ids:l}=this.bank,d=new Float64Array(l.length);for(let c=0;c<l.length;c++){let s=0,r=c*u;for(let i=0;i<u;i++)s+=o[r+i]*t[n+i];d[c]=s}return d}rankCards(t){let n=Array.from({length:t.length},(l,d)=>d);n.sort((l,d)=>t[d]-t[l]);let o=new Set,u=[];for(let l of n){let d=this.bank.ids[l];o.has(d)||(o.add(d),u.push({cardId:d,cosine:t[l]}))}return u}columns=null;columnsOf(t){return this.columns===null&&(this.columns=new Map,this.bank.ids.forEach((n,o)=>{let u=this.columns.get(n);u?u.push(o):this.columns.set(n,[o])})),this.columns.get(t)??[]}bankIdSet=null;get bankIds(){return this.columnsOf(""),this.bankIdSet??=new Set(this.columns.keys()),this.bankIdSet}scored(t,n,o){let u=this.bank.ids[t];return{cardId:n>=this.rule.tau?u:null,similarity:n,topId:u,identity:this.identRep[this.rowIdent[t]],displayId:this.rowShown[t],margin:n-o,row:t}}lookOf(t){let n=0;for(let d=1;d<t.length;d++)t[d]>t[n]&&(n=d);let o=this.rowIdent[n],u=Qo,l=!1;for(let d=0;d<t.length;d++)this.rowIdent[d]!==o&&((!l||t[d]>u)&&(u=t[d]),l=!0);return this.scored(n,t[n],u)}lookWithin(t,n){let o=this.rowIdent[n],u=-1,l=Qo,d=!1;for(let c=0;c<t.length;c++)this.rowIdent[c]===o?(u<0||t[c]>t[u])&&(u=c):((!d||t[c]>l)&&(l=t[c]),d=!0);return this.scored(u,t[u],l)}matchPooled(t,n=this.rule.delta){let{bestRow:o,best:u,other:l}=this.topAndOther(t,0),d=u-l;return{cardId:u>=this.rule.tau&&d>=n?this.rowShown[o]:null,similarity:u,margin:d}}};var Ai=class{constructor(t=3){this.k=t;if(!Number.isInteger(t)||t<1)throw new RangeError(`k must be a positive integer, got ${t}`)}k;run=0;misses=0;showing=!1;reset(){this.run=0,this.misses=0,this.showing=!1}observe(t){return t?(this.run+=1,this.misses=0,this.run>=this.k&&(this.showing=!0)):(this.run=0,this.misses+=1,this.misses>=this.k&&(this.showing=!1)),{confirmed:this.showing,consecutive:this.run}}};var ZA=.4,YA=2,JA=5,QA=2,eP="track_";function y$(e){let t=e[0].length,n=new Float32Array(t);for(let l of e)for(let d=0;d<t;d++)n[d]=n[d]+l[d];let o=0;for(let l=0;l<t;l++)o+=n[l]*n[l];let u=Math.sqrt(o);if(!(u>0))return null;for(let l=0;l<t;l++)n[l]=n[l]/u;return n}var Pi=class{constructor(t){this.identityResolver=t}identityResolver;tracks=[];nextId=1;reset(){this.tracks=[]}identityOf(t){if(t.embeddings.length===0)return null;let n=y$(t.embeddings);return n?this.identityResolver(n):null}update(t){let n=new Set(t.map((o,u)=>u));for(let o of this.tracks){let u=-1,l=ZA;for(let d of n){let c=Pn(o.detection.aabb,t[d].aabb);c>l&&(l=c,u=d)}if(u>=0){let d=t[u];o.detection=d,o.misses=0,o.age+=1,o.embeddings.push(d.embedding),o.embeddings.length>JA&&o.embeddings.shift(),n.delete(u)}else o.misses+=1}this.tracks=this.tracks.filter(o=>o.misses<=YA);for(let o of n){let u=t[o];this.tracks.push({instanceId:`${eP}${String(this.nextId++).padStart(4,"0")}`,detection:u,embeddings:[u.embedding],misses:0,age:1})}return this.tracks.filter(o=>o.misses===0).map(o=>({instanceId:o.instanceId,detection:o.detection,identity:o.age>=QA?this.identityOf(o):null}))}};var tP=.25,rP=5;function nP(e,t){if(e===null||t===void 0)return!1;let n=t-e;return n<-tP||n>rP}function iP(e){return[e.x,e.y,e.width,e.height]}var ki=class{hoverSelection;detector;embedder;recognizer;names;classNames;faceClass;minCropPx;now;tracker;gate=new Ai(3);hoverIds=new Zo;heldCards=[];lastVideoTimeSec=null;geometric;geometricFailure=null;constructor(t){this.detector=t.detector,this.embedder=t.embedder,this.names=t.names,this.classNames=t.classNames??["face","back"],this.faceClass=t.faceClass??$r,this.minCropPx=t.minCropPx??kn,this.hoverSelection=t.hoverSelection??pd,this.now=t.now??(()=>performance.now()),this.geometric=t.geometric??null;let n=new dn(t.identityGroups??null,o=>this.names.has(o),t.identityDisplay??"best-printing");this.recognizer=new Ei(t.bank,t.accept??es,n),this.tracker=new Pi(o=>this.recognizer.matchPooled(o).cardId)}get size(){return this.recognizer.size}takeGeometricFailure(){let t=this.geometricFailure;return this.geometricFailure=null,t}get geometricStage(){return this.geometric}setGeometric(t){this.geometric=t,this.geometricFailure=null}reset(){this.tracker.reset(),this.gate.reset(),this.heldCards=[],this.hoverIds.reset(),this.lastVideoTimeSec=null}async analyze(t,n){let o=this.now(),u=nP(this.lastVideoTimeSec,n);u&&this.reset(),n!==void 0&&(this.lastVideoTimeSec=n);let l=await this.detector.propose(t),d=this.now()-o,c=l.filter(A=>Vo(A.aabb,t.width,t.height,this.minCropPx)).map(A=>q2(A,t)),{faces:s}=H2(c,this.faceClass),r=this.now(),i=await bd(t,this.embedder,this.recognizer,s,this.minCropPx,this.geometric),a=this.now()-r;if(i.geometricError!==void 0&&this.geometric&&(this.geometricFailure={stage:this.geometric,error:i.geometricError},this.geometric=null),i.proposals.length!==s.length)throw new Error("pipeline: a valid face box was not recognized");let p={frameWidth:t.width,frameHeight:t.height,names:this.names},h=Yo(i,this.hoverSelection),m=s.map(A=>c.indexOf(A)),b=hd(h,this.hoverIds.assign(h),p,A=>m[A]),$=i.base??i,v=$.kept.map(A=>{let k=$.proposals[A];return{aabb:k.aabb,rect:k.rect,cardId:k.topId,embedding:k.embedding}}),y=this.tracker.update(v),T=v.length>0,I=this.gate.observe(T),S;return I.confirmed?T?(S=Xo(y.map(A=>({instanceId:A.instanceId,aabb:A.detection.aabb,rect:A.detection.rect,identity:A.identity})),p),this.heldCards=S):S=this.heldCards:(this.heldCards=[],S=[]),{frame:{width:t.width,height:t.height},boxes:this.boxResults(c,s,i),hover:{selection:this.hoverSelection,cards:b},tracks:{shown:I.confirmed,cards:S},discontinuity:u,retried:i.retried,embeddings:i.embeddings,timings:{detectorMs:d,recognizeMs:a,analyzeMs:this.now()-o,...i.geometricMs!==void 0?{geometricMs:i.geometricMs}:{}}}}boxResults(t,n,o){let u=new Map(n.map((d,c)=>[d,c])),l=new Set(o.kept);return t.map(d=>{let c=u.get(d),s=null;if(c!==void 0){let r=o.proposals[c],i=r.accepted&&this.names.has(r.displayId)?r.displayId:null;s={topId:r.topId,topName:this.names.get(r.topId)??null,similarity:r.score,margin:r.margin,look:r.orientation,retried:r.retried,tauPassed:r.tauPassed,accepted:r.accepted,cardId:i,name:i===null?null:this.names.get(i)??null,kept:l.has(c),...r.geometric?{geometric:r.geometric}:{}}}return{box:iP(d.aabb),score:d.score,cls:d.cls,className:this.classNames[d.cls]??String(d.cls),face:s}})}};function _$(e,t=e.hover.selection){let n=e.boxes.flatMap((s,r)=>s.face!==null?[r]:[]),o=n.map(s=>e.boxes[s]),u=new Map,l=o.map(s=>{let r=s.face;r.cardId!==null&&r.name!==null&&u.set(r.cardId,r.name);let i={x:s.box[0],y:s.box[1],width:s.box[2],height:s.box[3]};return{aabb:i,rect:{cx:i.x+i.width/2,cy:i.y+i.height/2,w:i.width,h:i.height,angle:0},score:r.similarity,detectorScore:s.score,accepted:r.cardId!==null,displayId:r.cardId??r.topId}}),d=o.flatMap((s,r)=>s.face.kept?[r]:[]),c=Yo({proposals:l,kept:d},t);return hd(c,c.map((s,r)=>`${t}_${r}`),{frameWidth:e.frame.width,frameHeight:e.frame.height,names:u},s=>n[s])}function yd(e,t,n,o){let u=o===void 0||o===e.hover.selection?e.hover.cards:_$(e,o);return fd(u,{x:t,y:n},e.frame)}var w$=1,v$="vision-release",oP=[8,16,32];function x$(e,t){return oP.reduce((n,o)=>n+Math.floor(e/o)*Math.floor(t/o),0)}var sP=/^[0-9a-f]{16}$/,aP=/^[0-9a-f]{64}$/,uP=/^\d+\.\d+\.\d+$/,lP=["schemaVersion","kind","id","game","locale","detector","recognizer","bank","identity","catalog","accept","hover","runtime"],$$=["tau","delta","rotationRetry"],Ue=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),dt=e=>typeof e=="number"&&Number.isInteger(e)&&e>0,Ni=e=>typeof e=="number"&&Number.isFinite(e),Ye=e=>typeof e=="string"&&e.trim()!=="";function dP(e){return!Ye(e)||e.includes("\\")||/^[A-Za-z][A-Za-z0-9+.-]*:/.test(e)||/[\x00-\x1f\x7f]/.test(e)||/^ | $/.test(e)||e.startsWith("/")?!1:!e.split("/").some(t=>{let n=t.replace(/%2e/gi,".");return n==="."||n===".."})}function Di(e){return!Ue(e)||!dP(e.path)||typeof e.sha256!="string"||!aP.test(e.sha256)||!dt(e.bytes)?null:{path:e.path,sha256:e.sha256,bytes:e.bytes}}function cP(e){let t=e.input,n=e.decode;if(!Ue(t)||!dt(t.width)||!dt(t.height))return"detector.input must give a width and a height";if(!Ue(n))return"detector.decode must be an object";if(!Ye(n.inputName)||!Ye(n.outputName))return"detector.decode must name the model's input and output";let o=[["layout","NCHW"],["channels","BGR"],["scale","0-255"],["score","obj * max(cls)"],["class","argmax(cls)"]];for(let[i,a]of o)if(n[i]!==a)return`detector.decode.${i} is not ${JSON.stringify(a)}, the contract this runtime implements`;let u=n.letterbox;if(!Ue(u)||u.width!==t.width||u.height!==t.height)return"detector.decode.letterbox differs from detector.input";if(typeof u.pad!="number"||!Number.isInteger(u.pad)||u.pad<0||u.pad>255)return"detector.decode.letterbox.pad must be a whole number from 0 to 255";let l=[["anchor","top-left"],["resize","pillow-bilinear"],["ratio","min(height / frameHeight, width / frameWidth)"],["size","round(frame * ratio)"]];for(let[i,a]of l)if(u[i]!==a)return`detector.decode.letterbox.${i} is not ${JSON.stringify(a)}`;let d=n.classes;if(!Array.isArray(d)||d.length===0||!d.every(Ye)||new Set(d).size!==d.length)return"detector.decode.classes must be a list of distinct class names";if(e.faceClass!==$r||d[$r]!=="face")return`detector.faceClass must be ${$r} and that class must be named "face"`;let c=n.output,s=["cx","cy","w","h","obj",...d.map(i=>`cls_${i}`)];if(!Ue(c)||!Array.isArray(c.columns)||c.columns.length!==s.length||!c.columns.every((i,a)=>i===s[a]))return"detector.decode.output.columns must be cx, cy, w, h, obj and one cls_<name> per class";if(c.anchors!==x$(t.width,t.height))return`detector.decode.output.anchors must be ${x$(t.width,t.height)} for a ${t.width} x ${t.height} input`;if(!Ni(n.threshold)||!(n.threshold>0&&n.threshold<1))return"detector.decode.threshold must be a number between 0 and 1";if(n.threshold<.01)return`detector.decode.threshold ${n.threshold} is below 0.01, the lowest score at which the detector export checks box parity`;let r=n.nms;return!Ue(r)||!Ni(r.iou)||!(r.iou>0&&r.iou<=1)||r.classAgnostic!==!0||r.greedy!==!0?"detector.decode.nms must give an iou above 0 and at most 1, with classAgnostic and greedy both true":dt(n.maxProposals)?dt(e.minCropPx)?{inputName:n.inputName,outputName:n.outputName,letterbox:{width:t.width,height:t.height,pad:u.pad},anchors:c.anchors,classes:d,decode:{threshold:n.threshold,nmsIou:r.iou,maxProposals:n.maxProposals},faceClass:$r,minCropPx:e.minCropPx}:"detector.minCropPx must be a whole number above 0":"detector.decode.maxProposals must be a whole number above 0"}function S$(e){let t=S=>({error:S});if(!Ue(e)||e.schemaVersion!==w$||e.kind!==v$)return t(`not a "${v$}" document of schema version ${w$}`);let n=Object.keys(e).filter(S=>!lP.includes(S));if(n.length>0)return t(`unknown key(s) ${n.sort().join(", ")}`);if(typeof e.id!="string"||!sP.test(e.id))return t("id must be 16 lowercase hex digits");if(!Ye(e.game)||!Ye(e.locale))return t("game and locale must be non-empty strings");let o=e.detector;if(!Ue(o))return t("incomplete release: detector missing (a release is all-or-nothing)");let u=Di(o);if(!u||!Ye(o.version)||!Ye(o.weights))return t("detector must pin a file and carry a version and a weights label");if(o.arm!=="yolox")return t(`detector.arm ${JSON.stringify(o.arm)} is not one this runtime implements`);let l=cP(o);if(typeof l=="string")return t(l);let d=e.recognizer;if(!Ue(d))return t("incomplete release: recognizer missing (a release is all-or-nothing)");let c=Di(d);if(!c||!Ye(d.version)||!Ye(d.weights)||!dt(d.dim))return t("recognizer must pin a file and carry a version, a weights label and a dim");if(!Ye(d.inputName)||!Ye(d.outputName))return t("recognizer must name the model's input and output");let s=Wo(d.preprocessing);if(s===null)return t(`recognizer.preprocessing is not a contract this runtime implements (known: ${Object.keys(qt).join(", ")})`);let r=e.bank;if(!Ue(r))return t("incomplete release: bank missing (a release is all-or-nothing)");let i=Di(r);if(!i||!dt(r.version)||!dt(r.cardCount)||!dt(r.entryCount))return t("bank must pin a file and carry a version, a cardCount and an entryCount");if(r.aggregation!=="mean")return t('bank.aggregation must be "mean"');let a=e.identity;if(!Ue(a)||!gd(a.level))return t('identity.level must be "name" or "printing"');let p=a.groups,h=Di(p);if(!h||!Ue(p)||!dt(p.version))return t("incomplete release: identity.groups must pin a file and carry a version");if(a.display!=="best-printing"&&a.display!=="representative")return t(`identity.display ${JSON.stringify(a.display)} is not one of best-printing, representative`);let m=e.catalog,b=Di(m);if(!b||!Ue(m)||!dt(m.cardCount))return t("incomplete release: catalog must pin a file and carry a cardCount");let $=e.accept;if(!Ue($))return t("incomplete release: accept missing (a release is all-or-nothing)");if(Object.keys($).some(S=>!$$.includes(S)))return t(`accept has unknown key(s) (expected ${$$.join(", ")})`);if(!Ni($.tau)||!($.tau>0&&$.tau<=1))return t("accept.tau must be a number above 0 and at most 1");if(!Ni($.delta)||!($.delta>=0&&$.delta<1))return t("accept.delta must be a number from 0 to below 1");if(typeof $.rotationRetry!="boolean")return t("accept.rotationRetry must be true or false");let v=e.hover;if(!Ue(v)||!l$(v.selection))return t("hover.selection is not one of accepted-nms, best-score, detector-score");if(!dt(v.maxAgeMs))return t("hover.maxAgeMs must be a whole number above 0");let y=e.runtime;if(!Ue(y)||typeof y.ortWeb!="string"||!uP.test(y.ortWeb))return t("runtime.ortWeb must be an exact version of the form 1.2.3");if(y.wasmThreads!==1)return t("runtime.wasmThreads must be 1");let T=y.executionProviders;if(!Array.isArray(T)||T.length===0||new Set(T).size!==T.length||!T.every(S=>Jo.includes(S)))return t(`runtime.executionProviders must list one or more of ${Jo.join(", ")}, each once`);let I=y.analysisWidth;return!Ue(I)||!dt(I.min)||!dt(I.max)||I.min>I.max?t("runtime.analysisWidth must give whole numbers min <= max above 0"):{release:{id:e.id,game:e.game,locale:e.locale,detector:{...u,arm:"yolox",version:o.version,weights:o.weights,settings:l},recognizer:{...c,version:d.version,weights:d.weights,dim:d.dim,inputName:d.inputName,outputName:d.outputName,preprocessing:s},bank:{...i,version:r.version,cardCount:r.cardCount,entryCount:r.entryCount},identity:{level:a.level,groups:{...h,version:p.version},display:a.display},catalog:{...b,cardCount:m.cardCount},accept:{tau:$.tau,delta:$.delta,rotationRetry:$.rotationRetry},hover:{selection:v.selection,maxAgeMs:v.maxAgeMs},runtime:{ortWeb:y.ortWeb,executionProviders:T,wasmThreads:1,analysisWidth:{min:I.min,max:I.max}}}}}function pP(e){let t=0,n=()=>{throw new Error("not JSON")},o=()=>{for(;t<e.length&&` 	
\r`.includes(e[t]);)t++},u=()=>{let c=t;for(e[t]!=='"'&&n(),t++;t<e.length&&e[t]!=='"';)t+=e[t]==="\\"?2:1;return t>=e.length&&n(),t++,JSON.parse(e.slice(c,t))},l=c=>{o();let s=e[t];if(s==="{"){t++;let i=[];if(o(),e[t]==="}")t++;else for(;;){o();let a=u();o(),e[t]!==":"&&n(),t++;let p=l(!1);if(c&&a==="id"||i.push([a,p]),o(),e[t]===",")t++;else if(e[t]==="}"){t++;break}else n()}return i.sort((a,p)=>a[0]<p[0]?-1:a[0]>p[0]?1:0),`{${i.map(([a,p])=>`${JSON.stringify(a)}:${p}`).join(",")}}`}if(s==="["){t++;let i=[];if(o(),e[t]==="]")t++;else for(;;)if(i.push(l(!1)),o(),e[t]===",")t++;else if(e[t]==="]"){t++;break}else n();return`[${i.join(",")}]`}if(s==='"')return JSON.stringify(u());let r=/^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(e.slice(t,t+64));return r?(t+=r[0].length,r[0]):n()};o(),e[t]!=="{"&&n();let d=l(!0);return o(),t!==e.length&&n(),d}async function hP(e,t){let n=new TextEncoder().encode(pP(e));return(await t(n.buffer)).slice(0,16)}async function fP(e){let t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t),n=>n.toString(16).padStart(2,"0")).join("")}var _d={fetchFn:e=>fetch(e),digestSha256Hex:fP};function mP(e,t){let n=l=>/^(\d+)\.(\d+)\.\d+/.exec(l),o=n(e),u=n(t);return o!==null&&u!==null&&o[1]===u[1]&&o[2]===u[2]}var qe=class extends Error{};async function I$(e,t,n){let o;try{o=await e.fetchFn(t)}catch(u){throw new qe(`${n}: fetch failed (${String(u)})`)}if(!o.ok)throw new qe(`${n}: HTTP ${o.status}`);return o.arrayBuffer()}async function Ri(e,t,n,o){let u=await I$(e,new URL(n.path,t).href,o);if(u.byteLength!==n.bytes)throw new qe(`${o}: ${n.path} is ${u.byteLength} bytes, the release says ${n.bytes}`);if(await e.digestSha256Hex(u)!==n.sha256)throw new qe(`${o}: sha256 of ${n.path} does not match the release`);return u}function ts(e,t){try{return JSON.parse(new TextDecoder("utf-8",{fatal:!0}).decode(e))}catch{throw new qe(`${t}: the file is not JSON`)}}var gP=/^[a-z][a-zA-Z0-9]*$/,bP=["key","label","values","type"],T$=e=>typeof e=="string"?"text":"number",tr=e=>JSON.stringify(e)??String(e);function O$(e,t,n){for(let o=0;o<e.length;o++){let u=e[o];if(!(Ye(u)||Ni(u)))return`${n}: ${tr(u)} is not a facet value (a non-empty string or a number)`;if(t=t??T$(u),T$(u)!==t)return`${n}: ${tr(u)} is not ${t==="text"?"text":"a number"}, and the facet's values are ${t==="text"?"text":"numbers"}`;if(e.slice(0,o).includes(u))return`${n}: ${tr(u)} is listed twice`}return t}function yP(e){if(!Array.isArray(e))return'"facets" must be a list of objects, each with a "key" and a "label"';let t=[];for(let[n,o]of e.entries()){let u=`facets[${n}]`;if(!Ue(o)||!("key"in o)||!("label"in o))return`${u} must be an object with a "key" and a "label"`;let l=Object.keys(o).filter(r=>!bP.includes(r));if(l.length>0)return`${u}: unknown key(s) ${l.join(", ")}`;if(typeof o.key!="string"||!gP.test(o.key))return`${u}: "key" ${tr(o.key)} must be a lowercase letter, then letters and digits only`;let d=o.key;if(d==="kind")return`${u}: "key" "kind" is reserved: the card's kind is always the first filter`;if(t.some(r=>r.key===d))return`${u}: duplicate key ${tr(d)}`;if(!Ye(o.label))return`${u} (${d}): "label" must be a non-empty string`;let c=null;if("type"in o){if(o.type!=="text"&&o.type!=="number")return`${u} (${d}): "type" must be "text" or "number", not ${tr(o.type)}`;c=o.type}let s=null;if("values"in o){if(!Array.isArray(o.values)||o.values.length===0)return`${u} (${d}): "values" must be a non-empty list`;let r=O$(o.values,c,`${u} (${d}) values`);if(r!=="text"&&r!=="number")return r;c=r,s=o.values}t.push({key:d,label:o.label,type:c,values:s})}return t}function _P(e,t,n,o){let u=`card ${n}`;if(!Ue(e))return`${u}: "facets" must be an object of facet key to a value or a list of values`;for(let[l,d]of Object.entries(e)){let c=t.find(i=>i.key===l);if(c===void 0)return`${u}: facets.${l}: the catalog declares no facet ${tr(l)}`;let s=Array.isArray(d)?d:[d];if(s.length===0)return`${u}: facets.${l} is an empty list (leave the key out instead)`;let r=O$(s,c.type,`${u}: facets.${l}`);if(r!=="text"&&r!=="number")return r;c.type=r;for(let i of s){if(c.values!==null&&!c.values.includes(i))return`${u}: facets.${l}: ${tr(i)} is not one of the declared values`;let a=o.get(l)??[];a.includes(i)||a.push(i),o.set(l,a)}}return null}function wP(e){if(!Ue(e)||!Ye(e.game)||!Ye(e.locale)||!Array.isArray(e.cards)||e.cards.length===0)return"the file is not a catalog (game, locale and a list of cards)";let t=e.identity===void 0?"name":e.identity;if(!gd(t))return`"identity" must be "name" or "printing", not ${JSON.stringify(e.identity)}`;let n=e.facets===void 0?[]:yP(e.facets);if(typeof n=="string")return n;let o=new Map,u=new Map,l=[];for(let c of e.cards){if(!Ue(c)||!Ye(c.id)||!Ye(c.name))return"every card needs an id, a name and an art path";if(!("art"in c)||c.art!==null&&!Ye(c.art))return`card ${c.id}: "art" must be an art path (a file path or an http(s) URL), or null for a card without art`;if(u.has(c.id))return`card id ${c.id} appears twice`;let s=c.printingOf??null;if(s!==null&&!Ye(s))return`card ${c.id}: "printingOf" must be a card id or null`;let r=c.facets===void 0?null:_P(c.facets,n,c.id,o);if(r!==null)return r;if(c.extra!==void 0&&!Ue(c.extra))return`card ${c.id}: "extra" must be an object (any keys and values), not ${tr(c.extra)}`;let i={id:c.id,name:c.name,art:c.art,printingOf:s};c.extra!==void 0&&(i.extra=c.extra),u.set(i.id,i),l.push(i)}if(t==="printing")for(let c of l){if(c.printingOf===null)continue;let s=u.get(c.printingOf);if(s===void 0||s===c)return`card ${c.id}: "printingOf" names ${c.printingOf}, which is not another card`;if(s.printingOf!==null)return`card ${c.id}: "printingOf" names ${c.printingOf}, which is itself a printing of ${s.printingOf}`}let d=n.map(c=>{let s=c.values??[...o.get(c.key)??[]];return c.values===null&&c.type==="number"&&s.sort((r,i)=>r-i),{key:c.key,label:c.label,type:c.type??"text",values:[...s]}});return{game:e.game,locale:e.locale,identity:t,cards:l,facets:d}}async function wd(e,t=_d,n={}){try{let o=await I$(t,e,"release"),u=S$(ts(o,"release"));if("error"in u)throw new qe(`release: ${u.error}`);let l=u.release,d=await hP(new TextDecoder().decode(o),t.digestSha256Hex);if(d!==l.id)throw new qe(`release: id ${l.id} is not the hash of the document (which is ${d})`);if(n.ortWeb!==void 0&&!mP(l.runtime.ortWeb,n.ortWeb))throw new qe(`release: measured on onnxruntime-web ${l.runtime.ortWeb}, this build runs ${n.ortWeb} (major and minor version must match)`);try{n.onDocument?.([l.detector,l.recognizer,l.bank,l.identity.groups,l.catalog].reduce((U,Y)=>U+Y.bytes,0))}catch{}let[c,s,r,i,a]=await Promise.all([Ri(t,e,l.detector,"detector"),Ri(t,e,l.recognizer,"recognizer"),Ri(t,e,l.bank,"bank"),Ri(t,e,l.identity.groups,"identity.groups"),Ri(t,e,l.catalog,"catalog")]),p=new Uint8Array(r),h=ld(p);if(h!==null&&h!==Ko)throw new qe(`bank: the binary bank is of format version ${h}, and this runtime reads version ${Ko} only`);let m=ud(p)?o$(p):ad(ts(r,"bank"));if(!m)throw new qe("bank: the file is not a bank this runtime can read");let b=[[m.version===l.bank.version,"bank.version differs from the bank file's"],[m.model===l.recognizer.version,`bank: the file's model ${JSON.stringify(m.model)} is not recognizer.version ${JSON.stringify(l.recognizer.version)}`],[m.dim===l.recognizer.dim,"bank: the vector size differs from recognizer.dim"],[m.preprocessing===l.recognizer.preprocessing,"bank: the file's preprocessing differs from recognizer.preprocessing"],[m.ids.length===l.bank.entryCount,"bank.entryCount is not the number of entries in the bank file"],[new Set(m.ids).size===l.bank.cardCount,"bank.cardCount is not the number of distinct card ids in the bank file"],[m.tau===null||m.tau===l.accept.tau,`bank: the file records tau ${m.tau}, accept.tau is ${l.accept.tau}`]];for(let[U,Y]of b)if(!U)throw new qe(Y);let $=wP(ts(a,"catalog"));if(typeof $=="string")throw new qe(`catalog: ${$}`);if($.game!==l.game||$.locale!==l.locale)throw new qe("catalog: the file is for another game or locale");if($.cards.length!==l.catalog.cardCount)throw new qe(`catalog.cardCount ${l.catalog.cardCount} is not the file's ${$.cards.length} cards`);let v=new Map($.cards.map(U=>[U.id,U.name])),y=m.ids.filter(U=>!v.has(U));if(y.length>0)throw new qe(`${new Set(y).size} bank id(s) are not in the catalog (e.g. ${y[0]})`);let T=ts(i,"identity.groups"),I=md(T);if(!I)throw new qe("identity.groups: the file is not an identity-groups document");if(I.version!==l.identity.groups.version)throw new qe("identity.groups.version differs from the file's");if((Ue(T)&&Ue(T.bank)?T.bank.sha256:void 0)!==l.bank.sha256)throw new qe("identity.groups: the file was not made for this release's bank (its bank sha256 differs)");let A=$.identity;if(l.identity.level!==A)throw new qe(`identity.level is "${l.identity.level}", and the catalog states the identity rule "${A}": a release is used with the rule its catalog states`);if((Ue(T)&&Ue(T.rule)?T.rule.level:void 0)!==A)throw new qe(`identity.groups: the file's groups are not by ${A}`);let O=new Map($.cards.map(U=>[U.id,p$(U,A)])),L=U=>JSON.stringify(U.map(Y=>[...Y].sort()).sort((Y,q)=>Y[0]<q[0]?-1:Y[0]>q[0]?1:0));if(L(I.groups)!==L(h$(m.ids,O)))throw new qe(`identity.groups: the groups are not the ones the catalog's ${A==="name"?"names give":"identity rule gives"} for the bank's ids`);return{ok:!0,data:{release:l,detectorBytes:new Uint8Array(c),recognizerBytes:new Uint8Array(s),bank:m,identityGroups:I,cards:$.cards,names:v}}}catch(o){return{ok:!1,reason:o instanceof qe?o.message:`unexpected: ${String(o)}`}}}async function vP(e){for(let t of e)try{await t?.release?.()}catch{}}async function E$(e,t,n=e.release.runtime.executionProviders){let{release:o}=e,u=null,l=null,d=async c=>(await vP([u,l]),{error:c});try{if(n.length===0)return await d("no execution provider to try");let c=o.recognizer;return u=await t.embedder(e.recognizerBytes,{inputName:c.inputName,outputName:c.outputName,inputSize:qt[c.preprocessing].size,dim:c.dim},n),u?(l=await t.detector(e.detectorBytes,o.detector.settings,n),l?{pipeline:new ki({detector:l,embedder:u,bank:e.bank,accept:o.accept,identityGroups:e.identityGroups,identityDisplay:o.identity.display,names:e.names,hoverSelection:o.hover.selection,classNames:o.detector.settings.classes,faceClass:o.detector.settings.faceClass,minCropPx:o.detector.settings.minCropPx}),embedder:u,detector:l,providers:[...n]}:await d("detector: the model did not initialize on any execution provider, or is not the model the release describes")):await d("recognizer: the model did not initialize on any execution provider, or is not the model the release describes")}catch(c){return await d(`unexpected while building: ${String(c)}`)}}var zi=class extends Error{constructor(n){super(`the release could not be loaded: ${n}`);this.reason=n;this.name="ReleaseError"}reason};function xP(e){return async t=>{if(!t.startsWith(Cn))throw new Error(`${t} is not one of the release's files`);let n=Q2(t.slice(Cn.length)),o=Object.hasOwn(e,n)?e[n]:void 0;if(o===void 0)throw new Error(`no file ${n} among the release's files`);return{ok:!0,status:200,arrayBuffer:()=>o.arrayBuffer()}}}var $P={embedder:(e,t,n)=>Si.create(e,t,n),detector:(e,t,n)=>Ti.create(e,t,n)};async function TP(e,t={}){let n=t.files?Cn:typeof location<"u"?location.href:void 0,o=new URL(e,n).href,u=r=>{try{t.onProgress?.(r)}catch{}};u({phase:"downloading",bytes:null});let l={..._d,...t.deps,...t.files?{fetchFn:xP(t.files)}:{}},d=await wd(o,l,{ortWeb:j2(),...t.onProgress?{onDocument:r=>u({phase:"downloading",bytes:r})}:{}});if(!d.ok)throw new zi(d.reason);u({phase:"preparing"});let{data:c}=d;U2({wasmThreads:c.release.runtime.wasmThreads,...t.wasmPaths!==void 0?{wasmPaths:t.wasmPaths}:{}}),Zl();let s=await E$(c,$P,t.providers??c.release.runtime.executionProviders);if("error"in s){let r=Zl();throw new zi(r.length>0?`${s.error} (${r.join("; ")})`:s.error)}return{release:c.release,pipeline:s.pipeline,backend:{detector:s.detector.ep,recognizer:s.embedder.ep},cards:c.cards,names:c.names,stageInputs:{bankSha256:c.release.bank.sha256,bankIds:[...new Set(c.bank.ids)],identities:J2(c.cards,c.release.identity.level,c.identityGroups)},dispose:async()=>{await s.embedder.release?.(),await s.detector.release?.()}}}function SP(e,t,n){return e.pipeline.analyze(t,n)}function rs(e){return e==="wasm"?2e3:1e3}function IP(e){return e==="wasm"?1e3:500}function ns(e,t){return t==="always-on"?rs(e):IP(e)}var OP=1920,EP=720;function k$(e,t,n={min:720,max:1920}){let o=Math.max(n.min,Math.min(n.max,e));return{width:o,height:Math.round(o*t/e)}}function Mi(e){return e instanceof HTMLVideoElement?{width:e.videoWidth,height:e.videoHeight}:{width:e.naturalWidth,height:e.naturalHeight}}function Nn(e){return e instanceof HTMLVideoElement?e.currentTime:0}async function vd(e,t,n,o){let u=Mi(e),l=k$(u.width,u.height,o);t.width=l.width,t.height=l.height;let d=performance.now(),c=Nn(e);return n.drawImage(e,0,0,t.width,t.height),{bitmap:await createImageBitmap(t),videoTimeSec:c,tapMs:performance.now()-d}}var A$=128,P$=.06,AP=.5,C$=60,os=class{ref=null;seeded=!1;seed(t){this.ref=t,this.seeded=!0}reset(){this.ref=null,this.seeded=!1}get hasReference(){return this.ref!==null}observe(t,n){let o=this.ref;if(o===null||o.width!==t.width||o.height!==t.height)return this.ref=t,this.seeded=!1,{distance:null,cut:!1};let u=CP(o,t,n);return u===null?{distance:u,cut:!1}:u>P$?{distance:u,cut:!0}:((this.seeded||u<=P$*AP)&&(this.ref=t),this.seeded=!1,{distance:u,cut:!1})}};function PP(e,t){return{width:A$,height:Math.max(1,Math.round(A$*t/Math.max(1,e)))}}function kP(e,t,n){let o=new Uint8Array(t*n);for(let u=0,l=0;u<o.length;u+=1,l+=4)o[u]=77*e[l]+150*e[l+1]+29*e[l+2]>>8;return o}function CP(e,t,n){if(e.width!==t.width||e.height!==t.height||!(n.width>0)||!(n.height>0))return null;let{width:o,height:u}=e,l=is(Math.floor(n.x*o),0,o-1),d=is(Math.ceil((n.x+n.width)*o),l+1,o),c=is(Math.floor(n.y*u),0,u-1),s=is(Math.ceil((n.y+n.height)*u),c+1,u),r=0;for(let i=c;i<s;i+=1)for(let a=l;a<d;a+=1){let p=i*o+a;r+=Math.abs(e.luma[p]-t.luma[p])}return r/((d-l)*(s-c)*255)}function is(e,t,n){return Math.min(n,Math.max(t,e))}var DP=3,RP=`#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`,NP=`#version 300 es
precision mediump float;
in vec2 uv;
uniform sampler2D frame;
out vec4 color;
void main() {
  color = texture(frame, uv);
}`;function D$(){try{return zP()}catch{return null}}function zP(){let e=document.createElement("canvas"),t=e.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:"low-power"});if(!t)return null;let n=t.createProgram();for(let[p,h]of[[t.VERTEX_SHADER,RP],[t.FRAGMENT_SHADER,NP]]){let m=t.createShader(p);if(!m)return null;t.shaderSource(m,h),t.compileShader(m),t.attachShader(n,m)}if(t.linkProgram(n),!t.getProgramParameter(n,t.LINK_STATUS))return null;t.useProgram(n);let o=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW);let u=t.getAttribLocation(n,"p");t.enableVertexAttribArray(u),t.vertexAttribPointer(u,2,t.FLOAT,!1,0,0);let l=t.createTexture();t.bindTexture(t.TEXTURE_2D,l),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let d=[],c=1,s=!0,r=new Uint8Array(0);e.addEventListener("webglcontextlost",()=>{s=!1});function i(p){return d.find(h=>h.ticket===p)}function a(p){p.fence&&t.deleteSync(p.fence),p.fence=null,p.ticket=null}return{get usable(){return s&&!t.isContextLost()},sample(p){let h=Mi(p);if(!this.usable||h.width===0||h.height===0)return null;let m=d.find(y=>y.ticket===null);if(!m){if(d.length>=DP)return null;let y=t.createBuffer();if(!y)return null;m={pbo:y,fence:null,width:0,height:0,ticket:null},d.push(m)}let{width:b,height:$}=PP(h.width,h.height);try{(e.width!==b||e.height!==$)&&(e.width=b,e.height=$),t.viewport(0,0,b,$),t.bindTexture(t.TEXTURE_2D,l),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,p),t.generateMipmap(t.TEXTURE_2D),t.drawArrays(t.TRIANGLE_STRIP,0,4),t.bindBuffer(t.PIXEL_PACK_BUFFER,m.pbo),(m.width!==b||m.height!==$)&&(t.bufferData(t.PIXEL_PACK_BUFFER,b*$*4,t.STREAM_READ),m.width=b,m.height=$),t.readPixels(0,0,b,$,t.RGBA,t.UNSIGNED_BYTE,0),t.bindBuffer(t.PIXEL_PACK_BUFFER,null),m.fence=t.fenceSync(t.SYNC_GPU_COMMANDS_COMPLETE,0),t.flush()}catch{return s=!1,null}if(!m.fence)return null;let v={id:c++};return m.ticket=v,v},read(p){let h=i(p);if(!h||!h.fence||!this.usable||t.getSyncParameter(h.fence,t.SYNC_STATUS)!==t.SIGNALED)return null;let m=h.width*h.height*4;r.length!==m&&(r=new Uint8Array(m)),t.bindBuffer(t.PIXEL_PACK_BUFFER,h.pbo),t.getBufferSubData(t.PIXEL_PACK_BUFFER,0,r),t.bindBuffer(t.PIXEL_PACK_BUFFER,null);let b={width:h.width,height:h.height,luma:kP(r,h.width,h.height)};return a(h),b},release(p){if(!p)return;let h=i(p);h&&a(h)},dispose(){if(s=!1,!t.isContextLost()){for(let p of d)a(p),t.deleteBuffer(p.pbo);d.length=0,t.getExtension("WEBGL_lose_context")?.loseContext()}}}}var MP=250,R$=250,BP=1e4,FP=5e3,LP=400,xd=2e3,jP=250,N$=5e3;function $d(e,t){return e===void 0?"stale-request":e.requestId<=t.lastAcceptedRequestId?"superseded":e.requestId!==t.inFlightRequestId?"stale-request":e.videoKey!==t.videoKey?"video-key":e.generation!==t.generation?"generation":null}function z$(e){return e==="video-key"||e==="generation"}var Bi=class{constructor(t,n=3,o="always-on",u=t){this.intervalMs=t;this.confirmFrames=n;this.mode=o;this.readingIntervalMs=u}intervalMs;confirmFrames;mode;readingIntervalMs;pending=!1;repeatsLeft=0;lastStartedAt=-1/0;pointerInside=!1;lastPointerAt=-1/0;tooltipShowing=!1;lastTooltipAt=-1/0;lastHoverTriggerAt=-1/0;lastVideoTimeSec=null;discontinuitySinceLast=!1;lastTriggerKind=null;lookRequested=!1;setIntervalMs(t){this.intervalMs=t}setReadingIntervalMs(t){this.readingIntervalMs=t}setTooltipShowing(t,n){this.tooltipShowing=t,t&&this.pointerInside&&(this.lastTooltipAt=n)}setMode(t){this.mode=t}get analysisMode(){return this.mode}framePresented(){this.pending=!0,this.repeatsLeft=0}discontinuity(){this.discontinuitySinceLast=!0}requestLook(){this.discontinuitySinceLast=!0,this.pending=!0,this.repeatsLeft=0,this.lookRequested=!0}get lookPending(){return this.lookRequested}pointerMoved(t){this.pointerInside=!0,this.lastPointerAt=t}pointerLeft(t){this.pointerInside&&(this.lastPointerAt=t),this.pointerInside=!1,this.lastTooltipAt=-1/0}tapped(t){this.lastPointerAt=t}pointerActive(t){return t-this.lastPointerAt<BP}analysisState(t){return this.mode==="always-on"?"always-on":this.pointerActive(t)?"fast":this.pointerInside&&(this.tooltipShowing||t-this.lastTooltipAt<FP)?"reading":"idle"}analysisActive(t){return this.analysisState(t)!=="idle"}intervalInEffectMs(t){return this.analysisState(t)==="reading"?this.readingIntervalMs:this.intervalMs}due(t){if(!this.analysisActive(t))return!1;if(this.lookRequested)return!0;let n=t-this.lastStartedAt;return this.pending?n>=this.intervalInEffectMs(t):this.repeatsLeft>0&&n>=MP}staleFrameMs(t){return Math.max(LP,this.intervalInEffectMs(t))}frameStale(t,n){return this.lastVideoTimeSec===null||this.discontinuitySinceLast?!0:Math.abs(t-this.lastVideoTimeSec)*1e3>this.staleFrameMs(n)}hoverTriggerDue(t,n,o){return o||!this.analysisActive(t)||t-this.lastHoverTriggerAt<jP?!1:this.frameStale(n,t)}started(t,n={}){this.lastStartedAt=t;let o=n.trigger==="hover",u=n.trigger==="cut"||this.lookRequested;this.lastTriggerKind=o?"hover":u?"cut":this.pending?"cadence":"repeat",o&&(this.lastHoverTriggerAt=t),n.videoTimeSec!==void 0&&(this.lastVideoTimeSec=n.videoTimeSec),this.discontinuitySinceLast=!1,this.lookRequested=!1,this.pending||o||u?(this.pending=!1,this.repeatsLeft=this.confirmFrames-1):this.repeatsLeft>0&&(this.repeatsLeft-=1)}get lastTrigger(){return this.lastTriggerKind}msSinceLastAnalysis(t){return this.lastStartedAt===-1/0?null:t-this.lastStartedAt}get idle(){return!this.pending&&this.repeatsLeft===0}};function UP(e,t,n){let o={left:e.left,top:e.top,width:e.width,height:e.height};if(t.width<=0||t.height<=0||n==="fill")return o;let u=e.width/t.width,l=e.height/t.height,d;n==="cover"?d=Math.max(u,l):n==="none"?d=1:n==="scale-down"?d=Math.min(1,u,l):d=Math.min(u,l);let c=t.width*d,s=t.height*d;return{left:e.left+(e.width-c)/2,top:e.top+(e.height-s)/2,width:c,height:s}}function VP(e,t,n){return Math.abs(t-e)*1e3<=n}function GP(e,t){return e==="loading"?{phase:t.phase,bytes:t.bytes}:void 0}function qP(e,t){let n=t.mode??"pointer",o=new Bi(ns(null,n),3,n,rs(null)),u=document.createElement("canvas"),l=u.getContext("2d"),d=e instanceof HTMLVideoElement,c=new Worker(t.workerUrl??new URL("./worker.js",import.meta.url),{type:"module"}),s=()=>t.onUpdate?.(),r={state:"loading",error:null,release:null,backend:null,schedule:"idle",frames:0,lastWorkerMs:null,lastRoundTripMs:null,lastFrameError:null,geometric:t.geometricUrl!==void 0?{state:"loading",reason:null,bytes:null}:null,loading:null},i=[],a=xd,p,h=1,m=null,b=0,$=0,v=0,y=null,T=null,I=null,S=null,A=new os,k=null,O=-1/0,L=()=>{T=null,A.reset()},U=se=>{$+=1,se&&(v+=1),o.discontinuity(),L(),s()},Y=()=>T&&VP(T.videoTimeSec,Nn(e),a)?T:null,q=(se,Q)=>{let le=Y();if(!le)return null;let Ae=UP(e.getBoundingClientRect(),Mi(e),getComputedStyle(e).objectFit);if(Ae.width<=0||Ae.height<=0)return null;let ot=le.analysis.frame,Ht=(se-Ae.left)/Ae.width*ot.width,nt=(Q-Ae.top)/Ae.height*ot.height;if(!Number.isFinite(Ht)||!Number.isFinite(nt))return null;let $e=yd(le.analysis,Ht,nt);return!$e.box||$e.cardId===null||$e.name===null?null:{name:$e.name,cardId:$e.cardId,box:{left:Ae.left+$e.box.x/ot.width*Ae.width,top:Ae.top+$e.box.y/ot.height*Ae.height,width:$e.box.width/ot.width*Ae.width,height:$e.box.height/ot.height*Ae.height},frameBox:$e.box}},N=()=>I?q(I.x,I.y):null,ue=()=>{let se=N(),Q=T?.analysis.frame;if(!se||!Q)return null;let le=se.frameBox;return{x:le.x/Q.width,y:le.y/Q.height,width:le.width/Q.width,height:le.height/Q.height}},w=async se=>{if(r.state!=="ready"||m||!l)return;let Q=Mi(e);if(Q.width===0||Q.height===0)return;let le=performance.now(),Ae=h++;m={requestId:Ae,sentAt:le,ticket:S?.usable?S.sample(e):null};let ot=o.lookPending;o.started(le,{videoTimeSec:Nn(e),...se?{trigger:se}:ot?{trigger:"cut"}:{}});let Ht={requestId:Ae,mediaTimeSec:Nn(e),generation:$,videoKey:`source-${v}`};try{let nt=await vd(e,u,l,p),$e={kind:"frame",bitmap:nt.bitmap,videoTimeSec:nt.videoTimeSec,envelope:Ht};c.postMessage($e,[nt.bitmap])}catch(nt){S?.release(m?.ticket??null),m=null,r.lastFrameError=`capture-failed: ${String(nt)}`,s();return}y&&clearTimeout(y),y=setTimeout(()=>{m?.requestId===Ae&&(S?.release(m.ticket),m=null,r.lastFrameError="no reply",s())},N$)},C=se=>{let Q=$d(se.envelope,{inFlightRequestId:m?.requestId??null,lastAcceptedRequestId:b,generation:$,videoKey:`source-${v}`});if(Q!==null&&!z$(Q))return;let le=m;if(m=null,y&&clearTimeout(y),y=null,Q!==null||!le){S?.release(le?.ticket??null);return}if(b=se.envelope.requestId,r.lastWorkerMs=se.workerMs,r.lastRoundTripMs=+(performance.now()-le.sentAt).toFixed(2),r.lastFrameError=se.error??null,!se.analysis)S?.release(le.ticket),L();else{r.frames+=1,T={analysis:se.analysis,videoTimeSec:se.videoTimeSec};let Ae=le.ticket&&S?S.read(le.ticket):null;Ae?A.seed(Ae):(S?.release(le.ticket),A.reset())}o.setTooltipShowing(N()!==null,performance.now()),s()};c.onmessage=se=>{let Q=se.data;if(Q.kind==="frame-result")C(Q);else if(Q.kind==="release-progress"){let le=GP(r.state,Q);if(le===void 0)return;r.loading=le,s()}else if(Q.kind==="release-status"){if(r.state==="stopped")return;r.loading=null,r.state=Q.ok?"ready":"failed",r.error=Q.error,r.release=Q.release,i=Q.cards,Q.release&&(r.backend=Q.release.recognizer.ep,a=Q.release.hoverMaxAgeMs,p=Q.release.analysisWidth,o.setIntervalMs(ns(r.backend,n)),o.setReadingIntervalMs(rs(r.backend)),o.framePresented()),s()}else Q.kind==="geometric-status"&&(r.geometric={state:Q.state,reason:Q.reason,bytes:Q.bytes},s())},c.onerror=se=>{r.state==="loading"&&(r.state="failed",r.loading=null,r.error=`the worker did not start (${se.message||"see the console"})`,s())};let j={kind:"load",releaseUrl:t.releaseFiles?String(t.releaseUrl):new URL(t.releaseUrl,location.href).href,...t.releaseFiles?{files:t.releaseFiles}:{},...t.wasmPaths!==void 0?{wasmPaths:t.wasmPaths}:{},...t.providers?{providers:t.providers}:{},...t.geometricUrl!==void 0?{geometricUrl:new URL(t.geometricUrl,location.href).href}:{},...t.geometricManifestSha256!==void 0?{geometricManifestSha256:t.geometricManifestSha256}:{},...t.geometricWatchdog===!1?{geometricWatchdog:!1}:{}};c.postMessage(j);let H=se=>{if(!d)return;let Q=ue();if(!Q){S?.release(k),k=null;return}if(S||(S=D$()),!!S?.usable){if(k){let le=S.read(k);if(le&&(k=null,A.observe(le,Q).cut)){$+=1,L(),o.requestLook(),s();return}}!k&&se-O>=C$&&(O=se,k=S.sample(e))}},V=null,J=()=>{o.framePresented(),H(performance.now()),d&&"requestVideoFrameCallback"in e&&(V=e.requestVideoFrameCallback(J))},M=()=>U(!1),X=()=>{U(!0),o.framePresented()},K=()=>o.framePresented(),G=se=>{I={x:se.clientX,y:se.clientY};let Q=performance.now();se.pointerType==="touch"?o.tapped(Q):o.pointerMoved(Q),o.hoverTriggerDue(Q,Nn(e),m!==null)&&w("hover"),s()},he=()=>{I=null,o.pointerLeft(performance.now()),s()};d?(e.addEventListener("seeking",M),e.addEventListener("emptied",X),e.addEventListener("loadeddata",X),"requestVideoFrameCallback"in e?V=e.requestVideoFrameCallback(J):e.addEventListener("timeupdate",K),e.addEventListener("seeked",K)):e.addEventListener("load",X);let de=e;de.addEventListener("pointermove",G),de.addEventListener("pointerdown",G),de.addEventListener("pointerleave",he);let ye=setInterval(()=>{let se=performance.now();o.setTooltipShowing(N()!==null,se);let Q=o.analysisState(se);Q!==r.schedule&&(r.schedule=Q,s()),!m&&o.due(se)&&w()},R$);return{status:()=>({...r}),at:q,atPointer:N,analysis:()=>Y()?.analysis??null,cards:()=>i,stop:()=>{r.state="stopped",r.loading=null,clearInterval(ye),y&&clearTimeout(y),V!==null&&d&&"cancelVideoFrameCallback"in e&&e.cancelVideoFrameCallback(V),e.removeEventListener("seeking",M),e.removeEventListener("emptied",X),e.removeEventListener("loadeddata",X),e.removeEventListener("timeupdate",K),e.removeEventListener("seeked",K),e.removeEventListener("load",X),de.removeEventListener("pointermove",G),de.removeEventListener("pointerdown",G),de.removeEventListener("pointerleave",he),S?.dispose(),c.terminate(),L()}}}export{es as DEFAULT_ACCEPT,Ql as DEFAULT_DECODE,Ho as DEFAULT_LETTERBOX,Ti as Detector,Jo as EXECUTION_PROVIDERS,Si as Embedder,Ei as EmbeddingRecognizer,Bi as FrameScheduler,xd as HOVER_MAX_AGE_MS,u$ as HOVER_SELECTIONS,dn as IdentityMap,OP as MAX_ANALYSIS_WIDTH,EP as MIN_ANALYSIS_WIDTH,qt as PREPROCESSING,ki as Pipeline,zi as ReleaseError,Ai as TemporalGate,Pi as Tracker,k$ as analysisSize,SP as analyzeFrame,t$ as boxAverageRgb,ns as cadenceMs,vd as captureFrame,b$ as chooseLook,dd as computeCardQuad,qP as createSession,g$ as cropRgba,V2 as decodeDetections,yd as hoverAt,_$ as hoverCardsOf,d$ as hoverOrder,Pn as iou,PA as letterboxBgr,rd as letterboxGeometry,TP as loadRelease,wd as loadReleaseData,cn as lookAccepted,Jl as nonMaxSuppression,ad as parseBank,md as parseIdentityGroups,S$ as parseRelease,s$ as pointInConvexQuad,y$ as poolEmbeddings,bd as recognizeFrame,$d as replyRejection,qo as resizeBilinearRgb,fd as resolveHover,cd as resolveHoveredCard,sd as rotateTensor90,Yo as selectHoverLayer,od as toContractTensor,nd as toDetectorTensor,Vo as validBox};
/*! For license information please see cardvision.js.LEGAL.txt */
