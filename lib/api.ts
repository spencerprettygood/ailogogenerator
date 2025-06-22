// This file will contain functions for interacting with the backend API.
import { LogoGenerationOptions } from './hooks/use-logo-generation';

// Example function (to be implemented)
// export async function generateLogoAPI(brief: any): Promise<any> {
//   const response = await fetch('/api/generate-logo', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(brief),
//   });
//   if (!response.ok) {
//     throw new Error('Failed to generate logo');
//   }
//   return response.json();
// }

export class LogoGeneratorAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async generateLogo(
    brief: string,
    files?: File[],
    options?: LogoGenerationOptions
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      // Determine if we should use FormData or JSON based on if files are present
      if (files && files.length > 0) {
        // Use FormData approach when files are present
        const formData = new FormData();
        formData.append('brief', brief);
        
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        
        // Add industry if specified
        if (options?.industry) {
          formData.append('industry', options.industry);
        }
        
        // Add animation options if specified
        if (options?.includeAnimations) {
          formData.append('includeAnimations', 'true');
          
          if (options.animationOptions) {
            formData.append('animationOptions', JSON.stringify(options.animationOptions));
          }
        }
        
        // Add uniqueness analysis if requested
        if (options?.includeUniquenessAnalysis) {
          formData.append('includeUniquenessAnalysis', 'true');
        }
        
        // Send as FormData
        const response = await fetch(`${this.baseUrl}/api/generate-logo`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new APIError(`Generation failed: ${response.status} ${errorText}`, response.status);
        }
        
        if (!response.body) {
          throw new APIError('No response body received', 500);
        }
        
        return response.body;
      } else {
        // No files, use JSON approach for better caching
        const response = await fetch(`${this.baseUrl}/api/generate-logo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: brief,
            industry: options?.industry,
            includeAnimations: options?.includeAnimations || false,
            animationOptions: options?.animationOptions,
            includeUniquenessAnalysis: options?.includeUniquenessAnalysis || false,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new APIError(`Generation failed: ${response.status} ${errorText}`, response.status);
        }
        
        if (!response.body) {
          throw new APIError('No response body received', 500);
        }
        
        return response.body;
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('API request error:', error);
      throw new APIError(
        error instanceof Error ? error.message : 'Failed to generate logo',
        500
      );
    }
  }

  async downloadPackage(sessionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/download?session=${sessionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(`Download failed: ${response.status} ${errorText}`, response.status);
    }

    return response.blob();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class APIError extends Error {
  public status: number; // Ensure status is a public property
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status; // Initialize status
  }
}

// Singleton instance
export const logoAPI = new LogoGeneratorAPI();

// Ensure this file is treated as a module by adding an export statement if nothing else is exported.
// If there are other exports, this is not strictly necessary but doesn't hurt.
export {};
