import Clipboard from '@react-native-clipboard/clipboard';
import {
  QueryClient,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import React, {memo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {Card, Icon, IconButton} from 'react-native-paper';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {EFeedbackType} from '../../common/models/enums/feedback-type';
import {
  IChatHistory,
  IChatHistoryMessage,
  ICitation,
} from '../../common/models/interfaces/chat-history';
import {ISubmitFeedbackPayload} from '../../common/models/interfaces/submit-feedback-payload';
import {ISubmitFeedbackResponse} from '../../common/models/interfaces/submit-feedback-response';
import {IAskChatContext, useAskChat} from '../../contexts/AskChatProvider';
import {QUERY_KEY as CHAT_HISTORY_QUERY_KEY} from '../../hooks/useChatHistory';
import useSubmitFeedback from '../../hooks/useSubmitFeedback';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import FileCard from '../FileCard';

const ANIMATION_DURATION = 400;
const CHECK_ICON_TIMEOUT = 2000;

interface IChatCardProps {
  isUser: boolean;
  messageData: IChatHistoryMessage;
}

const ChatCard = ({isUser, messageData}: IChatCardProps) => {
  const theme = useTheme();
  /**
   * Added by  @Shivang 02-04-25 -> Creating styles using theme (FYN-4065 )
   */
  const styles = makeStyles(theme);
  const [isCheckIcon, setCheckIcon] = useState<boolean>(false);
  const queryClient: QueryClient = useQueryClient();
  const checkIconOpacity: SharedValue<number> = useSharedValue(0);
  const copyIconOpacity: SharedValue<number> = useSharedValue(1);
  const {selectedChat} = useChatStore((state: IChatState) => ({
    selectedChat: state.selectedChat,
  }));

  const {aiMessageId}: IAskChatContext = useAskChat();

  const submitFeedbackMutation: UseMutationResult<
    ISubmitFeedbackResponse,
    Error,
    ISubmitFeedbackPayload
  > = useSubmitFeedback();

  const checkIconStyle = useAnimatedStyle(() => {
    return {
      opacity: checkIconOpacity.value,
      position: 'absolute',
    };
  });

  const copyIconStyle = useAnimatedStyle(() => {
    return {
      opacity: copyIconOpacity.value,
      position: 'absolute',
    };
  });

  // Extract the last feedback from a comma-separated string of feedback types (e.g., "Like,Dislike,Like")
  const lastFeedback: string | null = messageData.feedback
    ? messageData.feedback
        .slice(messageData.feedback.lastIndexOf(',') + 1)
        .trim()
    : null;
  const isLiked: boolean = lastFeedback === EFeedbackType.Like;
  const isDisliked: boolean = lastFeedback === EFeedbackType.Dislike;

  const isFileVisible: boolean = !isUser && messageData.citations.length > 0;

  const updateChatHistory = (feedback: string) => {
    queryClient.setQueryData(
      [CHAT_HISTORY_QUERY_KEY, selectedChat],
      (oldData: IChatHistory) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((message: IChatHistoryMessage) =>
            message.id === messageData.id ? {...message, feedback} : message,
          ),
        };
      },
    );
  };

  const handleCopyPress = () => {
    if (isCheckIcon) return;

    Clipboard.setString(messageData.text);
    setCheckIcon(true);

    copyIconOpacity.value = withTiming(0, {duration: ANIMATION_DURATION});
    checkIconOpacity.value = withTiming(1, {duration: ANIMATION_DURATION});

    setTimeout(() => {
      checkIconOpacity.value = withTiming(0, {duration: ANIMATION_DURATION});
      copyIconOpacity.value = withTiming(1, {duration: ANIMATION_DURATION});
      setCheckIcon(false);
    }, CHECK_ICON_TIMEOUT);
  };

  const handleFeedbackPress = async (feedback: string) => {
    if (submitFeedbackMutation.isPending || messageData.feedback === feedback)
      return;

    await submitFeedbackMutation.mutateAsync({
      conversationId: selectedChat!,
      messageId: messageData.id,
      feedback,
    });

    updateChatHistory(feedback);
  };

  const getCopyContentIcon = () => (
    <View style={styles.copyIconContainer}>
      <Animated.View style={checkIconStyle}>
        <Icon
          source={'check'}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Animated.View>
      <Animated.View style={copyIconStyle}>
        <Icon
          source={'content-copy'}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Animated.View>
    </View>
  );

  return (
    <>
      {isFileVisible &&
        messageData.citations.map((citation: ICitation) => (
          <View style={styles.attachedFile} key={citation.id}>
            <FileCard
              selectedFile={{
                name: citation.title ? citation.title : 'Document',
                uri: citation.url,
                type: '',
              }}
              isRemoveFileVisible={false}
            />
          </View>
        ))}
      <Card
        mode={'contained'}
        style={[styles.chatCardContainer, !isUser && styles.aiCardTransparent]}>
        <Card.Content style={isUser ? styles.userMessage : styles.aiMessage}>
          {isUser ? (
            <CustomText variant={TextVariants.bodyMedium}>
              {messageData.text}
            </CustomText>
          ) : (
            <Markdown
              style={{
                body: {color: theme.colors.onBackground},
              }}>
              {messageData.text}
            </Markdown>
          )}
        </Card.Content>
        {!isUser && messageData.id !== aiMessageId && (
          <Card.Actions style={styles.aiMessagePanelContainer}>
            <View style={styles.aiMessagePanel}>
              <IconButton
                style={styles.aiMessagePanelButton}
                icon={'thumb-up-outline'}
                iconColor={
                  isLiked ? theme.colors.primary : theme.colors.onBackground
                }
                size={20}
                onPress={() => handleFeedbackPress(EFeedbackType.Like)}
              />
              <IconButton
                style={styles.aiMessagePanelButton}
                icon={'thumb-down-outline'}
                iconColor={
                  isDisliked ? theme.colors.error : theme.colors.onBackground
                }
                size={20}
                onPress={() => handleFeedbackPress(EFeedbackType.Dislike)}
              />
              <IconButton
                style={styles.aiMessagePanelButton}
                icon={getCopyContentIcon}
                size={20}
                onPress={handleCopyPress}
                disabled={isCheckIcon}
              />
            </View>
          </Card.Actions>
        )}
      </Card>
    </>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    chatCardContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      elevation: 0,
    },
    aiCardTransparent: {
      shadowColor: theme.colors.background,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    userMessage: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 16,
      marginTop: 6,

      borderColor: theme.colors.onSurfaceVariant,
    },
    aiMessage: {
      flex: 1,
      width: '100%',
      alignSelf: 'flex-start',
      paddingHorizontal: 0,
    },
    messageContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    aiMessagePanelContainer: {
      paddingTop: 0,
      paddingHorizontal: 0,
    },
    aiMessagePanel: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginLeft: 0,
    },
    aiMessagePanelButton: {
      marginVertical: 0,
      marginHorizontal: 2,
      color: theme.colors.onSurfaceVariant,
    },
    copyIconContainer: {
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachedFile: {
      marginTop: 15,
    },
  });

export default memo(
  ChatCard,
  (prevProps: IChatCardProps, nextProps: IChatCardProps): boolean =>
    prevProps.isUser === nextProps.isUser &&
    prevProps.messageData.id === nextProps.messageData.id &&
    prevProps.messageData.feedback === nextProps.messageData.feedback &&
    prevProps.messageData.text === nextProps.messageData.text &&
    prevProps.messageData.citations.length ===
      nextProps.messageData.citations.length,
);
