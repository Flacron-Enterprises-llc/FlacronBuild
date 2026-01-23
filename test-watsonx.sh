#!/bin/bash

# Quick test for IBM Watsonx AI - check if project_id is required
# Replace these with your actual values
API_KEY="your_api_key_here"
PROJECT_ID="your_project_id_here"  # Try with and without this
WATSONX_URL="https://us-south.ml.cloud.ibm.com"

echo "Step 1: Getting IAM token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://iam.cloud.ibm.com/identity/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${API_KEY}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  echo $TOKEN_RESPONSE
  exit 1
fi

echo "✅ Got token"

echo -e "\nStep 2: Testing WITHOUT project_id..."
RESPONSE_NO_PROJECT=$(curl -s -X POST "${WATSONX_URL}/ml/v1/text/generation?version=2024-11-19" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "input": "Hello, how are you?",
    "model_id": "ibm/granite-13b-instruct-v2",
    "parameters": {
      "max_new_tokens": 50,
      "temperature": 0.7
    }
  }')

echo "Response:"
echo $RESPONSE_NO_PROJECT | jq '.' 2>/dev/null || echo $RESPONSE_NO_PROJECT

echo -e "\n---\n"

echo "Step 3: Testing WITH project_id..."
RESPONSE_WITH_PROJECT=$(curl -s -X POST "${WATSONX_URL}/ml/v1/text/generation?version=2024-11-19" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
    \"input\": \"Hello, how are you?\",
    \"model_id\": \"ibm/granite-13b-instruct-v2\",
    \"project_id\": \"${PROJECT_ID}\",
    \"parameters\": {
      \"max_new_tokens\": 50,
      \"temperature\": 0.7
    }
  }")

echo "Response:"
echo $RESPONSE_WITH_PROJECT | jq '.' 2>/dev/null || echo $RESPONSE_WITH_PROJECT
