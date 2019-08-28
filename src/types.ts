interface BaseLogObject {
  /**
   * Log text content
   */
  text: string;
  /**
   * Date string using `YYYY-MM-DDTHH:mm:ss.sssZ` format
   */
  timestamp: string;

  /**
   * For stateful logs to keep track which service produced this log
   * (to know which logs to clear)
   */
  group?: string;
}

type GenericLogObject = BaseLogObject & {
  level: "LOG" | "WARNING" | "INFO" | "SUCCESS" | "DEBUG";
};

type ActivityLogObject = BaseLogObject & {
  level: "ACTIVITY_SUCCESS" | "ACTIVITY_FAILED" | "ACTIVITY_INTERRUPTED";
  /**
   * Any additional text meant to be displayed along main "text"
   * Can contain content like "10/10 1.23/s" (as meaningful result of running activity)
   */
  statusText?: string;
  /**
   * Time from start to finish of activity in seconds
   */
  duration: number;

  activity_uuid: string;
  activity_type: string;
  activity_current?: number;
  activity_total?: number;
};

interface Position {
  line: number;
  column?: number;
}

type ErrorLogObject = BaseLogObject & {
  level: `ERROR`;
  /**
   * Error code. Not all errors will have codes, as not all of them have been converted yet.
   */
  code?: string;
  /**
   * General classification of error. At time of writing it, this can be
   * one of `GRAPHQL`, `CONFIG`, `WEBPACK`, `PLUGIN`.
   */
  type?: string;
  /**
   * Absolute path to file originating the error. Not all errors will have this field.
   */
  filePath?: string;
  /**
   * Location of error inside file. Use to generated codeframes together with "filePath".
   * Not all errors will have this field
   */
  location?: {
    start: Position;
    end?: Position;
  };
  /**
   * Link to documentation about handling error ... or "https://gatsby.dev/issue-how-to"
   * for errors that don't have dedicated docs
   */
  docsUrl?: string;

  /**
   * For now this is gatsby internals (it's used to generate "text", by pushing context through error text template).
   * In future this could be used to present dedicated error cards in web UIs.
   */
  context: Record<string, any>;

  // there are 2 fields that I won't type as we don't handle those
  // very well and consistent in gatsby core yet
  // stack
  // error
};

type LogObject = ErrorLogObject | ActivityLogObject | GenericLogObject;

type ActivityStatus =
  | "IN_PROGRESS"
  | "NOT_STARTED"
  | "FAILED"
  | "INTERRUPTED"
  | "SUCCESS";

type GlobalStatus = `IN_PROGRESS` | "FAILED" | "SUCCESS";

type ActivityType = "progress" | "spinner" | "pending" | "hidden";

interface ActivityObject {
  /**
   * Identifier of action. It might be set to same thing as "text" if "id" wasn't explicitely provided.
   */
  id: string;

  /**
   * Unique identifier of activity.
   */
  uuid: string;
  /**
   * One of "progress", "spinner", "pending".
   * "pending" type activities are not meant to be displayed in UI, they are there
   * so gatsby internally can track if there is any more work to be done before going
   * into idle/error state from working state.
   */
  type: ActivityType;
  /**
   * Text description of activity. (i.e. "source and transform nodes" or "building schema")
   */
  text: string;
  /**
   * One of "IN_PROGRESS", "NOT_STARTED", "FAILED", "INTERRUPTED", "SUCCESS"
   * Only "IN_PROGRESS" should be displayed in UI, rest of statuses is for gatsby internals
   */
  status: ActivityStatus;
  /**
   * Any additional text meant to be displayed along main "text"
   * Can contain content like "10/10 1.23/s" (as meaningful result of running activity)
   */
  statusText?: string;

  /**
   * Time from start to finish of activity in seconds
   */
  duration?: number;

  /**
   * Only in `"type": "progress"` - current tick
   */
  current?: number;
  /**
   * Only in `"type": "progress"` - total ticks
   */
  total?: number;
}

interface ActivityUpdatePayload {
  id: string;

  text?: string;
  status?: ActivityStatus;
  type?: ActivityType;
  startTime?: number[];
  statusText?: string;
  current?: number;
  total?: number;
}

interface ActivityEndPayload {
  id: string;

  status: ActivityStatus;
  duration: number;
}

const LOG = "LOG";
const STATEFUL_LOG = `STATEFUL_LOG`;
const CLEAR_STATEFUL_LOG = `CLEAR_STATEFUL_LOG`;
const ACTIVITY_UPDATE = `ACTIVITY_UPDATE`;
const ACTIVITY_START = `ACTIVITY_START`;
const ACTIVITY_END = `ACTIVITY_END`;
const SET_STATUS = `SET_STATUS`;
const SET_LOGS = `SET_LOGS`;

interface LogAction {
  type: typeof LOG;
  payload: LogObject;
}

interface StatefulLogAction {
  type: typeof STATEFUL_LOG;
  payload: LogObject;
}

interface StatefulLogClearAction {
  type: typeof CLEAR_STATEFUL_LOG;
  payload: string;
}

interface ActivityStartAction {
  type: typeof ACTIVITY_START;
  payload: ActivityObject;
}

interface ActivityUpdateAction {
  type: typeof ACTIVITY_UPDATE;
  payload: ActivityUpdatePayload;
}

interface ActivityEndAction {
  type: typeof ACTIVITY_END;
  payload: ActivityEndPayload;
}

interface SetStatusAction {
  type: typeof SET_STATUS;
  payload: GlobalStatus;
}

interface SetLogsAction {
  type: typeof SET_LOGS;
  payload: StateShape;
}

export type Action =
  | LogAction
  | StatefulLogAction
  | StatefulLogClearAction
  | ActivityStartAction
  | ActivityUpdateAction
  | ActivityEndAction
  | SetStatusAction
  | SetLogsAction;

export interface StateShape {
  messages: LogObject[];
  activities: Record<string, ActivityObject>;
  statefulMessages: LogObject[];
  status: GlobalStatus;
}

interface IPCMessageVersion {
  type: `VERSION`;
  gatsby: string;
}

interface IPCMessageLog {
  type: `LOG_ACTION`;
  action: Action;
  /**
   * Date string using `YYYY-MM-DDTHH:mm:ss.sssZ` format
   */
  timestamp: string;
}

export type IPCMessage = IPCMessageVersion | IPCMessageLog;
