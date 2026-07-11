from google.colab import drive
drive.mount('/content/drive')

import csv
import json
import os

input_file = '/content/drive/MyDrive/Capstone/capstone_data/combined_nyc_data.csv'
output_file = "nyc_data.json"

data = []

with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        item = {
            "Type": row["Type"],
            "Name": row["Name"],
            "Contact Info": row["Contact Info"],
            "Street Address": row["Street Address"],
            "Borough": row["Borough"],
            "Zip Code": int(row["Zip Code"]) if row["Zip Code"] else None,
            "Days of Operation": row["Days of Operation"],
            "Hours of Operation": row["Hours of Operation"],
            "Latitude": float(row["Latitude"]) if row["Latitude"] else None,
            "Longitude": float(row["Longitude"]) if row["Longitude"] else None
        }
        data.append(item)

with open(output_file, "w") as jsonfile:
    json.dump(data, jsonfile, indent=4)


import os

input_file_path = '/content/drive/MyDrive/Capstone/capstone_data/combined_nyc_data.csv'
notebook_directory = os.path.dirname(input_file_path)

output_file_name = "nyc_data.json"
output_file_path = os.path.join(notebook_directory, output_file_name)

with open(output_file_path, "w") as jsonfile:
    json.dump(data, jsonfile, indent=4)

print(f"JSON data saved to: {output_file_path}")
print(f"Contents of the output directory:")
!ls -l "{notebook_directory}"
