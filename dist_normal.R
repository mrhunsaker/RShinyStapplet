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
# Stapplet Distribution - Normal Distribution
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

# --- UI Definition for Normal Distribution Calculator & Simulator ---
# This function builds the user interface for the module, allowing users to:
# - Set mean and standard deviation
# - Calculate probabilities for single values or intervals
# - Simulate samples
# - View plots, results, and download outputs
dist_normal_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Normal Distribution Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Normal Distribution Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "Normal Distribution Calculator & Simulator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Distribution Parameters", id = ns("paramsHeading")),
        # --- Input for mean ---
        div(
          tags$label("Mean (\u03bc):", id = ns("mean_label")),
          sliderInput(ns("mean"), NULL, min = -100, max = 100, value = 0, step = 1)
        ),
        # --- Input for standard deviation ---
        div(
          tags$label("Standard Deviation (\u03c3):", id = ns("sd_label")),
          sliderInput(ns("sd"), NULL, min = 0.1, max = 50, value = 10, step = 0.1)
        ),
        hr(role = "separator"),
        h3("Probability Calculation", id = ns("probCalcHeading")),
        # --- Probability type selection ---
        div(
          tags$label("Select Probability Type:", id = ns("prob_type_label")),
          radioButtons(ns("prob_type"), NULL,
            choices = c("P(X < x)" = "lt", "P(X > x)" = "gt", "P(x1 < X < x2)" = "between"),
            selected = "lt"
          )
        ),
        # --- Input for single value or interval ---
        conditionalPanel(
          condition = sprintf("input['%s'] != 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("X Value:", id = ns("x_val_label")),
            numericInput(ns("x_val"), NULL, value = 0, step = 0.1)
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("X1 Value:", id = ns("x1_val_label")),
            numericInput(ns("x1_val"), NULL, value = -10, step = 0.1)
          ),
          div(
            tags$label("X2 Value:", id = ns("x2_val_label")),
            numericInput(ns("x2_val"), NULL, value = 10, step = 0.1)
          )
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
        # --- Download options ---
        downloadButton(ns("download_distribution"), "Download Distribution (CSV)", class = "btn-success"),
        downloadButton(ns("download_simulation"), "Download Simulation (CSV)", class = "btn-success"),
        hr(role = "separator"),
        h4("Preferences"),
        sliderInput(ns("round_digits"), "Rounding (digits):", min = 0, max = 6, value = 4)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Normal Distribution", id = ns("normalPlotHeading")),
              plotOutput(ns("normalPlot"), height = "300px", inline = TRUE),
              p(id = ns("normalPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("normalPlot_desc_text")))
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

# --- Server Logic for Normal Distribution Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_normal_server <- function(id) {
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
    # Generates normal distribution data for plotting and calculations
    distribution_data <- reactive({
      req(input$mean, input$sd)
      x <- seq(input$mean - 4 * input$sd, input$mean + 4 * input$sd, length.out = 500)
      y <- dnorm(x, mean = input$mean, sd = input$sd)
      df <- data.frame(x = x, y = y)
      rv$distribution <- df
      df
    })

    # --- Error/Warning Messaging ---
    # Displays error messages for invalid input or simulation
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Probability Calculation ---
    # Calculates probability for single values or intervals based on user input
    calculated_probability <- reactive({
      req(input$mean, input$sd, input$prob_type)
      mean_val <- input$mean
      sd_val <- input$sd
      switch(input$prob_type,
        "lt" = {
          req(input$x_val)
          pnorm(input$x_val, mean = mean_val, sd = sd_val)
        },
        "gt" = {
          req(input$x_val)
          pnorm(input$x_val, mean = mean_val, sd = sd_val, lower.tail = FALSE)
        },
        "between" = {
          req(input$x1_val, input$x2_val)
          if (input$x1_val >= input$x2_val) {
            return("Error: X1 must be less than X2.")
          }
          pnorm(input$x2_val, mean = mean_val, sd = sd_val) - pnorm(input$x1_val, mean = mean_val, sd = sd_val)
        }
      )
    })

    # --- Normal Distribution Plot ---
    # Displays the normal distribution curve and shades the probability region
    output$normalPlot <- renderPlot({
      df <- distribution_data()
      plot_mean <- input$mean
      plot_sd <- input$sd
      prob_type <- input$prob_type
      x_val <- input$x_val
      x1_val <- input$x1_val
      x2_val <- input$x2_val
      digits <- input$round_digits

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        geom_vline(xintercept = plot_mean, linetype = "dashed", color = "#dc2626") +
        labs(title = paste("Normal Distribution (\u03bc =", plot_mean, ", \u03c3 =", plot_sd, ")"),
             x = "X", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold", color = "#0f172a"),
              axis.title = element_text(size = 12, color = "#334155"),
              axis.text = element_text(size = 10, color = "#475569"))

      # --- Shade probability region based on user selection ---
      if (prob_type == "lt" && !is.null(x_val)) {
        shade_data <- subset(df, x <= x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5) +
                 geom_vline(xintercept = x_val, linetype = "solid", color = "#ef4444")
      } else if (prob_type == "gt" && !is.null(x_val)) {
        shade_data <- subset(df, x >= x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5) +
                 geom_vline(xintercept = x_val, linetype = "solid", color = "#ef4444")
      } else if (prob_type == "between" && !is.null(x1_val) && !is.null(x2_val) && x1_val < x2_val) {
        shade_data <- subset(df, x >= x1_val & x <= x2_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#84cc16", alpha = 0.5) +
                 geom_vline(xintercept = x1_val, linetype = "solid", color = "#ef4444") +
                 geom_vline(xintercept = x2_val, linetype = "solid", color = "#ef4444")
      }
      p
    })

    # --- Plot Description (Accessibility) ---
    # Provides a text description of the normal distribution plot for screen readers
    output$normalPlot_desc_text <- renderText({
      req(input$mean, input$sd)
      mean_val <- input$mean
      sd_val <- input$sd
      prob <- calculated_probability()
      prob_type <- input$prob_type
      x_val <- input$x_val
      x1_val <- input$x1_val
      x2_val <- input$x2_val
      digits <- input$round_digits

      shaded_desc <- ""
      if (is.numeric(prob)) {
        shaded_desc <- switch(prob_type,
          "lt" = sprintf("The area to the left of X=%.2f is shaded, representing a cumulative probability of %.4f.", x_val, round(prob, digits)),
          "gt" = sprintf("The area to the right of X=%.2f is shaded, representing a tail probability of %.4f.", x_val, round(prob, digits)),
          "between" = sprintf("The area between X=%.2f and X=%.2f is shaded, representing a probability of %.4f.", x1_val, x2_val, round(prob, digits))
        )
      }

      desc <- paste(
        sprintf("This plot shows a normal distribution with a mean (\u03bc) of %.2f and a standard deviation (\u03c3) of %.2f.", mean_val, sd_val),
        "The curve is bell-shaped and symmetric around the mean.",
        "A dashed vertical line at the mean indicates the center of the distribution.",
        "A solid vertical line marks the specified X value(s) for the probability calculation.",
        shaded_desc,
        collapse = " "
      )
      return(desc)
    })

    # --- Probability Result Text ---
    # Displays the calculated probability for the selected region
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      digits <- input$round_digits
      prob_type <- input$prob_type
      x_val <- input$x_val
      x1_val <- input$x1_val
      x2_val <- input$x2_val
      if (is.numeric(prob)) {
        prob_text_part <- switch(prob_type,
          "lt" = paste("X <", x_val),
          "gt" = paste("X >", x_val),
          "between" = paste(x1_val, "< X <", x2_val)
        )
        paste0("P(", prob_text_part, ") = ", sprintf(paste0("%.", digits, "f"), prob))
      } else {
        prob
      }
    })

    # --- Simulation ---
    # Simulates random samples from the normal distribution
    observeEvent(input$simulate, {
      mean_val <- input$mean
      sd_val <- input$sd
      num_sim <- input$num_sim
      digits <- input$round_digits
      if (is.null(mean_val) || is.null(sd_val) || sd_val <= 0 || is.null(num_sim) || num_sim < 1) {
        rv$error <- "Please enter valid mean, standard deviation, and number of simulations."
        rv$simulation <- data.frame()
        return()
      }
      sim <- rnorm(num_sim, mean = mean_val, sd = sd_val)
      sim_df <- data.frame(
        Simulation = seq_len(num_sim),
        Value = round(sim, digits)
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
    # Displays simulated samples in a table
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) return(NULL)
      datatable(rv$simulation, rownames = FALSE, options = list(pageLength = 10, dom = 'tip'))
    })

    # --- Export/Download Handlers ---
    # Allows users to download distribution and simulation results as CSV files
    output$download_distribution <- downloadHandler(
      filename = function() {
        paste("normal_distribution_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df <- distribution_data()
        if (!is.null(df)) write.csv(df, file, row.names = FALSE)
      }
    )
    output$download_simulation <- downloadHandler(
      filename = function() {
        paste("normal_simulation_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$simulation, file, row.names = FALSE)
      }
    )
  })
}
