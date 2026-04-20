import { CustomImage, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useCustomInAppBrowser } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  url: string;
};

function CustomLinkIconCard(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  return (
    <Tap
      onPress={() => {
        openInAppBrowser(props.url);
      }}
      style={styles.linkTap}
    >
      <View style={styles.linkView}>
        <CustomImage
          source={Images.link}
          type={ImageType.svg}
          color={theme.dark ? theme.colors.onSurface : theme.colors.surface}
          style={styles.linkIcon}
        />
      </View>
    </Tap>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    linkTap: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 20,
    },
    linkView: {
      backgroundColor: theme.colors.backdrop,
      borderRadius: theme.roundness,
      padding: 5,
    },
    linkIcon: {
      height: 25,
      width: 25,
    },
  });

export default CustomLinkIconCard;
