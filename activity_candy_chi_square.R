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
# Stapplet Activity - Chi-Square Goodness-of-Fit for Candy
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# Load required libraries for UI, plotting, and data manipulation
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots
library(dplyr)    # For data wrangling

# UI function for the "M&M's/Skittles/Froot Loops" Chi-Square Goodness-of-Fit Activity
# This function builds the user interface for the module, allowing users to input data,
# run simulations, and view results.
activity_candy_chi_square_ui <- function(id) {
  ns <- NS(id)  # Namespace for module inputs/outputs

  fluidPage(
    h2("Activity: Chi-Square Goodness-of-Fit Test for Candy"),
    # Instructions panel: step-by-step guide for users
    wellPanel(
      h3("Instructions"),
      p("This activity lets you test if a sample of categorical data (like the colors in a bag of candy) matches a claimed distribution (e.g., the percentages the candy company says they produce)."),
      tags$ol(
        tags$li("Choose your data input mode: either enter a table of categories, claimed proportions, and observed counts, or paste raw categorical data."),
        tags$li("For each color, enter its name, the company's claimed proportion (as a decimal), and the actual count you observed in your sample bag."),
        tags$li("The app will calculate the 'Observed Chi-Square (χ²)' value from your data. This value measures the total difference between the company's claim and your data."),
        tags$li(strong("The Simulation:"), "To see if that χ² value is statistically large, we test the null hypothesis that your bag is a typical sample from the company's claimed distribution."),
        tags$ul(
          tags$li("We will create a new, simulated bag of candy *based on the company's claims* and calculate its χ² value."),
          tags$li("We repeat this process thousands of times to see what kind of χ² values we get when the null hypothesis is true.")
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot shows the distribution of simulated χ² values. The red line marks your bag's actual χ² value. The p-value is the proportion of simulated bags that had a χ² value as large or larger than yours, just by random chance."),
        tags$li("You can download the simulation results as a CSV file for further analysis.")
      )
    ),
    sidebarLayout(
      sidebarPanel(
        h4("Data Input Mode"),
        # User selects input mode: structured table or raw data
        radioButtons(ns("input_mode"), "Choose input type:",
                     choices = c("Category Table" = "table", "Raw Data" = "raw"),
                     selected = "table"),
        # Table input: user specifies number of categories and enters details
        conditionalPanel(
          sprintf("input['%s'] == 'table'", ns("input_mode")),
          tags$fieldset(
            tags$legend("Category Table Inputs"),
            numericInput(ns("num_cat"), "Number of Categories (Colors):", value = 6, min = 2, max = 10,
                         aria.label = "Number of Categories (Colors)"),
            uiOutput(ns("category_inputs"))
          )
        ),
        # Raw data input: user pastes a list of observed categories
        conditionalPanel(
          sprintf("input['%s'] == 'raw'", ns("input_mode")),
          tags$fieldset(
            tags$legend("Raw Data Input"),
            textAreaInput(ns("raw_data"), "Paste Raw Data (comma/space separated)", "", rows = 3,
                          aria.label = "Paste Raw Data"),
            textOutput(ns("raw_error"))
          )
        ),
        hr(),
        h4("Run the Simulation"),
        # Simulation controls: number of simulations, run button, download results
        tags$fieldset(
          tags$legend("Simulation Controls"),
          numericInput(ns("num_sims"), "Number of Simulations:", value = 1000, min = 100, max = 10000, step = 100,
                       aria.label = "Number of Simulations"),
          actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
          downloadButton(ns("download_results"), "Download Results")
        ),
        hr(),
        # Display observed chi-square value
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Observed Chi-Square (χ²)"),
            uiOutput(ns("chi_square_result"))
        ),
        br(),
        # Display simulation p-value
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result"))
        )
      ),
      mainPanel(
        # Main panel: plot and simulation summary
        div(class = "plot-container",
            # Accessible plot output with ARIA attributes and alt text
            plotOutput(ns("sim_plot"), alt = "Histogram of simulated Chi-Square values with observed value marked",
                       aria.label = "Simulation Plot: Distribution of Simulated Chi-Square Values",
                       aria.describedby = ns("plot_desc")),
            # Screen-reader only description (dynamic, aria-live)
            uiOutput(ns("plot_desc")),
            uiOutput(ns("sim_stats_ui"))
        )
      )
    )
  )
}

# Server logic for the Chi-Square Goodness-of-Fit Activity
# This function contains all reactive logic, calculations, and output rendering for the module.
activity_candy_chi_square_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns  # Namespace for module inputs/outputs

    # --- Dynamic UI for Categories ---
    # Renders input fields for each candy color/category, with defaults for M&Ms
    output$category_inputs <- renderUI({
      num <- as.integer(input$num_cat)
      if (is.na(num) || num < 2) return()

      # Default values for M&Ms (can be changed by user)
      defaults <- list(
        names = c("Blue", "Orange", "Green", "Yellow", "Red", "Brown"),
        props = c(0.24, 0.20, 0.16, 0.14, 0.13, 0.13),
        counts = c(10, 8, 7, 6, 6, 5)
      )

      # Create input rows for each category
      lapply(1:num, function(i) {
        fluidRow(
          column(4, textInput(ns(paste0("cat_name_", i)), "Color", value = ifelse(i <= length(defaults$names), defaults$names[i], ""),
                              aria.label = paste("Color name for category", i))),
          column(4, numericInput(ns(paste0("cat_prop_", i)), "Claimed %", value = ifelse(i <= length(defaults$props), defaults$props[i], NA), min = 0, max = 1, step = 0.01,
                                aria.label = paste("Claimed proportion for category", i))),
          column(4, numericInput(ns(paste0("cat_count_", i)), "Observed #", value = ifelse(i <= length(defaults$counts), defaults$counts[i], NA), min = 0,
                                aria.label = paste("Observed count for category", i)))
        )
      })
    })

    # --- Raw Data Parsing ---
    # Parses raw categorical data pasted by user and counts occurrences
    raw_counts <- reactive({
      req(input$raw_data)
      cats <- unlist(strsplit(input$raw_data, "[,\\s]+"))
      cats <- cats[cats != ""]
      as.data.frame(table(cats), stringsAsFactors = FALSE)
    })

    # Displays error if not enough categories in raw data
    output$raw_error <- renderUI({
      df <- raw_counts()
      if (nrow(df) < 2) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: At least two categories required. Please enter at least two distinct categories for analysis."),
            tags$span(class = "sr-only", "Form validation error: At least two categories required. This message is announced for screen reader users.")
          )
        )
      }
      ""
    })

    # --- Gather Data for Analysis ---
    # Combines user input into a single data frame for analysis
    input_data <- reactive({
      if (input$input_mode == "table") {
        req(input$num_cat)
        num <- as.integer(input$num_cat)
        names <- sapply(1:num, function(i) input[[paste0("cat_name_", i)]])
        props <- sapply(1:num, function(i) input[[paste0("cat_prop_", i)]])
        counts <- sapply(1:num, function(i) input[[paste0("cat_count_", i)]])
        if (any(is.null(names)) || any(is.null(props)) || any(is.null(counts))) return(NULL)
        data.frame(
          category = names,
          claimed_prop = props,
          observed_count = counts,
          stringsAsFactors = FALSE
        )
      } else {
        df <- raw_counts()
        data.frame(
          category = df$cats,
          claimed_prop = rep(1/nrow(df), nrow(df)), # Default: uniform claim if raw data
          observed_count = df$Freq,
          stringsAsFactors = FALSE
        )
      }
    })

    # --- Chi-Square Calculation ---
    # Calculates observed chi-square statistic from user data
    observed_chi_square <- reactive({
      df <- input_data()
      req(df)

      # Validation checks
      if (any(duplicated(df$category))) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: Duplicate category names detected. Please ensure each category name is unique."),
            tags$span(class = "sr-only", "Form validation error: Duplicate category names detected. This message is announced for screen reader users.")
          )
        )
      }
      if (abs(sum(df$claimed_prop) - 1) > 1e-6) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: Claimed proportions must sum to 1. Please adjust your inputs so the proportions add up to exactly 1."),
            tags$span(class = "sr-only", "Form validation error: Claimed proportions must sum to 1. This message is announced for screen reader users.")
          )
        )
      }
      total_observed <- sum(df$observed_count)
      if (total_observed == 0) return("Enter observed counts.")

      # Calculate expected counts for each category
      df <- df %>%
        mutate(expected_count = claimed_prop * total_observed)

      # Warn if expected count is too low for reliable chi-square test
      if (any(df$expected_count < 5)) {
        showModal(
          modalDialog(
            title = "Warning",
            "At least one category has an expected count less than 5. The results of the Chi-Square test may not be reliable.",
            easyClose = TRUE,
            footer = NULL,
            # Accessibility: ARIA attributes for modal dialog
            tags$div(
              tabindex = "-1",
              role = "dialog",
              `aria-modal` = "true",
              `aria-labelledby` = "modalTitle",
              id = "modalDialog",
              tags$h2("Warning", id = "modalTitle", class = "sr-only")
            )
          )
        )
        # Accessibility: Return focus to triggering element after modal closes
        observeEvent(input$run_sim, {
          removeModal()
          shinyjs::runjs("$('#run_sim').focus();")
        })
      }

      # Chi-square formula: sum((observed - expected)^2 / expected)
      chi_square_val <- sum((df$observed_count - df$expected_count)^2 / df$expected_count)
      return(chi_square_val)
    })

    # Output: Display observed chi-square value or error
    output$chi_square_result <- renderUI({
      val <- observed_chi_square()
      if (is.character(val)) {
        # If val is a div (error/status), render it directly
        val
      } else {
        strong(round(val, 3))
      }
    })

    # --- Simulation Logic ---
    # Runs simulations to generate chi-square values under the null hypothesis
    sim_results <- eventReactive(input$run_sim, {
      df <- input_data()
      req(df)

      obs_chi <- observed_chi_square()
      if (is.character(obs_chi)) {
        showModal(
          modalDialog(
            title = "Input Error",
            obs_chi,
            easyClose = TRUE,
            footer = NULL,
            # Accessibility: ARIA attributes for modal dialog
            tags$div(
              tabindex = "-1",
              role = "dialog",
              `aria-modal` = "true",
              `aria-labelledby` = "modalErrorTitle",
              id = "modalErrorDialog",
              tags$h2("Input Error", id = "modalErrorTitle", class = "sr-only")
            )
          )
        )
        # Accessibility: Return focus to triggering element after modal closes
        observeEvent(input$run_sim, {
          removeModal()
          shinyjs::runjs("$('#run_sim').focus();")
        })
        return(NULL)
      }

      n_sims <- input$num_sims
      total_observed <- sum(df$observed_count)
      claimed_props <- df$claimed_prop

      # Simulate random samples using multinomial distribution
      sim_counts <- rmultinom(n = n_sims, size = total_observed, prob = claimed_props)

      expected_counts <- total_observed * claimed_props

      # Calculate chi-square for each simulated sample
      sim_chi_squares <- apply(sim_counts, 2, function(sim_col) {
        sum((sim_col - expected_counts)^2 / expected_counts)
      })

      data.frame(chi_square = sim_chi_squares)
    })

    # --- Outputs ---
    # Plot: Histogram of simulated chi-square values, with observed value marked
    output$sim_plot <- renderPlot({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(ggplot() + labs(title = "Distribution of Simulated χ² Values", subtitle = "Click 'Run Simulation' to generate this plot") + theme_minimal())
      }

      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))

      p <- ggplot(df_sim, aes(x = chi_square)) +
        geom_histogram(aes(y = ..density..), bins = 30, fill = "#3b82f6", color = "white", alpha = 0.7) +
        geom_density(color = "#1d4ed8", size = 1) +
        geom_vline(xintercept = obs_chi, color = "#ef4444", size = 1.5, linetype = "dashed") +
        labs(
          title = "Distribution of Simulated χ² Values",
          subtitle = paste(input$num_sims, "simulated bags of candy"),
          x = "Simulated Chi-Square (χ²) Value",
          y = "Density"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), plot.subtitle = element_text(hjust = 0.5))

      # Shade histogram bars for simulated values >= observed value (p-value area)
      p_val_area <- df_sim %>% filter(chi_square >= obs_chi)
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = chi_square, y = ..density..), bins = 30, fill = "#ef4444", alpha = 0.8)
      }
      return(p)
    })

    # Enhanced text description for the simulation plot (screen reader accessible, aria-live)
    output$plot_desc <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(p(class = "sr-only", `aria-live` = "polite",
                 "The plot is empty. Run the simulation to generate results."))
      }
      obs_chi <- observed_chi_square()
      mean_sim_chi <- mean(df_sim$chi_square)
      sd_sim_chi <- sd(df_sim$chi_square)
      p_value <- mean(df_sim$chi_square >= obs_chi)
      # BrailleR integration for enhanced plot description (if available)
      braille_desc <- tryCatch({
        if (requireNamespace("BrailleR", quietly = TRUE)) {
          temp_plot <- ggplot(df_sim, aes(x = chi_square)) +
            geom_histogram(aes(y = ..density..), bins = 30, fill = "#3b82f6", color = "white", alpha = 0.7) +
            geom_density(color = "#1d4ed8", size = 1) +
            geom_vline(xintercept = obs_chi, color = "#ef4444", size = 1.5, linetype = "dashed") +
            labs(
              title = "Distribution of Simulated Chi-Square Values",
              subtitle = paste(input$num_sims, "simulated bags of candy"),
              x = "Simulated Chi-Square Value",
              y = "Density"
            ) +
            theme_minimal(base_size = 14)
          BrailleR::VI(temp_plot)
        } else {
          NULL
        }
      }, error = function(e) NULL)
      desc <- paste(
        sprintf("This histogram displays the distribution of %d simulated Chi-Square values generated from your input data.", input$num_sims),
        "The distribution is typically skewed right, as expected for Chi-Square statistics.",
        sprintf("The mean of the simulated distribution is %.2f, and the standard deviation is %.3f.", mean_sim_chi, sd_sim_chi),
        sprintf("A dashed red vertical line marks your observed Chi-Square value of %.3f.", obs_chi),
        "The region to the right of this line is shaded in red, representing simulated values greater than or equal to your observed value.",
        sprintf("The calculated p-value, representing the proportion of simulations as or more extreme than your observed value, is %.4f.", p_value),
        "Use this plot to visually compare your sample's result to what is expected under the null hypothesis.",
        if (!is.null(braille_desc)) paste("BrailleR summary:", braille_desc) else ""
      )
      p(class = "sr-only", `aria-live` = "polite", desc)
    })

    # Output: Display simulation p-value and explanation
    output$p_value_result <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) return(p("Run simulation to get p-value."))

      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))

      p_value <- sum(df_sim$chi_square >= obs_chi) / nrow(df_sim)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("The proportion of simulated bags with a χ² value as or more extreme than yours.")
      )
    })

    # Output: Simulation summary statistics (mean, SD)
    output$sim_stats_ui <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) return(NULL)
      mean_sim <- mean(df_sim$chi_square)
      sd_sim <- sd(df_sim$chi_square)
      tagList(
        h4("Simulation Summary"),
        tags$table(
          role = "table",
          tags$thead(
            tags$tr(
              tags$th("Mean", scope = "col", role = "columnheader"),
              tags$th("SD", scope = "col", role = "columnheader")
            )
          ),
          tags$tbody(
            tags$tr(
              tags$td(round(mean_sim, 3), role = "cell"),
              tags$td(round(sd_sim, 3), role = "cell")
            )
          )
        )
      )
    })

    # Output: Download handler for simulation results as CSV
    # Accessibility: Add alt text and summary for download button
    output$download_results <- downloadHandler(
      filename = function() {
        paste("candy_chisq_results-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df_sim <- sim_results()
        if (is.null(df_sim)) return(NULL)
        write.csv(df_sim, file, row.names = FALSE)
      }
    )

    # UI: Add accessible description for download button
    output$download_desc <- renderUI({
      p(class = "sr-only", `aria-live` = "polite",
        "Download the simulation results as a CSV file. The file contains simulated chi-square values for each run, suitable for further analysis or sharing. This button is accessible to screen readers and keyboard users.")
    })
  })
}
