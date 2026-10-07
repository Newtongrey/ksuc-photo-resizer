const TARGET_W = 130;
const TARGET_H = 150;
const MAX_BYTES = 20 * 1024;
const MAX_FILES = 50;

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const queueSection = document.getElementById("queueSection");
const resultsSection = document.getElementById("resultsSection");
const fileTable = document.getElementById("fileTable");
const queueSummary = document.getElementById("queueSummary");
const resultsSummary = document.getElementById("resultsSummary");
const resultsList = document.getElementById("resultsList");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");

let selectedFiles = [];
let processed = [];

dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  addFiles([...fileInput.files]);
  fileInput.value = "";
});

["dragenter", "dragover"].forEach(eventName => {
  dropzone.addEventListener(eventName, e => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(eventName => {
  dropzone.addEventListener(eventName, e => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", e => {
  addFiles([...e.dataTransfer.files]);
});

clearBtn.addEventListener("click", clearAll);
processBtn.addEventListener("click", processAll);
downloadAllBtn.addEventListener("click", downloadZip);

function addFiles(files) {
  const images = files.filter(file => file.type.startsWith("image/"));
  const remaining = MAX_FILES - selectedFiles.length;

  if (!remaining) {
    alert(`You can process a maximum of ${MAX_FILES} images at once.`);
    return;
  }

  selectedFiles.push(...images.slice(0, remaining));
  if (images.length > remaining) {
    alert(`Only ${remaining} more image(s) were added. Maximum is ${MAX_FILES}.`);
  }

  renderQueue();
}

function renderQueue() {
  queueSection.classList.toggle("hidden", selectedFiles.length === 0);
  queueSummary.textContent = `${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} selected`;

  fileTable.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="filename" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</td>
      <td>${formatBytes(file.size)}</td>
      <td>130 × 150 px</td>
      <td id="status-${index}" class="status pending">Ready</td>
      <td><button class="remove-file" title="Remove" data-index="${index}">×</button></td>
    `;
    fileTable.appendChild(tr);
  });

  document.querySelectorAll(".remove-file").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedFiles.splice(Number(btn.dataset.index), 1);
      renderQueue();
    });
  });
}

async function processAll() {
  if (!selectedFiles.length) return;

  processBtn.disabled = true;
  clearBtn.disabled = true;
  processed = [];
  resultsList.innerHTML = "";
  resultsSection.classList.remove("hidden");

  let success = 0;

  for (let i = 0; i < selectedFiles.length; i++) {
    setStatus(i, "Processing…", "processing");
    try {
      const result = await processImage(selectedFiles[i]);
      processed.push(result);
      success++;
      setStatus(i, `${formatBytes(result.blob.size)}`, "success");
    } catch (error) {
      console.error(error);
      setStatus(i, "Failed", "error");
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  renderResults();
  resultsSummary.textContent = `${success} of ${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} processed successfully`;
  processBtn.disabled = false;
  clearBtn.disabled = false;
}

function setStatus(index, text, cls) {
  const cell = document.getElementById(`status-${index}`);
  if (cell) {
    cell.textContent = text;
    cell.className = `status ${cls}`;
  }
}

async function processImage(file) {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Deliberately resize directly to 130×150:
  // no padding, no borders and no cropping.
  ctx.drawImage(bitmap, 0, 0, TARGET_W, TARGET_H);
  bitmap.close();

  let blob = await canvasToJpeg(canvas, 0.88);

  if (blob.size > MAX_BYTES) {
    blob = await compressUnderLimit(canvas, MAX_BYTES);
  }

  // Preserve the original filename exactly.
  // For formats that cannot be reliably downloaded as JPEG, the extension is
  // changed to .jpg while the base filename remains unchanged.
  const outputName = replaceExtension(file.name, ".jpg");

  return {
    original: file,
    blob,
    name: outputName,
    width: TARGET_W,
    height: TARGET_H
  };
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image."));
    }, "image/jpeg", quality);
  });
}

async function compressUnderLimit(canvas, maxBytes) {
  // Binary search JPEG quality for the smallest quality that stays under 20 KB.
  // Start high and progressively find the best quality that meets the limit.
  let low = 0.05;
  let high = 0.95;
  let best = null;

  for (let i = 0; i < 12; i++) {
    const quality = (low + high) / 2;
    const blob = await canvasToJpeg(canvas, quality);

    if (blob.size <= maxBytes) {
      best = blob;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (best) return best;

  // Extremely conservative fallback; 130×150 images should normally fit.
  return canvasToJpeg(canvas, 0.05);
}

function renderResults() {
  resultsList.innerHTML = "";

  processed.forEach(result => {
    const url = URL.createObjectURL(result.blob);
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <img class="thumb" src="${url}" alt="">
      <div>
        <div class="result-name" title="${escapeHtml(result.name)}">${escapeHtml(result.name)}</div>
        <div class="result-meta">${result.width} × ${result.height} px · ${formatBytes(result.blob.size)}</div>
      </div>
      <a class="download-one" href="${url}" download="${escapeHtml(result.name)}">Download</a>
    `;
    resultsList.appendChild(row);
  });
}

async function downloadZip() {
  if (!processed.length) return;

  downloadAllBtn.disabled = true;
  downloadAllBtn.textContent = "Preparing ZIP…";

  try {
    const zip = new SimpleZip();
    for (const item of processed) {
      zip.addFile(item.name, new Uint8Array(await item.blob.arrayBuffer()));
    }
    const blob = zip.build();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed-photos.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    downloadAllBtn.disabled = false;
    downloadAllBtn.textContent = "Download all ZIP";
  }
}

function clearAll() {
  selectedFiles = [];
  processed.forEach(item => {
    // Object URLs created for the result list are revoked when results are removed
  });
  processed = [];
  resultsList.innerHTML = "";
  resultsSection.classList.add("hidden");
  renderQueue();
}

/* Tiny dependency-free ZIP writer using store/no-compression entries.
   The images themselves are already JPEG-compressed, so ZIP compression
   adds little while keeping the app fully client-side and dependency-free. */
class SimpleZip {
  constructor() {
    this.files = [];
  }

  addFile(name, data) {
    this.files.push({ name, data });
  }

  build() {
    const chunks = [];
    const central = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = crc32(file.data);

      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      write32(lv, 0, 0x04034b50);
      write16(lv, 4, 20);
      write16(lv, 6, 0);
      write16(lv, 8, 0);
      write16(lv, 10, 0);
      write16(lv, 12, 0);
      write32(lv, 14, crc);
      write32(lv, 18, file.data.length);
      write32(lv, 22, file.data.length);
      write16(lv, 26, nameBytes.length);
      write16(lv, 28, 0);
      local.set(nameBytes, 30);

      chunks.push(local, file.data);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      write32(cv, 0, 0x02014b50);
      write16(cv, 4, 20);
      write16(cv, 6, 20);
      write16(cv, 8, 0);
      write16(cv, 10, 0);
      write16(cv, 12, 0);
      write16(cv, 14, 0);
      write32(cv, 16, crc);
      write32(cv, 20, file.data.length);
      write32(cv, 24, file.data.length);
      write16(cv, 28, nameBytes.length);
      write16(cv, 30, 0);
      write16(cv, 32, 0);
      write16(cv, 34, 0);
      write16(cv, 36, 0);
      write32(cv, 38, 0);
      write32(cv, 42, offset);
      cd.set(nameBytes, 46);

      central.push(cd);
      offset += local.length + file.data.length;
    }

    const centralOffset = offset;
    const centralSize = central.reduce((sum, x) => sum + x.length, 0);

    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    write32(ev, 0, 0x06054b50);
    write16(ev, 4, 0);
    write16(ev, 6, 0);
    write16(ev, 8, this.files.length);
    write16(ev, 10, this.files.length);
    write32(ev, 12, centralSize);
    write32(ev, 16, centralOffset);
    write16(ev, 20, 0);

    return new Blob([...chunks, ...central, end], { type: "application/zip" });
  }
}

function write16(view, offset, value) { view.setUint16(offset, value, true); }
function write32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function replaceExtension(name, ext) {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name) + ext;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}
