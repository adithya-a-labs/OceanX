import { VariableSelector, DepthSlider, TimeScrubber, LayerToggles, Legend, ProfileSelector } from '../controls';

export const ControlPanel = () => {
  return (
    // No h-full: .control-panel is positioned with top/bottom, and an explicit
    // height would override `bottom: 64px` and hang the panel over the footer.
    <aside className="control-panel flex flex-col overflow-y-auto space-y-6">
      <ProfileSelector />
      <VariableSelector />
      <DepthSlider />
      <TimeScrubber />
      <LayerToggles />
      <Legend />
    </aside>
  );
};

export default ControlPanel;