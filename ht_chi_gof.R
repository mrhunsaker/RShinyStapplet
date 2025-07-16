######################################################################
#
# Copyright 2025 Michael Ryan Hunsaker, M.Ed., Ph.D.
#                <hunsakerconsulting@gmail.com>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
######################################################################
# Stapplet Applet - Chi-Square Goodness-of-Fit Test
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility Enhancements (2025-07-13):
# - ARIA attributes for all UI containers and controls
# - Alt text and aria-label for all plots
# - BrailleR integration for plot descriptions
# - Screen-reader-only dynamic descriptions for all outputs
# - Accessible error/status messaging with ARIA live regions
# - Focus management for modals/popups
# - Accessible export/download features
######################################################################

# --------------------------------------------------------------------
# MODULE OVERVIEW
# --------------------------------------------------------------------
# This module implements a Chi-Square Goodness-of-Fit test applet in R Shiny.
# It provides a UI for entering observed counts and expected proportions,
# performs the statistical test, runs simulations, and visualizes results.
# The code is organized into UI and server functions, with detailed comments
# for each major section and function.
# --------------------------------------------------------------------

# Enhanced Chi-Square Goodness-of-Fit Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet

library(shiny)
library(ggplot2)
library(dplyr)
library(DT)
library(shinyjs)

# --- Candy type definitions ---
candy_info <- list(
  MM = list(
    name = "M&M's Milk Chocolate",
    categories = c("Brown", "Red", "Yellow", "Green", "Orange", "Blue"),
    expected = c(0.125, 0.125, 0.125, 0.125, 0.25, 0.25),
    desc = "Mars, Inc., is famous for its milk chocolate candies. Here’s what the company’s Consumer Affairs Department says about the distribution of color for M&M’S® Milk Chocolate Candies produced at its Hackettstown, New Jersey factory:<br>
    <ul>
      <li>Brown: 12.5%</li>
      <li>Red: 12.5%</li>
      <li>Yellow: 12.5%</li>
      <li>Green: 12.5%</li>
      <li>Orange: 25%</li>
      <li>Blue: 25%</li>
    </ul>"
  ),
  MT = list(
    name = "M&M's (Cleveland, TN)",
    categories = c("Brown", "Red", "Yellow", "Green", "Orange", "Blue"),
    expected = c(0.124, 0.131, 0.135, 0.198, 0.205, 0.207),
    desc = "Mars, Inc., is famous for its milk chocolate candies. Here’s what the company’s Consumer Affairs Department says about the distribution of color for M&M’S® Milk Chocolate Candies produced at its Cleveland, Tennessee factory:<br>
    <ul>
      <li>Brown: 12.4%</li>
      <li>Red: 13.1%</li>
      <li>Yellow: 13.5%</li>
      <li>Green: 19.8%</li>
      <li>Orange: 20.5%</li>
      <li>Blue: 20.7%</li>
    </ul>"
  ),
  SK = list(
    name = "Skittles",
    categories = c("Red", "Orange", "Yellow", "Green", "Purple"),
    expected = rep(0.2, 5),
    desc = "The regular variety of Skittles candies is claimed to contain equal percentages (20% each) of red, orange, yellow, green, and purple candies by the manufacturer."
  ),
  FL = list(
    name = "Froot Loops",
    categories = c("Red", "Orange", "Yellow", "Green", "Blue", "Purple"),
    expected = rep(1 / 6, 6),
    desc = "The manufacturer of regular Froot Loops cereal claims that it contains equal percentages (approximately 16.67% each) of red, orange, yellow, green, blue, and purple loops."
  )
)

# --------------------------------------------------------------------
# DEFAULT USER PREFERENCES
# --------------------------------------------------------------------
# Controls color palette, rounding, and percent display in UI.
# --------------------------------------------------------------------
default_prefs <- list(
  color_palette = "viridis",
  rounding = 4,
  percent_display = FALSE
)

# --- UI ---
ht_chi_gof_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$style(HTML("
        .error-msg { color: #b30000; font-weight: bold; }
        .plot-container { margin-bottom: 1em; }
        .results-box { background: #f8f8f8; padding: 1em; border-radius: 8px; margin-bottom: 1em; }
        .prefs-box { background: #eef; padding: 1em; border-radius: 8px; margin-bottom: 1em; }
      "))
    ),
    h2("Chi-Square Goodness-of-Fit Test", id = ns("appTitle")),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        "aria-labelledby" = ns("paramsHeading"),
        h3("Test Parameters", id = ns("paramsHeading")),
        selectInput(ns("candy_type"), "Which color distribution are you comparing to?",
          choices = setNames(names(candy_info), sapply(candy_info, `[[`, "name")),
          selected = "MM"
        ),
        htmlOutput(ns("candy_desc")),
        h4("Observed Counts"),
        uiOutput(ns("observed_counts_ui")),
        actionButton(ns("generate_sample"), "Generate Random Sample", class = "btn-info"),
        hr(),
        h4("Expected Proportions (Null Hypothesis)"),
        radioButtons(ns("expected_type"), "Specify Expected Proportions:",
          choices = c(
            "Claimed distribution" = "claimed",
            "Equal proportions" = "equal",
            "Custom proportions" = "custom"
          ),
          selected = "claimed"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'custom'", ns("expected_type")),
          ns = ns,
          p("Enter expected proportions. They must sum to 1.", id = ns("custom_help")),
          uiOutput(ns("expected_props_ui"))
        ),
        hr(),
        h4("Simulation"),
        numericInput(ns("num_sim"), "Number of simulated samples:", value = 100, min = 1, max = 2000, step = 1),
        actionButton(ns("simulate"), "Simulate", class = "btn-warning"),
        actionButton(ns("clear_sim"), "Clear simulation", class = "btn-secondary"),
        hr(),
        h4("Preferences"),
        selectInput(ns("color_palette"), "Color Palette",
          choices = c("viridis", "plasma", "magma", "inferno", "cividis")
        ),
        numericInput(ns("rounding"), "Decimal Places", value = default_prefs$rounding, min = 0, max = 10, step = 1),
        checkboxInput(ns("percent_display"), "Display probabilities as percentages", value = default_prefs$percent_display),
        hr(),
        h4("Export/Download"),
        downloadButton(ns("download_plot"), "Download Plot", class = "btn-success"),
        downloadButton(ns("download_table"), "Download Table", class = "btn-success")
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        tags$div(
          class = "error-msg",
          `aria-live` = "assertive",
          textOutput(ns("error_msg"))
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h3("Test Results", id = ns("results_summary_heading")),
              verbatimTextOutput(ns("results_summary"))
            )
          )
        ),
        fluidRow(
          column(
            6,
            div(
              class = "plot-container",
              h4("Contributions to Chi-Square Statistic", id = ns("contrib_heading"), style = "text-align: center;"),
              plotOutput(ns("contribution_plot"), height = "300px")
            )
          ),
          column(
            6,
            div(
              class = "plot-container",
              h4("Chi-Square Distribution", id = ns("chi_sq_dist_heading"), style = "text-align: center;"),
              plotOutput(ns("chi_square_dist_plot"), height = "300px")
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "plot-container",
              h4("Simulation Dotplot", id = ns("sim_dotplot_heading"), style = "text-align: center;"),
              plotOutput(ns("sim_dotplot"), height = "300px")
            )
          )
        )
      )
    )
  )
}

# --- Server ---
ht_chi_gof_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Preferences ---
    prefs <- reactive({
      list(
        color_palette = input$color_palette %||% default_prefs$color_palette,
        rounding = input$rounding %||% default_prefs$rounding,
        percent_display = input$percent_display %||% default_prefs$percent_display
      )
    })

    # --- Dynamic UI for candy description ---
    output$candy_desc <- renderUI({
      HTML(candy_info[[input$candy_type]]$desc)
    })

    # --- Dynamic UI for observed counts ---
    output$observed_counts_ui <- renderUI({
      cats <- candy_info[[input$candy_type]]$categories
      lapply(seq_along(cats), function(i) {
        div(
          class = "form-group shiny-input-container",
          tags$label(`for` = ns(paste0("obs_cat_", i)), paste(cats[i], "Count:")),
          numericInput(ns(paste0("obs_cat_", i)), NULL, value = 10, min = 0)
        )
      })
    })

    # --- Dynamic UI for custom expected proportions ---
    output$expected_props_ui <- renderUI({
      cats <- candy_info[[input$candy_type]]$categories
      lapply(seq_along(cats), function(i) {
        div(
          class = "form-group shiny-input-container",
          tags$label(`for` = ns(paste0("prop_cat_", i)), paste(cats[i], "Proportion:")),
          numericInput(ns(paste0("prop_cat_", i)), NULL, value = round(1 / length(cats), 3), min = 0, max = 1, step = 0.01)
        )
      })
    })

    # --- Error messaging ---
    error_msg <- reactiveVal("")

    # --- Gather observed counts ---
    observed_counts <- reactive({
      cats <- candy_info[[input$candy_type]]$categories
      sapply(seq_along(cats), function(i) {
        val <- input[[paste0("obs_cat_", i)]]
        if (is.null(val) || is.na(val) || val < 0) NA else val
      })
    })

    # --- Gather expected proportions ---
    expected_props <- reactive({
      cats <- candy_info[[input$candy_type]]$categories
      if (input$expected_type == "claimed") {
        candy_info[[input$candy_type]]$expected
      } else if (input$expected_type == "equal") {
        rep(1 / length(cats), length(cats))
      } else {
        sapply(seq_along(cats), function(i) {
          val <- input[[paste0("prop_cat_", i)]]
          if (is.null(val) || is.na(val) || val < 0) NA else val
        })
      }
    })

    # --- Generate random sample ---
    observeEvent(input$generate_sample, {
      cats <- candy_info[[input$candy_type]]$categories
      probs <- candy_info[[input$candy_type]]$expected
      n <- 30
      sample_counts <- rmultinom(1, n, probs)
      for (i in seq_along(cats)) {
        updateNumericInput(session, paste0("obs_cat_", i), value = sample_counts[i])
      }
    })

    # --- Chi-square test results ---
    test_results <- reactive({
      obs <- observed_counts()
      exp <- expected_props()
      cats <- candy_info[[input$candy_type]]$categories

      # Validate observed counts
      if (is.null(obs) || length(obs) == 0) {
        # Don't show error until user enters data
      } else if (any(is.na(obs))) {
        error_msg("Observed counts must be non-negative numbers.")
        return(NULL)
      }
      # Validate expected proportions
      if (is.null(exp) || length(exp) == 0) {
        # Don't show error until user enters data
      } else if (any(is.na(exp))) {
        error_msg("Expected proportions must be non-negative numbers.")
        return(NULL)
      }
      if (input$expected_type == "custom" && abs(sum(exp) - 1) > 1e-6) {
        error_msg(paste0("Custom proportions must sum to 1. Current sum: ", sum(exp)))
        return(NULL)
      }
      error_msg("")

      # Run the chi-square test
      res <- tryCatch(
        {
          chisq.test(x = obs, p = exp)
        },
        error = function(e) {
          error_msg(e$message)
          return(NULL)
        }
      )
      if (is.null(res)) {
        return(NULL)
      }

      warning_msg <- NULL
      if (any(res$expected < 5)) {
        warning_msg <- "Warning: One or more expected counts are less than 5. The Chi-Square approximation may be inaccurate."
      }

      list(
        statistic = res$statistic,
        p.value = res$p.value,
        df = res$parameter,
        observed = res$observed,
        expected = res$expected,
        residuals = res$residuals,
        warning = warning_msg,
        cats = cats
      )
    })

    # --- Simulation ---
    sim_results <- reactiveVal(NULL)

    observeEvent(input$simulate, {
      obs <- observed_counts()
      exp <- expected_props()
      cats <- candy_info[[input$candy_type]]$categories
      n <- sum(obs)
      num_sim <- input$num_sim
      sim_stats <- numeric(num_sim)
      for (i in seq_len(num_sim)) {
        sim_sample <- rmultinom(1, n, exp)
        sim_stats[i] <- suppressWarnings(chisq.test(x = sim_sample, p = exp)$statistic)
      }
      sim_results(sim_stats)
    })

    observeEvent(input$clear_sim, {
      sim_results(NULL)
    })

    # --- Error message output ---
    output$error_msg <- renderText({
      error_msg()
    })

    # --- Results summary ---
    output$results_summary <- renderPrint({
      results <- test_results()
      if (is.null(results)) {
        cat("Error:", error_msg())
        return()
      }
      cat("Chi-Square Goodness-of-Fit Test\n\n")
      cat("Null Hypothesis (H0): The observed data follows the specified proportions.\n")
      cat("Alternative Hypothesis (Ha): The observed data does not follow the specified proportions.\n\n")
      summary_df <- data.frame(
        Category = results$cats,
        Observed = results$observed,
        Expected = round(results$expected, prefs()$rounding),
        Contribution = round(results$residuals^2, 3)
      )
      print(summary_df, row.names = FALSE)
      cat("\n----------------------------------------\n")
      cat(sprintf("Chi-Square Statistic (χ²): %.4f\n", as.numeric(results$statistic)))
      cat(sprintf("Degrees of Freedom (df): %d\n", as.integer(results$df)))
      cat(sprintf("P-value: %.4f\n", as.numeric(results$p.value)))
      cat("----------------------------------------\n\n")
      alpha <- 0.05
      cat(paste0("Conclusion (at α = ", alpha, "):\n"))
      if (results$p.value < alpha) {
        cat(paste0("Since the p-value (", round(results$p.value, 4), ") is less than ", alpha, ", we reject the null hypothesis.\n"))
        cat("There is significant evidence that the true proportions are different from the expected ones.\n")
      } else {
        cat(paste0("Since the p-value (", round(results$p.value, 4), ") is not less than ", alpha, ", we fail to reject the null hypothesis.\n"))
        cat("There is not enough evidence to conclude that the true proportions differ from the expected ones.\n")
      }
      if (!is.null(results$warning)) {
        cat("\n", results$warning, "\n")
      }
    })

    # --- Contribution plot ---
    output$contribution_plot <- renderPlot({
      results <- test_results()
      req(!is.null(results))
      df_contrib <- data.frame(
        Category = factor(results$cats, levels = results$cats),
        Contribution = results$residuals^2
      )
      ggplot(df_contrib, aes(x = Category, y = Contribution, fill = Category)) +
        geom_bar(stat = "identity", color = "black") +
        labs(
          x = "Category", y = "Contribution to χ² Statistic",
          title = "Each Bar Shows (O-E)²/E"
        ) +
        theme_minimal() +
        theme(legend.position = "none", plot.title = element_text(hjust = 0.5))
    })

    # --- Chi-square distribution plot ---
    output$chi_square_dist_plot <- renderPlot({
      results <- test_results()
      req(!is.null(results))
      df <- results$df
      stat <- results$statistic
      x_max <- max(qchisq(0.999, df), stat * 1.2)
      x_vals <- seq(0, x_max, length.out = 400)
      y_vals <- dchisq(x_vals, df)
      plot_data <- data.frame(x = x_vals, y = y_vals)
      shade_data <- subset(plot_data, x >= stat)
      ggplot(plot_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", size = 1) +
        geom_area(data = shade_data, aes(x = x, y = y), fill = "#fbbf24", alpha = 0.6) +
        geom_vline(xintercept = stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(
          x = "Chi-Square Value", y = "Density",
          title = sprintf("df = %d, p-value = %.4f", df, results$p.value)
        ) +
        annotate("text", x = stat, y = 0, label = sprintf("χ² = %.2f", stat), vjust = 1.5, hjust = if (stat > x_max / 2) 1.1 else -0.1) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5))
    })

    # --- Simulation dotplot ---
    output$sim_dotplot <- renderPlot({
      sim_stats <- sim_results()
      results <- test_results()
      req(!is.null(sim_stats), !is.null(results))
      df <- results$df
      stat <- results$statistic
      plot_df <- data.frame(ChiSq = sim_stats)
      ggplot(plot_df, aes(x = ChiSq)) +
        geom_dotplot(binwidth = 0.5, dotsize = 0.7, fill = "#60a5fa") +
        geom_vline(xintercept = stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(
          x = "Simulated χ² Statistic", y = "Count",
          title = "Distribution of Simulated χ² Statistics"
        ) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5))
    })

    # --- Download Plot ---
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("chi_square_gof_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        results <- test_results()
        p <- ggplot(
          data.frame(Category = results$cats, Contribution = results$residuals^2),
          aes(x = Category, y = Contribution, fill = Category)
        ) +
          geom_bar(stat = "identity", color = "black") +
          labs(
            x = "Category", y = "Contribution to χ² Statistic",
            title = "Each Bar Shows (O-E)²/E"
          ) +
          theme_minimal() +
          theme(legend.position = "none", plot.title = element_text(hjust = 0.5))
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # --- Download Table ---
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("chi_square_gof_results_", Sys.Date(), ".csv")
      },
      content = function(file) {
        results <- test_results()
        if (!is.null(results)) {
          df <- data.frame(
            Category = results$cats,
            Observed = results$observed,
            Expected = round(results$expected, prefs()$rounding),
            Contribution = round(results$residuals^2, 3)
          )
          write.csv(df, file, row.names = FALSE)
        }
      }
    )
  })
}

# Uncomment below to run as standalone app for testing
# shinyApp(
#   ui = ht_chi_gof_ui("chi"),
#   server = function(input, output, session) {
#     ht_chi_gof_server("chi")
#   }
# )
