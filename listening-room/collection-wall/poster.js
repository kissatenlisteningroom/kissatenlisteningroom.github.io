// Size the wall and complete walnut bays inside one travelling assembly.
export function prepareCollectionPoster(scene) {
  const panel = scene.querySelector('.shop-print');

  // Each photograph contains two complete bays. The rows share a bay width,
  // with heights derived from the original photographs to avoid stretching.
  const heights = [2 * 681 / 1020, 2 * 837 / 1536, 2 * 681 / 1020];
  const totalHeight = heights.reduce((sum, h) => sum + h, 0);
  const rows = Array.from(scene.querySelectorAll('.record-row'));
  const groupsByRow = new Map();
  function registerSpines(row, count, bay, height, index) {
    const previous = groupsByRow.get(row);
    if (previous?.bay === bay && previous.count === count) return;
    previous?.groups.forEach(group => group.remove());
    const groups = [];
    const top = index === 1 ? .10 : .13, foot = index === 1 ? .85 : .93;
    for (let i = 0; i < count; i++) {
      const group = document.createElement('i');
      group.className = 'packed-records';
      group.setAttribute('aria-hidden', 'true');
      const offset = (i % 2 === 0 ? .04 : .06) * bay;
      group.style.left = (i * bay + offset) + 'px';
      group.style.width = bay * .89 + 'px';
      group.style.top = top * height + 'px';
      group.style.height = (foot - top) * height + 'px';
      group.style.backgroundSize = bay * 2 + 'px ' + height + 'px';
      group.style.backgroundPosition = -(i % 2 * bay + offset) + 'px ' + -top * height + 'px';
      row.firstElementChild.prepend(group);
      groups.push(group);
    }
    groupsByRow.set(row, {count, bay, groups});
  }
  function settle(row, progress) {
    const groups = groupsByRow.get(row)?.groups || [];
    groups.forEach((group, i) => {
      const delay = .12 * (1 - i / Math.max(1, groups.length - 1));
      const t = Math.min(1, Math.max(0, (progress - .60 - delay) / .27));
      const angle = -.9 * Math.sin(t * 2 * Math.PI) * Math.sin(t * Math.PI) ** 2 * (1 - t);
      group.style.visibility = t > 0 && t < 1 ? 'visible' : 'hidden';
      group.style.transform = 'skewX(' + angle.toFixed(3) + 'deg)';
    });
  }
  const stacked = matchMedia('(max-width: 900px) and (orientation: portrait)');
  function layout() {
    const width = scene.clientWidth, height = scene.clientHeight;
    if (!width || !height) return;
    const side = Math.max(7, Math.min(15, width * .011));
    const crown = stacked.matches ? Math.max(8, Math.min(13, width * .028)) : 0;
    const bay = stacked.matches
      ? (width - side) / Math.max(1, Math.ceil((width - side) * totalHeight / (height * .69 - crown)))
      : height / totalHeight;
    const count = stacked.matches ? Math.round((width - side) / bay)
      : Math.max(1, Math.floor((width * .63 - side) / bay));
    rows.forEach((row, index) => registerSpines(row, count, bay, heights[index] * bay, index));
    scene.style.setProperty('--post', side + 'px');
    scene.style.setProperty('--bay-width', bay + 'px');
    scene.style.setProperty('--cabinet', (count * bay + side) + 'px');
    scene.style.setProperty('--crown', crown + 'px');
    scene.style.setProperty('--print-height', (height - bay * totalHeight - crown) + 'px');
    scene.style.setProperty('--bays', heights.map(ratio => (bay * ratio) + 'px').join(' '));
  }
  panel.querySelector('.fixture').addEventListener('animationend', event => {
    if (event.animationName === 'lightbox-strike') panel.dataset.light = 'on';
  });
  function settleLight(progress, arriving) {
    const state = panel.dataset.light;
    if (progress < .32) panel.dataset.light = 'off';
    else if (progress >= .98 && state !== 'starting') panel.dataset.light = 'on';
    else if (arriving && progress > .42 && state === 'off') {
      panel.dataset.light = 'starting';
    }
  }
  const observer = new ResizeObserver(layout);
  observer.observe(scene);
  layout();
  return {panel, layout, settle, settleLight};
}
