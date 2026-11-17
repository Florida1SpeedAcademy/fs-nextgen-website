(() => {
  'use strict';

  const menu = document.querySelector('.menu-button');
  const navigation = document.querySelector('#navigation');
  if (!menu || !navigation) return;

  function closeMenu() {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    const icon = menu.querySelector('span');
    if (icon) icon.textContent = '+';
  }

  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    const icon = menu.querySelector('span');
    if (icon) icon.textContent = open ? '−' : '+';
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

  const desktop = window.matchMedia('(min-width: 901px)');
  if (desktop.addEventListener) desktop.addEventListener('change', closeMenu);
  else if (desktop.addListener) desktop.addListener(closeMenu);
})();

(() => {
  'use strict';
  if (!document.body || document.getElementById('fsa-logo-intro')) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  overlay.id = 'fsa-logo-intro';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'Welcome to FS NextGen, Florida Speed Academy');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;';
  const logo = document.createElement('img');
  logo.alt = 'FS NextGen lion logo';
  logo.style.cssText = 'display:block;width:min(72vw,340px);height:auto;max-height:70vh;object-fit:contain;';
  logo.decoding = 'async';
  logo.fetchPriority = 'high';
  let finished = false;
  let displayTimer;
  let safetyTimer;
  function closeIntro() {
    if (finished) return;
    finished = true;
    window.clearTimeout(displayTimer);
    window.clearTimeout(safetyTimer);
    document.removeEventListener('keydown', onKey);
    if (reducedMotion) { overlay.remove(); return; }
    overlay.style.transition = 'opacity 250ms ease';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    window.setTimeout(() => overlay.remove(), 280);
  }
  function onKey(event) {
    if (event.key === 'Escape') closeIntro();
  }
  logo.addEventListener('load', () => {
    if (!finished) displayTimer = window.setTimeout(closeIntro, reducedMotion ? 500 : 1800);
    if (!finished && !reducedMotion && typeof logo.animate === 'function') {
      try {
        logo.animate([
          { transform: 'scale(1)', offset: 0 },
          { transform: 'scale(1.065)', offset: 0.14 },
          { transform: 'scale(1)', offset: 0.28 },
          { transform: 'scale(1.04)', offset: 0.42 },
          { transform: 'scale(1)', offset: 0.58 },
          { transform: 'scale(1)', offset: 1 }
        ], { duration: 1050, iterations: Infinity, easing: 'ease-in-out' });
      } catch (error) { /* Keep the intro functional without animation support. */ }
    }
  }, { once: true });
  logo.addEventListener('error', closeIntro, { once: true });
  overlay.addEventListener('click', closeIntro);
  document.addEventListener('keydown', onKey);
  overlay.appendChild(logo);
  document.body.appendChild(overlay);
  safetyTimer = window.setTimeout(closeIntro, 4000);
  logo.src = new URL('assets/homepage-2027/assets/fs-lion.png', document.baseURI).href;
})();
