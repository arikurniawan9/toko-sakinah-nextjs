// components/AutoCompleteSearch.js
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function AutoCompleteSearch({
  placeholder = 'Cari...',
  searchFunction,
  onSelect,
  darkMode = false,
  debounceTime = 300,
  minChars = 2
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.length < minChars && query.length > 0) {
      setResults([]);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchFunction(query);
        setResults(searchResults || []);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error during search:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchFunction, debounceTime, minChars]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    } else if (e.key === 'Enter' && query.trim() !== '' && results.length === 0) {
      // Jika tidak ada hasil dan menekan enter, mungkin ingin mencari secara langsung
      onSelect({ query, isDirectSearch: true });
    }
  };

  const handleSelect = (item) => {
    setQuery(item.label || item.name || item.toString());
    setSelectedItem(item);
    setShowResults(false);
    onSelect(item);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() === '') {
      setResults([]);
      setShowResults(false);
    } else {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay untuk memungkinkan klik pada hasil
    setTimeout(() => {
      setShowResults(false);
    }, 150);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedItem(null);
  };

  return (
    <div className="relative w-full">
      <div className={`relative rounded-md border ${
        darkMode 
          ? 'bg-gray-700 border-gray-600 text-white' 
          : 'bg-white border-gray-300 text-gray-900'
      }`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-10 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-purple-500 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'
        } max-h-60 overflow-auto`}>
          <ul className="py-1">
            {results.map((item, index) => (
              <li
                key={item.id || index}
                onClick={() => handleSelect(item)}
                className={`px-4 py-2 cursor-pointer text-sm ${
                  index === selectedIndex
                    ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                    : (darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')
                }`}
              >
                {item.label || item.name || item.toString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && results.length === 0 && query.length >= minChars && loading && (
        <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'
        } max-h-60 overflow-auto`}>
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari...</div>
        </div>
      )}

      {showResults && results.length === 0 && query.length >= minChars && !loading && (
        <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'
        } max-h-60 overflow-auto`}>
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ditemukan hasil</div>
        </div>
      )}
    </div>
  );
}