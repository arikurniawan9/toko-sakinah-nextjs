// lib/hooks/useProductSearch.js
import { useState, useEffect, useRef } from 'react';

export const useProductSearch = (searchTerm, fetchProducts) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Set a new timeout for the search
    timeoutRef.current = setTimeout(async () => {
      try {
        // Pass the specific search term to the fetchProducts function
        await fetchProducts(searchTerm);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms delay for debouncing

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, fetchProducts]);

  return { searchResults, isLoading, error };
};