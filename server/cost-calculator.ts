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

  constructor() {
    this.openaiApiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.error('⚠️ CRITICAL: OpenAI API key is not set. Set OPENAI_KEY or OPENAI_API_KEY in environment variables.');
    } else {
      console.log('✅ OpenAI API key found:', this.openaiApiKey.slice(0, 8) + '...');
    }
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
      
      console.log('=== COST CALCULATOR: Building Prompt for Role:', userRole, '===');
      let prompt: string;
      try {
        prompt = this.buildRolePrompt(userRole, project);
        console.log('=== COST CALCULATOR: Generated Prompt Preview ===');
        console.log('Prompt length:', prompt.length, 'characters');
        console.log('Prompt starts with:', prompt.substring(0, 200), '...');
      } catch (promptError) {
        console.error('=== COST CALCULATOR: Prompt Building Error ===');
        console.error('Error building prompt:', promptError);
        console.error('Project data:', JSON.stringify(project, null, 2));
        throw new Error(`Failed to build prompt for role ${userRole}: ${promptError instanceof Error ? promptError.message : String(promptError)}`);
      }

      // Build OpenAI messages array
      const messages: any[] = [
        {
          role: 'system',
          content: 'You are a professional roofing cost estimation expert. You must follow all calculation rules exactly and return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
      
      // Process images for OpenAI analysis if provided (OpenAI supports images in messages)
      if (imageUrls && imageUrls.length > 0) {
        console.log('=== COST CALCULATOR: Adding Images to OpenAI Request ===');
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          // Extract base64 string from object or use directly if it's a string
          const imgObj = imageUrl as any;
          const base64String = imgObj?.data || imgObj?.url || imgObj?.base64 || imageUrl;
          
          if (typeof base64String === 'string') {
            // Remove data:image/jpeg;base64, prefix if present
            const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`
                  }
                }
              ]
            });
            console.log(`Added image ${i + 1} to OpenAI request (${base64Data.length} chars)`);
          } else {
            console.log(`Skipping image ${i + 1} - not a valid string format`);
          }
        }
      }

      console.log('=== COST CALCULATOR: Calling OpenAI API ===');
      console.log('Request timestamp:', new Date().toISOString());
      const startTime = Date.now();
      
      const openaiResponse = await this.queryOpenAI(messages);
      
      const endTime = Date.now();
      console.log('=== COST CALCULATOR: OpenAI Response Received ===');
      console.log('Response time:', endTime - startTime, 'ms');
      console.log('Response length:', openaiResponse.length, 'characters');
      console.log('OpenAI response preview:', openaiResponse.substring(0, 500), '...');
      
      let reportJson;
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanResponse = openaiResponse.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Fix common JSON issues from OpenAI
        // Fix unquoted number ranges like "estimatedDays": 5-8 -> "estimatedDays": "5-8"
        cleanResponse = cleanResponse.replace(/("estimatedDays":\s*)(\d+-\d+)([,\s}])/g, '$1"$2"$3');
        cleanResponse = cleanResponse.replace(/("totalHours":\s*)(\d+\.\d+)([,\s}])/g, '$1$2$3');
        
        console.log('=== COST CALCULATOR: Parsing JSON ===');
        console.log('Cleaned response length:', cleanResponse.length);
        console.log('Cleaned response preview:', cleanResponse.substring(0, 200), '...');
        
        reportJson = JSON.parse(cleanResponse);
        console.log('=== COST CALCULATOR: JSON Parsed Successfully ===');
        console.log('Report JSON keys:', Object.keys(reportJson));
        console.log('Materials cost:', reportJson.materialsCost);
        console.log('Labor cost:', reportJson.laborCost);
        console.log('Permits cost:', reportJson.permitsCost);
        
      } catch (e) {
        console.log('=== COST CALCULATOR: JSON Parse Error ===');
        console.log('Parse error:', e);
        console.log('Raw response causing error:', openaiResponse);
        throw new Error("OpenAI did not return valid JSON: " + openaiResponse);
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
        regionMultiplier: 1.0, // Not used with Gemini
        breakdown: reportJson.breakdown || reportJson,
        dataSource: 'OpenAI API',
        timeline: reportJson.timeline || reportJson.laborRequirements?.estimatedDays || 'Not specified',
        contingencySuggestions: reportJson.contingencySuggestions || 'Standard 7% contingency applied',
        report: reportJson,
        imageAnalysis: reportJson.imageAnalysis || imageUrls
      };
      
      console.log('=== COST CALCULATOR: Final Result ===');
      console.log('Final result keys:', Object.keys(finalResult));
      console.log('Final result size:', JSON.stringify(finalResult).length, 'characters');
      
      return finalResult;
    } catch (error) {
      console.error('=== COST CALCULATOR: Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Provide more helpful error messages
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error while contacting OpenAI API. Please check your internet connection.');
      } else {
        throw new Error(`Failed to generate estimate: ${error.message}`);
      }
    }
  }

  private async queryOpenAI(messages: any[]): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    
    console.log('\n=== OPENAI API: Request Details ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request messages count:', messages.length);
    console.log('\n=== System Message ===');
    console.log(messages[0]?.content);
    console.log('\n=== User Message Preview ===');
    const userMessage = messages.find(m => m.role === 'user');
    if (userMessage) {
      if (typeof userMessage.content === 'string') {
        console.log(userMessage.content.substring(0, 500) + '...');
      } else {
        console.log('Content type:', typeof userMessage.content);
      }
    }

    const requestBody = {
      model: 'gpt-4o', // Using GPT-4o for better JSON generation
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      response_format: { type: 'json_object' } // Force JSON response
    };

    console.log('\n=== Request Structure ===');
    console.log(JSON.stringify({
      model: requestBody.model,
      messages_count: messages.length,
      temperature: requestBody.temperature,
      response_format: requestBody.response_format
    }, null, 2));
    
    try {
      console.log('\n=== Making API Request ===');
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
      console.log('\n=== API Response ===');
      console.log('Response time:', endTime - startTime, 'ms');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as OpenAIResponse;
      console.log('\n=== Response Data ===');
      if (typeof data === 'object' && data !== null) {
        console.log('Response structure:', Object.keys(data));
      }
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }
      
      if (!data?.choices?.[0]?.message?.content) {
        console.error('Unexpected OpenAI response structure:', JSON.stringify(data, null, 2));
        throw new Error('Invalid response format from OpenAI API');
      }

      const responseText = data.choices[0].message.content;
      console.log('\n=== Response Text Preview ===');
      console.log(responseText.substring(0, 500) + '...');

      return responseText;
    } catch (error: unknown) {
      console.error('\n=== OPENAI API: Request Failed ===');
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error while contacting OpenAI API. Please check your internet connection.');
        }
      }
      throw new Error('Failed to process OpenAI API request');
    }
  }

  private parseOpenAIResponse(response: string) {
    // Parse the Gemini response for the required fields
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

  private buildRolePrompt(role: string, project: any) {
    console.log('buildRolePrompt called with role:', role);
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
    
    switch (role) {
      case "inspector":
        return `You are a professional roof inspector conducting a thorough inspection. Generate a comprehensive Inspector Report based on this detailed project data: ${JSON.stringify(project)}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency for all monetary values. This includes all section headers, field labels, content descriptions, and any predefined text. Make sure every single piece of text in the response is in the specified language.

ANALYSIS REQUIREMENTS:
- Use the specific roof details: ${project.structureType}, ${project.roofPitch} pitch, ${project.roofAge} years old
- Material analysis: ${JSON.stringify(project.materialLayers)} with ${project.felt} felt, ice/water shield: ${project.iceWaterShield}
- Weather conditions: ${project.weatherConditions || 'Standard inspection conditions'}
- Equipment used: ${JSON.stringify(project.accessTools || ['Standard ladder', 'Safety harness'])}
- Damage assessment: ${JSON.stringify(project.slopeDamage || [])}

Return a JSON object with these professional inspection fields:
{
  "inspectorNameContact": "${project.inspectorInfo?.name || 'Inspector name not provided'} - License: ${project.inspectorInfo?.license || 'License not provided'}",
  "inspectionDateTime": "${project.inspectionDate || 'Inspection date not provided'}",
  "addressGpsCoordinates": "${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
  "structureOverview": "${project.structureType} structure with ${project.roofPitch} roof pitch, materials: ${project.materialLayers?.join(', ')}, age: ${project.roofAge} years",
  "slopeConditionTable": ["[Analyze each slope from provided damage data: ${JSON.stringify(project.slopeDamage)} - only include actual reported damage, do not invent conditions]"],
  "roofingComponents": "Felt: ${project.felt}, Ice/Water Shield: ${project.iceWaterShield ? 'Present' : 'Not present'}, Drip Edge: ${project.dripEdge ? 'Present' : 'Absent'}, Gutter condition: ${project.gutter?.condition || 'Not specified'}, Fascia condition: ${project.fascia?.condition || 'Not specified'}",
  "inspectorNotesEquipment": "Weather conditions: ${project.weatherConditions || 'Not specified'}, Equipment used: ${project.accessTools?.join(', ') || 'Standard equipment'}, Owner notes: ${project.ownerNotes || 'None provided'}",
  "annotatedPhotographicEvidence": [
    // For each uploaded image, return a string annotation describing what is visible in that image. The array length MUST match the number of uploaded images, and the order MUST match the upload order. Do not invent or omit any entries. Example: ["Image 1: ...", "Image 2: ...", ...]
  ],
  "materialsCost": [Calculate materials cost for ${project.area || 1000} sq ft with ${project.materialTier} tier materials],
  "laborCost": [Calculate labor for ${project.roofPitch} roof with complexity factors],
  "permitsCost": [Calculate permits for ${project.projectType} in ${project.location?.city || project.location}],
  "contingencyCost": [Calculate 7% contingency on total],
  "timeline": "[Estimate based on ${project.urgency || project.timeline} priority and scope]",
  "contingencySuggestions": "[Professional contingency recommendations for roof type and condition]"
}

IMPORTANT DATA REQUIREMENTS:
- Use ONLY actual form data provided - do not generate random or fictional information
- For image analysis, describe only what is visible in uploaded images
- The annotatedPhotographicEvidence array MUST have one string per image, in the same order as uploaded, and no extra or missing entries
- Use actual names, dates, and information from the form data
- If information is not provided in the form, use "Not provided" or "Not specified"
- Do NOT include emojis in any field
- Do NOT invent details not present in the actual project data

Generate realistic, professional content using ALL the provided project details. Return ONLY the JSON object with no markdown formatting - pure JSON starting with {.`;

      case "insurance-adjuster":
        return `You are an insurance adjuster conducting a comprehensive claim assessment. Generate a detailed Insurance Claim Report based on this project data: ${JSON.stringify(project)}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency for all monetary values. This includes all section headers, field labels, content descriptions, and any predefined text. Make sure every single piece of text in the response is in the specified language.

CLAIM ANALYSIS REQUIREMENTS:
Property Details:
- Structure: ${project.structureType}, ${project.roofAge} years old
- Materials: ${project.materialLayers?.join(', ')}
- Location: ${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}
- Roof Area: ${project.area || 1000} sq ft, Pitch: ${project.roofPitch}

Claim Information:
- Claim Number: ${project.claimNumber || 'Pending'}
- Policyholder: ${project.policyholderName || 'Property owner'}
- Adjuster: ${project.adjusterName || 'Assigned adjuster'}
- Contact: ${project.adjusterContact || 'Contact pending'}
- Loss Date: ${project.dateOfLoss || 'Under investigation'}
- Cause: ${project.damageCause || 'Under investigation'}

Coverage Details:
- Covered Items: ${JSON.stringify(project.coverageMapping?.covered || [])}
- Excluded Items: ${JSON.stringify(project.coverageMapping?.excluded || [])}
- Maintenance Items: ${JSON.stringify(project.coverageMapping?.maintenance || [])}

IMAGE ANALYSIS REQUIREMENTS:
For each provided image, analyze and describe:
1. Visible Damage:
   - Type (wind, hail, water, etc.)
   - Location on roof
   - Severity (minor, moderate, severe)
   - Measurements if visible
2. Material Conditions:
   - Current state of roofing materials
   - Signs of aging or wear
   - Evidence of previous repairs
3. Insurance-Relevant Details:
   - Documentation of covered perils
   - Pre-existing conditions
   - Maintenance issues
4. Supporting Evidence:
   - Visible measurements or markers
   - Time/date stamps if present
   - Weather conditions visible
5. Professional Assessment:
   - Repair recommendations
   - Code compliance issues
   - Safety concerns

Return a JSON object with these EXACT insurance report sections:
{
  "claimMetadata": {
    "claimNumber": "${project.claimNumber || 'Not provided'}",
    "policyholder": "${project.policyholderName || 'Not provided'}",
    "adjusterName": "${project.adjusterName || 'Not provided'}",
    "adjusterContact": "${project.adjusterContact || 'Not provided'}",
    "dateOfLoss": "${project.dateOfLoss || 'Not provided'}",
    "dateOfInspection": "${new Date().toISOString().split('T')[0]}"
  },
  "inspectionSummary": {
    "propertyAddress": "${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
    "structureType": "${project.structureType}",
    "roofAge": "${project.roofAge} years",
    "roofPitch": "${project.roofPitch}",
    "existingMaterials": "${project.materialLayers?.join(', ')}",
    "totalArea": "${project.area || 1000} sq ft",
    "weatherConditions": "${project.weatherConditions || 'Not recorded'}"
  },
  "coverageTable": {
    "coveredItems": ${JSON.stringify(project.coverageMapping?.covered || [])},
    "nonCoveredItems": ${JSON.stringify(project.coverageMapping?.excluded || [])},
    "maintenanceItems": ${JSON.stringify(project.coverageMapping?.maintenance || [])}
  },
  "stormDamageAssessment": {
    "primaryDamageCause": "${project.damageCause || 'Under investigation'}",
    "affectedComponents": ["${project.materialLayers?.join('", "')}"],
    "damageExtent": ${JSON.stringify(project.slopeDamage || [])},
    "impactedSystems": {
      "roofingSystem": ${JSON.stringify({
        "iceWaterShield": project.iceWaterShield ? "Damaged" : "N/A",
        "felt": project.felt,
        "dripEdge": project.dripEdge ? "Present" : "N/A",
        "gutterSystem": project.gutter?.condition || "Not specified",
        "fasciaCondition": project.fascia?.condition || "Not specified"
      })}
    }
  },
  "repairHistory": {
    "previousRepairs": "${project.previousRepairs || 'No prior repairs documented'}",
    "maintenanceRecords": "Documentation ${project.previousRepairs ? 'provided' : 'not provided'}"
  },
  "damageClassificationsTable": ${JSON.stringify(project.slopeDamage || []).replace(/"/g, '\\"')},
  "annotatedPhotos": [
    // For each uploaded image, return a string annotation describing what is visible in that image. The array length MUST match the number of uploaded images, and the order MUST match the upload order. Do not invent or omit any entries. Example: ["Image 1: ...", "Image 2: ...", ...]
  ],
  "legalCertificationNotes": {
    "propertyType": "${project.projectType}",
    "jurisdiction": "${project.location?.city || project.location}",
    "buildingCodes": "Local building codes and compliance requirements for ${project.location?.city || project.location}",
    "certificationStatement": "This report is prepared for insurance purposes by ${project.adjusterName || 'assigned adjuster'}, based on physical inspection and documentation review."
  }
}

IMPORTANT REQUIREMENTS:
1. Use ONLY actual form data - no fictional information
2. For photos, analyze ONLY uploaded images with focus on damage evidence
3. All measurements and conditions must be from actual form data
4. If information is missing, mark as "Not provided" or "Under investigation"
5. Format must match EXACTLY as shown above
6. NO emojis or informal language - this is a legal document
7. Include ALL sections even if some data is missing

IMPORTANT IMAGE ANALYSIS REQUIREMENTS:
1. Analyze ONLY the actual uploaded images
2. Describe ONLY visible damage and conditions
3. Include specific measurements ONLY if visible in the image
4. Note any visible evidence of covered perils
5. Document any visible pre-existing conditions
6. DO NOT invent or assume details not visible in the images
7. Use professional, insurance-appropriate terminology
8. The annotatedPhotos array MUST have one string per image, in the same order as uploaded, and no extra or missing entries

Generate comprehensive, insurance-focused content using ALL provided details. Return ONLY the JSON object with no markdown formatting - pure JSON starting with {.`;

      case "contractor":
        return `You are a professional roofing contractor analyzing a detailed project for estimation. Create a comprehensive contractor report using ALL the provided project data.

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency for all monetary values. This includes all section headers, field labels, content descriptions, and any predefined text. Make sure every single piece of text in the response is in the specified language.

AVAILABLE PROJECT DATA TO USE:
- Location: ${project.location?.city || 'Not provided'}, ${project.location?.country || 'Not provided'} ${project.location?.zipCode || 'Not provided'}
- Project Type: ${project.projectType || 'Residential'} (Residential or Commercial - CRITICAL for cost calculation)
- Structure: ${project.structureType || 'Not provided'}
- Roof Details: ${project.roofPitch || 'Not provided'} pitch, ${project.roofAge || 'Not provided'} years old
- Materials: ${(project.materials?.layers || project.materialLayers || []).join(', ') || 'Not provided'}
- Material Layers Count: ${(project.materials?.layers || project.materialLayers || []).length || 1} layer(s)
- Felt Type: ${project.materials?.feltType || project.felt || '15 lb'}
- Job Type: ${project.jobType || 'Not provided'}
- Material Preference: ${project.materialPreference || 'Not provided'}
- Worker Count: ${project.laborNeeds?.workerCount || 'Not provided'}
- Steep Assist Needed: ${project.laborNeeds?.steepAssist ? 'Yes' : 'No'}
- Line Items Selected: ${project.lineItems?.join(', ') || 'Not provided'}
- Local Permit Required: ${project.localPermit ? 'Yes' : 'No'}
- Components: Ice Shield: ${project.iceWaterShield || project.materials?.extras?.includes('Ice/Water Shield') ? 'Yes' : 'No'}, Felt: ${project.materials?.feltType || project.felt || 'None'}, Drip Edge: ${project.dripEdge || project.materials?.extras?.includes('Drip Edge') ? 'Yes' : 'No'}
- Extras: ${(project.materials?.extras || []).join(', ') || 'None'}
- Area: ${project.area || 1200} sq ft

CRITICAL COST CALCULATION RULES - YOU MUST FOLLOW THESE EXACTLY:

1. INPUT VALIDATION (CHECK FIRST - BEFORE ANY CALCULATIONS):
   - If roofAge is negative (e.g., -5), return: {"error": "Invalid input: roofAge cannot be negative", "message": "Please provide a valid roof age (0 or greater)."}
   - If workerCount is "0 Workers" or empty/invalid, return: {"error": "Invalid input: workerCount must be at least 1 worker", "message": "Please specify a valid number of workers for the project."}
   - If area is 0 or negative, return: {"error": "Invalid input: roof area must be greater than 0", "message": "Please provide a valid roof area."}
   - Do NOT generate estimates for invalid inputs - return error JSON immediately

2. LABOR HOURS CALCULATION (CRITICAL - MUST BE REALISTIC):
   - Base hours for Full Replace: 40-60 total man-hours (NOT 10 hours!)
   - For Partial Repair: 8-20 total man-hours (MUST use this range, NOT 40-60!)
   - Calculate based on worker count:
     * 1-2 Workers: 40-60 hours total (20-30 hours per worker)
     * 3-5 Workers: 30-50 hours total (10-17 hours per worker)
     * 6-9 Workers: 25-40 hours total (4-7 hours per worker)
     * 10+ Workers: 20-35 hours total (2-4 hours per worker) - but total cost increases due to more workers (rate × hours × 10+ workers)
   - Adjustments:
     * Steep roofs (9-12/12): +30-50% more hours (so 52-90 hours for 1-2 workers)
     * Old roofs (30+ years): +20-40% more hours (brittle materials take longer)
     * Multiple material layers: +25-50% more hours
     * Commercial structures: +40-60% more hours
     * Multi-level structures (3+ stories): +50-80% more hours (safety, chutes, slower work)
     * Metal/Slate materials: +50-100% more hours (specialized installation)
   - Example: Full Replace with 1-2 workers on standard roof = 40-60 hours, NOT 10 hours!
   - CRITICAL: For 10+ workers, calculate: (rate per hour) × (hours per worker) × (number of workers) + supervision ($500-1000)

3. LABOR COST CALCULATION (CRITICAL - MUST BE 40-50% OF TOTAL):
   - Base hourly rate by location:
     * Standard areas (Houston, Dallas, etc.): $65-75/hour
     * High-cost areas (NYC, San Francisco): $100-150/hour (2x multiplier)
     * Other major cities: $75-100/hour
   - Rate adjustments:
     * Steep roofs: +$10-15/hour
     * Commercial projects: +$15-25/hour
     * Multi-level structures: +$20-30/hour (hazard pay)
     * Metal/Slate materials: +$20-40/hour (specialized trades)
   - Total Labor Cost = (Rate per Hour) × (Total Hours) × (Number of Workers)
   - CRITICAL: Labor cost MUST be 40-50% of total project cost. If materials are $6,000, labor should be $3,000-$5,000, NOT $650!
   - For 10+ workers: Calculate total cost = (rate × hours × worker_count), but also add supervision cost ($500-1000)
   - IMPORTANT: After calculating all costs, verify labor is 40-50% of total. If not, adjust labor rate or hours to meet this requirement.

4. MATERIALS COST CALCULATION:
   - Detect material type from materials.layers or materialLayers array:
     * "Asphalt Shingles" or standard shingles: $2.50-$4.00/sq ft (Standard), $3.50-$5.00/sq ft (Premium/Luxury)
     * "Metal Roofing" or "Metal": $8.00-$15.00/sq ft (premium material, 50+ year life) - for 1200 sq ft = $9,600-$18,000
     * "Slate" or "Natural Slate": $12.00-$20.00/sq ft (luxury grade, very expensive) - for 1200 sq ft = $14,400-$24,000
     * "Wood Shakes" or "Cedar Shakes": $7.00-$10.00/sq ft (premium natural material) - for 1200 sq ft = $8,400-$12,000
     * "Built-up Roofing" or "BUR": $3.00-$8.00/sq ft (commercial, multi-layer)
   - If materialPreference is "Luxury", apply premium pricing even for standard materials
   - Multiple layers in materials array = multiple layers to remove (add 50-100% to tear-off cost)
   - CRITICAL: For Slate luxury material, materials should be $15,000-$25,000 for 1200 sq ft, labor $12,000-$18,000 (specialized, 50-100% more hours)
   - Underlayment costs:
     * 15 lb Felt: $0.30-$0.50/sq ft
     * 30 lb Felt: $0.50-$0.80/sq ft
     * Synthetic: $0.40-$0.70/sq ft
   - Extras:
     * Ice/Water Shield: +$0.50-$0.75/sq ft
     * Drip Edge: +$2.00-$4.00/linear foot
     * Hurricane Straps: +$5.00-$15.00 per strap (typically 50-100 straps needed)
     * High-Wind Shingles: +$1.00-$2.00/sq ft premium
   - Multiple layers: If removing 2+ layers, add 50-100% to tear-off cost
   - Location multipliers:
     * NYC, San Francisco: +50-100% material cost (shipping, local markup)
     * Other major cities: +20-40%
     * Standard areas: No multiplier

5. TEAR-OFF / REMOVAL COSTS:
   - Base: $0.80-$1.50/sq ft for standard single layer
   - Adjustments:
     * Multiple layers: +50-100% (double the weight/labor)
     * Heavy materials (Slate, Metal): +100-200% (slate is very heavy)
     * Old roofs (30+ years): +20-40% (brittle, takes longer)
     * Commercial/Multi-level: +50-100% (requires chutes, safety equipment)

6. DEBRIS REMOVAL / DISPOSAL (REQUIRED IF IN LINE ITEMS):
   - Base: $400-$800 for standard residential
   - Adjustments:
     * Heavy materials (Slate, Metal): $1,200-$2,500 (multiple dumpsters)
     * Multiple layers: $800-$1,600
     * NYC/Manhattan: $1,800-$2,500 (disposal fees, permits)
     * Commercial: $1,000-$2,000
   - MUST be included in equipment section if "Debris Removal" is in lineItems

7. EQUIPMENT COSTS:
   - Base tools: $300-$500
   - Safety equipment: $200-$400
   - Steep assist equipment: +$300-$600 (if steepAssist is true)
   - Crane rental (NYC, multi-level): $2,500-$4,000
   - Extra tools for large crews (10+ workers): +$500-$800 (need more harnesses, nail guns, etc.)

8. LINE ITEMS COSTS (Add to appropriate sections - MUST include ALL selected line items):
   - "Gutters & Downspouts": $2,200-$4,500 (200 linear feet typical) - add to materials or equipment
   - "Skylight Installation": $2,500-$5,000 per skylight (1-2 typical) - add to materials or equipment
   - "Deck Repair/Replacement": $1,500-$3,500 (10-20% of roof area typically needs repair) - add to materials
   - "Structural Reinforcement": $1,000-$2,500 - add to materials
   - "Permit & Inspection Fees": $150-$1,500 (varies by location - NYC is $1,000-$1,500) - add to equipment
   - "Ice & Water Shield": Already in materials, but add $600-$900 if specified separately - add to materials
   - "Drip Edge & Trim": $800-$1,500 if "All Types" specified - add to materials
   - "Flashing (All Types)": $800-$1,500 (includes complex chimney/valley flashing) - add to materials
   - CRITICAL: If "LINE ITEMS STRESS" test (all 10 items), total must be $15,750-$26,750. Add ALL line item costs.

9. ROOF AGE IMPACT:
   - 30+ years old: Add decking repair $800-$2,000 (10-20% wood rot expected)
   - 30+ years old: Add flashing replacement $400-$700 (rust/brittle)
   - 30+ years old: Add +20-40% to labor (brittle shingles take longer)
   - 100 years old (historical): Major decking replacement $3,000-$5,000, specialized craftsmen $10,000-$15,000

10. STRUCTURE TYPE & PROJECT TYPE IMPACT:
    - If projectType is "Commercial" OR structureType includes "Commercial", "Warehouse", "Industrial":
      * Labor: +40-60% labor cost, minimum $5,000-$8,000 for skilled "Hot-Roofing" crew
      * Materials: Use Built-up Roofing (BUR) rates $3.00-$8.00/sq ft, or specialized commercial materials
      * Equipment: +$2,000-$2,500 (specialized commercial equipment)
      * Total commercial warehouse: $18,000-$25,000+ (NOT $7,000!)
      * CRITICAL: Commercial projects MUST have total cost of at least $18,000
    - Multi-level (3+ stories) or "Multi-Family" or structureType includes "Multi-Family" or "3-Story":
      * Labor: +50-80% labor cost (height hazard pay, slower production) - minimum $7,000 for 1200 sq ft
      * Equipment: +$1,500-$2,500 (crane, chutes, OSHA safety systems)
      * Debris removal: +50-100% (requires chutes, can't drop from height)
      * CRITICAL: Multi-level structures MUST have labor cost of at least $7,000 and total of at least $14,500
    - Residential: Standard rates apply (no commercial multiplier)

11. GEOGRAPHIC LOCATION MULTIPLIERS:
    - NYC (10001, Manhattan): 2x labor, 1.5-2x materials, +$2,500-$4,000 crane, +$1,000-$1,500 permits
    - San Francisco: 1.8x labor, 1.6x materials
    - Other major cities: 1.2-1.4x labor, 1.2x materials
    - Standard areas (Houston, Dallas, etc.): No multiplier

12. JOB TYPE IMPACT:
    - "Full Replace" or "full-replace": Full costs as calculated above
    - "Partial Repair" or "partial-repair": 
      * Materials: $150-$300 (1-2 bundles) - DO NOT use full area calculations
      * Labor: $600-$1,200 (8-20 hours, 1-2 workers) - DO NOT use 40-60 hours
      * Equipment: $150-$300 (basic tools) - DO NOT include full debris removal
      * Total: $1,300-$2,600 - MUST be in this range
    - CRITICAL: For partial repair, COMPLETELY IGNORE full replacement calculations. Use ONLY the simplified partial repair costs listed above.

13. FINAL VALIDATION:
    - Labor cost MUST be 40-50% of total project cost
    - Total hours MUST be realistic (40-60 for full replace with 1-2 workers, NOT 10!)
    - Debris removal MUST be included if in lineItems
    - All line items MUST be accounted for in costs
    - Commercial projects MUST have higher labor costs ($5,000-$8,000 minimum)
    - Multi-level structures MUST have crane/equipment costs

Generate a detailed contractor report in JSON format with these exact sections:

{
  "projectDetails": {
    "address": "${project.location?.city || ''}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
    "type": "${project.projectType || 'Not specified'}",
    "dimensions": {
      "totalArea": ${project.area || 1200},
      "pitch": "${project.roofPitch || 'Not specified'}",
      "slopes": ${Array.isArray(project.slopeDamage) ? project.slopeDamage.length : 1}
    }
  },
  "scopeOfWork": {
    "preparationTasks": [
      "Site assessment and safety setup",
      "Material delivery and staging",
      "Obtain ${project.localPermit ? 'required local permits' : 'permits if needed'}",
      "Weather monitoring and scheduling"
    ],
    "removalTasks": [
      ${project.jobType === 'full-replace' ? '"Complete removal of existing roofing materials"' : '"Partial removal of damaged sections"'},
      "Debris removal and disposal",
      "Deck inspection and repair preparation"
    ],
    "installationTasks": [
      ${Array.isArray(project.lineItems) && project.lineItems.includes('Underlayment & Felt') ? '"Install ' + (project.felt || '15lb') + ' felt underlayment",' : ''}
      ${project.iceWaterShield ? '"Install ice and water shield",' : ''}
      ${project.dripEdge ? '"Install drip edge and trim",' : ''}
      "Install ${project.materialLayers?.[0] || 'roofing materials'}",
      ${Array.isArray(project.lineItems) && project.lineItems.includes('Ridge Vents & Ventilation') ? '"Install ridge vents and ventilation",' : ''}
      ${Array.isArray(project.lineItems) && project.lineItems.includes('Flashing (All Types)') ? '"Install flashing systems",' : ''}
      "Final inspection and quality control"
    ],
    "finishingTasks": [
      "Site cleanup and debris removal",
      "Final walkthrough with client",
      "Warranty documentation"
    ]
  },
  "laborRequirements": {
    "crewSize": "${project.laborNeeds?.workerCount || '3-5'} workers",
    "estimatedDays": "${project.jobType === 'full-replace' ? '5-8' : '2-4'}",
    "specialEquipment": [
      ${project.laborNeeds?.steepAssist ? '"Steep assist equipment and safety gear",' : ''}
      "Roofing tools and fasteners",
      "Material hoisting equipment",
      "Safety equipment and fall protection"
    ],
    "safetyRequirements": [
      "OSHA compliant fall protection",
      "Hard hats and safety equipment",
      ${project.roofPitch?.includes('Steep') ? '"Additional steep roof safety measures",' : ''}
      "Weather monitoring protocols"
    ]
  },
  "materialBreakdown": {
    "lineItems": [
      ${Array.isArray(project.lineItems) && project.lineItems.length > 0 ? project.lineItems.map((item: string) => `{
        "item": "${item}",
        "quantity": ${item.includes('Shingles') ? (project.area || 1200) / 100 : item.includes('Underlayment') ? (project.area || 1200) / 100 : 1},
        "unit": "${item.includes('Shingles') || item.includes('Underlayment') ? 'squares' : item.includes('Linear') ? 'linear feet' : 'each'}",
        "notes": "Based on project specifications"
      }`).join(',') : `{
        "item": "Asphalt Shingles",
        "quantity": ${(project.area || 1200) / 100},
        "unit": "squares",
        "notes": "Standard grade materials"
      }`}
    ]
  },
  "costEstimates": {
    "materials": {
      "total": [CALCULATE based on rules below],
      "breakdown": [
        {"category": "Roofing Materials", "amount": [CALCULATE based on material type and preference]},
        {"category": "Underlayment & Accessories", "amount": [CALCULATE based on felt type and area]},
        {"category": "Flashing & Trim", "amount": [CALCULATE based on line items and complexity]}
      ]
    },
    "labor": {
      "total": [CALCULATE based on rules below - MUST be 40-50% of total project cost],
      "ratePerHour": [CALCULATE based on location, roof pitch, and material complexity],
      "totalHours": [CALCULATE based on rules below - MUST be realistic for job type]
    },
    "equipment": {
      "total": [CALCULATE based on rules below],
      "items": [
        {"item": "Tool rental and equipment", "cost": [CALCULATE]},
        {"item": "Safety equipment", "cost": [CALCULATE]},
        {"item": "Debris Removal / Dumpster", "cost": [CALCULATE - REQUIRED if lineItems includes Debris Removal]},
        {"item": "Steep assist equipment", "cost": [CALCULATE if steepAssist is true]},
        {"item": "Crane Rental", "cost": [CALCULATE if lineItems includes Crane Rental or structure is multi-level]},
        {"item": "Permit & Inspection Fees", "cost": [CALCULATE if lineItems includes Permit & Inspection Fees or localPermit is true]}
      ]
    }
  },
  "imageAnalysis": [
    // For each uploaded image, return a string annotation describing what is visible in that image. The array length MUST match the number of uploaded images, and the order MUST match the upload order. Do not invent or omit any entries. Example: ["Image 1: ...", "Image 2: ...", ...]
  ]
}

CRITICAL: Replace ALL [CALCULATE] placeholders with actual calculated numeric values based on the rules above. Do NOT leave placeholders in the JSON.

IMPORTANT JSON FORMAT REQUIREMENTS:
- You MUST return valid JSON only (no markdown, no code blocks)
- All numeric values must be actual numbers, not strings or placeholders
- All [CALCULATE] placeholders MUST be replaced with real calculated values
- The JSON structure must match exactly as specified below
- Use double quotes for all strings
- Do not include any explanatory text outside the JSON

COST CALCULATION SUMMARY - Apply these in order:
1. Calculate base material costs based on material type, area, and location
2. Calculate base labor hours (40-60 for full replace with 1-2 workers, adjust for job type and complexity)
3. Calculate labor rate based on location, roof pitch, and material complexity
4. Calculate total labor cost = rate × hours × workers (MUST be 40-50% of total)
5. Calculate equipment costs including debris removal if in lineItems
6. Add line items costs (gutters, skylights, permits, etc.)
7. Add roof age adjustments (decking, flashing, extra labor)
8. Add structure type adjustments (commercial, multi-level)
9. Apply geographic multipliers
10. Validate: Labor should be 40-50% of total, hours should be realistic

Use ONLY the actual project data provided above. Calculate all costs using the detailed rules provided. Return pure JSON with no markdown formatting.

IMPORTANT IMAGE ANALYSIS REQUIREMENTS:
1. Analyze ONLY the actual uploaded images
2. Describe ONLY visible repair areas, material needs, and safety issues
3. The imageAnalysis array MUST have one string per image, in the same order as uploaded, and no extra or missing entries
4. Do NOT invent or assume details not visible in the images

Generate a detailed, contractor-focused report using ALL provided details. 

CRITICAL: Return ONLY valid JSON. Do NOT include markdown code blocks. Do NOT include any text before or after the JSON. Start directly with { and end with }. All [CALCULATE] placeholders must be replaced with actual numeric values.`;

      case "homeowner":
        return `You are a friendly roofing expert helping a homeowner understand their roof's condition. Create a comprehensive but easy-to-understand homeowner report using ALL the provided project data.

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency for all monetary values. This includes all section headers, field labels, content descriptions, and any predefined text. Make sure every single piece of text in the response is in the specified language.

AVAILABLE PROJECT DATA TO USE:
- Location: ${project.location?.city || 'Not provided'}, ${project.location?.country || 'Not provided'} ${project.location?.zipCode || 'Not provided'}
- Structure: ${project.structureType || 'Not provided'}
- Roof Details: ${project.roofPitch || 'Not provided'} pitch, ${project.roofAge || 'Not provided'} years old
- Materials: ${project.materialLayers?.join(', ') || 'Not provided'}
- Homeowner Name: ${project.homeownerInfo?.name || 'Not provided'}
- Email: ${project.homeownerInfo?.email || 'Not provided'}
- Project Urgency: ${project.urgency || 'Not provided'}
- Budget Style: ${project.budgetStyle || 'Not provided'}
- Preferred Language: ${project.preferredLanguage || 'English'}
- Preferred Currency: ${project.preferredCurrency || 'USD'}
- Components: Ice Shield: ${project.iceWaterShield ? 'Yes' : 'No'}, Felt: ${project.felt || 'None'}, Drip Edge: ${project.dripEdge ? 'Yes' : 'No'}

Generate a friendly, easy-to-understand homeowner report in JSON format with these exact sections:

{
  "welcomeMessage": {
    "greeting": "Dear ${project.homeownerInfo?.name || 'Homeowner'},",
    "introduction": "Thank you for choosing FlacronBuild for your roofing assessment. We've carefully analyzed your ${project.structureType || 'home'} and prepared this easy-to-understand report to help you make informed decisions about your roof.",
    "ourCommitment": "Our goal is to provide you with clear, honest information about your roof's condition and help you understand your options moving forward."
  },
  "roofOverview": {
    "propertyType": "${project.structureType || 'Residential structure'}",
    "roofAge": "${project.roofAge ? project.roofAge + ' years old' : 'Age not specified'}",
    "roofStyle": "${project.roofPitch || 'Standard pitch'}",
    "currentMaterials": "${project.materialLayers?.join(', ') || 'Standard roofing materials'}",
    "overallCondition": "Based on the age and materials, your roof is ${project.roofAge > 20 ? 'reaching the end of its typical lifespan' : project.roofAge > 10 ? 'in the middle of its expected lifespan' : 'relatively new'}",
    "keyFeatures": [
      ${project.iceWaterShield ? '"Ice and water shield protection installed"' : '"Standard underlayment"'},
      ${project.dripEdge ? '"Drip edge protection in place"' : '"Basic edge protection"'},
      "Felt underlayment: ${project.felt || 'Standard grade'}"
    ]
  },
  "damageSummary": {
    "inspectionFindings": "We've identified ${project.slopeDamage?.length || 0} areas of concern that need your attention",
    "priorityLevel": "${project.urgency === 'high' ? 'High Priority - Immediate attention recommended' : project.urgency === 'medium' ? 'Medium Priority - Address within 6 months' : 'Low Priority - Monitor and plan for future repairs'}",
    "mainConcerns": [
      ${project.roofAge > 15 ? '"Age-related wear and material deterioration"' : '"Normal wear patterns for roof age"'},
      ${project.slopeDamage?.length > 0 ? '"Visible damage requiring professional attention"' : '"No major structural concerns identified"'},
      "Weather protection effectiveness"
    ],
    "whatThisMeans": "In simple terms, your roof ${project.roofAge > 20 || project.urgency === 'high' ? 'needs prompt attention to prevent water damage to your home' : project.roofAge > 10 ? 'is showing normal signs of aging and should be monitored closely' : 'appears to be in good condition for its age'}"
  },
  "repairSuggestions": {
    "immediateActions": [
      ${project.urgency === 'high' ? '"Contact a licensed roofer within 2 weeks"' : '"Schedule a professional inspection"'},
      ${project.slopeDamage?.length > 0 ? '"Address visible damage areas to prevent water intrusion"' : '"Continue regular maintenance and monitoring"'},
      "Monitor for leaks during heavy rain"
    ],
    "shortTermPlanning": [
      ${project.budgetStyle === 'premium' ? '"Consider high-quality materials for maximum longevity"' : project.budgetStyle === 'basic' ? '"Focus on essential repairs with cost-effective solutions"' : '"Balance quality and cost for best value"'},
      "Get quotes from 3 licensed contractors",
      "Plan timing around weather and personal schedule"
    ],
    "longTermOutlook": {
      "timeline": "${project.roofAge > 20 ? 'Replacement recommended within 1-2 years' : project.roofAge > 15 ? 'Start planning for replacement in 3-5 years' : 'Roof should last another 10-15 years with proper maintenance'}",
      "investmentGuidance": "For a roof of this age and condition, ${project.budgetStyle === 'premium' ? 'investing in premium materials will provide the best long-term value' : project.budgetStyle === 'basic' ? 'focus on necessary repairs to maintain protection' : 'a balanced approach offers good protection and value'}",
      "preventiveCare": "Regular maintenance can extend your roof's life and prevent costly emergency repairs"
    }
  },
  "budgetGuidance": {
    "estimatedRange": {
      "repairs": "${project.urgency === 'high' ? '$2,000 - $8,000' : project.urgency === 'medium' ? '$1,000 - $4,000' : '$500 - $2,000'}",
      "partialReplacement": "${(project.area || 1200) * (project.budgetStyle === 'premium' ? 8 : project.budgetStyle === 'basic' ? 4 : 6) * 0.5}",
      "fullReplacement": "${(project.area || 1200) * (project.budgetStyle === 'premium' ? 12 : project.budgetStyle === 'basic' ? 6 : 8)}"
    },
    "financingOptions": [
      "Home improvement loans",
      "Insurance claims (if applicable)",
      "Contractor payment plans",
      "Home equity line of credit"
    ],
    "costSavingTips": [
      "Get multiple quotes for comparison",
      "Consider timing repairs during off-season",
      "Bundle multiple home improvements",
      "Ask about material upgrade options"
    ]
  },
  "nextSteps": {
    "recommended": [
      "Schedule consultations with licensed contractors",
      "Review your homeowner's insurance policy",
      "Set aside budget for recommended repairs",
      "Create a timeline based on priority level"
    ],
    "questions": [
      "What is the warranty on materials and labor?",
      "How long will the project take?",
      "What permits are required?",
      "How will you protect my landscaping and property?"
    ],
    "warningSignsToWatch": [
      "Water stains on ceilings or walls",
      "Missing or damaged shingles after storms",
      "Granules in gutters",
      "Visible sagging or structural issues"
    ]
  },
  "imageAnalysis": [
    // For each uploaded image, return a string annotation describing what the homeowner is seeing in that image. The array length MUST match the number of uploaded images, and the order MUST match the upload order. Do not invent or omit any entries. Example: ["Image 1: ...", "Image 2: ...", ...]
  ]
}

Use ONLY the actual project data provided above. Write in friendly, non-technical language that any homeowner can understand. Return pure JSON with no markdown formatting.

IMPORTANT IMAGE ANALYSIS REQUIREMENTS:
1. Analyze ONLY the actual uploaded images
2. Describe ONLY what is visible in each image in simple, homeowner-friendly language
3. The imageAnalysis array MUST have one string per image, in the same order as uploaded, and no extra or missing entries
4. Do NOT invent or assume details not visible in the images

Generate a friendly, easy-to-understand report using ALL provided details. Return ONLY the JSON object with no markdown formatting - pure JSON starting with {.`;

      default:
        return "Return an empty JSON object.";
    }
  }
}

export const realCostCalculator = new RealCostCalculator();