(()=>{
  'use strict';
  const menuButton=document.querySelector('#menu-toggle');
  const menu=document.querySelector('#mobile-menu');
  const searchButton=document.querySelector('#search-toggle');
  const searchPanel=document.querySelector('#search-panel');
  const searchClose=document.querySelector('#search-close');
  const searchInput=document.querySelector('#site-search');
  const searchResults=document.querySelector('#search-results');
  const body=document.body;
  function toggleMenu(open){
    menu.hidden=!open;
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');
    body.classList.toggle('menu-is-open',open);
    if(open)toggleSearch(false);
  }
  function toggleSearch(open){
    searchPanel.hidden=!open;
    searchButton.setAttribute('aria-expanded',String(open));
    searchButton.setAttribute('aria-label',open?'Close site search':'Open site search');
    if(open){toggleMenu(false);searchInput.focus();}
  }
  menuButton.addEventListener('click',()=>toggleMenu(menu.hidden));
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));
  searchButton.addEventListener('click',()=>toggleSearch(searchPanel.hidden));
  searchClose.addEventListener('click',()=>toggleSearch(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleMenu(false);toggleSearch(false);}});
  const searchIndex=[
    ['Track and field programs','#programs','sprints jumps distance athletics'],
    ['Speed and agility','#programs','training running practice private'],
    ['Cross country','#programs','distance endurance xc'],
    ['7v7 football','#programs','football sessions'],
    ['Athlete highlights','#highlights','photos results medals'],
    ['Program fees and training','#pricing','pricing cost indoor outdoor sessions'],
    ['Scholarships and sponsorships','#support','donate sponsor nonprofit scholarships'],
    ['About Florida Speed Academy','#about','leadership mission coaches'],
    ['Team store','#store','gear uniforms merchandise'],
    ['Contact us','#contact','email phone']
  ];
  function renderSearch(){
    const query=searchInput.value.toLowerCase().trim();
    searchResults.replaceChildren();
    if(!query){searchResults.textContent='Search our programs, fees, athlete highlights and sponsorship opportunities.';return;}
    const found=searchIndex.filter(([title,,tags])=>(title+' '+tags).toLowerCase().includes(query));
    if(!found.length){searchResults.textContent='No matching section. Try “track”, “fees” or “sponsor”.';return;}
    found.forEach(([title,href])=>{const link=document.createElement('a');link.href=href;link.textContent=title+' ↗';link.addEventListener('click',()=>toggleSearch(false));searchResults.append(link);});
  }
  searchInput.addEventListener('input',renderSearch);renderSearch();
  const slides=[...document.querySelectorAll('.hero-slide')];
  const dots=[...document.querySelectorAll('.carousel-dot')];
  const caption=document.querySelector('#image-caption');
  const captions=['OUR ATHLETES. OUR WHY.','THE WORK IS REAL.','ONE TEAM. ONE STANDARD.'];
  const hero=document.querySelector('#home');
  let current=0;
  let timer=null;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showSlide(next){
    current=(next+slides.length)%slides.length;
    slides.forEach((el,i)=>{el.classList.toggle('is-active',i===current);el.setAttribute('aria-hidden',String(i!==current));});
    dots.forEach((el,i)=>{el.classList.toggle('is-active',i===current);if(i===current){el.setAttribute('aria-current','true');}else{el.removeAttribute('aria-current');}});
    caption.textContent=captions[current];
  }
  function stopAutoplay(){if(timer){clearInterval(timer);timer=null;}}
  function startAutoplay(){if(!reduceMotion&&!timer){timer=setInterval(()=>showSlide(current+1),6500);}}
  document.querySelector('#slide-prev').addEventListener('click',()=>{showSlide(current-1);stopAutoplay();startAutoplay();});
  document.querySelector('#slide-next').addEventListener('click',()=>{showSlide(current+1);stopAutoplay();startAutoplay();});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{showSlide(i);stopAutoplay();startAutoplay();}));
  hero.addEventListener('mouseenter',stopAutoplay);
  hero.addEventListener('mouseleave',startAutoplay);
  hero.addEventListener('focusin',stopAutoplay);
  hero.addEventListener('focusout',startAutoplay);
  document.addEventListener('visibilitychange',()=>document.hidden?stopAutoplay():startAutoplay());
  showSlide(0);startAutoplay();
  document.querySelector('#year').textContent=new Date().getFullYear();
})();
