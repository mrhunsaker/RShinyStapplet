# activity_mrs_gallas.R

library(shiny)
library(ggplot2)
library(dplyr)
library(BrailleR)
library(BrailleR)

# UI for the "Is Mrs. Gallas a Good Free Throw Shooter?" Activity
activity_mrs_gallas_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
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
          tags$li("We repeat this process thousands of times to build a distribution of outcomes that could happen if the claim were true."),
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot shows the distribution of successes from the simulations. The red line marks the actual number of successes observed. The p-value tells us the probability of getting a result as or more extreme than the observed one, assuming the claim is true.")
      )
    ),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        h4("Define the Scenario"),
        div(class = "form-group",
            tags$label("Claimed Success Rate (p₀):", `for` = ns("claimed_prop")),
            numericInput(ns("claimed_prop"), label = NULL, value = 0.80, min = 0.01, max = 1, step = 0.01),
            tags$p(id = ns("claimed_prop_desc"), class = "sr-only", "Enter the claimed proportion of successes, the null hypothesis value."),
            tags$script(paste0("document.getElementById('", ns("claimed_prop"), "').setAttribute('aria-describedby', '", ns("claimed_prop_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Number of Trials (n):", `for` = ns("n_trials")),
            numericInput(ns("n_trials"), label = NULL, value = 50, min = 1),
            tags$p(id = ns("n_trials_desc"), class = "sr-only", "Enter the total number of independent trials in the experiment."),
            tags$script(paste0("document.getElementById('", ns("n_trials"), "').setAttribute('aria-describedby', '", ns("n_trials_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Observed Number of Successes:", `for` = ns("n_success")),
            numericInput(ns("n_success"), label = NULL, value = 32, min = 0),
            tags$p(id = ns("n_success_desc"), class = "sr-only", "Enter the number of successful trials observed."),
            tags$script(paste0("document.getElementById('", ns("n_success"), "').setAttribute('aria-describedby', '", ns("n_success_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Alternative Hypothesis:", `for` = ns("alternative")),
            selectInput(ns("alternative"), label = NULL,
                        choices = c("Different from claim (p ≠ p₀)" = "two.sided",
                                    "Less than claim (p < p₀)" = "less",
                                    "Greater than claim (p > p₀)" = "greater")),
            tags$p(id = ns("alt_desc"), class = "sr-only", "Select the direction of the alternative hypothesis."),
            tags$script(paste0("document.getElementById('", ns("alternative"), "').setAttribute('aria-describedby', '", ns("alt_desc"), "')"))
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
            tags$script(paste0("document.getElementById('", ns("sim_plot"), "').setAttribute('aria-label', 'A histogram showing the distribution of the number of successes from many simulations. A red line indicates the observed number of successes.')")),
            p(id = ns("sim_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sim_plot_desc_text")))
        )
      )
    )
  )
}

# Server logic for the "Mrs. Gallas" Activity
activity_mrs_gallas_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive values
    sim_results <- reactiveVal(NULL)

    # Reset simulation if parameters change
    observe({
      input$n_trials
      input$n_success
      input$claimed_prop
      input$alternative
      sim_results(NULL)
      output$p_value_result <- renderUI({ p("Run simulation to get p-value.") })
    })

    # Event: Run Simulation
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

    # Render the simulation plot
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

    })

    # Text description for the simulation plot
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

      desc <- paste(
        sprintf("This histogram shows the distribution of the number of successes from %d simulated experiments.", input$num_sims),
        sprintf("Each experiment consisted of %d trials with a claimed success rate of %.2f.", input$n_trials, input$claimed_prop),
        sprintf("The distribution of simulated successes is centered around %.1f.", mean_sim_successes),
        sprintf("A dashed red vertical line marks the observed number of successes, which was %d.", obs_success),
        "The area corresponding to the p-value is shaded in red.",
        sprintf("The calculated p-value is %.4f.", p_value)
      )
      paste(desc, collapse = " ")
    })

    # Calculate and display p-value
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

    # Screen reader description for the plot
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(class = "sr-only", "The plot is empty. Click the run simulation button to generate the plot."))
      }
      p_value <- sum(df$successes >= input$n_success) / nrow(df) # Simplified for description
      p(class = "sr-only", paste("The simulation is complete. The histogram shows the distribution of successes if the claim were true. The observed number of successes,", input$n_success, ", is marked with a red line. The calculated p-value is approximately", round(p_value, 4), "."))
    })

  })
}
