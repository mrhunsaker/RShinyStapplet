# Stapplet Shiny Suite

A comprehensive, production-ready suite of interactive R Shiny modules for teaching and exploring statistics and probability. All modules are fully commented, accessible, and designed for clarity, maintainability, and ease of use.

An accessible, R-based suite of statistical applets inspired by Stapplet.com, designed for educational purposes with a strong focus on accessibility, colorblind-friendliness, and WCAG alignment.

## About The Project

Stapplet Shiny Suite provides a collection of self-contained statistical applets, calculators, and classroom activities. Each module is documented with detailed, self-explanatory comments and section headers, making the codebase easy to maintain and extend. The suite is designed for educators, students, and anyone interested in hands-on statistical learning.

All modules include:
- Clear UI and server logic with inline documentation
- Accessibility features (ARIA labels, screen reader support, keyboard navigation)
- Download/export options for results, plots, and data
- Comprehensive help file (`help.md`) with instructions for every module

This project provides a collection of interactive Shiny applications that mirror the functionality of the popular statistics education website, Stapplet.com. The primary goal is to offer a free, open-source, and highly accessible alternative for students and educators. Each applet is designed to illustrate a specific statistical concept, from sampling distributions and confidence intervals to hypothesis testing and regression.

A key focus of this project is to ensure that all tools are usable by as many people as possible, including those who rely on screen readers and other assistive technologies.

### Features

- **Universal Accessibility:**  
  All modules now follow a unified accessibility standard, including ARIA roles, alt text, BrailleR integration, screen-reader descriptions, keyboard shortcuts, and accessible error/status messaging.
- **Screen Reader Support:**  
  Every output, especially plots and results, includes hidden descriptions (`.sr-only` class) and live regions for screen readers.
- **Keyboard Navigation:**  
  All UI elements are accessible via keyboard, with shortcuts for rapid navigation and actions.
- **Color Contrast & Visual Accessibility:**  
  High-contrast, colorblind-safe palettes are used throughout. All foreground/background pairs meet WCAG AA/AAA standards.
- **Accessible Export/Download:**  
  All modules provide accessible download buttons for CSV, PNG, and TXT formats, with alt text and screen-reader summaries.

- **Universal Accessibility:**  
  All modules now follow a unified accessibility standard, including ARIA roles, alt text, BrailleR integration, screen-reader descriptions, keyboard shortcuts, and accessible error/status messaging.
- **Screen Reader Support:**  
  Every output, especially plots and results, includes hidden descriptions (`.sr-only` class) and live regions for screen readers.
- **Keyboard Navigation:**  
  All UI elements are accessible via keyboard, with shortcuts for rapid navigation and actions.
- **Color Contrast & Visual Accessibility:**  
  High-contrast, colorblind-safe palettes are used throughout. All foreground/background pairs meet WCAG AA/AAA standards.
- **Accessible Export/Download:**  
  All modules provide accessible download buttons for CSV, PNG, and TXT formats, with alt text and screen-reader summaries.

- **Distributions & Calculators:** Normal, Binomial, Poisson, Chi-Square, F, Discrete Random Variable, Counting Methods, Power Analysis
- **Confidence Intervals:** For means, proportions, differences in means/proportions
- **Hypothesis Tests:** For means, proportions, differences, chi-square tests
- **Regression:** Simple and multiple linear regression
- **Sampling & Simulations:** Sampling distributions, probability simulations, descriptive tools
- **Classroom Activities:** Interactive modules for correlation guessing, discrimination testing, sampling, and more
- **Accessibility:** ARIA roles, screen reader descriptions, keyboard navigation
- **Exporting:** Download results, plots, and data in CSV, PNG, and TXT formats
- **Comprehensive Documentation:** See `help.md` for detailed instructions and module overviews

The suite includes interactive applets for:

*   **Sampling Distributions**:
    *   Distribution of Sample Means
    *   Distribution of Sample Proportions
*   **Confidence Intervals**:
    *   CI for a Single Mean (t-Interval)
    *   CI for a Difference in Means
    *   CI for a Single Proportion (z-Interval)
    *   CI for a Difference in Proportions
*   **Hypothesis Tests**:
    *   Test for a Single Mean (t-Test)
    *   Test for a Difference in Means
    *   Test for a Single Proportion (z-Test)
    *   Test for a Difference in Proportions
    *   Chi-Square Goodness-of-Fit Test
    *   Chi-Square Test for Independence
*   **Probability Distributions**:
    *   Normal, t, Chi-Square, F, and Binomial distribution calculators.
*   **Regression**:
    *   Simple Linear Regression analysis and visualization.
*   **ANOVA**:
    *   One-Way Analysis of Variance.
*   **Tools**:
    *   Descriptive Statistics calculator.
    *   Probability simulators (coin flips, dice rolls, card draws).

---

## Getting Started

For full instructions and module details, see the [Stapplet R Shiny App Help Guide](help.md).


To get a local copy up and running, follow these simple steps.

### Prerequisites

- R (>= 4.0)
- R Shiny
- Required packages: `ggplot2`, `dplyr`, `DT`, `shinyjs`, `shinyWidgets`, `shinyAccessibility`, `htmltools`, `readr`

*   **R**: You must have a recent version of R installed. You can download it from the [Comprehensive R Archive Network (CRAN)](https://cran.r-project.org/).
*   **RStudio or VS Code**: It is highly recommended to use an IDE like [RStudio Desktop](https://posit.co/download/rstudio-desktop/) or [VS Code](https://code.visualstudio.com/) with the [R Extension](https://marketplace.visualstudio.com/items?itemName=REditorSupport.r).

### Installation

1. Clone or download this repository.
2. Install required R packages.
3. Launch the app with `shiny::runApp()` or open `app.R` in RStudio and click "Run App".

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your_username/RShinyStapplet.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd RShinyStapplet
    ```
3.  **Install required R packages:**
    Open R or RStudio and run the following command in the console to install all necessary dependencies.
    ```R
    install.packages(c("shiny", "ggplot2", "dplyr", "gridExtra", "BrailleR", "viridis"))
    ```

### Usage

- Select modules from the sidebar or tabs.
- Follow instructions at the top of each module.
- Enter data, adjust parameters, and view results.
- Use download buttons to export plots, tables, or simulation results.
- For detailed help, click the "Help" link in the app or open `help.md`.

### Keyboard Shortcuts for Rapid Navigation & Actions

Stapplet Shiny Suite supports keyboard shortcuts for efficient navigation and actions. These shortcuts work for both sighted and screen reader users.

**Navigation Shortcuts:**
- `Alt+1` — Focus sidebar and module selection (Distributions)
- `Alt+2` — Focus sidebar (Confidence Intervals)
- `Alt+3` — Focus sidebar (Hypothesis Tests)
- `Alt+4` — Focus sidebar (Regression)
- `Alt+5` — Focus sidebar (Sampling & Simulations)
- `Alt+6` — Focus sidebar (Activities)
- `Alt+H` — Focus Help section
- `Alt+M` — Focus Main Panel

**Action Shortcuts:**
- `Alt+R` — Run simulation or calculation in current module
- `Alt+D` — Focus Download/Export buttons
- `Alt+E` — Export/download results
- `Alt+F` — Open Preferences/Settings modal

**Instructions for Use:**
- Keyboard shortcuts are enabled by default.
- Use `Alt` plus the specified key (Windows/Linux) or `Option` + key (Mac) to trigger the shortcut.
- Screen reader users: Shortcuts will move focus to the relevant section or activate the action. Listen for confirmation or status messages.
- For a full list of shortcuts, see the Accessibility section below or the Help file.


You can run the application in several ways:

1.  **Using an IDE (Recommended):**
    *   Open the `RShinyStapplet` folder in RStudio or VS Code.
    *   Open the `app.R` file.
    *   In **RStudio**, click the **"Run App"** button that appears at the top of the editor.
    *   In **VS Code** or **Positron**, click the **"Run App"** CodeLens text that appears above the `ui` definition.

2.  **From the R Console:**
    *   Open your R console.
    *   Set your working directory to the `RShinyStapplet` folder.
      ```R
      setwd("path/to/your/RShinyStapplet")
      ```
    *   Run the application.
      ```R
      shiny::runApp()
      ```

3.  **From the Command Line (Quick Entry Scripts):**
    *   Use one of the scripts in the `launch_Scripts` directory to quickly launch the app from your terminal or command prompt.
    *   Available scripts:
        - `launch_shiny_app.sh` (Bash)
        - `launch_shiny_app.zsh` (Zsh)
        - `launch_shiny_app.ps1` (PowerShell)
        - `launch_shiny_app.cmd` (Windows CMD)
    *   Example usage (from the project root):
      ```sh
      bash launch_Scripts/launch_shiny_app.sh
      ```
      Or on Windows:
      ```
      launch_Scripts\launch_shiny_app.cmd
      ```
      Or in PowerShell:
      ```
      .\launch_Scripts\launch_shiny_app.ps1
      ```

The application will launch in a new window or your web browser.

---

## Accessibility Statement

Stapplet Shiny Suite is designed for accessibility and inclusivity. All modules include:
- ARIA labels and roles for screen readers
- Keyboard navigation for all UI elements
- Hidden descriptions for plots and results
- Error and status messages with appropriate ARIA live regions
- **Keyboard Shortcuts:** Rapid navigation and actions (see above for details)

See [help.md](help.md) for a full accessibility feature list and shortcut instructions.

This project is committed to being accessible to all users, including those with disabilities. The applets have been developed to align with the principles of the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.

### Accessibility Features

All modules in the Stapplet Shiny Suite now adhere to universal accessibility standards:

- **Screen Reader Support:**  
  - ARIA roles and landmarks (`role="main"`, `role="complementary"`, etc.) are used throughout for clear navigation.
  - All form controls have programmatic labels (`aria-label`, `aria-labelledby`, or visible label).
  - Dynamic content (results, errors, status) uses ARIA live regions (`aria-live="polite"` or `assertive"`) for non-intrusive updates.
  - Every plot includes alt text, ARIA attributes, and a screen-reader-only dynamic description. BrailleR integration is used for ggplot2 plots where possible.

- **Keyboard Accessibility:**  
  - All controls are reachable and operable via keyboard.
  - Keyboard shortcuts are available for rapid navigation and actions (see below).
  - Tab/Shift+Tab moves between interactive elements; Enter/Space activates buttons.

- **Accessible Export/Download:**  
  - Download/export buttons for CSV, PNG, and TXT formats include alt text and screen-reader summaries.

- **Color Contrast & Visual Accessibility:**  
  - All foreground/background color pairs meet WCAG AA/AAA standards.
  - Colorblind-friendly palettes are used throughout.

- **Error and Status Messaging:**  
  - All error/status messages are specific, actionable, and announced via ARIA live regions.

- **Focus Management:**  
  - Modal dialogs and popups use ARIA attributes and return focus to the triggering element after close.

#### Keyboard Shortcuts

Shortcuts use the `Alt` key (Windows/Linux) or `Option` key (Mac) plus a number or letter.  
Shortcuts work anywhere in the app.  
Screen readers will announce shortcut activation if ARIA live regions are enabled.

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
| Alt+R            | Run simulation or calculation               |
| Alt+E            | Export/download results                     |
| Alt+D            | Focus download buttons                      |
| Alt+F            | Open Preferences/Settings                   |

**Tips for Screen Reader Users:**  
- ARIA live regions will announce navigation and actions.
- All shortcut actions are available via keyboard and do not require a mouse.


### Limitations and Future Work

- Some advanced visualizations may have brief alt text if BrailleR is not available.
- Focus management for complex modals/popups may require further refinement.
- Keyboard shortcuts may require additional user testing for edge cases.
- Formal third-party accessibility audit is recommended for full WCAG/ADA compliance.

**For questions, feedback, or suggestions regarding accessibility, please contact:**  
Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)


- Some advanced visualizations may have brief alt text if BrailleR is not available.
- Focus management for complex modals/popups may require further refinement.
- Keyboard shortcuts may require additional user testing for edge cases.
- Formal third-party accessibility audit is recommended for full WCAG/ADA compliance.
- Some advanced statistical methods may be added in future releases.
- Accessibility testing is ongoing; feedback is welcome.
- Additional classroom activities and simulation types are planned.

While we have made every effort to ensure accessibility, we acknowledge the following limitations:

1.  **No Formal Audit**: This application has not undergone a formal accessibility audit by a third-party expert. True compliance with standards like Title II of the ADA is a legal determination that can only be affirmed through such an audit.
2.  **No Widespread Human Testing**: The applets have not yet been tested by a wide range of users with different disabilities and assistive technologies. User feedback is critical to identifying and fixing usability issues that automated tools cannot detect.
3.  **Color Contrast**: The color palette and theme have been updated to maximize foreground-background contrast and use colorblind-friendly palettes (including the viridis palette for all plots). All navigation and interactive elements have been reviewed for sufficient contrast and accessibility.

We are committed to improving the accessibility of this project. If you encounter any accessibility barriers, please [open an issue](https://github.com/your_username/StappletSHiny/issues) on GitHub.

---

## Recent Changes

- All R module files now include detailed, self-documenting comments and section headers.
- The help file (`help.md`) provides comprehensive instructions for every module.
- Accessibility features have been expanded and standardized.
- Export/download options are available in every module.
- Codebase refactored for clarity, maintainability, and production readiness.

- **Accessibility Improvements**: All UI elements and tables have been refactored for better screen reader support and keyboard navigation. Unicode mathematical symbols are now rendered as actual characters.
- **Colorblind-Friendly Theme**: The app uses a high-contrast, colorblind-safe theme for all UI elements and navigation. All plots use the viridis color palette for maximum accessibility.
- **Navigation Bar Fixes**: Navigation buttons and links now have visible, high-contrast backgrounds and text.
- **Unicode Rendering**: All Unicode escapes (e.g., `\u03bc`) have been replaced with the actual Unicode characters (e.g., `μ`) throughout the UI and outputs.
- **Quick Entry Scripts**: Added `launch_Scripts` directory with scripts for Bash, Zsh, PowerShell, and Windows CMD to quickly launch the app from the command line.
- **Table Accessibility**: Large tables on the welcome page have been split into separate tables under clear headings for better screen reader navigation.
- **General Bug Fixes**: Various UI and accessibility bugs have been fixed, including missing commas, ARIA attribute handling, and button layout improvements.

---

## Contributing

Contributions are welcome! Please review the code style and documentation standards before submitting pull requests. All new code should include clear comments and section headers.


Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

### How to Contribute

- Fork the repository and create a new branch.
- Add or improve modules, documentation, or accessibility features.
- Ensure all code is commented and production-ready.
- Submit a pull request with a clear description of changes.

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

### Reporting Bugs

- Open an issue in the repository with a detailed description.
- Include steps to reproduce, screenshots, and relevant error messages.
- Accessibility and usability feedback is especially appreciated.

If you find a bug, please [open an issue](https://github.com/your_username/StappletSHiny/issues) and provide a clear description of the issue, steps to reproduce it, and any relevant error messages.

---

## License

Stapplet Shiny Suite is licensed under the Apache License, Version 2.0.  
See individual files for copyright and licensing details.

---

**Author:** Michael Ryan Hunsaker, M.Ed., Ph.D. (<hunsakerconsulting@gmail.com>)  
**Help & Documentation:** See [help.md](help.md) for module instructions and accessibility details.

**Enjoy exploring statistics with Stapplet!**

Distributed under the Apache 2.0 License. See `LICENSE` text below for more information.

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with the Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
