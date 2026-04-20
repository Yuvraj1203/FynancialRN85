import {
  CustomAvatar,
  CustomImage,
  CustomText,
  HtmlRender,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetUserDetailForProfileModel,
  SignalRMessageModel,
} from '@/services/models';
import { userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';

import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppRoute } from '@/utils/navigationUtils';
import {
  isEmpty,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

/**
 * Added by @Akshita 05-02-25 -> Defines props for the MemberProfile component (FYN-4846)
 *
 * A type that specifies the props for the MemberProfile component. It includes the `userId` prop
 * that is used to identify the user whose profile is being displayed.
 *
 * @param {Object} props - The props for the MemberProfile component.
 * @param {string | number} [props.userId] - The ID of the user whose profile is being displayed.
 *
 * @returns {MemberProfileProps} The props type for the MemberProfile component.
 */
export type MemberProfileProps = {
  userId?: string | number;
  AvailabilityStatus?: string;
};

function MemberProfile() {
  /** @Akshita 05-02-25 ---> Retrieves route parameters for GroupMember screen (FYN-4846) */
  const route = useAppRoute('MemberProfile'); // route

  /** @Akshita 05-02-25 ---> Gets the current theme for styling (FYN-4846) */
  const theme = useTheme();

  /** @Akshita 05-02-25 ---> Generates styles dynamically based on the theme (FYN-4846) */
  const styles = makeStyles(theme);

  /** @Akshita 05-02-25 ---> Translation hook for multi-language support (FYN-4846) */
  const { t } = useTranslation(); // translations

  /** @Akshita 05-02-25 --->stores the member profile data (FYN-4846) */
  const [userData, setUserData] = useState<GetUserDetailForProfileModel>();

  /** @Akshita 05-02-25 ---> State to track loading status to show skeleton (FYN-4846) */
  const [loading, setLoading] = useState<boolean>(false);

  /** @Akshita 29-08-25 ---> State to track loading status to show skeleton (FYN-4846) */
  const [availabilityStatus, setAvailabilityStatus] = useState<string>(
    route.params?.AvailabilityStatus ?? '',
  );

  /** @Akshita 05-02-25 ---> in app browser to open links (FYN-4846) */
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Akshita 29-08-25---> Retrieves signal R details from store(FYN-9294 */
  const signalRStore = useSignalRStore();

  /** Added by @Akshita 05-02-25 --->  Fetching user details from the global store(FYN-4314)*/
  const userDetails = userStore(state => state.userDetails);

  /** @Akshita 05-02-25 ---> getUserDetailForProfileApi call when component mounts(FYN-4846) */
  useEffect(() => {
    getUserDetailForProfileApi.mutate({
      UserId: route.params?.userId,
    });
  }, []);

  /** @Akshita 05-02-25 ---> getUserDetailForProfileApi call when component mounts(FYN-4846) */
  useEffect(() => {
    if (route.params?.AvailabilityStatus) {
      setAvailabilityStatus(route.params.AvailabilityStatus);
    }
  }, [route?.params?.AvailabilityStatus]);

  useEffect(() => {
    if (userDetails) {
      /**
             *Added by @Akshita 23-07-25 ---> Function to handle the status update and update the 
             outOfOfficeMembers status in the list */

      const handleStatusUpdate = (data: SignalRMessageModel) => {
        Log('Status update received=>' + JSON.stringify(data));

        if (data.userId == route.params?.userId) {
          setAvailabilityStatus(data.status!);
        }
      };
      /**
       * Assign the handler to the status change event
       */
      if (signalRStore.userWithUpdatedStatus) {
        handleStatusUpdate(signalRStore.userWithUpdatedStatus);
      }
    }
  }, [signalRStore.userWithUpdatedStatus]);

  /** Added by @Akshita 05-02-25 --->  function to set the color of the status value (FYN-4314)*/
  const handleUserStatusColor = (value?: string) => {
    if (value?.trim().toLowerCase() == 'available') {
      return theme.colors.statusAvailableColor;
    } else if (value?.trim().toLowerCase() == 'busy') {
      return theme.colors.statusBusyColor;
    } else if (value?.trim().toLowerCase() == 'out of office') {
      return theme.colors.error;
    }
  };

  /** @Akshita 05-02-25 ---> get member profile Api call to display user data START (FYN-4846) */
  const getUserDetailForProfileApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserDetailForProfileModel>({
        endpoint: ApiConstants.GetUserDetailForProfile,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** @Akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4846) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** @Akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4846) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        /**
         * Added by @Akshita 05-02-25 --->  process the HTML content and converts to text (FYN-4846)
         * and segregate the iframe (photo & video) List to display processed image on screen instead of link/url
         */
        const htmlData = processHtmlContent({
          html: data?.result?.aboutMe,
          maxWords: 50,
          linkColor: theme.colors.links,
        });

        /** Added by @Akshita 05-02-25 ---> stores the api response in the list (FYN-4846) */

        setUserData({
          ...data.result,
          aboutMe: htmlData ? htmlData.Content : data.result.aboutMe,
          iFrameList: htmlData && htmlData.iFrameList,
        });
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
        <CustomHeader showBack title={t('MemberProfile')} />
        {loading ? (
          <Skeleton>
            <View style={styles.skeletonLay}>
              <View style={styles.skeletonHeading} />
              <View style={styles.skeletonTitle} />
              {[...Array(6).keys()].map((_, index) => (
                <View key={index} style={styles.skeletonDesc} />
              ))}
            </View>
          </Skeleton>
        ) : userData ? (
          <ScrollView>
            <View style={styles.main}>
              <Tap
                disableRipple
                onPress={() => {
                  if (userData.profileImageUrl) {
                    const imageList = [userData.profileImageUrl];
                    showImagePopup({
                      imageList: imageList,
                      defaultIndex: 0,
                    });
                  }
                }}
              >
                <Shadow style={styles.shadow}>
                  <CustomAvatar
                    source={
                      !isEmpty(userData.profileImageUrl) && {
                        uri: userData.profileImageUrl,
                      }
                    }
                    text={
                      isEmpty(userData.profileImageUrl)
                        ? userData.fullName
                        : undefined
                    }
                    viewStyle={styles.profilePic}
                    imageStyle={styles.profilePic}
                  />

                  {availabilityStatus?.trim().toLowerCase() ==
                    'out of office' ||
                  availabilityStatus?.toLowerCase() == 'o' ? (
                    <View
                      style={[
                        styles.statusIconLay,
                        {
                          backgroundColor: theme.dark
                            ? theme.colors.onSurface
                            : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <CustomImage
                        source={Images.outofOffice}
                        type={ImageType.png}
                        style={styles.outofOfficeIcon}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        {
                          backgroundColor:
                            handleUserStatusColor(availabilityStatus),
                        },
                        styles.statusIconLay,
                      ]}
                    ></View>
                  )}
                </Shadow>
              </Tap>
              <CustomText
                variant={TextVariants.titleLarge}
                color={theme.colors.primary}
                style={styles.name}
              >
                {userData.fullName}
              </CustomText>

              {(userData.country || userData.state || userData.city) && (
                <View style={styles.locationContainer}>
                  <CustomImage
                    type={ImageType.svg}
                    source={Images.location}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <CustomText style={styles.locationText}>
                    {[userData.city, userData.state, userData.country]
                      .filter(part => !isEmpty(part))
                      .join(' | ')}
                  </CustomText>
                </View>
              )}

              {!isEmpty(userData.aboutMe) && (
                <View>
                  <CustomText
                    variant={TextVariants.bodyLarge}
                    color={theme.colors.primary}
                    style={styles.aboutMe}
                  >
                    {t('AboutMe')}
                  </CustomText>
                  <HtmlRender
                    html={userData.aboutMe}
                    openLinks={openInAppBrowser}
                    iFrameList={userData.iFrameList}
                    handleIframeClick={iframeString => {
                      showImagePopup({ iframe: iframeString });
                    }}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <EmptyView
            imageColor={theme.colors.onSurfaceVariant}
            label={t('NoUserFound')}
            style={styles.emptyLay}
          />
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
      width: 130,
      height: 130,
      borderRadius: theme.roundness,
      marginTop: 30,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 15,
      borderRadius: 3,
      marginTop: 15,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 20,
      borderRadius: 3,
      marginTop: 10,
      marginBottom: 20,
    },
    main: { margin: 20 },
    profilePicLay: {
      alignSelf: 'center',
      height: 100,
      width: 100,
      borderRadius: 50,
      shadowColor: theme.colors.shadow,
      position: 'absolute',
    },
    shadow: {
      height: 130,
      width: 130,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      position: 'relative',
    },
    profilePic: {
      width: 130,
      height: 130,
      borderRadius: theme.roundness,
    },
    name: {
      marginTop: 15,
      alignSelf: 'center',
    },
    aboutMe: {
      marginVertical: 10,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    locationText: {
      marginLeft: 5,
    },
    emptyLay: {
      alignSelf: 'center',
    },
    statusIconLay: {
      position: 'absolute',
      left: 120,
      top: 115,
      borderRadius: 20, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 20, // Ensure size consistency
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outofOfficeIcon: {
      width: 20,
      height: 20,
    },
  });

export default MemberProfile;
