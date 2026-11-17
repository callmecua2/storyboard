# Storyboard to Video

Pipeline TypeScript + Remotion untuk merender storyboard JSON menjadi MP4 dengan **satu file audio narasi global** dan subtitle dari transkrip SRT bertimestamp.

## Persiapan

1. Install dependensi: `npm install`.
2. Pastikan FFmpeg dan `ffprobe` tersedia di PATH.
3. Siapkan satu file audio dan satu file transkrip SRT.
4. Path audio dan SRT ditulis relatif terhadap lokasi `storyboard.json`.

## Format storyboard

Lihat `example/storyboard.json`. Audio didefinisikan sekali di root:

```json
"audio": {
  "file": "audio/narration.mp3",
  "transcript": "audio/narration.srt"
}
```

Setiap scene hanya menentukan waktu absolut dalam detik:

```json
{ "id": 1, "start": 0, "end": 12.5, "visual": { "type": "svg", "code": "<svg>...</svg>" } }
```

Scene tidak lagi memiliki `narration`, `audio`, atau `duration`. Audio global menentukan durasi video. Cue subtitle mengikuti timestamp SRT, bukan pembagian teks otomatis. Gunakan format timestamp SRT `HH:MM:SS,mmm`.

## CLI

```bash
npm run validate -- --storyboard example/storyboard.json
npm run preview -- --storyboard example/storyboard.json
npm run render -- --storyboard example/storyboard.json
npm run render -- --storyboard example/storyboard.json --draft
``

Opsi `--no-subtitles` tetap tersedia. `--audio-dir` dihapus karena lokasi aset kini didefinisikan langsung di storyboard.
