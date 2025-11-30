import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError("구글 로그인 실패: " + err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 border border-neon-blue rounded-lg p-6 w-full max-w-sm shadow-[0_0_20px_rgba(0,243,255,0.2)]">
        <h2 className="text-2xl font-bold text-center mb-6 text-white font-mono">
          {isLogin ? 'PILOT LOGIN' : 'NEW LICENSE'}
        </h2>
        
        {error && <div className="bg-red-900/50 text-red-200 text-xs p-2 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-neon-blue outline-none transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-neon-blue outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit"
            className="bg-neon-blue text-black font-bold py-3 rounded hover:bg-white transition-colors"
          >
            {isLogin ? 'LOG IN' : 'REGISTER'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4 opacity-50">
          <div className="h-px bg-gray-500 flex-1"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px bg-gray-500 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-gray-900 font-bold py-3 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S14.86 2 12.16 2C6.43 2 2 6.48 2 12s4.43 10 10.16 10c8.85 0 11.19-6.6 11.19-10c0-.52-.06-1-.1-1.45z"/></svg>
          Google Login
        </button>

        <div className="mt-4 text-center text-sm text-gray-400">
          {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-neon-pink hover:underline"
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </div>
        
        <button onClick={onClose} className="mt-4 w-full text-xs text-gray-600 hover:text-white">
          닫기 (로그인 없이 플레이)
        </button>
      </div>
    </div>
  );
};

export default AuthModal;