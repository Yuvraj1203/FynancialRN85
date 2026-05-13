import {
  CustomButton,
  CustomImage,
  Skeleton,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import { ImageType } from '@/components/atoms/customImage/customImage';
import CustomText, {
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomBottomPopup,
  CustomTextInput,
  EmptyView,
} from '@/components/molecules';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  BookmarkReturnProp,
  UserCollectionDto,
} from '@/services/models/bookmarkModel/bookmarkModel';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';

export type BookmarksScreenProps = {
  sessionId?: string;
  groupId?: string;
  onCountChange?: (count: number) => void;
  isActive?: boolean;
};

function BookmarksScreen({
  sessionId,
  groupId,
  onCountChange,
  isActive = true,
}: BookmarksScreenProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const navigation = useAppNavigation();

  const [collections, setCollections] = useState<UserCollectionDto[]>([]);
  const [allSavedCount, setAllSavedCount] = useState<number>(0);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const hasLoadedBeforeRef = useRef(false);

  const [activeRowCollection, setActiveRowCollection] = useState<
    UserCollectionDto | undefined
  >();
  const [showRowMenu, setShowRowMenu] = useState(false);
  const { receiveDataBack } = useReturnDataContext();

  const [showNewPopup, setShowNewPopup] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showRenamePopup, setShowRenamePopup] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!isActive) return;
    fetchCollectionsApi.mutate({ sessionId, groupId });
    fetchCountApi.mutate({ sessionId, groupId });
  }, [isActive, sessionId, groupId]);

  useEffect(() => {
    receiveDataBack('Bookmarks', (data: BookmarkReturnProp) => {
      if (data.refreshRequired) {
        fetchCollectionsApi.mutate({ sessionId, groupId });
        fetchCountApi.mutate({ sessionId, groupId });
      }
    });
  }, [sessionId, groupId]);

  const openCollection = (item?: UserCollectionDto) =>
    navigation.navigate('BookmarkCollection', {
      collectionId: item?.id ?? null,
      collectionName: item?.collectionName ?? t('AllSaved'),
      sessionId,
      groupId,
    });

  const handleDeleteCollection = (col: UserCollectionDto) => {
    showAlertPopup({
      title: t('DeleteCollection'),
      msg: t('DeleteCollectionMsg'),
      PositiveText: t('Delete'),
      NegativeText: t('Cancel'),
      onPositivePress: () =>
        deleteCollectionApi.mutate({ collectionId: col.id }),
    });
  };

  const fetchCollectionsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserCollectionDto[]>({
        endpoint: ApiConstants.GetUserCollections,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setCollections(data?.result ?? []);
      hasLoadedBeforeRef.current = true;
      setManualRefreshing(false);
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      hasLoadedBeforeRef.current = true;
      setManualRefreshing(false);
    },
  });

  const fetchCountApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.GetSavedFeedsCount,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      const count = data?.result ?? 0;
      setAllSavedCount(count);
      onCountChange?.(count);
      hasLoadedBeforeRef.current = true;
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      hasLoadedBeforeRef.current = true;
    },
  });

  const createCollectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.CreateCollection,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setShowNewPopup(false);
      setNewCollectionName('');
      showSnackbar(t('CollectionCreated'), 'success');
      fetchCollectionsApi.mutate({ sessionId, groupId });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const renameCollectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.RenameCollection,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      setShowRenamePopup(false);
      setActiveRowCollection(undefined);
      showSnackbar(t('CollectionRenamed'), 'success');
      fetchCollectionsApi.mutate({ sessionId, groupId });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const deleteCollectionApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.DeleteCollection,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onSuccess(data, variables, context) {
      showSnackbar(t('CollectionDeleted'), 'success');
      fetchCollectionsApi.mutate({ sessionId, groupId });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const renderCollectionSkeleton = () => (
    <SkeletonList count={4}>
      <View style={styles.collectionListItem}>
        <View style={styles.collectionListItemInner}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTextBlock}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonCount} />
          </View>
          <View style={styles.skeletonDot} />
        </View>
      </View>
    </SkeletonList>
  );

  const renderCollectionRow = (item: UserCollectionDto) => (
    <Tap
      key={item.id}
      style={styles.collectionListItem}
      onPress={() => openCollection(item)}
    >
      <View style={styles.collectionListItemInner}>
        <View style={styles.collectionIconWrap}>
          <CustomImage
            source={Images.bookmarkFilled}
            type={ImageType.svg}
            color={theme.colors.primary}
            style={styles.collectionIcon}
          />
        </View>
        <View style={styles.collectionInfo}>
          <CustomText variant={TextVariants.titleMedium} maxLines={1}>
            {item.collectionName}
          </CustomText>
          <CustomText
            variant={TextVariants.labelMedium}
            color={theme.colors.onSurfaceVariant}
          >
            {t('PostsCount', { count: item.feedCount })}
          </CustomText>
        </View>
        <Tap
          onPress={() => {
            setActiveRowCollection(item);
            setShowRowMenu(true);
          }}
        >
          <View style={styles.moreIconWrap}>
            <CustomImage
              source={Images.more}
              type={ImageType.svg}
              color={theme.colors.onSurfaceVariant}
              style={styles.moreIcon}
            />
          </View>
        </Tap>
      </View>
    </Tap>
  );

  const handleManualRefresh = () => {
    setManualRefreshing(true);
    fetchCollectionsApi.mutate({ sessionId, groupId });
    fetchCountApi.mutate({ sessionId, groupId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <CustomText variant={TextVariants.titleSmall}>{t('Posts')}</CustomText>
      </View>

      {(!hasLoadedBeforeRef.current && fetchCollectionsApi.isPending) ||
      manualRefreshing ? (
        <Skeleton>
          <View style={styles.allSavedRow}>
            <View style={styles.collectionListItemInner}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonTextBlock}>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonCount} />
              </View>
            </View>
          </View>
        </Skeleton>
      ) : (
        <Tap
          style={styles.allSavedRow}
          onPress={() => openCollection(undefined)}
        >
          <View style={styles.allSavedInner}>
            <View style={styles.collectionIconWrap}>
              <CustomImage
                source={Images.bookmark}
                type={ImageType.svg}
                color={theme.colors.primary}
                style={styles.collectionIcon}
              />
            </View>
            <View style={styles.collectionInfo}>
              <CustomText variant={TextVariants.titleMedium}>
                {t('AllSaved')}
              </CustomText>
              <CustomText
                variant={TextVariants.labelMedium}
                color={theme.colors.onSurfaceVariant}
              >
                {t('PostsCount', { count: allSavedCount })}
              </CustomText>
            </View>
          </View>
        </Tap>
      )}

      <Divider style={styles.divider} />

      <View style={styles.collectionsHeader}>
        <CustomText variant={TextVariants.titleSmall}>
          {t('Collections')}
        </CustomText>
        <Tap
          onPress={() => {
            setNewCollectionName('');
            setShowNewPopup(true);
          }}
        >
          <View style={styles.createBtnWrap}>
            <CustomImage
              source={Images.addCircle}
              type={ImageType.svg}
              color={theme.colors.primary}
              style={styles.createBtnIcon}
            />
          </View>
        </Tap>
      </View>

      {(!hasLoadedBeforeRef.current && fetchCollectionsApi.isPending) ||
      manualRefreshing ? (
        renderCollectionSkeleton()
      ) : (
        <CustomFlatList
          data={collections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderCollectionRow(item)}
          ItemSeparatorComponent={() => <Divider style={styles.rowDivider} />}
          ListEmptyComponent={<EmptyView label={t('NoCollectionsMsg')} />}
          refreshing={manualRefreshing}
          onRefresh={handleManualRefresh}
        />
      )}

      <CustomActionSheetPoup
        shown={showRowMenu}
        setShown={setShowRowMenu}
        hideIcons={false}
        centered={false}
        children={[
          {
            title: t('RenameCollection'),
            image: Images.editSquare,
            imageType: ImageType.svg,
            onPress: () => {
              if (activeRowCollection) {
                setRenameValue(activeRowCollection.collectionName);
                setShowRenamePopup(true);
              }
            },
          },
          {
            title: t('DeleteCollection'),
            image: Images.delete,
            imageType: ImageType.svg,
            titleColor: theme.colors.error,
            imageColor: theme.colors.error,
            onPress: () => {
              if (activeRowCollection) {
                handleDeleteCollection(activeRowCollection);
              }
            },
          },
        ]}
      />

      <CustomBottomPopup
        shown={showNewPopup}
        setShown={setShowNewPopup}
        title={t('NewCollection')}
        keyboardHandle
        onClose={() => setNewCollectionName('')}
      >
        <View style={styles.inputPopupContent}>
          <CustomTextInput
            label={t('CollectionName')}
            text={newCollectionName}
            onChangeText={setNewCollectionName}
            placeholder={t('CreateNewCollection')}
            maxLength={255}
          />

          <CustomButton
            mode={ButtonVariants.text}
            loading={renameCollectionApi.isPending}
            style={
              createCollectionApi.isPending
                ? [styles.actionBtn, styles.actionBtnDisabled]
                : styles.actionBtn
            }
            onPress={() => {
              if (newCollectionName.trim() && !createCollectionApi.isPending) {
                createCollectionApi.mutate({
                  collectionName: newCollectionName.trim(),
                  sessionId,
                  groupId,
                });
              }
            }}
          >
            {createCollectionApi.isPending ? t('Loading') : t('Create')}
          </CustomButton>
        </View>
      </CustomBottomPopup>

      <CustomBottomPopup
        shown={showRenamePopup}
        setShown={setShowRenamePopup}
        title={t('RenameCollection')}
        keyboardHandle
        onClose={() => setActiveRowCollection(undefined)}
      >
        <View style={styles.inputPopupContent}>
          <CustomTextInput
            label={t('CollectionName')}
            text={renameValue}
            onChangeText={setRenameValue}
            maxLength={255}
          />

          <CustomButton
            mode={ButtonVariants.text}
            loading={renameCollectionApi.isPending}
            style={
              renameCollectionApi.isPending
                ? [styles.actionBtn, styles.actionBtnDisabled]
                : styles.actionBtn
            }
            onPress={() => {
              if (
                activeRowCollection &&
                renameValue.trim() &&
                !renameCollectionApi.isPending
              ) {
                renameCollectionApi.mutate({
                  collectionId: activeRowCollection.id,
                  newName: renameValue.trim(),
                });
              }
            }}
          >
            {renameCollectionApi.isPending ? t('Loading') : t('Save')}
          </CustomButton>
        </View>
      </CustomBottomPopup>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
    },
    collectionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
    },
    collectionListItem: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    collectionListItemInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    skeletonIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      marginRight: 14,
    },
    skeletonTextBlock: { flex: 1, gap: 6 },
    skeletonName: {
      width: '55%',
      height: 14,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    skeletonCount: {
      width: '30%',
      height: 12,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    skeletonDot: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    divider: { marginHorizontal: 16, marginVertical: 2 },
    rowDivider: { marginHorizontal: 16 },
    allSavedRow: { paddingHorizontal: 16, paddingVertical: 6 },
    allSavedInner: { flexDirection: 'row', alignItems: 'center' },
    createBtnWrap: { padding: 4 },
    createBtnIcon: { width: 26, height: 26 },
    collectionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.colors.elevation.level3,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    collectionIcon: { width: 22, height: 22 },
    collectionInfo: { flex: 1, gap: 2 },
    moreIconWrap: { padding: 4 },
    moreIcon: { width: 20, height: 20 },
    inputPopupContent: {
      paddingHorizontal: 16,
    },
    actionBtn: {
      backgroundColor: theme.colors.primary,
    },
    actionBtnDisabled: { opacity: 0.6 },
  });

export { BookmarksScreen };
export default BookmarksScreen;
