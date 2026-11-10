/* Catálogo online e limpeza de cifra colada: node tests/catalog.test.js (usa fetch simulado, sem internet) */
const assert=require('assert');global.window=global;let mem={};global.localStorage={getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v}};
['storage','source-adapter','search','catalog'].forEach(f=>require('../js/'+f+'.js'));
let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
CM.catalog.gap=0;
let calls=[],mode='ok';
const IT={resultCount:3,results:[
 {wrapperType:'track',kind:'song',trackId:11,trackName:'Música Um',artistName:'Artista A',collectionName:'Álbum X',releaseDate:'2019-05-01T07:00:00Z',artworkUrl100:'http://img.example/a/100x100bb.jpg',primaryGenreName:'Sertanejo'},
 {wrapperType:'track',kind:'song',trackId:12,trackName:'Música Um',artistName:'Artista A',collectionName:'Outro álbum',releaseDate:'2020-01-01T07:00:00Z'},
 {wrapperType:'track',kind:'song',trackId:13,trackName:'Música Dois',artistName:'Artista B',collectionName:'Álbum Y',releaseDate:'2021-03-03T08:00:00Z',artworkUrl100:'https://img.example/b.jpg'},
 {wrapperType:'artist',artistName:'Sem nome de música'}]};
const MB={count:2,recordings:[{id:'abc',title:'Faixa MB',length:1000,'artist-credit':[{name:'Duo',joinphrase:' & '},{name:'Fulano'}],'first-release-date':'2015-07-07',releases:[{title:'Disco MB'}]},{id:'def',title:'Sem artista','artist-credit':[]}]};
global.fetch=async url=>{calls.push(String(url));
 if(String(url).includes('itunes')){if(mode==='itunes-down'||mode==='all-down')throw new Error('rede');return{ok:true,json:async()=>mode==='itunes-empty'?{resultCount:0,results:[]}:IT}}
 if(mode==='mb-down'||mode==='all-down')throw new Error('rede');return{ok:true,json:async()=>MB}};
(async()=>{
 const S=CM.sources.find(s=>s.id==='catalog');
 ok(S.remote===true&&CM.sources.find(s=>s.id==='local').remote===false,'fontes marcadas como online/local');
 let r=await CM.search('musica um',{remote:'only'});
 eq(r.map(x=>x.title),['Música Um','Música Dois'],'filtra só músicas e remove duplicadas');
 eq([r[0].artist,r[0].album,r[0].year,r[0].cover],['Artista A','Álbum X','2019','https://img.example/a/100x100bb.jpg'],'campos e capa https');
 ok(calls.length===1&&calls[0].includes('country=BR')&&calls[0].includes('entity=song')&&calls[0].includes('term=musica+um'),'URL da API da Apple: '+calls[0]);
 await CM.search('MÚSICA um',{remote:'only'});eq(calls.length,1,'segunda busca igual vem do cache (respeita o limite da API)');
 eq((await CM.search('musica um')).length,0,'busca local não consulta a internet');eq(calls.length,1);
 /* plano B: Apple sem resultados -> MusicBrainz */
 CM.catalog.reset();calls=[];mode='itunes-empty';r=await CM.search('faixa mb',{remote:'only'});
 eq(r.map(x=>[x.title,x.artist,x.album,x.year]),[['Faixa MB','Duo & Fulano','Disco MB','2015']],'MusicBrainz: junta artistas e descarta sem artista');
 ok(calls.length===2&&calls[1].includes('musicbrainz.org/ws/2/recording')&&calls[1].includes('fmt=json'),'URL do MusicBrainz');
 ok(decodeURIComponent(calls[1].replace(/\+/g,' ')).includes('(recording:faixa OR artist:faixa) AND (recording:mb OR artist:mb)'),'consulta Lucene por palavra: '+calls[1]);
 CM.catalog.reset();calls=[];await CM.search('a"b (x) OR:y',{remote:'only'});ok(!/[()"]/.test(decodeURIComponent(calls[calls.length-1].split('query=')[1].split('&limit')[0].replace(/\+/g,' ')).replace(/[()]/g,'').replace(/ OR | AND /g,'')),'caracteres especiais do Lucene removidos');
 /* Apple fora do ar, MusicBrainz responde */
 CM.catalog.reset();calls=[];mode='itunes-down';r=await CM.search('qualquer coisa',{remote:'only'});ok(r.length===1,'Apple fora -> usa MusicBrainz');
 /* tudo fora: erro tratável (a tela mostra "Sem conexão") */
 CM.catalog.reset();mode='all-down';let err=null;try{await CM.search('sem rede',{remote:'only'})}catch(e){err=e}ok(err&&err.message==='offline','sem conexão lança erro "offline"');
 /* termos muito curtos não chamam a internet */
 calls=[];eq(await CM.search('ab',{remote:'only'}),[]);eq(calls.length,0,'menos de 3 letras não consulta');
 /* links e limpeza de cifra colada */
 const L=CM.chartLinks({title:'Música Um',artist:'Artista A'});ok(L.google.startsWith('https://www.google.com/search?q=cifra%20')&&L.youtube.includes('youtube.com/results'),'links de busca da cifra');
 let c=CM.cleanChart('\r\n\r\nTom: G\r\n\r\n\r\n\r\nG\u200b   D   \r\nletra\u00a0aqui  \r\n\r\n\r\n');
 eq(c.key,'G');eq(c.body,'Tom: G\n\n\nG   D\nletra aqui','remove invisíveis, espaços no fim e excesso de linhas em branco');
 eq(CM.cleanChart('Tom: F♯m\nF#m').key,'F#m');eq(CM.cleanChart('tom: bb\nBb').key,'Bb');eq(CM.cleanChart('sem tom aqui').key,'');
 eq(CM.cleanChart('G  D\n\nletra\n').body,'G  D\n\nletra','preserva linhas em branco entre trechos');
 CM.store.addSong({title:'T',artist:'A',album:'Al',year:'2020x1',cover:'http://inseguro/x.jpg'});const s=CM.store.songs()[0];
 ok(s.album==='Al'&&s.year==='2020'&&!s.cover,'só guarda capa https e ano de 4 dígitos');
 console.log('OK —',n,'verificações');
})().catch(e=>{console.error(e);process.exit(1)});
