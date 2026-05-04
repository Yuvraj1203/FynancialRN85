import { storage } from '@/App';
import { Shadow, Skeleton } from '@/components/atoms';
import { CustomCarousel } from '@/components/molecules';
import { CarouselMode } from '@/components/molecules/customCarousel/customCarousel';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { sessionService } from '@/components/template/biometricPopup/sessionService';
import { showTemplatePopup } from '@/components/template/templatePopup/templatePopup';
import { showLogoutPopup } from '@/navigators/appDrawer';
import { ContactVaultParentScreenType } from '@/screens/contactVault/contactVault';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetAddeparModel,
  GetAssetAllocationModel,
  GetBDAssetAllocationModel,
  GetCardsForUserDashboardModel,
  GetClientBasicNetworthModel,
  GetClientBlackDiamondModel,
  GetClientGoalsModel,
  GetClientNitrogenModel,
  GetClientTamaracModel,
  GetClientTotalNetworthModel,
  GetOrionAumModel,
  GetPerformanceSummaryDataModel,
  GetPerformanceTwrModel,
  GetTamaracAccountsModel,
} from '@/services/models';
import {
  biometricStore,
  dashboardCardsStore,
  templateStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  checkIntervalTime,
  formatDate,
  openAppSettings,
  parseDate,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import AddeparAUMV2 from './cards/addeparAUMV2';
import AddeparAssetAllocationV2 from './cards/addeparAssetAllocationV2';
import AddeparRORV2 from './cards/addeparRORV2';
import BlackDiamond from './cards/blackDiamond';
import BlackDiamondAsset from './cards/blackDiamondAsset';
import CustomDashboardCard from './cards/customDashboardCard';
import EMBasicNetWorthCard from './cards/eMBasicNetWorthCard';
import EMGoal from './cards/eMGoal';
import EMTotalNetWorthCard from './cards/eMTotalNetWorthCard';
import Nitrogen from './cards/nitrogen';
import OrionAsset from './cards/orionAsset';
import OrionAum from './cards/orionAum';
import OrionPs from './cards/orionPs';
import OrionTwr from './cards/orionTwr';
import TamaracAcc from './cards/tamaracAcc';
import TamaracS from './cards/tamaracS';

const enum DateFormats {
  parseDateFormat = 'DD-MM-YYYY hh:mm A',
}

type Props = {
  // dashboardCards: GetCardsForUserDashboardModel[];
  // style?: StyleProp<ViewStyle>;
  // cardLoading?: boolean;
  loading?: boolean;
  refreshProp?: boolean;
};

function DashboardCards(props: Props) {
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();

  const templateData = templateStore();

  const [cardLoading, setCardLoading] = useState(true); // for cards

  const biometricEnabled = biometricStore(); // biometric Store

  const dashboardCardsData = dashboardCardsStore(); // biometric Store

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const [cardsList, setCardsList] = useState<GetCardsForUserDashboardModel[]>(
    [],
  );

  const [allCardsList, setAllCardsList] = useState<
    GetCardsForUserDashboardModel[]
  >([]);

  const [getPerformanceSummaryData, setGetPerformanceSummaryData] =
    useState<GetPerformanceSummaryDataModel>();

  const [getAssetAllocation, setGetAssetAllocation] =
    useState<GetAssetAllocationModel>();

  const [getOrionAum, setGetOrionAum] = useState<GetOrionAumModel>();

  const [getPerformanceTwr, setGetPerformanceTwr] =
    useState<GetPerformanceTwrModel>();

  const [getClientTotalNetworth, setGetClientTotalNetworth] =
    useState<GetClientTotalNetworthModel>();

  const [getClientGoals, setGetClientGoals] = useState<GetClientGoalsModel>();

  const [getClientBasicNetworth, setGetClientBasicNetworth] =
    useState<GetClientBasicNetworthModel>();

  const [getClientBlackDiamond, setGetClientBlackDiamond] =
    useState<GetClientBlackDiamondModel>();

  const [getBDAssetAllocation, setGetBDAssetAllocation] =
    useState<GetBDAssetAllocationModel>();

  const [getAddeparAUMV2, setGetAddeparAUMV2] = useState<GetAddeparModel[]>([]);

  const [getAddeparRORV2, setGetAddeparRORV2] = useState<GetAddeparModel[]>([]);

  const [getAddeparAssetAllocationV2, setGetAddeparAssetAllocationV2] =
    useState<GetAddeparModel[]>([]);

  const [getclientnitrogen, setGetclientnitrogen] =
    useState<GetClientNitrogenModel>();

  const [getClientTamarac, setGetClientTamarac] =
    useState<GetClientTamaracModel>();

  const [getTamaracAccounts, setGetTamaracAccounts] =
    useState<GetTamaracAccountsModel>();

  const userDetails = userStore(state => state.userDetails);

  useEffect(() => {
    if (
      templateData.templateList &&
      templateData.templateList.length > 0 &&
      userDetails &&
      props.refreshProp
    ) {
      //for cards
      getCardsForUserDashboardApi.mutate({
        programSessionID:
          templateData.selectedTemplate?.programTypeID !== 0 ||
          templateData.selectedTemplate?.programTypeID !== undefined ||
          templateData.selectedTemplate?.programTypeID !== null
            ? templateData.selectedTemplate?.programSessionID
            : undefined,
      });
    } else {
      setCardLoading(false);
    }
  }, [templateData.selectedTemplate, props.refreshProp]);

  useEffect(() => {
    if (props.loading) {
      setCardLoading(true);
    }
  }, [props.loading]);

  useEffect(() => {
    if (userDetails && allCardsList?.length > 0) {
      const newList = allCardsList?.map(card => {
        if (card.sliderTypeCode == 'orionps') {
          if (
            dashboardCardsData.orionPs &&
            dashboardCardsData.orionPs.appDate &&
            parseDate({
              date: dashboardCardsData.orionPs.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.orionPs.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetPerformanceSummaryData(undefined);
              return { ...card, loading: true };
            } else {
              setGetPerformanceSummaryData(dashboardCardsData.orionPs);
              return { ...card };
            }
          } else {
            setGetPerformanceSummaryData(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'orasset') {
          if (
            dashboardCardsData.orionAsset &&
            dashboardCardsData.orionAsset.appDate &&
            parseDate({
              date: dashboardCardsData.orionAsset.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.orionAsset.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetAssetAllocation(undefined);
              return { ...card, loading: true };
            } else {
              setGetAssetAllocation(dashboardCardsData.orionAsset);
              return { ...card };
            }
          } else {
            setGetAssetAllocation(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'orion') {
          if (
            dashboardCardsData.orionAum &&
            dashboardCardsData.orionAum.appDate &&
            parseDate({
              date: dashboardCardsData.orionAum.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.orionAum.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetOrionAum(undefined);
              return { ...card, loading: true };
            } else {
              setGetOrionAum(dashboardCardsData.orionAum);
              return { ...card };
            }
          } else {
            setGetOrionAum(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'ortwr') {
          if (
            dashboardCardsData.orionTwr &&
            dashboardCardsData.orionTwr.appDate &&
            parseDate({
              date: dashboardCardsData.orionTwr.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.orionTwr.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetPerformanceTwr(undefined);
              return { ...card, loading: true };
            } else {
              setGetPerformanceTwr(dashboardCardsData.orionTwr);
              return { ...card };
            }
          } else {
            setGetPerformanceTwr(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'emnetworth') {
          if (
            dashboardCardsData.eMoneyTotalNetWorth &&
            dashboardCardsData.eMoneyTotalNetWorth.appDate &&
            parseDate({
              date: dashboardCardsData.eMoneyTotalNetWorth.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.eMoneyTotalNetWorth.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetClientTotalNetworth(undefined);
              return { ...card, loading: true };
            } else {
              setGetClientTotalNetworth(dashboardCardsData.eMoneyTotalNetWorth);
              return { ...card };
            }
          } else {
            setGetClientTotalNetworth(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'emgoals') {
          if (
            dashboardCardsData.eMoneyClientGoal &&
            dashboardCardsData.eMoneyClientGoal.appDate &&
            parseDate({
              date: dashboardCardsData.eMoneyClientGoal.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.eMoneyClientGoal.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetClientGoals(undefined);
              return { ...card, loading: true };
            } else {
              setGetClientGoals(dashboardCardsData.eMoneyClientGoal);
              return { ...card };
            }
          } else {
            setGetClientGoals(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'embasicnetworth') {
          if (
            dashboardCardsData.eMoneyBasicNetWorth &&
            dashboardCardsData.eMoneyBasicNetWorth.appDate &&
            parseDate({
              date: dashboardCardsData.eMoneyBasicNetWorth.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.eMoneyBasicNetWorth.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetClientBasicNetworth(undefined);
              return { ...card, loading: true };
            } else {
              setGetClientBasicNetworth(dashboardCardsData.eMoneyBasicNetWorth);
              return { ...card };
            }
          } else {
            setGetClientBasicNetworth(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'bdiamond') {
          if (
            dashboardCardsData.blackDiamond &&
            dashboardCardsData.blackDiamond.appDate &&
            parseDate({
              date: dashboardCardsData.blackDiamond.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.blackDiamond.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetClientBlackDiamond(undefined);
              return { ...card, loading: true };
            } else {
              setGetClientBlackDiamond(dashboardCardsData.blackDiamond);
              return { ...card };
            }
          } else {
            setGetClientBlackDiamond(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'bdasset') {
          if (
            dashboardCardsData.blackDiamonAssetAllocation &&
            dashboardCardsData.blackDiamonAssetAllocation.appDate &&
            parseDate({
              date: dashboardCardsData.blackDiamonAssetAllocation.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.blackDiamonAssetAllocation.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetBDAssetAllocation(undefined);
              return { ...card, loading: true };
            } else {
              setGetBDAssetAllocation(
                dashboardCardsData.blackDiamonAssetAllocation,
              );
              return { ...card };
            }
          } else {
            setGetBDAssetAllocation(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'adpaum') {
          const list = dashboardCardsData.addeparAUMV2 ?? [];
          const findItem = list.find(item => item.appId === card.appId);

          if (!findItem) {
            // Item not found → remove old + set loading
            setGetAddeparAUMV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // If found but has no appDate → treat as expired
          if (!findItem.appDate) {
            setGetAddeparAUMV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // Date exists → check expiration
          const isExpired =
            parseDate({
              date: findItem.appDate,
              parseFormat: DateFormats.parseDateFormat,
            }) &&
            checkIntervalTime(
              parseDate({
                date: findItem.appDate,
                parseFormat: DateFormats.parseDateFormat,
              })!.getTime(),
              { hr: 2 },
            );

          if (isExpired) {
            // Expired → remove + load again
            setGetAddeparAUMV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // Valid cached item → keep item but ensure unique entry
          setGetAddeparAUMV2(prev => [
            ...prev.filter(item => item.appId !== card.appId),
            findItem,
          ]);

          return { ...card };
        } else if (card.sliderTypeCode == 'adpror') {
          const list = dashboardCardsData.addeparRORV2 ?? [];
          const findItem = list.find(item => item.appId === card.appId);

          if (!findItem) {
            // Item not found → remove old + set loading
            setGetAddeparRORV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // If found but has no appDate → treat as expired
          if (!findItem.appDate) {
            setGetAddeparRORV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // Date exists → check expiration
          const isExpired =
            parseDate({
              date: findItem.appDate,
              parseFormat: DateFormats.parseDateFormat,
            }) &&
            checkIntervalTime(
              parseDate({
                date: findItem.appDate,
                parseFormat: DateFormats.parseDateFormat,
              })!.getTime(),
              { hr: 2 },
            );

          if (isExpired) {
            // Expired → remove + load again
            setGetAddeparRORV2(list.filter(item => item.appId !== card.appId));
            return { ...card, loading: true };
          }

          // Valid cached item → keep item but ensure unique entry
          setGetAddeparRORV2(prev => [
            ...prev.filter(item => item.appId !== card.appId),
            findItem,
          ]);

          return { ...card };
        } else if (card.sliderTypeCode == 'adpasset') {
          const list = dashboardCardsData.addeparAssetAllocationV2 ?? [];
          const findItem = list.find(item => item.appId === card.appId);

          if (!findItem) {
            // Item not found → remove old + set loading
            setGetAddeparAssetAllocationV2(
              list.filter(item => item.appId !== card.appId),
            );
            return { ...card, loading: true };
          }

          // If found but has no appDate → treat as expired
          if (!findItem.appDate) {
            setGetAddeparAssetAllocationV2(
              list.filter(item => item.appId !== card.appId),
            );
            return { ...card, loading: true };
          }

          // Date exists → check expiration
          const isExpired =
            parseDate({
              date: findItem.appDate,
              parseFormat: DateFormats.parseDateFormat,
            }) &&
            checkIntervalTime(
              parseDate({
                date: findItem.appDate,
                parseFormat: DateFormats.parseDateFormat,
              })!.getTime(),
              { hr: 2 },
            );

          if (isExpired) {
            // Expired → remove + load again
            setGetAddeparAssetAllocationV2(
              list.filter(item => item.appId !== card.appId),
            );
            return { ...card, loading: true };
          }

          // Valid cached item → keep item but ensure unique entry
          setGetAddeparAssetAllocationV2(prev => [
            ...prev.filter(item => item.appId !== card.appId),
            findItem,
          ]);

          return { ...card };
        } else if (card.sliderTypeCode == 'nitrogen') {
          if (
            dashboardCardsData.clientNitrogen &&
            dashboardCardsData.clientNitrogen.appDate &&
            parseDate({
              date: dashboardCardsData.clientNitrogen.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.clientNitrogen.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetclientnitrogen(undefined);
              return { ...card, loading: true };
            } else {
              setGetclientnitrogen(dashboardCardsData.clientNitrogen);
              return { ...card };
            }
          } else {
            setGetclientnitrogen(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'tamarac') {
          if (
            dashboardCardsData.clientTamarac &&
            dashboardCardsData.clientTamarac.appDate &&
            parseDate({
              date: dashboardCardsData.clientTamarac.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.clientTamarac.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetClientTamarac(undefined);
              return { ...card, loading: true };
            } else {
              setGetClientTamarac(dashboardCardsData.clientTamarac);
              return { ...card };
            }
          } else {
            setGetClientTamarac(undefined);
            return { ...card, loading: true };
          }
        } else if (card.sliderTypeCode == 'tamaracacc') {
          if (
            dashboardCardsData.tamaracAccounts &&
            dashboardCardsData.tamaracAccounts.appDate &&
            parseDate({
              date: dashboardCardsData.tamaracAccounts.appDate,
              parseFormat: DateFormats.parseDateFormat,
            })
          ) {
            if (
              checkIntervalTime(
                parseDate({
                  date: dashboardCardsData.tamaracAccounts.appDate!,
                  parseFormat: DateFormats.parseDateFormat,
                })!.getTime(),
                { hr: 2 },
              )
            ) {
              setGetTamaracAccounts(undefined);
              return { ...card, loading: true };
            } else {
              setGetTamaracAccounts(dashboardCardsData.tamaracAccounts);
              return { ...card };
            }
          } else {
            setGetTamaracAccounts(undefined);
            return { ...card, loading: true };
          }
        } else {
          return card;
        }
      });

      setCardsList(newList);

      if (newList.some(card => card.loading)) {
        fetchCardsApi(newList.filter(item => item.loading));
      }
    }
  }, [allCardsList]);

  const handleModuleClick = (item: GetCardsForUserDashboardModel) => {
    switch (item.functionCode) {
      case 'F1':
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'Feed',
          },
        });
        break;
      case 'F2':
        navigation.navigate('Community');
        break;
      case 'F3':
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'Message',
          },
        });
        break;

      case 'F4':
        navigation.navigate('Profile');
        break;

      case 'F5':
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'Resources',
          },
        });
        break;

      case 'F6':
        navigation.navigate('ReferFriend');
        break;

      case 'F7':
        navigation.navigate('Profile');
        break;

      case 'F9':
        navigation.navigate('Notifications');
        break;

      case 'F10':
        navigation.navigate('Faq');
        break;

      case 'F11':
        navigation.navigate('HelpCenter');
        break;

      case 'F12':
        navigation.navigate('ContactUs');
        break;

      case 'F13':
        showLogoutPopup();
        break;

      case 'F15':
        // Home click
        break;

      case 'F16':
        showTemplatePopup();
        break;

      case 'F17':
        //contact
        navigation.navigate('EventViewAll');
        break;

      case 'F22':
        navigation.navigate('ActionItemList');
        break;

      case 'F23':
        handleBiometricClick();
        break;

      case 'F24':
        handleBiometricClick();
        break;

      case 'F25':
        navigation.navigate('SettingsScreen');
        break;

      case 'F26':
        // Advisor will be able to see the EventViewAll screen
        navigation.navigate('EventViewAll');
        break;

      case 'F27':
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'ContactListing',
          },
        });
        break;

      case 'F28':
        navigation.navigate('ContactVault');
        break;

      case 'F29':
        navigation.navigate('ContactVault', {
          navigationFrom:
            ContactVaultParentScreenType.fromDashboardShortcutCard,
        });
        break;

      case 'F30':
        navigation.navigate('MyTeams');
        break;

      default:
        break;
    }
  };

  const handleBiometricClick = async () => {
    try {
      if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.FACE_ID);
        Log('FaceID Permission => ' + status);

        if (status === RESULTS.DENIED || status === RESULTS.BLOCKED) {
          // Try requesting permission if not permanently blocked
          const newStatus = await request(PERMISSIONS.IOS.FACE_ID);
          Log('FaceID Request Result => ' + newStatus);

          if (newStatus === RESULTS.DENIED || newStatus === RESULTS.BLOCKED) {
            showAlertPopup({
              title: t('FaceIDPermissionRequired'),
              msg: t('EnableFaceIdMsg'),
              PositiveText: t('OpenSettings'),
              NegativeText: t('Cancel'),
              dismissOnBackPress: false,
              onPositivePress: () => {
                storage.set('FaceIdSettings', true);
                openAppSettings();
              },
            });
            return;
          }
        } else if (status === RESULTS.UNAVAILABLE) {
          showSnackbar(t('FaceIdNotAvailable'), 'danger');
          return;
        }
      }

      // ✅ If we reach here, Face ID permission is granted or not required (Android)
      if (
        biometricEnabled.userBiometricEnabled === UserBiometricOption.disabled
      ) {
        biometricEnabled.setUserBiometricEnabled(UserBiometricOption.enabled);
        biometricEnabled.setShowBiometricPopup(true);
        //storage.set('biometricAuthenticateTime', new Date().getTime());
      } else {
        biometricEnabled.setUserBiometricEnabled(UserBiometricOption.disabled);
        storage.set('inactiveTime', new Date().getTime());
      }
      sessionService.start();
    } catch (error) {
      Log('handleBiometricClick Error => ' + JSON.stringify(error));
      showSnackbar(t('FaceIdNotAvailable'), 'danger');
    }
  };

  const fetchCardsApi = async (cardsList: GetCardsForUserDashboardModel[]) => {
    cardsList?.forEach(cardData => {
      if (cardData.sliderTypeCode == 'orionps') {
        getPerformanceSummaryDataApi.mutate({});
      } else if (cardData.sliderTypeCode == 'orasset') {
        getAssetAllocationApi.mutate({});
      } else if (cardData.sliderTypeCode == 'orion') {
        getOrionAumApi.mutate({});
      } else if (cardData.sliderTypeCode == 'ortwr') {
        getPerformanceTWRApi.mutate({});
      } else if (cardData.sliderTypeCode == 'emnetworth') {
        getClientTotalNetworthApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'emgoals') {
        getClientGoalApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'embasicnetworth') {
        getClientBasicNetworthApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'bdiamond') {
        getClientBlackDiamondApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'bdasset') {
        getBDAssetAllocationApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'adpaum') {
        getAddeparAUMV2Api.mutate({
          apiPayload: {
            CallPoint: 'app',
            currency: cardData.currency,
          },
          cardData: cardData,
        });
      } else if (cardData.sliderTypeCode == 'adpror') {
        getAddeparRORV2Api.mutate({
          apiPayload: {
            CallPoint: 'app',
            currency: cardData.currency,
          },
          cardData: cardData,
        });
      } else if (cardData.sliderTypeCode == 'adpasset') {
        getAddeparAssetAllocationV2Api.mutate({
          apiPayload: {
            CallPoint: 'app',
            currency: cardData.currency,
          },
          cardData: cardData,
        });
      } else if (cardData.sliderTypeCode == 'nitrogen') {
        getClientNitrogenApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'tamarac') {
        getClientTamaracApi.mutate({
          CallPoint: 'app',
        });
      } else if (cardData.sliderTypeCode == 'tamaracacc') {
        getTamaracAccountsApi.mutate({
          CallPoint: 'app',
        });
      }
    });
  };

  const upsert = (list: GetAddeparModel[] = [], item: GetAddeparModel) => {
    const i = list.findIndex(x => x.appId === item.appId);
    return i !== -1
      ? list.map(x => (x.appId === item.appId ? item : x))
      : [...list, item];
  };

  // added by @Yuvraj 06-02-2025 --> api call to get data (#4063)
  const getCardsForUserDashboardApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetCardsForUserDashboardModel[]>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.Getadvisorexperiencecard
            : ApiConstants.Getcommunitytemplatecard,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setCardsList([]);
      setCardLoading(true);
    },
    onSettled(data, error, variables, context) {
      setCardLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.length > 0) {
        setAllCardsList(
          data.result.map((item, index) => ({
            ...item,
            sliderTypeCode: item.sliderTypeCode?.toLowerCase(),
            appId: `${item.sliderTypeCode?.toLowerCase()}_${item.currency}_${
              item.id
            }`,
          })),
        );
      } else {
        setAllCardsList([]);
      }
    },
    onError(error, variables, context) {
      setAllCardsList([]);
    },
  });

  const getPerformanceSummaryDataApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetPerformanceSummaryDataModel>({
        endpoint: ApiConstants.GetPerformanceSummaryData,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      // setCardsList(
      //   cardsList.map((item, i) =>
      //     item.sliderTypeCode == 'orionps' ? {...item, loading: false} : item,
      //   ),
      // );
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'orionps' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('1] orionps getPerformanceSummaryDataApi ');
          dashboardCardsData.setOrionPs({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }

        setGetPerformanceSummaryData(data.result);
      } else {
        setGetPerformanceSummaryData(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetPerformanceSummaryData(undefined);
    },
  });

  const getAssetAllocationApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAssetAllocationModel>({
        endpoint: ApiConstants.GetAssetAllocation,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'orasset' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('2] orasset getAssetAllocationApi ');

          dashboardCardsData.setOrionAsset({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }

        setGetAssetAllocation(data.result);
      } else {
        setGetAssetAllocation(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetAssetAllocation(undefined);
    },
  });

  const getOrionAumApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetOrionAumModel>({
        endpoint: ApiConstants.GetOrionAUM,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'orion' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('3] orion getOrionAumApi ');

          dashboardCardsData.setOrionAum({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }

        setGetOrionAum(data.result);
      } else {
        setGetOrionAum(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetOrionAum(undefined);
    },
  });

  const getPerformanceTWRApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetPerformanceTwrModel>({
        endpoint: ApiConstants.GetPerformanceTWR,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'ortwr' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        const orionTwrData: GetPerformanceTwrModel = {
          ...data.result,
          value: data.result.sinceInception,
        };

        if (data.result.status == 1) {
          Log('4] ortwr getPerformanceTWRApi ');

          dashboardCardsData.setOrionTwr({
            ...orionTwrData,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }

        setGetPerformanceTwr(orionTwrData);
      } else {
        setGetPerformanceTwr(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetPerformanceTwr(undefined);
    },
  });

  const getClientTotalNetworthApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientTotalNetworthModel>({
        endpoint: ApiConstants.GetClientTotalNetworth,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'emnetworth'
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('5] emnetworth getClientTotalNetworthApi ');

          dashboardCardsData.setEMoneyTotalNetWorth({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetClientTotalNetworth(data.result);
      } else {
        setGetClientTotalNetworth(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetClientTotalNetworth(undefined);
    },
  });
  const getClientBasicNetworthApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientBasicNetworthModel>({
        endpoint: ApiConstants.GetClientBasicNetworth,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'embasicnetworth'
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('6] embasicnetworth getClientBasicNetworthApi ');

          dashboardCardsData.setEMoneyBasicNetWorth({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetClientBasicNetworth(data.result);
      } else {
        setGetClientBasicNetworth(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetClientBasicNetworth(undefined);
    },
  });

  const getClientGoalApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientGoalsModel>({
        endpoint: ApiConstants.GetClientGoals,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'emgoals' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result) {
          Log('6] embasicnetworth getClientBasicNetworthApi ');

          dashboardCardsData.setEMoneyClientGoal({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetClientGoals(data.result);
      } else {
        setGetClientGoals(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetClientGoals(undefined);
    },
  });

  const getClientBlackDiamondApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientBlackDiamondModel>({
        endpoint: ApiConstants.GetClientBlackDiamond,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'bdiamond'
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('7] bdiamond getClientBlackDiamondApi ');

          dashboardCardsData.setBlackDiamond({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetClientBlackDiamond(data.result);
      } else {
        setGetClientBlackDiamond(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetClientBlackDiamond(undefined);
    },
  });

  const getBDAssetAllocationApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetBDAssetAllocationModel>({
        endpoint: ApiConstants.GetBDAssetAllocation,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(
        cardsList?.map((item, i) =>
          item.sliderTypeCode == 'bdasset' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          dashboardCardsData.setBlackDiamonAssetAllocation({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetBDAssetAllocation(data.result);
      } else {
        setGetBDAssetAllocation(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetBDAssetAllocation(undefined);
    },
  });

  const getAddeparAUMV2Api = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      cardData?: GetCardsForUserDashboardModel;
    }) => {
      return makeRequest<GetAddeparModel>({
        endpoint: ApiConstants.GetAddeparAUMV2,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'adpaum' &&
          item.appId == variables.cardData?.appId
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        const newItem: GetAddeparModel = {
          ...data.result,
          appDate: formatDate({
            date: new Date(),
            returnFormat: DateFormats.parseDateFormat,
          }),
          appId: variables.cardData?.appId,
        };

        if (data.result.status === 1) {
          Log('8] adpaum getAddeparAUMV2Api');

          dashboardCardsData.setAddeparAUMV2(prev => upsert(prev, newItem));
        }

        setGetAddeparAUMV2(prev => upsert(prev, newItem));
      }
    },
    onError(error, variables, context) {
      // Error Response
    },
  });
  const getAddeparRORV2Api = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      cardData?: GetCardsForUserDashboardModel;
    }) => {
      return makeRequest<GetAddeparModel>({
        endpoint: ApiConstants.GetAddeparRORV2,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'adpror' &&
          item.appId == variables.cardData?.appId
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response

      if (data.result) {
        const newItem: GetAddeparModel = {
          ...data.result,
          appDate: formatDate({
            date: new Date(),
            returnFormat: DateFormats.parseDateFormat,
          }),
          appId: variables.cardData?.appId,
        };

        if (data.result.status === 1) {
          Log('8] adpaum getAddeparRORV2Api');

          dashboardCardsData.setAddeparRORV2(prev => upsert(prev, newItem));
        }

        setGetAddeparRORV2(prev => upsert(prev, newItem));
      }
    },
    onError(error, variables, context) {
      // Error Response
    },
  });

  const getAddeparAssetAllocationV2Api = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      cardData?: GetCardsForUserDashboardModel;
    }) => {
      return makeRequest<GetAddeparModel>({
        endpoint: ApiConstants.GetAddeparAssetAllocationV2,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'adpasset' &&
          item.appId == variables.cardData?.appId
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response

      if (data.result) {
        const newItem: GetAddeparModel = {
          ...data.result,
          appDate: formatDate({
            date: new Date(),
            returnFormat: DateFormats.parseDateFormat,
          }),
          appId: variables.cardData?.appId,
        };

        if (data.result.status === 1) {
          Log('9] adpasset getAddeparAssetAllocationV2Api ');

          dashboardCardsData.setAddeparAssetAllocationV2(prev =>
            upsert(prev, newItem),
          );
        }

        setGetAddeparAssetAllocationV2(prev => upsert(prev, newItem));
      }
    },
    onError(error, variables, context) {
      // Error Response
    },
  });

  const getClientNitrogenApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientNitrogenModel>({
        endpoint: ApiConstants.GetClientNitrogen,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'nitrogen'
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result?.status == 1) {
          Log('10] nitrogen getClientNitrogenApi ');

          dashboardCardsData.setClientNitrogen({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetclientnitrogen(data.result);
      } else {
        setGetclientnitrogen(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetclientnitrogen(undefined);
    },
  });

  const getClientTamaracApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientTamaracModel>({
        endpoint: ApiConstants.GetClientTamarac,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'tamarac' ? { ...item, loading: false } : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('11] tamarac getClientTamaracApi ');

          dashboardCardsData.setClientTamarac({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
          if (data.result.showAccounts) {
            getTamaracAccountsApi.mutate({
              CallPoint: 'app',
            });
          }
        }
        setGetClientTamarac(data.result);
      } else {
        setGetClientTamarac(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetClientTamarac(undefined);
    },
  });

  const getTamaracAccountsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTamaracAccountsModel>({
        endpoint: ApiConstants.GetTamaracAccounts,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setCardsList(prev =>
        prev.map(item =>
          item.sliderTypeCode == 'tamaracacc'
            ? { ...item, loading: false }
            : item,
        ),
      );
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        if (data.result.status == 1) {
          Log('12] tamaracacc getTamaracAccountsApi ');

          dashboardCardsData.setTamaracAccounts({
            ...data.result,
            appDate: formatDate({
              date: new Date(),
              returnFormat: DateFormats.parseDateFormat,
            }),
          });
        }
        setGetTamaracAccounts(data.result);
      } else {
        setGetTamaracAccounts(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      setGetTamaracAccounts(undefined);
    },
  });

  return (
    <View>
      {cardLoading ? (
        <Skeleton>
          <View style={styles.skeletonLay}>
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonCardTitle} />
              <View style={styles.skeletonCardSubTitle} />
            </View>
          </View>
        </Skeleton>
      ) : cardsList?.length > 0 ? (
        <CustomCarousel
          mode={CarouselMode.parallax}
          data={cardsList}
          aspectRatio={1}
          children={(item, index) => {
            const isPrimary = index % 2 == 0;
            return (
              <View style={styles.imgLay}>
                <Shadow
                  onPress={
                    item.sliderTypeCode == 'module' ||
                    item.customLink ||
                    item.sliderTypeCode == 'dynamic'
                      ? () => {
                          if (item.sliderTypeCode == 'module') {
                            handleModuleClick(item);
                          } else if (
                            item.sliderTypeCode == 'dynamic' &&
                            item.destination
                          ) {
                            openInAppBrowser(item.destination);
                          } else {
                            if (item.customLink) {
                              openInAppBrowser(item.customLink);
                            }
                          }
                        }
                      : undefined
                  }
                  tapStyle={{ padding: 0 }}
                  style={{
                    ...styles.cardShadow,
                    backgroundColor:
                      item.sliderTypeCode == 'orasset'
                        ? theme.colors.surface
                        : isPrimary
                        ? theme.colors.primary
                        : theme.colors.surface,
                  }}
                >
                  {item.loading ? (
                    <View style={styles.cardMain}>
                      <Skeleton>
                        <View style={styles.skeletonCardCarousel}>
                          <View style={styles.skeletonCardTitle} />
                          <View style={styles.skeletonCardSubTitle} />
                          <View style={styles.skeletonCardSubTitle} />
                          <View style={styles.skeletonCardSubTitle} />
                        </View>
                      </Skeleton>
                    </View>
                  ) : item.sliderTypeCode == 'custom' ||
                    item.sliderTypeCode == 'dynamic' ||
                    item.sliderTypeCode == 'module' ? (
                    <CustomDashboardCard
                      cardData={item}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'orionps' &&
                    getPerformanceSummaryData ? (
                    <OrionPs
                      cardData={item}
                      data={getPerformanceSummaryData}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'orion' && getOrionAum ? (
                    <OrionAum
                      cardData={item}
                      data={getOrionAum}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'ortwr' && getPerformanceTwr ? (
                    <OrionTwr
                      cardData={item}
                      data={getPerformanceTwr}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'orasset' && getAssetAllocation ? (
                    <OrionAsset
                      cardData={item}
                      data={getAssetAllocation}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'emnetworth' &&
                    getClientTotalNetworth ? (
                    <EMTotalNetWorthCard
                      cardData={item}
                      data={getClientTotalNetworth}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'embasicnetworth' &&
                    getClientBasicNetworth ? (
                    <EMBasicNetWorthCard
                      cardData={item}
                      data={getClientBasicNetworth}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'emgoals' && getClientGoals ? (
                    <EMGoal
                      cardData={item}
                      data={getClientGoals}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'bdiamond' &&
                    getClientBlackDiamond ? (
                    <BlackDiamond
                      cardData={item}
                      data={getClientBlackDiamond}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'bdasset' &&
                    getBDAssetAllocation ? (
                    <BlackDiamondAsset
                      cardData={item}
                      data={getBDAssetAllocation}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'adpaum' &&
                    getAddeparAUMV2.length > 0 &&
                    getAddeparAUMV2.find(
                      addeparItem => addeparItem.appId == item.appId,
                    ) ? (
                    <AddeparAUMV2
                      cardData={item}
                      data={
                        getAddeparAUMV2.find(
                          addeparItem => addeparItem.appId == item.appId,
                        )!
                      }
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'adpror' &&
                    getAddeparRORV2.length > 0 &&
                    getAddeparRORV2.find(
                      addeparItem => addeparItem.appId == item.appId,
                    ) ? (
                    <AddeparRORV2
                      cardData={item}
                      data={
                        getAddeparRORV2.find(
                          addeparItem => addeparItem.appId == item.appId,
                        )!
                      }
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'adpasset' &&
                    getAddeparAssetAllocationV2.length > 0 &&
                    getAddeparAssetAllocationV2.find(
                      addeparItem => addeparItem.appId == item.appId,
                    ) ? (
                    <AddeparAssetAllocationV2
                      cardData={item}
                      data={
                        getAddeparAssetAllocationV2.find(
                          addeparItem => addeparItem.appId == item.appId,
                        )!
                      }
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'nitrogen' && getclientnitrogen ? (
                    <Nitrogen
                      cardData={item}
                      data={getclientnitrogen}
                      isPrimary={isPrimary}
                    />
                  ) : item.sliderTypeCode == 'tamarac' && getClientTamarac ? (
                    <TamaracS
                      cardData={item}
                      data={getClientTamarac}
                      isPrimary={isPrimary}
                      cardAccountsData={getTamaracAccounts}
                    />
                  ) : item.sliderTypeCode == 'tamaracacc' &&
                    getTamaracAccounts ? (
                    <TamaracAcc
                      cardData={item}
                      data={getTamaracAccounts}
                      isPrimary={isPrimary}
                    />
                  ) : (
                    <></>
                  )}
                </Shadow>
              </View>
            );
          }}
        />
      ) : (
        <></>
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    skeletonCardCarousel: {
      height: '100%',
      width: '100%',
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 50,
    },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    skeletonCard: {
      height: 250,
      width: '100%',
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.surface,
      padding: 20,
      marginVertical: 25,
    },
    skeletonCardTitle: {
      height: 20,
      width: '40%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonCardSubTitle: {
      height: 15,
      width: '60%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginTop: 30,
    },
    imgLay: {
      justifyContent: 'center',
    },
    cardShadow: {
      height: '100%',
      width: '100%',
      padding: 0,
      borderWidth: 1.5,
      borderRadius: theme.roundness,
      borderColor: theme.colors.outline,
    },
    cardMain: { flex: 1 },
  });

export default DashboardCards;
