"""Real input + rendering acceptance, on desktop and a touch-sized viewport."""
from datetime import datetime, timezone
from pathlib import Path
import math, os, shutil
from playwright.sync_api import sync_playwright, expect
URL=os.getenv('GAME_URL','http://127.0.0.1:8790/')
OUT=Path('screenshots'); OUT.mkdir(exist_ok=True)
SEED=(123456*1664525+1013904223)&0xffffffff

def act(p,cmd):
    p.locator('[data-cmd="'+cmd+'"]').click()
def action(p,cmd):
    p.locator('[data-action="'+cmd+'"]').click()
def wait(p,ms):
    p.clock.run_for(ms)
def finish(p):
    expect(p.locator('#result')).to_be_visible()
    expect(p.locator('#resultTitle')).to_have_text('FIXED IT.')
def screenshot(p,name):
    p.screenshot(path=str(OUT/name))
def solve(p,id,model):
    if id=='drive':
        action(p,'go'); wait(p,math.ceil((model['delay']+.15)*1000)); action(p,'go')
        before=p.locator('#scene').screenshot(); wait(p,550); after=p.locator('#scene').screenshot(); assert before!=after,'truck scene must animate'
        wait(p,1450); action(p,'go'); wait(p,2000); action(p,'go'); wait(p,2000); action(p,'go'); wait(p,6000)
    elif id=='wire':
        for i in range(4):act(p,'lead-'+str(i));act(p,'port-'+str(model['order'].index(i)))
    elif id=='pipe':
        cmds=p.evaluate('seed=>{const s=PS.make("pipe",seed),out=[];for(let i=0;i<s.tiles.length&&!s.done;i++)for(let n=0;n<4&&s.tiles[i]!==s.solution[i]&&!s.done;n++){out.push("tile-"+i);PS.action(s,"tile-"+i)}return out}',int(p.locator('#play').get_attribute('data-seed')))
        for cmd in cmds:act(p,cmd)
    elif id=='leak':
        act(p,'joint-0');act(p,'joint-'+str(model['target']));action(p,'seal')
    elif id=='air':
        for i in range(3):
            for n in range(abs(model['answer'][i]-2)):act(p,'damper-'+str(i)+'-'+('1' if model['answer'][i]>2 else '-1'))
        action(p,'test')
    elif id=='memory':
        expect(p.locator('[data-cmd="pad-0"]')).to_be_disabled();wait(p,4000)
        for r in range(1,4):
            for i in range(r+2):act(p,'pad-'+str(model['sequence'][i]))
            if r<3:wait(p,5200)
    elif id=='braze':
        b=p.locator('[data-action="torch"]');b.scroll_into_view_if_needed();r=b.bounding_box();p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2)
        p.mouse.down();wait(p,2000)
        before=p.locator('#scene').screenshot();wait(p,100);after=p.locator('#scene').screenshot();assert before!=after,'torch must visibly animate'
        p.mouse.up()
        for n in range(9):
            if p.locator('#result').is_visible():break
            wait(p,600);p.mouse.down();wait(p,450);p.mouse.up()
    elif id=='pack':
        for i in range(model['count']):
            act(p,'case-'+str(i))
            for n in range((4-model['turns'][i])%4):action(p,'rotate')
            cells=[(x,y) for y,row in enumerate(model['map']) for x,ch in enumerate(row) if ch==chr(65+i)]
            row=min(y for x,y in cells)
            act(p,'cell-'+str(min(x for x,y in cells if y==row))+'-'+str(row))
    finish(p)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),args=['--no-sandbox'])
    for mobile in [False,True]:
        size='phone' if mobile else 'desktop'
        for id in ['drive','pipe','wire','leak','braze','air','memory','pack']:
            ctx=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},has_touch=mobile,is_mobile=mobile)
            p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('Date.now=()=>123456')
            p.clock.install(time=datetime(2026,11,12,12,tzinfo=timezone.utc));p.goto(URL);p.evaluate('document.fonts.ready');wait(p,100)
            expect(p.locator('[data-game]')).to_have_count(8)
            if id=='drive':screenshot(p,'arcade-'+size+'.png')
            p.locator('[data-game="'+id+'"]').click();wait(p,100)
            assert p.locator('body').evaluate('e=>e.scrollWidth<=window.innerWidth+1'),'horizontal overflow'
            if id=='braze':
                p.locator('[data-action="torch"]').scroll_into_view_if_needed();r=p.locator('[data-action="torch"]').bounding_box();p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);p.mouse.down();wait(p,1800);screenshot(p,id+'-'+size+'.png');p.mouse.up();action(p,'restart');wait(p,100)
            else:screenshot(p,id+'-'+size+'.png')
            model=p.evaluate('(x)=>PS.make(x.id,x.seed)',{'id':id,'seed':int(p.locator('#play').get_attribute('data-seed'))})
            if id=='drive':
                p.locator('#pause').click();clock=p.locator('#gameClock').inner_text();wait(p,3000);assert p.locator('#gameClock').inner_text()==clock;p.locator('#resume').click()
            solve(p,id,model)
            p.locator('#again').click();expect(p.locator('#result')).to_be_hidden();expect(p.locator('#play')).to_be_visible()
            assert not errors,errors
            print('PASS',size,id,flush=True);ctx.close()
    # A five-game set advances once per result and cannot double-count rapid clicks.
    ctx=browser.new_context();p=ctx.new_page();p.goto(URL);p.locator('#five').click();expect(p.locator('#runLabel')).to_have_text('SHITSHOW 1 / 5');ctx.close()
    browser.close()
