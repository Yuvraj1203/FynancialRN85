import { CustomText, HtmlRender } from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader } from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import {
  HtmlContentModel,
  processHtmlContent,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

export type CustomNotificationProps = {
  NotificationHeader?: string;
  NotificationContent?: string;
};

function CustomNotification() {
  /**  Added by @Yuvraj 08-04-2025 ---> navigate to different screen (FYN-6456) */
  const navigation = useAppNavigation();

  /**  Added by @Yuvraj 08-04-2025 ---> get params from parent screen (FYN-6456) */
  const route = useAppRoute('CustomNotification')?.params;

  /**  Added by @Yuvraj 08-04-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Yuvraj 08-04-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 27-02-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  const [parseMessageHtml, setParseMessageHtml] = useState<HtmlContentModel>();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  useEffect(() => {
    hideLoader();

    let parseHtml = processHtmlContent({
      html: route?.NotificationContent,
      linkColor: theme.colors.links,
    });
    if (parseHtml) {
      setParseMessageHtml(parseHtml);
    }
  }, [route?.NotificationContent]);

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader showBack />
        <CustomText
          variant={TextVariants.titleLarge}
          color={theme.colors.primary}
          style={styles.header}
        >
          {route?.NotificationHeader ? route?.NotificationHeader : ''}
        </CustomText>

        <ScrollView style={styles.scrollLay}>
          <View style={styles.bodyContent}>
            <HtmlRender
              html={parseMessageHtml ? parseMessageHtml.Content : ''}
              fontSize={theme.fonts.titleSmall.fontSize}
              openLinks={openInAppBrowser}
              iFrameList={parseMessageHtml ? parseMessageHtml.iFrameList : []}
              handleIframeClick={iframe => {
                showImagePopup({ iframe });
              }}
            />
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    header: {
      textAlign: 'center',
      marginTop: 30,
    },
    scrollLay: { marginTop: 10 },
    bodyContent: {
      paddingHorizontal: 20,
    },
  });

export default CustomNotification;
