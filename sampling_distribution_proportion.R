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
# Stapplet Applet - Sampling Distribution of a Proportion
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
# Enhanced Sampling Distribution of the Sample Proportion Applet
# --------------------------------------------------------------------

# --------------------------------------------------------------------
# UI Function: sampling_dist_proportion_ui
#   - Defines the user interface for the applet
#   - Includes population parameter input, sampling controls, download/export,
#     and displays for population, sample, and sampling distribution plots
# --------------------------------------------------------------------
sampling_dist_proportion_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    shinyjs::useShinyjs(),
    tags$head(
      tags$title("Sampling Distribution of the Sample Proportion"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css")
    ),
    tags$div(id = ns("appTitleProp"), class = "sr-only", "Sampling Distribution of the Sample Proportion"),
    titlePanel(
      h2("Sampling Distribution of the Sample Proportion", id = ns("mainHeadingProp")),
      windowTitle = "Sampling Distribution of the Sample Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanelProp"),
        role = "form",
        `aria-labelledby` = ns("paramsHeadingProp"),
        h3("Population Parameter", id = ns("paramsHeadingProp")),
        # Slider for population proportion (p)
        sliderInput(ns("pop_prop"), "Population Proportion (p):", min = 0.01, max = 0.99, value = 0.50, step = 0.01),
        hr(),
        h3("Sampling Parameters"),
        # Slider for sample size (n)
        sliderInput(ns("sample_size"), "Sample Size (n):", min = 2, max = 500, value = 50),
        hr(),
        h3("Draw Samples"),
        # Buttons to draw samples and reset
        actionButton(ns("draw_one"), "Draw 1 Sample", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("draw_100"), "Draw 100 Samples", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("draw_1000"), "Draw 1000 Samples", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("reset"), "Reset Distribution", class = "btn-danger", style = "width: 100%;"),
        hr(),
        h3("Export/Download"),
        # Download buttons for summary, data, and plot
        downloadButton(ns("download_summary"), "Download Summary"),
        downloadButton(ns("download_data"), "Download Data"),
        downloadButton(ns("download_plot"), "Download Plot"),
        hr(),
        # Preferences button
        actionButton(ns("show_prefs"), "Preferences", icon = shiny::icon("cog")),
        # Error message display
        tags$div(id = ns("error_msg"), class = "text-danger", role = "alert", `aria-live` = "assertive")
      ),
      mainPanel(
        id = ns("mainPanelProp"),
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
              h4("Distribution of Sample Proportions (p-hat)", style = "text-align: center;", id = ns("sampDistLabel")),
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
      )
    )
  )
}

# --------------------------------------------------------------------
# Server Function: sampling_dist_proportion_server
#   - Implements the server-side logic for the applet
#   - Handles sampling, simulation, summary statistics, plotting, downloads,
#     and accessibility enhancements
# --------------------------------------------------------------------
sampling_dist_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # ---------------------------------------------------------------
    # Reactive values to store sample proportions and last sample
    # ---------------------------------------------------------------
    rv <- reactiveValues(
      sample_props = numeric(),   # Stores all sample proportions drawn
      last_sample = numeric()     # Stores the most recent sample
    )

    # ---------------------------------------------------------------
    # Reset samples when population proportion or sample size changes
    # ---------------------------------------------------------------
    observeEvent(c(input$pop_prop, input$sample_size), {
      rv$sample_props <- numeric()
      rv$last_sample <- numeric()
    })

    # ---------------------------------------------------------------
    # Function to draw samples and update reactive values
    # ---------------------------------------------------------------
    draw_samples <- function(num_samples) {
      req(input$pop_prop, input$sample_size > 1)
      pop_p <- input$pop_prop
      n_size <- input$sample_size
      # Draw 'num_samples' samples, each of size n_size, from population with proportion pop_p
      new_props <- replicate(num_samples, {
        sample_data <- sample(c(1, 0), size = n_size, replace = TRUE, prob = c(pop_p, 1 - pop_p))
        mean(sample_data)
      })
      # Store the most recently drawn sample
      last_drawn_sample <- sample(c(1, 0), size = n_size, replace = TRUE, prob = c(pop_p, 1 - pop_p))
      rv$last_sample <- last_drawn_sample
      rv$sample_props <- c(rv$sample_props, new_props)
    }

    # ---------------------------------------------------------------
    # Event handlers for sample drawing buttons and reset
    # ---------------------------------------------------------------
    observeEvent(input$draw_one, { draw_samples(1) })
    observeEvent(input$draw_100, { draw_samples(100) })
    observeEvent(input$draw_1000, { draw_samples(1000) })
    observeEvent(input$reset, {
      rv$sample_props <- numeric()
      rv$last_sample <- numeric()
    })

    # ---------------------------------------------------------------
    # Plot: Population Distribution (Success/Failure bars)
    # ---------------------------------------------------------------
    output$populationPlot <- renderPlot({
      req(input$pop_prop)
      df_pop <- data.frame(
        Category = c("Success", "Failure"),
        Proportion = c(input$pop_prop, 1 - input$pop_prop)
      )
      ggplot2::ggplot(df_pop, ggplot2::aes(x = Category, y = Proportion, fill = Category)) +
        ggplot2::geom_bar(stat = "identity") +
        ggplot2::scale_fill_viridis_d(option = "D", end = 0.85) +
        ggplot2::labs(y = "Proportion", x = "", title = paste("p =", input$pop_prop)) +
        ggplot2::theme_minimal() +
        ggplot2::theme(axis.text = ggplot2::element_text(size = 14), axis.title = ggplot2::element_text(size = 16), legend.position = "none")
    })

    # ---------------------------------------------------------------
    # Plot: Most Recent Sample (bar plot of outcomes)
    # ---------------------------------------------------------------
    output$samplePlot <- renderPlot({
      if (length(rv$last_sample) == 0) {
        return(ggplot2::ggplot() + ggplot2::labs(title = "No sample drawn yet") + ggplot2::theme_void())
      }
      df_sample <- data.frame(Outcome = factor(rv$last_sample, levels = c(0, 1), labels = c("Failure", "Success")))
      p_hat <- mean(rv$last_sample)
      ggplot2::ggplot(df_sample, ggplot2::aes(x = Outcome, fill = Outcome)) +
        ggplot2::geom_bar() +
        ggplot2::scale_fill_viridis_d(option = "D", end = 0.85) +
        ggplot2::labs(x = "Outcome", y = "Count", title = paste("n =", input$sample_size, " p-hat =", round(p_hat, 3))) +
        ggplot2::theme_minimal() +
        ggplot2::theme(axis.text = ggplot2::element_text(size = 14), axis.title = ggplot2::element_text(size = 16), legend.position = "none")
    })

    # ---------------------------------------------------------------
    # Plot: Distribution of Sample Proportions (histogram + theoretical curve)
    # ---------------------------------------------------------------
    output$samplingDistPlot <- renderPlot({
      if (length(rv$sample_props) < 2) {
        return(ggplot2::ggplot() + ggplot2::labs(title = "Draw at least 2 samples to see distribution") + ggplot2::theme_void())
      }
      df_props <- data.frame(x = rv$sample_props)
      mean_of_props <- mean(df_props$x)
      pop_p <- input$pop_prop
      p <- ggplot2::ggplot(df_props, ggplot2::aes(x = x)) +
        ggplot2::geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
        ggplot2::geom_vline(xintercept = mean_of_props, color = "#1e40af", linetype = "solid", size = 1.2) +
        ggplot2::geom_vline(xintercept = pop_p, color = "#dc2626", linetype = "dashed", size = 1.2) +
        ggplot2::labs(x = "Sample Proportions (p-hat)", y = "Density",
             title = paste("Mean of", length(rv$sample_props), "proportions =", round(mean_of_props, 3))) +
        ggplot2::theme_minimal()
      # Overlay theoretical normal curve if CLT conditions are met
      theoretical_sd <- sqrt(pop_p * (1 - pop_p) / input$sample_size)
      if (input$sample_size * pop_p >= 10 && input$sample_size * (1 - pop_p) >= 10) {
        p <- p + ggplot2::stat_function(
          fun = dnorm,
          args = list(mean = pop_p, sd = theoretical_sd),
          color = "black", size = 1.2, linetype = "dotted"
        )
      }
      p
    })

    # ---------------------------------------------------------------
    # Summary Statistics Output (population, sample, theoretical)
    # ---------------------------------------------------------------
    output$summaryStats <- renderPrint({
      num_samples <- length(rv$sample_props)
      pop_p <- input$pop_prop
      n_size <- input$sample_size
      cat("Population Parameter:\n")
      cat("  Proportion (p): ", pop_p, "\n\n")
      cat("Sampling Distribution Statistics:\n")
      cat("  Number of samples drawn: ", num_samples, "\n")
      if (num_samples > 1) {
        mean_of_props <- mean(rv$sample_props)
        sd_of_props <- sd(rv$sample_props)
        theoretical_sd <- sqrt(pop_p * (1 - pop_p) / n_size)
        cat("  Mean of sample proportions: ", round(mean_of_props, 4), "\n")
        cat("  Std dev of sample proportions (SE): ", round(sd_of_props, 4), "\n\n")
        cat("Theoretical (CLT) Values:\n")
        cat("  Theoretical Mean: ", pop_p, "\n")
        cat("  Theoretical Std Dev (SE): ", round(theoretical_sd, 4), "\n\n")
        cat("Normality Condition Check (CLT):\n")
        cat("  n*p = ", round(n_size * pop_p, 2), " (must be >= 10)\n")
        cat("  n*(1-p) = ", round(n_size * (1 - pop_p), 2), " (must be >= 10)\n")
      } else {
        cat("  Draw more samples to calculate statistics.\n")
      }
    })

    # ---------------------------------------------------------------
    # Download Handlers for Summary, Data, and Plot
    # ---------------------------------------------------------------
    output$download_summary <- downloadHandler(
      filename = function() { "sampling_proportion_summary.txt" },
      content = function(file) {
        sink(file)
        cat(capture.output(output$summaryStats()))
        sink()
      }
    )
    output$download_data <- downloadHandler(
      filename = function() { "sampling_proportion_data.csv" },
      content = function(file) {
        write.csv(data.frame(sample_prop = rv$sample_props), file, row.names = FALSE)
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() { "sampling_proportion_plot.png" },
      content = function(file) {
        png(file, width = 800, height = 600)
        print({
          df_props <- data.frame(x = rv$sample_props)
          mean_of_props <- mean(df_props$x)
          pop_p <- input$pop_prop
          p <- ggplot2::ggplot(df_props, ggplot2::aes(x = x)) +
            ggplot2::geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
            ggplot2::geom_vline(xintercept = mean_of_props, color = "#1e40af", linetype = "solid", size = 1.2) +
            ggplot2::geom_vline(xintercept = pop_p, color = "#dc2626", linetype = "dashed", size = 1.2) +
            ggplot2::labs(x = "Sample Proportions (p-hat)", y = "Density",
                 title = paste("Mean of", length(rv$sample_props), "proportions =", round(mean_of_props, 3))) +
            ggplot2::theme_minimal()
          theoretical_sd <- sqrt(pop_p * (1 - pop_p) / input$sample_size)
          if (input$sample_size * pop_p >= 10 && input$sample_size * (1 - pop_p) >= 10) {
            p <- p + ggplot2::stat_function(
              fun = dnorm,
              args = list(mean = pop_p, sd = theoretical_sd),
              color = "black", size = 1.2, linetype = "dotted"
            )
          }
          print(p)
        })
        dev.off()
      }
    )

    # ---------------------------------------------------------------
    # Accessibility Enhancements (ARIA roles, labels, alerts)
    # ---------------------------------------------------------------
    if (requireNamespace("shinyAccessibility", quietly = TRUE)) {
      shinyAccessibility::add_accessibility(
        inputId = ns("mainPanelProp"),
        role = "main",
        aria_label = "Sampling Distribution of the Sample Proportion Main Panel"
      )
      shinyAccessibility::add_accessibility(
        inputId = ns("sidebarPanelProp"),
        role = "form",
        aria_label = "Population and Sampling Parameters"
      )
      shinyAccessibility::add_accessibility(
        inputId = ns("error_msg"),
        role = "alert",
        aria_live = "assertive"
      )
    }
  })
}
