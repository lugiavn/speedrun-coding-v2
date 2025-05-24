# Speedrun Coding v2

**Project information:**  

Speedrun Coding v2 is a LeetCode–style web app where the primary emphasis is on coding speed, helping users improve not just correctness but also how quickly they can solve problems under timed conditions.

## Database schema

Use Django built-in User model.

Note that the following is initial version of the schema. As we use Django, it can change and evolve / migrate.

```sql

-- Problems
CREATE TABLE problems (
  id                  SERIAL      PRIMARY KEY,
  title               TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE,
  description_md      TEXT        NOT NULL,             -- the full Markdown statement 
  tags                TEXT[]      NOT NULL DEFAULT '{}', -- (e.g. "divide-and-conquer,sorting")
  difficulty          TEXT,                 -- e.g. "easy", "medium", "hard"
  time_thresholds     JSONB       NOT NULL, -- JSON array as TEXT: [{ "max_minutes":3,"rank":"Wizard" }, …]
  solution_templates  JSONB       NOT NULL, -- Starter templates per language, e.g. { "python":"…", "cpp":"…" }
  reference_solutions JSONB       NOT NULL, -- JSON object mapping lang→solution code (solution.py)
  
  -- Any number of extra files needed for evaluation:
  --   [ { "filename":"eval_submission_codes.py", "lang":"python", "content":"..."},
  --     { "filename":"lib/helpers.js",     "lang":"javascript", "content":"..." },
  --     { "filename":"cases/input1.json",  "lang":null,         "content":"..." } ]
  harness_eval_files  JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auto‐update updated_at on problems
CREATE OR REPLACE FUNCTION trg_problems_set_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION trg_problems_set_updated_at();

-- GIN index on tags array for fast lookup
CREATE INDEX idx_problems_tags
  ON problems
  USING GIN (tags);

-- Submissions
CREATE TABLE submissions (
  id           SERIAL      PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id   INTEGER     NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL,
  code         TEXT        NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  status       TEXT,
  duration_ms  INTEGER,
  memory_kb    INTEGER,
  passed       BOOLEAN     NOT NULL,
  rank         TEXT,
  raw_results  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on foreign keys for fast lookups
CREATE INDEX idx_submissions_user_id    ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);


```

### Insert first example problem

```sql

INSERT INTO problems (
  title,
  slug,
  description_md,
  tags,
  difficulty,
  time_thresholds,
  solution_templates,
  reference_solutions,
  harness_eval_files
) VALUES (
  'Inplace sort with Quick Sort',
  'inplace-sort-with-quick-sort',
  $$Sort an array in place.

Quicksort is a divide-and-conquer algorithm. It works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot.
Then we recursively sort the sub-array bellow the pivot and the sub-array above the pivot. Once recursion finished, the whole array has been sorted in place.

Time complexity is O(nlogn) average, but O(n^2) worst case.

Reference: [https://en.wikipedia.org/wiki/Quicksort](https://en.wikipedia.org/wiki/Quicksort)$$,
  ARRAY['divide-and-conquer','sorting'],
  NULL,
  jsonb_build_array(
    jsonb_build_object('max_minutes',3,'rank','Wizard'),
    jsonb_build_object('max_minutes',5,'rank','Senior Engineer'),
    jsonb_build_object('max_minutes',10,'rank','Midlevel Engineer'),
    jsonb_build_object('max_minutes',15,'rank','New Grad'),
    jsonb_build_object('max_minutes',999999,'rank','Slow Poke')
  ),
  jsonb_build_object(
    'python', $$class Solution:
  def sort(self, values):
    pass
$$,
    'cpp', $$#include <vector>
using namespace std;
class Solution {
public:
    void sort(vector<int>& values) {
        // TODO: implement quicksort
    }
};
$$
  ),
  jsonb_build_object(
    'python', $$class Solution:
  
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
$$
  ),
  jsonb_build_array(
    jsonb_build_object(
      'filename','eval_submission_codes.py',
      'lang','python',
      'content', $$import submission_codes
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
$$
    )
  )
);

```

Very important: note that harness_eval_files are sensitive information. It should be used by backend service only, and should not be exposed to normal users. However an superuser / administrator can have access and modify.


### Insert second example problem

```sql

INSERT INTO problems (
  title,
  slug,
  description_md,
  tags,
  difficulty,
  time_thresholds,
  solution_templates,
  reference_solutions,
  harness_eval_files
) VALUES (
  'Search for paths with Depth First Search DFS',
  'search-for-paths-with-depth-first-search-dfs',
  $$Using DFS algorithm to find paths in a graph

Input:

edges is an array of tuple of (node1, node2, distance) representing the graph, edge is 1 direction only from node1 to node2

starting node and ending nodes (here a node is a string).

Output: 2 numbers: the number of path between start node and ending node, and the length of the longest path

A valid path does not visit the same node more than once.

Example:

edges = [('a', 'b', 3), ('b', 'c', 4), ('a', 'c', 11)], starting node 'a', ending node 'c'
Output: (2, 11)$$,
  ARRAY['graph','dfs','depth-first-search'],
  NULL,
  jsonb_build_array(
    jsonb_build_object('max_minutes',2,'rank','Wizard'),
    jsonb_build_object('max_minutes',5,'rank','Senior Engineer'),
    jsonb_build_object('max_minutes',10,'rank','Midlevel Engineer'),
    jsonb_build_object('max_minutes',15,'rank','New Grad'),
    jsonb_build_object('max_minutes',999999,'rank','Slow Poke')
  ),
  jsonb_build_object(
    'python', $$class Solution:
  
  # edges examples [('a', 'b', 11), ('a', 'c', 1)]
  def dfs(self, edges, starting_node, ending_node):
    return 0, 0$$,
    'cpp', $$#include <vector>
using namespace std;
class Solution {
public:
    pair<int,int> dfs(vector<tuple<char,char,int>>& edges, char starting_node, char ending_node) {
        // TODO: implement DFS path search counting and max length
        return {0, 0};
    }
};$$
  ),
  jsonb_build_object(
    'python', $$class Solution:

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

    return data['path_num'], data['best_path_length']$$
  ),
  jsonb_build_array(
    jsonb_build_object(
      'filename','eval_submission_codes.py',
      'lang','python',
      'content',$$import submission_codes
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
  
  print('Correct')$$
    )
  )
);

```












