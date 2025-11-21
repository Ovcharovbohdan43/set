import { useEffect, useMemo, useState } from 'react';

import { useCategoriesQuery } from '@/features/transactions/hooks';
import type { Category } from '@/features/transactions/schema';
import { useUpdateCategoryOrderMutation } from '../../hooks';

interface SortableCategoryItemProps {
  category: Category;
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function SortableCategoryItem({
  category,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: SortableCategoryItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? 'opacity-50' : 'cursor-move hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      <span className="text-sm text-slate-400">{index + 1}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-white">{category.name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{category.type}</div>
      </div>
      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </div>
  );
}

export function CategoriesSection() {
  const categoriesQuery = useCategoriesQuery();
  const updateOrderMutation = useUpdateCategoryOrderMutation();
  const [items, setItems] = useState<Category[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const categories = categoriesQuery.data ?? [];

  // Initialize items when categories load
  useEffect(() => {
    if (categories.length > 0 && items.length === 0) {
      // Sort by sort_order
      const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setItems(sorted);
    }
  }, [categories, items.length]);

  const sortedItems = useMemo(() => {
    if (items.length > 0) {
      return items;
    }
    return categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [items, categories]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder items
    const newItems = [...sortedItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    if (!draggedItem) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    newItems.splice(dragOverIndex, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist new order to backend
    try {
      await updateOrderMutation.mutateAsync({
        categoryIds: newItems.map((item) => item.id)
      });
      // Refetch categories to ensure sync
      await categoriesQuery.refetch();
    } catch (error) {
      console.error('Failed to update category order', error);
      // Revert on error
      const reverted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setItems(reverted);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // handleDragEnd will handle the drop
  };

  if (categoriesQuery.isLoading) {
    return <div className="text-sm text-slate-500">Loading categories...</div>;
  }

  if (categories.length === 0) {
    return <div className="text-sm text-slate-500">No categories found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Categories</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Drag and drop categories to reorder them. The new order will be saved automatically.
        </p>
      </div>

      <div className="space-y-2">
        {sortedItems.map((category, index) => (
          <SortableCategoryItem
            key={category.id}
            category={category}
            index={index}
            isDragging={draggedIndex === index}
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e)}
          />
        ))}
      </div>

      {updateOrderMutation.isPending && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Saving order...</p>
      )}

      {updateOrderMutation.isError && (
        <p className="text-xs text-red-500 dark:text-red-400">
          Failed to save category order. Please try again.
        </p>
      )}
    </div>
  );
}
