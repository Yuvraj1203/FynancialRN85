import { CustomFlatList, CustomText, Shadow } from '@/components/atoms';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomBottomPopup } from '@/components/molecules';
import { VaultScreenParent } from '@/screens/vault/vault';
import {
  Accountlist,
  GetCardsForUserDashboardModel,
  GetClientTamaracModel,
  GetTamaracAccountsModel,
} from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetClientTamaracModel;
  isPrimary: boolean;
  cardAccountsData?: GetTamaracAccountsModel;
};

function TamaracS(props: Props) {
  const navigation = useAppNavigation();

  /** Added by @Akshita 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Akshita 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  /** Added by @Akshita 31-01-2025 -> to control the visibility of bottom pop up (FYN-4299) */
  const [showBottomPopUp, setShowBottomPopUp] = useState(false);

  const maxFontSize = 1.3;
  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const btnColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const btnTextColor = props.isPrimary
    ? theme.colors.onSurfaceVariant
    : theme.colors.surface;

  const textColorOfInvestmentGain = () => {
    if (
      props.data.investmentGain &&
      (props.data.investmentGain.includes('(') ||
        props.data.investmentGain.includes('-'))
    ) {
      return theme.colors.error;
    } else {
      return theme.colors.completed;
    }
  };

  const renderAccounts = (item: Accountlist) => {
    return (
      <View style={styles.PopUpWrapper}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={!showBottomPopUp ? textColor : ''}
          variant={TextVariants.titleSmall}
          ellipsis={TextEllipsis.tail}
          maxLines={1}
        >
          {item.accountName}
        </CustomText>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={!showBottomPopUp ? textColor : ''}
          variant={TextVariants.titleSmall}
        >
          {item.value}
        </CustomText>
      </View>
    );
  };

  return (
    <View style={styles.tamaracSLay}>
      <CustomText
        maxFontSizeMultiplier={maxFontSize}
        variant={TextVariants.bodyLarge}
        color={textColor}
      >
        {props.cardData.title}
      </CustomText>

      {!props.data.message && props.data.status == 1 ? (
        <View style={styles.cardMain}>
          <View style={styles.valueContainer}>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              variant={TextVariants.headlineMedium}
              color={textColor}
            >
              {props.data?.endingValue}
            </CustomText>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              variant={TextVariants.labelLarge}
              color={
                props.isPrimary
                  ? theme.colors.surface
                  : theme.colors.onSurfaceVariant
              }
            >
              {`(${t('AsOfPreviousMarketClose')})`}
            </CustomText>
          </View>
          <View style={styles.buttonWrapper}>
            {props.data.showAccounts && (
              <Shadow
                style={[styles.accButton, { backgroundColor: btnColor }]}
                onPress={() => {
                  setShowBottomPopUp(true);
                }}
              >
                <CustomText
                  style={{ marginVertical: -10 }}
                  variant={TextVariants.bodySmall}
                  maxFontSizeMultiplier={maxFontSize}
                  color={btnTextColor}
                >
                  {t('ShowAccounts')}
                </CustomText>
              </Shadow>
            )}
            {props.data.showVault && (
              <Shadow
                style={[styles.vaultButton, { backgroundColor: btnColor }]}
                onPress={() => {
                  navigation.navigate('Vault', {
                    cardType: VaultScreenParent.fromTamarac,
                  });
                }}
              >
                <CustomText
                  style={{ marginVertical: -10 }}
                  variant={TextVariants.bodySmall}
                  maxFontSizeMultiplier={maxFontSize}
                  color={btnTextColor}
                >
                  {t('GoToTamaracVault')}
                </CustomText>
              </Shadow>
            )}
          </View>
        </View>
      ) : (
        props.data?.message &&
        props.data.status == 0 && <ErrorCard msg={props.data.message} />
      )}

      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}

      <CustomBottomPopup
        shown={showBottomPopUp}
        setShown={setShowBottomPopUp}
        title={t('Accounts')}
      >
        <View>
          {props.cardAccountsData?.accountlist && (
            <View style={styles.popUpMain}>
              <CustomFlatList
                data={props.cardAccountsData?.accountlist}
                keyExtractor={item => `${item.accountName!}${item.value}`}
                ListHeaderComponent={() => (
                  <View style={styles.PopUpWrapper}>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      variant={TextVariants.bodyLarge}
                      ellipsis={TextEllipsis.tail}
                      maxLines={1}
                    >
                      {t('AccountName')}
                    </CustomText>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      variant={TextVariants.bodyLarge}
                    >
                      {t('Value')}
                    </CustomText>
                  </View>
                )}
                ListFooterComponent={
                  <View style={styles.headerSubTitle}>
                    <Divider style={styles.popUpDivider} />
                    <View style={styles.PopUpWrapper}>
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        variant={TextVariants.bodyLarge}
                        maxLines={1}
                      >
                        {t('TotalValue')}
                      </CustomText>

                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        variant={TextVariants.bodyLarge}
                      >
                        {props.cardAccountsData?.accountlist.length > 0
                          ? props.cardAccountsData?.totalvalue
                          : '$0'}
                      </CustomText>
                    </View>
                  </View>
                }
                renderItem={({ item }) => renderAccounts(item)}
              />
            </View>
          )}
        </View>
      </CustomBottomPopup>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    tamaracSLay: {
      flex: 1,
      padding: 20,
    },
    headerSubTitle: {
      marginTop: 5,
    },
    cardMain: {
      flex: 1,
      marginTop: 25,
    },
    valueContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonWrapper: {
      flexDirection: 'row',
      marginBottom: 15,
      gap: 5,
      justifyContent: 'center',
      height: 50,
    },
    vaultButton: {
      paddingHorizontal: 33,
      flex: 1,
      borderRadius: theme.roundness,
      justifyContent: 'center',
    },
    accButton: {
      paddingHorizontal: 20,
      flex: 1,
      borderRadius: theme.roundness,
      justifyContent: 'center',
    },

    popUpMain: {
      flex: 1,
      height: 550,
      paddingHorizontal: 30,
    },
    PopUpWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      marginTop: 16,
    },
    popUpDivider: {
      marginTop: 15,
    },
  });

export default TamaracS;
