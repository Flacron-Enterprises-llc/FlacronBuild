/**
 * Generate an Inspector Report (professional roof inspection) and save to generated-reports/.
 * Outputs both .txt and .pdf.
 * Run with: npx tsx generate-inspector-report.ts
 * Requires OPENAI_API_KEY (or OPENAI_KEY) and optionally IBM_WATSONX_AI_API_KEY in .env.
 */

import 'dotenv/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { RealCostCalculator } from './server/cost-calculator.js';

const OUT_DIR = join(process.cwd(), 'generated-reports');

/** Build PDF using the same format as the app (branding page + inspector report + branding). */
async function buildInspectorPdf(project: any): Promise<ArrayBuffer> {
  const jspdfModule = await import('jspdf');
  const jsPDF = (jspdfModule as any).default ?? (jspdfModule as any).jsPDF;
  const doc = new jsPDF();
  const { buildInspectorPdfBuffer } = await import('./shared/inspector-pdf.js');
  return buildInspectorPdfBuffer(doc, project);
}

// Inspector project payload for report generation
const inspectorProject = {
  role: 'inspector',
  userRole: 'inspector',
  type: 'residential',
  area: 1500,
  location: {
    country: 'USA',
    state: 'Texas',
    city: 'Houston',
    zip: '77001',
    zipCode: '77001',
  },
  structureType: 'Single Family Home',
  roofPitch: 'Standard (4-7/12)',
  roofAge: 12,
  materials: { layers: ['Asphalt Shingles'], feltType: '15 lb' },
  materialLayers: ['Asphalt Shingles'],
  inspectorInfo: {
    name: 'Jane Smith',
    license: 'TX-RI-12345',
    contact: 'jane.smith@inspect.example.com',
  },
  inspectionDate: new Date().toISOString().split('T')[0],
  weatherConditions: 'Clear, 72°F',
  accessTools: ['Ladder', 'Drone', 'Moisture meter'],
  slopeDamage: [
    {
      slope: 'North main',
      damageType: 'Hail',
      severity: 'Moderate',
      description: 'Granule loss and bruising on shingles; no penetration.',
    },
    {
      slope: 'South main',
      damageType: 'Wind',
      severity: 'Light',
      description: 'Minor lifting at ridge; recommend sealing.',
    },
  ],
  ownerNotes: 'Owner reported leak in attic after last storm.',
  felt: '15 lb',
  iceWaterShield: false,
  dripEdge: true,
  gutterApron: true,
  pipeBoots: [],
  fascia: { condition: 'Good' },
  gutter: { condition: 'Fair – some rust' },
  preferredLanguage: 'English',
  preferredCurrency: 'USD',
};

function formatInspectorReport(estimate: any): string {
  const report = estimate?.report || estimate?.breakdown || {};
  const lines: string[] = [];

  lines.push('');
  lines.push('=====================================');
  lines.push('PROFESSIONAL INSPECTOR REPORT');
  lines.push('=====================================');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Data Source: ${estimate?.dataSource || 'OpenAI API'}`);
  lines.push('');

  // Inspector certification
  lines.push('=====================================');
  lines.push('INSPECTOR CERTIFICATION');
  lines.push('=====================================');
  lines.push(`Inspector: ${report.inspectorNameContact ?? 'Not provided'}`);
  lines.push(`Inspection Date/Time: ${report.inspectionDateTime ?? 'Not provided'}`);
  lines.push('');

  // Property location
  lines.push('=====================================');
  lines.push('PROPERTY LOCATION');
  lines.push('=====================================');
  lines.push(report.addressGpsCoordinates ?? 'Not provided');
  lines.push('');

  // Structure overview
  lines.push('=====================================');
  lines.push('STRUCTURE OVERVIEW');
  lines.push('=====================================');
  lines.push(report.structureOverview ?? 'Not provided');
  lines.push('');

  // Slope-by-slope conditions
  lines.push('=====================================');
  lines.push('SLOPE-BY-SLOPE CONDITIONS');
  lines.push('=====================================');
  const slopeTable = report.slopeConditionTable;
  if (Array.isArray(slopeTable) && slopeTable.length > 0) {
    slopeTable.forEach((entry: any, i: number) => {
      if (typeof entry === 'string') {
        lines.push(`${i + 1}. ${entry}`);
      } else {
        lines.push(`${i + 1}. ${JSON.stringify(entry)}`);
      }
    });
  } else {
    lines.push(slopeTable ?? 'No slope data provided.');
  }
  lines.push('');

  // Roofing components
  lines.push('=====================================');
  lines.push('ROOFING COMPONENTS ASSESSMENT');
  lines.push('=====================================');
  lines.push(report.roofingComponents ?? 'Not provided');
  lines.push('');

  // Inspector notes & equipment
  lines.push('=====================================');
  lines.push('INSPECTOR NOTES & EQUIPMENT');
  lines.push('=====================================');
  lines.push(report.inspectorNotesEquipment ?? 'Not provided');
  lines.push('');

  // Timeline & contingency
  lines.push('=====================================');
  lines.push('TIMELINE & RECOMMENDATIONS');
  lines.push('=====================================');
  lines.push(`Timeline: ${report.timeline ?? 'Not specified'}`);
  lines.push(`Contingency: ${report.contingencySuggestions ?? 'Standard recommendations'}`);
  lines.push('');

  // Cost breakdown (if present for inspector report)
  const totalCost = estimate?.totalCost ?? report.totalCost ?? report.costDetails?.totalCost;
  if (totalCost != null) {
    lines.push('=====================================');
    lines.push('COST BREAKDOWN');
    lines.push('=====================================');
    lines.push(`Total Cost:        $${Number(totalCost).toFixed(2)}`);
    const materials = estimate?.materialsCost ?? report.materialsCost ?? report.costDetails?.materialsCost;
    const labor = estimate?.laborCost ?? report.laborCost ?? report.costDetails?.laborCost;
    const permits = estimate?.permitsCost ?? report.permitsCost ?? report.costDetails?.permitsCost;
    const equipment = report.costEstimates?.equipment?.total ?? report.costDetails?.equipmentCost;
    const contingency = estimate?.contingencyCost ?? report.contingencyCost ?? report.costDetails?.contingencyCost;
    if (materials != null) lines.push(`Materials Cost:    $${Number(materials).toFixed(2)}`);
    if (labor != null) lines.push(`Labor Cost:        $${Number(labor).toFixed(2)}`);
    if (permits != null) lines.push(`Permits Cost:      $${Number(permits).toFixed(2)}`);
    if (equipment != null) lines.push(`Equipment Cost:    $${Number(equipment).toFixed(2)}`);
    if (contingency != null) lines.push(`Contingency:       $${Number(contingency).toFixed(2)}`);
    lines.push('');
  }

  // Annotated photographic evidence (if any)
  const photos = report.annotatedPhotographicEvidence;
  if (Array.isArray(photos) && photos.length > 0) {
    lines.push('=====================================');
    lines.push('ANNOTATED PHOTOGRAPHIC EVIDENCE');
    lines.push('=====================================');
    photos.forEach((p: any, i: number) => {
      lines.push(`${i + 1}. ${typeof p === 'string' ? p : JSON.stringify(p)}`);
    });
    lines.push('');
  }

  lines.push('=====================================');
  lines.push('FULL REPORT JSON');
  lines.push('=====================================');
  lines.push(JSON.stringify(report, null, 2));
  lines.push('');

  return lines.join('\n');
}

async function main() {
  console.log('Generating Inspector Report...');
  console.log('Project: inspector role, Houston TX, 1500 sq ft, sample slope damage.');
  console.log('');

  await mkdir(OUT_DIR, { recursive: true });

  const calculator = new RealCostCalculator();
  const estimate = await calculator.calculateRealCost(inspectorProject as any, []);

  const reportText = formatInspectorReport(estimate);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `inspector-report-${timestamp}.txt`;
  const filepath = join(OUT_DIR, filename);

  await writeFile(filepath, reportText, 'utf-8');
  console.log(`TXT report saved to ${filepath}`);

  const pdfFilename = `inspector-report-${timestamp}.pdf`;
  const pdfPath = join(OUT_DIR, pdfFilename);
  const pdfBuffer = await buildInspectorPdf(inspectorProject);
  await writeFile(pdfPath, Buffer.from(pdfBuffer));
  console.log(`PDF report saved to ${pdfPath}`);

  console.log('');
  console.log('Preview:');
  console.log(reportText.split('\n').slice(0, 45).join('\n'));
  console.log('...');
}

main().catch((err) => {
  console.error('Failed to generate inspector report:', err);
  process.exit(1);
});
