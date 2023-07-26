import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { schedule } from "@netlify/functions";

const myHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  console.log("Received event:", event);

  return {
    statusCode: 200,
  };
};

const handler = schedule("@daily", myHandler);

export { handler };
