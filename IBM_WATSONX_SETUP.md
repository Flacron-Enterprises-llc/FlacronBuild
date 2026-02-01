# IBM Watsonx AI Setup Guide

## How to Get Your Project ID

### Step 1: Access IBM Watsonx AI

1. Go to [IBM Cloud Console](https://cloud.ibm.com/)
2. Sign in with your IBM Cloud account
3. Navigate to **Watsonx.ai** from the catalog or search for "watsonx"

### Step 2: Create or Access a Project

#### Option A: Create a New Project
1. In the Watsonx.ai dashboard, click on **"Projects"** in the left sidebar
2. Click **"Create project"** or **"New project"** button
3. Fill in the project details:
   - **Project name**: e.g., "FlacronBuild Chatbot"
   - **Description**: (optional)
   - Select a **region** (e.g., US-South)
4. Click **"Create"**

#### Option B: Use Existing Project
1. In the Watsonx.ai dashboard, click on **"Projects"** in the left sidebar
2. Select an existing project from the list

### Step 3: Get Your Project ID

Once you're in a project:

1. Look at the **URL** in your browser - it will look like:
   ```
   https://dataplatform.cloud.ibm.com/projects/{PROJECT_ID}/...
   ```
   The `PROJECT_ID` is the long string in the URL

2. **OR** look in the project settings:
   - Click on **"Settings"** or **"Project settings"** in the project
   - The Project ID will be displayed there (usually a GUID format like: `12345678-1234-1234-1234-123456789abc`)

3. **OR** check the project overview page:
   - The Project ID is often shown in the project details/overview section

### Step 4: Get Your IBM Cloud API Key

1. Go to [IBM Cloud Console](https://cloud.ibm.com/)
2. Click on your **profile icon** (top right)
3. Select **"Manage"** → **"Access (IAM)"**
4. Click **"API keys"** in the left sidebar
5. Click **"Create an IBM Cloud API key"**
6. Give it a name (e.g., "Watsonx FlacronBuild")
7. Click **"Create"**
8. **Copy the API key immediately** - you won't be able to see it again!

### Step 5: Configure Your Environment Variables

Add these to your `.env` file:

```env
# IBM Watsonx AI Configuration
IBM_WATSONX_AI_API_KEY=your_ibm_cloud_api_key_here
IBM_WATSONX_AI_URL=https://us-south.ml.cloud.ibm.com
IBM_WATSONX_AI_PROJECT_ID=your_project_id_here  # Optional - only required for standard deployments
IBM_WATSONX_AI_MODEL_ID=ibm/granite-13b-instruct-v2
```

**Note about Project ID:**
- **Required** for standard IBM Watsonx.ai cloud deployments
- **Optional** for lightweight engine deployments
- If you get an error about missing project_id, you'll need to provide it
- Most users will need to set this value

### Step 6: Verify Your Setup

1. Make sure you have:
   - ✅ IBM Cloud account
   - ✅ Watsonx.ai service provisioned
   - ✅ A project created in Watsonx.ai
   - ✅ Project ID copied
   - ✅ API key created and copied
   - ✅ Environment variables set in `.env`

2. Test the connection by running your server and trying the chatbot endpoint

## Common Issues

### "Project ID not found"
- Make sure you're using the correct Project ID from the URL or project settings
- Verify the project exists in the same region as your Watsonx service

### "Invalid API key"
- Verify the API key was copied correctly (no extra spaces)
- Make sure the API key has proper permissions for Watsonx.ai

### "Authentication failed"
- Check that your API key is valid and not expired
- Verify the IBM_WATSONX_AI_URL matches your region

## Alternative: Find Project ID via API

If you have your API key, you can also find your project ID programmatically:

```bash
# Get IAM token first
curl -X POST "https://iam.cloud.ibm.com/identity/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_API_KEY"

# Then list projects (replace YOUR_TOKEN with the access_token from above)
curl -X GET "https://us-south.ml.cloud.ibm.com/ml/v1/projects?version=2024-11-19" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Need Help?

- [IBM Watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [IBM Cloud Support](https://cloud.ibm.com/unifiedsupport/supportcenter)
