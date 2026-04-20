import { EMessageType } from '../enums/message-type';

export interface IMessage {
  messageType: EMessageType;
  text: string;
  fileURL: string | null;
  fileName: string | null;
  file64: string | null;
  fileIds: string[];
  citations: string[];
  messageId: string | null;
}

export interface ICurrentCost {
  botID: string;
  conversationID: string;
  userID: string;
  botName: string;
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  additionalCost: number;
  promptCost: number;
  completionCost: number;
  totalCost: number;
  id: string;
  companyId: string;
  lastUpdated: string;
  createdDate: string;
}

export interface ICreateChatResponse {
  id: string;
  userID: string;
  botID: string;
  title: string;
  threadID: string;
  vectorStoreID: string | null;
  runID: string | null;
  ipAddress: string | null;
  hasFlag: boolean;
  hasMore: boolean;
  messages: IMessage[];
  functionCalls: any[];
  currentCost: ICurrentCost;
}
