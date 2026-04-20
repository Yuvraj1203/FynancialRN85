import {
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  ShakeView,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  CustomSegmentedButton,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { SegmentedButtonItem } from '@/components/molecules/customSegmentedButton/customSegmentedButton';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ActionSheetModel,
  GetAllUserActionsModel,
  GetTopAssignedActionModel,
} from '@/services/models';
import { userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  checkIntervalTime,
  formatDate,
  HapticFeedbackTypes,
  hapticTrigger,
  parseDate,
  showSnackbar,
  useBackPressHandler,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Checkbox } from 'react-native-paper';
import { DashBoardProps } from '../dashboard/dashboard';

export type ActionItemListProps = {
  userId?: number;
  fromDashboard?: boolean;
  isActionItemUpdated?: boolean;
};

export type ActionItemListReturnProps = {
  updated?: boolean;
};

function ActionItemList() {
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 14-04-2025 -> get params from parent screen (FYN-5821) */
  const route = useAppRoute('ActionItemList');

  /**  Added by @Ajay 27-02-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Ajay 27-02-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 27-02-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();
  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */

  const signalRStore = useSignalRStore();

  /**  Added by @Ajay 27-02-2025 ---> State for loading indicator (#4213) */
  const [loading, setLoading] = useState(false);

  const [apiLoading, setApiLoading] = useState(false);

  /**  Added by @Ajay 27-02-2025 ---> State for tracking individual action item loading */
  const [actionItemLoading, setActionItemLoading] = useState<number>();

  /**  Added by @Ajay 27-02-2025 ---> State to store list of action items */
  const [actionItems, setActionItems] = useState<GetTopAssignedActionModel[]>(
    [],
  );

  /**  Added by @Ajay 27-02-2025 ---> Retrieve user details from store */
  const userDetails = userStore();

  const [selectedStatus, setSelectedStatus] = useState<SegmentedButtonItem>();

  const [hasMoreData, setHasMoreData] =
    useState(
      true,
    ); /** Added by @Ajay 27-02-2025 ---> State to track if more data is available */

  const [showActionSheet, setShowActionSheet] = useState(false);

  const [selectedActionItem, setSelectedActionItem] =
    useState<GetTopAssignedActionModel>();

  /** Added by @Yuvraj 27-03-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6016)*/
  const { sendDataBack } = useReturnDataContext();

  const isActionItemUpdateRef = useRef(false);

  //back press handler
  useBackPressHandler(() => handleBackPress());

  const { receiveDataBack } = useReturnDataContext();

  /**
   *  Added by @Ajay 27-02-2025 ---> Fetch action items when component mounts or filter changes
   *  This triggers the API to get pending/completed action items
   */
  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      callGetAllUserActionApi();
    }
  }, []);

  /**
    *Added by @Akshita 29-09-25 ---> Function to handle the auto app refresh functionality
    if a new notification received.(#Fyn-8941)*/

  useEffect(() => {
    if (userDetails) {
      const handleFeedRefersh = (data: string) => {
        if (data.toLocaleLowerCase().trim() == 'actionitem') {
          if (userDetails.userDetails) {
            //to get action items
            callGetAllUserActionApi(0, false, true);
          }
        }
      };

      if (signalRStore.notificationType) {
        handleFeedRefersh(signalRStore.notificationType);
      }
    }
  }, [signalRStore.notificationType]);

  //backpress callback
  const handleBackPress = () => {
    if (
      route.params?.fromDashboard &&
      (isActionItemUpdateRef.current || route.params.isActionItemUpdated)
    ) {
      sendDataBack('Dashboard', {
        isActionItemUpdate: true,
      } as DashBoardProps);
    }
    return true;
  };

  receiveDataBack('ActionItemList', (data: ActionItemListReturnProps) => {
    if (data.updated) {
      callGetAllUserActionApi(0, selectedStatus?.value != 'Pending');
    }
  });

  const callGetAllUserActionApi = (
    skipCount?: number,
    status?: boolean,
    isAutoRefreshing?: boolean,
  ) => {
    getAllUserActionApi.mutate({
      UserId: route.params?.userId ?? userDetails.userDetails?.userID,
      Status: status ?? false, // Fetch completed if filter is 'completed', otherwise fetch pending
      SkipCount: skipCount ?? 0,
      isRefresh: isAutoRefreshing ? isAutoRefreshing : false,
    });
  };

  /**
   *  Added by @Ajay 27-02-2025 ---> Function to check if loading is in progress
   *  Returns true if any API call is currently in progress
   */
  const isLoading = () => {
    return apiLoading || actionItemLoading;
  };

  const handleSelectedSegmentedButton = (value: SegmentedButtonItem) => {
    setSelectedStatus(value);

    /** Added by @Tarun 24-03-2025 -> added check to stop multiple api call (FYN-5971) */
    if (selectedStatus != undefined) {
      callGetAllUserActionApi(0, value.value != 'Pending');
    }
  };

  /**
   *  Added by @Ajay 27-02-2025 ---> Handles action item status update prompt
   *  Displays a confirmation popup before updating the item status
   */
  const handleActionItems = (item: GetTopAssignedActionModel) => {
    if (!isLoading()) {
      showAlertPopup({
        title: item.status
          ? t('ActionItemTitlePending')
          : t('ActionItemTitleComplete'),
        msg: item.status
          ? t('ActionItemMsgPending')
          : t('ActionItemMsgComplete'),
        PositiveText: t('Yes'),
        NegativeText: t('No'),
        onPositivePress: () => {
          updateStatusApi.mutate({ Id: item.id, Status: !item.status });
        },
      });
    }
  };

  /**  Added by @Ajay 27-02-2025 ---> Function to load more action items */
  const loadMoreActionItems = () => {
    if (hasMoreData && !apiLoading) {
      callGetAllUserActionApi(
        actionItems.length,
        selectedStatus?.value != 'Pending',
      );
    }
  };

  const handleOptions = () => {
    const menuOptions: ActionSheetModel[] = [];

    if (!selectedActionItem?.status) {
      menuOptions.push({
        title: t('Edit'),
        image: Images.editSquare,
        imageType: ImageType.svg,
        onPress: () => {
          navigation.navigate('AddActionItem', {
            id: selectedActionItem?.id,
            userId: route.params?.userId,
          });
        },
      });

      menuOptions.push({
        title: t('SendReminder'),
        image: Images.notification,
        imageType: ImageType.svg,
        onPress: () => {
          showAlertPopup({
            title: t('SendReminder'),
            msg: t('SendReminderMsg'),
            PositiveText: t('Yes'),
            NegativeText: t('No'),
            onPositivePress: () => {
              sendActionReminderApi.mutate({
                Id: selectedActionItem?.id,
                userid: route.params?.userId,
              });
            },
          });
        },
      });
    }

    menuOptions.push({
      title: t('Delete'),
      image: Images.delete,
      imageType: ImageType.svg,
      titleColor: theme.colors.error,
      imageColor: theme.colors.error,
      onPress: () => {
        showAlertPopup({
          title: t('Delete'),
          msg: t('ActionItemDeleteMsg'),
          PositiveText: t('Yes'),
          NegativeText: t('No'),
          onPositivePress: () => {
            deletActionItemApi.mutate({ Id: selectedActionItem?.id });
          },
        });
      },
    });

    return menuOptions;
  };

  /** Added by @Tarun 24-03-2025 -> Render action item using flash list (FYN-5971) */
  const renderActionItem = (item: GetTopAssignedActionModel) => {
    return (
      <Shadow
        onPress={() => handleActionItems(item)}
        style={[
          styles.actionItemShadow,
          item.status && { backgroundColor: theme.colors.success },
        ]}
      >
        <View style={styles.actionItemLay}>
          {actionItemLoading == item.id ? (
            <ActivityIndicator style={styles.actionItemLoading} />
          ) : (
            <Checkbox.Android
              status={item.status ? 'checked' : 'unchecked'}
              onPress={() => handleActionItems(item)}
            />
          )}
          <View style={styles.actionItemTitleLay}>
            <CustomText
              variant={TextVariants.bodyLarge}
              style={item.status && styles.actionItemTitleComplete}
            >
              {item.title}
            </CustomText>
            <ShakeView
              disable={item.status || !item.pastDueDate}
              stepTime={2000}
            >
              <CustomText
                variant={TextVariants.labelMedium}
                color={
                  item.status || !item.pastDueDate
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.error
                }
              >
                {`${item.status ? t('CompletedDate') : t('DueDate')} : ${
                  item.status ? item.completedDate : item.dueDate
                }`}
              </CustomText>
            </ShakeView>
          </View>
          {route.params?.userId && (
            <Tap
              onPress={() => {
                setSelectedActionItem(item);
                setShowActionSheet(true);
              }}
            >
              <CustomImage
                source={Images.options}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.optionIcon}
              />
            </Tap>
          )}
        </View>
      </Shadow>
    );
  };

  /**
   *  Added by @Ajay 27-02-2025 ---> API call to fetch action items (#4213)
   *  Fetches the user's pending/completed action items from the backend
   */
  const getAllUserActionApi = useMutation({
    mutationFn: async (sendData: Record<string, any>) => {
      return makeRequest<GetAllUserActionsModel>({
        endpoint: ApiConstants.GetAllUserAction,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setApiLoading(true); // api loading true to stop multiple api calls

      if (variables.SkipCount == 0 && !variables.isRefresh) {
        // using page no from variable as it is updating more fast than state

        setLoading(true); // to show skeleton loader
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false); // api loading false

      if (variables.SkipCount == 0) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      // Success Response
      // Extract items safely from API response

      const handleMoreData = (
        totalCount?: number,
        actionItems?: GetTopAssignedActionModel[],
      ) => {
        if (totalCount && actionItems && totalCount > actionItems?.length) {
          setHasMoreData(true);
        } else {
          setHasMoreData(false);
        }
      };

      if (data?.result?.items && data?.result?.items.length > 0) {
        if (variables.SkipCount == 0) {
          const newData: GetTopAssignedActionModel[] = data?.result?.items.map(
            action => {
              const dueDate = action.dueDate
                ? formatDate({
                    date: action.dueDate,
                    parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    returnFormat: 'MMM DD, YYYY',
                  })
                : '';

              const completedDate = action.completedDate
                ? formatDate({
                    date: action.completedDate,
                    parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    returnFormat: 'MMM DD, YYYY',
                  })
                : '';

              const pastDueDate = action.dueDate
                ? checkIntervalTime(
                    parseDate({
                      date: action.dueDate,
                      parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    })?.getTime()!,
                    { days: 1 },
                  )
                : false;

              return {
                ...action,
                dueDate: dueDate,
                pastDueDate: pastDueDate,
                completedDate: completedDate,
              };
            },
          );

          setActionItems([...newData]);
          handleMoreData(data.result.totalCount, [...newData]);
        } else {
          const newData: GetTopAssignedActionModel[] = data?.result?.items?.map(
            action => {
              const dueDate = action.dueDate
                ? formatDate({
                    date: action.dueDate,
                    parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    returnFormat: 'MMM DD, YYYY',
                  })
                : '';

              const completedDate = action.completedDate
                ? formatDate({
                    date: action.completedDate,
                    parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    returnFormat: 'MMM DD, YYYY',
                  })
                : '';

              const pastDueDate = action.dueDate
                ? checkIntervalTime(
                    parseDate({
                      date: action.dueDate,
                      parseFormat: 'DD MMM YYYY hh:mm:ss a',
                    })?.getTime()!,
                    { days: 1 },
                  )
                : false;

              return {
                ...action,
                dueDate: dueDate,
                pastDueDate: pastDueDate,
                completedDate: completedDate,
              };
            },
          );

          setActionItems([...actionItems, ...newData]);
          handleMoreData(data.result.totalCount, [...actionItems, ...newData]);
        }
      } else {
        setHasMoreData(false);
        if (variables.SkipCount == 0) {
          setActionItems([]);
        }
      }
    },
    onError(error, variables, context) {
      setHasMoreData(false);
      if (variables.SkipCount == 0) {
        setActionItems([]);
      }
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  /**
   *  Added by @Ajay 27-02-2025 ---> API call to update action item status (#4213)
   *  This updates the status of an action item (Pending -> Completed or Completed -> Pending)
   */
  const updateStatusApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTopAssignedActionModel[]>({
        endpoint: ApiConstants.UpdateStatus,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setActionItemLoading(
        variables.Id,
      ); /** Show loading indicator for the specific action item */
    },
    onSettled() {
      setActionItemLoading(
        undefined,
      ); /** Hide loading indicator after API call is settled */
    },
    onSuccess(data, variables) {
      if (data.result && data.result.length > 0) {
        const newData: GetTopAssignedActionModel[] = actionItems.filter(
          item => item.id !== variables.Id,
        );
        setActionItems(newData); /** Remove updated item from the list */

        // Trigger haptic effect on action item change
        hapticTrigger(HapticFeedbackTypes.impactHeavy);

        showSnackbar(
          variables.Status ? t('ActionItemCompleted') : t('ActionItemPending'),
          'success',
        );
        isActionItemUpdateRef.current = true;
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  const sendActionReminderApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: `${
          ApiConstants.SendActionReminder
        }${'?'}${new URLSearchParams(sendData).toString()}`,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setActionItemLoading(
        variables.Id,
      ); /** Show loading indicator for the specific action item */
    },
    onSettled() {
      setActionItemLoading(
        undefined,
      ); /** Hide loading indicator after API call is settled */
    },
    onSuccess(data, variables) {
      if (data.result) {
        showSnackbar(t('ReminderSentMsg'), 'success');
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  const deletActionItemApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.DeleteActionItems,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onMutate(variables) {
      setActionItemLoading(
        variables.Id,
      ); /** Show loading indicator for the specific action item */
    },
    onSettled() {
      setActionItemLoading(
        undefined,
      ); /** Hide loading indicator after API call is settled */
    },
    onSuccess(data, variables) {
      if (data.result) {
        setActionItems(prevItems =>
          prevItems.filter(item => item.id !== variables.Id),
        ); /** Remove updated item from the list */

        showSnackbar(t('ActionItemDeletedSuccessfully'), 'success');
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          onBackPress={() => handleBackPress()}
          showBack
          title={t('ActionItems')}
        />

        <CustomSegmentedButton
          items={[
            {
              label: t('Pending'),
              value: 'Pending',
            },
            {
              label: t('Completed'),
              value: 'Completed',
            },
          ]}
          selected={selectedStatus}
          setSelected={handleSelectedSegmentedButton}
          style={styles.segmentedBtn}
        />
        {loading ? (
          <Skeleton>
            <View style={styles.skeletonLay}>
              <View style={styles.mainSkeleton}>
                {[...Array(8).keys()].map((_, index) => (
                  <View
                    key={`action-skeleton-${index}`}
                    style={styles.actionItemLaySkeleton}
                  >
                    <View style={styles.actionItemCheckboxSkeleton} />
                    <View style={styles.actionItemTitleLaySkeleton}>
                      <View style={styles.actionItemTitleSkeleton} />
                      <View style={styles.actionItemDateSkeleton} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Skeleton>
        ) : (
          <CustomFlatList
            data={actionItems}
            extraData={[actionItemLoading, hasMoreData]}
            // keyExtractor={item => item.id!.toString()}
            refreshing={loading}
            onRefresh={() =>
              callGetAllUserActionApi(0, selectedStatus?.value != 'Pending')
            }
            contentContainerStyle={
              actionItems.length == 0 ? styles.featuredFlatList : undefined
            }
            ListEmptyComponent={
              <EmptyView
                style={styles.featuredEmptyContainer}
                label={
                  selectedStatus?.value == 'Pending'
                    ? t('NoPendingActionItems')
                    : t('NoDataToDisplay')
                }
              />
            }
            ListFooterComponent={
              hasMoreData ? <LoadMore /> : <View style={styles.listFooter} />
            }
            onEndReached={loadMoreActionItems}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => renderActionItem(item)}
          />
        )}

        {route.params?.userId && (
          <Tap
            style={styles.fab}
            onPress={() => {
              navigation.navigate('AddActionItem', {
                userId: route.params?.userId,
              });
            }}
          >
            <CustomImage
              source={Images.plus}
              type={ImageType.svg}
              color={theme.colors.surface}
              style={styles.icon}
            />
          </Tap>
        )}

        <CustomActionSheetPoup
          shown={showActionSheet}
          setShown={setShowActionSheet}
          children={handleOptions()}
          hideIcons={false}
        />
      </View>
    </SafeScreen>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    mainSkeleton: {
      width: '100%',
      marginTop: 20,
    },
    actionItemLaySkeleton: {
      width: '100%',
      marginTop: 10,
      padding: 15,
      flexDirection: 'row',
      gap: 10,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'center',
    },
    actionItemCheckboxSkeleton: {
      height: 20,
      width: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionItemTitleLaySkeleton: { width: '100%', gap: 10 },
    actionItemTitleSkeleton: {
      height: 10,
      width: '50%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionItemDateSkeleton: {
      height: 10,
      width: '30%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    featuredFlatList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    featuredEmptyContainer: {
      height: 150,
    },
    actionItemShadow: {
      marginTop: 10,
      marginHorizontal: 13,
      padding: 8,
    },
    actionItemLay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionItemLoading: { padding: 6 },
    actionItemTitleLay: { flex: 1, gap: 2 },
    actionItemTitleComplete: {
      textDecorationStyle: 'solid',
    },
    segmentedBtn: { marginHorizontal: 16 },
    listFooter: {
      height: 20,
    },
    optionIcon: {
      height: 20,
      width: 20,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 50, // size of the button
      height: 50, // size of the button
      backgroundColor: theme.colors.primary, // color of the FAB
      borderRadius: 30, // round button
      justifyContent: 'center', // center the icon
      alignItems: 'center', // center the icon
    },
    icon: {
      width: 27,
      height: 27,
    },
  });

export default ActionItemList;
