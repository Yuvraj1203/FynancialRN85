import TypingText from '@/chatBot/components/TypingText';
import {
  CustomFlatList,
  CustomImage,
  CustomText,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomTextInput, FeatureButton } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import {
  HttpMethodApi,
  makeRequestWithoutBaseModel,
} from '@/services/apiInstance';
import {
  ChatBotGetConversationModel,
  ChatBotListAgentsModel,
  ChatBotMessages,
  CreateConversationModel,
} from '@/services/models';
import useChatBotAccessTokenStore from '@/store/chatBotAccessTokenStore/chatBotAccessTokenStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { isEmpty, showSnackbar, useBackPressHandler } from '@/utils/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { DrawerActions } from '@react-navigation/native';
import { FlashListRef } from '@shopify/flash-list';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ActivityIndicator, Banner } from 'react-native-paper';

export enum MessageType {
  User = 'User',
  AI = 'AI',
  System = 'System',
}

export type ChatBotScreenReturnProps = {
  convId?: string;
  botId?: string;
};

const ChatBotScreen = () => {
  const navigation = useAppNavigation();

  const { t } = useTranslation();

  const theme = useTheme();

  const styles = makeStyles(theme);

  const accesstoken = useChatBotAccessTokenStore(state => state.accesstoken);

  const [showAgentsDropDown, setShowAgentsDropDown] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [agentsLoading, setAgentsLoading] = useState(false);

  const [addMsgLoading, setAddMsgLoading] = useState(false);

  const [agentsList, setAgentsList] = useState<ChatBotListAgentsModel[]>([]);

  const [messageList, setMessageList] = useState<ChatBotMessages[]>([]);

  const [selectedAgent, setSelectedAgent] = useState<ChatBotListAgentsModel>();

  const [convId, setConvId] = useState<string>();

  const [message, setMessage] = useState('');

  // ID of the AI message currently being streamed — used to skip Markdown
  // during streaming (plain text is far cheaper to render per frame)
  const [streamingAiId, setStreamingAiId] = useState<string | null>(null);

  const { receiveDataBack } = useReturnDataContext();

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const listRef = useRef<FlashListRef<ChatBotMessages>>(null);
  const displayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useBackPressHandler(() => {
    navigation.goBack();

    return true;
  });

  // Scroll to bottom when a new message is appended.
  // Use a longer delay so FlashList has time to lay out items before we scroll,
  // which prevents the "unable to find viewstate" native crash.
  useEffect(() => {
    if (messageList.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [messageList.length]);

  // Scroll to bottom while AI message streams in
  const lastMsg = messageList[messageList.length - 1];
  useEffect(() => {
    if (lastMsg?.messageType === MessageType.AI) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [lastMsg?.text]);

  useEffect(() => {
    getListAgents.mutate({});
  }, []);

  receiveDataBack('ChatBotScreen', (data: ChatBotScreenReturnProps) => {
    if (data.convId) {
      setConvId(data.convId);
      getConversation.mutate(data.convId);
    }
    if (data.botId) {
      const findAgent = agentsList.find(item => item.id == data.botId);
      setSelectedAgent(findAgent);
    }
  });

  const handleAgentSelect = (agent: ChatBotListAgentsModel) => {
    setSelectedAgent(agent);
    setShowAgentsDropDown(false);
    resetChat();
  };

  const handleSendMessage = (msg: string) => {
    setMessage('');
    if (addMsgLoading) {
      closeConnection();
      return;
    }
    if (!selectedAgent) {
      showSnackbar(t('NoAgentSelected'), 'danger');
      return;
    }
    if (!convId) {
      createConversation.mutate({
        apiPayload: { title: msg, agentId: selectedAgent.id, metadata: [] },
        msg,
      });
    } else {
      listenMessage(convId, msg, true);
    }
  };

  const resetChat = () => {
    closeConnection();
    setMessage('');
    setConvId(undefined);
    setMessageList([]);
  };

  const closeConnection = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
    setStreamingAiId(null);
    setAddMsgLoading(false);
  };

  const listenMessage = (
    conversationId: string,
    prompt: string,
    prependUserMsg = false,
  ) => {
    setAddMsgLoading(true);

    const aiId = `${Date.now()}-ai`;

    // FlashList uses startRenderingFromBottom, so the LAST item renders at the
    // bottom (visible). Append new messages so they appear at the bottom.
    setMessageList(prev => {
      const aiMsg: ChatBotMessages = {
        messageType: MessageType.AI,
        // text intentionally undefined — triggers loading state in renderChatItem
        id: aiId,
        feedback: '',
        fileURL: null,
        fileName: null,
        file64: null,
        fileIds: [],
        citations: [],
      };
      if (!prependUserMsg) {
        return [...prev, aiMsg];
      }
      const userMsg: ChatBotMessages = {
        messageType: MessageType.User,
        text: prompt,
        id: `${Date.now() + 1}-user`,
        feedback: '',
        fileURL: null,
        fileName: null,
        file64: null,
        fileIds: [],
        citations: [],
      };
      return [...prev, userMsg, aiMsg];
    });

    const body = JSON.stringify({
      conversationID: conversationId,
      text: prompt,
    });

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', ApiConstants.AskAgent, true);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader(
      'Authorization',
      `Bearer ${accesstoken?.access_token}`,
    );
    xhr.responseType = 'text';

    setStreamingAiId(aiId);

    let lastLen = 0;
    let lineBuffer = '';
    // Queue of individual characters waiting to be revealed
    const charQueue: string[] = [];
    // Whether the XHR stream has fully finished
    let streamDone = false;

    // Reveal 3 characters every 20 ms (~150 chars/sec).
    // Plain-text rendering during streaming makes this cheap enough to be smooth.
    displayIntervalRef.current = setInterval(() => {
      if (charQueue.length > 0) {
        const ch = charQueue.splice(0, 3).join('');
        setMessageList(prev =>
          prev.map(m =>
            m.id === aiId ? { ...m, text: (m.text ?? '') + ch } : m,
          ),
        );
      } else if (streamDone) {
        // Queue drained and stream finished — switch to Markdown render
        clearInterval(displayIntervalRef.current!);
        displayIntervalRef.current = null;
        xhrRef.current = null;
        setStreamingAiId(null); // triggers Markdown render for this message
        setAddMsgLoading(false);
      }
    }, 40);

    const processChunk = (chunk: string) => {
      lineBuffer += chunk;
      const lines = lineBuffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      lineBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        if (trimmed === '[DONE]') {
          streamDone = true;
          continue;
        }
        try {
          const parsed = JSON.parse(trimmed);
          // UpdateKind 21 = streaming text token — enqueue the whole token
          if (parsed.UpdateKind === 21 && parsed.Text != null) {
            for (const ch of parsed.Text as string) {
              charQueue.push(ch);
            }
          }
        } catch (_) {
          // Incomplete JSON — will be completed with the next chunk
        }
      }
    };

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(lastLen);
      lastLen = xhr.responseText.length;
      processChunk(chunk);
    };

    xhr.onload = () => {
      processChunk('\n'); // flush any remaining buffered line
      streamDone = true; // interval will drain the queue then stop
    };

    xhr.onerror = () => {
      showSnackbar('Failed to send message. Please try again.', 'danger');
      closeConnection();
    };

    xhr.onabort = () => {
      // closeConnection already handles cleanup
    };

    xhr.send(body);
  };

  const getListAgents = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequestWithoutBaseModel<ChatBotListAgentsModel[]>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: ApiConstants.ListAgents,
        method: HttpMethodApi.Get,
        data: sendData,
        headers: { Authorization: `Bearer ${accesstoken?.access_token}` },
      });
    },
    onMutate(variables, context) {
      setAgentsLoading(true);
    },
    onSettled(data, error, variables, onMutateResult, context) {
      setAgentsLoading(false);
    },
    onSuccess(data, variables, context) {
      setAgentsList(data);
      setSelectedAgent(data?.at(0));
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setAgentsList([]);
      setSelectedAgent(undefined);
    },
  });

  const getConversation = useMutation({
    mutationFn: (convId: string) => {
      return makeRequestWithoutBaseModel<ChatBotGetConversationModel>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: `${ApiConstants.GetConversation}${convId}`,
        method: HttpMethodApi.Get,
        data: {},
        headers: { Authorization: `Bearer ${accesstoken?.access_token}` },
        byPassRefresh: true,
      });
    },
    onMutate(variables, context) {
      setIsLoading(true);
    },
    onSettled(data, error, variables, onMutateResult, context) {
      setIsLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.messages) {
        setMessageList(
          data.messages.filter(item => item.messageType !== MessageType.System),
        );
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setMessageList([]);
    },
  });

  const createConversation = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      msg: string;
    }) => {
      return makeRequestWithoutBaseModel<CreateConversationModel>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: ApiConstants.CreateConversation,
        method: HttpMethodApi.Post,
        data: sendData.apiPayload,
        headers: { Authorization: `Bearer ${accesstoken?.access_token}` },
        byPassRefresh: true,
      });
    },
    onMutate(variables, context) {
      setAddMsgLoading(true);
    },
    onSettled(data, error, variables, onMutateResult, context) {
      if (error) {
        setAddMsgLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.id) {
        setConvId(data.id);
        // listenMessage will prepend both the user msg and AI placeholder
        setMessageList([]);
        listenMessage(data.id, variables.msg, true);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setMessageList([]);
    },
  });

  const submitFeedback = useMutation({
    mutationFn: (sendData: {
      convId?: string;
      msgId?: string;
      feedback: string;
    }) => {
      return makeRequestWithoutBaseModel<string>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: `${ApiConstants.SubmitFeedback}?conversationId=${sendData.convId}&messageId=${sendData.msgId}&feedback=${sendData.feedback}`,
        method: HttpMethodApi.Post,
        data: {},
        headers: { Authorization: `Bearer ${accesstoken?.access_token}` },
        byPassRefresh: true,
      });
    },
    onSettled(data, error, variables, onMutateResult, context) {
      if (variables.feedback.includes('Dislike')) {
        setMessageList(prev =>
          prev.map(m =>
            m.id === variables.msgId ? { ...m, dislike: true, like: false } : m,
          ),
        );
      } else if (variables.feedback.includes('Like')) {
        setMessageList(prev =>
          prev.map(m =>
            m.id === variables.msgId ? { ...m, like: true, dislike: false } : m,
          ),
        );
      }
    },
  });

  const renderChatItem = (item: ChatBotMessages) => {
    const isUser: boolean = item.messageType === MessageType.User;
    const isAILoading: boolean = !isUser && item.text === undefined;
    const isStreaming: boolean = item.id === streamingAiId;
    // remove any complete citations of the form 【...】
    const cleanedText = item.text?.replace(/【.*?】/g, '');
    const cleanedItem: ChatBotMessages = { ...item, text: cleanedText };

    // Feature buttons — shown for all settled AI messages and during streaming
    const aiActionButtons = (
      <View style={styles.aiMessagePanel}>
        <FeatureButton
          source={Images.thumbUp}
          color={item.like ? theme.colors.green : theme.colors.onBackground}
          //fillColor={item.like ? theme.colors.green : undefined}
          imageStyle={styles.likeIcon}
          onPress={() => {
            submitFeedback.mutate({
              convId: convId,
              msgId: item.id,
              feedback: 'Like',
            });
          }}
        />
        <FeatureButton
          source={Images.thumbDown}
          color={item.dislike ? theme.colors.danger : theme.colors.onBackground}
          //fillColor={item.dislike ? theme.colors.danger : undefined}
          imageStyle={styles.likeIcon}
          onPress={() => {
            submitFeedback.mutate({
              convId: convId,
              msgId: item.id,
              feedback: 'Dislike',
            });
          }}
        />
        <FeatureButton
          source={Images.copy}
          color={theme.colors.onBackground}
          imageStyle={styles.likeIcon}
          onPress={() => {
            if (cleanedItem.text) {
              Clipboard.setString(cleanedItem.text);
            }
          }}
        />
      </View>
    );

    return (
      <View style={isUser ? styles.chatMain : styles.chatAIMain}>
        <View style={isUser ? styles.chatMainLay : styles.chatAIMain}>
          {isUser ? (
            <CustomText variant={TextVariants.labelMedium}>
              {item.text}
            </CustomText>
          ) : isAILoading ? (
            // Waiting for the first token — show cycling dots
            <View style={styles.loadingMsgContainer}>
              <TypingText
                mode="dots"
                baseText={t('Loading')}
                speed={400}
                style={styles.loadingMsgText}
              />
            </View>
          ) : isStreaming ? (
            // Streaming in progress — plain text avoids Markdown re-parse cost
            // every token update, keeping the animation smooth
            <CustomText variant={TextVariants.labelMedium}>
              {cleanedText}
            </CustomText>
          ) : (
            // Fully received — render rich Markdown
            <>
              <Markdown
                style={{
                  body: { color: theme.colors.onBackground },
                }}
              >
                {cleanedText}
              </Markdown>
              {aiActionButtons}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeScreen bottom={false}>
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            <Tap
              onPress={() => {
                Keyboard.dismiss();
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <CustomImage
                source={Images.drawer}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.headerIcon}
              />
            </Tap>
            <Tap
              onPress={() => {
                if (showAgentsDropDown) {
                  setShowAgentsDropDown(false);
                } else {
                  setShowAgentsDropDown(false);
                  setTimeout(() => {
                    setShowAgentsDropDown(true);
                  }, 100);
                }
              }}
              style={{ flex: 1 }}
            >
              <View style={styles.containerTitle}>
                <CustomText
                  ellipsis={TextEllipsis.tail}
                  maxLines={1}
                  variant={TextVariants.titleLarge}
                  style={styles.title}
                >
                  {selectedAgent?.name ?? t('HeyFyn')}
                </CustomText>

                <View style={{ transform: [{ rotate: '270deg' }] }}>
                  <CustomImage
                    source={Images.back}
                    type={ImageType.svg}
                    color={theme.colors.primary}
                    style={styles.menuItemIcon}
                  />
                </View>
              </View>
            </Tap>

            <Tap
              onPress={() => {
                resetChat();
              }}
            >
              <CustomImage
                source={Images.createChat}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.createChatIcon}
              />
            </Tap>

            <Tap
              onPress={() => {
                navigation.navigate('DrawerRoutes', {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'ChatBotRoutes',
                    params: {
                      screen: 'HistoryScreen',
                    },
                  },
                });
              }}
            >
              <CustomImage
                source={Images.history}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.historyicon}
              />
            </Tap>
          </View>
        </View>
        <Banner
          visible={showAgentsDropDown}
          contentStyle={styles.menu}
          style={styles.menuContainer}
        >
          {agentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.scrollableMenu}>
              <CustomFlatList
                data={agentsList}
                renderItem={({ item: agent }) => (
                  <Tap
                    onPress={() => handleAgentSelect(agent)}
                    style={styles.menuItem}
                  >
                    <CustomText variant={TextVariants.labelLarge}>
                      {agent.name}
                    </CustomText>
                  </Tap>
                )}
              />
            </View>
          )}
        </Banner>

        <View style={{ flex: 1 }}>
          {isLoading ? (
            <SkeletonList
              count={6}
              style={styles.main}
              children={
                <View style={styles.skeletonContainer}>
                  <View style={styles.rightMessage}>
                    <View style={styles.skeletonSubText} />
                    <View style={styles.skeletonSubSubText} />
                  </View>
                  <View style={styles.leftMessage}>
                    <View style={styles.skeletonSubText} />
                    <View style={styles.skeletonSubSubText} />
                  </View>
                </View>
              }
            />
          ) : convId ? (
            <CustomFlatList
              ref={listRef}
              data={messageList}
              inverted={true}
              renderItem={({ item }) => renderChatItem(item)}
            />
          ) : (
            <Tap
              style={styles.main}
              onPress={() => {
                Keyboard.dismiss();
              }}
            >
              <View style={styles.main}>
                <View style={styles.emptyLay}>
                  <CustomImage
                    source={theme.dark ? Images.FynAIDark : Images.FynAILight}
                    style={{ height: 100, width: 100 }}
                  />
                  <TypingText
                    mode="typing"
                    text={t('FynEmptyMsg')}
                    speed={100}
                    style={styles.emptyChatText}
                  />
                </View>

                <CustomFlatList
                  data={selectedAgent?.botSuggestion ?? []}
                  horizontal
                  renderItem={({ item }) => (
                    <Tap
                      key={item.id}
                      onPress={() => {
                        if (item.greeting) {
                          handleSendMessage(item.greeting);
                        }
                      }}
                    >
                      <CustomText
                        style={{
                          borderRadius: theme.roundness,
                          borderWidth: 1,
                          borderColor: theme.colors.outline,
                          padding: 10,
                        }}
                        variant={TextVariants.labelMedium}
                      >
                        {item.greeting}
                      </CustomText>
                    </Tap>
                  )}
                />
              </View>
            </Tap>
          )}

          <View style={styles.inputLay}>
            <CustomTextInput
              text={message}
              onChangeText={(text: string) => {
                setMessage(text);
              }}
              showLabel={false}
              showError={false}
              multiLine={true}
              placeholder={t('Message')}
              style={styles.messageInput}
              contentStyle={{
                marginTop: Platform.OS === 'ios' ? 15 : 0, // Apply marginTop only for iOS
                textAlignVertical: 'center',
                alignContent: 'center',
                marginBottom: Platform.OS === 'ios' ? 10 : 2,
              }}
              height={50}
              borderRadius={theme.roundness}
              maxLines={5}
              prefixIcon={{
                source: Images.attachment,
                type: ImageType.svg,
                tap() {},
              }}
              hidePreview={false}
            />
            <Tap
              onPress={() => {
                if (addMsgLoading) {
                  handleSendMessage(message);
                } else {
                  if (!isEmpty(message)) {
                    handleSendMessage(message);
                  }
                }
              }}
              style={styles.sendIconTap}
            >
              <View style={styles.sendIconLay}>
                <CustomImage
                  source={addMsgLoading ? Images.stop : Images.send}
                  type={ImageType.svg}
                  color={theme.colors.surface}
                  style={styles.send}
                />
              </View>
            </Tap>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    container: {
      height: 45,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    containerTitle: {
      height: 45,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    historyicon: {
      height: 25,
      width: 25,
      marginRight: 10,
    },
    title: {
      fontSize: 17,
      textAlignVertical: 'center',
      textAlign: 'center',
      lineHeight: 40,
      height: 40,
    },
    leftContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      height: 25,
      width: 25,
      marginLeft: 5,
    },
    createChatIcon: {
      height: 35,
      width: 35,
      marginRight: 8,
      marginBottom: 8,
    },
    menuItemIcon: {
      width: 18,
      height: 18,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menu: {
      backgroundColor: theme.colors.surface,
      maxHeight: 200,
      maxWidth: '100%',
      padding: 0,
      borderRadius: theme.roundness,
      borderWidth: 1,
    },
    menuContainer: {
      backgroundColor: theme.colors.surface,
      maxHeight: 200,
      maxWidth: '100%',
      padding: 0,
      borderRadius: theme.roundness,
      marginHorizontal: 60,
    },
    scrollableMenu: {
      height: 190,
      width: '100%',
      backgroundColor: theme.colors.surface,
    },
    menuItem: {
      height: 40,
      padding: 0,
    },
    inputLay: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginHorizontal: 10,
    },
    messageInput: {
      width: '85%',
      marginLeft: 5,
    },
    sendIconTap: {
      position: 'absolute',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.extraRoundness,
      right: 5,
      bottom: 8, // Apply marginTop only for iOS
      alignSelf: 'flex-end',
      height: 35,
      width: 35,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    sendIconLay: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    send: {
      height: 22,
      width: 22,
    },
    aiMessagePanel: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginLeft: 0,
    },
    likeIcon: {
      height: 20,
      width: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? theme.colors.surface
        : theme.colors.onSurfaceVariant,
    },
    chatMain: {
      flex: 1,
      alignItems: 'flex-end',
    },
    chatAIMain: { flex: 1, padding: 5 },
    chatMainLay: {
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: 10,
      maxWidth: '78%',
      minWidth: 0, // Adapts to short text dynamically
      marginHorizontal: 10,
    },
    loadingMsgContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
    },
    loadingMsgText: {
      marginLeft: 8,
      color: theme.colors.onSurfaceVariant,
    },
    emptyChatText: {
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyLay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeletonContainer: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
      marginTop: 10,
    },
    skeletonSubText: {
      backgroundColor: theme.colors.surface,
      width: '60%',
      height: 14,
      borderRadius: theme.roundness,
      marginTop: 15,
      marginHorizontal: 15,
    },
    skeletonSubSubText: {
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 9,
      borderRadius: theme.roundness,
      marginTop: 15,
      marginHorizontal: 15,
    },
    leftMessage: {
      flex: 1,
      alignItems: 'flex-start',
      marginLeft: 10,
    },
    rightMessage: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 10,
    },
  });

export default ChatBotScreen;
