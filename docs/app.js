"use strict";

// Website behaviour. Edit site-data.js for day-to-day content changes.
(() => {
  const root = document.getElementById("researcher-page");
  const config = window.SITE || {};
  const profile = config.profile || {};
  const waveOptions = config.wave || {};
  if (!root) return;

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = String(value);
    return element;
  }

  function icon(name) {
    const element = node("span", `icon icon-${name}`);
    element.setAttribute("aria-hidden", "true");
    return element;
  }

  function link(label, url, className, arrow = false) {
    const element = node("a", className, label);
    element.href = url;
    if (/^https?:\/\//i.test(url)) {
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
    if (arrow) element.append(icon("arrow-up-right"));
    return element;
  }

  function dottedLabel(element, label, dotClass) {
    element.replaceChildren(document.createTextNode(label), node("span", dotClass, "."));
  }

  // Profile, affiliations, contact links and CV.
  const name = profile.name || "Ugo Nzongani";
  dottedLabel(document.getElementById("profile-name"), name);
  dottedLabel(root.querySelector(".op-brand"), profile.brand || "un");
  dottedLabel(document.getElementById("profile-footer"), name, "op-footer-dot");
  root.querySelector(".op-brand").setAttribute("aria-label", `${name}, home`);
  root.querySelector(".op-hero").setAttribute("aria-label", `${name}’s profile`);
  document.getElementById("profile-title").textContent = profile.title || "";
  document.title = `${name} — ${profile.title || "Research"}`;
  document.querySelector('meta[name="author"]').content = name;

  const affiliations = document.getElementById("profile-affiliations");
  affiliations.replaceChildren();
  (profile.affiliations || []).forEach((affiliation, index) => {
    if (index) affiliations.append(node("span", "", "/"));
    affiliations.append(document.createTextNode(affiliation));
  });

  const socialContainer = document.getElementById("profile-socials");
  const socialLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
  socialContainer.replaceChildren();
  socialLinks.forEach(item => {
    if (!item.url) return;
    const anchor = link("", item.url, "op-social");
    anchor.title = item.label;
    anchor.setAttribute("aria-label", `${item.label} — ${name}`);
    const mark = node("span", `op-mark op-${item.icon}`);
    mark.setAttribute("aria-hidden", "true");
    anchor.append(mark, node("span", "op-sr", item.label));
    socialContainer.append(anchor);
  });
  const scholar = socialLinks.find(item => item.icon === "scholar");
  root.querySelectorAll("[data-scholar-link]").forEach(anchor => {
    anchor.hidden = !scholar?.url;
    if (scholar?.url) anchor.href = scholar.url;
  });

  const photo = document.getElementById("profile-photo");
  photo.alt = `Profile photo of ${name}`;
  photo.addEventListener("error", () => {
    if (!photo.dataset.fallback) {
      photo.dataset.fallback = "true";
      photo.src = "assets/profile.svg";
    } else {
      photo.hidden = true;
      const initials = name.split(/\s+/).map(word => word[0]).slice(0, 2).join("");
      photo.parentElement.append(node("span", "op-portrait-initials", initials));
    }
  });
  photo.src = profile.photo || "assets/profile.svg";
  const cv = document.getElementById("profile-cv");
  cv.hidden = !profile.cv;
  if (profile.cv) cv.href = profile.cv;

  // Research interests.
  const paragraphs = Array.isArray(config.researchInterests) ? config.researchInterests : [];
  document.getElementById("research-paragraphs").replaceChildren(...paragraphs.map(value => node("p", "", value)));
  if (paragraphs[0]) document.querySelector('meta[name="description"]').content = `${name}. ${paragraphs[0]}`;

  // Education.
  const educationContainer = document.getElementById("education-list");
  educationContainer.replaceChildren();
  (config.education || []).forEach(item => {
    const entry = node("li", "op-degree");
    const body = node("div", "op-degree-content");
    body.append(node("h3", "", item.degree || ""), node("p", "op-degree-school", item.institution || ""));
    const details = Array.isArray(item.details) ? item.details : item.details ? [item.details] : [];
    if (details.length) {
      const paragraph = node("p", "op-degree-detail");
      details.forEach((value, index) => {
        if (index) paragraph.append(document.createElement("br"));
        paragraph.append(document.createTextNode(value));
      });
      body.append(paragraph);
    }
    entry.append(node("div", "op-degree-period", item.period || ""), body);
    educationContainer.append(entry);
  });

  // Publications and preprints use the same editable entry structure.
  function reference(item, prefix) {
    const article = node("article", "op-reference");
    if (item.id) article.id = `${prefix}-${item.id}`;
    const body = node("div", "op-reference-body");
    const heading = node("h3");
    const url = item.url || item.links?.[0]?.url;
    heading.append(url ? link(item.title || "", url) : document.createTextNode(item.title || ""));
    body.append(heading);

    const authors = Array.isArray(item.authors) ? item.authors : item.authors ? [item.authors] : [];
    if (authors.length) {
      const paragraph = node("p", "op-reference-authors");
      authors.forEach((author, index) => {
        if (index) paragraph.append(document.createTextNode(", "));
        paragraph.append(author === name ? node("strong", "", author) : document.createTextNode(author));
      });
      body.append(paragraph);
    }
    if (item.venue || item.details) {
      const venue = node("p", "op-reference-venue", item.venue || "");
      if (item.details) venue.append(node("span", "", item.details));
      body.append(venue);
    }
    if (item.links?.length) {
      const links = node("div", "op-reference-links");
      item.links.forEach((itemLink, index) => {
        if (itemLink.url) links.append(link(itemLink.label, itemLink.url, "", index === 0));
      });
      body.append(links);
    }
    article.append(node("span", "op-reference-year", item.year || ""), body);
    return article;
  }

  document.getElementById("publication-list").replaceChildren(...(config.publications || []).map(item => reference(item, "publication")));
  const preprints = document.getElementById("preprint-list");
  preprints.replaceChildren();
  if (config.preprints?.length) {
    preprints.className = "op-references";
    preprints.append(...config.preprints.map(item => reference(item, "preprint")));
  } else {
    preprints.className = "op-preprints-empty";
    const arrow = node("span", "op-empty-mark", "↗");
    arrow.setAttribute("aria-hidden", "true");
    preprints.append(arrow, node("p", "", "New preprints will appear here."));
  }

  // Remember each visitor's chosen light/dark appearance.
  let theme = config.appearance?.defaultTheme === "light" ? "light" : "dark";
  try {
    const remembered = localStorage.getItem("researcher-site-theme");
    if (remembered === "light" || remembered === "dark") theme = remembered;
  } catch (error) {}
  root.dataset.mode = theme;
  document.body.dataset.theme = theme;
  root.querySelectorAll("[data-theme]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.theme === theme)));

  // Decorative wave. Tuning controls live in site-data.js.
  function setting(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
  }
  const flowSpeed = setting(waveOptions.flowSpeed, 0.16, 0, 1);
  const oscillationPeriod = setting(waveOptions.oscillationPeriod, 12, 4, 120);
  const oscillationHeight = setting(waveOptions.oscillationHeight, 0.055, 0, 0.12);
  const breathingPeriod = setting(waveOptions.breathingPeriod, 10, 4, 120);
  const breathingStrength = setting(waveOptions.breathingStrength, 0.03, 0, 0.08);

  const canvas=root.querySelector('#op-wave');
  const ctx=canvas.getContext('2d');
  const motionButton=root.querySelector('#op-motion');
  const motionLabel=root.querySelector('#op-motion-label');
  const pauseIcon=root.querySelector('#op-motion-pause');
  const playIcon=root.querySelector('#op-motion-play');
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing=waveOptions.animate!==false&&!motionPreference.matches;
  let userChoice=null;
  let inView=true;
  let elapsed=0;
  let frameId=0;
  let lastTime=null;
  let W=0,H=0,resolution=0,segments=0;
  let positions,centers,widths,folds;
  let gradients=[];
  const palettes=[['#1740c0','#13c2ff','#5760ef','#c348e7','#a22ac8'],['#5b2fd9','#bc36db','#ec55ad','#fa976b','#e933a6'],['#153e9a','#3699eb','#7368ed','#d77bea','#bd61d1']];

  function resizeWave() {
    if(!ctx)return;
    const rect=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,2);
    if(rect.width<2||rect.height<2)return;
    if(W!==rect.width||H!==rect.height||resolution!==ratio){
      W=rect.width;H=rect.height;resolution=ratio;
      canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      segments=Math.max(96,Math.ceil(W/5));
      positions=new Float64Array(segments+1);centers=new Float64Array(segments+1);widths=new Float64Array(segments+1);folds=new Float64Array(segments+1);
      for(let j=0;j<=segments;j++)positions[j]=-10+(W+20)*j/segments;
      gradients=palettes.map(colors=>{const gradient=ctx.createLinearGradient(0,H*.2,W,H*.7);colors.forEach((color,i)=>gradient.addColorStop(i/4,color));return gradient;});
    }
    drawWave();
    syncAnimation();
  }
  function drawWave() {
    if(!ctx||!W||!H)return;
    ctx.clearRect(0,0,W,H);
    const dark=root.dataset.mode==='dark';
    const opacity=dark?1:.74;
    const strands=W<600?56:72;
    const oscillation=oscillationHeight*Math.sin(elapsed*2*Math.PI/oscillationPeriod);
    const breathing=breathingStrength*Math.sin(elapsed*2*Math.PI/breathingPeriod);
    const envelope=Math.min(.78,(.47-oscillationHeight)/(.20+breathingStrength+.012+.075+.21));
    function path(t) {
      const edge=t-.5,bend=Math.sin(Math.PI*t);
      ctx.beginPath();
      for(let j=0;j<=segments;j++){
        const y=centers[j]+edge*widths[j]+bend*folds[j];
        if(j===0)ctx.moveTo(positions[j],y);else ctx.lineTo(positions[j],y);
      }
    }
    for(let layer=2;layer>=0;layer--){
      const phase=layer*.66+.15+elapsed*flowSpeed*(1+layer*.035);
      const amplitude=.20+breathing+.012*Math.sin(elapsed*.20+layer*.7);
      for(let j=0;j<=segments;j++){
        const u=positions[j]/W;
        centers[j]=H*(.50+oscillation+envelope*(amplitude*Math.sin(u*6.1+phase)+(layer-1)*.075));
        widths[j]=H*.42*envelope*(.50+.5*Math.sin(u*3.2+layer+.25+elapsed*flowSpeed*.5)**2);
        folds[j]=H*.10*envelope*Math.sin(u*6.3+phase+1.1+.18*Math.sin(elapsed*.14));
      }
      ctx.fillStyle=gradients[layer];ctx.globalAlpha=opacity*(dark?.08:.045);
      path(0);
      for(let j=segments;j>=0;j--)ctx.lineTo(positions[j],centers[j]+widths[j]*.5);
      ctx.closePath();ctx.fill();ctx.strokeStyle=gradients[layer];
      for(let s=0;s<strands;s++){const t=s/(strands-1),edge=Math.pow(Math.abs(t-.5)*2,4);ctx.lineWidth=edge>.8?1.35:.72;ctx.globalAlpha=opacity*(.065+edge*.51);path(t);ctx.stroke();}
      if(dark){ctx.save();ctx.shadowColor=layer===0?'#35b8ff':'#de64ee';ctx.shadowBlur=19;ctx.globalAlpha=.65;ctx.lineWidth=1.2;path(layer===0?1:0);ctx.stroke();ctx.restore();}
    }
    ctx.globalAlpha=1;
  }

  function shouldAnimate(){return playing&&inView&&!document.hidden&&root.isConnected&&ctx&&W>0&&H>0;}
  function animate(now){
    frameId=0;
    if(!shouldAnimate()){lastTime=null;return;}
    if(lastTime!==null)elapsed+=Math.min(Math.max(now-lastTime,0),64)/1000;
    lastTime=now;
    drawWave();
    frameId=requestAnimationFrame(animate);
  }
  function syncAnimation(){
    motionLabel.textContent=playing?'Pause wave':'Play wave';
    motionButton.setAttribute('aria-label',playing?'Pause wave animation':'Play wave animation');
    pauseIcon.hidden=!playing;playIcon.hidden=playing;
    if(shouldAnimate()){
      if(!frameId)frameId=requestAnimationFrame(animate);
    }else{
      if(frameId)cancelAnimationFrame(frameId);
      frameId=0;lastTime=null;
    }
  }
  motionButton.addEventListener('click',()=>{playing=!playing;userChoice=playing;syncAnimation();});
  const onMotionPreference=()=>{playing=!motionPreference.matches&&(userChoice===true||(userChoice!==false&&waveOptions.animate!==false));syncAnimation();};
  if(motionPreference.addEventListener)motionPreference.addEventListener('change',onMotionPreference);
  else motionPreference.addListener(onMotionPreference);
  document.addEventListener('visibilitychange',syncAnimation);
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncAnimation();},{rootMargin:'80px'}).observe(canvas);}
  root.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{
    root.dataset.mode=button.dataset.theme;
    document.body.dataset.theme=button.dataset.theme;
    try{localStorage.setItem('researcher-site-theme',button.dataset.theme);}catch(error){}
    root.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    drawWave();
  }));
  new ResizeObserver(resizeWave).observe(canvas);
  window.addEventListener('resize',resizeWave);
  resizeWave();
  syncAnimation();
})();
