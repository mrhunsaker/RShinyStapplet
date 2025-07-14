# Accessibility Features & Universal Standards — Stapplet Shiny Suite

This document summarizes the universal accessibility standards now implemented across all Stapplet Shiny Suite modules, based on WCAG 2.1 Level AA and R Shiny best practices. All modules now follow a consistent pattern for ARIA roles, screen reader support, keyboard navigation, color contrast, error/status messaging, and accessible downloads. Usage instructions and accessibility tips are provided below.

---

## Universal Accessibility Features (All Modules)

### **Implemented Standards**

- **Consistent ARIA Roles & Labels:**  
  All UI containers and controls use ARIA roles (`main`, `form`, `status`, `complementary`, `dialog`, etc.) and programmatic labels for navigation and context.
- **Screen Reader Support:**  
  All outputs, especially plots and results, include `.sr-only` descriptions and ARIA live regions for dynamic updates.
- **Keyboard Navigation & Shortcuts:**  
  All interactive elements are keyboard accessible. Shortcuts for rapid navigation and actions are implemented and documented.
- **Color Contrast & Colorblind-Friendly Design:**  
  High-contrast, colorblind-safe palettes are used throughout. All foreground/background pairs meet WCAG AA/AAA standards.
- **Accessible Error/Status Messaging:**  
  All error and status messages use ARIA live regions and are specific/actionable for screen reader users.
- **Accessible Export/Download Features:**  
  All download/export buttons include alt text and screen-reader summaries.
- **Focus Management for Modals/Popups:**  
  All modal dialogs use ARIA attributes and return focus to the triggering element after close.
- **BrailleR Integration for Plots:**  
  All ggplot2-based visualizations use BrailleR for detailed, human-readable descriptions. Screen-reader-only paragraphs describe base R plots.
- **Comprehensive Documentation:**  
  README, help, and this file provide accessibility instructions and module-specific guidance.

---

## Usage Instructions

### Keyboard Shortcuts

- Use `Alt` (Windows/Linux) or `Option` (Mac) plus the following keys:
  - Alt+1: Go to Distributions module
  - Alt+2: Go to Confidence Intervals module
  - Alt+3: Go to Hypothesis Tests module
  - Alt+4: Go to Regression module
  - Alt+5: Go to Sampling & Simulations module
  - Alt+6: Go to Activities module
  - Alt+S: Focus sidebar panel
  - Alt+M: Focus main panel
  - Alt+H: Open Help/Documentation
  - Alt+R: Run simulation or calculation
  - Alt+E: Export/download results
  - Alt+D: Focus download buttons
  - Alt+F: Open Preferences/Settings

- All shortcut actions are available via keyboard and do not require a mouse. Screen readers will announce shortcut activation if ARIA live regions are enabled.

### Screen Reader Features

- All plots and results have `.sr-only` descriptions and ARIA live regions.
- BrailleR integration provides detailed plot summaries for ggplot2 visualizations.
- Error/status messages are announced via ARIA live regions.

### Export/Download Features

- Download buttons include alt text and screen-reader summaries.
- Exported files (CSV, PNG, TXT) contain accessible summaries where applicable.

### Focus Management

- Modal dialogs trap focus and return it to the triggering element after close.
- ARIA attributes (`role="dialog"`, `aria-modal="true"`) are used for all modals/popups.

### Color Contrast

- All foreground/background color pairs meet WCAG AA/AAA standards.
- Colorblind-safe palettes are used throughout the suite.

---

## Limitations and Future Work

- Formal third-party accessibility audit recommended for edge cases.
- Continued refinement of keyboard shortcuts and ARIA attribute consistency.
- User feedback is encouraged to further improve accessibility.

---

## References

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [R Shiny Accessibility Best Practices](https://shiny.rstudio.com/articles/accessibility.html)
- [BrailleR Package for R](https://cran.r-project.org/web/packages/BrailleR/index.html)

---

**For questions, feedback, or suggestions regarding accessibility, please contact:**  
Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)

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

---

## Module-by-Module Accessibility Analysis

| Module/File                          | Strengths                                                                 | Weaknesses                                                                |
|--------------------------------------|---------------------------------------------------------------------------|---------------------------------------------------------------------------|
| **app.R / ui.R**                     | - ARIA roles for all main sections<br>- `.sr-only` for hidden descriptions<br>- Keyboard navigation<br>- Accessible error/status<br>- Colorblind-friendly CSS<br>- Font & layout optimized | - Modal dialogs may lack focus management<br>- Some plot alt text may be generic |
| **activity_candy_chi_square.R**      | - ARIA roles<br>- Accessible tables<br>- Download buttons<br>- Screen reader plot descriptions | - May lack detailed alt text for simulation plots                         |
| **activity_guess_correlation.R**     | - Instructions panel<br>- ARIA roles<br>- Accessible results<br>- Downloadable round data<br>- Keyboard-friendly controls | - Scatterplot description could be more detailed for screen readers       |
| **activity_hiring_discrimination.R** | - Accessible input forms<br>- ARIA labels<br>- Simulation results with descriptions<br>- Download/export | - Error messages could be more specific                                   |
| **activity_mrs_gallas.R**            | - Accessible simulation controls<br>- ARIA roles<br>- Downloadable results | - Plot alt text may be brief                                              |
| **activity_sampling_sunflowers.R**   | - Accessible sampling controls<br>- ARIA roles<br>- Hidden plot descriptions | - Focus management after sampling actions                                 |
| **activity_smell_parkinsons.R**      | - ARIA roles<br>- Accessible simulation summary<br>- Download/export<br>- Screen reader plot description | - Modal error dialogs may not return focus                                |
| **anova_one_way.R**                  | - Accessible input and output<br>- ARIA roles<br>- Downloadable results    | - Plot descriptions could be expanded                                     |
| **ci_diff_means.R**                  | - Accessible CI controls<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **ci_diff_proportions.R**            | - Accessible CI controls<br>- ARIA roles<br>- Download/export              | - Plot alt text may be brief                                              |
| **ci_mean.R**                        | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Focus management after simulation                                       |
| **ci_proportion.R**                  | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **dist_binomial.R**                  | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export       | - Plot alt text may be brief                                              |
| **dist_chi_square.R**                | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export       | - Plot alt text may be brief                                              |
| **dist_counting_methods.R**          | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **dist_discrete_random.R**           | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Plot alt text may be brief                                              |
| **dist_f.R**                         | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export       | - Plot alt text may be brief                                              |
| **dist_normal.R**                    | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export<br>- BrailleR integration for plot description | - Focus management after probability calculation                          |
| **dist_poisson.R**                   | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export       | - Plot alt text may be brief                                              |
| **dist_power.R**                     | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **dist_t.R**                         | - Accessible sliders and inputs<br>- ARIA roles<br>- Download/export       | - Plot alt text may be brief                                              |
| **ht_chi_gof.R**                     | - Accessible input forms<br>- ARIA roles<br>- Download/export<br>- Accessible tables | - Plot alt text may be brief                                              |
| **ht_chi_ind.R**                     | - Accessible contingency table<br>- ARIA roles<br>- Download/export<br>- Accessible mosaic plot | - Focus management after simulation                                       |
| **ht_diff_means.R**                  | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **ht_diff_proportions.R**            | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **ht_mean.R**                        | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **ht_proportion.R**                  | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Error feedback for invalid input                                        |
| **regression_mlr.R**                 | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Plot alt text may be brief                                              |
| **regression_slr.R**                 | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Plot alt text may be brief                                              |
| **sampling_distribution_mean.R**     | - Accessible population/sample controls<br>- ARIA roles<br>- Download/export<br>- Hidden plot descriptions | - Focus management after sampling actions                                 |
| **sampling_distribution_proportion.R**| - Accessible population/sample controls<br>- ARIA roles<br>- Download/export<br>- Hidden plot descriptions | - Focus management after sampling actions                                 |
| **tools_descriptive.R**              | - Accessible input forms<br>- ARIA roles<br>- Download/export              | - Plot alt text may be brief                                              |
| **tools_simulations.R**              | - Accessible simulation controls<br>- ARIA roles<br>- Download/export      | - Error feedback for invalid input                                        |

---

## Limitations and Future Work

- Formal third-party accessibility audit recommended for edge cases.
- Continued refinement of keyboard shortcuts and ARIA attribute consistency.
- User feedback is encouraged to further improve accessibility.

---

## References

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [R Shiny Accessibility Best Practices](https://shiny.rstudio.com/articles/accessibility.html)
- [BrailleR Package for R](https://cran.r-project.org/web/packages/BrailleR/index.html)

---

**For questions, feedback, or suggestions regarding accessibility, please contact:**  
Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)

---