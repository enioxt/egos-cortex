import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMBridge, estimateTokens, LLMError } from '../lib/llm-bridge.js';

describe('LLMBridge', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      expect(estimateTokens('hello')).toBe(2); // 5 chars / 4 = 1.25 -> 2
      expect(estimateTokens('hello world')).toBe(3); // 11 chars / 4 = 2.75 -> 3
      expect(estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000);
      expect(estimateTokens(longText)).toBe(250);
    });
  });

  describe('OpenRouterProvider', () => {
    it('should throw if API key is missing', () => {
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      
      expect(() => new LLMBridge()).toThrow('OPENROUTER_API_KEY is required');
      
      process.env.OPENROUTER_API_KEY = originalKey;
    });

    it('should create instance with API key', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const bridge = new LLMBridge();
      expect(bridge).toBeDefined();
    });

    it('should return correct embedding dimension', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const bridge = new LLMBridge();
      expect(bridge.getEmbeddingDimension()).toBe(1536);
    });
  });
});

describe('Privacy', () => {
  // Import dynamically to avoid module issues
  it('should redact AWS keys', async () => {
    const { redactSecrets } = await import('../lib/privacy.js');
    const content = 'My AWS key is AKIAIOSFODNN7EXAMPLE';
    const redacted = redactSecrets(content);
    expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(redacted).toContain('[REDACTED]');
  });

  it('should redact GitHub tokens', async () => {
    const { redactSecrets } = await import('../lib/privacy.js');
    const content = 'Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const redacted = redactSecrets(content);
    expect(redacted).toContain('[REDACTED]');
  });

  it('should detect secrets', async () => {
    const { scanForSecrets } = await import('../lib/privacy.js');
    const content = 'AWS: AKIAIOSFODNN7EXAMPLE and -----BEGIN RSA PRIVATE KEY-----';
    const findings = scanForSecrets(content);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.pattern === 'AWS Access Key')).toBe(true);
  });
});

describe('Config', () => {
  it('should load default config when none exists', async () => {
    const { loadConfig } = await import('../lib/config.js');
    const config = await loadConfig();
    expect(config).toBeDefined();
    expect(config.version).toBeDefined();
    expect(config.watchSources).toBeInstanceOf(Array);
  });
});
