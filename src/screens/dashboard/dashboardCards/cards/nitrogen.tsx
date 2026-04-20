import { CustomImage, CustomText, Shadow } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  GetCardsForUserDashboardModel,
  GetClientNitrogenModel,
} from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetClientNitrogenModel;
  isPrimary: boolean;
};

function Nitrogen(props: Props) {
  /** Added by @Akshita 11-04-25 -> to access app theme(colors, roundness, fonts, etc) (FYN-6424) */
  const theme = useTheme();

  /** Added by @Akshita 11-04-25 -> access StylesSheet with theme implemented (FYN-6424) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 11-04-25 -> translations for labels (FYN-6424) */
  const { t } = useTranslation();

  return (
    <View style={styles.nitrogenLay}>
      <View style={styles.cardHeader}>
        <View style={styles.gpaContainer}>
          {props.data.showGPA && props.data.message == null && (
            <View>
              <CustomImage
                source={Images.nitrogenGpa}
                style={styles.hexagpnIcon}
              />
              <CustomText
                variant={TextVariants.titleLarge}
                allowFontScaling={false}
                style={styles.gpaValue}
              >
                {props.data.gpa}
              </CustomText>
            </View>
          )}
        </View>
        <View style={styles.logoContainer}>
          <CustomImage
            style={styles.nitrogenLogoImg}
            source={Images.nitrogenFullLogo}
            type={ImageType.png}
            resizeMode={ResizeModeType.contain}
          />
        </View>
      </View>
      {props.data?.message == null ? (
        <View style={styles.middleContainer}>
          <Shadow
            style={
              props.data.showBestWorst
                ? styles.riskNoContainer
                : styles.riskNoContainerWithoutBestWorst
            }
          >
            <CustomText
              allowFontScaling={false}
              color={theme.colors.onSurfaceVariant}
              variant={TextVariants.displaySmall}
            >
              {t('RISK')}
            </CustomText>
            <CustomText
              allowFontScaling={false}
              variant={TextVariants.displayLarge}
            >
              {props.data.riskNo}
            </CustomText>
          </Shadow>
          {props.data.showBestWorst && (
            <View style={styles.bestWorstContainer}>
              <View style={styles.redCard}>
                <CustomText
                  allowFontScaling={false}
                  variant={TextVariants.headlineSmall}
                  color={theme.colors.surface}
                >
                  {props.data.worst}
                </CustomText>
              </View>
              <View style={styles.greenCard}>
                <CustomText
                  allowFontScaling={false}
                  variant={TextVariants.headlineSmall}
                  color={theme.colors.surface}
                >
                  {props.data.best}
                </CustomText>
              </View>
            </View>
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
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    nitrogenLay: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.assetCardBg,
      borderRadius: theme.roundness,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    hexagpnIcon: {
      height: 63,
      width: 63,
    },
    gpaContainer: {
      position: 'absolute',
      zIndex: 10,
    },
    gpaValue: {
      position: 'absolute',
      top: 19,
      left: 19,
    },
    bestWorstContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 30,
      marginTop: 5,
      alignSelf: 'center',
    },
    nitrogenLogoImg: {
      width: 150,
      height: 40,
      alignSelf: 'center',
    },
    logoContainer: {
      flex: 1,
      height: 65,
    },
    middleContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    riskNoContainer: {
      height: 135,
      width: 130,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.assetCardBg,
      borderRadius: theme.roundness,
      borderColor: theme.colors.assetCardText,
      borderWidth: 4,
      padding: 0,
    },
    riskNoContainerWithoutBestWorst: {
      height: 135,
      width: 130,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.assetCardBg,
      borderRadius: theme.roundness,
      borderColor: theme.colors.assetCardText,
      borderWidth: 4,
      padding: 0,
      marginTop: 25,
    },
    redCard: {
      height: 60,
      width: 120,
      backgroundColor: theme.colors.worst,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.roundness,
    },
    greenCard: {
      height: 60,
      width: 120,
      backgroundColor: theme.colors.best,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.roundness,
    },
  });

export default Nitrogen;
