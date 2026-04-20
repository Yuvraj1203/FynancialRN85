import {
  CustomButton,
  CustomFlatList,
  CustomImage,
  CustomText,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomBottomPopup,
  CustomHeader,
  CustomImagePicker,
  FormTextInput,
} from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { ItemsArray, UploadFileListToS3Model } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
} from '@/utils/navigationUtils';
import { showSnackbar } from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Asset } from 'react-native-image-picker';
import { z } from 'zod';

export type SupportProps = {
  categoryData?: ItemsArray;
};

function Support() {
  /** Added by @Yuvraj 31-01-2025 -> navigate to different screen (FYN-4299) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 31-01-2025 -> get params from parent screen (FYN-4299) */
  const route = useAppRoute('Support');

  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  /** Added by @Yuvraj 31-01-2025 -> loading state for button (FYN-4299) */
  const [loading, setLoading] = useState<boolean>(false);

  /** Added by @Yuvraj 31-01-2025 -> bottom popup state on response sent successfully (FYN-4299) */
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  const [mediaList, setMediaList] = useState<Asset[]>([]);

  const [placeholderText, setPlaceholderText] = useState(
    route.params?.categoryData?.supportCategory?.name == 'Feedback'
      ? t('FeedbackMessage')
      : t('IssueMsg'),
  );

  /**
   * Added by @Yuvraj 31-01-2025 -> Schema defined for validation of form
   * Zod(https://zod.dev/?id=form-integrations) (FYN-4299)
   */
  const schema = z.object({
    content: z.string().min(10, {
      message:
        route.params?.categoryData?.supportCategory?.name == 'Feedback'
          ? t('PleaseEnterYourFeedback')
          : t('PleaseEnterYourIssue'),
    }),
  });

  /**
   * Added by @Yuvraj 31-01-2025 -> converted schema to type for React-hook-form (FYN-4299)
   */
  type Schema = z.infer<typeof schema>;

  /**
   * Added by @Yuvraj 31-01-2025 -> React hook form for form validation (FYN-4299)
   * (https://www.react-hook-form.com/get-started)
   */
  const {
    control,
    handleSubmit,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      content: '',
    },
    resolver: zodResolver(schema),
  });

  /**
   * Added by @Yuvraj 31-01-2025 -> this function will only be called if zod schema validated
   * after clicking on report  (FYN-4299)
   */
  const onSubmit = async (data: Schema) => {
    if (mediaList.length > 0) {
      uploadImages(
        mediaList,
        async (imageIds: string[]) => {
          createoreditApi.mutate({
            ticketID: '',
            issue: data.content,
            deviceModel: await DeviceInfo.getDeviceName(),
            appVersion: DeviceInfo.getVersion(),
            deviceType: Platform.OS,
            version: Platform.Version,
            ticketStatusId: 0,
            ticketCategoryId: route?.params?.categoryData?.supportCategory?.id,
            assignedToUserId: 0,
            userId: 0,
            tenantId: 0,
            ticketImageMappingList: imageIds.map(item => ({
              contentDataId: item,
            })),
            deletedImageIds: [],
            id: null,
          });
        },
        () => {
          // Failure - return from this point
          // showSnackbar(t('ImageUploadFail'), 'danger');
          setLoading(false);
        },
      );
    } else {
      createoreditApi.mutate({
        ticketID: '',
        issue: data.content,
        deviceModel: await DeviceInfo.getDeviceName(),
        appVersion: DeviceInfo.getVersion(),
        deviceType: Platform.OS,
        version: Platform.Version,
        ticketStatusId: 0,
        ticketCategoryId: route?.params?.categoryData?.supportCategory?.id,
        assignedToUserId: 0,
        userId: 0,
        tenantId: 0,
        ticketImageMappingList: [],
        deletedImageIds: [],
        id: null,
      });
    }
  };

  const handleMediaList = (value: Asset[]) => {
    {
      const oldList = mediaList.filter(
        mediaItem => mediaItem.uri !== Images.addSquare,
      );

      // Remove duplicates
      const newImages = value.filter(
        image =>
          !oldList.some(
            existingImage => existingImage.fileName === image.fileName,
          ),
      );

      const updatedList = [...oldList, ...newImages];

      if (updatedList.length > 5) {
        showSnackbar(t('ImageSelectLimitMsg'));
        return;
      }

      setMediaList([
        ...updatedList,
        ...(updatedList.length < 5
          ? [{ uri: Images.addSquare, fileName: 'add' }]
          : []),
      ]);
    }
  };

  const renderImageItem = (item: Asset) => {
    return item.uri === Images.addSquare ? (
      <Tap
        onPress={() => setShowImageSelectionPopup(true)}
        style={styles.addImageContainer}
      >
        <CustomImage
          source={item.uri}
          type={ImageType.svg}
          color={theme.colors.onSurfaceVariant}
          style={styles.addImgs}
        />
      </Tap>
    ) : (
      <Tap
        onPress={() => {
          const imageList = mediaList
            ?.filter(item => item.uri !== Images.addSquare)
            .map(item => item.uri!);

          showImagePopup({
            imageList,
            defaultIndex: mediaList?.findIndex(
              mediaItem => mediaItem.uri == item.uri,
            ),
          });
        }}
        style={styles.selectedImageContainer}
      >
        <View>
          <CustomImage
            source={{ uri: item.uri }}
            resizeMode={ResizeModeType.cover}
            style={styles.selectedImgs}
          />
          <Tap
            onPress={() => {
              const updatedMediaList = mediaList.filter(
                mediaItem =>
                  mediaItem.uri !== item.uri &&
                  mediaItem.uri !== Images.addSquare,
              );
              if (updatedMediaList.length === 0) {
                setMediaList([]);
              } else {
                setMediaList([
                  ...updatedMediaList,
                  { uri: Images.addSquare, fileName: 'add' },
                ]);
              }
            }}
            style={styles.selectedImgDeleteTap}
          >
            <CustomImage
              source={Images.close}
              type={ImageType.svg}
              color={theme.colors.onPrimary}
              style={styles.selectedImgDelete}
            />
          </Tap>
        </View>
      </Tap>
    );
  };

  const uploadImages = async (
    mediaList: Asset[],
    onSuccess: (imageIds: string[]) => void,
    onFailure: () => void,
  ) => {
    const imageIds: string[] = [];

    const newImages = mediaList.filter(
      mediaItem => mediaItem.uri != Images.addSquare,
    );

    if (newImages.length > 0) {
      const formData = new FormData();
      newImages.forEach(file => {
        formData.append('files', {
          uri: file.uri,
          name: file.fileName ?? `file_${Date.now()}`,
          type: file.type,
        });
      });

      try {
        const response = await UploadFileListToS3Api.mutateAsync(formData);
        if (response) {
          if (response.result != null && response.result.length > 0) {
            response.result.forEach((item: UploadFileListToS3Model) => item?.contentID && imageIds.push(item.contentID));
          } else {
            showSnackbar(
              response.error?.message
                ? response.error?.message
                : t('SomeErrorOccured'),
              'danger',
            );
            onFailure();
            return;
          }
        } else {
          showSnackbar(t('ImageUploadFail'), 'danger');
          onFailure();
          return;
        }
      } catch (error) {
        showSnackbar(t('ImageUploadFail'), 'danger');
        onFailure();
        return;
      }
    }
    onSuccess(imageIds);
  };

  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      });
    },
    onMutate(variables) {
      if (!loading) {
        setLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result == null) {
        showSnackbar(
          data.error?.message ? data.error?.message : t('SomeErrorOccured'),
          'danger',
        );
        setLoading(false);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 31-01-2025 ->  api for submitting report/feedback  (FYN-4299) */
  const createoreditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.TicketsCreateOrEdit,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /**  Added by @Yuvraj 31-01-2025 -> show loading on button (FYN-4299) */
      if (!loading) {
        setLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      /**  Added by @Yuvraj 31-01-2025 -> hide loading on button (FYN-4299) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success) {
        setShowSuccessPopup(true);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader
          showBack
          title={route.params?.categoryData?.supportCategory?.name}
        />

        <ScrollView
          keyboardShouldPersistTaps={'always'}
          style={styles.container}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
            style={styles.container}
          >
            <View style={styles.main}>
              <FormTextInput
                control={control}
                name={'content'}
                showLabel={false}
                placeholder={placeholderText}
                maxLines={3}
                height={100}
                multiLine={true}
              />

              {mediaList.length == 0 ? (
                <Tap
                  style={styles.noImgLayContainer}
                  onPress={() => setShowImageSelectionPopup(true)}
                >
                  <View style={styles.noImgLay}>
                    <CustomImage
                      source={Images.camera}
                      type={ImageType.svg}
                      style={styles.icon}
                      color={theme.colors.primary}
                    />
                    <CustomText style={styles.noImgMsg}>
                      {t('IssueImgMsg')}
                    </CustomText>
                  </View>
                </Tap>
              ) : (
                <CustomFlatList
                  data={mediaList}
                  numColumns={4}
                  scrollEnabled={false}
                  renderItem={({ item }) => renderImageItem(item)}
                />
              )}

              <CustomButton
                loading={loading}
                style={styles.reportBtn}
                onPress={handleSubmit(onSubmit)}
              >
                {route.params?.categoryData?.supportCategory?.name == 'Feedback'
                  ? t('Feedback')
                  : t('Report')}
              </CustomButton>

              <CustomText color={theme.colors.outline}>
                {t('TechHelp')}
              </CustomText>

              <CustomImagePicker
                showPopup={showImageSelectionPopup}
                setShowPopup={setShowImageSelectionPopup}
                selectionLimit={
                  mediaList.length == 0 ? 5 : 6 - mediaList.length
                }
                mediaList={handleMediaList}
              />

              <CustomBottomPopup
                shown={showSuccessPopup}
                setShown={setShowSuccessPopup}
                title={t('FeedbackSubmitted')}
                onClose={() => {
                  handleGoBack(navigation);
                }}
              >
                <View style={styles.successContainer}>
                  <CustomImage
                    source={Images.success}
                    type={ImageType.svg}
                    style={styles.successIcon}
                  />

                  <CustomText
                    variant={TextVariants.bodyLarge}
                    style={styles.feedbackLabel}
                  >
                    {route?.params?.categoryData?.saveMessage}
                  </CustomText>
                </View>
              </CustomBottomPopup>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    main: {
      flex: 1,
      padding: 20,
    },
    feedbackImage: {
      height: 180,
      width: 250,
      alignSelf: 'center',
    },
    icon: {
      height: 20,
      width: 20,
      marginTop: 5,
    },
    date: {
      marginLeft: 10,
    },
    noImgLayContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      padding: 10,
      marginTop: 10,
    },
    noImgLay: {
      alignItems: 'center',
    },
    noImgMsg: {
      textAlign: 'center',
      marginTop: 10,
    },
    addImgs: {
      height: 50,
      width: 50,
      borderRadius: theme.roundness,
    },
    selectedImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageContainer: {
      height: 80,
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedImgs: {
      height: 80,
      width: 80,
      borderRadius: theme.roundness,
    },
    albumFlatListRow: {
      flexDirection: 'row',
      marginTop: 10,
    },
    selectedImgDeleteTap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
      alignItems: 'center',
    },
    selectedImgDelete: {
      height: 10,
      width: 10,
    },
    reportBtn: {
      marginVertical: 20,
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      marginBottom: 50,
    },
    successIcon: {
      width: 50,
      height: 50,
    },
    feedbackLabel: {
      marginTop: 10,
      marginHorizontal: 10,
      textAlign: 'center',
    },
  });

export default Support;
