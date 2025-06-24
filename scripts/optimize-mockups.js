#!/usr/bin/env node

/**
 * Mockup Optimization Script
 * 
 * This script helps optimize background images and test mockup performance.
 * It's used for development and testing purposes.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const BACKGROUNDS_DIR = path.join(__dirname, '../public/assets/mockups/backgrounds');
const PREVIEWS_DIR = path.join(__dirname, '../public/assets/mockups/backgrounds/previews');
const MOCKUP_TYPES = [
  'business_card',
  'website',
  'tshirt',
  'storefront',
  'social_media',
  'mobile_app',
  'packaging',
  'letterhead',
  'billboard',
  'email_signature',
  'favicon'
];

// Create directories if they don't exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(BACKGROUNDS_DIR)) {
    fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true });
    console.log(`Created directory: ${BACKGROUNDS_DIR}`);
  }
  
  if (!fs.existsSync(PREVIEWS_DIR)) {
    fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
    console.log(`Created directory: ${PREVIEWS_DIR}`);
  }
  
  // Create placeholder files for each mockup type
  MOCKUP_TYPES.forEach(type => {
    const placeholderPath = path.join(BACKGROUNDS_DIR, `placeholder-${type}.jpg`);
    if (!fs.existsSync(placeholderPath)) {
      fs.writeFileSync(placeholderPath, `<!-- Placeholder for ${type} background -->`);
      console.log(`Created placeholder: ${placeholderPath}`);
    }
  });
}

// Check for missing thumbnails
function checkMissingThumbnails() {
  const backgrounds = fs.readdirSync(BACKGROUNDS_DIR)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
    .filter(file => !file.startsWith('placeholder-'));
  
  const thumbnails = fs.readdirSync(PREVIEWS_DIR)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
  
  console.log('\nChecking for missing thumbnails:');
  
  let missingCount = 0;
  
  backgrounds.forEach(background => {
    const baseName = path.basename(background, path.extname(background));
    const expectedThumbName = `${baseName}-thumb${path.extname(background)}`;
    
    if (!thumbnails.includes(expectedThumbName)) {
      console.log(`Missing thumbnail for: ${background}`);
      
      // Create a placeholder thumbnail
      const placeholderPath = path.join(PREVIEWS_DIR, expectedThumbName);
      fs.writeFileSync(placeholderPath, `<!-- Placeholder thumbnail for ${background} -->`);
      console.log(`Created placeholder thumbnail: ${placeholderPath}`);
      
      missingCount++;
    }
  });
  
  if (missingCount === 0) {
    console.log('All thumbnails are present.');
  } else {
    console.log(`Created ${missingCount} placeholder thumbnails.`);
  }
}

// Update the registry with any new background images
function updateRegistry() {
  console.log('\nChecking for backgrounds that need to be added to the registry:');
  
  const registryPath = path.join(__dirname, '../lib/mockups/background-image-registry.ts');
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  
  const backgrounds = fs.readdirSync(BACKGROUNDS_DIR)
    .filter(file => (file.endsWith('.jpg') || file.endsWith('.png')) && !file.startsWith('placeholder-'));
  
  let missingFromRegistry = 0;
  
  backgrounds.forEach(background => {
    const baseName = path.basename(background, path.extname(background));
    
    if (!registryContent.includes(`id: '${baseName}'`)) {
      console.log(`Background not in registry: ${background}`);
      missingFromRegistry++;
    }
  });
  
  if (missingFromRegistry === 0) {
    console.log('All backgrounds are in the registry.');
  } else {
    console.log(`Found ${missingFromRegistry} backgrounds missing from registry.`);
    console.log('Please add them to background-image-registry.ts manually with appropriate metadata.');
  }
}

// Run performance tests in the browser
function runPerformanceTests() {
  console.log('\nTo run performance tests, please:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open your browser to: http://localhost:3000/test-mockups');
  console.log('3. Use the Performance Test tab to benchmark rendering performance.');
}

// Main function
function main() {
  console.log('=== AI Logo Generator: Mockup Optimization Script ===\n');
  
  // Ensure directories exist
  ensureDirectoriesExist();
  
  // Check for missing thumbnails
  checkMissingThumbnails();
  
  // Update registry
  updateRegistry();
  
  // Run performance tests
  runPerformanceTests();
  
  console.log('\nOptimization checks complete!');
}

// Run the script
main();