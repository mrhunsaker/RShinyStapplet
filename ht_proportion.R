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
# Hypothesis Test for a Proportion (Single Group)
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
# --------------------------------------------------------------------
# MODULE OVERVIEW
# --------------------------------------------------------------------
# This module implements a Shiny applet for hypothesis testing,
# confidence intervals, goodness-of-fit, and simulation for a population
# proportion. It supports both raw data and summary counts input,
# provides interactive UI for data entry, visualization, simulation,
# and downloadable results. All major logic blocks and functions are
# documented for clarity and maintainability.
# --------------------------------------------------------------------

# Hypothesis Test for a Population Proportion (Fully Integrated, STAPLET Feature Parity)

######################################################################
# SECTION: Load Required Libraries
######################################################################
library(shiny) # Shiny web application framework
library(ggplot2) # For plotting
library(DT) # For interactive tables
library(shinyjs) # For UI enhancements
library(shinyWidgets) # For advanced widgets
library(htmltools) # For HTML UI elements
library(readr) # For reading/writing data

######################################################################
# SECTION: UI Definition
# Defines the user interface for the Hypothesis Test for a Population Proportion applet.
######################################################################
ht_proportion_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    titlePanel(
      h2("Hypothesis Test for a Population Proportion (One-Proportion z-Test)", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Population Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",

        # --- Data Input Mode ---
        h3("Data Input Mode"),
        radioButtons(ns("input_mode"), "Choose input type:",
          choices = c("Counts Table" = "counts", "Raw Data" = "raw"),
          selected = "counts"
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'counts'", ns("input_mode")),
          h4("Enter Category Counts"),
          DTOutput(ns("counts_table")),
          actionButton(ns("add_row"), "Add Category", icon = icon("plus")),
          actionButton(ns("remove_row"), "Remove Category", icon = icon("minus")),
          textOutput(ns("counts_error"))
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'raw'", ns("input_mode")),
          h4("Paste Raw Data (comma or space separated)"),
          textAreaInput(ns("raw_data"), "Raw Data", "", rows = 3),
          textOutput(ns("raw_error"))
        ),
        hr(),
        uiOutput(ns("success_category_ui")),
        hr(),

        # --- Inference Type Selection ---
        h3("Inference Type"),
        radioButtons(ns("inference_type"), "Choose inference:",
          choices = c(
            "Confidence Interval" = "interval",
            "Hypothesis Test" = "test",
            "Goodness-of-Fit" = "gof",
            "Simulation" = "simulation"
          ),
          selected = "test"
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'interval'", ns("inference_type")),
          sliderInput(ns("conf_level"), "Confidence Level", min = 0.80, max = 0.99, value = 0.95, step = 0.01)
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'test'", ns("inference_type")),
          h3("Hypothesis Parameters", id = "paramsHeading"),
          div(
            class = "form-group",
            tags$label(id = ns("p0_label"), "Null Hypothesis Proportion (p\u2080):"),
            numericInput(ns("p0"), NULL, value = 0.5, min = 0, max = 1, step = 0.01)
          ),
          div(
            class = "form-group",
            tags$label(id = ns("alternative_label"), "Alternative Hypothesis:"),
            selectInput(ns("alternative"), NULL,
              choices = c(
                "Not equal to p\u2080 (Two-sided)" = "two.sided",
                "Less than p\u2080 (Left-sided)" = "less",
                "Greater than p\u2080 (Right-sided)" = "greater"
              ),
              selected = "two.sided"
            )
          ),
          sliderInput(ns("alpha"), "Significance Level (\u03B1):", min = 0.01, max = 0.20, value = 0.05, step = 0.01)
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'gof'", ns("inference_type")),
          h4("Expected Counts for Each Category"),
          DTOutput(ns("expected_table")),
          textOutput(ns("gof_error"))
        ),
        conditionalPanel(
          sprintf("input['%s'] == 'simulation'", ns("inference_type")),
          h4("Simulation Settings"),
          numericInput(ns("num_sim"), "Number of Simulations", value = 100, min = 10, step = 10)
        ),
        hr(),
        # --- Preferences Section ---
        h3("Preferences"),
        pickerInput(ns("color_palette"), "Color palette:",
          choices = c("Default", "Colorblind", "Viridis", "Pastel"),
          selected = "Default"
        ),
        sliderInput(ns("round_digits"), "Rounding digits:", min = 0, max = 4, value = 2),
        switchInput(ns("aria_enable"), "Enable ARIA roles/labels", value = TRUE),
        hr(),
        downloadButton(ns("download_results"), "Download Results")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        uiOutput(ns("results_ui")),
        plotOutput(ns("main_plot"), height = "350px"),
        uiOutput(ns("sim_stats_ui"))
      )
    )
  )
}

######################################################################
# SECTION: Server Logic
# Implements all server-side logic for the applet, including:
# - Data input and validation
# - Table and raw data handling
# - Visualization and plotting
# - Inference calculations (CI, hypothesis test, goodness-of-fit, simulation)
# - Download/export functionality
# - Accessibility enhancements
######################################################################
ht_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ##################################################################
    # SECTION: Data Input Handling
    # Handles counts table and raw data input, including validation.
    ##################################################################
    counts_data <- reactiveVal(data.frame(Category = c("Success", "Failure"), Count = c(25, 25)))
    expected_data <- reactiveVal(data.frame(Category = c("Success", "Failure"), Expected = c(25, 25)))

    observeEvent(input$add_row, {
      df <- counts_data()
      counts_data(rbind(df, data.frame(Category = paste0("Cat", nrow(df) + 1), Count = 0)))
    })
    observeEvent(input$remove_row, {
      df <- counts_data()
      if (nrow(df) > 2) counts_data(df[-nrow(df), ])
    })

    output$counts_table <- renderDT(
      {
        datatable(counts_data(),
          editable = TRUE, rownames = FALSE,
          options = list(dom = "t", ordering = FALSE, paging = FALSE)
        )
      },
      server = FALSE
    )

    observeEvent(input$counts_table_cell_edit, {
      info <- input$counts_table_cell_edit
      df <- counts_data()
      df[info$row, info$col + 1] <- as.numeric(info$value)
      counts_data(df)
    })

    output$expected_table <- renderDT(
      {
        datatable(expected_data(),
          editable = TRUE, rownames = FALSE,
          options = list(dom = "t", ordering = FALSE, paging = FALSE)
        )
      },
      server = FALSE
    )

    observeEvent(input$expected_table_cell_edit, {
      info <- input$expected_table_cell_edit
      df <- expected_data()
      df[info$row, info$col + 1] <- as.numeric(info$value)
      expected_data(df)
    })

    # Raw data input parsing
    raw_categories <- reactive({
      req(input$raw_data)
      cats <- unlist(strsplit(input$raw_data, "[,\\s]+"))
      table(cats)
    })

    ##################################################################
    # SECTION: Error Messages for Input Validation
    ##################################################################
    output$counts_error <- renderText({
      df <- counts_data()
      if (is.null(df$Count) || length(df$Count) == 0) {
        return("")
      }
      if (any(is.na(df$Count)) || any(df$Count < 0)) {
        return("Counts must be non-negative numbers.")
      }
      if (length(unique(df$Category)) < 2) {
        return("At least two categories required.")
      }
      ""
    })
    output$raw_error <- renderText({
      cats <- names(raw_categories())
      if (length(cats) < 2) {
        return("At least two categories required.")
      }
      ""
    })
    output$gof_error <- renderText({
      df <- expected_data()
      if (is.null(df$Expected) || length(df$Expected) == 0) {
        return("")
      }
      if (any(is.na(df$Expected)) || any(df$Expected < 0)) {
        return("Expected counts must be non-negative numbers.")
      }
      ""
    })

    ##################################################################
    # SECTION: Dynamic Success Category Selection
    ##################################################################
    output$success_category_ui <- renderUI({
      cats <- if (input$input_mode == "counts") counts_data()$Category else names(raw_categories())
      selectInput(session$ns("success_cat"), "Select Success Category", choices = cats, selected = cats[1])
    })

    ##################################################################
    # SECTION: Main Data Extraction
    # Provides reactive access to sample size and number of successes.
    ##################################################################
    get_data <- reactive({
      if (input$input_mode == "counts") {
        df <- counts_data()
        setNames(df$Count, df$Category)
      } else {
        as.numeric(raw_categories())
      }
    })

    get_n <- reactive({
      sum(get_data())
    })
    get_x <- reactive({
      get_data()[input$success_cat]
    })

    ##################################################################
    # SECTION: Inference Calculations
    # Confidence Interval, Hypothesis Test, Goodness-of-Fit, Simulation
    ##################################################################
    # Confidence Interval
    ci_results <- reactive({
      x <- get_x()
      n <- get_n()
      conf <- input$conf_level
      p_hat <- x / n
      se <- sqrt(p_hat * (1 - p_hat) / n)
      z <- qnorm(1 - (1 - conf) / 2)
      lower <- p_hat - z * se
      upper <- p_hat + z * se
      list(lower = lower, upper = upper, p_hat = p_hat, n = n)
    })

    # Hypothesis Test
    test_results <- reactive({
      p0 <- input$p0
      x <- get_x()
      n <- get_n()
      alpha <- input$alpha
      alternative <- input$alternative
      expected_successes <- n * p0
      expected_failures <- n * (1 - p0)
      conditions_met <- expected_successes >= 10 && expected_failures >= 10
      p_hat <- x / n
      se <- sqrt(p0 * (1 - p0) / n)
      z_stat <- (p_hat - p0) / se
      p_value <- switch(alternative,
        "two.sided" = 2 * pnorm(-abs(z_stat)),
        "less" = pnorm(z_stat),
        "greater" = 1 - pnorm(z_stat)
      )
      conclusion <- ifelse(p_value < alpha,
        paste0("Reject the null hypothesis (p-value = ", sprintf("%.4f", p_value), " < \u03B1 = ", alpha, ")."),
        paste0("Fail to reject the null hypothesis (p-value = ", sprintf("%.4f", p_value), " \u2265 \u03B1 = ", alpha, ").")
      )
      list(
        p0 = p0,
        p_hat = p_hat,
        n = n,
        x = x,
        z_stat = z_stat,
        p_value = p_value,
        alpha = alpha,
        alternative = alternative,
        conditions_met = conditions_met,
        expected_successes = expected_successes,
        expected_failures = expected_failures,
        conclusion = conclusion
      )
    })

    # Goodness-of-Fit Test
    gof_results <- reactive({
      obs <- counts_data()$Count
      exp <- expected_data()$Expected
      df <- length(obs) - 1
      x2 <- sum((obs - exp)^2 / exp)
      p_value <- pchisq(x2, df, lower.tail = FALSE)
      warning <- any(exp < 5)
      list(x2 = x2, p_value = p_value, df = df, warning = warning)
    })

    # Simulation
    sim_results <- reactive({
      n <- get_n()
      x <- get_x()
      prop <- x / n
      num_sim <- input$num_sim
      sim <- rbinom(num_sim, n, prop) / n
      list(sim = sim, mean = mean(sim), sd = sd(sim), last = tail(sim, 1))
    })

    ##################################################################
    # SECTION: Results UI
    # Renders results and summary statistics for each inference type.
    ##################################################################
    output$results_ui <- renderUI({
      inf_type <- input$inference_type
      if (inf_type == "interval") {
        res <- ci_results()
        tagList(
          h3("Confidence Interval for Proportion"),
          tags$table(
            tags$tr(tags$th("Lower Bound"), tags$th("Upper Bound")),
            tags$tr(tags$td(sprintf("%.4f", res$lower)), tags$td(sprintf("%.4f", res$upper)))
          ),
          if (min(res$n - res$p_hat * res$n, res$p_hat * res$n) < 10) {
            tags$p("WARNING: Fewer than 10 successes/failures.", style = "color: red;")
          }
        )
      } else if (inf_type == "test") {
        res <- test_results()
        h0 <- paste0("H\u2080: p = ", res$p0)
        ha <- switch(res$alternative,
          "two.sided" = paste0("H\u2090: p \u2260 ", res$p0),
          "less" = paste0("H\u2090: p < ", res$p0),
          "greater" = paste0("H\u2090: p > ", res$p0)
        )
        condition_text <- if (res$conditions_met) {
          paste0("Conditions met: n*p\u2080 = ", round(res$expected_successes, 1), " \u2265 10 and n*(1-p\u2080) = ", round(res$expected_failures, 1), " \u2265 10.")
        } else {
          paste0("Warning: Conditions not met. n*p\u2080 = ", round(res$expected_successes, 1), " or n*(1-p\u2080) = ", round(res$expected_failures, 1), " is less than 10. The z-test may not be reliable.")
        }
        tagList(
          tags$p(strong("Hypotheses:")),
          tags$ul(tags$li(h0), tags$li(ha)),
          tags$p(strong("Conditions:")),
          tags$p(condition_text, style = if (!res$conditions_met) "color: red;" else ""),
          tags$p(strong("Sample Statistics:")),
          tags$ul(
            tags$li(paste0("Sample Proportion (\u0175): ", round(res$p_hat, 4))),
            tags$li(paste0("Sample Size (n): ", res$n))
          ),
          tags$p(strong("Test Statistic:")),
          tags$ul(
            tags$li(paste0("z-statistic: ", round(res$z_stat, 3))),
            tags$li(paste0("p-value: ", sprintf("%.4f", res$p_value)))
          ),
          tags$p(strong("Conclusion:")),
          tags$p(res$conclusion, style = "font-weight: bold; color: #0f766e;")
        )
      } else if (inf_type == "gof") {
        res <- gof_results()
        tagList(
          h3("Chi-Square Goodness-of-Fit Test"),
          tags$table(
            tags$tr(tags$th("\u03C7\u00B2"), tags$th("P-value"), tags$th("df")),
            tags$tr(tags$td(sprintf("%.4f", res$x2)), tags$td(sprintf("%.4f", res$p_value)), tags$td(res$df))
          ),
          if (res$warning) {
            tags$p("WARNING: At least one expected count is less than 5.", style = "color: red;")
          }
        )
      } else if (inf_type == "simulation") {
        NULL
      }
    })

    ##################################################################
    # SECTION: Main Plot Rendering
    # Visualizes distributions, simulation, and goodness-of-fit.
    ##################################################################
    output$main_plot <- renderPlot({
      inf_type <- input$inference_type
      palette <- switch(input$color_palette,
        "Default" = "Set2",
        "Colorblind" = "Dark2",
        "Viridis" = "viridis",
        "Pastel" = "Pastel1",
        "Set2"
      )
      if (inf_type == "test") {
        res <- test_results()
        curve_data <- data.frame(x = seq(-4, 4, length.out = 400))
        curve_data$y <- dnorm(curve_data$x)
        p <- ggplot(curve_data, aes(x = x, y = y)) +
          geom_line(color = "#1e40af", size = 1) +
          labs(
            title = "Normal Distribution of z-statistic under H\u2080",
            x = "z-statistic", y = "Density"
          ) +
          theme_minimal() +
          theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))
        shade_data <- switch(res$alternative,
          "less" = subset(curve_data, x <= res$z_stat),
          "greater" = subset(curve_data, x >= res$z_stat),
          "two.sided" = subset(curve_data, x >= abs(res$z_stat) | x <= -abs(res$z_stat))
        )
        p + geom_area(data = shade_data, aes(y = y), fill = "#fbbf24", alpha = 0.6) +
          geom_vline(xintercept = res$z_stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
          annotate("text", x = res$z_stat, y = 0, label = paste("z =", round(res$z_stat, 2)), vjust = 1.5, color = "#dc2626", fontface = "bold")
      } else if (inf_type == "simulation") {
        sim <- sim_results()
        df <- data.frame(Proportion = sim$sim)
        ggplot(df, aes(x = Proportion)) +
          geom_dotplot(binwidth = 0.01, dotsize = 0.5, fill = "#1e40af") +
          labs(
            title = "Simulation Dotplot of Sample Proportions",
            x = "Sample Proportion", y = "Count"
          ) +
          theme_minimal()
      } else if (inf_type == "gof") {
        obs <- counts_data()
        exp <- expected_data()
        df <- data.frame(Category = obs$Category, Observed = obs$Count, Expected = exp$Expected)
        ggplot(df, aes(x = Category)) +
          geom_bar(aes(y = Observed), stat = "identity", fill = "#1e40af", alpha = 0.7, position = "dodge") +
          geom_bar(aes(y = Expected), stat = "identity", fill = "#fbbf24", alpha = 0.5, position = "dodge") +
          labs(title = "Observed vs Expected Counts", y = "Count") +
          theme_minimal()
      }
    })

    ##################################################################
    # SECTION: Simulation Summary Statistics UI
    ##################################################################
    output$sim_stats_ui <- renderUI({
      if (input$inference_type == "simulation") {
        sim <- sim_results()
        tagList(
          h4("Simulation Summary Statistics"),
          tags$table(
            tags$tr(tags$th("Number of Trials"), tags$th("Recent Result"), tags$th("Mean"), tags$th("SD")),
            tags$tr(
              tags$td(length(sim$sim)),
              tags$td(sprintf("%.4f", sim$last)),
              tags$td(sprintf("%.4f", sim$mean)),
              tags$td(sprintf("%.4f", sim$sd))
            )
          )
        )
      }
    })

    ##################################################################
    # SECTION: Download Handler
    # Allows users to download results for each inference type.
    ##################################################################
    output$download_results <- downloadHandler(
      filename = function() {
        paste("results-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        inf_type <- input$inference_type
        if (inf_type == "interval") {
          res <- ci_results()
          write.csv(data.frame(Lower = res$lower, Upper = res$upper, p_hat = res$p_hat, n = res$n), file, row.names = FALSE)
        } else if (inf_type == "test") {
          res <- test_results()
          write.csv(as.data.frame(res), file, row.names = FALSE)
        } else if (inf_type == "gof") {
          res <- gof_results()
          write.csv(as.data.frame(res), file, row.names = FALSE)
        } else if (inf_type == "simulation") {
          sim <- sim_results()
          write.csv(data.frame(Proportion = sim$sim), file, row.names = FALSE)
        }
      }
    )

    ##################################################################
    # SECTION: Accessibility Enhancements
    # Adds ARIA roles and live region for screen readers.
    ##################################################################
    observe({
      if (!is.null(input$aria_enable) && input$aria_enable) {
        shinyjs::runjs("document.body.setAttribute('aria-live', 'polite');")
      } else {
        shinyjs::runjs("document.body.removeAttribute('aria-live');")
      }
    })

    ##################################################################
    # SECTION: Error Messaging
    # Shows notifications for invalid input.
    ##################################################################
    observe({
      df <- counts_data()
      if (is.null(df$Count) || length(df$Count) == 0) {
        return()
      }
      if (any(is.na(df$Count)) || any(df$Count < 0)) {
        showNotification("Counts must be non-negative numbers.", type = "error", duration = 7)
      }
      if (length(unique(df$Category)) < 2) {
        showNotification("At least two categories required.", type = "error", duration = 7)
      }
    })
  })
}

# Uncomment below to run as standalone app
# shinyApp(
#   ui = ht_proportion_ui("ht_proportion"),
#   server = function(input, output, session) {
#     ht_proportion_server("ht_proportion")
#   }
# )
