// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cccmfqopbmmcfhvebdji.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY21mcW9wYm1tY2ZodmViZGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTkzNTcsImV4cCI6MjA2MDEzNTM1N30.KR4ekEkfg74JRppTeUS6_Wjq3KQvmVeNqWVi4aeaVOE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);