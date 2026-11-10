(function(){
const CM=window.CM;
/* CM.search(q)                  -> fontes locais (biblioteca)
   CM.search(q,{remote:'only'})  -> fontes online (lança erro se estiver sem conexão) */
CM.search=async(q,opts)=>{
 const only=!!(opts&&opts.remote==='only'),out=[];
 for(const s of CM.sources){
  if(!!s.remote!==only)continue;
  try{out.push(...await s.search(q))}catch(e){if(only)throw e;console.warn('Fonte falhou:',s.id,e)}
 }
 return out;
};
})();
