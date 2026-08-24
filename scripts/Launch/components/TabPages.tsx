import {
  Button,
  ContentUnavailableView,
  Device,
  EditButton,
  ForEach,
  GlassEffectContainer,
  HStack,
  Image,
  LazyVGrid,
  List,
  NavigationLink,
  Picker,
  ScrollView,
  Section,
  Spacer,
  Stepper,
  Text,
  Widget
} from 'scripting'
import {
  AppItem,
  Config,
  Folder,
  FolderStyle
} from '../constants'
import { AppEditor } from './AppEditor'
import {
  FolderDetail,
  FolderGridCell,
  FolderNameEditor,
  FOLDER_PREVIEW_RADIUS
} from './FolderViews'
import { AppRow, TexturedTabPage, filterApps } from './SharedViews'

const FOLDER_GRID_COLUMNS = [
  {
    size: { type: 'adaptive' as const, min: 150, max: 'infinity' as const },
    spacing: 16
  }
]

export function AppsPage({
  apps,
  visibleApps,
  folders,
  query,
  onQueryChanged,
  onUpdateApp,
  onDismiss
}: {
  apps: AppItem[]
  visibleApps: Observable<AppItem[]>
  folders: Folder[]
  query: string
  onQueryChanged: (query: string) => void
  onUpdateApp: (item: AppItem) => void
  onDismiss: () => void
}) {
  return (
    <TexturedTabPage>
      <List
        navigationTitle="Apps"
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        scrollContentBackground="hidden"
        searchable={{
          value: query,
          onChanged: onQueryChanged,
          prompt: 'Search Apps'
        }}
        overlay={
          query.trim() && filterApps(apps, query).length === 0 ? (
            <ContentUnavailableView
              title="No Results"
              systemImage="magnifyingglass"
            />
          ) : undefined
        }
        toolbar={{
          topBarLeading: [
            <Button title="Close" systemImage="xmark" action={onDismiss} />
          ],
          confirmationAction: [
            <EditButton />,
            <NavigationLink
              destination={
                <AppEditor folders={folders} onSave={onUpdateApp} />
              }
            >
              <Image systemName="plus" />
            </NavigationLink>
          ]
        }}
      >
        <Section>
          <ForEach
            data={visibleApps}
            editActions={query.trim() ? 'delete' : 'all'}
            builder={item => (
              <NavigationLink
                key={item.id}
                destination={
                  <AppEditor
                    item={item}
                    folders={folders}
                    onSave={onUpdateApp}
                  />
                }
              >
                <AppRow item={item} folders={folders} />
              </NavigationLink>
            )}
          />
        </Section>
      </List>
    </TexturedTabPage>
  )
}

export function FoldersPage({
  apps,
  folders,
  globalConfig,
  onAddFolder,
  onDeleteFolder,
  onUpdateApp,
  onSyncFolderApps,
  onRenameFolder,
  onUpdateFolderStyle
}: {
  apps: Observable<AppItem[]>
  folders: Folder[]
  globalConfig: Config
  onAddFolder: (name: string, icon?: string, color?: string) => void
  onDeleteFolder: (id: string) => void
  onUpdateApp: (item: AppItem) => void
  onSyncFolderApps: (folderId: string, items: AppItem[]) => void
  onRenameFolder: (id: string, name: string, icon?: string, color?: string) => void
  onUpdateFolderStyle: (id: string, style: FolderStyle | undefined) => void
}) {
  const supportsLiquidGlass = parseFloat(Device.systemVersion) >= 26
  const folderGrid = (
    <LazyVGrid
      columns={FOLDER_GRID_COLUMNS}
      alignment="leading"
      spacing={20}
      padding={{ horizontal: 16, vertical: 16 }}
      frame={{ maxWidth: 'infinity', alignment: 'topLeading' }}
    >
      {folders.map(folder => {
        const folderApps = apps.value.filter(app =>
          app.folderIds?.includes(folder.id)
        )
        return (
          <NavigationLink
            key={folder.id}
            destination={
              <FolderDetail
                folder={folder}
                apps={apps}
                folders={folders}
                onUpdateApp={onUpdateApp}
                onSyncFolderApps={onSyncFolderApps}
                onRenameFolder={onRenameFolder}
                onUpdateFolderStyle={onUpdateFolderStyle}
              />
            }
            buttonStyle="plain"
            frame={{ maxWidth: 'infinity', alignment: 'top' }}
            contentShape={{
              type: 'rect',
              cornerRadius: FOLDER_PREVIEW_RADIUS
            }}
            accessibilityLabel={`${folder.name}, ${folderApps.length} apps`}
            contextMenu={{
              menuItems: (
                <Button
                  title="Delete Folder"
                  systemImage="trash"
                  role="destructive"
                  action={() => onDeleteFolder(folder.id)}
                />
              )
            }}
          >
            <FolderGridCell
              folder={folder}
              apps={folderApps}
              globalConfig={globalConfig}
              supportsLiquidGlass={supportsLiquidGlass}
            />
          </NavigationLink>
        )
      })}
    </LazyVGrid>
  )

  return (
    <TexturedTabPage>
      <ScrollView
        navigationTitle="Folders"
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        scrollContentBackground="hidden"
        toolbar={{
          confirmationAction: [
            <NavigationLink
              key="add"
              destination={<FolderNameEditor onSave={onAddFolder} />}
            >
              <Image systemName="folder.badge.plus" />
            </NavigationLink>
          ]
        }}
        overlay={
          folders.length === 0 ? (
            <ContentUnavailableView
              title="No Folders"
              systemImage="folder"
              description="Create a folder to preview its apps here."
            />
          ) : undefined
        }
      >
        {supportsLiquidGlass ? (
          <GlassEffectContainer
            spacing={8}
            frame={{ maxWidth: 'infinity', alignment: 'topLeading' }}
          >
            {folderGrid}
          </GlassEffectContainer>
        ) : (
          folderGrid
        )}
      </ScrollView>
    </TexturedTabPage>
  )
}

export function SettingsPage({
  shape,
  iconSize,
  spacing,
  accentedMode,
  onSaveConfig
}: {
  shape: Config['shape']
  iconSize: number
  spacing: number
  accentedMode: Config['widgetAccentedRenderingMode']
  onSaveConfig: (
    shape: Config['shape'],
    iconSize: number,
    spacing: number,
    mode: Config['widgetAccentedRenderingMode']
  ) => void
}) {
  return (
    <TexturedTabPage>
      <List
        navigationTitle="Settings"
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        scrollContentBackground="hidden"
      >
        <Section>
          <Picker
            title="Icon Shape"
            value={shape}
            onChanged={(value: string) =>
              onSaveConfig(
                value as Config['shape'],
                iconSize,
                spacing,
                accentedMode
              )
            }
          >
            <Text tag="rounded">Rounded Rectangle</Text>
            <Text tag="circle">Circle</Text>
          </Picker>
          <Stepper
            onIncrement={() => {
              if (iconSize < 100) {
                onSaveConfig(shape, iconSize + 1, spacing, accentedMode)
              }
            }}
            onDecrement={() => {
              if (iconSize > 20) {
                onSaveConfig(shape, iconSize - 1, spacing, accentedMode)
              }
            }}
          >
            <HStack>
              <Text>Icon Size</Text>
              <Spacer />
              <Text opacity={0.5}>{iconSize.toString()}</Text>
            </HStack>
          </Stepper>
          <Stepper
            onIncrement={() => {
              if (spacing < 50) {
                onSaveConfig(shape, iconSize, spacing + 1, accentedMode)
              }
            }}
            onDecrement={() => {
              if (spacing > 0) {
                onSaveConfig(shape, iconSize, spacing - 1, accentedMode)
              }
            }}
          >
            <HStack>
              <Text>Spacing</Text>
              <Spacer />
              <Text opacity={0.5}>{spacing.toString()}</Text>
            </HStack>
          </Stepper>
          <Picker
            title="Icon Rendering Mode"
            value={accentedMode}
            onChanged={(value: string) =>
              onSaveConfig(
                shape,
                iconSize,
                spacing,
                value as Config['widgetAccentedRenderingMode']
              )
            }
          >
            <Text tag="fullColor">Full Color</Text>
            <Text tag="accented">Accented</Text>
            <Text tag="desaturated">Desaturated</Text>
            <Text tag="accentedDesaturated">Accented & Desaturated</Text>
          </Picker>
        </Section>
        <Section>
          <Button
            title="Preview Widget"
            action={async () => {
              await Widget.preview({ family: 'systemMedium' })
            }}
          />
        </Section>
      </List>
    </TexturedTabPage>
  )
}
