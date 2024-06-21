import os
import csv
input_folder = '2labeleddata'
output_file = '3compiledlabeleddata/finaltrain.csv'
def compile_csvs(input_folder, output_file):
    compiled_rows = []
    header_added = False
    for filename in os.listdir(input_folder):
        if filename.endswith(".csv"):
            file_path = os.path.join(input_folder, filename)
            with open(file_path, mode='r', newline='', encoding='utf-8') as csv_file:
                csv_reader = csv.reader(csv_file)
                rows = list(csv_reader)
                if not header_added:
                    compiled_rows.extend(rows)
                    header_added = True
                else:
                    compiled_rows.extend(rows[1:])
    with open(output_file, mode='w', newline='', encoding='utf-8') as output_csv_file:
        csv_writer = csv.writer(output_csv_file)
        csv_writer.writerows(compiled_rows)
compile_csvs(input_folder, output_file)
