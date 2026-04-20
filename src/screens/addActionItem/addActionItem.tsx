import { CustomButton, SkeletonList, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  CustomDatePicker,
  CustomDropDownPopup,
  CustomHeader,
  FormTextInput,
} from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetAllActionItemsListModel,
  GetTopAssignedActionModel,
} from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { formatDate, isEmpty, parseDate, showSnackbar } from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { ActionItemListReturnProps } from '../actionItemList/actionItemList';

dayjs.extend(isSameOrAfter);

export type AddActionItemProps = {
  userId?: number;
  id?: number;
};

function AddActionItem() {
  /**  Added by @Yuvraj 08-04-2025 ---> navigate to different screen (FYN-6456) */
  const navigation = useAppNavigation();

  /**  Added by @Yuvraj 08-04-2025 ---> get params from parent screen (FYN-6456) */
  const route = useAppRoute('AddActionItem')?.params;

  /**  Added by @Yuvraj 08-04-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Yuvraj 08-04-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Yuvraj 08-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /** Added by @Yuvraj 08-04-2025 ---> State for loading indicator (#6456) */
  const [loading, setLoading] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);

  /** Added by @Yuvraj 08-04-2025 ---> Retrieve user details from store */
  const userDetails = userStore();

  /** Added by @Yuvraj 08-04-2025 ---> for custom field (FYN-6456) */
  const [actionItem, setActionItem] = useState<GetAllActionItemsListModel>();

  /** Added by @Yuvraj 08-04-2025 ---> for custom field (FYN-6456) */
  const [actionItemList, setActionItemList] = useState<
    GetAllActionItemsListModel[]
  >([]);

  /** Added by @Yuvraj 08-04-2025 ---> for actionItem dropdown list (FYN-6456) */
  const [showActionItemDropdown, setShowActionItemDropdown] = useState(false);

  // Added by @Yuvraj 08-04-2025 ---> state variables for showing custom pop of datePicker
  const [showDatePicker, setShowDatePicker] = useState(false);

  /** Added by @Yuvraj 08-04-2025 ---> schema for input validation
   *  superRefine for optional customactionText (FYN-6456) */
  const schema = z
    .object({
      action: z.string().min(1, { message: t('PleaseSelectActionItem') }),
      customActionItem: z.string().optional(),
      dueDate: z
        .string()
        .min(1, { message: t('PleaseSelectDueDate') })
        .refine(
          val => {
            const parsed = dayjs(val, DateFormats.UIDate);
            return parsed.isSameOrAfter(dayjs(), 'day'); // must be future date
          },
          { message: t('FutureDueDateMsg') },
        ),
    })
    .superRefine((data, ctx) => {
      if (data.action === 'Custom') {
        if (!data.customActionItem || data.customActionItem.trim().length < 3) {
          ctx.addIssue({
            origin: 'string',
            path: ['customActionItem'],
            code: 'too_small',
            type: 'string',
            minimum: 3,
            inclusive: true,
            message: t('CustomActionItemMsg'),
          });
        }
      }
    });

  /** Added by @Yuvraj 08-04-2025 ---> schema type generator (FYN-6456) */
  type Schema = z.infer<typeof schema>;

  /** Added by @Yuvraj 08-04-2025 ---> state for form (FYN-6456) */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      action: '',
      customActionItem: '',
      dueDate: '',
    },
    resolver: zodResolver(schema),
  });

  const enum DateFormats {
    FullDate = 'YYYY-MM-DDTHH:mm:ss',
    Date = 'DD/MM/YYYY',
    UIDate = 'MMM DD, YYYY',
    ApiDate = 'MM/DD/YYYY hh:mm:ss A',
  }

  const { sendDataBack } = useReturnDataContext();

  useEffect(() => {
    if (userDetails.userDetails) {
      getAllActionItemsListApi.mutate({});
    }
  }, []);

  /** Added by @Yuvraj 08-04-2025 ---> submit handler (FYN-6456) */
  const onSubmit = (data: Schema) => {
    const dueDate = formatDate({
      date: data.dueDate,
      parseFormat: DateFormats.UIDate,
      returnFormat: DateFormats.ApiDate,
    });
    saveActionItemsApi.mutate({
      ActionItemsId: actionItem?.id == 0 ? null : actionItem?.id,
      ActionType: 0,
      AssignedUserList: route?.userId,
      DueDate: dueDate,
      Title: actionItem?.id == 0 ? data.customActionItem : actionItem?.title,
      Id: route?.id ?? 0,
    });
  };

  /** Added by @Yuvraj 08-04-2025 ---> selected actionItem from dropdown list (FYN-6456) */
  const handleActionItemSelect = (data: GetAllActionItemsListModel) => {
    setActionItem(data);
    setValue('action', data.title!);
  };

  // Helper to retrieve and format date of birth
  const handleSetDate = (): Date => {
    // Retrieve the date of birth from the form
    if (!isEmpty(getValues('dueDate'))) {
      // Create a new Date object from the input format
      return (
        parseDate({
          date: getValues('dueDate'),
          parseFormat: DateFormats.UIDate,
        }) ?? new Date()
      );
    }

    return new Date(); // Default to today's date if not valid or not found
  };
  /** Added by @Yuvraj 08-04-2025 -> Handler for selecting date (FYN-6456) */
  const handleSelectedDate = (value: Date) => {
    setValue(
      'dueDate',
      formatDate({
        date: value,
        returnFormat: DateFormats.UIDate,
      }),
    );
  };

  /** Added by @Yuvraj 08-04-2025 ---> for actionItem dropdown list (FYN-6456) */
  const getAllActionItemsListApi = useMutation({
    mutationFn: async (sendData: Record<string, any>) => {
      return makeRequest<GetAllActionItemsListModel[]>({
        endpoint: ApiConstants.GetAllActionItemsList,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (error || !route?.id) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        data.result?.unshift({
          title: 'Custom',
          id: 0,
        });

        setActionItemList(data.result);

        if (route?.id) {
          getUserActionItemForEditApi.mutate({ id: route?.id });
        }
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  const getUserActionItemForEditApi = useMutation({
    mutationFn: async (sendData: Record<string, any>) => {
      return makeRequest<GetTopAssignedActionModel>({
        endpoint: ApiConstants.GetUserActionItemForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const actionItemData = data.result;

        if (actionItemData.actionItemsId != null) {
          const selectedItem = actionItemList.find(
            item => item.id == actionItemData.actionItemsId,
          );

          if (selectedItem) {
            setActionItem(selectedItem);
            setValue('action', actionItemData.title ?? '');
          } else {
            setActionItem(actionItemList.at(0));
            setValue('action', actionItemList.at(0)?.title ?? '');
            setValue('customActionItem', actionItemData.title ?? '');
          }
        } else {
          setActionItem(actionItemList.at(0));
          setValue('action', actionItemList.at(0)?.title ?? '');
          setValue('customActionItem', actionItemData.title ?? '');
        }

        if (actionItemData.dueDate) {
          setValue(
            'dueDate',
            formatDate({
              date: actionItemData.dueDate,
              parseFormat: DateFormats.FullDate,
              returnFormat: DateFormats.UIDate,
            }),
          );
        }
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  /** Added by @Yuvraj 08-04-2025 ---> for save action item (FYN-6456) */
  const saveActionItemsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.SaveActionItems,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setSaveLoading(true);
    },
    onSettled(data, error, variables, context) {
      setSaveLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        sendDataBack('ActionItemList', {
          updated: true,
        } as ActionItemListReturnProps);
        handleGoBack(navigation);
        showSnackbar(t('ActionItemAddedSuccessfully'), 'success');
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={route?.id ? t('EditActionItem') : t('AssignActionItem')}
        />

        {loading ? (
          <SkeletonList
            count={1}
            children={
              <>
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonSubTitle} />
                </View>
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonSubTitle} />
                </View>
                <View style={styles.skeletonButton}></View>
              </>
            }
          />
        ) : (
          <View style={styles.container}>
            <Tap
              disableRipple={true}
              style={styles.paddingZero}
              onPress={() => setShowActionItemDropdown(true)}
            >
              <FormTextInput
                control={control}
                name="action"
                placeholder={t('SelectActionItem')}
                label={t('Action')}
                showLabel={true}
                enabled={false}
                suffixIcon={{
                  source: Images.down,
                  type: ImageType.svg,
                  color: theme.colors.onSurfaceVariant,
                }}
              />
            </Tap>

            {getValues('action') == 'Custom' && (
              <FormTextInput
                control={control}
                name="customActionItem"
                label={t('CustomActionItem')}
                showLabel={true}
                placeholder={t('CustomActionItem')}
                enabled={true}
              />
            )}

            <Tap
              disableRipple
              onPress={() => {
                !saveLoading && setShowDatePicker(true);
              }}
              style={styles.paddingZero}
            >
              <FormTextInput
                label={t('DueDate')}
                name={'dueDate'}
                control={control}
                enabled={false}
                placeholder={t('UiDate')}
                suffixIcon={{
                  source: Images.calendar,
                  type: ImageType.svg,
                  color: theme.colors.onSurfaceVariant,
                }}
              />
            </Tap>

            <CustomButton
              loading={saveLoading}
              style={styles.saveButton}
              onPress={handleSubmit(onSubmit)}
            >
              {t('Save')}
            </CustomButton>
          </View>
        )}

        <CustomDropDownPopup
          loading={loading}
          shown={showActionItemDropdown}
          setShown={setShowActionItemDropdown}
          title={t('SelectActionList')}
          items={actionItemList.filter(
            (item: GetAllActionItemsListModel) => item !== undefined,
          )}
          displayKey="title"
          idKey="id"
          selectedItem={actionItem}
          onItemSelected={handleActionItemSelect}
        />

        <CustomDatePicker
          showPopup={showDatePicker}
          setShowPopup={setShowDatePicker}
          title={t('SelectDueDate')}
          // minDate={new Date()}
          date={handleSetDate()}
          setDate={handleSelectedDate}
          mode={DatePickerMode.date}
        />
      </View>
    </SafeScreen>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    container: {
      flex: 1,
      marginVertical: 10,
      marginHorizontal: 20,
    },
    saveButton: {
      marginTop: 20,
    },
    paddingZero: {
      padding: 0,
    },
    skeletonMain: {
      width: '100%',
      margin: 20,
    },
    skeletonTitle: {
      width: '20%',
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonSubTitle: {
      width: '90%',
      height: 35,
      borderRadius: theme.roundness,
      borderWidth: 1,
      marginTop: 10,
    },
    skeletonButton: {
      width: '90%',
      height: 35,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      margin: 20,
      alignSelf: 'center',
    },
  });

export default AddActionItem;
