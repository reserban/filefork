<div align="center">
  <img src="public/symbol.svg" width="56" height="56" alt="FileFork" style="background:#00339b;padding:10px;border-radius:14px" />

  # FileFork

  **Compress and convert images, videos, audio and PDFs — entirely in your browser.**

  No uploads. No accounts. No data trail. Open source.

  [Live demo](https://filefork.com) · [Features](#features) · [Stack](#stack) · [Local setup](#local-setup) · [Contributing](#contributing) · [License](#license)
</div>

---

## Features

- **Every common format**
  Images (JPG · PNG · WebP · AVIF · GIF · HEIC · TIFF · BMP · SVG), video (MP4 · MOV · WebM · AVI · MKV), audio (MP3 · WAV · AAC · FLAC · OGG · Opus · M4A), and PDFs. Drop them in any mix.
- **Truly local** — everything runs in your browser. Video and audio transcode via FFmpeg WASM, images via canvas-based encoders, PDFs via `pdf-lib`. No API routes, no server roundtrip, no telemetry.
- **One-click conversion presets** — *For the web* (WebP / MP4-H.264 / MP3), *Same format* (preserve input format), *Smallest* (AVIF / H.265 / Opus), *Works everywhere* (JPEG / MP4-H.264 / MP3).
- **Batch + ZIP** — drop a folder of 500 files, get a single ZIP. Drop a ZIP, we'll unpack it first.
- **Per-file overrides** — each file row exposes its own quality, format, resolution, and (for tall images > 4000px) slice-count controls.
- **Slice tall images** — chop page-sized slices out of long screenshots or landing-page captures.
- **Real-time progress** — actual FFmpeg progress bars, live elapsed/ETA counters, and a pre-flight estimate on the cards that would take longer.
- **Light / dark themes** with an EU-flag palette (`#00339b` blue + `#ffcc02` gold).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) with React 19
- [Tailwind CSS v4](https://tailwindcss.com/) + custom design tokens
- [shadcn/ui](https://ui.shadcn.com/) primitives (Button, Slider, Select, Alert, Card, …)
- [`@ffmpeg/ffmpeg`](https://ffmpegwasm.netlify.app/) — WebAssembly video + audio pipeline
- [`browser-image-compression`](https://github.com/Donaldcwl/browser-image-compression) — canvas-based image pipeline
- [`pdf-lib`](https://pdf-lib.js.org/) + [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) — PDF re-encode + rendering
- [`jszip`](https://stuk.github.io/jszip/) — batch ZIP / unzip
- [`react-dropzone`](https://react-dropzone.js.org/) — drag-and-drop surface

## Local setup

```bash
# 1. Install
npm install

# 2. Run the dev server
npm run dev

# 3. Open http://localhost:3000
```

Scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start the built server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Strict `tsc --noEmit` |

**Requirements**: Node 20+.

## Project structure

```
src/
├── app/                        Next.js App Router (no API routes — fully static)
│   ├── globals.css             Tailwind + design tokens (EU blue + gold)
│   ├── layout.tsx              Root layout, fonts, theme provider
│   └── page.tsx                Mounts <Optimizer />
├── components/
│   ├── optimizer/              Feature components
│   │   ├── Optimizer.tsx       Top-level client component (state + handlers)
│   │   ├── Hero.tsx            Landing/empty state
│   │   ├── Features.tsx        Bento grid (Drop-route, Convert, Batch/ZIP, Private)
│   │   ├── DropOverlay.tsx     Fullscreen drag catcher
│   │   ├── CommandCard.tsx     Active command surface once files are loaded
│   │   ├── FileList.tsx        Filtered list of FileCards + empty state
│   │   ├── FileCard.tsx        Per-file row (thumb, stats, actions, progress)
│   │   ├── FileSettings.tsx    Per-file quality/format/resolution drawer
│   │   ├── InfoTip.tsx         Hover tooltip used in the tune panel
│   │   ├── constants.ts        Presets, quality/format/resolution tables
│   │   ├── types.ts            UploadedFile, OptimizedFile, FileKind, Slice
│   │   └── utils.ts            formatSize, detectFileKind, sameFormatOutput, estimators
│   ├── theme/                  next-themes provider + toggle
│   └── ui/                     shadcn primitives
├── hooks/
│   └── use-window-drag.ts      Detects file drags anywhere on the window
├── lib/
│   ├── optimizer/              Pure pipeline implementations
│   │   ├── client-image-optimizer.ts   browser-image-compression wrapper
│   │   ├── client-video-optimizer.ts   FFmpeg WASM loader + video pipeline
│   │   ├── client-audio-optimizer.ts   FFmpeg WASM audio pipeline
│   │   ├── client-pdf-optimizer.ts     pdf-lib + pdfjs-dist pipeline
│   │   └── types.ts                    Shared format + option types
│   └── utils.ts                Global `cn()` class-merger
└── public/                     symbol.svg · favicon.png
```

## How it works

### Image pipeline
- All images run client-side via `browser-image-compression` (canvas + web worker).
- HEIC / TIFF / BMP inputs fall back to JPEG output (browser canvases can't encode those formats directly).
- AVIF output falls back to WebP on browsers that can't encode AVIF via canvas.

### Video + audio pipeline
- [`@ffmpeg/ffmpeg`](https://ffmpegwasm.netlify.app/) 0.12.6 single-threaded core, fetched from jsDelivr and registered as blob URLs (no `SharedArrayBuffer` / COOP+COEP headers required).
- Progress events are wired through a per-call guard flag so stale listeners on the shared FFmpeg instance can't leak between files.
- Quality (0–100) maps to codec-specific CRF values and bitrates (H.264 / H.265 / VP9 for video; libmp3lame / aac / libopus / libvorbis / flac / pcm_s16le for audio).

### PDF pipeline
- `pdf-lib` re-encodes + strips metadata.
- `pdfjs-dist` renders thumbnails when needed.

### Batch ZIP
- `jszip` produces a single archive from all successfully optimized outputs. Split-slice outputs get nested folders.

## Privacy & security

- Every byte stays in your browser. No API routes, no server roundtrip, no upload.
- No telemetry, no analytics, no crash reporter, no cookies, no accounts.
- The build is fully static — host it on any static host (Vercel, Cloudflare Pages, Netlify, a plain S3 bucket). No server runtime needed.

## Contributing

PRs welcome. Keep the no-accounts, no-uploads promise intact.

```bash
# Typical flow
git checkout -b feature/your-idea
npm run typecheck
npm run lint
npm run build
git commit -m "Add: your idea"
```

## License

MIT — see [LICENSE](LICENSE).
