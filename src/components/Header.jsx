import { Bot, Settings, Bell, User } from "lucide-react";

const Header = ({ onOpenProfile }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-surface">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              AgentFlow<span className="text-primary">AI</span><span className="ml-1 text-xs font-medium text-warm">Pro</span>
            </h1>
            <p className="text-xs text-muted-foreground">Intelligent Search Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="ml-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
