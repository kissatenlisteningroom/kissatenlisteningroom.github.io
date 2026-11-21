// Coordinates in the original 1672 × 941 studio exposure.
const tuner = { x: 1228, y: 450 };
const glass = new Path2D();
glass.moveTo(1044, 69);
glass.lineTo(1589, 40);
glass.lineTo(1588, 368);
glass.lineTo(1043, 359);
glass.closePath();

// The existing padded booth exposure extends beyond the four inner glass edges.
// Register the exact final photograph inside it once so the last frame matches.
const plateLeft = 977;
export function prepareBooth(photo, padding) {
  const plate = document.createElement('canvas');
  plate.width = padding.naturalWidth;
  plate.height = padding.naturalHeight;
  const paint = plate.getContext('2d');
  if (!paint) return null;
  paint.drawImage(padding, 0, 0);
  paint.translate(-plateLeft, 0);
  paint.clip(glass);
  paint.drawImage(photo, 0, 0);
  return plate;
}

export function drawStudio(ctx, camera, photo, booth) {
  const { cx, cy, zoom, dolly } = camera;
  const travel = dolly / 1.42;
  const tilt = 0.032 * travel;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  // A slight diagonal camera move along the console. The lamp, desk, chair
  // and rug share one surface, including all their contact shadows.
  ctx.transform(1, 0, -0.015 * travel, 1 + tilt, 0, 0);
  ctx.translate(-tuner.x, -tuner.y);

  ctx.drawImage(photo, 0, 0);
  if (booth && dolly > 0) {
    ctx.save();
    ctx.clip(glass);
    // Most of the pull is lens zoom. Project the smaller physical camera move
    // onto a booth plane 1.6 times farther away, on the same axis as the knob.
    const approach = 0.14 * travel;
    const relativeScale = (1 - approach) / (1 - approach / 1.6);
    ctx.translate(tuner.x, tuner.y);
    ctx.scale(relativeScale, relativeScale);
    ctx.translate(-tuner.x, -tuner.y);
    ctx.drawImage(booth, plateLeft, 0);
    ctx.restore();
  }
  ctx.restore();
  return cy + zoom * (1 + tilt) * (photo.naturalHeight - tuner.y);
}
