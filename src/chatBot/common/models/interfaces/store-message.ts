import { EMessageType } from '../enums/message-type';

export interface IEventMessage {
  messageType: EMessageType;
  text: string;
  id: string;
}
