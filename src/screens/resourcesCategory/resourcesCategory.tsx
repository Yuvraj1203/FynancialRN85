import {
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  SkeletonList,
} from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView, LoadMore } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  CategoryList,
  GetResourceCategoriesBySessionIdModel,
  GetUserActiveTemplateModel,
} from '@/services/models';
import { templateStore, userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation, useTabPress } from '@/utils/navigationUtils';
import { useCustomInAppBrowser } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Added by @Shivang 10-02-2025 ->  ContactUs Component Function (FYN-4279)
 */
function ResourcesCategory() {
  const navigation = useAppNavigation();

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

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  /**
   * Added by @Shivang 10-02-2025 ->  State to manage loading state for skeleton (FYN-4279)
   */

  const [loading, setLoading] = useState<boolean>(false);

  const [apiLoading, setApiLoading] = useState(false);

  const [hasMoreData, setHasMoreData] = useState(true);

  const [page, setPage] = useState(1); // pagination page index

  /**
   * Added by @Shivang 10-02-2025 -> State to store contact us data fetched from API
 (FYN-4279)
   */
  const [categoriesList, setCategoriesList] = useState<CategoryList[]>([]);

  const templateData = templateStore();

  // added by @Tarun 19-02-2025 --> state for selected template (#4063)
  const [selectedTemplate, setSelectedTemplate] = useState<
    GetUserActiveTemplateModel | undefined
  >(templateData?.selectedTemplate);

  const userDetails = userStore(state => state.userDetails);
  /**
   * Added by @Shivang 10-02-2025 ->  useEffect to trigger API call on component mount (FYN-4279)
   */

  useEffect(() => {
    if (
      (userDetails && templateData.templateList != undefined) ||
      templateData.selectedTemplate != undefined
    ) {
      // added by @Yuvraj 06-02-2025 --> api call to get featured data (#4063)
      callGetCategoryApi(1);
    }
  }, []);

  useEffect(() => {
    if (
      userDetails &&
      templateData.templateList &&
      templateData.selectedTemplate?.groupID?.toLowerCase() !=
        selectedTemplate?.groupID?.toLowerCase()
    ) {
      setSelectedTemplate(templateData.selectedTemplate);
      callGetCategoryApi(1);
    }
  }, [templateData.selectedTemplate]);

  useTabPress(() => {
    if (userDetails) {
      callGetCategoryApi(1);
    }
  });

  const callGetCategoryApi = (pageNumber: number) => {
    if (
      userDetails?.isAdvisor ||
      (templateData?.templateList && templateData?.templateList.length > 0)
    ) {
      setPage(pageNumber);
      getContentCategoriesByProgsessionIdApi.mutate({
        ...(templateData.selectedTemplate?.programTypeID == 0 ||
        templateData.selectedTemplate?.programTypeID == undefined ||
        templateData.selectedTemplate?.programTypeID == null
          ? {}
          : { SessionID: templateData?.selectedTemplate?.programSessionID }),
        PageNumber: pageNumber,
        MaxResultCount: 10,
        CallPoint: 'app',
      });
    }
  };

  const colors = ['#f5e6f5', '#e8f7e8', '#ecdede', '#cfe6e6'];

  const BgColorForCardsWithoutImage = (index: number) => {
    return colors[index % colors.length];
  };

  /** Added by @Tarun 24-03-2025 -> Render resource category item using flash list (FYN-5971) */
  const renderResourceCategoryItem = (item: CategoryList, index: number) => {
    const bg = BgColorForCardsWithoutImage(index);
    return (
      <Shadow
        onPress={() =>
          openSubCategories(item.categoryID, item.resourceCategoryID, item.link)
        }
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          {item.categoryImageURL ? (
            <CustomImage
              source={{ uri: item.categoryImageURL }}
              style={styles.image}
              resizeMode={ResizeModeType.stretch}
            />
          ) : (
            <CustomAvatar
              text={item.categoryName}
              initialsVariant={TextVariants.headlineMedium}
              viewStyle={{ backgroundColor: bg, ...styles.imagePlaceholder }}
            />
          )}
        </View>

        {!item.hideCategoryName && (
          <CustomText
            variant={TextVariants.bodyLarge}
            style={styles.categoryName}
          >
            {item.categoryName}
          </CustomText>
        )}
      </Shadow>
    );
  };

  const getContentCategoriesByProgsessionIdApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetResourceCategoriesBySessionIdModel>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null
            ? ApiConstants.GetAdvisorExperienceResource
            : ApiConstants.GetCommunityTemplateResource,
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
      /**
       * Added by @Shivang 10-02-2025 ->  Success Response - Store contact us data in state (FYN-4279)
       */
      setHasMoreData(data.result?.hasNextPage ?? false);

      if (
        data.result &&
        data.result?.categoryList &&
        data.result?.categoryList?.length > 0
      ) {
        if (variables.PageNumber == 1) {
          const newData: CategoryList[] = [...data.result.categoryList];
          setCategoriesList(newData);
        } else {
          const newData: CategoryList[] = [
            ...categoriesList,
            ...data.result.categoryList,
          ];
          setCategoriesList(newData);
        }
      } else {
        setHasMoreData(false);
        setCategoriesList([]);
      }
    },
    onError(error, variables, context) {
      /**
       * Added by @Shivang 10-02-2025 ->  Error Response - Show error message (FYN-4279)
       */
      setHasMoreData(false);
      if (variables.PageNumber == 1) {
        setCategoriesList([]);
      }
    },
  });

  const openSubCategories = (
    categoryID?: number,
    resourceCategoryID?: string,
    link?: string,
  ) => {
    //navigation to category
    if (link && link.length > 0) {
      openInAppBrowser(link);
    } else {
      navigation.navigate('ResourceSubCategory', {
        categoryId: categoryID,
        resourceCategoryID: resourceCategoryID,
      });
    }
  };

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader showHamburger title={t('Resources')} />

        <View style={styles.main}>
          {loading ? (
            <SkeletonList
              count={4}
              children={
                <View style={styles.skeletonLay}>
                  <View style={styles.skeletonHeading} />
                  <View style={styles.skeletonDesc} />
                </View>
              }
            />
          ) : (
            <View style={styles.main}>
              <CustomFlatList
                data={categoriesList}
                contentContainerStyle={
                  categoriesList.length == 0
                    ? styles.categoryFlatList
                    : undefined
                }
                refreshing={loading}
                keyExtractor={item =>
                  item.resourceCategoryID!.toString() +
                  item.categoryID!.toString()
                }
                onRefresh={() => callGetCategoryApi(1)}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  if (hasMoreData && !apiLoading) {
                    callGetCategoryApi(page + 1);
                  }
                }}
                ListFooterComponent={
                  hasMoreData && categoriesList.length > 0 ? (
                    <LoadMore />
                  ) : (
                    <></>
                  )
                }
                ListEmptyComponent={
                  <EmptyView
                    label={t('EmptyPortalMsg')}
                    style={{ marginHorizontal: 10 }}
                  />
                }
                renderItem={({ item, index }) =>
                  renderResourceCategoryItem(item, index)
                }
              />
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
    main: {
      flex: 1,
    },
    categoryFlatList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    skeletonLay: {
      width: '100%',
      paddingHorizontal: 15,
      alignItems: 'center',
    },
    skeletonHeading: {
      width: '90%',
      height: 110,
      borderRadius: theme.roundness,
      marginTop: 30,
      backgroundColor: theme.colors.surface,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      borderRadius: theme.roundness,
      marginTop: 15,
    },
    card: {
      marginVertical: 8,
      marginHorizontal: 10,
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 7 / 3,
      borderRadius: theme.roundness,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      marginTop: 10,
      textAlign: 'center',
    },
  });

export default ResourcesCategory;
