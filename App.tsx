import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BlockType, ProtocolBlock, TargetLanguage, AISettings, AIProvider } from './types';
import { INITIAL_SCHEMA, SAMPLE_HEX } from './constants';
import { BlockItem } from './components/BlockItem';
import { generateParsingCode, simulateParsing } from './services/aiService';
import { Code, Play, Plus, RefreshCw, FileText, LayoutTemplate, Terminal, Settings, X, Save } from 'lucide-react';

// --- Recursive Helpers ---

const updateBlockRecursively = (blocks: ProtocolBlock[], id: string, updates: Partial<ProtocolBlock>): ProtocolBlock[] => {
  return blocks.map(b => {
    if (b.id === id) return { ...b, ...updates };
    if (b.children) return { ...b, children: updateBlockRecursively(b.children, id, updates) };
    return b;
  });
};

const deleteBlockRecursively = (blocks: ProtocolBlock[], id: string): ProtocolBlock[] => {
  return blocks.filter(b => b.id !== id).map(b => ({
    ...b,
    children: b.children ? deleteBlockRecursively(b.children, id) : undefined
  }));
};

const addChildRecursively = (blocks: ProtocolBlock[], parentId: string, newBlock: ProtocolBlock): ProtocolBlock[] => {
  return blocks.map(b => {
    if (b.id === parentId) {
      return { ...b, children: [...(b.children || []), newBlock] };
    }
    if (b.children) {
      return { ...b, children: addChildRecursively(b.children, parentId, newBlock) };
    }
    return b;
  });
};

// --- Drag and Drop Helpers ---

const findParent = (blocks: ProtocolBlock[], id: string, parent: ProtocolBlock | null = null): { parent: ProtocolBlock | null, index: number } | null => {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return { parent, index: i };
    if (blocks[i].children) {
      const res = findParent(blocks[i].children!, id, blocks[i]);
      if (res) return res;
    }
  }
  return null;
};

// Flatten tree to find blocks easily (optional but useful if findParent isn't enough)
const findBlock = (blocks: ProtocolBlock[], id: string): ProtocolBlock | undefined => {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

const App: React.FC = () => {
  const [schema, setSchema] = useState<ProtocolBlock[]>(INITIAL_SCHEMA);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.CSharp);
  const [activeTab, setActiveTab] = useState<'editor' | 'test'>('editor');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'google',
    apiKey: '',
    model: ''
  });

  // Generation State
  const [generatedCode, setGeneratedCode] = useState<string>("// Click 'Generate Code' to build your parser.");
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulation State
  const [hexInput, setHexInput] = useState(SAMPLE_HEX);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleUpdateBlock = (id: string, updates: Partial<ProtocolBlock>) => {
    setSchema(prev => updateBlockRecursively(prev, id, updates));
  };

  const handleDeleteBlock = (id: string) => {
    setSchema(prev => deleteBlockRecursively(prev, id));
  };

  const handleAddChild = (parentId: string) => {
    const newBlock: ProtocolBlock = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'new_field',
      type: BlockType.Int32
    };
    setSchema(prev => addChildRecursively(prev, parentId, newBlock));
  };

  const handleAddRoot = () => {
    const newBlock: ProtocolBlock = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'NewStruct',
      type: BlockType.Struct,
      children: []
    };
    setSchema(prev => [...prev, newBlock]);
  };

  // Move Logic: Remove from old location, insert before target location
  const handleMoveBlock = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;

    setSchema(prevSchema => {
      // 1. Deep clone to avoid mutation issues
      const newSchema = JSON.parse(JSON.stringify(prevSchema)) as ProtocolBlock[];

      // 2. Find Source and remove it
      const sourceInfo = findParent(newSchema, dragId);
      if (!sourceInfo) return prevSchema;
      
      const sourceList = sourceInfo.parent ? sourceInfo.parent.children! : newSchema;
      const [movedBlock] = sourceList.splice(sourceInfo.index, 1);

      // 3. Find Target and insert before it
      // Note: After removal, we must re-find target because indices might have shifted if in same list
      const targetInfo = findParent(newSchema, targetId);
      if (!targetInfo) {
        // Fallback: if target not found (maybe it was deleted?), just put it back?
        // Simpler: Just abort or push to root. Aborting is safer.
        return prevSchema; 
      }

      const targetList = targetInfo.parent ? targetInfo.parent.children! : newSchema;
      // Check if we are dropping *into* a container that is empty? 
      // Current BlockItem DnD logic sends targetId as the item dropped ON.
      // So we insert *before* that item.
      targetList.splice(targetInfo.index, 0, movedBlock);

      return newSchema;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const code = await generateParsingCode(schema, targetLang, aiSettings);
    setGeneratedCode(code);
    setIsGenerating(false);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    const result = await simulateParsing(schema, hexInput, aiSettings);
    setSimulationResult(result);
    setIsSimulating(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-96 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={18} /> AI Configuration</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">AI Provider</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  value={aiSettings.provider}
                  onChange={e => setAiSettings({...aiSettings, provider: e.target.value as AIProvider})}
                >
                  <option value="google">Google GenAI (Gemini)</option>
                  <option value="openai">OpenAI (GPT-4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  API Key {aiSettings.provider === 'google' && <span className="text-gray-500 font-normal">(Optional if using default env)</span>}
                </label>
                <input 
                  type="password"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none placeholder-gray-700"
                  placeholder={aiSettings.provider === 'google' ? "Leave empty to use env.API_KEY" : "sk-..."}
                  value={aiSettings.apiKey}
                  onChange={e => setAiSettings({...aiSettings, apiKey: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Model Name (Optional)</label>
                <input 
                  type="text"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none placeholder-gray-700"
                  placeholder={aiSettings.provider === 'google' ? "gemini-2.5-flash" : "gpt-4o"}
                  value={aiSettings.model || ''}
                  onChange={e => setAiSettings({...aiSettings, model: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
            <LayoutTemplate size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Protocol Puzzle</h1>
            <p className="text-xs text-gray-500">Visual Parser Generator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowSettings(true)}
             className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition-colors"
             title="AI Settings"
           >
             <Settings size={18} />
           </button>
           <div className="h-6 w-px bg-gray-700 mx-1"></div>
           
           <a 
            href="https://github.com/google/genai" 
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
           >
             <FileText size={14} /> README
           </a>
           <div className="h-6 w-px bg-gray-700 mx-2"></div>
           <select 
             className="bg-gray-800 border border-gray-700 text-sm rounded px-3 py-1.5 focus:border-blue-500 outline-none"
             value={targetLang}
             onChange={(e) => setTargetLang(e.target.value as TargetLanguage)}
           >
             {Object.values(TargetLanguage).map(l => (
               <option key={l} value={l}>{l}</option>
             ))}
           </select>
           <button 
             onClick={handleGenerate}
             disabled={isGenerating}
             className={`flex items-center gap-2 px-4 py-1.5 rounded font-medium text-sm transition-all ${isGenerating ? 'bg-gray-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}
           >
             {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Code size={16} />}
             Generate Code
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Block Editor */}
        <section className="w-1/3 min-w-[350px] border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Protocol Structure</h2>
            <button onClick={handleAddRoot} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded flex items-center gap-1">
              <Plus size={12} /> Add Root
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {schema.map(block => (
              <BlockItem 
                key={block.id} 
                block={block} 
                depth={0} 
                onUpdate={handleUpdateBlock}
                onDelete={handleDeleteBlock}
                onAddChild={handleAddChild}
                onMove={handleMoveBlock}
              />
            ))}
          </div>
        </section>

        {/* Right Panel: Code & Test */}
        <section className="flex-1 flex flex-col bg-[#0d1117]">
          {/* Tabs */}
          <div className="flex border-b border-gray-800 bg-gray-900">
             <button 
               onClick={() => setActiveTab('editor')}
               className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'editor' ? 'border-blue-500 text-blue-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
             >
               <Code size={16} /> Source Code
             </button>
             <button 
               onClick={() => setActiveTab('test')}
               className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'test' ? 'border-purple-500 text-purple-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
             >
               <Terminal size={16} /> Test Lab
             </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'editor' ? (
              <div className="h-full w-full overflow-auto p-6">
                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {generatedCode}
                </pre>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col p-6 gap-6 overflow-auto">
                {/* Test Input */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-300">Hex Stream Input</label>
                    <button 
                      onClick={handleSimulate}
                      disabled={isSimulating}
                      className="flex items-center gap-2 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      {isSimulating ? <RefreshCw className="animate-spin" size={12} /> : <Play size={12} />}
                      Run Parser Simulation
                    </button>
                  </div>
                  <textarea 
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    className="w-full h-24 bg-black/50 border border-gray-700 rounded p-3 text-sm font-mono text-green-400 focus:border-green-500 outline-none resize-none"
                    placeholder="e.g. AA 01 04 00..."
                  />
                  <p className="text-xs text-gray-500 mt-2">Paste your hexadecimal data here. The AI will simulate the parsing logic defined in your blocks.</p>
                </div>

                {/* Test Output */}
                <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col min-h-[300px]">
                   <label className="text-sm font-medium text-gray-300 mb-3">Parsed Output (JSON Representation)</label>
                   <div className="flex-1 bg-black/50 rounded p-4 font-mono text-sm overflow-auto text-blue-300 border border-gray-800">
                      {simulationResult ? (
                        JSON.stringify(simulationResult, null, 2)
                      ) : (
                        <span className="text-gray-600">// Output will appear here after simulation</span>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
