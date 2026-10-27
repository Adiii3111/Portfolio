"use client";

import { useEffect } from "react";

export function finishIntro() {
  document.documentElement.dataset.intro = "done";
  try { sessionStorage.setItem("aks-intro", "1"); } catch {}
}

// Timeline (ms from the moment the page arrives). Keep in step with the .intro.is-live rules in globals.css.
const GROW = [0, 350];        // the helix pops up and grows out from the middle
const UNZIP = [650, 1300];    // it unzips and the two strands sweep off to the edges
const END = 1800;

/*
 * The DNA is drawn by a small inline script rather than from React, so it starts the moment
 * the HTML arrives instead of waiting for the page's JavaScript to load. It also adds
 * .is-live to the intro, which starts the CSS for the name and the fade on the same clock.
 */
const DNA_SCRIPT = `(function(){
var cv=document.currentScript&&document.currentScript.previousElementSibling,root=document.documentElement;
if(!cv||root.dataset.intro==="done")return;var ctx=cv.getContext("2d");if(!ctx)return;
var W=cv.width=innerWidth,H=cv.height=innerHeight,R=Math.min(W,H)*.11,RUNG=22,TW=Math.PI*2/(RUNG*10),GR=2.35,t0=0;
function sm(t,a,b){var x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x)}
cv.parentElement.classList.add("is-live");
function frame(now){if(root.dataset.intro==="done")return;if(!t0)t0=now;var t=now-t0;ctx.clearRect(0,0,W,H);
var reach=(.18+.82*sm(t,${GROW[0]},${GROW[1]}))*(H/2+60),u=sm(t,${UNZIP[0]},${UNZIP[1]}),spin=t*.0026,y0=H/2-reach,y1=H/2+reach;
function st(sy,ph,side){var th=sy*TW+spin+ph,r=R*(1-.55*u);return{x:W/2+Math.cos(th)*r+side*u*(W/2-30),y:sy-side*u*H*.3,z:Math.sin(th)}}
ctx.lineCap="round";
for(var sy=Math.ceil(y0/RUNG)*RUNG;sy<y1;sy+=RUNG){var pop=Math.min(1,(reach-Math.abs(sy-H/2))/50);if(pop<=0)continue;
var a=st(sy,0,1),b=st(sy,GR,-1),near=(a.z+b.z)/2>=0,k=Math.round(sy/RUNG),gc=(k*7919)%5<2,h=.5*pop*(1-u);
ctx.lineWidth=near?2:1.2;ctx.strokeStyle="rgba("+(gc?"232,97,91":"226,205,164")+","+((near?.7:.3)*(1-u)).toFixed(3)+")";
ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+(b.x-a.x)*h,a.y+(b.y-a.y)*h);ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+(a.x-b.x)*h,b.y+(a.y-b.y)*h);ctx.stroke()}
var S=[[0,1,"226,205,164"],[GR,-1,"158,222,255"]];
for(var i=0;i<2;i++){var p=st(y0,S[i][0],S[i][1]);for(var y=y0+5;y<=y1;y+=5){var q=st(y,S[i][0],S[i][1]),n=(q.z+p.z)/2;
ctx.lineWidth=1.4+(n+1)*1.4;ctx.strokeStyle="rgba("+S[i][2]+","+(.35+(n+1)*.3).toFixed(3)+")";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();p=q}}
if(t<${END})requestAnimationFrame(frame);else{root.dataset.intro="done";try{sessionStorage.setItem("aks-intro","1")}catch(e){}}}
requestAnimationFrame(frame)})();`;

/**
 * A ~1.7s opening sequence: a DNA double helix pops up in the middle of a dark screen, base
 * pairs popping in as it turns. Then it unzips, and as it splits Aditya's name pops up in
 * the gap; the name holds for a moment while one strand sweeps off to the top-right edge
 * and the other to the bottom-left, where the page's two DNA spines live, and then the
 * screen opens onto the page.
 *
 * It never blocks the page: it fades out on its own (via CSS even without JavaScript), and
 * any click, key, scroll, or the Skip button dismisses it immediately. Returning visitors
 * and reduced-motion users never see it (see the inline script in layout.tsx).
 */
export default function Intro() {
  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") return;
    const t = setTimeout(finishIntro, END + 200);   // in case the inline script never ran
    const skip = () => finishIntro();
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchmove", skip, { passive: true, once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <div className="intro" onClick={finishIntro} aria-label="Opening sequence: Aditya Kadlabal Sripad" suppressHydrationWarning>
      <canvas className="intro-dna" aria-hidden="true" suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: DNA_SCRIPT }} />
      <div className="intro-id">
        <h2>Aditya Kadlabal Sripad</h2>
      </div>
      {/* The name waits for the split (see .intro.is-live); without JavaScript there's no split, so just show it. */}
      <noscript><style>{".intro-id{opacity:1}"}</style></noscript>
      <button className="intro-skip" onClick={(e) => { e.stopPropagation(); finishIntro(); }}>Skip intro →</button>
    </div>
  );
}
