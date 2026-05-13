// Bookmark Collection Models (FYN-10455)import { GetFeedPostModel } from '../feedModel/feedModel';

import { GetFeedPostModel } from '../getFeedPostModel/getFeedPostModel';

export type UserCollectionDto = {
  id: string;
  collectionName: string;
  feedCount: number;
  isDefault: boolean;
};

export type BookmarkedFeedIdDto = {
  bookmarkId: string;
  feedDetailId: string;
  collectionId: string | null;
};

export type ToggleCollectionMembershipResult = {
  isInCollection: boolean;
  bookmarkId: string | null;
};

export type BookmarkReturnProp = {
  refreshRequired: boolean;
};

export type BookmarkedPostsResponse = {
  items: GetFeedPostModel[];
  totalCount: number;
};
