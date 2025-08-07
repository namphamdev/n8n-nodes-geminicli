import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
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

export class GeminiCli implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gemini CLI',
		name: 'geminiCli',
		icon: 'file:gemini.svg',
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
						name: 'Query',
						value: 'query',
						description: 'Start a new conversation with Gemini CLI',
						action: 'Start a new conversation with gemini cli',
					},
					{
						name: 'Continue',
						value: 'continue',
						description: 'Continue a previous conversation (requires prior query)',
						action: 'Continue a previous conversation requires prior query',
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
						name: 'Structured',
						value: 'structured',
						description: 'Returns a structured object with messages, summary, result, and metrics',
					},
					{
						name: 'Messages',
						value: 'messages',
						description: 'Returns the raw array of all messages exchanged',
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

	private static async runGeminiCLI(
		prompt: string,
		options: {
			cwd?: string;
			apiKey?: string;
			useVertexAI?: boolean;
			model?: string;
			systemPrompt?: string;
			timeout?: number;
			debug?: boolean;
		},
	): Promise<GeminiResponse> {
		return new Promise((resolve, reject) => {
			const messages: GeminiMessage[] = [];
			const startTime = Date.now();
			let fullResponse = '';

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

			// Build command arguments
			const args: string[] = [];
			
			// Add model parameter
			if (options.model) {
				args.push('--model', options.model);
			}
			
			// Add system prompt if provided
			let finalPrompt = prompt;
			if (options.systemPrompt) {
				finalPrompt = `${options.systemPrompt}\n\n${prompt}`;
			}

			if (options.debug) {
				console.log(`[GeminiCli] Starting Gemini CLI with prompt: ${finalPrompt.substring(0, 200)}...`);
				console.log(`[GeminiCli] Working directory: ${options.cwd || 'default'}`);
				console.log(`[GeminiCli] Model: ${options.model || 'default'}`);
			}

			// Add the prompt as the final argument
			args.push(finalPrompt);

			// Spawn the gemini CLI process
			const geminiProcess = spawn('gemini', args, {
				cwd: options.cwd,
				env,
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			// Set up timeout
			const timeoutId = setTimeout(() => {
				geminiProcess.kill('SIGTERM');
				reject(new Error(`Gemini CLI timed out after ${options.timeout || 300} seconds`));
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
			geminiProcess.on('close', (code) => {
				clearTimeout(timeoutId);
				const duration = Date.now() - startTime;

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

			geminiProcess.on('error', (error) => {
				clearTimeout(timeoutId);
				reject(new Error(`Failed to start Gemini CLI: ${error.message}`));
			});

			// Close stdin since we're passing the prompt as an argument
			geminiProcess.stdin.end();

			// Add user message to track what was sent
			messages.unshift({
				type: 'user',
				content: finalPrompt,
				timestamp: startTime,
			});
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const prompt = this.getNodeParameter('prompt', itemIndex) as string;
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

				// Validate required parameters
				if (!prompt || prompt.trim() === '') {
					throw new NodeOperationError(this.getNode(), 'Prompt is required and cannot be empty', {
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

				// Execute Gemini CLI
				const response = await GeminiCli.runGeminiCLI(prompt, {
					cwd: resolvedProjectPath,
					apiKey: additionalOptions.apiKey,
					useVertexAI: additionalOptions.useVertexAI,
					model,
					systemPrompt: additionalOptions.systemPrompt,
					timeout,
					debug: additionalOptions.debug,
				});

				// Format output based on selected format
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
							success: response.success,
							error: response.error,
						},
						pairedItem: itemIndex,
					});
				}

				if (additionalOptions.debug) {
					console.log(
						`[GeminiCli] Execution completed in ${response.duration_ms}ms with ${response.messages.length} messages`,
					);
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