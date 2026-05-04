import { AppVersion } from '@/App';
import { CustomImage, CustomText } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomDrawerItem, CustomPopup } from '@/components/molecules';
import { showTemplatePopup } from '@/components/template/templatePopup/templatePopup';
import { DrawerModel, UserRoleEnum } from '@/services/models';
import { templateStore, tenantDetailStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { useLogout } from '@/utils/utils';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export let showLogoutPopup: () => void;

function AppDrawer(props: any) {
  const theme = useTheme(); // access theme

  const insets = useSafeAreaInsets(); // Handle status/navigation bar safely

  const styles = makeStyles(theme, insets); // access StylesSheet with theme implemented

  const { t } = useTranslation(); // translation

  const userData = userStore(); // user store

  /** Added by @Tarun 05-02-2025 -> tenant details store (FYN-4204) */
  const tenantDetail = tenantDetailStore().tenantDetails;

  const { logout } = useLogout();

  const [drawerList, setDrawerList] = useState<DrawerModel[]>([]); // drawer list

  const [showLogout, setShowLogout] = useState(false); // show logout dialog

  const [logoutLoading, setLogoutLoading] = useState(false); // show logout dialog

  const templateData = templateStore();
  const navigation = useAppNavigation();

  const signalRConnected = useSignalRStore(state => state.isConnected);

  var DrawerContactsList = [
    {
      title: t('ActionItems'),
      image: Images.actionItem,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('ActionItemList');
      },
    },
    {
      title: t('Events'),
      image: Images.helpCenter,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('EventViewAll');
      },
    },
    {
      title: t('MyTeam'),
      image: Images.myTeams,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('MyTeams');
      },
    },
    ...(tenantDetail?.allowCommunityTemplateCreation
      ? [
          {
            title: t('Community'),
            image: Images.community,
            imageType: ImageType.svg,
            onPress: () => {
              navigation.navigate('Community');
            },
          },
        ]
      : []),
    {
      title: t('ReferFriend'),
      image: Images.refer,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('ReferFriend');
      },
    },
    // {
    //   title: t('Contactus'),
    //   image: Images.contactUs,
    //   imageType: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('ContactUs');
    //   },
    // },
    // {
    //   title: t('HelpCenter'),
    //   image: Images.helpCenter,
    //   imageType: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('HelpCenter');
    //   },
    // },
    // {
    //   title: t('Settings'),
    //   image: Images.settings,
    //   imageType: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('SettingsScreen');
    //   },
    // },
    {
      title: t('Logout'),
      image: Images.logout,
      imageType: ImageType.svg,
      onPress: () => {
        setShowLogout(true);
      },
    },
  ] as DrawerModel[];

  var DrawerAdvisorList = [
    {
      title: t('ReferFriend'),
      image: Images.refer,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('ReferFriend');
      },
    },
    // {
    //   title: t('HelpCenter'),
    //   image: Images.helpCenter,
    //   imageType: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('HelpCenter');
    //   },
    // },
    ...(tenantDetail?.allowCommunityTemplateCreation
      ? [
          {
            title: t('Community'),
            image: Images.community,
            imageType: ImageType.svg,
            onPress: () => {
              navigation.navigate('Community');
            },
          },
        ]
      : []),
    // {
    //   title: t('Contactus'),
    //   image: Images.contactUs,
    //   imageType: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('ContactUs');
    //   },
    // },
    {
      title: t('Settings'),
      image: Images.settings,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('SettingsScreen');
      },
    },
    {
      title: t('Logout'),
      image: Images.logout,
      imageType: ImageType.svg,
      onPress: () => {
        setShowLogout(true);
      },
    },
  ] as DrawerModel[];

  var DrawerContentEditorList = [
    {
      title: t('Schedule'),
      image: Images.myGroup,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'EventViewAll',
          },
        });
      },
    },
    {
      title: t('Profile'),
      image: Images.aboutMe,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'AdvisorProfile',
          },
        });
        // navigation.navigate('Profile');
      },
    },
    {
      title: t('Settings'),
      image: Images.settings,
      imageType: ImageType.svg,
      onPress: () => {
        navigation.navigate('SettingsScreen');
      },
    },
    {
      title: t('Logout'),
      image: Images.logout,
      imageType: ImageType.svg,
      onPress: () => {
        setShowLogout(true);
      },
    },
  ] as DrawerModel[];

  useEffect(() => {
    showLogoutPopup = () => {
      setShowLogout(true);
    };

    if (userData.userDetails) {
      addDynamicItem();
    }
  }, []);

  useEffect(() => {
    if (userData.userDetails && templateData.templateList) {
      addDynamicItem();
    }
  }, [templateData.templateList]);

  const addDynamicItem = async () => {
    const currentDrawerList = userData.userDetails?.isAdvisor
      ? userData.userDetails.role == UserRoleEnum.ContentEditor
        ? DrawerContentEditorList
        : DrawerAdvisorList
      : DrawerContactsList;

    if (
      !userData.userDetails?.isAdvisor &&
      templateData.templateList &&
      templateData.templateList?.length > 1
    ) {
      const index = currentDrawerList.findIndex(
        item => item.title == t('SelectExperience'),
      );
      if (index != -1) {
        currentDrawerList.splice(index, 1);
      }
      currentDrawerList.splice(currentDrawerList.length - 2, 0, {
        title: t('SelectExperience'),
        image: Images.myDiary,
        imageType: ImageType.svg,
        onPress: () => {
          showTemplatePopup();
        },
      } as DrawerModel);
    }

    setDrawerList(currentDrawerList);
  };

  return (
    <>
      <View style={styles.main}>
        <DrawerContentScrollView {...props}>
          <View style={styles.container}>
            <View style={styles.header}>
              <CustomImage
                source={Images.appBanner}
                color={theme.dark ? theme.colors.onSurfaceVariant : undefined}
                style={styles.logo}
                resizeMode={ResizeModeType.contain}
              />
            </View>
          </View>

          {drawerList.map((item, index) => (
            <CustomDrawerItem
              key={index}
              title={item.title}
              icon={item.image}
              imageType={item.imageType}
              onPress={item.onPress}
              {...props}
            />
          ))}

          <CustomPopup
            shown={showLogout}
            setShown={setShowLogout}
            compact
            title={t('Logout')}
            msg={t('LogoutMsg')}
            loading={logoutLoading}
            dismissOnBackPress={!logoutLoading}
            PositiveText={t('Yes')}
            NegativeText={t('No')}
            onNegativePress={() => {
              setLogoutLoading(false);
              setShowLogout(false);
            }}
            onPositivePress={() => {
              setLogoutLoading(true);
              logout({}).then(value => {
                setLogoutLoading(false);
                setShowLogout(false);
              });
            }}
          />
        </DrawerContentScrollView>

        <View style={styles.bottomLay}>
          {signalRConnected && <View style={styles.dot} />}
          <View style={styles.versionLay}>
            <CustomText variant={TextVariants.labelMedium}>{`${t(
              'BuildVersion',
            )} : ${AppVersion}`}</CustomText>
            <CustomText variant={TextVariants.labelMedium}>
              {`${t('Version')} : ${DeviceInfo.getVersion()}`}
            </CustomText>
          </View>
        </View>
      </View>
    </>
  );
}

const makeStyles = (
  theme: CustomTheme,
  insets: { top: number; bottom: number },
) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    container: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    themeSwitch: {
      padding: 8,
      backgroundColor: theme.colors.onSurfaceVariant,
      borderRadius: 100,
    },
    themeSwitchIcon: {
      height: 20,
      width: 20,
    },
    name: {
      marginTop: 12,
    },
    bottomPopUpContainer: {
      marginHorizontal: 10,
      marginBottom: 10,
    },
    textStyle: { marginHorizontal: 5, marginBottom: 20 },
    biometricLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      padding: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.border,
    },
    icon: {
      height: 180,
      width: 150,
      alignSelf: 'center',
      margin: 10,
    },
    logo: {
      alignSelf: 'center',
      marginTop: 10,
      height: 60,
      width: '100%',
    },
    versionLay: {
      marginHorizontal: 10,
    },
    bottomLay: {
      flexDirection: 'row',
      paddingTop: 20,
      paddingBottom: insets.bottom,
      borderTopWidth: 0.5,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
    },
    dot: {
      height: 5,
      width: 5,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.completed,
      marginTop: 5,
    },
  });

export default AppDrawer;
