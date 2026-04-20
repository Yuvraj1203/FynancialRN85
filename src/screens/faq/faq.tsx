import {
  CustomFlatList,
  CustomText,
  HtmlRender,
  Shadow,
  SkeletonList,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { FaQArray, GetClientFaqDataModel } from '@/services/models';
import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  processHtmlContent,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const Faq = () => {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4295) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4295) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4295) */
  const { t } = useTranslation();

  /** Added by @Yuvraj 31-01-2025 -> opening custom browser (FYN-4295) */
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Yuvraj 31-01-2025 -> loading state to show skeleton (FYN-4295) */
  const [loading, setLoading] = useState<boolean>(false);

  /** Updated by @Tarun 24-03-2025 -> storing all faq data (FYN-5971) */
  const [faqData, setFaqData] = useState<(string | FaQArray)[]>([]);

  /** Added by @Yuvraj 31-01-2025 -> text of search text input state (FYN-4295) */
  const [search, setSearch] = useState<string>(); // search group members

  const userDetails = userStore(state => state.userDetails);

  /** Added by @Yuvraj 31-01-2025 -> calling intial api to get all the FAQ (FYN-4295) */
  useEffect(() => {
    if (userDetails) {
      getclientfaqdataApi.mutate({
        searchString: '',
      });
    }
  }, []);

  const handleSearch = (query?: string) => {
    setSearch(query);
    getclientfaqdataApi.mutate({
      searchString: query,
    });
  };

  /** Added by @Tarun 24-03-2025 -> Render faq item for flash list (FYN-5971) */
  const renderFaqItem = (item: string | FaQArray) => {
    return typeof item === 'string' ? (
      <Shadow style={styles.shadowContainer}>
        <CustomText
          color={theme.colors.primary}
          variant={TextVariants.titleLarge}
        >
          {item}
        </CustomText>
      </Shadow>
    ) : (
      <View style={styles.subConatiner}>
        <CustomText
          color={theme.colors.onSurface}
          variant={TextVariants.bodyLarge}
        >
          {item.question}
        </CustomText>
        <HtmlRender
          html={item.answerHTML}
          openLinks={url => {
            openInAppBrowser(url);
          }}
          iFrameList={item?.iFrameList}
          handleIframeClick={iframeString => {
            showImagePopup({ iframe: iframeString });
          }}
        />
      </View>
    );
  };

  /** Added by @Yuvraj 31-01-2025 -> intial api to get all the FAQ (FYN-4295) */
  const getclientfaqdataApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetClientFaqDataModel[]>({
        endpoint: ApiConstants.GetClientFaqData,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** Added by @Yuvraj 31-01-2025 -> show skeleton loading(FYN-4295) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Yuvraj 31-01-2025 -> hide skeleton loading(FYN-4295) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        /** Updated by @Tarun 24-03-2025 ->  set data to be compatible with section list (FYN-5971) */
        const resData = data.result.flatMap(category => {
          if (!category.categoryTitle || !category.faQs) return []; // Ensure no undefined values
          return [
            category.categoryTitle,
            ...category.faQs.map(item => {
              const htmlContent = processHtmlContent({
                html: item.answerHTML,
                maxWords: 50,
                linkColor: theme.colors.links,
              });
              return {
                ...item,
                answerHTML: htmlContent?.Content,
                iFrameList: htmlContent?.iFrameList,
              };
            }),
          ];
        });

        /** Added by @Yuvraj 31-01-2025 -> set all list (FYN-4295) */
        setFaqData(resData);
      }
    },
    onError(error) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={t('Faq')}
          showSearchIcon={true}
          searchText={search}
          setSearchText={handleSearch}
          onSearchSubmit={handleSearch}
        />

        {loading ? (
          <SkeletonList count={5} style={styles.container}>
            <View style={styles.shadowContainerSkeleton}>
              <View style={styles.categoryTitleSkeleton}></View>
              <View style={styles.qnaContainerSkeleton}>
                <View style={styles.questionSkeleton}></View>

                <View style={styles.answerSkeleton}></View>
              </View>
            </View>
          </SkeletonList>
        ) : (
          <CustomFlatList
            data={faqData}
            keyExtractor={(item, index) => `${item}+${index}`}
            contentContainerStyle={
              faqData.length == 0 ? styles.flatListContainerStyle : undefined
            }
            refreshing={loading}
            onRefresh={() => {
              getclientfaqdataApi.mutate({
                searchString: '',
              });
            }}
            ListEmptyComponent={
              <EmptyView
                imageColor={theme.colors.onSurfaceVariant}
                label={t('NoFaq')}
              />
            }
            getItemType={item => {
              return typeof item === 'string' ? 'sectionHeader' : 'faq';
            }}
            renderItem={({ item }) => renderFaqItem(item)}
          />
        )}
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    container: {
      paddingHorizontal: 20,
      paddingVertical: 30,
      flex: 1,
    },
    flatListContainerStyle: { flexGrow: 1, justifyContent: 'center' },
    shadowContainerSkeleton: {
      padding: 0,
      borderWidth: 1,
      marginBottom: 20,
      borderRadius: theme.roundness,
    },
    categoryTitleSkeleton: {
      backgroundColor: theme.colors.surface,
      height: 35,
      borderTopRightRadius: theme.roundness,
      borderTopLeftRadius: theme.roundness,
    },
    qnaContainerSkeleton: {
      padding: 10,
      gap: 10,
    },
    questionSkeleton: {
      backgroundColor: theme.colors.surface,
      height: 20,
      width: '50%',
      borderRadius: theme.roundness,
    },
    answerSkeleton: {
      backgroundColor: theme.colors.surface,
      height: 20,
      borderRadius: theme.roundness,
    },
    shadowContainer: {
      backgroundColor: theme.colors.primaryContainer,
      marginBottom: 4,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      marginHorizontal: 20,
      marginTop: 20,
    },
    subConatiner: {
      gap: 3,
      marginHorizontal: 25,
    },
  });

export default Faq;
