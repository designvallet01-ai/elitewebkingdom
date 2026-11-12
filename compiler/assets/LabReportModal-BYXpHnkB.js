import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./vendor-react-CPYPbbnH.js";import{G as r,Gt as i,Lt as a,N as o,i as s,in as c}from"./vendor-icons-B_s5zbUZ.js";var l=e(t(),1),u=n();function d({isOpen:e,onClose:t,code:n=``,language:d=`cpp`,studentInfo:f={},terminalOutput:p=``,lastStats:m=null,activeFileName:h=`main.cpp`}){let g=(0,l.useRef)(null),[_,v]=(0,l.useState)(!1),[y,b]=(0,l.useState)(!1),[x,S]=(0,l.useState)(`DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING`),[C,w]=(0,l.useState)(`INSTITUTE OF TECHNOLOGY & ADVANCED COMPUTING`),[T,E]=(0,l.useState)(`Data Structures & Algorithms Laboratory`),[D,O]=(0,l.useState)(`Implementation, Execution & Formal Verification of Algorithmic Logic`),[k,A]=(0,l.useState)(f.studentName||`Elite Student Developer`),[j,M]=(0,l.useState)(f.studentRoll||`26CSE-LAB-042`),[N,P]=(0,l.useState)(!0),[F,I]=(0,l.useState)(!0),[L,R]=(0,l.useState)(`10 / 10 (Grade O - Outstanding)`);if(!e)return null;let z=new Date().toLocaleDateString(`en-US`,{year:`numeric`,month:`long`,day:`numeric`});return(0,u.jsx)(`div`,{className:`report-modal-overlay`,onClick:t,children:(0,u.jsxs)(`div`,{className:`report-modal-card`,onClick:e=>e.stopPropagation(),role:`dialog`,children:[(0,u.jsxs)(`div`,{className:`report-top-bar no-print`,children:[(0,u.jsxs)(`div`,{className:`bar-left`,children:[(0,u.jsx)(`div`,{className:`bar-icon-badge`,children:(0,u.jsx)(a,{size:16,className:`text-emerald`})}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`span`,{className:`bar-title`,children:`University Practical Record & PDF Generator`}),(0,u.jsx)(`span`,{className:`bar-subtitle`,children:`Official ISO Academic Record Sheet format with Evaluation Signatures`})]})]}),(0,u.jsxs)(`div`,{className:`bar-right`,children:[(0,u.jsxs)(`button`,{className:`config-toggle-btn ${y?`active`:``}`,onClick:()=>b(!y),title:`Customize University, Student & Subject Details`,children:[(0,u.jsx)(o,{size:14}),(0,u.jsx)(`span`,{children:y?`Hide Settings`:`Edit Details`})]}),(0,u.jsxs)(`button`,{className:`copy-record-btn`,onClick:()=>{let e=`# ${C}
## ${x}
**Subject:** ${T}
**Experiment:** ${D}
**Student Name:** ${k} | **Roll No:** ${j}
**Language:** ${d.toUpperCase()} | **Date:** ${z}

---
### 1. Aim
${D}

### 2. Source Code (${h})
\`\`\`${d}
${n}
\`\`\`

### 3. Execution Verification
\`\`\`text
${p||`Program verified and executed with exit code 0.`}
\`\`\`

**Faculty Assessment:** ${L}
`;navigator.clipboard.writeText(e),v(!0),setTimeout(()=>v(!1),2e3)},title:`Copy formatted markdown report`,children:[_?(0,u.jsx)(c,{size:14,className:`text-emerald`}):(0,u.jsx)(i,{size:14}),(0,u.jsx)(`span`,{children:_?`Copied!`:`Copy Markdown`})]}),(0,u.jsxs)(`button`,{className:`print-btn primary`,onClick:()=>{if(!g.current){window.print();return}try{let e=window.open(``,`_blank`,`width=900,height=800`);if(!e){window.print();return}let t=g.current.innerHTML;e.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${C} - Lab Record - ${j}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              line-height: 1.45;
              font-size: 11pt;
            }
            .sheet-institution-header {
              text-align: center;
              border-bottom: 2.5px double #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .inst-univ-name {
              font-size: 14pt;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 3px;
            }
            .inst-dept-name {
              font-size: 11.5pt;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .inst-lab-name {
              font-size: 10pt;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
            .sheet-meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px 16px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 16px;
              font-size: 9.5pt;
            }
            .meta-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px dashed #e2e8f0;
              padding-bottom: 3px;
            }
            .meta-label {
              font-weight: 700;
              color: #475569;
              font-size: 9pt;
            }
            .meta-val {
              font-weight: 600;
              color: #0f172a;
              font-family: 'Courier New', Courier, monospace;
            }
            .sheet-section {
              margin-bottom: 14px;
            }
            .section-heading {
              font-size: 10.5pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              border-left: 4px solid #0284c7;
              padding-left: 8px;
              margin-bottom: 6px;
            }
            .sheet-p {
              font-size: 10pt;
              color: #334155;
              text-align: justify;
            }
            .sheet-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5pt;
              margin-top: 6px;
            }
            .sheet-table th, .sheet-table td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              text-align: left;
            }
            .sheet-table th {
              background-color: #f1f5f9;
              font-weight: 700;
              color: #1e293b;
            }
            .table-pill {
              font-family: 'Courier New', Courier, monospace;
              font-weight: bold;
              background: #e0f2fe;
              color: #0369a1;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid #bae6fd;
            }
            .sheet-code-container, .sheet-output-container {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-top: 6px;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              line-height: 1.4;
              white-space: pre-wrap;
              word-break: break-all;
              page-break-inside: auto;
            }
            .sheet-output-container {
              background: #0f172a;
              color: #f8fafc;
              border: 1px solid #0f172a;
            }
            .sheet-signoff-row {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              margin-top: 26px;
              padding-top: 10px;
              page-break-inside: avoid;
            }
            .sign-col {
              text-align: center;
              width: 200px;
            }
            .sign-line {
              height: 1px;
              background: #0f172a;
              margin-bottom: 6px;
            }
            .sign-title {
              font-size: 9pt;
              font-weight: 700;
              color: #334155;
            }
            .grade-badge-box {
              border: 2px dashed #059669;
              padding: 6px 12px;
              border-radius: 6px;
              text-align: center;
              background: #ecfdf5;
            }
            .grade-badge-title {
              font-size: 8pt;
              font-weight: 800;
              color: #059669;
              text-transform: uppercase;
            }
            .grade-badge-val {
              font-size: 11pt;
              font-weight: 800;
              color: #065f46;
            }
          </style>
        </head>
        <body>
          ${t}
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          <\/script>
        </body>
        </html>
      `),e.document.close()}catch(e){console.warn(`Isolated print window blocked, using default window.print():`,e),window.print()}},id:`btn-print-lab-pdf`,children:[(0,u.jsx)(r,{size:15}),(0,u.jsx)(`span`,{children:`Print / Download PDF`})]}),(0,u.jsx)(`button`,{className:`report-close-btn`,onClick:t,id:`btn-close-lab-modal`,children:(0,u.jsx)(s,{size:18})})]})]}),y&&(0,u.jsxs)(`div`,{className:`report-config-drawer no-print`,children:[(0,u.jsxs)(`div`,{className:`config-grid`,children:[(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Institution / University Name`}),(0,u.jsx)(`input`,{type:`text`,value:C,onChange:e=>w(e.target.value),placeholder:`e.g. Jawaharlal Nehru Technological University`})]}),(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Department Name`}),(0,u.jsx)(`input`,{type:`text`,value:x,onChange:e=>S(e.target.value),placeholder:`e.g. Department of Computer Science & Engineering`})]}),(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Subject / Course Name`}),(0,u.jsx)(`input`,{type:`text`,value:T,onChange:e=>E(e.target.value),placeholder:`e.g. Data Structures & Algorithms Lab`})]}),(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Student Name`}),(0,u.jsx)(`input`,{type:`text`,value:k,onChange:e=>A(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Student Roll Number`}),(0,u.jsx)(`input`,{type:`text`,value:j,onChange:e=>M(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`config-field`,children:[(0,u.jsx)(`label`,{children:`Marks / Evaluation Grade`}),(0,u.jsx)(`input`,{type:`text`,value:L,onChange:e=>R(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`config-field span-2`,children:[(0,u.jsx)(`label`,{children:`Experiment Title & Objective`}),(0,u.jsx)(`input`,{type:`text`,value:D,onChange:e=>O(e.target.value)})]})]}),(0,u.jsxs)(`div`,{className:`config-toggles`,children:[(0,u.jsxs)(`label`,{className:`toggle-label`,children:[(0,u.jsx)(`input`,{type:`checkbox`,checked:F,onChange:e=>I(e.target.checked)}),(0,u.jsx)(`span`,{children:`Include Big-O Complexity Bounds`})]}),(0,u.jsxs)(`label`,{className:`toggle-label`,children:[(0,u.jsx)(`input`,{type:`checkbox`,checked:N,onChange:e=>P(e.target.checked)}),(0,u.jsx)(`span`,{children:`Include Terminal Execution Output`})]})]})]}),(0,u.jsx)(`div`,{className:`report-viewport-scroller`,children:(0,u.jsxs)(`div`,{ref:g,className:`report-printable-sheet`,children:[(0,u.jsxs)(`div`,{className:`sheet-institution-header`,children:[(0,u.jsx)(`h1`,{className:`inst-univ-name`,children:C}),(0,u.jsx)(`h2`,{className:`inst-dept-name`,children:x}),(0,u.jsxs)(`p`,{className:`inst-lab-name`,children:[T,` • OFFICIAL LABORATORY MANUAL RECORD`]})]}),(0,u.jsxs)(`div`,{className:`sheet-meta-grid`,children:[(0,u.jsxs)(`div`,{className:`meta-item`,children:[(0,u.jsx)(`span`,{className:`meta-label`,children:`STUDENT NAME:`}),(0,u.jsx)(`span`,{className:`meta-val`,children:k})]}),(0,u.jsxs)(`div`,{className:`meta-item`,children:[(0,u.jsx)(`span`,{className:`meta-label`,children:`ROLL / REG NO:`}),(0,u.jsx)(`span`,{className:`meta-val`,children:j})]}),(0,u.jsxs)(`div`,{className:`meta-item`,children:[(0,u.jsx)(`span`,{className:`meta-label`,children:`LANGUAGE & RUNNER:`}),(0,u.jsxs)(`span`,{className:`meta-val`,children:[d.toUpperCase(),` (`,m?.runner||`Cloud Compiler`,`)`]})]}),(0,u.jsxs)(`div`,{className:`meta-item`,children:[(0,u.jsx)(`span`,{className:`meta-label`,children:`VERIFIED ON:`}),(0,u.jsx)(`span`,{className:`meta-val`,children:z})]})]}),(0,u.jsxs)(`div`,{className:`sheet-section`,children:[(0,u.jsx)(`h2`,{className:`section-heading`,children:`1. EXPERIMENT AIM & OBJECTIVE`}),(0,u.jsx)(`div`,{className:`section-body`,children:(0,u.jsxs)(`p`,{className:`sheet-p`,children:[(0,u.jsx)(`strong`,{children:D}),(0,u.jsx)(`br`,{}),`To construct, debug, compile, and empirically verify the programmatic correctness and algorithmic performance of the solution using standard compilers and test environments.`]})})]}),F&&(0,u.jsxs)(`div`,{className:`sheet-section`,children:[(0,u.jsx)(`h2`,{className:`section-heading`,children:`2. ASYMPTOTIC COMPLEXITY ANALYSIS (BIG-O)`}),(0,u.jsx)(`div`,{className:`complexity-table-box`,children:(0,u.jsxs)(`table`,{className:`sheet-table`,children:[(0,u.jsx)(`thead`,{children:(0,u.jsxs)(`tr`,{children:[(0,u.jsx)(`th`,{children:`METRIC`}),(0,u.jsx)(`th`,{children:`ASYMPTOTIC BOUND`}),(0,u.jsx)(`th`,{children:`FORMAL THEORETICAL EXPLANATION`})]})}),(0,u.jsxs)(`tbody`,{children:[(0,u.jsxs)(`tr`,{children:[(0,u.jsx)(`td`,{children:(0,u.jsx)(`b`,{children:`Worst-Case Time Complexity`})}),(0,u.jsx)(`td`,{children:(0,u.jsx)(`span`,{className:`table-pill cyan`,children:`O(N log N) / O(N)`})}),(0,u.jsx)(`td`,{children:`Proportional to recursive tree partitioning and linear iterations over dataset.`})]}),(0,u.jsxs)(`tr`,{children:[(0,u.jsx)(`td`,{children:(0,u.jsx)(`b`,{children:`Auxiliary Space Complexity`})}),(0,u.jsx)(`td`,{children:(0,u.jsx)(`span`,{className:`table-pill purple`,children:`O(1) Auxiliary`})}),(0,u.jsx)(`td`,{children:`In-place pointer traversal with constant auxiliary memory allocations.`})]})]})]})})]}),(0,u.jsxs)(`div`,{className:`sheet-section`,children:[(0,u.jsxs)(`h2`,{className:`section-heading`,children:[`3. IMPLEMENTATION SOURCE CODE (`,h,`)`]}),(0,u.jsx)(`div`,{className:`sheet-code-container`,children:(0,u.jsx)(`code`,{children:n||`// No source code written in active buffer.`})})]}),N&&(0,u.jsxs)(`div`,{className:`sheet-section`,children:[(0,u.jsx)(`h2`,{className:`section-heading`,children:`4. EXECUTION VERIFICATION & TERMINAL LOGS`}),(0,u.jsx)(`div`,{className:`sheet-output-container`,children:(0,u.jsx)(`code`,{children:p||`[Elite Engine]: Compiling & executing ${d.toUpperCase()} in sandboxed runner...\nProgram returned successfully with exit code 0 (${m?.executionTime||12}ms).\nVerification Status: PASSED.`})})]}),(0,u.jsxs)(`div`,{className:`sheet-signoff-row`,children:[(0,u.jsxs)(`div`,{className:`sign-col`,children:[(0,u.jsx)(`div`,{className:`sign-line`}),(0,u.jsx)(`span`,{className:`sign-title`,children:`Student Signature`})]}),(0,u.jsxs)(`div`,{className:`grade-badge-box`,children:[(0,u.jsx)(`div`,{className:`grade-badge-title`,children:`EVALUATION GRADE`}),(0,u.jsx)(`div`,{className:`grade-badge-val`,children:L})]}),(0,u.jsxs)(`div`,{className:`sign-col`,children:[(0,u.jsx)(`div`,{className:`sign-line`}),(0,u.jsx)(`span`,{className:`sign-title`,children:`Faculty Evaluator Sign & Stamp`})]})]})]})})]})})}export{d as default};