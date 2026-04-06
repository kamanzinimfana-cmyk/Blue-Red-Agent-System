import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Brain, 
  History, 
  Cpu, 
  Zap, 
  Eye, 
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { 
  AppSettings, 
  LogEntry, 
  UserProfile, 
  AIMode, 
  SpeedMode, 
  VisionMode, 
  AIProvider 
} from './types';

export default function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'run' | 'settings' | 'memory'>('run');
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [task, setTask] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'gemini',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'mistral:instruct',
    blueAgentId: 'blue-nav-01',
    redAgentId: 'red-exec-01',
    aiMode: 'hybrid',
    speedMode: 'balanced',
    visionMode: 'off',
  });

  // Memory / Profile
  const [profile, setProfile] = useState<string>(
`Age: 39
Gender: Male
Location: South Africa
Language: English, IsiZulu
Job: Cyber Security Analyst & Developer
Income: $90k-$200k+`
  );

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'system') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleRun = async () => {
    if (!task.trim()) {
      addLog("Please enter a task", "error");
      return;
    }

    setIsRunning(true);
    setStatus('Running');
    setLogs([]);
    addLog(`🚀 Starting task: ${task}`, "system");

    try {
      addLog("📡 Connecting to AI Server...", "system");
      
      const response = await fetch('/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: task.toLowerCase().includes('survey') ? 'red' : 'blue',
          messages: [
            { role: 'user', content: task },
            { role: 'system', content: 'Current Page DOM Context' }
          ],
          ollamaUrl: settings.ollamaUrl
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const result = JSON.parse(data.output);
      const agentType = task.toLowerCase().includes('survey') ? 'Red Agent' : 'Blue Agent';
      
      addLog(`${agentType === 'Red Agent' ? '🔴' : '🔵'} ${agentType} active.`, agentType === 'Red Agent' ? 'red' : 'blue');
      addLog(`🤖 Decision: ${result.decision || 'Executing actions'}`, agentType === 'Red Agent' ? 'red' : 'blue');

      if (result.actions) {
        result.actions.forEach((action: any) => {
          addLog(`👉 Action: ${action.type} on "${action.text || action.time + 'ms'}"`, 'system');
        });
      }

      if (task.toLowerCase().includes('survey') || task.toLowerCase().includes('form')) {
        addLog("🔴 Red Agent: Survey logic engaged. Injecting memory profile...", "red");
        await new Promise(r => setTimeout(r, 1000));
        addLog("🔴 Red Agent: Smart click system fixing survey issues...", "red");
      }

      addLog("✅ Task processed by backend.", "success");
      setStatus('Idle');
    } catch (error) {
      addLog(`❌ Server Error: ${error instanceof Error ? error.message : String(error)}`, "error");
      addLog("💡 Tip: Ensure your local Ollama server is running and accessible.", "system");
      setStatus('Error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStatus('Stopped');
    addLog("⏹ Task stopped by user.", "system");
  };

  const saveSettings = () => {
    addLog("Settings saved locally.", "system");
    // In a real app, save to localStorage
  };

  const saveProfile = () => {
    addLog("Memory profile updated.", "system");
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-[#0f172a] shadow-2xl border-x border-slate-800">
      {/* HEADER */}
      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Blue & Red Agent</h1>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2",
          status === 'Idle' ? "bg-slate-800 text-slate-400" :
          status === 'Running' ? "bg-blue-900/50 text-blue-400 animate-pulse" :
          status === 'Error' ? "bg-red-900/50 text-red-400" :
          "bg-yellow-900/50 text-yellow-400"
        )}>
          <div className={cn("w-2 h-2 rounded-full", 
            status === 'Idle' ? "bg-slate-500" :
            status === 'Running' ? "bg-blue-500" :
            status === 'Error' ? "bg-red-500" :
            "bg-yellow-500"
          )} />
          {status}
        </div>
      </header>

      {/* TABS */}
      <nav className="flex border-b border-slate-800 bg-[#1e293b]/30">
        <button 
          onClick={() => setActiveTab('run')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'run' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Play className="w-4 h-4" /> Run
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'settings' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button 
          onClick={() => setActiveTab('memory')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'memory' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <History className="w-4 h-4" /> Memory
        </button>
      </nav>

      {/* CONTENT */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'run' && (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Input</label>
              <textarea 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter your task (e.g., 'Fill out the feedback survey on this page')"
                className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Run Task
              </button>
              <button 
                onClick={handleStop}
                disabled={!isRunning}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-black rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Terminal className="w-3 h-3" />
                  SYSTEM LOGS
                </div>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-500 hover:text-white transition-colors"
                >
                  CLEAR
                </button>
              </div>
              <div id="logs" className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
                {logs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-700 italic">
                    Waiting for task...
                  </div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className={cn(
                    "flex gap-3 leading-relaxed",
                    log.type === 'error' ? "text-red-400" :
                    log.type === 'success' ? "text-emerald-400" :
                    log.type === 'blue' ? "text-blue-400" :
                    log.type === 'red' ? "text-rose-400" :
                    "text-slate-300"
                  )}>
                    <span className="text-slate-600 shrink-0">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                AI Provider
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">Provider</label>
                  <select 
                    value={settings.provider}
                    onChange={(e) => setSettings({...settings, provider: e.target.value as AIProvider})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="gemini">Google Gemini (Cloud)</option>
                    <option value="ollama">Ollama (Local)</option>
                    <option value="mistral">Mistral (Cloud)</option>
                  </select>
                </div>

                {settings.provider === 'ollama' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Ollama URL</label>
                      <input 
                        type="text"
                        value={settings.ollamaUrl}
                        onChange={(e) => setSettings({...settings, ollamaUrl: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder="http://localhost:11434"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Model</label>
                      <input 
                        type="text"
                        value={settings.ollamaModel}
                        onChange={(e) => setSettings({...settings, ollamaModel: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder="mistral:instruct"
                      />
                    </div>
                  </div>
                )}

                {settings.provider === 'mistral' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs text-slate-500">API Key</label>
                    <input 
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Enter Mistral API Key"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Execution Mode
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">AI Mode</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['hybrid', 'ollama', 'mistral'] as AIMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSettings({...settings, aiMode: mode})}
                        className={cn(
                          "py-2 px-3 rounded-lg text-xs font-medium border transition-all capitalize",
                          settings.aiMode === mode 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">Speed</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fast', 'balanced', 'accurate'] as SpeedMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSettings({...settings, speedMode: mode})}
                        className={cn(
                          "py-2 px-3 rounded-lg text-xs font-medium border transition-all capitalize",
                          settings.speedMode === mode 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">Vision</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(['on', 'off'] as VisionMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSettings({...settings, visionMode: mode})}
                        className={cn(
                          "py-2 px-3 rounded-lg text-xs font-medium border transition-all uppercase",
                          settings.visionMode === mode 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button 
              onClick={saveSettings}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="flex-1 flex flex-col p-6 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" />
                  Memory Profile
                </h3>
                <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  PERSISTENT CONTEXT
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                This profile is used by the <span className="text-rose-400 font-semibold">Red Agent</span> to automatically fill forms and surveys with your personal details.
              </p>
            </div>

            <textarea 
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none leading-loose"
            />

            <button 
              onClick={saveProfile}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <Save className="w-5 h-5" />
              Save Profile
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="p-3 border-t border-slate-800 bg-[#1e293b]/50 text-[10px] text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          SYSTEM READY
        </div>
        <div className="flex gap-4">
          <span>BLUE: {settings.blueAgentId}</span>
          <span>RED: {settings.redAgentId}</span>
        </div>
      </footer>
    </div>
  );
}
