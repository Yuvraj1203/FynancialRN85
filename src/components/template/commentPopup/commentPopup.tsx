import { CustomImage, CustomText, SkeletonList, Tap } from '@/components/atoms';
import CustomFlatList, {
  keyboardShouldPersistTapsType,
} from '@/components/atoms/customFlatList/customFlatList';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomBottomPopup,
  EmptyView,
  LoadMore,
  MentionTextInput,
} from '@/components/molecules';
import { CustomHtmlEditorRef } from '@/components/molecules/customTextInput/customHtmlEditor';
import { InputTextAlignVertical } from '@/components/molecules/customTextInput/mentionTextInput';
import { GroupMembersScreenParent } from '@/screens/groupMembers/groupMembers';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  CommentsReplies,
  GetAllCommentsModel,
  GetFeedPostModel,
  GetUsersByGroupIdForTagModel,
  GetUserTeamListForTagModel,
  UploadFileListToS3Model,
} from '@/services/models';
import {
  CommunityModel,
  GetPostDetailsForEditModel,
} from '@/services/models/communityModel/communityModel';
import { templateStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  formatMentions,
  extractEmbeddedIframes,
  extractLinkPreviewHtml,
  formatMentionsInsideHtml,
  getFileInfoWithMime,
  getImageSize,
  isEmpty,
  processHtmlContent,
  reverseFormatMentions,
  showSnackbar,
  stripPreviewUrlFromHtml,
  updateArrayWithChanges,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { ActivityIndicator } from 'react-native-paper';
import CommentItem, { CommentType } from '../commentItem/commentItem';
import { ImagePopupProps } from '../imagePopup/imagePopup';

// *** No changes to your existing imports above ***

type FromNotificationObject = {
  commentId?: string;
  replyId?: string;
};

export type CommentPopupProps = {
  post: GetFeedPostModel | CommunityModel;
  shown: boolean;
  setShown: (value: boolean) => void;
  handleCommentOption?: (comment?: GetAllCommentsModel, from?: string) => void;
  deleteCommentId?: GetAllCommentsModel;
  setDeleteCommentId?: (value?: GetAllCommentsModel) => void;
  editCommentId?: GetAllCommentsModel;
  setEditCommentId?: (value?: GetAllCommentsModel) => void;
  showError?: (value?: string) => void;
  commentCountUpdate?: () => void;
  moduleType?: 'feed' | 'community';
  openImagePicker?: () => void;
  imageList?: Asset[];
  setImageList?: (value?: Asset[]) => void;
  handleImagePopup?: (props?: ImagePopupProps) => void;
  fromNotificationItem?: FromNotificationObject;
  userId?: number;
};

function CommentPopup(props: CommentPopupProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const navigation = useAppNavigation();

  const templateData = templateStore();
  const userDetails = userStore(state => state.userDetails);

  const [hasMoreData, setHasMoreData] = useState(true);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [postCommentList, setPostCommentList] =
    useState<GetAllCommentsModel[]>();

  const [mediaList, setMediaList] = useState<Asset[]>([]);
  const [replyComment, setReplyComment] = useState<GetAllCommentsModel>();
  const openInAppBrowser = useCustomInAppBrowser();
  const [page, setPage] = useState(1);
  const [apiLoading, setApiLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<GetAllCommentsModel>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const [groupMembersAllList, setGroupMembersAllList] = useState<
    GetUsersByGroupIdForTagModel[]
  >([]);

  const [addCommentLoading, setAddCommentLoading] = useState(false);
  const [editCommentLoading, setEditCommentLoading] = useState(false);
  const [allowBackPress, setAllowBackPress] = useState(true);
  const [hideSuggestions, setHideSuggestions] = useState(0);
  const [showMsg, setShowMsg] = useState<{
    msg?: string;
    type?: 'success' | 'danger';
  }>();

  const [postId, setPostId] = useState<string>();

  const [editComment, setEditComment] = useState<GetPostDetailsForEditModel>();

  const [selectedComment, setSelectedComment] = useState<string>();

  const [userTeamListForTag, setUserTeamListForTag] = useState<
    GetUserTeamListForTagModel[]
  >([]);

  // ✅ Tracks whether there are ANY users left to tag in this post
  const [noTaggableUsersLeft, setNoTaggableUsersLeft] = useState(false);

  /**
   *  Added by @Akshita 20-11-25 ---> Master list: all users returned from API, never filtered(FYN-4314)*/
  const [userTeamListForTagMaster, setUserTeamListForTagMaster] = useState<
    GetUserTeamListForTagModel[]
  >([]);

  const textInputRef = useRef<CustomHtmlEditorRef>(null);
  const [resetPreviewKey, setResetPreviewKey] = useState(false);

  const fromNotificationRef = useRef(
    props.fromNotificationItem?.commentId ? true : false,
  );

  useEffect(() => {
    // If nothing typed, reset suggestions to full master list

    if (!comment || comment.length === 0) {
      setUserTeamListForTag(userTeamListForTagMaster);
      setNoTaggableUsersLeft(false); // ✅ user can tag anyone

      return;
    }

    const taggedIdsStr = getTaggedUserIdsFromComment();

    if (!taggedIdsStr) {
      // No tags found in text → show full list

      setUserTeamListForTag(userTeamListForTagMaster);

      return;
    }

    const taggedUserIds = taggedIdsStr.split(',');

    // Filter out already-tagged users

    const updatedList = userTeamListForTagMaster.filter(
      user => !taggedUserIds.includes(String(user.id)),
    );

    setUserTeamListForTag(updatedList);

    setNoTaggableUsersLeft(updatedList.length === 0);
  }, [comment, userTeamListForTagMaster]);

  useEffect(() => {
    setResetPreviewKey(false);
    setReplyComment(undefined);
    setEditingComment(undefined);
    setComment('');
    props.setEditCommentId?.(undefined);
    //if (userDetails && props.shown && props.post.postDetailID != postId) {
    if (userDetails && props.shown) {
      setPostCommentList(undefined);
      //setPostId(props.post.postDetailID);
      if (props.post?.postDetailID) {
        callGetAllCommentsApi(1);
      }
      if (props.imageList) {
        setMediaList([...props.imageList]);
      }

      //disable the mention list for 2.0.3 version
      if (props.moduleType == 'feed') {
        getUserTeamListForTagApi.mutate({
          apiPayload: {
            UserId: userDetails?.isAdvisor ? props.userId : userDetails?.userID,
          },
        });
      } else if (props.moduleType == 'community') {
        getMemberListForCommunityTaggingApi.mutate({
          apiPayload: {
            programId: templateData.selectedTemplate?.programID,
            sessionId: templateData.selectedTemplate?.programSessionID,
            groupId: templateData.selectedTemplate?.groupID,
          },
        });
      }
    }
  }, [props.shown]);

  useEffect(() => {
    if (userDetails && props.deleteCommentId) {
      deletePostApi.mutate({
        Id: props.deleteCommentId.postDetailID,
      });
    }
  }, [props.deleteCommentId]);

  useEffect(() => {
    if (userDetails && props.editCommentId) {
      getPostDetailsForEdit.mutate({
        apiPayload: { Id: props.editCommentId.postDetailID },
        editComment: true,
      });
    }
  }, [props.editCommentId]);

  useEffect(() => {
    if (props.imageList) {
      setMediaList([...props.imageList]);
    }
  }, [props.imageList]);

  const handleCommentLike = ({
    commentItem,
    like,
    callApi,
  }: {
    commentItem?: GetAllCommentsModel;
    like?: boolean;
    commentCount?: number;
    callApi?: boolean;
  }) => {
    let isLikeClick: boolean | undefined = false;

    setPostCommentList(prevCommentList =>
      prevCommentList?.map(comment => {
        if (comment.postDetailID !== commentItem?.postDetailID) return comment;

        const likeCount = like
          ? comment.likedByUser
            ? Math.max((comment.likeCount || 0) - 1, 0)
            : (comment.likeCount || 0) + 1
          : comment.likeCount;

        isLikeClick = like ? !comment.likedByUser : comment.likedByUser;

        return {
          ...comment,
          likedByUser: like ? !comment.likedByUser : comment.likedByUser,
          likeCount,
        };
      }),
    );

    if (callApi) {
      likeApi.mutate({
        PostId: commentItem?.postDetailID,
        IsLikeClick: isLikeClick,
        commentItem: commentItem,
      });
    }
  };

  /** Added by @Yuvraj 01-05-25 -> remove stale comment */
  const handleBackPress = () => {
    if (props.shown) {
      setEditComment(undefined);
      setEditingComment(undefined);
      setComment('');
      setMediaList([]);
      props.setImageList?.([]);
      setEditLoading(false); // safe reset
      setEditCommentLoading(false); // safe reset
      // clear reply mode too (avoid collision)
      setReplyComment(undefined);
      textInputRef.current?.setHtml('');
    }
    return true;
  };

  const refreshCommentList = () => {
    if (editComment) {
      // when user edit a comment then refresh only that page
      // getAllCommentsApi.mutate({
      //   apiPayload: {
      //     postID:
      //       editComment?.feedDetail?.viewType == CommentType.comment
      //         ? props.post?.postDetailID
      //         : editComment?.feedDetail?.mainCommentId,
      //     PageNumber: editComment?.feedDetail?.pageNo,
      //   },
      //   editComment: editComment,
      // });
      getPostDetailsForEdit.mutate({
        apiPayload: { Id: editComment.feedDetail?.id },
        refreshPost: true,
      });
    } else if (replyComment) {
      getAllCommentsApi.mutate({
        apiPayload: {
          postID: replyComment.postDetailID,
          PageNumber: 1,
        },
        reply: replyComment,
      });
      if (props.moduleType == 'feed') {
        getUserTeamListForTagApi.mutate({
          apiPayload: {
            UserId: userDetails?.isAdvisor ? props.userId : userDetails?.userID,
          },
        });
      } else if (props.moduleType == 'community') {
        getMemberListForCommunityTaggingApi.mutate({
          apiPayload: {
            programId: templateData.selectedTemplate?.programID,
            sessionId: templateData.selectedTemplate?.programSessionID,
            groupId: templateData.selectedTemplate?.groupID,
          },
        });
      }
    } else {
      // when user add a comment than refresh the last page
      // if no more feeds available than call the previous page else
      // call the latest page
      if (!hasMoreData) {
        if (postCommentList?.length! > 1) {
          callGetAllCommentsApi(
            postCommentList?.at(postCommentList?.length - 1)?.pageNo!,
          );
        } else {
          callGetAllCommentsApi(1);
        }
      } else {
        if (addCommentLoading || editCommentLoading) {
          if (addCommentLoading) {
            setAddCommentLoading(false);
          }
          if (editCommentLoading) {
            setEditCommentLoading(false);
            props.setEditCommentId?.(undefined);
          }
          return;
        }
      }
    }
  };

  const handleMsgShow = (msg?: string, type?: 'success' | 'danger') => {
    setShowMsg({ msg: msg, type: type });
    setTimeout(() => {
      setShowMsg(undefined);
    }, 2000);
  };

  const setHtmlContent = (
    data: GetAllCommentsModel[],
    freshData: boolean,
  ): GetAllCommentsModel[] => {
    let newData: GetAllCommentsModel[] = freshData ? [] : [...postCommentList!];

    for (let i = 0; i < data.length; i++) {
      const commentData = data[i];

      if (commentData?.commentsReplies) {
        const formattedReplies: CommentsReplies[] = [];
        for (let j = 0; j < commentData.commentsReplies.length; j++) {
          const replyData = commentData.commentsReplies[j];
          const { cleanHtml: cleanReplyHtml, linkPreviewHtml: replyLinkPreviewHtml } =
            extractLinkPreviewHtml(replyData.commentDetailHTML ?? '');
          const { cleanHtml: cleanReplyHtmlNoIframes, embeddedIframeHtml: replyEmbeddedIframeHtml } =
            extractEmbeddedIframes(cleanReplyHtml);
          const updatedHtml = processHtmlContent({
            html: cleanReplyHtmlNoIframes,
            maxWords: 50,
            linkColor: theme.colors.links,
            showMore: true,
          });
          formattedReplies.push({
            ...replyData,
            commentDetailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, replyLinkPreviewHtml),
            shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, replyLinkPreviewHtml),
            iFrameList: updatedHtml?.iFrameList,
            linkPreviewHtml: replyLinkPreviewHtml,
            embeddedIframeHtml: replyEmbeddedIframeHtml,
          });
        }
        commentData.commentsReplies = formattedReplies;
      }

      const { cleanHtml: cleanCommentHtml, linkPreviewHtml: commentLinkPreviewHtml } =
        extractLinkPreviewHtml(commentData.detailHTML ?? '');
      const { cleanHtml: cleanCommentHtmlNoIframes, embeddedIframeHtml: commentEmbeddedIframeHtml } =
        extractEmbeddedIframes(cleanCommentHtml);
      const updatedHtml = processHtmlContent({
        html: cleanCommentHtmlNoIframes,
        maxWords: 50,
        linkColor: theme.colors.links,
        showMore: true,
      });
      if (
        !newData.some(item => item.postDetailID === commentData.postDetailID)
      ) {
        newData.push({
          ...commentData,
          detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, commentLinkPreviewHtml),
          shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, commentLinkPreviewHtml),
          iFrameList: updatedHtml?.iFrameList,
          linkPreviewHtml: commentLinkPreviewHtml,
          embeddedIframeHtml: commentEmbeddedIframeHtml,
          allCommentsReplies: commentData.commentsReplies?.at(0)
            ? [
                {
                  postDetailID: commentData.commentsReplies?.at(0)?.commentID,
                  userID: commentData.commentsReplies?.at(0)?.userID,
                  userName: commentData.commentsReplies?.at(0)?.userName,
                  userProfileLocation:
                    commentData.commentsReplies?.at(0)?.userProfileLocation,
                  detail: commentData.commentsReplies?.at(0)?.comment,
                  detailHTML:
                    commentData.commentsReplies?.at(0)?.commentDetailHTML,
                  shortContent:
                    commentData.commentsReplies?.at(0)?.shortContent,
                  iFrameList: commentData.commentsReplies?.at(0)?.iFrameList,
                  linkPreviewHtml:
                    commentData.commentsReplies?.at(0)?.linkPreviewHtml,
                  embeddedIframeHtml:
                    commentData.commentsReplies?.at(0)?.embeddedIframeHtml,
                  likeCount:
                    commentData.commentsReplies?.at(0)?.commentLikeCount,
                  commentCount:
                    commentData.commentsReplies?.at(0)?.commentReplyCount,
                  likedByUser: commentData.commentsReplies?.at(0)?.likedByUser,
                  postDateTime:
                    commentData.commentsReplies?.at(0)?.postDateTime,
                  displayAgo: commentData.commentsReplies?.at(0)?.displayAgo,
                  expireCommentDate:
                    commentData.commentsReplies?.at(0)?.expireCommentDate,
                  isCommentingAvailable:
                    commentData.commentsReplies?.at(0)?.isCommentingAvailable,
                  isOwner: commentData.commentsReplies?.at(0)?.isOwner,
                  isEditable: commentData.commentsReplies?.at(0)?.isEditable,
                  isDeletable: commentData.commentsReplies?.at(0)?.isDeletable,
                  initials: commentData.commentsReplies?.at(0)?.initials,
                  recordType: commentData.commentsReplies?.at(0)?.recordType,
                  primaryFeedId:
                    commentData.commentsReplies?.at(0)?.primaryFeedId,
                  postImageLocation:
                    commentData.commentsReplies?.at(0)
                      ?.commentImageLocationList,
                  postImageLocationFeed: commentData.commentsReplies
                    ?.at(0)
                    ?.commentImageLocationList?.map(item => ({
                      postImageLocation: item,
                      contentType: 1,
                      displayName: item.substring(item.lastIndexOf('/') + 1),
                    })),
                  mainCommentId: commentData.postDetailID,
                },
              ]
            : undefined,
        });
      }
    }
    return newData;
  };

  const setHtmlContentForReplies = (
    data: GetAllCommentsModel[],
  ): GetAllCommentsModel[] => {
    let newData: GetAllCommentsModel[] = [];

    for (let i = 0; i < data.length; i++) {
      const commentData = data[i];

      const { cleanHtml: cleanRepliesHtml, linkPreviewHtml: repliesLinkPreviewHtml } =
        extractLinkPreviewHtml(commentData.detailHTML ?? '');
      const { cleanHtml: cleanRepliesHtmlNoIframes, embeddedIframeHtml: repliesEmbeddedIframeHtml } =
        extractEmbeddedIframes(cleanRepliesHtml);
      const updatedHtml = processHtmlContent({
        html: cleanRepliesHtmlNoIframes,
        maxWords: 50,
        linkColor: theme.colors.links,
        showMore: true,
      });
      if (
        !newData.some(item => item.postDetailID === commentData.postDetailID)
      ) {
        newData.push({
          ...commentData,
          detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, repliesLinkPreviewHtml),
          shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, repliesLinkPreviewHtml),
          iFrameList: updatedHtml?.iFrameList,
          linkPreviewHtml: repliesLinkPreviewHtml,
          embeddedIframeHtml: repliesEmbeddedIframeHtml,
        });
      }
    }

    return newData;
  };

  const handleMediaList = (mediaList: Asset[]) => {
    const formData = new FormData();

    const newImages = editComment
      ? mediaList.filter(url => editComment?.feedDetail?.postImageLocation)
      : mediaList;

    if (newImages.length > 0) {
      const fileType = {
        uri: mediaList[0].uri,
        name: mediaList[0].fileName,
        type: mediaList[0].type,
      };
      formData.append('files', fileType);
      UploadFileListToS3Api.mutate(formData);
    }
  };

  // Extract all mentioned users and return their IDs as a comma-separated string
  const getTaggedUserIdsFromComment = (): string => {
    if (!comment || !userTeamListForTag || userTeamListForTag.length === 0) {
      return '';
    }

    const normalizedComment = comment.toLowerCase();
    const taggedIds = new Set<string>();

    userTeamListForTagMaster.forEach(user => {
      const fullName = String((user as any).fullName ?? '');
      const id = (user as any).id;

      if (!fullName || id === undefined || id === null) {
        return;
      }

      // This matches the mention format used in MentionTextInput: @First-Last
      const mentionSlug = '@' + fullName.toLowerCase().replace(/\s+/g, '-');

      if (normalizedComment.includes(mentionSlug)) {
        taggedIds.add(String(id));
      }
    });

    return Array.from(taggedIds).join(',');
  };

  const handlePreviewCard = () => {
    setResetPreviewKey(true);
    setTimeout(() => {
      setResetPreviewKey(false);
    }, 10);
  };

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
      if (editComment) {
        setEditCommentLoading(true);
      } else {
        setAddCommentLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (error) {
        if (props.editCommentId) {
          setEditCommentLoading(false);
        } else {
          setAddCommentLoading(false);
        }
      }
    },
    onSuccess(data) {
      if (data.result != null) {
        const editorRaw = textInputRef.current?.getHtml?.() || '';
        const editorHasHtml = !!editorRaw && /<[^>]+>/.test(editorRaw);

        const finalDetailForUpload = editorHasHtml
          ? formatMentionsInsideHtml(editorRaw, userTeamListForTagMaster)
          : !isEmpty(comment)
          ? formatMentions(comment, userTeamListForTagMaster).formattedText
          : '';

        const uploadedImages = [data.result.at(0)?.contentID];

        const payloadDto = {
          groupID:
            templateData.selectedTemplate?.programTypeID !== 0 ||
            templateData.selectedTemplate?.programTypeID !== undefined ||
            templateData.selectedTemplate?.programTypeID !== null
              ? templateData.selectedTemplate?.groupID
              : undefined,
          sessionID:
            templateData.selectedTemplate?.programTypeID !== 0 ||
            templateData.selectedTemplate?.programTypeID !== undefined ||
            templateData.selectedTemplate?.programTypeID !== null
              ? templateData.selectedTemplate?.programSessionID
              : undefined,

          commentCount: 0,

          detail: finalDetailForUpload,
          feedReplyID: editComment?.feedDetail
            ? editComment?.feedDetail?.id
            : replyComment
            ? replyComment.postDetailID
            : props.post.postDetailID,
          header: props.moduleType === 'community' ? 'Community' : 'Feed',
          id: editComment?.feedDetail?.id ?? '',
          isActive: true,
          likeCount: 0,
          postType: props.moduleType == 'feed' ? 1 : 2,
          userID: userDetails?.userID,
          videoDataID: undefined,
          status: 0,
          previewVisible: isPreviewVisible,
          imageList: uploadedImages,
          tagUserIds: getTaggedUserIdsFromComment(),
          PrimaryFeedId: editComment?.feedDetail
            ? editComment?.feedDetail?.primaryFeedId
            : replyComment
            ? replyComment.primaryFeedId
            : props.post.primaryFeedId,
        };
        const deletedImages = Array.isArray(data.result)
          ? data.result
          : [data.result];
        editComment?.feedDetail?.postImageLocation?.filter(
          url => !mediaList.some(item => item.uri === url),
        );
        const extraPayload = {
          //postID: replyComment ? replyComment.postDetailID : '',
          postID: '',
          imageList: uploadedImages,
          deletedImageIds: deletedImages
            ? editComment?.feedDetail?.postImageLocationIDs
            : [],

          postType: props.moduleType == 'feed' ? 1 : 2,
        };

        createorEditcomment.mutate({
          createOrEditPostDetailDto: payloadDto,
          ...extraPayload,
        });
      } else {
        handleMsgShow(data.error?.message, 'danger');
        handlePreviewCard();

        if (props.editCommentId) {
          setEditCommentLoading(false);
        } else {
          setAddCommentLoading(false);
        }
        setMediaList([]);
      }
    },
    onError(error) {
      showSnackbar(error.message, 'danger');
    },
  });

  const handleAddComment = async () => {
    // Allow embed-only comments (iframe/img/video). Treat them as non-empty.
    // Prefer latest raw HTML from editor if available (helps detect embeds)
    const editorRaw =
      (await textInputRef.current?.requestHtml?.()) ??
      textInputRef.current?.getHtml?.();
    const raw = editorRaw && editorRaw.length > 0 ? editorRaw : comment ?? '';
    const plain = raw
      .replace(/<br\s*\/?/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/&[a-zA-Z#0-9]+;/g, ' ') // replace entities like &nbsp; or &#123; with space
      .trim();

    const hasEmbed =
      /<(iframe|video|object|embed)\b[\s\S]*?>[\s\S]*?<\/\1>/i.test(raw) ||
      /<(img|iframe|video|object|embed)\b/i.test(raw);

    if (isEmpty(plain) && !hasEmbed && mediaList.length == 0) {
      return;
    }

    // Prepare detail: prefer plain-text->HTML via formatMentions; if plain is empty but editor raw has embed HTML, send that HTML as detail.
    let finalDetail = '';
    // Prefer the editor's raw HTML snapshot if it contains any HTML tags (covers embed+text cases)
    const editorHasHtml = !!(editorRaw && /<[^>]+>/.test(editorRaw));

    if (editorHasHtml) {
      // ✅ preserve embed + highlight mentions
      finalDetail = formatMentionsInsideHtml(
        editorRaw || '',
        userTeamListForTagMaster,
      );
    } else if (!isEmpty(plain)) {
      finalDetail = formatMentions(
        comment || plain,
        userTeamListForTagMaster,
      ).formattedText;
    } else if (hasEmbed) {
      finalDetail = raw;
    }

    const payloadDto = {
      groupID:
        templateData.selectedTemplate?.programTypeID !== 0 ||
        templateData.selectedTemplate?.programTypeID !== undefined ||
        templateData.selectedTemplate?.programTypeID !== null
          ? templateData.selectedTemplate?.groupID
          : undefined,
      sessionID:
        templateData.selectedTemplate?.programTypeID !== 0 ||
        templateData.selectedTemplate?.programTypeID !== undefined ||
        templateData.selectedTemplate?.programTypeID !== null
          ? templateData.selectedTemplate?.programSessionID
          : undefined,

      commentCount: 0,
      detail: finalDetail || '',
      feedReplyID: editComment?.feedDetail
        ? editComment?.feedDetail?.id
        : replyComment
        ? replyComment.postDetailID
        : props.post.postDetailID,
      header: props.moduleType === 'community' ? 'Community' : 'Feed',
      id: editComment?.feedDetail?.id ?? '',
      isActive: true,
      likeCount: 0,
      postType: props.moduleType == 'feed' ? 1 : 2,
      userID: userDetails?.userID,
      videoDataID: undefined,
      status: 0,
      previewVisible: isPreviewVisible,
      imageList: [],
      tagUserIds: getTaggedUserIdsFromComment(),
      PrimaryFeedId: editComment?.feedDetail
        ? editComment?.feedDetail?.primaryFeedId
        : replyComment
        ? replyComment.primaryFeedId
        : props.post.primaryFeedId,
    };

    const deletedImages = editComment?.feedDetail?.postImageLocation?.filter(
      url => !mediaList.some(item => item.uri === url),
    );

    const extraPayload = {
      //postID: replyComment ? replyComment.postDetailID : '',
      postID: '',
      imageList: [],
      deletedImageIds: deletedImages
        ? editComment?.feedDetail?.postImageLocationIDs
        : [],
      postType: props.moduleType == 'feed' ? 1 : 2,
    };

    if (mediaList.length > 0) {
      handleMediaList(mediaList);
    } else {
      createorEditcomment.mutate({
        createOrEditPostDetailDto: payloadDto,
        ...extraPayload,
      });
    }
  };

  const handleProfileClick = (userID?: number) => {
    props.setShown(false);
    navigation.navigate('MemberProfile', {
      userId: userID,
    });
  };

  const handleLikeList = (postId?: string) => {
    props.setShown(false);
    navigation.navigate('GroupMembers', {
      postId: postId,
      type: GroupMembersScreenParent.like,
    });
  };

  // *** We pass handleLikeUnified to CommentItem for both comments and replies. ***
  const renderCommentItem = (item: GetAllCommentsModel) => {
    const parentComment = postCommentList?.find(
      comment =>
        comment.postDetailID === editComment?.feedDetail?.mainCommentId,
    );

    const matchingReply = parentComment?.allCommentsReplies?.find(
      reply => reply?.postDetailID === editComment?.feedDetail?.id,
    );

    const shouldShowLoading =
      editCommentLoading && editComment && matchingReply != undefined;

    return (
      <CommentItem
        item={item}
        type={CommentType.comment}
        openLinks={openInAppBrowser}
        navigation={navigation}
        likeClick={() =>
          handleCommentLike({ commentItem: item, like: true, callApi: true })
        }
        likeListClick={handleLikeList}
        onLongPress={from => {
          props.setShown(false);
          props.handleCommentOption?.(item, from);
          if (from == 'edit') {
            Log('itemShivang---->' + JSON.stringify(item));
            Log('FROMVALUE--->' + from);
            props.setEditCommentId?.({ ...item });
            setComment('');
            setReplyComment(undefined);
            setEditingComment({
              ...item,
              detailHTML: item?.detailHTML
                ? reverseFormatMentions(
                    item?.detailHTML
                      ?.replace(/<[^>]*>/g, '')
                      .replace(/&[a-zA-Z#0-9]+;/g, ' ')
                      .replace('&nbsp', ' ')
                      .trim(),
                    userTeamListForTagMaster,
                  )
                : '',
            });
          }
          Log('EDITING COMMENT=>' + item?.postDetailID);

          Log('commentid=>' + item?.postDetailID);
        }}
        onLongPressReply={(value, from) => {
          // Reply Edit click
          if (from === 'edit') {
            props.setEditCommentId?.({ ...value });

            setReplyComment(undefined); // important: reply mode off

            // show "Editing ..." header using same state
            setEditingComment({
              ...value,
              detailHTML: value?.detailHTML
                ? reverseFormatMentions(
                    value?.detailHTML
                      ?.replace(/<[^>]*>/g, '')
                      .replace(/&[a-zA-Z#0-9]+;/g, ' ')
                      .replace('&nbsp', ' ')
                      .trim(),
                    userTeamListForTagMaster,
                  )
                : '',
            });

            // input focus (optional but feels correct)
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 150);

            return;
          }

          // ✅ other options (delete/report etc) keep same behavior
          props.setShown(false);
          props.handleCommentOption?.(value, from);
        }}
        handleProfileClick={handleProfileClick}
        handleImageClick={value => {
          props.setShown(false);
          if (value.images) {
            props.handleImagePopup?.({
              imageList: value.images,
              defaultIndex: value.index,
            });
          } else {
            props.handleImagePopup?.({ iframe: value.iframe });
          }
        }}
        handleReplyClick={reply => {
          if (reply?.isCommentingAvailable) {
            setEditingComment(undefined);
            handleBackPress();
            setReplyComment(reply);
            textInputRef.current?.focus();
          } else {
            // handleMsgShow(t('CommentingDisabled'), 'danger');
          }
        }}
        loading={
          item.postDetailID == props.deleteCommentId?.postDetailID ||
          (editCommentLoading &&
            item.postDetailID == editComment?.feedDetail?.id)
        }
        selectedItem={selectedComment}
        setSelectedComment={setSelectedComment}
        //replyLoading={shouldShowLoading}
        setShown={props.setShown}
      />
    );
  };

  const renderImageItem = (item: Asset, index: number) => {
    return (
      <Tap
        onPress={() => {
          const imageUris = mediaList.map(i => i.uri!);
          props.handleImagePopup?.({
            imageList: imageUris,
            defaultIndex: index,
          });
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
              setMediaList([]);
              props.setImageList?.([]);
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
  const loadMoreComments = () => {
    if (hasMoreData && !apiLoading) {
      callGetAllCommentsApi(page + 1);
    }
  };

  const callGetAllCommentsApi = (pageNumber: number, postDetailID?: string) => {
    setPage(pageNumber);
    getAllCommentsApi.mutate({
      apiPayload: {
        postID: postDetailID ? postDetailID : props.post.postDetailID,
        PageNumber: pageNumber,
      },
    });
  };

  const getPostDetailsForEdit = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      refreshPost?: boolean;
      editComment?: boolean;
      notificationComment?: boolean;
    }) => {
      return makeRequest<GetPostDetailsForEditModel>({
        endpoint: ApiConstants.GetFeedDetailForEdit,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setApiLoading(true);
      if (variables.editComment) {
        setEditLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      if (variables.editComment) {
        setEditLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        textInputRef.current?.setHtml(''); // removing the previous data
        var commentDetail = data.result;

        // For edit mode: compute clean HTML for the text input
        // (strip link preview cards, embedded iframes, and no See More/Less button)
        let editInputHtml: string | undefined;
        if (variables.editComment) {
          const rawEditHtml =
            reverseFormatMentions(
              commentDetail?.feedDetail?.detailHTML ?? '',
              userTeamListForTagMaster,
            ) ||
            reverseFormatMentions(
              commentDetail?.feedDetail?.detail ?? '',
              userTeamListForTagMaster,
            );
          const { cleanHtml: noPreviewHtml } = extractLinkPreviewHtml(
            rawEditHtml ?? '',
          );
          // Keep iframes in the edit input so users can see and re-submit embedded content
          editInputHtml = noPreviewHtml;
        }

        const rawDetailHtml = variables.editComment
          ? reverseFormatMentions(
              commentDetail?.feedDetail?.detailHTML ?? '',
              userTeamListForTagMaster,
            ) ||
            reverseFormatMentions(
              commentDetail?.feedDetail?.detail ?? '',
              userTeamListForTagMaster,
            )
          : commentDetail?.feedDetail?.detailHTML!;
        const { cleanHtml: cleanDetailHtml, linkPreviewHtml: detailLinkPreviewHtml } =
          extractLinkPreviewHtml(rawDetailHtml ?? '');
        const updatedHtml = processHtmlContent({
          html: cleanDetailHtml,
          maxWords: 50,
          linkColor: theme.colors.links,
          showMore: true,
        });

        commentDetail = {
          ...data.result,
          feedDetail: {
            ...data.result.feedDetail,
            detailHTML: updatedHtml?.Content!,
            viewType: props.editCommentId?.viewType,
            mainCommentId: props.editCommentId?.mainCommentId,
            pageNo: props.editCommentId?.pageNo,
          },
        };
        setEditComment(commentDetail);

        if (!variables.refreshPost) {
          textInputRef.current?.insertHtml(
            variables.editComment
              ? (editInputHtml ?? '')
              : commentDetail.feedDetail?.detailHTML!,
          ); //inserting because of cursor issue
          if (variables.editComment) {
            setComment(editInputHtml ?? '');
            textInputRef.current?.focus();
          }
          if (commentDetail?.feedDetail?.postImageLocation) {
            if (!variables.editComment) {
              setComment(
                updatedHtml?.Content
                  ? reverseFormatMentions(
                      updatedHtml.Content,
                      userTeamListForTagMaster,
                    )
                  : '',
              );
              textInputRef.current?.focus();
            }
            setMediaList(
              commentDetail?.feedDetail?.postImageLocation?.map(url => {
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
              }),
            );
          }
        } else {
          if (commentDetail?.feedDetail?.viewType == CommentType.comment) {
            setPostCommentList(prev =>
              prev?.map(item => {
                if (item.postDetailID == commentDetail.feedDetail?.id) {
                  return {
                    ...item,
                    feedReplyID: commentDetail?.feedDetail?.feedReplyID,
                    postDetailID: commentDetail?.feedDetail?.id,
                    detail: stripPreviewUrlFromHtml(updatedHtml?.Content, detailLinkPreviewHtml),
                    detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, detailLinkPreviewHtml),
                    shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, detailLinkPreviewHtml),
                    iFrameList: updatedHtml?.iFrameList,
                    likeCount: commentDetail?.feedDetail?.likeCount,
                    commentCount: commentDetail?.feedDetail?.commentCount,
                    postImageLocation:
                      commentDetail?.feedDetail?.postImageLocation,
                    postImageLocationIDs:
                      commentDetail?.feedDetail?.postImageLocationIDs,
                    primaryFeedId: commentDetail?.feedDetail?.primaryFeedId,
                  };
                } else {
                  return item;
                }
              }),
            );
          } else {
            setPostCommentList(prev =>
              prev?.map(item => {
                if (
                  item.postDetailID == commentDetail?.feedDetail?.mainCommentId
                ) {
                  return {
                    ...item,
                    allCommentsReplies: item.allCommentsReplies?.map(reply => {
                      if (reply.postDetailID == commentDetail?.feedDetail?.id) {
                        const updatedReply = {
                          ...reply,
                          detail: stripPreviewUrlFromHtml(updatedHtml?.Content, detailLinkPreviewHtml),
                          detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, detailLinkPreviewHtml),
                          shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, detailLinkPreviewHtml),
                          iFrameList: updatedHtml?.iFrameList,
                          postImageLocation:
                            commentDetail?.feedDetail?.postImageLocation,
                          postImageLocationIDs:
                            commentDetail?.feedDetail?.postImageLocationIDs,
                        };
                        return updatedReply;
                      } else {
                        return reply;
                      }
                    }),
                  };
                } else {
                  return item;
                }
              }),
            );
          }
          props.setEditCommentId?.(undefined);
          setEditCommentLoading(false);
          setEditComment(undefined);
          setEditingComment(undefined);
          handleMsgShow(t('ReplyEdited'), 'success');
        }
      }
    },
    onError(error, variables, context) {
      setLoading(false);
    },
  });

  // for getting a particular data for the api
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
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result.length > 0) {
        setPostCommentList(prev => {
          return [data.result?.at(0) as GetAllCommentsModel, ...(prev || [])];
        });
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  // --- Like API call (existing) ---
  const likeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.LikeComment,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      // tell the Feed to re-fetch this post’s comments
      props.commentCountUpdate?.();
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      handleCommentLike({
        commentItem: variables.commentItem,
        like: true,
      });
    },
  });
  // --- End Like API call ---

  const deletePostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.DeletePost,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onSettled(data, error, variables, context) {
      props.setDeleteCommentId?.(undefined);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result) {
        handleMsgShow(
          props.deleteCommentId?.viewType == CommentType.comment
            ? t('CommentDeleted')
            : t('ReplyDeleted'),
          'success',
        );
        props.setDeleteCommentId?.(undefined);
        props.commentCountUpdate?.();
        if (props.deleteCommentId?.viewType == CommentType.comment) {
          setPostCommentList(
            postCommentList?.filter(
              item => item.postDetailID != props.deleteCommentId?.postDetailID,
            ),
          );
        } else {
          setPostCommentList(
            postCommentList?.map(item => ({
              ...item,
              allCommentsReplies: item.allCommentsReplies?.filter(
                item =>
                  item.postDetailID != props.deleteCommentId?.postDetailID,
              ),
            })),
          );
        }
      }
    },
    onError(error, variables, context) {
      props.showError?.(error.message);
    },
  });

  const getAllCommentsApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      reply?: GetAllCommentsModel;
      editComment?: GetAllCommentsModel;
    }) => {
      return makeRequest<GetAllCommentsModel[]>({
        endpoint: ApiConstants.GetAllComments,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      });
    },
    onMutate(variables) {
      setApiLoading(true);
      // if this api gets called from add or edit comment api then don't show any skeleton
      // or load more
      if (addCommentLoading || editCommentLoading) {
        return;
      }
      if (variables.apiPayload.PageNumber === 1) {
        setLoading(true);
      }
    },
    onSettled(_, __, variables) {
      setApiLoading(false);
      // if this api gets called from add or edit comment api then don't show any skeleton
      // or load more
      if (addCommentLoading || editCommentLoading) {
        return;
      }
      if (variables.apiPayload.PageNumber === 1) {
        setTimeout(() => {
          setLoading(false);
          if (props.fromNotificationItem && fromNotificationRef.current) {
            /**  this condition of because if we are coming from notification if the same notification is 
              not on list than there will be another api which will be called but if the loading gets
              false the data will be shown after that second api the renderes again -- @Yuvraj
            */
            setLoading(true);
          }
        }, 1000);
      }
    },
    onSuccess(data, variables) {
      if (data?.result && data?.result.length > 0) {
        const commentListLatest: GetAllCommentsModel[] = data.result.map(
          item =>
            ({
              ...item,
              pageNo: variables.apiPayload.PageNumber,
              viewType: variables.reply
                ? CommentType.ncomment
                : CommentType.comment,
            } as GetAllCommentsModel),
        );

        if (props.fromNotificationItem && fromNotificationRef.current) {
          fromNotificationRef.current = false;
          setSelectedComment(props.fromNotificationItem.commentId);
          const fromNotificationTempItem = commentListLatest.filter(
            (item, index) => {
              return (
                item.postDetailID?.toLowerCase() ==
                props.fromNotificationItem?.commentId?.toLowerCase()
              );
            },
          );
          if (fromNotificationTempItem.length > 0) {
            commentListLatest.unshift(...fromNotificationTempItem);
            setLoading(false);
          } else {
            getPostByIdApi.mutate({
              apiPayload: {
                PostId: props.fromNotificationItem?.commentId,
              },
            });
            // getcommentbyid
            // getPostDetailsForEdit.mutate({
            //   apiPayload: {Id: props.fromNotificationItem?.commentId},
            //   notificationComment: true,
            // });
          }
        }

        if (!variables.reply && !variables.editComment) {
          if (commentListLatest.at(commentListLatest.length - 1)?.hasNextFlag) {
            setHasMoreData(true);
          } else {
            setHasMoreData(false);
          }
        }

        // if this api gets called from add or edit comment api then compare list
        // with previously fetched list and only change the edited or added item
        if (addCommentLoading || editCommentLoading) {
          // compare with previous list based on PostID and change the updated comments
          if (variables.editComment) {
            Log('In the variables.editComment');
            if (variables.editComment.viewType == CommentType.comment) {
              const newList = updateArrayWithChanges({
                targetArray: postCommentList!,
                sourceArray: setHtmlContent(
                  commentListLatest,
                  variables.apiPayload.PageNumber == 1,
                ),
                key: 'postDetailID',
                addOnTop: true,
              });
              setPostCommentList(newList);
            } else {
              const oldComment = postCommentList?.find(
                item => item.postDetailID == variables.apiPayload.postID,
              );

              if (oldComment) {
                var newList: GetAllCommentsModel[] = [];
                if (
                  oldComment.allCommentsReplies &&
                  oldComment.allCommentsReplies.length > 0
                ) {
                  newList = updateArrayWithChanges({
                    targetArray: oldComment.allCommentsReplies,
                    sourceArray: setHtmlContentForReplies(commentListLatest),
                    key: 'postDetailID',
                    addOnTop: true,
                  });
                } else {
                  const firstReply = commentListLatest?.at(0);

                  const { cleanHtml: cleanFirstReplyHtml, linkPreviewHtml: firstReplyLinkPreviewHtml } =
                    extractLinkPreviewHtml(firstReply?.detailHTML ?? firstReply?.detail ?? '');
                  const { cleanHtml: cleanFirstReplyHtmlNoIframes, embeddedIframeHtml: firstReplyEmbeddedIframeHtml } =
                    extractEmbeddedIframes(cleanFirstReplyHtml);
                  const updatedHtml = processHtmlContent({
                    html: cleanFirstReplyHtmlNoIframes,
                  });

                  if (updatedHtml) {
                    newList = [
                      {
                        ...firstReply,
                        detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, firstReplyLinkPreviewHtml),
                        shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, firstReplyLinkPreviewHtml),
                        iFrameList: updatedHtml?.iFrameList,
                        linkPreviewHtml: firstReplyLinkPreviewHtml,
                        embeddedIframeHtml: firstReplyEmbeddedIframeHtml,
                      },
                    ];
                  }
                }

                setPostCommentList(prev =>
                  prev?.map(item =>
                    item.postDetailID == variables.apiPayload.postID
                      ? {
                          ...item,
                          showAllReplies: true,
                          allCommentsReplies: newList.map(item => ({
                            ...item,
                            mainCommentId: variables.apiPayload.postID,
                          })),
                        }
                      : {
                          ...item,
                        },
                  ),
                );
              }
              props.setEditCommentId?.(undefined);
              handleMsgShow(t('ReplyEdited'), 'success');
            }
          } else if (variables.reply) {
            Log('In the variables.reply');

            const oldComment = postCommentList?.find(
              item => item.postDetailID == variables.apiPayload.postID,
            );

            if (oldComment) {
              var newList: GetAllCommentsModel[] = [];
              if (
                oldComment.allCommentsReplies &&
                oldComment.allCommentsReplies.length > 0
              ) {
                newList = updateArrayWithChanges({
                  targetArray: oldComment.allCommentsReplies,
                  sourceArray: setHtmlContentForReplies(commentListLatest),
                  key: 'postDetailID',
                  addOnTop: true,
                });
              } else {
                const firstReply = commentListLatest?.at(0);

                const { cleanHtml: cleanFallbackReplyHtml, linkPreviewHtml: fallbackReplyLinkPreviewHtml } =
                  extractLinkPreviewHtml(firstReply?.detailHTML ?? firstReply?.detail ?? '');
                const { cleanHtml: cleanFallbackReplyHtmlNoIframes, embeddedIframeHtml: fallbackReplyEmbeddedIframeHtml } =
                  extractEmbeddedIframes(cleanFallbackReplyHtml);
                const updatedHtml = processHtmlContent({
                  html: cleanFallbackReplyHtmlNoIframes,
                });

                if (updatedHtml) {
                  newList = [
                    {
                      ...firstReply,
                      detailHTML: stripPreviewUrlFromHtml(updatedHtml?.Content, fallbackReplyLinkPreviewHtml),
                      shortContent: stripPreviewUrlFromHtml(updatedHtml?.shortContent, fallbackReplyLinkPreviewHtml),
                      iFrameList: updatedHtml?.iFrameList,
                      linkPreviewHtml: fallbackReplyLinkPreviewHtml,
                      embeddedIframeHtml: fallbackReplyEmbeddedIframeHtml,
                    },
                  ];
                }
              }
              setPostCommentList(prev =>
                prev?.map(item =>
                  item.postDetailID == variables.apiPayload.postID
                    ? {
                        ...item,
                        showAllReplies: true,
                        allCommentsReplies: newList.map(
                          reply =>
                            ({
                              ...reply,
                              mainCommentId: variables.apiPayload.postID,
                            } as GetAllCommentsModel),
                        ),
                      }
                    : {
                        ...item,
                      },
                ),
              );
            }
            setReplyComment(undefined);
            handleMsgShow(t('ReplyAdded'), 'success');
          } else {
            Log('In the variables.else');
            const newList = updateArrayWithChanges({
              targetArray: postCommentList!,
              sourceArray: setHtmlContent(
                commentListLatest,
                variables.apiPayload.PageNumber == 1,
              ),
              key: 'postDetailID',
              addOnTop: true,
            });
            setPostCommentList(newList);
          }

          if (addCommentLoading || editCommentLoading) {
            if (addCommentLoading) {
              // flatListRef.current?.scrollToIndex({
              //   index: commentList.length - 1,
              // });
              setAddCommentLoading(false);
              handleMsgShow(t('CommentAdded'), 'success');
            }
            if (editCommentLoading) {
              setEditCommentLoading(false);
            }
          }
        } else {
          // formatting html content and then set the list
          setPostCommentList(
            setHtmlContent(
              commentListLatest,
              variables.apiPayload.PageNumber == 1,
            ),
          );
        }
      } else {
        setHasMoreData(false);
        if (variables.apiPayload.PageNumber === 1) {
          setPostCommentList([]);
        }
      }
    },
    onError(error, variables, context) {
      setHasMoreData(false);
      if (variables.apiPayload.PageNumber === 1) {
        setPostCommentList([]);
      }
    },
  });

  const createorEditcomment = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.CreateorEditcomment,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      if (addCommentLoading || editCommentLoading) {
        return;
      }
      if (props.editCommentId || editingComment) {
        setEditCommentLoading(true);
      } else {
        setAddCommentLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (error) {
        if (editComment) {
          //props.setEditCommentId?.(undefined);
          setEditCommentLoading(false);
        } else {
          setAddCommentLoading(false);
        }
      }
    },
    onSuccess(data) {
      if (data?.success) {
        textInputRef.current?.setHtml(''); //emptying the data
        setComment('');
        setMediaList([]);
        props.setImageList?.([]);

        props.commentCountUpdate?.();

        refreshCommentList();
        handlePreviewCard();
      }
    },
    onError(error, variables, context) {
      handleMsgShow(error.message, 'danger');
    },
  });

  // for getting a particular data for the api
  const getUserTeamListForTagApi = useMutation({
    mutationFn: (sendData: { apiPayload: Record<string, any> }) => {
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
      if (data?.result && data?.result.length > 0) {
        const newData: GetUserTeamListForTagModel[] = [...data.result];
        setUserTeamListForTag(newData);
        setUserTeamListForTagMaster(newData);
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
      if (data?.result && data?.result.length > 0) {
        const newData: GetUserTeamListForTagModel[] = [...data.result];
        setUserTeamListForTag(newData);
        setUserTeamListForTagMaster(newData);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  const MAX_LINES = 6;

  // must match HTML editor CSS:
  // font-size: 16px; line-height: 20px; padding: 10px;
  const LINE_HEIGHT = 20;
  const PADDING_VERTICAL = 0;

  const MIN_HEIGHT = 40;
  const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT + PADDING_VERTICAL;

  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT);

  const onContentSizeChange = (e: any) => {
    const h = e?.nativeEvent?.contentSize?.height ?? MIN_HEIGHT;

    const clamped = Math.max(MIN_HEIGHT, Math.min(h, MAX_HEIGHT));
    setEditorHeight(clamped);
  };

  return (
    <CustomBottomPopup
      shown={props.shown}
      setShown={props.setShown}
      title="Comments"
      onClose={handleBackPress}
      dismissOnBackPress={true}
      dismissOnClosePress={true}
      keyboardHandle={true}
    >
      <View style={styles.container}>
        {loading ? (
          <SkeletonList
            count={5}
            children={
              <View style={styles.skeletonLay}>
                <View style={styles.skeletonHeader}>
                  <View style={styles.skeletonProfilePic} />
                  <View style={styles.skeletonTitleLay}>
                    <View style={styles.skeletonHeading} />
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSubtitle} />
                  </View>
                  <View style={styles.skeletonOptionsItem4} />
                </View>
              </View>
            }
          />
        ) : (
          <View style={{ flex: 1, height: 350 }}>
            {postCommentList ? (
              <CustomFlatList
                extraData={[
                  props.deleteCommentId,
                  editCommentLoading,
                  editComment,
                ]}
                data={postCommentList!}
                keyExtractor={item => item?.postDetailID?.toString()!}
                refreshing={loading}
                onRefresh={() => callGetAllCommentsApi(1)}
                keyboardShouldPersistTaps={keyboardShouldPersistTapsType.always}
                onEndReachedThreshold={0.4}
                onEndReached={loadMoreComments}
                ListFooterComponent={
                  hasMoreData && postCommentList?.length! > 0 ? (
                    <LoadMore />
                  ) : (
                    <></>
                  )
                }
                ListEmptyComponent={<EmptyView label={t('NoComments')} />}
                renderItem={({ item, index }) => renderCommentItem(item)}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {showMsg && (
              <View
                style={
                  showMsg?.type == 'success'
                    ? styles.msgSuccess
                    : styles.msgDanger
                }
              >
                <CustomText
                  color={
                    showMsg?.type == 'success'
                      ? theme.colors.surface
                      : theme.colors.onErrorContainer
                  }
                >
                  {showMsg?.msg}
                </CustomText>
              </View>
            )}
            {!props.post.isCommentingAvailable &&
              !editingComment &&
              !showMsg && (
                <View style={styles.msgDanger}>
                  <CustomText color={theme.colors.onErrorContainer}>
                    {t('CommentingDisabled')}
                  </CustomText>
                </View>
              )}

            {(props.post.isCommentingAvailable || editingComment) && (
              <View>
                {replyComment && (
                  <View style={styles.replyToLay}>
                    <View style={styles.replyTo}>
                      <CustomText>{`${t('ReplyingTo')}`}</CustomText>
                      <CustomText
                        variant={TextVariants.labelLarge}
                      >{`@${replyComment?.userName}`}</CustomText>
                    </View>
                    <Tap
                      onPress={() => {
                        setComment('');
                        setReplyComment(undefined);
                      }}
                      style={styles.cameraLay}
                    >
                      <CustomImage
                        source={Images.close}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.camera}
                      />
                    </Tap>
                  </View>
                )}
                {editingComment && (
                  <View style={styles.replyToLay}>
                    <View style={styles.replyTo}>
                      <CustomText
                        color={theme.colors.primary}
                        variant={TextVariants.labelLarge}
                      >{`${editingComment?.userName}`}</CustomText>
                      <CustomText
                        color={theme.colors.outline}
                        variant={TextVariants.labelLarge}
                      >{`${t('Editing')}`}</CustomText>
                      <CustomText variant={TextVariants.labelLarge}>
                        {editingComment?.detailHTML?.length! > 5
                          ? `${editingComment?.detailHTML?.slice(0, 5)}...`
                          : editingComment.detailHTML}
                      </CustomText>
                    </View>
                    <Tap
                      onPress={() => {
                        // props.setEditCommentId?.(undefined);
                        // setEditingComment(undefined);
                        // setComment('');
                        // setMediaList([]);
                        // props.setImageList?.([]);
                        // textInputRef.current?.setContentHTML('');

                        //  clear editing mode completely
                        setEditingComment(undefined);
                        setEditComment(undefined);
                        setEditLoading(false); // safe reset
                        setEditCommentLoading(false); // safe reset
                        setAddCommentLoading(false);
                        // clear reply mode too (avoid collision)
                        setReplyComment(undefined);
                        props.setEditCommentId?.(undefined);
                        // clear input
                        setComment('');
                        setMediaList([]);
                        props.setImageList?.([]);
                        textInputRef.current?.setHtml('');
                      }}
                      style={styles.cameraLay}
                    >
                      <CustomImage
                        source={Images.close}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.camera}
                      />
                    </Tap>
                  </View>
                )}
                {mediaList && mediaList.length > 0 && (
                  <View style={styles.uploadedImageList}>
                    <CustomFlatList
                      data={mediaList}
                      horizontal
                      keyExtractor={item => item.fileName?.toString()!}
                      renderItem={({ item, index }) =>
                        renderImageItem(item, index)
                      }
                    />
                  </View>
                )}

                <View
                  style={[styles.writeCommentLay, { minHeight: editorHeight }]}
                >
                  <Tap
                    onPress={() => {
                      if (!addCommentLoading && mediaList.length == 0) {
                        props.setShown(false);
                        setTimeout(() => {
                          props.openImagePicker?.();
                        }, 100);
                      }
                    }}
                    style={styles.cameraLay}
                  >
                    <CustomImage
                      source={Images.addCircle}
                      type={ImageType.svg}
                      color={
                        mediaList && mediaList.length > 0
                          ? theme.colors.surfaceDisabled
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.camera}
                    />
                  </Tap>

                  <View style={styles.mentionContainer}>
                    {editLoading && (
                      <View style={styles.editLoader}>
                        <ActivityIndicator />
                      </View>
                    )}
                    <MentionTextInput
                      inputRef={textInputRef}
                      text={comment}
                      onChangeText={value => {
                        setComment(value);
                      }}
                      onLinkPreviewChange={data => {
                        setIsPreviewVisible(!!data);
                      }}
                      showLinkPreviewOutside
                      placeholder={editLoading ? '' : 'Write Comment'}
                      nameKey={'fullName'}
                      idKey={'id'}
                      list={userTeamListForTag}
                      hideSuggestions={hideSuggestions}
                      allowBackPress={setAllowBackPress}
                      textAlign={InputTextAlignVertical.top}
                      showSuggestionOutside={true}
                      noTaggableUsersLeft={noTaggableUsersLeft}
                      resetPreview={resetPreviewKey}
                      contentStyle={styles.writeComment}
                      style={styles.commentContainer}
                      onContentSizeChange={onContentSizeChange}
                      extraPreviewHeight={20}
                      showErrorMsg={value => handleMsgShow(value, 'danger')}
                      hidePreview={false}
                    />

                    <Tap
                      onPress={() => {
                        setHideSuggestions(t => t + 1);

                        !addCommentLoading &&
                          !editCommentLoading &&
                          handleAddComment();
                      }}
                      style={styles.sendIconTap}
                    >
                      <View style={styles.sendIconLay}>
                        {addCommentLoading || editCommentLoading ? (
                          <ActivityIndicator color={theme.colors.onPrimary} />
                        ) : (
                          <CustomImage
                            source={Images.send}
                            type={ImageType.svg}
                            color={theme.colors.surface}
                            style={styles.send}
                          />
                        )}
                      </View>
                    </Tap>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </CustomBottomPopup>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      //height: 300,
    },
    commentItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    commentHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    commentMainSection: {
      flex: 1,
      marginLeft: 10,
    },
    commentLikeSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    likeButton: {
      marginRight: 4,
    },
    userRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    userName: {
      fontWeight: '600',
      marginRight: 6,
    },
    commentBody: {
      marginTop: 0,
    },
    replyButton: {
      marginTop: 4,
    },
    replyText: {
      fontSize: 13,
      color: '#666',
      fontWeight: 'bold',
    },
    actionIcon: {
      width: 18,
      height: 18,
    },
    likeCountText: {
      fontSize: 12,
      color: '#555',
    },
    replyContainer: {
      marginTop: 0,
      paddingLeft: 40,
      borderLeftWidth: 2,
      borderLeftColor: '#ddd',
    },
    writeCommentLay: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingTop: 8,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    uploadedImageList: {
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 10,
    },
    cameraLay: {
      paddingVertical: 4,
      left: 5,
      justifyContent: 'flex-end',
      alignSelf: 'flex-end',
    },
    camera: {
      width: 30,
      height: 30,
    },
    editLoader: {
      position: 'absolute',
      left: 10,
      top: 5,
      bottom: 5,
      zIndex: 10,
    },
    sendIconTap: {
      position: 'absolute',
      bottom: 0,
      right: 3,
      top: 0,
      justifyContent: 'flex-end',
      alignContent: 'flex-end',
    },
    sendIconLay: {
      height: 30,
      width: 30,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-end',
    },
    send: {
      width: 18,
      height: 18,
    },
    selectedImgTap: {
      height: 80,
      width: 80,
      borderRadius: 10,
      marginRight: 5,
    },
    selectedImg: {
      height: '100%',
      width: '100%',
      borderRadius: 10,
    },
    selectedImgDeleteTap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.error || '#ff0000',
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      alignItems: 'center',
      padding: 3,
    },
    selectedImgDelete: {
      height: 10,
      width: 10,
    },
    profilePic: { padding: 0 },
    like: {
      height: 20,
      width: 20,
    },
    replyToLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      backgroundColor: theme.colors.border,
      paddingHorizontal: 10,
    },
    replyTo: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: 5,
      alignItems: 'center',
    },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginTop: 10,
    },
    skeletonHeader: { flexDirection: 'row' },
    skeletonProfilePic: {
      borderRadius: 50,
      height: 50,
      width: 50,
      backgroundColor: theme.colors.surface,
    },
    skeletonTitleLay: { flex: 1, marginLeft: 10 },
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '60%',
      height: 15,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonSubtitle: {
      backgroundColor: theme.colors.surface,
      width: '25%',
      height: 10,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonOptionsItem4: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '5%',
      height: 12,
      marginTop: 5,
      marginRight: 10,
    },
    msgSuccess: {
      backgroundColor: theme.colors.completed,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    msgDanger: {
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 15,
      paddingTop: 10,
      alignItems: 'center',
      paddingBottom: 15,
    },
    mentionContainer: {
      flex: 1,
    },
    commentContainer: {
      flex: 1,
      width: '95%',
    },
    writeComment: {
      textAlignVertical: 'center',
      paddingRight: 30,
      flex: 1,
    },
  });

export default CommentPopup;
