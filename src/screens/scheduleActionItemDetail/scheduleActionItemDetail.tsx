// src/screens/scheduleDetails/ActionItemDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { CustomText, HtmlRender, Skeleton } from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';

import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
} from '@/services/models';

import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';

import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import { Images } from '@/theme/assets/images';
import { useAppRoute } from '@/utils/navigationUtils';
import {
  formatDate,
  formatDateUtcReturnLocalTime,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export type ScheduleActionItemDetailProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
};
const enum DateFormats {
  ScheduleAPIDateFormat = 'DD MMM YYYY hh:mm A',
  ScheduleUIDateFormat = 'MMM DD, YYYY hh:mm A',
  DueDateAPIFormat = 'YYYY-MM-DDTHH:mm:ss',
  DueDateUIFormat = 'MMM DD, YYYY',
}

const ScheduleActionItemDetail = () => {
  const route = useAppRoute('ScheduleActionItemDetail').params;
  const item = route?.item;

  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const userDetails = userStore();
  const openInAppBrowser = useCustomInAppBrowser();

  const [loading, setLoading] = useState(false);
  const [actionItemDetail, setActionItemDetail] =
    useState<GetGlobalScheduleDetailForEditModel>();

  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    if (!item?.taskIdentifier) return;
    GetGlobalScheduleActionItemDetailApi.mutate({ Id: item.taskIdentifier });
  };

  const GetGlobalScheduleActionItemDetailApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalActionItemForEdit,
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
          resp.result?.parentActionDetails?.title ?? ''
        }</light-value-text>`,
        showMore: false,
      })?.Content;

      setActionItemDetail({ ...resp.result, htmlTitle });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('ActionItem')} />

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
                  <View style={styles.skeletonNameLine} />

                  <View style={styles.skeletonSectionTitleSmall} />
                  <View style={styles.skeletonNameLine} />

                  <View style={styles.skeletonSectionTitleSmall} />
                  <View style={styles.skeletonNameLine} />
                </View>
              </Skeleton>
            ) : actionItemDetail ? (
              <View style={styles.container}>
                {actionItemDetail.parentActionDetails?.scheduleDateTime && (
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
                          date: actionItemDetail.parentActionDetails
                            ?.scheduleDateTime,
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
                  html={actionItemDetail?.htmlTitle}
                />

                {!!actionItemDetail?.parentActionDetails?.dueDate && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {t('DueDate')}
                    </CustomText>
                    <CustomText
                      style={styles.details}
                      color={theme.colors.outline}
                    >
                      {formatDate({
                        date: actionItemDetail.parentActionDetails.dueDate,
                        parseFormat: DateFormats.DueDateAPIFormat,
                        returnFormat: DateFormats.DueDateUIFormat,
                      })}
                    </CustomText>
                  </>
                )}

                <CustomText
                  style={styles.bottomInfoText}
                  variant={TextVariants.bodyLarge}
                >
                  {t('Created by')}
                </CustomText>
                <CustomText style={styles.details} color={theme.colors.outline}>
                  {actionItemDetail?.parentActionDetails?.assignedBy}
                </CustomText>

                {actionItemDetail?.parentActionDetails?.fromSelf === false && (
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

                {(actionItemDetail?.tags ||
                  actionItemDetail?.programs ||
                  actionItemDetail?.users ||
                  actionItemDetail?.contactType) && (
                  <>
                    <CustomText
                      style={styles.bottomInfoText}
                      variant={TextVariants.bodyLarge}
                    >
                      {actionItemDetail?.tags
                        ? t('AudienceTags')
                        : actionItemDetail?.programs
                        ? t('AudienceExperiences')
                        : actionItemDetail?.users
                        ? t('AudienceContacts')
                        : t('AudienceContactType')}
                    </CustomText>
                    <CustomText
                      style={styles.details}
                      color={theme.colors.outline}
                    >
                      {actionItemDetail?.tags
                        ? actionItemDetail?.tags
                        : actionItemDetail?.programs
                        ? actionItemDetail?.programs
                        : actionItemDetail?.users
                        ? actionItemDetail?.users
                        : actionItemDetail?.contactType}
                    </CustomText>
                  </>
                )}
              </View>
            ) : (
              <EmptyView label={t('EventNotExist')} />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    scrollView: { flexGrow: 1, justifyContent: 'center' },
    container: { flex: 1, padding: 20 },

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

export default ScheduleActionItemDetail;
