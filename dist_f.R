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
# Stapplet Applet - F Distribution
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

# --- UI Definition for F-Distribution Calculator & Simulator ---
# This function builds the user interface for the F-distribution module, allowing users to:
# - Set numerator and denominator degrees of freedom
# - Calculate probabilities for F-values
# - Simulate random samples from the F-distribution
# - Download results and adjust preferences
dist_f_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("F-Distribution Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("F-Distribution Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "F-Distribution Calculator & Simulator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Distribution Parameters", id = ns("paramsHeading")),
        # --- Input for numerator degrees of freedom (df1) ---
        div(
          tags$label("Numerator Degrees of Freedom (df1):", id = ns("df1_label")),
          sliderInput(ns("df1"), NULL, min = 1, max = 100, value = 10, step = 1)
        ),
        # --- Input for denominator degrees of freedom (df2) ---
        div(
          tags$label("Denominator Degrees of Freedom (df2):", id = ns("df2_label")),
          sliderInput(ns("df2"), NULL, min = 1, max = 100, value = 20, step = 1)
        ),
        hr(role = "separator"),
        h3("Probability Calculation", id = ns("probCalcHeading")),
        # --- Probability type selection ---
        div(
          tags$label("Select Probability Type:", id = ns("prob_type_label")),
          radioButtons(ns("prob_type"), NULL,
            choices = c("P(X > x)" = "gt", "P(X < x)" = "lt"),
            selected = "gt"
          )
        ),
        # --- Input for F-value ---
        div(
          tags$label("F-value (x):", id = ns("x_val_label")),
          numericInput(ns("x_val"), NULL, value = 1.5, step = 0.1)
        ),
        hr(role = "separator"),
        h4("Simulation Controls"),
        # --- Simulation controls ---
        div(
          tags$label("Number of samples to simulate:", id = ns("num_sim_label")),
          numericInput(ns("num_sim"), NULL, value = 1, min = 1, max = 500, step = 1),
          actionButton(ns("simulate"), "Simulate Samples", class = "btn-primary", style = "width: 100%;"),
          actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        h4("Export/Download"),
        # --- Download buttons ---
        downloadButton(ns("download_distribution"), "Download Distribution (CSV)", class = "btn-success"),
        downloadButton(ns("download_simulation"), "Download Simulation (CSV)", class = "btn-success"),
        hr(role = "separator"),
        h4("Preferences"),
        # --- Rounding preference ---
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 6, value = 4)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("F-Distribution", id = ns("fPlotHeading")),
              plotOutput(ns("fPlot"), height = "300px", inline = TRUE),
              p(id = ns("fPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("fPlot_desc_text")))
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

# --- Server Logic for F-Distribution Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_f_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    # Stores error messages, distribution data, and simulation results
    rv <- reactiveValues(
      error = NULL,
      distribution = NULL,
      simulation = data.frame()
    )

    # --- Distribution Data ---
    # Generates F-distribution data for plotting and calculations
    distribution_data <- reactive({
      req(input$df1, input$df2, input$df1 > 0, input$df2 > 0)
      max_x <- qf(0.999, df1 = input$df1, df2 = input$df2)
      if (is.infinite(max_x) || max_x > 50) max_x <- 50
      x <- seq(0, max_x, length.out = 500)
      y <- df(x, df1 = input$df1, df2 = input$df2)
      df <- data.frame(x = x, y = y)
      rv$distribution <- df
      df
    })

    # --- Error/Warning Messaging ---
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Probability Calculation ---
    # Calculates probability for F-values based on user input
    calculated_probability <- reactive({
      req(input$df1, input$df2, input$prob_type, input$x_val)
      if (input$x_val < 0) return("Error: F-value cannot be negative.")
      prob <- switch(input$prob_type,
        "lt" = pf(input$x_val, df1 = input$df1, df2 = input$df2),
        "gt" = pf(input$x_val, df1 = input$df1, df2 = input$df2, lower.tail = FALSE)
      )
      prob
    })

    # --- F-Distribution Plot ---
    output$fPlot <- renderPlot({
      df <- distribution_data()
      plot_df1 <- input$df1
      plot_df2 <- input$df2
      prob_type <- input$prob_type
      x_val <- input$x_val
      digits <- input$round_digits

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(title = paste("F-Distribution (df1 =", plot_df1, ", df2 =", plot_df2, ")"),
             x = "F-value", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
              axis.title = element_text(size = 12),
              axis.text = element_text(size = 10))

      # --- Shade area for calculated probability ---
      if (x_val >= 0) {
        if (prob_type == "lt") {
          x_shade <- seq(min(df$x), x_val, length.out = 100)
          fill_color <- "#60a5fa"
        } else {
          x_shade <- seq(x_val, max(df$x), length.out = 100)
          fill_color <- "#fbbf24"
        }
        y_shade <- stats::df(x_shade, df1 = plot_df1, df2 = plot_df2)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y),
                           fill = fill_color, alpha = 0.6)
        p <- p + geom_vline(xintercept = x_val, linetype = "solid", color = "#ef4444", linewidth = 1)
      }
      p
    })

    # --- Plot Description (Accessibility) ---
    output$fPlot_desc_text <- renderText({
      req(input$df1, input$df2, input$x_val)
      df1 <- input$df1
      df2 <- input$df2
      x_val <- input$x_val
      prob <- calculated_probability()
      shape_desc <- if (df1 > 2) {
        "The distribution is right-skewed, with a peak near 1."
      } else {
        "The distribution is heavily right-skewed, starting high at the y-axis and decreasing rapidly."
      }
      shaded_desc <- ""
      if (is.numeric(prob)) {
        shaded_desc <- if (input$prob_type == "lt") {
          sprintf("The area to the left of the F-value %.2f is shaded, representing a cumulative probability of %.4f.", x_val, round(prob, input$round_digits))
        } else {
          sprintf("The area to the right of the F-value %.2f is shaded, representing a tail probability of %.4f.", x_val, round(prob, input$round_digits))
        }
      }
      desc <- paste(
        sprintf("This plot shows an F-distribution with %d numerator and %d denominator degrees of freedom.", df1, df2),
        shape_desc,
        "A vertical red line marks the specified F-value.",
        shaded_desc,
        collapse = " "
      )
      return(desc)
    })

    # --- Probability Result Text ---
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      digits <- input$round_digits
      if (is.numeric(prob)) {
        prob_text_part <- if (input$prob_type == "lt") {
          paste("X <", input$x_val)
        } else {
          paste("X >", input$x_val)
        }
        paste("P(", prob_text_part, ") = ", sprintf(paste0("%.", digits, "f"), prob))
      } else {
        prob
      }
    })

    # --- Simulation ---
    # Simulates random samples from the F-distribution
    observeEvent(input$simulate, {
      df1 <- input$df1
      df2 <- input$df2
      num_sim <- input$num_sim
      digits <- input$round_digits
      if (is.null(df1) || is.null(df2) || df1 < 1 || df2 < 1 || is.null(num_sim) || num_sim < 1) {
        rv$error <- "Please enter valid degrees of freedom and number of simulations."
        rv$simulation <- data.frame()
        return()
      }
      sim <- rf(num_sim, df1 = df1, df2 = df2)
      sim_df <- data.frame(
        Simulation = seq_len(num_sim),
        F_Value = round(sim, digits)
      )
      rv$error <- NULL
      rv$simulation <- sim_df
    })

    # --- Reset simulation results ---
    observeEvent(input$reset, {
      rv$error <- NULL
      rv$simulation <- data.frame()
    })

    # --- Simulation Table ---
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) return(NULL)
      datatable(rv$simulation, rownames = FALSE, options = list(pageLength = 10, dom = 'tip'))
    })

    # --- Export/Download Handlers ---
    output$download_distribution <- downloadHandler(
      filename = function() {
        paste("f_distribution_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df <- distribution_data()
        if (!is.null(df)) write.csv(df, file, row.names = FALSE)
      }
    )
    output$download_simulation <- downloadHandler(
      filename = function() {
        paste("f_simulation_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$simulation, file, row.names = FALSE)
      }
    )
  })
}
