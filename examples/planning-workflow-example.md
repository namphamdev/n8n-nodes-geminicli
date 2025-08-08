# Planning Mode Workflow Example

This example demonstrates the complete planning workflow using the new planning mode features.

## Workflow Steps

### Step 1: Generate a Plan

First, create a plan for a development task:

```json
{
  "operation": "generate_plan",
  "prompt": "Create a REST API for managing user accounts with authentication, CRUD operations, and proper error handling",
  "model": "gemini-2.5-pro",
  "projectPath": "/path/to/your/project",
  "outputFormat": "plan",
  "additionalOptions": {
    "systemPrompt": "Focus on security best practices, proper database design, and comprehensive testing"
  }
}
```

This will generate a detailed execution plan with specific steps like:
- Set up project structure
- Design database schema
- Implement authentication middleware
- Create user CRUD endpoints
- Add validation and error handling
- Write unit and integration tests

### Step 2: List Available Plans

To see all plans in your project:

```json
{
  "operation": "list_plans",
  "outputFormat": "structured",
  "projectPath": "/path/to/your/project"
}
```

### Step 3: Edit the Plan

Modify the generated plan based on your specific needs:

```json
{
  "operation": "edit_plan",
  "planId": "plan_2024-01-08_14-30-15_abc123",
  "editInstructions": "Add rate limiting middleware after authentication and include API documentation generation using Swagger",
  "model": "gemini-2.5-pro",
  "projectPath": "/path/to/your/project",
  "outputFormat": "plan"
}
```

### Step 4: Review and Approve the Plan

Once you're satisfied with the plan, approve it for execution:

```json
{
  "operation": "approve_plan",
  "planId": "plan_2024-01-08_14-30-15_abc123",
  "projectPath": "/path/to/your/project",
  "outputFormat": "plan"
}
```

### Step 5: Execute the Plan

Finally, execute the approved plan:

```json
{
  "operation": "execute_plan",
  "planId": "plan_2024-01-08_14-30-15_abc123",
  "model": "gemini-2.5-pro",
  "projectPath": "/path/to/your/project",
  "outputFormat": "plan_status",
  "toolsConfig": {
    "enabledTools": ["filesystem", "shell"],
    "securityMode": "safe"
  },
  "additionalOptions": {
    "debug": true
  }
}
```

## Complete n8n Workflow

Here's how you might structure this as an n8n workflow:

1. **Manual Trigger** → Start the workflow
2. **Gemini CLI (Generate Plan)** → Create the initial plan
3. **Code** → Process plan and potentially make modifications
4. **Gemini CLI (Edit Plan)** → Make any needed adjustments
5. **Gemini CLI (Approve Plan)** → Mark the plan as ready
6. **Gemini CLI (Execute Plan)** → Run the approved plan
7. **Email/Slack** → Notify when complete

## Benefits of Planning Mode

- **Review Before Action**: See exactly what the AI intends to do
- **Iterative Refinement**: Edit and improve plans before execution
- **Team Collaboration**: Share and discuss plans before implementation
- **Risk Reduction**: Avoid unexpected changes by reviewing plans first
- **Progress Tracking**: Monitor execution step-by-step
- **Audit Trail**: Full history of plan creation, edits, and execution

## Output Examples

### Generate Plan Output:
```json
{
  "plan": {
    "id": "plan_2024-01-08_14-30-15_abc123",
    "title": "REST API for User Account Management",
    "description": "Comprehensive REST API with authentication, CRUD operations, and error handling",
    "steps": [
      {
        "id": "step_1",
        "description": "Set up project structure with proper directory organization",
        "estimated_duration": 600,
        "status": "pending"
      },
      {
        "id": "step_2", 
        "description": "Design and implement database schema for user accounts",
        "files": ["database/schema.sql", "models/User.js"],
        "estimated_duration": 1200,
        "status": "pending"
      }
    ],
    "status": "draft",
    "created_at": 1704721815000,
    "original_prompt": "Create a REST API for managing user accounts..."
  },
  "operation": "generate_plan",
  "success": true
}
```

### Execution Status Output:
```json
{
  "plan": {
    "id": "plan_2024-01-08_14-30-15_abc123",
    "status": "executing",
    "steps": [
      {
        "id": "step_1",
        "status": "completed"
      },
      {
        "id": "step_2",
        "status": "in_progress"
      }
    ]
  },
  "summary": {
    "totalSteps": 5,
    "completedSteps": 1,
    "failedSteps": 0,
    "finalStatus": "executing"
  },
  "operation": "execute_plan",
  "success": true
}
```