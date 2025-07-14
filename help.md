RShinyStapplet_UPDATES/help.md
# Stapplet R Shiny App Help Guide

Welcome to the Stapplet R Shiny App! This guide provides an overview of the app's modules, their purpose, and instructions for use. Each module is designed to help you explore, simulate, and understand key concepts in introductory statistics and probability.

---

## Table of Contents

- [General Usage](#general-usage)
- [Module Overview](#module-overview)
  - [Distributions & Calculators](#distributions--calculators)
  - [Confidence Intervals](#confidence-intervals)
  - [Hypothesis Tests](#hypothesis-tests)
  - [Regression](#regression)
  - [Sampling & Simulations](#sampling--simulations)
  - [Activities](#activities)
  - [Tools](#tools)
- [Accessibility](#accessibility)
- [Keyboard Shortcuts & Rapid Navigation](#keyboard-shortcuts--rapid-navigation)
- [Exporting & Downloading Results](#exporting--downloading-results)
- [Contact & License](#contact--license)

---

## General Usage

- **Navigation:** Use the sidebar or tabs to select modules. Each module is self-contained and provides instructions at the top.
- **Inputs:** Enter data, adjust parameters, and use sliders or numeric fields as needed.
- **Outputs:** View plots, tables, and results in the main panel. Many modules include screen-reader-friendly descriptions.
- **Download:** Most modules allow you to export results, plots, or data for further analysis.

---

## Module Overview

### Distributions & Calculators

- **Normal Distribution (`dist_normal.R`):**  
  *Instructions:*  
  - Set the mean and standard deviation using sliders.
  - Choose the probability type (less than, greater than, or between values).
  - Enter the value(s) for X.
  - View the shaded area under the curve and the calculated probability.
  - Simulate samples and download results as needed.

- **Binomial Distribution (`dist_binomial.R`):**  
  *Instructions:*  
  - Enter the number of trials and probability of success.
  - Select the probability type (exact, less than, greater than, etc.).
  - Input the value(s) for X.
  - View the probability bar chart and download results or simulations.

- **Poisson Distribution (`dist_poisson.R`):**  
  *Instructions:*  
  - Set the mean (lambda) for the Poisson process.
  - Choose the probability type and value(s) for X.
  - View the probability distribution and calculated results.
  - Simulate event counts and download data.

- **Chi-Square Distribution (`dist_chi_square.R`):**  
  *Instructions:*  
  - Set degrees of freedom.
  - Choose the probability type and value(s) for X.
  - View the distribution and shaded probability area.
  - Simulate samples and download results.

- **F Distribution (`dist_f.R`):**  
  *Instructions:*  
  - Set numerator and denominator degrees of freedom.
  - Choose the probability type and value for X.
  - View the F-distribution curve and shaded area.
  - Simulate samples and download results.

- **Discrete Random Variable (`dist_discrete_random.R`):**  
  *Instructions:*  
  - Enter values and their probabilities, or paste raw data.
  - Ensure probabilities sum to 1.
  - View the probability bar chart and summary statistics.
  - Calculate probabilities for specific values and simulate samples.

- **Counting Methods (`dist_counting_methods.R`):**  
  *Instructions:*  
  - Select the counting method (permutations, combinations, arrangements, multinomial).
  - Enter the required parameters (n, k, category counts).
  - View the calculation and simulate arrangements.
  - Download results for further analysis.

- **Power Analysis (`dist_power.R`):**  
  *Instructions:*  
  - Choose the test type and set parameters (sample size, alpha, effect size).
  - View the power curve and summary statistics.
  - Adjust parameters to see how power changes.

### Confidence Intervals

- **CI for Mean (`ci_mean.R`):**  
  *Instructions:*  
  - Choose to enter raw data or summary statistics.
  - Set the confidence level and sample size.
  - View the confidence interval plot and summary.
  - Simulate intervals and see how often they capture the true mean.
  - Download results for documentation.

- **CI for Proportion (`ci_proportion.R`):**  
  *Instructions:*  
  - Enter counts or raw data for successes and trials.
  - Set the confidence level and number of simulations.
  - View the confidence intervals and summary statistics.
  - Simulate intervals and check the large counts condition.
  - Download intervals and sample data.

- **CI for Difference in Means (`ci_diff_means.R`):**  
  *Instructions:*  
  - Enter raw data or summary statistics for two groups.
  - Set the confidence level and choose pooled or unpooled variance.
  - View the confidence interval plot and summary.
  - Download results for further analysis.

- **CI for Difference in Proportions (`ci_diff_proportions.R`):**  
  *Instructions:*  
  - Enter successes and sample sizes for two groups.
  - Set the confidence level.
  - View the confidence interval plot and summary.
  - Download results and check inference conditions.

### Hypothesis Tests

- **Mean (`ht_mean.R`):**  
  *Instructions:*  
  - Enter raw data or summary statistics.
  - Set the null hypothesis value and alternative.
  - View the test statistic, p-value, and conclusion.
  - Simulate samples and download results.

- **Proportion (`ht_proportion.R`):**  
  *Instructions:*  
  - Enter counts or raw data for successes and trials.
  - Set the null hypothesis value and alternative.
  - View the test statistic, p-value, and conclusion.
  - Simulate samples and download results.

- **Difference in Means (`ht_diff_means.R`):**  
  *Instructions:*  
  - Enter data for two groups.
  - Set the null hypothesis and alternative.
  - View the test statistic, p-value, and confidence interval.
  - Simulate samples and download results.

- **Difference in Proportions (`ht_diff_proportions.R`):**  
  *Instructions:*  
  - Enter successes and sample sizes for two groups.
  - Set the null hypothesis and alternative.
  - View the test statistic, p-value, and confidence interval.
  - Simulate samples and download results.

- **Chi-Square Goodness-of-Fit (`ht_chi_gof.R`):**  
  *Instructions:*  
  - Enter observed counts and expected proportions for categories.
  - View the chi-square statistic, p-value, and conclusion.
  - Simulate samples and download results.

- **Chi-Square Independence (`ht_chi_ind.R`):**  
  *Instructions:*  
  - Enter observed counts in a contingency table.
  - View the chi-square statistic, p-value, and conclusion.
  - Simulate samples and download results.

### Regression

- **Simple Linear Regression (`regression_slr.R`):**  
  *Instructions:*  
  - Enter paired data for X and Y variables.
  - Fit the regression model and view the equation, plot, and summary statistics.
  - Simulate samples and download results.

- **Multiple Linear Regression (`regression_mlr.R`):**  
  *Instructions:*  
  - Enter data for response and multiple explanatory variables.
  - Fit the regression model and view coefficients, plots, and summary statistics.
  - Simulate samples and download results.

### Sampling & Simulations

- **Sampling Distribution of Mean (`sampling_distribution_mean.R`):**  
  *Instructions:*  
  - Choose population shape and parameters.
  - Set sample size and number of samples.
  - Draw samples and view the distribution of sample means.
  - Compare theoretical and simulated statistics.
  - Download summary and data.

- **Sampling Distribution of Proportion (`sampling_distribution_proportion.R`):**  
  *Instructions:*  
  - Set the population proportion and sample size.
  - Draw samples and view the distribution of sample proportions.
  - Compare theoretical and simulated statistics.
  - Download summary, data, and plots.

- **Probability Simulations (`tools_simulations.R`):**  
  *Instructions:*  
  - Select simulation type (coin flip, dice roll, card draw).
  - Set parameters and run simulations.
  - View results and summary statistics.
  - Download data and plots.

- **Descriptive Tools (`tools_descriptive.R`):**  
  *Instructions:*  
  - Enter quantitative data.
  - View histograms, boxplots, and summary statistics.
  - Simulate samples and explore sampling variability.

### Activities

These modules are designed for interactive classroom activities:

- **Guess the Correlation (`activity_guess_correlation.R`):**  
  *Instructions:*  
  - Click "Generate New Plot" to display a scatterplot.
  - Guess the correlation coefficient using the slider or input.
  - Submit your guess and view the actual value and score.
  - Download round data for review.

- **Smell Parkinson's (`activity_smell_parkinsons.R`):**  
  *Instructions:*  
  - Enter the number of trials and correct identifications.
  - Set the probability of guessing correctly.
  - Run simulations to see the distribution of correct guesses.
  - View the p-value and download results.

- **Mrs. Gallas Free Throws (`activity_mrs_gallas.R`):**  
  *Instructions:*  
  - Enter the claimed success rate, number of trials, and observed successes.
  - Choose the alternative hypothesis.
  - Run simulations to see the distribution of successes.
  - View the p-value and summary statistics.

- **Sampling Sunflowers (`activity_sampling_sunflowers.R`):**  
  *Instructions:*  
  - Set the sample size.
  - Take samples to build the sampling distribution of means.
  - Observe how the distribution approaches normality.
  - View population, sample, and sampling distribution plots.

- **Candy Chi-Square (`activity_candy_chi_square.R`):**  
  *Instructions:*  
  - Enter category names, claimed proportions, and observed counts.
  - Run simulations to compare your sample to the expected distribution.
  - View the chi-square statistic, p-value, and download results.

- **Hiring Discrimination (`activity_hiring_discrimination.R`):**  
  *Instructions:*  
  - Enter counts for each group and outcome, or paste raw data.
  - Run permutation simulations to test for discrimination.
  - View the observed difference, simulation results, and p-value.
  - Download results for further analysis.

---

## Accessibility

Stapplet Shiny Suite now implements universal accessibility standards across all modules:

- **Screen Reader Support:**  
  - All outputs, especially plots and results, include hidden descriptions (`.sr-only` class) and ARIA live regions for dynamic updates.
  - BrailleR integration provides detailed plot summaries for ggplot2 visualizations.
  - Error/status messages are announced via ARIA live regions.

- **ARIA Roles & Labels:**  
  - All UI containers and controls use ARIA roles (`main`, `form`, `status`, `complementary`, `dialog`, etc.) and programmatic labels for navigation and context.
  - All form inputs have programmatic labels (`aria-label`, `aria-labelledby`, or visible label).

- **Keyboard Accessibility & Shortcuts:**  
  - All interactive elements are keyboard accessible.
  - Keyboard shortcuts for rapid navigation and actions are implemented and documented below.

- **Export/Download Accessibility:**  
  - All download/export buttons include alt text and screen-reader summaries.
  - Exported files (CSV, PNG, TXT) contain accessible summaries where applicable.

- **Focus Management:**  
  - Modal dialogs trap focus and return it to the triggering element after close.
  - ARIA attributes (`role="dialog"`, `aria-modal="true"`) are used for all modals/popups.

- **Color Contrast:**  
  - All foreground/background color pairs meet WCAG AA/AAA standards.
  - Colorblind-safe palettes are used throughout the suite.


---

## Keyboard Shortcuts & Rapid Navigation

Stapplet Shiny Suite supports keyboard shortcuts for rapid navigation and actions. These shortcuts are designed for both sighted and screen reader users.

### How to Use Keyboard Shortcuts

- Shortcuts use the `Alt` key (Windows/Linux) or `Option` key (Mac) plus a number or letter.
- Shortcuts work anywhere in the app.
- Screen readers will announce shortcut activation if ARIA live regions are enabled.

### Navigation Shortcuts

| Shortcut         | Action                                      |
|------------------|---------------------------------------------|
| Alt+1            | Go to Distributions module                  |
| Alt+2            | Go to Confidence Intervals module           |
| Alt+3            | Go to Hypothesis Tests module               |
| Alt+4            | Go to Regression module                     |
| Alt+5            | Go to Sampling & Simulations module         |
| Alt+6            | Go to Activities module                     |
| Alt+S            | Focus sidebar panel                         |
| Alt+M            | Focus main panel                            |
| Alt+H            | Open Help/Documentation                     |

### Action Shortcuts

| Shortcut         | Action                                      |
|------------------|---------------------------------------------|
| Alt+R            | Run simulation or calculation               |
| Alt+E            | Export/download results                     |
| Alt+D            | Focus download buttons                      |
| Alt+F            | Open Preferences/Settings                   |

### Tips for Screen Reader Users

- ARIA live regions will announce navigation and actions.
- Use Tab/Shift+Tab to move between interactive elements.
- All shortcut actions are available via keyboard and do not require a mouse.
- All plots and results have `.sr-only` descriptions and ARIA live regions.
- BrailleR integration provides detailed plot summaries for ggplot2 visualizations.
- Error/status messages are announced via ARIA live regions.

---


## Exporting & Downloading Results

- **Download Buttons:** Look for download buttons in each module to export plots, tables, or simulation results.
- **Formats:** CSV for data/tables, PNG for plots, TXT for summaries.
- **Accessibility:** All download/export buttons include alt text and screen-reader summaries. Exported files contain accessible summaries where applicable.

---

## Contact & License

- **Author:** Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)
- **License:** Apache License, Version 2.0. See individual files for details.
- **Feedback:** For questions, suggestions, or bug reports, contact the author or open an issue on the project repository.

---

## Linking Help

To access this help file from the app, use the link or button provided in the main UI (`app.R`). You can also open `help.md` directly for a printable summary.

---

## Feedback & Accessibility Support

For questions, feedback, or suggestions regarding accessibility, please contact:  
Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)

---

**Enjoy exploring statistics with Stapplet!**