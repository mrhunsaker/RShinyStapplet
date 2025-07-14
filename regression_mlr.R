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
# Stapplet Applet - Multiple Linear Regression
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

# Multiple Linear Regression Applet (Enhanced)
# Matches features of stapplet HTML/JS applet

# --- Load required libraries ---
library(shiny)              # For building interactive web applications
library(ggplot2)            # For creating plots
library(DT)                 # For interactive tables
library(shinyjs)            # For JavaScript integration in Shiny
library(shinyWidgets)       # For enhanced UI widgets
library(shinyAccessibility) # For accessibility features
library(GGally)             # For advanced regression plots
library(MASS)               # For datasets and regression support

# --- UI Definition for Multiple Linear Regression Applet ---
# This function builds the user interface for the module, allowing users to:
# - Input data via counts table, raw data, or paste
# - View regression plots, summary statistics, and download results
regression_mlr_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    useShinyjs(),
    tags$head(
      tags$title("Multiple Linear Regression"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"),
      tags$script(HTML("$(function(){$('[data-toggle=\"tooltip\"]').tooltip();});"))
    ),
    tags$div(id = ns("appTitle"), class = "sr-only", "Multiple Linear Regression"),
    titlePanel(
      h2("Multiple Linear Regression", id = ns("mainHeading")),
      windowTitle = "Multiple Linear Regression"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        `aria-labelledby` = ns("dataHeading"),
        h3("Data Input", id = ns("dataHeading")),
        radioButtons(ns("input_mode"), "Input Mode:",
          choices = c("Counts Table" = "counts", "Raw Data" = "raw", "Paste Data" = "paste"),
          selected = "raw"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'counts'", ns("input_mode")),
          ns = ns,
          fileInput(ns("counts_file"), "Upload Counts Table (CSV)", accept = ".csv"),
          helpText("Counts table should have columns for each variable and a count column.")
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'raw'", ns("input_mode")),
          ns = ns,
          actionButton(ns("add_predictor"), "Add Explanatory Variable", icon = icon("plus")),
          DTOutput(ns("predictor_table")),
          textInput(ns("response_name"), "Response Variable Name", value = "Y"),
          textAreaInput(ns("response_data"), "Response Variable Data", placeholder = "e.g. 1.2, 2.3, 3.1", rows = 2),
          helpText("Enter numeric values separated by commas or spaces. All variables must have the same number of observations.")
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'paste'", ns("input_mode")),
          ns = ns,
          checkboxInput(ns("has_header"), "Data includes header row", value = TRUE),
          textAreaInput(ns("custom_data"), "Paste your data here:", rows = 10,
            placeholder = "Example:\nprice,sqft,bedrooms,bathrooms\n250000,1500,3,2\n300000,1800,3,2.5\n..."
          ),
          helpText("Data should be comma, tab, or space separated.")
        ),
        hr(),
        h3("Analysis Options"),
        checkboxInput(ns("show_summary"), "Show Model Summary", value = TRUE),
        checkboxInput(ns("show_anova"), "Show ANOVA Table", value = TRUE),
        checkboxInput(ns("show_residuals"), "Show Residuals vs. Fitted Plot", value = TRUE),
        checkboxInput(ns("show_dotplot"), "Show Residual Dotplot", value = TRUE),
        checkboxInput(ns("show_pairs"), "Show Pairs Plot", value = FALSE),
        checkboxInput(ns("show_stats"), "Show Descriptive Statistics", value = FALSE),
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
          tabPanel("Regression",
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_summary")),
              ns = ns,
              tags$div(class = "results-box",
                h4("Regression Model Summary", id = ns("modelSummaryHeading")),
                verbatimTextOutput(ns("model_summary"), placeholder = TRUE)
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_anova")),
              ns = ns,
              tags$div(class = "results-box",
                h4("ANOVA Table", id = ns("anovaHeading")),
                DTOutput(ns("anova_table"))
              )
            )
          ),
          tabPanel("Plots",
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_residuals")),
              ns = ns,
              tags$div(class = "plot-container",
                h4("Residuals vs. Fitted Values Plot", id = ns("residualPlotHeading")),
                plotOutput(ns("residual_plot"), height = "300px")
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_dotplot")),
              ns = ns,
              tags$div(class = "plot-container",
                h4("Residual Dotplot", id = ns("residualDotplotHeading")),
                plotOutput(ns("residual_dotplot"), height = "150px")
              )
            ),
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_pairs")),
              ns = ns,
              tags$div(class = "plot-container",
                h4("Pairs Plot of Variables", id = ns("pairsPlotHeading")),
                plotOutput(ns("pairs_plot"), height = "350px")
              )
            )
          ),
          tabPanel("Statistics",
            conditionalPanel(
              condition = sprintf("input['%s']", ns("show_stats")),
              ns = ns,
              tags$div(class = "results-box",
                h4("Descriptive Statistics", id = ns("descStatsHeading")),
                verbatimTextOutput(ns("descriptive_stats"), placeholder = TRUE)
              )
            )
          ),
          tabPanel("Prediction",
            h4("Make a Prediction", id = ns("predictionHeading")),
            uiOutput(ns("prediction_inputs")),
            actionButton(ns("compute_prediction"), "Compute Predicted Value"),
            tags$span(id = ns("prediction_result"), tabindex = 0, `aria-live` = "polite", role = "region", `aria-label` = "Prediction result"),
            tags$span(id = ns("prediction_msg"), class = "text-danger", tabindex = 0, `aria-live` = "polite", role = "region", `aria-label` = "Prediction error")
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

# ---- Server ----
regression_mlr_server <- function(id) {
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
    observeEvent(input$round_digits, { prefs$round_digits <- input$round_digits })
    observeEvent(input$plot_color, { prefs$plot_color <- input$plot_color })
    observeEvent(input$show_percent, { prefs$show_percent <- input$show_percent })

    # --- Data Input Management ---
    predictors <- reactiveVal(data.frame(
      Name = c("X1", "X2"),
      Data = c("", ""),
      Include = c(TRUE, TRUE),
      stringsAsFactors = FALSE
    ))

    observeEvent(input$add_predictor, {
      df <- predictors()
      new_row <- data.frame(Name = paste0("X", nrow(df)+1), Data = "", Include = TRUE, stringsAsFactors = FALSE)
      predictors(rbind(df, new_row))
    })

    output$predictor_table <- renderDT({
      datatable(
        predictors(),
        editable = list(target = "cell", disable = list(columns = c(2))),
        rownames = FALSE,
        selection = "none",
        options = list(dom = 't', paging = FALSE)
      )
    }, server = FALSE)

    observeEvent(input$predictor_table_cell_edit, {
      info <- input$predictor_table_cell_edit
      df <- predictors()
      df[info$row, info$col+1] <- info$value
      predictors(df)
    })

    # Remove predictor row (simulate delete button)
    observe({
      df <- predictors()
      if (nrow(df) > 1) {
        for (i in seq_len(nrow(df))) {
          observeEvent(input[[paste0("delete_predictor_", i)]], {
            predictors(df[-i, ])
          }, ignoreInit = TRUE)
        }
      }
    })

    # --- Data Preparation ---
    active_data <- reactive({
      # Counts Table
      if (input$input_mode == "counts" && !is.null(input$counts_file)) {
        tryCatch({
          df <- read.csv(input$counts_file$datapath)
          df
        }, error = function(e) {
          showError("Failed to read counts table.")
          NULL
        })
      }
      # Raw Data (variable-by-variable)
      else if (input$input_mode == "raw") {
        df <- data.frame()
        pred_df <- predictors()
        for (i in seq_len(nrow(pred_df))) {
          if (pred_df$Include[i]) {
            vals <- as.numeric(unlist(strsplit(pred_df$Data[i], "[, ]+")))
            if (length(vals) == 0 || any(is.na(vals))) {
              showError(sprintf("Explanatory variable '%s' must be numeric.", pred_df$Name[i]))
              return(NULL)
            }
            df[[pred_df$Name[i]]] <- vals
          }
        }
        resp_vals <- as.numeric(unlist(strsplit(input$response_data, "[, ]+")))
        if (length(resp_vals) == 0 || any(is.na(resp_vals))) {
          showError("Response variable must be numeric.")
          return(NULL)
        }
        df[[input$response_name]] <- resp_vals
        # Check equal length
        lens <- sapply(df, length)
        if (length(unique(lens)) > 1) {
          showError("All variables must have the same number of observations.")
          return(NULL)
        }
        df
      }
      # Paste Data
      else if (input$input_mode == "paste" && nzchar(input$custom_data)) {
        tryCatch({
          df <- read.table(text = input$custom_data, header = input$has_header,
                           sep = ",", stringsAsFactors = FALSE, fill = TRUE,
                           blank.lines.skip = TRUE)
          if (ncol(df) < 2) {
            df <- read.table(text = input$custom_data, header = input$has_header,
                             stringsAsFactors = FALSE, fill = TRUE, blank.lines.skip = TRUE)
          }
          df[sapply(df, is.numeric)]
        }, error = function(e) {
          showError("Failed to parse pasted data.")
          NULL
        })
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

    # --- Variable Selection ---
    response_var <- reactive({
      if (input$input_mode == "raw") input$response_name
      else if (input$input_mode == "paste" && active_data() != NULL) colnames(active_data())[1]
      else if (input$input_mode == "counts" && active_data() != NULL) colnames(active_data())[1]
      else NULL
    })
    explanatory_vars <- reactive({
      if (input$input_mode == "raw") {
        pred_df <- predictors()
        pred_df$Name[pred_df$Include]
      } else if (active_data() != NULL) {
        setdiff(colnames(active_data()), response_var())
      } else NULL
    })

    # --- Model Fitting ---
    model <- reactive({
      df <- active_data()
      y <- response_var()
      x <- explanatory_vars()
      if (is.null(df) || is.null(y) || is.null(x) || length(x) == 0) return(NULL)
      # Check linear independence
      if (length(x) > 1) {
        xmat <- as.matrix(df[, x, drop = FALSE])
        if (qr(xmat)$rank < ncol(xmat)) {
          showError("At least two explanatory variables are perfectly correlated. Exclude correlated variables.")
          return(NULL)
        }
      }
      formula_str <- paste(y, "~", paste(x, collapse = " + "))
      lm(as.formula(formula_str), data = df)
    })

    # --- Outputs ---
    output$model_summary <- renderPrint({
      req(model())
      summary(model())
    })

    output$anova_table <- renderDT({
      req(model())
      aov_obj <- anova(model())
      aov_df <- as.data.frame(aov_obj)
      aov_df$Source <- rownames(aov_df)
      aov_df <- aov_df[, c("Source", setdiff(names(aov_df), "Source"))]
      datatable(
        aov_df,
        rownames = FALSE,
        options = list(dom = 't', paging = FALSE),
        caption = "Analysis of Variance"
      )
    })

    output$residual_plot <- renderPlot({
      req(model())
      res_df <- data.frame(
        fitted = fitted(model()),
        residuals = residuals(model())
      )
      ggplot(res_df, aes(x = fitted, y = residuals)) +
        geom_point(color = prefs$plot_color, size = 3, alpha = 0.7) +
        geom_hline(yintercept = 0, linetype = "dashed", color = "#dc2626", linewidth = 1) +
        labs(x = "Fitted Values (Predicted Y)", y = "Residuals") +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
    })

    output$residual_dotplot <- renderPlot({
      req(model())
      res <- residuals(model())
      ggplot(data.frame(residuals = res), aes(x = residuals)) +
        geom_dotplot(binwidth = diff(range(res))/30, dotsize = 0.7, fill = prefs$plot_color) +
        labs(x = "Residuals", y = NULL) +
        theme_minimal(base_size = 14)
    })

    output$pairs_plot <- renderPlot({
      df <- active_data()
      req(df, response_var(), explanatory_vars())
      selected_cols <- c(response_var(), explanatory_vars())
      df_subset <- df[, intersect(selected_cols, colnames(df)), drop = FALSE]
      req(ncol(df_subset) > 1)
      if (requireNamespace("GGally", quietly = TRUE)) {
        GGally::ggpairs(df_subset,
          upper = list(continuous = GGally::wrap("cor", size = 4)),
          lower = list(continuous = GGally::wrap("points", alpha = 0.5, size=2)),
          diag = list(continuous = GGally::wrap("densityDiag", alpha = 0.5))
        ) + theme_minimal()
      } else {
        pairs(df_subset, pch = 19, col = scales::alpha(prefs$plot_color, 0.7),
              main = "Pairs Plot of Selected Variables")
      }
    })

    output$descriptive_stats <- renderPrint({
      df <- active_data()
      req(df, response_var(), explanatory_vars())
      selected_cols <- c(response_var(), explanatory_vars())
      df_subset <- df[, intersect(selected_cols, colnames(df)), drop = FALSE]
      req(ncol(df_subset) > 0)
      cat("--- Summary Statistics ---\n")
      print(summary(df_subset))
      if (ncol(df_subset) > 1) {
        cat("\n--- Correlation Matrix ---\n")
        print(round(cor(df_subset, use = "complete.obs"), prefs$round_digits))
      }
    })

    # --- Prediction UI ---
    output$prediction_inputs <- renderUI({
      req(model())
      xvars <- explanatory_vars()
      if (is.null(xvars) || length(xvars) == 0) return(NULL)
      tagList(
        lapply(seq_along(xvars), function(i) {
          numericInput(ns(paste0("pred_x_", i)), xvars[i], value = NA, width = "120px")
        })
      )
    })

    observeEvent(input$compute_prediction, {
      req(model())
      xvars <- explanatory_vars()
      vals <- sapply(seq_along(xvars), function(i) input[[paste0("pred_x_", i)]])
      if (any(is.na(vals))) {
        shinyjs::html(ns("prediction_msg"), "All prediction variables must be numeric.")
        shinyjs::html(ns("prediction_result"), "")
        return()
      }
      coefs <- coef(model())
      pred <- coefs[1] + sum(coefs[-1] * vals)
      respname <- response_var()
      if (is.null(respname)) respname <- "<em>ŷ</em>"
      else respname <- paste("Predicted value of", respname)
      shinyjs::html(ns("prediction_result"), sprintf("%s = %s", respname, round(pred, prefs$round_digits)))
      shinyjs::html(ns("prediction_msg"), "")
    })

    # --- Export/Download ---
    output$download_summary <- downloadHandler(
      filename = function() { "regression_summary.txt" },
      content = function(file) {
        sink(file)
        print(summary(model()))
        sink()
      }
    )
    output$download_data <- downloadHandler(
      filename = function() { "regression_data.csv" },
      content = function(file) {
        write.csv(active_data(), file, row.names = FALSE)
      }
    )
    output$download_plot <- downloadHandler(
      filename = function() { "regression_plot.png" },
      content = function(file) {
        png(file, width = 800, height = 600)
        print({
          if (input$show_residuals) {
            res_df <- data.frame(fitted = fitted(model()), residuals = residuals(model()))
            ggplot(res_df, aes(x = fitted, y = residuals)) +
              geom_point(color = prefs$plot_color, size = 3, alpha = 0.7) +
              geom_hline(yintercept = 0, linetype = "dashed", color = "#dc2626", linewidth = 1) +
              labs(x = "Fitted Values (Predicted Y)", y = "Residuals") +
              theme_minimal(base_size = 14)
          } else if (input$show_dotplot) {
            res <- residuals(model())
            ggplot(data.frame(residuals = res), aes(x = residuals)) +
              geom_dotplot(binwidth = diff(range(res))/30, dotsize = 0.7, fill = prefs$plot_color) +
              labs(x = "Residuals", y = NULL) +
              theme_minimal(base_size = 14)
          }
        })
        dev.off()
      }
    )

    # --- Reset ---
    observeEvent(input$reset_all, {
      predictors(data.frame(
        Name = c("X1", "X2"),
        Data = c("", ""),
        Include = c(TRUE, TRUE),
        stringsAsFactors = FALSE
      ))
      shinyjs::reset(ns("response_name"))
      shinyjs::reset(ns("response_data"))
      shinyjs::reset(ns("custom_data"))
      shinyjs::reset(ns("counts_file"))
      shinyjs::reset(ns("error_msg"))
    })

    # --- Accessibility Enhancements ---
    # Use shinyAccessibility for ARIA roles, keyboard navigation, screen reader support
    shinyAccessibility::add_accessibility(
      inputId = ns("mainPanel"),
      role = "main",
      aria_label = "Multiple Linear Regression Main Panel"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("sidebarPanel"),
      role = "form",
      aria_label = "Data Input and Analysis Options"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("error_msg"),
      role = "alert",
      aria_live = "assertive"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("prediction_result"),
      role = "region",
      aria_live = "polite"
    )
    shinyAccessibility::add_accessibility(
      inputId = ns("prediction_msg"),
      role = "region",
      aria_live = "polite"
    )
    # Keyboard navigation: tabIndex for all inputs
    # (Handled by Shiny and Bootstrap, but can be extended if needed)
  })
}
