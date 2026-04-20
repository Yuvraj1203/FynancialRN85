import { CustomImage, CustomText } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  msg?: string;
};

function ErrorCard(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();
  const maxFontSize = 1.3;

  return (
    <View style={styles.errorMain}>
      <View style={styles.errorLay}>
        <CustomImage
          source={Images.error}
          type={ImageType.svg}
          color={theme.colors.assetCardText}
          style={styles.errorIcon}
        />
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          style={styles.errorMsg}
          color={theme.colors.assetCardText}
        >
          {props.msg}
        </CustomText>
      </View>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    errorMain: { flex: 1, justifyContent: 'center', alignContent: 'center' },
    errorLay: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: theme.colors.skeletonHighlight,
      borderRadius: theme.roundness,
      marginTop: 10,
      padding: 10,
    },
    errorIcon: {
      height: 20,
      width: 20,
      marginTop: 3,
    },
    errorMsg: {
      flex: 1,
    },
  });

export default ErrorCard;
