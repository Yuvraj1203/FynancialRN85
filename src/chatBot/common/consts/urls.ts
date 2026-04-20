export const FYNANCIAL_URI = 'https://fynancial.aicrisk.com';
export const GET_FYNANCIAL_CODE_URI = FYNANCIAL_URI + '/api/oauth2';
export const FYNANCIAL_AUTHENTICATE_URI = FYNANCIAL_URI + '/api/oauth2/Token';
export const GET_LIST_OF_CHATS_URI =
  FYNANCIAL_URI + '/api/Chat/GetConversations';
export const GET_LIST_OF_AGENTS_URI = FYNANCIAL_URI + '/api/Chat/ListAgents';
export const SEND_MESSAGE_URI = FYNANCIAL_URI + '/api/Chat/AskAgent';
export const CREATE_CHAT_URI = FYNANCIAL_URI + '/api/Chat/CreateConversation';
export const GET_CHAT_HISTORY_URI =
  FYNANCIAL_URI + '/api/Chat/GetConversation/:conversationId';
export const SUBMIT_FEEDBACK_URI = FYNANCIAL_URI + '/api/Chat/SubmitFeedback';
export const UPLOAD_FILE_TO_CONVERSATION_URI =
  FYNANCIAL_URI + '/api/Chat/AddFileToConversation/:conversationId';
