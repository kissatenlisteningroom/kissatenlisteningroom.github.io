import {prepareCollectionPoster} from './collection-wall/poster.js?v=booth-liner';

const clamp = n => Math.max(0, Math.min(1, n));
const svgNS = 'http://www.w3.org/2000/svg';

// A quintic ease carries the shelf through the middle and brings both speed
// and acceleration to zero at the stop. Its position belongs to the scroll.
function roll(t) {
  return t * t * t * (10 + t * (-15 + 6 * t));
}

export function createCollectionTransition(hold) {
  const scene = hold.querySelector('.collection-scene');
  const poster = prepareCollectionPoster(scene);
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('shelf-filters');
  svg.setAttribute('aria-hidden', 'true');
  const defs = svg.appendChild(document.createElementNS(svgNS, 'defs'));
  const rows = [...scene.querySelectorAll('.record-row')].reverse().map((row, index) => {
    const filter = defs.appendChild(document.createElementNS(svgNS, 'filter'));
    filter.id = 'shelf-shutter-' + index;
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const blur = filter.appendChild(document.createElementNS(svgNS, 'feGaussianBlur'));
    blur.setAttribute('stdDeviation', '0 0');
    return {row, photo: row.firstElementChild, blur, filter, start: index * .17, x: 0};
  });
  hold.appendChild(svg);
  const loose = scene.querySelectorAll('.lp-coast, .lp-rings');
  let lastTime = 0, lastProgress = -1, lastWidth = 0, clearTimer = 0;

  function clearExposure() {
    scene.style.filter = '';
    for (const {photo} of rows) photo.style.filter = '';
    clearTimer = 0;
  }

  function paint(progress, inCollection) {
    const width = hold.clientWidth;
    if (progress === lastProgress && width === lastWidth) return;
    const now = performance.now();
    const elapsed = now - lastTime;
    const continuous = width === lastWidth && lastProgress >= 0 && elapsed > 0 && elapsed < 100 && Math.abs(progress-lastProgress) < .38;
    const arriving = progress > lastProgress && inCollection;
    lastTime = now;
    lastProgress = progress;
    lastWidth = width;
    scene.style.visibility = progress > 0 ? 'visible' : 'hidden';
    scene.inert = progress < .83;

    let moving = false;
    const distance = width + 32;
    const cabinetX = (1 - roll(progress)) * distance;
    if (poster) {
      // The post, three bays and lightbox have a single physical leading edge.
      scene.style.transform = progress < 1 ? 'translate3d(' + cabinetX + 'px,0,0)' : 'none';
    }
    rows.forEach((item, index) => {
      const t = poster ? progress : clamp((progress - item.start) / .66);
      const x = poster ? cabinetX : (1 - roll(t)) * distance;
      if (!poster) item.row.style.transform = t === 1 ? 'none' : 'translate3d(' + x + 'px,0,0)';
      const speed = continuous ? Math.abs(x-item.x) / elapsed : 0;
      item.x = x;
      // The cabinet and its practical light share one lateral exposure.
      if (!poster || index === 0) {
        const surface = poster ? scene : item.photo;
        const spread = poster ? Math.min(7, speed * 2.1) : Math.min(2.6, speed * .72);
        if (spread > .28 && t > 0 && t < 1) {
          item.blur.setAttribute('stdDeviation', spread.toFixed(2) + ' 0');
          surface.style.filter = 'url(#' + item.filter.id + ')';
          moving = true;
        } else {
          surface.style.filter = '';
        }
      }
      poster?.settle(item.row, t);
      if (index === 0) {
        loose.forEach((sleeve, i) => {
          const settle = clamp((t - .68 - i * .07) / .24);
          const tip = Math.sin(Math.PI * settle) ** 2 * (i === 0 ? -1.15 : -.54);
          sleeve.style.setProperty('--shuffle', tip.toFixed(3) + 'deg');
        });
      }
    });
    poster?.settleLight(progress, arriving);
    clearTimeout(clearTimer);
    if (moving) clearTimer = setTimeout(clearExposure, 48);
  }

  function reset() {
    clearTimeout(clearTimer);
    clearExposure();
    if (poster) {
      scene.style.removeProperty('transform');
      delete poster.panel.dataset.light;
      poster.layout();
      for (const {row} of rows) poster.settle(row, 1);
    }
    scene.style.removeProperty('visibility');
    scene.inert = false;
    for (const {row} of rows) row.style.removeProperty('transform');
    for (const sleeve of loose) sleeve.style.removeProperty('--shuffle');
    lastProgress = -1;
  }
  return {paint, reset, layout: () => poster?.layout()};
}
