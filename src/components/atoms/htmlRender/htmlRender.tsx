import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { getVideoThumbnail } from '@/utils/utils';
import { iframeModel, useHtmlIframeProps } from '@native-html/iframe-plugin';
import React, { memo, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import RenderHTML, {
  HTMLContentModel,
  HTMLElementModel,
  defaultHTMLElementModels,
  useInternalRenderer,
} from 'react-native-render-html';
import WebView from 'react-native-webview';
import CustomImage from '../customImage/customImage';
import CustomText, { TextVariants } from '../customText/customText';
import Tap from '../tap/tap';

// options for component
type Props = {
  html?: string;
  openLinks?: (url: string) => void;
  handleIframeClick?: (iframeHtml: string) => void;
  iFrameList?: string[];
  iFrameThumbnailList?: { iframe: string; thumbnail?: string }[];
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  isMetaData?: boolean;
  allowCopy?: boolean;
  enableSelection?: boolean;
  compact?: boolean;
};

function HtmlRender({
  allowCopy = false,
  enableSelection = true,
  ...props
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { width } = useWindowDimensions();
  const MemoizedRenderHtml = memo(RenderHTML);
  const injectedJS = `
  (function() {
    var style = document.createElement('style');
    style.innerHTML = \`
      video {
        -webkit-playsinline: true !important;
        playsinline: true !important;
        width: 100% !important;
        height: auto !important;
      }
    \`;
    document.head.appendChild(style);

    function setPlaysInline() {
      var videos = document.querySelectorAll('video');
      videos.forEach(function(video) {
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('controls', '');
      });
    }
    setPlaysInline();

    var observer = new MutationObserver(setPlaysInline);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

  const findIFrame = (uri?: string) => {
    if (uri) {
      const iframeString = props.iFrameList?.find(item => item.includes(uri));

      if (iframeString) {
        props.handleIframeClick?.(iframeString);
      } else {
        props.openLinks?.(uri);
      }
    }
  };

  const getModifiedSrc = (url: string | undefined) => {
    if (!url) return url;

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.hostname.includes('youtube.com') ||
        parsedUrl.hostname.includes('youtu.be')
      ) {
        // Add or update fs=0 & playsinline=1
        parsedUrl.searchParams.set('fs', '0');
        parsedUrl.searchParams.set('playsinline', '1');
        return parsedUrl.toString();
      }

      if (parsedUrl.hostname.includes('vimeo.com')) {
        // Set fullscreen=0 to disable fullscreen button
        parsedUrl.searchParams.set('fullscreen', '0');

        // Optional: hide title, byline, and portrait for a cleaner player
        parsedUrl.searchParams.set('title', '0');
        parsedUrl.searchParams.set('byline', '0');
        parsedUrl.searchParams.set('portrait', '0');

        // Optional: if you want to hide all controls (including play/pause), set controls=0
        parsedUrl.searchParams.set('controls', '1');

        return parsedUrl.toString();
      }
      return url;
    } catch (e) {
      return url; // fallback if URL parsing fails
    }
  };

  const normalizePostHtml = (html: string) => {
    if (!html) return '';

    let out = html;

    // Normalize all <br> variants
    out = out.replace(/<br\s*\/?>/gi, '<br/>');

    // Empty line blocks like <div><br/></div> or <p><br/></p>
    // Treat as ONE blank line => <br/><br/>
    out = out.replace(
      /<\s*(div|p)(?:\s+[^>]*)?>\s*(<br\/>\s*)<\/\s*\1\s*>/gi,
      '<br/><br/>',
    );

    // Treat every block start as a new line (handles nested <div> too)
    out = out.replace(/<\s*(div|p)(?:\s+[^>]*)?>/gi, '<br/>');
    out = out.replace(/<\/\s*(div|p)\s*>/gi, '');

    // If plain newline exists in string, convert it too
    out = out.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    out = out.replace(/\n{2,}/g, '<br/><br/>'); // multiple newlines => one blank line
    out = out.replace(/\n/g, '<br/>'); // single newline => single break

    // Collapse MANY breaks into max 2 breaks (one blank line)
    out = out.replace(/(?:<br\/>\s*){3,}/gi, '<br/><br/>');

    // Trim leading / trailing breaks (clean UI)
    out = out.replace(/^(?:\s*<br\/>\s*)+/i, '');
    out = out.replace(/(?:\s*<br\/>\s*)+$/i, '');

    return out;
  };

  //
  // —— IframeRenderer with fullscreen support ——
  //
  const IframeRenderer = function IframeRenderer(propsIframe: any) {
    const iframeProps = useHtmlIframeProps(propsIframe);
    const { source, ...otherWebViewProps } = iframeProps;
    const src = getModifiedSrc(source?.uri);
    // three-stage thumbnail → confirm → playing
    //const isYouTube = src?.includes('youtube.com') || src?.includes('youtu.be');
    // const [stage, setStage] = useState<'idle' | 'confirm' | 'playing'>(
    //   isYouTube ? 'playing' : 'confirm',
    // );
    const [stage, setStage] = useState<'idle' | 'confirm' | 'playing'>(
      'playing',
    );
    // fullscreen toggle
    const [isFullScreen, setIsFullScreen] = useState(false);

    // 1) If we're in "playing" stage, show inline WebView + fullscreen button
    if (stage === 'playing' && src) {
      return (
        <>
          <View style={styles.webviewContainer}>
            {Platform.OS === 'ios' ? (
              <WebView
                {...otherWebViewProps}
                source={{
                  uri: src,
                  headers: {
                    Referer: `http://${TenantInfo.BundleId}`,
                  },
                }}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                injectedJavaScriptBeforeContentLoaded={injectedJS} // use this instead on iOS
                style={styles.webview}
              />
            ) : (
              <WebView
                {...otherWebViewProps}
                source={{
                  uri: src,
                  headers: {
                    Referer: `http://${TenantInfo.PackageName}`,
                  },
                }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                style={styles.webview}
              />
            )}

            {/* custom fullscreen button overlay */}
            {/* <Tap
              style={styles.fullscreenBtn}
              onPress={() => setIsFullScreen(true)}>
              <CustomImage
                source={Images.addCircle}
                style={styles.fullscreenIcon}
              />
            </Tap> */}
          </View>

          {/* Modal for true fullscreen playback */}
          {/* <Modal
            visible={isFullScreen}
            onRequestClose={() => setIsFullScreen(false)}
            supportedOrientations={[
              'portrait',
              'portrait-upside-down',
              'landscape',
              'landscape-left',
              'landscape-right',
            ]}
            animationType="slide">
            <View style={styles.modalContainer}>
              <WebView
                {...otherWebViewProps}
                source={{uri: src}}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo
                style={styles.modalWebview}
              />
              <Tap
                style={styles.closeBtn}
                onPress={() => setIsFullScreen(false)}>
                <CustomImage source={Images.close} style={styles.closeIcon} />
              </Tap>
            </View>
          </Modal> */}
        </>
      );
    }

    // 2) Otherwise, show either the idle thumbnail or the confirm thumbnail
    const idleThumb =
      props.iFrameThumbnailList?.find(item => item.iframe.includes(src ?? ''))
        ?.thumbnail || getVideoThumbnail(src!);
    const confirmThumb = getVideoThumbnail(src!);

    const thumbToShow = stage === 'idle' ? idleThumb : confirmThumb;
    const nextStage = stage === 'idle' ? 'confirm' : 'playing';

    return (
      <Tap onPress={() => setStage(nextStage)}>
        <View>
          <CustomImage source={{ uri: thumbToShow }} style={styles.iframeImg} />
          <View style={styles.iframePlayBtnLay}>
            <CustomImage
              source={Images.play}
              color={theme.colors.error}
              style={styles.iframePlayBtn}
            />
          </View>
        </View>
      </Tap>
    );
  };
  // —— end IframeRenderer ——

  const getTextFromTNode = (tnode: any): string => {
    if (!tnode) return '';

    if (tnode.type === 'text') {
      return tnode.data || '';
    }

    if (tnode.children) {
      return tnode.children.map(getTextFromTNode).join('');
    }

    return '';
  };

  const TagRenderer = ({ tnode }: any) => {
    const text = getTextFromTNode(tnode).trim();

    return (
      <CustomText variant={TextVariants.labelLarge}>
        <CustomText color={theme.colors.primary} style={styles.tagRenderText}>
          {text}
        </CustomText>
      </CustomText>
    );
  };

  function IframeImageRenderer(props: any) {
    const { Renderer, rendererProps } = useInternalRenderer('img', props);
    const alt = rendererProps.alt;

    return (
      <View style={styles.imageMain}>
        <Renderer {...rendererProps} />
        {alt?.includes('Iframe content') && (
          <View style={styles.iframePlayBtnLay}>
            <CustomImage
              source={Images.play}
              color={theme.colors.error}
              style={styles.iframePlayBtn}
            />
          </View>
        )}
      </View>
    );
  }

  const renderers = {
    iframe: IframeRenderer,
    tag: TagRenderer, // ✅ add this

    // img: memo(IframeImageRenderer),
  };

  const customHTMLElementModels = {
    iframe: iframeModel,
    img: defaultHTMLElementModels.img.extend({
      contentModel: HTMLContentModel.mixed,
    }),
    font: HTMLElementModel.fromCustomModel({
      tagName: 'font',
      contentModel: HTMLContentModel.block,
    }),
    input: HTMLElementModel.fromCustomModel({
      tagName: 'input',
      contentModel: HTMLContentModel.block,
    }),
    tag: HTMLElementModel.fromCustomModel({
      tagName: 'tag',
      contentModel: HTMLContentModel.mixed, // ❗ textual nahi
    }),
    'light-value-text': HTMLElementModel.fromCustomModel({
      tagName: 'light-value-text',
      contentModel: HTMLContentModel.mixed, // because inside can be <p>, <b>, <a> etc
    }),
  };

  return (
    <View style={[styles.container, props.style]}>
      <MemoizedRenderHtml
        renderers={renderers}
        WebView={WebView}
        contentWidth={width - 20}
        customHTMLElementModels={customHTMLElementModels}
        tagsStyles={{
          body: {
            color: theme.colors.onSurfaceVariant,
            fontSize: props.fontSize ?? theme.fonts.bodyMedium.fontSize,
            ...(props.compact
              ? {
                  p: {
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                  div: {
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                  br: {
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                }
              : {}),
          },

          a: {
            color: theme.colors.links,
            //textDecorationLine: 'underline',
          },
          b: {
            fontWeight: 'bold',
          },
          i: {
            fontStyle: 'italic',
          },
          h1: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.displayLarge.fontSize,
            fontWeight: 'bold',
          },
          h2: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.headlineLarge.fontSize,
            fontWeight: 'bold',
          },
          h3: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.titleLarge.fontSize,
            fontWeight: 'bold',
          },
          h4: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.titleMedium.fontSize,
            fontWeight: 'bold',
          },
          h5: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.bodyLarge.fontSize,
            fontWeight: 'bold',
          },
          h6: {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fonts.labelMedium.fontSize,
            fontWeight: 'bold',
          },
          'light-value-text': {
            color: theme.colors.outline,
            fontSize: TextVariants.bodyMedium,
          },

          img: {
            width: props.isMetaData ? '72%' : '100%', // if there is meta data link its image has to be small for commentitem purpose
            marginTop: props.isMetaData ? 10 : 0,
            objectFit: 'contain',
          },
        }}
        renderersProps={{
          iframe: {
            scalesPageToFit: true,
            webViewProps: {
              allowsInlineMediaPlayback: false,
              mediaPlaybackRequiresUserAction: false,
              automaticallyAdjustContentInsets: false,
              allowsFullscreenVideo: true,
              startInLoadingState: false,
              javaScriptEnabled: true,
              domStorageEnabled: true,
            },
          },
          a: {
            onPress: (_, href) => {
              if (!href) return;

              // ✅ 1. Internal app actions (DO NOT open browser)
              if (
                href === 'action://toggle-content' ||
                href.startsWith('id://')
              ) {
                props.openLinks?.(href);
                return;
              }

              // ✅ 2. Iframe / media handling (existing behavior)
              const iframeMatch = props.iFrameList?.find(item =>
                item.includes(href),
              );

              if (iframeMatch) {
                props.handleIframeClick?.(iframeMatch);
                return;
              }

              // ✅ 3. Normal links (https, mailto, etc.)
              props.openLinks?.(href);
            },
          },
          img: {
            enableExperimentalPercentWidth: true, // let % be interpreted correctly
          },
        }}
        defaultTextProps={{
          selectable: allowCopy ? enableSelection : false,
          allowFontScaling: false, // 👈 ADD THIS
        }}
        source={{
          html: props.compact
            ? normalizePostHtml(props.html ?? '')
            : props.html ?? '',
        }}
      />
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      overflow: 'scroll',
    },
    iframeDisablePress: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    iframeImg: {
      height: 300,
      width: '100%',
      borderRadius: theme.roundness,
    },
    iframePlayBtnLay: {
      position: 'absolute',
      height: '100%',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iframePlayBtn: {
      height: 70,
      width: 70,
    },
    imageMain: {
      alignItems: 'center',
      justifyContent: 'center',
      alignContent: 'center',
    },
    // inline player
    webviewContainer: {
      height: 300,
      width: '100%',
      borderRadius: theme.roundness,
      overflow: 'hidden',
    },
    webview: {
      flex: 1,
    },
    // fullscreen toggle button (overlay)
    fullscreenBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    fullscreenIcon: {
      width: 24,
      height: 24,
      tintColor: theme.colors.onSurface,
    },
    // modal container
    modalContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    modalWebview: {
      flex: 1,
    },
    closeBtn: {
      position: 'absolute',
      top: 40,
      right: 20,
    },
    closeIcon: {
      width: 32,
      height: 32,
      tintColor: '#fff',
    },
    tagRenderText: {
      textDecorationLine: 'underline',
      fontWeight: 'bold',
    },
  });

export default memo(HtmlRender);
