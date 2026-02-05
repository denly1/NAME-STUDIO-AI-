import { useState } from 'react';
import { Send, Trash2, Sparkles, Code, MessageCircle, ListChecks, Bug, Wand2, FileText, TestTube, FolderSearch, Undo, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { aiService, AIMode, AgentResponse } from '../services/aiService';
import DiffViewer from './DiffViewer';

interface CodeChange {
  file: string;
  content: string;
  applied: boolean;
}

interface AgentStep {
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  files_affected?: string[];
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
  const { openFiles, currentFile, updateFileContent, workspaceRoot } = useStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AIMode>('code');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([]);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [showPlan, setShowPlan] = useState(true);

  const applyChange = async (change: CodeChange, messageIndex: number) => {
    try {
      // Update file
      await window.electronAPI.fs.writeFile(change.file, change.content);
      
      // Update in editor if file is open
      const openFile = openFiles.find(f => f.path === change.file);
      if (openFile) {
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
      
      // Build agent context
      const agentContext = {
        task: userMessage,
        current_file: currentFile || undefined,
        file_content: currentFile ? openFiles.find(f => f.path === currentFile)?.content : undefined,
        open_files: openFiles.map(f => ({ path: f.path, name: f.name, language: f.language })),
        project_tree: [],
        dependencies: [],
        errors: []
      };
      
      let fullResponse = '';
      
      // Use streaming for real-time updates
      await aiService.chatStream(
        userMessage,
        mode === 'code' ? agentContext : undefined,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              role: 'assistant',
              content: fullResponse
            };
            return newMessages;
          });
        }
      );
      
      // Try to parse JSON response for agent mode
      let codeChanges: CodeChange[] = [];
      if (mode === 'code') {
        try {
          // Extract JSON from response (might be wrapped in markdown)
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const agentResponse = JSON.parse(jsonMatch[0]);
            
            // Convert patches to code changes
            if (agentResponse.patches && agentResponse.patches.length > 0) {
              codeChanges = agentResponse.patches.map((patch: any) => ({
                file: patch.file,
                content: patch.diff,
                applied: false
              }));
            }
            
            // Add new files
            if (agentResponse.new_files && agentResponse.new_files.length > 0) {
              codeChanges.push(...agentResponse.new_files.map((nf: any) => ({
                file: nf.path,
                content: nf.content,
                applied: false
              })));
            }
            
            if (codeChanges.length > 0) {
              setPendingChanges(codeChanges);
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[assistantMessageIndex] = {
                  ...newMessages[assistantMessageIndex],
                  changes: codeChanges
                };
                return newMessages;
              });
            }
          }
        } catch (e) {
          console.log('Response is not JSON, treating as plain text');
        }
      }
      
      // Response already set via streaming, just ensure changes are attached
      if (codeChanges.length > 0) {
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex].changes = codeChanges;
          }
          return newMessages;
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
      
      // If it's a quota error, show additional help
      if (errorMessage.includes('Quota Exceeded')) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `💡 How to fix:\n\n1. Go to https://platform.openai.com/account/billing\n2. Add credits to your account\n3. Or get a new API key from https://platform.openai.com/api-keys\n4. Update the key in: src/services/aiService.ts`
          }]);
        }, 500);
      }
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

      {/* Quick Actions */}
      <div className="border-b border-[#3e3e3e] p-3 bg-[#1e1e1e]">
        <div className="text-xs text-[#858585] mb-2 font-semibold">Quick Actions</div>
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={async () => {
              if (!currentFile) return alert('No file selected');
              const file = openFiles.find(f => f.path === currentFile);
              if (!file) return;
              setIsLoading(true);
              try {
                const response = await aiService.fixError('Fix any errors in this code', file.content, file.path);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: response.analysis,
                  plan: response.plan,
                  risks: response.risks
                }]);
              } catch (error) {
                alert('Error: ' + error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#2a2d2e] transition-all text-[#a0aec0] hover:text-white"
            title="Fix errors in current file"
          >
            <Bug size={16} />
            <span className="text-[10px]">Fix Error</span>
          </button>

          <button
            onClick={async () => {
              if (!currentFile) return alert('No file selected');
              const file = openFiles.find(f => f.path === currentFile);
              if (!file) return;
              setIsLoading(true);
              try {
                const response = await aiService.refactorCode(file.content, file.path);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: response.analysis,
                  plan: response.plan,
                  risks: response.risks
                }]);
              } catch (error) {
                alert('Error: ' + error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#2a2d2e] transition-all text-[#a0aec0] hover:text-white"
            title="Refactor current file"
          >
            <Wand2 size={16} />
            <span className="text-[10px]">Refactor</span>
          </button>

          <button
            onClick={async () => {
              if (!currentFile) return alert('No file selected');
              const file = openFiles.find(f => f.path === currentFile);
              if (!file) return;
              setIsLoading(true);
              try {
                const explanation = await aiService.explainCode(file.content, file.name);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: explanation
                }]);
              } catch (error) {
                alert('Error: ' + error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#2a2d2e] transition-all text-[#a0aec0] hover:text-white"
            title="Explain current code"
          >
            <FileText size={16} />
            <span className="text-[10px]">Explain</span>
          </button>

          <button
            onClick={async () => {
              if (!currentFile) return alert('No file selected');
              const file = openFiles.find(f => f.path === currentFile);
              if (!file) return;
              setIsLoading(true);
              try {
                const tests = await aiService.generateTests(file.path, file.content);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `Generated tests:\n\n${tests}`
                }]);
              } catch (error) {
                alert('Error: ' + error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#2a2d2e] transition-all text-[#a0aec0] hover:text-white"
            title="Generate tests"
          >
            <TestTube size={16} />
            <span className="text-[10px]">Tests</span>
          </button>

          <button
            onClick={async () => {
              if (!workspaceRoot) return alert('No workspace open');
              setIsLoading(true);
              try {
                const analysis = await aiService.analyzeProject(workspaceRoot);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `Project Analysis:\n\n${JSON.stringify(analysis, null, 2)}`
                }]);
              } catch (error) {
                alert('Error: ' + error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#2a2d2e] transition-all text-[#a0aec0] hover:text-white"
            title="Analyze project"
          >
            <FolderSearch size={16} />
            <span className="text-[10px]">Analyze</span>
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[#858585] cursor-pointer">
            <input
              type="checkbox"
              checked={autonomousMode}
              onChange={(e) => setAutonomousMode(e.target.checked)}
              className="rounded"
            />
            <span>Autonomous Mode</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-[#858585] cursor-pointer">
            <input
              type="checkbox"
              checked={showPlan}
              onChange={(e) => setShowPlan(e.target.checked)}
              className="rounded"
            />
            <span>Show Plan</span>
          </label>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'transparent' }}>
        {messages.length === 0 ? (
          <div className="text-center mt-12">
            <div className="inline-block p-4 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 40px rgba(102, 126, 234, 0.6)' }}>
              <Sparkles size={48} className="text-white" />
            </div>
            <p className="text-2xl font-black mb-2" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome to NAME STUDIO AI</p>
            <p className="text-sm text-[#a0aec0] mb-1">Your Premium AI-Powered Coding Assistant</p>
            <p className="text-xs text-[#718096] mt-3">✨ Powered by DeepSeek R1 - Advanced reasoning AI for your code</p>
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
                        {step.status === 'completed' && <CheckCircle size={12} className="text-green-400" />}
                        {step.status === 'in_progress' && <Play size={12} className="text-blue-400" />}
                        {step.status === 'failed' && <AlertTriangle size={12} className="text-red-400" />}
                        {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-[#4a5568]" />}
                        <span className="text-[#a0aec0]">{step.description}</span>
                        {step.files_affected && step.files_affected.length > 0 && (
                          <span className="text-[#718096] text-[10px]">({step.files_affected.length} files)</span>
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
        {isLoading && (
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
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#4a5568]" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="flex gap-2">
          <input
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
    </div>
  );
}
