import {
  CustomFlatList,
  CustomText,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomHeader, LoadMore } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import {
  HttpMethodApi,
  makeRequestWithoutBaseModel,
} from '@/services/apiInstance';
import { ChatBotGetConversationsModel } from '@/services/models';
import useChatBotAccessTokenStore from '@/store/chatBotAccessTokenStore/chatBotAccessTokenStore';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  handleGoBack,
  useAppNavigation,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { showSnackbar } from '@/utils/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ChatBotScreenReturnProps } from './chatBotScreen';

enum DateSection {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Last7Days = 'Last 7 Days',
  Last30Days = 'Last 30 Days',
  ThisYear = 'This Year',
  Earlier = 'Earlier',
}

const groupByDate = (
  items: ChatBotGetConversationsModel[],
): (string | ChatBotGetConversationsModel)[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const groups: Record<DateSection, ChatBotGetConversationsModel[]> = {
    [DateSection.Today]: [],
    [DateSection.Yesterday]: [],
    [DateSection.Last7Days]: [],
    [DateSection.Last30Days]: [],
    [DateSection.ThisYear]: [],
    [DateSection.Earlier]: [],
  };

  for (const item of items) {
    if (!item.lastUpdated) continue;
    const d = new Date(item.lastUpdated);
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemDay >= today) {
      groups[DateSection.Today].push(item);
    } else if (itemDay >= yesterday) {
      groups[DateSection.Yesterday].push(item);
    } else if (itemDay >= last7Days) {
      groups[DateSection.Last7Days].push(item);
    } else if (itemDay >= last30Days) {
      groups[DateSection.Last30Days].push(item);
    } else if (itemDay >= thisYear) {
      groups[DateSection.ThisYear].push(item);
    } else {
      groups[DateSection.Earlier].push(item);
    }
  }

  const result: (string | ChatBotGetConversationsModel)[] = [];
  for (const section of Object.values(DateSection)) {
    if (groups[section].length > 0) {
      result.push(section, ...groups[section]);
    }
  }
  return result;
};

const PAGE_SIZE = 50;

const HistoryScreen = () => {
  const navigation = useAppNavigation();

  const { t } = useTranslation();

  const theme = useTheme();

  const styles = makeStyles(theme);

  const accesstoken = useChatBotAccessTokenStore(state => state.accesstoken);

  const { sendDataBack } = useReturnDataContext();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['GetConversations', accesstoken?.access_token],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return makeRequestWithoutBaseModel<ChatBotGetConversationsModel[]>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: ApiConstants.GetConversations,
        method: HttpMethodApi.Get,
        data: { results: PAGE_SIZE, skip: pageParam },
        headers: { Authorization: `Bearer ${accesstoken?.access_token}` },
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned items, the next skip = all items fetched so far
      if (lastPage && lastPage.length > 0) {
        return allPages.flat().length;
      }
      return undefined; // no more pages
    },
    throwOnError: error => {
      showSnackbar(error.message, 'danger');
      return false;
    },
  });

  // Flatten all pages and group by date for rendering
  const historyData = groupByDate(data?.pages.flat() ?? []);

  const loadMoreActionItems = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFlashListItem = ({
    item,
  }: {
    item: string | ChatBotGetConversationsModel;
  }) => {
    if (typeof item === 'string') {
      return (
        <View style={styles.groupTitle}>
          <CustomText variant={TextVariants.bodyMedium}>{item}</CustomText>
        </View>
      );
    }

    return (
      <Tap
        style={styles.chatItem}
        onPress={() => {
          sendDataBack('ChatBotScreen', {
            convId: item.id,
            botId: item.botID,
          } as ChatBotScreenReturnProps);

          handleGoBack(navigation);
        }}
      >
        <CustomText
          style={styles.chatText}
          maxLines={1}
          ellipsis={TextEllipsis.tail}
        >
          {item.title}
        </CustomText>
      </Tap>
    );
  };

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader showBack title={t('Chats')} />
        {isLoading ? (
          <SkeletonList
            count={7}
            children={
              <View style={styles.skeletonMain}>
                <View style={styles.nameSkel}></View>
                <View style={styles.descriptionSkeleton}></View>
              </View>
            }
          />
        ) : (
          <View style={styles.templateListPopUp}>
            <CustomFlatList
              data={historyData}
              renderItem={renderFlashListItem}
              ListEmptyComponent={
                <View style={styles.centralizedContainer}>
                  <CustomText>{t('NoChats')}</CustomText>
                </View>
              }
              refreshing={isRefetching}
              onRefresh={refetch}
              ListFooterComponent={hasNextPage ? <LoadMore /> : <View />}
              onEndReached={loadMoreActionItems}
              onEndReachedThreshold={0.5}
            />
          </View>
        )}
      </View>
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
    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 120,
      height: 20,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '80%',
      height: 15,
      marginTop: 20,
    },
    templateListPopUp: {
      flex: 1,
    },
    centralizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupTitle: {
      padding: 10,
    },
    chatItem: {
      marginHorizontal: 10,
      padding: 10,
      backgroundColor: theme.colors.secondaryContainer,
      marginBottom: 10,
      borderRadius: theme.roundness,
    },
    chatText: {
      fontSize: 16,
      textAlignVertical: 'center',
    },
    listFooter: {
      height: 20,
    },
  });

export default HistoryScreen;
