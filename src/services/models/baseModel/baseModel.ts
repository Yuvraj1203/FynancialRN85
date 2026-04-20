import {z} from 'zod';

export type BaseModel<T> = {
  result?: T;
  targetUrl?: null;
  success?: boolean;
  error?: ErrorBaseModel;
  unAuthorizedRequest?: boolean;
  __abp?: boolean;
};

export type ErrorBaseModel = {
  code?: number;
  message?: string;
  details?: null;
  validationErrors?: null;
};

export const BaseModelSchema = z.object({
  result: z.any().optional(),
  targetUrl: z.null().optional(),
  success: z.boolean().optional(),
  error: z.null().optional(),
  unAuthorizedRequest: z.boolean().optional(),
  __abp: z.boolean().optional(),
});
