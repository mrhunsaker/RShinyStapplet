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
# Stapplet Applet - Descriptive Statistics Tool: Old Faithful Sampling Distribution
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# Enhanced Descriptive Statistics Tool: Old Faithful Sampling Distribution Applet

# This applet matches the interactive features of the Old Faithful HTML/JS applet:
# - Fixed population (Old Faithful eruptions: durations and wait times)
# - Sample size selection (5 to 263)
# - Draw one sample, draw multiple samples, reset
# - Population scatterplot, population regression line, sample regression line
# - Sampling distribution of sample slopes (dotplot), overlay normal curve
# - Summary statistics: mean and SD of sample slopes
# - Error/warning messaging, accessibility, export/download, preferences

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(shinyjs) # For JavaScript integration in Shiny
library(shinyWidgets) # For enhanced UI widgets
library(colourpicker) # For colourInput widget


# Old Faithful population data (from JS applet)
oldfaithful_durations <- c(
  1.5, 1.5, 1.55, 1.583, 1.6, 1.633, 1.633, 1.633, 1.65, 1.65, 1.667, 1.667, 1.667, 1.667, 1.683, 1.7, 1.7, 1.733, 1.75, 1.75, 1.75, 1.75, 1.75, 1.767, 1.767, 1.767, 1.767, 1.783, 1.8, 1.8, 1.817, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.85, 1.85, 1.867, 1.867, 1.867, 1.867, 1.883, 1.883, 1.883, 1.9, 1.9, 1.9, 1.9, 1.9, 1.917, 1.917, 1.917, 1.917, 1.917, 1.933, 1.933, 1.95, 1.95, 1.95, 1.967, 1.967, 1.983, 1.983, 2, 2, 2, 2.017, 2.017, 2.033, 2.033, 2.033, 2.033, 2.033, 2.05, 2.067, 2.067, 2.083, 2.083, 2.1, 2.117, 2.117, 2.117, 2.117, 2.117, 2.133, 2.15, 2.15, 2.2, 2.2, 2.2, 2.217, 2.217, 2.233, 2.25, 2.25, 2.25, 2.3, 2.35, 2.5, 2.5, 2.567, 2.567, 2.583, 2.75, 2.783, 2.833, 2.967, 3.167, 3.267, 3.35, 3.367, 3.4, 3.567, 3.667, 3.7, 3.7, 3.717, 3.833, 3.833, 3.833, 3.867, 3.883, 3.883, 3.917, 3.95, 3.967, 3.967, 3.983, 4, 4, 4, 4, 4, 4.017, 4.033, 4.033, 4.033, 4.033, 4.033, 4.05, 4.05, 4.05, 4.05, 4.083, 4.083, 4.083, 4.1, 4.1, 4.117, 4.117, 4.117, 4.117, 4.117, 4.133, 4.15, 4.167, 4.167, 4.167, 4.183, 4.2, 4.217, 4.217, 4.233, 4.233, 4.25, 4.25, 4.25, 4.25, 4.267, 4.267, 4.267, 4.283, 4.283, 4.283, 4.3, 4.3, 4.3, 4.317, 4.317, 4.333, 4.333, 4.333, 4.333, 4.333, 4.35, 4.35, 4.367, 4.367, 4.367, 4.383, 4.383, 4.383, 4.383, 4.383, 4.4, 4.4, 4.417, 4.417, 4.417, 4.417, 4.433, 4.433, 4.433, 4.433, 4.433, 4.45, 4.45, 4.45, 4.45, 4.467, 4.467, 4.467, 4.467, 4.467, 4.467, 4.483, 4.483, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.517, 4.517, 4.517, 4.533, 4.533, 4.533, 4.533, 4.533, 4.533, 4.533, 4.533, 4.533, 4.533, 4.55, 4.567, 4.583, 4.583, 4.583, 4.6, 4.6, 4.617, 4.617, 4.617, 4.633, 4.633, 4.633, 4.633, 4.633, 4.667, 4.667, 4.683, 4.7, 4.733, 4.75, 4.75, 4.767, 4.833, 5
)
oldfaithful_wait <- c(
  58, 64, 62, 51, 74, 60, 62, 62, 57, 59, 52, 53, 56, 57, 54, 54, 54, 59, 53, 56, 62, 64, 65, 50, 52, 59, 62, 58, 61, 64, 62, 47, 48, 52, 53, 61, 64, 53, 56, 52, 53, 60, 61, 52, 53, 54, 54, 58, 58, 59, 60, 53, 56, 58, 62, 63, 52, 63, 48, 53, 56, 51, 52, 58, 59, 50, 54, 59, 54, 55, 51, 61, 66, 68, 68, 49, 59, 62, 52, 57, 61, 55, 57, 65, 65, 75, 60, 63, 64, 56, 68, 73, 63, 68, 68, 53, 58, 66, 67, 58, 47, 61, 67, 76, 61, 69, 79, 80, 78, 83, 75, 83, 90, 75, 80, 85, 93, 98, 84, 76, 84, 84, 79, 87, 90, 79, 85, 83, 89, 83, 77, 79, 91, 94, 98, 76, 77, 88, 88, 91, 95, 82, 85, 94, 96, 80, 82, 87, 94, 98, 86, 89, 89, 94, 113, 86, 100, 88, 94, 99, 85, 92, 86, 87, 95, 103, 87, 89, 91, 92, 83, 86, 97, 89, 89, 104, 93, 101, 112, 88, 92, 80, 88, 90, 90, 95, 93, 93, 90, 91, 99, 91, 93, 93, 95, 96, 83, 94, 87, 87, 93, 99, 89, 91, 92, 103, 103, 90, 92, 94, 94, 86, 87, 91, 92, 94, 106, 94, 102, 85, 86, 90, 91, 92, 97, 86, 90, 94, 76, 85, 86, 89, 90, 91, 93, 98, 100, 101, 87, 85, 89, 100, 107, 90, 94, 87, 88, 93, 82, 88, 94, 94, 98, 83, 99, 96, 92, 93, 96, 96, 91, 90, 92
)

# --- UI Definition for Old Faithful Sampling Distribution Applet ---
# This function builds the user interface for the module, allowing users to:
# - Select sample size
# - Draw samples and view regression lines
# - See the sampling distribution of sample slopes
# - View summary statistics and download results

tools_descriptive_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Old Faithful Sampling Distribution Applet"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css")
    ),
    tags$div(id = ns("appTitle"), class = "sr-only", "Old Faithful Sampling Distribution Applet"),
    titlePanel(
      h2("Sampling Distribution of Sample Slope (Old Faithful)", id = ns("mainHeading")),
      windowTitle = "Old Faithful Sampling Distribution"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        `aria-labelledby` = ns("dataHeading"),
        h3("Sampling Controls", id = ns("dataHeading")),
        sliderInput(ns("sample_size"), "Sample Size (n):", min = 5, max = length(oldfaithful_durations), value = 15),
        actionButton(ns("draw_one"), "Draw 1 Sample", class = "btn-primary", width = "100%"),
        br(),
        numericInput(ns("num_samples"), "Draw Multiple Samples (N):", value = 1, min = 1, max = 1000, step = 1),
        actionButton(ns("draw_n"), "Draw N Samples", class = "btn-primary", width = "100%"),
        br(),
        actionButton(ns("reset"), "Reset Distribution", class = "btn-danger", style = "width: 100%;"),
        hr(),
        checkboxInput(ns("show_normal_curve"), "Overlay Normal Curve (CLT)", value = TRUE),
        hr(),
        h3("Export/Download"),
        downloadButton(ns("download_summary"), "Download Summary"),
        downloadButton(ns("download_data"), "Download Data"),
        downloadButton(ns("download_plot"), "Download Plot"),
        hr(),
        actionButton(ns("show_prefs"), "Preferences", icon = icon("cog")),
        tags$div(id = ns("error_msg"), class = "text-danger", role = "alert", `aria-live` = "assertive")
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        fluidRow(
          column(
            6,
            div(
              class = "plot-container",
              h4("Population Scatterplot", style = "text-align: center;", id = ns("popDistLabel")),
              plotOutput(ns("populationPlot"), height = "300px")
            )
          ),
          column(
            6,
            div(
              class = "plot-container",
              h4("Sample Scatterplot", style = "text-align: center;", id = ns("samplePlotLabel")),
              plotOutput(ns("samplePlot"), height = "300px")
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "plot-container",
              h4("Sampling Distribution of Sample Slopes", style = "text-align: center;", id = ns("sampDistLabel")),
              plotOutput(ns("samplingDistPlot"), height = "300px")
            )
          )
        ),
        fluidRow(
          column(
            12,
            div(
              class = "results-box",
              h3("Summary Statistics", id = ns("summaryStatsLabel")),
              verbatimTextOutput(ns("summaryStats"))
            )
          )
        )
      ),
      position = "left"
    )
  )
}

tools_descriptive_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Preferences
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
    observeEvent(input$round_digits, {
      prefs$round_digits <- input$round_digits
    })
    observeEvent(input$plot_color, {
      prefs$plot_color <- input$plot_color
    })
    observeEvent(input$show_percent, {
      prefs$show_percent <- input$show_percent
    })

    # Sampling state
    rv <- reactiveValues(
      sample_indices = NULL,
      sample_slopes = numeric(),
      last_sample_indices = NULL,
      last_sample_slope = NA
    )

    # Error messaging
    showError <- function(msg) {
      shinyjs::html(ns("error_msg"), msg)
    }
    observe({
      shinyjs::html(ns("error_msg"), "")
    })

    # Draw one sample
    observeEvent(input$draw_one, {
      n <- input$sample_size
      if (n < 5 || n > length(oldfaithful_durations)) {
        showError("Sample size must be between 5 and 263.")
        return()
      }
      idx <- sort(sample(seq_along(oldfaithful_durations), n, replace = FALSE))
      rv$last_sample_indices <- idx
      sample_dur <- oldfaithful_durations[idx]
      sample_wait <- oldfaithful_wait[idx]
      slope <- coef(lm(sample_wait ~ sample_dur))[2]
      rv$last_sample_slope <- slope
      rv$sample_slopes <- c(rv$sample_slopes, slope)
    })

    # Draw N samples
    observeEvent(input$draw_n, {
      n <- input$sample_size
      N <- input$num_samples
      if (n < 5 || n > length(oldfaithful_durations)) {
        showError("Sample size must be between 5 and 263.")
        return()
      }
      slopes <- replicate(N, {
        idx <- sort(sample(seq_along(oldfaithful_durations), n, replace = FALSE))
        sample_dur <- oldfaithful_durations[idx]
        sample_wait <- oldfaithful_wait[idx]
        coef(lm(sample_wait ~ sample_dur))[2]
      })
      rv$sample_slopes <- c(rv$sample_slopes, slopes)
      # For visualization, show last sample
      idx <- sort(sample(seq_along(oldfaithful_durations), n, replace = FALSE))
      rv$last_sample_indices <- idx
      sample_dur <- oldfaithful_durations[idx]
      sample_wait <- oldfaithful_wait[idx]
      rv$last_sample_slope <- coef(lm(sample_wait ~ sample_dur))[2]
    })

    # Reset
    observeEvent(input$reset, {
      rv$sample_indices <- NULL
      rv$sample_slopes <- numeric()
      rv$last_sample_indices <- NULL
      rv$last_sample_slope <- NA
      shinyjs::reset(ns("error_msg"))
    })

    # Population scatterplot
    output$populationPlot <- renderPlot({
      df <- data.frame(Duration = oldfaithful_durations, Wait = oldfaithful_wait)
      ggplot(df, aes(x = Duration, y = Wait)) +
        geom_point(color = "#6366f1", alpha = 0.7, size = 2) +
        geom_smooth(method = "lm", se = FALSE, color = "#dc2626", size = 1.2) +
        labs(
          title = "Population: Old Faithful Eruptions",
          subtitle = "Regression line: Wait = 33.3 + 13.3 * Duration",
          x = "Duration (min)", y = "Wait time (min)"
        ) +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5)
        )
    })

    # Sample scatterplot
    output$samplePlot <- renderPlot({
      idx <- rv$last_sample_indices
      if (is.null(idx) || length(idx) < 1) {
        return(ggplot() +
          labs(title = "No sample drawn yet") +
          theme_void())
      }
      df <- data.frame(Duration = oldfaithful_durations, Wait = oldfaithful_wait)
      sample_df <- df[idx, ]
      pop_fit <- lm(Wait ~ Duration, data = df)
      sample_fit <- lm(Wait ~ Duration, data = sample_df)
      ggplot(df, aes(x = Duration, y = Wait)) +
        geom_point(color = "#6366f1", alpha = 0.2, size = 2) +
        geom_point(data = sample_df, aes(x = Duration, y = Wait), color = prefs$plot_color, size = 3, alpha = 0.8) +
        geom_smooth(method = "lm", se = FALSE, color = "#dc2626", size = 1.2) +
        geom_smooth(data = sample_df, method = "lm", se = FALSE, color = "#0ea5e9", linetype = "dashed", size = 1.2) +
        labs(
          title = "Sample from Population",
          subtitle = sprintf("Sample regression slope = %.3f", rv$last_sample_slope),
          x = "Duration (min)", y = "Wait time (min)"
        ) +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5)
        )
    })

    # Sampling distribution plot
    output$samplingDistPlot <- renderPlot({
      slopes <- rv$sample_slopes
      if (length(slopes) < 2) {
        if (is.null(input$num_samples) || trimws(as.character(input$num_samples)) == "" || input$num_samples < 2) {
          return(NULL)
        }
        return(ggplot() +
          labs(title = "Draw at least 2 samples to see distribution") +
          theme_void())
      }
      mean_slope <- mean(slopes)
      sd_slope <- sd(slopes)
      p <- ggplot(data.frame(Slope = slopes), aes(x = Slope)) +
        geom_dotplot(binwidth = diff(range(slopes)) / 30, fill = "#fbbf24", color = "#b45309", alpha = 0.9) +
        geom_vline(xintercept = mean_slope, color = prefs$plot_color, linetype = "solid", size = 1.2) +
        labs(
          title = "Sampling Distribution of Sample Slopes",
          subtitle = sprintf("Mean = %.3f, SD = %.3f", mean_slope, sd_slope),
          x = "Sample regression slope", y = ""
        ) +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5)
        )
      # Overlay normal curve if requested
      if (input$show_normal_curve) {
        p <- p + stat_function(
          fun = dnorm,
          args = list(mean = mean_slope, sd = sd_slope),
          color = "black", size = 1.2, linetype = "dotted"
        )
      }
      p
    })

    # Summary statistics
    output$summaryStats <- renderPrint({
      slopes <- rv$sample_slopes
      cat("Population regression line: Wait = 33.3 + 13.3 * Duration\n")
      cat("Sample size (n):", input$sample_size, "\n")
      cat("Number of samples drawn:", length(slopes), "\n")
      if (length(slopes) > 1) {
        cat(sprintf("Mean of sample slopes: %.3f\n", mean(slopes)))
        cat(sprintf("SD of sample slopes: %.3f\n", sd(slopes)))
      } else {
        cat("Draw more samples to calculate statistics.\n")
      }
      if (!is.na(rv$last_sample_slope)) {
        cat(sprintf("\nMost recent sample slope: %.3f\n", rv$last_sample_slope))
      }
    })

    # Export/download handlers
    output$download_summary <- downloadHandler(
      filename = function() {
        "oldfaithful_sampling_summary.txt"
      },
      content = function(file) {
        sink(file)
        slopes <- rv$sample_slopes
        cat("Population regression line: Wait = 33.3 + 13.3 * Duration\n")
        cat("Sample size (n):", input$sample_size, "\n")
        cat("Number of samples drawn:", length(slopes), "\n")
        if (length(slopes) > 1) {
          cat(sprintf("Mean of sample slopes: %.3f\n", mean(slopes)))
          cat(sprintf("SD of sample slopes: %.3f\n", sd(slopes)))
        } else {
          cat("Draw more samples to calculate statistics.\n")
        }
        if (!is.na(rv$last_sample_slope)) {
          cat(sprintf("\nMost recent sample slope: %.3f\n", rv$last_sample_slope))
        }
        sink()
      }
    )
    output$download_data <- downloadHandler(
      filename = function() {
        "oldfaithful_sampling_data.csv"
      },
      content = function(file) {
        write.csv(data.frame(sample_slope = rv$sample_slopes), file, row.names = FALSE)
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() {
        "oldfaithful_sampling_plot.png"
      },
      content = function(file) {
        png(file, width = 800, height = 600)
        slopes <- rv$sample_slopes
        mean_slope <- mean(slopes)
        sd_slope <- sd(slopes)
        p <- ggplot(data.frame(Slope = slopes), aes(x = Slope)) +
          geom_dotplot(binwidth = diff(range(slopes)) / 30, fill = "#fbbf24", color = "#b45309", alpha = 0.9) +
          geom_vline(xintercept = mean_slope, color = prefs$plot_color, linetype = "solid", size = 1.2) +
          labs(
            title = "Sampling Distribution of Sample Slopes",
            subtitle = sprintf("Mean = %.3f, SD = %.3f", mean_slope, sd_slope),
            x = "Sample regression slope", y = ""
          ) +
          theme_minimal(base_size = 14) +
          theme(
            plot.title = element_text(hjust = 0.5, face = "bold"),
            plot.subtitle = element_text(hjust = 0.5)
          )
        if (input$show_normal_curve) {
          p <- p + stat_function(
            fun = dnorm,
            args = list(mean = mean_slope, sd = sd_slope),
            color = "black", size = 1.2, linetype = "dotted"
          )
        }
        print(p)
        dev.off()
      }
    )

    # Accessibility enhancements using standard HTML ARIA attributes are included in the UI definition.
  })
}
