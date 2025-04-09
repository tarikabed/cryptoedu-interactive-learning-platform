import {createClient} from '@supabase/supabase-js';

const supabaseUrl = 'https://guchgnasrkrqssophjmc.supabase.co';
const supabaseAPIKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Y2hnbmFzcmtycXNzb3Boam1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NTQ0MjIsImV4cCI6MjA1OTUzMDQyMn0.dqHFEIyys-1wVgiG16jNUyweESyR--PFNo_t0rftpaY';

export const supabase = createClient(supabaseUrl, supabaseAPIKey);
