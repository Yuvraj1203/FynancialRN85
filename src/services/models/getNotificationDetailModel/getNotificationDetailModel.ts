export type GetNotificationDetailModel = {
  notifId: string;
  deviceId: string;
  deviceType: 'Android' | 'iOS' | string;
  title: string;
  message: string;
  udId: string;
  customParameter: string;
};
