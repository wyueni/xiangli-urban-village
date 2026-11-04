(() => {
  const gamePage = document.currentScript.hasAttribute('data-game');
  try {
    const visited = localStorage.getItem('xiangli-visited-v1') === '1'
      || localStorage.getItem('xiangli-plan-v4') !== null;
    if (!gamePage && visited) {
      location.replace('./management.html');
      return;
    }
    if (!gamePage) {
      document.addEventListener('click', event => {
        if (event.target.closest('a[href="./management.html"]')) {
          localStorage.setItem('xiangli-prologue-v1', '1');
        }
      });
      return;
    }
    if (location.protocol !== 'file:' && !visited && !localStorage.getItem('xiangli-prologue-v1')) {
      location.replace('./index.html');
      return;
    }
    if (visited) document.documentElement.classList.add('returning-player');
    localStorage.setItem('xiangli-visited-v1', '1');
  } catch {}
})();
