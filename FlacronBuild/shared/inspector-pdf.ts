/**
 * Inspector PDF layout matching the app's client pdf-generator (addBrandingPage + addInspectorReport).
 * Uses project (form) data for all sections. Safe to run in Node (no Firebase/localStorage).
 */

import type { jsPDF } from 'jspdf';

const LABELS: Record<string, string> = {
  professional_inspector_report: 'PROFESSIONAL INSPECTOR REPORT',
  inspector_certification: 'INSPECTOR CERTIFICATION',
  inspector: 'Inspector:',
  license: 'License:',
  contact: 'Contact:',
  inspection_details: 'INSPECTION DETAILS',
  date: 'Date:',
  weather_conditions: 'Weather Conditions:',
  property_location: 'PROPERTY LOCATION',
  address: 'Address:',
  structure_analysis: 'STRUCTURE ANALYSIS',
  type: 'Type:',
  roof_pitch: 'Roof pitch:',
  age: 'Age:',
  years: 'years',
  materials: 'Materials:',
  slope_by_slope_conditions: 'SLOPE-BY-SLOPE CONDITIONS',
  slope: 'Slope',
  damage_type: 'Damage type:',
  severity: 'Severity:',
  description: 'Description:',
  no_description: 'No description',
  no_slope_damage: 'No slope damage reported',
  roofing_components_assessment: 'ROOFING COMPONENTS ASSESSMENT',
  felt: 'Felt:',
  ice_water_shield: 'Ice/water shield:',
  drip_edge: 'Drip edge:',
  gutter_apron: 'Gutter apron:',
  pipe_boots: 'Pipe boots:',
  fascia_condition: 'Fascia condition:',
  gutter_condition: 'Gutter condition:',
  inspector_notes_equipment: 'INSPECTOR NOTES & EQUIPMENT',
  equipment_used: 'Equipment used:',
  owner_notes: 'Owner notes:',
  not_specified: 'Not specified',
  none_specified: 'None specified',
  none_provided: 'None provided',
  present: 'Present',
  not_present: 'Not present',
  inspector_name_not_provided: 'Inspector name not provided',
  license_not_provided: 'License not provided',
  contact_info_not_provided: 'Contact info not provided',
  date_not_provided: 'Date not provided',
  weather_not_specified: 'Weather not specified',
  location_not_provided: 'Location not provided',
};

function t(key: string): string {
  return LABELS[key] ?? key;
}

export function addBrandingPage(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFillColor(33, 33, 33);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(255, 102, 0);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

  doc.saveGraphicsState?.();
  let gState: any;
  if (doc.setGState) {
    gState = (doc as any).GState?.({ opacity: 0.08 });
    if (gState) doc.setGState(gState);
    doc.setTextColor(255, 102, 0);
  } else {
    doc.setTextColor(255, 102, 0);
  }
  doc.setFontSize(48);
  doc.text('FLACRONBUILD', pageWidth / 2, pageHeight / 2, { angle: 35, align: 'center' });
  doc.restoreGraphicsState?.();

  doc.setFillColor(255, 255, 255);
  doc.rect(20, 35, pageWidth - 40, pageHeight - 70, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  const flacronText = 'FLACRON';
  const buildText = 'BUILD';
  const flacronWidth = doc.getTextWidth(flacronText);
  const buildWidth = doc.getTextWidth(buildText);
  const totalWidth = flacronWidth + buildWidth;
  const startX = (pageWidth - totalWidth) / 2;
  const logoY = 75;
  doc.setTextColor(33, 33, 33);
  doc.text(flacronText, startX, logoY);
  doc.setTextColor(255, 102, 0);
  doc.text(buildText, startX + flacronWidth, logoY);

  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(1.5);
  doc.line(pageWidth / 2 - 35, 85, pageWidth / 2 + 35, 85);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(255, 102, 0);
  doc.text('ESTIMATE SMARTER. BUILD BETTER.', pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Advanced Analytics • Market Intelligence • Precision Estimates', pageWidth / 2, 115, { align: 'center' });

  const servicesY = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text('PROFESSIONAL ROOFING INTELLIGENCE', pageWidth / 2, servicesY, { align: 'center' });

  const services = [
    'Professional Inspector Reports & Certifications',
    'Insurance Adjuster Claims Documentation',
    'Contractor Project Specifications & Estimates',
    'Homeowner-Friendly Explanations & Guidance',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  services.forEach((service, i) => {
    doc.text(service, pageWidth / 2, servicesY + 12 + i * 15, { align: 'center' });
  });

  const valueY = 210;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 102, 0);
  doc.text('TRUSTED BY INDUSTRY LEADERS', pageWidth / 2, valueY, { align: 'center' });

  const metrics = [
    { value: '95%', label: 'Accuracy Rate' },
    { value: '10,000+', label: 'Projects Analyzed' },
    { value: '$2B+', label: 'Total Project Value' },
    { value: '500+', label: 'Partner Contractors' },
  ];
  const spacing = pageWidth / 3;
  for (let i = 0; i < 2; i++) {
    const m = metrics[i];
    const xPos = spacing * (i + 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 102, 0);
    doc.text(m.value, xPos, valueY + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(m.label, xPos, valueY + 23, { align: 'center' });
  }
  for (let i = 2; i < 4; i++) {
    const m = metrics[i];
    const xPos = spacing * (i - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 102, 0);
    doc.text(m.value, xPos, valueY + 35, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(m.label, xPos, valueY + 43, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('© FlacronBuild', pageWidth / 2, pageHeight - 8, { align: 'center' });
}

export function buildInspectorPdfBuffer(doc: jsPDF, project: any): ArrayBuffer {
  addBrandingPage(doc);
  doc.addPage();
  addInspectorReport(doc, project);
  doc.addPage();
  addBrandingPage(doc);
  return doc.output('arraybuffer');
}

export function addInspectorReport(doc: jsPDF, project: any): void {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const minSpaceForSection = 90;
  let y = 20;
  let gState: any;

  doc.saveGraphicsState?.();
  if (doc.setGState) {
    gState = (doc as any).GState?.({ opacity: 0.08 });
    if (gState) doc.setGState(gState);
    doc.setTextColor(255, 102, 0);
  } else {
    doc.setTextColor(255, 102, 0);
  }
  doc.setFontSize(48);
  doc.text('FLACRONBUILD', 105, 148, { angle: 35, align: 'center' });
  doc.restoreGraphicsState?.();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(t('professional_inspector_report'), 20, y);
  doc.setTextColor(0, 0, 0);
  y += 10;
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(1);
  doc.line(20, y, 190, y);
  y += 15;

  const ensureSpace = () => {
    if (y > pageHeight - minSpaceForSection) {
      doc.addPage();
      y = 20;
      doc.saveGraphicsState?.();
      if (doc.setGState && gState) doc.setGState(gState);
      doc.setTextColor(255, 102, 0);
      doc.setFontSize(48);
      doc.text('FLACRONBUILD', 105, 148, { angle: 35, align: 'center' });
      doc.restoreGraphicsState?.();
      doc.setTextColor(0, 0, 0);
    }
  };

  // Inspector Certification
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('inspector_certification'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const inspectorName = project.inspectorInfo?.name ?? t('inspector_name_not_provided');
  const inspectorLicense = project.inspectorInfo?.license ?? t('license_not_provided');
  doc.text(`${t('inspector')} ${inspectorName}`, 20, y);
  y += 6;
  doc.text(`${t('license')} ${inspectorLicense}`, 20, y);
  y += 6;
  if (project.inspectorInfo?.contact?.trim()) {
    doc.text(`${t('contact')} ${project.inspectorInfo.contact.trim()}`, 20, y);
    y += 6;
  }
  y += 6;

  // Inspection Details
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('inspection_details'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const inspectionDate = project.inspectionDate ?? t('date_not_provided');
  const weatherConditions = project.weatherConditions ?? t('weather_not_specified');
  doc.text(`${t('date')} ${inspectionDate}`, 20, y);
  y += 6;
  doc.text(`${t('weather_conditions')} ${weatherConditions}`, 20, y);
  y += 12;

  // Property Location
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('property_location'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const location = project.location;
  if (location && typeof location === 'object') {
    doc.text(`${t('address')} ${location.city}, ${location.country} ${location.zipCode ?? location.zip ?? ''}`, 20, y);
  } else {
    doc.text(`${t('address')} ${location ?? t('location_not_provided')}`, 20, y);
  }
  y += 12;

  // Structure Analysis
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('structure_analysis'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t('type')} ${project.structureType ?? t('not_specified')}`, 20, y);
  y += 6;
  doc.text(`${t('roof_pitch')} ${project.roofPitch ?? t('not_specified')}`, 20, y);
  y += 6;
  doc.text(`${t('age')} ${project.roofAge ?? t('not_specified')} ${t('years')}`, 20, y);
  y += 6;
  const materialLayers = project.materialLayers?.join(', ') ?? t('not_specified');
  doc.text(`${t('materials')} ${materialLayers}`, 20, y, { maxWidth: 150 });
  y += 12;

  if (y > 250) {
    doc.addPage();
    y = 20;
    doc.saveGraphicsState?.();
    if (doc.setGState && gState) doc.setGState(gState);
    doc.setTextColor(255, 102, 0);
    doc.setFontSize(48);
    doc.text('FLACRONBUILD', 105, 148, { angle: 35, align: 'center' });
    doc.restoreGraphicsState?.();
    doc.setTextColor(0, 0, 0);
  }
  ensureSpace();

  // Slope-by-slope Conditions
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('slope_by_slope_conditions'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (project.slopeDamage?.length > 0) {
    project.slopeDamage.forEach((damage: any, index: number) => {
      doc.text(`${t('slope')} ${index + 1}: ${damage.slope ?? t('not_specified')}`, 20, y);
      y += 5;
      doc.text(`  ${t('damage_type')} ${damage.damageType ?? t('not_specified')}`, 25, y);
      y += 5;
      doc.text(`  ${t('severity')} ${damage.severity ?? t('not_specified')}`, 25, y);
      y += 5;
      doc.text(`  ${t('description')} ${damage.description ?? t('no_description')}`, 25, y, { maxWidth: 140 });
      y += 8;
    });
  } else {
    doc.text(t('no_slope_damage'), 20, y);
    y += 8;
  }
  y += 4;
  ensureSpace();

  // Roofing Components Assessment
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('roofing_components_assessment'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t('felt')} ${project.felt ?? t('not_specified')}`, 20, y);
  y += 6;
  doc.text(`${t('ice_water_shield')} ${project.iceWaterShield ? t('present') : t('not_present')}`, 20, y);
  y += 6;
  doc.text(`${t('drip_edge')} ${project.dripEdge ? t('present') : t('not_present')}`, 20, y);
  y += 6;
  doc.text(`${t('gutter_apron')} ${project.gutterApron ? t('present') : t('not_present')}`, 20, y);
  y += 6;
  if (project.pipeBoots?.length > 0) {
    const pipeBootsText = project.pipeBoots.map((b: any) => `${b.size} (${b.quantity})`).join(', ');
    doc.text(`${t('pipe_boots')} ${pipeBootsText}`, 20, y);
    y += 6;
  }
  if (project.fascia?.condition?.trim()) {
    doc.text(`${t('fascia_condition')} ${project.fascia.condition.trim()}`, 20, y);
    y += 6;
  }
  if (project.gutter?.condition?.trim()) {
    doc.text(`${t('gutter_condition')} ${project.gutter.condition.trim()}`, 20, y);
    y += 6;
  }
  y += 6;
  ensureSpace();

  // Inspector Notes & Equipment
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.text(t('inspector_notes_equipment'), margin + 5, y + 6);
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (project.accessTools?.length > 0) {
    doc.text(`${t('equipment_used')} ${project.accessTools.join(', ')}`, 20, y, { maxWidth: 150 });
    y += 8;
  } else {
    doc.text(`${t('equipment_used')} ${t('not_specified')}`, 20, y);
    y += 6;
  }
  if (project.ownerNotes) {
    doc.text(t('owner_notes'), 20, y);
    y += 6;
    const noteLines = doc.splitTextToSize(project.ownerNotes, 150);
    noteLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 5;
    });
  } else {
    doc.text(`${t('owner_notes')} ${t('none_provided')}`, 20, y);
  }
}
