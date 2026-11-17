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
