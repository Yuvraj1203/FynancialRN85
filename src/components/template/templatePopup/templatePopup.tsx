import {
  CustomFlatList,
  CustomText,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomBottomPopup } from '@/components/molecules';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetUserActiveTemplateModel } from '@/services/models';
import { dashboardCardsStore, templateStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { formatDate, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export let showTemplatePopup: () => void;

function TemplatePopup() {
  /** Added by @Tarun 17-02-2025 -> to access app theme(colors, roundness, fonts, etc) */
  const theme = useTheme();

  /** Added by @Tarun 17-02-2025 -> access StylesSheet with theme implemented */
  const styles = makeStyles(theme);

  /** Added by @Tarun 17-02-2025 -> translations for labels */
  const { t } = useTranslation();

  /** Added by @Tarun 17-02-2025 -> show user sessions popup */
  const [showPopup, setShowPopup] = useState(false);

  /** Added by @Tarun 17-02-2025 -> session store to get user enrolled templates */
  const templateDetails = templateStore();

  /** Added by @Tarun 17-02-2025 -> show skeleton till template api get called */
  const [loading, setLoading] = useState<boolean>(false);

  /** Added by @Tarun 17-02-2025 -> show loading on template view */
  const [tappedTemplateID, setTappedTemplateID] = useState<string>();

  const dashboardCardsData = dashboardCardsStore(); // biometric Store

  useEffect(() => {
    showTemplatePopup = () => {
      setShowPopup(true);
      getUserActiveTemplate.mutate({});
    };
  }, []);

  const selectUserGroup = (item: GetUserActiveTemplateModel) => {
    if (!loading) {
      dashboardCardsData.clearAll();
      setTappedTemplateID(item.groupID);
      templateDetails.setSelectedTemplate(item);
      setTappedTemplateID(undefined);
      setShowPopup(false);
    }
  };

  /** Added by @Tarun 17-02-2025 -> api to get all templates user is enrolled in */
  const getUserActiveTemplate = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserActiveTemplateModel[]>({
        endpoint: ApiConstants.GetUserActiveTemplate,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** Added by @Tarun 17-02-2025 -> show skeleton loading */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Tarun 17-02-2025 -> hide skeleton loading */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        /** Added by @Tarun 17-02-2025 -> format start date and end date for template */

        const newList = data.result.map(item => ({
          ...item,
          startDate: item.startDate
            ? formatDate({
                date: item.startDate,
                parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                returnFormat: 'MMMM DD, YYYY',
              })
            : '',
          endDate: item.endDate
            ? formatDate({
                date: item.endDate,
                parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                returnFormat: 'MMMM DD, YYYY',
              })
            : '',
        }));
        templateDetails.setTemplateList(newList);

        /**
         * Added by @Tarun 17-02-2025 -> if user already selected a template then don't
         * show template popup for selection, but if template is not presented in api then
         * show popup
         */

        if (templateDetails.selectedTemplate) {
          setShowPopup(true);
        } else {
          /**
           * Added by @Tarun 17-02-2025 -> if only single template is there then don't
           * show popup and select the first and only template
           */
          if (data.result.length > 1) {
            setShowPopup(true);
          } else {
            templateDetails.setSelectedTemplate(newList?.at(0));
          }
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Tarun 24-03-2025 -> Render template item using flash list (FYN-5971) */
  const renderTemplateItem = (item: GetUserActiveTemplateModel) => {
    return (
      <Tap disableRipple onPress={() => selectUserGroup(item)}>
        <View>
          <View
            style={{
              ...styles.container,
              backgroundColor:
                item.groupID?.toLowerCase() ==
                templateDetails.selectedTemplate?.groupID?.toLowerCase()
                  ? theme.colors.primarySelected
                  : theme.colors.background,
            }}
          >
            <CustomText
              variant={TextVariants.bodyLarge}
              maxLines={2}
              ellipsis={TextEllipsis.tail}
              color={theme.colors.primary}
              style={styles.programName}
            >
              {item.programName}
            </CustomText>
          </View>

          {item.groupID?.toLowerCase() == tappedTemplateID?.toLowerCase() && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </Tap>
    );
  };

  return (
    <>
      <CustomBottomPopup
        shown={showPopup}
        setShown={setShowPopup}
        dismissOnBackPress={!loading}
        dismissOnClosePress={
          !loading && templateDetails.selectedTemplate != undefined
        }
        title={t('SelectExperience')}
      >
        {loading ? (
          <SkeletonList
            count={3}
            children={
              <View style={styles.skeletonMain}>
                <View style={styles.nameSkel}></View>
                <View style={styles.descriptionSkeleton}></View>
              </View>
            }
          />
        ) : (
          templateDetails.templateList && (
            <View style={styles.main}>
              <CustomFlatList
                data={templateDetails.templateList}
                extraData={[
                  templateDetails.selectedTemplate,
                  loading,
                  tappedTemplateID,
                ]}
                keyExtractor={item => item.groupID!}
                renderItem={({ item }) => renderTemplateItem(item)}
              />
            </View>
          )
        )}
      </CustomBottomPopup>
    </>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.roundness,
      borderColor: theme.colors.outline,
      borderWidth: 0.3,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginHorizontal: 10,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    status: {
      borderRadius: theme.roundness,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primaryHighlight1,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    date: {
      marginTop: 10,
    },
    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    skeletonNameLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '75%',
      height: 20,
    },
    dateSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 100,
      height: 20,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 10,
      marginTop: 5,
    },
    descriptionSkeleton1: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      marginTop: 10,
    },
    programName: {
      flex: 1,
    },
    main: {
      height: 270,
    },
  });

export default TemplatePopup;
