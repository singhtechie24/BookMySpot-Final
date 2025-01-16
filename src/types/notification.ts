export type NotificationStatus = 'read' | 'unread';
export type NotificationActionType = 'view' | 'approve' | 'reject';

export interface NotificationAction {
  type: NotificationActionType;
  link: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
  action?: NotificationAction;
} 