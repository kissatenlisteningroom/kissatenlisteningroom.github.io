// Artwork coordinates. Each moving part shares the perspective of the wide plate.
export function createBroadcastRoom(canvas, room) {
  const ctx = canvas.getContext('2d');
  let camera, active = false, frame = 0, last = 0, elapsed = 0;
  if (!ctx) return () => {};
  function needle(x,y,t,phase) {
    // Cover the printed resting needle using a neighbouring sliver of the same meter face.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x-7.5,y-10.2);ctx.lineTo(x-5.9,y-11);ctx.lineTo(x+.5,y-1);ctx.lineTo(x-1,y-.5);
    ctx.closePath();ctx.clip();ctx.drawImage(room,2,0);ctx.restore();
    const signal=.51+.23*Math.sin(t*4.7)+.16*Math.sin(t*7.13+phase)+.09*Math.sin(t*2.3+phase);
    const a=-1.55+(signal-.5)*1.55;
    ctx.strokeStyle='#322014';ctx.lineWidth=.96;ctx.beginPath();
    ctx.moveTo(x,y-1);ctx.lineTo(x+Math.cos(a)*13.1,y+Math.sin(a)*13.1);ctx.stroke();
  }
  function platter(t) {
    // Only the rotating print moves. The photographed tonearm and reflected lamp stay on top.
    const cx=1503,cy=505.1;
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,.176);ctx.rotate(t*Math.PI*2*33.333/60);
    ctx.fillStyle='#5b3521';ctx.fillRect(-19,-1.25,8.5,2.5);ctx.fillRect(-18,2.4,5.4,1.1);
    ctx.strokeStyle='rgba(214,169,107,.50)';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(0,0,76,.45,.77);ctx.stroke();
    ctx.strokeStyle='rgba(75,62,47,.62)';ctx.beginPath();ctx.arc(0,0,84,2.9,3.17);ctx.stroke();
    ctx.restore();
    ctx.save();ctx.beginPath();ctx.moveTo(1483,513);ctx.lineTo(1504,511);ctx.lineTo(1584,485);
    ctx.lineTo(1592,491);ctx.lineTo(1513,517);ctx.lineTo(1510,528);ctx.lineTo(1483,530);ctx.closePath();
    ctx.clip();ctx.drawImage(room,0,0);ctx.restore();
  }
  function glow(x,y,rx,ry,alpha) {
    ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
    const wash=ctx.createRadialGradient(0,0,0,0,0,1);
    wash.addColorStop(0,'rgba(255,201,124,'+alpha+')');wash.addColorStop(1,'rgba(255,172,78,0)');
    ctx.fillStyle=wash;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  function clear(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);}
  function paint() {
    clear();
    const {left,top,zoom,dpr}=camera;
    ctx.setTransform(zoom*dpr,0,0,zoom*dpr,left*dpr,top*dpr);
    needle(902.7,442.5,elapsed,0);needle(948.1,443.6,elapsed,.63);
    platter(elapsed);
    const breath=.5+.5*Math.sin(elapsed*.83+.54*Math.sin(elapsed*.47));
    ctx.globalCompositeOperation='screen';
    glow(741,358,51,10,.021+.046*breath);glow(706,530,92,13,.007+.033*breath);
    ctx.globalCompositeOperation='source-over';
  }
  function tick(time) {
    frame=0;
    if(!active||document.hidden){last=0;return;}
    if(!last || time-last>=1000/30-1){
      if(last)elapsed+=Math.min((time-last)/1000,.1);
      last=time;paint();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    if(active && !document.hidden && !frame)frame=requestAnimationFrame(tick);
    if(!active || document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}
  }
  document.addEventListener('visibilitychange',sync);
  return (nextCamera,run) => {
    camera=nextCamera;
    if(active && !run)clear();
    active=run;
    sync();
  };
}
