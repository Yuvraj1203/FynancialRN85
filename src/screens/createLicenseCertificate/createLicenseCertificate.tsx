import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Asset } from 'react-native-image-picker';
import { z } from 'zod';

import { CustomButton, CustomImage, CustomText, Tap } from '@/components/atoms';
import {
  CustomDatePicker,
  CustomHeader,
  CustomImagePicker,
  FormTextInput,
} from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';

import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetAllUserCertificatesModel,
  UploadFileListToS3Model,
} from '@/services/models';

import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';

import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { formatDate, isEmpty, parseDate, showSnackbar } from '@/utils/utils';

import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import Log from '@/utils/logger';
import { DateFormats, ProfileReturnProp } from '../profile/profile';

/** Added by @Shivang 02-12-2025 (#LC-0001) ---> Type definition for route params */
export type CreateLicenseCertificateProps = {
  userId?: number; // if passed => Edit mode (show Delete button, prefill later)
  editLicenseDetails?: GetAllUserCertificatesModel;
};

/** Added by @Shivang 02-12-2025 (#LC-0001) ---> Main screen for creating/updating License & Certificate */
function CreateLicenseCertificate() {
  const navigation = useAppNavigation();

  const route = useAppRoute('CreateLicenseCertificate');

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Theme + styles */
  const theme = useTheme();
  const styles = makeStyles(theme);

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Translations & user details */
  const { t } = useTranslation();
  const userDetails = userStore();

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Return-data hook to notify parent screen */
  const { sendDataBack } = useReturnDataContext();

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> State for Save/Delete loading */
  const [saveLoading, setSaveLoading] = useState(false);

  const [deletebtnLoading, setDeletebtnLoading] = useState(false);

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Image upload state (copied from Event screen) */
  const [mediaList, setMediaList] = useState<Asset[]>([]);
  const [uploadedImageId, setUploadedImageId] = useState<string>('');
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> State for Issue / Expiry date pickers */
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  //const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [selectedIssueDate, setSelectedIssueDate] = useState<string>();

  //const [selectedExpiryDate, setSelectedExpiryDate] = useState<string>();

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Zod schema for License & Certificate form */
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t('LicenseNameRequired') }), // e.g. "AWS Certified Solutions Architect"
    issuingOrganization: z.string().trim().optional(),
    issueDate: z.string().optional(), // formatted as MMM DD,YYYY
    //expiryDate: z.string().optional(),
    credentialId: z.string().trim().optional(),
  });

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Schema type for RHF */
  type Schema = z.infer<typeof schema>;

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> React Hook Form instance */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      name: route?.params?.editLicenseDetails?.certificateName,
      issuingOrganization:
        route?.params?.editLicenseDetails?.issuingOrganization,
      issueDate: route?.params?.editLicenseDetails?.issueDate,
      credentialId: route?.params?.editLicenseDetails?.credentialId,
    },
    resolver: zodResolver(schema),
  });

  const isEditMode = !!route?.params?.editLicenseDetails?.id;
  const hasImageNow = (mediaList?.length ?? 0) > 0 || !isEmpty(uploadedImageId);
  const hadExistingImage = !!route?.params?.editLicenseDetails?.fileURL;
  const hasImage = useMemo(() => {
    return mediaList.length > 0 || !isEmpty(uploadedImageId);
  }, [mediaList.length, uploadedImageId]);

  useEffect(() => {
    initialDataLoad();
  }, [route?.params?.editLicenseDetails]);

  const initialDataLoad = () => {
    if (!route.params?.editLicenseDetails) return;

    setUploadedImageId(route?.params?.editLicenseDetails?.fileId ?? '');

    if (!isEmpty(route?.params?.editLicenseDetails?.fileURL)) {
      setMediaList([
        {
          uri: route?.params?.editLicenseDetails?.fileURL,
          fileName: 'certificate.jpg',
          type: 'image/jpeg',
        } as Asset,
      ]);
    }

    if (
      route.params?.editLicenseDetails?.issueDate &&
      parseDate({
        date: route.params.editLicenseDetails.issueDate!,
        parseFormat: 'MMM YYYY',
      })
    ) {
      handleIssueDateSelect(
        parseDate({
          date: route.params.editLicenseDetails.issueDate,
          parseFormat: 'MMM YYYY',
        })!,
      );
    }
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Helper to clear Issue Date */
  const clearIssueDate = () => {
    setValue('issueDate', '', { shouldDirty: true, shouldValidate: true });
    setSelectedIssueDate('');
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Handle media list update from CustomImagePicker */
  const handleMediaList = (value: Asset[]) => {
    setMediaList(value);
  };

  const handleSetDate = (): Date => {
    // Retrieve the date of birth from the form
    if (!isEmpty(getValues('issueDate'))) {
      // Create a new Date object from the input format
      return (
        parseDate({
          date: getValues('issueDate')!,
          parseFormat: DateFormats.MonthYearUI,
        }) ?? new Date()
      );
    }

    return new Date(); // Default to today's date if not valid or not found
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Helper to format Issue Date when user selects it */
  const handleIssueDateSelect = (value: Date) => {
    setValue(
      'issueDate',
      formatDate({
        date: value,
        returnFormat: DateFormats.MonthYearUI,
      }),
      { shouldDirty: true, shouldValidate: true },
    );
    Log('value setSelectedIssueDate' + value);

    setSelectedIssueDate(
      formatDate({
        date: value,
        returnFormat: DateFormats.MonthYearAPI,
      }),
    );
    setShowIssueDatePicker(false);
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Triggered when user taps Save */
  const onSubmit = (data: Schema) => {
    // ✅ In edit mode: image must exist either as already saved OR newly selected
    if (isEditMode && hadExistingImage && !hasImageNow) {
      showSnackbar(t('UploadCertificateImage'), 'danger');
      return;
    }

    // ✅ If new image selected (local uri), upload again
    const picked = mediaList.at(0);
    const isLocalImage = !!picked?.uri && !picked.uri.startsWith('http');

    if (isLocalImage) {
      const formData = new FormData();

      formData.append('files', {
        uri: picked!.uri,
        name: picked!.fileName ?? 'certificate.jpg',
        type: picked!.type ?? 'image/jpeg',
      } as any);

      UploadFileListToS3Api.mutate({ formData, formValues: data });
      return;
    }

    // ✅ No new image picked:
    // - Create mode: allow if you want optional image (your existing logic)
    // - Edit mode: already has image in uploadedImageId, so proceed
    triggerSaveLicenseCertificate(data);
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Function to call Save License API */
  const triggerSaveLicenseCertificate = (data: Schema, imageId?: string) => {
    saveLicenseCertificateApi.mutate({
      certificateName: data.name,
      issuingOrganization: data.issuingOrganization,
      issueDate: data.issueDate,
      //expiryDate: selectedExpiryDate,
      credentialId: data.credentialId ?? '',
      fileId: imageId ?? uploadedImageId,
      userId: userDetails?.userDetails?.userID, // optional, if backend expects current user
      ...(route?.params?.editLicenseDetails && {
        id: route?.params.editLicenseDetails.id,
      }),
    });
  };

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> S3 upload mutation (copied from Event page) */
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: { formData: FormData; formValues: Schema }) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData.formData,
        byPassRefresh: true,
      });
    },
    onMutate() {
      setSaveLoading(true);
    },
    onSuccess(data, variables) {
      if (data.result != null && data.result.at(0)?.contentID) {
        const contentId = data.result.at(0)?.contentID!;
        setUploadedImageId(contentId);
        // After successful upload, call save License API with imageId
        triggerSaveLicenseCertificate(variables.formValues, contentId);
      } else {
        showSnackbar(
          data.error?.message ? data.error?.message : t('SomeErrorOccured'),
          'danger',
        );
      }
    },
    onError(error) {
      setSaveLoading(false);
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> API to Save License / Certificate details */
  const saveLicenseCertificateApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.SaveLicenseCertificate, // <-- Define in ApiConstants
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate() {
      setSaveLoading(true);
    },
    onSettled() {
      setSaveLoading(false);
    },
    onSuccess(data) {
      if (data?.success) {
        showSnackbar(t('LicenseCertificateSaved'), 'success');

        sendDataBack('Profile', {
          isCertCreateOrEdit: true,
        } as ProfileReturnProp);
        handleGoBack(navigation);
        // Notify parent screen (Profile) to refresh
        // sendDataBack('Profile', {
        //   isDetailsUpdated: true,
        // } as ProfileReturnProp);
        // handleGoBack(navigation);
      } else {
        showSnackbar(data.error?.message!, 'danger');
      }
    },
    onError(error) {
      setSaveLoading(false);
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> API to Delete License / Certificate (optional) */
  const deleteLicenseCertificateApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.DeleteLicenseCertificate, // <-- Define in ApiConstants
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onMutate() {
      setDeletebtnLoading(true);
    },
    onSettled() {
      setDeletebtnLoading(false);
    },
    onSuccess(data) {
      if (data?.success) {
        showSnackbar(t('LicenseCertificateDeleted'), 'success');
        sendDataBack('Profile', {
          isCertCreateOrEdit: true,
        } as ProfileReturnProp);
        handleGoBack(navigation);
      } else {
        showSnackbar(data.error?.message!, 'danger');
      }
    },
    onError(error) {
      setDeletebtnLoading(false);
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Shivang 02-12-2025 (#LC-0001) ---> Delete handler */
  const handleDeleteCertificate = () => {
    if (!route?.params?.editLicenseDetails?.id) return;
    showAlertPopup({
      title: t('Delete'),
      msg: t('DeleteCertMsg'),
      PositiveText: t('Delete'),
      NegativeText: t('Cancel'),
      onPositivePress: () => {
        deleteLicenseCertificateApi.mutate({
          Id: route?.params?.editLicenseDetails?.id,
        });
      },
    });
  };

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('LicensesAndCertificates')} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
          style={styles.main}
        >
          <View style={styles.main}>
            <ScrollView
              keyboardShouldPersistTaps="always"
              style={styles.scrollContainer}
            >
              <CustomText style={styles.sectionTitle}>
                {t('CertificateImage')}
              </CustomText>

              {mediaList.length === 0 ? (
                <Tap
                  style={styles.noImgLayContainer}
                  onPress={() => setShowImageSelectionPopup(true)}
                >
                  <View style={styles.noImgLay}>
                    <CustomImage
                      source={Images.addCircle}
                      type={ImageType.svg}
                      style={styles.icon}
                      color={theme.colors.primary}
                    />
                    <CustomText style={styles.noImgMsg}>
                      {t('UploadCertificateImage')}
                    </CustomText>
                  </View>
                </Tap>
              ) : (
                mediaList.at(0)?.uri && (
                  <Tap
                    onPress={() => {
                      if (saveLoading) return;
                      const imageList = mediaList.map(item => item.uri!);
                      showImagePopup({
                        imageList,
                        defaultIndex: 0,
                      });
                    }}
                    style={styles.selectedImageContainer}
                  >
                    <View style={styles.imageContainer}>
                      <CustomImage
                        source={{ uri: mediaList.at(0)?.uri }}
                        style={styles.selectedImgs}
                      />
                      <Tap
                        onPress={() => {
                          if (saveLoading) return;
                          setMediaList([]);
                          setUploadedImageId('');
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
                )
              )}

              <FormTextInput
                control={control}
                name="name"
                placeholder={t('LicenseNamePlaceholder')}
                label={t('Name')}
                showLabel={true}
              />

              <FormTextInput
                control={control}
                name="issuingOrganization"
                placeholder={t('IssuingOrganization')}
                label={t('IssuingOrganization')}
                showLabel={true}
              />

              <View style={styles.dateInputWrapper}>
                <Tap
                  disableRipple
                  onPress={() => setShowIssueDatePicker(true)}
                  style={styles.paddingZero}
                >
                  <FormTextInput
                    control={control}
                    name="issueDate"
                    placeholder="MMM YYYY"
                    label={t('IssueDate')}
                    showLabel={true}
                    enabled={false}
                    suffixIcon={
                      isEmpty(getValues('issueDate'))
                        ? {
                            source: Images.calendar,
                            type: ImageType.svg,
                            color: theme.colors.onSurfaceVariant,
                          }
                        : undefined
                    }
                  />
                </Tap>

                {!isEmpty(getValues('issueDate')) && (
                  <Tap
                    disableRipple
                    onPress={() => {
                      clearIssueDate();
                    }}
                    style={styles.clearDateIcon}
                  >
                    <CustomImage
                      source={Images.close}
                      type={ImageType.svg}
                      color={theme.colors.onSurfaceVariant}
                      style={styles.clearIcon}
                    />
                  </Tap>
                )}
              </View>

              {/* Expiry Date */}
              {/* <Tap
                disableRipple
                onPress={() => setShowExpiryDatePicker(true)}
                style={styles.paddingZero}
              >
                <FormTextInput
                  control={control}
                  name="expiryDate"
                  placeholder="MMM DD,YYYY"
                  label={t('ExpiryDate')}
                  showLabel={true}
                  enabled={false}
                />
              </Tap> */}

              <FormTextInput
                control={control}
                name="credentialId"
                placeholder={t('CredentialId')}
                label={t('CredentialId')}
                showLabel={true}
              />
            </ScrollView>

            <View style={styles.footer}>
              {route?.params?.editLicenseDetails && (
                <CustomButton
                  mode={ButtonVariants.outlined}
                  loading={deletebtnLoading}
                  style={styles.deleteButton}
                  onPress={handleDeleteCertificate}
                >
                  {t('DeleteCertificate')}
                </CustomButton>
              )}

              <CustomButton
                mode={ButtonVariants.contained}
                loading={saveLoading}
                onPress={handleSubmit(onSubmit)}
              >
                {t('Save')}
              </CustomButton>
            </View>
          </View>
        </KeyboardAvoidingView>

        <CustomImagePicker
          showPopup={showImageSelectionPopup}
          setShowPopup={setShowImageSelectionPopup}
          mediaList={handleMediaList}
          crop={true}
          cropHeight={150}
          cropWidth={225}
        />

        <CustomDatePicker
          showPopup={showIssueDatePicker}
          setShowPopup={setShowIssueDatePicker}
          title={t('SelectIssueDate')}
          date={handleSetDate()}
          setDate={handleIssueDateSelect}
          mode={DatePickerMode.date}
        />
      </View>
    </SafeScreen>
  );
}

/** Added by @Shivang 02-12-2025 (#LC-0001) ---> Styles for CreateLicenseCertificate screen */
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    dateInputWrapper: {
      position: 'relative',
    },

    clearDateIcon: {
      position: 'absolute',
      right: 10, // adjust based on calendar icon spacing
      top: 35, // adjust to vertically align with input
    },

    clearIcon: {
      width: 20,
      height: 20,
    },

    scrollContainer: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    noImgLayContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      padding: 10,
      marginTop: 10,
      marginBottom: 20,
    },
    noImgLay: {
      alignItems: 'center',
    },
    icon: {
      height: 30,
      width: 30,
      marginTop: 5,
    },
    noImgMsg: {
      textAlign: 'center',
      marginTop: 10,
    },
    selectedImageContainer: {
      padding: 0,
      marginTop: 10,
      marginBottom: 20,
    },
    imageContainer: {
      padding: 10,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    selectedImgs: {
      height: 180,
      width: '100%',
      borderRadius: theme.roundness,
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
      height: 15,
      width: 15,
    },
    paddingZero: {
      padding: 0,
      margin: 0,
      //marginBottom: 10,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 10,
    },
    deleteButton: {
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
  });

export default CreateLicenseCertificate;
