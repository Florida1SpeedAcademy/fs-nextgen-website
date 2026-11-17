(() => {
  'use strict';
  const entry = document.currentScript;
  const logoURL = new URL('../fs-loading-logo.svg', entry && entry.src ? entry.src : new URL('assets/homepage-2027/app.js', document.baseURI)).href;
  const key = 'fsnextgen-black-logo-heartbeat-v2';
  let current = null;
  function seen() { try { return sessionStorage.getItem(key) === '1'; } catch (_) { return false; } }
  function launch(force = false) {
    if (!document.body || current || (!force && seen())) return;
    if (!force && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const locked = Array.from(document.body.children).map(el => [el, el.inert]);
    const style = document.createElement('style');
    style.textContent = `#fs-black-loader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;box-sizing:border-box;background:#000000!important;color:#fff;isolation:isolate;overflow:hidden}#fs-black-loader *{box-sizing:border-box}#fs-black-loader img{display:block;width:min(86vw,76vh,540px);width:min(86vw,76dvh,540px);height:auto;max-width:100%;max-height:86vh;object-fit:contain;border:0;box-shadow:none;background:#000000;transform-origin:center;animation:fsLogoHeartbeat 1.1s ease-in-out infinite}#fs-black-loader button{position:absolute;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));min-height:44px;min-width:68px;padding:10px 16px;border:1px solid #4169e1;border-radius:6px;background:#000000;color:#fff;font:600 13px Arial,sans-serif;cursor:pointer}#fs-black-loader button:focus-visible{outline:2px solid #ffda24;outline-offset:4px}@keyframes fsLogoHeartbeat{0%,20%,40%,100%{transform:scale(1)}12%{transform:scale(1.045)}28%{transform:scale(1.025)}}@media(prefers-reduced-motion:reduce){#fs-black-loader img{animation:none;transform:none}}`;
    const overlay = document.createElement('section');
    overlay.id = 'fs-black-loader';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'FS NEXTGEN loading screen');
    const image = document.createElement('img');
    image.alt = 'FS NEXTGEN'; image.width = 1254; image.height = 1254;
    image.loading = 'eager'; image.decoding = 'async';
    const skip = document.createElement('button');
    skip.type = 'button'; skip.textContent = 'Skip';
    skip.setAttribute('aria-label', 'Skip loading screen and open website');
    overlay.append(image, skip);
    document.head.append(style);
    document.body.append(overlay);
    document.body.style.overflow = 'hidden';
    for (const [el] of locked) el.inert = true;
    let closed = false;
    const timers = [];
    const started = Date.now();
    function close() {
      if (closed) return;
      closed = true;
      try { sessionStorage.setItem(key, '1'); } catch (_) {}
      timers.forEach(id => window.clearTimeout(id));
      for (const [el, inert] of locked) el.inert = inert;
      document.body.style.overflow = overflow;
      overlay.remove(); style.remove();
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('load', pageReady);
      window.removeEventListener('pageshow', restored);
      current = null;
      if (previous && previous.isConnected && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    }
    function keyboard(event) {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') { event.preventDefault(); skip.focus({ preventScroll: true }); }
    }
    function pageReady() {
      if (closed || !image.complete || !image.naturalWidth) return;
      timers.push(window.setTimeout(close, Math.max(0, 4100 - (Date.now() - started))));
    }
    function restored(event) { if (event.persisted) close(); }
    current = { close };
    skip.addEventListener('click', close);
    image.addEventListener('error', close, { once: true });
    image.addEventListener('load', () => { if (document.readyState === 'complete') pageReady(); }, { once: true });
    document.addEventListener('keydown', keyboard);
    window.addEventListener('load', pageReady, { once: true });
    window.addEventListener('pageshow', restored);
    timers.push(window.setTimeout(close, 6500));
    image.src = logoURL;
    if (document.readyState === 'complete') pageReady();
    skip.focus({ preventScroll: true });
  }
  window.fsaReplayIntro = () => { if (current) current.close(); launch(true); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => launch(), { once: true });
  else launch();
})();

const menu = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.querySelector('span').textContent = '+';
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.querySelector('span').textContent = open ? '−' : '+';
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
