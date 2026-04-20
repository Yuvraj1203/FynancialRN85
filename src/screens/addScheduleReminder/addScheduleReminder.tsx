import {
  CustomButton,
  CustomChips,
  CustomText,
  Skeleton,
  Tap,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomDropDownPopup,
  CustomHeader,
  EmptyView,
  FormTextInput,
} from '@/components/molecules';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import {
  SafeScreen,
  ScheduleDateTimePicker,
  ScheduleTargetAudiencePopup,
} from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';

import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  GetAllReminderTypeModel,
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
  GetGlobalReminderForEditModel,
  SaveGlobalCalendarAndReminderDataModel,
} from '@/services/models';
import { GetAllUsersForGlobalCalendarModel } from '@/services/models/getAllUsersForGlobalCalendarModel/getAllUsersForGlobalCalendarModel';
import { GetGlobalCalendarProgramListModel } from '@/services/models/getGlobalCalendarProgramListModel/getGlobalCalendarProgramListModel';
import { onBehalfOfModel } from '@/services/models/getScheduleTasksForGlobalCalendarModel/getScheduleTasksForGlobalCalendarModel';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  formatDate,
  getCurrentDateTime,
  showSnackbar,
  validateTargetAudience,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Divider } from 'react-native-paper';
import { z } from 'zod';
import { AddScheduleUpdateReturnProp } from '../eventViewAll/eventViewAll';

/**  Added by @Ajay 10-04-2025 (#6195) ---> Type definition for AddScheduleProps to hold task-related properties */
export type AddScheduleReminderProps = {
  taskId?: string;
  taskIdentifier?: string;
};
enum LoadingEnum {
  SendNowLoading = 'SendNowLoading',
  ScheduleLoading = 'ScheduleLoading',
}

/**  Added by @Ajay 10-04-2025 (#6195) ---> Main function to render the Add Schedule screen */
function AddScheduleReminder() {
  const navigation = useAppNavigation();

  const route = useAppRoute('AddScheduleReminder');

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Get user details from user store */
  const userDetails = userStore();

  /**
   * Added by @Yuvraj 27-03-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6016)*/
  const { sendDataBack } = useReturnDataContext();

  /**  Added by @Ajay 10-04-2025 (#6195) ---> State management for loading indicators */
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState<LoadingEnum | undefined>(
    undefined,
  );

  const onBehalfOfList = [{ value: 'Self' }, { value: 'Primary Advisor' }];
  const [onBehalfOf, setOnBehalfOf] = useState<onBehalfOfModel>(
    onBehalfOfList[0],
  ); // default Self
  const [showOnBehalfOfPopUp, setShowOnBehalfOfPopUp] = useState(false);

  /**  Added by @Ajay 10-04-2025 (#6195) ---> State management for tags, contacts and templates */
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

  const [contactTypeList, setContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >([]);
  const [selectedContactTypeList, setSelectedContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >([]);

  const [templateList, setTemplateList] = useState<
    GetGlobalCalendarProgramListModel[]
  >([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<GetGlobalCalendarProgramListModel>();

  const [targetAudienceType, setTargetAudienceType] = useState<string>('');

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Enum for various date formates */
  const enum dateFormates {
    displayDateTime = 'MMM DD YYYY hh:mm A',
    dateInParams = 'MMM-DD-YYYY',
    timeInParams = 'hh:mm A',
    dateTimeInParams = 'MMM-DD-YYYY hh:mm A',
    parseDateFormate = 'YYYY-MM-DDTHH:mm:ss',
    UiDate = 'MMM DD YYYY hh:mm A',
  }

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
  const [startDateTime, setStartDateTime] = useState<string>(
    formatDate({
      date: getCurrentDateTime(),
      returnFormat: dateFormates.UiDate,
    }),
  );

  /**  Added by @Ajay 10-04-2025 (#6195) ---> State management for dropdown visibility of target and reminder list */
  const [showTargetAudDropdown, setShowTargetAudDropdown] = useState(false);

  const [reminderList, setReminderList] = useState<GetAllReminderTypeModel[]>(
    [],
  );
  /**  Added by @Ajay 10-04-2025 (#6195) ---> State management for selected reminder */
  const [selectedReminder, setSelectedReminder] =
    useState<GetAllReminderTypeModel>();

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Effect hook to fetch reminder data and related items on scheduleProps change */
  useEffect(() => {
    if (userDetails.userDetails) {
      /** Trigger mutation to fetch global Reminder data */
      GetAllReminderType.mutate({});
      if (route.params?.taskIdentifier) {
        GetGlobalReminderForEdit.mutate({ id: route.params?.taskIdentifier });
      }
      /** Fetch associated tags, contacts, and templates using the task identifier */
      const taskIdentifier = route.params?.taskId || 0;
      GetCalItemtags.mutate({ GlobalCalId: taskIdentifier });
      getAllUsersForGlobalCalendar.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarProgramList.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarContactTypeApi.mutate({ GlobalCalId: taskIdentifier });
    }
  }, []);

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Schema defined for form validation using Zod library */
  const schema = z
    .object({
      selectedRemineder: z
        .string()
        .min(1, { message: t('ReminderTypeIsRequired') }),
      otherTitle: z.string().optional(),
      selectedTarget: z.string().optional(),
      scheduleDateTime: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      /**  Added by @Ajay 10-04-2025 (#6195) ---> Validate target audience selection */
      if (data?.selectedRemineder == 'Other' && !data?.otherTitle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('TitleIsRequired'),
          path: ['otherTitle'],
        });
      }
    });

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Convert schema to type for use in React Hook Form */
  type Schema = z.infer<typeof schema>;

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Initialize the form with default values and validation schema */
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
      selectedRemineder: '',
      selectedTarget: '',
      scheduleDateTime: '',
    },
    resolver: zodResolver(schema),
  });

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Handle Reminder type selection from dropdown */
  const handleReminderSelect = (value: GetAllReminderTypeModel) => {
    if (value && value.name) {
      setValue('selectedRemineder', value?.name);
    }
    console.log('Reminder type : ', value);
    setSelectedReminder(value);
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Handle start date selection */
  const handleStartDatePress = (date?: string) => {
    if (date && date !== startDateTime) {
      setStartDateTime(date);
      setValue('scheduleDateTime', date);
    }
    console.log('startDateTime : ', date, startDateTime);
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Format the date to a readable format */
  const formatedDate = (date: string) => {
    return formatDate({
      date: date,
      parseFormat: dateFormates.displayDateTime,
      returnFormat: dateFormates.dateInParams,
    });
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Format the time to a readable format */
  const formatedTime = (date: string) => {
    return formatDate({
      date: date,
      parseFormat: dateFormates.displayDateTime,
      returnFormat: dateFormates.timeInParams,
    });
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Handle the removal of a selected tag from the list */
  const handleRemoveTag = (tag: number) => {
    setSelectedTagList(selectedTagList.filter(item => item.id !== tag));
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContactType = (typeId: number) => {
    setSelectedContactTypeList(
      selectedContactTypeList.filter(item => item.contactType !== typeId),
    );
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContacts = (userId: number) => {
    setSelectedContactList(
      selectedContactList.filter(item => item.userId !== userId),
    );
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation for fetching calendar item reminder list */
  const GetAllReminderType = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllReminderTypeModel[]>({
        endpoint: ApiConstants.GetAllReminderType,
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
        setReminderList(data.result);
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation for fetching calendar item tags */
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
        if (route.params?.taskId) {
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

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation to fetch all users for the global calendar */
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
        if (route.params?.taskId) {
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
        if (route.params?.taskId) {
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
  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation to fetch all Program list for the global calendar */
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
        if (route.params?.taskId) {
          const selectedTemp = data.result.filter(item => item.isSelected);

          if (selectedTemp.length > 0) {
            console.log('Selected Template is : ', selectedTemp.length);
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

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation for fetching global Reminder data for editing */
  const GetGlobalReminderForEdit = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalReminderForEditModel>({
        endpoint: ApiConstants.GetGlobalReminderForEdit,
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
      if (data?.result?.reminderTask) {
        const reminder = data.result;

        if (!selectedTemplate) {
          if (reminder.reminderTask?.fromSelf === true) {
            setOnBehalfOf(onBehalfOfList[0]);
          } else {
            setOnBehalfOf(onBehalfOfList[1]);
          }
        }

        const selectedRemind = reminderList.find(
          item => item.id == reminder.reminderTask?.reminderTypeID,
        );
        if (selectedRemind) {
          handleReminderSelect(selectedRemind);
        }
        if (selectedRemind?.name?.toLowerCase() == 'other') {
          setValue('otherTitle', reminder.reminderTask?.reminderTitle);
        }

        /** Format and set start and end dates if available */
        if (reminder.reminderTask?.scheduleTime) {
          setStartDateTime(
            formatDate({
              date: reminder.reminderTask?.scheduleTime,
              parseFormat: 'YYYY-MM-DDThh:mm:ss',
              returnFormat: dateFormates.displayDateTime,
            }),
          );
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Handle form submission for scheduling the Reminder */
  const onSave = (data: Schema, isSendNow?: boolean) => {
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
    triggerSaveReminderSchedule(data, isSendNow);
  };

  /**  Added by @Ajay 08-04-2025 ---> Function to trigger saveReminderSchedule mutation */
  const triggerSaveReminderSchedule = (data: Schema, isSendNow?: boolean) => {
    saveReminderSchedule.mutate({
      payload: {
        id: route.params?.taskId,
        ProgramId: selectedTemplate?.programID,
        AssignedTagList: selectedTagList.map(item => ({ TagId: item.id })),
        AssignedUserList: selectedContactList.map(item => ({
          UserId: item.userId,
        })),
        AssignedContactTypeList: selectedContactTypeList.map(
          item => item.contactType,
        ),
        typeCode: 'Reminder',
        createOrEditReminderTaskDto: {
          reminderTitle: data.otherTitle
            ? data.otherTitle
            : data.selectedRemineder,
          reminderTypeID: selectedReminder?.id,
          id: route.params?.taskIdentifier,
          ...(!selectedTemplate && {
            FromSelf: onBehalfOf.value === 'Self' ? true : false,
          }),
        },
        ScheduleDateTime: isSendNow
          ? null
          : formatDate({
              date: startDateTime,
              parseFormat: dateFormates.displayDateTime,
              returnFormat: dateFormates.dateTimeInParams,
            }),
        dtpScheduleTime: isSendNow ? null : formatedDate(startDateTime),
        ScheduleTime: isSendNow ? null : formatedTime(startDateTime),
      },
      loading: isSendNow
        ? LoadingEnum.SendNowLoading
        : LoadingEnum.ScheduleLoading,
    });
  };

  /**  Added by @Ajay 10-04-2025 (#6195) ---> Use mutation for saving Reminder schedule */
  const saveReminderSchedule = useMutation({
    mutationFn: (sendData: {
      payload: Record<string, any>;
      loading: LoadingEnum;
    }) => {
      return makeRequest<SaveGlobalCalendarAndReminderDataModel>({
        endpoint: ApiConstants.saveGlobalCalendarAndReminderData,
        method: HttpMethodApi.Post,
        data: sendData.payload,
      });
    },
    onMutate(variables, context) {
      if (variables.loading) {
        setSaveLoading(variables.loading);
      }
    },
    // onMutate() {
    //   setSaveLoading(true); /** Show loading indicator while fetching data */
    // },
    onSettled(data, error, variables, context) {
      setSaveLoading(
        undefined,
      ); /** Hide loading indicator once data fetch is complete */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result) {
        if (data.result.status == 1) {
          if (route.params?.taskIdentifier) {
            showSnackbar(t('ReminderUpdatedSuccessfully'), 'success');
          } else {
            showSnackbar(t('ReminderSavedSuccessfully'), 'success');
          }

          sendDataBack('EventViewAll', {
            isDetailsUpdated: true,
          } as AddScheduleUpdateReturnProp);
          handleGoBack(navigation);
        } else if (data.result.status == 0 && data?.result?.message) {
          showSnackbar(data?.result?.message, 'danger');
        } else {
          showSnackbar(t('errorSaveReminder'), 'danger');
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
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
              route?.params?.taskIdentifier
                ? t('EditReminder')
                : t('CreateReminder')
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
            <ScrollView keyboardShouldPersistTaps={'handled'}>
              <View style={styles.container}>
                {!selectedTemplate && (
                  <Tap
                    disableRipple={true}
                    style={styles.paddingZero}
                    onPress={() => setShowOnBehalfOfPopUp(true)}
                  >
                    <FormTextInput
                      control={control}
                      style={styles.OnbehalfofInput}
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
                <CustomText style={styles.headingLabel}>
                  {t('ReminderType')}
                </CustomText>

                {reminderList?.length > 0 ? (
                  <CustomDropDownPopup
                    // loading={loadingCountryList}
                    withPopup={false}
                    items={reminderList}
                    displayKey="name"
                    idKey="id"
                    showSearchOption={false}
                    selectedItem={selectedReminder}
                    onItemSelected={handleReminderSelect}
                    mode={DropdownModes.single}
                    withFixedHeight={false}
                  />
                ) : (
                  <View style={{ height: 300 }}>
                    <EmptyView label={t('NoReminders')} />
                  </View>
                )}
                {errors.selectedRemineder && (
                  <CustomText
                    style={[
                      styles.error,
                      {
                        marginBottom:
                          selectedReminder?.name == 'Other' ? 15 : 0,
                      },
                    ]}
                  >
                    {errors.selectedRemineder.message}
                  </CustomText>
                )}

                {selectedReminder?.name == 'Other' && (
                  <FormTextInput
                    name={'otherTitle'}
                    control={control}
                    placeholder={t('EnterTitle')}
                    label={t('ReminderTitle')}
                    multiLine={true}
                    maxLines={1.5}
                    height={60}
                  />
                )}

                <View style={styles.dividerOne} />

                <View>
                  <CustomText variant={TextVariants.bodyLarge}>
                    {t('targetAudience')}
                  </CustomText>

                  <Tap
                    onPress={() => {
                      if (saveLoading) {
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
                          : targetAudienceType === 'Templates' &&
                            selectedTemplate
                          ? selectedTemplate.programName
                          : targetAudienceType === 'ContactType' &&
                            selectedContactTypeList.length > 0
                          ? t('ContactType')
                          : t('SelectTargetAudience')
                      }
                      label={t('targetAudienceText')}
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
                    loading={saveLoading == LoadingEnum.SendNowLoading}
                    onPress={() => handleSubmit(data => onSave(data, true))()}
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
                  loading={saveLoading != undefined}
                  startDatePress={value => {
                    handleStartDatePress(value);
                  }}
                />

                <CustomButton
                  style={styles.saveButton}
                  color={theme.colors.tertiary}
                  loading={saveLoading == LoadingEnum.ScheduleLoading}
                  onPress={() => handleSubmit(data => onSave(data, false))()}
                >
                  {t('Schedule')}
                </CustomButton>
              </View>
            </ScrollView>
          )}

          <ScheduleTargetAudiencePopup
            shown={showTargetAudDropdown}
            setShown={setShowTargetAudDropdown}
            tagList={tagList}
            contactList={contactList}
            templateList={templateList}
            contactTypeList={contactTypeList}
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
    container: { flex: 1, padding: 20 },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
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
    inputValueSkel: {
      height: 20,
      width: 80,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },

    dropDownSelect: {
      padding: 0,
      marginTop: 20,
    },
    sendNowButton: {
      borderRadius: 5,
      marginBottom: 15,
      marginTop: 20,
      width: 'auto',
    },
    saveButton: {
      borderRadius: 5,
      marginBottom: 25,
      marginTop: 20,
      width: 'auto',
    },

    headingLabel: {
      paddingBottom: 10,
      fontSize: 17,
      fontWeight: 'semibold',
    },
    targetAudLabel: {
      paddingBottom: 10,
      paddingLeft: 5,
      fontSize: 14,
      fontWeight: 'semibold',
    },
    buttonView: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      paddingHorizontal: 10,
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
    dividerOne: {
      marginTop: 20,
      marginBottom: 30,
      height: 1.5,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    divider: {
      marginVertical: 30,
      height: 1.5,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    error: {
      color: theme.colors.error,
      marginTop: 4,
      marginLeft: 12,
      fontSize: 12,
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

    orLayout: {
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
    },
    dividerLay: { alignItems: 'center' },

    or: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      alignSelf: 'center',
      paddingHorizontal: 10,
    },

    paddingZero: {
      padding: 0,
    },
    OnbehalfofInput: {
      marginTop: 10,
    },
    PopUpStyle: { flex: 1, height: 120 },
  });

export default AddScheduleReminder;
