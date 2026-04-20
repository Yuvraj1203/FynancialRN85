import { CustomImage, LoadingView, Shadow, Tap } from '@/components/atoms';
import { CustomImageProps } from '@/components/atoms/customImage/customImage';
import CustomText, {
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { handlePopupDismiss } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { Modal, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Divider, Portal } from 'react-native-paper';

// options for component
type Props = {
  title?: string;
  msg?: string;
  PositiveText?: string;
  NegativeText?: string;
  onPositivePress?: () => void;
  onNegativePress?: () => void;
  shown: boolean;
  compact?: boolean;
  dismissOnBackPress?: boolean;
  loading?: boolean;
  setShown: (value: boolean) => void;
  statusIcon?: CustomImageProps;
  style?: StyleProp<ViewStyle>;
};

function CustomPopup({ dismissOnBackPress = true, ...props }: Props) {
  const theme = useTheme(); // theme
  const styles = makeStyles(theme); // access StylesSheet with theme implemented
  const { t } = useTranslation(); //translation

  const dimiss = () => {
    props.setShown(false);
  };

  /** added by @YUvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
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
        animationType="fade"
      >
        <Tap
          onPress={() => {
            if (dismissOnBackPress) {
              dimiss();
            }
          }}
          style={styles.content}
        >
          <View style={styles.container}>
            <Shadow
              style={[
                props.compact ? styles.cardCompact : styles.card,
                props.style,
              ]}
            >
              <Tap style={{ padding: 0 }} onPress={() => {}}>
                <View>
                  {props.statusIcon && (
                    <CustomImage
                      source={props.statusIcon?.source}
                      type={props.statusIcon?.type}
                      color={props.statusIcon?.color}
                      resizeMode={props.statusIcon?.resizeMode}
                      style={
                        props.statusIcon.style
                          ? props.statusIcon.style
                          : styles.statusIcon
                      }
                    />
                  )}

                  <CustomText
                    variant={TextVariants.bodyLarge}
                    style={styles.heading}
                  >
                    {props.title ? props.title : t('Message')}
                  </CustomText>
                  <View style={styles.cardContent}>
                    <CustomText style={styles.body}>{props.msg}</CustomText>
                    <Divider
                      style={
                        props.compact ? styles.dividerCompact : styles.divider
                      }
                    />
                  </View>
                  <View style={styles.cardActions}>
                    {props.onNegativePress ? (
                      <View style={styles.actionLayout}>
                        <Tap
                          onPress={props.onNegativePress}
                          style={styles.negativeBtn}
                        >
                          <CustomText
                            variant={TextVariants.bodyMedium}
                            color={theme.colors.tertiary}
                            style={styles.negativeBtnTxt}
                          >
                            {props.NegativeText ? props.NegativeText : t('No')}
                          </CustomText>
                        </Tap>
                        <View style={styles.actionDivider} />

                        <Tap
                          onPress={() => {
                            if (props.onPositivePress && !props.loading) {
                              props.onPositivePress();
                            }
                          }}
                          style={styles.positiveBtn}
                        >
                          <View style={{ flex: 1 }}>
                            <CustomText
                              variant={TextVariants.bodyMedium}
                              color={theme.colors.tertiary}
                              style={styles.positiveBtnTxt}
                            >
                              {props.PositiveText
                                ? props.PositiveText
                                : t('Yes')}
                            </CustomText>
                            {props.loading && <LoadingView />}
                          </View>
                        </Tap>
                      </View>
                    ) : (
                      <Tap
                        onPress={() => {
                          if (props.onPositivePress && !props.loading) {
                            props.onPositivePress();
                          }
                        }}
                        style={styles.positiveSingleBtn}
                      >
                        <View>
                          <CustomText
                            variant={TextVariants.bodyMedium}
                            color={theme.colors.tertiary}
                            style={styles.positiveBtnTxt}
                          >
                            {props.PositiveText
                              ? props.PositiveText
                              : t('Done')}
                          </CustomText>
                          {props.loading && <LoadingView />}
                        </View>
                      </Tap>
                    )}
                  </View>
                </View>
              </Tap>
            </Shadow>
          </View>
        </Tap>
      </Modal>
    </Portal>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    content: { flex: 1, padding: 0 },
    container: {
      backgroundColor: theme.colors.popupBg,
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      borderRadius: theme.roundness,
      marginHorizontal: 50,
      padding: 5,
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 10,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
    },
    cardCompact: {
      borderRadius: theme.roundness,
      marginHorizontal: 70,
      padding: 5,
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 10,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      paddingHorizontal: 10,
    },
    cardActions: {
      flex: 1,
    },
    statusIcon: { height: 50, width: 50, alignSelf: 'center' },
    heading: {
      alignSelf: 'center',
      marginTop: 5,
      textAlign: 'center',
    },
    body: {
      alignSelf: 'center',
      marginTop: 10,
      textAlign: 'center',
    },
    divider: {
      marginTop: 32,
    },
    dividerCompact: {
      marginTop: 22,
    },
    actionLayout: {
      flex: 1,
      flexDirection: 'row',
    },
    negativeBtn: {
      flex: 1,
      alignItems: 'center',
      borderBottomLeftRadius: theme.roundness,
    },
    negativeBtnTxt: {
      paddingVertical: 5,
      paddingHorizontal: 5,
    },
    actionDivider: {
      width: 0.54,
      marginVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.outlineVariant,
    },
    positiveBtn: {
      flex: 1,
      alignItems: 'center',
      borderBottomRightRadius: theme.roundness,
    },
    positiveSingleBtn: {
      flex: 1,
      marginLeft: 0,
      alignItems: 'center',
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
    },
    positiveBtnTxt: {
      paddingVertical: 5,
      paddingHorizontal: 5,
    },
  });

export default CustomPopup;
