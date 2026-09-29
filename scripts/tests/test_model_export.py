import json
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import xarray as xr

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from demo_data.comparison import compare
from demo_data.config import DATES
from demo_data.model import export_model


class ModelExportTests(unittest.TestCase):
    def test_frames_and_matching_without_real_download(self):
        depths = [0.5, 50.0, 100.0, 200.0, 500.0]
        shape = (4, 5, 3, 4)
        temperature = np.full(shape, 25.0)
        temperature[:, :, :, 2] += 1.0
        temperature[0, 0, 0, 0] = np.nan
        metadata = {
            'depths': [{'id': f'depth-{requested}', 'requestedDepthM': requested,
                        'actualDepthM': actual} for requested, actual in zip((0, 50, 100, 200, 500), depths)],
            'variables': {key: {'sourceVariable': source, 'unit': unit}
                          for key, source, unit in (
                              ('temperature', 'thetao', 'degrees_C'), ('salinity', 'so', '1e-3'),
                              ('u', 'uo', 'm s-1'), ('v', 'vo', 'm s-1'))},
        }
        coords = {'time': np.array(DATES, dtype='datetime64[ns]'), 'depth': depths,
                  'latitude': [20, 15, 10], 'longitude': [92, 88, 84, 80]}
        dims = ('time', 'depth', 'latitude', 'longitude')
        ds = xr.Dataset({
            'thetao': (dims, temperature, {'units': 'degrees_C'}),
            'so': (dims, np.full(shape, 35.0), {'units': '1e-3'}),
            'uo': (dims, np.full(shape, 3.0), {'units': 'm s-1'}),
            'vo': (dims, np.full(shape, 4.0), {'units': 'm s-1'}),
        }, coords=coords)
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source.nc'
            ds.to_netcdf(source)
            model, times = export_model(source, metadata, root / 'out')
            self.assertEqual(len(times), 4)
            layer = json.loads((root / 'out/ocean/temperature/t0/depth-0.json').read_text())
            self.assertEqual((layer['meta']['rows'], layer['meta']['columns']), (3, 4))
            self.assertIsNone(layer['values'][-1][-1])  # latitude/longitude orientation normalized
            current = json.loads((root / 'out/currents/t0.json').read_text())
            self.assertEqual(current['speed'][0][0], 5.0)
            profile = {'id': 'test-001', 'time': '2025-04-20T12:00:00Z',
                       'latitude': 15, 'longitude': 88,
                       'depthM': [25, 100, 400, 600], 'temperatureDegC': [25, 25, 25, 25]}
            comparison = compare(profile, model, 'thetao')
            self.assertEqual(comparison['depthM'], [25, 100, 400])
            self.assertTrue(all(d <= 500 for d in comparison['depthM']))
            self.assertEqual(comparison['match']['depthMethod'], 'linear-interpolation')
