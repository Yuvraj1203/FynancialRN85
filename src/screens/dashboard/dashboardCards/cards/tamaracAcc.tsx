import { CustomFlatList, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomBottomPopup, EmptyView } from '@/components/molecules';
import {
  Accountlist,
  GetCardsForUserDashboardModel,
  GetTamaracAccountsModel,
} from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetTamaracAccountsModel;
  isPrimary: boolean;
};

function TamaracAcc(props: Props) {
  /** Added by @Akshita 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Akshita 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  /** Added by @Akshita 31-01-2025 -> to control the visibility of bottom pop up (FYN-4299) */
  const [showBottomPopUp, setShowBottomPopUp] = useState(false);

  /** Added by @Akshita 31-01-2025 -> state to store the list of accounts (FYN-4299) */
  const [accountList, setAccountList] = useState<Accountlist[]>(
    props?.data?.accountlist || [],
  );

  /** Added by @Akshita 31-01-2025 -> max Account count to display on the card (FYN-4299) */
  const visibleAccounts = accountList.slice(0, 5);
  const remainingCount = accountList.length - 5;

  const maxFontSize = 1.3;

  /** Added by @Akshita 31-01-2025 -> text color on the basis of the primary flag (FYN-4299) */
  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const renderAccounts = (item: Accountlist) => {
    return (
      <View style={!showBottomPopUp ? styles.wrapper : styles.PopUpWrapper}>
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
    <View style={styles.tamaracaccLay}>
      <CustomText
        maxFontSizeMultiplier={maxFontSize}
        color={textColor}
        variant={TextVariants.bodyLarge}
      >
        {props.cardData.title}
      </CustomText>
      {props.data.status == 1 && (
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={textColor}
          variant={TextVariants.labelLarge}
          style={styles.headerSubTitle}
        >
          {`(${t('AsOfPreviousMarketClose')})`}
        </CustomText>
      )}

      {!props.data.message && props.data.status == 1 ? (
        <View style={styles.flatListLay}>
          {accountList && accountList?.length > 0 && (
            <CustomFlatList
              data={visibleAccounts}
              keyExtractor={item => `${item.accountName!} ${item.value}`}
              ListEmptyComponent={
                <EmptyView imageType={ImageType.png} label={''} />
              }
              ListFooterComponent={
                <View>
                  {remainingCount > 0 && (
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      style={styles.seeMore}
                      color={textColor}
                    >
                      {`+${remainingCount} ${t('More')}`}
                    </CustomText>
                  )}

                  <View style={styles.wrapper}>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      variant={TextVariants.bodyLarge}
                      color={textColor}
                    >
                      {t('TotalValue')}
                    </CustomText>
                    <View>
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        variant={TextVariants.bodyLarge}
                        color={textColor}
                      >
                        {props.data.totalvalue}
                      </CustomText>
                      {accountList.length > 5 && (
                        <Tap
                          style={styles.viewAllTap}
                          onPress={() => {
                            setShowBottomPopUp(true);
                          }}
                        >
                          <View style={styles.viewAllText}>
                            <CustomText
                              maxFontSizeMultiplier={maxFontSize}
                              color={textColor}
                            >
                              {t('ViewAll')}
                            </CustomText>
                            <Divider style={styles.divider} />
                          </View>
                        </Tap>
                      )}
                    </View>
                  </View>
                </View>
              }
              ListHeaderComponent={() => (
                <View style={styles.wrapper}>
                  <CustomText
                    maxFontSizeMultiplier={maxFontSize}
                    variant={TextVariants.bodyLarge}
                    color={textColor}
                    ellipsis={TextEllipsis.tail}
                    maxLines={1}
                  >
                    {t('AccountName')}
                  </CustomText>
                  <CustomText
                    maxFontSizeMultiplier={maxFontSize}
                    variant={TextVariants.bodyLarge}
                    color={textColor}
                  >
                    {t('Value')}
                  </CustomText>
                </View>
              )}
              getItemType={item => {
                return typeof item === 'string' ? 'header' : 'accounts';
              }}
              renderItem={({ item }) => renderAccounts(item)}
            />
          )}
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
        title={
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            variant={TextVariants.titleLarge}
            style={{ width: '80%' }}
          >
            {props.cardData.title}
          </CustomText>
        }
      >
        <View>
          {accountList.length > 0 && (
            <View style={styles.popUpMain}>
              <CustomFlatList
                data={accountList}
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
                        {props.data.totalvalue}
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
    tamaracaccLay: {
      flex: 1,
      padding: 20,
    },
    flatListLay: {
      flex: 1,

      paddingTop: 20,
    },
    wrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      marginTop: 2,
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
    viewAllText: {
      alignItems: 'flex-end',
    },
    viewAllTap: {
      padding: 0,
    },
    popUpMain: {
      flex: 1,
      height: 550,
      paddingHorizontal: 30,
    },
    headerSubTitle: {
      marginTop: 5,
    },
    seeMore: {
      textAlign: 'center',
      marginVertical: 5,
    },
    divider: {
      width: 54,
      height: 1,
    },
  });

export default TamaracAcc;
