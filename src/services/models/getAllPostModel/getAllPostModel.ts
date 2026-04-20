export type GetAllPostModel = {
  MainPostList?: Array<PostListModel>;
  PostList?: Array<PostListModel>;
};

export type PostListModel = {
  MainPostID?: number;
  PostBy?: string;
  ShowDate?: string;
  ShowTime?: string;
  Content?: string;
  shortContent?: string;
  iFrameList?: string[];
  ListImgVideo?: Array<ListImgVideoModel>;
  STATUS?: string;
  Likes?: number;
  LIKE_STATUS?: string;
  Comments?: number;
  ProfilePic?: string;
  CommentStatus?: string;
  Owner?: string;
  CreatedBy?: number;
  EnableComment?: string;
  TagUserID?: string;
  PostByID?: number;
  GroupID?: number;
  GroupName?: string;
  SessionName?: string;
  SesstionStartDate?: string;
  URL?: string;
  URLType?: string;
  pageNo?: number;
};

export type ListImgVideoModel = {
  ID?: number;
  ParentID?: number;
  Path?: string;
  Type?: string;
  DocType?: string;
};
