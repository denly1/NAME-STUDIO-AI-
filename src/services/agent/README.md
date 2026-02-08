# Cursor AI-Level Agent Architecture

Полная event-driven архитектура агента с State Machine, Streaming Thinking, Diff Engine и Virtual File System.

## 🏗️ Архитектура

```
User Prompt
   ↓
Agent Core (главный контроллер)
   ↓
State Machine (управление состояниями)
   ↓
Thinking Engine (streaming мысли)
   ↓
Task Tree Engine (планирование)
   ↓
Virtual File System (чтение файлов)
   ↓
Diff Engine (генерация патчей)
   ↓
Event Bus (события для UI)
   ↓
UI Renderer (только отображение)
```

## 📦 Компоненты

### 1. Event Bus
Центральная система событий. **ВСЁ** идёт через события, НЕ через прямые setState.

**События:**
- `AGENT_STARTED` - агент начал работу
- `THINKING_UPDATE` - новый шаг мышления
- `PLAN_CREATED` - создан план задач
- `FILE_READ` - файл прочитан
- `DIFF_CREATED` - diff готов
- `PATCH_APPLIED` - патч применён
- `ERROR` - ошибка

**Использование:**
```typescript
import { eventBus, AgentEventType } from './agent';

// Подписка на событие
const unsubscribe = eventBus.on(AgentEventType.THINKING_UPDATE, (event) => {
  console.log('Thinking:', event.payload.step.text);
});

// Отписка
unsubscribe();
```

### 2. State Machine
Строгие переходы между состояниями. Никаких свободных изменений.

**Состояния:**
- `IDLE` → `ANALYZING`
- `ANALYZING` → `PLANNING`
- `PLANNING` → `EXPLORING`
- `EXPLORING` → `EDITING`
- `EDITING` → `GENERATING_DIFF`
- `GENERATING_DIFF` → `WAITING_APPROVAL`
- `WAITING_APPROVAL` → `APPLYING_PATCH`
- `APPLYING_PATCH` → `VERIFYING`
- `VERIFYING` → `COMPLETED`

**Использование:**
```typescript
import { StateMachine, AgentState } from './agent';

const stateMachine = new StateMachine();

// Переход
stateMachine.transitionTo(AgentState.ANALYZING);

// Проверка
if (stateMachine.is(AgentState.IDLE)) {
  // можно запускать
}

// Подписка на изменения
stateMachine.onStateChange((newState) => {
  console.log('State changed to:', newState);
});
```

### 3. Thinking Engine
Постепенная отправка thinking steps через события.

**Использование:**
```typescript
import { ThinkingEngine } from './agent';

const thinking = new ThinkingEngine(sessionId);

thinking.start();
thinking.analyzingTask();
thinking.determiningFiles();
thinking.readingFile('config.ts');
thinking.planningChanges();
thinking.end();
```

**UI подписывается:**
```typescript
eventBus.on(AgentEventType.THINKING_UPDATE, (event) => {
  const { step } = event.payload;
  // Показать: "Analyzing task..."
  addThinkingStep(step.text, step.icon);
});
```

### 4. Diff Engine
Генерация Virtual Patch. НЕ применяет изменения, только создаёт модель.

**Использование:**
```typescript
import { DiffEngine } from './agent';

const diffEngine = new DiffEngine(sessionId);

const patch = diffEngine.generateDiff([
  {
    path: 'src/config.ts',
    action: 'edit',
    oldContent: 'const x = 1;',
    newContent: 'const x = 2;'
  }
]);

// patch содержит:
// - files: FileDiff[]
// - totalAdded: number
// - totalRemoved: number
// - hunks с colored lines
```

**UI получает:**
```typescript
eventBus.on(AgentEventType.DIFF_READY, (event) => {
  const patch = event.payload;
  // Показать diff preview с зелёными/красными строками
  showDiffPreview(patch);
});
```

### 5. Task Tree Engine
Управление деревом задач с статусами.

**Использование:**
```typescript
import { TaskTreeEngine } from './agent';

const taskTree = new TaskTreeEngine(sessionId);

// Создать план
const tree = taskTree.createPlan(userPrompt, ['file1.ts', 'file2.ts']);

// Запустить задачу
taskTree.startTask(taskId);

// Завершить задачу
taskTree.completeTask(taskId);

// Прогресс
const progress = taskTree.getProgress();
// { completed: 2, total: 5, percentage: 40 }
```

**UI получает:**
```typescript
eventBus.on(AgentEventType.TASK_COMPLETED, (event) => {
  const { task, tree } = event.payload;
  // Обновить UI: "2 / 5 tasks done"
  updateProgress(tree.completedTasks, tree.totalTasks);
});
```

### 6. Virtual File System
Абстракция над реальной ФС. НЕ применяет изменения сразу.

**Использование:**
```typescript
import { VirtualFileSystem } from './agent';

const vfs = new VirtualFileSystem(sessionId);

// Чтение (из реальной ФС)
const content = await vfs.readFile('/path/to/file.ts');

// Запись в виртуальную ФС (НЕ в реальную)
vfs.writeVirtualFile('/path/to/file.ts', newContent);

// Применение патча (в реальную ФС)
await vfs.applyPatch('/path/to/file.ts', newContent);

// Сканирование проекта
const files = await vfs.scanDirectory('/project', 50);
```

### 7. Agent Core
Главный контроллер. Управляет всем pipeline.

**Использование:**
```typescript
import { agentCore } from './agent';

// Запуск агента
await agentCore.execute({
  userPrompt: 'Fix the bug in auth.ts',
  workspaceRoot: '/path/to/project',
  context: {
    openFiles: ['auth.ts', 'config.ts'],
    currentFile: 'auth.ts'
  }
});

// Применить патч (после одобрения пользователем)
await agentCore.applyPatch();

// Отклонить патч
agentCore.rejectPatch();
```

## 🎯 Pipeline выполнения

```typescript
// 1. User sends message
agentCore.execute(request);

// 2. ANALYZING state
// - Thinking stream starts
// - Events: THINKING_UPDATE

// 3. PLANNING state
// - Task tree created
// - Events: PLAN_CREATED

// 4. EXPLORING state
// - Files scanned
// - Files read
// - Events: FILE_SCANNED, FILE_READ, PROJECT_EXPLORED

// 5. EDITING state
// - AI generates changes
// - Virtual files created
// - Events: EDITING_START, VIRTUAL_PATCH_CREATED

// 6. GENERATING_DIFF state
// - Diff engine creates patch
// - Events: DIFF_GENERATING, DIFF_CREATED, DIFF_READY

// 7. WAITING_APPROVAL state
// - UI shows diff preview
// - User clicks Apply or Reject

// 8. APPLYING_PATCH state (if approved)
// - Virtual FS applies changes to real FS
// - Events: PATCH_APPLYING, PATCH_APPLIED

// 9. VERIFYING state
// - Check syntax, run tests
// - Events: VERIFICATION_START, VERIFICATION_PASSED

// 10. COMPLETED state
// - Events: AGENT_COMPLETED
```

## 🎨 UI Integration

UI **НЕ** управляет логикой. Только подписывается на события.

**Пример React компонента:**
```typescript
import { eventBus, AgentEventType, agentCore } from './services/agent';

function AgentPanel() {
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [taskTree, setTaskTree] = useState(null);
  const [patch, setPatch] = useState(null);

  useEffect(() => {
    // Подписка на thinking
    const unsubThinking = eventBus.on(
      AgentEventType.THINKING_UPDATE,
      (event) => {
        setThinkingSteps(prev => [...prev, event.payload.step]);
      }
    );

    // Подписка на план
    const unsubPlan = eventBus.on(
      AgentEventType.PLAN_CREATED,
      (event) => {
        setTaskTree(event.payload);
      }
    );

    // Подписка на diff
    const unsubDiff = eventBus.on(
      AgentEventType.DIFF_READY,
      (event) => {
        setPatch(event.payload);
      }
    );

    // Cleanup
    return () => {
      unsubThinking();
      unsubPlan();
      unsubDiff();
    };
  }, []);

  const handleApply = async () => {
    await agentCore.applyPatch();
  };

  const handleReject = () => {
    agentCore.rejectPatch();
  };

  return (
    <div>
      {/* Thinking steps */}
      {thinkingSteps.map(step => (
        <div key={step.id}>{step.text}</div>
      ))}

      {/* Task tree */}
      {taskTree && (
        <div>
          {taskTree.completedTasks} / {taskTree.totalTasks} tasks done
        </div>
      )}

      {/* Diff preview */}
      {patch && (
        <div>
          <DiffPreview patch={patch} />
          <button onClick={handleApply}>Apply</button>
          <button onClick={handleReject}>Reject</button>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Execution Lock

Agent Core имеет встроенный execution lock:

```typescript
// Проверка перед запуском
if (stateMachine.isBusy()) {
  console.warn('Already executing');
  return;
}
```

Только одна сессия может выполняться одновременно.

## 📊 Event History

Event Bus хранит историю событий:

```typescript
// Получить всю историю
const history = eventBus.getHistory();

// Получить историю для конкретной сессии
const sessionHistory = eventBus.getHistory(sessionId);

// Очистить историю
eventBus.clearHistory();
```

## 🚀 Быстрый старт

```typescript
import { agentCore, eventBus, AgentEventType } from './services/agent';

// 1. Подписаться на события
eventBus.on(AgentEventType.DIFF_READY, (event) => {
  console.log('Patch ready:', event.payload);
});

// 2. Запустить агента
await agentCore.execute({
  userPrompt: 'Add error handling to login function',
  workspaceRoot: '/my/project',
  context: { openFiles: ['auth.ts'] }
});

// 3. Применить изменения (после одобрения)
await agentCore.applyPatch();
```

## ✅ Преимущества архитектуры

1. **Event-driven** - UI не управляет логикой
2. **State Machine** - строгие переходы, нет багов
3. **Streaming Thinking** - показывает процесс мышления
4. **Virtual FS** - изменения не применяются сразу
5. **Diff Engine** - красивый preview изменений
6. **Task Tree** - прогресс выполнения
7. **Execution Lock** - нет двойных запусков
8. **Event History** - можно отследить всё

## 🎯 Cursor AI Level

Эта архитектура полностью соответствует уровню Cursor AI:
- ✅ Event Bus для всех событий
- ✅ State Machine с строгими переходами
- ✅ Streaming Thinking Engine
- ✅ Virtual Patch (не применяется сразу)
- ✅ Diff Engine с inline preview
- ✅ Task Tree с прогрессом
- ✅ Virtual File System
- ✅ UI только подписан на события

**Готово к использованию!** 🚀
