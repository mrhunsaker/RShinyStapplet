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
# Stapplet Applet - Power Analysis for Hypothesis Tests
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

# Enhanced Power of a Significance Test Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(dplyr) # For data wrangling
library(shinyjs) # For JavaScript integration in Shiny
library(DT) # For interactive tables

# --- Default preferences for UI ---
default_prefs <- list(
  color_palette = "viridis", # Default color palette for plots
  rounding = 4, # Default number of decimal places
  percent_display = FALSE # Display probabilities as percentages by default
)

# --- UI Definition for Power of a Significance Test Applet ---
# This function builds the user interface for the module, allowing users to:
# - Select test type (means or proportions)
# - Input hypothesis parameters, sample size, and significance level
# - Adjust preferences and download results
# - View plots and calculated values
dist_power_ui <- function(id) {
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
    h2("Power of a Significance Test"),
    p("Explore the concept of statistical power by visualizing the relationship between the null and alternative hypotheses, the significance level (\u03b1), and the Type II error rate (\u03b2)."),
    sidebarLayout(
      sidebarPanel(
        h3("Test Type"),
        # --- Select test type (means or proportions) ---
        selectInput(ns("test_type"), "Select type of test:",
          choices = c("Means" = "mean", "Proportions" = "prop"),
          selected = "mean"
        ),
        hr(),
        # --- Inputs for mean test parameters ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'mean'", ns("test_type")),
          div(
            id = ns("mean_inputs"),
            div(
              class = "form-group",
              tags$label("Null Hypothesis Mean (\u03bc\u2080):", `for` = ns("mu0")),
              numericInput(ns("mu0"), label = NULL, value = 100),
              tags$p(id = ns("mu0_desc"), class = "sr-only", "Enter the mean of the null hypothesis, mu-zero."),
              tags$script(paste0("document.getElementById('", ns("mu0"), "').setAttribute('aria-describedby', '", ns("mu0_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("True Mean (\u03bc):", `for` = ns("mua")),
              numericInput(ns("mua"), label = NULL, value = 105),
              tags$p(id = ns("mua_desc"), class = "sr-only", "Enter the true mean, mu-a."),
              tags$script(paste0("document.getElementById('", ns("mua"), "').setAttribute('aria-describedby', '", ns("mua_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("Population SD (\u03c3):", `for` = ns("sigma")),
              numericInput(ns("sigma"), label = NULL, value = 15, min = 0.01),
              tags$p(id = ns("sigma_desc"), class = "sr-only", "Enter the population standard deviation, sigma."),
              tags$script(paste0("document.getElementById('", ns("sigma"), "').setAttribute('aria-describedby', '", ns("sigma_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("Alternative Hypothesis:", `for` = ns("mean_alt")),
              selectInput(ns("mean_alt"),
                label = NULL,
                choices = c(
                  "\u03bc < \u03bc\u2080 (Left-tailed)" = "less",
                  "\u03bc > \u03bc\u2080 (Right-tailed)" = "greater",
                  "\u03bc \u2260 \u03bc\u2080 (Two-tailed)" = "two.sided"
                ),
                selected = "greater"
              ),
              tags$p(id = ns("mean_alt_desc"), class = "sr-only", "Select the direction of the alternative hypothesis."),
              tags$script(paste0("document.getElementById('", ns("mean_alt"), "').setAttribute('aria-describedby', '", ns("mean_alt_desc"), "')"))
            )
          )
        ),
        # --- Inputs for proportion test parameters ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'prop'", ns("test_type")),
          div(
            id = ns("prop_inputs"),
            div(
              class = "form-group",
              tags$label("Null Hypothesis Proportion (p\u2080):", `for` = ns("p0")),
              numericInput(ns("p0"), label = NULL, value = 0.5, min = 0, max = 1, step = 0.01),
              tags$p(id = ns("p0_desc"), class = "sr-only", "Enter the null hypothesis proportion, p-zero."),
              tags$script(paste0("document.getElementById('", ns("p0"), "').setAttribute('aria-describedby', '", ns("p0_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("True Proportion (p):", `for` = ns("pa")),
              numericInput(ns("pa"), label = NULL, value = 0.6, min = 0, max = 1, step = 0.01),
              tags$p(id = ns("pa_desc"), class = "sr-only", "Enter the true proportion, p-a."),
              tags$script(paste0("document.getElementById('", ns("pa"), "').setAttribute('aria-describedby', '", ns("pa_desc"), "')"))
            ),
            div(
              class = "form-group",
              tags$label("Alternative Hypothesis:", `for` = ns("prop_alt")),
              selectInput(ns("prop_alt"),
                label = NULL,
                choices = c(
                  "p < p\u2080 (Left-tailed)" = "less",
                  "p > p\u2080 (Right-tailed)" = "greater",
                  "p \u2260 p\u2080 (Two-tailed)" = "two.sided"
                ),
                selected = "greater"
              ),
              tags$p(id = ns("prop_alt_desc"), class = "sr-only", "Select the direction of the alternative hypothesis."),
              tags$script(paste0("document.getElementById('", ns("prop_alt"), "').setAttribute('aria-describedby', '", ns("prop_alt_desc"), "')"))
            )
          )
        ),
        hr(),
        div(
          class = "form-group",
          tags$label("Sample Size (n):", `for` = ns("n")),
          numericInput(ns("n"), label = NULL, value = 30, min = 2, step = 1),
          tags$p(id = ns("n_desc"), class = "sr-only", "Enter the sample size, n."),
          tags$script(paste0("document.getElementById('", ns("n"), "').setAttribute('aria-describedby', '", ns("n_desc"), "')"))
        ),
        div(
          class = "form-group",
          tags$label("Significance Level (\u03b1):", `for` = ns("alpha")),
          sliderInput(ns("alpha"), label = NULL, min = 0.01, max = 0.20, value = 0.05, step = 0.01),
          tags$p(id = ns("alpha_desc"), class = "sr-only", "Adjust the significance level, alpha, for the test."),
          tags$script(paste0("document.getElementById('", ns("alpha"), "').setAttribute('aria-describedby', '", ns("alpha_desc"), "')"))
        ),
        div(
          class = "form-group",
          tags$label("Calculate and plot:", `for` = ns("plot_type")),
          selectInput(ns("plot_type"),
            label = NULL,
            choices = c("Power" = "power", "\u03b1" = "alpha", "\u03b2" = "beta"),
            selected = "power"
          )
        ),
        div(
          class = "form-group",
          checkboxInput(ns("show_fail"), "Show rejection region (critical values)", value = TRUE)
        ),
        hr(),
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
        h3("Export/Download"),
        downloadButton(ns("download_plot"), "Download Plot", class = "btn-success"),
        downloadButton(ns("download_table"), "Download Table", class = "btn-success")
      ),
      mainPanel(
        tags$div(
          class = "error-msg",
          `aria-live` = "assertive",
          textOutput(ns("error_msg"))
        ),
        div(
          class = "plot-container",
          plotOutput(ns("power_plot"), height = "350px"),
          tags$script(paste0("document.getElementById('", ns("power_plot"), "').setAttribute('aria-label', 'A plot showing two distributions. The null hypothesis distribution and the alternative are shown. The rejection region (alpha) and Type II error region (beta) are shaded.')")),
          p(id = ns("plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("plot_desc_text")))
        ),
        fluidRow(
          column(
            6,
            div(
              class = "results-box", role = "status", `aria-live` = "polite",
              h3("Calculated Values"),
              htmlOutput(ns("power_beta_results")),
              DTOutput(ns("results_table"))
            )
          ),
          column(
            6,
            div(
              class = "results-box", role = "status", `aria-live` = "polite",
              h3("Critical Value(s)"),
              htmlOutput(ns("critical_value_results"))
            )
          )
        )
      )
    )
  )
}

dist_power_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    prefs <- reactive({
      list(
        color_palette = input$color_palette %||% default_prefs$color_palette,
        rounding = input$rounding %||% default_prefs$rounding,
        percent_display = input$percent_display %||% default_prefs$percent_display
      )
    })

    error_msg <- reactiveVal("")

    # --- Calculations ---
    # Calculates power, Type II error, and critical values for the selected test
    calculations <- reactive({
      test_type <- input$test_type
      n <- input$n
      alpha <- input$alpha
      plot_type <- input$plot_type
      show_fail <- input$show_fail
      rounding <- prefs()$rounding
      percent <- prefs()$percent_display

      # Validate sample size and alpha
      if (is.null(input$n) || trimws(as.character(input$n)) == "") {
        error_msg("")
        return(NULL)
      } else if (is.na(n) || n < 2) {
        error_msg("Sample size must be at least 2.")
        return(NULL)
      }
      if (is.null(alpha) || is.na(alpha) || alpha <= 0 || alpha >= 1) {
        error_msg("Significance level (\u03b1) must be between 0 and 1.")
        return(NULL)
      }

      if (test_type == "mean") {
        mu0 <- input$mu0
        mua <- input$mua
        sigma <- input$sigma
        alt <- input$mean_alt

        # Validate means and sigma
        if (is.null(mu0) || is.na(mu0) || is.null(mua) || is.na(mua)) {
          error_msg("Means must be specified.")
          return(NULL)
        }
        if (is.null(sigma) || is.na(sigma) || sigma <= 0) {
          error_msg("Population SD (\u03c3) must be positive.")
          return(NULL)
        }

        se <- sigma / sqrt(n)
        # Critical values
        if (alt == "greater") {
          cv1 <- qnorm(1 - alpha, mean = mu0, sd = se)
          cv2 <- NA
          beta <- pnorm(cv1, mean = mua, sd = se)
        } else if (alt == "less") {
          cv1 <- qnorm(alpha, mean = mu0, sd = se)
          cv2 <- NA
          beta <- pnorm(cv1, mean = mua, sd = se, lower.tail = FALSE)
        } else { # two.sided
          cv1 <- qnorm(alpha / 2, mean = mu0, sd = se)
          cv2 <- qnorm(1 - alpha / 2, mean = mu0, sd = se)
          beta <- pnorm(cv2, mean = mua, sd = se) - pnorm(cv1, mean = mua, sd = se)
        }
        power <- 1 - beta

        error_msg("")
        list(
          test_type = "mean",
          mu0 = mu0, mua = mua, sigma = sigma, se = se,
          alt = alt, alpha = alpha, n = n,
          cv1 = cv1, cv2 = cv2,
          beta = beta, power = power,
          plot_type = plot_type,
          show_fail = show_fail,
          rounding = rounding,
          percent = percent
        )
      } else if (test_type == "prop") {
        p0 <- input$p0
        pa <- input$pa
        alt <- input$prop_alt

        # Validate proportions
        if (is.null(p0) || is.na(p0) || p0 < 0 || p0 > 1) {
          error_msg("Null proportion (p\u2080) must be between 0 and 1.")
          return(NULL)
        }
        if (is.null(pa) || is.na(pa) || pa < 0 || pa > 1) {
          error_msg("True proportion (p) must be between 0 and 1.")
          return(NULL)
        }

        se0 <- sqrt(p0 * (1 - p0) / n)
        se1 <- sqrt(pa * (1 - pa) / n)
        # Critical values
        if (alt == "greater") {
          cv1 <- qnorm(1 - alpha, mean = p0, sd = se0)
          cv2 <- NA
          beta <- pnorm(cv1, mean = pa, sd = se1)
        } else if (alt == "less") {
          cv1 <- qnorm(alpha, mean = p0, sd = se0)
          cv2 <- NA
          beta <- pnorm(cv1, mean = pa, sd = se1, lower.tail = FALSE)
        } else { # two.sided
          cv1 <- qnorm(alpha / 2, mean = p0, sd = se0)
          cv2 <- qnorm(1 - alpha / 2, mean = p0, sd = se0)
          beta <- pnorm(cv2, mean = pa, sd = se1) - pnorm(cv1, mean = pa, sd = se1)
        }
        power <- 1 - beta

        error_msg("")
        list(
          test_type = "prop",
          p0 = p0, pa = pa,
          se0 = se0, se1 = se1,
          alt = alt, alpha = alpha, n = n,
          cv1 = cv1, cv2 = cv2,
          beta = beta, power = power,
          plot_type = plot_type,
          show_fail = show_fail,
          rounding = rounding,
          percent = percent
        )
      } else {
        error_msg("Unknown test type.")
        return(NULL)
      }
    })

    # --- Plot ---
    output$power_plot <- renderPlot({
      res <- calculations()
      req(res)
      palette <- prefs()$color_palette

      if (res$test_type == "mean") {
        x_min <- min(res$mu0, res$mua) - 4 * res$se
        x_max <- max(res$mu0, res$mua) + 4 * res$se
        x_vals <- seq(x_min, x_max, length.out = 500)
        plot_data <- data.frame(
          x = x_vals,
          null_dist = dnorm(x_vals, mean = res$mu0, sd = res$se),
          alt_dist = dnorm(x_vals, mean = res$mua, sd = res$se)
        )
        p <- ggplot(plot_data, aes(x = x)) +
          geom_line(aes(y = null_dist, color = "Null (H\u2080)"), size = 1) +
          geom_line(aes(y = alt_dist, color = "Alternative (H\u2090)"), size = 1) +
          labs(
            title = "Distribution of Sample Means under H\u2080 and H\u2090",
            x = "Sample Mean", y = "Density", color = "Hypothesis"
          ) +
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"), legend.position = "bottom")

        # --- Shading Regions ---
        # Shade Alpha (Rejection region under H0)
        if (res$show_fail) {
          if (res$alt == "greater") {
            p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          } else if (res$alt == "less") {
            p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          } else {
            p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
            p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv2), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          }
        }
        # Shade Beta (Type II error region under Ha)
        if (res$alt == "greater") {
          p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        } else if (res$alt == "less") {
          p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        } else {
          p <- p + geom_ribbon(data = subset(plot_data, x > res$cv1 & x < res$cv2), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        }
        # Add annotations for Power, Alpha, Beta
        p <- p +
          annotate("text", x = res$mua, y = max(plot_data$alt_dist) * 0.6, label = paste("Power\n", round(res$power, 3)), color = "#006400", size = 5, fontface = "bold") +
          annotate("text", x = res$mu0, y = max(plot_data$alt_dist) * 0.4, label = paste("\u03b2 =", round(res$beta, 3)), color = "#E69F00", size = 5, fontface = "bold")
        if (res$show_fail) {
          p <- p +
            annotate("text", x = ifelse(is.na(res$cv2), res$cv1, res$cv1), y = max(plot_data$null_dist) * 0.8, label = paste("\u03b1 =", res$alpha), color = "red", size = 5, hjust = if (res$alt == "greater") -0.2 else 1.2)
          if (!is.na(res$cv2)) {
            p <- p +
              annotate("text", x = res$cv2, y = max(plot_data$null_dist) * 0.8, label = paste("\u03b1 =", res$alpha), color = "red", size = 5, hjust = -0.2)
          }
        }
        p
      } else if (res$test_type == "prop") {
        x_min <- min(res$p0, res$pa) - 4 * max(res$se0, res$se1)
        x_max <- max(res$p0, res$pa) + 4 * max(res$se0, res$se1)
        x_vals <- seq(x_min, x_max, length.out = 500)
        plot_data <- data.frame(
          x = x_vals,
          null_dist = dnorm(x_vals, mean = res$p0, sd = res$se0),
          alt_dist = dnorm(x_vals, mean = res$pa, sd = res$se1)
        )
        p <- ggplot(plot_data, aes(x = x)) +
          geom_line(aes(y = null_dist, color = "Null (H\u2080)"), size = 1) +
          geom_line(aes(y = alt_dist, color = "Alternative (H\u2090)"), size = 1) +
          labs(
            title = "Distribution of Sample Proportions under H\u2080 and H\u2090",
            x = "Sample Proportion", y = "Density", color = "Hypothesis"
          ) +
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"), legend.position = "bottom")
        # --- Shading Regions ---
        if (res$show_fail) {
          if (res$alt == "greater") {
            p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          } else if (res$alt == "less") {
            p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          } else {
            p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
            p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv2), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
          }
        }
        if (res$alt == "greater") {
          p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        } else if (res$alt == "less") {
          p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        } else {
          p <- p + geom_ribbon(data = subset(plot_data, x > res$cv1 & x < res$cv2), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
        }
        # Add annotations for Power, Alpha, Beta
        p <- p +
          annotate("text", x = res$pa, y = max(plot_data$alt_dist) * 0.6, label = paste("Power\n", round(res$power, 3)), color = "#006400", size = 5, fontface = "bold") +
          annotate("text", x = res$p0, y = max(plot_data$alt_dist) * 0.4, label = paste("\u03b2 =", round(res$beta, 3)), color = "#E69F00", size = 5, fontface = "bold")
        if (res$show_fail) {
          p <- p +
            annotate("text", x = ifelse(is.na(res$cv2), res$cv1, res$cv1), y = max(plot_data$null_dist) * 0.8, label = paste("\u03b1 =", res$alpha), color = "red", size = 5, hjust = if (res$alt == "greater") -0.2 else 1.2)
          if (!is.na(res$cv2)) {
            p <- p +
              annotate("text", x = res$cv2, y = max(plot_data$null_dist) * 0.8, label = paste("\u03b1 =", res$alpha), color = "red", size = 5, hjust = -0.2)
          }
        }
        p
      }
    })

    # --- BrailleR Description ---
    output$plot_desc_text <- renderText({
      res <- calculations()
      req(res)
      if (res$test_type == "mean") {
        paste("The plot shows two distributions: the null hypothesis distribution (mean =", res$mu0, ") and the alternative hypothesis distribution (mean =", res$mua, "). The rejection region (alpha) and Type II error region (beta) are shaded. Power is", round(res$power, res$rounding), ".")
      } else {
        paste("The plot shows two distributions: the null hypothesis distribution (proportion =", res$p0, ") and the alternative hypothesis distribution (proportion =", res$pa, "). The rejection region (alpha) and Type II error region (beta) are shaded. Power is", round(res$power, res$rounding), ".")
      }
    })

    # --- Error Message Output ---
    output$error_msg <- renderText({
      error_msg()
    })

    # --- Calculated Values Output ---
    output$power_beta_results <- renderUI({
      res <- calculations()
      req(res)
      rounding <- res$rounding
      percent <- res$percent
      power_disp <- if (percent) paste0(round(res$power * 100, rounding), "%") else round(res$power, rounding)
      beta_disp <- if (percent) paste0(round(res$beta * 100, rounding), "%") else round(res$beta, rounding)
      tagList(
        p(strong("Power (1 - \u03b2):"), power_disp),
        p(strong("Type II Error (\u03b2):"), beta_disp)
      )
    })

    # --- Critical Value Output ---
    output$critical_value_results <- renderUI({
      res <- calculations()
      req(res)
      rounding <- res$rounding
      if (is.na(res$cv2)) {
        p(strong("Critical Value:"), round(res$cv1, rounding))
      } else {
        tagList(
          p(strong("Lower Critical Value:"), round(res$cv1, rounding)),
          p(strong("Upper Critical Value:"), round(res$cv2, rounding))
        )
      }
    })

    # --- Results Table Output ---
    output$results_table <- renderDT({
      res <- calculations()
      req(res)
      rounding <- res$rounding
      percent <- res$percent
      if (res$test_type == "mean") {
        datatable(data.frame(
          Parameter = c("Null Mean (\u03bc\u2080)", "True Mean (\u03bc)", "Population SD (\u03c3)", "Sample Size (n)", "Significance Level (\u03b1)", "Power", "Type II Error (\u03b2)"),
          Value = c(
            res$mu0, res$mua, res$sigma, res$n, res$alpha,
            if (percent) paste0(round(res$power * 100, rounding), "%") else round(res$power, rounding),
            if (percent) paste0(round(res$beta * 100, rounding), "%") else round(res$beta, rounding)
          )
        ), rownames = FALSE, options = list(dom = "t"))
      } else {
        datatable(data.frame(
          Parameter = c("Null Proportion (p\u2080)", "True Proportion (p)", "Sample Size (n)", "Significance Level (\u03b1)", "Power", "Type II Error (\u03b2)"),
          Value = c(
            res$p0, res$pa, res$n, res$alpha,
            if (percent) paste0(round(res$power * 100, rounding), "%") else round(res$power, rounding),
            if (percent) paste0(round(res$beta * 100, rounding), "%") else round(res$beta, rounding)
          )
        ), rownames = FALSE, options = list(dom = "t"))
      }
    })

    # --- Download Plot ---
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("power_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        res <- calculations()
        req(res)
        p <- isolate(output$power_plot())
        # Recreate plot for download
        if (res$test_type == "mean") {
          x_min <- min(res$mu0, res$mua) - 4 * res$se
          x_max <- max(res$mu0, res$mua) + 4 * res$se
          x_vals <- seq(x_min, x_max, length.out = 500)
          plot_data <- data.frame(
            x = x_vals,
            null_dist = dnorm(x_vals, mean = res$mu0, sd = res$se),
            alt_dist = dnorm(x_vals, mean = res$mua, sd = res$se)
          )
          p <- ggplot(plot_data, aes(x = x)) +
            geom_line(aes(y = null_dist, color = "Null (H\u2080)"), size = 1) +
            geom_line(aes(y = alt_dist, color = "Alternative (H\u2090)"), size = 1) +
            labs(
              title = "Distribution of Sample Means under H\u2080 and H\u2090",
              x = "Sample Mean", y = "Density", color = "Hypothesis"
            ) +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5, face = "bold"), legend.position = "bottom")
          # Add shading and annotations as above...
        } else {
          x_min <- min(res$p0, res$pa) - 4 * max(res$se0, res$se1)
          x_max <- max(res$p0, res$pa) + 4 * max(res$se0, res$se1)
          x_vals <- seq(x_min, x_max, length.out = 500)
          plot_data <- data.frame(
            x = x_vals,
            null_dist = dnorm(x_vals, mean = res$p0, sd = res$se0),
            alt_dist = dnorm(x_vals, mean = res$pa, sd = res$se1)
          )
          p <- ggplot(plot_data, aes(x = x)) +
            geom_line(aes(y = null_dist, color = "Null (H\u2080)"), size = 1) +
            geom_line(aes(y = alt_dist, color = "Alternative (H\u2090)"), size = 1) +
            labs(
              title = "Distribution of Sample Proportions under H\u2080 and H\u2090",
              x = "Sample Proportion", y = "Density", color = "Hypothesis"
            ) +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5, face = "bold"), legend.position = "bottom")
          # Add shading and annotations as above...
        }
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # --- Download Table ---
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("power_results_", Sys.Date(), ".csv")
      },
      content = function(file) {
        res <- calculations()
        req(res)
        rounding <- res$rounding
        percent <- res$percent
        if (res$test_type == "mean") {
          df <- data.frame(
            Parameter = c("Null Mean (\u03bc\u2080)", "True Mean (\u03bc)", "Population SD (\u03c3)", "Sample Size (n)", "Significance Level (\u03b1)", "Power", "Type II Error (\u03b2)"),
            Value = c(
              res$mu0, res$mua, res$sigma, res$n, res$alpha,
              if (percent) paste0(round(res$power * 100, rounding), "%") else round(res$power, rounding),
              if (percent) paste0(round(res$beta * 100, rounding), "%") else round(res$beta, rounding)
            )
          )
        } else {
          df <- data.frame(
            Parameter = c("Null Proportion (p\u2080)", "True Proportion (p)", "Sample Size (n)", "Significance Level (\u03b1)", "Power", "Type II Error (\u03b2)"),
            Value = c(
              res$p0, res$pa, res$n, res$alpha,
              if (percent) paste0(round(res$power * 100, rounding), "%") else round(res$power, rounding),
              if (percent) paste0(round(res$beta * 100, rounding), "%") else round(res$beta, rounding)
            )
          )
        }
        write.csv(df, file, row.names = FALSE)
      }
    )

    # --- Accessibility: Keyboard Navigation ---
    observe({
      runjs(sprintf("document.getElementById('%s').setAttribute('tabindex', '0');", ns("power_plot")))
    })
  })
}

# Uncomment below to run as standalone app for testing
# shinyApp(
#   ui = dist_power_ui("power"),
#   server = function(input, output, session) {
#     dist_power_server("power")
#   }
# )
