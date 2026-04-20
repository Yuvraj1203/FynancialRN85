export type GetResourceCategoriesBySessionIdModel = {
  categoryList?: CategoryList[];
  hasNextPage?: boolean;
};

export type CategoryList = {
  resourceCategoryID?: string;
  categoryTypeId?: number;
  link?: string;
  categoryID?: number;
  categoryName?: string;
  description?: string;
  categoryImageURL?: string;
  hideCategoryName?: boolean;
};
