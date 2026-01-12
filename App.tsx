import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LeadCard } from './components/LeadCard';
import { LeadDetailsPage } from './components/LeadDetailsPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { fetchPetShops } from './services/supabaseService';
import { PetShopLead } from './types';
import { Search, Inbox, AlertTriangle, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [leads, setLeads] = useState<PetShopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Routing State
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'details'>('dashboard');
  const [activeLeadId, setActiveLeadId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPetShops();
      setLeads(data);
    } catch (err) {
      console.error("Error loading leads", err);
      setError("Não foi possível carregar os dados. Verifique a conexão com a API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#lead/')) {
        const id = parseInt(hash.replace('#lead/', ''), 10);
        if (!isNaN(id)) {
          setActiveLeadId(id);
          setCurrentRoute('details');
        }
      } else {
        setCurrentRoute('dashboard');
        setActiveLeadId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const name = (lead.business_name || lead.nome || lead.name || '').toLowerCase();
    const city = (lead.cidade || lead.city || '').toLowerCase();
    return name.includes(term) || city.includes(term);
  });

  const navigateToLead = (lead: PetShopLead) => {
    window.location.hash = `#lead/${lead.id}`;
  };

  const navigateHome = () => {
    window.location.hash = '';
  };

  // --- VIEW: DETAILS ---
  if (currentRoute === 'details') {
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
    const activeLead = leads.find(l => l.id === activeLeadId);
    if (activeLead) return <LeadDetailsPage lead={activeLead} onBack={navigateHome} />;
    
    if (!loading && leads.length > 0) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Empresa não encontrada</h2>
          <button onClick={navigateHome} className="text-brand-600 hover:underline font-medium">Voltar para o Dashboard</button>
        </div>
      );
    }
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header onRefresh={loadData} loading={loading} />

      {/* Hero Section */}
      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-slide-up">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2 border border-brand-100 shadow-sm">
              <Sparkles size={12} className="text-brand-500" /> Inteligência Artificial V3
           </div>
           <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
             Seus Leads, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-400">Potencializados.</span>
           </h2>
           <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
             Acesse estratégias de marketing, inteligência de mercado e roteiros de vendas gerados por IA para cada Pet Shop.
           </p>

           {/* Central Search with Glow */}
           <div className="mt-10 relative max-w-lg mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 text-base shadow-xl shadow-slate-200/40 transition-all duration-300"
              placeholder="Buscar por empresa ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Resultados <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-slate-200">{filteredLeads.length}</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner />
            <p className="text-center text-slate-400 mt-4 animate-pulse font-medium">Sincronizando banco de dados...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-red-100 shadow-sm mx-auto max-w-2xl text-center p-6">
             <div className="bg-red-50 p-4 rounded-full mb-4 inline-block">
               <AlertTriangle size={32} className="text-red-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Falha na Conexão</h3>
             <p className="text-slate-500 max-w-md mb-6 mx-auto">{error}</p>
             <button onClick={loadData} className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition font-bold shadow-lg shadow-brand-200">
               Tentar Novamente
             </button>
           </div>
        ) : filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in pb-12">
            {filteredLeads.map((lead, index) => (
              <LeadCard key={lead.id || index} lead={lead} index={index} onClick={navigateToLead} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 mx-auto max-w-2xl">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
               <Inbox size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Não encontramos nenhuma empresa com o termo "{searchTerm}". Tente buscar por cidade.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;