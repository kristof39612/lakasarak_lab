from flask import Flask, send_from_directory
import os
from flask import request, jsonify
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import GradientBoostingRegressor
from xgboost import XGBRegressor
import joblib
from pyngrok import ngrok

AUTH_TOKEN = os.environ.get("GROK_AUTH_TOKEN","")

ngrok.set_auth_token(AUTH_TOKEN)
public_url = ngrok.connect(5000)
print(public_url)

app = Flask(__name__, static_folder="./frontend/build", static_url_path="")

lr_model = joblib.load("lr_model.pkl")
xgbm_model = joblib.load("xgbm_model.pkl")
gbm_model = joblib.load("gbm_model.pkl")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json()
    required_fields = [
        "city", "postcode", "property_subtype", "property_condition_type",
        "property_floor", "building_floor_count", "view_type", "orientation",
        "garden_access", "heating_type", "elevator_type", "room_cnt",
        "small_room_cnt", "created_at", "property_area", "balcony_area", "ad_view_cnt"
    ]

    # Check if all required fields are present
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    # Placeholder for prediction logic
    # Example: prediction = some_model.predict(data)
    # Create a pandas DataFrame from the input data
    df = pd.DataFrame([data])
    mldf = sanitize_input(df)
    price = lr_model.predict(mldf)[0]
    price2 = xgbm_model.predict(mldf)[0]
    price3 = gbm_model.predict(mldf)[0]
    prediction = {}
    prediction["predicted_price"] = float(price)
    prediction["predicted_price_xgbm"] = float(price2)
    prediction["predicted_price_gbm"] = float(price3)
    return jsonify(prediction)

def sanitize_input(orig_df):
    df = orig_df.copy()
    df = df.drop(columns='city')
    property_subtype_mapping = {subtype: idx+1 for idx, subtype in enumerate(df['property_subtype'].unique())}
    df['property_subtype'] = df['property_subtype'].map(property_subtype_mapping)
    del property_subtype_mapping

    condition_mapping = {
        'to_be_renovated': 1,
        'missing_info': 1,
        'medium': 2,
        'under_construction': 2,
        'good': 3,
        'renewed': 3,
        'can_move_in': 4,
        'new_construction': 4,
        'novel': 4
    }

    # Apply mapping
    df['property_condition_type'] = df['property_condition_type'].map(condition_mapping)    
    del condition_mapping

    floor_mapping = {
    'basement': 'Basement',
    'ground floor': 'Ground Floor',
    'mezzanine floor': 'Mezzanine',
    '1': 'Low Floor',
    '2': 'Low Floor',
    '3': 'Low Floor',
    '4': 'Mid Floor',
    '5': 'Mid Floor',
    '6': 'Mid Floor',
    '7': 'Mid Floor',
    '8': 'High Floor',
    '9': 'High Floor',
    '10': 'High Floor',
    '10 plus': 'Very High Floor'
    }

    df['property_floor'] = df['property_floor'].map(floor_mapping)

    floor_encoding = {
        'Basement': 0,
        'Ground Floor': 1,
        'Mezzanine': 2,
        'Low Floor': 3,
        'Mid Floor': 4,
        'High Floor': 5,
        'Very High Floor': 6
    }

    df['property_floor'] = df['property_floor'].map(floor_encoding)
    del floor_mapping,floor_encoding

    floor_count_mapping = {
        '1': 'Single-Floor',
        '2': 'Low-Rise',
        '3': 'Low-Rise',
        '4': 'Mid-Rise',
        '5': 'Mid-Rise',
        '6': 'Mid-Rise',
        '7': 'High-Rise',
        '8': 'High-Rise',
        '9': 'High-Rise',
        '10': 'High-Rise',
        'more than 10': 'Very High-Rise'
    }

    df.loc[:, 'building_floor_count'] = df['building_floor_count'].map(floor_count_mapping)

    floor_count_encoding = {
        'Single-Floor': 0,
        'Low-Rise': 1,
        'Mid-Rise': 2,
        'High-Rise': 3,
        'Very High-Rise': 4
    }

    df.loc[:,'building_floor_count'] = df['building_floor_count'].map(floor_count_encoding)
    df.loc[:,'building_floor_count'] = pd.to_numeric(df['building_floor_count'], errors='coerce').fillna(-1).astype(int)

    del floor_count_encoding, floor_count_mapping
    view_mapping = {
        'street view': 1,
        'courtyard view': 2,
        'garden view': 3,
        'panoramic': 4
    }

    # NAN -> 0
    df.loc[:,'view_type'] = df['view_type'].map(view_mapping).fillna(0)
    del view_mapping

    df.loc[:,'orientation'] = df['orientation'].fillna('unknown')
    df.loc[:,'orientation'] = df['orientation'].map({'east':2,'south-west':3,'west':2,'south-east':3,'south':3,'north':1,'north-west':1,'north-east':1,'unknown':0})
    
    
    df['garden_access'] = df['garden_access'].map({'no': 0, 'yes': 1})
    df['elevator_type'] = df['elevator_type'].map({'no': 0, 'yes': 1})
    
    df.loc[:,'heating_type'] = df['heating_type'].fillna('unknown')

    heating_types = ['other','electric','gas','central','unknown']

    df.loc[:,'heating_type'] = df['heating_type'].map({'unknown':'unknown','gas furnace, circulating hot water':'central',
                                                 'circulating hot water':'central','konvection gas burner':'gas',
                                                 'district heating':'central','central heating with own meter':'central',
                                                 'tile stove (gas)':'gas','central heating':'central',
                                                 'electric':'electric','other':'other','fan-coil':'electric',
                                                 'gas furnace' : 'gas'
                                                 })
    df.loc[:,'heating_type'] = df['heating_type'].fillna('unknown')
    df.loc[:,'heating_type'] = df['heating_type'].map({'unknown':0,'gas':1,'central':2,'electric':3,'other':4})

    
    df['active_days'] = (pd.to_datetime('now') - pd.to_datetime(df['created_at'])).dt.days
    df['ad_view_cnt'] = pd.to_numeric(df['ad_view_cnt'], errors='coerce').fillna(0).astype(int)
    df['meroszam'] = (df['ad_view_cnt'] / df['active_days']) * 100
    df['created_at'] = (pd.to_datetime(df['created_at']) - pd.to_datetime('2015-02-09')).dt.days
    df['postcode'] = pd.to_numeric(df['postcode'])
    df['building_floor_count'] = pd.to_numeric(df['building_floor_count'])
    df['view_type'] = pd.to_numeric(df['view_type'])
    df['orientation'] = pd.to_numeric(df['orientation'])
    df['heating_type'] = pd.to_numeric(df['heating_type'])
    df['room_cnt'] = pd.to_numeric(df['room_cnt'])
    df['small_room_cnt'] = pd.to_numeric(df['small_room_cnt'])
    df['property_area'] = pd.to_numeric(df['property_area'])
    df['balcony_area'] = pd.to_numeric(df['balcony_area'])

    df.drop(columns=['active_days'],inplace=True)
    df.drop(columns=['ad_view_cnt'],inplace=True)
    return df


if __name__ == "__main__":
    app.run(debug=False,host="0.0.0.0")

