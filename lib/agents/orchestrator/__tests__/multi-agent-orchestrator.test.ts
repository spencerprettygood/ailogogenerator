import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiAgentOrchestrator } from '../multi-agent-orchestrator';
import { LogoBrief } from '../../../types';
import { 
  RequirementsAgent,
  MoodboardAgent,
  SelectionAgent,
  SVGGenerationAgent,
  SVGValidationAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent
} from '../../specialized';

// Mock all specialized agents
vi.mock('../../specialized', () => {
  const createMockAgent = (name: string, success = true) => {
    return class MockAgent {
      id = name;
      type = name;
      capabilities = [name];
      status = 'idle';
      metrics = {
        tokenUsage: { input: 0, output: 0, total: 0 },
        executionTime: 0,
        retryCount: 0,
        startTime: 0,
        endTime: 0
      };
      config = {
        model: 'claude-3-5-sonnet-20240620',
        temperature: 0.5,
        maxTokens: 1000
      };
      
      initialize = vi.fn().mockResolvedValue(undefined);
      
      execute = vi.fn().mockResolvedValue({
        success,
        result: success ? { mockResult: `${name} result` } : undefined,
        error: success ? undefined : { message: `${name} failed` }
      });
      
      getStatus = vi.fn().mockReturnValue('completed');
      
      getMetrics = vi.fn().mockReturnValue({
        tokenUsage: { input: 100, output: 50, total: 150 },
        executionTime: 1000,
        retryCount: 0,
        startTime: Date.now() - 1000,
        endTime: Date.now()
      });
    };
  };
  
  return {
    RequirementsAgent: createMockAgent('requirements'),
    MoodboardAgent: createMockAgent('moodboard'),
    SelectionAgent: createMockAgent('selection'),
    SVGGenerationAgent: createMockAgent('svgGeneration'),
    SVGValidationAgent: createMockAgent('svgValidation'),
    VariantGenerationAgent: createMockAgent('variantGeneration'),
    GuidelineAgent: createMockAgent('guideline'),
    PackagingAgent: createMockAgent('packaging')
  };
});

describe('MultiAgentOrchestrator', () => {
  let mockBrief: LogoBrief;
  let mockProgressCallback: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up test data
    mockBrief = {
      prompt: 'Create a modern logo for TechCorp'
    };
    
    mockProgressCallback = vi.fn();
    
    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
    
    // Mock AbortController
    global.AbortController = vi.fn().mockImplementation(() => ({
      signal: { aborted: false },
      abort: vi.fn()
    }));
    
    // Mock setTimeout
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      return 123 as any; // Just return a number for the timeout ID
    });
    
    // Mock clearTimeout
    vi.spyOn(global, 'clearTimeout').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should initialize all agents', async () => {
    const orchestrator = new MultiAgentOrchestrator(mockBrief);
    
    // Execute to trigger initialization
    await orchestrator.execute();
    
    // Check that all agents were initialized
    expect(RequirementsAgent.prototype.initialize).toHaveBeenCalled();
    expect(MoodboardAgent.prototype.initialize).toHaveBeenCalled();
    expect(SelectionAgent.prototype.initialize).toHaveBeenCalled();
    expect(SVGGenerationAgent.prototype.initialize).toHaveBeenCalled();
    expect(SVGValidationAgent.prototype.initialize).toHaveBeenCalled();
    expect(VariantGenerationAgent.prototype.initialize).toHaveBeenCalled();
    expect(GuidelineAgent.prototype.initialize).toHaveBeenCalled();
    expect(PackagingAgent.prototype.initialize).toHaveBeenCalled();
  });
  
  it('should execute all agents in the correct order', async () => {
    const orchestrator = new MultiAgentOrchestrator(mockBrief);
    
    // Execute the orchestrator
    await orchestrator.execute();
    
    // Check execution order based on dependencies
    const requirementsExecuteOrder = RequirementsAgent.prototype.execute.mock.invocationCallOrder[0];
    const moodboardExecuteOrder = MoodboardAgent.prototype.execute.mock.invocationCallOrder[0];
    const selectionExecuteOrder = SelectionAgent.prototype.execute.mock.invocationCallOrder[0];
    const svgGenerationExecuteOrder = SVGGenerationAgent.prototype.execute.mock.invocationCallOrder[0];
    const svgValidationExecuteOrder = SVGValidationAgent.prototype.execute.mock.invocationCallOrder[0];
    const variantGenerationExecuteOrder = VariantGenerationAgent.prototype.execute.mock.invocationCallOrder[0];
    const guidelineExecuteOrder = GuidelineAgent.prototype.execute.mock.invocationCallOrder[0];
    const packagingExecuteOrder = PackagingAgent.prototype.execute.mock.invocationCallOrder[0];
    
    // Verify execution order follows dependencies
    expect(requirementsExecuteOrder).toBeLessThan(moodboardExecuteOrder);
    expect(moodboardExecuteOrder).toBeLessThan(selectionExecuteOrder);
    expect(selectionExecuteOrder).toBeLessThan(svgGenerationExecuteOrder);
    expect(svgGenerationExecuteOrder).toBeLessThan(svgValidationExecuteOrder);
    expect(svgValidationExecuteOrder).toBeLessThan(variantGenerationExecuteOrder);
    expect(variantGenerationExecuteOrder).toBeLessThan(guidelineExecuteOrder);
    expect(variantGenerationExecuteOrder).toBeLessThan(packagingExecuteOrder);
    expect(guidelineExecuteOrder).toBeLessThan(packagingExecuteOrder);
  });
  
  it('should call progress callback with updates', async () => {
    const orchestrator = new MultiAgentOrchestrator(
      mockBrief,
      { debugMode: true },
      mockProgressCallback
    );
    
    // Execute the orchestrator
    await orchestrator.execute();
    
    // Check that progress callback was called
    expect(mockProgressCallback).toHaveBeenCalled();
    
    // Check first call for requirements agent
    const firstCall = mockProgressCallback.mock.calls[0][0];
    expect(firstCall.stage).toBe('stage-a');
    expect(firstCall.agent).toBe('requirements');
    expect(firstCall.status).toBe('working');
    
    // Check for completed status at the end
    const completedCalls = mockProgressCallback.mock.calls.filter(
      call => call[0].status === 'completed'
    );
    expect(completedCalls.length).toBeGreaterThan(0);
  });
  
  it('should handle agent failures with retry logic', async () => {
    // Mock SVGGenerationAgent to fail once then succeed
    let failCount = 0;
    SVGGenerationAgent.prototype.execute = vi.fn().mockImplementation(() => {
      if (failCount === 0) {
        failCount++;
        return Promise.resolve({
          success: false,
          error: { message: 'SVG generation failed' }
        });
      }
      return Promise.resolve({
        success: true,
        result: { svg: '<svg>test</svg>', designRationale: 'test' }
      });
    });
    
    const orchestrator = new MultiAgentOrchestrator(
      mockBrief,
      {
        retryFailedAgents: true,
        maxRetries: 2,
        initialRetryDelayMs: 10 // Short delay for tests
      }
    );
    
    // Execute the orchestrator
    const result = await orchestrator.execute();
    
    // Check that the orchestrator completed successfully despite the failure
    expect(result.success).toBe(true);
    
    // Check that the agent was executed twice (original + retry)
    expect(SVGGenerationAgent.prototype.execute).toHaveBeenCalledTimes(2);
  });
  
  it('should handle critical stage failures', async () => {
    // Mock SVGGenerationAgent to always fail
    SVGGenerationAgent.prototype.execute = vi.fn().mockResolvedValue({
      success: false,
      error: { message: 'SVG generation failed' }
    });
    
    const orchestrator = new MultiAgentOrchestrator(
      mockBrief,
      {
        retryFailedAgents: true,
        maxRetries: 1
      }
    );
    
    // Execute the orchestrator
    const result = await orchestrator.execute();
    
    // Check that the orchestrator failed
    expect(result.success).toBe(false);
    
    // Check that error information is provided
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    
    // Should have tried to execute twice (original + retry)
    expect(SVGGenerationAgent.prototype.execute).toHaveBeenCalledTimes(2);
  });
  
  it('should support aborting execution', async () => {
    const abortController = {
      signal: { aborted: false, reason: '' },
      abort: function(reason: string) {
        this.signal.aborted = true;
        this.signal.reason = reason;
      }
    };
    
    // Mock global AbortController
    global.AbortController = vi.fn().mockImplementation(() => abortController);
    
    const orchestrator = new MultiAgentOrchestrator(mockBrief);
    
    // Start execution
    const executePromise = orchestrator.execute();
    
    // Abort in the middle
    orchestrator.abort('User requested cancellation');
    
    // Should complete with failure
    const result = await executePromise;
    expect(result.success).toBe(false);
    expect(result.errors?.some(e => e.message.includes('Execution aborted'))).toBe(true);
  });
  
  it('should execute fallback for non-critical stages when allowed', async () => {
    // Mock GuidelineAgent to fail
    GuidelineAgent.prototype.execute = vi.fn().mockResolvedValue({
      success: false,
      error: { message: 'Guideline generation failed' }
    });
    
    // Set up orchestrator with options that allow fallbacks
    const orchestrator = new MultiAgentOrchestrator(
      mockBrief,
      {
        retryFailedAgents: true,
        maxRetries: 1
      }
    );
    
    // Execute the orchestrator
    const result = await orchestrator.execute();
    
    // The orchestrator should still succeed because guideline is non-critical with fallback
    expect(result.success).toBe(true);
    
    // GuidelineAgent execute should be called twice (original + retry)
    expect(GuidelineAgent.prototype.execute).toHaveBeenCalledTimes(2);
  });
  
  it('should execute agents in parallel when specified', async () => {
    // Modify execution plan to set brand guidelines and packaging as parallel
    const originalCreateExecutionPlan = MultiAgentOrchestrator.prototype['createExecutionPlan'];
    MultiAgentOrchestrator.prototype['createExecutionPlan'] = function() {
      const plan = originalCreateExecutionPlan.call(this);
      
      // Modify the plan to make the last two stages parallel
      const lastStage = plan.stages[plan.stages.length - 1];
      lastStage.agents = ['guideline', 'packaging'];
      lastStage.parallel = true;
      
      return plan;
    };
    
    const orchestrator = new MultiAgentOrchestrator(mockBrief);
    
    // Execute the orchestrator
    await orchestrator.execute();
    
    // Both agents should have been executed
    expect(GuidelineAgent.prototype.execute).toHaveBeenCalled();
    expect(PackagingAgent.prototype.execute).toHaveBeenCalled();
    
    // Since they run in parallel, we can't reliably check execution order
    // But we can verify that both were executed successfully
    
    // Restore original implementation
    MultiAgentOrchestrator.prototype['createExecutionPlan'] = originalCreateExecutionPlan;
  });
});