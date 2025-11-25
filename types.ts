export enum ActiveModule {
  CHAT_REASON = 'CHAT_REASON',
  VISION = 'VISION',
  IMAGINE = 'IMAGINE'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface VisionState {
  image: File | null;
  imageBase64: string | null;
  prompt: string;
  response: string | null;
  isLoading: boolean;
}

export interface ImagineState {
  prompt: string;
  generatedImageUrl: string | null;
  isLoading: boolean;
}