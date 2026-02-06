// Extensions Panel - Extension marketplace and management

import { useState } from 'react';
import { Search, Package, Download, CheckCircle, Star, TrendingUp, Clock } from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  downloads: string;
  rating: number;
  installed: boolean;
  icon?: string;
}

export default function ExtensionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'installed' | 'recommended'>('installed');

  const installedExtensions: Extension[] = [
    {
      id: 'container-tools',
      name: 'Container Tools',
      publisher: 'docker',
      description: 'Makes it easy to create, manage, and debug containerized applications',
      version: '1.0.0',
      downloads: '3.75M',
      rating: 4.5,
      installed: true
    },
    {
      id: 'debugger-java',
      name: 'Debugger for Java',
      publisher: 'vscjava',
      description: 'A lightweight Java debugger for Visual Studio Code',
      version: '0.52.0',
      downloads: '14M',
      rating: 4.7,
      installed: true
    },
    {
      id: 'docker',
      name: 'Docker',
      publisher: 'ms-azuretools',
      description: 'Makes it easy to create, manage, and debug containerized applications',
      version: '1.29.0',
      downloads: '3.26M',
      rating: 4.6,
      installed: true
    },
    {
      id: 'java-pack',
      name: 'Extension Pack for Java',
      publisher: 'vscjava',
      description: 'Popular extensions for Java development',
      version: '0.25.0',
      downloads: '511K',
      rating: 4.8,
      installed: true
    },
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      publisher: 'GitHub',
      description: 'GitHub Actions workflows and runs for github.com',
      version: '0.26.0',
      downloads: '1.2M',
      rating: 4.5,
      installed: true
    },
    {
      id: 'gradle-java',
      name: 'Gradle for Java',
      publisher: 'vscjava',
      description: 'Manage Gradle Projects, run Gradle tasks and provide better Gradle support',
      version: '3.12.0',
      downloads: '890K',
      rating: 4.4,
      installed: true
    }
  ];

  const recommendedExtensions: Extension[] = [
    {
      id: 'edge-tools',
      name: 'Microsoft Edge Tools for VS Code',
      publisher: 'ms-edgedevtools',
      description: 'Use the Microsoft Edge Tools from within VS Code',
      version: '2.1.0',
      downloads: '139K',
      rating: 4.3,
      installed: false
    },
    {
      id: 'firefox-debugger',
      name: 'Debugger for Firefox',
      publisher: 'firefox-devtools',
      description: 'Debug your web application or browser extension in Firefox',
      version: '2.9.0',
      downloads: '94K',
      rating: 4.2,
      installed: false
    },
    {
      id: 'markdownlint',
      name: 'markdownlint',
      publisher: 'DavidAnson',
      description: 'Markdown linting and style checking for Visual Studio Code',
      version: '0.51.0',
      downloads: '8M',
      rating: 4.7,
      installed: false
    }
  ];

  const extensions = activeTab === 'installed' ? installedExtensions : recommendedExtensions;
  const filteredExtensions = extensions.filter(ext =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Header */}
      <div className="h-12 border-b border-[#3e3e3e] flex items-center justify-between px-4" style={{ background: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-2">
          <Package size={16} className="text-[#667eea]" />
          <span className="text-sm font-bold" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Extensions
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#3e3e3e]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Extensions in Marketplace"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#1a1a2e] border border-[#4a5568] rounded-lg text-white placeholder-[#718096] focus:outline-none focus:border-[#667eea] transition-colors"
          />
        </div>
        <div className="mt-2 text-xs text-[#718096]">
          Using Open VSX mirror (<span className="text-[#667eea] cursor-pointer hover:underline">change here</span>). (click to dismiss)
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3e3e3e]">
        <button
          onClick={() => setActiveTab('installed')}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'installed'
              ? 'border-b-2 border-[#667eea] text-white'
              : 'text-[#a0aec0] hover:text-white'
          }`}
        >
          Installed
        </button>
        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'recommended'
              ? 'border-b-2 border-[#667eea] text-white'
              : 'text-[#a0aec0] hover:text-white'
          }`}
        >
          Recommended
        </button>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredExtensions.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="text-[#4a5568] mx-auto mb-3" />
            <p className="text-sm text-[#a0aec0] mb-1">No extensions found</p>
            <p className="text-xs text-[#718096]">Try a different search query</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className="p-4 rounded-lg border border-[#4a5568] hover:border-[#667eea] transition-all duration-200 group"
                style={{ background: 'rgba(26, 26, 46, 0.6)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Package size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{ext.name}</h3>
                        <p className="text-xs text-[#718096]">{ext.publisher}</p>
                      </div>
                      {ext.installed ? (
                        <div className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0 ml-2">
                          <CheckCircle size={14} />
                          <span>Installed</span>
                        </div>
                      ) : (
                        <button
                          className="px-3 py-1 text-xs text-white rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0 ml-2"
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                          Install
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#a0aec0] line-clamp-2 mb-2">{ext.description}</p>

                    <div className="flex items-center gap-4 text-xs text-[#718096]">
                      <div className="flex items-center gap-1">
                        <Download size={12} />
                        <span>{ext.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" />
                        <span>{ext.rating}</span>
                      </div>
                      <span>v{ext.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
