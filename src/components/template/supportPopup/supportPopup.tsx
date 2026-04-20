import {ImageType} from '@/components/atoms/customImage/customImage';
import {CustomActionSheetPoup} from '@/components/molecules';
import {ApiConstants} from '@/services/apiConstants';
import {HttpMethodApi, makeRequest} from '@/services/apiInstance';
import {ActionSheetModel, GetAllModel, ItemsArray} from '@/services/models';
import {userStore} from '@/store';
import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useAppNavigation} from '@/utils/navigationUtils';
import {showSnackbar} from '@/utils/utils';
import {useMutation} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';

type Props = {
  id?: number;
  reportType?: string;
  shown: boolean;
  setShown: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Added by @Yuvraj 12-02-2025 -> Component to display a support popup
 *
 * A component that renders a support popup with configurable visibility, ID, and report type.
 * It allows toggling the popup visibility and styling the container. This component handles
 * showing and hiding the popup based on the `shown` prop and the `setShown` callback.
 *
 * @param {Object} props - The props for the SupportPopup component.
 * @param {number} [props.id] - An optional ID for the support request.
 * @param {string} [props.reportType] - An optional report type to categorize the support request.
 * @param {boolean} props.shown - A flag indicating whether the popup should be displayed.
 * @param {function} props.setShown - A callback function to toggle the visibility of the popup.
 * @param {StyleProp<ViewStyle>} [props.style] - Optional custom styles for the popup container.
 *
 * @returns {JSX.Element} The SupportPopup component that displays the popup based on the `shown` flag.
 */
function SupportPopup(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> navigate to different screen (FYN-4299) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const {t} = useTranslation();

  /** Added by @Yuvraj 31-01-2025 -> state for action list popup data (FYN-4299) */
  const [actionList, setActionList] = useState<ActionSheetModel[]>([]);

  /** Added by @Tarun 14-02-2025 -> loading state till api fetch data (FYN-4299) */
  const [loading, setLoading] = useState<boolean>(false);

  const userDetails = userStore(state => state.userDetails); // user store

  /** Added by @Yuvraj 31-01-2025 -> intial api call to get all the support category (FYN-4299) */
  useEffect(() => {
    if (userDetails) {
      getAllApi.mutate({});
    }
  }, []);

  /** Added by @Yuvraj 31-01-2025 -> creating the action list by the data coming from api (FYN-4299) */
  const setActions = (data: ItemsArray[]) => {
    const list: ActionSheetModel[] = [];

    if ((data[0] as ItemsArray).supportCategory?.id != undefined) {
      for (let i = 0; i < data.length; i++) {
        const supportData = data[i] as ItemsArray;
        list.push({
          title: supportData?.supportCategory?.name,
          image: supportData?.supportCategory?.name
            ?.toLowerCase()
            .includes('abuse'.toLowerCase())
            ? Images.issue
            : supportData?.supportCategory?.name
                ?.toLowerCase()
                .includes('feedback'.toLowerCase())
            ? Images.message
            : Images.danger,
          imageType: ImageType.svg,
          onPress: () => {
            props.setShown(false);

            navigation.navigate('Support', {
              categoryData: supportData,
            });
          },
        });
      }
      setActionList(list);
    }
  };

  /** Added by @Yuvraj 31-01-2025 -> intial api to get all the support category (FYN-4299) */
  const getAllApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllModel>({
        endpoint: ApiConstants.GetAll,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /**  Added by @Tarun 14-02-2025 -> show loading on action sheet popup (FYN-4299) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**  Added by @Tarun 14-02-2025 -> show loading on action sheet popup (FYN-4299) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data?.result) {
        /** Added by @Yuvraj 31-01-2025 -> create action items with data (FYN-4299) */
        setActions(data.result.items!);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <CustomActionSheetPoup
      title={t('Support')}
      shown={props.shown}
      setShown={props.setShown}
      centered={false}
      loading={loading}
      hideIcons={false}
      onCancelClick={() => {
        // setSelectedCategory(undefined);
      }}
      children={actionList}
    />
  );
}

const makeStyles = (theme: CustomTheme) => StyleSheet.create({});

export default SupportPopup;
