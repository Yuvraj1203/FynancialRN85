import {
  CustomAvatar,
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
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomDropDownPopup,
  CustomHeader,
  CustomImagePicker,
  FormTextInput,
} from '@/components/molecules';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import {
  SafeScreen,
  ScheduleDateTimePicker,
  ScheduleTargetAudiencePopup,
} from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
  SaveGlobalCalendarMessageDataModel,
  UploadFileListToS3Model,
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
  showSnackbar,
  useCustomInAppBrowser,
  validateTargetAudience,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { types } from '@react-native-documents/picker';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Asset } from 'react-native-image-picker';
import { Divider } from 'react-native-paper';
import { z } from 'zod';
import { AddScheduleUpdateReturnProp } from '../eventViewAll/eventViewAll';

export enum NavigateScheduleMessageFromEnum {
  directMessage = 'directMessage',
  groupMessage = 'groupMessage',
}

/**  Added by @Yuvraj 14-04-2025 (#6549) ---> Type definition for AddScheduleProps to hold task-related properties */
export type AddScheduleMessageProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
  navigateFrom?: NavigateScheduleMessageFromEnum;
};
function AddScheduleMessage() {
  /**  Added by @Yuvraj 14-04-2025 ---> navigate to different screen (FYN-6549) */
  const navigation = useAppNavigation();

  /**  Added by @Yuvraj 14-04-2025 ---> get params from parent screen (FYN-6549) */
  const route = useAppRoute('AddScheduleMessage').params;

  /**  Added by @Yuvraj 14-04-2025 ---> Access theme provider for UI styling */
  const theme = useTheme();

  /**  Added by @Yuvraj 14-04-2025 ---> Define stylesheet with theme integration */
  const styles = makeStyles(theme);

  /**  Added by @Yuvraj 14-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /** Added by @Yuvraj 14-04-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6549)*/
  const { sendDataBack } = useReturnDataContext();

  /** Added by @Yuvraj 14-04-2025 ---> State for loading indicator (#6549) */
  const [loading, setLoading] = useState(false);

  /**Added by @Yuvraj 30-09-2025 -> Four titles handling */
  const title = useRef('');

  /** Added by @Yuvraj 14-04-2025 ---> save button loading (#6549) */
  const [buttonLoading, setButtonLoading] = useState<'schedule' | 'sendNow'>();

  /** Added by @Yuvraj 14-04-2025 ---> Retrieve user details from store */
  const userDetails = userStore();

  /** Added by @Yuvraj 14-04-2025 ---> to open in app browser links from comments(FYN-6549)*/
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Yuvraj 14-04-2025 --->  Controls visibility of the image picker popup (FYN-6549)*/
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  /** Added by @Yuvraj 14-04-2025 --->  toggling state for text and File (FYN-6549)*/
  // const [selectedStatus, setSelectedStatus] = useState<SegmentedButtonItem>();

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> State management for dropdown visibility of target and reminder list */
  const [showTargetAudDropdown, setShowTargetAudDropdown] = useState(false);

  /** Added by @Yuvraj 14-04-2025 ---> for images */
  const [mediaList, setMediaList] = useState<Asset[]>([]);

  /** Added by @Yuvraj 14-04-2025 ---> for checking on editing if the file is already there */
  const [isFileThere, setIsFileThere] = useState({
    isThere: false,
    messageAttachmentFile: '',
    text: '',
  });
  const onBehalfOfList = [{ value: 'Self' }, { value: 'Primary Advisor' }];
  const [onBehalfOf, setOnBehalfOf] = useState<onBehalfOfModel>(
    onBehalfOfList[0],
  ); // default Self
  const [showOnBehalfOfPopUp, setShowOnBehalfOfPopUp] = useState(false);

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

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const enum DateFormats {
    FullDate = 'MMM-DD-YYYY hh:mm A',
    UIFullDate = 'MMM DD YYYY hh:mm A',
    ApiFullDate = 'YYYY-MM-DDTHH:mm:ss',
  }

  const defaultScheduleDateTime = formatDate({
    date: getCurrentDateTime(),
    returnFormat: DateFormats.UIFullDate,
  });

  /**  Added by @Yuvraj 14-04-2025 ---> Initialize state variables for start date/time (FYN-6549) */
  const [startDateTime, setStartDateTime] = useState<string>(
    defaultScheduleDateTime,
  );

  const [messageData, setMessageData] =
    useState<GetGlobalScheduleDetailForEditModel>();

  /**  Added by @Yuvraj 14-04-2025 ---> Schema defined for form validation using Zod library (FYN-6549) */
  const schema = z.object({
    description: z.string().optional(),
    selectedTarget: z.string().optional(),
    scheduleDateTime: z.string().optional(),
  });

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Convert schema to type for use in React Hook Form */
  type Schema = z.infer<typeof schema>;

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Initialize the form with default values and validation schema */
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
      description: '',
      selectedTarget: '',
      scheduleDateTime: defaultScheduleDateTime,
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    /** Fetch associated tags, contacts,contact types and templates using the task identifier */
    const taskIdentifier = route?.item?.id || 0;
    GetCalItemtags.mutate({ GlobalCalId: taskIdentifier });
    getAllUsersForGlobalCalendar.mutate({ GlobalCalId: taskIdentifier });
    GetGlobalCalendarProgramList.mutate({ GlobalCalId: taskIdentifier });
    GetGlobalCalendarContactTypeApi.mutate({ GlobalCalId: taskIdentifier });
    if (route?.item?.taskIdentifier) {
      if (route.navigateFrom == NavigateScheduleMessageFromEnum.groupMessage) {
        GetGlobalGroupMessageForEditApi.mutate({
          Id: route?.item?.taskIdentifier,
        });
      } else {
        getGlobalScheduleDetailForEditApi.mutate({
          Id: route?.item?.taskIdentifier,
        });
      }
    }
  }, []);

  //title handling
  if (route?.navigateFrom == NavigateScheduleMessageFromEnum.groupMessage) {
    title.current = route?.item
      ? t('EditGroupMessage')
      : t('CreateGroupMessage');
  } else {
    title.current = route?.item
      ? t('EditDirectMessage')
      : t('CreateDirectMessage');
  }

  const bytesToMB = (bytes: number, decimals = 2): number | undefined => {
    if (bytes === 0) return 0;
    const mb = bytes / (1024 * 1024);
    return parseFloat(mb.toFixed(decimals));
  };

  /** Added by @Yuvraj 14-04-2025 -> on selecting new picture from local device (FYN-6549) */
  const handleMediaList = (mediaList: Asset[]) => {
    if (
      mediaList.at(0)?.type == types.pdf ||
      mediaList.at(0)?.type === 'application/pdf'
    ) {
      if (
        mediaList.at(0)?.fileSize &&
        bytesToMB(mediaList.at(0)?.fileSize!)! > 30
      ) {
        showSnackbar(t('MinimumFileSizeMsg'), 'danger');
        return;
      } else {
        setMediaList(mediaList);
      }
    } else {
      setMediaList(mediaList);
    }
    //setShowImageSendPopup(true);
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected tag from the list */
  const handleRemoveTag = (tag: number) => {
    setSelectedTagList(selectedTagList.filter(item => item.id !== tag));
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContacts = (userId: number) => {
    setSelectedContactList(
      selectedContactList.filter(item => item.userId !== userId),
    );
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContactType = (typeId: number) => {
    setSelectedContactTypeList(
      selectedContactTypeList.filter(item => item.contactType !== typeId),
    );
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle start date selection */
  const handleStartDatePress = (date?: string) => {
    if (date && date !== startDateTime) {
      setStartDateTime(date);
      setValue('scheduleDateTime', date);
    }
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> handle submit */
  const sendData = (msg?: string, isSendNow?: boolean) => {
    const messageDto =
      route?.navigateFrom == NavigateScheduleMessageFromEnum.groupMessage
        ? {
            createOrEditScheduleGroupMessagesDto: {
              Message: msg,
              previewVisible: isPreviewVisible,

              ...(!selectedTemplate && {
                FromSelf: onBehalfOf.value === 'Self' ? true : false,
              }),
            },
            TypeCode: 'GroupMessage',
          }
        : {
            createOrEditScheduleMessagesDto: {
              Message: msg,
              previewVisible: isPreviewVisible,
              ...(!selectedTemplate && {
                FromSelf: onBehalfOf.value === 'Self' ? true : false,
              }),
            },
            TypeCode: 'Message',
          };

    const messagePayload = {
      id: route?.item?.id ?? 0,
      ScheduleDateTime: isSendNow
        ? null
        : formatDate({
            date: getValues('scheduleDateTime')!,
            parseFormat: DateFormats.UIFullDate,
            returnFormat: DateFormats.FullDate,
          }),
      ...messageDto,
      deletedImageIds: [],
      organizer: userDetails.userDetails?.fullName,
      AssignedTagList: selectedTagList.map(item => ({ TagId: item.id })),
      AssignedUserList: selectedContactList.map(item => ({
        UserId: item.userId,
      })),
      AssignedContactTypeList: selectedContactTypeList.map(
        item => item.contactType,
      ),
      ProgramId: selectedTemplate?.programID,
      IsSchedule: 'Y',
    };

    if (route?.navigateFrom == NavigateScheduleMessageFromEnum.groupMessage) {
      SaveGlobalCalendarGroupMessageDataApi.mutate(messagePayload);
    } else {
      saveGlobalCalendarMessageDataApi.mutate(messagePayload);
    }
  };

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
          dataManipulationBeforeSend(data, isSendNow);
        },
      });
    } else {
      dataManipulationBeforeSend(data);
    }
  };

  const dataManipulationBeforeSend = (data: Schema, isSendNow?: boolean) => {
    Log(' data in the dataManipulationBeforeSend :  ' + JSON.stringify(data));
    if (isFileThere.isThere) {
      Log(' case 1 ');
      if (!isEmpty(data.description)) {
        Log(' case 1AAA ');
        sendData(
          `${isFileThere.messageAttachmentFile}${data.description}`,
          isSendNow,
        );
      } else {
        Log(' case 1BB ');
        sendData(isFileThere.messageAttachmentFile, isSendNow);
      }
    } else if (mediaList?.length! > 0) {
      Log(' case 3 ');

      const formData = new FormData();
      const fileType = {
        uri: mediaList?.at(0)?.uri,
        name: mediaList?.at(0)?.fileName,
        type: mediaList?.at(0)?.type,
      };

      formData.append('files', fileType); // Correctly append file object

      // formData.append('fileName', mediaList);
      UploadFileListToS3Api.mutate({
        sendData: formData,
        name: mediaList?.at(0)?.fileName,
        type:
          mediaList?.at(0)?.type == types.pdf ||
          mediaList.at(0)?.type === 'application/pdf'
            ? 'pdf'
            : 'photo',
        isSendNow: isSendNow,
        text: data.description,
      });
    } else if (!isEmpty(data.description)) {
      Log(' case 2 ');

      sendData(data.description, isSendNow);
    } else {
      showSnackbar(t('MessageRequired'), 'danger');
    }
  };

  const extractImageName = (messageAttachment: string) => {
    try {
      // Step 1: Remove [image]
      const jsonString = messageAttachment.replace('[image]', '').trim();

      // Step 2: Parse JSON
      const obj = JSON.parse(jsonString);

      // Step 3: Return name
      return obj?.name ?? null;
    } catch (err) {
      console.warn('Invalid attachment format:', err);
      return null;
    }
  };

  /** Added by @Yuvraj 14-04-2025 -> Api for uploading picture and getting id (FYN-6549) */
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: {
      sendData: Record<string, any>;
      name?: string;
      type?: string;
      isSendNow?: boolean;
      text?: string;
    }) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=chat`,
        method: HttpMethodApi.Post,
        data: sendData.sendData,
      }); // API Call
    },
    onMutate(variables) {
      setButtonLoading(variables.isSendNow ? 'sendNow' : 'schedule');
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setButtonLoading(undefined);
      }
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result && data?.result?.at(0)?.fullImagePath) {
        let msg;
        Log(
          'file type which is going to be scheduled ::::::::: ------> ' +
            mediaList?.at(0)?.type,
        );
        if (data.result && data?.result?.at(0)?.contentType?.includes('pdf')) {
          // File message
          msg = `[file]{ "id": "${
            data?.result?.at(0)?.imagePathS3
          }", "name": "${mediaList?.at(0)?.fileName}", "contentType": "${
            mediaList?.at(0)?.type
          }" }${variables.text}`;
        } else if (
          data.result &&
          data?.result?.at(0)?.contentType?.includes('image')
        ) {
          // Image message
          msg = `[image]{ "id": "${
            data?.result?.at(0)?.imagePathS3
          }", "name": "${mediaList?.at(0)?.fileName}", "contentType": "${
            mediaList?.at(0)?.type
          }" }${variables.text}`;
        }

        sendData(msg, variables.isSendNow);
      } else {
        showSnackbar(data.error?.message ?? '', 'danger');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
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
        if (route?.item?.id) {
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
        if (route?.item?.id) {
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
        if (route?.item?.id) {
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
        if (route?.item?.id) {
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

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> send or schedule the message */
  const saveGlobalCalendarMessageDataApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<SaveGlobalCalendarMessageDataModel>({
        endpoint: ApiConstants.SaveGlobalCalendarMessageData,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (!buttonLoading) {
        setButtonLoading(variables.ScheduleDateTime ? 'schedule' : 'sendNow');
      }
    },
    onSettled(data, error, variables, context) {
      setButtonLoading(undefined);
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data.result.status == 1) {
        showSnackbar(t('MessageAddedSuccessfully'), 'success');
        sendDataBack('EventViewAll', {
          isDetailsUpdated: true,
        } as AddScheduleUpdateReturnProp);
        handleGoBack(navigation);
      } else if (data?.result?.status == 0 && data?.result?.message) {
        showSnackbar(data?.result?.message, 'danger');
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> send or schedule the group message */
  const SaveGlobalCalendarGroupMessageDataApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<SaveGlobalCalendarMessageDataModel>({
        endpoint: ApiConstants.SaveGlobalCalendarGroupMessageData,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (!buttonLoading) {
        setButtonLoading(variables.ScheduleDateTime ? 'schedule' : 'sendNow');
      }
    },
    onSettled(data, error, variables, context) {
      setButtonLoading(undefined);
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result && data.result.status == 1) {
        showSnackbar(t('MessageAddedSuccessfully'), 'success');
        sendDataBack('EventViewAll', {
          isDetailsUpdated: true,
        } as AddScheduleUpdateReturnProp);
        handleGoBack(navigation);
      } else if (data?.result?.status == 0 && data?.result?.message) {
        showSnackbar(data?.result?.message, 'danger');
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 08-04-2025 -> initial api for getting event data from advisor end if edit (FYN-6456) */
  const getGlobalScheduleDetailForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalMessageForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setTimeout(() => {
        //data manipulation is taking time
        setLoading(false); //
      }, 500);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        setMessageData(data.result);
        if (!selectedTemplate) {
          if (data.result.scheduleMessage?.fromSelf === true) {
            setOnBehalfOf(onBehalfOfList[0]);
          } else {
            setOnBehalfOf(onBehalfOfList[1]);
          }
        }
        Log('getValues of description :: ' + getValues('description'));
        if (!isEmpty(data.result.scheduleMessage?.messageText)) {
          setValue('description', data.result.scheduleMessage?.messageText);
        }

        if (
          data.result.scheduleMessage?.messageAttachment?.includes('[image]')
        ) {
          setMediaList([
            {
              ...mediaList?.at(0),
              uri: data.result.imageURL!,
              fileName: extractImageName(
                data.result.scheduleMessage?.messageAttachment!,
              ),
            },
          ]);
          setIsFileThere({
            isThere: true,
            messageAttachmentFile:
              data.result?.scheduleMessage?.messageAttachment!,
            text: !isEmpty(data.result.scheduleMessage?.messageText)
              ? data.result.scheduleMessage?.messageText!
              : '',
          });
        } else if (
          data.result.scheduleMessage?.messageAttachment?.includes('[file]')
        ) {
          setMediaList([
            {
              ...mediaList?.at(0),
              uri: data.result.imageURL!,
              type: types.pdf,
              fileName: data.result.scheduleMessage?.fileName!,
            },
          ]);
          setIsFileThere({
            isThere: true,
            messageAttachmentFile:
              data.result?.scheduleMessage?.messageAttachment!,
            text: !isEmpty(data.result.scheduleMessage?.messageText)
              ? data.result.scheduleMessage?.messageText!
              : '',
          });
        }

        handleStartDatePress(
          formatDate({
            date: data.result?.scheduleMessage?.scheduleTime!,
            parseFormat: DateFormats.ApiFullDate,
            returnFormat: DateFormats.UIFullDate,
          }),
        );
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 08-04-2025 -> data for edit GROUP message (FYN-6456) */
  const GetGlobalGroupMessageForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalGroupMessageForEdit,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setTimeout(() => {
        //data manipulation is taking time
        setLoading(false); //
      }, 500);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        setMessageData(data.result);
        if (data.result.scheduleGroupMessage?.fromSelf === true) {
          setOnBehalfOf(onBehalfOfList[0]);
        } else {
          setOnBehalfOf(onBehalfOfList[1]);
        }

        if (!isEmpty(data.result.scheduleGroupMessage?.messageText)) {
          setValue(
            'description',
            data.result.scheduleGroupMessage?.messageText,
          );
        }

        if (
          data.result.scheduleGroupMessage?.messageAttachment?.includes(
            '[image]',
          )
        ) {
          setMediaList([
            {
              ...mediaList?.at(0),
              uri: data.result.imageURL!,
              fileName: extractImageName(
                data.result.scheduleGroupMessage?.messageAttachment!,
              ),
            },
          ]);
          setIsFileThere({
            isThere: true,
            messageAttachmentFile:
              data.result?.scheduleGroupMessage?.messageAttachment!,
            text: !isEmpty(data.result.scheduleGroupMessage?.messageText)
              ? data.result.scheduleGroupMessage?.messageText!
              : '',
          });
        } else if (
          data.result.scheduleGroupMessage?.messageAttachment?.includes(
            '[file]',
          )
        ) {
          setMediaList([
            {
              ...mediaList?.at(0),
              uri: data.result.imageURL!,
              type: types.pdf,
              fileName: data.result.scheduleGroupMessage?.fileName!,
            },
          ]);
          setIsFileThere({
            isThere: true,
            messageAttachmentFile:
              data.result?.scheduleGroupMessage?.messageAttachment!,
            text: !isEmpty(data.result.scheduleGroupMessage?.messageText)
              ? data.result.scheduleGroupMessage?.messageText!
              : '',
          });
        }

        handleStartDatePress(
          formatDate({
            date: data.result?.scheduleGroupMessage?.scheduleTime!,
            parseFormat: DateFormats.ApiFullDate,
            returnFormat: DateFormats.UIFullDate,
          }),
        );
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
          <CustomHeader showBack title={title.current} />
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
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <CustomAvatar
                  source={
                    !isEmpty(userDetails.userDetails?.profileImageUrl) && {
                      uri: userDetails.userDetails?.profileImageUrl,
                    }
                  }
                  text={
                    isEmpty(userDetails.userDetails?.profileImageUrl)
                      ? userDetails.userDetails?.fullName
                      : undefined
                  }
                />
                <CustomText
                  variant={TextVariants.labelLarge}
                  color={theme.colors.primary}
                >
                  {userDetails.userDetails?.fullName}
                </CustomText>
              </View>
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
                    showError={false}
                    suffixIcon={{
                      source: Images.down,
                      type: ImageType.svg,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  />
                </Tap>
              )}

              <FormTextInput
                name={'description'}
                onLinkPreviewChange={data => {
                  setIsPreviewVisible(!!data);
                }}
                control={control}
                placeholder={t('StartWritingHere')}
                multiLine={true}
                maxLines={5}
                height={80}
                hidePreview={false}
              />

              <CustomText
                variant={TextVariants.labelMedium}
                color={theme.colors.outline}
                style={styles.noteStyle}
              >
                {route?.navigateFrom ==
                NavigateScheduleMessageFromEnum.groupMessage
                  ? t('GroupMessageNote')
                  : t('DirectMessageNote')}
              </CustomText>

              {mediaList && mediaList.length > 0 ? (
                <View style={styles.mediaLayView}>
                  <Tap
                    onPress={() => {
                      if (
                        mediaList.at(0)?.type == types.pdf ||
                        mediaList.at(0)?.type === 'application/pdf'
                      ) {
                        showImagePopup({
                          pdfUrl: mediaList.at(0)?.uri,
                        });
                      } else {
                        if (mediaList.at(0)?.uri) {
                          showImagePopup({
                            imageList: [mediaList.at(0)?.uri!],
                          });
                        }
                      }
                    }}
                    style={styles.selectedImageContainer}
                  >
                    <>
                      <View style={styles.selectedImgs}>
                        <View
                          style={
                            mediaList.at(0)?.type == types.pdf ||
                            mediaList.at(0)?.type === 'application/pdf'
                              ? styles.pdfLay
                              : { flex: 1 }
                          }
                        >
                          <CustomImage
                            source={
                              mediaList.at(0)?.type == types.pdf ||
                              mediaList.at(0)?.type === 'application/pdf'
                                ? Images.pdf
                                : { uri: mediaList?.at(0)?.uri }
                            }
                            resizeMode={ResizeModeType.cover}
                            style={
                              mediaList.at(0)?.type == types.pdf ||
                              mediaList.at(0)?.type === 'application/pdf'
                                ? styles.selectedPdf
                                : styles.selectedImgs
                            }
                            type={
                              mediaList.at(0)?.type == types.pdf ||
                              mediaList.at(0)?.type === 'application/pdf'
                                ? ImageType.svg
                                : undefined
                            }
                            color={
                              mediaList.at(0)?.type == types.pdf ||
                              mediaList.at(0)?.type === 'application/pdf'
                                ? theme.colors.outline
                                : undefined
                            }
                          />
                        </View>
                        <Tap
                          onPress={() => {
                            setMediaList([]);
                            setIsFileThere({
                              isThere: false,
                              messageAttachmentFile: '',
                              text: '',
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
                    </>
                  </Tap>
                  <CustomText
                    style={styles.filename}
                    ellipsis={TextEllipsis.tail}
                    variant={TextVariants.labelLarge}
                    maxLines={2}
                  >
                    {mediaList?.at(0)?.fileName}
                  </CustomText>
                </View>
              ) : (
                <Tap
                  style={styles.noImgLayContainer}
                  onPress={() => {
                    setShowImageSelectionPopup(true);
                  }}
                >
                  <View style={styles.noImgLay}>
                    <CustomImage
                      source={Images.camera}
                      type={ImageType.svg}
                      style={styles.icon}
                      color={theme.colors.primary}
                    />
                    <CustomText style={styles.noImgMsg}>
                      {t('UploadImagePdf')}
                    </CustomText>
                  </View>
                </Tap>
              )}

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
                  loading={buttonLoading == 'sendNow'}
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
                loading={buttonLoading == 'schedule'}
                onPress={handleSubmit(data => {
                  onSubmit(data, false);
                })}
              >
                {t('Schedule')}
              </CustomButton>
            </ScrollView>
          )}
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
          <CustomImagePicker
            showPopup={showImageSelectionPopup}
            setShowPopup={setShowImageSelectionPopup}
            mediaList={handleMediaList}
            crop={true}
            showFile
          />

          <ScheduleTargetAudiencePopup
            shown={showTargetAudDropdown}
            setShown={setShowTargetAudDropdown}
            showCommunity={
              route?.navigateFrom !=
              NavigateScheduleMessageFromEnum.groupMessage
            }
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
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    PopUpStyle: { flex: 1, height: 120 },

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
    profileInfo: {
      flexDirection: 'row',
      gap: 15,
      alignItems: 'center',
    },
    dp: {
      width: 40,
      height: 40,
      borderRadius: theme.roundness,
    },
    noImgLayContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      padding: 10,
      marginTop: 10,
    },
    noImgLay: {
      alignItems: 'center',
    },
    noImgMsg: {
      textAlign: 'center',
      marginTop: 10,
    },
    icon: {
      height: 20,
      width: 20,
      marginTop: 5,
    },
    selectedImageContainer: {
      justifyContent: 'center',
      //alignItems: 'center',
      padding: 0,
      marginTop: 0,
    },
    imageContainer: {
      alignSelf: 'flex-start',
    },
    selectedImgs: {
      height: 80,
      width: 80,
      borderRadius: theme.lightRoundness,
    },
    filename: {
      marginTop: 5,
      flex: 1,
      //maxWidth: 100,
      marginHorizontal: 10,
      alignSelf: 'center',
    },
    selectedImgTap: {
      height: 80,
      width: 80,
      borderRadius: theme.lightRoundness,
      marginRight: 5,
    },
    selectedImg: {
      height: '100%',
      width: '100%',
      borderRadius: theme.lightRoundness,
    },
    selectedImgDeleteTap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderBottomLeftRadius: theme.lightRoundness,
      borderBottomRightRadius: theme.lightRoundness,
      alignItems: 'center',
    },
    selectedImgDelete: {
      height: 10,
      width: 10,
    },
    reportBtn: {
      marginVertical: 20,
    },
    imageSendMain: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    pdf: {
      height: '100%',
      width: '100%',
    },
    sendImageIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 40,
      height: 40,
      marginHorizontal: 2,
      padding: 8,
      marginTop: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageSendImg: {
      width: '100%',
      height: '100%',
    },
    send: {
      height: 22,
      width: 22,
    },
    backBtnLay: { padding: 10, position: 'absolute' },
    backBtn: {
      height: 40,
      width: 40,
    },
    //this is new
    divider: {
      marginVertical: 30,
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: 5,
      padding: 10,
      borderWidth: 1,
      borderRadius: 12,
      borderColor: theme.colors.outline,
    },
    sendNowButton: {
      marginBottom: 15,
      marginTop: 20,
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
    segmentedBtn: {
      marginTop: 25,
      paddingHorizontal: 3,
    },
    saveButton: {
      marginTop: 10,
      marginBottom: 30,
    },
    noteStyle: {
      fontStyle: 'italic',
    },
    paddingZero: {
      padding: 0,
    },
    OnbehalfofInput: {
      marginTop: 15,
    },
    camera: {
      height: 35,
      width: 35,
      marginBottom: Platform.OS === 'ios' ? 2 : 0, // Apply marginTop only for iOS
    },
    mediaLayView: { flexDirection: 'row', marginTop: 10 },
    pdfLay: {
      flex: 1,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.lightRoundness,
      paddingHorizontal: 10,
      paddingTop: 5,
      paddingBottom: 25,
    },
    selectedPdf: {
      height: '100%',
      width: '100%',
      borderRadius: theme.lightRoundness,
    },
  });

export default AddScheduleMessage;
