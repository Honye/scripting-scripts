Scripting 提供对「健康」App 中用户跟踪的**用药（Medications）**及其记录的**服药事件（dose event）**的只读访问，通过 `Health.queryMedications()` 与 `Health.queryMedicationDoseEvents()` 实现。

> 需要 iOS 26.0 或更高版本。在更早的系统上，这两个函数都会以错误 reject。

本指南介绍如何列出用户的用药，以及如何读取用户记录的服药情况。

---

## 用药与服药事件

* **用药**（`HealthUserAnnotatedMedication`）是用户在「健康」App 中跟踪的药物，包含 `nickname`（昵称）、`isArchived`（是否归档）、`hasSchedule`（是否设置了提醒计划）以及 `medication`（药物概念）。
* **药物概念**（`HealthMedicationConcept`）描述药物本身：稳定的 `identifier`、`displayText`（名称）、`generalForm`（剂型，如 `"tablet"`、`"injection"`）以及 `relatedCodings`（如 RxNorm 编码）。
* **服药事件**（`HealthMedicationDoseEvent`）是一次记录的服药 —— 已服用、跳过、暂停或未交互。它通过 `medicationConceptIdentifier` 回链到某个用药。

---

## 权限

用药数据使用**按对象授权（per-object authorization）**：首次调用 `Health.queryMedications()` 时，系统会让用户选择允许脚本访问哪些用药。Scripting 会自动发起该授权 —— 你无需自行请求授权。

---

## API 概览

```ts
Health.queryMedications(options?: {
  isArchived?: boolean
  hasSchedule?: boolean
  limit?: number
}): Promise<HealthUserAnnotatedMedication[]>

Health.queryMedicationDoseEvents(options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
  strictStartDate?: boolean
  strictEndDate?: boolean
  sortDescriptors?: Array<{
    key: "startDate" | "endDate"
    order?: "forward" | "reverse"
  }>
  statuses?: HealthMedicationDoseEventLogStatus[]
  scheduledStartDate?: Date
  scheduledEndDate?: Date
  medicationConceptIdentifiers?: string[]
}): Promise<HealthMedicationDoseEvent[]>
```

---

## 示例：列出在用的用药

```ts
const medications = await Health.queryMedications({
  isArchived: false,
})

for (const item of medications) {
  console.log("名称:", item.nickname ?? item.medication.displayText)
  console.log("剂型:", item.medication.generalForm)
  console.log("是否有计划:", item.hasSchedule)
}
```

---

## 示例：读取今天的服药事件

```ts
const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)

const doses = await Health.queryMedicationDoseEvents({
  startDate: startOfDay,
  endDate: new Date(),
  sortDescriptors: [{ key: "startDate", order: "reverse" }],
})

for (const dose of doses) {
  console.log("状态:", dose.logStatus)       // "taken" | "skipped" | ...
  console.log("剂量:", dose.doseQuantity, dose.unit.unitString)
  console.log("时间:", dose.startDate)
}
```

---

## 示例：某个用药的服药记录

用某个用药的 `identifier` 只取它的服药事件：

```ts
const medications = await Health.queryMedications({ isArchived: false })
const target = medications[0]

const doses = await Health.queryMedicationDoseEvents({
  medicationConceptIdentifiers: [target.medication.identifier],
  statuses: ["taken"],
})

console.log(`${target.medication.displayText} 共记录了 ${doses.length} 次已服用`)
```

---

## 说明

* `Health.queryMedications()` 返回 `HealthUserAnnotatedMedication` 实例；`Health.queryMedicationDoseEvents()` 返回 `HealthMedicationDoseEvent` 实例。
* `scheduledDate` 与 `scheduledDoseQuantity` 仅在按计划的服药事件（`scheduleType === "schedule"`）中存在；按需服药时为 `null`。
* 服药事件的 `medicationConceptIdentifier` 与用药概念的 `identifier` 一致，可据此按用药分组服药记录。
* 这两个 API 均为只读 —— 用药与服药事件由「健康」App 管理，无法从脚本创建。

---

## 小结

1. 用 `Health.queryMedications()` 列出用户跟踪的用药。
2. 用 `Health.queryMedicationDoseEvents()` 读取记录的服药，可按日期、状态、计划时间窗口或用药过滤。
3. 用 `HealthMedicationConcept.identifier` / `HealthMedicationDoseEvent.medicationConceptIdentifier` 关联二者。
