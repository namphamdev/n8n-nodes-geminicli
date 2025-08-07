# 🚀 Gemini CLI for n8n

![Gemini CLI Logo](./Gemini%20CLI.png)

**Bring the power of Google's Gemini CLI directly into your n8n automation workflows!**

Imagine having Google's most advanced AI model analyzing your codebase, writing new features, fixing bugs, generating documentation, and automating your entire development workflow - all within n8n. That's exactly what this node enables.

[![n8n](https://img.shields.io/badge/n8n-community_node-orange.svg)](https://n8n.io/)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Powered-blue.svg)](https://github.com/google-gemini/gemini-cli)
[![npm](https://img.shields.io/npm/v/@sirmrmarty/n8n-nodes-gemini-cli.svg)](https://www.npmjs.com/package/@sirmrmarty/n8n-nodes-gemini-cli)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.md)

## 🌟 What Can You Build?

### 🔧 **Automated Code Reviews**
Create workflows that automatically review pull requests, suggest improvements, and even fix issues before merging using Gemini's advanced code understanding.

### 🐛 **Intelligent Bug Fixing** 
Connect error monitoring tools to Gemini CLI - automatically diagnose and fix production issues in real-time with AI-powered debugging.

### 📊 **Advanced Code Analysis**
Let Gemini analyze complex codebases, suggest optimizations, and identify potential security vulnerabilities with its massive context window.

### 🤖 **Self-Improving Workflows**
Build n8n workflows that can modify and improve themselves using Gemini's multimodal capabilities and project understanding.

### 📝 **Documentation Generation**
Automatically generate and update comprehensive documentation for your codebase, APIs, and processes using Gemini's natural language skills.

### 🔄 **Code Migration & Refactoring**
Automate the migration of legacy codebases to modern frameworks with intelligent refactoring powered by Gemini 2.5 Pro.

### 🎫 **Customer Support Automation**
Transform support tickets into code fixes automatically:
- Analyze customer bug reports with context awareness
- Generate fixes for reported problems
- Create comprehensive test cases
- Update documentation based on common questions
- Auto-respond with intelligent workarounds

## ⚡ Quick Start

### Prerequisites
1. **Node.js 20+**: Ensure you have Node.js 20 or higher installed
2. **Gemini CLI** (required on your n8n server):
   ```bash
   npm install -g @google/gemini-cli
   ```
3. **API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Install in n8n

#### Option 1: Via n8n UI (Recommended)
1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter: `@sirmrmarty/n8n-nodes-gemini-cli`
5. Click **Install**
6. Restart n8n when prompted

#### Option 2: Manual Installation
```bash
cd ~/.n8n/nodes
npm install @sirmrmarty/n8n-nodes-gemini-cli
# Restart n8n
```

#### Option 3: Docker
```bash
docker run -it --rm \
  -p 5678:5678 \
  -e N8N_COMMUNITY_NODE_PACKAGES=@sirmrmarty/n8n-nodes-gemini-cli \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Note**: For Docker, you'll need to ensure Gemini CLI is installed inside the container. Consider creating a custom Dockerfile.

📦 **NPM Package**: [@sirmrmarty/n8n-nodes-gemini-cli](https://www.npmjs.com/package/@sirmrmarty/n8n-nodes-gemini-cli)

## 🎯 Real-World Use Cases

### 1. **GitHub Issue to Implementation**
```
Webhook (GitHub Issue) → Gemini CLI → Analyze & Code → Create PR → Notify Team
```
Automatically implement features or fix bugs when issues are created.

### 2. **Natural Language Code Generator**
```
Form Trigger → Gemini CLI → Generate Code → Test → Deploy → Notify
```
Turn business requirements into production-ready code automatically.

### 3. **Code Quality Guardian**
```
Git Push → Gemini CLI → Analyze Quality → Block/Approve → Generate Report
```
Enforce coding standards and catch issues before they reach production.

### 4. **Intelligent Documentation**
```
Code Changes → Gemini CLI → Generate Docs → Update Wiki → Notify Stakeholders
```
Keep documentation always up-to-date with automatic generation.

### 5. **Advanced Log Analysis**
```
Error Logs → Gemini CLI → Root Cause Analysis → Create Fix → Test → Deploy
```
Turn error logs into actionable fixes with context-aware debugging.

### 6. **Customer Support to Code Fix**
```
Support Ticket → Gemini CLI → Reproduce Issue → Generate Fix → Test → Deploy → Auto-Reply
```
Transform customer complaints into deployed fixes in minutes with Gemini's problem-solving capabilities.

## 🛠️ Powerful Features

### **Interactive AI Assistance**
Query Gemini CLI with natural language prompts and get intelligent, context-aware responses for any development task.

### **Multimodal Capabilities**
Leverage Gemini's understanding of:
- 💻 Code in multiple languages
- 📄 Documentation and text
- 🖼️ Images and diagrams
- 📊 Data structures and schemas

### **Large Context Window**
Support for Gemini 2.5 Pro's massive 1M token context window - understand entire codebases at once.

### **Project Context Awareness**
Set a working directory and Gemini CLI understands your entire project structure:
- Analyzes existing code patterns
- Follows your coding standards
- Understands your architecture
- Respects your dependencies

### **Flexible Output Formats**
Choose between:
- **Structured JSON**: Full details with metrics and metadata
- **Raw Messages**: Complete conversation history
- **Plain Text**: Simple responses for easy chaining

### **Authentication Options**
Support for both:
- 🤖 **Gemini API**: Direct Google AI access
- ☁️ **Vertex AI**: Enterprise Google Cloud integration

## 📋 Configuration Examples

### Simple Code Analysis
```javascript
{
  "operation": "query",
  "prompt": "Analyze this codebase and suggest performance improvements",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro",
  "outputFormat": "structured"
}
```

### Advanced Bug Fixing
```javascript
{
  "operation": "query", 
  "prompt": "Fix the authentication issue in the login module and add comprehensive error handling",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro",
  "maxTurns": 15,
  "timeout": 600,
  "additionalOptions": {
    "systemPrompt": "Focus on security best practices and user experience"
  }
}
```

### Customer Support Automation
```javascript
{
  "operation": "query",
  "prompt": "Customer reports: 'The app crashes when uploading large files'\n\nAnalyze this issue, find the root cause, and implement a fix",
  "projectPath": "/path/to/mobile-app",
  "model": "gemini-2.5-pro",
  "additionalOptions": {
    "systemPrompt": "Focus on file handling, memory management, and user feedback during uploads."
  }
}
```

### Continuing Conversations
```javascript
{
  "operation": "continue",
  "prompt": "Now add unit tests for the fix you just implemented",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro"
}
```

## 🔄 Workflow Patterns

### Pattern 1: Continuous Code Improvement
```
Schedule Trigger (Daily)
  ↓
Gemini CLI (Analyze codebase for improvements)
  ↓  
Create GitHub Issues
  ↓
Assign to Team
```

### Pattern 2: Natural Language to Production
```
Slack Command
  ↓
Gemini CLI (Generate code from description)
  ↓
Run Tests
  ↓
Create Pull Request  
  ↓
Auto-merge if tests pass
```

### Pattern 3: Intelligent Monitoring & Fixing
```
Error Webhook
  ↓
Gemini CLI (Analyze & diagnose issue)
  ↓
If (Can fix automatically)
  ├─ Yes: Implement Fix → Test → Deploy
  └─ No: Create Detailed Issue → Notify Team
```

## 🚦 Getting Started

### 1. **Verify Prerequisites**
Make sure Gemini CLI is installed and configured on your n8n server:
```bash
gemini --version  # Should show the version
```

### 2. **Set Up Authentication (Recommended: Use n8n Interface)**

**Recommended Method**: Provide the API key directly in the n8n interface when configuring the Gemini CLI node. This is the most secure approach as it:
- Keeps your API key secure within your n8n workflow
- Allows different workflows to use different API keys
- Provides better security by not storing keys in environment variables
- Makes key management easier through the n8n interface

Simply enter your Gemini API key in the node's configuration panel when setting up your workflow.

**Alternative Method**: Set environment variables (less secure):
```bash
# For Gemini API
export GEMINI_API_KEY="your-api-key-here"

# For Vertex AI (optional)  
export GOOGLE_API_KEY="your-vertex-ai-key"
export GOOGLE_GENAI_USE_VERTEXAI=true
```

### 3. **Create Your First Workflow**
1. In n8n, create a new workflow
2. Add a **Manual Trigger** node (for testing)
3. Add the **Gemini CLI** node
4. Configure:
   - **Operation**: Query
   - **Prompt**: "Analyze the code in this directory and suggest improvements"
   - **Project Path**: `/path/to/your/project`
   - **Model**: Gemini 2.5 Pro (most powerful) or 2.5 Flash (faster)
5. Click **Execute Workflow**
6. Watch Gemini CLI analyze your project with AI precision!

### 4. **Explore Advanced Features**
- Experiment with different models for speed vs. capability trade-offs
- Use the Continue operation for complex multi-step workflows
- Set custom system prompts for domain-specific expertise
- Try different output formats based on your integration needs

## 💡 Pro Tips

### 🎯 **Use Project Paths for Context**
Always set a project path for better understanding and results:
```
/home/user/projects/my-app
```

### 🔗 **Chain Operations Effectively**
Use "Continue" operation to build complex multi-step workflows while maintaining conversation context.

### 📊 **Choose the Right Output Format**
- **Structured**: Best for automation and chaining
- **Messages**: Great for debugging and conversation history
- **Text**: Simple and clean for notifications

### 🚀 **Model Selection Strategy**
- **Gemini 2.5 Pro**: Complex analysis, architectural decisions, security reviews
- **Gemini 2.5 Flash**: Quick fixes, simple tasks, iterative development

### ⏱️ **Optimize Performance**
- Use appropriate timeouts for complex tasks
- Limit max turns for focused conversations
- Set specific system prompts to guide AI behavior

## 🤝 Community & Support

- 📖 [Documentation](https://github.com/sirmrmarty/n8n-nodes-geminicli)
- 🐛 [Report Issues](https://github.com/sirmrmarty/n8n-nodes-geminicli/issues)
- 💬 [Discussions](https://github.com/sirmrmarty/n8n-nodes-geminicli/discussions)
- 🌟 [Star on GitHub](https://github.com/sirmrmarty/n8n-nodes-geminicli)
- 🔗 [Gemini CLI Documentation](https://github.com/google-gemini/gemini-cli)

## 📈 What's Next?

We're constantly improving! Upcoming features:
- Enhanced multimodal capabilities (image analysis workflows)
- Pre-built workflow templates for common use cases
- Advanced debugging and monitoring tools
- Integration with more Google Cloud services

## 📄 License

MIT - Build amazing things with Google's most advanced AI!

---

**Ready to revolutionize your development workflow with Google's Gemini AI?** Install Gemini CLI for n8n today and experience the future of AI-powered automation!

Built and maintained by [sirmrmarty](https://github.com/sirmrmarty)