export type GetScheduleTasksForGlobalCalendarModel = {
  scheduleTaskTypeId?: number;
  eventType?: number;
  title?: string;
  description?: string;
  link?: string;
  meetingID?: string;
  passcode?: string;
  event_Start_Date?: string;
  event_End_Date?: string;
  event_Start_Time?: string;
  event_End_Time?: string;
  colorCode?: string;
  scheduleTaskTypeName?: string;
  scheduleDateTime?: string;
  reminderType?: string;
  taskIdentifier?: string;
  userTags?: string;
  actionCode?: number;
  userNameFilter?: string;
  userTypeFilter?: string;
  programFilter?: string;
  id?: number;
  appStartDate?: string;
  appEndDate?: string;
  appStartTime?: string;
  appEndTime?: string;
  sameDayEvent?: boolean;
  isPastDate?: boolean;
  uiTitle?: string;
  icon?: string;
  FromSelf?: boolean;
};

export type onBehalfOfModel = {
  value?: string;
};
