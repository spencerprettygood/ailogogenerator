#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running app structure fix script...');

// Function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
};

// Root directory
const rootDir = path.resolve(__dirname, '..');
const backupDir = path.join(rootDir, 'app-backup');
const srcDir = path.join(rootDir, 'src');
const appDir = path.join(rootDir, 'app');
const appConsolidatedDir = path.join(rootDir, 'app-consolidated');
const stylesDir = path.join(rootDir, 'styles');

console.log(`Root directory: ${rootDir}`);

// Step 1: Back up the current app directory if it exists
if (directoryExists(appDir) && !directoryExists(backupDir)) {
  console.log('Backing up current app directory...');
  fs.mkdirSync(backupDir, { recursive: true });
  
  try {
    // Copy all files from app to app-backup
    execSync(`cp -R ${appDir}/* ${backupDir}/`);
    console.log('Backup completed successfully');
  } catch (err) {
    console.error('Error backing up app directory:', err);
  }
}

// Step 2: Replace app with app-consolidated if it exists
if (directoryExists(appConsolidatedDir)) {
  console.log('Replacing app directory with consolidated version...');
  
  try {
    // Remove current app directory
    if (directoryExists(appDir)) {
      execSync(`rm -rf ${appDir}`);
    }
    
    // Create new app directory
    fs.mkdirSync(appDir, { recursive: true });
    
    // Copy consolidated version to app
    execSync(`cp -R ${appConsolidatedDir}/* ${appDir}/`);
    console.log('App directory replaced successfully');
    
    // Remove redundant CSS files in other locations
    const redundantCssFiles = [
      path.join(srcDir, 'app', 'globals.css'),
      path.join(stylesDir, 'globals.css')
    ];
    
    redundantCssFiles.forEach(cssFile => {
      if (fileExists(cssFile)) {
        console.log(`Removing redundant CSS file: ${cssFile}`);
        fs.unlinkSync(cssFile);
      }
    });
    
    // Create or update src/app directory structure (needed for Next.js)
    const srcAppDir = path.join(srcDir, 'app');
    if (!directoryExists(srcAppDir)) {
      console.log('Creating src/app directory structure...');
      fs.mkdirSync(srcAppDir, { recursive: true });
    }
    
    // Create a placeholder file that points to the main globals.css
    const placeholderCss = `/* 
 * This is a placeholder file.
 * The actual global styles are now maintained in /app/globals.css 
 * This file remains for compatibility with existing imports.
 */
 
@import '../../app/globals.css';
`;
    fs.writeFileSync(path.join(srcAppDir, 'globals.css'), placeholderCss);
    console.log('Created placeholder CSS file in src/app');
    
    // Create compatibility layout.tsx file
    const compatibilityLayout = `// This is a compatibility file that imports the main CSS
// The main implementation is in /app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional-quality logos with AI',
};

import MainLayout from '../../app/layout';
export default MainLayout;`;
    
    fs.writeFileSync(path.join(srcAppDir, 'layout.tsx'), compatibilityLayout);
    console.log('Created compatibility layout file in src/app');
    
    // Create compatibility page.tsx file
    const compatibilityPage = `'use client'

// This is a compatibility file that re-exports the main page component
// The main implementation is in /app/page.tsx

import MainPage from '../../app/page';

export default MainPage;`;
    
    fs.writeFileSync(path.join(srcAppDir, 'page.tsx'), compatibilityPage);
    console.log('Created compatibility page file in src/app');
  } catch (err) {
    console.error('Error replacing app directory:', err);
  }
}

// Step 3: Handle the styles directory
if (directoryExists(stylesDir)) {
  console.log('Handling styles directory...');
  try {
    // If globals.css exists in styles directory, ensure it's removed
    const stylesGlobalsCss = path.join(stylesDir, 'globals.css');
    if (fileExists(stylesGlobalsCss)) {
      console.log('Removing redundant globals.css from styles directory...');
      fs.unlinkSync(stylesGlobalsCss);
    }
    
    // Create a placeholder file in the styles directory
    const placeholderCss = `/* 
 * This is a placeholder file.
 * The actual global styles are now maintained in /app/globals.css 
 * This file remains for compatibility with existing imports.
 */
 
@import '../app/globals.css';
`;
    fs.writeFileSync(stylesGlobalsCss, placeholderCss);
    console.log('Created placeholder CSS file in styles directory');
  } catch (err) {
    console.error('Error handling styles directory:', err);
  }
}

// Step 4: Clean .next directory to ensure clean build
const nextDir = path.join(rootDir, '.next');
if (directoryExists(nextDir)) {
  console.log('Cleaning .next directory...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('.next directory cleaned');
  } catch (err) {
    console.error('Error cleaning .next directory:', err);
  }
}

console.log('App structure fix completed!');