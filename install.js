(function(scope){'use strict';
 const safeHTTPS=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&!['localhost','127.0.0.1','example.com'].includes(u.hostname)&&!u.hostname.endsWith('.invalid')&&!u.hostname.endsWith('.local')?u.href:null;}catch{return null;}};
 function links(config){const source=safeHTTPS(config?.sourceURL),id=config?.bundleIdentifier;if(!config?.ready||!source||typeof id!=='string'||!/^[A-Za-z0-9.-]{3,200}$/.test(id))return null;const u=new URL(source);const add='https://altstore.io/source/'+u.host+u.pathname;return {source,add,install:add+'?app='+encodeURIComponent(id)};}

function phoneURL(location,computer='Mac',stage='kissaten'){
  try{const u=new URL(location);const branded=u.origin==='https://kissatenlisteningroom.github.io';const legacy=u.origin==='https://getmeouttahere311.github.io'&&u.pathname.startsWith('/kissaten-install/');if(!branded&&!legacy)return null;u.pathname=branded?'/':'/kissaten-install/';u.search='';u.hash='';u.searchParams.set('continue',stage==='prepare'?'prepare':'kissaten');u.searchParams.set('computer',computer==='Windows'?'Windows':'Mac');return u.href;}catch{return null;}
}
const storageKey = 'kissaten-install-guide-v2';
const completeStep = 9;
function readProgress(host = scope) {
  try {
    const saved = JSON.parse(host.localStorage.getItem(storageKey) || '{}');
    if (Number.isInteger(saved?.step) && saved.step > 0 && saved.step < 19) return saved;
  } catch {}
  return {step: 0};
}
function bindSetupEntries(doc, host = scope) {
  const entries = [...doc.querySelectorAll('[data-setup-entry]')];
  if (!entries.length) return;
  const available = links(host.KissatenInstallConfig);
  if (available) {
    doc.querySelectorAll('[data-beta-closed]').forEach(note => note.hidden = true);
  }
  function update() {
    const {step} = readProgress(host);
    const label = step === completeStep ? 'Review setup guide'
      : step > 0 ? 'Continue setup' : available ? 'Set up Kissaten' : 'Preview iPhone setup';
    for (const entry of entries) {
      entry.querySelector('[data-setup-label]').textContent = label;
    }
  }
  update();
  host.addEventListener('pageshow', update);
  host.addEventListener('storage', update);
}
function mount(doc, config={}){
  const available=links(config);
  const onPhone = /iPhone|iPad|iPod/.test(scope.navigator?.userAgent || '');
  const official = 'https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos';
  const saved = readProgress();
  let step = saved.step;
  let computer = saved.computer === 'Windows' ? 'Windows' : 'Mac';
  let experienced = !!saved.experienced;
  let history = Array.isArray(saved.history) ? saved.history.filter(n => Number.isInteger(n) && n >= 0 && n <= 19).slice(-40) : [];
  // Only setup preferences cross devices, never credentials or commercial access.
  let pendingSetup=null;
  try{const arrival=new URL(scope.location.href),q=arrival.searchParams;const intent=q.get('continue');if(intent==='kissaten'||intent==='prepare'){
    const requested=q.get('computer')==='Windows'?'Windows':'Mac';
    if(intent==='kissaten'){step=7;computer=requested;experienced=true;history=[];}
    else if(step>1&&step!==19){pendingSetup={step,computer,requested};step=19;}
    else{step=2;computer=requested;experienced=false;history=[];}
    q.delete('continue');q.delete('computer');scope.history?.replaceState?.(null,'',arrival.href);
  }}catch{}
  // A new visitor starts at the invitation, without overwriting saved setup on arrival.
  let homepageEntry=false,homepageWelcome=false;
  try{homepageEntry=new URL(scope.location.href).searchParams.get('start')==='welcome';}catch{}
  const earlierSetup=homepageEntry&&step>0?{step,computer,experienced,history:[...history]}:null;
  if(homepageEntry){homepageWelcome=true;step=0;experienced=false;history=[];}
  const content = doc.querySelector('#content');
  const helpPanel = doc.querySelector('#help-panel');
  const icons = {
    computer: '<rect x="8" y="10" width="48" height="33" rx="2"/><path d="M27 43v8m10-8v8M19 52h26"/>',
    cable: '<rect x="5" y="13" width="27" height="23" rx="2"/><path d="M9 43h19m-9-7v7m13-17h7c9 0 6 24 15 24"/><rect x="46" y="5" width="13" height="24" rx="2"/><path d="M50 25h5"/>',
    phone: '<rect x="17" y="5" width="30" height="54" rx="5"/><path d="M27 11h10M28 52h8"/>',
    refresh: '<path d="M49 21a22 22 0 1 0 3 22M49 8v13H36"/><path d="m23 33 7 7 12-14"/>',
    source: '<rect x="11" y="8" width="42" height="48" rx="3"/><path d="M21 20h22m-22 8h22m-11 9v12m-6-6h12"/>'
  };
  const picture = (icon, title, text) => `<div class="illustration"><svg viewBox="0 0 64 64" aria-hidden="true">${icons[icon]}</svg><div><p>${title}</p><small>${text}</small></div></div>`;
  const list = (items) => `<ol class="instructions">${items.map((t,i)=>`<li><span aria-hidden="true">${i+1}.</span><div>${t}</div></li>`).join('')}</ol>`;
  const action = (label, next, secondary='') => `<div class="actions"><button class="brass hardware-control hardware-brass" data-next="${next}">${label} <b aria-hidden="true">→</b></button>${secondary}</div>`;
  const external = (url, label) => `<a class="external" target="_blank" rel="noopener noreferrer" href="${url}">${label} <span aria-hidden="true">↗</span></a>`;
  const visual = (kind,body,caption) => `<figure class="setup-visual ${kind}"><div class="visual-scene" aria-hidden="true">${body}</div><figcaption>Illustration · ${caption}</figcaption></figure>`;
  const disclosure = (label, body) => `<details class="step-details"><summary>${label}</summary>${body}</details>`;
  const downloadVisual = () => visual('download-visual',`<div class="finder-strip">Finder <span>Downloads</span></div><div class="file-journey"><div><span class="file-shape">ZIP</span><strong>altserver.zip</strong><small>Double-click</small></div><span class="file-arrow">→</span><div><span class="file-shape">App</span><strong>AltServer</strong><small>Drag to Applications</small></div></div><div class="applications-target">Applications <span>→ Open AltServer</span></div>`,'Find the download, unpack it, then move the app. Safari may already have unpacked the ZIP.');
  const menuVisual = () => visual('menu-visual',`<div class="mac-menu"><span>Top-right of your Mac</span><span class="menu-target"><img src="assets/altserver-menu.png" alt="" width="22" height="22"> <span>← AltServer</span></span></div><div class="example-menu"><span>AltServer</span><strong>Install AltStore <span>›</span></strong><span class="example-device">Then choose your iPhone</span></div>`,'The real AltServer diamond icon, enlarged. The menu and phone name can look different on your Mac.');
  const phoneTask = (task) => visual('device-visual',`<div class="device-pair"><div class="guide-device"><svg viewBox="0 0 64 64">${icons.computer}</svg><strong>Keep this guide open</strong><small>${onPhone?'Return here afterward':'On your '+computer}</small></div><span class="file-arrow">→</span><div class="phone-device"><svg viewBox="0 0 64 64">${icons.phone}</svg><strong>${onPhone?'On this iPhone':'Pick up your iPhone'}</strong><small>${task}</small></div></div>`,'Do the phone step, then return to this guide and continue.');
  const transfer = () => {if(onPhone)return `<p class="confirmation">You’re on your iPhone. Keep AltServer running on your ${computer==='Windows'?'Windows PC':'Mac'} while you use AltStore.</p>`;const url=phoneURL(scope.location?.href,computer);return `<section class="phone-transfer" aria-label="Continue on iPhone"><h2>Move the guide to your iPhone.</h2><p>Keep AltServer running on your ${computer==='Windows'?'Windows PC':'Mac'}. Open the guide on your iPhone to use the AltStore buttons there.</p>${url?`<button class="secondary" id="copy-phone-link">Copy link to send to my iPhone</button><p class="small">This button copies a link—it does not send it. ${computer==='Mac'?'Send it to yourself with AirDrop or a message':'Send it to yourself in a message'} and open it on your iPhone. It opens the Kissaten stage; it does not transfer your Apple details or browser history.</p>`:'<p class="small">Phone link unavailable in this local preview. Once this guide is published, you’ll be able to copy a link that opens this stage on your iPhone.</p>'}<p id="phone-link-message" role="status"></p></section>`;};
  const data = () => [
    {
      context:'Your iPhone · Guided setup',
      title:available?(homepageWelcome?'Getting started':'Install Kissaten.'):'Preview iPhone setup',
      body:`${available
        ? '<p class="intro">Have your iPhone, a Mac or Windows computer and a data cable ready.</p>'
        : '<p class="intro">Kissaten isn’t available to download yet. You can explore the app or preview the setup steps. You don’t need to install anything today.</p><p class="confirmation">When the beta opens, you’ll need your iPhone, a Mac or Windows computer and a data cable.</p>'}
        ${action(available?'Start setup':'Preview setup steps',1,'<button class="secondary" id="already">I already have AltStore</button>')}
        ${homepageWelcome&&earlierSetup?'<button class="secondary" id="resume-homepage-setup">Continue my saved setup instead</button>':''}`,
      help:'Have a Mac or Windows computer, your iPhone and its cable nearby. You’ll sign in only inside AltServer and approve Apple’s prompts on your own devices.'
    },
    {context:'Before we begin · On your computer',title:'Mac or Windows?',body:`<p class="intro">Choose the computer you’ll use to set up your iPhone.</p><div class="choices" role="group" aria-label="Choose computer">${['Mac','Windows'].map(os=>`<button class="choice" data-os="${os}"><strong>${os}</strong><span class="choice-arrow" aria-hidden="true">→</span></button>`).join('')}</div><button class="secondary" id="no-computer">I don’t have a computer nearby</button>`,help:'The Classic route needs access to a computer for its initial setup. If you don’t have one nearby, leave this guide here and return when you do. The guide remembers your place on this browser.'},
    {
      context:`Prepare · On your ${computer==='Mac'?'Mac':'Windows PC'}`,
      title:onPhone?`Get AltServer on your ${computer==='Mac'?'Mac':'PC'}.`:'Download AltServer.',
      body:onPhone
        ? `<p class="intro">Keep this guide open on your iPhone. On your ${computer==='Mac'?'Mac':'PC'}, open a browser and type <strong>altstore.io</strong>.</p>
          <p>Choose <strong>Get AltStore</strong>, then look under <strong>AltStore Classic</strong>. ${computer==='Mac'?'Select <strong>AltServer macOS</strong>.':'Open the <strong>Install Guide</strong> and follow the Windows instructions.'} Come back here when it’s ready.</p>
          ${action(computer==='Mac'?'I’ve downloaded it':'AltServer is installed',10)}`
        : `<p class="intro">AltServer runs on your computer and installs AltStore on your iPhone.</p>
          <a class="download-panel" target="_blank" rel="noopener noreferrer" href="${computer==='Mac'?'https://cdn.altstore.io/file/altstore/altserver.zip':'https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows'}">${picture('computer',computer==='Mac'?'Download AltServer for Mac':'Set up AltServer for Windows',computer==='Mac'?'Official download · macOS 11 or later · ZIP file':'Open the official Windows requirements and download instructions.')}<span class="download-label">${computer==='Mac'?'Download from AltStore':'Open Windows setup'} <span aria-hidden="true">↗</span></span></a>
          ${action(computer==='Mac'?'I’ve downloaded it':'AltServer is installed',10)}`,
      help:onPhone?'Keep this guide on your iPhone while you use altstore.io on your computer. Get AltStore takes you to Downloads. Use the AltStore Classic section.':'The download comes from AltStore. On macOS 10.14 or 10.15, use the older version linked in the official guide. Windows has separate Apple software requirements.'
    },
    {
      context:`Prepare · Your iPhone and ${computer}`,
      title:'Connect your iPhone.',
      body:`<p class="intro">Connect your iPhone to your ${computer==='Windows'?'Windows PC':'Mac'} with a data cable.</p>
        ${list([
          '<strong>On your iPhone:</strong> unlock it. Review Trust if prompted and enter your passcode on the phone.',
          computer==='Mac'
            ? '<strong>On your Mac:</strong> open Finder and select your iPhone under Locations. Wait for its full details to load.'
            : '<strong>On your PC:</strong> open the Apple device software and check it shows your unlocked iPhone.'
        ])}
        ${action(computer==='Mac'?'I can see my iPhone’s details in Finder':'I can see my iPhone’s details',11)}
        <button class="secondary connection-help" data-help="finder">My phone isn’t connecting</button>
        ${computer==='Mac'?disclosure('Show me Finder','<figure class="finder-example"><img src="assets/finder-ready.svg" alt="Illustrated Finder window: select iPhone under Locations, then look for the General tab and loaded device details."><figcaption>Your iPhone name and Finder layout may differ.</figcaption></figure>'):''}`,
      help:'Charging alone does not confirm a data connection. Use My phone isn’t connecting for the check that matches your screen.'
    },
    {
      context:`AltStore · On your ${computer==='Mac'?'Mac':'Windows PC'}`,
      title:computer==='Mac'?'Find the little diamond.':'Find AltServer by the clock.',
      body:`<p class="intro">Click ${computer==='Mac'?'the AltServer diamond in your Mac’s menu bar':'AltServer near the Windows clock'}. Choose <strong>Install AltStore</strong>, then choose your iPhone.</p>
        ${action('The sign-in box is open',12)}
        ${computer==='Mac'?disclosure('Show me the AltServer icon',menuVisual()):''}
        <button class="secondary" data-help="menu">I can’t see AltServer</button>`,
      help:'Open AltServer from Applications on Mac or the Start menu on Windows. On Mac, move the pointer to the top edge to show a hidden menu bar. On Windows, check the hidden icons near the clock. AltServer runs in the background, and usually there is no app window.'
    },
    {
      context:'AltStore · On your iPhone',title:'Trust this installation.',
      body:`<p class="intro">Open <strong>Settings → General → VPN &amp; Device Management</strong>. Under Developer App, select the Apple Account you used and choose <strong>Trust</strong> if it matches.</p>
        ${action('I’ve reviewed and trusted it',6,'<button class="secondary" data-next="13">AltStore already opens</button>')}
        <button class="secondary" data-help="trust">I can’t find my email or Trust</button>`,
      help:'Your Apple Account signed this installation. Trust lets your iPhone run apps signed by that account. Settings wording can vary by iOS version. The trust confirmation happens in Settings.'
    },
    {context:'AltStore · On your iPhone',title:'Turn on Developer Mode.',body:`<p class="intro">Developer Mode lets your iPhone run development-signed apps, including this AltStore installation. Review Apple’s explanation before enabling it.</p>${phoneTask('Review Developer Mode')}${picture('phone','Settings → Privacy & Security → Developer Mode','Review the explanation, then follow the phone’s restart and confirmation prompts.')}<button class="secondary" data-help="developer">I can’t find Developer Mode</button>${action('AltStore opens on my iPhone',13)}<p class="confirmation">If AltStore already opens, continue. After the restart, unlock your iPhone, confirm if asked, and tap AltStore to open it. ${onPhone?'Return to this browser afterward.':'Keep this guide open on your computer.'}</p>`,help:'Developer Mode availability depends on the phone’s iOS version and setup state. If you don’t see it, check the official guide. Your progress and computer choice stay in this browser.'},
    {context:'Kissaten · On your iPhone',title:'Bring Kissaten home.',body:available?`<p class="intro">Open this page on your iPhone, then add Kissaten’s listing to AltStore. You only need to add our source once.</p>${transfer()}${picture('source','Kissaten in AltStore','Review our source before adding it. Future app releases appear here as updates.')}<div class="actions"><a class="brass hardware-control hardware-brass" href="${available.add}">Add Kissaten to AltStore ↗</a></div>${action('I can see Kissaten in AltStore',14)}`:`<p class="intro">Kissaten downloads open with the beta. You can keep going to see how to open the app, play your first recording and refresh the installation.</p>${action('Continue the guide',14)}`,help:'If the download is not live, you can leave the guide here and return later. Keep AltStore installed. This page never asks for Apple credentials.'},
    {context:'Keep listening · On your iPhone',title:'Refresh once a week.',body:`<p class="intro">Your iPhone’s permission to open these apps lasts seven days with a free Apple Account. Use AltStore’s Refresh button before it expires.</p>${picture('refresh','AltStore → My Apps → Kissaten','Keep AltServer running on your computer and your iPhone connected. Tap the days remaining beside Kissaten to refresh it. Refresh AltStore separately before its own expiry.')}<p class="confirmation">Refresh renews signing—the permission for the app to open. An update adds a new version. Automatic refresh is not guaranteed. If something fails, keep Kissaten and your recordings.</p>${action('Finish the walkthrough',9,'<button class="secondary" data-next="18">What if I miss a refresh?</button>')}`,help:'Remote refreshing currently requires its documented pairing and LocalDevVPN setup. Automatic refresh is not guaranteed. Keep your paired computer available if you need to retry a refresh.',link:'https://faq.altstore.io/altstore-classic/remote-altservers'},
    {context:'The end of the guide',title:'Setup guide complete',body:`<p class="intro">${available?'Find the refresh steps any time under Updates &amp; refresh.':'Kissaten downloads open with the beta. You can return to this guide any time.'}</p><div class="actions"><a class="brass" href="homepage.html#walkthrough">Back to the listening room <span aria-hidden="true">→</span></a></div>`,help:'If you get stuck, keep the installed app and your recordings. Tell the person who invited you which step you reached and the short error message.'}
    ,{
      context:`Prepare · On your ${computer==='Mac'?'Mac':'Windows PC'}`,
      title:computer==='Mac'?'Open AltServer on your Mac.':'Open AltServer on your PC.',
      body:`<p class="intro">${computer==='Mac'?'In Finder, open <strong>Downloads</strong>. Open <strong>altserver.zip</strong> if it hasn’t unpacked. Drag <strong>AltServer</strong> into <strong>Applications</strong>, then open it.':'Open AltServer from the Windows Start menu.'}</p>
        <p class="confirmation">Look for its icon near the clock.</p>
        ${action('I can see the AltServer icon',3)}
        ${computer==='Mac'?disclosure('Show me the Downloads folder',downloadVisual()):''}
        <button class="secondary" data-help="download">I can’t find the download</button>`,
      help:'On Mac, open Downloads in Finder or use your browser’s Downloads list. On Windows, check that you finished the steps in the official guide before opening AltServer.'
    }
    ,{
      context:`Prepare · On your ${computer==='Mac'?'Mac':'Windows PC'}`,
      title:'Keep your iPhone connected.',
      body:`<p class="intro">Leave the cable plugged in and keep your iPhone unlocked.</p>
        ${action('Keep using the cable for now',4)}
        ${disclosure('Set up Wi-Fi for later',`<p class="small">This is optional. Keep the cable connected for this setup.</p>
          ${computer==='Mac'?list(['Select your iPhone in Finder, then open <strong>General</strong>.','Under <strong>Options</strong>, select <strong>Show this iPhone when on Wi-Fi</strong>.','Click <strong>Apply</strong> if shown.']):external('https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows','Open the official Windows guide')}
          <button class="secondary" data-next="4">Wi-Fi connection is enabled</button>
          <button class="secondary" data-help="finder">I can’t see my iPhone</button>`)}`,
      help:'Modern Macs use Finder. Older versions use iTunes. Leave backup and music-sync choices as they are. Wi-Fi visibility does not set up refresh away from your computer.'
    }
    ,{
      context:`On your ${computer==='Windows'?'Windows PC':'Mac'}`,
      title:'Sign in to AltServer.',
      body:`<p class="intro">Use your Apple Account in AltServer to sign AltStore for your iPhone. Keep the cable connected and follow any verification prompt.</p>
        <p>Look for the <strong>AltStore icon</strong> on your iPhone’s Home Screen.</p>
        ${action('The AltStore icon has appeared',5,'<button class="secondary" data-next="17">AltStore hasn’t appeared</button>')}`,
      help:'Enter your password and verification codes only in AltServer. If the sign-in box won’t accept typing, quit and reopen AltServer, then choose Install AltStore again. If the icon is hard to find, swipe down on your iPhone’s Home Screen and search for AltStore.',
      link:'https://faq.altstore.io/altstore-classic/troubleshooting-guide'
    }
    ,{context:'AltStore · On your iPhone',title:'Open AltStore on your iPhone.',body:`<p class="intro">Tap AltStore on your iPhone. When it asks to find devices on your local network, choose Allow. This lets it reach AltServer on your computer.</p>${picture('phone','Local Network → Allow','Notifications are a separate choice. You can allow them if you want reminders.')}${action('AltStore’s home screen is open',7)}<p class="confirmation"><strong>What you should see:</strong> AltStore’s main screen on your iPhone. Already past these prompts? Continue without repeating them.</p>`,help:'Local Network permission helps AltStore discover your computer. It does not mean this website can see your phone or verify installation. If you denied permission, find AltStore in iPhone Settings and review its Local Network setting.'}
    ,{context:'Kissaten · On your iPhone',title:'Over to AltStore.',body:`<p class="intro">${available?'In AltStore, open Kissaten and tap its install button (it may say FREE). Keep AltServer reachable while it downloads and signs the app.':'When downloads open, this step will take you to Kissaten’s listing in AltStore.'}</p>${picture('source','Keep your existing collection.','Install updates over the existing app. Don’t delete Kissaten to update or retry.')}${available?`<div class="actions"><a class="brass hardware-control hardware-brass" href="${available.install}">Show Kissaten in AltStore ↗</a></div>`:`${transfer()}<p class="preview-note">Journey preview · No app or source has been installed.</p>`}${action(available?'Kissaten opens on my iPhone':'See how to open Kissaten',15)}`,help:'If an install or update fails, keep the installed app and your recordings. Check the exact AltStore error and ask the person who invited you. This website cannot verify an installation.'}
    ,{context:'Kissaten · On your iPhone',title:available?'Bring your first record home.':'Your first listen comes next.',body:`<p class="intro">${available?'A new library starts with your first recording. Add something you own or have permission to use, then settle in and press Play.':'After installation, open Kissaten from your iPhone’s Home Screen. You’ll be able to try this after the beta opens.'}</p><p><strong>Starting with an empty library?</strong> In Kissaten, open Records, then <strong>Record options → Add an audio file</strong>. Choose your recording in Files. When it appears in your records, open it and press Play.</p><p class="small">Already have a recording? Open it and press Play. No audio file ready? You can come back to this step later; the guide does not supply a sample recording.</p>${action(available?'I’ve heard my first recording':'Learn how to refresh',8)}<p class="small">Keep AltStore installed and refresh before the seven-day signing expiry with a free Apple Account. <strong>Updates &amp; refresh</strong> below brings you back to help.</p><button class="secondary" data-help="first-listen">I need a hand with my first recording</button>${available?'':'<p class="preview-note">Journey preview · No recording has been added or played by this guide.</p>'}`,help:'In Kissaten, open Records, then Record options → Add an audio file. Choose audio you own or have permission to use in Files. Wait for it to appear in your records, open it and press Play. This website does not select files or verify import/playback. If it fails, keep the app and recordings installed and note the exact message.'}

    ,{context:'Before setup',title:'A computer for the first visit.',body:`<p class="intro">This route needs a Mac or Windows PC and a cable for the initial setup.</p>${picture('computer','You can come back later.','Your place stays saved in this browser. Ask the person who invited you if you need help finding a computer.')}<p class="confirmation">Use your own Apple Account in AltServer and approve the phone prompts yourself. You don’t need to share passwords or verification codes with anyone.</p><div class="actions"><a class="brass" href="homepage.html#walkthrough">Explore the app <span aria-hidden="true">→</span></a><button class="secondary" data-next="1">Choose a computer</button></div>`,help:'A website cannot replace the first computer pairing. Enter your Apple Account details in AltServer on the computer you trust; do not send them through a support message.'}

    ,{context:`Troubleshooting · Your ${computer} and iPhone`,title:'AltStore hasn’t appeared?',body:`<p class="intro">Keep the cable connected. Check these before trying the installation again.</p>${list([`Unlock your iPhone. On your ${computer==='Windows'?'Windows PC':'Mac'}, check ${computer==='Mac'?'<strong>Finder → your iPhone</strong>':'the Apple device software'} can see it. Review any Trust prompt on both devices.`,`Look for a message from AltServer on your ${computer==='Windows'?'Windows PC':'Mac'}. Finish any verification there. If there is an error, keep its exact wording.`,`Swipe down on the iPhone Home Screen and search for <strong>AltStore</strong>. If AltServer reported success but the icon is missing, the official guide suggests restarting the iPhone, then searching again.`])}${action('I found AltStore',5,'<button class="secondary" data-help="missing">Still not there? Get help</button>')}<p class="confirmation">Don’t delete an existing AltStore or Kissaten installation while troubleshooting.</p>`,help:'Keep the iPhone connected and unlocked, check computer visibility and review the exact AltServer message. If the window is frozen, quitting and reopening AltServer helped in our earlier walkthrough. Avoid repeated installs until you understand the error.',link:'https://faq.altstore.io/altstore-classic/troubleshooting-guide'}
    ,{context:'Keep listening · Recovery',title:'Missed a refresh?',body:`<p class="intro">After the seven-day expiry, an app may stop opening. Expiry alone does not mean you should delete the app.</p>${picture('refresh','Keep Kissaten and AltStore installed.','Deleting an app can remove its local recordings. Renew the installation instead.')}${list(['If <strong>AltStore still opens</strong>: open AltServer on your computer, connect your iPhone, then open <strong>My Apps</strong> in AltStore and refresh <strong>Kissaten only</strong>, if it is listed. If Kissaten was installed through Xcode or is not listed, stop and ask the person who installed it for help.','If <strong>AltStore also won’t open</strong>: use AltServer’s <strong>Install AltStore → your iPhone</strong> with the same Apple Account, over the existing installation. Do not delete it first.','Once AltStore opens again, check My Apps for Kissaten before refreshing it. If it is missing or a renewal fails, keep both apps and ask for help with the exact error.'])}${external('https://faq.altstore.io/altstore-classic/altserver','Official expired-AltStore guidance')}${action('Back to weekly refresh',8)}`,help:'This is general recovery guidance, not a guarantee that a particular error or data problem is fixed. Keep the existing installation. Ask for help before deleting, changing accounts or reinstalling Kissaten.',link:'https://faq.altstore.io/altstore-classic/altserver'}

    ,{context:'Your saved setup',title:'Pick up where you left off?',body:`<p class="intro">This browser has an earlier setup in progress. Keep it, or begin a new walkthrough using ${pendingSetup?.requested==='Windows'?'Windows':'Mac'}.</p><div class="actions"><button class="brass hardware-control hardware-brass" id="resume-install">Continue my saved setup</button><button class="secondary" id="new-install">Start a new walkthrough</button></div><p class="confirmation">Starting a walkthrough only resets this guide. It does not remove any app, recording or account.</p>`,help:'A saved step is not proof that an app was installed. Continue if the step still matches your devices; otherwise start a new walkthrough.'}

  ];
  const route = [0,1,2,10,3,11,4,12,5,6,13,7,14,15,8,9];
  function persist(){if(step===19||(homepageWelcome&&step===0))return;try{scope.localStorage.setItem(storageKey,JSON.stringify({step,computer,experienced,history}));}catch{}}
  let helpOpener=null;
  function render(focus=false){
    const item=data()[step];
    const guide=doc.querySelector('#guide');
    guide.dataset.screen=step===0?'welcome':'setup';
    guide.dataset.step=String(step);
    guide.querySelector('.journey').hidden=step===0;
    doc.body.dataset.guideScreen=guide.dataset.screen;
    doc.querySelector('.guide-footer').hidden=step===0;
    doc.querySelector('#message').textContent='';
    if(content.contains(helpPanel)) content.after(helpPanel);
    doc.querySelector('#help-panel').hidden=true; doc.querySelector('#help').setAttribute('aria-expanded','false');
    content.innerHTML=`<p class="step-context">${item.context}</p><h1 tabindex="-1"><span class="impressed-ink">${item.title.replace('\n','<br>')}</span></h1>${item.body}`;
    content.querySelectorAll('[data-help]').forEach(button=>{button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','help-panel');});
    helpOpener=null;
    const stage=[0,1,2,10,3,11,16,19].includes(step)?0:[4,12,5,6,13,17].includes(step)?1:[7,14,15].includes(step)?2:3;
    doc.querySelector('#stages').innerHTML=['Prepare','AltStore','Kissaten','Keep listening'].map((label,i)=>`<li ${i===stage?'aria-current="step"':''} class="${i<stage?'done':''}"><span>${i<stage?'&#10003;':String(i+1)}</span>${label}</li>`).join('');
    doc.querySelector('#position').textContent=step===17||step===18?'Recovery guide':step===0||step===16||step===19?'Installation guide':step===completeStep?'':experienced?`${Math.max(1,[7,14,15,8].indexOf(step)+1)} of 4`:`${route.indexOf(step)} of ${route.length-2}`;
    doc.querySelector('#back').hidden=step===0;
    doc.querySelector('#explore-guide').hidden=step===16||step===completeStep;
    doc.querySelector('#help-title').textContent='A little help';
    doc.querySelector('#help-copy').textContent=item.help;
    doc.querySelector('#help-link').href=item.link||(computer==='Windows'?'https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows':official);
    doc.querySelector('#release-note').textContent=available?'Kissaten '+String(config.release||'')+(config.minimumOS?' · iOS '+String(config.minimumOS)+'+':''):step!==0&&step!==completeStep?'Setup preview · Beta downloads are closed.':'';
    persist();
    if(focus)content.querySelector('h1').focus?.({preventScroll:true});
  }
  function go(next,back=false){if(homepageWelcome){homepageWelcome=false;try{const u=new URL(scope.location.href);u.searchParams.delete('start');scope.history?.replaceState?.(null,'',u.href);}catch{}}if(!back&&next!==step)history.push(step);step=next;render(true);scope.scrollTo?.({top:0,behavior:'instant'});}
  doc.addEventListener('click',e=>{
    if(e.target.closest('#resume-homepage-setup')&&earlierSetup){step=earlierSetup.step;computer=earlierSetup.computer;experienced=earlierSetup.experienced;history=[...earlierSetup.history];go(step,true);return;}

    if(e.target.closest('[data-return-connection]')){const resume=step===3;closeHelp();if(!resume)go(3);else{content.querySelector('h1').focus({preventScroll:true});content.scrollIntoView({block:'start'});}return;}
    if(e.target.closest('#resume-install')){const saved=pendingSetup;pendingSetup=null;step=saved?.step||0;computer=saved?.computer||computer;render(true);return;}
    if(e.target.closest('#new-install')){computer=pendingSetup?.requested||computer;pendingSetup=null;history=[];experienced=false;go(2,true);return;}
    const help=e.target.closest('[data-help]');if(help){if(helpOpener===help&&!doc.querySelector('#help-panel').hidden){closeHelp();return;}openHelp(help);const messages={trust:'First try opening AltStore. If it opens, use AltStore already opens in this guide. If it does not, check Settings → General → VPN & Device Management after AltServer has finished installing. If your email is missing, return to the sign-in step and review AltServer’s exact result. Do not trust an unfamiliar profile or delete your existing apps.',developer:'Try opening AltStore first. If it opens, continue without repeating setup. If Developer Mode is missing under Settings → Privacy & Security, check that AltServer finished installing AltStore, then review the official troubleshooting guide for your iOS version. Keep this guide open; do not reset your phone or delete apps.','first-listen':'For an empty library, open Records → Record options → Add an audio file and choose permitted audio in Files. When the recording appears, open it and press Play. Open Kissaten from the iPhone Home Screen, not its row in AltStore. If it does not open, keep both apps installed and note the exact message. If it opens but audio does not play, check the volume, audio output and selected recording. Do not delete recordings or change accounts to retry. Use Updates & refresh for signing help.',finder:'Keep the cable connected and unlock your iPhone. Review any Trust prompt on the phone and computer. On Mac, open Finder and look under Locations; check Finder’s sidebar settings if connected iOS devices are hidden. If Finder stays on Loading or AltServer says the device is not connected, try a different USB port directly on the Mac while the iPhone is unlocked. Review Allow on the Mac and Trust on the phone if prompted. Wait for the full details to load before retrying once. If it still cannot connect, try a cable that supports data. Charging alone is not a data-connection check. On Windows, check the Apple device software using the official Windows guide. Leave backup and music-sync settings unchanged.',download:'On your Mac, open Finder and choose Downloads in the sidebar. Look for altserver.zip or an unpacked AltServer app. You can also check your browser’s Downloads list. Return to the download step if you need the official file again.',menu:'Open AltServer from Applications on Mac or the Start menu on Windows. It runs near the clock, with no normal app window. On Mac, move the pointer to the top edge to reveal a hidden menu bar.',missing:data()[17].help};doc.querySelector('#help-copy').textContent=messages[help.dataset.help]||data()[step].help;if(help.dataset.help==='finder'){renderConnectionHelp();}if(['missing','trust','developer','finder','first-listen'].includes(help.dataset.help))doc.querySelector('#help-link').href=help.dataset.help==='finder'&&computer==='Windows'?'https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows':'https://faq.altstore.io/altstore-classic/troubleshooting-guide';focusHelp();return;}
    if(e.target.closest('#copy-phone-link')){const url=phoneURL(scope.location?.href,computer);if(url){Promise.resolve().then(()=>scope.navigator.clipboard.writeText(url)).then(()=>{doc.querySelector('#phone-link-message').textContent='Copied. Send this link to your iPhone.';}).catch(()=>{doc.querySelector('#phone-link-message').textContent='Copy this link: '+url;});}return;}
    const next=e.target.closest('[data-next]');if(next){if(step===0)experienced=false;go(Number(next.dataset.next));return;}
    const choice=e.target.closest('[data-os]');if(choice){computer=choice.dataset.os;go(2);return;}
    if(e.target.closest('#already')){experienced=true;go(7);}
    if(e.target.closest('#no-computer'))go(16);
  });
  function renderConnectionHelp(){
    const branches=computer==='Mac'?[
      ['My iPhone isn’t listed in Finder.','Keep the iPhone unlocked. Connect directly to the Mac, try another USB port, then a cable that supports data. Review Allow on the Mac and Trust on the phone if prompted.'],
      ['It’s listed, but says Loading.','Keep the iPhone unlocked and reconnect using a different USB port directly on the Mac. Review Allow and Trust if prompted. Continue only when the full iPhone details load.'],
      ['Finder works, but AltServer can’t find it.','Keep the cable connected and the iPhone unlocked. Quit AltServer from its menu, reopen it from Applications, then check whether its Install AltStore submenu lists your iPhone. Don’t select it to reinstall. Once listed, retry only the failed install once.']
    ]:[['My PC cannot find my iPhone.','Keep the iPhone unlocked and connected. Check the Apple device software using the official Windows guide below. Review any Trust prompt and try a cable that supports data.']];
    doc.querySelector('#help-title').textContent='Let’s find your iPhone';
    doc.querySelector('#help-copy').innerHTML='<p>Choose what matches your screen.</p>'+branches.map(([title,text])=>'<details class="connection-check"><summary>'+title+'</summary><p>'+text+'</p><button class="secondary" data-return-connection>Back to connecting my iPhone</button></details>').join('')+'<p class="small">Charging alone does not confirm a data connection. Keep existing apps and recordings; leave backup and music-sync settings unchanged.</p>';
    doc.querySelectorAll('.connection-check').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)doc.querySelectorAll('.connection-check').forEach(other=>{if(other!==details)other.open=false;});}));
  }
  function openHelp(opener=doc.querySelector('#help')){
    if(opener.classList.contains('connection-help')) opener.after(helpPanel);
    else if(content.contains(helpPanel)) content.after(helpPanel);
    const item=data()[step];
    doc.querySelector('#help-title').textContent='A little help';
    doc.querySelector('#help-copy').textContent=item.help;
    doc.querySelector('#help-link').href=item.link||(computer==='Windows'?'https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows':official);
    if(helpOpener) helpOpener.setAttribute('aria-expanded','false');
    helpOpener=opener;
    helpPanel.hidden=false;
    doc.querySelector('#help').setAttribute('aria-expanded','true');
    opener.setAttribute('aria-expanded','true');
  }
  function focusHelp(){
    doc.querySelector('#help-title').focus({preventScroll:true});
    helpPanel.scrollIntoView({block:'start'});
  }
  doc.querySelector('#help').onclick=()=>{
    if (!helpPanel.hidden) return closeHelp();
    openHelp();
    focusHelp();
  };
  function closeHelp(){doc.querySelector('#help-panel').hidden=true;doc.querySelector('#help').setAttribute('aria-expanded','false');if(helpOpener)helpOpener.setAttribute('aria-expanded','false');const target=helpOpener?.isConnected?helpOpener:doc.querySelector('#help');helpOpener=null;target.focus({preventScroll:true});}
  doc.querySelector('#close-help').onclick=closeHelp;
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!doc.querySelector('#help-panel').hidden)closeHelp();});
  doc.querySelector('#refresh-guide').onclick=()=>go(8);
  doc.querySelector('#copy-help').onclick=async()=>{const text='I need help at: '+data()[step].title.replace('\n',' ')+'. Computer: '+computer+'. '+(available?'Release: '+String(config.release||'unspecified')+'.':'The app download is not live yet.')+' Please help me keep the existing app and recordings.';try{await scope.navigator.clipboard.writeText(text);doc.querySelector('#message').textContent='Copied. Share this with the person who invited you.';}catch{doc.querySelector('#message').textContent=text;}};
  function restart(){history=[];experienced=false;go(0,true);}
  doc.querySelector('#back').onclick=()=>{const previous=history.pop() ?? route[Math.max(0,route.indexOf(step)-1)];if(previous===0)experienced=false;go(previous,true);};
  doc.querySelector('#restart').onclick=restart;
  render();
  return {read:()=>({step,computer,experienced}),go};
}
const api={mount,links,safeHTTPS,phoneURL,readProgress,bindSetupEntries};
if(typeof module==='object'&&module.exports) module.exports=api;
else {
  scope.KissatenInstaller=api;
  if(scope.document.querySelector('#guide')) mount(scope.document,scope.KissatenInstallConfig||{});
  else bindSetupEntries(scope.document);
}
})(typeof window==='object'?window:globalThis);
