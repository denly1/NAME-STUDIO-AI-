import { Files, Search, GitBranch, Package, Sparkles, Map } from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';

export default function ActivityBar() {
  const { activeView, setActiveView, toggleExplorer } = useLayoutStore();

  const activities = [
    { id: 'explorer' as const, icon: Files, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'search' as const, icon: Search, label: 'Search', shortcut: 'Ctrl+Shift+F' },
    { id: 'git' as const, icon: GitBranch, label: 'Source Control', shortcut: 'Ctrl+Shift+G' },
    { id: 'codemaps' as const, icon: Map, label: 'Codemaps', shortcut: 'Ctrl+:' },
    { id: 'extensions' as const, icon: Package, label: 'Extensions', shortcut: 'Ctrl+Shift+X' },
    { id: 'ai' as const, icon: Sparkles, label: 'AI Assistant', shortcut: 'Ctrl+Shift+A' },
  ];

  const handleActivityClick = (id: typeof activeView) => {
    if (activeView === id) {
      toggleExplorer();
    } else {
      setActiveView(id);
      if (!useLayoutStore.getState().showExplorer) {
        toggleExplorer();
      }
    }
  };

  return (
    <div className="w-14 flex flex-col items-center py-3 border-r border-[#4a5568] shadow-xl" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {activities.map((activity) => {
        const Icon = activity.icon;
        
        return (
          <button
            key={activity.id}
            onClick={() => handleActivityClick(activity.id)}
            className="w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 rounded-lg mb-1"
            style={activeView === activity.id ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderLeft: '3px solid #f093fb',
              boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
              transform: 'scale(1.05)'
            } : {
              color: '#a0aec0'
            }}
            onMouseEnter={(e) => {
              if (activeView !== activity.id) {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.color = '#e2e8f0';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== activity.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#a0aec0';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={`${activity.label} (${activity.shortcut})`}
          >
            <Icon size={24} />
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-[#2d2d2d] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {activity.label}
              <div className="text-[#858585] mt-0.5">{activity.shortcut}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
