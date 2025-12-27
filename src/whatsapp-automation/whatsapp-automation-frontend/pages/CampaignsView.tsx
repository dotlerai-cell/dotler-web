import { useState, useEffect, FC } from 'react';
import { Send, ChevronDown, Loader, History, AlertCircle } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { User, Campaign, ApiException } from '../types';

const CampaignsView: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    loadUsers();
    loadCampaigns();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const result = await apiService.getAllUsers();
      setUsers(result);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      const result = await apiService.getBroadcastHistory(100);
      setCampaigns(result);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleSelectUser = (phone: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      setSelectedUsers(new Set(users.map((u) => u.phone)));
      setSelectAll(true);
    }
  };

  const handleSendBroadcast = async (e?: any) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!message.trim() || selectedUsers.size === 0) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.sendBroadcastSelected(
        message,
        Array.from(selectedUsers)
      );
      setSuccess(`✅ Message sent to ${result.sent} users!`);
      setMessage('');
      setSelectedUsers(new Set());
      setSelectAll(false);
      setTimeout(() => setSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : String(err);
      setError(`❌ ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Campaigns & Broadcasting</h2>
        <p className="text-gray-400">Send messages to selected users and view campaign history</p>
      </div>

      {/* Error/Success Alerts */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {success && (
        <Card className="bg-green-500/10 border-green-500/20">
          <div className="flex items-center gap-3 text-green-400">
            <span>{success}</span>
          </div>
        </Card>
      )}

      {/* Send Campaign Form */}
      <Card>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold text-white">Create Broadcast</h3>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition ${showForm ? 'rotate-180' : ''}`}
          />
        </button>

        {showForm && (
          <form onSubmit={handleSendBroadcast} className="space-y-4 pt-4 border-t border-gray-700">
            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your broadcast message..."
                disabled={isSending}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition disabled:opacity-50 resize-none"
              />
            </div>

            {/* User Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Select Recipients ({selectedUsers.size})
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary hover:text-primary/80 transition"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
                  No users available. Add users first.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto bg-gray-800/20 rounded-lg border border-gray-700 p-3 space-y-2">
                  {users.map((user) => (
                    <label key={user.phone} className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-2 rounded transition">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.phone)}
                        onChange={() => handleSelectUser(user.phone)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        <p className="text-gray-400 text-xs truncate">{user.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button
              variant="primary"
              onClick={handleSendBroadcast}
              disabled={isSending || !message.trim() || selectedUsers.size === 0}
              className="w-full h-11 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </form>
        )}
      </Card>

      {/* Campaign History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Campaign History
          </h3>
          <Button
            variant="secondary"
            onClick={loadCampaigns}
            disabled={isLoadingCampaigns}
            className="text-sm"
          >
            {isLoadingCampaigns ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {isLoadingCampaigns ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No campaigns sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign, index) => (
              <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium mb-1 line-clamp-2">{campaign.message}</p>
                    {(() => {
                      // fallback for different backend field names
                      const recipients = (campaign as any).recipients ?? (campaign as any).sent ?? (campaign as any).recipient_count ?? ((campaign as any).users ? (campaign as any).users.length : undefined);
                      return (
                        <p className="text-gray-400 text-sm">
                          Sent to {recipients ?? 'N/A'} user{(recipients && recipients !== 1) ? 's' : ''}
                        </p>
                      );
                    })()}
                  </div>
                  <p className="text-gray-500 text-xs whitespace-nowrap">
                    {(() => {
                      const sentAt = (campaign as any).sent_at ?? (campaign as any).sentAt ?? (campaign as any).created_at ?? (campaign as any).timestamp;
                      return sentAt ? `${new Date(sentAt).toLocaleDateString()} ${new Date(sentAt).toLocaleTimeString()}` : 'N/A';
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CampaignsView;
