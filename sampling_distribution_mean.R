# StappletSHiny/sampling_distribution_mean.R

# UI function for the 'Sampling Distribution of the Sample Mean' applet
sampling_dist_mean_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Sampling Distribution of the Sample Mean", id = "appTitle"),
      windowTitle = "Sampling Distribution of the Sample Mean"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",

        h3("Population Parameters", id = "paramsHeading"),
        # Select population shape
        div(
          class = "form-group",
          tags$label(id = ns("pop_shape_label"), "Population Shape:"),
          # Use tagQuery to add aria-labelledby, as selectInput doesn't accept it directly.
          htmltools::tagQuery(
            selectInput(ns("pop_shape"), NULL,
                        choices = c("Normal", "Uniform", "Skewed Right", "Skewed Left"),
                        selected = "Normal")
          )$find("select")$addAttrs("aria-labelledby" = ns("pop_shape_label"))$all()
        ),
        # Population Mean (only for Normal and Skewed)
        conditionalPanel(
          condition = "input.pop_shape == 'Normal' || input.pop_shape.includes('Skewed')",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("pop_mean_label"), "Population Mean (μ):"),
            htmltools::tagQuery(
              sliderInput(ns("pop_mean"), NULL, min = 0, max = 100, value = 50)
            )$find("input")$addAttrs("aria-labelledby" = ns("pop_mean_label"))$all()
          )
        ),
        # Population SD (only for Normal and Skewed)
        conditionalPanel(
          condition = "input.pop_shape == 'Normal' || input.pop_shape.includes('Skewed')",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("pop_sd_label"), "Population SD (\\u03C3):"),
            htmltools::tagQuery(
              sliderInput(ns("pop_sd"), NULL, min = 1, max = 30, value = 10)
            )$find("input")$addAttrs("aria-labelledby" = ns("pop_sd_label"))$all()
          )
        ),

        hr(role = "separator"),
        h3("Sampling Parameters"),
        # Sample Size
        div(
          class = "form-group",
          tags$label(id = ns("sample_size_label"), "Sample Size (n):"),
          htmltools::tagQuery(
            sliderInput(ns("sample_size"), NULL, min = 2, max = 100, value = 10)
          )$find("input")$addAttrs("aria-labelledby" = ns("sample_size_label"))$all()
        ),
        # Action buttons for drawing samples
        p("Draw samples to build the sampling distribution:"),
        div(
          actionButton(ns("draw_one"), "Draw 1 Sample", class = "btn-primary", width = "100%"),
          br(),
          actionButton(ns("draw_100"), "Draw 100 Samples", class = "btn-primary", width = "100%"),
          br(),
          actionButton(ns("draw_1000"), "Draw 1000 Samples", class = "btn-primary", width = "100%")
        ),
        # Reset button
        actionButton(ns("reset"), "Reset Distribution", class = "btn-danger", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        fluidRow(
          # Population Plot
          column(6,
            div(class = "plot-container",
              h4("Population Distribution", style = "text-align: center;", id = ns("popDistLabel")),
              htmltools::tagQuery(
                plotOutput(ns("populationPlot"), height = "250px")
              )$find("img")$addAttrs("aria-labelledby" = ns("popDistLabel"))$all()
            )
          ),
          # Last Sample Plot
          column(6,
            div(class = "plot-container",
              h4("Most Recent Sample", style = "text-align: center;", id = ns("lastSampleLabel")),
              htmltools::tagQuery(
                plotOutput(ns("samplePlot"), height = "250px")
              )$find("img")$addAttrs("aria-labelledby" = ns("lastSampleLabel"))$all()
            )
          )
        ),
        # Sampling Distribution Plot
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Distribution of Sample Means", style = "text-align: center;", id = ns("sampDistLabel")),
              htmltools::tagQuery(
                plotOutput(ns("samplingDistPlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("sampDistLabel"))$all()
            )
          )
        ),
        # Summary Statistics
        fluidRow(
          column(12,
            div(class = "results-box",
              h3("Summary Statistics", id = ns("summaryStatsLabel")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("summaryStats"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("summaryStatsLabel"))$all()
            )
          )
        )
      )
    )
  )
}

# Server function for the 'Sampling Distribution of the Sample Mean' applet
sampling_dist_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive values to store simulation data
    rv <- reactiveValues(
      population = numeric(),
      pop_stats = list(mean = 0, sd = 0),
      sample_means = numeric(),
      last_sample = numeric()
    )

    # Generate the population based on user inputs
    observe({
      pop_shape <- input$pop_shape
      pop_mean <- input$pop_mean
      pop_sd <- input$pop_sd
      n_pop <- 10000 # Size of the simulated population

      new_population <- switch(pop_shape,
        "Normal" = rnorm(n_pop, mean = pop_mean, sd = pop_sd),
        "Uniform" = runif(n_pop, min = 0, max = 100),
        "Skewed Right" = rbeta(n_pop, 2, 5) * 100,
        "Skewed Left" = rbeta(n_pop, 5, 2) * 100
      )

      rv$population <- new_population
      rv$pop_stats <- list(mean = mean(new_population), sd = sd(new_population))
      # Reset sampling when population changes
      rv$sample_means <- numeric()
      rv$last_sample <- numeric()
    })

    # Function to draw samples and update reactive values
    draw_samples <- function(num_samples) {
      req(rv$population, input$sample_size > 1)

      new_means <- replicate(num_samples, {
        sample_data <- sample(rv$population, size = input$sample_size, replace = TRUE)
        mean(sample_data)
      })

      # To get the last sample, we need to draw it one more time outside replicate
      last_drawn_sample <- sample(rv$population, size = input$sample_size, replace = TRUE)
      rv$last_sample <- last_drawn_sample

      # Update the list of means
      rv$sample_means <- c(rv$sample_means, new_means)
    }

    # Event handlers for action buttons
    observeEvent(input$draw_one, { draw_samples(1) })
    observeEvent(input$draw_100, { draw_samples(100) })
    observeEvent(input$draw_1000, { draw_samples(1000) })
    observeEvent(input$reset, {
      rv$sample_means <- numeric()
      rv$last_sample <- numeric()
    })

    # --- Render Plots ---

    # Population Plot
    output$populationPlot <- renderPlot({
      req(rv$population)
      ggplot(data.frame(x = rv$population), aes(x = x)) +
        geom_histogram(aes(y = ..density..), bins = 30, fill = "#60a5fa", color = "white") +
        geom_density(color = "#1e40af", size = 1) +
        geom_vline(xintercept = rv$pop_stats$mean, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Value", y = "Density", title = paste("Mean =", round(rv$pop_stats$mean, 2), " SD =", round(rv$pop_stats$sd, 2))) +
        theme_minimal()
    })

    # Last Sample Plot
    output$samplePlot <- renderPlot({
      if (length(rv$last_sample) == 0) {
        return(ggplot() + labs(title = "No sample drawn yet") + theme_void())
      }
      df_sample <- data.frame(x = rv$last_sample)
      sample_mean <- mean(df_sample$x)
      ggplot(df_sample, aes(x = x)) +
        geom_histogram(bins = 15, fill = "#84cc16", color = "white") +
        geom_vline(xintercept = sample_mean, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Value", y = "Count", title = paste("n =", input$sample_size, " Mean =", round(sample_mean, 2))) +
        xlim(range(rv$population)) + # Keep x-axis consistent with population
        theme_minimal()
    })

    # Sampling Distribution Plot
    output$samplingDistPlot <- renderPlot({
      if (length(rv$sample_means) < 2) { # Need at least 2 points for sd
        return(ggplot() + labs(title = "Draw at least 2 samples to see distribution") + theme_void())
      }
      df_means <- data.frame(x = rv$sample_means)
      mean_of_means <- mean(df_means$x)
      sd_of_means <- sd(df_means$x)

      p <- ggplot(df_means, aes(x = x)) +
        geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
        geom_vline(xintercept = mean_of_means, color = "#1e40af", linetype = "solid", size = 1.2) +
        geom_vline(xintercept = rv$pop_stats$mean, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Sample Means", y = "Density",
             title = paste("Mean of", length(rv$sample_means), "means =", round(mean_of_means, 2))) +
        theme_minimal()

      # Overlay theoretical normal curve (CLT)
      theoretical_sd <- rv$pop_stats$sd / sqrt(input$sample_size)
      p + stat_function(
        fun = dnorm,
        args = list(mean = rv$pop_stats$mean, sd = theoretical_sd),
        color = "black", size = 1.2, linetype = "dotted"
      )
    })

    # --- Render Summary Statistics ---
    output$summaryStats <- renderPrint({
      num_samples <- length(rv$sample_means)
      cat("Population Parameters:\n")
      cat("  Mean (\u03BC): ", round(rv$pop_stats$mean, 3), "\n")
      cat("  Std Dev (\u03C3): ", round(rv$pop_stats$sd, 3), "\n\n")

      cat("Sampling Distribution Statistics:\n")
      cat("  Number of samples drawn: ", num_samples, "\n")

      if (num_samples > 1) {
        mean_of_means <- mean(rv$sample_means)
        sd_of_means <- sd(rv$sample_means)
        theoretical_sd <- rv$pop_stats$sd / sqrt(input$sample_size)

        cat("  Mean of sample means: ", round(as.numeric(mean_of_means), 3), "\n")
        cat("  Std dev of sample means (SE): ", round(as.numeric(sd_of_means), 3), "\n\n")

        cat("Theoretical (CLT) Values:\n")
        cat("  Theoretical Mean: ", round(as.numeric(rv$pop_stats$mean), 3), "\n")
        cat("  Theoretical Std Dev (SE): ", round(as.numeric(theoretical_sd), 3), "\n")
      } else {
        cat("  Draw more samples to calculate statistics.\n")
      }
    })

  })
}
