// Enhanced Editor Tabs - система вкладок как в VS Code

import { X, Circle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { 
  SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss3, 
  SiJson, SiMarkdown, SiReact 
} from 'react-icons/si';
import { VscFile } from 'react-icons/vsc';

export default function EditorTabs() {
  const { openFiles, currentFile, setCurrentFile, closeFile } = useStore();

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconProps = { size: 14, className: "flex-shrink-0" };
    
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'cjs':
        return <SiJavascript {...iconProps} color="#F7DF1E" />;
      case 'ts':
        return <SiTypescript {...iconProps} color="#3178C6" />;
      case 'tsx':
      case 'jsx':
        return <SiReact {...iconProps} color="#61DAFB" />;
      case 'py':
        return <SiPython {...iconProps} color="#3776AB" />;
      case 'html':
        return <SiHtml5 {...iconProps} color="#E34F26" />;
      case 'css':
      case 'scss':
        return <SiCss3 {...iconProps} color="#1572B6" />;
      case 'json':
        return <SiJson {...iconProps} color="#5E5C5C" />;
      case 'md':
        return <SiMarkdown {...iconProps} color="#FFFFFF" />;
      default:
        return <VscFile {...iconProps} />;
    }
  };

  const handleTabClick = (filePath: string, e: React.MouseEvent) => {
    // Middle click to close
    if (e.button === 1) {
      e.preventDefault();
      closeFile(filePath);
      return;
    }
    
    setCurrentFile(filePath);
  };

  const handleCloseClick = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeFile(filePath);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div 
      className="h-9 flex items-center overflow-x-auto border-b border-[#3e3e3e]"
      style={{ background: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)' }}
    >
      {openFiles.map((file) => {
        const isActive = file.path === currentFile;
        
        return (
          <div
            key={file.path}
            className={`
              h-full flex items-center gap-2 px-3 cursor-pointer
              border-r border-[#3e3e3e] min-w-[120px] max-w-[200px]
              transition-all duration-200 group relative
              ${isActive 
                ? 'bg-[#1e1e1e] text-white' 
                : 'text-[#a0aec0] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
            onClick={(e) => handleTabClick(file.path, e)}
            onMouseDown={(e) => {
              if (e.button === 1) {
                handleTabClick(file.path, e);
              }
            }}
            title={file.path}
          >
            {/* Active indicator */}
            {isActive && (
              <div 
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}
              />
            )}

            {/* File icon */}
            <div className="flex-shrink-0">
              {getFileIcon(file.name)}
            </div>

            {/* File name */}
            <span className="flex-1 text-xs truncate">
              {file.name}
            </span>

            {/* Dirty indicator or close button */}
            <div className="flex-shrink-0">
              {file.isDirty ? (
                <Circle 
                  size={8} 
                  className="fill-white text-white"
                />
              ) : (
                <button
                  onClick={(e) => handleCloseClick(file.path, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-0.5 transition-all"
                  title="Close (Ctrl+W)"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
