import { QueryClient, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import React, {
  Context,
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import EventSource, { CustomEvent, EventSourceOptions } from 'react-native-sse';

import Log from '@/utils/logger';
import { SEND_MESSAGE_URI } from '../../common/consts/urls';
import { EMessageType } from '../../common/models/enums/message-type';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';
import { QUERY_KEY as CHAT_HISTORY_QUERY_KEY } from '../../hooks/useChatHistory';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import { transformToChatHistoryMessage } from '../../utils/transformToChatHistoryMessage';
import { useAuth } from '../AuthProvider';
import { ISnackbarContext, useSnackbar } from '../SnackbarProvider';

type CustomEvents =
  | 'thread.run.queued'
  | 'thread.run.in_progress'
  | 'thread.run.step.created'
  | 'thread.run.step.in_progress'
  | 'thread.message.created'
  | 'thread.message.in_progress'
  | 'thread.message.delta'
  | 'thread.message.completed'
  | 'thread.message.incomplete'
  | 'thread.run.step.completed'
  | 'thread.run.completed'
  | 'done';

export interface IAskChatContext {
  askChat: (conversationID: string, text: string) => Promise<void>;
  isMessageGenerating: boolean;
  isMessageStreaming: boolean;
  messageError: string | null;
  closeConnection: (selectedConversationId?: string) => void;
  aiMessageId: string | null;
}

const AskChatContext: Context<IAskChatContext | undefined> = createContext<
  IAskChatContext | undefined
>(undefined);

export const AskChatProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const { accessToken } = useAuth();
  const [isMessageGenerating, setMessageGenerating] = useState<boolean>(false);
  const [isMessageStreaming, setMessageStreaming] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const esRef: MutableRefObject<EventSource | null> =
    useRef<EventSource | null>(null);
  const currentAiMessageIdRef: MutableRefObject<string | null> = useRef<
    string | null
  >(null);
  const streamedMessageRef: MutableRefObject<string | null> =
    useRef<string>('');
  const streamStartedRef: MutableRefObject<boolean> = useRef<boolean>(false);
  const { showSnackbar }: ISnackbarContext = useSnackbar();
  const queryClient: QueryClient = useQueryClient();

  const { updateChatMessage, addChatMessage } = useChatStore(
    (state: IChatState) => ({
      updateChatMessage: state.updateChatMessage,
      addChatMessage: state.addChatMessage,
    }),
  );

  useEffect(() => {
    return () => closeConnection();
  }, []);

  const closeConnection = useCallback((selectedConversationId?: string) => {
    console.log('closeConnection');
    if (esRef.current) {
      esRef.current.removeAllEventListeners();
      esRef.current.close();
      esRef.current = null;
    }
    currentAiMessageIdRef.current = null;
    streamedMessageRef.current = '';
    setMessageError(null);
    setMessageGenerating(false);
    setMessageStreaming(false);
    addChatMessageDebounce.cancel();
    updateChatMessageDebounce.cancel();

    if (selectedConversationId) {
      refetchChatHistory(selectedConversationId);
    }
  }, []);

  const refetchChatHistory = debounce(
    async (selectedConversationId: string) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: [CHAT_HISTORY_QUERY_KEY, selectedConversationId],
        });
      } catch {
        showSnackbar('Failed to fetch chat history', ESnackbarTypes.Error);
      }
    },
    300,
  );

  const addChatMessageDebounce = debounce(() => {
    addChatMessage(
      transformToChatHistoryMessage({
        id: currentAiMessageIdRef.current!,
        text: streamedMessageRef.current!,
        messageType: EMessageType.AI,
      }),
    );
  }, 0);

  const updateChatMessageDebounce = debounce(() => {
    updateChatMessage({
      id: currentAiMessageIdRef.current!,
      text: streamedMessageRef.current!,
      messageType: EMessageType.AI,
    });
  }, 0);

  const askChat = useCallback(
    async (conversationID: string, text: string) => {
      setMessageError(null);
      setMessageGenerating(true);
      setMessageStreaming(false);
      esRef.current = null;
      currentAiMessageIdRef.current = null;
      streamedMessageRef.current = '';
      streamStartedRef.current = false;

      const options: EventSourceOptions = {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ conversationID, text }),
        timeout: 30000,
        timeoutBeforeConnection: 0,
      };
      Log('sse config=>' + JSON.stringify(options));

      try {
        const es = new EventSource<CustomEvents>(SEND_MESSAGE_URI, options);
        esRef.current = es;

        es.addEventListener('open', () => {
          console.log('SSE: Connection opened');
        });

        es.addEventListener(
          'thread.message.created',
          (event: CustomEvent<'thread.message.created'>) => {
            const data = JSON.parse(event.data || '{}');
            const serverMessageId = data.id;

            if (serverMessageId && !currentAiMessageIdRef.current) {
              currentAiMessageIdRef.current = serverMessageId;
              addChatMessage(
                transformToChatHistoryMessage({
                  id: serverMessageId,
                  text: '',
                  messageType: EMessageType.AI,
                }),
              );
              console.log('SSE: Message created with ID', serverMessageId);
            }
          },
        );

        es.addEventListener(
          'thread.message.delta',
          (event: CustomEvent<'thread.message.delta'>) => {
            const data: string | null = event.data;
            console.log('row DATA', data);

            if (!data) return;

            try {
              const parsedData = JSON.parse(data);

              if (parsedData.delta?.content) {
                setMessageStreaming(true);
                streamStartedRef.current = true;
                streamedMessageRef.current +=
                  parsedData.delta.content[0].text.value;

                let aiMessageId: string | null = currentAiMessageIdRef.current;

                if (!aiMessageId) {
                  currentAiMessageIdRef.current = `temp-ai-${Date.now()}`;

                  addChatMessageDebounce();

                  console.log('SSE: Created temp message with ID', aiMessageId);
                } else {
                  updateChatMessageDebounce();

                  console.log('SSE: Updated message with ID', aiMessageId);
                }
              }
            } catch (e) {
              console.log('Non json Data', data, e);
            }
          },
        );

        es.addEventListener('done', () => {
          console.log('SSE done');
          closeConnection(conversationID);
        });

        es.addEventListener(
          'thread.message.incomplete',
          (event: CustomEvent<'thread.message.incomplete'>) => {
            const data = JSON.parse(event.data || '{}');
            if (data.incomplete_details.reason === 'max_tokens') {
              showSnackbar(
                'Generated message is too long. Please try again.',
                ESnackbarTypes.Error,
              );
            } else {
              showSnackbar(
                data.incomplete_details.reason,
                ESnackbarTypes.Error,
              );
            }
          },
        );

        es.addEventListener('error', (event: any) => {
          if (!streamStartedRef.current) {
            showSnackbar(
              'Failed to send message. Please try again.',
              ESnackbarTypes.Error,
            );
            setMessageError(event.message || 'SSE error occurred');
          }
          closeConnection(conversationID);
        });
      } catch (error) {
        showSnackbar(
          'Failed to send message. Please try again.',
          ESnackbarTypes.Error,
        );
        setMessageError(
          error instanceof Error ? error.message : 'Failed to connect',
        );
        setMessageGenerating(false);
        setMessageStreaming(false);
      }
    },
    [closeConnection, updateChatMessageDebounce, addChatMessageDebounce],
  );

  const values: IAskChatContext = useMemo(
    () => ({
      askChat,
      isMessageGenerating,
      isMessageStreaming,
      messageError,
      closeConnection: closeConnection,
      aiMessageId: currentAiMessageIdRef.current,
    }),
    [
      askChat,
      isMessageGenerating,
      isMessageStreaming,
      messageError,
      closeConnection,
      currentAiMessageIdRef.current,
    ],
  );

  return (
    <AskChatContext.Provider value={values}>{children}</AskChatContext.Provider>
  );
};

export const useAskChat = (): IAskChatContext => {
  const context: IAskChatContext | undefined = useContext(AskChatContext);
  if (!context) {
    throw new Error('useAskChat must be used within an AskChatProvider');
  }
  return context;
};
