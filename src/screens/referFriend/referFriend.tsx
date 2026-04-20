import {
  CustomButton,
  CustomImage,
  CustomText,
  Shadow,
  Skeleton,
} from '@/components/atoms';
import {
  ButtonVariants,
  Direction,
} from '@/components/atoms/customButton/customButton';
import {ImageType} from '@/components/atoms/customImage/customImage';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomHeader} from '@/components/molecules';
import {SafeScreen} from '@/components/template';
import {ApiConstants} from '@/services/apiConstants';
import {HttpMethodApi, makeRequest} from '@/services/apiInstance';
import {getReferAFriendInfoModel} from '@/services/models/getReferAFriendInfoModel/getReferAFriendInfoModel';
import {userStore} from '@/store';
import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useAppNavigation} from '@/utils/navigationUtils';
import {handleShare, showSnackbar} from '@/utils/utils';
import {useMutation} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Animated, ColorValue, ScrollView, StyleSheet, View} from 'react-native';

function ReferFriend() {
  /**  Added by @Ajay 11-2-24 ---> Navigation hook for screen navigation  */
  const navigation = useAppNavigation();

  /**  Added by @Ajay 11-2-24 ---> Access theme provider  */
  const theme = useTheme();

  /**  Added by @Ajay 11-2-24 ---> Stylesheet with theme implementation  */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 11-2-24 ---> Translations for multi-language support  */
  const {t} = useTranslation();

  /**  Added by @Ajay 11-2-24 ---> State for storing QR code image  */
  const [qrCodeImage, setQrCodeImage] = useState<string>();

  /**  Added by @Ajay 11-2-24 ---> State for storing referral info  */
  const [referralInfo, setReferralInfo] = useState<getReferAFriendInfoModel>();

  /**  Added by @Ajay 11-2-24 ---> Animation for QR code scanning effect  */
  const scanningAnimation = useRef(new Animated.Value(0)).current;

  const [showScanningLine, setShowScanningLine] = useState(false);

  /**  Added by @Ajay 11-2-24 ---> State for loading indicator (#4274)  */
  const [loading, setLoading] = useState(false);

  const userDetails = userStore(state => state.userDetails);

  /**  Added by @Ajay 11-2-24 ---> Fetch referral info on component mount  */
  useEffect(() => {
    if (userDetails) {
      getreferralinfo.mutate({});
    }
  }, []);

  /**  Added by @Ajay 11-2-24 ---> Animation for QR code scanning effect (#4274) */
  const handleScanningLineAnimation = () => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanningAnimation, {
          toValue: 190 /** Adjust to match the QR code height */,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanningAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    setShowScanningLine(true);
    animation.start();

    /** Hide scanning line after 3 seconds */
    setTimeout(() => {
      setShowScanningLine(false);
      animation.reset();
    }, 3000);
  };

  const hexToRgba = (hex: string, alpha: number): ColorValue => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  /**  Added by @Ajay 11-2-24 ---> Fetch referral information using API (#4274)  */
  const getreferralinfo = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<getReferAFriendInfoModel>({
        endpoint: ApiConstants.GetReferaFriendInfo,
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
      if (data?.result) {
        setReferralInfo(data?.result);

        if (data?.result?.qrCodeImage) {
          setQrCodeImage(`data:image/jpeg;base64,${data?.result?.qrCodeImage}`);

          handleScanningLineAnimation();
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader showBack title={t('ReferFriend')} />
        <View style={styles.body}>
          {loading ? (
            <Skeleton>
              <View style={styles.skelBody}>
                <View style={styles.referTitleSkel} />
                <View style={styles.skeletonQrCode} />
                <View style={styles.skelButtonContainer}>
                  <View style={styles.skeletonDesc1} />
                  <View style={styles.skeletonDesc2} />
                  <View style={styles.skeletonButton} />
                  <View style={styles.skeletonButton2} />
                </View>
              </View>
            </Skeleton>
          ) : referralInfo?.isReferralAllowed ? (
            <View style={styles.container}>
              <CustomText
                variant={TextVariants.headlineMedium}
                color={theme.colors.text}
                style={styles.referTitle}>
                {t('referFreindTitle')}
              </CustomText>
              <Shadow
                style={{
                  ...styles.bottomCard,
                  backgroundColor: hexToRgba(
                    theme.colors.secondaryContainer,
                    0.25,
                  ),
                }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{flex: 1, alignItems: 'center'}}>
                    {qrCodeImage && (
                      <View style={styles.qrContainer}>
                        <View style={styles.qrBorder}>
                          <CustomImage
                            source={{uri: qrCodeImage}}
                            style={styles.qrCode}
                          />

                          <View style={styles.cornerTopLeft} />
                          <View style={styles.cornerTopRight} />
                          <View style={styles.cornerBottomLeft} />
                          <View style={styles.cornerBottomRight} />

                          {showScanningLine && (
                            <Animated.View
                              style={[
                                styles.scanningLine,
                                {transform: [{translateY: scanningAnimation}]},
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    )}

                    <CustomText style={styles.description}>
                      {referralInfo?.referralMsg}
                    </CustomText>

                    <CustomButton
                      style={styles.buttonSecondary}
                      onPress={() => {
                        navigation.navigate('MyReferrals');
                      }}>
                      {t('MyReferrals')}
                    </CustomButton>

                    <CustomButton
                      mode={ButtonVariants.outlined}
                      icon={{
                        source: Images.shareReferrals,
                        type: ImageType.svg,
                        direction: Direction.right,
                      }}
                      style={styles.button}
                      onPress={() => {
                        handleShare({
                          message: referralInfo?.referralLink,
                        });
                      }}>
                      {t('InviteFriend')}
                    </CustomButton>
                  </View>
                </ScrollView>
              </Shadow>
            </View>
          ) : (
            <View style={styles.error}>
              <CustomText style={styles.description}>
                {referralInfo?.referralMsg}
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    body: {
      flex: 1,
    },
    skelBody: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 30,
      marginTop: 50,
    },
    referTitle: {
      marginTop: 30,
      marginHorizontal: 15,
      padding: 5,
    },
    referTitleSkel: {
      height: 30,
      width: 300,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primary,
    },
    description: {
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 10,
      padding: 10,
    },
    skeletonDesc1: {
      marginBottom: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.text,
      width: 200,
      height: 20,
      marginTop: 30,
    },
    skeletonDesc2: {
      marginBottom: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.text,
      width: 180,
      height: 20,
      marginTop: 10,
    },
    bottomCard: {
      flex: 1,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      backgroundColor: theme.colors.lightPrimaryContainer,
      alignItems: 'center',
      padding: 20,
      marginTop: 20,
    },
    qrContainer: {
      width: 220,
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginBottom: 10,
      marginTop: 40,
    },
    qrCode: {
      width: 180,
      height: 180,
    },
    skeletonQrCode: {
      width: 200,
      height: 200,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primary,
      marginTop: 20,
    },
    skelButtonContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeletonButton: {
      width: '100%',
      height: 50,
      borderRadius: theme.roundness,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    skeletonButton2: {
      width: '80%',
      height: 50,
      borderRadius: theme.roundness,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    qrBorder: {
      position: 'relative',
      padding: 10,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cornerTopLeft: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: theme.colors.primary,
    },
    cornerTopRight: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: theme.colors.primary,
    },
    cornerBottomLeft: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: theme.colors.primary,
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: theme.colors.primary,
    },
    button: {
      marginTop: 20,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.secondary,
    },
    scanningLine: {
      position: 'absolute',
      left: '10%',
      top: 0,
      width: '80%',
      height: 4,
      backgroundColor: theme.colors.error,
    },
    refferNotAllow: {
      height: 300,
      width: 300,
    },
    error: {
      alignItems: 'center',
      alignSelf: 'center',
      justifyContent: 'center',
      flex: 1,
    },
  });

export default ReferFriend;
