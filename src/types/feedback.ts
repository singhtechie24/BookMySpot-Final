export type FeedbackType = 'general' | 'complaint' | 'bug' | 'suggestion';
export type FeedbackStatus = 'pending' | 'in-progress' | 'resolved' | 'closed';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FeedbackTarget = 'admin' | 'space-owner';

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  type: FeedbackType;
  target: FeedbackTarget;
  subject: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  attachments?: string[];
  spaceOwnerId?: string;
  parkingSpotId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  response?: string;
} 