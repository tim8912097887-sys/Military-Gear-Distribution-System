import { ZodError, ZodObject } from 'zod';
import { BadRequestError } from '../../applications/error/bad-request.js';
import type { ValidatorFunc } from './types.js';

const formatValidatedError = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const fieldPath = issue.path.join('.');
      return fieldPath ? `${fieldPath}: ${issue.message}` : issue.message;
    })
    .join(', ');
};

export const schemaValidator =
  <T>(schema: ZodObject): ValidatorFunc<T> =>
  (data: T) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errorDetail = formatValidatedError(result.error);
      throw new BadRequestError(errorDetail);
    }

    return result.data as T;
  };
