import {
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomActionSheetPoup } from '@/components/molecules';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  FeaturedItems,
  GetUserContentForDashboardModel,
} from '@/services/models';
import { templateStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
  ShareDocumentFile,
} from '@/utils/fileDownloadUtils';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  handleShare,
  normalizeUrl,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { ActivityIndicator } from 'react-native-paper';

type Props = {
  loading?: boolean;
  refreshProp?: boolean;
};

function Featured(props: Props) {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  const userDetails = userStore();

  const templateData = templateStore();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const [resourceLoading, setResourceLoading] = useState(true); // for featured resource

  const [featuredData, setFeaturedData] =
    useState<GetUserContentForDashboardModel>();

  // added by @Yuvraj 06-02-2025 --> state for featured tiles data (#4063)
  const [featuredDataItems, setFeaturedDataItems] = useState<FeaturedItems[]>(
    [],
  );

  const [isDownloading, setIsDownloading] = useState(false); // show report popup

  // added by  @Akshita 21-04-2025 --> state to store the selected dashboard feature item (#4062)
  const [SelectedFeaturedItem, setSelectedFeaturedItem] =
    useState<FeaturedItems>();

  // added by  @Akshita 21-04-2025 --> to open the action sheet pop up on longpress (#4062)
  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup

  useEffect(() => {
    if (
      templateData.templateList &&
      templateData.templateList.length > 0 &&
      userDetails.userDetails &&
      props.refreshProp
    ) {
      //to get featured resources
      getfeaturedresourceforcontactdashboardApi.mutate({
        ProgramSessionId: templateData?.selectedTemplate?.programSessionID,
        FromAppDashboard: true,
        CallPoint: 'app',
        PageNumber: 1,
      });
    } else {
      setResourceLoading(false);
    }
  }, [templateData.selectedTemplate, props.refreshProp]);

  useEffect(() => {
    if (props.loading) {
      setResourceLoading(true);
    }
  }, [props.loading]);

  const handleLongPress = (itemData: FeaturedItems) => {
    setSelectedFeaturedItem(itemData); // ✅ Store the selected item
    if (itemData.contentType != 'H') {
      if (itemData.contentType != 'E') {
        setShowActionPopup(true); // ✅ Show action sheet with available options
      }
    }
  };

  const handleSelectedActionItem = (
    ActionParam: string,
    itemData?: FeaturedItems,
  ) => {
    const doc = itemData ? itemData : SelectedFeaturedItem;
    if (!doc) return;

    const finish = (fileUri?: string) => {
      setIsDownloading(false);
      setFeaturedDataItems(prev =>
        prev?.map(item => {
          if (doc && item.documentId == doc?.documentId) {
            return { ...item, progress: undefined };
          } else {
            return item;
          }
        }),
      );
      if (!fileUri) {
        showSnackbar(t('SomeErrorOccured'), 'danger');
      }
    };

    const setDocumentLoading = () => {
      setIsDownloading(true);
      setFeaturedDataItems(prev =>
        prev?.map(item => {
          if (doc && item.documentId == doc?.documentId) {
            return { ...item, progress: '1' };
          } else {
            return item;
          }
        }),
      );
    };
    if (ActionParam === 'Download') {
      setShowActionPopup(false);
      setDocumentLoading();
      DownloadDocumentFile({
        fileUrl: doc?.contentURL!,
        fileExtension: doc?.contentExtension!,
        fileName: doc?.contentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam === 'Open') {
      setShowActionPopup(false);
      if (doc.contentType == 'H' || doc.contentType == 'E') {
        const data = processHtmlContent({
          html: doc.contentURL,
          maxWords: 50,
          linkColor: theme.colors.links,
        });
        navigation.navigate('HtmlRenderScreen', {
          title: doc.contentName,
          html: data?.Content,
          iFrameList: data?.iFrameList,
          htmlContent: doc.contentURL,
        });
        return;
      } else if (doc.contentType == 'L') {
        return openInAppBrowser(normalizeUrl(doc.contentURL!));
      }
      setDocumentLoading();
      OpenDocumentFile({
        fileUrl: doc?.contentURL!,
        fileExtension: doc?.contentExtension!,
        fileName: doc?.contentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam == 'Share') {
      setShowActionPopup(false);

      if (doc?.contentType != 'L') {
        setDocumentLoading();
        ShareDocumentFile({
          fileUrl: doc?.contentURL!,
          fileExtension: doc?.contentExtension!,
          fileName: doc?.contentName!,

          onDownloadComplete(fileUri, filetype) {
            finish(fileUri);
          },
        });
      } else {
        handleShare({ message: doc.contentURL });
      }
    } else if (ActionParam == 'Cancel') {
      setShowActionPopup(false);
      setSelectedFeaturedItem(undefined);
    }
  };

  /** Added by @Tarun 24-03-2025 -> Render reminder item using flash list (FYN-5971) */
  const renderFeaturedItem = (item: FeaturedItems) => {
    return (
      <Shadow
        tapStyle={styles.main}
        onPress={() => {
          !isDownloading && handleSelectedActionItem('Open', item);
        }}
        onLongPress={() => {
          !isDownloading && handleLongPress(item);
        }}
        style={styles.featuredImageContainer}
      >
        <CustomImage
          source={
            item.coverImageURL ? { uri: item.coverImageURL } : Images.errorImage
          }
          style={styles.featuredItemImage}
        />
        <View style={styles.wrapper}>
          <View style={styles.featuredItemWrapper}>
            <View style={styles.newsTag}>
              <CustomText variant={TextVariants.labelMedium}>
                {item.contentType === 'P'
                  ? t('PDF')
                  : item.contentType === 'I'
                  ? t('Image')
                  : item.contentType === 'D'
                  ? t('Document')
                  : item.contentType === 'E'
                  ? t('Video')
                  : item.contentType === 'L'
                  ? t('Link')
                  : item.contentExtension === '.mp4' ||
                    item.contentType === 'V' ||
                    item.contentExtension === '.MOV'
                  ? t('Video')
                  : item.contentType === 'X'
                  ? t('Excel')
                  : t('Attachment')}
              </CustomText>
            </View>
            {item.progress && (
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <ActivityIndicator size={20} />
              </View>
            )}
          </View>
          {item.contentType != 'H' && item.contentType != 'E' && (
            <Tap
              style={styles.iconBgMore}
              onPress={() => {
                !isDownloading && handleLongPress(item);
              }}
            >
              <CustomImage
                source={Images.more}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.moreIcon}
              />
            </Tap>
          )}
        </View>
      </Shadow>
    );
  };

  // added by @Yuvraj 06-02-2025 --> api call to get featured data (#4063)
  const getfeaturedresourceforcontactdashboardApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserContentForDashboardModel>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceFeaturedResource
            : ApiConstants.GetCommunityTemplateFeaturedResource,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setResourceLoading(true);
    },
    onSettled(data, error, variables, context) {
      setResourceLoading(false);
    },
    onSuccess(data, variables, context) {
      setFeaturedData(data.result);
      if (data.result && data?.result?.items) {
        setFeaturedDataItems(data?.result?.items);
      } else {
        setFeaturedDataItems([]);
      }
    },
    onError(error, variables, context) {
      setFeaturedData(undefined);
      setFeaturedDataItems([]);
    },
  });

  return (
    <View style={styles.container}>
      {featuredDataItems.length > 0 && (
        <Tap
          onPress={
            !!featuredData?.totalCount && featuredData?.totalCount > 4
              ? () =>
                  navigation.navigate('ResourceSubCategory', {
                    navigationFrom: 'Dashboard',
                  })
              : undefined
          }
          style={styles.featuredItemTap}
        >
          <View style={styles.featuredTitleContainer}>
            <CustomText variant={TextVariants.titleLarge}>
              {t('HomeFeatureContent')}
            </CustomText>
            {!!featuredData?.totalCount && featuredData?.totalCount > 4 && (
              <CustomText
                color={theme.colors.primary}
                variant={TextVariants.titleSmall}
              >
                {t('ViewAll')}
              </CustomText>
            )}
          </View>
        </Tap>
      )}

      {resourceLoading ? (
        <Skeleton>
          <View style={styles.skeletonContainer}>
            <View style={styles.sekeletonSubContainer}>
              <View style={styles.skeletonItem}>
                <View style={styles.skeletonImage}></View>
                <View style={styles.skeletonTitle}></View>
                <View style={styles.skeletonSubTitle}></View>
              </View>
              <View style={styles.skeletonItem}>
                <View style={styles.skeletonImage}></View>
                <View style={styles.skeletonTitle}></View>
                <View style={styles.skeletonSubTitle}></View>
              </View>
            </View>
            <View style={styles.sekeletonSubContainer}>
              <View style={styles.skeletonItem}>
                <View style={styles.skeletonImage}></View>
                <View style={styles.skeletonTitle}></View>
                <View style={styles.skeletonSubTitle}></View>
              </View>
              <View style={styles.skeletonItem}>
                <View style={styles.skeletonImage}></View>
                <View style={styles.skeletonTitle}></View>
                <View style={styles.skeletonSubTitle}></View>
              </View>
            </View>
          </View>
        </Skeleton>
      ) : (
        <CustomFlatList
          data={featuredDataItems}
          numColumns={DeviceInfo.isTablet() ? 4 : 2}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            featuredDataItems.length == 0 ? styles.featuredFlatList : undefined
          }
          renderItem={({ item }) => renderFeaturedItem(item)}
        />
      )}
      <CustomActionSheetPoup
        shown={showActionPopup}
        setShown={setShowActionPopup}
        hideIcons={false}
        centered={false}
        onCancelClick={() => handleSelectedActionItem('Cancel')}
        children={[
          {
            title: 'Open',
            image: Images.link, // Replace with your icon
            imageType: ImageType.svg,
            onPress: () => handleSelectedActionItem('Open'),
          },
          ...(SelectedFeaturedItem?.contentType != 'L'
            ? [
                {
                  title: 'Download',
                  image: Images.download, // Replace with your icon
                  imageType: ImageType.svg,
                  onPress: () => handleSelectedActionItem('Download'),
                },
              ]
            : []),
          {
            title: 'Share',
            image: Images.share, // Replace with your icon
            imageType: ImageType.svg,
            onPress: () => handleSelectedActionItem('Share'),
          },
        ]}
      />
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    container: {
      margin: 10,
      //minHeight: 250,
    },
    featuredItemTap: {
      padding: 0,
      paddingHorizontal: 5,
    },
    featuredTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
    },
    featuredFlatList: { flexGrow: 1, justifyContent: 'center' },
    featuredEmptyContainer: {
      height: 100,
    },
    featuredItemImage: {
      height: 150,
      width: '100%',
      borderRadius: theme.roundness,
    },
    featuredImageContainer: {
      flex: 1,
      padding: 10,
      marginVertical: 5,
      marginHorizontal: 7,
      gap: 10,
      marginBottom: 5,
    },
    featuredItemWrapper: {
      flexDirection: 'row',
      gap: 15,
    },
    wrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    newsTag: {
      paddingVertical: 2,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      alignSelf: 'flex-start',
    },
    skeletonContainer: {
      gap: 10,
      marginHorizontal: 10,
    },
    sekeletonSubContainer: {
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    skeletonItem: {
      width: '45%',
      borderWidth: 1,
      borderRadius: theme.roundness,
    },
    skeletonImage: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      height: 150,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      height: 15,
      margin: 10,
      marginBottom: 3,
      width: '70%',
    },
    skeletonSubTitle: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      height: 10,
      margin: 10,
      marginTop: 3,
      width: '40%',
    },
    moreIcon: {
      height: 17,
      width: 17,
    },
    iconBgMore: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      paddingVertical: 2,
      width: 25,
      padding: 0,
    },
  });

export default Featured;
