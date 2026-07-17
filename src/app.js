const express = require("express");
const cors = require("cors");

const authRoutes     = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const versionRoutes  = require("./routes/versionRoutes");
const projectRoutes  = require("./routes/projectRoutes");
const folderRoutes   = require("./routes/folderRoutes");
const commentRoutes  = require("./routes/commentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/versions", versionRoutes);
app.use("/projects", projectRoutes);
app.use("/folders", folderRoutes);
app.use("/comments", commentRoutes);

// Serve o frontend estático (public/index.html, login.html, editor.html, etc.)
app.use(express.static(require("path").join(__dirname, "..", "public")));

module.exports = app;