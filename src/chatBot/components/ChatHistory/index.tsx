import { FlashList, FlashListRef, ListRenderItem } from '@shopify/flash-list';
import { UseQueryResult } from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { CustomImage, CustomText, SkeletonList, Tap } from '@/components/atoms';
import { CustomFullScreenPopup } from '@/components/molecules';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { useTranslation } from 'react-i18next';
import { EMessageType } from '../../common/models/enums/message-type';

import { IChatInfo } from '@/chatBot/common/models/interfaces/chat-info';
import { IAgentsContext, useAgents } from '@/chatBot/contexts/AgentsProvider';
import useListOfChats from '@/chatBot/hooks/useListOfChats';
import {
  groupChatsByDate,
  ListOfChatsItemInfo,
} from '@/chatBot/utils/groupChatsByDate';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import Log from '@/utils/logger';
import {
  IChatHistory,
  IChatHistoryMessage,
} from '../../common/models/interfaces/chat-history';
import { IAskChatContext, useAskChat } from '../../contexts/AskChatProvider';
import useChatHistory from '../../hooks/useChatHistory';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import ChatCard from '../ChatCard';
import ScrollToBottomButton from '../ScrollToBottomButton';
import TypingText from '../TypingText';

const OFFSET_Y = 800;
const { width, height } = Dimensions.get('window');

type Props = {
  openHistory: boolean;
  setOpenHistory: (value: boolean) => void;
};

const ChatHistory: React.FC<Props> = props => {
  //added by shivang
  const { setSelectedAgent, setSelectedChat, syncChatMessages, selectedAgent } =
    useChatStore((state: IChatState) => ({
      setSelectedAgent: state.setSelectedAgent,
      setSelectedChat: state.setSelectedChat,
      syncChatMessages: state.syncChatMessages,
      selectedAgent: state.selectedAgent,
    }));
  const listOfChatsQuery: UseQueryResult<IChatInfo[]> = useListOfChats();
  const { listOfAgentsQuery }: IAgentsContext = useAgents();
  const [templateLoading, setTemplateLoading] = useState(false);
  const navigation = useAppNavigation();
  /**
   * Added by  @Shivang 02-04-25 -> Initializing theme hook (FYN-4065 )
   */
  const theme = useTheme();
  /**
   * Added by  @Shivang 02-04-25 -> Creating styles using theme (FYN-4065 )
   */
  const styles = makeStyles(theme);
  /**
   * Added by  @Shivang 02-04-25 -> Initializing translation hook (FYN-4065 )
   */
  const { t } = useTranslation();

  const formattedData = listOfChatsQuery.data
    ? groupChatsByDate(listOfChatsQuery.data)
    : [];

  //ended
  const [isFlashListMounted, setFlashListMounted] = useState<boolean>(false);
  const [isScrollToBottomVisible, setScrollToBottomVisible] =
    useState<boolean>(false);
  const flashListRef = useRef<FlashListRef<IChatHistoryMessage>>(null);

  const { selectedChat, chatMessages } = useChatStore((state: IChatState) => ({
    chatMessages: state.chatMessages,
    selectedChat: state.selectedChat,
  }));
  const { isMessageStreaming, isMessageGenerating }: IAskChatContext =
    useAskChat();

  const {
    data: chatHistoryData,
    isLoading: isChatHistoryLoading,
  }: UseQueryResult<IChatHistory> = useChatHistory();

  const historyMessages: IChatHistoryMessage[] = useMemo(
    () =>
      chatHistoryData?.messages?.filter(
        msg => msg.messageType !== EMessageType.System,
      ) ?? [],
    [chatHistoryData?.messages],
  );

  const staticMessages: IChatHistoryMessage[] = useMemo(() => {
    const olderStreamingMessages: IChatHistoryMessage[] =
      chatMessages.length > 1 ? chatMessages.slice(0, -1) : [];

    return [...historyMessages, ...olderStreamingMessages];
  }, [historyMessages, chatMessages]);

  const streamingMessage: IChatHistoryMessage | null =
    chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

  const allMessages: IChatHistoryMessage[] = streamingMessage
    ? [...staticMessages, streamingMessage]
    : staticMessages;

  Log('allMessages=>' + JSON.stringify(allMessages));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > OFFSET_Y && !isScrollToBottomVisible)
      setScrollToBottomVisible(false);
    if (offsetY <= OFFSET_Y && isScrollToBottomVisible)
      setScrollToBottomVisible(true);
  };

  const scrollToBottom = useCallback(() => {
    if (flashListRef.current && isFlashListMounted)
      flashListRef.current.scrollToIndex({
        index: 0,
        animated: true,
      });
  }, [isFlashListMounted, flashListRef]);

  useEffect(() => {
    if (chatMessages.length === 1) scrollToBottom();
  }, [chatMessages.length]);

  useEffect(() => {
    setScrollToBottomVisible(false);
  }, [selectedChat]);

  // Once the server query returns data that includes the last streamed AI message,
  // clear the Zustand chatMessages (they would duplicate historyMessages otherwise).
  useEffect(() => {
    if (isMessageGenerating || isMessageStreaming || chatMessages.length === 0)
      return;
    const lastAiMsg = [...chatMessages]
      .reverse()
      .find(m => m.messageType === EMessageType.AI);
    if (lastAiMsg && historyMessages.some(m => m.id === lastAiMsg.id)) {
      syncChatMessages([]);
    }
  }, [historyMessages, isMessageGenerating, isMessageStreaming]);

  //added by shivang
  useEffect(() => {
    if (selectedAgent && listOfChatsQuery.refetch) {
      listOfChatsQuery.refetch();
    }
  }, [props.openHistory, selectedAgent, listOfChatsQuery.refetch]);

  // useEffect(() => {
  //   console.log('Agent value ---', selectedAgent);
  //   if (selectedAgent) {
  //     listOfChatsQuery.refetch();
  //   }
  // }, [props.openHistory]);

  const handleSelectChat = (chatId: string, agentId: string) => {
    setSelectedChat(chatId);
    setSelectedAgent(agentId);
    syncChatMessages([]);
    props.setOpenHistory(false); //added by shivang
  };

  function setShown(value: boolean): void {
    throw new Error('Function not implemented.');
  }
  const renderFlashListItem: ListRenderItem<ListOfChatsItemInfo> = ({
    item,
  }) => {
    if ('type' in item && item.type === 'header') {
      return (
        <View style={styles.groupTitle}>
          <CustomText variant={TextVariants.bodyMedium}>
            {item.label}
          </CustomText>
        </View>
      );
    }

    const chatItem = item as IChatInfo;
    return (
      <Tap
        style={styles.chatItem}
        onPress={() => handleSelectChat(chatItem.id, chatItem.botID)}
      >
        <CustomText
          style={styles.chatText}
          maxLines={1}
          ellipsis={TextEllipsis.tail}
        >
          {chatItem.title}
        </CustomText>
      </Tap>
    );
  };

  const renderListEmptyComponent = () => (
    <View style={styles.centralizedContainer}>
      {listOfChatsQuery.isLoading || listOfChatsQuery.isFetching ? (
        <ActivityIndicator />
      ) : (
        <CustomText>No Chats</CustomText>
      )}
    </View>
  );
  const renderMessage = useCallback(
    ({ item }: { item: IChatHistoryMessage }) => {
      const isUser: boolean = item.messageType === EMessageType.User;
      // remove any complete citations of the form 【...】
      // (incomplete ones will survive until the closing bracket arrives)
      const cleanedText = item.text.replace(/【.*?】/g, '');

      // pass a copy with the cleaned text
      const cleanedItem: IChatHistoryMessage = {
        ...item,
        text: cleanedText,
      };
      return <ChatCard isUser={isUser} messageData={cleanedItem} />;
    },
    [],
  );

  if (isChatHistoryLoading) {
    return (
      <View style={styles.centralizedContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!allMessages.length && !isChatHistoryLoading) {
    return (
      <View style={styles.centralizedContainer}>
        <CustomImage
          source={theme.dark ? Images.FynAIDark : Images.FynAILight}
          style={{ height: 100, width: 100 }}
        />
        {/* <CustomText
          variant={TextVariants.bodyLarge}
          style={styles.emptyChatText}>
          𝙷𝚎𝚕𝚕𝚘 𝙸 𝚊𝚖 𝙵𝚢𝚗!
        </CustomText>
        <CustomText
          variant={TextVariants.bodyLarge}
          style={styles.emptyChatText2}>
          𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?
        </CustomText> */}

        <TypingText
          mode="typing"
          text={'How can I help you today?'}
          speed={100}
          style={styles.emptyChatText}
        />
        {/* <TypingText
          text="𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?"
          speed={100}
          style={styles.emptyChatText}
        /> */}

        <CustomFullScreenPopup
          style={styles.ChatHistoryPopup}
          shown={props.openHistory ? true : false}
          setShown={props.setOpenHistory}
          dismissOnBackPress={!templateLoading}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 10,
              }}
            >
              <CustomText variant={TextVariants.titleLarge}>
                {'Chats'}
              </CustomText>

              <Tap
                style={{ marginHorizontal: 10, alignSelf: 'flex-end' }}
                onPress={() => {
                  props.setOpenHistory(false);
                }}
              >
                <CustomImage
                  source={Images.close}
                  type={ImageType.svg}
                  style={styles.closeIcon}
                  color={theme.colors.onSurfaceVariant}
                />
              </Tap>
            </View>
            {templateLoading ? (
              <SkeletonList
                count={3}
                children={
                  <View style={styles.skeletonMain}>
                    <View style={styles.skeletonNameLay}>
                      <View style={styles.nameSkel}></View>
                      <View style={styles.dateSkel}></View>
                    </View>
                    <View style={styles.descriptionSkeleton}></View>
                    <View style={styles.descriptionSkeleton1}></View>
                  </View>
                }
              />
            ) : (
              formattedData && (
                <View style={styles.templateListPopUp}>
                  <FlashList
                    data={formattedData}
                    keyExtractor={(chat: ListOfChatsItemInfo): string =>
                      'title' in chat && 'botID' in chat
                        ? `${chat.id}-${chat.title}-${chat.botID}`
                        : `${chat.label}`
                    }
                    renderItem={renderFlashListItem}
                    ListEmptyComponent={renderListEmptyComponent}
                  />
                </View>
              )
            )}
          </View>
        </CustomFullScreenPopup>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        showsVerticalScrollIndicator={false}
        data={[...allMessages]}
        renderItem={renderMessage}
        keyExtractor={(item: IChatHistoryMessage) => item.id}
        contentContainerStyle={styles.chatList}
        drawDistance={800}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        scrollEnabled={!isMessageGenerating}
        onLayout={() => setFlashListMounted(true)}
        onScroll={handleScroll}
        keyboardDismissMode={'on-drag'}
        ListFooterComponent={
          isMessageGenerating && !isMessageStreaming ? (
            <CustomText>Loading...</CustomText>
          ) : null
        }
      />
      <ScrollToBottomButton
        scrollToBottom={scrollToBottom}
        isScrollToBottomVisible={isScrollToBottomVisible}
      />

      <CustomFullScreenPopup
        style={styles.ChatHistoryPopup}
        shown={props.openHistory ? true : false}
        setShown={props.setOpenHistory}
        dismissOnBackPress={!templateLoading}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
            }}
          >
            <CustomText variant={TextVariants.titleLarge}>{'Chats'}</CustomText>

            <Tap
              style={{ marginHorizontal: 10, alignSelf: 'flex-end' }}
              onPress={() => {
                props.setOpenHistory(false);
              }}
            >
              <CustomImage
                source={Images.close}
                type={ImageType.svg}
                style={styles.closeIcon}
                color={theme.colors.onSurfaceVariant}
              />
            </Tap>
          </View>
          {templateLoading ? (
            <SkeletonList
              count={3}
              children={
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonNameLay}>
                    <View style={styles.nameSkel}></View>
                    <View style={styles.dateSkel}></View>
                  </View>
                  <View style={styles.descriptionSkeleton}></View>
                  <View style={styles.descriptionSkeleton1}></View>
                </View>
              }
            />
          ) : (
            formattedData && (
              <View style={styles.templateListPopUp}>
                <FlashList
                  data={formattedData}
                  keyExtractor={(chat: ListOfChatsItemInfo): string =>
                    'title' in chat && 'botID' in chat
                      ? `${chat.id}-${chat.title}-${chat.botID}`
                      : `${chat.label}`
                  }
                  renderItem={renderFlashListItem}
                  ListEmptyComponent={renderListEmptyComponent}
                />
              </View>
            )
          )}
        </View>
      </CustomFullScreenPopup>
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 10,
    },
    containerBottomPopup: {
      flex: 1,
      paddingVertical: 10,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: { fontSize: 20, fontWeight: 'bold' },
    chatItem: {
      padding: 10,
      backgroundColor: theme.colors.secondaryContainer,
      marginBottom: 10,
      borderRadius: theme.extraRoundness,
    },
    startNewchat: { alignItems: 'center', flex: 1 },
    chatText: {
      fontSize: 16,
      textAlignVertical: 'center',
    },
    groupTitle: {
      paddingVertical: 10,
    },
    addGroupHeaderBtn: {
      height: Platform.OS === 'ios' ? 32 : 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
      borderWidth: 0.8,
      marginRight: 0,
      padding: 0,
      paddingHorizontal: 12,
    },
    chatList: {
      paddingHorizontal: 10,
    },
    centralizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyChatText: {
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyChatText2: {
      marginTop: 0,
      color: theme.colors.primary,
    },
    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    ChatHistoryPopup: {
      flex: 1,
    },
    skeletonNameLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 120,
      height: 20,
    },
    dateSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 100,
      height: 20,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 10,
      marginTop: 20,
    },
    descriptionSkeleton1: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      marginTop: 10,
    },
    titleLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    templateListPopUp: {
      flex: 1,
      //height: Platform.OS == 'ios' ? height - 50 : height - 50,
      paddingHorizontal: 10,
    },
    closeIcon: { height: 25, width: 25 },
  });

export default ChatHistory;
