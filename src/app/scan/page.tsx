"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, ScanLine } from "lucide-react";
import { MedicationCard } from "@/components/medication/medication-card";
import { useLocation } from "@/components/location/location-provider";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { searchMedications, type SearchHit } from "@/lib/catalog-query";
import { matchPrescription } from "@/lib/prescription-match";
import { readDocumentImage } from "@/lib/read-document";

type PhotoCapabilities = { imageWidth?: { max?: number }; imageHeight?: { max?: number } };

type PhotoCapture = {
  takePhoto: (settings?: { imageWidth?: number; imageHeight?: number }) => Promise<Blob>;
  getPhotoCapabilities: () => Promise<PhotoCapabilities>;
};

export default function ScanPage() {
  const { t } = useI18n();
  const { coords } = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoUrlRef = useRef<string | null>(null);
  const photoFileRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<SearchHit[] | null>(null);
  const [phase, setPhase] = useState<"preparing" | "reading" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCameraReady(false);
  }

  function showPhoto(file: Blob) {
    stopCamera();
    photoFileRef.current = file;
    const url = URL.createObjectURL(file);
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = url;
    setPhotoUrl(url);
    setText("");
    setMatches(null);
    setError("");
  }

  async function openCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      const track = next.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & {
        focusMode?: string[];
        width?: { max?: number };
        height?: { max?: number };
      };
      if (track && capabilities) {
        const advanced: MediaTrackConstraintSet[] = [];
        if (capabilities.focusMode?.includes("continuous")) {
          advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
        }
        await track
          .applyConstraints({
            width: { ideal: capabilities.width?.max ?? 1920 },
            height: { ideal: capabilities.height?.max ?? 1080 },
            advanced,
          })
          .catch(() => undefined);
      }
      streamRef.current = next;
      setCameraReady(false);
      setStream(next);
    } catch {
      setError(t.cameraBlocked);
      cameraInputRef.current?.click();
    }
  }

  async function takePhoto() {
    const track = streamRef.current?.getVideoTracks()[0];
    const ImageCaptureCtor = (window as unknown as { ImageCapture?: new (track: MediaStreamTrack) => PhotoCapture }).ImageCapture;
    if (track && ImageCaptureCtor) {
      try {
        const capture = new ImageCaptureCtor(track);
        const caps: PhotoCapabilities = await capture.getPhotoCapabilities().catch(() => ({}));
        const blob = await capture.takePhoto(
          caps.imageWidth?.max && caps.imageHeight?.max
            ? { imageWidth: caps.imageWidth.max, imageHeight: caps.imageHeight.max }
            : undefined,
        );
        if (blob.size > 0) {
          showPhoto(blob);
          return;
        }
      } catch {
        /* The video frame is the fallback when the camera cannot take a still. */
      }
    }
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
    if (!blob) return;
    showPhoto(blob);
  }

  async function readPhoto() {
    const file = photoFileRef.current;
    if (!file) return;
    setError("");
    setPhase("preparing");
    setProgress(0);
    try {
      const reading = await readDocumentImage(file, (status, value) => {
        setPhase(status);
        setProgress(value);
      });
      if (!reading.text) {
        setText("");
        setMatches(null);
        setError(t.scanUnclear);
        return;
      }
      setText(reading.text);
      const catalog = await searchMedications("", coords);
      setMatches(matchPrescription(reading.text, catalog));
    } catch {
      setError(t.scanFailed);
      setMatches(null);
    } finally {
      setPhase(null);
    }
  }

  function findFromText() {
    setError("");
    searchMedications("", coords)
      .then((catalog) => setMatches(matchPrescription(text, catalog)))
      .catch(() => setError(t.scanFailed));
  }

  const busy = phase !== null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 inline-flex items-center gap-2 text-sm text-emerald-300">
        <ScanLine className="h-4 w-4" />
        {t.scanPrescription}
      </div>
      <h1 className="text-3xl font-bold text-white">{t.scanTitle}</h1>
      <p className="mt-3 text-white/80">{t.scanLead}</p>
      <p className="mt-2 text-sm text-white/60">{t.scanPrivacy}</p>

      <div
        className="relative mt-8 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) showPhoto(file);
        }}
      >
        {stream ? (
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full bg-black object-contain"
            playsInline
            muted
            autoPlay
            aria-label={t.scanTitle}
            onLoadedMetadata={() => setCameraReady(true)}
          />
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={t.scanTitle} className="max-h-[70vh] w-full object-contain bg-black" />
        ) : (
          <div className="grid min-h-56 place-items-center px-6 py-16 text-center text-white/70">
            <p>{t.scanDrop}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {stream ? (
          <>
            <Button type="button" onClick={() => void takePhoto()} disabled={!cameraReady} className="px-5">
              <Camera className="h-4 w-4" />
              {t.takePhoto}
            </Button>
            <Button type="button" variant="secondary" onClick={stopCamera}>
              {t.closeCamera}
            </Button>
            <p className="w-full text-sm text-white/70">{t.scanFrame}</p>
          </>
        ) : (
          <>
            <Button type="button" onClick={() => void openCamera()} disabled={busy}>
              <Camera className="h-4 w-4" />
              {photoUrl ? t.retakePhoto : t.openCamera}
            </Button>
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              <ImagePlus className="h-4 w-4" />
              {t.choosePhoto}
            </Button>
            {photoUrl ? (
              <Button type="button" variant="inverse" onClick={() => void readPhoto()} busy={busy}>
                {phase === "reading" ? t.readingDocument : phase === "preparing" ? t.preparingReader : t.readDocument}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) showPhoto(file);
          event.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) showPhoto(file);
          event.target.value = "";
        }}
      />

      {busy ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-emerald-400 transition-all"
            style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}

      {text || matches ? (
        <div className="mt-10">
          <label className="block text-sm font-semibold text-white" htmlFor="detected-text">
            {t.detectedText}
          </label>
          <p className="mt-1 text-sm text-white/60">{t.scanHint}</p>
          <textarea
            id="detected-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          />
          <Button type="button" variant="secondary" className="mt-3" onClick={findFromText} disabled={busy || !text.trim()}>
            {t.findFromText}
          </Button>
        </div>
      ) : null}

      {matches ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-white">{t.medicationsFound}</h2>
          {matches.length === 0 ? <p className="mt-4 text-white/70">{t.scanNoMatch}</p> : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {matches.map((hit) => (
              <MedicationCard key={hit.id} hit={hit} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
