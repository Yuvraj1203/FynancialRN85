import { CustomImage, CustomText, SkeletonList, Tap } from '@/components/atoms';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  CustomActionSheetPoup,
  CustomHeader,
  CustomImagePicker,
  CustomPopup,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { HeaderIconProps } from '@/components/molecules/customHeader/customHeader';
import { CommentPopup, SafeScreen, SupportPopup } from '@/components/template';
import PostItem, { PostType } from '@/components/template/postItem/postItem';
import { showTemplatePopup } from '@/components/template/templatePopup/templatePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ActionSheetModel,
  CommentsReplies,
  GetActiveSessionDetailForUser,
  GetAllCommentsModel,
  GetFeedPostModel,
} from '@/services/models';
import { badgesStore, templateStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
  useTabPress,
} from '@/utils/navigationUtils';
import {
  extractEmbeddedIframes,
  extractLinkPreviewHtml,
  isEmpty,
  processHtmlContent,
  showSnackbar,
  stripPreviewUrlFromHtml,
  updateArrayWithChanges,
  useCustomInAppBrowser,
  useDebouncedSearch,
} from '@/utils/utils';

import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';

import { GetFeedPostDetailsForEditModel } from '@/services/models/getFeedPostModel/getFeedPostModel';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'react-native-image-picker';

import { hideLoader } from '@/components/molecules/loader/loader';
import { CommentType } from '@/components/template/commentItem/commentItem';

import useSignalRStore from '@/store/signalRStore/signalRStore';
import Log from '@/utils/logger';
import { useIsFocused } from '@react-navigation/native';
import { ActivityIndicator, Divider } from 'react-native-paper';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroupMembersScreenParent } from '../groupMembers/groupMembers';

export enum FeedParentScreenType {
  fromNotification = 'FromNotification',
  contactListing = 'ContactListing',
}

export type FeedReturnProp = {
  postId?: number;
  pageNo?: number;
  like?: boolean;
  comment?: number;
};

export type FeedProps = {
  selectedUserId?: number;
  postId?: string;
  sessionId?: string;
  groupId?: string;
  commentId?: string;
  replyId?: string;
  navigationFrom?: FeedParentScreenType;
};

function Feed() {
  /**
   * Added by  @Shivang 02-04-25 -> Initializing navigation hook (FYN-4065 )
   */
  const navigation = useAppNavigation();
  /**
   * Added by  @Shivang 02-04-25 -> Initializing theme hook (FYN-4065 )
   */
  const theme = useTheme();

  const safeAreaInsets = useSafeAreaInsets();
  /**
   * Added by  @Shivang 02-04-25 -> Creating styles using theme (FYN-4065 )
   */
  const styles = makeStyles(theme, safeAreaInsets);
  /**
   * Added by  @Shivang 02-04-25 -> Initializing translation hook (FYN-4065 )
   */
  const { t } = useTranslation();
  /**
   * Added by  @Shivang 02-04-25 -> Accessing template store data (FYN-4065 )
   */
  const templateData = templateStore();

  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */

  const signalRStore = useSignalRStore();

  /**
   * Added by  @Shivang 02-04-25 -> Accessing user details from user store (FYN-4065 )
   */
  const userDetails = userStore(state => state.userDetails);

  const setBadges = badgesStore(state => state.setBadges);
  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for feed post list (FYN-4065 )
   */
  const [showPopup, setShowPopup] = useState(false);
  const [feedPostList, setFeedPostList] = useState<GetFeedPostModel[]>([]);
  /**
   * Added by  @Shivang 02-04-25 -> Declaring loading state (FYN-4065 )
   */
  const [loading, setLoading] = useState<boolean>(false);
  /**
   * Added by  @Shivang 02-04-25 -> Declaring API loading state (FYN-4065 )
   */
  const [apiLoading, setApiLoading] = useState(false);

  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for comment popup visibility (FYN-4065 )
   */
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for selected post (FYN-4065 )
   */
  const [selectedPost, setSelectedPost] = useState<GetFeedPostModel>();
  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for report popup visibility (FYN-4065 )
   */
  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup

  /**
   * Added by  @Shivang 02-04-25 -> Initializing in-app browser function (FYN-4065 )
   */
  const openInAppBrowser = useCustomInAppBrowser();

  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for more data flag (FYN-4065 )
   */
  const [hasMoreData, setHasMoreData] = useState(true);
  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for pagination page index (FYN-4065 )
   */
  const [page, setPage] = useState(1); // pagination page index

  /**
   * Added by  @Shivang 02-04-25 -> Declaring state for search text (FYN-4065 )
   */
  const [search, setSearch] = useState<string>('');

  /**
   * Added by  @Shivang 02-04-25 -> Creating debounced search using custom hook (FYN-4065 )
   */
  const debouncedSearch = useDebouncedSearch(search, 500);

  const [selectedComment, setSelectedComment] = useState<GetAllCommentsModel>();

  const [showDeletePopup, setShowDeletePopup] = useState(false); // show report popup

  const [showSupportPopup, setShowSupportPopup] = useState(false);

  const [deleteCommentId, setDeleteCommentId] = useState<GetAllCommentsModel>();
  const [editCommentId, setEditCommentId] = useState<GetAllCommentsModel>();
  const route = useAppRoute('ContactFeed');

  const [editPostIdloading, setEditPostIdloading] = useState<string>();
  const { receiveDataBack } = useReturnDataContext(); // get data back from next screen
  const [updatePostId, setUpdatePostId] = useState<number>();
  const [newPostLoading, setNewPostLoading] = useState(false);
  const [FeedPostDetailsForEdit, setPostDetailsForEdit] =
    useState<GetFeedPostDetailsForEditModel>();

  const [showCommentTurningPopup, setShowCommentTurningPopup] = useState(false);
  const [commentTurningLoading, setCommentTurningLoading] = useState(false);

  const [showImagePicker, setShowImagePicker] = useState(false);

  const [mediaList, setMediaList] = useState<Asset[]>([]);

  const [ActiveSessionForUserNewList, setActiveSessionForUserNewList] =
    useState<GetActiveSessionDetailForUser[]>();

  const [selectedTemplate, setSelectedTemplate] =
    useState<GetActiveSessionDetailForUser>();
  const [tappedTemplateID, setTappedTemplateID] = useState<string>();

  const [fromNotification, setFromNotification] = useState(false);
  const [fromLikeScreen, setFromLikeScreen] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    // Jab notification se aaye, to `fromNotification` ko true karenge
    if (
      route.params?.navigationFrom === FeedParentScreenType.fromNotification
    ) {
      setFromNotification(true); // ensure flag is true
    } else {
      setFromNotification(false); // jab normal flow ho, flag ko false karenge
    }
  }, [route.params?.navigationFrom]);

  /**
   * Added by  @Shivang 02-04-25 -> useEffect to call feed activity log API on component mount (FYN-4065 )
   */
  useEffect(() => {
    if (userDetails) {
      if (
        route.params?.navigationFrom == FeedParentScreenType.contactListing &&
        route?.params?.selectedUserId
      ) {
        const SelectedUserId = route?.params?.selectedUserId;
        // Pre-fill comment
        callGetAllPostApi(1);
      } else if (
        route.params?.navigationFrom != FeedParentScreenType.fromNotification
      ) {
        callSetFeedActivityLogApi(true);
      }
    }
  }, []);

  /**
    *Added by @Akshita 29-09-25 ---> Function to handle the auto app refresh functionality
    if a new notification received.(#Fyn-8941)*/
  useEffect(() => {
    if (userDetails) {
      const handleFeedRefersh = (data: string) => {
        if (data.toLocaleLowerCase().trim() == 'feedpost') {
          if (
            templateData?.templateList &&
            templateData?.templateList.length > 0 &&
            route.params?.navigationFrom !=
              FeedParentScreenType.fromNotification
          ) {
            getAllPostApi.mutate({
              PageNumber: 1,
              isAutoRefreshing: true,
              ForUserId:
                route.params?.navigationFrom ==
                FeedParentScreenType.contactListing
                  ? route.params?.selectedUserId
                  : userDetails?.userID,
              Keywords: !isEmpty(search) ? search : undefined,
              // Conditionally spread SessionID and GroupID if programTypeID !== 0
              ...(templateData.selectedTemplate?.programTypeID !== 0 ||
              templateData.selectedTemplate?.programTypeID !== undefined ||
              templateData.selectedTemplate?.programTypeID !== null
                ? {
                    SessionID:
                      route.params?.navigationFrom ==
                        FeedParentScreenType.contactListing && selectedTemplate
                        ? selectedTemplate.programSessionID
                        : templateData.selectedTemplate?.programSessionID,
                    GroupID:
                      route.params?.navigationFrom ==
                        FeedParentScreenType.contactListing && selectedTemplate
                        ? selectedTemplate.groupId
                        : templateData.selectedTemplate?.groupID,
                  }
                : {}),
            });

            if (isFocused) {
              callSetFeedActivityLogApi();
            }
          } else {
            setLoading(false);
          }
        }
      };

      if (signalRStore.notificationType) {
        handleFeedRefersh(signalRStore.notificationType);
      }
    }
  }, [signalRStore.notificationType]);

  useEffect(() => {
    if (route.params?.navigationFrom == FeedParentScreenType.fromNotification) {
      handleNotification();
    }
  }, [route.params]);

  const handleNotification = () => {
    resetValues();
    hideLoader();

    getPostByIdApi.mutate({
      apiPayload: {
        PostId: route.params?.postId,
      },
      type: 'fromNotification',
    });
    callSetFeedActivityLogApi();
  };

  /**
   * Added by  @Shivang 02-04-25 -> useEffect to call feed activity log API when template changes (FYN-4065 )
   */
  useEffect(() => {
    if (
      userDetails &&
      templateData.selectedTemplate &&
      route.params?.navigationFrom != FeedParentScreenType.fromNotification
    ) {
      callSetFeedActivityLogApi(true);
    }
  }, [templateData.selectedTemplate]);

  /**
   * Added by  @Shivang 02-04-25 -> useEffect to trigger search API call when debounced search value changes (FYN-4065 )
   */
  useEffect(() => {
    if (
      userDetails &&
      debouncedSearch !== undefined &&
      debouncedSearch.length > 0
    ) {
      callGetAllPostApi(1, debouncedSearch.trim().toLowerCase()); // Call API only when valid
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (isFocused && !userDetails?.isAdvisor) {
      if (fromNotification) {
        if (!fromLikeScreen) {
          resetValues();
        } else {
          setFromLikeScreen(false); // Reset like screen flag as well
        }
        // Skip the unnecessary call to getadvisorexperiencefeed when coming from notification
        setFromNotification(false); // Reset the flag
        callSetFeedActivityLogApi(true);
      } else {
        // Proceed with the usual API call if not from notification
        callSetFeedActivityLogApi();
      }
    }
  }, [isFocused]);

  /**
   * Added by  @Shivang 02-04-25 -> useTabPress hook to call feed activity log API on tab press (FYN-4065 )
   */
  useTabPress(() => {
    setFromNotification(false);
    callSetFeedActivityLogApi(true);
  });

  const resetValues = () => {
    setFeedPostList([]);
    setShowCommentPopup(false);
    setSelectedPost(undefined);
    setDeleteCommentId(undefined);
    setEditCommentId(undefined);
    setUpdatePostId(undefined);
    setMediaList([]);
    setHasMoreData(false);
    setFromLikeScreen(false);
  };
  /**
   * Added by  @Shivang 02-04-25 -> Function to call feed activity log API (FYN-4065 )
   */
  const callSetFeedActivityLogApi = (feedRefresh?: boolean) => {
    if (feedRefresh) {
      callGetAllPostApi(1);
    }

    setFeedActivityLogApi.mutate({
      id:
        templateData.selectedTemplate?.programTypeID !== 0 ||
        templateData.selectedTemplate?.programTypeID !== undefined ||
        templateData.selectedTemplate?.programTypeID !== null
          ? templateData.selectedTemplate?.groupID
          : undefined,
    });
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to update search text and trigger API call (FYN-4065 )
   */
  const searchFeeds = (query: string) => {
    setSearch(query);
    if (query.length === 0) {
      callGetAllPostApi(1);
    }
  };

  /**
   * Added by  @Shivang 02-04-25 -> Type definition for update feed parameters (FYN-4065 )
   */

  const [EditingPost, setEditingPost] = useState<boolean>(false);

  const [isCommentEnable, setIsCommentEnable] = useState<boolean>(false);

  type UpdateFeedParams =
    | {
        type: 'post';
        postID?: string;
        commentItem?: CommentsReplies;
        like?: boolean;
        commentCount?: number;
        callApi?: boolean;
      }
    | {
        type: 'comment';
        postID?: string;
        commentItem?: CommentsReplies;
        like?: boolean;
        commentCount?: number;
        callApi?: boolean;
      };

  receiveDataBack('Feed', (data: FeedReturnProp) => {
    if (data.postId) {
      if (data.like == undefined && data.comment == undefined) {
        // when coming back from comments
        setUpdatePostId(data.postId);

        if (data.postId == -1) {
          // when new post is added
          setNewPostLoading(true);
          callGetAllPostApi(1);
        } else {
          // when user edited a post
          const apiPayload: {
            id: number;
            sessionId?: string;
            groupId?: string;
            forUserId: number | undefined;
          } = {
            id: data.postId,
            forUserId: route.params?.selectedUserId,
          };

          // Only add sessionId and groupId if programTypeID is not 0
          if (
            templateData.selectedTemplate?.programTypeID !== 0 ||
            templateData.selectedTemplate?.programTypeID !== undefined ||
            templateData.selectedTemplate?.programTypeID !== null
          ) {
            apiPayload.sessionId =
              templateData.selectedTemplate?.programSessionID;
            apiPayload.groupId = templateData.selectedTemplate?.groupID;
          }

          getFeedPostDetailsForEdit.mutate({
            apiPayload,
            type: 'refreshPost',
          });
        }
      } else if (data.like || data.comment) {
        updateFeed({
          type: data.like ? 'post' : 'comment',
          postID: data?.postId?.toString(),
          like: true, // toggles the like status
          callApi: true, // to trigger the API call
        });
      }
    }
  });

  /**
   * Added by  @Shivang 02-04-25 -> Merged updateFeed function to update posts or comments (FYN-4065 )
   */
  const updateFeed = ({
    type,
    postID,
    commentItem,
    like,
    commentCount,
    callApi,
  }: UpdateFeedParams) => {
    if (type === 'post') {
      let isLikeClick: boolean | undefined = false;
      // Update the post based on postID
      setFeedPostList(prevFeedPostList =>
        prevFeedPostList.map(post => {
          if (post.postDetailID !== postID) return post;

          const likeCount = like
            ? post.likedByUser
              ? Math.max((post.likeCount || 0) - 1, 0)
              : (post.likeCount || 0) + 1
            : post.likeCount;

          isLikeClick = like ? !post.likedByUser : post.likedByUser;

          return {
            ...post,
            likedByUser: like ? !post.likedByUser : post.likedByUser,
            likeCount,
            commentCount: commentCount ?? post.commentCount,
          };
        }),
      );

      if (callApi) {
        likeApi.mutate({
          PostId: postID,
          IsLikeClick: isLikeClick,
          postLike: true,
        });
      }
    } else if (type === 'comment' && commentItem) {
      let isLikeClick: boolean | undefined = false;
      // Update the comment within its post's commentReplies
      setFeedPostList(prevFeedPostList =>
        prevFeedPostList.map(post => {
          if (
            !post.commentsReplies?.some(
              comment => comment.commentID === commentItem.commentID,
            )
          )
            return post;

          const updatedCommentsReplies = post.commentsReplies.map(comment => {
            if (comment.commentID !== commentItem.commentID) return comment;

            const updatedLikeCount = like
              ? comment.likedByUser
                ? Math.max((comment.commentLikeCount || 0) - 1, 0)
                : (comment.commentLikeCount || 0) + 1
              : comment.commentLikeCount;

            isLikeClick = like ? !comment.likedByUser : comment.likedByUser;

            return {
              ...comment,
              likedByUser: like ? !comment.likedByUser : comment.likedByUser,
              commentLikeCount: updatedLikeCount,
              commentReplyCount: commentCount ?? comment.commentReplyCount,
            };
          });

          return {
            ...post,
            commentsReplies: updatedCommentsReplies,
          };
        }),
      );

      if (callApi) {
        likeApi.mutate({
          PostId: commentItem.commentID,
          IsLikeClick: isLikeClick,
          postLike: false,
          commentItem: commentItem,
        });
      }
    }
  };

  const handleFeedOptions = () => {
    const options: ActionSheetModel[] = [];
    if (selectedPost?.isEditable) {
      options.push({
        title: t('Edit'),
        image: Images.editSquare,
        imageType: ImageType.svg,
        onPress: () => {
          if (selectedPost) {
            if (selectedPost) {
              setEditingPost(true);
              navigation.navigate('CreatePost', {
                data: selectedPost,
                navigationFrom: 'EditFeed',
                selectedUserId: route.params?.selectedUserId,
              });
            }
          }
        },
      });
    }
    if (selectedPost?.isOwner) {
      options.push({
        title: selectedPost?.isCommentingAvailable
          ? t('TurnOffCommenting')
          : t('TurnOnCommenting'),
        image: Images.comment,
        imageType: ImageType.svg,
        onPress: () => {
          if (selectedPost) {
            setShowCommentTurningPopup(true);
          }
        },
      });
    } else {
      options.push({
        title: t('Report'),
        image: Images.report,
        imageType: ImageType.svg,
        onPress: () => {
          setShowSupportPopup(true);
        },
      });
    }
    if (selectedPost?.isDeletable) {
      options.push({
        title: t('Delete'),
        image: Images.delete,
        titleColor: theme.colors.error,
        imageColor: theme.colors.error,
        imageType: ImageType.svg,
        onPress: () => {
          showAlertPopup({
            title: t('DeleteComment'),
            msg: t('DeletePostMsg'),
            PositiveText: t('Delete'),
            NegativeText: t('Cancel'),
            onPositivePress: () => {
              deletePostApi.mutate({
                Id: selectedPost?.postDetailID,
              });
            },
            onNegativePress() {
              setSelectedPost(undefined);
            },
          });
        },
      });
    }
    return options;
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to control comment popup display (FYN-4065 )
   */
  const handleCommentClick = (post: GetFeedPostModel) => {
    setSelectedPost(post);
    setShowCommentPopup(true);
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to set header right icons based on template data (FYN-4065 )
   */
  const setHeaderRightIcons = () => {
    const menuOptions: HeaderIconProps[] = [];
    const templateData = templateStore();

    if (
      !fromNotification &&
      templateData.templateList &&
      templateData.templateList?.length > 1
    ) {
      menuOptions.push({
        name: t('SelectExperience'),
        source: Images.myDiary,
        type: ImageType.svg,
        onPress: () => {
          showTemplatePopup();
        },
      });
    }

    // removed my groups after discussion with piyush sir by @Tarun - 21/04/2025
    // menuOptions.push({
    //   name: t('MyGroups'),
    //   source: Images.refer,
    //   type: ImageType.svg,
    //   onPress: () => {
    //     navigation.navigate('GroupMembers', {
    //       type: GroupMembersScreenParent.groupMembers,
    //       groupId: templateData.selectedTemplate?.groupID,
    //     });
    //   },
    // });

    return menuOptions;
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to process HTML content for feed posts and generate previews (FYN-4065 )
   */
  const setFeedHtmlContent = (
    data: GetFeedPostModel[],
    freshData: boolean,
  ): GetFeedPostModel[] => {
    // Start with fresh data or use the existing list
    const initialData: GetFeedPostModel[] = freshData ? [] : [...feedPostList];

    // Create a Set of existing post IDs to avoid duplicates
    const existingIds = new Set(initialData.map(post => post.postDetailID));

    // Map and process new posts
    const updatedPosts = data
      .filter(post => !existingIds.has(post.postDetailID)) // filter duplicates
      .map(post => {
        const updatedComments = post.commentsReplies?.map(reply => {
          const { cleanHtml: cleanReplyHtml, linkPreviewHtml: replyLinkPreviewHtml } =
            extractLinkPreviewHtml(reply.commentDetailHTML ?? '');
          const { cleanHtml: cleanReplyHtmlNoIframes, embeddedIframeHtml: replyEmbeddedIframeHtml } =
            extractEmbeddedIframes(cleanReplyHtml);
          const parsedReplyHtml = processHtmlContent({
            html: cleanReplyHtmlNoIframes,
            maxWords: 50,
            linkColor: theme.colors.links,
            showMore: true,
          });

          return {
            ...reply,
            commentDetailHTML: stripPreviewUrlFromHtml(parsedReplyHtml?.Content, replyLinkPreviewHtml),
            shortContent: stripPreviewUrlFromHtml(parsedReplyHtml?.shortContent, replyLinkPreviewHtml),
            iFrameList: parsedReplyHtml?.iFrameList,
            linkPreviewHtml: replyLinkPreviewHtml,
            embeddedIframeHtml: replyEmbeddedIframeHtml,
          };
        });

        const { cleanHtml: cleanPostHtml, linkPreviewHtml } =
          extractLinkPreviewHtml(post.detailHTML || post.detail || '');
        const { cleanHtml: cleanPostHtmlNoIframes, embeddedIframeHtml } =
          extractEmbeddedIframes(cleanPostHtml);
        const parsedPostHtml = processHtmlContent({
          html: cleanPostHtmlNoIframes,
          linkColor: theme.colors.primary,
          showMore: true,
        });

        return {
          ...post,
          commentsReplies: updatedComments,
          detailHTML: stripPreviewUrlFromHtml(parsedPostHtml?.Content, linkPreviewHtml),
          shortContent: stripPreviewUrlFromHtml(parsedPostHtml?.shortContent, linkPreviewHtml),
          iFrameList: parsedPostHtml?.iFrameList,
          linkPreviewHtml,
          embeddedIframeHtml,
        };
      });

    return [...initialData, ...updatedPosts];
  };

  const getFeedPostDetailsForEdit = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      type?: 'refreshPost' | 'fromNotification';
    }) => {
      return makeRequest<GetFeedPostDetailsForEditModel>({
        endpoint: ApiConstants.GetPostDetailForEdit,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setApiLoading(true);
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      setUpdatePostId(undefined);
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        if (variables.type == 'refreshPost') {
          setFeedPostList(prev =>
            prev?.map(item => {
              if (item.postDetailID != data.result?.createOrEditPostDetail?.id)
                return item;

              const { cleanHtml: cleanRefreshHtml, linkPreviewHtml: refreshLinkPreviewHtml } =
                extractLinkPreviewHtml(
                  data.result?.createOrEditPostDetail?.detailHTML ||
                  data.result?.createOrEditPostDetail?.detail || '',
                );
              const { cleanHtml: cleanRefreshHtmlNoIframes, embeddedIframeHtml: refreshEmbeddedIframeHtml } =
                extractEmbeddedIframes(cleanRefreshHtml);
              const updatedHtml = processHtmlContent({
                html: cleanRefreshHtmlNoIframes,
                linkColor: theme.colors.primary,
                showMore: true,
              });

              return {
                ...item,
                detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, refreshLinkPreviewHtml),
                shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, refreshLinkPreviewHtml),
                iFrameList: updatedHtml?.iFrameList,
                linkPreviewHtml: refreshLinkPreviewHtml,
                embeddedIframeHtml: refreshEmbeddedIframeHtml,
                postImageLocation: data?.result
                  ?.postImageMappingList!.map(item => item.postImageUrl)
                  .filter((url): url is string => url !== undefined), // This will ensure that only strings are in the array
                postDocumentsForFeed: (
                  data.result!.postDocumentMappingList ?? []
                )
                  .filter(doc => !doc.isResourceDeleted)
                  .map(doc => ({
                    postDetailId: doc.postDetailId,
                    contentDataId: doc.contentDataId,
                    documentTypeId: doc.documentTypeId,
                    documentName: doc.documentName,
                    documentTypeName: doc.documentTypeName,
                    coverImageURL: doc.coverImageURL,
                    contentURL: doc.contentURL,
                    location: doc.location,
                    description: doc.description,
                  })),
              };
            }),
          );
        } else if (variables.type == 'fromNotification') {
          const { cleanHtml: cleanNotifHtml, linkPreviewHtml: notifLinkPreviewHtml } =
            extractLinkPreviewHtml(
              data.result?.createOrEditPostDetail?.detailHTML ||
              data.result?.createOrEditPostDetail?.detail || '',
            );
          const { cleanHtml: cleanNotifHtmlNoIframes, embeddedIframeHtml: notifEmbeddedIframeHtml } =
            extractEmbeddedIframes(cleanNotifHtml);
          const updatedHtml = processHtmlContent({
            html: cleanNotifHtmlNoIframes,
            linkColor: theme.colors.primary,
            showMore: true,
          });

          const notificationPost = {
            ...data.result?.createOrEditPostDetail,
            detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, notifLinkPreviewHtml),
            shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, notifLinkPreviewHtml),
            iFrameList: updatedHtml?.iFrameList,
            linkPreviewHtml: notifLinkPreviewHtml,
            embeddedIframeHtml: notifEmbeddedIframeHtml,
            postImageLocation: data?.result
              ?.postImageMappingList!.map(item => item.postImageUrl)
              .filter((url): url is string => url !== undefined), // This will ensure that only strings are in the array
            postDocumentsForFeed: (data.result!.postDocumentMappingList ?? [])
              .filter(doc => !doc.isResourceDeleted)
              .map(doc => ({
                postDetailId: doc.postDetailId,
                contentDataId: doc.contentDataId,
                documentTypeId: doc.documentTypeId,
                documentName: doc.documentName,
                coverImageURL: doc.coverImageURL,
                contentURL: doc.contentURL,
                location: doc.location,
                description: doc.description,
              })),
          };
          setFeedPostList([notificationPost]);
        }
      }
    },
    onError(error, variables, context) {
      setLoading(false);
    },
  });

  /**
   * Added by  @Shivang 02-04-25 -> Function to call API for fetching all posts (FYN-4065 )
   */
  const callGetAllPostApi = (
    pageNo: number,
    search?: string,
    sessionId?: string,
    groupId?: string,
    isAutoRefreshing?: boolean,
  ) => {
    if (
      userDetails?.isAdvisor ||
      (templateData?.templateList && templateData?.templateList.length > 0)
    ) {
      setPage(pageNo);

      //resetValues(); // reset comment popup

      getAllPostApi.mutate({
        PageNumber: pageNo,
        isAutoRefreshing: isAutoRefreshing ? isAutoRefreshing : false,
        ForUserId:
          route.params?.navigationFrom == FeedParentScreenType.contactListing
            ? route.params?.selectedUserId
            : userDetails?.userID,
        Keywords: !isEmpty(search) ? search : undefined,
        // Conditionally spread SessionID and GroupID if programTypeID !== 0
        ...(templateData.selectedTemplate?.programTypeID !== 0 ||
        templateData.selectedTemplate?.programTypeID !== undefined ||
        templateData.selectedTemplate?.programTypeID !== null
          ? {
              SessionID:
                route.params?.navigationFrom ==
                  FeedParentScreenType.contactListing && sessionId
                  ? sessionId
                  : selectedTemplate
                  ? selectedTemplate.programSessionID
                  : templateData.selectedTemplate?.programSessionID,
              GroupID:
                route.params?.navigationFrom ==
                  FeedParentScreenType.contactListing && groupId
                  ? groupId
                  : selectedTemplate
                  ? selectedTemplate.groupId
                  : templateData.selectedTemplate?.groupID,
            }
          : {}),
      });
    } else {
      setLoading(false);
    }
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to load more feeds when user scrolls (FYN-4065 )
   */
  const loadMoreFeed = () => {
    if (hasMoreData && !apiLoading) {
      callGetAllPostApi(page + 1, search.trim());
    }
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to render each feed item (FYN-4065 )
   */
  const renderFeedItem = (item: GetFeedPostModel) => {
    return (
      <PostItem
        item={item}
        showMoreClick={() => {
          setFeedPostList(prevFeedPostList =>
            prevFeedPostList.map(post => {
              if (post.postDetailID !== item.postDetailID) return post;

              return {
                ...post,
                showMore: !post.showMore,
              };
            }),
          );
        }} // CHANGED (function pass)
        openLinks={openInAppBrowser}
        type={PostType.feed}
        //shortContent
        likeClick={() => {
          updateFeed({
            type: 'post',
            postID: item.postDetailID,
            like: true, // toggles the like status
            callApi: true, // to trigger the API call
          });
        }}
        likeListClick={() => {
          setFromLikeScreen(true);
          navigation.navigate('GroupMembers', {
            postId: item.postDetailID,
            type: GroupMembersScreenParent.like,
          });
        }}
        commentClick={() => handleCommentClick(item)}
        commentLikeClick={() => {
          updateFeed({
            type: 'comment',
            commentItem: item.commentsReplies?.at(0), // the comment object to update
            like: true, // toggles the like status for the comment
            callApi: true, // to trigger the API call
          });
        }}
        optionsClick={() => {
          setSelectedPost(item);
          setShowActionPopup(true);
        }}
        loading={item.postDetailID == updatePostId}
      />
    );
  };

  /**
   * Added by  @Shivang 02-04-25 -> useMutation hook to set feed activity log via API (FYN-4065 )
   */
  const setFeedActivityLogApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.SetFeedActivityLog,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setBadges(prev => ({
        ...prev,
        hasNewFeed: false,
      }));
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by  @Shivang 02-04-25 -> useMutation hook to fetch all posts via API (FYN-4065 )
   */
  const getAllPostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFeedPostModel[]>({
        endpoint:
          templateData.selectedTemplate?.programTypeID == 0 ||
          templateData.selectedTemplate?.programTypeID == undefined ||
          templateData.selectedTemplate?.programTypeID == null ||
          route.params?.navigationFrom == FeedParentScreenType.contactListing
            ? ApiConstants.GetAdvisorExperienceFeed
            : ApiConstants.GetCommunityTemplateFeed,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setApiLoading(true);
      if (updatePostId) {
        return;
      }

      if (variables.PageNumber == 1) {
        if (!loading && !variables.isAutoRefreshing) {
          setLoading(true);
        }
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      if (updatePostId) {
        return;
      }

      if (variables.PageNumber == 1) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result.length > 0) {
        if (updatePostId) {
          setUpdatePostId(undefined);

          setFeedPostList(
            updateArrayWithChanges({
              targetArray: feedPostList,
              sourceArray: setFeedHtmlContent(
                data.result,
                variables.PageNumber === 1,
              ),
              key: 'postDetailID',
              addOnTop: newPostLoading,
            }),
          );

          if (newPostLoading) {
            setNewPostLoading(false);
          }
        } else {
          setFeedPostList(
            setFeedHtmlContent(data.result, variables.PageNumber === 1),
          );
          if (data.result.at(data.result.length - 1)?.hasNextFlag) {
            setHasMoreData(true);
          } else {
            setHasMoreData(false);
          }
        }
      } else {
        setHasMoreData(false);
        if (variables.PageNumber == 1) {
          setFeedPostList([]);
        }
      }
    },
    onError(error, variables, context) {
      if (updatePostId) {
        showSnackbar(error.message, 'danger');
        return;
      }
      setLoading(false);
      setHasMoreData(false);
      if (variables.PageNumber == 1) {
        setFeedPostList([]);
      }
    },
  });

  const getPostByIdApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      type?: string;
    }) => {
      return makeRequest<GetFeedPostModel[]>({
        endpoint: ApiConstants.GetPostById,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      if (variables.type) {
        setLoading(true);
      } else {
        setEditPostIdloading(variables.apiPayload.PostId);
      }
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
      setEditPostIdloading(undefined);
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result.length > 0) {
        // ⬇️ Take the first post from API result
        const newPostData = data.result.at(0);
        if (!newPostData) return;

        // 🔹 NEW: process comment HTML as well (for mentions, links, etc.)
        const updatedComments = newPostData.commentsReplies?.map(reply => {
          const { cleanHtml: cleanNotifReplyHtml, linkPreviewHtml: notifReplyLinkPreviewHtml } =
            extractLinkPreviewHtml(reply.commentDetailHTML ?? '');
          const { cleanHtml: cleanNotifReplyHtmlNoIframes, embeddedIframeHtml: notifReplyEmbeddedIframeHtml } =
            extractEmbeddedIframes(cleanNotifReplyHtml);
          const parsedReplyHtml = processHtmlContent({
            html: cleanNotifReplyHtmlNoIframes,
            maxWords: 50,
            linkColor: theme.colors.links,
            showMore: true,
          });

          return {
            ...reply,
            commentDetailHTML: stripPreviewUrlFromHtml(parsedReplyHtml?.Content, notifReplyLinkPreviewHtml),
            shortContent: stripPreviewUrlFromHtml(parsedReplyHtml?.shortContent, notifReplyLinkPreviewHtml),
            iFrameList: parsedReplyHtml?.iFrameList,
            linkPreviewHtml: notifReplyLinkPreviewHtml,
            embeddedIframeHtml: notifReplyEmbeddedIframeHtml,
          };
        });

        // 🔹 EXISTING: process post HTML (kept as-is)
        const { cleanHtml: cleanNotifPostHtml, linkPreviewHtml: notifPostLinkPreviewHtml } =
          extractLinkPreviewHtml(newPostData.detailHTML || newPostData.detail || '');
        const { cleanHtml: cleanNotifPostHtmlNoIframes, embeddedIframeHtml: notifPostEmbeddedIframeHtml } =
          extractEmbeddedIframes(cleanNotifPostHtml);
        const parsedPostHtml = processHtmlContent({
          html: cleanNotifPostHtmlNoIframes,
          linkColor: theme.colors.primary,
          showMore: true,
        });

        // 🔹 NEW: build a normalized post object with both
        const normalizedPost: GetFeedPostModel = {
          ...newPostData,
          commentsReplies: updatedComments, // ⬅️ processed comments
          detailHTML: stripPreviewUrlFromHtml(parsedPostHtml?.Content, notifPostLinkPreviewHtml),
          shortContent: stripPreviewUrlFromHtml(parsedPostHtml?.shortContent, notifPostLinkPreviewHtml),
          iFrameList: parsedPostHtml?.iFrameList,
          linkPreviewHtml: notifPostLinkPreviewHtml,
          embeddedIframeHtml: notifPostEmbeddedIframeHtml,
        };

        if (variables.type) {
          // 👉 This block is used for "fromNotification" case
          setFeedPostList([normalizedPost]); // ⬅️ use normalizedPost

          if (route.params?.replyId || route.params?.commentId) {
            // also pass normalizedPost to CommentPopup
            setSelectedPost(normalizedPost);
            setShowCommentPopup(true);
          }
        } else {
          // 👉 Normal refresh (e.g. after adding/editing comment)
          setFeedPostList(prev =>
            prev.map(item => {
              if (item.postDetailID === variables.apiPayload.PostId) {
                // ⬅️ replace just this post with normalizedPost
                return normalizedPost;
              }

              // Return the item as-is
              return { ...item };
            }),
          );
        }
      }
    },

    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by  @Shivang 02-04-25 -> useMutation hook for like API call (FYN-4065 )
   */
  const likeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: sendData.postLike
          ? ApiConstants.LikePost
          : ApiConstants.LikeComment,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {},
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      if (variables.postLike) {
        updateFeed({
          type: 'post',
          postID: variables.PostId,
          like: variables.PostId ? true : false,
          commentCount: variables.CommentId,
        });
      } else {
        updateFeed({
          type: 'comment',
          commentItem: variables.commentItem, // the comment object to update
          like: true, // toggles the like status for the comment
        });
      }
    },
  });

  /**
   * Added by  @Shivang 02-04-25 -> Returning the main JSX for the Feed component (FYN-4065 )
   */

  const deletePostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.DeletePost,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onMutate(variables) {
      setUpdatePostId(variables.Id);
    },
    onSettled(data, error, variables, context) {
      setUpdatePostId(undefined);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        showSnackbar(t('PostDeleted'), 'success');
        // Remove the deleted post from the feed list
        setFeedPostList(prev =>
          prev.filter(post => post.postDetailID !== selectedPost?.postDetailID),
        );
        // Optionally, clear the selected post
        setSelectedPost(undefined);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  const selectUserGroup = (item: GetActiveSessionDetailForUser) => {
    if (!loading) {
      setTappedTemplateID(item.groupId);
      setSelectedTemplate(item);
      setTappedTemplateID(undefined);
      setShowPopup(false);
    }
  };

  /** added by @Yuvraj 07-05-2025 ->  for enable or disable commenting */
  const EnableDisablePostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.Enabledisable,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setCommentTurningLoading(true);
    },
    onSettled(data, error, variables, context) {
      setShowCommentTurningPopup(false);
      setCommentTurningLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        const updatedFeedList = feedPostList.map((item, index) => {
          if (selectedPost?.postDetailID == item.postDetailID) {
            return {
              ...item,
              isCommentingAvailable: variables.IsPosting,
            };
          } else {
            return item;
          }
        });
        setFeedPostList(updatedFeedList);
        setSelectedPost(prev => {
          return {
            ...prev,
            isCommentingAvailable: variables.IsPosting,
          };
        });
        showSnackbar(
          variables.IsPosting ? t('CommentsTurnedOn') : t('CommentsTurnedOff'),
          'success',
        );
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const renderTemplateItem = (item: GetActiveSessionDetailForUser) => {
    return (
      <Tap disableRipple onPress={() => selectUserGroup(item)}>
        <View>
          <View>
            <View style={styles.titleLay}>
              <CustomText
                variant={TextVariants.bodyLarge}
                maxLines={2}
                ellipsis={TextEllipsis.tail}
                color={theme.colors.primary}
                style={styles.main}
              >
                {item.programName}
              </CustomText>
            </View>

            <CustomText variant={TextVariants.labelMedium} style={styles.date}>
              {`${item.startDate}`}
            </CustomText>

            <CustomText>{item.programName}</CustomText>
          </View>

          {item.programId == tappedTemplateID && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </Tap>
    );
  };

  Log('======>1userDetails?.isAdvisor---' + userDetails?.isAdvisor);
  Log('======>1fromNotification---' + fromNotification);
  Log('======>1route.params?.navigationFrom---' + route.params?.navigationFrom);
  Log(
    '======>1FeedParentScreenType.contactListing---' +
      FeedParentScreenType.contactListing,
  );
  Log(
    '======>1route.params?.navigationFrom == FeedParentScreenType.contactListing---' +
      (route.params?.navigationFrom == FeedParentScreenType.contactListing),
  );

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showHamburger={
            userDetails?.isAdvisor
              ? fromNotification
                ? false
                : route.params?.navigationFrom !=
                  FeedParentScreenType.contactListing
              : route.params?.navigationFrom !=
                FeedParentScreenType.contactListing
          }
          showBack={
            userDetails?.isAdvisor
              ? fromNotification
                ? true
                : route.params?.navigationFrom ==
                  FeedParentScreenType.contactListing
              : route.params?.navigationFrom ==
                FeedParentScreenType.contactListing
          }
          title={t('Feed')}
          rightIcons={setHeaderRightIcons()}
          showSearchIcon={
            fromNotification
              ? false
              : templateData.templateList
              ? templateData.selectedTemplate
                ? true
                : false
              : true
          }
          searchText={search}
          setSearchText={searchFeeds}
        />

        {loading ? (
          <SkeletonList />
        ) : (
          <View style={styles.main}>
            <CustomFlatList
              data={feedPostList}
              extraData={[editPostIdloading]}
              contentContainerStyle={
                feedPostList.length == 0
                  ? styles.flatListContainerStyle
                  : undefined
              }
              refreshing={loading}
              keyExtractor={(item, index) =>
                `feedpost-${item.postDetailID!}-${index}`
              }
              ItemSeparatorComponent={() => (
                <Divider style={styles.postItemSeprator} />
              )}
              onRefresh={() => {
                if (fromNotification) {
                  handleNotification();
                } else {
                  callGetAllPostApi(1);
                }
              }}
              onEndReachedThreshold={0.6}
              onEndReached={loadMoreFeed}
              ListFooterComponent={
                hasMoreData && feedPostList.length > 0 ? (
                  <LoadMore />
                ) : !fromNotification && feedPostList.length > 0 ? (
                  <View style={styles.listFooter}>
                    <View style={styles.divider} />
                    <CustomText
                      style={styles.FeedEndText}
                      variant={TextVariants.titleSmall}
                    >
                      {t('EndOfFeed')}
                    </CustomText>
                  </View>
                ) : (
                  <></>
                )
              }
              ListEmptyComponent={
                <EmptyView
                  label={
                    search.length > 0 ? t('NoPostSearchMsg') : t('NoPostsMsg')
                  }
                />
              }
              renderItem={({ item }) => renderFeedItem(item)}
            />

            {route.params?.navigationFrom !=
              FeedParentScreenType.fromNotification &&
              userDetails?.isAdvisor && (
                <Tap
                  style={styles.fab}
                  onPress={() => {
                    navigation.navigate('CreatePost', {
                      selectedUserId: route.params?.selectedUserId,
                      navigationFrom: FeedParentScreenType.contactListing,
                    });
                  }}
                >
                  <CustomImage
                    style={styles.icon}
                    source={Images.edit}
                    type={ImageType.svg}
                    color={theme.colors.surface}
                  />
                </Tap>
              )}
          </View>
        )}
        {selectedPost && (
          <CommentPopup
            moduleType="feed"
            post={selectedPost}
            shown={showCommentPopup}
            setShown={setShowCommentPopup}
            handleCommentOption={(comment, from) => {
              setSelectedComment(comment);
              if (from == 'edit') {
                setEditCommentId(comment);
                setShowCommentPopup(true);
              } else if (from == 'delete') {
                setTimeout(() => {
                  showAlertPopup({
                    title:
                      comment?.viewType == CommentType.comment
                        ? t('DeleteComment')
                        : t('DeleteReply'),
                    msg:
                      comment?.viewType == CommentType.comment
                        ? t('DeleteCommentMsg')
                        : t('DeleteReplyMsg'),
                    PositiveText: t('Delete'),
                    NegativeText: t('Cancel'),
                    onPositivePress: () => {
                      setDeleteCommentId(comment);
                      setTimeout(() => {
                        setShowCommentPopup(true);
                      }, 100);
                    },
                    onNegativePress() {
                      setSelectedComment(undefined);
                      setDeleteCommentId(undefined);
                      setTimeout(() => {
                        setShowCommentPopup(true);
                      }, 100);
                    },
                  });
                }, 100);
              }
            }}
            deleteCommentId={deleteCommentId}
            setDeleteCommentId={value => {
              setDeleteCommentId(value);
            }}
            editCommentId={editCommentId}
            setEditCommentId={value => {
              setEditCommentId(value);
            }}
            commentCountUpdate={() => {
              getPostByIdApi.mutate({
                apiPayload: { PostId: selectedPost.postDetailID },
              });
            }}
            openImagePicker={() => {
              setShowImagePicker(true);
            }}
            imageList={mediaList}
            setImageList={value => {
              if (value) {
                setMediaList(value);
              }
            }}
            handleImagePopup={value => {
              setShowCommentPopup(false);
              if (value) {
                showImagePopup({
                  ...value,
                  onClose() {
                    setShowCommentPopup(true);
                  },
                });
              }
            }}
            fromNotificationItem={
              route.params?.navigationFrom ==
              FeedParentScreenType.fromNotification
                ? {
                    commentId: route.params?.commentId,
                    replyId: route.params?.replyId,
                  }
                : undefined
            }
            userId={route.params?.selectedUserId}
          />
        )}

        <CustomActionSheetPoup
          shown={showActionPopup}
          setShown={setShowActionPopup}
          hideIcons={false}
          centered={false}
          onCancelClick={() => {
            setEditingPost(false);
          }}
          children={handleFeedOptions()}
        />

        <SupportPopup shown={showSupportPopup} setShown={setShowSupportPopup} />

        <CustomImagePicker
          showPopup={showImagePicker}
          setShowPopup={setShowImagePicker}
          mediaList={value => {
            setShowCommentPopup(true);
            setMediaList(value);
          }}
        />

        <CustomPopup
          shown={showCommentTurningPopup}
          setShown={setShowCommentTurningPopup}
          compact
          title={t('AreYouSure')}
          msg={
            selectedPost?.isCommentingAvailable
              ? t('TurnOffCommenting')
              : t('TurnOnCommenting')
          }
          loading={commentTurningLoading}
          onPositivePress={() => {
            EnableDisablePostApi.mutate({
              PostId: selectedPost?.postDetailID,
              IsPosting: selectedPost?.isCommentingAvailable ? false : true,
            });
          }}
          onNegativePress={() => {
            setShowCommentTurningPopup(false);
          }}
        />
      </View>
    </SafeScreen>
  );
}

/**
 * Added by  @Shivang 02-04-25 -> Function to create styles for the Feed component (FYN-4065 )
 */
const makeStyles = (theme: CustomTheme, safeAreaInsets: EdgeInsets) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    flatListContainerStyle: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 16,
    },
    listFooter: {
      height: 200,
      marginTop: 25,
    },
    FeedEndText: {
      alignSelf: 'center',
      marginTop: 20,
    },
    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    skeletonNameLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 120,
      height: 20,
    },
    dateSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 100,
      height: 20,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 10,
      marginTop: 20,
    },
    descriptionSkeleton1: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      marginTop: 10,
    },
    titleLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    date: {
      marginTop: 10,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    postItemSeprator: {
      marginTop: 10,
      marginBottom: 30,
    },
    divider: {
      height: 1,
      width: '70%',
      backgroundColor: theme.colors.border,
      borderRadius: theme.roundness,
      marginHorizontal: 10,
      alignSelf: 'center',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: safeAreaInsets.bottom,
      width: 50, // size of the button
      height: 50, // size of the button
      backgroundColor: theme.colors.primary, // color of the FAB
      borderRadius: 30, // round button
      justifyContent: 'center', // center the icon
      alignItems: 'center', // center the icon
    },
    icon: {
      width: 27,
      height: 27,
    },
  });

export default Feed;
