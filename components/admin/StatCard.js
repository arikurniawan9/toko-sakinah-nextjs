import React from 'react';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, bgColorClass, textColorClass, darkMode, href, loading = false }) => {
  // Validasi nilai sebelum ditampilkan
  const displayValue = value !== undefined && value !== null ? value : 0;

  // Tentukan kelas default jika tidak disediakan
  const defaultBgColor = darkMode ? 'bg-indigo-600' : 'bg-indigo-500';
  const defaultTextColor = 'text-white';
  const actualBgColor = bgColorClass || defaultBgColor;
  const actualTextColor = textColorClass || defaultTextColor;

  const content = (
    <div className={`p-6 rounded-xl shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border ${href ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${actualBgColor} ${actualTextColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className={`text-sm font-medium ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</h3>
          {loading ? (
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse mt-1"></div>
          ) : (
            <p className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            } mt-1`}>
              {typeof displayValue === 'number' && isNaN(displayValue) ? 0 : displayValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

export default StatCard;
