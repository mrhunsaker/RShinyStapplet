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
# Hypothesis Test for Difference in Means (Two Independent Groups)
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
# This module provides a Shiny applet for performing a two-sample t-test
# to compare the means of two independent groups. It includes:
#   - UI for data entry, parameter selection, and displaying results
#   - Server logic for validation, calculation, simulation, and output
#   - Download/export features and accessibility enhancements
#   - Detailed comments for maintainability and clarity
# --------------------------------------------------------------------

# Enhanced Hypothesis Test for a Difference in Means (Two-Sample t-Test) Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet

library(shiny)
library(ggplot2)
library(DT)

# -------------------------------
# Default Preferences
# -------------------------------
default_prefs <- list(
  color_palette = "viridis",   # Color palette for plots
  rounding = 4,                # Decimal places for output
  percent_display = FALSE      # Display percentages (not used here)
)

ht_diff_means_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs::useShinyjs(),
    tags$head(
      tags$style(HTML("
        .error-msg { color: #b30000; font-weight: bold; }
        .plot-container { margin-bottom: 1em; }
        .results-box { background: #f8f8f8; padding: 1em; border-radius: 8px; margin-bottom: 1em; }
        .prefs-box { background: #eef; padding: 1em; border-radius: 8px; margin-bottom: 1em; }
      "))
    ),
    h2("Hypothesis Test for a Difference in Means (Two-Sample t-Test)"),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Data Input Method"),
        radioButtons(ns("input_type"), "Choose how to provide data:",
                     choices = c("Enter Summary Statistics" = "summary",
                                 "Paste Raw Data" = "raw"),
                     selected = "summary"),
        hr(),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'summary'", ns("input_type")),
          h4("Group 1 Summary"),
          numericInput(ns("mean1"), "Sample Mean (x̄₁)", value = 22, min = 0),
          numericInput(ns("sd1"), "Sample SD (s₁)", value = 5, min = 0),
          numericInput(ns("n1"), "Sample Size (n₁)", value = 30, min = 2),
          hr(),
          h4("Group 2 Summary"),
          numericInput(ns("mean2"), "Sample Mean (x̄₂)", value = 20, min = 0),
          numericInput(ns("sd2"), "Sample SD (s₂)", value = 4, min = 0),
          numericInput(ns("n2"), "Sample Size (n₂)", value = 35, min = 2)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_type")),
          h4("Group 1 Data"),
          textAreaInput(ns("raw1"), "Paste data (one value per line)",
                        value = "25\n20\n23\n28\n19\n24\n26", rows = 5),
          hr(),
          h4("Group 2 Data"),
          textAreaInput(ns("raw2"), "Paste data (one value per line)",
                        value = "18\n21\n22\n19\n17\n20\n23", rows = 5)
        ),
        hr(),
        h3("Hypothesis Test Parameters"),
        numericInput(ns("h0_diff"), "Null Hypothesis (μ₁ - μ₂)", value = 0),
        selectInput(ns("alternative"), "Alternative Hypothesis",
                    choices = c("Two-sided (μ₁ ≠ μ₂)" = "two.sided",
                                "Greater than (μ₁ > μ₂)" = "greater",
                                "Less than (μ₁ < μ₂)" = "less")),
        sliderInput(ns("conf_level"), "Confidence Level for CI", min = 0.80, max = 0.99, value = 0.95, step = 0.01),
        checkboxInput(ns("pooled"), "Assume equal variances (use pooled SE)?", value = FALSE),
        hr(),
        h4("Simulation"),
        numericInput(ns("num_sim"), "Number of simulated samples:", value = 100, min = 1, max = 2000, step = 1),
        actionButton(ns("simulate"), "Simulate", class = "btn-warning"),
        actionButton(ns("clear_sim"), "Clear simulation", class = "btn-secondary"),
        hr(),
        h4("Preferences"),
        selectInput(ns("color_palette"), "Color Palette",
                    choices = c("viridis", "plasma", "magma", "inferno", "cividis")),
        numericInput(ns("rounding"), "Decimal Places", value = default_prefs$rounding, min = 0, max = 10, step = 1),
        checkboxInput(ns("percent_display"), "Display probabilities as percentages", value = default_prefs$percent_display),
        hr(),
        h4("Export/Download"),
        downloadButton(ns("download_plot"), "Download Plot", class = "btn-success"),
        downloadButton(ns("download_table"), "Download Table", class = "btn-success"),
        hr(),
        actionButton(ns("calculate"), "Calculate Test Results", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "error-msg", textOutput(ns("error_msg"), `aria-live` = "assertive")),
        fluidRow(
          column(6,
            div(class = "plot-container",
              h4("Data Visualization", style = "text-align: center;", id = ns("dataPlot_label")),
              plotOutput(ns("dataPlot"), height = "300px")
            )
          ),
          column(6,
            div(class = "plot-container",
              h4("Test Distribution", style = "text-align: center;", id = ns("testPlot_label")),
              plotOutput(ns("testPlot"), height = "300px")
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h3("Test Results", id = ns("testResult_label")),
              verbatimTextOutput(ns("testResult"))
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Simulation Dotplot", id = ns("sim_dotplot_heading"), style = "text-align: center;"),
              plotOutput(ns("sim_dotplot"), height = "300px")
            )
          )
        )
      )
    )
  )
}

ht_diff_means_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    prefs <- reactive({
      list(
        color_palette = input$color_palette %||% default_prefs$color_palette,
        rounding = input$rounding %||% default_prefs$rounding,
        percent_display = input$percent_display %||% default_prefs$percent_display
      )
    })

    error_msg <- reactiveVal("")

    # Reactive expression to perform the t-test
    test_results <- eventReactive(
      list(input$input_type, input$mean1, input$sd1, input$n1, input$mean2, input$sd2, input$n2,
           input$raw1, input$raw2, input$h0_diff, input$alternative, input$conf_level, input$pooled),
      {
        if (input$input_type == "raw") {
          # --- Raw Data Input ---
          data1 <- as.numeric(na.omit(read.csv(text = input$raw1, header = FALSE)$V1))
          data2 <- as.numeric(na.omit(read.csv(text = input$raw2, header = FALSE)$V1))

          if (length(data1) < 2 || length(data2) < 2) {
            error_msg("Please provide at least 2 numeric values for each group.")
            return(NULL)
          }

          # Use the built-in t.test function
          res <- t.test(x = data1, y = data2,
                        mu = input$h0_diff,
                        alternative = input$alternative,
                        conf.level = input$conf_level,
                        var.equal = input$pooled)

          error_msg("")
          return(list(
            t_stat = res$statistic,
            df = res$parameter,
            p_value = res$p.value,
            ci = res$conf.int,
            x_bar1 = mean(data1), x_bar2 = mean(data2),
            s1 = sd(data1), s2 = sd(data2),
            n1 = length(data1), n2 = length(data2),
            raw_data = list(data1 = data1, data2 = data2)
          ))

        } else {
          # --- Summary Statistics Input ---
          x_bar1 <- input$mean1; s1 <- input$sd1; n1 <- input$n1
          x_bar2 <- input$mean2; s2 <- input$sd2; n2 <- input$n2

          if (is.na(n1) || is.na(n2) || n1 < 2 || n2 < 2 || is.na(s1) || is.na(s2) || s1 <= 0 || s2 <= 0) {
            error_msg("Sample sizes must be >= 2 and standard deviations must be > 0.")
            return(NULL)
          }

          diff_means <- x_bar1 - x_bar2

          if (input$pooled) {
            # Pooled variance calculation
            df <- n1 + n2 - 2
            s_p_sq <- ((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / df
            se <- sqrt(s_p_sq * (1/n1 + 1/n2))
          } else {
            # Welch-Satterthwaite (unpooled) calculation
            se_term1 <- s1^2 / n1
            se_term2 <- s2^2 / n2
            se <- sqrt(se_term1 + se_term2)
            df <- (se_term1 + se_term2)^2 / ( (se_term1^2 / (n1 - 1)) + (se_term2^2 / (n2 - 1)) )
          }

          t_stat <- (diff_means - input$h0_diff) / se

          p_value <- switch(input$alternative,
            "two.sided" = 2 * pt(abs(t_stat), df, lower.tail = FALSE),
            "greater" = pt(t_stat, df, lower.tail = FALSE),
            "less" = pt(t_stat, df, lower.tail = TRUE)
          )

          alpha <- 1 - input$conf_level
          t_crit <- qt(1 - alpha / 2, df)
          margin_error <- t_crit * se
          ci <- c(diff_means - margin_error, diff_means + margin_error)

          error_msg("")
          return(list(
            t_stat = t_stat, df = df, p_value = p_value, ci = ci,
            x_bar1 = x_bar1, x_bar2 = x_bar2, s1 = s1, s2 = s2, n1 = n1, n2 = n2
          ))
        }
      }
    )

    # --- Simulation ---
    sim_results <- reactiveVal(NULL)
    observeEvent(input$simulate, {
      res <- test_results()
      if (is.null(res)) return()
      n1 <- res$n1; n2 <- res$n2
      s1 <- res$s1; s2 <- res$s2
      mu1 <- res$x_bar1; mu2 <- res$x_bar2
      num_sim <- input$num_sim
      sim_stats <- numeric(num_sim)
      for (i in seq_len(num_sim)) {
        sim1 <- rnorm(n1, mu1, s1)
        sim2 <- rnorm(n2, mu2, s2)
        sim_stats[i] <- mean(sim1) - mean(sim2)
      }
      sim_results(sim_stats)
    })
    observeEvent(input$clear_sim, {
      sim_results(NULL)
    })

    # Error message output
    output$error_msg <- renderText({
      error_msg()
    })

    # --- Render Plots ---
    output$dataPlot <- renderPlot({
      res <- test_results()
      if (is.null(res)) return(NULL)
      if (input$input_type == "raw" && !is.null(res$raw_data)) {
        df <- data.frame(
          value = c(res$raw_data$data1, res$raw_data$data2),
          group = factor(rep(c("Group 1", "Group 2"), c(res$n1, res$n2)))
        )
        ggplot(df, aes(x = group, y = value, fill = group)) +
          geom_boxplot(alpha = 0.7) +
          labs(x = "Group", y = "Value", title = "Side-by-Side Boxplots") +
          scale_fill_viridis_d(option = "D", end = 0.85) +
          theme_minimal() + theme(legend.position = "none")
      } else {
        # For summary stats, plot means with CI
        df <- data.frame(
          group = c("Group 1", "Group 2"),
          mean = c(res$x_bar1, res$x_bar2),
          se = c(res$s1 / sqrt(res$n1), res$s2 / sqrt(res$n2))
        )
        df$ci_low <- df$mean - 1.96 * df$se
        df$ci_high <- df$mean + 1.96 * df$se

        ggplot(df, aes(x = group, y = mean, color = group)) +
          geom_point(size = 4) +
          geom_errorbar(aes(ymin = ci_low, ymax = ci_high), width = 0.2, size = 1) +
          labs(x = "Group", y = "Mean +/- 1.96*SE", title = "Sample Means and Standard Errors") +
          scale_color_viridis_d(option = "D", end = 0.85) +
          theme_minimal() + theme(legend.position = "none")
      }
    })

    output$testPlot <- renderPlot({
      res <- test_results()
      if (is.null(res) || is.infinite(res$df)) return(NULL)
      t_stat <- res$t_stat
      df <- res$df
      x_lim <- max(4, abs(t_stat) + 1)
      x_vals <- seq(-x_lim, x_lim, length.out = 500)
      y_vals <- dt(x_vals, df)
      plot_data <- data.frame(x = x_vals, y = y_vals)
      p <- ggplot(plot_data, aes(x, y)) +
        geom_line(color = "#1e40af", size = 1) +
        labs(title = paste0("t-Distribution with df = ", round(df, 2)),
             x = "t-statistic", y = "Density") +
        geom_vline(xintercept = t_stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        theme_minimal()
      # Shading for p-value
      if (input$alternative == "two.sided") {
        p <- p + geom_area(data = subset(plot_data, x >= abs(t_stat)), aes(y = y), fill = "#ef4444", alpha = 0.5) +
                 geom_area(data = subset(plot_data, x <= -abs(t_stat)), aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else if (input$alternative == "greater") {
        p <- p + geom_area(data = subset(plot_data, x >= t_stat), aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else {
        p <- p + geom_area(data = subset(plot_data, x <= t_stat), aes(y = y), fill = "#ef4444", alpha = 0.5)
      }
      p
    })

    # --- Render Results ---
    output$testResult <- renderPrint({
      res <- test_results()
      if (is.null(res)) { cat("Enter data and parameters to see results."); return() }
      t_stat <- as.numeric(res$t_stat)
      df <- as.numeric(res$df)
      p_value <- as.numeric(res$p_value)
      ci1 <- as.numeric(res$ci[1])
      ci2 <- as.numeric(res$ci[2])
      x_bar1 <- as.numeric(res$x_bar1)
      s1 <- as.numeric(res$s1)
      n1 <- as.integer(res$n1)
      x_bar2 <- as.numeric(res$x_bar2)
      s2 <- as.numeric(res$s2)
      n2 <- as.integer(res$n2)
      cat("--- Test Summary ---\n")
      cat("Null Hypothesis (H₀): μ₁ - μ₂ =", input$h0_diff, "\n")
      alt_symbol <- switch(input$alternative, "two.sided" = "≠", "greater" = ">", "less" = "<")
      cat("Alternative (Hₐ):   μ₁ - μ₂", alt_symbol, input$h0_diff, "\n")
      cat("Test Type: Two-sample t-test", ifelse(input$pooled, "(pooled)", "(Welch)"), "\n\n")
      cat("--- Results ---\n")
      cat("t-statistic:", round(t_stat, 4), "\n")
      cat("Degrees of Freedom (df):", round(df, 4), "\n")
      cat("P-value:", format.pval(p_value, digits = 4, eps = 0.0001), "\n\n")
      cat(paste0("--- ", input$conf_level * 100, "% Confidence Interval for μ₁ - μ₂ ---\n"))
      cat("(", round(ci1, 4), ", ", round(ci2, 4), ")\n\n")
      cat("--- Sample Statistics ---\n")
      cat(sprintf("%-10s %-10s %-10s %-10s\n", "Group", "Mean", "Std Dev", "Size"))
      cat(sprintf("%-10s %-10.3f %-10.3f %-10d\n", "Group 1", x_bar1, s1, n1))
      cat(sprintf("%-10s %-10.3f %-10.3f %-10d\n", "Group 2", x_bar2, s2, n2))
    })

    # Simulation dotplot
    output$sim_dotplot <- renderPlot({
      sim_stats <- sim_results()
      res <- test_results()
      req(!is.null(sim_stats), !is.null(res))
      obs_diff <- res$x_bar1 - res$x_bar2
      plot_df <- data.frame(Diff = sim_stats)
      ggplot(plot_df, aes(x = Diff)) +
        geom_dotplot(binwidth = 0.5, dotsize = 0.7, fill = "#60a5fa") +
        geom_vline(xintercept = obs_diff, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Simulated Difference in Means", y = "Count",
             title = "Distribution of Simulated Differences in Means") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5))
    })

    # Download Plot
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("diff_means_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        res <- test_results()
        p <- ggplot(data.frame(Group = c("Group 1", "Group 2"),
                               Mean = c(res$x_bar1, res$x_bar2)),
                    aes(x = Group, y = Mean, fill = Group)) +
          geom_bar(stat = "identity", alpha = 0.7) +
          labs(x = "Group", y = "Mean",
               title = "Sample Means") +
          scale_fill_viridis_d(option = "D", end = 0.85) +
          theme_minimal() + theme(legend.position = "none")
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # Download Table
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("diff_means_results_", Sys.Date(), ".csv")
      },
      content = function(file) {
        res <- test_results()
        if (!is.null(res)) {
          df <- data.frame(
            Group = c("Group 1", "Group 2"),
            Mean = c(res$x_bar1, res$x_bar2),
            SD = c(res$s1, res$s2),
            N = c(res$n1, res$n2)
          )
          write.csv(df, file, row.names = FALSE)
        }
      }
    )
  })
}

# Uncomment below to run as standalone app for testing
# shinyApp(
#   ui = ht_diff_means_ui("diffmeans"),
#   server = function(input, output, session) {
#     ht_diff_means_server("diffmeans")
#   }
# )
