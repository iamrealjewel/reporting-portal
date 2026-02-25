import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import roleRoutes from "./routes/roles";
import permissionRoutes from "./routes/permissions";
import stockRoutes from "./routes/stock";
import salesRoutes from "./routes/sales";
import jobRoutes from "./routes/jobs";
import analyticsRoutes from "./routes/analytics";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve frontend static files in production
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Catch-all route to serve the React app for all other requests
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
