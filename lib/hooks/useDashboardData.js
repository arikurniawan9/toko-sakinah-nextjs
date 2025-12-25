import useSWR from 'swr';
import { format } from 'date-fns';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return response.json();
};

const useDashboardData = (startDate, endDate) => {
  // Format dates to ensure consistency and avoid timezone issues in the URL
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : null;
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : null;

  // Conditionally construct the URL. SWR will not fetch if the key is null.
  const apiUrl =
    formattedStartDate && formattedEndDate
      ? `/api/dashboard?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      : null;

  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false, // Optional: prevent re-fetching on window focus
  });

  return {
    // New range-based stats
    totalSales: data?.totalSalesInRange || 0,
    totalProfit: data?.totalProfitInRange || 0,
    totalTransactions: data?.totalTransactionsInRange || 0,
    
    // Static stats
    totalProductsCount: data?.totalProducts || 0,
    totalMembersCount: data?.totalMembers || 0,
    activeEmployeesCount: data?.activeEmployees || 0,
    
    // Chart and table data
    recentActivitiesData: data?.recentTransactions || [],
    bestSellingProducts: data?.bestSellingProducts || [],
    salesData: data?.salesData || [],

    loading: isLoading,
    error: error,
  };
};

export default useDashboardData;
