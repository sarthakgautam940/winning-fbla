# Scope: What the Seven Official References Imply for the Curriculum

Prepared 2026-11-01 for the FBLA Data Science & AI study app (2026-2027 season).
The national guideline (Updated August 2026) lists seven "References for Knowledge Areas & Objectives". Each one was opened on 2026-11-01; sources are listed in section 10.

**Status tags** (same as `research/event.md`): CONFIRMED = read in the opened source; INFERRED = my conclusion; UNVERIFIED = could not be confirmed.

**Why these references matter.** MBA Research's Data Science & AI study guide says the objectives were built from six of these sources (Youcubed, ACM, CodeHS, AI4K12, IBM, Harvard), and the Data Science & AI objectives, unlike FBLA's business events, carry no MBA Research performance-indicator codes. INFERRED: item writers draw directly on these references, so their vocabulary is the most likely vocabulary of the test.

Contents

1. The 44 official objectives (paraphrased) and which references cover them
2. AI4K12 Grade Band Progression Charts
3. ACM Computing Competencies for Undergraduate Data Science Curricula (2021)
4. CodeHS Intro to AI Syllabus
5. Google Cloud: What is artificial intelligence (AI)
6. Harvard: Data Science Principles
7. IBM Data Science Professional Certificate (Coursera)
8. Youcubed: DS Learning Objectives and Standards by Unit
9. Terms and topics to make sure we teach (beyond the baseline)
10. Sources

---

## 1. The official objectives and where the references cover them

The objectives below are paraphrased from the 2026-2027 national guideline (identical to 2025-2026). Codes are mine, for cross-referencing. Coverage is my mapping (INFERRED) from the reference content summarized in sections 2-8.

Reference keys: **AI4K12**, **ACM**, **CodeHS**, **Google**, **Harvard**, **IBM**, **Youcubed**.

### Probability and Statistics Foundations (15 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| PS1 | Compute mean, median, mode, range | Youcubed U2 (measures of center); IBM (descriptive statistics) |
| PS2 | Measures of spread: standard deviation, variance, covariance | IBM (descriptive statistics, correlation); Youcubed U1-U2 (variability). Covariance named in none |
| PS3 | Gaussian (normal) distribution: properties and importance | Not taught directly by any reference. ACM touches z-scores and Gaussian mixture models; Youcubed U2 covers distributions generally |
| PS4 | Calculate the expected value of a random variable | Not taught directly. ACM lists random variables and probability axioms (T1); Youcubed U4 covers probability |
| PS5 | Variable types (continuous vs discrete) | ACM (discrete/continuous; nominal/ordinal/interval/ratio); AI4K12 3-C-i (discrete, binary, continuous features); Youcubed U2, U5 |

### Data Analysis and Statistics for AI (15 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| DA1 | Choose the best visual for a dataset | IBM (Data Visualization course); ACM AP-Visualization; Youcubed U1, U2, U5 |
| DA2 | Diagram types such as box plots, histograms, scatter plots | IBM; Youcubed U2, U5; ACM AP |
| DA3 | Multivariate techniques: dependence vs interdependence methods; multiple linear and logistic regression | IBM (multiple linear, logistic regression; PCA); ACM (linear and logistic models; PCA, ICA, clustering). The "dependence/interdependence" wording appears in none of the seven |
| DA4 | Why data cleaning matters | IBM (data wrangling; Data Preparation stage); ACM DG-Data Cleaning; AI4K12 3-C-ii; Youcubed U6 |
| DA5 | Data-quality threats: duplicates, low-quality sources, incomplete data | ACM (data-quality dimensions, entity resolution); AI4K12 3-C-ii/iii (representativeness, bias); Youcubed U2 (sampling bias); Harvard (data quality) |
| DA6 | Applying algorithms to real problems: linear regression, decision trees, k-means | IBM (ML course, capstone); ACM DM/ML; AI4K12 3-A-ii, 3-A-v; Youcubed U3 (regression), U5 (clustering) |

### Tools for Data and AI (10 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| TL1 | Write SQL queries | IBM (Databases and SQL course; EDA with SQL in capstone); ACM DM-Information Retrieval |
| TL2 | Common packages: Pandas, NumPy, PyTorch | IBM (pandas, NumPy, SciPy, scikit-learn, Matplotlib, Seaborn); ACM (PyTorch, TensorFlow, Caffe); AI4K12 3-C-iii (Pandas) |
| TL3 | Python for cleaning and wrangling | IBM (Python and Data Analysis courses) |
| TL4 | R for data science | IBM (R, RStudio, ggplot) |
| TL5 | Characteristics of relational databases | IBM (relational concepts, constraints, DDL/DML, RDBMS vs NoSQL); ACM (relational databases and SQL) |

### AI Basics (10 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| AB1 | What generative AI is | Google; CodeHS M1 (generative vs predictive AI); IBM Generative AI course |
| AB2 | Generative AI capabilities and limitations | Google; CodeHS M4 (hallucinations, risks); IBM Generative AI course (challenges) |
| AB3 | Uses of generative AI (healthcare, research, digital art) | Google (healthcare, research, entertainment); IBM (data generation and augmentation); CodeHS (image generation) |
| AB4 | AI subfields: computer vision, NLP, human interaction, robotics | ACM AI-General (subfield list); Google (ML, DL, NLP, computer vision); AI4K12 Big Ideas 1 and 4 |
| AB5 | Define large language models | Google; CodeHS M1; AI4K12 2-A-iv (transformers); Harvard |
| AB6 | LLM capabilities | Google (summarize, translate, write, code, multimodal); CodeHS (Chatbot Arena comparison) |

### Machine Learning (10 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| ML1 | What machine learning is | AI4K12 Big Idea 3; Google; CodeHS M2; IBM; ACM |
| ML2 | Training, test, and validation sets | AI4K12 3-A-iv; ACM; IBM (cross-validation, overfitting); Youcubed U7 |
| ML3 | How algorithms behave: neural networks, decision trees, learning functions | AI4K12 3-A-v, 3-B; ACM; IBM ML course |
| ML4 | Supervised vs unsupervised vs reinforcement learning | AI4K12 3-A-i; CodeHS M2; ACM; IBM |
| ML5 | Pick the right learning type for a reasoning problem | AI4K12 3-A-vi (stated almost word for word); AI4K12 2-C-i/ii |
| ML6 | Deep learning | Google; ACM ML-Deep Learning; IBM (neural networks and deep learning); AI4K12 3-B-i |

### Perception, Representation, and Reasoning (10 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| PR1 | How predicate logic is used in AI models | AI4K12 2-A-ii, 2-C-i; ACM AI-KR&R (logic-based) |
| PR2 | Examples of predicate logic | AI4K12 2-A-ii (syllogism written with quantifier and implication) |
| PR3 | Logic-based vs probability-based reasoning | ACM (separate logic-based and probability-based KR&R sub-domains); AI4K12 (symbolic vs numerical; logical deduction vs statistical inference) |
| PR4 | Bayesian networks: nodes, edges, directed acyclic graphs | ACM (Bayesian networks: inference, belief propagation, independence relations); AI4K12 2-C-ii; AI4K12 2-A-iii (graph vocabulary) |
| PR5 | Knowledge representation and reasoning | AI4K12 Big Idea 2; ACM AI-KR&R |

### Privacy and Ethics (10 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| PE1 | Dilemmas from AI: self-driving vehicles, generative AI, surveillance | AI4K12 5-B-i, 5-B-ii; CodeHS M4 (AI on Trial); Google (risks); ACM PR (ethics, automation) |
| PE2 | How AI inherits bias (algorithmic bias) | AI4K12 3-C-iii, 5-A-i; CodeHS M3-M4; Google; ACM PR; Youcubed U6 |
| PE3 | Security and privacy risks of LLMs | CodeHS M4 (security risks, prompt injection); ACM DPSIA (data poisoning, adversarial attacks); AI4K12 5-B-ii |
| PE4 | LLM credibility: hallucinations, misinformation | CodeHS M4; Google (inaccurate outputs, review AI-generated code); AI4K12 (deepfakes) |

### Data Literacy and Foundations (20 items)

| Code | Objective (paraphrase) | References that cover it |
|---|---|---|
| DL1 | What data science is | IBM Data Science Foundations; Harvard; ACM |
| DL2 | Structured vs unstructured data | IBM (data literacy module: data types, file formats, RDBMS vs NoSQL); ACM DG (text, images, video). The exact words were not seen in the opened pages |
| DL3 | Numeric vs categorical data points | Youcubed U5; IBM (categorical to quantitative); ACM (nominal/ordinal/interval/ratio) |
| DL4 | Convert binary, hexadecimal, decimal | Only ACM CCF (bits, bytes, words; numeric representation and precision). No reference teaches base conversion directly |
| DL5 | Data gathered from various sources | IBM (APIs, web scraping, data sources); ACM DG/DM (databases, IoT, images, video); AI4K12 Big Idea 1 (sensors); Youcubed (surveys, Google Data Commons) |
| DL6 | Why wrangling and transformation matter | IBM (Data Wrangling module); ACM DG-Data Transformation; Youcubed U6 (normalization) |
| DL7 | Stages of the data science process | IBM (Foundational Methodology, 10 stages; CRISP-DM, 6 stages); Youcubed U8; ACM (data cycle); CodeHS (ML lifecycle); AI4K12 3-A-iv (ML steps) |

**Gaps (INFERRED):** PS3 (normal distribution), PS4 (expected value), covariance, DL4 (base conversion), and the dependence/interdependence wording in DA3 are not taught directly by any of the seven references. Test writers must be using general textbook knowledge for these, so the app should teach them from standard definitions. All are already in the app's baseline list.

**Near-verbatim matches (CONFIRMED by comparing wording; significance INFERRED):** several FBLA objectives are close rewrites of specific reference cells, which makes those cells especially likely item sources:

- ML5 matches AI4K12 3-A-vi (9-12): select supervised, unsupervised, or reinforcement learning for a reasoning problem.
- ML4 matches AI4K12 3-A-i (9-12): define/characterize supervised, unsupervised, and reinforcement learning.
- ML3 echoes AI4K12 3-A-v (9-12): how decision trees, neural networks, and regression change their internal representations.
- PR3 mirrors ACM's two AI sub-domains "Knowledge representation and reasoning (logic-based)" and "(probability-based)".
- PR1-PR2 match ACM's predicate-logic topic and AI4K12 2-A-ii (syllogisms in predicate logic).
- AB4's subfield list echoes ACM AI-General's list of AI subfields.

---

## 2. AI4K12 Grade Band Progression Charts

**What it is.** AI4K12's draft national guidelines for teaching AI in K-12. They are organized by Five Big Ideas and four grade bands (K-2, 3-5, 6-8, 9-12). Each cell gives an **LO** (learning objective: what students should be able to do), an **EU** (enduring understanding: what students should know), and often an "Unpacked" explanation with examples. The page says the guidelines are drafts open for public comment. Chart versions: Big Idea 1 v0.1 (May 28, 2020); Big Idea 2 v0.1 (June 28, 2021, links updated July 30, 2021); Big Idea 3 v0.1 (November 19, 2020); Big Idea 4 v0.2 (March 14, 2022); Big Idea 5 v0.1 (December 22, 2022). CONFIRMED.

**The Five Big Ideas (exact names):** 1. Perception; 2. Representation & Reasoning; 3. Learning; 4. Natural Interaction; 5. Societal Impact. CONFIRMED.

**Structure of each chart:** a "Key Insights" table (Big Ideas 2-5), then rows of concepts with codes such as 1-A-ii. The 9-12 column is summarized below (paraphrased; technical terms kept). Where the 9-12 cell builds on a lower band, the lower-band term is added in brackets because the test is high-school level but test writers may draw from any band.

### Big Idea 1: Perception
Idea: computers sense the world through sensors; perception means extracting meaning from sensory signals using knowledge, in stages that move from raw signal to increasingly abstract features.

- **1-A-i Sensing (living things):** N/A at 9-12 (already covered); enrichment: optical illusions (Muller-Lyer, Kanizsa triangle).
- **1-A-ii Sensing (computer sensors):** describe limitations and advantages of sensor types. Sensors measure light, sound, temperature, pressure. Limits: camera resolution, dynamic range, spectral sensitivity; microphone sensitivity and frequency response; noise. Some sensors detect what humans cannot (infrared, ultraviolet, ultrasonic).
- **1-A-iii Sensing (digital encoding):** explain how radar, lidar, GPS, and accelerometer data are represented. Radar and lidar produce depth images (each pixel is a depth value, from the time a reflected signal takes to return); GPS triangulates position from timed satellite signals into latitude and longitude; accelerometers measure acceleration along three orthogonal axes. [Lower bands: an image is a 2D array of pixels with brightness or RGB values; sound is digitized by sampling the waveform thousands of times per second.]
- **1-B-i Processing (sensing vs perception):** explain perception algorithms in real applications: license-plate and zip-code readers, face-based phone unlock, tagging people in photos, object identification (Google Lens), voice-based customer service. [3-5: an automatic door reacting to a pressure pad is sensing, not perception.]
- **1-B-ii Feature extraction:** explain how features are extracted from waveforms and images: a speech spectrogram shows energy by frequency band; formants are regions of concentrated energy; image feature extraction starts with edge detection (intensity gradients at multiple scales).
- **1-B-iii Abstraction pipeline (language):** speech understanding hierarchy: waveforms, articulatory gestures, sounds, morphemes, words, phrases, sentences; higher-level knowledge resolves lower-level ambiguity ("recognize speech" vs "wreck a nice beach").
- **1-B-iv Abstraction pipeline (vision):** higher-level perceptual reasoning draws on lower levels: scenes are made of objects, objects of surfaces and boundaries, boundaries are marked by contours, contours are made of edges, edges of pixels; occlusion is inferred from the arrangement of surfaces.
- **1-C-i Domain knowledge:** analyze online image datasets (ImageNet, COCO) and the domain knowledge they provide; domain knowledge is often statistics gathered from millions of images or sentences (also word prediction while typing).
- **1-C-ii Inclusivity:** technical difficulties in making perception work for diverse groups (dark or low-contrast facial features, children's higher-pitched and less clearly articulated speech).

### Big Idea 2: Representation & Reasoning
Idea: computers (agents) keep internal representations of the world and use them to reason.
Key insights: representations are data structures and reasoning methods are algorithms; representation and reasoning depend on each other; the two major kinds of knowledge representation are **symbolic** (reasoned with logical inference rules) and **numerical** (reasoned with mathematical functions such as neural networks); "knowing" something means being able to represent it and reason with it; an agent counts as intelligent if it runs a non-trivial **sense-deliberate-act** cycle (a garage-door opener does not).

- **2-A-i Abstraction:** represent a concept as a **schema**: list its superconcepts and properties, some inherited (schema.org); millions of websites use schemas so that AI programs using **knowledge graphs** (search engines, recommender systems) can understand them. [3-5: geometric vs topological maps.]
- **2-A-ii Symbolic representations:** translate a **syllogism** from English into logical notation and complete it. Parts: major premise, minor premise, conclusion. Example form in predicate logic: for all x, Human(x) implies Mammal(x); for all x, Mammal(x) implies LivingThing(x); therefore for all x, Human(x) implies LivingThing(x). Syllogistic reasoning is logical deduction used by AI reasoners working with taxonomies.
- **2-A-iii Data structures:** describe how schemas structure information in knowledge graphs (attributes and relationships; the Restaurant schema inherits from FoodEstablishment; Google knowledge panels). [6-8: a graph is labeled nodes joined by labeled links, each link with a source and a target; trees are a special case. 3-5: tree vocabulary: root, parent, child, leaves or terminal nodes, non-terminal nodes.]
- **2-A-iv Feature vectors:** describe how a **transformer network** works: it maps sequences of input words to sequences of output words, with words represented as feature vectors (word embeddings), fed in and produced one vector at a time. [6-8: word embeddings place similar words near each other in feature space; used in machine translation and text generation (BERT, GPT-3). 3-5: feature vectors, feature space, distance between vectors; recommender systems.]
- **2-B-i State spaces and operators:** identify real-world **search problems** (task planning, scheduling, resource allocation, packing objects into containers) and describe their states, operators, start state, and goal state.
- **2-B-ii Combinatorial search:** illustrate **breadth-first, depth-first, and best-first search**. Breadth-first finds shallow solutions fast but needs lots of memory; depth-first uses less memory when levels grow exponentially; best-first can find the optimal (least-cost) solution given an accurate cost measure; breadth-first and depth-first are not guaranteed optimal because they ignore cost.
- **2-C-i Types of reasoning problems:** categorize real problems as classification, prediction, sequential decision, combinatorial search, heuristic search, adversarial search, logical deduction, or statistical inference. Heuristic search uses a rule of thumb when the state space is too large; adversarial search (games) alternates between the player's best move and the opponent's best reply; logical deduction derives new facts from known facts with inference rules, using **propositional or predicate logic**, semantic networks, or expert-system IF-THEN rules; statistical inference reasons with probabilities. [6-8: prediction estimates a continuous value; sequential decision problems maximize overall reward and are handled with reinforcement learning.]
- **2-C-ii Reasoning algorithms:** name an algorithm for each problem type: heuristic search (best-first, **A\***); adversarial search (**alpha-beta pruning**); logical deduction (**resolution theorem proving** or IF-THEN rules); statistical inference (**Bayesian networks**). Some algorithms use symbolic representations (search trees), others are numerical (neural networks on feature vectors). [6-8: classification by decision trees, nearest-neighbor, or neural networks; prediction by linear regression or neural networks; sequential decisions by Q tables or neural networks; a decision tree cannot work on raw images, a neural network can because it extracts features.]

### Big Idea 3: Learning
Idea: computers can learn from data.
Key insights: machine learning lets a computer acquire behaviors without people explicitly programming them; learning happens when the algorithm changes the internal representations of a reasoning model (decision tree, neural network); large training sets are needed when the model can express many behaviors; the trained model is then applied to new data (learning phase vs application phase).

- **3-A-i Humans vs machines:** define supervised, unsupervised, and reinforcement learning with human analogies. Supervised uses features to predict a teacher-supplied class label (like a coach correcting you); unsupervised groups similar instances and creates its own classes (like noticing a store has three kinds of customers); reinforcement uses trial and error to find a **policy** that maximizes the reinforcement signal (like trying video-game moves to score points).
- **3-A-ii Finding patterns:** supervised learning adjusts the **parameters** of a model chosen in advance by a human (linear equation, high-degree polynomial, deep neural network). Regression example: fit y = mx + b; polynomial and logistic regression; quality of fit measured by **mean squared error**; for classification the target is 1 or 0 and the **decision boundary** is where y = 0.5.
- **3-A-iii Training a model:** train a supervised or unsupervised model on real data and evaluate it: supervised by the percent of a **test set** labeled correctly; unsupervised by checking whether clusters capture useful distinctions. [6-8: tabular data, each row an example, each column a feature; classification = discrete classes, prediction = continuous value.]
- **3-A-iv Constructing vs using a reasoner:** the steps: decide the problem, find training data, choose a feature set, decide how to label, run the learning algorithm, use a **cross-validation set** to decide when to stop training (avoids **overfitting**), and use a **test set** of unseen examples for an unbiased performance estimate. [6-8: using a trained model does not change it; only the learning algorithm changes it.]
- **3-A-v Adjusting internal representations:** decision-tree learners add nodes one at a time (picking the most informative feature); neural-network learners adjust weights; regression adjusts equation parameters; reinforcement learners update value predictions or policies.
- **3-A-vi Learning from experience:** select the right type: **supervised** for classification and prediction, **unsupervised** for clustering, **reinforcement** for sequential decision making. Reinforcement learning is slow (trial and error, no teacher) but can find solutions when nobody knows the best action. [3-5: grid-world agent learning a path to a goal.]
- **3-B-i Neural network structure:** describe architectures and uses: **feed-forward** (classification and regression), **2D convolutional** (learned kernels convolved with the input plus **max-pooling** layers; image analysis), **recurrent** (feedback connections; language), **generative adversarial networks** (generator and discriminator; deepfakes). [6-8: layers of units (input, hidden, output), weighted connections, each unit passes its weighted sum through a transfer function. 3-5: a neuron multiplies inputs by weights, sums, compares to a threshold, outputs 1 or 0; small networks compute AND, OR.]
- **3-B-ii Weight adjustment:** training a multilayer network with **backpropagation**: weights start as small random values; changes come from an error signal propagated backward from later layers to earlier ones; a neuron's weight pattern determines the feature it detects (TensorFlow Playground). [6-8: perceptron learning rule.]
- **3-C-i Feature sets:** compare real datasets by their features and encodings; humans choose features and encodings (age in months, years, or ranges), which shapes what a model can learn. [3-5: feature types discrete, binary, continuous. 6-8: decision-tree learners pick features that best separate classes.]
- **3-C-ii Large datasets:** evaluate a real AI dataset by size, how data were acquired and labeled, storage, and production time; labeling is labor-intensive and may need experts (x-rays); bias can enter at every step; dataset repositories such as Kaggle. [6-8: segmenting images with bounding boxes to build object-recognition training sets.]
- **3-C-iii Bias:** investigate imbalances by gender, age, ethnicity, or other demographics with visualization tools (histograms in Excel, Pandas); learning algorithms exploit any imbalance or correlation that lowers error. [6-8: face classifier trained only on Caucasian faces; loan model that learns to reject one town. 3-5: Amazon's resume sorter learned bias against women from past hiring data.]

### Big Idea 4: Natural Interaction
Idea: intelligent agents need many kinds of knowledge to interact naturally with humans.
Key insights: computers handle factual language but struggle with metaphor, imagery, humor, and sarcasm; computers can recognize but not experience emotions; current AI is narrow, and broad AI or **Artificial General Intelligence** has not been achieved; current AI lacks consciousness and self-awareness.

- **4-A-i Structure of language:** identify text that is hard for computers (metaphor, imagery, hyperbole, sarcasm, humor, word play). [6-8: parsers produce **parse trees** with grammatical categories NP, VP, PP; part-of-speech (POS) tagging; Penn Treebank.]
- **4-A-ii Ambiguity:** a word can have multiple senses (**polysemy**); people use context and world knowledge, while neural systems resolve word senses statistically. [K-2: lexical ambiguity from homonyms and homophones. 3-5: **reference ambiguity** (which noun a pronoun refers to). 6-8: **attachment (syntactic) ambiguity** ("saw the man with the telescope").]
- **4-A-iii Reasoning about text:** a small **context-free grammar** can parse or generate sentences; recursive grammars generate infinitely many sentences; CFGs handle agreement (subject-verb number) poorly. [6-8: word embeddings support outlier detection and analogy completion (king minus man plus woman is close to queen) and feed transformer networks.]
- **4-A-iv Applications:** NLP approaches range from simple (keyword matching, dictionary lookup, template matching) to deep neural networks doing "intent recognition". [6-8: NLP tasks: text summarization, text generation, sentiment analysis, question answering, machine translation, conversational interaction.]
- **4-B-i Commonsense reasoning:** interpreting a fable needs cultural knowledge, **naive physics**, and **folk psychology** (beliefs, desires, intentions); **Winograd** sentences test pronoun resolution with world knowledge.
- **4-C-i Understanding emotion:** AI can adapt to people's emotional states (tutoring systems detecting frustration or boredom; customer-service agents changing speech rate and tone). [6-8: emotion cues: facial expression, gaze, gestures, body language, tone of voice, word choice. 3-5: **sentiment analysis** of text.]
- **4-D-i Philosophy of mind:** debate human vs artificial intelligence: some argue computers can never match human intelligence (no body or lived experience), others expect **artificial superintelligence**; the **Turing test**. [6-8: criteria for consciousness such as self-awareness and personal history. 3-5: narrow AI vs broad or general AI.]

### Big Idea 5: Societal Impact
Idea: AI can affect society positively and negatively.
Key insights: building AI involves technical and ethical design decisions; AI has multiple stakeholders with different values; systems that make decisions about people should follow values such as fairness, transparency, and privacy; AI is a disruptive technology affecting the economy, employment, and social norms; AI is becoming part of everyone's toolbox.

- **5-A-i Disparate impacts:** explain how AI systems have affected groups differently (a health-care risk algorithm that used past medical spending as a proxy for sickness; resume screening). [6-8: stakeholders' conflicting goals, such as ad-driven apps vs users' well-being.]
- **5-A-ii Ethical design criteria:** analyze whether a system meets **fairness, transparency, explainability, accountability, respect for privacy, and adherence to societal values** (each defined). Resource: **model cards**.
- **5-A-iii Practicing ethical design:** design an AI system with an ethical process that considers all stakeholders. [6-8: **ethical matrix** of stakeholders and values. 3-5: model cards describe intended use, training data, accuracy, and limitations.]
- **5-B-i AI in daily life:** debates as AI enters culture: behavior toward assistants and robots, status of AI-made text and art, students using large language models for homework, use of personal or copyrighted data for training. [3-5: recommender systems (Netflix, Amazon, social media, ads); autonomous vehicles.]
- **5-B-ii Trust and responsibility:** identify where regulation of AI is appropriate (facial recognition for policing or surveillance, privacy of customer data, autonomous-vehicle safety). [6-8: **surveillance** (face recognition in public, license-plate trackers, tracking of searches and web behavior to build profiles). 3-5: spotting flaws in **deepfakes**.]
- **5-C-i Impacts on sectors:** predict how a sector will change (more automation, new services); **Amara's Law** (overestimate short-term, underestimate long-term effects). [6-8: industrial revolutions: mechanical power; electricity and mass production; computers and networking; the fourth based on AI, robotics, Internet of Things, genetic engineering.]
- **5-C-ii Employment:** skills for AI-enabled careers (curating datasets, working with intelligent agents, training robots, AI creative tools, knowledge engineering); lifelong learning.
- **5-D-i Democratization:** create applications with freely available AI tools.
- **5-D-ii AI for social good:** evaluate AI-for-social-good projects (energy, environment, endangered species, public health, human trafficking); UN Sustainable Development Goals.

### Implications: terms and topics a test writer could draw from AI4K12
- The five Big Idea names and what each means; the term "intelligent agent" and the sense-deliberate-act cycle.
- Sensors (camera, microphone, radar, lidar, GPS, accelerometer), their limits, and how their data are encoded (pixels, RGB, sampling, depth images, latitude/longitude, 3-axis acceleration).
- Sensing vs perception; feature extraction (edges, spectrograms, formants); abstraction hierarchies for speech and vision.
- Symbolic vs numerical representations; schemas, inheritance, knowledge graphs, trees, graphs, nodes, links, root, leaf.
- Syllogisms (major premise, minor premise, conclusion) written in predicate logic with the universal quantifier and implication; propositional vs predicate logic; IF-THEN rules; semantic networks; expert systems.
- Search: state space, operators, start and goal states, search tree; breadth-first, depth-first, best-first, A\*, heuristic, adversarial search, alpha-beta pruning.
- Problem types: classification, prediction, sequential decision, combinatorial search, heuristic search, adversarial search, logical deduction, statistical inference, and a matching algorithm for each (including Bayesian networks and resolution theorem proving).
- Feature vectors, feature space, word embeddings, transformer networks.
- ML definition; learning phase vs application phase; parameters; supervised, unsupervised, reinforcement learning (policy, reward, reinforcement signal, trial and error); mapping problem type to learning type.
- Regression line y = mx + b, mean squared error, decision boundary; cross-validation set vs test set; overfitting.
- Neuron (weights, weighted sum, threshold or transfer function), layers, perceptron rule, backpropagation; feed-forward, convolutional (kernels, max-pooling), recurrent, GAN.
- Datasets: feature encoding choices, labeling cost, bounding boxes, ImageNet, COCO, Kaggle; bias from unrepresentative data.
- NLP: ambiguity types, polysemy, parse trees (NP, VP, PP), POS tagging, context-free grammars, NLP tasks, NLP approaches, sentiment analysis, commonsense reasoning, naive physics, folk psychology, Winograd sentences.
- Narrow AI vs AGI vs superintelligence; consciousness and self-awareness; Turing test.
- Ethics vocabulary: disparate impact, stakeholders, fairness, transparency, explainability, accountability, privacy, model cards, ethical matrix, surveillance, deepfakes, regulation, Amara's Law, AI for social good.

---

## 3. ACM: Computing Competencies for Undergraduate Data Science Curricula (2021)

**What it is.** A curriculum report by the ACM Data Science Task Force (co-chairs Andrea Danyluk and Paul Leidig), January 2021, for undergraduate data science programs. Chapters cover the task force, prior work, the body of knowledge, program design, broadening participation, graduate characteristics, and institutional challenges; Appendix A is the body of knowledge. CONFIRMED.

**Structure.** 11 Knowledge Areas (KAs), each split into sub-domains with knowledge and skill statements tagged by tier: **T1** and **T2** are required tiers (T1 the more foundational), **E** is elective. CONFIRMED (the T1/T2 difference is not spelled out in the opened text; INFERRED from use). Mathematics and statistics are outside the KAs but required for a full program: calculus, discrete structures, probability theory, elementary statistics, advanced statistics topics, linear algebra. Chapter 2 cites the Park City report's "data cycle": obtaining, wrangling, curating, managing, processing, exploring, analyzing, and communicating data. CONFIRMED.

**Knowledge areas and the high-school-relevant subtopics** (tier in brackets):

1. **Analysis and Presentation (AP).** Foundational considerations [T1]: user-centered design, attention and perception, accessibility, color, how bias can appear in interfaces. Visualization [T1]: role of visualization in data science; characteristics of effective visualizations; matching technique to data and audience; dashboards and interactive visualization; preparing data (scaling, color); chart types (tables, scatter plots, pie charts, histograms, graphs) and map-, pixel-, glyph-, and graph-based displays; drawing inferences from visualizations; data types to visualize (time-varying, spatial, multivariate, high-dimensional, tree or graph, discrete/continuous, text). Interaction and interface design [E/T2]: evaluation by walkthroughs and heuristics, UI standards.
2. **Artificial Intelligence (AI).** General [T1/T2]: history of AI; reality vs perception of AI; subfields (knowledge representation, logical and probabilistic reasoning, planning, perception, natural language processing, learning, robotics); robots, agents, multi-agent systems. Knowledge representation and reasoning, logic-based [T2/E]: **predicate logic**, **forward and backward chaining**, reasoning in large systems (IBM Watson); [E] ontologies and knowledge graphs (Protege, ConceptNet, YAGO, UMLS), resolution and theorem proving. Knowledge representation and reasoning, probability-based [T1/T2/E]: random variables, probability axioms, independence, conditional and marginal probability, causal models [T1]; **Bayesian networks** (inference, belief propagation, independence relations) and Markov Decision Processes [T2]; reinforcement learning and Markov logic networks [E]. Planning and search [T2/E]: state-space representation, breadth-first and depth-first search, heuristic search (A\*) [T2]; genetic algorithms, simulated annealing, constraint satisfaction [E].
3. **Big Data Systems (BDS).** Problems of scale, growth rates, scalability [T1]; distributed storage, hashing, filtering, sampling, MapReduce, data sketches, cloud computing (data centers, virtualization, distributed file systems, cloud security), serverless computing [T2]; parallel architectures (multi-core, GPUs, Flynn's taxonomy) [E].
4. **Computing and Computer Fundamentals (CCF).** Bits, bytes, words; **numeric representation and precision**; CPUs vs GPUs [T1]; non-numeric representation (characters, strings, images), von Neumann machine [T2]; storage and memory hierarchy (registers, cache, RAM, virtual memory, flash, magnetic disk); operating-system roles and threats (malware, authentication); files and metadata; networks (routers, switches, IP addresses, DNS, TCP/IP, HTTP/HTTPS); the web (HTML, JavaScript, CSS) and web vulnerabilities (**SQL injection**, DDoS); compilers vs interpreters.
5. **Data Acquisition, Management, and Governance (DG).** Data acquisition (sources, pull vs push, discretization) [T1]; working with various data types: numbers and precision, text (bag-of-words, TF-IDF, n-grams, stop-word filtering, stemming, lexical/syntactic/semantic analysis), images (integer matrices, features, object recognition), video [T2]; data integration (data warehouses, schema mapping) [T1]; data reduction and compression (sampling, filtering) [T1/T2]; **data transformation** (pipelines, standardization, normalization, encoding, smoothing) [T1]; **data cleaning** (data-quality dimensions, **entity resolution**, truth discovery, rule-based cleaning with functional dependencies) [T1]; data privacy law (GDPR, HIPAA, GLBA, cross-border rules) [T1].
6. **Data Mining (DM).** Proximity measurement: metric properties, Euclidean and Manhattan (Lk) distances, normalization, **nominal/ordinal/interval/ratio** data [T1]; cosine similarity, correlation [T2]. Data preparation: sourcing data (databases, IoT, images, video, online sources), ethics and bias, munging, class imbalance, feature extraction, selection, and generation [T1]. Cluster analysis: similarity measures, cluster quality, **k-means**, density-based methods [T1]; mean shift, agglomerative [T2]. Classification and regression: **KNN, decision trees, Naive Bayes**, feature selection [T1]; rule-based methods, SVMs, neural networks, deep-learning tools (Caffe, TensorFlow, **PyTorch**) [T2]. Pattern mining: association rules, Apriori, FP-growth [T2]. Outlier detection: z-score, probability distributions [T2]. Time series: stationarity, forecasting [E]. Web data: scraping and crawling ethics [T2]. Information retrieval: Boolean operators, indexing, **relational databases and SQL**, non-relational formats, PageRank [T2].
7. **Data Privacy, Security, Integrity, and Analysis for Security (DPSIA).** Privacy (sensitive data exposure, encryption, symmetric vs asymmetric keys, hash functions, digital signatures, access control); security (threat models, attack trees, PKI); integrity (entity, referential, domain integrity; RAID; checksums, CRC; **data poisoning**; input validation); analysis for security (ML for malware detection; **adversarial examples** (FGSM), adversarial training; explainability tools such as LIME).
8. **Machine Learning (ML).** General: supervised, unsupervised, reinforcement, deep learning; symbolic vs numerical; decision trees via information theory; logistic regression via maximum likelihood and stochastic gradient descent; bootstrapping; AutoML [E]. Supervised: regression vs classification; **bias-variance trade-off**; **train/validation/test splits**; **cross-validation**; metrics (**accuracy, precision, recall, F1, AUROC, RMSE, MAE, R squared**); linear models, logistic regression, KNN, Naive Bayes, decision trees; bagging, boosting, random forests; SVMs with kernels; neural networks; multiclass methods. Unsupervised: k-means, hierarchical clustering, Gaussian mixture models; dimensionality reduction (**PCA**, ICA, NMF, SVD). Mixed methods: time series, sequence prediction, **recommender systems** (collaborative filtering), HMMs. Deep learning: multilayer networks learn higher-level features; deep feed-forward networks, **CNNs, RNNs, LSTMs**; regularization (early stopping, parameter sharing, dropout); backpropagation; convolution and max pooling; GPUs; GANs [E]; toolkits PyTorch and TensorFlow.
9. **Professionalism (PR).** Ethics [T1]: competence, data confidentiality, GDPR, representative samples, identifying and mitigating bias in data and algorithms, **algorithmic transparency and accountability**. Privacy and confidentiality [T1]. Legal [T2]: computer crime. Intellectual property [E]: patents, copyright, trademarks, trade secrets. Automation [E]: benefits, concerns in critical situations, auditability of decision systems. Communication, teamwork, professional development [T1].
10. **Programming, Data Structures, and Algorithms (PDA).** Algorithmic thinking, abstraction; programming (variables, control flow, functions, recursion, I/O, exceptions, testing, version control, querying and parsing data); data structures (lists, arrays, stacks, queues, sets, maps, hash tables, sparse vs dense matrices; trees and graphs [T2]); algorithms (sorting, searching, graph traversal, greedy, divide-and-conquer); time and space complexity (best, expected, worst case); numerical computing (random number generators and simulation, **floating-point error**: overflow, underflow, rounding, truncation; Monte Carlo [T2]).
11. **Software Development and Maintenance (SDM).** Coding standards, database integration, software and data lifecycles; testing types (unit, integration, regression, system, security).

### Implications: terms and topics a test writer could draw from ACM
- AI subfield list (knowledge representation, logical and probabilistic reasoning, planning, perception, NLP, learning, robotics) for the AI Basics subfield objective.
- The split between **logic-based** and **probability-based** knowledge representation and reasoning (direct match to the Perception, Representation, and Reasoning area): predicate logic, forward chaining, backward chaining, ontologies, knowledge graphs, resolution; random variables, probability axioms, independence, conditional and marginal probability, causal models, Bayesian networks (inference, belief propagation, independence), Markov Decision Processes.
- Search vocabulary: state space, BFS, DFS, A\*, heuristic, genetic algorithms, simulated annealing, constraint satisfaction.
- Levels of measurement (nominal, ordinal, interval, ratio) and distance measures (Euclidean, Manhattan, cosine similarity, correlation).
- Data cleaning and transformation vocabulary: data-quality dimensions, entity resolution (duplicates), standardization, normalization, encoding, smoothing, discretization, sampling, data integration, data warehouse.
- Text and image data handling: bag-of-words, TF-IDF, n-grams, stop words, stemming; images as integer matrices.
- Algorithms: KNN, Naive Bayes, decision trees, SVM, random forests, bagging, boosting, k-means, hierarchical and density-based clustering, PCA, association rules (Apriori), outlier detection (z-score).
- Evaluation: bias-variance, overfitting, train/validation/test, cross-validation, accuracy, precision, recall, F1, AUROC, RMSE, MAE, R squared.
- Deep learning: CNN, RNN, LSTM, convolution, max pooling, dropout, early stopping, backpropagation, GPUs, GANs, PyTorch, TensorFlow.
- Computing fundamentals: bits, bytes, numeric precision, floating-point error, characters and strings, CPUs vs GPUs, memory hierarchy, SQL injection.
- Security and privacy: encryption, hashing, digital signatures, access control, data integrity, data poisoning, adversarial examples, explainability, GDPR, HIPAA.
- Big data: scale, cloud computing, distributed storage, MapReduce, sampling, sketches.
- Professional ethics: representative samples, bias mitigation, algorithmic transparency and accountability, intellectual property, automation concerns.

---

## 4. CodeHS: Intro to AI Syllabus

**What it is.** CodeHS "Intro to AI Syllabus", High School, one month (20 hours), for complete beginners. Blended, web-based course with video and article lessons, reflections, and hands-on tool explorations. Tools named: ChatGPT, Gemini, Hugging Face, Google Experiments, TensorFlow, adamharley.com (CNN visualizer), Google Teachable Machine, GitHub, Survival of the Best Fit (hiring-bias game), Lakera (prompt-injection game). Course page: "Introduction to AI for High School (1 Month)". CONFIRMED.

**Structure (modules and lessons).**

| Module (hours) | Lessons | Example assignments |
|---|---|---|
| 1. Intro to AI (6) | 1.1 Human & Artificial Intelligence; 1.2 Generative vs. Predictive AI; 1.3 Large Language Models; 1.4 Prompt Engineering; 1.5 Who Builds AI? | Explore AI applications in Google Experiments; compare LLMs in Chatbot Arena; generate an image with prompt-engineering techniques |
| 2. Machine Learning (5) | 2.1 Intro to Machine Learning; 2.2 Supervised Learning; 2.3 Unsupervised Learning; 2.4 Reinforcement Learning | Watch how a CNN processes an image and predicts; Teachable Machine apples vs bananas classifier; how AI grouped bird sounds from unlabeled data; reinforcement learning game. Module description also names the ML **lifecycle** and bias in models |
| 3. Training AI Models (4) | 3.1 How Are AI Models Trained?; 3.2 AI Models in Industry; 3.3 Bias in Training | Train a model to control a program (turning on a light); explore AI use cases in an industry; how bad training data creates bias |
| 4. Risks of AI (5) | 4.1 Effects of Using Biased AI; 4.2 Hallucinations and Security Risks; 4.3 Deepfakes and Misinformation; 4.4 Project: AI on Trial | Harms of biased AI; simulate a **prompt injection using an image**; how deepfakes are made and spotted; debate the legal challenges facing generative AI |

### Implications: terms and topics a test writer could draw from CodeHS
- Human vs artificial intelligence; who builds AI.
- **Generative vs predictive AI** (a likely item: classify an application as generative or predictive).
- Large language models; comparing chatbots; **prompt engineering** techniques.
- Text-to-image generation (Hugging Face / Stable Diffusion-type tools).
- Supervised (labeled examples, classifier), unsupervised (unlabeled data, grouping), reinforcement (rewards in a game) with concrete examples; convolutional neural networks for images; the ML lifecycle.
- How models are trained (collect examples per class, train, test); AI in industries.
- Bias from bad or unrepresentative training data (hiring example); effects of biased AI on people.
- **Hallucinations**; **security risks of LLMs, including prompt injection (also hidden in images)**; deepfakes; misinformation; legal and copyright challenges of generative AI.
- Tool names: ChatGPT, Gemini, Teachable Machine, TensorFlow, Hugging Face, GitHub.

---

## 5. Google Cloud: What is artificial intelligence (AI)

**What it is.** A Google Cloud "Learn" explainer page. On 2026-11-01 the page at the FBLA URL is titled "Artificial Intelligence (AI): A Simple-to-Understand Guide" and has no visible publication or update date. CONFIRMED. The page has been revised since FBLA cited it (see the note at the end of this section).

**Structure (section headings, current version):** Key takeaways; What is artificial intelligence (AI)?; How does AI work?; Types of artificial intelligence (AI types by capability; AI types by functionality; AI myth versus reality; Benefits of AI); AI in action: transforming our world; The history of AI; The cutting edge: generative AI, LLMs, and the rise of AI agents; Related products and services. CONFIRMED.

**Key content (paraphrased, Google's terms kept):**

- **Definition:** AI is a set of technologies that let computers learn, reason, and perform tasks that used to need human thinking (understanding language, analyzing data, making recommendations). It draws on computer science, statistics, engineering, linguistics, neuroscience, philosophy, and psychology.
- **How AI works:** depends on **data, algorithms, and computing power**; systems improve by finding patterns in large datasets; training-data quality and quantity strongly affect results. Four core areas: **machine learning** (learns patterns from data and predicts without being explicitly programmed for each case); **deep learning** (a subfield of ML using multi-layer neural networks inspired by the brain; image and speech recognition); **natural language processing** (understand, interpret, generate human language; assistants, translation, chatbots); **computer vision** (interpret images and video; facial recognition, self-driving cars).
- **Types by capability:** **Artificial Narrow Intelligence (ANI)** (the only kind that exists; single tasks such as voice assistants and generative models; no real reasoning or self-awareness; biased training data can cause harm in lending, hiring, policing); **Artificial General Intelligence (AGI)** (hypothetical human-like reasoning across tasks; safety and misuse concerns); **Artificial Superintelligence (ASI)** (theoretical; far beyond human ability; a self-aware entity possibly beyond human control; some researchers see catastrophic risk).
- **Types by functionality (current version lists three):** **reactive machines** (preset rules, no memory; IBM Deep Blue beat a chess champion in 1997); **limited memory** (most modern AI; learns from new data, short-term memory; self-driving cars, chatbots tracking a conversation); **theory of mind** (not yet developed; would model human emotions and social behavior).
- **Myths vs reality:** AI is not conscious and has no feelings (it matches patterns); AI is not automatically unbiased (it reflects training data); AI is more likely to augment jobs than replace all of them.
- **Benefits:** automation (e.g., network security monitoring, smart factories); fewer human errors; less repetitive work (transcription, document checks, content moderation, simple customer questions); speed and accuracy on large data; constant availability; faster research (drug candidates, genome analysis).
- **Applications:** virtual assistants, streaming recommendations, spam filters, navigation apps; healthcare (diagnosis from medical images, personalized treatment, drug discovery); transportation (autonomous vehicles); business (customer-service chatbots, fraud detection, supply-chain optimization, marketing personalization); entertainment (game characters, generative music, scripts, art); optical character recognition.
- **History:** Alan Turing and the **Turing Test (1950)**; **Dartmouth summer project (1956)**, where the field and the term began; ELIZA (chatbot) and Shakey (reasoning robot) in the 1960s-70s; **AI winters**; **expert systems** and machine learning in the 1980s-2000s; Deep Blue (1997); the deep-learning boom of the 2010s driven by computing power and big datasets.
- **Generative AI, LLMs, agents:** generative AI creates new text, images, code, and more from learned patterns (DALL-E, ChatGPT); **LLMs** are trained on huge text and code datasets to understand and generate language (summarize, translate, write, code) and are increasingly **multimodal**; developers should review and validate AI-generated code; **AI agents** perceive their environment, plan steps toward a goal, reason, act through software or physical interfaces, and may learn from experience (**agentic AI**).
- **Risks named:** biased or inaccurate outputs; criminals using AI for sophisticated scams; misuse of AGI; possible existential risk from ASI.

**Note on the older version (UNVERIFIED).** FBLA cites the page as "What is artificial intelligence (AI)". From the researcher's prior knowledge of an earlier version of this page (not re-checked; archived copies could not be opened because web.archive.org and archive.ph are blocked for the fetch tool), it also listed: a fourth functional type, **self-aware** AI; "AI training models": **supervised, unsupervised, semi-supervised, and reinforcement learning**; "common types of artificial neural networks": **feedforward, recurrent, long short-term memory (LSTM), convolutional, and generative adversarial networks**; and applications such as speech recognition, image recognition, translation, predictive modeling, data analytics, and cybersecurity. Most of these terms are confirmed in AI4K12 and ACM anyway; **semi-supervised learning** is the only one not confirmed in any opened reference.

### Implications: terms and topics a test writer could draw from Google Cloud
- Definition of AI and the disciplines it draws on; data + algorithms + computing power.
- The four core areas: ML, deep learning, NLP, computer vision, with one example each.
- ANI vs AGI vs ASI; reactive machines vs limited memory vs theory of mind (and self-aware, from the older version); Deep Blue as the reactive-machine example.
- Myths vs reality (not conscious, not unbiased, augments jobs).
- Benefit and application lists (likely "which is a benefit/use of AI" items).
- History milestones: Turing Test 1950, Dartmouth 1956, ELIZA, Shakey, AI winters, expert systems, Deep Blue 1997, deep learning 2010s.
- Generative AI examples (DALL-E, ChatGPT), LLM capabilities, multimodality, AI agents and agentic AI.
- Risks: bias in lending, hiring, policing; scams; AGI/ASI safety; reviewing AI-generated code.
- From the older version (UNVERIFIED): semi-supervised learning; LSTM; self-aware AI.

---

## 6. Harvard: Data Science Principles

**What it is.** A Harvard Online course by Dustin Tingley (Professor of Government, Harvard). The FBLA URL (harvardonline.harvard.edu) returned HTTP 429 (rate limited) on three attempts, so its detailed outline could not be read. Harvard's Professional and Lifelong Learning catalog page for the same course (which links back to the harvardonline URL) did open. CONFIRMED from that page:

- The course is now titled **"Data Science and AI Principles"**; Harvard Faculty of Arts & Sciences; introductory; online, self-paced, 5 weeks at 4-5 hours per week; next wave January 20 - February 24, 2027; $1,200; certificate of completion; from the October 2026 wave, live faculty presentation and Q&A.
- Description: introduces foundational data science and AI topics through real-world examples; data science underpins growing businesses (health care, government, advertising) and is the foundation of modern AI, including **machine learning and large language models**; shows how organizations use these tools to change products, services, and decision-making; asks learners to apply the ideas at work.
- What you'll learn: core data science and AI concepts; **evaluate and interpret data quality, algorithms, and AI systems**; apply data science and AI principles to real-world problems.
- Topic tags: Artificial Intelligence, Machine Learning, Data Science.

**Structure:** week-by-week syllabus not available. UNVERIFIED.

### Implications: terms and topics a test writer could draw from Harvard
- What data science is and why organizations use it (non-technical, decision-making framing).
- Data science as the foundation of ML and LLMs.
- Judging **data quality** and evaluating algorithms and AI systems (fits the data-quality and credibility objectives).
- Real-world application questions in sectors such as health care, government, and advertising.
- Detailed module vocabulary: UNVERIFIED (could not read the outline).

---

## 7. IBM Data Science Professional Certificate (Coursera)

**What it is.** IBM's beginner professional certificate on Coursera: **12 courses, about 178 hours**. CONFIRMED.

**Structure (current course list, in order):**

| # | Course (hours) | Main topics and tools (from the course pages) |
|---|---|---|
| 1 | Data Science Foundations: Tools, Careers & Real-World Applications (12) | What data science is; a day in the life; data science skills and big data; **types of file formats**; topics and algorithms; big data and digital transformation; cloud for data science; **Hadoop, HDFS, Hive, Spark**; data mining; regression (reading); AI and data science; **generative AI and data science**; **neural networks and deep learning**; applications of ML; careers; importance of math and statistics; report structure. Optional data-literacy module: understanding data, **data sources**, data collection and organization, **RDBMS, NoSQL, data marts, data lakes, ETL, data pipelines**, data integration platforms, **metadata** |
| 2 | Essential Tools for Data Scientists: Git, Jupyter & More (16) | Categories of tools; **open-source vs commercial vs cloud-based** tools; languages (**Python, R, SQL**, plus Scala, Java, C++, JavaScript, Julia); libraries, **APIs** (REST requests and responses), data sets (Data Asset eXchange), ML and deep-learning models (Model Asset eXchange); **Jupyter Notebook/JupyterLab** (kernels, architecture, Markdown), Anaconda; **RStudio**, R packages, plotting, ggplot; **Git and GitHub** (repositories, commits, branches, pull requests, merges); Watson Studio |
| 3 | Data Science Methodology: Apply the Framework in Real Projects (9) | John Rollins' **Foundational Data Science Methodology** (stages below); **CRISP-DM** (six stages) compared with it; analytic approach by question type (descriptive, predictive, classification models); data requirements for a decision-tree classifier; handling missing, invalid, or misleading data; storytelling |
| 4 | Python for Data Science & AI: Hands-On Development (24) | Types, expressions, variables, strings; **lists, tuples, dictionaries, sets**; conditions and branching, loops, functions, exception handling, objects and classes; reading and writing files; **pandas** (loading, selecting, saving data); **NumPy** 1D and 2D arrays; APIs, **REST APIs and HTTP requests**, HTML and **web scraping** (BeautifulSoup), file formats (CSV, JSON) |
| 5 | Python Project for Data Science (7) | Project as a data analyst: web scraping, pandas, Plotly dashboard in Jupyter |
| 6 | Databases and SQL for Data Science with Python (18) | Intro to databases; **SELECT; COUNT, DISTINCT, LIMIT; INSERT; UPDATE and DELETE**; relational database concepts; **DDL vs DML**; **CREATE TABLE; ALTER, DROP, TRUNCATE**; relational model constraints; SQL scripts; string patterns (**LIKE**) and ranges; sorting (**ORDER BY**); grouping (**GROUP BY**); built-in and date/time functions; **sub-queries and nested selects**; working with multiple tables (implicit join); accessing databases from Python (DB-API, SQL magic, SQLite); bonus: **views, stored procedures, ACID transactions** (commit, rollback), **inner and outer joins** |
| 7 | Data Analysis with Python: From Raw Data to Insights (16) | Importing/exporting data; Python packages for data science; **data wrangling**: missing values, data formatting, **normalization, binning**, turning categorical variables into quantitative ones; **exploratory data analysis**: descriptive statistics, **GroupBy**, **correlation** and correlation statistics, plot types, **chi-square test** for categorical variables; model development: **linear and multiple linear regression**, model evaluation using visualization (residual and KDE plots), **polynomial regression and pipelines**, measures for in-sample evaluation (R squared and MSE are the usual ones; the page does not list them by name), prediction and decision making; **overfitting, underfitting, model selection, ridge regression, grid search**; tools pandas, NumPy, SciPy, scikit-learn |
| 8 | Data Visualization with Python: Hands-On Projects (19) | Types of plots; **Matplotlib**; **line, area, histogram, bar, pie, box, scatter, bubble** plots; treemaps and pivot charts (reading); **waffle charts, word clouds**; **Seaborn** regression plots; **Folium** maps with markers and **choropleth** maps; dashboards with **Plotly** and **Dash** (callbacks), sunburst; storytelling with data |
| 9 | Machine Learning with Python: Build Real-World ML Models (20) | ML overview and **model lifecycle**; data scientist vs AI engineer; scikit-learn; **simple, multiple, polynomial/non-linear regression; logistic regression**; classification, **multi-class classification**; **decision trees, regression trees, SVM, KNN**; **bias, variance, and ensemble models** (random forests, XGBoost); clustering (**k-means, DBSCAN, HDBSCAN**); **dimension reduction (PCA, t-SNE, UMAP)**; feature engineering; classification and regression metrics; evaluating unsupervised models; **cross-validation**; **regularization**; **data leakage**; pipelines, GridSearchCV |
| 10 | Applied Data Science Capstone (14) | SpaceX Falcon 9 first-stage landing prediction: data collection with **REST API and web scraping**, data wrangling, **EDA with SQL** and visualization, **Folium** and **Plotly Dash**, classification with **SVM, decision tree, logistic regression, KNN**, hyperparameter tuning, test-set comparison; elements and structure of a data findings report; presenting findings |
| 11 | Generative AI: Elevate Your Data Science Career (14) | Generative AI and data science; impact across industries; generative AI in the **data science lifecycle**; types of generative AI models (the page says there are four but does not name them); **data generation and augmentation**; **data preparation and querying** with generative AI; data insights and visualization; model development; feature engineering; considerations, challenges, **ethics and responsible generative AI**; tools named: GPT-3.5, ChatCSV, tomat.ai |
| 12 | Data Scientist Career Guide and Interview Preparation (9) | Careers, job search, resume, portfolio, interviews |

**Named methodology: John Rollins' Foundational Data Science Methodology.** IBM's methodology course teaches it and compares it with CRISP-DM. Its ten stages, exactly as the course's lesson videos name them, in order: CONFIRMED

1. Business Understanding
2. Analytic Approach
3. Data Requirements
4. Data Collection
5. Data Understanding
6. Data Preparation
7. Modeling
8. Evaluation
9. Deployment
10. Feedback

IBM groups them into five lesson pairs: "From Problem to Approach" (Business Understanding, Analytic Approach); "From Requirements to Collection" (Data Requirements, Data Collection); "From Understanding to Preparation" (Data Understanding, Data Preparation); "From Modeling to Evaluation" (Modeling, Evaluation); "From Deployment to Feedback" (Deployment, Feedback). The course also covers storytelling and states that deployment and feedback are iterative. CONFIRMED. CRISP-DM's six stages are not listed on the page; the standard names are Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, Deployment (general knowledge, consistent with the course's comparison).

### Implications: terms and topics a test writer could draw from IBM
- **Rollins' 10 stages in order** and how they map to CRISP-DM's 6 (a very likely "stages of the data science process" item); analytic approach types; storytelling.
- Data literacy vocabulary: file formats (CSV, JSON), data sources, RDBMS vs NoSQL, data warehouse/mart/lake, ETL, data pipelines, metadata.
- Big data tools: Hadoop, HDFS, Hive, Spark; cloud computing.
- Languages and tools: Python, R, SQL (and Scala, Java, C++, JavaScript, Julia); Jupyter, JupyterLab, RStudio, Anaconda, Watson Studio; Git vs GitHub, repository, commit, branch, merge, pull request; open source vs commercial vs cloud tools; APIs (REST, HTTP request and response); web scraping (BeautifulSoup).
- Python basics: data types and data structures (list, tuple, dictionary, set), loops, functions, exceptions, classes; pandas DataFrames; NumPy arrays.
- SQL: the full clause list in course 6, DDL vs DML, joins (inner, left/right/full outer), views, stored procedures, ACID, commit/rollback, constraints.
- Wrangling: missing values (drop vs replace), data formatting, normalization, binning, converting categorical variables to quantitative ones (usually with indicator or dummy variables).
- EDA: descriptive statistics, GroupBy, correlation, chi-square test.
- Models: simple/multiple/polynomial regression, logistic regression, decision trees, regression trees, SVM, KNN, random forests, XGBoost, k-means, DBSCAN, HDBSCAN, PCA, t-SNE, UMAP; pipelines.
- Evaluation: R squared, MSE, residual plots, overfitting, underfitting, model selection, cross-validation, regularization (ridge), grid search, hyperparameters, bias-variance, ensembles, data leakage.
- Visualization catalog: line, area, histogram, bar, pie, box, scatter, bubble, waffle, word cloud, regression plot, choropleth, maps with markers, sunburst, treemap, dashboards; libraries Matplotlib, Seaborn, Folium, Plotly, Dash.
- Generative AI in data science: synthetic data generation, data augmentation, generative-AI-assisted data preparation and SQL querying, ethics.

---

## 8. Youcubed: DS Learning Objectives and Standards by Unit

**What it is.** The standards spreadsheet for the Youcubed High School Data Science course (Youcubed at Stanford University; materials licensed CC BY-NC 4.0). The FBLA URL is the course's "Standards and Course Approval" page; it links the spreadsheet "DS Learning Objectives and Standards by Unit" (tab "DS Overview and Standards"). The page also notes University of California guidance for 2026-2027 that high school data science courses count as Area C math (not as Algebra II validation). CONFIRMED.

**Structure:** 8 units, each with learning objectives and standards from Common Core math (CCSS), ELA literacy, and the California Computer Science standards (CA CS). CONFIRMED.

| Unit | Learning objectives (paraphrased) | Math standards listed |
|---|---|---|
| 1. Data Tells a Story | Ask specific, relevant questions of data; plan data collection and organization; recognize **variability**; build visual models of **univariate, bivariate, and multivariate** data with technology; communicate patterns with justification; produce a deliverable for a target audience; recognize how data can be **misused and misrepresented** | S-ID.A.1, S-IC.B.6, HS modeling cycle |
| 2. The Data of Our Community: Learning from Data Distributions | Choose numerical variables for **statistical questions**; design a **survey**; spot **biases in data collection and sampling**; **measures of central tendency** and when to use each; **histograms and box plots**; summary statistics and distributions to tell a data story | S-ID.A.1-4, S-ID.B.6, S-IC.A.1, S-IC.B.3, S-MD.B.7(+) |
| 3. Water in Your Life: Bivariate Data and Causality vs. Spurious Correlation | Collect and organize data; use and interpret a **linear regression** and its fit; use regression trends as evidence; **correlation does not imply causation**; evaluate claims for **spurious correlations, confounding variables, and mediating variables** | S-ID.B.6 (a-c), S-ID.C.7, S-ID.C.8, S-ID.C.9, A-CED.A.1-2, A-REI.D.10, F-BF.A.1, F-LE.B.5, S-MD.A.1(+) |
| 4. Shuffling Songs: Probabilistic Modeling | **Theoretical, experimental, and conditional probability**; algorithmic thinking and code outlines; design a **simulation** with variables, loops, and if-then statements; interpret simulation output | S-IC.A.2, S-IC.B.5, S-CP.A.1, S-CP.A.2, S-CP.A.5 |
| 5. Skin Tones and Representation: Categorical Data and Introduction to Linear Algebra | Collect **categorical and numerical** data; **two-way tables**; scatter plots and bar graphs; understand a **clustering algorithm** and apply it; compare models' affordances and limitations by data type | S-ID.B.5, F-IF.A.1, S-IC.B.4, S-CP.A.4, N-Q.A.1, N-Q.A.2 |
| 6. What's the Best Place for Me?: Modeling with Data and Understanding Bias | Pick variables for a **ranking model**; collect and **clean data** in Google Sheets with Google Data Commons; build equations combining variables; **normalization** to compare values; **weighting** to model priorities; **sensitivity analysis**; strengths and limits of a prioritization model; how **bias in the design process** affects results | HS modeling cycle, N-Q.A.1-3, A-SSE.A.1 (a-b) |
| 7. Predicting My Preferences: Introduction to Machine Learning | **Content-based vs collaborative filtering** (recommender systems); fit **polynomials up to degree 8** for prediction; need for **training and testing datasets** and the risks of **overfitting and underfitting**; run and edit recommender-system code; **conditional probability** in modeling; interpret predictive models; **vectors and matrices** as data structures | S-CP.B.6, S-IC.A.1-2, S-CP.A.3, S-CP.A.5, A-CED.A.1-2, A-REI.D.10, F-IF.B.4, F-IF.B.5, F-IF.C.7, N-VM.A.1, N-VM.C.6 |
| 8. Being a Data Scientist | Craft and revise a **research question as the first step of the data science process**; gather data; choose a modeling technique; analyze output in context; communicate to an audience | S-IC.B.6, HS modeling cycle, all earlier standards |

CA CS standards cited include data and analysis (DA) standards for collecting, visualizing, and modeling data and impacts-of-computing (IC) standards (for example 9-12S.DA.7-9, 9-12.DA.10, 9-12S.IC.27). CONFIRMED (codes as listed in the sheet).

### Implications: terms and topics a test writer could draw from Youcubed
- Statistical questions; data collection plans; surveys; sampling methods and **sampling bias**.
- Variability; univariate vs bivariate vs multivariate data; distributions; measures of center (and when the median beats the mean, i.e., skew and outliers); histograms and box plots; summary statistics.
- Misleading or misrepresented data and charts.
- Linear regression fit and interpretation (slope, intercept, residuals, correlation coefficient); **correlation vs causation; spurious correlation; confounding vs mediating variables**.
- Theoretical vs experimental vs conditional probability; simulation (Monte Carlo style) with loops and conditionals.
- Categorical vs numerical data; two-way tables; scatter plots vs bar graphs; a clustering algorithm.
- Data cleaning; normalization; weighted ranking models; sensitivity analysis; bias introduced by the model designer.
- Recommender systems: content-based vs collaborative filtering; polynomial fitting; training vs testing sets; overfitting vs underfitting; vectors and matrices.
- The data science process starting from a research question; the modeling cycle; communicating to an audience.

---

## 9. Terms and topics to make sure we teach (beyond the baseline)

The baseline already planned for the app: data science lifecycle (OSEMN, CRISP-DM), data types and levels of measurement, number systems and encodings, data sources, wrangling, descriptive statistics, normal distribution, expected value, probability and Bayes, visualization choice, multivariate methods (dependence vs interdependence), data cleaning and quality, regression, decision trees, k-means, model metrics, SQL and relational databases, pandas/NumPy/PyTorch/R, AI subfields, generative AI and LLMs, ML paradigms and data splits, neural networks and deep learning, predicate logic, Bayesian networks, knowledge representation, AI ethics, bias, LLM security and privacy, hallucinations.

Everything below is **in addition** to that baseline, grouped by FBLA knowledge area, with the source in brackets. Items marked UNVERIFIED come only from the unverifiable older Google page.

### 9.1 Data Literacy and Foundations
- **Rollins' Foundational Data Science Methodology, all 10 stages in order** (Business Understanding, Analytic Approach, Data Requirements, Data Collection, Data Understanding, Data Preparation, Modeling, Evaluation, Deployment, Feedback), its five paired lessons, and how it maps to CRISP-DM's 6 stages [IBM].
- Analytic approach by question type (descriptive, predictive, classification) [IBM]; research question as the first step and the modeling cycle [Youcubed]; the data cycle verbs obtain, wrangle, curate, manage, process, explore, analyze, communicate [ACM]; ML lifecycle and ML pipeline steps [CodeHS, IBM, AI4K12 3-A-iv]; storytelling and the structure of a findings report [IBM].
- Data storage and architecture: RDBMS vs NoSQL, data warehouse, data mart, data lake, ETL, data pipelines, data integration (schema mapping), metadata [IBM, ACM].
- Big data and scale: Hadoop, HDFS, Hive, Spark, MapReduce, cloud computing, distributed storage, problems of scale [IBM, ACM].
- File formats: CSV, JSON, plain text; understanding file formats [IBM].
- Data collection methods: REST APIs and HTTP requests, web scraping (HTML, BeautifulSoup) and its ethics, surveys and sampling plans, public datasets (Kaggle, Google Data Commons, IBM Data Asset eXchange, ImageNet, COCO), IoT and sensors [IBM, ACM, Youcubed, AI4K12].
- Sensor data and its encoding: camera (pixels, RGB, resolution, dynamic range), microphone (sampling rate, frequency response, noise), radar and lidar (depth images), GPS (triangulation to latitude/longitude), accelerometer (3 orthogonal axes); infrared, ultraviolet, ultrasonic sensing [AI4K12 1-A].
- Digital representation beyond base conversion: bits, bytes, words; numeric precision; **floating-point error** (overflow, underflow, rounding, truncation); characters and strings; images as integer matrices [ACM CCF, ACM PDA, ACM DG].
- Transformation vocabulary: standardization, normalization, encoding (categorical to numeric / indicator variables), binning, discretization, smoothing, sampling, filtering, compression [ACM DG, IBM].
- Feature encoding choices (age as months, years, or ranges) and their effect on models [AI4K12 3-C-i].
- Data science and AI in organizations (products, services, decisions; health care, government, advertising) [Harvard].

### 9.2 Probability and Statistics Foundations
- Probability axioms, random variables, independence, conditional and marginal probability [ACM]; theoretical vs experimental vs conditional probability [Youcubed U4].
- Simulation (random number generation, Monte Carlo) [Youcubed U4, ACM PDA].
- Statistical questions; survey design; sampling methods and sampling bias [Youcubed U2].
- Variability; univariate, bivariate, multivariate data [Youcubed U1].
- z-scores and outlier detection; probability distributions [ACM DM].
- Correlation coefficient and correlation statistics [IBM, ACM]; chi-square test for categorical variables [IBM].
- Correlation vs causation; spurious correlation; confounding variables; mediating variables [Youcubed U3].
- Two-way tables [Youcubed U5].

### 9.3 Data Analysis and Statistics for AI
- Full chart catalog: line, area, bar, pie, bubble, waffle, word cloud, regression plot, residual plot, KDE plot, maps with markers, choropleth, sunburst, treemap, pivot chart, dashboards; map-, pixel-, glyph-, and graph-based displays; color and scaling choices; accessibility; misleading charts [IBM, ACM AP, Youcubed U1].
- Visualization libraries: Matplotlib, Seaborn, Folium, Plotly, Dash, ggplot2 [IBM].
- Regression family: simple, multiple, polynomial (degree, up to 8 in Youcubed), non-linear, logistic; ridge regression and regularization; pipelines; residuals [IBM, Youcubed U7, AI4K12 3-A-ii].
- Dimensionality reduction (interdependence-style methods): PCA, ICA, NMF, SVD, t-SNE, UMAP [ACM, IBM].
- Clustering beyond k-means: hierarchical/agglomerative, density-based (DBSCAN, HDBSCAN), mean shift, Gaussian mixture models; judging cluster quality [ACM, IBM].
- Classifiers beyond decision trees: KNN, Naive Bayes, SVM (kernels), regression trees, random forests, bagging, boosting, XGBoost, multi-class classification [ACM, IBM].
- Distance and similarity: Euclidean, Manhattan (Lk), cosine similarity [ACM DM].
- Other data-mining tasks: association rules (Apriori, FP-growth), outlier detection, time series (stationarity, forecasting), information retrieval (Boolean operators, indexing, PageRank) [ACM DM].
- Data cleaning specifics: handling missing values (drop vs replace), data formatting, entity resolution for duplicates, data-quality dimensions, rule-based cleaning [IBM, ACM DG].
- Data leakage [IBM].
- Recommender systems: content-based vs collaborative filtering [Youcubed U7, ACM].
- Weighted ranking models, normalization for comparison, sensitivity analysis [Youcubed U6].

### 9.4 Tools for Data and AI
- SQL beyond basic SELECT: COUNT, DISTINCT, LIMIT; INSERT, UPDATE, DELETE; CREATE, ALTER, DROP, TRUNCATE; **DDL vs DML**; LIKE patterns and ranges; ORDER BY; GROUP BY; built-in and date/time functions; sub-queries and nested selects; implicit joins; inner and outer joins; views; stored procedures; **ACID transactions** (commit, rollback); relational model constraints [IBM].
- SQL injection as a security risk [ACM CCF].
- Python fundamentals: data types; list, tuple, dictionary, set; conditions, loops, functions, exceptions, classes; file reading and writing [IBM].
- Python data stack: pandas (DataFrame, GroupBy), NumPy (1D and 2D arrays), SciPy, scikit-learn (pipelines, GridSearchCV), Requests, BeautifulSoup [IBM]; TensorFlow and Caffe alongside PyTorch [ACM].
- Environments: Jupyter Notebook and JupyterLab (kernels, Markdown cells), Anaconda, RStudio, IBM Watson Studio, cloud-hosted notebooks [IBM].
- Version control: Git vs GitHub; repository, commit, branch, merge, pull request [IBM, ACM PDA].
- Languages of data science: Python, R, SQL, Scala, Java, C++, JavaScript, Julia; open-source vs commercial vs cloud tools [IBM].
- R specifics: RStudio IDE, packages, plotting, ggplot [IBM].
- NoSQL vs relational [IBM].
- Data structures and algorithm basics: arrays, lists, stacks, queues, sets, maps/hash tables, trees, graphs, sparse vs dense matrices; sorting and searching; Big-O time and space complexity [ACM PDA].
- AI tools named in the references: ChatGPT, Gemini, Hugging Face, Teachable Machine, TensorFlow Playground and Projector, Chatbot Arena, Google Experiments, DALL-E [CodeHS, Google, AI4K12].

### 9.5 AI Basics
- AI definition and contributing disciplines; data + algorithms + computing power [Google].
- Google's four core areas (ML, deep learning, NLP, computer vision) and ACM's subfield list (knowledge representation, logical and probabilistic reasoning, planning, perception, NLP, learning, robotics) [Google, ACM].
- **Types of AI by capability: ANI, AGI, ASI; by functionality: reactive machines (Deep Blue), limited memory, theory of mind, self-aware** (self-aware as a functional type is UNVERIFIED for the current page) [Google]; narrow vs broad AI [AI4K12 4-D].
- AI history: Turing Test 1950, Dartmouth 1956, ELIZA, Shakey, AI winters, expert systems, Deep Blue 1997, deep learning boom of the 2010s [Google].
- Myths vs reality (not conscious, not inherently unbiased, augments more than replaces jobs) and benefit lists (automation, fewer errors, less repetitive work, speed and accuracy, constant availability, faster research) [Google].
- **Generative vs predictive AI** [CodeHS]; **prompt engineering** [CodeHS]; comparing LLMs [CodeHS]; text-to-image generation [CodeHS, Google].
- **Multimodal** LLMs; **AI agents and agentic AI** (perceive, plan, reason, act, learn) [Google].
- Transformer networks and word embeddings as the basis of LLMs [AI4K12 2-A-iv, 4-A-iii].
- Generative AI for data work: synthetic data generation, data augmentation, data preparation and querying [IBM course 11].
- Perception (Big Idea 1): sensing vs perception; feature extraction; abstraction pipeline for speech and vision; domain knowledge from large datasets [AI4K12].
- Natural interaction (Big Idea 4): NLP tasks (summarization, generation, sentiment analysis, question answering, machine translation, conversation); NLP approaches (keyword matching, dictionary lookup, templates, intent recognition with deep networks); ambiguity types (lexical, reference, attachment/syntactic, polysemy); parse trees (NP, VP, PP); POS tagging; context-free grammars; commonsense reasoning (naive physics, folk psychology, Winograd sentences); emotion recognition cues and affective responses [AI4K12].
- Text processing: bag-of-words, TF-IDF, n-grams, stop words, stemming [ACM DG].
- Consciousness, self-awareness, Turing test, artificial superintelligence debate [AI4K12 4-D, Google].
- The five AI4K12 Big Idea names [AI4K12].

### 9.6 Machine Learning
- ML defined as acquiring behavior without explicit programming; learning = changing internal representations (tree nodes, network weights, regression parameters, RL value estimates or policies) [AI4K12 Big Idea 3].
- Learning (training) phase vs application (inference) phase; using a model does not change it [AI4K12 3-A-iv].
- **Cross-validation set used to decide when to stop training**; test set never used in training [AI4K12 3-A-iv, ACM, IBM].
- Overfitting vs underfitting; **bias-variance trade-off**; regularization (ridge, early stopping, dropout); hyperparameters and grid search; ensembles [ACM, IBM, Youcubed U7].
- Specific metrics: accuracy, precision, recall, F1, AUROC, confusion matrix, MAE, MSE, RMSE, R squared; evaluating clusters [ACM, IBM].
- **Semi-supervised learning** (UNVERIFIED source: older Google page; teach briefly) [Google]; mixed methods (HMMs, collaborative filtering) [ACM]; AutoML [ACM, elective].
- Classification vs prediction (regression) vs clustering vs sequential decision, and mapping each to supervised, unsupervised, or reinforcement learning [AI4K12 3-A-vi, 2-C-i].
- Reinforcement learning vocabulary: agent, action, reward or reinforcement signal, **policy**, trial and error, Q tables, Markov Decision Processes, grid world [AI4K12, ACM].
- Neural network internals: neuron, weights, weighted sum, threshold or transfer (activation) function, input/hidden/output layers, perceptron learning rule, **backpropagation**, random initial weights [AI4K12 3-B, ACM].
- Architectures: feed-forward, **CNN** (kernels, convolution, max pooling), **RNN** (feedback connections), **LSTM**, **GAN** (generator, discriminator, deepfakes), transformers [AI4K12, ACM, IBM].
- Regression as parameter fitting: y = mx + b, mean squared error, decision boundary at 0.5 for logistic-style classification [AI4K12 3-A-ii].
- Decision-tree learning picks the most informative feature at each node (information theory) [AI4K12 3-A-v, ACM].
- Datasets: size and diversity needs, labeling cost and expertise, bounding boxes, ImageNet, COCO, Kaggle; feature encoding effects [AI4K12 3-C].
- Training tools: Teachable Machine, TensorFlow Playground, scikit-learn [CodeHS, AI4K12, IBM].
- GPUs for deep learning [ACM].

### 9.7 Perception, Representation, and Reasoning
- **Intelligent agent and the sense-deliberate-act cycle** [AI4K12 Big Idea 2].
- **Symbolic vs numerical representations**; representation = data structure, reasoning = algorithm; "knowing" = represent + reason [AI4K12].
- Representations: geometric vs topological maps, trees (root, parent, child, leaf/terminal), graphs (nodes, labeled links, source and target), semantic networks, **schemas and inheritance** (schema.org), **knowledge graphs** (search-engine knowledge panels), ontologies (ConceptNet, YAGO) [AI4K12, ACM].
- **Propositional vs predicate (first-order) logic**; universal quantifier and implication notation; **syllogism** (major premise, minor premise, conclusion); inference rules; logical deduction; **forward vs backward chaining**; **resolution theorem proving**; IF-THEN rules and **expert systems** [AI4K12, ACM, Google (expert systems in history)].
- Probability-based reasoning specifics: random variables, conditional and marginal probability, independence relations, **belief propagation / inference in Bayesian networks**, causal models, Markov Decision Processes [ACM].
- Search: state space, operators, start and goal states, search tree; **breadth-first, depth-first, best-first, A\***; heuristic search; **adversarial search** (alternating player and opponent best moves) with **alpha-beta pruning**; combinatorial search; constraint satisfaction; genetic algorithms; simulated annealing [AI4K12, ACM].
- The eight reasoning-problem types (classification, prediction, sequential decision, combinatorial search, heuristic search, adversarial search, logical deduction, statistical inference) and an algorithm for each [AI4K12 2-C].
- Perception pipeline: signal to features to objects (edges, contours, surfaces, objects, scenes; waveforms to sentences) [AI4K12 Big Idea 1].
- Commonsense knowledge representation: naive physics, folk psychology [AI4K12 4-B].

### 9.8 Privacy and Ethics
- **Ethical design criteria: fairness, transparency, explainability, accountability, respect for privacy, adherence to societal values** (with one-line definitions) [AI4K12 5-A-ii].
- Disparate impact; stakeholders and conflicting values; **ethical matrix**; **model cards** [AI4K12 5-A].
- Bias sources and examples: unrepresentative or imbalanced training data, historical bias (Amazon resume screener), proxy variables (health-care risk algorithm), bias at every dataset step, bias from the model designer's choices, performance gaps for accents, darker skin tones, children's speech; bias in lending, hiring, policing [AI4K12, Youcubed U6, Google, CodeHS].
- LLM and AI security: **prompt injection (including hidden in images)**, **data poisoning**, **adversarial examples**, AI-enabled scams, reviewing AI-generated code; general controls (encryption, hashing, access control, data integrity checks) [CodeHS, ACM DPSIA, Google].
- Privacy: surveillance (face recognition in public, license-plate trackers, tracking of searches and browsing to build profiles); privacy laws GDPR, HIPAA, GLBA; data confidentiality [AI4K12 5-B-ii, ACM].
- Deepfakes and misinformation; hallucinations; credibility checks [CodeHS, AI4K12].
- Legal and IP: copyright and generative-AI training data, patents, trademarks, trade secrets; regulation of AI (facial recognition, autonomous vehicles) [CodeHS, ACM, AI4K12].
- Societal and economic impact: automation and jobs, AI-enabled career skills, Amara's Law, the fourth industrial revolution, AI for social good and the UN Sustainable Development Goals [AI4K12 5-C, 5-D].
- Debates: AI-made art and text, students using LLMs for homework, use of personal or copyrighted data [AI4K12 5-B-i].
- AGI and ASI safety and existential risk [Google].
- Explainability tools (LIME) and algorithmic transparency and accountability [ACM].

---

## 10. Sources (all accessed 2026-11-01)

- **R0** FBLA. 2026-2027 Competitive Events Guidelines: Data Science & AI (Updated August 2026), reference list and objectives. https://connect.fbla.org/headquarters/files/High%20School%20Competitive%20Events%20Resources/Individual%20Guidelines/Objective%20Tests/Data-Science-and-AI.pdf . Accessed 2026-11-01.
- **R0a** MBA Research. FBLA HS Data Science and AI Study Guide (footnote naming six source documents). https://www.mbaresearch.org/wp-content/uploads/2026/03/FBLA-HS-Data-Science-and-AI-Study-Guide.pdf . Accessed 2026-11-01.

AI4K12

- **R1** AI4K12. Grade Band Progression Charts. https://ai4k12.org/gradeband-progression-charts/ . Accessed 2026-11-01.
- **R1a** AI4K12. Big Idea 1 overview and Draft Progression Chart v0.1 (May 28, 2020). https://ai4k12.org/big-idea-1-overview/ ; https://ai4k12.org/wp-content/uploads/2021/01/AI4K12-Big-Idea-1-Progression-Chart-Working-Draft-of-Big-Idea-1-v.5.28.2020.pdf . Accessed 2026-11-01.
- **R1b** AI4K12. Big Idea 2 overview and Draft Progression Chart v0.1 (June 28, 2021). https://ai4k12.org/big-idea-2-overview/ ; https://ai4k12.org/wp-content/uploads/2022/03/AI4K12-Big-Idea-2-Progression-Chart-Working-Draft-of-Big-Idea-2-v.06.28.2021_v3.pdf . Accessed 2026-11-01.
- **R1c** AI4K12. Big Idea 3 overview and Draft Progression Chart v0.1 (November 19, 2020). https://ai4k12.org/big-idea-3-overview/ ; https://ai4k12.org/wp-content/uploads/AI4K12-Big-Idea-3-Progression-Chart-Working-Draft-of-Big-Idea-3-v.08.07.2026-b-1.pdf . Accessed 2026-11-01.
- **R1d** AI4K12. Big Idea 4 page and Draft Progression Chart v0.2 (March 14, 2022). https://ai4k12.org/big-idea-4-natural-interaction/ ; https://ai4k12.org/wp-content/uploads/2022/12/AI4K12-Big-Idea-4-Progression-Chart-Working-Draft-v.3.14.2022_2.pdf . Accessed 2026-11-01.
- **R1e** AI4K12. Big Idea 5 page and Draft Progression Chart v0.1 (December 22, 2022). https://ai4k12.org/big-idea-5-societal-impact/ ; https://ai4k12.org/wp-content/uploads/2022/12/AI4K12-Big-Idea-5-Progression-Chart-Working-Draft_v.0.1_12.22.2022.pdf . Accessed 2026-11-01.

ACM

- **R2** ACM Data Science Task Force. Computing Competencies for Undergraduate Data Science Curricula (January 2021). https://www.acm.org/binaries/content/assets/education/curricula-recommendations/dstf_ccdsc2021.pdf . Direct fetch returned HTTP 403; read through the r.jina.ai reader (https://r.jina.ai/https://www.acm.org/binaries/content/assets/education/curricula-recommendations/dstf_ccdsc2021.pdf): table of contents, Chapter 3, Appendix A. Accessed 2026-11-01.

CodeHS

- **R3** CodeHS. Intro to AI Syllabus (High School, one month). https://codehs.com/uploads/224a0c7cb8de30b494ec9c2286a73a28 . Accessed 2026-11-01.
- **R3a** CodeHS. Introduction to AI for High School (1 Month), course explore page (lesson titles). https://codehs.com/course/23378/explore . Accessed 2026-11-01.

Google Cloud

- **R4** Google Cloud. What is artificial intelligence (AI) (current title "Artificial Intelligence (AI): A Simple-to-Understand Guide"). https://cloud.google.com/learn/what-is-artificial-intelligence . Direct fetch returned truncated content; read through the r.jina.ai reader. Older versions could not be opened (web.archive.org and archive.ph blocked for the fetch tool). Accessed 2026-11-01.

Harvard

- **R5** Harvard Online. Data Science Principles. https://www.harvardonline.harvard.edu/course/data-science-principles . HTTP 429 (rate limited) on three attempts; content not read. Accessed (attempted) 2026-11-01.
- **R5a** Harvard Professional and Lifelong Learning. Data Science and AI Principles (catalog page for the same course). https://pll.harvard.edu/course/data-science-principles . Accessed 2026-11-01.

IBM / Coursera

- **R6** Coursera. IBM Data Science Professional Certificate. https://www.coursera.org/professional-certificates/ibm-data-science/ . Accessed 2026-11-01.
- **R6a** Coursera. Data Science Foundations: Tools, Careers & Real-World Applications. https://www.coursera.org/learn/what-is-datascience . Accessed 2026-11-01.
- **R6b** Coursera. Essential Tools for Data Scientists: Git, Jupyter & More. https://www.coursera.org/learn/open-source-tools-for-data-science . Accessed 2026-11-01.
- **R6c** Coursera. Data Science Methodology: Apply the Framework in Real Projects. https://www.coursera.org/learn/data-science-methodology . Accessed 2026-11-01.
- **R6d** Coursera. Python for Data Science & AI: Hands-On Development. https://www.coursera.org/learn/python-for-applied-data-science-ai . Accessed 2026-11-01.
- **R6e** Coursera. Databases and SQL for Data Science with Python. https://www.coursera.org/learn/sql-data-science . Accessed 2026-11-01.
- **R6f** Coursera. Data Analysis with Python: From Raw Data to Insights. https://www.coursera.org/learn/data-analysis-with-python . Accessed 2026-11-01.
- **R6g** Coursera. Data Visualization with Python: Hands-On Projects. https://www.coursera.org/learn/python-for-data-visualization . Accessed 2026-11-01.
- **R6h** Coursera. Machine Learning with Python: Build Real-World ML Models. https://www.coursera.org/learn/machine-learning-with-python . Accessed 2026-11-01.
- **R6i** Coursera. Applied Data Science Capstone. https://www.coursera.org/learn/applied-data-science-capstone . Accessed 2026-11-01.
- **R6j** Coursera. Generative AI: Elevate Your Data Science Career. https://www.coursera.org/learn/generative-ai-elevate-your-data-science-career . Accessed 2026-11-01.

Youcubed

- **R7** Youcubed High School Data Science. Standards and Course Approval page. https://hsdatascience.youcubed.org/resources-standards-and-course-approval/ . Accessed 2026-11-01.
- **R7a** Youcubed. Mathematics and CS Standards (view only) download page. https://hsdatascience.youcubed.org/downloadable/mathematics-and-cs-standards-view-only/ . Accessed 2026-11-01.
- **R7b** Youcubed. "DS Learning Objectives and Standards by Unit" (published Google Sheet; read as CSV export). https://docs.google.com/spreadsheets/d/e/2PACX-1vS-b4Itrhs6SssypQ24M75Axf3zqBYwoLYRRkh0iyWDjVjw_-kRUaGUNYwHhkdmACjjvyWqkUazNgj8/pubhtml (CSV: same address ending in pub?output=csv). Accessed 2026-11-01.

Note: the web-search budget for this session ran out near the end of the research, so no further searching was possible for the Harvard outline or an archived copy of the older Google Cloud page.
