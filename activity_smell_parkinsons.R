# activity_smell_parkinsons.R

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
# Stapplet Activity - Can You Smell Parkinson's?
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

######################################################################
# SECTION: Load Required Libraries
######################################################################
library(shiny)      # Shiny web application framework
library(ggplot2)    # For plotting histograms
library(dplyr)      # For data manipulation

######################################################################
# SECTION: UI Definition
# Defines the user interface for the "Can You Smell Parkinson's?" activity.
######################################################################
activity_smell_parkinsons_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    h2("Activity: Can You Smell Parkinson's?"),
    # Instructions panel
    wellPanel(
      h3("Instructions"),
      tags$ol(
        tags$li("Enter the total number of trials and the number correctly identified. The default values are from a real study."),
        tags$li("Set the 'Probability of Guessing Correctly'."),
        tags$li("Click 'Run Simulation' to perform the process."),
        tags$li("The plot shows the distribution of correct guesses from the simulations. The red line marks the actual number Joy got correct. The p-value tells us the probability of getting a result that good or better, just by random chance alone."),
        tags$li("You can download the simulation results as a CSV file for further analysis.")
      )
    ),
    sidebarLayout(
      sidebarPanel(
        h4("Define the Scenario"),
        # Input for number of trials (e.g., shirts)
        numericInput(ns("n_trials"), "Number of Trials (e.g., shirts):", value = 12, min = 1), # Number of trials in the experiment
        # Input for number correctly identified
        numericInput(ns("n_correct"), "Number Correctly Identified:", value = 7, min = 0), # Number of correct identifications
        # Input for probability of guessing correctly
        numericInput(ns("prob_chance"), "Probability of Guessing Correctly:", value = 0.333, min = 0.01, max = 1, step = 0.01), # Probability of guessing correctly
        hr(),
        h4("Run the Simulation"),
        # Input for number of simulations to run
        numericInput(ns("num_sims"), "Number of Simulations:", value = 1000, min = 100, max = 10000, step = 100), # Number of simulation runs
        # Button to run simulation
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"), # Run simulation button
        # Button to download simulation results
        downloadButton(ns("download_results"), "Download Results"), # Download results button
        hr(),
        # Display simulation p-value and summary statistics
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result")) # Displays the calculated p-value
        ),
        uiOutput(ns("sim_stats_ui")) # Displays summary statistics of the simulation
      ),
      mainPanel(
        # Plot and accessible descriptions
        div(class = "plot-container",
            plotOutput(ns("sim_plot")), # Main simulation plot
            uiOutput(ns("plot_desc")), # Accessible description for screen readers
            p(id = ns("sim_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sim_plot_desc_text"))) # Hidden description for accessibility
        )
      )
    )
  )
}

######################################################################
# SECTION: Server Logic
# Implements the server-side logic for the "Can You Smell Parkinson's?" activity.
######################################################################
activity_smell_parkinsons_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    ##################################################################
    # SECTION: Reactive Values and Input Reset
    ##################################################################
    # Store simulation results as a reactive value
    sim_results <- reactiveVal(NULL)

    # Reset simulation results and UI outputs when relevant inputs change
    observe({
      input$n_trials
      input$n_correct
      input$prob_chance
      sim_results(NULL)
      output$p_value_result <- renderUI({ p("Run simulation to get p-value.") })
      output$sim_stats_ui <- renderUI({ NULL })
    })

    ##################################################################
    # SECTION: Simulation Logic
    ##################################################################
    # Run simulation when button is clicked
    observeEvent(input$run_sim, {
      req(input$n_trials, input$prob_chance, input$num_sims)
      # Validate that number correct does not exceed number of trials
      if (input$n_correct > input$n_trials) {
        showModal(modalDialog(
          title = "Input Error",
          "The number of correct identifications cannot be greater than the total number of trials.",
          easyClose = TRUE,
          footer = NULL
        ))
        return()
      }
      # Simulate binomial outcomes for the specified number of simulations
      sim_outcomes <- rbinom(n = input$num_sims, size = input$n_trials, prob = input$prob_chance)
      sim_results(data.frame(correct = sim_outcomes))
    })

    ##################################################################
    # SECTION: Plot Rendering
    # Renders the simulation histogram and highlights observed value.
    ##################################################################
    output$sim_plot <- renderPlot({
      df <- sim_results()
      if (is.null(df)) {
        # Show placeholder plot before simulation
        return(
          ggplot() +
            labs(title = "Distribution of Simulated Correct Guesses",
                 subtitle = "Click 'Run Simulation' to generate this plot",
                 x = "Number of Correct Guesses", y = "Count") +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5))
        )
      }
      obs_correct <- input$n_correct
      # Main histogram of simulation results
      p <- ggplot(df, aes(x = correct)) +
        geom_histogram(binwidth = 1, fill = "#3b82f6", color = "white", alpha = 0.8) +
        geom_vline(xintercept = obs_correct, color = "#ef4444", size = 1.5, linetype = "dashed") +
        scale_x_continuous(breaks = scales::pretty_breaks(n = 10)) +
        labs(
          title = "Distribution of Correct Guesses (Assuming Random Chance)",
          subtitle = paste(input$num_sims, "simulated experiments of", input$n_trials, "trials each"),
          x = "Number of Correct Guesses in a Simulation",
          y = "Count"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), plot.subtitle = element_text(hjust = 0.5))
      # Highlight area for p-value (correct guesses >= observed)
      p_val_area <- df %>% filter(correct >= obs_correct)
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = correct), binwidth = 1, fill = "#ef4444", alpha = 0.8)
      }
      p
    })

    ##################################################################
    # SECTION: Simulation Summary Statistics
    ##################################################################
    output$sim_stats_ui <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(NULL)
      mean_sim <- mean(df$correct)
      sd_sim <- sd(df$correct)
      tagList(
        h4("Simulation Summary"),
        tags$table(
          tags$tr(tags$th("Mean"), tags$th("SD")),
          tags$tr(tags$td(round(mean_sim, 3)), tags$td(round(sd_sim, 3)))
        )
      )
    })

    ##################################################################
    # SECTION: Accessibility - Plot Description
    ##################################################################
    # Provide a text description of the simulation plot for accessibility
    output$sim_plot_desc_text <- renderText({
      df <- sim_results()
      if (is.null(df)) {
        return("The plot is not yet available. Click 'Run Simulation' to generate it.")
      }
      obs_correct <- input$n_correct
      req(is.numeric(obs_correct))
      p_value <- sum(df$correct >= obs_correct) / nrow(df)
      mean_sim_correct <- mean(df$correct)
      desc <- paste(
        sprintf("This histogram shows the distribution of the number of correct guesses from %d simulations.", input$num_sims),
        sprintf("Each simulation consisted of %d trials with a %.3f probability of guessing correctly.", input$n_trials, input$prob_chance),
        sprintf("The distribution of simulated correct guesses is centered around %.1f.", mean_sim_correct),
        sprintf("A dashed red vertical line marks the observed number of correct guesses, which was %d.", obs_correct),
        "The area corresponding to the p-value (getting %d or more correct) is shaded in red.",
        sprintf("The calculated p-value is %.4f.", p_value)
      )
      paste(desc, collapse = " ")
    })

    ##################################################################
    # SECTION: P-value Calculation and Display
    ##################################################################
    output$p_value_result <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(p("Run simulation to get p-value."))
      obs_correct <- input$n_correct
      p_value <- sum(df$correct >= obs_correct) / nrow(df)
      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("This is the probability of getting", obs_correct, "or more correct guesses, assuming it was all due to random chance.")
      )
    })

    ##################################################################
    # SECTION: Accessibility - Hidden Plot Description for Screen Readers
    ##################################################################
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(class = "sr-only", "The plot is empty. Click the run simulation button to generate the plot."))
      }
      p_value <- sum(df$correct >= input$n_correct) / nrow(df)
      p(class = "sr-only", paste("The simulation is complete. The histogram shows the distribution of correct guesses if it were random chance. The observed number correct of", input$n_correct, "is marked with a red line. The calculated p-value is", round(p_value, 4), "."))
    })

    ##################################################################
    # SECTION: Download Handler
    # Allows users to download simulation results as a CSV file.
    ##################################################################
    # Accessibility: Add alt text and summary for download button
    output$download_results <- downloadHandler(
      filename = function() {
        paste("smell_parkinsons_results-", Sys.Date(), ".csv", sep = "")
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
        "Download the simulation results as a CSV file. The file contains simulated correct identifications for each run, suitable for further analysis or sharing. This button is accessible to screen readers and keyboard users.")
    })
  })
}
