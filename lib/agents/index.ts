// Base agent functionality
export { BaseAgent } from './base/base-agent';
export { agentRegistry } from './base/agent-registry';

// Specialized agents
export * from './specialized';

// Orchestrator
export * from './orchestrator';

// Register all agents with the registry
import { agentRegistry } from './base/agent-registry';
import {
  RequirementsAgent,
  MoodboardAgent,
  SelectionAgent,
  SVGGenerationAgent,
  SVGValidationAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent
} from './specialized';

// Register all agent types
agentRegistry.register('requirements', RequirementsAgent);
agentRegistry.register('moodboard', MoodboardAgent);
agentRegistry.register('selection', SelectionAgent);
agentRegistry.register('svgGeneration', SVGGenerationAgent);
agentRegistry.register('svgValidation', SVGValidationAgent);
agentRegistry.register('variantGeneration', VariantGenerationAgent);
agentRegistry.register('guideline', GuidelineAgent);
agentRegistry.register('packaging', PackagingAgent);