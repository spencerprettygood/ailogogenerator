/**
 * Helper functions for clipboard operations
 */

/**
 * Copy text to clipboard with fallback for browsers that don't support clipboard API
 * 
 * @param text The text to copy to clipboard
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Check if Clipboard API is available
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API error:', err);
      return fallbackCopyToClipboard(text);
    }
  } else {
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback method for copying text to clipboard using textarea element
 * 
 * @param text The text to copy to clipboard
 * @returns true if successful, false otherwise
 */
function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Create textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Execute copy command
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Fallback clipboard error:', err);
    return false;
  }
}

/**
 * Check if clipboard API is supported in the current browser
 * 
 * @returns boolean indicating if Clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  );
}