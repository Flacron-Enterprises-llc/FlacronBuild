# Test Cases Validation Guide

This document provides a guide for testing the cost calculator against all test cases.

## Prerequisites

1. Ensure the server is running: `npm run dev`
2. Ensure you have a valid `GEMINI_KEY` in your `.env` file
3. Use the contractor role for all test cases

## Test Case Execution

### Test Case 1: BASELINE
**Payload:**
```json
{
  "country": "USA",
  "state": "Texas",
  "city": "Houston",
  "zip": "77001",
  "projectType": "Residential",
  "structureType": "Single Family Home",
  "roofPitch": "Flat (0-2/12)",
  "roofAge": 10,
  "materials": {
    "layers": ["Asphalt Shingles"],
    "feltType": "15 lb"
  },
  "jobType": "Full Replace",
  "materialPreference": "Standard",
  "workerCount": "1-2 Workers",
  "steepAssist": false,
  "lineItems": [
    "Shingles/Roofing Material",
    "Underlayment & Felt",
    "Debris Removal"
  ],
  "role": "contractor"
}
```

**Expected Results:**
- Labor Hours: 40-60 hours (NOT 10!)
- Labor Cost: $3,500-$5,000 (40-50% of total, NOT $650)
- Debris Removal: $500-$800 (included in equipment)
- Total: $7,600-$11,200

**Validation Checklist:**
- [ ] Labor hours are 40-60, not 10
- [ ] Labor cost is 40-50% of total
- [ ] Debris removal is included in equipment costs
- [ ] Total cost is in expected range

---

### Test Case 2: ROOF PITCH IMPACT (Steep Roof)
**Changes from TC-1:**
- `roofPitch`: "Steep Slope (9-12/12)"
- `steepAssist`: true

**Expected Results:**
- Labor Hours: 52-90 hours (40-60 base + 30-50% for steep)
- Labor Cost: $3,300-$5,100 (higher rate for steep)
- Steep Assist Equipment: $300-$600
- Total: $11,200-$18,400

**Validation Checklist:**
- [ ] Labor hours increased by 30-50%
- [ ] Labor rate is higher ($75+ per hour)
- [ ] Steep assist equipment is included
- [ ] Total reflects steep roof premium

---

### Test Case 3: MATERIAL CHANGE (Luxury Material)
**Changes from TC-1:**
- `materials.layers`: ["Slate"]
- `materials.feltType`: "Synthetic"
- `materials.extras`: ["Ice/Water Shield", "Drip Edge"]
- `materialPreference`: "Luxury"

**Expected Results:**
- Materials: $15,000-$25,000 (Slate is $12-20/sq ft)
- Labor: $12,000-$18,000 (specialized slate artisans, 50-100% more hours)
- Debris Removal: $1,500-$2,500 (heavy slate requires multiple dumpsters)
- Total: $33,000-$53,000

**Validation Checklist:**
- [ ] Slate material cost is $12-20/sq ft
- [ ] Labor hours increased 50-100% for specialized work
- [ ] Debris removal is higher due to weight
- [ ] Total reflects luxury material premium

---

### Test Case 4: MULTIPLE MATERIAL LAYERS
**Changes from TC-1:**
- `materials.layers`: ["Asphalt Shingles", "Metal Roofing"]
- `materials.feltType`: "30 lb"
- `materials.extras`: ["Ice/Water Shield"]

**Expected Results:**
- Tear-off: $2,500-$3,500 (double layers = 50-100% more)
- Materials: $5,000-$8,000 (premium/metal materials)
- Labor: $6,000-$9,000 (specialized, takes longer)
- Debris Removal: $1,200-$1,600 (heavy disposal)
- Total: $15,900-$23,900

**Validation Checklist:**
- [ ] Tear-off cost increased for multiple layers
- [ ] Labor hours increased 25-50%
- [ ] Debris removal accounts for heavy materials
- [ ] Total reflects complexity

---

### Test Case 5: OLD ROOF (Risk Factor)
**Changes from TC-1:**
- `roofAge`: 35

**Expected Results:**
- Base Replacement: $7,600-$11,200
- Decking/Plywood Repair: $800-$2,000 (10-20% wood rot)
- Flashing & Boots: $400-$700 (old metal rusted)
- Extra Labor: $500-$1,000 (brittle shingles take longer)
- Total: $9,300-$14,900

**Validation Checklist:**
- [ ] Decking repair costs included
- [ ] Flashing replacement costs included
- [ ] Labor hours increased 20-40% for old roof
- [ ] Total includes all age-related repairs

---

### Test Case 6: PARTIAL REPAIR
**Changes from TC-1:**
- `jobType`: "Partial Repair"
- `lineItems`: ["Shingles/Roofing Material", "Flashing (All Types)"]

**Expected Results:**
- Materials: $150-$300 (1-2 bundles)
- Flashing: $400-$800
- Labor: $600-$1,200 (8-20 hours)
- Equipment: $150-$300
- Total: $1,300-$2,600

**Validation Checklist:**
- [ ] Uses simplified partial repair costs
- [ ] Labor hours are 8-20, not 40-60
- [ ] Total is much lower than full replace
- [ ] Only selected line items are included

---

### Test Case 7: COMMERCIAL STRUCTURE
**Changes from TC-1:**
- `projectType`: "Commercial"
- `structureType`: "Warehouse"
- `roofPitch`: "Low Slope (2-4/12)"
- `materials.layers`: ["Built-up Roofing (BUR)"]

**Expected Results:**
- Materials: $10,000+ (BUR commercial materials)
- Labor: $5,000-$8,000 (skilled "Hot-Roofing" crew minimum)
- Equipment: $2,500+ (specialized commercial equipment)
- Total: $18,000-$25,000 (NOT $7,000!)

**Validation Checklist:**
- [ ] Labor cost is minimum $5,000-$8,000
- [ ] Commercial equipment costs included
- [ ] BUR material pricing used
- [ ] Total reflects commercial rates

---

### Test Case 8: LINE ITEMS STRESS
**Changes from TC-1:**
- `lineItems`: [All 10 line items including Gutters, Skylights, Deck Repair, Permits, etc.]

**Expected Results:**
- Primary Roofing: $8,000-$11,000
- Ice & Water Shield: $600-$900
- Drip Edge & Flashing: $800-$1,500
- Gutters & Downspouts: $2,200-$4,500
- Skylight Installation: $2,500-$5,000
- Deck & Structure: $1,500-$3,500
- Permits & Fees: $150-$350
- Total: $15,750-$26,750

**Validation Checklist:**
- [ ] All line items are accounted for
- [ ] Gutters cost is $2,200-$4,500
- [ ] Skylight cost is $2,500-$5,000
- [ ] Deck repair is included
- [ ] Permits are included
- [ ] Total includes all components

---

### Test Case 9: INVALID / EDGE INPUT
**Changes from TC-1:**
- `roofAge`: -5
- `workerCount`: "0 Workers"

**Expected Results:**
- Error JSON returned with user-friendly message
- No estimate generated

**Validation Checklist:**
- [ ] Error JSON is returned
- [ ] Error message is user-friendly
- [ ] No cost estimate is generated
- [ ] Validation happens before calculations

---

### Test Case 10: EXTREME WEATHER REGION
**Changes from TC-1:**
- `materials.extras`: ["Hurricane Straps", "High-Wind Shingles"]

**Expected Results:**
- High-Wind Shingles: +$1,300 premium
- Hurricane Straps: $600-$1,800 (materials + install)
- Labor: $4,500-$6,500 (+$1,500 for attic work)
- Total: $10,500-$16,300

**Validation Checklist:**
- [ ] High-wind shingle premium included
- [ ] Hurricane straps cost included
- [ ] Labor increased for strap installation
- [ ] Total reflects weather protection

---

### Test Case 11: HISTORICAL HOME (100 years)
**Changes from TC-1:**
- `roofAge`: 100
- `materials.layers`: ["Wood Shakes"]

**Expected Results:**
- Old Roof Removal: $2,500-$4,000 (multiple hidden layers)
- Wood Shake Material: $8,500-$12,000
- New Decking: $3,000-$5,000
- Specialized Labor: $10,000-$15,000 (100+ man-hours)
- Total: $24,000-$36,000

**Validation Checklist:**
- [ ] Major decking replacement included
- [ ] Specialized craftsmen rates used
- [ ] Labor hours are 100+ (very slow work)
- [ ] Total reflects historical restoration complexity

---

### Test Case 12: LABOR SHORTAGE / RUSH JOB
**Changes from TC-1:**
- `workerCount`: "10+ Workers"

**Expected Results:**
- Materials: $6,000 (same)
- Labor: $6,500+ (10 workers × hours × rate)
- Supervision: $500-$1,000
- Extra Equipment: $800 (10 harnesses, tools)
- Total: $14,800+

**Validation Checklist:**
- [ ] Labor cost = rate × hours × 10 workers
- [ ] Supervision cost included
- [ ] Extra equipment for large crew
- [ ] Total reflects large crew costs

---

### Test Case 13: OVER-SPECIFIED MATERIALS
**Changes from TC-1:**
- `materials.layers`: ["Metal Roofing"]
- `materials.feltType`: "15 lb" (not recommended for metal)

**Expected Results:**
- Metal Material: $12,000-$18,000 (premium, 50+ year life)
- Underlayment: $600-$900 (note: 15lb not recommended)
- Labor: $8,000-$12,000 (specialized metal crew)
- Total: $23,100-$34,900

**Validation Checklist:**
- [ ] Metal roofing premium pricing used
- [ ] Specialized labor rates applied
- [ ] Total reflects metal roof premium

---

### Test Case 14: GEOGRAPHIC ACCESSIBILITY (NYC)
**Changes from TC-1:**
- `location.city`: "New York City"
- `location.zip`: "10001"
- `lineItems`: ["Debris Removal", "Crane Rental"]

**Expected Results:**
- Materials: $3,500-$4,500 (NYC markup)
- Labor: $7,000-$10,000 (2x NYC rates)
- Crane Rental: $2,500-$4,000 (mandatory)
- Debris Removal: $1,800-$2,500 (Manhattan fees)
- NYC Permits: $1,000-$1,500
- Total: $15,800-$22,500

**Validation Checklist:**
- [ ] Labor rate is 2x (NYC multiplier)
- [ ] Materials have NYC markup
- [ ] Crane rental is included
- [ ] NYC permit fees are high
- [ ] Total reflects NYC costs

---

### Test Case 15: MULTI-LEVEL STRUCTURE
**Changes from TC-1:**
- `structureType`: "Multi-Family / 3-Story"
- `roofPitch`: "Standard (4-7/12)"

**Expected Results:**
- Tear-off: $2,500-$4,500 (requires chutes)
- Materials: $3,500-$5,000 (extra waste)
- Labor: $7,000-$10,500 (height hazard pay)
- Equipment: $1,500-$2,500 (crane, safety)
- Total: $14,500-$22,500

**Validation Checklist:**
- [ ] Labor increased 50-80% for height
- [ ] Equipment includes crane/safety
- [ ] Tear-off accounts for chutes
- [ ] Total reflects multi-level complexity

---

## Running Tests

### Option 1: Manual Testing via UI
1. Start the server: `npm run dev`
2. Navigate to the estimation form
3. Select "Contractor" role
4. Fill in the form with test case data
5. Submit and verify the cost breakdown

### Option 2: API Testing
Use a tool like Postman or curl to test the API endpoint:

```bash
curl -X POST http://localhost:3000/api/calculate-cost \
  -H "Content-Type: application/json" \
  -d @test-case-1.json
```

### Option 3: Automated Testing
Run the test script:
```bash
npm run test-cost-calculator
```

## Common Issues to Check

1. **Labor Hours Too Low**: Should be 40-60 for full replace, not 10
2. **Labor Cost Too Low**: Should be 40-50% of total, not 9%
3. **Missing Debris Removal**: Should be in equipment if in lineItems
4. **Wrong Material Pricing**: Slate/Metal should be premium prices
5. **Missing Line Items**: All selected line items should be accounted for
6. **No Geographic Multipliers**: NYC should be 2x labor
7. **Commercial Underpriced**: Should be $18k+, not $7k
8. **No Input Validation**: Invalid inputs should return errors

## Success Criteria

All test cases should:
- ✅ Generate realistic labor hours (40-60 for full replace)
- ✅ Have labor costs that are 40-50% of total
- ✅ Include all selected line items
- ✅ Apply correct geographic multipliers
- ✅ Handle material types correctly
- ✅ Account for roof age, pitch, and complexity
- ✅ Validate invalid inputs properly

