export interface ChatCommand {
  name: string;
  description: string;
  usage: string;
  category: 'utility' | 'settings' | 'fun' | 'spotify';
  execute: (args: string[]) => Promise<void> | void;
}

export interface CommandSuggestion {
  command: ChatCommand;
  matchScore: number;
}

class CommandSystem {
  private commands: Map<string, ChatCommand> = new Map();

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    // Spotify Login Command
    this.registerCommand({
      name: 'splogin',
      description: 'Login to Spotify to enable music features',
      usage: '/splogin',
      category: 'spotify',
      execute: async () => {
        window.open('http://127.0.0.1:8000/api/spotify/login', '_blank');
      }
    });

    // Future commands can be added here
    // this.registerCommand({
    //   name: 'clear',
    //   description: 'Clear the chat history',
    //   usage: '/clear',
    //   category: 'utility',
    //   execute: async () => {
    //     // Implementation for clearing chat
    //   }
    // });
  }

  registerCommand(command: ChatCommand) {
    this.commands.set(command.name.toLowerCase(), command);
  }

  getCommand(name: string): ChatCommand | undefined {
    return this.commands.get(name.toLowerCase());
  }

  getAllCommands(): ChatCommand[] {
    return Array.from(this.commands.values());
  }

  searchCommands(query: string): CommandSuggestion[] {
    if (!query.startsWith('/')) {
      return [];
    }

    const searchTerm = query.slice(1).toLowerCase(); // Remove the '/' prefix
    
    if (searchTerm === '') {
      // Show all commands when just '/' is typed
      return Array.from(this.commands.values())
        .map(command => ({ command, matchScore: 1 }))
        .sort((a, b) => a.command.name.localeCompare(b.command.name));
    }

    const suggestions: CommandSuggestion[] = [];

    for (const command of this.commands.values()) {
      const commandName = command.name.toLowerCase();
      
      if (commandName.startsWith(searchTerm)) {
        // Exact prefix match gets highest score
        suggestions.push({ command, matchScore: 1 });
      } else if (commandName.includes(searchTerm)) {
        // Partial match gets lower score
        suggestions.push({ command, matchScore: 0.7 });
      } else if (command.description.toLowerCase().includes(searchTerm)) {
        // Description match gets lowest score
        suggestions.push({ command, matchScore: 0.5 });
      }
    }

    // Sort by match score (highest first), then by name
    return suggestions.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.command.name.localeCompare(b.command.name);
    });
  }

  async executeCommand(input: string): Promise<boolean> {
    if (!input.startsWith('/')) {
      return false;
    }

    const parts = input.slice(1).split(' '); // Remove '/' and split
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.getCommand(commandName);
    
    if (!command) {
      console.warn(`Unknown command: /${commandName}`);
      return false;
    }

    try {
      await command.execute(args);
      return true;
    } catch (error) {
      console.error(`Error executing command /${commandName}:`, error);
      return false;
    }
  }

  isCommand(input: string): boolean {
    return input.startsWith('/');
  }

  getCategoryIcon(category: ChatCommand['category']): string {
    switch (category) {
      case 'utility': return '🔧';
      case 'settings': return '⚙️';
      case 'fun': return '🎉';
      case 'spotify': return '🎵';
      default: return '💬';
    }
  }
}

export const commandSystem = new CommandSystem();