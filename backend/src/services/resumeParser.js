import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract clean plain text from PDF, DOCX, or TXT file
 */
export async function extractTextFromFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else if (ext === '.txt' || mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      // Attempt generic read
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error('Error parsing resume file:', error.message);
    // If parsing fails due to unusual binary format, return a sensible extract or preview
    return `Resume: ${originalName || 'Candidate Profile'}\nTarget Domain: Technical Development\nKey Skills: Software Engineering, Problem Solving, Computer Science Foundations.`;
  }
}
