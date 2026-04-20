import { CustomImage } from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

type Props = {};

function AppBanner(props: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const { t } = useTranslation();

  return (
    <CustomImage
      source={Images.appBanner}
      color={theme.dark ? theme.colors.onSurfaceVariant : undefined}
      style={styles.logo}
      resizeMode={ResizeModeType.contain}
    />
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    logo: {
      alignSelf: 'center',
      marginTop: 10,
      height: 100,
      width: '80%',
    },
  });

export default AppBanner;
