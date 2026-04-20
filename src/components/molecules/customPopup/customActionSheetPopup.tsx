import { CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { ActionSheetModel } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { handlePopupDismiss } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, Divider, Portal } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ActionSheetModel[];
  title?: string;
  showCancel?: boolean;
  shown: boolean;
  setShown: (value: boolean) => void;
  onCancelClick?: () => void;
  dismissOnBackPress?: boolean;
  centered?: boolean;
  hideIcons?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

function CustomActionSheetPoup({
  dismissOnBackPress = true,
  centered = false,
  hideIcons = true,
  showCancel = false,
  ...props
}: Props) {
  const theme = useTheme(); // theme

  const safeAreaInsets = useSafeAreaInsets();

  const styles = makeStyles(theme, safeAreaInsets); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  // dismiss bottom card
  const dimiss = () => {
    props.setShown(false);
    if (props.onCancelClick) {
      props.onCancelClick();
    }
  };

  /** added by @Yuvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
  handlePopupDismiss(props.shown, dimiss);

  return (
    <Portal>
      <Modal
        visible={props.shown}
        transparent={true}
        onRequestClose={() => {
          if (dismissOnBackPress) {
            dimiss();
          }
        }}
      >
        <Animated.View
          entering={FadeIn.springify()}
          exiting={FadeOut.duration(50)}
          style={styles.background}
        >
          <Tap
            style={StyleSheet.absoluteFill}
            onPress={() => dismissOnBackPress && dimiss()}
          >
            <View></View>
          </Tap>
        </Animated.View>
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown.duration(100)}
          style={styles.container}
        >
          {props.title ? (
            <>
              <View style={styles.titleActionItem}>
                {props.loading && <ActivityIndicator />}
                <CustomText
                  variant={TextVariants.titleLarge}
                  color={theme.colors.primary}
                  style={styles.title}
                >
                  {props.title}
                </CustomText>
              </View>
              <Divider />
            </>
          ) : (
            <></>
          )}
          <View
            style={
              props.title
                ? styles.actionsItemLay
                : styles.actionsItemLayWithoutTitle
            }
          >
            {props.children.map((item, index) => (
              <View key={index}>
                <Tap
                  key={index}
                  onPress={() => {
                    if (item.dismissOnPress != undefined) {
                      if (item.dismissOnPress) {
                        dimiss();
                      }
                    } else {
                      dimiss();
                    }

                    setTimeout(() => {
                      if (item.onPress) {
                        item.onPress();
                      }
                    }, 100);
                  }}
                  style={styles.tapActionItem}
                >
                  <View
                    style={[
                      styles.actionsItem,
                      centered
                        ? { justifyContent: 'center' }
                        : { justifyContent: 'flex-start' },
                    ]}
                  >
                    {!hideIcons && item.image && (
                      <CustomImage
                        source={item.image}
                        type={item.imageType}
                        color={
                          item.imageColor
                            ? item.imageColor
                            : theme.colors.onSurfaceVariant
                        }
                        style={styles.closeIcon}
                      />
                    )}
                    <CustomText
                      color={item.titleColor}
                      variant={TextVariants.titleMedium}
                      style={styles.title}
                    >
                      {item.title}
                    </CustomText>
                  </View>
                </Tap>
                {item.loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator />
                  </View>
                )}
              </View>
            ))}
          </View>
          {(showCancel || props.children.length == 1) && (
            <>
              <Divider style={styles.cancelDivider} />
              <View style={styles.cancelActionsItemLay}>
                <Tap onPress={dimiss} style={styles.cancelTapActionItem}>
                  <View
                    style={[
                      styles.cancelActionsItem,
                      centered
                        ? { justifyContent: 'center' }
                        : { justifyContent: 'flex-start' },
                    ]}
                  >
                    {!hideIcons && (
                      <CustomImage
                        source={Images.close}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.closeIcon}
                      />
                    )}
                    <CustomText
                      variant={TextVariants.titleMedium}
                      style={styles.title}
                    >
                      {t('Cancel')}
                    </CustomText>
                  </View>
                </Tap>
              </View>
            </>
          )}
        </Animated.View>
        <Animated.View
          style={styles.slideInHelperContainer}
          entering={FadeIn}
          exiting={SlideOutDown.duration(100)}
        ></Animated.View>
      </Modal>
    </Portal>
  );
}

const makeStyles = (theme: CustomTheme, safeAreaInsets: EdgeInsets) =>
  StyleSheet.create({
    background: {
      backgroundColor: theme.colors.popupBg,
      flex: 1,
      position: 'absolute',
      height: '100%',
      width: '100%',
      zIndex: 1,
    },
    main: {
      flex: 1,
    },
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      zIndex: 10,
      paddingBottom: Platform.OS === 'ios' ? 14 : safeAreaInsets.bottom,
    },
    slideInHelperContainer: {
      position: 'absolute',
      width: '100%',
      height: 60,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      zIndex: 1,
    },
    titleActionItem: {
      // marginHorizontal: 15,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionsItemLay: {
      // marginHorizontal: 15,
      padding: 10,
      // borderBottomLeftRadius: theme.roundness,
      // borderBottomRightRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionsItemLayWithoutTitle: {
      // marginHorizontal: 15,
      padding: 10,
      // paddingBottom: 4,
      // borderRadius: theme.roundness,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor: theme.colors.surface,
    },
    tapActionItem: {
      padding: 0,
    },
    actionsItem: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelActionsItemLay: {
      // paddingHorizontal: 15, paddingVertical: 4
    },
    cancelDivider: {
      width: '95%',
      backgroundColor: theme.colors.onSurface,
      alignSelf: 'center',
    },
    cancelTapActionItem: {
      backgroundColor: theme.colors.surface,
      // paddingVertical: 4,
      paddingHorizontal: 10,
      // borderRadius: theme.roundness,
    },
    cancelActionsItem: {
      backgroundColor: theme.colors.surface,
      // borderRadius: theme.roundness,
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      marginHorizontal: 17,
    },
    closeIcon: { height: 25, width: 25 },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: 32,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
  });

export default CustomActionSheetPoup;
