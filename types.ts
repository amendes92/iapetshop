export interface PetShopLead {
  id: number;
  created_at?: string;
  business_name?: string; 
  nome: string; 
  endereco?: string;
  cidade?: string;
  telefone?: string;
  email?: string;
  porte?: string; 
  servicos?: string[]; 
  status?: string; 
  contato_responsavel?: string;
  [key: string]: any; 
}

export interface LeadScore {
  score: number;
  label: string;
  pros: string[];
  cons: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SeoAudit {
  keywords: string[];
  suggestions: string[];
}

export interface ColdEmail {
  subject: string;
  body: string;
}

export interface Objection {
  question: string;
  answer: string;
}

export interface RoadmapStep {
  phase: string;
  action: string;
}

export interface GeneratedSolutionState {
  loading: boolean;
  data: string | null;
  error: string | null;
}