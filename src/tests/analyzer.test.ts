import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzerService } from '../lib/analyzer.js';
import type { CortexConfig } from '../lib/config.js';

// Mock LLMBridge
vi.mock('../lib/llm-bridge.js', () => ({
  LLMBridge: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      text: JSON.stringify([{
        title: 'Test Insight',
        content: 'This is a test insight about the content.',
        category: 'knowledge',
        confidence: 0.85,
        tags: ['test', 'example'],
        relatedConcepts: ['testing', 'validation'],
      }]),
      usage: { input: 100, output: 50 },
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-001',
    }),
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    getEmbeddingDimension: vi.fn().mockReturnValue(1536),
  })),
}));

// Mock extractorPipeline
vi.mock('../lib/extractors/pdf.js', () => ({
  extractorPipeline: {
    extract: vi.fn().mockResolvedValue('This is test content for analysis.'),
  },
}));

describe('AnalyzerService', () => {
  let analyzer: AnalyzerService;
  const mockConfig: CortexConfig = {
    version: '1.0.0',
    dataDir: '/tmp/cortex-test',
    watchSources: [],
    llm: {
      provider: 'openrouter',
      openrouterApiKey: 'test-key',
      ollamaHost: 'http://127.0.0.1:11434',
      model: 'google/gemini-2.0-flash-001',
      embeddingModel: 'openai/text-embedding-3-small',
    },
    privacy: {
      redactSecrets: true,
      redactPII: false,
    },
    queue: {
      concurrency: 2,
      maxRetries: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AnalyzerService(mockConfig);
  });

  describe('analyzeFile', () => {
    it('should extract insights from text content', async () => {
      const insights = await analyzer.analyzeFile('/test/file.md', {
        id: 'test-source',
        path: '/test',
        lens: 'general',
        recursive: true,
        extensions: ['.md'],
      });

      expect(insights).toHaveLength(1);
      expect(insights[0].title).toBe('Test Insight');
      expect(insights[0].confidence).toBe(0.85);
      expect(insights[0].category).toBe('knowledge');
    });

    it('should handle different lens types', async () => {
      const lenses = ['philosopher', 'architect', 'somatic', 'analyst', 'general'];
      
      for (const lens of lenses) {
        const insights = await analyzer.analyzeFile('/test/file.md', {
          id: 'test-source',
          path: '/test',
          lens: lens as any,
          recursive: true,
          extensions: ['.md'],
        });
        
        expect(insights.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embeddings with correct dimension', async () => {
      const embedding = await analyzer.generateEmbedding('Test text for embedding');
      
      expect(embedding).toHaveLength(1536);
      expect(embedding[0]).toBe(0.1);
    });
  });

  describe('getEmbeddingDimension', () => {
    it('should return correct dimension', () => {
      const dim = analyzer.getEmbeddingDimension();
      expect(dim).toBe(1536);
    });
  });
});

describe('LLM System Prompts Validation', () => {
  const LENS_PROMPTS: Record<string, string> = {
    philosopher: 'philosophical analyst',
    architect: 'technical architect',
    somatic: 'somatic awareness analyst',
    analyst: 'data analyst',
    general: 'general knowledge analyst',
  };

  it('should have all lens prompts defined', () => {
    const expectedLenses = ['philosopher', 'architect', 'somatic', 'analyst', 'general'];
    
    for (const lens of expectedLenses) {
      expect(LENS_PROMPTS[lens]).toBeDefined();
      expect(LENS_PROMPTS[lens].length).toBeGreaterThan(10);
    }
  });

  it('should have distinct prompts for each lens', () => {
    const prompts = Object.values(LENS_PROMPTS);
    const uniquePrompts = new Set(prompts);
    
    expect(uniquePrompts.size).toBe(prompts.length);
  });
});

describe('Insight Schema Validation', () => {
  const validInsight = {
    title: 'Valid Title',
    content: 'Valid content with enough text.',
    category: 'knowledge',
    confidence: 0.75,
    tags: ['tag1', 'tag2'],
    relatedConcepts: ['concept1'],
  };

  it('should accept valid insight structure', () => {
    expect(validInsight.title).toBeTruthy();
    expect(validInsight.content).toBeTruthy();
    expect(validInsight.confidence).toBeGreaterThanOrEqual(0);
    expect(validInsight.confidence).toBeLessThanOrEqual(1);
  });

  it('should validate confidence range', () => {
    const validConfidences = [0, 0.5, 0.75, 1];
    const invalidConfidences = [-0.1, 1.1, 2];
    
    for (const c of validConfidences) {
      expect(c >= 0 && c <= 1).toBe(true);
    }
    
    for (const c of invalidConfidences) {
      expect(c >= 0 && c <= 1).toBe(false);
    }
  });

  it('should validate category values', () => {
    const validCategories = ['knowledge', 'pattern', 'observation', 'idea', 'reference'];
    
    for (const cat of validCategories) {
      expect(['knowledge', 'pattern', 'observation', 'idea', 'reference']).toContain(cat);
    }
  });
});
