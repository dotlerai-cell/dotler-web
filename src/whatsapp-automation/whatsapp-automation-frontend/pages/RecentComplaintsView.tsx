import { useState, useEffect, FC } from 'react';
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { Complaint } from '../types';

const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const RecentComplaintsView: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getRecentComplaints(50);
      setComplaints(result.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'bg-green-500/20 border-green-500/30 text-green-400';
    if (confidence > 0.5) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    return 'bg-red-500/20 border-red-500/30 text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.7) return 'High';
    if (confidence > 0.5) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Recent Complaints Feed</h2>
          <p className="text-gray-400">Customer issues and complaints from conversations</p>
        </div>
        <Button
          variant="secondary"
          onClick={loadComplaints}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No recent complaints</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              className="hover:bg-gray-800/50 transition border border-gray-700"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{complaint.problem_type}</p>
                      {complaint.is_repeat_customer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400">
                          Repeat Customer
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{complaint.user_id}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getConfidenceColor(complaint.confidence)}`}>
                    {getConfidenceLabel(complaint.confidence)} • {Math.round(complaint.confidence * 100)}%
                  </div>
                </div>

                {/* Message */}
                <p className="text-gray-300 text-sm leading-relaxed">{complaint.message}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-500">{timeAgo(complaint.created_at)}</span>
                  {complaint.details && Object.keys(complaint.details).length > 0 && (
                    <span className="text-xs bg-gray-800/50 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {Object.keys(complaint.details).length} detail{Object.keys(complaint.details).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentComplaintsView;
