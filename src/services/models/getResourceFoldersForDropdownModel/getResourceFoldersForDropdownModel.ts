export type GetResourceFoldersForDropdownModel = {
  resourceFolder?: ResourceFolder;
};

export type ResourceFolder = {
  name?: string;
  description?: string;
  resourceCount?: number;
  id?: string;
};
