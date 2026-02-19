
import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../types.ts';
import { explainWrongAnswer } from '../services/gemini.ts';

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
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
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

    if (timeLeft < 60) setIsUrgent(true);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (optionIndex: number) => {
    if (feedback) return;

    const isCorrect = optionIndex === quiz.questions[currentQuestionIndex].correctAnswer;
    setFeedback({ idx: optionIndex, correct: isCorrect });

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    // If it's the last question, don't auto-advance so they can see feedback
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setTimeout(() => {
        if (!isExplaining) {
          setFeedback(null);
          setAiExplanation(null);
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }, 2500);
    }
  };

  const handleExplain = async () => {
    if (!feedback || isExplaining) return;
    setIsExplaining(true);
    const q = quiz.questions[currentQuestionIndex];
    const explanation = await explainWrongAnswer(q.text, q.options, q.correctAnswer, feedback.idx);
    setAiExplanation(explanation);
    setIsExplaining(false);
  };

  const nextQuestion = () => {
    setFeedback(null);
    setAiExplanation(null);
    setCurrentQuestionIndex(prev => prev + 1);
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
            <span className="text-blue-600 font-black text-sm uppercase tracking-widest">Item {currentQuestionIndex + 1}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{quiz.questions.length} total</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-4xl font-black font-mono px-6 py-4 rounded-[1.5rem] border-2 transition-all duration-700 ${isUrgent ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-blue-600 shadow-sm'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="glass-morphism p-12 rounded-[3rem] min-h-[500px] flex flex-col border-slate-200 shadow-xl relative overflow-hidden bg-white/95">
        <div className="mb-12">
          <h3 className="text-2xl font-black leading-tight mb-12 text-slate-800">
            {currentQuestion.text}
          </h3>
          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestionIndex] === idx;
              const isCorrectAnswer = idx === currentQuestion.correctAnswer;
              
              let feedbackClass = "border-slate-100 bg-slate-50 hover:border-blue-200 text-slate-600";
              if (feedback) {
                if (isCorrectAnswer) feedbackClass = "border-green-500 bg-green-50 text-green-700 shadow-lg shadow-green-100";
                else if (isSelected) feedbackClass = "border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-100";
                else feedbackClass = "opacity-30 grayscale";
              }

              return (
                <button
                  key={idx}
                  disabled={!!feedback}
                  onClick={() => handleOptionSelect(idx)}
                  className={`group w-full text-left p-6 rounded-[1.5rem] border-2 transition-all transform active:scale-[0.99] flex items-center ${feedbackClass}`}
                >
                  <span className={`w-12 h-12 flex items-center justify-center rounded-2xl mr-6 font-black text-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg font-bold">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div className="mt-8 animate-slideUp">
            {!aiExplanation ? (
              <button 
                onClick={handleExplain}
                disabled={isExplaining}
                className="w-full py-4 rounded-2xl border-2 border-blue-100 bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-3"
              >
                {isExplaining ? (
                  <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> AI Thinking...</>
                ) : (
                  <>✨ Why is this the answer?</>
                )}
              </button>
            ) : (
              <div className="p-6 bg-slate-900 text-white rounded-[2rem] text-sm leading-relaxed relative animate-fadeIn">
                 <div className="flex items-center gap-2 mb-3 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                   AI Tutor Explanation
                 </div>
                 {aiExplanation}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            {Math.round(progress)}% Complete
          </p>
          
          {feedback && (
            <div className="flex gap-4">
               {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                >
                  Next Item
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-14 py-4 rounded-2xl bg-green-600 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-100"
                >
                  Submit Session
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
