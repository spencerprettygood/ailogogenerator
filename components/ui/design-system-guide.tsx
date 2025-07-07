import React from 'react';
import { Button } from './button';

export function DesignSystemGuide() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="mb-12">
        <h1 className="text-4xl mb-4">Asymmetric Design System</h1>
        <p className="text-gray-600 max-w-2xl">
          Monochrome + <span className="text-accent">#FF4233</span> accent design system with
          asymmetric layouts, off-center focal points, and deliberate irregularity.
        </p>
      </header>

      {/* Color System */}
      <section className="mb-12">
        <h2 className="text-2xl mb-6">Color System</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-4">Primary Colors</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-accent rounded-asymmetric mr-4"></div>
                <div>
                  <p className="font-mono text-sm">#FF4233</p>
                  <p className="text-gray-500">Primary Accent</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-foreground rounded-asymmetric mr-4"></div>
                <div>
                  <p className="font-mono text-sm">#0D0D0D</p>
                  <p className="text-gray-500">Foreground</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-background border border-gray-200 rounded-asymmetric mr-4"></div>
                <div>
                  <p className="font-mono text-sm">#FFFFFF</p>
                  <p className="text-gray-500">Background</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl mb-4">Grayscale</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="space-y-2">
                <div className="w-full h-12 bg-gray-100 rounded-sm"></div>
                <p className="text-xs text-center">100</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-gray-300 rounded-sm"></div>
                <p className="text-xs text-center">300</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-gray-500 rounded-sm"></div>
                <p className="text-xs text-center">500</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-gray-700 rounded-sm"></div>
                <p className="text-xs text-center">700</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-gray-900 rounded-sm"></div>
                <p className="text-xs text-center">900</p>
              </div>
            </div>

            <h3 className="text-xl mt-8 mb-4">Accent Variations</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <div className="w-full h-12 bg-accent-light rounded-sm"></div>
                <p className="text-xs text-center">Light</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-accent rounded-sm"></div>
                <p className="text-xs text-center">Default</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-accent-dark rounded-sm"></div>
                <p className="text-xs text-center">Dark</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl mb-6">Typography</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-4">Headings</h3>
            <div className="space-y-4">
              <div>
                <h1 className="mb-1">Heading 1</h1>
                <p className="text-xs text-gray-500">Inter / 3xl-5xl / Semibold</p>
              </div>
              <div>
                <h2 className="mb-1">Heading 2</h2>
                <p className="text-xs text-gray-500">Inter / 2xl-3xl / Semibold</p>
              </div>
              <div>
                <h3 className="mb-1">Heading 3</h3>
                <p className="text-xs text-gray-500">Inter / xl-2xl / Semibold</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl mb-4">Body</h3>
            <div className="space-y-4">
              <div>
                <p className="font-normal mb-1">
                  Regular body text uses Inter with normal weight (400) for optimal readability
                  across screen sizes.
                </p>
                <p className="text-xs text-gray-500">Inter / Normal / 400</p>
              </div>
              <div>
                <p className="font-light mb-1">
                  Light body text uses Inter Light (300) for secondary information and supporting
                  text.
                </p>
                <p className="text-xs text-gray-500">Inter / Light / 300</p>
              </div>
              <div>
                <p className="font-medium mb-1">
                  Medium body text uses Inter Medium (500) for emphasis without full bolding.
                </p>
                <p className="text-xs text-gray-500">Inter / Medium / 500</p>
              </div>
              <div>
                <code className="font-mono text-sm">
                  Monospaced text uses IBM Plex Mono for code and technical content.
                </code>
                <p className="text-xs text-gray-500">IBM Plex Mono / 400</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="mb-12">
        <h2 className="text-2xl mb-6">Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-4">Button Variants</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <p className="text-sm text-gray-500">Standard button variants</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="asymmetric">Asymmetric</Button>
                  <Button variant="accent">Accent Corner</Button>
                  <Button variant="solid">Solid</Button>
                  <Button variant="link">Link Button</Button>
                </div>
                <p className="text-sm text-gray-500">Special button variants</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary" radius="asymmetric">
                    Asymmetric Radius
                  </Button>
                  <Button variant="primary" radius="uneven">
                    Uneven Radius
                  </Button>
                  <Button variant="primary" radius="full">
                    Full Radius
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Radius variants</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary" size="sm">
                    Small
                  </Button>
                  <Button variant="primary" size="default">
                    Default
                  </Button>
                  <Button variant="primary" size="lg">
                    Large
                  </Button>
                  <Button variant="primary" size="xl">
                    Extra Large
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Size variants</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary" isLoading>
                    Loading
                  </Button>
                  <Button variant="primary" isLoading loadingText="Processing...">
                    Submit
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                </div>
                <p className="text-sm text-gray-500">States</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    variant="primary"
                    leftIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    }
                  >
                    Left Icon
                  </Button>
                  <Button
                    variant="primary"
                    rightIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    }
                  >
                    Right Icon
                  </Button>
                  <Button variant="primary" width="full" className="max-w-[200px]">
                    Full Width
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Icons and layout options</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl mb-4">Cards</h3>
            <div className="space-y-6">
              <div className="card-asymmetric">
                <h4 className="text-lg mb-2">Asymmetric Card</h4>
                <p className="text-sm text-gray-600">
                  Features uneven corners, off-center accent corner piece, and asymmetric shadow.
                </p>
              </div>

              <div className="bg-white p-4 rounded-uneven border-offset-rb">
                <h4 className="text-lg mb-2">Offset Border Card</h4>
                <p className="text-sm text-gray-600">
                  Uses offset border shadows for dimensional effect.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layout & Spacing */}
      <section className="mb-12">
        <h2 className="text-2xl mb-6">Layout & Spacing</h2>

        <h3 className="text-xl mb-4">Asymmetric Grids</h3>
        <div className="mb-8">
          <div className="grid grid-cols-asymmetric-1 gap-4 mb-4">
            <div className="bg-gray-100 p-4 rounded-sm">2fr</div>
            <div className="bg-gray-100 p-4 rounded-sm">1fr</div>
          </div>
          <div className="grid grid-cols-asymmetric-3 gap-4">
            <div className="bg-gray-100 p-4 rounded-sm">3fr</div>
            <div className="bg-gray-100 p-4 rounded-sm">2fr</div>
            <div className="bg-gray-100 p-4 rounded-sm">1fr</div>
          </div>
        </div>

        <h3 className="text-xl mb-4">Uneven Spacing</h3>
        <div className="flex">
          <div className="bg-accent h-12 w-[0.375rem] mr-[0.625rem]"></div>
          <div className="bg-accent h-12 w-[0.625rem] mr-[1.125rem]"></div>
          <div className="bg-accent h-12 w-[1.125rem] mr-[1.875rem]"></div>
          <div className="bg-accent h-12 w-[1.875rem] mr-[3.125rem]"></div>
          <div className="bg-accent h-12 w-[3.125rem]"></div>
        </div>
        <div className="flex mt-2">
          <div className="text-xs">6px</div>
          <div className="text-xs ml-4">10px</div>
          <div className="text-xs ml-8">18px</div>
          <div className="text-xs ml-12">30px</div>
          <div className="text-xs ml-20">50px</div>
        </div>
      </section>

      {/* Effects & Animation */}
      <section>
        <h2 className="text-2xl mb-6">Effects & Animation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-4">Shadows</h3>
            <div className="space-y-6">
              <div className="bg-white p-4 shadow-asymmetric-sm rounded-sm">
                <p className="text-sm">shadow-asymmetric-sm</p>
              </div>
              <div className="bg-white p-4 shadow-asymmetric-md rounded-sm">
                <p className="text-sm">shadow-asymmetric-md</p>
              </div>
              <div className="bg-white p-4 shadow-asymmetric-lg rounded-sm">
                <p className="text-sm">shadow-asymmetric-lg</p>
              </div>
              <div className="bg-white p-4 shadow-accent rounded-sm">
                <p className="text-sm">shadow-accent</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl mb-4">Animations</h3>
            <div className="space-y-6">
              <div className="bg-white p-4 animate-off-center-fade border border-gray-200 rounded-sm">
                <p className="text-sm">animate-off-center-fade</p>
              </div>
              <div className="bg-white p-4 animate-slide-up-right border border-gray-200 rounded-sm">
                <p className="text-sm">animate-slide-up-right</p>
              </div>
              <div className="bg-white p-4 animate-skewed-fade border border-gray-200 rounded-sm">
                <p className="text-sm">animate-skewed-fade</p>
              </div>
              <div className="bg-white p-4 animate-accent-pulse border border-gray-200 rounded-sm">
                <p className="text-sm">animate-accent-pulse</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Patterns */}
      <section className="mt-12">
        <h2 className="text-2xl mb-6">Asymmetric Patterns</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-asymmetric-gradient-1 p-8 rounded-asymmetric">
            <h3 className="text-xl mb-4">Background Pattern 1</h3>
            <p className="text-sm">
              Angular gradient background with accent color in bottom-right.
            </p>
          </div>

          <div className="bg-asymmetric-gradient-2 p-8 rounded-asymmetric">
            <h3 className="text-xl mb-4">Background Pattern 2</h3>
            <p className="text-sm">Angular gradient background with accent color in top-left.</p>
          </div>

          <div className="p-uneven bg-white border border-gray-200 clip-asymmetric-1">
            <h3 className="text-xl mb-4">Clip Path Shape 1</h3>
            <p className="text-sm">Container with uneven padding and custom clip path.</p>
          </div>

          <div className="p-uneven bg-white border border-gray-200 clip-asymmetric-2">
            <h3 className="text-xl mb-4">Clip Path Shape 2</h3>
            <p className="text-sm">Alternative clip path for asymmetric containers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
