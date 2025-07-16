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
# Stapplet Applet - t-Distribution Calculator & Simulator
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################
# Enhanced t-Distribution Applet for R Shiny
# Feature parity with STAPLET HTML/JS applet

library(shiny)
library(ggplot2)
library(dplyr)
library(shinyjs)
library(DT)
library(BrailleR)

default_prefs <- list(
  color_palette = "viridis",
  rounding = 4,
  percent_display = FALSE
)

dist_t_ui <- function(id) {
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
    h2("t-Distribution Calculator", id = "appTitle"),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "complementary",
        "aria-labelledby" = "paramsHeading",
        h3("Distribution Parameters", id = "paramsHeading"),
        div(
          class = "form-group",
          tags$label(id = ns("df_label"), "Degrees of Freedom (df):"),
          sliderInput(ns("df"), NULL, min = 1, max = 300, value = 10, step = 1, width = "100%")
        ),
        div(
          class = "form-group",
          checkboxInput(ns("show_normal"), "Also plot normal distribution as dashed line", value = FALSE)
        ),
        hr(role = "separator"),
        h3("Operation", id = "operationHeading"),
        selectInput(ns("operation"), "Select operation:",
          choices = c("Calculate area under t curve" = "cdf", "Calculate t-value for area" = "inv"),
          selected = "cdf"
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'cdf'", ns("operation")),
          div(
            class = "form-group",
            tags$label(id = ns("region_type_label"), "Region type:"),
            selectInput(ns("region_type"), NULL,
              choices = c(
                "between two values" = "between",
                "to the left of a value" = "left",
                "to the right of a value" = "right",
                "outside a region" = "outside"
              ),
              selected = "between"
            )
          ),
          div(
            class = "form-group",
            checkboxInput(ns("show_labels"), "Show labels on plot", value = TRUE)
          ),
          conditionalPanel(
            condition = sprintf("input['%s'] == 'between' || input['%s'] == 'outside'", ns("region_type"), ns("region_type")),
            div(
              class = "form-group",
              tags$label(id = ns("left_label"), "Left boundary:"),
              numericInput(ns("left"), NULL, value = -1, step = 0.1, width = "100%")
            ),
            div(
              class = "form-group",
              tags$label(id = ns("right_label"), "Right boundary:"),
              numericInput(ns("right"), NULL, value = 1, step = 0.1, width = "100%")
            )
          ),
          conditionalPanel(
            condition = sprintf("input['%s'] == 'left' || input['%s'] == 'right'", ns("region_type"), ns("region_type")),
            div(
              class = "form-group",
              tags$label(id = ns("single_label"), "Value:"),
              numericInput(ns("single"), NULL, value = 0, step = 0.1, width = "100%")
            )
          ),
          actionButton(ns("calc_cdf"), "Calculate area", class = "btn-primary")
        ),
        conditionalPanel(
          condition = sprintf("input['%s'] == 'inv'", ns("operation")),
          div(
            class = "form-group",
            tags$label(id = ns("inv_type_label"), "Region type:"),
            selectInput(ns("inv_type"), NULL,
              choices = c(
                "left-tail" = "left",
                "right-tail" = "right",
                "central" = "center"
              ),
              selected = "left"
            )
          ),
          div(
            class = "form-group",
            checkboxInput(ns("show_inv_labels"), "Show labels on plot", value = TRUE)
          ),
          div(
            class = "form-group",
            tags$label(id = ns("area_label"), "Area:"),
            numericInput(ns("area"), NULL, value = 0.05, min = 0, max = 1, step = 0.01, width = "100%")
          ),
          actionButton(ns("calc_inv"), "Calculate value(s)", class = "btn-primary")
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
        id = "mainPanel",
        role = "main",
        "aria-labelledby" = "appTitle",
        tags$div(
          class = "error-msg",
          `aria-live` = "assertive",
          textOutput(ns("error_msg"))
        ),
        div(
          class = "plot-container",
          plotOutput(ns("tPlot"), height = "350px"),
          tags$script(paste0("document.getElementById('", ns("tPlot"), "').setAttribute('aria-label', 'A plot showing the t-distribution curve and shaded region.')")),
          p(id = "plotDescription", class = "sr-only", role = "status", "aria-live" = "polite", textOutput(ns("brailleRDescription")))
        ),
        div(
          class = "results-box",
          h3("Result:", id = "probResultHeading"),
          htmlOutput(ns("result_text")),
          DTOutput(ns("result_table"))
        )
      )
    )
  )
}

# --- Server Logic for t-Distribution Calculator & Simulator ---
# This function contains all reactive logic, calculations, and output rendering for the module.
dist_t_server <- function(id) {
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

    # --- Distribution Data ---
    distribution_data <- reactive({
      req(input$df)
      x_range <- max(4, qt(0.999, df = input$df))
      x <- seq(-x_range, x_range, length.out = 500)
      y <- dt(x, df = input$df)
      data.frame(x = x, y = y)
    })

    # --- Calculation Logic ---
    calculation <- reactive({
      op <- input$operation
      df <- input$df
      rounding <- prefs()$rounding
      percent <- prefs()$percent_display

      if (op == "cdf") {
        region <- input$region_type
        show_labels <- input$show_labels
        if (region == "between" || region == "outside") {
          left <- input$left
          right <- input$right
          if (is.null(left) || is.null(right) || is.na(left) || is.na(right)) {
            error_msg("Region bounds must be numeric.")
            return(NULL)
          }
          if (left > right) {
            error_msg("Left bound must be less than right bound.")
            return(NULL)
          }
          area <- pt(right, df) - pt(left, df)
          if (region == "outside") area <- 1 - area
          error_msg("")
          area_disp <- if (percent) paste0(round(area * 100, rounding), "%") else round(area, rounding)
          list(
            type = "cdf",
            region = region,
            left = left,
            right = right,
            area = area,
            area_disp = area_disp,
            show_labels = show_labels
          )
        } else if (region == "left" || region == "right") {
          single <- input$single
          if (is.null(single) || is.na(single)) {
            error_msg("Value must be numeric.")
            return(NULL)
          }
          if (region == "left") {
            area <- pt(single, df)
          } else {
            area <- 1 - pt(single, df)
          }
          error_msg("")
          area_disp <- if (percent) paste0(round(area * 100, rounding), "%") else round(area, rounding)
          list(
            type = "cdf",
            region = region,
            single = single,
            area = area,
            area_disp = area_disp,
            show_labels = show_labels
          )
        }
      } else if (op == "inv") {
        inv_type <- input$inv_type
        area <- input$area
        show_labels <- input$show_inv_labels
        if (is.null(area) || is.na(area) || area < 0 || area > 1) {
          error_msg("Area must be between 0 and 1.")
          return(NULL)
        }
        if (abs(area - 1) < 1e-8) {
          error_msg("")
          if (inv_type == "center") {
            return(list(
              type = "inv",
              inv_type = inv_type,
              area = area,
              value = c(-Inf, Inf),
              value_disp = "Range = -∞ ≤ t ≤ ∞",
              show_labels = show_labels
            ))
          } else {
            return(list(
              type = "inv",
              inv_type = inv_type,
              area = area,
              value = if (inv_type == "left") Inf else -Inf,
              value_disp = paste("Value =", if (inv_type == "left") "∞" else "-∞"),
              show_labels = show_labels
            ))
          }
        }
        if (inv_type == "left") {
          value <- qt(area, df)
          value_disp <- paste("Value =", round(value, rounding))
        } else if (inv_type == "right") {
          value <- qt(1 - area, df)
          value_disp <- paste("Value =", round(value, rounding))
        } else if (inv_type == "center") {
          value <- qt((1 - area) / 2, df)
          value_disp <- paste("Range =", round(value, rounding), "≤ t ≤", round(-value, rounding))
          value <- c(value, -value)
        }
        error_msg("")
        list(
          type = "inv",
          inv_type = inv_type,
          area = area,
          value = value,
          value_disp = value_disp,
          show_labels = show_labels
        )
      }
    })

    # --- Plot Logic ---
    plot_object_reactive <- reactive({
      df <- distribution_data()
      plot_df <- input$df
      palette <- prefs()$color_palette
      op <- input$operation
      show_normal <- input$show_normal
      calc <- calculation()
      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(
          title = paste("t-Distribution (df =", plot_df, ")"),
          x = "t-value", y = "Density"
        ) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold", color = "#0f172a"))
      # Normal overlay
      if (show_normal) {
        y_norm <- dnorm(df$x)
        p <- p + geom_line(aes(y = y_norm), color = "black", linetype = "dashed", linewidth = 1)
      }
      # Shading
      if (!is.null(calc)) {
        if (calc$type == "cdf") {
          if (calc$region == "left" && !is.null(calc$single)) {
            x_shade <- seq(min(df$x), calc$single, length.out = 100)
            y_shade <- dt(x_shade, df = plot_df)
            p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5)
            if (calc$show_labels) {
              p <- p + geom_vline(xintercept = calc$single, linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          } else if (calc$region == "right" && !is.null(calc$single)) {
            x_shade <- seq(calc$single, max(df$x), length.out = 100)
            y_shade <- dt(x_shade, df = plot_df)
            p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5)
            if (calc$show_labels) {
              p <- p + geom_vline(xintercept = calc$single, linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          } else if ((calc$region == "between" || calc$region == "outside") && !is.null(calc$left) && !is.null(calc$right)) {
            if (calc$region == "between") {
              x_shade <- seq(calc$left, calc$right, length.out = 100)
              y_shade <- dt(x_shade, df = plot_df)
              p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#84cc16", alpha = 0.5)
            } else { # outside
              x_shade1 <- seq(min(df$x), calc$left, length.out = 100)
              y_shade1 <- dt(x_shade1, df = plot_df)
              x_shade2 <- seq(calc$right, max(df$x), length.out = 100)
              y_shade2 <- dt(x_shade2, df = plot_df)
              p <- p +
                geom_area(data = data.frame(x = x_shade1, y = y_shade1), aes(x = x, y = y), fill = "#f472b6", alpha = 0.5) +
                geom_area(data = data.frame(x = x_shade2, y = y_shade2), aes(x = x, y = y), fill = "#f472b6", alpha = 0.5)
            }
            if (calc$show_labels) {
              p <- p +
                geom_vline(xintercept = calc$left, linetype = "solid", color = "#ef4444", linewidth = 0.8) +
                geom_vline(xintercept = calc$right, linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          }
        } else if (calc$type == "inv") {
          if (calc$inv_type == "left" && is.finite(calc$value)) {
            if (calc$show_labels) {
              p <- p + geom_vline(xintercept = calc$value, linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          } else if (calc$inv_type == "right" && is.finite(calc$value)) {
            if (calc$show_labels) {
              p <- p + geom_vline(xintercept = calc$value, linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          } else if (calc$inv_type == "center" && all(is.finite(calc$value))) {
            if (calc$show_labels) {
              p <- p +
                geom_vline(xintercept = calc$value[1], linetype = "solid", color = "#ef4444", linewidth = 0.8) +
                geom_vline(xintercept = calc$value[2], linetype = "solid", color = "#ef4444", linewidth = 0.8)
            }
          }
        }
      }
      p
    })

    # --- Error Message Output ---
    output$error_msg <- renderText({
      error_msg()
    })

    # --- Plot Output ---
    output$tPlot <- renderPlot({
      plot_object_reactive()
    })

    # --- Result Output ---
    output$result_text <- renderUI({
      calc <- calculation()
      if (is.null(calc)) {
        return(NULL)
      }
      if (calc$type == "cdf") {
        if (calc$region == "between") {
          HTML(paste0("Area between t = ", calc$left, " and t = ", calc$right, ": <b>", calc$area_disp, "</b>"))
        } else if (calc$region == "outside") {
          HTML(paste0("Area outside t = ", calc$left, " and t = ", calc$right, ": <b>", calc$area_disp, "</b>"))
        } else if (calc$region == "left") {
          HTML(paste0("Area to the left of t = ", calc$single, ": <b>", calc$area_disp, "</b>"))
        } else if (calc$region == "right") {
          HTML(paste0("Area to the right of t = ", calc$single, ": <b>", calc$area_disp, "</b>"))
        }
      } else if (calc$type == "inv") {
        HTML(paste0(calc$value_disp))
      }
    })

    output$result_table <- renderDT({
      calc <- calculation()
      rounding <- prefs()$rounding
      percent <- prefs()$percent_display
      if (is.null(calc)) {
        return(datatable(data.frame()))
      }
      if (calc$type == "cdf") {
        if (calc$region == "between" || calc$region == "outside") {
          datatable(data.frame(
            Region = paste(calc$region, "(", calc$left, ",", calc$right, ")"),
            Area = calc$area_disp
          ), rownames = FALSE, options = list(dom = "t"))
        } else {
          datatable(data.frame(
            Region = paste(calc$region, "(", ifelse(is.null(calc$single), "", calc$single), ")"),
            Area = calc$area_disp
          ), rownames = FALSE, options = list(dom = "t"))
        }
      } else if (calc$type == "inv") {
        if (calc$inv_type == "center" && all(is.finite(calc$value))) {
          datatable(data.frame(
            Type = "Central",
            Lower = round(calc$value[1], rounding),
            Upper = round(calc$value[2], rounding)
          ), rownames = FALSE, options = list(dom = "t"))
        } else {
          datatable(data.frame(
            Type = calc$inv_type,
            Value = if (is.finite(calc$value)) round(calc$value, rounding) else calc$value_disp
          ), rownames = FALSE, options = list(dom = "t"))
        }
      }
    })

    # --- BrailleR Description ---
    output$brailleRDescription <- renderText({
      if (!requireNamespace("BrailleR", quietly = TRUE)) {
        return("BrailleR package not installed, cannot generate plot description.")
      }
      plot_for_description <- plot_object_reactive()
      temp_plot_file <- tempfile(fileext = ".png")
      tryCatch({
        png(temp_plot_file, width = 800, height = 600, res = 100)
        print(plot_for_description)
        dev.off()
        braille_desc <- suppressWarnings(suppressMessages(BrailleR::VI(Plot = temp_plot_file, alttext = TRUE)))
        if (is.null(braille_desc) || nchar(braille_desc) == 0) {
          "A detailed description of the t-distribution plot will be provided here."
        } else {
          braille_desc
        }
      }, error = function(e) {
        paste("Error generating plot description:", e$message)
      }, finally = {
        unlink(temp_plot_file)
      })
    })

    # --- Download Plot ---
    output$download_plot <- downloadHandler(
      filename = function() {
        paste0("tdist_plot_", Sys.Date(), ".png")
      },
      content = function(file) {
        p <- plot_object_reactive()
        ggsave(file, plot = p, width = 7, height = 4.5, dpi = 300)
      }
    )

    # --- Download Table ---
    output$download_table <- downloadHandler(
      filename = function() {
        paste0("tdist_results_", Sys.Date(), ".csv")
      },
      content = function(file) {
        calc <- calculation()
        rounding <- prefs()$rounding
        percent <- prefs()$percent_display
        if (is.null(calc)) {
          write.csv(data.frame(), file, row.names = FALSE)
        } else if (calc$type == "cdf") {
          if (calc$region == "between" || calc$region == "outside") {
            df <- data.frame(
              Region = paste(calc$region, "(", calc$left, ",", calc$right, ")"),
              Area = calc$area_disp
            )
          } else {
            df <- data.frame(
              Region = paste(calc$region, "(", ifelse(is.null(calc$single), "", calc$single), ")"),
              Area = calc$area_disp
            )
          }
          write.csv(df, file, row.names = FALSE)
        } else if (calc$type == "inv") {
          if (calc$inv_type == "center" && all(is.finite(calc$value))) {
            df <- data.frame(
              Type = "Central",
              Lower = round(calc$value[1], rounding),
              Upper = round(calc$value[2], rounding)
            )
          } else {
            df <- data.frame(
              Type = calc$inv_type,
              Value = if (is.finite(calc$value)) round(calc$value, rounding) else calc$value_disp
            )
          }
          write.csv(df, file, row.names = FALSE)
        }
      }
    )

    # --- Accessibility: Keyboard Navigation ---
    observe({
      runjs(sprintf("document.getElementById('%s').setAttribute('tabindex', '0');", ns("tPlot")))
    })

    # --- Calculate on Button Click ---
    observeEvent(input$calc_cdf, {
      calculation()
    })
    observeEvent(input$calc_inv, {
      calculation()
    })
  })
}

# Uncomment below to run as standalone app for testing
# shinyApp(
#   ui = dist_t_ui("tdist"),
#   server = function(input, output, session) {
#     dist_t_server("tdist")
#   }
# )
