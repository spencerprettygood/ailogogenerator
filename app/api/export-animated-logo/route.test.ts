import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { storeFile } from '@/lib/utils/file-storage';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/utils/file-storage', () => ({
  storeFile: vi.fn()
}));

// Sample SVG for testing
const sampleSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#4f46e5" />
</svg>
`;

// Sample CSS for testing
const sampleCss = `
.animated-logo {
  animation: fadeIn 1s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

// Sample JS for testing
const sampleJs = `
document.querySelector('svg').addEventListener('click', function() {
  this.classList.toggle('active');
});
`;

describe('Export Animated Logo API', () => {
  // Mock NextRequest
  const createMockRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body)
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when SVG content is missing', async () => {
    const req = createMockRequest({ 
      format: 'svg',
      css: sampleCss,
      js: sampleJs
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('SVG content is required');
  });

  it('should return 400 when export format is unsupported', async () => {
    const req = createMockRequest({ 
      svg: sampleSvg,
      format: 'unsupported_format'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Unsupported export format');
  });

  it('should successfully export SVG format and return file URL', async () => {
    // Mock storeFile to return a file ID
    vi.mocked(storeFile).mockReturnValue('abc123');

    const req = createMockRequest({ 
      svg: sampleSvg,
      css: sampleCss,
      js: sampleJs,
      format: 'svg'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileUrl).toBe('/api/download?file=abc123');
    expect(data.format).toBe('svg');
    
    // Verify storeFile was called correctly
    expect(storeFile).toHaveBeenCalledWith('animated-logo.svg', expect.any(Buffer));
    
    // Verify the SVG content includes embedded CSS and JS
    const storedContent = vi.mocked(storeFile).mock.calls[0]?.[1]?.toString();
    expect(storedContent).toContain(sampleSvg.trim());
    expect(storedContent).toContain(sampleCss.trim());
    expect(storedContent).toContain(sampleJs.trim());
  });

  it('should successfully export HTML format and return file URL', async () => {
    // Mock storeFile to return a file ID
    vi.mocked(storeFile).mockReturnValue('def456');

    const req = createMockRequest({ 
      svg: sampleSvg,
      css: sampleCss,
      js: sampleJs,
      format: 'html'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileUrl).toBe('/api/download?file=def456');
    expect(data.format).toBe('html');
    
    // Verify storeFile was called correctly
    expect(storeFile).toHaveBeenCalledWith('animated-logo.html', expect.any(Buffer));
    
    // Verify the HTML content includes the SVG, CSS, and JS
    const storedContent = vi.mocked(storeFile).mock.calls[0]?.[1]?.toString();
    expect(storedContent).toContain('<!DOCTYPE html>');
    expect(storedContent).toContain(sampleSvg.trim());
    expect(storedContent).toContain(sampleCss.trim());
    expect(storedContent).toContain(sampleJs.trim());
  });

  it('should return 501 for GIF export (not implemented)', async () => {
    const req = createMockRequest({ 
      svg: sampleSvg,
      css: sampleCss,
      js: sampleJs,
      format: 'gif'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(501);
    expect(data.error).toContain('GIF export is not implemented');
  });

  it('should return 501 for MP4 export (not implemented)', async () => {
    const req = createMockRequest({ 
      svg: sampleSvg,
      css: sampleCss,
      js: sampleJs,
      format: 'mp4'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(501);
    expect(data.error).toContain('MP4 export is not implemented');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock storeFile to throw an error
    vi.mocked(storeFile).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const req = createMockRequest({ 
      svg: sampleSvg,
      css: sampleCss,
      js: sampleJs,
      format: 'svg'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toContain('Internal server error during animation export');
  });

  it('should handle SVG without CSS or JS', async () => {
    // Mock storeFile to return a file ID
    vi.mocked(storeFile).mockReturnValue('ghi789');

    const req = createMockRequest({ 
      svg: sampleSvg,
      format: 'svg'
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify storeFile was called correctly
    expect(storeFile).toHaveBeenCalledWith('animated-logo.svg', expect.any(Buffer));
    
    // Verify the SVG content is unchanged when no CSS/JS is provided
    const storedContent = vi.mocked(storeFile).mock.calls[0]?.[1]?.toString();
    expect(storedContent).toBe(sampleSvg);
  });
});