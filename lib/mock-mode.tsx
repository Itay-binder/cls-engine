'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'cls_mock_mode';

interface MockModeContextValue {
  isMockMode: boolean;
  setMockMode: (value: boolean) => void;
  canToggle: boolean;
}

const MockModeContext = createContext<MockModeContextValue>({
  isMockMode: false,
  setMockMode: () => undefined,
  canToggle: false,
});

export function MockModeProvider({ children }: { children: React.ReactNode }) {
  const [isMockMode, setIsMockMode] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  // On mount: read localStorage + check if user is admin
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setIsMockMode(true);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.app_metadata?.role;
      if (role === 'admin') setCanToggle(true);
    });
  }, []);

  const setMockMode = useCallback((value: boolean) => {
    // Only admins can toggle
    if (!canToggle) return;
    setIsMockMode(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, [canToggle]);

  return (
    <MockModeContext.Provider value={{ isMockMode, setMockMode, canToggle }}>
      {children}
    </MockModeContext.Provider>
  );
}

export function useMockMode(): MockModeContextValue {
  return useContext(MockModeContext);
}
