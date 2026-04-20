import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CustomText, Skeleton, Tap } from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import {
  CustomBottomPopup,
  CustomSegmentedButton,
  EmptyView,
} from '@/components/molecules';
import CustomDropDownPopup, {
  DropdownModes,
} from '@/components/molecules/customPopup/customDropDownPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { showSnackbar } from '@/utils/utils';

import { CheckBoxStatus } from '@/components/atoms/customCheckBox/customCheckBox';
import {
  DocumentDetails,
  GetListOfDocumentsForFeedModel,
} from '@/services/models/getListOfDocumentsForFeedModel/getListOfDocumentsForFeedModel';
import {
  GetResourceFoldersForDropdownModel,
  ResourceFolder,
} from '@/services/models/getResourceFoldersForDropdownModel/getResourceFoldersForDropdownModel';
import { GetResourceTypesModel } from '@/services/models/getResourceTypesModel/getResourceTypesModel';
import { t } from 'i18next';
import { Checkbox } from 'react-native-paper';

type Props = {
  shown: boolean;
  setShown: (v: boolean) => void;
  initialSelectedDocs?: DocumentDetails[];
  onSelection: (documents?: DocumentDetails[]) => void;
};

export default function DocumentSelectorPopup({
  shown,
  setShown,
  initialSelectedDocs,
  onSelection,
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [types, setTypes] = useState<GetResourceTypesModel[]>([]);
  const [validationShow, setValidationShow] = useState<boolean>(false);
  const [validationMsg, setValidationMsg] = useState<string>('');

  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [docs, setDocs] = useState<GetListOfDocumentsForFeedModel>();

  const [selectedType, setSelectedType] = useState<GetResourceTypesModel>();
  const [selectedFolder, setSelectedFolder] = useState<ResourceFolder>();
  //keep folder-local selection for rendering the checkboxes
  const [selectedDocs, setSelectedDocs] = useState<DocumentDetails[]>();

  //global, across-all-tabs selection
  const [globalSelectedDocs, setGlobalSelectedDocs] = useState<
    DocumentDetails[]
  >(initialSelectedDocs || []);

  // loading flags
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);

  useEffect(() => {
    if (shown && initialSelectedDocs) {
      setSelectedDocs(initialSelectedDocs);
    }
  }, [shown, initialSelectedDocs]);

  useEffect(() => {
    const initial = initialSelectedDocs || [];
    setGlobalSelectedDocs(initial);
    setSelectedDocs(
      initial.filter(doc =>
        docs?.items?.some(d => d.documentId === doc.documentId),
      ),
    );
  }, [initialSelectedDocs, docs?.items]);

  useEffect(() => {
    if (shown) {
      setLoadingDocs(true);
      setDocs(undefined);
      getResourceTypesApi.mutate();
      getResourceFoldersApi.mutate();
    }
  }, [shown]);

  const handleSave = () => {
    if (globalSelectedDocs.length > 0) {
      onSelection(globalSelectedDocs);
      setShown(false);
    } else {
      setValidationMsg('Please select Resource to continue');
      setValidationShow(true);
    }
  };
  const getResourceTypesApi = useMutation({
    mutationFn: () =>
      makeRequest<GetResourceTypesModel[]>({
        endpoint: ApiConstants.GetResourceTypes,
        method: HttpMethodApi.Get,
      }),
    onMutate() {
      setLoadingTypes(true);
    },
    onSettled() {
      setLoadingTypes(false);
    },
    onSuccess(data) {
      if (data.result) {
        // prepend the "All" option
        const allOptionAdd: GetResourceTypesModel = {
          id: 0, // or some sentinel that real types don't use
          name: 'All',
          // other fields if required by the model (ensure they exist or adjust typing)
        };

        const withAllOption = [allOptionAdd, ...data.result];
        setTypes(withAllOption);
        // default selectedType to "All"
        setSelectedType(allOptionAdd);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const getResourceFoldersApi = useMutation({
    mutationFn: () =>
      makeRequest<GetResourceFoldersForDropdownModel[]>({
        endpoint: ApiConstants.GetResourceFoldersForDropdown,
        method: HttpMethodApi.Get,
      }),
    onMutate() {
      setLoadingFolders(true);
    },
    onSettled() {
      setLoadingFolders(false);
    },
    onSuccess(data) {
      if (data.result && data.result) {
        const folders = data.result
          .map(r => r.resourceFolder!)
          .filter(f => f.id);
        setFolders(folders);
        // auto‑select first folder
        if (folders.length > 0) {
          setSelectedFolder(folders[0]);
          getDocumentsApi.mutate({
            ResourceFolderID: folders[0].id,
          });
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const getDocumentsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) =>
      makeRequest<GetListOfDocumentsForFeedModel>({
        endpoint: ApiConstants.GetListOfDocumentsForFeed,
        method: HttpMethodApi.Get,
        data: sendData,
      }),
    onMutate() {
      setLoadingDocs(true);
    }, // ← ② flip on

    onSuccess(data) {
      if (data.result) {
        setDocs(data.result);

        if (initialSelectedDocs) {
          // *** AFTER docs arrive, pre‑check any initial selections ***
          const initialForThisFolder = initialSelectedDocs.filter(init =>
            data.result?.items?.some(d => d.documentId === init.documentId),
          );
          setSelectedDocs(initialForThisFolder);
        } else {
          setSelectedDocs(undefined); // clear old picks
        }
      }
      setLoadingDocs(false);
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setLoadingDocs(false);
    },
  });

  return (
    <CustomBottomPopup
      shown={shown}
      setShown={setShown}
      title={'Select Document'}
      keyboardHandle
    >
      <View style={styles.container}>
        {loadingTypes ? (
          <Skeleton>
            <View style={styles.skeletonHeader} />
          </Skeleton>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentedScroll}
          >
            <CustomSegmentedButton
              lableStyle={{
                alignSelf: 'center',
                textAlign: 'center',
                paddingHorizontal: 8,
              }}
              items={types.map(filetype => ({
                label: filetype.name!,
                value: filetype.id!.toString(),
              }))}
              selected={
                selectedType
                  ? {
                      label: selectedType.name!,
                      value: selectedType.id!.toString(),
                    }
                  : undefined
              }
              setSelected={item => {
                const filetype = types.find(
                  x => x.id!.toString() === item.value,
                );
                if (filetype) {
                  setSelectedType(filetype);
                  getDocumentsApi.mutate({
                    ResourceFolderID: selectedFolder?.id,
                    DocumentTypeFilter:
                      filetype?.id === 0 ? undefined : filetype?.id,
                  });
                }
              }}
              allowFontScaling={false}
              style={styles.segmentedBtn}
            />
          </ScrollView>
        )}

        {loadingFolders ? (
          <Skeleton>
            <View style={styles.SkeletonFolderView}>
              {[...Array(6)].map((_, i) => (
                <View key={`${i}-folder`} style={styles.docSkeletonRow} />
              ))}
            </View>
          </Skeleton>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentedScroll}
          >
            {folders.map(folder => {
              const isActive = folder.id === selectedFolder?.id;
              return (
                <Tap
                  key={folder.id}
                  onPress={() => {
                    setSelectedFolder(folder);
                    getDocumentsApi.mutate({
                      ResourceFolderID: folder.id,
                      DocumentTypeFilter:
                        selectedType?.id === 0 ? undefined : selectedType?.id,
                    });
                  }}
                  style={[
                    styles.filterContainer,
                    isActive && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <CustomText
                    variant={TextVariants.bodyMedium}
                    color={isActive ? theme.colors.onPrimary : undefined}
                    style={styles.filterText}
                  >
                    {folder.name}
                  </CustomText>
                </Tap>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.SkeletonContainer}>
          {loadingDocs ? (
            <Skeleton>
              <View style={styles.SkeletonMainView}>
                <View style={styles.searchBarPlaceholder} />
                {[...Array(7)].map((_, i) => (
                  <View style={styles.MainCheckBoxSkeletonView}>
                    <View style={styles.CheckBoxSekeletonView} />
                    <Checkbox
                      status={CheckBoxStatus.unchecked}
                      onPress={() => {}}
                      color={theme.colors.primary}
                    />
                  </View>
                ))}
              </View>
            </Skeleton>
          ) : docs?.items && docs?.items.length > 0 ? (
            <CustomDropDownPopup
              withPopup={false}
              mode={DropdownModes.multiple}
              items={docs?.items}
              displayKey="documentName"
              idKey="documentId"
              style={styles.CustomDropDownStyle}
              selectedMultipleItems={selectedDocs}
              onMultipleItemSelected={folderList => {
                const folderIds = docs?.items!.map(d => d.documentId) || [];

                // 1) pull in everything we’d previously picked (all OTHER folders)
                const retained = globalSelectedDocs.filter(
                  doc => !folderIds.includes(doc.documentId),
                );

                // 2) merge in this folder’s new picks
                let mergedGlobal = [...retained, ...folderList];

                // 3) enforce your max-10 rule
                if (mergedGlobal.length > 10) {
                  mergedGlobal = mergedGlobal.slice(0, 10);
                  setValidationShow(true);
                  setValidationMsg('You can select only up to 10 Resources');
                } else {
                  setValidationShow(false);
                  setValidationMsg('');
                }

                // 4) write back to **YOUR** global state
                setGlobalSelectedDocs(mergedGlobal);

                // 5) and only show the current folder’s slice as “checked”
                setSelectedDocs(
                  mergedGlobal.filter(doc =>
                    folderIds.includes(doc.documentId),
                  ),
                );
              }}
              onSave={handleSave}
              validationMessage={validationMsg}
              IsValidationRequired={validationShow}
            />
          ) : (
            <EmptyView label={t('NoDataAvailable')} />
          )}
        </View>
      </View>
    </CustomBottomPopup>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
    segmentedScroll: {
      paddingVertical: 8,
      flexGrow: 0,
    },
    segmentedBtn: {
      marginHorizontal: 0,
    },
    filterContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      borderColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    filterText: {
      fontSize: 14,
    },

    searchBarPlaceholder: {
      width: '100%',
      height: 30,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.skeletonBg,
    },
    SkeletonMainView: { gap: 10 },
    SkeletonContainer: { height: 350 },
    docSkeletonRow: {
      width: '15%',
      height: 25,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonHeader: {
      width: '100%',
      height: 40,
      marginVertical: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },

    CheckBoxSekeletonView: {
      width: '40%',
      height: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },

    MainCheckBoxSkeletonView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    SkeletonFolderView: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    CustomDropDownStyle: { flex: 1 },
  });
