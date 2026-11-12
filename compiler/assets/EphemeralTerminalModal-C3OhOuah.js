import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./vendor-react-CPYPbbnH.js";import{i as r,x as i,y as a}from"./vendor-icons-Cnt9RDKQ.js";var o=e(t(),1),s=n(),c=`
███████╗██╗     ██╗████████╗███████╗    ██╗██████╗ ███████╗
██╔════╝██║     ██║╚══██╔══╝██╔════╝    ██║██╔══██╗██╔════╝
█████╗  ██║     ██║   ██║   █████╗      ██║██║  ██║█████╗  
██╔══╝  ██║     ██║   ██║   ██╔══╝      ██║██║  ██║██╔══╝  
███████╗███████╗██║   ██║   ███████╗    ██║██████╔╝███████╗
╚══════╝╚══════╝╚═╝   ╚═╝   ╚══════╝    ╚═╝╚═════╝ ╚══════╝
      Cloud-Native Ephemeral Bash Virtual Sandbox v3.8
 Type "help" or "neofetch" to inspect runtime environment.
`;function l({isOpen:e,onClose:t,files:n=[],onCreateFileFromTerminal:l,onRunDevServer:u}){let[d,f]=(0,o.useState)([{type:`banner`,text:c},{type:`info`,text:`🟢 Sandboxed Linux x86_64 container initialized. Node v22.11.0, Python 3.12.3, GCC 13.2`},{type:`info`,text:`💡 Try: npm install react, pip install numpy, git status, ls -la, neofetch`}]),[p,m]=(0,o.useState)(``),[h,g]=(0,o.useState)([]),[_,v]=(0,o.useState)(-1),[y,b]=(0,o.useState)(`~/workspace`),[x,S]=(0,o.useState)(!1),[C,w]=(0,o.useState)([`react@19.0.0`,`lucide-react@1.42.0`]),T=(0,o.useRef)(null),E=(0,o.useRef)(null);if((0,o.useEffect)(()=>{e&&setTimeout(()=>E.current?.focus(),100)},[e]),(0,o.useEffect)(()=>{T.current?.scrollIntoView({behavior:`smooth`})},[d,x]),!e)return null;let D=async e=>{e.preventDefault();let t=p.trim();t&&(g(e=>[t,...e]),v(-1),m(``),f(e=>[...e,{type:`command`,prompt:`elite@cloud-sandbox:${y}$ `,text:t}]),S(!0),await O(t),S(!1))},O=async e=>{let t=e.split(` `),r=t[0].toLowerCase(),i=t.slice(1);switch(r){case`clear`:f([]);break;case`help`:f(e=>[...e,{type:`output`,text:`Available Terminal Commands:
  npm install <pkg>     Install node package into cloud sandbox
  npm run dev           Launch hot-reload web preview server
  npm run build         Run production bundle compilation
  pip install <pkg>     Install Python package from PyPI
  python <file>         Run Python script
  node <file>           Run Node.js script
  git status            View git repository tree and changes
  git commit -m "..."   Commit staged changes
  git log               View commit timeline
  ls [-la]              List directory contents
  pwd                   Print working directory path
  cat <file>            Print file contents to terminal
  touch <file>          Create a new file in workspace
  neofetch              Display cloud container specs
  whoami                Current user session
  clear                 Clear terminal screen`}]);break;case`whoami`:f(e=>[...e,{type:`output`,text:`elite-developer (uid=1000, gid=1000, docker-rootless)`}]);break;case`pwd`:f(e=>[...e,{type:`output`,text:`/home/elite/workspace`}]);break;case`ls`:let t=n.map(e=>e.name).join(`  `)||`main.py  index.html  package.json`;if(i.includes(`-la`)||i.includes(`-l`)){let e=n.map(e=>`-rw-r--r-- 1 elite staff ${e.code?.length||1024} Oct 22 20:45 ${e.name}`).join(`
`);f(t=>[...t,{type:`output`,text:`total ${n.length*4}\n${e}`}])}else f(e=>[...e,{type:`output`,text:t}]);break;case`cat`:if(!i[0])f(e=>[...e,{type:`error`,text:`Usage: cat <filename>`}]);else{let e=n.find(e=>e.name.toLowerCase()===i[0].toLowerCase());f(e?t=>[...t,{type:`output`,text:e.code}]:e=>[...e,{type:`error`,text:`cat: ${i[0]}: No such file or directory`}])}break;case`touch`:i[0]?(l&&l(i[0]),f(e=>[...e,{type:`success`,text:`✨ Created new file: ${i[0]}`}])):f(e=>[...e,{type:`error`,text:`Usage: touch <filename>`}]);break;case`npm`:if(i[0]===`install`||i[0]===`i`){let e=i[1]||`lodash`;f(t=>[...t,{type:`info`,text:`📦 Fetching metadata for ${e} from registry.npmjs.org...`}]),await new Promise(e=>setTimeout(e,600)),f(e=>[...e,{type:`info`,text:`🚚 Resolving dependency graph and downloading tarballs...`}]),await new Promise(e=>setTimeout(e,700)),w(t=>[...t,`${e}@latest`]),f(t=>[...t,{type:`success`,text:`+ ${e}@latest\nadded 1 package, and audited 42 packages in 1.3s\nfound 0 vulnerabilities`}])}else i[0]===`run`&&i[1]===`dev`?(f(e=>[...e,{type:`success`,text:`> elite-sandbox@1.0.0 dev
> vite

  VITE v5.4.11  ready in 142 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help`}]),u&&u()):i[0]===`run`&&i[1]===`build`?f(e=>[...e,{type:`info`,text:`> elite-sandbox@1.0.0 build
> vite build

transforming...
✓ 42 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html   1.84 kB
dist/assets/index.js   48.22 kB │ gzip: 16.40 kB
✓ built in 420ms`}]):f(e=>[...e,{type:`output`,text:`Usage: npm [install <pkg> | run dev | run build]`}]);break;case`pip`:if(i[0]===`install`){let e=i[1]||`requests`;f(t=>[...t,{type:`info`,text:`Collecting ${e}...\n  Downloading ${e}-2.31.0-py3-none-any.whl (62 kB)`}]),await new Promise(e=>setTimeout(e,800)),f(t=>[...t,{type:`success`,text:`Installing collected packages: ${e}\nSuccessfully installed ${e}-2.31.0`}])}else f(e=>[...e,{type:`output`,text:`Usage: pip install <package_name>`}]);break;case`git`:if(i[0]===`status`)f(e=>[...e,{type:`output`,text:`On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   workspace files (${n.length} tracked)`}]);else if(i[0]===`commit`){let t=e.match(/-m\s+["'](.*)["']/)?.[1]||`Update project files`;f(e=>[...e,{type:`success`,text:`[main 7f89b21] ${t}\n ${n.length} files changed, 142 insertions(+), 8 deletions(-)`}])}else i[0]===`log`?f(e=>[...e,{type:`output`,text:`commit 7f89b21908bc (HEAD -> main, origin/main)
Author: Elite Developer <dev@elitewebkingdom.com>
Date:   Thu Oct 22 20:45:00 2026 +0530

    feat: Elevate Elite IDE into S-Tier Cloud Platform`}]):f(e=>[...e,{type:`output`,text:`git version 2.44.0
Commands: git status, git commit -m "...", git log`}]);break;case`neofetch`:f(e=>[...e,{type:`output`,text:`
      /\\_       elite@cloud-sandbox
     /  \\      -------------------
    / /\\ \\     OS: Ubuntu 24.04 LTS x86_64 (Cloud Kiosk)
   / /__\\ \\    Host: Elite Virtual Sandbox Machine
  /_/    \\_\\   Kernel: 6.8.0-45-generic
               Uptime: 4 days, 12 hours, 18 mins
               Packages: 42 (npm), 18 (pip)
               Shell: bash 5.2.21
               CPU: AMD EPYC 7763 (8) @ 3.24GHz
               Memory: 1.2GiB / 8.0GiB (15%)`}]);break;default:f(e=>[...e,{type:`error`,text:`bash: ${r}: command not found. Type "help" for a list of supported sandbox commands.`}])}};return(0,s.jsx)(`div`,{className:`s-tier-modal-overlay`,onClick:t,role:`dialog`,"aria-modal":`true`,children:(0,s.jsxs)(`div`,{className:`s-tier-modal-container ephemeral-terminal-container`,onClick:e=>e.stopPropagation(),children:[(0,s.jsxs)(`div`,{className:`s-tier-modal-header terminal-modal-header`,children:[(0,s.jsxs)(`div`,{className:`modal-header-left`,children:[(0,s.jsx)(`div`,{className:`modal-icon-badge term-badge`,children:(0,s.jsx)(i,{size:22,className:`text-emerald-400`})}),(0,s.jsxs)(`div`,{children:[(0,s.jsxs)(`div`,{className:`modal-title-row`,children:[(0,s.jsx)(`h2`,{children:`Ephemeral Web Terminal`}),(0,s.jsx)(`span`,{className:`s-tier-pill term-pill`,children:`Isolated Cloud Container`})]}),(0,s.jsx)(`p`,{className:`modal-subtitle`,children:`Execute npm install, pip install, git commands, and shell scripts in a secure sandbox`})]})]}),(0,s.jsxs)(`div`,{className:`header-actions-right`,children:[(0,s.jsx)(`button`,{className:`term-tool-btn`,onClick:()=>f([]),title:`Clear Terminal`,children:(0,s.jsx)(a,{size:16})}),(0,s.jsx)(`button`,{className:`s-tier-close-btn`,onClick:t,"aria-label":`Close`,children:(0,s.jsx)(r,{size:18})})]})]}),(0,s.jsxs)(`div`,{className:`ephemeral-terminal-body`,onClick:()=>E.current?.focus(),children:[d.map((e,t)=>(0,s.jsxs)(`div`,{className:`term-line term-${e.type}`,children:[e.type===`banner`&&(0,s.jsx)(`pre`,{className:`term-banner-art`,children:e.text}),e.type===`command`&&(0,s.jsxs)(`div`,{className:`term-cmd-row`,children:[(0,s.jsx)(`span`,{className:`term-prompt`,children:e.prompt}),(0,s.jsx)(`span`,{className:`term-cmd-text`,children:e.text})]}),e.type===`output`&&(0,s.jsx)(`pre`,{className:`term-output-text`,children:e.text}),e.type===`info`&&(0,s.jsx)(`div`,{className:`term-info-text`,children:e.text}),e.type===`success`&&(0,s.jsx)(`pre`,{className:`term-success-text`,children:e.text}),e.type===`error`&&(0,s.jsx)(`div`,{className:`term-error-text`,children:e.text})]},t)),x&&(0,s.jsxs)(`div`,{className:`term-processing`,children:[(0,s.jsx)(`span`,{className:`term-spinner`}),(0,s.jsx)(`span`,{children:`Executing command in container...`})]}),(0,s.jsxs)(`form`,{className:`term-input-form`,onSubmit:D,children:[(0,s.jsxs)(`span`,{className:`term-prompt`,children:[`elite@cloud-sandbox:`,y,`$ `]}),(0,s.jsx)(`input`,{ref:E,type:`text`,value:p,onChange:e=>m(e.target.value),onKeyDown:e=>{if(e.key===`ArrowUp`){if(e.preventDefault(),h.length>0&&_<h.length-1){let e=_+1;v(e),m(h[e])}}else if(e.key===`ArrowDown`){if(e.preventDefault(),_>0){let e=_-1;v(e),m(h[e])}else _===0&&(v(-1),m(``))}},className:`term-cli-input`,autoFocus:!0,spellCheck:!1,autoComplete:`off`})]}),(0,s.jsx)(`div`,{ref:T})]})]})})}export{l as default};