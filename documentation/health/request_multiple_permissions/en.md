When a script needs access to several kinds of HealthKit data, you don't have to ask for each permission separately. If you trigger multiple permission-requiring `Health` APIs around the same time, the app collects the pending authorizations within a short window and presents a **single** HealthKit authorization sheet that lists all of them.

This keeps the experience clean: the user sees one combined sheet instead of a chain of separate prompts.

---

## How It Works

Every read/write `Health` API (such as `queryQuantitySamples`, `queryCategorySamples`, `queryWorkouts`, or `dateOfBirth`) requests authorization for the data it touches before running. When you start several of them together, those requests are merged:

* Requests that arrive close together are batched into one authorization sheet.
* Data types that were already authorized are skipped, so no sheet appears when nothing new is needed.
* If more requests arrive while a sheet is still on screen, they are queued and presented after the current one is dismissed.

You don't call any explicit "request permission" method — just call the APIs you need, and authorization is requested automatically.

---

## Requesting Multiple Permissions at Once

Use `Promise.all` (or `Promise.allSettled`) to start the queries together:

```ts
const results = await Promise.allSettled([
  Health.queryQuantitySamples("stepCount", { limit: 1 }),
  Health.queryQuantitySamples("heartRate", { limit: 1 }),
  Health.queryCategorySamples("sleepAnalysis", { limit: 1 }),
  Health.queryWorkouts({ limit: 1 }),
  Health.dateOfBirth(),
])

console.log(results)
```

All of these queries touch different HealthKit data types, so HealthKit shows one sheet covering every type that still needs authorization.

---

## Requesting One at a Time

If you `await` each request before starting the next, every call completes its authorization before the following one begins, so the user may see a separate sheet for each:

```ts
await Health.queryQuantitySamples("stepCount", { limit: 1 })
await Health.queryCategorySamples("sleepAnalysis", { limit: 1 })
await Health.queryWorkouts({ limit: 1 })
```

Prefer starting requests together when you know up front which data types your script needs.

---

## Notes

* `Health` APIs require a Scripting PRO subscription.
* Check `Health.isHealthDataAvailable` before querying; it is `false` on devices without HealthKit.
* The authorization sheet only lists data types that are not yet determined. If everything is already authorized, no sheet appears and the queries run immediately.
