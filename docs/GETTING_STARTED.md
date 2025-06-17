# AI Logo Generator - Developer Onboarding Guide

## 📋 Project Overview

The AI Logo Generator is a powerful application that transforms natural language descriptions into complete branding packages. Users provide a text-based brief, and the system generates professional-quality SVG logos, variants, and brand guidelines using Claude's AI capabilities.

### Key Features

- **Natural Language to Logo**: Transform text descriptions into professional logo designs
- **Multi-stage Pipeline**: 8-stage intelligent generation process 
- **Comprehensive Assets**: SVG, PNG exports, monochrome variants, favicon, brand guidelines
- **Real-time Progress**: Stream generation progress with live previews
- **Reference Images**: Upload images for visual inspiration
- **Secure SVG Generation**: Multi-layer security validation

## 🏗️ Architecture Overview

The application uses a multi-agent architecture pattern where specialized AI agents handle different stages of the logo generation process:

1. **RequirementsAgent**: Analyzes user brief to extract structured design requirements
2. **MoodboardAgent**: Generates multiple design concepts based on requirements
3. **SelectionAgent**: Evaluates and selects the optimal concept
4. **SVGGenerationAgent**: Creates production-ready SVG logo
5. **SVGValidationAgent**: Validates and repairs SVG code
6. **VariantGenerationAgent**: Creates monochrome and simplified variants
7. **GuidelineAgent**: Generates comprehensive brand guidelines
8. **PackagingAgent**: Assembles all assets into a downloadable package

These agents are orchestrated by the `MultiAgentOrchestrator` which manages dependencies, execution flow, and error handling.

### Technology Stack

- **Frontend**: React 18, Next.js 14 (App Router), Tailwind CSS
- **UI Components**: Shadcn UI component library
- **Backend**: Next.js API Routes with Edge Functions
- **AI**: Anthropic Claude 3.5 (Sonnet and Haiku models)
- **Image Processing**: Sharp.js for SVG → PNG conversion
- **File Handling**: JSZip for package assembly
- **Deployment**: Vercel Edge Functions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key (Claude 3.5 access)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ailogogenerator.git
   cd ailogogenerator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 💻 Development Workflow

### Running Locally

The application runs as a standard Next.js project:

```bash
# Development mode with hot reloading
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

### Project Structure

```
/
├── app/                   # Next.js App Router
│   ├── api/               # API routes
│   │   ├── download/      # Asset download endpoint
│   │   └── generate-logo/ # Logo generation endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── logo-generator/    # Logo generator components
│   └── ui/                # Reusable UI components
├── lib/                   # Core library code
│   ├── agents/            # Agent implementation
│   │   ├── base/          # Base agent classes
│   │   ├── orchestrator/  # Multi-agent orchestrator
│   │   └── specialized/   # Specialized agents
│   ├── ai-pipeline/       # Pipeline implementation
│   │   ├── stages/        # Pipeline stages
│   │   └── validators/    # Input/output validation
│   ├── hooks/             # React hooks
│   ├── services/          # External services
│   ├── utils/             # Utility functions
│   └── types.ts           # TypeScript type definitions
├── public/                # Static assets
└── docs/                  # Documentation
    ├── adr/               # Architecture Decision Records
    └── diagrams/          # Architecture diagrams
```

### Key Files

- `lib/agents/orchestrator/multi-agent-orchestrator.ts`: Core orchestration logic
- `lib/agents/base/base-agent.ts`: Base agent implementation
- `lib/agents/specialized/*.ts`: Individual specialized agents
- `components/logo-generator/logo-generator-app.tsx`: Main UI component
- `app/api/generate-logo/route.ts`: API endpoint for logo generation

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- pipeline-stages.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for Claude API access
- `RATE_LIMIT_MAX`: Maximum number of requests per window (default: 10)
- `RATE_LIMIT_WINDOW`: Time window in milliseconds (default: 15 minutes)

## 🧠 Key Concepts

### Multi-Agent Architecture

The application uses a multi-agent architecture pattern where each agent is specialized for a specific task. This provides several benefits:

- **Separation of Concerns**: Each agent has a single responsibility
- **Model Optimization**: Different models can be used for different tasks
- **Parallel Execution**: Independent agents can run concurrently
- **Resilience**: Failure in one agent doesn't necessarily mean failure of the entire pipeline

See the [Multi-Agent Architecture ADR](./adr/001-multi-agent-architecture.md) for more details.

### Generation Pipeline

The logo generation process follows a structured pipeline with 8 stages:

- **Stage A**: Requirements Distillation
- **Stage B**: Moodboard Generation
- **Stage C**: Direction Selection
- **Stage D**: SVG Logo Generation
- **Stage E**: SVG Validation & Repair
- **Stage F**: Variant Generation
- **Stage G**: Brand Guidelines
- **Stage H**: Packaging & Delivery

Each stage has dependencies on previous stages and produces outputs for subsequent stages.

### Streaming Architecture

The application uses a streaming response pattern to provide real-time progress updates:

1. Client sends a request to the server
2. Server starts the generation process
3. Progress updates are streamed back to the client
4. Client displays progress and previews as they become available
5. Final results are delivered at the end of the stream

## 🤝 Contributing

### Development Process

1. Create a branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and write tests

3. Ensure all tests pass:
   ```bash
   npm test
   ```

4. Ensure the code follows our style guide:
   ```bash
   npm run lint
   ```

5. Create a pull request

### Code Style

- Use TypeScript for all new code
- Follow the existing component pattern for React components
- Write unit tests for all new functionality
- Add JSDoc comments to public functions and methods
- Follow the project's naming conventions

## 🔍 Troubleshooting

### Common Issues

#### Claude API Issues

**Symptom**: API calls to Claude failing or timing out.

**Solution**: Check that your `ANTHROPIC_API_KEY` is correctly set in `.env.local` and that you have access to the required models (Claude 3.5 Sonnet and Haiku).

#### SVG Generation Failures

**Symptom**: SVG generation consistently fails for certain prompts.

**Solution**: Check the SVG validation logs. Common issues include:
- Script injection attempts in the prompt
- SVG size exceeding limits (>15KB)
- Use of unsupported SVG elements

#### Performance Issues

**Symptom**: Generation takes a long time or times out.

**Solution**:
- Ensure you're using the correct models for each task
- Check for excessive token usage in prompts
- Consider implementing caching for repeated operations

## 📚 Further Resources

- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [SVG Specification](https://www.w3.org/TR/SVG2/)
- [Pipeline Sequence Diagram](./diagrams/pipeline-sequence.puml)
- [System Architecture Diagram](./diagrams/system-architecture.puml)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.