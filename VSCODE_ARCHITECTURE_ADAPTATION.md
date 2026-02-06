# 🏗️ Адаптация архитектуры VS Code для NAME STUDIO AI

## 📋 Обзор

Этот документ описывает план адаптации профессиональной архитектуры VS Code (Code-OSS) для NAME STUDIO AI с фокусом на создание продвинутой IDE с AI-агентом уровня Cursor/Windsurf.

---

## 🎯 Ключевые области для адаптации

### 1. **Workbench Core** - Основной UI каркас
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench

**Что взять:**
- ✅ Dependency Injection система (Services)
- ✅ Event-driven архитектура
- ✅ Lifecycle management
- ✅ State persistence

**Текущее состояние в NAME STUDIO AI:**
- ✅ Базовый layout реализован (`ResizableLayout.tsx`)
- ⚠️ Нет DI контейнера
- ⚠️ Нет централизованного event bus
- ⚠️ Простое state management (Zustand)

**План улучшения:**
```typescript
// Создать сервисную архитектуру
src/services/
  ├── core/
  │   ├── serviceContainer.ts      // DI Container
  │   ├── eventBus.ts               // Event Bus
  │   └── lifecycle.ts              // Lifecycle Manager
  ├── workbench/
  │   ├── layoutService.ts          // Layout управление
  │   ├── viewService.ts            // View registry
  │   └── commandService.ts         // Command registry
```

---

### 2. **Layout Engine** - Управление панелями
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench/browser/layout

**Ключевые концепции:**
- Grid-based layout (SerializableGrid)
- Part system (ActivityBar, Sidebar, Panel, Editor, StatusBar)
- Resizing & Docking
- State serialization

**Текущее состояние:**
- ✅ React Resizable Panels используется
- ✅ Базовый layout store
- ⚠️ Нет grid system
- ⚠️ Нет сериализации layout state

**План улучшения:**
```typescript
// Улучшенный Layout Manager
interface ILayoutPart {
  id: string;
  type: 'activitybar' | 'sidebar' | 'editor' | 'panel' | 'statusbar';
  visible: boolean;
  size: number;
  minimumSize: number;
  maximumSize: number;
}

class LayoutService {
  private parts: Map<string, ILayoutPart>;
  private grid: SerializableGrid;
  
  // Методы для управления layout
  setPart(id: string, options: Partial<ILayoutPart>): void;
  togglePart(id: string): void;
  resizePart(id: string, size: number): void;
  serializeLayout(): ISerializedLayout;
  restoreLayout(state: ISerializedLayout): void;
}
```

---

### 3. **File Explorer** - Проводник файлов
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench/contrib/files

**Ключевые файлы для изучения:**
- `explorerView.ts` - UI компонент
- `explorerService.ts` - Бизнес логика
- `fileActions.ts` - Действия с файлами
- `fileCommands.ts` - Команды

**Текущее состояние:**
- ✅ Базовый Explorer реализован
- ✅ Контекстное меню добавлено
- ⚠️ Нет drag & drop
- ⚠️ Нет file watchers
- ⚠️ Нет undo/redo для файловых операций

**План улучшения:**
```typescript
// Профессиональный Explorer Service
class ExplorerService {
  // File watching
  watchFile(path: string, callback: (event: FileChangeEvent) => void): IDisposable;
  
  // Drag & Drop
  onDragStart(file: FileNode): void;
  onDrop(target: FileNode, files: FileNode[]): Promise<void>;
  
  // Undo/Redo
  private undoStack: FileOperation[];
  undo(): Promise<void>;
  redo(): Promise<void>;
  
  // Bulk operations
  bulkDelete(files: string[]): Promise<void>;
  bulkMove(files: string[], target: string): Promise<void>;
}
```

---

### 4. **Terminal** - Интегрированный терминал
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench/contrib/terminal

**Ключевые концепции:**
- Terminal instances & groups
- Split terminal
- Terminal tabs
- Shell integration
- Terminal profiles

**Текущее состояние:**
- ✅ Базовый терминал работает (xterm.js)
- ✅ Автообновление пути при открытии проекта
- ⚠️ Нет split terminal
- ⚠️ Нет terminal profiles
- ⚠️ Нет shell integration

**План улучшения:**
```typescript
// Продвинутый Terminal Service
interface ITerminalProfile {
  name: string;
  shell: string;
  args: string[];
  env: Record<string, string>;
  icon: string;
}

class TerminalService {
  // Terminal management
  createTerminal(profile?: ITerminalProfile): ITerminalInstance;
  splitTerminal(terminalId: string): ITerminalInstance;
  
  // Groups
  createGroup(): ITerminalGroup;
  moveToGroup(terminalId: string, groupId: string): void;
  
  // Profiles
  getProfiles(): ITerminalProfile[];
  setDefaultProfile(profileName: string): void;
  
  // Shell integration
  executeCommand(terminalId: string, command: string): Promise<string>;
  getWorkingDirectory(terminalId: string): Promise<string>;
}
```

---

### 5. **Extensions System** - Система расширений
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench/contrib/extensions

**Ключевые концепции:**
- Extension host (separate process)
- Extension API
- Marketplace integration
- Extension lifecycle

**Текущее состояние:**
- ✅ UI панель Extensions создана
- ❌ Нет extension host
- ❌ Нет API для расширений
- ❌ Нет marketplace integration

**План улучшения:**
```typescript
// Extension System Architecture
interface IExtension {
  id: string;
  name: string;
  version: string;
  main: string;
  contributes: {
    commands?: ICommand[];
    views?: IView[];
    languages?: ILanguage[];
  };
}

class ExtensionService {
  // Lifecycle
  loadExtension(extensionPath: string): Promise<IExtension>;
  activateExtension(extensionId: string): Promise<void>;
  deactivateExtension(extensionId: string): Promise<void>;
  
  // API
  getExtensionAPI(): IExtensionAPI;
  
  // Marketplace
  searchExtensions(query: string): Promise<IExtension[]>;
  installExtension(extensionId: string): Promise<void>;
}
```

---

### 6. **Activity Bar** - Панель активности
**Источник:** https://github.com/microsoft/vscode/tree/main/src/vs/workbench/browser/parts/activitybar

**Текущее состояние:**
- ✅ Activity Bar реализован
- ✅ Все основные views добавлены
- ⚠️ Нет badge notifications
- ⚠️ Нет drag & drop для reordering

**План улучшения:**
```typescript
// Enhanced Activity Bar
interface IActivityBarItem {
  id: string;
  icon: IconDefinition;
  label: string;
  badge?: number;
  order: number;
  keybinding?: string;
}

class ActivityBarService {
  registerActivity(item: IActivityBarItem): IDisposable;
  setBadge(activityId: string, badge: number): void;
  reorderActivities(order: string[]): void;
}
```

---

### 7. **Commands & Actions** - Система команд
**Источник:** 
- https://github.com/microsoft/vscode/tree/main/src/vs/platform/commands
- https://github.com/microsoft/vscode/tree/main/src/vs/platform/actions

**Ключевые концепции:**
- Command registry
- Keybinding system
- Menu contributions
- When clauses (context keys)

**Текущее состояние:**
- ⚠️ Простая обработка команд в MenuBar
- ❌ Нет command palette
- ❌ Нет keybinding registry
- ❌ Нет context keys

**План улучшения:**
```typescript
// Command System
interface ICommand {
  id: string;
  title: string;
  category?: string;
  keybinding?: IKeybinding;
  when?: string; // Context expression
  handler: (...args: any[]) => any;
}

class CommandService {
  registerCommand(command: ICommand): IDisposable;
  executeCommand(commandId: string, ...args: any[]): Promise<any>;
  getCommands(): ICommand[];
}

class KeybindingService {
  registerKeybinding(keybinding: IKeybinding): IDisposable;
  resolveKeybinding(key: string): ICommand | undefined;
}

class MenuService {
  registerMenuItem(menuId: MenuId, item: IMenuItem): IDisposable;
  getMenuItems(menuId: MenuId): IMenuItem[];
}
```

---

## 🚀 Приоритетный план реализации

### Phase 1: Core Architecture (Неделя 1-2)
1. ✅ Создать DI Container
2. ✅ Реализовать Event Bus
3. ✅ Улучшить Layout Service
4. ✅ Добавить Command Registry
5. ✅ Реализовать Keybinding System

### Phase 2: Enhanced UI (Неделя 3-4)
1. ✅ Улучшить Terminal (split, profiles)
2. ✅ Добавить drag & drop в Explorer
3. ✅ Реализовать Command Palette
4. ✅ Добавить file watchers
5. ✅ Улучшить Activity Bar (badges)

### Phase 3: Extensions System (Неделя 5-6)
1. ✅ Создать Extension Host
2. ✅ Реализовать Extension API
3. ✅ Добавить Marketplace integration
4. ✅ Создать sample extensions

### Phase 4: AI Integration (Неделя 7-8)
1. ✅ Интегрировать AI Agent в архитектуру
2. ✅ Создать AI Commands
3. ✅ Реализовать AI Context Service
4. ✅ Добавить AI-powered features

---

## 📁 Новая структура проекта

```
neurodesk-ide/
├── src/
│   ├── base/                      # Базовые утилиты (как в VS Code)
│   │   ├── common/
│   │   │   ├── event.ts
│   │   │   ├── lifecycle.ts
│   │   │   └── async.ts
│   │   └── browser/
│   │       ├── dom.ts
│   │       └── ui/
│   ├── platform/                  # Platform services
│   │   ├── commands/
│   │   ├── keybinding/
│   │   ├── storage/
│   │   ├── files/
│   │   └── notification/
│   ├── workbench/                 # Workbench (main UI)
│   │   ├── browser/
│   │   │   ├── layout.ts
│   │   │   ├── workbench.tsx
│   │   │   └── parts/
│   │   │       ├── activitybar/
│   │   │       ├── sidebar/
│   │   │       ├── editor/
│   │   │       ├── panel/
│   │   │       └── statusbar/
│   │   ├── contrib/               # Contributions (features)
│   │   │   ├── files/
│   │   │   ├── terminal/
│   │   │   ├── extensions/
│   │   │   ├── git/
│   │   │   ├── ai/               # AI Agent integration
│   │   │   └── codemaps/
│   │   └── services/
│   │       ├── layout/
│   │       ├── editor/
│   │       ├── lifecycle/
│   │       └── ai/
│   ├── extensions/                # Built-in extensions
│   │   ├── ai-assistant/
│   │   ├── git/
│   │   └── markdown/
│   └── electron/                  # Electron main process
│       ├── main.ts
│       └── preload.ts
```

---

## 🎨 Ключевые паттерны из VS Code

### 1. **Dependency Injection**
```typescript
// Service decorator
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  return serviceId as any;
}

// Usage
const ILayoutService = createDecorator<ILayoutService>('layoutService');

class MyComponent {
  constructor(
    @ILayoutService private layoutService: ILayoutService
  ) {}
}
```

### 2. **Event System**
```typescript
// Event emitter
class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];
  
  event = (listener: (e: T) => void): IDisposable => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) this.listeners.splice(index, 1);
      }
    };
  };
  
  fire(event: T): void {
    this.listeners.forEach(l => l(event));
  }
}
```

### 3. **Disposable Pattern**
```typescript
interface IDisposable {
  dispose(): void;
}

class DisposableStore implements IDisposable {
  private items = new Set<IDisposable>();
  
  add<T extends IDisposable>(item: T): T {
    this.items.add(item);
    return item;
  }
  
  dispose(): void {
    this.items.forEach(item => item.dispose());
    this.items.clear();
  }
}
```

---

## 🔥 Специфичные улучшения для AI IDE

### 1. **AI Context Service**
```typescript
interface IAIContext {
  currentFile?: string;
  selectedText?: string;
  openFiles: string[];
  recentActions: string[];
  projectStructure: FileNode[];
}

class AIContextService {
  getContext(): IAIContext;
  updateContext(partial: Partial<IAIContext>): void;
  onContextChange: Event<IAIContext>;
}
```

### 2. **AI Command Integration**
```typescript
// Регистрация AI команд
commandService.registerCommand({
  id: 'ai.generateCode',
  title: 'AI: Generate Code',
  category: 'AI',
  keybinding: { key: 'Ctrl+Shift+G' },
  handler: async () => {
    const context = aiContextService.getContext();
    const result = await aiService.generateCode(context);
    editorService.insertText(result);
  }
});
```

### 3. **AI Panel Integration**
```typescript
// AI Panel как contribution
class AIPanelContribution implements IWorkbenchContribution {
  constructor(
    @ILayoutService private layoutService: ILayoutService,
    @IAIService private aiService: IAIService
  ) {
    this.registerAIPanel();
  }
  
  private registerAIPanel(): void {
    this.layoutService.registerPart('ai-panel', {
      component: AIPanel,
      location: 'sidebar',
      icon: 'sparkles'
    });
  }
}
```

---

## 📊 Метрики успеха

После адаптации архитектуры VS Code, NAME STUDIO AI должна иметь:

- ✅ Модульная архитектура с DI
- ✅ Event-driven коммуникация
- ✅ Расширяемая система команд
- ✅ Профессиональный layout engine
- ✅ Система расширений
- ✅ AI интеграция на уровне архитектуры
- ✅ Performance как у VS Code
- ✅ Масштабируемость для будущих features

---

## 🔗 Полезные ссылки

- [VS Code Architecture](https://github.com/microsoft/vscode/wiki/Source-Code-Organization)
- [Extension API](https://code.visualstudio.com/api)
- [Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code Blog](https://code.visualstudio.com/blogs)

---

## 🎯 Следующие шаги

1. **Изучить** ключевые файлы VS Code
2. **Создать** базовую DI систему
3. **Рефакторить** текущий код под новую архитектуру
4. **Тестировать** каждый модуль отдельно
5. **Интегрировать** AI агента в новую архитектуру

**Готов начать реализацию!** 🚀
