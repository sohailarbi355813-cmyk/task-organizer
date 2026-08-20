import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rbgrblmooasddsxmlupb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZ3JibG1vb2FzZGRzeG1sdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjM1MDMsImV4cCI6MjEwMjYzOTUwM30.v4JpBZhKoP_y5ESu1zewarPI0qj7O_C2Gx3bgRpZeWk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
