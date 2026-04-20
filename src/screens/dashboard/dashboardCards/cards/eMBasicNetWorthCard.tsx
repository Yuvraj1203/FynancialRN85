import {CustomButton, CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {VaultScreenParent} from '@/screens/vault/vault';
import {
  GetCardsForUserDashboardModel,
  GetClientBasicNetworthModel,
} from '@/services/models';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useAppNavigation} from '@/utils/navigationUtils';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetClientBasicNetworthModel;
  isPrimary: boolean;
};

function EMBasicNetWorthCard(props: Props) {
  const navigation = useAppNavigation();
  /** Added by @Akshita 11-04-25 -> to access app theme(colors, roundness, fonts, etc) (FYN-4319) */
  const theme = useTheme();

  /** Added by @Akshita 11-04-25 -> access StylesSheet with theme implemented (FYN-4319) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 11-04-25 -> translations for labels (FYN-4319) */
  const {t} = useTranslation();
  const maxFontSize = 1.3;

  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const btnTextColor = props.isPrimary
    ? theme.colors.onSurfaceVariant
    : theme.colors.surface;

  return (
    <View style={[styles.eMBasicNetWorthLay]}>
      <View style={styles.headerContainer}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={textColor}
          variant={TextVariants.bodyLarge}>
          {props.cardData.title}
        </CustomText>
      </View>
      {!props.data.message && props.data.status == 1 ? (
        <View style={styles.Container}>
          <View
            style={
              props.isPrimary ? styles.outlinedBoxPrimary : styles.outlinedBox
            }>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyMedium}>
              {t('Assets')}
            </CustomText>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyLarge}>
              {props.data.assets}
            </CustomText>
          </View>
          <View
            style={
              props.isPrimary ? styles.outlinedBoxPrimary : styles.outlinedBox
            }>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyMedium}>
              {t('Liabilities')}
            </CustomText>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyLarge}>
              {props.data.liabilities}
            </CustomText>
          </View>
          <View
            style={
              props.isPrimary ? styles.outlinedBoxPrimary : styles.outlinedBox
            }>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyMedium}>
              {t('NetWorth')}
            </CustomText>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={textColor}
              variant={TextVariants.bodyLarge}>
              {props.data.basicNetWorth}
            </CustomText>
          </View>
        </View>
      ) : (
        props.data?.message &&
        props.data.status == 0 && <ErrorCard msg={props.data.message} />
      )}
      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}

      {props.data.status == 1 && props.data.showVault && (
        <View style={styles.vaultButtonContainer}>
          <CustomButton
            color={textColor}
            style={styles.vaultButton}
            onPress={() => {
              navigation.navigate('Vault', {
                cardType: VaultScreenParent.fromEMoney,
              });
            }}>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={btnTextColor}>{`${t(
              'GoToEMoneyVault',
            )} ${'>'}`}</CustomText>
          </CustomButton>
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    eMBasicNetWorthLay: {
      flex: 1,
      padding: 20,
      borderRadius: theme.roundness,
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
      gap: 10,
      justifyContent: 'center',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    vaultButton: {
      justifyContent: 'center',
      alignSelf: 'center',
      textAlignVertical: 'center',
      borderRadius: theme.roundness,
      marginHorizontal: 15,
    },

    vaultButtonContainer: {
      marginTop: 10,
      // marginBottom: 22,
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
      borderWidth: 0.6,
      borderColor: theme.colors.onSurfaceVariant,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      justifyContent: 'space-between',

      padding: 10,

      // height: 40,
      alignItems: 'center',

      gap: 10,
    },
    outlinedBoxPrimary: {
      borderWidth: 0.6,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      justifyContent: 'space-between',

      padding: 10,

      // height: 40,
      alignItems: 'center',

      gap: 10,

      marginTop: 10,
    },
  });

export default EMBasicNetWorthCard;
