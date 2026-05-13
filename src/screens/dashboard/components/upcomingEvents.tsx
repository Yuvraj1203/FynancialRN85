import {
  CustomImage,
  CustomText,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import CustomCarousel from '@/components/molecules/customCarousel/customCarousel';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetUserProgramSessionEventsModel } from '@/services/models';
import { templateStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { formatDateUtcReturnLocalTime, parseDateUtc } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const enum DateFormats {
  upcomingEventSlash = 'DD/MM/YYYY',
  displayFullDay = 'dddd, MMM DD, YYYY',
  displayTime = 'hh:mm A',
  displayFullDateTimeDay = 'hh:mm A  ddd, MMM DD, YYYY',
  displayFullDateTime = 'DD MMM YYYY hh:mm A',
}

type Props = {
  loading?: boolean;
  refreshProp?: boolean;
};

function UpcomingEvents(props: Props) {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const userDetails = userStore();

  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */

  const signalRStore = useSignalRStore();
  const templateData = templateStore();

  const [eventLoading, setEventLoading] = useState(true); //for events item

  // added by @Yuvraj 28-02-2025 --> state for upcoming event data (#4062)
  const [eventListData, setEventListData] = useState<
    GetUserProgramSessionEventsModel[]
  >([]);

  useEffect(() => {
    if (
      templateData.templateList &&
      templateData.templateList.length > 0 &&
      userDetails.userDetails &&
      props.refreshProp
    ) {
      //get all upcoming events
      getUserProgramSessionEventsApi.mutate({
        ...(templateData.selectedTemplate?.programTypeID == 0 ||
        templateData.selectedTemplate?.programTypeID == undefined ||
        templateData.selectedTemplate?.programTypeID == null
          ? {}
          : {
              ProgramSessionId: templateData.selectedTemplate?.programSessionID,
            }),
        CallPoint: 'app',
      });
    } else {
      setEventLoading(false);
    }
  }, [templateData.selectedTemplate, props.refreshProp]);

  useEffect(() => {
    if (props.loading) {
      setEventLoading(true);
    }
  }, [props.loading]);

  /**
    *Added by @Akshita 29-09-25 ---> Function to handle the auto app refresh functionality
    if a new notification received.(#Fyn-8941)*/
  useEffect(() => {
    if (userDetails) {
      const handleFeedRefersh = (data: string) => {
        if (data.toLocaleLowerCase().trim() == 'event') {
          if (userDetails.userDetails) {
            getUserProgramSessionEventsApi.mutate({
              ...(templateData.selectedTemplate?.programTypeID == 0 ||
              templateData.selectedTemplate?.programTypeID == undefined ||
              templateData.selectedTemplate?.programTypeID == null
                ? {}
                : {
                    ProgramSessionId:
                      templateData.selectedTemplate?.programSessionID,
                  }),
              CallPoint: 'app',
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

  const maxFontSize = 1.0;

  const renderEventItem = (eventItem: GetUserProgramSessionEventsModel) => {
    return (
      <Shadow
        onPress={() => {
          navigation.navigate('ScheduleEventDetail', {
            id: eventItem.id,
            contactItem: eventItem,
          });
        }}
        style={styles.eventCard}
      >
        <View>
          <CustomImage
            source={
              eventItem.coverImageUrl
                ? {
                    uri: eventItem.coverImageUrl,
                  }
                : Images.eventBg
            }
            style={styles.eventCardImage}
            resizeMode={ResizeModeType.stretch}
          />
          <View style={styles.eventCardInfoSection}>
            <CustomText
              maxLines={1}
              variant={TextVariants.titleLarge}
              maxFontSizeMultiplier={maxFontSize}
            >
              {eventItem.title}
            </CustomText>

            <View style={styles.eventCardSubInfoSection}>
              <View style={styles.eventCardSubInfoSection}>
                <CustomImage
                  source={Images.calendar}
                  color={theme.colors.outline}
                  type={ImageType.svg}
                  style={styles.eventCardTypeImage}
                />
                <View>
                  <CustomText
                    variant={TextVariants.bodySmall}
                    color={theme.colors.outline}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={maxFontSize}
                  >
                    {eventItem.dateLine1}
                  </CustomText>

                  <CustomText
                    variant={TextVariants.bodySmall}
                    color={theme.colors.outline}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={maxFontSize}
                  >
                    {eventItem.dateLine2}
                  </CustomText>
                </View>
              </View>
              <View style={styles.eventCardTimeDetailDivider}></View>
              <View style={styles.eventTypeImageContainer}>
                <CustomImage
                  source={eventItem.icon}
                  color={theme.colors.outline}
                  type={ImageType.svg}
                  style={styles.eventCardTypeImage}
                />
              </View>
            </View>
          </View>
        </View>
      </Shadow>
    );
  };

  /** added by @Yuvraj 28-02-2025 --> api call to get upcoming event data (#4062)
   * //api gets updated  @Yuvraj 14-05-2025 (FYN-7249)*/
  /** added by @Yuvraj 28-02-2025 --> api call to get upcoming event data (#4062)
   * //api gets updated  @Yuvraj 14-05-2025 (FYN-7249)*/
  const getUserProgramSessionEventsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserProgramSessionEventsModel[]>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetExperienceEvents
            : ApiConstants.GetCommunityTemplateEvents,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (!variables.isAutoRefreshing) {
        setEventLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      setEventLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result?.length > 0) {
        data.result = data.result;
        setEventListData(
          data.result.map(item => {
            item = {
              icon:
                item?.eventType == 1
                  ? Images.contactUs
                  : item?.eventType == 2
                  ? Images.name
                  : Images.videocam,
              ...item,
            };
            if (item.strStartDate && item.strEndDate) {
              const startingDate = parseDateUtc({
                date: item.strStartDate,
                parseFormat: DateFormats.displayFullDateTime,
              });

              const endingDate = parseDateUtc({
                date: item.strEndDate,
                parseFormat: DateFormats.displayFullDateTime,
              });

              if (!startingDate || !endingDate) {
                return item;
              }
              if (
                formatDateUtcReturnLocalTime({
                  date: startingDate,
                  returnFormat: DateFormats.upcomingEventSlash,
                }) ==
                formatDateUtcReturnLocalTime({
                  date: endingDate,
                  returnFormat: DateFormats.upcomingEventSlash,
                })
              ) {
                return {
                  ...item,
                  dateLine1: formatDateUtcReturnLocalTime({
                    date: startingDate,
                    returnFormat: DateFormats.displayFullDay,
                  }),
                  dateLine2: `from ${formatDateUtcReturnLocalTime({
                    date: startingDate,
                    returnFormat: DateFormats.displayTime,
                  })} to ${formatDateUtcReturnLocalTime({
                    date: endingDate,
                    returnFormat: DateFormats.displayTime,
                  })}`,
                };
              } else {
                return {
                  ...item,
                  dateLine1: `from  ${formatDateUtcReturnLocalTime({
                    date: startingDate,
                    returnFormat: DateFormats.displayFullDateTimeDay,
                  })}`,
                  dateLine2: `to  ${formatDateUtcReturnLocalTime({
                    date: endingDate,
                    returnFormat: DateFormats.displayFullDateTimeDay,
                  })}`,
                };
              }
            } else {
              return item;
            }
          }),
        );
      } else {
        setEventListData([]);
      }
    },
    onError(error, variables, context) {
      setEventListData([]);
    },
  });
  return (
    <View style={styles.container}>
      {eventListData.length > 0 && (
        <Tap
          onPress={() => {
            eventListData.length > 0 && navigation.navigate('EventViewAll');
          }}
          style={styles.eventItemTap}
        >
          <View style={styles.eventTitleContainer}>
            <CustomText variant={TextVariants.titleLarge}>
              {t('HomeEvents')}
            </CustomText>
            {eventListData.length > 0 && (
              <CustomText
                color={theme.colors.primary}
                variant={TextVariants.titleSmall}
              >
                {t('ViewAll')}
              </CustomText>
            )}
          </View>
        </Tap>
      )}
      {eventLoading ? (
        <Skeleton style={styles.skeleton}>
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonImageContainer}></View>
            <View style={styles.skeletonDetailContainer}>
              <View style={styles.skeletonTitle}></View>
              <View style={styles.skeletonSubInfo}>
                <View style={styles.skeletonSubInfoLeft}></View>
                <View style={styles.skeletonSubInfoRight}></View>
              </View>
            </View>
          </View>
        </Skeleton>
      ) : (
        eventListData.length > 0 && (
          <CustomCarousel
            data={eventListData}
            aspectRatio={eventListData.length > 1 ? 0.95 : 0.9}
            children={(eventItem, index) => renderEventItem(eventItem)}
          />
        )
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      margin: 10,
    },
    eventItemTap: {
      padding: 0,
      paddingHorizontal: 5,
    },
    eventTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
    },
    eventEmptyContainer: {
      height: 100,
    },
    eventCard: {
      padding: 0,
      marginHorizontal: 10,
      marginRight: 30,
    },
    eventCardImage: {
      width: '100%',
      aspectRatio: 1.5,
      borderRadius: theme.roundness,
    },
    eventCardInfoSection: {
      paddingVertical: 15,
      paddingHorizontal: 5,
      gap: 8,
    },
    eventCardSubInfoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 5,
    },
    eventCardTimeDetailDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.outline,
    },
    eventCardType: {
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventTypeImageContainer: {
      marginRight: 20,
    },
    eventCardTypeImage: {
      width: 20,
      height: 20,
    },
    skeleton: {
      alignSelf: 'center',
    },
    skeletonContainer: {
      borderRadius: theme.roundness,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
    },
    skeletonImageContainer: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      height: 150,
    },
    skeletonDetailContainer: {
      padding: 10,
    },
    skeletonTitle: {
      height: 25,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      width: '75%',
    },
    skeletonSubInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    skeletonSubInfoLeft: {
      height: 15,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      width: '60%',
    },
    skeletonSubInfoRight: {
      height: 15,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      width: '30%',
    },
  });

export default UpcomingEvents;
