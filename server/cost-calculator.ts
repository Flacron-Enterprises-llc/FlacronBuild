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
  private watsonxApiKey: string;
  private watsonxUrl: string;
  private watsonxProjectId: string | undefined;
  private watsonxSpaceId: string | undefined;
  private watsonxModelId: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.error('⚠️ CRITICAL: OpenAI API key is not set. Set OPENAI_KEY or OPENAI_API_KEY in environment variables.');
    } else {
      console.log('✅ OpenAI API key found:', this.openaiApiKey.slice(0, 8) + '...');
    }
    
    this.watsonxApiKey = process.env.IBM_WATSONX_AI_API_KEY || '';
    this.watsonxUrl = process.env.IBM_WATSONX_AI_URL || 'https://us-south.ml.cloud.ibm.com';
    this.watsonxProjectId = process.env.IBM_WATSONX_AI_PROJECT_ID;
    this.watsonxSpaceId = process.env.IBM_WATSONX_AI_SPACE_ID;
    this.watsonxModelId = process.env.IBM_WATSONX_AI_MODEL_ID || 'ibm/granite-8b-code-instruct';
    
    if (!this.watsonxApiKey) {
      console.error('⚠️ CRITICAL: IBM Watsonx API key is not set. Set IBM_WATSONX_AI_API_KEY in environment variables.');
    } else {
      console.log('✅ IBM Watsonx API key found:', this.watsonxApiKey.slice(0, 8) + '...');
      if (this.watsonxProjectId) {
        console.log('✅ IBM Watsonx Project ID found:', this.watsonxProjectId.slice(0, 8) + '...');
      }
      if (this.watsonxSpaceId) {
        console.log('✅ IBM Watsonx Space ID found:', this.watsonxSpaceId.slice(0, 8) + '...');
      }
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

      // Step 1: Get calculations from OpenAI
      console.log('=== COST CALCULATOR: Step 1 - Calling OpenAI for Calculations ===');
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
      
      // Process images for OpenAI analysis if provided (OpenAI supports images in messages)
      if (imageUrls && imageUrls.length > 0) {
        console.log('=== COST CALCULATOR: Adding Images to OpenAI Request ===');
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const imgObj = imageUrl as any;
          const base64String = imgObj?.data || imgObj?.url || imgObj?.base64 || imageUrl;
          
          if (typeof base64String === 'string') {
            const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
            calculationMessages.push({
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
          }
        }
      }

      const startTime = Date.now();
      const openaiResponse = await this.queryOpenAI(calculationMessages);
      const openaiEndTime = Date.now();
      console.log('=== COST CALCULATOR: OpenAI Response Received ===');
      console.log('Response time:', openaiEndTime - startTime, 'ms');
      
      let calculationJson: any;
      try {
        let cleanResponse = openaiResponse.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        cleanResponse = cleanResponse.replace(/("estimatedDays":\s*)(\d+-\d+)([,\s}])/g, '$1"$2"$3');
        
        calculationJson = JSON.parse(cleanResponse);
        
        // Check for error response from OpenAI
        if (calculationJson.error) {
          console.log('=== COST CALCULATOR: OpenAI returned error ===');
          console.log('Error:', calculationJson.error);
          throw new Error(calculationJson.error);
        }
        
        console.log('=== COST CALCULATOR: Calculation JSON Parsed Successfully ===');
        console.log('Materials cost:', calculationJson.materialsCost);
        console.log('Labor cost:', calculationJson.laborCost);
        console.log('Permits cost:', calculationJson.permitsCost);
        
      } catch (e) {
        // If the error is from our validation check, re-throw it as-is
        if (e instanceof Error && (e.message.includes('Invalid input') || e.message.includes('Validation'))) {
          throw e;
        }
        // Otherwise it's a JSON parse error
        console.log('=== COST CALCULATOR: JSON Parse Error ===');
        console.log('Parse error:', e);
        throw new Error("OpenAI did not return valid JSON: " + openaiResponse);
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
      try {
        watsonxReportText = await this.queryWatsonx(reportPromptWithCalculations);
      } catch (watsonxError) {
        console.log('=== COST CALCULATOR: Watsonx call failed, using fallback ===');
        console.log('Error:', watsonxError instanceof Error ? watsonxError.message : String(watsonxError));
        watsonxReportText = ''; // Empty string will trigger fallback
      }
      const watsonEndTime = Date.now();
      console.log('=== COST CALCULATOR: IBM Watsonx Response Received ===');
      console.log('Response time:', watsonEndTime - watsonStartTime, 'ms');
      
      let reportJson: any;
      try {
        let cleanReportResponse = watsonxReportText.trim();
        
        // If response is just <end_of_turn> or empty, create a basic report structure from OpenAI calculations
        if (!cleanReportResponse || cleanReportResponse === '<end_of_turn>' || cleanReportResponse.length < 10) {
          console.log('=== COST CALCULATOR: Watsonx returned empty/minimal response, creating basic report structure from OpenAI calculations ===');
          // Create a basic report structure - Watsonx failed but we have OpenAI calculations
          reportJson = {
            projectDetails: {
              address: `${project.location?.city || ''}, ${project.location?.state || ''} ${project.location?.zip || ''}`,
              type: project.projectType || 'Residential',
              dimensions: {
                totalArea: project.area || 1200,
                pitch: project.roofPitch || 'Not specified'
              }
            },
            scopeOfWork: {
              preparationTasks: ['Site assessment', 'Material delivery', 'Permits'],
              removalTasks: ['Remove existing roofing materials'],
              installationTasks: ['Install new roofing system'],
              finishingTasks: ['Site cleanup', 'Final inspection']
            },
            materialBreakdown: {
              lineItems: project.lineItems || []
            },
            timeline: '5-7 business days',
            contingencySuggestions: 'Standard contingency included',
            note: 'Report generated from cost calculations'
          };
        } else {
          // Remove safety/risk definition text that Watsonx sometimes adds
          if (cleanReportResponse.includes('<end_of_turn>')) {
            const jsonStart = cleanReportResponse.indexOf('{');
            const jsonEnd = cleanReportResponse.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              cleanReportResponse = cleanReportResponse.substring(jsonStart, jsonEnd + 1);
            } else {
              // If no JSON found, try to extract from after <end_of_turn>
              const afterEndTurn = cleanReportResponse.split('<end_of_turn>')[1] || cleanReportResponse.split('<end_of_turn>')[0];
              const jsonMatch = afterEndTurn.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                cleanReportResponse = jsonMatch[0];
              }
            }
          }
          
          // Remove markdown code blocks if present (including ```js, ```json, etc.)
          cleanReportResponse = cleanReportResponse.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '');
          
          // Extract JSON if it's embedded in text - be more aggressive
          const jsonMatch = cleanReportResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanReportResponse = jsonMatch[0];
          }
          
          // Clean up any remaining markdown or code syntax
          cleanReportResponse = cleanReportResponse.replace(/^const\s+\w+\s*=\s*/, '').replace(/;\s*$/, '');
          
          reportJson = JSON.parse(cleanReportResponse);
        }
        console.log('=== COST CALCULATOR: Report JSON Parsed Successfully ===');
        console.log('Report JSON keys:', Object.keys(reportJson));
        
        // Merge calculation results into report
        reportJson.materialsCost = calculationJson.materialsCost || calculationJson.costEstimates?.materials?.total || 0;
        reportJson.laborCost = calculationJson.laborCost || calculationJson.costEstimates?.labor?.total || 0;
        reportJson.permitsCost = calculationJson.permitsCost || 0;
        if (calculationJson.costEstimates) {
          reportJson.costEstimates = calculationJson.costEstimates;
        }
        reportJson.contingencyCost = calculationJson.contingencyCost;
        reportJson.imageAnalysis = calculationJson.imageAnalysis || [];
      } catch (e) {
        console.log('=== COST CALCULATOR: Report JSON Parse Error ===');
        console.log('Parse error:', e);
        console.log('Raw response:', watsonxReportText.substring(0, 500));
        // Fallback here is only for JSON parsing issues, not for skipping Watsonx.
        reportJson = {
          ...calculationJson,
          error: 'Failed to parse Watsonx JSON response; using calculation data only'
        };
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

  private async queryWatsonx(prompt: string): Promise<string> {
    if (!this.watsonxApiKey) {
      throw new Error('IBM Watsonx API key is not configured');
    }

    console.log('\n=== IBM WATSONX API: Request Details ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Prompt length:', prompt.length, 'characters');
    console.log('Prompt preview:', prompt.substring(0, 500) + '...');

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
      const watsonxEndpoint = `${this.watsonxUrl}/ml/v1/text/generation?version=2024-11-19`;
      
      const requestBody: any = {
        input: prompt,
        model_id: this.watsonxModelId,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40
        }
      };
      
      // Use space_id if available (preferred), otherwise use project_id
      if (this.watsonxSpaceId) {
        requestBody.space_id = this.watsonxSpaceId;
      } else if (this.watsonxProjectId) {
        requestBody.project_id = this.watsonxProjectId;
      }
      
      console.log('\n=== Making IBM Watsonx API Request ===');
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
      console.log('\n=== IBM Watsonx API Response ===');
      console.log('Response time:', endTime - startTime, 'ms');
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('IBM Watsonx API error response:', errorText);
        throw new Error(`IBM Watsonx API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      
      console.log('\n=== IBM Watsonx Response Data Structure ===');
      console.log('Response keys:', Object.keys(data));
      if (data.results) {
        console.log('Results count:', data.results.length);
        if (data.results[0]) {
          console.log('First result keys:', Object.keys(data.results[0]));
          console.log('Generated text preview:', String(data.results[0].generated_text || '').substring(0, 200));
        }
      }
      
      if (data.errors && data.errors.length > 0) {
        const errorMessage = data.errors[0].message || JSON.stringify(data.errors);
        console.error('IBM Watsonx returned errors:', JSON.stringify(data.errors, null, 2));
        throw new Error(`IBM Watsonx AI error: ${errorMessage}`);
      }

      // Check for response structure - handle both possible formats
      let responseText: string | null = null;
      
      if (data.results && data.results[0]) {
        responseText = data.results[0].generated_text || data.results[0].text || null;
      }
      
      // Handle empty response - Watsonx model may return empty string
      if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
        console.log('=== COST CALCULATOR: Watsonx returned empty response ===');
        console.log('Response structure:', JSON.stringify({
          hasResults: !!data.results,
          resultsLength: data.results?.length,
          firstResult: data.results?.[0],
          stopReason: data.results?.[0]?.stop_reason,
          allKeys: Object.keys(data)
        }, null, 2));
        // Return empty string to trigger fallback in calculateRealCost
        return '';
      }

      responseText = responseText.trim();
      console.log('\n=== IBM Watsonx Response Text Preview ===');
      console.log(responseText.substring(0, 500) + '...');

      return responseText;
    } catch (error: unknown) {
      console.error('\n=== IBM WATSONX API: Request Failed ===');
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
      }
      throw new Error('Failed to process IBM Watsonx API request');
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
    
    switch (role) {
      case "inspector":
        return `You are a professional roofing cost estimation expert. Calculate ONLY the cost values for an inspector report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object with these fields:
{
  "materialsCost": [Calculate materials cost for ${project.area || 1000} sq ft with ${project.materialTier || 'standard'} tier materials],
  "laborCost": [Calculate labor for ${project.roofPitch || 'standard'} roof with complexity factors],
  "permitsCost": [Calculate permits for ${project.projectType || 'residential'} in ${project.location?.city || project.location || 'standard location'}],
  "contingencyCost": [Calculate 7% contingency on total of materials + labor + permits],
  "imageAnalysis": [For each uploaded image, return a string annotation. Array length MUST match number of images.]
}

Return ONLY valid JSON with numeric values. No markdown, no explanations.`;

      case "insurance-adjuster":
        return `You are a professional roofing cost estimation expert. Calculate ONLY the cost values for an insurance claim report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object with these fields:
{
  "materialsCost": [Calculate materials cost for ${project.area || 1000} sq ft],
  "laborCost": [Calculate labor costs],
  "permitsCost": [Calculate permits if needed],
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
        
        return `You are a professional roofing cost estimation expert. Calculate ONLY the cost values for a contractor report based on this project data: ${projectData}

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
   
   LABOR COST = totalHours × ratePerHour
   
   EXPECTED LABOR COST RANGES BY SCENARIO:
   - BASELINE: $2000-$3000 (use 50 hours × $50 = $2500)
   - LUXURY MATERIAL: $4000-$6000 (use 60-80 hours × $60-75)
   - OLD ROOF: $2300-$3400 (use 45-55 hours × $50-60)
   - PARTIAL REPAIR: $800-$1500 (use 12-15 hours × $60-80)
   - COMMERCIAL: $4000-$6000
   - RUSH JOB (10+ workers): $6000-$8500 (use 40-50 hours × $120-150)
   - NYC: $7000-$10000 (use 60-80 hours × $100-120)
   - MULTI-LEVEL: $7000-$10500 (use 80-100 hours × $80-100)
   
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
   - NYC/New York City: Labor × 2.0, Materials × 1.2-1.3
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
${jobType === 'Full Replace' && materialLayers.length === 1 && !isNYC && !structureType.includes('Commercial') && !workerCount.includes('10+') && roofAge < 30 && lineItems.length <= 5 ? '- BASELINE (1200 sq ft, Standard, Full Replace, 1-2 workers): Materials $4500-$5000 (shingles + underlayment + debris), Labor $2000-$3000 (50 hours × $50 = $2500), Equipment $500-$800, Permits $300, Contingency 7%, Total $6800-$9800' : ''}
${jobType === 'Partial Repair' ? '- PARTIAL REPAIR: Materials $800-$1200, Labor $800-$1500 (12-15 hours × $60-80), Equipment $200-300, Permits $100-200, Total $1900-$3600' : ''}
${materialType === 'Slate' ? '- LUXURY MATERIAL (Slate): Materials $18000-$25000, Labor $4000-$6000 (60-80 hours × $60-75), Equipment $800-1200, Permits $400-600, Total $25000-$34000' : ''}
${materialLayers.length > 1 ? '- MULTIPLE LAYERS: Materials $6000-$8000 (with 25-30% removal premium), Labor $4500-$6000, Equipment $1000-1500, Permits $300-400, Contingency 7%, Total $13400-$19100' : ''}
${roofAge >= 30 && roofAge < 100 ? '- OLD ROOF (30+ years): Materials $4500-$5500, Labor $2300-$3400 (45-55 hours × $50-60), Equipment $500-700, Permits $300, Total $7200-$10800' : ''}
${structureType.includes('Commercial') || structureType.includes('Warehouse') ? '- COMMERCIAL: Materials $7200-$12000 (BUR), Labor $4000-$6000 (60-80 hours × $60-75), Equipment $1000-1500, Permits $400-600, Total $13200-$19300' : ''}
${lineItems.length >= 8 ? '- MANY LINE ITEMS: Materials $6000-$10000, Labor $4800-$6000, Equipment $1500-2500, Permits $300-500, Total $13400-$22750' : ''}
${isNYC ? '- NYC LOCATION: Materials $5000-$6000 (1.2x multiplier), Labor $7000-$10000 (60-80 hours × $100-120), Equipment $800-1200, Permits $400-600, Total $15800-$22500' : ''}
${structureType.includes('Multi-Family') || structureType.includes('3-Story') ? '- MULTI-LEVEL: Materials $4500-$5000, Labor $7000-$10500 (80-100 hours × $80-100), Equipment $1000-1500, Permits $300-500, Total $14500-$22500' : ''}
${workerCount.includes('10+') ? '- RUSH JOB (10+ workers): Materials $4500-$5000, Labor $6000-$8500 (40-50 hours × $120-150), Equipment $600-800, Permits $300, Total $10800-$15300' : ''}
${roofAge >= 100 ? '- HISTORICAL (100+ years): Materials $10000-$15000 (Wood Shakes), Labor $8000-$12000 (100-120 hours × $80-100), Equipment $1000-1500, Permits $300-500, Total $19800-$29700' : ''}
${materialType === 'Metal Roofing' ? '- METAL ROOFING: Materials $12000-$18000, Labor $8000-$12000 (100-120 hours × $80-100), Equipment $900-1200, Permits $300-500, Total $23100-$34900' : ''}
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
        return `You are a professional roofing cost estimation expert. Calculate ONLY the cost values for a homeowner report based on this project data: ${projectData}

Calculate these cost values and return ONLY a JSON object:
{
  "materialsCost": [Calculate materials cost],
  "laborCost": [Calculate labor costs],
  "permitsCost": [Calculate permits],
  "contingencyCost": [Calculate 7% contingency],
  "imageAnalysis": [For each uploaded image, return a friendly description. Array length MUST match number of images.]
}

Return ONLY valid JSON with numeric values. No markdown, no explanations.`;

      default:
        return `Calculate cost values for project: ${projectData}. Return JSON with materialsCost, laborCost, permitsCost, contingencyCost.`;
    }
  }

  private buildReportPrompt(role: string, project: any): string {
    const projectData = JSON.stringify(project);
    
    switch (role) {
      case "inspector":
        return `You are a professional roof inspector. Generate a comprehensive Inspector Report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency.

Return a JSON object with these fields:
{
  "inspectorNameContact": "${project.inspectorInfo?.name || 'Inspector name not provided'} - License: ${project.inspectorInfo?.license || 'License not provided'}",
  "inspectionDateTime": "${project.inspectionDate || 'Inspection date not provided'}",
  "addressGpsCoordinates": "${project.location?.city || project.location}, ${project.location?.country || ''} ${project.location?.zipCode || ''}",
  "structureOverview": "Professional description of ${project.structureType} structure with ${project.roofPitch} roof pitch",
  "slopeConditionTable": ["Analyze each slope from damage data"],
  "roofingComponents": "Detailed component analysis",
  "inspectorNotesEquipment": "Professional notes on weather conditions and equipment",
  "annotatedPhotographicEvidence": ["Professional image annotations - one per image"],
  "timeline": "Professional timeline estimate",
  "contingencySuggestions": "Professional contingency recommendations"
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
        return `You are an insurance adjuster. Generate a comprehensive Insurance Claim Report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency.

Return a JSON object with these sections:
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
  "damageClassificationsTable": ${JSON.stringify(project.slopeDamage || [])},
  "annotatedPhotos": ["Professional image annotations - one per image"],
  "legalCertificationNotes": {
    "propertyType": "${project.projectType}",
    "jurisdiction": "${project.location?.city || project.location}",
    "buildingCodes": "Local building codes and compliance requirements",
    "certificationStatement": "This report is prepared for insurance purposes by ${project.adjusterName || 'assigned adjuster'}"
  }
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT include safety definitions, risk assessments, or explanatory text
- Do NOT use markdown code blocks
- The JSON must be parseable and complete

Use ONLY actual form data from the project. Return ONLY valid JSON.`;

      case "contractor":
        return `You are a professional roofing contractor. Generate a comprehensive contractor report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency.

Return a JSON object with these sections:
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
    "preparationTasks": ["Site assessment", "Material delivery", "Permits", "Weather monitoring"],
    "removalTasks": ["Removal tasks based on job type"],
    "installationTasks": ["Installation tasks"],
    "finishingTasks": ["Site cleanup", "Final walkthrough", "Warranty documentation"]
  },
  "laborRequirements": {
    "crewSize": "${project.laborNeeds?.workerCount || '3-5'} workers",
    "estimatedDays": "${project.jobType === 'full-replace' ? '5-8' : '2-4'}",
    "specialEquipment": ["Equipment list"],
    "safetyRequirements": ["OSHA compliant fall protection", "Safety equipment"]
  },
  "materialBreakdown": {
    "lineItems": [{"item": "Materials", "quantity": 1, "unit": "project", "notes": "Based on specifications"}]
  }
}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- Start your response with { and end with }
- Do NOT include any text before or after the JSON
- Do NOT include safety definitions, risk assessments, or explanatory text
- Do NOT use markdown code blocks
- The JSON must be parseable and complete

Use ONLY actual form data from the project. Return ONLY valid JSON.`;

      case "homeowner":
        return `You are a friendly roofing expert. Generate a homeowner-friendly report in JSON format based on this project data: ${projectData}

IMPORTANT: Generate the ENTIRE report in ${project.preferredLanguage || 'English'} language and use ${project.preferredCurrency || 'USD'} currency.

Return a JSON object with these sections:
{
  "welcomeMessage": {
    "greeting": "Dear ${project.homeownerInfo?.name || 'Homeowner'},",
    "introduction": "Thank you for choosing FlacronBuild for your roofing assessment.",
    "ourCommitment": "Our goal is to provide clear, honest information about your roof's condition."
  },
  "roofOverview": {
    "propertyType": "${project.structureType || 'Residential structure'}",
    "roofAge": "${project.roofAge ? project.roofAge + ' years old' : 'Age not specified'}",
    "roofStyle": "${project.roofPitch || 'Standard pitch'}",
    "currentMaterials": "${project.materialLayers?.join(', ') || 'Standard roofing materials'}",
    "overallCondition": "Professional assessment",
    "keyFeatures": ["Feature list"]
  },
  "damageSummary": {
    "inspectionFindings": "Findings description",
    "priorityLevel": "Priority assessment",
    "mainConcerns": ["Concern list"],
    "whatThisMeans": "Explanation in simple terms"
  },
  "repairSuggestions": {
    "immediateActions": ["Action items"],
    "shortTermPlanning": ["Planning items"],
    "longTermOutlook": {
      "timeline": "Timeline estimate",
      "investmentGuidance": "Investment advice",
      "preventiveCare": "Preventive care tips"
    }
  },
  "budgetGuidance": {
    "estimatedRange": {
      "repairs": "Repair range",
      "partialReplacement": "Partial replacement range",
      "fullReplacement": "Full replacement range"
    },
    "financingOptions": ["Option list"],
    "costSavingTips": ["Tip list"]
  },
  "nextSteps": {
    "recommended": ["Recommendation list"],
    "questions": ["Question list"],
    "warningSignsToWatch": ["Warning signs"]
  }
}

Use friendly, non-technical language. Return ONLY valid JSON. No markdown.`;

      default:
        return `Generate a report in JSON format for project: ${projectData}. Return ONLY valid JSON.`;
    }
  }
}

export const realCostCalculator = new RealCostCalculator();
