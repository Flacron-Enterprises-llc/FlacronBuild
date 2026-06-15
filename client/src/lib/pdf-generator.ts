import jsPDF from 'jspdf';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Utility function to sanitize data for Firebase (remove undefined values)
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirebase).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const sanitizedValue = sanitizeForFirebase(value);
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
    }
    return sanitized;
  }
  
  return obj;
}

function capitalizeWords(str: string | undefined | null): string {
  if (!str) return 'Not specified';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// Helper function to check if a field has meaningful data
function hasData(value: any): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

// Helper function to add a field conditionally to PDF
function addConditionalField(doc: jsPDF, label: string, value: any, margin: number, yPos: number, formatter?: (val: any) => string): number {
  if (!hasData(value)) return yPos;
  
  const displayValue = String(formatter ? formatter(value) : value);
  const pageWidth = doc.internal.pageSize.width;
  const valueX = margin + 50;
  const maxWidth = pageWidth - valueX - margin;

  doc.setFont('helvetica', 'bold');
  doc.text(label, margin, yPos);
  doc.setFont('helvetica', 'normal');

  // Wrap the value so it never overflows the right margin
  const lines = doc.splitTextToSize(displayValue, maxWidth);
  lines.forEach((line: string, i: number) => {
    if (i > 0 && yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, valueX, yPos);
    if (i < lines.length - 1) yPos += 5;
  });
  return yPos + 7;
}

// Helper to add a field with long text that wraps within page width (returns new yPos)
function addConditionalFieldWithWrap(doc: jsPDF, label: string, value: any, margin: number, yPos: number, pageWidth: number): number {
  if (!hasData(value)) return yPos;
  const str = String(value);
  doc.setFont('helvetica', 'bold');
  doc.text(label, margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const maxWidth = pageWidth - 2 * margin - 60;
  const lines = doc.splitTextToSize(str, maxWidth);
  lines.forEach((line: string) => {
    doc.text(line, margin + 10, yPos);
    yPos += 5;
  });
  return yPos + 2;
}

// ── Shared PDF section helpers ──────────────────────────────────────────────

/** Renders an orange section header bar and returns the new yPos. */
function addSectionHeader(doc: jsPDF, title: string, yPos: number, pageWidth: number, margin: number): number {
  if (yPos > doc.internal.pageSize.height - 30) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.text(title, margin + 5, yPos + 6);
  doc.setTextColor(0, 0, 0);
  return yPos + 15;
}

/** Renders a bold label + wrapped paragraph body. Returns new yPos. */
function addNarrative(doc: jsPDF, label: string, text: any, margin: number, yPos: number, pageWidth: number): number {
  const textStr = text != null ? String(text) : '';
  if (!textStr.trim()) return yPos;
  const maxWidth = pageWidth - 2 * margin;
  if (label) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, margin, yPos);
    yPos += 6;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(textStr.trim(), maxWidth - 10);
  lines.forEach((line: string) => {
    if (yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin + 5, yPos);
    yPos += 5;
  });
  return yPos + 4;
}

/** Renders a bullet list. Returns new yPos. */
function addBulletList(doc: jsPDF, label: string, items: string[], margin: number, yPos: number, pageWidth: number, color?: [number, number, number]): number {
  if (!items || items.length === 0) return yPos;
  const maxWidth = pageWidth - 2 * margin - 15;
  if (label) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, margin, yPos);
    yPos += 6;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  items.forEach((rawItem: any) => {
    const item = typeof rawItem === 'string' ? rawItem : (rawItem && typeof rawItem === 'object' ? JSON.stringify(rawItem) : String(rawItem ?? ''));
    if (!item.trim()) return;
    if (yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    if (color) doc.setTextColor(...color);
    const lines = doc.splitTextToSize(`• ${item.trim()}`, maxWidth);
    lines.forEach((line: string) => {
      doc.text(line, margin + 8, yPos);
      yPos += 5;
    });
    if (color) doc.setTextColor(0, 0, 0);
  });
  return yPos + 3;
}

/** Renders a two-column key:value row. Returns new yPos. */
function addKeyValue(doc: jsPDF, key: string, value: any, margin: number, yPos: number, pageWidth: number, keyWidth = 55): number {
  const valueStr = value != null ? String(value) : '';
  if (!valueStr.trim()) return yPos;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(key, margin, yPos);
  doc.setFont('helvetica', 'normal');
  const maxWidth = pageWidth - margin - keyWidth - 5;
  const lines = doc.splitTextToSize(valueStr.trim(), maxWidth);
  lines.forEach((line: string, i: number) => {
    if (i > 0 && yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin + keyWidth, yPos);
    if (i < lines.length - 1) yPos += 5;
  });
  return yPos + 7;
}

/** Adds a cost summary table. Returns new yPos. */
function addCostSummaryTable(doc: jsPDF, rows: { label: string; amount: number }[], total: number, currency: string, margin: number, yPos: number, pageWidth: number): number {
  const colRight = pageWidth - margin;
  doc.setFontSize(10);
  rows.forEach(row => {
    if (!row.amount) return;
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, margin + 5, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(row.amount, currency), colRight, yPos, { align: 'right' });
    yPos += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin + 5, yPos - 1, colRight, yPos - 1);
  });
  yPos += 2;
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL', margin + 5, yPos + 6);
  doc.text(formatCurrency(total, currency), colRight, yPos + 6, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  return yPos + 16;
}

// ─────────────────────────────────────────────────────────────────────────────
// Map weatherConditions enum to display label for Insurance/Inspector reports
function formatWeatherConditionsLabel(value: string | undefined): string {
  if (!value || typeof value !== 'string') return '';
  const map: Record<string, string> = {
    'clear-sunny': 'Clear and Sunny',
    'partly-cloudy': 'Partly Cloudy',
    'overcast': 'Overcast',
    'light-rain': 'Light Rain',
    'heavy-rain': 'Heavy Rain',
    'snow': 'Snow',
    'windy': 'Windy',
    'post-storm': 'Post-Storm',
  };
  return map[value] || value;
}

// Helper function to format currency based on user preference
// Assumes input amount is in USD and converts to target currency
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF'
  };
  
  // Currency conversion rates (as of 2024, relative to USD)
  const conversionRates: { [key: string]: number } = {
    'USD': 1.0,
    'EUR': 0.87,
    'GBP': 0.79,
    'CAD': 1.35,
    'AUD': 1.52,
    'JPY': 149.50,
    'CHF': 0.88
  };
  
  const symbol = currencySymbols[currency] || '$';
  const rate = conversionRates[currency] || 1.0;
  
  // Convert from USD to target currency
  const convertedAmount = amount * rate;
  
  // Format with appropriate decimal places
  if (currency === 'JPY') {
    // Japanese Yen doesn't use decimals
    return `${symbol}${Math.round(convertedAmount).toLocaleString()}`;
  } else {
    // Other currencies use 2 decimal places
    return `${symbol}${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// Helper function to get language-specific text
function getLocalizedText(key: string, language: string = 'english'): string {
  const translations: { [key: string]: { [lang: string]: string } } = {
    // Section Headers
    'project_info': {
      'english': 'Project Info',
      'spanish': 'Información del Proyecto',
      'french': 'Informations du Projet',
      'german': 'Projektinformationen',
      'italian': 'Informazioni del Progetto',
      'portuguese': 'Informações do Projeto',
      'chinese': '项目信息',
      'japanese': 'プロジェクト情報'
    },
    'structure_type': {
      'english': 'Structure Type',
      'spanish': 'Tipo de Estructura',
      'french': 'Type de Structure',
      'german': 'Strukturtyp',
      'italian': 'Tipo di Struttura',
      'portuguese': 'Tipo de Estrutura',
      'chinese': '结构类型',
      'japanese': '構造タイプ'
    },
    'roof_age': {
      'english': 'Roof Age',
      'spanish': 'Edad del Techo',
      'french': 'Âge du Toit',
      'german': 'Dachalter',
      'italian': 'Età del Tetto',
      'portuguese': 'Idade do Telhado',
      'chinese': '屋顶年龄',
      'japanese': '屋根の年齢'
    },
    'cost_estimates': {
      'english': 'COST ESTIMATES',
      'spanish': 'ESTIMACIONES DE COSTOS',
      'french': 'ESTIMATIONS DE COÛTS',
      'german': 'KOSTENSCHÄTZUNGEN',
      'italian': 'STIME DEI COSTI',
      'portuguese': 'ESTIMATIVAS DE CUSTOS',
      'chinese': '成本估算',
      'japanese': 'コスト見積もり'
    },
    'materials_cost': {
      'english': 'Materials Cost Breakdown:',
      'spanish': 'Desglose de Costos de Materiales:',
      'french': 'Répartition des Coûts de Matériaux:',
      'german': 'Materialkosten-Aufschlüsselung:',
      'italian': 'Ripartizione dei Costi dei Materiali:',
      'portuguese': 'Detalhamento dos Custos de Materiais:',
      'chinese': '材料成本明细:',
      'japanese': '材料費の内訳:'
    },
    'labor_cost': {
      'english': 'Labor Cost:',
      'spanish': 'Costo de Mano de Obra:',
      'french': 'Coût de la Main-d\'œuvre:',
      'german': 'Arbeitskosten:',
      'italian': 'Costo del Lavoro:',
      'portuguese': 'Custo da Mão de Obra:',
      'chinese': '人工成本:',
      'japanese': '人件費:'
    },
    'equipment_cost': {
      'english': 'Equipment Cost:',
      'spanish': 'Costo de Equipos:',
      'french': 'Coût de l\'Équipement:',
      'german': 'Ausrüstungskosten:',
      'italian': 'Costo dell\'Attrezzatura:',
      'portuguese': 'Custo do Equipamento:',
      'chinese': '设备成本:',
      'japanese': '設備費:'
    },
    'project_total': {
      'english': 'PROJECT TOTAL:',
      'spanish': 'TOTAL DEL PROYECTO:',
      'french': 'TOTAL DU PROJET:',
      'german': 'PROJEKTGESAMT:',
      'italian': 'TOTALE PROGETTO:',
      'portuguese': 'TOTAL DO PROJETO:',
      'chinese': '项目总计:',
      'japanese': 'プロジェクト合計:'
    },
    
    // Insurance Report Specific
    'claim_metadata': {
      'english': 'CLAIM METADATA',
      'spanish': 'METADATOS DE RECLAMO',
      'french': 'MÉTADONNÉES DE RÉCLAMATION',
      'german': 'ANSPRUCHS-METADATEN',
      'italian': 'METADATI DEL SINISTRO',
      'portuguese': 'METADADOS DA RECLAMAÇÃO',
      'chinese': '索赔元数据',
      'japanese': 'クレームメタデータ'
    },
    'claim_number': {
      'english': 'Claim Number:',
      'spanish': 'Número de Reclamo:',
      'french': 'Numéro de Réclamation:',
      'german': 'Anspruchsnummer:',
      'italian': 'Numero di Sinistro:',
      'portuguese': 'Número da Reclamação:',
      'chinese': '索赔编号:',
      'japanese': 'クレーム番号:'
    },
    'policyholder_name': {
      'english': 'Policyholder Name:',
      'spanish': 'Nombre del Asegurado:',
      'french': 'Nom de l\'Assuré:',
      'german': 'Versicherungsnehmer:',
      'italian': 'Nome dell\'Assicurato:',
      'portuguese': 'Nome do Segurado:',
      'chinese': '被保险人姓名:',
      'japanese': '被保険者名:'
    },
    'adjuster_name': {
      'english': 'Adjuster Name:',
      'spanish': 'Nombre del Ajustador:',
      'french': 'Nom de l\'Expert:',
      'german': 'Sachverständiger:',
      'italian': 'Nome del Perito:',
      'portuguese': 'Nome do Ajustador:',
      'chinese': '理算员姓名:',
      'japanese': '査定者名:'
    },
    'adjuster_contact': {
      'english': 'Adjuster Contact:',
      'spanish': 'Contacto del Ajustador:',
      'french': 'Contact de l\'Expert:',
      'german': 'Kontakt Sachverständiger:',
      'italian': 'Contatto del Perito:',
      'portuguese': 'Contato do Ajustador:',
      'chinese': '理算员联系方式:',
      'japanese': '査定者連絡先:'
    },
    'date_of_loss': {
      'english': 'Date of Loss:',
      'spanish': 'Fecha de Pérdida:',
      'french': 'Date de Perte:',
      'german': 'Schadensdatum:',
      'italian': 'Data del Danno:',
      'portuguese': 'Data da Perda:',
      'chinese': '损失日期:',
      'japanese': '損害発生日:'
    },
    'damage_cause': {
      'english': 'Damage Cause:',
      'spanish': 'Causa del Daño:',
      'french': 'Cause du Dommage:',
      'german': 'Schadensursache:',
      'italian': 'Causa del Danno:',
      'portuguese': 'Causa do Dano:',
      'chinese': '损害原因:',
      'japanese': '損害原因:'
    },
    'inspection_summary': {
      'english': 'INSPECTION SUMMARY',
      'spanish': 'RESUMEN DE INSPECCIÓN',
      'french': 'RÉSUMÉ D\'INSPECTION',
      'german': 'INSPEKTIONSZUSAMMENFASSUNG',
      'italian': 'RIEPILOGO ISPEZIONE',
      'portuguese': 'RESUMO DA INSPEÇÃO',
      'chinese': '检查摘要',
      'japanese': '検査サマリー'
    },
    'claim_types_handled': {
      'english': 'CLAIM TYPES HANDLED',
      'spanish': 'TIPOS DE RECLAMOS MANEJADOS',
      'french': 'TYPES DE RÉCLAMATIONS TRAITÉES',
      'german': 'BEHANDELTE ANSPRUCHSTYPEN',
      'italian': 'TIPI DI SINISTRI GESTITI',
      'portuguese': 'TIPOS DE RECLAMAÇÕES TRATADAS',
      'chinese': '处理的索赔类型',
      'japanese': '取り扱いクレームタイプ'
    },
    
    // Common Labels
    'rate_per_hour': {
      'english': 'Rate per Hour:',
      'spanish': 'Tarifa por Hora:',
      'french': 'Taux par Heure:',
      'german': 'Stundensatz:',
      'italian': 'Tariffa Oraria:',
      'portuguese': 'Taxa por Hora:',
      'chinese': '每小时费率:',
      'japanese': '時給:'
    },
    'total_hours': {
      'english': 'Total Hours:',
      'spanish': 'Horas Totales:',
      'french': 'Heures Totales:',
      'german': 'Gesamtstunden:',
      'italian': 'Ore Totali:',
      'portuguese': 'Horas Totais:',
      'chinese': '总小时数:',
      'japanese': '総時間:'
    },
    'total_materials_cost': {
      'english': 'Total Materials Cost:',
      'spanish': 'Costo Total de Materiales:',
      'french': 'Coût Total des Matériaux:',
      'german': 'Gesamtmaterialkosten:',
      'italian': 'Costo Totale Materiali:',
      'portuguese': 'Custo Total de Materiais:',
      'chinese': '材料总成本:',
      'japanese': '材料費合計:'
    },
    'total_labor_cost': {
      'english': 'Total Labor Cost:',
      'spanish': 'Costo Total de Mano de Obra:',
      'french': 'Coût Total de la Main-d\'œuvre:',
      'german': 'Gesamtarbeitskosten:',
      'italian': 'Costo Totale del Lavoro:',
      'portuguese': 'Custo Total da Mão de Obra:',
      'chinese': '人工总成本:',
      'japanese': '人件費合計:'
    },
    'total_equipment_cost': {
      'english': 'Total Equipment Cost:',
      'spanish': 'Costo Total de Equipos:',
      'french': 'Coût Total de l\'Équipement:',
      'german': 'Gesamtausrüstungskosten:',
      'italian': 'Costo Totale Attrezzatura:',
      'portuguese': 'Custo Total do Equipamento:',
      'chinese': '设备总成本:',
      'japanese': '設備費合計:'
    },
    
    // Homeowner Report Specific
    'budget_guidance': {
      'english': 'BUDGET GUIDANCE',
      'spanish': 'ORIENTACIÓN PRESUPUESTARIA',
      'french': 'CONSEILS BUDGÉTAIRES',
      'german': 'BUDGETBERATUNG',
      'italian': 'CONSIGLI BUDGET',
      'portuguese': 'ORIENTAÇÃO ORÇAMENTÁRIA',
      'chinese': '预算指导',
      'japanese': '予算ガイダンス'
    },
    'estimated_range': {
      'english': 'Estimated Range:',
      'spanish': 'Rango Estimado:',
      'french': 'Gamme Estimée:',
      'german': 'Geschätzter Bereich:',
      'italian': 'Gamma Stimata:',
      'portuguese': 'Faixa Estimada:',
      'chinese': '估算范围:',
      'japanese': '見積もり範囲:'
    },
    'repairs': {
      'english': 'Repairs:',
      'spanish': 'Reparaciones:',
      'french': 'Réparations:',
      'german': 'Reparaturen:',
      'italian': 'Riparazioni:',
      'portuguese': 'Reparos:',
      'chinese': '维修:',
      'japanese': '修理:'
    },
    'partial_replacement': {
      'english': 'Partial Replacement:',
      'spanish': 'Reemplazo Parcial:',
      'french': 'Remplacement Partiel:',
      'german': 'Teilerneuerung:',
      'italian': 'Sostituzione Parziale:',
      'portuguese': 'Substituição Parcial:',
      'chinese': '部分更换:',
      'japanese': '部分交換:'
    },
    'full_replacement': {
      'english': 'Full Replacement:',
      'spanish': 'Reemplazo Completo:',
      'french': 'Remplacement Complet:',
      'german': 'Vollständige Erneuerung:',
      'italian': 'Sostituzione Completa:',
      'portuguese': 'Substituição Completa:',
      'chinese': '完全更换:',
      'japanese': '完全交換:'
    },
    'financing_options': {
      'english': 'Financing Options:',
      'spanish': 'Opciones de Financiamiento:',
      'french': 'Options de Financement:',
      'german': 'Finanzierungsoptionen:',
      'italian': 'Opzioni di Finanziamento:',
      'portuguese': 'Opções de Financiamento:',
      'chinese': '融资选择:',
      'japanese': '資金調達オプション:'
    },
    'home_improvement_loans': {
      'english': 'Home improvement loans',
      'spanish': 'Préstamos para mejoras del hogar',
      'french': 'Prêts d\'amélioration de l\'habitat',
      'german': 'Modernisierungsdarlehen',
      'italian': 'Prestiti per miglioramenti domestici',
      'portuguese': 'Empréstimos para melhorias domésticas',
      'chinese': '房屋改善贷款',
      'japanese': '住宅改善ローン'
    },
    'insurance_claims': {
      'english': 'Insurance claims (if applicable)',
      'spanish': 'Reclamos de seguros (si aplica)',
      'french': 'Réclamations d\'assurance (si applicable)',
      'german': 'Versicherungsansprüche (falls zutreffend)',
      'italian': 'Reclami assicurativi (se applicabile)',
      'portuguese': 'Reclamações de seguro (se aplicável)',
      'chinese': '保险索赔（如适用）',
      'japanese': '保険請求（該当する場合）'
    },
    'contractor_payment_plans': {
      'english': 'Contractor payment plans',
      'spanish': 'Planes de pago del contratista',
      'french': 'Plans de paiement du contractant',
      'german': 'Zahlungspläne des Auftragnehmers',
      'italian': 'Piani di pagamento del contraente',
      'portuguese': 'Planos de pagamento do contratante',
      'chinese': '承包商付款计划',
      'japanese': '請負業者支払いプラン'
    },
    'home_equity_line': {
      'english': 'Home equity line of credit',
      'spanish': 'Línea de crédito con garantía hipotecaria',
      'french': 'Ligne de crédit sur valeur domiciliaire',
      'german': 'Eigenheimkreditlinie',
      'italian': 'Linea di credito su valore della casa',
      'portuguese': 'Linha de crédito com garantia imobiliária',
      'chinese': '房屋净值信贷额度',
      'japanese': 'ホームエクイティローン'
    },
    
    // Contractor Report Specific
    'contractor_project_report': {
      'english': 'CONTRACTOR PROJECT REPORT',
      'spanish': 'INFORME DE PROYECTO DEL CONTRATISTA',
      'french': 'RAPPORT DE PROJET DU CONTRACTANT',
      'german': 'AUSSCHREIBUNGSBERICHT',
      'italian': 'RAPPORTO PROGETTO APPALTATORE',
      'portuguese': 'RELATÓRIO DO PROJETO DO CONTRATANTE',
      'chinese': '承包商项目报告',
      'japanese': '請負業者プロジェクトレポート'
    },
    'project_details': {
      'english': 'PROJECT DETAILS',
      'spanish': 'DETALLES DEL PROYECTO',
      'french': 'DÉTAILS DU PROJET',
      'german': 'PROJEKTDETAILS',
      'italian': 'DETTAGLI DEL PROGETTO',
      'portuguese': 'DETALHES DO PROJETO',
      'chinese': '项目详情',
      'japanese': 'プロジェクト詳細'
    },
    'project_address': {
      'english': 'Project Address:',
      'spanish': 'Dirección del Proyecto:',
      'french': 'Adresse du Projet:',
      'german': 'Projektadresse:',
      'italian': 'Indirizzo del Progetto:',
      'portuguese': 'Endereço do Projeto:',
      'chinese': '项目地址:',
      'japanese': 'プロジェクト住所:'
    },
    'project_type': {
      'english': 'Project Type:',
      'spanish': 'Tipo de Proyecto:',
      'french': 'Type de Projet:',
      'german': 'Projekttyp:',
      'italian': 'Tipo di Progetto:',
      'portuguese': 'Tipo de Projeto:',
      'chinese': '项目类型:',
      'japanese': 'プロジェクトタイプ:'
    },
    'job_type': {
      'english': 'Job Type:',
      'spanish': 'Tipo de Trabajo:',
      'french': 'Type de Travail:',
      'german': 'Auftragstyp:',
      'italian': 'Tipo di Lavoro:',
      'portuguese': 'Tipo de Trabalho:',
      'chinese': '工作类型:',
      'japanese': '作業タイプ:'
    },
    'material_preference': {
      'english': 'Material Preference:',
      'spanish': 'Preferencia de Material:',
      'french': 'Préférence de Matériau:',
      'german': 'Materialpräferenz:',
      'italian': 'Preferenza Materiale:',
      'portuguese': 'Preferência de Material:',
      'chinese': '材料偏好:',
      'japanese': '材料の好み:'
    },
    'total_area': {
      'english': 'Total Area:',
      'spanish': 'Área Total:',
      'french': 'Superficie Totale:',
      'german': 'Gesamtfläche:',
      'italian': 'Area Totale:',
      'portuguese': 'Área Total:',
      'chinese': '总面积:',
      'japanese': '総面積:'
    },
    'roof_pitch': {
      'english': 'Roof Pitch:',
      'spanish': 'Pendiente del Techo:',
      'french': 'Pente du Toit:',
      'german': 'Dachneigung:',
      'italian': 'Pendenza del Tetto:',
      'portuguese': 'Inclinação do Telhado:',
      'chinese': '屋顶坡度:',
      'japanese': '屋根の勾配:'
    },
    'existing_materials': {
      'english': 'Existing Materials:',
      'spanish': 'Materiales Existentes:',
      'french': 'Matériaux Existants:',
      'german': 'Vorhandene Materialien:',
      'italian': 'Materiali Esistenti:',
      'portuguese': 'Materiais Existentes:',
      'chinese': '现有材料:',
      'japanese': '既存材料:'
    },
    'local_permit_required': {
      'english': 'Local Permit Required:',
      'spanish': 'Permiso Local Requerido:',
      'french': 'Permis Local Requis:',
      'german': 'Lokale Genehmigung Erforderlich:',
      'italian': 'Permesso Locale Richiesto:',
      'portuguese': 'Permissão Local Necessária:',
      'chinese': '需要当地许可:',
      'japanese': '地元許可が必要:'
    },
    'scope_of_work': {
      'english': 'SCOPE OF WORK',
      'spanish': 'ALCANCE DEL TRABAJO',
      'french': 'PORTÉE DU TRAVAIL',
      'german': 'ARBEITSUMFANG',
      'italian': 'AMBITO DEL LAVORO',
      'portuguese': 'ESCOPO DO TRABALHO',
      'chinese': '工作范围',
      'japanese': '作業範囲'
    },
    'preparation_tasks': {
      'english': 'Preparation Tasks:',
      'spanish': 'Tareas de Preparación:',
      'french': 'Tâches de Préparation:',
      'german': 'Vorbereitungsaufgaben:',
      'italian': 'Compiti di Preparazione:',
      'portuguese': 'Tarefas de Preparação:',
      'chinese': '准备工作:',
      'japanese': '準備作業:'
    },
    'removal_tasks': {
      'english': 'Removal Tasks:',
      'spanish': 'Tareas de Remoción:',
      'french': 'Tâches de Suppression:',
      'german': 'Entfernungsaufgaben:',
      'italian': 'Compiti di Rimozione:',
      'portuguese': 'Tarefas de Remoção:',
      'chinese': '拆除工作:',
      'japanese': '撤去作業:'
    },
    'installation_tasks': {
      'english': 'Installation Tasks:',
      'spanish': 'Tareas de Instalación:',
      'french': 'Tâches d\'Installation:',
      'german': 'Installationsaufgaben:',
      'italian': 'Compiti di Installazione:',
      'portuguese': 'Tarefas de Instalação:',
      'chinese': '安装工作:',
      'japanese': '設置作業:'
    },
    'finishing_tasks': {
      'english': 'Finishing Tasks:',
      'spanish': 'Tareas de Acabado:',
      'french': 'Tâches de Finition:',
      'german': 'Abschlussaufgaben:',
      'italian': 'Compiti di Finitura:',
      'portuguese': 'Tarefas de Acabamento:',
      'chinese': '收尾工作:',
      'japanese': '仕上げ作業:'
    },
    'labor_equipment': {
      'english': 'LABOR & EQUIPMENT',
      'spanish': 'MANO DE OBRA Y EQUIPOS',
      'french': 'MAIN-D\'ŒUVRE ET ÉQUIPEMENT',
      'german': 'ARBEITSKRAFT & AUSRÜSTUNG',
      'italian': 'MANODOPERA E ATTREZZATURE',
      'portuguese': 'MÃO DE OBRA E EQUIPAMENTOS',
      'chinese': '人工和设备',
      'japanese': '労働力と設備'
    },
    'crew_size': {
      'english': 'Crew Size:',
      'spanish': 'Tamaño de la Tripulación:',
      'french': 'Taille de l\'Équipe:',
      'german': 'Mannschaftsgröße:',
      'italian': 'Dimensione della Squadra:',
      'portuguese': 'Tamanho da Equipe:',
      'chinese': '团队规模:',
      'japanese': 'クルーサイズ:'
    },
    'estimated_days': {
      'english': 'Estimated Days:',
      'spanish': 'Días Estimados:',
      'french': 'Jours Estimés:',
      'german': 'Geschätzte Tage:',
      'italian': 'Giorni Stimati:',
      'portuguese': 'Dias Estimados:',
      'chinese': '预计天数:',
      'japanese': '見積もり日数:'
    },
    'steep_assist': {
      'english': 'Steep Assist:',
      'spanish': 'Asistencia en Pendientes:',
      'french': 'Assistance Raide:',
      'german': 'Steile Unterstützung:',
      'italian': 'Assistenza Ripida:',
      'portuguese': 'Assistência Íngreme:',
      'chinese': '陡坡辅助:',
      'japanese': '急勾配サポート:'
    },
    'special_equipment': {
      'english': 'Special Equipment:',
      'spanish': 'Equipos Especiales:',
      'french': 'Équipement Spécial:',
      'german': 'Spezialausrüstung:',
      'italian': 'Attrezzature Speciali:',
      'portuguese': 'Equipamentos Especiais:',
      'chinese': '特殊设备:',
      'japanese': '特殊機器:'
    },
    'safety_requirements': {
      'english': 'Safety Requirements:',
      'spanish': 'Requisitos de Seguridad:',
      'french': 'Exigences de Sécurité:',
      'german': 'Sicherheitsanforderungen:',
      'italian': 'Requisiti di Sicurezza:',
      'portuguese': 'Requisitos de Segurança:',
      'chinese': '安全要求:',
      'japanese': '安全要件:'
    },
    'material_breakdown': {
      'english': 'MATERIAL BREAKDOWN',
      'spanish': 'DESGLOSE DE MATERIALES',
      'french': 'RÉPARTITION DES MATÉRIAUX',
      'german': 'MATERIALAUFSCHLÜSSELUNG',
      'italian': 'RIPARTIZIONE MATERIALI',
      'portuguese': 'DETALHAMENTO DE MATERIAIS',
      'chinese': '材料明细',
      'japanese': '材料内訳'
    },
    'item': {
      'english': 'Item',
      'spanish': 'Artículo',
      'french': 'Article',
      'german': 'Artikel',
      'italian': 'Articolo',
      'portuguese': 'Item',
      'chinese': '项目',
      'japanese': '項目'
    },
    'qty': {
      'english': 'Qty',
      'spanish': 'Cant',
      'french': 'Qté',
      'german': 'Anz',
      'italian': 'Qtà',
      'portuguese': 'Qtd',
      'chinese': '数量',
      'japanese': '数量'
    },
    'unit': {
      'english': 'Unit',
      'spanish': 'Unidad',
      'french': 'Unité',
      'german': 'Einheit',
      'italian': 'Unità',
      'portuguese': 'Unidade',
      'chinese': '单位',
      'japanese': '単位'
    },
    'notes': {
      'english': 'Notes',
      'spanish': 'Notas',
      'french': 'Notes',
      'german': 'Notizen',
      'italian': 'Note',
      'portuguese': 'Notas',
      'chinese': '备注',
      'japanese': '備考'
    },
    'project_image': {
      'english': 'Project Image',
      'spanish': 'Imagen del Proyecto',
      'french': 'Image du Projet',
      'german': 'Projektbild',
      'italian': 'Immagine del Progetto',
      'portuguese': 'Imagem do Projeto',
      'chinese': '项目图片',
      'japanese': 'プロジェクト画像'
    },
    'repair_analysis': {
      'english': 'Repair Analysis',
      'spanish': 'Análisis de Reparación',
      'french': 'Analyse de Réparation',
      'german': 'Reparaturanalyse',
      'italian': 'Analisi di Riparazione',
      'portuguese': 'Análise de Reparo',
      'chinese': '维修分析',
      'japanese': '修理分析'
    },
    'contractor_analysis': {
      'english': 'Contractor Analysis & Repair Indicators:',
      'spanish': 'Análisis del Contratista e Indicadores de Reparación:',
      'french': 'Analyse du Contractant et Indicateurs de Réparation:',
      'german': 'Auftragnehmer-Analyse und Reparaturindikatoren:',
      'italian': 'Analisi del Contraente e Indicatori di Riparazione:',
      'portuguese': 'Análise do Contratante e Indicadores de Reparo:',
      'chinese': '承包商分析和维修指标:',
      'japanese': '請負業者分析と修理指標:'
    },
    
    // Inspector Report Specific
    'professional_inspector_report': {
      'english': 'PROFESSIONAL INSPECTOR REPORT',
      'spanish': 'INFORME DEL INSPECTOR PROFESIONAL',
      'french': 'RAPPORT D\'INSPECTEUR PROFESSIONNEL',
      'german': 'PROFESSIONELLER INSPEKTIONSBERICHT',
      'italian': 'RAPPORTO ISPETTORE PROFESSIONALE',
      'portuguese': 'RELATÓRIO DO INSPETOR PROFISSIONAL',
      'chinese': '专业检查员报告',
      'japanese': 'プロフェッショナル検査レポート'
    },
    'inspector_certification': {
      'english': 'INSPECTOR CERTIFICATION',
      'spanish': 'CERTIFICACIÓN DEL INSPECTOR',
      'french': 'CERTIFICATION DE L\'INSPECTEUR',
      'german': 'INSPEKTOR-ZERTIFIZIERUNG',
      'italian': 'CERTIFICAZIONE ISPETTORE',
      'portuguese': 'CERTIFICAÇÃO DO INSPETOR',
      'chinese': '检查员认证',
      'japanese': '検査員認定'
    },
    'inspector': {
      'english': 'Inspector:',
      'spanish': 'Inspector:',
      'french': 'Inspecteur:',
      'german': 'Inspektor:',
      'italian': 'Ispettore:',
      'portuguese': 'Inspetor:',
      'chinese': '检查员:',
      'japanese': '検査員:'
    },
    'license': {
      'english': 'License:',
      'spanish': 'Licencia:',
      'french': 'Licence:',
      'german': 'Lizenz:',
      'italian': 'Licenza:',
      'portuguese': 'Licença:',
      'chinese': '许可证:',
      'japanese': 'ライセンス:'
    },
    'contact': {
      'english': 'Contact:',
      'spanish': 'Contacto:',
      'french': 'Contact:',
      'german': 'Kontakt:',
      'italian': 'Contatto:',
      'portuguese': 'Contato:',
      'chinese': '联系方式:',
      'japanese': '連絡先:'
    },
    'inspection_details': {
      'english': 'INSPECTION DETAILS',
      'spanish': 'DETALLES DE INSPECCIÓN',
      'french': 'DÉTAILS D\'INSPECTION',
      'german': 'INSPEKTIONSDETAILS',
      'italian': 'DETTAGLI ISPEZIONE',
      'portuguese': 'DETALHES DA INSPEÇÃO',
      'chinese': '检查详情',
      'japanese': '検査詳細'
    },
    'date': {
      'english': 'Date:',
      'spanish': 'Fecha:',
      'french': 'Date:',
      'german': 'Datum:',
      'italian': 'Data:',
      'portuguese': 'Data:',
      'chinese': '日期:',
      'japanese': '日付:'
    },
    'weather_conditions': {
      'english': 'Weather Conditions:',
      'spanish': 'Condiciones Climáticas:',
      'french': 'Conditions Météorologiques:',
      'german': 'Wetterbedingungen:',
      'italian': 'Condizioni Meteorologiche:',
      'portuguese': 'Condições Climáticas:',
      'chinese': '天气条件:',
      'japanese': '気象条件:'
    },
    'property_location': {
      'english': 'PROPERTY LOCATION',
      'spanish': 'UBICACIÓN DE LA PROPIEDAD',
      'french': 'EMPLACEMENT DE LA PROPRIÉTÉ',
      'german': 'STANDORT DER IMMOBILLE',
      'italian': 'POSIZIONE DELLA PROPRIETÀ',
      'portuguese': 'LOCALIZAÇÃO DA PROPRIEDADE',
      'chinese': '物业位置',
      'japanese': '物件の場所'
    },
    'address': {
      'english': 'Address:',
      'spanish': 'Dirección:',
      'french': 'Adresse:',
      'german': 'Adresse:',
      'italian': 'Indirizzo:',
      'portuguese': 'Endereço:',
      'chinese': '地址:',
      'japanese': '住所:'
    },
    'structure_analysis': {
      'english': 'STRUCTURE ANALYSIS',
      'spanish': 'ANÁLISIS DE ESTRUCTURA',
      'french': 'ANALYSE DE STRUCTURE',
      'german': 'STRUKTURANALYSE',
      'italian': 'ANALISI STRUTTURALE',
      'portuguese': 'ANÁLISE ESTRUTURAL',
      'chinese': '结构分析',
      'japanese': '構造分析'
    },
    'type': {
      'english': 'Type:',
      'spanish': 'Tipo:',
      'french': 'Type:',
      'german': 'Typ:',
      'italian': 'Tipo:',
      'portuguese': 'Tipo:',
      'chinese': '类型:',
      'japanese': 'タイプ:'
    },
    'age': {
      'english': 'Age:',
      'spanish': 'Edad:',
      'french': 'Âge:',
      'german': 'Alter:',
      'italian': 'Età:',
      'portuguese': 'Idade:',
      'chinese': '年龄:',
      'japanese': '年齢:'
    },
    'years': {
      'english': 'years',
      'spanish': 'años',
      'french': 'ans',
      'german': 'Jahre',
      'italian': 'anni',
      'portuguese': 'anos',
      'chinese': '年',
      'japanese': '年'
    },
    'materials': {
      'english': 'Materials:',
      'spanish': 'Materiales:',
      'french': 'Matériaux:',
      'german': 'Materialien:',
      'italian': 'Materiali:',
      'portuguese': 'Materiais:',
      'chinese': '材料:',
      'japanese': '材料:'
    },
    'slope_by_slope_conditions': {
      'english': 'SLOPE-BY-SLOPE CONDITIONS',
      'spanish': 'CONDICIONES POR PENDIENTE',
      'french': 'CONDITIONS PAR PENTE',
      'german': 'BEDINGUNGEN NACH GEFÄLLE',
      'italian': 'CONDIZIONI PER PENDENZA',
      'portuguese': 'CONDIÇÕES POR INCLINAÇÃO',
      'chinese': '逐坡条件',
      'japanese': '勾配別条件'
    },
    'slope': {
      'english': 'Slope',
      'spanish': 'Pendiente',
      'french': 'Pente',
      'german': 'Gefälle',
      'italian': 'Pendenza',
      'portuguese': 'Inclinação',
      'chinese': '坡度',
      'japanese': '勾配'
    },
    'damage_type': {
      'english': 'Damage Type:',
      'spanish': 'Tipo de Daño:',
      'french': 'Type de Dommage:',
      'german': 'Schadenstyp:',
      'italian': 'Tipo di Danno:',
      'portuguese': 'Tipo de Dano:',
      'chinese': '损坏类型:',
      'japanese': '損傷タイプ:'
    },
    'severity': {
      'english': 'Severity:',
      'spanish': 'Severidad:',
      'french': 'Gravité:',
      'german': 'Schweregrad:',
      'italian': 'Gravità:',
      'portuguese': 'Severidade:',
      'chinese': '严重程度:',
      'japanese': '深刻度:'
    },
    'description': {
      'english': 'Description:',
      'spanish': 'Descripción:',
      'french': 'Description:',
      'german': 'Beschreibung:',
      'italian': 'Descrizione:',
      'portuguese': 'Descrição:',
      'chinese': '描述:',
      'japanese': '説明:'
    },
    'no_slope_damage': {
      'english': 'No slope damage reported',
      'spanish': 'No se reportó daño en pendientes',
      'french': 'Aucun dommage de pente signalé',
      'german': 'Keine Gefälleschäden gemeldet',
      'italian': 'Nessun danno alla pendenza segnalato',
      'portuguese': 'Nenhum dano de inclinação relatado',
      'chinese': '未报告坡度损坏',
      'japanese': '勾配の損傷は報告されていません'
    },
    'roofing_components_assessment': {
      'english': 'ROOFING COMPONENTS ASSESSMENT',
      'spanish': 'EVALUACIÓN DE COMPONENTES DEL TECHO',
      'french': 'ÉVALUATION DES COMPOSANTS DE TOITURE',
      'german': 'BEWERTUNG DER DACHKOMPONENTEN',
      'italian': 'VALUTAZIONE COMPONENTI COPERTURA',
      'portuguese': 'AVALIAÇÃO DOS COMPONENTES DO TELHADO',
      'chinese': '屋顶组件评估',
      'japanese': '屋根コンポーネント評価'
    },
    'felt': {
      'english': 'Felt:',
      'spanish': 'Fieltro:',
      'french': 'Feutre:',
      'german': 'Filz:',
      'italian': 'Feltro:',
      'portuguese': 'Feltro:',
      'chinese': '油毡:',
      'japanese': 'フェルト:'
    },
    'ice_water_shield': {
      'english': 'Ice/Water Shield:',
      'spanish': 'Escudo de Hielo/Agua:',
      'french': 'Bouclier Glace/Eau:',
      'german': 'Eis/Wasserschutz:',
      'italian': 'Barriera Ghiaccio/Acqua:',
      'portuguese': 'Escudo de Gelo/Água:',
      'chinese': '冰/水防护层:',
      'japanese': 'アイス/ウォーターシールド:'
    },
    'present': {
      'english': 'Present',
      'spanish': 'Presente',
      'french': 'Présent',
      'german': 'Vorhanden',
      'italian': 'Presente',
      'portuguese': 'Presente',
      'chinese': '存在',
      'japanese': '存在'
    },
    'not_present': {
      'english': 'Not present',
      'spanish': 'No presente',
      'french': 'Non présent',
      'german': 'Nicht vorhanden',
      'italian': 'Non presente',
      'portuguese': 'Não presente',
      'chinese': '不存在',
      'japanese': '存在しない'
    },
    'drip_edge': {
      'english': 'Drip Edge:',
      'spanish': 'Borde de Goteo:',
      'french': 'Bord de Gouttière:',
      'german': 'Tropfkante:',
      'italian': 'Bordo di Gocciolamento:',
      'portuguese': 'Borda de Gotejamento:',
      'chinese': '滴水边缘:',
      'japanese': 'ドリップエッジ:'
    },
    'gutter_apron': {
      'english': 'Gutter Apron:',
      'spanish': 'Delantal de Canalón:',
      'french': 'Tablier de Gouttière:',
      'german': 'Rinnenapron:',
      'italian': 'Grembiule Grondaia:',
      'portuguese': 'Avental de Calha:',
      'chinese': '天沟护板:',
      'japanese': 'ガターエプロン:'
    },
    'pipe_boots': {
      'english': 'Pipe Boots:',
      'spanish': 'Botas de Tubería:',
      'french': 'Manchons de Tuyau:',
      'german': 'Rohrstiefel:',
      'italian': 'Guarnizioni Tubo:',
      'portuguese': 'Botas de Tubo:',
      'chinese': '管道靴:',
      'japanese': 'パイプブーツ:'
    },
    'fascia_condition': {
      'english': 'Fascia Condition:',
      'spanish': 'Condición del Fascia:',
      'french': 'État du Fascia:',
      'german': 'Faszienszustand:',
      'italian': 'Condizione Fascia:',
      'portuguese': 'Condição do Fascia:',
      'chinese': '封檐板状况:',
      'japanese': 'ファシアの状態:'
    },
    'gutter_condition': {
      'english': 'Gutter Condition:',
      'spanish': 'Condición del Canalón:',
      'french': 'État de la Gouttière:',
      'german': 'Rinnenzustand:',
      'italian': 'Condizione Grondaia:',
      'portuguese': 'Condição da Calha:',
      'chinese': '天沟状况:',
      'japanese': 'ガターの状態:'
    },
    'inspector_notes_equipment': {
      'english': 'INSPECTOR NOTES & EQUIPMENT',
      'spanish': 'NOTAS Y EQUIPOS DEL INSPECTOR',
      'french': 'NOTES ET ÉQUIPEMENT DE L\'INSPECTEUR',
      'german': 'INSPEKTOR-NOTIZEN & AUSRÜSTUNG',
      'italian': 'NOTE E ATTREZZATURE ISPETTORE',
      'portuguese': 'NOTAS E EQUIPAMENTOS DO INSPETOR',
      'chinese': '检查员备注和设备',
      'japanese': '検査員のメモと機器'
    },
    'equipment_used': {
      'english': 'Equipment Used:',
      'spanish': 'Equipos Utilizados:',
      'french': 'Équipement Utilisé:',
      'german': 'Verwendete Ausrüstung:',
      'italian': 'Attrezzature Utilizzate:',
      'portuguese': 'Equipamentos Utilizados:',
      'chinese': '使用的设备:',
      'japanese': '使用機器:'
    },
    'owner_notes': {
      'english': 'Owner Notes:',
      'spanish': 'Notas del Propietario:',
      'french': 'Notes du Propriétaire:',
      'german': 'Notizen des Eigentümers:',
      'italian': 'Note del Proprietario:',
      'portuguese': 'Notas do Proprietário:',
      'chinese': '业主备注:',
      'japanese': '所有者のメモ:'
    },
    'photographic_evidence': {
      'english': 'PHOTOGRAPHIC EVIDENCE',
      'spanish': 'EVIDENCIA FOTOGRÁFICA',
      'french': 'PREUVE PHOTOGRAPHIQUE',
      'german': 'FOTOBEWEIS',
      'italian': 'PROVA FOTOGRAFICA',
      'portuguese': 'EVIDÊNCIA FOTOGRÁFICA',
      'chinese': '照片证据',
      'japanese': '写真証拠'
    },
    'not_specified': {
      'english': 'Not specified',
      'spanish': 'No especificado',
      'french': 'Non spécifié',
      'german': 'Nicht angegeben',
      'italian': 'Non specificato',
      'portuguese': 'Não especificado',
      'chinese': '未指定',
      'japanese': '指定なし'
    },
    'none_provided': {
      'english': 'None provided',
      'spanish': 'Ninguno proporcionado',
      'french': 'Aucun fourni',
      'german': 'Keine bereitgestellt',
      'italian': 'Nessuno fornito',
      'portuguese': 'Nenhum fornecido',
      'chinese': '未提供',
      'japanese': '提供なし'
    },
    'location_not_provided': {
      'english': 'Location not provided',
      'spanish': 'Ubicación no proporcionada',
      'french': 'Emplacement non fourni',
      'german': 'Standort nicht angegeben',
      'italian': 'Posizione non fornita',
      'portuguese': 'Localização não fornecida',
      'chinese': '未提供位置',
      'japanese': '場所が提供されていません'
    },
    'inspector_name_not_provided': {
      'english': 'Inspector name not provided',
      'spanish': 'Nombre del inspector no proporcionado',
      'french': 'Nom de l\'inspecteur non fourni',
      'german': 'Inspektorname nicht angegeben',
      'italian': 'Nome ispettore non fornito',
      'portuguese': 'Nome do inspetor não fornecido',
      'chinese': '未提供检查员姓名',
      'japanese': '検査員名が提供されていません'
    },
    'license_not_provided': {
      'english': 'License not provided',
      'spanish': 'Licencia no proporcionada',
      'french': 'Licence non fournie',
      'german': 'Lizenz nicht angegeben',
      'italian': 'Licenza non fornita',
      'portuguese': 'Licença não fornecida',
      'chinese': '未提供许可证',
      'japanese': 'ライセンスが提供されていません'
    },
    'contact_info_not_provided': {
      'english': 'Contact info not provided',
      'spanish': 'Información de contacto no proporcionada',
      'french': 'Informations de contact non fournies',
      'german': 'Kontaktinformationen nicht angegeben',
      'italian': 'Informazioni di contatto non fornite',
      'portuguese': 'Informações de contato não fornecidas',
      'chinese': '未提供联系信息',
      'japanese': '連絡先情報が提供されていません'
    },
    'date_not_provided': {
      'english': 'Date not provided',
      'spanish': 'Fecha no proporcionada',
      'french': 'Date non fournie',
      'german': 'Datum nicht angegeben',
      'italian': 'Data non fornita',
      'portuguese': 'Data não fornecida',
      'chinese': '未提供日期',
      'japanese': '日付が提供されていません'
    },
    'weather_not_specified': {
      'english': 'Weather not specified',
      'spanish': 'Clima no especificado',
      'french': 'Météo non spécifiée',
      'german': 'Wetter nicht angegeben',
      'italian': 'Meteo non specificata',
      'portuguese': 'Clima não especificado',
      'chinese': '未指定天气',
      'japanese': '天気が指定されていません'
    },
    'no_description': {
      'english': 'No description',
      'spanish': 'Sin descripción',
      'french': 'Aucune description',
      'german': 'Keine Beschreibung',
      'italian': 'Nessuna descrizione',
      'portuguese': 'Sem descrição',
      'chinese': '无描述',
      'japanese': '説明なし'
    },
    'none_specified': {
      'english': 'None specified',
      'spanish': 'Ninguno especificado',
      'french': 'Aucun spécifié',
      'german': 'Keine angegeben',
      'italian': 'Nessuno specificato',
      'portuguese': 'Nenhum especificado',
      'chinese': '未指定',
      'japanese': '指定なし'
    }
  };
  
  return translations[key]?.[language] || translations[key]?.['english'] || key;
}

function addInsuranceReport(doc: jsPDF, project: any, estimate: any) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 20;
  
  // Get user preferences
  const preferredLanguage = project.preferredLanguage || 'english';
  
  // Debug logging
  console.log('=== Insurance Report Data ===');
  console.log('Project:', project);
  console.log('Estimate:', estimate);
  console.log('Report:', estimate?.report);
  console.log('Language:', preferredLanguage);
  
  // Extract report data - handle both direct form data and OpenAI response
  const report = estimate?.report || {};
  const claimMetadata = report.claimMetadata || {
    claimNumber: project.claimNumber || 'Not provided',
    policyholder: project.policyholderName || 'Not provided',
    adjusterName: project.adjusterName || 'Not provided',
    adjusterContact: project.adjusterContact || 'Not provided',
    dateOfLoss: project.dateOfLoss || 'Not provided',
    dateOfInspection: new Date().toLocaleDateString()
  };
  
  const inspectionSummary = report.inspectionSummary || {
    propertyAddress: `${project.location?.city || ''}, ${project.location?.country || ''} ${project.location?.zipCode || ''}`,
    structureType: project.structureType,
    roofAge: `${project.roofAge} years`,
    roofPitch: project.roofPitch,
    existingMaterials: project.materialLayers?.join(', '),
    totalArea: `${project.area || 'Not specified'} sq ft`,
    weatherConditions: project.weatherConditions
  };
  
  const coverageTable = report.coverageTable || {
    coveredItems: project.coverageMapping?.covered || [],
    nonCoveredItems: project.coverageMapping?.excluded || [],
    maintenanceItems: project.coverageMapping?.maintenance || []
  };
  
  const stormDamageAssessment = report.stormDamageAssessment || {
    primaryDamageCause: project.damageCause,
    affectedComponents: project.materialLayers,
    damageExtent: project.slopeDamage
  };
  
  const damageClassifications = report.damageClassificationsTable || project.slopeDamage || [];
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text('INSURANCE CLAIM REPORT', pageWidth/2, yPos, { align: 'center' });
  yPos += 15;

  // Claim Metadata Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('claim_metadata', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  // Add metadata fields conditionally
  yPos = addConditionalField(doc, getLocalizedText('claim_number', preferredLanguage), claimMetadata.claimNumber, margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('policyholder_name', preferredLanguage), claimMetadata.policyholder, margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('adjuster_name', preferredLanguage), claimMetadata.adjusterName, margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('adjuster_contact', preferredLanguage), claimMetadata.adjusterContact, margin, yPos);
  yPos = addConditionalField(doc, 'Jurisdiction:', project.insuranceAdjusterInfo?.jurisdiction, margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('date_of_loss', preferredLanguage), project.dateOfLoss, margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('damage_cause', preferredLanguage), project.damageCause, margin, yPos);
  yPos = addConditionalField(doc, 'Date of Inspection:', claimMetadata.dateOfInspection || new Date().toLocaleDateString(), margin, yPos);
  yPos += 5;

  // Inspection Summary Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('inspection_summary', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Add inspection summary fields conditionally
  const propertyAddress = inspectionSummary.propertyAddress || 
    (project.location?.city ? `${project.location.city}, ${project.location.country || ''} ${project.location.zipCode || ''}`.trim() : null);
  yPos = addConditionalFieldWithWrap(doc, 'Property Address:', propertyAddress, margin, yPos, pageWidth);
  yPos = addConditionalField(doc, 'Structure Type:', inspectionSummary.structureType || project.structureType, margin, yPos);
  yPos = addConditionalField(doc, 'Roof Age:', inspectionSummary.roofAge || (project.roofAge ? `${project.roofAge} years` : null), margin, yPos);
  yPos = addConditionalField(doc, 'Roof Pitch:', inspectionSummary.roofPitch || project.roofPitch, margin, yPos);
  // Existing Materials: wrap long text so it stays within page bounds
  const existingMaterialsStr = inspectionSummary.existingMaterials || project.materialLayers?.join(', ') || '';
  yPos = addConditionalFieldWithWrap(doc, 'Existing Materials:', existingMaterialsStr, margin, yPos, pageWidth);
  yPos = addConditionalField(doc, 'Total Area:', inspectionSummary.totalArea || (project.area ? `${project.area} sq ft` : null), margin, yPos);
  // Weather Conditions: always show; use formatted label or "Not recorded" when empty
  const weatherRaw = inspectionSummary.weatherConditions || project.weatherConditions;
  const weatherDisplay = weatherRaw ? formatWeatherConditionsLabel(weatherRaw) : 'Not recorded';
  yPos = addConditionalField(doc, 'Weather Conditions:', weatherDisplay, margin, yPos);
  yPos += 5;

  // Claim Types Handled Section
  if (project.insuranceAdjusterInfo?.claimTypesHandled && project.insuranceAdjusterInfo.claimTypesHandled.length > 0) {
    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
    doc.text('CLAIM TYPES HANDLED', margin + 5, yPos + 6);
    yPos += 15;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    project.insuranceAdjusterInfo.claimTypesHandled.forEach((claimType: string) => {
      const lines = doc.splitTextToSize(`• ${String(claimType)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
    yPos += 5;
  }

  // Materials Section (Real Estate Calculator materials for Insurance Adjuster)
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('materials', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const feltLabel = preferredLanguage === 'english' ? 'Felt Type:' : getLocalizedText('felt', preferredLanguage);
  yPos = addConditionalField(doc, feltLabel, project.felt || getLocalizedText('none_specified', preferredLanguage), margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('ice_water_shield', preferredLanguage), project.iceWaterShield ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage), margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('drip_edge', preferredLanguage), project.dripEdge ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage), margin, yPos);
  yPos = addConditionalField(doc, getLocalizedText('gutter_apron', preferredLanguage), project.gutterApron ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage), margin, yPos);
  yPos += 5;

  // Coverage Table Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('COVERAGE ANALYSIS', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Covered Items
  doc.setFont('helvetica', 'bold');
  doc.text('Covered Items:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const coveredItems = coverageTable.coveredItems || project.coverageMapping?.covered || [];
  if (coveredItems.length > 0) {
    coveredItems.forEach((item: string) => {
      const lines = doc.splitTextToSize(`• ${String(item)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
  } else {
    doc.text('No covered items specified', margin + 10, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Non-Covered Items
  doc.setFont('helvetica', 'bold');
  doc.text('Non-Covered Items:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const nonCoveredItems = coverageTable.nonCoveredItems || project.coverageMapping?.excluded || [];
  if (nonCoveredItems.length > 0) {
    nonCoveredItems.forEach((item: string) => {
      const lines = doc.splitTextToSize(`• ${String(item)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
  } else {
    doc.text('No non-covered items specified', margin + 10, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Maintenance Items
  doc.setFont('helvetica', 'bold');
  doc.text('Maintenance Items:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const maintenanceItems = coverageTable.maintenanceItems || project.coverageMapping?.maintenance || [];
  if (maintenanceItems.length > 0) {
    maintenanceItems.forEach((item: string) => {
      const lines = doc.splitTextToSize(`• ${String(item)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
  } else {
    doc.text('No maintenance items specified', margin + 10, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Add new page for Storm Damage Assessment
  doc.addPage();
  yPos = 20;

  // Storm Damage Assessment Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('STORM DAMAGE ASSESSMENT', margin + 5, yPos + 6);
  yPos += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
  doc.text('Primary Damage Cause:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(stormDamageAssessment.primaryDamageCause || project.damageCause || 'Not provided', margin + 50, yPos);
  yPos += 10;

  // Affected Components
  doc.setFont('helvetica', 'bold');
  doc.text('Affected Components:', margin, yPos);
  yPos += 7;
    doc.setFont('helvetica', 'normal');
  const affectedComponents = stormDamageAssessment.affectedComponents || project.materialLayers || [];
  if (affectedComponents.length > 0) {
    affectedComponents.forEach((component: string) => {
      doc.text(`• ${component}`, margin + 10, yPos);
      yPos += 5;
    });
  } else {
    doc.text('No affected components specified', margin + 10, yPos);
    yPos += 5;
  }
  yPos += 10;

  // Only add Damage Classifications section if there is actual damage data
  const slopeDamageData = damageClassifications || project.slopeDamage || [];
  const validDamageData = slopeDamageData.filter((damage: any) => 
    damage.slope && 
    damage.damageType && 
    damage.severity && 
    damage.description &&
    damage.slope !== 'Not specified' &&
    damage.damageType !== 'Not specified' &&
    damage.severity !== 'Not specified' &&
    damage.description !== 'Not provided'
  );

  if (validDamageData.length > 0) {
    // Damage Classifications Section
    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
    doc.text('DAMAGE CLASSIFICATIONS', margin + 5, yPos + 6);
    yPos += 15;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    validDamageData.forEach((damage: any, index: number) => {
      // Slope Header
    doc.setFont('helvetica', 'bold');
      doc.text(`Slope: ${damage.slope}`, margin, yPos);
      yPos += 7;
    
      // Damage Details
    doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${capitalizeWords(damage.damageType)}`, margin + 10, yPos);
      yPos += 5;
      doc.text(`Severity: ${capitalizeWords(damage.severity)}`, margin + 10, yPos);
      yPos += 5;
      doc.text(`Description: ${damage.description}`, margin + 10, yPos);
      yPos += 10;

      // Add spacing between slopes
      if (index < validDamageData.length - 1) {
        yPos += 5;
      }

      // Check if we need a new page
      if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  // Legal/Certification Notes
  yPos += 10;
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('LEGAL CERTIFICATION', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const legalNotes = report.legalCertificationNotes || {};
    
    doc.setFont('helvetica', 'normal');
  const certificationText = legalNotes.certificationStatement || 
    `This report is prepared for insurance purposes by ${project.adjusterName || 'assigned adjuster'}, based on physical inspection and documentation review of the ${project.structureType} property located in ${project.location?.city || 'specified location'}.`;
  
  doc.text(certificationText, margin, yPos, { maxWidth: pageWidth - 2*margin });
  yPos += doc.splitTextToSize(certificationText, pageWidth - 2*margin).length * 5 + 10;

  // ── Property Condition Narrative (AI) ────────────────────────────────────
  const insReport = report as any;
  const propNarrative = insReport.inspectionSummary?.propertyConditionNarrative || '';
  if (propNarrative) {
    yPos = addSectionHeader(doc, 'PROPERTY CONDITION NARRATIVE', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', propNarrative, margin, yPos, pageWidth);
  }

  // ── Damage Cause & Extent Narratives (AI) ─────────────────────────────────
  const damageCauseNarrative = insReport.stormDamageAssessment?.damageCauseNarrative || '';
  const damageExtentNarrative = insReport.stormDamageAssessment?.damageExtentNarrative || '';
  const systemsNarrative = insReport.stormDamageAssessment?.impactedSystems?.systemsNarrative || '';
  if (damageCauseNarrative || damageExtentNarrative || systemsNarrative) {
    yPos = addSectionHeader(doc, 'DETAILED DAMAGE ANALYSIS', yPos, pageWidth, margin);
    if (damageCauseNarrative) yPos = addNarrative(doc, 'Cause of Damage:', damageCauseNarrative, margin, yPos, pageWidth);
    if (damageExtentNarrative) yPos = addNarrative(doc, 'Extent of Damage:', damageExtentNarrative, margin, yPos, pageWidth);
    if (systemsNarrative) yPos = addNarrative(doc, 'Impacted Systems Analysis:', systemsNarrative, margin, yPos, pageWidth);
  }

  // ── Coverage Analysis Narrative (AI) ──────────────────────────────────────
  const coverageNarrative = insReport.coverageTable?.coverageAnalysisNarrative || '';
  if (coverageNarrative) {
    yPos = addSectionHeader(doc, 'COVERAGE ANALYSIS NARRATIVE', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', coverageNarrative, margin, yPos, pageWidth);
  }

  // ── Repair History & Pre-Existing Conditions (AI) ─────────────────────────
  const repairHistory = insReport.repairHistory || {};
  const preExisting = repairHistory.preExistingConditionAnalysis || '';
  if (preExisting || repairHistory.previousRepairs) {
    yPos = addSectionHeader(doc, 'REPAIR HISTORY & PRE-EXISTING CONDITIONS', yPos, pageWidth, margin);
    if (repairHistory.previousRepairs) yPos = addNarrative(doc, 'Previous Repairs:', repairHistory.previousRepairs, margin, yPos, pageWidth);
    if (repairHistory.maintenanceRecords) yPos = addNarrative(doc, 'Maintenance Records:', repairHistory.maintenanceRecords, margin, yPos, pageWidth);
    if (preExisting) yPos = addNarrative(doc, 'Pre-Existing Condition Analysis:', preExisting, margin, yPos, pageWidth);
  }

  // ── Replacement Cost Estimate Narrative (AI) ──────────────────────────────
  const rcNarrative = insReport.replacementCostEstimateNarrative || '';
  if (rcNarrative) {
    yPos = addSectionHeader(doc, 'REPLACEMENT COST METHODOLOGY', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', rcNarrative, margin, yPos, pageWidth);
  }

  // ── Cost Summary ──────────────────────────────────────────────────────────
  const totalCost = typeof estimate?.totalCost === 'string' ? parseFloat(estimate.totalCost) : (estimate?.totalCost || 0);
  const materialsCost = typeof estimate?.materialsCost === 'string' ? parseFloat(estimate.materialsCost) : (estimate?.materialsCost || 0);
  const laborCost = typeof estimate?.laborCost === 'string' ? parseFloat(estimate.laborCost) : (estimate?.laborCost || 0);
  const permitsCost = typeof estimate?.permitsCost === 'string' ? parseFloat(estimate.permitsCost) : (estimate?.permitsCost || 0);
  const contingencyCost = typeof estimate?.contingencyCost === 'string' ? parseFloat(estimate.contingencyCost) : (estimate?.contingencyCost || 0);
  const insBaseCost = Math.max(0, materialsCost + laborCost + permitsCost);
  const insContingencyPct = insBaseCost > 0 ? ((contingencyCost / insBaseCost) * 100).toFixed(1) : '0.0';

  if (totalCost > 0) {
    yPos = addSectionHeader(doc, 'DETAILED COST BREAKDOWN', yPos, pageWidth, margin);
    const currency = project.preferredCurrency || 'USD';
    const pageHeight = doc.internal.pageSize.height;

    const aiCost = insReport.costEstimates || (estimate?.report as any)?.costEstimates || {};
    const materialItems = Array.isArray(aiCost?.materials?.breakdown) ? aiCost.materials.breakdown : [];
    const fallbackLineItems = Array.isArray(project?.lineItems) ? project.lineItems : [];
    const displayMaterialItems = materialItems.length > 0
      ? materialItems
      : (fallbackLineItems.length > 0
        ? fallbackLineItems.map((name: string) => ({ item: name, cost: materialsCost / fallbackLineItems.length }))
        : [{ item: 'Primary Roofing Materials', cost: materialsCost }]);
    const equipmentItems = Array.isArray(aiCost?.equipment?.items) ? aiCost.equipment.items : [];

    // Materials breakdown
    if (displayMaterialItems.length > 0 && materialsCost > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Materials Cost Breakdown', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      displayMaterialItems.forEach((item: any) => {
        if (yPos > pageHeight - 24) { doc.addPage(); yPos = 20; }
        const itemName = item?.item || item?.category || item?.name || 'Material';
        const itemCost = Number(item?.cost ?? item?.amount ?? 0);
        doc.text(itemName, margin + 4, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, currency), pageWidth - margin, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 2, yPos, pageWidth - margin, yPos);
      yPos += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Materials Subtotal:', margin + 4, yPos);
      doc.text(formatCurrency(materialsCost, currency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Labor breakdown
    if (laborCost > 0) {
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Labor Details', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const laborRate = Number(aiCost?.labor?.ratePerHour ?? 0);
      const laborHours = Number(aiCost?.labor?.totalHours ?? 0);
      if (laborRate > 0) {
        doc.text(`Rate per Hour: ${formatCurrency(laborRate, currency)}`, margin + 4, yPos);
        yPos += 5;
      }
      if (laborHours > 0) {
        doc.text(`Total Hours: ${laborHours}`, margin + 4, yPos);
        yPos += 5;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Labor Subtotal:', margin + 4, yPos);
      doc.text(formatCurrency(laborCost, currency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Equipment breakdown
    if (equipmentItems.length > 0) {
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Equipment Cost Breakdown', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      equipmentItems.forEach((item: any) => {
        if (yPos > pageHeight - 24) { doc.addPage(); yPos = 20; }
        const itemName = item?.item || 'Equipment';
        const itemCost = Number(item?.cost ?? 0);
        doc.text(itemName, margin + 4, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, currency), pageWidth - margin, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
      const equipTotal = equipmentItems.reduce((s: number, i: any) => s + Number(i?.cost ?? 0), 0);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 2, yPos, pageWidth - margin, yPos);
      yPos += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Equipment Subtotal:', margin + 4, yPos);
      doc.text(formatCurrency(equipTotal, currency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Permits & fees
    if (permitsCost > 0) {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Permits & Fees:', margin + 4, yPos);
      doc.text(formatCurrency(permitsCost, currency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Contingency & base subtotal
    if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Base Subtotal (Materials + Labor + Permits): ${formatCurrency(insBaseCost, currency)}`, margin + 4, yPos);
    yPos += 5;
    if (contingencyCost > 0) {
      doc.text(`Contingency (${insContingencyPct}%): ${formatCurrency(contingencyCost, currency)}`, margin + 4, yPos);
      yPos += 7;
    }
    doc.setFont('helvetica', 'normal');

    // Final summary table
    yPos = addCostSummaryTable(doc, [
      { label: 'Materials (Replacement Cost)', amount: materialsCost },
      { label: 'Labor', amount: laborCost },
      { label: 'Permits & Fees', amount: permitsCost },
      { label: `Contingency (${insContingencyPct}%)`, amount: contingencyCost },
    ], totalCost, currency, margin, yPos, pageWidth);
  }
}

function addInsuranceImagePages(doc: jsPDF, uploadedFiles: any[], report?: any) {
  // Get annotations from the report
  let annotations: string[] = [];
  if (report && report.annotatedPhotos) {
    annotations = report.annotatedPhotos;
  }
  
  uploadedFiles.forEach((imageFile, index) => {
    doc.addPage();
    
  let y = 20;
    
    // Page title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(`CLAIM EVIDENCE ${index + 1}`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
    doc.setDrawColor(255, 102, 0);
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 15;
    
    // Image annotation with insurance-specific focus
    doc.setFontSize(11);
    const annotation = annotations[index] || 'Insurance claim documentation photo - analysis pending';
    const annotationLines = doc.splitTextToSize(annotation, 150);
    annotationLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 10;
    
    // Add the actual image
    if (imageFile && imageFile.data) {
      try {
        const imgWidth = 150;
        const imgHeight = 100;
        doc.addImage(imageFile.data, 'JPEG', 20, y, imgWidth, imgHeight);
        y += imgHeight + 10;
        
        // Image details with insurance context
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Documentation: ${imageFile.name || 'Claim Photo'}`, 20, y);
  y += 4;
        doc.text(`File Reference: ${Math.round(imageFile.size / 1024)} KB`, 20, y);
        y += 4;
        doc.text('For Insurance Documentation Purposes Only', 20, y);
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.rect(20, y, 150, 100);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('[Image could not be loaded]', 25, y + 50);
      }
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(20, y, 150, 100);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('[No image available]', 25, y + 50);
    }
  });
}

interface MaterialItem {
  item: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface CostBreakdownItem {
  category: string;
  amount: number;
}

interface EquipmentItem {
  item: string;
  cost: number;
}

interface ContractorReport {
  projectDetails: {
    address: string;
    type: string;
    dimensions?: {
      totalArea?: number;
      pitch?: string;
      slopes?: number;
    };
  };
  scopeOfWork: {
    preparationTasks: string[];
    removalTasks: string[];
    installationTasks: string[];
    finishingTasks: string[];
  };
  laborRequirements: {
    crewSize?: string | number;
    estimatedDays?: number;
    specialEquipment: string[];
    safetyRequirements: string[];
  };
  materialBreakdown?: {
    lineItems: MaterialItem[];
  };
  costEstimates: {
    materials: {
      total: number;
      breakdown: CostBreakdownItem[];
    };
    labor: {
      total: number;
      ratePerHour: number;
      totalHours: number;
    };
    equipment: {
      total: number;
      items: EquipmentItem[];
    };
  };
}

function addContractorReport(doc: jsPDF, project: any, estimate: any) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 20;

  // Get user preferences
  const preferredLanguage = project.preferredLanguage || 'english';
  const preferredCurrency = project.preferredCurrency || 'USD';

  // Debug logging
  console.log('=== Contractor Report Data ===');
  console.log('Project:', project);
  console.log('Estimate:', estimate);
  console.log('Report:', estimate?.report);
  console.log('Language:', preferredLanguage, 'Currency:', preferredCurrency);

  // Extract report data with fallbacks to form data
  const report = (estimate?.report || {}) as ContractorReport;
  
  // Use form data as primary source, OpenAI data as enhancement
  const projectDetails = {
    address: `${project.location?.city || ''}, ${project.location?.country || ''} ${project.location?.zipCode || ''}`.trim() || 'Not specified',
    type: project.projectType || 'Not specified',
    dimensions: {
      totalArea: project.area || report.projectDetails?.dimensions?.totalArea,
      pitch: project.roofPitch != null ? String(project.roofPitch) : 'Not specified',
      slopes: project.slopeDamage?.length || 1
    }
  };

  // Scope of work — use AI data; if unavailable show form selections only (no fabricated tasks)
  const scopeOfWork = report.scopeOfWork || {
    preparationTasks: [
      ...(project.localPermit ? ['Permit required (as submitted)'] : []),
      'AI scope of work unavailable — regenerate estimate for full task breakdown'
    ],
    removalTasks: project.jobType ? [`Job type: ${project.jobType}`] : ['AI data unavailable'],
    installationTasks: [
      ...(Array.isArray(project.lineItems) && project.lineItems.length > 0
        ? project.lineItems.map((item: string) => `${item} (from selections)`)
        : ['AI data unavailable — regenerate estimate']),
      ...(project.iceWaterShield ? ['Ice & water shield: Yes'] : []),
      ...(project.dripEdge ? ['Drip edge: Yes'] : [])
    ],
    finishingTasks: ['AI narrative unavailable — regenerate estimate']
  };

  // Helper function to parse range strings (e.g., "5-8" or "6-8") and return average
  const parseRange = (value: string | number | undefined, defaultValue: number): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        return Math.round((min + max) / 2); // Return average
      }
      const singleNum = parseInt(value);
      if (!isNaN(singleNum)) return singleNum;
    }
    return defaultValue;
  };

  // Use form data for labor requirements with OpenAI enhancements
  const laborRequirements = {
    crewSize: project.laborNeeds?.workerCount || report.laborRequirements?.crewSize || '3-5',
    estimatedDays: report.laborRequirements?.estimatedDays || (project.jobType === 'full-replace' ? '5-8' : '2-4'),
    specialEquipment: report.laborRequirements?.specialEquipment || [
      ...(project.laborNeeds?.steepAssist ? ['Steep assist equipment required (as submitted)'] : []),
      'AI equipment list unavailable — regenerate estimate'
    ],
    safetyRequirements: report.laborRequirements?.safetyRequirements || [
      ...(project.roofPitch?.includes('Steep') ? [`Steep pitch safety required: ${project.roofPitch}`] : []),
      'AI safety requirements unavailable — regenerate estimate'
    ]
  };

  // Calculate total hours based on crew size and estimated days
  // Formula: average crew size × average days × 8 hours per day
  const averageCrewSize = parseRange(laborRequirements.crewSize, 4);
  const averageDays = parseRange(laborRequirements.estimatedDays, project.jobType === 'full-replace' ? 6.5 : 3);
  const calculatedTotalHours = Math.round(averageCrewSize * averageDays * 8);

  // Create material breakdown from form selections
  const materialBreakdown = report.materialBreakdown?.lineItems || 
    (project.lineItems?.map((item: string) => ({
      item: item,
      quantity: item.includes('Shingles') ? Math.ceil((project.area || 1200) / 100) : 
               item.includes('Underlayment') ? Math.ceil((project.area || 1200) / 100) : 1,
      unit: item.includes('Shingles') || item.includes('Underlayment') ? 'squares' : 
            item.includes('Linear') ? 'linear feet' : 'each',
      notes: 'Based on project specifications'
    })) || []);

  // Cost estimates — use AI data, then actual estimate totals, then null (no fabricated formulas)
  const estTotal = parseFloat(String(estimate?.totalCost || '0')) || 0;
  const estMat   = parseFloat(String(estimate?.materialsCost || '0')) || 0;
  const estLabor = parseFloat(String(estimate?.laborCost || '0')) || 0;
  const estPermits = parseFloat(String(estimate?.permitsCost || '0')) || 0;

  const costEstimates = report.costEstimates ? {
    ...report.costEstimates,
    labor: {
      ...report.costEstimates.labor,
      totalHours: calculatedTotalHours,
      total: (report.costEstimates.labor?.ratePerHour || (project.laborNeeds?.steepAssist ? 75 : 65)) * calculatedTotalHours
    }
  } : estTotal > 0 ? {
    materials: { total: estMat, breakdown: [] },
    labor: { total: estLabor, ratePerHour: project.laborNeeds?.steepAssist ? 75 : 65, totalHours: calculatedTotalHours },
    equipment: { total: 0, items: [] }
  } : null;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(getLocalizedText('contractor_project_report', preferredLanguage), pageWidth/2, yPos, { align: 'center' });
  yPos += 15;

  // Project Details Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('project_details', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const detailsFields = [
    [getLocalizedText('project_address', preferredLanguage), projectDetails.address],
    [getLocalizedText('project_type', preferredLanguage), capitalizeWords(projectDetails.type)],
    [getLocalizedText('job_type', preferredLanguage), project.jobType ? capitalizeWords(project.jobType.replace('-', ' ')) : undefined],
    [getLocalizedText('material_preference', preferredLanguage), project.materialPreference ? capitalizeWords(project.materialPreference) : undefined],
    [getLocalizedText('total_area', preferredLanguage), projectDetails.dimensions?.totalArea ? `${projectDetails.dimensions.totalArea} sq ft` : undefined],
    [getLocalizedText('roof_pitch', preferredLanguage), projectDetails.dimensions?.pitch],
    [getLocalizedText('roof_age', preferredLanguage), project.roofAge ? `${project.roofAge} years` : undefined],
    [getLocalizedText('structure_type', preferredLanguage), project.structureType],
    [getLocalizedText('existing_materials', preferredLanguage), project.materialLayers?.join(', ')],
    [getLocalizedText('local_permit_required', preferredLanguage), project.localPermit ? 'Yes' : 'No']
  ].filter(([_, value]) => value != null && String(value).trim() !== '' && String(value) !== 'Not specified')
   .map(([label, value]) => [label, String(value)]) as [string, string][];

  detailsFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, yPos);
    yPos += 7;
  });
  yPos += 10;

  // Scope of Work Section (always show if we have tasks)
  const hasWorkTasks = Object.values(scopeOfWork).some(tasks => tasks.length > 0);
  if (hasWorkTasks) {
    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
    doc.text(getLocalizedText('scope_of_work', preferredLanguage), margin + 5, yPos + 6);
    yPos += 15;

  doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const phases = [
      { title: getLocalizedText('preparation_tasks', preferredLanguage), tasks: scopeOfWork.preparationTasks },
      { title: getLocalizedText('removal_tasks', preferredLanguage), tasks: scopeOfWork.removalTasks },
      { title: getLocalizedText('installation_tasks', preferredLanguage), tasks: scopeOfWork.installationTasks },
      { title: getLocalizedText('finishing_tasks', preferredLanguage), tasks: scopeOfWork.finishingTasks }
    ];

    phases.forEach(phase => {
      if (phase.tasks.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(phase.title + ':', margin, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        phase.tasks.forEach((task: string) => {
          const taskLines = doc.splitTextToSize(`• ${String(task)}`, pageWidth - 2*margin - 10);
          taskLines.forEach((line: string, idx: number) => {
            if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
            doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
            yPos += 5;
          });
        });
        yPos += 5;
      }
    });
  }

  // Labor & Equipment Section
  if (yPos > doc.internal.pageSize.height - 100) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('labor_equipment', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  const laborFields = [
    [getLocalizedText('crew_size', preferredLanguage), `${laborRequirements.crewSize} workers`],
    [getLocalizedText('estimated_days', preferredLanguage), `${laborRequirements.estimatedDays} days`],
    [getLocalizedText('steep_assist', preferredLanguage), project.laborNeeds?.steepAssist ? 'Required' : 'Not required']
  ];

  laborFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 50, yPos);
    yPos += 7;
  });

  if (laborRequirements.specialEquipment.length > 0) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Special Equipment:', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    laborRequirements.specialEquipment.forEach((equipment: string) => {
      const lines = doc.splitTextToSize(`• ${String(equipment)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
  }

  if (laborRequirements.safetyRequirements.length > 0) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Safety Requirements:', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    laborRequirements.safetyRequirements.forEach((requirement: string) => {
      const lines = doc.splitTextToSize(`• ${String(requirement)}`, pageWidth - 2*margin - 10);
      lines.forEach((line: string, idx: number) => {
        if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
        doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
        yPos += 5;
      });
    });
  }
  yPos += 10;

  // Material Breakdown Table
  if (materialBreakdown.length > 0) {
    if (yPos > doc.internal.pageSize.height - 120) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
    doc.text(getLocalizedText('material_breakdown', preferredLanguage), margin + 5, yPos + 6);
    yPos += 15;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Table headers
    const colWidths = [70, 25, 25, pageWidth - margin * 2 - 70 - 25 - 25 - 5]; // Last col gets remaining width
    const headers = [
      getLocalizedText('item', preferredLanguage), 
      getLocalizedText('qty', preferredLanguage), 
      getLocalizedText('unit', preferredLanguage), 
      getLocalizedText('notes', preferredLanguage)
    ];
    
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      let xPos = margin;
      for (let i = 0; i < index; i++) {
        xPos += colWidths[i];
      }
      doc.text(header, xPos, yPos);
    });
    yPos += 7;

    // Table rows
    doc.setFont('helvetica', 'normal');
    materialBreakdown.forEach((item: MaterialItem) => {
      let xPos = margin;
      doc.text((item.item || '').substring(0, 30), xPos, yPos);
      xPos += colWidths[0];
      doc.text((item.quantity || 0).toString(), xPos, yPos);
      xPos += colWidths[1];
      doc.text(item.unit || '', xPos, yPos);
      xPos += colWidths[2];
      // Wrap notes text
      const notes = item.notes || '';
      const notesLines = doc.splitTextToSize(notes, colWidths[3] - 2);
      notesLines.forEach((line: string, i: number) => {
        doc.text(line, xPos, yPos + i * 5);
      });
      yPos += Math.max(7, notesLines.length * 5);
    });
    yPos += 10;
  }

  // ✅ SAFELY CALCULATE ALL TOTALS BEFORE DRAWING PDF
  // Guard: costEstimates may be null if AI data is unavailable and no estimate totals exist
  const safeCostEstimates = costEstimates || { materials: { total: 0, breakdown: [] }, labor: { total: 0, ratePerHour: 0, totalHours: 0 }, equipment: { total: 0, items: [] } };

safeCostEstimates.materials.total = safeCostEstimates.materials.breakdown
  ?.reduce((sum: number, item: any) => sum + Number(item.amount ?? item.cost ?? 0), 0) || safeCostEstimates.materials.total || 0;

safeCostEstimates.labor.total = safeCostEstimates.labor.total ||
  (Number(safeCostEstimates.labor.ratePerHour || 0) * Number(safeCostEstimates.labor.totalHours || 0));

safeCostEstimates.equipment.total = safeCostEstimates.equipment.items
  ?.reduce((sum: number, item: any) => sum + Number(item.cost || 0), 0) || safeCostEstimates.equipment.total || 0;

// ✅ Compute grand total safely (rounded)
const grandTotal = +(
  Number(safeCostEstimates.materials.total) +
  Number(safeCostEstimates.labor.total) +
  Number(safeCostEstimates.equipment.total)
).toFixed(2);

// ---------------- COST ESTIMATES SECTION ----------------
if (
  safeCostEstimates.materials.total > 0 ||
  safeCostEstimates.labor.total > 0 ||
  safeCostEstimates.equipment.total > 0
) {
  if (yPos > doc.internal.pageSize.height - 120) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.text(getLocalizedText('cost_estimates', preferredLanguage), margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // ---------------- MATERIALS COST ----------------
  if (safeCostEstimates.materials.total > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(getLocalizedText('materials_cost', preferredLanguage), margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    (safeCostEstimates.materials.breakdown || []).forEach((item: any) => {
      const label = item.category || item.item || item.name || 'Item';
      const value = item.amount ?? item.cost ?? 0;
      doc.text(
        `${label}: ${formatCurrency(value, preferredCurrency)}`,
        margin + 10,
        yPos
      );
      yPos += 5;
    });

    doc.setFont('helvetica', 'bold');
    doc.text(
      `${getLocalizedText('total_materials_cost', preferredLanguage)} ${formatCurrency(
        safeCostEstimates.materials.total,
        preferredCurrency
      )}`,
      margin + 10,
      yPos
    );
    yPos += 10;
  }

  // ---------------- LABOR COST ----------------
  if (safeCostEstimates.labor.total > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(getLocalizedText('labor_cost', preferredLanguage), margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${getLocalizedText('rate_per_hour', preferredLanguage)} ${formatCurrency(
        safeCostEstimates.labor.ratePerHour,
        preferredCurrency
      )}`,
      margin + 10,
      yPos
    );
    yPos += 5;

    doc.text(
      `${getLocalizedText('total_hours', preferredLanguage)} ${safeCostEstimates.labor.totalHours}`,
      margin + 10,
      yPos
    );
    yPos += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(
      `${getLocalizedText('total_labor_cost', preferredLanguage)} ${formatCurrency(
        safeCostEstimates.labor.total,
        preferredCurrency
      )}`,
      margin + 10,
      yPos
    );
    yPos += 10;
  }

  // ---------------- EQUIPMENT COST ----------------
  if (safeCostEstimates.equipment.total > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(getLocalizedText('equipment_cost', preferredLanguage), margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    (safeCostEstimates.equipment.items || []).forEach((item: EquipmentItem) => {
      doc.text(
        `${item.item}: ${formatCurrency(item.cost, preferredCurrency)}`,
        margin + 10,
        yPos
      );
      yPos += 5;
    });

    doc.setFont('helvetica', 'bold');
    doc.text(
      `${getLocalizedText('total_equipment_cost', preferredLanguage)} ${formatCurrency(
        safeCostEstimates.equipment.total,
        preferredCurrency
      )}`,
      margin + 10,
      yPos
    );
    yPos += 10;
  }

  // ---------------- GRAND TOTAL ----------------
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 102, 0);
  doc.text(
    `${getLocalizedText('project_total', preferredLanguage)} ${formatCurrency(grandTotal, preferredCurrency)}`,
    margin,
    yPos
  );
  doc.setTextColor(0, 0, 0);
  yPos += 15;
}

  // ── Project Narrative (from AI) ─────────────────────────────────────────
  const ctReport = report as any;
  const projNarrative = ctReport.projectDetails?.projectNarrative || '';
  if (projNarrative) {
    yPos = addSectionHeader(doc, 'PROJECT OVERVIEW', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', projNarrative, margin, yPos, pageWidth);
  }

  // ── Inspection Checkpoints (from AI) ────────────────────────────────────
  const checkpoints = ctReport.scopeOfWork?.inspectionCheckpoints || [];
  if (checkpoints.length > 0) {
    yPos = addSectionHeader(doc, 'QUALITY CONTROL CHECKPOINTS', yPos, pageWidth, margin);
    yPos = addBulletList(doc, '', checkpoints, margin, yPos, pageWidth);
  }

  // ── Labor Narrative (from AI) ────────────────────────────────────────────
  const laborNarrative = ctReport.laborRequirements?.laborNarrative || '';
  if (laborNarrative) {
    yPos = addSectionHeader(doc, 'LABOR PLAN DETAILS', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', laborNarrative, margin, yPos, pageWidth);
  }

  // ── Material Specifications & Waste Factor (from AI) ────────────────────
  const matSpec = ctReport.materialBreakdown?.materialSpecifications || '';
  const wasteFactor = ctReport.materialBreakdown?.wasteFactorNote || '';
  if (matSpec || wasteFactor) {
    yPos = addSectionHeader(doc, 'MATERIAL SPECIFICATIONS', yPos, pageWidth, margin);
    if (matSpec) yPos = addNarrative(doc, 'Specifications:', matSpec, margin, yPos, pageWidth);
    if (wasteFactor) yPos = addNarrative(doc, 'Waste Factor:', wasteFactor, margin, yPos, pageWidth);
  }

  // ── Permit & Code Requirements (from AI) ────────────────────────────────
  const pac = ctReport.permitAndCode || {};
  if (pac.localCodeRequirements || pac.inspectionMilestones?.length) {
    yPos = addSectionHeader(doc, 'PERMIT & CODE REQUIREMENTS', yPos, pageWidth, margin);
    yPos = addKeyValue(doc, 'Permit Required:', pac.permitRequired ? 'Yes' : 'No', margin, yPos, pageWidth);
    if (pac.localCodeRequirements) yPos = addNarrative(doc, 'Local Code Requirements:', pac.localCodeRequirements, margin, yPos, pageWidth);
    if (pac.inspectionMilestones?.length) yPos = addBulletList(doc, 'Required Inspections:', pac.inspectionMilestones, margin, yPos, pageWidth);
  }

  // ── Project Timeline (from AI) ────────────────────────────────────────────
  const ptl = ctReport.projectTimeline || {};
  if (ptl.estimatedCompletionDays || ptl.weatherConsiderations || ptl.milestones?.length) {
    yPos = addSectionHeader(doc, 'PROJECT TIMELINE', yPos, pageWidth, margin);
    if (ptl.estimatedStartPrep) yPos = addKeyValue(doc, 'Start Preparation:', ptl.estimatedStartPrep, margin, yPos, pageWidth);
    if (ptl.estimatedCompletionDays) yPos = addKeyValue(doc, 'Completion:', ptl.estimatedCompletionDays, margin, yPos, pageWidth);
    if (ptl.weatherConsiderations) yPos = addNarrative(doc, 'Weather Considerations:', ptl.weatherConsiderations, margin, yPos, pageWidth);
    if (ptl.milestones?.length) yPos = addBulletList(doc, 'Milestones:', ptl.milestones, margin, yPos, pageWidth);
  }

  // ── Warranty & Quality Assurance (from AI) ───────────────────────────────
  const wq = ctReport.warrantyAndQuality || {};
  if (wq.materialWarranty || wq.workmanshipWarranty || wq.qualityAssuranceProcess) {
    yPos = addSectionHeader(doc, 'WARRANTY & QUALITY ASSURANCE', yPos, pageWidth, margin);
    if (wq.materialWarranty) yPos = addNarrative(doc, 'Material Warranty:', wq.materialWarranty, margin, yPos, pageWidth);
    if (wq.workmanshipWarranty) yPos = addNarrative(doc, 'Workmanship Warranty:', wq.workmanshipWarranty, margin, yPos, pageWidth);
    if (wq.qualityAssuranceProcess) yPos = addNarrative(doc, 'QA Process:', wq.qualityAssuranceProcess, margin, yPos, pageWidth);
  }

}

function addContractorImagePages(doc: jsPDF, uploadedFiles: any[], report?: any, preferredLanguage: string = 'english') {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  uploadedFiles.forEach((file: any, index: number) => {
    doc.addPage();
    let yPos = 20;

    // Page Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(`${getLocalizedText('project_image', preferredLanguage)} ${index + 1} - ${getLocalizedText('repair_analysis', preferredLanguage)}`, pageWidth/2, yPos, { align: 'center' });
    yPos += 15;

    // Add the image if we have it
    if (file.data) {
      try {
        const imgWidth = pageWidth - 2*margin;
        const imgHeight = 120;
        doc.addImage(file.data, 'JPEG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Error loading image', margin, yPos);
        yPos += 10;
      }
    }

    // Add image analysis from Gemini Vision if available
    const rawAnalysis = Array.isArray(report?.imageAnalysis) ? report.imageAnalysis[index] : report?.imageAnalysis;
    const imageAnalysis = (typeof rawAnalysis === 'string' && rawAnalysis.trim())
      ? rawAnalysis
      : 'Professional analysis: This image shows roofing conditions requiring contractor assessment for repair planning and material requirements.';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 102, 0);
    doc.text(getLocalizedText('contractor_analysis', preferredLanguage), margin, yPos);
    yPos += 10;

                doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Split analysis into lines and add them to the PDF
    const lines = doc.splitTextToSize(imageAnalysis, pageWidth - 2*margin);
    lines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });
  });
}

interface HomeownerReport {
  welcomeMessage: {
    greeting: string;
    introduction: string;
    ourCommitment: string;
  };
  roofOverview: {
    propertyType: string;
    roofAge: string;
    roofStyle: string;
    currentMaterials: string;
    overallCondition: string;
    keyFeatures: string[];
  };
  damageSummary: {
    inspectionFindings: string;
    priorityLevel: string;
    mainConcerns: string[];
    whatThisMeans: string;
  };
  repairSuggestions: {
    immediateActions: string[];
    shortTermPlanning: string[];
    longTermOutlook: {
      timeline: string;
      investmentGuidance: string;
      preventiveCare: string;
    };
  };
  budgetGuidance: {
    estimatedRange: {
      repairs: string;
      partialReplacement: string;
      fullReplacement: string;
    };
    financingOptions: string[];
    costSavingTips: string[];
  };
  nextSteps: {
    recommended: string[];
    questions: string[];
    warningSignsToWatch: string[];
  };
  imageAnalysis?: string[];
}

function addHomeownerReport(doc: jsPDF, project: any, estimate: any) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 20;

  // Get user preferences
  const preferredLanguage = project.preferredLanguage || 'english';
  const preferredCurrency = project.preferredCurrency || 'USD';

  // Debug logging
  console.log('=== Homeowner Report Data ===');
  console.log('Project:', project);
  console.log('Estimate:', estimate);
  console.log('Report:', estimate?.report);
  console.log('Language:', preferredLanguage, 'Currency:', preferredCurrency);

  // Extract report data with fallbacks to form data
  const report = (estimate?.report || {}) as HomeownerReport;
  
  // Fallbacks use only raw form data — no fabricated AI text
  // If report is empty it means AI generation failed; show data-only fields
  const mat1 = Array.isArray(project.materialLayers) ? (project.materialLayers[0] || 'roofing material') : 'roofing material';
  const roofAge = Number(project.roofAge) || 0;
  const area = Number(project.area) || 0;

  const welcomeMessage = report.welcomeMessage || {
    greeting: `Dear ${project.homeownerInfo?.name || 'Homeowner'},`,
    introduction: `FlacronBuild Roof Assessment — ${project.structureType || 'Residential'}, ${roofAge} years old, ${area} sq ft`,
    ourCommitment: 'Report data could not be generated by AI. Showing raw input data below.'
  };

  const roofOverview = report.roofOverview || {
    propertyType: project.structureType || 'Not specified',
    roofAge: roofAge ? `${roofAge} years old` : 'Not specified',
    roofStyle: project.roofPitch || 'Not specified',
    currentMaterials: Array.isArray(project.materialLayers) ? project.materialLayers.join(', ') : 'Not specified',
    overallCondition: 'AI analysis unavailable — please regenerate the estimate.',
    keyFeatures: [
      `Ice & water shield: ${project.iceWaterShield ? 'Yes' : 'No'}`,
      `Drip edge: ${project.dripEdge ? 'Yes' : 'No'}`,
      `Felt underlayment: ${project.felt || 'Not specified'}`,
      `Gutter apron: ${project.gutterApron ? 'Yes' : 'No'}`
    ]
  };

  const damageSummary = report.damageSummary || {
    inspectionFindings: `Reported slope damage entries: ${Array.isArray(project.slopeDamage) ? project.slopeDamage.length : 0}. AI narrative unavailable — regenerate estimate for full analysis.`,
    priorityLevel: project.urgency === 'high' ? 'High Urgency (as submitted)' :
                   project.urgency === 'medium' ? 'Medium Urgency (as submitted)' :
                   'Low Urgency (as submitted)',
    mainConcerns: [
      ...(Array.isArray(project.slopeDamage) && project.slopeDamage.length > 0
        ? project.slopeDamage.map((d: any) => `${d.slope || 'Slope'}: ${d.damageType || 'damage'} — ${d.severity || 'unknown'} severity`)
        : ['No slope damage entries recorded']),
      `Material: ${mat1} | Age: ${roofAge} yrs | Area: ${area} sq ft`
    ],
    whatThisMeans: 'Regenerate the estimate to receive AI-written analysis for this section.'
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text('YOUR ROOF ASSESSMENT REPORT', pageWidth/2, yPos, { align: 'center' });
  yPos += 20;

  // Welcome Message Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('WELCOME', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
  
  // Greeting - ensure it's a string
  doc.setFont('helvetica', 'bold');
  const greeting = String(welcomeMessage.greeting || 'Dear Homeowner,');
  doc.text(greeting, margin, yPos);
  yPos += 8;

  // Introduction - ensure it's a string and handle line wrapping
        doc.setFont('helvetica', 'normal');
  const introduction = String(welcomeMessage.introduction || 'Thank you for choosing FlacronBuild for your roofing assessment.');
  const introLines = doc.splitTextToSize(introduction, pageWidth - 2*margin);
  introLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Commitment - ensure it's a string
  doc.setFont('helvetica', 'italic');
  const commitment = String(welcomeMessage.ourCommitment || 'Our goal is to provide you with clear, honest information.');
  const commitmentLines = doc.splitTextToSize(commitment, pageWidth - 2*margin);
  commitmentLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 10;

  // Roof Overview Section
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('YOUR ROOF OVERVIEW', margin + 5, yPos + 6);
  yPos += 15;

        doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Ensure all overview fields are strings; Current Materials uses wrap to avoid overflow
  const overviewFields = [
    ['Property Type:', String(roofOverview.propertyType || 'Not specified')],
    ['Roof Age:', String(roofOverview.roofAge || 'Not specified')],
    ['Roof Style:', String(roofOverview.roofStyle || 'Not specified')],
    ['Current Materials:', String(roofOverview.currentMaterials || 'Not specified')]
  ];

  overviewFields.forEach(([label, value]) => {
    if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const valueStartX = margin + 50;
    const maxWidth = pageWidth - 2 * margin - 55;
    const lines = doc.splitTextToSize(value, maxWidth);
    lines.forEach((line: string, i: number) => {
      if (i > 0 && yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      doc.text(line, valueStartX, yPos);
      yPos += i === 0 ? 6 : 5;
    });
    yPos += 2;
  });
  yPos += 5;

  // Overall Condition - ensure it's a string
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Condition:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const condition = String(roofOverview.overallCondition || 'Assessment pending');
  const conditionLines = doc.splitTextToSize(condition, pageWidth - 2*margin);
  conditionLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Key Features
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text('Key Features:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const keyFeatures = roofOverview.keyFeatures || ['Standard roofing features'];
  keyFeatures.forEach((feature: string) => {
    const featureText = String(feature || 'Standard feature');
    const featureLines = doc.splitTextToSize(`• ${featureText}`, pageWidth - 2*margin - 10);
    featureLines.forEach((line: string, idx: number) => {
      if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
      yPos += 5;
    });
    yPos += 1;
  });
  yPos += 10;

  // Damage Summary Section
  if (yPos > doc.internal.pageSize.height - 100) {
          doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('WHAT WE FOUND', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Priority Level
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Priority Level:', margin, yPos);
  yPos += 8;
  doc.setFontSize(11);
  const priorityLevel = String(damageSummary.priorityLevel || 'Assessment pending');
  doc.setTextColor(priorityLevel.toLowerCase().includes('high') ? 220 : priorityLevel.toLowerCase().includes('medium') ? 180 : 60,
                   priorityLevel.toLowerCase().includes('high') ? 50 : 120, 50);
  const priorityLines = doc.splitTextToSize(priorityLevel, pageWidth - 2*margin - 10);
  priorityLines.forEach((line: string) => {
    if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
    doc.text(line, margin + 10, yPos);
    yPos += 6;
  });
  yPos += 4;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Inspection Findings
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text('Inspection Findings:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const findings = String(damageSummary.inspectionFindings || 'Inspection completed');
  const findingsLines = doc.splitTextToSize(findings, pageWidth - 2*margin);
  findingsLines.forEach((line: string) => {
    if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Main Concerns
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text('Main Concerns:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const mainConcerns = damageSummary.mainConcerns || ['General roof assessment'];
  mainConcerns.forEach((concern: string) => {
    const concernText = String(concern || 'Standard concern');
    const concernLines = doc.splitTextToSize(`• ${concernText}`, pageWidth - 2*margin - 10);
    concernLines.forEach((line: string, idx: number) => {
      if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      // indent continuation lines to align past the bullet
      doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
      yPos += 5;
    });
    yPos += 1;
  });
  yPos += 5;

  // What This Means
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text('What This Means for You:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const meaning = String(damageSummary.whatThisMeans || 'Our assessment is complete');
  const meaningLines = doc.splitTextToSize(meaning, pageWidth - 2*margin);
  meaningLines.forEach((line: string) => {
    if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 10;

  // Repair Suggestions Section
  if (yPos > doc.internal.pageSize.height - 120) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('OUR RECOMMENDATIONS', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  const repairSuggestions = report.repairSuggestions || {
    immediateActions: ['AI recommendations unavailable — regenerate the estimate to get personalized action items.'],
    shortTermPlanning: [
      `Budget style selected: ${project.budgetStyle || 'not specified'}`,
      `Urgency level: ${project.urgency || 'not specified'}`,
      'Regenerate estimate for AI-written recommendations.'
    ],
    longTermOutlook: {
      timeline: `Roof age: ${roofAge} years — AI timeline analysis unavailable`,
      investmentGuidance: 'Regenerate estimate for investment guidance.',
      preventiveCare: 'Regenerate estimate for maintenance recommendations.'
    }
  };

  // Immediate Actions
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text('Immediate Actions:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const immediateActions = repairSuggestions.immediateActions || ['Schedule professional consultation'];
  immediateActions.forEach((action: string) => {
    const actionText = String(action || 'Recommended action');
    const actionLines = doc.splitTextToSize(`• ${actionText}`, pageWidth - 2*margin - 10);
    actionLines.forEach((line: string, idx: number) => {
      if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
      yPos += 5;
    });
    yPos += 1;
  });
  yPos += 5;

  // Short Term Planning - ensure all are strings
  doc.setFont('helvetica', 'bold');
  doc.text('Short Term Planning (3-6 months):', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const shortTermPlanning = repairSuggestions.shortTermPlanning || ['Develop maintenance plan'];
  shortTermPlanning.forEach((plan: string) => {
    const planText = String(plan || 'Planning item');
    const planLines = doc.splitTextToSize(`• ${planText}`, pageWidth - 2*margin - 10);
    planLines.forEach((line: string) => {
      doc.text(line, margin + 10, yPos);
      yPos += 6;
    });
  });
  yPos += 5;

  // Long Term Outlook - ensure all are strings
  doc.setFont('helvetica', 'bold');
  doc.text('Long Term Outlook:', margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  
  const timeline = String(repairSuggestions.longTermOutlook?.timeline || 'Long-term maintenance recommended');
  const timelineLines = doc.splitTextToSize(`Timeline: ${timeline}`, pageWidth - 2*margin - 10);
  timelineLines.forEach((line: string) => {
    if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
    doc.text(line, margin + 10, yPos);
    yPos += 6;
  });
  
  const investmentGuidance = String(repairSuggestions.longTermOutlook?.investmentGuidance || 'Consider professional guidance for investment decisions');
  const guidanceLines = doc.splitTextToSize(`Investment: ${investmentGuidance}`, pageWidth - 2*margin - 10);
  guidanceLines.forEach((line: string) => {
    doc.text(line, margin + 10, yPos);
    yPos += 6;
  });
  
  const preventiveCare = String(repairSuggestions.longTermOutlook?.preventiveCare || 'Regular maintenance is recommended');
  const careLines = doc.splitTextToSize(`Care: ${preventiveCare}`, pageWidth - 2*margin - 10);
  careLines.forEach((line: string) => {
    doc.text(line, margin + 10, yPos);
    yPos += 6;
  });
  yPos += 10;

  // Budget Guidance Section (if space, otherwise new page)
  if (yPos > doc.internal.pageSize.height - 80) {
    doc.addPage();
    yPos = 20;
  }

  // Helper to extract numeric value from formatted currency string (if OpenAI returns formatted strings)
  const parseCurrencyValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    // Remove currency symbols, commas, and spaces, then parse
    const numericStr = String(value).replace(/[^\d.-]/g, '');
    const num = parseFloat(numericStr);
    return isNaN(num) ? 0 : num;
  };

  // If OpenAI returned budgetGuidance, check if values need conversion
  // OpenAI should return values in preferredCurrency, but if they're strings with USD symbols, parse and convert
  let budgetGuidanceData = report.budgetGuidance;
  if (budgetGuidanceData && preferredCurrency !== 'USD') {
    // Check if values appear to be in USD (have $ symbol) and need conversion
    const repairsStr = budgetGuidanceData.estimatedRange?.repairs || '';
    const partialStr = budgetGuidanceData.estimatedRange?.partialReplacement || '';
    const fullStr = budgetGuidanceData.estimatedRange?.fullReplacement || '';
    
    // If strings contain $ symbol, they're likely USD values that need conversion
    if (repairsStr.includes('$') || partialStr.includes('$') || fullStr.includes('$')) {
      // Parse and convert
      const repairsMatch = repairsStr.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
      if (repairsMatch) {
        const low = parseCurrencyValue(repairsMatch[1]);
        const high = parseCurrencyValue(repairsMatch[2]);
        budgetGuidanceData.estimatedRange.repairs = `${formatCurrency(low, preferredCurrency)} - ${formatCurrency(high, preferredCurrency)}`;
      }
      
      if (partialStr.includes('$')) {
        const partialVal = parseCurrencyValue(partialStr);
        budgetGuidanceData.estimatedRange.partialReplacement = formatCurrency(partialVal, preferredCurrency);
      }
      
      if (fullStr.includes('$')) {
        const fullVal = parseCurrencyValue(fullStr);
        budgetGuidanceData.estimatedRange.fullReplacement = formatCurrency(fullVal, preferredCurrency);
      }
    }
  }

  // Use real estimate cost data when AI budget guidance is unavailable
  const estTotal = parseFloat(String(estimate?.totalCost || '0')) || 0;
  const estMat = parseFloat(String(estimate?.materialsCost || '0')) || 0;
  const estLabor = parseFloat(String(estimate?.laborCost || '0')) || 0;
  const estPermits = parseFloat(String(estimate?.permitsCost || '0')) || 0;
  const estContingency = parseFloat(String(estimate?.contingencyCost || '0')) || 0;
  const hasRealCosts = estTotal > 0;

  const budgetGuidance = budgetGuidanceData || {
    estimatedRange: hasRealCosts ? {
      repairs: `${formatCurrency(Math.round(estTotal * 0.12), preferredCurrency)} – ${formatCurrency(Math.round(estTotal * 0.30), preferredCurrency)}`,
      partialReplacement: `${formatCurrency(Math.round(estTotal * 0.40), preferredCurrency)} – ${formatCurrency(Math.round(estTotal * 0.65), preferredCurrency)}`,
      fullReplacement: `${formatCurrency(Math.round(estTotal * 0.90), preferredCurrency)} – ${formatCurrency(Math.round(estTotal * 1.15), preferredCurrency)}`
    } : {
      repairs: project.urgency === 'high' ? `${formatCurrency(2000, preferredCurrency)} – ${formatCurrency(8000, preferredCurrency)}` : project.urgency === 'medium' ? `${formatCurrency(1000, preferredCurrency)} – ${formatCurrency(4000, preferredCurrency)}` : `${formatCurrency(500, preferredCurrency)} – ${formatCurrency(2000, preferredCurrency)}`,
      partialReplacement: `${formatCurrency(Math.round((project.area || 1200) * (project.budgetStyle === 'premium' ? 8 : project.budgetStyle === 'basic' ? 4 : 6) * 0.5), preferredCurrency)} – ${formatCurrency(Math.round((project.area || 1200) * (project.budgetStyle === 'premium' ? 10 : project.budgetStyle === 'basic' ? 5 : 7) * 0.5), preferredCurrency)}`,
      fullReplacement: `${formatCurrency(Math.round((project.area || 1200) * (project.budgetStyle === 'premium' ? 10 : project.budgetStyle === 'basic' ? 5 : 7)), preferredCurrency)} – ${formatCurrency(Math.round((project.area || 1200) * (project.budgetStyle === 'premium' ? 14 : project.budgetStyle === 'basic' ? 7 : 10)), preferredCurrency)}`
    },
    financingOptions: [
      getLocalizedText('home_improvement_loans', preferredLanguage),
      getLocalizedText('insurance_claims', preferredLanguage),
      getLocalizedText('contractor_payment_plans', preferredLanguage),
      getLocalizedText('home_equity_line', preferredLanguage)
    ],
    costSavingTips: [
      'Get at least 3 quotes — prices for the same job can vary 20–40% between contractors',
      'Schedule work in fall or winter when contractor demand is lower — potential savings of 10–20%',
      'Ask about re-roofing over existing layer if your deck is in good condition',
      'Bundle gutter or ventilation upgrades during roof replacement to save on mobilization costs',
      'Ask contractors about manufacturer seasonal rebates or promotions on materials'
    ]
  };

  // Detailed cost breakdown when we have real data
  if (hasRealCosts) {
    if (yPos > doc.internal.pageSize.height - 80) { doc.addPage(); yPos = 20; }

    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.text('YOUR DETAILED COST BREAKDOWN', margin + 5, yPos + 6);
    yPos += 15;
    doc.setTextColor(0, 0, 0);

    const pageHeight = doc.internal.pageSize.height;
    const hoAiCost = report.costEstimates || (estimate?.report as any)?.costEstimates || {};
    const hoMaterialItems = Array.isArray(hoAiCost?.materials?.breakdown) ? hoAiCost.materials.breakdown : [];
    const hoFallbackLineItems = Array.isArray(project?.lineItems) ? project.lineItems : [];
    const hoDisplayMaterialItems = hoMaterialItems.length > 0
      ? hoMaterialItems
      : (hoFallbackLineItems.length > 0
        ? hoFallbackLineItems.map((name: string) => ({ item: name, cost: estMat / hoFallbackLineItems.length }))
        : [{ item: 'Primary Roofing Materials', cost: estMat }]);
    const hoEquipmentItems = Array.isArray(hoAiCost?.equipment?.items) ? hoAiCost.equipment.items : [];

    // Materials breakdown
    if (hoDisplayMaterialItems.length > 0 && estMat > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Materials', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      hoDisplayMaterialItems.forEach((item: any) => {
        if (yPos > pageHeight - 24) { doc.addPage(); yPos = 20; }
        const itemName = item?.item || item?.category || item?.name || 'Material';
        const itemCost = Number(item?.cost ?? item?.amount ?? 0);
        doc.text(itemName, margin + 4, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, preferredCurrency), pageWidth - margin, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 2, yPos, pageWidth - margin, yPos);
      yPos += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Materials Subtotal:', margin + 4, yPos);
      doc.text(formatCurrency(estMat, preferredCurrency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Labor breakdown
    if (estLabor > 0) {
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Labor', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const hoLaborRate = Number(hoAiCost?.labor?.ratePerHour ?? 0);
      const hoLaborHours = Number(hoAiCost?.labor?.totalHours ?? 0);
      if (hoLaborRate > 0) {
        doc.text(`Rate per Hour: ${formatCurrency(hoLaborRate, preferredCurrency)}`, margin + 4, yPos);
        yPos += 5;
      }
      if (hoLaborHours > 0) {
        doc.text(`Estimated Hours: ${hoLaborHours}`, margin + 4, yPos);
        yPos += 5;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Labor Subtotal:', margin + 4, yPos);
      doc.text(formatCurrency(estLabor, preferredCurrency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    }

    // Equipment breakdown
    if (hoEquipmentItems.length > 0) {
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Equipment', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      hoEquipmentItems.forEach((item: any) => {
        if (yPos > pageHeight - 24) { doc.addPage(); yPos = 20; }
        const itemName = item?.item || 'Equipment';
        const itemCost = Number(item?.cost ?? 0);
        doc.text(itemName, margin + 4, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, preferredCurrency), pageWidth - margin, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
      yPos += 3;
    }

    // Permits & Contingency — always show permits row for transparency
    if (yPos > doc.internal.pageSize.height - 24) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Permits & Fees:', margin + 4, yPos);
    doc.text(
      estPermits > 0 ? formatCurrency(estPermits, preferredCurrency) : 'Included',
      pageWidth - margin, yPos, { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    if (estContingency > 0) {
      const hoBaseCost = Math.max(0, estMat + estLabor + estPermits);
      const hoContPct = hoBaseCost > 0 ? ((estContingency / hoBaseCost) * 100).toFixed(1) : '0.0';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Contingency (${hoContPct}%):`, margin + 4, yPos);
      doc.text(formatCurrency(estContingency, preferredCurrency), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 6;
    }

    // Grand total
    yPos += 2;
    doc.setFillColor(255, 102, 0);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL ESTIMATE', margin + 5, yPos + 6);
    doc.text(formatCurrency(estTotal, preferredCurrency), pageWidth - margin, yPos + 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 16;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('BUDGET PLANNING', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Estimated Ranges - ensure all are strings
  doc.setFont('helvetica', 'bold');
  doc.text(getLocalizedText('estimated_range', preferredLanguage), margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const repairs = String(budgetGuidance.estimatedRange?.repairs || 'Contact for estimate');
  const partialReplacement = String(budgetGuidance.estimatedRange?.partialReplacement || 'Contact for estimate');
  const fullReplacement = String(budgetGuidance.estimatedRange?.fullReplacement || 'Contact for estimate');
  
  [
    `${getLocalizedText('repairs', preferredLanguage)} ${repairs}`,
    `${getLocalizedText('partial_replacement', preferredLanguage)} ${partialReplacement}`,
    `${getLocalizedText('full_replacement', preferredLanguage)} ${fullReplacement}`
  ].forEach(txt => {
    const ls = doc.splitTextToSize(txt, pageWidth - 2*margin - 10);
    ls.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      doc.text(line, margin + 10, yPos);
      yPos += 6;
    });
  });
  yPos += 4;

  // Financing Options
  doc.setFont('helvetica', 'bold');
  if (yPos > doc.internal.pageSize.height - 40) { doc.addPage(); yPos = 20; }
  doc.text(getLocalizedText('financing_options', preferredLanguage), margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const financingOptions = budgetGuidance.financingOptions || ['Consult with financial advisor'];
  financingOptions.forEach((option: string) => {
    const optionText = String(option || 'Financing option');
    const optLines = doc.splitTextToSize(`• ${optionText}`, pageWidth - 2*margin - 10);
    optLines.forEach((line: string, idx: number) => {
      if (yPos > doc.internal.pageSize.height - 30) { doc.addPage(); yPos = 20; }
      doc.text(line, idx === 0 ? margin + 10 : margin + 13, yPos);
      yPos += 5;
    });
    yPos += 1;
  });

  // Add Glossary Section for homeowners
  if (yPos > doc.internal.pageSize.height - 120) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 15;
  }

  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.text('ROOFING TERMS EXPLAINED', margin + 5, yPos + 6);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Glossary of common roofing terms for homeowners
  const glossaryTerms = [
    {
      term: 'Drip Edge',
      definition: 'Metal strips installed along roof edges to direct water away from fascia and into gutters, preventing water damage.'
    },
    {
      term: 'Ice and Water Shield',
      definition: 'A waterproof membrane applied to vulnerable roof areas (like valleys and eaves) to prevent ice dams and water infiltration.'
    },
    {
      term: 'Felt Underlayment',
      definition: 'Protective barrier installed beneath roofing materials to provide additional waterproofing and weather protection.'
    },
    {
      term: 'Roof Pitch',
      definition: 'The steepness of your roof measured as rise over run. Low slope (2-4/12), medium (4-8/12), steep (8+/12).'
    },
    {
      term: 'Flashing',
      definition: 'Metal pieces that seal joints and transitions on your roof (around chimneys, vents, valleys) to prevent water leaks.'
    },
    {
      term: 'Ridge Vent',
      definition: 'Ventilation system installed along the roof peak to allow hot air to escape from your attic, improving energy efficiency.'
    },
    {
      term: 'Gutters & Downspouts',
      definition: 'System that collects rainwater from your roof and directs it away from your home\'s foundation.'
    },
    {
      term: 'Shingles/Materials',
      definition: 'The visible outer layer of your roof. Common types include asphalt shingles, metal, tile, or slate.'
    },
    {
      term: 'Soffit & Fascia',
      definition: 'Soffit: underside of roof overhang. Fascia: vertical board along roof edge. Both protect roof structure and support gutters.'
    },
    {
      term: 'Square',
      definition: 'Roofing measurement unit. One square = 100 square feet of roof area. Used for material and labor calculations.'
    }
  ];

  glossaryTerms.forEach((item) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 30) {
      doc.addPage();
      yPos = 20;
    }

    // Term in bold
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.term}:`, margin, yPos);
    yPos += 6;

    // Definition with word wrap
    doc.setFont('helvetica', 'normal');
    const definitionLines = doc.splitTextToSize(item.definition, pageWidth - 2*margin - 10);
    definitionLines.forEach((line: string) => {
      doc.text(line, margin + 10, yPos);
      yPos += 5;
    });
    yPos += 3; // Small gap between terms
  });

  // Add helpful note at the end
  yPos += 10;
  if (yPos > doc.internal.pageSize.height - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const noteText = "This glossary explains common roofing terms to help you understand your roof better. Don't hesitate to ask your contractor to explain any technical terms during your consultation.";
  const noteLines = doc.splitTextToSize(noteText, pageWidth - 2*margin);
  noteLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // ── What the Age of Your Roof Means (AI) ─────────────────────────────────
  const hwReport = report as any;
  const ageMeaning = hwReport.roofOverview?.whatTheAgeOfYourRoofMeans || '';
  if (ageMeaning) {
    yPos = addSectionHeader(doc, 'WHAT YOUR ROOF AGE MEANS', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', ageMeaning, margin, yPos, pageWidth);
  }

  // ── Pricing Note (AI) ────────────────────────────────────────────────────
  const pricingNote = hwReport.budgetGuidance?.pricingNote || '';
  if (pricingNote) {
    yPos = addSectionHeader(doc, 'ABOUT THESE ESTIMATES', yPos, pageWidth, margin);
    yPos = addNarrative(doc, '', pricingNote, margin, yPos, pageWidth);
    if (hwReport.budgetGuidance?.reportDate) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report generated: ${hwReport.budgetGuidance.reportDate}`, margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    }
  }

  // ── Cost Saving Tips (AI) ─────────────────────────────────────────────────
  const tips = hwReport.budgetGuidance?.costSavingTips || [];
  if (tips.length > 0) {
    yPos = addSectionHeader(doc, 'COST SAVING TIPS', yPos, pageWidth, margin);
    yPos = addBulletList(doc, '', tips, margin, yPos, pageWidth);
  }

  // ── Next Steps (AI) ───────────────────────────────────────────────────────
  const nextSteps = hwReport.nextSteps?.recommended || [];
  if (nextSteps.length > 0) {
    yPos = addSectionHeader(doc, 'YOUR NEXT STEPS', yPos, pageWidth, margin);
    nextSteps.forEach((rawStep: any, i: number) => {
      const step = rawStep != null ? String(rawStep) : '';
      if (!step.trim()) return;
      if (yPos > doc.internal.pageSize.height - 20) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 102, 0);
      doc.text(`${i + 1}.`, margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(step.trim(), pageWidth - 2 * margin - 20);
      lines.forEach((line: string) => {
        doc.text(line, margin + 14, yPos);
        yPos += 5;
      });
      yPos += 2;
    });
    yPos += 5;
  }

  // ── Questions to Ask Contractors (AI) ────────────────────────────────────
  const questions = hwReport.nextSteps?.questionsToAskContractors || [];
  if (questions.length > 0) {
    yPos = addSectionHeader(doc, 'QUESTIONS TO ASK CONTRACTORS', yPos, pageWidth, margin);
    yPos = addBulletList(doc, '', questions, margin, yPos, pageWidth);
  }

  // ── Warning Signs to Watch (AI) ───────────────────────────────────────────
  const warnings = hwReport.nextSteps?.warningSignsToWatch || [];
  if (warnings.length > 0) {
    yPos = addSectionHeader(doc, 'WARNING SIGNS TO WATCH FOR', yPos, pageWidth, margin);
    yPos = addBulletList(doc, '', warnings, margin, yPos, pageWidth, [200, 50, 50]);
  }

  // ── When to Call Emergency Service (AI) ──────────────────────────────────
  const emergency = hwReport.nextSteps?.whenToCallEmergencyService || '';
  if (emergency) {
    yPos = addSectionHeader(doc, 'WHEN TO CALL EMERGENCY SERVICE', yPos, pageWidth, margin);
    doc.setFillColor(255, 240, 240);
    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, doc.splitTextToSize(emergency, pageWidth - 2 * margin - 10).length * 5 + 10, 'F');
    yPos = addNarrative(doc, '', emergency, margin, yPos + 2, pageWidth);
  }
}

function addHomeownerImagePages(doc: jsPDF, uploadedFiles: any[], report?: any) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  uploadedFiles.forEach((file: any, index: number) => {
    doc.addPage();
    let yPos = 20;

    // Page Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(`Photo ${index + 1} - What You're Seeing`, pageWidth/2, yPos, { align: 'center' });
    yPos += 15;

    // Add the image if we have it
    if (file.data) {
      try {
        const imgWidth = pageWidth - 2*margin;
        const imgHeight = 120;
        doc.addImage(file.data, 'JPEG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Error loading image', margin, yPos);
        yPos += 10;
      }
    }

    // Add friendly image analysis
    const rawAnalysis = Array.isArray(report?.imageAnalysis) ? report.imageAnalysis[index] : report?.imageAnalysis;
    const imageAnalysis = (typeof rawAnalysis === 'string' && rawAnalysis.trim())
      ? rawAnalysis
      : 'This photo shows your roof\'s current condition. We\'ve examined this area for signs of wear, damage, or potential issues that may need attention. Look for any visible signs mentioned in our recommendations section.';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 102, 0);
    doc.text('What This Photo Shows:', margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Split analysis into lines and add them to the PDF
    const lines = doc.splitTextToSize(imageAnalysis, pageWidth - 2*margin);
    lines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });
  });
}

export async function generatePDFReport(project: any, estimate: any, options?: { openInNewTab?: boolean; username?: string }) {
  console.log('=== PDF GENERATOR DEBUG: generatePDFReport ===');
  console.log('Project object passed in:', project);
  console.log('Estimate object passed in:', estimate);
  console.log('Estimate.report specifically:', estimate?.report);
  console.log('Estimate.formInputData:', estimate?.formInputData);
  console.log('Estimate.openaiResponse:', estimate?.openaiResponse);
  console.log('Options:', options);
  
  // Debug the stored data structures
  console.log('=== PDF GENERATOR: Data Analysis ===');
  if (estimate?.formInputData) {
    console.log('Form input data keys:', Object.keys(estimate.formInputData));
    console.log('Form input data size:', JSON.stringify(estimate.formInputData).length, 'characters');
    console.log('Form input userRole:', estimate.formInputData.userRole);
    console.log('Form input has location:', !!estimate.formInputData.location);
    console.log('Form input has inspector fields:', !!(estimate.formInputData.inspectorInfo || estimate.formInputData.inspectionDate));
    console.log('Form input has insurer fields:', !!(estimate.formInputData.claimNumber || estimate.formInputData.policyholderName));
    console.log('Form input has contractor fields:', !!(estimate.formInputData.jobType || estimate.formInputData.materialPreference));
    console.log('Form input has homeowner fields:', !!(estimate.formInputData.homeownerInfo || estimate.formInputData.urgency));
    } else {
    console.log('No form input data found in estimate');
  }
  
  if (estimate?.openaiResponse) {
    console.log('OpenAI response keys:', Object.keys(estimate.openaiResponse));
    console.log('OpenAI response size:', JSON.stringify(estimate.openaiResponse).length, 'characters');
    console.log('OpenAI response metadata:', estimate.openaiResponse.metadata);
    console.log('OpenAI response has actual response:', !!estimate.openaiResponse.response);
  } else {
    console.log('No OpenAI response data found in estimate');
  }
  
  const doc = new jsPDF();
  
  // Get images from localStorage
  const storedFiles = localStorage.getItem("estimation-upload");
  const uploadedFiles = storedFiles ? JSON.parse(storedFiles) : [];
  console.log('=== PDF GENERATOR: Image Data ===');
  console.log('Images found in localStorage:', uploadedFiles.length);
  
  // PAGE 1: BRANDING PAGE
  addBrandingPage(doc);
  
  // PAGE 2: Role-specific Report Content
  if (project.userRole === 'inspector') {
    doc.addPage();
    addInspectorReport(doc, project, estimate);
    
    // IMAGE PAGES: Add images from localStorage with annotations
    if (uploadedFiles.length > 0) {
      const geminiAnalysis = Array.isArray(estimate.imageAnalysis) && estimate.imageAnalysis.length > 0 ? estimate.imageAnalysis : undefined;
      const inspectorReportWithImages = {
        ...estimate.report,
        imageAnalysis: geminiAnalysis || estimate.report?.imageAnalysis,
        annotatedPhotographicEvidence: geminiAnalysis || estimate.report?.annotatedPhotographicEvidence
      };
      addInspectorImagePages(doc, uploadedFiles, inspectorReportWithImages, project.preferredLanguage || 'english');
    }
  } else if (project.userRole === 'insurance-adjuster') {
    doc.addPage();
    addInsuranceReport(doc, project, estimate);
    
    // Add insurance-specific image pages with damage annotations
    if (uploadedFiles.length > 0) {
      const geminiAnalysis = Array.isArray(estimate.imageAnalysis) && estimate.imageAnalysis.length > 0 ? estimate.imageAnalysis : undefined;
      const insuranceReportWithImages = {
        ...estimate.report,
        imageAnalysis: geminiAnalysis || estimate.report?.imageAnalysis,
        annotatedPhotos: geminiAnalysis || estimate.report?.annotatedPhotos
      };
      addInsuranceImagePages(doc, uploadedFiles, insuranceReportWithImages);
    }
  } else if (project.userRole === 'contractor') {
    doc.addPage();
    addContractorReport(doc, project, estimate);
    
    // Add contractor-specific image pages with repair indicators
    if (uploadedFiles.length > 0) {
      const contractorReportWithImages = { ...estimate.report, imageAnalysis: estimate.imageAnalysis || estimate.report?.imageAnalysis };
      addContractorImagePages(doc, uploadedFiles, contractorReportWithImages, project.preferredLanguage || 'english');
    }
  } else if (project.userRole === 'homeowner') {
    doc.addPage();
    addHomeownerReport(doc, project, estimate);
    
    // Add homeowner-friendly image pages with explanations
    if (uploadedFiles.length > 0) {
      const homeownerReportWithImages = { ...estimate.report, imageAnalysis: estimate.imageAnalysis || estimate.report?.imageAnalysis };
      addHomeownerImagePages(doc, uploadedFiles, homeownerReportWithImages);
    }
  }
  
  // LAST PAGE: BRANDING PAGE
  doc.addPage();
  addBrandingPage(doc);
  
  // Generate safe filename
  const safeProject = (project.name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeUser = options?.username ? options.username.replace(/[^a-z0-9]/gi, '_').toLowerCase() : '';
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = safeUser 
    ? `${safeUser}_${safeProject}_${timestamp}_FlacronBuild.pdf` 
    : `${safeProject}_${timestamp}_FlacronBuild.pdf`;

  // Generate PDF output ONCE and reuse it (this is expensive, so we cache it)
  const pdfBlob = doc.output('blob');
  const pdfBase64 = doc.output('datauristring');
  const pdfFileSize = pdfBlob.size;

  // Prepare structured data for Firebase storage
  const structuredData = {
    pdf: {
      fileName: fileName,
      fileSize: pdfFileSize,
      pdfBase64: pdfBase64,
      generatedAt: new Date().toISOString(),
      projectType: project.userRole || 'unknown',
      uploadedBy: options?.username || 'anonymous'
    },
    formInputData: estimate?.formInputData || null,
    openaiResponse: estimate?.openaiResponse || null,
    project: {
      id: project.id || null,
      name: project.name || null,
      userRole: project.userRole || null,
      type: project.type || null,
      location: project.location || null,
      area: project.area || null
    },
    estimate: {
      id: estimate.id || null,
      totalCost: estimate.totalCost || null,
      materialsCost: estimate.materialsCost || null,
      laborCost: estimate.laborCost || null,
      createdAt: estimate.createdAt || null
    }
  };

  console.log('=== PDF GENERATOR: Storing Structured Data ===');
  console.log('Structured data keys:', Object.keys(structuredData));
  console.log('Structured data size:', JSON.stringify(structuredData).length, 'characters');
  console.log('Has form input data:', !!structuredData.formInputData);
  console.log('Has OpenAI response:', !!structuredData.openaiResponse);

  // Save structured data to Firebase
  try {
    const user = auth.currentUser;
    if (user) {
      console.log('=== PDF GENERATOR: Saving to Firebase ===');
      
      // Sanitize the data to remove undefined values
      const sanitizedData = sanitizeForFirebase({
        ...structuredData,
        userId: user.uid,
        createdAt: new Date()
      });
      
      console.log('=== PDF GENERATOR: Data Sanitized for Firebase ===');
      console.log('Sanitized data keys:', Object.keys(sanitizedData));
      console.log('Sanitized data size:', JSON.stringify(sanitizedData).length, 'characters');
      
      const docRef = await addDoc(collection(db, "pdfs"), sanitizedData);
      console.log('Structured data saved to Firebase with ID:', docRef.id);
    } else {
      console.log('No authenticated user - structured data not saved to Firebase');
    }
  } catch (error: any) {
    console.error('Error saving structured data to Firebase:', error);
    console.error('Error details:', {
      name: error?.name,
      code: error?.code,
      message: error?.message
    });
    // Log the problematic data structure for debugging
    console.error('Data that failed to save:', JSON.stringify(structuredData, null, 2));
  }

  // Save or open the PDF (reuse the already-generated blob)
  if (options?.openInNewTab) {
    window.open(URL.createObjectURL(pdfBlob));
    } else {
    doc.save(fileName);
  }
  
  // Return metadata needed for response (reuse the already-generated values)
  return {
    pdfDoc: doc,
    fileName: fileName,
    fileSize: pdfFileSize,
    pdfBase64: pdfBase64,
    timestamp: new Date().toISOString(),
    projectType: project.userRole || 'unknown',
    uploadedBy: options?.username || 'anonymous',
    structuredData: structuredData
  };
}

function addBrandingPage(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Modern black background
  doc.setFillColor(33, 33, 33);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Top orange accent bar
  doc.setFillColor(255, 102, 0);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  // Bottom orange accent bar  
  doc.setFillColor(255, 102, 0);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  // Premium white content area
  const contentX = 20;
  const contentY = 35;
  const contentW = pageWidth - 40;
  const contentH = pageHeight - 70;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(contentX, contentY, contentW, contentH, 'F');
  
  // Company logo/name - FLACRON in black, BUILD in orange
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  
  // Calculate text positioning for split coloring
  const logoY = 75;
  const flacronText = 'FLACRON';
  const buildText = 'BUILD';
  
  // Measure text to position correctly
  const flacronWidth = doc.getTextWidth(flacronText);
  const buildWidth = doc.getTextWidth(buildText);
  const totalWidth = flacronWidth + buildWidth;
  const startX = (pageWidth - totalWidth) / 2;
  
  // FLACRON in black
  doc.setTextColor(33, 33, 33);
  doc.text(flacronText, startX, logoY);
  
  // BUILD in orange
  doc.setTextColor(255, 102, 0);
  doc.text(buildText, startX + flacronWidth, logoY);
  
  // Elegant separator line in orange
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(1.5);
  doc.line(pageWidth/2 - 35, 85, pageWidth/2 + 35, 85);
  
  // Professional subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(255, 102, 0);
  doc.text('ESTIMATE SMARTER. BUILD BETTER.', pageWidth/2, 100, { align: 'center' });
  
  // Premium tagline
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Advanced Analytics • Market Intelligence • Precision Estimates', pageWidth/2, 115, { align: 'center' });
  
  // Professional services section
  const servicesY = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text('PROFESSIONAL ROOFING INTELLIGENCE', pageWidth/2, servicesY, { align: 'center' });
  
  // Services list - clean professional layout, centered
  const services = [
    'Professional Inspector Reports & Certifications',
    'Insurance Adjuster Claims Documentation',
    'Contractor Project Specifications & Estimates', 
    'Homeowner-Friendly Explanations & Guidance'
  ];
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  services.forEach((service, i) => {
    const serviceY = servicesY + 12 + (i * 15);
    doc.text(service, pageWidth/2, serviceY, { align: 'center' });
  });
  
  // Value proposition section
  const valueY = 210;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 102, 0);
  doc.text('TRUSTED BY INDUSTRY LEADERS', pageWidth/2, valueY, { align: 'center' });
  
  // Key metrics in clean rows
  const metrics = [
    { value: '95%', label: 'Accuracy Rate' },
    { value: '10,000+', label: 'Projects Analyzed' },
    { value: '$2B+', label: 'Total Project Value' },
    { value: '500+', label: 'Partner Contractors' }
  ];
  
  // Two rows of metrics - properly centered
  const metricsStartY = valueY + 15;
  const rowHeight = 20;
  
  // First row (2 metrics)
  const firstRowY = metricsStartY;
  const spacing = pageWidth / 3;
  
  for (let i = 0; i < 2; i++) {
    const metric = metrics[i];
    const xPos = spacing * (i + 1);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 102, 0);
    doc.text(metric.value, xPos, firstRowY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(metric.label, xPos, firstRowY + 8, { align: 'center' });
  }
  
  // Second row (2 metrics)
  const secondRowY = metricsStartY + rowHeight;
  
  for (let i = 2; i < 4; i++) {
    const metric = metrics[i];
    const xPos = spacing * ((i - 2) + 1);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 102, 0);
    doc.text(metric.value, xPos, secondRowY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(metric.label, xPos, secondRowY + 8, { align: 'center' });
  }
  
  // Simple copyright footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('© FlacronBuild', pageWidth/2, pageHeight - 8, { align: 'center' });
}

function addInspectorReport(doc: jsPDF, project: any, estimate: any) {
  // Get user preferences
  const preferredLanguage = project.preferredLanguage || 'english';
  const preferredCurrency = project.preferredCurrency || 'USD';

  let y = 20;
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(getLocalizedText('professional_inspector_report', preferredLanguage), 20, y);
  doc.setTextColor(0, 0, 0);
  y += 10;
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(1);
  doc.line(20, y, 190, y);
  y += 15;
    
  // Inspector Name & Contact
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const minSpaceForSection = 90; // Minimum vertical space (mm) needed for a section header + content
  const ensureSpace = () => {
    if (y > pageHeight - minSpaceForSection) {
      doc.addPage();
      y = 20;
      doc.setTextColor(0, 0, 0);
    }
  };
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('inspector_certification', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const inspectorName = project.inspectorInfo?.name || getLocalizedText('inspector_name_not_provided', preferredLanguage);
  const inspectorLicense = project.inspectorInfo?.license || getLocalizedText('license_not_provided', preferredLanguage);
  doc.text(`${getLocalizedText('inspector', preferredLanguage)} ${inspectorName}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('license', preferredLanguage)} ${inspectorLicense}`, 20, y);
  y += 6;
  if (project.inspectorInfo?.contact?.trim()) {
    doc.text(`${getLocalizedText('contact', preferredLanguage)} ${project.inspectorInfo.contact.trim()}`, 20, y);
    y += 6;
  }
  y += 12;
  
  // Inspection Date & Time
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('inspection_details', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const inspectionDate = project.inspectionDate || getLocalizedText('date_not_provided', preferredLanguage);
  const weatherConditions = project.weatherConditions || getLocalizedText('weather_not_specified', preferredLanguage);
  doc.text(`${getLocalizedText('date', preferredLanguage)} ${inspectionDate}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('weather_conditions', preferredLanguage)} ${weatherConditions}`, 20, y);
  y += 12;
  
  // Address & GPS Coordinates
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('property_location', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const location = project.location;
  if (location && typeof location === 'object') {
    doc.text(`${getLocalizedText('address', preferredLanguage)} ${location.city}, ${location.country} ${location.zipCode}`, 20, y);
  } else {
    doc.text(`${getLocalizedText('address', preferredLanguage)} ${location || getLocalizedText('location_not_provided', preferredLanguage)}`, 20, y);
  }
  y += 12;
  
  // Structure Overview
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('structure_analysis', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getLocalizedText('type', preferredLanguage)} ${project.structureType || getLocalizedText('not_specified', preferredLanguage)}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('roof_pitch', preferredLanguage)} ${project.roofPitch || getLocalizedText('not_specified', preferredLanguage)}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('age', preferredLanguage)} ${project.roofAge || getLocalizedText('not_specified', preferredLanguage)} ${getLocalizedText('years', preferredLanguage)}`, 20, y);
  y += 6;
  const materialLayers = project.materialLayers?.join(', ') || getLocalizedText('not_specified', preferredLanguage);
  doc.text(`${getLocalizedText('materials', preferredLanguage)} ${materialLayers}`, 20, y, { maxWidth: 150 });
  y += 12;
          
          // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
    doc.setTextColor(0, 0, 0);
  }

  ensureSpace();

  // Slope-by-slope Condition Table
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('slope_by_slope_conditions', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (project.slopeDamage && project.slopeDamage.length > 0) {
    project.slopeDamage.forEach((damage: any, index: number) => {
      // Check if a new page is needed before each slope entry
      if (y > 240) {
        doc.addPage();
        y = 20;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(`${getLocalizedText('slope', preferredLanguage)} ${index + 1}: ${damage.slope || getLocalizedText('not_specified', preferredLanguage)}`, 20, y);
      y += 5;
      doc.text(`  ${getLocalizedText('damage_type', preferredLanguage)} ${damage.damageType || getLocalizedText('not_specified', preferredLanguage)}`, 25, y);
      y += 5;
      doc.text(`  ${getLocalizedText('severity', preferredLanguage)} ${damage.severity || getLocalizedText('not_specified', preferredLanguage)}`, 25, y);
      y += 5;
      // Calculate actual height of wrapped description text to prevent overlap
      const descText = `  ${getLocalizedText('description', preferredLanguage)} ${damage.description || getLocalizedText('no_description', preferredLanguage)}`;
      const descLines = doc.splitTextToSize(descText, 140);
      doc.text(descLines, 25, y);
      y += descLines.length * 5 + 4;
    });
  } else {
    doc.text(getLocalizedText('no_slope_damage', preferredLanguage), 20, y);
    y += 8;
  }
  y += 4;

  ensureSpace();

  // Roofing Components
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('roofing_components_assessment', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getLocalizedText('felt', preferredLanguage)} ${project.felt || getLocalizedText('not_specified', preferredLanguage)}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('ice_water_shield', preferredLanguage)} ${project.iceWaterShield ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage)}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('drip_edge', preferredLanguage)} ${project.dripEdge ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage)}`, 20, y);
  y += 6;
  doc.text(`${getLocalizedText('gutter_apron', preferredLanguage)} ${project.gutterApron ? getLocalizedText('present', preferredLanguage) : getLocalizedText('not_present', preferredLanguage)}`, 20, y);
  y += 6;
  if (project.pipeBoots && project.pipeBoots.length > 0) {
    const pipeBootsText = project.pipeBoots.map((boot: any) => `${boot.size} (${boot.quantity})`).join(', ');
    doc.text(`${getLocalizedText('pipe_boots', preferredLanguage)} ${pipeBootsText}`, 20, y);
    y += 6;
  }
  if (project.fascia?.condition?.trim()) {
    doc.text(`${getLocalizedText('fascia_condition', preferredLanguage)} ${project.fascia.condition.trim()}`, 20, y);
    y += 6;
  }
  if (project.gutter?.condition?.trim()) {
    doc.text(`${getLocalizedText('gutter_condition', preferredLanguage)} ${project.gutter.condition.trim()}`, 20, y);
    y += 6;
  }
  y += 12;

  ensureSpace();

  // Inspector Notes & Equipment
  doc.setFillColor(255, 102, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
  doc.text(getLocalizedText('inspector_notes_equipment', preferredLanguage), margin + 5, y + 6);
  y += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (project.accessTools && project.accessTools.length > 0) {
    doc.text(`${getLocalizedText('equipment_used', preferredLanguage)} ${project.accessTools.join(', ')}`, 20, y, { maxWidth: 150 });
    y += 8;
    } else {
    doc.text(`${getLocalizedText('equipment_used', preferredLanguage)} ${getLocalizedText('not_specified', preferredLanguage)}`, 20, y);
    y += 6;
  }
  if (project.ownerNotes) {
    doc.text(`${getLocalizedText('owner_notes', preferredLanguage)}`, 20, y);
    y += 6;
    const noteLines = doc.splitTextToSize(project.ownerNotes, 150);
    noteLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 5;
    });
  } else {
    doc.text(`${getLocalizedText('owner_notes', preferredLanguage)} ${getLocalizedText('none_provided', preferredLanguage)}`, 20, y);
  }
  y += 10;

  // ── Roofing Components Detailed Assessment (from AI) ──────────────────────
  const report = estimate?.report || {};
  const rca = report.roofingComponentsAssessment || {};
  const componentRows = [
    { label: 'Underlayment', value: rca.underlayment },
    { label: 'Ice & Water Shield', value: rca.iceWaterShield },
    { label: 'Drip Edge', value: rca.dripEdge },
    { label: 'Gutter Apron', value: rca.gutterApron },
    { label: 'Fascia', value: rca.fascia },
    { label: 'Gutters', value: rca.gutters },
  ].filter((row) => typeof row.value === 'string' && row.value.trim().length > 0);

  if (componentRows.length > 0) {
    y = addSectionHeader(doc, 'DETAILED COMPONENT ASSESSMENT', y, pageWidth, margin);
    doc.setFontSize(10);

    componentRows.forEach((row, idx) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }

      // Component title
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(`${row.label}:`, margin + 5, y);
      y += 5;

      // Component narrative
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const detailLines = doc.splitTextToSize(String(row.value).trim(), pageWidth - 2 * margin - 10);
      detailLines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin + 8, y);
        y += 5;
      });

      // Thin separator between component blocks for readability
      if (idx < componentRows.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin + 5, y + 1, pageWidth - margin - 5, y + 1);
        y += 5;
      } else {
        y += 3;
      }
    });
    y += 4;
  }

  // ── Repair Recommendations (from AI) ────────────────────────────────────
  const rr = report.repairRecommendations || {};
  if (rr.immediateActions?.length || rr.shortTerm?.length || rr.longTerm?.length) {
    y = addSectionHeader(doc, 'REPAIR RECOMMENDATIONS', y, pageWidth, margin);
    if (rr.immediateActions?.length) {
      y = addBulletList(doc, 'Immediate (0–30 days):', rr.immediateActions, margin, y, pageWidth, [200, 50, 50]);
    }
    if (rr.shortTerm?.length) {
      y = addBulletList(doc, 'Short-Term (30–90 days):', rr.shortTerm, margin, y, pageWidth, [180, 120, 0]);
    }
    if (rr.longTerm?.length) {
      y = addBulletList(doc, 'Long-Term Planning:', rr.longTerm, margin, y, pageWidth);
    }
    y += 5;
  }

  const totalCost = typeof estimate?.totalCost === 'string' ? parseFloat(estimate.totalCost) : (estimate?.totalCost || 0);
  const materialsCost = typeof estimate?.materialsCost === 'string' ? parseFloat(estimate.materialsCost) : (estimate?.materialsCost || 0);
  const laborCost = typeof estimate?.laborCost === 'string' ? parseFloat(estimate.laborCost) : (estimate?.laborCost || 0);
  const permitsCost = typeof estimate?.permitsCost === 'string' ? parseFloat(estimate.permitsCost) : (estimate?.permitsCost || 0);
  const contingencyCost = typeof estimate?.contingencyCost === 'string' ? parseFloat(estimate.contingencyCost) : (estimate?.contingencyCost || 0);
  const baseCost = Math.max(0, materialsCost + laborCost + permitsCost);
  const contingencyPct = baseCost > 0 ? ((contingencyCost / baseCost) * 100).toFixed(1) : '0.0';

  // ── Timeline & Contingency (cost-consistent narrative) ──────────────────
  const timeline = report.timeline || '';
  const contingency = report.contingencySuggestions || '';
  if (timeline || contingency) {
    y = addSectionHeader(doc, 'TIMELINE & CONTINGENCY', y, pageWidth, margin);
    if (timeline) y = addNarrative(doc, 'Timeline:', timeline, margin, y, pageWidth);
    const calculatedContingencyNarrative = `Calculated contingency for this estimate is ${formatCurrency(contingencyCost, preferredCurrency)} (${contingencyPct}% of base cost ${formatCurrency(baseCost, preferredCurrency)}).`;
    y = addNarrative(doc, 'Contingency:', calculatedContingencyNarrative, margin, y, pageWidth);
    if (contingency) y = addNarrative(doc, 'AI Contingency Note:', contingency, margin, y, pageWidth);
    y += 5;
  }

  // ── Cost Estimates ────────────────────────────────────────────────────────
  if (totalCost > 0) {
    y = addSectionHeader(doc, 'COST ESTIMATES', y, pageWidth, margin);

    const aiCost = report.costEstimates || {};
    const materialItems = Array.isArray(aiCost?.materials?.breakdown) ? aiCost.materials.breakdown : [];
    const fallbackLineItems = Array.isArray(project?.lineItems) ? project.lineItems : [];
    const displayMaterialItems = materialItems.length > 0
      ? materialItems
      : (fallbackLineItems.length > 0
        ? fallbackLineItems.map((name: string) => ({
            item: name,
            cost: materialsCost / fallbackLineItems.length
          }))
        : [{ item: 'Primary Roofing Materials', cost: materialsCost }]);
    const equipmentItems = Array.isArray(aiCost?.equipment?.items) ? aiCost.equipment.items : [];

    // Materials detailed list
    if (displayMaterialItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Materials Cost Breakdown', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      displayMaterialItems.forEach((item: any) => {
        if (y > pageHeight - 24) {
          doc.addPage();
          y = 20;
        }
        const itemName = item?.item || item?.category || 'Material';
        const itemCost = Number(item?.cost ?? item?.amount ?? 0);
        doc.text(`${itemName}`, margin + 4, y);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, preferredCurrency), pageWidth - margin, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 5;
      });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 2, y, pageWidth - margin, y);
      y += 5;
    }

    // Labor details
    const laborRate = Number(aiCost?.labor?.ratePerHour ?? (laborCost > 0 ? laborCost / 40 : 0));
    const laborHours = Number(aiCost?.labor?.totalHours ?? (laborRate > 0 ? laborCost / laborRate : 0));
    if (laborCost > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Labor Details', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (laborRate > 0) {
        doc.text(`Rate per Hour: ${formatCurrency(laborRate, preferredCurrency)}`, margin + 4, y);
        y += 5;
      }
      if (laborHours > 0) {
        doc.text(`Total Hours: ${laborHours}`, margin + 4, y);
        y += 5;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`Labor Subtotal: ${formatCurrency(laborCost, preferredCurrency)}`, margin + 4, y);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }

    // Equipment details
    if (equipmentItems.length > 0) {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Equipment Cost Breakdown', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      equipmentItems.forEach((item: any) => {
        const itemName = item?.item || 'Equipment';
        const itemCost = Number(item?.cost ?? 0);
        doc.text(itemName, margin + 4, y);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(itemCost, preferredCurrency), pageWidth - margin, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 5;
      });
      y += 2;
    }

    if (y > pageHeight - 32) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Base Subtotal (Materials + Labor + Permits): ${formatCurrency(baseCost, preferredCurrency)}`, margin + 4, y);
    y += 5;
    doc.text(`Contingency Amount (${contingencyPct}%): ${formatCurrency(contingencyCost, preferredCurrency)}`, margin + 4, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    // Final summary table
    y = addCostSummaryTable(doc, [
      { label: 'Materials', amount: materialsCost },
      { label: 'Labor', amount: laborCost },
      { label: 'Permits & Fees', amount: permitsCost },
      { label: `Contingency (${contingencyPct}%)`, amount: contingencyCost },
    ], totalCost, preferredCurrency, margin, y, pageWidth);
  }
}

function addInspectorImagePages(doc: jsPDF, uploadedFiles: any[], report?: any, preferredLanguage: string = 'english') {
  // Get annotations from the report
  let annotations: string[] = [];
  if (report && report.annotatedPhotographicEvidence) {
    annotations = report.annotatedPhotographicEvidence;
  }
  
  uploadedFiles.forEach((imageFile, index) => {
    doc.addPage();
    
    let y = 20;
    
    // Page title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(`${getLocalizedText('photographic_evidence', preferredLanguage)} ${index + 1}`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
    doc.setDrawColor(255, 102, 0);
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 15;
    
    // Image annotation
  doc.setFontSize(11);
    const annotation = annotations[index] || getLocalizedText('not_specified', preferredLanguage);
    const annotationLines = doc.splitTextToSize(annotation, 150);
    annotationLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 10;
    
    // Add the actual image
  if (imageFile && imageFile.data) {
    try {
        const imgWidth = 150;
        const imgHeight = 100;
        doc.addImage(imageFile.data, 'JPEG', 20, y, imgWidth, imgHeight);
        y += imgHeight + 10;
        
        // Image details
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Image: ${imageFile.name || 'Inspection Photo'}`, 20, y);
        y += 4;
        doc.text(`Size: ${Math.round(imageFile.size / 1024)} KB`, 20, y);
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
        doc.rect(20, y, 150, 100);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
        doc.text('[Image could not be loaded]', 25, y + 50);
    }
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
      doc.rect(20, y, 150, 100);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
      doc.text('[No image available]', 25, y + 50);
  }
  });
}
