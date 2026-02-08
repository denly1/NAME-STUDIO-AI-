# Cursor AI-Style Agent UI Components

Полный набор UI компонентов для AI-агента уровня Cursor IDE.

## 📦 Компоненты

### 1. ThinkingModeBlock
Отображает процесс мышления агента с постепенным появлением шагов.

```tsx
import { ThinkingModeBlock } from './agent';

<ThinkingModeBlock
  steps={[
    { text: 'Reading files…', icon: 'file' },
    { text: 'Planning changes…', icon: 'lightbulb', detail: 'Analyzing dependencies' },
    { text: 'Understanding project…', icon: 'brain' }
  ]}
  currentFile="src/auth.ts"
  filesAnalyzed={5}
  totalFiles={20}
/>
```

### 2. PlanningModeBlock
План задач с чекбоксами и раскрывающимися подзадачами.

```tsx
import { PlanningModeBlock } from './agent';

<PlanningModeBlock
  plan={[
    {
      id: '1',
      title: 'Analyze authentication flow',
      status: 'completed',
      estimatedFiles: 3
    },
    {
      id: '2',
      title: 'Modify login handler',
      status: 'in_progress',
      estimatedFiles: 2,
      substeps: [
        { id: '2.1', title: 'Add validation', status: 'pending' },
        { id: '2.2', title: 'Update tests', status: 'pending' }
      ]
    }
  ]}
  onStepClick={(stepId) => console.log('Clicked:', stepId)}
/>
```

### 3. ExecutionModeBlock
Поток действий агента в реальном времени.

```tsx
import { ExecutionModeBlock } from './agent';

<ExecutionModeBlock
  actions={[
    { id: '1', type: 'open', description: 'Opening file:', file: 'auth.js', status: 'completed' },
    { id: '2', type: 'analyze', description: 'Analyzing function', file: 'login()', status: 'running' },
    { id: '3', type: 'edit', description: 'Creating patch', status: 'pending' }
  ]}
/>
```

### 4. FilePreviewBlock
Предпросмотр изменений файлов со статистикой.

```tsx
import { FilePreviewBlock } from './agent';

<FilePreviewBlock
  changes={[
    { path: 'src/auth.ts', action: 'edit', linesAdded: 45, linesDeleted: 12 },
    { path: 'src/utils/validation.ts', action: 'create', linesAdded: 30 },
    { path: 'src/old-auth.ts', action: 'delete' }
  ]}
  totalAdded={120}
  totalDeleted={40}
/>
```

### 5. ContextBlock
Список файлов, на которые ссылается агент.

```tsx
import { ContextBlock } from './agent';

<ContextBlock
  referencedFiles={['auth.ts', 'userService.ts', 'database.ts']}
  onFileClick={(file) => console.log('Open:', file)}
/>
```

### 6. ProgressBar
Прогресс-бар для длительных операций.

```tsx
import { ProgressBar } from './agent';

<ProgressBar
  current={12}
  total={48}
  label="Analyzing files"
/>
```

### 7. SummaryBlock
Итоговая статистика выполненной задачи.

```tsx
import { SummaryBlock } from './agent';

<SummaryBlock
  filesChanged={6}
  linesAdded={140}
  linesRemoved={32}
  testsPassed={15}
  testsFailed={0}
/>
```

### 8. ControlPanel
Панель управления агентом (пауза, стоп, пропуск).

```tsx
import { ControlPanel } from './agent';

<ControlPanel
  onPause={() => console.log('Paused')}
  onStop={() => console.log('Stopped')}
  onSkip={() => console.log('Skipped')}
  onEditPlan={() => console.log('Edit plan')}
  onLockFile={() => console.log('Lock file')}
  isPaused={false}
  isRunning={true}
/>
```

### 9. IntelligenceIndicators
Индикаторы текущей активности агента.

```tsx
import { IntelligenceIndicators } from './agent';

<IntelligenceIndicators type="analyzing" />
<IntelligenceIndicators type="writing" text="Generating code..." />
<IntelligenceIndicators type="refactoring" />
```

### 10. BatchChangesBlock
Группировка большого количества изменений.

```tsx
import { BatchChangesBlock } from './agent';

<BatchChangesBlock
  totalFiles={27}
  groups={[
    { name: 'Backend', files: ['api.ts', 'db.ts'], color: '#0066ff' },
    { name: 'UI', files: ['App.tsx', 'Button.tsx'], color: '#4ade80' },
    { name: 'Config', files: ['tsconfig.json'], color: '#fbbf24' }
  ]}
/>
```

### 11. PermissionBlock
Запрос разрешения на изменения.

```tsx
import { PermissionBlock } from './agent';

<PermissionBlock
  message="Allow AI to modify files?"
  onAllow={() => console.log('Allowed')}
  onDeny={() => console.log('Denied')}
/>
```

### 12. ErrorBlock
Отображение ошибок с возможностью автофикса.

```tsx
import { ErrorBlock } from './agent';

<ErrorBlock
  errorType="build"
  message="Cannot find module 'express'"
  file="src/server.ts"
  line={5}
  onAutoFix={() => console.log('Auto-fixing...')}
  onShowProblem={() => console.log('Show problem')}
  onOpenFile={() => console.log('Open file')}
/>
```

## 🎨 Дизайн

Все компоненты следуют дизайн-системе Cursor AI:
- **Темная тема**: `#1e1e1e`, `#252525`, `#2d2d2d`
- **Акцентные цвета**: 
  - Синий `#0066ff` - основной
  - Зеленый `#4ade80` - успех
  - Красный `#f87171` - ошибка
  - Желтый `#fbbf24` - предупреждение
- **Типографика**: 12-13px для текста, monospace для кода
- **Анимации**: fade-in, плавные переходы

## 🔄 Интеграция

Все компоненты готовы к использованию в `AgentMessageView`:

```tsx
import {
  ThinkingModeBlock,
  PlanningModeBlock,
  ExecutionModeBlock,
  FilePreviewBlock,
  SummaryBlock
} from './agent';

function AgentMessageView({ message }: { message: CursorAgentMessage }) {
  return (
    <div>
      {message.thinkingSteps && (
        <ThinkingModeBlock
          steps={message.thinkingSteps}
          currentFile={message.currentFile}
          filesAnalyzed={message.filesAnalyzed}
          totalFiles={message.totalFiles}
        />
      )}
      
      {message.planSteps && (
        <PlanningModeBlock plan={message.planSteps} />
      )}
      
      {message.executionActions && (
        <ExecutionModeBlock actions={message.executionActions} />
      )}
      
      {message.fileChanges && message.diff && (
        <FilePreviewBlock
          changes={message.fileChanges}
          totalAdded={message.diff.totalAdded}
          totalDeleted={message.diff.totalDeleted}
        />
      )}
      
      {message.summary && (
        <SummaryBlock
          filesChanged={message.summary.filesChanged}
          linesAdded={message.summary.linesAdded}
          linesRemoved={message.summary.linesDeleted}
        />
      )}
    </div>
  );
}
```

## 📝 Типы

Все типы определены в `src/types/agent.ts`:
- `ThinkingStep`
- `PlanStep`
- `ExecutionAction`
- `FileChangePreview`
- `FileGroup`
- `IntelligenceIndicatorType`
- `ErrorType`
- `CursorAgentMessage`

## ✨ Особенности

1. **Постепенное появление** - ThinkingModeBlock и ExecutionModeBlock показывают шаги постепенно
2. **Раскрывающиеся элементы** - PlanningModeBlock и BatchChangesBlock поддерживают expand/collapse
3. **Интерактивность** - Все кнопки с hover эффектами
4. **Адаптивность** - Компоненты адаптируются под размер контейнера
5. **Анимации** - Плавные переходы и fade-in эффекты

## 🚀 Готово к использованию!

Все компоненты полностью реализованы согласно ТЗ Cursor AI и готовы к интеграции в ваш проект.
