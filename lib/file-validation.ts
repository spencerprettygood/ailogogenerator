export interface FileValidationRule {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxCount: number;
}

export const imageValidationRules: FileValidationRule = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxCount: 3
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFiles(files: File[], rules: FileValidationRule): ValidationResult {
  const errors: string[] = [];
  
  if (files.length > rules.maxCount) {
    errors.push(`Maximum ${rules.maxCount} files allowed`);
  }
  
  for (const file of files) {
    if (file.size > rules.maxSize) {
      errors.push(`File "${file.name}" is too large (max ${formatFileSize(rules.maxSize)})`);
    }
    
    if (!rules.allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}" has unsupported type (${file.type})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
