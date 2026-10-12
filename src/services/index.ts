import { isDemoMode } from './supabaseClient';
import { IApiService } from './api';
import { DemoService } from './demoService';
import { SupabaseService } from './supabaseService';

export * from './api';
export * from './supabaseClient';

export const api: IApiService = isDemoMode
  ? new DemoService()
  : new SupabaseService();
