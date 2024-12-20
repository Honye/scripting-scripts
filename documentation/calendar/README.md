The `Calendar` API allows you to interact with iOS calendars, enabling operations like retrieving default calendars, creating custom calendars, and managing calendar settings and events.

### Calendar Properties

- **identifier**: `string` – Unique identifier for the calendar.
- **title**: `string` – Title of the calendar (modifiable).
- **color**: `Color` – Color of the calendar.
- **type**: `CalendarType` – Type of calendar (`birthday`, `calDAV`, `exchange`, `local`, or `subscription`).
- **allowedEntityTypes**: `CalendarEntityType` – Entity types supported (`event` or `reminder`).
- **isForEvents**: `boolean` – Indicates if the calendar supports events.
- **isForReminders**: `boolean` – Indicates if the calendar supports reminders.
- **allowsContentModifications**: `boolean` – Whether the calendar allows adding, editing, and deleting items.
- **isSubscribed**: `boolean` – Indicates if the calendar is a subscribed calendar.
- **supportedEventAvailabilities**: `CalendarEventAvailability` – Specifies supported event availability settings (`busy`, `free`, `tentative`, `unavailable`).

### Calendar Methods

- **remove()**: Removes the calendar.
  ```ts
  await calendar.remove()
  ```

- **save()**: Saves any changes made to the calendar’s properties.
  ```ts
  await calendar.save()
  ```

- **defaultForEvents()**: Retrieves the default calendar for events.
  ```ts
  const defaultEventCalendar = await Calendar.defaultForEvents()
  ```

- **defaultForReminders()**: Retrieves the default calendar for reminders.
  ```ts
  const defaultReminderCalendar = await Calendar.defaultForReminders()
  ```

- **forEvents()**: Retrieves all calendars that support events.
  ```ts
  const eventCalendars = await Calendar.forEvents()
  ```

- **forReminders()**: Retrieves all calendars that support reminders.
  ```ts
  const reminderCalendars = await Calendar.forReminders()
  ```

- **create(options)**: Creates a new calendar with specified options (e.g., title, entityType, sourceType, color).
  ```ts
  const newCalendar = await Calendar.create({
    title: "Work Calendar",
    entityType: "event",
    sourceType: "local",
    color: "#FF5733",
  })
  ```

- **presentChooser(allowMultipleSelection)**: Presents a calendar chooser to the user, allowing multiple selection if specified.
  ```ts
  const chosenCalendars = await Calendar.presentChooser(true)
  ```
