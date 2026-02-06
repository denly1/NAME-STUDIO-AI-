// Editor Groups - Split Editor система как в VS Code (~300 строк)

import { useState, useRef } from 'react';
import { X, MoreVertical, Columns, Rows, Square } from 'lucide-react';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';

interface EditorGroup {
  id: string;
  files: Array<{ path: string; name: string; content: string; language: string; isDirty: boolean }>;
  activeFile: string | null;
}

export default function EditorGroups() {
  const [groups, setGroups] = useState<EditorGroup[]>([
    { id: 'group-1', files: [], activeFile: null }
  ]);
  const [activeGroupId, setActiveGroupId] = useState('group-1');
  const { openFiles, currentFile, updateFileContent, saveFile } = useStore();

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const splitVertical = () => {
    const newGroup: EditorGroup = {
      id: `group-${Date.now()}`,
      files: [],
      activeFile: null
    };
    setGroups([...groups, newGroup]);
  };

  const splitHorizontal = () => {
    const newGroup: EditorGroup = {
      id: `group-${Date.now()}`,
      files: [],
      activeFile: null
    };
    setGroups([...groups, newGroup]);
  };

  const closeGroup = (groupId: string) => {
    if (groups.length === 1) return;
    setGroups(groups.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(groups[0].id);
    }
  };

  const moveFileToGroup = (filePath: string, targetGroupId: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (!file) return;

    setGroups(groups.map(g => {
      if (g.id === targetGroupId) {
        return {
          ...g,
          files: [...g.files, file],
          activeFile: filePath
        };
      }
      return g;
    }));
  };

  const handleEditorChange = (value: string | undefined, groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.activeFile || !value) return;

    updateFileContent(group.activeFile, value);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="h-9 flex items-center justify-between px-2 bg-[#252526] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2">
          <button
            onClick={splitVertical}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Split Editor Right (Ctrl+\\)"
          >
            <Columns size={16} />
          </button>
          <button
            onClick={splitHorizontal}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Split Editor Down"
          >
            <Rows size={16} />
          </button>
        </div>
        <div className="text-xs text-[#858585]">
          {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
        </div>
      </div>

      {/* Editor Groups */}
      <div className="flex-1 flex">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={`flex-1 flex flex-col border-r border-[#3e3e3e] ${
              activeGroupId === group.id ? 'ring-1 ring-[#007acc]' : ''
            }`}
            onClick={() => setActiveGroupId(group.id)}
          >
            {/* Group Header */}
            <div className="h-8 flex items-center justify-between px-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
              <span className="text-xs text-[#858585]">Group {index + 1}</span>
              {groups.length > 1 && (
                <button
                  onClick={() => closeGroup(group.id)}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Group Content */}
            <div className="flex-1">
              {group.activeFile ? (
                <Editor
                  height="100%"
                  language={group.files.find(f => f.path === group.activeFile)?.language || 'plaintext'}
                  value={group.files.find(f => f.path === group.activeFile)?.content || ''}
                  onChange={(value) => handleEditorChange(value, group.id)}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on'
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[#858585]">
                  <div className="text-center">
                    <Square size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No file open</p>
                    <p className="text-xs mt-1">Open a file to start editing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
