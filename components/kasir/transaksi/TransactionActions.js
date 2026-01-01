// components/kasir/transaksi/TransactionActions.js
"use client";

import { Pause, List } from "lucide-react";
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
          className={`p-2 rounded-lg text-white transition-colors ${
            isCartEmpty || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : darkMode
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          <Pause size={20} />
        </button>
      </Tooltip>
      <Tooltip content="Daftar Ditangguhkan" darkMode={darkMode}>
        <button
          onClick={onShowList}
          disabled={isLoading}
          className={`p-2 rounded-lg text-white transition-colors ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : darkMode
              ? "bg-sky-600 hover:bg-sky-700"
              : "bg-sky-500 hover:bg-sky-600"
          }`}
        >
          <List size={20} />
        </button>
      </Tooltip>
    </div>
  );
};

export default TransactionActions;
