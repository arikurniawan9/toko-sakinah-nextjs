import React from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';

const CategoryToolbar = ({
  searchTerm,
  setSearchTerm,
  onAddNew,
  onDeleteMultiple,
  selectedRowsCount,
  isAdmin,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-grow md:max-w-xs">
        <label htmlFor="search" className="sr-only">Cari</label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari kategori..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-2">
          {selectedRowsCount > 0 && (
            <button
              onClick={onDeleteMultiple}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus ({selectedRowsCount})</span>
            </button>
          )}
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryToolbar;
