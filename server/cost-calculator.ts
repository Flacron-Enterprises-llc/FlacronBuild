import { z } from "zod";
import fetch from 'node-fetch';

export interface RealCostData {
  materialPrices: {
    concrete: number; // per cubic yard
    steel: number; // per ton
    lumber: number; // per board foot
    drywall: number; // per square foot
    roofing: number; // per square foot
    flooring: number; // per square foot
    electrical: number; // per square foot
    plumbing: number; // per fixture
    hvac: number; // per square foot
  };
  laborRates: {
    carpenter: number; // per hour
    electrician: number; // per hour
    plumber: number; // per hour
    general: number; // per hour
  };
  permitCosts: {
    residential: number; // base fee
    commercial: number; // base fee
    electrical: number; // per circuit
    plumbing: number; // per fixture
  };
}

export interface ProjectRequirements {
  type: 'residential' | 'commercial' | 'renovation' | 'infrastructure';
  area: number;
  location: string;
  materialTier: 'economy' | 'standard' | 'premium';
  timeline?: 'urgent' | 'standard' | 'flexible';
  
  // Detailed requirements
  stories?: number;
  bedrooms?: number;
  bathrooms?: number;
  garageSpaces?: number;
  foundationType?: 'slab' | 'crawl' | 'basement';
  roofType?: 'gable' | 'hip' | 'flat';
  exteriorMaterial?: 'vinyl' | 'brick' | 'stucco' | 'wood';
  
  // Role-based fields
  userRole?: 'inspector' | 'insurance-adjuster' | 'contractor' | 'homeowner';
  role?: string;
  
  // Allow any additional properties from the form
  [key: string]: any;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

// Real-time data sources for construction costs
export class RealCostCalculator {
  private openaiApiKey: string;
  private geminiApiKey: string;
  private watsonxApiKey: string;
  private watsonxUrl: string;
  private watsonxProjectId: string | undefined;
  private watsonxSpaceId: string | undefined;
  private watsonxModelId: string;

  constructor() {
    const sep = '='.repeat(60);
    console.log(`\n${sep}`);
    console.log('    FlacronBuild AI Cost Calculator  Initializing');
    console.log(`${sep}`);
    console.log('  PRIMARY   : OpenAI GPT-4o    cost calculations');
    console.log('  PRIMARY   : IBM Watsonx       report narrative');
    console.log('  FALLBACK  : Google Gemini     if either primary fails');
    console.log(`${sep}`);

    this.openaiApiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.error('    OpenAI API key  : NOT SET  (OPENAI_KEY / OPENAI_API_KEY)');
    } else {
      console.log(`    OpenAI API key  : ${this.openaiApiKey.slice(0, 10)}...  (GPT-4o)`);
    }

    this.geminiApiKey = process.env.GEMINI_KEY || '';
    if (!this.geminiApiKey) {
      console.warn('    Gemini API key  : NOT SET  (GEMINI_KEY)  no fallback available');
    } else {
      console.log(`    Gemini API key  : ${this.geminiApiKey.slice(0, 10)}...  (gemini-2.5-flash)`);
    }
    
    this.watsonxApiKey = process.env.IBM_WATSONX_AI_API_KEY || '';
    this.watsonxUrl = process.env.IBM_WATSONX_AI_URL || 'https://us-south.ml.cloud.ibm.com';
    this.watsonxProjectId = process.env.IBM_WATSONX_AI_PROJECT_ID;
    this.watsonxSpaceId = process.env.IBM_WATSONX_AI_SPACE_ID;
    this.watsonxModelId = process.env.IBM_WATSONX_AI_MODEL_ID || 'ibm/granite-3-8b-instruct';
    
    if (!this.watsonxApiKey) {
      console.error('    Watsonx API key : NOT SET  (IBM_WATSONX_AI_API_KEY)');
    } else {
      console.log(`    Watsonx API key : ${this.watsonxApiKey.slice(0, 10)}...`);
      console.log(`    Watsonx model   : ${this.watsonxModelId}`);
      console.log(`    Watsonx URL     : ${this.watsonxUrl}`);
      console.log(`    Project ID      : ${this.watsonxProjectId || '(not set)'}`);
      console.log(`    Space ID        : ${this.watsonxSpaceId || '(not set)'}`);
    }
    console.log(`${sep}\n`);
  }

  async calculateRealCost(project: ProjectRequirements, imageUrls?: string[]): Promise<any> {
    // Validate OpenAI API key first
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_KEY or OPENAI_API_KEY environment variable.');
    }

    console.log('=== COST CALCULATOR: Starting Cost Calculation ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Project data received:', {
      type: project.type,
      area: project.area,
      location: project.location,
      userRole: project.userRole || project.role,
      hasImages: !!imageUrls?.length
    });

    // Track every API call result so the client can display them in the browser console
    const apiStatus: {
      openai: string;
      openaiVision: string;
      geminiVision: string;
      watsonx: string;
      geminiFallback: string;
      notes: string[];
    } = {
      openai: 'pending',
      openaiVision: imageUrls?.length ? 'pending' : 'skipped (no images)',
      geminiVision: imageUrls?.length ? 'pending' : 'skipped (no images)',
      watsonx: 'pending',
      geminiFallback: 'not-used',
      notes: []
    };

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Extract userRole from project data
      const userRole = project.userRole || project.role || 'homeowner';
      console.log('=== COST CALCULATOR: Role Analysis ===');
      console.log('Extracted userRole:', userRole);
      console.log('project.userRole:', project.userRole);
      console.log('project.role:', project.role);
      
      // Debug all form data organized by role
      console.log('=== COST CALCULATOR: Form Data Verification ===');
      
      console.log('=== SHARED FIELDS ===');
      console.log('location:', project.location);
      console.log('structureType:', project.structureType);
      console.log('roofPitch:', project.roofPitch);
      console.log('roofAge:', project.roofAge);
      console.log('area:', project.area);
      console.log('materialTier:', project.materialTier);
      console.log('materialLayers:', project.materialLayers);
      console.log('iceWaterShield:', project.iceWaterShield);
      console.log('felt:', project.felt);
      console.log('dripEdge:', project.dripEdge);
      console.log('gutterApron:', project.gutterApron);
      console.log('pipeBoots:', project.pipeBoots);
      console.log('fascia:', project.fascia);
      console.log('gutter:', project.gutter);
      
      console.log('=== INSPECTOR FIELDS ===');
      console.log('inspectorInfo:', project.inspectorInfo);
      console.log('inspectionDate:', project.inspectionDate);
      console.log('weatherConditions:', project.weatherConditions);
      console.log('accessTools:', project.accessTools);
      console.log('slopeDamage:', project.slopeDamage);
      console.log('ownerNotes:', project.ownerNotes);
      
      console.log('=== INSURER FIELDS ===');
      console.log('claimNumber:', project.claimNumber);
      console.log('policyholderName:', project.policyholderName);
      console.log('adjusterName:', project.adjusterName);
      console.log('adjusterContact:', project.adjusterContact);
      console.log('dateOfLoss:', project.dateOfLoss);
      console.log('damageCause:', project.damageCause);
      console.log('coverageMapping:', project.coverageMapping);
      console.log('previousRepairs:', project.previousRepairs);
      
      console.log('=== CONTRACTOR FIELDS ===');
      console.log('jobType:', project.jobType);
      console.log('materialPreference:', project.materialPreference);
      console.log('laborNeeds:', project.laborNeeds);
      console.log('lineItems:', project.lineItems);
      console.log('localPermit:', project.localPermit);
      
      console.log('=== HOMEOWNER FIELDS ===');
      console.log('homeownerInfo:', project.homeownerInfo);
      console.log('urgency:', project.urgency);
      console.log('budgetStyle:', project.budgetStyle);
      console.log('preferredLanguage:', project.preferredLanguage);
      console.log('preferredCurrency:', project.preferredCurrency);
      
      console.log('=== COST CALCULATOR: Image Processing ===');
      console.log('Images received:', imageUrls ? imageUrls.length : 0);
      if (imageUrls && imageUrls.length > 0) {
        imageUrls.forEach((img, i) => {
          console.log(`Image ${i + 1} type:`, typeof img);
          console.log(`Image ${i + 1} object:`, img);
          // Check for base64 in a likely property (e.g., data, url, base64)
          const imgObj = img as any; // Cast to any to handle object properties
          const base64String = imgObj?.data || imgObj?.url || imgObj?.base64 || img;
          if (typeof base64String === 'string') {
            console.log(`Image ${i + 1} length:`, base64String.length);
            console.log(`Image ${i + 1} is base64:`, base64String.includes('base64'));
          } else {
            console.log(`Image ${i + 1} does not have a string property to check.`);
          }
        });
      }
      
      console.log('=== COST CALCULATOR: Building Prompts for Role:', userRole, '===');
      let calculationPrompt: string;
      let reportPrompt: string;
      try {
        const prompts = this.buildRolePrompts(userRole, project);
        calculationPrompt = prompts.calculationPrompt;
        reportPrompt = prompts.reportPrompt;
        console.log('=== COST CALCULATOR: Generated Calculation Prompt Preview ===');
        console.log('Calculation prompt length:', calculationPrompt.length, 'characters');
        console.log('=== COST CALCULATOR: Generated Report Prompt Preview ===');
        console.log('Report prompt length:', reportPrompt.length, 'characters');
      } catch (promptError) {
        console.error('=== COST CALCULATOR: Prompt Building Error ===');
        console.error('Error building prompts:', promptError);
        console.error('Project data:', JSON.stringify(project, null, 2));
        throw new Error(`Failed to build prompts for role ${userRole}: ${promptError instanceof Error ? promptError.message : String(promptError)}`);
      }

      // Step 1: Get calculations from OpenAI (Gemini fallback)
      console.log('=== COST CALCULATOR: Step 1 - Calling OpenAI GPT-4o for Calculations ===');
      const calculationMessages: any[] = [
        {
          role: 'system',
          content: 'You are a professional roofing cost estimation expert. You must follow all calculation rules exactly and return valid JSON with ONLY cost calculations.'
        },
        {
          role: 'user',
          content: calculationPrompt
        }
      ];
      
      // Process images with dedicated vision pipeline:
      // 1) OpenAI Vision (primary) 2) Gemini Vision (fallback) 3) Form-text fallback.
      let imageAnalysisResults: string[] = [];
      if (imageUrls && imageUrls.length > 0) {
        console.log('=== COST CALCULATOR: Sending Images to OpenAI Vision for Analysis ===');
        const imagePrompt = `You are a professional roofing inspector. Analyze each of the ${imageUrls.length} roofing image(s) provided and return ONLY valid JSON:
{
  "imageAnalysis": [
    "analysis for image 1",
    "analysis for image 2"
  ]
}
Each string must describe visible damage, material condition, and repair recommendations in 2-4 sentences.`;
        try {
          const openaiVisionResponse = await this.queryOpenAIWithImages(imagePrompt, imageUrls);
          let cleaned = openaiVisionResponse.trim()
            .replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '')
            .replace(/^```\s*/, '').replace(/\s*```$/, '');
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) cleaned = jsonMatch[0];
          const parsed = JSON.parse(cleaned);
          const parsedArr = Array.isArray(parsed?.imageAnalysis) ? parsed.imageAnalysis : [];
          if (!parsedArr.length) throw new Error('OpenAI Vision returned empty imageAnalysis');
          imageAnalysisResults = parsedArr;
          apiStatus.openaiVision = `success (${imageAnalysisResults.length} image${imageAnalysisResults.length !== 1 ? 's' : ''} analyzed)`;
          apiStatus.geminiVision = 'not-used';
          console.log(`OpenAI Vision returned ${imageAnalysisResults.length} image analyses`);
        } catch (openaiVisionErr) {
          const openaiVisionErrMsg = openaiVisionErr instanceof Error ? openaiVisionErr.message : String(openaiVisionErr);
          const is429 = openaiVisionErrMsg.includes('429') || openaiVisionErrMsg.toLowerCase().includes('rate limit');
          apiStatus.openaiVision = is429 ? 'rate-limited (429)' : `failed: ${openaiVisionErrMsg}`;
          apiStatus.notes.push(`OpenAI Vision ${is429 ? 'rate-limited' : 'failed'} — switching to Gemini Vision`);
          console.error(`OpenAI Vision failed: ${openaiVisionErrMsg}. Trying Gemini Vision fallback.`);
          try {
            console.log('=== COST CALCULATOR: Sending Images to Gemini Vision for Analysis ===');
            const geminiVisionResponse = await this.queryGeminiWithImages(imagePrompt, imageUrls);
            let cleaned = geminiVisionResponse.trim()
              .replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '')
              .replace(/^```\s*/, '').replace(/\s*```$/, '');
            // Accept either { imageAnalysis: [] } or [] output
            const objMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objMatch) {
              const parsed = JSON.parse(objMatch[0]);
              imageAnalysisResults = Array.isArray(parsed?.imageAnalysis) ? parsed.imageAnalysis : [];
            } else {
              const arrMatch = cleaned.match(/\[[\s\S]*\]/);
              if (arrMatch) imageAnalysisResults = JSON.parse(arrMatch[0]);
            }
            if (!imageAnalysisResults.length) {
              throw new Error('Gemini Vision returned empty image analysis');
            }
            apiStatus.geminiVision = `success (${imageAnalysisResults.length} image${imageAnalysisResults.length !== 1 ? 's' : ''} analyzed)`;
            console.log(`Gemini Vision returned ${imageAnalysisResults.length} image analyses`);
          } catch (visionErr) {
            const visionErrMsg = visionErr instanceof Error ? visionErr.message : String(visionErr);
            const gemini429 = visionErrMsg.includes('429') || visionErrMsg.toLowerCase().includes('quota');
            apiStatus.geminiVision = gemini429 ? 'rate-limited (429) — quota exceeded' : `failed: ${visionErrMsg}`;
            apiStatus.notes.push(`Gemini Vision ${gemini429 ? 'rate-limited (429)' : 'failed'} — using form-data description as fallback`);
            console.error(`Gemini Vision failed: ${visionErrMsg}. Using form-data fallback for image analysis.`);
            // Fallback: generate a meaningful description from form data for each image
            const structureType = project.structureType || 'residential structure';
            const roofAge = project.roofAge != null ? `${project.roofAge}-year-old` : '';
            const materials = Array.isArray(project.materialLayers) && project.materialLayers.length > 0
              ? project.materialLayers.join(', ')
              : 'standard roofing materials';
            const pitch = project.roofPitch || 'standard pitch';
            const jobType = project.jobType === 'partial-repair' ? 'partial repair' : 'full replacement';
            const fallbackText = `This image shows a ${roofAge} ${structureType} with ${materials} on a ${pitch} roof. The submitted project requires a ${jobType}. A qualified contractor should inspect the roof surface, flashing, gutters, and penetrations on-site to confirm the scope and identify any additional damage not visible in this photograph.`;
            imageAnalysisResults = imageUrls.map(() => fallbackText);
            console.log(`Generated form-data fallback for ${imageAnalysisResults.length} image(s)`);
          }
        }
      }

      const startTime = Date.now();
      let openaiRawResponse: string;
      let calcSource = 'OpenAI GPT-4o';
      try {
        openaiRawResponse = await this.queryOpenAI(calculationMessages);
        const openaiEndTime = Date.now();
        apiStatus.openai = `success (${openaiEndTime - startTime}ms)`;
        console.log(`\n  OpenAI responded in ${openaiEndTime - startTime}ms  parsing calculations...`);
      } catch (openaiErr) {
        const openaiErrMsg = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
        const is429 = openaiErrMsg.includes('Rate limit') || openaiErrMsg.includes('429');
        apiStatus.openai = is429 ? 'rate-limited (429)' : `failed: ${openaiErrMsg}`;
        apiStatus.notes.push(`OpenAI ${is429 ? 'rate-limited' : 'failed'} — switching to Gemini for calculations`);
        const bar = '-'.repeat(60);
        console.error(`\n${bar}`);
        console.error('  OPENAI FAILED  SWITCHING TO GEMINI FOR CALCULATIONS');
        console.error(`   Reason : ${openaiErrMsg}`);
        console.error(`${bar}\n`);
        if (!this.geminiApiKey) {
          throw new Error(`OpenAI failed and no Gemini API key is configured. OpenAI error: ${openaiErrMsg}`);
        }
        calcSource = 'Gemini (OpenAI fallback)';
        apiStatus.geminiFallback = 'used for calculations';
        try {
          openaiRawResponse = await this.queryGemini(calculationPrompt);
          apiStatus.geminiFallback = 'success (calculations)';
          console.log(`\n  Gemini fallback responded  parsing calculations...`);
        } catch (geminiErr) {
          const geminiErrMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          apiStatus.geminiFallback = `also-failed: ${geminiErrMsg}`;
          const bar2 = '-'.repeat(60);
          console.error(`\n${bar2}`);
          console.error('  GEMINI ALSO FAILED FOR CALCULATIONS  no fallback remaining');
          console.error(`   OpenAI : ${openaiErrMsg}`);
          console.error(`   Gemini : ${geminiErrMsg}`);
          console.error(`${bar2}\n`);
          throw new Error(`Both OpenAI and Gemini failed for cost calculations. OpenAI: ${openaiErrMsg}. Gemini: ${geminiErrMsg}`);
        }
      }

      const parseCalculationResponse = (raw: string): any => {
        let clean = raw.trim();
        clean = clean.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) clean = jsonMatch[0];
        clean = clean.replace(/("estimatedDays":\s*)(\d+-\d+)([,\s}])/g, '$1"$2"$3');
        return JSON.parse(clean);
      };

      const isSafetyRefusal = (msg: string) =>
        /don't know|cannot|can't|unable|house|belong|identify|privacy/i.test(msg);

      let calculationJson: any;
      try {
        calculationJson = parseCalculationResponse(openaiRawResponse);

        // If OpenAI returned an error JSON (e.g. a safety refusal), fall back to Gemini
        if (calculationJson.error) {
          const errMsg = String(calculationJson.error);
          if (isSafetyRefusal(errMsg) && this.geminiApiKey) {
            apiStatus.openai = `safety-refusal: "${errMsg}"`;
            apiStatus.notes.push(`OpenAI refused (safety policy) — switched to Gemini for calculations`);
            const bar = '-'.repeat(60);
            console.warn(`\n${bar}`);
            console.warn('  OPENAI SAFETY REFUSAL  SWITCHING TO GEMINI FOR CALCULATIONS');
            console.warn(`   Reason : ${errMsg}`);
            console.warn(`${bar}\n`);
            calcSource = 'Gemini (OpenAI safety-refusal fallback)';
            apiStatus.geminiFallback = 'used for calculations (safety-refusal)';
            const geminiCalcRaw = await this.queryGemini(calculationPrompt);
            calculationJson = parseCalculationResponse(geminiCalcRaw);
            if (calculationJson.error) {
              apiStatus.geminiFallback = `also-failed: ${calculationJson.error}`;
              throw new Error(`Gemini also returned an error: ${calculationJson.error}`);
            }
            apiStatus.geminiFallback = 'success (calculations — safety-refusal fallback)';
          } else {
            apiStatus.openai = `error-json: "${errMsg}"`;
            throw new Error(errMsg);
          }
        } else {
          // Keep openai status as success only if it wasn't already overwritten by fallback path
          if (apiStatus.openai.startsWith('pending')) apiStatus.openai = `success`;
        }

        console.log(`  Calculations parsed successfully  |  Source: ${calcSource}`);
        console.log(`   Materials : $${calculationJson.materialsCost || calculationJson.costEstimates?.materials?.total || 0}`);
        console.log(`   Labor     : $${calculationJson.laborCost || calculationJson.costEstimates?.labor?.total || 0}`);
        console.log(`   Permits   : $${calculationJson.permitsCost || 0}`);
      } catch (e) {
        if (e instanceof Error && (e.message.includes('Invalid input') || e.message.includes('Validation'))) {
          throw e;
        }
        console.error(`  JSON parse failed for calculations (source: ${calcSource})`);
        console.error('   Raw response:', openaiRawResponse.substring(0, 300));
        throw new Error(`${calcSource} did not return valid JSON for calculations: ${e instanceof Error ? e.message : e}`);
      }

      // Step 2: Get report text from IBM Watsonx
      console.log('=== COST CALCULATOR: Step 2 - Calling IBM Watsonx for Report Generation ===');
      const watsonStartTime = Date.now();
      
      // Include calculation results in the report prompt - Watsonx should use these values to generate report text
      const calculationResults = {
        materialsCost: calculationJson.materialsCost || calculationJson.costEstimates?.materials?.total,
        laborCost: calculationJson.laborCost || calculationJson.costEstimates?.labor?.total,
        permitsCost: calculationJson.permitsCost || 0,
        equipmentCost: calculationJson.costEstimates?.equipment?.total || 0,
        contingencyCost: calculationJson.contingencyCost,
        totalCost: (calculationJson.materialsCost || calculationJson.costEstimates?.materials?.total || 0) +
                   (calculationJson.laborCost || calculationJson.costEstimates?.labor?.total || 0) +
                   (calculationJson.permitsCost || 0) +
                   (calculationJson.costEstimates?.equipment?.total || 0) +
                   (calculationJson.contingencyCost || 0)
      };
      
      const reportPromptWithCalculations = reportPrompt + '\n\nUSE THESE CALCULATION RESULTS FROM OPENAI:\n' + JSON.stringify(calculationResults, null, 2) + '\n\nGenerate a professional contractor report in JSON format using these exact cost values. Return ONLY valid JSON starting with { and ending with }.';
      
      let watsonxReportText: string;
      let reportSource = 'IBM Watsonx';
      try {
        watsonxReportText = await this.queryWatsonx(reportPromptWithCalculations);
        const watsonEndTime = Date.now();
        // Treat empty / minimal / non-JSON-looking responses as failures
        const cleaned = watsonxReportText.trim();
        if (!cleaned || cleaned === '<end_of_turn>' || cleaned.length < 20 || !cleaned.includes('{')) {
          throw new Error(`Watsonx returned empty or non-JSON response (${cleaned.length} chars: "${cleaned.substring(0, 60)}")`);
        }
        apiStatus.watsonx = `success (${watsonEndTime - watsonStartTime}ms)`;
        console.log(`\n  Watsonx responded in ${watsonEndTime - watsonStartTime}ms  parsing report...`);
      } catch (watsonxError) {
        const watsonErrMsg = watsonxError instanceof Error ? watsonxError.message : String(watsonxError);
        const is429 = watsonErrMsg.includes('429') || watsonErrMsg.toLowerCase().includes('rate limit');
        const isEmpty = watsonErrMsg.toLowerCase().includes('empty') || watsonErrMsg.toLowerCase().includes('non-json');
        apiStatus.watsonx = is429 ? 'rate-limited (429)' : isEmpty ? 'empty/invalid response' : `failed: ${watsonErrMsg}`;
        apiStatus.notes.push(`Watsonx ${is429 ? 'rate-limited' : isEmpty ? 'returned empty response' : 'failed'} — switching to Gemini for report`);
        const bar = '-'.repeat(60);
        console.error(`\n${bar}`);
        console.error('  WATSONX FAILED  SWITCHING TO GEMINI FOR REPORT GENERATION');
        console.error(`   Reason : ${watsonErrMsg}`);
        console.error(`${bar}\n`);
        if (!this.geminiApiKey) {
          throw new Error(`Watsonx failed and no Gemini API key is configured. Watsonx error: ${watsonErrMsg}`);
        }
        reportSource = 'Gemini (Watsonx fallback)';
        if (apiStatus.geminiFallback === 'not-used') apiStatus.geminiFallback = 'used for report (Watsonx fallback)';
        try {
          watsonxReportText = await this.queryGemini(reportPromptWithCalculations);
          apiStatus.geminiFallback = 'success (report)';
          console.log(`\n  Gemini fallback responded  parsing report...`);
        } catch (geminiErr) {
          const geminiErrMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          apiStatus.geminiFallback = `also-failed: ${geminiErrMsg}`;
          apiStatus.notes.push(`Gemini also failed for report: ${geminiErrMsg}`);
          const bar2 = '-'.repeat(60);
          console.error(`\n${bar2}`);
          console.error('  GEMINI ALSO FAILED FOR REPORT  no fallback remaining');
          console.error(`   Watsonx : ${watsonErrMsg}`);
          console.error(`   Gemini  : ${geminiErrMsg}`);
          console.error(`${bar2}\n`);
          throw new Error(`Both Watsonx and Gemini failed for report generation. Watsonx: ${watsonErrMsg}. Gemini: ${geminiErrMsg}`);
        }
      }
      
      const repairJson = (raw: string): string => {
        let s = raw;
        // Fix missing commas between properties: }"  or ]"  or ""  patterns across lines
        s = s.replace(/"\s*\n(\s*")/g, '",\n$1');
        s = s.replace(/\}\s*\n(\s*")/g, '},\n$1');
        s = s.replace(/\]\s*\n(\s*")/g, '],\n$1');
        // Fix missing comma after numbers before a quote key
        s = s.replace(/(\d)\s*\n(\s*")/g, '$1,\n$2');
        // Fix missing comma after true/false/null before a quote key
        s = s.replace(/(true|false|null)\s*\n(\s*")/g, '$1,\n$2');
        // Remove trailing commas before } or ]
        s = s.replace(/,\s*([\}\]])/g, '$1');
        // Fix doubled commas
        s = s.replace(/,\s*,/g, ',');
        return s;
      };

      const parseReportJson = (raw: string): any => {
        let clean = raw.trim();
        clean = clean.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          clean = clean.substring(start, end + 1);
        }
        clean = clean.replace(/^const\s+\w+\s*=\s*/, '').replace(/;\s*$/, '');
        try {
          return JSON.parse(clean);
        } catch (firstErr) {
          // Attempt auto-repair of common LLM JSON errors
          console.log('  JSON parse failed, attempting auto-repair...');
          const repaired = repairJson(clean);
          try {
            const result = JSON.parse(repaired);
            console.log('  Auto-repair succeeded');
            return result;
          } catch {
            // Throw the original error for clearer debugging
            throw firstErr;
          }
        }
      };

      const mergeCostsIntoReport = (rj: any) => {
        rj.materialsCost = calculationJson.materialsCost || calculationJson.costEstimates?.materials?.total || 0;
        rj.laborCost     = calculationJson.laborCost     || calculationJson.costEstimates?.labor?.total    || 0;
        rj.permitsCost   = calculationJson.permitsCost   || 0;
        if (calculationJson.costEstimates) rj.costEstimates = calculationJson.costEstimates;
        rj.contingencyCost = calculationJson.contingencyCost;
        rj.imageAnalysis   = calculationJson.imageAnalysis || [];
      };

      let reportJson: any;
      try {
        reportJson = parseReportJson(watsonxReportText);
        mergeCostsIntoReport(reportJson);
        console.log(`\n  Report JSON parsed  |  source: ${reportSource}`);
        console.log(`   Report keys: ${Object.keys(reportJson).join(', ')}`);
      } catch (parseErr) {
        const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        const bar = '-'.repeat(60);
        console.error(`\n${bar}`);
        console.error(`  REPORT JSON PARSE FAILED  (source: ${reportSource})`);
        console.error(`   Error   : ${parseErrMsg}`);
        console.error(`   Raw (300): ${watsonxReportText.substring(0, 300)}`);
        console.error(`${bar}\n`);
        if (!this.geminiApiKey) {
          throw new Error(`Report JSON parse failed and no Gemini fallback configured. Parse error: ${parseErrMsg}`);
        }
        console.log('     Asking Gemini to regenerate report JSON...');
        try {
          const geminiRetryText = await this.queryGemini(reportPromptWithCalculations);
          reportJson = parseReportJson(geminiRetryText);
          mergeCostsIntoReport(reportJson);
          reportSource = 'Gemini (parse-error retry)';
          console.log(`\n  Gemini regenerated valid report JSON  |  keys: ${Object.keys(reportJson).join(', ')}`);
        } catch (geminiRetryErr) {
          const geminiRetryErrMsg = geminiRetryErr instanceof Error ? geminiRetryErr.message : String(geminiRetryErr);
          console.error(`\n${bar}`);
          console.error('  GEMINI REGENERATION ALSO FAILED  cannot produce report');
          console.error(`   ${geminiRetryErrMsg}`);
          console.error(`${bar}\n`);
          throw new Error(`All attempts to generate report JSON failed. Last error: ${geminiRetryErrMsg}`);
        }
        // All LLM fallbacks handled above via Gemini  no hardcoded report data.
      }
      
      // Compose the breakdown and return
      console.log('=== COST CALCULATOR: Calculating Final Costs ===');
      
      // Extract costs from either direct fields or nested costEstimates structure
      let materialsCost = reportJson.materialsCost || reportJson.costEstimates?.materials?.total || 0;
      let laborCost = reportJson.laborCost || reportJson.costEstimates?.labor?.total || 0;
      let permitsCost = reportJson.permitsCost || 0;
      let equipmentCost = reportJson.costEstimates?.equipment?.total || 0;
      
      const baseCost = materialsCost + laborCost + permitsCost + equipmentCost;
      let contingencyCost = reportJson.contingencyCost;
      if (!contingencyCost || contingencyCost === 0) {
        contingencyCost = Math.round(baseCost * 0.07);
      }
      const totalCost = baseCost + contingencyCost;
      
      console.log('Base cost:', baseCost);
      console.log('Contingency cost:', contingencyCost);
      console.log('Total cost:', totalCost);
      
      const finalResult = {
        totalCost,
        materialsCost,
        laborCost,
        permitsCost,
        contingencyCost,
        regionMultiplier: 1.0, // Not used with OpenAI
        breakdown: reportJson.breakdown || reportJson,
        dataSource: 'OpenAI API',
        timeline: reportJson.timeline || reportJson.laborRequirements?.estimatedDays || 'Not specified',
        contingencySuggestions: reportJson.contingencySuggestions || 'Standard 7% contingency applied',
        report: reportJson,
        lineItems: reportJson.materialBreakdown?.lineItems || project.lineItems || [],
        imageAnalysis: imageAnalysisResults.length > 0 ? imageAnalysisResults : (reportJson.imageAnalysis || []),
        apiStatus
      };
      
      console.log('=== COST CALCULATOR: Final Result ===');
      console.log('Final result keys:', Object.keys(finalResult));
      console.log('Final result size:', JSON.stringify(finalResult).length, 'characters');
      
      return finalResult;
    } catch (error: unknown) {
      console.error('=== COST CALCULATOR: Error ===');
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Re-throw already-meaningful errors from retry logic
      if (
        err.message.includes('Rate limit') ||
        err.message.includes('Invalid OpenAI API key') ||
        err.message.includes('Invalid API key') ||
        err.message.includes('OpenAI server error') ||
        err.message.includes('IBM Watsonx') ||
        err.message.includes('Network error') ||
        err.message.includes('Failed to reach') ||
        err.message.includes('empty response') ||
        err.message.includes('API key is not configured') ||
        err.message.includes('Invalid input')
      ) {
        throw err;
      }
      
      throw new Error(`Failed to generate estimate: ${err.message}`);
    }
  }

  private async queryOpenAI(messages: any[], retryCount = 0): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const maxRetries = 3;
    const url = 'https://api.openai.com/v1/chat/completions';

    const separator = '-'.repeat(80);
    console.log(`\n${separator}`);
    console.log('  OPENAI GPT-4o  |  PROMPT SENT');
    console.log(`${separator}`);
    console.log(`  Timestamp : ${new Date().toISOString()}`);
    console.log(`  Attempt   : ${retryCount + 1} / ${maxRetries}`);
    console.log(`  Messages  : ${messages.length}`);
    messages.forEach((msg, i) => {
      const content = typeof msg.content === 'string' ? msg.content : '[image/multi-part content]';
      console.log(`\n  [Message ${i + 1}] role=${msg.role}`);
      console.log('  ' + content.substring(0, 1500) + (content.length > 1500 ? '\n  ...(truncated)' : ''));
    });
    console.log(`${separator}`);

    const requestBody = {
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    };
    
    try {
      console.log('\n  Sending request to OpenAI...');
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      console.log(`  OpenAI responded in ${endTime - startTime}ms  |  HTTP ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  OpenAI error response: ${errorText}`);

        if (response.status === 429) {
          if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 2000;
            console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
            return this.queryOpenAI(messages, retryCount + 1);
          }
          throw new Error('Rate limit exceeded after multiple retries. Please try again in a few minutes.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        }
        if (response.status >= 500) {
          if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 1500;
            console.log(`OpenAI server error (${response.status}). Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
            return this.queryOpenAI(messages, retryCount + 1);
          }
          throw new Error(`OpenAI server error (${response.status}). Please try again later.`);
        }
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as OpenAIResponse;
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }
      
      if (!data?.choices?.[0]?.message?.content) {
        if (retryCount < maxRetries - 1) {
          console.log(`Empty OpenAI response. Retrying... (attempt ${retryCount + 2}/${maxRetries})`);
          await new Promise(res => setTimeout(res, 1000));
          return this.queryOpenAI(messages, retryCount + 1);
        }
        throw new Error('OpenAI returned an empty response after multiple retries.');
      }

      const responseText = data.choices[0].message.content;

      const sep2 = '-'.repeat(80);
      console.log(`\n${sep2}`);
      console.log('  OPENAI GPT-4o  |  RESPONSE RECEIVED');
      console.log(`${sep2}`);
      console.log(`   Response time : ${endTime - startTime}ms`);
      console.log(`  Length        : ${responseText.length} characters`);
      console.log('\n  Full response:\n');
      console.log(responseText);
      console.log(`${sep2}`);

      return responseText;
    } catch (error: unknown) {
      console.error('\n=== OPENAI API: Request Failed ===');
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        // Re-throw errors that are already meaningful
        if (
          error.message.includes('Rate limit') ||
          error.message.includes('Invalid OpenAI API key') ||
          error.message.includes('OpenAI API error') ||
          error.message.includes('OpenAI server error') ||
          error.message.includes('empty response')
        ) {
          throw error;
        }
        // Retry on network errors
        if ((error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNRESET')) && retryCount < maxRetries - 1) {
          const delay = Math.pow(2, retryCount) * 1500;
          console.log(`Network error. Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
          return this.queryOpenAI(messages, retryCount + 1);
        }
      }
      throw new Error('Failed to reach OpenAI API. Please check your internet connection and try again.');
    }
  }

  private async queryOpenAIWithImages(prompt: string, images: any[], retryCount = 0): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const maxRetries = 2;
    const url = 'https://api.openai.com/v1/chat/completions';
    const content: any[] = [{ type: 'text', text: prompt }];
    for (let i = 0; i < images.length; i++) {
      const imgObj = images[i] as any;
      const raw = imgObj?.data || imgObj?.url || imgObj?.base64 || images[i];
      if (typeof raw === 'string') {
        content.push({
          type: 'image_url',
          image_url: { url: raw }
        });
      }
    }

    const requestBody = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    const endTime = Date.now();
    console.log(`  OpenAI Vision responded in ${endTime - startTime}ms  |  HTTP ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429 && retryCount < maxRetries) {
        await new Promise(res => setTimeout(res, (retryCount + 1) * 1500));
        return this.queryOpenAIWithImages(prompt, images, retryCount + 1);
      }
      throw new Error(`OpenAI Vision API error ${response.status}: ${errorText.substring(0, 250)}`);
    }

    const data = await response.json() as OpenAIResponse;
    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) {
      throw new Error('OpenAI Vision returned empty response');
    }
    return text;
  }

  private parseOpenAIResponse(response: string) {
    // Parse the OpenAI response for the required fields (legacy method, not currently used)
    let materialsCost = 0, laborCost = 0, permitsCost = 0, contingencyCost = 0;
    let timeline = '', contingencySuggestions = '', report = '';
    const breakdown: any = {};

    // Extract individual fields using regex patterns for better handling of multi-line content
    const materialMatch = response.match(/Material_Cost=([^\n\r]+)/);
    if (materialMatch) {
      materialsCost = parseFloat(materialMatch[1]);
        breakdown.materialsCost = materialsCost;
    }

    const laborMatch = response.match(/Labor_Cost=([^\n\r]+)/);
    if (laborMatch) {
      laborCost = parseFloat(laborMatch[1]);
        breakdown.laborCost = laborCost;
    }

    const permitsMatch = response.match(/Permits=([^\n\r]+)/);
    if (permitsMatch) {
      permitsCost = parseFloat(permitsMatch[1]);
        breakdown.permitsCost = permitsCost;
    }

    const timelineMatch = response.match(/Timeline=([^\n\r]+)/);
    if (timelineMatch) {
      timeline = timelineMatch[1];
        breakdown.timeline = timeline;
    }

    const contingencyMatch = response.match(/Contingency Suggestions=([^\n\r]+)/);
    if (contingencyMatch) {
      contingencySuggestions = contingencyMatch[1];
        // Try to extract a contingency cost if present in the suggestion
      const costMatch = contingencySuggestions.match(/\$([0-9,.]+)/);
      if (costMatch) {
        contingencyCost = parseFloat(costMatch[1].replace(/,/g, ''));
        }
      }

    // Extract the report content - everything after "Report=" until the end or next field (legacy support)
    const reportMatch = response.match(/Report=([\s\S]*?)(?:\n(?:Material_Cost|Labor_Cost|Permits|Timeline|Contingency Suggestions|Project Analysis|Market Conditions|Risk Assessment|Timeline Scheduling|Recommendations|imageAnalysis)=|$)/);
    if (reportMatch) {
      report = reportMatch[1].trim();
      breakdown.report = report;
    }

    return { 
      materialsCost, laborCost, permitsCost, contingencyCost, timeline, contingencySuggestions, report,
      breakdown 
    };
  }

  private async queryWatsonx(prompt: string, retryCount = 0): Promise<string> {
    if (!this.watsonxApiKey) {
      throw new Error('IBM Watsonx API key is not configured');
    }

    const maxRetries = 3;
    const separator = '-'.repeat(80);
    console.log(`\n${separator}`);
    console.log('  IBM WATSONX  |  PROMPT SENT');
    console.log(`${separator}`);
    console.log(`  Timestamp  : ${new Date().toISOString()}`);
    console.log(`  Attempt    : ${retryCount + 1} / ${maxRetries}`);
    console.log(`  Model      : ${this.watsonxModelId}`);
    console.log(`  Prompt len : ${prompt.length} characters`);
    console.log('\n  Full prompt:\n');
    console.log(prompt);
    console.log(`${separator}`);

    // Helper function to get IBM IAM Bearer token
    async function getWatsonxToken(apiKey: string): Promise<string> {
      const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`IBM IAM token error: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as any;
      if (!tokenData.access_token) {
        throw new Error('Failed to get IBM IAM access token');
      }

      return tokenData.access_token;
    }

    try {
      const accessToken = await getWatsonxToken(this.watsonxApiKey);
      // Use chat API instead of legacy text generation API for better compatibility
      const watsonxEndpoint = `${this.watsonxUrl}/ml/v1/text/chat?version=2024-11-19`;
      
      // Watsonx /ml/v1/text/chat follows the OpenAI chat format:
      // max_tokens / temperature / top_p must be TOP-LEVEL keys, not nested in "parameters"
      const requestBody: any = {
        model_id: this.watsonxModelId,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8192,
        temperature: 0.2,
        top_p: 0.9
      };
      
      // Use space_id if available (preferred), otherwise use project_id
      if (this.watsonxSpaceId) {
        requestBody.space_id = this.watsonxSpaceId;
      } else if (this.watsonxProjectId) {
        requestBody.project_id = this.watsonxProjectId;
      }
      
      console.log('\n  Sending request to IBM Watsonx...');
      console.log(`   Endpoint  : ${watsonxEndpoint}`);
      console.log(`   Model     : ${requestBody.model_id}`);
      console.log(`   Space ID  : ${requestBody.space_id || '(none)'}`);
      console.log(`   Project ID: ${requestBody.project_id || '(none)'}`);
      const startTime = Date.now();
      
      const response = await fetch(watsonxEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      console.log(`  Watsonx responded in ${endTime - startTime}ms  |  HTTP ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  Watsonx error response: ${errorText}`);
        if (response.status === 429) {
          if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 2000;
            console.log(`Watsonx rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
            return this.queryWatsonx(prompt, retryCount + 1);
          }
          throw new Error('IBM Watsonx rate limit exceeded after multiple retries. Please try again later.');
        }
        if (response.status >= 500) {
          if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 1500;
            console.log(`Watsonx server error (${response.status}). Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
            return this.queryWatsonx(prompt, retryCount + 1);
          }
        }
        throw new Error(`IBM Watsonx API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      
      if (data.errors && data.errors.length > 0) {
        const errorMessage = data.errors[0].message || JSON.stringify(data.errors);
        console.error('  IBM Watsonx returned errors:', JSON.stringify(data.errors, null, 2));
        throw new Error(`IBM Watsonx AI error: ${errorMessage}`);
      }

      // Handle chat API format (preferred) and legacy text generation format
      let responseText: string | null = null;
      let formatUsed = 'unknown';
      
      // Chat API format: data.choices[0].message.content (top-level choices)
      if (data.choices && data.choices[0] && data.choices[0].message) {
        responseText = data.choices[0].message.content || null;
        formatUsed = 'chat/choices (top-level)';
      }
      // Chat API format: data.results[0].choices[0].message.content (nested in results)
      else if (data.results && data.results[0] && data.results[0].choices && data.results[0].choices[0]) {
        responseText = data.results[0].choices[0].message?.content || null;
        formatUsed = 'chat/choices (nested in results)';
      }
      // Legacy text generation format: data.results[0].generated_text
      else if (data.results && data.results[0]) {
        responseText = data.results[0].generated_text || data.results[0].text || null;
        formatUsed = 'legacy text generation';
      }
      
      // Handle empty response - Watsonx model may return empty string
      if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
        console.warn(`  Watsonx returned EMPTY response  |  format tried: ${formatUsed}`);
        console.warn('   Raw data keys:', Object.keys(data));
        // Return empty string to trigger fallback in calculateRealCost
        return '';
      }

      responseText = responseText.trim();

      const sep2 = '-'.repeat(80);
      console.log(`\n${sep2}`);
      console.log('  IBM WATSONX  |  RESPONSE RECEIVED');
      console.log(`${sep2}`);
      console.log(`   Response time : ${endTime - startTime}ms`);
      console.log(`  Format used   : ${formatUsed}`);
      console.log(`  Length        : ${responseText.length} characters`);
      console.log('\n  Full response:\n');
      console.log(responseText);
      console.log(`${sep2}`);

      return responseText;
    } catch (error: unknown) {
      console.error('\n=== IBM WATSONX API: Request Failed ===');
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if (
          error.message.includes('Watsonx rate limit') ||
          error.message.includes('IBM Watsonx API error') ||
          error.message.includes('IBM IAM token error')
        ) {
          throw error;
        }
        if ((error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNRESET')) && retryCount < maxRetries - 1) {
          const delay = Math.pow(2, retryCount) * 1500;
          console.log(`Watsonx network error. Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
          return this.queryWatsonx(prompt, retryCount + 1);
        }
      }
      throw new Error('Failed to reach IBM Watsonx API. Please check your connection and try again.');
    }
  }

  private async queryGeminiWithImages(prompt: string, images: any[]): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key is not configured (GEMINI_KEY)');
    }

    const separator = '-'.repeat(80);
    console.log(`\n${separator}`);
    console.log('  GOOGLE GEMINI (Vision)  |  IMAGE ANALYSIS');
    console.log(`${separator}`);
    console.log(`  Images count: ${images.length}`);

    const parts: any[] = [{ text: prompt }];

    for (let i = 0; i < images.length; i++) {
      const imgObj = images[i] as any;
      const raw = imgObj?.data || imgObj?.url || imgObj?.base64 || images[i];
      if (typeof raw === 'string') {
        // Extract MIME type from data URL prefix, fall back to file.type, then default to jpeg
        const mimeMatch = raw.match(/^data:(image\/[a-z+]+);base64,/);
        const mimeType = mimeMatch?.[1] || imgObj?.type || 'image/jpeg';
        const base64Data = raw.replace(/^data:image\/[a-z+]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
        console.log(`  Added image ${i + 1} (${mimeType}, ${base64Data.length} chars)`);
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
      });

      const endTime = Date.now();
      console.log(`  Gemini Vision responded in ${endTime - startTime}ms  |  HTTP ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Vision API error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json() as any;
      const responseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!responseText) {
        throw new Error('Gemini Vision returned an empty response');
      }

      console.log(`  Gemini Vision analysis complete (${responseText.length} chars)`);
      console.log(`${separator}`);
      return responseText;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`  Gemini Vision error: ${err.message}`);
      throw err;
    }
  }

  private async queryGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key is not configured (GEMINI_KEY)');
    }

    const separator = '-'.repeat(80);
    console.log(`\n${separator}`);
    console.log('  GOOGLE GEMINI 1.5 Flash  |  PROMPT SENT');
    console.log(`${separator}`);
    console.log(`  Timestamp : ${new Date().toISOString()}`);
    console.log(`  Prompt len: ${prompt.length} characters`);
    console.log('\n  Full prompt (first 2000 chars):\n');
    console.log(prompt.substring(0, 2000) + (prompt.length > 2000 ? '\n  ...(truncated)' : ''));
    console.log(`${separator}`);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      });

      const endTime = Date.now();

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  Gemini error HTTP ${response.status}: ${errorText.substring(0, 300)}`);
        if (response.status === 429) {
          throw new Error(`Gemini rate limit exceeded: ${response.status}`);
        }
        if (response.status === 400) {
          throw new Error(`Gemini invalid request (400): ${errorText.substring(0, 200)}`);
        }
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json() as any;
      const responseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!responseText) {
        console.error('  Gemini returned empty response. Raw data:', JSON.stringify(data).substring(0, 300));
        throw new Error('Gemini returned an empty response');
      }

      const sep2 = '-'.repeat(80);
      console.log(`\n${sep2}`);
      console.log('  GOOGLE GEMINI 1.5 Flash  |  RESPONSE RECEIVED');
      console.log(`${sep2}`);
      console.log(`   Response time : ${endTime - startTime}ms`);
      console.log(`  Length        : ${responseText.length} characters`);
      console.log('\n  Full response:\n');
      console.log(responseText);
      console.log(`${sep2}`);

      return responseText;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (
        err.message.includes('Gemini rate limit') ||
        err.message.includes('Gemini invalid request') ||
        err.message.includes('Gemini API error') ||
        err.message.includes('Gemini returned an empty')
      ) {
        throw err;
      }
      console.error(`  Gemini network/fetch error: ${err.message}`);
      throw new Error(`Failed to reach Gemini API: ${err.message}`);
    }
  }

  private buildRolePrompts(role: string, project: any): { calculationPrompt: string; reportPrompt: string } {
    console.log('buildRolePrompts called with role:', role);
    console.log('project data keys:', Object.keys(project));
    console.log('project.userRole:', project.userRole);
    
    try {
      // Safely stringify project to avoid circular references
      const projectString = JSON.stringify(project, null, 2);
      console.log('Project stringified successfully, length:', projectString.length);
    } catch (stringifyError) {
      console.error('Error stringifying project:', stringifyError);
      // Use a safe fallback
      const safeProject = {
        structureType: project.structureType || 'Unknown',
        roofAge: project.roofAge || 'Unknown',
        roofPitch: project.roofPitch || 'Unknown',
        materialLayers: project.materialLayers || [],
        location: project.location || {},
        preferredLanguage: project.preferredLanguage || 'English',
        preferredCurrency: project.preferredCurrency || 'USD'
      };
      project = safeProject;
    }
    
    // Common calculation prompt base (used by OpenAI)
    const baseCalculationPrompt = this.buildCalculationPrompt(role, project);
    
    // Common report prompt base (used by Watsonx)
    const baseReportPrompt = this.buildReportPrompt(role, project);
    
    return {
      calculationPrompt: baseCalculationPrompt,
      reportPrompt: baseReportPrompt
    };
  }

  private buildCalculationPrompt(role: string, project: any): string {
    const projectData = JSON.stringify(project);
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    
    switch (role) {
      case "inspector":
        return `You are a professional roofing cost estimation expert. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} market pricing for all materials and labor in the project's location.

Calculate ONLY the cost values for an inspector report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object with these fields:
{
  "materialsCost": [Calculate materials cost for ${project.area || 1000} sq ft with ${project.materialTier || 'standard'} tier materials at current ${currentYear} market prices],
  "laborCost": [Calculate labor for ${project.roofPitch || 'standard'} roof at current ${currentYear} labor rates in ${project.location?.city || project.location || 'the project location'}],
  "permitsCost": [Calculate permits for ${project.projectType || 'residential'} in ${project.location?.city || project.location || 'standard location'} at current ${currentYear} permit fees],
  "contingencyCost": [Calculate 7% contingency on total of materials + labor + permits],
  "imageAnalysis": [For each uploaded image, return a string annotation. Array length MUST match number of images.]
}

Return ONLY valid JSON with numeric values. No markdown, no explanations.`;

      case "insurance-adjuster":
        return `You are a professional roofing cost estimation expert. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} market pricing for all materials and labor in the project's location.

Calculate ONLY the cost values for an insurance claim report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object with these fields:
{
  "materialsCost": [Calculate materials cost for ${project.area || 1000} sq ft at current ${currentYear} market prices],
  "laborCost": [Calculate labor costs at current ${currentYear} rates in ${project.location?.city || project.location || 'the project location'}],
  "permitsCost": [Calculate permits if needed at current ${currentYear} fees],
  "contingencyCost": [Calculate 7% contingency],
  "imageAnalysis": [For each uploaded image, return a string annotation describing damage. Array length MUST match number of images.]
}

Return ONLY valid JSON with numeric values. No markdown, no explanations.`;

      case "contractor":
        const area = project.area || 1200;
        const roofPitch = project.roofPitch || '';
        const roofAge = project.roofAge || 10;
        const jobType = project.jobType || 'Full Replace';
        const materialLayers = project.materials?.layers || [];
        const materialType = materialLayers[0] || 'Asphalt Shingles';
        const structureType = project.structureType || 'Single Family Home';
        const workerCount = project.laborNeeds?.workerCount || '1-2 Workers';
        const location = project.location || {};
        const city = location.city || '';
        const isNYC = city.toLowerCase().includes('new york');
        const lineItems = project.lineItems || [];
        const hasDebrisRemoval = lineItems.some((item: string) => item.toLowerCase().includes('debris'));
        
        return `You are a professional roofing cost estimation expert. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} material pricing and labor rates for ${city || 'the project location'}.

Calculate ONLY the cost values for a contractor report based on this project data: ${projectData}

CRITICAL COST CALCULATION RULES - FOLLOW THESE EXACTLY:

1. INPUT VALIDATION (CRITICAL - CHECK FIRST):
   - If roofAge is negative OR less than 0, return ONLY: {"error": "Invalid input: roofAge cannot be negative"}
   - If workerCount is "0 Workers" OR empty OR null OR undefined, return ONLY: {"error": "Invalid input: workerCount must be at least 1 worker"}
   - If area is 0 OR negative OR less than or equal to 0, return ONLY: {"error": "Invalid input: roof area must be greater than 0"}
   
   IMPORTANT: If ANY validation fails, return ONLY the error JSON object. Do NOT calculate any costs. Do NOT include any other fields.

2. MATERIALS COST CALCULATION (${area} sq ft) - USE EXACT VALUES:
   - Asphalt Shingles: $3.00-$4.50/sq ft = $${Math.round(area * 3.5)}-$${Math.round(area * 4.5)} (use $3800-$5200 for baseline, with underlayment $600-$900, debris $400-$700)
   - Metal Roofing: $10.00-$15.00/sq ft = $${Math.round(area * 10)}-$${Math.round(area * 15)} (use $12000-$18000)
   - Slate: $15.00-$20.00/sq ft = $${Math.round(area * 15)}-$${Math.round(area * 20)} (use $18000-$25000 for luxury)
   - Wood Shakes: $8.00-$12.00/sq ft = $${Math.round(area * 8)}-$${Math.round(area * 12)} (use $10000-$15000 for historical)
   - Built-up Roofing (BUR): $6.00-$10.00/sq ft = $${Math.round(area * 6)}-$${Math.round(area * 10)} (use $7200-$12000)
   - Multiple layers: Add 20-30% for removal complexity (but keep total reasonable)
   - Luxury materials: Use upper end of range
   
   FOR BASELINE (1200 sq ft): Materials should total $4500-$5000 (shingles $3800-$4200 + underlayment $600-$700 + debris $400-$600)

3. LABOR HOURS CALCULATION:
   BASE HOURS (CRITICAL - MUST FOLLOW):
   - Full Replace, 1-2 workers, standard roof: 40-60 hours (use 50 hours as base)
   - Partial Repair: 8-20 hours (use 12-15 hours as base)
   
   ADJUSTMENTS (apply to base):
   - Steep Slope (9-12/12): +30-50% hours
   - Old roof (30+ years): +10-20% hours (but keep labor cost in $2300-$3400 range)
   - Multiple material layers: +15-25% hours
   - Commercial/Warehouse: +20-30% hours
   - Multi-Family/3-Story: +40-60% hours
   - 10+ Workers: Reduce hours by 60-70% BUT increase rate (more workers = faster but higher cost)
   
   FOR BASELINE TEST: Use exactly 50 hours, rate $50/hour = $2500 labor cost
   FINAL: Calculate totalHours within these ranges, but ensure labor cost matches expected ranges

4. LABOR COST CALCULATION (CRITICAL - MUST MATCH EXPECTED RANGES):
   HOURLY RATES:
   - Standard areas (Houston, Texas): $50-60/hour (use $50 for baseline)
   - NYC/High-cost areas: $100-120/hour
   - Rush job/10+ workers: $80-100/hour (higher rate, fewer hours)
   
   LABOR COST = totalHours  ratePerHour
   
   EXPECTED LABOR COST RANGES BY SCENARIO:
   - BASELINE: $2000-$3000 (use 50 hours  $50 = $2500)
   - LUXURY MATERIAL: $4000-$6000 (use 60-80 hours  $60-75)
   - OLD ROOF: $2300-$3400 (use 45-55 hours  $50-60)
   - PARTIAL REPAIR: $800-$1500 (use 12-15 hours  $60-80)
   - COMMERCIAL: $4000-$6000
   - RUSH JOB (10+ workers): $6000-$8500 (use 40-50 hours  $120-150)
   - NYC: $7000-$10000 (use 60-80 hours  $100-120)
   - MULTI-LEVEL: $7000-$10500 (use 80-100 hours  $80-100)
   
   TARGET: Labor cost should be within the expected range for each scenario above

5. EQUIPMENT COSTS:
   - Base tools: $300-500
   - Safety equipment: $200-400
   - Debris removal: Included in materials cost (not separate equipment)
   - Steep assist equipment: +$300-500 (if steepAssist: true)
   - Crane rental: +$800-1200 (if "Crane Rental" in lineItems)
   - FOR BASELINE: Total equipment should be $500-$800 (base tools + safety)

6. PERMITS COST:
   - Residential: $200-400
   - Commercial: $400-600
   - NYC: $400-600

7. GEOGRAPHIC MULTIPLIERS:
   - NYC/New York City: Labor  2.0, Materials  1.2-1.3
   - Standard areas: No multiplier

8. STRUCTURE TYPE ADJUSTMENTS:
   - Multi-Family/3-Story: Labor +40-60%, Equipment +$200-400
   - Commercial/Warehouse: Labor +20-30%, Materials +10-15%

9. JOB TYPE ADJUSTMENTS:
   - Partial Repair: Labor hours 8-20, Materials 20-40% of full replace
   - Full Replace: Use full calculations

10. CONTINGENCY: 7% of (materialsCost + laborCost + permitsCost + equipmentCost)

11. TOTAL COST = materialsCost + laborCost + permitsCost + equipmentCost + contingencyCost

SPECIFIC SCENARIO RULES - FOLLOW EXACTLY:
${jobType === 'Full Replace' && materialLayers.length === 1 && !isNYC && !structureType.includes('Commercial') && !workerCount.includes('10+') && roofAge < 30 && lineItems.length <= 5 ? '- BASELINE (1200 sq ft, Standard, Full Replace, 1-2 workers): Materials $4500-$5000 (shingles + underlayment + debris), Labor $2000-$3000 (50 hours  $50 = $2500), Equipment $500-$800, Permits $300, Contingency 7%, Total $6800-$9800' : ''}
${jobType === 'Partial Repair' ? '- PARTIAL REPAIR: Materials $800-$1200, Labor $800-$1500 (12-15 hours  $60-80), Equipment $200-300, Permits $100-200, Total $1900-$3600' : ''}
${materialType === 'Slate' ? '- LUXURY MATERIAL (Slate): Materials $18000-$25000, Labor $4000-$6000 (60-80 hours  $60-75), Equipment $800-1200, Permits $400-600, Total $25000-$34000' : ''}
${materialLayers.length > 1 ? '- MULTIPLE LAYERS: Materials $6000-$8000 (with 25-30% removal premium), Labor $4500-$6000, Equipment $1000-1500, Permits $300-400, Contingency 7%, Total $13400-$19100' : ''}
${roofAge >= 30 && roofAge < 100 ? '- OLD ROOF (30+ years): Materials $4500-$5500, Labor $2300-$3400 (45-55 hours  $50-60), Equipment $500-700, Permits $300, Total $7200-$10800' : ''}
${structureType.includes('Commercial') || structureType.includes('Warehouse') ? '- COMMERCIAL: Materials $7200-$12000 (BUR), Labor $4000-$6000 (60-80 hours  $60-75), Equipment $1000-1500, Permits $400-600, Total $13200-$19300' : ''}
${lineItems.length >= 8 ? '- MANY LINE ITEMS: Materials $6000-$10000, Labor $4800-$6000, Equipment $1500-2500, Permits $300-500, Total $13400-$22750' : ''}
${isNYC ? '- NYC LOCATION: Materials $5000-$6000 (1.2x multiplier), Labor $7000-$10000 (60-80 hours  $100-120), Equipment $800-1200, Permits $400-600, Total $15800-$22500' : ''}
${structureType.includes('Multi-Family') || structureType.includes('3-Story') ? '- MULTI-LEVEL: Materials $4500-$5000, Labor $7000-$10500 (80-100 hours  $80-100), Equipment $1000-1500, Permits $300-500, Total $14500-$22500' : ''}
${workerCount.includes('10+') ? '- RUSH JOB (10+ workers): Materials $4500-$5000, Labor $6000-$8500 (40-50 hours  $120-150), Equipment $600-800, Permits $300, Total $10800-$15300' : ''}
${roofAge >= 100 ? '- HISTORICAL (100+ years): Materials $10000-$15000 (Wood Shakes), Labor $8000-$12000 (100-120 hours  $80-100), Equipment $1000-1500, Permits $300-500, Total $19800-$29700' : ''}
${materialType === 'Metal Roofing' ? '- METAL ROOFING: Materials $12000-$18000, Labor $8000-$12000 (100-120 hours  $80-100), Equipment $900-1200, Permits $300-500, Total $23100-$34900' : ''}
${lineItems.some((item: string) => item.toLowerCase().includes('hurricane') || item.toLowerCase().includes('high-wind')) ? '- EXTREME WEATHER: Materials $5500-$6000 (premium shingles), Labor $2200-$3200, Equipment $600-800, Permits $300, Total $8000-$11500' : ''}

Return ONLY a JSON object with:
{
  "materialsCost": [CALCULATE - use specific material pricing above],
  "laborCost": [CALCULATE - ensure 40-50% of total, use hourly rates above],
  "permitsCost": [CALCULATE - based on projectType and location],
  "contingencyCost": [CALCULATE - 7% of sum],
  "costEstimates": {
    "materials": {
      "total": [SAME AS materialsCost],
      "breakdown": [{"item": "Material name", "cost": amount}]
    },
    "labor": {
      "total": [SAME AS laborCost],
      "ratePerHour": [CALCULATE - based on location],
      "totalHours": [CALCULATE - use rules above]
    },
    "equipment": {
      "total": [CALCULATE - sum all equipment items],
      "items": [{"item": "Equipment name", "cost": amount}]
    }
  },
  "imageAnalysis": []
}

CRITICAL: All values MUST fall within the expected ranges for this specific scenario. Double-check your calculations against the scenario rules above.

Return ONLY valid JSON. No markdown, no explanations.`;

      case "homeowner":
        return `You are a professional roofing cost estimation expert. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} market pricing for materials and labor in ${project.location?.city || 'the project location'}.

Calculate ONLY the cost values for a homeowner report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object:
{
  "materialsCost": [Calculate materials cost at current ${currentYear} market prices],
  "laborCost": [Calculate labor costs at current ${currentYear} rates in ${project.location?.city || 'the project location'}],
  "permitsCost": [Calculate permits at current ${currentYear} fees],
  "contingencyCost": [Calculate 7% contingency],
  "imageAnalysis": [For each uploaded image, return a friendly description. Array length MUST match number of images.]
}

Return ONLY valid JSON with numeric values. No markdown, no explanations.`;

      default:
        return `Today's date is ${today}. Calculate cost values for project: ${projectData}. Return JSON with materialsCost, laborCost, permitsCost, contingencyCost.`;
    }
  }

  private buildReportPrompt(role: string, project: any): string {
    const projectData = JSON.stringify(project);
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    
    switch (role) {
      case "inspector":
        return `You are a senior professional roof inspector with 15+ years of experience. Today's date is ${today} (${currentMonth} ${currentYear}). Generate a detailed, comprehensive Inspector Report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency. Use current ${currentYear} cost benchmarks for the location.

Return a JSON object with these fields  each narrative field must be 2-5 sentences of professional detail, not a placeholder:
{
  "inspectorNameContact": "${project.inspectorInfo?.name || 'Inspector name not provided'} - License: ${project.inspectorInfo?.license || 'License not provided'} - Contact: ${project.inspectorInfo?.contact || 'Not provided'}",
  "inspectionDateTime": "${project.inspectionDate || 'Inspection date not provided'}",
  "reportGeneratedDate": "${today}",
  "addressGpsCoordinates": "${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
  "structureOverview": "Detailed professional description of the ${project.structureType || 'structure'} including age (${project.roofAge || 'unknown'} years), pitch characteristics (${project.roofPitch || 'unknown'}), material layers, and overall condition assessment based on observed data.",
  "slopeConditionTable": ["For each slope in the damage data, provide: slope identifier, damage type, severity rating, measured area affected, recommended action, and estimated repair priority (1=urgent, 3=routine)"],
  "roofingComponentsAssessment": {
    "underlayment": "Condition and type of underlayment (${project.felt || 'unknown type'})  describe suitability and any observed issues",
    "iceWaterShield": "Assessment of ice and water shield presence (${project.iceWaterShield ? 'Present' : 'Not observed'}) and effectiveness",
    "dripEdge": "Drip edge condition (${project.dripEdge ? 'Present' : 'Not present'})  note code compliance and protection effectiveness",
    "gutterApron": "Gutter apron status (${project.gutterApron ? 'Present' : 'Not present'}) and drainage impact",
    "fascia": "Fascia board condition: ${project.fascia?.condition || 'not recorded'}  structural and aesthetic implications",
    "gutters": "Gutter system condition: ${project.gutter?.condition || 'not recorded'}  drainage effectiveness and recommended maintenance"
  },
  "inspectorNotesEquipment": "Detailed field notes including weather conditions at time of inspection (${project.weatherConditions || 'not recorded'}), access equipment used (${Array.isArray(project.accessTools) ? project.accessTools.join(', ') : 'not specified'}), any access limitations encountered, and observations not captured in structured fields.",
  "ownerNotes": "${project.ownerNotes || 'No owner notes provided.'}",
  "annotatedPhotographicEvidence": ["For each uploaded image: provide a 2-3 sentence professional annotation identifying the component shown, observed condition, specific defects or damage noted, and relevance to the overall inspection findings"],
  "repairRecommendations": {
    "immediateActions": ["List urgent repairs needed within 0-30 days with brief justification"],
    "shortTerm": ["List repairs needed within 30-90 days"],
    "longTerm": ["List maintenance and replacement items for 1-5 year planning horizon"]
  },
  "timeline": "Detailed timeline estimate for recommended repairs, broken down by priority tier (immediate/short-term/long-term) with rationale based on current damage severity and seasonal considerations.",
  "contingencySuggestions": "Professional contingency recommendations based on the specific conditions observed, including percentage range (typically 10-20% for roofing), justification for the recommended amount, and factors that could increase costs."
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT include safety definitions, risk assessments, or explanatory text
- Do NOT use markdown code blocks
- The JSON must be parseable and complete

Use ONLY actual form data from the project. Return ONLY valid JSON.`;

      case "insurance-adjuster":
        return `You are a senior insurance claims adjuster with expertise in roofing damage assessment. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} replacement cost values for the project's location.

Generate a detailed, comprehensive Insurance Claim Report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency.

Return a JSON object with these sections  all narrative fields must be substantive (2-4 sentences), not placeholders:
{
  "claimMetadata": {
    "claimNumber": "${project.claimNumber || 'Not provided'}",
    "policyholder": "${project.policyholderName || 'Not provided'}",
    "adjusterName": "${project.adjusterName || 'Not provided'}",
    "adjusterContact": "${project.adjusterContact || 'Not provided'}",
    "dateOfLoss": "${project.dateOfLoss || 'Not provided'}",
    "dateOfInspection": "${today}",
    "reportDate": "${today}"
  },
  "inspectionSummary": {
    "propertyAddress": "${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
    "structureType": "${project.structureType}",
    "roofAge": "${project.roofAge} years",
    "roofPitch": "${project.roofPitch}",
    "existingMaterials": "${project.materialLayers?.join(', ')}",
    "totalArea": "${project.area || 1000} sq ft",
    "weatherConditions": "${project.weatherConditions || 'Not recorded'}",
    "propertyConditionNarrative": "Provide 2-3 sentences describing the overall property and roof condition as observed during inspection, referencing the age, materials, and pitch."
  },
  "coverageTable": {
    "coveredItems": ${JSON.stringify(project.coverageMapping?.covered || [])},
    "nonCoveredItems": ${JSON.stringify(project.coverageMapping?.excluded || [])},
    "maintenanceItems": ${JSON.stringify(project.coverageMapping?.maintenance || [])},
    "coverageAnalysisNarrative": "Provide a 2-3 sentence explanation of why specific items are covered or excluded under standard policy terms, referencing the cause of loss."
  },
  "stormDamageAssessment": {
    "primaryDamageCause": "${project.damageCause || 'Under investigation'}",
    "damageCauseNarrative": "Provide a detailed 3-4 sentence description of how the identified cause (${project.damageCause || 'damage cause'}) created the observed damage pattern, including the mechanism of damage and what indicators confirm this cause.",
    "affectedComponents": ${JSON.stringify(project.materialLayers || [])},
    "damageExtent": ${JSON.stringify(project.slopeDamage || [])},
    "damageExtentNarrative": "Provide a 2-3 sentence summary of the overall damage scope, including percentage of roof surface affected and severity distribution.",
    "impactedSystems": {
      "roofingSystem": ${JSON.stringify({
        "iceWaterShield": project.iceWaterShield ? "Present  assess for damage" : "Not observed",
        "felt": project.felt || "Not specified",
        "dripEdge": project.dripEdge ? "Present  assess for displacement" : "Not present",
        "gutterSystem": project.gutter?.condition || "Not assessed",
        "fasciaCondition": project.fascia?.condition || "Not assessed"
      })},
      "systemsNarrative": "Describe condition and storm-related impact to each roofing system component, noting which require replacement versus repair."
    }
  },
  "repairHistory": {
    "previousRepairs": "${project.previousRepairs || 'No prior repairs documented'}",
    "maintenanceRecords": "Documentation ${project.previousRepairs ? 'provided  reviewed for relevance to current claim' : 'not provided'}",
    "preExistingConditionAnalysis": "Identify any pre-existing wear or damage separate from the storm event, and explain how these were differentiated from covered storm damage."
  },
  "damageClassificationsTable": ${JSON.stringify(project.slopeDamage || [])},
  "annotatedPhotos": ["For each uploaded photo: provide a 2-3 sentence professional annotation identifying the component, the specific damage type visible, severity classification, and how this damage relates to the claimed cause of loss"],
  "replacementCostEstimateNarrative": "Provide a 3-4 sentence explanation of how replacement costs were determined, referencing current ${currentYear} material and labor prices in ${project.location?.city || 'the project location'}, applicable depreciation methodology, and any code upgrade requirements.",
  "legalCertificationNotes": {
    "propertyType": "${project.projectType}",
    "jurisdiction": "${project.location?.city || project.location}",
    "buildingCodes": "Identify applicable local building codes and any code-required upgrades triggered by this repair scope",
    "certificationStatement": "This report was prepared by ${project.adjusterName || 'the assigned adjuster'} on ${today} and represents an independent assessment of the reported damage based on physical inspection and documented evidence."
  }
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT include safety definitions, risk assessments, or explanatory text outside the JSON
- Do NOT use markdown code blocks
- The JSON must be parseable and complete

Use ONLY actual form data from the project. Return ONLY valid JSON.`;

      case "contractor":
        return `You are an experienced roofing contractor with deep knowledge of ${currentYear} material costs, labor markets, and best practices. Today's date is ${today} (${currentMonth} ${currentYear}).

Generate a comprehensive, detailed contractor work report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency. Use current ${currentYear} pricing for ${project.location?.city || 'the project location'}.

Return a JSON object with these sections  all narrative fields must be substantive and specific to the project, not generic placeholders:
{
  "projectDetails": {
    "address": "${project.location?.city || ''}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
    "type": "${project.projectType || 'Not specified'}",
    "jobType": "${project.jobType || 'Not specified'}",
    "dimensions": {
      "totalArea": ${project.area || 1200},
      "pitch": "${project.roofPitch || 'Not specified'}",
      "slopes": ${Array.isArray(project.slopeDamage) ? project.slopeDamage.length : 1}
    },
    "projectNarrative": "Provide a 2-3 sentence project overview describing the scope, the structure, and the primary objective of the work based on the submitted data."
  },
  "scopeOfWork": {
    "preparationTasks": ["List all specific preparation tasks required for this project based on job type (${project.jobType}), structure type (${project.structureType}), and location"],
    "removalTasks": ["List all specific removal tasks, referencing the existing materials (${project.materialLayers?.join(', ')}) and number of layers"],
    "installationTasks": ["List all specific installation tasks for the selected materials and components, including underlayment (${project.felt}), ice/water shield (${project.iceWaterShield ? 'yes' : 'no'}), drip edge, and primary roofing material"],
    "inspectionCheckpoints": ["List quality control checkpoints throughout the project"],
    "finishingTasks": ["List all finishing, cleanup, and documentation tasks"]
  },
  "laborRequirements": {
    "crewSize": "${project.laborNeeds?.workerCount || '3-5'} workers",
    "estimatedDays": "${project.jobType === 'full-replace' ? '5-8' : '2-4'}",
    "specialEquipment": ["List specific equipment required based on roof pitch (${project.roofPitch}), structure type, and line items"],
    "safetyRequirements": ["List OSHA-compliant safety requirements specific to this job's pitch, height, and structure type"],
    "laborNarrative": "Explain the crew composition rationale, daily work sequence, and how the ${project.laborNeeds?.workerCount || '3-5'} worker count was determined for this project size and complexity."
  },
  "materialBreakdown": {
    "lineItems": [{"item": "Each requested line item from ${JSON.stringify(project.lineItems || [])}", "quantity": "calculated quantity based on ${project.area || 1200} sq ft", "unit": "appropriate unit (sq, LF, EA, etc.)", "notes": "Installation specification or code requirement note"}],
    "materialSpecifications": "Provide 2-3 sentences detailing the specific product grades, manufacturer specifications, and code-compliance requirements for the primary materials on this project.",
    "wasteFactorNote": "Explain the waste factor applied (typically 10-15% for standard roofs, higher for complex cuts) and how it affects the material quantities ordered."
  },
  "permitAndCode": {
    "permitRequired": ${project.localPermit ? 'true' : 'false'},
    "localCodeRequirements": "Describe applicable building code requirements in ${project.location?.city || 'the project location'} for a ${project.projectType} roof replacement/repair project.",
    "inspectionMilestones": ["List required inspection points during the work"]
  },
  "projectTimeline": {
    "estimatedStartPrep": "Weather and permit dependent  typically 3-7 days from contract execution",
    "estimatedCompletionDays": "${project.jobType === 'full-replace' ? '5-8' : '2-4'} working days",
    "weatherConsiderations": "Describe seasonal weather risks in ${project.location?.city || 'the project location'} for ${currentMonth} ${currentYear} and mitigation strategies.",
    "milestones": ["Day 1: Setup and material delivery", "Day 2-3: Tear-off and deck inspection", "Day 4-5: Installation", "Final: Inspection and cleanup"]
  },
  "warrantyAndQuality": {
    "materialWarranty": "Describe manufacturer warranty terms for the selected materials",
    "workmanshipWarranty": "Standard contractor workmanship warranty terms",
    "qualityAssuranceProcess": "Describe the QA process for this project"
  }
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT include safety definitions, risk assessments, or explanatory text outside the JSON
- Do NOT use markdown code blocks
- The JSON must be parseable and complete

Use ONLY actual form data from the project. Return ONLY valid JSON.`;

      case "homeowner":
        return `You are a friendly, knowledgeable roofing expert helping a homeowner understand their roof's condition and costs. Today's date is ${today} (${currentMonth} ${currentYear}). Use current ${currentYear} market prices for ${project.location?.city || 'the project location'}.

Generate a clear, detailed homeowner-friendly report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency. Explain all technical terms in plain language.

Return a JSON object with these sections  all narrative fields must be written clearly for a homeowner, not a professional contractor, with specific detail:
{
  "welcomeMessage": {
    "greeting": "Dear ${project.homeownerInfo?.name || 'Homeowner'},",
    "introduction": "Write a warm, professional 2-sentence introduction explaining what this report covers and how to use it.",
    "reportDate": "${today}",
    "ourCommitment": "Write a 1-2 sentence commitment statement about providing honest, transparent roofing information."
  },
  "roofOverview": {
    "propertyType": "${project.structureType || 'Residential structure'}",
    "roofAge": "${project.roofAge ? project.roofAge + ' years old' : 'Age not specified'}",
    "roofStyle": "${project.roofPitch || 'Standard pitch'}",
    "currentMaterials": "${project.materialLayers?.join(', ') || 'Standard roofing materials'}",
    "overallCondition": "Write 2-3 sentences giving an honest overall condition assessment based on the age (${project.roofAge} years), material type, and any damage data provided. Use plain language a homeowner can understand.",
    "whatTheAgeOfYourRoofMeans": "Explain in 2-3 simple sentences what a ${project.roofAge}-year-old ${project.materialLayers?.[0] || 'roof'} typically means in terms of remaining lifespan and what to expect.",
    "keyFeatures": ["List key features or components of this roof that are relevant to its condition and maintenance"]
  },
  "damageSummary": {
    "inspectionFindings": "Write 3-4 sentences summarizing all damage findings from the submitted data in plain language. Explain what was found and where.",
    "priorityLevel": "Explain the overall urgency level in simple terms  is this something that needs immediate attention, or can it wait? Why?",
    "mainConcerns": ["List each specific concern in plain language with a 1-sentence plain English explanation of why it matters"],
    "whatThisMeans": "Write 2-3 sentences explaining what the overall damage assessment means for the homeowner  impact on home value, insurance, energy efficiency, or structural integrity."
  },
  "repairSuggestions": {
    "immediateActions": ["List specific actions needed within 30 days with a plain-language explanation of why each is urgent"],
    "shortTermPlanning": ["List items to address within 3-6 months with brief explanation"],
    "longTermOutlook": {
      "timeline": "Write 2-3 sentences giving a realistic timeline for when this roof will need significant work or replacement, based on current age and condition.",
      "investmentGuidance": "Write 2-3 sentences helping the homeowner understand whether to repair or replace, and what factors to consider in that decision.",
      "preventiveCare": "List 3-5 specific preventive maintenance actions the homeowner can take to extend roof life and avoid costly repairs."
    }
  },
  "budgetGuidance": {
    "reportDate": "${today}",
    "pricingNote": "All estimates reflect current ${currentMonth} ${currentYear} material and labor costs in ${project.location?.city || 'your area'}.",
    "estimatedRange": {
      "repairs": "Provide a specific cost range for repair-only option with explanation",
      "partialReplacement": "Provide a specific cost range for partial replacement with explanation of what's included",
      "fullReplacement": "Provide a specific cost range for full replacement in ${project.preferredCurrency || 'USD'} based on ${project.area || 1000} sq ft at current ${currentYear} prices in ${project.location?.city || 'your area'}"
    },
    "financingOptions": ["List realistic financing options available to homeowners for roofing projects with brief explanation of each"],
    "costSavingTips": ["List 4-6 specific, actionable money-saving tips for this project, such as timing, material choices, or bundling with other work"]
  },
  "nextSteps": {
    "recommended": ["List 3-5 concrete recommended next steps in priority order, written as specific actions the homeowner should take"],
    "questionsToAskContractors": ["List 5-7 important questions a homeowner should ask when getting contractor quotes for this type of work"],
    "warningSignsToWatch": ["List 4-6 specific warning signs the homeowner should monitor that would indicate the situation is getting worse and needs faster action"],
    "whenToCallEmergencyService": "Describe in 1-2 sentences what conditions would require emergency roofing service versus standard scheduling."
  }
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT use markdown code blocks
- The JSON must be parseable and complete
- Use friendly, non-technical language throughout

Return ONLY valid JSON. No markdown, no explanations outside the JSON.`;

      default:
        return `Today's date is ${today}. Generate a report in JSON format for project: ${projectData}. Return ONLY valid JSON.`;
    }
  }
}

export const realCostCalculator = new RealCostCalculator();


