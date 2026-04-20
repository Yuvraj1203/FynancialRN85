import {
  CustomButton,
  CustomChips,
  CustomText,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomDatePicker,
  CustomDropDownPopup,
  CustomHeader,
  FormTextInput,
} from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import {
  SafeScreen,
  ScheduleDateTimePicker,
  ScheduleTargetAudiencePopup,
} from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetAllActionItemsListModel,
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
  SaveGlobalCalendarAndEventDataModel,
} from '@/services/models';
import { GetAllUsersForGlobalCalendarModel } from '@/services/models/getAllUsersForGlobalCalendarModel/getAllUsersForGlobalCalendarModel';
import { GetGlobalCalendarProgramListModel } from '@/services/models/getGlobalCalendarProgramListModel/getGlobalCalendarProgramListModel';
import { onBehalfOfModel } from '@/services/models/getScheduleTasksForGlobalCalendarModel/getScheduleTasksForGlobalCalendarModel';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  formatDate,
  getCurrentDateTime,
  isEmpty,
  parseDate,
  showSnackbar,
  validateTargetAudience,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Divider } from 'react-native-paper';
import { z } from 'zod';
import { AddScheduleUpdateReturnProp } from '../eventViewAll/eventViewAll';

export type AddScheduleActionItemProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
};
const enum DateFormatsLocal {
  DueDateAPIFormat = 'YYYY-MM-DDTHH:mm:ss',
  DueDateUIFormat = 'MMM DD, YYYY',
}
function AddScheduleActionItem() {
  /**  Added by @Yuvraj 08-04-2025 ---> navigate to different screen (FYN-6456) */
  const navigation = useAppNavigation();

  /**  Added by @Yuvraj 08-04-2025 ---> get params from parent screen (FYN-6456) */
  const route = useAppRoute('AddScheduleActionItem');

  /**  Added by @Yuvraj 08-04-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Yuvraj 08-04-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Yuvraj 08-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /** Added by @Yuvraj 14-04-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6549)*/
  const { sendDataBack } = useReturnDataContext();

  /** Added by @Yuvraj 08-04-2025 ---> State for loading indicator (#6456) */
  const [loading, setLoading] = useState(false);

  /** Added by @Yuvraj 08-04-2025 ---> State for loading indicator (#6456) */
  const [loadingButton, setLoadingButton] = useState<'schedule' | 'sendNow'>();

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

  const onBehalfOfList = [{ value: 'Self' }, { value: 'Primary Advisor' }];
  const [onBehalfOf, setOnBehalfOf] = useState<onBehalfOfModel>(
    onBehalfOfList[0],
  ); // default Self
  const [showOnBehalfOfPopUp, setShowOnBehalfOfPopUp] = useState(false);
  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> State management for dropdown visibility of target and reminder list */
  const [showTargetAudDropdown, setShowTargetAudDropdown] = useState(false);

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> State management for tags, contacts and templates */
  const [tagList, setTagList] = useState<GetCalItemtagsModel[]>([]);
  const [selectedTagList, setSelectedTagList] = useState<GetCalItemtagsModel[]>(
    [],
  );
  const [contactList, setContactList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >([]);
  const [selectedContactList, setSelectedContactList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >([]);

  const [templateList, setTemplateList] = useState<
    GetGlobalCalendarProgramListModel[]
  >([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<GetGlobalCalendarProgramListModel>();

  const [contactTypeList, setContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >([]);
  const [selectedContactTypeList, setSelectedContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >([]);

  const [targetAudienceType, setTargetAudienceType] = useState<string>('');

  const enum DateFormats {
    FullDate = 'MMM-DD-YYYY hh:mm A',
    UIFullDate = 'MMM DD YYYY hh:mm A',
    UIDate = 'MMM DD, YYYY',
    ApiDate = 'MMM-DD-YYYY',
    ApiFullDate = 'YYYY-MM-DDTHH:mm:ss',
    ApiDueDate = 'YYYY-MM-DD',
    Time = 'hh:mm A',
  }

  const defaultScheduleDateTime = formatDate({
    date: getCurrentDateTime(),
    returnFormat: DateFormats.UIFullDate,
  });

  /**  Added by @Yuvraj 14-04-2025 ---> Initialize state variables for start date/time (FYN-6549) */
  const [startDateTime, setStartDateTime] = useState<string>(
    defaultScheduleDateTime,
  );

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
      selectedTarget: z.string().optional(),
      scheduleDateTime: z.string().optional(),
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
    clearErrors,
    setError,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      action: '',
      customActionItem: '',
      dueDate: '',
      selectedTarget: '',
      scheduleDateTime: defaultScheduleDateTime,
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (userDetails.userDetails) {
      getAllActionItemsListApi.mutate({});
      /** Fetch associated tags, contacts, and templates using the task identifier */
      const taskIdentifier = route.params?.item?.id || 0;
      GetCalItemtags.mutate({ GlobalCalId: taskIdentifier });
      getAllUsersForGlobalCalendar.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarContactTypeApi.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarProgramList.mutate({ GlobalCalId: taskIdentifier });
    }
  }, []);

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected tag from the list */
  const handleRemoveTag = (tag: number) => {
    setSelectedTagList(selectedTagList.filter(item => item.id !== tag));
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContactType = (typeId: number) => {
    setSelectedContactTypeList(
      selectedContactTypeList.filter(item => item.contactType !== typeId),
    );
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContacts = (userId: number) => {
    setSelectedContactList(
      selectedContactList.filter(item => item.userId !== userId),
    );
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle start date selection */
  const handleStartDatePress = (date?: string) => {
    if (date && date !== startDateTime) {
      setStartDateTime(date);
      setValue('scheduleDateTime', date);
    }
  };

  /** Added by @Yuvraj 08-04-2025 ---> submit handler (FYN-6456) */
  const onSubmit = (data: Schema, isSendNow?: boolean) => {
    const isTargetValid = validateTargetAudience({
      targetAudienceType,
      selectedTagList,
      selectedContactList,
      selectedContactTypeList,
      selectedTemplate,
      setError,
      clearErrors,
      t,
    });

    if (!isTargetValid) return;
    if (isSendNow) {
      showAlertPopup({
        title: t('SendNow'),
        msg: t('SureSendNow'),
        PositiveText: t('Yes'),
        NegativeText: t('No'),
        onPositivePress: () => {
          sendData(data, true);
        },
      });
    } else {
      sendData(data, false);
    }
  };

  const sendData = (data: Schema, isSendNow?: boolean) => {
    const dueDate = formatDate({
      date: data.dueDate,
      parseFormat: DateFormats.UIDate,
      returnFormat: DateFormats.FullDate,
    });

    Log('data.scheduleDateTime' + data.scheduleDateTime);
    saveGlobalCalendarAndActionItemDataApi.mutate({
      Actiontext: actionItem?.id == 0 ? data.customActionItem : undefined,
      ScheduleDateTime: isSendNow
        ? null
        : formatDate({
            date: data.scheduleDateTime!,
            parseFormat: DateFormats.UIFullDate,
            returnFormat: DateFormats.FullDate,
          }),
      createOrEditParentActionItemDto: {
        title: actionItem?.id == 0 ? data.customActionItem : actionItem?.title,
        dueDate: dueDate ? dueDate : undefined,
        actionItemsId: actionItem?.id == 0 ? null : actionItem?.id?.toString(),
        id: route?.params?.item?.taskIdentifier
          ? route?.params?.item?.taskIdentifier
          : null,
        ...(!selectedTemplate && {
          FromSelf: onBehalfOf.value === 'Self' ? true : false,
        }),
      },
      Id: route?.params?.item?.id ? route?.params?.item?.id : null,
      ScheduleTime: isSendNow
        ? null
        : formatDate({
            date: data.scheduleDateTime!,
            parseFormat: DateFormats.UIFullDate,
            returnFormat: DateFormats.Time,
          }),
      AssignedTagList: selectedTagList.map(item => ({ TagId: item.id })),
      AssignedUserList: selectedContactList.map(item => ({
        UserId: item.userId,
      })),
      AssignedContactTypeList: selectedContactTypeList.map(
        item => item.contactType,
      ),
      ProgramId: selectedTemplate?.programID,
      ddlActionItemList: actionItem?.id?.toString(),
      typeCode: 'ActionItem',
      dtpDueDate: formatDate({
        date: data.dueDate,
        parseFormat: DateFormats.UIDate,
        returnFormat: DateFormats.ApiDate,
      }),
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
    Log(' selected date value ');

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
      if (error || !route?.params?.item?.taskIdentifier) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        data.result?.unshift({
          title: 'Custom',
          id: 0,
        });
        data?.result && setActionItemList(data.result);

        if (route?.params?.item?.taskIdentifier) {
          getGlobalScheduleDetailForEditApi.mutate({
            Id: route?.params?.item?.taskIdentifier,
          });
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

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Use mutation for fetching calendar item tags */
  const GetCalItemtags = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetCalItemtagsModel[]>({
        endpoint: ApiConstants.GetCalItemtags,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate() {
      setLoading(true); /** Show loading indicator while fetching data */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data?.result?.length > 0) {
        setTagList(data.result);
        if (route.params?.item?.id) {
          const selectedTags = data?.result?.filter(item => item.isSelected);
          if (selectedTags.length > 0) {
            setSelectedTagList(selectedTags);
            setTargetAudienceType('Tags');
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Use mutation to fetch all users for the global calendar */
  const getAllUsersForGlobalCalendar = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllUsersForGlobalCalendarModel[]>({
        endpoint: ApiConstants.getAllUsersForGlobalCalendar,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate() {
      setLoading(true); /** Show loading indicator while fetching data */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result) {
        setContactList(data.result);
        if (route.params?.item?.id) {
          const selectedContacts = data.result.filter(item => item.isSelected);
          if (selectedContacts.length > 0) {
            setSelectedContactList(selectedContacts);
            setTargetAudienceType('Contacts');
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Use mutation to fetch all contact type list for the global calendar */
  const GetGlobalCalendarContactTypeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalCalendarContactTypeModel[]>({
        endpoint: ApiConstants.GetGlobalCalendarContactType,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(
        true,
      ); /** Show loading indicator while fetching data (#4274) */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete (#4274) */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data.result.length > 0) {
        setContactTypeList(data.result);
        if (route.params?.item?.id) {
          // If editing an existing message, pre‐select any that are already marked “isSelected”
          const previouslySelected = data.result.filter(
            item => item.isSelected,
          );
          if (previouslySelected.length > 0) {
            setSelectedContactTypeList(previouslySelected);
            setTargetAudienceType('ContactType');
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Use mutation to fetch all Program list for the global calendar */
  const GetGlobalCalendarProgramList = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalCalendarProgramListModel[]>({
        endpoint: ApiConstants.GetGlobalCalendarProgramList,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(
        true,
      ); /** Show loading indicator while fetching data (#4274) */
    },
    onSettled(data, error, variables, context) {
      setLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete (#4274) */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data.result.length > 0) {
        setTemplateList(data.result);
        if (route.params?.item?.id) {
          const selectedTemp = data.result.filter(item => item.isSelected);

          if (selectedTemp.length > 0) {
            setSelectedTemplate(selectedTemp[0]);
            setTargetAudienceType('Templates');
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 08-04-2025 ---> for save action item (FYN-6456) */
  const saveGlobalCalendarAndActionItemDataApi = useMutation({
    mutationFn: async (sendData: Record<string, any>) => {
      return makeRequest<SaveGlobalCalendarAndEventDataModel>({
        endpoint: ApiConstants.SaveGlobalCalendarAndActionItemData,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoadingButton(variables.ScheduleDateTime ? 'schedule' : 'sendNow');
    },
    onSettled(data, error, variables, context) {
      setLoadingButton(undefined);
    },
    onSuccess(data, variables, context) {
      if (data?.result?.status == 0 && data?.result?.message) {
        showSnackbar(data?.result?.message, 'danger');
      } else {
        showSnackbar(t('ActionItemAddedSuccessfully'), 'success');
        sendDataBack('EventViewAll', {
          isDetailsUpdated: true,
        } as AddScheduleUpdateReturnProp);
        handleGoBack(navigation);
      }
    },
    onError(error) {
      showSnackbar(
        error.message,
        'danger',
      ); /** Show error message on failure */
    },
  });

  /** Added by @Yuvraj 08-04-2025 -> initial api for getting event data from advisor end if edit (FYN-6456) */
  const getGlobalScheduleDetailForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalActionItemForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const actionItemData = data.result?.parentActionDetails;
        if (!selectedTemplate) {
          if (actionItemData?.fromSelf === true) {
            setOnBehalfOf(onBehalfOfList[0]);
          } else {
            setOnBehalfOf(onBehalfOfList[1]);
          }
        }
        if (actionItemData?.actionItemsId != null) {
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
          setValue('customActionItem', actionItemData?.title ?? '');
        }

        if (actionItemData?.dueDate) {
          setValue(
            'dueDate',
            formatDate({
              date: actionItemData?.dueDate,
              parseFormat: DateFormatsLocal.DueDateAPIFormat,
              returnFormat: DateFormatsLocal.DueDateUIFormat,
            }),
          );
        }
        if (actionItemData?.scheduleDateTime) {
          handleStartDatePress(
            formatDate({
              date: actionItemData?.scheduleTime!,
              parseFormat: DateFormats.ApiFullDate,
              returnFormat: DateFormats.UIFullDate,
            }),
          );
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({
          ios: 0,
          android: 500,
        })}
        style={styles.main}
      >
        <View style={styles.main}>
          <CustomHeader
            showBack
            title={
              route.params?.item ? t('EditActionItem') : t('CreateActionItem')
            }
          />
          {loading ? (
            <Skeleton>
              <View style={styles.skeletonLay}>
                {[...Array(3).keys()].map((_, index) => (
                  <View
                    key={`action-skeleton-${index}`}
                    style={styles.actionItemLaySkeleton}
                  >
                    <View style={styles.actionItemCheckboxSkeleton} />
                    <View style={styles.actionItemTitleLaySkeleton}>
                      <View style={styles.actionItemTitleSkeleton} />
                    </View>
                  </View>
                ))}
                <View style={styles.textAreaSkel}>
                  <View style={styles.textAreaValueSkel1} />
                  <View style={styles.textAreaValueSkel2} />
                  <View style={styles.textAreaValueSkel3} />
                </View>

                <View style={styles.textAreaSkel}>
                  <View style={styles.coverImageSkel} />
                </View>

                {[...Array(2).keys()].map((_, index) => (
                  <View
                    key={`action-skeleton-${index}`}
                    style={styles.inpuSkel}
                  >
                    <View style={styles.inputValueSkel} />
                  </View>
                ))}
              </View>
            </Skeleton>
          ) : (
            <ScrollView
              style={styles.container}
              keyboardShouldPersistTaps={'handled'}
            >
              {!selectedTemplate && (
                <Tap
                  disableRipple={true}
                  style={styles.paddingZero}
                  onPress={() => setShowOnBehalfOfPopUp(true)}
                >
                  <FormTextInput
                    control={control}
                    name="onbehalfof"
                    placeholder={onBehalfOf.value}
                    label={t('OnBehalfOf')}
                    showLabel={true}
                    enabled={false}
                    suffixIcon={{
                      source: Images.down,
                      type: ImageType.svg,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  />
                </Tap>
              )}
              <Tap
                disableRipple={true}
                style={styles.paddingZero}
                onPress={() => {
                  setShowActionItemDropdown(true);
                }}
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
                  setShowDatePicker(true);
                }}
                style={styles.paddingZero}
              >
                <FormTextInput
                  label={t('DueDate')}
                  name={'dueDate'}
                  control={control}
                  enabled={false}
                  placeholder="MMM DD, YYYY"
                  suffixIcon={{
                    source: Images.calendar,
                    type: ImageType.svg,
                    color: theme.colors.onSurfaceVariant,
                  }}
                />
              </Tap>

              <View style={styles.divider} />

              <View style={styles.dropDownSelect}>
                <CustomText variant={TextVariants.bodyLarge}>
                  {t('targetAudience')}
                </CustomText>

                <Tap
                  onPress={() => {
                    if (loading) {
                      return;
                    }
                    clearErrors('selectedTarget'); // reset error

                    setShowTargetAudDropdown(true);
                  }}
                  style={styles.dropDownSelect}
                >
                  <FormTextInput
                    name={'selectedTarget'}
                    control={control}
                    showLabel={true}
                    enabled={false}
                    placeholder={
                      targetAudienceType === 'Tags' &&
                      selectedTagList.length > 0
                        ? t('Tags')
                        : targetAudienceType === 'Contacts' &&
                          selectedContactList.length > 0
                        ? t('Contacts')
                        : targetAudienceType === 'Templates' && selectedTemplate
                        ? selectedTemplate.programName
                        : targetAudienceType === 'ContactType' &&
                          selectedContactTypeList.length > 0
                        ? t('ContactType')
                        : t('SelectTargetAudience')
                    }
                    label={t('targetAudienceText')}
                    suffixIcon={{
                      source: Images.down,
                      type: ImageType.svg,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  />
                </Tap>
                {targetAudienceType === 'ContactType' &&
                  selectedContactTypeList.length > 0 && (
                    <View>
                      <CustomText
                        style={styles.targetAudLabel}
                        variant={TextVariants.titleSmall}
                      >
                        {t('SelectedContactType')}
                      </CustomText>
                      <View style={styles.chipsContainer}>
                        {selectedContactTypeList.map((item, index) => (
                          <CustomChips
                            key={item.contactType} // Always give a key in loop
                            chipId={item.contactType}
                            chipLabel={item.contactName}
                            onCloseClick={value => {
                              if (value) {
                                handleRemoveContactType(value);
                              }
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                {targetAudienceType === 'Tags' &&
                  selectedTagList.length > 0 && (
                    <View>
                      <CustomText
                        style={styles.targetAudLabel}
                        variant={TextVariants.titleSmall}
                      >
                        {t('SelectedTags')}
                      </CustomText>
                      <View style={styles.chipsContainer}>
                        {selectedTagList.map((item, index) => (
                          <CustomChips
                            key={item.id} // Always give a key in loop
                            chipId={item.id}
                            chipLabel={item.tagName}
                            onCloseClick={value => {
                              if (value) {
                                handleRemoveTag(value);
                              }
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                {targetAudienceType === 'Contacts' &&
                  selectedContactList.length > 0 && (
                    <View>
                      <CustomText
                        style={styles.targetAudLabel}
                        variant={TextVariants.titleSmall}
                      >
                        {t('SelectedContacts')}
                      </CustomText>
                      <View style={styles.chipsContainer}>
                        {selectedContactList.map((item, index) => (
                          <CustomChips
                            key={item.userId} // Always give a key in loop
                            chipId={item.userId}
                            chipLabel={item.name}
                            onCloseClick={value => {
                              if (value) {
                                handleRemoveContacts(value);
                              }
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                <CustomButton
                  style={styles.sendNowButton}
                  loading={loadingButton == 'sendNow'}
                  onPress={handleSubmit(data => {
                    onSubmit(data, true);
                  })}
                >
                  {t('SendNow')}
                </CustomButton>
                <View style={styles.orLayout}>
                  <View style={styles.dividerLay}>
                    <Divider horizontalInset bold style={styles.divider} />
                  </View>
                  <CustomText
                    variant={TextVariants.labelLarge}
                    style={styles.or}
                  >
                    {t('OR')}
                  </CustomText>
                </View>
              </View>

              <ScheduleDateTimePicker
                timezone={userDetails?.userDetails?.timeZoneName}
                startDateTime={startDateTime}
                showEndDate={false}
                loading={loading}
                startDatePress={value => {
                  handleStartDatePress(value);
                }}
              />

              <CustomButton
                style={styles.saveButton}
                color={theme.colors.tertiary}
                loading={loadingButton == 'schedule'}
                onPress={handleSubmit(data => {
                  onSubmit(data, false);
                })}
              >
                {t('Schedule')}
              </CustomButton>
            </ScrollView>
          )}
          <ScheduleTargetAudiencePopup
            shown={showTargetAudDropdown}
            setShown={setShowTargetAudDropdown}
            tagList={tagList}
            contactList={contactList}
            contactTypeList={contactTypeList}
            templateList={templateList}
            selectedType={targetAudienceType}
            selectedTagsList={selectedTagList}
            selectedContactsList={selectedContactList}
            selectedContactTypesList={selectedContactTypeList}
            selectedTemplate={selectedTemplate}
            onselectType={value => {
              if (value) {
                setTargetAudienceType(value);
              }
            }}
            onTagsSelected={value => {
              if (value) {
                setSelectedTagList(value);
              }
            }}
            onContactsSelected={value => {
              if (value) {
                setSelectedContactList(value);
              }
            }}
            onTemplateSelected={value => {
              setSelectedTemplate(value);
            }}
            onContactTypeSelected={value => {
              setSelectedContactTypeList(value!);
            }}
          />
          {!selectedTemplate && (
            <CustomDropDownPopup
              title={t('SelectOnBehalfOf')}
              style={styles.PopUpStyle}
              setShown={setShowOnBehalfOfPopUp}
              shown={showOnBehalfOfPopUp}
              loading={loading}
              items={onBehalfOfList}
              showSearchOption={false}
              displayKey="value"
              saveButtonText={t('Confirm')}
              idKey="value"
              mode={DropdownModes.single}
              selectedItem={onBehalfOf}
              onItemSelected={value => {
                setOnBehalfOf(value);
                setShowOnBehalfOfPopUp(false);
              }}
            />
          )}
          <CustomDatePicker
            showPopup={showDatePicker}
            setShowPopup={setShowDatePicker}
            title={t('SelectDueDate')}
            date={handleSetDate()}
            setDate={handleSelectedDate}
            mode={DatePickerMode.date}
          />

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
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    actionItemLaySkeleton: {
      width: '100%',
      marginTop: 10,
      padding: 15,
      flexDirection: 'row',
      gap: 10,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'center',
    },
    actionItemCheckboxSkeleton: {
      height: 20,
      width: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionItemTitleLaySkeleton: { width: '100%', gap: 10 },
    actionItemTitleSkeleton: {
      height: 10,
      width: '50%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    textAreaSkel: {
      width: '100%',
      height: 120,
      marginTop: 30,
      padding: 15,
      gap: 10,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      borderWidth: 1,
    },
    textAreaValueSkel1: {
      height: 20,
      width: 80,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    textAreaValueSkel2: {
      height: 20,
      width: '80%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    textAreaValueSkel3: {
      height: 20,
      width: '50%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    coverImageSkel: {
      height: '100%',
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    inpuSkel: {
      width: '100%',
      marginTop: 30,
      padding: 15,
      flexDirection: 'row',
      gap: 10,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'center',
    },
    inputValueSkel: {
      height: 20,
      width: 80,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    saveButton: {
      marginTop: 10,
      marginBottom: 30,
    },
    paddingZero: {
      padding: 0,
    },

    divider: {
      marginVertical: 10,
      height: 1.5,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    dropDownSelect: {
      padding: 0,
      marginTop: 20,
    },
    targetAudLabel: {
      paddingBottom: 10,
      paddingLeft: 5,
      fontSize: 14,
      fontWeight: 'semibold',
    },
    chipsContainer: {
      flexDirection: 'row', // arrange chips horizontally
      flexWrap: 'wrap', // 🚀 wrap to next line if no space
      alignItems: 'flex-start', // align chips properly on multiple lines
      gap: 5, // nice gap between chips
      padding: 10,
      borderWidth: 1,
      borderRadius: 12,
      borderColor: theme.colors.outline,
    },
    orLayout: {
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
    },
    dividerLay: {
      alignItems: 'center',
    },
    or: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      alignSelf: 'center',
      paddingHorizontal: 10,
    },
    sendNowButton: {
      marginBottom: 15,
      marginTop: 20,
    },

    PopUpStyle: { flex: 1, height: 120 },
  });

export default AddScheduleActionItem;
