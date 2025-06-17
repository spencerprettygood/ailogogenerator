import { distillRequirements } from '../../../lib/ai-pipeline/stages/stage-a-distillation';
import { generateMoodboard } from '../../../lib/ai-pipeline/stages/stage-b-moodboard';
import { selectDirection } from '../../../lib/ai-pipeline/stages/stage-c-selection';
import { generateSvgLogo } from '../../../lib/ai-pipeline/stages/stage-d-generation';
import { validateAndRepairSvg } from '../../../lib/ai-pipeline/stages/stage-e-validation';
import { generateVariants } from '../../../lib/ai-pipeline/stages/stage-f-variants';
import { generateBrandGuidelines } from '../../../lib/ai-pipeline/stages/stage-g-guidelines';
import { packageAssets } from '../../../lib/ai-pipeline/stages/stage-h-packaging';
import { RateLimiter } from '../../../lib/utils/file-storage';

function encodeMessage(msg: unknown) {
  return new TextEncoder().encode(JSON.stringify(msg) + '\n');
}

// Helper to convert Buffers to base64 strings for guidelines
function bufferMapToBase64(map: Record<string, Buffer>): { [size: string]: string } {
  const out: { [size: string]: string } = {};
  for (const key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      out[key] = map[key].toString('base64');
    }
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const { brief, images, options } = await request.json();
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rate = RateLimiter.check(ip);
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rate.retryAfter }), { status: 429 });
    }
    // Streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let designSpec, concepts, selected, svg, validSvg, variants, guidelinesData, zipUrl;
        try {
          // Stage A
          controller.enqueue(encodeMessage({ stage: 'A', progress: 10, data: 'Analyzing requirements...' }));
          const stageA = await distillRequirements(brief, images);
          if (!stageA.success || !stageA.designSpec) throw new Error(stageA.error?.message || 'Stage A failed');
          designSpec = stageA.designSpec;
          // Stage B
          controller.enqueue(encodeMessage({ stage: 'B', progress: 25, data: 'Generating concepts...' }));
          const stageB = await generateMoodboard(designSpec);
          if (!stageB.success || !stageB.moodboard) throw new Error(stageB.error?.message || 'Stage B failed');
          concepts = stageB.moodboard.concepts;
          // Stage C
          controller.enqueue(encodeMessage({ stage: 'C', progress: 35, data: 'Selecting best concept...' }));
          const stageC = await selectDirection({ designSpec, concepts });
          if (!stageC.success || !stageC.selection) throw new Error(stageC.error?.message || 'Stage C failed');
          selected = stageC.selection.selectedConcept;
          // Stage D
          controller.enqueue(encodeMessage({ stage: 'D', progress: 50, data: 'Generating SVG logo...' }));
          const stageD = await generateSvgLogo({ designSpec, selectedConcept: selected });
          if (!stageD.success || !stageD.result) throw new Error(stageD.error?.message || 'Stage D failed');
          svg = stageD.result.svg;
          // Stage E
          controller.enqueue(encodeMessage({ stage: 'E', progress: 60, data: 'Validating SVG...' }));
          const stageE = await validateAndRepairSvg({ svg, brandName: designSpec.brand_name, repair: true, optimize: true });
          if (!stageE.success || !stageE.result) throw new Error(stageE.error?.message || 'Stage E failed');
          validSvg = stageE.result.svg;
          // Stage F
          controller.enqueue(encodeMessage({ stage: 'F', progress: 75, data: 'Generating variants...' }));
          const stageF = await generateVariants({ svg: validSvg, designSpec, brandName: designSpec.brand_name });
          if (!stageF.success || !stageF.variants) throw new Error(stageF.error?.message || 'Stage F failed');
          variants = stageF.variants;
          // Stage G
          if (options?.include_guidelines !== false) {
            controller.enqueue(encodeMessage({ stage: 'G', progress: 85, data: 'Generating brand guidelines...' }));
            // Convert PNG Buffers to base64 strings for guidelines
            const pngBase64 = bufferMapToBase64(variants.pngVariants);
            guidelinesData = await generateBrandGuidelines({
              variants: {
                primary: validSvg,
                monochrome: variants.monochrome.black,
                favicon: variants.favicon.svg,
                pngVariants: pngBase64
              },
              designSpec
            });
          }
          // Stage H
          controller.enqueue(encodeMessage({ stage: 'H', progress: 95, data: 'Packaging assets...' }));
          zipUrl = await packageAssets({
            brandName: designSpec.brand_name,
            svg: validSvg,
            pngVariants: variants.pngVariants,
            monochrome: variants.monochrome,
            favicon: variants.favicon,
            guidelines: guidelinesData ? { html: guidelinesData.html, plainText: '' } : { html: '', plainText: '' }
          });
          controller.enqueue(encodeMessage({ stage: 'complete', progress: 100, complete: true, download_url: zipUrl }));
        } catch (error) {
          controller.enqueue(encodeMessage({ error: (error as Error).message || 'Unknown error', stage: 'error' }));
        } finally {
          controller.close();
        }
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Generation failed' }), { status: 500 });
  }
}
