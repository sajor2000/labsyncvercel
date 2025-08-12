import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchResults() {
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    setQuery(params.get("q") || "");
  }, [window.location.search]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/search", query],
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const results = (searchResults as any)?.results || [];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "study":
        return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200" };
      case "task":
        return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200" };
      case "idea":
        return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200" };
      case "deadline":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200" };
      case "document":
        return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-200" };
      default:
        return { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-800 dark:text-gray-200" };
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString();
  };

  const handleResultClick = (result: any) => {
    navigate(result.url);
  };

  const handleNewSearch = (newQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search studies, tasks, ideas, deadlines, or documents..."
            className="w-full pl-12 pr-4 py-3 text-lg border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm text-black placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleNewSearch(query)}
            data-testid="input-search-page"
          />
        </div>

        {query && (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Search Results for "{query}"
            </h1>
            {results.length > 0 && (
              <p className="text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Searching across your research data...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && query && (
        <>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result: any) => {
                const typeStyles = getTypeStyles(result.type);
                return (
                  <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <button
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left group"
                        data-testid={`result-${result.type}-${result.id}`}
                      >
                        <div className="flex items-start space-x-4">
                          <span className="text-2xl flex-shrink-0 mt-1">{result.icon}</span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {result.title}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${typeStyles.bg} ${typeStyles.text}`}>
                                {result.type}
                              </span>
                            </div>
                            
                            {result.description && (
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            
                            {result.dueDate && (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {formatDate(result.dueDate)}</span>
                              </div>
                            )}
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find anything matching "{query}"
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Try searching for:</p>
                <p>• Study names or research topics</p>
                <p>• Task titles or descriptions</p>
                <p>• Research ideas or concepts</p>
                <p>• Document or file names</p>
                <p>• Deadline titles</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!query && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Global Research Search</h2>
          <p className="text-muted-foreground">
            Search across all your studies, tasks, ideas, deadlines, and documents
          </p>
        </div>
      )}
    </div>
  );
}