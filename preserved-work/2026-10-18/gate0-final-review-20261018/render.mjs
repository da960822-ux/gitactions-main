import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const dir='/workspace/gate0-final-review-20261018';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.setContent(fs.readFileSync(`${dir}/GATE0-PLAN-REVIEW.ko.html`,'utf8'));
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${dir}/document-preview.png`});
 await page.pdf({path:`${dir}/YEONSEOK-LISBETH-GATE0-PLAN.ko.pdf`,preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font-size:8px;text-align:center;color:#666">Gate 0 · 계획 검토 / 사용자 승인 대기 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
 console.log('PDF_READY');
} finally {await browser.close();}
