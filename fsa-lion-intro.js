/* FS NextGen Athletics / Florida Speed Academy — Crown-free Lion + Lioness intro.
   Main asset: assets/cinematic/lion-countdown.mp4
   Automatically plays only once per tab session, with a real Skip Intro button.
   Existing homepage may call window.fsaReplayIntro() to replay.
   No changes to index.html, store, payments, or registration are required
   if index.html already loads fsa-lion-intro.js. */
(() => {
  'use strict';

  const script = document.currentScript;
  const base = script && script.src ? script.src : document.baseURI;
  const videoUrl = new URL('assets/cinematic/lion-countdown.mp4', base).href;
  const posterUrl = new URL('assets/cinematic/poster.jpg', base).href;
  const seenKey = 'fsnextgen-lion-lioness-crownfree-v1';
  const DURATION_CAP_MS = 6800;
  let overlay = null;
  let timer = null;
  let closing = false;

  const style = `
    #fsa-lion-intro{box-sizing:border-box;position:fixed;inset:0;z-index:2147483000;
      display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:#01040e;color:white;isolation:isolate;
      opacity:1;transition:opacity .34s ease;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
    #fsa-lion-intro *,#fsa-lion-intro *::before,#fsa-lion-intro *::after{box-sizing:border-box}
    #fsa-lion-intro::before{content:'';position:absolute;inset:-14%;pointer-events:none;
      background:radial-gradient(ellipse at 19% 61%,#005bff65 0,transparent 45%),
        radial-gradient(ellipse at 83% 59%,#fe008b60 0,transparent 49%),#030612;
      filter:blur(24px);animation:fsnAmbient 4s ease-in-out infinite alternate}
    #fsa-lion-intro .fsn-stage{position:relative;z-index:1;
      width:min(100vw,136svh,1150px);aspect-ratio:357/261;
      max-height:100svh;overflow:hidden;background:#020615;
      box-shadow:0 0 50px #005bff30,0 0 55px #f0009430}
    #fsa-lion-intro video,#fsa-lion-intro .fsn-poster{display:block;width:100%;height:100%;
      object-fit:fill}
    #fsa-lion-intro .fsn-poster{position:absolute;inset:0;pointer-events:none}
    #fsa-lion-intro .fsn-skip{position:absolute;right:3.5%;bottom:2.5%;z-index:3;
      border:2px solid #f63cae;border-radius:999px;
      background:#080718f2;color:#fff;padding:8px 13px;min-height:44px;
      font-size:clamp(11px,1.35vw,15px);font-weight:850;line-height:1.1;
      white-space:nowrap;letter-spacing:.015em;cursor:pointer;
      box-shadow:0 0 13px #f9009463}
    #fsa-lion-intro .fsn-skip:hover,#fsa-lion-intro .fsn-skip:focus-visible{
      outline:2px solid #48c6ff;outline-offset:3px;background:#14102b}
    #fsa-lion-intro .fsn-play{position:absolute;z-index:4;left:50%;top:60%;
      transform:translate(-50%,-50%);min-height:48px;min-width:140px;
      color:#fff;background:#11122df0;border:2px solid #27bfff;border-radius:999px;
      padding:12px 22px;font:800 16px system-ui,sans-serif;cursor:pointer;
      box-shadow:0 0 24px #007fff66}
    #fsa-lion-intro [hidden]{display:none!important}
    #fsa-lion-intro.fsn-fade{opacity:0;pointer-events:none}
    @keyframes fsnAmbient{from{transform:scale(1);opacity:.8}to{transform:scale(1.09);opacity:1}}
    @media(prefers-reduced-motion:reduce){#fsa-lion-intro,#fsa-lion-intro::before{transition:none;animation:none}}
  `;
  function wasSeen(){try{return sessionStorage.getItem(seenKey)==='1';}catch(e){return false;}}
  function markSeen(){try{sessionStorage.setItem(seenKey,'1');}catch(e){}}

  function clearIntro() {
    if(timer!==null) { window.clearTimeout(timer); timer=null; }
    if(!overlay || closing) return;
    closing=true;
    markSeen();
    const old=overlay;
    const vid=old.querySelector('video');
    if(vid) { try { vid.pause(); } catch(e){} }
    old.classList.add('fsn-fade');
    window.setTimeout(()=>{
      if(old.parentNode) old.remove();
      const st=document.getElementById('fsn-loading-style');
      if(st) st.remove();
      if(overlay===old) overlay=null;
      closing=false;
    },360);
  }

  function launch(force=false) {
    if(!document.body) return;
    if(overlay) return;
    if(!force && wasSeen()) return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches && !force){
      markSeen();return;
    }
    const previous=document.getElementById('fsn-loading-style');
    if(previous) previous.remove();
    const st=document.createElement('style');st.id='fsn-loading-style';st.textContent=style;
    document.head.appendChild(st);

    overlay=document.createElement('section');
    overlay.id='fsa-lion-intro';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-label','FS NextGen countdown to greatness loading introduction');
    overlay.innerHTML=`<div class="fsn-stage">
      <video autoplay muted playsinline webkit-playsinline preload="auto" poster="${posterUrl}"
        aria-label="Blue and yellow lion and blue and pink lioness countdown animation">
        <source src="${videoUrl}" type="video/mp4">
      </video>
      <button type="button" class="fsn-play" hidden>▶ Play Intro</button>
      <button type="button" class="fsn-skip" aria-label="Skip intro and open website">SKIP INTRO</button>
    </div>`;
    document.body.appendChild(overlay);
    const video=overlay.querySelector('video');
    const play=overlay.querySelector('.fsn-play');
    const skip=overlay.querySelector('.fsn-skip');
    skip.addEventListener('click',clearIntro);
    video.addEventListener('ended',clearIntro);
    video.addEventListener('playing',()=>{play.hidden=true;});
    video.addEventListener('error',()=>{
      // Missing or unsupported video must never block access to the website.
      clearIntro();
    });
    play.addEventListener('click',()=>{
      play.hidden=true;
      const result=video.play();
      if(result && result.catch) result.catch(()=>{play.hidden=false;});
    });
    const result=video.play();
    if(result && result.catch) result.catch(()=>{play.hidden=false;});
    timer=window.setTimeout(clearIntro,DURATION_CAP_MS);
  }

  window.fsaReplayIntro=()=>{
    if(overlay)clearIntro();
    window.setTimeout(()=>launch(true),400);
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>launch(),{once:true});
  } else launch();
})();
