import { distillRequirements, StageAInput, StageAOutput } from './stages/stage-a-distillation';
import { generateMoodboard, StageBInput, StageBOutput } from './stages/stage-b-moodboard';
import { selectDirection, StageCInput, StageCOutput } from './stages/stage-c-selection';
import { generateSvgLogo, StageDInput, StageDOutput } from './stages/stage-d-generation';
import { validateAndRepairSvg, StageEInput } from './stages/stage-e-validation';
import { generateVariants, StageFInput, StageFOutput } from './stages/stage-f-variants';
import { generateBrandGuidelines, StageGInput, StageGOutput } from './stages/stage-g-guidelines';
import { packageAssets, StageHInput, StageHOutput } from './stages/stage-h-packaging';
import { LogoBrief, GenerationResult } from '../types';

// Types for pipeline
export interface PipelineOptions {
  brief: LogoBrief;
  skipStages?: string[];
  debugMode?: boolean;
  manualConceptSelection?: number;
}

export interface PipelineProgress {
  currentStage: string;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
  error?: {
    stage: string;
    message: string;
    details?: unknown;
  };
}

export interface PipelineResult {
  success: boolean;
  result?: GenerationResult;
  progress: PipelineProgress;
  logs?: string[];
  stageOutputs?: Record<string, unknown>;
  error?: {
    stage: string;
    message: string;
    details?: unknown;
  };
  executionTime?: {
    total: number;
    stages: Record<string, number>;
  };
  tokensUsed?: {
    total: number;
    stages: Record<string, number>;
  };
}

// Progress update callback type
type ProgressCallback = (progress: PipelineProgress) => void;

// Pipeline orchestrator class
export class LogoGenerationPipeline {
  private options: PipelineOptions;
  private progressCallback?: ProgressCallback;
  private debugMode: boolean;
  private logs: string[] = [];
  private stageOutputs: Record<string, unknown> = {};
  private executionTime: Record<string, number> = {};
  private tokensUsed: Record<string, number> = {};
  private progress: PipelineProgress = {
    currentStage: 'initializing',
    stageProgress: 0,
    overallProgress: 0,
    statusMessage: 'Initializing logo generation pipeline'
  };

  constructor(options: PipelineOptions, progressCallback?: ProgressCallback) {
    this.options = options;
    this.progressCallback = progressCallback;
    this.debugMode = options.debugMode || process.env.NODE_ENV === 'development';
  }

  // Main pipeline execution method
  public async execute(): Promise<PipelineResult> {
    const startTime = Date.now();
    
    try {
      // Stage A: Requirement Distillation
      if (!this.isStageSkipped('A')) {
        await this.executeStageA();
      } else {
        this.log('Skipping Stage A: Requirement Distillation');
      }

      // Stage B: Moodboard Generation
      if (!this.isStageSkipped('B')) {
        await this.executeStageB();
      } else {
        this.log('Skipping Stage B: Moodboard Generation');
      }

      // Stage C: Direction Selection
      if (!this.isStageSkipped('C')) {
        await this.executeStageC();
      } else {
        this.log('Skipping Stage C: Direction Selection');
      }

      // Stage D: SVG Logo Generation
      if (!this.isStageSkipped('D')) {
        await this.executeStageD();
      } else {
        this.log('Skipping Stage D: SVG Logo Generation');
      }

      // Stage E: SVG Validation & Repair
      if (!this.isStageSkipped('E')) {
        await this.executeStageE();
      } else {
        this.log('Skipping Stage E: SVG Validation & Repair');
      }

      // Stage F: Variant Generation
      if (!this.isStageSkipped('F')) {
        await this.executeStageF();
      } else {
        this.log('Skipping Stage F: Variant Generation');
      }

      // Stage G: Brand Guidelines
      if (!this.isStageSkipped('G')) {
        await this.executeStageG();
      } else {
        this.log('Skipping Stage G: Brand Guidelines');
      }

      // Stage H: Packaging & Delivery
      if (!this.isStageSkipped('H')) {
        await this.executeStageH();
      } else {
        this.log('Skipping Stage H: Packaging & Delivery');
      }

      // Create final result
      const totalExecutionTime = Date.now() - startTime;
      const totalTokensUsed = Object.values(this.tokensUsed).reduce((acc, val) => acc + val, 0);
      
      // Update final progress
      this.updateProgress('complete', 100, 100, 'Logo generation complete');
      
      const packageOutput = this.stageOutputs.stageH as StageHOutput;
      const svgOutput = this.stageOutputs.stageD as StageDOutput;
      const variantsOutput = this.stageOutputs.stageF as StageFOutput;
      
      const result: GenerationResult = {
        success: true,
        logoSvg: svgOutput?.result?.svg,
        logoPngUrls: {
          size256: '/api/download?file=logo-256.png',
          size512: '/api/download?file=logo-512.png',
          size1024: '/api/download?file=logo-1024.png'
        },
        monochromeVariants: {
          blackSvg: variantsOutput?.variants?.monochrome.black || '',
          whiteSvg: variantsOutput?.variants?.monochrome.white || ''
        },
        faviconIcoUrl: '/api/download?file=favicon.ico',
        brandGuidelinesUrl: '/api/download?file=brand-guidelines.html',
        downloadUrl: packageOutput?.fileName
          ? `/api/download?file=${packageOutput.fileName}`
          : undefined
      };
      
      return {
        success: true,
        result,
        progress: this.progress,
        logs: this.debugMode ? this.logs : undefined,
        stageOutputs: this.debugMode ? this.stageOutputs : undefined,
        executionTime: {
          total: totalExecutionTime,
          stages: this.executionTime
        },
        tokensUsed: {
          total: totalTokensUsed,
          stages: this.tokensUsed
        }
      };
      
    } catch (error) {
      // Handle pipeline errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStage = this.progress.currentStage;
      
      this.log(`ERROR in stage ${errorStage}: ${errorMessage}`);
      
      // Update progress with error
      this.updateProgress(
        errorStage,
        0,
        this.progress.overallProgress,
        `Error in ${errorStage}: ${errorMessage}`,
        {
          stage: errorStage,
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        }
      );
      
      return {
        success: false,
        progress: this.progress,
        logs: this.logs,
        stageOutputs: this.stageOutputs,
        error: {
          stage: errorStage,
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        },
        executionTime: {
          total: Date.now() - startTime,
          stages: this.executionTime
        },
        tokensUsed: {
          total: Object.values(this.tokensUsed).reduce((acc, val) => acc + val, 0),
          stages: this.tokensUsed
        }
      };
    }
  }

  // Individual stage execution methods
  private async executeStageA(): Promise<void> {
    const stageName = 'stageA';
    const stageStartTime = Date.now();
    
    this.updateProgress('A', 0, 0, 'Analyzing brand requirements...');
    this.log('Starting Stage A: Requirement Distillation');
    
    const input: StageAInput = {
      brief: this.options.brief.prompt,
      imageDescriptions: this.options.brief.image_uploads?.map(file => `Image file: ${file.name}`)
    };
    
    const output = await distillRequirements(input.brief, input.imageDescriptions);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage A failed: ${output.error?.message}`);
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    this.tokensUsed[stageName] = output.tokensUsed || 0;
    
    this.updateProgress('A', 100, 12.5, 'Brand requirements analyzed');
    this.log('Completed Stage A: Requirement Distillation');
  }

  private async executeStageB(): Promise<void> {
    const stageName = 'stageB';
    const stageStartTime = Date.now();
    
    this.updateProgress('B', 0, 12.5, 'Generating design concepts...');
    this.log('Starting Stage B: Moodboard Generation');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage B requires output from Stage A');
    }
    
    const input: StageBInput = {
      designSpec: stageAOutput.designSpec
    };
    
    const output = await generateMoodboard(input.designSpec);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage B failed: ${output.error?.message}`);
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    this.tokensUsed[stageName] = output.tokensUsed || 0;
    
    this.updateProgress('B', 100, 25, 'Design concepts generated');
    this.log('Completed Stage B: Moodboard Generation');
  }

  private async executeStageC(): Promise<void> {
    const stageName = 'stageC';
    const stageStartTime = Date.now();
    
    this.updateProgress('C', 0, 25, 'Selecting best design concept...');
    this.log('Starting Stage C: Direction Selection');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageBOutput = this.stageOutputs.stageB as StageBOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage C requires output from Stage A');
    }
    
    if (!stageBOutput || !stageBOutput.moodboard) {
      throw new Error('Stage C requires output from Stage B');
    }
    
    // Check if there's a manual selection
    if (this.options.manualConceptSelection !== undefined) {
      const index = this.options.manualConceptSelection;
      const concepts = stageBOutput.moodboard.concepts;
      
      if (index < 0 || index >= concepts.length) {
        throw new Error(`Invalid manual concept selection index: ${index}`);
      }
      
      // Create a manual selection result
      const manualOutput: StageCOutput = {
        success: true,
        selection: {
          selectedConcept: concepts[index],
          selectionRationale: "Manually selected by user.",
          score: 100
        },
        tokensUsed: 0,
        processingTime: 0
      };
      
      this.stageOutputs[stageName] = manualOutput;
      this.log(`Using manually selected concept ${index}`);
    } else {
      // Perform AI selection
      const input: StageCInput = {
        designSpec: stageAOutput.designSpec,
        concepts: stageBOutput.moodboard.concepts
      };
      
      const output = await selectDirection(input);
      this.stageOutputs[stageName] = output;
      
      if (!output.success) {
        throw new Error(`Stage C failed: ${output.error?.message}`);
      }
      
      this.tokensUsed[stageName] = output.tokensUsed || 0;
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    
    this.updateProgress('C', 100, 37.5, 'Best design concept selected');
    this.log('Completed Stage C: Direction Selection');
  }

  private async executeStageD(): Promise<void> {
    const stageName = 'stageD';
    const stageStartTime = Date.now();
    
    this.updateProgress('D', 0, 37.5, 'Generating SVG logo...');
    this.log('Starting Stage D: SVG Logo Generation');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageCOutput = this.stageOutputs.stageC as StageCOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage D requires output from Stage A');
    }
    
    if (!stageCOutput || !stageCOutput.selection) {
      throw new Error('Stage D requires output from Stage C');
    }
    
    const input: StageDInput = {
      designSpec: stageAOutput.designSpec,
      selectedConcept: stageCOutput.selection.selectedConcept
    };
    
    const output = await generateSvgLogo(input);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage D failed: ${output.error?.message}`);
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    this.tokensUsed[stageName] = output.tokensUsed || 0;
    
    this.updateProgress('D', 100, 50, 'SVG logo generated');
    this.log('Completed Stage D: SVG Logo Generation');
  }

  private async executeStageE(): Promise<void> {
    const stageName = 'stageE';
    const stageStartTime = Date.now();
    
    this.updateProgress('E', 0, 50, 'Validating and optimizing SVG...');
    this.log('Starting Stage E: SVG Validation & Repair');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageDOutput = this.stageOutputs.stageD as StageDOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage E requires output from Stage A');
    }
    
    if (!stageDOutput || !stageDOutput.result) {
      throw new Error('Stage E requires output from Stage D');
    }
    
    const input: StageEInput = {
      svg: stageDOutput.result.svg,
      brandName: stageAOutput.designSpec.brand_name,
      repair: true,
      optimize: true
    };
    
    const output = await validateAndRepairSvg(input);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage E failed: ${output.error?.message}`);
    }
    
    // Update the SVG in stage D output with the validated/optimized version
    if (output.result && stageDOutput.result) {
      stageDOutput.result.svg = output.result.svg;
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    
    this.updateProgress('E', 100, 62.5, 'SVG validated and optimized');
    this.log('Completed Stage E: SVG Validation & Repair');
  }

  private async executeStageF(): Promise<void> {
    const stageName = 'stageF';
    const stageStartTime = Date.now();
    
    this.updateProgress('F', 0, 62.5, 'Generating logo variants...');
    this.log('Starting Stage F: Variant Generation');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageDOutput = this.stageOutputs.stageD as StageDOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage F requires output from Stage A');
    }
    
    if (!stageDOutput || !stageDOutput.result) {
      throw new Error('Stage F requires output from Stage D');
    }
    
    const input: StageFInput = {
      svg: stageDOutput.result.svg,
      designSpec: stageAOutput.designSpec,
      brandName: stageAOutput.designSpec.brand_name
    };
    
    const output = await generateVariants(input);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage F failed: ${output.error?.message}`);
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    this.tokensUsed[stageName] = output.tokensUsed || 0;
    
    this.updateProgress('F', 100, 75, 'Logo variants generated');
    this.log('Completed Stage F: Variant Generation');
  }

  private async executeStageG(): Promise<void> {
    const stageName = 'stageG';
    const stageStartTime = Date.now();
    
    this.updateProgress('G', 0, 75, 'Creating brand guidelines...');
    this.log('Starting Stage G: Brand Guidelines');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageCOutput = this.stageOutputs.stageC as StageCOutput;
    const stageDOutput = this.stageOutputs.stageD as StageDOutput;
    const stageFOutput = this.stageOutputs.stageF as StageFOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage G requires output from Stage A');
    }
    
    if (!stageCOutput || !stageCOutput.selection) {
      throw new Error('Stage G requires output from Stage C');
    }
    
    if (!stageDOutput || !stageDOutput.result) {
      throw new Error('Stage G requires output from Stage D');
    }
    
    if (!stageFOutput || !stageFOutput.variants) {
      throw new Error('Stage G requires output from Stage F');
    }
    
    const input: StageGInput = {
      variants: stageFOutput.variants,
      designSpec: stageAOutput.designSpec
    };
    
    const output = await generateBrandGuidelines(input);
    this.stageOutputs[stageName] = output;

    this.executionTime[stageName] = Date.now() - stageStartTime;

    this.updateProgress('G', 100, 87.5, 'Brand guidelines created');
    this.log('Completed Stage G: Brand Guidelines');
  }

  private async executeStageH(): Promise<void> {
    const stageName = 'stageH';
    const stageStartTime = Date.now();
    
    this.updateProgress('H', 0, 87.5, 'Packaging assets for delivery...');
    this.log('Starting Stage H: Packaging & Delivery');
    
    const stageAOutput = this.stageOutputs.stageA as StageAOutput;
    const stageDOutput = this.stageOutputs.stageD as StageDOutput;
    const stageFOutput = this.stageOutputs.stageF as StageFOutput;
    const stageGOutput = this.stageOutputs.stageG as StageGOutput;
    
    if (!stageAOutput || !stageAOutput.designSpec) {
      throw new Error('Stage H requires output from Stage A');
    }
    
    if (!stageDOutput || !stageDOutput.result) {
      throw new Error('Stage H requires output from Stage D');
    }
    
    if (!stageFOutput || !stageFOutput.variants) {
      throw new Error('Stage H requires output from Stage F');
    }
    
    if (!stageGOutput || !stageGOutput.html) {
      throw new Error('Stage H requires output from Stage G');
    }
    
    const input: StageHInput = {
      brandName: stageAOutput.designSpec.brand_name,
      svg: stageDOutput.result.svg,
      pngVariants: stageFOutput.variants.pngVariants,
      monochrome: stageFOutput.variants.monochrome,
      favicon: {
        svg: stageFOutput.variants.favicon.svg,
        ico: stageFOutput.variants.favicon.ico
      },
      guidelines: {
        html: stageGOutput.html,
        plainText: '' // Optionally generate plain text from HTML if needed
      }
    };
    
    const output = await packageAssets(input);
    this.stageOutputs[stageName] = output;
    
    if (!output.success) {
      throw new Error(`Stage H failed: ${output.error?.message}`);
    }
    
    this.executionTime[stageName] = Date.now() - stageStartTime;
    
    this.updateProgress('H', 100, 100, 'Assets packaged and ready for delivery');
    this.log('Completed Stage H: Packaging & Delivery');
  }

  // Helper methods
  private isStageSkipped(stage: string): boolean {
    return this.options.skipStages?.includes(stage) || false;
  }

  private updateProgress(
    stage: string,
    stageProgress: number,
    overallProgress: number,
    statusMessage: string,
    error?: { stage: string; message: string; details?: unknown }
  ): void {
    this.progress = {
      currentStage: stage,
      stageProgress,
      overallProgress,
      statusMessage,
      error
    };
    
    if (this.progressCallback) {
      this.progressCallback(this.progress);
    }
  }

  private log(message: string): void {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      this.logs.push(`[${timestamp}] ${message}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Logo Pipeline] ${message}`);
      }
    }
  }
}

// Utility function to create and execute pipeline
export async function generateLogo(
  options: PipelineOptions,
  progressCallback?: ProgressCallback
): Promise<PipelineResult> {
  const pipeline = new LogoGenerationPipeline(options, progressCallback);
  return await pipeline.execute();
}