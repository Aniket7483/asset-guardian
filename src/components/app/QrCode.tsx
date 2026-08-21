import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode as QrIcon } from "lucide-react";

export function assetUrl(assetId: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/assets/${assetId}`;
}

export function useQrDataUrl(value: string, size = 220) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let active = true;
    if (!value) return;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" }).then((d) => {
      if (active) setUrl(d);
    });
    return () => {
      active = false;
    };
  }, [value, size]);
  return url;
}

export function downloadQr(dataUrl: string, code: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${code}-qr.png`;
  a.click();
}

export function printLabel(opts: {
  dataUrl: string;
  code: string;
  name: string;
  company?: string;
  extra?: string;
}) {
  const w = window.open("", "_blank", "width=480,height=640");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${opts.code}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;margin:0;padding:16px;}
    .label{width:320px;border:1.5px solid #111;border-radius:10px;padding:14px;display:flex;gap:14px;align-items:center;}
    .meta{flex:1;min-width:0}
    .company{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#555;margin-bottom:4px}
    .name{font-size:15px;font-weight:700;line-height:1.2;word-break:break-word}
    .code{font-family:ui-monospace,monospace;font-size:14px;margin-top:6px;font-weight:700}
    .extra{font-size:11px;color:#555;margin-top:4px}
    img{width:104px;height:104px}
    @media print{ body{padding:0} }
  </style></head><body>
  <div class="label">
    <img src="${opts.dataUrl}" alt="QR code for ${opts.code}" />
    <div class="meta">
      <div class="company">${opts.company ?? "AssetVault Office"}</div>
      <div class="name">${opts.name}</div>
      <div class="code">${opts.code}</div>
      ${opts.extra ? `<div class="extra">${opts.extra}</div>` : ""}
    </div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  w.document.close();
}

export function AssetQrPanel({
  assetId,
  code,
  name,
  extra,
}: {
  assetId: string;
  code: string;
  name: string;
  extra?: string;
}) {
  const value = assetUrl(assetId);
  const dataUrl = useQrDataUrl(value, 240);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border bg-card p-3">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for asset ${code}`} className="h-40 w-40" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center text-muted-foreground">
            <QrIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <p className="font-mono text-sm font-semibold">{code}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => downloadQr(dataUrl, code)}>
          <Download className="mr-1.5 h-4 w-4" /> Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => printLabel({ dataUrl, code, name, extra })}
        >
          <Printer className="mr-1.5 h-4 w-4" /> Print label
        </Button>
      </div>
      <p className="max-w-[16rem] break-all text-center text-[11px] text-muted-foreground">{value}</p>
    </div>
  );
}
