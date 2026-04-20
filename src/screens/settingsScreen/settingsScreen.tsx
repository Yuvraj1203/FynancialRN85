import { storage } from '@/App';
import { CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomDropDownPopup, CustomHeader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { sessionService } from '@/components/template/biometricPopup/sessionService';
import { LoginWith, ThemeModel } from '@/services/models';
import { appThemeStore, biometricStore, userStore } from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import { ThemeVariants } from '@/store/themeStore/themeStore';

import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppNavigation } from '@/utils/navigationUtils';
import { openAppSettings, showSnackbar } from '@/utils/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Divider } from 'react-native-paper';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const SettingsScreen = () => {
  /** Added by @Yuvraj 31-01-2025 -> navigate to different screen (FYN-4295) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4295) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4295) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4295) */
  const { t } = useTranslation();

  const biometricEnabled = biometricStore(); // biometric Store

  const [showPopup, setShowPopup] = useState(false); // show global popup

  const themeStore = appThemeStore(); // theme store

  const themeList: ThemeModel[] = [
    {
      id: ThemeVariants.light,
      theme: t('Light'),
    },
    { id: ThemeVariants.dark, theme: t('Dark') },
    { id: ThemeVariants.system, theme: t('DeviceTheme') },
  ];

  const [selectedTheme, setSelectedTheme] = useState(
    themeList.find(item => item.id == themeStore.AppTheme),
  );

  const userData = userStore(state => state.userDetails); // user store

  const handleBiometricClick = async () => {
    try {
      if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.FACE_ID);
        Log('FaceID Permission => ' + status);

        if (status === RESULTS.DENIED || status === RESULTS.BLOCKED) {
          // Try requesting permission if not permanently blocked
          const newStatus = await request(PERMISSIONS.IOS.FACE_ID);
          Log('FaceID Request Result => ' + newStatus);

          if (newStatus === RESULTS.DENIED || newStatus === RESULTS.BLOCKED) {
            showAlertPopup({
              title: t('FaceIDPermissionRequired'),
              msg: t('EnableFaceIdMsg'),
              PositiveText: t('OpenSettings'),
              NegativeText: t('Cancel'),
              dismissOnBackPress: false,
              onPositivePress: () => {
                storage.set('FaceIdSettings', true);
                openAppSettings();
              },
            });
            return;
          }
        } else if (status === RESULTS.UNAVAILABLE) {
          showSnackbar(t('FaceIdNotAvailable'), 'danger');
          return;
        }
      }

      // ✅ If we reach here, Face ID permission is granted or not required (Android)
      if (
        biometricEnabled.userBiometricEnabled === UserBiometricOption.disabled
      ) {
        biometricEnabled.setUserBiometricEnabled(UserBiometricOption.enabled);
        biometricEnabled.setShowBiometricPopup(true);
        //storage.set('biometricAuthenticateTime', new Date().getTime());
      } else {
        biometricEnabled.setUserBiometricEnabled(UserBiometricOption.disabled);
        storage.set('inactiveTime', new Date().getTime());
      }
      sessionService.start();
    } catch (error) {
      Log('handleBiometricClick Error => ' + JSON.stringify(error));
      showSnackbar(t('FaceIdNotAvailable'), 'danger');
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader showBack title={t('Settings')} />
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            {(userData?.loginWith == LoginWith.auth0 ||
              userData?.loginWith == LoginWith.oktaWithAuth0) && (
              <>
                <Tap
                  onPress={handleBiometricClick}
                  style={styles.shadowContainer}
                >
                  <View style={styles.viewTap}>
                    <View style={styles.shadowSubContainer}>
                      <CustomImage
                        source={Images.securityIcon}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.image}
                      />
                      <CustomText variant={TextVariants.bodyLarge}>
                        {Platform.OS == 'android'
                          ? t('Biometric')
                          : t('FaceId')}
                      </CustomText>
                    </View>
                    <Switch
                      value={
                        biometricEnabled.userBiometricEnabled ==
                        UserBiometricOption.enabled
                      }
                      ios_backgroundColor={
                        biometricEnabled.userBiometricEnabled ==
                        UserBiometricOption.disabled
                          ? theme.colors.backdrop
                          : undefined
                      }
                      onValueChange={v => handleBiometricClick()}
                    />
                  </View>
                </Tap>
                <Divider style={styles.divider} horizontalInset />
              </>
            )}

            <Tap
              onPress={() => setShowPopup(true)}
              style={styles.shadowContainer}
            >
              <View style={styles.viewTap}>
                <View style={styles.shadowSubContainer}>
                  <CustomImage
                    source={Images.theme}
                    color={theme.colors.onSurfaceVariant}
                    type={ImageType.svg}
                    style={styles.image}
                  />
                  <CustomText variant={TextVariants.bodyLarge}>
                    {t('AppTheme')}
                  </CustomText>
                </View>
                <CustomText variant={TextVariants.bodyLarge}>
                  {`${selectedTheme?.theme}   >`}
                </CustomText>
              </View>
            </Tap>
          </View>
        </ScrollView>

        <CustomDropDownPopup
          shown={showPopup}
          setShown={setShowPopup}
          title={t('AppTheme')}
          items={themeList}
          displayKey="theme"
          idKey="id"
          selectedItem={selectedTheme}
          showSearchOption={false}
          onItemSelected={value => {
            setSelectedTheme(value);
            themeStore.changeAppTheme(value.id);
          }}
        />
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: { marginTop: 20 },
    shadowContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    viewTap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    shadowSubContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    image: {
      height: 25,
      width: 25,
    },
    divider: { height: 0.5 },
  });

export default SettingsScreen;
