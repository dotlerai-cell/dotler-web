import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';

const API_URL = 'http://localhost:5000';

interface StatsData {
  totalUsers: number;
  consented: number;
  optedOut: number;
}

const ConsentManagement = () => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const data = stats ? [
    { name: 'Consented', value: stats.consented },
    { name: 'Opted Out', value: stats.optedOut },
  ] : [];
  const COLORS = ['#00C49F', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm text-gray-400 mb-2">Total Users</h3>
              <h1 className="text-4xl font-bold text-white">{stats.totalUsers}</h1>
            </Card>
            <Card>
              <h3 className="text-sm text-gray-400 mb-2">Opt-Outs</h3>
              <h1 className="text-4xl font-bold text-white">{stats.optedOut}</h1>
            </Card>
          </div>
          
          <Card>
            <h3 className="text-xl font-semibold text-white mb-6">Consent Overview</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value" 
                    label
                  >
                    {data.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : <p className="text-gray-400">Loading Analytics...</p>}
    </div>
  );
};

export default ConsentManagement;
