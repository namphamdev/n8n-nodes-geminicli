import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError, ApplicationError } from 'n8n-workflow';
import { spawn, execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

interface ProjectPathValidationResult {
	isValid: boolean;
	resolvedPath?: string;
	error?: string;
	warnings?: string[];
}

interface GeminiMessage {
	type: 'user' | 'assistant' | 'system' | 'error';
	content: string;
	timestamp: number;
}

interface GeminiResponse {
	messages: GeminiMessage[];
	result: string;
	success: boolean;
	duration_ms: number;
	error?: string;
}

interface ExecutionStep {
	id: string;
	description: string;
	command?: string;
	files?: string[];
	estimated_duration?: number;
	status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ExecutionPlan {
	id: string;
	title: string;
	description: string;
	steps: ExecutionStep[];
	created_at: number;
	modified_at: number;
	status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
	original_prompt?: string;
	configuration?: {
		model?: string;
		projectPath?: string;
		toolsConfig?: ToolsConfig;
	};
}


interface McpServer {
	name: string;
	connectionType: 'command' | 'http';
	command?: string;
	args?: string;
	httpUrl?: string;
	headers?: string;
	env?: string;
	cwd?: string;
	timeout: number;
	trust: boolean;
	includeTools?: string;
	excludeTools?: string;
}

interface ToolsConfig {
	enabledTools?: string[];
	securityMode?: 'safe' | 'yolo' | 'sandbox';
	checkpointing?: boolean;
}

interface GeminiServerConfig {
	command?: string;
	args?: string[];
	url?: string;
	headers?: Record<string, string>;
	env?: Record<string, string>;
	cwd?: string;
	timeout?: number;
	trust?: boolean;
	includeTools?: string[];
	excludeTools?: string[];
}

interface GeminiSettings {
	mcpServers?: Record<string, GeminiServerConfig>;
}

export class GeminiCli implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gemini CLI',
		name: 'geminiCli',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["prompt"]}}',
		description:
			'Use Google Gemini CLI to execute AI-powered coding tasks with multimodal capabilities',
		defaults: {
			name: 'Gemini CLI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Approve Plan',
						value: 'approve_plan',
						description: 'Mark a plan as approved and ready for execution',
						action: 'Approve a plan for execution',
					},
					{
						name: 'Continue',
						value: 'continue',
						description: 'Continue a previous conversation (requires prior query)',
						action: 'Continue a previous conversation requires prior query',
					},
					{
						name: 'Edit Plan',
						value: 'edit_plan',
						description: 'Modify an existing execution plan',
						action: 'Edit an existing execution plan',
					},
					{
						name: 'Execute Plan',
						value: 'execute_plan',
						description: 'Execute an approved plan',
						action: 'Execute an approved execution plan',
					},
					{
						name: 'Generate Plan',
						value: 'generate_plan',
						description: 'Generate an execution plan without executing it',
						action: 'Generate an execution plan for the given task',
					},
					{
						name: 'List Plans',
						value: 'list_plans',
						description: 'List all available execution plans',
						action: 'List all stored execution plans',
					},
					{
						name: 'Query',
						value: 'query',
						description: 'Start a new conversation with Gemini CLI',
						action: 'Start a new conversation with gemini cli',
					},
				],
				default: 'query',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The prompt or instruction to send to Gemini CLI',
				required: true,
				placeholder: 'e.g., "Create a Python function to parse CSV files"',
				hint: 'Use expressions like {{$json.prompt}} to use data from previous nodes',
				displayOptions: {
					show: {
						operation: ['query', 'continue', 'generate_plan'],
					},
				},
			},
			{
				displayName: 'Plan ID',
				name: 'planId',
				type: 'string',
				default: '',
				description: 'The ID of the plan to work with',
				required: true,
				placeholder: 'e.g., "plan_20240108_123456"',
				displayOptions: {
					show: {
						operation: ['edit_plan', 'approve_plan', 'execute_plan'],
					},
				},
			},
			{
				displayName: 'Edit Instructions',
				name: 'editInstructions',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Instructions for how to modify the plan',
				placeholder: 'e.g., "Add error handling to step 2 and increase timeout for step 4"',
				displayOptions: {
					show: {
						operation: ['edit_plan'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'Gemini 2.5 Pro',
						value: 'gemini-2.5-pro',
						description: 'Most capable model with 1M token context window',
					},
					{
						name: 'Gemini 2.5 Flash',
						value: 'gemini-2.5-flash',
						description: 'Fast and efficient model for quick responses',
					},
				],
				default: 'gemini-2.5-pro',
				description: 'Gemini model to use',
			},
			{
				displayName: 'Max Turns',
				name: 'maxTurns',
				type: 'number',
				default: 10,
				description: 'Maximum number of conversation turns (back-and-forth exchanges) allowed',
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				default: 300,
				description: 'Maximum time to wait for completion (in seconds) before aborting',
			},
			{
				displayName: 'Project Path',
				name: 'projectPath',
				type: 'string',
				default: '',
				description:
					'The directory path where Gemini CLI should run (e.g., /path/to/project). If empty, uses the current working directory.',
				placeholder: '/home/user/projects/my-app',
				hint: 'This sets the working directory for Gemini CLI, allowing it to access files and run commands in the specified project location',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Messages',
						value: 'messages',
						description: 'Returns the raw array of all messages exchanged',
					},
					{
						name: 'Plan',
						value: 'plan',
						description: 'Returns the execution plan structure (for plan operations)',
					},
					{
						name: 'Plan Status',
						value: 'plan_status',
						description: 'Returns plan execution progress and status',
					},
					{
						name: 'Structured',
						value: 'structured',
						description: 'Returns a structured object with messages, summary, result, and metrics',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Returns only the final result text',
					},
				],
				default: 'structured',
				description: 'Choose how to format the output data',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'API Key',
						name: 'apiKey',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
						description: 'Gemini API key (if not set via GEMINI_API_KEY environment variable)',
						placeholder: 'Your Gemini API key',
					},
					{
						displayName: 'Use Vertex AI',
						name: 'useVertexAI',
						type: 'boolean',
						default: false,
						description: 'Whether to use Vertex AI instead of Gemini API',
					},
					{
						displayName: 'System Prompt',
						name: 'systemPrompt',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Additional context or instructions for Gemini CLI',
						placeholder:
							'You are helping with a Python project. Focus on clean, readable code with proper error handling.',
					},
					{
						displayName: 'Debug Mode',
						name: 'debug',
						type: 'boolean',
						default: false,
						description: 'Whether to enable debug logging',
					},
				],
			},
			{
				displayName: 'Tools Configuration',
				name: 'toolsConfig',
				type: 'collection',
				placeholder: 'Configure Tools',
				default: {},
				description: 'Configure built-in tools and external integrations',
				options: [
					{
						displayName: 'Enable Built-in Tools',
						name: 'enabledTools',
						type: 'multiOptions',
						options: [
							{
								name: 'File System (Read/Write)',
								value: 'filesystem',
								description: 'Enable reading and writing files in the project directory',
							},
							{
								name: 'Shell Commands',
								value: 'shell',
								description: 'Allow execution of shell commands (use with caution)',
							},
							{
								name: 'Web Fetch',
								value: 'web_fetch',
								description: 'Enable fetching content from URLs',
							},
							{
								name: 'Web Search',
								value: 'web_search',
								description: 'Enable web search capabilities',
							},
						],
						default: ['web_fetch', 'web_search'],
						description: 'Select which built-in tools to enable for Gemini CLI',
					},
					{
						displayName: 'Security Mode',
						name: 'securityMode',
						type: 'options',
						options: [
							{
								name: 'Safe Mode (Confirmations Required)',
								value: 'safe',
								description: 'Require confirmation for destructive operations (recommended)',
							},
							{
								name: 'Auto-Approve (YOLO Mode)',
								value: 'yolo',
								description: 'Automatically approve all tool operations (use with extreme caution)',
							},
							{
								name: 'Sandbox Mode',
								value: 'sandbox',
								description: 'Run in sandbox environment with restricted access',
							},
						],
						default: 'safe',
						description: 'Choose security level for tool operations',
					},
					{
						displayName: 'Enable Checkpointing',
						name: 'checkpointing',
						type: 'boolean',
						default: false,
						description: 'Whether to enable session checkpointing to save conversation state',
					},
				],
			},
			{
				displayName: 'MCP Servers',
				name: 'mcpServers',
				type: 'fixedCollection',
				placeholder: 'Add MCP Server',
				default: { servers: [] },
				description: 'Configure external MCP (Model Context Protocol) servers for extended functionality',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Servers',
						name: 'servers',
						values: [
							{
								displayName: 'Command',
								name: 'command',
								type: 'string',
								default: '',
								description: 'Command to execute the MCP server',
								placeholder: 'npx @modelcontextprotocol/server-github',
								displayOptions: {
									show: {
										connectionType: ['command'],
									},
								},
							},
							{
								displayName: 'Command Arguments',
								name: 'args',
								type: 'string',
								default: '',
								description: 'Command arguments (space-separated)',
								placeholder: '--port 3000 --verbose',
								displayOptions: {
									show: {
										connectionType: ['command'],
									},
								},
							},
							{
								displayName: 'Connection Type',
								name: 'connectionType',
								type: 'options',
								options: [
									{
										name: 'Command (Stdio)',
										value: 'command',
										description: 'Connect via command execution with stdio transport',
									},
									{
										name: 'HTTP URL',
										value: 'http',
										description: 'Connect via HTTP with Server-Sent Events',
									},
								],
								default: 'command',
								description: 'How to connect to the MCP server',
							},
							{
								displayName: 'Environment Variables',
								name: 'env',
								type: 'string',
								default: '',
								description: 'Environment variables in KEY=VALUE format (one per line)',
								typeOptions: {
									rows: 3,
								},
								placeholder: 'GITHUB_PERSONAL_ACCESS_TOKEN=your_token\nAPI_BASE_URL=https://api.example.com',
							},
							{
								displayName: 'Exclude Tools',
								name: 'excludeTools',
								type: 'string',
								default: '',
								description: 'Comma-separated list of tools to exclude (blacklist, takes precedence)',
								placeholder: 'delete_file,format_disk',
							},
							{
								displayName: 'Headers for HTTP',
								name: 'headers',
								type: 'string',
								default: '',
								description: 'Custom headers for HTTP requests',
								typeOptions: {
									rows: 3,
								},
								placeholder: 'Authorization=Bearer ghp_abc',
								displayOptions: {
									show: {
										connectionType: ['http'],
									},
								},
							},
							{
								displayName: 'HTTP URL',
								name: 'httpUrl',
								type: 'string',
								default: '',
								description: 'HTTP URL for the MCP server',
								placeholder: 'http://localhost:3000/sse',
								displayOptions: {
									show: {
										connectionType: ['http'],
									},
								},
							},
							{
								displayName: 'Include Tools',
								name: 'includeTools',
								type: 'string',
								default: '',
								description: 'Comma-separated list of tools to include (whitelist)',
								placeholder: 'read_file,write_file,list_files',
							},
							{
								displayName: 'Server Name',
								name: 'name',
								type: 'string',
								default: '',
								required: true,
								description: 'Unique name for this MCP server',
								placeholder: 'github-server',
							},
							{
								displayName: 'Timeout (Ms)',
								name: 'timeout',
								type: 'number',
								default: 30000,
								description: 'Request timeout in milliseconds',
							},
							{
								displayName: 'Trust Level',
								name: 'trust',
								type: 'options',
								options: [
									{
										name: 'Require Confirmations',
										value: false,
										description: 'Require user confirmation for tool calls (recommended)',
									},
									{
										name: 'Auto-Trust',
										value: true,
										description: 'Automatically trust and execute tool calls (use with caution)',
									},
								],
								default: false,
								description: 'Whether to automatically trust and execute this server\'s tool calls',
							},
							{
								displayName: 'Working Directory',
								name: 'cwd',
								type: 'string',
								default: '',
								description: 'Working directory for the server command',
								placeholder: '/path/to/server',
								displayOptions: {
									show: {
										connectionType: ['command'],
									},
								},
							},
						],
					},
				],
			},
		],
	};

	private static async checkGeminiCLI(debug: boolean = false): Promise<{
		isAvailable: boolean;
		isAuthenticated: boolean;
		version?: string;
		error?: string;
	}> {
		try {
			// Check if gemini command is available
			const versionOutput = execSync('gemini --version', {
				encoding: 'utf8',
				timeout: 10000,
				stdio: ['pipe', 'pipe', 'pipe'],
			}).trim();

			if (debug) {
				console.log(`[GeminiCli] Gemini CLI version: ${versionOutput}`);
			}

			// Try to check authentication by running a simple command
			try {
				execSync('gemini --help', {
					encoding: 'utf8',
					timeout: 10000,
					stdio: ['pipe', 'pipe', 'pipe'],
				});

				if (debug) {
					console.log(`[GeminiCli] Gemini CLI available and accessible`);
				}

				return {
					isAvailable: true,
					isAuthenticated: true,
					version: versionOutput,
				};
			} catch (authError) {
				if (debug) {
					console.warn(
						`[GeminiCli] Gemini CLI authentication check failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
					);
				}

				return {
					isAvailable: true,
					isAuthenticated: false,
					version: versionOutput,
					error:
						'Gemini CLI is installed but may not be properly configured. Ensure API keys are set.',
				};
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			if (debug) {
				console.error(`[GeminiCli] Gemini CLI not available: ${errorMessage}`);
			}

			return {
				isAvailable: false,
				isAuthenticated: false,
				error:
					'Gemini CLI is not installed or not accessible. Install with: npm install -g @google/gemini-cli',
			};
		}
	}

	private static async createGeminiConfig(
		context: IExecuteFunctions,
		mcpServers: { servers: McpServer[] } | undefined,
		workingDirectory: string,
		debug: boolean = false,
	): Promise<{ configDir: string; settingsPath: string }> {
		const configDir = path.join(workingDirectory, '.gemini');
		const settingsPath = path.join(configDir, 'settings.json');

		if (debug) {
			console.log(`[GeminiCli] Creating config directory: ${configDir}`);
		}

		// Create .gemini directory
		try {
			await fs.mkdir(configDir, { recursive: true });
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Failed to create config directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}

		// Generate settings.json content
		const settings: GeminiSettings = {};

		if (mcpServers?.servers && mcpServers.servers.length > 0) {
			settings.mcpServers = {};

			for (const server of mcpServers.servers) {
				if (!server.name || server.name.trim() === '') {
					continue; // Skip servers without names
				}

				const serverConfig: GeminiServerConfig = {
					timeout: server.timeout || 30000,
					trust: server.trust || false,
				};

				// Handle connection type
				if (server.connectionType === 'command' && server.command) {
					serverConfig.command = server.command;
					
					// Parse arguments
					if (server.args && server.args.trim()) {
						serverConfig.args = server.args.trim().split(/\s+/);
					}

					if (server.cwd && server.cwd.trim()) {
						serverConfig.cwd = server.cwd.trim();
					}
				} else if (server.connectionType === 'http' && server.httpUrl) {
					serverConfig.url = server.httpUrl;
				}

				// Parse environment variables
				if (server.env && server.env.trim()) {
					serverConfig.env = {};
					const envLines = server.env.split('\n');
					for (const line of envLines) {
						const trimmed = line.trim();
						if (trimmed && trimmed.includes('=')) {
							const [key, ...valueParts] = trimmed.split('=');
							const value = valueParts.join('=');
							serverConfig.env[key.trim()] = value.trim();
						}
					}
				}

				// Parse custom headers
				if (server.headers && server.headers.trim()) {
					serverConfig.headers = {};
					const headerLines = server.headers.split('\n');
					for (const line of headerLines) {
						const trimmed = line.trim();
						if (trimmed && trimmed.includes('=')) {
							const [key, ...valueParts] = trimmed.split('=');
							const value = valueParts.join('=');
							serverConfig.headers[key.trim()] = value.trim();
						}
					}
				}

				// Handle tool filtering
				if (server.includeTools && server.includeTools.trim()) {
					serverConfig.includeTools = server.includeTools
						.split(',')
						.map(t => t.trim())
						.filter(t => t.length > 0);
				}

				if (server.excludeTools && server.excludeTools.trim()) {
					serverConfig.excludeTools = server.excludeTools
						.split(',')
						.map(t => t.trim())
						.filter(t => t.length > 0);
				}

				settings.mcpServers[server.name.trim()] = serverConfig;
			}
		}

		// Write settings file
		try {
			await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
			
			if (debug) {
				console.log(`[GeminiCli] Created settings file: ${settingsPath}`);
				console.log(`[GeminiCli] Settings content:`, JSON.stringify(settings, null, 2));
			}
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Failed to write settings file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}

		return { configDir, settingsPath };
	}

	private static async ensurePlansDirectory(workingDirectory: string): Promise<string> {
		const plansDir = path.join(workingDirectory, '.gemini', 'plans');
		try {
			await fs.mkdir(plansDir, { recursive: true });
			return plansDir;
		} catch (error) {
			throw new ApplicationError(`Failed to create plans directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static generatePlanId(): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		return `plan_${timestamp}_${randomSuffix}`;
	}

	private static async savePlan(plan: ExecutionPlan, workingDirectory: string): Promise<void> {
		const plansDir = await GeminiCli.ensurePlansDirectory(workingDirectory);
		const planPath = path.join(plansDir, `${plan.id}.json`);
		
		try {
			await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');
		} catch (error) {
			throw new ApplicationError(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static async loadPlan(planId: string, workingDirectory: string): Promise<ExecutionPlan | null> {
		const plansDir = path.join(workingDirectory, '.gemini', 'plans');
		const planPath = path.join(plansDir, `${planId}.json`);
		
		try {
			const planContent = await fs.readFile(planPath, 'utf8');
			return JSON.parse(planContent) as ExecutionPlan;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return null; // Plan not found
			}
			throw new ApplicationError(`Failed to load plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static async listPlans(workingDirectory: string): Promise<ExecutionPlan[]> {
		const plansDir = path.join(workingDirectory, '.gemini', 'plans');
		const plans: ExecutionPlan[] = [];
		
		try {
			const files = await fs.readdir(plansDir);
			const planFiles = files.filter(file => file.endsWith('.json'));
			
			for (const file of planFiles) {
				try {
					const planContent = await fs.readFile(path.join(plansDir, file), 'utf8');
					const plan = JSON.parse(planContent) as ExecutionPlan;
					plans.push(plan);
				} catch {
					// Skip invalid plan files
					continue;
				}
			}
			
			// Sort by creation date, newest first
			return plans.sort((a, b) => b.created_at - a.created_at);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return []; // Plans directory doesn't exist yet
			}
			throw new ApplicationError(`Failed to list plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}


	private static async cleanupGeminiConfig(configDir: string, debug: boolean = false): Promise<void> {
		try {
			if (debug) {
				console.log(`[GeminiCli] Cleaning up config directory: ${configDir}`);
			}

			// Remove the entire .gemini directory
			await fs.rm(configDir, { recursive: true, force: true });
		} catch (error) {
			if (debug) {
				console.warn(`[GeminiCli] Failed to cleanup config directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
			// Don't throw error for cleanup failures
		}
	}

	private static async validateProjectPath(
		projectPath: string,
		debug: boolean = false,
	): Promise<ProjectPathValidationResult> {
		const result: ProjectPathValidationResult = {
			isValid: false,
			warnings: [],
		};

		try {
			// Resolve and normalize the path
			const resolvedPath = path.resolve(projectPath);
			result.resolvedPath = resolvedPath;

			if (debug) {
				console.log(`[GeminiCli] Validating project path: ${projectPath} -> ${resolvedPath}`);
			}

			// Check if path exists
			try {
				const stats = await fs.stat(resolvedPath);
				if (!stats.isDirectory()) {
					result.error = `Path exists but is not a directory: ${resolvedPath}`;
					return result;
				}
			} catch {
				result.error = `Directory does not exist: ${resolvedPath}`;
				return result;
			}

			// Check read/write permissions
			try {
				await fs.access(resolvedPath, fs.constants.R_OK | fs.constants.W_OK);
			} catch {
				result.error = `Insufficient permissions for directory: ${resolvedPath}`;
				return result;
			}

			result.isValid = true;
			return result;
		} catch (err) {
			result.error = `Unexpected error validating project path: ${err instanceof Error ? err.message : 'Unknown error'}`;
			return result;
		}
	}

	private static async generatePlanWithGemini(
		context: IExecuteFunctions,
		prompt: string,
		options: {
			cwd?: string;
			apiKey?: string;
			useVertexAI?: boolean;
			model?: string;
			systemPrompt?: string;
			timeout?: number;
			debug?: boolean;
			toolsConfig?: ToolsConfig;
			mcpServers?: { servers: McpServer[] };
		},
	): Promise<ExecutionPlan> {
		const planId = GeminiCli.generatePlanId();
		const timestamp = Date.now();
		
		// Create a planning-specific system prompt
		const planningSystemPrompt = `You are an AI assistant that creates detailed execution plans. 
When given a task, you must respond with a structured execution plan in the following JSON format:

{
  "title": "Brief title for the task",
  "description": "Detailed description of what needs to be accomplished",
  "steps": [
    {
      "id": "step_1", 
      "description": "Clear description of what this step does",
      "command": "optional: specific command to run",
      "files": ["optional: array of files this step will work with"],
      "estimated_duration": 300
    }
  ]
}

Break down complex tasks into specific, actionable steps. Each step should be clear and executable.
Do not execute anything - only create the plan. Include estimated duration in seconds for each step.
Be specific about files that will be created, modified, or analyzed.

${options.systemPrompt ? `\n\nAdditional context: ${options.systemPrompt}` : ''}`;

		const planningPrompt = `Create an execution plan for the following task:

${prompt}

Respond ONLY with the JSON structure described in the system prompt. Do not include any other text, explanations, or markdown formatting.`;

		try {
			// Call Gemini CLI to generate the plan
			const response = await GeminiCli.runGeminiCLI(context, planningPrompt, {
				...options,
				systemPrompt: planningSystemPrompt,
			});

			if (!response.success) {
				throw new ApplicationError(`Failed to generate plan: ${response.error || 'Unknown error'}`);
			}

			// Parse the response to extract plan structure
			let planData;
			try {
				// Try to extract JSON from the response
				const jsonMatch = response.result.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new ApplicationError('No JSON structure found in Gemini response');
				}
				planData = JSON.parse(jsonMatch[0]);
			} catch (parseError) {
				throw new ApplicationError(`Failed to parse plan structure: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
			}

			// Validate and create the execution plan
			if (!planData.title || !planData.description || !Array.isArray(planData.steps)) {
				throw new ApplicationError('Invalid plan structure: missing required fields');
			}

			// Generate step IDs if not provided and validate steps
			const validatedSteps: ExecutionStep[] = planData.steps.map((step: unknown, index: number) => ({
				id: (step as Record<string, unknown>).id as string || `step_${index + 1}`,
				description: (step as Record<string, unknown>).description as string || `Step ${index + 1}`,
				command: (step as Record<string, unknown>).command as string,
				files: Array.isArray((step as Record<string, unknown>).files) ? (step as Record<string, unknown>).files as string[] : undefined,
				estimated_duration: typeof (step as Record<string, unknown>).estimated_duration === 'number' ? (step as Record<string, unknown>).estimated_duration as number : 300,
				status: 'pending' as const,
			}));

			const executionPlan: ExecutionPlan = {
				id: planId,
				title: planData.title,
				description: planData.description,
				steps: validatedSteps,
				created_at: timestamp,
				modified_at: timestamp,
				status: 'draft',
				original_prompt: prompt,
				configuration: {
					model: options.model,
					projectPath: options.cwd,
					toolsConfig: options.toolsConfig,
				},
			};

			// Save the plan
			await GeminiCli.savePlan(executionPlan, options.cwd || process.cwd());

			return executionPlan;
		} catch (error) {
			throw new ApplicationError(`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static async editPlanWithGemini(
		context: IExecuteFunctions,
		planId: string,
		editInstructions: string,
		options: {
			cwd?: string;
			apiKey?: string;
			useVertexAI?: boolean;
			model?: string;
			timeout?: number;
			debug?: boolean;
		},
	): Promise<ExecutionPlan> {
		const workingDirectory = options.cwd || process.cwd();
		
		// Load the existing plan
		const existingPlan = await GeminiCli.loadPlan(planId, workingDirectory);
		if (!existingPlan) {
			throw new ApplicationError(`Plan with ID ${planId} not found`);
		}

		// Create editing-specific system prompt
		const editingSystemPrompt = `You are an AI assistant that modifies execution plans based on user instructions.

You will receive:
1. An existing execution plan in JSON format
2. Instructions for how to modify the plan

You must respond with the modified plan in the same JSON format:

{
  "title": "Brief title for the task",
  "description": "Detailed description of what needs to be accomplished", 
  "steps": [
    {
      "id": "step_1",
      "description": "Clear description of what this step does",
      "command": "optional: specific command to run",
      "files": ["optional: array of files this step will work with"],
      "estimated_duration": 300
    }
  ]
}

Modify only what is requested in the instructions. Keep the existing structure and IDs where possible.
Respond ONLY with the JSON structure. Do not include any other text or explanations.`;

		const editingPrompt = `Here is the existing execution plan:

${JSON.stringify({
	title: existingPlan.title,
	description: existingPlan.description,
	steps: existingPlan.steps.map(step => ({
		id: step.id,
		description: step.description,
		command: step.command,
		files: step.files,
		estimated_duration: step.estimated_duration,
	})),
}, null, 2)}

Please modify this plan according to these instructions:

${editInstructions}

Respond ONLY with the modified JSON structure.`;

		try {
			// Call Gemini CLI to edit the plan
			const response = await GeminiCli.runGeminiCLI(context, editingPrompt, {
				...options,
				systemPrompt: editingSystemPrompt,
			});

			if (!response.success) {
				throw new ApplicationError(`Failed to edit plan: ${response.error || 'Unknown error'}`);
			}

			// Parse the response to extract modified plan structure
			let planData;
			try {
				const jsonMatch = response.result.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new ApplicationError('No JSON structure found in Gemini response');
				}
				planData = JSON.parse(jsonMatch[0]);
			} catch (parseError) {
				throw new ApplicationError(`Failed to parse edited plan structure: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
			}

			// Validate and update the execution plan
			if (!planData.title || !planData.description || !Array.isArray(planData.steps)) {
				throw new ApplicationError('Invalid edited plan structure: missing required fields');
			}

			const validatedSteps: ExecutionStep[] = planData.steps.map((step: unknown, index: number) => ({
				id: (step as Record<string, unknown>).id as string || `step_${index + 1}`,
				description: (step as Record<string, unknown>).description as string || `Step ${index + 1}`,
				command: (step as Record<string, unknown>).command as string,
				files: Array.isArray((step as Record<string, unknown>).files) ? (step as Record<string, unknown>).files as string[] : undefined,
				estimated_duration: typeof (step as Record<string, unknown>).estimated_duration === 'number' ? (step as Record<string, unknown>).estimated_duration as number : 300,
				status: 'pending' as const,
			}));

			const updatedPlan: ExecutionPlan = {
				...existingPlan,
				title: planData.title,
				description: planData.description,
				steps: validatedSteps,
				modified_at: Date.now(),
				status: 'draft', // Reset to draft after editing
			};

			// Save the updated plan
			await GeminiCli.savePlan(updatedPlan, workingDirectory);

			return updatedPlan;
		} catch (error) {
			throw new ApplicationError(`Plan editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static async executePlan(
		context: IExecuteFunctions,
		planId: string,
		options: {
			cwd?: string;
			apiKey?: string;
			useVertexAI?: boolean;
			model?: string;
			timeout?: number;
			debug?: boolean;
			toolsConfig?: ToolsConfig;
			mcpServers?: { servers: McpServer[] };
		},
	): Promise<{ plan: ExecutionPlan; results: GeminiResponse[] }> {
		const workingDirectory = options.cwd || process.cwd();
		
		// Load the plan
		const plan = await GeminiCli.loadPlan(planId, workingDirectory);
		if (!plan) {
			throw new ApplicationError(`Plan with ID ${planId} not found`);
		}

		if (plan.status !== 'approved') {
			throw new ApplicationError(`Plan must be approved before execution. Current status: ${plan.status}`);
		}

		// Update plan status to executing
		plan.status = 'executing';
		plan.modified_at = Date.now();
		await GeminiCli.savePlan(plan, workingDirectory);

		const results: GeminiResponse[] = [];
		let allStepsSuccessful = true;

		try {
			// Execute each step sequentially
			for (const step of plan.steps) {
				if (options.debug) {
					console.log(`[GeminiCli] Executing step: ${step.id} - ${step.description}`);
				}

				// Update step status
				step.status = 'in_progress';
				await GeminiCli.savePlan(plan, workingDirectory);

				// Create execution prompt for this step
				const executionPrompt = `Execute the following step from an approved plan:

Step Description: ${step.description}
${step.command ? `Suggested Command: ${step.command}` : ''}
${step.files ? `Files to work with: ${step.files.join(', ')}` : ''}

Complete this step thoroughly. If this involves code changes, make the actual changes. If it involves analysis, provide detailed analysis.`;

				try {
					// Execute the step
					const stepResult = await GeminiCli.runGeminiCLI(context, executionPrompt, options);
					results.push(stepResult);

					if (stepResult.success) {
						step.status = 'completed';
						if (options.debug) {
							console.log(`[GeminiCli] Step ${step.id} completed successfully`);
						}
					} else {
						step.status = 'failed';
						allStepsSuccessful = false;
						if (options.debug) {
							console.log(`[GeminiCli] Step ${step.id} failed: ${stepResult.error}`);
						}
						break; // Stop execution on first failure
					}
				} catch (stepError) {
					step.status = 'failed';
					allStepsSuccessful = false;
					if (options.debug) {
						console.error(`[GeminiCli] Step ${step.id} error: ${stepError}`);
					}
					break;
				}

				// Save progress after each step
				await GeminiCli.savePlan(plan, workingDirectory);
			}

			// Update final plan status
			plan.status = allStepsSuccessful ? 'completed' : 'failed';
			plan.modified_at = Date.now();
			await GeminiCli.savePlan(plan, workingDirectory);

			return { plan, results };
		} catch (error) {
			// Mark plan as failed on any error
			plan.status = 'failed';
			plan.modified_at = Date.now();
			await GeminiCli.savePlan(plan, workingDirectory);
			throw error;
		}
	}

	private static async runGeminiCLI(
		context: IExecuteFunctions,
		prompt: string,
		options: {
			cwd?: string;
			apiKey?: string;
			useVertexAI?: boolean;
			model?: string;
			systemPrompt?: string;
			timeout?: number;
			debug?: boolean;
			toolsConfig?: ToolsConfig;
			mcpServers?: { servers: McpServer[] };
		},
	): Promise<GeminiResponse> {
		return new Promise(async (resolve, reject) => {
			const messages: GeminiMessage[] = [];
			const startTime = Date.now();
			let fullResponse = '';
			let configDir: string | undefined;

			try {
				// Set up environment
				const env = { ...process.env };
				if (options.apiKey) {
					env.GEMINI_API_KEY = options.apiKey;
				}
				if (options.useVertexAI) {
					env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
					if (options.apiKey) {
						env.GOOGLE_API_KEY = options.apiKey;
					}
				}

				// Set up configuration directory for MCP servers
				const workingDirectory = options.cwd || process.cwd();
				if (options.mcpServers?.servers && options.mcpServers.servers.length > 0) {
					const configResult = await GeminiCli.createGeminiConfig(
						context,
						options.mcpServers,
						workingDirectory,
						options.debug,
					);
					configDir = configResult.configDir;
				}

				// Build command arguments
				const args: string[] = [];
				
				// Add model parameter
				if (options.model) {
					args.push('--model', options.model);
				}

				// Add security mode arguments
				if (options.toolsConfig?.securityMode) {
					switch (options.toolsConfig.securityMode) {
						case 'yolo':
							args.push('--yolo');
							break;
						case 'sandbox':
							args.push('--sandbox');
							break;
						// 'safe' is the default, no additional args needed
					}
				}

				// Add checkpointing if enabled
				if (options.toolsConfig?.checkpointing) {
					args.push('-c');
				}

				// Add debug mode if enabled
				if (options.debug) {
					args.push('--debug');
				}
				
				// Add system prompt if provided
				let finalPrompt = prompt;
				if (options.systemPrompt) {
					finalPrompt = `${options.systemPrompt}\n\n${prompt}`;
				}

				// Add the prompt argument
				args.push('-p', finalPrompt);

				if (options.debug) {
					console.log(`[GeminiCli] Starting Gemini CLI with prompt: ${finalPrompt.substring(0, 200)}...`);
					console.log(`[GeminiCli] Working directory: ${workingDirectory}`);
					console.log(`[GeminiCli] Model: ${options.model || 'default'}`);
					console.log(`[GeminiCli] Tools config:`, options.toolsConfig);
					console.log(`[GeminiCli] Command args:`, args);
					if (configDir) {
						console.log(`[GeminiCli] Config directory: ${configDir}`);
					}
				}

				// Spawn the gemini CLI process
				const geminiProcess = spawn('gemini', args, {
					cwd: workingDirectory,
					env,
					stdio: ['pipe', 'pipe', 'pipe'],
				});

				// Set up timeout
				const timeoutId = setTimeout(async () => {
					geminiProcess.kill('SIGTERM');
					
					// Cleanup configuration directory
					if (configDir) {
						await GeminiCli.cleanupGeminiConfig(configDir, options.debug);
					}
					
					reject(new ApplicationError(`Gemini CLI timed out after ${options.timeout || 300} seconds`));
				}, (options.timeout || 300) * 1000);

			// Handle stdout (main response)
			geminiProcess.stdout.on('data', (data: Buffer) => {
				const text = data.toString();
				fullResponse += text;
				
				messages.push({
					type: 'assistant',
					content: text,
					timestamp: Date.now(),
				});

				if (options.debug) {
					console.log(`[GeminiCli] Received: ${text.substring(0, 100)}...`);
				}
			});

			// Handle stderr (errors and debug info)
			geminiProcess.stderr.on('data', (data: Buffer) => {
				const text = data.toString();
				messages.push({
					type: 'error',
					content: text,
					timestamp: Date.now(),
				});

				if (options.debug) {
					console.warn(`[GeminiCli] Error: ${text}`);
				}
			});

			// Handle process completion
			geminiProcess.on('close', async (code) => {
				clearTimeout(timeoutId);
				const duration = Date.now() - startTime;

				// Cleanup configuration directory
				if (configDir) {
					await GeminiCli.cleanupGeminiConfig(configDir, options.debug);
				}

				if (code === 0) {
					resolve({
						messages,
						result: fullResponse.trim(),
						success: true,
						duration_ms: duration,
					});
				} else {
					const error = `Gemini CLI exited with code ${code}`;
					resolve({
						messages,
						result: fullResponse.trim(),
						success: false,
						duration_ms: duration,
						error,
					});
				}
			});

			geminiProcess.on('error', async (error) => {
				clearTimeout(timeoutId);
				
				// Cleanup configuration directory
				if (configDir) {
					await GeminiCli.cleanupGeminiConfig(configDir, options.debug);
				}
				
				reject(new ApplicationError(`Failed to start Gemini CLI: ${error.message}`));
			});

			// Close stdin since we're passing the prompt as an argument
			geminiProcess.stdin.end();

				// Add user message to track what was sent
				messages.unshift({
					type: 'user',
					content: finalPrompt,
					timestamp: startTime,
				});
			} catch (error) {
				// Handle errors in configuration setup
				if (configDir) {
					await GeminiCli.cleanupGeminiConfig(configDir, options.debug);
				}
				reject(error);
			}
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const model = this.getNodeParameter('model', itemIndex) as string;
				const maxTurns = this.getNodeParameter('maxTurns', itemIndex) as number;
				const timeout = this.getNodeParameter('timeout', itemIndex) as number;
				const projectPath = this.getNodeParameter('projectPath', itemIndex) as string;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
				const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex) as {
					apiKey?: string;
					useVertexAI?: boolean;
					systemPrompt?: string;
					debug?: boolean;
				};
				const toolsConfig = this.getNodeParameter('toolsConfig', itemIndex) as ToolsConfig;
				const mcpServers = this.getNodeParameter('mcpServers', itemIndex) as { servers: McpServer[] };

				// Get operation-specific parameters
				const prompt = ['query', 'continue', 'generate_plan'].includes(operation)
					? this.getNodeParameter('prompt', itemIndex) as string
					: '';
				const planId = ['edit_plan', 'approve_plan', 'execute_plan'].includes(operation)
					? this.getNodeParameter('planId', itemIndex) as string
					: '';
				const editInstructions = operation === 'edit_plan'
					? this.getNodeParameter('editInstructions', itemIndex) as string
					: '';

				// Validate required parameters based on operation
				if (['query', 'continue', 'generate_plan'].includes(operation) && (!prompt || prompt.trim() === '')) {
					throw new NodeOperationError(this.getNode(), 'Prompt is required and cannot be empty', {
						itemIndex,
					});
				}

				if (['edit_plan', 'approve_plan', 'execute_plan'].includes(operation) && (!planId || planId.trim() === '')) {
					throw new NodeOperationError(this.getNode(), 'Plan ID is required for this operation', {
						itemIndex,
					});
				}

				// Check Gemini CLI availability
				const cliCheck = await GeminiCli.checkGeminiCLI(additionalOptions.debug);

				if (!cliCheck.isAvailable) {
					throw new NodeOperationError(
						this.getNode(),
						cliCheck.error || 'Gemini CLI not available',
						{
							itemIndex,
							description: 'Ensure Gemini CLI is installed and accessible in the system PATH',
						},
					);
				}

				// Validate project path if specified
				let resolvedProjectPath: string | undefined;
				if (projectPath && projectPath.trim() !== '') {
					const pathValidation = await GeminiCli.validateProjectPath(
						projectPath.trim(),
						additionalOptions.debug,
					);

					if (!pathValidation.isValid) {
						const errorMsg = `Invalid project path: ${pathValidation.error}`;
						if (additionalOptions.debug) {
							console.error(`[GeminiCli] ${errorMsg}`);
						}
						throw new NodeOperationError(this.getNode(), errorMsg, {
							itemIndex,
							description:
								'The specified project path could not be validated. Please check the path exists, is a directory, and has proper permissions.',
						});
					}

					resolvedProjectPath = pathValidation.resolvedPath;
				}

				if (additionalOptions.debug) {
					console.log(`[GeminiCli] ========== EXECUTION START ==========`);
					console.log(`[GeminiCli] Starting execution for item ${itemIndex}`);
					console.log(`[GeminiCli] Gemini CLI: ${cliCheck.version || 'unknown version'}`);
					console.log(`[GeminiCli] Operation: ${operation}`);
					console.log(`[GeminiCli] Prompt length: ${prompt.length} chars`);
					console.log(`[GeminiCli] Model: ${model}`);
					console.log(`[GeminiCli] Max turns: ${maxTurns}`);
					console.log(`[GeminiCli] Timeout: ${timeout}s`);
					console.log(`[GeminiCli] Output format: ${outputFormat}`);
					console.log(`[GeminiCli] Project path: ${resolvedProjectPath || 'default'}`);
					console.log(`[GeminiCli] ========================================`);
				}

				// Execute operation based on type
				let response: GeminiResponse | undefined;
				let plan: ExecutionPlan | undefined;
				let plans: ExecutionPlan[] | undefined;
				let executionResults: { plan: ExecutionPlan; results: GeminiResponse[] } | undefined;

				const operationOptions = {
					cwd: resolvedProjectPath,
					apiKey: additionalOptions.apiKey,
					useVertexAI: additionalOptions.useVertexAI,
					model,
					systemPrompt: additionalOptions.systemPrompt,
					timeout,
					debug: additionalOptions.debug,
					toolsConfig,
					mcpServers,
				};

				switch (operation) {
					case 'query':
					case 'continue':
						// Execute traditional Gemini CLI operations
						response = await GeminiCli.runGeminiCLI(this, prompt, operationOptions);
						break;

					case 'generate_plan':
						// Generate a new execution plan
						plan = await GeminiCli.generatePlanWithGemini(this, prompt, operationOptions);
						break;

					case 'list_plans':
						// List all available plans
						plans = await GeminiCli.listPlans(resolvedProjectPath || process.cwd());
						break;

					case 'edit_plan':
						// Edit an existing plan
						plan = await GeminiCli.editPlanWithGemini(this, planId, editInstructions, operationOptions);
						break;

					case 'approve_plan':
						// Approve a plan for execution
						const planToApprove = await GeminiCli.loadPlan(planId, resolvedProjectPath || process.cwd());
						if (!planToApprove) {
							throw new NodeOperationError(this.getNode(), `Plan with ID ${planId} not found`, {
								itemIndex,
							});
						}
						planToApprove.status = 'approved';
						planToApprove.modified_at = Date.now();
						await GeminiCli.savePlan(planToApprove, resolvedProjectPath || process.cwd());
						plan = planToApprove;
						break;

					case 'execute_plan':
						// Execute an approved plan
						executionResults = await GeminiCli.executePlan(this, planId, operationOptions);
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
				}

				// Format output based on selected format and operation
				// Format output based on operation type and selected format
				if (response) {
					// Handle traditional Gemini CLI operations (query, continue)
					if (outputFormat === 'text') {
						returnData.push({
							json: {
								result: response.result,
								success: response.success,
								duration_ms: response.duration_ms,
								error: response.error,
							},
							pairedItem: itemIndex,
						});
					} else if (outputFormat === 'messages') {
						returnData.push({
							json: {
								messages: response.messages,
								messageCount: response.messages.length,
							},
							pairedItem: itemIndex,
						});
					} else if (outputFormat === 'structured') {
						const userMessages = response.messages.filter((m) => m.type === 'user');
						const assistantMessages = response.messages.filter((m) => m.type === 'assistant');
						const errorMessages = response.messages.filter((m) => m.type === 'error');

						returnData.push({
							json: {
								messages: response.messages,
								summary: {
									userMessageCount: userMessages.length,
									assistantMessageCount: assistantMessages.length,
									errorMessageCount: errorMessages.length,
									hasResult: !!response.result,
								},
								result: response.result,
								metrics: {
									duration_ms: response.duration_ms,
									num_turns: Math.ceil(response.messages.length / 2),
									success: response.success,
								},
								configuration: {
									model,
									toolsEnabled: toolsConfig?.enabledTools || [],
									securityMode: toolsConfig?.securityMode || 'safe',
									checkpointing: toolsConfig?.checkpointing || false,
									mcpServersCount: mcpServers?.servers?.length || 0,
									mcpServerNames: mcpServers?.servers?.map(s => s.name).filter(n => n) || [],
									projectPath: resolvedProjectPath,
								},
								success: response.success,
								error: response.error,
							},
							pairedItem: itemIndex,
						});
					}
				} else if (plan) {
					// Handle plan operations (generate_plan, edit_plan, approve_plan)
					if (outputFormat === 'plan' || outputFormat === 'structured') {
						returnData.push({
							json: {
								plan,
								operation,
								success: true,
							},
							pairedItem: itemIndex,
						});
					} else {
						returnData.push({
							json: {
								planId: plan.id,
								title: plan.title,
								status: plan.status,
								stepCount: plan.steps.length,
								operation,
								success: true,
							},
							pairedItem: itemIndex,
						});
					}
				} else if (plans) {
					// Handle list_plans operation
					returnData.push({
						json: {
							plans: outputFormat === 'plan' ? plans : plans.map(p => ({
								id: p.id,
								title: p.title,
								status: p.status,
								stepCount: p.steps.length,
								created_at: p.created_at,
								modified_at: p.modified_at,
							})),
							planCount: plans.length,
							operation,
							success: true,
						},
						pairedItem: itemIndex,
					});
				} else if (executionResults) {
					// Handle execute_plan operation
					if (outputFormat === 'plan_status' || outputFormat === 'structured') {
						returnData.push({
							json: {
								plan: executionResults.plan,
								executionResults: executionResults.results,
								summary: {
									totalSteps: executionResults.plan.steps.length,
									completedSteps: executionResults.plan.steps.filter(s => s.status === 'completed').length,
									failedSteps: executionResults.plan.steps.filter(s => s.status === 'failed').length,
									finalStatus: executionResults.plan.status,
								},
								operation,
								success: executionResults.plan.status === 'completed',
							},
							pairedItem: itemIndex,
						});
					} else {
						returnData.push({
							json: {
								planId: executionResults.plan.id,
								status: executionResults.plan.status,
								completedSteps: executionResults.plan.steps.filter(s => s.status === 'completed').length,
								totalSteps: executionResults.plan.steps.length,
								operation,
								success: executionResults.plan.status === 'completed',
							},
							pairedItem: itemIndex,
						});
					}
				}

				if (additionalOptions.debug) {
					if (response) {
						console.log(
							`[GeminiCli] Execution completed in ${response.duration_ms}ms with ${response.messages.length} messages`,
						);
					} else {
						console.log(`[GeminiCli] ${operation} operation completed successfully`);
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
							errorType: 'execution_error',
							errorDetails: error instanceof Error ? error.stack : undefined,
							itemIndex,
						},
						pairedItem: itemIndex,
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Gemini CLI execution failed: ${errorMessage}`, {
					itemIndex,
					description: errorMessage,
				});
			}
		}

		return [returnData];
	}
}