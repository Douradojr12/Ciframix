(function(){
const CM=window.CM=window.CM||{};
CM.norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
/* Contrato para fontes de cifras. Uma fonte nova só deve ser registrada
   se tiver autorização (API oficial, licença ou permissão do detentor). */
CM.SourceAdapter=class{
 get id(){throw new Error('id não definido')}
 get name(){throw new Error('name não definido')}
 /* Retorna [{ref,title,artist,key,source}] */
 async search(query){return []}
 /* Retorna {title,artist,key,body} para um resultado de search() */
 async getChart(ref){return null}
};
CM.sources=[];
CM.registerSource=a=>{CM.sources.push(a)};
/* Fonte local: músicas cadastradas ou importadas pelo próprio usuário. */
class LocalSource extends CM.SourceAdapter{
 get id(){return'local'}
 get name(){return'Minha biblioteca'}
 async search(q){
  const n=CM.norm(q);
  return CM.store.songs().filter(s=>!n||CM.norm(s.title).includes(n)||CM.norm(s.artist).includes(n))
   .map(s=>({ref:s.id,title:s.title,artist:s.artist,key:s.key,source:this.name}));
 }
 async getChart(ref){return CM.store.song(ref)||null}
}
CM.registerSource(new LocalSource());
})();
