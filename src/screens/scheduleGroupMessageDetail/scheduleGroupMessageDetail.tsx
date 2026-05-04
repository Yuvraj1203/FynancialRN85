// src/screens/scheduleDetails/GroupMessageDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import {
  CustomImage,
  CustomText,
  HtmlRender,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { Direction } from '@/components/atoms/customButton/customButton';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
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
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
} from '@/services/models';

import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';

import { useAppRoute } from '@/utils/navigationUtils';
import {
  formatDateUtcReturnLocalTime,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export type ScheduleGroupMessageDetailProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
};

const enum DateFormats {
  ScheduleAPIDateFormat = 'YYYY-MM-DDTHH:mm:ss',
  ScheduleUIDateFormat = 'MMM DD, YYYY hh:mm A',
}

const ScheduleGroupMessageDetail = () => {
  const route = useAppRoute('ScheduleGroupMessageDetail').params as {
    item?: GetScheduleTasksForGlobalCalendarModel;
  };
  const item = route?.item;

  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const userDetails = userStore();
  const openInAppBrowser = useCustomInAppBrowser();

  const [loading, setLoading] = useState(false);
  const [groupMessageDetail, setGroupMessageDetail] =
    useState<GetGlobalScheduleDetailForEditModel>();
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    if (!item?.taskIdentifier) return;
    GetGlobalScheduleGroupMsgDetailApi.mutate({ Id: item.taskIdentifier });
  };

  const GetGlobalScheduleGroupMsgDetailApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalGroupMessageForEdit,
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
    onSuccess(resp) {
      if (!resp.result) return;

      const htmlTitle = processHtmlContent({
        html: `<light-value-text>${
          resp.result?.scheduleGroupMessage?.messageText ?? ''
        }</light-value-text>`,
        showMore: false,
      })?.Content;

      setGroupMessageDetail({ ...resp.result, htmlTitle });
    },
    onError(err: any) {
      showSnackbar(err.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('GroupMessage')} />

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
            ) : groupMessageDetail ? (
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
                  {t('Description')}
                </CustomText>

                <HtmlRender
                  style={styles.details}
                  openLinks={openInAppBrowser}
                  html={groupMessageDetail?.htmlTitle}
                />

                {(groupMessageDetail?.messageType === 'I' ||
                  groupMessageDetail?.messageType === 'F') &&
                  !!groupMessageDetail?.imageURL && (
                    <Tap
                      onPress={() => {
                        if (groupMessageDetail?.messageType === 'I') {
                          showImagePopup({
                            imageList: [groupMessageDetail?.imageURL!],
                            defaultIndex: 0,
                          });
                        } else {
                          setShowPdfPopup(true);
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
                            groupMessageDetail?.messageType === 'I'
                              ? { uri: groupMessageDetail?.imageURL }
                              : Images.pdf
                          }
                          type={
                            groupMessageDetail?.messageType === 'I'
                              ? undefined
                              : ImageType.svg
                          }
                          color={
                            groupMessageDetail?.messageType === 'I'
                              ? undefined
                              : theme.colors.outline
                          }
                          style={
                            groupMessageDetail?.messageType === 'I'
                              ? styles.eventDetailCardImage
                              : styles.eventDetailCardPdfIcon
                          }
                          resizeMode={ResizeModeType.contain}
                        />
                      </>
                    </Tap>
                  )}

                <CustomText
                  style={styles.bottomInfoText}
                  variant={TextVariants.bodyLarge}
                >
                  {t('Created by')}
                </CustomText>
                <CustomText style={styles.details} color={theme.colors.outline}>
                  {groupMessageDetail?.scheduleGroupMessage?.assignedBy}
                </CustomText>

                {groupMessageDetail?.scheduleGroupMessage?.fromSelf ===
                  false && (
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

                {(groupMessageDetail?.tags ||
                  groupMessageDetail?.programs ||
                  groupMessageDetail?.users ||
                  groupMessageDetail?.contactType) && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {groupMessageDetail?.tags
                        ? t('AudienceTags')
                        : groupMessageDetail?.programs
                        ? t('AudienceExperiences')
                        : groupMessageDetail?.users
                        ? t('AudienceContacts')
                        : t('AudienceContactType')}
                    </CustomText>
                    <CustomText
                      style={styles.details}
                      color={theme.colors.outline}
                    >
                      {groupMessageDetail?.tags
                        ? groupMessageDetail?.tags
                        : groupMessageDetail?.programs
                        ? groupMessageDetail?.programs
                        : groupMessageDetail?.users
                        ? groupMessageDetail?.users
                        : groupMessageDetail?.contactType}
                    </CustomText>
                  </>
                )}
              </View>
            ) : (
              <EmptyView label={t('EventNotExist')} />
            )}
          </View>
        </ScrollView>

        <CustomFullScreenPopup shown={showPdfPopup} setShown={setShowPdfPopup}>
          <View style={styles.imageSendMain}>
            <View style={styles.main}>
              <PdfPreview
                pdfUrl={groupMessageDetail?.imageURL!}
                openLinks={openInAppBrowser}
                enablePaging
                pageNoDirection={Direction.left}
                style={styles.pdf}
              />
            </View>

            <Tap
              style={styles.backBtnLay}
              onPress={() => setShowPdfPopup(false)}
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
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    scrollView: { flexGrow: 1, justifyContent: 'center' },
    container: { flex: 1, padding: 20 },

    zeroPadding: { padding: 0 },
    bottomInfoText: { marginTop: 5 },
    details: { marginTop: 5, marginBottom: 10 },

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

    imageSendMain: { flex: 1, backgroundColor: theme.colors.surface },
    pdf: { height: '100%', width: '100%' },
    backBtnLay: { padding: 10, position: 'absolute' },
    backBtn: { height: 40, width: 40 },

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
      borderRadius: theme.roundness,
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
  });

export default ScheduleGroupMessageDetail;
