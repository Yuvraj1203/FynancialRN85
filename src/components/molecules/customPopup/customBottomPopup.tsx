import { CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { handlePopupDismiss } from '@/utils/utils';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title?: string | ReactNode;
  children: React.ReactNode;
  shown: boolean;
  setShown: (value: boolean) => void;
  dismissOnBackPress?: boolean;
  dismissOnClosePress?: boolean;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
  withoutKeyboardAvoidingView?: boolean;
  popUpBgcolor?: string;
  titleColor?: string;
  keyboardHandle?: boolean;
};

function CustomBottomPopup({
  dismissOnBackPress = true,
  dismissOnClosePress = true,
  ...props
}: Props) {
  const theme = useTheme(); // theme

  const safeAreaInsets = useSafeAreaInsets();

  const styles = makeStyles(theme, safeAreaInsets); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [keyboardHeight, setKeyboardHeight] = useState(14);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      event => {
        setTimeout(() => {
          if (props.shown) {
            setKeyboardHeight(event.endCoordinates.height);
          } else {
            setKeyboardHeight(14);
          }
        }, 200);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(14);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [props.shown]);

  // dismiss bottom card
  const dimiss = () => {
    props.setShown(false);
    if (props.onClose) {
      props.onClose();
    }
  };

  /** added by @YUvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
  handlePopupDismiss(props.shown, dimiss);

  const renderContent = (style?: ViewStyle) => {
    return (
      <>
        <Animated.View
          entering={FadeIn.springify()}
          exiting={FadeOut.duration(100)}
          style={styles.overlayBackground}
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
          style={styles.tap}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: props.popUpBgcolor ?? theme.colors.surface,
                paddingBottom:
                  Platform.OS === 'ios'
                    ? keyboardHeight
                    : safeAreaInsets.bottom,
              },
            ]}
          >
            <View style={styles.headerLay}>
              {typeof props.title == 'string' ? (
                <CustomText
                  color={props.titleColor}
                  variant={TextVariants.titleLarge}
                  style={styles.titleText}
                >
                  {props.title}
                </CustomText>
              ) : (
                props.title
              )}
              <Tap
                style={styles.closeTap}
                onPress={() => {
                  if (dismissOnClosePress) {
                    dimiss();
                  }
                }}
              >
                <CustomImage
                  source={Images.close}
                  type={ImageType.svg}
                  style={styles.closeIcon}
                  color={props.titleColor ?? theme.colors.onSurfaceVariant}
                />
              </Tap>
            </View>

            <View style={styles.main}>{props.children}</View>
          </View>
        </Animated.View>
        <Animated.View
          style={styles.slideInHelperContainer}
          entering={FadeIn}
          exiting={SlideOutDown.duration(100)}
        ></Animated.View>
      </>
    );
  };

  const renderContentWithoutPopup = () => {
    return props.shown ? (
      <>
        <Animated.View
          entering={FadeIn.springify()}
          exiting={FadeOut.duration(50).easing(Easing.linear)}
          style={styles.overlayBackground}
        >
          <Tap
            style={StyleSheet.absoluteFill}
            onPress={() => dismissOnBackPress && dimiss()}
          >
            <View></View>
          </Tap>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.springify()}
          exiting={SlideOutDown.springify()}
          style={styles.tap}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: props.popUpBgcolor ?? theme.colors.surface,
                paddingBottom:
                  Platform.OS === 'ios'
                    ? keyboardHeight
                    : safeAreaInsets.bottom,
              },
            ]}
          >
            <View style={styles.headerLay}>
              {typeof props.title == 'string' ? (
                <CustomText
                  color={props.titleColor}
                  variant={TextVariants.titleLarge}
                  style={styles.titleText}
                >
                  {props.title}
                </CustomText>
              ) : (
                props.title
              )}
              <Tap
                style={styles.closeTap}
                onPress={() => {
                  if (dismissOnClosePress) {
                    dimiss();
                  }
                }}
              >
                <CustomImage
                  source={Images.close}
                  type={ImageType.svg}
                  style={styles.closeIcon}
                  color={props.titleColor ?? theme.colors.onSurfaceVariant}
                />
              </Tap>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.select({
                ios: 0,
                android: 500,
              })}
              style={styles.main}
            >
              <View style={styles.main}>{props.children}</View>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </>
    ) : (
      <></>
    );
  };

  const handleBottomPopup = () => {
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
          animationType="fade"
          hardwareAccelerated
        >
          {props.withoutKeyboardAvoidingView ? (
            renderContent()
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.select({ ios: 0, android: 500 })}
              style={styles.main}
            >
              {renderContent()}
            </KeyboardAvoidingView>
          )}
        </Modal>
      </Portal>
    );
  };

  return props.keyboardHandle
    ? Platform.OS === 'ios'
      ? handleBottomPopup()
      : renderContentWithoutPopup()
    : handleBottomPopup();
}

const makeStyles = (theme: CustomTheme, safeAreaInsets: EdgeInsets) =>
  StyleSheet.create({
    overlayBackground: {
      position: 'absolute',
      backgroundColor: theme.colors.popupBg,
      height: '100%',
      width: '100%',
      zIndex: 1,
      flex: 1,
    },
    background: {
      backgroundColor: theme.colors.popupBg,
      flex: 1,
    },
    tap: {
      flex: 1,
      position: 'absolute',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      // marginBottom: -5,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 0,
      zIndex: 10,
    },
    slideInHelperContainer: {
      position: 'absolute',
      width: '100%',
      height: 120,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      zIndex: 1,
    },
    container: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopWidth: 0.3,
      borderLeftWidth: 0.3,
      borderRightWidth: 0.3,
    },
    closeIcon: { height: 25, width: 25 },
    headerLay: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 10,
      minHeight: 60, // if not , than the popup header will flicker on animation -Yuvraj
    },
    titleText: {
      flex: 1,
      marginLeft: 10,
      marginTop: 5,
    },
    closeTap: {
      marginHorizontal: 10,
    },
    main: {
      flex: 1,
    },
  });

export default CustomBottomPopup;
