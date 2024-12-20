The `Reminder` API allows you to create, edit, and manage reminders in a calendar. This includes setting titles, due dates, priorities, and recurrence rules.

### Reminder Properties

- **identifier**: `string (readonly)` – Unique identifier for the reminder.
- **calendar**: `Calendar` – The calendar associated with the reminder.
- **title**: `string` – Title of the reminder.
- **notes**: `string (optional)` – Notes for the reminder.
- **isCompleted**: `boolean` – Whether the reminder is completed.
- **priority**: `number` – Priority level of the reminder.
- **completionDate**: `Date (optional)` – The date on which the reminder was completed.
- **dueDate**: `Date (optional)` – Due date for the reminder.
- **dueDateIncludesTime**: `boolean` – Indicates whether the `dueDate` includes a time.
- **recurrenceRules**: `RecurrenceRule[] (optional)` – Array of recurrence rules.
- **hasRecurrenceRules**: `boolean` – Indicates if the reminder has recurrence rules.

### Reminder Methods

- **addRecurrenceRule(rule)**: Adds a recurrence rule to the reminder’s recurrence rules array.
  ```ts
  reminder.addRecurrenceRule(myRecurrenceRule)
  ```

- **removeRecurrenceRule(rule)**: Removes a specific recurrence rule from the reminder’s recurrence rules array.
  ```ts
  reminder.removeRecurrenceRule(myRecurrenceRule)
  ```

- **remove()**: Removes the reminder from the calendar.
  ```ts
  await reminder.remove()
  ```

- **save()**: Saves changes to the reminder.
  ```ts
  await reminder.save()
  ```

- **getAll(calendars)**: Retrieves all reminders from specified calendars, or all if no calendars are specified.
  ```ts
  const allReminders = await Reminder.getAll([myCalendar])
  ```

- **getIncompletes(options)**: Retrieves all incomplete reminders within a specified date range and calendar.
  ```ts
  const incompleteReminders = await Reminder.getIncompletes({
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    calendars: [myCalendar]
  })
  ```

- **getCompleteds(options)**: Retrieves all completed reminders within a specified date range and calendar.
  ```ts
  const completedReminders = await Reminder.getCompleteds({
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    calendars: [myCalendar]
  })
  ```
