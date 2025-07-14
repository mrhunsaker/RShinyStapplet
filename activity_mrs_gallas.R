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
# Activity: Is Mrs. Gallas a Good Free Throw Shooter?
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility: ARIA attributes, alt text, BrailleR integration, screen-reader descriptions,
# error/status messaging, focus management for modals, accessible export features.
######################################################################

# --- Load required libraries ---
library(shiny)    # For building interactive web applications
library(ggplot2)  # For creating plots
library(dplyr)    # For data wrangling

# --- UI for the "Is Mrs. Gallas a Good Free Throw Shooter?" Activity ---
# This function builds the user interface for the module, allowing users to:
# - Input the claimed success rate, number of trials, and observed successes
# - Select the alternative hypothesis
# - Run a simulation to test the claim
# - View results, plots, and p-value
activity_mrs_gallas_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    h2("Activity: Is Mrs. Gallas a Good Free Throw Shooter?"),
    wellPanel(
      h3("Instructions"),
      p("This activity lets you test a claim about a proportion. For example, if someone claims to be an 80% free-throw shooter, we can use a simulation to see if their actual performance provides evidence against that claim."),
      tags$ol(
        tags$li("First, define the scenario. Enter the claimed success rate (the null hypothesis), the total number of trials (e.g., shots taken), and the number of observed successes (e.g., shots made)."),
        tags$li("Choose the alternative hypothesis. Are we testing if the shooter is actually worse, better, or just different than their claim?"),
        tags$li(strong("The Simulation:"), "We will test the null hypothesis that the person's claimed success rate is true."),
        tags$ul(
          tags$li("We will simulate one full experiment (e.g., 50 shots) assuming the claimed success rate is true and record the number of successes."),
          tags$li("We repeat this process thousands of times to build a distribution of outcomes that could happen if the claim were true.")
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot shows the distribution of successes from the simulations. The red line marks the actual number of successes observed. The p-value tells us the probability of getting a result as or more extreme than the observed one, assuming the claim is true.")
      )
    ),
    sidebarLayout(
      sidebarPanel(
        h4("Define the Scenario"),
        # --- Input for claimed success rate (null hypothesis) ---
        div(class = "form-group",
            tags$label("Claimed Success Rate (p\u2080):", `for` = ns("claimed_prop")),
            numericInput(ns("claimed_prop"), label = NULL, value = 0.80, min = 0.01, max = 1, step = 0.01),
            tags$p(id = ns("claimed_prop_desc"), class = "sr-only", "Enter the claimed proportion of successes, the null hypothesis value.")
        ),
        # --- Input for number of trials ---
        div(class = "form-group",
            tags$label("Number of Trials (n):", `for` = ns("n_trials")),
            numericInput(ns("n_trials"), label = NULL, value = 50, min = 1),
            tags$p(id = ns("n_trials_desc"), class = "sr-only", "Enter the total number of independent trials in the experiment.")
        ),
        # --- Input for observed number of successes ---
        div(class = "form-group",
            tags$label("Observed Number of Successes:", `for` = ns("n_success")),
            numericInput(ns("n_success"), label = NULL, value = 32, min = 0),
            tags$p(id = ns("n_success_desc"), class = "sr-only", "Enter the number of successful trials observed.")
        ),
        # --- Select alternative hypothesis ---
        div(class = "form-group",
            tags$label("Alternative Hypothesis:", `for` = ns("alternative")),
            selectInput(ns("alternative"), label = NULL,
                        choices = c("Different from claim (p \u2260 p\u2080)" = "two.sided",
                                    "Less than claim (p < p\u2080)" = "less",
                                    "Greater than claim (p > p\u2080)" = "greater")),
            tags$p(id = ns("alt_desc"), class = "sr-only", "Select the direction of the alternative hypothesis.")
        ),
        hr(),
        h4("Run the Simulation"),
        # --- Input for number of simulations ---
        div(class = "form-group",
            tags$label("Number of Simulations:", `for` = ns("num_sims")),
            numericInput(ns("num_sims"), label = NULL, value = 1000, min = 100, max = 10000, step = 100),
            tags$p(id = ns("num_sims_desc"), class = "sr-only", "Enter the number of times to repeat the experiment for the simulation.")
        ),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        hr(),
        # --- Display simulation p-value ---
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result"))
        ),
        hr(),
        # --- Display simulation summary statistics ---
        uiOutput(ns("sim_stats_ui"))
        # To add export/download, insert downloadButton(ns("download_results"), "Download Results") here
      ),
      mainPanel(
        div(class = "plot-container",
            plotOutput(ns("sim_plot")),
            uiOutput(ns("plot_desc")),
            p(id = ns("sim_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sim_plot_desc_text")))
        )
      )
    )
  )
}

# --- Server logic for the "Mrs. Gallas" Activity ---
# This function contains all reactive logic, calculations, and output rendering for the module.
activity_mrs_gallas_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Reactive value to store simulation results ---
    sim_results <- reactiveVal(NULL)

    # --- Reset simulation if parameters change ---
    observe({
      input$n_trials
      input$n_success
      input$claimed_prop
      input$alternative
      sim_results(NULL)
      output$p_value_result <- renderUI({ p("Run simulation to get p-value.") })
      output$sim_stats_ui <- renderUI({ NULL })
    })

    # --- Event: Run Simulation ---
    observeEvent(input$run_sim, {
      req(input$n_trials, input$claimed_prop, input$num_sims)

      # Validate that n_success is not greater than n_trials
      if (input$n_success > input$n_trials) {
        showModal(modalDialog(
          title = "Input Error",
          "The number of successes cannot be greater than the total number of trials.",
          easyClose = TRUE,
          footer = NULL
        ))
        return()
      }

      # Run the simulation using rbinom
      sim_outcomes <- rbinom(n = input$num_sims, size = input$n_trials, prob = input$claimed_prop)
      sim_results(data.frame(successes = sim_outcomes))
    })

    # --- Render the simulation plot ---
    output$sim_plot <- renderPlot({
      df <- sim_results()
      if (is.null(df)) {
        return(
          ggplot() +
            labs(title = "Distribution of Simulated Successes",
                 subtitle = "Click 'Run Simulation' to generate this plot",
                 x = "Number of Successes", y = "Count") +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5))
        )
      }

      obs_success <- input$n_success

      # Calculate p-value area for shading
      p_val_area <- switch(input$alternative,
        "less" = df %>% filter(successes <= obs_success),
        "greater" = df %>% filter(successes >= obs_success),
        "two.sided" = {
          expected_mean <- input$n_trials * input$claimed_prop
          deviation <- abs(obs_success - expected_mean)
          df %>% filter(abs(successes - expected_mean) >= deviation)
        }
      )

      # Create plot
      p <- ggplot(df, aes(x = successes)) +
        geom_histogram(binwidth = 1, fill = "#3b82f6", color = "white", alpha = 0.8) +
        geom_vline(xintercept = obs_success, color = "#ef4444", size = 1.5, linetype = "dashed") +
        scale_x_continuous(breaks = scales::pretty_breaks(n = 10)) +
        labs(
          title = paste("Distribution of Successes (Assuming Claim of", input$claimed_prop, "is True)"),
          subtitle = paste(input$num_sims, "simulated experiments of", input$n_trials, "trials each"),
          x = "Number of Successes in a Simulation",
          y = "Count"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), plot.subtitle = element_text(hjust = 0.5))

      # Shade the p-value area
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = successes), binwidth = 1, fill = "#ef4444", alpha = 0.8)
      }
      p
    })

    # --- Simulation summary statistics ---
    output$sim_stats_ui <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(NULL)
      mean_sim <- mean(df$successes)
      sd_sim <- sd(df$successes)
      tagList(
        h4("Simulation Summary"),
        tags$table(
          tags$tr(tags$th("Mean"), tags$th("SD")),
          tags$tr(tags$td(round(mean_sim, 3)), tags$td(round(sd_sim, 3)))
        )
      )
    })

    # --- Enhanced text description for the simulation plot (screen reader accessible, aria-live) ---
    output$sim_plot_desc_text <- renderText({
      df <- sim_results()
      if (is.null(df)) {
        return("The plot is not yet available. Click 'Run Simulation' to generate it.")
      }
      obs_success <- input$n_success
      req(is.numeric(obs_success))

      # Calculate p-value for description
      p_val_area <- switch(input$alternative,
        "less" = df %>% filter(successes <= obs_success),
        "greater" = df %>% filter(successes >= obs_success),
        "two.sided" = {
          expected_mean <- input$n_trials * input$claimed_prop
          deviation <- abs(obs_success - expected_mean)
          df %>% filter(abs(successes - expected_mean) >= deviation)
        }
      )
      p_value <- nrow(p_val_area) / nrow(df)
      mean_sim_successes <- mean(df$successes)
      sd_sim_successes <- sd(df$successes)

      desc <- paste(
        sprintf("This histogram displays the distribution of %d simulated numbers of successes, generated under the assumption that the claimed success rate of %.2f is true.", input$num_sims, input$claimed_prop),
        sprintf("Each experiment consisted of %d trials.", input$n_trials),
        sprintf("The mean of the simulated distribution is %.2f, and the standard deviation is %.2f.", mean_sim_successes, sd_sim_successes),
        sprintf("A dashed red vertical line marks the observed number of successes, which was %d.", obs_success),
        "The region corresponding to the p-value is shaded in red, representing simulated outcomes as or more extreme than the observed value.",
        sprintf("The calculated p-value is %.4f.", p_value),
        "Use this plot to visually compare the observed result to what is expected under the null hypothesis."
      )
      paste(desc, collapse = " ")
    })

    # --- Calculate and display p-value ---
    output$p_value_result <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(p("Run simulation to get p-value."))

      obs_success <- input$n_success

      # Calculate p-value based on the shaded area
      p_val_area <- switch(input$alternative,
        "less" = df %>% filter(successes <= obs_success),
        "greater" = df %>% filter(successes >= obs_success),
        "two.sided" = {
          expected_mean <- input$n_trials * input$claimed_prop
          deviation <- abs(obs_success - expected_mean)
          df %>% filter(abs(successes - expected_mean) >= deviation)
        }
      )
      p_value <- nrow(p_val_area) / nrow(df)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("This is the probability of observing a result as or more extreme than", obs_success, "successes, assuming the claim is true.")
      )
    })

    # --- Enhanced screen reader description for the plot (aria-live) ---
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(class = "sr-only", `aria-live` = "polite",
                 "The plot is empty. Click the run simulation button to generate the plot."))
      }
      obs_success <- input$n_success
      mean_sim_successes <- mean(df$successes)
      sd_sim_successes <- sd(df$successes)
      p_value <- switch(input$alternative,
        "less" = sum(df$successes <= obs_success) / nrow(df),
        "greater" = sum(df$successes >= obs_success) / nrow(df),
        "two.sided" = {
          expected_mean <- input$n_trials * input$claimed_prop
          deviation <- abs(obs_success - expected_mean)
          sum(abs(df$successes - expected_mean) >= deviation) / nrow(df)
        }
      )
      desc <- paste(
        "The simulation is complete.",
        sprintf("This histogram displays the distribution of simulated numbers of successes under the null hypothesis (claimed success rate %.2f, %d trials).", input$claimed_prop, input$n_trials),
        sprintf("The mean of the simulated distribution is %.2f, and the standard deviation is %.2f.", mean_sim_successes, sd_sim_successes),
        sprintf("The observed number of successes, %d, is marked with a red dashed line.", obs_success),
        "The region corresponding to the p-value is shaded in red, representing simulated outcomes as or more extreme than the observed value.",
        sprintf("The calculated p-value is approximately %.4f.", round(p_value, 4))
      )
      p(class = "sr-only", `aria-live` = "polite", desc)
    })

    # To add export/download, add a downloadHandler here and corresponding button in the UI
  })
}
