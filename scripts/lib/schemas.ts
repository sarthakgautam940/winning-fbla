import { z } from "zod";

const num = z.number().finite();
const point = z.tuple([num, num]);
const caption = z.string().min(3).optional();

export const treeNode: z.ZodType<{ label: string; edge?: string; children?: unknown[] }> = z.lazy(() =>
  z
    .object({
      label: z.string().min(1),
      edge: z.string().optional(),
      children: z.array(treeNode).optional(),
    })
    .strict(),
);

export const figureSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("histogram"),
      bins: z.array(z.object({ from: num, to: num, count: num.nonnegative() }).strict()).min(2),
      xLabel: z.string(),
      yLabel: z.string().optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("bar"),
      categories: z.array(z.string()).min(1),
      series: z.array(z.object({ name: z.string().optional(), values: z.array(num) }).strict()).min(1),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
      horizontal: z.boolean().optional(),
      stacked: z.boolean().optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("line"),
      series: z.array(z.object({ name: z.string().optional(), points: z.array(point).min(2) }).strict()).min(1),
      xLabel: z.string(),
      yLabel: z.string(),
      yMin: num.optional(),
      yMax: num.optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("scatter"),
      series: z.array(z.object({ name: z.string().optional(), points: z.array(point).min(1) }).strict()).min(1),
      xLabel: z.string(),
      yLabel: z.string(),
      line: z.object({ slope: num, intercept: num, label: z.string().optional() }).strict().optional(),
      centroids: z.array(point).optional(),
      highlight: z.array(point).optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("boxplot"),
      groups: z
        .array(
          z
            .object({
              label: z.string(),
              min: num,
              q1: num,
              median: num,
              q3: num,
              max: num,
              outliers: z.array(num).optional(),
            })
            .strict(),
        )
        .min(1),
      axisLabel: z.string(),
      caption,
    })
    .strict(),
  z.object({ type: z.literal("dotplot"), values: z.array(num).min(2), xLabel: z.string(), caption }).strict(),
  z
    .object({
      type: z.literal("normal"),
      mean: num.optional(),
      sd: num.positive().optional(),
      axis: z.enum(["sd", "z", "values"]).optional(),
      shade: z.array(z.object({ from: num.nullable(), to: num.nullable() }).strict()).optional(),
      marks: z.array(num).optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("curve"),
      fn: z.enum(["sigmoid", "relu", "leaky-relu", "tanh", "step", "linear", "parabola", "exp", "log"]),
      xRange: point,
      yRange: point.optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
      marks: z.array(z.object({ x: num, label: z.string().optional() }).strict()).optional(),
      hline: num.optional(),
      caption,
    })
    .strict(),
  z.object({ type: z.literal("tree"), root: treeNode, caption }).strict(),
  z
    .object({
      type: z.literal("network"),
      layers: z.array(z.number().int().min(1).max(8)).min(2).max(6),
      labels: z.array(z.string()).optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("graph"),
      nodes: z.array(z.object({ id: z.string(), label: z.string(), x: num.min(0).max(100), y: num.min(0).max(100) }).strict()).min(2),
      edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() }).strict()),
      directed: z.boolean().optional(),
      caption,
    })
    .strict(),
  z.object({ type: z.literal("flow"), steps: z.array(z.string()).min(2).max(10), cycle: z.boolean().optional(), caption }).strict(),
  z
    .object({
      type: z.literal("confusion"),
      tp: num.nonnegative(),
      fp: num.nonnegative(),
      fn: num.nonnegative(),
      tn: num.nonnegative(),
      positive: z.string().optional(),
      negative: z.string().optional(),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("venn"),
      sets: z.array(z.object({ label: z.string() }).strict()).min(2).max(3),
      center: z.string().optional(),
      caption,
    })
    .strict(),
  z.object({ type: z.literal("nested"), layers: z.array(z.string()).min(2).max(5), caption }).strict(),
  z.object({ type: z.literal("pyramid"), levels: z.array(z.string()).min(2).max(6), caption }).strict(),
  z
    .object({
      type: z.literal("pie"),
      slices: z.array(z.object({ label: z.string(), value: num.positive() }).strict()).min(2).max(8),
      caption,
    })
    .strict(),
  z
    .object({
      type: z.literal("pixels"),
      grid: z.array(z.array(z.number().int().min(0).max(255)).min(2)).min(2),
      caption,
    })
    .strict(),
]);

export const tierSchema = z.enum(["core", "competitive", "champion"]);
export const typeSchema = z.enum(["recall", "concept", "scenario", "calculation", "code", "sql", "visual"]);
export const letterSchema = z.enum(["A", "B", "C", "D"]);

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids use lowercase letters, digits, and hyphens"),
    skill: z.string(),
    tier: tierSchema,
    type: typeSchema,
    use: z.enum(["check", "quiz", "bank"]).optional(),
    objective: z.string().optional(),
    test: z.number().int().min(1).max(5).optional(),
    stem: z.string().min(8),
    figure: figureSchema.optional(),
    options: z.array(z.string().min(1)).length(4),
    ordered: z.boolean().optional(),
    answer: letterSchema,
    explain: z.string().min(20),
    why: z.partialRecord(letterSchema, z.string().min(5)),
    verify: z.string().optional(),
    time: z.number().int().min(5).max(180).optional(),
  })
  .strict();

export type QuestionSource = z.infer<typeof questionSchema>;

export const flashcardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    term: z.string().min(1),
    def: z.string().min(8),
    example: z.string().optional(),
    skill: z.string(),
    virginia: z.boolean().optional(),
  })
  .strict();

export type FlashcardSource = z.infer<typeof flashcardSchema>;

const objectiveSchema = z.object({ id: z.string(), text: z.string() }).strict();

export const curriculumSchema = z
  .object({
    areas: z
      .array(
        z
          .object({
            id: z.enum(["DL", "PS", "DA", "TL", "AI", "ML", "PR", "PE"]),
            name: z.string(),
            items: z.number().int(),
            objectives: z.array(objectiveSchema),
          })
          .strict(),
      )
      .length(8),
    units: z.array(
      z
        .object({
          id: z.string(),
          n: z.number().int(),
          area: z.enum(["DL", "PS", "DA", "TL", "AI", "ML", "PR", "PE"]).nullable(),
          title: z.string(),
          summary: z.string(),
          lessons: z.array(
            z
              .object({
                id: z.string(),
                n: z.number().int(),
                title: z.string(),
                summary: z.string(),
                minutes: z.number().int(),
                skills: z.array(z.string()),
                objectives: z.array(z.string()),
                vocab: z.array(z.string()).optional(),
                outline: z.array(z.string()),
                notes: z.string().optional(),
                widgets: z.array(z.string()).optional(),
                figures: z.array(z.string()).optional(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    skills: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          objectives: z.array(z.string()).min(1),
          patterns: z.array(z.string()).min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type CurriculumSource = z.infer<typeof curriculumSchema>;

export const WIDGETS = [
  "base-converter",
  "stats-explorer",
  "normal-explorer",
  "bayes-explorer",
  "kmeans-stepper",
  "threshold-explorer",
  "query-order",
  "join-explorer",
  "overfit-explorer",
  "gradient-descent",
  "split-calculator",
  "neuron-playground",
  "temperature-explorer",
  "bayesnet-calculator",
] as const;

// The 2026 Virginia FBLA study guide vocabulary (deduplicated). Every term must
// be taught in a lesson (bold) and have a flashcard with `virginia: true`.
export const VIRGINIA_TERMS = [
  "Mean", "Median", "Mode", "Standard Deviation", "Variance", "Covariance", "Gaussian Distribution",
  "Expected Value", "Discrete Variable", "Continuous Variable", "Range", "Quartile", "Percentile",
  "Correlation", "Probability Distribution",
  "Histogram", "Boxplot", "Scatterplot", "Linear Regression", "Logistic Regression", "Data Cleaning",
  "Outlier", "Multivariate Analysis", "Decision Tree", "K-means Clustering", "Feature", "Target Variable",
  "Imputation", "Normalization", "Visualization",
  "Pandas", "NumPy", "PyTorch", "SQL", "DataFrame", "Series", "Relational Database", "JOIN", "Query",
  "Index", "Vectorization", "API", "CSV", "R Language", "Python",
  "Generative AI", "Large Language Model (LLM)", "Natural Language Processing (NLP)", "Computer Vision",
  "Robotics", "Hallucination", "Transformer", "Embedding", "Tokenization", "Fine-tuning", "Prompt",
  "Context Window", "Neural Network", "Deep Learning", "Artificial Intelligence",
  "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Training Dataset",
  "Test Dataset", "Validation Dataset", "Overfitting", "Underfitting", "Accuracy", "Precision", "Recall",
  "F1 Score", "Cross-Validation", "Hyperparameter", "Gradient Descent",
  "Predicate Logic", "Logic-Based Reasoning", "Probability-Based Reasoning", "Bayesian Network", "Node",
  "Edge", "Directed Acyclic Graph (DAG)", "Conditional Probability", "Knowledge Representation",
  "Knowledge Graph", "Ontology", "Inference", "Forward Chaining", "Backward Chaining", "Semantic Web",
  "Algorithmic Bias", "Fairness", "Transparency", "Explainability", "Privacy", "Data Breach",
  "Differential Privacy", "Surveillance", "Misinformation", "Ethical Dilemma", "Accountability", "Consent",
  "Bias Detection", "Security", "Ethics Guidelines",
  "Data Science", "Structured Data", "Unstructured Data", "Numeric Data", "Categorical Data",
  "Data Wrangling", "Data Transformation", "Exploratory Data Analysis (EDA)", "Feature Engineering",
  "Data Quality", "Data Governance", "Data Pipeline", "Big Data", "Data Source",
] as const;
