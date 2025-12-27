
export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED'
}

export interface Post {
  id: string;
  instagramId?: string;
  topic: string;
  imageUrl?: string;
  generatedCaption: string;
  hashtags: string[];
  status: PostStatus;
  scheduledTime?: string;
  createdAt: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  priority?: 'low' | 'medium' | 'high';
}

export interface DMThread {
  id: string;
  recipientId?: string;
  username: string;
  avatar: string;
  lastMessage: string;
  history: {
    sender: 'user' | 'bot';
    text: string;
    timestamp: number;
  }[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'PDF' | 'TXT';
  status: 'indexed' | 'processing';
  size: string;
  content?: string;
}

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
  biography?: string;
  website?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string; // Important for VIDEO media type
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink?: string;
  is_comment_enabled?: boolean;
}

export interface InstagramConfig {
  accessToken: string;
  businessId: string;
  webhookUrl?: string; // Track the Cloudflare/Messaging webhook
  verifyToken?: string; // Custom token for Webhook verification
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;

}

export interface AutomationRule {
  id: string;
  name: string;
  triggerKeyword: string;
  dmResponse: string;
  requireFollow: boolean;
  isActive: boolean;
  triggerCount: number;
}

export type ViewState = 'dashboard' | 'create' | 'schedule' | 'knowledge' | 'dms' | 'settings' | 'chatbot' | 'feed' | 'automation' | 'hashtags';
