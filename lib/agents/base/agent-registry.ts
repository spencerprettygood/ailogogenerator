import { Agent, AgentConstructor, AgentRegistry } from '../../types-agents';

/**
 * Registry class for managing agent types and their constructors
 */
class AgentRegistryManager {
  private registry: AgentRegistry = {};
  
  /**
   * Register a new agent type with its constructor
   */
  register(name: string, agentConstructor: AgentConstructor): void {
    if (this.registry[name]) {
      console.warn(`Agent type '${name}' is already registered. Overwriting.`);
    }
    
    this.registry[name] = agentConstructor;
  }
  
  /**
   * Create a new agent instance of the specified type
   */
  create(name: string): Agent | null {
    const constructor = this.registry[name];
    
    if (!constructor) {
      console.error(`Agent type '${name}' is not registered.`);
      return null;
    }
    
    return new constructor();
  }
  
  /**
   * Get all registered agent types
   */
  getRegisteredTypes(): string[] {
    return Object.keys(this.registry);
  }
  
  /**
   * Check if an agent type is registered
   */
  isRegistered(name: string): boolean {
    return !!this.registry[name];
  }
}

// Export a singleton instance
export const agentRegistry = new AgentRegistryManager();