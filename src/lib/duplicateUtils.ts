// Utility functions for detecting and handling duplicate clients

/**
 * Normalizes a company name for comparison
 * Removes accents, extra spaces, and converts to lowercase
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Calculates similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);
  
  // If normalized strings are identical
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longerLength = Math.max(s1.length, s2.length);
    const shorterLength = Math.min(s1.length, s2.length);
    return shorterLength / longerLength;
  }
  
  // Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

/**
 * Finds potential duplicate clients based on company name similarity
 * Returns clients with similarity above threshold (default 0.7 = 70%)
 */
export interface DuplicateMatch {
  client: {
    id: string;
    companyName: string;
    columnId: string;
    startDate: string;
    lastUpdate: string;
    checklist?: { items: { completed: boolean }[] }[];
  };
  similarity: number;
  completionRate: number;
}

export function findPotentialDuplicates(
  newName: string,
  existingClients: DuplicateMatch["client"][],
  threshold: number = 0.6
): DuplicateMatch[] {
  if (!newName.trim()) return [];
  
  const matches: DuplicateMatch[] = [];
  
  for (const client of existingClients) {
    const similarity = calculateSimilarity(newName, client.companyName);
    
    if (similarity >= threshold) {
      // Calculate completion rate if checklist exists
      let completionRate = 0;
      if (client.checklist) {
        const allItems = client.checklist.flatMap(section => section.items || []);
        const completedItems = allItems.filter(item => item.completed);
        completionRate = allItems.length > 0 ? completedItems.length / allItems.length : 0;
      }
      
      matches.push({
        client,
        similarity,
        completionRate,
      });
    }
  }
  
  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Determines which client to keep when merging duplicates
 * Priority: Most complete checklist > Most recent update > Oldest creation
 */
export function selectBestClient(clients: DuplicateMatch[]): DuplicateMatch | null {
  if (clients.length === 0) return null;
  if (clients.length === 1) return clients[0];
  
  return clients.sort((a, b) => {
    // 1. Prefer more complete checklist
    if (Math.abs(a.completionRate - b.completionRate) > 0.1) {
      return b.completionRate - a.completionRate;
    }
    
    // 2. Prefer more recently updated
    const aUpdate = new Date(a.client.lastUpdate).getTime();
    const bUpdate = new Date(b.client.lastUpdate).getTime();
    if (Math.abs(aUpdate - bUpdate) > 86400000) { // 1 day
      return bUpdate - aUpdate;
    }
    
    // 3. Prefer older (established) client
    const aStart = new Date(a.client.startDate).getTime();
    const bStart = new Date(b.client.startDate).getTime();
    return aStart - bStart;
  })[0];
}
