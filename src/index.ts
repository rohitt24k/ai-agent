import { config } from "dotenv";
import express from "express";

config();

import agentRoutes from "./routes/agent";
import ragRoutes from "./routes/rag";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use("/agent", agentRoutes);

app.use("/rag", ragRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

export default app;
