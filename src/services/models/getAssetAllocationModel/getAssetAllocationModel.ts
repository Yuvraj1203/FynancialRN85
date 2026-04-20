export type ExtractedDataList = {
  name?: string;
  value?: string;
  valueDecimal?: number;
  percentOfPortfolio?: string;
  colorCode?: string;
};

export type GetAssetAllocationModel = {
  totalValue?: string;
  extractedDataList?: ExtractedDataList[];
  status?: number;
  message?: string;
  appDate?: string;
};
