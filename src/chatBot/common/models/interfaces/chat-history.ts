import { EMessageType } from '../enums/message-type';

export interface IChatHistory {
  userID: string;
  botID: string;
  title: string;
  threadID: string;
  vectorStoreID: string | null;
  runID: string;
  ipAddress: string;
  hasFlag: boolean;
  hasMore: boolean;
  messages: IChatHistoryMessage[];
  functionCalls: any[];
  currentCost: number | null;
  id: string;
}

export interface ICitation {
  content: string | null;
  title: string;
  filepath: string;
  url: string;
  chunk_id: string | null;
  id: string;
  companyId: string;
  lastUpdated: Date;
  createdDate: Date;
}

export interface IChatHistoryMessage {
  feedback: string | null;
  id: string;
  messageType: EMessageType;
  text: string;
  fileURL: string | null;
  fileName: string | null;
  file64: string | null;
  fileIds: string[];
  citations: ICitation[];
}
