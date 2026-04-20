export type GetCommentModel = {
  MainPostID?: number;
  PostID?: number;
  PostParentID?: number;
  PostBy?: string;
  ShowDate?: string;
  Content?: string;
  shortContent?: string;
  iFrameList?: string[];
  ListImgVideo?: Array<ListImgVideo>;
  STATUS?: string;
  Likes?: number;
  LIKE_STATUS?: string;
  Comments?: number;
  Owner?: string;
  ProfilePic?: string;
  PostLevel?: number;
  ReplyStatus?: string;
  ReplyData?: Array<GetCommentModel>;
  TagUserID?: string;
  PostByID?: number;
  pagename?: string;
  pageNo?: number;
};

type ListImgVideo = {
  ID?: number;
  ParentID?: number;
  Path?: string;
  Type?: string;
  DocType?: string;
};

// export type ReplyData = {
//   MainPostID?: number;
//   PostID?: number;
//   PostParentID?: number;
//   PostBy?: string;
//   ShowDate?: string;
//   Content?: string;
//   shortContent?: string;
//   iFrameList?: string[];
//   ListImgVideo?: Array<ListImgVideo>;
//   STATUS?: string;
//   Likes?: number;
//   LIKE_STATUS?: string;
//   Comments?: number;
//   Owner?: string;
//   ProfilePic?: string;
//   PostLevel?: number;
//   ReplyStatus?: string;
//   ReplyData?: Array<ReplyData>;
//   TagUserID?: string;
//   PostByID?: number;
//   pagename?: string;
// };
