import React, { useState } from 'react';
import './App.css';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert, Box, Typography, Backdrop } from '@mui/material';

function App() {
  const [formData, setFormData] = useState({
    city: '1',
    postcode: '',
    property_subtype: '',
    property_condition_type: '',
    property_floor: '',
    building_floor_count: '',
    view_type: '',
    orientation: '',
    garden_access: '',
    heating_type: '',
    elevator_type: '',
    room_cnt: '',
    small_room_cnt: '',
    created_at: '',
    property_area: '',
    balcony_area: '',
    ad_view_cnt: '',
  });

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [successPanelOpen, setSuccessPanelOpen] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [predictedPriceGBM, setPredictedPriceGBM] = useState<number | null>(null);
  const [predictedPriceXGBM, setPredictedPriceXGBM] = useState<number | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Network response failed');

      const result = await response.json();
      setPredictedPrice(result.predicted_price);
      setPredictedPriceGBM(result.predicted_price_gbm);
      setPredictedPriceXGBM(result.predicted_price_xgbm);
      setSuccessPanelOpen(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setToast({
        open: true,
        message: 'Error submitting the form.',
        severity: 'error',
      });
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleCloseSuccessPanel = () => {
    setSuccessPanelOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    if (
      ['postcode', 'room_cnt', 'small_room_cnt', 'property_area', 'balcony_area', 'ad_view_cnt'].includes(name) &&
      !/^\d*$/.test(value)
    ) {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const romanNumerals = [
    'I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.', 
    'XI.', 'XII.', 'XIII.', 'XIV.', 'XV.', 'XVI.', 'XVII.', 'XVIII.', 'XIX.', 'XX.', 
    'XXI.', 'XXII.', 'XXIII.'
  ];

  return (
    <Box className="App" sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Predict the Price of a Flat
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>District</InputLabel>
            <Select
              label="District"
              name="city"
              value={formData.city}
              onChange={handleChange}
            >
              {romanNumerals.map((rn, i) => (
                <MenuItem key={i} value={(i + 1).toString()}>
                  Budapest {rn}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Postcode"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Property Subtype</InputLabel>
            <Select
              label="Property Subtype"
              name="property_subtype"
              value={formData.property_subtype}
              onChange={handleChange}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="prefabricated panel flat (for sale)">Panel Flat (Sale)</MenuItem>
              <MenuItem value="brick flat (for sale)">Brick Flat (Sale)</MenuItem>
              <MenuItem value="terraced house">Terraced House</MenuItem>
              <MenuItem value="prefabricated panel flat (for rent)">Panel Flat (Rent)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Condition</InputLabel>
            <Select
              label="Condition"
              name="property_condition_type"
              value={formData.property_condition_type}
              onChange={handleChange}
            >
              {[
                'good', 'novel', 'medium', 'renewed', 'new_construction',
                'to_be_renovated', 'can_move_in', 'missing_info', 'under_construction'
              ].map(val => (
                <MenuItem key={val} value={val}>
                  {val.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Floor</InputLabel>
            <Select
              label="Floor"
              name="property_floor"
              value={formData.property_floor}
              onChange={handleChange}
            >
              {['basement', 'ground floor', 'mezzanine floor', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10 plus'].map(val => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Total Floors in Building</InputLabel>
            <Select
              label="Total Floors in Building"
              name="building_floor_count"
              value={formData.building_floor_count}
              onChange={handleChange}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'more than 10'].map(val => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>View</InputLabel>
            <Select
              label="View"
              name="view_type"
              value={formData.view_type}
              onChange={handleChange}
            >
              {['garden view', 'street view', 'courtyard view', 'panoramic'].map(val => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Orientation</InputLabel>
            <Select
              label="Orientation"
              name="orientation"
              value={formData.orientation}
              onChange={handleChange}
            >
              {['east', 'west', 'south', 'north', 'south-east', 'south-west', 'north-east', 'north-west'].map(val => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Garden Access</InputLabel>
            <Select
              label="Garden Access"
              name="garden_access"
              value={formData.garden_access}
              onChange={handleChange}
            >
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Heating Type</InputLabel>
            <Select
              label="Heating Type"
              name="heating_type"
              value={formData.heating_type}
              onChange={handleChange}
            >
              {[
                'gas furnace, circulating hot water', 'konvection gas burner', 'district heating',
                'central heating with own meter', 'tile stove (gas)', 'central heating', 'electric',
                'other', 'fan-coil', 'gas furnace', 'gas + solar'
              ].map(val => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Elevator</InputLabel>
            <Select
              label="Elevator"
              name="elevator_type"
              value={formData.elevator_type}
              onChange={handleChange}
            >
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Room Count"
            name="room_cnt"
            value={formData.room_cnt}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Small Room Count"
            name="small_room_cnt"
            value={formData.small_room_cnt}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Listing Date"
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Property Area (m²)"
            name="property_area"
            value={formData.property_area}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Balcony Area (m²)"
            name="balcony_area"
            value={formData.balcony_area}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Ad View Count"
            name="ad_view_cnt"
            value={formData.ad_view_cnt}
            onChange={handleChange}
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Submit
          </Button>
        </Box>
      </form>
      <Typography variant="caption" display="block" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
        Lovácsi Kristóf N3EEWB • Szladek Máté Nándor TGPZTT • Tóth Ádám László TK6NT3
      </Typography>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Backdrop open={successPanelOpen} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: 'blur(5px)' }}>
        <Box
          sx={{
            p: 4,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            textAlign: 'center',
            minWidth: 300,
          }}
        >
          <Typography variant="h5" gutterBottom>
            Prediction Successful!
          </Typography>
          <Typography variant="h6" gutterBottom>
            LR Prediction: {(predictedPrice !== null ? (predictedPrice * 1_000_000).toFixed(2) : '-')} HUF
          </Typography>
          <Typography variant="h6" gutterBottom>
            GBM Prediction: {(predictedPriceGBM !== null ? (predictedPriceGBM * 1_000_000).toFixed(2) : '-')} HUF
          </Typography>
          <Typography variant="h6">
            XGBM Prediction: {(predictedPriceXGBM !== null ? (predictedPriceXGBM * 1_000_000).toFixed(2) : '-')} HUF
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={handleCloseSuccessPanel}>
            Close
          </Button>
        </Box>
      </Backdrop>

    </Box>
  );
}

export default App;
