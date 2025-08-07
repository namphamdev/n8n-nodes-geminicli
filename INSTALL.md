# Installation and Setup Guide

## Quick Start

### Prerequisites
1. **Node.js 20+** - Ensure you have Node.js 20 or higher installed
2. **Gemini CLI** - Install Google's Gemini CLI:
   ```bash
   npm install -g @google/gemini-cli
   ```
3. **API Key** - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation Steps

1. **Install the n8n node package:**
   ```bash
   cd /path/to/your/n8n/installation
   npm install @yournamespace/n8n-nodes-gemini-cli
   ```

2. **Set up environment variables:**
   ```bash
   # For Gemini API (recommended)
   export GEMINI_API_KEY="your-api-key-here"
   
   # OR for Vertex AI
   export GOOGLE_API_KEY="your-vertex-ai-key"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

3. **Restart n8n:**
   ```bash
   n8n start
   ```

4. **Find the node:** Look for "Gemini CLI" in the n8n node palette under the "Transform" category

## Development Setup

If you want to develop or modify this node:

1. **Clone and build:**
   ```bash
   cd n8n-nodes-gemini-cli
   npm install
   npm run build
   ```

2. **Link for local development:**
   ```bash
   npm link
   cd /path/to/your/n8n
   npm link @yournamespace/n8n-nodes-gemini-cli
   ```

3. **Start n8n in development mode:**
   ```bash
   n8n start
   ```

## First Test

Create a simple workflow to test the node:

1. Add an "Execute Workflow Trigger" node
2. Add the "Gemini CLI" node
3. Configure:
   - **Operation:** Query
   - **Prompt:** "Generate a simple 'Hello World' Python function"
   - **Model:** Gemini 2.5 Pro
   - **Output Format:** Structured

4. Run the workflow and check the output

## Troubleshooting

### Common Issues

1. **"Gemini CLI not available"**
   ```bash
   # Verify installation
   gemini --version
   
   # If not found, reinstall
   npm install -g @google/gemini-cli
   ```

2. **Authentication errors**
   ```bash
   # Check environment variables
   echo $GEMINI_API_KEY
   
   # Test Gemini CLI directly
   gemini "Hello, how are you?"
   ```

3. **Node not appearing in n8n**
   - Restart n8n completely
   - Check if the package is installed in the correct n8n directory
   - Verify package.json lists the node correctly

### Debug Mode

Enable debug mode in the node configuration to see detailed logs:
- Set "Additional Options" → "Debug Mode" to `true`
- Check n8n logs for `[GeminiCli]` prefixed messages

## Next Steps

Once everything is working:

1. Try different prompts and models
2. Experiment with project path settings for codebase analysis
3. Use structured output for workflow automation
4. Combine with other n8n nodes for complex workflows

For more examples and advanced usage, see the `examples/` directory.