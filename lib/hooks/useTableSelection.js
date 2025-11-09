import { useState, useEffect } from 'react';

export const useTableSelection = (items) => {
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(items.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const clearSelection = () => {
    setSelectedRows([]);
  };

  return {
    selectedRows,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    setSelectedRows,
  };
};