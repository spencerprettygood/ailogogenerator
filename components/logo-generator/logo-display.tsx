'use client'

import React, { useState, useMemo } from 'react';
import { LogoDisplayProps, VariantSwitcherProps as IVariant } from '@/lib/types'; // Using IVariant for clarity
import VariantSwitcher from './variant-switcher';
import BackgroundSelector from './background-selector';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

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
}) => {
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		variants.length > 0 && variants[0].id ? variants[0].id : null // Check if variants[0].id exists
	);
	const [selectedBackground, setSelectedBackground] = useState<string>(initialBackground);

	const currentSvgCode = useMemo(() => {
		if (selectedVariantId && variants.length > 0) {
			const selected = variants.find(v => v.id === selectedVariantId);
			return selected ? selected.svgCode : svgCode;
		}
		return svgCode;
	}, [svgCode, variants, selectedVariantId]);

	if (!currentSvgCode) {
		return (
			<Card className={cn('w-full aspect-video flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 shadow-inner', className)}>
				<ImageIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
				<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Logo will appear here</p>
			</Card>
		);
	}

	const isBgColorClass = selectedBackground.startsWith('bg-');
	const backgroundStyle = isBgColorClass ? {} : { backgroundColor: selectedBackground };
	const backgroundClass = isBgColorClass ? selectedBackground : '';

	return (
		<Card className={cn('w-full overflow-hidden shadow-lg', className)}>
			<CardContent
				className={cn(
					'p-6 flex items-center justify-center aspect-video transition-colors duration-200 min-h-[250px] sm:min-h-[300px] md:min-h-[350px]',
					backgroundClass
				)}
				style={backgroundStyle}
			>
				<div
					className="max-w-full max-h-full w-auto h-auto p-2 [&>svg]:max-w-full [&>svg]:max-h-[200px] sm:[&>svg]:max-h-[250px] md:[&>svg]:max-h-[300px] [&>svg]:w-auto [&>svg]:h-auto"
					dangerouslySetInnerHTML={{ __html: currentSvgCode }}
				/>
			</CardContent>
			{(variants.length > 1 || availableBackgrounds.length > 0) && (
				<CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
					{variants.length > 1 && (
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
				</CardFooter>
			)}
		</Card>
	);
};

export default LogoDisplay;
