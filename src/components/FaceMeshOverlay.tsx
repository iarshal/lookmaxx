"use client";

import { useEffect, useRef, useCallback } from "react";

interface P {
  x: number; y: number;
  tx: number; ty: number;
  angle: number; speed: number; // orbital drift
  sz: number; po: number;
  type: number; // 0=landmark 1=fill 2=ambient
}

interface Props {
  progress: number;
  landmarks?: { x: number; y: number }[] | null;
  imageWidth?: number;
  imageHeight?: number;
  showScanLine?: boolean;
}

const LM68:{x:number;y:number}[]=[
  {x:.18,y:.52},{x:.19,y:.58},{x:.21,y:.64},{x:.24,y:.70},{x:.28,y:.76},
  {x:.33,y:.81},{x:.39,y:.85},{x:.44,y:.87},{x:.50,y:.88},{x:.56,y:.87},
  {x:.61,y:.85},{x:.67,y:.81},{x:.72,y:.76},{x:.76,y:.70},{x:.79,y:.64},
  {x:.81,y:.58},{x:.82,y:.52},
  {x:.27,y:.36},{x:.31,y:.33},{x:.36,y:.32},{x:.41,y:.33},{x:.45,y:.36},
  {x:.55,y:.36},{x:.59,y:.33},{x:.64,y:.32},{x:.69,y:.33},{x:.73,y:.36},
  {x:.50,y:.40},{x:.50,y:.45},{x:.50,y:.50},{x:.50,y:.55},
  {x:.43,y:.57},{x:.46,y:.58},{x:.50,y:.59},{x:.54,y:.58},{x:.57,y:.57},
  {x:.30,y:.42},{x:.34,y:.40},{x:.38,y:.40},{x:.41,y:.42},{x:.38,y:.44},{x:.34,y:.44},
  {x:.59,y:.42},{x:.62,y:.40},{x:.66,y:.40},{x:.70,y:.42},{x:.66,y:.44},{x:.62,y:.44},
  {x:.38,y:.68},{x:.42,y:.65},{x:.46,y:.64},{x:.50,y:.65},{x:.54,y:.64},
  {x:.58,y:.65},{x:.62,y:.68},{x:.58,y:.72},{x:.54,y:.74},{x:.50,y:.75},
  {x:.46,y:.74},{x:.42,y:.72},
  {x:.41,y:.68},{x:.46,y:.66},{x:.50,y:.66},{x:.54,y:.66},{x:.59,y:.68},
  {x:.54,y:.71},{x:.50,y:.72},{x:.46,y:.71},
];

const CT={
  jaw:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
  lb:[17,18,19,20,21],rb:[22,23,24,25,26],
  nb:[27,28,29,30],nn:[31,32,33,34,35],
  le:[36,37,38,39,40,41],re:[42,43,44,45,46,47],
  om:[48,49,50,51,52,53,54,55,56,57,58,59],
  im:[60,61,62,63,64,65,66,67],
};

function ocMap(iW:number,iH:number,cW:number,cH:number){
  const ia=iW/iH,ca=cW/cH;
  let s:number,ox:number,oy:number;
  if(ia>ca){s=cH/iH;ox=(iW*s-cW)/2;oy=0;}else{s=cW/iW;ox=0;oy=(iH*s-cH)/2;}
  return(nx:number,ny:number)=>({x:(nx*iW*s-ox)/cW,y:(ny*iH*s-oy)/cH});
}

// Build face fill targets — tight within face boundary, no overflow
function buildFill(lm:{x:number;y:number}[]):{x:number;y:number}[]{
  if(lm.length<68)return[];
  const pts:{x:number;y:number}[]=[];
  const cx=lm[30].x;
  const browY = Math.min(lm[19].y, lm[24].y);
  const chinY = lm[8].y;
  const cy = (browY + chinY) / 2;
  const fW = lm[16].x - lm[0].x;
  const fH = chinY - browY;

  // Contour edge interpolation
  const chain=(a:number[])=>{for(let i=0;i<a.length-1;i++){const p0=lm[a[i]],p1=lm[a[i+1]];for(let s=1;s<=6;s++){const t=s/7;pts.push({x:p0.x+t*(p1.x-p0.x),y:p0.y+t*(p1.y-p0.y)});}}};
  const loop=(a:number[])=>{a.forEach((v,i)=>{const p0=lm[v],p1=lm[a[(i+1)%a.length]];for(let s=1;s<=6;s++){const t=s/7;pts.push({x:p0.x+t*(p1.x-p0.x),y:p0.y+t*(p1.y-p0.y)});}});};
  chain(CT.jaw);chain(CT.lb);chain(CT.rb);chain(CT.nb);chain(CT.nn);
  loop(CT.le);loop(CT.re);loop(CT.om);loop(CT.im);

  // Dense fill using ellipse within face bounds — keeps within jawline
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 800 : 2500;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;
    const r=Math.sqrt(Math.random()); // uniform disk
    const px=cx+Math.cos(a)*r*fW*.46;
    const py=cy+Math.sin(a)*r*fH*.46;
    // Tighter clipping: must be within jaw width at that y level
    const yRatio=(py-browY)/(chinY-browY);
    const jawWidthAtY=fW*(.3+.2*Math.sin(yRatio*Math.PI)); // elliptical estimate
    if(Math.abs(px-cx)<jawWidthAtY*.55 && py>browY-fH*.1 && py<chinY-.01){
      pts.push({x:px,y:py});
    }
  }
  return pts;
}

export default function FaceMeshOverlay({progress,landmarks,imageWidth,imageHeight,showScanLine=true}:Props){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const psRef=useRef<P[]>([]);
  const rafRef=useRef(0);
  const initRef=useRef(false);
  const tRef=useRef(0);

  const mapLm=useCallback((raw:{x:number;y:number}[],iW:number,iH:number,cW:number,cH:number)=>{
    const tr=ocMap(iW,iH,cW/2,cH/2);
    return raw.map(p=>tr(p.x/iW,p.y/iH));
  },[]);

  useEffect(()=>{
    if(!landmarks||!imageWidth||!imageHeight||landmarks.length<68)return;
    const c=canvasRef.current;if(!c)return;
    const W=c.width,H=c.height;
    const norm=mapLm(landmarks,imageWidth,imageHeight,W,H);
    const ps=psRef.current;
    for(let i=0;i<Math.min(68,ps.length);i++){ps[i].tx=norm[i].x*W;ps[i].ty=norm[i].y*H;}
    const fill=buildFill(norm); let fi=0;
    for(let i=68;i<ps.length;i++){
      if(ps[i].type===1&&fi<fill.length){ps[i].tx=fill[fi].x*W;ps[i].ty=fill[fi].y*H;fi++;}
      else if(ps[i].type===2){const a=Math.random()*Math.PI*2;ps[i].tx=(.5+Math.cos(a)*(.08+Math.random()*.3))*W;ps[i].ty=(.45+Math.sin(a)*(.08+Math.random()*.3))*H;}
    }
  },[landmarks,imageWidth,imageHeight,mapLm]);

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const resize=()=>{const p=c.parentElement;if(!p)return;c.width=p.clientWidth*2;c.height=p.clientHeight*2;c.style.width=p.clientWidth+"px";c.style.height=p.clientHeight+"px";};
    resize();window.addEventListener("resize",resize);
    if(!initRef.current){
      initRef.current=true;
      const W=c.width,H=c.height;
      const ps:P[]=[];
      // ALL particles start distributed across canvas with smooth orbital drift
      for(let i=0;i<68;i++){
        ps.push({x:Math.random()*W,y:Math.random()*H,tx:LM68[i].x*W,ty:LM68[i].y*H,
          angle:Math.random()*Math.PI*2,speed:.3+Math.random()*.5,sz:2.5+Math.random()*1.5,po:Math.random()*Math.PI*2,type:0});
      }
      const fill=buildFill(LM68);
      for(const fp of fill){
        ps.push({x:Math.random()*W,y:Math.random()*H,tx:fp.x*W,ty:fp.y*H,
          angle:Math.random()*Math.PI*2,speed:.15+Math.random()*.4,sz:.7+Math.random()*.9,po:Math.random()*Math.PI*2,type:1});
      }
      const isMobile = window.innerWidth < 768;
      const ambientCount = isMobile ? 200 : 500;
      for(let i=0;i<ambientCount;i++){
        const a=Math.random()*Math.PI*2;
        ps.push({x:Math.random()*W,y:Math.random()*H,tx:(.5+Math.cos(a)*(.08+Math.random()*.32))*W,ty:(.45+Math.sin(a)*(.08+Math.random()*.32))*H,
          angle:Math.random()*Math.PI*2,speed:.1+Math.random()*.25,sz:.4+Math.random()*.6,po:Math.random()*Math.PI*2,type:2});
      }
      psRef.current=ps;
    }
    return()=>window.removeEventListener("resize",resize);
  },[]);

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");if(!ctx)return;

    const draw=()=>{
      const W=c.width,H=c.height;
      ctx.clearRect(0,0,W,H);
      tRef.current+=.016;
      const t=tRef.current;
      const np=Math.min(1,progress/100);
      const ps=psRef.current;

      // np is 0 to 1
      const CHAOS = 0.15;
      const progressFactor = np < CHAOS ? 0 : (np - CHAOS) / (1 - CHAOS);

      for(let i=0;i<ps.length;i++){
        const p=ps[i];

        // MAGIC: Staggered Convergence
        // Each particle has a "threshold" based on its relative index.
        const particleThreshold = i / ps.length; 
        // Only start converging if progressFactor exceeds the particle's threshold
        // We use a smooth transition (lerp) for the convergence state of EACH particle
        const pConvergeRaw = (progressFactor - particleThreshold * 0.8) * 5;
        const pConverge = Math.max(0, Math.min(1, pConvergeRaw));
        const pEase = Math.pow(pConverge, 1.5);

        // Gentle orbital drift (always active, but fades as particle settles)
        p.angle += (.005 + p.speed*.008) * (1 - pEase*.9);
        const driftR = (1 - pEase) * (W*.12 + Math.sin(t*.3+p.po)*W*.04);
        const driftX = Math.cos(p.angle + t*.2 + p.po) * driftR * .015;
        const driftY = Math.sin(p.angle + t*.15 + p.po*.7) * driftR * .012;

        if(pEase < 0.001){
          // Free drift phase
          p.x += driftX + Math.sin(t*.5+p.po*2)*.8;
          p.y += driftY + Math.cos(t*.4+p.po*3)*.6;
          if(p.x<-20)p.x=W+20; if(p.x>W+20)p.x=-20;
          if(p.y<-20)p.y=H+20; if(p.y>H+20)p.y=-20;
        } else {
          // Individual convergence for this specific particle
          const dx=p.tx-p.x, dy=p.ty-p.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          const activeEase = pEase * (p.type===0?.07:.04);

          if(dist > 1.5){
            p.x += dx*activeEase + driftX*(1-pEase);
            p.y += dy*activeEase + driftY*(1-pEase);
          } else {
            // Settled core breathing
            p.x = p.tx + Math.sin(t*1.5+p.po)*(1-pEase*.6);
            p.y = p.ty + Math.cos(t*1.2+p.po)*.7*(1-pEase*.6);
          }
        }

        // Alpha scaling
        const fadeIn = Math.min(1, t*.5);
        const pulse = .87 + .13*Math.sin(t*2+p.po);
        let alpha = fadeIn * pulse;

        // Visual "Landing" Glow: Brighten up as it converges
        if(pEase > 0.1){
          alpha *= (0.4 + pEase * 0.6);
        }

        // Draw glow
        const gR=p.sz*(p.type===0?5:p.type===1?2.8:1.6);
        const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,gR);
        if(p.type===0){
          glow.addColorStop(0,`rgba(140,228,255,${alpha})`);
          glow.addColorStop(.3,`rgba(0,180,255,${alpha*.4})`);
          glow.addColorStop(1,"rgba(0,80,255,0)");
        } else if(p.type===1){
          glow.addColorStop(0,`rgba(80,200,255,${alpha*.7})`);
          glow.addColorStop(.5,`rgba(0,130,255,${alpha*.18})`);
          glow.addColorStop(1,"rgba(0,70,240,0)");
        } else {
          glow.addColorStop(0,`rgba(40,155,235,${alpha*.4})`);
          glow.addColorStop(1,"rgba(0,80,200,0)");
        }
        ctx.fillStyle=glow;
        ctx.beginPath();ctx.arc(p.x,p.y,gR,0,Math.PI*2);ctx.fill();

        // Core dot
        ctx.fillStyle=`rgba(230,248,255,${alpha*(p.type===0?.95:p.type===1?.75:.4)})`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(p.type===0?.45:.3),0,Math.PI*2);ctx.fill();
      }

      // Contour lines (after convergence)
      if(np>.5){
        const cA=Math.min(.55,(np-.5)*2);
        ctx.shadowColor="rgba(0,180,255,0.3)";ctx.shadowBlur=5;
        const drawC=(idx:number[],close:boolean)=>{
          const pts=idx.filter(j=>j<ps.length).map(j=>ps[j]);
          if(pts.length<2)return;
          ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
          for(let j=1;j<pts.length-1;j++){
            ctx.quadraticCurveTo(pts[j].x,pts[j].y,(pts[j].x+pts[j+1].x)/2,(pts[j].y+pts[j+1].y)/2);
          }
          const l=pts[pts.length-1];
          if(close){ctx.quadraticCurveTo(l.x,l.y,(l.x+pts[0].x)/2,(l.y+pts[0].y)/2);ctx.closePath();}
          else ctx.lineTo(l.x,l.y);
          ctx.stroke();
        };
        ctx.lineWidth=1;ctx.strokeStyle=`rgba(0,200,255,${cA*.3})`;
        drawC(CT.jaw,false);drawC(CT.lb,false);drawC(CT.rb,false);drawC(CT.nb,false);drawC(CT.nn,false);
        ctx.lineWidth=1.2;ctx.strokeStyle=`rgba(0,210,255,${cA*.45})`;
        drawC(CT.le,true);drawC(CT.re,true);drawC(CT.om,true);
        if(np>.7){
          const xA=Math.min(.2,(np-.7)*.6);
          ctx.lineWidth=.5;ctx.strokeStyle=`rgba(0,180,255,${xA})`;
          [[21,22],[39,27],[42,27],[36,17],[45,26],[31,48],[35,54],[0,17],[16,26]].forEach(([a,b])=>{
            if(a<ps.length&&b<ps.length){ctx.beginPath();ctx.moveTo(ps[a].x,ps[a].y);ctx.lineTo(ps[b].x,ps[b].y);ctx.stroke();}
          });
        }
        ctx.shadowBlur=0;
      }

      // Soft horizontal scan line
      if(showScanLine && np<.88){
        const sw=(1-np)*.22;
        const ly=((Date.now()/16)%H);
        const g=ctx.createLinearGradient(0,ly-30,0,ly+30);
        g.addColorStop(0,"rgba(0,150,255,0)");
        g.addColorStop(.45,`rgba(0,195,255,${sw*.5})`);
        g.addColorStop(.5,`rgba(100,225,255,${sw})`);
        g.addColorStop(.55,`rgba(0,195,255,${sw*.5})`);
        g.addColorStop(1,"rgba(0,150,255,0)");
        ctx.fillStyle=g;ctx.fillRect(0,ly-30,W,60);
      }

      // Completion glow
      if(np>.92){
        const a=Math.min(.12,(np-.92)*1.5);
        const g=ctx.createRadialGradient(W/2,H*.42,0,W/2,H*.42,H*.35);
        g.addColorStop(0,`rgba(0,210,255,${a})`);
        g.addColorStop(.5,`rgba(0,150,255,${a*.35})`);
        g.addColorStop(1,"rgba(0,80,255,0)");
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      }

      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(rafRef.current);
  },[progress]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex:10}} />;
}
