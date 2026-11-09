(function(){
const CM=window.CM;
CM.search=async q=>{
 const out=[];
 for(const s of CM.sources){try{out.push(...await s.search(q))}catch(e){console.warn('Fonte falhou:',s.id,e)}}
 return out;
};
})();
