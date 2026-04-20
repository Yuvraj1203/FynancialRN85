export type GetVaultFilesAndFoldersModel = {
  totalCount?: number;
  folderList?: FolderList[];
  fileList?: FileList[];
  status?: number;
  message?: string;
};

export type FolderList = {
  folderId?: number;
  folderName?: string;
  type?: string;
  name?: string;
};

export type FileList = {
  fileId?: number;
  fileName?: string;
  fileType?: string;
  type?: string;
  name?: string;
  fileLoader?: boolean;
  progress?: string;
};

export type TamaracVaultItem = {
  folderId?: number;
  fileId?: number;
  fileType?: string;
  type?: string;
  name?: string;
  fileLoader?: boolean;
  progress?: string;
};
