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
# Stapplet Applet - Poisson Distribution
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

# Enhanced Poisson Distribution Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(BrailleR) # For accessibility (BrailleR descriptions)
library(dplyr) # For data wrangling
library(shinyjs) # For JavaScript integration in Shiny
library(DT) # For interactive tables

# ---- Preferences ----
# --- Default preferences for UI ---
default_prefs <- list(
  color_palette = "viridis", # Default color palette for plots
  rounding = 4, # Default number of decimal places
  percent_display = FALSE # Display probabilities as percentages by default
)

# ---- UI Definition for Poisson Distribution Applet ----
# This function builds the user interface for the Poisson module, allowing users to:
# - Input the mean (lambda)
# - Calculate probabilities for single values or intervals
# - Adjust preferences for display
# - Download plots and tables
dist_poisson_ui <- function(id) {
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
    h2("Poisson Distribution"),
    p("Visualize a Poisson distribution and calculate probabilities for a given mean."),
    sidebarLayout(
      sidebarPanel(
        # --- Mean input ---
        div(
          class = "form-group",
          tags$label("Mean (\u03bb):", `for` = ns("lambda")),
          numericInput(ns("lambda"), label = NULL, value = 5, min = 0.01, step = 0.01),
          tags$p(id = ns("lambda_desc"), class = "sr-only", "Enter the average number of events (lambda) for the Poisson distribution. Must be greater than 0."),
          tags$script(paste0("document.getElementById('", ns("lambda"), "').setAttribute('aria-describedby', '", ns("lambda_desc"), "')"))
        ),
        hr(),
        # --- Probability calculation tabs ---
        h3("Calculate Probability"),
        tabsetPanel(
          id = ns("prob_mode"),
          tabPanel(
            "Single Value",
            p("Find the probability for a given value of X."),
            div(
              class = "form-group",
              tags$label("Type of Probability:", `for` = ns("prob_type")),
              selectInput(ns("prob_type"),
                label = NULL,
                choices = c(
                  "P(X = x)" = "eq",
                  "P(X < x)" = "lt",
                  "P(X \u2264 x)" = "le",
                  "P(X > x)" = "gt",
                  "P(X \u2265 x)" = "ge"
                )
              ),
              tags$p(id = ns("prob_type_desc"), class = "sr-only", "Select the inequality for the probability calculation."),
              tags$script(paste0("document.getElementById('", ns("prob_type"), "').setAttribute('aria-describedby', '", ns("prob_type_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("Value of x:", `for` = ns("prob_x_value")),
              numericInput(ns("prob_x_value"), label = NULL, value = 0, min = 0, step = 1),
              tags$p(id = ns("prob_x_desc"), class = "sr-only", "Enter the specific value of x to use in the probability calculation."),
              tags$script(paste0("document.getElementById('", ns("prob_x_value"), "').setAttribute('aria-describedby', '", ns("prob_x_desc"), "')"))
            ),
            actionButton(ns("calc_single"), "Go!", class = "btn-primary", `aria-label` = "Calculate single value probability")
          ),
          tabPanel(
            "Interval",
            p("Calculate the probability of X being between two values (inclusive)."),
            div(
              class = "form-group",
              tags$label("Left bound (x\u2081):", `for` = ns("prob_left")),
              numericInput(ns("prob_left"), label = NULL, value = 0, min = 0, step = 1)
            ),
            div(
              class = "form-group",
              tags$label("Right bound (x\u2082):", `for` = ns("prob_right")),
              numericInput(ns("prob_right"), label = NULL, value = 1, min = 0, step = 1)
            ),
            actionButton(ns("calc_interval"), "Go!", class = "btn-primary", `aria-label` = "Calculate interval probability")
          )
        ),
        hr(),
        # --- Preferences for display ---
        h3("Preferences"),
        div(
          class = "prefs-box",
          selectInput(ns("color_palette"), "Color Palette",
            choices = c("viridis", "plasma", "magma", "inferno", "cividis")
          ),
          numericInput(ns("rounding"), "Decimal Places", value = default_prefs$rounding, min = 0, max = 10, step = 1),
          checkboxInput(ns("percent_display"), "Display probabilities as percentages", value = default_prefs$percent_display)
        ),
        hr(),
        # --- Download options ---
        h3("Export/Download"),
        downloadButton(ns("download_plot"), "Download Plot", class = "btn-success"),
        downloadButton(ns("download_table"), "Download Table", class = "btn-success")
      ),
      mainPanel(
        # --- Error message output ---
        tags$div(
          class = "error-msg",
          `aria-live` = "assertive",
          textOutput(ns("error_msg"))
        ),
        # --- Distribution plot ---
        div(
          class = "plot-container",
          plotOutput(ns("dist_plot"), height = "350px"),
          tags$script(paste0("document.getElementById('", ns("dist_plot"), "').setAttribute('aria-label', 'A bar chart showing the Poisson probability distribution. The area for the calculated probability is highlighted.')")),
          p(id = ns("dist_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("dist_plot_desc_text")))
        ),
        # --- Calculated probability and table ---
        div(
          class = "results-box", role = "status", `aria-live` = "polite",
          h3("Calculated Probability"),
          textOutput(ns("calculated_prob")),
          DTOutput(ns("prob_table"))
        )
      )
    )
  )
}

# ---- Server Logic for Poisson Distribution Applet ----
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_poisson_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Preferences ---
    # Stores user-selected preferences for color palette, rounding, and percent display
    prefs <- reactive({
      list(
        color_palette = input$color_palette %||% default_prefs$color_palette,
        rounding = input$rounding %||% default_prefs$rounding,
        percent_display = input$percent_display %||% default_prefs$percent_display
      )
    })

    # --- Error Messaging ---
    error_msg <- reactiveVal("")

    # --- Distribution Data ---
    # Generates Poisson probability distribution data for plotting and calculations
    dist_data <- reactive({
      lambda <- input$lambda
      if (is.null(lambda) || is.na(lambda) || lambda <= 0) {
        error_msg("The mean (\u03bb) must be a positive number.")
        return(NULL)
      }
      error_msg("")
      max_x <- qpois(0.9999, lambda)
      if (max_x < 20) max_x <- 20
      x_vals <- 0:max_x
      data.frame(
        x = x_vals,
        p = dpois(x_vals, lambda)
      )
    })

    # --- Probability Calculation ---
    # Calculates probability for single values or intervals based on user input
    calc_prob <- reactive({
      req(dist_data())
      mode <- input$prob_mode
      lambda <- input$lambda
      rounding <- prefs()$rounding
      percent <- prefs()$percent_display

      if (mode == "Single Value") {
        x_val <- input$prob_x_value
        prob_type <- input$prob_type
        if (is.null(x_val) || is.na(x_val) || x_val < 0 || x_val > 1000) {
          error_msg("x must be a non-negative integer between 0 and 1000.")
          return(NULL)
        }
        error_msg("")
        x_val <- floor(x_val)
        prob <- switch(prob_type,
          "eq" = dpois(x_val, lambda),
          "lt" = ppois(x_val - 1, lambda),
          "le" = ppois(x_val, lambda),
          "gt" = ppois(x_val, lambda, lower.tail = FALSE),
          "ge" = ppois(x_val - 1, lambda, lower.tail = FALSE)
        )
        op_string <- switch(prob_type,
          "eq" = "=",
          "lt" = "<",
          "le" = "\u2264",
          "gt" = ">",
          "ge" = "\u2265"
        )
        prob_disp <- if (percent) paste0(round(prob * 100, rounding), "%") else round(prob, rounding)
        list(
          text = paste0("P(X ", op_string, " ", x_val, ") = ", prob_disp),
          table = data.frame(
            Type = paste0("P(X ", op_string, " ", x_val, ")"),
            Probability = prob_disp
          ),
          highlight = switch(prob_type,
            "eq" = dist_data()$x == x_val,
            "lt" = dist_data()$x < x_val,
            "le" = dist_data()$x <= x_val,
            "gt" = dist_data()$x > x_val,
            "ge" = dist_data()$x >= x_val,
            rep(FALSE, nrow(dist_data()))
          )
        )
      } else if (mode == "Interval") {
        left <- input$prob_left
        right <- input$prob_right
        if (is.null(left) || is.na(left) || left < 0 || left > 1000 ||
          is.null(right) || is.na(right) || right < 0 || right > 1000) {
          error_msg("Bounds must be non-negative integers between 0 and 1000.")
          return(NULL)
        }
        if (right < left) {
          error_msg("Right bound must be greater than or equal to left bound.")
          return(NULL)
        }
        error_msg("")
        left <- floor(left)
        right <- floor(right)
        prob <- ppois(right, lambda) - ppois(left - 1, lambda)
        prob_disp <- if (percent) paste0(round(prob * 100, rounding), "%") else round(prob, rounding)
        list(
          text = paste0("P(", left, " \u2264 X \u2264 ", right, ") = ", prob_disp),
          table = data.frame(
            Type = paste0("P(", left, " \u2264 X \u2264 ", right, ")"),
            Probability = prob_disp
          ),
          highlight = dist_data()$x >= left & dist_data()$x <= right
        )
      } else {
        NULL
      }
    })

    # --- Plot: Poisson Distribution ---
    output$dist_plot <- renderPlot({
      df <- dist_data()
      req(df)
      prob <- calc_prob()
      palette <- prefs()$color_palette
      highlight <- if (!is.null(prob)) prob$highlight else rep(FALSE, nrow(df))
      df$highlight <- ifelse(highlight, "yes", "no")
      ggplot(df, aes(x = x, y = p, fill = highlight)) +
        geom_col(alpha = 0.8) +
        scale_fill_manual(values = c("yes" = scales::viridis_pal(option = palette)(8)[7], "no" = scales::viridis_pal(option = palette)(8)[3]), guide = "none") +
        labs(
          title = paste("Poisson Distribution with \u03bb =", input$lambda),
          x = "Number of Events (x)",
          y = "Probability P(x)"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
    })

    # --- Accessibility: BrailleR Description for Plot ---
    output$dist_plot_desc_text <- renderText({
      df <- dist_data()
      req(df)
      prob <- calc_prob()
      highlight <- if (!is.null(prob)) prob$highlight else rep(FALSE, nrow(df))
      df$highlight <- ifelse(highlight, "yes", "no")
      p <- ggplot(df, aes(x = x, y = p, fill = highlight)) +
        geom_col(alpha = 0.8) +
        scale_fill_manual(values = c("yes" = "#d73027", "no" = "#4575b4"), guide = "none") +
        labs(
          title = paste("Poisson Distribution with \u03bb =", input$lambda),
          x = "Number of Events (x)",
          y = "Probability P(x)"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
      VI(p)
    })

    # --- Error Message Output ---
    output$error_msg <- renderText({
      error_msg()
    })

    # --- Calculated Probability Output ---
    output$calculated_prob <- renderText({
      prob <- calc_prob()
      if (!is.null(prob)) prob$text else ""
    })

    # --- Probability Table Output ---
    output$prob_table <- renderDT({
      prob <- calc_prob()
      if (!is.null(prob)) datatable(prob$table, rownames = FALSE, options = list(dom = "t")) else datatable(data.frame())
    })

    # --- Download Plot Handler ---
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("poisson_distribution_", Sys.Date(), ".png")
      },
      content = function(file) {
        df <- dist_data()
        req(df)
        prob <- calc_prob()
        palette <- prefs()$color_palette
        highlight <- if (!is.null(prob)) prob$highlight else rep(FALSE, nrow(df))
        df$highlight <- ifelse(highlight, "yes", "no")
        p <- ggplot(df, aes(x = x, y = p, fill = highlight)) +
          geom_col(alpha = 0.8) +
          scale_fill_manual(values = c("yes" = scales::viridis_pal(option = palette)(8)[7], "no" = scales::viridis_pal(option = palette)(8)[3]), guide = "none") +
          labs(
            title = paste("Poisson Distribution with \u03bb =", input$lambda),
            x = "Number of Events (x)",
            y = "Probability P(x)"
          ) +
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"))
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # --- Download Table Handler ---
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("poisson_probability_", Sys.Date(), ".csv")
      },
      content = function(file) {
        prob <- calc_prob()
        if (!is.null(prob)) write.csv(prob$table, file, row.names = FALSE)
      }
    )

    # --- Accessibility: Keyboard Navigation for Plot ---
    observe({
      runjs(sprintf("document.getElementById('%s').setAttribute('tabindex', '0');", ns("dist_plot")))
    })

    # --- Calculate on Button Click ---
    observeEvent(input$calc_single, {
      calc_prob()
    })
    observeEvent(input$calc_interval, {
      calc_prob()
    })
  })
}

# ---- App Entrypoint ----
# Uncomment below to run as standalone app for testing
# shinyApp(
#   ui = dist_poisson_ui("poisson"),
#   server = function(input, output, session) {
#     dist_poisson_server("poisson")
#   }
# )
