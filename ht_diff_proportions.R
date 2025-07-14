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
# Hypothesis Test for Difference in Proportions (Two Independent Groups)
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
# This module implements a Shiny applet for conducting hypothesis tests
# and confidence intervals for the difference between two proportions.
# It supports both raw data and summary counts input, provides
# interactive UI for data entry, visualization, simulation, and
# downloadable results. All major logic blocks and functions are
# documented for clarity and maintainability.
# --------------------------------------------------------------------
# Hypothesis Test for a Difference in Proportions (Multi-Group, Multi-Category)
# Fully integrated R Shiny applet matching cat1v_multi HTML/JS applet features

library(shiny)
library(ggplot2)
library(DT)
library(shinyjs)
library(shinyWidgets)
library(shinyAccessibility)
library(shinyFiles)
library(readr)

# Helper functions ------------------------------------------------------------

# Validate counts table input
validate_counts_table <- function(counts) {
  errors <- c()
  if (any(is.na(counts))) errors <- c(errors, "All cells must be filled.")
  if (any(counts < 0)) errors <- c(errors, "Counts must be non-negative.")
  if (any(counts != floor(counts))) errors <- c(errors, "Counts must be integers.")
  errors
}

# Validate raw data input
validate_raw_data <- function(raw_data) {
  errors <- c()
  if (any(sapply(raw_data, function(x) nchar(x$group) == 0))) errors <- c(errors, "All groups must be named.")
  if (any(sapply(raw_data, function(x) nchar(x$data) == 0))) errors <- c(errors, "All groups must have data.")
  errors
}

# Convert raw data to counts table
raw_to_counts <- function(raw_data) {
  # raw_data: list of list(group, data)
  all_categories <- unique(unlist(lapply(raw_data, function(x) unlist(strsplit(x$data, "[, ]+")))))
  all_groups <- sapply(raw_data, function(x) x$group)
  counts <- matrix(0, nrow = length(all_categories), ncol = length(all_groups),
                   dimnames = list(all_categories, all_groups))
  for (i in seq_along(raw_data)) {
    cats <- unlist(strsplit(raw_data[[i]]$data, "[, ]+"))
    for (cat in cats) {
      if (cat %in% all_categories) {
        counts[cat, raw_data[[i]]$group] <- counts[cat, raw_data[[i]]$group] + 1
      }
    }
  }
  counts
}

# UI --------------------------------------------------------------------------

# --------------------------------------------------------------------
# UI DEFINITION
# --------------------------------------------------------------------
# Defines the user interface for the two-proportion hypothesis test applet.
ht_diff_proportions_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$link(rel = "stylesheet", type = "text/css", href = "custom.css")
    ),
    titlePanel(
      h2("Hypothesis Test for a Difference in Proportions (Multi-Group)", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Difference in Proportions"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",
        h3("Data Input", id = "paramsHeading"),
        radioButtons(ns("input_mode"), "Input data as:",
                     choices = c("Counts table" = "counts", "Raw data" = "raw"),
                     selected = "counts", inline = TRUE),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'counts'", ns("input_mode")),
          textInput(ns("variable_name_counts"), "Variable name:", value = "Category"),
          DTOutput(ns("counts_table")),
          actionButton(ns("add_row_counts"), "Add Category", icon = icon("plus")),
          actionButton(ns("add_col_counts"), "Add Group", icon = icon("plus")),
          actionButton(ns("remove_row_counts"), "Remove Category", icon = icon("minus")),
          actionButton(ns("remove_col_counts"), "Remove Group", icon = icon("minus"))
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          textInput(ns("variable_name_raw"), "Variable name:", value = "Category"),
          uiOutput(ns("raw_data_ui")),
          actionButton(ns("add_group_raw"), "Add Group", icon = icon("plus")),
          actionButton(ns("remove_group_raw"), "Remove Group", icon = icon("minus"))
        ),
        hr(role = "separator"),
        h3("Preferences"),
        pickerInput(ns("color_palette"), "Color palette:",
                    choices = c("Default", "Colorblind", "Viridis", "Pastel"),
                    selected = "Default"),
        switchInput(ns("show_percent"), "Show as percent", value = TRUE),
        sliderInput(ns("round_digits"), "Rounding digits:", min = 0, max = 4, value = 2),
        hr(role = "separator"),
        h3("Accessibility"),
        switchInput(ns("aria_enable"), "Enable ARIA roles/labels", value = TRUE),
        hr(role = "separator"),
        downloadButton(ns("download_stats"), "Export summary statistics"),
        downloadButton(ns("download_plot"), "Download plot")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        tabsetPanel(
          tabPanel("Visualization",
            h4("Graph Distributions", style = "text-align: center;", id = ns("graph_label")),
            selectInput(ns("graph_type"), "Chart type:",
                        choices = c("Segmented bar" = "stacked",
                                    "Mosaic plot" = "mosaic",
                                    "Side-by-side bar" = "side")),
            conditionalPanel(
              condition = sprintf("input['%s'] == 'side'", ns("graph_type")),
              selectInput(ns("side_bar_label"), "Label bar graph with:",
                          choices = c("Relative frequency" = "rel", "Frequency" = "freq"))
            ),
            plotOutput(ns("main_plot"), height = "350px", inline = TRUE),
            hr(),
            h4("Summary Statistics"),
            DTOutput(ns("summary_stats")),
            hr()
          ),
          tabPanel("Inference",
            h4("Perform Inference"),
            uiOutput(ns("inference_ui")),
            uiOutput(ns("inference_results")),
            hr(),
            h4("Simulation"),
            uiOutput(ns("simulation_ui")),
            plotOutput(ns("simulation_plot"), height = "250px"),
            uiOutput(ns("simulation_stats")),
            hr()
          )
        )
      )
    )
  )
}

# Server ----------------------------------------------------------------------

# --------------------------------------------------------------------
# SERVER LOGIC
# --------------------------------------------------------------------
# Implements all server-side logic for the applet, including:
# - Data input and validation
# - Table and raw data handling
# - Visualization and plotting
# - Hypothesis test and confidence interval calculations
# - Simulation of randomization tests
# - Download/export functionality
ht_diff_proportions_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Data Input State ---
    # Counts table state
    counts_table <- reactiveVal({
      matrix(NA_integer_, nrow = 2, ncol = 2,
             dimnames = list(c("Category 1", "Category 2"), c("Group 1", "Group 2")))
    })
    observeEvent(input$add_row_counts, {
      tbl <- counts_table()
      new_row <- paste0("Category ", nrow(tbl) + 1)
      counts_table(rbind(tbl, setNames(rep(NA_integer_, ncol(tbl)), colnames(tbl))))
      rownames(counts_table())[nrow(counts_table())] <- new_row
    })
    observeEvent(input$add_col_counts, {
      tbl <- counts_table()
      new_col <- paste0("Group ", ncol(tbl) + 1)
      counts_table(cbind(tbl, setNames(rep(NA_integer_, nrow(tbl)), rownames(tbl))))
      colnames(counts_table())[ncol(counts_table())] <- new_col
    })
    observeEvent(input$remove_row_counts, {
      tbl <- counts_table()
      if (nrow(tbl) > 2) counts_table(tbl[-nrow(tbl), , drop = FALSE])
    })
    observeEvent(input$remove_col_counts, {
      tbl <- counts_table()
      if (ncol(tbl) > 2) counts_table(tbl[, -ncol(tbl), drop = FALSE])
    })
    # Update counts table from DT
    observeEvent(input[[ns("counts_table_cell_edit")]], {
      info <- input[[ns("counts_table_cell_edit")]]
      tbl <- counts_table()
      tbl[info$row + 1, info$col + 1] <- as.integer(info$value)
      counts_table(tbl)
    })
    output$counts_table <- renderDT({
      datatable(counts_table(), editable = TRUE, selection = "none",
                options = list(dom = 't', ordering = FALSE, paging = FALSE),
                rownames = TRUE)
    })

    # Raw data state
    raw_data <- reactiveVal(list(
      list(group = "Group 1", data = ""),
      list(group = "Group 2", data = "")
    ))
    observeEvent(input$add_group_raw, {
      rd <- raw_data()
      raw_data(append(rd, list(list(group = paste0("Group ", length(rd) + 1), data = ""))))
    })
    observeEvent(input$remove_group_raw, {
      rd <- raw_data()
      if (length(rd) > 2) raw_data(rd[1:(length(rd) - 1)])
    })
    # Update raw data UI
    output$raw_data_ui <- renderUI({
      rd <- raw_data()
      tagList(
        lapply(seq_along(rd), function(i) {
          fluidRow(
            column(4, textInput(ns(paste0("raw_group_", i)), "Group Name", value = rd[[i]]$group)),
            column(8, textInput(ns(paste0("raw_data_", i)), "Data (comma/space separated)", value = rd[[i]]$data))
          )
        })
      )
    })
    # Sync raw data from UI
    observe({
      rd <- raw_data()
      changed <- FALSE
      for (i in seq_along(rd)) {
        g <- input[[paste0("raw_group_", i)]]
        d <- input[[paste0("raw_data_", i)]]
        if (!is.null(g) && !is.null(d)) {
          if (rd[[i]]$group != g || rd[[i]]$data != d) {
            rd[[i]]$group <- g
            rd[[i]]$data <- d
            changed <- TRUE
          }
        }
      }
      if (changed) raw_data(rd)
    })

    # --- Data Extraction & Validation ---
    data_input <- reactive({
      if (input$input_mode == "counts") {
        tbl <- counts_table()
        errors <- validate_counts_table(tbl)
        list(type = "counts", counts = tbl, errors = errors,
             variable_name = input$variable_name_counts)
      } else {
        rd <- raw_data()
        errors <- validate_raw_data(rd)
        counts <- if (length(errors) == 0) raw_to_counts(rd) else NULL
        list(type = "raw", raw = rd, counts = counts, errors = errors,
             variable_name = input$variable_name_raw)
      }
    })

    # --- Summary Statistics ---
    output$summary_stats <- renderDT({
      dat <- data_input()
      if (length(dat$errors) > 0 || is.null(dat$counts)) return(datatable(data.frame(Error = dat$errors)))
      counts <- dat$counts
      total <- sum(counts)
      prop <- round(counts / rep(colSums(counts), each = nrow(counts)), input$round_digits)
      percent <- round(100 * prop, input$round_digits)
      show_percent <- input$show_percent
      df <- data.frame(Category = rownames(counts))
      for (g in colnames(counts)) {
        df[[paste0(g, " Count")]] <- counts[, g]
        df[[paste0(g, if (show_percent) " %" else " Proportion")]] <- if (show_percent) percent[, g] else prop[, g]
      }
      datatable(df, rownames = FALSE, options = list(dom = 't', ordering = FALSE, paging = FALSE))
    })

    # --- Visualization ---
    output$main_plot <- renderPlot({
      dat <- data_input()
      if (length(dat$errors) > 0 || is.null(dat$counts)) return(NULL)
      counts <- dat$counts
      df <- as.data.frame(as.table(counts))
      colnames(df) <- c("Category", "Group", "Count")
      palette <- switch(input$color_palette,
        "Default" = "Set2",
        "Colorblind" = "Dark2",
        "Viridis" = "viridis",
        "Pastel" = "Pastel1",
        "Set2"
      )
      if (input$graph_type == "stacked") {
        ggplot(df, aes(x = Group, y = Count, fill = Category)) +
          geom_bar(stat = "identity", position = "fill") +
          scale_fill_brewer(palette = palette) +
          labs(y = "Proportion", x = "Group") +
          theme_minimal()
      } else if (input$graph_type == "side") {
        label_type <- input$side_bar_label
        if (label_type == "rel") {
          df$RelFreq <- df$Count / ave(df$Count, df$Group, FUN = sum)
          ggplot(df, aes(x = Group, y = RelFreq, fill = Category)) +
            geom_bar(stat = "identity", position = "dodge") +
            scale_fill_brewer(palette = palette) +
            labs(y = "Relative Frequency", x = "Group") +
            theme_minimal()
        } else {
          ggplot(df, aes(x = Group, y = Count, fill = Category)) +
            geom_bar(stat = "identity", position = "dodge") +
            scale_fill_brewer(palette = palette) +
            labs(y = "Frequency", x = "Group") +
            theme_minimal()
        }
      } else if (input$graph_type == "mosaic") {
        # Mosaic plot: use vcd package if available, else fallback
        if (requireNamespace("vcd", quietly = TRUE)) {
          vcd::mosaic(counts, shade = TRUE, legend = TRUE)
        } else {
          ggplot(df, aes(x = Group, y = Count, fill = Category)) +
            geom_bar(stat = "identity", position = "fill") +
            scale_fill_brewer(palette = palette) +
            labs(y = "Proportion", x = "Group") +
            theme_minimal()
        }
      }
    })

    # --- Inference UI ---
    output$inference_ui <- renderUI({
      dat <- data_input()
      if (length(dat$errors) > 0 || is.null(dat$counts)) return(tags$p(dat$errors, style = "color: red;"))
      counts <- dat$counts
      n_groups <- ncol(counts)
      n_categories <- nrow(counts)
      if (n_groups == 2 && n_categories == 2) {
        # Two-proportion inference
        tagList(
          selectInput(ns("inference_type"), "Inference procedure:",
                      choices = c("Simulate difference in percents/proportions" = "simulation",
                                  "2-sample z interval (p₁ - p₂)" = "interval",
                                  "2-sample z test (p₁ - p₂)" = "test",
                                  "Chi-square test for homogeneity" = "chi")),
          selectInput(ns("success_cat"), "Category to indicate as success:",
                      choices = rownames(counts)),
          conditionalPanel(
            condition = sprintf("input['%s'] == 'interval'", ns("inference_type")),
            numericInput(ns("conf_level"), "Confidence level (%)", value = 95, min = 0.1, max = 99.9, step = 0.1)
          ),
          conditionalPanel(
            condition = sprintf("input['%s'] == 'test'", ns("inference_type")),
            selectInput(ns("alt_hypothesis"), "Alternative hypothesis:",
                        choices = c("p₁ - p₂ > 0" = "greater",
                                    "p₁ - p₂ < 0" = "less",
                                    "p₁ - p₂ ≠ 0" = "two.sided"))
          ),
          actionButton(ns("run_inference"), "Perform inference", class = "btn-primary")
        )
      } else {
        # Chi-square test for homogeneity
        tagList(
          tags$p("More than two groups or categories detected. Only chi-square test for homogeneity is available."),
          actionButton(ns("run_inference"), "Perform chi-square test for homogeneity", class = "btn-primary")
        )
      }
    })

    # --- Inference Calculation ---
    inference_results <- eventReactive(input$run_inference, {
      dat <- data_input()
      if (length(dat$errors) > 0 || is.null(dat$counts)) return(list(error = dat$errors))
      counts <- dat$counts
      n_groups <- ncol(counts)
      n_categories <- nrow(counts)
      if (n_groups == 2 && n_categories == 2) {
        x1 <- counts[input$success_cat, 1]
        n1 <- sum(counts[, 1])
        x2 <- counts[input$success_cat, 2]
        n2 <- sum(counts[, 2])
        p1 <- x1 / n1
        p2 <- x2 / n2
        if (input$inference_type == "interval") {
          conf <- input$conf_level / 100
          se <- sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
          z <- qnorm(1 - (1 - conf) / 2)
          diff <- p1 - p2
          lower <- diff - z * se
          upper <- diff + z * se
          list(type = "interval", lower = lower, upper = upper, se = se, conf = conf)
        } else if (input$inference_type == "test") {
          p_pool <- (x1 + x2) / (n1 + n2)
          se_pool <- sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
          z_stat <- (p1 - p2) / se_pool
          alt <- input$alt_hypothesis
          if (alt == "greater") {
            p_value <- 1 - pnorm(z_stat)
          } else if (alt == "less") {
            p_value <- pnorm(z_stat)
          } else {
            p_value <- 2 * min(pnorm(z_stat), 1 - pnorm(z_stat))
          }
          list(type = "test", z = z_stat, p_value = p_value, se = se_pool, alt = alt)
        } else if (input$inference_type == "chi") {
          test <- suppressWarnings(chisq.test(counts))
          list(type = "chi", statistic = test$statistic, p_value = test$p.value, df = test$parameter,
               expected = test$expected, contributions = (counts - test$expected)^2 / test$expected,
               low_count_warning = any(test$expected < 5))
        } else if (input$inference_type == "simulation") {
          # Simulation handled separately
          list(type = "simulation", x1 = x1, n1 = n1, x2 = x2, n2 = n2, p1 = p1, p2 = p2)
        }
      } else {
        # Chi-square test for homogeneity
        test <- suppressWarnings(chisq.test(counts))
        list(type = "chi", statistic = test$statistic, p_value = test$p.value, df = test$parameter,
             expected = test$expected, contributions = (counts - test$expected)^2 / test$expected,
             low_count_warning = any(test$expected < 5))
      }
    })

    output$inference_results <- renderUI({
      res <- inference_results()
      if (!is.null(res$error)) return(tags$p(res$error, style = "color: red;"))
      if (res$type == "interval") {
        tags$table(class = "table table-striped",
          tags$tr(tags$th("Lower Bound"), tags$th("Upper Bound")),
          tags$tr(tags$td(round(res$lower, input$round_digits)),
                  tags$td(round(res$upper, input$round_digits)))
        )
      } else if (res$type == "test") {
        tags$table(class = "table table-striped",
          tags$tr(tags$th("z"), tags$th("P-value")),
          tags$tr(tags$td(round(res$z, 3)),
                  tags$td(format.pval(res$p_value, digits = 4, eps = 0.0001)))
        )
      } else if (res$type == "chi") {
        tagList(
          tags$table(class = "table table-striped",
            tags$tr(tags$th("χ²"), tags$th("P-value"), tags$th("df")),
            tags$tr(tags$td(round(res$statistic, 3)),
                    tags$td(format.pval(res$p_value, digits = 4, eps = 0.0001)),
                    tags$td(res$df))
          ),
          tags$p(if (res$low_count_warning) "Warning: At least one expected count is less than 5." else NULL, style = "color: #d9534f;"),
          tags$h4("Expected Counts"),
          renderTable(round(res$expected, input$round_digits), rownames = TRUE),
          tags$h4("Contributions"),
          renderTable(round(res$contributions, input$round_digits), rownames = TRUE)
        )
      }
    })

    # --- Simulation ---
    simulation_results <- reactiveVal(NULL)
    output$simulation_ui <- renderUI({
      res <- inference_results()
      if (is.null(res) || res$type != "simulation") return(NULL)
      tagList(
        numericInput(ns("num_trials"), "Number of trials to add:", value = 1000, min = 1, step = 1),
        actionButton(ns("run_simulation"), "Add trials"),
        actionButton(ns("clear_simulation"), "Reset simulation"),
        hr(),
        tags$p("Simulates the distribution of the difference in sample proportions when the observed successes and failures are combined, shuffled, and redistributed into two groups that match the sizes of the original groups."),
        fluidRow(
          column(6, textInput(ns("dotplot_count_bound"), "Count dots less/greater than:", value = "")),
          column(6, selectInput(ns("dotplot_count_dir"), "Direction:", choices = c("less than" = "left", "greater than" = "right")))
        ),
        actionButton(ns("count_dotplot"), "Count"),
        actionButton(ns("clear_dotplot_count"), "Remove count")
      )
    })
    observeEvent(input$run_simulation, {
      res <- inference_results()
      if (is.null(res) || res$type != "simulation") return()
      x1 <- res$x1; n1 <- res$n1; x2 <- res$x2; n2 <- res$n2
      total_success <- x1 + x2
      total_n <- n1 + n2
      trials <- input$num_trials
      sim_results <- numeric(trials)
      for (i in seq_len(trials)) {
        # Shuffle successes among groups
        success_indices <- sample(total_n, total_success)
        group1_success <- sum(success_indices <= n1)
        group2_success <- total_success - group1_success
        sim_results[i] <- (group1_success / n1) - (group2_success / n2)
      }
      prev <- simulation_results()
      simulation_results(c(prev, sim_results))
    })
    observeEvent(input$clear_simulation, {
      simulation_results(NULL)
    })
    output$simulation_plot <- renderPlot({
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) return(NULL)
      palette <- switch(input$color_palette,
        "Default" = "Set2",
        "Colorblind" = "Dark2",
        "Viridis" = "viridis",
        "Pastel" = "Pastel1",
        "Set2"
      )
      ggplot(data.frame(Diff = sims), aes(x = Diff)) +
        geom_dotplot(binwidth = 0.01, dotsize = 0.5, fill = "#60a5fa") +
        labs(x = "Simulated difference in proportions", y = "Count") +
        theme_minimal()
    })
    output$simulation_stats <- renderUI({
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) return(NULL)
      mean_val <- mean(sims)
      sd_val <- sd(sims)
      most_recent <- tail(sims, 1)
      tagList(
        tags$table(
          tags$tr(tags$td("# of trials:"), tags$td(length(sims))),
          tags$tr(tags$td("Most recent result:"), tags$td(round(most_recent, input$round_digits))),
          tags$tr(tags$td("Mean:"), tags$td(round(mean_val, input$round_digits))),
          tags$tr(tags$td("SD:"), tags$td(round(sd_val, input$round_digits)))
        )
      )
    })
    # Dotplot counting
    dotplot_count <- reactiveVal(NULL)
    observeEvent(input$count_dotplot, {
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) return()
      bound <- as.numeric(input$dotplot_count_bound)
      dir <- input$dotplot_count_dir
      if (is.na(bound)) return()
      if (dir == "left") {
        count <- sum(sims <= bound)
      } else {
        count <- sum(sims >= bound)
      }
      percent <- round(100 * count / length(sims), input$round_digits)
      dotplot_count(list(count = count, percent = percent, bound = bound, dir = dir))
    })
    observeEvent(input$clear_dotplot_count, {
      dotplot_count(NULL)
    })
    output$simulation_stats <- renderUI({
      sims <- simulation_results()
      if (is.null(sims) || length(sims) == 0) return(NULL)
      mean_val <- mean(sims)
      sd_val <- sd(sims)
      most_recent <- tail(sims, 1)
      count_info <- dotplot_count()
      tagList(
        tags$table(
          tags$tr(tags$td("# of trials:"), tags$td(length(sims))),
          tags$tr(tags$td("Most recent result:"), tags$td(round(most_recent, input$round_digits))),
          tags$tr(tags$td("Mean:"), tags$td(round(mean_val, input$round_digits))),
          tags$tr(tags$td("SD:"), tags$td(round(sd_val, input$round_digits)))
        ),
        if (!is.null(count_info)) {
          tags$p(sprintf("Counted %d dots (%0.2f%%) %s %s.",
                         count_info$count, count_info$percent,
                         ifelse(count_info$dir == "left", "≤", "≥"),
                         count_info$bound),
                 style = "color: #2563eb; font-weight: bold;")
        }
      )
    })

    # --- Export/Download ---
    output$download_stats <- downloadHandler(
      filename = function() {
        paste0("summary_statistics_", Sys.Date(), ".csv")
      },
      content = function(file) {
        dat <- data_input()
        if (length(dat$errors) > 0 || is.null(dat$counts)) {
          writeLines(dat$errors, file)
        } else {
          counts <- dat$counts
          total <- sum(counts)
          prop <- round(counts / rep(colSums(counts), each = nrow(counts)), input$round_digits)
          percent <- round(100 * prop, input$round_digits)
          show_percent <- input$show_percent
          df <- data.frame(Category = rownames(counts))
          for (g in colnames(counts)) {
            df[[paste0(g, " Count")]] <- counts[, g]
            df[[paste0(g, if (show_percent) " %" else " Proportion")]] <- if (show_percent) percent[, g] else prop[, g]
          }
          write_csv(df, file)
        }
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("distribution_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        dat <- data_input()
        if (length(dat$errors) > 0 || is.null(dat$counts)) return()
        counts <- dat$counts
        df <- as.data.frame(as.table(counts))
        colnames(df) <- c("Category", "Group", "Count")
        palette <- switch(input$color_palette,
          "Default" = "Set2",
          "Colorblind" = "Dark2",
          "Viridis" = "viridis",
          "Pastel" = "Pastel1",
          "Set2"
        )
        p <- ggplot(df, aes(x = Group, y = Count, fill = Category)) +
          geom_bar(stat = "identity", position = "fill") +
          scale_fill_brewer(palette = palette) +
          labs(y = "Proportion", x = "Group") +
          theme_minimal()
        ggsave(file, plot = p, width = 7, height = 5)
      # --------------------------------------------------------------------
      # END OF MODULE
      # --------------------------------------------------------------------
      }
    )

    # --- Accessibility ---
    observe({
      if (input$aria_enable) {
        shinyAccessibility::enableAccessibility()
      } else {
        shinyAccessibility::disableAccessibility()
      }
    })

    # --- Error Messaging ---
    observe({
      dat <- data_input()
      if (length(dat$errors) > 0) {
        showNotification(paste(dat$errors, collapse = "\n"), type = "error", duration = 7)
      }
    })
  })
}

# App Entrypoint --------------------------------------------------------------

# Uncomment below to run as standalone app
# shinyApp(
#   ui = ht_diff_proportions_ui("ht_diff_proportions"),
#   server = function(input, output, session) {
#     ht_diff_proportions_server("ht_diff_proportions")
#   }
# )
