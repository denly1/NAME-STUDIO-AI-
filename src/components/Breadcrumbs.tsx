import { ChevronRight, File } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Breadcrumbs() {
  const { currentFile } = useStore();

  if (!currentFile) return null;

  const parts = currentFile.split(/[/\\]/);
  const fileName = parts[parts.length - 1];
  const pathParts = parts.slice(0, -1);

  return (
    <div className="h-7 bg-[#252526] border-b border-[#3e3e3e] flex items-center px-3 text-xs text-[#cccccc] overflow-x-auto">
      {pathParts.map((part, index) => (
        <div key={index} className="flex items-center">
          <span className="hover:text-white cursor-pointer">{part}</span>
          <ChevronRight size={12} className="mx-1 text-[#858585]" />
        </div>
      ))}
      <div className="flex items-center gap-1 text-white">
        <File size={12} />
        <span className="font-semibold">{fileName}</span>
      </div>
    </div>
  );
}
