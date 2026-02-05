import { VscClose, VscSplitHorizontal, VscSplitVertical, VscCopy } from 'react-icons/vsc';

interface TabContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCloseTab: () => void;
  onCloseOthers: () => void;
  onCloseToRight: () => void;
  onCloseAll: () => void;
  onCloseSaved: () => void;
  onSplitUp: () => void;
  onSplitDown: () => void;
  onSplitLeft: () => void;
  onSplitRight: () => void;
  onCopyPath: () => void;
  onRevealInExplorer: () => void;
}

export default function TabContextMenu({
  x,
  y,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseToRight,
  onCloseAll,
  onCloseSaved,
  onSplitUp,
  onSplitDown,
  onSplitLeft,
  onSplitRight,
  onCopyPath,
  onRevealInExplorer
}: TabContextMenuProps) {
  const MenuItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    separator 
  }: { 
    icon?: any; 
    label?: string; 
    onClick?: () => void; 
    separator?: boolean;
  }) => {
    if (separator) {
      return <div className="h-px bg-[#454545] my-1" />;
    }

    return (
      <button
        onClick={() => {
          onClick?.();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#2a2d2e] text-left"
      >
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        style={{ background: 'transparent' }}
      />
      
      {/* Menu */}
      <div
        className="fixed bg-[#3c3c3c] border border-[#454545] rounded shadow-lg py-1 z-[9999] min-w-[220px]"
        style={{ left: x, top: y }}
      >
        <MenuItem icon={VscClose} label="Close" onClick={onCloseTab} />
        <MenuItem label="Close Others" onClick={onCloseOthers} />
        <MenuItem label="Close to the Right" onClick={onCloseToRight} />
        <MenuItem label="Close All" onClick={onCloseAll} />
        <MenuItem label="Close Saved" onClick={onCloseSaved} />
        
        <MenuItem separator />
        
        <MenuItem icon={VscSplitHorizontal} label="Split Up" onClick={onSplitUp} />
        <MenuItem icon={VscSplitHorizontal} label="Split Down" onClick={onSplitDown} />
        <MenuItem icon={VscSplitVertical} label="Split Left" onClick={onSplitLeft} />
        <MenuItem icon={VscSplitVertical} label="Split Right" onClick={onSplitRight} />
        
        <MenuItem separator />
        
        <MenuItem icon={VscCopy} label="Copy Path" onClick={onCopyPath} />
        <MenuItem label="Copy Relative Path" onClick={onCopyPath} />
        <MenuItem label="Reveal in File Explorer" onClick={onRevealInExplorer} />
      </div>
    </>
  );
}
