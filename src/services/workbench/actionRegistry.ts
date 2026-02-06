// Action Registry - система регистрации действий как в VS Code

export interface IAction {
  id: string;
  title: string;
  category?: string;
  keybinding?: string;
  icon?: any;
  when?: string;
  handler: (...args: any[]) => any | Promise<any>;
}

export interface IMenuItem {
  id: string;
  label: string;
  action?: string;
  submenu?: IMenuItem[];
  separator?: boolean;
  icon?: any;
  keybinding?: string;
  checked?: boolean;
  when?: string;
}

export enum MenuId {
  MenubarFileMenu = 'MenubarFileMenu',
  MenubarEditMenu = 'MenubarEditMenu',
  MenubarSelectionMenu = 'MenubarSelectionMenu',
  MenubarViewMenu = 'MenubarViewMenu',
  MenubarGoMenu = 'MenubarGoMenu',
  MenubarRunMenu = 'MenubarRunMenu',
  MenubarTerminalMenu = 'MenubarTerminalMenu',
  MenubarHelpMenu = 'MenubarHelpMenu',
  EditorContext = 'EditorContext',
  ExplorerContext = 'ExplorerContext',
  ActivityBar = 'ActivityBar',
}

class ActionRegistry {
  private actions = new Map<string, IAction>();
  private menus = new Map<MenuId, IMenuItem[]>();
  private keybindings = new Map<string, string>();

  registerAction(action: IAction): void {
    this.actions.set(action.id, action);
    
    if (action.keybinding) {
      this.keybindings.set(action.keybinding, action.id);
    }
  }

  registerMenuItem(menuId: MenuId, item: IMenuItem): void {
    const items = this.menus.get(menuId) || [];
    items.push(item);
    this.menus.set(menuId, items);
  }

  getAction(id: string): IAction | undefined {
    return this.actions.get(id);
  }

  getMenuItems(menuId: MenuId): IMenuItem[] {
    return this.menus.get(menuId) || [];
  }

  executeAction(id: string, ...args: any[]): Promise<any> {
    const action = this.actions.get(id);
    if (!action) {
      console.error(`Action ${id} not found`);
      return Promise.resolve();
    }

    try {
      const result = action.handler(...args);
      return Promise.resolve(result);
    } catch (error) {
      console.error(`Error executing action ${id}:`, error);
      return Promise.reject(error);
    }
  }

  executeKeybinding(keybinding: string, ...args: any[]): Promise<any> {
    const actionId = this.keybindings.get(keybinding);
    if (!actionId) {
      return Promise.resolve();
    }

    return this.executeAction(actionId, ...args);
  }

  getAllActions(): IAction[] {
    return Array.from(this.actions.values());
  }

  getActionsByCategory(category: string): IAction[] {
    return Array.from(this.actions.values()).filter(a => a.category === category);
  }
}

export const actionRegistry = new ActionRegistry();

// Helper для регистрации действий
export function registerAction(action: IAction): void {
  actionRegistry.registerAction(action);
}

export function registerMenuItem(menuId: MenuId, item: IMenuItem): void {
  actionRegistry.registerMenuItem(menuId, item);
}

export function executeAction(id: string, ...args: any[]): Promise<any> {
  return actionRegistry.executeAction(id, ...args);
}
