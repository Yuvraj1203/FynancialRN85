export type GetListOfDocumentsForFeedModel = {
  totalCount?: number;
  items?: DocumentDetails[];
};
export type DocumentDetails = {
  contentDataId?: string;
  contentURL?: string;
  location?: string;
  documentName?: string;
  documentId?: string;
  documentTypeId?: number;

  postDetailId?: string;
  creationTime?: string; // ISO Date string
  contentType?: string;
  displayName?: string | undefined;
  coverImageURL?: string;
  documentTypeName?: string;
  description?: string | undefined;
  isResourceDeleted?: boolean;
  message?: string;
};
