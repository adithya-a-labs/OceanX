import { useOceanStore } from '../../store';
import { Slider } from '../ui';
import { formatDepth } from '../../utils/formatters';

export const DepthSlider = () => {
  const manifest = useOceanStore((s) => s.manifest);
  const depth = useOceanStore((s) => s.depth);
  const setDepth = useOceanStore((s) => s.setDepth);
  const levels = manifest?.depths ?? [];
  const actual = levels.find(d => d.requestedDepthM === depth)?.actualDepthM;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Depth
        </label>
        <span className="text-sm font-mono text-text-primary">
          {formatDepth(depth)}{actual !== undefined ? ` target (model ${actual.toFixed(1)} m)` : ''}
        </span>
      </div>
      <Slider
        min={0}
        max={levels.at(-1)?.requestedDepthM ?? 500}
        step={50}
        value={depth}
        onChange={setDepth}
        marks={levels.map(d => ({ value: d.requestedDepthM, label: d.requestedDepthM === 0 ? 'surface' : `~${d.requestedDepthM}m` }))}
        aria-label="Ocean depth"
        className="w-full"
      />
    </div>
  );
};

export default DepthSlider;
