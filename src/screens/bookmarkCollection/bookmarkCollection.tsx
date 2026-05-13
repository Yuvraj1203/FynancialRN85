import { CustomImage, CustomText, SkeletonList, Tap } from '@/components/atoms';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomBottomPopup,
  CustomHeader,
  CustomImagePicker,
  EmptyView,
} from '@/components/molecules';
import { CommentPopup, SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showBookmarkPopup } from '@/components/template/bookmarkPopup/bookmarkPopup';
import { CommentType } from '@/components/template/commentItem/commentItem';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import PostItem, { PostType } from '@/components/template/postItem/postItem';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  CommentsReplies,
  GetAllCommentsModel,
  GetFeedPostModel,
} from '@/services/models';
import {
  BookmarkReturnProp,
  BookmarkedFeedIdDto,
  BookmarkedPostsResponse,
  UserCollectionDto,
} from '@/services/models/bookmarkModel/bookmarkModel';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import {
  extractEmbeddedIframes,
  extractLinkPreviewHtml,
  processHtmlContent,
  showSnackbar,
  stripPreviewUrlFromHtml,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Asset } from 'react-native-image-picker';
import { Checkbox, Divider } from 'react-native-paper';
import { GroupMembersScreenParent } from '../groupMembers/groupMembers';

export type BookmarkCollectionScreenProps = {
  collectionId?: string | null;
  collectionName: string;
  sessionId?: string;
  groupId?: string;
};

function BookmarkCollectionScreen() {
  const navigation = useAppNavigation();
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const openInAppBrowser = useCustomInAppBrowser();

  const route = useAppRoute('BookmarkCollection');
  const { sendDataBack, receiveDataBack } = useReturnDataContext();

  const { collectionId, collectionName, sessionId, groupId } =
    route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [feedList, setFeedList] = useState<GetFeedPostModel[]>([]);
  const [bookmarkMap, setBookmarkMap] = useState<
    Record<string, BookmarkedFeedIdDto>
  >({});

  const [selectedPost, setSelectedPost] = useState<GetFeedPostModel>();
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<GetAllCommentsModel>();
  const [editCommentId, setEditCommentId] = useState<GetAllCommentsModel>();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaList, setMediaList] = useState<Asset[]>([]);

  const [actionPost, setActionPost] = useState<GetFeedPostModel | null>(null);
  const [showPostActions, setShowPostActions] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([]);

  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [pickerCollections, setPickerCollections] = useState<
    UserCollectionDto[]
  >([]);

  const loadCollectionRef = useRef<any>(null);

  receiveDataBack('BookmarkCollection', (data: BookmarkReturnProp) => {
    if (data.refreshRequired && loadCollectionRef.current) {
      loadCollectionRef.current.mutate({
        collectionId: collectionId ?? undefined,
        sessionId,
        groupId,
      });
    }
  });

  const loadCollection = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<BookmarkedPostsResponse>({
        endpoint: ApiConstants.GetBookmarkedPostsForView,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate: () => setLoading(true),
    onSettled: () => setLoading(false),
    onSuccess(data, variables, context) {
      const items = Array.isArray(data?.result?.items) ? data.result.items : [];
      if (items.length === 0) {
        setFeedList([]);
        setBookmarkMap({});
        return;
      }

      const bMap: Record<string, BookmarkedFeedIdDto> = {};
      items.forEach(item => {
        if (item.postDetailID && item.bookmarkId) {
          bMap[item.postDetailID] = {
            bookmarkId: item.bookmarkId,
            feedDetailId: item.postDetailID,
            collectionId: item.collectionId ?? collectionId ?? null,
          };
        }
      });
      setBookmarkMap(bMap);
      const processed = processPostsHtml(items);
      setFeedList(processed);
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  useEffect(() => {
    loadCollectionRef.current = loadCollection;
    loadCollection.mutate({
      collectionId: collectionId ?? undefined,
      sessionId,
      groupId,
    });
  }, []);

  const likeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) =>
      makeRequest<number>({
        endpoint: sendData.postLike
          ? ApiConstants.LikePost
          : ApiConstants.LikeComment,
        method: HttpMethodApi.Post,
        data: sendData,
      }),
    onError(error, variables) {
      showSnackbar(error.message, 'danger');
      if (variables.postLike) {
        updateLocalLike({
          type: 'post',
          postID: variables.PostId,
          like: variables.PostId ? true : false,
        });
      } else {
        updateLocalLike({
          type: 'comment',
          commentItem: variables.commentItem,
          like: true,
        });
      }
    },
  });

  const updateLocalLike = ({
    type,
    postID,
    commentItem,
    like,
    callApi = false,
  }: {
    type: 'post' | 'comment';
    postID?: string;
    commentItem?: CommentsReplies;
    like?: boolean;
    callApi?: boolean;
  }) => {
    if (type === 'post') {
      let isLikeClick: boolean | undefined = false;
      setFeedList(prev =>
        prev.map(p => {
          if (p.postDetailID !== postID) return p;
          const likeCount = like
            ? p.likedByUser
              ? Math.max((p.likeCount || 0) - 1, 0)
              : (p.likeCount || 0) + 1
            : p.likeCount;
          isLikeClick = like ? !p.likedByUser : p.likedByUser;
          return {
            ...p,
            likedByUser: like ? !p.likedByUser : p.likedByUser,
            likeCount,
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
      setFeedList(prev =>
        prev.map(p => {
          if (
            !p.commentsReplies?.some(c => c.commentID === commentItem.commentID)
          )
            return p;
          const updatedReplies = p.commentsReplies.map(c => {
            if (c.commentID !== commentItem.commentID) return c;
            const updatedLikeCount = like
              ? c.likedByUser
                ? Math.max((c.commentLikeCount || 0) - 1, 0)
                : (c.commentLikeCount || 0) + 1
              : c.commentLikeCount;
            isLikeClick = like ? !c.likedByUser : c.likedByUser;
            return {
              ...c,
              likedByUser: like ? !c.likedByUser : c.likedByUser,
              commentLikeCount: updatedLikeCount,
            };
          });
          return { ...p, commentsReplies: updatedReplies };
        }),
      );
      if (callApi) {
        likeApi.mutate({
          PostId: commentItem.commentID,
          IsLikeClick: isLikeClick,
          postLike: false,
          commentItem,
        });
      }
    }
  };

  const getPostByIdApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFeedPostModel[]>({
        endpoint: ApiConstants.GetPostById,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      const newPostData = data?.result?.at(0);
      if (!newPostData) return;
      const postId = variables.PostId as string;
      const processed = processPostsHtml([newPostData]);
      const normalizedPost = processed[0];
      setFeedList(prev =>
        prev.map(p => (p.postDetailID === postId ? normalizedPost : p)),
      );
      setSelectedPost(prev =>
        prev?.postDetailID === postId ? normalizedPost : prev,
      );
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const unsavePostApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.ToggleSaveFeed,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      const feedDetailId = variables.feedDetailId as string;
      setFeedList(prev => {
        const next = prev.filter(
          p => bookmarkMap[p.postDetailID ?? '']?.feedDetailId !== feedDetailId,
        );
        return next;
      });
      sendDataBack('Bookmarks', { refreshRequired: true });
      showSnackbar(t('BookmarkRemoved'), 'success');
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const bulkAssignApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.BulkAssignToCollection,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      exitSelectionMode();
      showSnackbar(t('BookmarksMoved'), 'success');
      loadCollection.mutate({
        collectionId: collectionId ?? undefined,
        sessionId,
        groupId,
      });
      sendDataBack('Bookmarks', { refreshRequired: true });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const bulkUnsaveApi = useMutation({
    mutationFn: (sendData: string) => {
      return makeRequest<null>({
        endpoint: ApiConstants.BulkUnsaveFeeds,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      const removedBmIds = new Set(selectedBookmarkIds);
      setFeedList(prev => {
        const next = prev.filter(p => {
          const bmId = bookmarkMap[p.postDetailID ?? '']?.bookmarkId;
          return bmId ? !removedBmIds.has(bmId) : true;
        });
        return next;
      });
      sendDataBack('Bookmarks', { refreshRequired: true });
      exitSelectionMode();
      showSnackbar(t('BookmarkRemoved'), 'success');
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedBookmarkIds([]);
  };

  const toggleSelect = (post: GetFeedPostModel) => {
    const bmId = post.postDetailID
      ? bookmarkMap[post.postDetailID]?.bookmarkId
      : undefined;
    if (!bmId) return;
    setSelectedBookmarkIds(prev =>
      prev.includes(bmId) ? prev.filter(id => id !== bmId) : [...prev, bmId],
    );
  };

  const isSelected = (post: GetFeedPostModel) => {
    const bmId = post.postDetailID
      ? bookmarkMap[post.postDetailID]?.bookmarkId
      : undefined;
    return bmId ? selectedBookmarkIds.includes(bmId) : false;
  };

  const isPostBookmarked = (post: GetFeedPostModel) =>
    !!post.postDetailID && !!bookmarkMap[post.postDetailID];

  const getBookmarkId = (post: GetFeedPostModel): string | undefined =>
    post.postDetailID ? bookmarkMap[post.postDetailID]?.bookmarkId : undefined;

  const getCollectionId = (post: GetFeedPostModel): string | null | undefined =>
    post.postDetailID
      ? bookmarkMap[post.postDetailID]?.collectionId
      : undefined;

  const fetchPickerCollectionsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserCollectionDto[]>({
        endpoint: ApiConstants.GetUserCollections,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setPickerCollections(data?.result ?? []);
    },
    onError(error, variables, context) {
      setPickerCollections([]);
    },
  });

  const processPostsHtml = (data: GetFeedPostModel[]): GetFeedPostModel[] =>
    data.map(post => {
      const updatedComments = post.commentsReplies?.map(reply => {
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
        detailHTML: stripPreviewUrlFromHtml(
          parsedPostHtml?.Content,
          linkPreviewHtml,
        ),
        shortContent: stripPreviewUrlFromHtml(
          parsedPostHtml?.shortContent,
          linkPreviewHtml,
        ),
        iFrameList: parsedPostHtml?.iFrameList,
        linkPreviewHtml,
        embeddedIframeHtml,
      };
    });

  const renderItem = (item: GetFeedPostModel) => {
    if (selectionMode) {
      return (
        <Tap
          disableRipple
          onPress={() => toggleSelect(item)}
          style={styles.selectionRow}
        >
          {/* Single View child — Tap requires React.Children.only */}
          <View style={styles.selectionRowInner}>
            <Checkbox.Android
              status={isSelected(item) ? 'checked' : 'unchecked'}
              color={theme.colors.primary}
              onPress={() => toggleSelect(item)}
            />
            <View style={styles.selectionPostWrap}>
              <PostItem
                item={item}
                type={PostType.feed}
                openLinks={openInAppBrowser}
                showMoreClick={() => {
                  setFeedList(prev =>
                    prev.map(p =>
                      p.postDetailID === item.postDetailID
                        ? { ...p, showMore: !p.showMore }
                        : p,
                    ),
                  );
                }}
              />
            </View>
          </View>
        </Tap>
      );
    }

    return (
      <PostItem
        item={item}
        type={PostType.feed}
        openLinks={openInAppBrowser}
        isBookmarked={isPostBookmarked(item)}
        showMoreClick={() => {
          setFeedList(prev =>
            prev.map(p =>
              p.postDetailID === item.postDetailID
                ? { ...p, showMore: !p.showMore }
                : p,
            ),
          );
        }}
        likeClick={() => {
          updateLocalLike({
            type: 'post',
            postID: item.postDetailID,
            like: true,
            callApi: true,
          });
        }}
        commentLikeClick={() => {
          updateLocalLike({
            type: 'comment',
            commentItem: item.commentsReplies?.at(0),
            like: true,
            callApi: true,
          });
        }}
        likeListClick={() => {
          navigation.navigate('GroupMembers', {
            postId: item.postDetailID,
            type: GroupMembersScreenParent.like,
          });
        }}
        commentClick={() => {
          setSelectedPost(item);
          setShowCommentPopup(true);
        }}
        bookmarkClick={() => {
          showBookmarkPopup({
            feedDetailId:
              bookmarkMap[item.postDetailID ?? '']?.feedDetailId ?? '',
            isBookmarked: isPostBookmarked(item),
            bookmarkId: getBookmarkId(item),
            collectionId: getCollectionId(item),
            sessionId,
            groupId,
            onSaved: () => {
              loadCollection.mutate({
                collectionId: collectionId ?? undefined,
                sessionId,
                groupId,
              });
              sendDataBack('Bookmarks', { refreshRequired: true });
            },
            onRemoved: () => {
              setFeedList(prev =>
                prev.filter(p => p.postDetailID !== item.postDetailID),
              );
              setBookmarkMap(prev => {
                const next = { ...prev };
                delete next[item.postDetailID ?? ''];
                return next;
              });
            },
            onCollectionChanged: () => {
              loadCollection.mutate({
                collectionId: collectionId ?? undefined,
                sessionId,
                groupId,
              });
              sendDataBack('Bookmarks', { refreshRequired: true });
            },
          });
        }}
        optionsClick={() => {
          setActionPost(item);
          setShowPostActions(true);
        }}
      />
    );
  };

  return (
    <SafeScreen>
      <CustomHeader
        showBack={!selectionMode}
        title={
          selectionMode
            ? t('SelectedCount', { count: selectedBookmarkIds.length })
            : collectionName ?? t('AllSaved')
        }
        rightIcons={
          selectionMode
            ? [
                {
                  name: t('Cancel'),
                  source: Images.close,
                  type: ImageType.svg,
                  onPress: exitSelectionMode,
                },
              ]
            : feedList.length > 0
            ? [
                {
                  name: t('Select'),
                  source: Images.editSquare,
                  type: ImageType.svg,
                  onPress: () => {
                    setSelectionMode(true);
                    setSelectedBookmarkIds([]);
                  },
                },
              ]
            : []
        }
      />

      {selectionMode && (
        <View style={styles.bulkBar}>
          {(() => {
            const allBmIds = feedList
              .map(p => bookmarkMap[p.postDetailID ?? '']?.bookmarkId)
              .filter(Boolean) as string[];
            const isAllSelected =
              allBmIds.length > 0 &&
              allBmIds.every(id => selectedBookmarkIds.includes(id));
            const hasSelection = selectedBookmarkIds.length > 0;
            const selectAllColor = isAllSelected
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant;
            const moveColor = hasSelection
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant;
            const unsaveColor = hasSelection
              ? theme.colors.error
              : theme.colors.onSurfaceVariant;
            return (
              <>
                <Tap
                  onPress={() =>
                    setSelectedBookmarkIds(isAllSelected ? [] : allBmIds)
                  }
                >
                  <View style={styles.bulkBarBtn}>
                    <CustomImage
                      source={Images.tick}
                      type={ImageType.svg}
                      color={selectAllColor}
                      style={styles.bulkBarIcon}
                    />
                    <CustomText
                      variant={TextVariants.labelMedium}
                      color={selectAllColor}
                    >
                      {t('SelectAll')}
                    </CustomText>
                  </View>
                </Tap>

                <Tap
                  onPress={() => {
                    if (!hasSelection) return;
                    fetchPickerCollectionsApi.mutate({
                      sessionId,
                      groupId,
                    });
                    setShowCollectionPicker(true);
                  }}
                  disableRipple={!hasSelection}
                >
                  <View style={styles.bulkBarBtn}>
                    <CustomImage
                      source={Images.addCircle}
                      type={ImageType.svg}
                      color={moveColor}
                      style={styles.bulkBarIcon}
                    />
                    <CustomText
                      variant={TextVariants.labelMedium}
                      color={moveColor}
                    >
                      {t('MoveToCollection')}
                    </CustomText>
                  </View>
                </Tap>

                <Tap
                  onPress={() => {
                    if (!hasSelection) return;
                    showAlertPopup({
                      title: collectionId
                        ? t('RemoveFromThisCollection')
                        : t('RemoveFromBookmarks'),
                      msg: collectionId
                        ? t('RemoveFromThisCollectionMsg')
                        : t('RemoveFromBookmarksConfirmMsg'),
                      PositiveText: t('Remove'),
                      NegativeText: t('Cancel'),
                      onPositivePress: () => {
                        const feedDetailIds = selectedBookmarkIds
                          .map(bmId => {
                            const entry = Object.values(bookmarkMap).find(
                              e => e.bookmarkId === bmId,
                            );
                            return entry?.feedDetailId;
                          })
                          .filter(Boolean) as string[];
                        bulkUnsaveApi.mutate(JSON.stringify(feedDetailIds));
                      },
                    });
                  }}
                  disableRipple={!hasSelection}
                >
                  <View style={styles.bulkBarBtn}>
                    <CustomImage
                      source={Images.delete}
                      type={ImageType.svg}
                      color={unsaveColor}
                      style={styles.bulkBarIcon}
                    />
                    <CustomText
                      variant={TextVariants.labelMedium}
                      color={unsaveColor}
                    >
                      {t('Unsave')}
                    </CustomText>
                  </View>
                </Tap>
              </>
            );
          })()}
        </View>
      )}

      {loading ? (
        <SkeletonList />
      ) : (
        <CustomFlatList
          data={feedList}
          keyExtractor={(item, index) =>
            `bm-post-${item.postDetailID}-${index}`
          }
          ItemSeparatorComponent={() => <Divider style={styles.separator} />}
          onRefresh={() =>
            loadCollection.mutate({
              collectionId: collectionId ?? undefined,
              sessionId,
              groupId,
            })
          }
          refreshing={loading}
          contentContainerStyle={
            feedList.length === 0 ? styles.emptyListContainer : undefined
          }
          ListEmptyComponent={<EmptyView label={t('NoBookmarksMsg')} />}
          ListFooterComponent={
            feedList.length > 0 ? (
              <View style={styles.listFooter}>
                <Divider style={styles.footerDivider} />
                <CustomText
                  style={styles.feedEndText}
                  variant={TextVariants.titleSmall}
                >
                  {t('EndOfFeed')}
                </CustomText>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => renderItem(item)}
        />
      )}

      {selectedPost && (
        <CommentPopup
          moduleType="feed"
          post={selectedPost}
          shown={showCommentPopup}
          setShown={setShowCommentPopup}
          handleCommentOption={(comment, from) => {
            if (from === 'edit') {
              setEditCommentId(comment);
              setShowCommentPopup(true);
            } else if (from === 'delete') {
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
          setDeleteCommentId={value => setDeleteCommentId(value)}
          editCommentId={editCommentId}
          setEditCommentId={value => setEditCommentId(value)}
          commentCountUpdate={() => {
            if (selectedPost?.postDetailID) {
              getPostByIdApi.mutate({ PostId: selectedPost.postDetailID });
            }
          }}
          openImagePicker={() => {
            setShowImagePicker(true);
          }}
          imageList={mediaList}
          setImageList={value => {
            if (value) setMediaList(value);
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
          userId={undefined}
        />
      )}

      <CustomImagePicker
        showPopup={showImagePicker}
        setShowPopup={setShowImagePicker}
        mediaList={value => {
          setShowCommentPopup(true);
          setMediaList(value);
        }}
      />

      <CustomActionSheetPoup
        shown={showPostActions}
        setShown={setShowPostActions}
        hideIcons={false}
        centered={false}
        children={[
          {
            title: t('MoveRemovefromCollection'),
            image: Images.addCircle,
            imageType: ImageType.svg,
            onPress: () => {
              if (!actionPost) return;
              const post = actionPost;
              setTimeout(() => {
                showBookmarkPopup({
                  feedDetailId:
                    bookmarkMap[post.postDetailID ?? '']?.feedDetailId ?? '',
                  isBookmarked: isPostBookmarked(post),
                  bookmarkId: getBookmarkId(post),
                  collectionId: getCollectionId(post),
                  sessionId,
                  groupId,
                  onSaved: () => {
                    loadCollection.mutate({
                      collectionId: collectionId ?? undefined,
                      sessionId,
                      groupId,
                    });
                    sendDataBack('Bookmarks', { refreshRequired: true });
                  },
                  onRemoved: () => {
                    setFeedList(prev =>
                      prev.filter(p => p.postDetailID !== post.postDetailID),
                    );
                    setBookmarkMap(prev => {
                      const next = { ...prev };
                      delete next[post.postDetailID ?? ''];
                      return next;
                    });
                  },
                  onCollectionChanged: () => {
                    loadCollection.mutate({
                      collectionId: collectionId ?? undefined,
                      sessionId,
                      groupId,
                    });
                    sendDataBack('Bookmarks', { refreshRequired: true });
                  },
                });
              }, 350);
            },
          },
          {
            title: t('RemoveFromSaved'),
            image: Images.delete,
            imageType: ImageType.svg,
            titleColor: theme.colors.error,
            imageColor: theme.colors.error,
            onPress: () => {
              if (!actionPost) return;
              const post = actionPost;
              setTimeout(() => {
                showAlertPopup({
                  title: t('RemoveFromSaved'),
                  msg: t('RemoveFromSavedMsg'),
                  PositiveText: t('Remove'),
                  NegativeText: t('Cancel'),
                  onPositivePress: () => {
                    const feedDetailId =
                      bookmarkMap[post.postDetailID ?? '']?.feedDetailId;
                    if (feedDetailId) {
                      unsavePostApi.mutate({
                        feedDetailId,
                        isBookmarked: false,
                      });
                    }
                  },
                });
              }, 350);
            },
          },
        ]}
      />

      <CustomBottomPopup
        shown={showCollectionPicker}
        setShown={setShowCollectionPicker}
        title={t('MoveToCollection')}
      >
        <ScrollView style={styles.pickerContent}>
          {fetchPickerCollectionsApi.isPending ? (
            <SkeletonList count={4}>
              <View style={styles.pickerRow}>
                <View style={styles.pickerRowInner}>
                  <View style={styles.pickerSkeletonIcon} />
                  <View style={styles.pickerSkeletonTextBlock}>
                    <View style={styles.pickerSkeletonName} />
                    <View style={styles.pickerSkeletonCount} />
                  </View>
                </View>
              </View>
            </SkeletonList>
          ) : pickerCollections.length === 0 ? (
            <EmptyView label={t('NoCollectionsMsg')} />
          ) : (
            pickerCollections.map(col => (
              <Tap
                key={col.id}
                style={styles.pickerRow}
                onPress={() => {
                  setShowCollectionPicker(false);
                  const feedDetailIds = selectedBookmarkIds
                    .map(bmId => {
                      const entry = Object.values(bookmarkMap).find(
                        e => e.bookmarkId === bmId,
                      );
                      return entry?.feedDetailId;
                    })
                    .filter(Boolean) as string[];
                  bulkAssignApi.mutate({
                    feedDetailIds,
                    collectionId: col.id,
                  });
                }}
              >
                <View style={styles.pickerRowInner}>
                  <View style={styles.pickerIconWrap}>
                    <CustomImage
                      source={Images.bookmarkFilled}
                      type={ImageType.svg}
                      color={theme.colors.primary}
                      style={styles.pickerIcon}
                    />
                  </View>
                  <View style={styles.pickerRowInfo}>
                    <CustomText
                      variant={TextVariants.bodyLarge}
                      maxLines={1}
                      ellipsis={TextEllipsis.tail}
                    >
                      {col.collectionName}
                    </CustomText>
                    <CustomText
                      variant={TextVariants.labelMedium}
                      color={theme.colors.onSurfaceVariant}
                    >
                      {t('PostsCount', { count: col.feedCount })}
                    </CustomText>
                  </View>
                </View>
              </Tap>
            ))
          )}
        </ScrollView>
      </CustomBottomPopup>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    separator: { marginHorizontal: 10 },
    emptyListContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    listFooter: { height: 200, marginTop: 25 },
    footerDivider: { marginHorizontal: 16 },
    feedEndText: { alignSelf: 'center', marginTop: 20 },
    selectionRow: {},
    selectionRowInner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    selectionPostWrap: { flex: 1 },
    bulkBar: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    bulkBarBtn: {
      alignItems: 'center',
      gap: 4,
    },
    bulkBarIcon: { width: 22, height: 22 },
    pickerContent: {
      paddingHorizontal: 4,
      paddingBottom: 8,
      flex: 1,
      height: 300,
    },
    pickerLoader: { marginVertical: 32 },
    pickerRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    pickerRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.elevation.level3,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    pickerIcon: { width: 20, height: 20 },
    pickerRowInfo: { flex: 1 },
    pickerSkeletonIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      marginRight: 14,
    },
    pickerSkeletonTextBlock: { flex: 1, gap: 6 },
    pickerSkeletonName: {
      width: '55%',
      height: 14,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    pickerSkeletonCount: {
      width: '30%',
      height: 12,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
  });

export default BookmarkCollectionScreen;
