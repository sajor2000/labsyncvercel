// Drag and drop utilities for position-based ordering

/**
 * Generate a position string between two positions for ordering
 * Uses lexicographic ordering (a, b, c, etc.)
 */
export function generatePositionBetween(before?: string, after?: string): string {
  if (!before && !after) {
    return 'a';
  }
  
  if (!before) {
    // Insert at beginning
    const firstChar = after!.charCodeAt(0);
    if (firstChar > 97) { // 'a'
      return String.fromCharCode(firstChar - 1);
    }
    return after! + 'a';
  }
  
  if (!after) {
    // Insert at end
    const lastChar = before.charCodeAt(before.length - 1);
    if (lastChar < 122) { // 'z'
      return before.slice(0, -1) + String.fromCharCode(lastChar + 1);
    }
    return before + 'a';
  }
  
  // Insert between two positions
  if (before < after) {
    const commonLength = Math.min(before.length, after.length);
    let commonPrefix = '';
    
    for (let i = 0; i < commonLength; i++) {
      if (before[i] === after[i]) {
        commonPrefix += before[i];
      } else {
        break;
      }
    }
    
    const beforeChar = before.charCodeAt(commonPrefix.length) || 96; // before 'a'
    const afterChar = after.charCodeAt(commonPrefix.length) || 123; // after 'z'
    
    if (afterChar - beforeChar > 1) {
      return commonPrefix + String.fromCharCode(Math.floor((beforeChar + afterChar) / 2));
    }
    
    return before + 'a';
  }
  
  return before + 'a';
}

/**
 * Update item position via API
 */
export async function updateItemPosition(
  type: 'bucket' | 'study' | 'task',
  id: string,
  position: string
): Promise<void> {
  const response = await fetch(`/api/items/${type}/${id}/position`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ position }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ${type} position`);
  }
}

/**
 * Drag and drop event handlers
 */
export const dragHandlers = {
  onDragStart: (e: React.DragEvent, item: any, type: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, type }));
    e.dataTransfer.effectAllowed = 'move';
  },

  onDragOver: (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  onDrop: (
    e: React.DragEvent,
    onDrop: (draggedItem: any, draggedType: string, targetPosition: string) => void,
    targetPosition: string
  ) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    onDrop(data.item, data.type, targetPosition);
  },
};

/**
 * Get items sorted by position
 */
export function sortByPosition<T extends { position?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const posA = a.position || 'z';
    const posB = b.position || 'z';
    return posA.localeCompare(posB);
  });
}