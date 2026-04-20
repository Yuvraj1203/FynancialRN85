import { CustomText } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader } from '@/components/molecules';
import { HeaderIconProps } from '@/components/molecules/customHeader/customHeader';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showTemplatePopup } from '@/components/template/templatePopup/templatePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetUserActiveTemplateModel } from '@/services/models';
import signalRService from '@/services/signalRService';
import { appStartStore, badgesStore, templateStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
  useTabPress,
} from '@/utils/navigationUtils';
import { formatDate, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import ActionItems from './components/actionItems';
import DashboardReminder from './components/dashboardReminder';
import Featured from './components/featured';
import UpcomingEvents from './components/upcomingEvents';
import DashboardCards from './dashboardCards/dashboardCards';

//for updating action item list
export type DashBoardProps = {
  isActionItemUpdate?: boolean;
  fromNotification?: boolean;
  isNotiCountModified?: boolean;
  remiderItemID?: string;
};

const enum DateFormats {
  parseDateFormat = 'YYYY-MM-DDThh:mm:ss', //used
  displayFullMonth = 'MMMM DD, YYYY', //used
  FullDate = 'YYYY-MM-DDThh:mm:ss.ss',
}

function Dashboard() {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const route = useAppRoute('Dashboard');

  const [loading, setLoading] = useState(false); // loading state // temparorily not available

  const [refreshProp, setRefreshProp] = useState(false);

  const templateData = templateStore();

  const userDetails = userStore();

  const badges = badgesStore(state => state.badges);

  //reminder notification state @Yuvraj --> 20-05-2025
  const [reminderNotication, setReminderNotication] = useState<string>();

  // added by @Tarun 19-02-2025 --> state for selected template (#4063)
  const [selectedTemplate, setSelectedTemplate] = useState<
    GetUserActiveTemplateModel | undefined
  >(templateData?.selectedTemplate);

  const setAppStarted = appStartStore(
    state => state.setAppStartedFromNotification,
  ); // set app started value

  const { receiveDataBack } = useReturnDataContext();

  useEffect(() => {
    if (userDetails.userDetails) {
      //initializeSignalR();
      signalRService.start();
      setAppStarted(true);
      callDashboardApis();
    }
  }, []);

  useEffect(() => {
    if (
      userDetails.userDetails &&
      templateData.templateList &&
      templateData.selectedTemplate?.groupID != selectedTemplate?.groupID
    ) {
      setSelectedTemplate(templateData.selectedTemplate);
      handleRefreshProp();
    }
  }, [templateData.selectedTemplate]);

  useEffect(() => {
    if (userDetails.userDetails != undefined) {
      setHeaderRightIcons();
    }
  }, [userDetails.userDetails, badges]);

  useEffect(() => {
    if (userDetails.userDetails) {
      setHeaderRightIcons();
    }
  }, [templateData.templateList]);

  useTabPress(() => {
    if (userDetails.userDetails) {
      callDashboardApis();
    }
  });

  useEffect(() => {
    if (route?.params && route.params.fromNotification) {
      hideLoader();
      if (route.params.remiderItemID) {
        setTimeout(() => {
          setReminderNotication(route?.params?.remiderItemID);
          navigation.setParams?.({
            fromNotification: undefined,
            remiderItemID: undefined,
          });
        }, 510);
      }
    }
  }, [route?.params?.remiderItemID, route.params?.fromNotification]);

  const handleRefreshProp = () => {
    setRefreshProp(true);

    setTimeout(() => {
      setRefreshProp(false);
    }, 1);
  };

  const callDashboardApis = () => {
    getUserActiveTemplate.mutate({});
  };

  const formatDisplayName = (fullName?: string): string => {
    // Check if the string contains a quoted preferred name
    const preferredMatch = fullName?.match(/"([^"]+)"/);

    if (preferredMatch) {
      const preferredName = preferredMatch[1];

      // Get last name (last word in the string)
      const parts = fullName?.trim().split(/\s+/);
      const lastName = parts?.at(parts.length - 1);

      return `${preferredName} ${lastName}`;
    }

    // If no preferred name, return original
    return fullName ?? '';
  };

  const setHeaderRightIcons = (notificationCount?: number) => {
    const menuOptions: HeaderIconProps[] = [];

    if (templateData.templateList && templateData.templateList?.length > 1) {
      menuOptions.push({
        name: t('SelectExperience'),
        source: Images.myDiary,
        type: ImageType.svg,
        onPress: () => {
          showTemplatePopup();
        },
      });
    }
    menuOptions.push({
      name: t('Notification'),
      source: Images.notification,
      type: ImageType.svg,
      badgeCount: notificationCount ?? badges?.notificationCount,
      onPress: () => navigation.navigate('Notifications'),
    });

    return menuOptions;
  };

  /** Added by @Tarun 17-02-2025 -> api to get all templates user is enrolled in */
  const getUserActiveTemplate = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserActiveTemplateModel[]>({
        endpoint: ApiConstants.GetUserActiveTemplate,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** Added by @Tarun 17-02-2025 -> show skeleton loading */
      setLoading(true);
      //setRefreshProp(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Tarun 17-02-2025 -> hide skeleton loading */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        /** Added by @Tarun 17-02-2025 -> format start date and end date for template */
        const newList = data.result.map(item => ({
          ...item,
          startDate: item.startDate
            ? formatDate({
                date: item.startDate,
                parseFormat: DateFormats.parseDateFormat,
                returnFormat: DateFormats.displayFullMonth,
              })
            : '',
          endDate: item.endDate
            ? formatDate({
                date: item.endDate,
                parseFormat: DateFormats.parseDateFormat,
                returnFormat: DateFormats.displayFullMonth,
              })
            : '',
        }));

        const firstTemplate = newList.at(0);

        const shouldReplace =
          templateData.templateList !== undefined &&
          templateData.selectedTemplate !== undefined;

        if (shouldReplace) {
          const findTemplate = newList.find(
            item =>
              item.groupID?.toLowerCase() ==
              templateData.selectedTemplate?.groupID?.toLowerCase(),
          );

          if (!findTemplate) {
            templateData.setSelectedTemplate(firstTemplate);
            setSelectedTemplate(firstTemplate);
            handleRefreshProp();

            if (newList.length > 1) {
              showTemplatePopup();
            }
          } else {
            setSelectedTemplate(findTemplate);
            handleRefreshProp();
          }

          templateData.setTemplateList(newList);
        } else {
          if (newList.length > 1) {
            showTemplatePopup();
          }
          templateData.setTemplateList(newList);
          templateData.setSelectedTemplate(firstTemplate);
          setSelectedTemplate(firstTemplate);
          handleRefreshProp();
        }

        handleRefreshProp();
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showHamburger
          title={t('Dashboard')}
          rightIcons={setHeaderRightIcons()}
        />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                if (!loading) {
                  callDashboardApis();
                }
              }}
            />
          }
          style={styles.main}
        >
          <View style={styles.main}>
            <CustomText variant={TextVariants.titleLarge} style={styles.name}>
              {`${t('Hi')}${','} ${formatDisplayName(
                userDetails.userDetails?.fullName,
              )}`}
            </CustomText>

            <DashboardCards loading={loading} refreshProp={refreshProp} />
            <ActionItems loading={loading} refreshProp={refreshProp} />
            <UpcomingEvents loading={loading} refreshProp={refreshProp} />
            <Featured loading={loading} refreshProp={refreshProp} />
            <DashboardReminder
              reminderNotication={reminderNotication}
              setReminderNotication={setReminderNotication}
              loading={loading}
              refreshProp={refreshProp}
            />
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    name: {
      marginHorizontal: 20,
      marginVertical: 10,
    },
  });

export default Dashboard;
