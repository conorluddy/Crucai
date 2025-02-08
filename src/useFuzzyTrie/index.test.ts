import { FuzzyTrie } from "./FuzzyTrie";

describe("FuzzyTrie", () => {
  let trie: FuzzyTrie<string>;

  beforeEach(() => {
    trie = new FuzzyTrie<string>();
  });

  test("should add and retrieve exact matches", () => {
    trie.addItemToTrie("apple", "Apple fruit");
    trie.addItemToTrie("banana", "Banana fruit");

    expect(trie.searchItems("apple")).toEqual(["Apple fruit"]);
    expect(trie.searchItems("banana")).toEqual(["Banana fruit"]);
  });

  test("should handle case-insensitive searches", () => {
    trie.addItemToTrie("Apple", "Apple fruit");
    trie.addItemToTrie("BANANA", "Banana fruit");

    expect(trie.searchItems("apple")).toEqual(["Apple fruit"]);
    expect(trie.searchItems("APPLE")).toEqual(["Apple fruit"]);
    expect(trie.searchItems("banana")).toEqual(["Banana fruit"]);
    expect(trie.searchItems("BaNaNa")).toEqual(["Banana fruit"]);
  });

  test("should handle fuzzy searches within allowed distance", () => {
    trie.addItemToTrie("apple", "Apple fruit");
    trie.addItemToTrie("apricot", "Apricot fruit");
    trie.addItemToTrie("banana", "Banana fruit");

    expect(trie.searchItems("aple", 1)).toEqual(["Apple fruit"]);
    expect(trie.searchItems("aprot", 2)).toEqual(["Apricot fruit"]);
    expect(trie.searchItems("banan", 1)).toEqual(["Banana fruit"]);
  });

  // TODO: Fix me
  test.skip("should return multiple results sorted by distance", () => {
    trie.addItemToTrie("apple", "Apple fruit");
    trie.addItemToTrie("apricot", "Apricot fruit");
    trie.addItemToTrie("banana", "Banana fruit");

    const results = trie.searchItems("app", 2);
    expect(results).toHaveLength(2);
    expect(results).toContain("Apple fruit");
    expect(results).toContain("Apricot fruit");
    expect(results).not.toContain("Banana fruit");
  });

  test("should not return results beyond max allowed distance", () => {
    trie.addItemToTrie("apple", "Apple fruit");
    trie.addItemToTrie("banana", "Banana fruit");

    expect(trie.searchItems("grape", 2)).toEqual([]);
  });

  test("should handle empty searches", () => {
    trie.addItemToTrie("apple", "Apple fruit");
    trie.addItemToTrie("banana", "Banana fruit");

    expect(trie.searchItems("")).toEqual([]);
  });

  test("should handle searches in empty trie", () => {
    expect(trie.searchItems("apple")).toEqual([]);
  });

  test("should handle multiple items with the same search string", () => {
    trie.addItemToTrie("fruit", "Apple");
    trie.addItemToTrie("fruit", "Banana");

    const results = trie.searchItems("fruit");
    expect(results).toContain("Apple");
    expect(results).toContain("Banana");
    expect(results.length).toBe(2);
  });
});
