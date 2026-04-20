import { CustomImage, Tap } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { CustomCarousel, CustomFullScreenPopup } from '@/components/molecules';
import PdfPreview from '@/components/molecules/pdfPreview/pdfPreview';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useCustomInAppBrowser } from '@/utils/utils';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, Platform, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

// options for component
export type ImagePopupProps = {
  imageList?: string[];
  iframe?: string;
  defaultIndex?: number;
  pdfUrl?: string;
  onClose?: () => void;
};

export let showImagePopup: (props: ImagePopupProps) => void;
export let hideImagePopup: () => void;

function ImagePopup() {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [popupProps, setPopupProps] = useState<ImagePopupProps>({});

  const [showPopup, setShowPopup] = useState(false); // show global popup

  const ref = useRef<FlatList>(null);

  const [selectedIndex, setSelectedIndex] = useState(0); // show global popup

  const [iframeString, setIframeString] = useState(''); // show global popup

  const openInAppBrowser = useCustomInAppBrowser();

  useEffect(() => {
    showImagePopup = (props: ImagePopupProps) => {
      setPopupProps(props);
      if (props.imageList) {
        setSelectedIndex(props.defaultIndex ?? 0);
        setTimeout(() => {
          ref.current?.scrollToIndex({ index: props.defaultIndex ?? 0 });
        }, 200);
      }

      if (props.iframe) {
        const ifr = props.iframe!.replace(
          '<iframe',
          Platform.OS == 'android'
            ? '<iframe style="transform: scale(2.2); transform-origin: 0 0;"'
            : '<iframe style="transform: scale(2.0); transform-origin: 0 0;"',
        );
        setIframeString(ifr);
      }

      setShowPopup(true);
    };

    hideImagePopup = () => {
      setShowPopup(false);
    };
  }, []);

  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  return (
    <>
      <CustomFullScreenPopup shown={showPopup} setShown={setShowPopup}>
        <View style={styles.main}>
          {popupProps.imageList ? (
            <View style={styles.container}>
              <CustomCarousel
                data={popupProps.imageList}
                defaultIndex={selectedIndex}
                showDotIndicator={false}
                height={height}
                width={width}
                style={styles.container}
                onProgress={index => {
                  setSelectedIndex(index);
                  ref.current?.scrollToIndex({ index: index });
                }}
                children={(mediaItem, index) => (
                  <ImageZoom uri={mediaItem} style={styles.mainImg} />
                )}
              />
              {popupProps.imageList.length > 1 && (
                <FlatList
                  ref={ref}
                  data={popupProps.imageList}
                  style={styles.thumbnailImg}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <Tap
                      style={
                        index == selectedIndex
                          ? styles.selectedImgLay
                          : styles.imgLay
                      }
                      onPress={() => {
                        setSelectedIndex(index);
                      }}
                    >
                      <CustomImage
                        source={{ uri: item }}
                        resizeMode={ResizeModeType.cover}
                        style={styles.img}
                      />
                    </Tap>
                  )}
                  getItemLayout={(data, index) => ({
                    length: 80, // Fixed item height
                    offset: 80 * index, // Offset based on the item index
                    index,
                  })}
                />
              )}
            </View>
          ) : popupProps.iframe ? (
            <WebView
              scalesPageToFit={true}
              bounces={false}
              style={styles.webView}
              automaticallyAdjustContentInsets={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo={true}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              source={{
                html: iframeString,
                headers: {
                  Referer: `http://${
                    Platform.OS == 'android'
                      ? TenantInfo.PackageName
                      : TenantInfo.BundleId
                  }`,
                },
                baseUrl: `http://${
                  Platform.OS == 'android'
                    ? TenantInfo.PackageName
                    : TenantInfo.BundleId
                }`,
              }}
              onShouldStartLoadWithRequest={request => {
                openInAppBrowser(request.url);

                return true;
              }}
            />
          ) : popupProps.pdfUrl ? (
            <PdfPreview
              pdfUrl={popupProps.pdfUrl}
              openLinks={openInAppBrowser}
              defaultIndex={popupProps.defaultIndex}
              enablePaging
              style={styles.pdf}
            />
          ) : (
            <></>
          )}
          <Tap
            style={styles.backBtnLay}
            onPress={() => {
              setShowPopup(false);
              popupProps.onClose?.();
            }}
          >
            <CustomImage
              source={Images.close}
              type={ImageType.svg}
              color={theme.colors.onSurfaceVariant}
              style={styles.backBtn}
            />
          </Tap>
        </View>
      </CustomFullScreenPopup>
    </>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flex: 1,
    },
    backBtnLay: { padding: 10, position: 'absolute', right: 0 },
    backBtn: {
      height: 40,
      width: 40,
    },
    mainImg: {
      width: '100%',
      height: '100%',
    },
    thumbnailImg: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    selectedImgLay: {
      padding: 3,
      margin: 5,
      borderRadius: theme.roundness,
      borderWidth: 4,
      borderColor: theme.colors.outline,
      justifyContent: 'center',
    },
    imgLay: {
      margin: 5,
      justifyContent: 'center',
    },
    img: {
      height: 80,
      width: 80,
      borderRadius: theme.roundness,
    },
    webView: {
      flex: 1,
      height: 250,
      marginTop: 70,
      backgroundColor: theme.colors.surface,
    },
    pdf: {
      height: '100%',
      width: '100%',
    },
  });

export default ImagePopup;
