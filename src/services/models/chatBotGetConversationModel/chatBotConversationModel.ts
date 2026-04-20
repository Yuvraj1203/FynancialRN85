export type ChatBotMessages = {
  id?: string;
  feedback?: string;
  messageType?: string;
  text?: string;
  fileURL?: null;
  fileName?: null;
  file64?: null;
  fileIds?: [];
  citations?: [];
  like?: boolean;
  dislike?: boolean;
};

export type ChatBotGetConversationModel = {
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
  currentCost?: null;
};
