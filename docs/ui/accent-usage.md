# Accent Color Usage Guidelines

## Core Principles

The accent color `#ff4233` is a vibrant red that serves as a deliberate focal point in our monochrome design system. Its usage should be **strategic**, **minimal**, and **purposeful**. This document defines strict rules for when and how to use this accent color.

## Color Definition

| Format | Value | Usage Context |
|--------|-------|---------------|
| HEX | `#ff4233` | Primary definition, design assets |
| RGB | `rgb(255, 66, 51)` | CSS fallbacks |
| HSL | `hsl(5, 100%, 60%)` | CSS variables, animations |
| CMYK | `0, 74, 80, 0` | Print materials only |

### CSS Variable Implementation

```css
:root {
  --accent: 5 100% 60%;
  --accent-light: 5 100% 68%;
  --accent-dark: 5 74% 48%;
  --accent-foreground: 0 0% 100%;
}
```

## Permitted Usage

The accent color `#ff4233` may **ONLY** be used for:

1. **Primary Actions**
   - Call-to-action buttons (text only, not fill)
   - Form submission buttons (text only, not fill)
   - Primary navigation indicators (active state)
   
2. **Critical Indicators**
   - Error messages
   - Validation warnings
   - Progress completion
   - Notification badges (sparingly)
   
3. **Key Data Points**
   - Important statistics
   - Chart highlights (single data point only)
   - Selected states
   - Completion indicators
   
4. **Asymmetric Accents**
   - Corner details (max 5% of component area)
   - Offset borders (thin, 1px only)
   - Subtle decorative elements
   - Deliberate asymmetric focal points

## Prohibited Usage

The accent color `#ff4233` must **NEVER** be used for:

1. **Large Areas**
   - Backgrounds
   - Panels
   - Cards
   - Headers
   
2. **Non-Interactive Elements**
   - Static text (except for critical indicators)
   - Decorative patterns
   - Dividers
   
3. **Secondary Actions**
   - Secondary buttons
   - Toggle switches
   - Checkboxes
   - Radio buttons
   
4. **Multiple Elements in Proximity**
   - No more than one accent element in any 400px × 400px area
   - Never use on adjacent components

## Component-Specific Rules

### Buttons

✅ **Correct Usage**
- Primary action: Thin outline (1px) with accent text
- Hover state: Subtle accent shadow (2-3px offset)
- Focus state: Accent outline with offset

❌ **Incorrect Usage**
- Fill color
- Background color
- Multiple accent buttons in same section

```tsx
// CORRECT
<Button variant="primary">Submit</Button>  // thin outline + accent text

// INCORRECT
<Button variant="accent-fill">Submit</Button>  // accent as fill color
```

### Navigation

✅ **Correct Usage**
- Active state indicator (thin underline or side border)
- Hover state accent (subtle)
- Current page indicator

❌ **Incorrect Usage**
- Background of navigation items
- Icon fill in navigation (use outline icons with accent color)
- Multiple indicators in same navigation group

### Forms & Inputs

✅ **Correct Usage**
- Focus state border
- Validation indicators
- Required field indicators (subtle)

❌ **Incorrect Usage**
- Input background
- Label text (unless error state)
- Placeholder text

### Typography

✅ **Correct Usage**
- Single word emphasis in critical messaging
- Error messages
- Success confirmation messages

❌ **Incorrect Usage**
- Headings
- Body text
- Links (use underline styles instead)
- Multiple accent words in same paragraph

## Dark Mode Considerations

In dark mode, the accent color should maintain its distinctive quality but may be adjusted slightly to maintain proper contrast ratios:

- Light mode: `#ff4233` (no adjustment)
- Dark mode: `#ff5a4a` (slightly lighter to maintain 4.5:1 contrast ratio)

## Accessibility Requirements

- Accent color must maintain 4.5:1 contrast ratio with backgrounds
- Never use accent color as the only indicator of meaning or state
- Always pair with shape, icon, or text label changes
- Any text in accent color must be 18pt+ or bold

## Implementation in Code

All uses of the accent color must use the CSS variable system:

```css
/* CORRECT */
.element {
  color: hsl(var(--accent));
  border-color: hsl(var(--accent));
}

/* INCORRECT */
.element {
  color: #ff4233;
  border-color: rgb(255, 66, 51);
}
```

## Current Usage Inventory

| Component | Usage Type | Status | 
|-----------|------------|--------|
| Button (primary) | Text color + border | ✅ Compliant |
| Button (accent) | Fill color | ❌ Non-compliant |
| Card (asymmetric) | Corner accent | ✅ Compliant |
| Progress bar | Fill color | ✅ Compliant |
| Navigation | Active indicator | ✅ Compliant |
| Badge | Border only | ✅ Compliant |
| Header | Border accent | ✅ Compliant |
| Typography | Error message | ✅ Compliant |
| Error boundary | Background | ❌ Non-compliant |
| Background gradient | Secondary color | ❌ Non-compliant |

## Change Process

To introduce any new usage of the accent color:

1. Submit proposal with justification
2. Review against these guidelines
3. Test for visual harmony and accessibility
4. Document in this register if approved

**Any accent color usage not documented in this register is prohibited.**