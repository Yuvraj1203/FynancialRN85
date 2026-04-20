import { SkeletonList } from '@/components/atoms';
import {
  CustomBottomPopup,
  CustomDropDownPopup,
  CustomSegmentedButton,
  EmptyView,
} from '@/components/molecules';
import { DropdownModes } from '@/components/molecules/customPopup/customDropDownPopup';
import { SegmentedButtonItem } from '@/components/molecules/customSegmentedButton/customSegmentedButton';
import {
  GetCalItemtagsModel,
  GetGlobalCalendarContactTypeModel,
} from '@/services/models';
import { GetAllUsersForGlobalCalendarModel } from '@/services/models/getAllUsersForGlobalCalendarModel/getAllUsersForGlobalCalendarModel';
import { GetGlobalCalendarProgramListModel } from '@/services/models/getGlobalCalendarProgramListModel/getGlobalCalendarProgramListModel';
import { tenantDetailStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**  Added by @Ajay 08-04-2025 ---> Define the type for ScheduleTargetAudiencePopup props */
type Props<T> = {
  shown: boolean;
  setShown: (value: boolean) => void;
  taskIdForTarget?: string;
  selectedType?: string;
  tagList?: GetCalItemtagsModel[];
  contactList?: GetAllUsersForGlobalCalendarModel[];
  contactTypeList?: GetGlobalCalendarContactTypeModel[];
  templateList?: GetGlobalCalendarProgramListModel[];
  selectedTagsList?: GetCalItemtagsModel[];
  selectedContactsList?: GetAllUsersForGlobalCalendarModel[];
  selectedContactTypesList?: GetGlobalCalendarContactTypeModel[];
  selectedTemplate?: GetGlobalCalendarProgramListModel;
  onTagsSelected: (value?: GetCalItemtagsModel[]) => void;
  onContactsSelected: (value?: GetAllUsersForGlobalCalendarModel[]) => void;
  onContactTypeSelected: (value?: GetGlobalCalendarContactTypeModel[]) => void;
  onTemplateSelected: (value?: GetAllUsersForGlobalCalendarModel) => void;
  onselectType: (value?: string) => void;
  showCommunity?: boolean;
};

/**  Added by @Ajay 08-04-2025 ---> Enum for segmented button values */
export enum SegmentedButtonsValues {
  Tags = 'Tags',
  Contacts = 'Contacts',
  Templates = 'Templates',
  ContactType = 'ContactType',
}

/**  Added by @Ajay 08-04-2025 ---> Main function to render Schedule Target Audience Popup */
function ScheduleTargetAudiencePopup<T>({
  showCommunity = true,
  ...props
}: Props<T>) {
  const theme = useTheme();

  /** Access styles with theme implemented */
  const styles = makeStyles(theme);

  /** Added by @Tarun 05-02-2025 -> tenant details store (FYN-4204) */
  const tenantDetail = tenantDetailStore().tenantDetails;

  /**  Added by @Ajay 08-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /**  Added by @Ajay 08-04-2025 ---> State to manage selected audience type */
  const [SelectedAudienceType, setSelectedAudienceType] =
    useState<SegmentedButtonItem>();

  /**  Added by @Ajay 08-04-2025 ---> Initialize tag list from props or empty array */
  const [tagList, setTagList] = useState<GetCalItemtagsModel[]>(
    props?.tagList || [],
  );

  /**  Added by @Ajay 08-04-2025 ---> State to store list of selected contacts */
  const [contactList, setContactList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >(props?.contactList || []);

  /**  Added by @Ajay 08-04-2025 ---> State to store list of contact types */
  const [contactTypeList, setContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >(props?.contactTypeList || []);

  /**  Added by @Ajay 08-04-2025 ---> State to store list of selected templates */
  const [templateList, setTemplateList] = useState<
    GetGlobalCalendarProgramListModel[]
  >(props?.templateList || []);

  /**  Added by @Ajay 08-04-2025 ---> Initialize selected tag list from props or empty array */
  const [selectedTagList, setSelectedTagList] = useState<GetCalItemtagsModel[]>(
    props.selectedTagsList ?? [],
  );

  /**  Added by @Ajay 08-04-2025 ---> Initialize selected contact list from props or empty array */
  const [selectedContactList, setSelectedContactList] = useState<
    GetAllUsersForGlobalCalendarModel[]
  >(props.selectedContactsList ?? []);

  /**  Added by @Ajay 08-04-2025 ---> Initialize selected contact type list from props or empty array */
  const [selectedContactTypeList, setSelectedContactTypeList] = useState<
    GetGlobalCalendarContactTypeModel[]
  >(props.selectedContactTypesList ?? []);

  /**  Added by @Ajay 08-04-2025 ---> Initialize selected template from props */
  const [selectedTemplate, setSelectedTemplate] = useState<
    GetGlobalCalendarProgramListModel | undefined
  >(props.selectedTemplate);

  /**  Added by @Ajay 08-04-2025 ---> Effect to initialize selected items when the popup is shown */
  useEffect(() => {
    if (props.shown) {
      if (props.selectedTagsList) {
        setSelectedTagList(props.selectedTagsList);
      }
      if (props.selectedContactsList) {
        setSelectedContactList(props.selectedContactsList);
      }
      if (props.selectedContactTypesList) {
        setSelectedContactTypeList(props.selectedContactTypesList);
      }
      if (props.selectedTemplate) {
        console.log('props : ', props.selectedTemplate);
        setSelectedTemplate(props.selectedTemplate);
      }
    }
  }, [props.shown]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update selected tags when props change */
  useEffect(() => {
    if (props.selectedTagsList) {
      setSelectedTagList(props.selectedTagsList);
    }
  }, [props.selectedTagsList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update selected contacts when props change */
  useEffect(() => {
    if (props.selectedContactsList) {
      setSelectedContactList(props.selectedContactsList);
    }
  }, [props.selectedContactsList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update selected contact types when props change */
  useEffect(() => {
    if (props.selectedContactTypesList) {
      setSelectedContactTypeList(props.selectedContactTypesList);
    }
  }, [props.selectedContactTypesList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update selected template when props change */
  useEffect(() => {
    if (props.selectedTemplate) {
      setSelectedTemplate(props.selectedTemplate);
    }
  }, [props.selectedTemplate]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update tag list when props change */
  useEffect(() => {
    if (props.tagList) {
      setTagList(props.tagList);
    }
  }, [props.tagList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update contact list when props change */
  useEffect(() => {
    if (props.contactList) {
      setContactList(props.contactList);
    }
  }, [props.contactList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update contact type list when props change */
  useEffect(() => {
    if (props.contactTypeList) {
      setContactTypeList(props.contactTypeList);
    }
  }, [props.contactTypeList]);

  /**  Added by @Ajay 08-04-2025 ---> Effect to update template list when props change */
  useEffect(() => {
    if (props.templateList) {
      setTemplateList(props.templateList);
    }
  }, [props.templateList]);

  /**  Added by @Ajay 08-04-2025 ---> Render an empty view when no data is available */
  const renderEmptyView = (label: string) => {
    return (
      <View style={{ height: 300 }}>
        <EmptyView label={label} />
      </View>
    );
  };

  return (
    <CustomBottomPopup
      shown={props.shown}
      setShown={props.setShown}
      title={t('SelectTargeAudience')}
      keyboardHandle
    >
      <View>
        <CustomSegmentedButton
          items={[
            {
              label: t('Tags'),
              value: SegmentedButtonsValues.Tags,
            },
            {
              label: t('Contacts'),
              value: SegmentedButtonsValues.Contacts,
            },
            {
              label: t('ContactType'),
              value: SegmentedButtonsValues.ContactType,
            },
            ...(tenantDetail?.allowCommunityTemplateCreation && showCommunity
              ? [
                  {
                    label: t('CommunityTemplate'),
                    value: SegmentedButtonsValues.Templates,
                  },
                ]
              : []),
          ]}
          selected={SelectedAudienceType}
          allowFontScaling={false}
          setSelected={value => {
            if (value) {
              setSelectedAudienceType(value);
            }
          }}
          style={styles.segmentedBtn}
        />

        {SelectedAudienceType?.value === SegmentedButtonsValues.Tags ? (
          tagList.length > 0 ? (
            <CustomDropDownPopup
              key={'Tags'}
              loading={false}
              items={tagList}
              displayKey="tagName"
              idKey="id"
              selectedMultipleItems={selectedTagList}
              onMultipleItemSelected={(value: GetCalItemtagsModel[]) => {
                if (props.selectedTemplate) {
                  setSelectedTemplate(undefined);
                }
                if (props.selectedContactsList) {
                  setSelectedContactList([]);
                }
                if (props.selectedContactTypesList) {
                  setSelectedContactTypeList([]);
                }
              }}
              mode={DropdownModes.multiple}
              withPopup={false}
              onSave={value => {
                props.onselectType(SegmentedButtonsValues.Tags);
                props.onTagsSelected(value as GetCalItemtagsModel[]);
                props.onContactsSelected([]);
                props.onContactTypeSelected([]);
                props.onTemplateSelected(undefined);
                props.setShown(false);
              }}
            />
          ) : (
            renderEmptyView(t('NoTags'))
          )
        ) : SelectedAudienceType?.value === SegmentedButtonsValues.Contacts ? (
          contactList.length > 0 ? (
            <CustomDropDownPopup
              key={'Contacts'}
              loading={false}
              items={contactList}
              displayKey="name"
              idKey="userId"
              selectedMultipleItems={selectedContactList}
              onMultipleItemSelected={(
                value: GetAllUsersForGlobalCalendarModel[],
              ) => {
                if (props.selectedTemplate) {
                  setSelectedTemplate(undefined);
                }
                if (props.selectedTagsList) {
                  setSelectedTagList([]);
                }
                if (props.selectedContactTypesList) {
                  setSelectedContactTypeList([]);
                }
              }}
              mode={DropdownModes.multiple}
              withPopup={false}
              onSave={value => {
                props.onselectType(SegmentedButtonsValues.Contacts);
                props.onContactsSelected(
                  value as GetAllUsersForGlobalCalendarModel[],
                );
                props.onContactTypeSelected([]);
                props.onTagsSelected([]);
                props.onTemplateSelected(undefined);
                props.setShown(false);
              }}
            />
          ) : (
            renderEmptyView(t('NoContacts'))
          )
        ) : SelectedAudienceType?.value === SegmentedButtonsValues.Templates ? (
          templateList.length > 0 ? (
            <CustomDropDownPopup
              key={'Template'}
              loading={false}
              items={templateList}
              displayKey="programName"
              idKey="programID"
              selectedItem={selectedTemplate}
              mode={DropdownModes.single}
              withPopup={false}
              onItemSelected={value => {
                if (props.selectedContactsList) {
                  setSelectedContactList([]);
                }
                if (props.selectedTagsList) {
                  setSelectedTagList([]);
                }
                if (props.selectedContactTypesList) {
                  setSelectedContactTypeList([]);
                }
                setSelectedTemplate(value);
              }}
              onSave={value => {
                props.onselectType(SegmentedButtonsValues.Templates);
                props.onTemplateSelected(
                  value as GetGlobalCalendarProgramListModel,
                );
                props.onTagsSelected([]);
                props.onContactsSelected([]);
                props.onContactTypeSelected([]);

                props.setShown(false);
              }}
            />
          ) : (
            renderEmptyView(t('NoExperiences'))
          )
        ) : SelectedAudienceType?.value ===
          SegmentedButtonsValues.ContactType ? (
          contactTypeList.length > 0 ? (
            <CustomDropDownPopup
              key={'ContactType'}
              loading={false}
              items={contactTypeList}
              displayKey="contactName"
              idKey="contactType"
              selectedMultipleItems={selectedContactTypeList}
              onMultipleItemSelected={(
                value: GetGlobalCalendarContactTypeModel[],
              ) => {
                if (props.selectedTemplate) {
                  setSelectedTemplate(undefined);
                }
                if (props.selectedTagsList) {
                  setSelectedTagList([]);
                }
                if (props.selectedContactsList) {
                  setSelectedContactList([]);
                }
              }}
              mode={DropdownModes.multiple}
              withPopup={false}
              onSave={value => {
                props.onselectType(SegmentedButtonsValues.ContactType);
                props.onContactTypeSelected(
                  value as GetGlobalCalendarContactTypeModel[],
                );
                props.onTagsSelected([]);
                props.onContactsSelected([]);
                props.onTemplateSelected(undefined);
                props.setShown(false);
              }}
            />
          ) : (
            renderEmptyView(t('NoContactTypes'))
          )
        ) : (
          <SkeletonList count={10} style={styles.flatList}>
            <View style={styles.skeletonHeader}>
              <View style={styles.skeletonHeading} />
              <View style={styles.skeletonOptionsItem4} />
            </View>
          </SkeletonList>
        )}
      </View>
    </CustomBottomPopup>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    segmentedBtn: { marginHorizontal: 10 },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    mainSkeleton: {
      width: '100%',
      marginTop: 20,
    },
    headingLaySkeleton: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 10,
      paddingHorizontal: 5,
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
    actionItemTitleSkeleton: {
      height: 10,
      width: '50%',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionItemCheckboxSkeleton: {
      height: 20,
      width: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    actionItemTitleLaySkeleton: { width: '100%', gap: 10 },
    featuredEmptyContainer: {
      height: 150,
    },

    flatList: { flex: 1, height: 300 },
    skeletonHeader: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginTop: 10,
    },
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '80%',
      height: 25,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonOptionsItem4: {
      backgroundColor: theme.colors.surface,
      borderRadius: 30,
      width: '5%',
      height: 25,
      marginTop: 5,
      marginRight: 10,
    },
  });

export default ScheduleTargetAudiencePopup;
