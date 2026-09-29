import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from demo_data.comparison import rmse


class ComparisonTests(unittest.TestCase):
    def test_identical(self):
        self.assertEqual(rmse([1, 2, 3], [1, 2, 3]), 0)

    def test_known_rmse(self):
        self.assertAlmostEqual(rmse([1, 2], [2, 4]), math.sqrt(2.5))

    def test_ignores_unpaired_invalid(self):
        self.assertEqual(rmse([1, None, float("nan")], [2, 4, 3]), 1)

    def test_rejects_mismatched_lengths(self):
        with self.assertRaises(ValueError):
            rmse([1], [1, 2])
