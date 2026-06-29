The Scripting app provides read access to the **Medications** a person tracks in the Health app, together with their logged **dose events**, using `Health.queryMedications()` and `Health.queryMedicationDoseEvents()`.

> Requires iOS 26.0 or later. On earlier systems both functions reject with an error.

This guide explains how to list a person's medications and how to read the doses they logged.

---

## Medications and Dose Events

* A **medication** (`HealthUserAnnotatedMedication`) is something the person tracks in the Health app. It carries a `nickname`, an `isArchived` flag, a `hasSchedule` flag, and a `medication` concept.
* A **medication concept** (`HealthMedicationConcept`) describes the medication itself: a stable `identifier`, a `displayText` name, a `generalForm` (such as `"tablet"` or `"injection"`), and `relatedCodings` (such as RxNorm codes).
* A **dose event** (`HealthMedicationDoseEvent`) is a single logged dose — taken, skipped, snoozed, or not interacted with. It links back to a medication through `medicationConceptIdentifier`.

---

## Permission

Medications use **per-object authorization**: the first time you call `Health.queryMedications()`, the system asks the person to choose which medications your script may access. The Scripting app requests this automatically — you don't request authorization yourself.

---

## API Overview

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

## Example: Listing Active Medications

```ts
const medications = await Health.queryMedications({
  isArchived: false,
})

for (const item of medications) {
  console.log("Name:", item.nickname ?? item.medication.displayText)
  console.log("Form:", item.medication.generalForm)
  console.log("Scheduled:", item.hasSchedule)
}
```

---

## Example: Reading Today's Dose Events

```ts
const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)

const doses = await Health.queryMedicationDoseEvents({
  startDate: startOfDay,
  endDate: new Date(),
  sortDescriptors: [{ key: "startDate", order: "reverse" }],
})

for (const dose of doses) {
  console.log("Status:", dose.logStatus)       // "taken" | "skipped" | ...
  console.log("Dose:", dose.doseQuantity, dose.unit.unitString)
  console.log("When:", dose.startDate)
}
```

---

## Example: Doses for a Specific Medication

Use a medication's `identifier` to fetch only its doses:

```ts
const medications = await Health.queryMedications({ isArchived: false })
const target = medications[0]

const doses = await Health.queryMedicationDoseEvents({
  medicationConceptIdentifiers: [target.medication.identifier],
  statuses: ["taken"],
})

console.log(`Logged ${doses.length} taken dose(s) of ${target.medication.displayText}`)
```

---

## Notes

* `Health.queryMedications()` returns `HealthUserAnnotatedMedication` instances; `Health.queryMedicationDoseEvents()` returns `HealthMedicationDoseEvent` instances.
* `scheduledDate` and `scheduledDoseQuantity` are only present for scheduled dose events (`scheduleType === "schedule"`); they are `null` for as-needed doses.
* A dose event's `medicationConceptIdentifier` matches the `identifier` of the medication's concept, so you can group doses by medication.
* These APIs are read-only — medications and dose events are managed by the Health app and can't be created from a script.

---

## Summary

1. Use `Health.queryMedications()` to list the medications a person tracks.
2. Use `Health.queryMedicationDoseEvents()` to read logged doses, filtered by date, status, schedule window, or medication.
3. Link the two with `HealthMedicationConcept.identifier` / `HealthMedicationDoseEvent.medicationConceptIdentifier`.
