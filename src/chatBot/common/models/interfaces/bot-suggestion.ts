export interface IBotSuggestion {
  botID: string;
  greeting: string;
  imageName: string | null;
  id: string;
  lastUpdated: Date;
  createdDate: Date;
  version: string;
  deleted: boolean;
  updated: boolean;
  added: boolean;
}
