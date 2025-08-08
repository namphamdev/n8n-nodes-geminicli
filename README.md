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
Create workflows that automatically review pull requests, suggest improvements, and even fix issues before merging using Gemini's advanced code understanding with file system tools.

### 🐛 **Intelligent Bug Fixing** 
Connect error monitoring tools to Gemini CLI - automatically diagnose and fix production issues in real-time with AI-powered debugging, shell command execution, and web research capabilities.

### 📊 **Advanced Code Analysis**
Let Gemini analyze complex codebases, suggest optimizations, and identify potential security vulnerabilities with its massive context window and file system access.

### 🤖 **Self-Improving Workflows**
Build n8n workflows that can modify and improve themselves using Gemini's multimodal capabilities, file system tools, and MCP server integrations.

### 📝 **Documentation Generation**
Automatically generate and update comprehensive documentation for your codebase, APIs, and processes using Gemini's natural language skills combined with file system and web search tools.

### 🔄 **Code Migration & Refactoring**
Automate the migration of legacy codebases to modern frameworks with intelligent refactoring powered by Gemini 2.5 Pro and shell command execution.

### 🎫 **Customer Support Automation**
Transform support tickets into code fixes automatically:
- Analyze customer bug reports with context awareness and web research
- Generate fixes for reported problems using file system tools
- Execute tests and validations with shell commands
- Create comprehensive test cases
- Update documentation based on common questions
- Auto-respond with intelligent workarounds

### 🌐 **External System Integration**
Connect to databases, APIs, and services using MCP servers:
- GitHub/GitLab repository management
- Database query and manipulation
- Cloud service integrations
- Custom API interactions
- Workflow orchestration with external tools

## 🧠 Planning Mode (NEW!)

**Revolutionary AI Planning Workflow**: Instead of immediate execution, you can now generate, edit, and approve detailed execution plans before running them. This provides unprecedented control and collaboration capabilities.

### Planning Workflow:
1. **Generate Plan**: AI creates detailed step-by-step execution plan
2. **Review & Edit**: Modify the plan using natural language instructions  
3. **Approve**: Mark the plan as ready for execution
4. **Execute**: Run the approved plan with progress tracking

### Example Planning Operations:
```javascript
// Generate a plan
{
  "operation": "generate_plan",
  "prompt": "Create a secure user authentication system with JWT tokens",
  "outputFormat": "plan"
}

// Edit the plan
{
  "operation": "edit_plan", 
  "planId": "plan_2024-01-08_abc123",
  "editInstructions": "Add rate limiting and password encryption"
}

// Execute approved plan
{
  "operation": "execute_plan",
  "planId": "plan_2024-01-08_abc123",
  "outputFormat": "plan_status"
}
```

**Benefits**:
- ✅ Review before execution - see exactly what AI will do
- ✅ Team collaboration - share and discuss plans
- ✅ Iterative refinement - edit plans until perfect
- ✅ Risk reduction - avoid unexpected changes
- ✅ Progress tracking - monitor execution step-by-step

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

### **Built-in Tools**
Enable powerful capabilities:
- 📁 **File System**: Read/write project files with intelligent context
- 💻 **Shell Commands**: Execute system commands with safety controls
- 🌐 **Web Fetch**: Retrieve and analyze web content
- 🔍 **Web Search**: Search for current information and solutions

### **MCP Server Integration**
Connect to external systems via Model Context Protocol:
- 🔗 **Database Access**: Query and manipulate databases
- 📋 **API Integrations**: Connect to REST/GraphQL services
- 🎛️ **Custom Tools**: Build domain-specific capabilities
- 🔐 **Secure Connections**: Fine-grained permission controls

### **Advanced Security**
Multiple security modes for different use cases:
- 🛡️ **Safe Mode**: Confirmation required for destructive operations
- ⚡ **YOLO Mode**: Auto-approve for trusted environments
- 📦 **Sandbox Mode**: Restricted environment execution

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
- **Structured JSON**: Full details with metrics, configuration, and metadata
- **Raw Messages**: Complete conversation history and tool interactions
- **Plain Text**: Simple responses for easy chaining

### **Authentication Options**
Support for both:
- 🤖 **Gemini API**: Direct Google AI access with secure key management
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

### Advanced Bug Fixing with Tools
```javascript
{
  "operation": "query", 
  "prompt": "Fix the authentication issue in the login module and add comprehensive error handling",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro",
  "maxTurns": 15,
  "timeout": 600,
  "toolsConfig": {
    "enabledTools": ["filesystem", "shell", "web_search"],
    "securityMode": "safe"
  },
  "additionalOptions": {
    "systemPrompt": "Focus on security best practices and user experience"
  }
}
```

### Customer Support with MCP Integration
```javascript
{
  "operation": "query",
  "prompt": "Customer reports: 'The app crashes when uploading large files'\n\nAnalyze this issue, find the root cause, and implement a fix",
  "projectPath": "/path/to/mobile-app",
  "model": "gemini-2.5-pro",
  "toolsConfig": {
    "enabledTools": ["filesystem", "shell"],
    "securityMode": "safe"
  },
  "mcpServers": {
    "servers": [{
      "name": "github-server",
      "connectionType": "command",
      "command": "npx @modelcontextprotocol/server-github",
      "env": "GITHUB_PERSONAL_ACCESS_TOKEN=your_token",
      "includeTools": "read_file,create_issue"
    }]
  }
}
```

### YOLO Mode for Trusted Operations
```javascript
{
  "operation": "query",
  "prompt": "Refactor the entire user authentication system and update all related tests",
  "projectPath": "/path/to/trusted/project",
  "model": "gemini-2.5-pro",
  "toolsConfig": {
    "enabledTools": ["filesystem", "shell"],
    "securityMode": "yolo",
    "checkpointing": true
  }
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

Simply enter your Gemini API key in the node's **Additional Options** → **API Key** field when setting up your workflow.

**Alternative Method**: Set environment variables (less secure):
```bash
# For Gemini API
export GEMINI_API_KEY="your-api-key-here"

# For Vertex AI (optional)  
export GOOGLE_API_KEY="your-vertex-ai-key"
export GOOGLE_GENAI_USE_VERTEXAI=true
```

### 3. **Create Your First Workflow**

**Traditional Execution:**
1. In n8n, create a new workflow
2. Add a **Manual Trigger** node (for testing)
3. Add the **Gemini CLI** node
4. Configure:
   - **Operation**: Query
   - **Prompt**: "Analyze the code in this directory and suggest improvements"
   - **Project Path**: `/path/to/your/project`
   - **Model**: Gemini 2.5 Pro (most powerful) or 2.5 Flash (faster)
   - **Additional Options** → **API Key**: Your Gemini API key
5. Optionally enable tools and configure MCP servers (see Advanced Configuration below)
6. Click **Execute Workflow**
7. Watch Gemini CLI analyze your project with AI precision!

**Planning Mode Workflow:**
1. Create a workflow with multiple **Gemini CLI** nodes:
   - **Node 1**: Operation = "Generate Plan", Prompt = "Create a user authentication system"
   - **Node 2**: Operation = "Edit Plan" (optional), Plan ID from previous node
   - **Node 3**: Operation = "Approve Plan", Plan ID from previous node  
   - **Node 4**: Operation = "Execute Plan", Plan ID from previous node
2. Each step gives you full control over the AI's actions
3. Review, modify, and approve before any actual execution

### 4. **Explore Advanced Features**
- **Tools & Integrations**: Enable built-in tools (file system, shell, web) and configure MCP servers
- **Security Controls**: Choose between safe mode (confirmations) and YOLO mode (auto-approve)
- **Models**: Experiment with different models for speed vs. capability trade-offs
- **Conversations**: Use the Continue operation for complex multi-step workflows
- **Customization**: Set custom system prompts for domain-specific expertise
- **Output Formats**: Try different formats based on your integration needs

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

### 🛡️ **Security Best Practices**
- Start with **Safe Mode** for production workflows
- Use **YOLO Mode** only for trusted, non-destructive operations
- Configure MCP servers with minimal required permissions
- Review tool lists carefully when connecting external servers

### 🔧 **Tools & MCP Configuration**
- Enable only the tools you need to minimize security surface
- Use **Include Tools** to whitelist specific MCP server capabilities
- Set reasonable timeouts for external MCP server connections
- Test MCP server configurations in safe environments first

## 🛠️ Advanced Configuration

### **Built-in Tools**
Configure which tools Gemini CLI can use:

#### **Tools Configuration**
- **File System**: Enable reading/writing files in project directory
- **Shell Commands**: Execute system commands (use with caution in Safe Mode)
- **Web Fetch**: Retrieve content from URLs for analysis
- **Web Search**: Search the web for current information

#### **Security Modes**
- **Safe Mode** (Recommended): Requires confirmation for destructive operations
- **YOLO Mode**: Auto-approves all operations (use with extreme caution)
- **Sandbox Mode**: Runs in restricted environment

### **MCP Server Integration**

Configure external MCP (Model Context Protocol) servers for extended functionality:

#### **Connection Types**
- **Command (stdio)**: Execute MCP server as subprocess
- **HTTP URL**: Connect to MCP server via HTTP+SSE

#### **Example GitHub Server Configuration**
```json
{
  "name": "github-server",
  "connectionType": "command",
  "command": "npx @modelcontextprotocol/server-github",
  "env": "GITHUB_PERSONAL_ACCESS_TOKEN=your_token",
  "trust": false,
  "includeTools": "read_file,list_files,create_issue"
}
```

#### **Example HTTP MCP Server**
```json
{
  "name": "api-server", 
  "connectionType": "http",
  "httpUrl": "http://localhost:3000/sse",
  "timeout": 30000,
  "excludeTools": "delete_database,format_disk"
}
```

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