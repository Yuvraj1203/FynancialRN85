import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { RootStackParamList } from '../../common/models/types/root-stack-param-list';
import ChatScreenView from './ChatScreenView';

type ChatScreenStackProp = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC<ChatScreenStackProp> = () => {
  return <ChatScreenView />;
};

export default ChatScreen;
