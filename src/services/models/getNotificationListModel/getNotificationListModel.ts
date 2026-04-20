import { ImageType } from '@/components/atoms/customImage/customImage';

export type GetNotificationListModel = {
  totalCount: number;
  unreadCount: number;
  unseenCount: number;
  pushNotificationList: PushNotification[];
};

export type PushNotification = {
  notifId: string;
  userNotifId: string;
  isUnread: boolean;
  message: string;
  notificationName: string;
  notifTime: string;
  timeAgo: string;
  customParameter: string; // Parsed separately into `CustomParameter`
  sessionName: string;
  imgIcon?: any;
  imgType?: ImageType;
};
