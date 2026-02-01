# Running Tests - Quick Start Guide

## Prerequisites

1. **Environment Setup**
   - Ensure you have a `.env` file with `GEMINI_KEY` set
   - Install dependencies: `npm install`

2. **Start the Server**
   ```bash
   npm run dev
   ```
   The server should start on `http://localhost:3000`

## Running Tests

### Option 1: Prompt Validation (No API Key Required)
This validates that the prompt includes all necessary rules:
```bash
npm run test:cost-calculator
```

### Option 2: API Tests (Requires Server Running + GEMINI_KEY)
This runs actual API tests against the cost calculator:
```bash
# In one terminal, start the server:
npm run dev

# In another terminal, run tests:
npm run test:api
```

## Manual Testing via UI

1. Start the server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Navigate to the estimation form
4. Select "Contractor" role
5. Fill in test case data (see `TEST_CASES_GUIDE.md`)
6. Submit and verify the cost breakdown

## Test Case Examples

### Test Case 1: BASELINE
**Expected Results:**
- Labor Hours: 40-60 (NOT 10!)
- Labor Cost: $3,500-$5,000 (40-50% of total)
- Debris Removal: Included in equipment
- Total: $7,600-$11,200

**Form Input:**
- Location: Houston, Texas, 77001
- Project Type: Residential
- Structure: Single Family Home
- Roof Pitch: Flat (0-2/12)
- Roof Age: 10
- Materials: Asphalt Shingles, 15 lb felt
- Job Type: Full Replace
- Material Preference: Standard
- Workers: 1-2 Workers
- Line Items: Shingles/Roofing Material, Underlayment & Felt, Debris Removal

### Test Case 9: INVALID INPUT
**Expected Results:**
- Should return an error message
- No cost estimate generated

**Form Input:**
- Same as Test Case 1, but:
- Roof Age: -5
- Workers: 0 Workers

## Troubleshooting

### Server Won't Start
- Check if port 3000 is already in use
- Verify `.env` file exists with `GEMINI_KEY`
- Check console for error messages

### API Tests Fail
- Ensure server is running: `npm run dev`
- Verify `GEMINI_KEY` is set in `.env`
- Check server logs for API errors
- Wait a few seconds after starting server before running tests

### Tests Timeout
- Gemini API may be rate-limited
- Add delays between test cases
- Check your Gemini API quota

## Expected Test Results

All tests should validate:
- ✅ Labor hours are realistic (40-60 for full replace)
- ✅ Labor cost is 40-50% of total
- ✅ Debris removal is included when specified
- ✅ Material types are priced correctly
- ✅ Geographic multipliers are applied
- ✅ Invalid inputs return errors
- ✅ All line items are accounted for

## Next Steps

After running tests:
1. Review test output for any failures
2. Check server logs for detailed information
3. Compare actual results with expected ranges in `TEST_CASES_GUIDE.md`
4. If results don't match, review the prompt in `server/cost-calculator.ts`

