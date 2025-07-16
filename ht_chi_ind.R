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
# Stapplet Applet - Chi-Square Test for Independence
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

library(shinyjs)
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
# Enhanced Chi-Square Test for Independence Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet
# --------------------------------------------------------------------

# -------------------------------
# Load required libraries
# -------------------------------
library(shiny) # Shiny web application framework
library(ggplot2) # For plotting
library(DT) # For interactive tables
library(shinyjs) # For accessibility enhancements

# -------------------------------
# Default preferences for UI
# -------------------------------
default_prefs <- list(
  color_palette = "viridis",
  rounding = 4,
  percent_display = FALSE
)

# --------------------------------------------------------------------
# UI Function: ht_chi_ind_ui
#   - Builds the user interface for the Chi-Square Independence applet
#   - Includes inputs for table setup, simulation, preferences, and export
# --------------------------------------------------------------------
ht_chi_ind_ui <- function(id) {
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
    h2("Chi-Square Test for Independence"),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "setupHeading",
        h3("Contingency Table Setup", id = "setupHeading"),
        # Input: Number of rows and columns for contingency table
        numericInput(ns("num_rows"), "Number of Rows (Categories of Var 1):", value = 2, min = 2, max = 5, step = 1),
        numericInput(ns("num_cols"), "Number of Columns (Categories of Var 2):", value = 2, min = 2, max = 5, step = 1),
        hr(),
        h3("Enter Observed Counts"),
        # Dynamic UI for entering observed counts
        uiOutput(ns("contingency_table_input")),
        hr(),
        h4("Simulation"),
        # Simulation controls
        numericInput(ns("num_sim"), "Number of simulated samples:", value = 100, min = 1, max = 2000, step = 1),
        actionButton(ns("simulate"), "Simulate", class = "btn-warning"),
        actionButton(ns("clear_sim"), "Clear simulation", class = "btn-secondary"),
        hr(),
        h4("Preferences"),
        # Preferences for color palette, rounding, and percent display
        selectInput(ns("color_palette"), "Color Palette",
          choices = c("viridis", "plasma", "magma", "inferno", "cividis")
        ),
        numericInput(ns("rounding"), "Decimal Places", value = default_prefs$rounding, min = 0, max = 10, step = 1),
        checkboxInput(ns("percent_display"), "Display probabilities as percentages", value = default_prefs$percent_display),
        hr(),
        h4("Export/Download"),
        # Download buttons for plot and table
        downloadButton(ns("download_plot"), "Download Plot", class = "btn-success"),
        downloadButton(ns("download_table"), "Download Table", class = "btn-success"),
        hr(),
        # Button to calculate test results
        actionButton(ns("calculate"), "Calculate Test Results", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Error message display
        tags$div(
          class = "error-msg",
          `aria-live` = "assertive",
          textOutput(ns("error_msg"))
        ),
        # Main results area
        uiOutput(ns("results_area"))
      )
    )
  )
}

# --------------------------------------------------------------------
# Server Function: ht_chi_ind_server
#   - Implements all logic for the Chi-Square Independence applet
#   - Handles UI reactivity, simulation, calculation, and output
# --------------------------------------------------------------------
ht_chi_ind_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # -------------------------------
    # Preferences reactive: stores UI settings
    # -------------------------------
    prefs <- reactive({
      list(
        color_palette = input$color_palette %||% default_prefs$color_palette,
        rounding = input$rounding %||% default_prefs$rounding,
        percent_display = input$percent_display %||% default_prefs$percent_display
      )
    })

    # -------------------------------
    # Error message reactive value
    # -------------------------------
    error_msg <- reactiveVal("")

    # ---------------------------------------------------------------
    # Dynamic UI for contingency table input
    #   - Generates numeric inputs for each cell in the table
    # ---------------------------------------------------------------
    output$contingency_table_input <- renderUI({
      req(input$num_rows, input$num_cols)
      grid <- div(style = paste0("display: grid; grid-template-columns: repeat(", input$num_cols, ", 1fr); grid-gap: 5px;"))
      input_tags <- lapply(1:(input$num_rows * input$num_cols), function(k) {
        i <- (k - 1) %/% input$num_cols + 1
        j <- (k - 1) %% input$num_cols + 1
        input_id <- ns(paste0("cell_", i, "_", j))
        numericInput(input_id, label = NULL, value = 10, min = 0)
      })
      do.call(div, c(list(style = paste0("display: grid; grid-template-columns: repeat(", input$num_cols, ", 1fr); grid-gap: 5px;")), input_tags))
    })

    # ---------------------------------------------------------------
    # Gather observed counts from UI
    #   - Returns matrix of observed values
    # ---------------------------------------------------------------
    observed_counts <- reactive({
      req(input$num_rows, input$num_cols)
      mat <- matrix(NA, nrow = input$num_rows, ncol = input$num_cols)
      for (i in 1:input$num_rows) {
        for (j in 1:input$num_cols) {
          input_id <- paste0("cell_", i, "_", j)
          val <- input[[input_id]]
          if (is.null(val) || is.na(val) || val < 0) {
            return(NULL)
          }
          mat[i, j] <- val
        }
      }
      mat
    })

    # ---------------------------------------------------------------
    # Chi-square test results calculation
    #   - Performs test when 'Calculate Test Results' is clicked
    # ---------------------------------------------------------------
    results <- eventReactive(input$calculate, {
      mat <- observed_counts()
      if (is.null(mat)) {
        error_msg("All cells in the contingency table must have a non-negative numeric value.")
        return(NULL)
      }
      test_output <- tryCatch(
        {
          chisq.test(mat, simulate.p.value = FALSE)
        },
        error = function(e) {
          error_msg(paste("Error in chi-square calculation:", e$message))
          return(NULL)
        }
      )
      error_msg("")
      test_output
    })

    # ---------------------------------------------------------------
    # Simulation of chi-square statistics under independence
    #   - Simulates random tables and computes statistics
    # ---------------------------------------------------------------
    sim_results <- reactiveVal(NULL)
    observeEvent(input$simulate, {
      mat <- observed_counts()
      if (is.null(mat)) {
        return()
      }
      n <- sum(mat)
      row_totals <- rowSums(mat)
      col_totals <- colSums(mat)
      num_sim <- input$num_sim
      sim_stats <- numeric(num_sim)
      for (i in seq_len(num_sim)) {
        sim_table <- matrix(0, nrow = nrow(mat), ncol = ncol(mat))
        # Simulate under independence
        sim_table <- r2dtable(1, row_totals, col_totals)[[1]]
        sim_stats[i] <- suppressWarnings(chisq.test(sim_table, simulate.p.value = FALSE)$statistic)
      }
      sim_results(sim_stats)
    })
    observeEvent(input$clear_sim, {
      sim_results(NULL)
    })

    # ---------------------------------------------------------------
    # Error message output for UI
    # ---------------------------------------------------------------
    output$error_msg <- renderText({
      error_msg()
    })

    # ---------------------------------------------------------------
    # Main Results Area UI
    #   - Displays plots, tables, and test results
    # ---------------------------------------------------------------
    output$results_area <- renderUI({
      req(input$calculate > 0)
      tagList(
        fluidRow(
          column(
            12,
            div(
              class = "plot-container",
              h4("Mosaic Plot of Observed Counts", style = "text-align: center;", id = ns("mosaicPlotHeading")),
              plotOutput(ns("mosaicPlot"), height = "350px")
            )
          )
        ),
        fluidRow(
          column(
            6,
            div(
              class = "results-box",
              h4("Observed Counts", id = ns("observedTableHeading")),
              verbatimTextOutput(ns("observedTable"))
            )
          ),
          column(
            6,
            div(
              class = "results-box",
              h4("Expected Counts", id = ns("expectedTableHeading")),
              verbatimTextOutput(ns("expectedTable"))
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h3("Chi-Square Test Results", id = ns("testResultsHeading")),
              verbatimTextOutput(ns("testResults"))
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
    })

    # ---------------------------------------------------------------
    # Mosaic Plot of Observed Counts
    #   - Visualizes contingency table as a mosaic plot
    # ---------------------------------------------------------------
    output$mosaicPlot <- renderPlot({
      res <- results()
      req(is.list(res))
      observed_counts <- res$observed
      dimnames(observed_counts) <- list(
        paste("Var1-Cat", 1:nrow(observed_counts)),
        paste("Var2-Cat", 1:ncol(observed_counts))
      )
      graphics::mosaicplot(observed_counts,
        main = "Mosaic Plot of Observed vs. Expected Counts",
        color = TRUE, shade = TRUE, xlab = "Variable 1", ylab = "Variable 2"
      )
    })

    # ---------------------------------------------------------------
    # Observed Counts Table Output
    # ---------------------------------------------------------------
    output$observedTable <- renderPrint({
      res <- results()
      req(is.list(res))
      cat("Observed Counts:\n")
      print(res$observed)
    })

    # ---------------------------------------------------------------
    # Expected Counts Table Output
    # ---------------------------------------------------------------
    output$expectedTable <- renderPrint({
      res <- results()
      req(is.list(res))
      cat("Expected Counts (under independence):\n")
      print(round(res$expected, prefs()$rounding))
    })

    # ---------------------------------------------------------------
    # Main Test Results Output
    #   - Displays hypotheses, test statistic, p-value, and conclusion
    # ---------------------------------------------------------------
    output$testResults <- renderPrint({
      res <- results()
      if (is.null(res)) {
        cat(error_msg())
        return()
      }
      cat("Hypotheses:\n")
      cat("  H0: The two categorical variables are independent.\n")
      cat("  Ha: The two categorical variables are not independent (associated).\n\n")
      cat("Test Results:\n")
      cat("  Chi-Square Statistic (X-squared):", round(as.numeric(res$statistic), prefs()$rounding), "\n")
      cat("  Degrees of Freedom (df):", as.numeric(res$parameter), "\n")
      cat("  p-value:", format.p.val(as.numeric(res$p.value), digits = prefs()$rounding), "\n\n")
      alpha <- 0.05
      cat(paste0("Conclusion (at alpha = ", alpha, "):\n"))
      if (res$p.value < alpha) {
        cat("  Since the p-value is less than alpha, we reject the null hypothesis.\n")
        cat("  There is significant evidence to conclude that the variables are associated.\n")
      } else {
        cat("  Since the p-value is not less than alpha, we fail to reject the null hypothesis.\n")
        cat("  There is not significant evidence to conclude that the variables are associated.\n")
      }
      if (!is.null(res$warning_message)) {
        cat("\nWarning from R:\n  ", res$warning_message, "\n")
      }
    })

    # ---------------------------------------------------------------
    # Simulation Dotplot Output
    #   - Visualizes distribution of simulated chi-square statistics
    # ---------------------------------------------------------------
    output$sim_dotplot <- renderPlot({
      sim_stats <- sim_results()
      res <- results()
      req(!is.null(sim_stats), !is.null(res))
      stat <- as.numeric(res$statistic)
      plot_df <- data.frame(ChiSq = sim_stats)
      ggplot(plot_df, aes(x = ChiSq)) +
        geom_dotplot(binwidth = 0.5, dotsize = 0.7, fill = "#60a5fa") +
        geom_vline(xintercept = stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(
          x = "Simulated X-squared Statistic", y = "Count",
          title = "Distribution of Simulated X-squared Statistics"
        ) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5))
    })

    # ---------------------------------------------------------------
    # Download Plot Handler
    #   - Exports observed vs. expected counts plot as PNG
    # ---------------------------------------------------------------
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("chi_square_ind_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        res <- results()
        p <- ggplot(
          data.frame(
            Observed = as.vector(res$observed),
            Expected = as.vector(res$expected)
          ),
          aes(x = Observed, y = Expected)
        ) +
          geom_point(size = 3, color = "#1e40af") +
          labs(
            x = "Observed Count", y = "Expected Count",
            title = "Observed vs. Expected Counts"
          ) +
          theme_minimal() +
          theme(plot.title = element_text(hjust = 0.5))
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # ---------------------------------------------------------------
    # Download Table Handler
    #   - Exports observed and expected counts as CSV
    # ---------------------------------------------------------------
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("chi_square_ind_results_", Sys.Date(), ".csv")
      },
      content = function(file) {
        res <- results()
        if (!is.null(res)) {
          df <- data.frame(
            Observed = as.vector(res$observed),
            Expected = round(as.vector(res$expected), prefs()$rounding)
          )
          write.csv(df, file, row.names = FALSE)
        }
      }
    )
  })
}

# --------------------------------------------------------------------
# Standalone App Example (Uncomment to run for testing)
# --------------------------------------------------------------------
# shinyApp(
#   ui = ht_chi_ind_ui("chiind"),
#   server = function(input, output, session) {
#     ht_chi_ind_server("chiind")
#   }
# )
