import { useState, useEffect } from 'react';
import { geocodingService } from '@/services/geocoding.service';

export function useGeocoding(
  query: string,
  selectedAddress?: string,
  debounceMs: number = 450
) {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = async (customQuery?: string) => {
    const q = (customQuery ?? query).trim();
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await geocodingService.search(q);
      if (Array.isArray(data) && data.length > 0) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (
      !query ||
      query.length < 3 ||
      query.startsWith('Locating') ||
      (selectedAddress && query === selectedAddress)
    ) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, selectedAddress, debounceMs]);

  return {
    results,
    setResults,
    isSearching,
    search
  };
}
