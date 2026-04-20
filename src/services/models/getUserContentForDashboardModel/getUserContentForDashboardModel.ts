export type FeaturedItems = {
  contentId?: string;
  documentId?: string;
  contentName?: string;
  description?: string;
  contentType?: string;
  contentExtension?: string;
  contentURL?: string;
  coverImageURL?: string;
  tmpFileName?: string;
  hasNextFlag?: boolean;
  totalCount?: number;
  progress?: string;
  documentTypeName?: string;
};

export type GetUserContentForDashboardModel = {
  totalCount?: number;
  items?: FeaturedItems[];
};
