# Photo Resizer & Compressor

A dependency-free, client-side photo utility designed for bulk preparation of images.

## Features

- Up to 50 images per batch
- Output: 130 × 150 px
- Maximum output size: 20 KB
- Original filename retained (extension becomes `.jpg` because output is JPEG)
- No padding
- No cropping
- No server upload
- Local browser processing
- Individual downloads
- Download all as a ZIP
- Responsive interface
- Vercel/GitHub ready

## Run locally

Open `index.html` in a modern browser.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md`.
3. In Vercel, import the GitHub repository.
4. Framework preset: **Other**.
5. Build command: leave empty.
6. Output directory: leave empty.
7. Deploy.

No environment variables or server-side services are required.

## Important behavior

The app directly resizes the source image to exactly 130 × 150 pixels. It does not crop or add padding. If the source image has a different aspect ratio, direct resizing can introduce some geometric distortion because exact dimensions are required.

The compression step searches for the highest JPEG quality that fits within 20 KB.
