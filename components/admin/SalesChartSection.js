import React from 'react';
import dynamic from 'next/dynamic';

const DynamicSalesChart = dynamic(() => import('../SalesChart'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>, // Optional loading component
});

const SalesChartSection = ({ darkMode, dashboardSalesChartData, dateRange }) => {
  const filterSalesData = (data, range) => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let startDate;

    switch (range) {
      case '7_days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30_days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'all_time':
      default:
        return data; // No filtering needed for all time
    }

    return data.filter(item => new Date(item.date) >= startDate);
  };

  const filteredData = filterSalesData(dashboardSalesChartData, dateRange);

  return (
    <div className="mb-8">
      <div className={`rounded-xl shadow ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border`}>
        <div className="p-6">
          <DynamicSalesChart darkMode={darkMode} salesData={filteredData} />
        </div>
      </div>
    </div>
  );
};

export default SalesChartSection;
