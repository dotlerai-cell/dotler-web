// API Response Types
export interface User {
  phone: string;
  name: string;
  created_at?: string;
}

export interface Campaign {
  id: string;
  message: string;
  recipients: number;
  sent_at: string;
  image_url?: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  message: string;
  problem_type: string;
  confidence: number;
  details?: Record<string, any>;
  created_at: string;
  is_repeat_customer: boolean;
}

export interface ComplaintAnalyticsData {
  total_complaints: number;
  this_week: number;
  week_trend: string;
  top_problems: Array<{
    problem: string;
    count: number;
    percentage: number;
  }>;
  avg_ml_confidence: number;
  repeat_customers: number;
}

export interface IntentStatsData {
  total_messages: number;
  intents: Array<{
    intent_name: string;
    count: number;
    percentage: number;
    confidence: number;
  }>;
  ml_accuracy: number;
  avg_confidence: number;
}

export interface AdminLoginResponse {
  token: string;
  message: string;
}

export interface BroadcastResponse {
  success: boolean;
  sent: number;
  message: string;
}

// Error Types
export class ApiException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiException';
  }
}

export class RateLimitException extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number = 300) {
    super(message);
    this.name = 'RateLimitException';
    this.retryAfter = retryAfter;
  }
}
