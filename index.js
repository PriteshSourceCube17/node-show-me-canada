const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require('dotenv').config();
const morgan = require("morgan");
const socket = require("socket.io")
const { setupConnection } = require("./controllers/chat/socket")
const errorMiddleware = require("./middleware/Error");
const connectDatabase = require("./config/connect");
const router = require("./routes");
const expireSubscription = require("./scripts/expiredSubscription")
const cron = require("node-cron");
const app = express();

app.use(express.json())
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan('dev'));

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.status(200).json({ status: 200, success: true, message: "working finely" })
});
app.use("/api/v1", router);

app.use((req, res, next) => {
    res.status(404).json({ status: 404, success: false, message: "Page not found on the server" });
})
app.use(errorMiddleware);

connectDatabase()
const server = app.listen(process.env.port, async () => {
    try {
        console.log(`Server is listing on http://localhost:${port}`)
        // await connectDatabase()
    } catch (error) {
        console.log(`Something is wrong`);
    }
});

const io = socket(server, {
    cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"],
    },
})
io.on("connection", async (socket) => {
    console.log("A user connected", socket.id)
    await setupConnection(io, socket)
})

// currently not in use
// cron job for expire subscription plan
// cron.schedule("0 0 0 * * *", function () {
//     console.log("Every 12 AM");
//     expireSubscription();
// });

process.on("unhandledRejection", (err) => {
    console.log("Error inside the unhandledrejection ========>", err)
    console.log(`Error:${err.message}`);
    console.log(`Shutting down due to unhandled promise rejection ========>`);
});
