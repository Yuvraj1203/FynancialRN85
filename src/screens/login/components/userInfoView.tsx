import {
  CustomAvatar,
  CustomImage,
  CustomText,
  HeartBeatView,
  Shadow,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { GetUserDetailForProfileModel } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { isEmpty } from '@/utils/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

type Props = {
  loading?: boolean;
  onPress?: () => void;
  userInfo?: GetUserDetailForProfileModel;
};

function UserInfoView(props: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const { t } = useTranslation();

  return (
    <Shadow
      onPress={props.onPress}
      tapStyle={styles.userInfoContainerTap}
      style={styles.userInfoContainer}
    >
      <Tap style={styles.profileImageView} onPress={() => {}}>
        <CustomAvatar
          source={
            !isEmpty(props.userInfo?.profileImageUrl) && {
              uri: props.userInfo?.profileImageUrl,
            }
          }
          text={
            isEmpty(props.userInfo?.profileImageUrl)
              ? `${props.userInfo?.firstName} ${props.userInfo?.lastName}`
              : undefined
          }
          viewStyle={styles.profileImage}
          imageStyle={styles.profileImage}
        />
      </Tap>
      <CustomText variant={TextVariants.bodyLarge} style={styles.textCenter}>
        {`${t('Welcome')}, ${props.userInfo?.firstName} ${
          props.userInfo?.lastName
        }`}
      </CustomText>
      <CustomText variant={TextVariants.bodySmall} style={styles.textCenter}>
        {t('LoginWith')}
      </CustomText>
      <View style={styles.biometricImage}>
        {props.loading ? (
          <ActivityIndicator size={30} />
        ) : (
          <HeartBeatView intensity={0.1} stepTime={900} iterations={-1}>
            <CustomImage
              source={Platform.OS == 'ios' ? Images.faceId : Images.fingerprint}
              type={ImageType.svg}
              color={theme.colors.onSurfaceVariant}
              style={styles.biometricImage}
              resizeMode={ResizeModeType.contain}
            />
          </HeartBeatView>
        )}
      </View>
      <CustomText variant={TextVariants.bodySmall} style={styles.textCenter}>
        {Platform.OS == 'ios' ? t('FaceId') : t('Fingerprint')}
      </CustomText>
    </Shadow>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    userInfoContainerTap: {
      overflow: 'visible',
    },
    userInfoContainer: {
      paddingTop: 45,
      gap: 10,
    },
    biometricImage: {
      alignSelf: 'center',
      marginVertical: 5,
      height: 50,
      width: 50,
    },
    profileImageView: {
      position: 'absolute',
      top: -35,
      alignSelf: 'center',
      width: 70,
      height: 70,
      borderRadius: 999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileImage: {
      width: 70,
      height: 70,
      borderRadius: 999,
    },
    textCenter: {
      textAlign: 'center',
    },
  });

export default UserInfoView;
