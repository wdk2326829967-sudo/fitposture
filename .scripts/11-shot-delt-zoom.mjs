import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:1000} });
p.on('pageerror', e=>console.log('[err]',e.message));
await p.goto('http://localhost:5173/',{waitUntil:'networkidle'});
await p.waitForTimeout(6500);
await p.getByText('显示骨骼').click();
await p.getByRole('button',{name:'三角肌',exact:true}).click();
await p.waitForTimeout(2000);
const c = await p.locator('canvas').boundingBox();
// 左肩特写
await p.screenshot({path:'E:/work空间/fitposture/.verification/J1-delt-front-zoom.png', clip:{x:c.x+c.width*0.28,y:c.y+c.height*0.13,width:c.width*0.22,height:c.height*0.22}});
// 切到背面看待后束
await p.getByRole('button',{name:'转到背面'}).click();
await p.waitForTimeout(2200);
await p.screenshot({path:'E:/work空间/fitposture/.verification/J2-delt-back-zoom.png', clip:{x:c.x+c.width*0.28,y:c.y+c.height*0.13,width:c.width*0.22,height:c.height*0.22}});
console.log('ok');
await b.close();
