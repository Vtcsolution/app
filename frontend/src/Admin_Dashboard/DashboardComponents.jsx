"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, User, Users, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/context/AdminAuthContext";

// Color scheme matching psychic dashboard
const colors = {
  primary: "#2B1B3F",      // Deep purple
  secondary: "#C9A24D",    // Antique gold
  accent: "#9B7EDE",       // Light purple
  bgLight: "#3A2B4F",      // Lighter purple
  textLight: "#E8D9B0",    // Light gold text
  success: "#10B981",      // Green
  warning: "#F59E0B",      // Yellow
  danger: "#EF4444",       // Red
  background: "#F5F3EB",   // Soft ivory
  chartLine: "#0ea5e9",    // Sky blue for charts
};

const DashboardComponents = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    loading: true,
    error: null,
  });
  const { theme } = useTheme();
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!admin) return;

      try {
        // Fetch stats for revenue, coaches, and users
        const statsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/stats`, {
          credentials: "include",
        });
        const statsJson = await statsRes.json();

        if (!statsJson.success || !statsJson.data) {
          console.warn("Stats API did not return data", statsJson);
          return;
        }

        const revenueData = Array.isArray(statsJson.data.monthlyRevenue)
          ? statsJson.data.monthlyRevenue.map((item) => ({
              month: `${item._id.month}/${item._id.year}`,
              revenue: item.revenue,
            }))
          : [];

        setStats({ totals: statsJson.data, revenueData });

        // Fetch visitor stats
        const visitorRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/analytics/visitor-stats`, {
          credentials: "include",
        });
        if (!visitorRes.ok) throw new Error("Failed to fetch visitor stats");
        const visitorJson = await visitorRes.json();
        console.log('Visitor Stats Data:', visitorJson); // Debug
        const totalVisitors = visitorJson.deviceStats.reduce((sum, stat) => sum + stat.count, 0);
        setVisitorStats({ totalVisitors, loading: false, error: null });
      } catch (err) {
        console.error("Error fetching data:", err);
        setVisitorStats({ totalVisitors: 0, loading: false, error: "Failed to load visitor stats" });
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [admin]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 rounded-lg shadow-lg border"
          style={{
            backgroundColor: colors.primary + '10',
            borderColor: colors.secondary + '30',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: colors.primary }}>
            {label}
          </p>
          <p className="text-sm mt-1 font-medium" style={{ color: colors.success }}>
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleCardClick = (url) => {
    navigate(url);
  };

  const handleRevenueClick = () => {
    const query = timeRange ? `?range=${timeRange}` : "";
    navigate(`/admin/dashboard/transactions${query}`);
  };

  const handleVisitorsClick = () => {
    navigate(`/admin/dashboard/visitors`);
  };

  if (!admin) return <p className="p-4" style={{ color: colors.primary + '70' }}>Please login as admin to view dashboard.</p>;
  if (!stats || visitorStats.loading) return <p className="p-4" style={{ color: colors.primary + '70' }}>Loading...</p>;

  const { totals, revenueData } = stats;

  // Card configuration with updated styling
  const statCards = [
    {
      title: "Total Revenue",
      icon: <BookOpen className="h-5 w-5" style={{ color: colors.secondary }} />,
      value: `$${totals.totalAmount.toLocaleString()}`,
      delay: 0.7,
      url: `/admin/dashboard/transactions`,
      onClick: handleRevenueClick,
      bgColor: colors.success,
    },
    {
      title: "Total Coaches",
      icon: <Users className="h-5 w-5" style={{ color: colors.accent }} />,
      value: totals.totalPsychics,
      delay: 0.8,
      url: `/admin/dashboard/humancoach`,
      onClick: () => handleCardClick('/admin/dashboard/humancoach'),
      bgColor: colors.accent,
    },
    {
      title: "Total Users",
      icon: <User className="h-5 w-5" style={{ color: colors.primary }} />,
      value: totals.totalUsers,
      delay: 0.9,
      url: `/admin/dashboard/allusers`,
      onClick: () => handleCardClick('/admin/dashboard/allusers'),
      bgColor: colors.primary,
    },
    {
      title: "Total Visitors",
      icon: <Eye className="h-5 w-5" style={{ color: colors.warning }} />,
      value: visitorStats.error ? "N/A" : visitorStats.totalVisitors.toLocaleString(),
      delay: 1.0,
      url: `/admin/dashboard/visitors`,
      onClick: handleVisitorsClick,
      bgColor: colors.warning,
      error: visitorStats.error,
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col" style={{ backgroundColor: colors.background }}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className={`transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px] hover:cursor-pointer ${
                isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"
              }`}
              style={{ 
                animationDelay: `${stat.delay}s`,
                background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                borderColor: colors.primary + '10',
                borderWidth: '2px',
              }}
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer">
                <CardTitle className="text-sm font-bold" style={{ color: colors.primary + '80' }}>
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-full" style={{ 
                  backgroundColor: stat.bgColor + '10',
                }}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent className="cursor-pointer">
                <div 
                  className="text-2xl font-bold animate-count-up"
                  style={{ color: stat.error ? colors.danger : colors.primary }}
                >
                  {stat.value}
                </div>
                <p className="text-xs mt-2" style={{ color: colors.primary + '70' }}>
                  Click to view details →
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart Section */}
        <div
          className="w-full mt-4 rounded-xl p-4 md:p-6 hover:cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={handleRevenueClick}
          style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            borderColor: colors.primary + '20',
            borderWidth: '2px',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.primary }}>
                Revenue Over Time
              </h3>
              <p className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                Monthly revenue breakdown
              </p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full" style={{ 
              backgroundColor: colors.secondary + '10',
              color: colors.secondary,
            }}>
              Click to view all transactions
            </span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart 
              data={revenueData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="month"
                stroke={colors.primary + '70'}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: colors.primary + '70' }}
              />
              <YAxis
                stroke={colors.primary + '70'}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                tick={{ fill: colors.primary + '70' }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  stroke: colors.primary + '20',
                  strokeWidth: 1,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={colors.secondary}
                strokeWidth={3}
                dot={{
                  fill: colors.secondary,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: colors.secondary,
                  stroke: colors.primary,
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Chart Legend */}
          <div className="flex items-center justify-end mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5" style={{ backgroundColor: colors.secondary }}></div>
              <span className="text-xs" style={{ color: colors.primary + '70' }}>Monthly Revenue</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg" style={{ 
            backgroundColor: colors.success + '10',
            borderColor: colors.success + '20',
            borderWidth: '1px',
          }}>
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3" style={{ 
                backgroundColor: colors.success + '20',
              }}>
                <BookOpen className="h-4 w-4" style={{ color: colors.success }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.primary + '70' }}>Avg. Transaction</p>
                <p className="text-lg font-bold" style={{ color: colors.success }}>
                  ${totals.totalAmount > 0 && totals.totalTransactions > 0 
                    ? (totals.totalAmount / totals.totalTransactions).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ 
            backgroundColor: colors.accent + '10',
            borderColor: colors.accent + '20',
            borderWidth: '1px',
          }}>
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3" style={{ 
                backgroundColor: colors.accent + '20',
              }}>
                <Users className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.primary + '70' }}>Active Coaches</p>
                <p className="text-lg font-bold" style={{ color: colors.accent }}>
                  {totals.activePsychics || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ 
            backgroundColor: colors.warning + '10',
            borderColor: colors.warning + '20',
            borderWidth: '1px',
          }}>
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3" style={{ 
                backgroundColor: colors.warning + '20',
              }}>
                <User className="h-4 w-4" style={{ color: colors.warning }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.primary + '70' }}>Active Users</p>
                <p className="text-lg font-bold" style={{ color: colors.warning }}>
                  {totals.activeUsers || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardComponents;