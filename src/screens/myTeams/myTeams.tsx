import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetUserCoachMappingForClientModel } from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  handleOpenDialer,
  isEmpty,
  openUrl,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import DeviceInfo from 'react-native-device-info';
import { ContactVaultParentScreenType } from '../contactVault/contactVault';

function MyTeams() {
  /**  Added by @Ajay 13-2-24 ---> Navigation hook for screen navigation */
  const navigation = useAppNavigation();

  /**  Added by @Ajay 13-2-24 ---> Access theme provider */
  const theme = useTheme();

  /**  Added by @Ajay 13-2-24 ---> Stylesheet with theme implementation */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 13-2-24 ---> Translations for multi-language support */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 15-10-25 ---> in app browser for calendly link */
  const openInAppBrowser = useCustomInAppBrowser();

  /**  Added by @Ajay 13-2-24 ---> State for loading indicator */
  const [loading, setLoading] = useState(true);

  /**  Added by @Ajay 13-2-24 ---> State to store team members list */
  const [teamMembers, setTeamMembers] = useState<
    GetUserCoachMappingForClientModel[]
  >([]);

  const userDetails = userStore(state => state.userDetails);

  /**  Added by @Ajay 13-2-24 ---> Fetch team members on component mount */
  useEffect(() => {
    if (userDetails) {
      getUserCoachMapping.mutate({});
    }
  }, []);

  /**
   *  Added by @Ajay 13-2-24 ---> Fetch team members using API
   *  Calls API to retrieve user’s team members and updates state accordingly
   */
  const getUserCoachMapping = useMutation({
    mutationFn: (sendData: Record<string, any>) =>
      makeRequest<GetUserCoachMappingForClientModel[]>({
        endpoint: ApiConstants.GetUserCoachMappingForClient,
        data: sendData,
        method: HttpMethodApi.Get,
      }),
    onMutate(variables) {
      setLoading(
        true,
      ); /** Show loading indicator while fetching data (#4274) */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete (#4274) */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data?.result.length > 0) {
        setTeamMembers([...data.result]);
      } else {
        setTeamMembers([]);
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      setTeamMembers([]);
    },
  });

  /** Function to make a call */
  const makeCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      handleOpenDialer(phoneNumber);
    } else {
      showSnackbar(t('PhoneNumberNotAvail'), 'warning');
    }
  };

  /** Function to send an email */
  const sendEmail = (email?: string) => {
    if (email) {
      openUrl(`mailto:${email}`);
    } else {
      showSnackbar(t('EmailNotAvail'), 'warning');
    }
  };

  /** Function to send a message */
  const sendMessage = (adv?: GetUserCoachMappingForClientModel) => {
    if (adv?.coachId) {
      navigation.navigate('Chat', {
        userChatData: {
          targetUserId: adv?.coachId,
          targetUserName: adv?.name,
          userFullName: adv?.name,
          targetProfilePicture: adv?.profileImage,
          emailAddress: adv?.emailAddress,
        },
      });
    } else {
      showSnackbar(t('ChatUnavailable'), 'danger');
    }
  };

  /** Function to open Calendly URL */
  const openCalendly = (calendlyUrl?: string) => {
    if (calendlyUrl) {
      openInAppBrowser(calendlyUrl);
    } else {
      showSnackbar(t('UrlNotAvail'), 'danger');
    }
  };

  /** Function to render each team member */
  const renderMember = (item: GetUserCoachMappingForClientModel) => (
    <Shadow style={styles.card}>
      <Tap
        disableRipple
        onPress={() => {
          navigation.navigate('Profile', {
            navigationFrom: ContactVaultParentScreenType.fromMyTeamsAdvisor,
            userId: item.coachId,
          });
        }}
        style={styles.paddingZero}
      >
        <View style={styles.cardContent}>
          {item?.isPrimary && (
            <>
              <View style={styles.triangleBadge} />
              <CustomImage
                style={styles.starIcon}
                source={Images.star}
                type={ImageType.svg}
              />
            </>
          )}

          <View style={styles.profileCircleContainer}>
            <CustomAvatar
              source={
                !isEmpty(item?.profileImage) && {
                  uri: item?.profileImage,
                }
              }
              text={isEmpty(item?.profileImage) ? item.name : undefined}
              initialVariant={TextVariants.titleLarge}
              viewStyle={styles.profileView}
              imageStyle={styles.profileView}
            />

            {/* {item?.phoneNumber && (
            <Tap
              style={styles.callButton}
              onPress={() => makeCall(item?.phoneNumber)}>
              <ShakeView disable={!item?.phoneNumber} stepTime={2000}>
                <CustomImage
                  color={theme.colors.surface}
                  source={Images.call}
                  type={ImageType.svg}
                  style={styles.call}
                />
              </ShakeView>
            </Tap>
          )} */}
          </View>

          <CustomText style={styles.name} maxLines={1}>
            {item?.name}
          </CustomText>
          <CustomText style={styles.designation}>
            {item?.jobTitle ? item?.jobTitle : ''}
          </CustomText>

          <View style={styles.actionIcons}>
            {/* <Tap
            style={styles.iconTap}
            onPress={() => sendEmail(item?.emailAddress)}>
            <CustomImage
              source={Images.mail}
              type={ImageType.svg}
              color={theme.colors.onSurfaceVariant}
            />
          </Tap> */}
            <Tap
              style={styles.iconTap}
              onPress={() => makeCall(item?.phoneNumber)}
            >
              <CustomImage
                source={Images.call}
                type={ImageType.svg}
                color={
                  item?.phoneNumber
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.surfaceDisabled
                }
              />
            </Tap>
            <Tap
              style={styles.iconTap}
              onPress={() => {
                if (item.isMessagingEnabled) {
                  sendMessage(item);
                }
              }}
            >
              <CustomImage
                source={Images.message}
                type={ImageType.svg}
                color={
                  item.isMessagingEnabled
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.surfaceDisabled
                }
              />
            </Tap>

            <Tap
              style={styles.iconTap}
              onPress={() => openCalendly(item?.calendlyUrl)}
            >
              <CustomImage
                source={Images.calendar}
                type={ImageType.svg}
                color={
                  item?.calendlyUrl
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.surfaceDisabled
                }
              />
            </Tap>
          </View>
        </View>
      </Tap>
    </Shadow>
  );

  /** Added by @Tarun 24-03-2025 -> Render my teams item using flash list (FYN-5971) */

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('MyTeam')} />
        <View style={styles.myTeamMain}>
          {loading ? (
            <SkeletonList
              count={4}
              children={
                <View style={styles.skelContainer}>
                  {[1, 2].map((_, index) => (
                    <View key={index} style={styles.skelBody}>
                      <View style={styles.skeletonProfile} />
                      <View style={styles.skeletonTextSmall} />
                      <View style={styles.skeletonText} />
                      <View style={styles.skelContainer}>
                        <View style={styles.skeletonIcons} />
                        <View style={styles.skeletonIcons} />
                        <View style={styles.skeletonIcons} />
                      </View>
                    </View>
                  ))}
                </View>
              }
            />
          ) : (
            <CustomFlatList
              data={teamMembers}
              numColumns={DeviceInfo.isTablet() ? 4 : 2}
              contentContainerStyle={
                teamMembers.length == 0 ? styles.list : undefined
              }
              ListFooterComponent={<View style={styles.listContainer} />}
              ListEmptyComponent={<EmptyView label={t('NoAdvAvail')} />}
              refreshing={loading}
              onRefresh={() => {
                getUserCoachMapping.mutate({});
              }}
              renderItem={({ item }) => renderMember(item)}
            />
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    myTeamMain: {
      flex: 1,
      paddingHorizontal: 10,
    },
    list: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    listContainer: {
      height: 20,
      marginBottom: 50,
    },
    card: {
      flex: 1,
      // margin: 10,
      padding: 0,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.teamCard,
      margin: 8,
    },
    teamMemberContainer: {},
    cardContent: {
      alignItems: 'center',
    },
    triangleBadge: {
      alignSelf: 'flex-start',
      borderRightWidth: 55,
      borderTopWidth: 55,
      borderRightColor: 'transparent',
      borderTopColor: '#007bff',
      position: 'absolute',
      borderTopLeftRadius: theme.roundness,
    },
    starIcon: {
      position: 'absolute',
      top: 7,
      left: 7,
      height: 15,
    },
    paddingZero: {
      padding: 0,
    },
    profileCircleContainer: {
      marginTop: 20,
      marginBottom: 10,
    },
    profileView: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      fontSize: 50,
    },
    callButton: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      width: 25,
      height: 25,
      backgroundColor: theme.colors.completed,
      borderRadius: theme.roundness,
      justifyContent: 'center',
      alignItems: 'center',
    },
    call: {
      height: 15,
      width: 15,
    },
    profileText: {
      textTransform: 'uppercase',
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      margin: 4,
      textAlign: 'center',
    },
    designation: {
      fontSize: 14,
      color: '#666',
      margin: 4,
      textAlign: 'center',
    },
    actionIcons: {
      flexDirection: 'row',
      marginTop: 10,
      paddingBottom: 10,
      width: '100%',
    },
    skelContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    skelBody: {
      flex: 1,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.surface,
      alignItems: 'center',
      marginBottom: 10,
      paddingVertical: 30,
    },
    skeletonProfile: {
      width: 80,
      height: 80,
      borderRadius: theme.roundness,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 10,
      backgroundColor: theme.colors.surface,
    },
    skeletonText: {
      width: 120,
      height: 15,
      marginTop: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonTextSmall: {
      width: 80,
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonIcons: {
      width: 20,
      height: 20,
      marginVertical: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    iconTap: { flex: 1, alignItems: 'center' },
  });

export default MyTeams;
