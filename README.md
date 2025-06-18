# AI Logo Generator - Developer Onboarding Guide

## Project Overview

AI Logo Generator is an application that transforms natural language descriptions into complete branding packages. Users can provide a brief description of their brand, and the system will generate professional-quality SVG logos, PNG variants, favicon, and brand guidelines through an intuitive chat interface.

**Key Features:**
- Natural language input processing
- AI-powered SVG logo generation
- Multiple logo variants (color, monochrome)
- Brand guidelines document
- Logo animation system with multiple effects
- Real-time progress tracking
- Complete asset package export

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Zustand

### Backend
- **Runtime**: Node.js with TypeScript
- **API Framework**: Next.js API routes with edge functions
- **AI Integration**: Anthropic Claude API (Sonnet + Haiku)
- **Image Processing**: Sharp.js for SVG→PNG conversion
- **File Handling**: JSZip for package assembly

### Infrastructure
- **Hosting**: Vercel with edge function deployment
- **CDN**: Vercel Edge Network
- **Security**: Custom rate limiting + input sanitization

## System Architecture

The application follows a multi-stage pipeline architecture:

```
Stage A: Requirements → Extract design specs from user brief
Stage B: Moodboard → Generate concept options
Stage C: Selection → Choose the best concept
Stage D: SVG Generation → Create the primary logo
Stage E: Validation → Verify SVG security and quality
Stage F: Variants → Generate monochrome/simplified versions
Stage G: Guidelines → Create brand usage guidelines
Stage H: Packaging → Bundle all assets for download
Stage I: Animation → Apply selected animations to SVG logos
```

Each stage is handled by specialized agents using Claude models optimized for specific tasks (Sonnet for creative generation, Haiku for fast analysis/validation).

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Git
- Anthropic API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ailogogenerator.git
   cd ailogogenerator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:
   ```
   ANTHROPIC_API_KEY=your_anthropic_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Access the application at `http://localhost:3000`

## Development Workflow

### Running Locally

The development server supports hot reloading. Changes to the codebase will automatically be reflected in the browser.

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- lib/ai-pipeline/tests/pipeline-stages.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage
```

### Documentation

The project uses TypeDoc for API documentation generation from code comments.

```bash
# Generate documentation
npm run docs

# View documentation locally
npm run docs:serve

# Build and watch documentation during development
npm run docs:watch
```

To access the documentation:
1. Generate the docs using `npm run docs`
2. Navigate to `docs/api/index.html` in your browser
3. Or start a local server with `npm run docs:serve` and visit http://localhost:3000

### Debugging

- Use the browser's developer tools for frontend debugging
- Add `console.log` statements or use the VSCode debugger for backend debugging
- Enable verbose logging with `LOG_LEVEL=debug` in your `.env.local` file

### Build for Production

```bash
npm run build
# or
yarn build
```

## Code Organization

```
/app                  # Next.js app router pages and API routes
  /api                # Backend API endpoints
    /generate-logo    # Main logo generation endpoint
  /page.tsx           # Main application page

/components           # React components
  /logo-generator     # Logo generation UI components
  /ui                 # Reusable UI components

/lib                  # Core application logic
  /agents             # AI agent implementations
    /base             # Base agent classes and registry
    /specialized      # Task-specific agents
    /orchestrator     # Multi-agent coordination
  /ai-pipeline        # Logo generation pipeline
    /stages           # Individual pipeline stages
    /validators       # Input/output validation
  /animation          # Logo animation system
    /providers        # Animation technology providers (SMIL, CSS, JS)
    /utils            # Animation utility functions
  /services           # External service integrations
  /utils              # Utility functions

/public               # Static assets
```

## Key Concepts

### Pipeline Stages

The logo generation process is divided into distinct stages, each with a specific responsibility:

1. **Requirements Distillation**: Extracts structured design specifications from the user's brief
2. **Moodboard Generation**: Creates visual concepts based on requirements
3. **Selection**: Evaluates concepts and selects the best match
4. **SVG Generation**: Creates the primary logo in SVG format
5. **Validation**: Verifies SVG code for security and quality
6. **Variant Generation**: Creates monochrome and simplified versions
7. **Guidelines Creation**: Generates brand usage documentation
8. **Packaging**: Bundles all assets for download
9. **Animation**: Applies selected animations to SVG logos

### Animation System

The animation system enhances static SVG logos with dynamic animations using a provider-based architecture:

1. **Multiple Animation Types**: Support for 18+ animation types (fade, zoom, draw, bounce, etc.)
2. **Provider Architecture**: Pluggable providers for different animation technologies (SMIL, CSS, JS)
3. **Cross-Browser Compatibility**: Automatic fallbacks for optimal browser support
4. **Animation Triggers**: Support for load, scroll, hover, and click triggers

For detailed documentation, see the [Animation System Documentation](/docs/ANIMATION_SYSTEM.md) and the [Animation Usage Guide](/docs/guides/ANIMATION_GUIDE.md)

### Agent System

The application uses a multi-agent architecture where specialized AI agents handle different aspects of the logo generation process:

- **Requirements Agent**: Processes user input into structured specifications
- **Moodboard Agent**: Generates visual concepts and descriptions
- **Selection Agent**: Evaluates and ranks concepts
- **SVG Generation Agent**: Creates vector graphics
- **Validation Agent**: Checks output quality and security
- **Variant Generation Agent**: Creates alternative versions
- **Guidelines Agent**: Creates brand documentation
- **Packaging Agent**: Prepares final deliverables
- **Animation Agent**: Applies animations to SVG logos

## Contributing Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks for React
- Document public functions and interfaces with JSDoc comments
- Use meaningful variable and function names
- Follow the documentation templates in `docs/templates/`

### Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with descriptive messages:
   ```bash
   git commit -m "Add: feature description"
   ```

3. Push to your branch and create a pull request against `main`

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if necessary
3. Request review from at least one team member
4. Address review comments and update the PR

## Troubleshooting Common Issues

### SVG Generation Failures

**Symptoms**: Malformed SVG, parsing errors
**Solutions**:
- Check Claude API response format
- Verify prompt templates in SVG generation agent
- Check SVG validation rules

### Rate Limiting Issues

**Symptoms**: 429 errors, slow responses
**Solutions**:
- Implement exponential backoff
- Check API key rate limits
- Add request queuing

### File Download Problems

**Symptoms**: Corrupted ZIP, missing files
**Solutions**:
- Check file integrity validation
- Verify JSZip implementation
- Check temporary storage configuration

## Resources and Further Reading

### Project Documentation

- [Product Requirements Document](/Product_Requirements_Document.md)
- [Technical Requirements Document](/Technical_Requirements_Document.md)
- [Animation System Documentation](/docs/ANIMATION_SYSTEM.md)
- [Animation Usage Guide](/docs/guides/ANIMATION_GUIDE.md)
- [Claude Integration Guide](/claude.md)
- [Development Roadmap](/Future_Development_Roadmap.md)
- [API Documentation](/docs/api/index.html) (generated from code)
- [Architecture Decision Records](/docs/adr/)
- [Documentation Guide](/docs/README.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [SVG Specification](https://www.w3.org/Graphics/SVG/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

For questions or assistance, contact the team at [team-email@example.com](mailto:team-email@example.com) or join our Slack channel #ai-logo-generator.