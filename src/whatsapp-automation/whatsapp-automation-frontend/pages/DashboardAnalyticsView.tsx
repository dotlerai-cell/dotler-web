import { useState, useEffect, FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Users } from 'lucide-react';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { ComplaintAnalyticsData, ApiException } from '../types';

const DashboardAnalyticsView: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComplaintAnalyticsData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getComplaintAnalytics();
      setData(result);
      setError(null);
    } catch (err) {
      const message = err instanceof ApiException ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {error}</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const chartData = [
    { name: 'This Week', value: data.this_week },
    { name: 'Average', value: Math.round(data.total_complaints / 4) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Complaint Analytics</h2>
        <p className="text-gray-400">Real-time overview of customer complaints and issues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Complaints</p>
              <p className="text-3xl font-bold text-white">{data.total_complaints}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">This Week</p>
              <p className="text-3xl font-bold text-white">{data.this_week}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">ML Confidence</p>
              <p className="text-3xl font-bold text-white">{Math.round(data.avg_ml_confidence * 100)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Repeat Customers</p>
              <p className="text-3xl font-bold text-white">{data.repeat_customers}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Complaint Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#ec1313" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Problems */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Top Issues</h3>
        <div className="space-y-3">
          {data.top_problems.length > 0 ? (
            data.top_problems.map((problem, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{(problem as any).problem ?? (problem as any).name ?? (problem as any).problem_type ?? 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{problem.count} complaints</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-semibold">{Math.round(problem.percentage)}%</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No complaint data available</p>
          )}
        </div>
      </Card>

      {/* Trend Indicator */}
      <Card className={`bg-gradient-to-r ${data.week_trend === 'up' ? 'from-red-500/10 to-red-600/10 border-red-500/20' : 'from-green-500/10 to-green-600/10 border-green-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Weekly Trend</p>
            <p className="text-xl font-bold text-white">
              {data.week_trend === 'up' ? '📈 Increasing' : '📉 Decreasing'}
            </p>
          </div>
          <div className={`text-2xl font-bold ${data.week_trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
            {data.week_trend === 'up' ? '+' : '-'} {Math.abs(Math.round(data.this_week * 0.15))} this week
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardAnalyticsView;
