import { SUPABASE_CONFIG } from '../constants';
import { PetShopLead } from '../types';

export const fetchPetShops = async (): Promise<PetShopLead[]> => {
  try {
    const response = await fetch(SUPABASE_CONFIG.URL, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_CONFIG.KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch pet shops:", error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn("Possible Mixed Content issue (HTTP vs HTTPS) or CORS restriction.");
    }
    throw error;
  }
};