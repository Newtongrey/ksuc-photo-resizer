# Koitaleel Samoei University College — ICT Utilities

Static utility portal hosted on Vercel.

- `/` — ICT Utilities landing page
- `/image-resizer/` — existing bulk image resizer (preserved)
- `/pdf-tools/` — browser-based PDF and document tools

## Privacy
File operations are performed in the user's browser wherever supported. Third-party libraries load from CDN, but the selected files are not sent to those CDNs or a server by this code.

## PDF conversion limitations
- PDF to Word extracts selectable text to a DOCX and does not preserve exact layout; scanned PDFs need OCR.
- Word to PDF converts DOCX content to HTML and renders that HTML to PDF in the browser; complex formatting may differ.
- PDF merge, split, image-to-PDF and PDF-to-PNG use browser libraries.

No server, database or build step is required. Deploy as a static site on Vercel.
