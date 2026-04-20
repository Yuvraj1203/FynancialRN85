export type GetAccountsModel = {
  totalCount: number;
  items: GetAccountsItemType[];
};

export type GetAccountsItemType = {
  account_key: number;
  account_name: string;
  type: string;
  institution: string;
  account_number: string;
  owner: string;
  balance: string;
  status: string;
  last_updated?: string;
  inception_date: string;
  message?: string;
};
