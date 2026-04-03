import { useState } from "react";

export function useCategoriesFilters() {
  const [search, setSearch] = useState("");
  // Add more filter logic as needed
  return { search, setSearch };
}
