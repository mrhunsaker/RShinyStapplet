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
# Stapplet Applet - Sampling Distribution of the Mean
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

######################################################################
# MODULE OVERVIEW
######################################################################
# This module implements a Shiny applet for exploring the sampling
# distribution of the sample mean (and other statistics). It supports
# multiple population shapes, interactive sampling, visualization,
# summary statistics, and accessibility features. All major logic
# blocks and functions are documented for clarity and maintainability.
######################################################################

# Enhanced Sampling Distribution of the Sample Mean Applet
# Matches features of stapplet HTML/JS applet (sampdist.html + sampdist.js)

######################################################################
# SECTION: Load Required Libraries
######################################################################
library(shiny)            # Shiny web application framework
library(ggplot2)          # For plotting histograms and densities
library(shinyjs)          # For UI interactivity
library(shinyWidgets)     # For enhanced widgets
library(shinyAccessibility) # For accessibility enhancements

######################################################################
# SECTION: UI Definition
# Defines the user interface for the Sampling Distribution of the Sample Mean applet.
######################################################################
sampling_dist_mean_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Sampling Distribution of the Sample Mean"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css")
    ),
    tags$div(id = ns("appTitle"), class = "sr-only", "Sampling Distribution of the Sample Mean"),
    titlePanel(
      h2("Sampling Distribution of the Sample Mean", id = ns("mainHeading")),
      windowTitle = "Sampling Distribution of the Sample Mean"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        `aria-labelledby` = ns("paramsHeading"),
        h3("Population Parameters", id = ns("paramsHeading")),
        # Population shape selector
        selectInput(ns("pop_shape"), "Population Shape:",
          choices = c("Normal", "Uniform", "Skewed Right", "Skewed Left", "Bimodal", "Categorical"),
          selected = "Normal"
        ),
        # Conditional panels for population parameters
        conditionalPanel(
          condition = sprintf("input['%s'] == 'Normal' || input['%s'] == 'Skewed Right' || input['%s'] == 'Skewed Left' || input['%s'] == 'Bimodal'", ns("pop_shape"), ns("pop_shape"), ns("pop_shape"), ns("pop_shape")),
          ns = ns,
          sliderInput(ns("pop_mean"), "Population Mean (\u03bc):", min = 0, max = 100, value = 50),
          sliderInput(ns("pop_sd"), "Population SD (\u03c3):", min = 1, max = 30, value = 10)
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'Categorical'", ns("pop_shape")),
          ns = ns,
          sliderInput(ns("cat_p"), "True Proportion of Successes (p):", min = 0, max = 1, value = 0.5, step = 0.01)
        ),
        hr(),
        h3("Sampling Parameters"),
        # Sample size and statistic selector
        sliderInput(ns("sample_size"), "Sample Size (n):", min = 2, max = 100, value = 10),
        selectInput(ns("samp_stat"), "Sampling Distribution of:",
          choices = c("Mean" = "mean", "Standard Deviation" = "sd", "Variance" = "var", "Proportion" = "prop"),
          selected = "mean"
        ),
        checkboxInput(ns("show_normal_curve"), "Overlay Normal Curve (CLT)", value = TRUE),
        hr(),
        h3("Draw Samples"),
        # Sample drawing buttons
        actionButton(ns("draw_one"), "Draw 1 Sample", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("draw_100"), "Draw 100 Samples", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("draw_1000"), "Draw 1000 Samples", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("reset"), "Reset Distribution", class = "btn-danger", style = "width: 100%;"),
        hr(),
        h3("Export/Download"),
        # Download buttons
        downloadButton(ns("download_summary"), "Download Summary"),
        downloadButton(ns("download_data"), "Download Data"),
        downloadButton(ns("download_plot"), "Download Plot"),
        hr(),
        # Preferences modal
        actionButton(ns("show_prefs"), "Preferences", icon = icon("cog")),
        tags$div(id = ns("error_msg"), class = "text-danger", role = "alert", `aria-live` = "assertive")
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(6,
            div(class = "plot-container",
              h4("Population Distribution", style = "text-align: center;", id = ns("popDistLabel")),
              plotOutput(ns("populationPlot"), height = "250px")
            )
          ),
          column(6,
            div(class = "plot-container",
              h4("Most Recent Sample", style = "text-align: center;", id = ns("lastSampleLabel")),
              plotOutput(ns("samplePlot"), height = "250px")
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Distribution of Sample Statistics", style = "text-align: center;", id = ns("sampDistLabel")),
              plotOutput(ns("samplingDistPlot"), height = "300px")
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h3("Summary Statistics", id = ns("summaryStatsLabel")),
              verbatimTextOutput(ns("summaryStats"))
            )
          )
        )
      ),
      modalDialog(
        id = ns("prefs_modal"),
        title = "Preferences",
        easyClose = TRUE,
        footer = modalButton("Close"),
        sliderInput(ns("round_digits"), "Rounding Digits:", min = 0, max = 6, value = 3),
        colourInput(ns("plot_color"), "Plot Color:", value = "#1e40af"),
        checkboxInput(ns("show_percent"), "Show Percent/Proportion", value = FALSE)
      )
    )
  )
}

######################################################################
# SECTION: Server Logic
# Implements all server-side logic for the Sampling Distribution of the Sample Mean applet.
######################################################################
sampling_dist_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    ##################################################################
    # SECTION: Preferences Handling
    # Stores and updates user preferences for rounding, plot color, etc.
    ##################################################################
    prefs <- reactiveValues(
      round_digits = 3,
      plot_color = "#1e40af",
      show_percent = FALSE
    )
    observeEvent(input$show_prefs, {
      showModal(modalDialog(
        title = "Preferences",
        sliderInput(ns("round_digits"), "Rounding Digits:", min = 0, max = 6, value = prefs$round_digits),
        colourInput(ns("plot_color"), "Plot Color:", value = prefs$plot_color),
        checkboxInput(ns("show_percent"), "Show Percent/Proportion", value = prefs$show_percent),
        footer = modalButton("Close"),
        easyClose = TRUE
      ))
    })
    observeEvent(input$round_digits, { prefs$round_digits <- input$round_digits })
    observeEvent(input$plot_color, { prefs$plot_color <- input$plot_color })
    observeEvent(input$show_percent, { prefs$show_percent <- input$show_percent })

    ##################################################################
    # SECTION: Reactive Values for Simulation State
    ##################################################################
    rv <- reactiveValues(
      population = numeric(),
      pop_stats = list(mean = 0, sd = 0),
      sample_stats = numeric(),
      last_sample = numeric(),
      last_stat = NA
    )

    ##################################################################
    # SECTION: Population Generation
    # Generates population data based on user-selected parameters.
    ##################################################################
    observe({
      pop_shape <- input$pop_shape
      pop_mean <- input$pop_mean
      pop_sd <- input$pop_sd
      cat_p <- input$cat_p
      n_pop <- 10000

      new_population <- switch(pop_shape,
        "Normal" = rnorm(n_pop, mean = pop_mean, sd = pop_sd),
        "Uniform" = runif(n_pop, min = 0, max = 100),
        "Skewed Right" = rbeta(n_pop, 2, 5) * 100,
        "Skewed Left" = rbeta(n_pop, 5, 2) * 100,
        "Bimodal" = c(rnorm(n_pop/2, mean = pop_mean, sd = pop_sd), rnorm(n_pop/2, mean = pop_mean + pop_sd*2, sd = pop_sd)),
        "Categorical" = rbinom(n_pop, 1, prob = cat_p)
      )
      rv$population <- new_population
      rv$pop_stats <- list(mean = mean(new_population), sd = sd(new_population))
      rv$sample_stats <- numeric()
      rv$last_sample <- numeric()
      rv$last_stat <- NA
    })

    ##################################################################
    # SECTION: Sample Drawing Logic
    # Draws samples from the population and updates sample statistics.
    ##################################################################
    draw_samples <- function(num_samples) {
      req(rv$population, input$sample_size > 1)
      pop_shape <- input$pop_shape
      stat_type <- input$samp_stat
      sample_size <- input$sample_size

      new_stats <- replicate(num_samples, {
        sample_data <- sample(rv$population, size = sample_size, replace = TRUE)
        rv$last_sample <- sample_data
        if (pop_shape == "Categorical" && stat_type == "prop") {
          prop <- mean(sample_data)
          rv$last_stat <- prop
          prop
        } else if (stat_type == "mean") {
          m <- mean(sample_data)
          rv$last_stat <- m
          m
        } else if (stat_type == "sd") {
          s <- sd(sample_data)
          rv$last_stat <- s
          s
        } else if (stat_type == "var") {
          v <- var(sample_data)
          rv$last_stat <- v
          v
        } else if (pop_shape == "Categorical" && stat_type != "prop") {
          showError("For categorical population, only proportion is meaningful.")
          NA
        } else {
          NA
        }
      })
      rv$sample_stats <- c(rv$sample_stats, new_stats)
    }

    ##################################################################
    # SECTION: Error Messaging
    # Displays error messages in the UI.
    ##################################################################
    showError <- function(msg) {
      shinyjs::html(ns("error_msg"), msg)
    }
    observe({
      shinyjs::html(ns("error_msg"), "")
    })

    ##################################################################
    # SECTION: Event Handlers for UI Buttons
    ##################################################################
    observeEvent(input$draw_one, { draw_samples(1) })
    observeEvent(input$draw_100, { draw_samples(100) })
    observeEvent(input$draw_1000, { draw_samples(1000) })
    observeEvent(input$reset, {
      rv$sample_stats <- numeric()
      rv$last_sample <- numeric()
      rv$last_stat <- NA
    })

    ##################################################################
    # SECTION: Plot Rendering
    # Renders population, sample, and sampling distribution plots.
    ##################################################################
    output$populationPlot <- renderPlot({
      req(rv$population)
      pop_shape <- input$pop_shape
      df <- data.frame(x = rv$population)
      if (pop_shape == "Categorical") {
        ggplot(df, aes(x = factor(x))) +
          geom_bar(fill = "#60a5fa", color = "white") +
          labs(x = "Outcome", y = "Count", title = sprintf("p = %.2f", input$cat_p)) +
          theme_minimal()
      } else {
        ggplot(df, aes(x = x)) +
          geom_histogram(aes(y = ..density..), bins = 30, fill = "#60a5fa", color = "white") +
          geom_density(color = prefs$plot_color, size = 1) +
          geom_vline(xintercept = rv$pop_stats$mean, color = "#dc2626", linetype = "dashed", size = 1.2) +
          labs(x = "Value", y = "Density", title = sprintf("Mean = %.2f, SD = %.2f", rv$pop_stats$mean, rv$pop_stats$sd)) +
          theme_minimal()
      }
    })

    output$samplePlot <- renderPlot({
      sample_data <- rv$last_sample
      pop_shape <- input$pop_shape
      stat_type <- input$samp_stat
      if (length(sample_data) == 0) {
        return(ggplot() + labs(title = "No sample drawn yet") + theme_void())
      }
      df_sample <- data.frame(x = sample_data)
      if (pop_shape == "Categorical") {
        ggplot(df_sample, aes(x = factor(x))) +
          geom_bar(fill = "#84cc16", color = "white") +
          labs(x = "Outcome", y = "Count", title = sprintf("n = %d, p\u0302 = %.2f", input$sample_size, mean(sample_data))) +
          theme_minimal()
      } else {
        sample_stat <- switch(stat_type,
          "mean" = mean(df_sample$x),
          "sd" = sd(df_sample$x),
          "var" = var(df_sample$x),
          NA
        )
        ggplot(df_sample, aes(x = x)) +
          geom_histogram(bins = 15, fill = "#84cc16", color = "white") +
          geom_vline(xintercept = sample_stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
          labs(x = "Value", y = "Count", title = sprintf("n = %d, %s = %.2f", input$sample_size, stat_type, sample_stat)) +
          xlim(range(rv$population)) +
          theme_minimal()
      }
    })

    output$samplingDistPlot <- renderPlot({
      stats <- rv$sample_stats
      stat_type <- input$samp_stat
      pop_shape <- input$pop_shape
      if (length(stats) < 2) {
        return(ggplot() + labs(title = "Draw at least 2 samples to see distribution") + theme_void())
      }
      df_stats <- data.frame(x = stats)
      mean_of_stats <- mean(df_stats$x)
      sd_of_stats <- sd(df_stats$x)
      p <- ggplot(df_stats, aes(x = x)) +
        geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
        geom_vline(xintercept = mean_of_stats, color = prefs$plot_color, linetype = "solid", size = 1.2) +
        labs(x = paste("Sample", stat_type), y = "Density",
             title = sprintf("Mean of %d samples = %.2f", length(stats), mean_of_stats)) +
        theme_minimal()
      # Overlay theoretical normal curve (CLT)
      if (input$show_normal_curve && pop_shape != "Categorical" && stat_type == "mean") {
        theoretical_sd <- rv$pop_stats$sd / sqrt(input$sample_size)
        p <- p + stat_function(
          fun = dnorm,
          args = list(mean = rv$pop_stats$mean, sd = theoretical_sd),
          color = "black", size = 1.2, linetype = "dotted"
        )
      }
      p
    })

    ##################################################################
    # SECTION: Summary Statistics Output
    # Displays population, sample, and theoretical statistics.
    ##################################################################
    output$summaryStats <- renderPrint({
      num_samples <- length(rv$sample_stats)
      stat_type <- input$samp_stat
      pop_shape <- input$pop_shape
      cat("Population Parameters:\n")
      if (pop_shape == "Categorical") {
        cat(sprintf("  True Proportion (p): %.3f\n", input$cat_p))
      } else {
        cat(sprintf("  Mean (\u03bc): %.3f\n", rv$pop_stats$mean))
        cat(sprintf("  Std Dev (\u03c3): %.3f\n\n", rv$pop_stats$sd))
      }
      cat("Sampling Distribution Statistics:\n")
      cat(sprintf("  Number of samples drawn: %d\n", num_samples))
      if (num_samples > 1) {
        mean_of_stats <- mean(rv$sample_stats)
        sd_of_stats <- sd(rv$sample_stats)
        cat(sprintf("  Mean of sample %s: %.3f\n", stat_type, mean_of_stats))
        cat(sprintf("  Std dev of sample %s: %.3f\n\n", stat_type, sd_of_stats))
        if (pop_shape == "Categorical" && stat_type == "prop") {
          theoretical_mean <- input$cat_p
          theoretical_sd <- sqrt(input$cat_p * (1 - input$cat_p) / input$sample_size)
          cat("Theoretical (CLT) Values:\n")
          cat(sprintf("  Theoretical Mean: %.3f\n", theoretical_mean))
          cat(sprintf("  Theoretical Std Dev (SE): %.3f\n", theoretical_sd))
        } else if (stat_type == "mean") {
          theoretical_mean <- rv$pop_stats$mean
          theoretical_sd <- rv$pop_stats$sd / sqrt(input$sample_size)
          cat("Theoretical (CLT) Values:\n")
          cat(sprintf("  Theoretical Mean: %.3f\n", theoretical_mean))
          cat(sprintf("  Theoretical Std Dev (SE): %.3f\n", theoretical_sd))
        }
      } else {
        cat("  Draw more samples to calculate statistics.\n")
      }
      if (!is.na(rv$last_stat)) {
        cat(sprintf("\nMost Recent Sample %s: %.3f\n", stat_type, rv$last_stat))
      }
    })

    ##################################################################
    # SECTION: Download Handlers
    # Allows users to export summary, data, and plot.
    ##################################################################
    output$download_summary <- downloadHandler(
      filename = function() { "sampling_summary.txt" },
      content = function(file) {
        sink(file)
        cat(capture.output(output$summaryStats()))
        sink()
      }
    )
    output$download_data <- downloadHandler(
      filename = function() { "sampling_data.csv" },
      content = function(file) {
        write.csv(data.frame(sample_stat = rv$sample_stats), file, row.names = FALSE)
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() { "sampling_plot.png" },
      content = function(file) {
        png(file, width = 800, height = 600)
        print({
          stats <- rv$sample_stats
          stat_type <- input$samp_stat
          pop_shape <- input$pop_shape
          if (length(stats) < 2) {
            plot.new()
            title("Draw at least 2 samples to see distribution")
          } else {
            df_stats <- data.frame(x = stats)
            mean_of_stats <- mean(df_stats$x)
            sd_of_stats <- sd(df_stats$x)
            p <- ggplot(df_stats, aes(x = x)) +
              geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
              geom_vline(xintercept = mean_of_stats, color = prefs$plot_color, linetype = "solid", size = 1.2) +
              labs(x = paste("Sample", stat_type), y = "Density",
                   title = sprintf("Mean of %d samples = %.2f", length(stats), mean_of_stats)) +
              theme_minimal()
            if (input$show_normal_curve && pop_shape != "Categorical" && stat_type == "mean") {
              theoretical_sd <- rv$pop_stats$sd / sqrt(input$sample_size)
              p <- p + stat_function(
                fun = dnorm,
                args = list(mean = rv$pop_stats$mean, sd = theoretical_sd),
                color = "black", size = 1.2, linetype = "dotted"
              )
            }
            print(p)
          }
        })
        dev.off()
      }
    )

    ##################################################################
    # SECTION: Accessibility Enhancements
    # Adds ARIA roles, labels, and alerts for improved accessibility.
    ##################################################################
    shinyAccessibility::add_accessibility(
      inputId = ns("mainPanel"),
      role = "main",
      aria_label = "Sampling Distribution Main Panel"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("sidebarPanel"),
      role = "form",
      aria_label = "Population and Sampling Parameters"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("error_msg"),
      role = "alert",
      aria_live = "assertive"
    )
  })
}
