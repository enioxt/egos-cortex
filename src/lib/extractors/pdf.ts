import { readFile } from 'fs/promises';
import { extname } from 'path';

export interface Extractor {
  supports(extension: string): boolean;
  extract(filePath: string): Promise<string>;
}

export class TextExtractor implements Extractor {
  private textExtensions = ['.txt', '.md', '.json', '.yaml', '.yml', '.ts', '.js', '.py', '.sh', '.css', '.html'];

  supports(extension: string): boolean {
    return this.textExtensions.includes(extension.toLowerCase());
  }

  async extract(filePath: string): Promise<string> {
    return readFile(filePath, 'utf-8');
  }
}

export class PdfExtractor implements Extractor {
  supports(extension: string): boolean {
    return extension.toLowerCase() === '.pdf';
  }

  async extract(filePath: string): Promise<string> {
    try {
      // Dynamic import to avoid loading if not needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import('pdf-parse') as any;
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const buffer = await readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.warn(`PDF extraction failed for ${filePath}:`, error);
      return '';
    }
  }
}

export class DocxExtractor implements Extractor {
  supports(extension: string): boolean {
    return extension.toLowerCase() === '.docx';
  }

  async extract(filePath: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammothModule = await import('mammoth') as any;
      const mammoth = mammothModule.default ?? mammothModule;
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.warn(`DOCX extraction failed for ${filePath}:`, error);
      return '';
    }
  }
}

export class ExtractorPipeline {
  private extractors: Extractor[] = [
    new TextExtractor(),
    new PdfExtractor(),
    new DocxExtractor(),
  ];

  async extract(filePath: string): Promise<string> {
    const ext = extname(filePath).toLowerCase();
    
    for (const extractor of this.extractors) {
      if (extractor.supports(ext)) {
        try {
          return await extractor.extract(filePath);
        } catch (error) {
          console.warn(`Extraction failed with ${extractor.constructor.name}:`, error);
        }
      }
    }
    
    // Fallback: try reading as text
    try {
      return await readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  addExtractor(extractor: Extractor): void {
    this.extractors.push(extractor);
  }
}

export const extractorPipeline = new ExtractorPipeline();
