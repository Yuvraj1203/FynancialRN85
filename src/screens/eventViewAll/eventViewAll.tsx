import {
  CustomFlatList,
  CustomImage,
  CustomText,
  LoadingView,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  EmptyView,
  FabGroup,
} from '@/components/molecules';
import { HeaderIconProps } from '@/components/molecules/customHeader/customHeader';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetScheduleTasksForGlobalCalendarModel,
  GetUserProgramSessionEventsModel,
} from '@/services/models';
import { templateStore, userStore } from '@/store';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  useAppNavigation,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  formatDate,
  formatDateUtc,
  formatDateUtcReturnLocalTime,
  getDatesBetween,
  isPastDate,
  parseDateUtc,
  showSnackbar,
  useBackPressHandler,
} from '@/utils/utils';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Theme } from 'react-native-calendars/src/types';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { NavigateScheduleMessageFromEnum } from '../addScheduleMessage/addScheduleMessage';

export type MarkedDatesType = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    disabled?: boolean;
    disableTouchEvent?: boolean;
    customStyles?: {
      container?: Theme;
      text?: Theme;
    };
  };
};

export type AddScheduleUpdateReturnProp = {
  isDetailsUpdated?: boolean;
};

const EventViewAll = () => {
  /** Added by @Yuvraj 05-03-2025 -> navigate to different screen (FYN-5817) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 05-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5817) */
  const theme = useTheme();

  /** Added by @Yuvraj 05-03-2025 -> access StylesSheet with theme implemented (FYN-5817) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 05-03-2025 -> translations for labels (FYN-5817) */
  const { t } = useTranslation();

  /** Added by @Yuvraj 05-03-2025 -> variable for storing userdetails and template details (FYN-5817) */
  const userDetails = userStore();
  const templateData = templateStore();

  /** Added by @Yuvraj 05-03-2025 -> loading state for button (FYN-5817) */
  const [loading, setLoading] = useState(true);

  const [deleteLoadingId, setDeleteLoadingId] = useState<number>();

  /** Added by @Yuvraj 05-03-2025 -> state for calendar isExpanded or not and for gesturehandling (FYN-5817) */
  const [isExpanded, setIsExpanded] = useState(true);

  /** Added by @Yuvraj 05-03-2025 -> state for all events (FYN-5817) */
  const [allEventsData, setAllEventsData] = useState<
    GetUserProgramSessionEventsModel[]
  >([]);

  /** Added by @Yuvraj 03-04-2025 -> state for all events for advisor events (FYN-6256) */
  const [allAdvisorEventsData, setAllAdvisorEventsData] = useState<
    GetScheduleTasksForGlobalCalendarModel[]
  >([]);

  /** Added by @Yuvraj 03-04-2025 -> fab group state floating button (FYN-6256) */
  const [floatingButton, setFloatingButton] = useState(false);

  const isFocused = useIsFocused();

  const [showFabIcon, setShowFabIcon] = useState(true);

  /** Added by @Yuvraj 19-08-2025 -> to close the fabgroup on back (FYN-) */
  useBackPressHandler(() => {
    setFloatingButton(false);
    return true;
  });

  // //collapsing calendar
  // useEffect(() => {
  //   if (floatingButton) {
  //     setIsExpanded(false);
  //   }
  // }, [floatingButton]);

  // fab icon on mounted first time, then unable to unmount on diff screens
  // hide fab from diff screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setShowFabIcon(false);
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setShowFabIcon(true);
      return undefined; // no cleanup needed
    }, []),
  );

  //firttimeflag for extended calendar not gets collapse after api call
  const isFirstTime = useRef(true);

  /** Added by @Yuvraj 03-04-2025 -> fab group state array (FYN-6256) */
  const fabItemsArray = [
    {
      icon: Images.newspaperPng,
      label: t('Post'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddSchedulePost');
      },
    },
    {
      icon: Images.event,
      label: t('Event'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddScheduleEvent');
      },
    },
    {
      icon: Images.reminder2,
      label: t('Reminder'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddScheduleReminder');
      },
    },
    {
      icon: Images.itemList,
      label: t('ActionItem'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddScheduleActionItem');
      },
    },
    {
      icon: Images.faqPng,
      label: t('DirectMessage'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddScheduleMessage');
      },
    },
    {
      icon: Images.faqPng,
      label: t('GroupMessage'),
      onPress: () => {
        setFloatingButton(false);
        navigation.navigate('AddScheduleMessage', {
          navigateFrom: NavigateScheduleMessageFromEnum.groupMessage,
        });
      },
    },
  ];

  /** Added by @Yuvraj 05-03-2025 -> to stop re run of setTimeOut in useEffect
 /** Added by @Yuvraj 05-03-2025 -> state for all marked date (FYN-5817) */
  const [markedData, setMarkedData] = useState<MarkedDatesType>({});

  /** Added by @Yuvraj 29-03-2025 -> state for poping action sheet for edit and delete (FYN-6256) */
  const [showActionSheet, setShowActionSheet] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> storing the item for deletion (FYN-6256) */
  const [selectedItem, setSelectedItem] =
    useState<GetScheduleTasksForGlobalCalendarModel>();

  const enum DateFormats {
    Date = 'YYYY-MM-DD',
    FullDate = 'YYYY-MM-DDTHH:mm:ss',
    ApiUTCDate = 'DD MMM YYYY hh:mm A',
    UIDate = 'MMM DD, YYYY',
    UITime = 'hh:mm A',
    Year = 'YYYY',
  }

  const currentLocalDate = useRef(
    formatDate({ date: new Date(), returnFormat: DateFormats.Date }),
  );

  /** Added by @Yuvraj 05-03-2025 -> selected date (FYN-5817) */
  const [selectedDate, setSelectedDate] = useState(currentLocalDate.current);

  /** Added by @Yuvraj 05-03-2025 -> visible month (FYN-5817) */
  const [visibleMonth, setVisibleMonth] = useState(currentLocalDate.current);

  /** Added by @Yuvraj 05-03-2025 ->initial api calling to get all events data of month (FYN-5817)
   * setTimeout is used because expandable calendar as both useEffect and calendar are clashing
   */
  useEffect(() => {
    if (userDetails.userDetails) {
      onRefresh();
    }
  }, []);

  const onRefresh = () => {
    if (
      userDetails.userDetails?.isAdvisor ||
      (templateData?.templateList && templateData?.templateList.length > 0)
    ) {
      getAllEvents({
        startDate: `${formatDateUtc({
          date: new Date(new Date().getFullYear(), 0, 1),
          returnFormat: DateFormats.FullDate,
        })}`,
        endDate: `${formatDateUtc({
          date: new Date(new Date().getFullYear(), 11, 31),
          returnFormat: DateFormats.FullDate,
        })}`,
        forEventDots: true,
        firstTime: true,
      });
    } else {
      setLoading(false);
    }
  };

  /** Added by @Yuvraj 19-03-2025 ---> send data back to previous screen(FYN-5997) */
  const { receiveDataBack } = useReturnDataContext();

  receiveDataBack('EventViewAll', (data: AddScheduleUpdateReturnProp) => {
    if (data.isDetailsUpdated) {
      onRefresh();
    }
  });

  /** Added by @Yuvraj 05-03-2025 -> to check the status of event (FYN-5817) */
  const statusFinder = (strStartDate: string, strEndDate: string) => {
    const currentDateStatus = new Date().getTime();
    const startingDate = new Date(
      formatDateUtcReturnLocalTime({
        date: strStartDate,
        parseFormat: DateFormats.ApiUTCDate,
        returnFormat: DateFormats.FullDate,
      }),
    ).getTime();
    const endingDate = new Date(
      formatDateUtcReturnLocalTime({
        date: strEndDate,
        parseFormat: DateFormats.ApiUTCDate,
        returnFormat: DateFormats.FullDate,
      }),
    ).getTime();

    if (endingDate < currentDateStatus) {
      return { message: t('Expired'), color: theme.colors.error };
    } else if (startingDate > currentDateStatus) {
      return { message: t('Upcoming'), color: '#ea921c' };
    } else {
      return { message: t('Ongoing'), color: '#0c8820' };
    }
  };

  const filterEventData = (items: GetUserProgramSessionEventsModel[]) => {
    /** Added by @Yuvraj 05-03-2025 -> to sort the result tiles in right order (FYN-5218) */
    const order = [t('Ongoing'), t('Upcoming'), t('Expired')]; // Define order
    return items
      .map(item => {
        const statusInfo = statusFinder(item.strStartDate!, item.strEndDate!);
        const appStartDate = formatDateUtcReturnLocalTime({
          date: item.strStartDate!,
          parseFormat: DateFormats.ApiUTCDate,
          returnFormat: DateFormats.UIDate,
        });
        const appEndDate = formatDateUtcReturnLocalTime({
          date: item.strEndDate!,
          parseFormat: DateFormats.ApiUTCDate,
          returnFormat: DateFormats.UIDate,
        });

        const appStartTime = formatDateUtcReturnLocalTime({
          date: item.strStartDate!,
          parseFormat: DateFormats.ApiUTCDate,
          returnFormat: DateFormats.UITime,
        });
        const appEndTime = formatDateUtcReturnLocalTime({
          date: item.strEndDate!,
          parseFormat: DateFormats.ApiUTCDate,
          returnFormat: DateFormats.UITime,
        });

        return {
          ...item,
          status: statusInfo.message,
          statusColor: statusInfo.color,
          appStartDate,
          appStartTime,
          appEndDate,
          appEndTime,
          sameDayEvent: appStartDate == appEndDate,
          description:
            item.eventType == 4
              ? item.description?.replace(/<[^>]+>/g, '').trim()
              : item.description, // remove HTML tags,
        };
      })
      .sort((a, b) => {
        const indexA =
          order.indexOf(a.status) !== -1 ? order.indexOf(a.status) : Infinity;
        const indexB =
          order.indexOf(b.status) !== -1 ? order.indexOf(b.status) : Infinity;
        return indexA - indexB;
      });
  };

  const filterScheduleData = (
    items: GetScheduleTasksForGlobalCalendarModel[],
  ) => {
    /** Added by @Yuvraj 05-03-2025 -> to sort the result tiles in right order (FYN-5218) */
    const order = [t('Ongoing'), t('Upcoming'), t('Expired')]; // Define order
    return items
      .map(item => {
        const statusInfo = statusFinder(
          item.event_Start_Date!,
          item.event_End_Date!,
        );
        const appStartDate = formatDateUtcReturnLocalTime({
          date: item.event_Start_Date!,
          parseFormat: DateFormats.FullDate,
          returnFormat: DateFormats.UIDate,
        });
        const appEndDate = formatDateUtcReturnLocalTime({
          date: item.event_End_Date!,
          parseFormat: DateFormats.FullDate,
          returnFormat: DateFormats.UIDate,
        });

        const appStartTime = formatDateUtcReturnLocalTime({
          date: item.event_Start_Time!,
          parseFormat: DateFormats.FullDate,
          returnFormat: DateFormats.UITime,
        });
        const appEndTime = formatDateUtcReturnLocalTime({
          date: item.event_End_Time!,
          parseFormat: DateFormats.FullDate,
          returnFormat: DateFormats.UITime,
        });

        return {
          ...item,
          status: statusInfo.message,
          statusColor: statusInfo.color,
          appStartDate,
          appStartTime,
          appEndDate,
          appEndTime,
          sameDayEvent: appStartDate == appEndDate,
          isPastDate: isPastDate({
            date:
              item.scheduleTaskTypeId == 2
                ? item.event_End_Date!
                : item.event_Start_Date!,
            parseFormat: DateFormats.FullDate,
          }),
        };
      })
      .sort((a, b) => {
        const indexA =
          order.indexOf(a.status) !== -1 ? order.indexOf(a.status) : Infinity;
        const indexB =
          order.indexOf(b.status) !== -1 ? order.indexOf(b.status) : Infinity;
        return indexA - indexB;
      });
  };

  /** Added by @Yuvraj 05-03-2025 -> header notification icon (FYN-5817) */
  const setHeaderRightIcons = () => {
    const menuOptions: HeaderIconProps[] = [];

    menuOptions.push({
      name: t('Today'),
      source: Images.todayCalendar,
      type: ImageType.svg,
      onPress: () => {
        if (selectedDate != currentLocalDate.current) {
          handleDateChange(currentLocalDate.current);
        }
      },
    });

    return menuOptions;
  };

  /** Added by @Yuvraj 05-03-2025 -> function to call api (FYN-5817) */
  const getAllEvents = ({
    startDate,
    endDate,
    forEventDots,
    firstTime,
  }: {
    startDate: string;
    endDate: string;
    forEventDots?: boolean;
    firstTime?: boolean;
  }) => {
    if (userDetails.userDetails?.isAdvisor) {
      GetScheduleTasksForGlobalCalendarApi.mutate({
        Startdate: startDate,
        Enddate: endDate,
        forEventDots: forEventDots,
        firstTime: firstTime,
      });
    } else {
      getEventsForUserApi.mutate({
        apiPayLoad: {
          ...(templateData?.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? {}
            : {
                ProgramSessionId:
                  templateData?.selectedTemplate?.programSessionID,
              }),
          Startdate: startDate,
          Enddate: endDate,
        },
        forEventDots: forEventDots,
        firstTime: firstTime,
      });
    }
  };
  /** Added by @Yuvraj 05-03-2025 -> handle month change (FYN-5817) */
  const handleMonthChange = (date?: DateData) => {
    Log('Monthchange=>' + date?.dateString);
    if (date) {
      const oldYear = formatDate({
        date: visibleMonth,
        parseFormat: DateFormats.Date,
        returnFormat: DateFormats.Year,
      });
      const newYear = formatDate({
        date: date.dateString,
        parseFormat: DateFormats.Date,
        returnFormat: DateFormats.Year,
      });

      setVisibleMonth(date.dateString);

      if (newYear !== oldYear) {
        const year = dayjs(date.dateString, DateFormats.Date).year();

        const yearStart = dayjs
          .utc(`${year}-01-01T00:00:00`)
          .format(DateFormats.FullDate);
        const yearEnd = dayjs
          .utc(`${year}-12-31T23:59:59`)
          .format(DateFormats.FullDate);

        getAllEvents({
          startDate: yearStart,
          endDate: yearEnd,
          forEventDots: true,
        });
      }
    }
  };

  /** Added by @Yuvraj 05-03-2025 -> for handling the date change event and handling the debouncing (FYN-5817) */
  const handleDateChange = (date: string) => {
    Log('date selected=>' + date);
    setSelectedDate(date);

    if (isFirstTime.current) {
      setIsExpanded(true);
      isFirstTime.current = false;
    }

    const getUtcDayRangeFromLocalDate = (date: string) => {
      const local = dayjs(date, DateFormats.Date); // or whatever your format is

      return {
        startDate: local.startOf('day').utc().format(DateFormats.FullDate),
        endDate: local.endOf('day').utc().format(DateFormats.FullDate),
      };
    };
    const parsedDate = getUtcDayRangeFromLocalDate(date);

    getAllEvents({
      startDate: parsedDate.startDate,
      endDate: parsedDate.endDate,
    });
  };

  /** Added by @Yuvraj 05-03-2025 -> calling api to get all events details (FYN-5817) */
  const getEventsForUserApi = useMutation({
    mutationFn: (sendData: {
      apiPayLoad: Record<string, any>;
      forEventDots?: boolean;
      firstTime?: boolean;
    }) => {
      return makeRequest<GetUserProgramSessionEventsModel[]>({
        endpoint:
          templateData?.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetExperienceEvents
            : ApiConstants.GetCommunityTemplateEvents,
        method: HttpMethodApi.Get,
        data: sendData.apiPayLoad,
      });
    },
    onMutate(variables) {
      !variables.forEventDots && setLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (!variables.firstTime) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        data.result.map(item => {
          item.icon =
            item?.eventType == 1
              ? Images.contactUs
              : item?.eventType == 2
              ? Images.name
              : Images.videocam;
        });
        if (variables.forEventDots) {
          const formatToLocalDate = (dateStr: string) =>
            parseDateUtc({
              date: formatDateUtcReturnLocalTime({
                date: dateStr,
                parseFormat: DateFormats.ApiUTCDate,
                returnFormat: DateFormats.Date,
              }),
              parseFormat: DateFormats.Date,
            });

          const formatToDateKey = (dateStr: string) =>
            formatDateUtcReturnLocalTime({
              date: dateStr,
              parseFormat: DateFormats.ApiUTCDate,
              returnFormat: DateFormats.Date,
            });

          setMarkedData(prevMarkedData => {
            const updatedMarkedDates: MarkedDatesType = variables.firstTime
              ? {}
              : { ...prevMarkedData };

            data.result?.forEach(item => {
              if (!item.strStartDate || !item.strEndDate) return;

              const localStartDate = formatToLocalDate(item.strStartDate);
              const localEndDate = formatToLocalDate(item.strEndDate);

              if (!localStartDate || !localEndDate) return;

              if (localEndDate > localStartDate) {
                const ranges = getDatesBetween({
                  start: formatToDateKey(item.strStartDate),
                  end: formatToDateKey(item.strEndDate),
                  returnFormat: DateFormats.Date,
                });

                ranges.forEach(date => {
                  updatedMarkedDates[date] = {
                    marked: true,
                    dotColor: item.colorCode,
                  };
                });
              } else {
                const dateKey = formatToDateKey(item.strStartDate);
                updatedMarkedDates[dateKey] = {
                  marked: true,
                  dotColor: item.colorCode,
                };
              }
            });

            return updatedMarkedDates;
          });

          if (variables.firstTime) {
            const currentSelectedDate = formatToLocalDate(selectedDate);

            const filteredEvents = data.result.filter(item => {
              if (!item.strStartDate || !item.strEndDate) return false;

              const startDate = formatToLocalDate(item.strStartDate);
              const endDate = formatToLocalDate(item.strEndDate);

              return (
                startDate === currentSelectedDate ||
                endDate === currentSelectedDate
              );
            });
            setAllEventsData(filterEventData(filteredEvents));
            handleDateChange(selectedDate);
          }
        } else {
          setAllEventsData(filterEventData(data.result));
        }
      }
    },
    onError(error, variables, context) {
      setAllEventsData([]);
      setLoading(false);
    },
  });

  /** Added by @Yuvraj 03-04-2025 -> calling api to get all events details for advisor (FYN-6256) */
  const GetScheduleTasksForGlobalCalendarApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetScheduleTasksForGlobalCalendarModel[]>({
        endpoint: ApiConstants.GetScheduleTasksForGlobalCalendar,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      !variables.yearChange && setLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (!variables.firstTime) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        data.result.map(item => {
          item.isOffice365 =
            item.scheduleTaskTypeId == 2 && item.eventType == 4; // check if office event
          item.uiTitle = item.title
            ?.replace(/<[^>]*>/g, '') // remove HTML tags
            .replace(/&[a-zA-Z#0-9]+;/g, ' ') // replace entities like &nbsp; or &#123; with space
            .trim();
          item.description =
            item.scheduleTaskTypeId == 2 && item.eventType == 4
              ? item.description?.replace(/<[^>]+>/g, '').trim()
              : item.description; // remove HTML tags
          item.icon = item.requireAttention
            ? Images.warning
            : item.scheduleTaskTypeId == 1
            ? Images.newspaperPng
            : item.scheduleTaskTypeId == 2
            ? Images.event
            : item.scheduleTaskTypeId == 3
            ? Images.reminder2
            : item.scheduleTaskTypeId == 4
            ? Images.itemList
            : Images.faqPng;
        });
        if (variables.forEventDots) {
          const formatToLocalDate = (dateStr: string) =>
            parseDateUtc({
              date: formatDateUtcReturnLocalTime({
                date: dateStr,
                parseFormat: DateFormats.FullDate,
                returnFormat: DateFormats.Date,
              }),
              parseFormat: DateFormats.Date,
            });

          const formatToDateKey = (dateStr: string) =>
            formatDateUtcReturnLocalTime({
              date: dateStr,
              parseFormat: DateFormats.FullDate,
              returnFormat: DateFormats.Date,
            });

          setMarkedData(prevMarkedData => {
            const updatedMarkedDates: MarkedDatesType = variables.firstTime
              ? {}
              : { ...prevMarkedData };

            data.result?.forEach(item => {
              if (!item.event_Start_Date || !item.event_End_Date) return;

              const localStartDate = formatToLocalDate(item.event_Start_Date);
              const localEndDate = formatToLocalDate(item.event_End_Date);

              if (!localStartDate || !localEndDate) return;

              if (localEndDate > localStartDate) {
                const ranges = getDatesBetween({
                  start: formatToDateKey(item.event_Start_Date),
                  end: formatToDateKey(item.event_End_Date),
                  returnFormat: DateFormats.Date,
                });

                ranges.forEach(date => {
                  updatedMarkedDates[date] = {
                    marked: true,
                    dotColor: item.colorCode,
                  };
                });
              } else {
                const dateKey = formatToDateKey(item.event_Start_Date);
                updatedMarkedDates[dateKey] = {
                  marked: true,
                  dotColor: item.colorCode,
                };
              }
            });

            return updatedMarkedDates;
          });

          if (variables.firstTime) {
            const currentSelectedDate = formatToLocalDate(selectedDate);

            const filteredEvents = data.result.filter(item => {
              if (!item.event_Start_Date || !item.event_End_Date) return false;

              const startDate = formatToLocalDate(item.event_Start_Date);
              const endDate = formatToLocalDate(item.event_End_Date);

              return (
                startDate === currentSelectedDate ||
                endDate === currentSelectedDate
              );
            });
            handleDateChange(selectedDate);
            setAllAdvisorEventsData(filterScheduleData(filteredEvents));
          }
        } else {
          setAllAdvisorEventsData(filterScheduleData(data.result));
        }
      }
    },
    onError(error, variables, context) {
      setAllAdvisorEventsData([]);
    },
  });

  /** Added by @Yuvraj 03-04-2025 -> deleting the item from all global events (FYN-6256) */
  const deleteGlobalCalTaskApi = useMutation({
    mutationFn: (sendData: {
      endpoint: string;
      payload: Record<string, any>;
    }) => {
      return makeRequest<null>({
        endpoint: sendData.endpoint,
        method: HttpMethodApi.Delete,
        data: sendData.payload,
      });
    },
    onMutate(variables) {
      setDeleteLoadingId(variables.payload.Id);
    },
    onSettled(data, error, variables, context) {
      setSelectedItem(undefined);
      setDeleteLoadingId(undefined);
    },
    onSuccess(data, variables, context) {
      if (data?.success) {
        showSnackbar(t('DeletedSuccessfully'), 'success');
        const tempArray = allAdvisorEventsData.filter(item => {
          return item.taskIdentifier !== selectedItem?.taskIdentifier;
        });
        setAllAdvisorEventsData(tempArray);
        handleDateChange(selectedDate);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const renderEventsItems = (item: GetUserProgramSessionEventsModel) => {
    return (
      <Shadow
        onPress={() => {
          navigation.navigate('ScheduleEventDetail', {
            id: item.id,
            contactItem: item,
          });
        }}
        style={styles.eventCard}
      >
        <View style={styles.eventCardContainer}>
          <View style={styles.infoTitleContainer}>
            <CustomText
              color={item.colorCode}
              variant={TextVariants.titleLarge}
            >
              {'•'}
            </CustomText>
            <CustomText
              style={styles.titleText}
              variant={TextVariants.bodyLarge}
            >
              {`${item.appStartDate} ${
                !item.sameDayEvent ? ` -  ${item.appEndDate}` : ''
              }`}
            </CustomText>

            <CustomText
              color={item.statusColor}
              variant={TextVariants.bodyLarge}
            >
              {item.status}
            </CustomText>
          </View>

          <View style={styles.detailSubContainer}>
            <CustomImage
              type={ImageType.svg}
              source={Images.calendar}
              color={theme.colors.outline}
              style={styles.detailImage}
            />
            <CustomText
              color={theme.colors.outline}
              variant={TextVariants.bodyMedium}
            >
              {`${item.appStartTime}  -  ${item.appEndTime}`}
            </CustomText>
          </View>

          {item?.eventTypeName && (
            <View style={styles.detailSubContainer}>
              <CustomImage
                type={ImageType.svg}
                source={item.icon}
                color={theme.colors.outline}
                style={styles.detailImage}
              />
              <CustomText
                color={theme.colors.outline}
                variant={TextVariants.bodyMedium}
              >
                {item?.eventTypeName}
              </CustomText>
            </View>
          )}

          <CustomText
            maxLines={1}
            color={theme.colors.primary}
            variant={TextVariants.titleMedium}
          >
            {item?.title}
          </CustomText>

          <CustomText
            maxLines={2}
            color={theme.colors.outline}
            variant={TextVariants.titleSmall}
          >
            {item?.description}
          </CustomText>
        </View>
        {deleteLoadingId == item.id && <LoadingView />}
      </Shadow>
    );
  };

  const openScheduleDetail = (item: GetScheduleTasksForGlobalCalendarModel) => {
    Log('Schedule PAGE TYPE - > ' + item.scheduleTaskTypeName);
    switch (item?.scheduleTaskTypeId) {
      case 1:
        navigation.navigate('ScheduledPostDetail', { item });
        break;
      case 2:
        navigation.navigate('ScheduleEventDetail', { item });
        break;
      case 3:
        navigation.navigate('ScheduleReminderDetail', { item });
        break;
      case 4:
        navigation.navigate('ScheduleActionItemDetail', { item });
        break;
      case 5:
        navigation.navigate('ScheduleDirectMessageDetail', { item });
        break;
      case 7:
        navigation.navigate('ScheduleGroupMessageDetail', { item });
        break;

      default:
        // safety fallback (optional)
        break;
    }
  };

  const renderScheduleItem = (item: GetScheduleTasksForGlobalCalendarModel) => {
    return (
      <Shadow
        onPress={() => {
          openScheduleDetail(item);
        }}
        style={styles.eventCard}
      >
        <View style={styles.eventCardContainer}>
          <View style={styles.infoTitleContainer}>
            <View style={styles.detailSubContainerSchedule}>
              <CustomImage
                source={item.icon}
                color={item.requireAttention ? undefined : theme.colors.outline}
                style={styles.detailImageScheduleTitle}
              />
              <CustomText
                maxLines={1}
                color={theme.colors.primary}
                style={styles.main}
                variant={TextVariants.bodyLarge}
              >
                {item?.uiTitle}
              </CustomText>
            </View>
            {!item.isPastDate && (
              <Tap
                onPress={() => {
                  setSelectedItem(item);
                  setShowActionSheet(true);
                }}
                style={styles.menuIconTap}
              >
                <CustomImage
                  source={Images.more}
                  type={ImageType.svg}
                  color={theme.colors.outline}
                  style={styles.menuIcon}
                />
              </Tap>
            )}
          </View>

          <View style={styles.detailSubContainerSchedule}>
            <CustomImage
              type={ImageType.svg}
              source={Images.clock}
              color={theme.colors.outline}
              style={styles.detailImageSchedule}
            />
            <CustomText
              color={theme.colors.outline}
              variant={TextVariants.bodyMedium}
            >
              {`${item.appStartDate} ${item.appStartTime} ${
                item.scheduleTaskTypeId == 2 && !item.sameDayEvent
                  ? `\n${item.appEndDate} ${item.appEndTime}`
                  : item.appEndTime != item.appStartTime
                  ? `- ${item.appEndTime}`
                  : ''
              }`}
            </CustomText>
          </View>

          <View style={styles.detailSubContainerSchedule}>
            <CustomImage
              type={ImageType.svg}
              source={Images.refer}
              color={theme.colors.outline}
              style={styles.detailImageSchedule}
            />
            <CustomText
              maxLines={2}
              color={theme.colors.outline}
              variant={TextVariants.bodyMedium}
              style={styles.width95}
            >
              {item.requireAttention
                ? t('NoMatchingContact')
                : `${item?.userTags ? item?.userTags + ' ' : ''}${
                    item?.userNameFilter ? item?.userNameFilter + ' ' : ''
                  }${item?.programFilter ? item?.programFilter + ' ' : ''}${
                    item?.userTypeFilter
                  }`}
            </CustomText>
          </View>
        </View>
      </Shadow>
    );
  };

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showBack={!userDetails.userDetails?.isAdvisor}
          showHamburger={userDetails.userDetails?.isAdvisor}
          title={
            <View style={styles.titleLay}>
              <CustomText variant={TextVariants.titleLarge}>
                {formatDate({
                  date: selectedDate,
                  parseFormat: DateFormats.Date,
                  returnFormat: DateFormats.UIDate,
                })}
              </CustomText>
              <CustomImage
                source={Images.back}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={{
                  height: 25,
                  width: 25,
                  transform: isExpanded
                    ? [{ rotate: '90deg' }]
                    : [{ rotate: '270deg' }],
                }}
              />
            </View>
          }
          onTitlePress={() => {
            setIsExpanded(!isExpanded);
          }}
          rightIcons={setHeaderRightIcons()}
        />

        {isExpanded && (
          <Animated.View entering={SlideInUp} exiting={SlideOutUp}>
            <Calendar
              enableSwipeMonths
              current={selectedDate}
              theme={{
                calendarBackground: theme.colors.surface,
                arrowColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.surface,
                dayTextColor: theme.colors.onSurfaceVariant,
                monthTextColor: theme.colors.onSurfaceVariant,
              }}
              onDayPress={(day: DateData) => {
                if (!loading) {
                  setIsExpanded(false);
                  handleDateChange(day.dateString);
                }
              }}
              onVisibleMonthsChange={(date: DateData[]) => {
                handleMonthChange(date?.at(0));
              }}
              markingType="custom"
              markedDates={{
                ...markedData,
                [selectedDate]: {
                  selected: true,
                  customStyles: {
                    container: {
                      backgroundColor: theme.colors.primary,
                    },
                    text: {
                      color: theme.colors.onPrimary,
                      fontWeight: 'bold',
                    },
                  },
                },
              }}
            />
          </Animated.View>
        )}

        <View style={styles.main}>
          {loading ? (
            <SkeletonList count={5}>
              <View style={styles.eventCardSkeleton}>
                <View style={styles.skeletonTitleContainer}>
                  <View style={styles.skeletonTitle}></View>
                  <View style={styles.skeletonStatus}></View>
                </View>

                <View style={styles.skeletonMainTitle}></View>
                <View style={styles.skeletonSubTitle}></View>
              </View>
            </SkeletonList>
          ) : (
            <CustomFlatList
              data={
                userDetails.userDetails?.isAdvisor
                  ? (allAdvisorEventsData as GetScheduleTasksForGlobalCalendarModel[])
                  : (allEventsData as GetScheduleTasksForGlobalCalendarModel[])
              }
              extraData={deleteLoadingId}
              refreshing={loading}
              keyExtractor={item => item.id!.toString()}
              onRefresh={() => onRefresh()}
              contentContainerStyle={
                allAdvisorEventsData.length == 0 && allEventsData.length == 0
                  ? styles.flatListContainerStyle
                  : styles.flatListBottomSpace
              }
              ListEmptyComponent={
                <View style={styles.alignCenter}>
                  <EmptyView
                    label={
                      userDetails.userDetails?.isAdvisor
                        ? `${t('NoScheduleEvent')} \n \n${t(
                            'AddScheduleEventMsg',
                          )}`
                        : t('NoEvent')
                    }
                    labelStyle={styles.noEventsStyle}
                  />
                </View>
              }
              renderItem={({ item }) => {
                return userDetails.userDetails?.isAdvisor
                  ? renderScheduleItem(
                      item as GetScheduleTasksForGlobalCalendarModel,
                    )
                  : renderEventsItems(item as GetUserProgramSessionEventsModel);
              }}
            />
          )}
        </View>

        {showFabIcon && (
          <FabGroup
            open={floatingButton}
            setOpen={setFloatingButton}
            visible={
              !loading && userDetails.userDetails?.isAdvisor && isFocused
            }
            items={fabItemsArray}
            style={styles.fabBtn}
          />
        )}

        <CustomActionSheetPoup
          shown={showActionSheet}
          setShown={setShowActionSheet}
          centered={false}
          hideIcons={false}
          children={[
            {
              title: t('Edit'),
              image: Images.edit,
              imageType: ImageType.svg,
              onPress: () => {
                if (selectedItem?.scheduleTaskTypeId == 1) {
                  navigation.navigate('AddSchedulePost', {
                    item: selectedItem,
                  });
                } else if (selectedItem?.scheduleTaskTypeId == 2) {
                  navigation.navigate('AddScheduleEvent', {
                    taskId: selectedItem?.id?.toString()!,
                    taskIdentifier: selectedItem?.taskIdentifier!,
                    item: selectedItem,
                  });
                } else if (selectedItem?.scheduleTaskTypeId == 3) {
                  navigation.navigate('AddScheduleReminder', {
                    taskId: selectedItem?.id?.toString(),
                    taskIdentifier: selectedItem?.taskIdentifier,
                  });
                } else if (selectedItem?.scheduleTaskTypeId == 4) {
                  navigation.navigate('AddScheduleActionItem', {
                    item: selectedItem,
                  });
                } else if (
                  selectedItem?.scheduleTaskTypeId == 5 ||
                  selectedItem?.scheduleTaskTypeId == 7
                ) {
                  navigation.navigate('AddScheduleMessage', {
                    item: selectedItem,
                    ...(selectedItem?.scheduleTaskTypeId == 7
                      ? {
                          navigateFrom:
                            NavigateScheduleMessageFromEnum.groupMessage,
                        }
                      : {}),
                  });
                }
              },
            },
            {
              title: selectedItem?.isOffice365
                ? t('RemoveFromFynancial', { app: TenantInfo.AppName })
                : t('Delete'),
              image: Images.delete,
              imageType: ImageType.svg,
              titleColor: theme.colors.error,
              imageColor: theme.colors.error,
              onPress: () => {
                setShowActionSheet(false);
                showAlertPopup({
                  title: selectedItem?.isOffice365 ? t('Remove') : t('Delete'),
                  msg: selectedItem?.isOffice365
                    ? t('RemoveMsgSchedule')
                    : `${t('DeleteMsgSchedule')} ${
                        selectedItem?.scheduleTaskTypeId == 1
                          ? t('Post')
                          : selectedItem?.scheduleTaskTypeId == 2
                          ? t('Event')
                          : selectedItem?.scheduleTaskTypeId == 3
                          ? t('Reminder')
                          : selectedItem?.scheduleTaskTypeId == 4
                          ? t('ActionItem')
                          : t('Item')
                      }`,
                  PositiveText: t('Yes'),
                  NegativeText: t('No'),
                  onPositivePress: () => {
                    deleteGlobalCalTaskApi.mutate({
                      endpoint: selectedItem?.isOffice365
                        ? ApiConstants.RemoveFromFynancial
                        : ApiConstants.DeleteGlobalCalTask,
                      payload: {
                        Id: selectedItem?.taskIdentifier,
                      },
                    });
                  },
                });
              },
            },
          ]}
        />
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    calendarContainer: {
      flex: 1,
      marginBottom: 10,
      backgroundColor: theme.colors.background,
    },
    flatlistContainer: {
      height: '100%',
    },
    alignCenter: {
      alignSelf: 'center',
    },
    noEventsStyle: {
      marginHorizontal: 20,
      textAlign: 'center',
    },
    flatListContainerStyle: {
      flex: 1,
      justifyContent: 'center',
    },
    flatListBottomSpace: {
      paddingBottom: 70,
    },
    eventCardSkeleton: {
      margin: 10,
      borderWidth: 1,
      borderRadius: theme.roundness,
      padding: 10,
      gap: 5,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 20,
      width: '50%',
    },
    skeletonStatus: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 15,
      width: '10%',
    },
    skeletonMainTitle: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 25,
      width: '70%',
      marginTop: 20,
    },
    skeletonSubTitle: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 15,
      width: '90%',
    },
    eventCard: {
      marginHorizontal: 10,
      marginVertical: 10,
    },
    eventCardContainer: {
      gap: 5,
      marginRight: 15,
    },
    infoTitleSubContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    infoTitleContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    skeletonTitleContainer: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    titleText: {
      flex: 1,
    },
    menuIconTap: {
      padding: 0,
      right: 2,
      top: 0,
      height: 25,
      width: 25,
    },
    menuIcon: {
      height: 25,
      width: 25,
    },
    detailSubContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    detailSubContainerSchedule: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      flex: 1,
    },
    detailImage: {
      height: 15,
      width: 15,
      marginTop: 2,
    },
    detailImageSchedule: {
      height: 20,
      width: 20,
      marginTop: 2,
    },
    detailImageScheduleTitle: {
      height: 20,
      width: 20,
    },
    addEventMsg: {
      marginHorizontal: 20,
      textAlign: 'center',
      flex: 0.7,
    },
    titleLay: {
      flexDirection: 'row',
      gap: 10,
      alignContent: 'center',
      justifyContent: 'center',
    },
    width95: {
      width: '95%',
    },
    fabBtn: {},
  });

export default EventViewAll;
