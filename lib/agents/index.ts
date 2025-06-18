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
  EnhancedSVGGenerationAgent,
  IndustryTemplateSVGAgent,
  SVGValidationAgent,
  SVGDesignValidationAgent,
  SVGAccessibilityAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent,
  IndustryAnalysisAgent,
  AnimationAgent
} from './specialized';

// Register all agent types
agentRegistry.register('requirements', RequirementsAgent);
agentRegistry.register('moodboard', MoodboardAgent);
agentRegistry.register('selection', SelectionAgent);
agentRegistry.register('svgGeneration', SVGGenerationAgent);
agentRegistry.register('enhancedSvgGeneration', EnhancedSVGGenerationAgent);
agentRegistry.register('industryTemplateSvg', IndustryTemplateSVGAgent);
agentRegistry.register('svgValidation', SVGValidationAgent);
agentRegistry.register('svgDesignValidation', SVGDesignValidationAgent);
agentRegistry.register('svgAccessibility', SVGAccessibilityAgent);
agentRegistry.register('variantGeneration', VariantGenerationAgent);
agentRegistry.register('guideline', GuidelineAgent);
agentRegistry.register('packaging', PackagingAgent);
agentRegistry.register('industryAnalysis', IndustryAnalysisAgent);
agentRegistry.register('animation', AnimationAgent);