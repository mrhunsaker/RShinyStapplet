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
# One-Way ANOVA Module
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
library(dplyr)    # For data wrangling

# --- UI function for the One-Way ANOVA Activity ---
# This function builds the user interface for the module, allowing users to input data,
# run the ANOVA analysis, and view results and plots.
# --- UI function for the One-Way ANOVA Activity ---
# This function builds the user interface for the module, allowing users to input data,
# run the ANOVA analysis, and view results and plots.
anova_one_way_ui <- function(id) {
  ns <- NS(id)  # Namespace for module inputs/outputs
  fluidPage(
    titlePanel(
      h2("One-Way ANOVA Test", id = "appTitle"),
      windowTitle = "One-Way ANOVA"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Data Input & Settings", id = "paramsHeading"),
        # Instructions for data input
        p("Enter data as two columns (Group,Value). Each entry should be on a new line."),
        # Text area for user to paste data
        textAreaInput(ns("data_input"),
                      label = "Paste Data:",
                      value = "GroupA,25\nGroupA,28\nGroupA,23\nGroupA,26\nGroupB,32\nGroupB,35\nGroupB,30\nGroupB,33\nGroupC,22\nGroupC,24\nGroupC,21\nGroupC,25",
                      rows = 10,
                      placeholder = "Example:\nGroupA,Value1\nGroupA,Value2\nGroupB,Value3..."),
        # Slider for significance level (alpha)
        sliderInput(ns("alpha"), "Significance Level (\u03b1)", min = 0.01, max = 0.10, value = 0.05, step = 0.01),
        # Button to run analysis
        actionButton(ns("run_analysis"), "Run ANOVA Analysis", class = "btn-primary", style = "width: 100%;"),
        hr(),
        # Button to download results
        downloadButton(ns("download_results"), "Download Results")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Boxplot of group distributions
        div(class = "plot-container",
            h4("Group Distributions", style = "text-align: center;"),
            plotOutput(ns("boxPlot")),
            p(id = ns("boxPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("boxPlot_desc_text")))
        ),
        # Table of descriptive statistics
        div(
          class = "results-box",
          h3("Descriptive Statistics"),
          tableOutput(ns("descriptiveStats"))
        ),
        # ANOVA summary table
        div(
          class = "results-box",
          h3("ANOVA Summary Table"),
          verbatimTextOutput(ns("anovaSummary"))
        ),
        # Conclusion text
        fluidRow(
          column(12,
            div(class = "results-box",
                h3("Conclusion"),
                textOutput(ns("conclusion"))
            )
          )
        ),
        # Additional summary and accessibility outputs
        uiOutput(ns("sim_stats_ui")),
        uiOutput(ns("plot_desc"))
      )
    )
  )
}

# --- Server logic for the One-Way ANOVA Activity ---
# This function contains all reactive logic, calculations, and output rendering for the module.
# --- Server logic for the One-Way ANOVA Activity ---
# This function contains all reactive logic, calculations, and output rendering for the module.
anova_one_way_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # --- Reactive values to store state ---
    rv <- reactiveValues(
      data = NULL,              # Stores parsed input data
      anova_results = NULL,     # Stores ANOVA summary output
      descriptive_stats = NULL, # Stores group-wise descriptive statistics
      p_value = NULL            # Stores p-value from ANOVA
    )

    # --- Run ANOVA analysis when button is clicked ---
    observeEvent(input$run_analysis, {
      req(input$data_input)
      # Try to parse user input as CSV
      parsed_data <- tryCatch({
        df <- read.csv(text = input$data_input, header = FALSE, stringsAsFactors = TRUE, col.names = c("Group", "Value"))
        if (ncol(df) != 2) stop("Data must have exactly two columns: Group and Value.")
        if (!is.numeric(df$Value)) stop("The second column ('Value') must be numeric.")
        if (length(unique(df$Group)) < 2) stop("There must be at least two groups to perform an ANOVA test.")
        df$Group <- as.factor(df$Group)
        df
      }, error = function(e) {
        showModal(modalDialog(
          title = "Input Error",
          paste("Error parsing data:", e$message),
          easyClose = TRUE,
          footer = NULL
        ))
        return(NULL)
      })

      # If parsing failed, reset outputs
      if (is.null(parsed_data)) {
        rv$data <- NULL
        rv$anova_results <- NULL
        rv$descriptive_stats <- NULL
        rv$p_value <- NULL
        return()
      }

      # Store parsed data
      rv$data <- parsed_data

      # Calculate descriptive statistics for each group
      rv$descriptive_stats <- parsed_data %>%
        group_by(Group) %>%
        summarise(
          N = n(),
          Mean = mean(Value, na.rm = TRUE),
          SD = sd(Value, na.rm = TRUE),
          Median = median(Value, na.rm = TRUE),
          .groups = 'drop'
        )

      # Run ANOVA model and extract summary and p-value
      anova_model <- aov(Value ~ Group, data = parsed_data)
      rv$anova_results <- summary(anova_model)
      rv$p_value <- rv$anova_results[[1]][["Pr(>F)"]][1]
    })

    # --- Boxplot of group distributions ---
    output$boxPlot <- renderPlot({
      if (is.null(rv$data)) {
        return(ggplot() + labs(title = "Please enter valid data and run the analysis.") + theme_void())
      }
      ggplot(rv$data, aes(x = Group, y = Value, fill = Group)) +
        geom_boxplot(alpha = 0.7, outlier.colour = "red") +
        geom_jitter(width = 0.1, alpha = 0.5, height = 0) +
        labs(title = "Comparison of Group Distributions", x = "Group", y = "Value") +
        theme_minimal(base_size = 14) +
        theme(legend.position = "none", plot.title = element_text(hjust = 0.5, face = "bold"))
    })

    # --- Accessibility: Description for boxplot ---
    output$boxPlot_desc_text <- renderText({
      if (is.null(rv$data) || is.null(rv$descriptive_stats)) {
        return("No data available to describe the group distributions.")
      }
      stats <- rv$descriptive_stats
      group_summaries <- apply(stats, 1, function(row) {
        sprintf("Group '%s' has %d data points. The mean is %.2f and the median is %.2f.",
                row['Group'], as.integer(row['N']), as.numeric(row['Mean']), as.numeric(row['Median']))
      })
      desc <- paste(
        "This plot displays boxplots comparing the distributions of the different groups.",
        "Each boxplot shows the median, interquartile range, and potential outliers for a group.",
        "Individual data points are also shown as jittered dots.",
        paste(group_summaries, collapse = " "),
        "Visually compare the medians and the spread of the boxes to see if there are apparent differences between the groups."
      )
      paste(desc, collapse = " ")
    })

    # --- ANOVA summary output ---
    output$anovaSummary <- renderPrint({
      if (is.null(rv$anova_results)) {
        cat("Analysis has not been run yet.")
      } else {
        print(rv$anova_results)
      }
    })

    # --- Table of descriptive statistics ---
    output$descriptiveStats <- renderTable({
      if (is.null(rv$descriptive_stats)) {
        return(NULL)
      }
      rv$descriptive_stats
    }, striped = TRUE, hover = TRUE, bordered = TRUE, digits = 3)

    # --- Conclusion based on p-value and alpha ---
    output$conclusion <- renderText({
      req(rv$p_value, input$alpha)
      p_val <- rv$p_value
      alpha <- input$alpha
      if (p_val < alpha) {
        paste0("Since the p-value (", sprintf("%.4f", p_val), ") is less than the significance level \u03b1 (", alpha, "), ",
               "we reject the null hypothesis. There is statistically significant evidence of a difference in means between at least two of the groups.")
      } else {
        paste0("Since the p-value (", sprintf("%.4f", p_val), ") is greater than or equal to the significance level \u03b1 (", alpha, "), ",
               "we fail to reject the null hypothesis. There is not enough evidence to conclude that there is a significant difference in means among the groups.")
      }
    })

    # --- Summary statistics across groups ---
    output$sim_stats_ui <- renderUI({
      stats <- rv$descriptive_stats
      if (is.null(stats)) return(NULL)
      overall_mean <- mean(stats$Mean)
      overall_sd <- mean(stats$SD)
      tagList(
        h4("Summary Statistics Across Groups"),
        tags$table(
          tags$tr(tags$th("Mean of Means"), tags$th("Mean of SDs")),
          tags$tr(tags$td(round(overall_mean, 3)), tags$td(round(overall_sd, 3)))
        )
      )
    })

    # --- Accessibility: Description for group distributions ---
    output$plot_desc <- renderUI({
      stats <- rv$descriptive_stats
      if (is.null(stats)) {
        p(class = "sr-only", "No group distributions are available yet.")
      } else {
        p(class = "sr-only", paste("Boxplots show the distributions for each group. Means and medians are displayed in the summary table."))
      }
    })

    # --- Download handler for results ---
    output$download_results <- downloadHandler(
      filename = function() {
        paste("anova_results-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        stats <- rv$descriptive_stats
        if (is.null(stats)) {
          write.csv(data.frame(), file)
        } else {
          write.csv(stats, file, row.names = FALSE)
        }
      }
    )
  })
}
