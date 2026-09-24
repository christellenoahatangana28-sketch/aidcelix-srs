"use client";

import { readableTranscript, type OcrWord } from "@/lib/ocr-text";

const LONG_EDGE = 2200;

function scaledSize(width: number, height: number) {
  const long = Math.max(width, height);
  const target = long < 1400 ? Math.min(LONG_EDGE, long * 2) : Math.min(LONG_EDGE, long);
  const scale = target / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function drawScaled(bitmap: ImageBitmap) {
  const size = scaledSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  return canvas;
}

function adaptiveThreshold(gray: Uint8Array, width: number, height: number) {
  const radius = Math.max(12, Math.round(Math.min(width, height) / 70));
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 1; y <= height; y += 1) {
    let row = 0;
    for (let x = 1; x <= width; x += 1) {
      row += gray[(y - 1) * width + (x - 1)];
      integral[y * stride + x] = integral[(y - 1) * stride + x] + row;
    }
  }
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * stride + (x1 + 1)] -
        integral[y0 * stride + (x1 + 1)] -
        integral[(y1 + 1) * stride + x0] +
        integral[y0 * stride + x0];
      out[y * width + x] = gray[y * width + x] + 8 >= sum / count ? 255 : 0;
    }
  }
  return out;
}

function binaryCanvas(source: HTMLCanvasElement) {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  const image = context.getImageData(0, 0, source.width, source.height);
  const gray = new Uint8Array(source.width * source.height);
  for (let pixel = 0, index = 0; index < image.data.length; index += 4, pixel += 1) {
    gray[pixel] = Math.round(image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114);
  }
  const binary = adaptiveThreshold(gray, source.width, source.height);
  for (let pixel = 0, index = 0; pixel < binary.length; pixel += 1, index += 4) {
    image.data[index] = binary[pixel];
    image.data[index + 1] = binary[pixel];
    image.data[index + 2] = binary[pixel];
  }
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext("2d")?.putImageData(image, 0, 0);
  return canvas;
}

function wordsOf(result: { data: { words?: OcrWord[] | null } }): OcrWord[] {
  return (result.data.words ?? []).map((word) => ({
    text: word.text,
    confidence: word.confidence,
    bbox: { x0: word.bbox.x0, y0: word.bbox.y0 },
  }));
}

export async function readDocumentImage(
  source: Blob,
  onStatus: (status: "preparing" | "reading", progress: number) => void,
) {
  onStatus("preparing", 0);
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const color = drawScaled(bitmap);
  bitmap.close();
  const { PSM, createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra+eng", 1, {
    logger(message) {
      if (message.status === "recognizing text") onStatus("reading", message.progress ?? 0);
      else onStatus("preparing", message.progress ?? 0);
    },
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    const first = await worker
      .recognize(color, { rotateAuto: true }, { text: true, blocks: true })
      .catch(() => worker.recognize(color, {}, { text: true, blocks: true }));
    let best = readableTranscript(wordsOf(first), first.data.text, first.data.confidence);
    if (best.confidence < 70) {
      onStatus("reading", 0.15);
      const second = await worker.recognize(binaryCanvas(color), {}, { text: true, blocks: true });
      const cleaned = readableTranscript(wordsOf(second), second.data.text, second.data.confidence);
      if (cleaned.confidence > best.confidence) best = cleaned;
    }
    return best;
  } finally {
    await worker.terminate();
  }
}
