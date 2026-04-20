export type GetAccountTransactionsModel = {
  totalCount: number;
  items: GetAccountTransactionsItemsType[];
};

export type GetAccountTransactionsItemsType = {
  security_name: string;
  ticker: string;
  type: string;
  quantity: string;
  unit_price: string;
  amount: string;
  currency: string;
  custodian: string;
  status: string;
  transaction_date: string;
};
