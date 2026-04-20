type Json$1 = {
  error?: string;
  error_description?: string;
  code?: string;
};

export type Auth0Error = {
  name?: string;
  message?: string;
  type?: string;
  json?: Json$1;
  status?: number;
};
