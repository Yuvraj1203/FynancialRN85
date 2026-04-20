import {CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {
  GetAddeparModel,
  GetCardsForUserDashboardModel,
} from '@/services/models';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetAddeparModel;
  isPrimary: boolean;
};

function AddeparAUMV2(props: Props) {
  /** Added by @Akshita 13-04-25 -> to access app theme(colors, roundness, fonts, etc) FYN-5399 */
  const theme = useTheme();

  /** Added by @Akshita 13-04-25 -> access StylesSheet with theme implemented (FYN-5399) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 13-04-25 -> translations for labels (FYN-5399) */
  const {t} = useTranslation();

  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const maxFontSize = 1.3;
  return (
    <View style={styles.addeparAUMV2Lay}>
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
          {props.data.aum && (
            <CustomText color={textColor} variant={TextVariants.headlineMedium}>
              {props.data.aum}
            </CustomText>
          )}
          {props.data.aum && (
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.labelLarge}>
              {`(${t('AsOfPreviousMarketClose')})`}
            </CustomText>
          )}
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
    addeparAUMV2Lay: {
      flex: 1,
      padding: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    Container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginBottom: 35,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    saveButton: {
      marginHorizontal: 20,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
    },
    downArrowIcon: {
      height: 13,
      width: 13,
    },
    upArrowIcon: {
      height: 13,
      width: 13,
      transform: [{rotate: '180deg'}],
    },
    monthYearText: {
      alignSelf: 'flex-end',
    },
    buttonText: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    outlinedBox: {
      borderWidth: 1,
      borderColor: theme.colors.onSurfaceVariant,
      borderRadius: theme.roundness,
    },
  });

export default AddeparAUMV2;
