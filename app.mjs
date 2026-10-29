import { createChart, RhythmEngine, LANE_NAMES } from './engine.mjs';
import { AudioPlayer } from './audio.mjs';
import { DragonScene, NoteRenderer } from './scene.mjs';
const $ = id => document.getElementById(id);
const audio = new AudioPlayer();
const scene = new DragonScene($('scene-canvas'));
const renderer = new NoteRenderer($('note-canvas'));
const laneButtons = [...document.querySelectorAll('.lane-key')];
const keys = { KeyD:0, KeyF:1, KeyJ:2, KeyK:3, Digit1:0, Digit2:1, Digit3:2, Digit4:3 };
const inputs = [new Set(),new Set(),new Set(),new Set()];
let status='idle',engine=null,chart=[],difficulty='normal',song={title:'Lose My Mine',duration:49,bpm:124,custom:false,key:'demo-v1'},pausedAt=0,countdownEnd=0,countdownMode='new',lastCount=0;
let settings={volume:65,speed:1,offset:0,bpm:124,firstBeat:2},records={};
let toastTimer,stageTimer,cacheKey='',disposed=false;
try{settings={...settings,...JSON.parse(localStorage.getItem('firebeat-settings')||'{}')};records=JSON.parse(localStorage.getItem('firebeat-records')||'{}');}catch{}
settings.volume=Math.max(0,Math.min(100,Number(settings.volume)||0));settings.speed=Math.max(.7,Math.min(1.5,Number(settings.speed)||1));settings.offset=Math.max(-150,Math.min(150,Number(settings.offset)||0));settings.bpm=Math.max(50,Math.min(240,Number(settings.bpm)||124));settings.firstBeat=Math.max(0,Math.min(30,Number(settings.firstBeat)||0));
audio.setVolume(settings.volume/100);
const fmtTime = t => `${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;
const padTime = t => fmtTime(t).padStart(5,'0');
const diffName = () => ({easy:'初舞',normal:'入陣',hard:'狂舞'}[difficulty]);
const bestKey = () => `${song.key}:${difficulty}:${song.custom?settings.bpm+':'+settings.firstBeat:124}`;
function persist(){try{localStorage.setItem('firebeat-settings',JSON.stringify(settings));localStorage.setItem('firebeat-records',JSON.stringify(records));}catch{}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4000);}
function stageMessage(message){$('stage-message').textContent=message;$('stage-message').classList.add('show');clearTimeout(stageTimer);stageTimer=setTimeout(()=>$('stage-message').classList.remove('show'),1500);}
function updateChart(){
  chart=createChart({bpm:song.custom?settings.bpm:song.bpm,duration:song.duration,difficulty});
  if(song.custom) chart=chart.map(n=>({...n,time:n.time+settings.firstBeat-2})).filter(n=>n.time>=0&&n.time+n.duration<song.duration-1);
  $('note-count').textContent=`${chart.length} NOTES`;$('bpm-label').textContent=song.custom?settings.bpm:song.bpm;
  $('duration').textContent=padTime(song.duration);$('track-length').textContent=fmtTime(song.duration);
  const best=records[bestKey()];$('best-score').textContent=best?String(best.score).padStart(6,'0'):'—';
}
function hearts(n=5){$('hearts').innerHTML=Array.from({length:5},(_,i)=>`<svg viewBox="0 0 24 24" class="${i>=n?'lost':''}" aria-hidden="true"><path d="M12 21S2 14.6 2 7.8C2 2.8 8.5.8 12 5.2 15.5.8 22 2.8 22 7.8 22 14.6 12 21 12 21Z"/></svg>`).join('');$('hearts').setAttribute('aria-label',`${n} 顆心`);}
function updateStats(){
  if(!engine)return;const key=`${engine.score}-${engine.combo}-${engine.hearts}-${engine.resolved}`;if(cacheKey===key)return;cacheKey=key;
  $('score').textContent=String(engine.score).padStart(6,'0');$('accuracy').innerHTML=`${engine.accuracy.toFixed(1)}<span>%</span>`;
  $('combo-number').textContent=engine.combo;$('combo-display').classList.toggle('visible',engine.combo>=2);hearts(engine.hearts);
}
function lockControls(lock){document.querySelectorAll('[data-difficulty]').forEach(b=>b.disabled=lock);$('upload-button').disabled=lock;$('start-button').disabled=lock;}
function resetInputs(){inputs.forEach(s=>s.clear());laneButtons.forEach(b=>b.classList.remove('pressed'));if(engine)engine.pressed.fill(false);}
function resetToIdle(){
  audio.stop();audio.offset=0;status='idle';engine=null;cacheKey='';countdownEnd=0;
  document.body.classList.remove('playing');$('ready-overlay').classList.remove('hidden');$('countdown').hidden=true;$('pause-button').disabled=true;
  $('start-label').textContent='開始演出';$('scene-status').textContent='街坊就位';$('score').textContent='000000';$('accuracy').innerHTML='100.0<span>%</span>';$('combo-display').classList.remove('visible');$('judgement').className='judge-display';$('stage-message').classList.remove('show');
  $('elapsed').textContent='00:00';$('timeline-progress').style.width='0%';resetInputs();hearts();lockControls(false);updateChart();
}
function onGameEvent(event){
  const now=performance.now()/1000;
  if(event.type==='judge'){
    const miss=event.label==='MISS';scene.react(event.note.lane,miss,now);renderer.burst(event.note.lane,event.label,now);
    const el=$('judgement');el.textContent=event.label;el.className='judge-display';void el.offsetWidth;el.classList.add('show');if(miss)el.classList.add('miss');else if(event.label!=='PERFECT')el.classList.add('good');
    if(miss){stageMessage(`${LANE_NAMES[event.note.lane]}失步！穩住，接下一拍。`);$('scene-status').textContent='火龍失步';}else $('scene-status').textContent=engine.combo>=10?'火龍騰躍':'火龍起舞';
    updateStats();
  }else if(event.type==='hold'||event.type==='armed'){scene.react(event.note.lane,false,now);renderer.burst(event.note.lane,'PERFECT',now);}
  else if(event.type==='gameover')finish(false);
}
async function startGame(){
  if(status!=='idle'&&status!=='results')return;
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());status='loading';lockControls(true);$('start-label').textContent='點亮龍香…';
  try{
    await audio.init();if(!audio.buffer)await audio.demo();
    if(disposed)return;
    updateChart();if(!chart.length)throw new Error('首拍設定超出歌曲範圍，請調低首拍秒數。');
    engine=new RhythmEngine(chart,onGameEvent);cacheKey='';renderer.effects=[];scene.falters.fill(0);resetInputs();updateStats();
    $('timeline-progress').style.width='0%';$('elapsed').textContent='00:00';$('ready-overlay').classList.add('hidden');document.body.classList.add('playing');
    $('judgement').className='judge-display';$('start-label').textContent='演出中';$('scene-status').textContent='準備起舞';$('pause-button').disabled=true;
    countdownMode='new';status='countdown';countdownEnd=performance.now()+3000;lastCount=0;$('countdown').hidden=false;
    if(matchMedia('(max-width:620px)').matches)document.querySelector('.stage-card').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
  }catch(error){resetToIdle();toast(error.message||'音樂載入失敗，請再試一次。');}
}
function startAfterCountdown(){
  $('countdown').hidden=true;
  if(countdownMode==='resume'){engine.resumeHolds(pausedAt-settings.offset/1000);audio.play(pausedAt);}else audio.play(0);
  status='playing';$('scene-status').textContent='火龍起舞';$('pause-button').disabled=false;
}
function pauseGame(show=true){
  if(status!=='playing')return false;
  pausedAt=audio.pause();status='paused';$('scene-status').textContent='稍作歇息';$('pause-button').disabled=true;
  resetInputs();if(show)$('pause-dialog').showModal();return true;
}
async function resumeGame(){
  if(status!=='paused')return;
  try{await audio.init();}catch(e){toast(e.message);return;}
  if($('pause-dialog').open)$('pause-dialog').close();status='countdown';countdownMode='resume';countdownEnd=performance.now()+3000;lastCount=0;
  $('countdown').hidden=false;$('scene-status').textContent='再次就位';
  if(engine.notes.some(n=>n.status==='holding'))stageMessage('原本的長按鍵，請重新按住。');
}
function finish(cleared){
  if(status==='results')return;status='results';const time=audio.time;audio.stop();
  engine.finished=true;resetInputs();updateStats();document.body.classList.remove('playing');$('pause-button').disabled=true;
  $('scene-status').textContent=cleared?'演出圓滿':'龍火暫熄';$('start-label').textContent='再舞一場';lockControls(false);
  const acc=engine.finalAccuracy,grade=!cleared?'F':acc>=95?'S':acc>=85?'A':acc>=70?'B':acc>=50?'C':'D';
  $('result-kicker').textContent=cleared?'PERFORMANCE COMPLETE / 演出成功':'KEEP THE FIRE ALIVE / GAME OVER';$('result-title').textContent=cleared?'火龍舞畢，滿街火光。':'龍火暫熄，再舞一場。';
  $('result-grade').textContent=grade;$('result-song').textContent=`${song.title} · ${diffName()} · ${cleared?'通關':'心心已用盡'}`;
  $('result-score').textContent=String(engine.score).padStart(6,'0');$('result-accuracy').textContent=acc.toFixed(1)+'%';$('result-combo').textContent=engine.maxCombo;$('result-hearts').textContent=engine.hearts+' ♥';
  $('result-breakdown').innerHTML=`<span>PERFECT <b>${engine.counts.perfect}</b></span><span>EARLY <b>${engine.counts.early}</b></span><span>LATE <b>${engine.counts.late}</b></span><span>MISS <b>${engine.counts.miss}</b></span>`;
  const previous=records[bestKey()];const isBest=cleared&&(!previous||engine.score>previous.score);$('new-best').hidden=!isBest;
  if(isBest){records[bestKey()]={score:engine.score,accuracy:acc,combo:engine.maxCombo};persist();$('best-score').textContent=String(engine.score).padStart(6,'0');}
  $('timeline-progress').style.width=`${cleared?100:Math.min(100,time/song.duration*100)}%`;$('elapsed').textContent=padTime(cleared?song.duration:time);
  $('result-dialog').showModal();
}
function down(lane,source){
  if(status!=='playing'&&status!=='idle'&&status!=='countdown')return;
  if(document.querySelector('dialog[open]'))return;
  const wasHeld=inputs[lane].size>0;inputs[lane].add(source);laneButtons[lane].classList.add('pressed');
  if(!wasHeld&&status==='playing')engine.down(lane,audio.time-settings.offset/1000);
  else if(status==='countdown'&&countdownMode==='resume'&&engine)engine.pressed[lane]=true;
}
function up(lane,source){
  const existed=inputs[lane].delete(source);if(inputs[lane].size)return;laneButtons[lane].classList.remove('pressed');
  if(existed&&status==='playing')engine.up(lane,audio.time-settings.offset/1000);
  else if(engine&&(status==='paused'||status==='countdown'))engine.pressed[lane]=false;
}
laneButtons.forEach((b,l)=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down(l,'p'+e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{e.preventDefault();up(l,'p'+e.pointerId);});b.addEventListener('contextmenu',e=>e.preventDefault());});
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select'))return;
  if(e.code in keys){if(document.querySelector('dialog[open]'))return;e.preventDefault();if(!e.repeat)down(keys[e.code],e.code);}
  else if(e.code==='Space'&&status==='playing'){e.preventDefault();pauseGame();}
  else if(e.code==='Escape'&&status==='playing'){e.preventDefault();pauseGame();}
  else if(e.code==='Enter'&&!e.repeat&&!document.querySelector('dialog[open]')){e.preventDefault();if(status==='idle'||status==='results')startGame();}
});
document.addEventListener('keyup',e=>{if(e.code in keys)up(keys[e.code],e.code);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&status==='playing')pauseGame();});
window.addEventListener('blur',()=>{if(status==='playing')pauseGame();else resetInputs();});
window.addEventListener('pagehide',()=>{disposed=true;audio.stop();});
$('start-button').addEventListener('click',startGame);$('pause-button').addEventListener('click',()=>pauseGame());$('resume-button').addEventListener('click',resumeGame);
$('restart-button').addEventListener('click',()=>{$('pause-dialog').close();resetToIdle();startGame();});
$('quit-button').addEventListener('click',()=>{$('pause-dialog').close();resetToIdle();});
$('play-again').addEventListener('click',()=>{$('result-dialog').close();resetToIdle();startGame();});
$('back-to-song').addEventListener('click',()=>{$('result-dialog').close();resetToIdle();});
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resumeGame();});
$('result-dialog').addEventListener('cancel',()=>{resetToIdle();});
function openDialog(id){
  if(status==='countdown'||status==='loading'){toast('演出準備中，請稍等。');return;}
  const d=$(id);if(pauseGame(false))d.dataset.resume='yes';d.showModal();
}
for(const id of ['help-dialog','settings-dialog','about-dialog']){const d=$(id);d.querySelectorAll('.close-modal,.close-action').forEach(b=>b.addEventListener('click',()=>d.close()));d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{if(id==='settings-dialog'){persist();if(status==='idle')updateChart();}if(d.dataset.resume==='yes'){delete d.dataset.resume;$('pause-dialog').showModal();}});}
$('how-to').addEventListener('click',()=>openDialog('help-dialog'));$('details-button').addEventListener('click',()=>openDialog('help-dialog'));$('about-button').addEventListener('click',()=>openDialog('about-dialog'));$('settings-button').addEventListener('click',()=>openDialog('settings-dialog'));$('game-nav').addEventListener('click',()=>$('game-stage').scrollIntoView({behavior:'smooth',block:'center'}));
document.querySelectorAll('[data-difficulty]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.difficulty===difficulty?'true':'false');b.addEventListener('click',()=>{if(status!=='idle'&&status!=='results')return;difficulty=b.dataset.difficulty;document.querySelectorAll('[data-difficulty]').forEach(el=>{const active=el===b;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});updateChart();});});
function syncSettings(){
  for(const k of ['volume','speed','offset'])$(k+'-slider').value=settings[k];
  $('volume-output').textContent=settings.volume+'%';$('speed-output').textContent=settings.speed.toFixed(1)+'×';$('offset-output').textContent=(settings.offset>0?'+':'')+settings.offset+' ms';
  $('bpm-input').value=settings.bpm;$('first-beat-input').value=settings.firstBeat;
}
for(const k of ['volume','speed','offset'])$(k+'-slider').addEventListener('input',e=>{settings[k]=Number(e.target.value);if(k==='volume')audio.setVolume(settings.volume/100);syncSettings();persist();});
for(const [id,k,min,max] of [['bpm-input','bpm',50,240],['first-beat-input','firstBeat',0,30]])$(id).addEventListener('change',e=>{const n=Number(e.target.value);settings[k]=Number.isFinite(n)?Math.max(min,Math.min(max,n)):k==='bpm'?124:2;syncSettings();});
$('sound-toggle').addEventListener('click',()=>{audio.setMuted(!audio.muted);$('sound-toggle').classList.toggle('muted',audio.muted);$('sound-toggle').setAttribute('aria-pressed',String(audio.muted));$('sound-toggle').querySelector('span').textContent=audio.muted?'聲音關閉':'聲音開啟';});
$('upload-button').addEventListener('click',()=>{if(status==='idle'||status==='results')$('audio-file').click();});
$('audio-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;if(status!=='idle'&&status!=='results'){e.target.value='';return;}
  const previousBuffer=audio.buffer;status='loading';lockControls(true);$('start-label').textContent='讀取音樂…';
  try{
    const buffer=await audio.load(file);audio.stop();audio.buffer=buffer;
    song={title:file.name.replace(/.[^.]+$/,''),duration:buffer.duration,bpm:settings.bpm,custom:true,key:file.name+':'+file.size};
    $('song-title').textContent=song.title;$('song-credit').textContent='本機音樂 · BPM 節奏譜';$('song-tag').textContent='LOCAL';
    $('music-note').textContent='音檔只在你的瀏覽器播放，不會上傳。請於演出設定調整 BPM 及首拍，對齊歌曲節奏。';
    resetToIdle();toast('歌曲已匯入。可在「演出設定」調整 BPM 及首拍。');
  }catch(error){audio.buffer=previousBuffer;resetToIdle();toast(error.message||'無法解碼這個音檔，請試用 MP3、WAV 或 OGG。');}
  finally{e.target.value='';}
});
const resize=()=>{const r=$('game-stage').getBoundingClientRect();scene.resize(r.width,r.height);renderer.resize(r.width,r.height);};
new ResizeObserver(resize).observe($('game-stage'));
const preview=[{time:.55,lane:0,type:'tap',duration:0,status:'pending'},{time:1.15,lane:2,type:'hold',duration:.55,status:'pending'},{time:1.5,lane:1,type:'double',duration:0,status:'pending'},{time:1.9,lane:3,type:'tap',duration:0,status:'pending'}];
let lastDraw=0;
function frame(nowMs){
  if(disposed)return;requestAnimationFrame(frame);
  if(nowMs-lastDraw<14)return;lastDraw=nowMs;const now=nowMs/1000;
  if(status==='countdown'){const remaining=Math.ceil((countdownEnd-nowMs)/1000);if(remaining<=0)startAfterCountdown();else if(remaining!==lastCount){lastCount=remaining;$('countdown').textContent=remaining;audio.tick();}}
  let time=status==='playing'?audio.time:status==='paused'||(status==='countdown'&&countdownMode==='resume')?pausedAt:0;
  if(status==='playing'){engine.update(time-settings.offset/1000);if(status==='playing'){const progress=Math.min(1,time/song.duration);$('timeline-progress').style.width=(progress*100)+'%';$('elapsed').textContent=padTime(time);if(time>=song.duration){engine.update(song.duration+.5);if(!engine.finished)finish(true);}}}
  scene.draw(now,time,status==='playing');
  const active=engine&&(status==='playing'||status==='paused'||status==='countdown'||status==='results');
  renderer.draw(active?time-settings.offset/1000:0,active?engine.notes:preview,inputs.map(s=>s.size>0),now,settings.speed,!active);
}
syncSettings();resetToIdle();resize();requestAnimationFrame(frame);
