import { Bell, Search, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LabSwitcher } from "@/components/LabSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import logoUrl from "@assets/FullLogo_1754662799020.png";

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { user } = useAuth() as { user?: User };
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["/api/search", debouncedQuery],
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(query.trim().length > 0);
  };

  // Handle search submit (Enter key or button click)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle result selection
  const handleResultClick = (result: any) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(result.url);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = searchResults?.results || [];

  return (
    <header className="h-16 glass border-b border-border/50 flex items-center justify-between px-6 backdrop-blur-xl bg-gradient-to-r from-card via-card to-muted/30">
      {/* Left side - Logo, Menu and Search */}
      <div className="flex items-center space-x-6">
        {/* LabSync Logo */}
        <div className="flex items-center space-x-3">
          <img 
            src={logoUrl} 
            alt="LabSync" 
            className="h-8 w-auto"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden hover:bg-accent/20 transition-all duration-200"
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search studies, tasks, or documents..."
              className="pl-10 pr-4 py-2 w-80 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm text-black placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 hover:bg-background/70"
              data-testid="input-search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
            />
          </form>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-lg backdrop-blur-xl z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="p-3 border-b border-border/30">
                    <p className="text-sm text-muted-foreground">
                      {results.length} results for "{debouncedQuery}"
                    </p>
                  </div>
                  {results.map((result: any) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 text-left hover:bg-accent/20 transition-colors duration-200 border-b border-border/10 last:border-b-0 group"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">{result.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground group-hover:text-primary truncate">
                              {result.title}
                            </p>
                            <span className="text-xs px-2 py-0.5 bg-accent/30 rounded-full text-accent-foreground capitalize">
                              {result.type}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </button>
                  ))}
                  {debouncedQuery.trim() && (
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full p-3 text-center border-t border-border/30 text-primary hover:bg-accent/10 transition-colors duration-200"
                    >
                      See all results for "{debouncedQuery}"
                    </button>
                  )}
                </>
              ) : debouncedQuery.trim() ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{debouncedQuery}"</p>
                  <p className="text-sm mt-1">Try different keywords or check your spelling</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Lab Switcher */}
        <LabSwitcher />
      </div>

      {/* Right side - Notifications, Theme Toggle and User */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent/20 transition-all duration-200"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
        </Button>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium shadow-sm">
              {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
              <p className="text-xs text-accent/80 font-medium">Making Science Easier</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}