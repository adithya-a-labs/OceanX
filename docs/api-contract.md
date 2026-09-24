# API Contract

## GET /api/metadata
Returns available variables, units, depths and times.

## GET /api/ocean
Query: `variable`, `depth`, `time`, optional bounds/resolution.

## GET /api/observations
Returns Argo observation markers for the active region/time.

## GET /api/compare/{observation_id}
Returns depths, observed values, model values, differences and RMSE.

Breaking contract changes require agreement from affected members before merge.
