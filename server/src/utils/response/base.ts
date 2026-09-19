export type State = 'success' | 'error';

export type ErrorObject = {
  code: string;
  detail: string;
};

export type Data = null | any;

export type SuccessResponse = {
  state: State;
  error: null;
  data: Data;
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
