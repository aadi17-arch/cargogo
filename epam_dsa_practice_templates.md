# EPAM Coding Practice — Array & String Problems

Use this file to practice writing C++ solutions in Notepad/VS Code. Each problem includes the function signature, example test cases (like LeetCode), and specifies whether a helper function is needed or recommended.

---

## Problem 1: Maximum Subarray Sum (Kadane's Algorithm)

### Statement
Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

### Test Cases
- **Example 1:**
  - **Input:** `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`
  - **Output:** `6`
  - **Explanation:** Subarray `[4, -1, 2, 1]` has the largest sum = `6`.
- **Example 2:**
  - **Input:** `nums = [1]`
  - **Output:** `1`
- **Example 3:**
  - **Input:** `nums = [5, 4, -1, 7, 8]`
  - **Output:** `23`

### Function Signature
```cpp
#include <vector>

int maxSubArray(std::vector<int>& nums) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Kadane's algorithm can be implemented cleanly inside a single loop using two variables (`currentMax` and `maxSoFar`).

---

## Problem 2: Rotate Array

### Statement
Given an integer array `nums` and an integer `k`, rotate the array to the right by `k` steps in-place.

### Test Cases
- **Example 1:**
  - **Input:** `nums = [1, 2, 3, 4, 5, 6, 7], k = 3`
  - **Output:** `[5, 6, 7, 1, 2, 3, 4]`
  - **Explanation:**
    - Rotate 1 steps to the right: `[7, 1, 2, 3, 4, 5, 6]`
    - Rotate 2 steps to the right: `[6, 7, 1, 2, 3, 4, 5]`
    - Rotate 3 steps to the right: `[5, 6, 7, 1, 2, 3, 4]`
- **Example 2:**
  - **Input:** `nums = [-1, -100, 3, 99], k = 2`
  - **Output:** `[3, 99, -1, -100]`

### Function Signature
```cpp
#include <vector>

void rotate(std::vector<int>& nums, int k) {
    // Write your code here
}
```

### Helper Function Needed?
**YES (Recommended).** A helper `reverseArray(vector<int>& nums, int start, int end)` function makes the 3-step array reversal technique very clean and easy to read.

```cpp
void reverseArray(std::vector<int>& nums, int start, int end) {
    // Write reverse helper code here
}
```

---

## Problem 3: Move Zeroes

### Statement
Given an integer array `nums`, move all `0`s to the end of it while maintaining the relative order of the non-zero elements in-place.

### Test Cases
- **Example 1:**
  - **Input:** `nums = [0, 1, 0, 3, 12]`
  - **Output:** `[1, 3, 12, 0, 0]`
- **Example 2:**
  - **Input:** `nums = [0]`
  - **Output:** `[0]`

### Function Signature
```cpp
#include <vector>

void moveZeroes(std::vector<int>& nums) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Uses standard `std::swap` or a two-pointer approach directly inside the main function.

---

## Problem 4: Find Duplicate Number (Floyd's Cycle Detection)

### Statement
Given an array of integers `nums` containing `n + 1` integers where each integer is in the range `[1, n]` inclusive, find the duplicate number without modifying the array and using only constant extra space.

### Test Cases
- **Example 1:**
  - **Input:** `nums = [1, 3, 4, 2, 2]`
  - **Output:** `2`
- **Example 2:**
  - **Input:** `nums = [3, 1, 3, 4, 2]`
  - **Output:** `3`
- **Example 3:**
  - **Input:** `nums = [3, 3, 3, 3, 3]`
  - **Output:** `3`

### Function Signature
```cpp
#include <vector>

int findDuplicate(std::vector<int>& nums) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Implemented using two pointers (slow and fast) directly inside the main function.

---

## Problem 5: Container With Most Water

### Statement
Given an integer array `height` of length `n`, find two lines that together with the x-axis form a container that holds the most water. Return the maximum amount of water.

### Test Cases
- **Example 1:**
  - **Input:** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]`
  - **Output:** `49`
  - **Explanation:** The vertical lines are represented by array `[1, 8, 6, 2, 5, 4, 8, 3, 7]`. In this case, the max area of water the container can contain is `49`.
- **Example 2:**
  - **Input:** `height = [1, 1]`
  - **Output:** `1`

### Function Signature
```cpp
#include <vector>

int maxArea(std::vector<int>& height) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Two-pointer technique (`left` and `right`) directly computes area using `std::min` and `std::max`.

---

## Problem 6: Valid Anagram

### Statement
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

### Test Cases
- **Example 1:**
  - **Input:** `s = "anagram", t = "nagaram"`
  - **Output:** `true`
- **Example 2:**
  - **Input:** `s = "rat", t = "car"`
  - **Output:** `false`

### Function Signature
```cpp
#include <string>

bool isAnagram(std::string s, std::string t) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** A single frequency array of size 26 or a hash map inside the main function is sufficient.

---

## Problem 7: Longest Substring Without Repeating Characters

### Statement
Given a string `s`, find the length of the longest substring without repeating characters.

### Test Cases
- **Example 1:**
  - **Input:** `s = "abcabcbb"`
  - **Output:** `3`
  - **Explanation:** The answer is `"abc"`, with the length of `3`.
- **Example 2:**
  - **Input:** `s = "bbbbb"`
  - **Output:** `1`
  - **Explanation:** The answer is `"b"`, with the length of `1`.
- **Example 3:**
  - **Input:** `s = "pwwkew"`
  - **Output:** `3`
  - **Explanation:** The answer is `"wke"`, with the length of `3`. Notice that the answer must be a substring, `"pwke"` is a subsequence and not a substring.

### Function Signature
```cpp
#include <string>

int lengthOfLongestSubstring(std::string s) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Managed directly with sliding window pointers and an `std::unordered_set<char>`.

---

## Problem 8: Reverse Words in a String

### Statement
Given an input string `s`, reverse the order of the words. Return a string of the words joined by a single space, with no leading/trailing/multiple spaces.

### Test Cases
- **Example 1:**
  - **Input:** `s = "the sky is blue"`
  - **Output:** `"blue is sky the"`
- **Example 2:**
  - **Input:** `s = "  hello world  "`
  - **Output:** `"world hello"`
  - **Explanation:** Your reversed string should not contain leading or trailing spaces.
- **Example 3:**
  - **Input:** `s = "a good   example"`
  - **Output:** `"example good a"`
  - **Explanation:** You need to reduce multiple spaces between two words to a single space in the reversed string.

### Function Signature
```cpp
#include <string>

std::string reverseWords(std::string s) {
    // Write your code here
}
```

### Helper Function Needed?
**OPTIONAL.** You can use standard `std::stringstream` inside the main function, or write a helper to trim spaces/reverse individual word ranges.

---

## Problem 9: Valid Palindrome

### Statement
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Return `true` if it is a palindrome.

### Test Cases
- **Example 1:**
  - **Input:** `s = "A man, a plan, a canal: Panama"`
  - **Output:** `true`
  - **Explanation:** `"amanaplanacanalpanama"` is a palindrome.
- **Example 2:**
  - **Input:** `s = "race a car"`
  - **Output:** `false`
  - **Explanation:** `"raceacar"` is not a palindrome.
- **Example 3:**
  - **Input:** `s = " "`
  - **Output:** `true`
  - **Explanation:** `s` is an empty string `""` after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.

### Function Signature
```cpp
#include <string>

bool isPalindrome(std::string s) {
    // Write your code here
}
```

### Helper Function Needed?
**OPTIONAL.** Standard C++ functions `std::isalnum()` and `std::tolower()` are built-in headers (`<cctype>`), so a custom helper is not required unless you choose to write your own alphanumeric checker.

---

## Problem 10: String Compression

### Statement
Given an array of characters `chars`, compress it in-place using consecutive repeating character counts. Return the new length of the array.

### Test Cases
- **Example 1:**
  - **Input:** `chars = ["a","a","b","b","c","c","c"]`
  - **Output:** Return `6`, and the first 6 characters of the input array should be `["a","2","b","2","c","3"]`.
- **Example 2:**
  - **Input:** `chars = ["a"]`
  - **Output:** Return `1`, and the first character should be `["a"]`.
- **Example 3:**
  - **Input:** `chars = ["a","b","b","b","b","b","b","b","b","b","b","b","b"]`
  - **Output:** Return `4`, and the first 4 characters should be `["a","b","1","2"]`.

### Function Signature
```cpp
#include <vector>

int compress(std::vector<char>& chars) {
    // Write your code here
}
```

### Helper Function Needed?
**NO.** Standard `std::to_string()` handles converting counts to characters directly in the main loop.
