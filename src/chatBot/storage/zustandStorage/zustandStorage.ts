import { mmkvStorage } from '../mmkvStorage';

export const zustandStorage = {
  setItem: (name: string, value: string) => {
    mmkvStorage.set(name, value);
  },
  getItem: (name: string) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    mmkvStorage.delete(name);
  },
};
