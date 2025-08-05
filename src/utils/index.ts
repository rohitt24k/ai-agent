import fs from "fs/promises";

/**
 * Clean up uploaded file
 */
export async function cleanupFile(filePath: string) {
  try {
    await fs.unlink(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
}
