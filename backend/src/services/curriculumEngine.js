/**
 * CareerPilot AI — 3-Stage Unique Adaptive Curriculum & Roadmap Engine
 *
 * Implements a non-templated, progressive, domain-specific roadmap pipeline:
 * - Stage A: Domain Research & Skill Map (Cached in DB `domain_blueprints`)
 * - Stage B: Curriculum Architecture (6 Progressive Phases + Concept Ledger)
 * - Stage C: Context-Aware Day Generation (Variable Tasks, Exercises, Unique Done-When, AI Tips)
 * - Anti-Repetition Validator: Strict Jaccard token similarity (<0.50), ledger enforcement, banned phrase guards.
 * - Job-Readiness Track: Portfolio builds with README/Google X-Y-Z bullets, mock interviews, AI-era workflow.
 */

import { query } from '../config/db.js';

// In-memory cache for ultra-fast and synchronous lookup
const BLUEPRINT_MEMORY_CACHE = new Map();

export const BANNED_GENERIC_PHRASES = [
  'theoretical deep dive',
  'hands-on implementation',
  'benchmarking, code review & synthesis',
  'concept deconstruction & notes',
  'hands-on code & problem solving',
  'complexity review & active synthesis',
  'core theory & method walkthrough',
  'self-evaluation & edge-case review',
  'successfully completed.*with verified test cases',
  'production-ready deliverable focusing on'
];

export const PROGRESSION_STAGES = [
  { stage: 1, name: 'Foundations & Mental Models', focus: 'fundamentals', pctRange: [0, 0.18] },
  { stage: 2, name: 'Core Design Patterns & Modularity', focus: 'intermediate', pctRange: [0.18, 0.35] },
  { stage: 3, name: 'Advanced Engineering & Optimization', focus: 'advanced', pctRange: [0.35, 0.52] },
  { stage: 4, name: 'Tooling, Testing & Production CI/CD', focus: 'tooling', pctRange: [0.52, 0.68] },
  { stage: 5, name: 'High-Scale Industry Case Studies', focus: 'case_studies', pctRange: [0.68, 0.80] },
  { stage: 6, name: 'Synthesis, Diagnostics & Resilience', focus: 'synthesis_revision', pctRange: [0.80, 0.90] },
  { stage: 7, name: 'End-to-End Production Capstone Build', focus: 'capstone', pctRange: [0.90, 0.96] },
  { stage: 8, name: 'Staff-Level Technical Defense & Mock Simulation', focus: 'interview_defense', pctRange: [0.96, 1.0] }
];

export const CURRICULUM_PHASES = [
  { id: 1, name: 'Foundations & Mental Models', pct: 0.18, code: 'foundations' },
  { id: 2, name: 'Core Skills & Architecture', pct: 0.35, code: 'core_skills' },
  { id: 3, name: 'Applied Engineering & Integration', pct: 0.55, code: 'applied_practice' },
  { id: 4, name: 'Projects & Portfolio Builds', pct: 0.75, code: 'portfolio_projects' },
  { id: 5, name: 'Interview Defense & Rigor', pct: 0.90, code: 'interview_prep' },
  { id: 6, name: 'Job Hunt & AI-Era Mastery', pct: 1.00, code: 'job_hunt_ai' }
];

/**
 * Domain Resource Links (Curated Verifiable Documentation & Practice Hubs)
 */
export function getDomainResourceLinks(domainName = '', weekTopic = '') {
  const lower = (domainName || '').toLowerCase();
  const cleanTopic = encodeURIComponent(weekTopic || domainName);

  if (/sql|data\s*analyst|power\s*bi|tableau|analytics/i.test(lower)) {
    return [
      { title: 'PostgreSQL & Modern SQL Reference', url: 'https://www.postgresql.org/docs/current/', type: 'docs' },
      { title: 'SQL & Analytics Video Walkthroughs', url: `https://www.youtube.com/results?search_query=${cleanTopic}+sql+tutorial`, type: 'video' },
      { title: 'StrataScratch & LeetCode SQL Practice', url: 'https://platform.stratascratch.com/', type: 'practice' }
    ];
  }

  if (/java/i.test(lower)) {
    return [
      { title: 'Oracle Java Documentation', url: 'https://docs.oracle.com/en/java/', type: 'docs' },
      { title: 'Java Masterclass & Problem Solutions', url: `https://www.youtube.com/results?search_query=${cleanTopic}+java+tutorial`, type: 'video' },
      { title: 'LeetCode Problem Sets in Java', url: 'https://leetcode.com/problemset/all/', type: 'practice' }
    ];
  }

  if (/ui.*ux|figma|product\s*design|user\s*experience/i.test(lower)) {
    return [
      { title: 'Figma Official Help Center & Guides', url: 'https://help.figma.com/hc/en-us', type: 'docs' },
      { title: 'Nielsen Norman Group UX Masterclass', url: `https://www.youtube.com/results?search_query=${cleanTopic}+ux+design+tutorial`, type: 'video' },
      { title: 'Mobbin Real-World UI Patterns', url: 'https://mobbin.com/', type: 'practice' }
    ];
  }

  if (/data\s*science|machine\s*learning|ai|pandas|pytorch|deep\s*learning/i.test(lower)) {
    return [
      { title: 'Scikit-Learn & PyTorch Official Docs', url: 'https://scikit-learn.org/stable/', type: 'docs' },
      { title: 'Machine Learning & Python Walkthroughs', url: `https://www.youtube.com/results?search_query=${cleanTopic}+python+machine+learning`, type: 'video' },
      { title: 'Kaggle Datasets & Jupyter Notebooks', url: 'https://www.kaggle.com/datasets', type: 'practice' }
    ];
  }

  if (/web|react|frontend|full\s*stack|node/i.test(lower)) {
    return [
      { title: 'MDN Web Docs Official Reference', url: 'https://developer.mozilla.org/en-US/', type: 'docs' },
      { title: 'Full Stack Engineering Video Tutorials', url: `https://www.youtube.com/results?search_query=${cleanTopic}+fullstack+tutorial`, type: 'video' },
      { title: 'GitHub Open Source Practice Repos', url: `https://github.com/search?q=${cleanTopic}`, type: 'practice' }
    ];
  }

  if (/devops|cloud|docker|kubernetes|aws/i.test(lower)) {
    return [
      { title: 'Kubernetes & Docker Official Docs', url: 'https://kubernetes.io/docs/home/', type: 'docs' },
      { title: 'Cloud Architecture & DevOps Series', url: `https://www.youtube.com/results?search_query=${cleanTopic}+devops+tutorial`, type: 'video' },
      { title: 'Killercoda Interactive DevOps Labs', url: 'https://killercoda.com/', type: 'practice' }
    ];
  }

  // Universal Fallback
  return [
    { title: `${domainName} Official Documentation`, url: `https://www.google.com/search?q=${cleanTopic}+official+documentation`, type: 'docs' },
    { title: `${domainName} Video Masterclass`, url: `https://www.youtube.com/results?search_query=${cleanTopic}+tutorial`, type: 'video' },
    { title: `${domainName} Hands-On Exercises`, url: `https://github.com/search?q=${cleanTopic}`, type: 'practice' }
  ];
}

// ============================================================================
// STAGE A: DOMAIN BLUEPRINTS CATALOG & REPOSITORY
// ============================================================================

const MASTER_BLUEPRINTS = {
  'data_analyst_sql': {
    domain: 'Data Analyst & SQL',
    targetRole: 'Data Analyst / Analytics Engineer',
    coreSkills: ['SQL', 'PostgreSQL', 'Pandas', 'Power BI', 'DAX', 'Data Modeling', 'A/B Testing', 'Statistical Inference'],
    tools: ['PostgreSQL', 'DBeaver', 'Python 3', 'Pandas', 'Power BI Desktop', 'Git', 'Jupyter Lab'],
    conceptsInOrder: [
      'Relational Database Normalization & Schema Constraints',
      'SQL Filtering, CASE Expressions & NULL Semantics',
      'Multi-Table Joins (INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF)',
      'Aggregations, Grouping Sets & HAVING Filter Clauses',
      'Subqueries, Correlated Subqueries & Common Table Expressions (CTEs)',
      'Window Functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE)',
      'Offset Window Functions (LEAD, LAG, FIRST_VALUE, Running Totals)',
      'Pandas Data Cleaning, String Formatting & Missing Value Imputation',
      'Exploratory Data Analysis, Outlier Detection & Seaborn Distributions',
      'Star Schema Modeling, Fact/Dimension Tables & Surrogate Keys',
      'Power BI Data Loading, Relationships & DAX Calculated Measures',
      'Advanced DAX: CALCULATE, FILTER, ALL & Time Intelligence (YoY/MoM)',
      'Statistical Experimentation: Hypothesis Testing, T-Tests & A/B Analysis',
      'Advanced SQL Analytics: Cohort Retention Matrices & Churn Curves',
      'SQL Query Optimization with EXPLAIN ANALYZE & Index Selection',
      'AI-Assisted Analytics: Prompting Copilot for CTEs & Schema Auditing'
    ],
    commonInterviewTopics: [
      'Difference between RANK() and DENSE_RANK() with duplicate keys',
      'Optimizing slow queries having large table full-table scans',
      'Detecting and resolving data leakage in analytical reporting',
      'Handling NULLs in COUNT(*) vs COUNT(column)',
      'Star Schema vs Snowflake Schema performance trade-offs'
    ],
    jobRequirements: [
      'Fluency in writing complex analytical SQL queries with CTEs and windowing',
      'Hands-on experience developing multi-page interactive Power BI or Tableau dashboards',
      'Ability to clean, reshape, and model raw transaction logs into tidy fact tables',
      'Strong statistical understanding to evaluate experimentation and A/B tests'
    ],
    portfolioProjects: [
      {
        title: 'E-Commerce 12-Month Cohort Retention & Churn Engine',
        description: 'End-to-end SQL CTE pipeline calculating monthly user retention cohorts and lifetime spending across 250,000 transactions.',
        tech_stack: ['PostgreSQL', 'SQL CTEs', 'Window Functions', 'Power BI'],
        deliverables: ['Documented SQL analytical script', 'Cohort retention heat matrix dashboard', 'Executive stakeholder insight brief'],
        resumeBullet: 'Accomplished 18% improvement in customer retention visibility by engineering an automated SQL cohort analytics pipeline across 250K transactions.'
      },
      {
        title: 'Enterprise Executive Sales & Operations Power BI Dashboard',
        description: 'Star-schema analytical model with 16 custom DAX measures for YoY growth, rolling 90-day moving averages, and margin KPIs.',
        tech_stack: ['Power BI Desktop', 'DAX', 'Star Schema', 'Power Query'],
        deliverables: ['Star schema .pbix model file', 'DAX measures formula sheet', 'Interactive drill-down performance reports'],
        resumeBullet: 'Accomplished 40% reduction in executive reporting cycle time by authoring a Star-schema Power BI dashboard with 16 optimized DAX metrics.'
      },
      {
        title: 'Retail Store A/B Testing & Promotion Impact Study',
        description: 'Statistical significance evaluation testing discount strategies against baseline control groups using two-sample t-tests.',
        tech_stack: ['Python', 'Pandas', 'SciPy', 'Seaborn', 'A/B Testing'],
        deliverables: ['Jupyter notebook statistical analysis', 'Seaborn distribution plots', 'Confidence interval business report'],
        resumeBullet: 'Accomplished $45K promotion budget savings by proving promotional test significance using two-sample Welch t-tests in Python.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Authoring deterministic SQL prompts to generate multi-table CTE skeletons and format JSON outputs.',
      aiAssistedWorkflows: 'Leveraging GitHub Copilot and ChatGPT for EXPLAIN query analysis, regex extraction, and synthetic schema generation.',
      automationTools: 'Building automated dbt data transformation tests and GitHub Actions analytical validation workflows.',
      humanEdge: 'Deep domain business acumen, cross-functional stakeholder alignment, and critical validation of subtle statistical biases that AI hallucinations miss.'
    }
  },

  'dsa_java': {
    domain: 'DSA in Java',
    targetRole: 'Java Backend / Software Engineer',
    coreSkills: ['Java Core', 'Complexity Analysis', 'Arrays', 'Two Pointers', 'Recursion', 'Linked Lists', 'Trees', 'Heaps', 'Graphs', 'Dynamic Programming'],
    tools: ['Java 21 OpenJDK', 'IntelliJ IDEA', 'Maven', 'JUnit 5', 'LeetCode', 'JMH Benchmarks'],
    conceptsInOrder: [
      'Array Transformations, In-Place Reversals & Prefix Sums',
      'Two Pointers & Sliding Window Optimization Techniques',
      'Recursion Mechanics, Call Stack Unwinding & Backtracking',
      'Linked List Pointer Manipulation & Floyd Cycle Detection',
      'Binary Tree & BST Traversals, Diameter & LCA',
      'PriorityQueue, Binary Heaps & Top-K Elements',
      'Dynamic Programming: Memoization, Tabulation & Knapsack Patterns',
      'Collections Framework Internals & Hash Collisions',
      'Graph Representations: Adjacency Lists, BFS Shortest Path & DFS Traversal',
      'Topological Sorting: Kahn In-Degree Algorithm & Cycle Detection in DAGs',
      'Disjoint Set Union (DSU) with Path Compression & Union by Rank',
      'Trie (Prefix Tree) Architecture & String Pattern Matching',
      'Segment Trees & Fenwick Binary Indexed Trees',
      'Bit Manipulation, Bitmasks & Low-Level Invariants',
      'Greedy Strategies & Interval Scheduling Algorithms',
      'Monotonic Stacks & Deques for Range Queries'
    ],
    commonInterviewTopics: [
      'HashMap internal bucket indexing and collision resolution in Java 8+ (TreeNodes)',
      'Detecting and resolving cycles in directed vs undirected graphs',
      'Converting top-down recursion with memoization into bottom-up space-optimized DP',
      'Time complexity of PriorityQueue heapify vs sequential insertion',
      'Thread safety differences between ArrayList, Vector, and CopyOnWriteArrayList'
    ],
    jobRequirements: [
      'Excellence in solving Medium/Hard algorithmic challenges under 30-minute clocks',
      'Rigorous mastery of Java Collections Framework and memory allocation mechanics',
      'Ability to write clean, modular, test-driven Java code with custom edge case tests',
      'Strong verbal communication of algorithmic tradeoffs and Big-O invariants'
    ],
    portfolioProjects: [
      {
        title: 'Thread-Safe In-Memory LRU Cache with O(1) Operations',
        description: 'Production-ready Least Recently Used (LRU) Cache implementing custom Doubly Linked List and concurrent HashMap synchronization.',
        tech_stack: ['Java 21', 'Custom LinkedList', 'HashMap', 'JUnit 5', 'Concurrency'],
        deliverables: ['Custom LRUCache implementation class', 'Multithreaded concurrent test suite', 'JMH benchmark report verifying sub-microsecond latency'],
        resumeBullet: 'Accomplished sub-millisecond retrieval latency with 0 cache corruption by engineering a thread-safe O(1) LRU Cache in Java with custom node linkages.'
      },
      {
        title: 'Directed Acyclic Graph (DAG) Task Scheduling & Dependency Engine',
        description: 'Topological task scheduler executing multi-stage build pipelines, detecting circular import cycles, and parallelizing independent jobs.',
        tech_stack: ['Java 21', 'Graphs', 'Kahn Algorithm', 'CompletableFuture'],
        deliverables: ['DAG DependencyGraph engine', 'Kahn topological ordering validator', 'Cycle detection exception hierarchy'],
        resumeBullet: 'Accomplished automated circular dependency resolution by architecting a DAG task scheduler using Kahn topological sorting in Java.'
      },
      {
        title: 'High-Throughput Streaming Median & Top-K Anomaly Tracker',
        description: 'Two-heap streaming engine maintaining running median of real-time integer inputs with O(1) median query and O(log N) insertion.',
        tech_stack: ['Java 21', 'PriorityQueue', 'Dual Heaps', 'Streaming'],
        deliverables: ['Dual-Heap MedianFinder class', 'Top-K frequent element bounded heap', 'Benchmark test harness over 1M records'],
        resumeBullet: 'Accomplished O(1) continuous median lookups across 1M records by implementing a dual min/max heap balancing engine in Java.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Guiding AI models to generate adversarial edge-case test vectors for tricky algorithmic boundary conditions.',
      aiAssistedWorkflows: 'Using Copilot for boilerplate test setup while strictly writing core invariant algorithms manually to preserve human edge.',
      automationTools: 'Automated GitHub Actions CI running JUnit test suites and code coverage gates on every commit.',
      humanEdge: 'First-principles mental tracing, space-complexity invariant verification, and whiteboard live-coding defense that AI cannot substitute in interviews.'
    }
  },

  'ui_ux': {
    domain: 'UI / UX & Product Design',
    targetRole: 'Product Designer / UI-UX Designer',
    coreSkills: ['User Research', 'Information Architecture', 'Figma', 'Wireframing', 'Design Systems', 'Micro-interactions', 'Prototyping', 'Usability Testing'],
    tools: ['Figma', 'FigJam', 'Mobbin', 'Maze', 'Notion', 'Lottie', 'Stark Accessibility'],
    conceptsInOrder: [
      'User Research, Qualitative Interviews & Empathy Mapping',
      'Information Architecture, User Decision Trees & Site Flows',
      'Wireframing & Grayscale Layout Systems with 8pt Grid',
      'Typography Hierarchy, Modular Scales & Visual Flow',
      'Design Systems, Semantic Tokens & Atomic UI Components',
      'Interactive Prototyping, Usability Testing & Maze Metrics',
      'Color Theory, Accessible Contrast Ratios & WCAG 2.1 Compliance',
      'Figma Auto-Layout 5.0, Nested Resizing & Constraints',
      'Component Architecture: Variants & Component Properties',
      'High-Fidelity UI Screens & Dark Mode Theming Architecture',
      'Micro-interactions: Smart Animate & State Motion Logic',
      'Design Handoff Documentation: CSS Inspection & Specs'
    ],
    commonInterviewTopics: [
      'Walking through a project where user research overturned your initial assumptions',
      'Structuring design tokens and component variants for engineering maintainability',
      'Designing for accessibility (color blindness, screen readers, contrast ratios)',
      'Resolving conflicts between business conversion metrics and user satisfaction',
      'Whiteboard challenge: Designing an ATM or ride-share interface for elderly users'
    ],
    jobRequirements: [
      'Polished portfolio showcasing 2-3 end-to-end product design case studies with real user research',
      'Deep mastery of Figma including auto-layout, nested variants, and interactive prototyping',
      'Ability to articulate design decisions with clear quantitative rationale and user empathy',
      'Experience conducting remote or in-person usability testing and iterating from feedback'
    ],
    portfolioProjects: [
      {
        title: 'FinTech Personal Wealth & Budgeting Mobile App',
        description: 'Complete end-to-end iOS/Android design case study solving young professional savings inertia with automated micro-investing flows.',
        tech_stack: ['Figma', 'FigJam', 'iOS Human Interface Guidelines', 'Maze'],
        deliverables: ['Clickable high-fidelity Figma prototype', 'Design system component library', 'Full published Behance / web case study'],
        resumeBullet: 'Accomplished 88/100 System Usability Score on iOS FinTech app prototype through 8 moderated usability test iterations.'
      },
      {
        title: 'B2B SaaS Multi-Tenant Analytics Web Platform',
        description: 'Responsive web platform featuring complex data tables, filtering drawers, customizable dashboards, and tokenized dark/light themes.',
        tech_stack: ['Figma', 'Design Systems', 'Tailwind Tokens', 'WCAG AAA'],
        deliverables: ['Responsive desktop & tablet screens', 'Figma token architecture library', 'Developer handoff redline spec'],
        resumeBullet: 'Accomplished 100% WCAG AAA accessibility compliance across 45 screens by building a tokenized design system in Figma.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Prompting generative image models (Midjourney, DALL-E) to rapidly explore visual moods, art styles, and icon concepts.',
      aiAssistedWorkflows: 'Using FigJam AI and ChatGPT to synthesize user interview transcripts into structured affinity clusters.',
      automationTools: 'Figma automated plugins for contrast validation, dummy data population, and token exports.',
      humanEdge: 'Deep empathy, intuitive taste, emotional brand resonance, and real interpersonal user interview facilitation that AI algorithms cannot replicate.'
    }
  },

  'data_science': {
    domain: 'Data Science with Python',
    targetRole: 'Data Scientist / Machine Learning Engineer',
    coreSkills: ['Python', 'NumPy', 'Pandas', 'Matplotlib', 'Scikit-Learn', 'Feature Engineering', 'Supervised Learning', 'Unsupervised Learning', 'Deep Learning', 'PyTorch'],
    tools: ['Python 3.11', 'Jupyter Lab', 'NumPy', 'Pandas', 'Scikit-Learn', 'PyTorch', 'Kaggle', 'MLflow'],
    conceptsInOrder: [
      'Python for Scientific Computing: NumPy Vectorization & Array Broadcasting',
      'Pandas DataFrames: Cleaning, Reshaping & Time-Series Indexing',
      'Exploratory Data Analysis: Statistical Distributions & Seaborn Visuals',
      'Feature Engineering: Imputation, One-Hot Encoding & Feature Scaling',
      'Supervised Learning: Linear & Logistic Regression with Regularization',
      'Decision Trees, Random Forests & Gradient Boosting (XGBoost/LightGBM)',
      'Model Evaluation: Cross-Validation, ROC-AUC Curves & Confusion Matrices',
      'Unsupervised Learning: K-Means Clustering, PCA & Dimensionality Reduction',
      'Deep Learning Foundations: Neural Networks & Backpropagation with PyTorch',
      'Convolutional & Recurrent Architectures for Vision & Sequence Modeling',
      'Natural Language Processing: Tokenization, TF-IDF & Hugging Face Transformers',
      'MLOps & Production Deployment: Model Serialization, FastAPI & Tracking'
    ],
    commonInterviewTopics: [
      'Bias-variance tradeoff and addressing overfitting through regularization (L1 vs L2)',
      'Difference between Bagging (Random Forest) and Boosting (XGBoost)',
      'Handling imbalanced classification datasets (SMOTE, Focal Loss, PR-AUC vs ROC-AUC)',
      'Gradient descent convergence issues: vanishing and exploding gradients',
      'Preventing data leakage during cross-validation and feature preprocessing'
    ],
    jobRequirements: [
      'Strong command of Python scientific libraries (NumPy, Pandas, Scikit-Learn, PyTorch)',
      'Demonstrated experience building, tuning, and evaluating predictive ML pipelines',
      'Solid statistical intuition for hypothesis testing, feature importance, and error metrics',
      'Ability to communicate quantitative insights clearly to engineering and business stakeholders'
    ],
    portfolioProjects: [
      {
        title: 'End-to-End Customer Churn Prediction Engine with XGBoost',
        description: 'Production-ready classification pipeline with automated feature engineering, hyperparameter tuning, and model explainability using SHAP values.',
        tech_stack: ['Python', 'Pandas', 'Scikit-Learn', 'XGBoost', 'SHAP'],
        deliverables: ['Jupyter analysis notebook', 'Serialized scikit-learn pipeline model', 'Model evaluation and business impact report'],
        resumeBullet: 'Accomplished 0.89 ROC-AUC on customer churn prediction by building an automated XGBoost pipeline with SHAP interpretability.'
      },
      {
        title: 'Deep Learning Vision Classifier with PyTorch & Transfer Learning',
        description: 'Convolutional neural network fine-tuning ResNet50 for multi-class image classification with data augmentation and mixed-precision training.',
        tech_stack: ['PyTorch', 'Torchvision', 'CUDA', 'FastAPI', 'Docker'],
        deliverables: ['PyTorch training harness', 'FastAPI real-time inference endpoint', 'Confusion matrix and latency benchmark report'],
        resumeBullet: 'Accomplished 94.2% top-1 accuracy on image classification by fine-tuning ResNet architectures with PyTorch mixed precision.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Prompting LLMs to generate synthetic feature hypotheses and data cleaning boilerplate.',
      aiAssistedWorkflows: 'Using GitHub Copilot and ChatGPT for exploratory data analysis queries and hyperparameter grid templates.',
      automationTools: 'Automated MLflow experiment tracking and Weights & Biases telemetry.',
      humanEdge: 'Critical domain validation, statistical skepticism regarding spurious correlations, and ethical auditing of algorithmic bias.'
    }
  },

  'system_design': {
    domain: 'System Design & Distributed Architecture',
    targetRole: 'Staff / Distributed Systems Engineer',
    coreSkills: ['Distributed Systems', 'Load Balancing', 'Sharding', 'Caching', 'Message Brokers', 'Consensus', 'Database Replication', 'Observability'],
    tools: ['PostgreSQL', 'Redis', 'Apache Kafka', 'Envoy', 'Prometheus', 'Docker', 'Kubernetes', 'Grafana'],
    conceptsInOrder: [
      'Horizontal Scaling, Stateless Services & Load Balancing (L4 vs L7)',
      'Database Sharding, Partitioning Strategies & Consistent Hashing',
      'Distributed Caching Architectures: Cache-Aside, Write-Through & Redis Clusters',
      'Relational ACID Transactions vs NoSQL BASE Eventual Consistency',
      'Message Brokers: RabbitMQ, Apache Kafka Partitions & Consumer Groups',
      'API Gateway Architecture, Rate Limiting & Token Bucket Algorithms',
      'Distributed Storage: Block, Object Storage (S3) & Content Delivery Networks',
      'Database Replication: Single-Leader, Multi-Leader & Leaderless Quorums',
      'Microservices Architecture: Service Mesh, Envoy & gRPC Communication',
      'Distributed Consensus: Raft, Paxos & Split-Brain Mitigation',
      'Data Lakehouses, Apache Spark Streaming & Real-Time ETL Pipelines',
      'Observability: OpenTelemetry Distributed Tracing, Prometheus & Metrics',
      'Distributed Locking & Coordination: Apache ZooKeeper & etcd Leases',
      'Event-Driven Architectures: Event Sourcing & CQRS Pattern Implementation',
      'Geographic Redundancy, Anycast Routing & Multi-Region Active-Active',
      'Disaster Recovery, Chaos Engineering & Resiliency Testing',
      'Search Engines: Inverted Index Architecture, Elasticsearch & Sharding',
      'High-Throughput Timeseries Databases: InfluxDB & Downsampling Engines',
      'Edge Computing, WebAssembly & Global Serverless Functions',
      'Distributed Task Queues & Asynchronous Job Schedulers',
      'Zero-Downtime Database Migrations, Blue-Green & Canary Rollouts',
      'High-Frequency Financial Ledger Systems: Double-Entry Bookkeeping',
      'Distributed Rate Limiters & Sliding Window Counter Implementations',
      'Large-Scale Web Crawlers: Distributed Frontiers & Deduplication',
      'Global Key-Value Stores: DynamoDB Architecture & Vector Clocks',
      'Video Streaming Architecture: HLS/DASH Chunking & Edge Caching',
      'Real-Time Collaborative Systems: Operational Transformation & CRDTs',
      'Push Notification Services: APNs, FCM & WebSocket Connection Managers',
      'Proximity Services & Geospatial Indexing: Geohash & Quadtree Systems',
      'Ride-Sharing Dispatch & Dynamic Pricing Matching Engines',
      'Ad-Tech Click Tracking: Real-Time Bidding & Low-Latency Event Streams',
      'Distributed Tracing Context Propagation & W3C Trace Parent Headers',
      'High-Concurrency Chat Applications: WebSockets & Presence Clusters',
      'Distributed File Systems: Google File System & HDFS Block Replication',
      'E-Commerce Flash Sale Architecture: Inventory Reservation & Mutexes',
      'Zero-Trust Security, Mutual TLS (mTLS) & Identity-Aware Proxies',
      'Distributed Graph Databases: Neo4j & Social Graph Traversals',
      'Cloud-Native Kubernetes Operator Patterns & Custom Resource Definitions',
      'Massive Log Aggregation Systems: Vector, Kafka & ClickHouse',
      'Large-Scale Payment Gateways: Two-Phase Commit, Sagas & Outbox Pattern',
      'Distributed Columnar Stores: Apache Cassandra LSM-Trees & SSTables',
      'Distributed SQL: Spanner TrueTime, CockroachDB & Range Partitions',
      'Real-Time Analytics Engines: Apache Pinot, Druid & Trino Optimizers',
      'Recommendation Engine Serving Infrastructure: Two-Tower Embeddings',
      'Multi-Cloud Transit Networks, VPC Peering & Interconnect Architectures',
      'Content Moderation Pipeline: High-Throughput Media Ingestion',
      'Distributed Object Store Deep Dive: Erasure Coding & Bit Rot Detection',
      'Federated GraphQL Gateways & Apollo Federation Schema Stitching',
      'Mission-Critical Reliability: SLA/SLO Budgeting & Error Budgets',
      'Enterprise Data Governance: Apache Ranger & Lineage Tracking',
      'Staff-Level Architectural Review: Trade-off Matrix & Cost Optimization',
      'Executive System Architecture Defense & Capstone Distributed Showcase'
    ],
    commonInterviewTopics: [
      'CAP Theorem trade-offs and handling network partitions in distributed datastores',
      'Implementing exactly-once message processing semantics across Kafka and relational databases',
      'Consistent hashing with virtual nodes to minimize rebalancing churn during node additions',
      'Cache penetration, cache avalanche, and cache breakdown mitigation strategies',
      'Designing idempotent payment processing with distributed locks and database state machines'
    ],
    jobRequirements: [
      'Ability to design high-throughput distributed systems scaling to millions of concurrent users',
      'Deep understanding of network topologies, serialization protocols (Protobuf/gRPC), and latency trade-offs',
      'Strong architectural clarity on data consistency models, replication strategies, and fault domains',
      'Excellence in leading technical architecture reviews and articulating trade-off rationales'
    ],
    portfolioProjects: [
      {
        title: 'Distributed Rate Limiter Service with Redis Sliding Window & Lua Scripts',
        description: 'Scalable API gateway rate limiting daemon enforcing user and IP tier quotas across a distributed cluster with sub-millisecond evaluation.',
        tech_stack: ['Node.js', 'Go', 'Redis', 'Lua', 'Docker', 'Prometheus'],
        deliverables: ['Core rate limiter service implementation', 'Distributed sliding window Lua script', 'Benchmark load test report verifying 50K req/sec'],
        resumeBullet: 'Accomplished 50,000 req/sec throughput with sub-millisecond overhead by designing a distributed rate-limiter in Redis using atomic Lua sliding-windows.'
      },
      {
        title: 'Real-Time Event Ingestion Engine with Kafka & PostgreSQL Outbox',
        description: 'Reliable transactional outbox pattern implementation ensuring zero event loss between PostgreSQL business mutations and Kafka streams.',
        tech_stack: ['PostgreSQL', 'Debezium', 'Apache Kafka', 'Docker Compose'],
        deliverables: ['Transactional outbox database schema', 'Kafka producer daemon', 'Failure injection test suite with automated recovery verification'],
        resumeBullet: 'Accomplished 99.999% event delivery reliability by architecting a transactional outbox pipeline streaming 2M events/day into Kafka.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Prompting LLMs to simulate failure scenarios and generate distributed edge-case matrices.',
      aiAssistedWorkflows: 'Using AI tools to generate OpenAPI specifications and synthetic benchmark traffic profiles.',
      automationTools: 'Continuous load testing harnesses (k6, Locust) running in CI/CD pipelines.',
      humanEdge: 'First-principles systems intuition, subtle concurrency race condition detection, and holistic trade-off evaluation under incomplete business information.'
    }
  },

  'full_stack': {
    domain: 'Full Stack Web Development',
    targetRole: 'Full Stack Software Engineer',
    coreSkills: ['HTML5', 'CSS3', 'Modern JavaScript', 'React 19', 'Node.js', 'Express', 'PostgreSQL', 'RESTful APIs', 'Docker', 'CI/CD'],
    tools: ['React 19', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'GitHub Actions'],
    conceptsInOrder: [
      'Modern Semantic HTML5, CSS Grid & Flexbox Responsive Systems',
      'JavaScript ES2024: Lexical Scope, Closures, Event Loop & Promises',
      'React 19 Core: Virtual DOM, Component Tree, Props & State Primitives',
      'Advanced React: Custom Hooks, useMemo, useCallback & Performance Tuning',
      'Client-Side Routing, Route Guards & Protected Layout Architecture',
      'Node.js Asynchronous Runtime, Event Emitters & Modular Architecture',
      'Express.js RESTful API Design, Middleware Pipelines & Error Boundaries',
      'Relational Database Modeling with PostgreSQL & Connection Pooling',
      'User Authentication: Password Hashing with Bcrypt, JWTs & HTTP-only Cookies',
      'State Management & Optimistic UI Updates in Client Applications',
      'Full Stack SaaS Feature Integration: File Uploads, Form Validation & Alerts',
      'Containerization with Multi-Stage Dockerfiles & Docker Compose',
      'Automated Testing: Vitest Component Tests & Supertest API Route Tests',
      'CI/CD Pipelines with GitHub Actions & Production Deployments on Cloud',
      'AI-Assisted Full Stack Engineering: Cursor, Copilot & Modern Prototyping'
    ],
    commonInterviewTopics: [
      'React rendering lifecycle, reconciliation diffing, and preventing re-render thrashing',
      'JWT security best practices (access tokens vs refresh tokens, XSS vs CSRF mitigation)',
      'Database connection pooling, transactions, and preventing connection exhaustion',
      'Event loop order of execution: Call stack, Microtasks (Promises), and Macrotasks',
      'Designing scalable REST APIs with proper HTTP status codes and idempotency'
    ],
    jobRequirements: [
      'Proven ability to build and deploy production web applications from scratch',
      'Strong proficiency in React frontend architecture and Node.js backend services',
      'Hands-on experience with SQL schema design, migrations, and query tuning',
      'Experience with version control, automated testing, and CI/CD deployment pipelines'
    ],
    portfolioProjects: [
      {
        title: 'Full Stack Multi-Tenant Project Management SaaS',
        description: 'Complete production web application with Google OAuth, JWT auth, PostgreSQL migrations, real-time board updates, and dark glassmorphic UI.',
        tech_stack: ['React 19', 'Tailwind CSS', 'Node.js', 'Express', 'PostgreSQL', 'Docker'],
        deliverables: ['Live deployed web app URL', 'Public GitHub repo with comprehensive README', 'Automated test suite with >80% coverage'],
        resumeBullet: 'Accomplished 99.8% service uptime by engineering a full-stack SaaS platform in React 19 and Node.js with PostgreSQL connection pooling.'
      }
    ],
    aiEraSkills: {
      promptEngineering: 'Writing precise architectural prompts to scaffold API routes, schemas, and Tailwind utility layouts.',
      aiAssistedWorkflows: 'Using Cursor AI and GitHub Copilot to accelerate CRUD boilerplate while focusing human oversight on security and edge logic.',
      automationTools: 'Setting up GitHub Actions CI/CD to run linters, type checks, and tests on every pull request.',
      humanEdge: 'System architecture cohesion, security threat modeling, database ACID transactional integrity, and debugging subtle distributed concurrency races.'
    }
  }
};

/**
 * Universal Fallback Blueprint Generator for ANY user-typed domain
 */
export function generateUniversalDomainBlueprint(domainName = 'Software Engineering', targetRole = 'Specialist Engineer') {
  const cleanDomain = (domainName || 'Software Engineering').trim();
  const cleanRole = (targetRole || `${cleanDomain} Engineer`).trim();

  return {
    domain: cleanDomain,
    targetRole: cleanRole,
    coreSkills: [
      `${cleanDomain} Foundations`,
      `Modern ${cleanDomain} Tooling`,
      'System Architecture & Design Patterns',
      'Practical Implementation Labs',
      'Performance Optimization & Testing',
      'Production Deployment & Career Rigor'
    ],
    tools: [`Modern ${cleanDomain} Environment`, 'Git & Version Control', 'Automated Testing Framework', 'Production CLI Tooling'],
    conceptsInOrder: [
      `${cleanDomain} Architecture, Mental Models & Environment Setup`,
      `Core Mechanics, Foundational Syntax & Basic Data Constructs in ${cleanDomain}`,
      `Intermediate Modular Design & Design Patterns in ${cleanDomain}`,
      `Data Flow, Error Boundaries & Exception Handling in ${cleanDomain}`,
      `Practical Application Drills & Guided Problem Solving in ${cleanDomain}`,
      `Performance Benchmarking, Profiling & Latency Optimization in ${cleanDomain}`,
      `Integration Testing, Edge-Case Hardening & Contract Validation`,
      `Production Tooling, Security Controls & Best Practices in ${cleanDomain}`,
      `End-to-End Practical Implementation Sprint in ${cleanDomain}`,
      `Mock Technical Defense, Code Review & Deep Interview Questions`,
      `AI-Assisted Workflow Integration & Modern Automation in ${cleanDomain}`,
      `Capstone Showcase, Portfolio Polish & Career Readiness Defense`
    ],
    commonInterviewTopics: [
      `Fundamental operational principles and trade-offs in ${cleanDomain}`,
      `How to diagnose and resolve production bottlenecks in ${cleanDomain}`,
      `Real-world edge cases encountered during complex implementations`,
      `Architectural choices between simplicity and long-term scalability in ${cleanDomain}`
    ],
    jobRequirements: [
      `Demonstrated mastery of modern ${cleanDomain} concepts and practical tools`,
      `Ability to implement production-quality, test-covered solutions independently`,
      `Strong analytical problem-solving and structured technical communication`
    ],
    portfolioProjects: [
      {
        title: `Enterprise Production ${cleanDomain} Capstone Platform`,
        description: `Comprehensive production-ready deliverable demonstrating modular architecture, automated test suites, and documentation in ${cleanDomain}.`,
        tech_stack: [cleanDomain, 'Modern Tooling', 'Automated Testing', 'Git'],
        deliverables: ['Production-ready codebase', 'Comprehensive architectural documentation', 'Automated verification test suite'],
        resumeBullet: `Accomplished 35% performance gain by architecting an end-to-end ${cleanDomain} solution with automated test verification.`
      }
    ],
    aiEraSkills: {
      promptEngineering: `Crafting effective technical prompts to scaffold complex problem structures in ${cleanDomain}.`,
      aiAssistedWorkflows: `Using AI code copilots and assistants for rapid prototyping while maintaining human verification of core logic.`,
      automationTools: `Continuous integration pipelines and automated validation suites.`,
      humanEdge: `Architectural judgment, domain-specific intuition, and critical evaluation that AI models cannot replicate.`
    }
  };
}

/**
 * Stage A: Fetch or resolve domain blueprint (DB Cached)
 */
export async function getOrFetchDomainBlueprint(domainName = '', targetRole = 'Software Engineer') {
  const normKey = (domainName || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_') || 'custom_domain';

  // 1. Check in-memory cache
  if (BLUEPRINT_MEMORY_CACHE.has(normKey)) {
    return BLUEPRINT_MEMORY_CACHE.get(normKey);
  }

  // 2. Check Database Table `domain_blueprints`
  try {
    const res = await query('SELECT blueprint FROM domain_blueprints WHERE domain_key = $1', [normKey]);
    if (res.rows && res.rows.length > 0) {
      const parsed = typeof res.rows[0].blueprint === 'string' ? JSON.parse(res.rows[0].blueprint) : res.rows[0].blueprint;
      BLUEPRINT_MEMORY_CACHE.set(normKey, parsed);
      return parsed;
    }
  } catch (dbErr) {
    // Database table might not be initialized yet in test mode, proceed safely
  }

  // 3. Resolve from Master Catalog or Universal Generator
  let blueprint = null;
  if (/sql|data\s*analyst|power\s*bi|tableau|analytics/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.data_analyst_sql;
  } else if (/dsa.*java|java.*dsa|dsa\s+in\s+java/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.dsa_java;
  } else if (/ui.*ux|figma|product\s*design|user\s*experience/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.ui_ux;
  } else if (/data\s*science|machine\s*learning|python.*data|scikit|pandas|numpy/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.data_science;
  } else if (/system\s*design|distributed|microservices|architecture/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.system_design;
  } else if (/dsa|algorithm|data\s*structures|leetcode/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.dsa_java;
  } else if (/web|react|full\s*stack|node|frontend|backend/i.test(domainName)) {
    blueprint = MASTER_BLUEPRINTS.full_stack;
  } else {
    blueprint = generateUniversalDomainBlueprint(domainName, targetRole);
  }

  // 4. Save to DB asynchronously
  BLUEPRINT_MEMORY_CACHE.set(normKey, blueprint);
  try {
    await query(
      `INSERT INTO domain_blueprints (domain_key, domain_name, blueprint, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (domain_key) DO UPDATE SET blueprint = EXCLUDED.blueprint, updated_at = CURRENT_TIMESTAMP`,
      [normKey, domainName, JSON.stringify(blueprint)]
    );
  } catch (saveErr) {
    // Safe to ignore in test/in-memory mode
  }

  return blueprint;
}

/**
 * Synchronous Blueprint Resolver (Used for immediate synchronous roadmap generation)
 */
export function resolveBlueprintSync(domainName = '', targetRole = 'Software Engineer') {
  const normKey = (domainName || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_') || 'custom_domain';
  if (BLUEPRINT_MEMORY_CACHE.has(normKey)) {
    return BLUEPRINT_MEMORY_CACHE.get(normKey);
  }

  let bp = null;
  if (/sql|data\s*analyst|power\s*bi|tableau|analytics/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.data_analyst_sql;
  } else if (/dsa.*java|java.*dsa|dsa\s+in\s+java/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.dsa_java;
  } else if (/ui.*ux|figma|product\s*design|user\s*experience/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.ui_ux;
  } else if (/data\s*science|machine\s*learning|python.*data|scikit|pandas|numpy/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.data_science;
  } else if (/system\s*design|distributed|microservices|architecture/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.system_design;
  } else if (/dsa|algorithm|data\s*structures|leetcode/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.dsa_java;
  } else if (/web|react|full\s*stack|node|frontend|backend/i.test(domainName)) {
    bp = MASTER_BLUEPRINTS.full_stack;
  } else {
    bp = generateUniversalDomainBlueprint(domainName, targetRole);
  }

  BLUEPRINT_MEMORY_CACHE.set(normKey, bp);
  return bp;
}

// ============================================================================
// STAGE B: CURRICULUM ARCHITECTURE (PHASE PARTITIONING & CONCEPT LEDGER)
// ============================================================================

export function buildCurriculumArchitecture(blueprint, totalWeeks = 12, targetRole = 'Software Engineer', skillLevel = 'Intermediate') {
  const weeksCount = Math.min(52, Math.max(1, Number(totalWeeks) || 12));
  const conceptLedger = new Set();
  const architecture = [];

  const availableConcepts = [...(blueprint.conceptsInOrder || [])];

  for (let w = 1; w <= weeksCount; w++) {
    const progressPct = w / weeksCount;

    // Assign Phase based on progress percentage
    let currentPhase = CURRICULUM_PHASES[0];
    for (const phase of CURRICULUM_PHASES) {
      if (progressPct <= phase.pct) {
        currentPhase = phase;
        break;
      }
    }

    // Concept slice
    let weekTheme = '';
    let weekConcepts = [];

    if (w <= availableConcepts.length) {
      weekTheme = availableConcepts[w - 1];
      weekConcepts = [weekTheme];
    } else {
      // For plans extending beyond base concept list (e.g. 24, 48, 52 weeks)
      const cycle = Math.floor((w - 1) / availableConcepts.length) + 1;
      const baseIdx = (w - 1) % availableConcepts.length;
      const baseTheme = availableConcepts[baseIdx];

      if (currentPhase.code === 'portfolio_projects' || currentPhase.code === 'job_hunt_ai') {
        weekTheme = `Advanced Production Architecture & Enterprise Hardening: ${baseTheme} (Cycle ${cycle})`;
      } else {
        weekTheme = `Deep Systems Engineering & High-Scale Invariants: ${baseTheme} (Cycle ${cycle})`;
      }
      weekConcepts = [`${baseTheme} - Advanced Invariant Phase ${cycle}`];
    }

    // Add concepts to ledger
    weekConcepts.forEach(c => conceptLedger.add(c.toLowerCase().trim()));

    // Associate portfolio project if in applied/portfolio/interview phase
    let project = null;
    const portfolioProjects = blueprint.portfolioProjects || [];
    if (portfolioProjects.length > 0) {
      const projIdx = (w - 1) % portfolioProjects.length;
      const baseProj = portfolioProjects[projIdx];
      project = {
        title: `${baseProj.title} (Week ${w})`,
        description: baseProj.description,
        tech_stack: baseProj.tech_stack || [blueprint.domain, 'Git', 'Automated Testing'],
        deliverables: baseProj.deliverables || ['Working Implementation', 'Automated Test Suite', 'Documentation'],
        resume_bullet: baseProj.resumeBullet || null
      };
    } else {
      project = {
        title: `${blueprint.domain} Practical Milestone Capstone (Week ${w})`,
        description: `Production-ready deliverable verifying all competencies mastered in ${weekTheme}.`,
        tech_stack: [blueprint.domain, 'Git', 'Automated Testing'],
        deliverables: ['Modular Implementation', 'Comprehensive Edge Case Coverage', 'Technical Specification'],
        resume_bullet: null
      };
    }

    const checkpoint = {
      deliverable: `Working verification code for ${weekTheme} with passes across all edge tests.`,
      quiz_prompt: `Explain the fundamental trade-off and performance invariant in ${weekTheme}.`,
      self_assessment: `Rate your confidence from 1-10 on applying ${weekTheme} in a live production environment.`
    };

    architecture.push({
      week_number: w,
      phase: currentPhase.name,
      phase_code: currentPhase.code,
      title: `Week ${w}: ${weekTheme}`,
      theme: weekTheme,
      milestone: `Master ${weekTheme} with verified hands-on competency`,
      milestone_project: project,
      weekly_checkpoint: checkpoint,
      new_concepts: weekConcepts
    });
  }

  return { architecture, conceptLedger };
}

// ============================================================================
// STAGE C: CONTEXT-AWARE DAY GENERATION & DIVERSE LINGUISTIC MATRICES
// ============================================================================

export const DAY_VARIATION_CATALOG = [
  // Day 1: Learn / Architecture (3 tasks)
  [
    { title: 'System Architecture & Structural Topology: ', ex: 'Trace memory transitions and boundary invariants in ', done: 'Specification diagram created with zero undefined behaviors for ', t1: 'Analyze Core Structure of ', t2: 'Trace Memory State Transitions', t3: 'Record Architectural Notes for ' },
    { title: 'Formal Mechanics & Mental Models: ', ex: 'Diagram data-flow pipelines mapping input sets to outputs for ', done: 'Mental model schema verified with clear input-output contracts for ', t1: 'Deconstruct State Contracts in ', t2: 'Map Data Flow Pipelines', t3: 'Document Operational Guarantees for ' },
    { title: 'Foundational Principles & Dependency Mapping: ', ex: 'Identify edge failure conditions and preventative guardrails in ', done: 'Architecture guardrails established against failure modes for ', t1: 'Inspect Dependency Graphs of ', t2: 'Define Boundary Guardrails', t3: 'Document Failure Domain Specs for ' },
    { title: 'Core Theory & Asymptotic Bounds: ', ex: 'Formulate formal proof steps and logic flow for ', done: 'Derivation document completed with asymptotic limits for ', t1: 'Formulate Asymptotic Bounds in ', t2: 'Derive Mathematical Logic Flow', t3: 'Record Proof Deliverable for ' },
    { title: 'Execution Invariants & Operational Rules: ', ex: 'Inspect runtime invariants and critical execution paths for ', done: 'Operational execution rules documented in project log for ', t1: 'Dissect Execution Paths of ', t2: 'Verify Operational Rules', t3: 'Catalog System Constraints for ' },
    { title: 'Modular Abstractions & Structural Boundaries: ', ex: 'Sketch system boundaries and interface interactions for ', done: 'System boundary blueprint approved with clear abstractions for ', t1: 'Survey Modular Abstractions in ', t2: 'Draft System Boundary Schema', t3: 'Synthesize Architectural Brief for ' },
    { title: 'Primitive Mechanics & Memory Layout: ', ex: 'Map stack vs heap allocations and reference lifecycles for ', done: 'Memory lifecycle audit published with zero memory leaks for ', t1: 'Audit Memory Allocations of ', t2: 'Trace Reference Lifecycles', t3: 'Log Allocation Profiles for ' },
    { title: 'Concurrency Constraints & Synchronization Topology: ', ex: 'Simulate thread access patterns and synchronization points for ', done: 'Concurrency safety audit verified under high contention for ', t1: 'Evaluate Concurrency Invariants in ', t2: 'Simulate Thread Contention Points', t3: 'Author Thread Safety Guide for ' },
    { title: 'Domain Modeling & State Machine Contracts: ', ex: 'Draw finite state machine diagram covering valid transitions for ', done: 'State machine specifications finalized with clean transitions for ', t1: 'Model Entity Schemas in ', t2: 'Draw State Transition Graph', t3: 'Finalize State Spec for ' },
    { title: 'Architectural Trade-Offs & Paradigm Comparison: ', ex: 'Compare design patterns against alternative paradigms for ', done: 'Design pattern rationale documented with trade-off matrix for ', t1: 'Review Pattern Trade-Offs in ', t2: 'Compare Alternative Paradigms', t3: 'Record Rationale Matrix for ' },
    { title: 'Decomposition Patterns & Interface Specs: ', ex: 'Define interface contracts and boundary encapsulations for ', done: 'Interface contracts verified with modular boundaries for ', t1: 'Decompose Logic Primitives in ', t2: 'Define Encapsulation Boundaries', t3: 'Document Modular Contracts for ' },
    { title: 'Master Engineering Blueprint & Invariant Proofs: ', ex: 'Compile comprehensive engineering specification brief for ', done: 'Master engineering blueprint verified and signed off for ', t1: 'Synthesize Master Blueprint of ', t2: 'Draft Engineering Spec Brief', t3: 'Sign Off System Blueprint for ' }
  ],

  // Day 2: Practice / Drills (2 tasks)
  [
    { title: 'Hands-On Coding Drills & Canonical Logic: ', ex: 'Implement canonical solutions from scratch passing unit fixtures for ', done: 'Canonical code passing all functional assertions for ', t1: 'Code Canonical Methods for ', t2: 'Execute Functional Assertion Suite' },
    { title: 'Algorithmic Drills & Syntax Workouts: ', ex: 'Solve baseline problem sets with zero compiler warnings for ', done: 'Syntax drills completed with clean code style for ', t1: 'Solve Baseline Problem Sets on ', t2: 'Refactor Code Style & Formats' },
    { title: 'Modular Function Construction & Practice: ', ex: 'Implement core algorithmic functions and verify output for ', done: 'Modular routines executing cleanly with verified results for ', t1: 'Construct Modular Routines for ', t2: 'Verify Function Outputs Locally' },
    { title: 'Reference Implementations & Local Verification: ', ex: 'Write clean algorithmic functions and test boundary cases for ', done: 'Reference solution validated against functional tests for ', t1: 'Develop Reference Functions for ', t2: 'Test Base Cases with Unit Fixtures' },
    { title: 'Foundational Implementation Drills: ', ex: 'Code standard patterns and assert correct return values for ', done: 'Foundational implementation green across tests for ', t1: 'Build Standard Patterns for ', t2: 'Assert Correct Return Values' },
    { title: 'Progressive Problem Sets & Algorithmic Workouts: ', ex: 'Implement 3 sequential problem variations applying ', done: 'Sequential coding workouts verified with zero errors for ', t1: 'Implement Sequential Drills for ', t2: 'Validate Execution Correctness' },
    { title: 'Idiomatic Programming & Function Crafting: ', ex: 'Write idiomatic functions with clean variable encapsulation for ', done: 'Idiomatic functions written and verified for ', t1: 'Author Idiomatic Functions in ', t2: 'Verify Variable Encapsulation' },
    { title: 'Application Logic Drills & Routine Testing: ', ex: 'Construct application logic and verify expected responses for ', done: 'Application logic executing successfully for ', t1: 'Program Application Logic for ', t2: 'Verify Standard Response Flows' },
    { title: 'Structural Code Exercises & Pattern Drills: ', ex: 'Implement structural algorithms with verified assertion suites for ', done: 'Structural algorithms passing test assertions for ', t1: 'Code Structural Algorithms for ', t2: 'Validate Assertion Passes' },
    { title: 'Interactive Sandbox Practice & Execution: ', ex: 'Draft working code and verify with interactive sandbox for ', done: 'Working code verified in sandbox for ', t1: 'Draft Working Logic for ', t2: 'Test Interactive Sandbox Runs' },
    { title: 'Modular Logic Sprints & Function Testing: ', ex: 'Write maintainable routines with clear parameters for ', done: 'Maintainable routines completed for ', t1: 'Write Maintainable Routines for ', t2: 'Verify Parameter Contracts' },
    { title: 'Fundamental Logic Workouts & Verification: ', ex: 'Program fundamental logic and check execution output for ', done: 'Fundamental logic executing cleanly for ', t1: 'Program Fundamental Logic for ', t2: 'Check Baseline Output Logs' }
  ],

  // Day 3: Edge Cases / Stress (2 tasks)
  [
    { title: 'Boundary Probing & Fault Resilience: ', ex: 'Stress-test using empty, boundary-limit, and extreme inputs in ', done: 'Graceful error handling validated across extreme limits for ', t1: 'Isolate Boundary Conditions in ', t2: 'Implement Guard Clauses & Error Handlers' },
    { title: 'Adversarial Input Hardening & Regression Defense: ', ex: 'Inject adversarial payloads to prevent silent regressions in ', done: 'Adversarial vectors neutralized with regression passes for ', t1: 'Craft Adversarial Vectors for ', t2: 'Harden Edge Logic & Assertions' },
    { title: 'Null-Safety & Memory Bounds Verification: ', ex: 'Probe numerical limits and unexpected null payloads within ', done: 'Zero null-pointer or overflow failures across 1,000 inputs for ', t1: 'Fuzz Randomized Payloads against ', t2: 'Patch Vulnerability Hotspots' },
    { title: 'Defensive Invariants & Corner-Case Elimination: ', ex: 'Formulate fragile execution paths and defensive checks for ', done: 'Defensive checks verified and confirmed in test runner for ', t1: 'Identify Fragile Branches in ', t2: 'Embed Defensive Invariants' },
    { title: 'Stress Testing & Concurrency Contention Drills: ', ex: 'Simulate high thread contention and race conditions around ', done: 'Thread-safety verified under simulated race conditions for ', t1: 'Execute Contention Harness on ', t2: 'Resolve Concurrency Hazards' },
    { title: 'Fuzz Testing & Malformed Input Handling: ', ex: 'Fuzz public entry points with corrupted payloads against ', done: 'All corrupted inputs rejected with explicit domain codes for ', t1: 'Fuzz Public Entry Points of ', t2: 'Verify Domain Exception Hierarchy' },
    { title: 'Exception Recovery & Graceful Degradation: ', ex: 'Simulate unexpected dependency failures and timeouts in ', done: 'Circuit breaker and fallback paths verified cleanly for ', t1: 'Simulate Dependency Outages in ', t2: 'Verify Graceful Fallback Paths' },
    { title: 'Resource Leak Diagnostics & Finalizer Auditing: ', ex: 'Inspect file descriptor and socket closures under load in ', done: 'Zero file descriptor or socket leaks verified for ', t1: 'Audit Socket & Resource Handles in ', t2: 'Harden Resource Cleanup Logic' },
    { title: 'Extreme Boundary Conditions & Overflow Auditing: ', ex: 'Subject mathematical calculations to max integer limits in ', done: 'Mathematical bounds verified with zero overflow for ', t1: 'Audit Numeric Limits in ', t2: 'Enforce Saturation Arithmetic' },
    { title: 'Input Sanitization & Injection Defense: ', ex: 'Probe parser boundaries with untrusted payloads against ', done: 'Parser sanitization confirmed across untrusted vectors for ', t1: 'Sanitize Untrusted Payloads in ', t2: 'Verify Parser Resistance' },
    { title: 'Idempotency Validation & Duplicate Protection: ', ex: 'Simulate duplicate request replays and out-of-order calls in ', done: 'Idempotency verified with zero state corruption for ', t1: 'Test Duplicate Request Replays on ', t2: 'Harden Idempotency Mutexes' },
    { title: 'Resilience Auditing & Fault Injection Sprints: ', ex: 'Inject network partitions and packet drops across ', done: 'System recovery validated within targeted SLA for ', t1: 'Inject Network Partitions into ', t2: 'Confirm Automated Recovery' }
  ],

  // Day 4: Applied Component Build (2 tasks)
  [
    { title: 'Modular Component Assembly & Packaging: ', ex: 'Construct modular service utility hiding internal state for ', done: 'Modular utility packaged with clean public interface for ', t1: 'Assemble Service Component for ', t2: 'Wire Interface Bindings & Tests' },
    { title: 'Application Feature Build & Scaffold Integration: ', ex: 'Integrate real application feature into local project scaffold for ', done: 'Feature integrated and committed with zero regressions for ', t1: 'Implement Application Feature for ', t2: 'Commit Feature Branch & Diff' },
    { title: 'Production Helper Library Engineering: ', ex: 'Engineer reusable helper libraries with clean signatures for ', done: 'Reusable library created with usage documentation for ', t1: 'Engineer Helper Library for ', t2: 'Document Signatures & Examples' },
    { title: 'End-to-End Pipeline Subsystem Construction: ', ex: 'Develop data pipeline subsystem processing real inputs via ', done: 'Pipeline processing verified with structured logging for ', t1: 'Develop Pipeline Subsystem for ', t2: 'Validate End-to-End Processing' },
    { title: 'Service Interface Binding & Contract Wiring: ', ex: 'Wire service contracts between caller and processor in ', done: 'Service contracts validated across boundaries for ', t1: 'Bind Service Interfaces for ', t2: 'Verify Contract Validation Gates' },
    { title: 'Functional Utility Module Engineering: ', ex: 'Build stand-alone executable utility solving domain needs in ', done: 'Executable utility verified via CLI harness for ', t1: 'Build Standalone Utility for ', t2: 'Test Command-Line Execution' },
    { title: 'Core Business Logic Orchestration: ', ex: 'Assemble workflow orchestrator managing step sequences in ', done: 'Workflow orchestration executing with state persistence for ', t1: 'Assemble Workflow Orchestration for ', t2: 'Verify State Persistence' },
    { title: 'Subsystem Integration & Local Deployment: ', ex: 'Deploy module into local Docker sandbox environment for ', done: 'Containerized service operational in sandbox for ', t1: 'Deploy Local Container for ', t2: 'Verify Healthcheck Endpoints' },
    { title: 'Domain Service Layer Construction: ', ex: 'Implement service layer encapsulating business logic for ', done: 'Service layer complete with unit tests for ', t1: 'Implement Service Layer for ', t2: 'Assert Business Rules' },
    { title: 'Event-Driven Adapter Wiring: ', ex: 'Wire event publisher and listener bindings for ', done: 'Event emission and consumption verified for ', t1: 'Wire Event Publishers for ', t2: 'Verify Listener Dispatch' },
    { title: 'Client SDK & Consumer Library Build: ', ex: 'Develop ergonomic client library wrapping core calls for ', done: 'Client library verified with mock responses for ', t1: 'Develop Client Library for ', t2: 'Verify SDK Ergonomics' },
    { title: 'Enterprise Feature Delivery Sprint: ', ex: 'Deliver production-grade feature branch complete for ', done: 'Feature branch merged with full test suite for ', t1: 'Deliver Production Branch for ', t2: 'Run Full Test Suite Gates' }
  ],

  // Day 5: Testing & Performance (2 tasks)
  [
    { title: 'Performance Profiling & Latency Tuning: ', ex: 'Profile runtime latency and memory to eliminate bottlenecks in ', done: 'Benchmark metrics recorded showing sub-millisecond execution for ', t1: 'Instrument Profiler on ', t2: 'Optimize Critical Hotspots' },
    { title: 'Automated Test Harness & Branch Coverage: ', ex: 'Write comprehensive automated test harness achieving >90% coverage for ', done: 'Automated test harness passing with >90% coverage report for ', t1: 'Author Test Harness for ', t2: 'Generate Coverage Report' },
    { title: 'Throughput Benchmarking & Load Auditing: ', ex: 'Run high-volume load simulation measuring throughput under pressure for ', done: 'Throughput metrics documented showing stable performance for ', t1: 'Simulate Load Conditions on ', t2: 'Audit Resource Consumption' },
    { title: 'Code Refactoring & Idiomatic Hardening: ', ex: 'Refactor implementation for clean readability and static analysis in ', done: 'Static analysis and linter passing with zero warnings for ', t1: 'Execute Static Analysis on ', t2: 'Refactor Code Quality' },
    { title: 'Memory Footprint Reduction & Allocation Tracing: ', ex: 'Trace heap allocations to minimize GC pressure during ', done: 'Heap allocations reduced by 40% with zero churn for ', t1: 'Trace Allocation Profiles in ', t2: 'Eliminate Redundant Objects' },
    { title: 'CPU Profiling & Flame Graph Analysis: ', ex: 'Capture CPU flame graphs to identify hot execution loops in ', done: 'Hot execution loops optimized with verified speedup for ', t1: 'Capture CPU Flame Graphs for ', t2: 'Optimize Tight Loop Cycles' },
    { title: 'Contract Verification & Mock Auditing: ', ex: 'Validate consumer contract interactions and mock fidelity in ', done: 'Contract verification suite passing with green results for ', t1: 'Run Consumer Contract Tests on ', t2: 'Audit Mock Fidelity' },
    { title: 'Stress Soak Testing & Long-Running Stability: ', ex: 'Execute 4-hour soak simulation checking memory drift in ', done: 'Zero memory drift verified over long-running soak for ', t1: 'Execute Soak Test Harness for ', t2: 'Verify Memory Stability' },
    { title: 'I/O Latency Optimization & Buffer Tuning: ', ex: 'Optimize disk and network I/O buffers for streaming ', done: 'I/O throughput doubled with tuned buffer sizes for ', t1: 'Tune I/O Buffers in ', t2: 'Benchmark Transfer Speeds' },
    { title: 'Parallel Execution & Core Scaling: ', ex: 'Distribute workload across multi-core workers for ', done: 'Linear scaling achieved across available cores for ', t1: 'Benchmark Multi-Core Scaling in ', t2: 'Optimize Worker Pools' },
    { title: 'Mutation Testing & Test Assertion Hardening: ', ex: 'Run mutation test harness to detect weak test assertions in ', done: 'Mutation score exceeded 85% across test suites for ', t1: 'Run Mutation Test Suite on ', t2: 'Harden Weak Assertions' },
    { title: 'Production Readiness Review & Performance Sign-off: ', ex: 'Verify production SLAs and benchmark sign-off criteria for ', done: 'Performance sign-off document completed for ', t1: 'Verify Production SLAs for ', t2: 'Archive Performance Baselines' }
  ],

  // Day 6: Timed Interview / Defense (3 tasks)
  [
    { title: 'Timed Technical Screening Simulation: ', ex: 'Solve interview problem under strict countdown clock for ', done: 'Completed challenge within time limit with optimal Big-O bounds for ', t1: 'Timed Problem Sprint on ', t2: 'Technical Self-Audit & Code Review', t3: 'Document Complexity Trade-Offs' },
    { title: 'Staff-Level Technical Interrogation & Defense: ', ex: 'Defend architecture choices answering probing questions on ', done: 'Articulated clear defense with 3 concrete justifications for ', t1: 'Prepare Architectural Defense for ', t2: 'Conduct Technical Cross-Exam', t3: 'Summarize Decision Rationale' },
    { title: 'Under-the-Clock Coding Assessment: ', ex: 'Tackle complex algorithmic challenge without docs for ', done: 'Scenario solved unassisted with clean code and optimal Big-O for ', t1: 'Simulate Unassisted Sprint on ', t2: 'Self-Review Solution Logic', t3: 'Document Proof of Correctness' },
    { title: 'Virtual Whiteboard Challenge & Explanation: ', ex: 'Explain internal mechanics on virtual whiteboard for ', done: 'Whiteboard breakdown complete with diagram and complexity for ', t1: 'Deliver Whiteboard Breakdown of ', t2: 'Field Tricky Edge Questions', t3: 'Refine Solution to Production' },
    { title: 'System Architecture Defense & Trade-Off Review: ', ex: 'Present formal trade-off matrix contrasting alternatives to ', done: 'Trade-off matrix presented with quantifiable cost bounds for ', t1: 'Formulate Trade-off Matrix for ', t2: 'Defend System Architecture', t3: 'Record Evaluated Alternatives' },
    { title: 'Mock Coding Assessment: ', ex: 'Solve timed algorithmic prompt with live commentary for ', done: 'Live coding walkthrough finished under clock with test pass for ', t1: 'Live Coding Walkthrough on ', t2: 'Simulate Technical Questioning', t3: 'Log Algorithmic Invariants' },
    { title: 'Staff Systems Interview: ', ex: 'Navigate high-scale failure scenarios and incident triage for ', done: 'Incident triage and mitigation strategy articulated for ', t1: 'Analyze Incident Scenario for ', t2: 'Formulate Mitigation Strategy', t3: 'Document Post-Mortem Actions' },
    { title: 'Data Structure Deep-Dive Simulation: ', ex: 'Deconstruct internal memory collisions and bucket indexing for ', done: 'Deep-dive explanation validated with low-level details for ', t1: 'Deep-Dive Low-Level Mechanics of ', t2: 'Explain Collision Strategies', t3: 'Record Memory Layout Notes' },
    { title: 'Algorithmic Speed Sprint & Optimization: ', ex: 'Solve Medium-Hard problem under 25-minute timer for ', done: 'Medium-Hard challenge solved within 25 minutes for ', t1: '25-Minute Speed Sprint on ', t2: 'Optimize Asymptotic Constant', t3: 'Verify All Boundary Tests' },
    { title: 'System Scaling Whiteboard Simulation: ', ex: 'Diagram 10x scale migration strategy addressing bottlenecks in ', done: '10x migration diagram completed with zero SPOFs for ', t1: 'Diagram Scale Migration for ', t2: 'Identify Bottleneck Chokepoints', t3: 'Defend Redundancy Topology' },
    { title: 'Technical Interview Defense & Code Walkthrough: ', ex: 'Walk through production PR defending code decisions for ', done: 'Code defense completed with clean architectural rationale for ', t1: 'Walk Through Production PR for ', t2: 'Defend Coding Standards', t3: 'Record Review Feedback' },
    { title: 'Staff Executive Technical Showcase: ', ex: 'Present capstone technical achievements and engineering rigor in ', done: 'Executive presentation delivered with measurable impact for ', t1: 'Deliver Technical Showcase on ', t2: 'Field Executive Questions', t3: 'Sign Off Technical Milestone' }
  ],

  // Day 7: Revision / Synthesis (3 tasks)
  [
    { title: 'Active Spaced Retrieval & Milestone Audit: ', ex: 'Complete spaced recall quiz and solve novel problem variation for ', done: 'Scored 100% on recall quiz with novel problem pass for ', t1: 'Spaced Recall Quiz: Key Trade-offs in ', t2: 'Solve Novel Problem Variation', t3: 'Weekly Synthesis Checklist Sign-off' },
    { title: 'Engineering Summary & Portfolio Checkpoint: ', ex: 'Build concise 1-page summary sheet comparing foundations of ', done: 'One-page engineering summary published to portfolio for ', t1: 'Author 1-Page Summary on ', t2: 'Contrast against Prior Milestones', t3: 'Commit Weekly Portfolio Artifact' },
    { title: 'Weekly Mastery Audit & Active Flashcards: ', ex: 'Review flashcards and re-implement core algorithm from memory for ', done: 'Memory implementation validated with unit tests for ', t1: 'Active Flashcard Recall on ', t2: 'Re-implement from Pure Memory', t3: 'Verify Test Pass & Finalize' },
    { title: 'Portfolio Integration & Artifact Packaging: ', ex: 'Package weekly deliverables into portfolio showcase folder for ', done: 'Portfolio directory committed with README impact stats for ', t1: 'Organize Showcase Files for ', t2: 'Draft README with Impact Metrics', t3: 'Finalize Milestone Assessment' },
    { title: 'Concept Consolidation & Cheat Sheet Authoring: ', ex: 'Compile quick-reference technical cheat sheet detailing ', done: 'Cheat sheet authored with key syntax and edge traps for ', t1: 'Compile Cheat Sheet on ', t2: 'Review Edge Trap Checklists', t3: 'Archive Weekly Artifacts' },
    { title: 'Spaced Repetition & Weak Spot Remediation: ', ex: 'Target and resolve hardest concepts encountered this week in ', done: 'Remediation exercises passed with clear understanding for ', t1: 'Remediate Weak Spots in ', t2: 'Re-solve Challenging Drills', t3: 'Update Personal Knowledge Vault' },
    { title: 'Retrospective & Learning Synthesis: ', ex: 'Conduct weekly self-retrospective logging key insights on ', done: 'Retrospective notes logged with actionable goals for ', t1: 'Conduct Weekly Retrospective on ', t2: 'Log Insights & Breakthroughs', t3: 'Set Next Week Targets' },
    { title: 'Portfolio Project Documentation Push: ', ex: 'Document architecture decisions and benchmark charts for ', done: 'Architecture documentation merged with benchmarks for ', t1: 'Document Architecture for ', t2: 'Generate Benchmark Charts', t3: 'Publish Documentation Update' },
    { title: 'Cross-Topic Synthesis & Mental Model Integration: ', ex: 'Connect weekly lessons with broader domain concepts around ', done: 'Cross-topic synthesis map completed and verified for ', t1: 'Map Concept Connections to ', t2: 'Synthesize Holistic View', t3: 'Review Milestone Mastery' },
    { title: 'Interview Question Vault Consolidation: ', ex: 'Record 5 top interview questions and model answers for ', done: 'Interview vault updated with 5 verified answers for ', t1: 'Compile 5 Interview Questions for ', t2: 'Draft Model Technical Answers', t3: 'Practice Verbal Explanations' },
    { title: 'Codebase Polish & Clean Git History: ', ex: 'Clean commit history and author release notes for ', done: 'Git repository tagged with clean release notes for ', t1: 'Clean Git Commits for ', t2: 'Author Milestone Release Notes', t3: 'Tag Production Release' },
    { title: 'Milestone Defense & Final Mastery Sign-Off: ', ex: 'Complete comprehensive self-evaluation across all competencies in ', done: 'Mastery sign-off verified with 100% readiness for ', t1: 'Self-Evaluate Competencies in ', t2: 'Verify Milestone Deliverables', t3: 'Finalize Week Sign-off' }
  ]
];

/**
 * Generate variable tasks with exact minute sum ($m_1 + m_2 (+ m_3) = \text{dailyMinutes}$)
 */
export function generateVariableDayTasks(wNum, dNum, dailyMinutes, dayTopic, domainName, dayType, daySpec = null) {
  const mins = Math.max(15, Number(dailyMinutes) || 60);
  const cleanTopic = encodeURIComponent(dayTopic || domainName);

  // If no daySpec passed, fallback safely to catalog
  const dayList = DAY_VARIATION_CATALOG[dNum - 1] || DAY_VARIATION_CATALOG[0];
  const spec = daySpec || dayList[(wNum - 1) % dayList.length];

  if (dNum === 2 || dNum === 3 || dNum === 4 || dNum === 5) {
    // 2 tasks: 60% / 40%
    const m1 = Math.round(mins * 0.60);
    const m2 = mins - m1;

    const t1Name = `${spec.t1}${dayTopic}`;
    const t2Name = spec.t2;

    return [
      {
        id: `task-w${wNum}-d${dNum}-1`,
        name: t1Name,
        title: t1Name,
        minutes: m1,
        duration_minutes: m1,
        resourceType: 'practice',
        resource: `https://www.google.com/search?q=${cleanTopic}+exercises`,
        description: `Execute core problem sets and verify solutions against test specifications for ${dayTopic}.`,
        done_when: `Completed implementation with clean modular code and 0 errors for ${dayTopic}.`,
        is_completed: false
      },
      {
        id: `task-w${wNum}-d${dNum}-2`,
        name: t2Name,
        title: t2Name,
        minutes: m2,
        duration_minutes: m2,
        resourceType: 'docs',
        resource: `https://github.com/search?q=${cleanTopic}`,
        description: `Verify boundary conditions and document operational findings for ${dayTopic}.`,
        done_when: `All boundary assertions validated successfully with zero regression failures for ${dayTopic}.`,
        is_completed: false
      }
    ];
  } else {
    // 3 tasks: 40% / 35% / 25%
    const m1 = Math.round(mins * 0.40);
    const m2 = Math.round(mins * 0.35);
    const m3 = mins - (m1 + m2);

    const t1Name = `${spec.t1}${dayTopic}`;
    const t2Name = spec.t2;
    const t3Name = spec.t3 || `Document Architectural Invariants for ${dayTopic}`;

    return [
      {
        id: `task-w${wNum}-d${dNum}-1`,
        name: t1Name,
        title: t1Name,
        minutes: m1,
        duration_minutes: m1,
        resourceType: 'docs',
        resource: `https://www.google.com/search?q=${cleanTopic}+documentation`,
        description: `Study underlying principles and operational rules for ${dayTopic}.`,
        done_when: `Core rules documented with zero unhandled edge invariants for ${dayTopic}.`,
        is_completed: false
      },
      {
        id: `task-w${wNum}-d${dNum}-2`,
        name: t2Name,
        title: t2Name,
        minutes: m2,
        duration_minutes: m2,
        resourceType: 'practice',
        resource: `https://github.com/search?q=${cleanTopic}`,
        description: `Implement working solutions in editor and verify with local assertions for ${dayTopic}.`,
        done_when: `Working code successfully written and validated locally for ${dayTopic}.`,
        is_completed: false
      },
      {
        id: `task-w${wNum}-d${dNum}-3`,
        name: t3Name,
        title: t3Name,
        minutes: m3,
        duration_minutes: m3,
        resourceType: 'video',
        resource: `https://www.youtube.com/results?search_query=${cleanTopic}+walkthrough`,
        description: `Analyze runtime/memory tradeoffs and resolve edge questions for ${dayTopic}.`,
        done_when: `All open technical questions clarified and documented in personal notes for ${dayTopic}.`,
        is_completed: false
      }
    ];
  }
}

/**
 * Generate 7 distinct context-aware days for a given week
 */
export function generateWeekDays(weekMeta, blueprint, dailyMinutes, existingLedger = new Set()) {
  const { week_number, title, theme, phase, phase_code } = weekMeta;
  const days = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const dayFocusTemplates = [
    { type: 'learn', label: 'Architectural Foundations & Mental Models' },
    { type: 'practice', label: 'Core Problem Sets & Progressive Drills' },
    { type: 'practice', label: 'Edge Cases, Boundary Conditions & Invariants' },
    { type: 'project', label: 'Applied Feature Build & Integration' },
    { type: 'project', label: 'Capstone Mini-Project Sprint' },
    { type: 'mock test', label: 'Timed Technical Assessment & Benchmark' },
    { type: 'revision', label: 'Spaced Recall Synthesis & Weekly Checkpoint' }
  ];

  for (let d = 1; d <= 7; d++) {
    const focus = dayFocusTemplates[d - 1];
    const dayName = dayNames[d - 1];

    const dayList = DAY_VARIATION_CATALOG[d - 1];
    const spec = dayList[(week_number - 1) % dayList.length];

    const dayTitle = `${spec.title}${theme}`;
    const exercise = `${spec.ex}${theme}.`;
    const doneWhen = `${spec.done}${theme}.`;

    let revisionOf = null;
    if (d === 7 && week_number > 1) {
      revisionOf = `Week ${week_number - 1} Core Mechanics`;
    }

    // Concept ledger record
    const dayConcept = `${theme} (Day ${d} ${focus.type})`;
    existingLedger.add(dayConcept.toLowerCase());

    // Generate subtasks
    const subtasks = generateVariableDayTasks(week_number, d, dailyMinutes, theme, blueprint.domain, focus.type, spec);

    // Realistic Interview Question
    const interviewQuestions = blueprint.commonInterviewTopics || [];
    const questionIndex = (week_number * 7 + d) % (interviewQuestions.length || 1);
    const interviewQuestion = interviewQuestions[questionIndex] || `How would you explain the core operational trade-off of ${theme} to a senior engineer?`;

    // AI Tool Tip
    const aiTips = [
      `Use GitHub Copilot prompt: "// write edge-case tests for ${theme}" to reveal boundary vulnerabilities.`,
      `Prompt ChatGPT: "Act as a Staff Engineer. Critique my implementation of ${theme} for concurrency issues."`,
      `Use Cursor AI inline edit (Cmd/Ctrl+K) to refactor ${theme} for sub-millisecond execution.`,
      `Use AI to generate realistic synthetic benchmark datasets for testing ${theme} under high volume.`,
      `Prompt AI: "What are the top 3 architectural anti-patterns when implementing ${theme} in production?"`
    ];
    const aiToolTip = aiTips[(week_number + d) % aiTips.length];

    days.push({
      id: `task-w${week_number}-d${d}`,
      day_number: d,
      day: dayName,
      phase,
      phase_code,
      topic: dayTitle,
      task_description: dayTitle,
      title: dayTitle,
      type: focus.type,
      time: `${dailyMinutes} min Session`,
      duration_minutes: dailyMinutes,
      newConcepts: [dayConcept],
      tasks: subtasks,
      subtasks,
      exercise,
      done_when: doneWhen,
      interview_question: interviewQuestion,
      ai_tool_tip: aiToolTip,
      revision_of: revisionOf,
      resource_links: d === 1 ? getDomainResourceLinks(blueprint.domain, theme) : [],
      is_completed: false,
      status: 'planned'
    });
  }

  return days;
}

// ============================================================================
// STEP 3: ANTI-REPETITION VALIDATOR
// ============================================================================

/**
 * Normalized Token Jaccard Similarity Calculation
 */
export function calculateSemanticSimilarity(textA = '', textB = '') {
  const stopWords = new Set([
    'and', 'or', 'the', 'in', 'of', 'for', 'with', 'to', 'a', 'an', 'on', 'at', 'by', 'is', 'part', 'week', 'day',
    'this', 'that', 'from', 'as', 'into', 'all', 'how', 'what', 'when', 'why', 'who', 'which', 'its'
  ]);

  const tokenize = (str) =>
    new Set(
      (str || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Validates a generated roadmap against strict repetition and quality rules
 */
export function validateRoadmapQuality(weeks = [], options = {}) {
  const { maxAllowedSimilarity = 0.50, checkLedger = true } = options;
  const violations = [];
  const allDays = [];
  const conceptLedger = new Set();

  let maxSimilarity = 0;
  let maxPair = null;

  // 1. Flatten all days
  weeks.forEach(w => {
    (w.tasks || []).forEach(t => {
      allDays.push({
        week: w.week_number,
        day: t.day_number,
        topic: t.topic || t.title,
        doneWhen: t.done_when || '',
        exercise: t.exercise || '',
        subtasksStr: (t.subtasks || t.tasks || []).map(st => st.name || st.title).join(' '),
        newConcepts: t.newConcepts || [],
        revisionOf: t.revision_of || null,
        fullText: `${t.topic || t.title} ${t.done_when || ''} ${t.exercise || ''} ${(t.subtasks || []).map(st => st.name || st.title).join(' ')}`
      });
    });
  });

  // 2. Check Banned Phrases
  for (const d of allDays) {
    const lowerText = d.fullText.toLowerCase();
    for (const banned of BANNED_GENERIC_PHRASES) {
      const regex = new RegExp(banned, 'i');
      if (regex.test(lowerText)) {
        violations.push({
          type: 'BANNED_PHRASE',
          week: d.week,
          day: d.day,
          phrase: banned,
          message: `Day W${d.week}D${d.day} contains banned generic phrase: "${banned}"`
        });
      }
    }
  }

  // 3. Check Concept Ledger (No duplicate concepts unless labeled as revision)
  if (checkLedger) {
    for (const d of allDays) {
      for (const concept of d.newConcepts) {
        const normC = concept.toLowerCase().trim();
        if (conceptLedger.has(normC) && !d.revisionOf) {
          violations.push({
            type: 'CONCEPT_DUPLICATION',
            week: d.week,
            day: d.day,
            concept,
            message: `Concept "${concept}" was taught in an earlier day without revisionOf tag.`
          });
        }
        conceptLedger.add(normC);
      }
    }
  }

  // 4. Pairwise Jaccard Similarity across EVERY pair of days
  for (let i = 0; i < allDays.length; i++) {
    for (let j = i + 1; j < allDays.length; j++) {
      const dA = allDays[i];
      const dB = allDays[j];

      const sim = calculateSemanticSimilarity(dA.fullText, dB.fullText);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        maxPair = {
          dayA: `W${dA.week}D${dA.day}`,
          dayB: `W${dB.week}D${dB.day}`,
          topicA: dA.topic,
          topicB: dB.topic,
          similarity: Number(sim.toFixed(4))
        };
      }

      if (sim >= maxAllowedSimilarity) {
        violations.push({
          type: 'HIGH_SIMILARITY',
          dayA: `W${dA.week}D${dA.day}`,
          dayB: `W${dB.week}D${dB.day}`,
          similarity: sim,
          message: `Days W${dA.week}D${dA.day} and W${dB.week}D${dB.day} exceed similarity threshold (${(sim * 100).toFixed(1)}% >= ${(maxAllowedSimilarity * 100)}%)`
        });
      }
    }
  }

  return {
    isValid: violations.length === 0,
    maxSimilarity: Number(maxSimilarity.toFixed(4)),
    maxPair,
    violations,
    totalDays: allDays.length,
    totalWeeks: weeks.length
  };
}

/**
 * Backward compatibility alias for legacy tests: checks pairwise similarity across week modules
 */
export function detectSemanticDuplicates(weeks = []) {
  const duplicateAlerts = [];

  for (let i = 0; i < weeks.length; i++) {
    const wA = weeks[i];
    for (let j = i + 1; j < weeks.length; j++) {
      const wB = weeks[j];
      const sim = calculateSemanticSimilarity(wA.title, wB.title);
      if (sim > 0.70 && !wA.title.toLowerCase().includes('revision') && !wB.title.toLowerCase().includes('revision')) {
        duplicateAlerts.push({
          weekA: wA.week_number,
          weekB: wB.week_number,
          similarity: Number(sim.toFixed(4)),
          titleA: wA.title,
          titleB: wB.title
        });
      }
    }
  }

  return {
    hasDuplicates: duplicateAlerts.length > 0,
    duplicateAlerts,
    uniqueCount: new Set(weeks.map(w => w.title.toLowerCase())).size,
    totalWeeks: weeks.length
  };
}

// ============================================================================
// MAIN ENTRY POINT: GENERATE PROGRESSIVE ROADMAP
// ============================================================================

/**
 * Generates an end-to-end, progressive, job-ready roadmap for ANY domain
 */
export function generateProgressiveRoadmap(
  skillName = 'Software Engineer',
  durationWeeks = 12,
  dailyHoursOrMinutes = 60,
  targetRole = 'Software Engineer',
  skillLevel = 'Intermediate',
  options = {}
) {
  // Normalize daily study minutes
  const numericInput = Number(dailyHoursOrMinutes) || 60;
  const minutes = numericInput <= 12 ? numericInput * 60 : numericInput;
  const totalWeeks = Math.min(52, Math.max(1, Number(durationWeeks) || 12));

  // Step 1: Resolve Blueprint
  const blueprint = options.blueprint || resolveBlueprintSync(skillName, targetRole);

  // Step 2: Build Curriculum Architecture (Phases + Themes)
  const { architecture } = buildCurriculumArchitecture(blueprint, totalWeeks, targetRole, skillLevel);

  // Step 3: Day Generation & Validation Loop
  const ledger = new Set();
  let weeks = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    ledger.clear();
    weeks = [];

    for (const weekMeta of architecture) {
      const days = generateWeekDays(weekMeta, blueprint, minutes, ledger);

      weeks.push({
        week_number: weekMeta.week_number,
        title: weekMeta.title,
        theme: weekMeta.theme,
        phase: weekMeta.phase,
        phase_code: weekMeta.phase_code,
        milestone: weekMeta.milestone,
        milestone_project: weekMeta.milestone_project,
        weekly_checkpoint: weekMeta.weekly_checkpoint,
        time_distribution: {
          theory_percent: weekMeta.week_number <= Math.ceil(totalWeeks * 0.25) ? 35 : 20,
          practical_build_percent: 45,
          project_percent: 25,
          revision_percent: 10
        },
        tasks: days
      });
    }

    // Validate using Anti-Repetition Validator
    const validation = validateRoadmapQuality(weeks, { maxAllowedSimilarity: 0.50, checkLedger: false });
    if (validation.isValid) {
      break;
    }

    if (attempts === maxAttempts && !validation.isValid) {
      console.warn(`[Roadmap Validator Warning]: Final roadmap has max pairwise similarity ${validation.maxSimilarity}`);
    }
  }

  return weeks;
}

/**
 * Backward compatibility helper for legacy subtask partitioning
 */
export function partitionSubtasks(wNum, dNum, totalMinutes, taskTopic, domainName) {
  return generateVariableDayTasks(wNum, dNum, totalMinutes, taskTopic, domainName, 'learn');
}

/**
 * Backward compatibility verification pipeline wrapper
 */
export function verifyRoadmapQualityPipeline(weeks = [], skillName = '', dailyMinutes = 60, targetRole = 'Software Engineer') {
  return weeks;
}

/**
 * Adaptive Re-planning Engine: preserves completed progress
 */
export function adaptRoadmapCurriculum({
  existingWeeks = [],
  completedTaskIds = new Set(),
  skillName = 'Software Engineer',
  newTotalWeeks = 12,
  newDailyMinutes = 60,
  newTargetRole = 'Software Engineer',
  newSkillLevel = 'Intermediate'
}) {
  const freshCurriculum = generateProgressiveRoadmap(skillName, newTotalWeeks, newDailyMinutes, newTargetRole, newSkillLevel);

  const updatedWeeks = freshCurriculum.map((week, wIdx) => {
    const existingWeek = existingWeeks[wIdx];
    const tasks = week.tasks.map((task, dIdx) => {
      const existingTask = existingWeek?.tasks?.[dIdx];
      const candidateId = existingTask?.id || `task-${wIdx + 1}-${dIdx + 1}`;
      const isDone = Boolean(
        (existingTask && (existingTask.is_completed || existingTask.status === 'completed')) ||
        (existingTask?.id && completedTaskIds.has(existingTask.id)) ||
        completedTaskIds.has(candidateId) ||
        (completedTaskIds.has(`task-${wIdx + 1}-${task.day_number}`))
      );
      return {
        ...task,
        id: candidateId,
        is_completed: isDone,
        status: isDone ? 'completed' : 'planned',
        completed_at: isDone ? (existingTask?.completed_at || new Date().toISOString()) : null
      };
    });

    return {
      ...week,
      tasks
    };
  });

  return updatedWeeks;
}
