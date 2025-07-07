/**
 * Mock SVG utility for testing
 * Provides various SVG examples for different test scenarios
 */

/**
 * Simple SVG with basic shapes
 */
export const simpleSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
  <circle cx="50" cy="50" r="30" fill="red" />
</svg>
`;

/**
 * SVG with multiple paths for testing path-specific animations
 */
export const pathSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,10 C30,30 50,10 90,90" stroke="black" fill="none" />
  <path d="M90,10 C70,30 50,10 10,90" stroke="black" fill="none" />
</svg>
`;

/**
 * SVG with text for testing text animations
 */
export const textSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="50" font-family="Arial" font-size="12">Hello World</text>
</svg>
`;

/**
 * SVG with groups for testing group-based animations
 */
export const groupedSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g id="group1">
    <rect x="10" y="10" width="30" height="30" fill="blue" />
    <circle cx="25" cy="25" r="10" fill="white" />
  </g>
  <g id="group2">
    <rect x="60" y="10" width="30" height="30" fill="green" />
    <circle cx="75" cy="25" r="10" fill="white" />
  </g>
  <g id="group3">
    <rect x="10" y="60" width="30" height="30" fill="red" />
    <circle cx="25" cy="75" r="10" fill="white" />
  </g>
  <g id="group4">
    <rect x="60" y="60" width="30" height="30" fill="purple" />
    <circle cx="75" cy="75" r="10" fill="white" />
  </g>
</svg>
`;

/**
 * SVG with gradient fills for testing complex animations
 */
export const gradientSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="blue" />
      <stop offset="100%" stop-color="red" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="80" height="80" fill="url(#gradient)" />
</svg>
`;

/**
 * SVG with SMIL animations (to test removal/replacement)
 */
export const smilAnimatedSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue">
    <animate attributeName="fill" values="blue;red;blue" dur="3s" repeatCount="indefinite" />
    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite" />
  </rect>
</svg>
`;

/**
 * Complex logo-like SVG
 */
export const logoSvg = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3498db" />
      <stop offset="100%" stop-color="#8e44ad" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" />
  <path d="M60,80 L140,80 L100,140 Z" fill="white" />
  <text x="70" y="70" font-family="Arial" font-size="20" fill="white">LOGO</text>
</svg>
`;

/**
 * SVG with security issues (script tag, event handlers)
 */
export const insecureSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" onclick="alert('clicked')" />
  <script>alert('XSS Attack');</script>
  <a href="javascript:alert('link clicked')"><text x="20" y="50">Click me</text></a>
</svg>
`;

/**
 * Invalid SVG (malformed XML)
 */
export const invalidSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" 
  <circle cx="50" cy="50" r="30" fill="red">
</svg>
`;

/**
 * SVG missing viewBox
 */
export const missingViewBoxSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
</svg>
`;

/**
 * Overly complex SVG with many elements
 */
export const complexSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${Array(50)
    .fill(0)
    .map(
      (_, i) =>
        `<circle cx="${Math.random() * 100}" cy="${Math.random() * 100}" r="${Math.random() * 10}" fill="rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},${Math.random()})" />`
    )
    .join('\n')}
  ${Array(50)
    .fill(0)
    .map(
      (_, i) =>
        `<rect x="${Math.random() * 90}" y="${Math.random() * 90}" width="${Math.random() * 10}" height="${Math.random() * 10}" fill="rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},${Math.random()})" />`
    )
    .join('\n')}
</svg>
`;

/**
 * Returns a mock SVG document object for DOM manipulations in tests
 * Note: This is a simplified mock, not a full implementation
 */
export function createMockSVGDocument(svgString: string): Document {
  return {
    querySelector: (selector: string) => {
      if (selector === 'svg') {
        return {
          getAttribute: (name: string) => {
            if (name === 'viewBox') return '0 0 100 100';
            if (name === 'width') return '100';
            if (name === 'height') return '100';
            return null;
          },
          setAttribute: () => {},
          hasAttribute: (name: string) => name === 'viewBox',
          querySelectorAll: () => [],
        };
      }
      return null;
    },
    querySelectorAll: (selector: string) => {
      if (selector === 'path') {
        return [
          { setAttribute: () => {}, getAttribute: () => null },
          { setAttribute: () => {}, getAttribute: () => null },
        ];
      }
      return [];
    },
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
    }),
  } as unknown as Document;
}

/**
 * Mock DOMParser for tests
 */
export class MockDOMParser {
  parseFromString(svgString: string, mimeType: string): Document {
    return createMockSVGDocument(svgString);
  }
}

/**
 * Mock XMLSerializer for tests
 */
export class MockXMLSerializer {
  serializeToString(doc: Document): string {
    // Just return a simple SVG string
    return simpleSvg;
  }
}
