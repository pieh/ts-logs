import * as childProcess from "child_process";
import * as path from "path";
import { IPCMessage } from "./types";

const cwd = `/Users/misiek/structured-logging-demo`;

const WAIT_FOR_HANDSHAKE_TIMEOUT = 5000;

const gatsbyBin = path.join(
  cwd,
  `node_modules`,
  `gatsby`,
  `dist`,
  `bin`,
  `gatsby.js`
);

let logMethod: string = undefined;

const gatsbyProcess = childProcess.spawn(gatsbyBin, [`develop`], {
  cwd,
  stdio: [`pipe`, `pipe`, `pipe`, `ipc`],
  env: {
    ...process.env,
    ENABLE_GATSBY_REFRESH_ENDPOINT: "true"
  }
});

const handleStreamData = (stream: string) => (buf: Buffer) => {
  if (!logMethod) {
    // we are not sure yet what method we will use, so we will store messages here
    // and if we don't get ipc handshake in time, we will flush stored messages
  } else if (logMethod === `stream`) {
    // handle message and emit
  }
};

gatsbyProcess.stdout.on(`data`, handleStreamData(`stdout`));
gatsbyProcess.stderr.on(`data`, handleStreamData(`stderr`));

let waitingForIPCHandshake = setTimeout(() => {
  logMethod = `stream`;
  // flushStoredMessages();
}, WAIT_FOR_HANDSHAKE_TIMEOUT);

gatsbyProcess.on("message", (msg: IPCMessage) => {
  if (msg.type === `VERSION`) {
    // this will report gatsby version - might be useful to communicate
    // log actions "version" if/when we do breaking changes in future
    // to shape of actions
    const gatsbyVersion = msg.gatsby;

    logMethod = `ipc`;
    // handshake done - we no longer need to wait for it
    clearTimeout(waitingForIPCHandshake);
  } else if (msg.type === `LOG_ACTION`) {
    const action = msg.action;
    console.log(action);
    if (action.type === `LOG` || action.type === `STATEFUL_LOG`) {
      // simple messages (contain timestamp, level, text fields)
      // see "BaseLogObject" type in "./types.ts"

      if (
        action.payload.level === `ACTIVITY_SUCCESS` ||
        action.payload.level === `ACTIVITY_FAILED` ||
        action.payload.level === `ACTIVITY_INTERRUPTED`
      ) {
        // this will contain extra "duration" and "textStatus" fields that are specific to log entry
        // representing finished/failed/interrupted activity
        // see "ActivityLogObject" type in "./types.ts"
      } else if (action.payload.level === `ERROR`) {
        // see "ErrorLogObject" type in "./types.ts"
      } else {
        // see "GenericLogObject" type in "./types.ts"
      }
    } else if (action.type === `ACTIVITY_START`) {
      /*

      There are 3 types of activities:
       - spinner - represents activities with indeterminate progress
       - progress - represents activities where we can show progress with more details using "current / total"
       - pending - represents activities that Gatsby knows will need to perform, but doesn't need to be shown in UI
                   pending type is mostly for gatsby internals to keep track of global state (idle/working)
      */

      const activity = action.payload;

      // use "activity.id" to keep track of activity between activity related actions

      if (activity.type === `progress`) {
      } else if (activity.type === `spinner`) {
        // has extra "current" and "total" fields
        // activity.current
        // activity.total
      }
    } else if (action.type === `ACTIVITY_END`) {
      // finishes activity specified by "activity.id"
      // this action also have:
      //  - "status" - one of "SUCCESS", "FAILED", "INTERRUPTED".
      //              "INTERRUPTED" will be rare - it will happen during the
      //              production build, when there is irrecoverable error
      //              and we exit process prematurely.
      //  - "duration" - how long activity was running [in seconds]
    } else if (action.type === `ACTIVITY_UPDATE`) {
      // finishes activity specified by "activity.id"
      // this can update any field in activity
      // for now it will mostly update "statusText",
      // and "current"/"total" for progress activities
    } else if (action.type === `SET_STATUS`) {
      // this sets global gatsby status to one
      // of `IN_PROGRESS`, "FAILED", "SUCCESS"
      // we don't emit initial "IN_PROGRESS" status,
      // so be sure to set it initially to equivalent of "IN_PROGRESS"
    }
  }
});
