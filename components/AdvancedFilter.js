// components/AdvancedFilter.js
import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdvancedFilter({
  columns = [],
  filterValues = {},
  onFilterChange,
  darkMode = false,
  onApplyFilters,
  onClearFilters
}) {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({});

  useEffect(() => {
    setLocalFilters(filterValues);
  }, [filterValues]);

  const handleFilterChange = (columnKey, value) => {
    const newFilters = { ...localFilters, [columnKey]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearLocalFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    if (onClearFilters) onClearFilters();
  };

  const getFilterComponent = (column) => {
    if (!column.filterable) return null;

    const currentValue = localFilters[column.key] || '';

    switch (column.filterType || 'text') {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            className={`w-full px-3 py-2 rounded-md border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Semua</option>
            {column.filterOptions?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={currentValue}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            className={`w-full px-3 py-2 rounded-md border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            placeholder={`Filter ${column.title}...`}
            className={`w-full px-3 py-2 rounded-md border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
            placeholder={`Filter ${column.title}...`}
            className={`w-full px-3 py-2 rounded-md border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );
    }
  };

  const filterableColumns = columns.filter(col => col.filterable);

  if (filterableColumns.length === 0) return null;

  return (
    <div className={`border rounded-lg overflow-hidden ${
      darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
    }`}>
      <div 
        className={`p-3 flex items-center justify-between cursor-pointer ${
          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {filterableColumns.map((column) => (
            <div key={column.key}>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {column.title}
              </label>
              {getFilterComponent(column)}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onApplyFilters ? onApplyFilters(localFilters) : null}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Terapkan
            </button>
            <button
              onClick={clearLocalFilters}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}