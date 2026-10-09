import serial
import requests
import re
import time


# =================================================
# SETTINGS
# =================================================

SERIAL_PORT = "COM5"

BAUD_RATE = 115200

BACKEND_URL = "http://localhost:3000/api/sensor-data"


# =================================================
# CONNECT TO ESP32
# =================================================

try:

    esp32 = serial.Serial(
        SERIAL_PORT,
        BAUD_RATE,
        timeout=1
    )

    print(
        f"Connected to ESP32 on {SERIAL_PORT}"
    )

except Exception as e:

    print("ERROR: Could not connect to ESP32.")

    print(e)

    exit()


print()
print("===================================")
print("   GAS LEAK PYTHON BRIDGE")
print("===================================")
print()


# =================================================
# PARSE ESP32 SERIAL DATA
# =================================================

def parse_data(line):

    pattern = (
        r"GAS:(-?\d+(?:\.\d+)?),"
        r"LAT:(-?\d+(?:\.\d+)?),"
        r"LON:(-?\d+(?:\.\d+)?),"
        r"STATUS:(NORMAL|LEAK)"
    )


    match = re.search(
        pattern,
        line
    )


    if not match:

        return None


    gas = float(
        match.group(1)
    )

    latitude = float(
        match.group(2)
    )

    longitude = float(
        match.group(3)
    )

    status = match.group(4)


    return {

        "gas": gas,

        "latitude": latitude,

        "longitude": longitude,

        "status": status

    }


# =================================================
# SEND DATA TO NODE.JS
# =================================================

def send_to_backend(data):

    try:

        response = requests.post(

            BACKEND_URL,

            json=data,

            timeout=3

        )


        if response.status_code == 200:

            print(
                "✓ Data sent to backend"
            )

        else:

            print(
                "✗ Backend error:",
                response.status_code
            )


    except requests.exceptions.RequestException as e:

        print(
            "✗ Cannot connect to backend:",
            e
        )


# =================================================
# MAIN LOOP
# =================================================

while True:

    try:

        line = (
            esp32.readline()
            .decode(
                "utf-8",
                errors="ignore"
            )
            .strip()
        )


        if not line:

            continue


        print(
            "ESP32:",
            line
        )


        data = parse_data(line)


        if data:

            send_to_backend(
                data
            )


    except KeyboardInterrupt:

        print()
        print("Bridge stopped.")

        break


    except Exception as e:

        print(
            "Error:",
            e
        )

        time.sleep(1)