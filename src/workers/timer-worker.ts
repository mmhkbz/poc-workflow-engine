import { Job, Worker } from "bullmq";
import { redis } from "../libs/redis";

const timerWorker = new Worker(
  "timer",
  async (job: Job) => {
    console.log("Processing timer job:", job.data);
    // Add your timer logic here (e.g., trigger an event after a delay)
  },
  { connection: redis }
);

export { timerWorker };
