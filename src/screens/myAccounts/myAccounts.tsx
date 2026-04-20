import {
  CustomChips,
  CustomFlatList,
  CustomText,
  Shadow,
  SkeletonList,
} from '@/components/atoms';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetAccountsItemType,
  GetAccountsModel,
  GetConnectionModel,
} from '@/services/models';
import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import { formatDate, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export type MyAccountsProps = GetConnectionModel;

export type AccountsDataType = {
  accountName: string;
  accountNumber: string;
  accountBalance: string;
  lastMarketDate: string;
};

enum InceptionDateFormatEnum {
  ParseFormat = 'YYYY-MM-DDTHH:mm:ss',
  ManagedAccountFormat = 'MM/DD/YYYY',
  InceptionDateFormat = 'MMM DD, YYYY',
  AccountDetailFormat = 'MMMM DD, YYYY',
}

const MyAccounts = () => {
  /** Added by @Yuvraj 06-02-2025 -> get params from parent screen (FYN-5821) */
  const route = useAppRoute('MyAccounts').params;

  /** Added by @Yuvraj 19-03-2025 -> navigate to different screen (FYN-5821) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 19-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5821) */
  const theme = useTheme();

  /** Added by @Yuvraj 19-03-2025 -> access StylesSheet with theme implemented (FYN-5821) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 19-03-2025 -> translations for labels (FYN-5821) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 19-03-2025 -> Retrieve user details from store (FYN-5821)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Yuvraj 19-03-2025 -> all accounts data */
  const [loading, setLoading] = useState(false);

  /** Added by @Yuvraj 19-03-2025 -> all accounts data */
  const [accountsData, setAccountsData] = useState<GetAccountsModel>();

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  useEffect(() => {
    callGetAccountsApi();
  }, []);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const callGetAccountsApi = (searchStr?: string) => {
    GetAccountsApi.mutate({
      UserId: userDetails?.userID,
      VendorCode: route?.vendorCode,
      ...(searchStr ? { Search: searchStr } : {}),
    });
  };

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const GetAccountsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAccountsModel>({
        endpoint: ApiConstants.GetAccounts,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success && data.result) {
        const formatted = {
          totalCount: Number(data.result.totalCount),
          items: data.result?.items.map(item => ({
            ...item,
            last_updated:
              item.last_updated &&
              formatDate({
                date: item.last_updated,
                parseFormat: InceptionDateFormatEnum.ParseFormat,
                returnFormat: InceptionDateFormatEnum.ManagedAccountFormat,
              }),
          })) as GetAccountsItemType[],
        };
        setAccountsData(formatted);
      } else {
        setAccountsData(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
      setAccountsData(undefined);
    },
  });

  const renderAccountsList = (item: GetAccountsItemType, index: number) => {
    return (
      <Shadow
        onPress={() => {
          if (
            userDetails?.accountsPermission?.canAccessAccountHoldings ||
            userDetails?.accountsPermission?.canAccessAccountTransactions
          ) {
            const formatted = {
              ...item,
              inception_date: formatDate({
                date: item.inception_date,
                parseFormat: InceptionDateFormatEnum.InceptionDateFormat,
                returnFormat: InceptionDateFormatEnum.AccountDetailFormat,
              }),
            };
            navigation.navigate('AccountDetails', {
              accountInfo: formatted,
              vendorCode: route?.vendorCode,
            });
          }
        }}
        style={styles.accountCard}
        tapStyle={styles.tapStyle}
      >
        <View style={styles.accountInfoSection}>
          <View style={styles.accountCardHeader}>
            <CustomText
              maxLines={2}
              ellipsis={TextEllipsis.tail}
              variant={TextVariants.labelLarge}
            >
              {`${item.account_name} (${item.type}) ${item.account_number}`}
            </CustomText>
          </View>
          <CustomText
            variant={TextVariants.headlineMedium}
            color={theme.colors.primary}
          >
            {item.balance}
          </CustomText>
          <CustomText
            variant={TextVariants.labelSmall}
            color={theme.colors.outline}
          >{`${t('AsOf')} ${item.last_updated}`}</CustomText>
        </View>
      </Shadow>
    );
  };

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack={true} title={t('MyAccounts')} />

        <View style={styles.totalAccountsChip}>
          <CustomText>{t('ManagedAccounts')}</CustomText>
          <CustomChips
            chipLabel={`${accountsData?.totalCount} ${t('Accounts')}`}
            closeButton={false}
            style={styles.chipStyle}
            labelColor={theme.colors.outline}
            loading={loading}
          />
        </View>

        <View style={styles.container}>
          {loading ? (
            <SkeletonList
              count={4}
              style={styles.flatlistContainer}
              children={
                <View style={styles.accountCard}>
                  <View style={styles.nameSkeletonContainer}>
                    <View style={styles.descriptionSkeleton}></View>
                    <View style={styles.descriptionSkeletonShort}></View>
                    <View style={styles.nameSkel}></View>
                    <View style={styles.descriptionSkeleton}></View>
                  </View>
                </View>
              }
            />
          ) : accountsData?.items ? (
            <CustomFlatList
              data={accountsData?.items}
              keyExtractor={item => item.account_key.toString()}
              contentContainerStyle={styles.flatlistContainer}
              renderItem={({ item, index }) => renderAccountsList(item, index)}
              ListEmptyComponent={<EmptyView label={t('NoAccounts')} />}
              refreshing={loading}
              onRefresh={() => callGetAccountsApi()}
            />
          ) : (
            <EmptyView label={t('NoAccounts')} />
          )}
        </View>
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingVertical: 10,
    },
    totalAccountsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
    },
    chipStyle: {
      borderWidth: 0,
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '75%',
      height: 30,
    },
    nameSkeletonContainer: {
      flex: 1,
      gap: 10,
    },
    hamburgerSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 5,
      height: 20,
      marginRight: 10,
      marginTop: 5,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '35%',
      height: 10,
    },
    descriptionSkeletonShort: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '25%',
      height: 10,
    },
    flatlistContainer: {
      marginBottom: 10,
      paddingHorizontal: 15,
    },
    accountCard: {
      width: '100%',
      flexDirection: 'row',
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 15,
      marginBottom: 20,
    },
    tapStyle: {
      paddingHorizontal: 5,
    },
    accountInfoSection: {
      flex: 1,
      gap: 5,
    },
    accountCardHeader: {
      gap: 6,
    },
  });

export default MyAccounts;
