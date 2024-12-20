import { VirtualNode } from "scripting"
import { PresentViewsExample } from "./views/present_views"
import { TextExample } from "./views/displaying_text"
import { ImageExample } from "./views/image"
import { ButtonExample } from "./views/button"
import { HStackExample } from "./views/layout/hstack"
import { VStackExample } from "./views/layout/vstack"
import { ZStackExample } from "./views/layout/zstack"
import { GridExample } from "./views/layout/grid"
import { LazyHStackExample } from "./views/layout/lazy_hstack"
import { LazyVStackExample } from "./views/layout/lazy_vstack"
import { LazyVGridExample } from "./views/layout/lazy_vgrid"
import { LazyHGridExample } from "./views/layout/lazy_hgrid"
import { TextInputExample } from "./views/text_input"
import { ToggleExample } from "./views/controls/toggle"
import { StepperExample } from "./views/controls/stepper"
import { SliderExample } from "./views/controls/slider"
import { ProgressViewExample } from "./views/controls/progress_view"
import { PickerExample } from "./views/controls/picker"
import { DatePickerExample } from "./views/controls/date_picker"
import { ColorPickerExample } from "./views/controls/color_picker"
import { GaugeExample } from "./views/controls/gauge"
import { ContentUnavailableViewExample } from "./views/controls/content_unavailable_view"
import { MenuExample } from "./views/menu"
import { ShapesExample } from "./views/shapes"
import { DisplayDataInsideARowExample } from "./views/list/display_data_inside_a_row"
import { RepresentDataHierarchyInSectionsExample } from "./views/list/represent_data_hierarchy_in_sections"
import { ListStyleExample } from "./views/list/list_style"
import { UseListForNavigationsExample } from "./views/list/use_list_for_navigations"
import { DisclosureGroupExample } from "./views/list/disclosure_group"
import { ListInteractionExample } from "./views/list/list_interaction"
import { RefresableListExample } from "./views/list/refreshable_list"
import { EditableListExample } from "./views/list/editable_list"
import { GroupSmaple } from "./views/view_groupings/group"
import { SectionExample } from "./views/view_groupings/section"
import { IteratingExample } from "./views/view_groupings/iterating"
import { GroupBoxExample } from "./views/view_groupings/group_box"
import { FormExample } from "./views/view_groupings/form"
import { ControlGroupExample } from "./views/view_groupings/control_group"
import { ScrollViewExample } from "./views/scrollview"
import { GesturesExample } from "./views/gestures"
import { TwoColumnSplitViewExample } from "./views/navigation/navigation_split_view/two_column"
import { ThreeColumnSplitViewExample } from "./views/navigation/navigation_split_view/three_column"
import { ControlColumnVisibilityExample } from "./views/navigation/navigation_split_view/control_column_visibility"
import { CollapsedSplitViewsExample } from "./views/navigation/navigation_split_view/collapsed_split_views"
import { WithNavigationLinkExample } from "./views/navigation/navigation_stack/with_navigation_link"
import { WithNavigationDestinationExample } from "./views/navigation/navigation_stack/with_navigation_destination"
import { TabViewWithBadgeExample } from "./views/navigation/tab_view/with_badge"
import { TabViewWithMultipleScrollingPagesExample } from "./views/navigation/tab_view/with_multiple_scrolling_pages"
import { DialogExample } from "./views/dialog"
import { ModalPresentationsExample } from "./views/modal_presentations"
import { ToolbarExample } from "./views/toolbars"
import { SearchExample } from "./views/search"
import { DeviceExample } from "./device"
import { SafariExample } from "./safari"
import { WebViewExample } from "./views/webview"
import { ClipboardExample } from "./clipboard"
import { StorageExample } from "./storage"
import { PathExample } from "./path"
import { HapticFeedbackExample } from "./haptic_feedback"
import { KeychainExample } from "./keychain"
import { LocalAuthExample } from "./local_auth"
import { QRCodeExample } from "./qrcode"
import { RequestExample } from "./request"
import { ScriptExample } from "./script"
import { ShareSheetExample } from "./share_sheet"
import { WidgetExample } from "./widget/index"
import { IntentExample } from "./intent/index"
import { QuickStartView } from "./quick_start"
import { LocationExample } from "./location"
import { CalendarExample } from "./calendar"
import { CalendarEventExample } from "./calendar_event"
import { ReminderExample } from "./reminder"
import { RecurrenceExample } from "./recurrence"
import { FileManagerDocumentation } from "./file_manager"
import { PhotosDocumentation } from "./photos"
import { DocumentPickerDocumentation } from "./document_picker"
import { LiveActivityDocumentation } from "./live_activity"
import { ChartsExample } from "./views/charts"
import { AudioPlayerDocumentation } from "./audio_player"
import { VideoPlayerExample } from "./video_player"
import { AudioRecorderDocumentation } from "./audio_recorder"
import { DataAndUIImageDocumentation } from "./data_and_uiimage"
import { NotificationDocumentation } from "./notification/index"
import { SharedAudioSessionDocumentation } from "./shared_audio_session"
import { SpeechDocumentation } from "./speech"
import { SpeechRecognitionDocumentation } from "./speech_recognition"

export type RouteItem = {
  title: string
  subtitle?: string
  destination?: VirtualNode
  children?: RouteItem[]
  keywords?: string[]
}

export const routes: RouteItem[] = [
  {
    title: "Quick Start",
    subtitle: "Quickly master the use of Scripting app.",
    destination: <QuickStartView />
  },
  {
    title: "Widget",
    subtitle: "Create widgets to show your script’s content on the Home screen.",
    destination: <WidgetExample />,
  },
  {
    title: "Intent",
    subtitle: "An interface for providing an app-specific capability that people invoke from system experiences like Siri and the Shortcuts app.",
    destination: <IntentExample />
  },
  {
    title: "Views",
    subtitle: "Views are the building blocks that you use to declare the user interface.",
    children: [
      {
        title: "Present views",
        subtitle: "Present views by your script.",
        destination: <PresentViewsExample />,
        keywords: ["page", "navigation"]
      },
      {
        title: "Displaying text",
        subtitle: "Display formatted text.",
        destination: <TextExample />,
        keywords: ["text", "attributedstring", "richtext", "label"]
      },
      {
        title: "Image",
        subtitle: "Add images and symbols to your app’s user interface.",
        destination: <ImageExample />,
        keywords: ["image", "qr", "network"]
      },
      {
        title: "Button",
        subtitle: "A control that initiates an action.",
        destination: <ButtonExample />,
        keywords: ["button", "gesture"]
      },
      {
        title: "Layout",
        subtitle: "Arrange views inside built-in layout containers like stacks and grids.",
        children: [
          {
            title: "HStack",
            subtitle: "A view that arranges its subviews in a horizontal line.",
            destination: <HStackExample />
          },
          {
            title: "VStack",
            subtitle: "A view that arranges its subviews in a vertical line.",
            destination: <VStackExample />,
          },
          {
            title: "ZStack",
            subtitle: "A view that overlays its subviews, aligning them in both axes.",
            destination: <ZStackExample />
          },
          {
            title: "Grid",
            subtitle: "A container view that arranges other views in a two dimensional layout.",
            destination: <GridExample />
          },
          {
            title: "LazyHStack",
            subtitle: "A view that arranges its children in a line that grows horizontally, creating items only as needed.",
            destination: <LazyHStackExample />
          },
          {
            title: "LazyVStack",
            subtitle: "A view that arranges its children in a line that grows vertically, creating items only as needed.",
            destination: <LazyVStackExample />
          },
          {
            title: "LazyHGrid",
            subtitle: "A container view that arranges its child views in a grid that grows horizontally, creating items only as needed.",
            destination: <LazyHGridExample />
          },
          {
            title: "LazyVGrid",
            subtitle: "A container view that arranges its child views in a grid that grows vertically, creating items only as needed.",
            destination: <LazyVGridExample />
          }
        ]
      },
      {
        title: "Text input",
        subtitle: "Get text input from the user.",
        destination: <TextInputExample />,
        keywords: ["textfield", "securefield", "form", "input"]
      },
      {
        title: "Controls",
        subtitle: "Display values and get user selections.",
        children: [
          {
            title: "Toggle",
            subtitle: "A control that toggles between on and off states.",
            destination: <ToggleExample />,
            keywords: ["switch"]
          },
          {
            title: "Stepper",
            subtitle: "A control that performs increment and decrement actions.",
            destination: <StepperExample />,
            keywords: ["plus", "minus"]
          },
          {
            title: "Slider",
            subtitle: "A control for selecting a value from a bounded linear range of values.",
            destination: <SliderExample />
          },
          {
            title: "ProgressView",
            subtitle: "A view that shows the progress toward completion of a task.",
            destination: <ProgressViewExample />,
            keywords: ["refresh", "indicator"]
          },
          {
            title: "Picker",
            subtitle: "A control for selecting from a set of mutually exclusive values.",
            destination: <PickerExample />,
            keywords: ["selector", "options"]
          },
          {
            title: "DatePicker",
            subtitle: "A control for selecting an absolute date.",
            destination: <DatePickerExample />,
            keywords: ["time", "calendar"]
          },
          {
            title: "ColorPicker",
            subtitle: "A control used to select a color from the system color picker UI.",
            destination: <ColorPickerExample />
          },
          {
            title: "Gauge",
            subtitle: "A view that shows a value within a range.",
            destination: <GaugeExample />
          },
          {
            title: "ContentUnavailableView",
            subtitle: "An interface, consisting of a label and additional content, that you display when the content of your app is unavailable to users.",
            destination: <ContentUnavailableViewExample />,
            keywords: ["no data", "empty"]
          }
        ]
      },
      {
        title: "Menu",
        subtitle: "Use a menu to provide people with easy access to common commands. ",
        destination: <MenuExample />,
        keywords: ["context menu",]
      },
      {
        title: "Shapes",
        subtitle: "Draw shapes like circles and rectangles, as well as custom paths that define shapes of your own design.",
        destination: <ShapesExample />,
        keywords: ["rect", "circle", "rounded rect", "ellipse", "UnevenRoundedRectangle", "Capsule"]
      },
      {
        title: "List",
        subtitle: "Use a list to display a one-dimensional vertical collection of views.",
        children: [
          {
            title: "Display data inside a row",
            destination: <DisplayDataInsideARowExample />,
          },
          {
            title: "Represent data hierarchy in sections",
            destination: <RepresentDataHierarchyInSectionsExample />,
            keywords: ["section"]
          },
          {
            title: "Use list for navigations",
            destination: <UseListForNavigationsExample />,
            keywords: ["navigationlink"]
          },
          {
            title: "DisclosureGroup",
            subtitle: "A view that shows or hides another content view, based on the state of a disclosure control.",
            destination: <DisclosureGroupExample />,
            keywords: ["collapse"]
          },
          {
            title: "List style",
            subtitle: "Sets the style for lists within this view.",
            destination: <ListStyleExample />,
            keywords: ["listStyle"]
          },
          {
            title: "List interaction",
            subtitle: "Adds custom swipe actions to a row in a list.",
            destination: <ListInteractionExample />,
            keywords: ["swipeActions"]
          },
          {
            title: "Refresable List",
            subtitle: "Marks this view as refreshable.",
            destination: <RefresableListExample />,
            keywords: ["refresh", "pull down refresh"]
          },
          {
            title: "Editable List",
            subtitle: "Move and delete list item.",
            destination: <EditableListExample />,
            keywords: ["swipe left", "swipe right", "drag", "move", "delete", "remove"]
          }
        ]
      },
      {
        title: "View groupings",
        subtitle: "Present views in different kinds of purpose-driven containers, like forms or control groups.",
        children: [
          {
            title: "Grouping views into a container",
            destination: <GroupSmaple />,
            keywords: ["group"]
          },
          {
            title: "Organizing views into sections",
            destination: <SectionExample />,
            keywords: ["section"]
          },
          {
            title: "Iterating over dynamic data",
            destination: <IteratingExample />,
            keywords: ["foreach"]
          },
          {
            title: "Grouping views into a box",
            destination: <GroupBoxExample />,
            keywords: ["groupbox"]
          },
          {
            title: "Form",
            subtitle: "A container for grouping controls used for data entry, such as in settings or inspectors.",
            destination: <FormExample />,
          },
          {
            title: "ControlGroup",
            subtitle: "A container view that displays semantically-related controls in a visually-appropriate manner for the context.",
            destination: <ControlGroupExample />,
            keywords: ["menu", "toolbar"]
          }
        ]
      },
      {
        title: "Scroll views",
        subtitle: "Enable people to scroll to content that doesn’t fit in the current display.",
        destination: <ScrollViewExample />
      },
      {
        title: "Gestures",
        subtitle: "Define interactions from taps, clicks, and swipes to fine-grained gestures.",
        destination: <GesturesExample />,
        keywords: ["tap", "onTapGesture", "doubleTap", "long press"]
      },
      {
        title: "Navigation",
        subtitle: "Enable people to move between different parts of your app’s view hierarchy within a scene.",
        children: [
          {
            title: "NavigationStack",
            subtitle: "A view that displays a root view and enables you to present additional views over the root view.",
            children: [
              {
                title: "Use with NavigationLink",
                destination: <WithNavigationLinkExample />,
              },
              {
                title: "Use with navigationDestination",
                destination: <WithNavigationDestinationExample />
              }
            ]
          },
          {
            title: "TabView",
            subtitle: "A view that switches between multiple child views using interactive user interface elements.",
            children: [
              {
                title: "TabView with badge",
                destination: <TabViewWithBadgeExample />
              },
              {
                title: "TabView with multiple scrolling pages",
                destination: <TabViewWithMultipleScrollingPagesExample />,
                keywords: ["swiper"]
              }
            ]
          },
          {
            title: "NavigationSplitView (for iPad)",
            subtitle: "A view that presents views in two or three columns, where selections in leading columns control presentations in subsequent columns.",
            children: [
              {
                title: "Two-column",
                destination: <TwoColumnSplitViewExample />
              },
              {
                title: "Three-column",
                destination: <ThreeColumnSplitViewExample />
              },
              {
                title: "Control column visibility",
                destination: <ControlColumnVisibilityExample />
              },
              {
                title: "Collapsed split views",
                destination: <CollapsedSplitViewsExample />
              }
            ]
          },
        ]
      },
      {
        title: "WebView",
        subtitle: "An view that displays interactive web content.",
        destination: <WebViewExample />,
        keywords: ['WebViewController', "evaluateJavaScript", "load website"]
      },
      {
        title: "Dialog",
        subtitle: "This interface provides some shortcut methods for displaying dialog boxes.",
        destination: <DialogExample />,
        keywords: ["alert", "confirm", "prompt", "actionsheet"]
      },
      {
        title: "Modal presentaions",
        subtitle: "Present content in a separate view that offers focused interaction.",
        destination: <ModalPresentationsExample />,
        keywords: ["sheet", "popover", "fullscreencover"]
      },
      {
        title: "Toolbars",
        subtitle: "Provide immediate access to frequently used commands and controls.",
        destination: <ToolbarExample />,
        keywords: ["navigationbar", "bottombar", "keyboard"]
      },
      {
        title: "Search",
        subtitle: "Enable people to search for text or other content within your script UI.",
        destination: <SearchExample />,
        keywords: ["searchbar"]
      },
      {
        title: "Charts",
        subtitle: "Transform your data into informative visualizations.",
        keywords: ["LineChart", "BarChart", "RectChart", "RuleChart", "LineCategoryChart", "BarStackChart", "AreaStackChart", "BarGanttChart", "RangeAreaChart", "Bar1DChart", "PointChart", "PointCategoryChart",
          "HeatMapChart", "RuleLineChart", "RectAreaChart", "PieChart", "DonutChart"
        ],
        destination: <ChartsExample />
      }
    ]
  },
  {
    title: "Device",
    subtitle: "Provides the information abouts the device, also some methods to use the capabilities of the device.",
    destination: <DeviceExample />,
    keywords: ["isiphone", "isIpad", "system", "orientation", "battery", "portrait", "landscape", "locale", "timezone"]
  },
  {
    title: "Data and UIImage",
    subtitle: "These interfaces simplify working with binary data and images, allowing you to handle common scenarios easily in your scripts.",
    destination: <DataAndUIImageDocumentation />
  },
  {
    title: "Safari",
    subtitle: "Present a website either in-app or leaving the app and opening the system default browser.",
    destination: <SafariExample />,
    keywords: ["openURL", "in-app browser", "urlscheme"]
  },
  {
    title: "Clipboard",
    subtitle: "Read and set the clipboard.",
    keywords: ["copy", "pasteboard"],
    destination: <ClipboardExample />
  },
  {
    title: "Storage",
    subtitle: "Providing a persistent store for simple data.",
    keywords: ["save cache", "set storage", "localstorage"],
    destination: <StorageExample />
  },
  {
    title: "DocumentPicker",
    subtitle: "Pick files from Files app.",
    keywords: ["document", "export files", "pick files", "pick directory"],
    destination: <DocumentPickerDocumentation />
  },
  {
    title: "Path",
    subtitle: "The interface provides utilities for working with file and directory paths.",
    destination: <PathExample />,
  },
  {
    title: "FileManager",
    subtitle: "A convenient interface to the contents of the file system, and the primary means of interacting with it.",
    keywords: ["filesystem", "createdirectory", "createfile", "readdirectory", "readfile", "removefile", "removedirectory", "fileexists"],
    destination: <FileManagerDocumentation />
  },
  {
    title: "HapticFeedback",
    subtitle: "Haptic feedback provides a tactile response, such as a tap, that draws attention and reinforces both actions and events.",
    destination: <HapticFeedbackExample />
  },
  {
    title: "Keychain",
    subtitle: "The interface to store data in Keychain.",
    keywords: ["securestorage"],
    destination: <KeychainExample />,
  },
  {
    title: "LocalAuth",
    subtitle: "This interface provides authentication with biometrics such as fingerprint or facial recognition.",
    keywords: ["faceID", "fingerprint", "touchID", "passCode"],
    destination: <LocalAuthExample />
  },
  {
    title: "Calendar",
    subtitle: "This interface allows you to interact with iOS calendars, enabling operations like retrieving default calendars, creating custom calendars, and managing calendar settings and events.",
    destination: <CalendarExample />
  },
  {
    title: "CalendarEvent",
    subtitle: "This interface enables you to create and manage events in iOS calendars, with properties like title, location, dates, attendees, and recurrence.",
    destination: <CalendarEventExample />
  },
  {
    title: "Reminder",
    subtitle: "This interface allows you to create, edit, and manage reminders in a calendar. This includes setting titles, due dates, priorities, and recurrence rules.",
    destination: <ReminderExample />
  },
  {
    title: "Recurrence",
    subtitle: "The recurrence-related types and classes allow you to define and manage recurring patterns for events and reminders.",
    destination: <RecurrenceExample />
  },
  {
    title: "LiveActivity",
    subtitle: "Display your Script’s data in the Dynamic Island and on the Lock Screen and offer quick interactions.",
    destination: <LiveActivityDocumentation />
  },
  {
    title: "Location",
    subtitle: "Getting the current location of your device.",
    keywords: ["get current location", "reverse geocode"],
    destination: <LocationExample />,
  },
  {
    title: "Notification",
    subtitle: "The interface for managing local notification-related activities.",
    destination: <NotificationDocumentation />
  },
  {
    title: "Photos",
    subtitle: "The interface that manages access and changes to the user’s photo library.",
    keywords: ["save photo", "pick photos", "take photo", "get latest photos"],
    destination: <PhotosDocumentation />
  },
  {
    title: "QRCode",
    subtitle: "Parse the QR code image file, or open the scan code page to scan.",
    destination: <QRCodeExample />
  },
  {
    title: "Request",
    subtitle: "Send network requests.",
    keywords: ["fetch", "send request", "form data", "cancel request"],
    destination: <RequestExample />
  },
  {
    title: "Script",
    subtitle: "Access information about the script, and provides convenient methods to control the scripts.",
    destination: <ScriptExample />
  },
  {
    title: "ShareSheet",
    subtitle: "You can share data from your script using this interface.",
    destination: <ShareSheetExample />
  },
  {
    title: "SharedAudioSession",
    subtitle: "The shared audio session instance. An audio session acts as an intermediary between your app and the operating system — and, in turn, the underlying audio hardware.",
    destination: <SharedAudioSessionDocumentation />
  },
  {
    title: "Speech",
    subtitle: "Text To Speech.",
    destination: <SpeechDocumentation />
  },
  {
    title: "SpeechRecognition",
    subtitle: "The interface for managing the speech recognizer process.",
    destination: <SpeechRecognitionDocumentation />
  },
  {
    title: "AudioRecorder",
    subtitle: "The interface allows you to record audio data to a file. It provides functionalities to start, stop, pause, and manage audio recordings, with configurable settings for audio quality, sample rate, format, and more.",
    destination: <AudioRecorderDocumentation />
  },
  {
    title: "Audio Player",
    subtitle: "The interface allows for playback of both local and network audio sources, and offers controls such as play, pause, stop, volume, and more. Below is a sample usage along with detailed explanations of each part of the code.",
    destination: <AudioPlayerDocumentation />
  },
  {
    title: "VideoPlayer",
    subtitle: "VideoPlayer view lets you playback movies from any URL, local or remote.",
    destination: <VideoPlayerExample />
  }
]

export function getDocTotalCount(list = routes): number {
   return list.reduce((total, c) => {
    let childrenTotal = c.children != null ? getDocTotalCount(c.children) : 0
    return total + 1 + childrenTotal
   }, 0)
}

export function findRouteByTitle(title: string, list = routes): RouteItem | undefined {
  for (let i = 0, length = list.length; i < length; i++) {
    const route = list[i]
    if (route.title === title) {
      return route
    }

    if (route.children != null) {
      const result = findRouteByTitle(title, route.children)
      if (result != null) {
        return result
      }
    }
  }
}