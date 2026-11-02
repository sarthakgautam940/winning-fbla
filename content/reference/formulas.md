---
id: formulas
title: Formula and fact sheet
---

Everything you might need to compute or recall in 30 seconds, on one page. Each item is taught in full in its lesson.

## Center and position

| What | Formula or rule |
|---|---|
| Mean | $$\bar{x} = \dfrac{\sum x}{n}$$ |
| Weighted mean | $$\dfrac{\sum w_i x_i}{\sum w_i}$$ |
| Median | Sort first. Odd n: the middle value, position $$\tfrac{n+1}{2}$$. Even n: the mean of the two middle values. |
| Mode | The most frequent value; a set can have none, one, or several. |
| Range | max minus min |
| Quartiles | Median of the lower half (Q1) and of the upper half (Q3); exclude the median when n is odd. |
| IQR | Q3 minus Q1, the spread of the middle 50% |
| Outlier fences | Below Q1 minus 1.5 IQR, or above Q3 plus 1.5 IQR |
| Skew | Right skew: mean above median. Left skew: mean below median. |

## Spread

| What | Formula or rule |
|---|---|
| Population variance | $$\sigma^2 = \dfrac{\sum (x-\mu)^2}{N}$$ |
| Sample variance | $$s^2 = \dfrac{\sum (x-\bar{x})^2}{n-1}$$ |
| Standard deviation | The square root of the variance, in the data's units |
| Sum of squares shortcut | $$\sum (x-\bar{x})^2 = \sum x^2 - \dfrac{(\sum x)^2}{n}$$ |
| Shift and scale | Adding c: spread unchanged. Multiplying by k: SD times $$\lvert k \rvert$$, variance times $$k^2$$. |
| Coefficient of variation | $$CV = \dfrac{s}{\bar{x}} \times 100\%$$ |
| Covariance | Positive: move together. Negative: move opposite. Units are the product of the two units. |
| Correlation | $$r = \dfrac{\text{cov}(x,y)}{s_x s_y}$$, from negative 1 to 1, unitless, linear only |
| Software defaults | NumPy `np.std` divides by n; pandas `.std()`, R `sd()` and Excel `STDEV.S` divide by n minus 1. |

## The normal distribution

| What | Formula or rule |
|---|---|
| z-score | $$z = \dfrac{x-\mu}{\sigma}$$ |
| Empirical rule | About 68%, 95%, and 99.7% of values lie within 1, 2, and 3 standard deviations of the mean. |
| Tails | About 16% above one SD, 2.5% above two SD, 0.15% above three SD |
| Common z values | z = 1.645 (90% middle), 1.96 (95% middle), 2.576 (99% middle) |
| Standard error | $$SE = \dfrac{\sigma}{\sqrt{n}}$$; four times the sample size halves it. |

## Probability and expected value

| What | Formula or rule |
|---|---|
| Complement | $$P(\text{not } A) = 1 - P(A)$$ |
| At least one | $$1 - P(\text{none})$$ |
| Addition | $$P(A \text{ or } B) = P(A) + P(B) - P(A \text{ and } B)$$ |
| Independent events | $$P(A \text{ and } B) = P(A)\,P(B)$$ |
| Conditional | $$P(A \mid B) = \dfrac{P(A \text{ and } B)}{P(B)}$$ |
| Bayes' theorem | $$P(A \mid B) = \dfrac{P(B \mid A)\,P(A)}{P(B)}$$ |
| Expected value | $$E[X] = \sum x\,P(x)$$ |
| Linearity | $$E[aX + b] = aE[X] + b$$ and $$E[X + Y] = E[X] + E[Y]$$ |
| Variance of X | $$\text{Var}(X) = E[X^2] - (E[X])^2$$ |
| Binomial | mean $$np$$, variance $$np(1-p)$$ |
| Poisson | mean equals variance, $$\lambda$$ |

## Data preparation

| What | Formula or rule |
|---|---|
| Min-max normalization | $$x' = \dfrac{x - \min}{\max - \min}$$, onto 0 to 1 |
| Standardization | $$z = \dfrac{x - \mu}{\sigma}$$, mean 0 and SD 1 |
| One-hot encoding | One column per category (k minus 1 if you drop one to avoid the dummy variable trap) |

## Model metrics

| What | Formula or rule |
|---|---|
| Accuracy | $$\dfrac{TP + TN}{\text{all}}$$ |
| Precision | $$\dfrac{TP}{TP + FP}$$: of the predicted positives, how many were right |
| Recall (sensitivity) | $$\dfrac{TP}{TP + FN}$$: of the actual positives, how many were found |
| Specificity | $$\dfrac{TN}{TN + FP}$$ |
| False positive rate | $$\dfrac{FP}{FP + TN}$$ |
| F1 score | $$\dfrac{2PR}{P + R}$$, the harmonic mean of precision and recall |
| MAE, MSE, RMSE | Mean absolute error; mean squared error; the square root of MSE (back in the target's units) |
| R squared | The share of the variance in y explained by the model |
| Type I and II errors | False positive is Type I; false negative is Type II. |

## Machine learning

| What | Formula or rule |
|---|---|
| Gini impurity | $$1 - \sum p_i^2$$ |
| Entropy | $$-\sum p_i \log_2 p_i$$ |
| Information gain | Parent entropy minus the weighted average entropy of the children |
| Sigmoid | $$\sigma(z) = \dfrac{1}{1 + e^{-z}}$$, output between 0 and 1 |
| ReLU | $$\max(0, z)$$ |
| Gradient descent | $$w \leftarrow w - \eta \, \dfrac{\partial L}{\partial w}$$ with learning rate $$\eta$$ |
| Neuron | output = activation(weighted sum + bias) |
| Iterations per epoch | Training examples divided by batch size, rounded up |
| Parameters in a dense layer | inputs times outputs (weights) plus outputs (biases) |

## Number systems

| What | Value |
|---|---|
| Powers of two | 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1,024 |
| Hex digits | A = 10, B = 11, C = 12, D = 13, E = 14, F = 15 |
| n bits | $$2^n$$ values; largest unsigned value $$2^n - 1$$ |
| Signed n bits (two's complement) | $$-2^{n-1}$$ to $$2^{n-1} - 1$$ |
| One byte | 8 bits = 2 hex digits; FF = 255 |
| KB versus KiB | 1 KB = 1,000 bytes; 1 KiB = 1,024 bytes |
| ASCII anchors | "A" = 65, "a" = 97, "0" = 48; lowercase is uppercase plus 32 |
| 24-bit color | 256 levels per channel, 16,777,216 colors; #RRGGBB in hex |

## SQL

| What | Rule |
|---|---|
| Written order | SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT |
| Logical order | FROM and JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT |
| WHERE versus HAVING | WHERE filters rows before grouping; HAVING filters groups after aggregating. |
| NULL | Test with IS NULL. Aggregates skip NULL; COUNT(*) counts rows, COUNT(column) skips NULL. |
| Joins | INNER keeps matches only. LEFT keeps every left row, padding with NULL. FULL OUTER keeps everything. |

## Logic and Bayesian networks

| What | Rule |
|---|---|
| "All A are B" | $$\forall x\,(A(x) \rightarrow B(x))$$ |
| "Some A are B" | $$\exists x\,(A(x) \land B(x))$$ |
| Negations | $$\lnot \forall x\,P(x) \equiv \exists x\,\lnot P(x)$$ and $$\lnot \exists x\,P(x) \equiv \forall x\,\lnot P(x)$$ |
| Modus ponens | From $$P \rightarrow Q$$ and $$P$$, conclude $$Q$$. |
| Modus tollens | From $$P \rightarrow Q$$ and $$\lnot Q$$, conclude $$\lnot P$$. |
| Joint probability | $$P(x_1, \dots, x_n) = \prod_i P(x_i \mid \text{Parents}(X_i))$$ |
| Table size | A true/false node with k true/false parents needs $$2^k$$ numbers. |
