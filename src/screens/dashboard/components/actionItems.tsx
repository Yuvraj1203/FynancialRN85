import {
  CustomFlatList,
  CustomText,
  Shadow,
  ShakeView,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { EmptyView } from '@/components/molecules';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetTopAssignedActionModel } from '@/services/models';
import { templateStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  checkIntervalTime,
  formatDate,
  HapticFeedbackTypes,
  hapticTrigger,
  parseDate,
  showSnackbar,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Checkbox } from 'react-native-paper';
import { DashBoardProps } from '../dashboard';

const enum DateFormats {
  displayShortMonth = 'MMM DD, YYYY',
  apiFullDate = 'DD MMM YYYY hh:mm:ss a',
}

type Props = {
  loading?: boolean;
  refreshProp?: boolean;
};

function ActionItems(props: Props) {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const templateData = templateStore();

  const userDetails = userStore();
  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */

  const signalRStore = useSignalRStore();
  const isActionItemUpdateRef = useRef(false);

  const [skeletonLoading, setSkeletonLoading] = useState(true); //for action item updation

  const [actionItemLoading, setActionItemLoading] = useState<number>();

  const [actionItems, setActionItems] = useState<GetTopAssignedActionModel[]>(
    [],
  );

  /** Added by @Yuvraj 22-04-2025 ---> send data back to previous screen(FYN-5997) */
  const { receiveDataBack } = useReturnDataContext();

  useEffect(() => {
    if (userDetails.userDetails && props.refreshProp) {
      //to get action items
      getTopAssignedActionApi.mutate({
        apiPayload: {
          UserId: userDetails.userDetails?.userID,
        },
      });
    } else {
      setSkeletonLoading(false);
    }
  }, [props.refreshProp]);

  /**
           *Added by @Akshita 29-09-25 ---> Function to handle the auto app refresh functionality
            if a new notification received.(#Fyn-8941)
            */
  useEffect(() => {
    if (userDetails) {
      const handleFeedRefersh = (data: string) => {
        if (data.toLocaleLowerCase().trim() == 'actionitem') {
          if (userDetails.userDetails) {
            //to get action items
            getTopAssignedActionApi.mutate({
              apiPayload: {
                UserId: userDetails.userDetails?.userID,
              },
              isAutoRefreshing: true,
            });
          }
        }
      };

      if (signalRStore.notificationType) {
        handleFeedRefersh(signalRStore.notificationType);
      }
    }
  }, [signalRStore.notificationType]);

  useEffect(() => {
    if (props.loading) {
      setSkeletonLoading(true);
    }
  }, [props.loading]);

  //receive data back
  receiveDataBack('Dashboard', (data: DashBoardProps) => {
    if (data.isActionItemUpdate) {
      isActionItemUpdateRef.current = false; // reseting update action item ref
      // Added by @Yuvraj 19-03-2025 ---> Updates actionitemlist
      getTopAssignedActionApi.mutate({
        apiPayload: {
          UserId: userDetails.userDetails?.userID,
        },
        individualLoading: true,
      });
    }
  });

  const handleActionItems = (item: GetTopAssignedActionModel) => {
    if (!actionItemLoading || !skeletonLoading) {
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

  /** Added by @Tarun 24-03-2025 -> Render action item using flash list (FYN-5971) */
  const renderActionItem = (item: GetTopAssignedActionModel) => {
    return (
      <Shadow
        onPress={() => handleActionItems(item)}
        style={[
          styles.actionItemShadow,
          item.status && {
            backgroundColor: theme.colors.success,
          },
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
        </View>
      </Shadow>
    );
  };

  // added by @Yuvraj 06-02-2025 --> api call to get featured data (#4063)
  const updateStatusApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTopAssignedActionModel[]>({
        endpoint: ApiConstants.UpdateStatus,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setActionItemLoading(variables.Id);
    },
    onSettled(data, error, variables, context) {
      setActionItemLoading(undefined);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.length > 0) {
        isActionItemUpdateRef.current = true;
        const findIndex = actionItems.findIndex(
          item => item.id == variables.Id,
        );

        const result = data.result?.at(0);

        const updatedActionItem: GetTopAssignedActionModel = {
          ...result,
          dueDate: result?.dueDate
            ? formatDate({
                date: result.dueDate!,
                parseFormat: DateFormats.apiFullDate,
                returnFormat: DateFormats.displayShortMonth,
              })
            : '',
          pastDueDate: result?.dueDate
            ? checkIntervalTime(
                parseDate({
                  date: result.dueDate,
                  parseFormat: DateFormats.apiFullDate,
                })?.getTime()!,
                { days: 1 },
              )
            : false,
          completedDate: result?.completedDate
            ? formatDate({
                date: result.completedDate!,
                parseFormat: DateFormats.apiFullDate,
                returnFormat: DateFormats.displayShortMonth,
              })
            : '',
        };
        if (updatedActionItem) {
          setActionItems(
            actionItems.map((item, i) =>
              i === findIndex ? updatedActionItem : item,
            ),
          );
        }
      }
      // Trigger haptic effect on action item change
      hapticTrigger(HapticFeedbackTypes.impactHeavy);
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  // added by @Yuvraj 06-02-2025 --> api call to get action item data (#4063)
  const getTopAssignedActionApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      individualLoading?: boolean;
      isAutoRefreshing?: boolean;
    }) => {
      return makeRequest<GetTopAssignedActionModel[]>({
        endpoint: ApiConstants.GetTopAssignedAction,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onMutate(variables) {
      if (!variables.isAutoRefreshing) {
        setSkeletonLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      setSkeletonLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.length > 0) {
        const newData: GetTopAssignedActionModel[] = data?.result?.map(
          action => {
            const dueDate = action.dueDate
              ? formatDate({
                  date: action.dueDate,
                  parseFormat: DateFormats.apiFullDate,
                  returnFormat: DateFormats.displayShortMonth,
                })
              : '';

            const pastDueDate = action.dueDate
              ? checkIntervalTime(
                  parseDate({
                    date: action.dueDate,
                    parseFormat: DateFormats.apiFullDate,
                  })?.getTime()!,
                  { days: 1 },
                )
              : false;

            return {
              ...action,
              dueDate: dueDate,
              pastDueDate: pastDueDate,
            };
          },
        );

        setActionItems([...newData]);
      } else {
        setActionItems([]);
      }
    },
    onError(error, variables, context) {
      setActionItems([]);
    },
  });

  return (
    <View
      style={[styles.container, actionItems.length > 1 && { minHeight: 200 }]}
    >
      <Tap
        onPress={() =>
          navigation.navigate('ActionItemList', {
            fromDashboard: true,
            isActionItemUpdated: isActionItemUpdateRef.current,
          })
        }
        style={styles.actionItemTap}
      >
        <View style={styles.titleContainer}>
          <CustomText variant={TextVariants.titleLarge}>
            {t('ActionItems')}
          </CustomText>
          {actionItems?.length! > 0 && (
            <CustomText
              color={theme.colors.primary}
              variant={TextVariants.titleSmall}
            >
              {t('ViewAll')}
            </CustomText>
          )}
        </View>
      </Tap>
      {skeletonLoading ? (
        <SkeletonList style={styles.actionItemSkeleton} count={3}>
          <View key={`dashboard-action`} style={styles.actionItemLaySkeleton}>
            <View style={styles.actionItemCheckboxSkeleton} />
            <View style={styles.actionItemTitleLaySkeleton}>
              <View style={styles.actionItemTitleSkeleton} />
              <View style={styles.actionItemDateSkeleton} />
            </View>
          </View>
        </SkeletonList>
      ) : (
        <CustomFlatList
          data={actionItems}
          extraData={actionItemLoading}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id!.toString()}
          contentContainerStyle={
            actionItems.length == 0 ? styles.flatList : undefined
          }
          ListEmptyComponent={
            <EmptyView
              style={styles.emptyContainer}
              label={t('NoActionItems')}
            />
          }
          renderItem={({ item }) => renderActionItem(item)}
        />
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      margin: 10,
    },
    actionItemShadow: {
      marginTop: 10,
      marginHorizontal: 10,
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
      textDecorationLine: 'line-through',
      textDecorationStyle: 'solid',
    },
    actionItemTap: {
      padding: 0,
      paddingHorizontal: 5,
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
    },
    actionItemSkeleton: {
      marginHorizontal: 10,
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
    flatList: { flexGrow: 1, justifyContent: 'center' },
    emptyContainer: {
      height: 100,
    },
  });

export default ActionItems;
