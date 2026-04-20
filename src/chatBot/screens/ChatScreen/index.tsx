import {StackScreenProps} from '@react-navigation/stack';
import React from 'react';

import {RootStackParamList} from '../../common/models/types/root-stack-param-list';
import ChatScreenView from './ChatScreenView';

type ChatScreenStackProp = StackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC<ChatScreenStackProp> = () => {
  return <ChatScreenView />;
};

export default ChatScreen;
