import {
  CustomButton,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  Skeleton,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomBottomPopup,
  CustomDatePicker,
  CustomHeader,
  CustomImagePicker,
  CustomPopup,
  CustomTextInput,
  FormTextInput,
} from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { hideLoader, showLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ChangeStatusModel,
  GetAllStateForLookUpTableModel,
  GetConnectionModel,
  GetCurrentStatusModel,
  GetFileAndBreadcrumbModel,
  GetUserActiveTemplateModel,
  GetUserContactInfoModel,
  GetUserDetailForProfileModel,
  GetUserNotesModel,
  GetUserPersonalInfoModel,
  UploadFileListToS3Model,
  UserRoleEnum,
} from '@/services/models';
import { GetAllUserCertificatesModel } from '@/services/models/getAllUserCertificatesModel/getAllUserCertificatesModel';
import { templateStore, tenantDetailStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
  useTabPress,
} from '@/utils/navigationUtils';
import {
  formatDate,
  formatDateUtcReturnLocalTime,
  handleOpenDialer,
  isEmpty,
  parseDate,
  showSnackbar,
  useLogout,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { ActivityIndicator } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { z } from 'zod';
import { ContactVaultParentScreenType } from '../contactVault/contactVault';
import { FeedParentScreenType } from '../feed/feed';
import ProfileHeader from './profileHeader';

export type ProfileProps = {
  // item?: GetAllClientsModelItems;
  userId?: number;
  navigationFrom?: ContactVaultParentScreenType;
  folderID?: string;
  fileId?: string;
  fileIds?: string[];
};

export type ProfileReturnProp = {
  isDetailsUpdated?: boolean;
  goBack?: boolean;
  isCertCreateOrEdit?: boolean;
};

/**  Added by @Akshita 21-04-2025 (#5821) ---> Enum for various date formates */
export enum UserStatus {
  Available = 'Available',
  Busy = 'Busy',
  OutOfOffice = 'Out of office',
}

/**  Added by @Akshita 21-04-2025 (#5821) ---> Enum for various date formates */
enum DateSelectionType {
  start = 'start',
  end = 'end',
}

/**  Added by @Yuvraj 21-04-2025 (#5821) ---> Enum for various date formates */
export const enum DateFormats {
  parseDateFormat = 'YYYY-MM-DDThh:mm:ss',
  displayShortMonth = 'MMM DD, YYYY',
  displayFullMonth = 'MMMM DD, YYYY',
  isoDate = 'YYYY-MM-DD',
  ApiDob = 'MM/DD/YYYY hh:mm:ss A',
  FullDate = 'YYYY-MM-DDThh:mm:ss.ss',
  UIDate = 'MMM DD, YYYY hh:mm A',
  MonthYearUI = 'MMM YYYY',
  MonthYearAPI = 'YYYY-MM',
}

// const getDefaultStartDateTime = (): Date => {
//   const now = new Date();
//   return new Date(now.getTime() + 15 * 60 * 1000);
// };
const getDefaultStartDateTime = (): Date => {
  const now = new Date();
  let minutes = now.getMinutes();

  // Round minutes to the nearest multiple of 15
  let roundedMinutes = Math.ceil(minutes / 15) * 15;

  // If the rounded minutes are 60, reset to 0 and increment the hour
  if (roundedMinutes === 60) {
    now.setMinutes(0);
    now.setHours(now.getHours() + 1);
  } else {
    // If the current time is closer to the next interval (within 5 minutes)
    if (minutes < roundedMinutes - 5) {
      now.setMinutes(roundedMinutes);
    } else {
      // Otherwise, round to the next 15-minute interval
      now.setMinutes(roundedMinutes + 15);
    }
  }

  return now;
};

const getDefaultEndDateTime = (): Date => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23, // hour
    59, // minute
    0, // second
    0, // millisecond
  );
};

function Profile() {
  /** Added by @Yuvraj 19-03-2025 -> navigate to different screen (FYN-5821) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 19-03-2025 -> get params from parent screen (FYN-5821) */
  const route = useAppRoute('Profile');

  /** Added by @Yuvraj 19-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5821) */
  const theme = useTheme();

  /** Added by @Yuvraj 19-03-2025 -> access StylesSheet with theme implemented (FYN-5821) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 19-03-2025 -> translations for labels (FYN-5821) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 19-03-2025 -> Retrieve user details from store (FYN-5821)*/
  const userDetails = userStore(state => state.userDetails);

  const tenantDetails = tenantDetailStore.getState().tenantDetails;

  const setUserDetails = userStore(state => state.setUserDetails);

  /**  Added by @Yuvraj 19-03-2025 -> session store to get user enrolled templates */
  const templateDetails = templateStore();

  const [selectedTemplateItem, setSelectedTemplate] =
    useState<GetUserActiveTemplateModel>(templateDetails?.selectedTemplate!);

  /**  Added by @Yuvraj 19-03-2025 -> logout function (FYN-5821)*/
  const { logout } = useLogout();

  /** Added by @Yuvraj 24-03-2025 -> loading state for whole ui (FYN-5997) */
  const [loading, setLoading] = useState(false);
  const [currentStatusLoading, setCurrentStatusLoading] = useState(false);

  /** Added by @Yuvraj 24-03-2025 -> loading state for individual ui (FYN-5997) */
  const [individualLoading, setIndividualLoading] = useState({
    UserStatus: false,
    personalDetails: false,
    contactDetails: false, // contact loader is same for header details
    notes: false,
    licenses: false, //Added by shivang for adding licenses & Certificate work
  });

  const [AllUserCertificates, setAllUserCertificates] = useState<
    GetAllUserCertificatesModel[]
  >([]);

  const [selectedUserCertificate, setSelectedUserCertificate] =
    useState<GetAllUserCertificatesModel>();

  /** Added by @Yuvraj 19-03-2025 -> loading state for button (FYN-5821) */
  const [loadingButtons, setLoadingButtons] = useState<string>();

  /** Added by @Yuvraj 19-03-2025 -> state for accordian open and close (FYN-5821) */
  const [accordianTab, setAccordianTab] = useState<
    '' | 'personal' | 'contact' | 'templates' | 'notes' | 'licenses'
  >('');

  /** Added by @Yuvraj 19-03-2025 -> state variables for profile pic selection (FYN-5821)*/
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  /** Added by @Yuvraj 19-03-2025 -> show logout dialog (FYN-5821)*/
  const [showLogout, setShowLogout] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isChangeSaveBtnLabel, setIsChangeSaveBtnLabel] = useState(false);

  /** Added by @Yuvraj 24-03-2025 -> state for checking if the fields are editable (rn dummy) (FYN-5997) */
  const [isContact, setIsContact] = useState(!userDetails?.isAdvisor);

  /** Added by @Yuvraj 24-03-2025 -> state for poping action sheet for action item and feed (FYN-5997) */
  const [showActionSheet, setShowActionSheet] = useState(false);

  /** Added by @Yuvraj 24-03-2025 -> data as per this detail for actionsheet (FYN-5997) */
  const [actionSheetItem, setActionSheetItem] = useState<
    'actionItem' | 'feedItem'
  >();

  type ListArray = {
    label?: string;
    value?: string;
    icon?: string;
  };
  type AccordianData = {
    personal?: ListArray[];
    contact?: ListArray[];
  };
  /** Added by @Yuvraj 24-03-2025 -> data for details sections/accordian (FYN-5997) */
  const [accordianData, setAccordianData] = useState<AccordianData>();

  /** Added by @Yuvraj 31-03-2025 -> data for notes accordian (FYN-6014) */
  const [personalDetails, setPersonalDetails] =
    useState<GetUserPersonalInfoModel>();

  /**  Added by @Yuvraj 24-03-2025 -> for saving contact details (FYN-5997)*/
  const [contactData, setContactData] = useState<GetUserContactInfoModel>();

  /** Added by @Yuvraj 24-03-2025 -> data for notes accordian (FYN-5997) */
  const [notesData, setNotesData] = useState<GetUserNotesModel[]>();

  /** Added by @Yuvraj 24-03-2025 -> state for bottom popup notes adding (FYN-5997) */
  const [showAddNote, setShowAddNote] = useState(false);

  /** Added by @Akshita 23-06-2025 -> tags popup state (FYN-6900) */
  const [currentStatusData, setCurrentStatusData] =
    useState<GetCurrentStatusModel>();

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [selectedStatus, setSelectedStatus] = useState<string>();

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [statusToBeUpdated, setStatusToBeUpdated] = useState<string>('');

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [isStatusUpdatedFromOutOfOffice, setIsStatusUpdatedFromOutOfOffice] =
    useState(false);

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [statusLoading, setStatusLoading] = useState(false);

  /**
   *  Added by @Akshita 27-03-2025 -> handle warning popup when user tries to change the state from out of office
   * to any other state without turning it off at the first place(FYN-6900)
   *  */
  const [showOutOfOfficeWarningPopUp, setShowOutOfOfficeWarningPopUp] =
    useState(false);

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [dltOutOfOfcLoading, setDltOutOfOfcLoading] = useState(false);

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [showStatusPopUp, setShowStatusPopUp] = useState(false);

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [showDateSelectionPopUp, setShowDateSelectionPopUp] = useState(false);

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [errorMsg, setErrorMsg] = useState<string>('');

  /** Added by @Akshita 27-03-2025 -> tags popup state (FYN-6900)  */
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**  Added by @Akshita 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
  const [startDateTime, setStartDateTime] = useState<string>(
    formatDate({
      date: getDefaultStartDateTime(),
      returnFormat: 'MMM DD YYYY hh:mm a',
    }),
  );

  /**  Added by @Akshita 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
  const [endDateTime, setEndDateTime] = useState<string>(
    formatDate({
      date: getDefaultEndDateTime(),
      returnFormat: 'MMM DD YYYY hh:mm a',
    }),
  );

  /**  Added by @Akshita 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
  const [dateSelection, setDateSelection] = useState<DateSelectionType>(
    DateSelectionType.start,
  );

  const [showCertificateDetailPopUp, setShowCertificateDetailPopUp] =
    useState(false);

  /** Added by @Akshita 05-02-25 --->  Validation for the message input field (FYN-4314)*/
  const schema = z.object({
    message: z.string().min(3).max(256),
  });

  /** Added by @Akshita 05-02-25 --->  Inferring schema type for form control  (FYN-4314)*/
  type Schema = z.infer<typeof schema>;
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
    defaultValues: {
      message: '',
    },
    /** Added by @Akshita 05-02-25 ---> Validation resolver using Zod schema (FYN-4314)*/
    resolver: zodResolver(schema),
  });

  /** Added by @Yuvraj 24-03-2025 -> state for popup of deleting notes (FYN-5997) */
  const [deleteNoteId, setDeleteNoteId] = useState<number>();

  /** Added by @Yuvraj 19-03-2025 ---> send data back to previous screen(FYN-5997) */
  const { receiveDataBack } = useReturnDataContext();

  receiveDataBack('Profile', (data: ProfileReturnProp) => {
    if (data.isDetailsUpdated) {
      // Added by @Yuvraj 19-03-2025 ---> Updates state with daily dashboard data
      if (route?.params?.userId) {
        triggerRefreshForContact();
      } else {
        getUserDetailForProfileApiCall.mutate({});
        GetUserPersonalInfoApi.mutate({
          userId: userDetails?.userID,
        });
        GetUserContactInfoApi.mutate({
          userId: userDetails?.userID,
        });
      }
    } else if (data.isCertCreateOrEdit) {
      getAllUserCertificatesApiCall.mutate({
        Id: userDetails?.userID,
      });
    } else if (data.goBack) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  });

  /** Added by @Yuvraj 24-03-2025 -> data for details sections/accordian (FYN-5997) */
  const contactSummaryActionButtons = [
    {
      icon: Images.message,
      onPress: () => {
        if (contactData?.userStatus == 3) {
          navigation.navigate('Chat', {
            //screenType: ChatScreenParent.fromNotification,
            userChatData: {
              targetUserId: route?.params?.userId,
              targetUserName: contactData?.fullName,
              userFullName: contactData?.fullName,
              targetProfilePicture: contactData?.profileImage,
            },
          });
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
      enabled: contactData?.userStatus == 3 ? true : false,
    },
    {
      icon: Images.actionItem,
      onPress: () => {
        if (contactData?.userStatus == 3) {
          setActionSheetItem('actionItem');
          setShowActionSheet(true);
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
      enabled: contactData?.userStatus == 3 ? true : false,
    },
    {
      icon: Images.newspaper,
      onPress: () => {
        if (contactData?.userStatus == 3) {
          setActionSheetItem('feedItem');
          setShowActionSheet(true);
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
      enabled: contactData?.userStatus == 3 ? true : false,
    },
    {
      icon: Images.contactUs,
      onPress: () => {
        if (
          contactData &&
          contactData.phone?.trim() &&
          contactData.countryCode?.trim()
        ) {
          let phoneNumber = `${contactData?.countryCode} ${contactData?.phone}`;
          handleOpenDialer(phoneNumber);
        } else {
          if (contactData?.userStatus != 3) {
            showSnackbar(t('ContactNotActive'), 'danger');
          } else {
            showSnackbar(t('PhoneNumberNotAvail'), 'danger');
          }
        }
      },
      enabled:
        contactData &&
        contactData.phone?.trim() &&
        contactData.countryCode?.trim()
          ? true
          : false,
    },
  ];

  /** Added by @Yuvraj 24-03-2025 -> incontactSummary - for calling api for getting personal
   * data of contact (FYN-5997) */
  useEffect(() => {
    if (
      userDetails &&
      route?.params?.userId &&
      route.params.navigationFrom !=
        ContactVaultParentScreenType.fromMyTeamsAdvisor
    ) {
      if (!route.params.fileIds) {
        hideLoader();
      }
      triggerRefreshForContact();
    } else if (
      route?.params?.navigationFrom ==
      ContactVaultParentScreenType.fromMyTeamsAdvisor
    ) {
      getAllUserCertificatesApiCall.mutate({
        Id: route?.params?.userId,
      });
      GetUserPersonalInfoApi.mutate({
        userId: route?.params?.userId,
      });
      GetUserContactInfoApi.mutate({
        userId: route?.params?.userId,
      });
    } else if (userDetails?.isAdvisor && !route?.params?.userId) {
      getCurrentStatusApi.mutate({});
      getAllUserCertificatesApiCall.mutate({
        Id: userDetails?.userID,
      });
      GetUserPersonalInfoApi.mutate({
        userId: userDetails?.userID,
      });
      GetUserContactInfoApi.mutate({
        userId: userDetails?.userID,
      });
    }
  }, []);
  /**
   *  Added by @Akshita 25-03-25 ---> subsbcriber to handle the resetting navigation params whenever
   * user navigates to profile screen from different screens screen (FYN-4314) */
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      navigation.setParams({
        navigationFrom: undefined,
        fileId: undefined,
        folderID: undefined,
      });
    });
    return unsub;
  }, [navigation]);

  /**
   *  Added by @Akshita 25-03-25 --->callback function to fetch bread crumb path for the file
   * while coming from notifications (FYN-4314) */
  useFocusEffect(
    useCallback(() => {
      if (
        !userDetails?.isAdvisor &&
        !route.params?.fileIds &&
        (!isEmpty(route?.params?.fileId) || !isEmpty(route.params?.folderID))
      ) {
        if (!tenantDetails?.secureFilesContactAccess) {
          hideLoader();
          setTimeout(() => {
            showAlertPopup({
              title: t('AccessDenied'),
              msg: t('AccessDeniedMessage'),
              PositiveText: t('OK'),
            });
          }, 1000);
        } else {
          showLoader();
          getFileAndBreadcrumbApi.mutate({
            folderId: route?.params?.folderID,
            fileId: route.params?.fileId,
          });
        }
      }
      return undefined; // no cleanup needed
    }, [route.params?.fileId, route.params?.folderID]),
  );

  useEffect(() => {
    // every minute, recompute “now + 15 min”
    const id = setInterval(() => {
      setStartDateTime(
        formatDate({
          date: getDefaultStartDateTime(),
          returnFormat: 'MMM DD YYYY hh:mm a',
        }),
      );
    }, 60 * 1000);

    return () => clearInterval(id);
  }, [startDateTime]);

  useEffect(() => {
    if (userDetails && !route.params?.userId) {
      updatePersonalDetails();
      updateContactDetails();
    }
  }, [userDetails]);

  /**
   *  Added by @Akshita 25-03-25 ---> subsbcriber to handle the resetting the search state whenever
   * user navigates to different screen from message screen (FYN-4314) */
  useEffect(() => {
    if (!showAddNote) {
      setValue('message', '');
    }
  }, [showAddNote]);

  useEffect(() => {
    if (templateDetails.selectedTemplate && !userDetails?.isAdvisor) {
      setSelectedTemplate(templateDetails.selectedTemplate);
    }
  }, [templateDetails.selectedTemplate]);

  useTabPress(() => {
    if (userDetails?.isAdvisor) {
      getCurrentStatusApi.mutate({});
      getAllUserCertificatesApiCall.mutate({
        Id: userDetails?.userID,
      });
    }
  });

  /** Added by @Yuvraj 19-03-2025 -> handle personal details (FYN-5821) */
  const updatePersonalDetails = (data?: GetUserPersonalInfoModel) => {
    let validDob =
      formatDate({
        date: route.params?.userId ? data?.dob! : userDetails?.dob!,
        parseFormat: 'YYYY-MM-DDThh:mm:ss',
        returnFormat: 'MMM DD, YYYY',
      }) == 'Invalid Date'
        ? '-'
        : formatDate({
            date: route?.params?.userId ? data?.dob! : userDetails?.dob!,
            parseFormat: 'YYYY-MM-DDThh:mm:ss',
            returnFormat: 'MMM DD, YYYY',
          });
    const personalDetail = [
      ...(route?.params?.navigationFrom !==
      ContactVaultParentScreenType.fromMyTeamsAdvisor
        ? [
            {
              label: route?.params?.userId ? t('PreferredName') : t('Name'),
              value: route?.params?.userId
                ? data?.preferredName
                : userDetails?.fullName,
              icon: Images.name,
            },
          ]
        : []),

      ...(route?.params?.navigationFrom !==
      ContactVaultParentScreenType.fromMyTeamsAdvisor
        ? [
            {
              label: t('DOB'),
              value: validDob,
              icon: Images.cake,
            },
          ]
        : []),

      ...(route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor &&
      userDetails?.isAdvisor &&
      !route?.params?.userId
        ? [
            {
              label: t('Role'),
              value: userDetails.role,
              icon: Images.role,
            },
            {
              label: t('JobTitle'),
              value: data?.jobTitle,
              icon: Images.myDiary,
            },
          ]
        : []),
      ...(route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor && route?.params?.userId
        ? [
            {
              label: t('Type'),
              value: data?.userType,
              icon: Images.target,
            },
          ]
        : []),
      ...(route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor && isContact
        ? [
            {
              label: t('TimeZone'),
              value: userDetails?.timeZoneName,
              icon: Images.clock,
            },
          ]
        : []),
      ...(route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor &&
      !isContact &&
      userDetails?.role?.toLowerCase() !== 'admin'
        ? [
            {
              label: t('CalendarUrl'),
              value: userDetails?.calenderLink,
              icon: Images.clock,
            },
          ]
        : []),

      ...(route?.params?.navigationFrom ==
      ContactVaultParentScreenType.fromMyTeamsAdvisor
        ? [
            {
              label: t('JobTitle'),
              value: data?.jobTitle ? data?.jobTitle : data?.userType,
              icon: Images.myDiary,
            },
          ]
        : []),

      ...(route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor &&
      userDetails?.isAdvisor &&
      userDetails?.role?.toLowerCase() !== 'admin' &&
      !route?.params?.userId
        ? [
            {
              label: t('SecureUploadUrl'),
              value: '-',
              icon: Images.secureLink,
            },
          ]
        : []),
    ];

    setAccordianData(prev => {
      return {
        ...prev,
        personal: personalDetail,
      };
    });
  };

  /** Added by @Yuvraj 19-03-2025 -> handle contact details (FYN-5821) */
  const updateContactDetails = (
    data?: GetUserContactInfoModel,
    stateName?: string,
  ) => {
    if (data) {
      // finding country function
      var countryFinder = (countryId: number | undefined) => {
        const findedCountry = data?.countryList?.find(
          c => c.country?.id === countryId,
        );
        return findedCountry
          ? findedCountry.country?.name
          : data.countryList?.at(0)?.country?.name;
      };

      var tags = data?.tagUserList?.map(tag => tag.tagName).join(', ');

      var country = data.countryId !== 0 ? countryFinder(data?.countryId) : '';
    }
    const contactDetail = [
      {
        label: t('Email'),
        value: route?.params?.userId ? data?.emailAddress : userDetails?.email,
        icon: Images.email,
      },
      {
        label: t('Phone'),
        value: route?.params?.userId
          ? `${data?.phone ? data?.countryCode : ''} ${data?.phone}`
          : userDetails?.phone,
        icon: Images.contactUs,
      },
      ...(route?.params?.navigationFrom !==
      ContactVaultParentScreenType.fromMyTeamsAdvisor
        ? [
            {
              label: route?.params?.userId ? t('Tags') : t('AddressOne'),
              value: route?.params?.userId ? tags : userDetails?.address,
              icon: route?.params?.userId ? Images.link : Images.location,
            },
            {
              label: route?.params?.userId ? t('Address') : t('AddressTwo'),
              value: route?.params?.userId
                ? [
                    contactData?.addressLine1,
                    contactData?.addressLine2,
                    contactData?.city,
                    stateName,
                    country,
                    data?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : userDetails?.addressLine2,
              icon: Images.location,
            },
          ]
        : []),

      ...(!route?.params?.userId &&
      route?.params?.navigationFrom !==
        ContactVaultParentScreenType.fromMyTeamsAdvisor
        ? [
            {
              label: t('Country'),
              value: userDetails?.country,
              icon: Images.globe,
            },
            {
              label: t('State'),
              value: userDetails?.state,
              icon: Images.state,
            },
            {
              label: t('City'),
              value: userDetails?.city,
              icon: Images.city,
            },
            ...(userDetails?.isAdvisor
              ? [
                  {
                    label: t('TimeZone'),
                    value:
                      contactData?.systemTimeZoneList?.find(
                        item => item.standardName == userDetails?.timeZoneName,
                      )?.displayName ?? '-',
                    icon: Images.clock,
                  },
                  ...(userDetails?.role?.toLowerCase() !== 'admin'
                    ? [
                        {
                          label: t('WebsiteUrl'),
                          value: contactData?.websiteURL,
                          icon: Images.secureLink,
                        },
                      ]
                    : []),
                ]
              : []),
          ]
        : []),
    ];

    setAccordianData(prev => {
      return {
        ...prev,
        contact: contactDetail,
      };
    });
  };

  const triggerRefreshForContact = () => {
    GetUserPersonalInfoApi.mutate({
      userId: route?.params?.userId,
    });
    GetUserContactInfoApi.mutate({
      userId: route?.params?.userId,
    });
    GetUserNotesApi.mutate({
      userId: route?.params?.userId,
    });
  };

  /** Added by @Yuvraj 19-03-2025 -> handle reset password (FYN-5821) */
  const handleReset = () => {
    sendPasswordResetCodeApi.mutate({
      emailAddress: userDetails?.email,
    });
  };

  /** Added by @Yuvraj 19-03-2025 -> selecting templates (FYN-5821) */
  const selectUserTemplate = (item: GetUserActiveTemplateModel) => {
    if (!loadingButtons) {
      setSelectedTemplate(item);
      templateDetails.setSelectedTemplate(item);
    }
  };

  /** Added by @Yuvraj 19-03-2025 -> redirecting on edit screen page (FYN-6016) */
  const handleEditScreenRedirection = (
    accordianTabString?: 'personal' | 'contact' | 'licenses' | 'licensesEdit',
    item?: GetAllUserCertificatesModel,
  ) => {
    if (accordianTabString == 'licenses') {
      navigation.navigate('CreateLicenseCertificate', {
        userId: route?.params?.userId,
      });
    } else if (accordianTabString == 'licensesEdit') {
      Log('item111 ---->' + JSON.stringify(item));
      navigation.navigate('CreateLicenseCertificate', {
        userId: route?.params?.userId,
        editLicenseDetails: item,
      });
    } else {
      if (accordianTabString == 'personal' || accordianTabString == 'contact') {
        if (route?.params?.userId) {
          navigation.navigate('ProfileEdit', {
            subSection:
              accordianTabString == 'personal' ? 'personal' : 'contact',
            personalDetails: personalDetails,
            userId: route?.params?.userId,
          });
        } else {
          navigation.navigate('ProfileEdit', {
            subSection:
              accordianTabString == 'personal' ? 'personal' : 'contact',
            personalDetails: personalDetails,
          });
        }
      }
    }
  };

  /** Added by @Yuvraj 19-03-2025 -> on selecting new picture from local device (FYN-5821) */
  const handleMediaList = (mediaList: Asset[]) => {
    const formData = new FormData();
    setShowActionSheet(false);

    if (mediaList.length > 0) {
      const fileType = {
        uri: mediaList[0].uri,
        name: mediaList[0].fileName,
        type: mediaList[0].type,
      };

      formData.append('files', fileType); // Correctly append file object
      UploadFileListToS3Api.mutate(formData);
    }
  };

  /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
  const handleSelectedStatusIconColor = (value?: string) => {
    if (value == UserStatus.Available) {
      return theme.colors.statusAvailableColor;
    } else if (value == UserStatus.Busy) {
      return theme.colors.statusBusyColor;
    } else if (value == UserStatus.OutOfOffice) {
      return theme.colors.error;
    }
  };
  /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
  const handleOutOfOfficeStatus = () => {
    setShowStatusPopUp(false);
    setShowDateSelectionPopUp(true);
  };

  /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
  const handleSetDate = () => {
    let datePickerDate = startDateTime;
    if (dateSelection === DateSelectionType.start) {
      datePickerDate = startDateTime;
    } else if (dateSelection === DateSelectionType.end) {
      datePickerDate = endDateTime;
    } else {
      datePickerDate = startDateTime;
    }

    return parseDate({
      date: datePickerDate,
      parseFormat: 'MMM DD YYYY hh:mm a',
    });
  };

  /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
  const handleSelectedDate = (value: Date) => {
    /** Format the selected date to a readable format */
    setErrorMsg('');
    setTimeout(() => {
      setShowDateSelectionPopUp(true);
    }, 100);
    const formattedDate = formatDate({
      date: value,
      returnFormat: 'MMM DD YYYY hh:mm a',
    });

    /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
    if (dateSelection === DateSelectionType.start) {
      if (formattedDate !== startDateTime) {
        setStartDateTime(
          formattedDate,
        ); /** Update the start date-time state if changed */
      }
    } else if (dateSelection === DateSelectionType.end) {
      /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
      if (formattedDate !== endDateTime) {
        setEndDateTime(
          formattedDate,
        ); /** Update the end date-time state if changed */
      }
    }
  };

  /** Added by @Akshita 05-02-25 --->  Default value for message input (FYN-4314)*/
  const callChangeStatusApi = ({
    statusValue,
    startDateValue = '',
    endDateValue = '',
    isOutOfOfficeUpdated = false,
  }: {
    statusValue: string;
    startDateValue?: string;
    endDateValue?: string;
    isOutOfOfficeUpdated?: boolean;
  }) => {
    let userStatusval;
    if (statusValue == UserStatus.Available) {
      userStatusval = 'A';
    } else if (statusValue == UserStatus.Busy) {
      userStatusval = 'B';
    } else if (statusValue == UserStatus.OutOfOffice) {
      userStatusval = 'O';
    }
    Log('startDateValue -----------> ' + startDateValue);
    Log('endDateValue -----------> ' + endDateValue);
    // YYYY-MM-DDTHH:mm:ss.SSSZ

    changeStatusApi.mutate({
      status: userStatusval,
      startDate: startDateValue
        ? formatDate({
            date: startDateValue,
            parseFormat: 'MMM DD YYYY hh:mm a',
            returnFormat: 'YYYY-MM-DDTHH:mm:ss',
          })
        : '',
      endDate: endDateValue
        ? formatDate({
            date: endDateValue,
            parseFormat: 'MMM DD YYYY hh:mm a',
            returnFormat: 'YYYY-MM-DDTHH:mm:ss',
          })
        : '',
      isOutOfOfcUpdated: isOutOfOfficeUpdated ?? false,
    });
  };

  /** Added by @Yuvraj 06-02-2026 -> handling view my accont press (FYN-12345) */
  const handleViewAccountsPress = () => {
    GetConnectionApi.mutate({ userId: userDetails?.userID });
  };

  /** Added by @Yuvraj 06-02-2026 -> Api for getting connected to view my account (FYN-12345) */
  const GetConnectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetConnectionModel>({
        endpoint: ApiConstants.GetConnection,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoadingButtons('viewMyAccount');
    },
    onSettled(data, error, variables, context) {
      setLoadingButtons(undefined);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success) {
        if (data.result?.status == 1) {
          navigation.navigate('MyAccounts', data.result);
        } else if (data.result?.message) {
          showSnackbar(data.result?.message, 'warning');
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> Api for sending email resetting password (FYN-5821) */
  const sendPasswordResetCodeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.sendPasswordResetCode,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoadingButtons('reset');
    },
    onSettled(data, error, variables, context) {
      setLoadingButtons(undefined);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.success) {
        showSnackbar(t('PasswordMessage'), 'success');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> Api for uploading picture and getting id (FYN-5821) */
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onMutate(variables) {
      setLoadingButtons('edit');
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setLoadingButtons(undefined);
      }
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result != null) {
        createOrEditUserProfileDataApi.mutate({
          imageDataID: data.result.at(0)?.contentID,
        });
      } else {
        showSnackbar(
          data.error?.message ? data.error?.message : t('SomeErrorOccured'),
          'danger',
        );
        setLoadingButtons(undefined);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> Api for updating profile picture (FYN-5821) */
  const createOrEditUserProfileDataApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.createOrEditUserProfileData,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {},
    onSettled(data, error, variables, context) {
      if (error) {
        setLoadingButtons(undefined);
      }
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        getUserDetailForProfileApiCall.mutate({ profileUpdate: true });
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> getUserDetailForProfileApiCall call to get user detail (FYN-5821) */
  const getUserDetailForProfileApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserDetailForProfileModel>({
        endpoint: ApiConstants.GetUserDetailForProfile,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      if (!variables.profileUpdate) {
        setLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (loading) {
        setLoading(false);
      }
      if (loadingButtons) {
        setLoadingButtons(undefined);
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        /** Added by @Yuvraj 09-02-25 ---> store user details in store (FYN-4042) */
        const userData: GetUserDetailForProfileModel = {
          ...data.result,
          loginWith: userDetails?.loginWith,
          isInvitedIntoTemplate: userDetails?.isInvitedIntoTemplate,
          inviteLoadingMsg: userDetails?.inviteLoadingMsg,
          isAdvisor:
            data?.result?.role == UserRoleEnum.Admin ||
            data?.result?.role == UserRoleEnum.Advisor ||
            data?.result?.role == UserRoleEnum.Coach ||
            data.result.role == UserRoleEnum.OfficeAdmin ||
            data.result.role == UserRoleEnum.OfficeAdminSpace ||
            data.result.role == UserRoleEnum.Marketing ||
            data.result.role == UserRoleEnum.Compliance ||
            data.result.role == UserRoleEnum.Operations ||
            data.result.role == UserRoleEnum.SupportStaff ||
            data.result.role == UserRoleEnum.SupportStaffSpace ||
            data.result.role == UserRoleEnum.ContentEditor
              ? true
              : false,
        };

        setUserDetails(userData);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> api for state list (FYN-5997) */
  const GetAllStateForLookUpTableApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllStateForLookUpTableModel>({
        endpoint: ApiConstants.GetAllStateForLookUpTable,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate() {
      setIndividualLoading(prev => ({ ...prev, contactDetails: true }));
    },
    onSettled() {
      setIndividualLoading(prev => ({ ...prev, contactDetails: false }));
    },
    onSuccess(data, variables, context) {
      if (data?.result?.items && data?.result?.items.length > 0) {
        var state = data?.result?.items?.find(s => s.id == variables.stateId);
      }
      updateContactDetails(variables.contactData, state?.displayName);
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> api for personal detail for contact in contact summary (FYN-5997) */
  const GetUserPersonalInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserPersonalInfoModel>({
        endpoint: ApiConstants.GetUserPersonalInfo,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate() {
      setIndividualLoading(prev => ({ ...prev, personalDetails: true }));
    },
    onSettled() {
      setIndividualLoading(prev => ({ ...prev, personalDetails: false }));
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        setPersonalDetails(data?.result);
        updatePersonalDetails(data.result);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> api for contact detail for contact in contact summary (FYN-5997) */
  const GetUserContactInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserContactInfoModel>({
        endpoint: ApiConstants.GetUserContactInfo,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate() {
      setIndividualLoading(prev => ({ ...prev, contactDetails: true }));
    },
    onSettled() {
      setIndividualLoading(prev => ({ ...prev, contactDetails: false }));
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        setContactData(data.result);
        if (
          userDetails?.isAdvisor &&
          route.params?.userId &&
          // route?.params?.fileId == '00000000-0000-0000-0000-000000000000S' &&
          (route?.params?.fileIds || !isEmpty(route.params?.folderID))
        ) {
          if (
            (userDetails?.role?.toLowerCase() == 'admin' &&
              !tenantDetails?.secureFilesAdminAccess) ||
            (userDetails?.role?.toLowerCase() == 'advisor' &&
              !tenantDetails?.secureFilesAdvisorAccess)
          ) {
            hideLoader();
            setTimeout(() => {
              showAlertPopup({
                title: t('AccessDenied'),
                msg: t('AccessDeniedMessage'),
                PositiveText: t('OK'),
              });
            }, 1000);
          } else {
            navigation.navigate('ContactVault', {
              userId: route?.params?.userId!,
              fileIdList: route?.params?.fileIds!,
              folderID: route.params.folderID,
              folderPath: 'My Documents',
              navigationFrom: route.params.navigationFrom,
              userName: data.result?.fullName,
            });
          }
        }
        GetAllStateForLookUpTableApi.mutate({
          CountryId: data?.result?.countryId,
          stateId: data?.result?.stateId,
          contactData: data.result,
        });
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> getUserDetailForProfileApiCall call to get user detail START (FYN-5997) */
  const GetUserNotesApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserNotesModel[]>({
        endpoint: ApiConstants.GetUserNotes,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setIndividualLoading(prev => ({ ...prev, notes: true }));
    },
    onSettled() {
      setIndividualLoading(prev => ({ ...prev, notes: false }));

      setLoadingButtons('');
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        setNotesData(
          data.result.map(item => ({
            ...item,
            insertedDate: !isEmpty(item.insertedDate)
              ? formatDateUtcReturnLocalTime({
                  date: item.insertedDate!,
                  parseFormat: DateFormats.FullDate,
                  returnFormat: DateFormats.UIDate,
                })
              : '',
          })),
        );
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

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
                parseFormat: DateFormats.parseDateFormat,
                returnFormat: DateFormats.displayFullMonth,
              })
            : '',
          endDate: item.endDate
            ? formatDate({
                date: item.endDate,
                parseFormat: DateFormats.parseDateFormat,
                returnFormat: DateFormats.displayFullMonth,
              })
            : '',
        }));
        templateDetails.setTemplateList(newList);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> to add notes (FYN-5997) */
  const CreateOrEditNotesApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.CreateOrEditNotes,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate() {
      setLoadingButtons('saveOrDeleteNotes');
      setIndividualLoading(prev => ({ ...prev, notes: true }));
    },
    onSettled() {
      setShowAddNote(false);
      setLoadingButtons('');
    },
    onSuccess(data, variables, context) {
      if (data?.success) {
        GetUserNotesApi.mutate({
          userId: route?.params?.userId,
        });
        showSnackbar(t('NoteAddedSuccessfully'), 'success');
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> to delete notes (FYN-5997) */
  const deleteApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.deleteNotes,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setDeleteNoteId(variables.id);
    },
    onSettled(data, error, variables, context) {
      setDeleteNoteId(undefined);
    },
    onSuccess(data, variables, context) {
      if (data?.success) {
        const updatedNotes = notesData?.filter(
          item => item.id !== deleteNoteId,
        );
        setNotesData(updatedNotes);
        showSnackbar(t('NoteDeletedSuccessfully'), 'success');
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Akshita 27-06-2025 -> adding Dob (FYN-6900)  */
  const getCurrentStatusApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetCurrentStatusModel>({
        endpoint: ApiConstants.GetCurrentStatus,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setCurrentStatusLoading(true);
      setIndividualLoading(prev => ({ ...prev, UserStatus: true }));
    },
    onSettled(data, error, variables, context) {
      setCurrentStatusLoading(false);
      setIndividualLoading(prev => ({ ...prev, UserStatus: false }));
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        setErrorMsg('');
        setCurrentStatusData(data.result);
        if (data.result.availabilityStatus) {
          if (data.result.availabilityStatus.toLowerCase() == 'outofoffice') {
            setSelectedStatus(UserStatus.OutOfOffice);
            if (data.result.endDate && data.result.startDate) {
              const formattedStartDate = formatDate({
                date: data.result.startDate,
                returnFormat: 'MMM DD YYYY hh:mm a',
              });
              const formattedEndDate = formatDate({
                date: data.result.endDate,
                returnFormat: 'MMM DD YYYY hh:mm a',
              });
              setStartDateTime(formattedStartDate);
              setEndDateTime(formattedEndDate);
            }
          } else {
            setSelectedStatus(data.result.availabilityStatus);
            if (
              isEmpty(data.result.startDate) &&
              isEmpty(data.result.endDate)
            ) {
              setIsChangeSaveBtnLabel(false);
            }
            setStartDateTime(
              formatDate({
                date: data.result.startDate
                  ? data.result.startDate
                  : getDefaultStartDateTime(),
                returnFormat: 'MMM DD YYYY hh:mm a',
              }),
            );
            setEndDateTime(
              formatDate({
                date: data.result.endDate
                  ? data.result.endDate
                  : getDefaultEndDateTime(),
                returnFormat: 'MMM DD YYYY hh:mm a',
              }),
            );
          }
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Akshita 27-06-2025 -> adding Dob (FYN-6900)  */
  const changeStatusApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<ChangeStatusModel>({
        endpoint: ApiConstants.ChangeStatus,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setStatusLoading(true);
    },
    onSettled(data, error, variables, context) {
      setStatusLoading(false);
      setShowOutOfOfficeWarningPopUp(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result?.status == 1) {
        if (variables.status == 'A') {
          setSelectedStatus(UserStatus.Available);
        } else if (variables.status == 'B') {
          setSelectedStatus(UserStatus.Busy);
        } else if (variables.status == 'O') {
          if (data.result.outOfOfficeRemoved) {
            setSelectedStatus(data.result.availabilityStatus);
          }
          showSnackbar(t('StatusSaved'), 'success');

          setIsChangeSaveBtnLabel(true);
        }
        if (variables.isOutOfOfcUpdated) {
          setIsChangeSaveBtnLabel(false);
          const newData: GetCurrentStatusModel = {
            ...currentStatusData,
            startDate: '',
            endDate: '',
          };
          setCurrentStatusData(newData);
        }
        setErrorMsg('');
        setShowDateSelectionPopUp(false);
      }
      if (data.result?.status == 0 && data.result.message) {
        setErrorMsg(data.result.message);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Akshita 27-06-2025 -> adding Dob (FYN-6900)  */
  const deleteOutOfOfficeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetCurrentStatusModel>({
        endpoint: ApiConstants.DeleteOutOfOffce,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setDltOutOfOfcLoading(true);
    },
    onSettled(data, error, variables, context) {
      setDltOutOfOfcLoading(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result && data.result.availabilityStatus) {
        setSelectedStatus(data.result.availabilityStatus);
        setCurrentStatusData(data.result);
        setShowDateSelectionPopUp(false);
        setIsChangeSaveBtnLabel(false);

        /**  Added by @Akshita 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
        setStartDateTime(
          formatDate({
            date: getDefaultStartDateTime(),
            returnFormat: 'MMM DD YYYY hh:mm a',
          }),
        );

        /**  Added by @Akshita 10-04-2025 (#6195) ---> Initialize state variables for start date/time */
        setEndDateTime(
          formatDate({
            date: getDefaultEndDateTime(),
            returnFormat: 'MMM DD YYYY hh:mm a',
          }),
        );

        // Error Response
        showSnackbar(t('StatusTurnedOff'), 'success');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  const getFileAndBreadcrumbApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFileAndBreadcrumbModel>({
        endpoint: ApiConstants.GetFileAndBreadcrumb,
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
      const res = data?.result;
      if (!res) return;

      const hasBreadcrumb = !!res.breadcrumbPath?.length;
      const completeBreadcrumbPath = hasBreadcrumb
        ? res?.breadcrumbPath?.map(item => item.name).join('\\')
        : '';

      if (res.status === 0) {
        navigation.navigate(
          'ContactVault',
          hasBreadcrumb
            ? {
                navigationFrom: route?.params?.navigationFrom,
                folderID: route?.params?.folderID,
                folderIdHistory: route?.params?.folderID,
                folderPath: completeBreadcrumbPath,
                errorMsg: res.message,
              }
            : {
                navigationFrom: route?.params?.navigationFrom,
                errorMsg: res.message,
              },
        );
      } else {
        if (hasBreadcrumb) {
          Log('complete Bread crumbPath  :  ' + completeBreadcrumbPath);
          navigation.navigate('ContactVault', {
            navigationFrom: route?.params?.navigationFrom,
            folderID: route?.params?.folderID,
            fileId: route?.params?.fileId,
            folderIdHistory: route?.params?.folderID,
            folderPath: completeBreadcrumbPath,
          });
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  //Certifications API calls
  const getAllUserCertificatesApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllUserCertificatesModel[]>({
        endpoint: ApiConstants.GetAllUserCertificates,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setIndividualLoading(prev => ({ ...prev, licenses: true }));
    },
    onSettled(data, error, variables, context) {
      if (loading) {
        setLoading(false);
      }
      if (loadingButtons) {
        setLoadingButtons(undefined);
      }
      setIndividualLoading(prev => ({ ...prev, licenses: false }));
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        const newData: GetAllUserCertificatesModel[] = data.result.map(
          element => ({
            ...element,
            expiryDate: formatDate({
              date: element.expiryDate?.toString() ?? '',
              parseFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
              returnFormat: 'MMM YYYY',
            }),
            issueDate: formatDate({
              date: element.issueDate?.toString() ?? '',
              parseFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
              returnFormat: 'MMM YYYY',
            }),
          }),
        );
        setAllUserCertificates(newData);
      } else {
        setAllUserCertificates([]);
      }
    },
    onError(error, variables, context) {
      setAllUserCertificates([]);
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showBack={route?.params?.userId ? true : false}
          showHamburger={route?.params?.userId ? false : true}
          title={
            route?.params?.userId &&
            route?.params?.navigationFrom !=
              ContactVaultParentScreenType.fromMyTeamsAdvisor
              ? t('Contact')
              : userDetails?.isAdvisor ||
                route?.params?.navigationFrom ==
                  ContactVaultParentScreenType.fromMyTeamsAdvisor
              ? t('Profile')
              : t('MyAccount')
          }
        />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={loadingButtons == 'screenRefresh'}
              onRefresh={() => {
                setAccordianTab('personal');
                if (route?.params?.userId) {
                  triggerRefreshForContact();
                } else {
                  isContact && getUserActiveTemplate.mutate({});
                  setLoadingButtons('screenRefresh');
                  getUserDetailForProfileApiCall.mutate({});
                  if (userDetails?.isAdvisor) {
                    getAllUserCertificatesApiCall.mutate({
                      Id: userDetails?.userID,
                    });
                    GetUserPersonalInfoApi.mutate({
                      userId: userDetails?.userID,
                    });
                    GetUserContactInfoApi.mutate({
                      userId: userDetails?.userID,
                    });
                    getCurrentStatusApi.mutate({});
                  }
                }
              }}
              colors={[theme.colors.onBackground]}
              progressBackgroundColor={theme.colors.background}
            />
          }
          keyboardShouldPersistTaps={'always'}
          style={styles.container}
        >
          <View style={{ flex: 1 }}>
            <ProfileHeader
              route={route?.params?.userId}
              individualContactLoading={individualLoading.contactDetails}
              contactData={contactData}
              contactSummaryActionButtons={contactSummaryActionButtons}
              loading={loading}
              loadingButtons={loadingButtons}
              handleReset={handleReset}
              setShowImageSelectionPopup={setShowImageSelectionPopup}
              isAdvisorView={
                route?.params?.navigationFrom ==
                ContactVaultParentScreenType.fromMyTeamsAdvisor
                  ? true
                  : false
              }
            />

            {loading ? (
              <Skeleton>
                <View style={styles.skeletonMainContainer}>
                  <View style={styles.skeletonOpenAccordian}>
                    <View style={styles.skeletonAccordianTitle}></View>
                    <View style={styles.skeletonAccordianContentContainer}>
                      <View style={styles.skeletonAccordianContentView}>
                        <View style={styles.skeletonAccordianContent}></View>
                        <View style={styles.skeletonAccordianContent}></View>
                      </View>
                      <View style={styles.skeletonAccordianContentView}>
                        <View style={styles.skeletonAccordianContent}></View>
                        <View style={styles.skeletonAccordianContent}></View>
                      </View>
                      <View style={styles.skeletonAccordianContentView}>
                        <View style={styles.skeletonAccordianContent}></View>
                        <View style={styles.skeletonAccordianContent}></View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.skeletonAccordian}>
                    <View style={styles.skeletonAccordianTitle}></View>
                  </View>
                  <View style={styles.skeletonAccordian}>
                    <View style={styles.skeletonAccordianTitle}></View>
                  </View>
                </View>
              </Skeleton>
            ) : (
              <>
                {route?.params?.navigationFrom !=
                  ContactVaultParentScreenType.fromMyTeamsAdvisor &&
                  userDetails?.isAdvisor &&
                  !route.params?.userId && (
                    <Shadow
                      onPress={() =>
                        userDetails?.isAdvisor &&
                        !route.params?.userId &&
                        setShowStatusPopUp(true)
                      }
                      tapStyle={{ padding: 0 }}
                      style={styles.accordianContainer}
                    >
                      {individualLoading.UserStatus ? (
                        <SkeletonList
                          style={styles.skeletonNotesAccordianContainer}
                          count={1}
                        >
                          <View style={styles.skeletonNotesAccordian}>
                            <View
                              style={styles.skeletonNotesAccordianKey}
                            ></View>
                            <View
                              style={styles.skeletonNotesAccordianValue}
                            ></View>
                          </View>
                        </SkeletonList>
                      ) : (
                        <View style={styles.statusContainer}>
                          <View style={styles.statusWrapper}>
                            <CustomImage
                              source={
                                selectedStatus == UserStatus.OutOfOffice
                                  ? Images.outofOffice
                                  : Images.circle
                              }
                              style={styles.StatusIcon}
                              type={
                                selectedStatus == UserStatus.OutOfOffice
                                  ? ImageType.png
                                  : ImageType.svg
                              }
                              color={
                                selectedStatus == UserStatus.OutOfOffice
                                  ? undefined
                                  : userDetails?.isAdvisor &&
                                    !route.params?.userId
                                  ? handleSelectedStatusIconColor(
                                      selectedStatus,
                                    )
                                  : theme.colors.statusAvailableColor
                              }
                            />
                            <CustomText variant={TextVariants.bodyLarge}>
                              {userDetails?.isAdvisor && !route.params?.userId
                                ? selectedStatus
                                : UserStatus.Available}
                            </CustomText>
                          </View>
                          {statusLoading && !showDateSelectionPopUp ? (
                            <ActivityIndicator />
                          ) : (
                            <CustomImage
                              source={Images.back}
                              type={ImageType.svg}
                              style={{
                                ...styles.editIcon,
                                transform: [
                                  {
                                    rotate: showStatusPopUp
                                      ? '90deg'
                                      : '270deg',
                                  },
                                ],
                              }}
                              color={theme.colors.outline}
                            />
                          )}
                        </View>
                      )}
                    </Shadow>
                  )}

                <Shadow style={styles.accordianContainer}>
                  <Tap
                    style={styles.accordianTap}
                    onPress={() =>
                      accordianTab == 'personal'
                        ? setAccordianTab('')
                        : setAccordianTab('personal')
                    }
                  >
                    <View style={styles.accordianTapView}>
                      <View style={styles.accordianTitleContainer}>
                        <CustomText variant={TextVariants.titleMedium}>
                          {t('PersonalDetails')}
                        </CustomText>
                        {route?.params?.navigationFrom !=
                          ContactVaultParentScreenType.fromMyTeamsAdvisor &&
                          userDetails?.isAdvisor && (
                            <Tap
                              style={styles.editIconTap}
                              onPress={() =>
                                handleEditScreenRedirection('personal')
                              }
                            >
                              <CustomImage
                                source={Images.editSquare}
                                type={ImageType.svg}
                                style={styles.editIcon}
                                color={theme.colors.outline}
                              />
                            </Tap>
                          )}
                      </View>
                      <CustomImage
                        source={Images.back}
                        type={ImageType.svg}
                        style={{
                          ...styles.editIcon,
                          transform: [
                            {
                              rotate:
                                accordianTab == 'personal' ? '90deg' : '270deg',
                            },
                          ],
                        }}
                        color={theme.colors.outline}
                      />
                    </View>
                  </Tap>
                  {accordianTab == 'personal' &&
                    (individualLoading.personalDetails ? (
                      <SkeletonList
                        style={styles.skeletonNotesAccordianContainer}
                        count={3}
                      >
                        <View style={styles.skeletonNotesAccordian}>
                          <View style={styles.skeletonNotesAccordianKey}></View>
                          <View
                            style={styles.skeletonNotesAccordianValue}
                          ></View>
                        </View>
                      </SkeletonList>
                    ) : (
                      <Animated.View
                        style={styles.accordianDrawer}
                        entering={FadeInUp}
                      >
                        {accordianData?.personal?.map((Item, index) => (
                          <View
                            key={`${Item.label}-${index}`}
                            style={styles.accordianDrawerItem}
                          >
                            <View style={styles.accordianLabelGroup}>
                              <CustomImage
                                source={Item.icon}
                                type={ImageType.svg}
                                color={theme.colors.onBackground}
                                style={styles.accordianItemIcon}
                              />
                              <CustomText
                                variant={TextVariants.labelLarge}
                                color={theme.colors.onBackground}
                                style={styles.labelText}
                              >
                                {`${Item.label}`}
                              </CustomText>
                            </View>
                            <CustomText
                              style={styles.valueText}
                              color={theme.colors.outline}
                              variant={TextVariants.bodyLarge}
                            >
                              {Item.value?.trim() ? Item.value : ''}
                            </CustomText>
                          </View>
                        ))}
                      </Animated.View>
                    ))}
                </Shadow>

                <Shadow style={styles.accordianContainer}>
                  <Tap
                    style={styles.accordianTap}
                    onPress={() =>
                      accordianTab == 'contact'
                        ? setAccordianTab('')
                        : setAccordianTab('contact')
                    }
                  >
                    <View style={styles.accordianTapView}>
                      <View style={styles.accordianTitleContainer}>
                        <CustomText variant={TextVariants.titleMedium}>
                          {t('ContactDetails')}
                        </CustomText>
                        {userDetails?.isAdvisor && (
                          <Tap
                            style={styles.editIconTap}
                            onPress={() =>
                              handleEditScreenRedirection('contact')
                            }
                          >
                            <CustomImage
                              source={Images.editSquare}
                              type={ImageType.svg}
                              style={styles.editIcon}
                              color={theme.colors.outline}
                            />
                          </Tap>
                        )}
                      </View>
                      <CustomImage
                        source={Images.back}
                        type={ImageType.svg}
                        style={{
                          ...styles.editIcon,
                          transform: [
                            {
                              rotate:
                                accordianTab == 'contact' ? '90deg' : '270deg',
                            },
                          ],
                        }}
                        color={theme.colors.outline}
                      />
                    </View>
                  </Tap>
                  {accordianTab == 'contact' &&
                    (individualLoading.contactDetails ? (
                      <SkeletonList
                        style={styles.skeletonNotesAccordianContainer}
                        count={3}
                      >
                        <View style={styles.skeletonNotesAccordian}>
                          <View style={styles.skeletonNotesAccordianKey}></View>
                          <View
                            style={styles.skeletonNotesAccordianValue}
                          ></View>
                        </View>
                      </SkeletonList>
                    ) : (
                      <Animated.View
                        style={styles.accordianDrawer}
                        entering={FadeInUp}
                      >
                        {accordianData?.contact?.map((Item, index) => (
                          <View
                            key={`${Item.label}-${index}`}
                            style={styles.accordianDrawerItem}
                          >
                            <View style={styles.accordianLabelGroup}>
                              <CustomImage
                                source={Item.icon}
                                type={ImageType.svg}
                                color={theme.colors.onBackground}
                                style={styles.accordianItemIcon}
                              />
                              <CustomText
                                variant={TextVariants.labelLarge}
                                color={theme.colors.onBackground}
                                style={styles.labelText}
                              >
                                {`${Item.label}`}
                              </CustomText>
                            </View>
                            <CustomText
                              style={styles.valueText}
                              color={theme.colors.outline}
                              variant={TextVariants.bodyLarge}
                            >
                              {Item.value?.trim() ? Item.value : '-'}
                            </CustomText>
                          </View>
                        ))}
                      </Animated.View>
                    ))}
                </Shadow>

                {isContact &&
                  templateDetails.templateList?.length! > 1 &&
                  route?.params?.navigationFrom !=
                    ContactVaultParentScreenType.fromMyTeamsAdvisor && (
                    <>
                      <Shadow style={styles.accordianContainer}>
                        <Tap
                          style={styles.accordianTap}
                          onPress={() =>
                            accordianTab == 'templates'
                              ? setAccordianTab('')
                              : setAccordianTab('templates')
                          }
                        >
                          <View style={styles.accordianTapView}>
                            <CustomText
                              style={styles.accordianTitle}
                              variant={TextVariants.titleMedium}
                            >
                              {t('Experiences')}
                            </CustomText>
                            <CustomImage
                              source={Images.back}
                              type={ImageType.svg}
                              style={{
                                ...styles.editIcon,
                                transform: [
                                  {
                                    rotate:
                                      accordianTab == 'templates'
                                        ? '90deg'
                                        : '270deg',
                                  },
                                ],
                              }}
                              color={theme.colors.outline}
                            />
                          </View>
                        </Tap>
                        {accordianTab == 'templates' && (
                          <Animated.View
                            style={styles.accordianDrawer}
                            entering={FadeInUp}
                          >
                            <CustomFlatList
                              data={templateDetails.templateList!}
                              keyExtractor={item => item.groupID!}
                              scrollEnabled={false}
                              ListEmptyComponent={
                                <View style={styles.noTemplates}>
                                  <CustomText>{t('NoExperiences')}</CustomText>
                                </View>
                              }
                              extraData={[selectedTemplateItem]}
                              renderItem={({ item }) => {
                                return (
                                  <Tap
                                    disableRipple
                                    onPress={() => selectUserTemplate(item)}
                                  >
                                    <View>
                                      <View
                                        style={{
                                          ...styles.flatListContainer,
                                          borderColor:
                                            item.groupID?.toLowerCase() ==
                                            selectedTemplateItem?.groupID?.toLowerCase()
                                              ? theme.colors.primary
                                              : theme.colors.outline,
                                          borderWidth:
                                            item.groupID?.toLowerCase() ==
                                            selectedTemplateItem?.groupID?.toLowerCase()
                                              ? 1
                                              : 0.3,
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
                                    </View>
                                  </Tap>
                                );
                              }}
                            />
                          </Animated.View>
                        )}
                      </Shadow>
                    </>
                  )}

                {route?.params?.userId &&
                  route?.params?.navigationFrom !=
                    ContactVaultParentScreenType.fromMyTeamsAdvisor && (
                    <Shadow style={styles.accordianContainer}>
                      <Tap
                        style={styles.accordianTap}
                        onPress={() =>
                          accordianTab == 'notes'
                            ? setAccordianTab('')
                            : setAccordianTab('notes')
                        }
                      >
                        <View style={styles.accordianTapView}>
                          <View style={styles.accordianTitleContainer}>
                            <CustomText variant={TextVariants.titleMedium}>
                              {t('Notes')}
                            </CustomText>
                            <Tap
                              style={styles.noteAccordianAddButton}
                              onPress={() => setShowAddNote(true)}
                            >
                              <CustomImage
                                source={Images.addCircle}
                                type={ImageType.svg}
                                style={styles.editIcon}
                                color={theme.colors.outline}
                              />
                            </Tap>
                          </View>
                          <CustomImage
                            source={Images.back}
                            type={ImageType.svg}
                            style={{
                              ...styles.editIcon,
                              transform: [
                                {
                                  rotate:
                                    accordianTab == 'notes'
                                      ? '90deg'
                                      : '270deg',
                                },
                              ],
                            }}
                            color={theme.colors.outline}
                          />
                        </View>
                      </Tap>
                      {accordianTab == 'notes' &&
                        (individualLoading.notes ? (
                          <SkeletonList
                            style={styles.skeletonNotesAccordianContainer}
                            count={3}
                          >
                            <View style={styles.skeletonNotesAccordian}>
                              <View
                                style={styles.skeletonNotesAccordianKey}
                              ></View>
                              <View
                                style={styles.skeletonNotesAccordianValue}
                              ></View>
                            </View>
                          </SkeletonList>
                        ) : (
                          <View style={styles.accordianDrawerNotes}>
                            {notesData && notesData?.length > 0 ? (
                              notesData?.map((Item, index) => (
                                <View
                                  key={`${Item.id}-${index}`}
                                  style={{
                                    ...styles.accordianDrawerNotesItems,
                                    borderBottomWidth:
                                      notesData.length - 1 == index ? 0 : 0.2,
                                  }}
                                >
                                  {Item.id == deleteNoteId ? (
                                    <ActivityIndicator />
                                  ) : (
                                    <CustomText
                                      color={theme.colors.primary}
                                      variant={TextVariants.titleLarge}
                                    >
                                      {'•'}
                                    </CustomText>
                                  )}
                                  <View style={styles.accordianTitle}>
                                    <CustomText
                                      variant={TextVariants.bodyLarge}
                                    >
                                      {Item.notes}
                                    </CustomText>
                                    <CustomText
                                      style={{ marginTop: 5 }}
                                      variant={TextVariants.labelMedium}
                                      color={theme.colors.labelLight}
                                    >
                                      {Item.insertedDate}
                                    </CustomText>
                                  </View>
                                  <Tap
                                    style={styles.accordianNoteDeleteIconTap}
                                    onPress={() => {
                                      showAlertPopup({
                                        title: t('Confirm'),
                                        msg: t('ConfirmNoteDelete'),
                                        PositiveText: t('Yes'),
                                        NegativeText: t('No'),
                                        onPositivePress() {
                                          deleteApi.mutate({
                                            id: Item.id,
                                          });
                                        },
                                      });
                                    }}
                                  >
                                    <CustomImage
                                      source={Images.delete}
                                      type={ImageType.svg}
                                      color={theme.colors.error}
                                      style={styles.accordianNoteDeleteIcon}
                                    />
                                  </Tap>
                                </View>
                              ))
                            ) : (
                              <CustomText color={theme.colors.labelLight}>
                                {t('NoNotesText')}
                              </CustomText>
                            )}
                          </View>
                        ))}
                    </Shadow>
                  )}

                {((route?.params?.navigationFrom ===
                  ContactVaultParentScreenType.fromMyTeamsAdvisor &&
                  AllUserCertificates.length > 0) ||
                  (!route?.params?.userId && userDetails?.isAdvisor)) &&
                  userDetails?.role !== UserRoleEnum.ContentEditor && (
                    <Shadow style={styles.accordianContainer}>
                      <Tap
                        style={styles.accordianTap}
                        onPress={() =>
                          accordianTab === 'licenses'
                            ? setAccordianTab('')
                            : setAccordianTab('licenses')
                        }
                      >
                        <View style={styles.accordianTapView}>
                          <View style={styles.accordianTitleContainer}>
                            <CustomText variant={TextVariants.titleMedium}>
                              {t('LicensesAndCertificates')}
                            </CustomText>

                            {route?.params?.navigationFrom !=
                              ContactVaultParentScreenType.fromMyTeamsAdvisor && (
                              <Tap
                                style={styles.editIconTap}
                                onPress={() =>
                                  handleEditScreenRedirection('licenses')
                                }
                              >
                                <CustomImage
                                  source={Images.addCircle}
                                  type={ImageType.svg}
                                  style={styles.editIcon}
                                  color={theme.colors.outline}
                                />
                              </Tap>
                            )}
                          </View>
                          <CustomImage
                            source={Images.back}
                            type={ImageType.svg}
                            style={{
                              ...styles.editIcon,
                              transform: [
                                {
                                  rotate:
                                    accordianTab === 'licenses'
                                      ? '90deg'
                                      : '270deg',
                                },
                              ],
                            }}
                            color={theme.colors.outline}
                          />
                        </View>
                      </Tap>

                      {accordianTab === 'licenses' &&
                        (individualLoading.licenses ? (
                          <SkeletonList
                            style={styles.skeletonNotesAccordianContainer}
                            count={2}
                          >
                            <View style={styles.skeletonNotesAccordian}>
                              <View
                                style={styles.skeletonNotesAccordianKey}
                              ></View>
                              <View
                                style={styles.skeletonNotesAccordianValue}
                              ></View>
                            </View>
                          </SkeletonList>
                        ) : (
                          <Animated.View
                            style={styles.licenseListContainer}
                            entering={FadeInUp}
                          >
                            {AllUserCertificates.length === 0 ? (
                              <View style={styles.noLicenseWrapper}>
                                <CustomText
                                  color={theme.colors.labelLight}
                                  variant={TextVariants.bodyLarge}
                                >
                                  {t('NoCertificatesAddedYet')}
                                </CustomText>
                              </View>
                            ) : (
                              AllUserCertificates.map(item => (
                                <Tap
                                  onPress={() => {
                                    //if (item?.fileURL) {
                                    setShowCertificateDetailPopUp(true);
                                    setSelectedUserCertificate(item);
                                    //}
                                  }}
                                >
                                  <View
                                    key={item.id}
                                    style={styles.licenseItemRow}
                                  >
                                    <CustomImage
                                      source={Images.certificate}
                                      style={styles.licenseIcon}
                                      color={theme.colors.onSurfaceVariant}
                                    />
                                    <View style={styles.licenseTextWrapper}>
                                      <CustomText
                                        variant={TextVariants.titleSmall}
                                        style={styles.licenseTitle}
                                      >
                                        {item.certificateName}
                                      </CustomText>

                                      {item.issuingOrganization && (
                                        <CustomText
                                          variant={TextVariants.bodySmall}
                                          color={theme.colors.labelLight}
                                        >
                                          {item.issuingOrganization}
                                        </CustomText>
                                      )}

                                      {(item.issueDate || item.expiryDate) && (
                                        <CustomText
                                          variant={TextVariants.bodySmall}
                                          color={theme.colors.labelLight}
                                          style={styles.detailLine}
                                        >
                                          {`${t('Issued ')} ${item.issueDate}`}
                                        </CustomText>
                                      )}

                                      {item.credentialId && (
                                        <CustomText
                                          variant={TextVariants.bodySmall}
                                          color={theme.colors.labelLight}
                                          style={styles.detailLine}
                                        >
                                          {`${t('CredentialID ')} ${
                                            item.credentialId
                                          }`}
                                        </CustomText>
                                      )}
                                    </View>
                                    <View style={{ flexDirection: 'column' }}>
                                      {route?.params?.navigationFrom !=
                                        ContactVaultParentScreenType.fromMyTeamsAdvisor && (
                                        <Tap
                                          onPress={() => {
                                            setSelectedUserCertificate(item);
                                            handleEditScreenRedirection(
                                              'licensesEdit',
                                              item,
                                            );
                                          }}
                                        >
                                          <CustomImage
                                            source={Images.editSquare}
                                            type={ImageType.svg}
                                            style={styles.licenseInfoIcon}
                                            color={theme.colors.outline}
                                          />
                                        </Tap>
                                      )}

                                      <Tap
                                        onPress={() => {
                                          setSelectedUserCertificate(item);
                                          setShowCertificateDetailPopUp(true);
                                        }}
                                      >
                                        <CustomImage
                                          source={Images.eye}
                                          type={ImageType.svg}
                                          style={styles.licenseInfoIcon}
                                          color={theme.colors.outline}
                                        />
                                      </Tap>
                                    </View>
                                  </View>
                                </Tap>
                              ))
                            )}
                          </Animated.View>
                        ))}
                    </Shadow>
                  )}

                {route?.params?.navigationFrom !=
                  ContactVaultParentScreenType.fromMyTeamsAdvisor &&
                  !userDetails?.isAdvisor && (
                    <View style={styles.bottomMessage}>
                      <CustomText
                        variant={TextVariants.bodyLarge}
                        color={theme.colors.error}
                      >
                        {'*'}
                      </CustomText>
                      <CustomText>{t('ProfileMsg')}</CustomText>
                    </View>
                  )}

                {route?.params?.navigationFrom !=
                  ContactVaultParentScreenType.fromMyTeamsAdvisor && (
                  <View style={styles.buttonsContainer}>
                    {!route.params?.userId &&
                      !userDetails?.isAdvisor &&
                      userDetails?.accountsPermission
                        ?.canAccessAccountsView && (
                        <CustomButton
                          icon={{
                            source: Images.dollar,
                            type: ImageType.svg,
                          }}
                          onPress={handleViewAccountsPress}
                          style={styles.vaultBtn}
                          loading={loadingButtons == 'viewMyAccount'}
                        >
                          <CustomText
                            variant={TextVariants.titleSmall}
                            color={theme.colors.surface}
                          >
                            {t('ViewMyAccounts')}
                          </CustomText>
                        </CustomButton>
                      )}

                    {individualLoading.contactDetails ? (
                      <Skeleton>
                        <View style={styles.contactSkeletonContainer}>
                          <View style={styles.secureFileSkeletonButton}></View>
                        </View>
                      </Skeleton>
                    ) : (
                      ((route.params?.userId &&
                        ((userDetails?.role?.toLowerCase() == 'admin' &&
                          tenantDetails?.secureFilesAdminAccess) ||
                          (userDetails?.role?.toLowerCase() == 'advisor' &&
                            tenantDetails?.secureFilesAdvisorAccess))) ||
                        (!userDetails?.isAdvisor &&
                          tenantDetails?.secureFilesContactAccess)) && (
                        <CustomButton
                          icon={{
                            source: Images.fileLock,
                            type: ImageType.svg,
                          }}
                          onPress={() => {
                            if (route.params?.userId) {
                              Log(
                                '.navigationFrom on profile : ' +
                                  route.params.navigationFrom,
                              );
                              navigation.navigate('ContactVault', {
                                userId: route?.params?.userId!,
                                navigationFrom: route.params.navigationFrom,
                                userName: contactData?.fullName,
                              });
                            } else {
                              navigation.navigate('ContactVault');
                            }
                          }}
                          style={styles.vaultBtn}
                        >
                          <CustomText
                            variant={TextVariants.titleSmall}
                            color={theme.colors.surface}
                          >
                            {t('AccessSecureFiles')}
                          </CustomText>
                        </CustomButton>
                      )
                    )}

                    {!route?.params?.userId && !userDetails?.isAdvisor && (
                      <CustomButton
                        icon={{
                          source: Images.settings,
                          type: ImageType.svg,
                        }}
                        onPress={() => navigation.navigate('SettingsScreen')}
                        style={styles.vaultBtn}
                      >
                        <CustomText
                          variant={TextVariants.titleSmall}
                          color={theme.colors.surface}
                        >
                          {t('ManageSettings')}
                        </CustomText>
                      </CustomButton>
                    )}
                  </View>
                )}

                {!route?.params?.userId && (
                  <CustomButton
                    mode={ButtonVariants.outlined}
                    textColor={theme.colors.error}
                    style={styles.logoutButton}
                    onPress={() => setShowLogout(true)}
                  >
                    {t('Logout')}
                  </CustomButton>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <CustomImagePicker
        showPopup={showImageSelectionPopup}
        setShowPopup={setShowImageSelectionPopup}
        mediaList={handleMediaList}
        crop={true}
        cropHeight={720}
        cropWidth={720}
      />

      <CustomPopup
        shown={showOutOfOfficeWarningPopUp}
        setShown={setShowOutOfOfficeWarningPopUp}
        compact
        msg={t('OutOfOfficeChangeMsg')}
        loading={statusLoading}
        dismissOnBackPress={!statusLoading}
        onPositivePress={() => {
          callChangeStatusApi({
            statusValue: statusToBeUpdated,
            isOutOfOfficeUpdated: true,
          });
        }}
        onNegativePress={() => {
          setShowOutOfOfficeWarningPopUp(false);
        }}
      />

      <CustomActionSheetPoup
        shown={showActionSheet}
        setShown={setShowActionSheet}
        title={actionSheetItem == 'actionItem' ? t('ActionItem') : t('Feed')}
        centered={false}
        hideIcons={false}
        children={[
          {
            image: Images.addSquare,
            imageType: ImageType.svg,
            title:
              actionSheetItem == 'actionItem'
                ? t('AddActionItem')
                : t('AddPost'),
            onPress: () => {
              if (actionSheetItem == 'actionItem') {
                navigation.navigate('AddActionItem', {
                  userId: route?.params?.userId,
                });
              } else {
                navigation.navigate('CreatePost', {
                  selectedUserId: route?.params?.userId,
                  navigationFrom: FeedParentScreenType.contactListing,
                });
              }
            },
          },
          {
            title:
              actionSheetItem == 'actionItem'
                ? t('ViewActionItem')
                : t('ViewFeed'),
            image:
              actionSheetItem == 'actionItem'
                ? Images.actionItem
                : Images.newspaper,
            imageType: ImageType.svg,
            onPress: () => {
              if (actionSheetItem == 'actionItem') {
                navigation.navigate('ActionItemList', {
                  userId: route?.params?.userId,
                });
              } else {
                navigation.navigate('ContactFeed', {
                  selectedUserId: route?.params?.userId,
                  navigationFrom: FeedParentScreenType.contactListing,
                });
              }
            },
          },
        ]}
      />

      <CustomActionSheetPoup
        shown={showStatusPopUp}
        setShown={setShowStatusPopUp}
        centered={false}
        hideIcons={false}
        onCancelClick={() => setShowStatusPopUp(false)}
        children={[
          {
            title: UserStatus.Available,
            image: Images.success,
            imageColor:
              selectedStatus != UserStatus.Available
                ? theme.colors.surface
                : theme.colors.completed,
            imageType: ImageType.svg,
            onPress: () => {
              if (selectedStatus == UserStatus.OutOfOffice) {
                setIsStatusUpdatedFromOutOfOffice(true);
                setStatusToBeUpdated(UserStatus.Available);
                setTimeout(() => {
                  setShowOutOfOfficeWarningPopUp(true);
                }, 100);
              } else {
                callChangeStatusApi({ statusValue: UserStatus.Available });
              }
            },
          },
          {
            title: UserStatus.Busy,
            image: Images.success,
            imageColor:
              selectedStatus != UserStatus.Busy
                ? theme.colors.surface
                : theme.colors.completed,
            imageType: ImageType.svg,
            onPress: () => {
              if (selectedStatus == UserStatus.OutOfOffice) {
                setIsStatusUpdatedFromOutOfOffice(true);
                setStatusToBeUpdated(UserStatus.Busy);
                setTimeout(() => {
                  setShowOutOfOfficeWarningPopUp(true);
                }, 100);
              } else {
                callChangeStatusApi({ statusValue: UserStatus.Busy });
              }
            },
          },
          {
            title: UserStatus.OutOfOffice,
            image: Images.success,
            imageColor:
              selectedStatus != UserStatus.OutOfOffice
                ? theme.colors.surface
                : theme.colors.completed,
            imageType: ImageType.svg,

            onPress: () => {
              handleOutOfOfficeStatus();
            },
          },
        ]}
      />

      <CustomBottomPopup
        shown={showAddNote}
        setShown={setShowAddNote}
        title={t('AddNote')}
        onClose={() => {
          setValue('message', '');
        }}
        keyboardHandle={true}
      >
        <View style={styles.notesAddBottomPopup}>
          <FormTextInput
            control={control}
            name={'message'}
            showLabel={false}
            showError={false}
            multiLine={true}
            placeholder={t('Message')}
            maxLines={4}
            height={100}
            style={{ marginBottom: 20 }}
            hidePreview={false}
          />

          <CustomButton
            mode={ButtonVariants.contained}
            loading={loadingButtons == 'saveOrDeleteNotes'}
            onPress={handleSubmit((data: Schema) => {
              CreateOrEditNotesApi.mutate({
                UserId: route?.params?.userId,
                Notes: data.message,
              });
            })}
          >
            {t('Add')}
          </CustomButton>
        </View>
      </CustomBottomPopup>

      <CustomBottomPopup
        shown={showDateSelectionPopUp}
        setShown={setShowDateSelectionPopUp}
        title={t('SelectStartEndDate')}
        onClose={() => {
          setValue('message', '');
        }}
      >
        <View style={styles.notesAddBottomPopup}>
          <Tap
            style={{ padding: 0 }}
            onPress={() => {
              if (isEmpty(startDateTime)) {
                setStartDateTime(
                  formatDate({
                    date: getDefaultStartDateTime(),
                    returnFormat: 'MMM DD YYYY hh:mm a',
                  }),
                );
              }
              setShowDateSelectionPopUp(false);
              setDateSelection(DateSelectionType.start);
              setShowDatePicker(true);
            }}
          >
            <CustomTextInput
              label={t('StartDate')}
              enabled={false}
              text={startDateTime}
              onChangeText={setStartDateTime}
              errorMsg={''}
              suffixIcon={{
                source: Images.calendar,
                type: ImageType.svg,
                color: theme.colors.onSurfaceVariant,
              }}
            />
          </Tap>

          <Tap
            style={{ padding: 0 }}
            onPress={() => {
              if (isEmpty(endDateTime)) {
                setEndDateTime(
                  formatDate({
                    date: getDefaultEndDateTime(),
                    returnFormat: 'MMM DD YYYY hh:mm a',
                  }),
                );
              }
              setShowDateSelectionPopUp(false);
              setDateSelection(DateSelectionType.end);
              setShowDatePicker(true);
            }}
          >
            <CustomTextInput
              label={t('EndDate')}
              enabled={false}
              text={endDateTime}
              onChangeText={setEndDateTime}
              errorMsg={''}
              suffixIcon={{
                source: Images.calendar,
                type: ImageType.svg,
                color: theme.colors.onSurfaceVariant,
              }}
            />
          </Tap>
          {!isEmpty(errorMsg) && (
            <CustomText
              style={styles.errorMsg}
              color={theme.colors.error}
            >{`${'*'}${errorMsg}`}</CustomText>
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: 15,
              justifyContent: 'center',
            }}
          >
            <CustomButton
              mode={ButtonVariants.contained}
              loading={statusLoading}
              style={styles.popupBtn}
              onPress={() =>
                callChangeStatusApi({
                  statusValue: UserStatus.OutOfOffice,
                  startDateValue: startDateTime,
                  endDateValue: endDateTime,
                })
              }
            >
              {(!isEmpty(currentStatusData?.endDate) &&
                !isEmpty(currentStatusData?.startDate)) ||
              isChangeSaveBtnLabel
                ? t('Update')
                : t('Save')}
            </CustomButton>
            {((!isEmpty(currentStatusData?.endDate) &&
              !isEmpty(currentStatusData?.startDate)) ||
              isChangeSaveBtnLabel) && (
              <CustomButton
                mode={ButtonVariants.contained}
                loading={dltOutOfOfcLoading}
                style={styles.popupBtn}
                onPress={() => deleteOutOfOfficeApi.mutate({})}
              >
                {t('TurnOff')}
              </CustomButton>
            )}
          </View>
        </View>
      </CustomBottomPopup>

      <CustomDatePicker
        showPopup={showDatePicker}
        setShowPopup={setShowDatePicker}
        title={
          dateSelection === DateSelectionType.start
            ? t('SelectStartDateTime')
            : dateSelection === DateSelectionType.end
            ? t('SelectEndDateTime')
            : ''
        }
        date={handleSetDate()}
        setDate={handleSelectedDate}
        mode={DatePickerMode.datetime}
      />

      <CustomPopup
        shown={showLogout}
        setShown={setShowLogout}
        compact
        title={t('Logout')}
        msg={t('LogoutMsg')}
        loading={logoutLoading}
        dismissOnBackPress={!logoutLoading}
        onPositivePress={() => {
          setLogoutLoading(true);
          logout({}).then(value => {
            setLogoutLoading(false);
            setShowLogout(false);
          });
        }}
        onNegativePress={() => {
          setShowLogout(false);
          setLogoutLoading(false);
        }}
      />

      <CustomBottomPopup
        shown={showCertificateDetailPopUp}
        setShown={setShowCertificateDetailPopUp}
        title={t('CertificateDetail')}
        dismissOnBackPress={true}
        dismissOnClosePress={true}
      >
        <View
          style={
            selectedUserCertificate?.fileURL
              ? styles.certificatePopupWithImg
              : styles.certificatePopupWithOutImg
          }
        >
          <CustomText variant={TextVariants.bodyLarge}>
            {selectedUserCertificate?.certificateName}
          </CustomText>
          {selectedUserCertificate?.fileURL && (
            <Shadow style={styles.certificateImgWrapper}>
              <CustomImage
                source={{ uri: selectedUserCertificate?.fileURL }}
                style={styles.certificateImg}
                resizeMode={ResizeModeType.cover}
              />
            </Shadow>
          )}

          <View style={styles.certificateDetail}>
            <CustomImage
              source={Images.certificate}
              style={styles.certificateIcon}
              color={theme.colors.onSurfaceVariant}
            />

            <View style={styles.detailsContainer}>
              {selectedUserCertificate?.issuingOrganization && (
                <CustomText
                  variant={TextVariants.bodySmall}
                  style={styles.detailLine}
                >{`${t('IssuingOrganization')} : - ${
                  selectedUserCertificate?.issuingOrganization
                }`}</CustomText>
              )}
              {selectedUserCertificate?.issueDate && (
                <CustomText
                  variant={TextVariants.bodySmall}
                  style={styles.detailLine}
                >{`${t('IssueDate')} : - ${
                  selectedUserCertificate?.issueDate
                }`}</CustomText>
              )}
              {selectedUserCertificate?.credentialId && (
                <CustomText
                  variant={TextVariants.bodySmall}
                  style={styles.detailLine}
                >{`${t('CredentialId')} : - ${
                  selectedUserCertificate?.credentialId
                }`}</CustomText>
              )}
            </View>
          </View>
        </View>
      </CustomBottomPopup>
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
    },
    skeletonMainContainer: {
      marginHorizontal: 20,
      marginVertical: 10,
      gap: 15,
      flex: 1,
    },
    skeletonOpenAccordian: {
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      width: '100%',
      padding: 10,
      gap: 10,
    },
    skeletonAccordian: {
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      width: '100%',
      padding: 10,
    },
    skeletonAccordianTitle: {
      width: '55%',
      height: 30,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    skeletonAccordianContentContainer: {
      borderTopWidth: 0.5,
      gap: 10,
      paddingTop: 10,
    },
    skeletonAccordianContentView: {
      flexDirection: 'row',
      gap: 50,
    },
    skeletonAccordianContent: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 20,
      width: '30%',
    },
    contactSkeletonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginVertical: 10,
      gap: 10,
    },
    contactSkeletonProfile: {
      height: 120,
      width: 120,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSkeletonButtonContainer: {
      justifyContent: 'space-between',
      gap: 40,
    },
    contactSkeletonButton: {
      height: 35,
      width: 140,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSummarySkeletonContainer: {
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 20,
      marginVertical: 10,
    },
    contactSummarySkeletonProfile: {
      height: 60,
      width: 60,
      backgroundColor: theme.colors.outline,
      borderRadius: 999,
    },
    contactSummarySkeletonName: {
      height: 25,
      width: '60%',
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSummarySkeletonActionItems: {
      height: 45,
      width: '100%',
      marginTop: 5,
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      justifyContent: 'space-around',
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactSummarySkeletonActionItem: {
      height: 20,
      width: 20,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactHeaderContainer: {
      alignItems: 'center',
      gap: 10,
      marginVertical: 10,
      marginHorizontal: 20,
    },
    ContactSummaryDp: {
      height: 60,
      width: 60,
      borderRadius: 999,
    },
    contactGradient: {
      flexDirection: 'row',
      width: '100%',
      borderRadius: theme.roundness,
      paddingVertical: 10,
    },
    contactHeaderItem: {
      borderRightColor: theme.colors.onPrimary,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 20,
      width: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      padding: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
    },
    tapPaddingZero: {
      padding: 0,
    },
    profilePicture: {
      height: 120,
      width: 120,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerButtonContainer: {
      gap: 20,
    },
    accordianContainer: {
      padding: 0,
      marginHorizontal: 20,
      marginVertical: 10,
    },
    buttonsContainer: {
      gap: 10,
      paddingHorizontal: 20,
      marginVertical: 25,
    },
    vaultBtn: {
      padding: 0,
    },
    accordianTap: {
      padding: 15,
    },
    accordianTapView: {
      flexDirection: 'row',
      gap: 15,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accordianTitle: {
      flex: 1,
    },
    accordianTitleContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      flex: 1,
    },
    editIconTap: {
      padding: 0,
    },
    editIcon: {
      height: 20,
      width: 20,
    },
    accordianDrawerContainer: {
      paddingVertical: 0,
    },
    accordianDrawer: {
      padding: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.outline,
      gap: 15,
    },
    accordianDrawerItem: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    accordianLabelGroup: {
      marginTop: 1,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    accordianItemIcon: {
      height: 15,
      width: 15,
      marginTop: 1,
    },
    labelText: {
      width: 90,
      marginTop: 1,
    },
    errorMsg: {
      marginBottom: 20,
    },
    labelTextColon: {
      marginTop: 1,
    },
    valueText: {
      flex: 1,
      marginBottom: 'auto',
    },
    bottomMessage: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 5,
    },
    logoutContainer: {
      justifyContent: 'flex-end',
    },
    logoutButton: {
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 25,
      borderColor: theme.colors.error,
    },
    date: {
      marginTop: 10,
    },
    status: {
      borderRadius: theme.roundness,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primaryHighlight1,
    },
    programName: {
      flex: 1,
    },
    noTemplates: {
      alignItems: 'center',
    },
    flatListContainer: {
      borderRadius: theme.roundness,
      borderColor: theme.colors.outline,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    noteAccordianAddButton: {
      borderRadius: theme.roundness,
      padding: 0,
    },
    accordianDrawerNotes: {
      padding: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.outline,
      gap: 10,
    },
    accordianDrawerNotesItems: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      paddingBottom: 10,
      borderColor: theme.colors.outline,
    },
    notesBulletPoint: {
      marginTop: -7,
    },
    notesDate: {
      alignSelf: 'flex-end',
      marginTop: 5,
    },
    accordianNoteDeleteIconTap: {
      width: 30,
      height: 30,
      borderRadius: theme.roundness,
    },
    accordianNoteDeleteIcon: {
      height: 20,
      width: 20,
    },
    notesAddBottomPopup: {
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 20,
      maxHeight: 400,
      flex: 1,
    },
    addNoteInput: {
      maxHeight: 300,
    },
    skeletonNotesAccordianContainer: {
      padding: 10,
    },
    skeletonNotesAccordian: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      height: 40,
      width: '100%',
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      marginBottom: 10,
    },
    skeletonNotesAccordianKey: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 15,
      width: '60%',
    },
    skeletonNotesAccordianValue: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 20,
      width: 20,
    },
    StatusIcon: {
      height: 16,
      width: 16,
      alignSelf: 'center',
      marginTop: 0.5,
    },
    statusWrapper: {
      flexDirection: 'row',
      // justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: 15,
    },
    popupBtn: {
      flex: 1,
    },
    secureFileSkeletonButton: {
      height: 30,
      flex: 1,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    licenseListContainer: {
      padding: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.outline,
      gap: 12,
    },
    licenseItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 0,
    },
    licenseIcon: {
      height: 30,
      width: 20,
      marginTop: 2,
    },
    licenseTextWrapper: {
      flex: 1,
      marginLeft: 10,
    },
    licenseTitle: {
      marginBottom: 2,
    },
    licenseInfoIcon: {
      height: 18,
      width: 18,
      marginLeft: 15,
      marginTop: 2,
    },
    noLicenseWrapper: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    certificateImg: {
      borderRadius: theme.roundness,
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    certificateImgWrapper: {
      width: '100%',
      height: 300, // fixed viewing box height
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 10,
    },
    certificatePopUp: {
      height: 500,
    },
    certificateIcon: {
      marginTop: 8,
      height: 35,
      width: 25,
    },

    detailsContainer: {
      flex: 1,
      flexDirection: 'column',
      rowGap: 4,
      marginTop: 10,
    },

    detailLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 3,
    },
    certificateDetail: {
      flexDirection: 'row',
      gap: 15,
    },

    certificatePopupWithImg: { height: 600, marginHorizontal: 10 },
    certificatePopupWithOutImg: { height: 400, marginHorizontal: 10 },
  });

export default Profile;
