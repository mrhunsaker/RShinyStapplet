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
source("regression_slr.R")
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
      .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
    "))
  ),

  # Welcome Tab
  tabPanel("Welcome",
    fluidPage(
      h2("Welcome to the Stapplet Shiny Suite"),
      p("This collection of Shiny applications is inspired by the applets available on Stapplet.com. The goal is to provide accessible, R-based tools for learning and teaching introductory statistics.", style = "font-size: 16px; text-align: center;"),
      hr(),
      h3("How to Use"),
      p("Use the navigation bar at the top of the page to select a statistical topic. Each link in the navigation bar leads to an interactive applet designed to illustrate a specific concept."),
      p("The applets are organized into the following categories:"),
      tags$ul(
        tags$li(strong("Sampling Distributions:"), "Explore the Central Limit Theorem for means and proportions."),
        tags$li(strong("Confidence Intervals:"), "Construct and interpret confidence intervals."),
        tags$li(strong("Hypothesis Tests:"), "Perform significance tests for various parameters."),
        tags$li(strong("Probability Distributions:"), "Visualize and calculate probabilities for common statistical distributions."),
        tags$li(strong("Regression:"), "Analyze relationships between two quantitative variables."),
        tags$li(strong("ANOVA:"), "Compare means across multiple groups."),
        tags$li(strong("Tools:"), "Use helper utilities for descriptive statistics and probability simulations.")
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
    tabPanel("Chi-Square Distribution", dist_chi_square_ui("dist_chi")),
    tabPanel("F-Distribution", dist_f_ui("dist_f")),
    tabPanel("Binomial Distribution", dist_binomial_ui("dist_binomial"))
  ),

  # V. Regression
  navbarMenu("Regression",
    tabPanel("Simple Linear Regression", regression_slr_ui("reg_simple"))
  ),

  # VI. ANOVA
  tabPanel("ANOVA", anova_one_way_ui("anova_one_way")),

  # VII. Tools
  navbarMenu("Tools",
    tabPanel("Descriptive Statistics", tools_descriptive_ui("tool_desc_stats")),
    tabPanel("Simulations", tools_simulations_ui("tool_sims"))
  ),
  footer = div(
    style = "display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; position: fixed; bottom: 0; width: 100%; left: 0; z-index: 100;",
    p("Copyright (c) 2025 Michael Ryan Hunsaker, M.Ed., PH.D.", style = "margin: 0; color: #64748b; font-size: 12px;"),
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

  # V. Regression
  regression_slr_server("reg_simple")

  # VI. ANOVA
  anova_one_way_server("anova_one_way")

  # VII. Tools
  tools_descriptive_server("tool_desc_stats")
  tools_simulations_server("tool_sims")
}

# Run the application
shinyApp(ui = ui, server = server)
