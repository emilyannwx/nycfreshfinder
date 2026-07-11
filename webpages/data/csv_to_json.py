import csv
import json

input_file = 'data/combined_nyc_data.csv'
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

