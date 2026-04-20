import {CustomImage, CustomText, Shadow} from '@/components/atoms';
import {ImageType} from '@/components/atoms/customImage/customImage';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomHeader} from '@/components/molecules';
import {SafeScreen, SupportPopup} from '@/components/template';

import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useAppNavigation} from '@/utils/navigationUtils';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

const HelpCenter = () => {
  /** Added by @Yuvraj 31-01-2025 -> navigate to different screen (FYN-4295) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4295) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4295) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4295) */
  const {t} = useTranslation();

  /** Added by @Yuvraj 31-01-2025 -> state for support bottom popup categories (#4295) */
  const [supportBottomPopup, setSupportBottomPopup] = useState(false);

  return (
    <SafeScreen>
      <View>
        <CustomHeader showBack title={t('HelpCenter')} />
        <ScrollView>
          <View style={styles.main}>
            <Shadow
              onPress={() => navigation.navigate('Faq')}
              style={styles.shadowContainer}>
              <View style={styles.shadowSubContainer}>
                <CustomImage
                  source={Images.error}
                  type={ImageType.svg}
                  color={theme.colors.outline}
                  style={styles.image}
                />
                <CustomText
                  color={theme.colors.outline}
                  variant={TextVariants.bodyLarge}>
                  {t('Faq')}
                </CustomText>
              </View>
            </Shadow>
            <Shadow
              onPress={() => setSupportBottomPopup(true)}
              style={styles.shadowContainer}>
              <View style={styles.shadowSubContainer}>
                <CustomImage
                  source={Images.headphone}
                  type={ImageType.svg}
                  fillColor={theme.colors.outline}
                  style={styles.image}
                />
                <CustomText
                  color={theme.colors.outline}
                  variant={TextVariants.bodyLarge}>
                  {t('Support')}
                </CustomText>
              </View>
            </Shadow>
          </View>
        </ScrollView>
        <SupportPopup
          setShown={setSupportBottomPopup}
          shown={supportBottomPopup}
        />
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      padding: 20,
      flex: 1,
    },
    shadowContainer: {
      margin: 10,
    },
    shadowSubContainer: {
      alignItems: 'center',
      gap: 10,
    },
    image: {
      height: 25,
      width: 25,
    },
  });

export default HelpCenter;
