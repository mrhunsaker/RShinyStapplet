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
# Activity: Guess the Correlation
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
# Accessibility: ARIA attributes, alt text, BrailleR integration, screen-reader descriptions,
# error/status messaging, focus management for modals, accessible export features.
######################################################################

######################################################################
# SECTION: Load Required Libraries
######################################################################
library(shiny)      # Shiny web application framework
library(ggplot2)    # For plotting scatterplots
library(MASS)       # For mvrnorm to generate correlated data

######################################################################
# SECTION: UI Definition for "Guess the Correlation" Activity
######################################################################
# This function defines the user interface for the applet, including
# instructions, input controls, results display, and accessibility features.
activity_guess_correlation_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    h2("Activity: Guess the Correlation"),
    # Instructions panel
    wellPanel(
      h3("Instructions"),
      tags$ol(
        tags$li("Click the 'Generate New Plot' button to display a scatterplot of randomly generated data."),
        tags$li("Examine the scatterplot to estimate the strength and direction of the linear relationship between the two variables."),
        tags$li("Use the slider or numeric input to input your guess for the correlation coefficient, 'r'. Remember, 'r' is always between -1 (perfect negative correlation) and +1 (perfect positive correlation)."),
        tags$li("Click 'Submit Guess' to see the actual correlation and how close your guess was."),
        tags$li("Your score for the round is based on how close you are to the actual value. Try to get the highest score possible!"),
        tags$li("You can download the current round's data and results as a CSV file.")
      )
    ),
    sidebarLayout(
      sidebarPanel(
        # Button to generate a new scatterplot
        actionButton(ns("new_plot"), "Generate New Plot", class = "btn-primary"),
        p(id = ns("new_plot_desc"), class = "sr-only", "Click this button to start a new round with a new scatterplot."),
        hr(),
        # Input for guessing the correlation coefficient
        div(class = "form-group",
            tags$label("Your Guess for the Correlation (r):", `for` = ns("guess_r")),
            sliderInput(ns("guess_r"), label = NULL, min = -1, max = 1, value = 0, step = 0.01),
            numericInput(ns("guess_r_num"), "Or enter your guess:", value = 0, min = -1, max = 1, step = 0.01),
            textOutput(ns("guess_error")),
            tags$p(id = ns("guess_r_desc"), class = "sr-only", "Set your guess for the correlation coefficient, from -1 to 1."),
        ),
        # Button to submit guess
        actionButton(ns("submit_guess"), "Submit Guess"),
        p(id = ns("submit_guess_desc"), class = "sr-only", "Click this button to lock in your guess and see the results."),
        hr(),
        # Results for the current round
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Round Results"),
            uiOutput(ns("round_results"))
        ),
        br(),
        # Overall score summary
        div(class = "results-box",
            h4("Overall Score"),
            uiOutput(ns("overall_score"))
        ),
        hr(),
        # Download button for round data
        downloadButton(ns("download_results"), "Download Round Data")
      ),
      mainPanel(
        # Scatterplot and accessible descriptions
        div(class = "plot-container",
            plotOutput(ns("scatterplot")),
            uiOutput(ns("plot_desc")),
            p(id = ns("scatterplot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("scatterplot_desc_text")))
        )
      )
    )
  )
}

######################################################################
# SECTION: Server Logic for "Guess the Correlation" Activity
######################################################################
# This function implements the server-side logic, including:
# - Game state management
# - UI synchronization
# - Data generation and validation
# - Scoring and results display
# - Accessibility features
# - Download functionality

activity_guess_correlation_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    ##################################################################
    # SECTION: Reactive Values for Game State
    ##################################################################
    # Stores the current round's correlation, generated data, scores, and user input state.
    rv <- reactiveValues(
      actual_r = NULL,      # The true correlation coefficient for the current round
      data = NULL,          # The generated data for the scatterplot
      total_score = 0,      # Cumulative score across rounds
      rounds_played = 0,    # Number of rounds played
      guess_submitted = FALSE, # Whether the user has submitted a guess this round
      last_guess = NULL,    # The user's last guess
      last_error = NULL     # Error message for invalid input
    )

    ##################################################################
    # SECTION: Synchronize Slider and Numeric Input for Guessing 'r'
    ##################################################################
    # Keeps the slider and numeric input in sync for user convenience.
    observeEvent(input$guess_r, {
      if (!isTRUE(all.equal(input$guess_r, input$guess_r_num))) {
        updateNumericInput(session, "guess_r_num", value = input$guess_r)
      }
    })
    observeEvent(input$guess_r_num, {
      if (!isTRUE(all.equal(input$guess_r, input$guess_r_num))) {
        updateSliderInput(session, "guess_r", value = input$guess_r_num)
      }
    })

    ##################################################################
    # SECTION: Input Validation and Error Messaging
    ##################################################################
    # Displays an error if the guess is outside the valid range.
    output$guess_error <- renderText({
      val <- input$guess_r_num
      if (is.null(val) || is.na(val) || val < -1 || val > 1) {
        return("Guess must be a number between -1 and 1.")
      }
      ""
    })

    ##################################################################
    # SECTION: Generate New Scatterplot Data for Each Round
    ##################################################################
    # When the user starts a new round, generate a random correlation and data.
    observeEvent(input$new_plot, {
      # Randomly select a correlation coefficient (r) for the new round
      r <- sample(c(runif(1, -0.95, -0.1), runif(1, 0.1, 0.95)), 1)
      rv$actual_r <- r

      # Generate correlated data using the selected r
      n_points <- 100
      cov_matrix <- matrix(c(1, r, r, 1), nrow = 2)
      set.seed(as.integer(Sys.time())) # Ensure randomness for each round
      new_data <- as.data.frame(MASS::mvrnorm(n = n_points, mu = c(0, 0), Sigma = cov_matrix))
      colnames(new_data) <- c("x", "y")
      rv$data <- new_data

      # Reset round state
      rv$guess_submitted <- FALSE
      rv$last_guess <- NULL
      rv$last_error <- NULL
      output$round_results <- renderUI({ p("Make your guess!") })
    }, ignoreNULL = FALSE, once = TRUE)

    ##################################################################
    # SECTION: Render Scatterplot of Generated Data
    ##################################################################
    output$scatterplot <- renderPlot({
      req(rv$data)
      ggplot(rv$data, aes(x = x, y = y)) +
        geom_point(alpha = 0.7, size = 3, color = "#1d4ed8") +
        theme_minimal(base_size = 16) +
        theme(
          axis.title = element_blank(),
          axis.text = element_blank(),
          axis.ticks = element_blank(),
          panel.grid = element_blank()
        ) +
        labs(title = "Guess the Correlation")
    })

    ##################################################################
    # SECTION: Accessibility - Text Description of Scatterplot
    ##################################################################
    # Provides a dynamic description for screen readers and accessibility.
    output$scatterplot_desc_text <- renderText({
      req(rv$actual_r)
      r_value <- rv$actual_r
      direction <- if (r_value > 0) "positive" else "negative"
      strength <- dplyr::case_when(
        abs(r_value) >= 0.8 ~ "strong",
        abs(r_value) >= 0.5 ~ "moderate",
        abs(r_value) >= 0.2 ~ "weak",
        TRUE ~ "very weak"
      )
      form <- if (abs(r_value) >= 0.5) "a clear linear pattern" else "a scattered, cloud-like pattern"
      desc <- paste(
        "This scatterplot displays 100 simulated data points for two variables.",
        sprintf("The true correlation coefficient for this round is %.3f, which represents a %s, %s relationship.", r_value, strength, direction),
        sprintf("The points form %s.", form),
        "No axis labels are shown to focus attention on the pattern.",
        "Estimate the correlation coefficient 'r' using the slider or numeric input.",
        "After submitting your guess, the actual value and your score will be displayed.",
        "A strong correlation will show points tightly clustered along a line, while a weak correlation will appear more cloud-like."
      )
      paste(desc, collapse = " ")
    })

    ##################################################################
    # SECTION: Accessibility - Hidden Description for Screen Readers
    ##################################################################
    output$plot_desc <- renderUI({
      req(rv$actual_r)
      r_value <- rv$actual_r
      desc <- paste(
        "Screen reader description:",
        "A scatterplot of 100 simulated data points is shown.",
        sprintf("The true correlation coefficient is %.3f.", r_value),
        "The user is prompted to guess the value of 'r'.",
        "After submitting a guess, the actual value and score are revealed."
      )
      p(class = "sr-only", `aria-live` = "polite", desc)
    })

    ##################################################################
    # SECTION: Submit Guess and Calculate Score
    ##################################################################
    # Handles guess submission, validation, scoring, and results display.
    observeEvent(input$submit_guess, {
      req(rv$actual_r)
      val <- input$guess_r_num
      # Validate guess input
      if (is.null(val) || is.na(val) || val < -1 || val > 1) {
        rv$last_error <- "Guess must be a number between -1 and 1."
        output$round_results <- renderUI({ p(rv$last_error, style = "color: red;") })
        return()
      }
      # Update game state with user's guess
      rv$guess_submitted <- TRUE
      rv$last_guess <- val
      rv$rounds_played <- rv$rounds_played + 1
      actual_value <- rv$actual_r
      difference <- abs(val - actual_value)
      round_score <- max(0, floor(100 * (1 - difference)))
      rv$total_score <- rv$total_score + round_score

      # Display round results
      output$round_results <- renderUI({
        tagList(
          p(strong("Your Guess: "), val),
          p(strong("Actual 'r': "), round(actual_value, 3)),
          p(strong("Difference: "), round(difference, 3)),
          hr(),
          p(strong("Round Score: "), round_score)
        )
      })

      # Display overall score summary
      output$overall_score <- renderUI({
        avg_score <- if (rv$rounds_played > 0) round(rv$total_score / rv$rounds_played) else 0
        tagList(
          p(strong("Total Score: "), rv$total_score),
          p(strong("Rounds Played: "), rv$rounds_played),
          p(strong("Average Score: "), avg_score)
        )
      })
    })

    ##################################################################
    # SECTION: Download Handler for Round Data
    ##################################################################
    # Allows users to export the current round's data and results as a CSV.
    output$download_results <- downloadHandler(
      filename = function() {
        paste("guesscorr-round-", Sys.Date(), ".csv", sep = "")
      },
      content = function(file) {
        df <- rv$data
        if (is.null(df)) df <- data.frame(x = numeric(0), y = numeric(0))
        meta <- data.frame(
          actual_r = rv$actual_r,
          user_guess = rv$last_guess,
          difference = if (!is.null(rv$last_guess)) abs(rv$last_guess - rv$actual_r) else NA,
          round_score = if (!is.null(rv$last_guess)) max(0, floor(100 * (1 - abs(rv$last_guess - rv$actual_r)))) else NA
        )
        write.csv(rbind(meta, df), file, row.names = FALSE)
      }
    )
  })
}
