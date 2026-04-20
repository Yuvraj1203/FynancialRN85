import { IChatHistoryMessage } from '../../common/models/interfaces/chat-history';
import { IEventMessage } from '../../common/models/interfaces/store-message';

export const transformToChatHistoryMessage = (eventData: IEventMessage): IChatHistoryMessage => {
  return {
    messageType: eventData.messageType,
    text: eventData.text,
    id: eventData.id,
    feedback: '',
    fileURL: null,
    fileName: null,
    file64: null,
    fileIds: [],
    citations: [],
  };
};
