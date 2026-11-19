import { describe, expect, it } from 'vitest';
import { findCategoryBySlug, listCategories } from './index';

describe('@askalert/category-engine', () => {
  it('lists launch categories', () => {
    expect(listCategories().length).toBeGreaterThan(0);
    expect(findCategoryBySlug('home-services')?.name).toBe('Home services');
  });
});
