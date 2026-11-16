import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./vendor-react-CPYPbbnH.js";import{I as r,Jt as i,St as a,Xt as o,Zt as s,_n as c,ft as l,hn as u,i as d,nn as f,on as p,pn as m,q as h,zt as g}from"./vendor-icons-Cnt9RDKQ.js";var _=e(t(),1),v=[{id:`all`,label:`All Templates`},{id:`placement`,label:`🏢 TCS NQT / Placements`},{id:`unilab`,label:`🎓 B.Tech / University Lab`},{id:`ds`,label:`Data Structures`},{id:`algorithms`,label:`Algorithms`},{id:`cp`,label:`Competitive Programming`},{id:`math`,label:`Math & Number Theory`},{id:`jdbc`,label:`☕ JDBC & Database Lab`}],y=[{id:`bst`,title:`Binary Search Tree (BST)`,category:`ds`,tags:[`Tree`,`Recursion`,`Search`,`Traversal`],difficulty:`Medium`,timeComplexity:`O(log N) avg, O(N) worst`,spaceComplexity:`O(N)`,description:`Complete Binary Search Tree with insert, search, in-order traversal, and deletion operations.`,code:{python:`class Node:
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
`,cpp:`#include <iostream>
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
`,java:`import java.util.*;

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
`,javascript:`class Node {
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
`}},{id:`quicksort`,title:`QuickSort (Divide & Conquer)`,category:`algorithms`,tags:[`Sorting`,`Divide & Conquer`,`Arrays`,`Recursion`],difficulty:`Medium`,timeComplexity:`O(N log N) avg, O(N²) worst`,spaceComplexity:`O(log N)`,description:`High performance in-place sorting algorithm using Lomuto/Hoare partitioning.`,code:{python:`def quicksort(arr, low, high):
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
`,cpp:`#include <iostream>
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
`,java:`import java.util.Arrays;

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
`,javascript:`function quicksort(arr, low = 0, high = arr.length - 1) {
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
`}},{id:`dijkstra`,title:`Dijkstra's Shortest Path`,category:`algorithms`,tags:[`Graph`,`Shortest Path`,`Greedy`,`Priority Queue`],difficulty:`Hard`,timeComplexity:`O((V + E) log V)`,spaceComplexity:`O(V + E)`,description:`Finds single-source shortest path in a weighted graph with non-negative edge weights using a priority queue.`,code:{python:`import heapq

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
`,cpp:`#include <iostream>
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
`,java:`import java.util.*;

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
`,javascript:`function dijkstra(graph, start) {
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
`}},{id:`knapsack`,title:`0/1 Knapsack Problem (DP)`,category:`algorithms`,tags:[`Dynamic Programming`,`Optimization`,`Arrays`],difficulty:`Medium`,timeComplexity:`O(N × W)`,spaceComplexity:`O(W)`,description:`Classic dynamic programming problem finding maximum value obtainable within weight capacity W.`,code:{python:`def knapsack(weights, values, capacity):
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
`,cpp:`#include <iostream>
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
`,java:`public class Main {
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
`,javascript:`function knapsack(weights, values, capacity) {
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
`}},{id:`cp_starter`,title:`Competitive Programming Fast I/O Template`,category:`cp`,tags:[`Competitive Programming`,`Fast I/O`,`Templates`,`Boilerplate`],difficulty:`Easy`,timeComplexity:`Optimal`,spaceComplexity:`Optimal`,description:`High performance competitive programming boilerplate with fast I/O and preconfigured macros.`,code:{cpp:`#include <iostream>
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
`,python:`import sys

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
`,java:`import java.io.*;
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
`,javascript:`// Competitive Programming Starter for Node.js
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
`}},{id:`trie`,title:`Trie (Prefix Tree)`,category:`ds`,tags:[`Trie`,`String`,`Tree`,`Prefix Search`],difficulty:`Medium`,timeComplexity:`O(L) per word of length L`,spaceComplexity:`O(Total characters)`,description:`Tree data structure used to store an associative array where the keys are strings, enabling lightning-fast prefix lookups.`,code:{python:`class TrieNode:
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
`,cpp:`#include <iostream>
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
`,java:`import java.util.*;

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
`,javascript:`class TrieNode {
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
`}},{id:`matrix_linalg`,title:`Matrix Computing & Linear Algebra`,category:`math`,tags:[`Matrix`,`Linear Algebra`,`Determinant`,`Inverse`,`Math`],difficulty:`Easy`,timeComplexity:`O(N³) for Matrix Inversion & Multiplication`,spaceComplexity:`O(N²)`,description:`High-speed matrix multiplication, determinants, transposition, eigenvalues, and linear equation solver in MATLAB & NumPy.`,code:{matlab:`% ============================================================================
% Elite IDE - High-Performance MATLAB / Matrix Laboratory Engine
% Linear Algebra, Matrix Multiplication, Determinants & System Solver
% ============================================================================

clc;
clear;

disp('--- 1. Matrix Operations & Multiplication ---');
A = [1, 2, 3; 4, 5, 6; 7, 8, 10];
B = [9, 8, 7; 6, 5, 4; 3, 2, 1];

disp('Matrix A:');
disp(A);
disp('Matrix B:');
disp(B);

C = A * B;
disp('Matrix Product (C = A * B):');
disp(C);

disp('--- 2. Determinant & Transpose ---');
detA = det(A);
disp(['Determinant det(A) = ', num2str(detA)]);

disp('Transpose of A:');
disp(A');

disp('--- 3. Special Matrices & Vector Statistics ---');
I = eye(3);
disp('3x3 Identity Matrix:');
disp(I);

v = [15, 30, 45, 60, 75, 90];
disp(['Sum:  ', num2str(sum(v))]);
disp(['Mean: ', num2str(mean(v))]);
disp(['Max:  ', num2str(max(v))]);
disp(['Min:  ', num2str(min(v))]);

disp('MATLAB Linear Algebra successfully completed! ✨');
`,python:`import numpy as np

# High-Performance Linear Algebra with NumPy
A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 10]], dtype=float)
B = np.array([[9, 8, 7], [6, 5, 4], [3, 2, 1]], dtype=float)

print("--- 1. Matrix Multiplication ---")
C = np.dot(A, B)
print("Product C = A * B:
", C)

print("
--- 2. Determinant & Transpose ---")
print("det(A) =", np.linalg.det(A))
print("Transpose of A:
", A.T)

print("
--- 3. Solving Linear System A * x = b ---")
b = np.array([14, 32, 53], dtype=float)
x = np.linalg.solve(A, b)
print("Solution vector x:
", x)
print("Verification (A * x):
", np.dot(A, x))
`,cpp:`#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> A = {{1, 2}, {3, 4}};
    std::vector<std::vector<int>> B = {{5, 6}, {7, 8}};
    std::vector<std::vector<int>> C(2, std::vector<int>(2, 0));

    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            for (int k = 0; k < 2; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    std::cout << "Matrix Product (A * B):
";
    for (int i = 0; i < 2; i++) {
        std::cout << "  [" << C[i][0] << ", " << C[i][1] << "]
";
    }

    int detA = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    std::cout << "det(A) = " << detA << "
";
    return 0;
}
`,javascript:`// Matrix Multiplication & Determinant in JavaScript
const A = [[1, 2], [3, 4]];
const B = [[5, 6], [7, 8]];

const C = [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]
];

console.log("Matrix Product (A * B):", C);
const detA = A[0][0] * A[1][1] - A[0][1] * A[1][0];
console.log("det(A) =", detA);
`}},{id:`jdbc-crud`,title:`JDBC Complete CRUD Operations (Lab Practical 1)`,category:`jdbc`,tags:[`JDBC`,`Database`,`CRUD`,`Java`,`SQL`],difficulty:`Medium`,timeComplexity:`O(1) connection, O(N) queries`,spaceComplexity:`O(N)`,description:`Complete University B.Tech Java Practical: Registering Driver, Connection establishment, Table Creation, Insertion, Updating, Deletion, and Select Query with ResultSet traversal.`,code:{java:`import java.sql.*;

public class Main {
    public static void main(String[] args) {
        try {
            // 1. Register JDBC Driver & Establish In-Memory Connection
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("Connecting to Database...");
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/college_db", "root", "admin");
            System.out.println("Connection established successfully!\\n");

            // 2. Create Student Table
            Statement stmt = con.createStatement();
            stmt.executeUpdate("DROP TABLE IF EXISTS students");
            stmt.executeUpdate("CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(50), branch VARCHAR(20), marks DOUBLE)");
            System.out.println("Table 'students' created successfully.");

            // 3. Insert Records using PreparedStatement
            String insertQuery = "INSERT INTO students VALUES (?, ?, ?, ?)";
            PreparedStatement pstmt = con.prepareStatement(insertQuery);

            pstmt.setInt(1, 101);
            pstmt.setString(2, "Gowri Narayana");
            pstmt.setString(3, "CSE");
            pstmt.setDouble(4, 95.5);
            pstmt.executeUpdate();

            pstmt.setInt(1, 102);
            pstmt.setString(2, "Sneha Reddy");
            pstmt.setString(3, "ECE");
            pstmt.setDouble(4, 88.0);
            pstmt.executeUpdate();

            pstmt.setInt(1, 103);
            pstmt.setString(2, "Aditya Varma");
            pstmt.setString(3, "AI & ML");
            pstmt.setDouble(4, 92.0);
            pstmt.executeUpdate();
            System.out.println("3 Student Records inserted into Database.\\n");

            // 4. Update a Record
            stmt.executeUpdate("UPDATE students SET marks = 96.0 WHERE id = 101");
            System.out.println("Updated marks for student ID 101 to 96.0.\\n");

            // 5. Query & Display Data
            System.out.println("================ STUDENT DATABASE RECORDS ================");
            System.out.printf("%-6s %-18s %-12s %-8s\\n", "ROLL", "STUDENT NAME", "BRANCH", "MARKS");
            System.out.println("----------------------------------------------------------");

            ResultSet rs = stmt.executeQuery("SELECT * FROM students");
            while (rs.next()) {
                System.out.printf("%-6d %-18s %-12s %-8.1f\\n",
                    rs.getInt("id"),
                    rs.getString("name"),
                    rs.getString("branch"),
                    rs.getDouble("marks")
                );
            }
            System.out.println("==========================================================\\n");

            // 6. Delete a Record
            stmt.executeUpdate("DELETE FROM students WHERE id = 102");
            System.out.println("Deleted student ID 102.\\n");

            rs.close();
            stmt.close();
            con.close();
            System.out.println("Database connection closed gracefully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`,python:`# Python SQLite equivalent for comparison
import sqlite3

con = sqlite3.connect(':memory:')
cur = con.cursor()
cur.execute("CREATE TABLE students (id INT PRIMARY KEY, name TEXT, branch TEXT, marks REAL)")
cur.execute("INSERT INTO students VALUES (101, 'Gowri Narayana', 'CSE', 95.5)")
cur.execute("INSERT INTO students VALUES (102, 'Sneha Reddy', 'ECE', 88.0)")
con.commit()

cur.execute("SELECT * FROM students")
for row in cur.fetchall():
    print(row)
con.close()
`,cpp:`// C++ SQLite demonstration
#include <iostream>
int main() {
    std::cout << "JDBC is a Java-specific database connectivity API standard.\\n";
    std::cout << "Switch to Java or Java (JDBC Database) to run this program.\\n";
    return 0;
}
`,javascript:`// Node.js Database Equivalent
console.log("In JavaScript/Node, use pg or mysql2 driver for equivalent connectivity.");
`}},{id:`jdbc-prepared`,title:`JDBC PreparedStatement & Dynamic Queries (Lab Practical 2)`,category:`jdbc`,tags:[`JDBC`,`PreparedStatement`,`SQL Injection Guard`,`Batch`],difficulty:`Easy`,timeComplexity:`O(1) per statement`,spaceComplexity:`O(N)`,description:`Safe parameterized SQL execution preventing SQL injection attacks, binding dynamic variables, and retrieving filtered records.`,code:{java:`import java.sql.*;

public class Main {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/college_db", "root", "admin");

            Statement stmt = con.createStatement();
            stmt.executeUpdate("CREATE TABLE courses (course_id INT, title VARCHAR(50), credits INT)");

            // PreparedStatement for parameterized insertion
            String insertSql = "INSERT INTO courses VALUES (?, ?, ?)";
            PreparedStatement pstmt = con.prepareStatement(insertSql);

            Object[][] courseData = {
                {101, "Data Structures & Algorithms", 4},
                {102, "Database Management Systems", 4},
                {103, "Web Development & Cloud", 3},
                {104, "Operating Systems", 3}
            };

            for (Object[] c : courseData) {
                pstmt.setInt(1, (Integer) c[0]);
                pstmt.setString(2, (String) c[1]);
                pstmt.setInt(3, (Integer) c[2]);
                pstmt.executeUpdate();
            }

            System.out.println("Courses batch successfully inserted via PreparedStatement!\\n");

            // Query with Filter Parameter
            String searchSql = "SELECT * FROM courses WHERE credits >= ?";
            PreparedStatement searchStmt = con.prepareStatement(searchSql);
            searchStmt.setInt(1, 4);

            System.out.println("Courses with 4 or more credits:");
            System.out.println("----------------------------------------");
            ResultSet rs = searchStmt.executeQuery();
            while (rs.next()) {
                System.out.println(rs.getInt(1) + ": " + rs.getString(2) + " (" + rs.getInt(3) + " credits)");
            }

            con.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`,python:`# Python Parameterized Query
import sqlite3
con = sqlite3.connect(':memory:')
cur = con.cursor()
cur.execute("CREATE TABLE courses (course_id INT, title TEXT, credits INT)")
cur.executemany("INSERT INTO courses VALUES (?, ?, ?)", [
    (101, "Data Structures", 4),
    (102, "DBMS", 4)
])
for row in cur.execute("SELECT * FROM courses WHERE credits >= ?", (4,)):
    print(row)
`,cpp:`// C++ Parameterized query reference
#include <iostream>
int main() {
    std::cout << "Switch to Java to run PreparedStatement code.\\n";
    return 0;
}
`,javascript:`// Node.js Parameterized query reference
console.log("Use parameterized placeholders (?, ?) in DB queries to prevent SQL injection.");
`}},{id:`jdbc-transaction`,title:`JDBC Transaction Management (Commit & Rollback)`,category:`jdbc`,tags:[`JDBC`,`Transaction`,`Commit`,`Rollback`,`ACID`],difficulty:`Hard`,timeComplexity:`O(1) transaction block`,spaceComplexity:`O(1)`,description:`Demonstrating ACID transaction safety in Java: disabling auto-commit, executing multi-step balance transfer, and rolling back safely if an error occurs.`,code:{java:`import java.sql.*;

public class Main {
    public static void main(String[] args) {
        Connection con = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            con = DriverManager.getConnection("jdbc:mysql://localhost:3306/bank_db", "root", "admin");

            // 1. Disable Auto-Commit for Transaction Atomicity
            con.setAutoCommit(false);
            System.out.println("Auto-commit disabled. Transaction block started.\\n");

            Statement stmt = con.createStatement();
            stmt.executeUpdate("CREATE TABLE accounts (acc_no INT, holder VARCHAR(50), balance DOUBLE)");
            stmt.executeUpdate("INSERT INTO accounts VALUES (1001, 'Gowri Narayana', 15000.0)");
            stmt.executeUpdate("INSERT INTO accounts VALUES (1002, 'Siddharth', 5000.0)");

            // 2. Perform Fund Transfer ($2,000 from 1001 to 1002)
            double transferAmount = 2000.0;
            System.out.println("Transferring $" + transferAmount + " from Account 1001 to 1002...");

            stmt.executeUpdate("UPDATE accounts SET balance = balance - " + transferAmount + " WHERE acc_no = 1001");
            stmt.executeUpdate("UPDATE accounts SET balance = balance + " + transferAmount + " WHERE acc_no = 1002");

            // 3. Commit the transaction
            con.commit();
            System.out.println("Transaction committed successfully! Both accounts updated.\\n");

            // 4. Display Final Balances
            System.out.println("Account Status:");
            ResultSet rs = stmt.executeQuery("SELECT * FROM accounts");
            while (rs.next()) {
                System.out.printf("Acc: %d | Holder: %-15s | Balance: $%.2f\\n",
                    rs.getInt("acc_no"),
                    rs.getString("holder"),
                    rs.getDouble("balance")
                );
            }

            con.close();
        } catch (Exception e) {
            System.err.println("Transaction failed: " + e.getMessage());
            try {
                if (con != null) {
                    con.rollback();
                    System.err.println("Transaction rolled back successfully. Database returned to safe state.");
                }
            } catch (SQLException se) {
                se.printStackTrace();
            }
        }
    }
}
`,python:`# Python SQLite Transaction Demo
import sqlite3
con = sqlite3.connect(':memory:')
cur = con.cursor()
cur.execute("CREATE TABLE accounts (acc_no INT, holder TEXT, balance REAL)")
cur.execute("INSERT INTO accounts VALUES (1001, 'Gowri', 15000.0)")
cur.execute("INSERT INTO accounts VALUES (1002, 'Siddharth', 5000.0)")
con.commit()
print("Transaction committed.")
`,cpp:`// C++ Transaction Reference
#include <iostream>
int main() {
    std::cout << "Switch to Java to execute JDBC Transaction Management.\\n";
    return 0;
}
`,javascript:`// JavaScript Transaction Reference
console.log("Transactions ensure ACID properties in relational databases.");
`}},{id:`tcs_kadane_max_subarray`,title:`Kadane's Max Subarray (TCS NQT / Infosys)`,category:`placement`,tags:[`TCS NQT`,`Array`,`DP`,`Placement`],difficulty:`Easy`,timeComplexity:`O(N)`,spaceComplexity:`O(1)`,description:`Most asked TCS NQT & Infosys coding problem: find maximum contiguous subarray sum in linear O(N) time.`,code:{python:`# TCS NQT / Placement Classic: Kadane's Algorithm
nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
max_sum = nums[0]
curr_sum = 0

for x in nums:
    curr_sum = max(x, curr_sum + x)
    max_sum = max(max_sum, curr_sum)

print("Array:", nums)
print("Maximum Subarray Sum:", max_sum)
`,cpp:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int maxSum = nums[0], currSum = 0;
    for (int x : nums) {
        currSum = max(x, currSum + x);
        maxSum = max(maxSum, currSum);
    }
    cout << "Maximum Subarray Sum: " << maxSum << endl;
    return 0;
}
`,java:`public class Main {
    public static void main(String[] args) {
        int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        int maxSum = nums[0], currSum = 0;
        for (int x : nums) {
            currSum = Math.max(x, currSum + x);
            maxSum = Math.max(maxSum, currSum);
        }
        System.out.println("Maximum Subarray Sum: " + maxSum);
    }
}
`,javascript:`const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
let maxSum = nums[0], currSum = 0;
for (const x of nums) {
  currSum = Math.max(x, currSum + x);
  maxSum = Math.max(maxSum, currSum);
}
console.log("Maximum Subarray Sum:", maxSum);
`}},{id:`wipro_two_sum_hash`,title:`Two Sum Optimal HashMap (Wipro / Accenture)`,category:`placement`,tags:[`Wipro`,`HashMap`,`Array`,`Interview`],difficulty:`Easy`,timeComplexity:`O(N)`,spaceComplexity:`O(N)`,description:`Return indices of two numbers adding to target using HashMap lookup in O(N) instead of O(N^2).`,code:{python:`nums = [2, 7, 11, 15]
target = 9
seen = {}

for i, num in enumerate(nums):
    need = target - num
    if need in seen:
        print(f"Pair indices: [{seen[need]}, {i}] -> ({nums[seen[need]]} + {num} = {target})")
        break
    seen[num] = i
`,cpp:`#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) {
            cout << "Indices: " << seen[need] << ", " << i << endl;
            break;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`,java:`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (map.containsKey(need)) {
                System.out.println("Indices: " + map.get(need) + ", " + i);
                break;
            }
            map.put(nums[i], i);
        }
    }
}
`,javascript:`const nums = [2, 7, 11, 15], target = 9;
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log("Indices:", seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
`}},{id:`unilab_circular_queue`,title:`Circular Queue Lab Program (JNTU / VTU / Anna Univ)`,category:`unilab`,tags:[`DS Lab`,`Queue`,`JNTU`,`VTU`],difficulty:`Medium`,timeComplexity:`O(1) enqueue/dequeue`,spaceComplexity:`O(N)`,description:`Standard B.Tech Data Structures Lab Circular Queue implementation with modulo wrap-around & overflow checks.`,code:{python:`class CircularQueue:
    def __init__(self, cap):
        self.cap = cap
        self.q = [None] * cap
        self.front = self.rear = -1

    def enqueue(self, val):
        if (self.rear + 1) % self.cap == self.front:
            print("Queue Overflow!")
            return
        if self.front == -1:
            self.front = 0
        self.rear = (self.rear + 1) % self.cap
        self.q[self.rear] = val
        print(f"Enqueued {val}")

    def dequeue(self):
        if self.front == -1:
            print("Queue Underflow!")
            return None
        val = self.q[self.front]
        if self.front == self.rear:
            self.front = self.rear = -1
        else:
            self.front = (self.front + 1) % self.cap
        print(f"Dequeued {val}")
        return val

cq = CircularQueue(4)
cq.enqueue(10)
cq.enqueue(20)
cq.enqueue(30)
cq.dequeue()
cq.enqueue(40)
cq.enqueue(50)
`,cpp:`#include <iostream>
using namespace std;

class CircularQueue {
    int arr[5], front = -1, rear = -1, cap = 5;
public:
    void enqueue(int v) {
        if ((rear + 1) % cap == front) { cout << "Overflow\\n"; return; }
        if (front == -1) front = 0;
        rear = (rear + 1) % cap;
        arr[rear] = v;
        cout << "Enqueued " << v << "\\n";
    }
    void dequeue() {
        if (front == -1) { cout << "Underflow\\n"; return; }
        cout << "Dequeued " << arr[front] << "\\n";
        if (front == rear) front = rear = -1;
        else front = (front + 1) % cap;
    }
};

int main() {
    CircularQueue cq;
    cq.enqueue(10); cq.enqueue(20); cq.enqueue(30);
    cq.dequeue(); cq.enqueue(40);
    return 0;
}
`,java:`public class Main {
    static int[] q = new int[5];
    static int front = -1, rear = -1, cap = 5;
    static void enqueue(int v) {
        if ((rear + 1) % cap == front) { System.out.println("Overflow"); return; }
        if (front == -1) front = 0;
        rear = (rear + 1) % cap;
        q[rear] = v;
        System.out.println("Enqueued " + v);
    }
    static void dequeue() {
        if (front == -1) { System.out.println("Underflow"); return; }
        System.out.println("Dequeued " + q[front]);
        if (front == rear) front = rear = -1;
        else front = (front + 1) % cap;
    }
    public static void main(String[] args) {
        enqueue(10); enqueue(20); enqueue(30);
        dequeue(); enqueue(40);
    }
}
`,javascript:`class CircularQueue {
  constructor(cap = 5) { this.cap = cap; this.q = new Array(cap); this.front = -1; this.rear = -1; }
  enqueue(v) {
    if ((this.rear + 1) % this.cap === this.front) return console.log("Overflow");
    if (this.front === -1) this.front = 0;
    this.rear = (this.rear + 1) % this.cap;
    this.q[this.rear] = v;
    console.log("Enqueued", v);
  }
  dequeue() {
    if (this.front === -1) return console.log("Underflow");
    console.log("Dequeued", this.q[this.front]);
    if (this.front === this.rear) this.front = this.rear = -1;
    else this.front = (this.front + 1) % this.cap;
  }
}
const cq = new CircularQueue(4);
cq.enqueue(10); cq.enqueue(20); cq.dequeue(); cq.enqueue(30);
`}}],b=n();function x({isOpen:e,onClose:t,onOpenInNewTab:n,onLoadIntoCurrent:x,currentLanguage:S=`python`}){let[C,w]=(0,_.useState)(``),[T,E]=(0,_.useState)(`all`),[D,O]=(0,_.useState)(y[0]?.id||`bst`),[k,A]=(0,_.useState)(`list`),[j,M]=(0,_.useState)(()=>[`python`,`cpp`,`java`,`javascript`,`matlab`].includes(S)?S:S===`octave`?`matlab`:`python`),[N,P]=(0,_.useState)(!1),F=(0,_.useMemo)(()=>y.filter(e=>{let t=T===`all`||e.category===T,n=C.toLowerCase().trim(),r=!n||e.title.toLowerCase().includes(n)||e.description.toLowerCase().includes(n)||e.tags.some(e=>e.toLowerCase().includes(n));return t&&r}),[C,T]),I=(0,_.useMemo)(()=>y.find(e=>e.id===D)||F[0]||y[0],[D,F]),L=I?.code?.[j]||I?.code?.python||I?.code?.cpp||I?.code?.matlab||``,R=(0,_.useMemo)(()=>L?L.split(`
`):[],[L]),z=()=>{L&&(navigator.clipboard.writeText(L),P(!0),setTimeout(()=>P(!1),1500))};return e?(0,b.jsx)(`div`,{className:`modal-backdrop algo-backdrop`,onClick:t,role:`dialog`,"aria-modal":`true`,children:(0,b.jsxs)(`div`,{className:`algorithm-modal-card mobile-active-${k}`,onClick:e=>e.stopPropagation(),children:[(0,b.jsxs)(`div`,{className:`algo-modal-header ${k===`preview`?`mobile-preview-header`:``}`,children:[(0,b.jsxs)(`div`,{className:`algo-header-left`,children:[(0,b.jsxs)(`button`,{type:`button`,className:`algo-mobile-back-header-btn`,onClick:()=>A(`list`),"aria-label":`Back to Algorithm list`,children:[(0,b.jsx)(c,{size:16}),(0,b.jsx)(`span`,{children:`Back`})]}),(0,b.jsxs)(`div`,{className:`algo-modal-title`,children:[(0,b.jsx)(m,{size:20,className:`algo-brand-icon`}),(0,b.jsxs)(`div`,{children:[(0,b.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,b.jsx)(`h3`,{children:k===`preview`?I?.title||`Code Preview`:`Algorithm Library`}),(0,b.jsx)(`span`,{className:`algo-count-badge`,children:k===`preview`?I?.difficulty:`${F.length} Templates`})]}),(0,b.jsx)(`p`,{className:`algo-modal-subtitle`,children:k===`preview`?`Time: ${I?.timeComplexity||`O(N)`} • Space: ${I?.spaceComplexity||`O(1)`}`:`Curated, ready-to-run DSA implementations across Python, C++, Java, JS & MATLAB`})]})]})]}),(0,b.jsx)(`button`,{className:`algo-close-btn`,onClick:t,title:`Close Library (Esc)`,"aria-label":`Close Modal`,children:(0,b.jsx)(d,{size:18})})]}),(0,b.jsxs)(`div`,{className:`algo-filter-bar ${k===`preview`?`mobile-hide-filter`:``}`,children:[(0,b.jsxs)(`div`,{className:`algo-search-input-wrap`,children:[(0,b.jsx)(r,{size:16,className:`search-icon`}),(0,b.jsx)(`input`,{type:`text`,className:`algo-search-input`,placeholder:`Search algorithms, data structures, trees, graphs, sorting...`,value:C,onChange:e=>w(e.target.value),autoFocus:k===`list`}),C&&(0,b.jsx)(`button`,{className:`clear-search-btn`,onClick:()=>w(``),"aria-label":`Clear Search`,children:(0,b.jsx)(d,{size:14})})]}),(0,b.jsx)(`div`,{className:`algo-category-tabs`,children:v.map(e=>(0,b.jsx)(`button`,{className:`algo-cat-pill ${T===e.id?`active`:``}`,onClick:()=>E(e.id),children:e.label},e.id))})]}),(0,b.jsxs)(`div`,{className:`algo-mobile-view-tabs`,role:`tablist`,children:[(0,b.jsxs)(`button`,{type:`button`,role:`tab`,"aria-selected":k===`list`,className:`algo-mobile-tab-btn ${k===`list`?`active`:``}`,onClick:()=>A(`list`),children:[(0,b.jsx)(l,{size:14}),(0,b.jsxs)(`span`,{children:[`Browse Algorithms (`,F.length,`)`]})]}),(0,b.jsxs)(`button`,{type:`button`,role:`tab`,"aria-selected":k===`preview`,className:`algo-mobile-tab-btn ${k===`preview`?`active`:``}`,onClick:()=>A(`preview`),children:[(0,b.jsx)(g,{size:14}),(0,b.jsxs)(`span`,{children:[`Code Preview `,I?`• ${I.title.split(` `)[0]}`:``]})]})]}),(0,b.jsxs)(`div`,{className:`algo-modal-body mobile-view-${k}`,children:[(0,b.jsx)(`div`,{className:`algo-list-column ${k===`list`?`mobile-visible`:`mobile-hidden`}`,children:F.length===0?(0,b.jsxs)(`div`,{className:`algo-empty-state`,children:[(0,b.jsxs)(`p`,{children:[`No algorithms found matching "`,C,`"`]}),(0,b.jsx)(`button`,{className:`reset-filter-link`,onClick:()=>{w(``),E(`all`)},children:`Reset filters`})]}):F.map(e=>{let t=I?.id===e.id;return(0,b.jsxs)(`div`,{className:`algo-item-card ${t?`selected`:``}`,onClick:()=>{O(e.id),A(`preview`)},children:[(0,b.jsxs)(`div`,{className:`algo-item-top`,children:[(0,b.jsx)(`span`,{className:`algo-item-name`,children:e.title}),(0,b.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,b.jsx)(`span`,{className:`difficulty-badge ${e.difficulty.toLowerCase()}`,children:e.difficulty}),(0,b.jsx)(f,{size:14,className:`algo-arrow-icon`})]})]}),(0,b.jsx)(`p`,{className:`algo-item-desc`,children:e.description}),(0,b.jsxs)(`div`,{className:`algo-card-complexity-strip`,children:[(0,b.jsxs)(`span`,{className:`complexity-badge-mini`,children:[(0,b.jsx)(s,{size:11}),` `,e.timeComplexity]}),(0,b.jsxs)(`span`,{className:`complexity-badge-mini`,children:[(0,b.jsx)(a,{size:11}),` `,e.spaceComplexity]})]}),(0,b.jsx)(`div`,{className:`algo-item-tags`,children:e.tags.slice(0,3).map(e=>(0,b.jsxs)(`span`,{className:`algo-tag`,children:[`#`,e]},e))})]},e.id)})}),I&&(0,b.jsxs)(`div`,{className:`algo-detail-column ${k===`preview`?`mobile-visible`:`mobile-hidden`}`,children:[(0,b.jsxs)(`div`,{className:`algo-detail-header`,children:[(0,b.jsxs)(`div`,{className:`algo-detail-meta`,children:[(0,b.jsx)(`h4`,{className:`algo-detail-title`,children:I.title}),(0,b.jsxs)(`div`,{className:`algo-complexity-row`,children:[(0,b.jsxs)(`span`,{className:`complexity-badge`,children:[(0,b.jsx)(s,{size:12}),`Time: `,I.timeComplexity]}),(0,b.jsxs)(`span`,{className:`complexity-badge`,children:[(0,b.jsx)(a,{size:12}),`Space: `,I.spaceComplexity]})]})]}),(0,b.jsx)(`div`,{className:`algo-lang-pills`,children:[`python`,`cpp`,`java`,`javascript`,`matlab`].map(e=>(0,b.jsx)(`button`,{className:`lang-pill-btn ${j===e?`active`:``}`,onClick:()=>M(e),children:e===`python`?`Python`:e===`cpp`?`C++`:e===`java`?`Java`:e===`javascript`?`JavaScript`:`MATLAB`},e))})]}),(0,b.jsxs)(`div`,{className:`algo-code-preview-wrap`,children:[(0,b.jsxs)(`div`,{className:`algo-code-header-bar`,children:[(0,b.jsxs)(`span`,{className:`algo-code-lang-label`,children:[(0,b.jsx)(o,{size:13}),(0,b.jsxs)(`span`,{children:[j.toUpperCase(),` IMPLEMENTATION`]})]}),(0,b.jsxs)(`button`,{className:`algo-copy-icon-btn`,onClick:z,title:`Copy Code`,children:[N?(0,b.jsx)(p,{size:13,className:`text-emerald-400`}):(0,b.jsx)(i,{size:13}),(0,b.jsx)(`span`,{children:N?`Copied`:`Copy`})]})]}),(0,b.jsx)(`div`,{className:`algo-code-lines-container`,children:R.map((e,t)=>(0,b.jsxs)(`div`,{className:`algo-code-row`,children:[(0,b.jsx)(`span`,{className:`algo-line-number`,children:t+1}),(0,b.jsx)(`span`,{className:`algo-line-text`,children:e||` `})]},t))})]}),(0,b.jsxs)(`div`,{className:`algo-detail-footer`,children:[(0,b.jsxs)(`button`,{className:`algo-copy-btn`,onClick:z,title:`Copy Code Snippet`,children:[N?(0,b.jsx)(p,{size:14,className:`text-emerald-400`}):(0,b.jsx)(i,{size:14}),(0,b.jsx)(`span`,{children:N?`Copied to Clipboard!`:`Copy Code`})]}),(0,b.jsxs)(`div`,{className:`algo-cta-group`,children:[(0,b.jsxs)(`button`,{className:`algo-load-btn secondary`,onClick:()=>{x&&I&&(x(L,j),t())},title:`Replace editor with this algorithm`,children:[(0,b.jsx)(u,{size:14}),(0,b.jsx)(`span`,{children:`Load to File`})]}),(0,b.jsxs)(`button`,{className:`algo-load-btn primary`,onClick:()=>{if(n&&I){let e=j===`python`?`py`:j===`cpp`?`cpp`:j===`java`?`java`:j===`matlab`?`m`:`js`;n(`${I.id}_demo.${e}`,L,j),t()}},title:`Create new tab with this algorithm`,children:[(0,b.jsx)(h,{size:14}),(0,b.jsx)(`span`,{children:`Open New Tab`})]})]})]})]})]})]})}):null}export{x as default};