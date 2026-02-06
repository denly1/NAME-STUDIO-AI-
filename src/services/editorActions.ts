// Editor Actions - форматирование, комментарии, fold как в VS Code (~200 строк)

import { registerAction } from './workbench/actionRegistry';

// Format Document
registerAction({
  id: 'editor.action.formatDocument',
  title: 'Format Document',
  category: 'Editor',
  keybinding: 'Shift+Alt+F',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.formatDocument').run();
    }
  }
});

// Format Selection
registerAction({
  id: 'editor.action.formatSelection',
  title: 'Format Selection',
  category: 'Editor',
  keybinding: 'Ctrl+K Ctrl+F',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.formatSelection').run();
    }
  }
});

// Toggle Line Comment
registerAction({
  id: 'editor.action.commentLine',
  title: 'Toggle Line Comment',
  category: 'Editor',
  keybinding: 'Ctrl+/',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.commentLine').run();
    }
  }
});

// Toggle Block Comment
registerAction({
  id: 'editor.action.blockComment',
  title: 'Toggle Block Comment',
  category: 'Editor',
  keybinding: 'Shift+Alt+A',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.blockComment').run();
    }
  }
});

// Fold
registerAction({
  id: 'editor.fold',
  title: 'Fold',
  category: 'Editor',
  keybinding: 'Ctrl+Shift+[',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.fold').run();
    }
  }
});

// Unfold
registerAction({
  id: 'editor.unfold',
  title: 'Unfold',
  category: 'Editor',
  keybinding: 'Ctrl+Shift+]',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.unfold').run();
    }
  }
});

// Fold All
registerAction({
  id: 'editor.foldAll',
  title: 'Fold All',
  category: 'Editor',
  keybinding: 'Ctrl+K Ctrl+0',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.foldAll').run();
    }
  }
});

// Unfold All
registerAction({
  id: 'editor.unfoldAll',
  title: 'Unfold All',
  category: 'Editor',
  keybinding: 'Ctrl+K Ctrl+J',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.unfoldAll').run();
    }
  }
});

// Go to Line
registerAction({
  id: 'editor.action.gotoLine',
  title: 'Go to Line',
  category: 'Editor',
  keybinding: 'Ctrl+G',
  handler: async () => {
    const lineNumber = prompt('Go to line:');
    if (lineNumber) {
      const editor = (window as any).monacoEditor;
      if (editor) {
        editor.revealLineInCenter(parseInt(lineNumber));
        editor.setPosition({ lineNumber: parseInt(lineNumber), column: 1 });
      }
    }
  }
});

// Find
registerAction({
  id: 'actions.find',
  title: 'Find',
  category: 'Editor',
  keybinding: 'Ctrl+F',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('actions.find').run();
    }
  }
});

// Replace
registerAction({
  id: 'editor.action.startFindReplaceAction',
  title: 'Replace',
  category: 'Editor',
  keybinding: 'Ctrl+H',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.startFindReplaceAction').run();
    }
  }
});

// Select All
registerAction({
  id: 'editor.action.selectAll',
  title: 'Select All',
  category: 'Editor',
  keybinding: 'Ctrl+A',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.selectAll').run();
    }
  }
});

// Copy Line Up
registerAction({
  id: 'editor.action.copyLinesUpAction',
  title: 'Copy Line Up',
  category: 'Editor',
  keybinding: 'Shift+Alt+Up',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.copyLinesUpAction').run();
    }
  }
});

// Copy Line Down
registerAction({
  id: 'editor.action.copyLinesDownAction',
  title: 'Copy Line Down',
  category: 'Editor',
  keybinding: 'Shift+Alt+Down',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.copyLinesDownAction').run();
    }
  }
});

// Move Line Up
registerAction({
  id: 'editor.action.moveLinesUpAction',
  title: 'Move Line Up',
  category: 'Editor',
  keybinding: 'Alt+Up',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.moveLinesUpAction').run();
    }
  }
});

// Move Line Down
registerAction({
  id: 'editor.action.moveLinesDownAction',
  title: 'Move Line Down',
  category: 'Editor',
  keybinding: 'Alt+Down',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.moveLinesDownAction').run();
    }
  }
});

// Delete Line
registerAction({
  id: 'editor.action.deleteLines',
  title: 'Delete Line',
  category: 'Editor',
  keybinding: 'Ctrl+Shift+K',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.deleteLines').run();
    }
  }
});

// Add Cursor Above
registerAction({
  id: 'editor.action.insertCursorAbove',
  title: 'Add Cursor Above',
  category: 'Editor',
  keybinding: 'Ctrl+Alt+Up',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.insertCursorAbove').run();
    }
  }
});

// Add Cursor Below
registerAction({
  id: 'editor.action.insertCursorBelow',
  title: 'Add Cursor Below',
  category: 'Editor',
  keybinding: 'Ctrl+Alt+Down',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.insertCursorBelow').run();
    }
  }
});

// Trigger Suggest
registerAction({
  id: 'editor.action.triggerSuggest',
  title: 'Trigger Suggest',
  category: 'Editor',
  keybinding: 'Ctrl+Space',
  handler: async () => {
    const editor = (window as any).monacoEditor;
    if (editor) {
      await editor.getAction('editor.action.triggerSuggest').run();
    }
  }
});
