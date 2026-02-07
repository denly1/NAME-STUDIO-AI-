// Smart Diff Algorithm - Intelligent code comparison like Cursor AI

export interface DiffLine {
  lineNumber: number;
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
  content: string;
  newContent?: string;
  newLineNumber?: number;
}

export interface DiffBlock {
  startLine: number;
  endLine: number;
  type: 'unchanged' | 'changed';
  lines: DiffLine[];
}

/**
 * Smart diff algorithm that shows real changes, not just delete+add
 * Handles code wrapping, indentation changes, and refactoring intelligently
 */
export function computeSmartDiff(oldContent: string, newContent: string): DiffBlock[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const diffLines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  // Use LCS (Longest Common Subsequence) for better diff
  const lcs = computeLCS(oldLines, newLines);
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    // Check if lines are in LCS (unchanged)
    if (oldLine && newLine && isInLCS(lcs, oldIndex, newIndex, oldLine, newLine)) {
      diffLines.push({
        lineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
        type: 'unchanged',
        content: oldLine
      });
      oldIndex++;
      newIndex++;
    }
    // Line was deleted
    else if (oldLine && (!newLine || !isInLCS(lcs, oldIndex, newIndex, oldLine, newLine))) {
      // Check if it's a modification (similar content)
      if (newLine && areSimilarLines(oldLine, newLine)) {
        diffLines.push({
          lineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1,
          type: 'modified',
          content: oldLine,
          newContent: newLine
        });
        oldIndex++;
        newIndex++;
      } else {
        diffLines.push({
          lineNumber: oldIndex + 1,
          type: 'deleted',
          content: oldLine
        });
        oldIndex++;
      }
    }
    // Line was added
    else if (newLine) {
      diffLines.push({
        lineNumber: oldIndex,
        newLineNumber: newIndex + 1,
        type: 'added',
        content: newLine
      });
      newIndex++;
    }
  }

  // Group into blocks
  return groupIntoBlocks(diffLines);
}

/**
 * Compute Longest Common Subsequence for better diff accuracy
 */
function computeLCS(arr1: string[], arr2: string[]): Set<string> {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1].trim() === arr2[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs = new Set<string>();
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1].trim() === arr2[j - 1].trim()) {
      lcs.add(`${i - 1}:${j - 1}:${arr1[i - 1]}`);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

function isInLCS(lcs: Set<string>, i: number, j: number, line1: string, line2: string): boolean {
  return lcs.has(`${i}:${j}:${line1}`);
}

/**
 * Check if two lines are similar (likely a modification, not delete+add)
 */
function areSimilarLines(line1: string, line2: string): boolean {
  const trim1 = line1.trim();
  const trim2 = line2.trim();
  
  // Empty lines are not similar
  if (!trim1 || !trim2) return false;
  
  // Calculate similarity ratio
  const similarity = calculateSimilarity(trim1, trim2);
  
  // If more than 40% similar, consider it a modification
  return similarity > 0.4;
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Group diff lines into blocks for better visualization
 */
function groupIntoBlocks(diffLines: DiffLine[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let currentBlock: DiffBlock | null = null;

  for (const line of diffLines) {
    const isChanged = line.type !== 'unchanged';

    if (!currentBlock) {
      currentBlock = {
        startLine: line.lineNumber,
        endLine: line.lineNumber,
        type: isChanged ? 'changed' : 'unchanged',
        lines: [line]
      };
    } else if (currentBlock.type === (isChanged ? 'changed' : 'unchanged')) {
      currentBlock.endLine = line.lineNumber;
      currentBlock.lines.push(line);
    } else {
      blocks.push(currentBlock);
      currentBlock = {
        startLine: line.lineNumber,
        endLine: line.lineNumber,
        type: isChanged ? 'changed' : 'unchanged',
        lines: [line]
      };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Get diff statistics
 */
export function getDiffStats(blocks: DiffBlock[]): {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
} {
  const stats = { added: 0, deleted: 0, modified: 0, unchanged: 0 };

  for (const block of blocks) {
    for (const line of block.lines) {
      stats[line.type === 'unchanged' ? 'unchanged' : line.type]++;
    }
  }

  return stats;
}
