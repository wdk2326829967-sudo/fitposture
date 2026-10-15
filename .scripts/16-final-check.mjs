import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:1080} });
const errs=[];
p.on('pageerror', e=>errs.push('pageerror: '+e.message));
p.on('console', m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
// 整块肌群页（无亚部参数）
await p.goto('http://localhost:5173/muscle/chest_pec_major',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(7000);
const chips = await p.locator('a[href^="/muscle/chest_pec_major/"]').count();
const probs = await p.locator('button').filter({hasText:/想练大|酸痛|紧张|活动度|体态|拉伤/}).count();
console.log('整块胸大肌页 | 亚部标签:', chips, '| 问题按钮:', probs);
await p.screenshot({path:'E:/work空间/fitposture/.verification/N1-whole-muscle.png'});
console.log('报错:', errs.length, errs.slice(0,4));
await b.close();
