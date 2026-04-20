import {
  CustomFlatList,
  CustomText,
  Shadow,
  SkeletonList,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ReferralDetailItemNew,
  ReferralDetailModelNew,
} from '@/services/models/getAllUserReferralsModel/getAllUserReferralsModel';
import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { formatDateUtcReturnLocalTime, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

function MyReferrals() {
  /**  Added by @Ajay 13-2-24 ---> Access theme provider  */
  const theme = useTheme();

  /**  Added by @Ajay 13-2-24 ---> Stylesheet with theme implementation  */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 13-2-24 ---> Translations for multi-language support  */
  const { t } = useTranslation();

  /**  Added by @Ajay 13-2-24 ---> State for loading indicator (#4274)  */
  const [loading, setLoading] = useState(false);

  /** State to store referred friends list */
  const [refferedFriendsList, setRefferedFriendsList] = useState<
    ReferralDetailItemNew[]
  >([]);

  const userDetails = userStore(state => state.userDetails);

  /**  Added by @Ajay 13-2-24 ---> Fetch referral info on component mount  */
  useEffect(() => {
    if (userDetails) {
      getreferralinfo.mutate({});
    }
  }, []);

  /** Added by @Tarun 24-03-2025 -> Render referral item using flash list (FYN-5971) */
  const renderReferralItem = (item: ReferralDetailItemNew) => {
    return (
      <Shadow style={styles.cardContent}>
        <View style={styles.cardData}>
          <CustomText
            variant={TextVariants.labelLarge}
            color={theme.colors.primary}
          >
            {item?.referredTo}
          </CustomText>

          <CustomText
            variant={TextVariants.labelMedium}
            color={theme.colors.labelLight}
          >
            {item.referredDateUTC}
          </CustomText>
        </View>
        <CustomText variant={TextVariants.labelLarge} style={styles.email}>
          {item.emailReferredTo}
        </CustomText>
      </Shadow>
    );
  };

  /**  Added by @Ajay 13-2-24 ---> Fetch referral information using API (#4274)  */
  const getreferralinfo = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<ReferralDetailModelNew>({
        endpoint: ApiConstants.GetAllUserReferrals,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(
        true,
      ); /** Show loading indicator while fetching data (#4274) */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete (#4274) */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result?.items) {
        setRefferedFriendsList(
          data.result.items.map(element => ({
            ...element,
            referredDateUTC: element.referredDateUTC
              ? formatDateUtcReturnLocalTime({
                  date: element?.referredDateUTC,
                  parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                  returnFormat: 'MMM DD, YYYY hh:mm A',
                })
              : '',
          })),
        );
      } else {
        setRefferedFriendsList([]);
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
      setRefferedFriendsList([]);
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={t('MyReferrals')} />

        {loading ? (
          <SkeletonList
            count={8}
            children={
              <View style={styles.skeletonMain}>
                <View style={styles.cardData}>
                  <View style={styles.nameSkel}></View>
                  <View style={styles.dateSkel}></View>
                </View>
                <View style={styles.emailSkel}></View>
              </View>
            }
          />
        ) : (
          <CustomFlatList
            data={refferedFriendsList}
            keyExtractor={(item, index) =>
              item?.phoneNo?.toString() ?? `referral_${index}`
            }
            contentContainerStyle={
              refferedFriendsList.length == 0 && styles.flatListContent
            }
            refreshing={loading}
            onRefresh={() => {
              getreferralinfo.mutate({});
            }}
            ListFooterComponent={<View style={styles.listContainer} />}
            ListEmptyComponent={<EmptyView label={t('NoReferralsFound')} />}
            renderItem={({ item }) => renderReferralItem(item)}
          />
        )}
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    flatListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    listContainer: {
      height: 20,
      marginBottom: 50,
    },
    cardContent: { marginHorizontal: 16, marginTop: 10 },
    cardData: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    email: {
      marginVertical: 2,
    },
    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 120,
      height: 20,
    },
    dateSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 100,
      height: 20,
    },
    emailSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 150,
      height: 20,
      marginTop: 10,
    },
  });

export default MyReferrals;
