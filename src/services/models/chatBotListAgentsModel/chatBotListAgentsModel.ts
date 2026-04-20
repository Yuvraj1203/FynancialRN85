export type BotSuggestion = {
  botID?: string;
  greeting?: string;
  greetingDescription?: null;
  imageName?: null;
  id?: string;
  lastUpdated?: string;
  createdDate?: string;
  version?: string;
  deleted?: boolean;
  updated?: boolean;
  added?: boolean;
};

export type ChatBotListAgentsModel = {
  id?: string;
  name?: string;
  description?: null;
  botSuggestion?: Array<BotSuggestion>;
};
