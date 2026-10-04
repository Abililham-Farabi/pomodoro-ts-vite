export type Mode = 'focus' | 'short' | 'long';

export interface Durations {
  focus: number; // dalam detik
  short: number;
  long: number;
}

export class PomodoroTimer {
  private durations: Durations;
  private mode: Mode = 'focus';
  private remaining: number;
  private intervalId: number | null = null;
  private completedFocus = 0;

  onTick: (remaining: number, mode: Mode) => void = () => {};
  onModeChange: (mode: Mode) => void = () => {};
  onFinish: (finishedMode: Mode, completedFocus: number) => void = () => {};

  constructor(focusMin = 25, shortMin = 5, longMin = 15) {
    this.durations = {
      focus: focusMin * 60,
      short: shortMin * 60,
      long: longMin * 60,
    };
    this.remaining = this.durations.focus;
  }

  getMode(): Mode {
    return this.mode;
  }

  getRemaining(): number {
    return this.remaining;
  }

  getTotal(): number {
    return this.durations[this.mode];
  }

  getCompleted(): number {
    return this.completedFocus;
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  setDurations(focusMin: number, shortMin: number, longMin: number): void {
    this.durations = {
      focus: Math.max(60, focusMin * 60),
      short: Math.max(60, shortMin * 60),
      long: Math.max(60, longMin * 60),
    };
    // sinkronkan sisa waktu dengan mode aktif kalau timer lagi berhenti
    if (!this.isRunning()) {
      this.remaining = this.durations[this.mode];
      this.onTick(this.remaining, this.mode);
    }
  }

  switchMode(mode: Mode): void {
    this.pause();
    this.mode = mode;
    this.remaining = this.durations[mode];
    this.onModeChange(mode);
    this.onTick(this.remaining, mode);
  }

  start(): void {
    if (this.isRunning()) return;
    this.intervalId = window.setInterval(() => {
      this.remaining -= 1;
      this.onTick(this.remaining, this.mode);
      if (this.remaining <= 0) {
        const finished = this.mode;
        if (finished === 'focus') this.completedFocus += 1;
        this.pause();
        this.onFinish(finished, this.completedFocus);
        // auto lanjut: habis fokus -> short (atau long tiap 4 sesi)
        if (finished === 'focus') {
          const next: Mode = this.completedFocus % 4 === 0 ? 'long' : 'short';
          this.switchMode(next);
        } else {
          this.switchMode('focus');
        }
      }
    }, 1000);
  }

  pause(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.pause();
    this.remaining = this.durations[this.mode];
    this.onTick(this.remaining, this.mode);
  }

  /** Lewati sesi saat ini tanpa menambah hitungan fokus selesai. */
  skip(): void {
    this.pause();
    if (this.mode === 'focus') {
      const next: Mode = (this.completedFocus + 1) % 4 === 0 ? 'long' : 'short';
      this.switchMode(next);
    } else {
      this.switchMode('focus');
    }
  }

  static format(sec: number): string {
    const m = Math.floor(Math.max(0, sec) / 60)
      .toString()
      .padStart(2, '0');
    const s = (Math.max(0, sec) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

export function beep(times = 3): void {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    times = Math.min(5, Math.max(1, times));
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const t = ctx.currentTime + i * 0.35;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.32);
    }
    window.setTimeout(() => void ctx.close(), times * 400 + 200);
  } catch {
    // abaikan kalau browser blokir audio
  }
}
