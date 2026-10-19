# RYsys Photobooth

Cross-platform modern photo booth application for Windows, Linux, and Web.

Live Demo: https://rysys86.github.io/rysys-photobooth/  
Releases: https://github.com/Rysys86/rysys-photobooth/releases/latest

---

## Features

- **Modes**: Single photo, 4-photo strip, Classic Booth, 2x2 grid, 3x3 grid, Burst mode, Timed mode, Animated GIF.
- **Live Preview & Filters**: Real-time CSS GPU filters (Normal, Grayscale, Sepia, Vintage, Cool, Warm, Noir, Invert).
- **Frames**: Classic border, Polaroid, Vintage Gold, White border, Rounded corners, and Custom image overlay upload.
- **Export Formats**: High-quality PNG, multi-page / photo-sized PDF (`4x6`, `A4`, `Letter`, `Square`), Animated GIF with adjustable FPS (5/10/15 FPS) and duration.
- **Printing**: Native printer integration via browser / Tauri with auto-print and page sizing options.
- **Layouts**: Configurable strip layouts (`vertical`, `horizontal`, `2-up`).
- **Device Support**: Multi-camera switcher, resolution selector (`480p`, `720p`, `1080p`), customizable countdown timer.
- **Responsive**: Full mobile bottom sheet and desktop drawer UX.

---

## Downloads

Download installers from [GitHub Releases](https://github.com/Rysys86/rysys-photobooth/releases/latest):

| Platform | Package |
|---|---|
| Windows | `RYsys.Photobooth_1.0.0_x64-setup.exe`, `.msi` |
| Linux | `RYsys.Photobooth_1.0.0_amd64.AppImage`, `.deb`, `.rpm` |
| Linux AppData | `com.rysys.photobooth.appdata.xml` |
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
