import { IBotSuggestion } from './bot-suggestion';

export interface IAgentInfo {
  id: string;
  name: string;
  description: string;
  botSuggestion?: IBotSuggestion[] | [];
}
