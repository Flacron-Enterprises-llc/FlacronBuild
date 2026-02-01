import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertProjectSchema, insertEstimateSchema } from "@shared/schema";
import { realCostCalculator, type ProjectRequirements } from "./cost-calculator";
import { scrapingVerification } from "./scraping-verification";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-30.basil",
});

// Define the pricing for each role
const rolePricing = {
  homeowner: {
    monthly: 1999, // $19.99 in cents
    yearly: null, // No yearly option for homeowner
  },
  contractor: {
    monthly: 9799, // $97.99 in cents
    yearly: 99999, // $999.99 in cents
  },
  inspector: {
    monthly: 9799, // $97.99 in cents
    yearly: 99999, // $999.99 in cents
  },
  "insurance-adjuster": {
    monthly: 9799, // $97.99 in cents
    yearly: 99999, // $999.99 in cents
  },
};

// Define role names for dynamic product creation
const roleNames = {
  homeowner: "Homeowner Subscription",
  contractor: "Contractor Subscription", 
  inspector: "Inspector Subscription",
  "insurance-adjuster": "Insurance Adjuster Subscription",
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get single project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create project
  app.post("/api/projects", async (req, res) => {
    console.log('=== BACKEND: POST /api/projects ===');
    console.log('Raw request body:', req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('uploadedFiles from request:', req.body.uploadedFiles);
    
    try {
      const projectData = insertProjectSchema.parse(req.body);
      console.log('Parsed project data:', projectData);
      const project = await storage.createProject(projectData);
      console.log('Created project:', project);
      res.status(201).json(project);
    } catch (error: any) {
      console.log('=== BACKEND: POST /api/projects ERROR ===');
      console.log('Error type:', typeof error);
      console.log('Error:', error);
      if (error instanceof z.ZodError) {
        console.log('Zod validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updates);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Generate cost estimate using real data
  app.post("/api/projects/:id/estimate", async (req, res) => {
    console.log('=== BACKEND: POST /api/projects/:id/estimate ===');
    console.log('Project ID:', req.params.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body files:', req.body.files?.length || 0, 'files');
    
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      console.log('Retrieved project from database:', project?.id, project?.name);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Extract the full project data from uploadedFiles (which contains the original form data)
      let fullProjectData: any = {};
      console.log('=== BACKEND: Form Data Extraction ===');
      console.log('Project uploadedFiles:', project.uploadedFiles);
      if (project.uploadedFiles && project.uploadedFiles.length > 0) {
        try {
          fullProjectData = JSON.parse(project.uploadedFiles[0]);
          console.log('=== BACKEND: Successfully Parsed Form Data ===');
          console.log('Form data keys:', Object.keys(fullProjectData));
          console.log('User role:', fullProjectData.userRole);
          console.log('Form data size (chars):', JSON.stringify(fullProjectData).length);
          
          // Debug key form sections
          console.log('=== BACKEND: Form Data Verification ===');
          console.log('Has location:', !!fullProjectData.location);
          console.log('Has userRole:', !!fullProjectData.userRole);
          console.log('Has inspector fields:', !!(fullProjectData.inspectorInfo || fullProjectData.inspectionDate));
          console.log('Has insurer fields:', !!(fullProjectData.claimNumber || fullProjectData.policyholderName));
          console.log('Has contractor fields:', !!(fullProjectData.jobType || fullProjectData.materialPreference));
          console.log('Has homeowner fields:', !!(fullProjectData.homeownerInfo || fullProjectData.urgency));
          
        } catch (e: any) {
          console.log('=== BACKEND: Form Data Parsing Error ===');
          console.log('Parse error:', e.message);
          console.log('Raw uploadedFiles[0]:', project.uploadedFiles[0]);
          fullProjectData = {};
        }
      } else {
        console.log('=== BACKEND: No form data found in uploadedFiles ===');
      }

      // Convert project to requirements format for real cost calculator
      const projectRequirements: ProjectRequirements = {
        // Add the full project data first (includes userRole and all form fields)
        ...fullProjectData,
        // Then override with basic project fields
        type: project.type as any,
        area: project.area,
        location: project.location,
        materialTier: project.materialTier as any,
        timeline: project.timeline as any,
      };
      
      console.log('=== BACKEND: Project Requirements Prepared ===');
      console.log('Requirements userRole:', projectRequirements.userRole);
      console.log('Requirements keys count:', Object.keys(projectRequirements).length);

      // Extract images from req.body.files (if present)
      const images = Array.isArray(req.body.files) ? req.body.files : [];
      console.log('=== BACKEND: Image Processing ===');
      console.log('Received images count:', images.length);
      if (images.length > 0) {
        console.log('First image type:', typeof images[0]);
        console.log('First image object:', images[0]);
        // Check for base64 in a likely property (e.g., data, url, base64)
        const base64String = images[0]?.data || images[0]?.url || images[0]?.base64;
        if (typeof base64String === 'string') {
          console.log('First image property has base64:', base64String.includes('base64'));
        } else {
          console.log('First image does not have a string property to check for base64.');
        }
      }

      // Use real cost calculator with images
      console.log('=== BACKEND: Calling OpenAI API ===');
      const realEstimate = await realCostCalculator.calculateRealCost(projectRequirements, images);
      console.log('=== BACKEND: OpenAI API Response Received ===');
      console.log('Estimate total cost:', realEstimate.totalCost);
      console.log('Estimate materials cost:', realEstimate.materialsCost);
      console.log('Estimate labor cost:', realEstimate.laborCost);
      console.log('Estimate permits cost:', realEstimate.permitsCost);
      console.log('Estimate contingency cost:', realEstimate.contingencyCost);
      console.log('Estimate has breakdown:', !!realEstimate.breakdown);
      console.log('Estimate has report:', !!realEstimate.report);
      console.log('Estimate has imageAnalysis:', !!realEstimate.imageAnalysis);
      
      // Debug: Log the report structure to see what OpenAI returned
      if (realEstimate.report) {
        console.log('=== BACKEND: Report Keys ===');
        const reportObj = realEstimate.report as any; // Cast to any for debugging
        console.log('Report keys:', Object.keys(reportObj));
        console.log('Report materialsCost:', reportObj.materialsCost);
        console.log('Report laborCost:', reportObj.laborCost);
        console.log('Report permitsCost:', reportObj.permitsCost);
      }
      
      // Prepare data for storage
      console.log('=== BACKEND: Preparing Data for Storage ===');
      const formInputDataForStorage = {
        ...fullProjectData,
        submittedAt: new Date().toISOString(),
        projectId: projectId,
        imageCount: images.length
      };
      
      const openaiResponseForStorage = {
        response: realEstimate,
        metadata: {
          apiCallTime: new Date().toISOString(),
          inputTokenCount: projectRequirements ? Object.keys(projectRequirements).length : 0,
          imageCount: images.length,
          userRole: projectRequirements.userRole
        }
      };
      
      // Validate that data can be serialized to JSON
      try {
        JSON.stringify(formInputDataForStorage);
        JSON.stringify(openaiResponseForStorage);
        JSON.stringify(realEstimate.report);
      } catch (serializationError) {
        console.error('=== BACKEND: JSON Serialization Error ===');
        console.error('Serialization error:', serializationError);
        throw new Error(`Data serialization failed: ${serializationError instanceof Error ? serializationError.message : String(serializationError)}`);
      }
      
      console.log('Form input data size:', JSON.stringify(formInputDataForStorage).length, 'characters');
      console.log('OpenAI response size:', JSON.stringify(openaiResponseForStorage).length, 'characters');
      
      // Validate estimate data before creating
      if (typeof realEstimate.totalCost !== 'number' && realEstimate.totalCost !== undefined) {
        console.warn('Warning: totalCost is not a number:', typeof realEstimate.totalCost, realEstimate.totalCost);
      }
      
      // Create estimate with all data
      console.log('=== BACKEND: Creating Estimate Record ===');
      const estimateData = {
        projectId,
        totalCost: (realEstimate.totalCost || 0).toString(),
        materialsCost: (realEstimate.materialsCost || 0).toString(),
        laborCost: (realEstimate.laborCost || 0).toString(),
        permitsCost: (realEstimate.permitsCost || 0).toString(),
        contingencyCost: (realEstimate.contingencyCost || 0).toString(),
        regionMultiplier: (realEstimate.regionMultiplier || 1.0).toString(),
        report: realEstimate.report,
        formInputData: formInputDataForStorage,
        openaiResponse: openaiResponseForStorage
      };
      
      // Validate against schema
      try {
        insertEstimateSchema.parse(estimateData);
      } catch (schemaError) {
        console.error('=== BACKEND: Schema Validation Error ===');
        console.error('Schema error:', schemaError);
        if (schemaError instanceof z.ZodError) {
          console.error('Validation errors:', schemaError.errors);
        }
        throw new Error(`Estimate data validation failed: ${schemaError instanceof Error ? schemaError.message : String(schemaError)}`);
      }
      
      const savedEstimate = await storage.createEstimate(estimateData);

      console.log('=== BACKEND: Estimate Created Successfully ===');
      console.log('Saved estimate ID:', savedEstimate.id);
      console.log('Saved estimate has formInputData:', !!savedEstimate.formInputData);
      console.log('Saved estimate has openaiResponse:', !!savedEstimate.openaiResponse);

      // Include detailed breakdown in response
      const responseData = {
        ...savedEstimate,
        breakdown: realEstimate.breakdown,
        dataSource: realEstimate.dataSource,
        imageAnalysis: realEstimate.imageAnalysis
      };
      
      console.log('=== BACKEND: Sending Response ===');
      console.log('Response data keys:', Object.keys(responseData));
      res.json(responseData);
    } catch (error) {
      console.error("=== BACKEND: Cost Estimation Error ===");
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Full error:", error);
      
      // Return more detailed error information in development
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({ 
        message: "Failed to generate estimate",
        error: isDevelopment ? errorMessage : undefined,
        details: isDevelopment && error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Get project estimates
  app.get("/api/projects/:id/estimates", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const estimates = await storage.getEstimatesByProjectId(projectId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  // Get latest estimate for project
  app.get("/api/projects/:id/estimate/latest", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const estimate = await storage.getLatestEstimateByProjectId(projectId);
      if (!estimate) {
        return res.status(404).json({ message: "No estimate found for project" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest estimate" });
    }
  });

  // Get detailed cost breakdown with real data sources
  app.get("/api/projects/:id/cost-breakdown", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectRequirements: ProjectRequirements = {
        type: project.type as any,
        area: project.area,
        location: project.location,
        materialTier: project.materialTier as any,
        timeline: project.timeline as any
      };

      const realEstimate = await realCostCalculator.calculateRealCost(projectRequirements);
      
      res.json({
        breakdown: realEstimate.breakdown,
        dataSource: realEstimate.dataSource,
        lastUpdated: new Date().toISOString(),
        regionalFactors: {
          locationAnalyzed: project.location,
          marketConditions: "Current regional pricing",
          costDatabase: realEstimate.dataSource
        }
      });
    } catch (error) {
      console.error("Cost breakdown error:", error);
      res.status(500).json({ message: "Failed to get cost breakdown" });
    }
  });

  // Real-time data source verification endpoint
  app.get("/api/verify-data-sources/:location", async (req, res) => {
    try {
      const location = decodeURIComponent(req.params.location);
      console.log(`[VERIFICATION API] Testing data sources for ${location}`);
      
      const verification = await scrapingVerification.verifyRealScraping(location);
      
      res.json({
        location,
        timestamp: new Date().toISOString(),
        verification: {
          isUsingRealData: verification.isUsingRealData,
          sourcesAttempted: verification.attempts.length,
          successfulSources: verification.attempts.filter(a => a.success && a.dataFound).length,
          evidence: verification.evidence,
          fallbackReason: verification.fallbackReason
        },
        scrapingAttempts: verification.attempts.map(attempt => ({
          url: attempt.url,
          timestamp: attempt.timestamp,
          success: attempt.success,
          dataFound: attempt.dataFound,
          status: attempt.responseStatus,
          error: attempt.error
        })),
        summary: scrapingVerification.getVerificationSummary()
      });
    } catch (error) {
      console.error("Data verification error:", error);
      res.status(500).json({ 
        message: "Failed to verify data sources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get Stripe session details
  app.get("/api/stripe-session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Extract role from session metadata
      const role = session.metadata?.role;
      
      res.json({
  sessionId: session.id,
  role: role,
  subscriptionId: session.subscription || null,  // ✅ add this line
  billingPeriod: session.metadata?.billingPeriod,
  customerEmail: session.customer_email,
  customerName: session.metadata?.customerName,
});

    } catch (error) {
      console.error("Error retrieving session:", error);
      res.status(500).json({ 
        message: "Failed to retrieve session details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Chatbot endpoint using IBM Watsonx AI for text generation
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Check if IBM Watsonx AI API key is available
      const watsonxApiKey = process.env.IBM_WATSONX_AI_API_KEY;
      const watsonxUrl = process.env.IBM_WATSONX_AI_URL || 'https://us-south.ml.cloud.ibm.com';
      const watsonxProjectId = process.env.IBM_WATSONX_AI_PROJECT_ID; // Optional - only required for standard deployments
      const watsonxModelId = process.env.IBM_WATSONX_AI_MODEL_ID || 'ibm/granite-4-h-small';
      
      if (!watsonxApiKey) {
        // Fallback responses when API key is not available
        const fallbackResponses = {
          'role': {
            response: "I can help you choose the right role! Here are your options:\n\n🏠 **Homeowner**\n• Get estimates for your own projects\n• Simplified interface for easy use\n• Budget planning tools\n• Basic PDF reports\n\n🧱 **Contractor**\n• Create professional bids and estimates\n• Detailed cost breakdowns\n• Editable line items\n• Bid-ready reports\n\n🧑‍💼 **Inspector**\n• Conduct detailed inspections and assessments\n• Slope-by-slope damage input\n• Component condition checklist\n• Certification tools\n\n💼 **Insurance Adjuster**\n• Analyze claims and coverage\n• Damage cause classification\n• Coverage tables\n• Claim metadata\n\nWhich role interests you most?",
            suggestions: [
              "I want to be a Homeowner",
              "I want to be a Contractor", 
              "I want to be an Inspector",
              "I want to be an Insurance Adjuster"
            ]
          },
          'pricing': {
            response: "Here are our current pricing plans:\n\n🏠 **Homeowner Plan**\n• **Price**: $19.99/month\n• **Features**:\n  - Basic estimator with simplified interface\n  - Budget planning tools\n  - Standard PDF reports\n  - Email support\n\n🧱 **Contractor Plan**\n• **Price**: $97.99/month or $999.99/year (Save $175/year)\n• **Features**:\n  - Full estimator with detailed breakdowns\n  - Bid-ready reports with editable line items\n  - Professional formatting\n  - Priority support\n\n🧑‍💼 **Inspector Plan**\n• **Price**: $97.99/month or $999.99/year (Save $175/year)\n• **Features**:\n  - Inspection tools and certification\n  - Component condition checklist\n  - Detailed inspection reports\n  - Priority support\n\n💼 **Insurance Adjuster Plan**\n• **Price**: $97.99/month or $999.99/year (Save $175/year)\n• **Features**:\n  - Claim analysis and coverage tools\n  - Damage cause classification\n  - Insurance-specific reports\n  - Priority support\n\nAll plans include unlimited estimates and updates.",
            suggestions: [
              "Yes, I want to see pricing details",
              "No, tell me about features instead",
              "Can I change plans later?",
              "Is there a free trial?"
            ]
          },
          'how': {
            response: "Here's how FlacronBuild works:\n\n📋 **Step 1: Enter Project Details**\n• Fill in your roof specifications\n• Select materials and damage types\n• Add location and project info\n\n🤖 **Step 2: AI Analysis**\n• Our system analyzes materials and labor costs\n• Considers local market rates\n• Factors in project complexity\n\n💰 **Step 3: Generate Estimate**\n• Get detailed cost breakdowns\n• See line-by-line pricing\n• Review material and labor costs\n\n📄 **Step 4: Download Report**\n• Professional PDF reports ready for use\n• Customizable formatting\n• Share with clients or insurance\n\nThe entire process takes just a few minutes and provides accurate estimates based on current market data.",
            suggestions: [
              "Yes, I need a step-by-step guide",
              "No, tell me what information I need",
              "How accurate are the estimates?",
              "Can I save my projects?"
            ]
          },
          'features': {
            response: "Each role gets different features:\n\n🏠 **Homeowner Features**\n• **Basic Cost Estimator**: Simple interface for quick estimates\n• **Budget Planning Tools**: Track costs and plan your budget\n• **PDF Reports**: Download professional reports\n• **Email Support**: Get help when you need it\n\n🧱 **Contractor Features**\n• **Full Detailed Estimator**: Comprehensive cost analysis\n• **Editable Line Items**: Customize every aspect of your estimate\n• **Bid-Ready Reports**: Professional formatting for clients\n• **Priority Support**: Get help faster\n\n🧑‍💼 **Inspector Features**\n• **Slope-by-Slope Damage Input**: Detailed damage assessment\n• **Component Condition Checklist**: Systematic inspection process\n• **Certification Tools**: Professional certification features\n• **Detailed Inspection Reports**: Comprehensive documentation\n\n💼 **Insurance Adjuster Features**\n• **Damage Cause Classification**: Identify damage types\n• **Coverage Tables**: Insurance-specific calculations\n• **Claim Metadata**: Track claim information\n• **Insurance-Specific Reports**: Tailored for insurance use",
            suggestions: [
              "Yes, I need detailed features",
              "No, tell me about pricing instead",
              "How do I get started?",
              "Contact support"
            ]
          },
          'certification': {
            response: "Great question about certifications!\n\n🧑‍💼 **Inspector Role Certifications**\n• **Professional Certification**: Industry-recognized credentials\n• **Training Materials**: Learn best practices\n• **Compliance Tools**: Meet industry standards\n• **Documentation**: Maintain certification records\n\n📋 **What's Included**\n• Certification tracking and renewal reminders\n• Professional development resources\n• Industry-standard inspection protocols\n• Continuing education credits\n\n💼 **Insurance Adjuster Certifications**\n• **Claims Certification**: Specialized training for insurance work\n• **Coverage Analysis**: Learn insurance-specific tools\n• **Regulatory Compliance**: Stay up-to-date with requirements\n• **Professional Credentials**: Industry recognition",
            suggestions: [
              "Yes, I need certification",
              "No, I don't need certification",
              "Tell me about training",
              "What certifications are available?"
            ]
          }
        };

        // Determine response based on message content
        const lowerMessage = message.toLowerCase();
        let responseData;

        if (lowerMessage.includes('certification') || lowerMessage.includes('certified') || lowerMessage.includes('training')) {
          responseData = fallbackResponses.certification;
        } else if (lowerMessage.includes('role') || lowerMessage.includes('choose') || lowerMessage.includes('homeowner') || lowerMessage.includes('contractor') || lowerMessage.includes('inspector') || lowerMessage.includes('adjuster')) {
          responseData = fallbackResponses.role;
        } else if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('plan')) {
          responseData = fallbackResponses.pricing;
        } else if (lowerMessage.includes('how') || lowerMessage.includes('work') || lowerMessage.includes('process') || lowerMessage.includes('step')) {
          responseData = fallbackResponses.how;
        } else if (lowerMessage.includes('feature') || lowerMessage.includes('include') || lowerMessage.includes('get')) {
          responseData = fallbackResponses.features;
        } else {
          responseData = {
            response: "I'm here to help! You can ask me about:\n\n• **Role Selection**: Choose between Homeowner, Contractor, Inspector, or Insurance Adjuster\n• **Pricing Plans**: See our monthly and yearly subscription options\n• **How It Works**: Learn about our estimation process\n• **Features**: Discover what each role includes\n\nWhat would you like to know?",
            suggestions: [
              "Help me choose a role",
              "Tell me about pricing",
              "How does it work?",
              "What features do I get?"
            ]
          };
        }

        return res.json({
          response: responseData.response,
          action: null,
          role: null,
          suggestions: responseData.suggestions
        });
      }

      // Helper function to get IBM IAM Bearer token
      async function getWatsonxToken(apiKey: string): Promise<string> {
        const fetch = (await import('node-fetch')).default;
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

      // Get Bearer token from IBM IAM
      const accessToken = await getWatsonxToken(watsonxApiKey);

      // Build conversation context
      const systemPrompt = `You are FlacronBuild's AI assistant, a helpful and knowledgeable guide for our roofing estimation platform. 

Your role is to help users with:

1. **Role Selection**: Help users choose between Homeowner, Contractor, Inspector, and Insurance Adjuster roles
2. **Pricing Information**: Explain our subscription plans and pricing
3. **Feature Guidance**: Explain what features each role gets
4. **Step-by-step Help**: Guide users through the estimation process
5. **General Support**: Answer questions about the platform

**Current Pricing:**
- 🏠 Homeowner: $19.99/month (Basic estimator, simplified interface)
- 🧱 Contractor: $97.99/month or $999.99/year (Full features, detailed reports)
- 🧑‍💼 Inspector: $97.99/month or $999.99/year (Inspection tools, certification)
- 💼 Insurance Adjuster: $97.99/month or $999.99/year (Claim analysis, coverage tools)

**Role Features:**
- **Homeowner**: Basic estimator, budget planning, simplified interface
- **Contractor**: Full estimator, detailed breakdowns, bid-ready reports, editable line items
- **Inspector**: Slope-by-slope damage input, component condition checklist, certification
- **Insurance Adjuster**: Damage cause classification, coverage tables, claim metadata

**Response Formatting Guidelines:**
- Use bullet points (•) for lists
- Use emojis for visual appeal
- Structure responses with clear sections
- Keep responses concise but informative
- DO NOT use markdown syntax like ** or * in your responses
- Write naturally without formatting symbols

**Suggestion Button Guidelines:**
- Make suggestions specific and actionable
- Use "Yes/No" format when appropriate
- Include clear action words
- Keep suggestions short and clear
- Examples: "Yes, I want to see pricing", "No, tell me about features", "I want to be a Contractor"

**Available Actions:**
- select_role: When user wants to choose a role, respond with action: "select_role" and role: "homeowner|contractor|inspector|insurance-adjuster"
- navigate_pricing: When user asks about pricing, respond with action: "navigate_pricing"
- navigate_support: When user needs support, respond with action: "navigate_support"

Be friendly, helpful, and concise. Provide relevant suggestions for follow-up questions. Write responses naturally without markdown formatting.`;

      // Build conversation history for Watsonx
      let conversationText = systemPrompt + "\n\nAssistant: I understand. I'm ready to help users with role selection, pricing, features, and step-by-step guidance for FlacronBuild.\n\n";

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg: any) => {
          const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
          conversationText += `${roleLabel}: ${msg.content}\n\n`;
        });
      }

      // Add current message
      conversationText += `User: ${message}\n\nAssistant:`;

      // Generate response using IBM Watsonx AI
      const fetch = (await import('node-fetch')).default;
      const watsonxEndpoint = `${watsonxUrl}/ml/v1/text/generation?version=2024-11-19`;
      
      // Build request body - project_id is optional (required for standard deployments, optional for lightweight engine)
      const requestBody: any = {
        input: conversationText,
        model_id: watsonxModelId,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95,
          top_k: 40
        }
      };
      
      // Only include project_id if provided (required for most deployments)
      if (watsonxProjectId) {
        requestBody.project_id = watsonxProjectId;
      }
      
      const watsonxResponse = await fetch(watsonxEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!watsonxResponse.ok) {
        const errorText = await watsonxResponse.text();
        let errorMessage = `IBM Watsonx AI API error: ${watsonxResponse.status} - ${errorText}`;
        
        // Provide helpful message if project_id is missing
        if (errorText.includes('project_id') || errorText.includes('project') || errorText.includes('Project')) {
          errorMessage += '\n\n💡 Tip: You may need to set IBM_WATSONX_AI_PROJECT_ID in your .env file. See IBM_WATSONX_SETUP.md for instructions.';
        }
        
        throw new Error(errorMessage);
      }

      const watsonxData = await watsonxResponse.json() as any;
      
      if (watsonxData.errors && watsonxData.errors.length > 0) {
        let errorMessage = watsonxData.errors[0].message || JSON.stringify(watsonxData.errors);
        
        // Provide helpful message if project_id is missing
        if (errorMessage.includes('project_id') || errorMessage.includes('project') || errorMessage.includes('Project')) {
          errorMessage += '\n\n💡 Tip: You may need to set IBM_WATSONX_AI_PROJECT_ID in your .env file. See IBM_WATSONX_SETUP.md for instructions.';
        }
        
        throw new Error(`IBM Watsonx AI error: ${errorMessage}`);
      }

      if (!watsonxData.results || !watsonxData.results[0] || !watsonxData.results[0].generated_text) {
        throw new Error('Invalid response format from IBM Watsonx AI API');
      }

      const responseText = watsonxData.results[0].generated_text.trim();

      // Parse response for actions
      let action = null;
      let role = null;
      let suggestions = [];

      // Check for role selection
      if (responseText.includes('action: "select_role"')) {
        action = 'select_role';
        const roleMatch = responseText.match(/role: "([^"]+)"/);
        if (roleMatch) {
          role = roleMatch[1];
        }
      } else if (responseText.includes('action: "navigate_pricing"')) {
        action = 'navigate_pricing';
      } else if (responseText.includes('action: "navigate_support"')) {
        action = 'navigate_support';
      }

      // Generate suggestions based on context
      if (responseText.toLowerCase().includes('role') || responseText.toLowerCase().includes('choose')) {
        suggestions = [
          "I want to be a Homeowner",
          "I want to be a Contractor", 
          "I want to be an Inspector",
          "I want to be an Insurance Adjuster"
        ];
      } else if (responseText.toLowerCase().includes('pricing') || responseText.toLowerCase().includes('cost')) {
        suggestions = [
          "Yes, I want to see pricing details",
          "No, tell me about features instead",
          "Can I change plans later?",
          "Is there a free trial?"
        ];
      } else if (responseText.toLowerCase().includes('how') || responseText.toLowerCase().includes('work')) {
        suggestions = [
          "Yes, I need a step-by-step guide",
          "No, tell me what information I need",
          "How accurate are the estimates?",
          "Can I save my projects?"
        ];
      } else if (responseText.toLowerCase().includes('certification') || responseText.toLowerCase().includes('certified')) {
        suggestions = [
          "Yes, I need certification",
          "No, I don't need certification",
          "Tell me about training",
          "What certifications are available?"
        ];
      } else if (responseText.toLowerCase().includes('feature') || responseText.toLowerCase().includes('include')) {
        suggestions = [
          "Yes, I need detailed features",
          "No, tell me about pricing instead",
          "How do I get started?",
          "Contact support"
        ];
      } else {
        suggestions = [
          "Help me choose a role",
          "Tell me about pricing",
          "How does it work?",
          "What features do I get?"
        ];
      }

      // Clean response (remove action markers and markdown syntax)
      const cleanResponse = responseText
        .replace(/action: "[^"]*"/g, '')
        .replace(/role: "[^"]*"/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/\n\s*\n/g, '\n')
        .trim();

      res.json({
        response: cleanResponse,
        action,
        role,
        suggestions
      });

    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({ 
        message: "Failed to generate response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { role, billingPeriod, customerEmail, customerName } = req.body;

      // Validate the request
      if (!role || !billingPeriod || !customerEmail) {
        return res.status(400).json({ 
          message: "Missing required fields: role, billingPeriod, customerEmail" 
        });
      }

      // Validate role
      if (!rolePricing[role as keyof typeof rolePricing]) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Validate billing period
      if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
        return res.status(400).json({ message: "Invalid billing period" });
      }

      // Check if yearly billing is available for this role
      if (billingPeriod === "yearly" && !rolePricing[role as keyof typeof rolePricing].yearly) {
        return res.status(400).json({ message: "Yearly billing not available for this role" });
      }

      // Get the price for the selected role and billing period
      const price = billingPeriod === "monthly" 
        ? rolePricing[role as keyof typeof rolePricing].monthly
        : rolePricing[role as keyof typeof rolePricing].yearly;

      if (!price) {
        return res.status(400).json({ message: "Invalid pricing configuration" });
      }

      // Create Stripe checkout session with dynamic pricing
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: roleNames[role as keyof typeof roleNames],
                description: `${roleNames[role as keyof typeof roleNames]} - ${billingPeriod === "monthly" ? "Monthly" : "Yearly"} billing`,
              },
              recurring: {
                interval: billingPeriod === "monthly" ? "month" : "year",
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cancel`,
        customer_email: customerEmail,
        metadata: {
          role: role,
          billingPeriod: billingPeriod,
          customerName: customerName || "",
        },
        subscription_data: {
          metadata: {
            role: role,
            billingPeriod: billingPeriod,
            customerName: customerName || "",
          },
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      console.error("Stripe key status:", process.env.STRIPE_SECRET_KEY ? "Present" : "Missing");
      res.status(500).json({ 
        message: "Failed to create checkout session",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
