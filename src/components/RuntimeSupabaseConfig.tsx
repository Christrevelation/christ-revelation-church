'use client';

import { useEffect } from 'react';
import { ensureBrowserSupabaseConfig } from '@/lib/supabase/client';

export default function RuntimeSupabaseConfig() {
  useEffect(() => {
    void ensureBrowserSupabaseConfig();
  }, []);

  return null;
}
