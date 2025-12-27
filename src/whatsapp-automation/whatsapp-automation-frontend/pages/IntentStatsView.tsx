import { useState, useEffect, FC } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { IntentStatsData } from '../types';

const COLORS = ['#ec1313', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const IntentStatsView: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<IntentStatsData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getIntentStats();
      setData(result);
    } catch (err) {
      console.error('Failed to load intent stats:', err);
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

  if (!data) return null;

  const chartData = (data.intents || []).map((intent) => ({
    name: intent.intent_name ?? (intent as any).name ?? (intent as any).intent ?? 'Unknown',
    value: intent.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Intent Intelligence</h2>
        <p className="text-gray-400">ML-powered conversation analysis and intent detection</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Messages Analyzed</p>
              <p className="text-3xl font-bold text-white">{data.total_messages.toLocaleString()}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">ML Accuracy</p>
              <p className="text-3xl font-bold text-white">{Math.round(data.ml_accuracy)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Avg Confidence</p>
              <p className="text-3xl font-bold text-white">{Math.round(data.avg_confidence * 100)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Intent Distribution</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">No intent data available</p>
        )}
      </Card>

      {/* Intent Details */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Intent Breakdown</h3>
        <div className="space-y-3">
          {(data.intents || []).length > 0 ? (
            (data.intents || []).map((intent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="text-white font-medium">{intent.intent_name ?? (intent as any).name ?? (intent as any).intent ?? 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">
                      {intent.count} messages • Confidence: {Math.round(intent.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary font-semibold">{intent.percentage}%</p>
                  <div className="w-16 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${intent.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No intent data available</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IntentStatsView;
