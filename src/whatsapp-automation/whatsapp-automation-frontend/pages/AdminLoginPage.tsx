import { useState, FC } from 'react';
import { Lock, User } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import apiService from '../services/apiService';
import { ApiException } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

const AdminLoginPage: FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('[AdminLoginPage] Rendered!');

  const handleLogin = async (e?: any) => {
    console.log('[AdminLoginPage] handleLogin called with:', { username });
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiService.adminLogin(username, password);
      console.log('[AdminLoginPage] Login success!');
      onLoginSuccess();
    } catch (err) {
      const message = err instanceof ApiException ? err.message : String(err);
      console.error('[AdminLoginPage] Login error:', message);
      setError(`❌ ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-gray-700">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Admin Access</h1>
            <p className="text-gray-400">WhatsApp Automation Management</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your username"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition disabled:opacity-50"
              />
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleLogin}
                disabled={isLoading || !username || !password}
                className="w-full h-11 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Admin credentials required for authentication
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
