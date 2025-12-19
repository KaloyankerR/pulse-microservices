'use client';

import { useEffect, useState } from 'react';

/**
 * Client component that fetches runtime config from API route
 * This ensures we always get the correct config values at runtime
 * This component runs AFTER the page loads, so it can override any script tag injection
 */
export function ConfigInjector() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    // Fetch config from API route (runs at request time, always has correct env vars)
    fetch('/api/config')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(config => {
        // Always override with API route config (most reliable source)
        (window as any).__APP_CONFIG__ = config;
        setConfigLoaded(true);
        console.log('[ConfigInjector] Config loaded from API and injected:', config);
        
        // Clear any cached config in getConfig() to force re-read
        // The config module will now use window.__APP_CONFIG__ on next access
      })
      .catch(err => {
        console.error('[ConfigInjector] Failed to load config from API:', err);
        // Check if config was injected by script tag
        const existingConfig = (window as any).__APP_CONFIG__;
        if (existingConfig) {
          console.log('[ConfigInjector] Using existing config from script tag:', existingConfig);
          setConfigLoaded(true);
        } else {
          console.error('[ConfigInjector] No config available from any source!');
        }
      });
  }, []);

  return null; // This component doesn't render anything
}



