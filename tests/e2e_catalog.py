"""Pesquisa online na interface, com a rede simulada: python3 tests/e2e_catalog.py"""
import json, pathlib, sys, re
from playwright.sync_api import sync_playwright
URL=(pathlib.Path(__file__).resolve().parent.parent/'index.html').as_uri()
IT={'resultCount':2,'results':[
 {'wrapperType':'track','kind':'song','trackId':11,'trackName':'Música Um','artistName':'Artista A','collectionName':'Álbum X','releaseDate':'2019-05-01T07:00:00Z','artworkUrl100':'data:image/gif;base64,R0lGODlhAQABAAAAACw='.replace('data:','https://img.invalid/x.gif#')},
 {'wrapperType':'track','kind':'song','trackId':13,'trackName':'Música Dois','artistName':'Artista B','collectionName':'Álbum Y','releaseDate':'2021-03-03T08:00:00Z'}]}
IT2={'resultCount':1,'results':[{'wrapperType':'track','kind':'song','trackId':21,'trackName':'Outra Faixa','artistName':'Artista C','collectionName':'Álbum Z','releaseDate':'2022-01-01T08:00:00Z'}]}
CIFRA="Tom: G\n\n\u200bG       D/F#     Em7      C\nTexto de exemplo número um\nAm7      D7       G\nSegunda linha de exemplo\n\n\n\n\nG   Bm   C   D  (Riff)\nTerceira linha de exemplo\n"
fails=[];reqs=[]
def check(c,m):
    print(('OK   ' if c else 'FALHA'),m)
    if not c: fails.append(m)
mode={'v':'ok'}
def handler(route):
    r=route.request;reqs.append(r.url)
    if mode['v']=='offline': return route.abort('failed')
    if 'itunes' in r.url:
        data=IT2 if 'outra' in r.url.lower() else IT
        if mode['v']=='nocors' and r.resource_type=='fetch': return route.abort('failed')
        if 'callback=' in r.url:
            cb=re.search(r'callback=([\w]+)',r.url).group(1)
            return route.fulfill(status=200,content_type='text/javascript',body=f'{cb}({json.dumps(data)})')
        return route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(data))
    route.abort('failed')
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route(re.compile(r'https://(itunes\.apple\.com|musicbrainz\.org|img\.invalid)/.*'),handler)
    pg.goto(URL+'#/search');pg.wait_for_selector('#res')
    check('Sua biblioteca está vazia' in pg.inner_text('#res'),'biblioteca vazia no início')
    pg.fill('.search','musica um');pg.wait_for_selector('#online .item',timeout=8000)
    check(pg.locator('#online .item').count()==2,'2 resultados online')
    check('Artista A' in pg.inner_text('#online') and 'Álbum X' in pg.inner_text('#online') and '2019' in pg.inner_text('#online'),'título, artista, álbum e ano')
    href=pg.get_attribute('#online .item:nth-child(2) a','href');check('google.com/search?q=cifra' in href,'link "Procurar cifra" aponta para busca')
    check(pg.get_attribute('#online .item:nth-child(2) a','target')=='_blank' and 'noopener' in pg.get_attribute('#online .item:nth-child(2) a','rel'),'link abre em nova aba com noopener')
    pg.click('#online .item:nth-child(2) [data-act=addcat]');pg.wait_for_selector('dialog[open]')
    check(pg.input_value('#t')=='Música Um' and pg.input_value('#a')=='Artista A','dados preenchidos no formulário')
    check('Sem cifra' in pg.inner_text('#hint'),'aviso quando não há cifra')
    pg.fill('#b',CIFRA);pg.wait_for_timeout(150)
    check('Tom detectado' in pg.inner_text('#hint') or 'Tom informado' in pg.inner_text('#hint'),'tom reconhecido ao colar: '+pg.inner_text('#hint'))
    pg.click('dialog .btn.pri');pg.wait_for_selector('#res .item')
    check('Música Um' in pg.inner_text('#res') and 'tom G' in pg.inner_text('#res'),'música salva na biblioteca com o tom G (lido da linha "Tom:")')
    pg.click('#res >> text=Ver cifra');pg.wait_for_selector('#ch')
    txt=pg.inner_text('#ch');check('G       D/F#     Em7      C' in txt,'cifra limpa e alinhada')
    check('\u200b' not in txt and '\n\n\n\n' not in txt,'invisíveis e excesso de linhas removidos')
    check(pg.locator('#ch .ch').count()>=9,'acordes destacados (%d)'%pg.locator('#ch .ch').count())
    check('(Riff)' in txt and pg.locator('#ch .ch', has_text='Bm').count()==1,'linha com anotação reconhecida')
    # repetir a busca: o item salvo não aparece de novo online
    pg.goto(URL+'#/search');pg.fill('.search','musica');pg.wait_for_function("document.querySelector('#online .item')")
    check('Música Um' not in pg.inner_text('#online') and 'Música Dois' in pg.inner_text('#online'),'item já salvo some da lista online')
    # plano B (JSONP) quando o fetch é bloqueado
    mode['v']='nocors';pg.fill('.search','outra faixa');pg.wait_for_function("document.querySelector('#online').innerText.includes('Outra Faixa')",timeout=15000)
    check(any('callback=' in u for u in reqs),'usou plano B (callback) quando o fetch falhou')
    # sem conexão
    mode['v']='offline';pg.fill('.search','termo sem rede');pg.wait_for_function("document.querySelector('#online').innerText.includes('Sem conexão')",timeout=20000)
    check('Sem conexão' in pg.inner_text('#online'),'mensagem amigável sem internet')
    check('Nada na sua biblioteca' in pg.inner_text('#res'),'biblioteca continua funcionando offline')
    # desligar o catálogo online
    n=len(reqs);pg.uncheck('#onl');pg.fill('.search','musica dois');pg.wait_for_timeout(1500)
    check(pg.inner_text('#online').strip()=='' and len(reqs)==n,'com o catálogo desligado nada é enviado')
    pg.reload();pg.wait_for_selector('#onl');check(not pg.is_checked('#onl'),'preferência de desligar fica salva')
    # celular
    mode['v']='ok';pg.check('#onl');pg.set_viewport_size({'width':390,'height':844});pg.fill('.search','musica dois');pg.wait_for_selector('#online .item',timeout=8000)
    check(pg.evaluate('document.documentElement.scrollWidth-innerWidth')<=1,'sem rolagem horizontal no celular');pg.screenshot(path='/tmp/busca-390.png')
    pg.click('#online [data-act=addcat]');pg.wait_for_selector('dialog[open]');pg.screenshot(path='/tmp/dlg-390.png')
    b.close()
check(not errs,'sem erros de JS: '+str(errs[:3]))
print('\nRESULTADO:','tudo passou' if not fails else '%d falha(s): %s'%(len(fails),fails));sys.exit(1 if fails else 0)
