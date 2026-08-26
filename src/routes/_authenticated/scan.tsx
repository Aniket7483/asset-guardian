import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Scanner, parseScan } from "@/components/app/Scanner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "Scan Asset QR — AssetVault" },
      { name: "description", content: "Scan an asset QR label to open its full record instantly." },
      { property: "og:title", content: "Scan Asset QR — AssetVault" },
      { property: "og:description", content: "Scan an asset QR label to open its record." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Scan QR" description="Point the camera at an asset label, or paste the code manually." />
      <Card className="max-w-xl p-4">
        <Scanner
          onResult={(text) => {
            const id = parseScan(text);
            if (!id) {
              toast.error("Unrecognised code");
              return;
            }
            navigate({ to: "/assets/$id", params: { id } });
          }}
        />
      </Card>
    </div>
  );
}
