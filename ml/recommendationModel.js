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
    issue: 'Possible repeated nested traversal',
    approach: 'Inspect whether inner-loop work can be indexed, precomputed, or reduced.',
    expectedBenefit: 'If repeated work can be eliminated, runtime may improve; the actual bound depends on loop ranges and dependencies.',
    tradeoffs: 'Indexing or precomputation may require extra memory and setup time.',
    guard: 'Only apply this when the nested work is independent or can be indexed without changing program semantics.'
  },
  USE_HASH_LOOKUP: {
    title: 'Consider indexed or hash-based lookup',
    area: 'time-space',
    explanation: 'Repeated linear searches can often be replaced by a set/map-style lookup when fast membership or key access is the dominant operation.',
    issue: 'Possible repeated linear lookup',
    approach: 'Consider a set or map for repeated membership tests or key-based access.',
    expectedBenefit: 'Average lookup may fall from O(n) to O(1) per query for suitable hash-based structures; total improvement depends on how many lookups occur.',
    tradeoffs: 'Often uses O(n) additional memory; hashing, collisions, key equality, ordering, and setup costs matter.',
    guard: 'Use only when the required key semantics are supported and the extra memory is acceptable. Do not replace ordered or duplicate-sensitive behavior blindly.'
  },
  USE_BINARY_SEARCH: {
    title: 'Consider binary search',
    area: 'time',
    explanation: 'The feature pattern resembles repeated lookup in ordered data. Binary search can reduce a linear search to logarithmic search.',
    issue: 'Possible repeated search in ordered data',
    approach: 'Consider binary search only when searching a sorted or suitably ordered collection.',
    expectedBenefit: 'A search can take O(log n) rather than O(n) once the data is sorted.',
    tradeoffs: 'Sorting has a cost; keeping data sorted can make updates more expensive.',
    guard: 'The data must be sorted or maintained in sorted order; sorting cost and update cost must also be considered.'
  },
  AVOID_REPEATED_COMPUTATION: {
    title: 'Avoid repeated computation',
    area: 'time',
    explanation: 'Repeated computation appears to dominate the structure. Cache invariant or reusable results when doing so preserves correctness and memory limits.',
    issue: 'Possible repeated computation',
    approach: 'Identify loop-invariant or reusable calculations and compute/cache them only when safe.',
    expectedBenefit: 'May reduce repeated work when the same expensive expression is evaluated multiple times.',
    tradeoffs: 'Caching consumes memory and can become incorrect if inputs or relevant state change.',
    guard: 'Cache only values whose inputs remain unchanged and whose memory cost is justified.'
  },
  REDUCE_MEMORY_ALLOCATION: {
    title: 'Reduce unnecessary memory allocation',
    area: 'space',
    explanation: 'The feature pattern indicates substantial allocation or memory pressure. Reuse buffers, avoid duplicate collections, or process data incrementally where possible.',
    issue: 'Possible allocation or memory pressure',
    approach: 'Check for duplicate collections, temporary objects, and opportunities to reuse buffers or stream data.',
    expectedBenefit: 'May reduce peak memory use or allocation overhead when redundant allocations are confirmed.',
    tradeoffs: 'Buffer reuse can complicate ownership and make code harder to reason about.',
    guard: 'Do not trade away required data retention or readability merely to reduce allocations.'
  },
  USE_APPROPRIATE_DATA_STRUCTURE: {
    title: 'Choose a data structure for the access pattern',
    area: 'time-space',
    explanation: 'Collection usage is prominent. Matching the structure to the dominant operations can improve lookup, insertion, deletion, or memory behavior.',
    issue: 'Collection usage may not match the dominant access pattern',
    approach: 'Choose a collection based on lookup, insertion, deletion, ordering, and duplicate requirements.',
    expectedBenefit: 'The right structure may improve the operations that dominate workload cost.',
    tradeoffs: 'Different structures change memory use, ordering, iteration behavior, and operation costs.',
    guard: 'Select the structure based on actual operations and ordering requirements rather than assuming one structure is always faster.'
  },
  REDUCE_UNNECESSARY_TRAVERSAL: {
    title: 'Reduce unnecessary traversal',
    area: 'time',
    explanation: 'The model detected a pattern consistent with repeated or avoidable traversal. Consider combining passes, early exits, or reusing computed information.',
    issue: 'Possible repeated or avoidable traversal',
    approach: 'Look for duplicate passes, reusable intermediate results, or safe early exits.',
    expectedBenefit: 'May reduce the number of passes over the data if those passes are redundant.',
    tradeoffs: 'Combining passes can increase code complexity or alter behavior if ordering and side effects matter.',
    guard: 'Only combine traversals when the resulting logic remains correct and maintainable.'
  },
  NO_MAJOR_OPTIMIZATION: {
    title: 'No major optimization identified',
    area: 'none',
    explanation: 'The current feature pattern does not strongly match a learned optimization category.',
    issue: 'No strong optimization signal identified',
    approach: 'Keep the current implementation unless profiling or requirements reveal a bottleneck.',
    expectedBenefit: 'Avoids speculative changes; no runtime improvement is claimed.',
    tradeoffs: 'Static features may miss algorithmic or library-level bottlenecks.',
    guard: 'The absence of a recommendation does not prove the code is optimal; inspect domain-specific constraints and library costs.'
  }
};

function toVector(features) {
  return FEATURES.map((name) => {
    const value = Number(features?.[name] ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  });
}

// Precompute centroid norms once at startup so each request only computes dot products
// and one query norm. This is a small constant-factor improvement, not a 100x claim.
const CENTROID_NORMS = Object.fromEntries(
  LABELS.map((label) => [
    label,
    Math.sqrt(MODEL.centroids[label].reduce((sum, value) => sum + value * value, 0))
  ])
);

function classify(vector) {
  let vectorNormSquared = 0;
  for (const value of vector) vectorNormSquared += value * value;
  const vectorNorm = Math.sqrt(vectorNormSquared);
  const ranked = LABELS.map((label) => {
    const centroid = MODEL.centroids[label];
    let dot = 0;
    for (let i = 0; i < vector.length; i += 1) dot += vector[i] * centroid[i];
    const score = vectorNorm && CENTROID_NORMS[label]
      ? dot / (vectorNorm * CENTROID_NORMS[label])
      : 0;
    return { label, score };
  }).sort((a, b) => b.score - a.score);
  return { best: ranked[0], ranked };
}

function dominantLabel(features) {
  // Conservative gates: a pattern is a recommendation trigger, not proof of a bottleneck.
  if (Number(features?.nestedLoops) >= 0.75) return 'REDUCE_NESTED_LOOPS';
  if (Number(features?.binarySearch) >= 0.75) return 'USE_BINARY_SEARCH';
  if (Number(features?.repeatedSearch) >= 0.75) return 'USE_HASH_LOOKUP';
  if (Number(features?.repeatedComputation) >= 0.75) return 'AVOID_REPEATED_COMPUTATION';
  if (Number(features?.spacePressure) >= 0.9) return 'REDUCE_MEMORY_ALLOCATION';
  if (Number(features?.collectionUsage) >= 0.75) return 'USE_APPROPRIATE_DATA_STRUCTURE';
  if (Number(features?.unnecessaryTraversal) >= 0.85) return 'REDUCE_UNNECESSARY_TRAVERSAL';
  return null;
}

const FEATURE_EXPLANATIONS = {
  nestedLoops: ['Nested loop structure', 'The static analyzer estimated nested loop depth of at least two. This does not by itself prove the loops are the bottleneck.'],
  repeatedSearch: ['Repeated-search pattern', 'Search or comparison patterns matched a heuristic for repeated lookup; inspect the actual search target and number of queries.'],
  sorting: ['Sorting operation', 'A sorting call was detected; its cost depends on the implementation and input size.'],
  binarySearch: ['Binary-search indicator', 'A binary-search-like name or operation was detected; verify that the data is sorted and the operation is actually used.'],
  recursion: ['Recursive call pattern', 'The analyzer detected a recursive-function signal; runtime and stack costs depend on branching and termination.'],
  largeAllocation: ['Allocation indicator', 'Collection or allocation syntax was detected; it does not establish that memory use is excessive.'],
  repeatedComputation: ['Repeated-computation indicator', 'A math or reusable-computation pattern appears alongside loops; verify that the same value is recomputed with unchanged inputs.'],
  unnecessaryTraversal: ['Multiple traversal indicator', 'Multiple loops or traversal methods were detected; confirm whether the passes are redundant before combining them.'],
  collectionUsage: ['Collection usage', 'Collection construction was detected; choose structures based on actual access, ordering, and duplicate semantics.'],
  spacePressure: ['Potential space pressure', 'Allocation or recursion features triggered this signal; actual peak memory was not measured.'],
  branchDepth: ['Control-flow depth', 'Nested control flow was detected; consider simplification only if it improves clarity.'],
  linearScan: ['Linear-scan indicator', 'A loop or search-like pattern was detected; inspect the exact work performed per iteration.']
};

function explainTriggeredFeatures(features) {
  return FEATURES
    .filter((name) => Number(features?.[name] ?? 0) >= 0.5)
    .map((name) => ({
      feature: name,
      label: FEATURE_EXPLANATIONS[name][0],
      value: Number(Number(features[name]).toFixed(2)),
      explanation: FEATURE_EXPLANATIONS[name][1]
    }));
}

export function recommendOptimizations(features) {
  const vector = toVector(features);
  const classified = classify(vector);
  const gatedLabel = dominantLabel(features);
  const selectedLabel = gatedLabel || classified.best.label;
  const recommendation = RECOMMENDATIONS[selectedLabel];
  const selectedScore = classified.ranked.find((item) => item.label === selectedLabel)?.score || 0;
  const secondBestScore = classified.ranked.find((item) => item.label !== selectedLabel)?.score || 0;
  const margin = selectedScore - secondBestScore;
  // This is a conservative heuristic category, not a calibrated probability.
  const confidence = selectedScore >= 0.8 && margin >= 0.12
    ? 'high'
    : selectedScore >= 0.55 && margin >= 0.04
      ? 'medium'
      : 'low';
  const alternatives = classified.ranked
    .filter((item) => item.label !== selectedLabel)
    .slice(0, 3)
    .map((item) => ({ label: item.label, title: RECOMMENDATIONS[item.label].title, score: Number(item.score.toFixed(3)) }));
  return {
    available: true,
    model: 'Local Optimization Recommender v0.2',
    modelType: 'centroid-similarity-classifier-with-signal-gating',
    trainingExamples: MODEL.trainingExamples,
    recommendation: selectedLabel,
    title: recommendation.title,
    area: recommendation.area,
    issue: recommendation.issue,
    approach: recommendation.approach,
    expectedBenefit: recommendation.expectedBenefit,
    tradeoffs: recommendation.tradeoffs,
    explanation: recommendation.explanation,
    guard: recommendation.guard,
    confidence,
    score: Number(selectedScore.toFixed(3)),
    scoreMeaning: 'Cosine similarity to the selected class centroid; not a probability of correctness.',
    triggeredFeatures: explainTriggeredFeatures(features),
    alternatives
  };
}

export const recommendationModelInfo = {
  name: 'Local Optimization Recommender',
  version: '0.3',
  type: 'centroid-similarity-classifier-with-signal-gating',
  featureCount: FEATURES.length,
  trainingExamples: MODEL.trainingExamples,
  labels: LABELS
};
