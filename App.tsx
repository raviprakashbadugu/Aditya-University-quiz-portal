
import React, { useState, useEffect } from 'react';
import { User, UserRole, Quiz, QuizAttempt } from './types.ts';
import { MOCK_QUIZZES } from './constants.tsx';
import { Auth } from './components/Auth.tsx';
import { QuizPlayer } from './components/QuizPlayer.tsx';
import { QuizEditor } from './components/QuizEditor.tsx';
import { AIChatBox } from './components/AIChatBox.tsx';
import { IconDashboard, IconStats, IconLogout, IconLibrary, IconAdmin } from './components/Icons.tsx';
import { db } from './services/db.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [view, setView] = useState<'dashboard' | 'admin' | 'quiz' | 'stats' | 'editor' | 'library'>('dashboard');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('au_user');
        let user: User | null = null;
        if (savedUser) {
           user = JSON.parse(savedUser);
           setCurrentUser(user);
           if (user?.role === UserRole.ADMIN) setView('admin');
        }
        
        const [dbQuizzes, dbAttempts] = await Promise.all([
          db.getQuizzes(),
          db.getAttempts(user?.role === UserRole.STUDENT ? user.id : undefined)
        ]);
        
        setQuizzes(dbQuizzes.length ? dbQuizzes : MOCK_QUIZZES);
        setAttempts(dbAttempts);
        
        // Load AI status from local storage or DB
        const savedAiStatus = localStorage.getItem('au_ai_enabled');
        if (savedAiStatus !== null) setAiEnabled(savedAiStatus === 'true');

      } catch (err) {
        console.error("DB Sync Failure", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('au_user');
    setView('dashboard');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('au_user', JSON.stringify(user));
    setView(user.role === UserRole.ADMIN ? 'admin' : 'dashboard');
  };

  const handleQuizComplete = async (attempt: QuizAttempt) => {
    setIsLoading(true);
    try {
      await db.saveAttempt(attempt);
      setAttempts(prev => [...prev, attempt]);
      setActiveQuiz(null);
      setView('stats');
    } catch (err) {
      alert("Database error saving results.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuiz = async (quiz: Quiz) => {
    setIsLoading(true);
    try {
      await db.saveQuiz(quiz);
      setQuizzes(prev => {
        const exists = prev.find(q => q.id === quiz.id);
        if (exists) return prev.map(q => q.id === quiz.id ? quiz : q);
        return [quiz, ...prev];
      });
      setView('admin');
    } catch (err) {
      alert("Error saving curriculum.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAi = () => {
    const newStatus = !aiEnabled;
    setAiEnabled(newStatus);
    localStorage.setItem('au_ai_enabled', String(newStatus));
  };

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Verifying Academic Session...</p>
      </div>
    </div>
  );

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const userAttempts = attempts.filter(a => a.studentId === currentUser.id);
  const statsData = quizzes.map(q => {
    const qAttempts = userAttempts.filter(a => a.quizId === q.id);
    const best = qAttempts.length ? Math.max(...qAttempts.map(a => (a.score / a.totalQuestions) * 100)) : 0;
    return { name: q.title.substring(0, 10), score: Math.round(best) };
  }).filter(d => d.score > 0);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="w-full md:w-72 glass border-r border-slate-200 p-8 flex flex-col gap-8 sticky top-0 md:h-screen z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">A</div>
          <div>
            <span className="font-extrabold text-lg tracking-tight block">Aditya Univ</span>
            <span className="text-[9px] uppercase font-black text-blue-600 tracking-widest">{currentUser.role} PORTAL</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isAdmin ? (
            <button onClick={() => setView('admin')} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${view === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
              <IconAdmin className="w-5 h-5" /> Faculty Console
            </button>
          ) : (
            <button onClick={() => setView('dashboard')} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
              <IconDashboard className="w-5 h-5" /> Student Hub
            </button>
          )}
          
          <button onClick={() => setView('library')} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${view === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
            <IconLibrary className="w-5 h-5" /> Library
          </button>
          
          <button onClick={() => setView('stats')} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${view === 'stats' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
            <IconStats className="w-5 h-5" /> Analytics
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <div className="mb-4 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">{currentUser.name[0]}</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{isAdmin ? 'Faculty' : 'Student'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all">
            <IconLogout className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-5xl mx-auto animate-slideUp">
            <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Academic Assessments</h1>
            <p className="text-slate-500 mb-12 font-medium">Hello {currentUser.name.split(' ')[0]}, select a module to start your test.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quizzes.map(q => (
                <div key={q.id} className="glass p-10 rounded-[3rem] border border-slate-100 hover:border-blue-400 transition-all flex flex-col group relative bg-white/80">
                  <div className="absolute top-8 right-8 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{q.category}</div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-blue-600 transition-colors">{q.title}</h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed line-clamp-2">{q.description}</p>
                  <button onClick={() => { setActiveQuiz(q); setView('quiz'); }} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-100">Launch Module</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="max-w-5xl mx-auto animate-slideUp">
            <div className="flex justify-between items-center mb-12">
              <h1 className="text-5xl font-black tracking-tighter">Faculty Console</h1>
              <div className="flex gap-4">
                 <button 
                  onClick={toggleAi}
                  className={`px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${aiEnabled ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                >
                  AI Status: {aiEnabled ? 'Active' : 'Offline'}
                </button>
                <button onClick={() => { setEditingQuiz(undefined); setView('editor'); }} className="px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Create New Quiz</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 mb-12">
               <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="text-2xl font-black mb-2">Academic Control Panel</h3>
                    <p className="opacity-80 text-sm font-medium">Protect your API and manage curriculum from here.</p>
                 </div>
                 <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest">Privacy Guard</span>
                    <div onClick={toggleAi} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${aiEnabled ? 'bg-green-400' : 'bg-slate-400'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="glass rounded-[2.5rem] overflow-hidden border border-slate-200 bg-white/50">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Curriculum Module</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Database Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzes.map(q => (
                    <tr key={q.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-6">
                        <span className="font-black text-slate-800 text-lg">{q.title}</span>
                        <br/><span className="text-[10px] font-bold text-slate-400 uppercase">{q.questions.length} Questions • {q.duration} Mins</span>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => { setEditingQuiz(q); setView('editor'); }} className="text-blue-600 font-black text-xs uppercase px-4 py-2 hover:bg-blue-50 rounded-xl transition-all">Edit</button>
                        <button onClick={() => db.deleteQuiz(q.id).then(() => setQuizzes(quizzes.filter(qz => qz.id !== q.id)))} className="text-red-500 font-black text-xs uppercase px-4 py-2 hover:bg-red-50 rounded-xl transition-all ml-2">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'stats' && (
          <div className="max-w-5xl mx-auto animate-slideUp">
            <h1 className="text-5xl font-black mb-12 tracking-tighter text-slate-900">Performance Analysis</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 glass p-10 rounded-[3rem] border border-slate-200 min-h-[400px] bg-white/80">
                <h3 className="text-xl font-black mb-8 text-slate-800">Mastery Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statsData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={45}>
                       {statsData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass p-10 rounded-[3rem] bg-blue-600 text-white flex flex-col justify-center shadow-2xl shadow-blue-200">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Aggregate Proficiency</p>
                <h2 className="text-8xl font-black">{statsData.length ? Math.round(statsData.reduce((a,b)=>a+b.score,0)/statsData.length) : 0}%</h2>
                <p className="text-sm mt-6 opacity-80 leading-relaxed font-medium">Your current standing across all verified Aditya University modules.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'quiz' && activeQuiz && (
          <QuizPlayer quiz={activeQuiz} userId={currentUser.id} onComplete={handleQuizComplete} onCancel={() => setView(isAdmin ? 'admin' : 'dashboard')} />
        )}

        {view === 'editor' && isAdmin && (
          <QuizEditor quiz={editingQuiz} onSave={handleSaveQuiz} onCancel={() => setView('admin')} />
        )}

        {view === 'library' && (
          <div className="max-w-5xl mx-auto text-center py-32 animate-slideUp">
             <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-50">
               <IconLibrary className="w-12 h-12" />
             </div>
             <h1 className="text-4xl font-black mb-4">Faculty Resource Library</h1>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Study guides and lecture materials are managed via the Secure College Database.</p>
          </div>
        )}
      </main>

      {aiEnabled && <AIChatBox />}
    </div>
  );
};

export default App;
