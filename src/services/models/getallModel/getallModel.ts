type SupportCategoryModel = {
  categoryFor?: number;
  name?: string;
  allowCreateTicket?: boolean;
  message?: string;
  id?: number;
};

export type ItemsArray = {
  supportCategory?: SupportCategoryModel;
  businessName?: string;
  email?: string;
  phone?: string;
  saveMessage?: string;
};

export type GetAllModel = {
  totalCount?: number;
  items?: Array<ItemsArray>;
};
