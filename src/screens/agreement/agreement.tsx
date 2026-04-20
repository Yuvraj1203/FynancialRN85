import {
  CustomButton,
  CustomCheckBox,
  CustomText,
  HtmlRender,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { CheckBoxModeVariants } from '@/components/atoms/customCheckBox/customCheckBox';
import { TextVariants } from '@/components/atoms/customText/customText';
import { EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { navigateFromApi } from '@/navigators/applicationNavigator';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { AgreementMaster, GetAgreementMasterModel } from '@/services/models';
import { appStartStore, userStore } from '@/store';

import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
} from '@/utils/navigationUtils';
import {
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
  useLogout,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { z } from 'zod';

/** Added by @Akshita 13-02-2025 -> User need to agree to one-time agreement to use the app (FYN-4841) */
function Agreement() {
  /** Added by @Akshita 05-02-25 ---> Hook to navigate between different screens in the app (FYN-4841) */
  const navigation = useAppNavigation();

  /** Added by @Akshita 05-02-25 ---> Retrieves the current theme settings for the application (FYN-4841) */
  const theme = useTheme();

  /** Added by @Akshita 05-02-25 ---> Applies styles dynamically based on the selected theme (FYN-4841) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 05-02-25 ---> Hook for supporting multi-language translations (FYN-4841) */
  const { t } = useTranslation();

  /** Added by @Akshita 05-02-25 ---> Creates a reference to control the ScrollView component (FYN-4841) */
  const scrollRef = useRef<ScrollView | null>(null);

  /** Added by @Akshita 05-02-25 ---> Retrieves user details from the user store (FYN-4841) */
  const userDetails = userStore(state => state.userDetails);

  const setUserDetails = userStore(state => state.setUserDetails);

  /** Added by @Akshita 05-02-25 ---> Stores user agreement details fetched from the API (FYN-4841) */
  const [userAgreementData, setUserAgreementData] = useState<AgreementMaster>();

  /** Added by @Akshita 05-02-25 ---> State to track loading status to show skeleton  (FYN-4841) */
  const [loading, setLoading] = useState<boolean>(false);

  /** Added by @Akshita 05-02-25 ---> Tracks whether the accept button is in a loading state (FYN-4841) */
  const [loadingBtn, setLoadingBtn] = useState<boolean>(false);

  /**
   * Added by @Akshita 05-02-25 ---> Initializes an in-app browser for opening links
   * within the app (FYN-4841)
   */
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Akshita 05-02-25 ---> hook to logout the user (FYN-4841) */
  const { logout } = useLogout();

  const [logoutLoading, setLogoutLoading] = useState(false); // show logout dialog

  /** Added by @Akshita 05-02-25 ---> state to know if app has completed initial routing (FYN-4841) */
  const setAppStarted = appStartStore(
    state => state.setAppStartedFromNotification,
  ); // set app started value

  /**
   * Added by @Akshita 05-02-25 --->
   * Defines a schema for validating form inputs using Zod (https://zod.dev/?id=form-integrations)
   * Ensures that the user must accept the contract before proceeding. (FYN-4841)
   */
  const schema = z.object({
    acceptContract: z.boolean().refine(val => val === true, {
      message: t('PleaseAgreeToTerms'),
    }),
  });

  /**
   * Added by @Akshita 05-02-2025 -> converted schema to type for React-hook-form (FYN-4841)
   */
  type Schema = z.infer<typeof schema>;

  /**
   * Added by @Akshita 05-02-25 --->
   * Initializes React Hook Form for managing form state and validation.
   * Uses ZodResolver to validate the schema. (FYN-4841)
   */
  const {
    control,
    formState: { isValid },
  } = useForm<Schema>({
    defaultValues: {
      acceptContract: false,
    },
    resolver: zodResolver(schema),
  });

  /**
   * Added by @Akshita 05-02-25 ---> Calls the API to fetch agreement details
   * when the component mounts (FYN-4841)
   */
  useEffect(() => {
    if (userDetails) {
      getAgreementMasterApi.mutate({});
    }
  }, []);

  /**
   * Added by @Akshita 05-02-25 ---> Handles user agreement acceptance by sending
   * data to the API (FYN-4841)
   */
  const handleAccept = () => {
    agreementCreateOrEditApi.mutate({
      AgreementMasterID: userAgreementData?.id,
      userId: userDetails?.userID,
    });
  };

  /**
   * Added by @Akshita 05-02-25 ---> API call to get the agreement master details.
   * This fetches agreement content that the user must accept (FYN-4841)
   */
  const getAgreementMasterApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAgreementMasterModel>({
        endpoint: ApiConstants.GetAgreementMaster,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @Akshita 05-02-2025 -> show skeleton when loading agreement content (FYN-4841) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Akshita 05-02-2025 -> hide skeleton after api call (FYN-4841) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      /**
       * Added by @Akshita 05-02-25 ---> API call to get the agreement master details.
       * This fetches agreement content that the user must accept (FYN-4841)
       */
      if (data?.result && data?.result?.agreementMaster) {
        /**
         * Added by @Akshita 05-02-25 --->  process the HTML content and converts to text (FYN-4841)
         * and segregate the iframe (photo & video) List to display processed image
         * on screen instead of link/url
         */
        const htmlData = processHtmlContent({
          html: data?.result?.agreementMaster?.content,
          maxWords: 50,
          linkColor: theme.colors.links,
        });

        if (htmlData) {
          setUserAgreementData({
            ...data.result.agreementMaster,
            content: htmlData?.Content,
            iFrameList: htmlData?.iFrameList,
          });
        }
      }
    },
    onError(error, variables, context) {
      /** Added by @Akshita 05-02-25 ---> Handles API errors and displays a snackbar message (FYN-4841) */
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by @Akshita 05-02-25 --->
   * API call to accept the agreement. Sends the acceptance data when the user agrees (FYN-4841)
   */
  const agreementCreateOrEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.AgreementCreateOrEdit,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @Akshita 05-02-2025 -> show loading on accept button (FYN-4841) */
      setLoadingBtn(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Akshita 05-02-2025 -> hide loading on accept button after api call (FYN-4841) */
      setLoadingBtn(false);

      /**
       * Added by @Akshita 05-02-2025 -> set the flag to know app start up flow has been completed
       * this helped in notification redirection after app successfully started (FYN-4841)
       */
      setAppStarted(true);
    },
    onSuccess(data, variables, context) {
      showSnackbar(t('AgreementAccepted'), 'success');

      setUserDetails(prev => ({
        ...prev,
        isAgreementComplete: true,
      }));

      navigateFromApi(navigation, () => {
        // navigation.reset({
        //   index: 0,
        //   routes: [{name: 'DrawerRoutes'}],
        // });
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: userDetails?.isAdvisor ? 'ContactListing' : 'Dashboard',
              },
            },
          }),
        );
      });
    },
    onError(error, variables, context) {
      /** Added by @Akshita 05-02-25 ---> Handles API errors and displays a snackbar message (FYN-4841) */

      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        {loading ? (
          <Skeleton>
            <View style={styles.skeletonLay}>
              <View style={styles.skeletonHeading} />

              {[...Array(8).keys()].map((_, index) => (
                <View key={index} style={styles.skeletonDesc} />
              ))}
              <View style={styles.skeletonInput} />
              <View style={styles.skeletonBtnLay}>
                <View style={styles.skeletonBtn} />
                <View style={styles.skeletonBtn} />
              </View>
            </View>
          </Skeleton>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
            style={styles.container}
          >
            <View style={styles.container}>
              <Shadow style={styles.wrapper}>
                <CustomText
                  variant={TextVariants.bodyLarge}
                  style={{ flex: 1 }}
                >
                  {userAgreementData?.title}
                </CustomText>

                <Tap
                  disableRipple
                  onPress={() => {
                    showAlertPopup({
                      title: t('Logout'),
                      msg: t('LogoutConfirmationText'),
                      compact: true,
                      PositiveText: t('Yes'),
                      NegativeText: t('No'),
                      dismissOnBackPress: !logoutLoading,
                      onPositivePress: () => {
                        setLogoutLoading(true);
                        logout({}).then(value => {
                          setLogoutLoading(false);
                        });
                      },
                    });
                  }}
                >
                  <View style={styles.logout}>
                    {logoutLoading && <ActivityIndicator />}
                    <CustomText color={theme.colors.primary}>
                      {t('Logout')}
                    </CustomText>
                  </View>
                </Tap>
              </Shadow>

              <ScrollView
                ref={scrollRef}
                style={styles.container}
                keyboardShouldPersistTaps="always"
              >
                {userAgreementData ? (
                  <View style={styles.agreementContainer}>
                    {userAgreementData.content && (
                      <HtmlRender
                        style={styles.title}
                        html={userAgreementData.content}
                        openLinks={openInAppBrowser}
                        iFrameList={userAgreementData.iFrameList}
                        handleIframeClick={iframeString => {
                          showImagePopup({ iframe: iframeString });
                        }}
                      />
                    )}

                    <CustomCheckBox
                      mode={CheckBoxModeVariants.android}
                      control={control}
                      name={'acceptContract'}
                      label={t('TermsMsg')}
                    />

                    {isValid && (
                      <CustomButton
                        loading={loadingBtn}
                        onPress={handleAccept}
                        style={styles.acceptBtn}
                      >
                        {t('Accept')}
                      </CustomButton>
                    )}
                  </View>
                ) : (
                  <EmptyView label={t('NoAgreementAvailable')} />
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 30,
      borderRadius: 5,
      marginTop: 30,
      marginBottom: 70,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 15,
      borderRadius: 3,
      marginTop: 15,
    },
    skeletonBtnLay: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skeletonInput: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 50,
      borderRadius: 5,
      marginTop: 80,
      marginBottom: 20,
    },
    skeletonBtn: {
      backgroundColor: theme.colors.surface,
      width: '30%',
      height: 30,
      borderRadius: 5,
      marginTop: 30,
      marginBottom: 20,
    },
    agreementContainer: {
      marginHorizontal: 20,
      paddingBottom: 80,
    },
    title: {
      textAlign: 'center',
      marginVertical: 20,
    },
    date: {
      marginVertical: 10,
    },
    initials: {
      marginTop: 15,
    },
    btnLay: {
      flexDirection: 'row',
    },
    prevBtn: {
      flex: 1,
      alignItems: 'flex-start',
    },
    acceptBtn: {
      alignSelf: 'center',
    },
    nextBtn: {
      flex: 1,
      alignItems: 'flex-end',
    },
    wrapper: {
      paddingTop: 10,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logout: {
      flexDirection: 'row',
      gap: 10,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
  });

export default Agreement;
