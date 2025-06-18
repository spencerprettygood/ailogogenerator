import React from 'react';
import { 
  H1, 
  H2, 
  H3, 
  H4, 
  H5, 
  H6, 
  Paragraph, 
  LargeText, 
  SmallText,
  Caption,
  GradientHeading,
  AccentHeading
} from './typography';

export function TypographyShowcase() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <div className="space-y-4">
        <H1>Typography System</H1>
        <Paragraph>
          This page demonstrates the typography system using Raleway (200 weight with increased letter-spacing for headings) 
          and Arimo (12px base size for body text).
        </Paragraph>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <H2>Heading Examples</H2>
          <div className="space-y-6 pl-4">
            <div>
              <H1>Heading 1 - Raleway 200</H1>
              <Caption>48px with 10% letter-spacing</Caption>
            </div>
            <div>
              <H2>Heading 2 - Raleway 200</H2>
              <Caption>40px with 7.5% letter-spacing</Caption>
            </div>
            <div>
              <H3>Heading 3 - Raleway 200</H3>
              <Caption>32px with 5% letter-spacing</Caption>
            </div>
            <div>
              <H4>Heading 4 - Raleway 200</H4>
              <Caption>24px with 5% letter-spacing</Caption>
            </div>
            <div>
              <H5>Heading 5 - Raleway 200</H5>
              <Caption>20px with 5% letter-spacing</Caption>
            </div>
            <div>
              <H6>Heading 6 - Raleway 200</H6>
              <Caption>16px with 5% letter-spacing</Caption>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <H2>Body Text Examples</H2>
          <div className="space-y-6 pl-4">
            <div>
              <LargeText>
                Large Text - Arimo 14px. This is a larger body text style used for emphasized paragraphs or introductory content.
                It maintains good readability while standing out from the standard body text.
              </LargeText>
              <Caption>Arimo 14px</Caption>
            </div>
            <div>
              <Paragraph>
                Normal Paragraph - Arimo 12px. This is the default body text size used throughout the application.
                It provides excellent readability for extended content while maintaining a clean, professional appearance.
                Most of the application content should use this text size to ensure consistency.
              </Paragraph>
              <Caption>Arimo 12px</Caption>
            </div>
            <div>
              <SmallText>
                Small Text - Arimo 11px. This smaller text size is useful for secondary information, footnotes, or other
                less emphasized content. Despite its smaller size, it remains readable while occupying less visual space.
              </SmallText>
              <Caption>Arimo 11px</Caption>
            </div>
            <div>
              <Caption>
                Caption Text - Arimo 10px. Used for image captions, annotations, and very supplementary information.
                The smallest text size in our system, reserved for minimal usage where space is constrained.
              </Caption>
              <Caption>Arimo 10px</Caption>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <H2>Specialty Text Styles</H2>
          <div className="space-y-6 pl-4">
            <div>
              <GradientHeading>Gradient Heading</GradientHeading>
              <Caption>Heading with gradient effect from base color to accent</Caption>
            </div>
            <div>
              <AccentHeading>Accent Heading</AccentHeading>
              <Caption>Heading with accent underline</Caption>
            </div>
            <div>
              <H3 className="text-balance">Text Balance Example</H3>
              <Paragraph className="text-balance max-w-lg">
                This paragraph uses the text-balance utility to ensure that the lines are balanced visually.
                It's particularly useful for headings and short paragraphs where line lengths should be
                optically balanced for better readability and aesthetic appearance.
              </Paragraph>
              <Caption>Using text-balance utility</Caption>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}