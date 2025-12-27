import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = () => {
    setError('');
    try {
      signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-primary">Dotler</span>.ai
          </h1>
          <p className="text-gray-400">AI-Powered Ad Automation Platform</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Welcome Back
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
