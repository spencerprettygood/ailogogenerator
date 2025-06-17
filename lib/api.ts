// This file will contain functions for interacting with the backend API.

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
    files?: File[]
  ): Promise<ReadableStream<Uint8Array>> {
    const formData = new FormData();
    formData.append('brief', brief);

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

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
