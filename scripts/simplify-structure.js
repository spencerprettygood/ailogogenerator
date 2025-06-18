#!/usr/bin/env node

// This script simplifies the project structure by removing unnecessary directories
// and cleaning up the build cache

const fs = require('fs');
const path = require('path');
// We're keeping execSync even if unused for potential future use
const { execSync } = require('child_process');

console.log('Running structure simplification script...');

// Root directory
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
// We keep srcAppDir for reference even if unused currently
const srcAppDir = path.join(srcDir, 'app');
const stylesDir = path.join(rootDir, 'styles');
const nextDir = path.join(rootDir, '.next');

// Function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (_err) {
    // Error is not used, prefix with underscore
    return false;
  }
};

// Function to check if a file exists
// We keep this even if currently unused as it's part of the API
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_err) {
    // Error is not used, prefix with underscore
    return false;
  }
};

// Remove src directory completely if empty or just contains empty subdirectories
if (directoryExists(srcDir)) {
  console.log('Checking src directory...');
  try {
    // Check if src directory is empty or just has empty subdirectories
    const removeDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      if (files.length === 0) {
        return true; // Directory is empty, can be removed
      }
      
      // Check if all subdirectories are empty
      let allEmpty = true;
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          if (!removeDir(fullPath)) {
            allEmpty = false;
          }
        } else {
          // Contains a file, not empty
          allEmpty = false;
        }
      }
      
      if (allEmpty) {
        // All subdirectories are empty, remove them
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`Removed empty directory: ${fullPath}`);
          }
        }
        return true; // Now this directory is empty
      }
      
      return false; // Directory has content
    };
    
    if (removeDir(srcDir)) {
      fs.rmSync(srcDir, { recursive: true, force: true });
      console.log('Removed empty src directory');
    } else {
      console.log('src directory contains files, keeping it');
    }
  } catch (error) {
    console.error('Error handling src directory:', error);
  }
}

// Remove styles directory if it only contains the globals.css placeholder
if (directoryExists(stylesDir)) {
  console.log('Checking styles directory...');
  try {
    const stylesFiles = fs.readdirSync(stylesDir);
    if (stylesFiles.length === 1 && stylesFiles[0] === 'globals.css') {
      console.log('Removing styles directory (only contains globals.css placeholder)...');
      fs.rmSync(stylesDir, { recursive: true, force: true });
      console.log('styles directory removed successfully');
    }
  } catch (error) {
    console.error('Error handling styles directory:', error);
  }
}

// Clean .next directory to ensure clean build
if (directoryExists(nextDir)) {
  console.log('Cleaning .next directory...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('.next directory cleaned');
  } catch (error) {
    console.error('Error cleaning .next directory:', error);
  }
}

console.log('Structure simplification completed!');