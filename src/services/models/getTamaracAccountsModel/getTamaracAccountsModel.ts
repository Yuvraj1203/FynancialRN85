export type GetTamaracAccountsModel = {
  accountlist?: Accountlist[];
  totalvalue?: string;
  status?: number;
  message?: string;
  appDate?: string;
};

export type Accountlist = {
  accountName?: string;
  value?: string;
};
