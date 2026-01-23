/**
 * Comprehensive automated test suite for all 15 test cases
 * Tests the cost calculator with OpenAI API
 */

import 'dotenv/config';
import { RealCostCalculator } from './server/cost-calculator.js';
import type { ProjectRequirements } from './server/cost-calculator.js';

interface TestCase {
  name: string;
  description: string;
  payload: ProjectRequirements;
  expected: {
    laborHours?: { min: number; max: number };
    laborCost?: { min: number; max: number };
    laborPercentage?: { min: number; max: number };
    totalCost?: { min: number; max: number };
    materialsCost?: { min: number; max: number };
    hasDebrisRemoval?: boolean;
    hasError?: boolean;
    errorMessage?: string;
  };
}

const calculator = new RealCostCalculator();

// Base test case data
const baseCase: Partial<ProjectRequirements> = {
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
};

// Test Case 1: BASELINE
const testCase1: TestCase = {
  name: 'BASELINE',
  description: 'Standard residential full replacement',
  payload: baseCase as ProjectRequirements,
  expected: {
    laborHours: { min: 40, max: 60 },
    laborCost: { min: 2000, max: 3000 },
    laborPercentage: { min: 25, max: 35 }, // Adjusted to match mathematical reality with materials $3800-$5200
    totalCost: { min: 6800, max: 9800 },
    materialsCost: { min: 3800, max: 5200 },
    hasDebrisRemoval: true
  }
};

// Test Case 2: ROOF PITCH IMPACT (Steep Roof)
const testCase2: TestCase = {
  name: 'ROOF PITCH IMPACT (Steep Roof)',
  description: 'Steep slope roof with steep assist',
  payload: {
    ...baseCase,
    roofPitch: "Steep Slope (9-12/12)",
    laborNeeds: {
      workerCount: "1-2 Workers",
      steepAssist: true
    }
  } as ProjectRequirements,
  expected: {
    laborHours: { min: 52, max: 90 }, // 40-60 base + 30-50%
    totalCost: { min: 9000, max: 13000 }
  }
};

// Test Case 3: MATERIAL CHANGE (Luxury Material)
const testCase3: TestCase = {
  name: 'MATERIAL CHANGE (Luxury Material)',
  description: 'Slate luxury material',
  payload: {
    ...baseCase,
    materials: {
      layers: ["Slate"],
      feltType: "Synthetic",
      extras: ["Ice/Water Shield", "Drip Edge"]
    },
    materialPreference: "Luxury"
  } as ProjectRequirements,
  expected: {
    materialsCost: { min: 18000, max: 25000 },
    laborCost: { min: 4000, max: 6000 },
    totalCost: { min: 25000, max: 34000 }
  }
};

// Test Case 4: MULTIPLE MATERIAL LAYERS
const testCase4: TestCase = {
  name: 'MULTIPLE MATERIAL LAYERS',
  description: 'Multiple layers to remove',
  payload: {
    ...baseCase,
    materials: {
      layers: ["Asphalt Shingles", "Metal Roofing"],
      feltType: "30 lb",
      extras: ["Ice/Water Shield"]
    }
  } as ProjectRequirements,
  expected: {
    totalCost: { min: 13400, max: 19100 }
  }
};

// Test Case 5: OLD ROOF (Risk Factor)
const testCase5: TestCase = {
  name: 'OLD ROOF (Risk Factor)',
  description: '35 year old roof',
  payload: {
    ...baseCase,
    roofAge: 35
  } as ProjectRequirements,
  expected: {
    laborCost: { min: 2300, max: 3400 },
    totalCost: { min: 7200, max: 10800 }
  }
};

// Test Case 6: PARTIAL REPAIR
const testCase6: TestCase = {
  name: 'PARTIAL REPAIR',
  description: 'Partial repair job',
  payload: {
    ...baseCase,
    jobType: "Partial Repair",
    lineItems: [
      "Shingles/Roofing Material",
      "Flashing (All Types)"
    ]
  } as ProjectRequirements,
  expected: {
    laborHours: { min: 8, max: 20 },
    totalCost: { min: 1900, max: 3600 }
  }
};

// Test Case 7: COMMERCIAL STRUCTURE
const testCase7: TestCase = {
  name: 'COMMERCIAL STRUCTURE',
  description: 'Commercial warehouse',
  payload: {
    ...baseCase,
    projectType: "Commercial",
    structureType: "Warehouse",
    roofPitch: "Low Slope (2-4/12)",
    materials: {
      layers: ["Built-up Roofing (BUR)"],
      feltType: "Synthetic"
    }
  } as ProjectRequirements,
  expected: {
    laborCost: { min: 4000, max: 6000 },
    totalCost: { min: 13200, max: 19300 }
  }
};

// Test Case 8: LINE ITEMS STRESS
const testCase8: TestCase = {
  name: 'LINE ITEMS STRESS',
  description: 'All line items included',
  payload: {
    ...baseCase,
    lineItems: [
      "Shingles/Roofing Material",
      "Underlayment & Felt",
      "Ice & Water Shield",
      "Drip Edge & Trim",
      "Gutters & Downspouts",
      "Flashing (All Types)",
      "Skylight Installation",
      "Deck Repair/Replacement",
      "Structural Reinforcement",
      "Permit & Inspection Fees"
    ]
  } as ProjectRequirements,
  expected: {
    totalCost: { min: 13400, max: 22750 }
  }
};

// Test Case 9: INVALID / EDGE INPUT
const testCase9: TestCase = {
  name: 'INVALID / EDGE INPUT',
  description: 'Negative roof age and 0 workers',
  payload: {
    ...baseCase,
    roofAge: -5,
    laborNeeds: {
      workerCount: "0 Workers",
      steepAssist: false
    }
  } as ProjectRequirements,
  expected: {
    hasError: true
  }
};

// Test Case 10: EXTREME WEATHER REGION
const testCase10: TestCase = {
  name: 'EXTREME WEATHER REGION',
  description: 'Hurricane straps and high-wind shingles',
  payload: {
    ...baseCase,
    materials: {
      layers: ["Asphalt Shingles"],
      feltType: "15 lb",
      extras: ["Hurricane Straps", "High-Wind Shingles"]
    }
  } as ProjectRequirements,
  expected: {
    totalCost: { min: 8000, max: 11500 }
  }
};

// Test Case 11: HISTORICAL HOME
const testCase11: TestCase = {
  name: 'HISTORICAL HOME',
  description: '100 year old home with wood shakes',
  payload: {
    ...baseCase,
    roofAge: 100,
    materials: {
      layers: ["Wood Shakes"],
      feltType: "15 lb"
    }
  } as ProjectRequirements,
  expected: {
    materialsCost: { min: 10000, max: 15000 },
    laborCost: { min: 8000, max: 12000 },
    totalCost: { min: 19800, max: 29700 }
  }
};

// Test Case 12: LABOR SHORTAGE / RUSH JOB
const testCase12: TestCase = {
  name: 'LABOR SHORTAGE / RUSH JOB',
  description: '10+ workers for rush job',
  payload: {
    ...baseCase,
    laborNeeds: {
      workerCount: "10+ Workers",
      steepAssist: false
    }
  } as ProjectRequirements,
  expected: {
    laborCost: { min: 6000, max: 8500 },
    totalCost: { min: 10800, max: 15300 }
  }
};

// Test Case 13: OVER-SPECIFIED MATERIALS
const testCase13: TestCase = {
  name: 'OVER-SPECIFIED MATERIALS',
  description: 'Metal roofing',
  payload: {
    ...baseCase,
    materials: {
      layers: ["Metal Roofing"],
      feltType: "15 lb"
    }
  } as ProjectRequirements,
  expected: {
    materialsCost: { min: 12000, max: 18000 },
    laborCost: { min: 8000, max: 12000 },
    totalCost: { min: 23100, max: 34900 }
  }
};

// Test Case 14: GEOGRAPHIC ACCESSIBILITY (NYC)
const testCase14: TestCase = {
  name: 'GEOGRAPHIC ACCESSIBILITY (NYC)',
  description: 'New York City location',
  payload: {
    ...baseCase,
    location: { country: "USA", state: "New York", city: "New York City", zip: "10001" },
    lineItems: [
      "Shingles/Roofing Material",
      "Underlayment & Felt",
      "Debris Removal",
      "Crane Rental"
    ]
  } as ProjectRequirements,
  expected: {
    laborCost: { min: 7000, max: 10000 }, // 2x multiplier
    totalCost: { min: 15800, max: 22500 }
  }
};

// Test Case 15: MULTI-LEVEL STRUCTURE
const testCase15: TestCase = {
  name: 'MULTI-LEVEL STRUCTURE',
  description: '3-story multi-family',
  payload: {
    ...baseCase,
    structureType: "Multi-Family / 3-Story",
    roofPitch: "Standard (4-7/12)"
  } as ProjectRequirements,
  expected: {
    laborCost: { min: 7000, max: 10500 },
    totalCost: { min: 14500, max: 22500 }
  }
};

const allTestCases: TestCase[] = [
  testCase1, testCase2, testCase3, testCase4, testCase5,
  testCase6, testCase7, testCase8, testCase9, testCase10,
  testCase11, testCase12, testCase13, testCase14, testCase15
];

interface TestResult {
  testCase: string;
  passed: boolean;
  details: any;
  errors: string[];
}

function extractCosts(result: any): {
  laborHours: number;
  laborCost: number;
  materialsCost: number;
  equipmentCost: number;
  totalCost: number;
  laborPercentage: number;
  hasDebrisRemoval: boolean;
} {
  // Try to extract from direct fields first (from OpenAI calculations)
  let laborHours = 0;
  let laborCost = result.laborCost || 0;
  let materialsCost = result.materialsCost || 0;
  let equipmentCost = 0;
  let totalCost = result.totalCost || 0;
  
  // Try to extract from report structure (from Watsonx)
  const report = result.report || result.breakdown || result;
  const costEstimates = report.costEstimates || {};
  const labor = costEstimates.labor || {};
  const materials = costEstimates.materials || {};
  const equipment = costEstimates.equipment || {};
  
  // Use costEstimates if direct fields are not available
  if (!laborCost && labor.total) {
    laborCost = labor.total;
  }
  if (!materialsCost && materials.total) {
    materialsCost = materials.total;
  }
  if (equipment.total) {
    equipmentCost = equipment.total;
  }
  
  // Extract labor hours
  laborHours = labor.totalHours || laborHours || 0;
  
  // Calculate total if not provided
  if (!totalCost || totalCost === 0) {
    totalCost = laborCost + materialsCost + equipmentCost + (result.permitsCost || 0) + (result.contingencyCost || 0);
  }
  
  const laborPercentage = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
  
  // Check for debris removal in equipment items
  const equipmentItems = equipment.items || [];
  const hasDebrisRemoval = equipmentItems.some((item: any) => 
    (item.item?.toLowerCase().includes('debris') || 
     item.item?.toLowerCase().includes('dumpster')) &&
    (item.cost && item.cost > 0)
  ) || result.lineItems?.includes('Debris Removal');
  
  return {
    laborHours,
    laborCost,
    materialsCost,
    equipmentCost,
    totalCost,
    laborPercentage,
    hasDebrisRemoval
  };
}

function validateTestCase(testCase: TestCase, result: any): TestResult {
  const errors: string[] = [];
  const details: any = {};
  
  if (testCase.expected.hasError) {
    if (result.error || result.message || result.details?.error) {
      return {
        testCase: testCase.name,
        passed: true,
        details: { error: result.error || result.message || result.details?.error },
        errors: []
      };
    } else {
      return {
        testCase: testCase.name,
        passed: false,
        details: result,
        errors: ['Expected error but got successful response']
      };
    }
  }
  
  const costs = extractCosts(result);
  details.costs = costs;
  
  if (testCase.expected.laborHours) {
    if (costs.laborHours < testCase.expected.laborHours.min || 
        costs.laborHours > testCase.expected.laborHours.max) {
      errors.push(`Labor hours ${costs.laborHours} outside expected range ${testCase.expected.laborHours.min}-${testCase.expected.laborHours.max}`);
    }
  }
  
  if (testCase.expected.laborCost) {
    if (costs.laborCost < testCase.expected.laborCost.min || 
        costs.laborCost > testCase.expected.laborCost.max) {
      errors.push(`Labor cost $${costs.laborCost} outside expected range $${testCase.expected.laborCost.min}-$${testCase.expected.laborCost.max}`);
    }
  }
  
  if (testCase.expected.laborPercentage) {
    if (costs.laborPercentage < testCase.expected.laborPercentage.min || 
        costs.laborPercentage > testCase.expected.laborPercentage.max) {
      errors.push(`Labor percentage ${costs.laborPercentage.toFixed(1)}% outside expected range ${testCase.expected.laborPercentage.min}-${testCase.expected.laborPercentage.max}%`);
    }
  }
  
  if (testCase.expected.totalCost) {
    if (costs.totalCost < testCase.expected.totalCost.min || 
        costs.totalCost > testCase.expected.totalCost.max) {
      errors.push(`Total cost $${costs.totalCost} outside expected range $${testCase.expected.totalCost.min}-$${testCase.expected.totalCost.max}`);
    }
  }
  
  if (testCase.expected.materialsCost) {
    if (costs.materialsCost < testCase.expected.materialsCost.min || 
        costs.materialsCost > testCase.expected.materialsCost.max) {
      errors.push(`Materials cost $${costs.materialsCost} outside expected range $${testCase.expected.materialsCost.min}-$${testCase.expected.materialsCost.max}`);
    }
  }
  
  if (testCase.expected.hasDebrisRemoval !== undefined) {
    if (costs.hasDebrisRemoval !== testCase.expected.hasDebrisRemoval) {
      errors.push(`Debris removal expected ${testCase.expected.hasDebrisRemoval} but got ${costs.hasDebrisRemoval}`);
    }
  }
  
  return {
    testCase: testCase.name,
    passed: errors.length === 0,
    details,
    errors
  };
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Comprehensive Test Suite');
  console.log('=====================================\n');
  
  // Check API keys
  if (!process.env.OPENAI_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_KEY or OPENAI_API_KEY not found in environment');
    console.error('   Please set OPENAI_KEY in your .env file');
    process.exit(1);
  }
  
  if (!process.env.IBM_WATSONX_AI_API_KEY) {
    console.error('❌ ERROR: IBM_WATSONX_AI_API_KEY not found in environment');
    console.error('   Please set IBM_WATSONX_AI_API_KEY in your .env file');
    process.exit(1);
  }
  
  console.log('✅ API keys found');
  console.log(`   OpenAI: ${(process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || '').slice(0, 8)}...`);
  console.log(`   IBM Watsonx: ${(process.env.IBM_WATSONX_AI_API_KEY || '').slice(0, 8)}...\n`);
  
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < allTestCases.length; i++) {
    const testCase = allTestCases[i];
    console.log(`\n[${i + 1}/15] Testing: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    
    try {
      const result = await calculator.calculateRealCost(testCase.payload);
      const testResult = validateTestCase(testCase, result);
      results.push(testResult);
      
      if (testResult.passed) {
        console.log(`   ✅ PASSED`);
        passed++;
        if (testResult.details.costs) {
          const c = testResult.details.costs;
          console.log(`      Labor Hours: ${c.laborHours}`);
          console.log(`      Labor Cost: $${c.laborCost.toFixed(2)} (${c.laborPercentage.toFixed(1)}%)`);
          console.log(`      Materials: $${c.materialsCost.toFixed(2)}`);
          console.log(`      Equipment: $${c.equipmentCost.toFixed(2)}`);
          console.log(`      Total: $${c.totalCost.toFixed(2)}`);
        }
      } else {
        console.log(`   ❌ FAILED`);
        failed++;
        testResult.errors.forEach(err => console.log(`      - ${err}`));
      }
    } catch (error) {
      // Validate error result for test cases that expect errors
      const errorResult = {
        details: { error: error instanceof Error ? error.message : String(error) }
      };
      const testResult = validateTestCase(testCase, errorResult as any);
      results.push(testResult);
      
      if (testResult.passed) {
        console.log(`   ✅ PASSED (Expected Error)`);
        console.log(`      Error: ${error instanceof Error ? error.message : String(error)}`);
        passed++;
      } else {
        console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }
    
    // Wait between tests to avoid rate limiting
    if (i < allTestCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`Total Tests: ${allTestCases.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / allTestCases.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n   ${r.testCase}:`);
      r.errors.forEach(err => console.log(`      - ${err}`));
    });
  }
  
  if (passed === allTestCases.length) {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

