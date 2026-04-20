import {
  CustomImage,
  CustomText,
  HtmlRender,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { Direction } from '@/components/atoms/customButton/customButton';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomCarousel,
  CustomFullScreenPopup,
  CustomHeader,
  EmptyView,
} from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import PdfPreview from '@/components/molecules/pdfPreview/pdfPreview';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  Events,
  GetEventsForEditModel,
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
} from '@/services/models';
import { PostDocumentMappingListObj } from '@/services/models/getGlobalScheduleDetailForEditModel/getGlobalScheduleDetailForEditModel';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
  ShareDocumentFile,
} from '@/utils/fileDownloadUtils';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import {
  formatDateUtcReturnLocalTime,
  getFileExtension,
  handleDocumentItemClick,
  handleOpenDialer,
  handleShare,
  openUrl,
  parseDateUtc,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

export type EventDetailScreenProps = {
  id?: string;
  item?: GetScheduleTasksForGlobalCalendarModel;
};

const EventDetailScreen = () => {
  /** Added by @Yuvraj 05-03-2025 -> navigate to different screen (FYN-5817) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 05-03-2025 -> get params from parent screen (FYN-5817) */
  const route = useAppRoute('EventDetailScreen').params;

  /** Added by @Yuvraj 05-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5817) */
  const theme = useTheme();

  /** Added by @Yuvraj 05-03-2025 -> access StylesSheet with theme implemented (FYN-5817) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 05-03-2025 -> translations for labels (FYN-5817) */
  const { t } = useTranslation();

  /** Added by @Yuvraj 07-04-2025 -> loading state for button (FYN-6451) */
  const userDetails = userStore();

  /** Added by @Akshita 05-02-25 ---> to open in app browser links from comments(FYN-4314)*/
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Yuvraj 08-04-2025 ---> show image full screen popup */
  const [showImageSendPopup, setShowImageSendPopup] = useState(false);

  /** Added by @Yuvraj 05-03-2025 -> loading state for button (FYN-5817) */
  const [loading, setLoading] = useState(false);

  /** Added by @Yuvraj 07-04-2025 -> state for title (FYN-6451) */
  const [title, setTitle] = useState('');

  /** Added by @Yuvraj 05-03-2025 -> setting event data (FYN-5817) */
  const [eventData, setEventData] = useState<Events>();

  /** Added by @Yuvraj07-04-2025 -> setting event data (FYN-6451) */
  const [globalEventData, setGlobalEventData] =
    useState<GetGlobalScheduleDetailForEditModel>();
  const [SelectedFeaturedItem, setSelectedFeaturedItem] =
    useState<PostDocumentMappingListObj>();
  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup
  const [isDownloading, setIsDownloading] = useState(false); // show report popup
  const [fileList, setFileList] = useState<PostDocumentMappingListObj[]>([]);

  const [resourceList, setResourceList] = useState<
    PostDocumentMappingListObj[]
  >([]);

  /** Added by @Yuvraj 05-03-2025 -> status of events (FYN-5817) */
  const [status, setStatus] = useState({
    message: '',
    color: '',
  });

  const fromSelf =
    route?.item?.scheduleTaskTypeId == 1
      ? globalEventData?.postDetail?.fromSelf
      : route?.item?.scheduleTaskTypeId == 3
      ? globalEventData?.reminderTask?.fromSelf
      : route?.item?.scheduleTaskTypeId == 4
      ? globalEventData?.parentActionDetails?.fromSelf
      : route?.item?.scheduleTaskTypeId == 5
      ? globalEventData?.scheduleMessage?.fromSelf
      : globalEventData?.scheduleGroupMessage?.fromSelf;

  /** Added by @Yuvraj 05-03-2025 -> loading state for button (FYN-5817) */
  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      /** Added by @Yuvraj 07-04-2025 -> to get the particular title (FYN-6451) */
      if (route?.id) {
        setTitle(t('Event'));
      } else {
        route?.item?.scheduleTaskTypeId == 1
          ? setTitle(t('Post'))
          : route?.item?.scheduleTaskTypeId == 2
          ? setTitle(t('Event'))
          : route?.item?.scheduleTaskTypeId == 3
          ? setTitle(t('Reminder'))
          : route?.item?.scheduleTaskTypeId == 4
          ? setTitle(t('ActionItem'))
          : route?.item?.scheduleTaskTypeId == 5
          ? setTitle(t('DirectMessage'))
          : route?.item?.scheduleTaskTypeId == 7
          ? setTitle(t('GroupMessage'))
          : '';
      }

      fetchData();
    }
  }, []);

  /** Added by @Yuvraj 07-04-2025 -> function for calling specific api (FYN-6451) */
  const fetchData = () => {
    if (userDetails.userDetails?.isAdvisor) {
      const apiEndPoint =
        route?.item?.scheduleTaskTypeId == 1
          ? ApiConstants.GetGlobalPostForEdit
          : route?.item?.scheduleTaskTypeId == 2
          ? ApiConstants.GetGlobalEventForEdit
          : route?.item?.scheduleTaskTypeId == 3
          ? ApiConstants.GetGlobalReminderForEdit
          : route?.item?.scheduleTaskTypeId == 4
          ? ApiConstants.GetGlobalActionItemForEdit
          : route?.item?.scheduleTaskTypeId == 5
          ? ApiConstants.GetGlobalMessageForEdit
          : route?.item?.scheduleTaskTypeId == 7
          ? ApiConstants.GetGlobalGroupMessageForEdit
          : false;

      if (apiEndPoint) {
        GetGlobalScheduleDetailForEditApi.mutate({
          Id: route?.item?.taskIdentifier,
          ApiEndPoint: apiEndPoint,
        });
      }
    } else {
      getEventsForEditApi.mutate({ Id: route?.id });
    }
  };

  /**
   * Added by @Shivang 13-03-2025 -> Handle Long Press Action (FYN-5333)
   * This function is triggered when the user long-presses on a list item.
   * If the item is a PDF file, it sets the selected item and opens the action popup.
   */
  const handleLongPress = (itemData: PostDocumentMappingListObj) => {
    setSelectedFeaturedItem(itemData); // ✅ Store the selected item
    if (itemData.contentType != 'H') {
      if (itemData.contentType != 'E') {
        setShowActionPopup(true); // ✅ Show action sheet with available options
      }
    }
  };

  const handleSelectedActionItem = (
    ActionParam: string,
    itemData?: PostDocumentMappingListObj,
  ) => {
    const doc = itemData ? itemData : SelectedFeaturedItem;
    if (!doc) return;

    const ext = getFileExtension(doc.location!);
    const finish = (fileUri?: string) => {
      setIsDownloading(false);
      setResourceList(prev =>
        prev?.map(item => {
          if (doc && item.contentDataId == doc?.contentDataId) {
            return { ...item, progress: undefined };
          } else {
            return item;
          }
        }),
      );

      if (!fileUri) {
        showSnackbar(t('SomeErrorOccured'), 'danger');
      }
    };

    const setDocumentLoading = () => {
      setIsDownloading(true);
      setResourceList(prev =>
        prev?.map(item => {
          if (doc && item.contentDataId == doc?.contentDataId) {
            return { ...item, progress: '1' };
          } else {
            return item;
          }
        }),
      );
    };

    if (ActionParam === 'Download') {
      setShowActionPopup(false);
      setDocumentLoading();
      DownloadDocumentFile({
        fileUrl: doc.contentURL!,
        fileExtension: ext,
        fileName: doc.documentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam === 'Open') {
      setShowActionPopup(false);
      if (
        doc.contentType == 'H' ||
        doc.contentType == 'E' ||
        doc.contentType == 'L'
      ) {
        handleDocumentItemClick(doc, navigation, openInAppBrowser, theme);
        return;
      }

      setDocumentLoading();
      OpenDocumentFile({
        fileUrl: doc.contentURL!,
        fileExtension: ext,
        fileName: doc.documentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam === 'Share') {
      setShowActionPopup(false);
      if (doc.contentType !== 'L') {
        setDocumentLoading();
        ShareDocumentFile({
          fileUrl: doc.contentURL!,
          fileExtension: ext,
          fileName: doc.documentName!,
          onDownloadComplete(fileUri, mime) {
            finish(fileUri);
          },
        });
      } else {
        handleShare({ message: doc.contentURL });
        setIsDownloading(false);
      }
    } else if (ActionParam === 'Cancel') {
      setShowActionPopup(false);
      setSelectedFeaturedItem(undefined);
    }
  };
  const renderSubCategoryItem = (item: PostDocumentMappingListObj) => {
    const {
      documentName,
      displayName,
      description,
      contentURL,
      coverImageURL,
      documentTypeName,
    } = item;

    // derive extension & type label
    const label = documentTypeName ? documentTypeName : t('Attachment');

    return (
      <Shadow
        style={styles.newsCard}
        onPress={() => {
          if (!isDownloading) {
            handleSelectedActionItem('Open', item);
          }
        }}
        onLongPress={() => !isDownloading && handleLongPress(item)}
      >
        <View style={styles.newsContent}>
          <CustomText
            variant={TextVariants.bodyLarge}
            maxLines={2}
            ellipsis={TextEllipsis.tail}
          >
            {displayName ?? documentName}
          </CustomText>
          {description && (
            <CustomText maxLines={3} variant={TextVariants.labelMedium}>
              {description}
            </CustomText>
          )}

          <View style={styles.rowBetween}>
            <View style={styles.tagAndLoader}>
              <View style={styles.newsTag}>
                <CustomText variant={TextVariants.labelSmall}>
                  {label}
                </CustomText>
              </View>

              {item.progress && (
                <ActivityIndicator size={16} style={styles.loaderAfterTag} />
              )}
            </View>

            {item.contentType != 'H' && item.contentType != 'E' && (
              <Tap
                style={styles.iconBgMore}
                onPress={() => {
                  !isDownloading && handleLongPress(item);
                }}
              >
                <CustomImage
                  source={Images.more}
                  type={ImageType.svg}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.moreIcon}
                />
              </Tap>
            )}
          </View>
        </View>

        {coverImageURL && (
          <CustomImage
            source={{ uri: coverImageURL }}
            style={styles.thumbnailImg}
          />
        )}
      </Shadow>
    );
  };

  /** Added by @Yuvraj 05-03-2025 -> initial api for getting event data (FYN-5817) */
  const getEventsForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetEventsForEditModel>({
        endpoint: ApiConstants.GetEventsForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.events) {
        const eventsDetails = data.result.events;

        if (eventsDetails?.strStartDate && eventsDetails?.strEndDate) {
          // Parse start and end dates to Date objects in UTC
          const startingDate = parseDateUtc({
            date: eventsDetails.strStartDate,
            parseFormat: 'DD MMM YYYY hh:mm A',
          });

          const endingDate = parseDateUtc({
            date: eventsDetails.strEndDate,
            parseFormat: 'DD MMM YYYY hh:mm A',
          });

          // Get current local date-time
          const currentDate = parseDateUtc({
            date: dayjs.utc().format('DD MMM YYYY hh:mm A'), // Get current UTC time in required format
            parseFormat: 'DD MMM YYYY hh:mm A',
          });

          if (!startingDate || !endingDate || !currentDate) {
            return;
          }

          // Format dates for display in local time
          setEventData({
            ...eventsDetails,
            strStartDate: formatDateUtcReturnLocalTime({
              date: startingDate,
              returnFormat: 'MMM DD, YYYY hh:mm A',
            }),
            strEndDate: formatDateUtcReturnLocalTime({
              date: endingDate,
              returnFormat: 'MMM DD, YYYY hh:mm A',
            }),
          });

          // Compare dates
          if (endingDate.getTime() < currentDate.getTime()) {
            setStatus({ message: 'Expired', color: theme.colors.error });
          } else if (startingDate.getTime() > currentDate.getTime()) {
            setStatus({ message: 'Upcoming', color: '#ea921c' });
          } else {
            setStatus({ message: 'Ongoing', color: '#0c8820' });
          }
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 07-04-2025 -> initial api for getting event data from advisor end (FYN-6451) */
  const GetGlobalScheduleDetailForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: sendData.ApiEndPoint,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const htmlTitle = processHtmlContent({
          html:
            route?.item?.scheduleTaskTypeId == 4
              ? data.result?.parentActionDetails?.title
              : route?.item?.scheduleTaskTypeId == 3
              ? data.result?.reminderTask?.reminderTitle
              : route?.item?.scheduleTaskTypeId == 5
              ? data.result?.scheduleMessage?.messageText
              : route?.item?.scheduleTaskTypeId == 7
              ? data.result?.scheduleGroupMessage?.messageText
              : `<h4> ${
                  route?.item?.scheduleTaskTypeId == 1 ? route?.item?.title : ''
                } </h4>`,
          showMore: false,
        })?.Content;

        const htmlContent = processHtmlContent({
          html: data.result?.postDetail?.detailHTML ?? '',
          showMore: false,
        })?.Content;

        setGlobalEventData({ ...data.result, htmlTitle, htmlContent });

        if (data.result?.postDetail?.postDocumentMappingList) {
          setResourceList(
            data.result?.postDetail?.postDocumentMappingList ?? [],
          );
        } else {
          setResourceList([]);
        }

        if (route?.item?.event_Start_Date && route?.item?.event_End_Date) {
          // Parse start and end dates to Date objects in UTC
          const startingDate = parseDateUtc({
            date: route?.item?.event_Start_Date,
            parseFormat: 'YYYY-MM-DDTHH:mm:ss',
          });

          const endingDate = parseDateUtc({
            date: route?.item?.event_End_Date,
            parseFormat: 'YYYY-MM-DDTHH:mm:ss',
          });

          // Get current local date-time
          const currentDate = dayjs.utc().toDate();

          if (!startingDate || !endingDate || !currentDate) {
            return;
          }

          // Compare dates
          if (endingDate.getTime() < currentDate.getTime()) {
            setStatus({ message: 'Expired', color: theme.colors.error });
          } else if (startingDate.getTime() > currentDate.getTime()) {
            setStatus({ message: 'Upcoming', color: '#ea921c' });
          } else {
            setStatus({ message: 'Ongoing', color: '#0c8820' });
          }
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={title} />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                if (!loading) {
                  fetchData();
                }
              }}
            />
          }
          contentContainerStyle={styles.scrollView}
        >
          <View style={styles.main}>
            {loading ? (
              <Skeleton>
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonBanner} />
                  <View style={styles.skeletonTitleLay}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonStatus} />
                  </View>

                  <View style={styles.skeletonType} />
                  <View style={styles.skeletonType} />
                  <View style={styles.skeletonDate} />

                  <View style={styles.skeletonDetailTitle} />

                  {[...Array(4).keys()].map((_, index) => (
                    <View key={`event-detail-${index}`}>
                      <View style={styles.skeletonDetail1} />
                      <View style={styles.skeletonDetail2} />
                      <View style={styles.skeletonDetail3} />
                    </View>
                  ))}
                </View>
              </Skeleton>
            ) : userDetails.userDetails?.isAdvisor ? (
              globalEventData ? (
                route?.item?.scheduleTaskTypeId == 2 ? (
                  <View style={styles.container}>
                    <Tap
                      onPress={() => {
                        if (globalEventData?.events?.coverImageUrl) {
                          const imageList = [
                            globalEventData?.events?.coverImageUrl,
                          ];
                          showImagePopup({
                            imageList: imageList,
                            defaultIndex: 0,
                          });
                        }
                      }}
                      style={styles.zeroPadding}
                    >
                      <CustomImage
                        source={
                          globalEventData?.events?.coverImageUrl
                            ? {
                                uri: globalEventData?.events?.coverImageUrl,
                              }
                            : Images.eventBg
                        }
                        resizeMode={ResizeModeType.contain}
                        style={styles.eventCardImage}
                      />
                    </Tap>

                    <View style={styles.infoContainer}>
                      <View style={styles.infoTitleContainer}>
                        <CustomText
                          style={styles.titleText}
                          maxLines={2}
                          variant={TextVariants.titleLarge}
                        >
                          {globalEventData?.events?.title}
                        </CustomText>
                        <CustomText
                          color={status.color}
                          variant={TextVariants.bodyLarge}
                        >
                          {status.message}
                        </CustomText>
                      </View>

                      <View style={styles.detailContainer}>
                        {globalEventData?.events?.location && (
                          <View style={styles.detailSubContainer}>
                            <CustomImage
                              type={ImageType.svg}
                              source={Images.location}
                              color={theme.colors.outline}
                              style={styles.detailImage}
                            />
                            <CustomText
                              color={theme.colors.outline}
                              variant={TextVariants.bodyMedium}
                            >
                              {globalEventData?.events?.location}
                            </CustomText>
                          </View>
                        )}

                        {globalEventData?.events?.eventTypeName && (
                          <View style={styles.detailSubContainer}>
                            <CustomImage
                              type={ImageType.svg}
                              source={
                                globalEventData?.events?.eventType == 1
                                  ? Images.contactUs
                                  : globalEventData?.events?.eventType == 2
                                  ? Images.name
                                  : Images.videocam
                              }
                              color={theme.colors.outline}
                              style={styles.detailImage}
                            />
                            <CustomText
                              color={theme.colors.outline}
                              variant={TextVariants.bodyMedium}
                            >
                              {globalEventData?.events?.eventTypeName}
                            </CustomText>
                          </View>
                        )}

                        {globalEventData?.events?.phone && (
                          <Tap
                            onPress={() => {
                              handleOpenDialer(globalEventData?.events?.phone);
                            }}
                            style={styles.phoneTap}
                          >
                            <View style={styles.detailSubContainer}>
                              <CustomImage
                                type={ImageType.svg}
                                source={Images.mobile}
                                color={theme.colors.outline}
                                style={styles.detailImage}
                              />

                              <CustomText style={styles.underline}>
                                {globalEventData?.events?.phone}
                              </CustomText>
                            </View>
                          </Tap>
                        )}

                        {route.item.event_Start_Date &&
                          route.item.event_End_Date && (
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
                                {`${formatDateUtcReturnLocalTime({
                                  date: route.item.event_Start_Date,
                                  parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                                  returnFormat: 'MMM DD, YYYY hh:mm A',
                                })}  -  ${formatDateUtcReturnLocalTime({
                                  date: route.item.event_End_Date,
                                  parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                                  returnFormat: 'MMM DD, YYYY hh:mm A',
                                })}`}
                              </CustomText>
                            </View>
                          )}

                        {globalEventData?.events?.link &&
                          globalEventData?.events?.eventType == 3 &&
                          status.message != 'Expired' && (
                            <Shadow
                              onPress={() =>
                                openUrl(globalEventData?.events?.link)
                              }
                              style={styles.joinButton}
                            >
                              <CustomText
                                style={styles.buttonText}
                                color={theme.colors.onPrimary}
                                variant={TextVariants.bodyMedium}
                              >
                                {t('JoinEvent')}
                              </CustomText>
                            </Shadow>
                          )}
                      </View>

                      {globalEventData?.events?.description && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('Description')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {globalEventData?.events?.description}
                          </CustomText>
                        </>
                      )}

                      {globalEventData?.events?.organizer && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('Organizer')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {globalEventData?.events?.organizer}
                          </CustomText>
                        </>
                      )}

                      {globalEventData?.events?.additionalInformation && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('AdditionalInformation')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {globalEventData?.events?.additionalInformation}
                          </CustomText>
                        </>
                      )}

                      {(globalEventData?.tags ||
                        globalEventData?.programs ||
                        globalEventData?.users ||
                        globalEventData?.contactType) && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {globalEventData?.tags
                              ? t('AudienceTags')
                              : globalEventData?.programs
                              ? t('AudienceExperiences')
                              : globalEventData?.users
                              ? t('AudienceContacts')
                              : t('AudienceContactType')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {globalEventData?.tags
                              ? globalEventData?.tags
                              : globalEventData?.programs
                              ? globalEventData?.programs
                              : globalEventData?.users
                              ? globalEventData?.users
                              : globalEventData?.contactType}
                          </CustomText>
                        </>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.container}>
                    <View style={styles.detailContainer}>
                      {route?.item?.event_Start_Date &&
                        route.item.event_End_Date && (
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
                              {formatDateUtcReturnLocalTime({
                                date: route.item.event_Start_Date,
                                parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                                returnFormat: 'MMM DD, YYYY hh:mm A',
                              })}
                            </CustomText>
                          </View>
                        )}
                    </View>

                    {route?.item?.scheduleTaskTypeId == 1 && (
                      <>
                        <CustomText
                          style={styles.bottomInfoText}
                          variant={TextVariants.bodyLarge}
                        >
                          {t('PostContent')}
                        </CustomText>
                        <HtmlRender
                          style={styles.details}
                          openLinks={openInAppBrowser}
                          html={globalEventData?.htmlContent}
                        />
                      </>
                    )}
                    {(route?.item?.scheduleTaskTypeId == 4 ||
                      route?.item?.scheduleTaskTypeId == 3 ||
                      route?.item?.scheduleTaskTypeId == 5 ||
                      route?.item?.scheduleTaskTypeId == 7) && (
                      <>
                        <CustomText
                          style={styles.bottomInfoText}
                          variant={TextVariants.bodyLarge}
                        >
                          {t('Description')}
                        </CustomText>
                        <HtmlRender
                          style={styles.details}
                          openLinks={openInAppBrowser}
                          html={globalEventData?.htmlTitle}
                        />
                      </>
                    )}

                    {route?.item?.scheduleTaskTypeId == 1 &&
                      globalEventData?.postDetail?.postImageMappings &&
                      globalEventData?.postDetail?.postImageMappings?.length >
                        0 &&
                      (globalEventData?.postDetail?.postImageMappings?.length ==
                        1 &&
                      globalEventData?.postDetail?.postImageMappings?.at(0)
                        ?.contentTypeStr == 'Document' ? (
                        <View style={styles.singlePostPdf}>
                          {globalEventData?.postDetail?.postImageMappings?.map(
                            (item, index) => {
                              return (
                                <PdfPreview
                                  key={index}
                                  pdfUrl={item.postImageUrl!}
                                  openLinks={openInAppBrowser}
                                  enablePaging
                                  pageNoDirection={Direction.left}
                                  style={styles.pdf}
                                />
                              );
                            },
                          )}
                        </View>
                      ) : (
                        <View>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('Attachment')}
                          </CustomText>
                          <CustomCarousel
                            data={
                              globalEventData?.postDetail?.postImageMappings!
                            }
                            aspectRatio={0.72}
                            children={(eventItem, index) =>
                              eventItem.contentTypeStr == 'Document' ? (
                                <View>
                                  <PdfPreview
                                    key={index}
                                    pdfUrl={eventItem.postImageUrl!}
                                    openLinks={openInAppBrowser}
                                    enablePaging
                                    pageNoDirection={Direction.left}
                                    style={styles.pdf}
                                    showPageNumber={false}
                                  />
                                  <CustomImage
                                    source={Images.pdf}
                                    style={styles.pdfIcon}
                                    type={ImageType.svg}
                                  />
                                </View>
                              ) : (
                                <View>
                                  <Tap
                                    onPress={() => {
                                      if (eventItem.postImageUrl) {
                                        const imageList = [
                                          eventItem.postImageUrl,
                                        ];
                                        showImagePopup({
                                          imageList: imageList,
                                          defaultIndex: 0,
                                        });
                                      }
                                    }}
                                    style={styles.carouselTap}
                                  >
                                    <CustomImage
                                      resizeMode={ResizeModeType.contain}
                                      source={{ uri: eventItem.postImageUrl }}
                                      style={styles.eventDetailCardImage}
                                    />
                                  </Tap>
                                </View>
                              )
                            }
                          />
                        </View>
                      ))}

                    {route?.item?.scheduleTaskTypeId == 1 &&
                      resourceList.length! > 0 && (
                        <View>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('Attachment')}
                          </CustomText>
                          <CustomCarousel
                            style={{ right: 0 }}
                            data={resourceList}
                            aspectRatio={0.43}
                            children={(item, index) => (
                              <View style={styles.cardWrapper}>
                                {renderSubCategoryItem(item)}
                              </View>
                            )}
                          />
                        </View>
                      )}

                    <View style={styles.infoContainer}>
                      {/* <HtmlRender
                        style={styles.titleText}
                        openLinks={openInAppBrowser}
                        // variant={TextVariants.titleLarge}
                        html={globalEventData.htmlTitle} //dont remove the space inside the h4 tag, useful for links
                      /> */}

                      {(globalEventData?.messageType == 'I' ||
                        globalEventData?.messageType == 'F') && (
                        <Tap
                          onPress={() => {
                            if (globalEventData?.imageURL) {
                              if (globalEventData?.messageType == 'I') {
                                const imageList = [globalEventData?.imageURL];
                                showImagePopup({
                                  imageList: imageList,
                                  defaultIndex: 0,
                                });
                              } else {
                                setShowImageSendPopup(true);
                              }
                            }
                          }}
                          style={styles.zeroPadding}
                        >
                          <>
                            <CustomText
                              style={styles.bottomInfoText}
                              variant={TextVariants.bodyLarge}
                            >
                              {t('Attachment')}
                            </CustomText>
                            <CustomImage
                              source={
                                globalEventData?.messageType == 'I'
                                  ? {
                                      uri: globalEventData?.imageURL,
                                    }
                                  : Images.pdf
                              }
                              type={
                                globalEventData?.messageType == 'I'
                                  ? undefined
                                  : ImageType.svg
                              }
                              color={
                                globalEventData?.messageType == 'I'
                                  ? undefined
                                  : theme.colors.outline
                              }
                              style={
                                globalEventData?.messageType == 'I'
                                  ? styles.eventDetailCardImage
                                  : styles.eventDetailCardPdfIcon
                              }
                              resizeMode={ResizeModeType.contain}
                            />
                          </>
                        </Tap>
                      )}

                      {route?.item?.scheduleTaskTypeId == 4 && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('DueDate')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {formatDateUtcReturnLocalTime({
                              date: globalEventData?.parentActionDetails
                                ?.dueDate!,
                              parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                              returnFormat: 'MMM DD, YYYY',
                            })}
                          </CustomText>
                        </>
                      )}

                      {(route?.item?.scheduleTaskTypeId == 1 ||
                        route?.item?.scheduleTaskTypeId == 4 ||
                        route?.item?.scheduleTaskTypeId == 3 ||
                        route?.item?.scheduleTaskTypeId == 5 ||
                        route?.item?.scheduleTaskTypeId == 7) && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {t('Created by')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {route?.item?.scheduleTaskTypeId == 1
                              ? globalEventData?.postDetail?.userName
                              : route?.item?.scheduleTaskTypeId == 3
                              ? globalEventData?.reminderTask?.assignedBy
                              : route?.item?.scheduleTaskTypeId == 4
                              ? globalEventData?.parentActionDetails?.assignedBy
                              : route?.item?.scheduleTaskTypeId == 5
                              ? globalEventData?.scheduleMessage?.assignedBy
                              : globalEventData?.scheduleGroupMessage
                                  ?.assignedBy}
                          </CustomText>

                          {fromSelf === false && (
                            <>
                              <CustomText
                                style={styles.bottomInfoText}
                                variant={TextVariants.bodyLarge}
                              >
                                {t('OnBehalfOf')}
                              </CustomText>
                              <CustomText style={styles.details}>
                                {'Primary Advisor'}
                              </CustomText>
                            </>
                          )}
                        </>
                      )}

                      {(globalEventData?.tags ||
                        globalEventData?.programs ||
                        globalEventData?.users ||
                        globalEventData?.contactType) && (
                        <>
                          <CustomText
                            style={styles.bottomInfoText}
                            variant={TextVariants.bodyLarge}
                          >
                            {globalEventData?.tags
                              ? t('AudienceTags')
                              : globalEventData?.programs
                              ? t('AudienceExperiences')
                              : globalEventData?.users
                              ? t('AudienceContacts')
                              : t('AudienceContactType')}
                          </CustomText>
                          <CustomText style={styles.details}>
                            {globalEventData?.tags
                              ? globalEventData?.tags
                              : globalEventData?.programs
                              ? globalEventData?.programs
                              : globalEventData?.users
                              ? globalEventData?.users
                              : globalEventData?.contactType}
                          </CustomText>
                        </>
                      )}
                    </View>
                  </View>
                )
              ) : (
                <EmptyView label={t('EventNotExist')} />
              )
            ) : eventData ? (
              <View style={styles.container}>
                <Tap
                  onPress={() => {
                    if (eventData?.coverImageUrl) {
                      const imageList = [eventData?.coverImageUrl];
                      showImagePopup({
                        imageList: imageList,
                        defaultIndex: 0,
                      });
                    }
                  }}
                  style={styles.zeroPadding}
                >
                  <CustomImage
                    source={
                      eventData?.coverImageUrl
                        ? {
                            uri: eventData?.coverImageUrl,
                          }
                        : Images.eventBg
                    }
                    style={styles.eventCardImage}
                  />
                </Tap>

                <View style={styles.infoContainer}>
                  <View style={styles.infoTitleContainer}>
                    <CustomText
                      style={styles.titleText}
                      variant={TextVariants.titleLarge}
                    >
                      {eventData?.title}
                    </CustomText>
                    <CustomText
                      color={status.color}
                      style={styles.marginTop}
                      variant={TextVariants.bodyLarge}
                    >
                      {status.message}
                    </CustomText>
                  </View>

                  <View style={styles.detailContainer}>
                    {eventData?.eventTypeName && (
                      <View style={styles.detailSubContainer}>
                        <CustomImage
                          type={ImageType.svg}
                          source={
                            eventData?.eventType == 1
                              ? Images.contactUs
                              : eventData?.eventType == 2
                              ? Images.name
                              : Images.videocam
                          }
                          color={theme.colors.outline}
                          style={styles.detailImage}
                        />
                        <CustomText
                          color={theme.colors.outline}
                          variant={TextVariants.bodyMedium}
                        >
                          {eventData?.eventTypeName}
                        </CustomText>
                      </View>
                    )}

                    {eventData?.phone && (
                      <Tap
                        onPress={() => {
                          handleOpenDialer(eventData?.phone);
                        }}
                        style={styles.phoneTap}
                      >
                        <View style={styles.detailSubContainer}>
                          <CustomImage
                            type={ImageType.svg}
                            source={Images.mobile}
                            color={theme.colors.outline}
                            style={styles.detailImage}
                          />

                          <CustomText style={styles.underline}>
                            {eventData?.phone}
                          </CustomText>
                        </View>
                      </Tap>
                    )}

                    {eventData?.location && (
                      <View style={styles.detailSubContainer}>
                        <CustomImage
                          type={ImageType.svg}
                          source={Images.location}
                          color={theme.colors.outline}
                          style={styles.detailImage}
                        />
                        <CustomText
                          color={theme.colors.outline}
                          variant={TextVariants.bodyMedium}
                        >
                          {eventData?.location}
                        </CustomText>
                      </View>
                    )}

                    {eventData?.strStartDate && eventData?.strEndDate && (
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
                          {`${eventData?.strStartDate}  -  ${eventData?.strEndDate}`}
                        </CustomText>
                      </View>
                    )}

                    {eventData?.link &&
                      eventData?.eventType == 3 &&
                      status.message != 'Expired' && (
                        <Shadow
                          onPress={() => openUrl(eventData?.link)}
                          style={styles.joinButton}
                        >
                          <CustomText
                            style={styles.buttonText}
                            color={theme.colors.onPrimary}
                            variant={TextVariants.bodyMedium}
                          >
                            {t('JoinEvent')}
                          </CustomText>
                        </Shadow>
                      )}
                  </View>

                  {eventData?.description && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {t('Description')}
                      </CustomText>
                      <CustomText style={styles.details}>
                        {eventData?.description}
                      </CustomText>
                    </>
                  )}

                  {eventData?.organizer && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {t('Organizer')}
                      </CustomText>
                      <CustomText style={styles.details}>
                        {eventData?.organizer}
                      </CustomText>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <EmptyView label={t('EventNotExist')} />
            )}
          </View>
        </ScrollView>

        <CustomFullScreenPopup
          shown={showImageSendPopup}
          setShown={setShowImageSendPopup}
        >
          <View style={styles.imageSendMain}>
            <View style={styles.main}>
              <PdfPreview
                pdfUrl={globalEventData?.imageURL!}
                openLinks={openInAppBrowser}
                enablePaging
                pageNoDirection={Direction.left}
                style={styles.pdf}
              />
            </View>
            <Tap
              style={styles.backBtnLay}
              onPress={() => {
                setShowImageSendPopup(false);
              }}
            >
              <CustomImage
                source={Images.close}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.backBtn}
              />
            </Tap>
          </View>
        </CustomFullScreenPopup>

        <CustomActionSheetPoup
          shown={showActionPopup}
          setShown={setShowActionPopup}
          hideIcons={false}
          centered={false}
          onCancelClick={() => handleSelectedActionItem('Cancel')}
          children={[
            {
              title: 'Open',
              image: Images.link, // Replace with your icon
              imageType: ImageType.svg,
              onPress: () => {
                // SelectedFeaturedItem?.documentTypeName?.includes('Excel')
                //   ? handleSelectedActionItem('Download')
                //   :
                handleSelectedActionItem('Open');
              },
            },
            ...(SelectedFeaturedItem?.contentType != 'L'
              ? [
                  {
                    title: 'Download',
                    image: Images.download, // Replace with your icon
                    imageType: ImageType.svg,
                    onPress: () => handleSelectedActionItem('Download'),
                  },
                ]
              : []),
            {
              title: 'Share',
              image: Images.share, // Replace with your icon
              imageType: ImageType.svg,
              onPress: () => handleSelectedActionItem('Share'),
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
    scrollView: { flexGrow: 1, justifyContent: 'center' },
    container: {
      flex: 1,
      padding: 20,
    },
    eventDetailCardImage: {
      width: '100%',
      height: 250,
      marginTop: 5,
      borderRadius: theme.roundness,
    },
    eventDetailCardPdfIcon: {
      width: '100%',
      height: 150,
      marginTop: 5,
      borderRadius: theme.roundness,
    },
    eventCardImage: {
      width: '100%',
      aspectRatio: 1.5,
      borderRadius: theme.roundness,
    },
    infoContainer: {
      paddingVertical: 0,
    },
    infoTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    marginTop: {
      marginTop: 1.5,
    },
    titleText: {
      flex: 1,
    },
    detailContainer: {
      gap: 10,
      paddingBottom: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outline,
      marginVertical: 10,
      marginRight: 10,
    },
    phoneTap: {
      padding: 0,
      alignSelf: 'flex-start',
    },
    detailSubContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    detailImage: {
      height: 20,
      width: 20,
      marginTop: 2,
    },
    joinButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      textAlign: 'center',
    },
    bottomInfoText: {
      marginTop: 5,
    },
    detailsTitle: {
      marginTop: 30,
    },
    details: {
      marginTop: 5,
      marginBottom: 10,
    },
    skeletonMain: { width: '100%', padding: 20 },
    skeletonBanner: {
      width: '100%',
      height: 150,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonTitleLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    skeletonTitle: {
      width: '50%',
      height: 25,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonStatus: {
      width: '20%',
      height: 25,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonType: {
      width: '30%',
      height: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 20,
    },
    skeletonDate: {
      width: '80%',
      height: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 10,
    },
    skeletonDetailTitle: {
      width: '20%',
      height: 25,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 60,
    },
    skeletonDetail1: {
      width: '80%',
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 20,
    },
    skeletonDetail2: {
      width: '70%',
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 5,
    },
    skeletonDetail3: {
      width: '60%',
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 5,
    },
    zeroPadding: {
      padding: 0,
    },
    carouselTap: {
      padding: 0,
      width: '90%',
      marginVertical: 'auto',
    },
    underline: {
      textDecorationLine: 'underline',
    },
    imageSendMain: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    pdf: {
      height: '100%',
      width: '100%',
    },
    backBtnLay: { padding: 10, position: 'absolute' },
    backBtn: {
      height: 40,
      width: 40,
    },
    singlePostPdf: {
      height: 300,
    },
    pdfIcon: {
      height: 50,
      width: 50,
      position: 'absolute',
      bottom: 5,
      left: 5,
    },
    newsCard: {
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      width: '100%', // fill whatever parent width you give it
      flexDirection: 'row',
      marginVertical: 2,
      padding: 12,
    },
    cardWrapper: {
      width: '90%', // match your itemSize
      alignContent: 'center',
      alignItems: 'center',
    },
    thumbnailImg: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    TapViewContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    newsContent: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'space-between',
      gap: 5,
    },
    newsTag: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      alignSelf: 'flex-start',
    },
    flatListContainerStyleHorizontal: {
      paddingHorizontal: 16, // optional side‐padding
      alignItems: 'center', // center cards vertically
    },
    filterContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      borderColor: theme.colors.primary,
      padding: 5,
      margin: 5,
      alignSelf: 'center',
    },
    filterText: {
      marginHorizontal: 4,
      marginBottom: 2,
    },
    filterScrollView: {
      marginHorizontal: 15,
      paddingBottom: 5,
    },
    moreIcon: {
      height: 17,
      width: 17,
    },

    iconBgMore: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 7,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      paddingVertical: 2,
      width: 25,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    tagAndLoader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    loaderAfterTag: {
      marginLeft: 8, // puts loader right after the tag
    },
  });

export default EventDetailScreen;
