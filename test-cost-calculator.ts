/**
 * Test script to validate cost calculator prompt generation
 * This script tests that the prompt includes all necessary rules for the test cases
 * 
 * Note: This validates the prompt structure, not actual Gemini API responses.
 * To test actual cost calculations, use the API endpoint with real test data.
 */

// We'll test the prompt by checking if it includes required keywords
// Since buildRolePrompt is private, we'll create a test version

// Test case 1: BASELINE
const testCase1 = {
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
  role: "contractor"
};

// Test case 2: ROOF PITCH IMPACT (Steep Roof)
const testCase2 = {
  ...testCase1,
  roofPitch: "Steep Slope (9-12/12)",
  laborNeeds: {
    workerCount: "1-2 Workers",
    steepAssist: true
  }
};

// Test case 3: MATERIAL CHANGE (Luxury Material)
const testCase3 = {
  ...testCase1,
  materials: {
    layers: ["Slate"],
    feltType: "Synthetic",
    extras: ["Ice/Water Shield", "Drip Edge"]
  },
  materialPreference: "Luxury"
};

// Test case 4: MULTIPLE MATERIAL LAYERS
const testCase4 = {
  ...testCase1,
  materials: {
    layers: ["Asphalt Shingles", "Metal Roofing"],
    feltType: "30 lb",
    extras: ["Ice/Water Shield"]
  }
};

// Test case 5: OLD ROOF (Risk Factor)
const testCase5 = {
  ...testCase1,
  roofAge: 35
};

// Test case 6: PARTIAL REPAIR
const testCase6 = {
  ...testCase1,
  jobType: "Partial Repair",
  lineItems: [
    "Shingles/Roofing Material",
    "Flashing (All Types)"
  ]
};

// Test case 7: COMMERCIAL STRUCTURE
const testCase7 = {
  ...testCase1,
  projectType: "Commercial",
  structureType: "Warehouse",
  roofPitch: "Low Slope (2-4/12)",
  materials: {
    layers: ["Built-up Roofing (BUR)"],
    feltType: "Synthetic"
  }
};

// Test case 8: LINE ITEMS STRESS
const testCase8 = {
  ...testCase1,
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
};

// Test case 9: INVALID / EDGE INPUT
const testCase9 = {
  ...testCase1,
  roofAge: -5,
  laborNeeds: {
    workerCount: "0 Workers",
    steepAssist: false
  }
};

// Test case 10: EXTREME WEATHER REGION
const testCase10 = {
  ...testCase1,
  materials: {
    layers: ["Asphalt Shingles"],
    feltType: "15 lb",
    extras: ["Hurricane Straps", "High-Wind Shingles"]
  }
};

// Test case 11: EXTREME WEATHER REGION (Historical)
const testCase11 = {
  ...testCase1,
  roofAge: 100,
  materials: {
    layers: ["Wood Shakes"],
    feltType: "15 lb"
  }
};

// Test case 12: LABOR SHORTAGE / RUSH JOB
const testCase12 = {
  ...testCase1,
  laborNeeds: {
    workerCount: "10+ Workers",
    steepAssist: false
  }
};

// Test case 13: OVER-SPECIFIED MATERIALS
const testCase13 = {
  ...testCase1,
  materials: {
    layers: ["Metal Roofing"],
    feltType: "15 lb"
  }
};

// Test case 14: GEOGRAPHIC ACCESSIBILITY
const testCase14 = {
  ...testCase1,
  location: { country: "USA", state: "New York", city: "New York City", zip: "10001" },
  lineItems: [
    "Debris Removal",
    "Crane Rental"
  ]
};

// Test case 15: MULTI-LEVEL STRUCTURE
const testCase15 = {
  ...testCase1,
  structureType: "Multi-Family / 3-Story",
  roofPitch: "Standard (4-7/12)"
};

/**
 * Test that prompt includes critical rules
 */
function testPromptIncludesRules(prompt: string): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for labor hours rules
  if (!prompt.includes('40-60') || !prompt.includes('total man-hours')) {
    issues.push('Missing: Labor hours should be 40-60 for full replace');
  }
  
  // Check for labor cost percentage
  if (!prompt.includes('40-50%') || !prompt.includes('total project cost')) {
    issues.push('Missing: Labor cost must be 40-50% of total');
  }
  
  // Check for debris removal
  if (!prompt.includes('Debris Removal') || !prompt.includes('Dumpster')) {
    issues.push('Missing: Debris removal costs');
  }
  
  // Check for material types
  if (!prompt.includes('Slate') || !prompt.includes('Metal Roofing')) {
    issues.push('Missing: Material type pricing (Slate, Metal)');
  }
  
  // Check for roof age adjustments
  if (!prompt.includes('30+ years') || !prompt.includes('decking')) {
    issues.push('Missing: Roof age adjustments');
  }
  
  // Check for geographic multipliers
  if (!prompt.includes('NYC') || !prompt.includes('2x')) {
    issues.push('Missing: Geographic location multipliers');
  }
  
  // Check for commercial handling
  if (!prompt.includes('Commercial') || !prompt.includes('$5,000-$8,000')) {
    issues.push('Missing: Commercial structure handling');
  }
  
  // Check for input validation
  if (!prompt.includes('negative') || !prompt.includes('Invalid input')) {
    issues.push('Missing: Input validation rules');
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Cost Calculator Prompt Generation\n');
  
  const testCases = [
    { name: 'BASELINE', data: testCase1 },
    { name: 'ROOF PITCH IMPACT', data: testCase2 },
    { name: 'MATERIAL CHANGE (Luxury)', data: testCase3 },
    { name: 'MULTIPLE MATERIAL LAYERS', data: testCase4 },
    { name: 'OLD ROOF', data: testCase5 },
    { name: 'PARTIAL REPAIR', data: testCase6 },
    { name: 'COMMERCIAL STRUCTURE', data: testCase7 },
    { name: 'LINE ITEMS STRESS', data: testCase8 },
    { name: 'INVALID INPUT', data: testCase9 },
    { name: 'EXTREME WEATHER', data: testCase10 },
    { name: 'HISTORICAL HOME', data: testCase11 },
    { name: 'LARGE CREW', data: testCase12 },
    { name: 'METAL ROOFING', data: testCase13 },
    { name: 'NYC LOCATION', data: testCase14 },
    { name: 'MULTI-LEVEL', data: testCase15 }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      // Access the private method using type assertion (for testing only)
      const prompt = (calculator as any).buildRolePrompt('contractor', testCase.data);
      
      const result = testPromptIncludesRules(prompt);
      
      if (result.passed) {
        console.log(`✅ ${testCase.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}: FAILED`);
        console.log(`   Issues: ${result.issues.join(', ')}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All prompt generation tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testPromptIncludesRules };

