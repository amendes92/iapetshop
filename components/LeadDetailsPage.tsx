import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, MapPin, Phone, User, 
  Sparkles, Wand2, Megaphone, Database, 
  LayoutDashboard, Copy, CheckCircle2, 
  AlertCircle, Building2, Calendar, Gauge, 
  Globe, Image as ImageIcon, Mic, Play, MessageSquare, Send,
  Mail, ShieldQuestion, Search as SearchIcon, ExternalLink, RefreshCw, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PetShopLead, LeadScore, ChatMessage, SeoAudit, ColdEmail, Objection } from '../types';
import { 
  generateBusinessSolutions, 
  generateMarketingContent,
  generateLeadScore,
  searchCompetitors,
  generateLogoConcept,
  generateAudioBriefing,
  createSalesChat,
  generateSeoAudit,
  generateColdEmail,
  generateObjections
} from '../services/geminiService';
import { PLACEHOLDER_IMAGES } from '../constants';
import { Chat } from "@google/genai";
import { Skeleton } from './Skeleton';

interface LeadDetailsPageProps {
  lead: PetShopLead;
  onBack: () => void;
}

type TabType = 'details' | 'strategy' | 'marketing' | 'intel' | 'sales';

export const LeadDetailsPage: React.FC<LeadDetailsPageProps> = ({ lead, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Feature States
  const [scoreData, setScoreData] = useState<LeadScore | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [marketingPlatform, setMarketingPlatform] = useState('Instagram Feed');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [competitorInfo, setCompetitorInfo] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [seoData, setSeoData] = useState<SeoAudit | null>(null);
  const [audioBriefing, setAudioBriefing] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [coldEmail, setColdEmail] = useState<ColdEmail | null>(null);
  const [objections, setObjections] = useState<Objection[] | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const imageUrl = PLACEHOLDER_IMAGES[(lead.id || 0) % PLACEHOLDER_IMAGES.length];
  const displayName = lead.business_name || lead.nome || lead.name || 'Pet Shop';

  // --- Handlers ---
  const handleGenerateScore = async () => { if (scoreData) return; setLoadingAction('score'); try { const data = await generateLeadScore(lead); setScoreData(data); } catch (e) { console.error(e); } setLoadingAction(null); };
  const handleGenerateStrategy = async () => { if (solution) return; setLoadingAction('strategy'); try { const res = await generateBusinessSolutions(lead); setSolution(res); } catch (e) { console.error(e); } setLoadingAction(null); };
  const handleGenerateIntel = async () => { if (competitorInfo && logoImage && seoData) return; setLoadingAction('intel'); try { const [compRes, logoRes, seoRes] = await Promise.allSettled([searchCompetitors(lead), generateLogoConcept(lead), generateSeoAudit(lead)]); if (compRes.status === 'fulfilled') setCompetitorInfo(compRes.value); if (logoRes.status === 'fulfilled') setLogoImage(logoRes.value); if (seoRes.status === 'fulfilled') setSeoData(seoRes.value); } catch (e) { console.error(e); } setLoadingAction(null); };
  const handleGenerateSalesTools = async () => { if (coldEmail && objections) return; setLoadingAction('sales'); try { const [emailRes, objRes] = await Promise.allSettled([generateColdEmail(lead), generateObjections(lead)]); if (emailRes.status === 'fulfilled') setColdEmail(emailRes.value); if (objRes.status === 'fulfilled') setObjections(objRes.value); } catch (e) { console.error(e); } setLoadingAction(null); };
  const handleGenerateMarketing = async () => { setLoadingAction('marketing'); try { const res = await generateMarketingContent(lead, marketingPlatform, 'Promoção', 'Divertido'); setGeneratedContent(res); } catch (e) { console.error(e); } setLoadingAction(null); };
  
  const handlePlayAudio = async () => {
    if (isPlaying) return;
    if (!audioBriefing) {
      setLoadingAction('audio');
      try {
        const base64 = await generateAudioBriefing(lead);
        setAudioBriefing(base64);
        playBase64Audio(base64);
      } catch (e) { console.error(e); alert("Erro ao gerar áudio. Verifique sua chave API."); }
      setLoadingAction(null);
    } else { playBase64Audio(audioBriefing); }
  };

  const playBase64Audio = async (base64: string) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const ctx = audioContextRef.current;
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0)); 
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      setIsPlaying(true);
      source.start(0);
    } catch (e) { console.error("Audio playback error", e); setIsPlaying(false); }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    let chat = chatSession;
    if (!chat) { chat = createSalesChat(lead); setChatSession(chat); }
    const newMessage: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setLoadingAction('chat');
    try {
      const result = await chat!.sendMessage({ message: newMessage.text });
      setChatMessages(prev => [...prev, { role: 'model', text: result.text || "..." }]);
    } catch (e) { console.error(e); }
    setLoadingAction(null);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'strategy') handleGenerateStrategy();
    if (activeTab === 'intel') handleGenerateIntel();
    if (activeTab === 'sales') handleGenerateSalesTools();
    if (activeTab === 'sales' && !chatSession) setChatMessages([{ role: 'model', text: "Alô? Aqui é o dono da loja." }]);
    handleGenerateScore();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      
      {/* HERO SECTION */}
      <div className="relative bg-slate-900 pb-24 pt-24 lg:pt-28">
         <div className="absolute inset-0 overflow-hidden">
             <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-30 blur-sm scale-105" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
         </div>
         
         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
                onClick={onBack} 
                className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/20"
            >
                <ArrowLeft size={16} /> Voltar para o Dashboard
            </button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">{displayName}</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin size={18} className="text-brand-400"/> {lead.cidade || 'Localização Desconhecida'}</span>
                        <span className="hidden md:inline text-slate-600">•</span>
                        <span className="flex items-center gap-1.5"><Calendar size={18} className="text-brand-400"/> Lead Recente</span>
                    </div>
                </div>
                {/* Score Big Badge */}
                {scoreData ? (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center gap-4 animate-fade-in shadow-2xl">
                         <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path 
                                    className={`${scoreData.score > 70 ? "text-brand-400" : scoreData.score > 40 ? "text-amber-400" : "text-red-400"} transition-all duration-1000 ease-out`}
                                    strokeDasharray={`${scoreData.score}, 100`} 
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{scoreData.score}</span>
                         </div>
                         <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Potencial</p>
                            <p className="text-xl font-bold text-white">{scoreData.label}</p>
                         </div>
                    </div>
                ) : <Skeleton className="w-48 h-20 bg-white/10" />}
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* STICKY SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-24 space-y-6">
                    {/* Audio Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <Mic size={100} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Resumo em Áudio</h3>
                        <p className="text-indigo-100 text-sm mb-6 opacity-90">Briefing inteligente para ouvir no caminho.</p>
                        
                        {isPlaying && (
                            <div className="flex justify-center gap-1.5 mb-6 h-8 items-end">
                                <div className="w-1.5 bg-white/60 rounded-full animate-audio-bar bar-1"></div>
                                <div className="w-1.5 bg-white/60 rounded-full animate-audio-bar bar-2"></div>
                                <div className="w-1.5 bg-white/60 rounded-full animate-audio-bar bar-3"></div>
                                <div className="w-1.5 bg-white/60 rounded-full animate-audio-bar bar-4"></div>
                                <div className="w-1.5 bg-white/60 rounded-full animate-audio-bar bar-5"></div>
                            </div>
                        )}

                        <button 
                            onClick={handlePlayAudio}
                            disabled={loadingAction === 'audio'}
                            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl py-3.5 flex items-center justify-center gap-3 transition-all font-bold shadow-lg"
                        >
                            {loadingAction === 'audio' ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/>
                            ) : isPlaying ? (
                                <><span className="animate-pulse">Reproduzindo...</span></>
                            ) : audioBriefing ? (
                                <><Play size={20} fill="currentColor" /> Ouvir Novamente</>
                            ) : (
                                <><Sparkles size={20} /> Gerar Resumo</>
                            )}
                        </button>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Building2 size={18} className="text-slate-400"/> Detalhes do Negócio
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-full text-slate-500"><User size={18}/></div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Responsável</p>
                                    <p className="text-slate-800 font-medium">{lead.contato_responsavel || 'Não informado'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-full text-slate-500"><Phone size={18}/></div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Telefone</p>
                                    <p className="text-slate-800 font-medium">{lead.telefone || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pros/Cons Card */}
                    {scoreData ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Gauge size={18} className="text-brand-500"/> Análise IA
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Pontos Fortes</span>
                                    <ul className="mt-2 space-y-2">
                                        {scoreData.pros.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">Pontos de Atenção</span>
                                    <ul className="mt-2 space-y-2">
                                        {scoreData.cons.map((c, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" /> {c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : <Skeleton className="h-64 rounded-2xl" />}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-8">
                
                {/* GLASS TABS */}
                <div className="sticky top-24 z-20 mb-6 -mx-2">
                    <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-200/50 overflow-x-auto scrollbar-hide mx-2">
                        <div className="flex space-x-1 min-w-max">
                            {[
                                { id: 'details', label: 'Visão Geral', icon: Database },
                                { id: 'intel', label: 'Inteligência', icon: Globe },
                                { id: 'strategy', label: 'Estratégia', icon: LayoutDashboard },
                                { id: 'marketing', label: 'Marketing', icon: Megaphone },
                                { id: 'sales', label: 'Vendas', icon: MessageSquare },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                        activeTab === tab.id 
                                        ? 'bg-slate-900 text-white shadow-md transform scale-105' 
                                        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                    }`}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] overflow-hidden">
                    
                    {/* DETAILS */}
                    {activeTab === 'details' && (
                        <div className="p-8 animate-fade-in">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dados da Empresa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(lead).map(([key, value]) => (
                                    <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-slate-800 font-medium break-words">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INTEL */}
                    {activeTab === 'intel' && (
                        <div className="p-8 space-y-8 animate-fade-in">
                             {/* SEO */}
                             <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <SearchIcon size={20} className="text-blue-500"/> SEO & Palavras-chave
                                </h3>
                                {seoData ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {seoData.keywords.map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold shadow-sm border border-blue-200">{k}</span>
                                            ))}
                                        </div>
                                        <ul className="grid grid-cols-1 gap-2">
                                            {seoData.suggestions.map((s, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <Sparkles size={14} className="text-amber-500 shrink-0"/> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : <div className="space-y-3"><div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" /></div><Skeleton lines={3} /></div>}
                             </div>

                             {/* Branding */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <ImageIcon size={20} className="text-purple-500"/> Conceito de Logo (AI)
                                    </h3>
                                    {logoImage ? (
                                        <div className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                            <img src={logoImage} alt="AI Logo" className="w-full h-64 object-cover bg-white" />
                                            <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur p-3 text-xs text-center font-medium text-slate-500">
                                                Gerado via Gemini Imagen 3
                                            </div>
                                        </div>
                                    ) : <Skeleton className="h-64 rounded-2xl" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Globe size={20} className="text-green-500"/> Concorrentes Locais
                                    </h3>
                                    <div className="prose prose-sm prose-slate bg-white p-4 rounded-2xl border border-slate-100 h-64 overflow-y-auto custom-scrollbar">
                                        {competitorInfo ? <ReactMarkdown>{competitorInfo}</ReactMarkdown> : <Skeleton lines={6} />}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* STRATEGY */}
                    {activeTab === 'strategy' && (
                        <div className="p-8 animate-fade-in">
                            <div className="prose prose-lg prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-brand-600 max-w-none">
                                {solution ? <ReactMarkdown>{solution}</ReactMarkdown> : <div className="space-y-6"><Skeleton className="h-8 w-1/3" /><Skeleton lines={4} /><Skeleton className="h-8 w-1/2" /><Skeleton lines={4} /></div>}
                            </div>
                        </div>
                    )}

                    {/* MARKETING */}
                    {activeTab === 'marketing' && (
                        <div className="p-8 animate-fade-in">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Configurar Geração</h3>
                                <div className="flex gap-4">
                                    <select 
                                        value={marketingPlatform} 
                                        onChange={e => setMarketingPlatform(e.target.value)}
                                        className="flex-1 p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                    >
                                        <option>Instagram Feed</option>
                                        <option>WhatsApp</option>
                                        <option>Email Marketing</option>
                                        <option>LinkedIn</option>
                                    </select>
                                    <button 
                                        onClick={handleGenerateMarketing}
                                        disabled={loadingAction === 'marketing'}
                                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-200"
                                    >
                                        {loadingAction === 'marketing' ? <RefreshCw className="animate-spin"/> : <Wand2 size={20}/>}
                                        Gerar
                                    </button>
                                </div>
                            </div>
                            
                            {generatedContent ? (
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden ring-4 ring-slate-50">
                                    <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
                                        <span className="font-bold text-sm flex items-center gap-2"><Sparkles size={16} className="text-brand-400"/> Resultado IA</span>
                                        <button 
                                            onClick={handleCopy}
                                            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition flex items-center gap-2 font-medium"
                                        >
                                            {copied ? <><Check size={14}/> Copiado</> : 'Copiar Texto'}
                                        </button>
                                    </div>
                                    <div className="p-8 whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                                        {generatedContent}
                                    </div>
                                </div>
                            ) : loadingAction === 'marketing' ? <Skeleton lines={5} className="h-32" /> : null}
                        </div>
                    )}

                    {/* SALES */}
                    {activeTab === 'sales' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 h-[600px] animate-fade-in divide-y md:divide-y-0 md:divide-x divide-slate-100">
                             
                             {/* Left: Chat Simulator */}
                             <div className="flex flex-col h-full bg-slate-50">
                                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        Simulador (Roleplay)
                                    </h3>
                                    <p className="text-xs text-slate-500">Pratique negociação com a IA (Persona: Dono)</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                                                msg.role === 'user' 
                                                ? 'bg-brand-600 text-white rounded-br-none' 
                                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                    />
                                    <button onClick={handleChatSend} className="bg-slate-900 text-white p-2.5 rounded-full hover:bg-slate-700 transition shadow-lg">
                                        <Send size={18} />
                                    </button>
                                </div>
                             </div>

                             {/* Right: Tools (Email & Objections) */}
                             <div className="h-full overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                                 
                                 {/* Cold Email */}
                                 <div className="border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Mail size={18} className="text-indigo-500"/> Rascunho de Email
                                    </h3>
                                    {coldEmail ? (
                                        <div className="bg-slate-50 rounded-xl p-4 text-sm border border-slate-100">
                                            <p className="font-bold text-slate-900 mb-2 pb-2 border-b border-slate-200">Assunto: {coldEmail.subject}</p>
                                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{coldEmail.body}</p>
                                        </div>
                                    ) : <Skeleton lines={4} />}
                                 </div>

                                 {/* Objections */}
                                 <div className="border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                     <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <ShieldQuestion size={18} className="text-orange-500"/> Objeções Comuns
                                     </h3>
                                     <div className="space-y-3">
                                         {objections ? objections.map((obj, i) => (
                                             <details key={i} className="group bg-slate-50 rounded-xl border border-slate-100 open:bg-orange-50 open:border-orange-100 transition-colors">
                                                 <summary className="p-3 font-semibold text-sm text-slate-700 cursor-pointer list-none flex justify-between items-center">
                                                     "{obj.question}"
                                                     <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                                 </summary>
                                                 <div className="px-3 pb-3 text-sm text-slate-600 leading-relaxed">
                                                     {obj.answer}
                                                 </div>
                                             </details>
                                         )) : <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
                                     </div>
                                 </div>

                             </div>
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};