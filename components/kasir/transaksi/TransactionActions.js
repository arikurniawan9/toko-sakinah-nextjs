// components/kasir/transaksi/TransactionActions.js
"use client";

import { Archive, ListTodo } from "lucide-react";
import Tooltip from "../../Tooltip";

const TransactionActions = ({
  onSuspend,
  onShowList,
  isCartEmpty,
  isLoading,
  darkMode,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Tooltip content="Tangguhkan Transaksi (SHIFT+S)" darkMode={darkMode}>
        <button
          onClick={onSuspend}
          disabled={isCartEmpty || isLoading}
          className={`p-2 rounded-full transition-colors ${
            darkMode
              ? "text-gray-300 hover:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-transparent"
              : "text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
          } disabled:cursor-not-allowed`}
        >
          <Archive size={22} />
        </button>
      </Tooltip>
      <Tooltip content="Daftar Ditangguhkan" darkMode={darkMode}>
        <button
          onClick={onShowList}
          disabled={isLoading}
          className={`p-2 rounded-full transition-colors ${
            darkMode
              ? "text-gray-300 hover:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-transparent"
              : "text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
          } disabled:cursor-not-allowed`}
        >
          <ListTodo size={22} />
        </button>
      </Tooltip>
    </div>
  );
};

export default TransactionActions;
