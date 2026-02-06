// Search Panel - полнофункциональный поиск как в VS Code

import { useState, useEffect } from 'react';
import { Search, Replace, X, ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FileNode } from '../types';

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [results, setResults] = useState<Array<{
    file: string;
    matches: Array<{ line: number; text: string; column: number }>;
  }>>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const { fileTree, workspaceRoot, openFile, setCurrentFile } = useStore();

  const getAllFiles = (nodes: FileNode[], basePath: string = ''): string[] => {
    const files: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        files.push(node.path);
      } else if (node.children) {
        files.push(...getAllFiles(node.children, node.path));
      }
    }
    return files;
  };

  const searchInFiles = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const allFiles = getAllFiles(fileTree);
    const searchResults: typeof results = [];

    try {
      for (const filePath of allFiles) {
        try {
          const content = await window.electronAPI.fs.readFile(filePath);
          const lines = content.split('\n');
          const matches: Array<{ line: number; text: string; column: number }> = [];

          lines.forEach((line, index) => {
            let searchText = searchQuery;
            let lineText = line;

            if (!caseSensitive) {
              searchText = searchText.toLowerCase();
              lineText = lineText.toLowerCase();
            }

            if (useRegex) {
              try {
                const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
                const match = lineText.match(regex);
                if (match) {
                  matches.push({
                    line: index + 1,
                    text: line,
                    column: lineText.indexOf(match[0])
                  });
                }
              } catch (e) {
                // Invalid regex
              }
            } else if (wholeWord) {
              const regex = new RegExp(`\\b${searchText}\\b`, caseSensitive ? 'g' : 'gi');
              if (regex.test(lineText)) {
                matches.push({
                  line: index + 1,
                  text: line,
                  column: lineText.search(regex)
                });
              }
            } else {
              if (lineText.includes(searchText)) {
                matches.push({
                  line: index + 1,
                  text: line,
                  column: lineText.indexOf(searchText)
                });
              }
            }
          });

          if (matches.length > 0) {
            searchResults.push({ file: filePath, matches });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      setResults(searchResults);
      setExpandedFiles(new Set(searchResults.map(r => r.file)));
    } finally {
      setIsSearching(false);
    }
  };

  const replaceInFile = async (filePath: string) => {
    if (!replaceQuery) return;

    try {
      const content = await window.electronAPI.fs.readFile(filePath);
      let newContent = content;

      if (useRegex) {
        const regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
        newContent = content.replace(regex, replaceQuery);
      } else if (wholeWord) {
        const regex = new RegExp(`\\b${searchQuery}\\b`, caseSensitive ? 'g' : 'gi');
        newContent = content.replace(regex, replaceQuery);
      } else {
        const regex = new RegExp(
          searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          caseSensitive ? 'g' : 'gi'
        );
        newContent = content.replace(regex, replaceQuery);
      }

      await window.electronAPI.fs.writeFile(filePath, newContent);
      searchInFiles(); // Refresh results
    } catch (error) {
      console.error('Failed to replace in file:', error);
    }
  };

  const replaceAll = async () => {
    for (const result of results) {
      await replaceInFile(result.file);
    }
  };

  const handleResultClick = async (filePath: string, line: number) => {
    try {
      const content = await window.electronAPI.fs.readFile(filePath);
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
      };
      const language = langMap[ext] || 'plaintext';

      openFile({ path: filePath, name: fileName, content, language, isDirty: false });
      setCurrentFile(filePath);

      // TODO: Jump to line
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const toggleFileExpansion = (filePath: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filePath)) {
      newExpanded.delete(filePath);
    } else {
      newExpanded.add(filePath);
    }
    setExpandedFiles(newExpanded);
  };

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]">
      {/* Header */}
      <div className="p-4 border-b border-[#3e3e3e]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">SEARCH</h2>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Toggle Replace"
          >
            <Replace size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchInFiles()}
            placeholder="Search"
            className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3e3e3e] rounded text-sm text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
          />
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="relative mb-2">
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace"
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3e3e3e] rounded text-sm text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
            />
          </div>
        )}

        {/* Options */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              caseSensitive ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] hover:bg-[#4e4e4e]'
            }`}
            title="Match Case"
          >
            Aa
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              wholeWord ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] hover:bg-[#4e4e4e]'
            }`}
            title="Match Whole Word"
          >
            Ab
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              useRegex ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] hover:bg-[#4e4e4e]'
            }`}
            title="Use Regular Expression"
          >
            .*
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={searchInFiles}
            disabled={isSearching || !searchQuery.trim()}
            className="flex-1 px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#858585] text-white text-sm rounded transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {showReplace && (
            <button
              onClick={replaceAll}
              disabled={results.length === 0 || !replaceQuery}
              className="flex-1 px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#858585] text-white text-sm rounded transition-colors"
            >
              Replace All
            </button>
          )}
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="mt-3 text-xs text-[#858585]">
            {totalMatches} results in {results.length} files
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="p-4 text-center text-[#858585] text-sm">
            {searchQuery ? 'No results found' : 'Enter search query'}
          </div>
        ) : (
          <div>
            {results.map((result) => {
              const fileName = result.file.split(/[/\\]/).pop() || result.file;
              const isExpanded = expandedFiles.has(result.file);

              return (
                <div key={result.file} className="border-b border-[#3e3e3e]">
                  {/* File Header */}
                  <div
                    onClick={() => toggleFileExpansion(result.file)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <File size={14} />
                    <span className="text-sm flex-1 truncate">{fileName}</span>
                    <span className="text-xs text-[#858585]">
                      {result.matches.length}
                    </span>
                  </div>

                  {/* Matches */}
                  {isExpanded && (
                    <div className="bg-[#1e1e1e]">
                      {result.matches.map((match, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleResultClick(result.file, match.line)}
                          className="flex items-start gap-2 px-8 py-1 hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <span className="text-[#858585] w-8 text-right flex-shrink-0">
                            {match.line}
                          </span>
                          <span className="flex-1 truncate font-mono">
                            {match.text.trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
