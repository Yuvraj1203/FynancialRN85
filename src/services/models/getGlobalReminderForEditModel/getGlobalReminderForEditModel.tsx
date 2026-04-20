export type ReminderTaskModel = {
  reminderTitle?: string;
  reminderTypeID?: number;
  sessionID?: null;
  groupID?: null;
  userID?: number;
  fromGlobalCalendar?: boolean;
  reminderStrDateTime?: string;
  reminderTypeName?: string;
  userName?: string;
  isPast?: boolean;
  scheduleTime?: string;
  id?: string;
  fromSelf?: boolean;
};

export type GetGlobalReminderForEditModel = {
  events?: null;
  reminderTask?: ReminderTaskModel;
  postDetail?: null;
  userTags?: null;
  parentActionDetails?: null;
  scheduleMessage?: null;
  tags?: null;
  users?: string;
  programs?: null;
  timeZoneName?: string;
  imageURL?: null;
  messageType?: null;
};
