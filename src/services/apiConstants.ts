export const ApiConstants = {
  LoginApi: 'posts',
  GetReferaFriendInfo: 'api/services/app/referral/getreferafriendinfo',
  GetAllUserReferrals: 'api/services/app/referral/getAllUserReferralsNew',
  GetUserCoachMappingForClient:
    'api/services/app/usercoachmapping/getusercoachmappingforclient',
  AuthenticateViaAuth0: 'api/TokenAuth/AuthenticateViaAuth0',
  Authenticate: 'api/TokenAuth/authenticate',
  RefreshToken: 'api/tokenauth/refreshtoken',
  GetUserDetailForProfile:
    'api/services/app/userdetails/getuserdetailforprofile',
  GetTenantIdByName: 'api/services/app/User/gettenantidbyname',
  GetTenantByUserEmail: 'api/services/app/User/GetTenantByUserEmail',
  CheckVersion: 'api/services/app/account/checkversion',
  UpdateLastSignInForUser:
    'api/services/app/commonlookup/updatelastsigninforuser',
  CreateOrEdit: 'api/services/app/userdevicelog/createoredit',
  EnrollInvitedUserInTemplate:
    'api/services/app/commonorder/enrollinviteduserintemplate',
  DeleteByUdid: 'api/services/app/userdevicelog/deletebyudid',

  GetUsersByGroupIdForTag:
    'api/services/app/feeddetails/getusersbygroupidfortag',
  GetLikeByUserList: 'api/services/app/feeddetails/getlikebyuserlist',
  GetAgreementMaster: 'api/services/app/agreementmasters/getagreementmaster',
  AgreementCreateOrEdit: 'api/services/app/agreementmappings/createoredit',
  GetIsAskCoachEnable:
    'api/services/app/programenrollments/GetIsAskCoachEnable',
  GetUserForChat2: 'api/services/app/chat/GetUserForChat2',
  ContactUS: 'api/services/app/account/contactus',
  GetContentallCollectionsAndFilesbyProgsessionid:
    'api/services/app/categories/getcontentfilesbyprogsessionid',
  GetFeaturedResourceForContactDashboard:
    'api/services/app/featuredresources/getfeaturedresourceforcontactdashboard',
  GetCategories:
    'api/services/app/categories/getcontentcategoriesbyprogsessionid',
  GetClientFaqData: 'api/services/app/faqs/getclientfaqdata',
  GetAll: 'api/services/app/supportcategories/getall',
  TicketsCreateOrEdit: 'api/services/app/tickets/createoredit',
  GetFriendsForGroupV2: 'api/services/app/chat/GetFriendsForGroupV2',
  GetUserChatMessages: 'api/services/app/chat/GetUserChatMessages',
  MarkAllUnreadMessagesOfUserAsRead:
    'api/services/app/chat/markallunreadmessagesofuserasread',
  GetUserContentForDashboard:
    'api/services/app/DocumentMappings/GetUserContentForDashboard',
  GetUserActiveTemplate:
    'api/services/app/contactdashboard/getuseractivetemplate',
  ExternalAuthenticate: 'api/TokenAuth/externalauthenticatev2',
  GetUserNotificationUnreadCount:
    'api/services/app/customnotification/getusernotificationunreadcount',
  GetFeedHasNewInfo: 'api/services/app/useractivitylogs/getfeedhasnewinfo',
  GetTopAssignedAction: 'api/services/app/useractions/GetTopAssignedAction',
  GetAllUserAction: 'api/services/app/useractions/GetAllUserAction',
  UpdateStatus: 'api/services/app/useractions/updatestatus',
  GetCardsForUserDashboard:
    'api/services/app/dashboardsliders/getCardsForUserDashboard',
  Getadvisorexperiencecard:
    'api/services/app/contactdashboard/getadvisorexperiencecard',
  Getcommunitytemplatecard:
    'api/services/app/contactdashboard/getcommunitytemplatecard',

  GetPerformanceSummaryData:
    'api/services/app/OrionApi/getPerformanceSummaryData',
  GetAssetAllocation: 'api/services/app/OrionApi/getAssetAllocation',
  GetOrionAUM: 'api/services/app/OrionApi/getOrionAUM',
  GetPerformanceTWR: 'api/services/app/OrionApi/getPerformanceTWR',
  GetUserProgramSessionReminders:
    'api/services/app/remindertasks/getuserprogramsessionreminders',
  GetUserProgramSessionEvents:
    'api/services/app/programevents/getuserprogramsessionevents',
  GetEventsForEdit: 'api/services/app/eventses/geteventsforedit',

  // Add Schedule
  GetCalItemtags:
    'api/services/app/GlobalCalendarItemTagMappings/GetCalItemtags',
  getAllUsersForGlobalCalendar:
    'api/services/app/GlobalCalendarItemTagMappings/getAllUsersForGlobalCalendar',
  GetGlobalCalendarProgramList:
    'api/services/app/GlobalCalendarItemTagMappings/GetGlobalCalendarProgramList',
  SaveGlobalCalendarAndEventData:
    'api/services/app/GlobalCalendarDatas/saveGlobalCalendarAndEventData',
  saveGlobalCalendarAndReminderData:
    'api/services/app/GlobalCalendarDatas/saveGlobalCalendarAndReminderData',
  GetGlobalEventForEdit:
    'api/services/app/GlobalCalendarDatas/getGlobalEventForEdit',
  GetGlobalReminderForEdit:
    'api/services/app/GlobalCalendarDatas/getGlobalReminderForEdit',
  GetAllReminderType: 'api/services/app/ReminderTypes/GetAllReminderType',
  Sendmessage: 'api/services/app/chat/sendmessage',
  CreateGroupAndAddMembers: 'api/services/app/chat/CreateGroupAndAddMembers',
  RemoveUserFromGroup: 'api/services/app/chat/RemoveUserFromGroup',
  RemoveGroup: 'api/services/app/chat/RemoveGroup',
  GetFilterUserForChat: 'api/services/app/chat/GetFilterUserForChat',
  uploadfiletos3returnpath:
    'api/services/app/contentdatas/uploadfiletos3returnpath',
  uploadFileToS3: 'api/services/app/contentdatas/uploadfiletos3',
  Getfilefroms3: 'api/services/app/aws/getfilefroms3',
  getEventsForUser: 'api/services/app/eventses/getEventsForUser',
  // Getallposts: 'api/services/app/feeddetails/getallposts',
  GetAdvisorExperienceFeed:
    'api/services/app/feeddetails/getadvisorexperiencefeed',
  GetCommunityTemplateFeed:
    'api/services/app/feeddetails/GetCommunityTemplateFeed',
  GetMemberListForForum: 'api/services/app/feeddetails/getmemberlistforforum',
  GetAllComments: 'api/services/app/feeddetails/getallcomments',
  LikePost: 'api/services/app/feeddetails/likepost',
  LikeComment: 'api/services/app/feeddetails/likeComment',
  CreateorEditcomment: 'api/services/app/feeddetails/createoreditcommentV2',
  DeletePost: 'api/services/app/feeddetails/deletepost',
  SetFeedActivityLog: 'api/services/app/useractivitylogs/setfeedactivitylog',
  sendPasswordResetCode: 'api/services/app/account/sendpasswordresetcode',
  createOrEditUserProfileData:
    'api/services/app/userdetails/createoredituserprofiledata',
  GetUserNotes: 'api/services/app/CustomerNote/GetUserNotes',
  GetAllClients: 'api/services/app/User/GetAllClients',
  GetUserPersonalInfo: 'api/services/app/userdetails/getUserPersonalInfo',
  GetUserContactInfo: 'api/services/app/userdetails/getUserContactInfo',
  GetAllStateForLookUpTable:
    'api/services/app/userdetails/getallstateforlookuptable',
  CreateOrEditNotes: 'api/services/app/CustomerNote/createoredit',
  UpdateDOB: 'api/services/app/userdetails/updateDOB',
  GetVaultItemsList: 'api/services/app/EMoneyApi/getVaultItemsList',
  GetVaultFile: 'api/services/app/EMoneyApi/getVaultFile',
  GetClientTotalNetworth: 'api/services/app/EMoneyApi/getClientTotalNetworth',
  GetClientBlackDiamond:
    'api/services/app/blackDiamondApi/getClientBlackDiamond',
  GetBDAssetAllocation: 'api/services/app/blackDiamondApi/getBDAssetAllocation',
  GetClientBasicNetworth: 'api/services/app/EMoneyApi/getClientBasicNetworth',
  GetAddeparAssetAllocationV2:
    'api/services/app/AddeparApi/GetAddeparAssetAllocationV2',
  GetAddeparAUMV2: 'api/services/app/AddeparApi/GetAddeparAUMV2',
  GetAddeparRORV2: 'api/services/app/AddeparApi/GetAddeparRORV2',

  GetClientNitrogen: 'api/services/app/nitrogenapi/getclientnitrogen',
  GetClientTamarac: 'api/services/app/TamaracApi/getclienttamarac',
  GetTamaracAccounts: 'api/services/app/TamaracApi/getTamaracAccounts',
  SaveUserPersonalInfo: 'api/services/app/userdetails/saveUserPersonalInfo',
  SaveUserContactInfo: 'api/services/app/userdetails/saveUserContactInfo',
  CreateOrEditPost: 'api/services/app/feeddetails/createoreditpostV2',
  Getforumbyid: 'api/services/app/feeddetails/getforumbyid',
  Getallforums: 'api/services/app/feeddetails/getallforums',
  Enabledisable: 'api/services/app/feeddetails/enabledisable',
  GetFeedDetailForEdit: 'api/services/app/feeddetails/getfeeddetailforedit',
  GetPostDetailForEdit: 'api/services/app/feeddetails/getPostDetailForEdit',
  GetPostById: 'api/services/app/feeddetails/getpostbyid',
  saveUserPersonalInfo: 'api/services/app/userdetails/saveUserPersonalInfo',
  saveUserContactInfo: 'api/services/app/userdetails/saveUserContactInfo',
  GetScheduleTasksForGlobalCalendar:
    'api/services/app/GlobalCalendarDatas/getScheduleTasksForGlobalCalendar',
  DeleteGlobalCalTask:
    'api/services/app/GlobalCalendarDatas/deleteglobalcaltask',
  GetGlobalPostForEdit:
    'api/services/app/GlobalCalendarDatas/getGlobalPostForEdit',
  GetGlobalActionItemForEdit:
    'api/services/app/GlobalCalendarDatas/getGlobalActionItemForEdit',
  GetGlobalMessageForEdit:
    'api/services/app/GlobalCalendarDatas/getglobalmessageforedit',
  GetAllActionItemsList: 'api/services/app/ActionItems/GetAllActionItemsList',
  SaveActionItems: 'api/services/app/useractions/saveActionItems',
  SaveGlobalCalendarMessageData:
    'api/services/app/GlobalCalendarDatas/saveglobalcalendarmessagedata',
  SaveGlobalCalendarAndActionItemData:
    'api/services/app/GlobalCalendarDatas/saveGlobalCalendarAndActionItemData',
  GetNotificationList:
    'api/services/app/customnotification/getnotificationlist',
  GetNotificationDetail:
    'api/services/app/customnotification/getnotificationdetail',
  SetNotificationAsRead: 'api/services/app/notification/setnotificationasread',
  SetAllNotificationsAsRead:
    'api/services/app/notification/setallnotificationsasread',
  DeleteActionItems: 'api/services/app/useractions/deleteActionItems',
  SendActionReminder: 'api/services/app/useractions/sendActionReminder',
  GetUserActionItemForEdit:
    'api/services/app/useractions/GetUserActionItemForEdit',
  GetVaultFilesAndFolders:
    'api/services/app/TamaracApi/getVaultFilesAndFolders',
  GetTamaracFiles3URL: 'api/services/app/TamaracApi/getTamaracFiles3URL',
  CheckIfUserIsEnrolled:
    'api/services/app/programenrollments/CheckIfUserIsEnrolled',
  CancelAllEnrollment:
    'api/services/app/programenrollments/CancelAllEnrollment',
  DeleteUser: 'api/services/app/User/DeleteUser',
  GetActiveSessionForUserNew:
    'api/services/app/programenrollments/getActiveSessionForUserNew',
  SaveGlobalCalendarAndPostData:
    'api/services/app/GlobalCalendarDatas/saveCalendarAndPostData',
  PostImageMappings: 'api/services/app/postimagemappings/delete',
  deleteNotes: 'api/services/app/CustomerNote/delete',
  GetCommunityTemplateList:
    'api/services/app/Programs/GetCommunityTemplateList',

  GetProgramSessionList:
    'api/services/app/programSessions/getProgramSessionList',
  // GetReminderById: 'api/services/app/remindertasks/getreminderbyid',
  GetExperienceEvents: 'api/services/app/eventses/getexperienceevents',
  GetCommunityTemplateEvents:
    'api/services/app/eventses/getcommunitytemplateevents',
  GetAdvisorExperienceFeaturedResource:
    'api/services/app/contactdashboard/getadvisorexperiencefeaturedresource',
  GetCommunityTemplateFeaturedResource:
    'api/services/app/contactdashboard/getcommunitytemplatefeaturedresource',
  GetAdvisorExperienceResource:
    'api/services/app/contactdashboard/getadvisorexperienceresource',
  GetAdvisorExperienceSubCategory:
    'api/services/app/contactdashboard/getadvisorexperiencesubcategory',
  GetAdvisorExperienceResourceContent:
    'api/services/app/contactdashboard/getadvisorexperienceresourcecontent',
  GetCommunityTemplateResource:
    'api/services/app/contactdashboard/getcommunitytemplateresource',
  GetCommunityTemplateSubCategory:
    'api/services/app/contactdashboard/getcommunitytemplatesubcategory',
  GetCommunityTemplateResourceContent:
    'api/services/app/contactdashboard/getcommunitytemplateresourcecontent',
  GetAdvisorExperienceReminder:
    'api/services/app/contactdashboard/getadvisorexperiencereminder',
  GetCommunityTemplateReminder:
    'api/services/app/contactdashboard/getcommunitytemplatereminder',
  GetReminderById: 'api/services/app/contactdashboard/getreminderbyid',
  GetGlobalCalendarContactType:
    'api/services/app/GlobalCalendarItemTagMappings/GetGlobalCalendarContactType',
  GetProfilePicture: 'api/services/app/Chat/GetProfilePicture',

  GetResourceTypes: 'api/services/app/FeedDetails/GetResourceTypes',
  GetResourceFoldersForDropdown:
    'api/services/app/ResourceFolders/GetResourceFoldersForDropdown',
  GetListOfDocumentsForFeed:
    'api/services/app/Documents/GetListOfDocumentsForFeed',
  GetTimeZone: 'api/services/app/tsettings/gettimezone',
  UpdateOnboardingJourney: 'api/services/app/UserDetails/updateonboarding',
  GetCurrentStatus: 'api/services/app/UserMessageStatus/GetCurrentStatus',
  ChangeStatus: 'api/services/app/UserMessageStatus/ChangeStatus',
  DeleteOutOfOffce: 'api/services/app/UserMessageStatus/DeleteOutOfOffce',
  GetAllFeedPlaceholderFields:
    'api/services/app/GlobalCalendarDatas/GetAllFeedPlaceholderFields',
  GetUnseenThreadCount:
    'api/services/app/PushNotification/GetUnseenThreadCount',
  UpdateNotificationBellCount:
    'api/services/app/PushNotification/UpdateNotificationBellCount',
  GetUserNotifications: 'api/services/app/Notification/GetUserNotifications',
  GetFoldersForUsers: 'api/services/app/SecureFolders/GetFoldersForUsers',
  GetFileAndBreadcrumb: 'api/services/app/SecureFolders/GetFileAndBreadcrumb',
  GetFoldersAndFilesByParentId:
    'api/services/app/SecureFolders/GetFoldersAndFilesByParentId',
  UploadSecureFile: 'api/services/app/SecureFolders/UploadSecureFile',

  UserDocumentsDelete: 'api/services/app/UserDocuments/Delete',
  OktaAuthenticate: 'api/TokenAuth/OktaAuthenticate',
  GetGlobalGroupMessageForEdit:
    'api/services/app/GlobalCalendarDatas/getGlobalGroupMessageForEdit',
  SaveGlobalCalendarGroupMessageData:
    'api/services/app/GlobalCalendarDatas/saveGlobalCalendarGroupMessageData',
  UploadFileListToS3: 'api/services/app/ContentDatas/UploadFileListToS3',
  SendSlientNotificationOnLogin:
    'api/services/app/PushNotification/SendSlientNotificationOnLogin',
  getUserTeamListForTag: 'api/services/app/FeedDetails/getUserTeamListForTag',
  GetAllUserCertificates:
    'api/services/app/UserCertificates/GetAllUserCertificates',
  SaveLicenseCertificate: 'api/services/app/UserCertificates/CreateOrEdit',

  DeleteLicenseCertificate: 'api/services/app/UserCertificates/Delete',
  GetMemberListForCommunityTagging:
    'api/services/app/FeedDetails/GetMemberListForCommunityTagging',
  GetLinkPreviewHTML: 'api/services/app/Common/GetLinkPreviewHTML',
  ResetPassword: 'api/services/app/User/ResetPassword',
  SaveAdvisorPersonalDetails:
    'api/services/app/UserDetails/saveAdvisorPersonalDetails',
  GetConnection: 'api/services/app/UserVendorData/GetConnection',
  GetAccounts: 'api/services/app/UserVendorData/getAccounts',
  GetAccountHoldings: 'api/services/app/UserVendorData/getAccountHoldings',
  GetAccountTransactions:
    'api/services/app/UserVendorData/getAccountTransactions',
  GetTimePeriods: 'api/services/app/UserVendorData/GetTimePeriods',

  ChatBotBaseUrl: 'https://fynancial.aicrisk.com/',
  ChatBotUserId: 'f28fb2cd-741c-4d1c-9da5-7cae37afe748',
  ChatBotClientId: '396c1b66-6675-4ab7-8cfd-f7f39c8fa59e',
  ChatBotClientSecret: 'AI-3Z8rApqoEiTMDBX6Q7fSs5LeQ3v9X',
  ChatBotRedirectUri: 'http://localhost:8081/callback',

  GetFynancialCode: 'https://fynancial.aicrisk.com/api/oauth2',
  ChatBotAccessToken: 'api/oauth2/Token',
  GetConversations: 'api/Chat/GetConversations',
  ListAgents: 'api/Chat/ListAgents',
  AskAgent: 'https://fynancial.aicrisk.com/api/Chat/AskAgent',
  CreateConversation: 'api/Chat/CreateConversation',
  GetConversation: 'api/Chat/GetConversation/',
  SubmitFeedback: 'api/Chat/SubmitFeedback',
  UploadFileToConversationUri: 'api/Chat/AddFileToConversation/:conversationId',
};
