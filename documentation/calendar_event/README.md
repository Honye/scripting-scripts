The `CalendarEvent` API enables you to create and manage events in iOS calendars, with properties like title, location, dates, attendees, and recurrence.

### CalendarEvent Properties

- **identifier**: `string (readonly)` – Unique identifier for the event.
- **calendar**: `Calendar` – Calendar associated with the event.
- **title**: `string` – Title of the event.
- **notes**: `string (optional)` – Notes for the event.
- **url**: `string (optional)` – URL associated with the event.
- **isAllDay**: `boolean` – Indicates if the event lasts all day.
- **startDate**: `Date` – Event’s start date and time.
- **endDate**: `Date` – Event’s end date and time.
- **location**: `string (optional)` – Location of the event.
- **timeZone**: `string (optional)` – Time zone of the event.
- **attendees**: `EventParticipant[] | null (readonly)` – Array of event attendees.
- **recurrenceRules**: `RecurrenceRule[] (optional)` – Array of recurrence rules.
- **hasRecurrenceRules**: `boolean` – Indicates if the reminder has recurrence rules.

### CalendarEvent Methods

- **addRecurrenceRule(rule)**: Adds a recurrence rule to the event’s recurrence rules array.
  ```ts
  event.addRecurrenceRule(myRecurrenceRule)
  ```

- **removeRecurrenceRule(rule)**: Removes a specific recurrence rule from the event’s recurrence rules array.
  ```ts
  event.removeRecurrenceRule(myRecurrenceRule)
  ```

- **remove()**: Deletes the event from the calendar.
  ```ts
  await event.remove()
  ```

- **save()**: Saves any changes made to the event’s properties.
  ```ts
  await event.save()
  ```

- **getAll(startDate, endDate, calendars)**: Retrieves all events within a specified date range and calendars.
  ```ts
  const events = await CalendarEvent.getAll(new Date("2024-01-01"), new Date("2024-12-31"), [myCalendar])
  ```
