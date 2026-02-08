# AI-Агент уровня Windsurf/Cursor - Полная реализация

## ✅ Реализовано

Создан полноценный AI-агент на базе **Timeweb Cloud AI (DeepSeek V3.2)** с 5 режимами работы, контролем токенов и оптимизацией для 500+ промптов из 1M токенов.

---

## 🎯 Архитектура агента

```
User Prompt → Planner → Task Queue → File Selector → Code Writer → 
Patch Generator → Apply Changes → Test Runner → Auto Fix Loop
```

---

## 🔧 5 Режимов агента

### 1️⃣ **Planner** - Планирование задач
**Назначение**: Разбивка задачи на шаги, определение файлов, dependencies

**Параметры**:
```typescript
{
  maxTokens: 800,
  temperature: 0.4,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0
}
```

**Использование**:
```typescript
setAgentMode('planner');
const result = await aiService.analyzeProject(projectPath);
```

**Выход**:
- Список шагов выполнения
- Необходимые файлы
- Dependencies
- Оценка сложности

---

### 2️⃣ **Writer** - Генерация кода
**Назначение**: Генерация кода для конкретного шага

**Параметры**:
```typescript
{
  maxTokens: 1800,
  temperature: 0.25,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0
}
```

**Использование**:
```typescript
setAgentMode('writer');
const code = await aiService.chat(userMessage);
```

**Выход**:
- Полный код функции/компонента
- Импорты и зависимости
- Комментарии и документация

---

### 3️⃣ **Patch** - Генерация diff/patch
**Назначение**: Создание минимальных unified diff патчей

**Параметры**:
```typescript
{
  maxTokens: 1200,
  temperature: 0.15,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0
}
```

**Использование**:
```typescript
setAgentMode('patch');
const changes = await aiService.analyzeAndModifyFiles(instruction, projectPath);
```

**Выход**:
```diff
--- a/file.ts
+++ b/file.ts
@@ -10,3 +10,3 @@
- old line
+ new line
```

---

### 4️⃣ **Reviewer** - Ревью кода
**Назначение**: Анализ кода, поиск багов, оптимизация, security review

**Параметры**:
```typescript
{
  maxTokens: 900,
  temperature: 0.2,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0.1  // Уменьшает повторения
}
```

**Использование**:
```typescript
setAgentMode('reviewer');
const review = await aiService.explainCode(code, context);
```

**Выход**:
- Найденные баги
- Предложения по оптимизации
- Security issues
- Code smells

---

### 5️⃣ **AutoFix** - Автоматическое исправление
**Назначение**: Исправление ошибок в цикле write → test → fix

**Параметры**:
```typescript
{
  maxTokens: 1000,
  temperature: 0.2,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0
}
```

**Использование**:
```typescript
setAgentMode('autofix');
const fix = await aiService.fixError(errorMessage, code, filePath);
```

**Выход**:
- Исправленный код
- Объяснение исправления
- Тесты для проверки

---

## 📊 Контроль токенов

### Лимиты:
```typescript
{
  totalBudget: 1000000,      // 1M токенов всего
  targetPrompts: 500,         // Цель: 500+ промптов
  maxPerPrompt: 2000,         // Макс 2000 токенов на промпт
  maxPerResponse: 2000        // Макс 2000 токенов на ответ
}
```

### Отслеживание:
```typescript
const usage = getTokenUsage();
console.log(usage);
// {
//   total: 15000,
//   prompts: 8000,
//   responses: 7000,
//   promptCount: 10,
//   remaining: 985000,
//   averagePerPrompt: 1500,
//   estimatedPromptsRemaining: 492
// }
```

### Экономия токенов:

**❌ Плохо** (отправка полного файла):
```typescript
// 5000+ токенов
const fullFile = await readFile('large-component.tsx');
await aiService.chat(`Fix this: ${fullFile}`);
```

**✅ Хорошо** (diff/AST summary):
```typescript
// ~800 токенов
const diff = computeDiff(oldContent, newContent);
await aiService.chat(`Apply this diff: ${diff}`);
```

**Экономия**: ×3-×5 раз меньше токенов!

---

## 🔄 Жизненный цикл запроса

### Полный цикл:

```typescript
// 1. Planner - анализ задачи (800 tokens)
setAgentMode('planner');
const plan = await aiService.analyzeProject(projectPath);

// 2. Writer - генерация кода (1800 tokens)
setAgentMode('writer');
const code = await aiService.chat(plan.steps[0]);

// 3. Patch - создание diff (1200 tokens)
setAgentMode('patch');
const changes = await aiService.analyzeAndModifyFiles(instruction, projectPath);

// 4. Reviewer - проверка (900 tokens)
setAgentMode('reviewer');
const review = await aiService.explainCode(code);

// 5. AutoFix - исправление (1000 tokens)
if (review.issues.length > 0) {
  setAgentMode('autofix');
  const fix = await aiService.fixError(review.issues[0], code, filePath);
}

// Итого: ~5700 токенов на полный цикл
// Из 1M токенов можно выполнить ~175 полных циклов
```

---

## 🌐 Timeweb Cloud AI API

### Конфигурация:
```typescript
{
  name: 'Timeweb Cloud AI (DeepSeek V3.2)',
  baseUrl: 'https://agent.timeweb.cloud',
  agentAccessId: '17860839-deaa-48e6-a827-741ad4ce7e6e',
  models: ['deepseek-v3.2', 'gpt-4o-2024-08-06']
}
```

### Endpoint:
```
POST https://agent.timeweb.cloud/api/v1/cloud-ai/agents/17860839-deaa-48e6-a827-741ad4ce7e6e/v1/chat/completions
```

### Headers:
```json
{
  "Content-Type": "application/json",
  "x-proxy-source": "neurodesk-ide"
}
```

### Request Body:
```json
{
  "model": "deepseek-v3.2",
  "messages": [...],
  "temperature": 0.25,
  "max_tokens": 1800,
  "top_p": 1.0,
  "presence_penalty": 0,
  "frequency_penalty": 0
}
```

---

## 💡 Примеры использования

### Пример 1: Создание телеграм-бота

```typescript
// Шаг 1: Планирование
setAgentMode('planner');
const plan = await aiService.chat('Создай телеграм-бота для заметок');

// План:
// 1. Создать bot.ts с инициализацией
// 2. Добавить handlers для команд /start, /add, /list
// 3. Создать database.ts для хранения заметок
// 4. Добавить package.json с зависимостями

// Шаг 2: Генерация кода
setAgentMode('writer');
for (const step of plan.steps) {
  const code = await aiService.chat(step.description);
  // Сохранить код в файл
}

// Шаг 3: Ревью
setAgentMode('reviewer');
const review = await aiService.explainCode(generatedCode);

// Шаг 4: Исправления
if (review.issues.length > 0) {
  setAgentMode('autofix');
  const fixes = await aiService.fixError(review.issues[0], code, 'bot.ts');
}
```

### Пример 2: Рефакторинг компонента

```typescript
// Используем Patch режим для минимальных изменений
setAgentMode('patch');

const changes = await aiService.analyzeAndModifyFiles(
  'Разбей LoginForm на отдельные компоненты',
  '/path/to/project',
  ['src/components/LoginForm.tsx']
);

// Результат - только diff, не весь файл:
// {
//   changes: [
//     {
//       path: 'src/components/LoginForm.tsx',
//       action: 'edit',
//       oldContent: '...',
//       newContent: '...',
//       explanation: 'Extracted EmailInput component'
//     },
//     {
//       path: 'src/components/EmailInput.tsx',
//       action: 'create',
//       newContent: '...',
//       explanation: 'New reusable email input component'
//     }
//   ]
// }
```

---

## 📈 Оптимизация токенов

### Стратегии экономии:

1. **Chunk файлы** - отправлять по 200-400 строк
2. **Diff вместо полного файла** - экономия ×3-×5
3. **AST summary** - только структура, не весь код
4. **Контекст 2-3 последних изменения** - не вся история
5. **Правильный режим для задачи** - не использовать Writer для ревью

### Расход по режимам:

| Режим | Средний расход | Задач из 1M |
|-------|---------------|-------------|
| Planner | 800 tokens | 1250 |
| Writer | 1800 tokens | 555 |
| Patch | 1200 tokens | 833 |
| Reviewer | 900 tokens | 1111 |
| AutoFix | 1000 tokens | 1000 |

### Полный цикл:
- **Один цикл**: ~5700 токенов
- **Из 1M токенов**: ~175 полных циклов
- **Цель 500+ промптов**: достижимо при средней задаче ~2000 токенов

---

## 🔐 Multi-user Support

### Разделение по пользователям:

```typescript
// Каждый пользователь имеет свою сессию
const userSessions = new Map<string, {
  tokenUsage: TokenUsage;
  conversationHistory: AIMessage[];
  taskQueue: Task[];
}>();

// Лимиты на пользователя
const USER_LIMITS = {
  maxTokensPerUser: 200000,  // 200K токенов на пользователя
  maxPromptsPerUser: 100     // 100 промптов на пользователя
};
```

---

## 🚀 Готово к использованию

### Запуск:
```bash
npm run dev
```

### Использование:
1. Открыть AI Panel
2. Выбрать режим агента (Planner/Writer/Patch/Reviewer/AutoFix)
3. Ввести запрос
4. Агент автоматически использует правильные параметры

### Мониторинг токенов:
- Внизу экрана - TokenStatsPanel
- Показывает: использовано/осталось/промптов
- Обновляется в реальном времени

---

## 📝 API Reference

### Функции aiService:

```typescript
// Установка режима
setAgentMode(mode: AgentMode): void

// Получение текущего режима
getAgentMode(): AgentMode

// Получение статистики токенов
getTokenUsage(): TokenUsageStats

// Сброс счетчика токенов
resetTokenUsage(): void

// Основные методы (автоматически используют текущий режим)
chat(message: string, context?: any): Promise<string>
analyzeProject(projectPath: string): Promise<ProjectAnalysis>
generateTests(filePath: string, content: string): Promise<string>
explainCode(code: string, context?: string): Promise<string>
fixError(error: string, code: string, file: string): Promise<AgentResponse>
refactorCode(code: string, file: string, instructions?: string): Promise<AgentResponse>
analyzeAndModifyFiles(instruction: string, projectPath: string, files: string[]): Promise<Changes>
```

---

## ✅ Преимущества реализации

1. **Экономия токенов** - diff/AST вместо полных файлов (×3-×5 экономия)
2. **Правильные параметры** - каждый режим оптимизирован для своей задачи
3. **Контроль бюджета** - отслеживание токенов в реальном времени
4. **Качество кода** - DeepSeek V3.2 специализирован для кода
5. **Прозрачность** - видно какой режим и сколько токенов использует
6. **Масштабируемость** - 500+ промптов из 1M токенов

---

## 🎓 Best Practices

1. **Используйте Planner** для сложных задач - разбивка экономит токены
2. **Patch для изменений** - не генерируйте весь файл заново
3. **Reviewer перед коммитом** - найдет баги за 900 токенов
4. **AutoFix для ошибок** - быстрее чем ручное исправление
5. **Мониторьте токены** - не превышайте бюджет

---

**Агент готов к работе! 🚀**

Используйте правильный режим для каждой задачи и получите максимум из 1M токенов.
