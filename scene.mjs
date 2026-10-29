const TAU = Math.PI * 2;
function rounded(c,x,y,w,h,r=4){c.beginPath();c.roundRect(x,y,w,h,r);}
function line(c,x1,y1,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function random(n){return ((Math.sin(n*127.1+311.7)*43758.5453)%1+1)%1;}
export class DragonScene {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.falters=[0,0,0,0];this.hits=[0,0,0,0];this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  resize(w,h){this.w=w;this.h=h;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.bg=document.createElement('canvas');this.bg.width=w*dpr;this.bg.height=h*dpr;const c=this.bg.getContext('2d');c.scale(dpr,dpr);this.buildStreet(c,w,h);}
  react(lane,miss,now){if(miss)this.falters[lane]=now+1.5;else this.hits[lane]=now+.4;}
  buildStreet(c,w,h){
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#1e302e');sky.addColorStop(.6,'#293027');sky.addColorStop(1,'#141d16');c.fillStyle=sky;c.fillRect(0,0,w,h);
    const haze=c.createRadialGradient(w*.55,h*.31,10,w*.55,h*.31,w*.7);haze.addColorStop(0,'#9e875221');haze.addColorStop(1,'#9e875200');c.fillStyle=haze;c.fillRect(0,0,w,h);
    circle(c,w*.66,h*.14,26,'#d4c7910a');circle(c,w*.66,h*.14,19,'#d4c79114');circle(c,w*.66,h*.14,14,'#c8c18d55');
    for(let i=0;i<15;i++){const bw=w/12*(.7+random(i)*.5),x=i*w/13-15,bh=h*(.21+random(i+30)*.2);c.fillStyle=i%2?'#263a34':'#2d3b32';c.fillRect(x,h*.46-bh,bw,bh);for(let j=0;j<3;j++)for(let k=0;k<5;k++){if(random(i*33+j*4+k)>.55)c.fillStyle='#98916923';else c.fillStyle='#172c27';c.fillRect(x+8+j*bw*.28,h*.46-bh+12+k*22,bw*.13,11);}line(c,x+bw*.75,h*.46-bh,x+bw*.75,h*.46-bh-16,'#465247',1);}
    const buildings=[{x:-.04,y:-.04,w:.22,h:.68,col:'#3d4b3c',n:3},{x:.16,y:.04,w:.15,h:.53,col:'#4b4e3a',n:3},{x:.30,y:.09,w:.13,h:.45,col:'#39473d',n:2},{x:.73,y:.02,w:.16,h:.58,col:'#4a4937',n:3},{x:.88,y:-.07,w:.19,h:.74,col:'#49483a',n:3}];
    for(const [i,b] of buildings.entries()){let x=b.x*w,y=b.y*h,bw=b.w*w,bh=b.h*h;c.fillStyle=b.col;c.fillRect(x,y,bw,bh);c.fillStyle='#101e19';c.fillRect(x+bw-7,y,7,bh);line(c,x,y+bh,x+bw,y+bh,'#71634b',3);
      for(let row=0;row<5;row++){const wy=y+20+row*45;line(c,x,wy-6,x+bw-7,wy-6,'#8f97732b',1);for(let col=0;col<b.n;col++){const ww=(bw-25)/b.n-9,wx=x+12+col*(bw-20)/b.n;const lit=random(i*17+row*7+col)>.47;c.fillStyle='#1c2922';c.fillRect(wx-2,wy-2,ww+4,29);const wg=c.createLinearGradient(wx,wy,wx+ww,wy+27);wg.addColorStop(0,lit?'#a58b4e':'#263b31');wg.addColorStop(1,lit?'#665e36':'#22372f');c.fillStyle=wg;c.fillRect(wx,wy,ww,25);line(c,wx+ww/2,wy,wx+ww/2,wy+25,'#29372a',2);line(c,wx,wy+12,wx+ww,wy+12,'#29372a',1);
        if((row+col+i)%3===0){c.fillStyle='#8b8b6e';c.fillRect(wx+ww-8,wy+25,15,9);for(let k=0;k<4;k++)line(c,wx+ww-6,wy+27+k*1.5,wx+ww+4,wy+27+k*1.5,'#4c5743');}
      }if(row%2===0){c.fillStyle='#283e3066';c.fillRect(x+4,wy+30,bw-14,8);line(c,x+4,wy+30,x+bw-10,wy+30,'#898267',1);for(let k=0;k<9;k++)line(c,x+6+k*(bw-18)/9,wy+30,x+6+k*(bw-18)/9,wy+38,'#686f53',1);}}
      const shopY=y+bh-62;c.fillStyle=i%2?'#343128':'#28362a';c.fillRect(x+5,shopY,bw-17,62);c.fillStyle=i%2?'#8e5139':'#8b784b';c.fillRect(x+5,shopY,bw-17,18);c.fillStyle='#e3c893';c.font=`${Math.max(9,bw/11)}px serif`;c.textAlign='center';c.fillText(['大坑茶檔','龍香傳承','街坊辦館','浣紗茶室','順記士多'][i],x+(bw-7)/2,shopY+13);
      for(let k=0;k<3;k++){c.fillStyle=k===1?'#c5a26466':'#172c23';c.fillRect(x+9+k*(bw-22)/3,shopY+23,(bw-28)/3-5,34);}line(c,x+4,shopY+20,x+bw-12,shopY+20,'#b08b54',2);
      line(c,x+bw-15,y+5,x+bw-15,shopY-10,'#1e3328',2);
    }
    // Hand-painted street signs and overhead festival lanterns.
    c.save();c.translate(w*.12,h*.125);c.rotate(-.025);c.fillStyle='#8c3c2d';rounded(c,-14,-2,29,96,2);c.fill();c.strokeStyle='#d2a36588';c.stroke();c.fillStyle='#e8c88e';c.font='18px serif';c.textAlign='center';c.fillText('大',0,25);c.fillText('坑',0,50);c.font='7px Arial';c.fillText('TAI',0,68);c.fillText('HANG',0,79);c.restore();
    c.save();c.translate(w*.91,h*.18);c.fillStyle='#607354';c.fillRect(-11,-10,23,75);c.fillStyle='#d2cba4';c.font='12px serif';c.textAlign='center';['浣','紗','街'].forEach((a,i)=>c.fillText(a,0,8+i*20));c.restore();
    c.strokeStyle='#101e18';c.lineWidth=2;c.beginPath();c.moveTo(0,h*.035);c.quadraticCurveTo(w*.52,h*.27,w,h*.07);c.stroke();
    for(let i=0;i<10;i++){const u=(i+.4)/10,x=u*w,y=h*(.035*(1-u)*(1-u)+.27*2*(1-u)*u+.07*u*u);const r=7+random(i+80)*4;line(c,x,y,x,y+12,'#b77d45',1);const glow=c.createRadialGradient(x,y+23,1,x,y+23,r*3);glow.addColorStop(0,'#f9943535');glow.addColorStop(1,'#ef8b3500');c.fillStyle=glow;c.fillRect(x-r*3,y-10,r*6,r*7);c.fillStyle='#aa452c';c.beginPath();c.ellipse(x,y+22,r,r*1.3,0,0,TAU);c.fill();c.fillStyle='#df8046';c.beginPath();c.ellipse(x-1,y+22,r*.67,r*1.22,0,0,TAU);c.fill();line(c,x,y+10,x,y+35,'#e8ae5c55',1);line(c,x-4,y+10,x+4,y+10,'#ebbc70',2);line(c,x,y+36,x,y+43,'#c7944a',1);}
    c.fillStyle='#263025';c.beginPath();c.moveTo(0,h*.61);c.lineTo(w*.48,h*.43);c.lineTo(w,h*.64);c.lineTo(w,h);c.lineTo(0,h);c.fill();
    for(let j=0;j<8;j++){let yy=h*(.58+j*.057);line(c,0,yy,w,yy+10,'#8b896415',1);}
    for(let j=0;j<6;j++){const x=j*w/5;line(c,w*.5,h*.45,x,h,'#8b89640f',1);}
    // A crowd of neighbours: varied silhouettes, clothing and hand-held lanterns.
    for(let i=0;i<43;i++){let x=i*w/42+random(i+60)*9,y=h*(.53+random(i+120)*.15);if(x>w*.25&&x<w*.77)y-=h*.04;const s=.65+random(i+90)*.5;this.person(c,x,y,s,0,i,false);}
    const wash=c.createLinearGradient(0,h*.48,0,h);wash.addColorStop(0,'#111b1100');wash.addColorStop(.9,'#131a10ee');c.fillStyle=wash;c.fillRect(0,h*.48,w,h*.52);
  }
  person(c,x,y,s,pose,i,dancer=true){c.save();c.translate(x,y);c.scale(s,s);c.rotate(pose*.16);line(c,-4,8,-8,26,'#17211b',5);line(c,4,8,8,26,'#17211b',5);line(c,-8,26,-12,27,'#aca280',3);line(c,8,26,13,27,'#aca280',3);c.fillStyle=dancer?'#a64c32':['#59614b','#8c6044','#374f45','#80554a','#b8a178'][i%5];rounded(c,-10,-17,20,29,4);c.fill();if(dancer){c.fillStyle='#efc885';c.font='7px serif';c.textAlign='center';c.fillText('火',0,-3);line(c,-8,8,8,8,'#ce9b55',2);line(c,-9,-14,-17,-35,'#ab7350',5);line(c,9,-14,16,-37,'#ab7350',5);}else{line(c,-8,-13,-13,3,'#af8760',4);line(c,9,-13,15,-3,'#af8760',4);}circle(c,0,-25,7,'#b48d65');c.fillStyle='#242a22';c.beginPath();c.arc(0,-27,7,Math.PI,TAU);c.fill();if(dancer)line(c,-7,-27,7,-27,'#dc7950',2);c.restore();}
  draw(now,musicTime=0,playing=false){
    const c=this.ctx,w=this.w,h=this.h;if(!w)return;c.clearRect(0,0,w,h);c.drawImage(this.bg,0,0,w,h);const motion=this.reduced?0:now;
    // Incense smoke moves above the procession, away from the note surface.
    for(let j=0;j<4;j++){c.strokeStyle=`rgba(207,188,133,${.032+j*.005})`;c.lineWidth=9-j;c.beginPath();const x=w*(.27+j*.17);c.moveTo(x,h*.42);c.bezierCurveTo(x+Math.sin(motion*.3+j)*25,h*.3,x-25,h*.2,x+Math.cos(motion*.22+j)*40,h*.1);c.stroke();}
    const points=[];for(let i=0;i<=60;i++){const u=i/60,x=w*(.205+u*.71),lane=Math.min(3,Math.floor(u*4)),f=Math.max(0,this.falters[lane]-now)/1.5;const wave=Math.sin(u*TAU*1.7-motion*2.9)*h*.025;const stumble=f*(Math.sin(now*22+u*14)*h*.02+h*.045);points.push({x,y:h*.38+wave+stumble,u,f});}
    // Bamboo poles and the team carry the moving dragon together.
    for(let i=0;i<9;i++){const p=points[3+i*6],lane=Math.min(3,Math.floor(p.u*4)),f=Math.max(0,this.falters[lane]-now)/1.5;const py=h*.54+Math.sin(motion*3+i)*2;line(c,p.x,p.y+3,p.x+(f?Math.sin(now*15)*8:0),py-22,'#c7a975',2);this.person(c,p.x,py,Math.min(w/760,1.1),f*Math.sin(now*16),i,true);}
    c.save();c.lineCap='round';c.lineJoin='round';c.shadowColor='#f4a34c';c.shadowBlur=17;c.strokeStyle='#d49346aa';c.lineWidth=19;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.shadowBlur=0;c.strokeStyle='#4b3e26';c.lineWidth=15;c.stroke();c.strokeStyle='#bf8a43';c.lineWidth=11;c.setLineDash([2,3]);c.stroke();c.setLineDash([]);
    for(let i=0;i<points.length;i++){const p=points[i],angle=-Math.PI/2+Math.sin(p.u*10)*.5,len=9+random(i+73)*12;line(c,p.x,p.y-3,p.x+Math.cos(angle)*len,p.y+Math.sin(angle)*len,'#ac9a5b',.7);circle(c,p.x+Math.cos(angle)*len,p.y+Math.sin(angle)*len,1.4,p.f?'#ed6543':'#ffd892');if(i%2===0){line(c,p.x,p.y,p.x+5,p.y+10,'#b5a161',.6);circle(c,p.x+5,p.y+10,1,'#f5c37b');}}
    // Dragon head: woven muzzle, antlers, incandescent eyes and flowing beard.
    const head=points[0];c.translate(head.x-8,head.y);c.rotate(-.1+Math.sin(motion*3)*.08+(head.f?Math.sin(now*18)*.2:0));c.shadowColor='#f1b85c';c.shadowBlur=12;c.fillStyle='#bc924c';c.beginPath();c.moveTo(14,-11);c.lineTo(-4,-26);c.lineTo(-15,-19);c.lineTo(-35,-14);c.lineTo(-39,0);c.lineTo(-25,10);c.lineTo(4,12);c.closePath();c.fill();c.shadowBlur=0;
    line(c,-6,-20,-13,-38,'#dfbb78',3);line(c,-13,-32,-23,-38,'#dfbb78',2);line(c,-13,-31,-10,-40,'#dfbb78',2);line(c,8,-15,7,-35,'#dfbb78',3);line(c,7,-28,16,-35,'#dfbb78',2);
    c.fillStyle='#553e25';c.beginPath();c.ellipse(-18,-6,10,7,-.3,0,TAU);c.fill();circle(c,-17,-8,4,'#fff4be');circle(c,-18,-8,1.6,'#a74623');line(c,-35,1,-19,3,'#382c1c',3);line(c,-30,6,-11,7,'#e6c082',2);
    for(let j=0;j<13;j++){const a=TAU*j/13;const x=-11+Math.cos(a)*23,y=-3+Math.sin(a)*17;line(c,x,y,x+Math.cos(a)*9,y+Math.sin(a)*9,'#b6a76b',.6);circle(c,x+Math.cos(a)*9,y+Math.sin(a)*9,1.2,'#f9d994');}
    c.strokeStyle='#ceae6b';c.lineWidth=1;for(let j=0;j<5;j++){c.beginPath();c.moveTo(-27+j*3,8);c.quadraticCurveTo(-34+j*3,26+Math.sin(motion*2+j)*5,-44+j*3,21);c.stroke();}c.restore();
    // The pearl leads the procession.
    const px=w*.105,py=h*.40+Math.sin(motion*2.5)*7;line(c,px+5,py+5,px+15,h*.54,'#bba47b',2);circle(c,px,py,15,'#f2b95810');circle(c,px,py,9,'#dca555');circle(c,px-2,py-2,5,'#f4d696');for(let k=0;k<12;k++){const a=k*TAU/12;line(c,px+Math.cos(a)*9,py+Math.sin(a)*9,px+Math.cos(a)*16,py+Math.sin(a)*16,'#e2c17c',.7);circle(c,px+Math.cos(a)*16,py+Math.sin(a)*16,1,'#ffe9b2');}
    for(let i=0;i<27;i++){const age=(motion*(.14+random(i)*.14)+random(i+19))%1,x=w*(.1+random(i+200)*.85)+Math.sin(motion*.5+i)*11,y=h*(.52-age*.4);circle(c,x,y,.6+random(i+22)*.8,`rgba(246,191,104,${(1-age)*.6})`);}
    if(this.falters.some(f=>f>now)){const g=c.createLinearGradient(0,0,0,h*.7);g.addColorStop(0,'#d94a2512');g.addColorStop(1,'#d94a2500');c.fillStyle=g;c.fillRect(0,0,w,h*.7);}
  }
}
export class NoteRenderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.effects=[];}
  resize(w,h){this.w=w;this.h=h;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  geometry(){const bottom=Math.min(this.w*(matchMedia('(max-width:800px)').matches?.84:.70),600),top=bottom*.52;return{bottom,top,topY:this.h*.43,hitY:this.h-98};}
  laneX(lane,p=1){const g=this.geometry(),width=g.top+(g.bottom-g.top)*p;return this.w/2-width/2+width*(lane+.5)/4;}
  burst(lane,label,now){this.effects.push({lane,label,time:now});}
  draw(time,notes,pressed,now,speed=1,idle=false){
    const c=this.ctx,w=this.w,h=this.h;if(!w)return;const g=this.geometry(),travel=2.15/speed,ty=g.topY,hy=g.hitY;c.clearRect(0,0,w,h);
    const grad=c.createLinearGradient(0,ty,0,hy+20);grad.addColorStop(0,'#19231a05');grad.addColorStop(.3,'#141c1299');grad.addColorStop(1,'#151b12c9');c.fillStyle=grad;c.beginPath();c.moveTo(w/2-g.top/2,ty);c.lineTo(w/2+g.top/2,ty);c.lineTo(w/2+g.bottom/2,hy+10);c.lineTo(w/2-g.bottom/2,hy+10);c.closePath();c.fill();
    for(let l=0;l<=4;l++){const x1=w/2-g.top/2+g.top*l/4,x2=w/2-g.bottom/2+g.bottom*l/4;line(c,x1,ty,x2,hy+13,l===0||l===4?'#a2905c42':'#b29c6025',1);}
    for(let l=0;l<4;l++){if(pressed[l]){const gg=c.createLinearGradient(0,hy-135,0,hy);gg.addColorStop(0,'#f5c96a00');gg.addColorStop(1,'#f5c96a40');c.fillStyle=gg;c.beginPath();c.moveTo(this.laneX(l,.5)-g.bottom/12,hy-135);c.lineTo(this.laneX(l,.5)+g.bottom/12,hy-135);c.lineTo(this.laneX(l)+g.bottom/8-2,hy);c.lineTo(this.laneX(l)-g.bottom/8+2,hy);c.fill();}}
    c.save();c.shadowColor='#dfb461';c.shadowBlur=13;line(c,w/2-g.bottom/2,hy,w/2+g.bottom/2,hy,'#f0d08a',2);c.shadowBlur=0;line(c,w/2-g.bottom/2,hy+5,w/2+g.bottom/2,hy+5,'#bba16c33',1);c.restore();
    const visible=notes.filter(n=>n.status!=='hit'&&n.status!=='miss'&&(n.time-time<travel)&&(n.time+(n.duration||0)-time>-.4)).sort((a,b)=>b.time-a.time);
    for(const n of visible){
      let p=1-(n.time-time)/travel;p=Math.max(0,Math.min(1.07,p));const y=ty+(hy-ty)*p,x=this.laneX(n.lane,p),nw=(g.top+(g.bottom-g.top)*p)/4-12;
      c.save();c.globalAlpha=idle?.42:Math.min(1,Math.max(0,p*4));
      if(n.type==='hold'){const ep=Math.max(0,Math.min(1,1-(n.time+n.duration-time)/travel)),ey=ty+(hy-ty)*ep,ex=this.laneX(n.lane,ep);const bottomY=n.status==='holding'?hy:y,bottomX=n.status==='holding'?this.laneX(n.lane):x;const bar=c.createLinearGradient(0,ey,0,bottomY);bar.addColorStop(0,'#8ba78235');bar.addColorStop(1,n.status==='holding'?'#c0dcaeaa':'#98b98777');c.fillStyle=bar;c.beginPath();c.moveTo(ex-nw*.26,ey);c.lineTo(ex+nw*.26,ey);c.lineTo(bottomX+nw*.36,bottomY);c.lineTo(bottomX-nw*.36,bottomY);c.closePath();c.fill();line(c,ex,ey,bottomX,bottomY,'#c8d6a955',1);c.fillStyle='#b8cda2';rounded(c,bottomX-nw/2,bottomY-5,nw,10,2);c.fill();c.strokeStyle='#e1edd0';c.stroke();c.fillStyle='#d7e4c6';rounded(c,ex-nw*.28,ey-2,nw*.56,4,1);c.fill();}
      else if(n.type==='double'){c.translate(x,n.status==='armed'?hy:y);const sz=8+p*5;c.fillStyle=n.status==='armed'?'#fbd1df':'#d598b0';c.shadowColor='#e1a7bb';c.shadowBlur=12;c.beginPath();c.moveTo(-nw*.42,0);c.lineTo(0,-sz);c.lineTo(nw*.42,0);c.lineTo(0,sz);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='#ffe0eb';c.lineWidth=1;c.stroke();c.fillStyle='#744859';c.font=`bold ${10+p*2}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(n.status==='armed'?'再按':'×2',0,0);}
      else {const nh=7+p*3;c.fillStyle='#e4be76';c.shadowColor='#e9b956';c.shadowBlur=9;rounded(c,x-nw/2,y-nh/2,nw,nh,2);c.fill();c.shadowBlur=0;c.strokeStyle='#fbe4ac';c.lineWidth=.8;c.stroke();line(c,x-nw/2+4,y-1,x+nw/2-4,y-1,'#fff0c966',1);}
      c.restore();
    }
    this.effects=this.effects.filter(e=>now-e.time<.6);for(const e of this.effects){const age=(now-e.time)/.6,x=this.laneX(e.lane),color=e.label==='MISS'?'#ef8060':e.label==='PERFECT'?'#f6d897':'#c9dec3';c.save();c.globalAlpha=1-age;c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.ellipse(x,hy,12+age*42,5+age*17,0,0,TAU);c.stroke();for(let j=0;j<8;j++){const a=j*TAU/8;circle(c,x+Math.cos(a)*age*60,hy-Math.sin(Math.PI*age)*35+Math.sin(a)*age*20,1.5*(1-age),color);}c.restore();}
  }
}
