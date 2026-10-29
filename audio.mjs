export class AudioPlayer {
  constructor() { this.context=null;this.gain=null;this.buffer=null;this.source=null;this.startedAt=0;this.offset=0;this.volume=.65;this.muted=false; }
  async init() {
    if (!this.context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('這個瀏覽器不支援 Web Audio，請改用最新版 Chrome、Edge 或 Safari。');
      this.context = new Audio();this.gain=this.context.createGain();this.gain.connect(this.context.destination);this.setVolume(this.volume);
    }
    if(this.context.state==='suspended') await this.context.resume();
  }
  setVolume(v) { this.volume=v;if(this.gain)this.gain.gain.setTargetAtTime(this.muted?0:v,this.context.currentTime,.025); }
  setMuted(muted) {this.muted=muted;this.setVolume(this.volume);}
  async demo() {
    await this.init();
    const sampleRate=32000,bpm=124,beat=60/bpm,duration=49;
    const buffer=this.context.createBuffer(2,Math.ceil(duration*sampleRate),sampleRate);
    const dry=new Float32Array(buffer.length),echoBus=new Float32Array(buffer.length);
    // Mix the original arrangement directly to PCM; avoid a long first-play render.
    function tone(t,freq,dur,type,vol,slide=0,echo=false){
      const start=Math.floor(t*sampleRate),length=Math.floor(dur*sampleRate);let phase=0,increment=freq*Math.PI*2/sampleRate;
      const slideStep=slide?Math.pow(slide/freq,1/length):1;
      for(let i=0;i<length&&start+i<dry.length;i++){
        const progress=i/length,envelope=Math.min(1,i/(sampleRate*.006))*Math.exp(-6*progress)*(1-progress);
        const s=Math.sin(phase),wave=type==='sine'?s:type==='triangle'?s-Math.sin(phase*3)/9:s+Math.sin(phase*2)*.3+Math.sin(phase*3)*.12;
        const value=wave*envelope*vol;dry[start+i]+=value;if(echo)echoBus[start+i]+=value;
        phase+=increment;increment*=slideStep;
      }
    }
    let seed=19;
    function hat(t,v,high=true){let last=0;const start=Math.floor(t*sampleRate),length=Math.floor(sampleRate*(high?.06:.15));for(let i=0;i<length&&start+i<dry.length;i++){seed=(seed*16807)%2147483647;const noise=seed/2147483647*2-1;const shaped=high?(noise-last)*.5:noise*.7;dry[start+i]+=shaped*v*Math.exp(-i/length*7);last=noise;}}
    const roots=[130.81,103.83,155.56,116.54],melody=[0,7,10,14,12,7,3,10,0,3,7,15,14,10,7,3];
    for(let b=0;2+b*beat<duration-1;b++){
      const t=2+b*beat,root=roots[Math.floor(b/8)%4],bar=Math.floor(b/4),energy=b>=16&&b<80;
      tone(t,145,.19,'sine',.75,44);tone(t,51,.26,'sine',.32);
      if(b%2===1){hat(t,.33,false);tone(t,185,.085,'triangle',.16,80);}
      hat(t,.11);hat(t+beat*.5,energy?.10:.055);
      tone(t,root*.5,beat*.71,'triangle',.20);if(energy)tone(t+beat*.5,root*.5,beat*.3,'sawtooth',.035);
      for(const [j,s] of [0,3,7].entries()){tone(t,root*2*Math.pow(2,s/12),beat*.72,'triangle',.022);}
      const freq=root*2*Math.pow(2,melody[b%16]/12);tone(t+beat*.5,freq,beat*.28,'sine',energy?.15:.09,0,true);
      if(energy&&b%2===0)tone(t+beat*.75,freq*2,beat*.18,'triangle',.035,0,true);
      if(bar%4===3&&b%4===3){hat(t+beat*.75,.15,false);tone(t,520,.6,'sine',.035,330,true);}
      if(b%16===15)await new Promise(resolve=>setTimeout(resolve,0));
    }
    tone(.3,261.63,1.5,'sine',.08,0,true);tone(.6,392,1.2,'sine',.08,0,true);tone(.9,523.25,1,'sine',.08,0,true);
    const left=buffer.getChannelData(0),right=buffer.getChannelData(1),delayL=Math.round(beat*.75*sampleRate),delayR=Math.round(beat*1.25*sampleRate);
    for(let i=0;i<dry.length;i++){const fade=Math.min(1,(dry.length-i)/(sampleRate*1.6));left[i]=Math.tanh((dry[i]+(i>delayL?echoBus[i-delayL]*.23:0))*.9)*fade;right[i]=Math.tanh((dry[i]+(i>delayR?echoBus[i-delayR]*.20:0))*.9)*fade;}
    this.buffer=buffer;return this.buffer;
  }
  async load(file) {await this.init();const decoded=await this.context.decodeAudioData(await file.arrayBuffer());if(decoded.duration<7)throw new Error('請選擇至少 7 秒的歌曲。');if(decoded.duration>600)throw new Error('請選擇 10 分鐘以內的歌曲。');return decoded;}
  play(offset=0){this.stop();this.offset=offset;this.startedAt=this.context.currentTime;this.source=this.context.createBufferSource();this.source.buffer=this.buffer;this.source.connect(this.gain);this.source.start(0,Math.min(offset,this.buffer.duration));}
  get time(){return this.source?this.offset+this.context.currentTime-this.startedAt:this.offset;}
  pause(){this.offset=this.time;this.stop();return this.offset;}
  stop(){if(this.source){try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}}
  tick(){if(!this.context||this.muted)return;const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.frequency.value=880;g.gain.setValueAtTime(.035*this.volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+.045);o.connect(g);g.connect(this.context.destination);o.start();o.stop(t+.05);}
}
