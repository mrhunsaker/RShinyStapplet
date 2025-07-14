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
# Stapplet Applet - Confidence Interval for a Difference in Proportions
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# --- Load required libraries ---
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots

# --- UI function for the 'Confidence Interval for a Difference in Proportions' applet ---
# This function builds the user interface for the module, allowing users to:
# - Input sample data for two groups
# - Set confidence level
# - Calculate and view the confidence interval and summary statistics
# - Download results
ci_diff_proportions_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Confidence Interval for a Difference in Proportions (p\u2081 - p\u2082)", id = "appTitle"),
      windowTitle = "CI for a Difference in Proportions"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Sample Data", id = "paramsHeading"),

        # --- Sample 1 Inputs ---
        h4("Sample 1", style = "color: #1d4ed8;"),
        numericInput(ns("n1_success"), "Number of Successes (x\u2081):", value = 50, min = 0, step = 1),
        numericInput(ns("n1_total"), "Sample Size (n\u2081):", value = 100, min = 1, step = 1),

        hr(),

        # --- Sample 2 Inputs ---
        h4("Sample 2", style = "color: #1d4ed8;"),
        numericInput(ns("n2_success"), "Number of Successes (x\u2082):", value = 40, min = 0, step = 1),
        numericInput(ns("n2_total"), "Sample Size (n\u2082):", value = 100, min = 1, step = 1),

        hr(),

        # --- Confidence Level ---
        h3("Confidence Level"),
        sliderInput(ns("conf_level"), "Confidence Level:", min = 0.80, max = 0.999, value = 0.95, step = 0.001),

        actionButton(ns("calculate"), "Calculate Interval", class = "btn-primary", style = "width: 100%;"),
        hr(),
        downloadButton(ns("download_results"), "Download Results")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
            plotOutput(ns("intervalPlot")),
            p(id = ns("intervalPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("intervalPlot_desc_text")))
        ),
        div(class = "results-box",
            h3("Calculation Results", id = "resultsHeading"),
            uiOutput(ns("resultsText"), "aria-live" = "polite")
        ),
        div(class = "results-box", style = "margin-top: 20px; background-color: #fffbeb; border-color: #facc15;",
            h3("Conditions for Inference"),
            uiOutput(ns("conditionsText"), "aria-live" = "polite")
        ),
        uiOutput(ns("sim_stats_ui")),
        uiOutput(ns("plot_desc"))
      )
    )
  )
}

# --- Server function for the 'Confidence Interval for a Difference in Proportions' applet ---
# This function contains all reactive logic, calculations, and output rendering for the module.
ci_diff_proportions_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # --- Reactive expression to perform calculations ---
    results <- eventReactive(input$calculate, {
      # --- Input validation ---
      if (input$n1_total <= 0 || input$n2_total <= 0) {
        return(list(error = "Sample sizes must be greater than zero."))
      }
      if (input$n1_success > input$n1_total || input$n2_success > input$n2_total) {
        return(list(error = "Number of successes cannot exceed sample size."))
      }
      if (input$n1_success < 0 || input$n2_success < 0) {
        return(list(error = "Number of successes cannot be negative."))
      }
      if (is.null(input$conf_level) || input$conf_level <= 0 || input$conf_level >= 1) {
        return(list(error = "Confidence level must be between 0 and 1."))
      }

      # --- Sample statistics ---
      p_hat1 <- input$n1_success / input$n1_total
      p_hat2 <- input$n2_success / input$n2_total
      diff_p_hat <- p_hat1 - p_hat2

      # --- Standard Error ---
      se <- sqrt(p_hat1 * (1 - p_hat1) / input$n1_total + p_hat2 * (1 - p_hat2) / input$n2_total)

      # --- Critical value (z*) ---
      alpha <- 1 - input$conf_level
      z_star <- qnorm(1 - alpha / 2)

      # --- Margin of Error and Confidence Interval ---
      margin_error <- z_star * se
      lower_bound <- diff_p_hat - margin_error
      upper_bound <- diff_p_hat + margin_error

      # --- Check conditions (Success-Failure Condition) ---
      cond1 <- input$n1_success >= 10
      cond2 <- (input$n1_total - input$n1_success) >= 10
      cond3 <- input$n2_success >= 10
      cond4 <- (input$n2_total - input$n2_success) >= 10
      conditions_met <- all(cond1, cond2, cond3, cond4)

      # --- Summary statistics ---
      stats <- data.frame(
        Group = c("Sample 1", "Sample 2"),
        Successes = c(input$n1_success, input$n2_success),
        Failures = c(input$n1_total - input$n1_success, input$n2_total - input$n2_success),
        SampleSize = c(input$n1_total, input$n2_total),
        Proportion = c(p_hat1, p_hat2)
      )

      list(
        p_hat1 = p_hat1, p_hat2 = p_hat2, diff_p_hat = diff_p_hat,
        se = se, z_star = z_star, margin_error = margin_error,
        lower_bound = lower_bound, upper_bound = upper_bound,
        conf_level = input$conf_level,
        n1_success = input$n1_success, n1_fail = input$n1_total - input$n1_success,
        n2_success = input$n2_success, n2_fail = input$n2_total - input$n2_success,
        conditions_met = conditions_met,
        stats = stats
      )
    })

    # --- Render the plot ---
    output$intervalPlot <- renderPlot({
      res <- results()
      if (!is.null(res$error)) return(NULL)
      df_plot <- data.frame(
        estimate = res$diff_p_hat,
        lower = res$lower_bound,
        upper = res$upper_bound
      )

      ggplot(df_plot, aes(x = estimate, y = 1)) +
        geom_vline(xintercept = 0, linetype = "dashed", color = "#dc2626", size = 1) +
        geom_errorbarh(aes(xmin = lower, xmax = upper), height = 0.1, size = 1.5, color = "#1e40af") +
        geom_point(size = 5, color = "#1e40af") +
        labs(
          title = paste0(res$conf_level * 100, "% Confidence Interval for p\u2081 - p\u2082"),
          x = "Difference in Proportions (p\u2081 - p\u2082)",
          y = NULL
        ) +
        theme_minimal() +
        theme(
          plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
          axis.text.y = element_blank(),
          axis.ticks.y = element_blank(),
          panel.grid.major.y = element_blank(),
          panel.grid.minor.y = element_blank()
        )
    })

    # --- Text description for the confidence interval plot (screen reader accessible) ---
    output$intervalPlot_desc_text <- renderText({
      res <- results()
      if (!is.null(res$error)) return("No confidence interval plot to describe.")
      conf_level <- res$conf_level * 100
      diff_p_hat <- res$diff_p_hat
      lower_bound <- res$lower_bound
      upper_bound <- res$upper_bound

      desc <- paste(
        sprintf("This plot shows a %.1f%% confidence interval for the difference between two population proportions (p\u2081 - p\u2082).", conf_level),
        sprintf("The point estimate for the difference, %.4f, is shown as a blue dot.", diff_p_hat),
        sprintf("The confidence interval is a horizontal bar from %.4f to %.4f.", lower_bound, upper_bound),
        "A vertical dashed line at x=0 is included for reference, to easily see if the interval contains zero.",
        "The y-axis is not labeled as it is used only for positioning."
      )
      paste(desc, collapse = " ")
    })

    # --- Render the results text ---
    output$resultsText <- renderUI({
      res <- results()
      if (!is.null(res$error)) {
        return(p(res$error, style = "color: red; font-weight: bold;"))
      }
      HTML(paste(
        "<b>Sample Proportions:</b>",
        sprintf("  \u2022 p\u0302\u2081 = %.4f (%d / %d)", res$p_hat1, input$n1_success, input$n1_total),
        sprintf("  \u2022 p\u0302\u2082 = %.4f (%d / %d)", res$p_hat2, input$n2_success, input$n2_total),
        "<b>Difference in Sample Proportions (p\u0302\u2081 - p\u0302\u2082):</b>",
        sprintf("  \u2022 %.4f", res$diff_p_hat),
        "<b>Standard Error (SE):</b>",
        sprintf("  \u2022 %.4f", res$se),
        "<b>Critical Value (z*):</b>",
        sprintf("  \u2022 %.3f for a %.1f%% confidence level", res$z_star, res$conf_level * 100),
        "<b>Margin of Error (ME):</b>",
        sprintf("  \u2022 z* \u00d7 SE = %.4f", res$margin_error),
        "<b>Confidence Interval:</b>",
        sprintf("  \u2022 (%.4f, %.4f)", res$lower_bound, res$upper_bound),
        "<hr>",
        "<b>Interpretation:</b>",
        paste0("We are ", res$conf_level * 100, "% confident that the true difference in population proportions (p\u2081 - p\u2082) is between ",
               sprintf("%.4f", res$lower_bound), " and ", sprintf("%.4f", res$upper_bound), ".")
      , sep = "<br/>"))
    })

    # --- Render the conditions check ---
    output$conditionsText <- renderUI({
      res <- results()
      if (!is.null(res$error)) return(NULL)
      check_item <- function(label, value, met) {
        icon <- if (met) "\u2714\ufe0f" else "\u274c"
        color <- if (met) "green" else "red"
        sprintf("<li style='color:%s;'>%s %s = %d (must be \u2265 10)</li>", color, icon, label, value)
      }
      cond_list <- paste(
        check_item("Successes in Sample 1 (x\u2081)", res$n1_success, res$n1_success >= 10),
        check_item("Failures in Sample 1 (n\u2081-x\u2081)", res$n1_fail, res$n1_fail >= 10),
        check_item("Successes in Sample 2 (x\u2082)", res$n2_success, res$n2_success >= 10),
        check_item("Failures in Sample 2 (n\u2082-x\u2082)", res$n2_fail, res$n2_fail >= 10),
        sep = ""
      )
      status_msg <- if (res$conditions_met) {
        "<p style='color: green; font-weight: bold;'>The Success-Failure condition is met. The resulting confidence interval is reliable.</p>"
      } else {
        "<p style='color: red; font-weight: bold;'>Warning: The Success-Failure condition is not met. The results may not be reliable.</p>"
      }
      HTML(paste0("<ul>", cond_list, "</ul>", status_msg))
    })

    # --- Output: Summary statistics table for both samples ---
    output$sim_stats_ui <- renderUI({
      res <- results()
      if (is.null(res) || !is.null(res$error)) return(NULL)
      stats <- res$stats
      tagList(
        h4("Summary Statistics"),
        tags$table(
          tags$tr(tags$th("Group"), tags$th("Successes"), tags$th("Failures"), tags$th("Sample Size"), tags$th("Proportion")),
          lapply(1:nrow(stats), function(i) {
            tags$tr(
              tags$td(stats$Group[i]),
              tags$td(stats$Successes[i]),
              tags$td(stats$Failures[i]),
              tags$td(stats$SampleSize[i]),
              tags$td(round(stats$Proportion[i], 4))
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
        p(class = "sr-only", "The confidence interval for the difference in proportions is shown as a horizontal bar. Summary statistics for each sample are displayed above.")
      }
    })

    # --- Download handler for results ---
    output$download_results <- downloadHandler(
      filename = function() {
        paste("ci_diff_proportions_results-", Sys.Date(), ".csv", sep = "")
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
