import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Sparkles, Code, MessageCircle, ListChecks, Bug, Wand2, FileText, TestTube, FolderSearch, Undo, Play, CheckCircle, AlertTriangle, History, Clock, Plus, X, Zap, FileCode } from 'lucide-react';
import { useStore } from '../store/useStore';
import { aiService, AIMode, AgentResponse } from '../services/aiService';
import DiffViewer from './DiffViewer';
import AdvancedDiffViewer from './AdvancedDiffViewer';
import { chatHistoryService, ChatSession } from '../services/chatHistoryService';
import { agentHarness, AgentTask, AgentStep, AgentPlan } from '../services/agentHarness';
import { FileDiff } from '../services/agentTools';
import { AIAgentPanel } from './AIAgentPanel';

interface CodeChange {
  file: string;
  content: string;
  applied: boolean;
}

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  changes?: CodeChange[];
  steps?: AgentStep[];
  risks?: string[];
  plan?: string[];
}

export default function AIPanel() {
  const { openFiles, currentFile, updateFileContent, workspaceRoot, openFile } = useStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AIMode>('code');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([]);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [showPlan, setShowPlan] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatTabs, setChatTabs] = useState<Array<{ id: string; title: string; messages: AgentMessage[] }>>([
    { id: 'default', title: 'Chat 1', messages: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState('default');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // AI Agent state - Cursor AI-like functionality
  const [viewMode, setViewMode] = useState<'chat' | 'files'>('chat');
  const [fileChanges, setFileChanges] = useState<Array<{
    path: string;
    action: 'edit' | 'create' | 'delete';
    oldContent?: string;
    newContent?: string;
    explanation: string;
    applied: boolean;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to refocus input after button clicks
  const refocusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Load chat history for current project
  useEffect(() => {
    if (workspaceRoot) {
      const sessions = chatHistoryService.getProjectSessions(workspaceRoot);
      setChatSessions(sessions);
    }
  }, [workspaceRoot]);

  // Sync messages with active tab
  useEffect(() => {
    const activeTab = chatTabs.find(t => t.id === activeTabId);
    if (activeTab) {
      setMessages(activeTab.messages);
    }
  }, [activeTabId]);

  // Update active tab messages when messages change
  useEffect(() => {
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, messages } : tab
    ));
  }, [messages]);

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 0 && workspaceRoot) {
      const projectName = workspaceRoot.split(/[\\/]/).pop() || 'Unknown Project';
      const session = chatHistoryService.saveSession(
        {
          id: currentSessionId || undefined,
          messages: messages as any[],
        },
        workspaceRoot,
        projectName
      );
      setCurrentSessionId(session.id);
      
      // Refresh sessions list
      const sessions = chatHistoryService.getProjectSessions(workspaceRoot);
      setChatSessions(sessions);
    }
  }, [messages, workspaceRoot]);

  const createNewChatTab = () => {
    const newId = `chat_${Date.now()}`;
    const newTab = {
      id: newId,
      title: `Chat ${chatTabs.length + 1}`,
      messages: []
    };
    setChatTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setMessages([]);
    setCurrentSessionId(null);
  };

  const closeTab = (tabId: string) => {
    if (chatTabs.length === 1) return; // Don't close last tab
    
    const tabIndex = chatTabs.findIndex(t => t.id === tabId);
    const newTabs = chatTabs.filter(t => t.id !== tabId);
    setChatTabs(newTabs);
    
    if (activeTabId === tabId) {
      const newActiveIndex = Math.max(0, tabIndex - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  };

  // AI Agent handlers
  const handleApplyFileChange = async (index: number) => {
    const change = fileChanges[index];
    if (!change || !workspaceRoot) return;

    try {
      const fullPath = `${workspaceRoot}/${change.path}`;
      
      if (change.action === 'delete') {
        await window.electronAPI.fs.deleteFile(fullPath);
      } else if (change.action === 'create' || change.action === 'edit') {
        if (change.newContent) {
          await window.electronAPI.fs.writeFile(fullPath, change.newContent);
          
          // Update in editor if file is open
          const openFileItem = openFiles.find(f => f.path === fullPath);
          if (openFileItem) {
            updateFileContent(fullPath, change.newContent);
          }
        }
      }
      
      // Mark as applied
      setFileChanges(prev => prev.map((c, i) => 
        i === index ? { ...c, applied: true } : c
      ));
      
      // Add success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Изменение применено: ${change.action} ${change.path}`
      }]);
    } catch (error) {
      console.error('Failed to apply change:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Ошибка при применении изменения: ${error}`
      }]);
    }
  };

  const handleRejectFileChange = (index: number) => {
    setFileChanges(prev => prev.filter((_, i) => i !== index));
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `🚫 Изменение отклонено`
    }]);
  };

  const handleViewFile = async (path: string) => {
    if (!workspaceRoot) return;
    const fullPath = `${workspaceRoot}/${path}`;
    
    try {
      const content = await window.electronAPI.fs.readFile(fullPath);
      const fileName = path.split('/').pop() || path;
      const extension = fileName.split('.').pop() || '';
      
      openFile({
        path: fullPath,
        name: fileName,
        content,
        language: extension,
        isDirty: false
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const applyChange = async (change: CodeChange, messageIndex: number) => {
    try {
      // Update file
      await window.electronAPI.fs.writeFile(change.file, change.content);
      
      // Update in editor if file is open
      const openFileItem = openFiles.find(f => f.path === change.file);
      if (openFileItem) {
        updateFileContent(change.file, change.content);
      }
      
      // Mark as applied
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex && msg.changes) {
          return {
            ...msg,
            changes: msg.changes.map(c => 
              c.file === change.file ? { ...c, applied: true } : c
            )
          };
        }
        return msg;
      }));
      
      setPendingChanges(prev => prev.filter(c => c.file !== change.file));
    } catch (error) {
      console.error('Failed to apply change:', error);
      alert('Failed to apply change: ' + error);
    }
  };

  const applyAllChanges = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.changes) return;
    
    for (const change of message.changes) {
      if (!change.applied) {
        await applyChange(change, messageIndex);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    
    // Add empty assistant message for streaming
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    try {
      aiService.setMode(mode);
      
      // Check if request involves file modifications (Cursor AI mode)
      const isFileModificationRequest = 
        userMessage.toLowerCase().includes('изменить') ||
        userMessage.toLowerCase().includes('создать') ||
        userMessage.toLowerCase().includes('добавить') ||
        userMessage.toLowerCase().includes('исправить') ||
        userMessage.toLowerCase().includes('рефактор') ||
        userMessage.toLowerCase().includes('удалить') ||
        userMessage.toLowerCase().includes('файл') ||
        mode === 'code';

      if (isFileModificationRequest && workspaceRoot) {
        // AI Agent mode - analyze and modify files
        setIsAnalyzing(true);
        setViewMode('files');
        
        // Scan project files
        const projectFiles = await aiService.scanProjectFiles(workspaceRoot);
        
        // Get relevant files (currently open + scanned)
        const relevantFiles = [
          ...openFiles.map(f => f.path.replace(`${workspaceRoot}/`, '')),
          ...projectFiles.slice(0, 10) // Limit to 10 files for context
        ];
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: `🔍 Анализирую проект и готовлю изменения...\n\nНайдено файлов: ${relevantFiles.length}`
          };
          return newMessages;
        });
        
        // Analyze and generate file changes
        const result = await aiService.analyzeAndModifyFiles(
          userMessage,
          workspaceRoot,
          relevantFiles
        );
        
        // Set file changes for AI Agent Panel
        setFileChanges(result.changes.map(c => ({ ...c, applied: false })));
        
        // Update message with reasoning
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: `✅ Анализ завершен!\n\n**Обоснование:**\n${result.reasoning}\n\n**Предложено изменений:** ${result.changes.length}\n\nПерейдите на вкладку "Files" чтобы просмотреть и применить изменения.`
          };
          return newMessages;
        });
        
        setIsAnalyzing(false);
      } else {
        // Normal chat mode
        const context = {
          files: openFiles.map(f => ({ path: f.path, name: f.name, language: f.language })),
          currentFile: currentFile || undefined
        };
        
        const response = await aiService.chat(userMessage, context);
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: response
          };
          return newMessages;
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[assistantMessageIndex] = {
          role: 'assistant',
          content: `❌ ${errorMessage}`
        };
        return newMessages;
      });
      
      setIsAnalyzing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const modes: { id: AIMode; label: string; icon: any; description: string }[] = [
    { id: 'code', label: 'Code', icon: Code, description: 'Cascade can write and edit code' },
    { id: 'ask', label: 'Ask', icon: MessageCircle, description: 'Cascade reads but won\'t edit' },
    { id: 'plan', label: 'Plan', icon: ListChecks, description: 'Plan changes before implementing' }
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Header */}
      <div className="border-b border-[#4a5568] flex flex-col shadow-lg" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 15px rgba(102, 126, 234, 0.5)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-sm font-black tracking-tight" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NAME STUDIO AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Chat History Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowChatHistory(!showChatHistory);
                  refocusInput();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 relative"
                title="Show Chat History"
              >
                <History size={16} className="text-[#a0aec0] hover:text-white" />
                {chatSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#667eea] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {chatSessions.length}
                  </span>
                )}
              </button>
              
              {/* Chat History Dropdown */}
              {showChatHistory && (
                <div 
                  className="absolute top-full right-0 mt-2 w-80 rounded-xl border border-[#4a5568] shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
                  style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
                >
                  <div className="p-3 border-b border-[#4a5568] sticky top-0" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)' }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white">Chat History</div>
                      <button
                        onClick={() => {
                          if (confirm('Clear all chat history for this project?')) {
                            chatHistoryService.clearProjectSessions(workspaceRoot || '');
                            setChatSessions([]);
                            setShowChatHistory(false);
                          }
                        }}
                        className="text-xs text-[#f56565] hover:text-[#fc8181] transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {chatSessions.length === 0 ? (
                    <div className="p-8 text-center">
                      <Clock size={32} className="text-[#4a5568] mx-auto mb-2" />
                      <p className="text-sm text-[#a0aec0]">No chat history yet</p>
                      <p className="text-xs text-[#718096] mt-1">Start a conversation to save history</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {chatSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setMessages(session.messages as any[]);
                            setCurrentSessionId(session.id);
                            setShowChatHistory(false);
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all mb-1 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium truncate mb-1">
                                {session.title}
                              </div>
                              <div className="text-xs text-[#718096]">
                                {session.projectName}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-[#a0aec0]">
                                {chatHistoryService.formatRelativeTime(session.updatedAt)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this chat?')) {
                                    chatHistoryService.deleteSession(session.id);
                                    setChatSessions(chatHistoryService.getProjectSessions(workspaceRoot || ''));
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[#f56565] hover:text-[#fc8181] transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-[#667eea]">
                              {session.messages.length} messages
                            </span>
                            {currentSessionId === session.id && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#667eea]/20 text-[#667eea]">
                                Active
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-3 border-t border-[#4a5568] bg-[#1a1a2e]/50">
                    <button
                      onClick={() => {
                        setMessages([]);
                        setCurrentSessionId(null);
                        setShowChatHistory(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-white rounded-lg transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      + New Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setMessages([]);
                refocusInput();
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Clear Chat"
            >
              <Trash2 size={16} className="text-[#a0aec0] hover:text-white" />
            </button>
          </div>
        </div>

        {/* Chat Tabs */}
        <div className="flex items-center gap-1 px-2 py-1 border-t border-[#3e3e3e] overflow-x-auto" style={{ background: 'rgba(26, 26, 46, 0.4)' }}>
          {chatTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all group ${
                activeTabId === tab.id
                  ? 'bg-gradient-to-b from-[#667eea]/20 to-transparent border-t-2 border-[#667eea]'
                  : 'hover:bg-white/5'
              }`}
            >
              <MessageCircle size={12} className={activeTabId === tab.id ? 'text-[#667eea]' : 'text-[#a0aec0]'} />
              <span className={`text-xs font-medium whitespace-nowrap ${activeTabId === tab.id ? 'text-white' : 'text-[#a0aec0]'}`}>
                {tab.title}
              </span>
              {tab.messages.length > 0 && (
                <span className="text-[10px] text-[#718096]">({tab.messages.length})</span>
              )}
              {chatTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-0.5 transition-all"
                >
                  <X size={10} className="text-[#f56565]" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={createNewChatTab}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            title="New Chat"
          >
            <Plus size={14} className="text-[#667eea]" />
            <span className="text-xs text-[#667eea] font-medium">New</span>
          </button>
        </div>
        
        {/* View Mode Tabs (Chat / Files) */}
        <div className="flex border-t border-[#3e3e3e] bg-[#1a1a2e]">
          <button
            onClick={() => setViewMode('chat')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold transition-all ${
              viewMode === 'chat'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-b-2 border-[#f093fb]'
                : 'text-[#a0aec0] hover:bg-white/5'
            }`}
          >
            <MessageCircle size={14} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setViewMode('files')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold transition-all ${
              viewMode === 'files'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-b-2 border-[#f093fb]'
                : 'text-[#a0aec0] hover:bg-white/5'
            }`}
          >
            <FileCode size={14} />
            <span>Files</span>
            {fileChanges.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#f093fb] text-white text-[10px] rounded-full font-bold">
                {fileChanges.length}
              </span>
            )}
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-t border-[#3e3e3e]">
          {modes.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all duration-300"
                style={mode === m.id ? {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderBottom: '3px solid #f093fb',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                } : {
                  color: '#a0aec0'
                }}
                onMouseEnter={(e) => {
                  if (mode !== m.id) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode !== m.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#a0aec0';
                  }
                }}
                title={m.description}
              >
                <Icon size={14} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 text-xs text-[#858585] bg-[#1e1e1e] border-t border-[#3e3e3e] flex items-center justify-between">
          <span>{modes.find(m => m.id === mode)?.description}</span>
          <button
            onClick={() => setMessages([])}
            className="p-1 hover:bg-[#3e3e3e] rounded transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={14} className="text-[#858585] hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content Area - Chat or Files */}
      {viewMode === 'files' ? (
        <div className="flex-1 overflow-hidden">
          <AIAgentPanel
            changes={fileChanges}
            onApplyChange={handleApplyFileChange}
            onRejectChange={handleRejectFileChange}
            onViewFile={handleViewFile}
            isProcessing={isAnalyzing}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'transparent' }}>
          {messages.length === 0 ? (
            <div className="text-center mt-12">
              <div className="inline-block p-4 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 40px rgba(102, 126, 234, 0.6)' }}>
                <Sparkles size={48} className="text-white" />
              </div>
              <p className="text-2xl font-black mb-2" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome to NAME STUDIO AI</p>
              <p className="text-sm text-[#a0aec0] mb-1">Your Premium AI-Powered Coding Assistant</p>
              <p className="text-xs text-[#718096] mt-3">✨ Powered by Artemox AI - Advanced coding assistant with file modification capabilities</p>
            </div>
          ) : (
          messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              <div
                className="p-3 rounded-lg max-w-[80%] shadow-lg"
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                marginLeft: 'auto',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              } : {
                background: 'rgba(26, 26, 46, 0.8)',
                color: '#e2e8f0',
                border: '1px solid #4a5568',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="text-xs mb-1 font-semibold" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#a0aec0' }}>
                {msg.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className="text-sm whitespace-pre-wrap" style={{ color: msg.role === 'user' ? 'white' : '#e2e8f0' }}>
                {msg.content}
              </div>

              {/* Plan Section */}
              {msg.plan && msg.plan.length > 0 && showPlan && (
                <div className="mt-3 p-2 rounded bg-black/20 border border-[#4a5568]">
                  <div className="text-xs font-semibold text-[#f093fb] mb-2 flex items-center gap-1">
                    <ListChecks size={12} />
                    Plan
                  </div>
                  <ol className="text-xs space-y-1 list-decimal list-inside text-[#a0aec0]">
                    {msg.plan.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Steps Section */}
              {msg.steps && msg.steps.length > 0 && (
                <div className="mt-3 p-2 rounded bg-black/20 border border-[#4a5568]">
                  <div className="text-xs font-semibold text-[#f093fb] mb-2 flex items-center gap-1">
                    <Play size={12} />
                    Execution Steps
                  </div>
                  <div className="space-y-1">
                    {msg.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {step.type === 'result' && <CheckCircle size={12} className="text-green-400" />}
                        {step.type === 'tool_use' && <Play size={12} className="text-blue-400" />}
                        {step.type === 'error' && <AlertTriangle size={12} className="text-red-400" />}
                        {step.type === 'thinking' && <div className="w-3 h-3 rounded-full border border-[#4a5568]" />}
                        <span className="text-[#a0aec0]">{step.description}</span>
                        {step.tool && (
                          <span className="text-[#718096] text-[10px]">({step.tool})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks Section */}
              {msg.risks && msg.risks.length > 0 && (
                <div className="mt-3 p-2 rounded bg-red-900/10 border border-red-500/30">
                  <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Risks Detected
                  </div>
                  <ul className="text-xs space-y-1 list-disc list-inside text-red-300">
                    {msg.risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Code Changes Section */}
            {msg.changes && msg.changes.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Code size={16} className="text-[#f093fb]" />
                    Proposed Changes ({msg.changes.length})
                  </div>
                  <button
                    onClick={() => applyAllChanges(index)}
                    className="px-4 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    <CheckCircle size={14} />
                    Apply All Changes
                  </button>
                </div>
                {msg.changes.map((change, changeIdx) => (
                  <DiffViewer
                    key={changeIdx}
                    file={change.file}
                    diff={change.content}
                    applied={change.applied}
                    onApply={() => applyChange(change, index)}
                    onReject={() => {
                      setMessages(prev => prev.map((m, i) => {
                        if (i === index && m.changes) {
                          return {
                            ...m,
                            changes: m.changes.filter((_, idx) => idx !== changeIdx)
                          };
                        }
                        return m;
                      }));
                      setPendingChanges(prev => prev.filter(c => c.file !== change.file));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          ))
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && viewMode === 'chat' && (
        <div className="p-4">
          <div 
            className="flex items-center gap-3 p-4 rounded-xl max-w-[80%] animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '2px solid rgba(102, 126, 234, 0.3)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)'
            }}
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-[#667eea] border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 15px rgba(102, 126, 234, 0.5)' }}></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-1">NAME STUDIO AI is analyzing...</div>
              <div className="text-xs text-[#a0aec0]">Processing your request with advanced reasoning</div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      {viewMode === 'chat' && (
      <div className="p-4 border-t border-[#4a5568]" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="flex gap-2">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                refocusInput();
              }}
              className="px-3 py-3 text-white rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(102, 126, 234, 0.2)', border: '2px solid #667eea' }}
              title="Quick Actions"
            >
              <Sparkles size={16} />
            </button>
            
            {showQuickActions && (
              <div 
                className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-[#4a5568] shadow-2xl overflow-hidden z-50"
                style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
              >
                <div className="p-3 border-b border-[#4a5568]">
                  <div className="text-xs font-semibold text-white mb-2">Quick Actions</div>
                </div>
                
                <div className="p-2 space-y-1">
                  <button
                    onClick={async () => {
                      setShowQuickActions(false);
                      if (!currentFile) return alert('No file selected');
                      const file = openFiles.find(f => f.path === currentFile);
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const response = await aiService.fixError('Fix any errors in this code', file.content, file.path);
                        setMessages(prev => [...prev, { role: 'assistant', content: response.analysis, plan: response.plan, risks: response.risks }]);
                      } catch (error) {
                        alert('Error: ' + error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#a0aec0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Bug size={16} />
                    <span>Fix Error</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowQuickActions(false);
                      if (!currentFile) return alert('No file selected');
                      const file = openFiles.find(f => f.path === currentFile);
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const response = await aiService.refactorCode(file.content, file.path);
                        setMessages(prev => [...prev, { role: 'assistant', content: response.analysis, plan: response.plan, risks: response.risks }]);
                      } catch (error) {
                        alert('Error: ' + error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#a0aec0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Wand2 size={16} />
                    <span>Refactor</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowQuickActions(false);
                      if (!currentFile) return alert('No file selected');
                      const file = openFiles.find(f => f.path === currentFile);
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const explanation = await aiService.explainCode(file.content, file.name);
                        setMessages(prev => [...prev, { role: 'assistant', content: explanation }]);
                      } catch (error) {
                        alert('Error: ' + error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#a0aec0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <FileText size={16} />
                    <span>Explain</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowQuickActions(false);
                      if (!currentFile) return alert('No file selected');
                      const file = openFiles.find(f => f.path === currentFile);
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const tests = await aiService.generateTests(file.path, file.content);
                        setMessages(prev => [...prev, { role: 'assistant', content: `Generated tests:\n\n${tests}` }]);
                      } catch (error) {
                        alert('Error: ' + error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#a0aec0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <TestTube size={16} />
                    <span>Generate Tests</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowQuickActions(false);
                      if (!workspaceRoot) return alert('No workspace open');
                      setIsLoading(true);
                      try {
                        const analysis = await aiService.analyzeProject(workspaceRoot);
                        setMessages(prev => [...prev, { role: 'assistant', content: `Project Analysis:\n\n${JSON.stringify(analysis, null, 2)}` }]);
                      } catch (error) {
                        alert('Error: ' + error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#a0aec0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <FolderSearch size={16} />
                    <span>Analyze Project</span>
                  </button>
                </div>

                <div className="p-3 border-t border-[#4a5568] space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#a0aec0]">Autonomous Mode</span>
                    <input
                      type="checkbox"
                      checked={autonomousMode}
                      onChange={(e) => setAutonomousMode(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#a0aec0]">Show Plan</span>
                    <input
                      type="checkbox"
                      checked={showPlan}
                      onChange={(e) => setShowPlan(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Ask NAME STUDIO AI... (${mode} mode)`}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm text-white placeholder-[#718096] outline-none disabled:opacity-50 rounded-xl transition-all duration-300"
            style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568', backdropFilter: 'blur(10px)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#4a5568'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:scale-105 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#718096]">
            ⚡ Ctrl+Enter to send • Powered by DeepSeek R1
          </p>
          {pendingChanges.length > 0 && (
            <div className="text-xs font-semibold text-[#f093fb]">
              {pendingChanges.length} pending change(s)
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
