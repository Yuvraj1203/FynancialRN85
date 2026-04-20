export type GetFileAndBreadcrumbModel = {
  file?: File;
  breadcrumbPath?: BreadcrumbPath[];
  status?: number;
  message?: string;
};

export type File = {
  id?: string;
  name?: string;
  folderId?: string;
};

export type BreadcrumbPath = {
  id?: string;
  name?: string;
};
