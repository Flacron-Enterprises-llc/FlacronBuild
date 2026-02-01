/**
 * Dev-only page to test inspector PDF generation and pagination.
 * Visit /test-inspector-pdf when running npm run dev to generate a sample PDF.
 */
import { useEffect, useState } from "react";
import { generatePDFReport } from "@/lib/pdf-generator";

const mockProject = {
  name: "PDF Pagination Test",
  userRole: "inspector" as const,
  preferredLanguage: "english",
  preferredCurrency: "USD",
  inspectorInfo: {
    name: "Jane Inspector",
    license: "LIC-12345",
    contact: "jane@example.com",
  },
  inspectionDate: "2025-01-15",
  weatherConditions: "Clear, 72°F",
  location: { city: "Test City", country: "USA", zipCode: "12345" },
  structureType: "Residential",
  roofPitch: "6/12",
  roofAge: "15",
  materialLayers: ["Asphalt shingles", "Felt"],
  slopeDamage: [
    { slope: "North", damageType: "Missing shingles", severity: "Moderate", description: "Several shingles missing along ridge." },
    { slope: "South", damageType: "Granule loss", severity: "Light", description: "Granule loss observed on south-facing slope." },
    { slope: "East", damageType: "Curling", severity: "Moderate", description: "Edge curling on multiple shingles." },
    { slope: "West", damageType: "Cracking", severity: "Severe", description: "Multiple cracks near chimney flashing." },
    { slope: "North-East", damageType: "Blisters", severity: "Light", description: "Minor blistering in a few areas." },
    { slope: "South-West", damageType: "Hail damage", severity: "Moderate", description: "Hail impact marks visible." },
  ],
  felt: "15 lb",
  iceWaterShield: true,
  dripEdge: true,
  gutterApron: true,
  pipeBoots: [{ size: "2 inch", quantity: 2 }],
  fascia: { condition: "Good" },
  gutter: { condition: "Fair" },
  accessTools: ["Ladder", "Drone", "Measuring tape", "Camera"],
  ownerNotes: "Owner reported leak in attic after last storm. Requested full inspection of all slopes and flashing. Please note any soft spots or previous repairs.",
};

const mockEstimate = {
  id: "test-1",
  totalCost: 12500,
  materialsCost: 7500,
  laborCost: 5000,
  createdAt: new Date().toISOString(),
  formInputData: { ...mockProject },
  openaiResponse: { metadata: {}, response: {} },
  report: {
    executiveSummary: "Test report summary.",
    annotatedPhotographicEvidence: [],
  },
};

export default function TestInspectorPdfPage() {
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "idle") return;
    setStatus("generating");
    setMessage("Generating inspector PDF with mock data...");
    (async () => {
      try {
        await generatePDFReport(mockProject, mockEstimate, { openInNewTab: false, username: "TestUser" });
        setStatus("done");
        setMessage("PDF generated and downloaded. Check your downloads folder. Verify that 'INSPECTOR NOTES & EQUIPMENT' is fully visible and not cut off.");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || String(e));
      }
    })();
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Inspector PDF Test</h1>
        {status === "generating" && <p className="text-gray-600">{message}</p>}
        {status === "done" && <p className="text-green-700">{message}</p>}
        {status === "error" && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}
