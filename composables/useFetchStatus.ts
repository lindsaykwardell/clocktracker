export enum Status {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type FetchStatus<T> =
  | { status: Status.IDLE }
  | { status: Status.LOADING }
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; error: any };
