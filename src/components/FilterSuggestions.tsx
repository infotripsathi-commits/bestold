import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { getFilterSuggestions, trackSuggestionClick, type FilterSuggestion } from '@/db/api';

interface FilterSuggestionsProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  userId?: string;
  onSuggestionClick: (filterId: string, filterType: 'category' | 'subcategory') => void;
}

export default function FilterSuggestions({
  selectedCategories,
  selectedSubcategories,
  userId,
  onSuggestionClick,
}: FilterSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<FilterSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [selectedCategories, selectedSubcategories, userId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await getFilterSuggestions(
        selectedCategories,
        selectedSubcategories,
        userId,
        5
      );
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: FilterSuggestion) => {
    // Track the click for analytics
    trackSuggestionClick(
      suggestion.filter_id,
      suggestion.filter_type,
      suggestion.filter_name,
      suggestion.reason
    );

    // Call the parent handler
    onSuggestionClick(suggestion.filter_id, suggestion.filter_type);
  };

  const getReasonIcon = (reason: string) => {
    if (reason === 'Based on your activity') {
      return <Sparkles className="h-3 w-3" />;
    } else if (reason === 'Popular this week') {
      return <TrendingUp className="h-3 w-3" />;
    }
    return null;
  };

  const getReasonColor = (reason: string) => {
    if (reason === 'Based on your activity') {
      return 'border-primary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary';
    }
    return 'hover:bg-primary hover:text-primary-foreground';
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-36" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span className="font-medium">Suggested filters:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Badge
            key={suggestion.filter_id}
            variant="outline"
            className={`cursor-pointer transition-colors gap-1.5 px-3 py-1.5 ${getReasonColor(suggestion.reason)}`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {getReasonIcon(suggestion.reason)}
            <span>{suggestion.filter_name}</span>
            <span className="text-xs opacity-70">
              ({suggestion.reason})
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
