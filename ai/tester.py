import tensorflow as tf

# Load the Keras model from HDF5 file
model = tf.keras.models.load_model('static/models/ship_classification200.h5')

# Define the input shape (assuming your model takes input of shape (sequence_length, len(features)))
input_shape = (sequence_length, len(features))

# Convert the Keras model to TensorFlow Lite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Optional: optimize the model
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]  # Optional: specify supported ops
converter.experimental_new_converter = True  # Use the new TensorFlow Lite converter
converter.input_shape = [input_shape]

tflite_model = converter.convert()

# Save the TensorFlow Lite model to a file
with open('model.tflite', 'wb') as f:
   f.write(tflite_model)
