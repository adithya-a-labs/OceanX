import { VariableSelector, DepthSlider, TimeScrubber, LayerToggles, Legend } from '../controls';

export const ControlPanel = () => {
  return (
    <aside className="control-panel flex flex-col h-full overflow-y-auto space-y-6">
      <VariableSelector />
      <DepthSlider />
      <TimeScrubber />
      <LayerToggles />
      <Legend />
    </aside>
  );
};

export default ControlPanel;