import { useState, useEffect, FC } from 'react';
import { Plus, Loader, Users, AlertCircle } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { User, ApiException } from '../types';

const UsersManagementView: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getAllUsers();
      setUsers(result);
      setError(null);
    } catch (err) {
      const message = err instanceof ApiException ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e?: any) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!phone || !name) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await apiService.addUser(phone, name);
      setPhone('');
      setName('');
      setSuccess(`✅ User ${name} added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      await loadUsers();
    } catch (err) {
      const message = err instanceof ApiException ? err.message : String(err);
      setError(`❌ ${message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiService.uploadUsersCsv(csvFile);
      setSuccess(`✅ Imported ${res.imported} users`);
      setCsvFile(null);
      (document.getElementById('csv-input') as HTMLInputElement | null)?.value && ((document.getElementById('csv-input') as HTMLInputElement).value = '');
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof ApiException ? err.message : String(err);
      setError(`❌ ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
        <p className="text-gray-400">Add, manage, and view all registered users</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Success Alert */}
      {success && (
        <Card className="bg-green-500/10 border-green-500/20">
          <div className="flex items-center gap-3 text-green-400">
            <span>{success}</span>
          </div>
        </Card>
      )}

      {/* Add User Form */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                disabled={isAdding}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition disabled:opacity-50"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isAdding}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition disabled:opacity-50"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleAddUser}
            disabled={isAdding || !phone || !name}
            className="w-full h-10 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add User
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* CSV Import */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-3">Import Users from CSV</h3>
        <div className="flex items-center gap-3">
          <input id="csv-input" type="file" accept=".csv,text/csv" onChange={handleFileChange} className="text-sm text-gray-400" />
          <Button variant="primary" onClick={handleUploadCsv} disabled={isUploading || !csvFile}>
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </Button>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registered Users ({users.length})
          </h3>
          <Button
            variant="secondary"
            onClick={loadUsers}
            disabled={isLoading}
            className="text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No users added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Added</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.phone} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 text-white font-mono text-sm">{user.phone}</td>
                    <td className="px-4 py-3 text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UsersManagementView;
