import {
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  Skeleton,
  SkeletonList,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomBottomPopup, EmptyView } from '@/components/molecules';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetUserProgramSessionRemindersModel } from '@/services/models';
import { templateStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  reminderNotication?: string;
  setReminderNotication: (value: string | undefined) => void;
  loading?: boolean;
  refreshProp?: boolean;
};

function DashboardReminder(props: Props) {
  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const templateData = templateStore();

  const userDetails = userStore();

  const [reminderLoading, setReminderLoading] = useState(true); // for Reminder

  // added by @Yuvraj 27-02-2025 --> bottom popup toggle state for today's reminder  (#4064)
  const [reminderBottomPopup, setReminderBottomPopup] = useState(false);
  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */

  const signalRStore = useSignalRStore();
  // added by @Yuvraj 27-02-2025 --> state for today's reminder data (#4064)
  const [reminderList, setReminderList] = useState<
    GetUserProgramSessionRemindersModel[]
  >([]);

  // added by @Yuvraj 27-02-2025 --> bottom popup state for today's reminder data (#4064)
  const [reminderItem, setReminderItem] =
    useState<GetUserProgramSessionRemindersModel>();

  useEffect(() => {
    if (props.reminderNotication && userDetails.userDetails) {
      setReminderItem(undefined);
      getReminderByIdApi.mutate({ ReminderId: props.reminderNotication });
    }
  }, [props.reminderNotication]);

  /**
    *Added by @Akshita 29-09-25 ---> Function to handle the auto app refresh functionality
    if a new notification received.(#Fyn-8941)*/
  useEffect(() => {
    if (userDetails) {
      const handleFeedRefersh = (data: string) => {
        if (data.toLocaleLowerCase().trim() == 'reminder') {
          if (userDetails.userDetails) {
            //get reminders

            getUserProgramSessionRemindersApi.mutate({
              ...(templateData.selectedTemplate?.programTypeID == 0 ||
              templateData.selectedTemplate?.programTypeID == undefined ||
              templateData.selectedTemplate?.programTypeID == null
                ? {}
                : {
                    ProgramSessionId:
                      templateData.selectedTemplate?.programSessionID,
                  }),
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
    if (
      templateData.templateList &&
      templateData.templateList?.length > 0 &&
      userDetails.userDetails &&
      props.refreshProp
    ) {
      //get reminders
      getUserProgramSessionRemindersApi.mutate(
        templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
          ? {}
          : {
              ProgramSessionId: templateData.selectedTemplate?.programSessionID,
            },
      );
    } else {
      setReminderLoading(false);
    }
  }, [templateData.selectedTemplate, props.refreshProp]);

  useEffect(() => {
    if (props.loading) {
      setReminderLoading(true);
    }
  }, [props.loading]);

  /** Added by @Tarun 24-03-2025 -> Render reminder item using flash list (FYN-5971) */
  const renderReminderItem = (item: GetUserProgramSessionRemindersModel) => {
    return (
      <Shadow
        onPress={() => {
          setReminderItem(item);
          setReminderBottomPopup(true);
        }}
        style={styles.reminderItemContainer}
      >
        <View style={styles.reminderItem}>
          <CustomImage
            source={Images.reminder2}
            color={theme.colors.onSurfaceVariant}
            style={styles.reminderIcon}
          />
          <CustomText
            variant={TextVariants.labelLarge}
            style={styles.reminderText}
          >
            {item.title}
          </CustomText>
        </View>
      </Shadow>
    );
  };

  // added by @Yuvraj 27-02-2025 --> api call to get today's reminder data (#4064)
  const getUserProgramSessionRemindersApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserProgramSessionRemindersModel[]>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceReminder
            : ApiConstants.GetCommunityTemplateReminder,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      if (!variables.isAutoRefreshing) {
        setReminderLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      setReminderLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.length > 0) {
        setReminderList(data.result);
      } else {
        setReminderList([]);
      }
    },
    onError(error, variables, context) {
      setReminderList([]);
    },
  });

  // added by @Tarun 05-005-2025 --> api call to get reminder data
  const getReminderByIdApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserProgramSessionRemindersModel>({
        endpoint: ApiConstants.GetReminderById,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setReminderBottomPopup(true);
    },
    onSettled(data, error, variables, context) {
      props.setReminderNotication(undefined);
      if (error) {
        setReminderBottomPopup(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        setReminderItem(data.result);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <CustomText variant={TextVariants.titleLarge}>
          {t('HomeTodayReminder')}
        </CustomText>
      </View>

      <View style={styles.reminderFlatList}>
        {reminderLoading ? (
          <SkeletonList count={4}>
            <View style={styles.skeletonItem}>
              <View style={styles.skeletonIcon}></View>
              <View style={styles.skeletonText}></View>
            </View>
          </SkeletonList>
        ) : (
          <CustomFlatList
            data={reminderList}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => item.id!}
            contentContainerStyle={
              reminderList.length == 0 ? styles.flatList : undefined
            }
            ListEmptyComponent={
              <EmptyView
                style={styles.emptyContainer}
                label={t('HomeNoReminderMessage')}
              />
            }
            renderItem={({ item }) => renderReminderItem(item)}
          />
        )}
      </View>

      <CustomBottomPopup
        shown={reminderBottomPopup}
        setShown={setReminderBottomPopup}
        onClose={() => setReminderItem(undefined)}
        title={
          <View style={styles.reminderInfoPopupTitleContainer}>
            <CustomImage
              source={Images.reminder2}
              color={theme.colors.onSurfaceVariant}
              style={styles.reminderIcon}
            />
            <CustomText
              style={styles.reminderTitle}
              variant={TextVariants.titleLarge}
            >
              {t('HomeReminder')}
            </CustomText>
          </View>
        }
      >
        {reminderItem ? (
          <CustomText style={styles.reminderInfoPopupText}>
            {reminderItem.title}
          </CustomText>
        ) : (
          <Skeleton>
            <View style={styles.reminderInfoPopupSkeletonContainer}>
              <View style={styles.reminderInfoPopupSkeleton} />
              <View style={styles.reminderInfoPopupSkeleton1} />
              <View style={styles.reminderInfoPopupSkeleton2} />
            </View>
          </Skeleton>
        )}
      </CustomBottomPopup>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      margin: 10,
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15, // because every other section has tap which has 5 padding and inside that the title has 10 padding thats why here 15
    },
    reminderFlatList: {
      marginBottom: 50,
    },
    flatList: { flexGrow: 1, justifyContent: 'center' },
    emptyContainer: {
      height: 100,
    },
    reminderItemContainer: {
      margin: 10,
      padding: 0,
    },
    reminderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    reminderIcon: {
      width: 32,
      height: 32,
    },
    reminderText: {
      padding: 10,
      flex: 1,
    },
    skeletonItem: {
      borderRadius: theme.roundness,
      alignItems: 'center',
      gap: 5,
      flexDirection: 'row',
      marginHorizontal: 10,
      marginVertical: 5,
      padding: 5,
    },
    skeletonIcon: {
      height: 30,
      width: 30,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    skeletonText: {
      height: 30,
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    reminderInfoPopupText: {
      flex: 1,
      marginHorizontal: 20,
      marginBottom: 35,
    },
    reminderInfoPopupTitleContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    reminderInfoPopupSkeletonContainer: {
      width: '100%',
      gap: 10,
      marginBottom: 35,
    },
    reminderInfoPopupSkeleton: {
      backgroundColor: theme.colors.surface,
      height: 25,
      width: '80%',
      marginHorizontal: 20,
      borderRadius: theme.roundness,
    },
    reminderInfoPopupSkeleton1: {
      backgroundColor: theme.colors.surface,
      height: 25,
      width: '60%',
      marginHorizontal: 20,
      borderRadius: theme.roundness,
    },
    reminderInfoPopupSkeleton2: {
      backgroundColor: theme.colors.surface,
      height: 25,
      width: '40%',
      marginHorizontal: 20,
      borderRadius: theme.roundness,
    },
    reminderTitle: {
      marginHorizontal: 5,
    },
  });

export default DashboardReminder;
