import { CustomHeader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { TenantInfo } from '@/tenantInfo';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import {
  HtmlContentReturnType,
  processHtmlContent,
  useCustomInAppBrowser,
} from '@/utils/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

export type HtmlRenderScreenProps = {
  title?: string;
  html?: string;
  iFrameList?: string[];
  htmlContent?: string;
};

function HtmlRenderScreen() {
  const navigation = useAppNavigation(); // Navigation hook

  const route = useAppRoute('HtmlRenderScreen'); // for getting params coming from parent

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const [htmlContent, setHtmlContent] = useState<HtmlContentReturnType>();

  useEffect(() => {
    setHtmlContent(
      processHtmlContent({
        html: route.params?.html,
        maxWords: 50,
        linkColor: theme.colors.links,
      }),
    );
  }, []);

  /**
   * Added by @Akshita 25-04-25 ---> to handle the height and widht of the iframe videos and html content
   *  according to the device H and W */

  const modifyIframeStyles = (html?: string): string => {
    if (!html) return '';

    // This CSS makes iframe responsive
    const styleTag = `
    <style>
      iframe {
        width: 100% !important;
        height: auto !important;
        aspect-ratio: 16/9;
        max-width: 100%;
        border: none;

      }
    </style>
  `;

    // Inject style tag into HTML
    if (html.includes('</head>')) {
      return html.replace('</head>', `${styleTag}</head>`);
    } else {
      return `${styleTag}${html}`;
    }
  };

  const wrapHtml = (html: string) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body {
          background-color: ${theme.colors.surface};
          font-size: 16px;
          margin: 0;
          padding: 10px;
        }
        iframe {
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 16/9;
          max-width: 100%;
          border: none;
        }
      </style>
    </head>
    <body>${html}</body>
  </html>
`;

  const modifiedHtml = modifyIframeStyles(htmlContent?.Content);

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack title={route.params?.title} />
        <View style={styles.main}>
          {/* <HtmlRender
            html={htmlContent?.Content}
            iFrameList={htmlContent?.iFrameList}
            openLinks={openInAppBrowser}
            style={styles.webViewContainer}
            handleIframeClick={iframeString => {
              Log('url=>' + iframeString);
              showImagePopup({iframe: iframeString});
            }}
          /> */}
          <WebView
            scalesPageToFit
            originWhitelist={['*']}
            source={{
              html: wrapHtml(modifiedHtml) || '',
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
            style={styles.webViewContainer}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            automaticallyAdjustContentInsets={false}
            // onShouldStartLoadWithRequest={request => {
            //   const url = request.url;

            //   // If you want to open external links in InAppBrowser instead
            //   if (!url.startsWith('data:') && !url.includes('about:blank')) {
            //     openInAppBrowser(url);
            //     return false; // prevent WebView from navigating
            //   }

            //   return true;
            // }}
          />
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    webViewContainer: {
      backgroundColor: theme.colors.surface,
    },
  });

export default HtmlRenderScreen;
