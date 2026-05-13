import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

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
import { CustomHeader, EmptyView } from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';

import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  Events,
  GetEventsForEditModel,
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
  GetUserProgramSessionEventsModel,
} from '@/services/models';

import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';

import {
  formatDateUtcReturnLocalTime,
  handleOpenDialer,
  openUrl,
  parseDateUtc,
  showSnackbar,
} from '@/utils/utils';

import { EventListModel } from '@/services/models/eventListModel/eventListModel';
import { useAppRoute } from '@/utils/navigationUtils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export type ScheduleEventDetailProps = {
  id?: string;
  item?: GetScheduleTasksForGlobalCalendarModel;
  contactItem?: GetUserProgramSessionEventsModel;
};
type ComputeStatusParams =
  | {
      type: 'SCHEDULE_ITEM';
      item: GetScheduleTasksForGlobalCalendarModel;
    }
  | {
      type: 'NON_ADVISOR_EVENT';
      event: Events;
    };
const enum DateFormats {
  ScheduleAPIDateFormat = 'YYYY-MM-DDTHH:mm:ss',
  ScheduleUIDateFormat = 'MMM DD, YYYY hh:mm A',
  NonAdvisorEventApiFormat = 'DD MMM YYYY hh:mm A',
}
const ScheduleEventDetail = () => {
  const route = useAppRoute('ScheduleEventDetail').params;

  const item = route?.item;

  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const userDetails = userStore();

  const [loading, setLoading] = useState(false);
  const [eventDetail, setEventDetail] =
    useState<GetGlobalScheduleDetailForEditModel>();
  const [status, setStatus] = useState({ message: '', color: '' });
  const [eventData, setEventData] = useState<Events>();

  const eventList: EventListModel[] = [
    { id: 1, name: 'Phone Call' },
    { id: 2, name: 'In-Person Meeting' },
    { id: 3, name: 'Online Meeting' },
  ];

  useEffect(() => {
    if (userDetails.userDetails) {
      hideLoader();
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    if (userDetails.userDetails?.isAdvisor) {
      if (!item?.taskIdentifier) return;
      GetGlobalScheduleEventDetailApi.mutate({
        payload: { Id: item.taskIdentifier },
        endpoint: item.isOffice365
          ? ApiConstants.GetGlobalO365EventForEdit
          : ApiConstants.GetGlobalEventForEdit,
      });
    } else {
      getEventsForEditApi.mutate({ Id: route?.id });
    }
  };

  const computeStatus = (params: ComputeStatusParams) => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (params.type === 'SCHEDULE_ITEM') {
      startDate = parseDateUtc({
        date: params.item?.event_Start_Date!,
        parseFormat: DateFormats.ScheduleAPIDateFormat,
      });

      endDate = parseDateUtc({
        date: params.item?.event_End_Date!,
        parseFormat: DateFormats.ScheduleAPIDateFormat,
      });
    }

    if (params.type === 'NON_ADVISOR_EVENT') {
      startDate = parseDateUtc({
        date: params.event?.strStartDate!,
        parseFormat: DateFormats.NonAdvisorEventApiFormat, // add enum
      });

      endDate = parseDateUtc({
        date: params.event?.strEndDate!,
        parseFormat: DateFormats.NonAdvisorEventApiFormat,
      });
    }

    if (!startDate || !endDate) return;

    const currentDate = dayjs.utc().toDate();

    if (endDate.getTime() < currentDate.getTime()) {
      setStatus({ message: 'Expired', color: theme.colors.error });
    } else if (startDate.getTime() > currentDate.getTime()) {
      setStatus({ message: 'Upcoming', color: '#ea921c' });
    } else {
      setStatus({ message: 'Ongoing', color: '#0c8820' });
    }
  };

  const getEventTypeName = (
    eventType?: number,
    list?: EventListModel[],
  ): string => {
    if (!eventType || !list?.length) return '';

    return list.find(item => item.id === eventType)?.name ?? '';
  };

  const GetGlobalScheduleEventDetailApi = useMutation({
    mutationFn: (sendData: {
      payload: Record<string, any>;
      endpoint: string;
    }) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: sendData.endpoint,
        method: HttpMethodApi.Get,
        data: sendData.payload,
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

      setEventDetail({
        ...resp.result,
        events: {
          ...resp.result.events,
          description: item?.isOffice365
            ? resp.result.events?.description?.replace(/<[^>]+>/g, '').trim()
            : resp.result.events?.description,
          eventTypeName: getEventTypeName(
            resp.result.events?.eventType,
            eventList,
          ),
        },
      });
      if (item) {
        computeStatus({ type: 'SCHEDULE_ITEM', item });
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const getEventsForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetEventsForEditModel>({
        endpoint:
          route?.contactItem?.eventType == 4
            ? ApiConstants.GetO365EventsForEdit
            : ApiConstants.GetEventsForEdit,
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
        setEventData({
          ...data.result.events,
          eventTypeName: getEventTypeName(
            data.result.events.eventType,
            eventList,
          ),
          strStartDate: formatDateUtcReturnLocalTime({
            date: parseDateUtc({
              date: data.result.events.strStartDate!,
              parseFormat: DateFormats.NonAdvisorEventApiFormat,
            })!,
            returnFormat: DateFormats.ScheduleUIDateFormat,
          }),
          strEndDate: formatDateUtcReturnLocalTime({
            date: parseDateUtc({
              date: data.result.events.strEndDate!,
              parseFormat: DateFormats.NonAdvisorEventApiFormat,
            })!,
            returnFormat: DateFormats.ScheduleUIDateFormat,
          }),
        });

        computeStatus({ type: 'NON_ADVISOR_EVENT', event: data.result.events });
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('Event')} />

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
                    <View style={styles.skeletonCarouselBox} />

                    <View style={styles.skeletonSectionTitle} />
                    <View style={styles.skeletonNameLine} />
                    <View style={styles.skeletonNameLine} />
                    <View style={styles.skeletonNameLine} />
                  </View>
                  <View style={styles.skeletonSectionTitleSmall} />

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
            ) : userDetails.userDetails?.isAdvisor ? (
              eventDetail && eventDetail?.events ? (
                <View style={styles.container}>
                  <Tap
                    onPress={() => {
                      if (eventDetail?.events?.coverImageUrl)
                        showImagePopup({
                          imageList: [eventDetail?.events.coverImageUrl],
                          defaultIndex: 0,
                        });
                    }}
                    style={styles.zeroPadding}
                  >
                    <CustomImage
                      source={
                        eventDetail?.events?.coverImageUrl
                          ? { uri: eventDetail?.events.coverImageUrl }
                          : Images.eventBg
                      }
                      resizeMode={ResizeModeType.contain}
                      style={styles.eventCardImage}
                    />
                  </Tap>

                  <View style={styles.infoTitleContainer}>
                    <CustomText
                      style={styles.titleText}
                      maxLines={2}
                      variant={TextVariants.titleLarge}
                    >
                      {eventDetail?.events?.title}
                    </CustomText>
                    <CustomText
                      color={status.color}
                      variant={TextVariants.bodyLarge}
                    >
                      {status.message}
                    </CustomText>
                  </View>

                  <View style={styles.detailContainer}>
                    {!!eventDetail?.events?.location && (
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
                          {eventDetail?.events.location}
                        </CustomText>
                      </View>
                    )}

                    {!!eventDetail?.events?.eventTypeName && (
                      <View style={styles.detailSubContainer}>
                        <CustomImage
                          type={ImageType.svg}
                          source={
                            eventDetail?.events.eventType == 1
                              ? Images.contactUs
                              : eventDetail?.events.eventType == 2
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
                          {eventDetail?.events.eventTypeName}
                        </CustomText>
                      </View>
                    )}

                    {!!eventDetail?.events?.phone && (
                      <Tap
                        onPress={() =>
                          handleOpenDialer(eventDetail?.events?.phone)
                        }
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
                            {eventDetail?.events.phone}
                          </CustomText>
                        </View>
                      </Tap>
                    )}

                    {item?.event_Start_Date && item.event_End_Date && (
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
                            date: item.event_Start_Date,
                            parseFormat: DateFormats.ScheduleAPIDateFormat,
                            returnFormat: DateFormats.ScheduleUIDateFormat,
                          })}  -  ${formatDateUtcReturnLocalTime({
                            date: item.event_End_Date,
                            parseFormat: DateFormats.ScheduleAPIDateFormat,
                            returnFormat: DateFormats.ScheduleUIDateFormat,
                          })}`}
                        </CustomText>
                      </View>
                    )}

                    {!!eventDetail?.events?.link &&
                      eventDetail?.events.eventType == 3 &&
                      status.message != 'Expired' && (
                        <Shadow
                          onPress={() => openUrl(eventDetail?.events?.link)}
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

                  {!!eventDetail?.events?.description && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {t('Description')}
                      </CustomText>
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
                        {eventDetail?.events.description}
                      </CustomText>
                    </>
                  )}

                  {!!eventDetail?.events?.organizer && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {t('Organizer')}
                      </CustomText>
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
                        {eventDetail?.events.organizer}
                      </CustomText>
                    </>
                  )}

                  {!!eventDetail?.events?.additionalInformation && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {t('AdditionalInformation')}
                      </CustomText>
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
                        {eventDetail?.events.additionalInformation}
                      </CustomText>
                    </>
                  )}

                  {(eventDetail?.tags ||
                    eventDetail?.programs ||
                    eventDetail?.users ||
                    eventDetail?.contactType) && (
                    <>
                      <CustomText
                        style={styles.bottomInfoText}
                        variant={TextVariants.bodyLarge}
                      >
                        {eventDetail?.tags
                          ? t('AudienceTags')
                          : eventDetail?.programs
                          ? t('AudienceExperiences')
                          : eventDetail?.users
                          ? t('AudienceContacts')
                          : t('AudienceContactType')}
                      </CustomText>
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
                        {eventDetail?.tags
                          ? eventDetail?.tags
                          : eventDetail?.programs
                          ? eventDetail?.programs
                          : eventDetail?.users
                          ? eventDetail?.users
                          : eventDetail?.contactType}
                      </CustomText>
                    </>
                  )}
                </View>
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
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
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
                      <CustomText
                        style={styles.details}
                        color={theme.colors.outline}
                      >
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

    eventCardImage: {
      width: '100%',
      aspectRatio: 1.5,
      borderRadius: theme.roundness,
    },
    infoTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 10,
    },
    titleText: { flex: 1 },
    infoContainer: {
      paddingVertical: 0,
    },
    marginTop: {
      marginTop: 1.5,
    },
    detailContainer: {
      gap: 10,
      paddingBottom: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outline,
      marginVertical: 10,
      marginRight: 5,
    },
    phoneTap: { padding: 0, alignSelf: 'flex-start' },
    underline: { textDecorationLine: 'underline' },
    detailSubContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      paddingRight: 20,
    },
    detailImage: { height: 20, width: 20, marginTop: 2 },

    joinButton: { backgroundColor: theme.colors.primary },
    buttonText: { textAlign: 'center' },

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
      width: '85%',
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
      height: 170,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 0,
    },
    skeletonNameLine: {
      width: '45%',
      height: 14,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 10,
    },
  });

export default ScheduleEventDetail;
