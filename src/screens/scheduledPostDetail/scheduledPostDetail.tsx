// src/screens/scheduleDetails/PostDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

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

import {
  formatDateUtcReturnLocalTime,
  getFileExtension,
  handleDocumentItemClick,
  handleShare,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';

import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export type ScheduledPostDetailProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
};
const enum DateFormats {
  ScheduleAPIDateFormat = 'YYYY-MM-DDTHH:mm:ss',
  ScheduleUIDateFormat = 'MMM DD, YYYY hh:mm A',
}
const ScheduledPostDetail = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute('ScheduledPostDetail').params;

  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const userDetails = userStore();
  const openInAppBrowser = useCustomInAppBrowser();

  const item = route?.item;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', color: '' });

  const [postDetail, setPostDetail] =
    useState<GetGlobalScheduleDetailForEditModel>();

  const [resourceList, setResourceList] = useState<
    PostDocumentMappingListObj[]
  >([]);

  // Document actions
  const [SelectedFeaturedItem, setSelectedFeaturedItem] =
    useState<PostDocumentMappingListObj>();
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    if (!item?.taskIdentifier) return;
    GetGlobalSchedulePostDetailApi.mutate({ Id: item.taskIdentifier });
  };

  const handleLongPress = (doc: PostDocumentMappingListObj) => {
    setSelectedFeaturedItem(doc);
    if (doc.contentType != 'H' && doc.contentType != 'E')
      setShowActionPopup(true);
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
        prev?.map(it =>
          it.contentDataId == doc.contentDataId
            ? { ...it, progress: undefined }
            : it,
        ),
      );
      if (!fileUri) showSnackbar(t('SomeErrorOccured'), 'danger');
    };

    const setDocumentLoading = () => {
      setIsDownloading(true);
      setResourceList(prev =>
        prev?.map(it =>
          it.contentDataId == doc.contentDataId ? { ...it, progress: '1' } : it,
        ),
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
          onDownloadComplete(fileUri) {
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

  const GetGlobalSchedulePostDetailApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalPostForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate() {
      setLoading(true);
    },
    onSettled() {
      setLoading(false);
    },
    onSuccess(data) {
      if (!data.result) return;

      const htmlContent = processHtmlContent({
        html: `<light-value-text>${
          data.result?.postDetail?.detailHTML ?? ''
        }</light-value-text>`,
        showMore: false,
      })?.Content;

      setPostDetail({ ...data.result, htmlContent });

      if (data.result?.postDetail?.postDocumentMappingList) {
        setResourceList(data.result.postDetail.postDocumentMappingList ?? []);
      } else {
        setResourceList([]);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const renderDocCard = (doc: PostDocumentMappingListObj) => {
    const label = doc.documentTypeName ? doc.documentTypeName : t('Attachment');

    return (
      <Shadow
        style={styles.newsCard}
        onPress={() => !isDownloading && handleSelectedActionItem('Open', doc)}
        onLongPress={() => !isDownloading && handleLongPress(doc)}
      >
        <View style={styles.newsContent}>
          <CustomText
            variant={TextVariants.bodyLarge}
            maxLines={2}
            ellipsis={TextEllipsis.tail}
          >
            {doc.displayName ?? doc.documentName}
          </CustomText>

          {!!doc.description && (
            <CustomText maxLines={3} variant={TextVariants.labelMedium}>
              {doc.description}
            </CustomText>
          )}

          <View style={styles.rowBetween}>
            <View style={styles.tagAndLoader}>
              <View style={styles.newsTag}>
                <CustomText variant={TextVariants.labelSmall}>
                  {label}
                </CustomText>
              </View>

              {doc.progress && (
                <ActivityIndicator size={16} style={styles.loaderAfterTag} />
              )}
            </View>

            {doc.contentType != 'H' && doc.contentType != 'E' && (
              <Tap
                style={styles.iconBgMore}
                onPress={() => !isDownloading && handleLongPress(doc)}
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

        {!!doc.coverImageURL && (
          <CustomImage
            source={{ uri: doc.coverImageURL }}
            style={styles.thumbnailImg}
          />
        )}
      </Shadow>
    );
  };

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('Post')} />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => !loading && fetchData()}
            />
          }
          contentContainerStyle={styles.scrollView}
        >
          <View style={styles.main}>
            {loading ? (
              <Skeleton>
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonDateContainer}>
                    <View style={styles.skeletonDateRow}>
                      <View style={styles.skeletonIcon} />
                      <View style={styles.skeletonDateText} />
                    </View>
                  </View>

                  <View style={styles.skeletonSectionTitle} />

                  <View style={styles.skeletonHtmlLine1} />
                  <View style={styles.skeletonHtmlLine2} />
                  <View style={styles.skeletonHtmlLine3} />

                  <View style={styles.skeletonSectionTitleSmall} />

                  <View style={styles.skeletonCarouselBox} />

                  <View style={styles.skeletonSectionTitleSmall} />
                  <View style={styles.skeletonNameLine} />

                  <View style={styles.skeletonSectionTitleSmall} />
                  <View style={styles.skeletonNameLine} />

                  <View style={styles.skeletonSectionTitleSmall} />
                  <View style={styles.skeletonNameLine} />
                </View>
              </Skeleton>
            ) : postDetail ? (
              <View style={styles.container}>
                {item?.event_Start_Date && (
                  <View style={styles.detailContainer}>
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
                          date: item.event_Start_Date,
                          parseFormat: DateFormats.ScheduleAPIDateFormat,
                          returnFormat: DateFormats.ScheduleUIDateFormat,
                        })}
                      </CustomText>
                    </View>
                  </View>
                )}

                <CustomText
                  style={styles.bottomInfoText}
                  variant={TextVariants.bodyLarge}
                >
                  {t('PostContent')}
                </CustomText>

                <HtmlRender
                  style={styles.details}
                  openLinks={openInAppBrowser}
                  html={postDetail?.htmlContent}
                />

                {postDetail?.postDetail?.postImageMappings?.length! > 0 && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {t('Attachment')}
                    </CustomText>

                    <CustomCarousel
                      data={
                        postDetail?.postDetail?.postImageMappings?.reverse()!
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
                                  showImagePopup({
                                    imageList: [eventItem.postImageUrl],
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
                  </>
                )}

                {resourceList?.length > 0 && (
                  <>
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
                      children={doc => (
                        <View style={styles.cardWrapper}>
                          {renderDocCard(doc)}
                        </View>
                      )}
                    />
                  </>
                )}

                <CustomText
                  style={styles.bottomInfoText}
                  variant={TextVariants.bodyLarge}
                >
                  {t('Created by')}
                </CustomText>
                <CustomText style={styles.details} color={theme.colors.outline}>
                  {postDetail?.postDetail?.userName}
                </CustomText>

                {postDetail?.postDetail?.fromSelf === false && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {t('OnBehalfOf')}
                    </CustomText>
                    <CustomText
                      style={styles.details}
                      color={theme.colors.outline}
                    >
                      {t('PrimaryAdvisor')}
                    </CustomText>
                  </>
                )}

                {(postDetail?.tags ||
                  postDetail?.programs ||
                  postDetail?.users ||
                  postDetail?.contactType) && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {postDetail?.tags
                        ? t('AudienceTags')
                        : postDetail?.programs
                        ? t('AudienceExperiences')
                        : postDetail?.users
                        ? t('AudienceContacts')
                        : t('AudienceContactType')}
                    </CustomText>
                    <CustomText
                      style={styles.details}
                      color={theme.colors.outline}
                    >
                      {postDetail?.tags
                        ? postDetail?.tags
                        : postDetail?.programs
                        ? postDetail?.programs
                        : postDetail?.users
                        ? postDetail?.users
                        : postDetail?.contactType}
                    </CustomText>
                  </>
                )}
              </View>
            ) : (
              <EmptyView label={t('EventNotExist')} />
            )}
          </View>
        </ScrollView>

        <CustomActionSheetPoup
          shown={showActionPopup}
          setShown={setShowActionPopup}
          hideIcons={false}
          centered={false}
          onCancelClick={() => handleSelectedActionItem('Cancel')}
          children={[
            {
              title: 'Open',
              image: Images.link,
              imageType: ImageType.svg,
              onPress: () => handleSelectedActionItem('Open'),
            },
            ...(SelectedFeaturedItem?.contentType != 'L'
              ? [
                  {
                    title: 'Download',
                    image: Images.download,
                    imageType: ImageType.svg,
                    onPress: () => handleSelectedActionItem('Download'),
                  },
                ]
              : []),
            {
              title: 'Share',
              image: Images.share,
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
    main: { flex: 1 },
    scrollView: { flexGrow: 1, justifyContent: 'center' },
    container: { flex: 1, padding: 20 },

    eventDetailCardImage: {
      width: '100%',
      height: 250,
      marginTop: 5,
      borderRadius: theme.roundness,
    },

    detailContainer: {
      gap: 10,
      paddingBottom: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outline,
      marginVertical: 10,
      marginRight: 10,
    },
    detailSubContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    detailImage: { height: 20, width: 20, marginTop: 2 },

    bottomInfoText: { marginTop: 5 },
    details: { marginTop: 5, marginBottom: 10 },

    skeletonMain: { width: '100%', padding: 20 },

    skeletonDateContainer: {
      gap: 10,
      paddingBottom: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outline,
      marginVertical: 10,
      marginRight: 10,
    },

    skeletonDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    skeletonIcon: {
      height: 20,
      width: 20,
      borderRadius: 6,
      backgroundColor: theme.colors.surface,
    },

    skeletonDateText: {
      width: '75%',
      height: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },

    skeletonSectionTitle: {
      width: '35%',
      height: 18,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 5,
    },

    skeletonSectionTitleSmall: {
      width: '25%',
      height: 18,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 22,
    },
    skeletonHtmlLine1: {
      width: '90%',
      height: 14,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 14,
    },
    skeletonHtmlLine2: {
      width: '80%',
      height: 14,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 8,
    },
    skeletonHtmlLine3: {
      width: '70%',
      height: 14,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 8,
    },
    skeletonCarouselBox: {
      width: '100%',
      height: 230,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 12,
    },
    skeletonNameLine: {
      width: '45%',
      height: 14,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 10,
    },

    carouselTap: { padding: 0, width: '90%', marginVertical: 'auto' },
    pdf: { height: '100%', width: '100%' },
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
      width: '100%',
      flexDirection: 'row',
      marginVertical: 2,
      padding: 12,
    },
    cardWrapper: { width: '90%', alignContent: 'center', alignItems: 'center' },
    thumbnailImg: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
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
    moreIcon: { height: 17, width: 17 },
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
    tagAndLoader: { flexDirection: 'row', alignItems: 'center' },
    loaderAfterTag: { marginLeft: 8 },
  });

export default ScheduledPostDetail;
