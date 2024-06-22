import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from plyer import notification

# Load your data (assuming it's similar to your previous setup)
data_with_mmsi = pd.read_csv("3compiledlabeleddata/finaltrain.csv")
ai_output = 'ship_classification200.pth'  # Change file extension to .pth for PyTorch

# Define your features and sequence length
features = ["Lat", "Lon", "Time Range"]
sequence_length = 5

# Function to create sequences
def create_sequences(data, seq_length, features, target):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        sequence = data[features].iloc[i:i + seq_length].values
        label = data[target].iloc[i + seq_length]
        sequences.append(sequence)
        labels.append(label)
    return np.array(sequences), np.array(labels)

# Create sequences and encode labels
X, y = create_sequences(data_with_mmsi, sequence_length, features, "mmsi")

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Split data into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# Scale the data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train.reshape(-1, X_train.shape[-1])).reshape(X_train.shape)
X_test_scaled = scaler.transform(X_test.reshape(-1, X_test.shape[-1])).reshape(X_test.shape)

# Convert data to PyTorch tensors
X_train_torch = torch.tensor(X_train_scaled, dtype=torch.float32)
y_train_torch = torch.tensor(y_train, dtype=torch.long)
X_test_torch = torch.tensor(X_test_scaled, dtype=torch.float32)
y_test_torch = torch.tensor(y_test, dtype=torch.long)

# Define the LSTM model
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_classes):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # Take the last output of the sequence
        return out

input_size = len(features)
hidden_size = 64
num_classes = len(np.unique(y))

model = LSTMModel(input_size, hidden_size, num_classes)

# Define loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training the model
num_epochs = 200
train_losses = []
test_losses = []
for epoch in range(num_epochs):
    model.train()
    optimizer.zero_grad()
    outputs = model(X_train_torch)
    loss = criterion(outputs, y_train_torch)
    loss.backward()
    optimizer.step()
    train_losses.append(loss.item())
    
    model.eval()
    with torch.no_grad():
        outputs = model(X_test_torch)
        loss = criterion(outputs, y_test_torch)
        test_losses.append(loss.item())
    
    if epoch % 10 == 0:
        print(f'Epoch [{epoch}/{num_epochs}], Train Loss: {train_losses[-1]:.4f}, Test Loss: {test_losses[-1]:.4f}')

# Save the model
torch.save(model.state_dict(), ai_output)
print(f"Model saved to {ai_output}")

# Plotting the training and validation losses
plt.figure()
plt.plot(train_losses, label='Train Loss')
plt.plot(test_losses, label='Test Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.savefig(f'loss.png')

# Notification for completion
notification.notify(
    title="Finished executing",
    message="Successful",
)
