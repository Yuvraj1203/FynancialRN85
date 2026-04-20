import {UseMutationResult} from '@tanstack/react-query';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  GestureResponderEvent,
  LogBox,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {TextInput} from 'react-native-paper';

import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {t} from 'i18next';
import {EMessageType} from '../../common/models/enums/message-type';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {IAgentInfo} from '../../common/models/interfaces/agent-info';
import {IBotSuggestion} from '../../common/models/interfaces/bot-suggestion';
import {ICoordinates} from '../../common/models/interfaces/coordinates';
import {ICreateChatPayload} from '../../common/models/interfaces/create-chat-payload';
import {ICreateChatResponse} from '../../common/models/interfaces/create-chat-response';
import {IUploadFileData} from '../../common/models/interfaces/upload-file-data';
import {IUploadFileToChatPayload} from '../../common/models/interfaces/upload-file-to-chat-payload';
import {IUploadFileToChatResponse} from '../../common/models/interfaces/upload-file-to-chat-response';
import {IAgentsContext, useAgents} from '../../contexts/AgentsProvider';
import {IAskChatContext, useAskChat} from '../../contexts/AskChatProvider';
import {ISnackbarContext, useSnackbar} from '../../contexts/SnackbarProvider';
import useCreateChat from '../../hooks/useCreateChat';
import useUploadFileToChat from '../../hooks/useUploadFileToChat';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import {transformToChatHistoryMessage} from '../../utils/transformToChatHistoryMessage';
import DefaultPromptPanel from '../DefaultPromptPanel';
import FileCard from '../FileCard';
import FileUploadMenu from '../FileUploadMenu';
import SendMessageButton from '../SendMessageButton';

// Ignore the warning about the TextInput.Icon component for react-native-paper 5.12.3
LogBox.ignoreLogs([
  'Warning: TextInput.Icon: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

const MAX_INPUT_HEIGHT = Platform.OS === 'android' ? 21 * 10 : 22 * 10;

const ChatScreenFooter: React.FC = props => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const [inputText, setInputText] = useState<string>('');
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [menuAnchor, setMenuAnchor] = useState<ICoordinates>({x: 0, y: 0});
  const [selectedFile, setSelectedFile] = useState<IUploadFileData | null>(
    null,
  );
  const {showSnackbar}: ISnackbarContext = useSnackbar();

  const {listOfAgentsQuery}: IAgentsContext = useAgents();
  const {selectedAgent, selectedChat, setSelectedChat, addChatMessage, syncChatMessages} =
    useChatStore((state: IChatState) => ({
      selectedAgent: state.selectedAgent,
      selectedChat: state.selectedChat,
      setSelectedChat: state.setSelectedChat,
      addChatMessage: state.addChatMessage,
      syncChatMessages: state.syncChatMessages,
    }));
  const {
    askChat,
    isMessageGenerating,
    isMessageStreaming,
    closeConnection,
  }: IAskChatContext = useAskChat();
  const createChatMutation: UseMutationResult<
    ICreateChatResponse,
    Error,
    ICreateChatPayload
  > = useCreateChat();

  const uploadFileMutation: UseMutationResult<
    IUploadFileToChatResponse,
    Error,
    IUploadFileToChatPayload
  > = useUploadFileToChat();

  const prevSelectedChatRef = useRef<string | null>(selectedChat);

  useEffect(() => {
    if (!prevSelectedChatRef.current) {
      prevSelectedChatRef.current = selectedChat;
      return;
    }

    prevSelectedChatRef.current = selectedChat;
    setInputText('');
    setSelectedFile(null);
    if (isMessageGenerating || isMessageStreaming) {
      closeConnection();
    }
  }, [selectedChat]);

  const botSuggestion: [] | IBotSuggestion[] | undefined = useMemo(
    () =>
      listOfAgentsQuery.data?.find(
        (agent: IAgentInfo) => agent.id === selectedAgent,
      )?.botSuggestion,
    [listOfAgentsQuery.data, selectedAgent],
  );

  const isPromptPanelVisible: boolean = !!(
    selectedAgent &&
    botSuggestion?.length &&
    !selectedChat &&
    !(createChatMutation.isPending || isMessageGenerating || isMessageStreaming)
  );

  const handleAttachFileMenuOpen = (event: GestureResponderEvent) => {
    const {pageX, pageY} = event.nativeEvent;
    setMenuAnchor({x: pageX - 10, y: pageY - 100});
    setIsMenuVisible(true);
  };
  const handleAttachFileMenuClose = () => setIsMenuVisible(false);

  const handleRemoveFile = () => setSelectedFile(null);

  const handleAskChat = async (promptText: string, selectedChatId: string) => {
    syncChatMessages([]);
    addChatMessage(
      transformToChatHistoryMessage({
        id: `${Date.now()}-user`,
        text: promptText,
        messageType: EMessageType.User,
      }),
    );

    await askChat(selectedChatId, promptText);

    setInputText('');
  };

  const handleUploadFile = async (
    file: IUploadFileData,
    selectedChatId: string,
  ) => {
    console.log('Uploading file:', file); // Log the file object

    const formData: FormData = new FormData();
    formData.append(file.name, file);
    console.log('FormData prepared:', formData); // Log the formData object to check its contents

    await uploadFileMutation.mutateAsync({file: formData, selectedChatId});

    setSelectedFile(null);
  };

  const handleAskChatPress = async (
    defaultPromptText?: string,
  ): Promise<void> => {
    if (isMessageStreaming || isMessageGenerating) {
      closeConnection(selectedChat ?? undefined);
      return;
    }

    const prompt: string = defaultPromptText || inputText;
    const file: IUploadFileData | null = selectedFile;

    let chatId: string | null = selectedChat;

    if (!selectedAgent || !prompt) return;

    try {
      if (!chatId) {
        const createdChat: ICreateChatResponse =
          await createChatMutation.mutateAsync({
            title: prompt,
            agentId: selectedAgent,
            metadata: [],
          });
        chatId = createdChat.id;

        setSelectedChat(chatId);
      }

      if (!chatId) throw new Error('No chat ID available');

      if (file) {
        await handleUploadFile(file, chatId);
      }

      if (prompt) await handleAskChat(prompt, chatId);
    } catch (error) {
      setSelectedFile(null);
      setInputText('');
      showSnackbar(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
        ESnackbarTypes.Error,
      );
    }
  };

  return (
    <View style={styles.footerContainer}>
      {isPromptPanelVisible && !selectedFile && (
        <DefaultPromptPanel
          botSuggestion={botSuggestion}
          handleAskChat={handleAskChatPress}
        />
      )}
      {selectedFile && (
        <View style={styles.fileCardContainer}>
          <FileCard
            selectedFile={selectedFile}
            handleRemoveFile={handleRemoveFile}
            isRemoveFileDisabled={uploadFileMutation.isPending}
          />
        </View>
      )}
      <View style={styles.footer}>
        {/* <Tap
          onPress={() => {
            console.log('hi', props.openHistory);
            props.setOpenHistory(!props.openHistory);
          }}>
          <View style={styles.iconContainer}>
            <CustomImage
              source={Images.history}
              type={ImageType.svg}
              color={theme.colors.surface}
              style={styles.historyicon}
            />
          </View>
        </Tap> */}
        <TextInput
          mode={'outlined'}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('Message')}
          multiline={true}
          numberOfLines={1}
          scrollEnabled={true}
          textAlignVertical={'top'}
          dense={true}
          left={
            <TextInput.Icon
              size={22}
              icon={'paperclip'}
              onPress={handleAttachFileMenuOpen}
              disabled={!!selectedFile}
            />
          }
          style={styles.input}
          outlineStyle={styles.outlinedInput}
          contentStyle={styles.inputContent}
          theme={{
            colors: {
              text: theme.colors.onSurface,
              placeholder: theme.colors.onSurface,
              outline: theme.colors.onSurface,
              primary: theme.colors.onSurface,
            },
          }}
        />
        <FileUploadMenu
          isMenuVisible={isMenuVisible}
          handleAttachFileMenuClose={handleAttachFileMenuClose}
          menuAnchor={menuAnchor}
          setSelectedFile={setSelectedFile}
        />
        <SendMessageButton
          handleAskChatPress={handleAskChatPress}
          isLoading={
            uploadFileMutation.isPending || createChatMutation.isPending
          }
          isDisabled={
            (!!selectedFile && !inputText) ||
            uploadFileMutation.isPending ||
            createChatMutation.isPending
          }
        />
      </View>
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    footerContainer: {
      flexDirection: 'column',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 0,
      marginVertical: 0,
    },
    iconContainer: {
      marginRight: 2,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      height: 47,
      width: 47,
      borderRadius: 30,
    },
    // input: {
    //   flex: 1,
    //   marginRight: 10,
    //   maxHeight: MAX_INPUT_HEIGHT,
    // },
    // inputContent: {
    //   marginVertical: 'auto',
    //   ...(Platform.OS === 'android' && {paddingTop: 14, paddingBottom: 10}),
    // },
    // outlinedInput: {
    //   borderRadius: 14,
    //   maxHeight: MAX_INPUT_HEIGHT,
    // },
    fileCardContainer: {
      marginHorizontal: 10,
      marginBottom: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      marginHorizontal: 0,
      marginBottom: 0,
    },
    addIconLay: {
      paddingVertical: 0,
      justifyContent: 'flex-end',
    },

    input: {
      flex: 1,
      marginRight: 0,
      maxHeight: MAX_INPUT_HEIGHT,
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 5,
    },
    messageInput: {
      width: '100%',
    },
    outlinedInput: {
      borderRadius: 14,
      maxHeight: MAX_INPUT_HEIGHT,
    },
    inputContent: {textAlignVertical: 'center'},

    historyicon: {
      height: 25,
      width: 25,
    },
  });

export default ChatScreenFooter;
