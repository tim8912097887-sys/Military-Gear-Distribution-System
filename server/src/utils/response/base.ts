export type State = 'success' | 'error';

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
