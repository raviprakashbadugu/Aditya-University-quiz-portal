
import React, { useState } from 'react';
import { Quiz, Question } from '../types.ts';
import { CATEGORIES } from '../constants.tsx';
import { generateAIQuestions } from '../services/gemini.ts';

interface QuizEditorProps {
  quiz?: Quiz;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Quiz>>(quiz || {
    title: '',
    description: '',
    category: CATEGORIES[0],
    duration: 15,
    questions: [{ id: '1', text: '', options: ['', '', '', ''], correctAnswer: 0 }],
    createdAt: new Date().toISOString()
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAIInvite = async () => {
    const topic = prompt("Enter a topic for AI to generate questions (e.g., Quantum Physics, React Hooks):");
    if (!topic) return;

    setIsAiLoading(true);
    const suggested = await generateAIQuestions(topic);
    setIsAiLoading(false);

    if (suggested) {
      const newQuestions: Question[] = suggested.map((q: any, i: number) => ({
        ...q,
        id: `ai_${Date.now()}_${i}`
      }));
      setFormData(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...newQuestions]
      }));
    } else {
      alert("AI failed to generate questions. Please check your API key.");
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setFormData({ ...formData, questions: [...(formData.questions || []), newQuestion] });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...(formData.questions || [])];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...(formData.questions || [])];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...(formData.questions || [])];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = value;
    newQuestions[qIndex].options = newOptions;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.questions?.length) {
      alert("Please fill in the title and add questions.");
      return;
    }
    onSave({ ...formData as Quiz, id: formData.id || `q_${Date.now()}` });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fadeIn pb-32">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black tracking-tighter text-slate-900">{quiz ? 'Refine Assessment' : 'New Assessment'}</h2>
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={handleAIInvite} 
            disabled={isAiLoading}
            className="px-6 py-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all flex items-center gap-2"
          >
            {isAiLoading ? 'AI Thinking...' : '✨ Generate with AI'}
          </button>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass-morphism p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 border-slate-200 bg-white/80">
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quiz Title</label>
            <input
              type="text" required value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all font-bold text-lg text-slate-800"
              placeholder="e.g., Computer Architecture Fundamentals"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Module Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all text-sm leading-relaxed text-slate-800"
              rows={3} placeholder="Brief summary for students..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Academic Stream</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 appearance-none font-bold text-slate-800 shadow-sm"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Duration (Minutes)</label>
            <input
              type="number" value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-slate-900">Curriculum Items ({formData.questions?.length})</h3>
            <button
              type="button" onClick={handleAddQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
            >
              Add Question
            </button>
          </div>

          {formData.questions?.map((q, qIdx) => (
            <div key={q.id} className="glass-morphism p-8 rounded-[2rem] border border-slate-200 relative group hover:border-blue-400 transition-all bg-white/80">
              <button
                type="button" onClick={() => handleRemoveQuestion(qIdx)}
                className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
              </button>
              
              <div className="mb-8">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 block">Question Block {qIdx + 1}</span>
                <input
                  type="text" required value={q.text}
                  onChange={e => handleQuestionChange(qIdx, 'text', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all font-bold text-lg text-slate-800"
                  placeholder="The question content goes here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-4 group/opt">
                    <input
                      type="radio" name={`correct_${q.id}`}
                      checked={q.correctAnswer === oIdx}
                      onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                      className="w-6 h-6 rounded-full border-2 border-slate-200 appearance-none checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all"
                    />
                    <input
                      type="text" required value={opt}
                      onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                      className={`flex-1 bg-slate-50 border rounded-2xl px-5 py-3 text-sm focus:outline-none transition-all ${q.correctAnswer === oIdx ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 group-hover/opt:border-blue-200'}`}
                      placeholder={`Choice ${String.fromCharCode(65 + oIdx)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-2xl border-t border-slate-200 flex justify-center gap-4 z-40">
          <button
            type="button" onClick={onCancel}
            className="px-10 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest transition-all"
          >
            Cancel Session
          </button>
          <button
            type="submit"
            className="px-14 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 transition-all transform hover:scale-105 active:scale-95"
          >
            Deploy Assessment
          </button>
        </div>
      </form>
    </div>
  );
};
