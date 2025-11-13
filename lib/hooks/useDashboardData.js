import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

const useDashboardData = () => {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher);

  return {
    totalProductsCount: data?.totalProducts || 0,
    totalMembersCount: data?.totalMembers || 0,
    transactionsTodayCount: data?.transactionsToday || 0,
    activeEmployeesCount: data?.activeEmployees || 0,
    dashboardSalesChartData: data?.dailySalesChartData || [],
    recentActivitiesData: data?.recentTransactions || [],
    loading: isLoading,
    error: error,
  };
};

export default useDashboardData;
