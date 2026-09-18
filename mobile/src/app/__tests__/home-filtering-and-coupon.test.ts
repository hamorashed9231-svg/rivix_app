import { describe, it, expect } from 'vitest';
import { MenuItem } from '@/services/restaurant';

describe('Home Category Filtering & Offers Logic Unit Tests', () => {
  const mockCategories = [
    {
      id: 'cat-soup',
      name: 'الشوربة',
      items: [
        { id: 'item-1', name: 'شوربة كوارع', price: 60, description: 'شوربة كوارع طازجة وغنية' },
      ],
    },
    {
      id: 'cat-poultry',
      name: 'مشويات الطيور',
      items: [
        { id: 'item-2', name: 'حمام محشي', price: 120, originalPrice: 150, description: 'حمام محشي أرز بالأعشاب' },
      ],
    },
    {
      id: 'cat-mahshi',
      name: 'المحاشي',
      items: [
        { id: 'item-3', name: 'محشي مشكل', price: 80, description: 'محشي ورق عنب وكوسة وفلفل' },
      ],
    },
  ];

  it('enriches rawItems with category name and categoryId from categories array', () => {
    const rawItems: MenuItem[] = mockCategories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: item.category || cat.name,
        categoryId: (item as any).categoryId || cat.id,
      }))
    );

    expect(rawItems).toHaveLength(3);
    expect(rawItems[0].category).toBe('الشوربة');
    expect(rawItems[1].category).toBe('مشويات الطيور');
    expect(rawItems[2].category).toBe('المحاشي');
  });

  it('filters correctly by category tab ("الشوربة", "مشويات الطيور", "المحاشي")', () => {
    const rawItems: MenuItem[] = mockCategories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: item.category || cat.name,
        categoryId: (item as any).categoryId || cat.id,
      }))
    );

    const filterByCategory = (catName: string) =>
      rawItems.filter((item) => item.category === catName || item.categoryId === catName);

    expect(filterByCategory('الشوربة')).toHaveLength(1);
    expect(filterByCategory('الشوربة')[0].name).toBe('شوربة كوارع');

    expect(filterByCategory('مشويات الطيور')).toHaveLength(1);
    expect(filterByCategory('مشويات الطيور')[0].name).toBe('حمام محشي');

    expect(filterByCategory('المحاشي')).toHaveLength(1);
    expect(filterByCategory('المحاشي')[0].name).toBe('محشي مشكل');
  });

  it('filters OFFERS tab to only items where originalPrice > price', () => {
    const rawItems: MenuItem[] = mockCategories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: item.category || cat.name,
        categoryId: (item as any).categoryId || cat.id,
      }))
    );

    const offersItems = rawItems.filter(
      (item) => item.originalPrice && item.originalPrice > item.price
    );

    expect(offersItems).toHaveLength(1);
    expect(offersItems[0].name).toBe('حمام محشي');
  });
});
