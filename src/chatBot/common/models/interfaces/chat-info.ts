export interface IChatInfo {
  userID: string;
  botID: string;
  title: string;
  threadID: string;
  vectorStoreID: string | null;
  runID: string;
  ipAddress: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  hasFlag: boolean;
  hasMore: boolean;
  metaData: string[] | null;
  functionCalls: string[] | [];
  currentCost: number | null;
  id: string;
  companyId: string;
  lastUpdated: Date | string;
  createdDate: Date | string;
}
