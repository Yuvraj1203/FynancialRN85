export type GetAddeparModel = {
  aum?: any;
  aua?: any;
  rorytd?: any;
  rorSinceInception?: any;
  totalValue?: string;
  timePeriod?: any;
  extractedDataList?: ExtractedDataList[];
  colors?: string[];
  status?: number;
  message?: any;
  appDate?: string;
  appId?: string;
};

export type ExtractedDataList = {
  name?: string;
  value?: string;
  valueDecimal?: number;
  percentOfPortfolio?: string;
  colorCode?: string;
};
