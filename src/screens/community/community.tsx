import { CustomText, SkeletonList, Tap } from '@/components/atoms';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import {
  CustomActionSheetPoup,
  CustomBottomPopup,
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
import { templateStore, userStore } from '@/store';
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
import { hideLoader } from '@/components/molecules/loader/loader';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { CommentType } from '@/components/template/commentItem/commentItem';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import {
  ActionSheetModel,
  GetAllCommentsModel,
  GetCommunityTemplateListItem,
  GetCommunityTemplateListModel,
  GetProgramSessionListModel,
  GetUserActiveTemplateModel,
} from '@/services/models';
import {
  CommentsReplies,
  CommunityModel,
  GetPostDetailsForEditModel,
} from '@/services/models/communityModel/communityModel';
import Log from '@/utils/logger';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { Divider } from 'react-native-paper';
import { GroupMembersScreenParent } from '../groupMembers/groupMembers';

export enum CommunityParentScreenType {
  fromNotification = 'FromNotification',
}

export type CommunityReturnProp = {
  postId?: number;
  pageNo?: number;
  like?: boolean;
  comment?: number;
};

export type CommunityProps = {
  selectedUserId?: number;
  postId?: string;
  sessionId?: string;
  groupId?: string;
  commentId?: string;
  replyId?: string;
  navigationFrom?: CommunityParentScreenType;
};

function Community() {
  /**
   * Added by  @Shivang 02-04-25 -> Initializing navigation hook (FYN-4065 )
   */
  const navigation = useAppNavigation();

  const route = useAppRoute('Community');
  /**
   * Added by  @Shivang 02-04-25 -> Initializing theme hook (FYN-4065 )
   */
  const theme = useTheme();
  /**
   * Added by  @Shivang 02-04-25 -> Creating styles using theme (FYN-4065 )
   */
  const styles = makeStyles(theme);
  /**
   * Added by  @Shivang 02-04-25 -> Initializing translation hook (FYN-4065 )
   */
  const { t } = useTranslation();
  /**
   * Added by  @Shivang 02-04-25 -> Accessing template store data (FYN-4065 )
   */
  const templateDetails = templateStore();

  /**
   * Added by  @Shivang 02-04-25 -> Accessing user details from user store (FYN-4065 )
   */
  const userDetails = userStore(state => state.userDetails);

  const [PostDetailsForEdit, setPostDetailsForEdit] =
    useState<GetPostDetailsForEditModel>();

  const [communityList, setCommunityList] = useState<CommunityModel[]>([]);

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
  const [selectedPost, setSelectedPost] = useState<CommunityModel>();
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

  const [showCommentActionPopup, setShowCommentActionPopup] = useState(false);

  const [selectedComment, setSelectedComment] = useState<GetAllCommentsModel>();

  const [showDeletePopup, setShowDeletePopup] = useState(false); // show report popup

  const [showSupportPopup, setShowSupportPopup] = useState(false);

  const [deleteCommentId, setDeleteCommentId] = useState<GetAllCommentsModel>();
  const [editCommentId, setEditCommentId] = useState<GetAllCommentsModel>();

  const [editPostIdloading, setEditPostIdloading] = useState<string>();
  const { receiveDataBack } = useReturnDataContext(); // get data back from next screen
  const [updatePostId, setUpdatePostId] = useState<number>();
  const [newPostLoading, setNewPostLoading] = useState(false);

  const [showImagePicker, setShowImagePicker] = useState(false);

  const [mediaList, setMediaList] = useState<Asset[]>([]);

  const [showCommentTurningPopup, setShowCommentTurningPopup] = useState(false);
  const [commentTurningLoading, setCommentTurningLoading] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> loading for delete contact (FYN-6256) */
  const [templateLoading, setTemplateLoading] = useState(false);

  const [showTemplateSelectPopup, setShowTemplateSelectPopup] = useState(false);

  const [communityTemplateList, setCommunityTemplateList] =
    useState<GetCommunityTemplateListItem[]>();

  const [selectedTemplateItem, setSelectedTemplateItem] = useState(
    templateDetails?.selectedTemplate,
  );

  /**
   * Added by  @Shivang 02-04-25 -> useEffect to call feed activity log API on component mount (FYN-4065 )
   */
  useEffect(() => {
    if (userDetails) {
      if (
        route.params?.navigationFrom !=
        CommunityParentScreenType.fromNotification
      ) {
        if (
          userDetails?.isAdvisor
          // &&
          // templateDetails.templateList == undefined &&
          // templateDetails.selectedTemplate == undefined
        ) {
          getCommunityTemplateListApi.mutate({});
        } else {
          callGetAllCommunityListApi(1);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (
      route.params?.navigationFrom == CommunityParentScreenType.fromNotification
    ) {
      handleNotification();
    }
  }, [route.params]);

  const handleNotification = () => {
    resetValues();
    hideLoader();

    getForumById.mutate({
      apiPayload: {
        PostId: route.params?.postId,
      },
      type: 'fromNotification',
    });
  };

  /**
   * Added by  @Shivang 02-04-25 -> useEffect to call feed activity log API when template changes (FYN-4065 )
   */
  useEffect(() => {
    if (
      templateDetails.selectedTemplate &&
      route.params?.navigationFrom != CommunityParentScreenType.fromNotification
    ) {
      callGetAllCommunityListApi(1);
    }
  }, [templateDetails.selectedTemplate]);
  /**
   * Added by  @Shivang 02-04-25 -> useEffect to trigger search API call when debounced search value changes (FYN-4065 )
   */
  useEffect(() => {
    if (debouncedSearch !== undefined && debouncedSearch.length > 0) {
      callGetAllCommunityListApi(1, debouncedSearch.trim().toLowerCase()); // Call API only when valid
    }
  }, [debouncedSearch]);

  /**
   * Added by  @Shivang 02-04-25 -> useTabPress hook to call feed activity log API on tab press (FYN-4065 )
   */
  useTabPress(() => {
    callGetAllCommunityListApi(1);
  });

  const resetValues = () => {
    setCommunityList([]);
    setShowCommentPopup(false);
    setSelectedPost(undefined);
    setDeleteCommentId(undefined);
    setEditCommentId(undefined);
    setUpdatePostId(undefined);
    setMediaList([]);
    setHasMoreData(false);
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to update search text and trigger API call (FYN-4065 )
   */
  const searchCommunityPost = (query: string) => {
    setSearch(query);
    if (query.length === 0) {
      callGetAllCommunityListApi(1);
    }
  };

  receiveDataBack('Community', (data: CommunityReturnProp) => {
    if (data.postId) {
      if (data.like == undefined && data.comment == undefined) {
        // when coming back from comments
        setUpdatePostId(data.postId);

        if (data.postId == -1) {
          // when new post is added
          setNewPostLoading(true);
          getallforumsApi.mutate({
            PageNumber: 1,
            SessionId: templateDetails.selectedTemplate?.programSessionID,
            ProgramId: templateDetails.selectedTemplate?.programID,
            SearchStr: !isEmpty(search) ? search : undefined,
          });
        } else {
          // when user edited a post
          getPostDetailsForEdit.mutate({
            apiPayload: { Id: data.postId },
            refreshPost: true,
          });
        }
      } else if (data.like || data.comment) {
        updateCommunity({
          type: data.like ? 'post' : 'comment',
          postID: data?.postId?.toString(),
          like: true, // toggles the like status
          callApi: true, // to trigger the API call
        });
      }
    }
  });

  /**
   * Added by  @Shivang 02-04-25 -> Type definition for update feed parameters (FYN-4065 )
   */

  const [EditingPost, setEditingPost] = useState<boolean>(false);

  type UpdateCommunityPostParams =
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

  /**
   * Added by  @Shivang 02-04-25 -> Merged updateFeed function to update posts or comments (FYN-4065 )
   */
  const updateCommunity = ({
    type,
    postID,
    commentItem,
    like,
    commentCount,
    callApi,
  }: UpdateCommunityPostParams) => {
    if (type === 'post') {
      let isLikeClick: boolean | undefined = false;
      // Update the post based on postID
      setCommunityList(prevFeedPostList =>
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
      setCommunityList(prevFeedPostList =>
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

  const handleCommunityPostOptions = () => {
    const options: ActionSheetModel[] = [];
    if (selectedPost?.isEditable) {
      options.push({
        title: t('Edit'),
        image: Images.editSquare,
        imageType: ImageType.svg,
        onPress: () => {
          if (selectedPost) {
            setEditingPost(true);
            navigation.navigate('CreatePost', {
              data: selectedPost,
              navigationFrom: 'EditCommunity',
            });
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
        imageColor: theme.colors.error,
        titleColor: theme.colors.error,
        imageType: ImageType.svg,
        onPress: () => {
          showAlertPopup({
            title: t('DeletePost'),
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
  const handleCommentClick = (post: CommunityModel) => {
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
      route.params?.navigationFrom !=
        CommunityParentScreenType.fromNotification &&
      templateData.templateList &&
      templateData.templateList?.length > 1
    ) {
      menuOptions.push({
        name: t('SelectExperience'),
        source: Images.myDiary,
        type: ImageType.svg,
        onPress: () => {
          if (userDetails?.isAdvisor) {
            setShowTemplateSelectPopup(true);
          } else {
            showTemplatePopup();
          }
        },
      });
    }

    return menuOptions;
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to process HTML content for feed posts and generate previews (FYN-4065 )
   */
  const setCommunityHtmlContent = (
    data: CommunityModel[],
    freshData: boolean,
  ): CommunityModel[] => {
    const initialData: CommunityModel[] = freshData ? [] : [...communityList];

    const updatedPosts = data.map(postData => {
      const updatedReplies = postData.commentsReplies
        ? postData.commentsReplies.map(replyData => {
            const {
              cleanHtml: cleanReplyHtml,
              linkPreviewHtml: replyLinkPreviewHtml,
            } = extractLinkPreviewHtml(replyData.commentDetailHTML ?? '');
            const {
              cleanHtml: cleanReplyHtmlNoIframes,
              embeddedIframeHtml: replyEmbeddedIframeHtml,
            } = extractEmbeddedIframes(cleanReplyHtml);
            const updatedHtml = processHtmlContent({
              html: cleanReplyHtmlNoIframes,
              maxWords: 50,
              linkColor: theme.colors.links,
              showMore: true,
            });
            return {
              ...replyData,
              commentDetailHTML: stripPreviewUrlFromHtml(
                updatedHtml?.Content,
                replyLinkPreviewHtml,
              ),
              shortContent: stripPreviewUrlFromHtml(
                updatedHtml?.shortContent,
                replyLinkPreviewHtml,
              ),
              iFrameList: updatedHtml?.iFrameList,
              linkPreviewHtml: replyLinkPreviewHtml,
              embeddedIframeHtml: replyEmbeddedIframeHtml,
            };
          })
        : postData.commentsReplies;

      const { cleanHtml: cleanPostHtml, linkPreviewHtml } =
        extractLinkPreviewHtml(postData.detailHTML || postData.detail || '');
      const { cleanHtml: cleanPostHtmlNoIframes, embeddedIframeHtml } =
        extractEmbeddedIframes(cleanPostHtml);
      const updatedHtml = processHtmlContent({
        html: cleanPostHtmlNoIframes,
        linkColor: theme.colors.links,
        showMore: true,
      });

      return {
        ...postData,
        commentsReplies: updatedReplies,
        detailHTML: stripPreviewUrlFromHtml(
          updatedHtml?.Content,
          linkPreviewHtml,
        ),
        shortContent: stripPreviewUrlFromHtml(
          updatedHtml?.shortContent,
          linkPreviewHtml,
        ),
        iFrameList: updatedHtml?.iFrameList,
        linkPreviewHtml,
        embeddedIframeHtml,
      };
    });

    return [...initialData, ...updatedPosts];
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to call API for fetching all posts (FYN-4065 )
   */
  const callGetAllCommunityListApi = (
    pageNo: number,
    search?: string,
    advProgramSessionID?: string,
  ) => {
    setPage(pageNo);

    getallforumsApi.mutate({
      PageNumber: pageNo,
      SessionId: advProgramSessionID
        ? advProgramSessionID
        : templateDetails.selectedTemplate?.programSessionID,
      ProgramId: templateDetails.selectedTemplate?.programID,
      SearchStr: !isEmpty(search) ? search : undefined,
    });
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to load more feeds when user scrolls (FYN-4065 )
   */
  const loadMorePost = () => {
    if (hasMoreData && !apiLoading) {
      callGetAllCommunityListApi(page + 1);
    }
  };

  const selectUserGroup = (item: GetUserActiveTemplateModel) => {
    if (!templateLoading) {
      setShowTemplateSelectPopup(false);
      getProgramSessionListApi.mutate({
        apiPayload: { ProgramId: item.programID },
        tempData: item,
      });
    }
  };

  const renderTemplateItem = (item: GetUserActiveTemplateModel) => {
    return (
      <Tap
        style={{
          ...styles.container,
          borderColor:
            item.programID == selectedTemplateItem?.programID
              ? theme.colors.primary
              : theme.colors.outline,
          borderWidth:
            item.programID == selectedTemplateItem?.programID ? 1.5 : 0.3,
          backgroundColor:
            item.programID == selectedTemplateItem?.programID
              ? theme.colors.primarySelected
              : theme.colors.background,
        }}
        onPress={() => selectUserGroup(item)}
      >
        <View>
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
      </Tap>
    );
  };

  /**
   * Added by  @Shivang 02-04-25 -> Function to render each feed item (FYN-4065 )
   */
  const renderPostItem = (item: CommunityModel) => {
    return (
      <PostItem
        item={item}
        openLinks={openInAppBrowser}
        type={PostType.community}
        //shortContent
        likeClick={() => {
          updateCommunity({
            type: 'post',
            postID: item.postDetailID,
            like: true, // toggles the like status
            callApi: true, // to trigger the API call
          });
        }}
        likeListClick={() => {
          navigation.navigate('GroupMembers', {
            postId: item.postDetailID,
            type: GroupMembersScreenParent.like,
          });
        }}
        commentClick={() => handleCommentClick(item)}
        commentLikeClick={() => {
          updateCommunity({
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
        showMoreClick={() => {
          setCommunityList(prevFeedPostList =>
            prevFeedPostList.map(post => {
              if (post.postDetailID !== item.postDetailID) return post;

              return {
                ...post,
                showMore: !post.showMore,
              };
            }),
          );
        }} // CHANGED (function pass)
        loading={item.postDetailID == updatePostId}
      />
    );
  };

  const getForumById = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      type?: string;
    }) => {
      return makeRequest<CommunityModel[]>({
        endpoint: ApiConstants.Getforumbyid,
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
      setApiLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result.length > 0) {
        const newPostData = data.result?.at(0);
        if (!newPostData) return;

        //comment replies
        const updatedComments = newPostData.commentsReplies?.map(reply => {
          const {
            cleanHtml: cleanReplyHtml,
            linkPreviewHtml: replyLinkPreviewHtml,
          } = extractLinkPreviewHtml(reply.commentDetailHTML ?? '');
          const {
            cleanHtml: cleanReplyHtmlNoIframes,
            embeddedIframeHtml: replyEmbeddedIframeHtml,
          } = extractEmbeddedIframes(cleanReplyHtml);
          const parsedReplyHtml = processHtmlContent({
            html: cleanReplyHtmlNoIframes,
            maxWords: 50,
            linkColor: theme.colors.links,
            showMore: true,
          });

          return {
            ...reply,
            commentDetailHTML: stripPreviewUrlFromHtml(
              parsedReplyHtml?.Content,
              replyLinkPreviewHtml,
            ),
            shortContent: stripPreviewUrlFromHtml(
              parsedReplyHtml?.shortContent,
              replyLinkPreviewHtml,
            ),
            iFrameList: parsedReplyHtml?.iFrameList,
            linkPreviewHtml: replyLinkPreviewHtml,
            embeddedIframeHtml: replyEmbeddedIframeHtml,
          };
        });

        //existing
        const {
          cleanHtml: cleanForumPostHtml,
          linkPreviewHtml: forumPostLinkPreviewHtml,
        } = extractLinkPreviewHtml(
          newPostData?.detailHTML || newPostData?.detail || '',
        );
        const {
          cleanHtml: cleanForumPostHtmlNoIframes,
          embeddedIframeHtml: forumPostEmbeddedIframeHtml,
        } = extractEmbeddedIframes(cleanForumPostHtml);
        const parsedPostHtml = processHtmlContent({
          html: cleanForumPostHtmlNoIframes,
          maxWords: 50,
          linkColor: theme.colors.links,
          showMore: false,
        });

        // 🔹 NEW: build a normalized post object with both
        const normalizedPost: CommunityModel = {
          ...newPostData,
          commentsReplies: updatedComments, // processed comments
          detailHTML: stripPreviewUrlFromHtml(
            parsedPostHtml?.Content,
            forumPostLinkPreviewHtml,
          ),
          shortContent: stripPreviewUrlFromHtml(
            parsedPostHtml?.shortContent,
            forumPostLinkPreviewHtml,
          ),
          iFrameList: parsedPostHtml?.iFrameList,
          linkPreviewHtml: forumPostLinkPreviewHtml,
          embeddedIframeHtml: forumPostEmbeddedIframeHtml,
        };

        if (variables.type) {
          setCommunityList([normalizedPost]);

          if (route.params?.replyId || route.params?.commentId) {
            setSelectedPost(normalizedPost);
            setShowCommentPopup(true);
          }
        } else {
          setCommunityList(prev =>
            prev.map(item => {
              if (item.postDetailID === variables.apiPayload.PostId) {
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
      setLoading(false);
    },
  });

  const getallforumsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<CommunityModel[]>({
        endpoint: ApiConstants.Getallforums,
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
        if (!loading) {
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
        if (
          route.params?.navigationFrom !=
            CommunityParentScreenType.fromNotification &&
          templateDetails.selectedTemplate?.programTypeID != 1
        ) {
          Log('entered in..................');
          setCommunityList([]);
          setHasMoreData(false);
          return;
        }
        Log('entered out..................');
        if (updatePostId) {
          setUpdatePostId(undefined);

          setCommunityList(
            updateArrayWithChanges({
              targetArray: communityList,
              sourceArray: setCommunityHtmlContent(
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
          setCommunityList(
            setCommunityHtmlContent(data.result, variables.PageNumber === 1),
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
          setCommunityList([]);
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
        setCommunityList([]);
      }
    },
  });

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
        const updatedCommunityList = communityList.map((item, index) => {
          if (selectedPost?.postDetailID == item.postDetailID) {
            return {
              ...item,
              isCommentingAvailable: variables.IsPosting,
            };
          } else {
            return item;
          }
        });
        setCommunityList(updatedCommunityList);
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
      setApiLoading(true);
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      setUpdatePostId(undefined);
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        if (variables.refreshPost) {
          setCommunityList(prev =>
            prev?.map(item => {
              if (item.postDetailID != data.result?.feedDetail?.id) return item;

              const {
                cleanHtml: cleanEditHtml,
                linkPreviewHtml: editLinkPreviewHtml,
              } = extractLinkPreviewHtml(
                data.result?.feedDetail?.detailHTML ||
                  data.result?.feedDetail?.detail ||
                  '',
              );
              const {
                cleanHtml: cleanEditHtmlNoIframes,
                embeddedIframeHtml: editEmbeddedIframeHtml,
              } = extractEmbeddedIframes(cleanEditHtml);
              const updatedHtml = processHtmlContent({
                html: cleanEditHtmlNoIframes,
                maxWords: 50,
                linkColor: theme.colors.links,
                showMore: false,
              });

              return {
                ...item,
                detailHTML: stripPreviewUrlFromHtml(
                  updatedHtml?.Content,
                  editLinkPreviewHtml,
                ),
                shortContent: stripPreviewUrlFromHtml(
                  updatedHtml?.shortContent,
                  editLinkPreviewHtml,
                ),
                iFrameList: updatedHtml?.iFrameList,
                linkPreviewHtml: editLinkPreviewHtml,
                embeddedIframeHtml: editEmbeddedIframeHtml,
                postImageLocation: data.result?.feedDetail?.postImageLocation,
              };
            }),
          );
        } else {
          setPostDetailsForEdit(data?.result);
        }
      }
    },
    onError(error, variables, context) {
      setLoading(false);
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
        updateCommunity({
          type: 'post',
          postID: variables.PostId,
          like: variables.PostId ? true : false,
          commentCount: variables.CommentId,
        });
      } else {
        updateCommunity({
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
        setCommunityList(prev =>
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

  // -------------------------------------------------------------------------------------------------------------
  const getCommunityTemplateListApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetCommunityTemplateListModel>({
        endpoint: ApiConstants.GetCommunityTemplateList,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setTemplateLoading(true);
    },
    onSettled(data, error, variables, context) {
      setTemplateLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result && data.result.length > 0) {
        const result = data.result;
        const firstItem = result.at(0);

        setCommunityTemplateList(result);
        templateDetails.setTemplateList(
          result.map((item: GetCommunityTemplateListItem) => ({
            programID: item.programId,
            programName: item.programName,
          })),
        );

        // 🔁 Common API call for both cases (once)
        if (firstItem?.programId) {
          getProgramSessionListApi.mutate({
            apiPayload: { ProgramId: firstItem.programId },
            tempData: firstItem,
          });
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const getProgramSessionListApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      tempData: GetUserActiveTemplateModel;
    }) => {
      return makeRequest<GetProgramSessionListModel>({
        endpoint: ApiConstants.GetProgramSessionList,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setLoading(true);
      Log(
        ' 4]------------getProgramSessionListApi calling first-------------->',
      );
    },
    onSettled(data, error, variables, context) {},
    onSuccess(data, variables, context) {
      if (data?.result && data?.result?.length > 0) {
        const templateData = {
          ...variables.tempData,
          programSessionID: data.result.at(0)?.programSession?.id,
          programTypeID: data.result.at(0)?.programSession?.programTypeID,
        };
        templateDetails.setSelectedTemplate(templateData);

        setSelectedTemplateItem(templateData);

        // callGetAllCommunityListApi(
        //   1,
        //   '',
        //   data.result.at(0)?.programSession?.id,
        // );
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={t('Community')}
          rightIcons={setHeaderRightIcons()}
          showSearchIcon={
            route.params?.navigationFrom ==
            CommunityParentScreenType.fromNotification
              ? false
              : templateDetails.templateList &&
                templateDetails.templateList.length > 0
              ? templateDetails.selectedTemplate
                ? templateDetails.selectedTemplate?.programTypeID != 1
                  ? false
                  : true
                : false
              : false
          }
          searchText={search}
          setSearchText={searchCommunityPost}
          subtitle={
            route.params?.navigationFrom !=
            CommunityParentScreenType.fromNotification
              ? templateDetails.selectedTemplate?.programName &&
                templateDetails.selectedTemplate?.programName?.length > 25
                ? `${templateDetails.selectedTemplate?.programName.slice(
                    0,
                    23,
                  )}...`
                : templateDetails.selectedTemplate?.programName
              : undefined
          }
        />

        {loading ? (
          <SkeletonList />
        ) : (
          <View style={{ flex: 1 }}>
            <CustomFlatList
              data={communityList}
              extraData={[updatePostId]}
              contentContainerStyle={
                communityList.length == 0
                  ? styles.flatListContainerStyle
                  : undefined
              }
              refreshing={loading}
              keyExtractor={(item, index) =>
                `communitypost-${item.postDetailID!.toString()}-${index}`
              }
              ItemSeparatorComponent={() => (
                <Divider style={styles.postItemSeprator} />
              )}
              onRefresh={() => {
                if (
                  route.params?.navigationFrom !=
                  CommunityParentScreenType.fromNotification
                ) {
                  callGetAllCommunityListApi(1);
                } else {
                  handleNotification();
                }
              }}
              onEndReachedThreshold={0.6}
              onEndReached={loadMorePost}
              ListHeaderComponent={
                newPostLoading ? <SkeletonList count={1} /> : <></>
              }
              ListFooterComponent={
                hasMoreData && communityList.length > 0 ? (
                  <LoadMore />
                ) : route.params?.navigationFrom !=
                    CommunityParentScreenType.fromNotification &&
                  communityList.length > 0 ? (
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
                route.params?.navigationFrom !=
                  CommunityParentScreenType.fromNotification &&
                templateDetails.selectedTemplate?.programTypeID != 1 ? (
                  <EmptyView
                    labelStyle={styles.textCenter}
                    label={t('NotCommunityMember')}
                  />
                ) : // If communityList is empty, check the specific conditions
                search == '' &&
                  templateDetails.templateList &&
                  templateDetails.templateList?.length == 0 &&
                  templateDetails.selectedTemplate?.programTypeID == 1 ? (
                  <EmptyView
                    labelStyle={styles.textCenter}
                    label={
                      search.length > 0
                        ? t('NoPostSearchMsg')
                        : t('StartConversation')
                    }
                  />
                ) : (
                  <></>
                )
              }
              renderItem={({ item }) => renderPostItem(item)}
            />
          </View>
        )}
        {selectedPost && (
          <CommentPopup
            moduleType="community"
            post={selectedPost}
            shown={showCommentPopup}
            setShown={setShowCommentPopup}
            handleCommentOption={(comment, from) => {
              setSelectedComment(comment);
              if (comment?.isOwner) {
                if (from == 'edit') {
                  setEditCommentId(comment);
                  setShowCommentPopup(true);
                } else if (from == 'delete') {
                  //  else if (from == 'edit') {
                  //   setEditCommentId(selectedComment);
                  //   setShowCommentPopup(true);
                  // }
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
                } else {
                  setShowSupportPopup(true);
                }
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
              getForumById.mutate({
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
              CommunityParentScreenType.fromNotification
                ? {
                    commentId: route.params?.commentId,
                    replyId: route.params?.replyId,
                  }
                : undefined
            }
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
          children={handleCommunityPostOptions()}
        />

        <SupportPopup shown={showSupportPopup} setShown={setShowSupportPopup} />

        {selectedComment && selectedComment.isOwner ? (
          <CustomActionSheetPoup
            shown={showCommentActionPopup}
            setShown={setShowCommentActionPopup}
            hideIcons={false}
            centered={false}
            onCancelClick={() => {
              setSelectedComment(undefined);
              setDeleteCommentId(undefined);
              setEditCommentId(undefined);
            }}
            children={[
              {
                title: t('Delete'),
                image: Images.delete,
                titleColor: theme.colors.error,
                imageColor: theme.colors.error,
                imageType: ImageType.svg,
                onPress: () => {
                  showAlertPopup({
                    title: t('DeleteComment'),
                    msg: t('DeleteCommentMsg'),
                    PositiveText: t('Delete'),
                    NegativeText: t('Cancel'),
                    onPositivePress: () => {
                      setDeleteCommentId(selectedComment);
                      setShowCommentPopup(true);
                    },
                    onNegativePress() {
                      setSelectedComment(undefined);
                      setDeleteCommentId(undefined);
                      setShowCommentPopup(true);
                    },
                  });
                },
              },
              {
                title: t('Edit'),
                image: Images.editSquare,
                imageType: ImageType.svg,
                onPress: () => {
                  setEditCommentId(selectedComment);
                  setShowCommentPopup(true);
                },
              },
            ]}
          />
        ) : (
          <></>
        )}

        {!showCommentPopup &&
          route.params?.navigationFrom !=
            CommunityParentScreenType.fromNotification &&
          ((!userDetails?.isAdvisor &&
            templateDetails.selectedTemplate?.programTypeID == 1) ||
            (userDetails?.isAdvisor &&
              templateDetails.selectedTemplate?.programTypeID == 1)) && (
            <Tap
              style={styles.fab}
              onPress={() => {
                navigation.navigate('CreatePost', {
                  navigationFrom: 'CreateCommunity',
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

        <CustomImagePicker
          showPopup={showImagePicker}
          setShowPopup={setShowImagePicker}
          mediaList={value => {
            setShowCommentPopup(true);
            setMediaList(value);
          }}
        />
        <CustomBottomPopup
          shown={showTemplateSelectPopup}
          setShown={setShowTemplateSelectPopup}
          dismissOnBackPress={!templateLoading}
          dismissOnClosePress={
            !templateLoading && templateDetails.selectedTemplate != undefined
          }
          title={t('SelectExperience')}
        >
          {templateLoading ? (
            <SkeletonList
              count={3}
              children={
                <View style={styles.skeletonMain}>
                  <View style={styles.skeletonNameLay}>
                    <View style={styles.nameSkel}></View>
                    <View style={styles.dateSkel}></View>
                  </View>
                  <View style={styles.descriptionSkeleton}></View>
                  <View style={styles.descriptionSkeleton1}></View>
                </View>
              }
            />
          ) : (
            templateDetails.templateList && (
              <View style={styles.templateListPopUp}>
                <CustomFlatList
                  data={templateDetails.templateList}
                  extraData={[
                    templateDetails.selectedTemplate,
                    selectedTemplateItem,
                  ]}
                  keyExtractor={item => item.programID!}
                  renderItem={({ item }) => renderTemplateItem(item)}
                />
              </View>
            )
          )}
        </CustomBottomPopup>
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
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },

    container: {
      borderRadius: theme.roundness,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginHorizontal: 10,
      marginTop: 10,
    },
    flatListLay: {
      flex: 1,
      paddingHorizontal: 8,
      paddingBottom: 8,
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
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 50, // size of the button
      height: 50, // size of the button
      backgroundColor: theme.colors.primary, // color of the FAB
      borderRadius: theme.roundness, // round button
      justifyContent: 'center', // center the icon
      alignItems: 'center', // center the icon
    },
    icon: {
      width: 27,
      height: 27,
    },
    programName: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
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
    templateListPopUp: {
      height: 300,
      flex: 1,
    },
    FeedEndText: {
      alignSelf: 'center',
      marginTop: 20,
    },
    divider: {
      height: 1,
      width: '70%',
      backgroundColor: theme.colors.border,
      borderRadius: theme.roundness,
      marginHorizontal: 10,
      alignSelf: 'center',
    },
    postItemSeprator: {
      marginTop: 10,
      marginBottom: 30,
    },
    textCenter: { textAlign: 'center' },
  });

export default Community;
