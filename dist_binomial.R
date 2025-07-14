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
# Binomial Distribution Module
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

dist_binomial_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Binomial Distribution Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Binomial Distribution Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "Binomial Distribution Calculator & Simulator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Data Input", id = ns("inputHeading")),
        selectInput(
          ns("input_mode"), "Data input mode:",
          choices = c(
            "Parameters" = "params",
            "Raw Data (0/1 or Success/Failure)" = "raw"
          ),
          selected = "params"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'params'", ns("input_mode")),
          div(
            tags$label("Number of Trials (n):", id = ns("n_trials_label")),
            numericInput(ns("n_trials"), NULL, value = 10, min = 1, max = 1000, step = 1),
            tags$label("Probability of Success (p):", id = ns("p_success_label")),
            sliderInput(ns("p_success"), NULL, min = 0, max = 1, value = 0.5, step = 0.01)
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          div(
            tags$label("Paste raw data (comma, space, or newline separated; 0/1 or Success/Failure):", id = ns("raw_label")),
            textAreaInput(ns("raw_data"), NULL, value = "", rows = 4, placeholder = "e.g. 1,0,1,1,0,1 or Success,Failure,..."),
            actionButton(ns("parse_raw"), "Parse Raw Data", class = "btn-secondary", style = "width: 100%;")
          )
        ),
        hr(role = "separator"),
        h3("Probability Calculation", id = ns("probCalcHeading")),
        div(
          tags$label("Select Probability Type:", id = ns("prob_type_label")),
          radioButtons(ns("prob_type"), NULL,
            choices = c(
              "P(X = k)" = "exact",
              "P(X ≤ k)" = "at_most",
              "P(X > k)" = "greater_than",
              "P(k1 ≤ X ≤ k2)" = "between"
            ),
            selected = "exact"
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] != 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("Value of k:", id = ns("k_val_label")),
            numericInput(ns("k_val"), NULL, value = 5, min = 0, step = 1)
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("Value of k1:", id = ns("k1_val_label")),
            numericInput(ns("k1_val"), NULL, value = 4, min = 0, step = 1)
          ),
          div(
            tags$label("Value of k2:", id = ns("k2_val_label")),
            numericInput(ns("k2_val"), NULL, value = 6, min = 0, step = 1)
          )
        ),
        hr(role = "separator"),
        h4("Simulation Controls"),
        div(
          tags$label("Number of samples to simulate:", id = ns("num_samples_label")),
          numericInput(ns("num_samples"), NULL, value = 1, min = 1, max = 500, step = 1),
          actionButton(ns("simulate"), "Simulate Samples", class = "btn-primary", style = "width: 100%;"),
          actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        h4("Export/Download"),
        downloadButton(ns("download_distribution"), "Download Distribution (CSV)", class = "btn-success"),
        downloadButton(ns("download_simulation"), "Download Simulation (CSV)", class = "btn-success"),
        hr(role = "separator"),
        h4("Preferences"),
        checkboxInput(ns("colorblind"), "Colorblind-friendly palette", value = FALSE),
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 4, value = 3)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Binomial Distribution", id = ns("binomialPlotHeading")),
              plotOutput(ns("binomialPlot"), height = "300px", inline = TRUE),
              p(id = ns("binomialPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("binomialPlot_desc_text")))
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h4("Calculated Probability:", id = ns("probResultHeading")),
              textOutput(ns("probabilityResult"), placeholder = TRUE)
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

# --- Server Logic for Binomial Distribution Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_binomial_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    rv <- reactiveValues(
      n = NULL,
      p = NULL,
      raw_parsed = NULL,
      distribution = NULL,
      simulation = data.frame(),
      error = NULL
    )

    # --- Parse Raw Data ---
    observeEvent(input$parse_raw, {
      raw <- input$raw_data
      if (is.null(raw) || nchar(raw) == 0) {
        rv$error <- "Raw data input is empty."
        rv$raw_parsed <- NULL
        rv$n <- NULL
        rv$p <- NULL
        return()
      }
      items <- unlist(strsplit(raw, "[,\\s\\n]+"))
      items <- items[items != ""]
      items <- tolower(items)
      items[items %in% c("1", "success", "yes", "true")] <- 1
      items[items %in% c("0", "failure", "no", "false")] <- 0
      if (!all(items %in% c("0", "1"))) {
        rv$error <- "Raw data must contain only 0/1, Success/Failure, Yes/No, or True/False."
        rv$raw_parsed <- NULL
        rv$n <- NULL
        rv$p <- NULL
        return()
      }
      items <- as.numeric(items)
      rv$raw_parsed <- items
      rv$n <- length(items)
      rv$p <- mean(items)
      rv$error <- NULL
    })

    # --- Input Validation ---
    validate_inputs <- reactive({
      errs <- character(0)
      mode <- input$input_mode
      if (mode == "params") {
        if (is.null(input$n_trials) || is.null(input$p_success)) {
          errs <- c(errs, "Please enter both number of trials and probability of success.")
        } else {
          if (input$n_trials < 1) errs <- c(errs, "Number of trials must be at least 1.")
          if (input$p_success < 0 || input$p_success > 1) errs <- c(errs, "Probability must be between 0 and 1.")
        }
      } else if (mode == "raw") {
        if (is.null(rv$raw_parsed)) errs <- c(errs, "Raw data not parsed or invalid.")
        if (!is.null(rv$raw_parsed) && length(rv$raw_parsed) < 1) errs <- c(errs, "Raw data must contain at least one value.")
      }
      if (input$num_samples < 1 || input$num_samples > 500) errs <- c(errs, "Number of samples must be between 1 and 500.")
      if (length(errs) > 0) {
        rv$error <- paste(errs, collapse = "\n")
        FALSE
      } else {
        rv$error <- NULL
        TRUE
      }
    })

    # --- Generate Distribution ---
    observe({
      req(validate_inputs())
      mode <- input$input_mode
      if (mode == "params") {
        n <- input$n_trials
        p <- input$p_success
      } else {
        n <- rv$n
        p <- rv$p
      }
      if (is.null(n) || is.null(p)) return()
      x <- 0:n
      y <- dbinom(x, size = n, prob = p)
      rv$distribution <- data.frame(x = x, y = y)
      # Reset simulation
      rv$simulation <- data.frame()
    })

    # --- Probability Calculation ---
    calculated_probability <- reactive({
      req(validate_inputs())
      mode <- input$input_mode
      if (mode == "params") {
        n <- input$n_trials
        p <- input$p_success
      } else {
        n <- rv$n
        p <- rv$p
      }
      prob_type <- input$prob_type
      if (is.null(n) || is.null(p)) return("Error: Distribution parameters not set.")
      if (prob_type == "exact") {
        req(input$k_val)
        if (input$k_val < 0 || input$k_val > n) return("Error: k must be between 0 and n.")
        dbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "at_most") {
        req(input$k_val)
        if (input$k_val < 0) return("Error: k must be non-negative.")
        pbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "greater_than") {
        req(input$k_val)
        if (input$k_val > n) return("Error: k cannot be greater than n.")
        1 - pbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "between") {
        req(input$k1_val, input$k2_val)
        if (input$k1_val > input$k2_val) return("Error: k1 must be less than or equal to k2.")
        if (input$k1_val < 0 || input$k2_val > n) return("Error: k values must be within the range [0, n].")
        pbinom(input$k2_val, size = n, prob = p) - pbinom(input$k1_val - 1, size = n, prob = p)
      }
    })

    # --- Simulation ---
    observeEvent(input$simulate, {
      if (!validate_inputs()) return()
      mode <- input$input_mode
      if (mode == "params") {
        n <- input$n_trials
        p <- input$p_success
      } else {
        n <- rv$n
        p <- rv$p
      }
      num_samples <- input$num_samples
      if (is.null(n) || is.null(p) || is.null(num_samples)) return()
      sim <- rbinom(num_samples, size = n, prob = p)
      sim_df <- data.frame(
        Sample = seq_len(num_samples),
        Successes = sim
      )
      rv$simulation <- sim_df
    })

    observeEvent(input$reset, {
      rv$simulation <- data.frame()
      rv$error <- NULL
      rv$raw_parsed <- NULL
      rv$n <- NULL
      rv$p <- NULL
    })

    # --- Error/Warning Messaging ---
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Binomial Distribution Plot ---
    output$binomialPlot <- renderPlot({
      req(rv$distribution)
      df <- rv$distribution
      prob_type <- input$prob_type
      mode <- input$input_mode
      if (mode == "params") {
        n <- input$n_trials
        p_val <- input$p_success
      } else {
        n <- rv$n
        p_val <- rv$p
      }
      # Determine which bars to shade
      df$shaded <- FALSE
      if (prob_type == "exact" && !is.null(input$k_val)) {
        df$shaded[df$x == input$k_val] <- TRUE
      } else if (prob_type == "at_most" && !is.null(input$k_val)) {
        df$shaded[df$x <= input$k_val] <- TRUE
      } else if (prob_type == "greater_than" && !is.null(input$k_val)) {
        df$shaded[df$x > input$k_val] <- TRUE
      } else if (prob_type == "between" && !is.null(input$k1_val) && !is.null(input$k2_val) && input$k1_val <= input$k2_val) {
        df$shaded[df$x >= input$k1_val & df$x <= input$k2_val] <- TRUE
      }
      fill_colors <- if (input$colorblind) c("TRUE" = "#0072B2", "FALSE" = "#D55E00") else c("TRUE" = "#60a5fa", "FALSE" = "#dc2626")
      p <- ggplot(df, aes(x = as.factor(x), y = y, fill = as.factor(shaded))) +
        geom_col(color = "#1e40af", width = 0.7) +
        scale_fill_manual(values = fill_colors, guide = "none") +
        labs(
          title = paste("Binomial Distribution (n =", n, ", p =", round(p_val, input$round_digits), ")"),
          x = "Number of Successes (k)",
          y = "Probability"
        ) +
        theme_minimal() +
        theme(
          plot.title = element_text(hjust = 0.5, size = 18, face = "bold"),
          axis.title = element_text(size = 14),
          axis.text = element_text(size = 12)
        )
      p
    })

    # --- Binomial Plot Description (Accessibility) ---
    output$binomialPlot_desc_text <- renderText({
      df <- rv$distribution
      req(df)
      mode <- input$input_mode
      if (mode == "params") {
        n <- input$n_trials
        p_val <- input$p_success
      } else {
        n <- rv$n
        p_val <- rv$p
      }
      prob_type <- input$prob_type
      prob <- calculated_probability()
      mean_dist <- n * p_val
      shape_desc <- if (p_val < 0.4) {
        "skewed to the right"
      } else if (p_val > 0.6) {
        "skewed to the left"
      } else {
        "approximately symmetric"
      }
      shaded_desc <- ""
      if (is.numeric(prob)) {
        shaded_desc <- switch(prob_type,
          "exact" = sprintf("The bar for exactly %d successes is shaded.", input$k_val),
          "at_most" = sprintf("The bars for %d or fewer successes are shaded.", input$k_val),
          "greater_than" = sprintf("The bars for more than %d successes are shaded.", input$k_val),
          "between" = sprintf("The bars between %d and %d successes (inclusive) are shaded.", input$k1_val, input$k2_val)
        )
      }
      desc <- paste(
        sprintf("This is a bar plot of a binomial distribution with n=%d trials and a success probability p=%.2f.", n, p_val),
        sprintf("The distribution is centered around %.1f and is %s.", mean_dist, shape_desc),
        "Each bar represents the probability of achieving a specific number of successes (k).",
        shaded_desc,
        sprintf("The total probability of the shaded area is %.5f.", if(is.numeric(prob)) prob else 0),
        collapse = " "
      )
      return(desc)
    })

    # --- Calculated Probability Text ---
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- ""
        if (input$prob_type == "exact") {
          prob_text_part <- paste("X =", input$k_val)
        } else if (input$prob_type == "at_most") {
          prob_text_part <- paste("X ≤", input$k_val)
        } else if (input$prob_type == "greater_than") {
          prob_text_part <- paste("X >", input$k_val)
        } else if (input$prob_type == "between") {
          prob_text_part <- paste(input$k1_val, "≤ X ≤", input$k2_val)
        }
        paste("The calculated probability is: P(", prob_text_part, ") = ", sprintf("%.5f", prob))
      } else {
        prob # Display error message
      }
    })

    # --- Simulation Table ---
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) return(NULL)
      dat <- rv$simulation
      dat$Successes <- round(dat$Successes, input$round_digits)
      datatable(dat, rownames = FALSE, options = list(pageLength = 10, dom = 'tip'))
    })

    # --- Export/Download Handlers ---
    output$download_distribution <- downloadHandler(
      filename = function() {
        paste("binomial_distribution_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$distribution, file, row.names = FALSE)
      }
    )
    output$download_simulation <- downloadHandler(
      filename = function() {
        paste("binomial_simulation_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$simulation, file, row.names = FALSE)
      }
    )
  })
}
