import { ChatBotMessages } from '../chatBotGetConversationModel/chatBotConversationModel';

export type CurrentCost = {
  botID?: string;
  conversationID?: string;
  userID?: string;
  botName?: string;
  date?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  additionalCost?: number;
  promptCost?: number;
  completionCost?: number;
  totalCost?: number;
  id?: string;
  companyId?: string;
  lastUpdated?: string;
  createdDate?: string;
};

export type CreateConversationModel = {
  id?: string;
  userID?: string;
  botID?: string;
  title?: string;
  threadID?: string;
  vectorStoreID?: null;
  runID?: null;
  ipAddress?: null;
  hasFlag?: null;
  hasMore?: boolean;
  removedFromHistory?: boolean;
  messages?: Array<ChatBotMessages>;
  functionCalls?: [];
  currentCost?: CurrentCost;
};
