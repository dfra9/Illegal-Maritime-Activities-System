import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Masking
from tensorflow.keras.callbacks import History
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from plyer import notification

data_with_mmsi = pd.read_csv("3compiledlabeleddata/finaltrain.csv")
ai_output = '4ai/ship_classification200.h5'
features = ["Lat", "Lon", "Time Range"]
sequence_length = 5

def create_sequences(data, seq_length, features, target):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        sequence = data[features].iloc[i:i + seq_length].values
        label = data[target].iloc[i + seq_length]
        sequences.append(sequence)
        labels.append(label)
    return np.array(sequences), np.array(labels)

X, y = create_sequences(data_with_mmsi, sequence_length, features, "mmsi")

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train.reshape(-1, X_train.shape[-1])).reshape(X_train.shape)
X_test_scaled = scaler.transform(X_test.reshape(-1, X_test.shape[-1])).reshape(X_test.shape)

model = Sequential()
model.add(Masking(mask_value=0.0, input_shape=(sequence_length, len(features))))
model.add(LSTM(64, return_sequences=False))
model.add(Dense(len(np.unique(y)), activation="softmax"))

model.compile(loss="sparse_categorical_crossentropy", optimizer="adam", metrics=["accuracy"])

history = model.fit(X_train_scaled, y_train, epochs=200, batch_size=32, validation_data=(X_test_scaled, y_test))

model.save(ai_output)
print(f"Model saved to {ai_output}")

metrics = ['accuracy', 'loss', 'val_accuracy', 'val_loss']
for metric in metrics:
    plt.figure()
    plt.plot(history.history[metric])
    plt.title(f'Model {metric}')
    plt.ylabel(metric)
    plt.xlabel('Epoch')
    plt.savefig(f'{ai_output.rsplit("/", 1)[0]}/{metric}.png')

notification.notify(
    title="Finished executing",
    message="Successful",
)
