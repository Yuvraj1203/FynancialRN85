import {zustandStorage} from '@/App';
import {GetUserActiveTemplateModel} from '@/services/models';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

/* zustand state management, different states START */
interface GetActiveSessionDetailByUserIdStoreState {
  selectedTemplate?: GetUserActiveTemplateModel; // selected user group
  setSelectedTemplate: (value?: GetUserActiveTemplateModel) => void; // call this function to set user groups
  templateList?: GetUserActiveTemplateModel[]; // value to user groups in different screens
  setTemplateList: (value?: GetUserActiveTemplateModel[]) => void; // call this function to set user groups

  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useTemplatesStore = create<GetActiveSessionDetailByUserIdStoreState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      selectedTemplate: undefined, // default value
      setSelectedTemplate: (value?: GetUserActiveTemplateModel) => {
        set({selectedTemplate: value});
      },
      templateList: undefined, // default value
      setTemplateList: (value?: GetUserActiveTemplateModel[]) => {
        set({templateList: value}); // set value
      },
      clearAll: () => {
        set({templateList: undefined, selectedTemplate: undefined});
      },
    }),
    {
      name: 'sessionStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useTemplatesStore;
