import { CustomButton, CustomImage, CustomText } from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { SafeScreen } from '@/components/template';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

function SessionOutScreen() {
  /** Added by @Tarun 05-02-2025 -> navigate to different screen (FYN-4204) */
  const navigation = useAppNavigation();

  /** Added by @Tarun 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4204) */
  const theme = useTheme();

  /** Added by @Tarun 05-02-2025 -> access StylesSheet with theme implemented (FYN-4204) */
  const styles = makeStyles(theme);

  /** Added by @Tarun 05-02-2025 -> translations for labels (FYN-4204) */
  const { t } = useTranslation();

  return (
    <SafeScreen>
      <View style={styles.main}>
        <View style={styles.contentContainer}>
          <CustomImage
            source={Images.appBanner}
            style={styles.image}
            resizeMode={ResizeModeType.contain}
          />
          <CustomText
            variant={TextVariants.headlineLarge}
            style={styles.title}
            allowFontScaling={false}
          >
            {t('SessionExpired')}
          </CustomText>
          <CustomText
            variant={TextVariants.titleMedium}
            style={styles.subtitle}
            allowFontScaling={false}
          >
            {t('SessionExpiredTitle')}
          </CustomText>
          <CustomText style={styles.subtitleMsg} allowFontScaling={false}>
            {t('SessionExpiredSubTitle')}
          </CustomText>
        </View>
        <View style={styles.loginLayout}>
          <CustomButton
            style={styles.loginBtn}
            onPress={async () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            }}
          >
            {t('GoToLogin')}
          </CustomButton>
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      marginTop: 100,
      paddingHorizontal: 20,
      paddingBottom: 30,
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    contentContainer: {
      alignItems: 'center',
      flex: 1,
    },
    image: {
      marginTop: 50,
      width: '100%', // Adjust the size as needed
      height: '40%', // Adjust the size as needed
      alignSelf: 'center',
    },
    title: {
      marginTop: 100,
      alignSelf: 'center',
    },
    subtitle: {
      marginTop: 10,
      marginHorizontal: 40,
      textAlign: 'center',
    },
    subtitleMsg: {
      marginTop: 5,
      marginHorizontal: 40,
      textAlign: 'center',
    },
    loginLayout: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    loginBtn: {
      marginTop: 30,
    },
  });

export default SessionOutScreen;
