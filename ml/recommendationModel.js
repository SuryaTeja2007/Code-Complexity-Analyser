// Lightweight domain-specific ML recommender.
// This is intentionally not an LLM: it is a supervised, centroid-based classifier
// trained from labeled optimization examples. It runs locally with no API key.

const FEATURES = [
  'nestedLoops', 'repeatedSearch', 'sorting', 'binarySearch', 'recursion',
  'largeAllocation', 'repeatedComputation', 'unnecessaryTraversal',
  'collectionUsage', 'spacePressure', 'branchDepth', 'linearScan'
];

const LABELS = [
  'REDUCE_NESTED_LOOPS',
  'USE_HASH_LOOKUP',
  'USE_BINARY_SEARCH',
  'AVOID_REPEATED_COMPUTATION',
  'REDUCE_MEMORY_ALLOCATION',
  'USE_APPROPRIATE_DATA_STRUCTURE',
  'REDUCE_UNNECESSARY_TRAVERSAL',
  'NO_MAJOR_OPTIMIZATION'
];

// Labeled training examples. Values are normalized structural features in [0, 1].
const TRAINING_DATA = [
  [[1,0,0,0,0,0,0,0,0,0,0,0.8],'REDUCE_NESTED_LOOPS'],
  [[0.9,0.1,0,0,0,0,0,0.2,0,0,0.1,0.7],'REDUCE_NESTED_LOOPS'],
  [[1,0.2,0,0,0,0,0.1,0.1,0.1,0,0.2,0.8],'REDUCE_NESTED_LOOPS'],
  [[0.8,0,0,0,0,0,0,0.3,0,0,0.2,0.7],'REDUCE_NESTED_LOOPS'],
  [[0.9,0.2,0,0,0,0,0,0.2,0.2,0,0.2,0.8],'REDUCE_NESTED_LOOPS'],
  [[0.2,1,0,0,0,0,0,0.2,0.8,0,0.1,0.9],'USE_HASH_LOOKUP'],
  [[0.3,0.9,0,0,0,0,0,0.1,0.9,0,0.2,0.8],'USE_HASH_LOOKUP'],
  [[0.1,1,0,0,0,0,0,0.1,0.7,0,0.1,0.9],'USE_HASH_LOOKUP'],
  [[0.4,0.9,0.1,0,0,0,0,0.2,0.8,0.1,0.2,0.8],'USE_HASH_LOOKUP'],
  [[0.2,0.8,0,0,0,0,0,0.1,0.9,0,0.1,0.8],'USE_HASH_LOOKUP'],
  [[0,0.4,0,1,0,0,0,0,0.4,0,0.1,1],'USE_BINARY_SEARCH'],
  [[0.1,0.3,0,0.9,0,0,0,0.1,0.3,0,0.2,0.9],'USE_BINARY_SEARCH'],
  [[0,0.6,0,1,0,0,0,0.1,0.5,0,0.1,1],'USE_BINARY_SEARCH'],
  [[0.1,0.5,0.1,0.9,0,0,0,0.1,0.4,0,0.2,0.9],'USE_BINARY_SEARCH'],
  [[0,0.5,0,0.95,0,0,0,0,0.4,0,0.1,1],'USE_BINARY_SEARCH'],
  [[0.1,0,0,0,0,0,0.95,0.2,0,0,0.1,0.4],'AVOID_REPEATED_COMPUTATION'],
  [[0.2,0.1,0,0,0,0,1,0.1,0.1,0,0.2,0.4],'AVOID_REPEATED_COMPUTATION'],
  [[0.1,0,0.1,0,0,0.1,0.9,0.3,0.1,0,0.1,0.3],'AVOID_REPEATED_COMPUTATION'],
  [[0.3,0.1,0,0,0,0,0.9,0.2,0.2,0.1,0.2,0.5],'AVOID_REPEATED_COMPUTATION'],
  [[0.1,0.2,0,0,0,0.1,0.85,0.2,0.1,0,0.1,0.4],'AVOID_REPEATED_COMPUTATION'],
  [[0,0,0,0,0.2,1,0.2,0.1,0.5,1,0.1,0.2],'REDUCE_MEMORY_ALLOCATION'],
  [[0.1,0,0,0,0.3,0.9,0.1,0.2,0.4,0.9,0.1,0.2],'REDUCE_MEMORY_ALLOCATION'],
  [[0,0,0,0,0.1,0.95,0.3,0.1,0.6,0.95,0.2,0.2],'REDUCE_MEMORY_ALLOCATION'],
  [[0.1,0,0,0,0.4,0.9,0.2,0.2,0.5,1,0.1,0.3],'REDUCE_MEMORY_ALLOCATION'],
  [[0,0.1,0,0,0.2,0.85,0.2,0.1,0.5,0.9,0.1,0.2],'REDUCE_MEMORY_ALLOCATION'],
  [[0.2,0.3,0.1,0,0,0.2,0.1,0.1,1,0.5,0.2,0.5],'USE_APPROPRIATE_DATA_STRUCTURE'],
  [[0.1,0.4,0,0,0,0.2,0,0.2,0.95,0.4,0.1,0.5],'USE_APPROPRIATE_DATA_STRUCTURE'],
  [[0.3,0.2,0.1,0,0,0.3,0.1,0.2,0.9,0.6,0.2,0.4],'USE_APPROPRIATE_DATA_STRUCTURE'],
  [[0.2,0.5,0,0.1,0,0.2,0.1,0.2,0.9,0.5,0.2,0.6],'USE_APPROPRIATE_DATA_STRUCTURE'],
  [[0.1,0.3,0.1,0,0,0.1,0.2,0.2,0.95,0.4,0.2,0.5],'USE_APPROPRIATE_DATA_STRUCTURE'],
  [[0.4,0.1,0,0,0,0.1,0.2,1,0.3,0.1,0.1,0.9],'REDUCE_UNNECESSARY_TRAVERSAL'],
  [[0.5,0.2,0,0,0,0.1,0.1,0.9,0.4,0.1,0.2,0.9],'REDUCE_UNNECESSARY_TRAVERSAL'],
  [[0.3,0,0.1,0,0,0,0.2,0.95,0.2,0,0.1,0.8],'REDUCE_UNNECESSARY_TRAVERSAL'],
  [[0.4,0.2,0.1,0,0,0.1,0.2,0.9,0.5,0.1,0.2,0.9],'REDUCE_UNNECESSARY_TRAVERSAL'],
  [[0.2,0.1,0,0,0,0,0,0.9,0.3,0,0.1,0.8],'REDUCE_UNNECESSARY_TRAVERSAL'],
  [[0,0,0,0,0,0,0,0,0,0,0,0],'NO_MAJOR_OPTIMIZATION'],
  [[0.05,0,0,0,0,0,0,0,0.1,0,0.1,0.1],'NO_MAJOR_OPTIMIZATION'],
  [[0,0.05,0,0,0,0,0,0,0,0,0.1,0.1],'NO_MAJOR_OPTIMIZATION'],
  [[0.05,0,0,0,0,0.05,0,0,0.1,0,0.1,0.1],'NO_MAJOR_OPTIMIZATION'],
  [[0,0,0,0,0,0,0.05,0,0.1,0,0.1,0.1],'NO_MAJOR_OPTIMIZATION']
];

function trainCentroids() {
  const centroids = Object.fromEntries(LABELS.map((label) => [label, Array(FEATURES.length).fill(0)]));
  const counts = Object.fromEntries(LABELS.map((label) => [label, 0]));
  for (const [vector, label] of TRAINING_DATA) {
    counts[label] += 1;
    vector.forEach((value, i) => { centroids[label][i] += value; });
  }
  for (const label of LABELS) centroids[label] = centroids[label].map((v) => v / counts[label]);
  return { centroids, trainingExamples: TRAINING_DATA.length };
}

const MODEL = trainCentroids();

const RECOMMENDATIONS = {
  REDUCE_NESTED_LOOPS: {
    title: 'Reduce nested iteration',
    area: 'time',
    explanation: 'The feature pattern resembles repeated nested traversal. Look for indexing, precomputation, or a different traversal strategy that can remove work from the inner loop.',
    guard: 'Only apply this when the nested work is independent or can be indexed without changing program semantics.'
  },
  USE_HASH_LOOKUP: {
    title: 'Consider indexed or hash-based lookup',
    area: 'time-space',
    explanation: 'Repeated linear searches can often be replaced by a set/map-style lookup when fast membership or key access is the dominant operation.',
    guard: 'This can trade additional O(n) space for lower lookup time and is appropriate only when the data and access pattern support it.'
  },
  USE_BINARY_SEARCH: {
    title: 'Consider binary search',
    area: 'time',
    explanation: 'The feature pattern resembles repeated lookup in ordered data. Binary search can reduce a linear search to logarithmic search.',
    guard: 'The data must be sorted or maintained in sorted order; sorting cost and update cost must also be considered.'
  },
  AVOID_REPEATED_COMPUTATION: {
    title: 'Avoid repeated computation',
    area: 'time',
    explanation: 'Repeated computation appears to dominate the structure. Cache invariant or reusable results when doing so preserves correctness and memory limits.',
    guard: 'Cache only values whose inputs remain unchanged and whose memory cost is justified.'
  },
  REDUCE_MEMORY_ALLOCATION: {
    title: 'Reduce unnecessary memory allocation',
    area: 'space',
    explanation: 'The feature pattern indicates substantial allocation or memory pressure. Reuse buffers, avoid duplicate collections, or process data incrementally where possible.',
    guard: 'Do not trade away required data retention or readability merely to reduce allocations.'
  },
  USE_APPROPRIATE_DATA_STRUCTURE: {
    title: 'Choose a data structure for the access pattern',
    area: 'time-space',
    explanation: 'Collection usage is prominent. Matching the structure to the dominant operations can improve lookup, insertion, deletion, or memory behavior.',
    guard: 'Select the structure based on actual operations and ordering requirements rather than assuming one structure is always faster.'
  },
  REDUCE_UNNECESSARY_TRAVERSAL: {
    title: 'Reduce unnecessary traversal',
    area: 'time',
    explanation: 'The model detected a pattern consistent with repeated or avoidable traversal. Consider combining passes, early exits, or reusing computed information.',
    guard: 'Only combine traversals when the resulting logic remains correct and maintainable.'
  },
  NO_MAJOR_OPTIMIZATION: {
    title: 'No major optimization identified',
    area: 'none',
    explanation: 'The current feature pattern does not strongly match a learned optimization category.',
    guard: 'The absence of a recommendation does not prove the code is optimal; inspect domain-specific constraints and library costs.'
  }
};

function toVector(features) {
  return FEATURES.map((name) => {
    const value = Number(features?.[name] ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  });
}

function similarity(a, b) {
  let dot = 0; let aa = 0; let bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2;
  }
  return aa && bb ? dot / (Math.sqrt(aa) * Math.sqrt(bb)) : 0;
}

export function recommendOptimizations(features) {
  const vector = toVector(features);
  const ranked = LABELS.map((label) => ({ label, score: similarity(vector, MODEL.centroids[label]) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const recommendation = RECOMMENDATIONS[best.label];
  const confidence = best.score >= 0.92 ? 'high' : best.score >= 0.78 ? 'medium' : 'low';
  const alternatives = ranked.slice(1, 3).map((item) => ({ label: item.label, title: RECOMMENDATIONS[item.label].title, score: Number(item.score.toFixed(3)) }));
  return {
    available: true,
    model: 'Local Optimization Recommender v0.1',
    modelType: MODEL.type || 'centroid-similarity-classifier',
    trainingExamples: MODEL.trainingExamples,
    recommendation: best.label,
    title: recommendation.title,
    area: recommendation.area,
    explanation: recommendation.explanation,
    guard: recommendation.guard,
    confidence,
    score: Number(best.score.toFixed(3)),
    alternatives
  };
}

export const recommendationModelInfo = {
  name: 'Local Optimization Recommender',
  version: '0.1',
  type: 'centroid-similarity-classifier',
  featureCount: FEATURES.length,
  trainingExamples: MODEL.trainingExamples,
  labels: LABELS
};
