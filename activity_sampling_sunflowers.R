# activity_sampling_sunflowers.R

library(shiny)
library(ggplot2)
library(dplyr)

# --- UI Definition ---
activity_sampling_sunflowers_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
    h2("Activity: Sampling Sunflowers (The Central Limit Theorem)"),
    wellPanel(
      h3("Instructions"),
      p("This activity demonstrates the Central Limit Theorem (CLT), one of the most important concepts in statistics. The CLT states that if you take many random samples from any population (even a skewed one), the distribution of the means of those samples will be approximately normal."),
      tags$ol(
        tags$li("The top-left plot shows our population of 10,000 sunflower heights. Notice that this distribution is skewed to the right, not normal."),
        tags$li("Use the slider to set a sample size (n). This is how many sunflowers we'll pick in each sample."),
        tags$li("Click the 'Take 1 Sample' button. The top-right plot will show the heights from your single sample, and its mean will be plotted as one blue square on the bottom plot."),
        tags$li("Click the button multiple times to see the sampling distribution build. Use the 'Take 1000 Samples' button to speed things up."),
        tags$li("Observe how the bottom plot (the sampling distribution of the means) starts to look like a normal, bell-shaped curve, even though the original population was skewed! Notice also how its center is close to the population mean.")
      )
    ),

    # Main content area
    fluidRow(
      # Column for controls and statistics
      column(4,
        h4("Controls"),
        sliderInput(ns("sample_size"), "Sample Size (n):", min = 2, max = 100, value = 10, `aria-describedby` = ns("n_desc")),
        p(id = ns("n_desc"), class = "sr-only", "Set the number of sunflowers to pick in each random sample."),
        fluidRow(
          column(6, actionButton(ns("take_1"), "Take 1 Sample")),
          column(6, actionButton(ns("take_10"), "Take 10 Samples"))
        ),
        br(),
        fluidRow(
          column(6, actionButton(ns("take_100"), "Take 100 Samples")),
          column(6, actionButton(ns("take_1000"), "Take 1000 Samples", class = "btn-primary"))
        ),
        br(),
        actionButton(ns("reset"), "Reset Simulation", class = "btn-danger"),
        hr(),
        h4("Statistics"),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            uiOutput(ns("stats_output"))
        )
      ),
      # Column for plots
      column(8,
        fluidRow(
          column(6,
            h5("Population of Sunflowers", align = "center"),
            plotOutput(ns("pop_plot"), height = "250px")
          ),
          column(6,
            h5("Most Recent Sample", align = "center"),
            plotOutput(ns("sample_plot"), height = "250px")
          )
        ),
        hr(),
        h5("Distribution of Sample Means", align = "center"),
        plotOutput(ns("sampling_dist_plot"), height = "300px"),
        uiOutput(ns("plot_desc"))
      )
    )
  )
}

# --- Server Logic ---
activity_sampling_sunflowers_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- 1. Create the Population ---
    # Create a skewed population of "sunflower heights"
    set.seed(42)
    population_data <- data.frame(height = round(rgamma(10000, shape = 2, scale = 10) + 50))
    pop_mean <- mean(population_data$height)
    pop_sd <- sd(population_data$height)
    pop_n <- nrow(population_data)

    # --- 2. Reactive Values for Simulation State ---
    sample_means <- reactiveVal(data.frame(mean = numeric(0)))
    last_sample <- reactiveVal(data.frame(height = numeric(0)))

    # --- 3. Simulation Logic ---
    # Function to take samples and update reactive values
    take_samples <- function(num_to_take) {
      n <- input$sample_size

      # Generate all sample means at once for efficiency
      new_means <- replicate(num_to_take, {
        sample_df <- population_data %>% sample_n(n)
        mean(sample_df$height)
      })

      # Get the very last sample to display in the plot
      last_sample_df <- population_data %>% sample_n(n)
      last_sample(last_sample_df)

      # Update the list of all sample means
      updated_means <- rbind(sample_means(), data.frame(mean = c(new_means, mean(last_sample_df$height))))
      sample_means(updated_means)
    }

    # Observe button clicks
    observeEvent(input$take_1, { take_samples(0) }) # Special case for 1 sample to show the last one
    observeEvent(input$take_10, { take_samples(9) })
    observeEvent(input$take_100, { take_samples(99) })
    observeEvent(input$take_1000, { take_samples(999) })

    # Reset logic
    observeEvent(input$reset, {
      sample_means(data.frame(mean = numeric(0)))
      last_sample(data.frame(height = numeric(0)))
    })

    # Reset if sample size changes
    observeEvent(input$sample_size, {
      sample_means(data.frame(mean = numeric(0)))
      last_sample(data.frame(height = numeric(0)))
    })

    # --- 4. Render Outputs ---
    # Population Plot (doesn't change)
    output$pop_plot <- renderPlot({
      ggplot(population_data, aes(x = height)) +
        geom_histogram(aes(y = ..density..), binwidth = 5, fill = "#f9a825", color = "white", alpha = 0.8) +
        geom_density(color = "#c77700", size = 1) +
        labs(x = "Height", y = "Density") +
        theme_minimal()
    }, alt = "A histogram of the population data, showing a distribution skewed to the right.")

    # Most Recent Sample Plot
    output$sample_plot <- renderPlot({
      df <- last_sample()
      if (nrow(df) == 0) {
        return(ggplot() + labs(title = "Take a sample") + theme_void())
      }
      ggplot(df, aes(x = height)) +
        geom_histogram(binwidth = 5, fill = "#42a5f5", color = "white", alpha = 0.8) +
        geom_vline(aes(xintercept = mean(height)), color = "#0d47a1", size = 1.5, linetype = "dashed") +
        coord_cartesian(xlim = range(population_data$height)) +
        labs(x = "Height", y = "Count") +
        theme_minimal()
    }, alt = "A histogram of the most recently taken sample.")

    # Sampling Distribution of Means Plot
    output$sampling_dist_plot <- renderPlot({
      df <- sample_means()
      if (nrow(df) == 0) {
        return(ggplot() + labs(title = "Distribution will build here") + theme_void())
      }

      p <- ggplot(df, aes(x = mean)) +
        geom_histogram(aes(y = ..density..), binwidth = 1, fill = "#29b6f6", color = "white", alpha = 0.8) +
        geom_density(color = "#0277bd", size = 1) +
        coord_cartesian(xlim = range(population_data$height)) +
        labs(x = "Sample Mean Height", y = "Density") +
        theme_minimal()

      # Overlay a normal curve based on CLT
      if(nrow(df) > 1) {
        se <- pop_sd / sqrt(input$sample_size)
        p <- p + stat_function(fun = dnorm, args = list(mean = pop_mean, sd = se), color = "red", linetype = "dashed", size = 1)
      }
      p
    }, alt = "A histogram of the means of all samples taken so far. A red dashed line shows the theoretical normal curve.")

    # Statistics Output
    output$stats_output <- renderUI({
      means_df <- sample_means()
      last_sample_df <- last_sample()

      tagList(
        strong("Population:"),
        p(paste("Mean =", round(pop_mean, 2), " SD =", round(pop_sd, 2), " N =", pop_n)),
        hr(),
        strong("Most Recent Sample:"),
        if (nrow(last_sample_df) > 0) {
          p(paste("Mean =", round(mean(last_sample_df$height), 2), " SD =", round(sd(last_sample_df$height), 2), " n =", nrow(last_sample_df)))
        } else { p("No sample taken yet.") },
        hr(),
        strong("Sampling Distribution of Means:"),
        if (nrow(means_df) > 0) {
          p(paste("Mean =", round(mean(means_df$mean), 2), " SD =", round(sd(means_df$mean), 2), " Samples =", nrow(means_df)))
        } else { p("No samples taken yet.") }
      )
    })

    # Screen reader description
    output$plot_desc <- renderUI({
      num_samples <- nrow(sample_means())
      if (num_samples > 0) {
        p(class = "sr-only", paste("The sampling distribution now contains", num_samples, "sample means. Its shape is becoming more normal."))
      } else {
        p(class = "sr-only", "The sampling distribution plot is currently empty.")
      }
    })

  })
}
