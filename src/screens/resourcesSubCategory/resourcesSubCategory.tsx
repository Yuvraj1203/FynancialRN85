import { CustomText, Shadow, SkeletonList, Tap } from '@/components/atoms';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  FeaturedItems,
  GetContentAllCollectionsAndFilesByProgSessionIdModel,
  GetFeaturedResourceForContactDashboardModel,
  GetResourceSubCategoryModel,
} from '@/services/models';
import { templateStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
  ShareDocumentFile,
} from '@/utils/fileDownloadUtils';
// import {downloadAndOpenFile} from '@/utils/fileDownloadUtils';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import {
  handleShare,
  isEmpty,
  normalizeUrl,
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
// import {CustomInAppBrowser, openUrl, showSnackbar} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

export type ResourceSubCategoryProp = {
  categoryId?: number;
  navigationFrom?: string;
  resourceCategoryID?: string;
};
/**
 * Added by @Shivang 10-02-2025 ->  ContactUs Component Function (FYN-4279)
 */

function ResourceSubCategory() {
  const navigation = useAppNavigation(); // navigation

  const route = useAppRoute('ResourceSubCategory'); // route
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

  const [page, setPage] = useState(1); // pagination page index

  const [hasMoreData, setHasMoreData] = useState<boolean>(false);
  // api loading true to stop multiple api calls
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const [filterList, setFilterList] = useState<GetResourceSubCategoryModel[]>(
    [],
  );

  const [selectedFilterItem, setSelectedFilterItem] =
    useState<GetResourceSubCategoryModel>();

  const [fileList, setFileList] = useState<FeaturedItems[]>([]);

  const [allFileList, setAllFileList] = useState<FeaturedItems[]>([]);

  const [search, setSearch] = useState<string>();

  const [SelectedFeaturedItem, setSelectedFeaturedItem] =
    useState<FeaturedItems>();

  const templateData = templateStore();

  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup

  const [isDownloading, setIsDownloading] = useState(false); // show report popup

  const userDetails = userStore(state => state.userDetails);
  /**
   * Added by @Shivang 10-02-2025 ->  useEffect to trigger API call on component mount (FYN-4279)
   */
  useEffect(() => {
    if (userDetails) {
      callRefresh();
    }
  }, []);

  const callRefresh = () => {
    if (route.params?.navigationFrom == 'Dashboard') {
      callGetFeaturedResourceForContactDashboardApi(1);
    } else {
      getListFromSubCategory();
      getResourceSubCategory.mutate(
        templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
          ? { ResourceCategoryId: route.params?.resourceCategoryID }
          : {
              SessionID: templateData?.selectedTemplate?.programSessionID,
              CategoryId: route.params?.categoryId,
            },
      );
    }
  };

  const callGetFeaturedResourceForContactDashboardApi = (PageNo: number) => {
    setPage(PageNo); // page index

    getFeaturedResourceForContactDashboardApi.mutate({
      ProgramSessionId: templateData?.selectedTemplate?.programSessionID,
      PageNumber: PageNo,
      CallPoint: 'app',
    });
  };

  //calling api as per sub categories
  const getListFromSubCategory = (subCategoryId?: string | number) => {
    getContentCollectionsByProgSessionIdApi.mutate(
      templateData.selectedTemplate?.programTypeID == 0 ||
        templateData.selectedTemplate?.programTypeID == undefined ||
        templateData.selectedTemplate?.programTypeID == null
        ? {
            ResourceCategoryId: route.params?.resourceCategoryID,
            ...(subCategoryId ? { ResourceSubCategoryId: subCategoryId } : {}),
          }
        : {
            SessionID: templateData?.selectedTemplate?.programSessionID,
            CategoryId: route.params?.categoryId,
            ...(subCategoryId ? { SubCategoryId: subCategoryId } : {}),
          },
    );
  };

  /**
   * Added by @Shivang 13-03-2025 -> Handle Long Press Action (FYN-5333)
   * This function is triggered when the user long-presses on a list item.
   * If the item is a PDF file, it sets the selected item and opens the action popup.
   */
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
      setFileList(prev =>
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
      setFileList(prev =>
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

  const searchFiles = (query?: string) => {
    setSearch(query);

    if (isEmpty(query)) {
      const newData: FeaturedItems[] = [...allFileList];
      setFileList(newData);
    } else {
      setFileList(
        allFileList.filter(item => {
          return (
            item.contentName
              ?.trim()
              ?.toLocaleLowerCase()
              .includes(query!.trim().toLocaleLowerCase()) ||
            item.description
              ?.trim()
              ?.toLocaleLowerCase()
              .includes(query!.trim().toLocaleLowerCase())
          );
        }),
      );
    }
  };

  /** Added by @Tarun 24-03-2025 -> Render resource sub category item using flash list (FYN-5971) */
  const renderSubCategoryItem = (item: FeaturedItems) => {
    return (
      <Shadow
        style={styles.newsCard}
        onPress={() => {
          !isDownloading && handleSelectedActionItem('Open', item);
        }}
        onLongPress={() => {
          !isDownloading && handleLongPress(item);
        }}
      >
        <View style={styles.newsContent}>
          <CustomText
            variant={TextVariants.bodyLarge}
            maxLines={2}
            ellipsis={TextEllipsis.tail}
          >
            {item.contentName}
          </CustomText>
          <CustomText maxLines={5} variant={TextVariants.labelMedium}>
            {item.description}
          </CustomText>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.newsTag}>
                <CustomText variant={TextVariants.labelMedium}>
                  {item.contentType === 'P'
                    ? t('PDF')
                    : item.contentType === 'I'
                    ? t('Img')
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
        </View>

        {item.coverImageURL && (
          <CustomImage
            source={{ uri: item.coverImageURL }}
            style={styles.thumbnailImg}
          />
        )}
      </Shadow>
    );
  };

  const renderSubCategoryFilter = (item: GetResourceSubCategoryModel) => {
    const ellipsis = item?.collectionName && item?.collectionName?.length > 20;
    return (
      <Tap
        key={`${item.resourceCollectionId}${item.collectionId}`}
        onPress={() => {
          getListFromSubCategory(
            templateData.selectedTemplate?.programTypeID == 0
              ? item.resourceCollectionId
              : item.collectionId,
          );
          setSelectedFilterItem(item);
        }}
        style={{
          ...styles.filterContainer,
          backgroundColor:
            `${item.resourceCollectionId}${item.collectionId}` ==
            `${selectedFilterItem?.resourceCollectionId}${selectedFilterItem?.collectionId}`
              ? theme.colors.primary
              : undefined,
        }}
      >
        <CustomText
          color={
            `${item.resourceCollectionId}${item.collectionId}` ==
            `${selectedFilterItem?.resourceCollectionId}${selectedFilterItem?.collectionId}`
              ? theme.colors.onPrimary
              : undefined
          }
          style={styles.filterText}
          variant={TextVariants.bodyMedium}
        >
          {ellipsis
            ? `${item.collectionName?.slice(0, 20)}...`
            : item.collectionName}
        </CustomText>
      </Tap>
    );
  };

  const getContentCollectionsByProgSessionIdApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetContentAllCollectionsAndFilesByProgSessionIdModel>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceResourceContent
            : ApiConstants.GetCommunityTemplateResourceContent,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (
        data.result &&
        data.result.fileList &&
        data.result.fileList?.length > 0
      ) {
        setAllFileList([...data.result.fileList]);
        setFileList([...data.result.fileList]);
      } else {
        setFileList([]);
      }
    },
    onError(error, variables, context) {
      setFileList([]);
    },
  });

  //api for checking if there is any subCategory
  const getResourceSubCategory = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetResourceSubCategoryModel[]>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceSubCategory
            : ApiConstants.GetCommunityTemplateSubCategory,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.success && data.result) {
        setFilterList(data.result);
        setSelectedFilterItem(data.result[0]);
      } else {
        setFilterList([]);
      }
    },
    onError(error, variables, context) {
      setFilterList([]);
    },
  });

  const getFeaturedResourceForContactDashboardApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFeaturedResourceForContactDashboardModel>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceFeaturedResource
            : ApiConstants.GetCommunityTemplateFeaturedResource,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setApiLoading(true); // api loading true to stop multiple api calls

      if (variables.PageNumber == 1) {
        // using page no from variable as it is updating more fast than state
        setLoading(true); // to show skeleton loader
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false); // api loading true to stop multiple api calls

      if (variables.PageNumber == 1) {
        // using page no from variable as it is updating more fast than state
        setLoading(false); // to show skeleton loader
      }
    },
    onSuccess(data, variables, context) {
      const handleMoreData = (totalCount?: number, items?: FeaturedItems[]) => {
        if (totalCount && items && totalCount > items?.length) {
          setHasMoreData(true);
        } else {
          setHasMoreData(false);
        }

        if (data.result?.items?.length! < 10) {
          setHasMoreData(false);
        }
      };

      if (data.result && data.result.items && data.result.items.length > 0) {
        if (variables.PageNumber == 1) {
          const newData: FeaturedItems[] = [...data.result.items];
          setFileList(newData);
          handleMoreData(data.result.totalCount, newData);
        } else {
          const newData: FeaturedItems[] = [...fileList, ...data.result.items];
          setFileList(newData);
          handleMoreData(data.result.totalCount, newData);
        }
      } else {
        setHasMoreData(false);
      }
    },
    onError(error, variables, context) {
      setHasMoreData(false);
      if (variables.PageNumber == 1) {
        setFileList([]);
      }
    },
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader
          showBack
          showSearchIcon={route.params?.navigationFrom != 'Dashboard'}
          searchText={search}
          setSearchText={query => searchFiles(query)}
          onSearchSubmit={query => searchFiles(query)}
          title={
            route.params?.navigationFrom == 'Dashboard'
              ? t('HomeFeatureContent')
              : t('Resources')
          }
        />
        <View style={styles.main}>
          <View>
            {filterList.length > 0 && (
              <ScrollView horizontal={true} style={styles.filterScrollView}>
                {filterList.map(item => {
                  return renderSubCategoryFilter(item);
                })}
              </ScrollView>
            )}
          </View>
          {loading ? (
            <SkeletonList
              count={5}
              children={
                <View style={styles.skeletonLay}>
                  <View style={styles.skeletonMain}>
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonHeading} />
                      <View style={styles.skeletonDesc} />
                      <View style={styles.skeletonDesc} />
                      <View style={styles.skeletonType} />
                    </View>
                    <View style={styles.skeletonImg} />
                  </View>
                </View>
              }
            />
          ) : (
            <CustomFlatList
              data={fileList}
              extraData={[SelectedFeaturedItem]}
              refreshing={loading}
              onRefresh={callRefresh}
              contentContainerStyle={
                fileList.length == 0 ? styles.flatListContainerStyle : undefined
              }
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (
                  hasMoreData &&
                  !apiLoading &&
                  route.params?.navigationFrom == 'Dashboard'
                ) {
                  callGetFeaturedResourceForContactDashboardApi(page + 1);
                }
              }}
              ListEmptyComponent={
                <EmptyView
                  label={
                    route.params?.navigationFrom == 'Dashboard'
                      ? t('NoFeatureContent')
                      : t('NoSubCategory')
                  }
                />
              }
              ListFooterComponent={
                hasMoreData &&
                route.params?.navigationFrom == 'Dashboard' &&
                fileList.length > 0 ? (
                  <LoadMore />
                ) : (
                  <></>
                )
              }
              keyExtractor={item => item.documentId!}
              renderItem={({ item }) => renderSubCategoryItem(item)}
            />
          )}
        </View>

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
    </SafeScreen>
  );
}

/**
 * Added by @Shivang 10-02-2025 ->  Function to generate styles dynamically
 * based on the theme (FYN-4279)
 */
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    main: {
      flex: 1,
      marginTop: 10,
    },
    skeletonLay: {
      width: '90%',
      padding: 15,
      borderRadius: theme.roundness,
      borderColor: theme.colors.surface,
      borderWidth: 1,
      marginTop: 10,
      marginHorizontal: 20,
    },
    skeletonMain: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skeletonContent: { flex: 1, gap: 10 },
    skeletonHeading: {
      width: '60%',
      height: 25,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 10,
      borderRadius: theme.roundness,
    },
    skeletonType: {
      backgroundColor: theme.colors.surface,
      width: '20%',
      height: 15,
      borderRadius: 15,
      marginTop: 10,
    },
    skeletonImg: {
      width: 80,
      height: 80,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    newsCard: {
      flexDirection: 'row',
      marginVertical: 2,
      marginHorizontal: 15,
      padding: 12,
    },
    thumbnailImg: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    TapViewContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    newsContent: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'space-between',
      gap: 5,
    },
    newsTag: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 2,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      alignSelf: 'flex-start',
    },
    flatListContainerStyle: { flexGrow: 1, justifyContent: 'center' },
    filterContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      borderColor: theme.colors.primary,
      padding: 5,
      margin: 5,
      alignSelf: 'center',
    },
    filterText: {
      marginHorizontal: 4,
      marginBottom: 2,
    },
    filterScrollView: {
      marginHorizontal: 15,
      paddingBottom: 5,
    },
    moreIcon: {
      height: 17,
      width: 17,
    },

    iconBgMore: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 7,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      paddingVertical: 2,
      width: 25,
    },
  });

export default ResourceSubCategory;
