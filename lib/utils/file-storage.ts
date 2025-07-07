// In a real application, we would store files in a database or file storage system
// For this implementation, we'll use an in-memory store with expiration
interface StoredFile {
  buffer: Buffer;
  contentType: string;
  expiresAt: number;
}

// In-memory file storage (would be replaced with proper storage in production)
const fileStorage = new Map<string, StoredFile>();

// File retention period - 24 hours
const FILE_RETENTION_MS = 24 * 60 * 60 * 1000;

// Mime types for different file extensions
const MIME_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  ico: 'image/x-icon',
  html: 'text/html',
  txt: 'text/plain',
  zip: 'application/zip',
};

// Register a file in the storage system
export function storeFile(fileName: string, buffer: Buffer): string {
  const fileId = `${Date.now()}-${fileName}`;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  fileStorage.set(fileId, {
    buffer,
    contentType: MIME_TYPES[extension] || 'application/octet-stream',
    expiresAt: Date.now() + FILE_RETENTION_MS,
  });

  // Clean up expired files (could be moved to a background task in production)
  cleanupExpiredFiles();

  return fileId;
}

// Retrieve a file from the storage system
export function getFile(fileId: string): StoredFile | null {
  const file = fileStorage.get(fileId);

  if (!file) {
    return null;
  }

  if (Date.now() > file.expiresAt) {
    fileStorage.delete(fileId);
    return null;
  }

  return file;
}

// Clean up expired files
function cleanupExpiredFiles(): void {
  const now = Date.now();
  for (const [fileId, file] of fileStorage.entries()) {
    if (now > file.expiresAt) {
      fileStorage.delete(fileId);
    }
  }
}
