export type EventModel = {
  eventType?: number;
  eventTypeName?: string;
  colorCode?: string | null;
  title?: string;
  description?: string;
  link?: string;
  meetingID?: string;
  passcode?: string;
  phone?: string;
  additionalInformation?: string | null;
  start_Date?: string;
  end_Date?: string;
  start_Time?: string;
  end_Time?: string;
  is_Active?: boolean;
  event_Category_Id?: string | null;
  hostUserID?: string | null;
  organizer?: string | null;
  location?: string;
  strStartDate?: string;
  strEndDate?: string;
  programName?: string | null;
  sessionName?: string | null;
  programId?: string;
  sessionId?: string;
  groupId?: string;
  groupName?: string | null;
  programTypeID?: number;
  fromGlobalCalendar?: boolean;
  isPast?: boolean;
  coverImageUrl?: string | null;
  fileToken?: string | null;
  fileExt?: string | null;
  displayName?: string | null;
  coverImage?: string;
  isRemove?: boolean;
  id: string; // Assuming `id` is required for every event
};

export type GetGlobalEventForEdit = {
  events?: EventModel;
  reminderTask?: null; // `null` type can be replaced with `any` if the field can hold different values.
  postDetail?: null;
  userTags?: null; // Assuming this will be an array of tags or null
  parentActionDetails?: null;
  scheduleMessage?: string;
  tags?: string[]; // Assuming tags is an array of strings
  users?: string[];
  programs?: string;
  timeZoneName?: string | null;
  imageURL?: string | null;
  messageType?: string | null;
};
