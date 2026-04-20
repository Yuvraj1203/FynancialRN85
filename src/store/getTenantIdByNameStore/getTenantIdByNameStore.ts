import {zustandStorage} from '@/App';
import {GetTenantIdByNameModel} from '@/services/models';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

/* zustand state management, different states START */
interface GetTenantIdByNameState {
  tenantDetails?: GetTenantIdByNameModel; // value to Access Tenant Detail in different screens
  setTenantDetails: (value?: GetTenantIdByNameModel) => void; // call this function to set Tenant Details
}
/* zustand state management, different states END */

/* zustand store creation START */
const useGetTenantIdByNameStore = create<GetTenantIdByNameState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      tenantDetails: undefined, // default value
      setTenantDetails: (value?: GetTenantIdByNameModel) => {
        set({tenantDetails: value}); // set value
      },
    }),
    {
      name: 'getTenantIdByNameStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useGetTenantIdByNameStore;
