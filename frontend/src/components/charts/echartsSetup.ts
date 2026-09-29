/**
 * Shared ECharts registration.
 *
 * Both chart components plot the same axis types, so the module registration
 * lives here once. `echarts.use` is keyed by component name, so importing this
 * from several charts is safe and avoids each file re-declaring its own list.
 */
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Axis is built into echarts core, no need to import separately
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export { echarts };
export default echarts;
