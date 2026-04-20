import {
  DrawerActions,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {UseQueryResult} from '@tanstack/react-query';
import React, {useEffect} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  MD3Colors,
  Text,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';

import {IAgentsContext, useAgents} from '@/chatBot/contexts/AgentsProvider';
import {CustomText, Tap} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useTranslation} from 'react-i18next';
import {IChatInfo} from '../../common/models/interfaces/chat-info';
import {MainScreenNavigationProp} from '../../common/models/types/main-screen-navigation-prop';
import useListOfChats from '../../hooks/useListOfChats';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import {
  ListOfChatsItemInfo,
  groupChatsByDate,
} from '../../utils/groupChatsByDate';

const ListOfChatsDrawer: React.FC = () => {
  //const theme: MD3Theme = useTheme();
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const {t} = useTranslation();

  const navigation: MainScreenNavigationProp =
    useNavigation<MainScreenNavigationProp>();
  const navState = useNavigationState(state => state);
  const {setSelectedAgent, setSelectedChat, syncChatMessages, selectedAgent} =
    useChatStore((state: IChatState) => ({
      setSelectedAgent: state.setSelectedAgent,
      setSelectedChat: state.setSelectedChat,
      syncChatMessages: state.syncChatMessages,
      selectedAgent: state.selectedAgent,
    }));

  const listOfChatsQuery: UseQueryResult<IChatInfo[]> = useListOfChats();
  const {listOfAgentsQuery}: IAgentsContext = useAgents();

  const isDrawerOpen: boolean =
    navState?.history?.some(
      (event: any) => event.type === 'drawer' && event.status === 'open',
    ) ?? false;

  useEffect(() => {
    if (isDrawerOpen && selectedAgent && listOfChatsQuery.refetch) {
      listOfChatsQuery.refetch();
    }
  }, [isDrawerOpen, selectedAgent, listOfChatsQuery.refetch]);

  const handleCloseDrawer = () =>
    navigation.dispatch(DrawerActions.closeDrawer());

  const handleSelectChat = (chatId: string, agentId: string) => {
    setSelectedChat(chatId);
    setSelectedAgent(agentId);
    syncChatMessages([]);

    navigation.navigate('Main', {
      screen: 'Chat',
    });

    handleCloseDrawer();
  };

  const handleCreateNewChat = () => {
    setSelectedChat(null);
    setSelectedAgent(listOfAgentsQuery.data?.[0]?.id || null);
    syncChatMessages([]);
    navigation.navigate('Main', {
      screen: 'Chat',
    });
    handleCloseDrawer();
  };

  const renderFlashListItem: ListRenderItem<ListOfChatsItemInfo> = ({item}) => {
    if ('type' in item && item.type === 'header') {
      return (
        <View style={styles.groupTitle}>
          <Text
            variant={'bodyMedium'}
            theme={{
              colors: {
                onSurface: theme.colors.outline,
              },
            }}>
            {item.label}
          </Text>
        </View>
      );
    }

    const chatItem = item as IChatInfo;
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleSelectChat(chatItem.id, chatItem.botID)}>
        <Text style={styles.chatText} numberOfLines={1} ellipsizeMode={'tail'}>
          {chatItem.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderListEmptyComponent = () => (
    <View style={styles.centralizedContainer}>
      {listOfChatsQuery.isLoading || listOfChatsQuery.isFetching ? (
        <ActivityIndicator size={'large'} color={theme.colors.primary} />
      ) : (
        <Text>No Chats</Text>
      )}
    </View>
  );

  const formattedData = listOfChatsQuery.data
    ? groupChatsByDate(listOfChatsQuery.data)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', gap: 72, alignItems: 'center'}}>
          <Text style={styles.headerText}>Chats</Text>
          <Tap
            onPress={handleCreateNewChat}
            style={{
              ...styles.addGroupHeaderBtn,
              borderColor: theme.colors.outline,
              borderRadius: theme.roundness,
              alignItems: 'center',
            }}>
            <CustomText variant={TextVariants.labelLarge}>
              {t('StartNewChat')}
            </CustomText>
          </Tap>
        </View>
        <IconButton
          icon={'close'}
          iconColor={theme.colors.onBackground}
          size={26}
          onPress={handleCloseDrawer}
        />
      </View>
      <FlashList
        data={formattedData}
        keyExtractor={(chat: ListOfChatsItemInfo): string =>
          'title' in chat && 'botID' in chat
            ? `${chat.id}-${chat.title}-${chat.botID}`
            : `${chat.label}`
        }
        renderItem={renderFlashListItem}
        ListEmptyComponent={renderListEmptyComponent}
        estimatedItemSize={400}
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {flex: 1, padding: 20},
    centralizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {fontSize: 20, fontWeight: 'bold'},
    chatItem: {
      padding: 10,
      backgroundColor: MD3Colors.neutral95,
      marginBottom: 10,
      borderRadius: 10,
    },
    startNewchat: {alignItems: 'center', flex: 1},
    chatText: {
      fontSize: 16,
      textAlignVertical: 'center',
    },
    groupTitle: {
      paddingVertical: 8,
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
  });

export default ListOfChatsDrawer;
