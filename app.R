library(shiny)
library(ggplot2)
library(markdown)

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

footer_div <- div(
  class = "footer",
  div(style = "flex: 1;"),
  div(
    style = "flex: 1; text-align: center;",
    p("Copyright (c) 2025 Michael Ryan Hunsaker, M.Ed., Ph.D.", style = "margin: 0; color: #64748b; font-size: 12px;")
  ),
  div(
    style = "flex: 1; text-align: right;",
    a(
      href = "https://github.com/mrhunsaker/RShinyStapplet", target = "_blank",
      tags$img(src = "https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/mark-github.svg", height = "20px", alt = "GitHub Repository", style = "vertical-align: middle;")
    )
  )
)

welcome_ui <- function() {
  fluidPage(
    h2("Welcome to the R Shiny Rewrite of the Stapplet Statistics Suite"),
    p("This collection of Shiny applications is inspired by the applets available on Stapplet.com. The goal is to provide accessible, R-based tools for learning and teaching introductory statistics.", style = "font-size: 16px; text-align: center;"),
    hr(),
    h3("Applet Mapping"),
    p("Here is a guide to which stapplet.com pages correspond to the applets in this suite:"),
    h4("Data Analysis"),
    tags$table(
      class = "table table-bordered",
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
    tags$table(
      class = "table table-bordered",
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
        tags$tr(tags$td("\u03c72 Distributions"), tags$td("Probability Distributions -> Chi-Square Distribution")),
        tags$tr(tags$td("F Distributions"), tags$td("Probability Distributions -> F-Distribution"))
      )
    ),
    h4("Concepts"),
    tags$table(
      class = "table table-bordered",
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
    tags$table(
      class = "table table-bordered",
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
}

ui <- tagList(
  tags$head(
    tags$link(href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap", rel = "stylesheet"),
    tags$style(HTML("
      body {
        margin: 0;
        padding: 0 0 60px 0; /* bottom padding for footer */
        overflow-x: hidden;
        font-family: 'Inter', sans-serif;
      }
      .footer {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        z-index: 100;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        padding: 10px 20px;
      }
      .app-title {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #1f2937;
        color: white;
        padding: 16px 24px;
        font-size: 24px;
        font-weight: 600;
        z-index: 1001;
      }
      .sidebar-fixed {
        position: fixed;
        top: 70px;
        left: 0;
        height: calc(100vh - 70px);
        width: 250px;
        background-color: #f1f5f9;
        border-right: 2px solid #e2e8f0;
        overflow-y: auto;
        padding: 1rem;
        z-index: 1000;
      }
      .sidebar-fixed a, .sidebar-fixed button {
        display: block;
        padding: 10px;
        margin-bottom: 5px;
        font-weight: 600;
        color: #1e293b;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
      }
      .sidebar-fixed a:hover, .sidebar-fixed button:hover,
      .sidebar-fixed a:focus, .sidebar-fixed button:focus {
        background-color: #e2e8f0;
        color: #1d4ed8;
        outline: 3px solid #FFD700;
      }
      .main-content {
        margin-left: 250px;
        margin-top: 100px;
        padding: 20px;
        width: calc(100% - 250px);
      }
      /* Ensure focus visible for keyboard users */
      :focus {
        outline-offset: 2px;
      }
      table.table-bordered {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      table.table-bordered th, table.table-bordered td {
        border: 1px solid #dee2e6;
        padding: 0.75rem;
        vertical-align: top;
        text-align: left;
      }
    "))
  ),
  div(class = "app-title", "📊 Stapplet Shiny Suite"),
  div(
    class = "sidebar-fixed",
    tags$nav(
      role = "navigation",
      `aria-label` = "Sidebar navigation",
      tabindex = "0",
      h3("Menu", tabindex = "0"),
      tags$ul(
        style = "list-style-type: none; padding-left: 0;",
        tags$li(actionButton("go_welcome", "Welcome")),
        tags$li(actionButton("go_samp_means", "Distribution of Sample Means")),
        tags$li(actionButton("go_samp_proportions", "Distribution of Sample Proportions")),
        tags$li(actionButton("go_ci_mean", "Confidence Interval for Mean")),
        tags$li(actionButton("go_ci_diff_means", "Confidence Interval for Difference in Means")),
        tags$li(actionButton("go_ci_proportion", "Confidence Interval for Proportion")),
        tags$li(actionButton("go_ci_diff_props", "Confidence Interval for Difference in Proportions")),
        tags$li(actionButton("go_test_mean", "Test for Mean")),
        tags$li(actionButton("go_test_diff_means", "Test for Difference in Means")),
        tags$li(actionButton("go_test_proportion", "Test for Proportion")),
        tags$li(actionButton("go_test_diff_props", "Test for Difference in Proportions")),
        tags$li(actionButton("go_test_chi_gof", "Chi-Square Goodness-of-Fit")),
        tags$li(actionButton("go_test_chi_ind", "Chi-Square for Independence")),
        tags$li(actionButton("go_normal", "Normal Distribution")),
        tags$li(actionButton("go_t_dist", "t-Distribution")),
        tags$li(actionButton("go_chi_square", "Chi-Square Distribution")),
        tags$li(actionButton("go_f_dist", "F-Distribution")),
        tags$li(actionButton("go_binomial", "Binomial Distribution")),
        tags$li(actionButton("go_discrete_random", "Discrete Random Variables")),
        tags$li(actionButton("go_poisson", "Poisson Distribution")),
        tags$li(actionButton("go_counting_methods", "Counting Methods")),
        tags$li(actionButton("go_power", "Power of a Test")),
        tags$li(actionButton("go_reg_slr", "Simple Linear Regression")),
        tags$li(actionButton("go_reg_mlr", "Multiple Linear Regression")),
        tags$li(actionButton("go_anova", "ANOVA One-Way")),
        tags$li(actionButton("go_tools_descriptive", "Descriptive Statistics")),
        tags$li(actionButton("go_tools_simulations", "Simulations")),
        tags$li(actionButton("go_activity_guess_corr", "Activity: Guess the Correlation")),
        tags$li(actionButton("go_activity_hiring", "Activity: Hiring Discrimination")),
        tags$li(actionButton("go_activity_smell_parkinsons", "Activity: Can You Smell Parkinson's?")),
        tags$li(actionButton("go_activity_mrs_gallas", "Activity: Is Mrs. Gallas a Good Free Throw Shooter?")),
        tags$li(actionButton("go_activity_candy_chi_square", "Activity: M&M's/Skittles/Froot Loops")),
        tags$li(actionButton("go_activity_sampling_sunflowers", "Activity: Sampling Sunflowers")),
        tags$li(actionButton("go_help", "Help"))
      )
    )
  ),
  div(class = "main-content", uiOutput("main_ui_content")),
  footer_div
)

server <- function(input, output, session) {
  # --- ACTIVATE ALL MODULE SERVERS ---
  sampling_dist_mean_server("samp_dist_mean")
  sampling_dist_proportion_server("samp_dist_prop")
  ci_mean_server("ci_mean")
  ci_diff_means_server("ci_diff_means")
  ci_proportion_server("ci_prop")
  ci_diff_proportions_server("ci_diff_props")
  ht_mean_server("test_mean")
  ht_diff_means_server("test_diff_means")
  ht_proportion_server("test_prop")
  ht_diff_proportions_server("test_diff_props")
  ht_chi_gof_server("test_chi_gof")
  ht_chi_ind_server("test_chi_ind")
  dist_normal_server("dist_normal")
  dist_t_server("dist_t")
  dist_chi_square_server("dist_chi_square")
  dist_f_server("dist_f")
  dist_binomial_server("dist_binomial")
  dist_discrete_random_server("dist_discrete_random")
  dist_poisson_server("dist_poisson")
  dist_counting_methods_server("dist_counting_methods")
  dist_power_server("dist_power")
  activity_guess_correlation_server("activity_guess_correlation")
  activity_hiring_discrimination_server("activity_hiring_discrimination")
  activity_smell_parkinsons_server("activity_smell_parkinsons")
  activity_mrs_gallas_server("activity_mrs_gallas")
  activity_candy_chi_square_server("activity_candy_chi_square")
  activity_sampling_sunflowers_server("activity_sampling_sunflowers")
  regression_slr_server("reg_simple")
  regression_mlr_server("reg_mlr")
  anova_one_way_server("anova_one_way")
  tools_descriptive_server("tool_desc_stats")
  tools_simulations_server("tool_sims")
  # --- END MODULE SERVER CALLS ---

  output$main_ui_content <- renderUI({
    welcome_ui()
  })

  observeEvent(input$go_welcome, {
    output$main_ui_content <- renderUI({
      welcome_ui()
    })
  })
  observeEvent(input$go_samp_means, {
    output$main_ui_content <- renderUI({
      sampling_dist_mean_ui("samp_dist_mean")
    })
  })
  observeEvent(input$go_samp_proportions, {
    output$main_ui_content <- renderUI({
      sampling_dist_proportion_ui("samp_dist_prop")
    })
  })
  observeEvent(input$go_ci_mean, {
    output$main_ui_content <- renderUI({
      ci_mean_ui("ci_mean")
    })
  })
  observeEvent(input$go_ci_diff_means, {
    output$main_ui_content <- renderUI({
      ci_diff_means_ui("ci_diff_means")
    })
  })
  observeEvent(input$go_ci_proportion, {
    output$main_ui_content <- renderUI({
      ci_proportion_ui("ci_prop")
    })
  })
  observeEvent(input$go_ci_diff_props, {
    output$main_ui_content <- renderUI({
      ci_diff_proportions_ui("ci_diff_props")
    })
  })
  observeEvent(input$go_test_mean, {
    output$main_ui_content <- renderUI({
      ht_mean_ui("test_mean")
    })
  })
  observeEvent(input$go_test_diff_means, {
    output$main_ui_content <- renderUI({
      ht_diff_means_ui("test_diff_means")
    })
  })
  observeEvent(input$go_test_proportion, {
    output$main_ui_content <- renderUI({
      ht_proportion_ui("test_prop")
    })
  })
  observeEvent(input$go_test_diff_props, {
    output$main_ui_content <- renderUI({
      ht_diff_proportions_ui("test_diff_props")
    })
  })
  observeEvent(input$go_test_chi_gof, {
    output$main_ui_content <- renderUI({
      ht_chi_gof_ui("test_chi_gof")
    })
  })
  observeEvent(input$go_test_chi_ind, {
    output$main_ui_content <- renderUI({
      ht_chi_ind_ui("test_chi_ind")
    })
  })
  observeEvent(input$go_normal, {
    output$main_ui_content <- renderUI({
      dist_normal_ui("dist_normal")
    })
  })
  observeEvent(input$go_t_dist, {
    output$main_ui_content <- renderUI({
      dist_t_ui("dist_t")
    })
  })
  observeEvent(input$go_chi_square, {
    output$main_ui_content <- renderUI({
      dist_chi_square_ui("dist_chi_square")
    })
  })
  observeEvent(input$go_f_dist, {
    output$main_ui_content <- renderUI({
      dist_f_ui("dist_f")
    })
  })
  observeEvent(input$go_binomial, {
    output$main_ui_content <- renderUI({
      dist_binomial_ui("dist_binomial")
    })
  })
  observeEvent(input$go_discrete_random, {
    output$main_ui_content <- renderUI({
      dist_discrete_random_ui("dist_discrete_random")
    })
  })
  observeEvent(input$go_poisson, {
    output$main_ui_content <- renderUI({
      dist_poisson_ui("dist_poisson")
    })
  })
  observeEvent(input$go_counting_methods, {
    output$main_ui_content <- renderUI({
      dist_counting_methods_ui("dist_counting_methods")
    })
  })
  observeEvent(input$go_power, {
    output$main_ui_content <- renderUI({
      dist_power_ui("dist_power")
    })
  })
  observeEvent(input$go_reg_slr, {
    output$main_ui_content <- renderUI({
      regression_slr_ui("reg_simple")
    })
  })
  observeEvent(input$go_reg_mlr, {
    output$main_ui_content <- renderUI({
      regression_mlr_ui("reg_mlr")
    })
  })
  observeEvent(input$go_anova, {
    output$main_ui_content <- renderUI({
      anova_one_way_ui("anova_one_way")
    })
  })
  observeEvent(input$go_tools_descriptive, {
    output$main_ui_content <- renderUI({
      tools_descriptive_ui("tool_desc_stats")
    })
  })
  observeEvent(input$go_tools_simulations, {
    output$main_ui_content <- renderUI({
      tools_simulations_ui("tool_sims")
    })
  })
  observeEvent(input$go_activity_guess_corr, {
    output$main_ui_content <- renderUI({
      activity_guess_correlation_ui("activity_guess_correlation")
    })
  })
  observeEvent(input$go_activity_hiring, {
    output$main_ui_content <- renderUI({
      activity_hiring_discrimination_ui("activity_hiring_discrimination")
    })
  })
  observeEvent(input$go_activity_smell_parkinsons, {
    output$main_ui_content <- renderUI({
      activity_smell_parkinsons_ui("activity_smell_parkinsons")
    })
  })
  observeEvent(input$go_activity_mrs_gallas, {
    output$main_ui_content <- renderUI({
      activity_mrs_gallas_ui("activity_mrs_gallas")
    })
  })
  observeEvent(input$go_activity_candy_chi_square, {
    output$main_ui_content <- renderUI({
      activity_candy_chi_square_ui("activity_candy_chi_square")
    })
  })
  observeEvent(input$go_activity_sampling_sunflowers, {
    output$main_ui_content <- renderUI({
      activity_sampling_sunflowers_ui("activity_sampling_sunflowers")
    })
  })
  observeEvent(input$go_help, {
    output$main_ui_content <- renderUI({
      help_path <- "help.md"
      if (file.exists(help_path)) {
        help_text <- paste(readLines(help_path, warn = FALSE), collapse = "\\n")
        HTML(markdown::markdownToHTML(text = help_text, fragment.only = TRUE))
      } else {
        div("Help file not found.")
      }
    })
  })
}

shinyApp(ui, server)
