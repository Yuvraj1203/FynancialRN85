export type GetBDAssetAllocationModel = {
  totalValue?: string;
  extractedDataList?: ExtractedDataList[];
  status?: number;
  message?: string;
  appDate?: string;
};

export type ExtractedDataList = {
  name?: string;
  value?: string;
  valueDecimal?: number;
  percentOfPortfolio?: string;
  colorCode?: string;
};
