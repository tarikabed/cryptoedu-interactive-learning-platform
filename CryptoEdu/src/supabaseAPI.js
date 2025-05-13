import {createClient} from '@supabase/supabase-js';

const supabaseUrl = 'https://cyfscivmvxomddheaxnl.supabase.co';
const supabaseAPIKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZnNjaXZtdnhvbWRkaGVheG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTc0NTYsImV4cCI6MjA2MjM3MzQ1Nn0.01EQbF4O_CX9jMz3k4-ScZpHXinDNI_nTXDaOvEnxyA';

export const supabase = createClient(supabaseUrl, supabaseAPIKey);
