export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export interface UserContext {
  role: UserRole;
  targetAge: number | string;
  topic: string;
  currentLevel: string; // e.g., Beginner, Intermediate
  goal: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  suggestions?: string[];
}

export interface SavedGuide {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: string;
  tags: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
