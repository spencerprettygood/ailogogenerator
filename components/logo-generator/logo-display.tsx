'use client'

import React, { useState, useMemo } from 'react';
import { LogoDisplayProps, VariantSwitcherProps as IVariant } from '@/lib/types'; // Using IVariant for clarity
import VariantSwitcher from './variant-switcher';
import BackgroundSelector from './background-selector';
import LogoCustomizer from './logo-customizer';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageIcon, Pencil, X } from 'lucide-react';

const defaultBackgrounds = [
	'bg-white',
	'bg-gray-100',
	'bg-gray-800',
	'bg-black',
	'#3B82F6', // blue-500
	'#10B981', // green-500
];

const LogoDisplay: React.FC<LogoDisplayProps> = ({
	svgCode,
	variants = [], // Default to empty array, type is inferred from LogoDisplayProps
	availableBackgrounds = defaultBackgrounds,
	initialBackground = 'bg-gray-100',
	className,
	onCustomize,
}) => {
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		variants.length > 0 && variants[0].id ? variants[0].id : null // Check if variants[0].id exists
	);
	const [selectedBackground, setSelectedBackground] = useState<string>(initialBackground);
	const [isCustomizing, setIsCustomizing] = useState(false);
	const [customizedSvg, setCustomizedSvg] = useState<string | null>(null);

	const currentSvgCode = useMemo(() => {
		// If we have a customized version, use that first
		if (customizedSvg) return customizedSvg;
		
		// Otherwise, use the selected variant or default SVG
		if (selectedVariantId && variants.length > 0) {
			const selected = variants.find(v => v.id === selectedVariantId);
			return selected ? selected.svgCode : svgCode;
		}
		return svgCode;
	}, [svgCode, variants, selectedVariantId, customizedSvg]);

	if (!currentSvgCode) {
		return (
			<Card className={cn('w-full aspect-video flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 shadow-inner', className)}>
				<ImageIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
				<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Logo will appear here</p>
			</Card>
		);
	}

	// Handle customization completion
	const handleCustomizationComplete = (customizedSvgCode: string) => {
		setCustomizedSvg(customizedSvgCode);
		setIsCustomizing(false);
		
		// Call parent handler if available
		if (onCustomize) {
			onCustomize(customizedSvgCode);
		}
	};

	// Handle customization cancellation
	const handleCustomizationCancel = () => {
		setIsCustomizing(false);
	};

	// If in customization mode, show the customizer interface
	if (isCustomizing) {
		return (
			<div className={className}>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Customize Your Logo</h2>
					<Button 
						variant="outline" 
						size="icon" 
						onClick={handleCustomizationCancel}
						className="ml-auto"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
				
				<LogoCustomizer
					svgCode={currentSvgCode}
					onCustomizationComplete={handleCustomizationComplete}
					onCancel={handleCustomizationCancel}
				/>
			</div>
		);
	}

	const isBgColorClass = selectedBackground.startsWith('bg-');
	const backgroundStyle = isBgColorClass ? {} : { backgroundColor: selectedBackground };
	const backgroundClass = isBgColorClass ? selectedBackground : '';

	return (
		<Card className={cn('w-full overflow-hidden shadow-lg', className)}>
			<CardContent
				className={cn(
					'p-6 flex items-center justify-center aspect-video transition-colors duration-200 min-h-[250px] sm:min-h-[300px] md:min-h-[350px] relative group',
					backgroundClass
				)}
				style={backgroundStyle}
			>
				<div
					className="max-w-full max-h-full w-auto h-auto p-2 [&>svg]:max-w-full [&>svg]:max-h-[200px] sm:[&>svg]:max-h-[250px] md:[&>svg]:max-h-[300px] [&>svg]:w-auto [&>svg]:h-auto"
					dangerouslySetInnerHTML={{ __html: currentSvgCode }}
				/>
				
				{/* Customize button overlay */}
				<Button 
					variant="secondary"
					className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1"
					onClick={() => setIsCustomizing(true)}
				>
					<Pencil className="h-4 w-4" />
					Customize
				</Button>
			</CardContent>
			
			{(variants.length > 1 || availableBackgrounds.length > 0) && (
				<CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
					{variants.length > 1 && !customizedSvg && (
						<VariantSwitcher
							variants={variants as IVariant['variants']} // Cast to the expected type
							selectedVariantId={selectedVariantId || (variants[0]?.id ?? '')} // Ensure variants[0].id exists before accessing
							onSelectVariantAction={setSelectedVariantId}
						/>
					)}
					{availableBackgrounds.length > 0 && (
						<BackgroundSelector
							backgrounds={availableBackgrounds}
							selectedBackground={selectedBackground}
							onSelectBackgroundAction={setSelectedBackground}
						/>
					)}
					
					{/* Show Edit button in footer too for better discoverability */}
					<Button 
						variant="outline"
						size="sm"
						className="flex items-center gap-1"
						onClick={() => setIsCustomizing(true)}
					>
						<Pencil className="h-3 w-3" />
						Edit Logo
					</Button>
				</CardFooter>
			)}
		</Card>
	);
};

export default LogoDisplay;
