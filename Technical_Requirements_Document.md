# Technical Requirements Document: AI Logo Generator

## 1. System Architecture

### 1.1. High-Level Architecture
The system is designed as a serverless, stateless web application hosted on Vercel, leveraging Next.js for both the frontend and backend API routes. The core AI logic is handled by the Anthropic Claude API, with a multi-stage pipeline orchestrating the generation process.

```mermaid
graph TD
    A[User Interface (React/Next.js)] --> B{Next.js API Route};
    B --> C[Pipeline Orchestrator];
    C --> |Stage A| D[Requirement Distillation (Haiku)];
    C --> |Stage B| E[Moodboard Generation (Sonnet)];
    C --> |Stage C| F[Concept Selection (Haiku)];
    C --> |Stage D| G[SVG Generation (Sonnet)];
    C --> |Stage E| H[SVG Validation & Repair];
    C --> |Stage F| I[Variant Generation (Haiku)];
    C --> |Stage G| J[Brand Guidelines (Sonnet)];
    C --> |Stage H| K[Asset Packaging (JSZip)];
    K --> L[Temporary File Storage];
    L --> M[Download Link];
    M --> A;
```

### 1.2. Technology Stack
| Component | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Integrated frontend/backend, Vercel Edge Function optimization, server-side rendering. |
| **UI Library** | React 18 + Tailwind CSS | Modern component-based UI, rapid styling, and a rich ecosystem. |
| **AI Models** | Claude 3.5 Sonnet & Haiku | Sonnet for high-quality creative generation; Haiku for fast, cost-effective analysis and transformation tasks. |
| **Image Processing** | Sharp.js | High-performance Node.js library for converting SVG to PNG, optimized for Vercel. |
| **File Packaging** | JSZip | Efficient client-side or serverless generation of ZIP archives. |
| **Deployment** | Vercel Edge Functions | Optimal for streaming AI responses, global CDN for low latency, and automatic scaling. |
| **Testing** | Vitest / Playwright | Fast unit testing with Vitest; robust end-to-end testing with Playwright. |

## 2. Performance & Scalability Metrics

| Metric | Target | Measurement / Tool |
|---|---|---|
| **API Response Time (p95)** | < 250ms (excluding AI generation) | Vercel Analytics |
| **Generation Time (p95)** | < 120 seconds | Custom logging in Pipeline Orchestrator |
| **Concurrent Generations** | 100+ | Load testing with k6/Playwright |
| **Serverless Function Cold Starts** | < 500ms | Vercel Analytics |
| **Frontend Page Load (LCP)** | < 2.5 seconds | Google PageSpeed Insights |
| **Scalability** | Auto-scale to 1,000 requests/hour | Vercel platform monitoring |

## 3. Security Specifications

### 3.1. Input Sanitization & Validation
- **Briefs & Text Inputs**: All user-submitted text will be sanitized to remove potential prompt injection sequences (e.g., `ignore previous instructions`, `system:`, etc.) and HTML/script tags.
- **File Uploads**: Uploaded images will be validated for correct MIME types (JPEG, PNG, WebP) and scanned for embedded malware or scripts.

### 3.2. SVG Security
Generated SVGs will undergo a strict validation and sanitization process:
- **Disallowed Elements**: `<script>`, `<foreignObject>`, `<use>`, `<image href="http...">`
- **Disallowed Attributes**: `onload`, `onclick`, `onerror`, and any other event handlers.
- **Disallowed Protocols**: `javascript:`, `data:text/html`
- **File Size Limit**: Enforce a 15KB maximum size for generated SVGs to prevent denial-of-service attacks.

### 3.3. Rate Limiting
- A Redis-based rate limiting system will be implemented using a sliding window algorithm.
- **Limit**: 10 generation requests per 15 minutes per IP address or authenticated user ID.
- **Response**: `429 Too Many Requests` error with a `Retry-After` header.

## 4. Data Management

- **Stateless Architecture**: The application will be stateless, with no persistent database for user data.
- **Temporary Storage**: Uploaded images and generated assets will be stored in a temporary, secure location (e.g., Vercel Blob Storage or S3 with a short lifecycle policy).
- **Data Retention**: All user-generated content (briefs, images, logos) will be automatically and permanently deleted after 24 hours.

## 5. AI Pipeline Technical Specifications

### 5.1. Token Budgets
To manage costs and performance, each stage of the AI pipeline will have a strict token budget:
| Stage | Model | Max Tokens (Output) | Estimated Cost |
|---|---|---|---|
| A: Distillation | Haiku | 500 | ~$0.0002 |
| B: Moodboard | Sonnet | 1500 | ~$0.005 |
| C: Selection | Haiku | 300 | ~$0.0001 |
| D: SVG Generation | Sonnet | 2000 | ~$0.01 |
| F: Variants | Haiku | 800 | ~$0.0005 |
| G: Guidelines | Sonnet | 1500 | ~$0.005 |
| **Total (Approx.)** | | **~6600** | **~$0.021** |

### 5.2. Error Handling & Retry Logic
- **Retry Mechanism**: Implement an exponential backoff strategy for API calls to the Claude API.
- **Configuration**:
    - `maxRetries`: 3
    - `initialDelay`: 1000ms
    - `backoffMultiplier`: 2
- **Fallback Strategies**:
    - **SVG Generation Failure**: If the primary Sonnet model fails, retry with a simplified prompt or switch to a less complex, geometric-focused fallback prompt.
    - **Guidelines Failure**: If brand guideline generation fails, generate a basic, template-based version.

## 6. Testing Strategy

### 6.1. Test Pyramid
- **Unit Tests (Vitest)**: >90% coverage. Focus on individual functions, validators, and utility classes.
- **Integration Tests (Vitest)**: >80% coverage. Test the interaction between pipeline stages and API endpoints. Mock the Anthropic API.
- **End-to-End Tests (Playwright)**: Cover all critical user journeys, including brief submission, file upload, generation, and download. Run against a staging environment.

### 6.2. Automated QA Checks
- **Visual Regression Testing**: Use Playwright to take snapshots of the UI and generated logos to catch unintended visual changes.
- **File Validation**: Automated tests will validate the generated ZIP package, checking for file integrity, correct naming, and valid formats.

## 7. Deployment & DevOps

### 7.1. Vercel Configuration (`vercel.json`)
```json
{
  "functions": {
    "app/api/generate-logo/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "RATE_LIMIT_REDIS_URL": "@redis-url"
  }
}
```

### 7.2. Environment Variables
- `ANTHROPIC_API_KEY`: Required for AI generation.
- `NODE_ENV`: `development`, `preview`, or `production`.
- `LOG_LEVEL`: `info`, `warn`, `error`.
- `RATE_LIMIT_ENABLED`: `true` or `false`.

### 7.3. Monitoring & Alerting
- **Key Metrics to Monitor**:
    - Generation Success Rate
    - Average Generation Time
    - API Error Rate (4xx, 5xx)
    - Cost per Generation
- **Alerting Thresholds**:
    - **Critical**: Success rate < 90%; Generation time > 180s; 5xx error rate > 1%.
    - **Warning**: Success rate < 95%; Generation time > 120s; Cost per generation > $0.40.
- **Tools**: Vercel Analytics, integrated logging service (e.g., Logtail), Sentry for error tracking.
