import "dotenv/config";
import { Inngest } from "inngest";

if (!process.env.INNGEST_EVENT_KEY) {
  console.warn(
    "WARNING: INNGEST_EVENT_KEY is not set. Inngest event dispatch will fail until the event key is configured.",
  );
}

export const inngest = new Inngest({ id: "ticketing-system" });
