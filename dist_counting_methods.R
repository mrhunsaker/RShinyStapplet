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
# Stapplet Applet - Counting Methods (Combinatorics)
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
library(shiny) # For building interactive web applications
library(DT) # For interactive tables
library(shinyjs) # For JavaScript integration in Shiny

# --- UI Definition for Counting Methods Calculator & Simulator ---
# This function builds the user interface for the module, allowing users to:
# - Select a counting method (permutations, combinations, arrangements, multinomial)
# - Input relevant parameters for each method
# - Simulate arrangements/combinations/assignments
# - View results, download outputs, and adjust preferences
dist_counting_methods_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Counting Methods Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Counting Methods Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "Counting Methods Calculator & Simulator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Counting Method", id = ns("methodHeading")),
        # --- Counting method selection ---
        selectInput(
          ns("method"), "Choose a counting method:",
          choices = c(
            "Permutations (no replacement)" = "perm",
            "Combinations (no replacement)" = "comb",
            "Arrangements (with replacement)" = "arrange_rep",
            "Multinomial" = "multinomial"
          ),
          selected = "perm"
        ),
        # --- Inputs for permutations and combinations ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'perm' || input['%s'] == 'comb'", ns("method"), ns("method")),
          ns = ns,
          div(
            tags$label("Total number of items (n):", `for` = ns("n")),
            numericInput(ns("n"), NULL, value = 10, min = 0, step = 1),
            tags$label("Number of items to choose (k):", `for` = ns("k")),
            numericInput(ns("k"), NULL, value = 3, min = 0, step = 1)
          )
        ),
        # --- Inputs for arrangements with replacement ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'arrange_rep'", ns("method")),
          ns = ns,
          div(
            tags$label("Number of types (n):", `for` = ns("n_rep")),
            numericInput(ns("n_rep"), NULL, value = 5, min = 0, step = 1),
            tags$label("Number of slots (k):", `for` = ns("k_rep")),
            numericInput(ns("k_rep"), NULL, value = 3, min = 0, step = 1)
          )
        ),
        # --- Inputs for multinomial method ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'multinomial'", ns("method")),
          ns = ns,
          div(
            tags$label("Total number of items (n):", `for` = ns("n_multi")),
            numericInput(ns("n_multi"), NULL, value = 6, min = 0, step = 1),
            tags$label("Number of categories:", `for` = ns("num_cat")),
            numericInput(ns("num_cat"), NULL, value = 3, min = 2, max = 10, step = 1),
            uiOutput(ns("multi_counts_ui"))
          )
        ),
        hr(role = "separator"),
        # --- Simulation controls ---
        h4("Simulation Controls"),
        div(
          tags$label("Number of simulations:", id = ns("num_sim_label")),
          numericInput(ns("num_sim"), NULL, value = 1, min = 1, max = 500, step = 1),
          actionButton(ns("simulate"), "Simulate", class = "btn-primary", style = "width: 100%;"),
          actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        # --- Download options ---
        h4("Export/Download"),
        downloadButton(ns("download_results"), "Download Results (CSV)", class = "btn-success"),
        hr(role = "separator"),
        # --- Preferences for display ---
        h4("Preferences"),
        checkboxInput(ns("show_formula"), "Show formulas", value = TRUE),
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 6, value = 0)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h4("Calculation Result", id = ns("resultHeading")),
              uiOutput(ns("resultText"))
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h4("Simulation Results", id = ns("simulationHeading")),
              DTOutput(ns("simulationTable"))
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h4("Error/Warning Messages", id = ns("errorHeading")),
              uiOutput(ns("errorMsg"))
            )
          )
        )
      )
    )
  )
}

# --- Server Logic for Counting Methods Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_counting_methods_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    # Stores error messages and simulation results
    rv <- reactiveValues(
      error = NULL,
      simulation = data.frame()
    )

    # --- Multinomial Dynamic UI ---
    # Renders input fields for each category count in multinomial method
    output$multi_counts_ui <- renderUI({
      num_cat <- input$num_cat
      n_multi <- input$n_multi
      if (is.null(num_cat) || num_cat < 2 || is.null(n_multi)) {
        return(NULL)
      }
      lapply(seq_len(num_cat), function(i) {
        numericInput(ns(paste0("multi_count_", i)), paste0("Count for category ", i, ":"), value = floor(n_multi / num_cat), min = 0, max = n_multi, step = 1)
      })
    })

    # --- Error/Warning Messaging ---
    # Displays error messages for invalid input or simulation
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Calculation Result ---
    # Calculates and displays result for selected counting method
    output$resultText <- renderUI({
      method <- input$method
      digits <- input$round_digits
      show_formula <- input$show_formula

      # Permutations
      if (method == "perm") {
        n <- input$n
        k <- input$k
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
          rv$error <- "Please enter non-negative integers for n and k."
          return(NULL)
        }
        if (k > n) {
          rv$error <- "k cannot be greater than n."
          return(NULL)
        }
        result <- choose(n, k) * factorial(k)
        rv$error <- NULL
        formula <- "P(n, k) = n! / (n - k)!"
        tagList(
          if (show_formula) p(strong("Formula:"), formula),
          p(paste0("P(", n, ", ", k, ") = ", format(round(result, digits), scientific = FALSE, big.mark = ",")))
        )
      }
      # Combinations
      else if (method == "comb") {
        n <- input$n
        k <- input$k
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
          rv$error <- "Please enter non-negative integers for n and k."
          return(NULL)
        }
        if (k > n) {
          rv$error <- "k cannot be greater than n."
          return(NULL)
        }
        result <- choose(n, k)
        rv$error <- NULL
        formula <- "C(n, k) = n! / (k! * (n - k)!)"
        tagList(
          if (show_formula) p(strong("Formula:"), formula),
          p(paste0("C(", n, ", ", k, ") = ", format(round(result, digits), scientific = FALSE, big.mark = ",")))
        )
      }
      # Arrangements with replacement
      else if (method == "arrange_rep") {
        n <- input$n_rep
        k <- input$k_rep
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
          rv$error <- "Please enter non-negative integers for n and k."
          return(NULL)
        }
        result <- n^k
        rv$error <- NULL
        formula <- "A(n, k) = n^k"
        tagList(
          if (show_formula) p(strong("Formula:"), formula),
          p(paste0("A(", n, ", ", k, ") = ", format(round(result, digits), scientific = FALSE, big.mark = ",")))
        )
      }
      # Multinomial
      else if (method == "multinomial") {
        n <- input$n_multi
        num_cat <- input$num_cat
        counts <- sapply(seq_len(num_cat), function(i) input[[paste0("multi_count_", i)]])
        if (is.null(n) || is.null(num_cat) || length(counts) == 0) {
          # Don't show error until user enters data
          return(NULL)
        }
        if (any(is.na(counts)) || any(counts < 0) || sum(counts) != n) {
          rv$error <- "Counts must be non-negative and sum to n."
          return(NULL)
        }
        result <- factorial(n) / prod(sapply(counts, factorial))
        rv$error <- NULL
        formula <- "M(n; k1, ..., kr) = n! / (k1! * ... * kr!)"
        tagList(
          if (show_formula) p(strong("Formula:"), formula),
          p(paste0("M(", n, "; ", paste(counts, collapse = ", "), ") = ", format(round(result, digits), scientific = FALSE, big.mark = ",")))
        )
      } else {
        rv$error <- "Unknown method."
        return(NULL)
      }
    })

    # --- Simulation ---
    # Simulates arrangements, combinations, or assignments for the selected method
    observeEvent(input$simulate, {
      method <- input$method
      num_sim <- input$num_sim
      digits <- input$round_digits
      sim_results <- NULL

      # Permutations
      if (method == "perm") {
        n <- input$n
        k <- input$k
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k || k > n) {
          rv$error <- "Please enter valid n and k for permutations."
          rv$simulation <- data.frame()
          return()
        }
        # Simulate: randomly select k items from n, show arrangement
        sim_results <- data.frame(
          Simulation = seq_len(num_sim),
          Arrangement = sapply(seq_len(num_sim), function(i) paste(sample(seq_len(n), k), collapse = ", "))
        )
      }
      # Combinations
      else if (method == "comb") {
        n <- input$n
        k <- input$k
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k || k > n) {
          rv$error <- "Please enter valid n and k for combinations."
          rv$simulation <- data.frame()
          return()
        }
        # Simulate: randomly select k items from n, show combination (sorted)
        sim_results <- data.frame(
          Simulation = seq_len(num_sim),
          Combination = sapply(seq_len(num_sim), function(i) paste(sort(sample(seq_len(n), k)), collapse = ", "))
        )
      }
      # Arrangements with replacement
      else if (method == "arrange_rep") {
        n <- input$n_rep
        k <- input$k_rep
        if (is.na(n) || is.na(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
          rv$error <- "Please enter valid n and k for arrangements with replacement."
          rv$simulation <- data.frame()
          return()
        }
        # Simulate: randomly select k items from n, with replacement
        sim_results <- data.frame(
          Simulation = seq_len(num_sim),
          Arrangement = sapply(seq_len(num_sim), function(i) paste(sample(seq_len(n), k, replace = TRUE), collapse = ", "))
        )
      }
      # Multinomial
      else if (method == "multinomial") {
        n <- input$n_multi
        num_cat <- input$num_cat
        counts <- sapply(seq_len(num_cat), function(i) input[[paste0("multi_count_", i)]])
        if (is.null(n) || is.null(num_cat) || length(counts) == 0) {
          # Don't show error until user enters data
          return()
        }
        if (any(is.na(counts)) || any(counts < 0) || sum(counts) != n) {
          rv$error <- "Counts must be non-negative and sum to n."
          rv$simulation <- data.frame()
          return()
        }
        # Simulate: randomly assign n items to categories according to counts
        sim_results <- data.frame(
          Simulation = seq_len(num_sim),
          Assignment = sapply(seq_len(num_sim), function(i) {
            items <- rep(seq_len(num_cat), times = counts)
            paste(sample(items), collapse = ", ")
          })
        )
      } else {
        rv$error <- "Unknown method."
        rv$simulation <- data.frame()
        return()
      }
      rv$error <- NULL
      rv$simulation <- sim_results
    })

    # --- Reset simulation results ---
    observeEvent(input$reset, {
      rv$error <- NULL
      rv$simulation <- data.frame()
    })

    # --- Simulation Table ---
    # Displays simulated results in a table
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) {
        return(NULL)
      }
      datatable(rv$simulation, rownames = FALSE, options = list(pageLength = 10, dom = "tip"))
    })

    # --- Export/Download Handler ---
    # Allows users to download simulation results or calculation result as CSV
    output$download_results <- downloadHandler(
      filename = function() {
        paste("counting_methods_results_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        if (nrow(rv$simulation) > 0) {
          write.csv(rv$simulation, file, row.names = FALSE)
        } else {
          # Output calculation result only
          method <- input$method
          digits <- input$round_digits
          result <- NULL
          if (method == "perm") {
            n <- input$n
            k <- input$k
            result <- choose(n, k) * factorial(k)
            write.csv(data.frame(Method = "Permutations", n = n, k = k, Result = round(result, digits)), file, row.names = FALSE)
          } else if (method == "comb") {
            n <- input$n
            k <- input$k
            result <- choose(n, k)
            write.csv(data.frame(Method = "Combinations", n = n, k = k, Result = round(result, digits)), file, row.names = FALSE)
          } else if (method == "arrange_rep") {
            n <- input$n_rep
            k <- input$k_rep
            result <- n^k
            write.csv(data.frame(Method = "Arrangements with Replacement", n = n, k = k, Result = round(result, digits)), file, row.names = FALSE)
          } else if (method == "multinomial") {
            n <- input$n_multi
            num_cat <- input$num_cat
            counts <- sapply(seq_len(num_cat), function(i) input[[paste0("multi_count_", i)]])
            result <- factorial(n) / prod(sapply(counts, factorial))
            write.csv(data.frame(Method = "Multinomial", n = n, Counts = paste(counts, collapse = ","), Result = round(result, digits)), file, row.names = FALSE)
          }
        }
      }
    )
  })
}
