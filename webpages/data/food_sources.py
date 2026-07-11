import pandas as pd
from geopy.geocoders import Nominatim

from google.colab import drive
drive.mount('/content/drive')

#initialize nominatim geolocator
geolocator = Nominatim(user_agent="my_geocoder")

# Farmers Market Data


with open('/content/drive/MyDrive/Capstone/capstone_data/NYC_Farmers_Markets_20250301.csv', 'r') as f:
  df = pd.read_csv(f)
df.head()
nyc_farmers_markets = df

#select farmers market's in brooklyn
brooklyn_farmers_markets = df[df['Borough'] == 'Brooklyn']
brooklyn_farmers_markets


#drop (unnecessary) columns
columns_to_drop = ['Community District', 'Season Begin', 'Season End', 'Accepts EBT', 'Distributes Health Bucks?','Open Year-Round', 'Location Point', ' Cooking Demonstrations']
nyc_farmers_markets_clean = nyc_farmers_markets.drop(columns=columns_to_drop)

nyc_farmers_markets_clean




#add a new column named 'Type' and set all entries to 'Farmers Market'
nyc_farmers_markets_clean['Type'] = 'Farmers Market'
nyc_farmers_markets_clean = nyc_farmers_markets_clean.rename(columns={'Market Name': 'Name'})
nyc_farmers_markets_clean = nyc_farmers_markets_clean.rename(columns={'Hours of Operations': 'Hours of Operation'})


nyc_farmers_markets_clean


# Community Fridge Data

with open('/content/drive/MyDrive/Capstone/capstone_data/freedges around the world - All.csv', 'r') as f:
  df1 = pd.read_csv(f)
df1.head()


df1['City'].unique().tolist()

df1.loc[df1['City'] == 'Brooklyn ', 'City'] = 'Brooklyn'
df1.loc[df1['City'] == 'Bronx ', 'City'] = 'The Bronx'
df1.loc[df1['City'] == 'Bronx', 'City'] = 'The Bronx'
df1.loc[df1['City'] == 'New York City ', 'City'] = 'Manhattan'
df1.loc[df1['City'] == 'New York', 'City'] = 'Manhattan'
df1.loc[df1['City'] == 'New York ', 'City'] = 'Manhattan'
df1.loc[df1['City'] == 'New York City', 'City'] = 'Manhattan'

df1.loc[df1['City'] == 'Astoria', 'City'] = 'Queens'
df1.loc[df1['City'] == 'Astoria ', 'City'] = 'Queens'

df1.loc[df1['City'] == 'Ridgewood', 'City'] = 'Queens'
df1.loc[df1['City'] == 'Rockaway Beach', 'City'] = 'Queens'
df1.loc[df1['City'] == 'Jamaica ', 'City'] = 'Queens'
df1.loc[df1['City'] == 'Long Island City', 'City'] = 'Queens'

nyc_community_fridges

cities_of_interest = ['Brooklyn', 'Manhattan', 'Queens', 'The Bronx', 'Staten Island']
nyc_community_fridges = df1[df1['City'].isin(cities_of_interest)].copy()

nyc_community_fridges.columns


#drop (unnecessary) columns
columns_to_drop = ['Network', 'Donation Rules: What food does your fridge accept / not accept (i.e produce, frozen foods, raw meats, hygiene items, other items, etc.)?', 'Days/times fridge is open', 'Accepts $$ donations? (include where: venmo, gofundme, etc.)', 'Details (Describe your project)','Other Contact or Links (IG, FB, website, linktree)', 'Do you have a local map? (Link to Map)', 'News articles (link)', 'Contact Name','Active?','LABEL','Location type (church, storefront, etc.)', 'Date Installed', 'Image URL' ]
nyc_community_fridges = nyc_community_fridges.drop(columns=columns_to_drop)
nyc_community_fridges

#rename columns
nyc_community_fridges = nyc_community_fridges.rename(columns={'Project': 'Name'})
nyc_community_fridges = nyc_community_fridges.rename(columns={'Street address': 'Street Address'})
nyc_community_fridges = nyc_community_fridges.rename(columns={'Main Contact (email, IG, FB, website, linktree or other)': 'Contact Info'})
nyc_community_fridges = nyc_community_fridges.rename(columns={'State / Province': 'State'})


nyc_community_fridges


!pip install geopy


def get_coordinates(row):
    address = f"{row['Street Address']}, {row['City']}, {row['State']}, {row['Zip Code']}"

    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None, None

#apply function to 'address' column

nyc_community_fridges[['Latitude', 'Longitude']] = nyc_community_fridges.apply(lambda row: pd.Series(get_coordinates(row)),axis = 1)
nyc_community_fridges
#may have to change some of the address manually


nyc_community_fridges['Type'] = 'Community Fridge'
nyc_community_fridges

# Food Pantry Data

with open('/content/drive/MyDrive/Capstone/capstone_data/EFAP_pdf_11_4_24.csv', 'r') as f:
  df2 = pd.read_csv(f)
df2.head()

df2 = df2.rename(columns={'PROGRAM': 'Name'})
df2 = df2.rename(columns={'DISTADD': 'Street Address'})
df2 = df2.rename(columns={'DISTBORO': 'Borough'})
df2 = df2.rename(columns={'DISTZIP': 'Zip Code'})
df2 = df2.rename(columns={'PHONE': 'Contact Info'})
df2 = df2.rename(columns={'TYPE': 'Type'})

df2

# removes space between days and parentheses in the DAYS column, remove it
import re

df2['DAYS'] = df2['DAYS'].str.replace(r'\s+(?=\()', '', regex=True)
df2

#split the DAYS column
def split_days_hours(days_string):
    if pd.isna(days_string):  # handle missing values
        return None, None

    days_string = str(days_string)
    parts = days_string.split(' ', 1) # split at the first space
    if len(parts) == 2:
      days = parts[0].strip()
      hours = parts[1].strip()
      return days, hours
    else:
        return days_string, None


#apply the function to create new columns
df2[['Days of Operation', 'Hours of Operation']] = df2['DAYS'].apply(lambda x: pd.Series(split_days_hours(x)))
#columns_to_drop = ['Network', 'Donation Rules: What food does your fridge accept / not accept (i.e produce, frozen foods, raw meats, hygiene items, other items, etc.)?', 'Days/times fridge is open', 'Accepts $$ donations? (include where: venmo, gofundme, etc.)', 'Details (Describe your project)','Other Contact or Links (IG, FB, website, linktree)', 'Do you have a local map? (Link to Map)', 'News articles (link)', 'Contact Name','Active?','LABEL','Location type (church, storefront, etc.)', 'Date Installed', 'Image URL' ]
df2 = df2.drop(columns='DAYS')
df2


df2['Borough'].unique().tolist()

df2['Type'] = df2['Type'].replace('FP', 'Food Pantry')
df2['Type'] = df2['Type'].replace('SK', 'Soup Kitchen')
df2['Borough'] = df2['Borough'].replace('BK', 'Brooklyn')
df2['Borough'] = df2['Borough'].replace('QN', 'Queens')
df2['Borough'] = df2['Borough'].replace('BX', 'The Bronx')
df2['Borough'] = df2['Borough'].replace('SI', 'Staten Island')
df2['Borough'] = df2['Borough'].replace('NY', 'Manhattan')


df2['State'] = 'New York'

nyc_pantries = df2
nyc_pantries



days_of_operation_values = nyc_pantries['Days of Operation'].unique()
days_of_operation_values


def get_coordinates(row):
    address = f"{row['Street Address']}, {row['Borough']}, {row['State']}, {row['Zip Code']}"

    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None, None

#apply function to 'address' column

nyc_pantries[['Latitude', 'Longitude']] = nyc_pantries.apply(lambda row: pd.Series(get_coordinates(row)),axis = 1)
nyc_pantries

# Combine data

combined_df_nyc = pd.concat([nyc_pantries, nyc_community_fridges, nyc_farmers_markets_clean], ignore_index=True)
columns_to_drop = ['ID']
combined_df_nyc = combined_df_nyc.drop(columns=columns_to_drop)
columns_to_fill = [col for col in combined_df_nyc.columns if col not in ['Latitude', 'Longitude']]
import re

#define dictionary mapping abbreviations to full day names
day_mapping = {
   r'(?<!\w)M(?:ON)?(?!\w)': 'Monday',  # matches "MON" or "M" not preceded or followed by a word character
    r'(?<!\w)TU(?:E)?(?!\w)': 'Tuesday',
    r'(?<!\w)W(?:ED)?(?!\w)': 'Wednesday',
    r'(?<!\w)TH(?:U)?(?:R?)?(?!\w)': 'Thursday',
    r'(?<!\w)F(?:RI)?(?!\w)': 'Friday',
    r'(?<!\w)SA(?:T)?(?!\w)': 'Saturday',
    r'(?<!\w)SU(?:N)?(?!\w)': 'Sunday'
}

#iterate through dictionary and apply replacements
for abbreviation, full_name in day_mapping.items():
    combined_df_nyc['Days of Operation'] = combined_df_nyc['Days of Operation'].str.replace(abbreviation, full_name, regex=True)

combined_df_nyc



days_of_operation_values = combined_df_nyc['Days of Operation'].unique()
days_of_operation_values


combined_df_nyc.to_csv('/content/drive/MyDrive/Capstone/capstone_data/combined_nyc_data.csv', index=False)




# Fixing Combined Data

import pandas as pd
from geopy.geocoders import Nominatim

from google.colab import drive
drive.mount('/content/drive')


with open('/content/drive/MyDrive/Capstone/capstone_data/combined_bk_data.csv', 'r') as f:
  df = pd.read_csv(f)
df.head()
nyc_data = df
nyc_data

print(nyc_data['Type'].unique())

nyc_data['Type'] = nyc_data['Type'].replace(['FPK', 'FPH', 'FPM', 'FPV'], 'Food Pantry')
nyc_data['Type'] = nyc_data['Type'].replace(['SKM', 'SKK'], 'Soup Kitchen')

print(nyc_data['Type'].unique())

combined_df_nyc.to_csv('/content/drive/MyDrive/Capstone/capstone_data/combined_nyc_data.csv', index=False)


#Food Stores


with open('/content/drive/MyDrive/Capstone/capstone_data/Retail_Food_Stores_20250301.csv', 'r') as f:
  df3 = pd.read_csv(f)
df3.head()

df3 = df3.rename(columns={'DBA Name': 'Name'})
df3



#combine 'Street Number' and 'Street Name' columns
df3['Address'] = df3['Street Number'].astype(str) + ' ' + df3['Street Name']
columns_to_drop = ['Entity Name', 'Street Number', 'Street Name', 'Address Line 2','Address Line 3', 'Square Footage' ]
df3 = df3.drop(columns=columns_to_drop)

df3


brooklyn_stores = df3[df3['City'] == 'BROOKLYN']
brooklyn_stores

def get_coordinates(row):
    address = f"{row['Address']}, {row['City']}, {row['State']}, {row['Zip Code']}"

    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None, None

#apply function to 'address' column

brooklyn_stores[['Latitude', 'Longitude']] = brooklyn_stores.apply(lambda row: pd.Series(get_coordinates(row)),axis = 1)
brooklyn_stores
