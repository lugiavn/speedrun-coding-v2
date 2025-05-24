from django.db import migrations
import json


def create_initial_problems(apps, schema_editor):
    Problem = apps.get_model('api', 'Problem')
    
    # Example 1: Quicksort
    Problem.objects.create(
        title='Inplace sort with Quick Sort',
        slug='inplace-sort-with-quick-sort',
        enabled=True,
        description_md="""Sort an array in place.

Quicksort is a divide-and-conquer algorithm. It works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot.
Then we recursively sort the sub-array bellow the pivot and the sub-array above the pivot. Once recursion finished, the whole array has been sorted in place.

Time complexity is O(nlogn) average, but O(n^2) worst case.

Reference: [https://en.wikipedia.org/wiki/Quicksort](https://en.wikipedia.org/wiki/Quicksort)""",
        tags=['divide-and-conquer', 'sorting'],
        difficulty="Easy",
        time_thresholds=[
            {"max_minutes": 3, "rank": "Wizard"},
            {"max_minutes": 5, "rank": "Senior Engineer"},
            {"max_minutes": 10, "rank": "Midlevel Engineer"},
            {"max_minutes": 15, "rank": "New Grad"},
            {"max_minutes": 999999, "rank": "Slow Poke"}
        ],
        solution_templates={
            'python': """class Solution:
  def sort(self, values):
    pass
""",
            'cpp': """
#include <vector>
#include <algorithm>

class Solution {
public:
    void sort(std::vector<int>& values) {
    }
};
"""
        },
        reference_solutions={
            'cpp': """
#include <vector>
#include <algorithm>

class Solution {
public:
    void quicksort(std::vector<int>& values, int startIndex, int endIndex) {
        if (startIndex >= endIndex) return;
        int i = startIndex;
        int j = endIndex;
        int pivot = values[i];

        while (true) {
            if (i >= j) break;

            if (pivot == values[i]) {
                if (values[j] < pivot) {
                    std::swap(values[i], values[j]);
                } else {
                    --j;
                }
                continue;
            }

            if (pivot == values[j]) {
                if (values[i] >= pivot) {
                    std::swap(values[i], values[j]);
                } else {
                    ++i;
                }
                continue;
            }
        }

        quicksort(values, startIndex, i - 1);
        quicksort(values, i + 1, endIndex);
    }

    void sort(std::vector<int>& values) {
        quicksort(values, 0, static_cast<int>(values.size()) - 1);
    }
};
""",
            'python': """class Solution:
  
  def quicksort(self, values, startIndex, endIndex):
    if startIndex >= endIndex:
      return
    
    i = startIndex
    j = endIndex
    pivot = values[i]
    
    while True:
      if i >= j: break
      
      if pivot == values[i]:
        if values[j] < pivot:
          values[i], values[j] = values[j], values[i]
        else:
          j -= 1
        continue
        
      if pivot == values[j]:
        if values[i] >= pivot:
          values[i], values[j] = values[j], values[i]
        else:
          i += 1
        continue
        
    self.quicksort(values, startIndex, i - 1)
    self.quicksort(values, i + 1, endIndex)
          
  
  def sort(self, values):
    return self.quicksort(values, 0, len(values) - 1)
"""
        },
        harness_eval_files=[
            {
                'filename': 'eval_submission_codes.cpp',
                'lang': 'cpp',
                'content': """
#include <iostream>
#include <vector>
#include <numeric>   // for std::iota
#include <algorithm> // for std::shuffle, std::sort
#include <random>
#include "submission_codes.cpp"

int main() {
    // generate [0..19]
    std::vector<int> inputs(20);
    std::iota(inputs.begin(), inputs.end(), 0);

    // shuffle
    std::random_device rd;
    std::mt19937 gen(rd());
    std::shuffle(inputs.begin(), inputs.end(), gen);

    // expected solution
    std::vector<int> solutions = inputs;
    std::sort(solutions.begin(), solutions.end());

    // run your quicksort
    std::vector<int> values = inputs;
    Solution sol;
    sol.sort(values);

    // compare & print
    if (values == solutions) {
        std::cout << "Correct\\n";
    } else {
        std::cout << "Incorrect\\n";
        std::cout << "Input ";
        for (auto x : inputs) std::cout << x << ' ';
        std::cout << "\\nExpected solution ";
        for (auto x : solutions) std::cout << x << ' ';
        std::cout << "\\nYour ";
        for (auto x : values) std::cout << x << ' ';
        std::cout << "\\n";
    }

    return 0;
}
"""
            }, {
                'filename': 'eval_submission_codes.py',
                'lang': 'python',
                'content': """import submission_codes
import random

if __name__ == '__main__':
  inputs = list(range(20))
  random.shuffle(inputs)
  solutions = sorted(inputs)
  
  values = [i for i in inputs]
  sol = submission_codes.Solution()
  sol.sort(values)
  
  if values == solutions:
    print('Correct')
  else:
    print('Incorrect')
    print('Input', inputs)
    print('Expected solution', solutions)
    print('Your', values)
"""
            }
        ]
    )
    
    # Example 2: DFS
    Problem.objects.create(
        title='Search for paths with Depth First Search DFS',
        slug='search-for-paths-with-depth-first-search-dfs',
        enabled=False,
        description_md="""Using DFS algorithm to find paths in a graph

Input:

edges is an array of tuple of (node1, node2, distance) representing the graph, edge is 1 direction only from node1 to node2

starting node and ending nodes (here a node is a string).

Output: 2 numbers: the number of path between start node and ending node, and the length of the longest path

A valid path does not visit the same node more than once.

Example:

edges = [('a', 'b', 3), ('b', 'c', 4), ('a', 'c', 11)], starting node 'a', ending node 'c'
Output: (2, 11)""",
        tags=['graph', 'dfs', 'depth-first-search'],
        difficulty="Medium",
        time_thresholds=[
            {"max_minutes": 2, "rank": "Wizard"},
            {"max_minutes": 5, "rank": "Senior Engineer"},
            {"max_minutes": 10, "rank": "Midlevel Engineer"},
            {"max_minutes": 15, "rank": "New Grad"},
            {"max_minutes": 999999, "rank": "Slow Poke"}
        ],
        solution_templates={
            'cpp': """
#include <vector>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <algorithm> 
#include <utility> 

class Solution {
public:
    // returns {number_of_paths, longest_path_length}
    std::pair<int,int> dfs(
        const std::vector<std::tuple<std::string,std::string,int>>& edges,
        const std::string& starting_node,
        const std::string& ending_node
    ) {
        return {0, 0};
    }
};

""",
            'python': """class Solution:
  
  # edges examples [('a', 'b', 11), ('a', 'c', 1)]
  def dfs(self, edges, starting_node, ending_node):
    return 0, 0"""
        },
        reference_solutions={
            'cpp': """
#include <vector>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <algorithm>  // for std::max
#include <utility>    // for std::pair

class Solution {
public:
    // returns {number_of_paths, longest_path_length}
    std::pair<int,int> dfs(
        const std::vector<std::tuple<std::string,std::string,int>>& edges,
        const std::string& starting_node,
        const std::string& ending_node
    ) {
        // build adjacency list
        std::unordered_map<std::string,
            std::vector<std::pair<std::string,int>>> adj;
        for (auto& e : edges) {
            const auto& n1 = std::get<0>(e);
            const auto& n2 = std::get<1>(e);
            int dist      = std::get<2>(e);
            adj[n1].emplace_back(n2, dist);
        }

        int path_num = 0;
        int current_length = 0;
        int best_length = 0;
        std::unordered_set<std::string> visited;

        // recursive DFS lambda
        std::function<void(const std::string&)> dfsTravel =
        [&](const std::string& node) {
            if (node == ending_node) {
                ++path_num;
                best_length = std::max(best_length, current_length);
                return;
            }
            auto it = adj.find(node);
            if (it == adj.end()) return;

            for (auto& [next, dist] : it->second) {
                if (visited.count(next)) continue;
                visited.insert(next);
                current_length += dist;
                dfsTravel(next);
                current_length -= dist;
                visited.erase(next);
            }
        };

        dfsTravel(starting_node);
        return {path_num, best_length};
    }
};
""",
            'python': """class Solution:

  def dfs(self, edges, starting_node, ending_node):

    node2neighbors = {}
    for n1, n2, distance in edges:
      if n1 not in node2neighbors:
        node2neighbors[n1] = []
      node2neighbors[n1].append((n2, distance))

    data = {
      'path_num': 0,
      'current_path_length': 0,
      'best_path_length': 0,
      'visited': set([])
    }

    def dfsTravel(node):
      if node == ending_node:
        data['path_num'] += 1
        data['best_path_length'] = max(
          data['best_path_length'], data['current_path_length'])
        return

      if node not in node2neighbors:
        return
      for next_node, distance in node2neighbors[node]:
        if next_node in data['visited']:
          continue
        data['visited'].add(next_node)
        data['current_path_length'] += distance
        dfsTravel(next_node)
        data['current_path_length'] -= distance
        data['visited'].remove(next_node)

    dfsTravel(starting_node)

    return data['path_num'], data['best_path_length']"""
        },
        harness_eval_files=[{
                'filename': 'eval_submission_codes.cpp',
                'lang': 'cpp',
                'content': """

#include <iostream>
#include <vector>
#include <tuple>
#include <string>
#include <algorithm>
#include "submission_codes.cpp"

int main() {
    Solution sol;

    // --- Test 1 ---
    std::vector<std::tuple<std::string,std::string,int>> edges1 = {
        {"a","b",3}, {"b","c",4}, {"a","c",11}
    };
    auto res1 = sol.dfs(edges1, "a", "c");
    std::pair<int,int> want1 = {2, 11};
    if (res1 != want1) {
        std::cout << "Incorrect\\n";
        std::cout << "Input ";
        for (auto& e : edges1)
            std::cout << "("<<std::get<0>(e)<<","<<std::get<1>(e)<<","<<std::get<2>(e)<<") ";
        std::cout << "a c\\n";
        std::cout << "Expected solution " 
                  << want1.first << "," << want1.second << "\\n";
        std::cout << "Your " 
                  << res1.first  << "," << res1.second  << "\\n";
        return 0;
    }

    // --- Test 2 ---
    auto res2 = sol.dfs(edges1, "a", "b");
    std::pair<int,int> want2 = {1, 3};
    if (res2 != want2) {
        std::cout << "Incorrect\\n";
        std::cout << "Input ";
        for (auto& e : edges1)
            std::cout << "("<<std::get<0>(e)<<","<<std::get<1>(e)<<","<<std::get<2>(e)<<") ";
        std::cout << "a b\\n";
        std::cout << "Expected solution " 
                  << want2.first << "," << want2.second << "\\n";
        std::cout << "Your " 
                  << res2.first  << "," << res2.second  << "\\n";
        return 0;
    }

    // --- Test 3 ---
    std::vector<std::tuple<std::string,std::string,int>> edges3 = {
        {"a","b",3}, {"b","c",4}, {"c","a",11}
    };
    auto res3 = sol.dfs(edges3, "a", "x");
    // only check path count here
    if (res3.first != 0) {
        std::cout << "Incorrect\\n";
        std::cout << "Input ";
        for (auto& e : edges3)
            std::cout << "("<<std::get<0>(e)<<","<<std::get<1>(e)<<","<<std::get<2>(e)<<") ";
        std::cout << "a x\\n";
        std::cout << "Expected solution 0,None\\n";
        std::cout << "Your " 
                  << res3.first << "," << res3.second << "\\n";
        return 0;
    }

    std::cout << "Correct\\n";
    return 0;
}
"""
            
            },{
                'filename': 'eval_submission_codes.py',
                'lang': 'python',
                'content': """import submission_codes
import sys

if __name__ == '__main__':
  
  edges = [('a', 'b', 3), ('b', 'c', 4), ('a', 'c', 11)]
  starting_node = 'a'
  ending_node = 'c'
  solution = (2, 11)
  sol = submission_codes.Solution()
  x = sol.dfs(edges, starting_node, ending_node)
  if x != solution:
    print('Incorrect')
    print('Input', edges, starting_node, ending_node)
    print('Expected solution', solution)
    print('Your', x)
    sys.exit(0)
    
    
  starting_node = 'a'
  ending_node = 'b'
  solution = (1, 3)
  sol = submission_codes.Solution()
  x = sol.dfs(edges, starting_node, ending_node)
  if x != solution:
    print('Incorrect')
    print('Input', edges, starting_node, ending_node)
    print('Expected solution', solution)
    print('Your', x)
    sys.exit(0)
    

  edges = [('a', 'b', 3), ('b', 'c', 4), ('c', 'a', 11)]
  starting_node = 'a'
  ending_node = 'x'
  solution = (0, None)
  sol = submission_codes.Solution()
  x = sol.dfs(edges, starting_node, ending_node)
  if x[0] != solution[0]:
    print('Incorrect')
    print('Input', edges, starting_node, ending_node)
    print('Expected solution', solution)
    print('Your', x)
    sys.exit(0)
  
  print('Correct')"""
            }
        ]
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_problems),
    ] 