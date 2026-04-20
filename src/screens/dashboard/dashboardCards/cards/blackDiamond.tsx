import {CustomImage, CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {
  GetCardsForUserDashboardModel,
  GetClientBlackDiamondModel,
} from '@/services/models';
import {TenantInfo} from '@/tenantInfo';
import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetClientBlackDiamondModel;
  isPrimary: boolean;
};

function BlackDiamond(props: Props) {
  /** Added by @Akshita 11-04-25 -> to access app theme(colors, roundness, fonts, etc) (FYN-5403) */
  const theme = useTheme();

  /** Added by @Akshita 11-04-25 -> access StylesSheet with theme implemented (FYN-5403) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 11-04-25 -> translations for labels (FYN-5403) */
  const {t} = useTranslation();

  const isBarry = TenantInfo.AppName === 'barryinvestment';

  const backgroundColor = isBarry
    ? props.isPrimary
      ? theme.colors.primary
      : theme.colors.surface // secondary color (white or light background)
    : undefined;

  const textColor =
    props.isPrimary || isBarry
      ? theme.colors.surface
      : theme.colors.onSurfaceVariant;

  const maxFontSize = 1.3;
  return (
    <View style={styles.cardMain}>
      {isBarry && <CustomImage style={styles.img} source={Images.barryBD} />}
      <View style={styles.bDiamondLay}>
        <View style={styles.headerContainer}>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={textColor}
            variant={TextVariants.bodyLarge}>
            {props.cardData.title}
          </CustomText>
        </View>
        {!props.data.message ? (
          <View style={styles.Container}>
            {props.data.emv && (
              <CustomText
                color={textColor}
                variant={TextVariants.headlineMedium}>
                {props.data.emv}
              </CustomText>
            )}
            {props.data.asOfDate && (
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                color={textColor}
                variant={TextVariants.labelLarge}>
                {`(${t('AsOfPreviousMarketClose')})`}
              </CustomText>
            )}
          </View>
        ) : (
          props.data?.message &&
          props.data.status == 0 && <ErrorCard msg={props.data.message} />
        )}
        {props.cardData.customLink && (
          <CustomLinkIconCard url={props.cardData.customLink} />
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: {flex: 1},
    img: {
      height: '100%',
      width: '100%',
      borderRadius: theme.roundness,
    },
    bDiamondLay: {
      height: '100%',
      width: '100%',
      padding: 20,
      borderRadius: theme.roundness,
      position: 'absolute',
    },
    headerContainer: {
      // alignItems: 'center',
      paddingTop: 0,
      paddingRight: 50,
    },

    Container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 15,
    },
  });

export default BlackDiamond;
