import { isAfter } from 'date-fns/isAfter';
import { isSameDay } from 'date-fns/isSameDay';
import { isSameYear } from 'date-fns/isSameYear';
import { subDays } from 'date-fns/subDays';

import { IChatInfo } from '../../common/models/interfaces/chat-info';

export enum EChatGroupTitles {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Last7Days = 'Last 7 Days',
  Last30Days = 'Last 30 Days',
  ThisYear = 'This Year',
  Earlier = 'Earlier',
}

export interface IChatsGroups {
  [EChatGroupTitles.Today]: IChatInfo[];
  [EChatGroupTitles.Yesterday]: IChatInfo[];
  [EChatGroupTitles.Last7Days]: IChatInfo[];
  [EChatGroupTitles.Last30Days]: IChatInfo[];
  [EChatGroupTitles.ThisYear]: IChatInfo[];
  [EChatGroupTitles.Earlier]: IChatInfo[];
}

export interface IChatsGroupHeader {
  type: 'header';
  id: string;
  label: EChatGroupTitles;
}

export type ListOfChatsItemInfo = IChatInfo | IChatsGroupHeader;

export const groupChatsByDate = (chats: IChatInfo[]): ListOfChatsItemInfo[] => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const sevenDaysAgo = subDays(today, 7);
  const thirtyDaysAgo = subDays(today, 30);

  const groupedChats: IChatsGroups = {
    [EChatGroupTitles.Today]: [],
    [EChatGroupTitles.Yesterday]: [],
    [EChatGroupTitles.Last7Days]: [],
    [EChatGroupTitles.Last30Days]: [],
    [EChatGroupTitles.ThisYear]: [],
    [EChatGroupTitles.Earlier]: [],
  };

  chats.forEach((chat: IChatInfo) => {
    if (!chat.lastUpdated) {
      groupedChats[EChatGroupTitles.Earlier].push(chat);
      return;
    }

    const chatDate = new Date(chat.lastUpdated);

    if (isAfter(chatDate, today)) {
      return;
    }

    if (isSameDay(chatDate, today)) {
      groupedChats[EChatGroupTitles.Today].push(chat);
    } else if (isSameDay(chatDate, yesterday)) {
      groupedChats[EChatGroupTitles.Yesterday].push(chat);
    } else if (isAfter(chatDate, sevenDaysAgo)) {
      groupedChats[EChatGroupTitles.Last7Days].push(chat);
    } else if (isAfter(chatDate, thirtyDaysAgo)) {
      groupedChats[EChatGroupTitles.Last30Days].push(chat);
    } else if (isSameYear(chatDate, today)) {
      groupedChats[EChatGroupTitles.ThisYear].push(chat);
    } else {
      groupedChats[EChatGroupTitles.Earlier].push(chat);
    }
  });

  const formattedData: ListOfChatsItemInfo[] = [];

  Object.values(EChatGroupTitles).forEach((label: EChatGroupTitles) => {
    const group: IChatInfo[] = groupedChats[label];
    if (group.length > 0) {
      group.sort(
        (a: IChatInfo, b: IChatInfo) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );

      formattedData.push({
        type: 'header',
        id: `header-${label}`,
        label,
      } as IChatsGroupHeader);

      formattedData.push(...group);
    }
  });

  return formattedData;
};
