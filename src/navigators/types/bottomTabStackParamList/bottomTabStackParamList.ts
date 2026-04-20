import { ContactListingProps } from '@/screens/contactListing/contactListing';
import { DashBoardProps } from '@/screens/dashboard/dashboard';
import { FeedProps } from '@/screens/feed/feed';
import { ProfileProps } from '@/screens/profile/profile';
import { SubNavigator } from '@/utils/navigationUtils';
import { ChatBotStackParamList } from '../chatbotStackParamList/chatbotStackParamList';

export type BottomTabStackParamList = {
  Dashboard: DashBoardProps | undefined; // My Group stack
  Feed: FeedProps | undefined;
  Resources: undefined;
  Message: undefined;
  ContactListing: ContactListingProps | undefined;
  AdvisorProfile: undefined;
  ContactProfile: ProfileProps | undefined;
  EventViewAll: undefined;
  ChatBotRoutes: SubNavigator<ChatBotStackParamList>;
};
