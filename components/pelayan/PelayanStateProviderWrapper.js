// components/pelayan/PelayanStateProviderWrapper.js
'use client';

import { useState, useEffect } from 'react';
import PelayanStateProvider from './PelayanStateProvider';

export default function PelayanStateProviderWrapper({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Menampilkan loading state sementara di server
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return <PelayanStateProvider>{children}</PelayanStateProvider>;
}