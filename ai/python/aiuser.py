from plyer import notification
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
output_data = '6.csv'
output_path = f'5predicteddata/{output_data}'
unlabeled_data = pd.read_csv(f"2unlabeleddata/{output_data}")
ai_input = '4ai/ship_classification.keras'
sequence_length = 5
features = ["Lat", "Lon", "Time Range"]
X_unlabeled = []

for i in range(len(unlabeled_data) - sequence_length + 1):
    X_unlabeled.append(unlabeled_data[features].iloc[i:i + sequence_length].values)

X_unlabeled = np.array(X_unlabeled)
scaler = StandardScaler()
X_unlabeled_scaled = scaler.fit_transform(X_unlabeled.reshape(-1, X_unlabeled.shape[-1])).reshape(X_unlabeled.shape)
model = load_model(ai_input)

# Predict the mmsi for each sequence in the unlabeled data
predicted_labels = model.predict(X_unlabeled_scaled)
predicted_mmsi_indices = np.argmax(predicted_labels, axis=1)

# Initialize a dictionary to keep track of new mmsi assignments
new_mmsi_map = {}
next_mmsi = 2600001

# Assign new mmsi to each unique ship trajectory
predicted_mmsi_full = [None] * len(unlabeled_data)
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

# Assign the predicted mmsi to the original data
unlabeled_data["mmsi"] = predicted_mmsi_full
unlabeled_data.to_csv(output_path, index=False)

print(f"Classification of unlabeled data completed and saved to {output_path}")

notification.notify(
    title="Finished executing",
    message="Successful",
)
