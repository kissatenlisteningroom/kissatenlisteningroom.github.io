// The ink and paper turn with the spindle. Light on the shallow pressing ring
// stays on the studio side of the frame as the record turns beneath it.
export function drawTunerFace(ctx, label, ring, x, y, radius, hardware, turn, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radius, radius);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, 2 * Math.PI);
  ctx.clip();
  ctx.save();
  ctx.rotate(spin);
  ctx.drawImage(label, -1, -1, 2, 2);
  ctx.restore();
  ctx.drawImage(ring, -1, -1, 2, 2);

  if (hardware > 0) {
    // Raking light picks out the moulded lip. The printed face stays opaque.
    ctx.globalAlpha = hardware;
    const softEdge = ctx.createRadialGradient(-.09, -.09, .56, 0, 0, 1);
    softEdge.addColorStop(0, 'rgba(46,23,12,0)');
    softEdge.addColorStop(.88, 'rgba(46,23,12,.07)');
    softEdge.addColorStop(1, 'rgba(29,14,7,.57)');
    ctx.fillStyle = softEdge;
    ctx.fillRect(-1, -1, 2, 2);
    const bevel = ctx.createLinearGradient(-.64, -.82, .64, .82);
    bevel.addColorStop(0, '#c19967');
    bevel.addColorStop(.42, '#85603b');
    bevel.addColorStop(1, '#47331e');
    ctx.strokeStyle = bevel;
    ctx.lineWidth = .018;
    ctx.beginPath();
    ctx.arc(0, 0, .971, 0, 2 * Math.PI);
    ctx.stroke();

    // An inset index seats against the receiver's photographed 12 o'clock mark.
    ctx.rotate(spin + (-27 + 29 * turn) * Math.PI / 180);
    const tip = -.934 + hardware * .166;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#bb9462';
    ctx.lineWidth = .015;
    ctx.beginPath();
    ctx.moveTo(.011, -.938);
    ctx.lineTo(.011, tip);
    ctx.stroke();
    ctx.strokeStyle = '#493421';
    ctx.lineWidth = .020;
    ctx.beginPath();
    ctx.moveTo(0, -.938);
    ctx.lineTo(0, tip);
    ctx.stroke();
  }
  ctx.restore();
}
