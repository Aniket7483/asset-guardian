import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraOff, Camera } from "lucide-react";

/** Extracts the asset UUID from a scanned QR value (URL or raw id). */
export function parseScan(text: string): string | null {
  const trimmed = text.trim();
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(trimmed);
  if (uuid) return uuid[0];
  return null;
}

export function Scanner({
  onResult,
  label = "Point the camera at an asset QR code",
}: {
  onResult: (text: string) => void;
  label?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    return () => controlsRef.current?.stop();
  }, []);

  const start = async () => {
    setError(null);
    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result) => {
          if (result) onResult(result.getText());
        },
      );
      controlsRef.current = controls;
      setActive(true);
    } catch {
      setError("Camera unavailable. Allow camera access or enter the Asset ID manually.");
    }
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border bg-muted aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <Button onClick={start} size="sm">
              Start camera
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        {active ? (
          <Button variant="outline" size="sm" onClick={stop}>
            <CameraOff className="mr-1.5 h-4 w-4" /> Stop
          </Button>
        ) : null}
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) onResult(manual.trim());
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Or type Asset ID (e.g. AST-000001)"
            aria-label="Manual asset id"
          />
          <Button type="submit" variant="secondary">
            Find
          </Button>
        </form>
      </div>
    </div>
  );
}
