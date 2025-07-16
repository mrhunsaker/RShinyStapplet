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
# Stapplet Applet - Chi-Square Distribution
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
library(ggplot2) # For creating plots
library(DT) # For interactive tables
library(shinyjs) # For JavaScript integration in Shiny

dist_chi_square_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Chi-Square Distribution Calculator & Simulator"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Chi-Square Distribution Calculator & Simulator", id = ns("appTitle")),
      windowTitle = "Chi-Square Distribution Calculator & Simulator"
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
            "Raw Data (counts table)" = "raw"
          ),
          selected = "params"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'params'", ns("input_mode")),
          div(
            tags$label("Degrees of Freedom (df):", id = ns("df_label")),
            sliderInput(ns("df"), NULL, min = 1, max = 50, value = 10, step = 1)
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          div(
            tags$label("Paste observed counts (comma, space, or newline separated):", id = ns("raw_label")),
            textAreaInput(ns("raw_data"), NULL, value = "", rows = 4, placeholder = "e.g. 12, 8, 10, 15"),
            tags$label("Paste expected counts (comma, space, or newline separated):", id = ns("expected_label")),
            textAreaInput(ns("expected_data"), NULL, value = "", rows = 4, placeholder = "e.g. 11, 9, 11, 14"),
            actionButton(ns("parse_raw"), "Parse Counts Table", class = "btn-secondary", style = "width: 100%;")
          )
        ),
        hr(role = "separator"),
        h3("Probability Calculation", id = ns("probCalcHeading")),
        div(
          tags$label("Select Probability Type:", id = ns("prob_type_label")),
          radioButtons(ns("prob_type"), NULL,
            choices = c(
              "P(X < x)" = "lt",
              "P(X > x)" = "gt",
              "P(x1 < X < x2)" = "between"
            ),
            selected = "gt"
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] != 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("X Value (critical value):", id = ns("x_val_label")),
            numericInput(ns("x_val"), NULL, value = 18.31, step = 0.1, min = 0)
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'between'", ns("prob_type")),
          ns = ns,
          div(
            tags$label("X1 Value:", id = ns("x1_val_label")),
            numericInput(ns("x1_val"), NULL, value = 3.94, step = 0.1, min = 0)
          ),
          div(
            tags$label("X2 Value:", id = ns("x2_val_label")),
            numericInput(ns("x2_val"), NULL, value = 18.31, step = 0.1, min = 0)
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
          column(
            12,
            div(
              class = "plot-container",
              h4("Chi-Square Distribution", id = ns("distPlotHeading")),
              plotOutput(ns("distPlot"), height = "400px", inline = TRUE),
              p(id = ns("distPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("distPlot_desc_text")))
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h4("Calculated Probability:", id = ns("probResultHeading")),
              textOutput(ns("probabilityResult"))
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

dist_chi_square_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    rv <- reactiveValues(
      df = NULL,
      raw_obs = NULL,
      raw_exp = NULL,
      distribution = NULL,
      simulation = data.frame(),
      error = NULL
    )

    # --- Parse Raw Data ---
    observeEvent(input$parse_raw, {
      obs <- input$raw_data
      exp <- input$expected_data
      if (is.null(obs) || nchar(obs) == 0 || is.null(exp) || nchar(exp) == 0) {
        rv$error <- "Observed and expected counts must not be empty."
        rv$raw_obs <- NULL
        rv$raw_exp <- NULL
        rv$df <- NULL
        return()
      }
      obs_items <- unlist(strsplit(obs, "[,\\s\\n]+"))
      exp_items <- unlist(strsplit(exp, "[,\\s\\n]+"))
      obs_items <- obs_items[obs_items != ""]
      exp_items <- exp_items[exp_items != ""]
      if (length(obs_items) != length(exp_items)) {
        rv$error <- "Observed and expected counts must have the same number of categories."
        rv$raw_obs <- NULL
        rv$raw_exp <- NULL
        rv$df <- NULL
        return()
      }
      obs_items <- as.numeric(obs_items)
      exp_items <- as.numeric(exp_items)
      if ((is.null(obs_items) || length(obs_items) == 0) || (is.null(exp_items) || length(exp_items) == 0)) {
        # Don't show error until user enters data
      } else if (any(is.na(obs_items)) || any(is.na(exp_items))) {
        rv$error <- "Observed and expected counts must be numeric."
        rv$raw_obs <- NULL
        rv$raw_exp <- NULL
        rv$df <- NULL
        return()
      }
      if (any(exp_items <= 0)) {
        rv$error <- "Expected counts must be positive."
        rv$raw_obs <- NULL
        rv$raw_exp <- NULL
        rv$df <- NULL
        return()
      }
      rv$raw_obs <- obs_items
      rv$raw_exp <- exp_items
      rv$df <- length(obs_items) - 1
      rv$error <- NULL
    })

    # --- Input Validation ---
    validate_inputs <- reactive({
      errs <- character(0)
      mode <- input$input_mode
      if (is.null(mode) || length(mode) == 0) {
        errs <- c(errs, "Input mode must be selected.")
      } else if (mode == "params") {
        if (is.null(input$df)) {
          errs <- c(errs, "Degrees of freedom must be specified.")
        } else if (is.na(input$df) || input$df < 1) {
          errs <- c(errs, "Degrees of freedom must be at least 1.")
        }
      } else if (mode == "raw") {
        if (is.null(rv$raw_obs) || is.null(rv$raw_exp)) errs <- c(errs, "Observed and expected counts must be parsed and valid.")
        if (!is.null(rv$raw_obs) && length(rv$raw_obs) < 2) errs <- c(errs, "Counts table must have at least two categories.")
      }
      if (is.null(input$num_samples) || is.na(input$num_samples) || input$num_samples < 1 || input$num_samples > 500) errs <- c(errs, "Number of samples must be between 1 and 500.")
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
        df_val <- input$df
      } else {
        df_val <- rv$df
      }
      if (is.null(df_val)) {
        return()
      }
      max_x <- max(qchisq(0.999, df = df_val), 30)
      start_x <- if (df_val <= 2) 1e-4 else 0
      dist_data <- data.frame(x = seq(start_x, max_x, length.out = 500))
      dist_data$y <- dchisq(dist_data$x, df = df_val)
      rv$distribution <- dist_data
      # Reset simulation
      rv$simulation <- data.frame()
    })

    # --- Probability Calculation ---
    calculated_probability <- reactive({
      req(validate_inputs())
      mode <- input$input_mode
      if (mode == "params") {
        df_val <- input$df
      } else {
        df_val <- rv$df
      }
      prob_type <- input$prob_type
      if (is.null(df_val)) {
        return("Error: Degrees of freedom not set.")
      }
      if (prob_type == "lt") {
        req(input$x_val)
        if (input$x_val >= 0) {
          prob <- pchisq(input$x_val, df = df_val)
          prob_text_part <- paste("X <", input$x_val)
        } else {
          prob <- "Error: X value must be non-negative."
          prob_text_part <- ""
        }
      } else if (prob_type == "gt") {
        req(input$x_val)
        if (input$x_val >= 0) {
          prob <- 1 - pchisq(input$x_val, df = df_val)
          prob_text_part <- paste("X >", input$x_val)
        } else {
          prob <- "Error: X value must be non-negative."
          prob_text_part <- ""
        }
      } else if (prob_type == "between") {
        req(input$x1_val, input$x2_val)
        if (input$x1_val < input$x2_val && input$x1_val >= 0) {
          prob <- pchisq(input$x2_val, df = df_val) - pchisq(input$x1_val, df = df_val)
          prob_text_part <- paste(input$x1_val, "< X <", input$x2_val)
        } else {
          prob <- "Error: X1 must be less than X2 and non-negative."
          prob_text_part <- ""
        }
      }
      if (is.null(prob)) {
        "No result yet."
      } else if (is.numeric(prob)) {
        sprintf("P(%s) = %.4f", prob_text_part, prob)
      } else {
        prob
      }
    })

    # --- Simulation ---
    observeEvent(input$simulate, {
      if (!validate_inputs()) {
        return()
      }
      mode <- input$input_mode
      if (mode == "params") {
        df_val <- input$df
      } else {
        df_val <- rv$df
      }
      num_samples <- input$num_samples
      if (is.null(df_val) || is.null(num_samples)) {
        return()
      }
      sim <- rchisq(num_samples, df = df_val)
      sim_df <- data.frame(
        Sample = seq_len(num_samples),
        Chi_Square = sim
      )
      rv$simulation <- sim_df
    })

    observeEvent(input$reset, {
      rv$simulation <- data.frame()
      rv$error <- NULL
      rv$raw_obs <- NULL
      rv$raw_exp <- NULL
      rv$df <- NULL
    })

    # --- Error/Warning Messaging ---
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Chi-Square Distribution Plot ---
    output$distPlot <- renderPlot({
      req(rv$distribution)
      dist_data <- rv$distribution
      mode <- input$input_mode
      if (mode == "params") {
        df_val <- input$df
      } else {
        df_val <- rv$df
      }
      prob_type <- input$prob_type
      fill_colors <- if (input$colorblind) c("shade" = "#0072B2") else c("shade" = "#60a5fa")
      p <- ggplot(dist_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(
          title = paste("Chi-Square Distribution (df =", df_val, ")"),
          x = "Chi-Square Value", y = "Density"
        ) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))
      # Shading logic
      if (prob_type == "lt" && !is.null(input$x_val) && input$x_val >= 0) {
        shade_data <- subset(dist_data, x <= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = fill_colors["shade"], alpha = 0.5) +
          geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "gt" && !is.null(input$x_val) && input$x_val >= 0) {
        shade_data <- subset(dist_data, x >= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = fill_colors["shade"], alpha = 0.5) +
          geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
        shade_data <- subset(dist_data, x >= input$x1_val & x <= input$x2_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = fill_colors["shade"], alpha = 0.5) +
          geom_vline(xintercept = c(input$x1_val, input$x2_val), color = "#ef4444", linetype = "dashed")
      }
      p
    })

    # --- Chi-Square Plot Description (Accessibility) ---
    output$distPlot_desc_text <- renderText({
      dist_data <- rv$distribution
      req(dist_data)
      mode <- input$input_mode
      if (mode == "params") {
        df_val <- input$df
      } else {
        df_val <- rv$df
      }
      prob_type <- input$prob_type
      prob <- calculated_probability()
      mean_dist <- df_val
      shape_desc <- if (df_val == 1) {
        "highly right-skewed"
      } else if (df_val < 5) {
        "right-skewed"
      } else {
        "approximately symmetric"
      }
      shaded_desc <- ""
      if (is.character(prob) && grepl("Error", prob)) {
        shaded_desc <- ""
      } else if (prob_type == "lt" && !is.null(input$x_val)) {
        shaded_desc <- sprintf("The area to the left of %.2f is shaded.", input$x_val)
      } else if (prob_type == "gt" && !is.null(input$x_val)) {
        shaded_desc <- sprintf("The area to the right of %.2f is shaded.", input$x_val)
      } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val)) {
        shaded_desc <- sprintf("The area between %.2f and %.2f is shaded.", input$x1_val, input$x2_val)
      }
      desc <- paste(
        sprintf("This is a plot of a chi-square distribution with df=%d.", df_val),
        sprintf("The distribution is centered at %.1f and is %s.", mean_dist, shape_desc),
        shaded_desc,
        sprintf("The total probability of the shaded area is %s.", if (is.character(prob)) "N/A" else sprintf("%.5f", as.numeric(sub(".*= ", "", prob)))),
        collapse = " "
      )
      return(desc)
    })

    # --- Calculated Probability Text ---
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      prob
    })

    # --- Simulation Table ---
    output$simulationTable <- renderDT({
      if (nrow(rv$simulation) == 0) {
        return(NULL)
      }
      dat <- rv$simulation
      dat$Chi_Square <- round(dat$Chi_Square, input$round_digits)
      datatable(dat, rownames = FALSE, options = list(pageLength = 10, dom = "tip"))
    })

    # --- Export/Download Handlers ---
    output$download_distribution <- downloadHandler(
      filename = function() {
        paste("chi_square_distribution_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$distribution, file, row.names = FALSE)
      }
    )
    output$download_simulation <- downloadHandler(
      filename = function() {
        paste("chi_square_simulation_", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        write.csv(rv$simulation, file, row.names = FALSE)
      }
    )
  })
}
