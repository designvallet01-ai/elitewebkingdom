import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./vendor-react-CPYPbbnH.js";import{D as r,Ht as i,L as a,S as o,_n as s,dt as c,gn as l,it as u,x as d}from"./vendor-icons-Cnt9RDKQ.js";var f=e(t(),1),p=n();function m({files:e=[],activeCode:t=``,isRunning:n=!1}){let m=(0,f.useRef)(null),[h,g]=(0,f.useState)(`desktop`),[_,v]=(0,f.useState)(`http://localhost:3000`),[y,b]=(0,f.useState)([]),[x,S]=(0,f.useState)(!1),[C,w]=(0,f.useState)(!1),T=()=>{let n=e.find(e=>e.name.endsWith(`.html`))||{code:``},r=e.filter(e=>e.name.endsWith(`.css`)).map(e=>e.code).join(`
`),i=e.filter(e=>e.name.endsWith(`.js`)||e.name.endsWith(`.jsx`)).map(e=>e.code).join(`
`),a=n.code;!a&&t&&(t.includes(`<html`)||t.includes(`<!DOCTYPE`)||t.includes(`<div`))&&(a=t),a||=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 28px;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      max-width: 420px;
      line-height: 1.5;
    }
    .preview-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 24px;
      margin-top: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #2563eb;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="badge">⚡ Embedded Mini-Browser Sandbox</div>
  <h1>Elite Cloud Sandbox</h1>
  <p>Live hot-reloading preview active. Edit files or HTML/CSS/JS to observe immediate changes.</p>
  <div class="preview-card">
    <button class="btn" onclick="alert('Hello from Elite Sandbox!')">Interactive Demo Button</button>
  </div>
</body>
</html>`;let o=a;return r&&(o=o.replace(`</head>`,`<style>${r}</style></head>`)),i&&(o=o.replace(`</body>`,`<script>${i}<\/script></body>`)),o=o.replace(`<head>`,`<head>
<script>
(function() {
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;
  console.log = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'log', args: args.map(String).join(' ') }, '*');
    origLog.apply(console, args);
  };
  console.error = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'error', args: args.map(String).join(' ') }, '*');
    origErr.apply(console, args);
  };
  console.warn = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'warn', args: args.map(String).join(' ') }, '*');
    origWarn.apply(console, args);
  };
})();
<\/script>
`),o},E=()=>{if(!m.current)return;w(!0);let e=T(),t=m.current.contentDocument||m.current.contentWindow?.document;t&&(t.open(),t.write(e),t.close()),setTimeout(()=>w(!1),300)};return(0,f.useEffect)(()=>{E()},[e,t,n]),(0,f.useEffect)(()=>{let e=e=>{e.data&&e.data.type===`ELITE_PREVIEW_LOG`&&b(t=>[...t.slice(-30),{id:Date.now()+Math.random(),level:e.data.level,text:e.data.args,time:new Date().toLocaleTimeString()}])};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[]),(0,p.jsxs)(`div`,{className:`mini-browser-container`,children:[(0,p.jsxs)(`div`,{className:`mini-browser-chrome`,children:[(0,p.jsxs)(`div`,{className:`chrome-nav-buttons`,children:[(0,p.jsx)(`button`,{className:`chrome-btn`,title:`Back`,disabled:!0,children:(0,p.jsx)(s,{size:13})}),(0,p.jsx)(`button`,{className:`chrome-btn`,title:`Forward`,disabled:!0,children:(0,p.jsx)(l,{size:13})}),(0,p.jsx)(`button`,{className:`chrome-btn ${C?`spin-icon`:``}`,onClick:E,title:`Reload Hot-Preview`,children:(0,p.jsx)(a,{size:13})})]}),(0,p.jsxs)(`div`,{className:`chrome-address-bar`,children:[(0,p.jsx)(c,{size:12,className:`text-emerald-400`}),(0,p.jsx)(`input`,{type:`text`,value:_,onChange:e=>v(e.target.value),className:`address-input`,title:`Local Sandbox Address`}),(0,p.jsx)(`span`,{className:`address-badge`,children:`PORT 3000`})]}),(0,p.jsxs)(`div`,{className:`chrome-controls`,children:[(0,p.jsxs)(`div`,{className:`viewport-toggle-group`,children:[(0,p.jsx)(`button`,{className:`vp-btn ${h===`desktop`?`active`:``}`,onClick:()=>g(`desktop`),title:`Desktop View (100%)`,children:(0,p.jsx)(u,{size:14})}),(0,p.jsx)(`button`,{className:`vp-btn ${h===`tablet`?`active`:``}`,onClick:()=>g(`tablet`),title:`Tablet View (768px)`,children:(0,p.jsx)(o,{size:14})}),(0,p.jsx)(`button`,{className:`vp-btn ${h===`mobile`?`active`:``}`,onClick:()=>g(`mobile`),title:`Mobile View (375px)`,children:(0,p.jsx)(r,{size:14})})]}),(0,p.jsxs)(`button`,{className:`chrome-btn ${x?`active`:``}`,onClick:()=>S(e=>!e),title:`Toggle Mini DevTools Console`,children:[(0,p.jsx)(d,{size:14}),y.length>0&&(0,p.jsx)(`span`,{className:`dev-log-counter`,children:y.length})]}),(0,p.jsx)(`button`,{className:`chrome-btn`,onClick:()=>{let e=new Blob([T()],{type:`text/html`}),t=URL.createObjectURL(e);window.open(t,`_blank`)},title:`Open Sandbox in New Window`,children:(0,p.jsx)(i,{size:14})})]})]}),(0,p.jsx)(`div`,{className:`mini-browser-body`,children:(0,p.jsx)(`div`,{className:`browser-frame-wrapper frame-${h}`,children:(0,p.jsx)(`iframe`,{ref:m,title:`Elite Mini Browser Sandbox`,sandbox:`allow-scripts allow-modals allow-same-origin allow-forms`,className:`mini-browser-iframe`})})}),x&&(0,p.jsxs)(`div`,{className:`mini-devtools-drawer`,children:[(0,p.jsxs)(`div`,{className:`devtools-header`,children:[(0,p.jsxs)(`div`,{className:`devtools-title`,children:[(0,p.jsx)(d,{size:13,className:`text-sky-400`}),(0,p.jsx)(`span`,{children:`Browser Sandbox Console`})]}),(0,p.jsxs)(`div`,{className:`devtools-actions`,children:[(0,p.jsx)(`button`,{className:`devtools-clear-btn`,onClick:()=>b([]),children:`Clear`}),(0,p.jsx)(`button`,{className:`devtools-close-btn`,onClick:()=>S(!1),children:`✕`})]})]}),(0,p.jsx)(`div`,{className:`devtools-body`,children:y.length===0?(0,p.jsx)(`div`,{className:`devtools-empty`,children:`No console output yet. (console.log / warn / error will display here)`}):y.map(e=>(0,p.jsxs)(`div`,{className:`log-line log-${e.level}`,children:[(0,p.jsxs)(`span`,{className:`log-time`,children:[`[`,e.time,`]`]}),(0,p.jsxs)(`span`,{className:`log-level`,children:[e.level.toUpperCase(),`:`]}),(0,p.jsx)(`span`,{className:`log-text`,children:e.text})]},e.id))})]})]})}export{m as default};