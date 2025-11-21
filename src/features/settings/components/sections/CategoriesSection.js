import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useCategoriesQuery } from '@/features/transactions/hooks';
import { useUpdateCategoryOrderMutation } from '../../hooks';
function SortableCategoryItem({ category, index, isDragging, onDragStart, onDragEnd, onDragOver, onDrop }) {
    return (_jsxs("div", { draggable: true, onDragStart: onDragStart, onDragEnd: onDragEnd, onDragOver: onDragOver, onDrop: onDrop, className: `flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition dark:border-slate-700 dark:bg-slate-800 ${isDragging ? 'opacity-50' : 'cursor-move hover:bg-slate-100 dark:hover:bg-slate-700'}`, children: [_jsx("span", { className: "text-sm text-slate-400", children: index + 1 }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium text-slate-900 dark:text-white", children: category.name }), _jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: category.type })] }), _jsx("svg", { className: "h-5 w-5 text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8h16M4 16h16" }) })] }));
}
export function CategoriesSection() {
    const categoriesQuery = useCategoriesQuery();
    const updateOrderMutation = useUpdateCategoryOrderMutation();
    const [items, setItems] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
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
    const handleDragStart = (index) => {
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
        }
        catch (error) {
            console.error('Failed to update category order', error);
            // Revert on error
            const reverted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            setItems(reverted);
        }
    };
    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        // handleDragEnd will handle the drop
    };
    if (categoriesQuery.isLoading) {
        return _jsx("div", { className: "text-sm text-slate-500", children: "Loading categories..." });
    }
    if (categories.length === 0) {
        return _jsx("div", { className: "text-sm text-slate-500", children: "No categories found" });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Categories" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Drag and drop categories to reorder them. The new order will be saved automatically." })] }), _jsx("div", { className: "space-y-2", children: sortedItems.map((category, index) => (_jsx(SortableCategoryItem, { category: category, index: index, isDragging: draggedIndex === index, onDragStart: () => handleDragStart(index), onDragEnd: handleDragEnd, onDragOver: (e) => handleDragOver(e, index), onDrop: (e) => handleDrop(e) }, category.id))) }), updateOrderMutation.isPending && (_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Saving order..." })), updateOrderMutation.isError && (_jsx("p", { className: "text-xs text-red-500 dark:text-red-400", children: "Failed to save category order. Please try again." }))] }));
}
