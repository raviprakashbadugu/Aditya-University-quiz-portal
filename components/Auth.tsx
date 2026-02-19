
import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { IconStudent, IconAdmin } from './Icons.tsx';
import { db } from '../services/db.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Updated verification code as per user request
const FACULTY_VERIFICATION_CODE = "AUS_FACULTY";

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    email: '',
    username: '',
    password: '',
    name: ''
  });

  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await db.findUser(formData.usernameOrEmail);
        if (user && user.password === formData.password) {
          onLogin(user);
        } else {
          setError('Invalid credentials. Access denied.');
        }
      } else {
        // Registration Logic
        if (role === UserRole.ADMIN && adminCode !== FACULTY_VERIFICATION_CODE) {
          setError('Invalid Faculty Verification Code.');
          setIsLoading(false);
          return;
        }

        const existing = await db.findUser(formData.email);
        if (existing) {
          setError('User already registered with this email.');
          setIsLoading(false);
          return;
        }

        const newUser: User = {
          id: `u_${Date.now()}`,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: role
        };

        await db.registerUser(newUser);
        onLogin(newUser);
      }
    } catch (err) {
      setError("Database connection error. Check Supabase keys.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 login-bg">
      <div className="glass w-full max-w-md p-10 rounded-[3.5rem] border-slate-200 shadow-2xl animate-fadeIn relative overflow-hidden bg-white/95">
        <div className="absolute top-0 left-0 w-full h-3 bg-blue-600"></div>
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-100">AU</div>
        </div>
        
        <h2 className="text-3xl font-black text-center mb-2 tracking-tighter text-slate-900">
          {isLogin ? 'University Login' : 'Create Account'}
        </h2>
        <p className="text-center text-slate-400 text-sm mb-8 font-medium">Aditya University Portal</p>

        {!isLogin && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              type="button"
              onClick={() => setRole(UserRole.STUDENT)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${role === UserRole.STUDENT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <IconStudent className="w-4 h-4" /> Student
            </button>
            <button 
              type="button"
              onClick={() => setRole(UserRole.ADMIN)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${role === UserRole.ADMIN ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <IconAdmin className="w-4 h-4" /> Faculty
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[11px] font-bold mb-6 text-center animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text" placeholder="Full Name" required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-blue-500 transition-all outline-none"
              />
              <input
                type="text" placeholder="Username" required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-blue-500 transition-all outline-none"
              />
              <input
                type="email" placeholder="Email" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-blue-500 transition-all outline-none"
              />
              {role === UserRole.ADMIN && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black uppercase text-blue-600 mb-2 block">Faculty Verification Key</label>
                  <input
                    type="password" placeholder="Enter Faculty Code" required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          {isLogin && (
            <input
              type="text" placeholder="Username or Email" required
              value={formData.usernameOrEmail}
              onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-blue-500 transition-all outline-none"
            />
          )}

          <input
            type="password" placeholder="Password" required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-blue-500 transition-all outline-none"
          />

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-sm text-white shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center"
          >
            {isLoading ? "Synchronizing..." : (isLogin ? 'Sign In' : 'Register Now')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors"
          >
            {isLogin ? "Need a Faculty or Student account?" : "Return to Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
