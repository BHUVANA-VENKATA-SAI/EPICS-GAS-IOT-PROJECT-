const socket = io();


const connectionDot =
    document.getElementById(
        "connectionDot"
    );


const connectionText =
    document.getElementById(
        "connectionText"
    );


const status =
    document.getElementById(
        "status"
    );


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const statusIcon =
    document.getElementById(
        "statusIcon"
    );


const alertBox =
    document.getElementById(
        "alertBox"
    );


const gasLevel =
    document.getElementById(
        "gasLevel"
    );


const gasStatus =
    document.getElementById(
        "gasStatus"
    );


const latitude =
    document.getElementById(
        "latitude"
    );


const longitude =
    document.getElementById(
        "longitude"
    );


const latDisplay =
    document.getElementById(
        "latDisplay"
    );


const lonDisplay =
    document.getElementById(
        "lonDisplay"
    );


const mapLink =
    document.getElementById(
        "mapLink"
    );


const timestamp =
    document.getElementById(
        "timestamp"
    );


// ===============================================
// CONNECTED
// ===============================================

socket.on("connect", () => {

    connectionText.textContent =
        "Connected to Server";

    connectionDot.style.background =
        "green";

});


// ===============================================
// DISCONNECTED
// ===============================================

socket.on("disconnect", () => {

    connectionText.textContent =
        "Disconnected from Server";

    connectionDot.style.background =
        "red";

});


// ===============================================
// RECEIVE SENSOR DATA
// ===============================================

socket.on(
    "sensor-data",
    (data) => {

        console.log(
            "Sensor Data:",
            data
        );


        // Gas

        gasLevel.textContent =
            Number(data.gas).toFixed(0);


        // Status

        updateStatus(
            data.status
        );


        // GPS

        const lat =
            Number(data.latitude);

        const lon =
            Number(data.longitude);


        latitude.textContent =
            lat.toFixed(6);

        longitude.textContent =
            lon.toFixed(6);


        latDisplay.textContent =
            lat.toFixed(6);

        lonDisplay.textContent =
            lon.toFixed(6);


        // Google Maps

        if (
            lat !== 0 &&
            lon !== 0
        ) {

            mapLink.href =
                `https://www.google.com/maps?q=${lat},${lon}`;

        }


        // Timestamp

        if (data.timestamp) {

            const date =
                new Date(
                    data.timestamp
                );

            timestamp.textContent =
                date.toLocaleString();

        }

    }
);


// ===============================================
// STATUS
// ===============================================

function updateStatus(
    currentStatus
) {

    const value =
        String(
            currentStatus ||
            "NORMAL"
        ).toUpperCase();


    status.textContent =
        value;


    gasStatus.textContent =
        value;


    alertBox.classList.remove(
        "normal",
        "leak"
    );


    // NORMAL

    if (
        value === "NORMAL"
    ) {

        alertBox.classList.add(
            "normal"
        );


        statusIcon.textContent =
            "✓";


        statusMessage.textContent =
            "No gas leakage detected.";

    }


    // LEAK

    else if (
        value === "LEAK"
    ) {

        alertBox.classList.add(
            "leak"
        );


        statusIcon.textContent =
            "⚠";


        statusMessage.textContent =
            "Gas leakage detected! Take immediate safety precautions.";

    }


    // UNKNOWN

    else {

        alertBox.classList.add(
            "normal"
        );


        statusIcon.textContent =
            "?";


        statusMessage.textContent =
            "Monitoring sensor...";

    }

}