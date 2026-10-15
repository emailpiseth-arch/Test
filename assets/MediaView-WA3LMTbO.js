import{c as u,u as d,r as m,ba as x,j as e}from"./index-Bc2cGA-G.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=u("Music",[["path",{d:"M9 18V5l12-2v13",key:"1jmyc2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["circle",{cx:"18",cy:"16",r:"3",key:"1hluhg"}]]);function y({url:a,name:t,mime:r,onInfo:s,onReady:c,onError:i}){const{t:o}=d();m.useEffect(()=>{s(null)},[s]);const n=x(t,r)==="audio",l=()=>i(o("preview.cannotShow"));return n?e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-900 p-6 text-white",children:[e.jsx(f,{size:56,className:"opacity-60"}),e.jsx("div",{className:"max-w-full truncate text-sm opacity-80",children:t}),e.jsx("audio",{src:a,controls:!0,autoPlay:!1,preload:"metadata",className:"w-full max-w-md",onLoadedMetadata:c,onError:l})]}):e.jsx("div",{className:"absolute inset-0 flex items-center justify-center bg-black",children:e.jsx("video",{src:a,controls:!0,playsInline:!0,preload:"metadata",className:"max-h-full max-w-full",onLoadedData:c,onError:l})})}export{y as default};
