import { CustomButton, CustomImage, CustomText } from '@/components/atoms';
import {
  ButtonVariants,
  Direction,
} from '@/components/atoms/customButton/customButton';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomPopup } from '@/components/molecules';

import { SafeScreen } from '@/components/template';
import { navigateFromApi } from '@/navigators/applicationNavigator';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  EnrollInvitedUserInTemplateModel,
  UpdateLastSignInForUserModel,
} from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
} from '@/utils/navigationUtils';
import { showSnackbar, useLogout } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

enum ButtonGroupEnum {
  RetryGroup = 'RetryGroup',
  ContinueGroup = 'ContinueGroup',
}

function SettingSetup() {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme(); // access theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); // translations

  const userDetails = userStore(state => state.userDetails); // user store to access user information.

  const setUserDetails = userStore(state => state.setUserDetails);

  const [loading, setLoading] = useState<boolean>(false);
  const [btnLoading, setbtnLoading] = useState<boolean>(false);
  const { logout } = useLogout();

  const [showLogout, setShowLogout] = useState(false); // show logout dialog

  const [logoutLoading, setLogoutLoading] = useState(false); // show logout dialog

  const [isEnrolledSucceed, setIsEnrolledSucceed] = useState(false); //for checking enroll success

  const [mainImage, setMainImage] = useState(Images.settingSetup); // for setting main Image

  const [buttonGroup, setButtonGroup] = useState(ButtonGroupEnum.RetryGroup); // for setting buttons

  const [message, setMessage] = useState(userDetails?.inviteLoadingMsg); // for setting message

  const [inviteLoadingMessage, setInviteLoadingMessage] = useState(
    userDetails?.inviteLoadingMsg,
  ); // for setting message while loading

  useEffect(() => {
    if (userDetails?.restrictLogin) {
      /**
       * ENTRY‑POINT #2: Returning or restricted user
       * Immediately set up the UI without calling enroll API
       */
      setMainImage(Images.settingFailed);
      setButtonGroup(ButtonGroupEnum.RetryGroup);
    } else {
      /**
       * ENTRY‑POINT #1: First‑time visitor (not restricted)
       * Trigger enrollment API
       */
      enrollInvitedUserInTemplateApi.mutate({});
    }
  }, []);

  /**
   * Added by @Shivang 23-07-25 -> Decides navigation flow when the user taps “Continue” or “OK”
   */
  const handleContinueGroup = () => {
    /**
     * Added by @Shivang 23-07-25 -> If enrollment succeeded, reset navigation to the app’s root
     */
    UpdateLastSignInForUserApi.mutate({
      apiPayload: {},
      fromContinueTap: true,
    }); // if (isEnrolledSucceed) {
    //   navigation.reset({
    //     index: 0,
    //     routes: [{name: 'DrawerRoutes'}],
    //   });
    // } else {
    //   /**
    //    * Added by @Shivang 23-07-25 -> If enrollment was skipped or failed, update store and deep‑link into the bottom‑tab flow
    //    */
    //   navigateFromApi(navigation, () => {
    //     navigation.reset(
    //       parseRouteToDynamicReset({
    //         screen: 'DrawerRoutes',
    //         params: {
    //           screen: 'BottomBarRoutes',
    //           params: {
    //             screen: userDetails.userDetails?.isAdvisor
    //               ? 'ContactListing'
    //               : 'Dashboard',
    //           },
    //         },
    //       }),
    //     );
    //   });
    // }
  };

  // Added by @Tarun 31-01-2025 -> enrollInvitedUserInTemplateApi call to know
  // if user is enrolled in templated or not START (FYN-4204)
  const enrollInvitedUserInTemplateApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<EnrollInvitedUserInTemplateModel>({
        endpoint: ApiConstants.EnrollInvitedUserInTemplate,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      // setTimeout(() => {
      setLoading(false);
      // }, 5000);
    },
    onSuccess(data, variables, context) {
      // Success Response
      setMessage(data.result?.message);

      const succeeded = data.result?.status === 1;

      setIsEnrolledSucceed(succeeded);

      setUserDetails(prev => ({
        ...prev,
        isInvitedIntoTemplate: succeeded
          ? false
          : userDetails?.isInvitedIntoTemplate,
      }));

      setButtonGroup(ButtonGroupEnum.ContinueGroup);
      if (succeeded) {
        // didsuccedd = true and restrictLogin = false
        setMainImage(Images.settingSuccess);
      } else {
        // didsuccedd = false and restrictLogin = false
        setMainImage(Images.settingFailed);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  // Added by @Tarun 31-01-2025 -> enrollInvitedUserInTemplateApi call to know
  // if user is enrolled in templated or not END (FYN-4204)

  /**  Added by @Yuvraj 21-04-2025 -> UpdateLastSignInForUserApi call to know isInvitedIntoTemplate,
   *  restrictLogin, status and message state START (FYN-6736) */
  const UpdateLastSignInForUserApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      fromContinueTap?: boolean;
    }) => {
      return makeRequest<UpdateLastSignInForUserModel>({
        endpoint: ApiConstants.UpdateLastSignInForUser,
        method: HttpMethodApi.Put,
        data: sendData.apiPayload,
      }); // API Call
    },
    onMutate(variables) {
      if (variables.fromContinueTap) {
        setbtnLoading(true);
      } else {
        setLoading(true);
        setInviteLoadingMessage(undefined);
      }
    },
    onSettled(data, error, variables, context) {
      if (variables.fromContinueTap) {
        setbtnLoading(false);
      } else {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        setUserDetails(prev => ({
          ...prev,
          isInvitedIntoTemplate: data.result?.isInvitedIntoTemplate,
          restrictLogin: data.result?.restrictLogin,
          inviteLoadingMsg: data.result?.message,
          isOnboardingComplete: data.result?.isOnboardingComplete,
        }));

        if (variables.fromContinueTap) {
          navigateFromApi(navigation, () => {
            navigation.reset(
              parseRouteToDynamicReset({
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: userDetails?.isAdvisor
                      ? 'ContactListing'
                      : 'Dashboard',
                  },
                },
              }),
            );
          });
        } else {
          if (userDetails?.restrictLogin && !data.result?.restrictLogin) {
            navigateFromApi(navigation);
          } else {
            setInviteLoadingMessage(data.result?.message);
          }
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        {loading ? (
          <>
            <CustomImage
              source={Images.settingSetup}
              style={styles.logo}
              resizeMode={ResizeModeType.contain}
            />
            <CustomText variant={TextVariants.titleMedium} style={styles.msg}>
              {inviteLoadingMessage}
            </CustomText>
          </>
        ) : (
          <CustomImage
            source={mainImage}
            style={styles.logo}
            resizeMode={ResizeModeType.contain}
          />
        )}
        {!loading && (
          <>
            <CustomText variant={TextVariants.titleMedium} style={styles.msg}>
              {message}
            </CustomText>
            {buttonGroup == ButtonGroupEnum.ContinueGroup ? (
              <CustomButton
                loading={btnLoading}
                style={styles.btnContinue}
                icon={{
                  source: Images.right,
                  type: ImageType.svg,
                  direction: Direction.right,
                }}
                onPress={() => {
                  if (!loading) {
                    handleContinueGroup();
                  }
                }}
              >
                {isEnrolledSucceed ? t('Continue') : t('OK')}
              </CustomButton>
            ) : (
              <View style={styles.btnLayout}>
                <CustomButton
                  loading={loading}
                  icon={{
                    source: Images.refresh,
                    type: ImageType.svg,
                  }}
                  onPress={() => {
                    if (!loading) {
                      userDetails?.restrictLogin
                        ? UpdateLastSignInForUserApi.mutate({
                            apiPayload: {},
                            fromContinueTap: false,
                          })
                        : enrollInvitedUserInTemplateApi.mutate({});
                    }
                  }}
                >
                  {t('Retry')}
                </CustomButton>
                <CustomButton
                  mode={ButtonVariants.outlined}
                  icon={{
                    source: Images.logout,
                    type: ImageType.svg,
                  }}
                  onPress={() => {
                    if (!loading) {
                      setShowLogout(true);
                    }
                  }}
                >
                  {t('Logout')}
                </CustomButton>
              </View>
            )}
          </>
        )}

        <CustomPopup
          shown={showLogout}
          setShown={setShowLogout}
          compact
          title={t('Logout')}
          msg={t('LogoutMsg')}
          loading={logoutLoading}
          dismissOnBackPress={!logoutLoading}
          onPositivePress={() => {
            setLogoutLoading(true);
            logout({}).then(value => {
              setLogoutLoading(false);
              setShowLogout(false);
            });
          }}
          onNegativePress={() => {
            setShowLogout(false);
            setLogoutLoading(false);
          }}
        />
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignContent: 'center',
    },
    logo: {
      alignSelf: 'center',
      marginTop: 5,
      height: 200,
      width: '80%',
    },
    msg: { marginTop: 20, marginHorizontal: 20, alignSelf: 'center' },
    btnContinue: {
      marginTop: 30,
      marginHorizontal: 20,
      alignSelf: 'flex-end',
    },
    btnLayout: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 30,
      marginHorizontal: 20,
      gap: 20,
    },
  });

export default SettingSetup;
