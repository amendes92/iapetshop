import React from 'react';
import { MapPin, Phone, ArrowRight, Star } from 'lucide-react';
import { PetShopLead } from '../types';
import { PLACEHOLDER_IMAGES } from '../constants';

interface LeadCardProps {
  lead: PetShopLead;
  index: number;
  onClick: (lead: PetShopLead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, index, onClick }) => {
  const imageUrl = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  
  const name = lead.business_name || lead.nome || lead.name || 'Pet Shop Sem Nome';
  const address = lead.endereco || lead.address || 'Endereço não disponível';
  const city = lead.cidade || lead.city;
  const phone = lead.telefone || lead.phone;

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 border border-slate-100 hover:border-brand-200 overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full hover:-translate-y-2"
      onClick={() => onClick(lead)}
    >
      {/* Image Header */}
      <div className="h-44 overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        
        {/* Floating City Badge */}
        {city && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 z-10">
            <MapPin size={12} className="text-brand-600" />
            <span className="text-xs font-bold text-slate-700">{city}</span>
          </div>
        )}
        
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md line-clamp-1">{name}</h3>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 text-slate-600">
             <div className="mt-1 min-w-[16px]"><MapPin size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" /></div>
             <p className="text-sm font-medium leading-snug line-clamp-2 text-slate-500">{address}</p>
          </div>
          
          {phone && (
            <div className="flex items-center gap-3 text-slate-600">
               <div className="min-w-[16px]"><Phone size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" /></div>
               <p className="text-sm font-medium text-slate-500">{phone}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
            <Star size={12} fill="currentColor" />
            <span>Novo Lead</span>
          </div>
          
          <button className="text-brand-600 text-sm font-bold flex items-center gap-1.5 group-hover:gap-2 transition-all">
            Analisar <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};