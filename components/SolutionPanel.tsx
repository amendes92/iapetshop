import React, { useEffect, useState } from 'react';
import { X, Sparkles, Wand2, CheckCircle2, AlertCircle, Database, Megaphone, Copy, Share2, LayoutDashboard, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PetShopLead } from '../types';
import { generateBusinessSolutions, generateMarketingContent } from '../services/geminiService';

interface SolutionPanelProps {
  lead: PetShopLead | null;
  onClose: () => void;
}

type TabType = 'details' | 'strategy' | 'marketing';

export const SolutionPanel: React.FC<SolutionPanelProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  // Strategy State
  const [solution, setSolution] = useState<string | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [errorStrategy, setErrorStrategy] = useState<string | null>(null);

  // Marketing Suite State
  const [marketingPlatform, setMarketingPlatform] = useState('Instagram Feed');
  const [marketingTopic, setMarketingTopic] = useState('Promoção de Banho');
  const [marketingTone, setMarketingTone] = useState('Divertido');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [loadingMarketing, setLoadingMarketing] = useState(false);

  useEffect(() => {
    if (lead) {
      // Reset states when lead changes
      setSolution(null);
      setErrorStrategy(null);
      setGeneratedContent(null);
      setActiveTab('details');
      // Optional: Auto-generate strategy could be disabled to save tokens, 
      // but keeping it if user wants immediate value is fine. 
      // For now, let's load it only if they go to the tab or auto-load:
      // handleGenerateStrategy(); // Uncomment to auto-load
    }
  }, [lead]);

  const handleGenerateStrategy = async () => {
    if (!lead || solution) return; // Don't regenerate if exists
    
    setLoadingStrategy(true);
    setErrorStrategy(null);
    
    try {
      const result = await generateBusinessSolutions(lead);
      setSolution(result);
    } catch (err) {
      setErrorStrategy("Falha ao gerar insights. Tente novamente.");
    } finally {
      setLoadingStrategy(false);
    }
  };

  const handleGenerateMarketing = async () => {
    if (!lead) return;
    setLoadingMarketing(true);
    setGeneratedContent(null);
    try {
      const content = await generateMarketingContent(lead, marketingPlatform, marketingTopic, marketingTone);
      setGeneratedContent(content);
    } catch (error) {
      setGeneratedContent("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setLoadingMarketing(false);
    }
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      // Could add a toast here
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Trigger strategy generation when switching to that tab
  useEffect(() => {
    if (activeTab === 'strategy' && !solution && !loadingStrategy) {
      handleGenerateStrategy();
    }
  }, [activeTab]);

  if (!lead) return null;

  const displayName = lead.business_name || lead.nome || 'Detalhes do Lead';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        
        {/* Panel Header */}
        <div className="flex-shrink-0 bg-white z-10">
          <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-brand-50 to-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 line-clamp-1">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                 <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs font-mono">ID: {lead.id}</span>
                 <span className="text-gray-300">|</span>
                 <span>{lead.cidade || 'Localização não informada'}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database size={16} />
              Dados
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'strategy' 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LayoutDashboard size={16} />
              Consultoria
            </button>
            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'marketing' 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Megaphone size={16} />
              Suite Marketing
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-gray-50/50">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="animate-fade-in">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        Campo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(lead).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {formatKey(key)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 break-words whitespace-normal">
                          {formatValue(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CONSULTANCY STRATEGY */}
          {activeTab === 'strategy' && (
            <div className="animate-fade-in space-y-4">
               <div className="bg-white rounded-2xl border-2 border-brand-100 overflow-hidden shadow-sm">
                <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-800">
                    <Sparkles size={20} className="text-brand-600" />
                    <h3 className="font-bold">Consultor IA: Estratégia de Negócios</h3>
                  </div>
                  {!loadingStrategy && !solution && (
                    <button 
                      onClick={handleGenerateStrategy} 
                      className="text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-full hover:bg-brand-700 transition flex items-center gap-1"
                    >
                      <Wand2 size={12} /> Gerar Análise
                    </button>
                  )}
                </div>

                <div className="p-6 min-h-[300px]">
                  {loadingStrategy ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 text-center py-12">
                       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                       <p className="text-sm text-gray-500 animate-pulse">Analisando dados do mercado pet...<br/>Criando plano estratégico.</p>
                    </div>
                  ) : errorStrategy ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 text-red-500 gap-2">
                      <AlertCircle size={32} />
                      <p>{errorStrategy}</p>
                      <button onClick={handleGenerateStrategy} className="text-sm underline">Tentar novamente</button>
                    </div>
                  ) : solution ? (
                    <div className="prose prose-sm prose-teal max-w-none">
                      <ReactMarkdown 
                         components={{
                            h1: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mb-3 mt-4" {...props} />,
                            h2: ({node, ...props}) => <h4 className="text-base font-bold text-brand-700 mb-2 mt-4 flex items-center gap-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-2 mb-4 text-gray-600" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <span className="font-bold text-gray-800" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-600" {...props} />,
                         }}
                      >
                        {solution}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-gray-400">
                      <LayoutDashboard size={48} strokeWidth={1} className="mb-3 opacity-50" />
                      <p className="text-sm">Inicie a análise para receber<br/>estratégias personalizadas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKETING SUITE */}
          {activeTab === 'marketing' && (
            <div className="animate-fade-in space-y-6">
              
              {/* Controls */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Megaphone size={20} className="text-brand-500" />
                  Gerador de Conteúdo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plataforma</label>
                    <select 
                      value={marketingPlatform}
                      onChange={(e) => setMarketingPlatform(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                      <option>Instagram Feed</option>
                      <option>Instagram Stories</option>
                      <option>WhatsApp (Direct)</option>
                      <option>Email Marketing</option>
                      <option>TikTok Roteiro</option>
                      <option>LinkedIn Post</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tom de Voz</label>
                    <select 
                      value={marketingTone}
                      onChange={(e) => setMarketingTone(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                      <option>Divertido e Engraçado 🐶</option>
                      <option>Profissional e Sério 👔</option>
                      <option>Urgente / Promoção ⚡</option>
                      <option>Carinhoso / Emocional ❤️</option>
                      <option>Educativo 💡</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tópico ou Foco</label>
                    <select 
                      value={marketingTopic}
                      onChange={(e) => setMarketingTopic(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                      <option>Promoção de Banho e Tosa</option>
                      <option>Dicas de Saúde Pet</option>
                      <option>Novidades / Novos Produtos</option>
                      <option>Apresentação da Equipe</option>
                      <option>Cliente Feliz (Prova Social)</option>
                      <option>Vacinação / Veterinário</option>
                      <option>Convite para Evento</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateMarketing}
                  disabled={loadingMarketing}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition shadow-md shadow-brand-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingMarketing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Criando Conteúdo...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      Gerar Conteúdo
                    </>
                  )}
                </button>
              </div>

              {/* Result Area */}
              {generatedContent && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-fade-in-up">
                  <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
                     <span className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2">
                        <FileText size={14} /> Resultado Gerado
                     </span>
                     <div className="flex gap-2">
                        <button 
                           onClick={handleCopyContent}
                           className="p-1.5 hover:bg-gray-700 rounded transition text-gray-300 hover:text-white"
                           title="Copiar texto"
                        >
                           <Copy size={16} />
                        </button>
                     </div>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                      {generatedContent}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                    <p className="text-xs text-gray-400">Revise o conteúdo antes de postar.</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};