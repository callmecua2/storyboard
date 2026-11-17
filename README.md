# Storyboard to Video (MVP)

Program lokal berbasis TypeScript & Remotion untuk mengubah file `storyboard.json` + audio narasi per adegan menjadi video MP4 utuh.

## Persiapan Awal

1. Install dependensi:
   ```bash
   npm install
   ```
2. Letakkan file font lokal (opsional, misalnya `Poppins-Bold.ttf` dan `Inter-Regular.ttf`) di folder `fonts/` jika ingin menggunakan font kustom tanpa koneksi internet.
3. Siapkan `storyboard.json` dan folder `audio/` berisi file audio per adegan (`01.wav`, `02.wav`, dst.). Contoh sudah tersedia di folder `example/`.

## Perintah CLI

```bash
# Validasi storyboard, sanitasi HTML/SVG, dan cek kelengkapan aset audio
npm run validate -- --storyboard example/storyboard.json --audio-dir example/audio

# Buka Remotion Studio untuk preview interaktif
npm run preview -- --storyboard example/storyboard.json --audio-dir example/audio

# Render seluruh video ke out/<judul>.mp4
npm run render -- --storyboard example/storyboard.json --audio-dir example/audio

# Render satu adegan tertentu (misal adegan 2) untuk pengecekan cepat
npm run render -- --storyboard example/storyboard.json --audio-dir example/audio --scene 2

# Render cepat resolusi rendah (720p, 15fps) untuk uji alur
npm run render -- --storyboard example/storyboard.json --audio-dir example/audio --draft
```
# storyboard
