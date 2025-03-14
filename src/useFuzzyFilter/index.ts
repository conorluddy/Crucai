import { useRef, useState, useEffect, useMemo } from "react";
import { FuzzyTrie } from "./FuzzyTrieClass";

/**
 * A React hook that implements a fuzzy search trie for efficient searching and suggestions.
 *
 * @template T The type of items stored in the trie.
 * @param {UseTrieOptions<T>} options - Configuration options for the fuzzy trie.
 * @param {T[]} [options.items=[]] - An array of items to be added to the trie.
 * @param {(item: T) => string} options.getSearchString - A function that returns the search string for each item.
 * @param {number} [options.debounceMs=150] - The debounce time in milliseconds for the search function.
 * @param {number} [options.minSearchLength=1] - The minimum length of the search term to start searching.
 * @param {number} [options.maxDistance=2] - The maximum Levenshtein distance for fuzzy matching.
 * @param {number} [options.maxResults=10] - The maximum number of results to return.
 * @returns {{
 *   search: (searchTerm: string) => void,
 *   suggestions: T[]
 * }} An object containing the search function and current suggestions.
 */
function useFuzzyFilter<T>({
  items = [],
  getSearchString,
  debounceMs = 150,
  minSearchLength = 1,
  maxDistance = 2,
  maxResults = 10,
}: UseTrieOptions<T>) {
  const trieRef = useRef(new FuzzyTrie<T>());
  const [suggestions, setSuggestions] = useState<T[]>([]);

  useEffect(() => {
    trieRef.current = new FuzzyTrie<T>();
    items.forEach((item) => {
      trieRef.current.addItemToTrie(getSearchString(item), item);
    });
  }, [items, getSearchString]);

  const search = useMemo(
    () =>
      debounce((searchTerm: string) => {
        if (searchTerm.length < minSearchLength) {
          setSuggestions([]);
          return;
        }
        const results = trieRef.current
          .searchItems(searchTerm, maxDistance)
          .slice(0, maxResults);

        setSuggestions(results);
      }, debounceMs),
    [minSearchLength, maxDistance, maxResults, debounceMs]
  );

  return { search, suggestions };
}

function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  // Using a regular function to maintain 'this' context
  return function(this: unknown, ...args: Parameters<T>) {
    // Store the 'this' context correctly
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  } as T;
}

export { useFuzzyFilter };

interface UseTrieOptions<T> {
  items?: T[];
  getSearchString: (item: T) => string;
  debounceMs?: number;
  minSearchLength?: number;
  maxDistance?: number;
  maxResults?: number;
}
