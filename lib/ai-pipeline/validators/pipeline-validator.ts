import { GenerationResult } from '../../types';
import { PipelineResult, PipelineOptions } from '../pipeline-orchestrator';
import { StageAOutput, validateStageAOutput } from '../stages/stage-a-distillation';
import { StageBOutput, validateStageBOutput } from '../stages/stage-b-moodboard';
import { StageCOutput, validateStageCOutput } from '../stages/stage-c-selection';
import { StageDOutput, validateStageDOutput } from '../stages/stage-d-generation';

// Validator for pipeline input options
export function validatePipelineOptions(options: PipelineOptions): string | null {
  if (!options) {
    return 'Pipeline options are required';
  }
  
  if (!options.brief) {
    return 'Logo brief is required';
  }
  
  if (!options.brief.prompt || typeof options.brief.prompt !== 'string') {
    return 'Logo brief must include a prompt string';
  }
  
  if (options.brief.prompt.length < 10) {
    return 'Logo brief prompt must be at least 10 characters';
  }
  
  if (options.manualConceptSelection !== undefined) {
    if (typeof options.manualConceptSelection !== 'number' || 
        options.manualConceptSelection < 0 || 
        options.manualConceptSelection > 2) {
      return 'Manual concept selection must be 0, 1, or 2';
    }
  }
  
  return null; // No validation errors
}

// Validator for individual stage outputs
export function validateStageOutput(stage: string, output: unknown): string {
  if (!output) {
    return `Stage ${stage} output is undefined or null`;
  }
  
  switch (stage) {
    case 'A':
    case 'stageA':
      return validateStageAOutput(output as StageAOutput);
      
    case 'B':
    case 'stageB':
      return validateStageBOutput(output as StageBOutput);
      
    case 'C':
    case 'stageC':
      return validateStageCOutput(output as StageCOutput);
      
    case 'D':
    case 'stageD':
      return validateStageDOutput(output as StageDOutput);
      
    default:
      return 'valid'; // Skip validation for other stages for now
  }
}

// Validator for the final pipeline result
export function validatePipelineResult(result: PipelineResult): string | null {
  if (!result) {
    return 'Pipeline result is undefined or null';
  }
  
  if (result.success && !result.result) {
    return 'Successful pipeline result must include a result object';
  }
  
  if (!result.success && !result.error) {
    return 'Failed pipeline result must include an error object';
  }
  
  if (!result.progress) {
    return 'Pipeline result must include progress information';
  }
  
  if (result.success) {
    const generationResult = result.result as GenerationResult;
    
    if (!generationResult.logoSvg) {
      return 'Successful result must include logoSvg';
    }
    
    if (!generationResult.downloadUrl) {
      return 'Successful result must include downloadUrl';
    }
  }
  
  return null; // No validation errors
}

// Helper function to create a standardized error response
export function createValidationErrorResponse(message: string): PipelineResult {
  return {
    success: false,
    progress: {
      currentStage: 'validation',
      stageProgress: 0,
      overallProgress: 0,
      statusMessage: 'Validation failed',
      error: {
        stage: 'validation',
        message
      }
    },
    error: {
      stage: 'validation',
      message
    }
  };
}