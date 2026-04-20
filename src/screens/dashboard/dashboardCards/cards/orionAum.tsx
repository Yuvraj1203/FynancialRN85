import {CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {
  GetCardsForUserDashboardModel,
  GetOrionAumModel,
} from '@/services/models';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetOrionAumModel;
  isPrimary: boolean;
};

function OrionAum(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const {t} = useTranslation();

  const maxFontSize = 1.3;
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

      {props.data?.status == 1 ? (
        <View style={styles.orionAumMain}>
          <CustomText
            variant={TextVariants.headlineMedium}
            color={
              props.isPrimary
                ? theme.colors.surface
                : theme.colors.onSurfaceVariant
            }>
            {props.data?.value}
          </CustomText>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            variant={TextVariants.labelLarge}
            color={
              props.isPrimary
                ? theme.colors.surface
                : theme.colors.onSurfaceVariant
            }>
            {`(${t('AsOfPreviousMarketClose')})`}

            {/* {`(${t('AsOfDate')} - ${props.data.orionAsOfDate})`} */}
          </CustomText>
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
    orionAumMain: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  });

export default OrionAum;
