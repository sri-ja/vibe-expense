// A palette of visually distinct colors
const PALETTE = [
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", hex: "#fb923c" },
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", hex: "#60a5fa" },
  { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", hex: "#facc15" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", hex: "#c084fc" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200", hex: "#f472b6" },
  { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", hex: "#f87171" },
  { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", hex: "#4ade80" },
  { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200", hex: "#22d3ee" },
  { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-200", hex: "#a3e635" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", hex: "#818cf8" },
];

const DEFAULT_COLOR = { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", hex: "#9ca3af" };

// A map to store assigned colors for categories to ensure uniqueness and consistency
const categoryColorMap = new Map<string, typeof PALETTE[0]>();
let lastAssignedIndex = -1;

/**
 * Assigns a consistent and unique color to a category from a predefined palette.
 * It remembers the color assigned to each category during the session.
 * @param category The category name string.
 * @returns A color object with Tailwind CSS classes and a hex code.
 */
export const getCategoryColor = (category: string) => {
  if (!category) return DEFAULT_COLOR;

  // If we've already assigned a color to this category, return it for consistency.
  if (categoryColorMap.has(category)) {
    return categoryColorMap.get(category)!;
  }

  // Otherwise, assign the next available color from the palette in a cycle.
  lastAssignedIndex = (lastAssignedIndex + 1) % PALETTE.length;
  const color = PALETTE[lastAssignedIndex];
  
  // Store the assignment for future calls.
  categoryColorMap.set(category, color);

  return color;
};
