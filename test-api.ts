/**
 * Test script to run actual API tests against the cost calculator
 * This requires the server to be running and a valid GEMINI_KEY
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:3000';

interface TestCase {
  name: string;
  payload: any;
  expectedChecks: {
    laborHours?: { min: number; max: number };
    laborCost?: { min: number; max: number };
    laborPercentage?: { min: number; max: number };
    totalCost?: { min: number; max: number };
    hasDebrisRemoval?: boolean;
    hasError?: boolean;
  };
}

// Test Case 1: BASELINE
const testCase1: TestCase = {
  name: 'BASELINE',
  payload: {
    location: { country: "USA", state: "Texas", city: "Houston", zip: "77001" },
    projectType: "Residential",
    structureType: "Single Family Home",
    roofPitch: "Flat (0-2/12)",
    roofAge: 10,
    materials: {
      layers: ["Asphalt Shingles"],
      feltType: "15 lb"
    },
    jobType: "Full Replace",
    materialPreference: "Standard",
    laborNeeds: {
      workerCount: "1-2 Workers",
      steepAssist: false
    },
    lineItems: [
      "Shingles/Roofing Material",
      "Underlayment & Felt",
      "Debris Removal"
    ],
    area: 1200,
    role: "contractor",
    type: "residential"
  },
  expectedChecks: {
    laborHours: { min: 40, max: 60 },
    laborCost: { min: 3500, max: 5000 },
    laborPercentage: { min: 40, max: 50 },
    totalCost: { min: 7600, max: 11200 },
    hasDebrisRemoval: true
  }
};

// Test Case 9: INVALID INPUT
const testCase9: TestCase = {
  name: 'INVALID INPUT (Negative roofAge)',
  payload: {
    ...testCase1.payload,
    roofAge: -5,
    laborNeeds: {
      workerCount: "0 Workers",
      steepAssist: false
    }
  },
  expectedChecks: {
    hasError: true
  }
};

// Test Case 6: PARTIAL REPAIR
const testCase6: TestCase = {
  name: 'PARTIAL REPAIR',
  payload: {
    ...testCase1.payload,
    jobType: "Partial Repair",
    lineItems: [
      "Shingles/Roofing Material",
      "Flashing (All Types)"
    ]
  },
  expectedChecks: {
    laborHours: { min: 8, max: 20 },
    totalCost: { min: 1300, max: 2600 }
  }
};

async function runTest(testCase: TestCase): Promise<{ passed: boolean; details: any }> {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Payload: ${JSON.stringify(testCase.payload, null, 2).substring(0, 200)}...`);
  
  try {
    // Step 1: Create a project first
    const projectPayload = {
      name: `Test: ${testCase.name}`,
      type: testCase.payload.type || 'residential',
      area: testCase.payload.area || 1200,
      location: typeof testCase.payload.location === 'string' 
        ? testCase.payload.location 
        : `${testCase.payload.location?.city || ''}, ${testCase.payload.location?.state || ''}`,
      materialTier: testCase.payload.materialPreference?.toLowerCase() || 'standard',
      uploadedFiles: [JSON.stringify(testCase.payload)] // Store full form data
    };
    
    const projectResponse = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectPayload)
    });
    
    if (!projectResponse.ok) {
      const error = await projectResponse.json();
      throw new Error(`Failed to create project: ${JSON.stringify(error)}`);
    }
    
    const project = await projectResponse.json();
    const projectId = project.id;
    
    console.log(`   Created project ID: ${projectId}`);
    
    // Step 2: Generate estimate
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [] // No images for testing
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (testCase.expectedChecks.hasError) {
      if (result.error || result.message) {
        console.log(`   ✅ PASSED: Error returned as expected`);
        return { passed: true, details: result };
      } else {
        console.log(`   ❌ FAILED: Expected error but got: ${JSON.stringify(result).substring(0, 200)}`);
        return { passed: false, details: result };
      }
    }

    // Extract cost estimates from the response
    const report = result.report || result.breakdown || result;
    const costEstimates = report.costEstimates || report;
    const labor = costEstimates.labor || {};
    const materials = costEstimates.materials || {};
    const equipment = costEstimates.equipment || {};
    
    const laborHours = labor.totalHours || 0;
    const laborCost = labor.total || 0;
    const materialsCost = materials.total || 0;
    const equipmentCost = equipment.total || 0;
    const totalCost = laborCost + materialsCost + equipmentCost;
    const laborPercentage = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
    
    console.log(`   Results:`);
    console.log(`     Labor Hours: ${laborHours}`);
    console.log(`     Labor Cost: $${laborCost}`);
    console.log(`     Materials Cost: $${materialsCost}`);
    console.log(`     Equipment Cost: $${equipmentCost}`);
    console.log(`     Total Cost: $${totalCost}`);
    console.log(`     Labor %: ${laborPercentage.toFixed(1)}%`);
    
    // Check debris removal
    const equipmentItems = equipment.items || [];
    const hasDebrisRemoval = equipmentItems.some((item: any) => 
      item.item?.toLowerCase().includes('debris') || 
      item.item?.toLowerCase().includes('dumpster')
    );
    
    const checks: string[] = [];
    const failures: string[] = [];
    
    if (testCase.expectedChecks.laborHours) {
      if (laborHours >= testCase.expectedChecks.laborHours.min && 
          laborHours <= testCase.expectedChecks.laborHours.max) {
        checks.push(`✅ Labor hours: ${laborHours} (expected ${testCase.expectedChecks.laborHours.min}-${testCase.expectedChecks.laborHours.max})`);
      } else {
        failures.push(`❌ Labor hours: ${laborHours} (expected ${testCase.expectedChecks.laborHours.min}-${testCase.expectedChecks.laborHours.max})`);
      }
    }
    
    if (testCase.expectedChecks.laborCost) {
      if (laborCost >= testCase.expectedChecks.laborCost.min && 
          laborCost <= testCase.expectedChecks.laborCost.max) {
        checks.push(`✅ Labor cost: $${laborCost} (expected $${testCase.expectedChecks.laborCost.min}-$${testCase.expectedChecks.laborCost.max})`);
      } else {
        failures.push(`❌ Labor cost: $${laborCost} (expected $${testCase.expectedChecks.laborCost.min}-$${testCase.expectedChecks.laborCost.max})`);
      }
    }
    
    if (testCase.expectedChecks.laborPercentage) {
      if (laborPercentage >= testCase.expectedChecks.laborPercentage.min && 
          laborPercentage <= testCase.expectedChecks.laborPercentage.max) {
        checks.push(`✅ Labor %: ${laborPercentage.toFixed(1)}% (expected ${testCase.expectedChecks.laborPercentage.min}-${testCase.expectedChecks.laborPercentage.max}%)`);
      } else {
        failures.push(`❌ Labor %: ${laborPercentage.toFixed(1)}% (expected ${testCase.expectedChecks.laborPercentage.min}-${testCase.expectedChecks.laborPercentage.max}%)`);
      }
    }
    
    if (testCase.expectedChecks.totalCost) {
      if (totalCost >= testCase.expectedChecks.totalCost.min && 
          totalCost <= testCase.expectedChecks.totalCost.max) {
        checks.push(`✅ Total cost: $${totalCost} (expected $${testCase.expectedChecks.totalCost.min}-$${testCase.expectedChecks.totalCost.max})`);
      } else {
        failures.push(`❌ Total cost: $${totalCost} (expected $${testCase.expectedChecks.totalCost.min}-$${testCase.expectedChecks.totalCost.max})`);
      }
    }
    
    if (testCase.expectedChecks.hasDebrisRemoval !== undefined) {
      if (hasDebrisRemoval === testCase.expectedChecks.hasDebrisRemoval) {
        checks.push(`✅ Debris removal: ${hasDebrisRemoval ? 'included' : 'not included'} as expected`);
      } else {
        failures.push(`❌ Debris removal: expected ${testCase.expectedChecks.hasDebrisRemoval ? 'included' : 'not included'} but got ${hasDebrisRemoval ? 'included' : 'not included'}`);
      }
    }
    
    checks.forEach(c => console.log(`   ${c}`));
    failures.forEach(f => console.log(`   ${f}`));
    
    return {
      passed: failures.length === 0,
      details: {
        laborHours,
        laborCost,
        materialsCost,
        equipmentCost,
        totalCost,
        laborPercentage,
        hasDebrisRemoval,
        checks,
        failures
      }
    };
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return { passed: false, details: { error: error instanceof Error ? error.message : String(error) } };
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests');
  console.log(`   API Base URL: ${API_BASE}`);
  console.log(`   Make sure the server is running: npm run dev`);
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_BASE}/api/projects`);
    if (!healthCheck.ok) {
      console.log(`\n❌ Server is not responding at ${API_BASE}`);
      console.log(`   Please start the server with: npm run dev`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`\n❌ Cannot connect to server at ${API_BASE}`);
    console.log(`   Please start the server with: npm run dev`);
    process.exit(1);
  }
  
  const testCases = [testCase1, testCase6, testCase9];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
  }
}

// Run tests
runAllTests().catch(console.error);

