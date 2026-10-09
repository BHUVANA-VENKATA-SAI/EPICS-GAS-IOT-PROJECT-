const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());


// Serve frontend
app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


// Latest sensor data
let latestData = {
    gas: 0,
    latitude: 0,
    longitude: 0,
    status: "NORMAL",
    timestamp: null
};


// Alert cooldown
let lastAlertTime = 0;

const ALERT_COOLDOWN = 30000;


// =================================================
// GET SENSOR DATA
// =================================================

app.get("/api/sensor-data", (req, res) => {

    res.json(latestData);

});


// =================================================
// RECEIVE DATA FROM PYTHON BRIDGE
// =================================================

app.post("/api/sensor-data", async (req, res) => {

    try {

        const {
            gas,
            latitude,
            longitude,
            status
        } = req.body;


        latestData = {

            gas: Number(gas) || 0,

            latitude: Number(latitude) || 0,

            longitude: Number(longitude) || 0,

            status: String(
                status || "NORMAL"
            ).toUpperCase(),

            timestamp: new Date().toISOString()

        };


        console.log("\n-------------------------");

        console.log(
            "Gas:",
            latestData.gas
        );

        console.log(
            "Latitude:",
            latestData.latitude
        );

        console.log(
            "Longitude:",
            latestData.longitude
        );

        console.log(
            "Status:",
            latestData.status
        );

        console.log("-------------------------");


        // Send live data to dashboard
        io.emit(
            "sensor-data",
            latestData
        );


        // =========================================
        // SEND WHATSAPP ALERT
        // =========================================

        if (
            latestData.status === "LEAK"
        ) {

            const now = Date.now();


            if (
                now - lastAlertTime
                >= ALERT_COOLDOWN
            ) {

                await sendWhatsAppAlert(
                    latestData
                );

                lastAlertTime = now;

            }

        }


        res.json({

            success: true,

            data: latestData

        });

    }

    catch (error) {

        console.error(
            "Server error:",
            error.message
        );


        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// =================================================
// GREEN-API WHATSAPP
// =================================================

async function sendWhatsAppAlert(data) {

    try {

        const apiUrl =
            process.env.GREEN_API_URL;

        const idInstance =
            process.env.GREEN_API_ID_INSTANCE;

        const token =
            process.env.GREEN_API_TOKEN;

        const chatId =
            process.env.GREEN_API_CHAT_ID;


        if (
            !apiUrl ||
            !idInstance ||
            !token ||
            !chatId
        ) {

            console.log(
                "GREEN-API configuration missing."
            );

            return;

        }


        const url =
            `${apiUrl}/waInstance` +
            `${idInstance}/sendMessage/` +
            `${token}`;


        const message =
`🚨 GAS LEAKAGE ALERT 🚨

⚠️ Gas leakage detected!

Gas Sensor Value:
${data.gas}

Status:
LEAK

📍 DEVICE LOCATION

Latitude:
${data.latitude}

Longitude:
${data.longitude}

🗺️ Google Maps:
https://www.google.com/maps?q=${data.latitude},${data.longitude}
⚠️ IMMEDIATE SAFETY PRECAUTIONS:

1. Do NOT switch electrical appliances ON or OFF.
2. Do NOT use matches, lighters, or any open flame.
3. Turn OFF the gas regulator if it is safe to do so.
4. Open doors and windows for ventilation.
5. Move people away from the affected area.
6. Avoid using mobile phones near the suspected leak.
7. Contact the gas agency/emergency services if the leakage continues.

Please take immediate safety precautions.`;


        const response =
            await axios.post(

                url,

                {

                    chatId: chatId,

                    message: message,

                    linkPreview: false

                },

                {

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );


        console.log(
            "WhatsApp message sent!"
        );


        console.log(
            "GREEN-API:",
            response.data
        );

    }

    catch (error) {

        if (error.response) {

            console.error(
                "GREEN-API error:",
                error.response.data
            );

        }

        else {

            console.error(
                "WhatsApp error:",
                error.message
            );

        }

    }

}


// =================================================
// SOCKET.IO
// =================================================

io.on("connection", (socket) => {

    console.log(
        "Dashboard connected:",
        socket.id
    );


    // Send latest value
    socket.emit(
        "sensor-data",
        latestData
    );


    socket.on("disconnect", () => {

        console.log(
            "Dashboard disconnected:",
            socket.id
        );

    });

});


// =================================================
// START SERVER
// =================================================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    () => {

        console.log(
            "Server running on http://localhost:3000"
        );

    }
);