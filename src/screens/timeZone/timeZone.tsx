import { CustomButton, CustomText } from '@/components/atoms';
import { ImageType } from '@/components/atoms/cachedImage/cachedImage';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomDropDownPopup,
  CustomPopup,
  EmptyView,
} from '@/components/molecules';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import { SafeScreen } from '@/components/template';
import { navigateFromApi } from '@/navigators/applicationNavigator';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  UpdateLastSignInForUserModel,
  UserTimeZoneModel,
} from '@/services/models';
import { UpdateOnboardingJourneyModel } from '@/services/models/updateOnboardingJourneyModel/updateOnboardingJourneyModel';
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

/**
 * Added by  @Shivang 23-07-25 -> TimeZone component declaration
 */
function TimeZone() {
  /**
   * Added by  @Shivang 23-07-25 -> Initializing navigation hook
   */
  const navigation = useAppNavigation();

  /**
   * Added by  @Shivang 23-07-25 -> Initializing theme hook
   */
  const theme = useTheme();

  /**
   * Added by  @Shivang 23-07-25 -> Creating styles using theme
   */
  const styles = makeStyles(theme);

  /**
   * Added by  @Shivang 23-07-25 -> Initializing translation hook
   */
  const { t } = useTranslation();

  /**
   * Added by  @Shivang 23-07-25 -> Accessing user details from user store
   */
  const userDetails = userStore(state => state.userDetails);

  const setUserDetails = userStore(state => state.setUserDetails);

  /**
   * Added by  @Shivang 23-07-25 -> Declaring loading state
   */
  const [loading, setLoading] = useState<boolean>(false);

  const [ButtonLoading, setButtonLoading] = useState<boolean>(false);

  /**
   * Added by  @Shivang 23-07-25 -> Declaring state for selected timezone
   */
  const [selectedTimeZone, setselectedTimeZone] = useState<UserTimeZoneModel>();

  /**
   * Added by  @Shivang 23-07-25 -> Declaring state for user timezone list
   */
  const [userTimeZoneList, setuserTimeZoneList] = useState<UserTimeZoneModel[]>(
    [],
  );

  const { logout } = useLogout();

  const [showLogout, setShowLogout] = useState(false); // show logout dialog

  const [logoutLoading, setLogoutLoading] = useState(false); // show logout dialog

  /**
   * Added by  @Shivang 23-07-25 -> Fetch user timezones on mount
   */
  useEffect(() => {
    getLoginUserTimeZoneApiCall.mutate({});
  }, []);

  const isLoading = () => {
    if (loading) {
      return true;
    } else if (ButtonLoading) {
      return true;
    } else if (logoutLoading) {
      return true;
    } else {
      return false;
    }
  };
  /**
   * Added by  @Shivang 23-07-25 -> Mutation to fetch login user timezones
   */
  const getLoginUserTimeZoneApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserTimeZoneModel[]>({
        endpoint: ApiConstants.GetTimeZone,
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
      if (data?.result && data?.result.length > 0) {
        // 1) mark selected
        const zones = data.result.map(zone => ({
          ...zone,
          isSelectedTimeZone: zone.standardName === userDetails?.timeZoneName,
        }));

        // 2) pull out the one that’s selected
        const defaultZone = zones.find(z => z.isSelectedTimeZone);
        // 3) build a new list with it first
        const ordered = defaultZone
          ? [defaultZone, ...zones.filter(z => !z.isSelectedTimeZone)]
          : zones;

        // 4) store & seed state
        setuserTimeZoneList(ordered);
        if (defaultZone) {
          setselectedTimeZone(defaultZone);
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by  @Shivang 23-07-25 -> Mutation to update last sign in for user
   */
  const updatelastSignInForUserApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      fromResumeApp?: boolean;
    }) => {
      return makeRequest<UpdateLastSignInForUserModel>({
        endpoint: ApiConstants.UpdateLastSignInForUser,
        method: HttpMethodApi.Put,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setButtonLoading(false);
    },
    onSuccess(data, variables, context) {
      setUserDetails(prev => ({
        ...prev,
        isInvitedIntoTemplate: data.result?.isInvitedIntoTemplate,
        inviteLoadingMsg: data.result?.message,
        restrictLogin: data.result?.restrictLogin,
        isOnboardingComplete: data.result?.isOnboardingComplete,
      }));

      navigateFromApi(navigation, () => {
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
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by  @Shivang 23-07-25 -> Mutation to update user timezone in onboarding journey
   */
  const updateUserTimeZoneApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UpdateOnboardingJourneyModel>({
        endpoint: ApiConstants.UpdateOnboardingJourney,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setButtonLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setButtonLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      updatelastSignInForUserApi.mutate({
        apiPayload: {},
        fromResumeApp: false,
      });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by  @Shivang 23-07-25 -> Rendering CustomDropDownPopup for timezone selection
   */
  return (
    <SafeScreen>
      <View style={styles.main}>
        <View style={{ marginHorizontal: 15, marginTop: 30 }}>
          <CustomText
            variant={TextVariants.titleLarge}
            style={{ marginTop: 10, textAlign: 'left' }}
          >
            {t('TimezoneTitle')}
          </CustomText>

          <CustomText style={{ marginTop: 15, textAlign: 'left' }}>
            {t('TimezoneMsg')}
          </CustomText>

          <CustomText
            variant={TextVariants.bodyLarge}
            style={{ marginTop: 30, textAlign: 'left' }}
          >
            {t('PleaseConfirmTimezone')}
          </CustomText>
        </View>
        <View style={{ flex: 1, height: '100%', marginTop: 10 }}>
          {userTimeZoneList?.length > 0 ? (
            <CustomDropDownPopup
              style={styles.PopUpStyle}
              buttonLoading={ButtonLoading}
              loading={loading}
              items={userTimeZoneList}
              displayKey="displayName"
              saveButtonText={t('Confirm')}
              idKey="id"
              mode={DropdownModes.single}
              withPopup={false}
              selectedItem={selectedTimeZone}
              onItemSelected={value => {
                setselectedTimeZone(value);
              }}
              onSave={value => {
                updateUserTimeZoneApi.mutate({
                  userID: userDetails?.userID,
                  timeZoneName: selectedTimeZone?.standardName,
                });
              }}
            />
          ) : (
            <View style={{ height: 300 }}>
              <EmptyView label={t('NoTimeZoneAvailable')} />
            </View>
          )}

          <CustomButton
            style={styles.logoutBtn}
            mode={ButtonVariants.outlined}
            icon={{
              source: Images.logout,
              type: ImageType.svg,
            }}
            onPress={() => {
              if (!isLoading()) {
                setShowLogout(true);
              }
            }}
          >
            {t('Logout')}
          </CustomButton>
        </View>

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

/**
 * Added by  @Shivang 23-07-25 -> Styles factory using theme
 */
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    PopUpStyle: { flex: 1, height: '100%' },
    btnLayout: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 30,
      marginHorizontal: 20,
      gap: 20,
    },
    logoutBtn: {
      margin: 10,
    },
  });

/**
 * Added by  @Shivang 23-07-25 -> Exporting TimeZone component
 */
export default TimeZone;
