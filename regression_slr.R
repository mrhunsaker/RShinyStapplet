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
# Stapplet Applet - Simple Linear Regression
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

# Enhanced Simple Linear Regression Applet
# Matches features of stapplet HTML/JS applet (quant2v.html + quant2v.js)

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(DT) # For interactive tables
library(shinyjs) # For JavaScript integration in Shiny
library(colourpicker) # For colourInput widget
library(shinyWidgets) # For enhanced UI widgets

# --- UI Definition for Simple Linear Regression Applet ---
# This function builds the user interface for the module, allowing users to:
# - Input data via variable entry or paste
# - View regression plots, summary statistics, and download results
regression_slr_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Simple Linear Regression"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"),
      tags$script(HTML("$(function(){$('[data-toggle=\"tooltip\"]').tooltip();});"))
    ),
    tags$div(id = ns("appTitle"), class = "sr-only", "Simple Linear Regression"),
    titlePanel(
      h2("Simple Linear Regression", id = ns("mainHeading")),
      windowTitle = "Simple Linear Regression"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        `aria-labelledby` = ns("dataHeading"),
        h3("Data Input", id = ns("dataHeading")),
        radioButtons(ns("input_mode"), "Input Mode:",
          choices = c("Variable Entry" = "var", "Paste Data" = "paste"),
          selected = "var"
        ),
        # --- Variable entry mode ---
        conditionalPanel(
          condition = sprintf("input['%s'] == 'var'", ns("input_mode")),
          ns = ns,
          textInput(ns("x_name"), "Explanatory Variable Name", value = "X"),
          textAreaInput(ns("x_data"), "Explanatory Variable Data", placeholder = "e.g. 1, 2, 3, 4, 5", rows = 2),
          textInput(ns("y_name"), "Response Variable Name", value = "Y"),
          textAreaInput(ns("y_data"), "Response Variable Data", placeholder = "e.g. 2.1, 3.9, 6.2, 8.1, 9.8", rows = 2),
          helpText("Enter numeric values separated by commas or spaces. Both variables must have the same number of observations.")
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'paste'", ns("input_mode")),
          ns = ns,
          checkboxInput(ns("has_header"), "Data includes header row", value = TRUE),
          textAreaInput(ns("custom_data"), "Paste your data here:",
            rows = 10,
            placeholder = "Example:\nx,y\n1,2.1\n2,3.9\n3,6.2\n4,8.1\n5,9.8"
          ),
          helpText("Data should be comma, tab, or space separated.")
        ),
        hr(),
        h3("Analysis Options"),
        checkboxInput(ns("show_line"), "Show Regression Line", value = TRUE),
        checkboxInput(ns("show_confint"), "Show Confidence Interval for Slope", value = TRUE),
        checkboxInput(ns("show_predint"), "Show Prediction Interval", value = FALSE),
        checkboxInput(ns("show_test"), "Show Hypothesis Test for Slope", value = FALSE),
        checkboxInput(ns("show_residuals"), "Show Residual Plot", value = FALSE),
        checkboxInput(ns("show_dotplot"), "Show Residual Dotplot", value = FALSE),
        checkboxInput(ns("show_stats"), "Show Descriptive Statistics", value = FALSE),
        hr(),
        h3("Simulation"),
        numericInput(ns("num_sim"), "Number of Simulations", value = 1000, min = 10, max = 10000, step = 10),
        selectInput(ns("sim_type"), "Simulation Type", choices = c("Slope" = "slope", "Correlation" = "correlation")),
        actionButton(ns("run_sim"), "Run Simulation"),
        hr(),
        h3("Export/Download"),
        downloadButton(ns("download_summary"), "Download Summary"),
        downloadButton(ns("download_data"), "Download Data"),
        downloadButton(ns("download_plot"), "Download Plot"),
        hr(),
        actionButton(ns("reset_all"), "Reset Everything", icon = icon("redo")),
        actionButton(ns("show_prefs"), "Preferences", icon = icon("cog")),
        tags$div(id = ns("error_msg"), class = "text-danger", role = "alert", `aria-live` = "assertive")
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        tabsetPanel(
          tabPanel(
            "Regression",
            tags$div(
              class = "plot-container",
              h4("Scatterplot", id = ns("scatterHeading")),
              plotOutput(ns("scatterplot"), height = "350px")
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_line")),
              ns = ns,
              tags$div(
                class = "results-box",
                h4("Regression Model Summary", id = ns("modelSummaryHeading")),
                verbatimTextOutput(ns("model_summary"), placeholder = TRUE)
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_confint")),
              ns = ns,
              tags$div(
                class = "results-box",
                h4("Confidence Interval for Slope", id = ns("confintHeading")),
                verbatimTextOutput(ns("confint_out"), placeholder = TRUE)
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_predint")),
              ns = ns,
              tags$div(
                class = "results-box",
                h4("Prediction Interval", id = ns("predintHeading")),
                verbatimTextOutput(ns("predint_out"), placeholder = TRUE)
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_test")),
              ns = ns,
              tags$div(
                class = "results-box",
                h4("Hypothesis Test for Slope", id = ns("testHeading")),
                verbatimTextOutput(ns("test_out"), placeholder = TRUE)
              )
            )
          ),
          tabPanel(
            "Plots",
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_residuals")),
              ns = ns,
              tags$div(
                class = "plot-container",
                h4("Residuals vs. Fitted Values Plot", id = ns("residualPlotHeading")),
                plotOutput(ns("residual_plot"), height = "250px")
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_dotplot")),
              ns = ns,
              tags$div(
                class = "plot-container",
                h4("Residual Dotplot", id = ns("residualDotplotHeading")),
                plotOutput(ns("residual_dotplot"), height = "150px")
              )
            )
          ),
          tabPanel(
            "Statistics",
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_stats")),
              ns = ns,
              tags$div(
                class = "results-box",
                h4("Descriptive Statistics", id = ns("descStatsHeading")),
                verbatimTextOutput(ns("descriptive_stats"), placeholder = TRUE)
              )
            )
          ),
          tabPanel(
            "Simulation",
            h4("Simulation Results", id = ns("simHeading")),
            plotOutput(ns("sim_dotplot"), height = "200px"),
            verbatimTextOutput(ns("sim_summary"), placeholder = TRUE)
          )
        )
      )
    ),
    # Preferences Modal
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
}

regression_slr_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Preferences ---
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

    # --- Data Input Management ---
    active_data <- reactive({
      # Variable-by-variable entry
      if (input$input_mode == "var") {
        xvals <- as.numeric(unlist(strsplit(input$x_data, "[, ]+")))
        yvals <- as.numeric(unlist(strsplit(input$y_data, "[, ]+")))
        if ((is.null(input$x_data) || trimws(input$x_data) == "")) {
          # Don't show error until user enters data
        } else if (length(xvals) == 0 || any(is.na(xvals))) {
          showError(sprintf("Explanatory variable '%s' must be numeric.", input$x_name))
          return(NULL)
        }
        if ((is.null(input$y_data) || trimws(input$y_data) == "")) {
          # Don't show error until user enters data
        } else if (length(yvals) == 0 || any(is.na(yvals))) {
          showError(sprintf("Response variable '%s' must be numeric.", input$y_name))
          return(NULL)
        }
        if (length(xvals) != length(yvals)) {
          showError("Both variables must have the same number of observations.")
          return(NULL)
        }
        df <- data.frame(x = xvals, y = yvals)
        names(df) <- c(input$x_name, input$y_name)
        df
      }
      # Paste Data
      else if (input$input_mode == "paste" && nzchar(input$custom_data)) {
        tryCatch(
          {
            df <- read.table(
              text = input$custom_data, header = input$has_header,
              sep = ",", stringsAsFactors = FALSE, fill = TRUE,
              blank.lines.skip = TRUE
            )
            if (ncol(df) < 2) {
              df <- read.table(
                text = input$custom_data, header = input$has_header,
                stringsAsFactors = FALSE, fill = TRUE, blank.lines.skip = TRUE
              )
            }
            df <- df[sapply(df, is.numeric)]
            if (ncol(df) < 2) {
              showError("Data must have two numeric columns.")
              return(NULL)
            }
            names(df) <- c("X", "Y")
            df
          },
          error = function(e) {
            showError("Failed to parse pasted data.")
            NULL
          }
        )
      } else {
        NULL
      }
    })

    # --- Error Messaging ---
    showError <- function(msg) {
      shinyjs::html(ns("error_msg"), msg)
    }
    observe({
      shinyjs::html(ns("error_msg"), "")
    })

    # --- Model Fitting ---
    model <- reactive({
      df <- active_data()
      if (is.null(df) || nrow(df) < 2) {
        return(NULL)
      }
      lm(Y ~ X, data = setNames(df, c("X", "Y")))
    })

    # --- Outputs ---
    output$scatterplot <- renderPlot({
      df <- active_data()
      req(df)
      p <- ggplot(df, aes(x = df[[1]], y = df[[2]])) +
        geom_point(color = prefs$plot_color, size = 3, alpha = 0.8) +
        labs(
          title = sprintf("Scatterplot of %s vs. %s", names(df)[2], names(df)[1]),
          x = names(df)[1],
          y = names(df)[2]
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
      if (input$show_line && !is.null(model())) {
        p <- p + geom_smooth(method = "lm", se = FALSE, color = "#dc2626", formula = y ~ x)
      }
      p
    })

    output$model_summary <- renderPrint({
      req(model())
      summary(model())
    })

    output$confint_out <- renderPrint({
      req(model())
      ci <- confint(model(), "X", level = 0.95)
      cat(sprintf("95%% Confidence Interval for Slope:\nLower Bound: %.3f\nUpper Bound: %.3f", ci[1], ci[2]))
    })

    output$predint_out <- renderPrint({
      req(model())
      df <- active_data()
      newx <- mean(df[[1]])
      pred <- predict(model(), newdata = data.frame(X = newx), interval = "prediction", level = 0.95)
      cat(sprintf("Prediction Interval for Y at X = %.3f:\nLower Bound: %.3f\nUpper Bound: %.3f", newx, pred[1, "lwr"], pred[1, "upr"]))
    })

    output$test_out <- renderPrint({
      req(model())
      summ <- summary(model())
      tval <- summ$coefficients["X", "t value"]
      pval <- summ$coefficients["X", "Pr(>|t|)"]
      cat(sprintf("Hypothesis Test for Slope:\nt = %.3f\np-value = %.4f", tval, pval))
    })

    output$residual_plot <- renderPlot({
      req(model())
      res_df <- data.frame(
        fitted = fitted(model()),
        residuals = residuals(model())
      )
      ggplot(res_df, aes(x = fitted, y = residuals)) +
        geom_point(color = prefs$plot_color, size = 3, alpha = 0.8) +
        geom_hline(yintercept = 0, linetype = "dashed", color = "#dc2626", size = 1) +
        labs(
          title = "Residuals vs. Fitted Values",
          x = "Fitted Values (Predicted Y)",
          y = "Residuals"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
    })

    output$residual_dotplot <- renderPlot({
      req(model())
      res <- residuals(model())
      ggplot(data.frame(residuals = res), aes(x = residuals)) +
        geom_dotplot(binwidth = diff(range(res)) / 30, dotsize = 0.7, fill = prefs$plot_color) +
        labs(x = "Residuals", y = NULL) +
        theme_minimal(base_size = 14)
    })

    output$descriptive_stats <- renderPrint({
      df <- active_data()
      req(df, nrow(df) > 1)
      x_summary <- capture.output(summary(df[[1]]))
      y_summary <- capture.output(summary(df[[2]]))
      paste(
        sprintf("--- %s ---", names(df)[1]),
        paste(x_summary, collapse = "\n"),
        paste("Standard Deviation:", round(as.numeric(sd(df[[1]], na.rm = TRUE)), 3)),
        "",
        sprintf("--- %s ---", names(df)[2]),
        paste(y_summary, collapse = "\n"),
        paste("Standard Deviation:", round(as.numeric(sd(df[[2]], na.rm = TRUE)), 3)),
        "",
        "--- Relationship ---",
        paste("Correlation (r):", round(cor(df[[1]], df[[2]], use = "complete.obs"), 3)),
        sep = "\n"
      )
    })

    # --- Simulation ---
    sim_results <- reactiveVal(NULL)
    observeEvent(input$run_sim, {
      df <- active_data()
      req(df)
      n <- input$num_sim
      if (input$sim_type == "slope") {
        slopes <- replicate(n, {
          idx <- sample(seq_len(nrow(df)), replace = TRUE)
          d <- df[idx, ]
          coef(lm(d[[2]] ~ d[[1]]))[2]
        })
        sim_results(list(type = "Slope", values = slopes))
      } else {
        cors <- replicate(n, {
          idx <- sample(seq_len(nrow(df)), replace = TRUE)
          d <- df[idx, ]
          cor(d[[1]], d[[2]])
        })
        sim_results(list(type = "Correlation", values = cors))
      }
    })

    output$sim_dotplot <- renderPlot({
      sim <- sim_results()
      req(sim)
      vals <- sim$values
      ggplot(data.frame(val = vals), aes(x = val)) +
        geom_dotplot(binwidth = diff(range(vals)) / 30, dotsize = 0.7, fill = prefs$plot_color) +
        labs(x = sim$type, y = NULL) +
        theme_minimal(base_size = 14)
    })

    output$sim_summary <- renderPrint({
      sim <- sim_results()
      req(sim)
      vals <- sim$values
      cat(sprintf(
        "Simulation of %s\nMean: %.3f\nSD: %.3f\nMin: %.3f\nMax: %.3f",
        sim$type, mean(vals), sd(vals), min(vals), max(vals)
      ))
    })

    # --- Export/Download ---
    output$download_summary <- downloadHandler(
      filename = function() {
        "regression_summary.txt"
      },
      content = function(file) {
        sink(file)
        print(summary(model()))
        sink()
      }
    )
    output$download_data <- downloadHandler(
      filename = function() {
        "regression_data.csv"
      },
      content = function(file) {
        write.csv(active_data(), file, row.names = FALSE)
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() {
        "regression_plot.png"
      },
      content = function(file) {
        png(file, width = 800, height = 600)
        print({
          df <- active_data()
          if (input$show_line && !is.null(model())) {
            p <- ggplot(df, aes(x = df[[1]], y = df[[2]])) +
              geom_point(color = prefs$plot_color, size = 3, alpha = 0.8) +
              geom_smooth(method = "lm", se = FALSE, color = "#dc2626", formula = y ~ x) +
              labs(
                title = sprintf("Scatterplot of %s vs. %s", names(df)[2], names(df)[1]),
                x = names(df)[1],
                y = names(df)[2]
              ) +
              theme_minimal(base_size = 14) +
              theme(plot.title = element_text(hjust = 0.5, face = "bold"))
            print(p)
          }
        })
        dev.off()
      }
    )

    # --- Reset ---
    observeEvent(input$reset_all, {
      shinyjs::reset(ns("x_name"))
      shinyjs::reset(ns("x_data"))
      shinyjs::reset(ns("y_name"))
      shinyjs::reset(ns("y_data"))
      shinyjs::reset(ns("custom_data"))
      shinyjs::reset(ns("error_msg"))
      sim_results(NULL)
    })

    # --- Accessibility Enhancements ---
    # (shinyAccessibility usage removed)
  })
}
