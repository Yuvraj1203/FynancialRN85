import { CustomButton, CustomImage, CustomText } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { VaultScreenParent } from '@/screens/vault/vault';
import {
  GetCardsForUserDashboardModel,
  GetClientTotalNetworthModel,
} from '@/services/models';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { isEmpty } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

const isBarry = TenantInfo.AppName == 'barryinvestment';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetClientTotalNetworthModel;
  isPrimary: boolean;
};

function EMTotalNetWorthCard(props: Props) {
  const navigation = useAppNavigation();

  /** Added by @Akshita 11-04-25 -> to access app theme(colors, roundness, fonts, etc) (FYN-4319) */
  const theme = useTheme();

  /** Added by @Akshita 11-04-25 -> access StylesSheet with theme implemented (FYN-4319) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 11-04-25 -> translations for labels (FYN-4319) */
  const { t } = useTranslation();

  const fillColor =
    props.isPrimary || isBarry ? theme.colors.surface : theme.colors.primary;

  const textColor =
    props.isPrimary || isBarry
      ? theme.colors.surface
      : theme.colors.onSurfaceVariant;

  const btnTextColor =
    props.isPrimary || isBarry
      ? theme.colors.onSurfaceVariant
      : theme.colors.surface;

  /** Added by @Akshita 11-04-25 -> handle arrow directions for this month and this year values (FYN-4319) */
  const getArrowDirection = (value?: string): 'up' | 'down' | null => {
    if (!value) return null;

    if (
      (value.includes('(') || value.includes('-')) &&
      value != 'Not available'
    ) {
      return 'down';
    } else if (
      !value.includes('(') &&
      !value.includes('-') &&
      value != 'Not available'
    ) {
      return 'up';
    }
    return null;
  };
  const maxFontSize = 1.3;

  const arrowDirectionForMonth = getArrowDirection(props.data?.thisMonth);

  const arrowDirectionForYear = getArrowDirection(props.data?.thisYear);

  return (
    <View style={styles.cardMain}>
      {isBarry && (
        <CustomImage style={styles.img} source={Images.barryEmoney} />
      )}
      <View style={styles.eMTotalNetWorthLay}>
        <View style={styles.titleLay}>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={textColor}
            variant={TextVariants.bodyLarge}
          >
            {props.cardData.title}
          </CustomText>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={textColor}
            variant={TextVariants.displayMedium}
          >
            {props.data.netWorth}
          </CustomText>
        </View>
        <View style={styles.cardMain}>
          {props.data.showMonthYear && props.data.status == 1 ? (
            <View style={styles.statsContainer}>
              {!isEmpty(props.data?.thisMonth) &&
                props.data.thisMonth != 'Not available' && (
                  <View>
                    <View style={styles.statItem}>
                      <CustomImage
                        source={Images.triangle}
                        color={theme.colors.surface}
                        type={ImageType.svg}
                        style={
                          arrowDirectionForMonth == 'down'
                            ? styles.downArrowIcon
                            : styles.upArrowIcon
                        }
                        fillColor={fillColor}
                      />
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        color={textColor}
                        variant={TextVariants.bodyLarge}
                      >
                        {props.data?.thisMonth?.replace(/[^0-9.,$]/g, '')}
                      </CustomText>
                    </View>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.bodySmall}
                      style={styles.monthYearText}
                    >
                      {t('ThisMonth')}
                    </CustomText>
                  </View>
                )}

              {!isEmpty(props.data?.thisYear) &&
                props.data.thisYear != 'Not available' && (
                  <View>
                    <View style={styles.statItem}>
                      <CustomImage
                        source={Images.triangle}
                        color={theme.colors.surface}
                        type={ImageType.svg}
                        style={
                          arrowDirectionForYear == 'down'
                            ? styles.downArrowIcon
                            : styles.upArrowIcon
                        }
                        fillColor={fillColor}
                      />
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        color={textColor}
                        variant={TextVariants.bodyLarge}
                      >
                        {props.data?.thisYear?.replace(/[^0-9.,$]/g, '')}
                      </CustomText>
                    </View>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.bodySmall}
                      style={styles.monthYearText}
                    >
                      {t('ThisYear')}
                    </CustomText>
                  </View>
                )}
            </View>
          ) : (
            props.data?.message &&
            props.data.status == 0 && <ErrorCard msg={props.data.message} />
          )}
        </View>
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
              }}
            >
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                color={btnTextColor}
              >{`${t('GoToEMoneyVault')} ${'>'}`}</CustomText>
            </CustomButton>
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: {
      flex: 1,
    },
    img: {
      height: '100%',
      width: '100%',
      borderRadius: theme.roundness,
    },
    eMTotalNetWorthLay: {
      height: '100%',
      width: '100%',
      padding: 20,
      borderRadius: theme.roundness,
      position: 'absolute',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 0,
    },
    statsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 20,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
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
      marginBottom: 22,
    },

    downArrowIcon: {
      height: 13,
      width: 13,
    },
    upArrowIcon: {
      height: 13,
      width: 13,
      transform: [{ rotate: '180deg' }],
    },
    monthYearText: {
      alignSelf: 'flex-end',
    },
    titleLay: {
      paddingRight: 50,
    },
  });

export default EMTotalNetWorthCard;
