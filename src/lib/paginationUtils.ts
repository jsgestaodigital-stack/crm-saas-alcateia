/**
 * Pagination Utilities
 * Item 14: Supabase limit of 1000 rows - handle pagination properly
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000; // Supabase limit

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Calculate range for Supabase query
 */
export function calculateRange(params: PaginationParams): { from: number; to: number } {
  const pageSize = Math.min(params.pageSize, MAX_PAGE_SIZE);
  const from = (params.page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
): PaginatedResult<never>['pagination'] {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Fetch all records by paginating through results
 * Use this carefully - only when you need ALL records
 */
export async function fetchAllPaginated<T>(
  fetchFn: (params: { from: number; to: number }) => Promise<{ data: T[] | null; count: number | null; error: Error | null }>,
  pageSize = MAX_PAGE_SIZE
): Promise<T[]> {
  const allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await fetchFn({ from, to });

    if (error) {
      console.error('[fetchAllPaginated] Error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      allData.push(...data);
      
      // Check if there are more pages
      if (count !== null) {
        hasMore = allData.length < count;
      } else {
        hasMore = data.length === pageSize;
      }
      
      page++;
    } else {
      hasMore = false;
    }

    // Safety: prevent infinite loops
    if (page > 100) {
      console.warn('[fetchAllPaginated] Reached max pages (100), stopping');
      break;
    }
  }

  console.log(`[fetchAllPaginated] Fetched ${allData.length} total records`);
  return allData;
}

/**
 * Get page numbers for pagination UI
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(1);

  // Calculate start and end of middle section
  let start = Math.max(2, currentPage - half);
  let end = Math.min(totalPages - 1, currentPage + half);

  // Adjust if near start or end
  if (currentPage <= half + 1) {
    end = Math.min(maxVisible - 1, totalPages - 1);
  } else if (currentPage >= totalPages - half) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }

  // Add ellipsis before middle section if needed
  if (start > 2) {
    pages.push('ellipsis');
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis after middle section if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
