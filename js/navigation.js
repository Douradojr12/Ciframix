(function(){
const CM=window.CM;const routes={};let leave=[];
CM.nav={
 route(name,fn){routes[name]=fn},
 onLeave(fn){leave.push(fn)},
 render(){
  const [,name,arg]=location.hash.split('/');
  const key=routes[name]?name:'home';
  leave.forEach(f=>{try{f()}catch(e){}});leave=[];
  document.body.classList.remove('play','stage');
  const main=document.getElementById('main');
  main.classList.remove('in');
  routes[key](main,arg);
  void main.offsetWidth;
  main.classList.add('in');
  window.scrollTo(0,0);
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===(key==='list'?'library':key)));
 },
 start(){addEventListener('hashchange',()=>CM.nav.render());CM.nav.render()}
};
})();
