import { supabase } from './supabase';
import { handleSupabaseError } from './supabase';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function getApiKeyFromRequest(request: NextRequest) {
  try {
    // Check for API key in x-api-key header
    let apiKey = request.headers.get('x-api-key');
    
    // If not found, check for Bearer token in Authorization header
    if (!apiKey) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!apiKey) {
      return null;
    }

    // Query the database for the API key
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .single();

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getApiKeyFromRequest:', error);
    return null;
  }
}

export async function getApiKeyFromCookie() {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get('apiKey')?.value;

    if (!apiKey) {
      return null;
    }

    // Query the database for the API key
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .single();

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getApiKeyFromCookie:', error);
    return null;
  }
} 