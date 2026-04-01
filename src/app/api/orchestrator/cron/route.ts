import cron from "node-cron";

cron.schedule("*/1 * * * *", async () => {
  await fetch("http://localhost:3000/api/orchestrator/run", {
    method: "POST",
  });
});