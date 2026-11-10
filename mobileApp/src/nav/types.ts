export type AuthStackParamList = {
  Auth: undefined;
  Reset: { token?: string } | undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  History: undefined;
  Config: undefined;
  Schemas: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  Connect: undefined;
  EditDb: { id: string };
  Profile: undefined;
};
