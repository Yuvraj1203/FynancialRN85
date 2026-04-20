export type GetFoldersForUsersModel = {
  combinedItems: CombinedItem[];
};

export type CombinedItem = {
  isFolder?: boolean;
  id?: string;
  name?: string;
  addedBy?: any;
  folderAddedBy?: string;
  createdDateFormatted?: string;
  creationTime?: string;
  coverImageURL?: any;
  isShared?: boolean;
  location?: any;
  fileType?: any;
  progress?: string;
  selected?: boolean;
  permittedToContact?: boolean;
};
