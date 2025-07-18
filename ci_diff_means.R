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
# Confidence Interval for Difference in Means (Two Independent Groups)
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility: ARIA attributes, alt text, BrailleR integration, screen-reader descriptions, error/status messaging, focus management for modals, accessible export features
######################################################################

# StappletSHiny/ci_diff_means.R

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(dplyr) # For data wrangling
library(gridExtra) # For arranging multiple plots

# --- UI function for the 'Confidence Interval for a Difference in Means' applet ---
# This function builds the user interface for the module, allowing users to:
# - Input data as raw values or summary statistics for two groups
# - Set confidence level and choose pooled or Welch t-interval
# - Calculate and view the confidence interval and summary statistics
# - Download results
ci_diff_means_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Confidence Interval for a Difference in Population Means (\u03bc\u2081 - \u03bc\u2082)", id = "appTitle"),
      windowTitle = "CI for a Difference in Means"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Data Input", id = "paramsHeading"),
        radioButtons(ns("input_method"), "Select Input Method:",
          choices = c("Enter Raw Data" = "raw", "Enter Summary Statistics" = "summary"),
          selected = "raw"
        ),
        hr(role = "separator"),

        # --- Raw data input for both groups ---
        conditionalPanel(
          condition = "input.input_method == 'raw'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("data1_label"), "Data for Group 1 (comma-separated):"),
            textAreaInput(ns("data1"), NULL, "23, 25, 28, 22, 26, 29, 24", rows = 3)
          ),
          div(
            class = "form-group",
            tags$label(id = ns("data2_label"), "Data for Group 2 (comma-separated):"),
            textAreaInput(ns("data2"), NULL, "18, 20, 22, 19, 21, 23, 17", rows = 3)
          )
        ),

        # --- Summary statistics input for both groups ---
        conditionalPanel(
          condition = "input.input_method == 'summary'",
          ns = ns,
          h4("Group 1 Statistics"),
          numericInput(ns("n1"), "Sample Size (n\u2081):", value = 30, min = 2),
          numericInput(ns("mean1"), "Sample Mean (x\u0304\u2081):", value = 105),
          numericInput(ns("sd1"), "Sample SD (s\u2081):", value = 10, min = 0),
          hr(),
          h4("Group 2 Statistics"),
          numericInput(ns("n2"), "Sample Size (n\u2082):", value = 35, min = 2),
          numericInput(ns("mean2"), "Sample Mean (x\u0304\u2082):", value = 100),
          numericInput(ns("sd2"), "Sample SD (s\u2082):", value = 8, min = 0)
        ),
        hr(role = "separator"),
        h3("Confidence Interval Parameters"),
        div(
          class = "form-group",
          tags$label(id = ns("conf_level_label"), "Confidence Level:"),
          sliderInput(ns("conf_level"), NULL, min = 0.80, max = 0.99, value = 0.95, step = 0.01)
        ),
        checkboxInput(ns("pooled_var"), "Assume equal population variances (pooled t-interval)", value = FALSE),
        actionButton(ns("calculate"), "Calculate Interval", class = "btn-primary", style = "width: 100%;"),
        hr(),
        downloadButton(ns("download_results"), "Download Results")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",

        # --- Plot of confidence interval and data distributions ---
        div(
          class = "plot-container",
          plotOutput(ns("ciPlot"), height = "400px"),
          p(id = ns("ciPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("ciPlot_desc_text"))),
          h4("Confidence Interval Plot", id = ns("ciPlot_label"), class = "sr-only")
        ),

        # --- Results and summary statistics ---
        div(
          class = "results-box",
          h3("Results", id = ns("ciResults_label")),
          verbatimTextOutput(ns("ciResults"))
        ),
        uiOutput(ns("sim_stats_ui")),
        uiOutput(ns("plot_desc"))
      )
    )
  )
}

# --- Server function for the 'Confidence Interval for a Difference in Means' applet ---
# This function contains all reactive logic, calculations, and output rendering for the module.
ci_diff_means_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    # --- Reactive value to store the results ---
    results <- eventReactive(input$calculate, {
      conf_level <- input$conf_level
      pooled <- input$pooled_var

      # --- If user enters raw data, parse and validate ---
      if (input$input_method == "raw") {
        req(input$data1, input$data2)
        data1_vec <- try(as.numeric(unlist(strsplit(input$data1, "[,\\s]+"))), silent = TRUE)
        data2_vec <- try(as.numeric(unlist(strsplit(input$data2, "[,\\s]+"))), silent = TRUE)

        if ((is.null(input$data1) || trimws(input$data1) == "") || (is.null(data1_vec) || length(data1_vec) == 0)) {
          # Don't show error until user enters data for Group 1
        } else if (inherits(data1_vec, "try-error") || any(is.na(data1_vec)) || length(data1_vec) < 2) {
          return(list(error = "Invalid data for Group 1. Please enter at least two comma-separated numbers."))
        }
        if ((is.null(input$data2) || trimws(input$data2) == "") || (is.null(data2_vec) || length(data2_vec) == 0)) {
          # Don't show error until user enters data for Group 2
        } else if (inherits(data2_vec, "try-error") || any(is.na(data2_vec)) || length(data2_vec) < 2) {
          return(list(error = "Invalid data for Group 2. Please enter at least two comma-separated numbers."))
        }

        test_result <- t.test(x = data1_vec, y = data2_vec, conf.level = conf_level, var.equal = pooled)

        return(list(
          result = test_result,
          data = data.frame(
            value = c(data1_vec, data2_vec),
            group = factor(rep(c("Group 1", "Group 2"), c(length(data1_vec), length(data2_vec))))
          ),
          stats = data.frame(
            Group = c("Group 1", "Group 2"),
            N = c(length(data1_vec), length(data2_vec)),
            Mean = c(mean(data1_vec), mean(data2_vec)),
            SD = c(sd(data1_vec), sd(data2_vec))
          )
        ))
      } else {
        # --- If user enters summary statistics, validate and calculate CI ---
        req(input$n1, input$mean1, input$sd1, input$n2, input$mean2, input$sd2)
        if ((is.null(input$n1) || trimws(as.character(input$n1)) == "") ||
          (is.null(input$n2) || trimws(as.character(input$n2)) == "")) {
          return(list(error = NULL))
        }
        if (input$n1 < 2 || input$n2 < 2 || input$sd1 < 0 || input$sd2 < 0) {
          return(list(error = "Sample sizes must be at least 2 and standard deviations must be non-negative."))
        }

        n1 <- input$n1
        m1 <- input$mean1
        s1 <- input$sd1
        n2 <- input$n2
        m2 <- input$mean2
        s2 <- input$sd2

        diff_mean <- m1 - m2
        alpha <- 1 - conf_level

        if (pooled) {
          df <- n1 + n2 - 2
          sp_sq <- ((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / df
          se <- sqrt(sp_sq * (1 / n1 + 1 / n2))
        } else {
          se_sq1 <- s1^2 / n1
          se_sq2 <- s2^2 / n2
          se <- sqrt(se_sq1 + se_sq2)
          df <- (se_sq1 + se_sq2)^2 / ((se_sq1^2 / (n1 - 1)) + (se_sq2^2 / (n2 - 1)))
        }

        t_star <- qt(1 - alpha / 2, df)
        margin_error <- t_star * se

        lower_bound <- diff_mean - margin_error
        upper_bound <- diff_mean + margin_error

        return(list(
          result = list(
            estimate = c("mean of x" = m1, "mean of y" = m2),
            conf.int = c(lower_bound, upper_bound),
            parameter = c("df" = df),
            method = if (pooled) "Two Sample t-test (pooled)" else "Welch Two Sample t-test"
          ),
          data = NULL,
          stats = data.frame(
            Group = c("Group 1", "Group 2"),
            N = c(n1, n2),
            Mean = c(m1, m2),
            SD = c(s1, s2)
          )
        ))
      }
    })

    # --- Plot the confidence interval and data distributions ---
    output$ciPlot <- renderPlot({
      res <- results()
      req(res)
      if (!is.null(res$error)) {
        return(NULL)
      }

      # --- Boxplot of raw data for both groups (if available) ---
      p1 <- if (!is.null(res$data)) {
        ggplot(res$data, aes(x = group, y = value, fill = group)) +
          geom_boxplot(alpha = 0.7) +
          labs(title = "Data Distribution by Group", x = "Group", y = "Value") +
          scale_fill_viridis_d(option = "D", end = 0.85) +
          theme_minimal() +
          theme(legend.position = "none")
      } else {
        ggplot() +
          theme_void() +
          labs(title = "Data plot not available for summary statistics")
      }

      # --- Confidence interval plot for difference in means ---
      ci <- res$result$conf.int
      diff_mean <- res$result$estimate[1] - res$result$estimate[2]
      df_ci <- data.frame(
        estimate = diff_mean,
        lower = ci[1],
        upper = ci[2]
      )

      p2 <- ggplot(df_ci, aes(y = 1)) +
        geom_errorbarh(aes(xmin = lower, xmax = upper), height = 0.2, size = 1.5, color = "#1e40af") +
        geom_point(aes(x = estimate), size = 5, color = "#dc2626") +
        labs(
          title = paste0(input$conf_level * 100, "% Confidence Interval for Difference in Means"),
          x = "Difference (Group 1 - Group 2)",
          y = ""
        ) +
        theme_minimal(base_size = 16) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))

      gridExtra::grid.arrange(p1, p2, nrow = 2, heights = c(2, 1))
    })

    # --- Accessibility: Description for the confidence interval plot ---
    output$ciPlot_desc_text <- renderText({
      res <- results()
      req(res)
      if (!is.null(res$error)) {
        return("No confidence interval plot to describe.")
      }
      conf_level <- input$conf_level * 100
      ci <- res$result$conf.int
      diff_mean <- res$result$estimate[1] - res$result$estimate[2]
      desc <- paste(
        sprintf("This plot displays a %s%% confidence interval for the difference between two population means (Group 1 - Group 2).", conf_level),
        sprintf("The interval is represented by a horizontal error bar. The point estimate for the difference in means, %.4f, is marked with a prominent red dot.", diff_mean),
        sprintf("The confidence interval ranges from a lower bound of %.4f to an upper bound of %.4f.", ci[1], ci[2]),
        "The y-axis is not labeled as it only serves to position the interval. The x-axis is labeled 'Difference (Group 1 - Group 2)'."
      )
      paste(desc, collapse = " ")
    })

    # --- Print results and summary statistics ---
    output$ciResults <- renderPrint({
      res <- results()
      req(res)
      if (!is.null(res$error)) {
        cat(res$error)
      } else {
        test_res <- res$result
        conf_level <- input$conf_level * 100
        diff_mean <- as.numeric(test_res$estimate[1]) - as.numeric(test_res$estimate[2])
        ci <- as.numeric(test_res$conf.int)
        margin_error <- (ci[2] - ci[1]) / 2
        cat(paste0("Method: ", as.character(test_res$method), "\n\n"))
        cat(paste0(conf_level, "% Confidence Interval for \u03bc\u2081 - \u03bc\u2082:\n"))
        cat(sprintf("  [%.4f, %.4f]\n\n", ci[1], ci[2]))
        cat("Point Estimate (x\u0304\u2081 - x\u0304\u2082): ", sprintf("%.4f\n", diff_mean))
        cat("Margin of Error: ", sprintf("%.4f\n", margin_error))
        cat("Degrees of Freedom: ", sprintf("%.3f\n", as.numeric(test_res$parameter["df"])))
      }
    })

    # --- Output: Summary statistics table for both groups ---
    output$sim_stats_ui <- renderUI({
      res <- results()
      if (is.null(res) || !is.null(res$error)) {
        return(NULL)
      }
      stats <- res$stats
      tagList(
        h4("Summary Statistics"),
        tags$table(
          tags$tr(tags$th("Group"), tags$th("N"), tags$th("Mean"), tags$th("SD")),
          lapply(1:nrow(stats), function(i) {
            tags$tr(
              tags$td(stats$Group[i]),
              tags$td(stats$N[i]),
              tags$td(round(stats$Mean[i], 3)),
              tags$td(round(stats$SD[i], 3))
            )
          })
        )
      )
    })

    # --- Output: Accessibility description for the plot ---
    output$plot_desc <- renderUI({
      res <- results()
      if (is.null(res) || !is.null(res$error)) {
        p(class = "sr-only", "No confidence interval plot is available yet.")
      } else {
        p(class = "sr-only", "Boxplots show the distributions for each group if raw data is provided. The confidence interval for the difference in means is shown below.")
      }
    })

    # --- Download handler for results ---
    output$download_results <- downloadHandler(
      filename = function() {
        paste("ci_diff_means_results-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        res <- results()
        if (is.null(res) || !is.null(res$error)) {
          write.csv(data.frame(), file)
        } else {
          stats <- res$stats
          write.csv(stats, file, row.names = FALSE)
        }
      }
    )
  })
}
