# 🍅 Pomodoro Timer — TypeScript + Vite

Project belajar: Pomodoro Timer + belajar Git/GitHub commit.

## Fitur
- Mode Fokus (25), Istirahat (5), Istirahat Panjang (15) — bisa diubah
- Start / Jeda (Spacebar) / Reset (R)
- Progress ring SVG + judul tab ikut countdown
- Bunyi beep + auto-pindah mode (tiap 4 fokus → long break)
- Hitungan sesi tersimpan di `localStorage`

## Jalankan
```bash
cd pomodoro
npm install
npm run dev
```

Buka URL yang muncul (biasanya http://localhost:5173).

## Build
```bash
npm run build
npm run preview
```

## Struktur
```
pomodoro/
├── index.html
├── src/
│   ├── main.ts       # wiring UI + event
│   ├── pomodoro.ts   # class PomodoroTimer + beep()
│   └── style.css
```
