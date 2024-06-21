import pandas as pd
import folium
import random
import sys
from plyer import notification

input_data = '6'
output_path = f'6mapresult/200predictedmap{input_data}.html'
df = pd.read_csv(f'5predicteddata/{input_data}.csv')

df['Time Range'] = pd.to_datetime(df['Time Range'])
m = folium.Map(location=[df['Lat'].mean(), df['Lon'].mean()], zoom_start=5)
mmsi_colors = {}
def generate_random_color():
    r = random.randint(0, 255)
    g = 0 if r == 255 else random.randint(0, 255)
    b = 255 if g == 0 else random.randint(0, 255)
    return '#{:02x}{:02x}{:02x}'.format(r, g, b)
for index, row in df.iterrows():
    lat = row['Lat']
    lon = row['Lon']
    mmsi = str(row['mmsi']) if pd.notnull(row['mmsi']) else '0'
    if pd.isna(lat) or pd.isna(lon):
        continue
    if mmsi not in mmsi_colors:
        mmsi_colors[mmsi] = generate_random_color()
    color = mmsi_colors[mmsi]
    marker = folium.CircleMarker(
        location=[lat, lon],
        radius=5,
        color=color,
        fill=True,
        fill_color=color,
        popup=f'MMSI: {mmsi}<br>Lat: {lat}<br>Lon: {lon}',
        tooltip=f'MMSI: {mmsi}'
    )
    marker.add_to(m)

folium.LayerControl().add_to(m)
m.save(output_path)
notification.notify(title = "Finished executing ",message = "Successful",)