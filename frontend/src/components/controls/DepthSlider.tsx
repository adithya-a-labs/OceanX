import { useOceanStore } from '../../store';
import { Slider } from '../ui';
import { formatDepth } from '../../utils/formatters';

const DEPTH_MARKS = [
  { value: 0, label: '0m' },
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' },
];

export const DepthSlider = () => {
  const depth = useOceanStore((s) => s.depth);
  const setDepth = useOceanStore((s) => s.setDepth);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Depth
        </label>
        <span className="text-sm font-mono text-text-primary">
          {formatDepth(depth)}
        </span>
      </div>
      <Slider
        min={0}
        max={2000}
        step={10}
        value={depth}
        onChange={setDepth}
        marks={DEPTH_MARKS}
        aria-label="Ocean depth"
        className="w-full"
      />
    </div>
  );
};

export default DepthSlider;