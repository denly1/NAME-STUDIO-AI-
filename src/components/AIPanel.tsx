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
import { AgentMessageView } from './AgentMessageView';
import { AgentActivityPanel } from './AgentActivityPanel';
import { agentService } from '../services/agentService';
import { AgentMessage as CursorAgentMessage, AgentActivity, AgentDiff } from '../types/agent';

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
  const [viewMode, setViewMode] = useState<'chat' | 'files' | 'activity'>('chat');
  const [fileChanges, setFileChanges] = useState<Array<{
    path: string;
    action: 'edit' | 'create' | 'delete';
    oldContent?: string;
    newContent?: string;
    explanation: string;
    applied: boolean;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Cursor AI-like agent state
  const [agentMessages, setAgentMessages] = useState<CursorAgentMessage[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [currentDiff, setCurrentDiff] = useState<AgentDiff | null>(null);
  const [showActivityPanel, setShowActivityPanel] = useState(true);

  // Helper to refocus input after button clicks
  const refocusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Subscribe to agent service events
  useEffect(() => {
    // Subscribe to agent messages
    agentService.onMessage((message) => {
      setAgentMessages(prev => [...prev, message]);
    });

    // Subscribe to agent activities
    agentService.onActivity((activity) => {
      setAgentActivities(prev => [...prev, activity]);
    });

    return () => {
      // Cleanup subscriptions if needed
    };
  }, []);

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
    if (!currentDiff || !workspaceRoot) return;
    
    const change = currentDiff.files[index];
    if (!change) return;

    try {
      await agentService.applyFileChange(change, workspaceRoot);
      
      // Update in editor if file is open
      const fullPath = `${workspaceRoot}/${change.path}`;
      const openFileItem = openFiles.find(f => f.path === fullPath);
      if (openFileItem && change.newContent) {
        updateFileContent(fullPath, change.newContent);
        
        // Force editor refresh by re-reading the file
        const updatedContent = await window.electronAPI.fs.readFile(fullPath);
        updateFileContent(fullPath, updatedContent);
      }
      
      // Mark as applied in local state
      setFileChanges(prev => prev.map((c, i) => 
        i === index ? { ...c, applied: true } : c
      ));
      
    } catch (error) {
      console.error('Failed to apply change:', error);
      const errorMsg: CursorAgentMessage = {
        id: Date.now().toString(),
        type: 'error',
        content: `Failed to apply change: ${error}`,
        timestamp: new Date(),
        status: 'failed'
      };
      setAgentMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleApplyAllChanges = async () => {
    if (!currentDiff || !workspaceRoot) return;

    try {
      await agentService.applyAllChanges(currentDiff, workspaceRoot);
      
      // Update all files in editor
      for (const change of currentDiff.files) {
        const fullPath = `${workspaceRoot}/${change.path}`;
        const openFileItem = openFiles.find(f => f.path === fullPath);
        if (openFileItem && change.newContent) {
          updateFileContent(fullPath, change.newContent);
          
          // Force editor refresh by re-reading the file
          const updatedContent = await window.electronAPI.fs.readFile(fullPath);
          updateFileContent(fullPath, updatedContent);
        }
      }
      
      // Mark all as applied
      setFileChanges(prev => prev.map(c => ({ ...c, applied: true })));
      
    } catch (error) {
      console.error('Failed to apply all changes:', error);
    }
  };

  const handleUndoChanges = async () => {
    try {
      const success = await agentService.undoLastChanges();
      if (success) {
        // Reload files in editor
        for (const file of openFiles) {
          const content = await window.electronAPI.fs.readFile(file.path);
          updateFileContent(file.path, content);
        }
      }
    } catch (error) {
      console.error('Failed to undo changes:', error);
    }
  };

  const handleExplainChanges = async () => {
    if (!currentDiff) return;
    await agentService.explainChanges(currentDiff);
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
    if (!input.trim() || isLoading || !workspaceRoot) return;
    
    const userMessage = input;
    setInput('');
    setIsLoading(true);
    
    // Add user message to agent messages
    const userAgentMessage: CursorAgentMessage = {
      id: Date.now().toString(),
      type: 'text',
      content: userMessage,
      timestamp: new Date()
    };
    setAgentMessages(prev => [...prev, userAgentMessage]);
    
    try {
      aiService.setMode(mode);
      
      // Check if request involves file modifications (Cursor AI Agent mode)
      const isFileModificationRequest = 
        userMessage.toLowerCase().includes('изменить') ||
        userMessage.toLowerCase().includes('создать') ||
        userMessage.toLowerCase().includes('добавить') ||
        userMessage.toLowerCase().includes('исправить') ||
        userMessage.toLowerCase().includes('рефактор') ||
        userMessage.toLowerCase().includes('удалить') ||
        userMessage.toLowerCase().includes('файл') ||
        mode === 'code';

      if (isFileModificationRequest) {
        // Full Cursor AI-like agent lifecycle
        setIsAnalyzing(true);
        // Don't switch view mode - keep user in chat
        
        // Execute full agent request lifecycle
        const lifecycle = await agentService.executeRequest(
          userMessage,
          workspaceRoot,
          {
            openFiles: openFiles.map(f => f.path),
            currentFile: currentFile || undefined
          }
        );
        
        // Store the diff for later application
        if (lifecycle.diff) {
          setCurrentDiff(lifecycle.diff);
          // Don't switch to files view - keep user in chat
          
          // Convert to fileChanges format for AIAgentPanel
          setFileChanges(lifecycle.diff.files.map(f => ({
            path: f.path,
            action: f.action,
            oldContent: f.oldContent,
            newContent: f.newContent,
            explanation: f.explanation,
            applied: f.applied
          })));
        }
        
        setIsAnalyzing(false);
      } else {
        // Normal chat mode
        const context = {
          files: openFiles.map(f => ({ path: f.path, name: f.name, language: f.language })),
          currentFile: currentFile || undefined
        };
        
        const response = await aiService.chat(userMessage, context);
        
        // Add response as agent message
        const responseMessage: CursorAgentMessage = {
          id: Date.now().toString(),
          type: 'text',
          content: response,
          timestamp: new Date(),
          status: 'completed'
        };
        setAgentMessages(prev => [...prev, responseMessage]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      
      const errorAgentMessage: CursorAgentMessage = {
        id: Date.now().toString(),
        type: 'error',
        content: errorMessage,
        timestamp: new Date(),
        status: 'failed'
      };
      setAgentMessages(prev => [...prev, errorAgentMessage]);
      
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
        
        {/* View Mode Tabs (Chat / Files / Activity) */}
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
          <button
            onClick={() => setViewMode('activity')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold transition-all ${
              viewMode === 'activity'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-b-2 border-[#f093fb]'
                : 'text-[#a0aec0] hover:bg-white/5'
            }`}
          >
            <Play size={14} />
            <span>Activity</span>
            {agentActivities.filter(a => a.status === 'running').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#667eea] text-white text-[10px] rounded-full font-bold animate-pulse">
                {agentActivities.filter(a => a.status === 'running').length}
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

      {/* Content Area - Chat / Files / Activity */}
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
      ) : viewMode === 'activity' ? (
        <div className="flex-1 overflow-y-auto p-4" style={{ background: 'transparent' }}>
          <AgentActivityPanel
            activities={agentActivities}
            currentActivity={isAnalyzing ? 'Analyzing project...' : undefined}
          />
          
          {/* Undo Button */}
          {agentActivities.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleUndoChanges}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#3e3e3e',
                  color: '#fbbf24',
                  border: '1px solid #fbbf2440',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Undo size={16} />
                Undo Last Changes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3" style={{ background: 'transparent' }}>
          {agentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                <Sparkles size={32} style={{ color: '#667eea' }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-400 max-w-md">Ask me to help with your code, explain concepts, or make improvements</p>
            </div>
          ) : (
          agentMessages.map((msg, index) => (
            <AgentMessageView
              key={`${msg.id}-${index}`}
              message={msg}
              onApplyChange={handleApplyFileChange}
              onRejectChange={handleRejectFileChange}
              onApplyAll={handleApplyAllChanges}
              onRejectAll={() => setFileChanges([])}
              onUndo={handleUndoChanges}
              onExplain={handleExplainChanges}
            />
          ))
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && viewMode === 'chat' && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-500"></div>
            <span>Thinking...</span>
          </div>
        </div>
      )}

      {/* Input */}
      {viewMode === 'chat' && (
      <div className="p-3 border-t" style={{ borderColor: '#2d2d2d', background: '#1e1e1e' }}>
        <div className="flex gap-2">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                refocusInput();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="Quick Actions"
            >
              <Sparkles size={18} />
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
            placeholder="Ask AI..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm text-white placeholder-gray-500 bg-transparent outline-none disabled:opacity-50 border rounded"
            style={{ borderColor: '#2d2d2d', background: '#252525' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: input.trim() ? '#0066ff' : '#2d2d2d' }}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#718096]">
            ⚡ Ctrl+Enter to send • Timeweb DeepSeek V3.2
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
