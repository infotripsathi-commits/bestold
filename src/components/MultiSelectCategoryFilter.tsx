import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Filter } from 'lucide-react';
import type { CategoryWithSubcategories } from '@/types';

interface MultiSelectCategoryFilterProps {
  categories: CategoryWithSubcategories[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  onSelectionChange: (categories: string[], subcategories: string[]) => void;
}

export default function MultiSelectCategoryFilter({
  categories,
  selectedCategories,
  selectedSubcategories,
  onSelectionChange,
}: MultiSelectCategoryFilterProps) {
  const [open, setOpen] = useState(false);

  const totalSelected = selectedCategories.length + selectedSubcategories.length;

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onSelectionChange(newCategories, selectedSubcategories);
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = selectedSubcategories.includes(subcategoryId)
      ? selectedSubcategories.filter(id => id !== subcategoryId)
      : [...selectedSubcategories, subcategoryId];
    
    onSelectionChange(selectedCategories, newSubcategories);
  };

  const handleClearAll = () => {
    onSelectionChange([], []);
  };

  const handleSelectAll = () => {
    const allCategoryIds = categories.map(cat => cat.id);
    const allSubcategoryIds = categories.flatMap(cat => 
      cat.subcategories?.map(sub => sub.id) || []
    );
    onSelectionChange(allCategoryIds, allSubcategoryIds);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between bg-background">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Categories
          </span>
          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalSelected}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">Select Categories</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleClearAll}
              disabled={totalSelected === 0}
            >
              Clear
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sub-${subcategory.id}`}
                          checked={selectedSubcategories.includes(subcategory.id)}
                          onCheckedChange={() => handleSubcategoryToggle(subcategory.id)}
                        />
                        <Label
                          htmlFor={`sub-${subcategory.id}`}
                          className="text-sm cursor-pointer text-muted-foreground"
                        >
                          {subcategory.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
