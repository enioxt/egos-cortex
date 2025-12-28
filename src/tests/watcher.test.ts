import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WatcherManager } from '../lib/watcher.js';
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('WatcherManager', () => {
  let watcher: WatcherManager;
  let tempDir: string;

  beforeEach(async () => {
    watcher = new WatcherManager();
    tempDir = await mkdtemp(join(tmpdir(), 'cortex-test-'));
  });

  afterEach(async () => {
    await watcher.shutdown();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should initialize without watchers', () => {
    expect(watcher.getActiveWatchers()).toHaveLength(0);
  });

  it('should add a watch source', async () => {
    await watcher.addSource({
      id: 'test',
      path: tempDir,
      lens: 'general',
      recursive: true,
      extensions: ['.txt'],
    });

    expect(watcher.getActiveWatchers()).toContain('test');
  });

  it('should emit file events', async () => {
    const events: string[] = [];

    watcher.on('file', (event) => {
      events.push(event.type);
    });

    await watcher.addSource({
      id: 'test',
      path: tempDir,
      lens: 'general',
      recursive: true,
      extensions: ['.txt'],
    });

    // Wait for watcher to be ready
    await new Promise((resolve) => watcher.once('ready', resolve));

    // Create a test file
    const testFile = join(tempDir, 'test.txt');
    await writeFile(testFile, 'hello world');

    // Wait for event
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(events).toContain('add');
  });

  it('should filter by extension', async () => {
    const events: string[] = [];

    watcher.on('file', (event) => {
      events.push(event.path);
    });

    await watcher.addSource({
      id: 'test',
      path: tempDir,
      lens: 'general',
      recursive: true,
      extensions: ['.md'],
    });

    await new Promise((resolve) => watcher.once('ready', resolve));

    // Create files
    await writeFile(join(tempDir, 'test.txt'), 'ignored');
    await writeFile(join(tempDir, 'test.md'), 'included');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(events.some(p => p.endsWith('.md'))).toBe(true);
    expect(events.some(p => p.endsWith('.txt'))).toBe(false);
  });

  it('should remove a watch source', async () => {
    await watcher.addSource({
      id: 'test',
      path: tempDir,
      lens: 'general',
      recursive: true,
      extensions: [],
    });

    expect(watcher.getActiveWatchers()).toContain('test');

    await watcher.removeSource('test');

    expect(watcher.getActiveWatchers()).not.toContain('test');
  });

  it('should reload sources', async () => {
    await watcher.addSource({
      id: 'old',
      path: tempDir,
      lens: 'general',
      recursive: true,
      extensions: [],
    });

    const newDir = await mkdtemp(join(tmpdir(), 'cortex-new-'));

    await watcher.reload([
      {
        id: 'new',
        path: newDir,
        lens: 'philosopher',
        recursive: false,
        extensions: ['.md'],
      },
    ]);

    expect(watcher.getActiveWatchers()).not.toContain('old');
    expect(watcher.getActiveWatchers()).toContain('new');

    await rm(newDir, { recursive: true, force: true });
  });
});
