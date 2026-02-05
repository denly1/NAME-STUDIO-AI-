// Agent Harness - Coordinates AI model, tools, and conversation

import OpenAI from 'openai';
import { agentTools, ToolResult, FileDiff } from './agentTools';
import { codebaseIndex, SearchResult } from './codebaseIndex';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': 'https://namestudio.ai',
    'X-Title': 'NAME STUDIO AI'
  }
});

export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_use' | 'result' | 'error';
  description: string;
  tool?: string;
  input?: any;
  output?: any;
  timestamp: number;
}

export interface AgentPlan {
  goal: string;
  steps: string[];
  currentStep: number;
  completed: boolean;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentTask {
  id: string;
  description: string;
  plan?: AgentPlan;
  steps: AgentStep[];
  diffs: FileDiff[];
  status: 'planning' | 'executing' | 'waiting_approval' | 'completed' | 'failed';
  error?: string;
}

export class AgentHarness {
  private conversationHistory: AgentMessage[] = [];
  private currentTask: AgentTask | null = null;
  private workspaceRoot: string = '';
  private autonomousMode: boolean = false;

  constructor() {
    // Initialize tools
    agentTools.setWorkspaceRoot(this.workspaceRoot);
    codebaseIndex.setWorkspaceRoot(this.workspaceRoot);
  }

  setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
    agentTools.setWorkspaceRoot(root);
    codebaseIndex.setWorkspaceRoot(root);
  }

  setAutonomousMode(enabled: boolean) {
    this.autonomousMode = enabled;
  }

  // Main entry point - execute user task
  async executeTask(
    userRequest: string,
    onProgress?: (step: AgentStep) => void,
    onPlanCreated?: (plan: AgentPlan) => void,
    onDiffCreated?: (diff: FileDiff) => void
  ): Promise<AgentTask> {
    const taskId = `task_${Date.now()}`;
    
    this.currentTask = {
      id: taskId,
      description: userRequest,
      steps: [],
      diffs: [],
      status: 'planning'
    };

    try {
      // Step 1: Create plan
      this.addStep({
        id: `${taskId}_step_planning`,
        type: 'thinking',
        description: 'Analyzing task and creating execution plan...',
        timestamp: Date.now()
      }, onProgress);

      const plan = await this.createPlan(userRequest);
      this.currentTask.plan = plan;
      
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      this.addStep({
        id: `${taskId}_step_plan_created`,
        type: 'result',
        description: `Plan created with ${plan.steps.length} steps`,
        output: plan,
        timestamp: Date.now()
      }, onProgress);

      // Step 2: Execute plan
      this.currentTask.status = 'executing';
      
      for (let i = 0; i < plan.steps.length; i++) {
        plan.currentStep = i;
        const stepDescription = plan.steps[i];

        this.addStep({
          id: `${taskId}_step_${i}`,
          type: 'thinking',
          description: `Executing: ${stepDescription}`,
          timestamp: Date.now()
        }, onProgress);

        // Execute step
        const result = await this.executeStep(stepDescription, onProgress, onDiffCreated);
        
        if (!result.success) {
          throw new Error(result.error || 'Step execution failed');
        }
      }

      // Step 3: Complete
      plan.completed = true;
      this.currentTask.status = this.currentTask.diffs.length > 0 ? 'waiting_approval' : 'completed';

      this.addStep({
        id: `${taskId}_step_complete`,
        type: 'result',
        description: this.currentTask.diffs.length > 0 
          ? `Task completed. ${this.currentTask.diffs.length} file(s) ready for review.`
          : 'Task completed successfully.',
        timestamp: Date.now()
      }, onProgress);

      return this.currentTask;

    } catch (error: any) {
      this.currentTask.status = 'failed';
      this.currentTask.error = error.message;

      this.addStep({
        id: `${taskId}_step_error`,
        type: 'error',
        description: `Task failed: ${error.message}`,
        timestamp: Date.now()
      }, onProgress);

      return this.currentTask;
    }
  }

  // Create execution plan
  private async createPlan(userRequest: string): Promise<AgentPlan> {
    const systemPrompt = this.getPlanningSystemPrompt();
    
    const response = await openai.chat.completions.create({
      model: 'qwen/qwen-2.5-coder-32b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a plan for: ${userRequest}` }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content || '';
    
    // Parse plan from response
    const steps = this.parsePlanSteps(content);

    return {
      goal: userRequest,
      steps,
      currentStep: 0,
      completed: false
    };
  }

  // Execute single step
  private async executeStep(
    stepDescription: string,
    onProgress?: (step: AgentStep) => void,
    onDiffCreated?: (diff: FileDiff) => void
  ): Promise<ToolResult> {
    const systemPrompt = this.getExecutionSystemPrompt();
    
    // Get codebase context
    const codebaseContext = await this.getCodebaseContext(stepDescription);
    
    const response = await openai.chat.completions.create({
      model: 'qwen/qwen-2.5-coder-32b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${codebaseContext}\n\nExecute step: ${stepDescription}` }
      ],
      temperature: 0.15,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content || '';
    
    // Parse tool calls from response
    const toolCalls = this.parseToolCalls(content);
    
    // Execute tools
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall.tool, toolCall.args, onProgress, onDiffCreated);
      
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  }

  // Execute tool
  private async executeTool(
    toolName: string,
    args: any,
    onProgress?: (step: AgentStep) => void,
    onDiffCreated?: (diff: FileDiff) => void
  ): Promise<ToolResult> {
    this.addStep({
      id: `tool_${Date.now()}`,
      type: 'tool_use',
      description: `Using tool: ${toolName}`,
      tool: toolName,
      input: args,
      timestamp: Date.now()
    }, onProgress);

    let result: ToolResult;

    switch (toolName) {
      case 'read_file':
        result = await agentTools.readFile(args.path);
        break;
      
      case 'list_directory':
        result = await agentTools.listDirectory(args.path);
        break;
      
      case 'search_files':
        result = await agentTools.searchFiles(args.pattern, args.directory);
        break;
      
      case 'search_content':
        result = await agentTools.searchContent(args.query, args.directory);
        break;
      
      case 'edit_file':
        result = await agentTools.createFileDiff(args.path, args.content);
        if (result.success && result.data) {
          const diff: FileDiff = {
            file: result.data.file,
            oldContent: result.data.oldContent,
            newContent: result.data.newContent,
            diff: result.data.diff
          };
          this.currentTask?.diffs.push(diff);
          if (onDiffCreated) {
            onDiffCreated(diff);
          }
        }
        break;
      
      case 'create_file':
        result = await agentTools.createFile(args.path, args.content);
        break;
      
      case 'delete_file':
        result = await agentTools.deleteFile(args.path);
        break;
      
      case 'codebase_search':
        const searchResults = await codebaseIndex.search(args.query, args.limit || 5);
        result = {
          success: true,
          data: { results: searchResults, count: searchResults.length }
        };
        break;
      
      default:
        result = {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }

    this.addStep({
      id: `tool_result_${Date.now()}`,
      type: 'result',
      description: result.success ? `Tool ${toolName} completed` : `Tool ${toolName} failed`,
      output: result.data || result.error,
      timestamp: Date.now()
    }, onProgress);

    return result;
  }

  // Apply approved diff
  async applyDiff(diff: FileDiff): Promise<ToolResult> {
    return await agentTools.applyEdit(diff.file, diff.newContent);
  }

  // Get codebase context for step
  private async getCodebaseContext(query: string): Promise<string> {
    const searchResults = await codebaseIndex.search(query, 3);
    
    if (searchResults.length === 0) {
      return 'No relevant code found in codebase.';
    }

    let context = 'Relevant code from codebase:\n\n';
    
    for (const result of searchResults) {
      context += `File: ${result.chunk.file} (lines ${result.chunk.startLine}-${result.chunk.endLine})\n`;
      context += `Type: ${result.chunk.type}\n`;
      if (result.chunk.name) {
        context += `Name: ${result.chunk.name}\n`;
      }
      context += `Relevance: ${result.relevance}\n`;
      context += `\`\`\`\n${result.chunk.content}\n\`\`\`\n\n`;
    }

    return context;
  }

  // Parse plan steps from AI response
  private parsePlanSteps(content: string): string[] {
    const steps: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered steps like "1. Do something" or "Step 1: Do something"
      const match = trimmed.match(/^(?:\d+\.|Step \d+:)\s*(.+)$/i);
      if (match) {
        steps.push(match[1]);
      }
    }

    // If no steps found, use the whole content as one step
    if (steps.length === 0) {
      steps.push(content.trim());
    }

    return steps;
  }

  // Parse tool calls from AI response
  private parseToolCalls(content: string): Array<{ tool: string; args: any }> {
    const toolCalls: Array<{ tool: string; args: any }> = [];
    
    // Try to find JSON tool calls
    const jsonMatches = content.matchAll(/\{[^}]*"tool"[^}]*\}/g);
    
    for (const match of jsonMatches) {
      try {
        const toolCall = JSON.parse(match[0]);
        toolCalls.push(toolCall);
      } catch (e) {
        // Skip invalid JSON
      }
    }

    return toolCalls;
  }

  // Add step to current task
  private addStep(step: AgentStep, onProgress?: (step: AgentStep) => void) {
    if (this.currentTask) {
      this.currentTask.steps.push(step);
    }
    if (onProgress) {
      onProgress(step);
    }
  }

  // System prompts
  private getPlanningSystemPrompt(): string {
    return `You are an AI planning agent. Create a detailed execution plan for the user's request.

Your plan should:
1. Break down the task into clear, actionable steps
2. Consider the codebase structure and dependencies
3. Plan file reads before edits
4. Plan searches to find relevant code
5. Be specific about what needs to be done

Output format:
1. First step description
2. Second step description
3. Third step description
...

Be concise but specific. Each step should be a clear action.`;
  }

  private getExecutionSystemPrompt(): string {
    return `You are an AI execution agent with access to tools. Execute the given step using available tools.

Available tools:
- read_file: Read file contents
- list_directory: List directory contents
- search_files: Search files by name
- search_content: Search file contents
- edit_file: Create file edit (generates diff for approval)
- create_file: Create new file
- delete_file: Delete file
- codebase_search: Semantic search across codebase

To use a tool, output JSON:
{"tool": "tool_name", "args": {"arg1": "value1", "arg2": "value2"}}

You can call multiple tools in sequence. Be precise and minimal in your changes.`;
  }

  // Index project files
  async indexProject(files: string[]): Promise<void> {
    await codebaseIndex.indexProject(files);
  }

  // Get current task
  getCurrentTask(): AgentTask | null {
    return this.currentTask;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
    this.currentTask = null;
  }
}

export const agentHarness = new AgentHarness();
