# EPAM Interview Prep — DSA Arrays & Strings (C++)

This file contains the most frequently asked Array and String coding questions for EPAM technical rounds and online assessments, complete with C++ solutions, time/space complexities, and dry runs.

---

## Section 1: Array Problems (Q1–Q6)

### Q1: Two Sum
**Problem:** Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

```cpp
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> numMap;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (numMap.count(complement)) {
            return {numMap[complement], i};
        }
        numMap[nums[i]] = i;
    }
    return {};
}
```
- **Time Complexity:** $O(N)$ — Single pass through the array.
- **Space Complexity:** $O(N)$ — Storing elements in the hash map.

---

### Q2: Maximum Subarray (Kadane's Algorithm)
**Problem:** Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

```cpp
#include <vector>
#include <algorithm>

int maxSubArray(std::vector<int>& nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];

    for (size_t i = 1; i < nums.size(); i++) {
        currentMax = std::max(nums[i], currentMax + nums[i]);
        maxSoFar = std::max(maxSoFar, currentMax);
    }
    return maxSoFar;
}
```
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(1)$ — Constant extra space.

---

### Q3: Move Zeroes
**Problem:** Given an integer array `nums`, move all `0`s to the end of it while maintaining the relative order of the non-zero elements in-place.

```cpp
#include <vector>

void moveZeroes(std::vector<int>& nums) {
    int lastNonZeroFoundAt = 0;
    for (int i = 0; i < nums.size(); i++) {
        if (nums[i] != 0) {
            std::swap(nums[lastNonZeroFoundAt++], nums[i]);
        }
    }
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ — In-place swap.

---

### Q4: Rotate Array by K Steps
**Problem:** Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.

```cpp
#include <vector>
#include <algorithm>

void rotate(std::vector<int>& nums, int k) {
    int n = nums.size();
    k = k % n;
    
    // Reverse the entire array
    std::reverse(nums.begin(), nums.end());
    // Reverse first k elements
    std::reverse(nums.begin(), nums.begin() + k);
    // Reverse remaining n-k elements
    std::reverse(nums.begin() + k, nums.end());
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ — In-place reversal.

---

### Q5: Find the Duplicate Number
**Problem:** Given an array of integers `nums` containing `n + 1` integers where each integer is in the range `[1, n]` inclusive, find the duplicate number (Floyd's Tortoise and Hare / Cycle Detection).

```cpp
#include <vector>

int findDuplicate(std::vector<int>& nums) {
    int slow = nums[0];
    int fast = nums[0];
    
    // Find intersection point in cycle
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    
    // Find entry point to cycle
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$

---

### Q6: Container With Most Water (Two Pointers)
**Problem:** Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap.

```cpp
#include <vector>
#include <algorithm>

int maxArea(std::vector<int>& height) {
    int maxWater = 0;
    int left = 0;
    int right = height.size() - 1;

    while (left < right) {
        int width = right - left;
        int currentHeight = std::min(height[left], height[right]);
        maxWater = std::max(maxWater, width * currentHeight);

        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$

---

## Section 2: String Problems (Q7–Q12)

### Q7: Valid Anagram
**Problem:** Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

```cpp
#include <string>
#include <vector>

bool isAnagram(std::string s, std::string t) {
    if (s.length() != t.length()) return false;

    std::vector<int> count(26, 0);
    for (size_t i = 0; i < s.length(); i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }

    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ — Fixed size array of size 26.

---

### Q8: Longest Substring Without Repeating Characters (Sliding Window)
**Problem:** Given a string `s`, find the length of the longest substring without repeating characters.

```cpp
#include <string>
#include <unordered_set>
#include <algorithm>

int lengthOfLongestSubstring(std::string s) {
    std::unordered_set<char> charSet;
    int left = 0, maxLength = 0;

    for (int right = 0; right < s.length(); right++) {
        while (charSet.count(s[right])) {
            charSet.erase(s[left]);
            left++;
        }
        charSet.insert(s[right]);
        maxLength = std::max(maxLength, right - left + 1);
    }
    return maxLength;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(\min(N, M))$ where $M$ is the size of the alphabet set.

---

### Q9: Reverse Words in a String
**Problem:** Given an input string `s`, reverse the order of the words.

```cpp
#include <string>
#include <algorithm>
#include <sstream>
#include <vector>

std::string reverseWords(std::string s) {
    std::stringstream ss(s);
    std::string word;
    std::vector<std::string> words;

    while (ss >> word) {
        words.push_back(word);
    }

    std::reverse(words.begin(), words.end());

    std::string result = "";
    for (size_t i = 0; i < words.size(); i++) {
        result += words[i];
        if (i < words.size() - 1) result += " ";
    }
    return result;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(N)$

---

### Q10: Valid Palindrome (Ignoring Non-Alphanumeric)
**Problem:** Check if a given string is a palindrome, considering only alphanumeric characters and ignoring cases.

```cpp
#include <string>
#include <cctype>

bool isPalindrome(std::string s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        while (left < right && !std::isalnum(s[left])) left++;
        while (left < right && !std::isalnum(s[right])) right--;

        if (std::tolower(s[left]) != std::tolower(s[right])) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$

---

### Q11: Longest Common Prefix
**Problem:** Write a function to find the longest common prefix string amongst an array of strings.

```cpp
#include <vector>
#include <string>
#include <algorithm>

std::string longestCommonPrefix(std::vector<std::string>& strs) {
    if (strs.empty()) return "";

    std::sort(strs.begin(), strs.end());
    std::string first = strs[0];
    std::string last = strs.back();

    int i = 0;
    while (i < first.length() && i < last.length() && first[i] == last[i]) {
        i++;
    }
    return first.substr(0, i);
}
```
- **Time Complexity:** $O(N \log N \cdot M)$ where $N$ is string array size and $M$ is string length.
- **Space Complexity:** $O(1)$ extra space excluding sort internal stack.

---

### Q12: String Compression
**Problem:** Given an array of characters `chars`, compress it in-place using the following algorithm: begin with an empty string, and for each group of consecutive repeating characters in `chars`, append the character followed by the count.

```cpp
#include <vector>
#include <string>

int compress(std::vector<char>& chars) {
    int index = 0;
    int i = 0;

    while (i < chars.size()) {
        char currentChar = chars[i];
        int count = 0;

        while (i < chars.size() && chars[i] == currentChar) {
            i++;
            count++;
        }

        chars[index++] = currentChar;

        if (count > 1) {
            std::string countStr = std::to_string(count);
            for (char c : countStr) {
                chars[index++] = c;
            }
        }
    }
    return index;
}
```
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ in-place update.
