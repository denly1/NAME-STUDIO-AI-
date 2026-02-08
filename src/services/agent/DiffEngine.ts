// Diff Engine - генерация Virtual Patch и inline diff model
// НЕ применяет изменения, только создает модель для preview

import { eventBus, AgentEventType } from './EventBus';

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileDiff {
  path: string;
  action: 'create' | 'edit' | 'delete';
  oldContent?: string;
  newContent?: string;
  hunks: DiffHunk[];
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
}

export interface VirtualPatch {
  id: string;
  sessionId: string;
  files: FileDiff[];
  totalAdded: number;
  totalRemoved: number;
  totalModified: number;
  totalFiles: number;
  timestamp: number;
}

export class DiffEngine {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Generate diff from file changes
  generateDiff(changes: Array<{
    path: string;
    action: 'create' | 'edit' | 'delete';
    oldContent?: string;
    newContent?: string;
  }>): VirtualPatch {
    eventBus.emit(AgentEventType.DIFF_GENERATING, this.sessionId, {
      filesCount: changes.length
    });

    const fileDiffs: FileDiff[] = changes.map(change => {
      if (change.action === 'create') {
        return this.createFileDiff(change.path, '', change.newContent || '');
      } else if (change.action === 'delete') {
        return this.createFileDiff(change.path, change.oldContent || '', '');
      } else {
        return this.createFileDiff(
          change.path,
          change.oldContent || '',
          change.newContent || ''
        );
      }
    });

    let totalAdded = 0;
    let totalRemoved = 0;
    let totalModified = 0;

    fileDiffs.forEach(diff => {
      totalAdded += diff.addedLines;
      totalRemoved += diff.removedLines;
      totalModified += diff.modifiedLines;
    });

    const patch: VirtualPatch = {
      id: `patch-${Date.now()}`,
      sessionId: this.sessionId,
      files: fileDiffs,
      totalAdded,
      totalRemoved,
      totalModified,
      totalFiles: fileDiffs.length,
      timestamp: Date.now()
    };

    eventBus.emit(AgentEventType.DIFF_CREATED, this.sessionId, patch);

    console.log(
      `[Diff Engine] Generated patch: ${patch.totalFiles} files, +${totalAdded} -${totalRemoved}`
    );

    return patch;
  }

  // Create diff for single file
  private createFileDiff(path: string, oldContent: string, newContent: string): FileDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const hunks = this.computeHunks(oldLines, newLines);

    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    hunks.forEach(hunk => {
      hunk.lines.forEach(line => {
        if (line.type === 'add') addedLines++;
        else if (line.type === 'remove') removedLines++;
      });
    });

    // Determine action
    let action: 'create' | 'edit' | 'delete';
    if (oldContent === '' && newContent !== '') {
      action = 'create';
    } else if (oldContent !== '' && newContent === '') {
      action = 'delete';
    } else {
      action = 'edit';
    }

    return {
      path,
      action,
      oldContent,
      newContent,
      hunks,
      addedLines,
      removedLines,
      modifiedLines
    };
  }

  // Compute diff hunks using simple line-by-line comparison
  private computeHunks(oldLines: string[], newLines: string[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const diffLines: DiffLine[] = [];

    let oldIndex = 0;
    let newIndex = 0;

    // Simple diff algorithm (can be improved with Myers diff)
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Only new lines left
        diffLines.push({
          type: 'add',
          content: newLines[newIndex],
          newLineNumber: newIndex + 1
        });
        newIndex++;
      } else if (newIndex >= newLines.length) {
        // Only old lines left
        diffLines.push({
          type: 'remove',
          content: oldLines[oldIndex],
          oldLineNumber: oldIndex + 1
        });
        oldIndex++;
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        // Lines match - context
        diffLines.push({
          type: 'context',
          content: oldLines[oldIndex],
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1
        });
        oldIndex++;
        newIndex++;
      } else {
        // Lines differ
        diffLines.push({
          type: 'remove',
          content: oldLines[oldIndex],
          oldLineNumber: oldIndex + 1
        });
        diffLines.push({
          type: 'add',
          content: newLines[newIndex],
          newLineNumber: newIndex + 1
        });
        oldIndex++;
        newIndex++;
      }
    }

    // Group into hunks (simplified - one hunk for now)
    if (diffLines.length > 0) {
      hunks.push({
        oldStart: 1,
        oldLines: oldLines.length,
        newStart: 1,
        newLines: newLines.length,
        lines: diffLines
      });
    }

    return hunks;
  }

  // Mark patch as ready for preview
  markReady(patch: VirtualPatch): void {
    eventBus.emit(AgentEventType.DIFF_READY, this.sessionId, patch);
  }
}
