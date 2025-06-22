# AI Logo Generator Design System

## Core Design Principles

### Asymmetric Design
The UI follows an intentionally asymmetric design approach:
- Off-center focal points
- Deliberate irregularity
- Uneven spacing and padding
- Negative space as an active element

### Monochrome + Accent
The color system uses a monochrome palette with a single accent color:
- Base: #000000 (black)
- Secondary: #0F0F0F, #1A1A1A
- Lines: #333333 (default), #666666 (inactive)
- Text: #FFFFFF (primary), #AAAAAA (secondary)
- **Accent: #FF4233** (vibrant red)

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | #FFFFFF | Page background |
| `--foreground` | #0D0D0D | Primary text |
| `--accent` | #FF4233 | Primary actions, active states, focal points |
| `--accent-light` | #FF6B5D | Hover states for accent elements |
| `--accent-dark` | #D32E20 | Active/pressed states for accent elements |
| `--border` | #D4D4D4 | Default border color |
| `--muted` | #F5F5F5 | Background for subtle UI elements |
| `--muted-foreground` | #737373 | Secondary text |

## Typography System

### Typefaces
- **Headings**: Raleway (200 weight)
- **Body**: Arimo (12px base size)

### Scale
| Class | Size | Weight | Letter-spacing | Line-height |
|-------|------|--------|---------------|------------|
| `heading-1` | 48px | 200 | +10% | 1.1 |
| `heading-2` | 40px | 200 | +7.5% | 1.2 |
| `heading-3` | 32px | 200 | +5% | 1.2 |
| `heading-4` | 24px | 200 | +5% | 1.3 |
| `heading-5` | 20px | 200 | +5% | 1.4 |
| `heading-6` | 16px | 200 | +5% | 1.5 |
| `body-large` | 14px | 400 | normal | 1.5 |
| `body-normal` | 12px | 400 | normal | 1.6 |
| `body-small` | 11px | 400 | normal | 1.5 |
| `caption` | 10px | 400 | +2% | 1.4 |

## Component System

### Buttons
- **Default**: Hair-thin border with accent on hover
- **Accent**: #FF4233 background with clipped corner
- **Asymmetric**: White background with offset #FF4233 shadow
- **Ghost**: Text-only with accent on hover

### Badges
- **Default**: Thin border, no background
- **Accent**: #FF4233 background with clipped corner
- **Asymmetric**: White background with accent border

### Cards
- **Default**: White background with asymmetric shadow
- **Accent Corner**: White background with accent corner decoration
- **Offset**: White background with offset accent border

## Spacing System

The spacing system uses uneven values to create asymmetry:
- `uneven-1`: 6px (0.375rem)
- `uneven-2`: 10px (0.625rem)
- `uneven-3`: 18px (1.125rem)
- `uneven-4`: 30px (1.875rem)
- `uneven-5`: 50px (3.125rem)

## Animation System

### Timing Functions
- `ease-asymmetric`: cubic-bezier(0.22, 1, 0.36, 1)

### Durations
- `quick`: 120ms
- `standard`: 240ms
- `emphasized`: 400ms

### Motion Patterns
- Asymmetric fade-ins
- Offset transitions
- Uneven scaling
- Slight rotation or skewing

## Shape System

### Border Radius
- `rounded-uneven`: 0.25rem 0.5rem 0.25rem 0.75rem
- `rounded-asymmetric`: 1rem 0 1rem 0.25rem
- `rounded-accent`: 0.75rem 0.25rem

### Shadows
- `shadow-asymmetric-sm`: 2px 3px 10px -3px rgba(0, 0, 0, 0.1)
- `shadow-asymmetric-md`: 4px 6px 16px -2px rgba(0, 0, 0, 0.12)
- `shadow-asymmetric-lg`: 6px 8px 24px -4px rgba(0, 0, 0, 0.15)
- `shadow-accent`: 3px 3px 0 0 #FF4233

## Usage Guidelines

### Accent Color Usage
The #FF4233 accent should ONLY be used for:
- Primary actions (main CTA buttons)
- Active states (current navigation)
- Critical indicators (error states, important notifications)
- Key data points (highlighting important metrics)
- Focal points (drawing attention to specific UI elements)

### Asymmetry Guidelines
- Use off-center layouts with deliberate irregularity
- Apply uneven spacing, especially in containers
- Implement diagonal elements as visual disruptors
- Utilize asymmetric shapes for interactive elements
- Place navigation at 1/3 width when possible