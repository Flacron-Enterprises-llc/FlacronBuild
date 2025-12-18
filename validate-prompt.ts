/**
 * Simple validation script to check if cost calculator prompt includes all required rules
 * Run with: tsx validate-prompt.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const costCalculatorPath = join(process.cwd(), 'server', 'cost-calculator.ts');
const fileContent = readFileSync(costCalculatorPath, 'utf-8');

// Extract the contractor prompt section
const contractorPromptStart = fileContent.indexOf('case "contractor":');
const contractorPromptEnd = fileContent.indexOf('case "homeowner":', contractorPromptStart);
const contractorPrompt = fileContent.substring(contractorPromptStart, contractorPromptEnd);

console.log('🔍 Validating Cost Calculator Prompt...\n');

const checks = [
  {
    name: 'Labor Hours Rule (40-60 hours)',
    keywords: ['40-60', 'total man-hours', 'NOT 10 hours'],
    required: true
  },
  {
    name: 'Labor Cost Percentage (40-50%)',
    keywords: ['40-50%', 'total project cost', 'NOT $650'],
    required: true
  },
  {
    name: 'Debris Removal Costs',
    keywords: ['Debris Removal', 'Dumpster', '$400-$800'],
    required: true
  },
  {
    name: 'Material Types (Slate, Metal)',
    keywords: ['Slate', 'Metal Roofing', '$12.00-$20.00'],
    required: true
  },
  {
    name: 'Roof Age Adjustments',
    keywords: ['30+ years', 'decking', 'flashing'],
    required: true
  },
  {
    name: 'Geographic Multipliers (NYC)',
    keywords: ['NYC', '2x', 'multiplier'],
    required: true
  },
  {
    name: 'Commercial Structure Handling',
    keywords: ['Commercial', '$5,000-$8,000', 'minimum'],
    required: true
  },
  {
    name: 'Input Validation',
    keywords: ['negative', 'Invalid input', 'error'],
    required: true
  },
  {
    name: 'Steep Roof Adjustments',
    keywords: ['Steep', '+30-50%', 'steepAssist'],
    required: true
  },
  {
    name: 'Partial Repair Handling',
    keywords: ['Partial Repair', '$1,300-$2,600', '8-20 hours'],
    required: true
  },
  {
    name: 'Line Items Costs',
    keywords: ['Gutters', 'Skylight', 'Permit'],
    required: true
  },
  {
    name: 'Worker Count Variations',
    keywords: ['1-2 Workers', '10+ Workers', 'supervision'],
    required: true
  }
];

let passed = 0;
let failed = 0;
const issues: string[] = [];

for (const check of checks) {
  const found = check.keywords.every(keyword => 
    contractorPrompt.includes(keyword)
  );
  
  if (found) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    console.log(`❌ ${check.name}`);
    const missing = check.keywords.filter(k => !contractorPrompt.includes(k));
    issues.push(`${check.name}: Missing keywords - ${missing.join(', ')}`);
    failed++;
  }
}

console.log(`\n📊 Validation Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  process.exit(1);
} else {
  console.log('\n✅ All prompt validation checks passed!');
  console.log('   The prompt includes all necessary rules for the test cases.');
  console.log('   Next step: Test with actual API calls using TEST_CASES_GUIDE.md');
  process.exit(0);
}

