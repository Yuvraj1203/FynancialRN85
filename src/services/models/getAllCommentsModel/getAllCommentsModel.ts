import {CommentType} from '@/components/template/commentItem/commentItem';

export type GetAllCommentsModel = {
  feedReplyID?: string;
  postDetailID?: string;
  userID?: number;
  userName?: string;
  detail?: string;
  detailHTML?: string;
  shortContent?: string;
  iFrameList?: string[];
  metaDataJson?: string;
  likeCount?: number;
  commentCount?: number;
  noofPosts?: number;
  likedByUser?: boolean;
  postDateTime?: string;
  postImageLocation?: string[];
  postImageLocationFeed?: PostImageLocationFeed[];
  postImageLocationIDs?: string[];
  userProfileLocation?: string;
  commentsReplies?: CommentsReplies[];
  allCommentsReplies?: GetAllCommentsModel[];
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
  pageNo?: number;
  viewType?: CommentType;
  showAllReplies?: boolean;
  mainCommentId?: string;
  linkPreviewHtml?: string;
  showMore?: boolean;
  embeddedIframeHtml?: string;
};

type PostImageLocationFeed = {
  postImageLocation?: string;
  contentType?: number;
  displayName?: string;
};

export type CommentsReplies = {
  postID?: string;
  commentID?: string;
  comment?: string;
  commentDetailHTML?: string;
  shortContent?: string;
  iFrameList?: string[];
  commentMetaDataJson?: string;
  commentLikeCount?: number;
  commentReplyCount?: number;
  commentImageLocationList?: string[];
  commentImageLocation?: string;
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

export type CommentReplyData = {
  postDetailID?: string;
  allCommentsReplies?: GetAllCommentsModel[];
  showAllReplies?: boolean;
  viewType?: CommentType;
};
