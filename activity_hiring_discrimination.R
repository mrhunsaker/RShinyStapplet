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
# Hiring Discrimination Activity Module
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility: ARIA attributes, alt text, BrailleR integration, screen-reader descriptions,
# accessible error/status messaging, focus management for modals, and accessible export features.
######################################################################

# Load required libraries for UI, plotting, and data manipulation
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(dplyr) # For data wrangling

# UI function for the Hiring Discrimination Activity
# This function builds the user interface for the module, allowing users to input data,
# run simulations, and view results.
activity_hiring_discrimination_ui <- function(id) {
  ns <- NS(id) # Namespace for module inputs/outputs
  fluidPage(
    h2("Activity: Hiring Discrimination"),
    # Instructions panel: step-by-step guide for users
    wellPanel(
      h3("Instructions"),
      tags$ol(
        tags$li("Choose your data input mode: either enter a table of counts for each group and outcome, or paste raw outcome data."),
        tags$li("The 'Observed Difference' shows the actual difference in the proportion of callbacks between the two groups in the sample data."),
        tags$li(strong("The Simulation:"), "We will test the null hypothesis that there is no discrimination (i.e., the name on the resume has no effect on the callback rate) using a permutation test:"),
        tags$ul(
          tags$li("All outcomes are pooled and shuffled, then randomly assigned back to the groups, keeping original group sizes."),
          tags$li("The difference in proportions for this shuffled grouping is calculated and recorded."),
          tags$li("This process is repeated thousands of times to build a distribution of differences that could happen by random chance.")
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot will show the distribution of simulated differences. The red line shows our original observed difference. The p-value tells us how often we'd get a result as extreme as our observed one, just by random chance alone."),
        tags$li("You can download the simulation results as a CSV file for further analysis.")
      )
    ),
    sidebarLayout(
      sidebarPanel(
        h4("Data Input Mode"),
        # User selects input mode: structured table or raw data
        radioButtons(ns("input_mode"), "Choose input type:",
          choices = c("Counts Table" = "table", "Raw Data" = "raw"),
          selected = "table"
        ),
        # Table input: user specifies counts for each group/outcome
        conditionalPanel(
          sprintf("input['%s'] == 'table'", ns("input_mode")),
          p("Based on a study where 48 identical resumes were sent out."),
          fluidRow(
            column(
              6,
              div(
                class = "form-group",
                tags$label("Male Name: Hired", `for` = ns("male_hired")),
                numericInput(ns("male_hired"), label = NULL, value = 35, min = 0),
                tags$p(id = ns("male_hired_desc"), class = "sr-only", "Enter the number of resumes with male names that received a callback.")
              )
            ),
            column(
              6,
              div(
                class = "form-group",
                tags$label("Male Name: Not Hired", `for` = ns("male_not_hired")),
                numericInput(ns("male_not_hired"), label = NULL, value = 13, min = 0),
                tags$p(id = ns("male_not_hired_desc"), class = "sr-only", "Enter the number of resumes with male names that did not receive a callback.")
              )
            )
          ),
          fluidRow(
            column(
              6,
              div(
                class = "form-group",
                tags$label("Female Name: Hired", `for` = ns("female_hired")),
                numericInput(ns("female_hired"), label = NULL, value = 14, min = 0),
                tags$p(id = ns("female_hired_desc"), class = "sr-only", "Enter the number of resumes with female names that received a callback.")
              )
            ),
            column(
              6,
              div(
                class = "form-group",
                tags$label("Female Name: Not Hired", `for` = ns("female_not_hired")),
                numericInput(ns("female_not_hired"), label = NULL, value = 34, min = 0),
                tags$p(id = ns("female_not_hired_desc"), class = "sr-only", "Enter the number of resumes with female names that did not receive a callback.")
              )
            )
          )
        ),
        # Raw data input: user pastes a list of observed group/outcome pairs
        conditionalPanel(
          sprintf("input['%s'] == 'raw'", ns("input_mode")),
          textAreaInput(ns("raw_data"), "Paste Raw Data (comma/space separated, e.g. 'Male,Hired Female,NotHired ...')", "", rows = 3),
          textOutput(ns("raw_error"))
        ),
        hr(),
        # Simulation controls: number of simulations, run button, download results
        numericInput(ns("num_sims"), "Number of Shuffles (Simulations):", value = 1000, min = 100, max = 10000, step = 100),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        downloadButton(ns("download_results"), "Download Results"),
        hr(),
        # Display observed difference in proportions
        div(
          class = "results-box", role = "status", `aria-live` = "polite",
          h4("Observed Result"),
          uiOutput(ns("observed_result"))
        ),
        br(),
        # Display simulation p-value
        div(
          class = "results-box", role = "status", `aria-live` = "polite",
          h4("Simulation p-value"),
          uiOutput(ns("p_value_result"))
        )
      ),
      mainPanel(
        # Main panel: plot and simulation summary
        div(
          class = "plot-container",
          plotOutput(ns("sim_plot")),
          uiOutput(ns("plot_desc")),
          uiOutput(ns("sim_stats_ui")),
          p(id = ns("sim_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sim_plot_desc_text")))
        )
      )
    )
  )
}

# Server logic for the Hiring Discrimination Activity
# This function contains all reactive logic, calculations, and output rendering for the module.
activity_hiring_discrimination_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns # Namespace for module inputs/outputs

    # --- Raw Data Parsing ---
    # Parses raw group/outcome data pasted by user and counts occurrences
    raw_counts <- reactive({
      req(input$raw_data)
      entries <- unlist(strsplit(input$raw_data, "[,\\s]+"))
      # Expect pairs: Group,Outcome
      if (length(entries) %% 2 != 0) {
        return(data.frame())
      }
      df <- data.frame(
        group = entries[seq(1, length(entries), 2)],
        outcome = entries[seq(2, length(entries), 2)],
        stringsAsFactors = FALSE
      )
      table(df$group, df$outcome)
    })

    # Displays error if not enough groups/outcomes in raw data
    output$raw_error <- renderText({
      df <- raw_counts()
      if (nrow(df) < 2 || ncol(df) < 2) {
        return("At least two groups and two outcomes required.")
      }
      ""
    })

    # --- Data Extraction ---
    # Combines user input into a list of counts for analysis
    get_counts <- reactive({
      if (is.null(input$input_mode)) {
        return(NULL)
      }
      if (input$input_mode == "table") {
        list(
          male_hired = if (is.null(input$male_hired)) 0 else input$male_hired,
          male_not_hired = if (is.null(input$male_not_hired)) 0 else input$male_not_hired,
          female_hired = if (is.null(input$female_hired)) 0 else input$female_hired,
          female_not_hired = if (is.null(input$female_not_hired)) 0 else input$female_not_hired
        )
      } else {
        df <- raw_counts()
        # Try to extract counts for Male/Female and Hired/Not Hired
        male_hired <- if (!is.null(df) && "Male" %in% rownames(df) && "Hired" %in% colnames(df)) df["Male", "Hired"] else 0
        male_not_hired <- if ("Male" %in% rownames(df) && "NotHired" %in% colnames(df)) df["Male", "NotHired"] else 0
        female_hired <- if ("Female" %in% rownames(df) && "Hired" %in% colnames(df)) df["Female", "Hired"] else 0
        female_not_hired <- if ("Female" %in% rownames(df) && "NotHired" %in% colnames(df)) df["Female", "NotHired"] else 0
        list(
          male_hired = male_hired,
          male_not_hired = male_not_hired,
          female_hired = female_hired,
          female_not_hired = female_not_hired
        )
      }
    })

    # --- Simulation Results and Observed Difference ---
    sim_results <- reactiveVal(NULL) # Stores simulation results
    observed_diff <- reactiveVal(0) # Stores observed difference in proportions

    # Calculate observed difference and proportions whenever input changes
    observe({
      counts <- get_counts()
      male_total <- counts$male_hired + counts$male_not_hired
      female_total <- counts$female_hired + counts$female_not_hired

      if (is.null(counts) || is.na(male_total) || is.na(female_total) || male_total == 0 || female_total == 0) {
        return()
      }

      prop_male <- counts$male_hired / male_total
      prop_female <- counts$female_hired / female_total
      diff <- prop_male - prop_female
      observed_diff(diff)

      # Output: Display observed proportions and difference
      output$observed_result <- renderUI({
        tagList(
          p(strong("Prop(Male Hired): "), round(prop_male, 3)),
          p(strong("Prop(Female Hired): "), round(prop_female, 3)),
          p(strong("Difference (Male - Female): "), round(diff, 3))
        )
      })
      # Reset simulation on data change
      sim_results(NULL)
      output$p_value_result <- renderUI({
        p("Run simulation to get p-value.")
      })
    })

    # --- Run Simulation ---
    # Runs permutation test to generate differences under the null hypothesis
    observeEvent(input$run_sim, {
      counts <- get_counts()
      total_hired <- counts$male_hired + counts$female_hired
      total_not_hired <- counts$male_not_hired + counts$female_not_hired
      pool <- c(rep("Hired", total_hired), rep("NotHired", total_not_hired))

      n_male <- counts$male_hired + counts$male_not_hired
      n_female <- counts$female_hired + counts$female_not_hired

      sim_diffs <- replicate(input$num_sims, {
        shuffled_pool <- sample(pool)
        sim_male_outcomes <- shuffled_pool[1:n_male]
        sim_female_outcomes <- shuffled_pool[(n_male + 1):(n_male + n_female)]

        sim_prop_male <- sum(sim_male_outcomes == "Hired") / n_male
        sim_prop_female <- sum(sim_female_outcomes == "Hired") / n_female

        sim_prop_male - sim_prop_female
      })

      sim_results(data.frame(diff = sim_diffs))
    })

    # --- Simulation Plot ---
    # Plot: Histogram of simulated differences, with observed value marked
    output$sim_plot <- renderPlot({
      df <- sim_results()
      if (is.null(df)) {
        return(
          ggplot() +
            labs(
              title = "Distribution of Simulated Differences",
              subtitle = "Click 'Run Simulation' to generate this plot",
              x = "Simulated Difference in Proportions", y = "Count"
            ) +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5))
        )
      }

      obs_diff <- observed_diff()

      p <- ggplot(df, aes(x = diff)) +
        geom_histogram(aes(y = ..density..), bins = 30, fill = "#3b82f6", color = "white", alpha = 0.7) +
        geom_density(color = "#1d4ed8", size = 1) +
        geom_vline(xintercept = obs_diff, color = "#ef4444", size = 1.5, linetype = "dashed") +
        labs(
          title = "Distribution of Simulated Differences (from Shuffling)",
          subtitle = paste(input$num_sims, "shuffles of the data"),
          x = "Simulated Difference in Proportions (Male - Female)",
          y = "Density"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), plot.subtitle = element_text(hjust = 0.5))

      # Shade the p-value area (bars for simulated values as or more extreme than observed)
      p_val_area <- df %>% filter(abs(diff) >= abs(obs_diff))
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = diff, y = ..density..), bins = 30, fill = "#ef4444", alpha = 0.8)
      }
      return(p)
    })

    # --- Simulation Summary Statistics ---
    # Output: Simulation summary statistics (mean, SD)
    output$sim_stats_ui <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(NULL)
      }
      mean_sim <- mean(df$diff)
      sd_sim <- sd(df$diff)
      tagList(
        h4("Simulation Summary"),
        tags$table(
          tags$tr(tags$th("Mean"), tags$th("SD")),
          tags$tr(tags$td(round(mean_sim, 3)), tags$td(round(sd_sim, 3)))
        )
      )
    })

    # --- Simulation Plot Description ---
    # Output: Text description for the simulation plot (screen reader accessible)
    output$sim_plot_desc_text <- renderText({
      df <- sim_results()
      if (is.null(df)) {
        return("The plot is not yet available. Click 'Run Simulation' to generate it.")
      }
      obs_diff <- observed_diff()
      req(is.numeric(obs_diff))

      p_value <- sum(abs(df$diff) >= abs(obs_diff)) / nrow(df)
      mean_sim_diff <- mean(df$diff)

      desc <- paste(
        sprintf("This histogram shows the distribution of %d simulated differences in callback proportions between the 'male' and 'female' resume groups.", input$num_sims),
        "The distribution is centered near zero, which is what we would expect if there were no real difference.",
        sprintf("The center of the simulated distribution is around %.3f.", mean_sim_diff),
        sprintf("A dashed red vertical line marks the observed difference of %.3f from the original sample data.", obs_diff),
        "The p-value is calculated by finding the proportion of simulated differences that are as or more extreme than the observed difference.",
        sprintf("The calculated p-value is %.4f.", p_value)
      )
      paste(desc, collapse = " ")
    })

    # --- P-value Output ---
    # Output: Display simulation p-value and explanation
    output$p_value_result <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p("Run simulation to get p-value."))
      }

      obs_diff <- observed_diff()
      p_value <- sum(abs(df$diff) >= abs(obs_diff)) / nrow(df)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("This is the probability of observing a difference as large as", round(abs(obs_diff), 3), "or larger, assuming no real effect exists.")
      )
    })

    # --- Accessibility: Enhanced Screen Reader Description for Plot ---
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(
          class = "sr-only", `aria-live` = "polite",
          "The plot is empty. Run the simulation to generate results."
        ))
      }
      obs_diff <- observed_diff()
      req(is.numeric(obs_diff))
      p_value <- sum(abs(df$diff) >= abs(obs_diff)) / nrow(df)
      mean_sim_diff <- mean(df$diff)
      sd_sim_diff <- sd(df$diff)
      desc <- paste(
        sprintf("This histogram displays the distribution of %d simulated differences in callback proportions between the male and female resume groups.", input$num_sims),
        "The distribution is centered near zero, which is expected if there is no real difference.",
        sprintf("The mean of the simulated distribution is %.3f, and the standard deviation is %.3f.", mean_sim_diff, sd_sim_diff),
        sprintf("A dashed red vertical line marks your observed difference of %.3f.", obs_diff),
        "The region to the right and left of this line is shaded in red, representing simulated values as or more extreme than your observed value.",
        sprintf("The calculated p-value, representing the proportion of simulations as or more extreme than your observed value, is %.4f.", p_value),
        "Use this plot to visually compare your sample's result to what is expected under the null hypothesis."
      )
      p(class = "sr-only", `aria-live` = "polite", desc)
    })

    # --- Export/Download Results ---
    # Output: Download handler for simulation results as CSV
    output$download_results <- downloadHandler(
      filename = function() {
        paste("hiring_discrimination_results-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df <- sim_results()
        write.csv(df, file, row.names = FALSE)
      }
    )
  })
}
