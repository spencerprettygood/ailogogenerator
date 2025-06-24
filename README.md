# AI Logo Generator

This project is a chat-based AI logo generator that creates a complete branding package for users.

## Tech Stack

- Next.js
- Vercel AI SDK (Anthropic)
- React
- Tailwind CSS
- Vercel

## Features

- **AI-Powered Logo Generation**: Create custom logos based on natural language descriptions
- **SVG Output**: Get high-quality, scalable vector graphics
- **Animation System**: Add animations to logos for digital use
- **Enhanced Mockup System**: Visualize logos in realistic contexts with lighting and shadow effects
- **Brand Package**: Generate complete brand packages with variants, guidelines, and assets
- **Uniqueness Analysis**: Verify logo uniqueness against industry standards

## Enhanced Mockup System

The AI Logo Generator includes an advanced mockup system for visualizing logos in realistic contexts:

### Key Features

- **Realistic Backgrounds**: Use real background images instead of solid colors
- **Lighting Effects**: Apply directional lighting with customizable intensity
- **Shadow Effects**: Add realistic shadows with adjustable blur and opacity
- **Perspective Transforms**: Apply 3D perspective for angled surfaces
- **Performance Optimization**: Adapt rendering quality based on device capabilities

### Testing

To try out the enhanced mockup system, visit [http://localhost:3000/test-mockups](http://localhost:3000/test-mockups) when running the development server.

For more information, see the [Enhanced Mockup System Documentation](./docs/ENHANCED_MOCKUP_SYSTEM.md).

## Project Status

This project is currently under development. The goal is to create a production-ready, error-free, and fully deployable application.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser** to [http://localhost:3000](http://localhost:3000) to see the application.

## Adding Background Images

To add realistic mockup backgrounds:

1. Add full-size images to `/public/assets/mockups/backgrounds/`
2. Add thumbnails to `/public/assets/mockups/backgrounds/previews/`
3. Update the registry in `/lib/mockups/background-image-registry.ts`

## Documentation

- [Enhanced Mockup System](./docs/ENHANCED_MOCKUP_SYSTEM.md)
- [Animation System](./docs/archive/ANIMATION_SYSTEM.md)
- [Project Structure](./docs/archive/PROJECT_STRUCTURE.md)