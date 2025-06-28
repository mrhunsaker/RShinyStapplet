# app.R
# Main application file for the Stapplet.com-inspired Shiny suite.
# This file acts as the router, using a navbarPage to direct users to the different applets.

library(shiny)
library(ggplot2)

# Source all the applet module files
source("sampling_distribution_mean.R")
source("sampling_distribution_proportion.R")
source("ci_mean.R")
source("ci_diff_means.R")
source("ci_proportion.R")
source("ci_diff_proportions.R")
source("ht_mean.R")
source("ht_diff_means.R")
source("ht_proportion.R")
source("ht_diff_proportions.R")
source("ht_chi_gof.R")
source("ht_chi_ind.R")
source("dist_normal.R")
source("dist_t.R")
source("dist_chi_square.R")
source("dist_f.R")
source("dist_binomial.R")
source("dist_discrete_random.R")
source("dist_poisson.R")
source("dist_counting_methods.R")
source("dist_power.R")
source("activity_guess_correlation.R")
source("activity_hiring_discrimination.R")
source("activity_smell_parkinsons.R")
source("activity_mrs_gallas.R")
source("activity_candy_chi_square.R")
source("activity_sampling_sunflowers.R")
source("regression_slr.R")
source("regression_mlr.R")
source("anova_one_way.R")
source("tools_descriptive.R")
source("tools_simulations.R")

# Define the overall UI using a navigation bar layout
ui <- navbarPage(
  title = "Stapplet Shiny Suite",
  windowTitle = "Stapplet Shiny Suite",
  collapsible = TRUE, # Makes the navbar responsive on smaller screens

  # Add a header with custom CSS for consistent styling across all applets
  header = tags$head(
    # Load Inter font from Google Fonts
    tags$link(href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap", rel="stylesheet"),
    # Custom CSS for styling
    tags$style(HTML("
      /* General Body and Font Styling */
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc; /* Tailwind gray-50 */
      }

      /* Navbar Styling */
      .navbar {
        background-color: #ffffff;
        border-bottom: 1px solid #e2e8f0; /* Tailwind slate-200 */
        box-shadow: 0 2px 4px -1px rgba(0,0,0,0.06);
      }
      .navbar-default .navbar-brand {
        color: #0f172a; /* Tailwind slate-900 */
        font-weight: 600;
        font-size: 20px;
      }
      .navbar-default .navbar-nav > li > a {
        color: #334155; /* Tailwind slate-700 */
        font-weight: 500;
      }
      .navbar-default .navbar-nav > .active > a,
      .navbar-default .navbar-nav > .active > a:hover,
      .navbar-default .navbar-nav > .active > a:focus {
        color: #1d4ed8; /* Tailwind blue-700 */
        background-color: #eef2ff; /* Tailwind indigo-100 */
      }
      .navbar-default .navbar-nav > li > a:hover,
      .navbar-default .navbar-nav > li > a:focus {
        color: #1d4ed8;
        background-color: #f8fafc;
      }

      /* Main Content Container Styling */
      .container-fluid {
        max-width: 900px;
        margin: auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 12px; /* Rounded corners */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Tailwind shadow-md */
        margin-top: 30px;
      }

      /* Re-using styles from the ui.R template */
      .well {
        background-color: #e2e8f0; border: none; border-radius: 8px; padding: 15px; margin-bottom: 20px;
      }
      .form-group label {
        font-weight: 600; margin-bottom: 8px; color: #334155;
      }
      .form-control {
        border-radius: 6px; border: 1px solid #cbd5e1; padding: 8px 12px; width: 100%;
      }
      h2 {
        color: #0f172a; font-weight: 600; margin-bottom: 20px; text-align: center;
      }
      h3 {
        color: #0f172a; font-weight: 600; margin-bottom: 15px;
      }
      .plot-container {
        margin-top: 30px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background-color: #f0f4f8;
      }
      .results-box {
        background-color: #e0f2f2; border: 1px solid #2dd4bf; border-radius: 8px; padding: 15px; margin-top: 20px; color: #0f766e; font-weight: 500;
      }
      /* High-contrast, colorblind-friendly theme */
      body {
        background-color: #ffffff;
        color: #111111;
        font-family: 'Inter', Arial, sans-serif;
        font-size: 16px;
      }
      .navbar, .navbar-default {
        background-color: #222222 !important;
        border-bottom: 2px solid #000;
      }
      .navbar-default .navbar-brand,
      .navbar-default .navbar-nav > li > a {
        color: #222222 !important;
        background-color: #e5e7eb !important; /* Tailwind gray-200 */
        font-weight: 700;
      }
      .navbar-default .navbar-nav > li > a:hover,
      .navbar-default .navbar-nav > li > a:focus {
        color: #111 !important;
        background-color: #d1d5db !important; /* Tailwind gray-300 */
      }
      .navbar-default .navbar-nav > .active > a,
      .navbar-default .navbar-nav > .active > a:hover,
      .navbar-default .navbar-nav > .active > a:focus {
        color: #222222 !important;
        background-color: #ffd700 !important; /* Gold for high contrast */
      }
      .container-fluid, .well, .panel, .table {
        background-color: #fff !important;
        color: #111 !important;
        border-radius: 8px;
        border: 1.5px solid #222;
      }
      .btn, .btn-primary, .btn-danger {
        color: #fff !important;
        background-color: #0072B2 !important; /* Blue, colorblind safe */
        border: none;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .btn-danger {
        background-color: #D55E00 !important; /* Orange, colorblind safe */
      }
      .btn:focus, .btn-primary:focus, .btn-danger:focus {
        outline: 3px solid #FFD700 !important; /* Gold focus ring */
        outline-offset: 2px;
      }
      /* Table header contrast */
      .table th {
        background-color: #222 !important;
        color: #fff !important;
      }
      .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
      /* Consistent width for first column of all .table tables on welcome page */
      .table th:first-child, .table td:first-child {
        width: 260px;
        min-width: 200px;
        max-width: 350px;
        white-space: normal;
        word-break: break-word;
      }
    "))
  ),

  # Welcome Tab
  tabPanel("Welcome",
    fluidPage(
      h2("Welcome to the Stapplet Shiny Suite"),
      p("This collection of Shiny applications is inspired by the applets available on Stapplet.com. The goal is to provide accessible, R-based tools for learning and teaching introductory statistics.", style = "font-size: 16px; text-align: center;"),
      hr(),
      h3("Applet Mapping"),
      p("Here is a guide to which stapplet.com pages correspond to the applets in this suite:"),

      h4("Data Analysis"),
      tags$table(class = "table table-bordered",
        tags$thead(
          tags$tr(
            tags$th("Stapplet.com Page"),
            tags$th("Shiny Applet Location")
          )
        ),
        tags$tbody(
          tags$tr(tags$td("1 Categorical Variable, Single Group"), tags$td("Hypothesis Tests -> Test for a Proportion")),
          tags$tr(tags$td("1 Categorical Variable, Multiple Groups"), tags$td("Hypothesis Tests -> Test for a Difference in Proportions")),
          tags$tr(tags$td("2 Categorical Variables"), tags$td("Hypothesis Tests -> Chi-Square for Independence")),
          tags$tr(tags$td("1 Quantitative Variable, Single Group"), tags$td("Hypothesis Tests -> Test for a Mean")),
          tags$tr(tags$td("1 Quantitative Variable, Multiple Groups"), tags$td("Hypothesis Tests -> Test for a Difference in Means")),
          tags$tr(tags$td("2 Quantitative Variables"), tags$td("Regression -> Simple Linear Regression")),
          tags$tr(tags$td("Multiple Regression"), tags$td("Regression -> Multiple Regression"))
        )
      ),

      h4("Probability"),
      tags$table(class = "table table-bordered",
        tags$thead(
          tags$tr(
            tags$th("Stapplet.com Page"),
            tags$th("Shiny Applet Location")
          )
        ),
        tags$tbody(
          tags$tr(tags$td("Normal Distributions"), tags$td("Probability Distributions -> Normal Distribution")),
          tags$tr(tags$td("Discrete Random Variables"), tags$td("Probability Distributions -> Discrete Random Variables")),
          tags$tr(tags$td("Binomial Distributions"), tags$td("Probability Distributions -> Binomial Distribution")),
          tags$tr(tags$td("Poisson Distributions"), tags$td("Probability Distributions -> Poisson Distribution")),
          tags$tr(tags$td("Counting Methods"), tags$td("Tools -> Counting Methods")),
          tags$tr(tags$td("t Distributions"), tags$td("Probability Distributions -> t-Distribution")),
          tags$tr(tags$td("χ2 Distributions"), tags$td("Probability Distributions -> Chi-Square Distribution")),
          tags$tr(tags$td("F Distributions"), tags$td("Probability Distributions -> F-Distribution"))
        )
      ),

      h4("Concepts"),
      tags$table(class = "table table-bordered",
        tags$thead(
          tags$tr(
            tags$th("Stapplet.com Page"),
            tags$th("Shiny Applet Location")
          )
        ),
        tags$tbody(
          tags$tr(tags$td("The Idea of Probability"), tags$td("Tools -> Simulations")),
          tags$tr(tags$td("Law of Large Numbers"), tags$td("Tools -> Simulations")),
          tags$tr(tags$td("Simulating Sampling Distributions"), tags$td("Sampling Distributions")),
          tags$tr(tags$td("Simulating Confidence Intervals"), tags$td("Confidence Intervals -> CI for a Mean")),
          tags$tr(tags$td("Logic of Significance Testing"), tags$td("Hypothesis Tests -> Test for a Mean")),
          tags$tr(tags$td("Power"), tags$td("Concepts -> Power")),
          tags$tr(tags$td("Streakiness"), tags$td("Tools -> Simulations"))
        )
      ),

      h4("Activities"),
      tags$table(class = "table table-bordered",
        tags$thead(
          tags$tr(
            tags$th("Stapplet.com Page"),
            tags$th("Shiny Applet Location")
          )
        ),
        tags$tbody(
          tags$tr(tags$td("Can You Smell Parkinson's?"), tags$td("Activities -> Can You Smell Parkinson's?")),
          tags$tr(tags$td("Hiring Discrimination"), tags$td("Activities -> Hiring Discrimination")),
          tags$tr(tags$td("Guess the Correlation"), tags$td("Activities -> Guess the Correlation")),
          tags$tr(tags$td("Does Beyoncé Write Her Own Lyrics?"), tags$td("Hypothesis Tests -> Test for a Proportion")),
          tags$tr(tags$td("How Much Do Fans Like Taylor Swift? Part 1"), tags$td("Hypothesis Tests -> Test for a Mean")),
          tags$tr(tags$td("How Much Do Fans Like Taylor Swift? Part 2"), tags$td("ANOVA")),
          tags$tr(tags$td("Sampling Sunflowers"), tags$td("Sampling Distributions")),
          tags$tr(tags$td("Is Mrs. Gallas a Good Free Throw Shooter?"), tags$td("Hypothesis Tests -> Test for a Proportion")),
          tags$tr(tags$td("M&M's/Skittles/Froot Loops"), tags$td("Hypothesis Tests -> Chi-Square Goodness-of-Fit")),
          tags$tr(tags$td("Old Faithful"), tags$td("Tools -> Descriptive Statistics"))
        )
      )
    )
  ),

  # I. Sampling Distributions
  navbarMenu("Sampling Distributions",
    tabPanel("Distribution of Sample Means", sampling_dist_mean_ui("samp_dist_mean")),
    tabPanel("Distribution of Sample Proportions", sampling_dist_proportion_ui("samp_dist_prop"))
  ),

  # II. Confidence Intervals
  navbarMenu("Confidence Intervals",
    tabPanel("CI for a Mean", ci_mean_ui("ci_mean")),
    tabPanel("CI for a Difference in Means", ci_diff_means_ui("ci_diff_means")),
    tabPanel("CI for a Proportion", ci_proportion_ui("ci_prop")),
    tabPanel("CI for a Difference in Proportions", ci_diff_proportions_ui("ci_diff_props"))
  ),

  # III. Hypothesis Tests
  navbarMenu("Hypothesis Tests",
    tabPanel("Test for a Mean", ht_mean_ui("test_mean")),
    tabPanel("Test for a Difference in Means", ht_diff_means_ui("test_diff_means")),
    tabPanel("Test for a Proportion", ht_proportion_ui("test_prop")),
    tabPanel("Test for a Difference in Proportions", ht_diff_proportions_ui("test_diff_props")),
    tabPanel("Chi-Square Goodness-of-Fit", ht_chi_gof_ui("test_chi_gof")),
    tabPanel("Chi-Square for Independence", ht_chi_ind_ui("test_chi_ind"))
  ),

  # IV. Probability Distributions
  navbarMenu("Probability Distributions",
    tabPanel("Normal Distribution", dist_normal_ui("dist_normal")),
    tabPanel("t-Distribution", dist_t_ui("dist_t")),
    tabPanel("Chi-Square Distribution", dist_chi_square_ui("dist_chi_square")),
    tabPanel("F-Distribution", dist_f_ui("dist_f")),
    tabPanel("Binomial Distribution", dist_binomial_ui("dist_binomial")),
    tabPanel("Discrete Random Variables", dist_discrete_random_ui("dist_discrete_random")),
    tabPanel("Poisson Distribution", dist_poisson_ui("dist_poisson"))
  ),

  # V. Regression
  navbarMenu("Regression",
    tabPanel("Simple Linear Regression", regression_slr_ui("reg_simple")),
    tabPanel("Multiple Regression", regression_mlr_ui("reg_mlr"))
  ),

  # VI. ANOVA
  tabPanel("ANOVA", anova_one_way_ui("anova_one_way")),

  # VII. Tools
  navbarMenu("Tools",
    tabPanel("Descriptive Statistics", tools_descriptive_ui("tool_desc_stats")),
    tabPanel("Simulations", tools_simulations_ui("tool_sims")),
    tabPanel("Counting Methods", dist_counting_methods_ui("dist_counting_methods"))
  ),

  # Concepts Menu
  navbarMenu("Concepts",
    tabPanel("Power of a Test", dist_power_ui("dist_power"))
  ),

  # Activities Menu
  navbarMenu("Activities",
    tabPanel("About Activities",
      fluidPage(
        h3("About Activities"),
        p("The activities listed on stapplet.com are excellent, specific case studies. This Shiny suite provides the general tools that can be used to analyze the data from those activities, but does not replicate the activities themselves."),
        p("For example, to complete the 'Hiring Discrimination' activity, you could use the tools under 'Data Analysis -> 1 Categorical Variable, Multiple Groups'.")
      )
    ),
    tabPanel("Guess the Correlation", activity_guess_correlation_ui("activity_guess_correlation")),
    tabPanel("Hiring Discrimination", activity_hiring_discrimination_ui("activity_hiring_discrimination")),
    tabPanel("Can You Smell Parkinson's?", activity_smell_parkinsons_ui("activity_smell_parkinsons")),
    tabPanel("Is Mrs. Gallas a Good Free Throw Shooter?", activity_mrs_gallas_ui("activity_mrs_gallas")),
    tabPanel("M&M's/Skittles/Froot Loops", activity_candy_chi_square_ui("activity_candy_chi_square")),
    tabPanel("Sampling Sunflowers", activity_sampling_sunflowers_ui("activity_sampling_sunflowers")),
    tabPanel("Case Studies Guide",
      fluidPage(
        h2("Case Studies Application Guide"),
        p("The following activities are case studies that can be solved using the general-purpose statistical tools included in this suite. This guide explains which tool to use for each case study."),
        hr(),

        h3("Does Beyoncé Write Her Own Lyrics?"),
        p(strong("Concept:"), " One-Proportion Hypothesis Test."),
        p(strong("Tool to Use:"), " Navigate to ", strong("Activities -> Is Mrs. Gallas a Good Free Throw Shooter?")),
        p(strong("How to Use:"), "This scenario is a direct applicaztion of testing a single proportion. In the 'Mrs. Gallas' applet, you would set the 'Claimed Success Rate' to the proportion of words you'd expect by chance, the 'Number of Trials' to the total number of words analyzed, and the 'Observed Number of Successes' to the count of words like 'uh' or 'oh' in the lyrics."),
        hr(),

        h3("How Much Do Fans Like Taylor Swift? Part 1"),
        p(strong("Concept:"), " One-Sample t-Test for a Mean."),
        p(strong("Tool to Use:"), " Navigate to ", strong("Hypothesis Tests -> Test for a Mean.")),
        p(strong("How to Use:"), "This scenario requires testing if the average positivity score of a sample of lyrics is significantly different from a known value. Enter the sample data (mean, standard deviation, and sample size) into the 'Test for a Mean' applet to find the t-statistic and p-value."),
        hr(),

        h3("How Much Do Fans Like Taylor Swift? Part 2"),
        p(strong("Concept:"), " Analysis of Variance (ANOVA)."),
        p(strong("Tool to Use:"), " Navigate to ", strong("ANOVA.")),
        p(strong("How to Use:"), "This scenario involves comparing the mean positivity scores across several groups (albums). Enter the summary data (means, standard deviations, and sample sizes) for each album into the ANOVA applet to determine if there is a significant difference in fan sentiment across the albums."),
        hr(),

        h3("Old Faithful"),
        p(strong("Concept:"), " Descriptive Statistics for a Quantitative Variable."),
        p(strong("Tool to Use:"), " Navigate to ", strong("Tools -> Descriptive Statistics.")),
        p(strong("How to Use:"), "This scenario involves analyzing a dataset of eruption times. You can paste the column of eruption data into the 'Descriptive Statistics' tool to generate a histogram, boxplot, and summary statistics (like mean, median, and standard deviation) to understand the distribution.")
      )
    ),
    tabPanel("Screenreader-Friendly Activities Guide",
      fluidPage(
        h3("Stapplet.com Activities Guide"),
        p("This guide provides suggestions for which applets to use for the activities on stapplet.com, with accessibility in mind."),
        tags$ul(
          tags$li(strong("Can You Smell Parkinson's?:"), "Use 'Data Analysis -> 1 Categorical Variable, Single Group' to analyze the proportion of correct identifications."),
          tags$li(strong("Hiring Discrimination:"), "Use 'Data Analysis -> 1 Categorical Variable, Multiple Groups' to compare hiring rates between groups."),
          tags$li(strong("Guess the Correlation:"), "Use 'Data Analysis -> 2 Quantitative Variables' to explore the relationship between two quantitative variables and see the correlation coefficient."),
          tags$li(strong("Does Beyoncé Write Her Own Lyrics?:"), "Use 'Data Analysis -> 1 Categorical Variable, Single Group' to test hypotheses about the proportion of words like 'uh' or 'oh'."),
          tags$li(strong("How Much Do Fans Like Taylor Swift? Part 1:"), "Use 'Data Analysis -> 1 Quantitative Variable, Single Group' to analyze the mean positivity score of song lyrics."),
          tags$li(strong("How Much Do Fans Like Taylor Swift? Part 2:"), "Use 'Data Analysis -> 1 Quantitative Variable, Multiple Groups' to compare mean positivity scores across different albums."),
          tags$li(strong("Sampling Sunflowers:"), "Use 'Concepts -> Simulating Sampling Distributions -> Mean' to explore how sample means of sunflower heights behave."),
          tags$li(strong("Is Mrs. Gallas a Good Free Throw Shooter?:"), "Use 'Data Analysis -> 1 Categorical Variable, Single Group' to analyze her free throw success rate."),
          tags$li(strong("M&M's/Skittles/Froot Loops:"), "Use 'Data Analysis -> 1 Categorical Variable, Multiple Groups -> Chi-Square Goodness-of-Fit Test' to see if the color distribution matches a claimed distribution."),
          tags$li(strong("Old Faithful:"), "Use 'Data Analysis -> 1 Quantitative Variable, Single Group' to analyze the distribution of eruption times or waiting times.")
        )
      )
    )
  ),
  footer = div(
    style = "display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; position: fixed; bottom: 0; width: 100%; left: 0; z-index: 100;",
    p("Copyright (c) 2025 Michael Ryan Hunsaker, M.Ed., Ph.D.", style = "margin: 0; color: #64748b; font-size: 12px;"),
    a(href = "https://github.com/mrhunsaker/RShinyStapplet", target = "_blank",
      tags$img(src = "https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/mark-github.svg", height = "20px", alt = "GitHub Repository", style="vertical-align: middle;")
    )
  )
)

# Define the server logic
# Define the server logic by calling the server module for each applet
server <- function(input, output, session) {
  # I. Sampling Distributions
  sampling_dist_mean_server("samp_dist_mean")
  sampling_dist_proportion_server("samp_dist_prop")

  # II. Confidence Intervals
  ci_mean_server("ci_mean")
  ci_diff_means_server("ci_diff_means")
  ci_proportion_server("ci_prop")
  ci_diff_proportions_server("ci_diff_props")

  # III. Hypothesis Tests
  ht_mean_server("test_mean")
  ht_diff_means_server("test_diff_means")
  ht_proportion_server("test_prop")
  ht_diff_proportions_server("test_diff_props")
  ht_chi_gof_server("test_chi_gof")
  ht_chi_ind_server("test_chi_ind")

  # IV. Probability Distributions
  dist_normal_server("dist_normal")
  dist_t_server("dist_t")
  dist_chi_square_server("dist_chi_square")
  dist_f_server("dist_f")
  dist_binomial_server("dist_binomial")
  dist_discrete_random_server("dist_discrete_random")
  dist_poisson_server("dist_poisson")

  # V. Regression
  regression_slr_server("reg_simple")
  regression_mlr_server("reg_mlr")

  # VI. ANOVA
  anova_one_way_server("anova_one_way")

  # VII. Tools
  tools_descriptive_server("tool_desc_stats")
  tools_simulations_server("tool_sims")
  dist_counting_methods_server("dist_counting_methods")
  dist_power_server("dist_power")

  # Activities
  activity_guess_correlation_server("activity_guess_correlation")
  activity_hiring_discrimination_server("activity_hiring_discrimination")
  activity_smell_parkinsons_server("activity_smell_parkinsons")
}

# Run the application
shinyApp(ui = ui, server = server)
