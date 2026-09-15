import { LanguageInfo, SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  python: {
    id: 'python',
    name: 'Python',
    extensions: ['.py'],
    monacoLanguage: 'python',
    description: 'Python 3.x source or functions',
    defaultSample: `# Python Example: Binary Search Algorithm
# (This is editable sample code - modify or replace with your own snippet)

def binary_search(arr, target):
    """
    Searches for target in a sorted list.
    """
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

# Sample execution snippet
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
result = binary_search(numbers, 23)
print(f"Found target at index: {result}")
`,
  },
  java: {
    id: 'java',
    name: 'Java',
    extensions: ['.java'],
    monacoLanguage: 'java',
    description: 'Java source class, method, or snippet',
    defaultSample: `// Java Example: Merge Sort Subroutine
// (This is editable sample code - modify or replace with your own snippet)

public class MergeSortExample {

    public static void mergeSort(int[] array, int left, int right) {
        if (left < right) {
            int middle = left + (right - left) / 2;
            
            mergeSort(array, left, middle);
            mergeSort(array, middle + 1, right);
            
            merge(array, left, middle, right);
        }
    }

    private static void merge(int[] array, int left, int middle, int right) {
        int n1 = middle - left + 1;
        int n2 = right - middle;

        int[] leftArr = new int[n1];
        int[] rightArr = new int[n2];

        for (int i = 0; i < n1; ++i) leftArr[i] = array[left + i];
        for (int j = 0; j < n2; ++j) rightArr[j] = array[middle + 1 + j];

        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            if (leftArr[i] <= rightArr[j]) {
                array[k++] = leftArr[i++];
            } else {
                array[k++] = rightArr[j++];
            }
        }

        while (i < n1) array[k++] = leftArr[i++];
        while (j < n2) array[k++] = rightArr[j++];
    }
}
`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp'],
    monacoLanguage: 'cpp',
    description: 'C++11/17/20 source, functions, or algorithms',
    defaultSample: `// C++ Example: Quick Sort with Partitioning
// (This is editable sample code - modify or replace with your own snippet)

#include <vector>
#include <iostream>
#include <algorithm>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
`,
  },
  c: {
    id: 'c',
    name: 'C',
    extensions: ['.c', '.h'],
    monacoLanguage: 'c',
    description: 'C99/C11 standard procedural code',
    defaultSample: `/* C Example: Matrix Multiplication Routine
   (This is editable sample code - modify or replace with your own snippet) */

#include <stdio.h>
#define SIZE 3

void multiplyMatrices(int first[][SIZE], int second[][SIZE], int result[][SIZE], int r1, int c1, int c2) {
    for (int i = 0; i < r1; ++i) {
        for (int j = 0; j < c2; ++j) {
            result[i][j] = 0;
            for (int k = 0; k < c1; ++k) {
                result[i][j] += first[i][k] * second[k][j];
            }
        }
    }
}
`,
  },
};

export const ACCEPTED_EXTENSIONS = ['.java', '.c', '.cpp', '.py'];

/**
 * Detect language from filename or file extension.
 * Returns SupportedLanguage or null if unsupported.
 */
export function detectLanguageFromFilename(filename: string): SupportedLanguage | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();

  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.cxx')) return 'cpp';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';

  return null;
}
