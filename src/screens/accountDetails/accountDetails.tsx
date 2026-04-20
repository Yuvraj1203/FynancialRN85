import {
  CustomButton,
  CustomFlatList,
  CustomText,
  Shadow,
  Skeleton,
  SkeletonList,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  CustomSegmentedButton,
  CustomTextInput,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { SegmentedButtonItem } from '@/components/molecules/customSegmentedButton/customSegmentedButton';
import {
  InputReturnKeyType,
  InputVariants,
} from '@/components/molecules/customTextInput/formTextInput';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ActionSheetModel,
  GetAccountHoldingsItemType,
  GetAccountHoldingsModel,
  GetAccountsItemType,
  GetAccountTransactionsItemsType,
  GetAccountTransactionsModel,
  GetTimePeriodsModel,
} from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppRoute } from '@/utils/navigationUtils';
import {
  handleKeyboardDismiss,
  showSnackbar,
  useDebouncedSearch,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

export type AccountDetailsProps = {
  accountInfo: GetAccountsItemType;
  vendorCode: string;
};

enum HoldingStatus {
  All = '',
  Active = 'active',
  Inactive = 'inactive',
}

enum TransactionStatusEnum {
  ThisMonth = 'This Month',
  LastMonth = 'Last Month',
  LastThreeMonths = 'Last Three Months',
  LastSixMonths = 'Last Six Months',
}

type callGetAccountHoldingsApiType = {
  searchStr?: string;
  status?: HoldingStatus;
  skipCount?: number;
  appendData?: boolean;
};
type callGetAccountTransactionsApiType = {
  searchStr?: string;
  skipCount?: number;
  month?: number;
  year?: number;
  appendData?: boolean;
  timePeriod?: number | string; // add this
};

type AccountsDetailsType = {
  accountInception: string;
  holdingsData: HoldingsDataType[];
};

type HoldingsDataType = {
  name: string;
  fullName: string;
  currentInvested: string;
  totalShares: string;
};

const AccountDetails = () => {
  /** Added by @Yuvraj 19-03-2025 -> get params from parent screen (FYN-5821) */
  const route = useAppRoute('AccountDetails').params;

  /** Added by @Yuvraj 19-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5821) */
  const theme = useTheme();

  /** Added by @Yuvraj 19-03-2025 -> access StylesSheet with theme implemented (FYN-5821) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 19-03-2025 -> translations for labels (FYN-5821) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 19-03-2025 -> Retrieve user details from store (FYN-5821)*/
  const userDetails = userStore(state => state.userDetails);

  /**  Added by @Yuvraj 19-03-2025 -> for both available transaction and holdings (FYN-5821)*/
  const areBothAvailable =
    userDetails?.accountsPermission?.canAccessAccountHoldings &&
    userDetails?.accountsPermission?.canAccessAccountTransactions;

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [loading, setLoading] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [refreshLoading, setRefreshLoading] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [selectedTab, setSelectedTab] = useState<SegmentedButtonItem>();

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [showHoldings, setShowHoldings] = useState(true);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [holdingsDataLoading, setHoldingsDataLoading] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [hasMoreHoldingData, setHasMoreHoldingData] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [accountHoldingsTotal, setAccountHoldingsTotal] = useState(0);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [accountsHoldingsData, setAccountsHoldingsData] = useState<
    GetAccountHoldingsItemType[]
  >([]);

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  /** Added by @Yuvraj 06-02-2026 -> all, active, inactive (FYN-12345) */
  const [holdingFilter, setHoldingFilter] = useState<HoldingStatus>(
    HoldingStatus.All,
  );
  /** Added by @Yuvraj 06-02-2026 -> transaction filter enum (FYN-12345) */
  const [transactionFilter, setTransactionFilter] =
    useState<GetTimePeriodsModel>();

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [transactionsDataLoading, setTransactionsDataLoading] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [hasMoreTransactionsData, setHasMoreTransactionsData] = useState(false);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [transactionsTotal, setTransactionsTotal] = useState(0);

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const [transactionsData, setTransactionsData] = useState<
    GetAccountTransactionsItemsType[]
  >([]);

  //loader for search bar
  const [searchLoading, setSearchLoading] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> text of search text input state (FYN-5908) */
  const [search, setSearch] = useState<string>('');

  const debouncedSearch = useDebouncedSearch(search, 200);

  const inputRef = useRef<TextInput>(null); // Ref to control blur

  const [timePeriods, setTimePeriods] = useState<GetTimePeriodsModel[]>([]);

  /** Added by @Yuvraj 05-08-2025 -> dismiss keyboard on blur */
  handleKeyboardDismiss(inputRef);

  /** Added by @Yuvraj 06-02-2026 -> calling api' when no segement button (FYN-12345) */
  useEffect(() => {
    getTimePeriodsApi.mutate({});
    if (!areBothAvailable) {
      if (userDetails?.accountsPermission?.canAccessAccountHoldings) {
        setShowHoldings(true);
        callGetAccountHoldingsApi({});
      } else {
        setShowHoldings(false);
        callGetAccountTransactionsApi({});
      }
    }
  }, []);

  /** Added by @Yuvraj 29-03-2025 -> rapidly search handling of contact (FYN-5908) */
  useEffect(() => {
    if (debouncedSearch !== undefined && debouncedSearch.length > 0) {
      setSearchLoading(true);
      showHoldings
        ? callGetAccountHoldingsApi({
            searchStr: debouncedSearch.trim().toLowerCase(),
          })
        : callGetAccountTransactionsApi({
            searchStr: debouncedSearch.trim().toLowerCase(),
          });
    }
  }, [debouncedSearch]);

  const handleSearch = (query: string) => {
    setSearch(query);
    if (query.length === 0) {
      setSearchLoading(true);
      showHoldings
        ? callGetAccountHoldingsApi({})
        : callGetAccountTransactionsApi({});
    }
  };

  /** Added by @Yuvraj 06-02-2026 -> selected tab toggle  (FYN-12345) */
  const handleSelectedSegmentedButton = (value: SegmentedButtonItem) => {
    setSelectedTab(value);
    if (value.value == 'Holdings') {
      setShowHoldings(true);
      callGetAccountHoldingsApi({});
    } else {
      setShowHoldings(false);
      callGetAccountTransactionsApi({});
    }
    setSearch('');
  };

  /** Added by @Yuvraj 06-02-2026 -> option for filter in holdinbgs data  (FYN-12345) */
  const handleOptions = () => {
    const menuOptions: ActionSheetModel[] = [];
    if (showHoldings) {
      menuOptions.push({
        title: showHoldings ? t('All') : TransactionStatusEnum.ThisMonth,
        onPress: () => {
          if (holdingFilter !== HoldingStatus.All) {
            setHoldingFilter(HoldingStatus.All);
            callGetAccountHoldingsApi({
              status: HoldingStatus.All,
              searchStr: search,
            });
          }
        },
        titleColor: theme.colors.primary,
      });

      menuOptions.push({
        title: showHoldings ? t('Active') : TransactionStatusEnum.LastMonth,
        onPress: () => {
          if (holdingFilter !== HoldingStatus.Active) {
            setHoldingFilter(HoldingStatus.Active);
            callGetAccountHoldingsApi({
              status: HoldingStatus.Active,
              searchStr: search,
            });
          }
        },
        titleColor: theme.colors.primary,
      });

      menuOptions.push({
        title: showHoldings
          ? t('Inactive')
          : TransactionStatusEnum.LastThreeMonths,
        onPress: () => {
          if (holdingFilter !== HoldingStatus.Inactive) {
            setHoldingFilter(HoldingStatus.Inactive);
            callGetAccountHoldingsApi({
              status: HoldingStatus.Inactive,
              searchStr: search,
            });
          }
        },
        titleColor: theme.colors.primary,
      });
    } else {
      timePeriods.forEach(item => {
        menuOptions.push({
          title: item.displayName,
          onPress: () => {
            setTransactionFilter(item);
            callGetAccountTransactionsApi({
              searchStr: search,
              timePeriod: item.value,
            });
          },
          titleColor: theme.colors.primary,
        });
      });
    }

    return menuOptions;
  };

  /** Added by @Yuvraj 06-02-2026 -> load more holding accounts  (FYN-12345) */
  const loadMoreFeed = () => {
    if (showHoldings && hasMoreHoldingData && !holdingsDataLoading) {
      callGetAccountHoldingsApi({
        skipCount: accountsHoldingsData?.length,
        ...(debouncedSearch
          ? { searchStr: debouncedSearch.trim().toLowerCase() }
          : {}),
        ...(holdingFilter.length > 0 ? { status: holdingFilter } : {}),
        appendData: true,
      });
    }
    if (!showHoldings && hasMoreTransactionsData && !transactionsDataLoading) {
      callGetAccountTransactionsApi({
        skipCount: transactionsData?.length,
        ...(debouncedSearch
          ? { searchStr: debouncedSearch.trim().toLowerCase() }
          : {}),
        ...(holdingFilter.length > 0 ? { status: holdingFilter } : {}),
        appendData: true,
      });
    }
  };

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const callGetAccountHoldingsApi = ({
    searchStr,
    status,
    skipCount,
    appendData = false,
  }: callGetAccountHoldingsApiType) => {
    GetAccountHoldingsApi.mutate({
      data: {
        UserId: userDetails?.userID,
        AccountKey: route?.accountInfo.account_key,
        VendorCode: route?.vendorCode,
        ...(searchStr ? { Search: searchStr } : {}),
        ...(status ? { Status: status } : { Status: holdingFilter }),
        ...(skipCount ? { SkipCount: skipCount } : {}),
      },
      appendData: appendData,
    });
  };

  /** Added by @Yuvraj 06-02-2026 ->  (FYN-12345) */
  const callGetAccountTransactionsApi = ({
    searchStr,
    skipCount,
    month,
    year,
    appendData = false,
    timePeriod,
  }: callGetAccountTransactionsApiType) => {
    GetAccountTransactionsApi.mutate({
      data: {
        UserId: userDetails?.userID,
        AccountKey: route?.accountInfo.account_key,
        VendorCode: route?.vendorCode,
        ...(searchStr ? { Search: searchStr } : {}),
        ...(skipCount ? { SkipCount: skipCount } : {}),
        Month: month ? month : {},
        Year: year ? year : {},
        TimePeriod: timePeriod ?? transactionFilter?.value, // ✅ uses fresh value if provided
        // new Date().getFullYear()
      },
      appendData: appendData,
    });
  };

  const getTimePeriodsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTimePeriodsModel[]>({
        endpoint: ApiConstants.GetTimePeriods,
        method: HttpMethodApi.Get,
        data: sendData.data,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success && data.result) {
        const timePeriod = data.result;
        setTimePeriods(timePeriod);
        Log('test--->' + JSON.stringify(timePeriod.at(0)));
        setTransactionFilter(timePeriod.at(0));
      } else {
        setTimePeriods([]);
        setTransactionFilter(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
      setTimePeriods([]);
      setTransactionFilter(undefined);
    },
  });

  /** Added by @Yuvraj 06-02-2026 -> api for holdings  (FYN-12345) */
  const GetAccountHoldingsApi = useMutation({
    mutationFn: (sendData: {
      data: Record<string, any>;
      appendData?: boolean;
    }) => {
      return makeRequest<GetAccountHoldingsModel>({
        endpoint: ApiConstants.GetAccountHoldings,
        method: HttpMethodApi.Get,
        data: sendData.data,
      }); // API Call
    },
    onMutate(variables) {
      if (!variables.appendData) {
        setLoading(true);
      }
      setHoldingsDataLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (!variables.appendData) {
        setLoading(false);
      }
      setHoldingsDataLoading(false);
      setSearchLoading(false);
      setRefreshLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success && data.result) {
        let updatedData;
        //for setting holdings data
        if (variables.appendData) {
          updatedData = [...accountsHoldingsData, ...data.result?.items];
          setAccountsHoldingsData(updatedData);
        } else {
          updatedData = data.result?.items;
          setAccountHoldingsTotal(data.result?.totalCount);
          setAccountsHoldingsData(updatedData);
        }

        if (data.result.totalCount > updatedData?.length) {
          setHasMoreHoldingData(true);
        } else {
          setHasMoreHoldingData(false);
        }
      } else {
        setAccountHoldingsTotal(0);
        setAccountsHoldingsData([]);
        setHasMoreHoldingData(false);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
      setAccountHoldingsTotal(0);
      setAccountsHoldingsData([]);
      setHasMoreHoldingData(false);
    },
  });

  /** Added by @Yuvraj 06-02-2026 -> api for Transaction  (FYN-12345) */
  const GetAccountTransactionsApi = useMutation({
    mutationFn: (sendData: {
      data: Record<string, any>;
      appendData?: boolean;
    }) => {
      return makeRequest<GetAccountTransactionsModel>({
        endpoint: ApiConstants.GetAccountTransactions,
        method: HttpMethodApi.Get,
        data: sendData.data,
      }); // API Call
    },
    onMutate(variables) {
      if (!variables.appendData) {
        setLoading(true);
      }
      setTransactionsDataLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (!variables.appendData) {
        setLoading(false);
      }
      setTransactionsDataLoading(false);
      setSearchLoading(false);
      setRefreshLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success && data.result) {
        let updatedData;
        //for setting transaction data
        if (variables.appendData) {
          updatedData = [...transactionsData, ...data.result?.items];
          setTransactionsData(updatedData);
        } else {
          updatedData = data.result?.items;
          setTransactionsTotal(data.result?.totalCount);
          setTransactionsData(updatedData);
        }

        //setting has more data
        if (data.result.totalCount > updatedData?.length) {
          setHasMoreTransactionsData(true);
        } else {
          setHasMoreTransactionsData(false);
        }
      } else {
        setTransactionsTotal(0);
        setTransactionsData([]);
        setHasMoreTransactionsData(false);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
      setTransactionsTotal(0);
      setTransactionsData([]);
      setHasMoreTransactionsData(false);
    },
  });

  const renderAccountInfo = (accountInfo: GetAccountsItemType) => {
    if (!accountInfo) {
      return (
        <Skeleton>
          <View style={styles.accountCardSkeleton}>
            <View style={styles.textSkeleton}></View>
            <View style={styles.captionTextSkeleton}></View>
            <View style={styles.titleTextSkeleton}></View>
            <View style={styles.captionTextSkeleton}></View>
          </View>
        </Skeleton>
      );
    }

    return (
      <Shadow style={styles.accountCard}>
        <CustomText
          color={theme.colors.onPrimary}
          variant={TextVariants.bodyLarge}
        >
          {accountInfo.account_name}
        </CustomText>

        <CustomText
          variant={TextVariants.labelSmall}
          color={theme.colors.onPrimary}
          style={{ marginTop: 3 }}
        >{`${t('AccountEndingWith')} ${
          accountInfo.account_number
        }`}</CustomText>

        <CustomText
          variant={TextVariants.headlineMedium}
          color={theme.colors.onPrimary}
          style={{ marginTop: 15 }}
        >
          {accountInfo.balance}
        </CustomText>
        <CustomText
          variant={TextVariants.labelSmall}
          color={theme.colors.onPrimary}
        >
          {t('CurrentBalance')}
        </CustomText>
      </Shadow>
    );
  };

  const renderHoldings = (
    item: GetAccountHoldingsItemType | GetAccountTransactionsItemsType,
    index: number,
  ) => {
    const isHoldingType = 'current_unit_price' in item;

    return (
      <View style={styles.holdingView}>
        <View style={[styles.main, styles.holdingSection]}>
          <CustomText
            variant={TextVariants.bodyLarge}
            ellipsis={TextEllipsis.tail}
          >
            {item.ticker}
          </CustomText>
          <CustomText
            variant={TextVariants.bodySmall}
            color={theme.colors.outline}
            ellipsis={TextEllipsis.tail}
            maxLines={1}
          >
            {item.security_name}
          </CustomText>
        </View>

        <View style={styles.holdingSectionShares}>
          <CustomText
            variant={TextVariants.bodyLarge}
            ellipsis={TextEllipsis.tail}
          >
            {isHoldingType ? item.market_value : item.amount}
          </CustomText>
          <CustomText
            variant={TextVariants.bodySmall}
            color={theme.colors.outline}
            maxLines={1}
          >
            {`${item.quantity} ${t('Shares')}`}
          </CustomText>
        </View>
      </View>
    );
  };

  const renderListHeader = (title: string, positions: number) => {
    return (
      <View style={styles.holdingView}>
        <CustomText
          variant={TextVariants.bodyLarge}
          ellipsis={TextEllipsis.tail}
        >
          {title}
        </CustomText>
        <CustomText
          variant={TextVariants.bodySmall}
          color={theme.colors.outline}
          maxLines={1}
        >
          {`${positions} ${t('Positions')}`}
        </CustomText>
      </View>
    );
  };

  const renderFlatlistSkeleton = () => {
    return (
      <SkeletonList
        count={4}
        children={
          <View style={styles.holdingViewSkeleton}>
            <View style={styles.holdingSectionSkeleton}>
              <View style={styles.holdingTextSkeleton}></View>
              <View style={styles.holdingSubtitleSkeleton}></View>
            </View>
            <View style={styles.holdingSubSectionSkeleton}>
              <View style={styles.textSkeleton}></View>
              <View style={styles.text2Skeleton}></View>
            </View>
          </View>
        }
      />
    );
  };

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack={true} title={t('AccountDetails')} />

        <View style={styles.container}>
          <>{renderAccountInfo(route.accountInfo)}</>

          <Shadow style={styles.inceptionStyle}>
            <CustomText
              color={theme.colors.outline}
              variant={TextVariants.labelMedium}
            >
              {t('AccountInception')}
            </CustomText>

            <CustomText variant={TextVariants.labelLarge}>
              {route.accountInfo.inception_date}
            </CustomText>
          </Shadow>

          {areBothAvailable && (
            <CustomSegmentedButton
              items={[
                {
                  label: t('Holdings'),
                  value: 'Holdings',
                },
                {
                  label: t('Transactions'),
                  value: 'Transactions',
                },
              ]}
              selected={selectedTab}
              setSelected={handleSelectedSegmentedButton}
              style={styles.segmentedButtonContainer}
            />
          )}
          <View
            style={[
              styles.searchAndFilterContainer,
              { marginTop: areBothAvailable ? 0 : 20 },
            ]}
          >
            <CustomTextInput
              ref={inputRef}
              style={styles.searchInput}
              mode={InputVariants.outlined}
              label={t('Search')}
              placeholder={t('Search')}
              showLabel={false}
              showError={false}
              text={search}
              loading={searchLoading}
              onChangeText={handleSearch}
              returnKeyType={InputReturnKeyType.search}
              onSubmitEditing={() => {
                handleSearch(search);
              }}
              prefixIcon={{
                source: Images.search,
                type: ImageType.svg,
              }}
              suffixIcon={
                search.length > 0
                  ? {
                      source: Images.closeCircle,
                      type: ImageType.svg,
                      tap() {
                        handleSearch('');
                      },
                    }
                  : undefined
              }
            />

            <CustomButton
              style={styles.holdingsFilterButton}
              onPress={() => setFiltersExpanded(true)}
            >
              {showHoldings
                ? holdingFilter == HoldingStatus.All
                  ? t('All')
                  : holdingFilter == HoldingStatus.Active
                  ? t('Active')
                  : t('Inactive')
                : transactionFilter?.displayName}
            </CustomButton>
          </View>
          {areBothAvailable &&
            (loading ? (
              <Skeleton>
                <View style={styles.inceptionTextSkeleton}></View>
              </Skeleton>
            ) : (
              <CustomText
                variant={TextVariants.bodySmall}
                color={theme.colors.outline}
                style={styles.inceptionText}
              >
                {`${
                  showHoldings ? accountHoldingsTotal : transactionsTotal
                } ${t('Positions')}`}
              </CustomText>
            ))}

          <View style={styles.holdingContainer}>
            {loading ? (
              renderFlatlistSkeleton()
            ) : showHoldings ? (
              <>
                {!areBothAvailable &&
                  renderListHeader(t('Holdings'), accountHoldingsTotal)}
                <CustomFlatList
                  data={accountsHoldingsData}
                  keyExtractor={(item, index) => item.ticker + index.toString()}
                  renderItem={({ item, index }) => renderHoldings(item, index)}
                  ListEmptyComponent={
                    loading ? (
                      renderFlatlistSkeleton()
                    ) : (
                      <EmptyView label={t('NoHoldings')} />
                    )
                  }
                  refreshing={refreshLoading}
                  onRefresh={() => {
                    setRefreshLoading(true);
                    setSearch('');
                    callGetAccountHoldingsApi({});
                  }}
                  onEndReachedThreshold={0.6}
                  onEndReached={loadMoreFeed}
                  ListFooterComponent={
                    hasMoreHoldingData && accountsHoldingsData.length > 0 ? (
                      <LoadMore />
                    ) : (
                      <></>
                    )
                  }
                />
              </>
            ) : (
              <>
                {!areBothAvailable &&
                  renderListHeader(t('Transactions'), transactionsTotal)}
                <CustomFlatList
                  data={transactionsData}
                  keyExtractor={(item, index) => item.ticker + index.toString()}
                  renderItem={({ item, index }) => renderHoldings(item, index)}
                  ListEmptyComponent={
                    loading ? (
                      renderFlatlistSkeleton()
                    ) : (
                      <EmptyView label={t('NoTransactions')} />
                    )
                  }
                  refreshing={refreshLoading}
                  onRefresh={() => {
                    setRefreshLoading(true);
                    setSearch('');
                    callGetAccountTransactionsApi({});
                  }}
                  onEndReachedThreshold={0.6}
                  onEndReached={loadMoreFeed}
                  ListFooterComponent={
                    hasMoreTransactionsData && transactionsData.length > 0 ? (
                      <LoadMore />
                    ) : (
                      <></>
                    )
                  }
                />
              </>
            )}
          </View>
        </View>
      </View>

      <CustomActionSheetPoup
        shown={filtersExpanded}
        setShown={setFiltersExpanded}
        children={handleOptions()}
        hideIcons={false}
        centered={true}
      />
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
      paddingHorizontal: 20,
    },
    accountCardSkeleton: {
      width: '100%',
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.surface,
      padding: 15,
      gap: 8,
    },
    titleTextSkeleton: {
      width: '70%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 35,
    },
    textSkeleton: {
      width: '30%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 20,
    },
    text2Skeleton: {
      width: '50%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 20,
    },
    captionTextSkeleton: {
      width: '30%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 18,
    },
    accountCard: {
      width: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      padding: 15,
    },
    inceptionStyle: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: theme.roundness,
      padding: 12,
      gap: 8,
      marginTop: 10,
    },
    segmentedButtonContainer: {
      marginTop: 25,
      marginBottom: 5,
    },
    searchAndFilterContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    searchInput: {
      flex: 1,
    },
    holdingsFilterButton: {
      minWidth: 110,
      marginTop: 5,
      height: 48,
      justifyContent: 'center',
    },
    inceptionTextSkeleton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 18,
      width: 100,
      marginTop: 10,
      alignSelf: 'flex-end',
    },
    inceptionText: {
      alignSelf: 'flex-end',
      marginTop: 10,
      borderBottomWidth: 0.5,
    },
    holdingContainer: {
      flex: 1,
      width: '100%',
      borderRadius: theme.roundness,
      padding: 0,
      marginTop: 10,
    },
    holdingView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDisabled,
      padding: 10,
    },
    holdingViewSkeleton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outline,
      padding: 10,
      marginTop: 15,
    },
    holdingSectionSkeleton: {
      gap: 10,
      width: '55%',
      paddingRight: 20,
    },
    holdingSubSectionSkeleton: {
      gap: 10,
      width: '50%',
      alignItems: 'flex-end',
      paddingRight: 20,
    },
    holdingTextSkeleton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 20,
      width: '100%',
    },
    holdingSubtitleSkeleton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      height: 20,
      width: '50%',
    },
    holdingSection: {
      gap: 10,
    },
    holdingSectionShares: {
      alignItems: 'flex-end',
      gap: 10,
    },
  });

export default AccountDetails;
