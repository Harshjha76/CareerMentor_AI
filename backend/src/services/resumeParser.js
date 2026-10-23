import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { performDocumentOCR } from './aiService.js';

/**
 * Clean and normalize text extracted from documents.
 * Cleans multi-column breakages, hyphenated word wraps, and unicode artifacts.
 */
export function normalizeExtractedText(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  // Normalize linebreaks and non-breaking spaces
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00A0/g, ' ');
  // Remove null bytes and non-printable control characters (except tabs and newlines)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Re-join words broken across linebreaks with hyphens (e.g., "engi-\nneering" -> "engineering")
  text = text.replace(/([a-zA-Z]+)-\n([a-zA-Z]+)/g, '$1$2');
  // Collapse 3+ consecutive newlines into 2
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * Extract clean plain text from PDF, DOCX, or TXT file.
 * Handles single/two-column layouts, tables, and falls back to Gemini OCR for scanned PDFs.
 */
export async function extractTextFromFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      let parsedText = '';
      try {
        const data = await pdfParse(dataBuffer);
        parsedText = data.text || '';
      } catch (pdfErr) {
        console.warn('pdf-parse encountered error, attempting OCR fallback:', pdfErr.message);
      }

      const cleaned = normalizeExtractedText(parsedText);

      // If pdf-parse extracted sufficient text (>= 50 readable chars), return it
      if (cleaned.length >= 50) {
        return cleaned;
      }

      console.log(`📄 PDF text is sparse (${cleaned.length} chars). Invoking Gemini multimodal OCR...`);
      // Fallback: scanned or image PDF -> Gemini Vision / Document OCR
      const ocrText = await performDocumentOCR(dataBuffer, 'application/pdf');
      if (ocrText && normalizeExtractedText(ocrText).length >= 20) {
        console.log(`✨ Successfully extracted ${ocrText.length} characters via Gemini OCR`);
        return normalizeExtractedText(ocrText);
      }

      if (cleaned.length > 0) {
        return cleaned;
      }

      throw new Error('This PDF has no readable text and OCR could not extract any content. Please upload a text-based PDF, DOCX, or TXT file.');
    } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      const cleaned = normalizeExtractedText(result.value || '');
      if (!cleaned || cleaned.length < 10) {
        throw new Error('DOCX file is empty or could not be read.');
      }
      return cleaned;
    } else if (ext === '.txt' || mimeType === 'text/plain') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const cleaned = normalizeExtractedText(content);
      if (!cleaned || cleaned.length < 10) {
        throw new Error('TXT file is empty or contains insufficient text.');
      }
      return cleaned;
    } else {
      // Attempt generic utf-8 read
      const content = fs.readFileSync(filePath, 'utf-8');
      return normalizeExtractedText(content);
    }
  } catch (error) {
    console.error('Error parsing resume file:', error.message);
    throw error;
  }
}
