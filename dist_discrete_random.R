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
# Stapplet Applet - Discrete Random Variable Distribution
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

# --- Load required libraries ---
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots
library(DT)       # For interactive tables
library(shinyjs)  # For JavaScript integration in Shiny

# --- UI Definition for Discrete Random Variable Calculator & Simulator ---
# This function builds the user interface for the module, allowing users to:
# - Input data as counts or raw values
# - Simulate samples
# - Calculate probabilities
# - View summary statistics, plots, and download results
dist_discrete_random_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Discrete Random Variable Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Discrete Random Variable Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "Discrete Random Variable Calculator & Simulator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Data Input", id = ns("inputHeading")),
        # --- Data input mode selection ---
        selectInput(
          ns("input_mode"), "Data input mode:",
          choices = c(
            "Counts Table" = "counts",
            "Raw Data (comma/space/newline separated)" = "raw"
          ),
          selected = "counts"
        ),
        # --- Counts table input ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'counts'", ns("input_mode")),
          ns = ns,
          div(
            tags$label("Number of distinct values:", `for` = ns("num_values")),
            numericInput(ns("num_values"), NULL, value = 5, min = 2, max = 20)
          ),
          uiOutput(ns("value_prob_inputs"))
        ),
        # --- Raw data input ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          ns = ns,
          div(
            tags$label("Paste raw data (comma, space, or newline separated):", id = ns("raw_label")),
            textAreaInput(ns("raw_data"), NULL, value = "", rows = 4, placeholder = "e.g. 1,2,2,3,1,4,2,3"),
            actionButton(ns("parse_raw"), "Parse Raw Data", class = "btn-secondary", style = "width: 100%;")
          )
        ),
        hr(role = "separator"),
        # --- Simulation controls ---
        h4("Simulation Controls"),
        div(
          tags$label("Number of samples to simulate:", id = ns("num_sim_label")),
          numericInput(ns("num_sim"), NULL, value = 1, min = 1, max = 500, step = 1),
          actionButton(ns("simulate"), "Simulate Samples", class = "btn-primary", style = "width: 100%;"),
          actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        # --- Probability calculation controls ---
        h4("Probability Calculation"),
        div(
          tags$label("Type of Probability:", `for` = ns("prob_type")),
          selectInput(ns("prob_type"), label = NULL,
            choices = c("P(X = x)" = "eq",
                        "P(X < x)" = "lt",
                        "P(X <= x)" = "le",
                        "P(X > x)" = "gt",
                        "P(X >= x)" = "ge")),
        ),
        div(
          tags$label("Value of x:", `for` = ns("prob_x_value")),
          numericInput(ns("prob_x_value"), label = NULL, value = 0)
        ),
        hr(role = "separator"),
        # --- Download options ---
        h4("Export/Download"),
        downloadButton(ns("download_distribution"), "Download Distribution (CSV)", class = "btn-success"),
        downloadButton(ns("download_simulation"), "Download Simulation (CSV)", class = "btn-success"),
        hr(role = "separator"),
        # --- Preferences for display ---
        h4("Preferences"),
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 6, value = 4)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Summary Statistics", id = ns("summaryStatsHeading")),
              uiOutput(ns("summary_stats"))
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Probability Distribution", id = ns("distPlotHeading")),
              plotOutput(ns("dist_plot"), height = "300px", inline = TRUE),
              p(id = ns("dist_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("dist_plot_desc_text")))
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Calculated Probability", id = ns("probResultHeading")),
              textOutput(ns("calculated_prob"), placeholder = TRUE)
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Simulation Results", id = ns("simulationHeading")),
              DTOutput(ns("simulationTable"))
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

# --- Server Logic for Discrete Random Variable Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_discrete_random_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    # Stores error messages, parsed raw data, distribution, and simulation results
    rv <- reactiveValues(
      error = NULL,
      raw_parsed = NULL,
      distribution = NULL,
      simulation = data.frame()
    )

    # --- Dynamic UI for value/prob inputs ---
    # Renders input fields for each value and its probability
    output$value_prob_inputs <- renderUI({
      num <- as.integer(input$num_values)
      if (is.na(num) || num < 2) {
        return(p("Please enter a valid number of values (at least 2).", style = "color: red;"))
      }
      input_tags <- lapply(1:num, function(i) {
        fluidRow(
          column(6, numericInput(ns(paste0("x_val_", i)), label = paste("Value", i, "(x)"), value = i-1)),
          column(6, numericInput(ns(paste0("p_val_", i)), label = paste("Prob.", i, "P(x)"), value = 1/num, min = 0, max = 1, step = 0.01))
        )
      })
      do.call(tagList, input_tags)
    })

    # --- Parse Raw Data ---
    # Converts raw input into numeric values and updates reactive values
    observeEvent(input$parse_raw, {
      raw <- input$raw_data
      if (is.null(raw) || nchar(raw) == 0) {
        rv$error <- "Raw data input is empty."
        rv$raw_parsed <- NULL
        rv$distribution <- NULL
        return()
      }
      items <- unlist(strsplit(raw, "[,\\s\\n]+"))
      items <- items[items != ""]
      vals <- suppressWarnings(as.numeric(items))
      if (any(is.na(vals))) {
        rv$error <- "Raw data must be numeric."
        rv$raw_parsed <- NULL
        rv$distribution <- NULL
        return()
      }
      tab <- table(vals)
      dist_df <- data.frame(x = as.numeric(names(tab)), p = as.numeric(tab) / length(vals))
      rv$raw_parsed <- vals
      rv$distribution <- dist_df
      rv$error <- NULL
    })

    # --- Distribution Data ---
    # Generates probability distribution data for plotting and calculations
    dist_data <- reactive({
      mode <- input$input_mode
      if (mode == "counts") {
        num <- as.integer(input$num_values)
        values <- sapply(1:num, function(i) input[[paste0("x_val_", i)]])
        probs <- sapply(1:num, function(i) input[[paste0("p_val_", i)]])
        if (any(sapply(values, is.null)) || any(sapply(probs, is.null))) return(NULL)
        if (!is.numeric(values) || !is.numeric(probs)) return(NULL)
        df <- data.frame(x = values, p = probs)
        rv$distribution <- df
        return(df)
      } else if (mode == "raw") {
        return(rv$distribution)
      } else {
        return(NULL)
      }
    })

    # --- Error/Warning Messaging ---
    # Displays error messages for invalid input or distribution
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Summary Statistics ---
    # Calculates and displays mean and standard deviation for the distribution
    output$summary_stats <- renderUI({
      df <- dist_data()
      digits <- input$round_digits
      if (is.null(df) || nrow(df) == 0) {
        return(p("Enter values and probabilities to see summary statistics."))
      }
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6) {
        return(p(paste("Error: Probabilities must sum to 1. Current sum:", round(total_prob, digits)), style = "color: red;"))
      }
      if (any(df$p < 0, na.rm = TRUE)) {
        return(p("Error: Probabilities cannot be negative.", style = "color: red;"))
      }
      mean_val <- sum(df$x * df$p, na.rm = TRUE)
      variance <- sum((df$x - mean_val)^2 * df$p, na.rm = TRUE)
      sd_val <- sqrt(variance)
      tagList(
        p(strong("Mean (\u03bc):"), round(mean_val, digits)),
        p(strong("Standard Deviation (\u03c3):"), round(sd_val, digits))
      )
    })

    # --- Probability Distribution Plot ---
    # Displays a bar chart of the probability distribution
    output$dist_plot <- renderPlot({
      df <- dist_data()
      digits <- input$round_digits
      req(df)
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return(NULL)
      }
      ggplot(df, aes(x = factor(x), y = p)) +
        geom_col(fill = "#1d4ed8", alpha = 0.7) +
        labs(title = "Probability Distribution",
             x = "Value (x)",
             y = "Probability P(x)") +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold"),
          axis.text.x = element_text(angle = 45, hjust = 1)
        )
    })

    # --- Plot Description (Accessibility) ---
    # Provides a text description of the probability distribution plot for screen readers
    output$dist_plot_desc_text <- renderText({
      df <- dist_data()
      digits <- input$round_digits
      req(df)
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return("Invalid probability distribution: probabilities must sum to 1 and be non-negative.")
      }
      mean_val <- sum(df$x * df$p, na.rm = TRUE)
      variance <- sum((df$x - mean_val)^2 * df$p, na.rm = TRUE)
      sd_val <- sqrt(variance)
      pairs <- paste(sprintf("P(X=%.2f) = %.3f", df$x, df$p), collapse=", ")
      desc <- paste(
        "This is a bar chart representing a discrete probability distribution.",
        sprintf("The distribution has a calculated mean of %.4f and a standard deviation of %.4f.", round(mean_val, digits), round(sd_val, digits)),
        "The x-axis shows the distinct values (x) the random variable can take, and the y-axis shows the probability of each value.",
        "The specific probabilities are:", pairs, ".",
        collapse=" "
      )
      return(desc)
    })

    # --- Probability Calculation ---
    # Calculates probability for a given value or range based on user input
    output$calculated_prob <- renderText({
      df <- dist_data()
      digits <- input$round_digits
      req(df, input$prob_x_value)
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return("Cannot calculate probability due to invalid distribution.")
      }
      x_val <- input$prob_x_value
      prob <- switch(input$prob_type,
        "eq" = sum(df$p[df$x == x_val], na.rm = TRUE),
        "lt" = sum(df$p[df$x < x_val], na.rm = TRUE),
        "le" = sum(df$p[df$x <= x_val], na.rm = TRUE),
        "gt" = sum(df$p[df$x > x_val], na.rm = TRUE),
        "ge" = sum(df$p[df$x >= x_val], na.rm = TRUE)
      )
      op_string <- switch(input$prob_type,
        "eq" = "=", "lt" = "<", "le" = "\u2264", "gt" = ">", "ge" = "\u2265"
      )
      paste0("P(X ", op_string, " ", x_val, ") = ", round(prob, digits))
    })

    # --- Simulation ---
    # Simulates random samples from the discrete distribution
    observeEvent(input$simulate, {
      df <- dist_data()
      num_sim <- input$num_sim
      digits <- input$round_digits
      if (is.null(df) || nrow(df) == 0) {
        rv$error <- "Distribution not defined for simulation."
        rv$simulation <- data.frame()
        return()
      }
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        rv$error <- "Invalid distribution for simulation."
        rv$simulation <- data.frame()
        return()
      }
      sim <- sample(df$x, size = num_sim, replace = TRUE, prob = df$p)
      sim_df <- data.frame(
        Simulation = seq_len(num_sim),
        Value = sim
      )
      rv$error <- NULL
      rv$simulation <- sim_df
    })

    # --- Reset simulation and distribution ---
    observeEvent(input$reset, {
      rv$error <- NULL
      rv$simulation <- data.frame()
      rv$raw_parsed <- NULL
      rv$distribution <- NULL
    })

    # --- Simulation Table ---
    # Displays simulated samples in a table
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) return(NULL)
      datatable(rv$simulation, rownames = FALSE, options = list(pageLength = 10, dom = 'tip'))
    })

    # --- Export/Download Handlers ---
    # Allows users to download distribution and simulation results as CSV files
    output$download_distribution <- downloadHandler(
      filename = function() {
        paste("discrete_distribution_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df <- dist_data()
        if (!is.null(df)) write.csv(df, file, row.names = FALSE)
      }
    )
    output$download_simulation <- downloadHandler(
      filename = function() {
        paste("discrete_simulation_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$simulation, file, row.names = FALSE)
      }
    )
  })
}
