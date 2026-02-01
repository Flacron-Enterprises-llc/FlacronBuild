# Automated Testing Instructions

## ✅ Migration Complete: Gemini → OpenAI

All cost calculations now use **OpenAI API** instead of Gemini.

## Setup

1. **Add OpenAI API Key to `.env` file:**
   ```env
   OPENAI_KEY=sk-your-openai-api-key-here
   ```
   OR
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

## Running Tests

### Run All 15 Test Cases Automatically

```bash
npm run test:all
```

This will:
- ✅ Test all 15 test cases automatically
- ✅ Validate labor hours, costs, percentages
- ✅ Check for debris removal inclusion
- ✅ Verify error handling for invalid inputs
- ✅ Show detailed results for each test
- ✅ Provide a summary at the end

### Test Cases Included

1. **BASELINE** - Standard residential full replacement
2. **ROOF PITCH IMPACT** - Steep slope roof
3. **MATERIAL CHANGE** - Luxury slate material
4. **MULTIPLE MATERIAL LAYERS** - Multiple layers to remove
5. **OLD ROOF** - 35 year old roof
6. **PARTIAL REPAIR** - Partial repair job
7. **COMMERCIAL STRUCTURE** - Commercial warehouse
8. **LINE ITEMS STRESS** - All line items included
9. **INVALID INPUT** - Error handling
10. **EXTREME WEATHER** - Hurricane straps
11. **HISTORICAL HOME** - 100 year old home
12. **LABOR SHORTAGE** - 10+ workers rush job
13. **OVER-SPECIFIED MATERIALS** - Metal roofing
14. **GEOGRAPHIC ACCESSIBILITY** - NYC location
15. **MULTI-LEVEL STRUCTURE** - 3-story building

## Expected Test Results

All tests should:
- ✅ Pass validation checks
- ✅ Have realistic labor hours (40-60 for full replace)
- ✅ Have labor costs that are 40-50% of total
- ✅ Include debris removal when specified
- ✅ Handle all material types correctly
- ✅ Apply geographic multipliers
- ✅ Return errors for invalid inputs

## Troubleshooting

### "OPENAI_KEY not found"
- Make sure `.env` file exists in the project root
- Check that `OPENAI_KEY` or `OPENAI_API_KEY` is set
- Restart your terminal after adding the key

### Tests Fail with API Errors
- Check your OpenAI API key is valid
- Verify you have API credits/quota
- Check your internet connection
- Review server logs for detailed error messages

### Rate Limiting
- Tests include 2-second delays between API calls
- If you hit rate limits, increase the delay in `test-all-cases.ts`
- Consider using OpenAI API with higher rate limits

## Test Output

The test suite will show:
- ✅/❌ Status for each test
- Detailed cost breakdowns
- Validation errors if any
- Final summary with pass/fail counts

## Success Criteria

All 15 tests must pass for the system to be considered working correctly.

