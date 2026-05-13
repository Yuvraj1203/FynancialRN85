import { CustomImage, CustomText, SkeletonList, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomBottomPopup, CustomTextInput } from '@/components/molecules';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  ToggleCollectionMembershipResult,
  UserCollectionDto,
} from '@/services/models/bookmarkModel/bookmarkModel';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useReturnDataContext } from '@/utils/navigationUtils';
import { showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';

export type BookmarkPopupProps = {
  feedDetailId: string;
  isBookmarked: boolean;
  bookmarkId?: string | null;
  collectionId?: string | null;
  sessionId?: string;
  groupId?: string;
  onSaved?: (bookmarkId: string, collectionId: string | null) => void;
  onRemoved?: () => void;
  onCollectionChanged?: (
    bookmarkId: string,
    collectionId: string | null,
  ) => void;
};

export let showBookmarkPopup: (props: BookmarkPopupProps) => void;
export let hideBookmarkPopup: () => void;

type ViewMode = 'main' | 'createCollection';

function BookmarkPopup() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const { sendDataBack } = useReturnDataContext();

  const [shown, setShown] = useState(false);
  const [popupProps, setPopupProps] = useState<
    BookmarkPopupProps | undefined
  >();
  const [collections, setCollections] = useState<UserCollectionDto[]>([]);
  const [activeCollectionIds, setActiveCollectionIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDefaultSaved, setIsDefaultSaved] = useState(false);
  const [perRowLoading, setPerRowLoading] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const propsRef = useRef<BookmarkPopupProps | null>(null);
  const didAutoSaveRef = useRef(false);
  const isFromCreateCollectionRef = useRef(false);

  useEffect(() => {
    showBookmarkPopup = (props: BookmarkPopupProps) => {
      propsRef.current = props;
      didAutoSaveRef.current = false;
      setPopupProps(props);
      setViewMode('main');
      setNewCollectionName('');
      setIsDefaultSaved(!!props.isBookmarked);
      setActiveCollectionIds(
        props.collectionId ? new Set([props.collectionId]) : new Set(),
      );
      setShown(true);
    };
    hideBookmarkPopup = () => {
      setShown(false);
    };
  }, []);

  useEffect(() => {
    if (!shown || !popupProps) return;
    if (popupProps.isBookmarked) return;
    if (didAutoSaveRef.current) return;
    didAutoSaveRef.current = true;
    setPerRowLoading('default');
    makeRequest<string>({
      endpoint: ApiConstants.ToggleSaveFeed,
      method: HttpMethodApi.Post,
      data: { feedDetailId: popupProps.feedDetailId, isBookmarked: true },
    })
      .then(res => {
        setIsDefaultSaved(true);
        popupProps.onSaved?.(res?.result ?? '', null);
        sendDataBack('Bookmarks', { refreshRequired: true });
        sendDataBack('BookmarkCollection', { refreshRequired: true });
      })
      .catch((e: Error) => {
        showSnackbar(e.message, 'danger');
      })
      .finally(() => setPerRowLoading(undefined));
  }, [shown, popupProps]);

  const dismiss = () => {
    setShown(false);
    setPerRowLoading(undefined);
    setViewMode('main');
    setNewCollectionName('');
    didAutoSaveRef.current = false;
  };

  const handleClose = () => {
    if (viewMode === 'createCollection') {
      setViewMode('main');
      setNewCollectionName('');
      setShown(true);
    } else {
      dismiss();
    }
  };

  const toggleSaveApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.ToggleSaveFeed,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setPerRowLoading('default');
    },
    onSettled(data, error, variables, context) {
      setPerRowLoading(undefined);
    },
    onSuccess(data, variables, context) {
      const newState = variables.isBookmarked as boolean;
      setIsDefaultSaved(newState);
      if (!newState) {
        setActiveCollectionIds(new Set());
      }
      popupProps?.onSaved?.(data?.result ?? '', null);
      sendDataBack('Bookmarks', { refreshRequired: true });
      dismiss();
      showSnackbar(
        newState ? t('BookmarkSaved') : t('BookmarkRemoved'),
        newState ? 'success' : 'danger',
      );
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const loadCollectionsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserCollectionDto[]>({
        endpoint: ApiConstants.GetUserCollections,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setCollections(data?.result ?? []);
      if (popupProps?.collectionId) {
        setActiveCollectionIds(new Set([popupProps.collectionId]));
      }
    },
    onError(error, variables, context) {
      setCollections([]);
    },
  });

  const refreshCollectionsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserCollectionDto[]>({
        endpoint: ApiConstants.GetUserCollections,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setCollections(data?.result ?? []);
      if (popupProps?.collectionId) {
        setActiveCollectionIds(new Set([popupProps.collectionId]));
      }
    },
  });

  const toggleCollectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<ToggleCollectionMembershipResult>({
        endpoint: ApiConstants.ToggleCollectionMembership,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      const collectionId = variables.collectionId as string;
      setPerRowLoading(collectionId);
    },
    onSettled() {
      setPerRowLoading(undefined);
    },
    onSuccess(data, variables, context) {
      const isIn = variables.action === 'add';
      const isFromCreate = isFromCreateCollectionRef.current;
      if (isFromCreate) {
        isFromCreateCollectionRef.current = false;
      }
      if (isIn) {
        setActiveCollectionIds(new Set([variables.collectionId as string]));
        popupProps?.onCollectionChanged?.(
          data?.result?.bookmarkId ?? popupProps?.bookmarkId ?? '',
          variables.collectionId as string,
        );
        sendDataBack('Bookmarks', { refreshRequired: true });
        sendDataBack('BookmarkCollection', { refreshRequired: true });
        dismiss();
        if (!isFromCreate) {
          showSnackbar(
            t('BookmarkSavedToCollection', { name: variables.collectionName }),
            'success',
          );
        }
      } else {
        setActiveCollectionIds(new Set());
        popupProps?.onCollectionChanged?.(popupProps?.bookmarkId ?? '', null);
        sendDataBack('Bookmarks', { refreshRequired: true });
        sendDataBack('BookmarkCollection', { refreshRequired: true });
        dismiss();
        showSnackbar(t('BookmarkRemovedFromCollection'), 'danger');
      }
    },
    onError(error) {
      showSnackbar(error.message, 'danger');
    },
  });

  useEffect(() => {
    if (!shown || !popupProps) return;
    loadCollectionsApi.mutate({
      sessionId: popupProps.sessionId,
      groupId: popupProps.groupId,
    });
  }, [shown, popupProps]);

  const createCollectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserCollectionDto>({
        endpoint: ApiConstants.CreateCollection,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setCreateLoading(true);
      setCreateError('');
    },
    onSettled(data, error, variables, context) {
      setCreateLoading(false);
    },
    onSuccess(data, variables, context) {
      setNewCollectionName('');
      setViewMode('main');
      isFromCreateCollectionRef.current = true;
      toggleCollectionApi.mutate(
        {
          feedDetailId: popupProps?.feedDetailId,
          collectionId: data?.result?.id,
          action: 'add',
          collectionName: data?.result?.collectionName,
        },
        {
          onSuccess: () => {
            refreshCollectionsApi.mutate({
              sessionId: popupProps?.sessionId,
              groupId: popupProps?.groupId,
            });
            dismiss();
            showSnackbar(t('CollectionCreated'), 'success');
          },
        },
      );
    },
    onError(error) {
      setCreateError(error.message);
    },
  });

  const handleToggleDefaultSave = () => {
    if (!popupProps || perRowLoading !== undefined) return;
    const newState = !isDefaultSaved;
    toggleSaveApi.mutate({
      feedDetailId: popupProps.feedDetailId,
      isBookmarked: newState,
    });
  };

  const handleToggleCollection = (collection: UserCollectionDto) => {
    if (!popupProps || perRowLoading !== undefined) return;
    const isIn = activeCollectionIds.has(collection.id);
    const action: 'add' | 'remove' = isIn ? 'remove' : 'add';
    toggleCollectionApi.mutate({
      feedDetailId: popupProps.feedDetailId,
      collectionId: collection.id,
      action,
      collectionName: collection.collectionName,
    });
  };

  const handleCreateAndSave = () => {
    if (!popupProps || !newCollectionName.trim()) return;
    createCollectionApi.mutate({
      collectionName: newCollectionName.trim(),
      sessionId: popupProps.sessionId,
      groupId: popupProps.groupId,
    });
  };

  const renderThumbnailPlaceholder = () => (
    <View style={styles.thumbnail}>
      <CustomImage
        source={Images.bookmarkFilled}
        type={ImageType.svg}
        color={theme.colors.onSurfaceVariant}
        style={styles.thumbnailIcon}
      />
    </View>
  );

  const renderMainContent = () => {
    if (!popupProps) return null;

    return (
      <ScrollView
        style={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Tap
            onPress={handleToggleDefaultSave}
            disableRipple={perRowLoading !== undefined}
          >
            <View style={styles.row}>
              {renderThumbnailPlaceholder()}
              <View style={styles.rowContent}>
                <CustomText
                  variant={TextVariants.bodyLarge}
                  style={styles.rowName}
                  maxLines={1}
                  ellipsis={TextEllipsis.tail}
                >
                  {t('Saved')}
                </CustomText>
              </View>
              {perRowLoading !== 'default' && (
                <View style={styles.tapToUnsaveLabel}>
                  <CustomText
                    variant={TextVariants.labelSmall}
                    color={theme.colors.primary}
                  >
                    {isDefaultSaved ? t('TapToUnsave') : t('TapToSave')}
                  </CustomText>
                </View>
              )}
              <View style={styles.toggleBtn}>
                {perRowLoading === 'default' ? (
                  <ActivityIndicator size={16} color={theme.colors.primary} />
                ) : (
                  <CustomImage
                    source={
                      isDefaultSaved ? Images.bookmarkFilled : Images.bookmark
                    }
                    type={ImageType.svg}
                    color={
                      isDefaultSaved
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                    style={styles.toggleIcon}
                  />
                )}
              </View>
            </View>
          </Tap>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.sectionHeader}>
          <CustomText
            variant={TextVariants.titleMedium}
            style={styles.sectionTitle}
          >
            {t('Collections')}
          </CustomText>
          <Tap
            onPress={() => setViewMode('createCollection')}
            disableRipple={perRowLoading !== undefined}
          >
            <View>
              <CustomText
                variant={TextVariants.bodyMedium}
                color={theme.colors.primary}
                style={styles.newCollectionBtn}
              >
                {t('NewCollection')}
              </CustomText>
            </View>
          </Tap>
        </View>

        {loadCollectionsApi.isPending ? (
          <SkeletonList count={3}>
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonThumbnail} />
              <View style={styles.skeletonTextBlock}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSubtitle} />
              </View>
              <View style={styles.skeletonToggle} />
            </View>
          </SkeletonList>
        ) : (
          collections.map(collection => {
            const isIn = activeCollectionIds.has(collection.id);
            return (
              <View key={collection.id}>
                <Tap
                  onPress={() => handleToggleCollection(collection)}
                  disableRipple={perRowLoading !== undefined}
                >
                  <View style={styles.row}>
                    {renderThumbnailPlaceholder()}
                    <View style={styles.rowContent}>
                      <CustomText
                        variant={TextVariants.bodyLarge}
                        style={styles.rowName}
                        maxLines={1}
                        ellipsis={TextEllipsis.tail}
                      >
                        {collection.collectionName}
                      </CustomText>
                    </View>
                    <View style={[styles.toggleBtn]}>
                      {perRowLoading === collection.id ? (
                        <ActivityIndicator
                          size={16}
                          color={theme.colors.primary}
                        />
                      ) : (
                        <CustomImage
                          source={isIn ? Images.tickCircle : Images.addCircle}
                          type={ImageType.svg}
                          color={
                            isIn
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant
                          }
                          style={styles.toggleIcon}
                        />
                      )}
                    </View>
                  </View>
                </Tap>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderCreateCollectionContent = () => (
    <View style={styles.createContainer}>
      <CustomTextInput
        label={t('CollectionName')}
        text={newCollectionName}
        onChangeText={v => {
          setNewCollectionName(v);
          if (createError) setCreateError('');
        }}
        maxLength={255}
        errorMsg={createError}
      />
      <Tap
        style={[
          styles.createBtn,
          { backgroundColor: theme.colors.primary },
          (!newCollectionName.trim() || createLoading) && styles.disabledBtn,
        ]}
        onPress={handleCreateAndSave}
        disableRipple={!newCollectionName.trim() || createLoading}
      >
        {createLoading ? (
          <ActivityIndicator color={theme.colors.surface} size={18} />
        ) : (
          <CustomText
            variant={TextVariants.labelLarge}
            color={theme.colors.surface}
          >
            {t('CreateAndSave')}
          </CustomText>
        )}
      </Tap>
    </View>
  );

  return (
    <CustomBottomPopup
      shown={shown}
      keyboardHandle
      setShown={setShown}
      onClose={handleClose}
      title={
        viewMode === 'createCollection' ? t('NewCollection') : t('SavePost')
      }
    >
      {viewMode === 'main'
        ? renderMainContent()
        : renderCreateCollectionContent()}
    </CustomBottomPopup>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    scrollContent: {
      maxHeight: 480,
      paddingBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      flexShrink: 0,
    },
    thumbnailIcon: {
      width: 22,
      height: 22,
    },
    rowContent: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    rowName: {
      fontWeight: '600',
    },
    rowSubtitle: {
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    tapToUnsaveLabel: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 3,
      marginRight: 0,
    },
    toggleBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    toggleBtnCircle: {
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
    },
    toggleIcon: {
      width: 26,
      height: 26,
    },
    divider: {
      marginHorizontal: 20,
      marginVertical: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontWeight: '700',
    },
    newCollectionBtn: {
      fontWeight: '600',
    },
    createContainer: {
      paddingHorizontal: 20,
      paddingBottom: 8,
      gap: 16,
    },
    createBtn: {
      paddingVertical: 12,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledBtn: {
      opacity: 0.5,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    skeletonThumbnail: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      marginRight: 14,
      flexShrink: 0,
    },
    skeletonTextBlock: {
      flex: 1,
      gap: 8,
    },
    skeletonTitle: {
      height: 14,
      width: '55%',
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    skeletonSubtitle: {
      height: 11,
      width: '30%',
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    skeletonToggle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      flexShrink: 0,
    },
  });

export default BookmarkPopup;
