
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  duration: number;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  answers: number[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: 'PDF' | 'VIDEO' | 'ARTICLE';
  addedBy: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
