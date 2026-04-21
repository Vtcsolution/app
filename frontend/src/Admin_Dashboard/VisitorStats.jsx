import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function VisitorStats({ side, setSide, admin }) {
  // Color scheme
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
    mediumPurple: "#3D2B56",
    successGreen: "#10B981",
    warningOrange: "#F59E0B",
    errorRed: "#EF4444",
  };
  const [stats, setStats] = useState({
    dailyVisitorStats: [],
    deviceStats: [],
    browserStats: [],
    osStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch visitor stats
  useEffect(() => {
    const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/analytics/visitor-stats`;
    setLoading(true);
    axios
      .get(apiUrl, { withCredentials: true })
      .then((res) => {
        console.log('Visitor Stats Data:', res.data); // Debug API response
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setError('Failed to load visitor statistics');
        setLoading(false);
      });
  }, []);

  // Chart data for daily visitors
  const dailyVisitorChartData = {
    labels: stats.dailyVisitorStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Unique Visitors',
        data: stats.dailyVisitorStats.map((stat) => stat.uniqueVisitors),
        backgroundColor: colors.successGreen, // Distinct color for daily visitors
        borderColor: colors.successGreen,
        borderWidth: 1,
      },
    ],
  };

  // Chart data for devices, browsers, and OS
  const deviceChartData = {
    labels: stats.deviceStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Devices',
        data: stats.deviceStats.map((stat) => stat.count),
        backgroundColor: colors.mediumPurple,
        borderColor: colors.mediumPurple,
        borderWidth: 1,
      },
    ],
  };

  const browserChartData = {
    labels: stats.browserStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Browsers',
        data: stats.browserStats.map((stat) => stat.count),
        backgroundColor: colors.mediumPurple,
        borderColor: colors.mediumPurple,
        borderWidth: 1,
      },
    ],
  };

  const osChartData = {
    labels: stats.osStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Operating Systems',
        data: stats.osStats.map((stat) => stat.count),
        backgroundColor: colors.mediumPurple,
        borderColor: colors.mediumPurple,
        borderWidth: 1,
      },
    ],
  };

  // Chart options for consistent styling
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Visitor Count' } },
      x: { title: { display: true, text: 'Category' } },
    },
  };

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen">
          <div className="max-w-7xl mx-auto rounded-lg shadow-lg p-6" style={{ backgroundColor: colors.softIvory, borderColor: colors.lightGold }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: colors.deepPurple }}>Visitor Statistics</h2>

            {loading ? (
              <div className="text-center py-10" style={{ color: colors.mediumPurple }}>
                <p>Loading visitor stats...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10" style={{ color: colors.errorRed }}>
                <p>{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Visitors Chart */}
                <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: colors.lightGold + "20" }}>
                  <h3 className="text-lg font-medium mb-4" style={{ color: colors.deepPurple }}>Daily Unique Visitors</h3>
                  <Bar
                    data={dailyVisitorChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Daily Unique Visitors' } },
                      scales: {
                        ...chartOptions.scales,
                        x: { title: { display: true, text: 'Date' } },
                      },
                    }}
                    height={200}
                  />
                </div>

                {/* Device Chart */}
                <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: colors.lightGold + "20" }}>
                  <h3 className="text-lg font-medium mb-4" style={{ color: colors.deepPurple }}>Devices</h3>
                  <Bar
                    data={deviceChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Devices' } },
                    }}
                    height={200}
                  />
                </div>

                {/* Browser Chart */}
                <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: colors.lightGold + "20" }}>
                  <h3 className="text-lg font-medium mb-4" style={{ color: colors.deepPurple }}>Browsers</h3>
                  <Bar
                    data={browserChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Browsers' } },
                    }}
                    height={200}
                  />
                </div>

                {/* OS Chart */}
                <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: colors.lightGold + "20" }}>
                  <h3 className="text-lg font-medium mb-4" style={{ color: colors.deepPurple }}>Operating Systems</h3>
                  <Bar
                    data={osChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Operating Systems' } },
                    }}
                    height={200}
                  />
                </div>
              </div>
            )}

            {/* Fallback List View */}
            {!loading && !error && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.deepPurple }}>Detailed Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium mb-2" style={{ color: colors.deepPurple }}>Daily Unique Visitors</h4>
                    <ul className="list-disc pl-5">
                      {stats.dailyVisitorStats.map((stat) => (
                        <li key={stat._id} className="py-1" style={{ color: colors.deepPurple + "CC" }}>
                          {stat._id}: {stat.uniqueVisitors} unique visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium mb-2" style={{ color: colors.deepPurple }}>Devices</h4>
                    <ul className="list-disc pl-5">
                      {stats.deviceStats.map((stat) => (
                        <li key={stat._id} className="py-1" style={{ color: colors.deepPurple + "CC" }}>
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium mb-2" style={{ color: colors.deepPurple }}>Browsers</h4>
                    <ul className="list-disc pl-5">
                      {stats.browserStats.map((stat) => (
                        <li key={stat._id} className="py-1" style={{ color: colors.deepPurple + "CC" }}>
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium mb-2" style={{ color: colors.deepPurple }}>Operating Systems</h4>
                    <ul className="list-disc pl-5">
                      {stats.osStats.map((stat) => (
                        <li key={stat._id} className="py-1" style={{ color: colors.deepPurple + "CC" }}>
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorStats;