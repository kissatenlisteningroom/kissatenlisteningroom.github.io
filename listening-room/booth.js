(() => {
  const booth = document.querySelector('.booth');
  const filmBed = document.querySelector('.film-bed');
  const nav = booth.querySelector('.channels');
  const tabs = Array.from(nav.querySelectorAll('a'));
  const panels = Array.from(booth.querySelectorAll('.programme'));
  const tools = document.querySelector('.station-tools');
  const finder = document.querySelector('#find-station');
  const film = document.querySelector('#radio-film');
  const lookup = document.querySelector('#lookup');
  const keys = document.querySelector('#station-keys');
  const caption = document.querySelector('#station-caption');
  const stations = {
    brussels: ['Kiosk Radio · Brussels', 'https://www.kioskradio.com/'],
    tokyo: ['Tsubaki FM · Tokyo', 'https://tsubakifm.com/'],
    melbourne: ['Triple R · Melbourne', 'https://www.rrr.org.au/']
  };
  nav.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    const panel = panels[i];
    tab.id = 'choose-' + panel.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
  });

  function select(id) {
    if (!panels.some(panel => panel.id === id)) return false;
    panels.forEach((panel, i) => {
      const active = panel.id === id;
      if (!active) panel.querySelector('video').pause();
      panel.hidden = !active;
      tabs[i].setAttribute('aria-selected', String(active));
      tabs[i].tabIndex = active ? 0 : -1;
    });
    return true;
  }
  function choose(index) {
    const panel = panels[index];
    select(panel.id);
    if (location.hash !== '#' + panel.id) history.pushState(null, '', '#' + panel.id);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      choose(i);
    });
    tab.addEventListener('keydown', event => {
      const destinations = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      const next = destinations[event.key];
      choose(next);
      tabs[next].focus();
    });
  });
  function openFromHash() {
    const chapter = location.hash.slice(1).replace(/-view$/, '');
    if (select(chapter === 'walkthrough' ? 'room' : chapter)) filmBed.scrollIntoView();
    else select('room');
  }
  window.addEventListener('hashchange', openFromHash);
  document.querySelectorAll('.mast a[href="#radio"], .air-copy a[href="#radio"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const i = panels.findIndex(panel => '#' + panel.id === link.hash);
      choose(i);
      filmBed.scrollIntoView();
      // The turn releases the film controls on the scroll paint.
      requestAnimationFrame(()=>requestAnimationFrame(()=>tabs[i].focus({preventScroll:true})));
    });
  });
  finder.addEventListener('click', () => {
    const opening = lookup.hidden;
    finder.setAttribute('aria-expanded', String(opening));
    finder.textContent = opening ? 'Back to the radio film' : 'Explore the stations';
    if (opening) film.querySelector('video').pause();
    film.hidden = opening;
    lookup.hidden = !opening;
    keys.hidden = !opening;
  });
  keys.addEventListener('click', event => {
    const button = event.target.closest('button[data-station]');
    if (!button) return;
    const city = button.dataset.station;
    const [name, url] = stations[city];
    const link = document.createElement('a');
    link.href = url;
    link.textContent = name;
    caption.replaceChildren(link);
    keys.querySelectorAll('button').forEach(key => key.setAttribute('aria-pressed', String(key === button)));
  });
  const entryFilm = document.querySelector('.entry-jacket video');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let entryVisible = false;
  let viewerPaused = false;
  function updateEntryFilm() {
    if (!entryVisible || document.hidden || reduced.matches) {
      entryFilm.pause();
    } else if (!viewerPaused) {
      entryFilm.play().catch(() => { /* Native controls also allow manual play. */ });
    }
  }
  entryFilm.addEventListener('pause', () => {
    if (entryVisible && !document.hidden && !reduced.matches) viewerPaused = true;
  });
  entryFilm.addEventListener('play', () => { viewerPaused = false; });
  new IntersectionObserver(([entry]) => {
    entryVisible = entry.intersectionRatio >= .45;
    updateEntryFilm();
  }, {threshold:[0,.45]}).observe(entryFilm);
  reduced.addEventListener('change', updateEntryFilm);
  document.addEventListener('visibilitychange', updateEntryFilm);
  tools.hidden = false;
  openFromHash();
})();
