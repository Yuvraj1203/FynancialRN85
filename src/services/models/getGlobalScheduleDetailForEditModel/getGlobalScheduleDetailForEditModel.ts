export type GetGlobalScheduleDetailForEditModel = {
  events?: EventsObject;
  reminderTask?: ReminderTaskObject;
  postDetail?: PostDetailObject;
  userTags?: null;
  parentActionDetails?: ParentActionDetailsObject;
  scheduleMessage?: ScheduleMessageObject;
  scheduleGroupMessage?: ScheduleMessageObject;
  tags?: string;
  users?: null;
  programs?: null;
  timeZoneName?: string;
  contactType?: string;

  imageURL?: null;
  messageType?: string;
  htmlTitle?: string;
  htmlContent?: string;
};

type PostImageMappingObject = {
  postDetailID?: string;
  imageDataID?: string;
  fileExtension?: null;
  id?: string;
};

type PostImageMappingsArray = {
  postImageMapping?: PostImageMappingObject;
  postDetailHeader?: string;
  contentDataDisplayName?: null;
  postImageUrl?: string;
  contentType?: number;
  contentTypeStr?: string;
  displayName?: string;
};

export type PostDocumentMappingListObj = {
  postDetailId?: string;
  creationTime?: string;
  contentType?: string;
  displayName?: string;
  location?: string;
  contentDataId?: string;
  documentTypeId?: number;
  documentName?: string;
  coverImageURL?: string;
  documentTypeName?: string;
  documentId?: string;
  contentURL?: string;
  description?: string;
  isResourceDeleted?: boolean;
  message?: string;
  progress?: string;
};

type PostDetailObject = {
  postType?: number;
  postReplyID?: string;
  header?: null;
  detail?: string;
  detailHTML?: string;
  metaDataJson?: null;
  tagUserIds?: null;
  likeCount?: number;
  commentCount?: number;
  status?: number;
  isActive?: boolean;
  sessionID?: null;
  groupID?: null;
  userID?: number;
  videoDataID?: null;
  imageList?: Array<string>;
  postTypeId?: number;
  userRole?: null;
  userName?: string;
  contentDataDisplayName?: null;
  fromGlobalCalendar?: boolean;
  postStrDateTime?: string;
  isPast?: boolean;
  scheduleTime?: string;
  s3ImageUrl?: null;
  fileToken?: null;
  fileExt?: null;
  displayName?: null;
  coverImage?: null;
  postImageMappings?: PostImageMappingsArray[];
  postDocumentMappingList?: PostDocumentMappingListObj[];
  fromSelf?: boolean;
  assignedBy?: string;
  id?: string;
};

// event model

type EventsObject = {
  eventType?: number;
  eventTypeName?: string;
  colorCode?: null;
  title?: string;
  description?: string;
  link?: string;
  meetingID?: string;
  passcode?: string;
  phone?: string;
  additionalInformation?: null;
  start_Date?: string;
  end_Date?: string;
  start_Time?: string;
  end_Time?: string;
  is_Active?: boolean;
  event_Category_Id?: null;
  hostUserID?: null;
  organizer?: null;
  location?: string;
  strStartDate?: string;
  strEndDate?: string;
  programName?: null;
  sessionName?: null;
  programId?: string;
  sessionId?: string;
  groupId?: string;
  groupName?: null;
  programTypeID?: number;
  fromGlobalCalendar?: boolean;
  isPast?: boolean;
  coverImageUrl?: null;
  fileToken?: null;
  fileExt?: null;
  displayName?: null;
  coverImage?: null;
  isRemove?: boolean;
  id?: string;
};

//action item  model

type ParentActionDetailsObject = {
  dueDate?: string;
  title?: string;
  actionType?: number;
  isPublished?: boolean;
  actionItemsId?: number;
  scheduleDateTime?: string;
  isPast?: boolean;
  assignedBy?: string;
  scheduleTime?: string;
  groupID?: null;
  userID?: number;
  sessionID?: null;
  typeCode?: null;
  week?: number;
  day?: number;
  programId?: null;
  sessionId?: null;
  groupId?: null;
  feedReplyID?: null;
  userTimeZone?: null;
  dataIcon?: null;
  actionItemList?: Array<null>;
  fromGlobalCalendar?: boolean;
  days?: null;
  dueDateConverted?: string;
  id?: string;
  fromSelf?: boolean;
};

// reminder model

type ReminderTaskObject = {
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
  assignedBy?: string;
};

// message model

type ScheduleMessageObject = {
  isPublished?: boolean;
  scheduleDateTime?: string;
  isPast?: boolean;
  assignedBy?: string;
  scheduleTime?: string;
  message?: string;
  targetTenantId?: number;
  imageURL?: null;
  groupID?: null;
  userID?: number;
  sessionID?: null;
  typeCode?: null;
  week?: number;
  day?: number;
  programId?: null;
  sessionId?: null;
  groupId?: null;
  feedReplyID?: null;
  userTimeZone?: null;
  dataIcon?: null;
  fromGlobalCalendar?: boolean;
  contentType?: number;
  fileName?: null;
  postImageMappingList?: Array<null>;
  id?: string;
  messageText?: string;
  messageAttachment?: string;

  fromSelf?: boolean;
};
