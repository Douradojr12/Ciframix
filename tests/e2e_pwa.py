"""PWA, offline, persistência real (fechar/abrir navegador), editar/excluir música, ajuda. python3 tests/e2e_pwa.py"""
import subprocess, time, sys, json, pathlib, tempfile, urllib.request
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent;PORT=8765;URL=f'http://localhost:{PORT}/'
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.2)
fails=[];errs=[]
def check(c,m):
    print(('OK   ' if c else 'FALHA'),m)
    if not c: fails.append(m)
try:
    man=json.load(urllib.request.urlopen(URL+'manifest.webmanifest'))
    check(man['display']=='standalone' and man['start_url'] and any(i['sizes']=='512x512' for i in man['icons']) and any(i['sizes']=='192x192' for i in man['icons']),'manifest válido (standalone, ícones 192 e 512)')
    for i in man['icons']: check(urllib.request.urlopen(URL+i['src']).status==200,'ícone existe: '+i['src'])
    sw=urllib.request.urlopen(URL+'sw.js').read().decode()
    files=json.loads(sw.split('const FILES=')[1].split(';\n')[0])
    missing=[f for f in files if f!='./' and not (ROOT/f).exists()];check(not missing,'todos os arquivos do cache existem '+str(missing))
    used=[str(p.relative_to(ROOT)) for p in list((ROOT/'js').glob('*.js'))+list((ROOT/'css').glob('*.css'))]
    check(all(u in files for u in used),'o cache cobre todos os js/css')
    ud=tempfile.mkdtemp()
    with sync_playwright() as p:
        ctx=p.chromium.launch_persistent_context(ud,viewport={'width':1280,'height':800});pg=ctx.new_page()
        pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.goto(URL+'#/home');pg.wait_for_function("navigator.serviceWorker.controller||navigator.serviceWorker.ready.then(()=>true)");pg.wait_for_timeout(1500)
        check(pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!(r&&r.active))"),'service worker ativo')
        pg.reload();pg.wait_for_timeout(500);check(pg.evaluate("!!navigator.serviceWorker.controller"),'página controlada pelo service worker')
        # cadastrar, editar, excluir música
        pg.goto(URL+'#/search');pg.click('text=Cadastrar música');pg.fill('#t','Música Própria');pg.fill('#a','Eu');pg.fill('#k','D');pg.fill('#b','D       A\nletra original minha\nBm      G\nsegunda linha minha');pg.click('dialog .btn.pri');pg.wait_for_selector('#res .item')
        check('Música Própria' in pg.inner_text('#res'),'música cadastrada')
        pg.click('#res >> text=Ver cifra');pg.wait_for_selector('#ch');pg.click('#ed');pg.fill('#t','Música Editada');pg.click('dialog .btn.pri');pg.wait_for_selector('h1:has-text("Música Editada")')
        check('Música Editada' in pg.inner_text('h1'),'edição de música funciona')
        # pot-pourri, tom, fecha e reabre o navegador
        pg.goto(URL+'#/library');pg.click('text=Novo pot-pourri >> nth=0');pg.fill('#n','Persistente');pg.click('dialog .btn.pri');pg.wait_for_selector('#ln')
        pg.fill('#aq','Editada');pg.wait_for_timeout(350);pg.click('#eres [data-add]');pg.click('[data-a="t+"]');pg.click('[data-a="t+"]');pg.wait_for_timeout(300)
        ctx.close()
        ctx=p.chromium.launch_persistent_context(ud,viewport={'width':1280,'height':800});pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(URL+'#/library');pg.wait_for_selector('.item')
        check('Persistente' in pg.inner_text('main') and '1 música' in pg.inner_text('main'),'repertório continua após fechar e abrir o navegador')
        pg.click('text=Tocar >> nth=0');pg.wait_for_selector('.song')
        check('Tom E' in pg.inner_text('.tompill') and 'orig. D' in pg.inner_text('.tompill'),'tom personalizado (D +2 = E) preservado')
        # offline
        ctx.set_offline(True);pg.goto(URL+'#/library');pg.reload();pg.wait_for_selector('h1')
        check('Biblioteca' in pg.inner_text('h1') and 'Persistente' in pg.inner_text('main'),'abre e funciona OFFLINE')
        ctx.set_offline(False)
        # backup: exporta e confere data
        pg.goto(URL+'#/library');pg.wait_for_selector('h1')
        with pg.expect_download() as d: pg.click('text=Exportar JSON')
        data=json.load(open(d.value.path()));check(data['app']=='ciframix' and len(data['songs'])==1 and len(data['setlists'])==1,'exportação JSON correta')
        pg.wait_for_timeout(300);check('nunca' not in pg.inner_text('.sub'),'data do último backup exibida')
        # excluir música
        pg.goto(URL+'#/search');pg.wait_for_selector('#res .item');pg.click('#res [data-act=delsong]');pg.click('dialog .btn.pri');pg.wait_for_timeout(400)
        check('Sua biblioteca está vazia' in pg.inner_text('#res'),'excluir música funciona')
        pg.goto(URL+'#/library');pg.wait_for_selector('.item');pg.click('text=Editar >> nth=0');pg.wait_for_selector('#items');check('0 música' in pg.inner_text('#cnt'),'música excluída sai do pot-pourri')
        # importar de volta
        pg.goto(URL+'#/library');pg.set_input_files('#imp',d.value.path());pg.wait_for_timeout(500)
        check('Importado' in pg.inner_text('#toast'),'importação executada: '+pg.inner_text('#toast'))
        pg.goto(URL+'#/search');pg.wait_for_selector('#res .item');check('Música Editada' in pg.inner_text('#res'),'importação restaurou a música')
        # ajuda e mobile
        pg.goto(URL+'#/help');check('Backup dos repertórios' in pg.inner_text('main'),'página de ajuda')
        pg.set_viewport_size({'width':390,'height':800});pg.goto(URL+'#/home')
        check(pg.evaluate('document.documentElement.scrollWidth-innerWidth')<=1,'início sem rolagem horizontal no celular')
        check(pg.locator('.nav a:visible').count()==4,'barra inferior do celular com 4 abas')
        pg.screenshot(path='/tmp/home-390.png');ctx.close()
finally: srv.terminate()
check(not errs,'sem erros de console/JS: '+str(errs[:3]))
print('\nRESULTADO:','tudo passou' if not fails else '%d falha(s): %s'%(len(fails),fails));sys.exit(1 if fails else 0)
