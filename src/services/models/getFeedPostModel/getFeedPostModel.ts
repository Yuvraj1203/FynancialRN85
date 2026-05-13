export type GetFeedPostModel = {
  feedReplyID?: string;
  postDetailID?: string;
  userID?: number;
  userName?: string;
  detail?: string;
  detailHTML?: string;
  shortContent?: string;
  metaDataJson?: string;
  likeCount?: number;
  commentCount?: number;
  iFrameList?: string[];
  noofPosts?: number;
  likedByUser?: boolean;
  postDateTime?: string;
  postImageLocation?: string[];
  postImageLocationFeed?: PostImageLocationFeed[];
  postDocumentsForFeed?: postDocumentsForFeed[];
  postImageLocationIDs?: string[];
  userProfileLocation?: string;
  commentsReplies?: CommentsReplies[];
  displayAgo?: string;
  expireCommentDate?: string;
  isCommentingAvailable?: boolean;
  isOwner?: boolean;
  isEditable?: boolean;
  initials?: string;
  recordType?: string;
  hasNextFlag?: boolean;
  isDeletable?: boolean;
  fromGlobalCalendar?: boolean;
  primaryFeedId?: string;
  showMore?: boolean;
  linkPreviewHtml?: string;
  embeddedIframeHtml?: string;
  // Populated by GetBookmarkedPostsForView (FYN-10455)
  bookmarkId?: string;
  collectionId?: string;
};

export type postDocumentsForFeed = {
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

export type PostImageLocationFeed = {
  postImageLocation?: string;
  contentType?: number;
  displayName?: string;
};

export type CommentsReplies = {
  postID?: string;
  commentID?: string;
  comment?: string;
  commentDetailHTML?: string;
  commentsReplies?: CommentsReplies[];

  shortContent?: string;
  commentMetaDataJson?: string;
  commentLikeCount?: number;
  commentReplyCount?: number;
  commentImageLocationList?: string[];
  commentImageLocation?: string;
  iFrameList?: string[];
  userProfileLocation?: string;
  likedByUser?: boolean;
  userID?: number;
  userName?: string;
  postDateTime?: string;
  displayAgo?: string;
  expireCommentDate?: string;
  isCommentingAvailable?: boolean;
  isOwner?: boolean;
  isEditable?: boolean;
  recordType?: string;
  initials?: string;
  isDeletable?: boolean;
  primaryFeedId?: string;
  linkPreviewHtml?: string;
  embeddedIframeHtml?: string;
};

type PostImageMapping = {
  postDetailID?: string;
  imageDataID?: string;
  fileExtension?: string;
  id?: string;
};

type PostImageMappings = {
  postImageMapping?: PostImageMapping;
  postDetailHeader?: string;
  contentDataDisplayName?: string;
  postImageUrl?: string;
  contentType?: number;
  contentTypeStr?: string;
  displayName?: string;
};

type CreateOrEditPostDetail = {
  postType?: number;
  postReplyID?: string;
  header?: string;
  detail?: string;
  detailHTML?: string;
  metaDataJson?: string;
  tagUserIds?: string;
  likeCount?: number;
  commentCount?: number;
  status?: number;
  isActive?: boolean;
  sessionID?: string;
  groupID?: string;
  userID?: number;
  videoDataID?: string;
  imageList?: string[];
  postTypeId?: number;
  userRole?: string;
  userName?: string;
  contentDataDisplayName?: string;
  fromGlobalCalendar?: boolean;
  postStrDateTime?: string;
  isPast?: boolean;
  scheduleTime?: string;
  s3ImageUrl?: string;
  fileToken?: string;
  fileExt?: string;
  displayName?: string;
  coverImage?: string;
  postImageMappings?: PostImageMappings[];
  id?: string;
};

type GroupList = {
  groupName?: string;
  programSessionID?: string;
  assignCoach?: string;
  viewClients?: string;
  maxGroupSize?: number;
  enrolledCount?: number;
  groupNameIndex?: string;
  index?: number;
  clientEmailAddress?: string;
  isProgramOneOnOne?: boolean;
  id?: string;
};

export type GetFeedPostDetailsForEditModel = {
  createOrEditPostDetail?: CreateOrEditPostDetail;
  postImageMappingList?: PostImageMappings[];
  postDocumentMappingList?: postDocumentsForFeed[];
  groupList?: GroupList[];
  feedReplyID?: string;
  typeCode?: string;
  week?: number;
  day?: number;
  programId?: string;
  sessionId?: string;
  groupId?: string;
  scheduleTime?: string;
  dataIcon?: string;
  fullName?: string;
  forUserId?: number;
  fromUsersTab?: number;
  forUserName?: string;
};
