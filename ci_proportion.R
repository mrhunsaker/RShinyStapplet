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
# Confidence Interval for a Proportion (Single Group)
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility Features:
#   - ARIA roles and labels for all UI elements
#   - Alt text and aria-label for all plots
#   - BrailleR integration for plot descriptions
#   - Screen-reader-only dynamic descriptions for outputs
#   - Accessible error/status messaging with ARIA live regions
#   - Focus management for modals/popups
#   - Accessible export/download features
######################################################################

# --- Load required libraries ---
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots
library(DT)       # For interactive tables
library(shinyjs)  # For JavaScript integration in Shiny

# --- UI Definition for Confidence Interval for a Proportion Applet ---
# This function builds the user interface for the module, allowing users to:
# - Input data as counts or raw binary/success-failure values
# - Set simulation parameters and confidence level
# - View population/sample plots, confidence intervals, and summary statistics
# - Download results and adjust preferences
ci_proportion_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Simulating Confidence Intervals for a Proportion"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Simulating Confidence Intervals for a Population Proportion", id = ns("appTitle")),
      windowTitle = "Simulating Confidence Intervals for a Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Population & Data Input", id = ns("popHeading")),
        # --- Data input mode selection ---
        selectInput(
          ns("input_mode"), "Data input mode:",
          choices = c(
            "Counts Table" = "counts",
            "Raw Data (0/1 or Success/Failure)" = "raw"
          ),
          selected = "counts"
        ),
        # --- Counts table input ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'counts'", ns("input_mode")),
          div(
            tags$label("Number of Successes (x):", id = ns("successes_label")),
            numericInput(ns("successes"), NULL, value = 45, min = 0, step = 1),
            tags$label("Number of Trials (n):", id = ns("trials_label")),
            numericInput(ns("trials"), NULL, value = 100, min = 1, step = 1)
          )
        ),
        # --- Raw data input ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          div(
            tags$label("Paste raw data (comma, space, or newline separated; 0/1 or Success/Failure):", id = ns("raw_label")),
            textAreaInput(ns("raw_data"), NULL, value = "", rows = 4, placeholder = "e.g. 1,0,1,1,0,1 or Success,Failure,..."),
            actionButton(ns("parse_raw"), "Parse Raw Data", class = "btn-secondary", style = "width: 100%;")
          )
        ),
        hr(role = "separator"),
        # --- Simulation controls ---
        h4("Simulation Controls"),
        div(
          tags$label("Confidence Level (%):", id = ns("conf_level_label")),
          numericInput(ns("conf_level"), NULL, value = 95, min = 1, max = 99.9, step = 0.1),
          tags$label("Number of samples to simulate:", id = ns("num_samples_label")),
          numericInput(ns("num_samples"), NULL, value = 1, min = 1, max = 500, step = 1),
          actionButton(ns("simulate"), "Simulate", class = "btn-primary", style = "width: 100%;"),
          actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        # --- Download options ---
        h4("Export/Download"),
        downloadButton(ns("download_intervals"), "Download Intervals (CSV)", class = "btn-success"),
        downloadButton(ns("download_sample"), "Download Last Sample (CSV)", class = "btn-success"),
        hr(role = "separator"),
        # --- Preferences for display ---
        h4("Preferences"),
        checkboxInput(ns("colorblind"), "Colorblind-friendly palette", value = FALSE),
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 4, value = 2),
        checkboxInput(ns("show_percent"), "Show percent/proportion", value = TRUE)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(6,
            div(class = "plot-container",
              h4("Population Visualization", id = ns("popPlotHeading")),
              plotOutput(ns("populationPlot"), height = "200px", inline = TRUE)
            )
          ),
          column(6,
            div(class = "plot-container",
              h4("Last Sample Visualization", id = ns("samplePlotHeading")),
              plotOutput(ns("samplePlot"), height = "200px", inline = TRUE)
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Generated Confidence Intervals", id = ns("ciPlotHeading")),
              plotOutput(ns("ciPlot"), height = "300px", inline = TRUE),
              p(id = ns("ciPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("ciPlot_desc_text")))
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Simulation Summary", id = ns("summaryStatsHeading")),
              verbatimTextOutput(ns("summaryStats"), placeholder = TRUE)
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Error/Warning Messages", id = ns("errorHeading")),
              uiOutput(ns("errorMsg"))
            )
          )
        )
      )
    )
  )
}

# --- Server Logic for Confidence Interval for a Proportion Applet ---
# This function contains all reactive logic, calculations, and output rendering for the module.
ci_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    # Stores parsed data, population, intervals, last sample, and error messages
    rv <- reactiveValues(
      n = NULL,
      x = NULL,
      raw_parsed = NULL,
      population = NULL,
      intervals = data.frame(),
      last_sample = NULL,
      error = NULL
    )

    # --- Parse Raw Data ---
    # Converts raw input into binary values and updates reactive values
    observeEvent(input$parse_raw, {
      raw <- input$raw_data
      if (is.null(raw) || nchar(raw) == 0) {
        rv$error <- "Raw data input is empty."
        rv$raw_parsed <- NULL
        return()
      }
      # Accept 0/1, TRUE/FALSE, Success/Failure, yes/no, etc.
      items <- unlist(strsplit(raw, "[,\\s\\n]+"))
      items <- items[items != ""]
      # Normalize to 0/1
      items <- tolower(items)
      items[items %in% c("1", "success", "yes", "true")] <- 1
      items[items %in% c("0", "failure", "no", "false")] <- 0
      if (!all(items %in% c("0", "1"))) {
        rv$error <- "Raw data must contain only 0/1, Success/Failure, Yes/No, or True/False."
        rv$raw_parsed <- NULL
        return()
      }
      items <- as.numeric(items)
      rv$raw_parsed <- items
      rv$n <- length(items)
      rv$x <- sum(items)
      rv$error <- NULL
    })

    # --- Input Validation ---
    # Checks for valid input values and simulation parameters
    validate_inputs <- reactive({
      errs <- character(0)
      mode <- input$input_mode
      if (mode == "counts") {
        if (is.null(input$successes) || is.null(input$trials)) {
          errs <- c(errs, "Please enter both number of successes and trials.")
        } else {
          if (input$successes < 0 || input$trials <= 0) errs <- c(errs, "Successes must be >= 0 and trials > 0.")
          if (input$successes > input$trials) errs <- c(errs, "Successes cannot exceed trials.")
        }
      } else if (mode == "raw") {
        if (is.null(rv$raw_parsed)) errs <- c(errs, "Raw data not parsed or invalid.")
        if (!is.null(rv$raw_parsed) && length(rv$raw_parsed) < 1) errs <- c(errs, "Raw data must contain at least one value.")
      }
      if (input$conf_level <= 0 || input$conf_level >= 100) errs <- c(errs, "Confidence level must be between 1 and 99.")
      if (input$num_samples < 1 || input$num_samples > 500) errs <- c(errs, "Number of samples must be between 1 and 500.")
      if (length(errs) > 0) {
        rv$error <- paste(errs, collapse = "\n")
        FALSE
      } else {
        rv$error <- NULL
        TRUE
      }
    })

    # --- Generate Population ---
    # Simulates a population based on observed proportion
    observe({
      req(validate_inputs())
      mode <- input$input_mode
      if (mode == "counts") {
        n <- input$trials
        x <- input$successes
      } else {
        n <- rv$n
        x <- rv$x
      }
      # Simulate population as Bernoulli trials with observed p_hat
      p_hat <- if (n > 0) x / n else 0
      rv$population <- sample(c(1, 0), size = 10000, replace = TRUE, prob = c(p_hat, 1 - p_hat))
      rv$n <- n
      rv$x <- x
      # Reset intervals and sample
      rv$intervals <- data.frame()
      rv$last_sample <- NULL
    })

    # --- Simulate Samples and Calculate CIs ---
    # Draws samples from the population and calculates confidence intervals
    simulate_cis <- function(n_intervals = 1) {
      req(validate_inputs())
      n <- rv$n
      x <- rv$x
      conf <- input$conf_level / 100
      p_hat <- if (n > 0) x / n else 0
      intervals <- list()
      for (i in seq_len(n_intervals)) {
        sample <- sample(rv$population, size = n, replace = TRUE)
        x_samp <- sum(sample)
        p_hat_samp <- x_samp / n
        se <- sqrt(p_hat_samp * (1 - p_hat_samp) / n)
        z_star <- qnorm(1 - (1 - conf) / 2)
        lower <- p_hat_samp - z_star * se
        upper <- p_hat_samp + z_star * se
        # Large counts condition
        condition_check <- (n * p_hat_samp >= 10) && (n * (1 - p_hat_samp) >= 10)
        intervals[[i]] <- data.frame(
          id = nrow(rv$intervals) + i,
          estimate = p_hat_samp,
          lower = lower,
          upper = upper,
          captured = (p_hat >= lower && p_hat <= upper),
          condition_check = condition_check
        )
        rv$last_sample <- sample
      }
      rv$intervals <- rbind(rv$intervals, do.call(rbind, intervals))
    }

    # --- Button Handlers ---
    # Handles simulation and reset actions
    observeEvent(input$simulate, {
      if (validate_inputs()) {
        simulate_cis(input$num_samples)
      }
    })
    observeEvent(input$reset, {
      rv$intervals <- data.frame()
      rv$last_sample <- NULL
      rv$error <- NULL
      rv$raw_parsed <- NULL
      rv$n <- NULL
      rv$x <- NULL
    })

    # --- Error/Warning Messaging ---
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Population Plot ---
    # Displays a bar chart of the population successes/failures
    output$populationPlot <- renderPlot({
      req(rv$population)
      df <- data.frame(
        Outcome = c("Success", "Failure"),
        Count = c(sum(rv$population == 1), sum(rv$population == 0))
      )
      ggplot(df, aes(x = Outcome, y = Count, fill = Outcome)) +
        geom_bar(stat = "identity") +
        scale_fill_manual(values = if (input$colorblind) c("#0072B2", "#D55E00") else c("#60a5fa", "#dc2626")) +
        theme_minimal() +
        labs(title = sprintf("Population (p̂ = %.2f)", ifelse(is.null(rv$n), 0, rv$x / rv$n)))
    })

    # --- Sample Plot ---
    # Displays a bar chart of the most recent sample's successes/failures
    output$samplePlot <- renderPlot({
      req(rv$last_sample)
      df <- data.frame(
        Outcome = c("Success", "Failure"),
        Count = c(sum(rv$last_sample == 1), sum(rv$last_sample == 0))
      )
      ggplot(df, aes(x = Outcome, y = Count, fill = Outcome)) +
        geom_bar(stat = "identity") +
        scale_fill_manual(values = if (input$colorblind) c("#0072B2", "#D55E00") else c("#84cc16", "#dc2626")) +
        theme_minimal() +
        labs(title = "Sample Outcomes")
    })

    # --- Confidence Intervals Plot ---
    # Displays horizontal error bars for the most recent confidence intervals
    output$ciPlot <- renderPlot({
      if (nrow(rv$intervals) == 0) {
        return(ggplot() + labs(title = "Simulate to generate confidence intervals") + theme_void())
      }
      display_data <- tail(rv$intervals, 100)
      display_data$estimate <- as.numeric(display_data$estimate)
      display_data$id <- as.integer(display_data$id)
      display_data$lower <- as.numeric(display_data$lower)
      display_data$upper <- as.numeric(display_data$upper)
      display_data$captured <- as.logical(display_data$captured)
      display_data$captured_factor <- factor(display_data$captured, levels = c(TRUE, FALSE))
      p_hat <- ifelse(is.null(rv$n), 0, rv$x / rv$n)
      ggplot(display_data, aes(x = estimate, y = id, xmin = lower, xmax = upper, color = captured_factor)) +
        geom_vline(xintercept = p_hat, color = if (input$colorblind) "#D55E00" else "#dc2626", linetype = "dashed", size = 1) +
        geom_errorbarh(height = 0.5, size = 0.8) +
        geom_point(size = 2) +
        scale_color_manual(
          values = if (input$colorblind) c("TRUE" = "#0072B2", "FALSE" = "#D55E00") else c("TRUE" = "#60a5fa", "FALSE" = "#dc2626"),
          name = "Captured?",
          labels = c("Yes", "No"),
          drop = FALSE
        ) +
        labs(x = "Proportion", y = "Sample Number", title = "Confidence Intervals") +
        theme_minimal() +
        theme(legend.position = "top")
    })

    # --- CI Plot Description (Accessibility) ---
    # Provides a text description of the confidence intervals plot for screen readers
    output$ciPlot_desc_text <- renderText({
      if (nrow(rv$intervals) == 0) return("No intervals have been generated yet.")
      total_intervals <- nrow(rv$intervals)
      num_captured <- sum(rv$intervals$captured)
      percent_captured <- if (total_intervals > 0) round((num_captured / total_intervals) * 100, 1) else 0
      last_int <- tail(rv$intervals, 1)
      last_est <- round(as.numeric(last_int$estimate), input$round_digits)
      last_lower <- round(as.numeric(last_int$lower), input$round_digits)
      last_upper <- round(as.numeric(last_int$upper), input$round_digits)
      last_captured <- ifelse(as.logical(last_int$captured), "did capture", "did not capture")
      p_hat <- ifelse(is.null(rv$n), 0, rv$x / rv$n)
      paste(
        "A plot of confidence intervals.",
        sprintf("A dashed vertical line shows the observed proportion of %.2f.", p_hat),
        sprintf("So far, %d intervals have been generated.", total_intervals),
        sprintf("%d of them (%.1f%%) captured the observed proportion.", num_captured, percent_captured),
        sprintf("The most recent interval was centered at %.2f, with a range from %.2f to %.2f.", last_est, last_lower, last_upper),
        sprintf("This interval %s the observed proportion.", last_captured),
        collapse = " "
      )
    })

    # --- Simulation Summary ---
    # Displays summary statistics for the simulation
    output$summaryStats <- renderPrint({
      total_intervals <- nrow(rv$intervals)
      conf_level_pct <- paste0(input$conf_level, "%")
      cat("Confidence Level:", conf_level_pct, "\n\n")
      if (total_intervals == 0) {
        cat("No intervals generated yet.\n")
        return()
      }
      num_captured <- sum(rv$intervals$captured)
      percent_captured <- (num_captured / total_intervals) * 100
      cat("Total Intervals Generated:", total_intervals, "\n")
      cat("Number Capturing Observed Proportion:", num_captured, "\n")
      cat("Percent Captured:", sprintf("%.1f%%", percent_captured), "\n\n")
      cat("--- Last Interval Details ---\n")
      last_int <- tail(rv$intervals, 1)
      est <- round(as.numeric(last_int$estimate), input$round_digits)
      lower <- round(as.numeric(last_int$lower), input$round_digits)
      upper <- round(as.numeric(last_int$upper), input$round_digits)
      captured <- ifelse(as.logical(last_int$captured), "Yes", "No")
      cat("Sample Proportion:", est, "\n")
      cat(conf_level_pct, "CI: (", lower, ", ", upper, ")\n")
      cat("Captured Observed Proportion?", captured, "\n")
      cat("Large Counts Condition:", ifelse(last_int$condition_check, "Met", "Not Met"), "\n")
    })

    # --- Export/Download Handlers ---
    # Allows users to download intervals and last sample as CSV files
    output$download_intervals <- downloadHandler(
      filename = function() {
        paste("confidence_intervals_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$intervals, file, row.names = FALSE)
      }
    )
    output$download_sample <- downloadHandler(
      filename = function() {
        paste("last_sample_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(data.frame(value = rv$last_sample), file, row.names = FALSE)
      }
    )
  })
}
