
import { Quiz } from './types';

// Mock Quizzes are fine to keep for initial load
export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Data Structures V.1',
    description: 'Structural foundations of computer science. Arrays, Lists, and Stacks.',
    category: 'Computer Science',
    duration: 10,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1_1',
        text: 'Which data structure follows the LIFO principle?',
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        correctAnswer: 1
      },
      {
        id: 'q1_2',
        text: 'What is the time complexity of searching an element in a Hash Map (average case)?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
        correctAnswer: 0
      }
    ]
  },
  {
    id: 'q2',
    title: 'Python Core',
    description: 'Advanced assessment for core Python syntax and type management.',
    category: 'Programming',
    duration: 15,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q2_1',
        text: 'Which of the following is an immutable data type in Python?',
        options: ['List', 'Dictionary', 'Set', 'Tuple'],
        correctAnswer: 3
      }
    ]
  }
];

export const CATEGORIES = ['Computer Science', 'Mathematics', 'Engineering', 'Soft Skills', 'General Awareness'];
