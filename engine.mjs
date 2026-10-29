export const TIMING = Object.freeze({ perfect: 0.075, good: 0.18, double: 0.24, release: 0.1 });
const EPS = 1e-9;
export const LANE_NAMES = ['龍頭', '龍身・壹', '龍身・貳', '龍尾'];
export function createChart({ bpm = 124, duration = 49, difficulty = 'normal' } = {}) {
  const beat = 60 / bpm, notes = [];
  const end = duration - 1.5;
  const pattern = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 3, 1, 2, 3];
  const step = difficulty === 'easy' ? 1.5 : difficulty === 'hard' ? 0.75 : 1;
  let index = 0;
  for (let b = 0; 2 + b * beat < end; b += step) {
    const time = 2 + b * beat;
    const lane = pattern[index % pattern.length];
    let type = index % 12 === 7 ? 'double' : index % 12 === 3 ? 'hold' : 'tap';
    const length = type === 'hold' ? beat * (difficulty === 'hard' ? 1.5 : 1.35) : 0;
    if (time + length >= end) type = 'tap';
    notes.push({ id: notes.length, time, lane, type, duration: type === 'hold' ? length : 0 });
    if (difficulty === 'hard' && index % 8 === 6) {
      notes.push({ id: notes.length, time, lane: (lane + 2) % 4, type: 'tap', duration: 0 });
    }
    index++;
  }
  return notes.sort((a, b) => a.time - b.time || a.lane - b.lane).map((n, i) => ({ ...n, id: i }));
}
export function timingLabel(error) {
  return Math.abs(error) <= TIMING.perfect + EPS ? 'PERFECT' : error < 0 ? 'TOO EARLY' : 'TOO LATE';
}
export class RhythmEngine {
  constructor(chart, onEvent = () => {}) {
    this.notes = chart.map(n => ({ ...n, status: 'pending' }));
    this.onEvent = onEvent; this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.hearts = 5; this.resolved = 0; this.finished = false;
    this.pressed = [false, false, false, false];
    this.counts = { perfect: 0, early: 0, late: 0, miss: 0 };
  }
  get accuracy() { return this.resolved ? this.score / (this.resolved * 100) * 100 : 100; }
  get finalAccuracy() { return this.notes.length ? this.score / (this.notes.length * 100) * 100 : 100; }
  judge(note, label, time) {
    if (note.status === 'hit' || note.status === 'miss' || this.finished) return;
    note.status = label === 'MISS' ? 'miss' : 'hit';
    note.judgedAt = time;
    const points = label === 'PERFECT' ? 100 : label === 'MISS' ? 0 : 50;
    this.resolved++; this.score += points;
    if (label === 'MISS') { this.hearts--; this.combo = 0; this.counts.miss++; }
    else { this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.counts[label === 'PERFECT' ? 'perfect' : label === 'TOO EARLY' ? 'early' : 'late']++; }
    this.onEvent({ type: 'judge', note, label, points, time });
    if (!this.hearts) { this.finished = true; this.onEvent({ type: 'gameover', time }); }
  }
  down(lane, time) {
    if (this.finished || this.pressed[lane]) return;
    this.pressed[lane] = true;
    if (this.notes.some(n => n.lane === lane && n.status === 'holding')) return;
    const armed = this.notes.find(n => n.lane === lane && n.status === 'armed');
    if (armed) {
      if (time - armed.firstTime <= TIMING.double + EPS) {
        const secondError = time - (armed.time + 0.12);
        const error = Math.abs(secondError) > Math.abs(armed.error) ? secondError : armed.error;
        this.judge(armed, Math.abs(error) <= TIMING.good + EPS ? timingLabel(error) : 'MISS', time);
      } else this.judge(armed, 'MISS', time);
      return;
    }
    const note = this.notes.filter(n => n.lane === lane && n.status === 'pending' && Math.abs(time - n.time) <= TIMING.good + EPS).sort((a,b) => Math.abs(time-a.time)-Math.abs(time-b.time))[0];
    if (!note) { this.onEvent({ type: 'empty', lane, time }); return; }
    note.error = time - note.time;
    if (note.type === 'hold') { note.status = 'holding'; this.onEvent({ type: 'hold', note, time }); }
    else if (note.type === 'double') { note.status = 'armed'; note.firstTime = time; this.onEvent({ type: 'armed', note, time }); }
    else this.judge(note, timingLabel(note.error), time);
  }
  up(lane, time) {
    this.pressed[lane] = false;
    if (this.finished) return;
    const note = this.notes.find(n => n.lane === lane && n.status === 'holding');
    if (note) this.judge(note, time >= note.time + note.duration - TIMING.release - EPS ? timingLabel(note.error) : 'MISS', time);
  }
  releaseAll(time) { for (let lane=0; lane<4; lane++) this.up(lane, time); }
  resumeHolds(time) { for (const n of this.notes) if(n.status === 'holding') n.resumeGraceUntil = time + .3; }
  update(time) {
    if (this.finished) return;
    for (const n of this.notes) {
      if (this.finished) break;
      if (n.status === 'pending' && time > n.time + TIMING.good + EPS) this.judge(n, 'MISS', time);
      else if (n.status === 'armed' && time > n.firstTime + TIMING.double + EPS) this.judge(n, 'MISS', time);
      else if (n.status === 'holding' && !this.pressed[n.lane] && time > (n.resumeGraceUntil ?? -Infinity)) this.judge(n, 'MISS', time);
      else if (n.status === 'holding' && time >= n.time + n.duration) this.judge(n, timingLabel(n.error), time);
    }
  }
}
