// Curated Data Structures & Algorithms Library for Elite IDE
// Implementations in Python, C++, Java, and JavaScript

export const ALGORITHM_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'ds', label: 'Data Structures' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'cp', label: 'Competitive Programming' },
  { id: 'math', label: 'Math & Number Theory' }
];

export const ALGORITHMS = [
  // 1. Binary Search Tree (Data Structure)
  {
    id: 'bst',
    title: 'Binary Search Tree (BST)',
    category: 'ds',
    tags: ['Tree', 'Recursion', 'Search', 'Traversal'],
    difficulty: 'Medium',
    timeComplexity: 'O(log N) avg, O(N) worst',
    spaceComplexity: 'O(N)',
    description: 'Complete Binary Search Tree with insert, search, in-order traversal, and deletion operations.',
    code: {
      python: `class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, val):
        if not self.root:
            self.root = Node(val)
            return
        curr = self.root
        while True:
            if val < curr.val:
                if curr.left is None:
                    curr.left = Node(val)
                    break
                curr = curr.left
            else:
                if curr.right is None:
                    curr.right = Node(val)
                    break
                curr = curr.right

    def inorder(self, node, res=None):
        if res is None:
            res = []
        if node:
            self.inorder(node.left, res)
            res.append(node.val)
            self.inorder(node.right, res)
        return res

    def search(self, val):
        curr = self.root
        while curr:
            if curr.val == val:
                return True
            curr = curr.left if val < curr.val else curr.right
        return False

# Demonstration
if __name__ == "__main__":
    bst = BinarySearchTree()
    values = [50, 30, 70, 20, 40, 60, 80]
    print(f"Inserting values: {values}")
    for v in values:
        bst.insert(v)

    print("In-order traversal (Sorted):", bst.inorder(bst.root))
    print("Search 40:", bst.search(40))
    print("Search 99:", bst.search(99))
`,
      cpp: `#include <iostream>
#include <vector>

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

class BinarySearchTree {
public:
    Node* root = nullptr;

    void insert(int val) {
        if (!root) {
            root = new Node(val);
            return;
        }
        Node* curr = root;
        while (true) {
            if (val < curr->val) {
                if (!curr->left) {
                    curr->left = new Node(val);
                    break;
                }
                curr = curr->left;
            } else {
                if (!curr->right) {
                    curr->right = new Node(val);
                    break;
                }
                curr = curr->right;
            }
        }
    }

    void inorder(Node* node, std::vector<int>& res) {
        if (!node) return;
        inorder(node->left, res);
        res.push_back(node->val);
        inorder(node->right, res);
    }

    bool search(int val) {
        Node* curr = root;
        while (curr) {
            if (curr->val == val) return true;
            curr = (val < curr->val) ? curr->left : curr->right;
        }
        return false;
    }
};

int main() {
    BinarySearchTree bst;
    std::vector<int> values = {50, 30, 70, 20, 40, 60, 80};

    std::cout << "Inserting values: ";
    for (int v : values) {
        std::cout << v << " ";
        bst.insert(v);
    }
    std::cout << "\\n";

    std::vector<int> sorted;
    bst.inorder(bst.root, sorted);

    std::cout << "In-order traversal (Sorted): ";
    for (int x : sorted) std::cout << x << " ";
    std::cout << "\\n";

    std::cout << "Search 40: " << (bst.search(40) ? "Found" : "Not Found") << "\\n";
    std::cout << "Search 99: " << (bst.search(99) ? "Found" : "Not Found") << "\\n";

    return 0;
}
`,
      java: `import java.util.*;

class Node {
    int val;
    Node left, right;
    Node(int val) {
        this.val = val;
    }
}

public class Main {
    static Node root = null;

    static void insert(int val) {
        if (root == null) {
            root = new Node(val);
            return;
        }
        Node curr = root;
        while (true) {
            if (val < curr.val) {
                if (curr.left == null) {
                    curr.left = new Node(val);
                    break;
                }
                curr = curr.left;
            } else {
                if (curr.right == null) {
                    curr.right = new Node(val);
                    break;
                }
                curr = curr.right;
            }
        }
    }

    static void inorder(Node node, List<Integer> res) {
        if (node == null) return;
        inorder(node.left, res);
        res.add(node.val);
        inorder(node.right, res);
    }

    static boolean search(int val) {
        Node curr = root;
        while (curr != null) {
            if (curr.val == val) return true;
            curr = (val < curr.val) ? curr.left : curr.right;
        }
        return false;
    }

    public static void main(String[] args) {
        int[] values = {50, 30, 70, 20, 40, 60, 80};
        System.out.println("Inserting elements into BST...");
        for (int v : values) insert(v);

        List<Integer> sorted = new ArrayList<>();
        inorder(root, sorted);

        System.out.println("In-order Traversal: " + sorted);
        System.out.println("Search 40: " + search(40));
        System.out.println("Search 99: " + search(99));
    }
}
`,
      javascript: `class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(val) {
    const newNode = new Node(val);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    let curr = this.root;
    while (true) {
      if (val < curr.val) {
        if (!curr.left) {
          curr.left = newNode;
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = newNode;
          break;
        }
        curr = curr.right;
      }
    }
  }

  inorder(node = this.root, res = []) {
    if (node) {
      this.inorder(node.left, res);
      res.push(node.val);
      this.inorder(node.right, res);
    }
    return res;
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (curr.val === val) return true;
      curr = val < curr.val ? curr.left : curr.right;
    }
    return false;
  }
}

// Run demonstration
const bst = new BinarySearchTree();
[50, 30, 70, 20, 40, 60, 80].forEach(n => bst.insert(n));

console.log("BST In-order Traversal:", bst.inorder());
console.log("Search 40:", bst.search(40));
console.log("Search 99:", bst.search(99));
`
    }
  },

  // 2. QuickSort Algorithm
  {
    id: 'quicksort',
    title: 'QuickSort (Divide & Conquer)',
    category: 'algorithms',
    tags: ['Sorting', 'Divide & Conquer', 'Arrays', 'Recursion'],
    difficulty: 'Medium',
    timeComplexity: 'O(N log N) avg, O(N²) worst',
    spaceComplexity: 'O(log N)',
    description: 'High performance in-place sorting algorithm using Lomuto/Hoare partitioning.',
    code: {
      python: `def quicksort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi - 1)
        quicksort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

if __name__ == "__main__":
    nums = [64, 34, 25, 12, 22, 11, 90, 42, 88, 17]
    print(f"Original Array: {nums}")
    quicksort(nums, 0, len(nums) - 1)
    print(f"Sorted Array:   {nums}")
`,
      cpp: `#include <iostream>
#include <vector>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quicksort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quicksort(arr, low, pi - 1);
        quicksort(arr, pi + 1, high);
    }
}

int main() {
    std::vector<int> nums = {64, 34, 25, 12, 22, 11, 90, 42, 88, 17};
    std::cout << "Original Array: ";
    for (int x : nums) std::cout << x << " ";
    std::cout << "\\n";

    quicksort(nums, 0, nums.size() - 1);

    std::cout << "Sorted Array:   ";
    for (int x : nums) std::cout << x << " ";
    std::cout << "\\n";
    return 0;
}
`,
      java: `import java.util.Arrays;

public class Main {
    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] <= pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }

    static void quicksort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quicksort(arr, low, pi - 1);
            quicksort(arr, pi + 1, high);
        }
    }

    public static void main(String[] args) {
        int[] nums = {64, 34, 25, 12, 22, 11, 90, 42, 88, 17};
        System.out.println("Original: " + Arrays.toString(nums));
        quicksort(nums, 0, nums.length - 1);
        System.out.println("Sorted:   " + Arrays.toString(nums));
    }
}
`,
      javascript: `function quicksort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quicksort(arr, low, pi - 1);
    quicksort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

const nums = [64, 34, 25, 12, 22, 11, 90, 42, 88, 17];
console.log("Original Array:", nums);
quicksort(nums);
console.log("Sorted Array:  ", nums);
`
    }
  },

  // 3. Dijkstra's Shortest Path Algorithm
  {
    id: 'dijkstra',
    title: "Dijkstra's Shortest Path",
    category: 'algorithms',
    tags: ['Graph', 'Shortest Path', 'Greedy', 'Priority Queue'],
    difficulty: 'Hard',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
    description: 'Finds single-source shortest path in a weighted graph with non-negative edge weights using a priority queue.',
    code: {
      python: `import heapq

def dijkstra(graph, start):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]  # (cost, node)

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        if current_dist > distances[current_node]:
            continue

        for neighbor, weight in graph[current_node]:
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))

    return distances

# Example Weighted Directed Graph
graph = {
    'A': [('B', 4), ('C', 2)],
    'B': [('C', 1), ('D', 5)],
    'C': [('D', 8), ('E', 10)],
    'D': [('E', 2)],
    'E': []
}

start_node = 'A'
distances = dijkstra(graph, start_node)
print(f"Shortest distances from node {start_node}:")
for node, dist in distances.items():
    print(f"  To {node}: {dist}")
`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <climits>

using namespace std;

typedef pair<int, int> pii; // {weight, destination}

void dijkstra(int start, const vector<vector<pii>>& adj, int V) {
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    vector<int> dist(V, INT_MAX);

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        int u = pq.top().second;
        int d = pq.top().first;
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.second;
            int weight = edge.first;

            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }

    cout << "Shortest distances from node " << start << ":\\n";
    for (int i = 0; i < V; ++i) {
        cout << "  To " << i << ": " << dist[i] << "\\n";
    }
}

int main() {
    int V = 5;
    vector<vector<pii>> adj(V);

    // Node 0 -> A, 1 -> B, 2 -> C, 3 -> D, 4 -> E
    adj[0].push_back({4, 1}); // 0 -> 1 (wt 4)
    adj[0].push_back({2, 2}); // 0 -> 2 (wt 2)
    adj[1].push_back({1, 2}); // 1 -> 2 (wt 1)
    adj[1].push_back({5, 3}); // 1 -> 3 (wt 5)
    adj[2].push_back({8, 3}); // 2 -> 3 (wt 8)
    adj[2].push_back({10, 4});// 2 -> 4 (wt 10)
    adj[3].push_back({2, 4}); // 3 -> 4 (wt 2)

    dijkstra(0, adj, V);
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    static class Edge {
        int to, weight;
        Edge(int to, int weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    public static void main(String[] args) {
        int V = 5;
        List<List<Edge>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(new Edge(1, 4));
        adj.get(0).add(new Edge(2, 2));
        adj.get(1).add(new Edge(2, 1));
        adj.get(1).add(new Edge(3, 5));
        adj.get(2).add(new Edge(3, 8));
        adj.get(2).add(new Edge(4, 10));
        adj.get(3).add(new Edge(4, 2));

        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[0] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.add(new int[]{0, 0}); // {dist, node}

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int d = curr[0], u = curr[1];
            if (d > dist[u]) continue;

            for (Edge e : adj.get(u)) {
                if (dist[u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[u] + e.weight;
                    pq.add(new int[]{dist[e.to], e.to});
                }
            }
        }

        System.out.println("Shortest distances from source node 0:");
        for (int i = 0; i < V; i++) {
            System.out.println("  Node " + i + ": " + dist[i]);
        }
    }
}
`,
      javascript: `function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  
  for (const node in graph) distances[node] = Infinity;
  distances[start] = 0;

  while (true) {
    let closestNode = null;
    let shortestDist = Infinity;

    for (const node in distances) {
      if (!visited.has(node) && distances[node] < shortestDist) {
        shortestDist = distances[node];
        closestNode = node;
      }
    }

    if (closestNode === null) break;
    visited.add(closestNode);

    for (const neighbor in graph[closestNode]) {
      const weight = graph[closestNode][neighbor];
      const newDist = distances[closestNode] + weight;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
      }
    }
  }

  return distances;
}

const graph = {
  A: { B: 4, C: 2 },
  B: { C: 1, D: 5 },
  C: { D: 8, E: 10 },
  D: { E: 2 },
  E: {}
};

console.log("Dijkstra Shortest Distances from 'A':", dijkstra(graph, 'A'));
`
    }
  },

  // 4. Dynamic Programming - 0/1 Knapsack
  {
    id: 'knapsack',
    title: '0/1 Knapsack Problem (DP)',
    category: 'algorithms',
    tags: ['Dynamic Programming', 'Optimization', 'Arrays'],
    difficulty: 'Medium',
    timeComplexity: 'O(N × W)',
    spaceComplexity: 'O(W)',
    description: 'Classic dynamic programming problem finding maximum value obtainable within weight capacity W.',
    code: {
      python: `def knapsack(weights, values, capacity):
    n = len(values)
    dp = [0] * (capacity + 1)

    for i in range(n):
        w, v = weights[i], values[i]
        # Iterate backwards to use space-optimized 1D array
        for cap in range(capacity, w - 1, -1):
            dp[cap] = max(dp[cap], dp[cap - w] + v)

    return dp[capacity]

weights = [2, 3, 4, 5]
values  = [3, 4, 5, 6]
capacity = 8

max_val = knapsack(weights, values, capacity)
print(f"Weights:  {weights}")
print(f"Values:   {values}")
print(f"Capacity: {capacity}")
print(f"Maximum Total Value: {max_val}")
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

int knapsack(const std::vector<int>& weights, const std::vector<int>& values, int capacity) {
    int n = values.size();
    std::vector<int> dp(capacity + 1, 0);

    for (int i = 0; i < n; i++) {
        int w = weights[i], v = values[i];
        for (int cap = capacity; cap >= w; cap--) {
            dp[cap] = std::max(dp[cap], dp[cap - w] + v);
        }
    }
    return dp[capacity];
}

int main() {
    std::vector<int> weights = {2, 3, 4, 5};
    std::vector<int> values  = {3, 4, 5, 6};
    int capacity = 8;

    int result = knapsack(weights, values, capacity);
    std::cout << "Max Knapsack Value: " << result << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static int knapsack(int[] weights, int[] values, int capacity) {
        int[] dp = new int[capacity + 1];

        for (int i = 0; i < values.length; i++) {
            int w = weights[i], v = values[i];
            for (int cap = capacity; cap >= w; cap--) {
                dp[cap] = Math.max(dp[cap], dp[cap - w] + v);
            }
        }
        return dp[capacity];
    }

    public static void main(String[] args) {
        int[] weights = {2, 3, 4, 5};
        int[] values  = {3, 4, 5, 6};
        int capacity = 8;

        System.out.println("Max Knapsack Value: " + knapsack(weights, values, capacity));
    }
}
`,
      javascript: `function knapsack(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < values.length; i++) {
    const w = weights[i];
    const v = values[i];
    for (let cap = capacity; cap >= w; cap--) {
      dp[cap] = Math.max(dp[cap], dp[cap - w] + v);
    }
  }

  return dp[capacity];
}

const weights = [2, 3, 4, 5];
const values = [3, 4, 5, 6];
const capacity = 8;

console.log("Max Knapsack Value:", knapsack(weights, values, capacity));
`
    }
  },

  // 5. Competitive Programming Starter Template (Fast I/O)
  {
    id: 'cp_starter',
    title: 'Competitive Programming Fast I/O Template',
    category: 'cp',
    tags: ['Competitive Programming', 'Fast I/O', 'Templates', 'Boilerplate'],
    difficulty: 'Easy',
    timeComplexity: 'Optimal',
    spaceComplexity: 'Optimal',
    description: 'High performance competitive programming boilerplate with fast I/O and preconfigured macros.',
    code: {
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <numeric>
#include <string>

using namespace std;

#define FAST_IO ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL);
#define ll long long
#define pb push_back
#define all(x) (x).begin(), (x).end()

void solve(int tc) {
    // Write test case logic here
    int n;
    if (!(cin >> n)) return;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    sort(all(a));
    cout << "Test #" << tc << " Min: " << a.front() << ", Max: " << a.back() << "\\n";
}

int main() {
    FAST_IO;
    int t = 1;
    // cin >> t; // Uncomment if multiple test cases
    for (int i = 1; i <= t; i++) {
        solve(i);
    }
    return 0;
}
`,
      python: `import sys

def solve():
    input = sys.stdin.read
    data = input().split()
    if not data:
        print("Hello from Python CP Template!")
        return

    n = int(data[0])
    nums = [int(x) for x in data[1:n+1]]
    nums.sort()
    print(f"Min: {nums[0]}, Max: {nums[-1]}, Sum: {sum(nums)}")

if __name__ == "__main__":
    solve()
`,
      java: `import java.io.*;
import java.util.*;

public class Main {
    static class FastScanner {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer("");

        String next() {
            while (!st.hasMoreTokens()) {
                try {
                    String line = br.readLine();
                    if (line == null) return null;
                    st = new StringTokenizer(line);
                } catch (IOException e) {
                    return null;
                }
            }
            return st.nextToken();
        }

        int nextInt() {
            String s = next();
            return s != null ? Integer.parseInt(s) : 0;
        }
    }

    public static void main(String[] args) {
        FastScanner fs = new FastScanner();
        PrintWriter out = new PrintWriter(System.out);

        String token = fs.next();
        if (token == null) {
            out.println("Elite IDE Fast I/O Java Starter ready!");
        } else {
            int n = Integer.parseInt(token);
            out.println("Received N: " + n);
        }

        out.flush();
    }
}
`,
      javascript: `// Competitive Programming Starter for Node.js
const fs = require('fs');

function main() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) {
    console.log("Ready for interactive or piped competitive programming input.");
    return;
  }

  const tokens = input.split(/\\s+/);
  console.log("Read", tokens.length, "tokens from stdin.");
}

main();
`
    }
  },

  // 6. Trie (Prefix Tree)
  {
    id: 'trie',
    title: 'Trie (Prefix Tree)',
    category: 'ds',
    tags: ['Trie', 'String', 'Tree', 'Prefix Search'],
    difficulty: 'Medium',
    timeComplexity: 'O(L) per word of length L',
    spaceComplexity: 'O(Total characters)',
    description: 'Tree data structure used to store an associative array where the keys are strings, enabling lightning-fast prefix lookups.',
    code: {
      python: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True

if __name__ == "__main__":
    trie = Trie()
    words = ["apple", "app", "application", "apt", "banana", "band"]
    print(f"Inserting words: {words}")
    for w in words:
        trie.insert(w)

    print("Search 'apple':", trie.search("apple"))
    print("Search 'appl':", trie.search("appl"))
    print("Starts with 'app':", trie.starts_with("app"))
    print("Starts with 'ban':", trie.starts_with("ban"))
    print("Search 'cat':", trie.search("cat"))
`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <string>
#include <vector>

struct TrieNode {
    std::unordered_map<char, TrieNode*> children;
    bool isEnd = false;
};

class Trie {
private:
    TrieNode* root;
public:
    Trie() { root = new TrieNode(); }

    void insert(const std::string& word) {
        TrieNode* curr = root;
        for (char c : word) {
            if (!curr->children.count(c)) {
                curr->children[c] = new TrieNode();
            }
            curr = curr->children[c];
        }
        curr->isEnd = true;
    }

    bool search(const std::string& word) {
        TrieNode* curr = root;
        for (char c : word) {
            if (!curr->children.count(c)) return false;
            curr = curr->children[c];
        }
        return curr->isEnd;
    }

    bool startsWith(const std::string& prefix) {
        TrieNode* curr = root;
        for (char c : prefix) {
            if (!curr->children.count(c)) return false;
            curr = curr->children[c];
        }
        return true;
    }
};

int main() {
    Trie trie;
    std::vector<std::string> words = {"apple", "app", "application", "banana"};
    for (const auto& w : words) trie.insert(w);

    std::cout << "Search 'apple': " << (trie.search("apple") ? "True" : "False") << "\\n";
    std::cout << "Search 'appl': " << (trie.search("appl") ? "True" : "False") << "\\n";
    std::cout << "Starts with 'app': " << (trie.startsWith("app") ? "True" : "False") << "\\n";
    return 0;
}
`,
      java: `import java.util.*;

class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd = false;
}

public class Main {
    static class Trie {
        TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode curr = root;
            for (char c : word.toCharArray()) {
                curr.children.putIfAbsent(c, new TrieNode());
                curr = curr.children.get(c);
            }
            curr.isEnd = true;
        }

        boolean search(String word) {
            TrieNode curr = root;
            for (char c : word.toCharArray()) {
                if (!curr.children.containsKey(c)) return false;
                curr = curr.children.get(c);
            }
            return curr.isEnd;
        }

        boolean startsWith(String prefix) {
            TrieNode curr = root;
            for (char c : prefix.toCharArray()) {
                if (!curr.children.containsKey(c)) return false;
                curr = curr.children.get(c);
            }
            return true;
        }
    }

    public static void main(String[] args) {
        Trie trie = new Trie();
        trie.insert("apple");
        trie.insert("app");
        trie.insert("application");

        System.out.println("Search 'apple': " + trie.search("apple"));
        System.out.println("Search 'appl': " + trie.search("appl"));
        System.out.println("Starts with 'app': " + trie.startsWith("app"));
    }
}
`,
      javascript: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEnd = true;
  }

  search(word) {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEnd;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return true;
  }
}

const trie = new Trie();
["apple", "app", "application", "banana"].forEach(w => trie.insert(w));
console.log("Search 'apple':", trie.search("apple"));
console.log("Search 'appl':", trie.search("appl"));
console.log("Starts with 'app':", trie.startsWith("app"));
`
    }
  }
];
