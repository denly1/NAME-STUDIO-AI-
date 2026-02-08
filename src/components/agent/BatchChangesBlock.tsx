import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';

interface FileGroup {
  name: string;
  files: string[];
  color: string;
}

interface BatchChangesBlockProps {
  totalFiles: number;
  groups: FileGroup[];
}

export const BatchChangesBlock: React.FC<BatchChangesBlockProps> = ({ totalFiles, groups }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Header */}
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24', marginBottom: '12px' }}>
        {totalFiles} files will be modified
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);

          return (
            <div key={group.name}>
              {/* Group Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  backgroundColor: '#252525',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onClick={() => toggleGroup(group.name)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#252525';
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={14} style={{ color: '#888' }} />
                ) : (
                  <ChevronRight size={14} style={{ color: '#888' }} />
                )}
                <Folder size={14} style={{ color: group.color }} />
                <span style={{ flex: 1, fontSize: '12px', color: '#d4d4d4' }}>
                  {group.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#666',
                    padding: '2px 6px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '3px'
                  }}
                >
                  {group.files.length}
                </span>
              </div>

              {/* Group Files */}
              {isExpanded && (
                <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {group.files.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '11px',
                        color: '#888',
                        fontFamily: 'monospace',
                        padding: '2px 8px'
                      }}
                    >
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
