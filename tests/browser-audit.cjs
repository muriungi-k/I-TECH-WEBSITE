const {chromium}=require('playwright');
const fs=require('fs'), path=require('path'),assert=require('assert');
const root=path.resolve(__dirname, '..');
const files=['index.html',...fs.readdirSync(root+'/pages').filter(f=>f.endsWith('.html')).map(f=>'pages/'+f)];
(async()=>{
const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
const context=await browser.newContext();const errors=[],requests=[];
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());requests.push(url.href);
 if(url.hostname!=='itech.test')return route.fulfill({status:200,contentType:'text/css',body:''});
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+'/')||!fs.existsSync(file))return route.fulfill({status:404,body:'Missing'});
 const ext=path.extname(file), types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
 const headers={'X-Content-Type-Options':'nosniff'};
 if(ext==='.html'){const policy=fs.readFileSync(root+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];headers['Content-Security-Policy']=policy;}
 return route.fulfill({status:200,contentType:types[ext]||'text/plain',headers,body:fs.readFileSync(file)});
});
const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('mailto'))errors.push(m.text());});
await p.goto('https://itech.test/index.html');
assert(await p.locator('dialog').isVisible());
assert(!requests.some(u=>u.includes('google')),'fonts loaded before consent');
await p.setViewportSize({width:375,height:812});
await p.screenshot({path:'/tmp/itech-consent-mobile.png'});
await p.locator('[data-choice="manage"]').click();assert(await p.locator('#external-fonts').isVisible());
await p.locator('[data-choice="save"]').click();
assert(!(await p.locator('dialog').isVisible()));
const cookies=await context.cookies();assert(cookies.some(c=>c.name==='itech-consent-v1'&&c.secure&&c.sameSite==='Lax'));
await p.reload();assert(!(await p.locator('dialog').isVisible()));
await p.goto('https://itech.test/pages/privacy.html');await p.locator('.privacy-content .cookie-settings').click();await p.locator('[data-choice="accept"]').click();
await p.waitForTimeout(100);assert(requests.some(u=>u.includes('fonts.googleapis.com')));
await p.goto('https://itech.test/pages/privacy.html');await p.locator('.privacy-content .cookie-settings').click();await p.locator('[data-choice="reject"]').click();await p.waitForTimeout(100);
requests.length=0;await p.reload();assert(!requests.some(u=>u.includes('google')));
const results=[];
for(const file of files){for(const width of [375,768,1024,1440]){
 await p.setViewportSize({width,height:900});await p.goto('https://itech.test/'+file);
 assert(!(await p.locator('dialog').isVisible()),'choice not shared');
 const audit=await p.evaluate(async()=>{
   const broken=[];
   for(const img of document.images){img.loading='eager';try{await img.decode();}catch{broken.push(img.getAttribute('src'));}}
   const backgrounds=[...new Set([...document.querySelectorAll('*')].flatMap(e=>[...getComputedStyle(e).backgroundImage.matchAll(/url\("?([^"\)]+)"?\)/g)].map(m=>m[1])))];
   for(const src of backgrounds){try{const i=new Image();i.src=src;await i.decode();}catch{broken.push(src);}}
   return {overflow:document.documentElement.scrollWidth>innerWidth,broken,links:[...document.querySelectorAll('a[href]')].map(a=>a.href),h1:document.querySelectorAll('h1').length};
 });
 assert(!audit.overflow,'overflow '+file+width);assert(!audit.broken.length,'broken images '+audit.broken);assert(audit.h1===1,'h1 '+file);
 for(const href of audit.links){const u=new URL(href);if(u.hostname!=='itech.test')continue;
   const target=path.join(root,decodeURIComponent(u.pathname));assert(fs.existsSync(target),'broken link '+href);
   if(u.hash){const html=fs.readFileSync(target,'utf8');assert(html.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),'broken anchor '+href);}
 }
 if(width<=1100){await p.locator('#mobileMenuBtn').click();assert(await p.locator('#mobileMenuBtn').getAttribute('aria-expanded')==='true');await p.locator('.dropdown-toggle').click();assert(await p.locator('#serviceLinks').isVisible());await p.keyboard.press('Escape');await p.keyboard.press('Escape');assert(await p.locator('#mobileMenuBtn').getAttribute('aria-expanded')==='false');}
 if(file.endsWith('projects.html')){for(const btn of await p.locator('.filter-btn').all()){await btn.click();const category=await btn.getAttribute('data-filter');assert(await p.locator('.project-card:not([hidden])').evaluateAll((cards,c)=>cards.every(card=>c==='all'||card.dataset.category===c),category));}await p.locator('[data-filter="all"]').click();}
 await p.locator('.footer').scrollIntoViewIfNeeded();assert(!(await p.locator('.footer .cookie-settings').isVisible()));
 if(width===375||width===1440)await p.screenshot({path:'/tmp/itech-final-'+file.replace('pages/','').replace('.html','')+'-'+width+'.png'});
 results.push({file,width,images:'OK',links:'OK',layout:'OK'});
}}
await p.goto('https://itech.test/pages/contact.html');
await p.locator('.contact-submit').click();assert(await p.locator('#name').evaluate(e=>!e.validity.valid));
await p.locator('#name').fill('Website QA');await p.locator('#phone').fill('+254700000000');await p.locator('#email').fill('bad-address');assert(await p.locator('#email').evaluate(e=>!e.validity.valid));
await p.locator('#email').fill('qa@example.com');await p.locator('#service').selectOption('networking');await p.locator('#message').fill('Test & details\nNairobi connectivity enquiry.');
await p.locator('.contact-submit').click();const href=await p.locator('#enquiry-help a').getAttribute('href');const draft=new URL(href);assert(draft.protocol==='mailto:');assert(draft.pathname==='infinitetechnologysolutions6@gmail.com');assert(draft.searchParams.get('body').includes('Test & details\nNairobi'));assert(draft.searchParams.get('subject').includes('networking'));
await p.goto('https://itech.test/images/photos/credits.html');assert(await p.locator('h1').textContent()==='Photography credits');assert(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(2, 8, 23)');
assert(!errors.length,JSON.stringify(errors));console.log(JSON.stringify({checks:results.length,consent:'accept/reject/preferences/persistence/withdrawal OK',form:'validation and encoded email draft OK',errors,results},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
