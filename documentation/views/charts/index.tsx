import { ScrollView } from "scripting"
import { BarChartExample } from "./bar"
import { LineChartExample } from "./line"
import { RectChartExample } from "./rect"
import { AreaChartExample } from "./area"
import { BarStackChartExample } from "./bar_stack"
import { LineCategoryChartExample } from "./line_category"
import { MultipleChartsExample } from "./mutiple_charts"
import { AreaStackChartExample } from "./area_stack"
import { BarGanttChartExample } from "./bar_gantt"
import { RangeAreaChartExample } from "./range_area"
import { Bar1DChartExample } from "./bar_1d"
import { PointChartExample } from "./point"
import { Point1DChartExample } from "./point_1d"
import { PointCategoryChartExample } from "./point_category"
import { HeatMapChartExample } from "./heat_map"
import { RuleChartExample } from "./rule"
import { RectAreaChartExample } from "./rect_area"
import { PieChartExample } from "./pie"
import { DonutChartExample } from "./donut"

export function ChartsExample() {

  return <ScrollView
    navigationTitle={"Charts"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <BarChartExample />
    <BarStackChartExample />
    <Bar1DChartExample />
    <BarGanttChartExample />
    <LineChartExample />
    <LineCategoryChartExample />
    <RectChartExample />
    <HeatMapChartExample />
    <RectAreaChartExample />
    <AreaChartExample />
    <AreaStackChartExample />
    <RangeAreaChartExample />
    <PointChartExample />
    <Point1DChartExample />
    <PointCategoryChartExample />
    <RuleChartExample />
    <PieChartExample />
    <DonutChartExample />
    <MultipleChartsExample />
  </ScrollView>
}