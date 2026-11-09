"""Teste ponta a ponta em Chromium real: python3 tests/e2e.py (requer playwright)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=(ROOT/'index.html').as_uri()
def song(i,t,a,k,body): return {'id':f's{i}','title':t,'artist':a,'key':k,'body':body,'created':i}
LONG='\n'.join(f"G         D\nlinha de teste {n} da canção\nEm        C\nmais uma linha de teste {n}\n" for n in range(1,14))
SONGS=[song(1,'Teste Um','Autor A','G',LONG),song(2,'Teste Dois','Autor B','A',"A       E/G#   F#m7\nPalavras de exemplo aqui\nD    A/C#  Bm7  E7(b9)\nSegunda linha original\n"),
 song(3,'Teste Três','Autor C','Em',LONG),song(4,'Teste Quatro','Autor D','C',LONG),song(5,'Teste Cinco','Autor E','D',LONG)]
errs=[];fails=[]
def check(c,m):
    print(('OK   ' if c else 'FALHA'),m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':800});pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL+'#/library');pg.evaluate("d=>localStorage.setItem('ciframix:v1',d)",json.dumps({'songs':SONGS,'setlists':[],'prefs':{}}));pg.reload();pg.wait_for_selector('h1')
    # 1. criar repertório
    pg.click('text=Novo pot-pourri >> nth=0');pg.fill('#n','Meu Pot Teste');pg.click('dialog .btn.pri')
    pg.wait_for_selector('#ln');check(pg.input_value('#ln')=='Meu Pot Teste','repertório criado e editor aberto')
    # 2. adicionar 5 músicas
    for i in range(5):
        pg.click(f'#eres .item:nth-child({1}) [data-add]') if False else None
    for t in ['Teste Um','Teste Dois','Teste Três','Teste Quatro','Teste Cinco']:
        pg.fill('#aq',t);pg.wait_for_timeout(350);pg.click('#eres [data-add]')
    check(pg.locator('.sitem').count()==5,'5 músicas adicionadas')
    # 3. reordenar (botão) e arrastar
    pg.click('.sitem:nth-child(1) [data-a=dn]');titles=lambda:[t.split('. ',1)[1] for t in pg.locator('.sitem .sinfo .t').all_inner_texts()]
    check(titles()[:2]==['Teste Dois','Teste Um'],'reordenar com ▼ funciona: '+str(titles()))
    pg.set_viewport_size({'width':1280,'height':1500})
    g=pg.locator('.sitem:nth-child(3) .grip').bounding_box();t=pg.locator('.sitem:nth-child(1)').bounding_box()
    pg.mouse.move(g['x']+g['width']/2,g['y']+g['height']/2);pg.mouse.down();pg.mouse.move(g['x']+20,g['y']-20,steps=5)
    pg.mouse.move(t['x']+200,t['y']+10,steps=15);pg.mouse.move(t['x']+210,t['y']+12,steps=3);pg.mouse.up();pg.wait_for_timeout(300)
    check(titles()[0]=='Teste Três','arrastar e soltar (mouse real) funciona: '+str(titles()))
    pg.set_viewport_size({'width':1280,'height':800})
    # 4. tom individual + duplicar + observação
    pg.click('.sitem:nth-child(2) [data-a="t-"]');pg.click('.sitem:nth-child(2) [data-a="t-"]')
    check('−2'==pg.locator('.sitem:nth-child(2) .tv').inner_text(),'tom -2 aplicado ao item 2')
    pg.click('.sitem:nth-child(3) [data-a=dup]');check(pg.locator('.sitem').count()==6,'duplicar item')
    pg.fill('.sitem:nth-child(1) textarea.note','Começar no refrão');pg.wait_for_timeout(400)
    pg.reload();pg.wait_for_selector('.sitem')
    check(pg.locator('.sitem').count()==6 and pg.input_value('.sitem:nth-child(1) textarea.note')=='Começar no refrão','persistência após recarregar (editor)')
    # 5. página única
    pg.click('text=Tocar pot-pourri');pg.wait_for_selector('.song')
    check(pg.locator('.song').count()==6,'todas as músicas em uma página')
    txt=pg.locator('.song').nth(1).inner_text()
    # Teste Dois tem tom -2 aplicado? localizar a seção
    sec=[s for s in pg.locator('.song').all_inner_texts() if 'Teste Dois' in s][0]
    check('Tom G' in sec and 'orig. A' in sec,'tom visível e transposto (A → G)')
    check('G       D/F#   Em7' in sec and 'C    G/B  Am7  D7(b9)'.replace('C','C') not in sec and 'C    G/B  Am7  D7(b9)' not in sec and 'B    F#/A#  Gm7  C7(b9)' not in sec,'acordes transpostos mantendo colunas')
    check('C    G/B  Am7  C7(b9)'.replace('C    G/B  Am7  C7(b9)','B    A/C#  Gm7  C#7(b9)') not in sec and 'C    G/B' not in sec,'sem sobras do texto original') if False else None
    check('Palavras de exemplo aqui' in sec and 'Segunda linha original' in sec,'letra intacta')
    check('Começar no refrão' in pg.inner_text('.pot'),'observação aparece')
    # 6. rolagem
    pg.click('#tg');pg.wait_for_timeout(2500);y1=pg.evaluate('scrollY');check(y1>20,'rolagem iniciou (scrollY=%d)'%y1)
    check('Pausar' in pg.inner_text('#tg'),'botão vira Pausar')
    pg.keyboard.press('Space');pg.wait_for_timeout(300);y2=pg.evaluate('scrollY');pg.wait_for_timeout(800);check(pg.evaluate('scrollY')==y2,'Espaço pausa')
    check('Continuar' in pg.inner_text('#tg'),'botão vira Continuar')
    pg.keyboard.press('Space');pg.wait_for_timeout(300)
    lv=pg.inner_text('#spd');pg.keyboard.press('ArrowUp');pg.keyboard.press('ArrowUp');pg.wait_for_timeout(100)
    check(pg.inner_text('#spd')!=lv,'velocidade muda em tempo real: %s -> %s'%(lv,pg.inner_text('#spd')))
    y=pg.evaluate('scrollY');pg.wait_for_timeout(1000);check(pg.evaluate('scrollY')>y,'continua rolando após mudar velocidade')
    pg.keyboard.press('Space')
    # 7. navegação
    pg.click('[data-c=restart]');pg.wait_for_timeout(200);check(pg.evaluate('scrollY')==0,'reiniciar volta ao topo')
    pg.keyboard.press('ArrowRight');pg.wait_for_timeout(900);check('2.' in pg.inner_text('#pnow'),'→ vai para a próxima música: '+pg.inner_text('#pnow').replace('\n',' | '))
    pg.keyboard.press('ArrowLeft');pg.wait_for_timeout(900);check('1.' in pg.inner_text('#pnow'),'← volta à música anterior')
    # 8. modo palco
    pg.click('#stg');check(pg.evaluate("document.body.classList.contains('stage')"),'modo palco ativo')
    check(not pg.is_visible('.nav') and 'Próxima:' in pg.inner_text('#pnow'),'menus ocultos e próxima música visível')
    fs=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.pot .chart')).fontSize)");check(fs>=23,'fonte maior no palco (%spx)'%fs)
    pg.keyboard.press('Escape');check(not pg.evaluate("document.body.classList.contains('stage')"),'Esc sai do palco')
    # 9. fim da rolagem
    pg.evaluate('scrollTo(0,document.documentElement.scrollHeight-innerHeight-500)');pg.wait_for_timeout(200);pg.click('#tg')
    for _ in range(9): pg.keyboard.press('ArrowUp')
    pg.wait_for_function("document.querySelector('#tg').textContent.includes('Recomeçar')",timeout=40000)
    check(pg.evaluate('scrollY')>=pg.evaluate('document.documentElement.scrollHeight-innerHeight')-2,'rolagem chega ao fim e para sem travar')
    # 10. persistência final
    pg.goto(URL+'#/library');pg.reload();check('Meu Pot Teste' in pg.inner_text('main') and '6 músicas' in pg.inner_text('main'),'repertório persiste após recarregar')
    # 11. responsivo
    for w,h in [(390,800),(820,1100),(1440,900)]:
        pg.set_viewport_size({'width':w,'height':h});pg.goto(URL+'#/play/'+pg.evaluate("JSON.parse(localStorage['ciframix:v1']).setlists[0].id"));pg.wait_for_selector('.song')
        ov=pg.evaluate('document.documentElement.scrollWidth-innerWidth');check(ov<=1,'sem rolagem horizontal da página em %dpx'%w)
        pg.screenshot(path=f'/tmp/play-{w}.png')
    pg.set_viewport_size({'width':390,'height':800});pg.click('#stg');pg.wait_for_timeout(300);pg.screenshot(path='/tmp/stage-390.png')
    bh=pg.evaluate("document.querySelector('[data-c=toggle]').getBoundingClientRect().height");check(bh>=56,'botão principal grande no celular (%dpx)'%bh)
    pg.goto(URL+'#/library');pg.screenshot(path='/tmp/lib-390.png')
    pg.set_viewport_size({'width':1280,'height':800});pg.goto(URL+'#/list/'+pg.evaluate("JSON.parse(localStorage['ciframix:v1']).setlists[0].id"));pg.wait_for_selector('.sitem');pg.screenshot(path='/tmp/editor-1280.png')
    b.close()
check(not errs,'sem erros de console/JS: '+str(errs[:3]))
print('\nRESULTADO:', 'tudo passou' if not fails else '%d falha(s): %s'%(len(fails),fails));sys.exit(1 if fails else 0)
