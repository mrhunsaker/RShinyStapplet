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
# Stapplet Applet - Confidence Interval for a Population Mean
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# Confidence Interval Simulation Applet (Full Feature Parity with HTML/JS Stapplet)
# Author: Upgraded for full parity and accessibility

# --- Load required libraries ---
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots
library(DT)       # For interactive tables
library(shinyjs)  # For JavaScript integration in Shiny

# UI for Confidence Interval Simulation
ci_mean_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Simulating Confidence Intervals"),
      tags$link(rel = "stylesheet", type = "text/css", href = "master.css")
    ),
    titlePanel(
      h2("Simulating Confidence Intervals", id = ns("appTitle")),
      windowTitle = "Simulating Confidence Intervals"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        h3("Population", id = ns("popHeading")),
        selectInput(
          ns("pop_type"), "Population distribution is:",
          choices = c(
            "Normal" = "normal",
            "Uniform" = "uniform",
            "Skewed" = "skewed",
            "Bimodal" = "bimodal",
            "Categorical" = "categorical"
          ),
          selected = "normal"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'categorical'", ns("pop_type")),
          div(
            tags$label("True proportion of successes =", id = ns("cat_p_label")),
            numericInput(ns("cat_p"), NULL, value = 0.5, min = 0, max = 1, step = 0.01),
            span(id = ns("cat_p_error"), class = "errormsg", "")
          )
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] != 'categorical'", ns("pop_type")),
          div(
            tags$label("Population Mean (μ):", id = ns("pop_mean_label")),
            numericInput(ns("pop_mean"), NULL, value = 10, min = -100, max = 100, step = 0.1),
            tags$label("Population SD (σ):", id = ns("pop_sd_label")),
            numericInput(ns("pop_sd"), NULL, value = 2, min = 0.01, max = 50, step = 0.01)
          )
        ),
        hr(role = "separator"),
        div(
          tags$label("Sample Size (n):", id = ns("sample_size_label")),
          numericInput(ns("sample_size"), NULL, value = 30, min = 1, max = 1000, step = 1)
        ),
        div(
          tags$label("Confidence Level (%):", id = ns("conf_level_label")),
          numericInput(ns("conf_level"), NULL, value = 95, min = 1, max = 99, step = 1)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] != 'categorical'", ns("pop_type")),
          div(
            tags$label("Interval Type:", id = ns("ci_type_label")),
            selectInput(
              ns("ci_type"), NULL,
              choices = c(
                "t distribution" = "t",
                "z distribution with σ" = "z",
                "z distribution with sₓ" = "zs"
              ),
              selected = "t"
            )
          )
        ),
        hr(role = "separator"),
        h4("Simulation Controls"),
        div(
          actionButton(ns("draw_one"), "Draw 1 Interval", class = "btn-primary", width = "100%"),
          br(),
          actionButton(ns("draw_many"), "Draw Multiple Intervals", class = "btn-primary", width = "100%"),
          numericInput(ns("num_samples"), NULL, value = 10, min = 1, max = 500, step = 1),
          br(),
          actionButton(ns("reset"), "Reset Everything", class = "btn-danger", style = "width: 100%;")
        ),
        hr(role = "separator"),
        h4("Export/Download"),
        downloadButton(ns("download_intervals"), "Download Intervals (CSV)", class = "btn-success"),
        downloadButton(ns("download_sample"), "Download Last Sample (CSV)", class = "btn-success"),
        hr(role = "separator"),
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
              h4("Population Distribution", id = ns("popPlotHeading")),
              plotOutput(ns("populationPlot"), height = "250px", inline = TRUE)
            )
          ),
          column(6,
            div(class = "plot-container",
              h4("Last Sample", id = ns("samplePlotHeading")),
              plotOutput(ns("samplePlot"), height = "250px", inline = TRUE)
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Generated Confidence Intervals", id = ns("ciPlotHeading")),
              plotOutput(ns("ciPlot"), height = "400px", inline = TRUE),
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

# Server for Confidence Interval Simulation
ci_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive Values ---
    rv <- reactiveValues(
      population = NULL,
      pop_params = NULL,
      intervals = data.frame(),
      last_sample = NULL,
      error = NULL
    )

    # --- Input Validation ---
    validate_inputs <- reactive({
      errs <- character(0)
      if (input$sample_size < 1) errs <- c(errs, "Sample size must be at least 1.")
      if (input$conf_level <= 0 || input$conf_level >= 100) errs <- c(errs, "Confidence level must be between 1 and 99.")
      if (input$pop_type == "categorical") {
        if (is.null(input$cat_p) || input$cat_p < 0 || input$cat_p > 1) errs <- c(errs, "True proportion must be between 0 and 1.")
      } else {
        if (is.null(input$pop_mean) || is.null(input$pop_sd) || input$pop_sd <= 0) errs <- c(errs, "Population mean and SD must be valid, SD > 0.")
      }
      if (length(errs) > 0) {
        rv$error <- paste(errs, collapse = "\n")
        FALSE
      } else {
        rv$error <- NULL
        TRUE
      }
    })

    # --- Generate Population ---
    observe({
      req(validate_inputs())
      pop_type <- input$pop_type
      if (pop_type == "categorical") {
        p <- input$cat_p
        rv$population <- sample(c(1, 0), size = 10000, replace = TRUE, prob = c(p, 1 - p))
        rv$pop_params <- list(type = "categorical", p = p)
      } else if (pop_type == "normal") {
        mu <- input$pop_mean; sigma <- input$pop_sd
        rv$population <- rnorm(10000, mean = mu, sd = sigma)
        rv$pop_params <- list(type = "normal", mean = mu, sd = sigma)
      } else if (pop_type == "uniform") {
        rv$population <- runif(10000, min = 0, max = 10)
        rv$pop_params <- list(type = "uniform", min = 0, max = 10)
      } else if (pop_type == "skewed") {
        rv$population <- rchisq(10000, df = 3)
        rv$pop_params <- list(type = "skewed", df = 3)
      } else if (pop_type == "bimodal") {
        rv$population <- c(rnorm(5000, mean = 10, sd = 2), rnorm(5000, mean = 20, sd = 2))
        rv$pop_params <- list(type = "bimodal", mean1 = 10, mean2 = 20, sd = 2)
      }
      # Reset intervals and sample
      rv$intervals <- data.frame()
      rv$last_sample <- NULL
    })

    # --- Draw Sample and Calculate CI ---
    draw_ci <- function(n_intervals = 1) {
      req(validate_inputs())
      pop <- rv$population
      pop_type <- input$pop_type
      n <- input$sample_size
      conf <- input$conf_level / 100
      ci_type <- ifelse(pop_type == "categorical", "prop", input$ci_type)
      intervals <- list()
      for (i in seq_len(n_intervals)) {
        sample <- sample(pop, size = n, replace = TRUE)
        if (pop_type == "categorical") {
          x <- sum(sample)
          p_hat <- x / n
          se <- sqrt(p_hat * (1 - p_hat) / n)
          z_star <- qnorm(1 - (1 - conf) / 2)
          lower <- p_hat - z_star * se
          upper <- p_hat + z_star * se
          captured <- input$cat_p >= lower && input$cat_p <= upper
          intervals[[i]] <- data.frame(
            id = nrow(rv$intervals) + i,
            estimate = p_hat,
            lower = lower,
            upper = upper,
            captured = captured
          )
        } else {
          x_bar <- mean(sample)
          s <- sd(sample)
          if (ci_type == "t") {
            t_star <- qt(1 - (1 - conf) / 2, df = n - 1)
            me <- t_star * (s / sqrt(n))
            lower <- x_bar - me
            upper <- x_bar + me
          } else if (ci_type == "z") {
            z_star <- qnorm(1 - (1 - conf) / 2)
            me <- z_star * (input$pop_sd / sqrt(n))
            lower <- x_bar - me
            upper <- x_bar + me
          } else { # zs
            z_star <- qnorm(1 - (1 - conf) / 2)
            me <- z_star * (s / sqrt(n))
            lower <- x_bar - me
            upper <- x_bar + me
          }
          mu <- if (!is.null(input$pop_mean)) input$pop_mean else NA
          captured <- !is.na(mu) && mu >= lower && mu <= upper
          intervals[[i]] <- data.frame(
            id = nrow(rv$intervals) + i,
            estimate = x_bar,
            lower = lower,
            upper = upper,
            captured = captured
          )
        }
        rv$last_sample <- sample
      }
      rv$intervals <- rbind(rv$intervals, do.call(rbind, intervals))
    }

    # --- Button Handlers ---
    observeEvent(input$draw_one, { draw_ci(1) })
    observeEvent(input$draw_many, {
      n <- input$num_samples
      if (is.null(n) || n < 1 || n > 500) {
        rv$error <- "Number of samples must be between 1 and 500."
      } else {
        draw_ci(n)
      }
    })
    observeEvent(input$reset, {
      rv$intervals <- data.frame()
      rv$last_sample <- NULL
      rv$error <- NULL
    })

    # --- Error/Warning Messaging ---
    output$errorMsg <- renderUI({
      if (!is.null(rv$error)) {
        div(class = "errormsg", rv$error, role = "alert", `aria-live` = "assertive")
      }
    })

    # --- Population Plot ---
    output$populationPlot <- renderPlot({
      req(rv$population)
      pop_type <- input$pop_type
      if (pop_type == "categorical") {
        df <- data.frame(
          Outcome = c("Success", "Failure"),
          Count = c(sum(rv$population == 1), sum(rv$population == 0))
        )
        ggplot(df, aes(x = Outcome, y = Count, fill = Outcome)) +
          geom_bar(stat = "identity") +
          scale_fill_manual(values = if (input$colorblind) c("#0072B2", "#D55E00") else c("#60a5fa", "#dc2626")) +
          theme_minimal() +
          labs(title = sprintf("Categorical Population (p = %.2f)", input$cat_p))
      } else {
        df <- data.frame(x = rv$population)
        ggplot(df, aes(x = x)) +
          geom_density(fill = if (input$colorblind) "#0072B2" else "#60a5fa", alpha = 0.5) +
          geom_vline(xintercept = input$pop_mean, color = if (input$colorblind) "#D55E00" else "#dc2626", linetype = "dashed", size = 1.2) +
          theme_minimal() +
          labs(x = "Value", y = "Density", title = sprintf("Population (%s)", input$pop_type))
      }
    })

    # --- Sample Plot ---
    output$samplePlot <- renderPlot({
      req(rv$last_sample)
      pop_type <- input$pop_type
      if (pop_type == "categorical") {
        df <- data.frame(
          Outcome = c("Success", "Failure"),
          Count = c(sum(rv$last_sample == 1), sum(rv$last_sample == 0))
        )
        ggplot(df, aes(x = Outcome, y = Count, fill = Outcome)) +
          geom_bar(stat = "identity") +
          scale_fill_manual(values = if (input$colorblind) c("#0072B2", "#D55E00") else c("#84cc16", "#dc2626")) +
          theme_minimal() +
          labs(title = "Sample Outcomes")
      } else {
        df <- data.frame(x = rv$last_sample)
        ggplot(df, aes(x = x)) +
          geom_histogram(aes(y = ..density..), fill = if (input$colorblind) "#0072B2" else "#84cc16", alpha = 0.7, bins = 15) +
          geom_vline(xintercept = mean(rv$last_sample), color = if (input$colorblind) "#D55E00" else "#dc2626", linetype = "dashed", size = 1) +
          theme_minimal() +
          labs(x = "Value", y = "Density", title = "Sample Data")
      }
    })

    # --- Confidence Intervals Plot ---
    output$ciPlot <- renderPlot({
      if (nrow(rv$intervals) == 0) {
        return(ggplot() + labs(title = "Draw a sample to generate a confidence interval") + theme_void())
      }
      display_data <- tail(rv$intervals, 100)
      display_data$estimate <- as.numeric(display_data$estimate)
      display_data$id <- as.integer(display_data$id)
      display_data$lower <- as.numeric(display_data$lower)
      display_data$upper <- as.numeric(display_data$upper)
      display_data$captured <- as.logical(display_data$captured)
      display_data$captured_factor <- factor(display_data$captured, levels = c(TRUE, FALSE))
      pop_type <- input$pop_type
      pop_val <- if (pop_type == "categorical") input$cat_p else input$pop_mean
      ggplot(display_data, aes(x = estimate, y = id, xmin = lower, xmax = upper, color = captured_factor)) +
        geom_vline(xintercept = pop_val, color = if (input$colorblind) "#D55E00" else "#dc2626", linetype = "dashed", size = 1) +
        geom_errorbarh(height = 0.5, size = 0.8) +
        geom_point(size = 2) +
        scale_color_manual(
          values = if (input$colorblind) c("TRUE" = "#0072B2", "FALSE" = "#D55E00") else c("TRUE" = "#60a5fa", "FALSE" = "#dc2626"),
          name = "Captured?",
          labels = c("Yes", "No"),
          drop = FALSE
        ) +
        labs(x = if (pop_type == "categorical") "Proportion" else "Mean", y = "Sample Number", title = "Confidence Intervals") +
        theme_minimal() +
        theme(legend.position = "top")
    })

    # --- CI Plot Description (Accessibility) ---
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
      pop_type <- input$pop_type
      pop_val <- if (pop_type == "categorical") input$cat_p else input$pop_mean
      paste(
        "A plot of confidence intervals.",
        sprintf("A dashed vertical line shows the population %s of %.2f.", if (pop_type == "categorical") "proportion" else "mean", pop_val),
        sprintf("So far, %d intervals have been generated.", total_intervals),
        sprintf("%d of them (%.1f%%) captured the population value.", num_captured, percent_captured),
        sprintf("The most recent interval was centered at %.2f, with a range from %.2f to %.2f.", last_est, last_lower, last_upper),
        sprintf("This interval %s the population value.", last_captured),
        collapse = " "
      )
    })

    # --- Simulation Summary ---
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
      cat("Number Capturing Population Value:", num_captured, "\n")
      cat("Percent Captured:", sprintf("%.1f%%", percent_captured), "\n\n")
      cat("--- Last Interval Details ---\n")
      last_int <- tail(rv$intervals, 1)
      est <- round(as.numeric(last_int$estimate), input$round_digits)
      lower <- round(as.numeric(last_int$lower), input$round_digits)
      upper <- round(as.numeric(last_int$upper), input$round_digits)
      captured <- ifelse(as.logical(last_int$captured), "Yes", "No")
      cat("Estimate:", est, "\n")
      cat(conf_level_pct, "CI: (", lower, ", ", upper, ")\n")
      cat("Captured Population Value?", captured, "\n")
    })

    # --- Export/Download Handlers ---
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
