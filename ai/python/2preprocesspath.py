import pandas as pd
input_file = '6.csv'
input_path = f'1rawdata/{input_file}'
output_file_a = f'2labeleddata/{input_file}'
output_file_b = f'2unlabeleddata/{input_file}'
df = pd.read_csv(input_path)
df['Time Range'] = pd.to_datetime(df['Time Range'])
earliest_time = df['Time Range'].min()
df['relative_hour'] = (df['Time Range'] - earliest_time) / pd.Timedelta(hours=1)
df = df.drop(columns=['Time Range'])
df = df.rename(columns={'relative_hour': 'Time Range'})
df_a = df[(df['mmsi'].notna()) & (df['mmsi'] != 0) & (df['mmsi'] != 0.0)]
df_a_sorted = df_a.sort_values(by='mmsi')
df_a_sorted.to_csv(output_file_a, index=False)
df_b = df[(df['mmsi'].isna()) | (df['mmsi'] == 0.0) | (df['mmsi'] == 0)]
df_b.to_csv(output_file_b, index=False)
print(f"Splitting of 1.csv into {output_file_a} and {output_file_b} completed successfully.")
