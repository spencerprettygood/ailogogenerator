/**
 * Utility for capturing screenshots in the browser
 */

/**
 * Captures a screenshot of an HTML element as a base64-encoded PNG image
 *
 * @param element The HTML element to capture
 * @returns Promise that resolves with the base64-encoded PNG image
 */
export async function captureElementScreenshot(element: HTMLElement): Promise<string | null> {
  try {
    // Import html2canvas dynamically to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;

    // Capture the element
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: window.devicePixelRatio,
    });

    // Convert to base64 PNG
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    return null;
  }
}

/**
 * Captures a screenshot of the current viewport as a base64-encoded PNG image
 *
 * @returns Promise that resolves with the base64-encoded PNG image
 */
export async function captureViewportScreenshot(): Promise<string | null> {
  try {
    if (typeof document === 'undefined') return null;

    // Import html2canvas dynamically to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;

    // Capture the viewport
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: window.devicePixelRatio,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    // Convert to base64 PNG
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture viewport screenshot:', error);
    return null;
  }
}

/**
 * Gets the current browser information for debugging purposes
 *
 * @returns Object containing browser information
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'SSR',
      windowWidth: 0,
      windowHeight: 0,
      url: '',
    };
  }

  return {
    userAgent: window.navigator.userAgent,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    url: window.location.href,
  };
}
