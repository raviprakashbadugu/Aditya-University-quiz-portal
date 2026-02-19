
import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../types.ts';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (attempt: QuizAttempt) => void;
  onCancel: () => void;
  userId: string;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete, onCancel, userId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [feedback, setFeedback] = useState<{ idx: number, correct: boolean } | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (timeLeft < 60) {
      document.body.classList.add('bg-urgent');
      setIsUrgent(true);
    } else {
      document.body.classList.add('bg-focus');
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.body.classList.remove('bg-urgent', 'bg-focus');
      clearInterval(timer);
    };
  }, [timeLeft]);

  const handleOptionSelect = (optionIndex: number) => {
    if (feedback) return;

    const isCorrect = optionIndex === quiz.questions[currentQuestionIndex].correctAnswer;
    setFeedback({ idx: optionIndex, correct: isCorrect });

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < quiz.questions.length - 1) {
        setFeedback(null);
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 1200);
  };

  const handleSubmit = () => {
    const score = answers.reduce((acc, ans, idx) => {
      return acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0);
    }, 0);

    const attempt: QuizAttempt = {
      id: `att_${Date.now()}`,
      quizId: quiz.id,
      studentId: userId,
      score,
      totalQuestions: quiz.questions.length,
      completedAt: new Date().toISOString(),
      answers
    };
    onComplete(attempt);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fadeIn relative z-10">
      <div className="w-full h-1.5 bg-slate-200 rounded-full mb-10 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-sm" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{quiz.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-blue-600 font-black text-sm uppercase tracking-widest">Question {currentQuestionIndex + 1}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{quiz.questions.length} total</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-4xl font-black font-mono px-6 py-4 rounded-[1.5rem] border-2 transition-all duration-700 ${isUrgent ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-blue-600 shadow-sm'}`}>
            {formatTime(timeLeft)}
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-3 font-black">Time Limit</span>
        </div>
      </div>

      <div className="glass-morphism p-12 rounded-[3rem] min-h-[480px] flex flex-col border-slate-200 shadow-xl relative overflow-hidden bg-white/90">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="mb-12 relative">
          <h3 className="text-2xl font-black leading-tight mb-12 text-slate-800">
            {currentQuestion.text}
          </h3>
          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestionIndex] === idx;
              const isCorrectAnswer = idx === currentQuestion.correctAnswer;
              
              let feedbackClass = "border-slate-100 bg-slate-50 hover:border-blue-200 text-slate-600";
              if (feedback) {
                if (isCorrectAnswer) feedbackClass = "feedback-correct border-green-500 text-green-700";
                else if (isSelected) feedbackClass = "feedback-incorrect border-red-500 text-red-700";
                else feedbackClass = "opacity-30 grayscale";
              } else if (isSelected) {
                feedbackClass = "border-blue-500 bg-blue-50 text-blue-700 animate-pulse-border";
              }

              return (
                <button
                  key={idx}
                  disabled={!!feedback}
                  onClick={() => handleOptionSelect(idx)}
                  className={`group w-full text-left p-6 rounded-[1.5rem] border-2 transition-all transform active:scale-[0.99] flex items-center ${feedbackClass}`}
                >
                  <span className={`w-12 h-12 flex items-center justify-center rounded-2xl mr-6 font-black text-sm transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg font-bold">{option}</span>
                  {feedback && isCorrectAnswer && (
                    <svg className="ml-auto w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {feedback && isSelected && !isCorrectAnswer && (
                    <svg className="ml-auto w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            {Math.round(progress)}% Progress Recorded
          </p>
          
          {currentQuestionIndex === quiz.questions.length - 1 && feedback && (
            <button
              onClick={handleSubmit}
              className="px-14 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-100 hover:scale-105 active:scale-95"
            >
              Finish Session
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button 
          onClick={onCancel}
          className="text-slate-400 hover:text-red-600 font-black text-[10px] uppercase tracking-[0.3em] transition-all py-3 px-8 rounded-2xl hover:bg-red-50"
        >
          Terminate Assessment
        </button>
      </div>
    </div>
  );
};
