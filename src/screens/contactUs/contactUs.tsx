import {
  CustomImage,
  CustomText,
  HtmlRender,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { CustomHeader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { tenantDetailStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  handleOpenDialer,
  openUrl,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Added by @Shivang 10-02-2025 ->  ContactUs Component Function (FYN-4279)
 */
function ContactUs() {
  /**
   * Added by @Shivang 10-02-2025 ->   Get the theme using useTheme hook (FYN-4279)
   */
  const theme = useTheme();

  /**
   * Added by @Shivang 10-02-2025 ->  Generate styles dynamically based on the theme (FYN-4279)
   */
  const styles = makeStyles(theme);

  /**
   * Added by @Shivang 10-02-2025 ->  Translation hook for multi-language support (FYN-4279)
   */
  const { t } = useTranslation();

  /**
   * Added by @Shivang 10-02-2025 ->  State to manage loading state for skeleton (FYN-4279)
   */

  const [loading, setLoading] = useState<boolean>(false);

  /** Added by @Tarun 05-02-2025 -> tenant details store (FYN-4279) */
  const tenantDetail = tenantDetailStore(state => state.tenantDetails);

  /**
   * Added by @Shivang 10-02-2025 -> Initialize in-app browser instance (FYN-4279)
   */
  const openInAppBrowser = useCustomInAppBrowser();

  /**
   * Added by @Shivang 10-02-2025 -> State to store contact us data fetched from API
 (FYN-4279)
   */
  const [contactUsData, setContactUsData] = useState<ContactUsModel[]>();

  const userDetails = userStore(state => state.userDetails);

  /**
   * Added by @Shivang 10-02-2025 ->  useEffect to trigger API call on component mount (FYN-4279)
   */
  useEffect(() => {
    /**
     * Added by @Shivang 10-02-2025 ->  Call contact us API to get tenant contact us details (FYN-4279)
     */
    if (userDetails) {
      contactUsApi.mutate({
        TenantId: tenantDetail?.tenantId,
      });
    }
  }, []);

  /**
   * Added by @Shivang 10-02-2025 ->  Contact Us API call to get tenant contact data (FYN-4279)
   */
  const contactUsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<ContactUsModel[]>({
        endpoint: ApiConstants.ContactUS,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      /**
       * Added by @Shivang 10-02-2025 ->  Set loading state before API call (FYN-4279)
       */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**
       * Added by @Shivang 10-02-2025 ->  Reset loading state after API call (FYN-4279)
       */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      /**
       * Added by @Shivang 10-02-2025 ->  Success Response - Store contact us data in state (FYN-4279)
       */
      if (data.result && data.result.length > 0) {
        const newList = data.result.map(element => {
          /**
           * Added by @Tarun 13-02-2025 -> Convert html to valid format and filter iframes from it (FYN-4279)
           */
          const processedContent = processHtmlContent({
            html: element.value,
            maxWords: 50,
            linkColor: theme.colors.links,
          });

          /**
           * Added by @Tarun 13-02-2025 -> Return a new object with the processed
           * content and the rest of the element properties (FYN-4279)
           */
          return {
            ...element,
            value:
              element.type == 'W'
                ? processedContent?.Content
                : `<a>${processedContent?.Content}</a>`, // Add processed content to the element
            iFrameList: processedContent?.iFrameList,
            imgSource:
              element.type == 'M'
                ? Images.email
                : element.type == 'P'
                ? Images.contactUs
                : Images.globe,
          };
        });

        setContactUsData(newList);
      }
    },
    onError(error, variables, context) {
      /**
       * Added by @Shivang 10-02-2025 ->  Error Response - Show error message (FYN-4279)
       */
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by @Shivang 10-02-2025 ->  Handle click on a contact us item (FYN-4279)
   */
  const handleClick = (item: ContactUsModel) => {
    if (item.type == 'M') {
      /**
       * Added by @Shivang 10-02-2025 ->  Open mail app to send email to the tenant's
       * contact email (FYN-4279)
       */

      openUrl('mailto:' + item.value);
    }
    if (item.type == 'P') {
      /**
       * Added by @Shivang 10-02-2025 ->  Open phone app to call the tenant's
       * contact number (FYN-4279)
       */
      handleOpenDialer(item.value);
    }
    if (item.value == 'W') {
      /**
       * Added by @Shivang 10-02-2025 ->  Open URL in in-app browser (FYN-4279)
       */
      if (item.link) {
        openInAppBrowser(decodeURIComponent(item.link));
      }
    }
  };

  return (
    <SafeScreen>
      <View>
        <CustomHeader showBack title={t('Contactus')} />

        <View style={styles.main}>
          {loading ? (
            <Skeleton>
              <View style={styles.skeletonLay}>
                <View style={styles.skeletonHeading} />

                {[...Array(2).keys()].map((_, index) => (
                  <View key={index} style={styles.skeletonDesc} />
                ))}
              </View>
            </Skeleton>
          ) : (
            <View>
              <CustomImage
                source={Images.contactUsBg}
                type={ImageType.svg}
                style={styles.bg}
              />
              {contactUsData ? (
                contactUsData.map((item, index) => (
                  <Tap
                    key={`contactUs${index}`}
                    onPress={() => handleClick(item)}
                  >
                    <View style={styles.contactUsItem}>
                      <CustomImage
                        source={item.imgSource}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.contactUsItemIcon}
                      />
                      <HtmlRender
                        html={item.value}
                        style={styles.contactUsItemValue}
                        openLinks={openInAppBrowser}
                        iFrameList={item?.iFrameList}
                        handleIframeClick={iframeString => {
                          showImagePopup({ iframe: iframeString });
                        }}
                      />
                    </View>
                  </Tap>
                ))
              ) : (
                <CustomText style={styles.emptyView}>
                  {t('NoContactDetails')}
                </CustomText>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

/**
 * Added by @Shivang 10-02-2025 ->  Function to generate styles dynamically
 * based on the theme (FYN-4279)
 */
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    bg: {
      height: 215,
      width: '100%',
    },
    main: {
      marginHorizontal: 15,
    },
    skeletonLay: {
      width: '100%',
      paddingHorizontal: 15,
    },
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 30,
      borderRadius: theme.roundness,
      marginTop: 20,
      marginBottom: 30,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 15,
      borderRadius: theme.lightRoundness,
      marginTop: 15,
    },
    contactUsItem: {
      flexDirection: 'row',
      marginTop: 20,
      alignItems: 'center',
    },
    contactUsItemValue: {
      padding: 10,
    },
    contactUsItemIcon: {
      height: 20,
      width: 20,
    },
    emptyView: {
      marginTop: 50,
      alignSelf: 'center',
    },
  });

export default ContactUs;
