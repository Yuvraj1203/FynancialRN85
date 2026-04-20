import { zustandStorage } from "@/App";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/* zustand state management, different states START */
interface AppLoaderState {
  shown: boolean; // value to show loader
  showLoader: () => void; // call this function to show loader
  hideLoader: () => void; // call this function to hide loader
}
/* zustand state management, different states END */

/* zustand store creation START */
const useLoaderStore = create<AppLoaderState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      shown: false, // default value
      showLoader: () => {
        set({ shown: true }); // set value
      },
      hideLoader: () => {
        set({ shown: false }); // set value
      },
    }),
    {
      name: "loaderStorage", // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    }
  )
);
/* zustand store creation END */

export default useLoaderStore;
