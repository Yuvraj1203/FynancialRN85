export type GetAccountHoldingsModel = {
  totalCount: number;
  items: GetAccountHoldingsItemType[];
};

export type GetAccountHoldingsItemType = {
  security_name: string;
  ticker: string;
  quantity: number;
  current_unit_price: string;
  market_value: string;
  percent_of_account: string;
  status: string;
  as_of_date: string;
};
