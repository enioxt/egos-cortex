import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { TextExtractor, PdfExtractor, DocxExtractor, ExtractorPipeline } from '../lib/extractors/pdf.js';

describe('Extractors', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `cortex-extractor-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('TextExtractor', () => {
    const extractor = new TextExtractor();

    it('should support common text extensions', () => {
      const supportedExtensions = ['.txt', '.md', '.json', '.yaml', '.yml', '.ts', '.js', '.py', '.sh', '.css', '.html'];
      
      for (const ext of supportedExtensions) {
        expect(extractor.supports(ext)).toBe(true);
      }
    });

    it('should not support binary extensions', () => {
      const unsupportedExtensions = ['.pdf', '.docx', '.exe', '.zip', '.png'];
      
      for (const ext of unsupportedExtensions) {
        expect(extractor.supports(ext)).toBe(false);
      }
    });

    it('should extract text from .txt file', async () => {
      const testFile = join(testDir, 'test.txt');
      const content = 'Hello, Cortex! This is a test file.';
      await writeFile(testFile, content);

      const extracted = await extractor.extract(testFile);
      expect(extracted).toBe(content);
    });

    it('should extract text from .md file', async () => {
      const testFile = join(testDir, 'test.md');
      const content = '# Markdown Title\n\nThis is **bold** text.';
      await writeFile(testFile, content);

      const extracted = await extractor.extract(testFile);
      expect(extracted).toBe(content);
    });

    it('should extract JSON content', async () => {
      const testFile = join(testDir, 'test.json');
      const content = JSON.stringify({ key: 'value', nested: { a: 1 } }, null, 2);
      await writeFile(testFile, content);

      const extracted = await extractor.extract(testFile);
      expect(JSON.parse(extracted)).toEqual({ key: 'value', nested: { a: 1 } });
    });
  });

  describe('PdfExtractor', () => {
    const extractor = new PdfExtractor();

    it('should support .pdf extension', () => {
      expect(extractor.supports('.pdf')).toBe(true);
      expect(extractor.supports('.PDF')).toBe(true);
    });

    it('should not support other extensions', () => {
      expect(extractor.supports('.txt')).toBe(false);
      expect(extractor.supports('.docx')).toBe(false);
    });

    it('should handle invalid PDF gracefully', async () => {
      const testFile = join(testDir, 'invalid.pdf');
      await writeFile(testFile, 'This is not a real PDF');

      const extracted = await extractor.extract(testFile);
      expect(extracted).toBe('');
    });
  });

  describe('DocxExtractor', () => {
    const extractor = new DocxExtractor();

    it('should support .docx extension', () => {
      expect(extractor.supports('.docx')).toBe(true);
      expect(extractor.supports('.DOCX')).toBe(true);
    });

    it('should not support other extensions', () => {
      expect(extractor.supports('.doc')).toBe(false);
      expect(extractor.supports('.txt')).toBe(false);
    });

    it('should handle invalid DOCX gracefully', async () => {
      const testFile = join(testDir, 'invalid.docx');
      await writeFile(testFile, 'This is not a real DOCX');

      const extracted = await extractor.extract(testFile);
      expect(extracted).toBe('');
    });
  });

  describe('ExtractorPipeline', () => {
    const pipeline = new ExtractorPipeline();

    it('should extract text files through pipeline', async () => {
      const testFile = join(testDir, 'pipeline.txt');
      const content = 'Pipeline test content';
      await writeFile(testFile, content);

      const extracted = await pipeline.extract(testFile);
      expect(extracted).toBe(content);
    });

    it('should extract markdown files through pipeline', async () => {
      const testFile = join(testDir, 'pipeline.md');
      const content = '# Title\n\nParagraph content.';
      await writeFile(testFile, content);

      const extracted = await pipeline.extract(testFile);
      expect(extracted).toBe(content);
    });

    it('should fallback for unknown extensions', async () => {
      const testFile = join(testDir, 'unknown.xyz');
      const content = 'Unknown extension content';
      await writeFile(testFile, content);

      const extracted = await pipeline.extract(testFile);
      expect(extracted).toBe(content);
    });

    it('should handle non-existent file gracefully', async () => {
      const extracted = await pipeline.extract('/nonexistent/file.txt');
      expect(extracted).toBe('');
    });
  });
});

describe('Extractor Edge Cases', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `cortex-edge-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch {
      // Ignore
    }
  });

  it('should handle empty files', async () => {
    const pipeline = new ExtractorPipeline();
    const testFile = join(testDir, 'empty.txt');
    await writeFile(testFile, '');

    const extracted = await pipeline.extract(testFile);
    expect(extracted).toBe('');
  });

  it('should handle large files', async () => {
    const pipeline = new ExtractorPipeline();
    const testFile = join(testDir, 'large.txt');
    const largeContent = 'x'.repeat(100000); // 100KB
    await writeFile(testFile, largeContent);

    const extracted = await pipeline.extract(testFile);
    expect(extracted.length).toBe(100000);
  });

  it('should handle files with special characters', async () => {
    const pipeline = new ExtractorPipeline();
    const testFile = join(testDir, 'special.txt');
    const content = 'Olá! 你好! مرحبا! 🚀 \n\t\r Special chars: <>&"\'';
    await writeFile(testFile, content);

    const extracted = await pipeline.extract(testFile);
    expect(extracted).toBe(content);
  });

  it('should handle UTF-8 content correctly', async () => {
    const pipeline = new ExtractorPipeline();
    const testFile = join(testDir, 'utf8.txt');
    const content = 'Émojis: 🧠💡🔍 Acentos: áéíóú ñ ç';
    await writeFile(testFile, content);

    const extracted = await pipeline.extract(testFile);
    expect(extracted).toBe(content);
  });
});
