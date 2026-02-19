
import { createClient } from '@supabase/supabase-js';
import { Quiz, QuizAttempt, User } from '../types';

// These would normally be in your .env or Vercel dashboard
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if keys exist, otherwise use a proxy for local-first dev
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const db = {
  // --- QUIZZES ---
  async getQuizzes(): Promise<Quiz[]> {
    if (!supabase) return JSON.parse(localStorage.getItem('au_quizzes') || '[]');
    const { data, error } = await supabase.from('quizzes').select('*');
    if (error) throw error;
    return data as Quiz[];
  },

  async saveQuiz(quiz: Quiz) {
    if (!supabase) {
      const existing = JSON.parse(localStorage.getItem('au_quizzes') || '[]');
      const index = existing.findIndex((q: any) => q.id === quiz.id);
      if (index > -1) existing[index] = quiz;
      else existing.push(quiz);
      localStorage.setItem('au_quizzes', JSON.stringify(existing));
      return;
    }
    const { error } = await supabase.from('quizzes').upsert(quiz);
    if (error) throw error;
  },

  async deleteQuiz(id: string) {
    if (!supabase) {
      const existing = JSON.parse(localStorage.getItem('au_quizzes') || '[]');
      localStorage.setItem('au_quizzes', JSON.stringify(existing.filter((q: any) => q.id !== id)));
      return;
    }
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ATTEMPTS ---
  async getAttempts(studentId?: string): Promise<QuizAttempt[]> {
    if (!supabase) return JSON.parse(localStorage.getItem('au_attempts') || '[]');
    let query = supabase.from('attempts').select('*');
    if (studentId) query = query.eq('studentId', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as QuizAttempt[];
  },

  async saveAttempt(attempt: QuizAttempt) {
    if (!supabase) {
      const existing = JSON.parse(localStorage.getItem('au_attempts') || '[]');
      existing.push(attempt);
      localStorage.setItem('au_attempts', JSON.stringify(existing));
      return;
    }
    const { error } = await supabase.from('attempts').insert(attempt);
    if (error) throw error;
  },

  // --- USERS ---
  async findUser(usernameOrEmail: string): Promise<User | null> {
    if (!supabase) {
      const users = JSON.parse(localStorage.getItem('au_users') || '[]');
      return users.find((u: any) => u.username === usernameOrEmail || u.email === usernameOrEmail) || null;
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as User | null;
  },

  async registerUser(user: User) {
    if (!supabase) {
      const users = JSON.parse(localStorage.getItem('au_users') || '[]');
      users.push(user);
      localStorage.setItem('au_users', JSON.stringify(users));
      return;
    }
    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;
  }
};
