/**
 * A trie data structure optimized for approximate string matching,
 * allowing for flexible yet controlled searches based on lexicographical
 * distance.
 *
 * This class provides methods to add items with associated search strings and
 * to perform searches within a specified maximum Levenshtein distance.
 *
 * Levenshtein distance is a metric used in computer science and information
 * theory to measure the difference between two sequences of characters.
 * It's also known as the edit distance.
 *
 * Specifically, the Levenshtein distance between two words is the minimum
 * number of single-character edits (insertions, deletions, or substitutions)
 * required to change one word into the other.
 *
 * For example:
 *
 * The Levenshtein distance between "kitten" and "sitting" is 3:
 *
 * kitten → sitten (substitution of "s" for "k")
 * sitten → sittin (substitution of "i" for "e")
 * sittin → sitting (insertion of "g" at the end)
 * The Levenshtein distance between "book" and "back" is 2:
 *
 * book → bock (substitution of "c" for "o")
 * bock → back (substitution of "a" for "o")
 *
 * Using Levenshtein distance in this class allows the search to return
 * results that are close matches to the search term, even if they're
 * not exact matches. The results are then sorted based on this distance,
 * with the closest matches (lowest Levenshtein distance) appearing first
 * in the results array.
 *
 * This approach is particularly useful for implementing features like
 * autocorrect, spell-checking, or fuzzy search functionality where you
 * want to find close matches to a given input string.
 *
 * ------------------------------------------------------------------------
 *
 * Usage:
 * 1. Create an instance of FuzzyTrie:
 *    const trie = new FuzzyTrie<YourItemType>();
 *
 * 2. Add items to the trie:
 *    trie.addItemToTrie("search string", yourItem);
 *    You can add multiple items with the same or different search strings.
 *
 * 3. Perform a fuzzy search:
 *    const results = trie.searchItems("query string", maxAllowedDistance);
 *    - "query string" is the search term
 *    - maxAllowedDistance is the maximum Levenshtein distance allowed (default is 2)
 *
 * 4. The search returns an array of items sorted by their Levenshtein distance
 *    from the query string, with the closest matches first.
 *
 * Example:
 * const trie = new FuzzyTrie<string>();
 * trie.addItemToTrie("apple", "Apple fruit");
 * trie.addItemToTrie("banana", "Banana fruit");
 * const results = trie.searchItems("aple", 1);
 * // results will contain ["Apple fruit"]
 */

interface TrieNode<T> {
  // Map of child nodes, where keys are characters and values are their corresponding TrieNode objects
  childNodes: Map<string, TrieNode<T>>;
  // Flag indicating if this node represents a complete word in the trie
  isCompleteWord: boolean;
  // Array of items associated with this node and their corresponding search strings
  associatedItems: Array<{ storedItem: T; associatedSearchString: string }>;
}

/*
 * @class FuzzyTrie<T>
 * @template T The type of items stored in the trie
 */
class FuzzyTrie<T> {
  // The root node of the Trie
  private rootNode: TrieNode<T> = {
    childNodes: new Map(),
    isCompleteWord: false,
    associatedItems: [],
  };

  // Calculates the Levenshtein distance between two strings, up to a maximum allowed distance
  private calculateLevenshteinDistance(
    firstString: string,
    secondString: string,
    maxAllowedDistance: number = Infinity,
  ): number {
    if (firstString === secondString) return 0;
    if (firstString.length > secondString.length)
      [firstString, secondString] = [secondString, firstString];

    const firstStringLength = firstString.length;
    const secondStringLength = secondString.length;

    // If the difference in length exceeds maxAllowedDistance, immediately return a large value
    if (secondStringLength - firstStringLength > maxAllowedDistance)
      return maxAllowedDistance + 1;

    let previousDistanceRow = new Array(firstStringLength + 1);
    for (let i = 0; i <= firstStringLength; i++) {
      previousDistanceRow[i] = i;
    }

    // Iterate over each character of the second string
    for (
      let currentIndex = 1;
      currentIndex <= secondStringLength;
      currentIndex++
    ) {
      const currentDistanceRow = [currentIndex];
      const secondStringChar = secondString.charCodeAt(currentIndex - 1);
      let minimumDistanceInRow = currentIndex;

      // Iterate over each character of the first string
      for (
        let compareIndex = 1;
        compareIndex <= firstStringLength;
        compareIndex++
      ) {
        const firstStringChar = firstString.charCodeAt(compareIndex - 1);
        const substitutionCost = firstStringChar === secondStringChar ? 0 : 1;
        const insertionCost = currentDistanceRow[compareIndex - 1] + 1;
        const deletionCost = previousDistanceRow[compareIndex] + 1;
        const substitutionOrMatchCost =
          previousDistanceRow[compareIndex - 1] + substitutionCost;
        // Calculate the minimum cost of substitution, insertion, or deletion
        currentDistanceRow[compareIndex] = Math.min(
          insertionCost,
          deletionCost,
          substitutionOrMatchCost,
        );
        // Update the minimum distance in the row
        minimumDistanceInRow = Math.min(
          minimumDistanceInRow,
          currentDistanceRow[compareIndex],
        );
      }

      // If the minimum distance exceeds maxAllowedDistance, return a large value
      if (minimumDistanceInRow > maxAllowedDistance) {
        return maxAllowedDistance + 1;
      }

      // Update the previous distance row for the next iteration
      previousDistanceRow = currentDistanceRow;
    }

    // Return the final Levenshtein distance between the two strings
    return previousDistanceRow[firstStringLength];
  }

  // Adds an item to the Trie based on a search string
  addItemToTrie(searchString: string, itemToAdd: T) {
    let currentNode = this.rootNode;
    const normalizedSearchString = searchString.toLowerCase();

    // Traverse the Trie to find or create nodes for each character in the search string
    for (const currentChar of normalizedSearchString) {
      if (!currentNode.childNodes.has(currentChar)) {
        currentNode.childNodes.set(currentChar, {
          childNodes: new Map(),
          isCompleteWord: false,
          associatedItems: [],
        });
      }
      currentNode = currentNode.childNodes.get(currentChar)!;
    }

    // Mark the current node as a complete word and associate it with the item
    currentNode.isCompleteWord = true;
    currentNode.associatedItems.push({
      storedItem: itemToAdd,
      associatedSearchString: normalizedSearchString,
    });
  }

  // Searches for items based on a query string, considering a maximum allowed distance
  searchItems(queryString: string, maxAllowedDistance: number = 2): T[] {
    const normalizedQuery = queryString.toLowerCase();
    const searchResults: Array<{
      matchedItem: T;
      levenshteinDistance: number;
      matchedSearchString: string;
    }> = [];

    // Helper function to traverse the Trie nodes
    const traverseTrieNodes = (
      currentNode: TrieNode<T>,
      currentPrefix: string,
    ) => {
      // If the current node represents a complete word, check its associated items
      if (currentNode.isCompleteWord) {
        currentNode.associatedItems.forEach(
          ({ storedItem, associatedSearchString }) => {
            // Calculate the Levenshtein distance between the query and the associated search string
            const calculatedDistance = this.calculateLevenshteinDistance(
              normalizedQuery,
              associatedSearchString,
              maxAllowedDistance,
            );

            // If the distance is within the allowed limit, add the item to the results
            if (calculatedDistance <= maxAllowedDistance) {
              searchResults.push({
                matchedItem: storedItem,
                levenshteinDistance: calculatedDistance,
                matchedSearchString: associatedSearchString,
              });
            }
          },
        );
      }

      // Recursively traverse each child node of the current node
      currentNode.childNodes.forEach((childNode, charToChild) => {
        traverseTrieNodes(childNode, currentPrefix + charToChild);
      });
    };

    // Start the traversal from the root node with an empty prefix
    traverseTrieNodes(this.rootNode, "");

    // Sort the matched items by their Levenshtein distance
    const sortedMatchedItems = searchResults
      .sort((a, b) => a.levenshteinDistance - b.levenshteinDistance)
      .map((result) => result.matchedItem);

    // Return the sorted list of matched items
    return sortedMatchedItems;
  }
}

export { FuzzyTrie };
