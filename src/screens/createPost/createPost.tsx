import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Asset } from 'react-native-image-picker';
import { ActivityIndicator } from 'react-native-paper';

import {
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  SkeletonContent,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomHeader,
  CustomImagePicker,
  MentionTextInput,
} from '@/components/molecules';
import type { CustomHtmlEditorRef } from '@/components/molecules/customTextInput/customHtmlEditor';
import { InputTextAlignVertical } from '@/components/molecules/customTextInput/mentionTextInput';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetUserTeamListForTagModel,
  UploadFileListToS3Model,
} from '@/services/models';
import {
  CommunityModel,
  GetPostDetailsForEditModel,
} from '@/services/models/communityModel/communityModel';
import { DocumentDetails } from '@/services/models/getListOfDocumentsForFeedModel/getListOfDocumentsForFeedModel';
import { templateStore, userStore } from '@/store';
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
  formatMentions,
  formatMentionsInsideHtml,
  getFileInfoWithMime,
  getImageSize,
  hideKeyboard,
  isEmpty,
  processHtmlContent,
  reverseFormatMentions,
  showSnackbar,
  useBackPressHandler,
} from '@/utils/utils';
import { types } from '@react-native-documents/picker';
import { CommunityReturnProp } from '../community/community';
import { FeedReturnProp } from '../feed/feed';

export type CreatePostProps = {
  navigationFrom?: string;
  data?: CommunityModel;
  selectedUserId?: number;
};

function CreatePost() {
  const navigation = useAppNavigation();
  const route = useAppRoute('CreatePost');
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();

  // Access user details from store
  const userDetails = userStore(state => state.userDetails);

  // Local States
  const [loading, setLoading] = useState<boolean>(false);
  // ✅ Tracks whether there are ANY users left to tag in this post
  const [noTaggableUsersLeft, setNoTaggableUsersLeft] = useState(false);

  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [allowBackPress, setAllowBackPress] = useState(true);
  const [hideSuggestions, setHideSuggestions] = useState(0);
  const [mediaList, setMediaList] = useState<Asset[]>([]);
  const [resourceList, setResourceList] = useState<DocumentDetails[]>([]);

  const [addCommentLoading, setAddCommentLoading] = useState(false);
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);
  const templateData = templateStore();

  const [postData, setPostData] = useState<GetPostDetailsForEditModel>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  /**
   *  Added by @Akshita 20-11-25 ---> all users returned from API, filtered(FYN-4314)*/
  const [userTeamListForTag, setUserTeamListForTag] = useState<
    GetUserTeamListForTagModel[]
  >([]);

  /**
   *  Added by @Akshita 20-11-25 ---> Master list: all users returned from API, never filtered(FYN-4314)*/
  const [userTeamListForTagMaster, setUserTeamListForTagMaster] = useState<
    GetUserTeamListForTagModel[]
  >([]);
  const textInputRef = React.useRef<CustomHtmlEditorRef>(null);
  // Context for sending data back on navigation
  const { sendDataBack } = useReturnDataContext();

  useEffect(() => {
    Log('route.params?.navigationFrom' + route.params?.navigationFrom);
    if (userDetails) {
      // Pre-fill data when coming from the 'Community' screen (edit mode)
      if (
        route.params?.navigationFrom == 'EditCommunity' &&
        route.params?.data
      ) {
        const postData = route.params.data;
        // Pre-fill comment
        getPostDetailsForEdit.mutate({
          apiPayload: { Id: postData.postDetailID },
        });
      } else if (
        route.params?.navigationFrom == 'EditFeed' &&
        route.params?.data
      ) {
        const postData = route.params.data;
        // Pre-fill comment
        getPostDetailsForEdit.mutate({
          apiPayload: { Id: postData.postDetailID },
        });
      } else {
        Log('userDetails?.isAdvisor' + userDetails?.isAdvisor);
        Log('route.params?.selectedUserId' + route.params?.selectedUserId);
        Log('userDetails.userID' + userDetails.userID);

        if (route.params?.navigationFrom == 'CreateCommunity') {
          getMemberListForCommunityTaggingApi.mutate({
            apiPayload: {
              programId: templateData.selectedTemplate?.programID,
              sessionId: templateData.selectedTemplate?.programSessionID,
              groupId: templateData.selectedTemplate?.groupID,
            },
          });
        } else {
          getUserTeamListForTagApi.mutate({
            apiPayload: {
              UserId: userDetails?.isAdvisor
                ? route.params?.selectedUserId
                : userDetails?.userID,
            },
          });
        }
      }
    }
    // Load session group list on mount
    // getSessionGroupFilterApi.mutate({UserID: userDetails?.UserID});
  }, []);

  useEffect(() => {
    Log('1] inside the tag list update use effect');

    // When comment is empty, show full master list and reset flag
    if (!comment || comment.length === 0) {
      setUserTeamListForTag(userTeamListForTagMaster);
      setNoTaggableUsersLeft(false); // ✅ user can tag anyone
      Log('2] inside the tag list update use effect');
      return;
    }

    // Find all already-mentioned users in current comment
    const taggedUserIds = getTaggedUserIdsFromText(
      comment,
      userTeamListForTagMaster,
    );
    Log(
      '3] taggedUserIds in the tag list update use effect : ' + taggedUserIds,
    );

    // Filter master list to exclude already tagged users
    const updatedList = userTeamListForTagMaster.filter(
      user => !taggedUserIds.includes(String(user.id)),
    );

    Log(
      '4] updatedList in the tag list update use effect : ' +
        JSON.stringify(updatedList),
    );

    // ✅ Update the list of taggable users
    setUserTeamListForTag(updatedList);

    // ✅ If nothing left in updatedList → NO users left to tag right now
    setNoTaggableUsersLeft(updatedList.length === 0);
  }, [comment]);

  // Handle hardware back press
  useBackPressHandler(() => sendBackPostData({}));

  const sendBackPostData = ({ newPostAdded }: { newPostAdded?: boolean }) => {
    if (allowBackPress) {
      if (
        route.params?.navigationFrom == 'EditCommunity' ||
        route.params?.navigationFrom == 'CreateCommunity'
      ) {
        sendDataBack('Community', {
          postId: newPostAdded ? postData?.feedDetail?.id ?? -1 : undefined,
        } as CommunityReturnProp);
      } else if (
        route.params?.navigationFrom == 'EditFeed' ||
        route.params?.navigationFrom == 'ContactListing'
      ) {
        sendDataBack('Feed', {
          postId: newPostAdded ? postData?.feedDetail?.id ?? -1 : undefined,
        } as FeedReturnProp);
      }

      if (newPostAdded) {
        handleGoBack(navigation);
      }
      return true;
    } else {
      if (newPostAdded) {
        handleGoBack(navigation);
      }
      // Hide mention suggestions if back press is blocked
      setHideSuggestions(t => t + 1);
      return false;
    }
  };

  const handleAddComment = () => {
    if (isEmpty(comment)) {
      showSnackbar(t('FeedPostValidationMsg'), 'danger');
      return;
    }
    if (isEmpty(comment) && mediaList.length == 0 && resourceList.length == 0) {
      setCommentError(t('FeedPostValidationMsg'));
    } else {
      hideKeyboard();
      Log(
        'POST DOC ___ ' +
          JSON.stringify(route.params?.data?.postDocumentsForFeed),
      );
      Log(
        'POST media ___ ' +
          JSON.stringify(route.params?.data?.postImageLocation),
      );

      let deletedImages: (string | undefined)[] | undefined;
      let deletedResources: (string | undefined)[] | undefined;

      if (
        route.params?.data?.postImageLocation &&
        route.params?.data?.postImageLocation?.length > 0
      ) {
        if (mediaList.length == 0) {
          deletedImages = postData?.feedDetail?.postImageLocation?.map(
            (item, index) =>
              postData?.feedDetail?.postImageLocationIDs?.at(index),
          );
          Log('if media deletedImages' + JSON.stringify(deletedImages));
        } else {
          deletedImages = postData?.feedDetail?.postImageLocation
            ?.map((item, index) => ({
              url: item,
              id: postData?.feedDetail?.postImageLocationIDs?.at(index),
            }))
            .filter(url => !mediaList.some(item => item.uri === url.url))
            .map(item => item.id);
          Log('else media deletedImages' + JSON.stringify(deletedImages));
        }
      }

      if (
        route.params?.data?.postDocumentsForFeed &&
        route.params?.data?.postDocumentsForFeed?.length > 0
      ) {
        if (resourceList.length == 0) {
          deletedResources = postData?.postDocumentMappingList?.map(
            doc => doc.documentId!,
          );
        } else {
          deletedResources = postData?.postDocumentMappingList
            ?.map(doc => doc.documentId!)
            .filter(id => !resourceList.some(r => r.documentId === id));
        }
      }

      // Step 1: Check if there are any media uploads, only call handleMediaList if needed
      if (mediaList.length > 0) {
        // Handle image upload one by one
        handleMediaList(
          mediaList,
          (imageIds: string[]) => {
            // Create a temp list for newly added images
            const prefilledImageUrls =
              postData?.feedDetail?.postImageLocation || [];
            const newImages = imageIds.filter(
              id => !prefilledImageUrls.includes(id),
            );

            savePostDataToApi(newImages, deletedImages, [], []);
          },
          () => {
            // Failure - return from this point
            // showSnackbar(t('ImageUploadFail'), 'danger');
            setAddCommentLoading(false);
          },
        );
      } // Step 2: Handle resource uploads (documents)
      else if (resourceList.length > 0) {
        // 1) pull the existing IDs out of your edit-response
        const prefilledIds =
          postData?.postDocumentMappingList?.map(doc => doc.documentId!) ?? [];

        // 2) “new” = those the user has added just now
        const newResources = resourceList.filter(
          r => !prefilledIds.includes(r.documentId!),
        );

        savePostDataToApi(
          [],
          [], // newImages
          newResources, // newResources: DocumentDetails[]
          deletedResources, // deletedImages
        );
      } else {
        savePostDataToApi(
          [], // newImages
          deletedImages, // deletedImages
          [], // newResources: DocumentDetails[]);
          deletedResources, // deletedImages
        );
      }
    }
  };

  // ✅ NEW: pure helper, does not depend on component state
  const getTaggedUserIdsFromText = (
    text: string,
    users: GetUserTeamListForTagModel[],
  ): string[] => {
    if (!text || !users || users.length === 0) {
      return [];
    }

    const normalizedComment = text.toLowerCase();
    const taggedIds = new Set<string>();

    users.forEach(user => {
      const fullName = String((user as any).fullName ?? '');
      const id = (user as any).id;

      if (!fullName || id === undefined || id === null) {
        return;
      }

      // Same mention format you already use: @First-Last
      const mentionSlug = '@' + fullName.toLowerCase().replace(/\s+/g, '-');

      if (normalizedComment.includes(mentionSlug)) {
        taggedIds.add(String(id));
      }
    });

    return Array.from(taggedIds);
  };

  // ✅ Keeps the same external behavior you already had
  const getTaggedUserIdsFromComment = (): string => {
    const ids = getTaggedUserIdsFromText(comment, userTeamListForTagMaster);
    return ids.join(',');
  };

  const savePostDataToApi = async (
    newImages?: string[],
    deletedImagesId?: (string | undefined)[],
    newResources?: DocumentDetails[],
    deletedResourceId?: (string | undefined)[],
  ) => {
    // Snapshot editor HTML (if available) to preserve embeds + formatting
    const editorRaw =
      (await textInputRef.current?.requestHtml?.()) ??
      textInputRef.current?.getHtml?.();
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
      // ✅ FIX: preserve embed + highlight mentions in HTML content
      finalDetail = formatMentionsInsideHtml(raw, userTeamListForTagMaster);
    } else if (!isEmpty(plain)) {
      // ✅ normal text-only (same as existing)
      finalDetail = formatMentions(
        comment || plain,
        userTeamListForTagMaster,
      ).formattedText;
    } else if (hasEmbed) {
      // ✅ embed-only fallback (rare, but keep behavior)
      finalDetail = formatMentionsInsideHtml(raw, userTeamListForTagMaster);
    }
    // Determine which payload to use based on navigationFrom
    let payload = {};

    if (
      route.params?.navigationFrom === 'EditCommunity' ||
      route.params?.navigationFrom === 'CreateCommunity'
    ) {
      payload = {
        postID:
          route.params?.navigationFrom === 'EditCommunity'
            ? postData?.feedDetail?.id
            : null,
        createOrEditPostDetailDto: {
          postType: 2, // Post type for Community
          feedReplyID: null,
          header: '', // Post header
          detail:
            finalDetail ||
            formatMentions(comment, userTeamListForTagMaster).formattedText, // The content or body of the post
          likeCount: 0,
          commentCount: 0,
          status: 0,
          isActive: true,
          userID: userDetails?.userID,
          previewVisible: isPreviewVisible,
          videoDataID: null,
          imageList: newImages ? newImages : [],
          id: postData?.feedDetail?.id,
          // Conditionally add sessionID and groupID:
          ...(templateData.selectedTemplate?.programTypeID !== 0 ||
          templateData.selectedTemplate?.programTypeID !== undefined ||
          templateData.selectedTemplate?.programTypeID !== null
            ? {
                sessionID: templateData.selectedTemplate?.programSessionID,
                groupID: templateData.selectedTemplate?.groupID,
              }
            : {}),
        },
        PostDocumentMappingList: newResources ? newResources : [],
        postImageMappingList: [],
        deletedImageIds: deletedImagesId ?? [],
        deletedResourceIds: deletedResourceId ?? [],
        postType: 2,
      };
    } else if (
      route.params?.navigationFrom === 'EditFeed' ||
      route.params?.navigationFrom === 'CreateFeed' ||
      route.params?.navigationFrom == 'ContactListing'
    ) {
      payload = {
        postID:
          route.params?.navigationFrom === 'EditFeed'
            ? postData?.feedDetail?.id
            : null,
        createOrEditPostDetailDto: {
          postType: 1, // Post type for Feed
          feedReplyID: null,
          header: 'Feed',
          detail:
            finalDetail ||
            formatMentions(comment, userTeamListForTagMaster).formattedText, // The content or body of the post,
          likeCount: 0,
          commentCount: 0,
          status: 0,
          isActive: true,
          userID: userDetails?.userID,
          videoDataID: null,
          imageList: newImages ? newImages : [],
          id: postData?.feedDetail?.id ? postData?.feedDetail?.id : null,
          postImageLocationIDs: '',
          postImageLocation: '',
          DisableCommentOn: '',
          DetailHTML: '',
          MetaDataJson: '',
          TagUserIds: getTaggedUserIdsFromComment(),
          ProgramID: '',
          FromGlobalCalendar: false,
          previewVisible: isPreviewVisible,
          ForUserId:
            route.params?.navigationFrom == 'ContactListing'
              ? route.params?.selectedUserId
              : userDetails?.isAdvisor
              ? postData?.feedDetail?.forUserId
              : postData?.feedDetail?.userID,
          ForUserName: '',
          PrimaryFeedId: '',
          // Conditionally add sessionID and groupID:
          ...(templateData.selectedTemplate?.programTypeID !== 0 ||
          templateData.selectedTemplate?.programTypeID !== undefined ||
          templateData.selectedTemplate?.programTypeID !== null
            ? {
                sessionID: templateData.selectedTemplate?.programSessionID,
                groupID: templateData.selectedTemplate?.groupID,
              }
            : {}),
        },
        PostDocumentMappingList: newResources ? newResources : [],
        postImageMappingList: [],
        deletedImageIds: deletedImagesId ?? [],
        deletedResourceIds: deletedResourceId ?? [],
        postType: 1,
      };
    }

    // Call the API with the selected payload
    createOrEditPostApi.mutate(payload);
  };

  const handleMediaListUI = (value: Asset[]) => {
    const oldList = mediaList.filter(
      mediaItem => mediaItem.uri != Images.addSquare,
    );
    setMediaList([
      ...oldList,
      ...value,
      ...(oldList.length + value.length < 5
        ? [{ uri: Images.addSquare, fileName: 'add' }]
        : []),
    ]);
  };

  const handleResourceListUI = (value: DocumentDetails[]) => {
    setResourceList(value);
  };

  const handleMediaList = async (
    mediaList: Asset[],
    onSuccess: (imageIds: string[]) => void,
    onFailure: () => void,
  ) => {
    const imageIds: string[] = [];

    const prefilledImageUrls = postData?.feedDetail?.postImageLocation || [];
    const newImages = mediaList
      .filter(mediaItem => mediaItem.uri != Images.addSquare)
      .filter(url => !prefilledImageUrls.includes(url.uri!));

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
        const response = await UploadFileListToS3Api.mutateAsync(formData);
        if (response) {
          if (response.result != null && response.result.length > 0) {
            response.result.forEach(
              (item: UploadFileListToS3Model) =>
                item?.contentID && imageIds.push(item.contentID),
            );
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
        Log('from catch handle' + error + 'this is type ');
        showSnackbar(error ? `${error}` : t('ImageUploadFail'), 'danger');
        onFailure();
        return;
      }
    }

    onSuccess(imageIds);
  };

  const renderImageItem = (item: Asset, index: number) => {
    Log('resource type=>' + item.type);
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
        <View
          style={{
            flex: 1,
          }}
        >
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
  const renderResourceItem = (item: DocumentDetails) => {
    return (
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
  };

  const getPostDetailsForEdit = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      refreshPost?: boolean;
    }) => {
      return makeRequest<GetPostDetailsForEditModel>({
        endpoint: ApiConstants.GetFeedDetailForEdit,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      //Set loading state true before API call starts) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      //Reset loading state before API call gets settled */
      if (error) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        const parsedPostHtml = processHtmlContent({
          html:
            data.result.feedDetail?.detailHTML ||
            data.result.feedDetail?.detail,
          maxWords: 50,
          linkColor: theme.colors.links,
          showMore: true,
        });

        const newPostData: GetPostDetailsForEditModel = {
          ...data.result,
          feedDetail: {
            ...data.result?.feedDetail,
            detailHTML: reverseFormatMentions(
              parsedPostHtml?.Content!,
              userTeamListForTagMaster,
            ),
          },
        };
        console.log('newPostData', newPostData);
        setPostData(newPostData);

        // Convert the image URLs from postImageLocation into Asset objects
        if (newPostData?.feedDetail?.postImageLocation) {
          const prefilledMediaList =
            newPostData?.feedDetail?.postImageLocation.map(url => {
              const fileInfo = getFileInfoWithMime(url);
              const imageData: Asset = {
                fileName: fileInfo?.fileName,
                uri: url,
                base64: undefined,
                width: 80,
                height: 80,
                type: fileInfo?.mimeType,
                timestamp: undefined,
                id: fileInfo?.fileName,
              };
              getImageSize(url, size => {
                imageData.width = size.width;
                imageData.height = size.height;
              });
              return imageData;
            });

          setMediaList(prefilledMediaList); // Set the mediaList to the mapped Assets

          if (route.params?.navigationFrom == 'EditCommunity') {
            getMemberListForCommunityTaggingApi.mutate({
              apiPayload: {
                programId: templateData.selectedTemplate?.programID,
                sessionId: templateData.selectedTemplate?.programSessionID,
                groupId: templateData.selectedTemplate?.groupID,
              },
              detail: newPostData.feedDetail?.detail,
              navigationFrom: 'EditCommunity',
            });
          } else if (route.params?.navigationFrom == 'EditFeed') {
            getUserTeamListForTagApi.mutate({
              apiPayload: {
                UserId: userDetails?.isAdvisor
                  ? route.params?.selectedUserId
                  : userDetails?.userID,
              },
              detail: newPostData.feedDetail?.detail,
              navigationFrom: 'EditFeed',
            });
          }
        }

        // 1) Pull from the proper field (note lowercase “p”)
        const serverDocs = data.result.postDocumentMappingList ?? [];

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
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  // for getting a particular data for the api
  const getUserTeamListForTagApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      detail?: string;
      navigationFrom?: string;
    }) => {
      return makeRequest<GetUserTeamListForTagModel[]>({
        endpoint: ApiConstants.getUserTeamListForTag,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const newData: GetUserTeamListForTagModel[] = [...data.result];

        // ✅ Build initial comment with mentions from server + fresh user list
        const initialComment = variables.detail
          ? reverseFormatMentions(variables.detail, newData)
          : '';

        // ✅ Set master list and comment
        setUserTeamListForTagMaster(newData);
        setComment(initialComment);

        Log('getUserTeamListForTagApi call : ' + JSON.stringify(newData));

        let filteredList: GetUserTeamListForTagModel[] = newData;

        // ✅ Only for EditFeed: exclude users already mentioned in initial text
        if (variables.navigationFrom === 'EditFeed') {
          const taggedUserIds = getTaggedUserIdsFromText(
            initialComment,
            newData,
          );

          filteredList = newData.filter(
            user => !taggedUserIds.includes(String(user.id)),
          );
        }

        // ✅ Set initial suggestion list
        //    (after this, the useEffect keeps it in sync with typing)
        setUserTeamListForTag(filteredList);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  // for getting a particular data for the api
  const getMemberListForCommunityTaggingApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      detail?: string;
      navigationFrom?: string;
    }) => {
      return makeRequest<GetUserTeamListForTagModel[]>({
        endpoint: ApiConstants.GetMemberListForCommunityTagging,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const newData: GetUserTeamListForTagModel[] = [...data.result];

        // Store all members list and update UI */
        // setGroupMembersAllList(newData); //disable the mention list for 2.0.3 version
        setComment(
          variables.detail
            ? reverseFormatMentions(variables.detail, newData)
            : '',
        );
        setUserTeamListForTagMaster(data.result);
        if (variables.navigationFrom == 'EditCommunity') {
          // Step 1: Get the tagged user IDs from the comment
          const taggedUserIds = getTaggedUserIdsFromComment().split(',');

          // Step 2: Filter out tagged users from the master list
          const updatedList = newData.filter(
            user => !taggedUserIds.includes(String(user.id)),
          );

          // Step 3: Update the tag list with the remaining users
          setUserTeamListForTag(updatedList);
        }
        setUserTeamListForTag(data.result);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  // Upload Image API
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      });
    },
    onMutate(variables) {
      if (!addCommentLoading) {
        setAddCommentLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setAddCommentLoading(false);
      }
    },
  });

  // API to add (or edit) a post
  const createOrEditPostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.CreateOrEditPost,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (!addCommentLoading) {
        setAddCommentLoading(true);
      }
    },
    onSettled() {
      setAddCommentLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        setComment('');
        setMediaList([]);
        setResourceList([]);
        showSnackbar(t('PostAddedMsg'), 'success');
        sendBackPostData({ newPostAdded: true });
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setAddCommentLoading(false);
    },
  });

  return (
    <SafeScreen>
      <View style={styles.content}>
        <CustomHeader
          showBack
          title={
            route.params?.navigationFrom === 'EditCommunity' ||
            route.params?.navigationFrom === 'EditFeed'
              ? t('EditPost')
              : t('CreatePost')
          } // Show Edit or Create title
        />
        {loading ? (
          <SkeletonContent />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
            style={{ flex: 1 }}
          >
            <View style={styles.main}>
              <View style={styles.commentLay}>
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
                <View style={styles.sessionLay}>
                  <CustomText
                    variant={TextVariants.labelLarge}
                    color={theme.colors.primary}
                  >
                    {userDetails?.fullName}
                  </CustomText>

                  <MentionTextInput
                    inputRef={textInputRef}
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
                    idKey={'id'}
                    error={commentError}
                    placeholder={t('ShareSomething')}
                    list={userTeamListForTag}
                    showAbove={true}
                    hideSuggestions={hideSuggestions}
                    allowBackPress={setAllowBackPress}
                    textAlign={InputTextAlignVertical.top}
                    style={styles.writeComment}
                    contentStyle={styles.mentionInput}
                    noTaggableUsersLeft={noTaggableUsersLeft}
                    hidePreview={false}
                  />
                </View>
              </View>

              <View>
                <View style={styles.resourceListView}>
                  {mediaList && mediaList.length > 0 && (
                    <CustomFlatList
                      data={mediaList}
                      horizontal
                      renderItem={({ item, index }) =>
                        renderImageItem(item, index)
                      }
                    />
                  )}
                  {resourceList && resourceList.length > 0 && (
                    <ScrollView style={{ maxHeight: 250 }}>
                      {resourceList.map((item, index) => (
                        <View key={index}>{renderResourceItem(item)}</View>
                      ))}
                    </ScrollView>
                  )}
                </View>
                <View style={styles.footer}>
                  <Tap
                    onPress={() => {
                      if (resourceList.length >= 10) {
                        showSnackbar(t('MaxResourceMessage'), 'danger');
                        return;
                      }
                      // Enforce a maximum of 5 images
                      if (
                        mediaList.length >= 10 &&
                        mediaList[mediaList.length - 1].fileName !== 'add'
                      ) {
                        showSnackbar(t('MaxFileAllowed'), 'danger');
                      } else if (!addCommentLoading) {
                        setShowImageSelectionPopup(true);
                      }
                    }}
                    style={
                      resourceList.length >= 3
                        ? styles.cameraLayDisabled
                        : styles.cameraLay
                    }
                  >
                    <CustomImage
                      source={Images.plus}
                      type={ImageType.svg}
                      color={
                        resourceList.length >= 3
                          ? theme.colors.onSurfaceDisabled
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.camera}
                    />
                  </Tap>
                  <Tap onPress={handleAddComment} style={styles.sendIcon}>
                    {addCommentLoading ? (
                      <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                      <CustomText
                        variant={TextVariants.bodyMedium}
                        color={theme.colors.surface}
                      >
                        {t('Post')}
                      </CustomText>
                    )}
                  </Tap>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
        <CustomImagePicker
          showPopup={showImageSelectionPopup}
          setShowPopup={setShowImageSelectionPopup}
          selectionLimit={mediaList.length == 0 ? 10 : 11 - mediaList.length}
          mediaList={handleMediaListUI}
          showResource={
            route.params?.navigationFrom == 'EditFeed' ||
            route.params?.navigationFrom == 'CreateFeed' ||
            route.params?.navigationFrom == 'ContactListing'
              ? true
              : false
          }
          showFile={true}
          initialMediaList={mediaList}
          initialResourceList={resourceList}
          onResourceListChange={handleResourceListUI}
          selectOneItemAtATime={
            route.params?.navigationFrom == 'EditFeed' ||
            route.params?.navigationFrom == 'CreateFeed' ||
            route.params?.navigationFrom == 'ContactListing'
              ? true
              : false
          }
        />
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    content: { flex: 1 },
    main: { flex: 1, padding: 10 },
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
    },
    resourceListView: {
      marginHorizontal: 5,
    },
    session: {
      paddingVertical: 0,
      paddingHorizontal: 10,
    },
    mentionInput: {
      flex: 1,
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
      alignContent: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      marginTop: 3,
      marginHorizontal: 2,
      padding: 6,
      borderColor: theme.colors.onSurfaceVariant,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'center',
    },
    cameraLayDisabled: {
      alignContent: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      marginTop: 3,
      marginHorizontal: 2,
      padding: 6,
      borderColor: theme.colors.onSurfaceDisabled,
      borderRadius: theme.roundness,
      borderWidth: 1,
      alignItems: 'center',
    },
    camera: {
      height: 32,
      width: 32,
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
      borderColor: theme.colors.border,
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

export default CreatePost;
