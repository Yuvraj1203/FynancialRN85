import {
  CustomButton,
  CustomChips,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import {
  CustomDatePicker,
  CustomDropDownPopup,
  CustomHeader,
  CustomTextInput,
  FormTextInput,
} from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import { InputModes } from '@/components/molecules/customTextInput/formTextInput';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  CountryData,
  GetAllStateForLookUpTableModel,
  GetUserContactInfoModel,
  GetUserPersonalInfoModel,
  SaveAdvisorPersonalDetailsModel,
  StateObject,
  SystemTimeZoneList,
  TagList,
} from '@/services/models';
import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  elimateHtmlElement,
  formatDate,
  isEmpty,
  parseDate,
  showSnackbar,
} from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { z } from 'zod';
import { DateFormats, ProfileReturnProp } from '../profile/profile';

export type ProfileEditProps = {
  personalDetails?: GetUserPersonalInfoModel;
  userId?: number;
  subSection?: 'personal' | 'contact';
};

function ProfileEdit() {
  /** Added by @Yuvraj 27-03-2025 -> navigate to different screen (FYN-6016) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 27-03-2025 -> get params from parent screen (FYN-6016) */
  const route = useAppRoute('ProfileEdit')?.params;

  /** Added by @Yuvraj 27-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-6016) */
  const theme = useTheme();

  /** Added by @Yuvraj 27-03-2025 -> access StylesSheet with theme implemented (FYN-6016) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 27-03-2025 -> translations for labels (FYN-6016) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 27-03-2025 -> Retrieve user details from store (FYN-6016)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Yuvraj 27-03-2025 -> loading state for whole ui (FYN-6016) */
  const [loading, setLoading] = useState(false);

  /** Added by @Yuvraj 27-03-2025 -> loading state for whole ui (FYN-6016) */
  const [sectionLoader, setSectionLoader] = useState('');

  /** Added by @Yuvraj 27-03-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6016)*/
  const { sendDataBack } = useReturnDataContext();

  //  state variables for showing custom pop of datePicker
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**  Added by @Yuvraj 24-03-2025 -> for saving contact details from params (FYN-5997)*/
  const [contactData, setContactData] = useState<GetUserContactInfoModel>();

  const [tagUserList, setTagUserList] = useState<TagList[]>([]);

  /** Added by @Yuvraj 27-03-2025 -> country dropdown popup (FYN-6016) */
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  /** Added by @Yuvraj 27-03-2025 -> all country list (FYN-6016) */
  const [countryList, setCountryList] = useState<
    (CountryData | undefined)[] | undefined
  >([]);

  /** Added by @Yuvraj 27-03-2025 -> country state (FYN-6016) */
  const [country, setCountry] = useState<CountryData | undefined>();

  /** Added by @Yuvraj 27-03-2025 -> country Flag  (FYN-6014) */
  const [countryFlag, setCountryFlag] = useState<CountryData | undefined>();

  /** Added by @Yuvraj 27-03-2025 -> State dropdown popup (FYN-6016) */
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  /** Added by @Yuvraj 27-03-2025 -> flag dropdown popup (FYN-6014) */
  const [showFlagDropdown, setShowFlagDropdown] = useState(false);

  /** Added by @Yuvraj 27-03-2025 -> tags popup state (FYN-6014) */
  const [showTagsPopup, setShowTagsPopup] = useState(false);

  /** Added by @Yuvraj 27-03-2025 -> state list of selected country (FYN-6016) */
  const [stateList, setStateList] = useState<
    (StateObject | undefined)[] | undefined
  >([]);

  /** Added by @Yuvraj 27-03-2025 -> State of the selcted state (FYN-6016) */
  const [countryState, setCountryState] = useState<StateObject | undefined>();

  const isPastDay = (s?: string) => {
    if (!s) return false;
    const d = parseDate({
      date: s,
      parseFormat: DateFormats.displayShortMonth,
    });
    if (!d) return false;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    );
    return pick < today;
  };

  const [selectedTimeZone, setselectedTimeZone] =
    useState<SystemTimeZoneList>();
  const [userTimeZoneList, setuserTimeZoneList] = useState<
    SystemTimeZoneList[]
  >([]);
  /** Added by @Yuvraj 27-03-2025 -> tags popup state (FYN-6014) */
  const [showTimezonePopup, setShowTimezonePopup] = useState(false);

  useEffect(() => {
    if (userDetails) {
      GetUserContactInfoApi.mutate({
        userId: route?.userId ? route?.userId : userDetails?.userID,
      });
    }
  }, []);

  /** Added by @Yuvraj 27-03-2025 -> schema for input validation (FYN-6016) */
  const urlRegex = /^(https?:\/\/)[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?$/;
  const maxUrlLength = 1000;

  const schema = z.object({
    firstName: z.string().min(1, { message: t('FirstNameReq') }),
    lastName: z.string().min(1, { message: t('LastNameReq') }),
    dob: z.string().refine(val => !val || isPastDay, {
      message: t('DateOfBirthValidationMsg'),
    }),
    calendarLink: z
      .string()
      .max(maxUrlLength, { message: t('UrlExceedsMaxLength') })
      .optional()
      .refine(val => val === '' || urlRegex.test(val!), {
        message: t('InvalidCalendarUrl'),
      }),
    secureUploadLink: z
      .string()
      .max(maxUrlLength, { message: t('UrlExceedsMaxLength') })
      .optional()
      .refine(val => val === '' || urlRegex.test(val!), {
        message: t('InvalidCalendarUrl'),
      }),
    address1: z.string(),
    address2: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    timezone: z.string(),
    websiteUrl: z
      .string()
      .max(maxUrlLength, { message: t('UrlExceedsMaxLength') })
      .optional()
      .refine(val => val === '' || urlRegex.test(val!), {
        message: t('InvalidCalendarUrl'),
      }),
  });

  /** Added by @Yuvraj 27-03-2025 -> schema type generator (FYN-6016) */
  type Schema = z.infer<typeof schema>;

  /** Added by @Yuvraj 27-03-2025 -> state for form for Profile (FYN-6016) */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    setError, // 👈 add
    clearErrors,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      firstName: userDetails?.firstName,
      lastName: userDetails?.lastName,
      dob: !isEmpty(userDetails?.dob)
        ? formatDate({
            date: userDetails?.dob!,
            parseFormat: DateFormats.parseDateFormat,
            returnFormat: DateFormats.displayShortMonth,
          })
        : '',
      calendarLink: userDetails?.calenderLink,
      secureUploadLink: route?.personalDetails?.secureUploadURL,
      address1: elimateHtmlElement(userDetails?.address!),
      address2: userDetails?.addressLine2,
      city: userDetails?.city,
      state: userDetails?.state,
      country: userDetails?.country,
      timezone: '',
      websiteUrl: contactData?.websiteURL,
    },
    resolver: zodResolver(schema),
  });

  /** Added by @Yuvraj 27-03-2025 -> on Save click (FYN-6016) */
  const onSubmit = (data: Schema) => {
    const dateOfBirth = formatDate({
      date: data.dob,
      parseFormat: DateFormats.displayShortMonth,
      returnFormat: DateFormats.isoDate,
    });

    if (route?.subSection == 'personal') {
      saveAdvisorPersonalDetailsApi.mutate({
        userId: userDetails?.userID,
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: userDetails?.preferredName,
        dob: dateOfBirth === 'Invalid Date' ? '' : dateOfBirth,
        gender: '0',
        userType: userDetails?.role,
        jobTitle: route.personalDetails?.jobTitleId?.toString(),
        calenderLink: data.calendarLink,
        secureUploadURL: data.secureUploadLink,
      });
    } else {
      saveUserContactInfoApi.mutate({
        userId: userDetails?.userID,
        Email: userDetails?.email,
        PhoneNo: userDetails?.phone,
        AddressLine1: data.address1,
        AddressLine2: data.address2,
        City: data.city,
        Zip: userDetails?.zipCode,
        CountryId: country ? country.id : 328,
        StateId: countryState?.id ? countryState?.id : 0,
        CountryCodeId: country?.id ? country.id : 0, //country flag (ph. no. code)
        TimeZoneName: selectedTimeZone?.standardName, // Replace with the actual timezone if dynamic
        WebsiteURL: data.websiteUrl,
      });
    }
  };

  /** Added by @Yuvraj 27-03-2025 -> schema for input validation (FYN-6014) */
  const contactSchema = z.object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: t('FirstNameReq') }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: t('LastNameReq') }),
    preferredName: z.string().trim(),
    dob: z.string().refine(val => !val || isPastDay, {
      message: t('DateOfBirthValidationMsg'),
    }),
    contactType: z.string(),
    emailAddress: z.string().trim().email(),
    countryCode: z.string(),
    countryCodeId: z.number(),
    phone: z.string().max(12, { message: t('CantExceed12') }),
    zipCodes: z.string().max(10, { message: t('CantExceed10') }),
    address1: z.string(),
    address2: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
  });

  /** Added by @Yuvraj 27-03-2025 -> schema type generator (FYN-6016) */
  type ContactSchema = z.infer<typeof contactSchema>;

  /** Added by @Yuvraj 27-03-2025 -> state for contact profile (FYN-6016) */

  const {
    control: contactControl,
    handleSubmit: handleContactSubmit,
    setValue: setContactValue,
    getValues: getContactValues,
    setError: setContactError,
    clearErrors: clearContactErrors,
    formState: {
      errors: contactErrors,
      validatingFields: contactValidatingFields,
    },
  } = useForm<ContactSchema>({
    defaultValues: {
      firstName: route?.personalDetails?.firstName,
      lastName: route?.personalDetails?.lastName,
      preferredName: route?.personalDetails?.preferredName,
      dob: !isEmpty(route?.personalDetails?.dob)
        ? formatDate({
            date: route?.personalDetails?.dob!,
            parseFormat: DateFormats.parseDateFormat,
            returnFormat: DateFormats.displayShortMonth,
          })
        : '',
      contactType: route?.personalDetails?.userType,
      emailAddress: contactData?.emailAddress,
      countryCode: contactData?.countryCode,
      countryCodeId: contactData?.countryCodeId,
      phone: contactData?.phone,
      zipCodes: contactData?.zipCode,
      address1: contactData?.addressLine1,
      address2: contactData?.addressLine2,
      city: contactData?.city,
      state: countryState?.displayName ? countryState.displayName : '',
      country: country?.name
        ? country.name
        : contactData?.countryList?.at(0)?.country?.name,
    },
    resolver: zodResolver(contactSchema),
  });

  /** Added by @Yuvraj 27-03-2025 -> on Save click (FYN-6016) */
  const onContactSubmit = (data: ContactSchema) => {
    const dateOfBirth = formatDate({
      date: data.dob!,
      parseFormat: DateFormats.displayShortMonth,
      returnFormat: DateFormats.ApiDob,
    });
    if (route?.subSection == 'personal') {
      saveUserPersonalInfoApi.mutate({
        UserId: route?.userId,
        FirstName: data.firstName,
        LastName: data.lastName,
        PreferredName: data.preferredName,
        Gender: 0,
        DOB: dateOfBirth === 'Invalid Date' ? null : dateOfBirth,
        UserType:
          data.contactType == 'Client'
            ? 'customer'
            : data.contactType.toLowerCase(),
      });
    } else {
      saveUserContactInfoApi.mutate({
        userId: route?.userId,
        Email: data.emailAddress,
        PhoneNo: data.phone,
        AddressLine1: data.address1,
        AddressLine2: data.address2,
        City: data.city,
        Zip: data.zipCodes,
        CountryId: country ? country.id : 328,
        StateId: countryState?.id ? countryState?.id : 0,
        CountryCodeId: data.countryCodeId, //country flag (ph. no. code)
        TimeZoneName: contactData?.timeZoneName, // Replace with the actual timezone if dynamic
        TagList: tagUserList.map(tag => ({
          TagId: tag.id,
          TagName: tag.tagName,
        })),
      });
    }
  };

  // Helper to retrieve and format date of birth
  const handleSetDate = (): Date => {
    // Retrieve the date of birth from the form
    if (route?.userId && !isEmpty(getContactValues('dob'))) {
      return (
        parseDate({
          date: getContactValues('dob')!,
          parseFormat: DateFormats.displayShortMonth,
        }) ?? new Date()
      );
    } else if (!route?.userId && !isEmpty(getValues('dob'))) {
      return (
        parseDate({
          date: getValues('dob'),
          parseFormat: DateFormats.displayShortMonth,
        }) ?? new Date()
      );
    }

    return new Date(); // Default to today's date if not valid or not found
  };

  /** Added by @Yuvraj 27-03-2025 -> Handler for selecting date (FYN-6016) */
  // const handleSelectedDate = (value: Date) => {
  //   setValue(
  //     'dob',
  //     formatDate({
  //       date: value,
  //       returnFormat: DateFormats.displayShortMonth,
  //     }),
  //   );
  //   setContactValue(
  //     'dob',
  //     formatDate({
  //       date: value,
  //       returnFormat: DateFormats.displayShortMonth,
  //     }),
  //   );
  // };

  /** Handler for selecting DOB */
  const handleSelectedDate = (value: Date) => {
    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const picked = startOfDay(value);
    const today = startOfDay(new Date());

    const invalid = picked >= today; // future or today → invalid

    if (invalid) {
      const msg = t('DateOfBirthValidationMsg');
      // set error on whichever form is active; setting on both is safe
      setError('dob', { type: 'validate', message: msg });
      setContactError('dob', { type: 'validate', message: msg });
      // keep/clear the field value — pick ONE:
      // Option A: keep the shown value but show error
      // setValue('dob', formatDate({ date: value, returnFormat: DateFormats.displayShortMonth }), { shouldValidate: true, shouldDirty: true });
      // setContactValue('dob', formatDate({ date: value, returnFormat: DateFormats.displayShortMonth }), { shouldValidate: true, shouldDirty: true });

      // Option B (recommended): clear the field
      setValue('dob', '', { shouldValidate: true, shouldDirty: true });
      setContactValue('dob', '', { shouldValidate: true, shouldDirty: true });
      return;
    }

    // valid → clear errors and set value
    clearErrors('dob');
    clearContactErrors('dob');

    setValue(
      'dob',
      formatDate({
        date: value,
        returnFormat: DateFormats.displayShortMonth,
      }),
    );
    setContactValue(
      'dob',
      formatDate({
        date: value,
        returnFormat: DateFormats.displayShortMonth,
      }),
    );
    // setShowDatePicker(false);
  };

  /** Added by @Yuvraj 27-03-2025 -> Handler for selecting country from dropdown (FYN-6016) */
  const handleCountrySelect = (data?: CountryData) => {
    setValue('country', data?.name!);
    setContactValue('country', data?.name!);
    setValue('state', '');
    setContactValue('state', '');
    GetallstateforlookuptableApi.mutate({
      CountryId: data?.id,
      noLoader: true,
    });
    setCountry(data);
    setShowCountryDropdown(false);
  };

  /** Added by @Yuvraj 27-03-2025 -> Handler for selecting country code from dropdown (FYN-6014) */
  const handleFlagSelect = (data: CountryData) => {
    Log('handleFlagSelect' + JSON.stringify(data));

    setContactValue('countryCode', data?.code!);
    setContactValue('countryCodeId', data?.id!);
    setCountryFlag(data);
    setShowFlagDropdown(false);
  };

  /** Added by @Yuvraj 27-03-2025 -> Handler for selecting state from dropdown (FYN-6016) */
  const handleStateSelect = (data: StateObject) => {
    setValue('state', data?.displayName!);
    setContactValue('state', data?.displayName!);
    setCountryState(data);
    setShowStateDropdown(false);
  };

  /** Added by @Yuvraj 27-03-2025 -> Handler for selecting state from dropdown (FYN-6016) */
  const handleTimezoneSelect = (data: SystemTimeZoneList) => {
    setValue('timezone', data?.displayName!);
    setselectedTimeZone(data);
    setShowTimezonePopup(false);
  };

  /** Added by @Yuvraj 27-03-2025 -> to get all countries (FYN-6016) */
  const GetUserContactInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserContactInfoModel>({
        endpoint: ApiConstants.GetUserContactInfo,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate() {
      setSectionLoader('countryLoader');
      setLoading(true);
    },
    onSettled() {
      setSectionLoader('');
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      const result = data?.result;
      if (!result) return;

      const {
        countryId,
        countryCode,
        countryCodeId,
        countryList = [],
        emailAddress,
        phone,
        zipCode,
        addressLine1,
        addressLine2,
        city,
        tagUserList = [],
      } = result;

      // Country & Flag setup
      if (countryId) {
        const findedCountry = countryList.find(
          c => c.country?.id === countryId,
        )?.country;
        const findedFlag = countryList.find(
          c => c.country?.code === countryCode,
        )?.country;

        setCountry(findedCountry);
        setCountryFlag(findedFlag);

        if (findedCountry?.id) {
          GetallstateforlookuptableApi.mutate({ CountryId: findedCountry.id });
          setContactValue('country', findedCountry.name ?? '');
        }
      }

      // Only if coming from route.userId
      if (route?.userId) {
        setContactValue('emailAddress', emailAddress ?? '');
        setContactValue('countryCode', countryCode ?? '');
        setContactValue('countryCodeId', countryCodeId ?? 328);
        setContactValue('phone', phone ?? '');
        setContactValue('zipCodes', zipCode ?? '');
        setContactValue('address1', addressLine1 ?? '');
        setContactValue('address2', addressLine2 ?? '');
        setContactValue('city', city ?? '');
        setContactValue('state', countryState?.displayName ?? '');
      }
      if (data.result?.countryId == 0) {
        const countryName = data.result.countryList?.find(item => {
          return item.country?.isDefault;
        });
        setCountry(countryName?.country);
        setContactValue('country', countryName?.country?.name!);
        GetallstateforlookuptableApi.mutate({
          CountryId: countryName?.country?.id,
          noLoader: true,
        });
      }
      setContactData(result);
      setValue('websiteUrl', result.websiteURL ?? '');

      setCountryList(countryList.map(item => item.country));

      const convertedArray = tagUserList.map(item => ({
        tag: null,
        id: item.tagId,
        tagName: item.tagName,
        isSelected: false,
        contactCount: 0,
      }));
      setTagUserList(convertedArray);

      if (result?.systemTimeZoneList && result?.systemTimeZoneList.length > 0) {
        // 1) mark selected
        const zones = result?.systemTimeZoneList.map(zone => ({
          ...zone,
          isSelectedTimeZone: zone.standardName === userDetails?.timeZoneName,
        }));

        // 2) pull out the one that’s selected
        const defaultZone = zones.find(z => z.isSelectedTimeZone);
        // 3) build a new list with it first
        const ordered = defaultZone
          ? [defaultZone, ...zones.filter(z => !z.isSelectedTimeZone)]
          : zones;

        // 4) store & seed state
        setuserTimeZoneList(ordered);
        if (defaultZone) {
          setselectedTimeZone(defaultZone);
          setValue('timezone', defaultZone.displayName ?? '');
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 19-03-2025 -> api for state list (FYN-5997) */
  const GetallstateforlookuptableApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllStateForLookUpTableModel>({
        endpoint: ApiConstants.GetAllStateForLookUpTable,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      if (variables.noLoader) {
        setSectionLoader('stateLoader');
      } else {
        setSectionLoader('stateLoader');
        setLoading(true);
      }
    },
    onSettled() {
      setSectionLoader('');
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result?.items && data?.result?.items.length > 0) {
        const state = data?.result?.items?.find(
          s => s.id === contactData?.stateId,
        );
        setCountryState(state ? state : undefined);
        setContactValue(
          'state',
          state ? state.displayName! : data.result.items?.at(0)?.displayName!,
        );
        setStateList(data.result?.items);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 27-03-2025 -> updating personal information of contact (FYN-6014) */
  const saveUserPersonalInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<{ status: number }>({
        endpoint: ApiConstants.SaveUserPersonalInfo,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setSectionLoader('saveButtonLoader');
    },
    onSettled(data, error, variables, context) {
      setSectionLoader('');
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data?.success && data?.result?.status == 1) {
        showSnackbar(t('ContactDetailsUpdated'), 'success');
        sendDataBack('Profile', {
          isDetailsUpdated: true,
        } as ProfileReturnProp);
        handleGoBack(navigation);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 27-03-2025 -> updating personal information of contact (FYN-6014) */
  const saveUserContactInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<{ status?: number; message?: string }>({
        endpoint: ApiConstants.SaveUserContactInfo,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setSectionLoader('saveButtonLoader');
    },
    onSettled(data, error, variables, context) {
      setSectionLoader('');
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data?.success && data?.result?.status == 1) {
        showSnackbar(t('ContactDetailsUpdated'), 'success');
        sendDataBack('Profile', {
          isDetailsUpdated: true,
        } as ProfileReturnProp);
        handleGoBack(navigation);
      } else if (data.result?.message) {
        showSnackbar(data.result?.message, 'danger');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 27-03-2025 -> Api for updating profile (FYN-6016) */
  const saveAdvisorPersonalDetailsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<SaveAdvisorPersonalDetailsModel>({
        endpoint: ApiConstants.SaveAdvisorPersonalDetails,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setSectionLoader('saveButtonLoader');
    },
    onSettled(data, error, variables, context) {},
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result?.status == 1) {
        showSnackbar(t('ProfileDetailsUpdated'), 'success');
        sendDataBack('Profile', {
          isDetailsUpdated: true,
        } as ProfileReturnProp);
        handleGoBack(navigation);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  // -------------------------------------------------------------------------------------------

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={
            route?.subSection == 'personal'
              ? t('PersonalDetails')
              : t('ContactDetails')
          }
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
          style={styles.main}
        >
          <View style={styles.main}>
            <ScrollView
              keyboardShouldPersistTaps={'always'}
              style={styles.scrollContainer}
            >
              {route?.userId ? (
                <>
                  {loading ? (
                    <SkeletonList count={2}>
                      <View>
                        <View style={styles.skeletonInputContainer}>
                          <View style={styles.skeletonInputIcon}></View>
                          <View style={styles.skeletonInput}></View>
                        </View>
                        <View style={styles.skeletonInputMiddleContainer}>
                          <View style={styles.skeletonInputLeftContainer}>
                            <View style={styles.skeletonInputIcon}></View>
                            <View style={styles.skeletonInput}></View>
                          </View>
                          <View style={styles.skeletonInputRightContainer}>
                            <View style={styles.skeletonInputIcon}></View>
                            <View style={styles.skeletonInput}></View>
                          </View>
                        </View>
                        <View style={styles.skeletonInputContainer}>
                          <View style={styles.skeletonInputIcon}></View>
                          <View style={styles.skeletonInput}></View>
                        </View>
                      </View>
                    </SkeletonList>
                  ) : route?.subSection == 'personal' ? (
                    <>
                      <View style={styles.fullNameContainer}>
                        <FormTextInput
                          control={contactControl}
                          name="firstName"
                          placeholder={t('FirstName')}
                          label={t('FirstName')}
                          showLabel={true}
                          style={styles.nameInput}
                        />
                        <FormTextInput
                          control={contactControl}
                          name="lastName"
                          placeholder={t('LastName')}
                          label={t('LastName')}
                          showLabel={true}
                          style={styles.nameInput}
                        />
                      </View>
                      <FormTextInput
                        control={contactControl}
                        name="preferredName"
                        placeholder={t('PreferredName')}
                        label={t('PreferredName')}
                        showLabel={true}
                      />
                      <Tap
                        disableRipple
                        onPress={() => {
                          setShowDatePicker(true);
                        }}
                        style={styles.paddingZero}
                      >
                        <FormTextInput
                          label={t('DOB')}
                          name={'dob'}
                          control={contactControl}
                          enabled={false}
                          placeholder="MMM DD,YYYY"
                        />
                      </Tap>
                      <FormTextInput
                        control={contactControl}
                        name="contactType"
                        label={t('ContactType')}
                        showLabel={true}
                        enabled={false}
                        contentStyle={styles.disabledText}
                      />
                    </>
                  ) : (
                    <>
                      <FormTextInput
                        control={contactControl}
                        name="emailAddress"
                        placeholder={t('Email')}
                        label={t('Email')}
                        showLabel={true}
                      />
                      <View style={styles.fullNameContainer}>
                        <Tap
                          disableRipple={true}
                          style={styles.phonePrefix}
                          onPress={() => setShowFlagDropdown(true)}
                        >
                          <FormTextInput
                            control={contactControl}
                            name="countryCode"
                            placeholder={t('Code')}
                            label={t('Code')}
                            showLabel={true}
                            enabled={false}
                          />
                        </Tap>

                        <FormTextInput
                          control={contactControl}
                          name="phone"
                          inputMode={InputModes.phone}
                          placeholder={t('Phone')}
                          label={t('Phone')}
                          showLabel={true}
                          style={styles.phoneSuffix}
                        />
                      </View>
                      <FormTextInput
                        control={contactControl}
                        name="address1"
                        placeholder={t('AddressOne')}
                        label={t('AddressOne')}
                        showLabel={true}
                      />
                      <FormTextInput
                        control={contactControl}
                        name="address2"
                        placeholder={t('AddressTwo')}
                        label={t('AddressTwo')}
                        showLabel={true}
                      />
                      <FormTextInput
                        control={contactControl}
                        name="city"
                        placeholder={t('City')}
                        label={t('City')}
                        showLabel={true}
                      />
                      <Tap
                        disableRipple={true}
                        style={styles.paddingZero}
                        onPress={() => setShowStateDropdown(true)}
                      >
                        <FormTextInput
                          control={contactControl}
                          name="state"
                          loading={sectionLoader == 'stateLoader'}
                          placeholder={t('SelectState')}
                          label={t('State')}
                          showLabel={true}
                          enabled={false}
                        />
                      </Tap>

                      <Tap
                        disableRipple={true}
                        style={styles.paddingZero}
                        onPress={() => setShowCountryDropdown(true)}
                      >
                        <FormTextInput
                          control={contactControl}
                          name="country"
                          placeholder={t('SelectCountry')}
                          label={t('Country')}
                          showLabel={true}
                          enabled={false}
                        />
                      </Tap>
                      <FormTextInput
                        control={contactControl}
                        name="zipCodes"
                        inputMode={InputModes.phone}
                        placeholder={t('ZipCode')}
                        label={t('ZipCode')}
                        showLabel={true}
                      />

                      <Tap
                        disableRipple={true}
                        style={styles.paddingZero}
                        onPress={() => setShowTagsPopup(true)}
                      >
                        <CustomTextInput
                          placeholder={t('Tags')}
                          label={t('Tags')}
                          showLabel={true}
                          enabled={false}
                          text={t('Tags')}
                          onChangeText={() => t('Tags')}
                        />
                      </Tap>
                      {tagUserList.length > 0 && (
                        <View style={styles.chipsContainer}>
                          {tagUserList.map((item, index) => (
                            <CustomChips
                              key={item.id} // Always give a key in loop
                              chipId={item.id}
                              chipLabel={item.tagName}
                              onCloseClick={value => {
                                if (value) {
                                  setTagUserList(
                                    tagUserList.filter(
                                      tagItem => tagItem.id != item.id,
                                    ),
                                  );
                                }
                              }}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </>
              ) : route?.subSection == 'personal' ? (
                <>
                  <View style={styles.fullNameContainer}>
                    <FormTextInput
                      control={control}
                      name="firstName"
                      placeholder={t('FirstName')}
                      label={t('FirstName')}
                      showLabel={true}
                      style={styles.nameInput}
                    />
                    <FormTextInput
                      control={control}
                      name="lastName"
                      placeholder={t('LastName')}
                      label={t('LastName')}
                      showLabel={true}
                      style={styles.nameInput}
                    />
                  </View>
                  <Tap
                    disableRipple
                    onPress={() => {
                      setShowDatePicker(true);
                    }}
                    style={styles.paddingZero}
                  >
                    <FormTextInput
                      label={t('DOB')}
                      name={'dob'}
                      control={control}
                      enabled={false}
                      placeholder="MMM DD,YYYY"
                    />
                  </Tap>
                  {userDetails?.role?.toLowerCase() !== 'admin' && (
                    <>
                      <FormTextInput
                        control={control}
                        name="calendarLink"
                        placeholder={t('CalendarUrl')}
                        label={t('CalendarUrl')}
                        showLabel={true}
                        hidePreview={false}
                      />
                      <FormTextInput
                        control={control}
                        name="secureUploadLink"
                        placeholder={t('SecureUploadUrl')}
                        label={t('SecureUploadUrl')}
                        showLabel={true}
                        hidePreview={false}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <FormTextInput
                    control={control}
                    name="address1"
                    placeholder={t('AddressOne')}
                    label={t('AddressOne')}
                    showLabel={true}
                  />
                  <FormTextInput
                    control={control}
                    name="address2"
                    placeholder={t('AddressTwo')}
                    label={t('AddressTwo')}
                    showLabel={true}
                  />
                  <Tap
                    disableRipple={true}
                    style={styles.paddingZero}
                    onPress={() => setShowCountryDropdown(true)}
                  >
                    <FormTextInput
                      control={control}
                      name="country"
                      placeholder={t('SelectCountry')}
                      label={t('Country')}
                      showLabel={true}
                      enabled={false}
                    />
                  </Tap>
                  <Tap
                    disableRipple={true}
                    style={styles.paddingZero}
                    onPress={() => setShowStateDropdown(true)}
                  >
                    <FormTextInput
                      control={control}
                      name="state"
                      loading={sectionLoader == 'stateLoader'}
                      placeholder={t('SelectState')}
                      label={t('State')}
                      showLabel={true}
                      enabled={false}
                    />
                  </Tap>

                  <FormTextInput
                    control={control}
                    name="city"
                    placeholder={t('City')}
                    label={t('City')}
                    showLabel={true}
                  />

                  <Tap
                    disableRipple={true}
                    style={styles.paddingZero}
                    onPress={() => setShowTimezonePopup(true)}
                  >
                    <FormTextInput
                      control={control}
                      name="timezone"
                      placeholder={t('SelectTimeZone')}
                      label={t('Timezone')}
                      showLabel={true}
                      enabled={false}
                    />
                  </Tap>
                  {userDetails?.role?.toLowerCase() !== 'admin' && (
                    <FormTextInput
                      control={control}
                      name="websiteUrl"
                      placeholder={t('WebsiteUrl')}
                      label={t('WebsiteUrl')}
                      showLabel={true}
                      hidePreview={false}
                    />
                  )}
                </>
              )}
            </ScrollView>

            <Shadow style={styles.saveButtonContainer}>
              <CustomButton
                mode={ButtonVariants.contained}
                loading={sectionLoader == 'saveButtonLoader'}
                onPress={
                  route?.userId
                    ? handleContactSubmit(onContactSubmit)
                    : handleSubmit(onSubmit)
                }
              >
                {t('Save')}
              </CustomButton>
            </Shadow>
          </View>
        </KeyboardAvoidingView>

        <CustomDropDownPopup
          loading={sectionLoader == 'countryLoader'}
          showSearchOption={true}
          shown={showCountryDropdown}
          setShown={setShowCountryDropdown}
          title={t('SelectCountry')}
          items={(countryList ?? []).filter(
            (c): c is CountryData => c !== undefined,
          )}
          displayKey="name"
          idKey="id"
          selectedItem={country}
          onItemSelected={handleCountrySelect}
        />

        <CustomDropDownPopup
          loading={sectionLoader == 'stateLoader'}
          showSearchOption={true}
          shown={showStateDropdown}
          setShown={setShowStateDropdown}
          title={t('SelectState')}
          items={(stateList ?? []).filter(
            (c): c is StateObject => c !== undefined,
          )}
          displayKey="displayName"
          idKey="id"
          selectedItem={countryState}
          onItemSelected={handleStateSelect}
        />

        <CustomDropDownPopup
          loading={sectionLoader == 'countryLoader'}
          showSearchOption={true}
          shown={showFlagDropdown}
          setShown={setShowFlagDropdown}
          title={t('SelectCountry')}
          items={(countryList ?? []).filter(
            (c): c is CountryData => c !== undefined,
          )}
          displayKey="name"
          idKey="id"
          selectedItem={countryFlag}
          onItemSelected={handleFlagSelect}
        />

        <CustomDatePicker
          showPopup={showDatePicker}
          setShowPopup={setShowDatePicker}
          title={t('SelectDOB')}
          date={handleSetDate()}
          setDate={handleSelectedDate}
          mode={DatePickerMode.date}
        />

        <CustomDropDownPopup
          loading={false}
          showSearchOption={true}
          shown={showTagsPopup}
          onSave={values => {
            setTagUserList(values as TagList[]);
          }}
          setShown={setShowTagsPopup}
          title={t('SelectTags')}
          items={(contactData?.tagList ?? []).filter(
            (d): d is TagList => d !== undefined,
          )}
          displayKey="tagName"
          idKey="id"
          selectedMultipleItems={tagUserList}
          mode={DropdownModes.multiple}
        />

        <CustomDropDownPopup
          shown={showTimezonePopup}
          setShown={setShowTimezonePopup}
          title={t('SelectTimeZone')}
          loading={loading}
          items={userTimeZoneList}
          displayKey="displayName"
          idKey="id"
          mode={DropdownModes.single}
          selectedItem={selectedTimeZone}
          onItemSelected={handleTimezoneSelect}
        />
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    saveButtonContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
    },
    scrollContainer: {
      paddingVertical: 0,
      paddingHorizontal: 20,
      marginTop: 15,
    },
    fullNameContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    nameInput: {
      flex: 1,
    },
    phonePrefix: {
      width: '35%',
      padding: 0,
    },
    phoneSuffix: {
      width: '60%',
    },
    radioBtnLay: {
      flexDirection: 'row',
    },
    radioBtn: {
      flex: 1,
    },
    paddingZero: {
      padding: 0,
      margin: 0,
      marginBottom: 10,
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
      marginBottom: 30,
    },
    tagsArea: {
      paddingVertical: 10,
      paddingHorizontal: 5,
      marginTop: 5,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 100,
    },
    tagItem: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      gap: 5,
      padding: 5,
      margin: 5,
    },
    tagsRemoveIcon: {
      height: 20,
      width: 20,
    },
    skeletonInputContainer: {
      flexDirection: 'row',
      borderRadius: theme.roundness,
      borderWidth: 1,
      padding: 5,
      gap: 15,
      marginVertical: 8,
    },
    skeletonInputIcon: {
      height: 30,
      width: 30,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.outline,
    },
    skeletonInput: {
      height: 30,
      flexGrow: 1,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.outline,
    },
    skeletonInputMiddleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skeletonInputLeftContainer: {
      flexDirection: 'row',
      borderRadius: theme.roundness,
      borderWidth: 1,
      padding: 5,
      gap: 8,
      marginVertical: 8,
      width: '30%',
    },
    skeletonInputRightContainer: {
      flexDirection: 'row',
      borderRadius: theme.roundness,
      borderWidth: 1,
      padding: 5,
      gap: 8,
      marginVertical: 8,
      width: '65%',
    },
    disabledText: {
      color: theme.colors.outline,
    },
  });

export default ProfileEdit;
