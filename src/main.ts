import './style.css';
import { PomodoroTimer, beep, type Mode } from './pomodoro.ts';

const $ = <T extends Element>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Element ${sel} tidak ketemu`);
  return el;
};

const timeEl = $<HTMLDivElement>('#time');
const statusEl = $<HTMLDivElement>('#status');
const countEl = $<HTMLElement>('#count');
const ringFg = $<SVGCircleElement>('#ringFg');
const btnStart = $<HTMLButtonElement>('#btnStart');
const btnReset = $<HTMLButtonElement>('#btnReset');
const modeBtns = [...document.querySelectorAll<HTMLButtonElement>('.mode')];
const inFocus = $<HTMLInputElement>('#inFocus');
const inShort = $<HTMLInputElement>('#inShort');
const inLong = $<HTMLInputElement>('#inLong');

const CIRC = 2 * Math.PI * 90;
ringFg.style.strokeDasharray = `${CIRC}`;
ringFg.style.strokeDashoffset = '0';

// load jumlah sesi dari localStorage biar awet
const saved = Number(localStorage.getItem('pomodoro-count') ?? 0);

const timer = new PomodoroTimer(25, 5, 15);

const MODE_LABEL: Record<Mode, string> = {
  focus: 'Fokus',
  short: 'Istirahat',
  long: 'Istirahat Panjang',
};

function render(remaining: number, mode: Mode): void {
  timeEl.textContent = PomodoroTimer.format(remaining);
  document.title = `${PomodoroTimer.format(remaining)} • ${MODE_LABEL[mode]}`;
  const total = timer.getTotal() || 1;
  const progress = 1 - remaining / total;
  ringFg.style.strokeDashoffset = `${CIRC * progress}`;
  ringFg.dataset.mode = mode;
  document.body.dataset.mode = mode;
}

function renderMode(mode: Mode): void {
  modeBtns.forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === mode),
  );
  statusEl.textContent =
    mode === 'focus'
      ? timer.isRunning()
        ? 'Fokus... jangan buka HP 📵'
        : 'Siap fokus?'
      : mode === 'short'
        ? 'Istirahat sebentar ☕'
        : 'Istirahat panjang 🚶';
  btnStart.textContent = timer.isRunning() ? 'Jeda' : 'Mulai';
}

timer.onTick = (remaining, mode) => {
  render(remaining, mode);
  renderMode(mode);
};

timer.onModeChange = (_mode) => {
  render(timer.getRemaining(), timer.getMode());
  renderMode(timer.getMode());
};

timer.onFinish = (finishedMode, completed) => {
  beep(finishedMode === 'focus' ? 3 : 2);
  countEl.textContent = String(completed);
  localStorage.setItem('pomodoro-count', String(completed));
  if (finishedMode === 'focus') {
    alert('Sesi fokus selesai! Waktunya istirahat 🎉');
  } else {
    alert('Istirahat selesai! Balik fokus 💪');
  }
};

btnStart.addEventListener('click', () => {
  if (timer.isRunning()) {
    timer.pause();
  } else {
    timer.start();
  }
  render(timer.getRemaining(), timer.getMode());
  renderMode(timer.getMode());
});

btnReset.addEventListener('click', () => {
  timer.reset();
  render(timer.getRemaining(), timer.getMode());
  renderMode(timer.getMode());
});

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    timer.switchMode(btn.dataset.mode as Mode);
  });
});

[inFocus, inShort, inLong].forEach((input) => {
  input.addEventListener('change', () => {
    const f = Math.min(120, Math.max(1, Number(inFocus.value) || 25));
    const s = Math.min(60, Math.max(1, Number(inShort.value) || 5));
    const l = Math.min(60, Math.max(1, Number(inLong.value) || 15));
    inFocus.value = String(f);
    inShort.value = String(s);
    inLong.value = String(l);
    timer.setDurations(f, s, l);
    render(timer.getRemaining(), timer.getMode());
  });
});

// init
countEl.textContent = String(saved);
// sinkronkan completed internal dengan saved (tanpa ubah logika auto-long)
(timer as unknown as { completedFocus: number }).completedFocus = Number.isFinite(saved) ? saved : 0;
render(timer.getRemaining(), timer.getMode());
renderMode(timer.getMode());

// spacebar = start/jeda, R = reset
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
    e.preventDefault();
    btnStart.click();
  }
  if (e.key.toLowerCase() === 'r' && (e.target as HTMLElement).tagName !== 'INPUT') {
    btnReset.click();
  }
});
