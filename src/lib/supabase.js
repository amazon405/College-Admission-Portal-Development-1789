import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hutelyzhvuppjgggeugb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dGVseXpodnVwcGpnZ2dldWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjY2MTksImV4cCI6MjA2NzQ0MjYxOX0.dnEtb-s9o6CUITm-yVEqTQQStXjNIGuEDGWYn-zMY5w';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});