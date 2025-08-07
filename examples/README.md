# Gemini CLI Node Examples

This directory contains example configurations and workflows for the Gemini CLI n8n node.

## Basic Usage Examples

### 1. Simple Code Generation

Generate code with a basic prompt:

```json
{
  "operation": "query",
  "prompt": "Create a JavaScript function that calculates the factorial of a number",
  "model": "gemini-2.5-pro",
  "outputFormat": "structured"
}
```

### 2. Code Review and Analysis

Analyze existing code for improvements:

```json
{
  "operation": "query", 
  "prompt": "Review this codebase for security vulnerabilities and performance issues",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro",
  "maxTurns": 10,
  "additionalOptions": {
    "systemPrompt": "You are a senior security engineer and performance specialist. Focus on identifying critical security flaws and performance bottlenecks."
  }
}
```

### 3. Bug Fixing Workflow

Fix issues with context from project files:

```json
{
  "operation": "query",
  "prompt": "The user authentication is failing. Please investigate and fix the issue.",
  "projectPath": "/path/to/your/web-app", 
  "model": "gemini-2.5-pro",
  "maxTurns": 15,
  "timeout": 600,
  "outputFormat": "structured"
}
```

### 4. Documentation Generation

Generate documentation from code:

```json
{
  "operation": "query",
  "prompt": "Generate comprehensive API documentation for all endpoints in this project",
  "projectPath": "/path/to/your/api",
  "model": "gemini-2.5-pro",
  "additionalOptions": {
    "systemPrompt": "Generate clear, comprehensive documentation with examples for each API endpoint. Include request/response schemas and error codes."
  }
}
```

### 5. Test Generation

Create unit tests for your code:

```json
{
  "operation": "query",
  "prompt": "Generate comprehensive unit tests for the user service module using Jest",
  "projectPath": "/path/to/your/project",
  "model": "gemini-2.5-pro",
  "maxTurns": 8
}
```

## Advanced Workflows

### Multi-Step Code Refactoring

1. **Analysis Step**: First query to analyze code
```json
{
  "operation": "query",
  "prompt": "Analyze the current code structure and identify areas that need refactoring",
  "projectPath": "/path/to/project",
  "outputFormat": "structured"
}
```

2. **Implementation Step**: Continue with refactoring
```json
{
  "operation": "continue", 
  "prompt": "Now implement the refactoring suggestions you identified",
  "projectPath": "/path/to/project",
  "maxTurns": 20,
  "timeout": 900
}
```

### Project Migration

Help migrate between technologies:

```json
{
  "operation": "query",
  "prompt": "Help me migrate this Express.js API to Fastify, maintaining all functionality",
  "projectPath": "/path/to/express-api",
  "model": "gemini-2.5-pro", 
  "maxTurns": 25,
  "timeout": 1200,
  "additionalOptions": {
    "systemPrompt": "You are helping migrate from Express.js to Fastify. Maintain all existing functionality, improve performance where possible, and ensure proper error handling."
  }
}
```

## Integration Patterns

### With GitHub Actions

Use in a workflow to analyze pull requests:

```json
{
  "operation": "query",
  "prompt": "Review the changes in this pull request and provide feedback on code quality, potential bugs, and adherence to best practices",
  "projectPath": "${GITHUB_WORKSPACE}",
  "model": "gemini-2.5-pro",
  "additionalOptions": {
    "systemPrompt": "You are reviewing a pull request. Focus on code quality, security, performance, and maintainability. Provide constructive feedback."
  }
}
```

### With Error Monitoring

Analyze error logs and suggest fixes:

```json
{
  "operation": "query", 
  "prompt": "Analyze these error logs and suggest fixes: {{$json.errorLogs}}",
  "projectPath": "/path/to/project",
  "model": "gemini-2.5-pro",
  "additionalOptions": {
    "systemPrompt": "You are debugging production errors. Analyze the error logs, identify root causes, and provide specific fix recommendations."
  }
}
```

## Configuration Tips

### For Large Projects

- Increase `maxTurns` to 20-30 for complex tasks
- Set `timeout` to 900-1800 seconds for thorough analysis
- Use `gemini-2.5-pro` for best context understanding

### For Quick Tasks

- Use default `maxTurns` (10)
- Keep `timeout` at 300 seconds
- Consider `gemini-2.5-flash` for faster responses

### For Security Reviews

- Always set appropriate `systemPrompt` with security focus
- Use `projectPath` to give full codebase context
- Increase `maxTurns` for thorough analysis

## Best Practices

1. **Use Specific Prompts**: Be clear about what you want Gemini to do
2. **Set Context**: Use `systemPrompt` to establish the role and focus
3. **Project Path**: Always set when working with codebases
4. **Structured Output**: Use structured format for easier data processing
5. **Debug Mode**: Enable when troubleshooting
6. **Appropriate Timeouts**: Set based on task complexity

## Common Patterns

### Code Generation Pattern
```json
{
  "prompt": "Generate [specific functionality] that [requirements]",
  "additionalOptions": {
    "systemPrompt": "Generate clean, well-documented code following [specific standards/framework]"
  }
}
```

### Analysis Pattern
```json
{
  "prompt": "Analyze [specific aspect] and provide [type of feedback]",
  "additionalOptions": {
    "systemPrompt": "You are a [role] focusing on [specific areas]"
  }
}
```

### Fix Pattern
```json
{
  "prompt": "Fix [specific issue] in [component/module]",
  "maxTurns": 15,
  "timeout": 600
}
```