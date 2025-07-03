// Vitest setup file to configure jsdom environment and global DOM APIs
// Use Vitest's jsdom environment
(global as any).window = globalThis.window;
(global as any).document = globalThis.document;
(global as any).navigator = globalThis.navigator;
(global as any).Element = window.Element;
(global as any).Node = window.Node;
(global as any).DOMParser = window.DOMParser;
(global as any).XMLSerializer = window.XMLSerializer;

// Provide animate() in Element.prototype for web-animations-api support
if (!window.Element.prototype.animate) {
  window.Element.prototype.animate = function() {
    return { finished: Promise.resolve() } as any;
  };
}

// Ensure global.btoa and atob exist
if (!(global as any).btoa) {
  (global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (!(global as any).atob) {
  (global as any).atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
}
