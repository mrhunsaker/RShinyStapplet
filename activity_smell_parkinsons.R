# activity_smell_parkinsons.R

library(shiny)
library(ggplot2)
library(dplyr)
library(BrailleR)

# UI for the "Can You Smell Parkinson's?" Activity
activity_smell_parkinsons_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
    h2("Activity: Can You Smell Parkinson's?"),
    wellPanel(
      h3("Instructions"),
      p("This activity is based on the true story of Joy Milne, a woman who discovered she could 'smell' Parkinson's disease. We want to test if her ability is statistically significant or if it could be due to random chance."),
      tags$ol(
        tags$li("First, define the scenario. Enter the total number of trials (e.g., shirts she smelled) and the number she identified correctly. The default values are from a real study."),
        tags$li("Set the 'Probability of Guessing Correctly'. If for each trial she had to pick one Parkinson's shirt from a group of three, the probability of guessing correctly would be 1/3 (or 0.333)."),
        tags$li(strong("The Simulation:"), "We will test the null hypothesis that Joy is just guessing. To do this, we simulate a world where that's true:"),
        tags$ul(
          tags$li("We will perform a simulated set of trials (e.g., 12) with the specified probability of success."),
          tags$li("We record the number of 'correct' guesses from this single simulation."),
          tags$li("We repeat this process thousands of times to build a distribution of outcomes that could happen just by random chance if she were only guessing.")
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot shows the distribution of correct guesses from the simulations. The red line marks the actual number Joy got correct. The p-value tells us the probability of getting a result that good or better, just by random chance alone.")
      )
    ),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        h4("Define the Scenario"),
        div(class = "form-group",
            tags$label("Number of Trials (e.g., shirts):", `for` = ns("n_trials")),
            numericInput(ns("n_trials"), label = NULL, value = 12, min = 1),
            tags$p(id = ns("n_trials_desc"), class = "sr-only", "Enter the total number of independent trials in the experiment."),
            tags$script(paste0("document.getElementById('", ns("n_trials"), "').setAttribute('aria-describedby', '", ns("n_trials_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Number Correctly Identified:", `for` = ns("n_correct")),
            numericInput(ns("n_correct"), label = NULL, value = 7, min = 0),
            tags$p(id = ns("n_correct_desc"), class = "sr-only", "Enter the number of trials that were successful."),
            tags$script(paste0("document.getElementById('", ns("n_correct"), "').setAttribute('aria-describedby', '", ns("n_correct_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Probability of Guessing Correctly:", `for` = ns("prob_chance")),
            numericInput(ns("prob_chance"), label = NULL, value = 0.333, min = 0.01, max = 1, step = 0.01),
            tags$p(id = ns("prob_chance_desc"), class = "sr-only", "Enter the probability of a successful outcome in a single trial if the person were just guessing."),
            tags$script(paste0("document.getElementById('", ns("prob_chance"), "').setAttribute('aria-describedby', '", ns("prob_chance_desc"), "')"))
        ),
        hr(),
        h4("Run the Simulation"),
        div(class = "form-group",
            tags$label("Number of Simulations:", `for` = ns("num_sims")),
            numericInput(ns("num_sims"), label = NULL, value = 1000, min = 100, max = 10000, step = 100),
            tags$p(id = ns("num_sims_desc"), class = "sr-only", "Enter the number of times to repeat the experiment for the simulation."),
            tags$script(paste0("document.getElementById('", ns("num_sims"), "').setAttribute('aria-describedby', '", ns("num_sims_desc"), "')"))
        ),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        hr(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result"))
        )
      ),
      mainPanel(
        div(class = "plot-container",
            plotOutput(ns("sim_plot")),
            tags$script(paste0("document.getElementById('", ns("sim_plot"), "').setAttribute('aria-label', 'A histogram showing the distribution of the number of correct guesses from many simulations. A red line indicates the observed number correct from the data.')")),
            p(id = ns("sim_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sim_plot_desc_text")))
        )
      )
    )
  )
}

# Server logic for the "Can You Smell Parkinson's?" Activity
activity_smell_parkinsons_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive values
    sim_results <- reactiveVal(NULL)

    # Reset simulation if parameters change
    observe({
      input$n_trials
      input$n_correct
      input$prob_chance
      sim_results(NULL)
      output$p_value_result <- renderUI({ p("Run simulation to get p-value.") })
    })

    # Event: Run Simulation
    observeEvent(input$run_sim, {
      req(input$n_trials, input$prob_chance, input$num_sims)

      # Validate that n_correct is not greater than n_trials
      if (input$n_correct > input$n_trials) {
        showModal(modalDialog(
          title = "Input Error",
          "The number of correct identifications cannot be greater than the total number of trials.",
          easyClose = TRUE,
          footer = NULL
        ))
        return()
      }

      # Run the simulation using rbinom
      # rbinom is highly efficient for this type of simulation
      sim_outcomes <- rbinom(n = input$num_sims, size = input$n_trials, prob = input$prob_chance)

      sim_results(data.frame(correct = sim_outcomes))
    })

    # Render the simulation plot
    output$sim_plot <- renderPlot({
      df <- sim_results()
      if (is.null(df)) {
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

      # Create plot
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

      # Shade the p-value area
      p_val_area <- df %>% filter(correct >= obs_correct)
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = correct), binwidth = 1, fill = "#ef4444", alpha = 0.8)
      }
    })

    # Text description for the simulation plot
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

    # Calculate and display p-value
    output$p_value_result <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(p("Run simulation to get p-value."))

      obs_correct <- input$n_correct
      # Count how many simulated outcomes are as or more extreme
      p_value <- sum(df$correct >= obs_correct) / nrow(df)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("This is the probability of getting", obs_correct, "or more correct guesses, assuming it was all due to random chance.")
      )
    })

    # Screen reader description for the plot
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(class = "sr-only", "The plot is empty. Click the run simulation button to generate the plot."))
      }
      p_value <- sum(df$correct >= input$n_correct) / nrow(df)
      p(class = "sr-only", paste("The simulation is complete. The histogram shows the distribution of correct guesses if it were random chance. The observed number correct of", input$n_correct, "is marked with a red line. The calculated p-value is", round(p_value, 4), "."))
    })

  })
}
