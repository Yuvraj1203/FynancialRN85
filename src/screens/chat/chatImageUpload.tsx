import { CustomImage, CustomText, Tap } from '@/components/atoms';
import { Direction } from '@/components/atoms/customButton/customButton';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomTextInput } from '@/components/molecules';
import { openImageCropperManual } from '@/components/molecules/customImagePicker/customImagePicker';
import PdfPreview from '@/components/molecules/pdfPreview/pdfPreview';
import { SafeScreen } from '@/components/template';
import { GetLinkPreviewHTMLModel } from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { useCustomInAppBrowser } from '@/utils/utils';
import { Zoomable } from '@likashefqet/react-native-image-zoom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Asset } from 'react-native-image-picker';
import { ChatReturnProp } from './chat';

export type ChatImageUploadProps = {
  media?: Asset[];
  message?: string;
  name?: string;
};

function ChatImageUpload() {
  /**  Added by @Yuvraj 08-04-2025 ---> navigate to different screen (FYN-6456) */
  const navigation = useAppNavigation();

  /**  Added by @Yuvraj 08-04-2025 ---> get params from parent screen (FYN-6456) */
  const route = useAppRoute('ChatImageUpload')?.params;

  /**  Added by @Yuvraj 08-04-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Yuvraj 08-04-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Yuvraj 08-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /** Added by @Yuvraj 08-04-2025 ---> Retrieve user details from store */
  const userDetails = userStore();

  const [message, setMessage] = useState(route?.message ?? '');

  const [mediaList, setMediaList] = useState<Asset[]>(route?.media ?? []);
  const [linkPreviewResult, setLinkPreviewResult] = useState<
    GetLinkPreviewHTMLModel | undefined
  >(undefined);

  const openInAppBrowser = useCustomInAppBrowser();

  const { sendDataBack } = useReturnDataContext();

  const handleSendDataBack = (cancel?: boolean) => {
    sendDataBack('Chat', {
      media: cancel ? [] : mediaList,
      message: cancel ? ' ' : message,
      preview: cancel ? undefined : linkPreviewResult,
    } as ChatReturnProp);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({
          ios: 0,
          android: 500,
        })}
        style={styles.main}
      >
        <View style={styles.main}>
          <View style={styles.imageLay}>
            {mediaList.at(0)?.type == 'application/pdf' ? (
              <PdfPreview
                pdfUrl={mediaList.at(0)?.uri}
                openLinks={openInAppBrowser}
                enablePaging
                pageNoDirection={Direction.left}
                style={styles.pdf}
              />
            ) : (
              <Zoomable>
                <CustomImage
                  source={{ uri: mediaList.at(0)?.uri }}
                  resizeMode={ResizeModeType.contain}
                  style={styles.pdf}
                />
              </Zoomable>
            )}
            <View style={styles.cropBtnLay}>
              {mediaList.at(0)?.type !== 'application/pdf' && (
                <Tap
                  onPress={() => {
                    if (mediaList.length > 0) {
                      openImageCropperManual(
                        mediaList.at(0)?.uri!,
                        croppedAsset => {
                          setMediaList([croppedAsset]);
                        },
                      );
                    }
                  }}
                >
                  <View style={styles.backBtnLay}>
                    <CustomImage
                      source={Images.cropper}
                      type={ImageType.svg}
                      color={
                        theme.dark
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.surface
                      }
                      style={styles.backBtn}
                    />
                  </View>
                </Tap>
              )}

              <Tap
                onPress={() => {
                  handleSendDataBack(true);
                }}
              >
                <View style={styles.backBtnLay}>
                  <CustomImage
                    source={Images.close}
                    type={ImageType.svg}
                    color={
                      theme.dark
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.surface
                    }
                    style={styles.backBtn}
                  />
                </View>
              </Tap>
            </View>
          </View>

          <View style={styles.inputLay}>
            <View>
              <CustomTextInput
                text={message}
                onChangeText={(text: string) => {
                  setMessage(text);
                }}
                onLinkPreviewChange={data => {
                  setLinkPreviewResult(data);
                }}
                showLabel={false}
                showError={false}
                multiLine={true}
                placeholder={t('Message')}
                style={styles.messageInput}
                contentStyle={{
                  marginTop: Platform.OS === 'ios' ? 8 : 0, // Apply marginTop only for iOS
                  paddingRight: 32,
                  textAlignVertical: 'center',
                  marginBottom: 2,
                }}
                height={50}
                maxLines={4}
                hidePreview={false}
              />
              <Tap
                onPress={() => {
                  if (mediaList.length > 0) {
                    handleSendDataBack();
                  }
                }}
                style={styles.sendIconTap}
              >
                <View style={styles.sendIconLay}>
                  <CustomImage
                    source={Images.send}
                    type={ImageType.svg}
                    color={theme.colors.surface}
                    style={styles.send}
                  />
                </View>
              </Tap>
            </View>
            <CustomText
              color={theme.colors.primary}
              variant={TextVariants.bodyLarge}
              style={{
                backgroundColor: theme.colors.border,
                borderRadius: theme.roundness,
                alignSelf: 'flex-start',
                paddingHorizontal: 5,
                marginTop: 10,
                marginHorizontal: 3,
              }}
            >
              {route?.name}
            </CustomText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const screenHeight = Dimensions.get('window').height;

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    imageLay: {
      width: '100%',
      height: screenHeight,
      paddingTop: 60,
      paddingBottom: 200,
    },
    backBtnLay: {
      padding: 8,
      backgroundColor: theme.colors.backdrop,
      borderRadius: 50,
    },
    cropBtnLay: {
      position: 'absolute',
      alignSelf: 'flex-end',
      gap: 10,
      padding: 10,
      flexDirection: 'row',
    },
    backBtn: {
      height: 25,
      width: 25,
    },
    pdf: {
      height: '100%',
      width: '100%',
    },
    send: {
      height: 22,
      width: 22,
    },
    sendIconTap: {
      position: 'absolute',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.extraRoundness,
      right: 5,
      bottom: 7, // Apply marginTop only for iOS
      alignSelf: 'flex-end',
      height: 35,
      width: 35,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    sendIconLay: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageInput: {
      width: '100%',
    },
    inputLay: {
      position: 'absolute',
      bottom: 10,
      left: 0,
      right: 0,
      marginHorizontal: 10,
    },
  });

export default ChatImageUpload;
