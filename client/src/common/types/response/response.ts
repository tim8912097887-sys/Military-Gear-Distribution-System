type ApiMeta = {
  timestamp: string;
};

export type ApiSuccessResponse<T> = {
  state: "success";
  error: null;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  state: "error";
  data: null;
  error: {
    code: string;
    message: string;
  };
  meta: ApiMeta;
};
