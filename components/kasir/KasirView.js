// components/kasir/KasirView.js
'use client';

import KasirTable from './KasirTable';
import KasirCard from './KasirCard';

export default function KasirView({
  cashiers,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
  view,
}) {
  return (
    <>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cashiers.map(cashier => (
            <KasirCard
              key={cashier.id}
              cashier={cashier}
              onEdit={handleEdit}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          ))}
        </div>
      ) : (
        <KasirTable
          cashiers={cashiers}
          loading={loading}
          darkMode={darkMode}
          selectedRows={selectedRows}
          handleSelectAll={handleSelectAll}
          handleSelectRow={handleSelectRow}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}