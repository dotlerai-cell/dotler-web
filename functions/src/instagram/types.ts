// Backend-safe Instagram types

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  followers_count?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  timestamp?: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;        // <-- REQUIRED for Gemini context & citations
  content: string;
}

