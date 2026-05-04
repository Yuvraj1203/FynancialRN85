import {
  CustomAvatar,
  CustomButton,
  CustomChips,
  CustomFlatList,
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
  CustomDropDownPopup,
  CustomHeader,
  CustomImagePicker,
  FormTextInput,
  MentionTextInput,
} from '@/components/molecules';
import {
  SafeScreen,
  ScheduleDateTimePicker,
  ScheduleTargetAudiencePopup,
} from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';

import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import { CustomHtmlEditorRef } from '@/components/molecules/customTextInput/customHtmlEditor';
import { InputTextAlignVertical } from '@/components/molecules/customTextInput/mentionTextInput';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import {
  GetAllFeedPlaceholderFieldsModel,
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
  GetGlobalScheduleDetailForEditModel,
  GetScheduleTasksForGlobalCalendarModel,
  GetUsersByGroupIdForTagModel,
  SaveGlobalCalendarAndEventDataModel,
  UploadFileListToS3Model,
} from '@/services/models';
import { GetAllUsersForGlobalCalendarModel } from '@/services/models/getAllUsersForGlobalCalendarModel/getAllUsersForGlobalCalendarModel';
import { GetGlobalCalendarProgramListModel } from '@/services/models/getGlobalCalendarProgramListModel/getGlobalCalendarProgramListModel';
import { DocumentDetails } from '@/services/models/getListOfDocumentsForFeedModel/getListOfDocumentsForFeedModel';
import { onBehalfOfModel } from '@/services/models/getScheduleTasksForGlobalCalendarModel/getScheduleTasksForGlobalCalendarModel';
import { tenantDetailStore, userStore } from '@/store';
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
  formatMentions,
  formatMentionsInsideHtml,
  getCurrentDateTime,
  getFileInfoWithMime,
  getImageSize,
  isEmpty,
  processHtmlContent,
  showSnackbar,
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

export type AddSchedulePostProps = {
  item?: GetScheduleTasksForGlobalCalendarModel;
};

function AddSchedulePost() {
  const navigation = useAppNavigation();

  const route = useAppRoute('AddSchedulePost');

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  type ImageIdArray = {
    FileExtension?: string;
    ImageDataID: string;
  };
  type ResourceIdType = {
    documentId?: string;
  };

  /** Added by @Yuvraj 04-08-2025 -> tenant details store (FYN-7078) */
  const tenantDetail = tenantDetailStore().tenantDetails;

  // Access user details from store
  const userDetails = userStore(state => state.userDetails);
  /**
   * Added by @Yuvraj 27-03-2025 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-6016)*/
  const { sendDataBack } = useReturnDataContext();

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for loading indicators */
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<'schedule' | 'sendNow'>();

  const [endDateError, setEndDateError] = useState<string>('');

  /**  Added by @Ajay 08-04-2025 (#6199) ---> State management for tags, contacts, templates, and media */
  const [tagList, setTagList] = useState<GetCalItemtagsModel[]>([]);
  const [selectedTagList, setSelectedTagList] = useState<GetCalItemtagsModel[]>(
    [],
  );
  const [hideSuggestions, setHideSuggestions] = useState(0);
  const [allowBackPress, setAllowBackPress] = useState(true);
  const onBehalfOfList = [{ value: 'Self' }, { value: 'Primary Advisor' }];
  const [onBehalfOf, setOnBehalfOf] = useState<onBehalfOfModel>(
    onBehalfOfList[0],
  ); // default Self
  const [showOnBehalfOfPopUp, setShowOnBehalfOfPopUp] = useState(false);

  const [resourceList, setResourceList] = useState<DocumentDetails[]>([]);

  //Stores the filtered list of group members (FYN-4314) */
  const [groupMembersAllList, setGroupMembersAllList] = useState<
    GetUsersByGroupIdForTagModel[]
  >([]);
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

  const [canShowAdd, setCanShowAdd] = useState(false);

  const [mediaList, setMediaList] = useState<Asset[]>([]);
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);
  const [postData, setPostData] =
    useState<GetGlobalScheduleDetailForEditModel>();

  const [targetAudienceType, setTargetAudienceType] = useState<string>('');
  const [comment, setComment] = useState('');
  const commentRef = useRef<CustomHtmlEditorRef>(null);
  const [commentError, setCommentError] = useState('');

  // state for storing the placeholder for post
  const [placeholderFields, setPlaceholderFields] = useState<
    GetAllFeedPlaceholderFieldsModel[]
  >([]);
  const [placeholderLoading, setPlaceholderLoading] = useState(false);

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const enum DateFormats {
    FullDate = 'MMM-DD-YYYY hh:mm A',
    UIFullDate = 'MMM DD YYYY hh:mm A',
    ApiFullDate = 'YYYY-MM-DDTHH:mm:ss',
  }

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Initialize state variables for start and end date/time */
  const [startDateTime, setStartDateTime] = useState<string>(
    formatDate({
      date: getCurrentDateTime(),
      returnFormat: DateFormats.UIFullDate,
    }),
  );

  const [showTargetAudDropdown, setShowTargetAudDropdown] = useState(false);

  // /** Added by @Yuvraj 05-08-2025 -> dismiss keyboard on blur */
  // handleKeyboardDismiss(commentRef);

  useEffect(() => {
    setMediaList(prev => withAddSquare(prev, resourceList.length));
  }, [resourceList]);
  // place near other helpers
  const withAddSquare = (list: Asset[], resourceCount: number) => {
    const imgs = list.filter(m => m.uri !== Images.addSquare);
    const canShowAdd =
      imgs.length > 0 && resourceCount === 0 && imgs.length < 5;
    return canShowAdd
      ? [...imgs, { uri: Images.addSquare, fileName: 'add' } as Asset]
      : imgs;
  };

  useEffect(() => {
    if (userDetails) {
      // Pre-fill data when coming from the 'Community' screen (edit mode)
      if (route.params?.item) {
        getGlobalScheduleDetailForEditApi.mutate({
          Id: route?.params?.item?.taskIdentifier,
        });
      }
      /** Fetch associated tags, contacts, and templates using the task identifier */
      const taskIdentifier = route.params?.item?.id || 0;
      GetCalItemtags.mutate({ GlobalCalId: taskIdentifier });
      getAllUsersForGlobalCalendar.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarProgramList.mutate({ GlobalCalId: taskIdentifier });
      GetGlobalCalendarContactTypeApi.mutate({ GlobalCalId: taskIdentifier });
      GetAllFeedPlaceholderFieldsApi.mutate({});
    }
  }, []);

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Schema defined for form validation using Zod library */
  const schema = z.object({
    selectedTarget: z.string().optional(),
    scheduleDateTime: z.string().optional(),
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
      selectedTarget: '',
      scheduleDateTime: formatDate({
        date: getCurrentDateTime(),
        returnFormat: DateFormats.UIFullDate,
      }),
    },
    resolver: zodResolver(schema),
  });

  /** Added by @Yuvraj 04-08-2025 () ---> pressholderpress to insert data in input field */
  const handlePlaceholderPress = (item: GetAllFeedPlaceholderFieldsModel) => {
    // insertWithScroll(commentRef, `{${item.name}} `);
    //commentRef.current?.focusContentEditor();
    commentRef.current?.insertHtml(`{${item.name}} `);
  };

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Handle start date selection */
  const handleStartDatePress = (date?: string) => {
    if (date && date !== startDateTime) {
      setStartDateTime(date);
      setValue('scheduleDateTime', date);
    }
  };

  const handleRemoveTag = (tag: number) => {
    setSelectedTagList(selectedTagList.filter(item => item.id !== tag));
  };

  /**  Added by @Yuvraj 14-04-2025 (#6549) ---> Handle the removal of a selected contacts from the list */
  const handleRemoveContactType = (typeId: number) => {
    setSelectedContactTypeList(
      selectedContactTypeList.filter(item => item.contactType !== typeId),
    );
  };

  const handleRemoveContacts = (userId: number) => {
    setSelectedContactList(
      selectedContactList.filter(item => item.userId !== userId),
    );
  };

  //this is for restricting user to select template and placeholder both to check function
  function includesAny(str: string, words: (string | undefined)[]) {
    return words.some(word => str.includes(`{${word}}`));
  }

  const onSubmit = (data: Schema, isSendNow?: boolean) => {
    if (isEmpty(comment) && mediaList.length == 0 && resourceList.length == 0) {
      setCommentError(t('PleaseEnterSomethingOrSelectImage'));
      return false;
    }

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

    //this whole thing is for restricting user to select template and placeholder both
    const words = placeholderFields.map(item => item.name);

    if (
      includesAny(comment, words) &&
      selectedTemplate?.programID &&
      selectedTemplate?.programID?.length > 0
    ) {
      showSnackbar(
        'Please remove the placeholders or choose a different target audience to proceed.',
        'warning',
      );
      return;
    }

    setCommentError('');
    if (isSendNow) {
      showAlertPopup({
        title: t('SendNow'),
        msg: t('SureSendNow'),
        PositiveText: t('Yes'),
        NegativeText: t('No'),
        onPositivePress: () => {
          if (mediaList.length > 0) {
            handleMediaList({
              mediaList: mediaList,
              onSuccess: (
                imageIds: {
                  FileExtension?: string;
                  ImageDataID: string;
                }[],
              ) => {
                // Call the API with the selected payload
                triggerSavePostSchedule(data, true, imageIds);
              },
              onFailure: () => {
                // Failure - return from this point
                // showSnackbar(t('ImageUploadFail'), 'danger');
                setButtonLoading(undefined);
              },
              sendNow: true,
            });
          } else if (resourceList.length > 0) {
            // Handle resources if available
            // const resourceIds = resourceList.map(resource => ({
            //   documentId: resource.documentId,
            // }));

            const prefilledIds =
              postData?.postDetail?.postDocumentMappingList?.map(
                doc => doc.documentId!,
              ) ?? [];

            // 2) “new” = those the user has added just now
            const resourceIds = resourceList.filter(
              r => !prefilledIds.includes(r.documentId!),
            );

            // Pass the resourceIds along with other necessary data to the save function
            triggerSavePostSchedule(data, true, [], resourceIds);
          } else {
            triggerSavePostSchedule(data, true);
          }
        },
      });
    } else {
      if (mediaList.length > 0) {
        handleMediaList({
          mediaList: mediaList,
          onSuccess: (
            imageIds: {
              FileExtension?: string;
              ImageDataID: string;
            }[],
          ) => {
            // Call the API with the selected payload
            triggerSavePostSchedule(data, false, imageIds);
          },
          onFailure: () => {
            // Failure - return from this point
            // showSnackbar(t('ImageUploadFail'), 'danger');
            setButtonLoading(undefined);
          },
          sendNow: false,
        });
      } else if (resourceList.length > 0) {
        // Handle resources if available
        // const resourceIds = resourceList.map(resource => ({
        //   documentId: resource.documentId,
        // }));

        const prefilledIds =
          postData?.postDetail?.postDocumentMappingList?.map(
            doc => doc.documentId!,
          ) ?? [];

        // 2) “new” = those the user has added just now
        const resourceIds = resourceList.filter(
          r => !prefilledIds.includes(r.documentId!),
        );

        // Pass the resourceIds along with other necessary data to the save function
        triggerSavePostSchedule(data, false, [], resourceIds);
      } else {
        triggerSavePostSchedule(data, false);
      }
    }
  };

  // const handleMediaListUI = (value: Asset[]) => {
  //   const oldList = mediaList.filter(
  //     mediaItem => mediaItem.uri != Images.addSquare,
  //   );
  //   setMediaList([
  //     ...oldList,
  //     ...value,
  //     ...(oldList.length + value.length < 5
  //       ? [{uri: Images.addSquare, fileName: 'add'}]
  //       : []),
  //   ]);
  // };
  const handleMediaListUI = (value: Asset[]) => {
    const oldList = mediaList.filter(m => m.uri !== Images.addSquare);
    setMediaList(withAddSquare([...oldList, ...value], resourceList.length));
  };

  const handleMediaList = async ({
    mediaList,
    onSuccess,
    onFailure,
    sendNow,
  }: {
    mediaList: Asset[];
    onSuccess: (
      imageIds: {
        FileExtension?: string;
        ImageDataID: string;
      }[],
    ) => void;
    onFailure: () => void;
    sendNow: boolean;
  }) => {
    const imageIds: {
      FileExtension?: string;
      ImageDataID: string;
    }[] = [];

    const prefilledImageUrls = postData?.postDetail?.postImageMappings || [];
    const newImages = mediaList
      .filter(mediaItem => mediaItem.uri != Images.addSquare)
      .filter(
        url =>
          !prefilledImageUrls.find(item =>
            item.postImageUrl?.includes(url.uri!),
          ),
      );

    if (newImages.length > 0) {
      const formData = new FormData();
      newImages.forEach(file => {
        formData.append('files', {
          uri: file.uri,
          name: file.fileName ?? `file_${Date.now()}`,
          type: file.type,
        });
      });

      try {
        const response = await UploadFileListToS3Api.mutateAsync({
          payload: formData,
          sendNow: sendNow,
        });
        if (response) {
          if (Array.isArray(response?.result) && response.result.length > 0) {
            response.result.forEach((item: UploadFileListToS3Model) => {
              if (item?.contentID) {
                imageIds.push({
                  ImageDataID: item.contentID,
                  FileExtension: item?.contentType,
                });
              }
            });
          } else {
            showSnackbar(
              response.error?.message ?? t('ImageUploadFail'),
              'danger',
            );
            onFailure();
            return;
          }
        } else {
          showSnackbar(t('ImageUploadFail'), 'danger');
          onFailure();
          return;
        }
      } catch (error) {
        showSnackbar(t('ImageUploadFail'), 'danger');
        onFailure();
        return;
      }
    }

    onSuccess(imageIds);
  };
  const handleResourceListUI = (value: DocumentDetails[]) => {
    setResourceList(value);
  };
  const handleDeleteImages = async (
    images: string[],
    onSuccess: () => void,
    onFailure: () => void,
  ) => {
    for (const media of images) {
      try {
        const response = await deleteImageApi.mutateAsync({ Id: media });
        if (response) {
        } else {
          showSnackbar(t('ImageUploadFail'), 'danger');
          onFailure();
          return;
        }
      } catch (error) {
        showSnackbar(t('ImageUploadFail'), 'danger');
        onFailure();
        return;
      }
    }

    onSuccess();
  };

  const renderImageItem = (item: Asset, index: number) => {
    return item.uri == Images.addSquare ? (
      <Tap
        onPress={() => {
          setShowImageSelectionPopup(true);
        }}
        style={styles.selectedImgTap}
      >
        <CustomImage
          source={item.uri}
          type={ImageType.svg}
          color={theme.colors.onSurfaceVariant}
          style={styles.selectedImg}
        />
      </Tap>
    ) : item.type === types.pdf || item.type === 'application/pdf' ? (
      <Tap
        onPress={() => {
          showImagePopup({ pdfUrl: item.uri });
        }}
        style={styles.selectedImgTap}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.pdfLay}>
            <CustomImage
              source={Images.pdf}
              type={ImageType.svg}
              style={styles.selectedImg}
            />
          </View>
          <Tap
            onPress={() => {
              const updatedMediaList = mediaList.filter(
                mediaItem =>
                  mediaItem.uri !== item.uri &&
                  mediaItem.uri != Images.addSquare,
              );
              if (updatedMediaList.length > 0) {
                const newImgList = [
                  ...updatedMediaList,
                  { uri: Images.addSquare, fileName: 'add' },
                ];
                // setMediaList(newImgList);
                setMediaList(withAddSquare(newImgList, resourceList.length));
              } else {
                //mediaListRef.current = [];
                setMediaList([]);
              }
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
    ) : (
      <Tap
        onPress={() => {
          const imageList = mediaList
            .filter(
              item => item.uri != Images.addSquare && item.type != types.pdf,
            )
            .map(item => item.uri!);
          showImagePopup({ imageList: imageList, defaultIndex: index });
        }}
        style={styles.selectedImgTap}
      >
        <View style={{ flex: 1 }}>
          <CustomImage
            source={{ uri: item.uri }}
            resizeMode={ResizeModeType.cover}
            style={styles.selectedImg}
          />
          <Tap
            onPress={() => {
              const updatedMediaList = mediaList.filter(
                mediaItem =>
                  mediaItem.uri !== item.uri &&
                  mediaItem.uri != Images.addSquare,
              );
              if (updatedMediaList.length > 0) {
                const newImgList = [
                  ...updatedMediaList,
                  { uri: Images.addSquare, fileName: 'add' },
                ];
                //mediaListRef.current = newImgList;
                setMediaList(newImgList);
              } else {
                //mediaListRef.current = [];
                setMediaList([]);
              }
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
    );
  };

  // helper to render each resource “card”
  const renderResourceItem = (item: DocumentDetails) => (
    <View style={styles.resourceCard}>
      <CustomImage
        source={
          item.coverImageURL
            ? { uri: item.coverImageURL }
            : { uri: item.location }
        }
        style={styles.resourceThumbnail}
      />
      <CustomText
        variant={TextVariants.bodyMedium}
        style={styles.resourceName}
        maxLines={1}
      >
        {item.documentName}
      </CustomText>
      <Tap
        onPress={() =>
          setResourceList(prev =>
            prev.filter(r => r.documentId !== item.documentId),
          )
        }
        style={styles.resourceRemoveTap}
      >
        <CustomImage
          source={Images.close}
          type={ImageType.svg}
          style={styles.resourceRemoveIcon}
        />
      </Tap>
    </View>
  );

  const triggerSavePostSchedule = async (
    data: Schema,
    isSendNow?: boolean,
    imageId?: ImageIdArray[],
    resourceId?: ResourceIdType[],
  ) => {
    const prefilledImageUrls = postData?.postDetail?.postImageMappings || [];
    const prefilledDocumnetUrls =
      postData?.postDetail?.postDocumentMappingList || [];

    let deletedImages: (string | undefined)[] | undefined;
    let deletedResources: (string | undefined)[] | undefined;

    if (mediaList.length > 0) {
      // Get the list of removed images (those in prefilled but not in the final list)
      deletedImages = prefilledImageUrls
        .filter(url => !mediaList.some(item => item.uri === url.postImageUrl))
        .map(item => item.postImageMapping?.id);
    }

    if (resourceList.length > 0) {
      deletedResources = prefilledDocumnetUrls
        .filter(id => !resourceList.some(r => r.documentId === id))
        ?.map(doc => doc.documentId!);
    }

    if (prefilledImageUrls && prefilledImageUrls?.length > 0) {
      if (mediaList.length == 0) {
        deletedImages = prefilledImageUrls?.map(
          (item, index) => item.postImageMapping?.imageDataID,
        );
        Log('if media deletedImages' + JSON.stringify(deletedImages));
      } else {
        deletedImages = prefilledImageUrls
          ?.map((item, index) => ({
            url: item.postImageUrl,
            id: item.postImageMapping?.imageDataID,
          }))
          .filter(url => !mediaList.some(item => item.uri === url.url))
          .map(item => item.id);
        Log('else media deletedImages' + JSON.stringify(deletedImages));
      }
    }

    if (prefilledDocumnetUrls.length > 0) {
      if (resourceList.length == 0) {
        deletedResources = prefilledDocumnetUrls?.map(doc => doc.documentId!);
      } else {
        deletedResources = prefilledDocumnetUrls
          ?.map(doc => doc.documentId!)
          .filter(id => !resourceList.some(r => r.documentId === id));
      }
    }

    // Snapshot editor HTML (if available) to preserve embeds + formatting
    const editorRaw =
      (await commentRef.current?.requestHtml?.()) ??
      commentRef.current?.getHtml?.();
    const raw = editorRaw && editorRaw.length > 0 ? editorRaw : comment ?? '';
    const plain = raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/&[a-zA-Z#0-9]+;/g, ' ') // replace entities like &nbsp; or &#123; with space
      .trim();

    const hasEmbed =
      /<(iframe|video|object|embed)\b[\s\S]*?>[\s\S]*?<\/\1>/i.test(raw) ||
      /<(img|iframe|video|object|embed)\b/i.test(raw);

    let finalDetail = '';
    const editorHasHtml = !!raw && /<[^>]+>/.test(raw);

    if (editorHasHtml) {
      // ✅ FIX: preserve embed + highlight mentions inside HTML
      finalDetail = formatMentionsInsideHtml(raw, groupMembersAllList);
    } else if (!isEmpty(plain)) {
      // ✅ text-only case (as-is)
      finalDetail = formatMentions(
        comment || plain,
        groupMembersAllList,
      ).formattedText;
    } else if (hasEmbed) {
      // ✅ embed-only fallback (keep safe)
      finalDetail = formatMentionsInsideHtml(raw, groupMembersAllList);
    }

    savePostSchedule.mutate({
      ScheduleDateTime: isSendNow
        ? null
        : formatDate({
            date: getValues('scheduleDateTime')!,
            parseFormat: DateFormats.UIFullDate,
            returnFormat: DateFormats.FullDate,
          }),
      createOrEditPostDetailDto: {
        Detail:
          finalDetail ||
          formatMentions(comment, groupMembersAllList).formattedText,
        imageList: imageId?.map(item => item.ImageDataID) ?? [],
        id: route.params?.item?.taskIdentifier ?? '',
        PostDocumentMappingList: resourceId ? resourceId : [],
        ...(!selectedTemplate && {
          FromSelf: onBehalfOf.value === 'Self' ? true : false,
        }),
        previewVisible: isPreviewVisible,
      },
      deletedImageIds: deletedImages ?? [],
      deletedResourceIds: deletedResources ?? [],
      PostImageMappingList: imageId ? imageId : [],
      organizer: userDetails?.fullName,
      TypeCode: 'Post',
      IsSchedule: 'Y',
      id: route.params?.item?.id ?? 0,
      AssignedUserList: selectedContactList.map(item => ({
        UserId: item.userId,
      })),
      AssignedContactTypeList: selectedContactTypeList.map(
        item => item.contactType,
      ),
      AssignedTagList: selectedTagList.map(item => ({ TagId: item.id })),
      ProgramId: selectedTemplate?.programID,
    });
  };

  // Upload Image API
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: {
      payload: Record<string, any>;
      sendNow: boolean;
    }) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData.payload,
        byPassRefresh: true,
      });
    },
    onMutate(variables) {
      setButtonLoading(variables.sendNow ? 'sendNow' : 'schedule');
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setButtonLoading(undefined);
      }
    },
    onSuccess(data, variables, context) {},
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**  Added by @Ajay 08-04-2025 (#6199) ---> Use mutation for saving event schedule */
  const savePostSchedule = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<SaveGlobalCalendarAndEventDataModel>({
        endpoint: ApiConstants.SaveGlobalCalendarAndPostData,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (!buttonLoading) {
        setButtonLoading(
          variables.ScheduleDateTime == null ? 'sendNow' : 'schedule',
        );
      }
    },
    onSettled(data, error, variables, context) {
      if (error || variables.deletedImageIds.length == 0) {
        setButtonLoading(undefined);
      }
    },
    onSuccess(data, variables, context) {
      /** Handle success response */
      if (data?.result) {
        if (data.result.status == 1) {
          handleDeleteImages(
            variables.deletedImageIds,
            () => {
              showSnackbar(
                route.params?.item ? t('PostUpdatedMsg') : t('PostAddedMsg'),
                'success',
              );
              sendDataBack('EventViewAll', {
                isDetailsUpdated: true,
              } as AddScheduleUpdateReturnProp);
              handleGoBack(navigation);
            },
            () => {},
          );
        } else if (data.result.status == 0 && data?.result?.message) {
          showSnackbar(data?.result?.message, 'danger');
        } else {
          showSnackbar(t('SomeErrorOccured'), 'danger');
        }
      }
    },
    onError(error, variables, context) {
      /** Handle error response */
      showSnackbar(error.message, 'danger');
    },
  });

  const deleteImageApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.PostImageMappings,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onSettled(data, error, variables, context) {
      setButtonLoading(undefined);
    },
    onError(error, variables, context) {
      /** Handle error response */
      // showSnackbar(error.message, 'danger');
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

  const getGlobalScheduleDetailForEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetGlobalScheduleDetailForEditModel>({
        endpoint: ApiConstants.GetGlobalPostForEdit,
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
      if (data.result && data.result.postDetail) {
        setPostData(data.result);
        const postData = data.result.postDetail;

        if (!selectedTemplate) {
          if (postData.fromSelf === true) {
            setOnBehalfOf(onBehalfOfList[0]);
          } else {
            setOnBehalfOf(onBehalfOfList[1]);
          }
        }

        const parsedPostHtml = processHtmlContent({
          html: postData?.detailHTML || postData?.detail,
          maxWords: 50,
          linkColor: theme.colors.links,
          showMore: true,
        });

        setComment(postData?.detail ?? '');
        commentRef.current?.setHtml(postData?.detail ?? '');

        // Convert the image URLs from postImageLocation into Asset objects
        if (postData?.postImageMappings) {
          const prefilledMediaList = postData?.postImageMappings.map(url => {
            const fileInfo = getFileInfoWithMime(url.postImageUrl);
            const imageData: Asset = {
              fileName: fileInfo?.fileName,
              uri: url.postImageUrl,
              base64: undefined,
              width: 80,
              height: 80,
              type: fileInfo?.mimeType,
              timestamp: undefined,
              id: fileInfo?.fileName,
            };
            if (url.postImageUrl) {
              getImageSize(url.postImageUrl, size => {
                imageData.width = size.width;
                imageData.height = size.height;
              });
            }

            return imageData;
          });

          // setMediaList([
          //   ...prefilledMediaList,
          //   ...(prefilledMediaList.length < 5
          //     ? [{uri: Images.addSquare, fileName: 'add'}]
          //     : []),
          // ]);
          setMediaList(withAddSquare(prefilledMediaList, resourceList.length));
        }

        // 1) Pull from the proper field (note lowercase “p”)
        const serverDocs = postData.postDocumentMappingList ?? [];

        // 2) Map them into your DocumentDetails[]
        const prefilledResources: DocumentDetails[] = serverDocs.map(doc => ({
          documentId: doc.documentId,
          location: doc.contentURL,
          documentName: doc.documentName || 'Document',
          description: doc.description,
          coverImageURL: doc.coverImageURL,
          contentType: doc.contentType,
          contentURL: doc.contentURL,
          documentTypeName: doc.documentTypeName,
        }));
        // 3) Set your state
        setResourceList(prefilledResources);

        handleStartDatePress(
          formatDate({
            date: postData?.scheduleTime!,
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

  /** Added by @Yuvraj 04-08-2025 (#7078) ---> placeholder fetcher for mail merger */
  const GetAllFeedPlaceholderFieldsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllFeedPlaceholderFieldsModel[]>({
        endpoint: ApiConstants.GetAllFeedPlaceholderFields,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setPlaceholderLoading(true);
    },
    onSettled(data, error, variables, context) {
      setPlaceholderLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        setPlaceholderFields(data.result);
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
        <Tap
          style={{ flex: 1, padding: 0 }}
          onPress={() => {
            commentRef.current?.dismissKeyboard();
            //hideKeyboard();
          }}
        >
          <View style={styles.main}>
            <CustomHeader
              showBack
              title={route?.params?.item ? t('EditPost') : t('CreatePost')}
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
                style={styles.content}
                keyboardShouldPersistTaps={'handled'}
              >
                <View style={styles.main}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <CustomAvatar
                      source={
                        !isEmpty(userDetails?.profileImageUrl) && {
                          uri: userDetails?.profileImageUrl,
                        }
                      }
                      text={
                        isEmpty(userDetails?.profileImageUrl)
                          ? userDetails?.fullName
                          : undefined
                      }
                      initialVariant={TextVariants.labelMedium}
                    />
                    <CustomText
                      variant={TextVariants.labelLarge}
                      color={theme.colors.primary}
                    >
                      {userDetails?.fullName}
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
                        suffixIcon={{
                          source: Images.down,
                          type: ImageType.svg,
                          color: theme.colors.onSurfaceVariant,
                        }}
                      />
                    </Tap>
                  )}

                  <Tap style={styles.tapStyle} onPress={() => {}}>
                    <View style={styles.mentionInputView}>
                      <MentionTextInput
                        inputRef={commentRef}
                        text={comment}
                        onChangeText={value => {
                          setComment(value);
                          if (value.length > 0) {
                            setCommentError('');
                          }
                        }}
                        onLinkPreviewChange={data => {
                          setIsPreviewVisible(!!data);
                        }}
                        nameKey={'fullName'}
                        profilePicKey={'userProfileImage'}
                        idKey={'userId'}
                        placeholder={t('ShareSomething')}
                        list={groupMembersAllList}
                        showAbove={false}
                        hideSuggestions={hideSuggestions}
                        allowBackPress={setAllowBackPress}
                        textAlign={InputTextAlignVertical.top}
                        style={styles.writeComment}
                        contentStyle={styles.mentionInput}
                        hidePreview={false}
                      />
                    </View>
                  </Tap>

                  {commentError && (
                    <CustomText
                      variant={TextVariants.labelMedium}
                      color={theme.colors.error}
                      style={{ marginTop: 10 }}
                    >
                      {commentError}
                    </CustomText>
                  )}

                  {(placeholderLoading || placeholderFields.length > 0) && (
                    <View style={styles.keywordContainer}>
                      <CustomText
                        style={styles.targetAudLabel}
                        variant={TextVariants.titleSmall}
                      >
                        {t('Keywords')}
                      </CustomText>
                      <View style={styles.chipsContainer}>
                        {placeholderLoading ? (
                          <CustomChips
                            skeletonCount={7}
                            closeButton={false}
                            loading={true}
                          />
                        ) : (
                          placeholderFields.map((item, index) => (
                            <CustomChips
                              key={index} // Always give a key in loop
                              chipLabel={item.displayName}
                              closeButton={false}
                              onPress={() => handlePlaceholderPress(item)}
                            />
                          ))
                        )}
                      </View>
                      {placeholderFields.length > 0 &&
                        tenantDetail?.allowCommunityTemplateCreation && (
                          <View
                            style={[
                              styles.chipsContainer,
                              styles.mailCommunityNote,
                            ]}
                          >
                            <CustomText color={theme.colors.outOfOfcLevel2}>
                              {t('MailMergerCommunityTemplateNote')}
                            </CustomText>
                          </View>
                        )}
                    </View>
                  )}

                  {resourceList?.length > 0 && resourceList?.length <= 10 && (
                    <View style={styles.ResourceViewContainer}>
                      <Tap
                        style={
                          resourceList.length >= 10
                            ? styles.cameraLayDisabled
                            : styles.cameraLay
                        }
                        onPress={() => {
                          if (resourceList.length >= 10) {
                            showSnackbar(t('MaxResourceMessage'), 'danger');
                            return;
                          }

                          setShowImageSelectionPopup(true);
                        }}
                      >
                        <CustomImage
                          source={Images.linkResource}
                          type={ImageType.svg}
                          color={
                            resourceList.length >= 10
                              ? theme.colors.onSurfaceDisabled
                              : theme.colors.onSurfaceVariant
                          }
                          style={styles.camera}
                        />
                      </Tap>
                    </View>
                  )}

                  {(mediaList && mediaList.length > 0) ||
                  (resourceList && resourceList.length > 0) ? (
                    <>
                      {mediaList && mediaList.length > 0 && (
                        <CustomFlatList
                          data={mediaList}
                          numColumns={4}
                          scrollEnabled={false}
                          renderItem={({ item, index }) =>
                            renderImageItem(item, index)
                          }
                        />
                      )}

                      {resourceList && resourceList.length > 0 && (
                        <CustomFlatList
                          contentContainerStyle={styles.ResourceFlateList}
                          data={resourceList}
                          horizontal={false}
                          scrollEnabled={true}
                          renderItem={({ item }) => renderResourceItem(item)}
                        />
                      )}
                    </>
                  ) : (
                    <Tap
                      style={styles.noImgLayContainer}
                      onPress={() => {
                        if (
                          mediaList.length >= 10 ||
                          resourceList.length >= 10
                        ) {
                          showSnackbar(
                            mediaList.length >= 10
                              ? t('MaxFileAllowed')
                              : t('MaxResourceMessage'),
                            'danger',
                          );
                        } else if (!buttonLoading) {
                          setShowImageSelectionPopup(true);
                        }
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
                          {t('UploadDocument')}
                        </CustomText>
                      </View>
                    </Tap>
                  )}

                  <View style={styles.dropDownSelect}>
                    <CustomText
                      style={styles.segmentB}
                      variant={TextVariants.titleMedium}
                    >
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
                                key={item.id}
                                chipId={item?.id}
                                chipLabel={item?.tagName}
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
                                key={item.userId}
                                chipId={item?.userId}
                                chipLabel={item?.name} // For contactList, display username
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
                    timezone={userDetails?.timeZoneName}
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
                      setHideSuggestions(t => t + 1);
                      onSubmit(data, false);
                    })}
                  >
                    {t('Schedule')}
                  </CustomButton>
                </View>
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
              selectionLimit={
                mediaList.length == 0 ? 10 : 11 - mediaList.length
              }
              mediaList={handleMediaListUI}
              showResource={true}
              showFile={true}
              initialMediaList={mediaList} /** ← receive updated list back */
              initialResourceList={
                resourceList
              } /** ← receive updated list back */
              onResourceListChange={handleResourceListUI}
              selectOneItemAtATime={true}
            />

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
          </View>
        </Tap>
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

    paddingZero: {
      padding: 0,
    },
    OnbehalfofInput: {
      marginTop: 15,
    },
    PopUpStyle: { flex: 1, height: 120 },

    actionItemTitleLaySkeleton: { width: '100%', gap: 10 },
    actionItemTitleSkeleton: {
      height: 10,
      width: '50%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
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
      height: 20,
      width: 20,
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
    selectedImgs: {
      height: 180,
      width: '100%',
      borderRadius: theme.roundness,
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
    mailCommunityNote: {
      backgroundColor: theme.colors.outOfOfcLevel1,
      marginTop: 10,
      borderColor: theme.colors.outOfOfcLevel2,
      borderStyle: 'dashed',
    },
    keywordContainer: {
      marginTop: 10,
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
    targetAudLabel: {
      paddingBottom: 10,
      paddingLeft: 5,
      fontSize: 14,
      fontWeight: 'semibold',
    },

    content: { flex: 1, paddingVertical: 10, paddingHorizontal: 20 },
    commentLay: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    name: {
      flex: 1,
      marginLeft: 10,
    },
    sessionLay: {
      flex: 1,
    },
    writeComment: {
      flex: 1,
      paddingRight: 20,
    },
    session: {
      paddingVertical: 0,
      paddingHorizontal: 10,
    },
    mentionInputView: {
      flex: 1,
      height: 200,
      padding: 7,
      marginTop: 0,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    mentionInput: {
      borderWidth: 0,
      paddingHorizontal: 0,
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
      padding: 3,
    },
    selectedImgDelete: {
      height: 10,
      width: 10,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
      marginHorizontal: 5,
    },
    cameraLay: {
      width: 38,
      height: 36,
      marginTop: 5,
      marginHorizontal: 2,
      padding: 3,
      borderColor: theme.colors.onSurfaceVariant,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'flex-end',
    },

    cameraLayDisabled: {
      width: 38,
      height: 36,
      marginTop: 5,
      marginHorizontal: 2,
      padding: 3,
      borderColor: theme.colors.onSurfaceDisabled,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'flex-end',
    },
    camera: {
      height: 26,
      width: 26,
    },

    send: {
      height: 25,
      width: 25,
    },
    sendIcon: {
      width: 60,
      height: 40,
      marginTop: 3,
      marginHorizontal: 2,
      padding: 10,
      verticalAlign: 'top',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      alignItems: 'center',
    },
    saveButton: {
      marginTop: 10,
      marginBottom: 30,
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
    resourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
    },
    resourceThumbnail: {
      width: 40,
      height: 40,
      borderRadius: theme.roundness,
      marginRight: 12,
    },
    resourceName: {
      flex: 1,
    },
    resourceRemoveTap: {
      padding: 4,
    },
    resourceRemoveIcon: {
      width: 20,
      height: 20,
    },

    ResourceViewContainer: {
      marginVertical: 0,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    ResourceFlateList: { marginTop: 10 },
    tapStyle: { flex: 1, padding: 0 },
    pdfLay: {
      flex: 1,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.lightRoundness,
      paddingHorizontal: 10,
      paddingTop: 5,
      paddingBottom: 20,
    },
  });

export default AddSchedulePost;
