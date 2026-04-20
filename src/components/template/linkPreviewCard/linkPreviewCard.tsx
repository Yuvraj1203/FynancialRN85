import { CustomImage, CustomText, Tap } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useCustomInAppBrowser } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

// options for component
type LinkPreviewProps = {
  title?: string;
  description?: string;
  image?: string;
  destinationURL?: string;
  orignalUrl?: string;
  metadataFound?: boolean;
  shown: boolean;
  setShown: (value: boolean) => void;
  onClose?: () => void;
  dismissOnClosePress?: boolean;
  style?: StyleProp<ViewStyle>;
  safeURL?: boolean;
};

function LinkPreviewCard({
  dismissOnClosePress = true,
  ...props
}: LinkPreviewProps) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  /** Added by @Akshita 05-02-25 ---> to open in app browser links from comments(FYN-4314)*/
  const openInAppBrowser = useCustomInAppBrowser();

  // ✅ same as dimiss()
  const dimiss = () => {
    props.setShown(false);
    props.onClose?.();
  };

  if (!props.shown) return null; // ✅ card closes immediately

  return (
    <View style={[styles.container, props.style]}>
      {props.metadataFound ? (
        <>
          <CustomImage
            source={{ uri: props.image }}
            style={styles.image}
            resizeMode={ResizeModeType.contain}
          />

          <View style={styles.textContainer}>
            <CustomText maxLines={1} variant={TextVariants.labelMedium}>
              {props.title}
            </CustomText>

            <Tap
              onPress={() => {
                openInAppBrowser(props.destinationURL);
              }}
            >
              <CustomText
                color={theme.colors.links}
                ellipsis={TextEllipsis.tail}
                variant={TextVariants.labelSmall}
                maxLines={2}
              >
                {props.description}
              </CustomText>
            </Tap>
          </View>
        </>
      ) : (
        <View style={{ flexDirection: 'column' }}>
          {!props.safeURL && (
            <CustomText variant={TextVariants.bodyLarge}>
              {props.title}
            </CustomText>
          )}
          <CustomText>{props.description}</CustomText>
        </View>
      )}

      <Tap
        style={{
          position: 'absolute',
          alignSelf: 'flex-start',
          right: 0,
          marginTop: 5,
        }}
        onPress={() => {
          if (dismissOnClosePress) {
            dimiss();
          }
        }}
      >
        <CustomImage
          style={{ height: 20, width: 20, marginRight: 5 }}
          source={Images.closeCircle}
          type={ImageType.svg}
        />
      </Tap>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      padding: 10,
      borderRadius: theme.roundness,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 0.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start', // Align items to the left
      backgroundColor: theme.colors.surface,
      paddingRight: 30,
    },

    image: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },

    textContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      marginLeft: 15,
    },
  });

export default LinkPreviewCard;
