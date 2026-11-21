import {createCollectionTransition} from './collection.js?v=booth-liner';
import {createJacketTurn} from './film-jacket.js?v=booth-liner';
import {drawTunerFace} from './tuner-face.js?v=pressed-paper';
import {createBroadcastRoom} from './broadcast-room.js?v=one-revolution';
import {drawStudio, prepareBooth} from './broadcast-depth.js?v=shared-window-axis';

const main=document.querySelector('.side'), hold=main.querySelector('.hold');
const stage=hold.querySelector('.radio-scene');
const canvas=stage.querySelector('.cut'), ambience=stage.querySelector('.ambience');
const copy=stage.querySelector('figcaption'), cover=hold.querySelector('.spread');
const prop=cover.querySelector('.prop'), record=prop.querySelector('.record'), jacket=prop.querySelector('.jacket');
const slot=record.parentElement;
const collection = createCollectionTransition(hold);
const collectionScene = hold.querySelector('.collection-scene');
const guide = document.getElementById('guide');
const browserTint = document.querySelector('meta[name="theme-color"]');
const filmTurn = createJacketTurn(hold);
const studioMark = main.querySelector('.air-mark');
let shelfTravel = 0;
let turnTravel = 0;
const intro=cover.querySelector('.intro');
const media=matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 480px)');
const disc=record.querySelector('.pressing'), room=new Image();
const label=record.querySelector('.paper-label'), ring=record.querySelector('.pressing-ring');
room.src=stage.querySelector('.locked-plate').getAttribute('href');
const padding=new Image();
padding.src=new URL('./assets/depth-booth.webp',import.meta.url).href;
let booth;
const ctx=canvas.getContext('2d');
const setRoom=createBroadcastRoom(ambience,room);
const centre={x:1228,y:450,r:38.4};
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const ease=(v,lo,hi)=>{const t=clamp((v-lo)/(hi-lo),0,1);return t*t*(3-2*t)};
let w=0,h=0,dpr=1,travel=0,ready=false,requested=false,inView=true;
let opening;
const openingShare = .30;

function bezier(t, a, b, c, d) {
  const u = 1 - t;
  return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d;
}

function sleeve(progress, finalSize) {
  const visible = progress < 1;
  const visibility = visible ? 'visible' : 'hidden';
  cover.inert = !visible || progress > .7;
  cover.style.visibility = visibility;
  stage.style.visibility = visible ? 'hidden' : 'visible';
  stage.inert = visible;
  if (!visible) return;

  const t = ease(progress, .015, 1);
  const contact = .4;
  const width = opening.width;
  const draw = Math.min(t / contact, 1);
  const returning = t >= contact;
  const u = clamp((t - contact) / (1 - contact), 0, 1);
  const slide = ease(draw, 0, 1);
  const scale = mix(1, opening.fit, slide);
  const roll = mix(-3, -8, slide);
  const radians = roll * Math.PI / 180;
  const c = Math.cos(radians), s = Math.sin(radians);
  const hingeX = mix(-width * .10, opening.hingeX, slide);
  const hingeY = width - width * (1 - scale) / 2;
  jacket.style.transform = `translate(${hingeX}px,${hingeY-width}px) rotate(${roll}deg) scale(${scale})`;

  // Until release the spindle follows the tilted seam. Its leading rim travels
  // to the wall while the sleeve slips left, so the disc never hangs at contact.
  const diameter = width * scale * opening.sleevedDiameter;
  const rim = mix(opening.startRim, opening.wall, draw);
  const drawX = rim - diameter / 2;
  const heightWithinSleeve = mix(opening.startHeight, -.5, slide) * width * scale;
  const drawY = hingeY + ((drawX - hingeX) * s + heightWithinSleeve) / c;
  const run = drawX - opening.aimX;
  const bow = Math.min(h * .15, Math.abs(run) * .33);
  // Reflect the approach velocity at the wall. The first control point sets
  // the rebound tangent; the second gives the growing return its shallow arc.
  const tangent = (opening.wall - opening.startRim) * (1-contact) / (3*contact);
  const x = returning ? bezier(u, drawX, drawX - tangent*.9, opening.aimX + run*.10, opening.aimX) : drawX;
  const y = returning ? bezier(u, drawY, drawY + tangent*s/c, opening.aimY - bow*1.45, opening.aimY) : drawY;
  // The edge impulse carries a little spin through contact, then the record
  // coasts upright. Approach the full-frame camera on an optical scale.
  const spin = returning ? bezier(u, -21, -29, 0, 0) : mix(-5, -21, draw*draw*(1.8-.8*draw));
  const size = diameter * Math.pow(finalSize / diameter, ease(u, 0, 1));
  record.style.transform = `translate(${x-width/2}px,${y-width/2}px) rotate(${spin}deg) scale(${size/width})`;
  record.style.setProperty('--light-angle', `${-spin}deg`);

  if (returning) {
    slot.style.clipPath = 'none';
  } else {
    // Only material on the open side of the right seam can be seen.
    const mouthX = hingeX + width * scale * c;
    const mouthY = hingeY + width * scale * s;
    const seamX = y => mouthX - (y - mouthY) * s / c;
    const far = Math.max(opening.wall, width) + width;
    slot.style.clipPath = `polygon(${seamX(-width)}px ${-width}px,${far}px ${-width}px,${far}px ${2*width}px,${seamX(2*width)}px ${2*width}px)`;
  }
  slot.style.zIndex = returning ? '1' : '0';
}

function camera(p,size,portrait) {
  const cover=portrait?Math.max(w/960,h*.59/941):Math.max(w/1672,h/941);
  const endLeft=portrait ? clamp(w*.53-centre.x*cover,w-1672*cover,0) : (w-1672*cover)*.15;
  const endTop=portrait ? Math.min(0,h*.30-941*cover*.49) : (h-941*cover)/2;
  const pull=ease(p,.54,.89);
  const zoom=cover*Math.pow(size*.16/(centre.r*cover),1-pull);
  const cx=mix(w/2,endLeft+centre.x*cover,pull);
  const cy=mix(h/2,endTop+centre.y*cover,pull);
  // The tuner stays on the camera axis through the pullback.
  const dolly=1.42*(1-cover/zoom);
  return {left:cx-centre.x*zoom,top:cy-centre.y*zoom,zoom,cx,cy,dpr,
    dolly};
}

function grooves(p,size) {
  if(p<=0||p>=.825)return;
  const span=Math.max(w,h*.71);
  const life=Math.sin(Math.PI*ease(p,.065,.82));
  const front=span*mix(-.65,.95,ease(p,.115,.59));
  const ink=ease(p,0,.074);
  ctx.save();ctx.globalAlpha=ink;ctx.lineCap='round';
  for(let row=0;row<30;row++){
    const band=row/29,r=size*(.179+band*.305);
    const delay=band*.022;
    for(const sign of [-1,1]){
      const departing=ease(p,.49+delay+(sign+1)*.019,.75+delay+(sign+1)*.019);
      const shift=-departing*span*1.48;
      if(w/2+span*.78+shift<0)continue;
      ctx.beginPath();
      for(let i=0;i<=106;i++){
        const t=i/53-1,angle=t*Math.PI*.5;
        const stretch=ease(p,.027+delay,.295+delay);
        const lx=t*span*.78;
        const x=mix(r*Math.sin(angle),lx,stretch);
        const bend=(lx-front)/span;
        const crest=Math.sin(bend*12-band*.82+sign*.11)*Math.exp(-bend*bend*11)*life;
        const breath=.024*Math.sin(4.3*t+6*p-band)*life;
        const linear=sign*h*(.055+band*.135)+h*((.07+band*.08)*crest+breath);
        // A travelling peel starts at the leading end. The two halves continue to meet
        // wherever their common endpoint is visible, even at very slow scrub speeds.
        const arrival=.046+(1-t)*.052+delay;
        const peel=ease(p,arrival,arrival+.235);
        const join=1-ease(Math.abs(t),.60,1)*(1-ease(Math.abs(x),w*.47,w*.53));
        const y=mix(sign*r*Math.cos(angle),linear*join,peel);
        const exitCurl=h*.085*departing*Math.sin(6*t+departing*6+band*.6);
        // At the trailing end the grooves narrow into one curling tail as they cross the edge.
        const tail=ease(t,.62,1)*ease(p,.52,.68);
        const taper=tail*(.65+.25*departing);
        const tailY=h*(sign*.105+.07*Math.sin(7*t+6*departing));
        const px=w/2+x+shift+tail*span*(.11*Math.sin(band*3.1)-.07);
        const py=h/2+mix(y+exitCurl,tailY,taper);
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.lineWidth=row%5===0?1.15:.76;
      ctx.strokeStyle=row%5===0?'rgba(233,202,151,.70)':'rgba(205,188,151,.47)';
      ctx.stroke();
    }
  }
  ctx.restore();
}

function stations(p,lower) {
  if(p<.10||p>.84)return;
  const names=lower?['Brazil','Italy','Ghana']:['Brussels','Tokyo','Melbourne'];
  const row=lower?1:-1;
  const pitch=Math.min(w*(lower ? .56:.60),lower?320:380);
  const sweep=ease(p,lower ? .235:.17,lower ? .66:.61)*2;
  const trailing=ease(p,lower ? .57:.52,lower ? .82:.775)*(w+pitch*2.8);
  const baseline=h/2+row*h*(lower ? .216:.213);
  const anchor=(v)=>{
    const n=v-sweep;
    const depth=Math.exp(-Math.pow((n-(lower ? .17:-.12))/.76,2));
    const warp=Math.sin(n*2.8+(lower ? .5:-.15))*Math.exp(-n*n*.85);
    // Local projection lends the crest a changing apparent size and spacing.
    const x=w/2+n*pitch*(1+depth*(lower ? .16:.095))-trailing;
    const y=baseline+row*h*((lower ? .095:.071)*warp+depth*.019);
    return {x,y,scale:(lower ? .80:.94)+depth*(lower ? .48:.29),angle:warp*-.083};
  };
  ctx.save();ctx.globalAlpha=ease(p,lower ? .16:.10,lower ? .29:.24);
  ctx.textAlign='center';ctx.lineCap='round';
  ctx.strokeStyle=lower?'#aaa992':'#d5bd88';
  for(let i=-38;i<=81;i++){
    const {x,y,scale}=anchor(i/20);
    if(x<0||x>w)continue;
    const length=(i%5===0?13:5)*scale;
    ctx.lineWidth=i%5===0?1.1:.75;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+row*length);ctx.stroke();
  }
  const indexX=w/2-trailing;
  const index=anchor(sweep);
  ctx.strokeStyle=lower?'#aaa185':'#d9a16c';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(indexX,index.y+row*21);ctx.lineTo(indexX,index.y-row*5);ctx.stroke();
  ctx.fillStyle=lower?'#dfd7bb':'#f1dba5';
  ctx.font='italic '+clamp(w*.041,16,24)+'px Georgia';
  for(let i=0;i<names.length;i++){
    const a=anchor(i);
    if(a.x< -pitch||a.x>w+pitch)continue;
    ctx.save();ctx.translate(a.x,a.y+row*(lower?30:23)*a.scale);ctx.rotate(a.angle);ctx.scale(a.scale,a.scale);
    ctx.fillText(names[i],0,0);ctx.restore();
  }
  ctx.restore();
}

function render(){
  requested=false;
  if(!ready||!media.matches||!travel)return;
  const distance=-main.getBoundingClientRect().top;
  const progress=clamp(distance/travel,0,1);
  const onward=clamp((distance-travel)/shelfTravel,0,1);
  const turn=clamp((distance-travel-shelfTravel)/turnTravel,0,1);
  const p=clamp((progress-openingShare)/(1-openingShare),0,1);
  const portrait=w/h<.9,size=Math.hypot(w,h)*1.025;
  let mastStock = '';
  if (turn >= .99) {
    if (guide.getBoundingClientRect().top > 50) mastStock = 'paper';
  }
  else if (onward >= .97 && collectionScene.classList.contains('poster-edition')) {
    mastStock = 'charcoal';
  }
  if (document.documentElement.dataset.mastStock !== mastStock) {
    document.documentElement.dataset.mastStock = mastStock;
    browserTint.content = mastStock === 'charcoal' ? '#281b13' : mastStock === 'paper' ? '#d8c5a0' : '#263024';
  }
  sleeve(progress/openingShare,size);
  collection.paint(onward, turn < .035);
  filmTurn.paint(turn);
  if(onward===1)collectionScene.inert=turn>.16;
  if(progress<openingShare){setRoom(null,false);return;}
  if(onward>=1){stage.style.visibility='hidden';stage.inert=true;setRoom(null,false);return;}
  const cam=camera(p,size,portrait);
  ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);
  const roomBottom=p>=.54 ? drawStudio(ctx,cam,room,booth) : 0;
  const spindlePhase=clamp(p/.54,0,1);
  // One physical revolution with a short run-up and a long deceleration.
  const spin=2*Math.PI*(1-(1+4*spindlePhase)*Math.pow(1-spindlePhase,4));
  const hardware=ease(p,.315,.49), tunerTurn=ease(p,.395,.532);
  const lean=hardware*cam.dolly/1.42;
  ctx.save();
  ctx.translate(cam.cx,cam.cy);
  ctx.transform(1,0,-.015*lean,1+.032*lean,0,0);
  if(p<.602){
    const diameter=centre.r*cam.zoom/.16;
    ctx.save();
    ctx.rotate(spin);
    ctx.globalAlpha=1-ease(p,.54,.602);
    ctx.drawImage(disc,-diameter/2,-diameter/2,diameter,diameter);
    ctx.restore();
  }
  drawTunerFace(ctx,label,ring,0,0,centre.r*cam.zoom,hardware,tunerTurn,spin);
  ctx.restore();
  if(portrait && p>.63){
    // Extend the shadow under the console into the portrait text area.
    const bottom=roomBottom;
    const shade=ctx.createLinearGradient(0,bottom-h*.19,0,bottom);
    shade.addColorStop(0,'rgba(23,31,24,0)');shade.addColorStop(1,'#171f18');
    ctx.fillStyle=shade;ctx.fillRect(0,bottom-h*.19,w,h*.19+1);
  }
  grooves(p,size);
  stations(p,false);stations(p,true);
  const titleTravel = 1 - ease(p,.745,.90);
  copy.style.transform = portrait ? `translateY(${h*.78*titleTravel}px)` : `translateX(${-w*.51*titleTravel}px)`;
  copy.style.visibility=p<=.745?'hidden':'visible';
  copy.inert=p<.83 || onward>.05;
  setRoom(cam,p>=.89 && inView);
}

function queue(){if(!requested){requested=true;requestAnimationFrame(render);}}
function resize(){
  const active=ready&&media.matches;
  const enteringMotion=active && !document.documentElement.classList.contains('motion');
  document.documentElement.classList.toggle('motion',active);
  if(!active){
    for(const el of [stage,cover,slot,record,jacket,copy]){
      el.removeAttribute('style');el.inert=false;
    }
    delete document.documentElement.dataset.mastStock;
    browserTint.content = '#263024';
    collection.reset();filmTurn.reset();setRoom(null,false);return;
  }
  w=hold.clientWidth;h=hold.clientHeight;travel=studioMark.offsetTop;
  shelfTravel=Math.max(1,document.querySelector('.collection-mark').offsetTop-travel);
  turnTravel=Math.max(1,main.offsetHeight-h-travel-shelfTravel);
  collection.layout();
  filmTurn.layout();
  const box=prop.getBoundingClientRect(), frame=hold.getBoundingClientRect();
  const propStyle=getComputedStyle(prop);
  const sleevedDiameter=Number(propStyle.getPropertyValue('--sleeved-diameter'));
  const seatY = box.width * Number(propStyle.getPropertyValue('--sleeved-y'));
  const width = box.width;
  const radiusRatio = sleevedDiameter / 2;
  const angle = -8 * Math.PI / 180;
  const c = Math.cos(angle), s = Math.sin(angle);
  const wall = frame.right - box.left;
  // Reserve the actual printed lines, so the cardboard leaves a gutter beside
  // the type. On a stacked page the title already sits below the sleeve.
  const lines = document.createRange();
  let inkRight = frame.left;
  for (const block of intro.children) {
    lines.selectNodeContents(block);
    for (const rect of lines.getClientRects()) inkRight = Math.max(inkRight, rect.right);
  }
  const stacked = getComputedStyle(prop.parentElement).gridRowStart === '1';
  const gutter = clamp(w*.022, 14, 38);
  const leftLimit = (stacked ? frame.left : inkRight) - box.left + gutter;
  const lipGap = Math.max(3, width * .009);
  const span = radiusRatio + (1 + radiusRatio)*c - .5*s;
  const fit = Math.min(1, (wall-leftLimit-lipGap*c) / (width*span));
  const side = width*fit;
  const clearHinge = wall - side*radiusRatio - ((1+radiusRatio)*side+lipGap)*c - .5*side*s;
  const hingeX = Math.min(-.10*width, clearHinge);
  const startAngle = -3 * Math.PI / 180;
  opening = {
    width, sleevedDiameter, fit, hingeX, wall,
    startRim: width * (.55 + radiusRatio),
    startHeight: -.65*Math.sin(startAngle) + (seatY/width-.5)*Math.cos(startAngle),
    aimX: w/2 - (box.left-frame.left),
    aimY: h/2 - (box.top-frame.top)
  };
  dpr=Math.min(devicePixelRatio,1.6);
  for(const c of [canvas,ambience]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  queue();
  if(enteringMotion)requestAnimationFrame(landOnChapter);
}
document.addEventListener('scroll',queue,{passive:true});
new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;queue()}).observe(hold);
const sizes=new ResizeObserver(resize);
sizes.observe(hold);sizes.observe(prop);
media.addEventListener('change',resize);
Promise.all([disc.decode(),label.decode(),ring.decode(),room.decode(),padding.decode().catch(()=>null)]).then(()=>{
  if(!ctx)return;
  if(padding.naturalWidth)booth=prepareBooth(room,padding);
  ready=true;resize();
}).catch(()=>{});

// A direct Records link lands on the settled section, including from the
// films below it. Native anchors handle the ordinary reduced-motion layout.
function scrollToCollection() {
  if(!ready || !media.matches)return;
  scrollTo(0,scrollY+main.getBoundingClientRect().top+travel+shelfTravel);
  render();
  collectionScene.focus({preventScroll:true});
}
document.querySelector('.mast a[href="#collection"]').addEventListener('click',event=>{
  if(!ready || !media.matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
  event.preventDefault();
  if(location.hash!=='#collection')history.pushState(null,'','#collection');
  scrollToCollection();
});
function landOnChapter() {
  if(!ready || !media.matches)return;
  if(location.hash==='#on-air'){
    scrollTo(0,scrollY+main.getBoundingClientRect().top+travel);
    render();
  }
  if(location.hash==='#collection')scrollToCollection();
  if(['#booth','#walkthrough','#room','#records','#radio','#room-view','#records-view','#radio-view'].includes(location.hash)){
    scrollTo(0,scrollY+main.getBoundingClientRect().top+travel+shelfTravel+turnTravel);
    render();
    if(location.hash==='#booth'||location.hash==='#walkthrough')document.querySelector('.film-bed').focus({preventScroll:true});
  }
}
window.addEventListener('hashchange',()=>requestAnimationFrame(landOnChapter));
