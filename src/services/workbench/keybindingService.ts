// Keybinding Service - обработка горячих клавиш как в VS Code

import { actionRegistry } from './actionRegistry';

interface KeybindingHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void | Promise<void>;
}

class KeybindingService {
  private handlers: KeybindingHandler[] = [];
  private isListening = false;

  start(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  stop(): void {
    this.isListening = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = async (e: KeyboardEvent) => {
    // Игнорируем если фокус в input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Разрешаем только некоторые комбинации в input
      if (!(e.ctrlKey && (e.key === 's' || e.key === 'S'))) {
        return;
      }
    }

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Проверяем зарегистрированные обработчики
    for (const handler of this.handlers) {
      if (
        handler.key === key &&
        (handler.ctrl === undefined || handler.ctrl === ctrl) &&
        (handler.shift === undefined || handler.shift === shift) &&
        (handler.alt === undefined || handler.alt === alt)
      ) {
        e.preventDefault();
        await handler.handler();
        return;
      }
    }

    // Проверяем действия из registry
    const keybinding = this.formatKeybinding(e);
    const actions = actionRegistry.getAllActions();
    
    for (const action of actions) {
      if (action.keybinding === keybinding) {
        e.preventDefault();
        await actionRegistry.executeAction(action.id);
        return;
      }
    }
  };

  private formatKeybinding(e: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    
    let key = e.key;
    if (key === ' ') key = 'Space';
    else if (key === '`') key = '`';
    else if (key.length === 1) key = key.toUpperCase();
    
    parts.push(key);
    
    return parts.join('+');
  }

  registerKeybinding(keybinding: string, handler: () => void | Promise<void>): void {
    const parts = keybinding.split('+').map(p => p.trim());
    
    const binding: KeybindingHandler = {
      key: parts[parts.length - 1].toLowerCase(),
      ctrl: parts.includes('Ctrl'),
      shift: parts.includes('Shift'),
      alt: parts.includes('Alt'),
      handler
    };

    this.handlers.push(binding);
  }

  unregisterKeybinding(keybinding: string): void {
    const parts = keybinding.split('+').map(p => p.trim());
    const key = parts[parts.length - 1].toLowerCase();
    const ctrl = parts.includes('Ctrl');
    const shift = parts.includes('Shift');
    const alt = parts.includes('Alt');

    this.handlers = this.handlers.filter(h => 
      !(h.key === key && h.ctrl === ctrl && h.shift === shift && h.alt === alt)
    );
  }
}

export const keybindingService = new KeybindingService();

// Автоматический старт при импорте
keybindingService.start();
