# activity_guess_correlation.R

library(shiny)
library(ggplot2)
library(MASS) # For mvrnorm to generate correlated data
library(BrailleR)
library(BrailleR)
library(BrailleR)

# UI for the Guess the Correlation Activity
activity_guess_correlation_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
    h2("Activity: Guess the Correlation"),
    wellPanel(
      h3("Instructions"),
      tags$ol(
        tags$li("Click the 'Generate New Plot' button to display a scatterplot of randomly generated data."),
        tags$li("Examine the scatterplot to estimate the strength and direction of the linear relationship between the two variables."),
        tags$li("Use the slider to input your guess for the correlation coefficient, 'r'. Remember, 'r' is always between -1 (perfect negative correlation) and +1 (perfect positive correlation)."),
        tags$li("Click 'Submit Guess' to see the actual correlation and how close your guess was."),
        tags$li("Your score for the round is based on how close you are to the actual value. Try to get the highest score possible!")
      )
    ),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        actionButton(ns("new_plot"), "Generate New Plot", class = "btn-primary"),
        p(id = ns("new_plot_desc"), class = "sr-only", "Click this button to start a new round with a new scatterplot."),
        hr(),
        div(class = "form-group",
            tags$label("Your Guess for the Correlation (r):", `for` = ns("guess_r")),
            sliderInput(ns("guess_r"), label = NULL, min = -1, max = 1, value = 0, step = 0.05),
            tags$p(id = ns("guess_r_desc"), class = "sr-only", "Drag this slider to set your guess for the correlation coefficient, from -1 to 1."),
            tags$script(paste0("document.getElementById('", ns("guess_r"), "').setAttribute('aria-describedby', '", ns("guess_r_desc"), "')")),
        ),
        actionButton(ns("submit_guess"), "Submit Guess"),
        p(id = ns("submit_guess_desc"), class = "sr-only", "Click this button to lock in your guess and see the results."),
        hr(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Round Results"),
            uiOutput(ns("round_results"))
        ),
        br(),
        div(class = "results-box",
            h4("Overall Score"),
            uiOutput(ns("overall_score"))
        )
      ),
      mainPanel(
        div(class = "plot-container",
            plotOutput(ns("scatterplot")),
            tags$script(paste0("document.getElementById('", ns("scatterplot"), "').setAttribute('aria-label', 'A scatterplot of two variables. Use the controls to guess the correlation coefficient.')")),
            p(id = ns("scatterplot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("scatterplot_desc_text")))
        )
      )
    )
  )
}

# Server logic for the Guess the Correlation Activity
activity_guess_correlation_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive values to store game state
    rv <- reactiveValues(
      actual_r = NULL,
      data = NULL,
      total_score = 0,
      rounds_played = 0,
      guess_submitted = FALSE
    )

    # --- Event: Generate New Plot ---
    observeEvent(input$new_plot, {
      # Generate a new target correlation
      # Avoid values too close to 0, -1, or 1 to make it more challenging
      r <- sample(c(runif(1, -0.95, -0.1), runif(1, 0.1, 0.95)), 1)
      rv$actual_r <- r

      # Generate correlated data
      n_points <- 100
      cov_matrix <- matrix(c(1, r, r, 1), nrow = 2)
      set.seed(Sys.time()) # Ensure randomness
      new_data <- as.data.frame(mvrnorm(n = n_points, mu = c(0, 0), Sigma = cov_matrix))
      colnames(new_data) <- c("x", "y")
      rv$data <- new_data

      # Reset state
      rv$guess_submitted <- FALSE
      output$round_results <- renderUI({ p("Make your guess!") })

    }, ignoreNULL = FALSE, once = TRUE) # ignoreNULL=FALSE allows it to run on startup

    # Render the plot
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

    # Text description for the scatterplot
    output$scatterplot_desc_text <- renderText({
      req(rv$actual_r) # Ensure data is generated

      r_value <- rv$actual_r

      # Determine the direction and strength for the description
      direction <- if (r_value > 0) "positive" else "negative"
      strength <- case_when(
        abs(r_value) >= 0.8 ~ "strong",
        abs(r_value) >= 0.5 ~ "moderate",
        abs(r_value) >= 0.2 ~ "weak",
        TRUE ~ "very weak"
      )
      form <- if (abs(r_value) >= 0.5) "a clear linear pattern" else "a scattered, cloud-like pattern"

      desc <- paste(
        "A new scatterplot has been generated.",
        sprintf("The plot shows a %s, %s correlation between the two variables.", strength, direction),
        sprintf("The points form %s.", form),
        "The axes are not labeled to focus on the correlation pattern.",
        "Use the slider to guess the correlation coefficient 'r'."
      )
      paste(desc, collapse = " ")
    })

    # --- Event: Submit Guess ---
    observeEvent(input$submit_guess, {
      req(rv$actual_r) # Require a plot to be generated first
      rv$guess_submitted <- TRUE

      # Update rounds played
      rv$rounds_played <- rv$rounds_played + 1

      # Calculate score for the round
      user_guess <- input$guess_r
      actual_value <- rv$actual_r
      difference <- abs(user_guess - actual_value)
      round_score <- max(0, floor(100 * (1 - difference)))

      # Update total score
      rv$total_score <- rv$total_score + round_score

      # Display round results
      output$round_results <- renderUI({
        tagList(
          p(strong("Your Guess: "), user_guess),
          p(strong("Actual 'r': "), round(actual_value, 3)),
          p(strong("Difference: "), round(difference, 3)),
          hr(),
          p(strong("Round Score: "), round_score)
        )
      })

      # Display overall score
      output$overall_score <- renderUI({
        avg_score <- round(rv$total_score / rv$rounds_played)
        tagList(
          p(strong("Total Score: "), rv$total_score),
          p(strong("Rounds Played: "), rv$rounds_played),
          p(strong("Average Score: "), avg_score)
        )
      })
    })

  })
}
