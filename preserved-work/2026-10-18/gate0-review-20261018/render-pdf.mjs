import {chromium} from '/tmp/yl-gate0-audit/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.setContent(fs.readFileSync('/workspace/gate0-review-20261018/GATE0-PLAN-REVIEW.ko.html','utf8'));await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'/workspace/gate0-review-20261018/document-preview.png'});
await page.pdf({path:'/workspace/gate0-review-20261018/YEONSEOK-LISBETH-GATE0-PLAN.ko.pdf',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font-size:8px;text-align:center;color:#666">Gate 0 · 계획 검토 / 사용자 승인 대기 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
await browser.close();console.log('PDF_READY');
