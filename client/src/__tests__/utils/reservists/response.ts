export type State = "success" | "error";

export type ErrorObject = {
  code: string;
  detail: string;
};

export type SuccessResponse<T> = {
  state: State;
  error: null;
  data: T;
  meta: {
    timestamp: string;
  };
};

export type ErrorResponse = {
  state: State;
  error: ErrorObject;
  data: null;
  meta: {
    timestamp: string;
  };
};

export const errorResponse = (error: ErrorObject): ErrorResponse => {
  return {
    state: "error",
    error,
    data: null,
    meta: { timestamp: new Date().toISOString() },
  };
};

export const successResponse = <T>(data: T): SuccessResponse<T> => {
  return {
    state: "success",
    error: null,
    data,
    meta: { timestamp: new Date().toISOString() },
  };
};
