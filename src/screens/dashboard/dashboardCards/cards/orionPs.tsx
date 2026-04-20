import {CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {
  GetCardsForUserDashboardModel,
  GetPerformanceSummaryDataModel,
} from '@/services/models';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetPerformanceSummaryDataModel;
  isPrimary: boolean;
};

function OrionPs(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const {t} = useTranslation();

  const maxFontSize = 1.3;

  const textColorOfDataValues = () => {
    if (
      (props.data.investmentGain &&
        (props.data.investmentGain.includes('(') ||
          props.data.investmentGain.includes('-'))) ||
      (props.data.netTWR &&
        (props.data.netTWR.includes('(') || props.data.netTWR.includes('-')))
    ) {
      return theme.colors.error;
    } else {
      return theme.colors.completed;
    }
  };

  return (
    <View style={styles.orionPsLay}>
      <CustomText
        maxFontSizeMultiplier={maxFontSize}
        variant={TextVariants.bodyLarge}
        color={
          props.isPrimary ? theme.colors.surface : theme.colors.onSurfaceVariant
        }>
        {props.cardData.title}
      </CustomText>

      {props.data.status == 1 ? (
        <View style={styles.cardMain}>
          <View style={styles.orionPsData}>
            <View style={styles.orionPs}>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                variant={TextVariants.bodyMedium}
                style={styles.orionPsItemTitle}>
                {t('EndingValue')}
              </CustomText>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                variant={TextVariants.bodyLarge}
                style={styles.orionPsItemValue}>
                {props.data.endingValue}
              </CustomText>
            </View>
            <View style={styles.orionPs}>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                variant={TextVariants.bodyMedium}
                style={styles.orionPsItemTitle}>
                {t('InvestmentGain')}
              </CustomText>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                color={textColorOfDataValues()}
                variant={TextVariants.bodyLarge}
                style={styles.orionPsItemValue}>
                {props.data.investmentGain}
              </CustomText>
            </View>
            <View style={styles.orionPs}>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                variant={TextVariants.bodyMedium}
                style={styles.orionPsItemTitle}>
                {t('NetTwr')}
              </CustomText>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                color={textColorOfDataValues()}
                variant={TextVariants.bodyLarge}
                style={styles.orionPsItemValue}>
                {props.data.netTWR}
              </CustomText>
            </View>
          </View>
          <View style={styles.orionInception}>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              variant={TextVariants.bodyMedium}
              color={
                props.isPrimary
                  ? theme.colors.surface
                  : theme.colors.onSurfaceVariant
              }>
              {t('InceptionToDate')}
            </CustomText>
          </View>
        </View>
      ) : (
        props.data?.message && <ErrorCard msg={props.data.message} />
      )}

      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    orionPsLay: {
      flex: 1,
      padding: 20,
    },
    cardMain: {flex: 1},
    orionPsData: {
      flex: 1,
      justifyContent: 'center',
    },
    orionPs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.border,
      borderRadius: theme.roundness,
      marginTop: 10,
      padding: 10,
    },
    orionPsItemTitle: {
      flex: 1,
    },
    orionPsItemValue: {
      flex: 1,
      textAlign: 'right',
    },
    orionInception: {
      //flex: 1,
      justifyContent: 'flex-end',
    },
  });

export default OrionPs;
