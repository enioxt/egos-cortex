-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "inode" BIGINT,
    "hash" TEXT,
    "size" INTEGER,
    "lens" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lens" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.8,
    "metadata" TEXT,
    "sourceFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Insight_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromInsightId" TEXT NOT NULL,
    "toInsightId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InsightLink_fromInsightId_fkey" FOREIGN KEY ("fromInsightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InsightLink_toInsightId_fkey" FOREIGN KEY ("toInsightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "command" TEXT NOT NULL,
    "cwd" TEXT,
    "exitCode" INTEGER,
    "output" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProcessingQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceFile_path_key" ON "SourceFile"("path");

-- CreateIndex
CREATE INDEX "SourceFile_inode_idx" ON "SourceFile"("inode");

-- CreateIndex
CREATE INDEX "SourceFile_status_idx" ON "SourceFile"("status");

-- CreateIndex
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");

-- CreateIndex
CREATE INDEX "Insight_category_idx" ON "Insight"("category");

-- CreateIndex
CREATE INDEX "Insight_lens_idx" ON "Insight"("lens");

-- CreateIndex
CREATE INDEX "Insight_sourceFileId_idx" ON "Insight"("sourceFileId");

-- CreateIndex
CREATE INDEX "InsightLink_fromInsightId_idx" ON "InsightLink"("fromInsightId");

-- CreateIndex
CREATE INDEX "InsightLink_toInsightId_idx" ON "InsightLink"("toInsightId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightLink_fromInsightId_toInsightId_key" ON "InsightLink"("fromInsightId", "toInsightId");

-- CreateIndex
CREATE INDEX "CommandHistory_createdAt_idx" ON "CommandHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ProcessingQueue_status_idx" ON "ProcessingQueue"("status");

-- CreateIndex
CREATE INDEX "ProcessingQueue_priority_idx" ON "ProcessingQueue"("priority");
