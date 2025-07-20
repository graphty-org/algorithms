import {describe, expect, it} from "vitest";

import {UnionFind} from "../../src/data-structures/union-find.js";

describe("UnionFind", () => {
    describe("constructor", () => {
        it("should initialize with separate components", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            expect(uf.size()).toBe(3);
            expect(uf.getComponentCount()).toBe(3);
            expect(uf.connected("a", "b")).toBe(false);
            expect(uf.connected("b", "c")).toBe(false);
            expect(uf.connected("a", "c")).toBe(false);
        });

        it("should handle empty initialization", () => {
            const uf = new UnionFind([]);

            expect(uf.size()).toBe(0);
            expect(uf.getComponentCount()).toBe(0);
        });

        it("should handle single element", () => {
            const uf = new UnionFind(["only"]);

            expect(uf.size()).toBe(1);
            expect(uf.getComponentCount()).toBe(1);
            expect(uf.connected("only", "only")).toBe(true);
        });
    });

    describe("find", () => {
        it("should return the element itself initially", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            expect(uf.find("a")).toBe("a");
            expect(uf.find("b")).toBe("b");
            expect(uf.find("c")).toBe("c");
        });

        it("should throw error for non-existent element", () => {
            const uf = new UnionFind(["a", "b"]);

            expect(() => uf.find("nonexistent")).toThrow("Element nonexistent not found");
        });

        it("should implement path compression", () => {
            const uf = new UnionFind(["a", "b", "c", "d"]);

            // Create a chain: a -> b -> c -> d
            uf.union("a", "b");
            uf.union("b", "c");
            uf.union("c", "d");

            // After path compression, all should point to same root
            const root = uf.find("a");
            expect(uf.find("b")).toBe(root);
            expect(uf.find("c")).toBe(root);
            expect(uf.find("d")).toBe(root);
        });
    });

    describe("union", () => {
        it("should connect two separate elements", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            expect(uf.connected("a", "b")).toBe(false);
            uf.union("a", "b");
            expect(uf.connected("a", "b")).toBe(true);
            expect(uf.getComponentCount()).toBe(2);
        });

        it("should handle union of already connected elements", () => {
            const uf = new UnionFind(["a", "b"]);

            uf.union("a", "b");
            const countBefore = uf.getComponentCount();

            uf.union("a", "b"); // Union again

            expect(uf.getComponentCount()).toBe(countBefore);
            expect(uf.connected("a", "b")).toBe(true);
        });

        it("should connect components transitively", () => {
            const uf = new UnionFind(["a", "b", "c", "d"]);

            uf.union("a", "b");
            uf.union("c", "d");
            expect(uf.getComponentCount()).toBe(2);

            uf.union("b", "c");
            expect(uf.getComponentCount()).toBe(1);
            expect(uf.connected("a", "d")).toBe(true);
        });

        it("should use union by rank for efficiency", () => {
            const uf = new UnionFind(["a", "b", "c", "d", "e", "f", "g", "h"]);

            // Create two trees of different heights
            uf.union("a", "b");
            uf.union("a", "c");
            uf.union("a", "d"); // Tree 1: height 2

            uf.union("e", "f"); // Tree 2: height 1

            // Union should attach smaller tree to larger tree's root
            uf.union("d", "e");

            // All elements should be connected
            expect(uf.connected("a", "f")).toBe(true);
            expect(uf.getComponentCount()).toBe(3); // g, h still separate
        });
    });

    describe("connected", () => {
        it("should return true for elements in same component", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            uf.union("a", "b");
            expect(uf.connected("a", "b")).toBe(true);
            expect(uf.connected("b", "a")).toBe(true);
        });

        it("should return false for elements in different components", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            uf.union("a", "b");
            expect(uf.connected("a", "c")).toBe(false);
            expect(uf.connected("c", "a")).toBe(false);
        });

        it("should return false for non-existent elements", () => {
            const uf = new UnionFind(["a", "b"]);

            expect(uf.connected("a", "nonexistent")).toBe(false);
            expect(uf.connected("nonexistent", "a")).toBe(false);
        });

        it("should return true for element with itself", () => {
            const uf = new UnionFind(["a"]);

            expect(uf.connected("a", "a")).toBe(true);
        });
    });

    describe("getComponent", () => {
        it("should return all elements in the same component", () => {
            const uf = new UnionFind(["a", "b", "c", "d"]);

            uf.union("a", "b");
            uf.union("b", "c");

            const component = uf.getComponent("a");
            expect(component).toHaveLength(3);
            expect(component).toContain("a");
            expect(component).toContain("b");
            expect(component).toContain("c");
            expect(component).not.toContain("d");
        });

        it("should return single element for isolated component", () => {
            const uf = new UnionFind(["a", "b"]);

            const component = uf.getComponent("a");
            expect(component).toEqual(["a"]);
        });
    });

    describe("getAllComponents", () => {
        it("should return all components as separate arrays", () => {
            const uf = new UnionFind(["a", "b", "c", "d", "e"]);

            uf.union("a", "b");
            uf.union("c", "d");
            // e remains isolated

            const components = uf.getAllComponents();
            expect(components).toHaveLength(3);

            // Find the components by size
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([1, 2, 2]);

            // Check that all elements are included
            const allElements = components.flat().sort();
            expect(allElements).toEqual(["a", "b", "c", "d", "e"]);
        });

        it("should return single component when all connected", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            uf.union("a", "b");
            uf.union("b", "c");

            const components = uf.getAllComponents();
            expect(components).toHaveLength(1);
            expect(components[0]).toHaveLength(3);
        });
    });

    describe("getComponentSize", () => {
        it("should return correct size of component", () => {
            const uf = new UnionFind(["a", "b", "c", "d"]);

            uf.union("a", "b");
            uf.union("b", "c");

            expect(uf.getComponentSize("a")).toBe(3);
            expect(uf.getComponentSize("b")).toBe(3);
            expect(uf.getComponentSize("c")).toBe(3);
            expect(uf.getComponentSize("d")).toBe(1);
        });
    });

    describe("addElement", () => {
        it("should add new element as separate component", () => {
            const uf = new UnionFind(["a", "b"]);

            expect(uf.hasElement("c")).toBe(false);
            uf.addElement("c");
            expect(uf.hasElement("c")).toBe(true);
            expect(uf.size()).toBe(3);
            expect(uf.getComponentCount()).toBe(3);
        });

        it("should not change anything if element already exists", () => {
            const uf = new UnionFind(["a", "b"]);

            const sizeBefore = uf.size();
            const countBefore = uf.getComponentCount();

            uf.addElement("a");

            expect(uf.size()).toBe(sizeBefore);
            expect(uf.getComponentCount()).toBe(countBefore);
        });
    });

    describe("hasElement", () => {
        it("should return true for existing elements", () => {
            const uf = new UnionFind(["a", "b", "c"]);

            expect(uf.hasElement("a")).toBe(true);
            expect(uf.hasElement("b")).toBe(true);
            expect(uf.hasElement("c")).toBe(true);
        });

        it("should return false for non-existing elements", () => {
            const uf = new UnionFind(["a", "b"]);

            expect(uf.hasElement("c")).toBe(false);
            expect(uf.hasElement("nonexistent")).toBe(false);
        });
    });

    describe("stress test", () => {
        it("should handle large number of operations efficiently", () => {
            const elements = Array.from({length: 1000}, (_, i) => i.toString());
            const uf = new UnionFind(elements);

            // Initially all separate
            expect(uf.getComponentCount()).toBe(1000);

            // Union adjacent elements
            for (let i = 0; i < 999; i++) {
                uf.union(i.toString(), (i + 1).toString());
            }

            // Should now have single component
            expect(uf.getComponentCount()).toBe(1);
            expect(uf.connected("0", "999")).toBe(true);

            // Test multiple finds (should be fast due to path compression)
            for (let i = 0; i < 100; i++) {
                const randomElement = Math.floor(Math.random() * 1000).toString();
                expect(uf.find(randomElement)).toBeDefined();
            }
        });
    });

    describe("edge cases", () => {
        it("should handle numeric node IDs", () => {
            const uf = new UnionFind([1, 2, 3]);

            uf.union(1, 2);
            expect(uf.connected(1, 2)).toBe(true);
            expect(uf.connected(2, 3)).toBe(false);
        });

        it("should handle mixed string and number IDs", () => {
            const uf = new UnionFind(["a", 1, "b", 2]);

            uf.union("a", 1);
            uf.union("b", 2);

            expect(uf.connected("a", 1)).toBe(true);
            expect(uf.connected("b", 2)).toBe(true);
            expect(uf.connected("a", "b")).toBe(false);
        });

        it("should handle complex component merging", () => {
            const uf = new UnionFind(["a", "b", "c", "d", "e", "f"]);

            // Create two separate components
            uf.union("a", "b");
            uf.union("b", "c"); // Component 1: {a, b, c}

            uf.union("d", "e");
            uf.union("e", "f"); // Component 2: {d, e, f}

            expect(uf.getComponentCount()).toBe(2);

            // Merge the two components
            uf.union("c", "d");

            expect(uf.getComponentCount()).toBe(1);
            expect(uf.connected("a", "f")).toBe(true);
        });
    });
});
