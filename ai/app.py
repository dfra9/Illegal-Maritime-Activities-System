import requests
import io
import zipfile
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
from plyer import notification

app = Flask(__name__)

# Function to fetch data based on date range
def fetch_data(start_date, end_date):
    url = 'https://gateway.api.globalfishingwatch.org/v2/4wings/report'
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJJbGxlZ2FsIEZpc2hpbmcgQm9hdCBBbmFseXNlciIsInVzZXJJZCI6MzE3NDcsImFwcGxpY2F0aW9uTmFtZSI6IklsbGVnYWwgRmlzaGluZyBCb2F0IEFuYWx5c2VyIiwiaWQiOjEzNDMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTcxMDMwNTM1NywiZXhwIjoyMDI1NjY1MzU3LCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.hjAzx39Mt1wIZunhRN6LgJ386Z1rZwcoazHpSnoRYF_oESeoREelVFS22GaXfqeoaI4VaQ_qorf6uHJyUPR4m7Mm7KIl1N6AuVQ8VLcaCRxg0RDLGGCmkBXRv15vVqXkDikIsa9Y3ctslkW3s1AmhinDSZgDCIbDJDHG4-j-iUovroNTRy1YY_wMSfY2lBSqoJdcWxmS3uR8ao5Z7Ag6fwoI_FRXRW59wEghq06M3v5poREs0t8lXuM7yAByg3OYwwHnFU9pGTY2ofbd4stPOqADisqeTkCwG2n68H7kZgCliTX4UYWAgFZWObR_Xn3sC4ZqGI2Oo9Y43Kvn8YWCEqEH75_Ii_eOCX75S-bNKdKeYAuM2u8yHjYNTynAyi4DqNpuAvJo4YLy4PpIQPCNFyy7g72xFUiVoyH0WIXSWH3s9PD3cp_6fquJWmSsGp60LEu3HK7sepovQqn4Z5D9gtLra3UnQSMuzcM6eK-RaruHqb1syvHBOPHkKCghrJRX',
        'Content-Type': 'application/json'
    }
    data = {
        "region": {
            "dataset": "public-eez-areas",
            "id": 8492
        }
    }
    params = {
        'spatial-resolution': 'high',
        'temporal-resolution': 'hourly',
        'group-by': 'mmsi',
        'datasets[0]': 'public-global-fishing-effort:latest',
        'date-range': f'{start_date},{end_date}',
        'format': 'csv'
    }

    response = requests.post(url, headers=headers, params=params, json=data)
    if response.status_code == 200:
        return response.content
    else:
        raise ValueError(f"Failed to fetch data. Status code: {response.status_code}")

# Function to process data and return JSON response
def process_data(start_date, end_date):
    try:
        print(f"Fetching data for date range: {start_date} to {end_date}")
        data_content = fetch_data(start_date, end_date)
        zip_file = zipfile.ZipFile(io.BytesIO(data_content))
        
        # Initialize final JSON response list
        json_responses = []

        for file_name in zip_file.namelist():
            if file_name.endswith('.csv'):
                print(f"Processing CSV file: {file_name}")
                with zip_file.open(file_name) as csv_file:
                    df = pd.read_csv(csv_file)

                # Perform data processing steps
                df['Time Range'] = pd.to_datetime(df['Time Range'])
                earliest_time = df['Time Range'].min()
                df['relative_hour'] = (df['Time Range'] - earliest_time) / pd.Timedelta(hours=1)
                df = df.drop(columns=['Time Range'])
                df = df.rename(columns={'relative_hour': 'Time Range'})

                # Split into labeled and unlabeled data
                df_a = df[(df['mmsi'].notna()) & (df['mmsi'] != 0) & (df['mmsi'] != 0.0)]
                df_b = df[(df['mmsi'].isna()) | (df['mmsi'] == 0.0) | (df['mmsi'] == 0)]

                # Further processing for df_b (unlabeled data)
                sequence_length = 5
                features = ["Lat", "Lon", "Time Range"]
                X_unlabeled = []

                for i in range(len(df_b) - sequence_length + 1):
                    X_unlabeled.append(df_b[features].iloc[i:i + sequence_length].values)

                X_unlabeled = np.array(X_unlabeled)
                scaler = StandardScaler()
                X_unlabeled_scaled = scaler.fit_transform(X_unlabeled.reshape(-1, X_unlabeled.shape[-1])).reshape(X_unlabeled.shape)

                # Load AI model and predict
                ai_input = 'static/images/ship_classification200.h5'
                print(f"Loading AI model from: {ai_input}")
                model = load_model(ai_input)
                predicted_labels = model.predict(X_unlabeled_scaled)
                predicted_mmsi_indices = np.argmax(predicted_labels, axis=1)
                # Initialize a dictionary to keep track of new MMSI assignments
                new_mmsi_map = {}
                next_mmsi = 2600001

                # Assign new MMSI to each unique ship trajectory
                predicted_mmsi_full = [None] * len(df_b)
                for i in range(len(predicted_mmsi_indices)):
                    seq_mmsi_index = predicted_mmsi_indices[i]
                    if seq_mmsi_index not in new_mmsi_map:
                        new_mmsi_map[seq_mmsi_index] = next_mmsi
                        next_mmsi += 1
                    new_mmsi = new_mmsi_map[seq_mmsi_index]
                    for j in range(sequence_length):
                        if (i + j) < len(predicted_mmsi_full):
                            predicted_mmsi_full[i + j] = new_mmsi
                # Handle any None values for the last few rows
                for i in range(len(predicted_mmsi_full)):
                    if predicted_mmsi_full[i] is None:
                        predicted_mmsi_full[i] = predicted_mmsi_full[i-1]

                df_b['mmsi'] = predicted_mmsi_full

                # Combine labeled and processed unlabeled data
                final_combined_data = pd.concat([df_a, df_b], ignore_index=True)
                # Convert each row to JSON and add to response list
                for index, row in final_combined_data.iterrows():
                    json_response = {
                        'Lat': row['Lat'],
                        'Lon': row['Lon'],
                        'Time Range': row['Time Range'],
                        'mmsi': int(row['mmsi']),
                    }
                    json_responses.append(json_response)

                break

        return json_responses

    except FileNotFoundError as e:
        print(f"File not found error: {e}")
        raise e
    except Exception as e:
        print(f"Error processing data: {e}")
        raise e

# Endpoint to process data based on start and end dates
@app.route('/process_data', methods=['GET'])
def endpoint_process_data():
    start_date = request.args.get('start')
    end_date = request.args.get('end')

    try:
        json_responses = process_data(start_date, end_date)
        return jsonify(json_responses), 200
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run()
