import React from 'react';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, bgColorClass, textColorClass, darkMode, href }) => {
  const content = (
    <div className={`p-6 rounded-xl shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border ${href ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColorClass} ${textColorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className={`text-sm font-medium ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</h3>
          <p className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

export default StatCard;
