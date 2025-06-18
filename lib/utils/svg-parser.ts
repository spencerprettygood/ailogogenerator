import { SVGElement } from '../types-customization';

/**
 * Parses SVG code into a structured format for manipulation
 * @param svgCode Raw SVG code string
 * @returns Array of structured SVG elements
 */
export function parseSvgToElements(svgCode: string): { 
  elements: SVGElement[], 
  viewBox: string,
  svgAttrs: Record<string, string | number>
} {
  // Create a temporary DOM element to parse SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgCode, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  if (!svgElement) {
    throw new Error('Invalid SVG: No root SVG element found');
  }

  // Extract SVG root attributes
  const svgAttrs: Record<string, string | number> = {};
  Array.from(svgElement.attributes).forEach(attr => {
    svgAttrs[attr.name] = attr.value;
  });

  // Get viewBox for positioning reference
  const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';

  // Extract elements recursively
  const elements: SVGElement[] = [];
  processChildren(svgElement, elements);

  return { elements, viewBox, svgAttrs };
}

/**
 * Process child elements recursively
 */
function processChildren(parent: Element, elements: SVGElement[], parentId: string = '') {
  Array.from(parent.children).forEach((child, index) => {
    const tagName = child.tagName.toLowerCase();
    
    // Skip unsupported elements
    if (!isSupported(tagName)) return;
    
    // Create element ID if not present
    const id = child.id || `${tagName}_${parentId ? `${parentId}_` : ''}${index}`;
    
    // Collect element attributes
    const attributes: Record<string, string | number> = {};
    Array.from(child.attributes).forEach(attr => {
      // Skip the id attribute as we're handling it separately
      if (attr.name !== 'id') {
        attributes[attr.name] = attr.value;
      }
    });
    
    // Add id attribute
    attributes['id'] = id;
    
    // Create the element object
    const element: SVGElement = {
      id,
      type: tagName as SVGElement['type'],
      attributes,
    };
    
    // Handle text content
    if (tagName === 'text') {
      element.content = child.textContent || '';
    }
    
    elements.push(element);
    
    // Process children recursively if this is a group
    if (tagName === 'g') {
      processChildren(child, elements, id);
    }
  });
}

/**
 * Check if element type is supported
 */
function isSupported(tagName: string): boolean {
  const supportedElements = [
    'path', 'rect', 'circle', 'text', 
    'polygon', 'ellipse', 'line', 'g'
  ];
  return supportedElements.includes(tagName);
}

/**
 * Serialize SVG elements back to SVG code
 */
export function elementsToSvgCode(
  elements: SVGElement[], 
  viewBox: string,
  svgAttrs: Record<string, string | number>
): string {
  // Create new SVG document
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // Set attributes
  svg.setAttribute('viewBox', viewBox);
  
  for (const [key, value] of Object.entries(svgAttrs)) {
    if (key !== 'xmlns' && key !== 'viewBox') { // Skip xmlns as it's added below
      svg.setAttribute(key, String(value));
    }
  }
  
  // Add required namespaces
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Build element hierarchy
  const elementMap = new Map<string, SVGElement>();
  const rootElements: SVGElement[] = [];
  
  // First pass: index all elements
  elements.forEach(el => {
    elementMap.set(el.id, el);
  });
  
  // Second pass: determine hierarchy
  elements.forEach(el => {
    if (el.attributes.parent) {
      // This is a child element
      const parentId = el.attributes.parent as string;
      const parent = elementMap.get(parentId);
      
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(el);
      } else {
        rootElements.push(el);
      }
    } else {
      // This is a root element
      rootElements.push(el);
    }
  });
  
  // Build SVG DOM from elements
  rootElements.forEach(el => {
    appendElementToSvg(svg, el);
  });
  
  // Get the SVG code as string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/**
 * Append element to SVG DOM
 */
function appendElementToSvg(parent: Element, element: SVGElement) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', element.type);
  
  // Set attributes
  for (const [key, value] of Object.entries(element.attributes)) {
    if (key !== 'parent') { // Skip our custom 'parent' attribute
      el.setAttribute(key, String(value));
    }
  }
  
  // Set content for text elements
  if (element.type === 'text' && element.content) {
    el.textContent = element.content;
  }
  
  // Append to parent
  parent.appendChild(el);
  
  // Process children if any
  if (element.children) {
    element.children.forEach(child => {
      appendElementToSvg(el, child);
    });
  }
}

/**
 * Updates a single SVG element in the elements array
 */
export function updateElement(
  elements: SVGElement[], 
  updatedElement: SVGElement
): SVGElement[] {
  return elements.map(element => 
    element.id === updatedElement.id ? updatedElement : element
  );
}

/**
 * Updates the color of an SVG element
 */
export function updateElementColor(
  element: SVGElement, 
  color: string
): SVGElement {
  const updatedElement = { ...element };
  const updatedAttributes = { ...element.attributes };
  
  // Update color attribute based on element type
  switch (element.type) {
    case 'path':
    case 'rect':
    case 'circle':
    case 'polygon':
    case 'ellipse':
    case 'line':
      // For shapes, update fill and/or stroke
      if (updatedAttributes.fill && updatedAttributes.fill !== 'none') {
        updatedAttributes.fill = color;
      }
      break;
    case 'text':
      // For text, update fill
      updatedAttributes.fill = color;
      break;
  }
  
  updatedElement.attributes = updatedAttributes;
  return updatedElement;
}

/**
 * Updates the position of an SVG element
 */
export function updateElementPosition(
  element: SVGElement,
  x: number,
  y: number
): SVGElement {
  const updatedElement = { ...element };
  const updatedAttributes = { ...element.attributes };
  
  // Update position attributes based on element type
  switch (element.type) {
    case 'rect':
    case 'image':
      updatedAttributes.x = x;
      updatedAttributes.y = y;
      break;
    case 'circle':
    case 'ellipse':
      updatedAttributes.cx = x;
      updatedAttributes.cy = y;
      break;
    case 'text':
      updatedAttributes.x = x;
      updatedAttributes.y = y;
      break;
    case 'path':
      // Paths require more complex transformations
      // For simplicity, use the transform attribute
      updatedAttributes.transform = `translate(${x},${y})`;
      break;
  }
  
  updatedElement.attributes = updatedAttributes;
  return updatedElement;
}

/**
 * Updates the typography of a text element
 */
export function updateElementTypography(
  element: SVGElement,
  fontFamily: string,
  fontSize: number,
  fontWeight: string | number
): SVGElement {
  if (element.type !== 'text') {
    return element;
  }
  
  const updatedElement = { ...element };
  const updatedAttributes = { ...element.attributes };
  
  updatedAttributes['font-family'] = fontFamily;
  updatedAttributes['font-size'] = fontSize;
  updatedAttributes['font-weight'] = fontWeight;
  
  updatedElement.attributes = updatedAttributes;
  return updatedElement;
}