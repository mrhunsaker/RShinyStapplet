# activity_hiring_discrimination.R

library(shiny)
library(ggplot2)
library(dplyr)

# UI for the Hiring Discrimination Activity
activity_hiring_discrimination_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
    h2("Activity: Hiring Discrimination"),
    wellPanel(
      h3("Instructions"),
      p("This activity simulates a famous study on hiring discrimination. Researchers created identical resumes but assigned stereotypically male or female names to them. The goal is to determine if there is evidence of a significant difference in the callback rates for the 'male' and 'female' resumes."),
      tags$ol(
        tags$li("The table below is pre-filled with data from a real study. You can adjust these numbers if you wish."),
        tags$li("The 'Observed Difference' shows the actual difference in the proportion of callbacks between the two groups in the sample data."),
        tags$li(strong("The Simulation:"), "We will test the null hypothesis that there is no discrimination (i.e., the name on the resume has no effect on the callback rate). To do this, we will perform a permutation test:"),
        tags$ul(
          tags$li("We take all the outcomes (all 'Hired' and 'Not Hired' results) and throw them into one big pool."),
          tags$li("We then shuffle this pool and randomly deal the outcomes back to the two groups, keeping the original group sizes."),
          tags$li("We calculate the difference in proportions for this new 'shuffled' group and record it."),
          tags$li("We repeat this process thousands of times to build a distribution of differences that could happen just by random chance if the null hypothesis were true.")
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot will show the distribution of simulated differences. The red line shows our original observed difference. The p-value tells us how often we'd get a result as extreme as our observed one, just by random chance alone.")
      )
    ),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        h4("Enter Sample Data"),
        p("Based on a study where 48 identical resumes were sent out."),
        fluidRow(
          column(6,
            div(class = "form-group",
              tags$label("Male Name: Hired", `for` = ns("male_hired")),
              numericInput(ns("male_hired"), label = NULL, value = 35, min = 0),
              tags$p(id = ns("male_hired_desc"), class = "sr-only", "Enter the number of resumes with male names that received a callback."),
              tags$script(paste0("document.getElementById('", ns("male_hired"), "').setAttribute('aria-describedby', '", ns("male_hired_desc"), "')"))
            )
          ),
          column(6,
            div(class = "form-group",
              tags$label("Male Name: Not Hired", `for` = ns("male_not_hired")),
              numericInput(ns("male_not_hired"), label = NULL, value = 13, min = 0),
              tags$p(id = ns("male_not_hired_desc"), class = "sr-only", "Enter the number of resumes with male names that did not receive a callback."),
              tags$script(paste0("document.getElementById('", ns("male_not_hired"), "').setAttribute('aria-describedby', '", ns("male_not_hired_desc"), "')"))
            )
          )
        ),
        fluidRow(
          column(6,
            div(class = "form-group",
              tags$label("Female Name: Hired", `for` = ns("female_hired")),
              numericInput(ns("female_hired"), label = NULL, value = 14, min = 0),
              tags$p(id = ns("female_hired_desc"), class = "sr-only", "Enter the number of resumes with female names that received a callback."),
              tags$script(paste0("document.getElementById('", ns("female_hired"), "').setAttribute('aria-describedby', '", ns("female_hired_desc"), "')"))
            )
          ),
          column(6,
            div(class = "form-group",
              tags$label("Female Name: Not Hired", `for` = ns("female_not_hired")),
              numericInput(ns("female_not_hired"), label = NULL, value = 34, min = 0),
              tags$p(id = ns("female_not_hired_desc"), class = "sr-only", "Enter the number of resumes with female names that did not receive a callback."),
              tags$script(paste0("document.getElementById('", ns("female_not_hired"), "').setAttribute('aria-describedby', '", ns("female_not_hired_desc"), "')"))
            )
          )
        ),
        hr(),
        div(class = "form-group",
          tags$label("Number of Shuffles (Simulations):", `for` = ns("num_sims")),
          numericInput(ns("num_sims"), label = NULL, value = 1000, min = 100, max = 10000, step = 100),
          tags$p(id = ns("num_sims_desc"), class = "sr-only", "Enter the number of times to shuffle the data for the simulation."),
          tags$script(paste0("document.getElementById('", ns("num_sims"), "').setAttribute('aria-describedby', '", ns("num_sims_desc"), "')"))
        ),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        hr(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Observed Result"),
            uiOutput(ns("observed_result"))
        ),
        br(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result"))
        )
      ),
      mainPanel(
        div(class = "plot-container",
            plotOutput(ns("sim_plot")),
            tags$script(paste0("document.getElementById('", ns("sim_plot"), "').setAttribute('aria-label', 'A histogram showing the distribution of simulated differences in proportions. A red line indicates the observed difference from the sample data.')")),
            uiOutput(ns("plot_desc"))
        )
      )
    )
  )
}

# Server logic for the Hiring Discrimination Activity
activity_hiring_discrimination_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive values
    sim_results <- reactiveVal(NULL)
    observed_diff <- reactiveVal(0)

    # Calculate observed difference whenever inputs change
    observe({
      req(input$male_hired, input$male_not_hired, input$female_hired, input$female_not_hired)
      male_total <- input$male_hired + input$male_not_hired
      female_total <- input$female_hired + input$female_not_hired

      if (male_total == 0 || female_total == 0) return()

      prop_male <- input$male_hired / male_total
      prop_female <- input$female_hired / female_total
      diff <- prop_male - prop_female
      observed_diff(diff)

      output$observed_result <- renderUI({
        tagList(
          p(strong("Prop(Male Hired): "), round(prop_male, 3)),
          p(strong("Prop(Female Hired): "), round(prop_female, 3)),
          p(strong("Difference (Male - Female): "), round(diff, 3))
        )
      })
      # Reset simulation on data change
      sim_results(NULL)
      output$p_value_result <- renderUI({ p("Run simulation to get p-value.") })
    })

    # Event: Run Simulation
    observeEvent(input$run_sim, {
      # Create a pool of all outcomes
      total_hired <- input$male_hired + input$female_hired
      total_not_hired <- input$male_not_hired + input$female_not_hired
      pool <- c(rep("Hired", total_hired), rep("Not Hired", total_not_hired))

      # Group sizes
      n_male <- input$male_hired + input$male_not_hired
      n_female <- input$female_hired + input$female_not_hired

      # Run the simulation
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

    # Render the simulation plot
    output$sim_plot <- renderPlot({
      df <- sim_results()
      if (is.null(df)) {
        return(
          ggplot() +
            labs(title = "Distribution of Simulated Differences",
                 subtitle = "Click 'Run Simulation' to generate this plot",
                 x = "Simulated Difference in Proportions", y = "Count") +
            theme_minimal(base_size = 14) +
            theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5))
        )
      }

      obs_diff <- observed_diff()

      # Create plot
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

      # Shade the p-value area
      p_val_area <- df %>% filter(abs(diff) >= abs(obs_diff))
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = diff, y = ..density..), bins = 30, fill = "#ef4444", alpha = 0.8)
      }

      p
    })

    # Calculate and display p-value
    output$p_value_result <- renderUI({
      df <- sim_results()
      if (is.null(df)) return(p("Run simulation to get p-value."))

      obs_diff <- observed_diff()
      # Count how many simulated diffs are as or more extreme than the observed one
      p_value <- sum(abs(df$diff) >= abs(obs_diff)) / nrow(df)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("This is the probability of observing a difference as large as", round(abs(obs_diff), 3), "or larger, assuming no real effect exists.")
      )
    })

    # Screen reader description for the plot
    output$plot_desc <- renderUI({
      df <- sim_results()
      if (is.null(df)) {
        return(p(class = "sr-only", "The plot is empty. Click the run simulation button to generate the plot."))
      }
      p_value <- sum(abs(df$diff) >= abs(observed_diff())) / nrow(df)
      p(class = "sr-only", paste("The simulation is complete. The histogram shows a distribution of differences centered near zero. The observed difference of", round(observed_diff(), 3), "is marked with a red line. The calculated p-value is", round(p_value, 4), "."))
    })

  })
}
