import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  hashFile,
  quickFingerprint,
  deepFingerprint,
  initDedupTable,
  isDuplicate,
  hasChanged,
  saveFileHash,
  removeFileHash,
  findDuplicates,
} from '../lib/dedup.js';

describe('Deduplication Module', () => {
  let db: Database.Database;
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');
    initDedupTable(db);

    // Create test file
    testDir = join(tmpdir(), `cortex-dedup-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    testFile = join(testDir, 'test.txt');
    await writeFile(testFile, 'Hello, Cortex!');
  });

  afterEach(async () => {
    db.close();
    try {
      await unlink(testFile);
    } catch {
      // Ignore
    }
  });

  describe('hashFile', () => {
    it('should generate consistent SHA256 hash', async () => {
      const hash1 = await hashFile(testFile);
      const hash2 = await hashFile(testFile);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex length
    });

    it('should generate different hash for different content', async () => {
      const hash1 = await hashFile(testFile);
      
      await writeFile(testFile, 'Different content');
      const hash2 = await hashFile(testFile);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('quickFingerprint', () => {
    it('should return file metadata', async () => {
      const fp = await quickFingerprint(testFile);
      
      expect(fp.path).toBe(testFile);
      expect(fp.hash).toHaveLength(64);
      expect(fp.size).toBeGreaterThan(0);
      expect(fp.mtime).toBeInstanceOf(Date);
    });
  });

  describe('deepFingerprint', () => {
    it('should return content-based hash', async () => {
      const fp = await deepFingerprint(testFile);
      const contentHash = await hashFile(testFile);
      
      expect(fp.hash).toBe(contentHash);
    });
  });

  describe('isDuplicate', () => {
    it('should return false for new content', () => {
      const result = isDuplicate(db, 'abc123');
      expect(result).toBe(false);
    });

    it('should return true for existing content', () => {
      saveFileHash(db, {
        path: '/some/file.txt',
        hash: 'abc123',
        size: 100,
        mtime: new Date(),
      });

      const result = isDuplicate(db, 'abc123');
      expect(result).toBe(true);
    });

    it('should exclude specified path', () => {
      saveFileHash(db, {
        path: '/some/file.txt',
        hash: 'abc123',
        size: 100,
        mtime: new Date(),
      });

      // Same hash, same path = not duplicate
      const result = isDuplicate(db, 'abc123', '/some/file.txt');
      expect(result).toBe(false);
    });
  });

  describe('hasChanged', () => {
    it('should return true for new file', () => {
      const result = hasChanged(db, '/new/file.txt', 'newhash');
      expect(result).toBe(true);
    });

    it('should return false for unchanged file', () => {
      saveFileHash(db, {
        path: '/some/file.txt',
        hash: 'samehash',
        size: 100,
        mtime: new Date(),
      });

      const result = hasChanged(db, '/some/file.txt', 'samehash');
      expect(result).toBe(false);
    });

    it('should return true for changed file', () => {
      saveFileHash(db, {
        path: '/some/file.txt',
        hash: 'oldhash',
        size: 100,
        mtime: new Date(),
      });

      const result = hasChanged(db, '/some/file.txt', 'newhash');
      expect(result).toBe(true);
    });
  });

  describe('findDuplicates', () => {
    it('should find all paths with same hash', () => {
      const hash = 'duplicatehash';
      
      saveFileHash(db, { path: '/file1.txt', hash, size: 100, mtime: new Date() });
      saveFileHash(db, { path: '/file2.txt', hash, size: 100, mtime: new Date() });
      saveFileHash(db, { path: '/file3.txt', hash: 'different', size: 100, mtime: new Date() });

      const duplicates = findDuplicates(db, hash);
      
      expect(duplicates).toHaveLength(2);
      expect(duplicates).toContain('/file1.txt');
      expect(duplicates).toContain('/file2.txt');
    });
  });

  describe('removeFileHash', () => {
    it('should remove file hash from database', () => {
      saveFileHash(db, {
        path: '/some/file.txt',
        hash: 'abc123',
        size: 100,
        mtime: new Date(),
      });

      expect(isDuplicate(db, 'abc123')).toBe(true);
      
      removeFileHash(db, '/some/file.txt');
      
      expect(isDuplicate(db, 'abc123')).toBe(false);
    });
  });
});
