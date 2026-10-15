import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:1080} });
p.on('pageerror', e=>console.log('[err]',e.message));
const cases = [
  ['arm_biceps','long_head','酸痛 / 练后恢复','M1-biceps-soreness'],
  ['hip_glute_med','piriformis','想练大','M2-piriformis-hypertrophy'],
  ['thigh_hamstrings','biceps_long','慢性紧张 / 僵硬','M3-ham-tension'],
];
for (const [g,part,prob,name] of cases) {
  await p.goto(`http://localhost:5173/muscle/${g}/${part}`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(6500);
  await p.getByRole('button',{name:prob}).click();
  await p.waitForTimeout(900);
  const heads=[];
  const loc = p.locator('div.text-xs.font-semibold').filter({hasText:/先做|再做|其他相关/});
  const n = await loc.count();
  for (let i=0;i<n;i++) heads.push((await loc.nth(i).textContent()).trim());
  const note = await p.locator('div.bg-slate-50').filter({hasText:/姿势稳定|暂时没有这一类/}).count();
  console.log(name,'|',prob,'→',heads.join(' / '), note? '| 含空态说明':'');
  await p.screenshot({path:`E:/work空间/fitposture/.verification/${name}.png`});
}
await b.close();
