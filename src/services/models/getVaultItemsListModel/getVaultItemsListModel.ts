export type GetVaultItemsListModel = {
  itemList?: VaultItemList[];
  totalFilesandFoldersCount?: number;
  status?: number;
  message?: string;
};

export type VaultItemList = {
  id?: string;
  type?: string;
  name?: string;
  parentPath?: string;
  fileType?: string;
  fileLoader?: boolean;
};

export type VaultTamaracItemList = {
  itemList?: VaultItemList[];
  totalFilesandFoldersCount?: number;
  status?: number;
  message?: string;
  id?: string;
  parentPath?: string;
  folderId?: number;
  fileId?: number;
  fileType?: string;
  type?: string;
  name?: string;
  fileLoader?: boolean;
  progress?: string;
};
