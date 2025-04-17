
import React from "react";
import { Button } from "@/components/ui/button";

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-700 mb-3">Choose a category:</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onSelectCategory(null)}
          className={`${
            selectedCategory === null
              ? "bg-italian-blue text-white"
              : "bg-italian-white text-gray-700 hover:bg-italian-cream"
          } rounded-full px-4 py-1 text-sm font-medium transition-colors`}
          variant="outline"
        >
          All
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`${
              selectedCategory === category
                ? "bg-italian-blue text-white"
                : "bg-italian-white text-gray-700 hover:bg-italian-cream"
            } rounded-full px-4 py-1 text-sm font-medium transition-colors`}
            variant="outline"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
