import { CustomImage, CustomText } from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { GetCardsForUserDashboardModel } from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useCustomInAppBrowser } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  isPrimary: boolean;
};

function CustomDashboardCard(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const maxFontSize = 1.3;

  return (
    <View style={styles.cardMain}>
      {props.cardData.sliderBackgroundImageURL ? (
        <CustomImage
          source={{ uri: props.cardData.sliderBackgroundImageURL }}
          style={styles.img}
          resizeMode={ResizeModeType.stretch}
        />
      ) : (
        <View style={styles.cardTitleLay}>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            variant={TextVariants.titleMedium}
            color={
              props.isPrimary
                ? theme.colors.surface
                : theme.colors.onSurfaceVariant
            }
          >
            {props.cardData.title}
          </CustomText>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={
              props.isPrimary
                ? theme.colors.surface
                : theme.colors.onSurfaceVariant
            }
          >
            {props.cardData.message}
          </CustomText>
        </View>
      )}
      {props.cardData.customLink ||
        (props.cardData.destination && (
          <CustomLinkIconCard
            url={
              props.cardData.customLink
                ? props.cardData.customLink
                : props.cardData.destination
                ? props.cardData.destination
                : ''
            }
          />
        ))}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: { flex: 1 },
    img: {
      height: '100%',
      width: '100%',
      borderRadius: 5,
    },
    linkTap: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 15,
    },
    linkView: {
      backgroundColor: theme.colors.backdrop,
      borderRadius: theme.roundness,
      padding: 5,
    },
    linkIcon: {
      height: 30,
      width: 30,
    },
    cardTitleLay: {
      flex: 1,
      gap: 10,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
  });

export default CustomDashboardCard;
