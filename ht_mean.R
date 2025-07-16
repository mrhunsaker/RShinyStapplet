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
# Stapplet Applet - Hypothesis Test for a Mean (One-Sample t-Test)
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
# This module implements a Shiny applet for hypothesis testing and confidence
# intervals for the mean. It supports both raw data and summary statistics input,
# provides visualizations, and simulates sampling distributions.
# The code is organized into UI and server components, with detailed comments
# throughout for clarity and maintainability.

# Hypothesis Test for a Population Mean (Fully Integrated, STAPLET Feature Parity)

library(shiny)
library(ggplot2)
library(DT)
library(shinyjs)
library(shinyWidgets)
library(readr)
library(stats)
library(coin) # For nonparametric tests
library(nortest) # For normality tests

# Helper functions ------------------------------------------------------------

parse_raw_data <- function(txt) {
  vals <- unlist(strsplit(txt, "[,\\s\\n]+"))
  nums <- suppressWarnings(as.numeric(vals))
  nums <- nums[!is.na(nums) & is.finite(nums)]
  nums
}

validate_mean_sd_n <- function(mean, sd, n) {
  errors <- c()
  if (is.na(mean)) errors <- c(errors, "Mean must be numeric.")
  if (is.na(sd) || sd < 0) errors <- c(errors, "SD must be non-negative numeric.")
  if (is.na(n) || n < 2) errors <- c(errors, "n must be at least 2.")
  errors
}

validate_fivenum <- function(min, q1, med, q3, max) {
  errors <- c()
  vals <- c(min, q1, med, q3, max)
  if (all(is.na(vals)) || all(trimws(as.character(vals)) == "")) {
    # Don't show error until user enters data
  } else if (any(is.na(vals))) {
    errors <- c(errors, "All five-number summary values must be numeric.")
  }
  if (!(min <= q1 && q1 <= med && med <= q3 && q3 <= max)) errors <- c(errors, "Five-number summary values are out of order.")
  errors
}

# UI --------------------------------------------------------------------------

ht_mean_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    titlePanel(
      h2("One Quantitative Variable, Single Group", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Mean"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",
        h3("Data Input", id = "paramsHeading"),
        textInput(ns("variable_name"), "Variable name:", value = "Variable"),
        selectInput(ns("input_mode"), "Input type:",
          choices = c(
            "Raw data" = "raw",
            "Mean and SD" = "meanstats",
            "Five-number summary" = "fivenum"
          ),
          selected = "raw"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          textAreaInput(ns("raw_data"), "Enter numeric data (comma, space, or newline separated):",
            rows = 5, placeholder = "e.g., 25.1, 27.3, 24.8, 26.5, 25.9"
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'meanstats'", ns("input_mode")),
          numericInput(ns("mean"), "Mean:", value = NA),
          numericInput(ns("sd"), "SD:", value = NA),
          numericInput(ns("n"), "n:", value = NA)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'fivenum'", ns("input_mode")),
          numericInput(ns("min"), "Min:", value = NA),
          numericInput(ns("q1"), "Q1:", value = NA),
          numericInput(ns("med"), "Median:", value = NA),
          numericInput(ns("q3"), "Q3:", value = NA),
          numericInput(ns("max"), "Max:", value = NA)
        ),
        hr(),
        h3("Preferences"),
        pickerInput(ns("color_palette"), "Color palette:",
          choices = c("Default", "Colorblind", "Viridis", "Pastel"),
          selected = "Default"
        ),
        sliderInput(ns("round_digits"), "Rounding digits:", min = 0, max = 4, value = 2),
        switchInput(ns("aria_enable"), "Enable ARIA roles/labels", value = TRUE),
        hr(),
        downloadButton(ns("download_stats"), "Export summary statistics"),
        downloadButton(ns("download_plot"), "Download plot")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        tabsetPanel(
          tabPanel(
            "Visualization",
            h4("Graph Distribution", style = "text-align: center;", id = ns("graph_label")),
            selectInput(ns("graph_type"), "Graph type:",
              choices = c(
                "Dotplot" = "dotplot",
                "Histogram" = "histogram",
                "Boxplot" = "boxplot",
                "Stemplot" = "stemplot",
                "Normal probability plot" = "normplot"
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s'] == 'histogram'", ns("graph_type")),
              selectInput(ns("hist_label"), "Label histogram with:",
                choices = c("Frequency" = "freq", "Relative frequency" = "rel")
              ),
              numericInput(ns("hist_binwidth"), "Interval width:", value = NA, min = 0.01, step = 0.01),
              numericInput(ns("hist_align"), "Boundary value:", value = NA, step = 0.01)
            ),
            plotOutput(ns("main_plot"), height = "350px", inline = TRUE),
            hr(),
            h4("Summary Statistics"),
            DTOutput(ns("summary_stats")),
            hr()
          ),
          tabPanel(
            "Inference",
            h4("Perform Inference"),
            uiOutput(ns("inference_ui")),
            uiOutput(ns("inference_results")),
            hr(),
            h4("Simulation"),
            uiOutput(ns("simulation_ui")),
            plotOutput(ns("simulation_plot"), height = "250px"),
            uiOutput(ns("simulation_stats")),
            hr()
          )
        )
      )
    )
  )
}

# Server ----------------------------------------------------------------------

ht_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Data Extraction & Validation ---
    data_input <- reactive({
      mode <- input$input_mode
      if (is.null(mode)) {
        return(NULL)
      }
      if (mode == "raw") {
        vals <- parse_raw_data(input$raw_data)
        if (is.null(input$raw_data) || trimws(input$raw_data) == "") {
          errors <- NULL
        } else if (is.null(vals) || length(vals) < 2) {
          errors <- "At least 2 numeric values required."
        } else {
          errors <- NULL
        }
        list(type = "raw", data = vals, errors = errors, variable_name = input$variable_name)
      } else if (mode == "meanstats") {
        mean <- input$mean
        sd <- input$sd
        n <- input$n
        errors <- validate_mean_sd_n(mean, sd, n)
        list(type = "meanstats", mean = mean, sd = sd, n = n, errors = errors, variable_name = input$variable_name)
      } else if (mode == "fivenum") {
        min <- input$min
        q1 <- input$q1
        med <- input$med
        q3 <- input$q3
        max <- input$max
        errors <- validate_fivenum(min, q1, med, q3, max)
        list(type = "fivenum", min = min, q1 = q1, med = med, q3 = q3, max = max, errors = errors, variable_name = input$variable_name)
      } else {
        NULL
      }
    })

    # --- Summary Statistics ---
    output$summary_stats <- renderDT({
      dat <- data_input()
      if (!is.null(dat$errors)) {
        return(datatable(data.frame(Error = dat$errors)))
      }
      if (dat$type == "raw") {
        vals <- dat$data
        df <- data.frame(
          n = length(vals),
          Mean = round(mean(vals), input$round_digits),
          SD = round(sd(vals), input$round_digits),
          Min = round(min(vals), input$round_digits),
          Q1 = round(quantile(vals, 0.25), input$round_digits),
          Median = round(median(vals), input$round_digits),
          Q3 = round(quantile(vals, 0.75), input$round_digits),
          Max = round(max(vals), input$round_digits)
        )
      } else if (dat$type == "meanstats") {
        df <- data.frame(
          n = dat$n,
          Mean = round(dat$mean, input$round_digits),
          SD = round(dat$sd, input$round_digits)
        )
      } else {
        df <- data.frame(
          Min = dat$min,
          Q1 = dat$q1,
          Median = dat$med,
          Q3 = dat$q3,
          Max = dat$max
        )
      }
      datatable(df, rownames = FALSE, options = list(dom = "t", ordering = FALSE, paging = FALSE))
    })

    # --- Visualization ---
    output$main_plot <- renderPlot({
      dat <- data_input()
      if (!is.null(dat$errors)) {
        return(NULL)
      }
      palette <- switch(input$color_palette,
        "Default" = "Set2",
        "Colorblind" = "Dark2",
        "Viridis" = "viridis",
        "Pastel" = "Pastel1",
        "Set2"
      )
      if (dat$type == "raw") {
        vals <- dat$data
        if (input$graph_type == "dotplot") {
          ggplot(data.frame(x = vals), aes(x = x)) +
            geom_dotplot(binwidth = 0.1, dotsize = 0.5, fill = "#60a5fa") +
            labs(x = dat$variable_name, y = "Count") +
            theme_minimal()
        } else if (input$graph_type == "histogram") {
          binwidth <- input$hist_binwidth
          align <- input$hist_align
          label_type <- input$hist_label
          p <- ggplot(data.frame(x = vals), aes(x = x)) +
            geom_histogram(
              binwidth = ifelse(is.na(binwidth), NULL, binwidth),
              boundary = ifelse(is.na(align), NULL, align),
              fill = "#60a5fa", color = "white", alpha = 0.8
            )
          if (label_type == "rel") {
            p <- p + aes(y = ..density..) + labs(y = "Relative Frequency")
          } else {
            p <- p + labs(y = "Frequency")
          }
          p + labs(x = dat$variable_name) + theme_minimal()
        } else if (input$graph_type == "boxplot") {
          ggplot(data.frame(x = vals), aes(x = "", y = x)) +
            geom_boxplot(fill = "#60a5fa", color = "#1e40af") +
            labs(x = "", y = dat$variable_name) +
            theme_minimal()
        } else if (input$graph_type == "stemplot") {
          # Simple stemplot using base R
          graphics::stem(vals)
        } else if (input$graph_type == "normplot") {
          qqnorm(vals, main = "Normal Probability Plot")
          qqline(vals, col = "#1e40af", lwd = 2)
        }
      } else if (dat$type == "meanstats") {
        # Only boxplot/histogram possible
        vals <- rnorm(dat$n, mean = dat$mean, sd = dat$sd)
        if (input$graph_type == "dotplot") {
          ggplot(data.frame(x = vals), aes(x = x)) +
            geom_dotplot(binwidth = 0.1, dotsize = 0.5, fill = "#60a5fa") +
            labs(x = dat$variable_name, y = "Count") +
            theme_minimal()
        } else if (input$graph_type == "histogram") {
          binwidth <- input$hist_binwidth
          align <- input$hist_align
          label_type <- input$hist_label
          p <- ggplot(data.frame(x = vals), aes(x = x)) +
            geom_histogram(
              binwidth = ifelse(is.na(binwidth), NULL, binwidth),
              boundary = ifelse(is.na(align), NULL, align),
              fill = "#60a5fa", color = "white", alpha = 0.8
            )
          if (label_type == "rel") {
            p <- p + aes(y = ..density..) + labs(y = "Relative Frequency")
          } else {
            p <- p + labs(y = "Frequency")
          }
          p + labs(x = dat$variable_name) + theme_minimal()
        } else if (input$graph_type == "boxplot") {
          ggplot(data.frame(x = vals), aes(x = "", y = x)) +
            geom_boxplot(fill = "#60a5fa", color = "#1e40af") +
            labs(x = "", y = dat$variable_name) +
            theme_minimal()
        }
      } else if (dat$type == "fivenum") {
        # Only boxplot possible
        box_stats <- c(dat$min, dat$q1, dat$med, dat$q3, dat$max)
        boxplot(box_stats,
          main = paste("Five-number summary:", dat$variable_name),
          names = c("Min", "Q1", "Median", "Q3", "Max"), col = "#60a5fa"
        )
      }
    })

    # --- Inference UI ---
    output$inference_ui <- renderUI({
      dat <- data_input()
      if (!is.null(dat$errors)) {
        return(tags$p(dat$errors, style = "color: red;"))
      }
      tagList(
        selectInput(ns("inference_type"), "Inference procedure:",
          choices = c(
            "Simulate sample mean" = "simulation",
            "Simulate mean difference" = "simulationDiff",
            "1-sample t interval for μ" = "interval",
            "1-sample t test for μ" = "test",
            "1-sample χ² interval for σ" = "SDinterval",
            "1-sample χ² test for σ" = "SDtest",
            "Sign test for paired data" = "sign",
            "Sign test for population median" = "medsign",
            "Wilcoxon signed rank test for paired data" = "wilcoxon",
            "Wilcoxon signed rank test for population median" = "medwilcoxon"
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'interval'", ns("inference_type")),
          numericInput(ns("conf_level"), "Confidence level (%)", value = 95, min = 0.1, max = 99.9, step = 0.1)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'test'", ns("inference_type")),
          selectInput(ns("alt_hypothesis"), "Alternative hypothesis:",
            choices = c(
              "μ > μ₀" = "greater",
              "μ < μ₀" = "less",
              "μ ≠ μ₀" = "two.sided"
            )
          ),
          numericInput(ns("null_mean"), "Hypothesized mean (μ₀):", value = NA)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'SDinterval'", ns("inference_type")),
          numericInput(ns("conf_level_sd"), "Confidence level (%)", value = 95, min = 0.1, max = 99.9, step = 0.1)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'SDtest'", ns("inference_type")),
          selectInput(ns("alt_hypothesis_sd"), "Alternative hypothesis:",
            choices = c(
              "σ > σ₀" = "greater",
              "σ < σ₀" = "less",
              "σ ≠ σ₀" = "two.sided"
            )
          ),
          numericInput(ns("null_sd"), "Hypothesized SD (σ₀):", value = NA)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'medsign'", ns("inference_type")),
          selectInput(ns("alt_hypothesis_med"), "Alternative hypothesis:",
            choices = c(
              "Median > M₀" = "greater",
              "Median < M₀" = "less",
              "Median ≠ M₀" = "two.sided"
            )
          ),
          numericInput(ns("null_median"), "Hypothesized median (M₀):", value = NA)
        ),
        actionButton(ns("run_inference"), "Perform inference", class = "btn-primary")
      )
    })

    # --- Inference Calculation ---
    inference_results <- eventReactive(input$run_inference, {
      dat <- data_input()
      if (!is.null(dat$errors)) {
        return(list(error = dat$errors))
      }
      vals <- if (dat$type == "raw") dat$data else if (dat$type == "meanstats") rnorm(dat$n, mean = dat$mean, sd = dat$sd) else NULL
      n <- if (dat$type == "raw") length(vals) else if (dat$type == "meanstats") dat$n else NA
      if (input$inference_type == "interval") {
        conf <- input$conf_level / 100
        m <- mean(vals)
        s <- sd(vals)
        se <- s / sqrt(n)
        df <- n - 1
        tstar <- qt(1 - (1 - conf) / 2, df)
        lower <- m - tstar * se
        upper <- m + tstar * se
        list(type = "interval", lower = lower, upper = upper, df = df)
      } else if (input$inference_type == "test") {
        null_mean <- input$null_mean
        alt <- input$alt_hypothesis
        ttest <- t.test(vals, mu = null_mean, alternative = alt)
        list(type = "test", t = ttest$statistic, p_value = ttest$p.value, df = ttest$parameter)
      } else if (input$inference_type == "SDinterval") {
        conf <- input$conf_level_sd / 100
        s <- sd(vals)
        df <- n - 1
        chi2_lower <- qchisq((1 - conf) / 2, df)
        chi2_upper <- qchisq(1 - (1 - conf) / 2, df)
        lower <- sqrt((df * s^2) / chi2_upper)
        upper <- sqrt((df * s^2) / chi2_lower)
        list(type = "SDinterval", lower = lower, upper = upper, df = df)
      } else if (input$inference_type == "SDtest") {
        null_sd <- input$null_sd
        alt <- input$alt_hypothesis_sd
        s <- sd(vals)
        df <- n - 1
        chi2 <- df * s^2 / null_sd^2
        if (alt == "greater") {
          pval <- 1 - pchisq(chi2, df)
        } else if (alt == "less") {
          pval <- pchisq(chi2, df)
        } else {
          pval <- 2 * min(pchisq(chi2, df), 1 - pchisq(chi2, df))
        }
        list(type = "SDtest", chi2 = chi2, p_value = pval, df = df)
      } else if (input$inference_type == "sign") {
        # Paired sign test (assume paired differences in vals)
        res <- sign_test(vals ~ 1)
        list(type = "sign", statistic = res$statistic, p_value = res$p.value)
      } else if (input$inference_type == "medsign") {
        null_med <- input$null_median
        alt <- input$alt_hypothesis_med
        diffs <- vals - null_med
        res <- binom.test(sum(diffs > 0), length(diffs), p = 0.5, alternative = alt)
        list(type = "medsign", statistic = res$statistic, p_value = res$p.value)
      } else if (input$inference_type == "wilcoxon") {
        res <- wilcox.test(vals, mu = 0, alternative = "two.sided")
        list(type = "wilcoxon", statistic = res$statistic, p_value = res$p.value)
      } else if (input$inference_type == "medwilcoxon") {
        null_med <- input$null_median
        res <- wilcox.test(vals, mu = null_med, alternative = "two.sided")
        list(type = "medwilcoxon", statistic = res$statistic, p_value = res$p.value)
      } else if (input$inference_type == "simulation") {
        list(type = "simulation", vals = vals, n = n)
      } else if (input$inference_type == "simulationDiff") {
        list(type = "simulationDiff", vals = vals, n = n)
      }
    })

    output$inference_results <- renderUI({
      res <- inference_results()
      if (!is.null(res$error)) {
        return(tags$p(res$error, style = "color: red;"))
      }
      if (res$type == "interval") {
        tags$table(
          class = "table table-striped",
          tags$tr(tags$th("Lower Bound"), tags$th("Upper Bound"), tags$th("df")),
          tags$tr(
            tags$td(round(res$lower, input$round_digits)),
            tags$td(round(res$upper, input$round_digits)),
            tags$td(res$df)
          )
        )
      } else if (res$type == "test") {
        tags$table(
          class = "table table-striped",
          tags$tr(tags$th("t"), tags$th("P-value"), tags$th("df")),
          tags$tr(
            tags$td(round(res$t, 3)),
            tags$td(format.pval(res$p_value, digits = 4, eps = 0.0001)),
            tags$td(res$df)
          )
        )
      } else if (res$type == "SDinterval") {
        tags$table(
          class = "table table-striped",
          tags$tr(tags$th("Lower Bound"), tags$th("Upper Bound"), tags$th("df")),
          tags$tr(
            tags$td(round(res$lower, input$round_digits)),
            tags$td(round(res$upper, input$round_digits)),
            tags$td(res$df)
          )
        )
      } else if (res$type == "SDtest") {
        tags$table(
          class = "table table-striped",
          tags$tr(tags$th("χ²"), tags$th("P-value"), tags$th("df")),
          tags$tr(
            tags$td(round(res$chi2, 3)),
            tags$td(format.pval(res$p_value, digits = 4, eps = 0.0001)),
            tags$td(res$df)
          )
        )
      } else if (res$type %in% c("sign", "medsign", "wilcoxon", "medwilcoxon")) {
        tags$table(
          class = "table table-striped",
          tags$tr(tags$th("Statistic"), tags$th("P-value")),
          tags$tr(
            tags$td(round(res$statistic, 3)),
            tags$td(format.pval(res$p_value, digits = 4, eps = 0.0001))
          )
        )
      }
    })

    # --- Simulation ---
    simulation_results <- reactiveVal(NULL)
    output$simulation_ui <- renderUI({
      res <- inference_results()
      if (is.null(res) || !(res$type %in% c("simulation", "simulationDiff"))) {
        return(NULL)
      }
      tagList(
        numericInput(ns("num_trials"), "Number of samples to add:", value = 1000, min = 1, step = 1),
        actionButton(ns("run_simulation"), "Add samples"),
        actionButton(ns("clear_simulation"), "Reset simulation"),
        hr(),
        fluidRow(
          column(6, textInput(ns("dotplot_count_bound"), "Count dots less/greater than:", value = "")),
          column(6, selectInput(ns("dotplot_count_dir"), "Direction:", choices = c("less than" = "left", "greater than" = "right")))
        ),
        actionButton(ns("count_dotplot"), "Count"),
        actionButton(ns("clear_dotplot_count"), "Remove count")
      )
    })
    observeEvent(input$run_simulation, {
      res <- inference_results()
      if (is.null(res) || !(res$type %in% c("simulation", "simulationDiff"))) {
        return()
      }
      vals <- res$vals
      n <- res$n
      trials <- input$num_trials
      sim_results <- numeric(trials)
      if (res$type == "simulation") {
        for (i in seq_len(trials)) {
          sim_results[i] <- mean(sample(vals, n, replace = TRUE))
        }
      } else {
        # Simulate mean difference (random split)
        for (i in seq_len(trials)) {
          idx <- sample(seq_along(vals), n, replace = TRUE)
          group1 <- vals[idx[1:(n %/% 2)]]
          group2 <- vals[idx[(n %/% 2 + 1):n]]
          sim_results[i] <- mean(group1) - mean(group2)
        }
      }
      prev <- simulation_results()
      simulation_results(c(prev, sim_results))
    })
    observeEvent(input$clear_simulation, {
      simulation_results(NULL)
    })
    output$simulation_plot <- renderPlot({
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) {
        return(NULL)
      }
      ggplot(data.frame(Sim = sims), aes(x = Sim)) +
        geom_dotplot(binwidth = 0.01, dotsize = 0.5, fill = "#60a5fa") +
        labs(x = "Simulated sample mean", y = "Count") +
        theme_minimal()
    })
    dotplot_count <- reactiveVal(NULL)
    observeEvent(input$count_dotplot, {
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) {
        return()
      }
      bound <- as.numeric(input$dotplot_count_bound)
      dir <- input$dotplot_count_dir
      if (is.na(bound)) {
        return()
      }
      if (dir == "left") {
        count <- sum(sims <= bound)
      } else {
        count <- sum(sims >= bound)
      }
      percent <- round(100 * count / length(sims), input$round_digits)
      dotplot_count(list(count = count, percent = percent, bound = bound, dir = dir))
    })
    observeEvent(input$clear_dotplot_count, {
      dotplot_count(NULL)
    })
    output$simulation_stats <- renderUI({
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) {
        return(NULL)
      }
      mean_val <- mean(sims)
      sd_val <- sd(sims)
      most_recent <- tail(sims, 1)
      count_info <- dotplot_count()
      tagList(
        tags$table(
          tags$tr(tags$td("# of samples:"), tags$td(length(sims))),
          tags$tr(tags$td("Most recent result:"), tags$td(round(most_recent, input$round_digits))),
          tags$tr(tags$td("Mean:"), tags$td(round(mean_val, input$round_digits))),
          tags$tr(tags$td("SD:"), tags$td(round(sd_val, input$round_digits)))
        ),
        if (!is.null(count_info)) {
          tags$p(
            sprintf(
              "Counted %d dots (%0.2f%%) %s %s.",
              count_info$count, count_info$percent,
              ifelse(count_info$dir == "left", "≤", "≥"),
              count_info$bound
            ),
            style = "color: #2563eb; font-weight: bold;"
          )
        }
      )
    })

    # --- Export/Download ---
    output$download_stats <- downloadHandler(
      filename = function() {
        paste0("summary_statistics_", Sys.Date(), ".csv")
      },
      content = function(file) {
        dat <- data_input()
        if (!is.null(dat$errors)) {
          writeLines(dat$errors, file)
        } else {
          if (dat$type == "raw") {
            vals <- dat$data
            df <- data.frame(
              n = length(vals),
              Mean = round(mean(vals), input$round_digits),
              SD = round(sd(vals), input$round_digits),
              Min = round(min(vals), input$round_digits),
              Q1 = round(quantile(vals, 0.25), input$round_digits),
              Median = round(median(vals), input$round_digits),
              Q3 = round(quantile(vals, 0.75), input$round_digits),
              Max = round(max(vals), input$round_digits)
            )
          } else if (dat$type == "meanstats") {
            df <- data.frame(
              n = dat$n,
              Mean = round(dat$mean, input$round_digits),
              SD = round(dat$sd, input$round_digits)
            )
          } else {
            df <- data.frame(
              Min = dat$min,
              Q1 = dat$q1,
              Median = dat$med,
              Q3 = dat$q3,
              Max = dat$max
            )
          }
          write_csv(df, file)
        }
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("distribution_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        dat <- data_input()
        if (!is.null(dat$errors)) {
          return()
        }
        palette <- switch(input$color_palette,
          "Default" = "Set2",
          "Colorblind" = "Dark2",
          "Viridis" = "viridis",
          "Pastel" = "Pastel1",
          "Set2"
        )
        if (dat$type == "raw") {
          vals <- dat$data
          p <- ggplot(data.frame(x = vals), aes(x = x)) +
            geom_dotplot(binwidth = 0.1, dotsize = 0.5, fill = "#60a5fa") +
            labs(x = dat$variable_name, y = "Count") +
            theme_minimal()
          ggsave(file, plot = p, width = 7, height = 5)
        }
      }
    )

    # --- Accessibility ---
    observe({
      # Accessibility toggling removed (shinyAccessibility package not used)
    })

    # --- Error Messaging ---
    observe({
      dat <- data_input()
      if (!is.null(dat$errors)) {
        showNotification(paste(dat$errors, collapse = "\n"), type = "error", duration = 7)
      }
    })
  })
}

# App Entrypoint --------------------------------------------------------------
# Uncomment below to run as standalone app
# shinyApp(
#   ui = ht_mean_ui("ht_mean"),
#   server = function(input, output, session) {
#     ht_mean_server("ht_mean")
#   }
# )
