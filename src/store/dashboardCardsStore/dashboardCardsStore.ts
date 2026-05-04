import { zustandStorage } from '@/App';
import {
  GetAddeparModel,
  GetAssetAllocationModel,
  GetBDAssetAllocationModel,
  GetClientBasicNetworthModel,
  GetClientBlackDiamondModel,
  GetClientGoalsModel,
  GetClientNitrogenModel,
  GetClientTamaracModel,
  GetClientTotalNetworthModel,
  GetOrionAumModel,
  GetPerformanceSummaryDataModel,
  GetPerformanceTwrModel,
  GetTamaracAccountsModel,
} from '@/services/models';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/* zustand state management, different states START */
interface DashboardCardsState {
  orionTwr?: GetPerformanceTwrModel;
  setOrionTwr: (value?: GetPerformanceTwrModel) => void;
  orionAum?: GetOrionAumModel;
  setOrionAum: (value?: GetOrionAumModel) => void;
  orionAsset?: GetAssetAllocationModel;
  setOrionAsset: (value?: GetAssetAllocationModel) => void;
  orionPs?: GetPerformanceSummaryDataModel;
  setOrionPs: (value?: GetPerformanceSummaryDataModel) => void;
  eMoneyTotalNetWorth?: GetClientTotalNetworthModel;
  setEMoneyTotalNetWorth: (value?: GetClientTotalNetworthModel) => void;
  eMoneyBasicNetWorth?: GetClientBasicNetworthModel;
  setEMoneyBasicNetWorth: (value?: GetClientBasicNetworthModel) => void;
  eMoneyClientGoal?: GetClientGoalsModel;
  setEMoneyClientGoal: (value?: GetClientGoalsModel) => void;
  blackDiamond?: GetClientBlackDiamondModel;
  setBlackDiamond: (value?: GetClientBlackDiamondModel) => void;
  blackDiamonAssetAllocation?: GetBDAssetAllocationModel;
  setBlackDiamonAssetAllocation: (value?: GetBDAssetAllocationModel) => void;
  addeparRORV2?: GetAddeparModel[];
  setAddeparRORV2: (
    value:
      | GetAddeparModel[]
      | ((prev?: GetAddeparModel[]) => GetAddeparModel[]),
  ) => void;
  addeparAUMV2?: GetAddeparModel[];
  setAddeparAUMV2: (
    value:
      | GetAddeparModel[]
      | ((prev?: GetAddeparModel[]) => GetAddeparModel[]),
  ) => void;
  addeparAssetAllocationV2?: GetAddeparModel[];
  setAddeparAssetAllocationV2: (
    value:
      | GetAddeparModel[]
      | ((prev?: GetAddeparModel[]) => GetAddeparModel[]),
  ) => void;
  clientNitrogen?: GetClientNitrogenModel;
  setClientNitrogen: (value?: GetClientNitrogenModel) => void;
  clientTamarac?: GetClientTamaracModel;
  setClientTamarac: (value?: GetClientTamaracModel) => void;
  tamaracAccounts?: GetTamaracAccountsModel;
  setTamaracAccounts: (value?: GetTamaracAccountsModel) => void;

  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useDashboardCardsStore = create<DashboardCardsState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      orionTwr: undefined,
      setOrionTwr: (value?: GetPerformanceTwrModel) => {
        set({ orionTwr: value }); // set value
      },
      orionAum: undefined,
      setOrionAum: (value?: GetOrionAumModel) => {
        set({ orionAum: value }); // set value
      },
      orionAsset: undefined,
      setOrionAsset: (value?: GetAssetAllocationModel) => {
        set({ orionAsset: value }); // set value
      },
      orionPs: undefined,
      setOrionPs: (value?: GetPerformanceSummaryDataModel) => {
        set({ orionPs: value }); // set value
      },
      eMoneyTotalNetWorth: undefined,
      setEMoneyTotalNetWorth: (value?: GetClientTotalNetworthModel) => {
        set({ eMoneyTotalNetWorth: value }); // set value
      },
      eMoneyBasicNetWorth: undefined,
      setEMoneyBasicNetWorth: (value?: GetClientBasicNetworthModel) => {
        set({ eMoneyBasicNetWorth: value }); // set value
      },
      eMoneyClientGoal: undefined,
      setEMoneyClientGoal: (value?: GetClientGoalsModel) => {
        set({ eMoneyClientGoal: value }); // set value
      },
      blackDiamond: undefined,
      setBlackDiamond: (value?: GetClientBlackDiamondModel) => {
        set({ blackDiamond: value }); // set value
      },
      blackDiamonAssetAllocation: undefined,
      setBlackDiamonAssetAllocation: (value?: GetBDAssetAllocationModel) => {
        set({ blackDiamonAssetAllocation: value }); // set value
      },
      addeparRORV2: undefined,
      setAddeparRORV2: value =>
        set({
          addeparRORV2:
            typeof value === 'function' ? value(get().addeparRORV2) : value,
        }),
      addeparAUMV2: undefined,
      setAddeparAUMV2: value =>
        set({
          addeparAUMV2:
            typeof value === 'function' ? value(get().addeparAUMV2) : value,
        }),
      addeparAssetAllocationV2: undefined,
      setAddeparAssetAllocationV2: value =>
        set({
          addeparAssetAllocationV2:
            typeof value === 'function'
              ? value(get().addeparAssetAllocationV2)
              : value,
        }),
      clientNitrogen: undefined,
      setClientNitrogen: (value?: GetClientNitrogenModel) => {
        set({ clientNitrogen: value }); // set value
      },
      clientTamarac: undefined,
      setClientTamarac: (value?: GetClientTamaracModel) => {
        set({ clientTamarac: value }); // set value
      },
      tamaracAccounts: undefined,
      setTamaracAccounts: (value?: GetTamaracAccountsModel) => {
        set({ tamaracAccounts: value }); // set value
      },

      clearAll() {
        set({
          orionTwr: undefined,
          orionAum: undefined,
          orionAsset: undefined,
          orionPs: undefined,
          eMoneyTotalNetWorth: undefined,
          eMoneyBasicNetWorth: undefined,
          eMoneyClientGoal: undefined,
          blackDiamond: undefined,
          addeparRORV2: undefined,
          addeparAUMV2: undefined,
          addeparAssetAllocationV2: undefined,
          clientNitrogen: undefined,
          clientTamarac: undefined,
          tamaracAccounts: undefined,
          blackDiamonAssetAllocation: undefined,
        });
      },
    }),
    {
      name: 'dashboardCardsStorage', // unique name for every store
      version: 2,
      storage: createJSONStorage(() => zustandStorage), // local storage
      migrate: (persistedState: any, version) => {
        // Only migrate from older versions
        if (version < 2) {
          const normalizeToArray = (
            value: unknown,
          ): GetAddeparModel[] | undefined => {
            if (Array.isArray(value)) {
              return value as GetAddeparModel[];
            }

            if (value && typeof value === 'object') {
              return [value as GetAddeparModel];
            }

            return undefined;
          };

          return {
            ...persistedState,
            addeparRORV2: normalizeToArray(persistedState?.addeparRORV2),
            addeparAUMV2: normalizeToArray(persistedState?.addeparAUMV2),
            addeparAssetAllocationV2: normalizeToArray(
              persistedState?.addeparAssetAllocationV2,
            ),
          };
        }

        return persistedState;
      },
    },
  ),
);
/* zustand store creation END */

export default useDashboardCardsStore;
