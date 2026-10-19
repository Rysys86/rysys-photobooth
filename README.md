# RYsys Photobooth

Cross-platform modern photo booth application for Windows, Linux, and Web.

Live Demo: https://rysys86.github.io/rysys-photobooth/  
Releases: https://github.com/Rysys86/rysys-photobooth/releases/latest

---

## Features

- **Modes & Layouts**:
  - **Single Photo**: Standard (16:9/4:3), Portrait (3:4), Square (1:1), Polaroid, 35mm Film.
  - **Strip (4) & Classic Booth**: Vertical Strip (1x4), Horizontal Strip (4x1), 2-Up (2x2 on 4x6 print), Cinema Reel (perforated 35mm motion strip), Postcard Memo.
  - **2x2 Grid**: Classic 2x2, Polaroid Quad, Hero Focus (1 hero + 3 side thumbnails), Gallery Frame.
  - **3x3 Grid**: Classic 3x3 (9 photos), Center Stage (large hero center + 8 perimeter frames), Staggered Masonry.
  - **Burst**: Motion Strip, Action Grid, Action Cascade Stack.
  - **Animated GIF**: Standard Loop, Polaroid GIF, Retro CRT TV, Film Loop.
  - **Timed**: Standard, Portrait, Square, Polaroid interval prints.
- **Custom Frames per Mode & Layout**: Upload custom transparent PNG frame overlays for each individual capture mode and layout with real-time live preview.
- **Live Preview & Filters**: Real-time CSS GPU filters (Normal, Grayscale, Sepia, Vintage, Cool, Warm, Noir, Invert).
- **Frames**: Classic border, Polaroid, Vintage Gold, White border, Rounded corners, 35mm Film, plus Custom PNG overlays.
- **Export Formats**: High-quality PNG, multi-page / photo-sized PDF (`4x6`, `A4`, `Letter`, `Square`), Animated GIF with adjustable FPS (5/10/15 FPS) and duration.
- **Printing**: Native printer integration via browser / Tauri with auto-print and page sizing options.
- **Device Support**: Multi-camera switcher, resolution selector (`480p`, `720p`, `1080p`), camera mirror toggle, customizable countdown timer.
- **Responsive**: Full mobile bottom sheet and desktop drawer UX with official program logo (`public/icon.png`).

---

## Downloads

Download installers from [GitHub Releases](https://github.com/Rysys86/rysys-photobooth/releases/latest):

| Platform | Package |
|---|---|
| Windows | `RYsys.Photobooth_1.0.0_x64-setup.exe`, `.msi` |
| Linux | `RYsys.Photobooth_1.0.0_amd64.AppImage`, `.deb`, `.rpm` |
| Web | `rysys-photobooth-web.zip` |

---

## Development

### Prerequisites

- Node.js 18+
- Rust stable

### Run Web App

```bash
npm install
npm run dev
```

### Run Desktop App

```bash
npm run tauri dev
```

### Build Production

```bash
npm run build        # Web assets in dist/
npm run tauri build  # Desktop binaries in src-tauri/target/release/bundle/
```

### Self-Check Test

```bash
npm test
```

---

## Keyboard Shortcuts

- `Space`: Shutter capture / Stop timed mode
- `1` - `8`: Switch capture mode
- `S`: Toggle settings panel
- `Esc`: Close settings / dismiss photo modal

---

## License

MIT
