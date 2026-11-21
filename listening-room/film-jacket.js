// The square travels to the optical centre while it turns. The back has an
// oversized square of paper behind the responsive, viewport-sized liner notes.
const mix = (a, b, t) => a + (b - a) * t;
const browseCount = 13;
const releaseAt = .57;
// Spine centres in the two photographed bays, measured on an 800px copy.
const photographedSpines = [
  [26, 45, 60, 77, 95, 111, 125, 138, 151, 162, 179, 194, 210, 225, 240, 254, 267, 280, 292, 307, 323, 339],
  [420, 437, 451, 464, 479, 491, 505, 520, 536, 549, 562, 575, 588, 600, 614, 626, 642, 657, 676, 691, 707, 722, 737]
];
function ease(p, from, to) {
  const t = Math.min(1, Math.max(0, (p - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function createJacketTurn(hold) {
  const source = hold.querySelector('.lp-harbour');
  const row = source.closest('.record-row');
  const photo = source.parentElement;
  const spineEdition = !!row.closest('.poster-edition');
  const spines = spineEdition ? Array.from({length:browseCount}, () => {
    const spine = document.createElement('i');
    spine.className = 'thumbed-spine';
    photo.append(spine);
    return spine;
  }) : [];
  const bed = document.querySelector('.film-bed');
  const booth = bed.querySelector('.booth');
  const carrier = document.createElement('div');
  carrier.className = 'turning-jacket';
  carrier.setAttribute('aria-hidden', 'true');
  const print = source.cloneNode(true);
  for (const el of print.querySelectorAll('[id]')) el.removeAttribute('id');
  carrier.append(print);
  hold.append(carrier);
  let width, height, side, startX, startY, paperSide;
  let last = -1, previousTime = 0, blurTimer;

  function layout() {
    width = hold.clientWidth;
    height = hold.clientHeight;
    side = source.offsetWidth;
    if (spineEdition) {
      const bay = parseFloat(getComputedStyle(row).getPropertyValue('--bay-width'));
      const count = Math.max(1, Math.round(photo.clientWidth / bay));
      const bayIndex = Math.floor((count - 1) / 2);
      const target = bayIndex + (count % 2 ? .61 : .84);
      const photoOffset = (bayIndex % 2) * 400;
      const selected = photoOffset + (target - bayIndex) * 400;
      const nearby = photographedSpines[bayIndex % 2]
        .filter(centre => centre < selected - 9).slice(-browseCount);
      source.style.left = (target * bay - side / 2) + 'px';
      const top = photo.clientHeight * .096;
      const stripWidth = bay * .021;
      spines.forEach((spine, i) => {
        const stripLeft = nearby[i] / 400 * bay - stripWidth / 2;
        spine.style.left = (bayIndex * bay + stripLeft - photoOffset / 400 * bay) + 'px';
        spine.style.top = top + 'px';
        spine.style.width = stripWidth + 'px';
        spine.style.height = photo.clientHeight * .773 + 'px';
        spine.style.backgroundSize = (2 * bay) + 'px ' + photo.clientHeight + 'px';
        spine.style.backgroundPosition = -stripLeft + 'px ' + -top + 'px';
      });
    }
    startX = row.offsetLeft + source.offsetParent.offsetLeft + source.offsetLeft + side / 2;
    startY = row.offsetTop + source.offsetTop + side / 2;
    paperSide = Math.max(width, height);
    carrier.style.width = carrier.style.height = side + 'px';
    booth.style.setProperty('--paper-side', paperSide + 'px');
    booth.style.setProperty('--camera-height', height + 'px');
    last = -1;
  }

  function clearBlur() {
    carrier.style.filter = '';
    clearTimeout(blurTimer);
  }

  function paint(p) {
    if (p === last) return;
    const now = performance.now();
    const elapsed = now - previousTime;
    const speed = last < 0 || elapsed <= 0 || elapsed > 100 ? 0 : Math.abs(p - last) / elapsed;
    previousTime = now;
    last = p;
    const lift = spineEdition ? releaseAt : .035;
    spines.forEach((spine, i) => {
      const start = .012 + i * .038;
      const peek = ease(p, start, start + .037) * (1 - ease(p, start + .037, start + .108));
      spine.style.visibility = peek > .002 ? 'visible' : 'hidden';
      spine.style.setProperty('--peek', peek.toFixed(3));
    });
    const flying = p > lift && p < 1;
    const release = (p - lift) / (1 - lift);
    const pickup = spineEdition ? ease(release, .15, .87) : ease(p, lift, .55);
    const angle = spineEdition
      ? 180 * ease(release, .16, .86)
      : 180 * ease(p, .11, .55);
    const back = angle >= 90;
    bed.dataset.turn = p >= 1 ? 'landed' : back ? 'turning' : 'shelved';
    if (!bed.inert && p < 1) {
      for (const video of booth.querySelectorAll('video')) if (!video.paused) video.pause();
    }
    bed.inert = p < 1;
    source.style.visibility = spineEdition || p > lift ? 'hidden' : '';
    carrier.style.visibility = flying && !back ? 'visible' : 'hidden';
    clearBlur();
    if (!flying) {
      booth.style.transform = '';
      return;
    }

    // Both axes arrive once. The following push holds that centre exactly.
    const cx = mix(startX, width / 2, pickup);
    // Tip the top edge out over the ledge before lifting towards the camera.
    const fold = spineEdition ? ease(release, 0, .22) * (1 - ease(release, .24, .80)) : 0;
    const cy = mix(startY + side * .15 * fold, height / 2, pickup);
    const grow = spineEdition ? ease(release, .44, 1) : ease(p, .43, 1);
    const size = side * Math.pow(1.35, pickup)
      * Math.pow(paperSide / (side * 1.35), grow);
    const turn = 'perspective(' + paperSide * 3 + 'px) rotateX(' + (-39 * fold) + 'deg) rotateY(';
    if (back) {
      booth.style.transformOrigin = (width / 2) + 'px ' + (height / 2) + 'px';
      booth.style.transform = 'translate3d(' + (cx - width / 2) + 'px,' + (cy - height / 2)
        + 'px,0) ' + turn + (180 - angle) + 'deg) scale(' + size / paperSide + ')';
    } else {
      // The front slips clear of the surrounding spines before turning.
      carrier.style.clipPath = spineEdition && release < .18
        ? 'inset(0 ' + (100 * (1 - ease(release, 0, .18))) + '% 0 -5px)'
        : '';
      carrier.style.transform = 'translate3d(' + (cx - side / 2) + 'px,' + (cy - side / 2)
        + 'px,0) ' + turn + (-angle) + 'deg) scale(' + size / side + ')';
    }
    if (!back && speed > .0001) {
      const blur = Math.min(1.3, speed * 1000) * Math.sin(Math.PI * pickup);
      carrier.style.filter = 'blur(' + blur.toFixed(2) + 'px)';
      blurTimer = setTimeout(clearBlur, 55);
    }
  }
  function reset() {
    clearBlur();
    bed.removeAttribute('data-turn');
    bed.inert = false;
    source.style.visibility = '';
    carrier.style.visibility = 'hidden';
    for (const spine of spines) spine.style.visibility = 'hidden';
    booth.removeAttribute('style');
    last = -1;
  }
  return {layout, paint, reset};
}
