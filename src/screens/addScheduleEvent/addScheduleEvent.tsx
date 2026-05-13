import {
  CustomButton,
  CustomChips,
  CustomImage,
  CustomText,
  Skeleton,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomBottomPopup,
  CustomDropDownPopup,
  CustomHeader,
  CustomImagePicker,
  FormTextInput,
} from '@/components/molecules';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import { InputModes } from '@/components/molecules/customTextInput/formTextInput';
import {
  SafeScreen,
  ScheduleDateTimePicker,
  ScheduleTargetAudiencePopup,
} from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';

import {
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
  GetGlobalEventForEdit,
  GetScheduleTasksForGlobalCalendarModel,
  SaveGlobalCalendarAndEventDataModel,
  UploadFileListToS3Model,
  UserRoleEnum,
} from '@/services/models';
import { EventListModel } from '@/services/models/eventListModel/eventListModel';
import { GetAllUsersForGlobalCalendarModel } from '@/services/models/getAllUsersForGlobalCalendarModel/getAllUsersForGlobalCalendarModel';
import { GetGlobalCalendarProgramListModel } from '@/services/models/getGlobalCalendarProgramListModel/getGlobalCalendarProgramListModel';
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
  getEndDateTime,
  parseDate,
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
import { Asset } from 'react-native-image-picker';
import { z } from 'zod';
import { AddScheduleUpdateReturnProp } from '../eventViewAll/eventViewAll';

/**  Added by @Ajay 08-04-2025 (#6199) ---> Type definition for AddScheduleProps to hold task-related properties */
export type AddScheduleEventProps = {
  taskId?: string;
  taskIdentifier?: string;
  item?: GetScheduleTasksForGlobalCalendarModel;
};

/**  Added by @Ajay 08-04-2025 (#6199) ---> Main function to render the Add Schedule screen */
function AddScheduleEvent() {
  const navigation = useAppNavigation();

  const route = useAppRoute('AddScheduleEvent');

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Get user details from user store */
  const userDetails = userStore();

  /**
   * Added by @Yuvraj 27-03-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6016)*/
  const { sendDataBack } = useReturnDataContext();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for loading indicators */
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [endDateError, setEndDateError] = useState<string>('');
  const [uploadedImageId, setUploadedImageId] = useState<string>('');

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for tags, contacts, templates, and media */
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

  const [attendeesList, setAttendeesList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >([]);
  const [selectedAttendeesList, setSelectedAttendeesList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >([]);
  const [externalAttendeesList, setExternalAttendeesList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >([]);
  const [selectedExternalAttendeesList, setSelectedExternalAttendeesList] =
    useState<GetAllUsersForGlobalCalendarModel[]>([]);
  const [externalAttendeesPopup, setExternalAttendeesPopup] = useState(false);

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

  const [mediaList, setMediaList] = useState<Asset[]>([]);
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  const [targetAudienceType, setTargetAudienceType] = useState<string>('');

  const [isOffice365, setIsOffice365] = useState(
    route.params?.item?.eventType &&
      userDetails.userDetails?.role == UserRoleEnum.Advisor
      ? route.params.item.eventType == 4
      : false,
  );

  const enum dateFormates {
    displayDateTime = 'MMM DD YYYY hh:mm A',
    dateInParams = 'MMM-DD-YYYY',
    timeInParams = 'hh:mm A',
    dateTimeInParams = 'MMM-DD-YYYY hh:mm A',
    parseDateFormate = 'YYYY-MM-DDTHH:mm:ss',
    UiDate = 'MMM DD YYYY hh:mm A',
  }

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Initialize state variables for start and end date/time */
  const [startDateTime, setStartDateTime] = useState<string>(
    formatDate({
      date: getCurrentDateTime(),
      returnFormat: dateFormates.UiDate,
    }),
  );
  const [endDateTime, setEndDateTime] = useState<string>(
    formatDate({
      date: getEndDateTime(),
      returnFormat: dateFormates.UiDate,
    }),
  );

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Define list of event types */
  const eventList: EventListModel[] = [
    { id: 1, name: 'Phone Call' },
    { id: 2, name: 'In-Person Meeting' },
    {
      id: 3,
      name: !isOffice365 ? 'Office 365' : 'Online Meeting',
      disabled: !isOffice365,
    },
  ];

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for dropdown visibility and event type */
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);

  const [showTargetAudDropdown, setShowTargetAudDropdown] = useState(false);

  const [selectedEventType, setSelectedEventType] = useState<EventListModel>();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for event data and schedule properties */
  const [eventData, setEventData] = useState<GetGlobalEventForEdit>();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Effect hook to fetch event data and related items on scheduleProps change */
  useEffect(() => {
    if (userDetails.userDetails) {
      /** Trigger mutation to fetch global event data */
      getGlobalEventForEdit.mutate({
        payload: { Id: route.params?.taskIdentifier },
        endpoint: isOffice365
          ? ApiConstants.GetGlobalO365EventForEdit
          : ApiConstants.GetGlobalEventForEdit,
      });

      /** Fetch associated tags, contacts, and templates using the task identifier */
      const taskIdentifier = route.params?.taskId || 0;

      if (isOffice365) {
        GetFynancialAttendeesApi.mutate({
          EventId: route.params?.taskIdentifier,
        });
        GetExternalAttendeesApi.mutate({
          EventId: route.params?.taskIdentifier,
        });
      } else {
        GetCalItemtags.mutate({ GlobalCalId: taskIdentifier });
        getAllUsersForGlobalCalendar.mutate({ GlobalCalId: taskIdentifier });
        GetGlobalCalendarProgramList.mutate({ GlobalCalId: taskIdentifier });
        GetGlobalCalendarContactTypeApi.mutate({ GlobalCalId: taskIdentifier });
      }
    }
  }, []);

  /** Effect to track and update the latest startDateTime in handleEndDatePress */
  useEffect(() => {
    // When startDateTime changes, ensure that handleEndDatePress works with the latest value
    if (userDetails.userDetails && startDateTime && endDateTime) {
      const parsedStartDateTime = parsedDate(startDateTime);
      const parsedEndDateTime = parsedDate(endDateTime);

      if (parsedStartDateTime && parsedEndDateTime) {
        if (parsedStartDateTime > parsedEndDateTime) {
          setEndDateError(t('EndDateGreaterThanStartError'));
        } else {
          setEndDateError('');
        }
      }
    }
  }, [startDateTime, endDateTime]);

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Schema defined for form validation using Zod library */
  const schema = z
    .object({
      eventTitle: z.string().min(1, { message: t('EventTitleRequired') }),
      eventType: z.string().min(1, { message: t('EventTypeRequired') }),
      phone: z.string().optional(),
      location: z.string().optional(),
      meetingUrl: z.string().optional(),
      description: z.string().optional(),
      selectedTarget: z.string().optional(),
      startDateTime: z.string().optional(),
      endDateTime: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      /**  Added by @Ajay 08-04-2025 (#6199) ---> Custom validation for event-specific fields */
      if (!isOffice365) {
        {
          if (
            data.eventType === 'Phone Call' &&
            (!data.phone || data.phone.trim().length < 5)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('PhoneRequired'),
              path: ['phone'],
            });
          }
          if (
            data.eventType === 'In-Person Meeting' &&
            (!data.location || data.location.trim().length === 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('LocationRequired'),
              path: ['location'],
            });
          }
          if (
            data.eventType === 'Online Meeting' &&
            (!data.meetingUrl ||
              !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(
                data.meetingUrl,
              ))
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('InvalidUrl'),
              path: ['meetingUrl'],
            });
          }
          if (
            data.eventType === 'Online Meeting' &&
            data.meetingUrl &&
            data.meetingUrl.length > 1000
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('UrlExceedsMaxLength'),
              path: ['meetingUrl'],
            });
          }
          /**  Added by @Ajay 08-04-2025 (#6199) ---> Validate target audience selection */
          if (
            !targetAudienceType &&
            (selectedTagList?.length == 0 ||
              selectedContactList?.length == 0 ||
              !selectedTemplate)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('TargetAudienceRequired'),
              path: ['selectedTarget'],
            });
          }

          /**  Added by @Ajay 08-04-2025 (#6199) ---> Ensure end date is not earlier than start date */
          if (data?.startDateTime && data?.endDateTime) {
            const parsedStartDateTime = parsedDate(data?.startDateTime);
            const parsedEndDateTime = parsedDate(data?.endDateTime);
            if (parsedStartDateTime && parsedEndDateTime) {
              if (parsedStartDateTime > parsedEndDateTime) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'End date cannot be earlier than start date.',
                  path: ['endDateTime'],
                });
              }
            }
          }
        }
      }
    });

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Convert schema to type for use in React Hook Form */
  type Schema = z.infer<typeof schema>;

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Initialize the form with default values and validation schema */
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
      eventTitle: '',
      eventType: '',
      selectedTarget: '',
      phone: '',
      description: '',
      startDateTime: '',
      endDateTime: '',
    },
    resolver: zodResolver(schema),
  });

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle event type selection from dropdown */
  const handleEventTypeSelect = (value: EventListModel) => {
    setSelectedEventType(value);
    setValue('eventType', value.name);
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Parse date from string */
  const parsedDate = (date: string) => {
    return parseDate({
      date: date,
      parseFormat: dateFormates.displayDateTime,
    });
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle start date selection */
  const handleStartDatePress = (date?: string) => {
    if (date && date !== startDateTime) {
      setStartDateTime(date);
      setValue('startDateTime', date);
      const parsedStartDateTime = parsedDate(date);
      const parsedEndDateTime = parsedDate(endDateTime);

      if (parsedStartDateTime && parsedEndDateTime) {
        if (parsedStartDateTime > parsedEndDateTime) {
          setEndDateError(t('EndDateGreaterThanStartError'));
        } else {
          setEndDateError('');
        }
      } else {
        setEndDateError('');
      }
    }
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle end date selection */
  const handleEndDatePress = (date?: string) => {
    if (date && date !== endDateTime) {
      setEndDateTime(date);

      setValue('endDateTime', date);
      const parsedStartDateTime = parsedDate(startDateTime);
      const parsedEndDateTime = parsedDate(date);
      if (parsedStartDateTime && parsedEndDateTime) {
        if (parsedStartDateTime > parsedEndDateTime) {
          setEndDateError(t('EndDateGreaterThanStartError'));
        } else {
          setEndDateError('');
        }
      } else {
        setEndDateError('');
      }
    }
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Format the date to a readable format */
  const formatedDate = (date: string) => {
    return formatDate({
      date: date,
      parseFormat: dateFormates.displayDateTime,
      returnFormat: dateFormates.dateInParams,
    });
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Format the time to a readable format */
  const formatedTime = (date: string) => {
    return formatDate({
      date: date,
      parseFormat: dateFormates.displayDateTime,
      returnFormat: dateFormates.timeInParams,
    });
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle the removal of a selected tag from the list */
  const handleRemoveTag = (tag: number) => {
    setSelectedTagList(selectedTagList.filter(item => item.id !== tag));
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContactType = (typeId: number) => {
    setSelectedContactTypeList(
      selectedContactTypeList.filter(item => item.contactType !== typeId),
    );
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContacts = (userId: number) => {
    setSelectedContactList(
      selectedContactList.filter(item => item.userId !== userId),
    );
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle form submission for scheduling the event */
  const onNext = (data: Schema) => {
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

    if (!isTargetValid && !route.params?.item?.isOffice365) return;
    const formData = new FormData();
    if (mediaList.length > 0) {
      const fileType = {
        uri: mediaList[0].uri,
        name: mediaList[0].fileName,
        type: mediaList[0].type,
      };

      formData.append('files', fileType); // Correctly append file object
      UploadFileListToS3Api.mutate({ formData, formValues: data });
    } else {
      triggerSaveEventSchedule(data);
    }
  };

  /**  Added by @Ajay 08-04-2025 ---> Function to trigger saveEventSchedule mutation */
  const triggerSaveEventSchedule = (data?: Schema, imageId?: string) => {
    if (isOffice365) {
      const combineAttendees = [
        ...selectedAttendeesList,
        ...selectedExternalAttendeesList,
      ].map(user => ({
        emailAddress: {
          name: user.emailAddress ?? '',
          address: user.emailAddress ?? '',
        },
        type: 'Required',
      }));

      const queryParam = new URLSearchParams(
        `eventId=${route.params?.taskIdentifier}`,
      ).toString();
      UpdateAttendeesApi.mutate({
        endpoint: `${ApiConstants.UpdateAttendees}${'?'}${queryParam}`,
        payload: JSON.stringify(combineAttendees),
      });
    } else {
      saveEventSchedule.mutate({
        IsSchedule: 'Y',
        Id: route.params?.taskId ?? '0',
        title: data?.eventTitle,
        eventType: selectedEventType?.id,
        phone: data?.phone,
        link: data?.meetingUrl,
        MeetingID: '',
        Passcode: '',
        start_Date: formatedDate(startDateTime),
        start_Time: formatedTime(startDateTime),
        end_Date: formatedDate(endDateTime),
        end_Time: formatedTime(endDateTime),
        organizer: userDetails.userDetails?.fullName,
        description: data?.description,
        AssignedUserList: selectedContactList.map(item => ({
          UserId: item.userId,
        })),
        AssignedTagList: selectedTagList.map(item => ({ TagId: item.id })),
        AssignedContactTypeList: selectedContactTypeList.map(
          item => item.contactType,
        ),
        ProgramId: selectedTemplate?.programID,
        createOrEditEventsDto: {
          Is_Active: true,
          EventType: selectedEventType?.id,
          Organizer: userDetails.userDetails?.fullName,
          CoverImage: imageId ? imageId : uploadedImageId,
          Title: data?.eventTitle,
          isRemove:
            mediaList.length != 0 || imageId || uploadedImageId ? false : true,
          AdditionalInformation: null,
          Description: data?.description,
          Location: data?.location,
          Phone: data?.phone,
          Link: data?.meetingUrl,
          Passcode: '',
          MeetingID: '',
          Start_Date: formatedDate(startDateTime),
          Start_Time: formatDate({
            date: startDateTime,
            parseFormat: dateFormates.displayDateTime,
            returnFormat: dateFormates.dateTimeInParams,
          }),
          End_Date: formatedDate(startDateTime),
          End_Time: formatDate({
            date: endDateTime,
            parseFormat: dateFormates.displayDateTime,
            returnFormat: dateFormates.dateTimeInParams,
          }),
          id: route.params?.taskIdentifier ?? '',
        },
        ScheduleDateTime: formatDate({
          date: startDateTime,
          parseFormat: dateFormates.displayDateTime,
          returnFormat: dateFormates.dateTimeInParams,
        }),
        typeCode: 'Event',
      });
    }

    console.log('Selecting end date : ', startDateTime);
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle the media list update after image selection */
  const handleMediaList = (value: Asset[]) => {
    setMediaList(value);
  };

  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: { formData: FormData; formValues: Schema }) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData.formData,
        byPassRefresh: true,
      }); // API Call
    },
    onMutate(variables) {
      setSaveLoading(true);
    },
    onSettled(data, error, variables, context) {
      setSaveLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result != null && data.result.at(0)?.contentID) {
        Log('image upload result : ' + data.result);
        setUploadedImageId(data.result.at(0)?.contentID!);
        triggerSaveEventSchedule(
          variables.formValues,
          data.result.at(0)?.contentID!,
        );
      } else {
        showSnackbar(
          data.error?.message ? data.error?.message : t('SomeErrorOccured'),
          'danger',
        );
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation for saving event schedule */
  const saveEventSchedule = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<SaveGlobalCalendarAndEventDataModel>({
        endpoint: ApiConstants.SaveGlobalCalendarAndEventData,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate() {
      setSaveLoading(true); /** Show loading indicator while fetching data */
    },
    onSettled(data, error, variables, context) {
      setSaveLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result) {
        if (data.result.status == 1) {
          if (route.params?.taskIdentifier) {
            showSnackbar(t('EventUpdatedSuccessfully'), 'success');
          } else {
            showSnackbar(t('EventSavedSuccessfully'), 'success');
          }

          sendDataBack('EventViewAll', {
            isDetailsUpdated: true,
          } as AddScheduleUpdateReturnProp);
          handleGoBack(navigation);
        } else if (data.result.status == 0 && data?.result?.message) {
          showSnackbar(data?.result?.message, 'danger');
        } else {
          showSnackbar(t('errorSaveEvent'), 'danger');
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation for fetching global event data for editing */
  const getGlobalEventForEdit = useMutation({
    mutationFn: (sendData: {
      payload: Record<string, any>;
      endpoint: string;
    }) => {
      return makeRequest<GetGlobalEventForEdit>({
        endpoint: sendData.endpoint,
        method: HttpMethodApi.Get,
        data: sendData.payload,
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
      if (data?.result?.events) {
        const event = data.result;
        setEventData(event);
        /** Set form values with the event data */
        setValue('eventTitle', event.events?.title || '');
        setValue('startDateTime', event.events?.start_Date || '');
        setValue('endDateTime', event.events?.end_Date || '');
        setValue('phone', event.events?.phone || '');
        setValue('location', event.events?.location || '');
        setValue('meetingUrl', event.events?.link || '');
        setValue(
          'description',
          event.events?.description?.replace(/<[^>]*>/g, '').trim() || '',
        );
        if (event.events?.coverImage) {
          setUploadedImageId(event?.events?.coverImage);
        }

        /** Set event type if available */
        if (event.events?.eventType) {
          const selectedEvent = eventList.find(
            item => item.id == event.events?.eventType,
          );
          if (selectedEvent) {
            setSelectedEventType(
              selectedEvent,
            ); /** Set the selected event type */
            setValue(
              'eventType',
              selectedEvent.name,
            ); /** Set the event type name in form value */
          } else if (event.events?.eventType == 4) {
            setSelectedEventType(eventList[2]);
            setValue('eventType', eventList[2].name);
          } else {
            setSelectedEventType(eventList[0]);
            setValue('eventType', eventList[0].name);
          }
        }

        /** Format and set start and end dates if available */
        if (event.events?.start_Date && event.events?.end_Date) {
          setStartDateTime(
            formatDate({
              date: event.events?.start_Date,
              parseFormat: dateFormates.parseDateFormate,
              returnFormat: dateFormates.displayDateTime,
            }),
          );
          setEndDateTime(
            formatDate({
              date: event.events?.end_Date,
              parseFormat: dateFormates.parseDateFormate,
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

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation for fetching calendar item tags */
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

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation to fetch all users for the global calendar */
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

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation to fetch all Program list for the global calendar */
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

  /**  Added by @Yuvraj 04-11-2025 (#) ---> saving the office365 event */
  const UpdateAttendeesApi = useMutation({
    mutationFn: (sendData: { endpoint: string; payload: string }) => {
      return makeRequest<SaveGlobalCalendarAndEventDataModel>({
        endpoint: sendData.endpoint,
        method: HttpMethodApi.Put,
        data: sendData.payload,
      });
    },
    onMutate() {
      setSaveLoading(true); /** Show loading indicator while fetching data */
    },
    onSettled(data, error, variables, context) {
      setSaveLoading(
        false,
      ); /** Hide loading indicator once data fetch is complete */
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result) {
        if (data.result.status == 1) {
          showSnackbar(t('EventUpdatedSuccessfully'), 'success');

          sendDataBack('EventViewAll', {
            isDetailsUpdated: true,
          } as AddScheduleUpdateReturnProp);
          handleGoBack(navigation);
        } else if (data.result.status == 0 && data?.result?.message) {
          showSnackbar(data?.result?.message, 'danger');
        } else {
          showSnackbar(t('errorSaveEvent'), 'danger');
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 04-11-2025 () ---> fetch the fynancial attendees */
  const GetFynancialAttendeesApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalCalendarContactTypeModel[]>({
        endpoint: ApiConstants.GetFynancialAttendees,
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
        setAttendeesList(data.result);
        if (route.params?.taskId) {
          // If editing an existing message, pre‐select any that are already marked “isSelected”
          const previouslySelected = data.result.filter(
            item => item.isSelected,
          );
          if (previouslySelected.length > 0) {
            setSelectedAttendeesList(previouslySelected);
            // setTargetAudienceType('ContactType');
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });
  /**  Added by @Yuvraj 04-11-2025 () ---> fetch the external attendees */
  const GetExternalAttendeesApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalCalendarContactTypeModel[]>({
        endpoint: ApiConstants.GetExternalAttendees,
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
        setExternalAttendeesList(data.result);
        if (route.params?.taskId) {
          // If editing an existing message, pre‐select any that are already marked “isSelected”
          const previouslySelected = data.result.filter(
            item => item.isSelected,
          );
          if (previouslySelected.length > 0) {
            setSelectedExternalAttendeesList(previouslySelected);
            // setTargetAudienceType('ContactType');
          }
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
              route?.params?.taskIdentifier ? t('EditEvent') : t('CreateEvent')
            }
          />

          {loading ? (
            <Skeleton>
              <View style={styles.skeletonLay}>
                {[...Array(3).keys()].map((_, index) => (
                  <View
                    key={`action-skeleton-${index}`}
                    style={styles.inpuSkel}
                  >
                    <View style={styles.inputValueSkel} />
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
                <FormTextInput
                  name={'eventTitle'}
                  control={control}
                  placeholder={t('EnterEventTitle')}
                  label={t('EventTitle')}
                  enabled={!isOffice365}
                  fillColor={
                    isOffice365 ? theme.colors.surfaceDisabled : undefined
                  }
                  contentStyle={
                    isOffice365
                      ? { color: theme.colors.onSurfaceDisabled }
                      : undefined
                  }
                />

                <Tap
                  onPress={() => {
                    if (saveLoading || isOffice365) {
                      return;
                    }
                    setShowEventTypeDropdown(true);
                  }}
                  style={styles.dropDownSelect}
                >
                  <FormTextInput
                    name={'eventType'}
                    control={control}
                    enabled={false}
                    placeholder={t('EventType')}
                    label={t('EventTypeLabel')}
                    suffixIcon={{
                      source: Images.down,
                      type: ImageType.svg,
                      color: theme.colors.onSurfaceVariant,
                    }}
                    fillColor={
                      isOffice365 ? theme.colors.surfaceDisabled : undefined
                    }
                    contentStyle={
                      isOffice365
                        ? { color: theme.colors.onSurfaceDisabled }
                        : undefined
                    }
                    extraInfoTxt={
                      'Coming soon: You’ll be able to schedule Office 365 Meetings here once our two-way integration is ready.'
                    }
                  />
                </Tap>

                {selectedEventType?.id === 1 && (
                  <FormTextInput
                    name={'phone'}
                    control={control}
                    inputMode={InputModes.phone}
                    placeholder={t('EnterPhoneNumber')}
                    label={t('Phone')}
                  />
                )}

                {selectedEventType?.id === 2 && (
                  <FormTextInput
                    name={'location'}
                    control={control}
                    placeholder={t('EnterLocation')}
                    label={t('Location')}
                  />
                )}

                {selectedEventType?.id === 3 && (
                  <FormTextInput
                    name={'meetingUrl'}
                    control={control}
                    placeholder={t('EnterUrl')}
                    label={t('MeetingUrl')}
                    enabled={!isOffice365}
                    fillColor={
                      isOffice365 ? theme.colors.surfaceDisabled : undefined
                    }
                    contentStyle={
                      isOffice365
                        ? { color: theme.colors.onSurfaceDisabled }
                        : undefined
                    }
                  />
                )}

                <FormTextInput
                  name={'description'}
                  control={control}
                  placeholder={t('EnterDescription')}
                  label={t('Description')}
                  multiLine={true}
                  height={70}
                  maxLines={2}
                  hidePreview={false}
                  enabled={!isOffice365}
                  fillColor={
                    isOffice365 ? theme.colors.surfaceDisabled : undefined
                  }
                  contentStyle={
                    isOffice365
                      ? { color: theme.colors.onSurfaceDisabled }
                      : undefined
                  }
                />

                {!isOffice365 && (
                  <>
                    <CustomText
                      variant={TextVariants.bodyMedium}
                      style={styles.heading}
                    >
                      {t('CoverImage')}
                    </CustomText>
                    {mediaList.length == 0 &&
                    !eventData?.events?.coverImageUrl ? (
                      <Tap
                        style={styles.noImgLayContainer}
                        onPress={() => setShowImageSelectionPopup(true)}
                      >
                        <View style={styles.noImgLay}>
                          <CustomImage
                            source={Images.addCircle}
                            type={ImageType.svg}
                            style={styles.icon}
                            color={theme.colors.primary}
                          />
                          <CustomText style={styles.noImgMsg}>
                            {t('uploadCoverImg')}
                          </CustomText>
                        </View>
                      </Tap>
                    ) : (
                      (mediaList.at(0)?.uri ||
                        eventData?.events?.coverImageUrl) && (
                        <Tap
                          onPress={() => {
                            if (saveLoading) {
                              return;
                            }
                            const imageList = mediaList.map(item => item.uri!);
                            showImagePopup({
                              imageList: imageList,
                              defaultIndex: 0,
                            });
                          }}
                          style={styles.selectedImageContainer}
                        >
                          <View style={styles.imageContainer}>
                            <CustomImage
                              source={{
                                uri: mediaList.at(0)?.uri
                                  ? mediaList.at(0)?.uri
                                  : eventData?.events?.coverImageUrl,
                              }}
                              resizeMode={ResizeModeType.cover}
                              style={styles.selectedImgs}
                            />
                            <Tap
                              onPress={() => {
                                if (saveLoading) {
                                  return;
                                }
                                setMediaList([]);
                                setUploadedImageId('');
                                setEventData(prevState => {
                                  if (prevState && prevState.events) {
                                    return {
                                      ...prevState /** Preserve the previous state */,
                                      events: {
                                        ...prevState.events,
                                        coverImageUrl: null,
                                      } /** Set coverImageUrl to null */,
                                    };
                                  }
                                  return prevState; /** Return the original state if undefined */
                                });
                              }}
                              style={styles.selectedImgDeleteTap}
                            >
                              <CustomImage
                                source={Images.close}
                                type={ImageType.svg}
                                color={theme.colors.onPrimary}
                                style={styles.selectedImgDelete}
                              />
                            </Tap>
                          </View>
                        </Tap>
                      )
                    )}
                  </>
                )}
                <View style={isOffice365 ? styles.divider : styles.divider1} />

                <CustomText
                  style={styles.segmentB}
                  variant={TextVariants.titleMedium}
                >
                  {t('targetAudience')}
                </CustomText>

                {isOffice365 ? (
                  <>
                    <Tap
                      onPress={() => {
                        if (saveLoading) {
                          return;
                        }
                        setShowTargetAudDropdown(true);
                      }}
                      style={styles.dropDownSelect}
                    >
                      <>
                        <CustomText
                          style={styles.attendeeLabel}
                          variant={TextVariants.bodyMedium}
                        >
                          {t('Attendees')}
                        </CustomText>
                        <View style={styles.chipsContainer}>
                          {selectedAttendeesList.length == 0 ? (
                            <CustomText
                              color={theme.colors.outline}
                              variant={TextVariants.bodyMedium}
                            >
                              {t('SelectAttendees')}
                            </CustomText>
                          ) : (
                            selectedAttendeesList.map((item, index) => (
                              <CustomChips
                                key={item.userId} // Always give a key in loop
                                chipId={item.userId}
                                chipLabel={item.name}
                                onCloseClick={value => {
                                  if (value) {
                                    setSelectedAttendeesList(
                                      selectedAttendeesList.filter(
                                        item => item.userId !== value,
                                      ),
                                    );
                                  }
                                }}
                              />
                            ))
                          )}
                        </View>
                      </>
                    </Tap>
                    <Tap
                      onPress={() => {
                        if (saveLoading) {
                          return;
                        }
                        if (externalAttendeesList.length > 0) {
                          setExternalAttendeesPopup(true);
                        } else {
                          showSnackbar(t('NoExternalAttendees'), 'warning');
                        }
                      }}
                      style={[styles.verticalMargin, styles.dropDownSelect]}
                    >
                      <>
                        <CustomText
                          style={styles.attendeeLabel}
                          variant={TextVariants.bodyMedium}
                        >
                          {t('ExternalAttendees')}
                        </CustomText>
                        <View style={styles.chipsContainer}>
                          {selectedExternalAttendeesList.length == 0 ? (
                            <CustomText
                              color={theme.colors.outline}
                              variant={TextVariants.bodyMedium}
                            >
                              {t('NoExternalAttendees')}
                            </CustomText>
                          ) : (
                            selectedExternalAttendeesList.map((item, index) => (
                              <CustomChips
                                key={index + 1}
                                chipId={index + 1}
                                chipLabel={item.name}
                                onCloseClick={value => {
                                  setSelectedExternalAttendeesList(
                                    selectedExternalAttendeesList.filter(
                                      extItem =>
                                        extItem.emailAddress !==
                                        item.emailAddress,
                                    ),
                                  );
                                }}
                              />
                            ))
                          )}
                        </View>
                      </>
                    </Tap>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <View style={styles.divider} />

                <ScheduleDateTimePicker
                  timezone={userDetails?.userDetails?.timeZoneName}
                  startDateTime={startDateTime}
                  endDateTime={endDateTime}
                  endDateError={endDateError}
                  loading={saveLoading}
                  showEndDate={true}
                  enabled={!isOffice365}
                  startDatePress={value => {
                    handleStartDatePress(value);
                  }}
                  endDatePress={value => {
                    handleEndDatePress(value);
                  }}
                />
                <CustomButton
                  style={styles.nextButton}
                  loading={saveLoading}
                  onPress={handleSubmit(onNext)}
                >
                  {t('Schedule')}
                </CustomButton>
              </View>
            </ScrollView>
          )}
          <CustomImagePicker
            showPopup={showImageSelectionPopup}
            setShowPopup={setShowImageSelectionPopup}
            mediaList={handleMediaList}
            crop={true}
            cropHeight={150}
            cropWidth={225}
          />
          <CustomDropDownPopup
            shown={showEventTypeDropdown}
            setShown={setShowEventTypeDropdown}
            title={t('SelectEventType')}
            items={eventList}
            displayKey="name"
            idKey="id"
            selectedItem={selectedEventType}
            onItemSelected={handleEventTypeSelect}
            mode={DropdownModes.single}
          />
          <ScheduleTargetAudiencePopup
            shown={showTargetAudDropdown}
            setShown={setShowTargetAudDropdown}
            tagList={tagList}
            contactList={isOffice365 ? attendeesList : contactList}
            contactTypeList={contactTypeList}
            templateList={templateList}
            selectedType={targetAudienceType}
            selectedTagsList={selectedTagList}
            selectedContactsList={
              isOffice365 ? selectedAttendeesList : selectedContactList
            }
            selectedContactTypesList={selectedContactTypeList}
            selectedTemplate={selectedTemplate}
            attendees={isOffice365}
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
                if (isOffice365) {
                  setSelectedAttendeesList(value!);
                } else {
                  setSelectedContactList(value);
                }
              }
            }}
            onTemplateSelected={value => {
              setSelectedTemplate(value);
            }}
            onContactTypeSelected={value => {
              setSelectedContactTypeList(value!);
            }}
          />
          <CustomBottomPopup
            shown={externalAttendeesPopup}
            setShown={setExternalAttendeesPopup}
            title={t('ExternalAttendees')}
            keyboardHandle
          >
            <CustomDropDownPopup
              // key={'Contacts'}
              loading={false}
              items={externalAttendeesList}
              displayKey="name"
              idKey="emailAddress"
              selectedMultipleItems={selectedExternalAttendeesList}
              mode={DropdownModes.multiple}
              withPopup={false}
              onSave={value => {
                setSelectedExternalAttendeesList(
                  value as GetAllUsersForGlobalCalendarModel[],
                );

                setExternalAttendeesPopup(false);
              }}
            />
          </CustomBottomPopup>
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
    },
    inputValueSkel: {
      height: 20,
      width: 80,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },

    dropDownSelect: {
      padding: 0,
    },
    nextButton: {
      paddingHorizontal: 20,
      borderRadius: theme.roundness,
      marginBottom: 25,
      marginTop: 20,
    },

    noImgLayContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      padding: 10,
      marginTop: 10,
    },
    icon: {
      height: 30,
      width: 30,
      marginTop: 5,
    },
    noImgLay: {
      alignItems: 'center',
    },
    noImgMsg: {
      textAlign: 'center',
      marginTop: 10,
    },

    addImageContainer: {
      height: 80,
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedImageContainer: {
      padding: 0,
    },
    imageContainer: {
      padding: 10,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      marginTop: 5,
    },
    selectedImgs: {
      height: 180,
      width: '100%',
      borderRadius: theme.roundness,
    },
    selectedImgDeleteTap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
      alignItems: 'center',
    },
    selectedImgDelete: {
      height: 15,
      width: 15,
    },
    segmentB: {
      paddingBottom: 10,
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
    divider: {
      marginVertical: 10,
      height: 0.8,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    divider1: {
      marginTop: 35,
      marginBottom: 20,
      height: 0.8,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    verticalMargin: {
      marginVertical: 15,
    },
    targetAudLabel: {
      paddingBottom: 10,
      paddingLeft: 5,
      fontSize: 14,
      fontWeight: 'semibold',
    },
    attendeeLabel: {
      paddingBottom: 10,
      paddingLeft: 5,
    },
    heading: {
      paddingLeft: 5,
    },
    timeZone: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceVariant,
    },
  });

export default AddScheduleEvent;
