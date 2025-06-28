# StappletSHiny/sampling_distribution_proportion.R

# UI function for the 'Sampling Distribution of the Sample Proportion' applet
sampling_dist_proportion_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Sampling Distribution of the Sample Proportion", id = "appTitleProp"),
      windowTitle = "Sampling Distribution of the Sample Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanelProp",
        role = "form",
        "aria-labelledby" = "paramsHeadingProp",

        h3("Population Parameter", id = "paramsHeadingProp"),
        # Population Proportion
        div(
          class = "form-group",
          tags$label(id = ns("pop_prop_label"), "Population Proportion (p):"),
          htmltools::tagQuery(
            sliderInput(ns("pop_prop"), NULL, min = 0.01, max = 0.99, value = 0.50, step = 0.01)
          )$find("input")$addAttrs("aria-labelledby" = ns("pop_prop_label"))$all()
        ),

        hr(role = "separator"),
        h3("Sampling Parameters"),
        # Sample Size
        div(
          class = "form-group",
          tags$label(id = ns("sample_size_label_prop"), "Sample Size (n):"),
          htmltools::tagQuery(
            sliderInput(ns("sample_size"), NULL, min = 2, max = 500, value = 50)
          )$find("input")$addAttrs("aria-labelledby" = ns("sample_size_label_prop"))$all()
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
        id = "mainPanelProp",
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
              h4("Distribution of Sample Proportions (p-hat)", style = "text-align: center;", id = ns("sampDistLabel")),
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

# Server function for the 'Sampling Distribution of the Sample Proportion' applet
sampling_dist_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive values to store simulation data
    rv <- reactiveValues(
      sample_props = numeric(),
      last_sample = numeric()
    )

    # Reset sampling when population proportion or sample size changes
    observeEvent(c(input$pop_prop, input$sample_size), {
      rv$sample_props <- numeric()
      rv$last_sample <- numeric()
    })

    # Function to draw samples and update reactive values
    draw_samples <- function(num_samples) {
      req(input$pop_prop, input$sample_size > 1)
      pop_p <- input$pop_prop
      n_size <- input$sample_size

      new_props <- replicate(num_samples, {
        sample_data <- sample(c(1, 0), size = n_size, replace = TRUE, prob = c(pop_p, 1 - pop_p))
        mean(sample_data) # The proportion of successes (1s)
      })

      # Get the last sample for visualization
      last_drawn_sample <- sample(c(1, 0), size = n_size, replace = TRUE, prob = c(pop_p, 1 - pop_p))
      rv$last_sample <- last_drawn_sample

      # Update the list of proportions
      rv$sample_props <- c(rv$sample_props, new_props)
    }

    # Event handlers for action buttons
    observeEvent(input$draw_one, { draw_samples(1) })
    observeEvent(input$draw_100, { draw_samples(100) })
    observeEvent(input$draw_1000, { draw_samples(1000) })
    observeEvent(input$reset, {
      rv$sample_props <- numeric()
      rv$last_sample <- numeric()
    })

    # --- Render Plots ---

    # Population Plot
    output$populationPlot <- renderPlot({
      req(input$pop_prop)
      df_pop <- data.frame(
        Category = c("Success", "Failure"),
        Proportion = c(input$pop_prop, 1 - input$pop_prop)
      )
      ggplot(df_pop, aes(x = Category, y = Proportion, fill = Category)) +
        geom_bar(stat = "identity") +
        scale_fill_viridis_d(option = "D", end = 0.85) +
        labs(y = "Proportion", x = "", title = paste("p =", input$pop_prop)) +
        theme_minimal() +
        theme(axis.text = element_text(size = 14), axis.title = element_text(size = 16))
        theme(legend.position = "none")
    })

    # Last Sample Plot
    output$samplePlot <- renderPlot({
      if (length(rv$last_sample) == 0) {
        return(ggplot() + labs(title = "No sample drawn yet") + theme_void())
      }
      df_sample <- data.frame(Outcome = factor(rv$last_sample, levels = c(0, 1), labels = c("Failure", "Success")))
      p_hat <- mean(rv$last_sample)
      ggplot(df_sample, aes(x = Outcome, fill = Outcome)) +
        geom_bar() +
        scale_fill_viridis_d(option = "D", end = 0.85) +
        labs(x = "Outcome", y = "Count", title = paste("n =", input$sample_size, " p-hat =", round(p_hat, 3))) +
        theme_minimal() +
        theme(axis.text = element_text(size = 14), axis.title = element_text(size = 16))
        theme(legend.position = "none")
    })

    # Sampling Distribution Plot
    output$samplingDistPlot <- renderPlot({
      if (length(rv$sample_props) < 2) {
        return(ggplot() + labs(title = "Draw at least 2 samples to see distribution") + theme_void())
      }
      df_props <- data.frame(x = rv$sample_props)
      mean_of_props <- mean(df_props$x)
      pop_p <- input$pop_prop

      p <- ggplot(df_props, aes(x = x)) +
        geom_histogram(aes(y = ..density..), bins = 20, fill = "#fbbf24", color = "white") +
        geom_vline(xintercept = mean_of_props, color = "#1e40af", linetype = "solid", size = 1.2) +
        geom_vline(xintercept = pop_p, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Sample Proportions (p-hat)", y = "Density",
             title = paste("Mean of", length(rv$sample_props), "proportions =", round(mean_of_props, 3))) +
        theme_minimal()

      # Overlay theoretical normal curve (CLT) if conditions are met
      theoretical_sd <- sqrt(pop_p * (1 - pop_p) / input$sample_size)
      if (input$sample_size * pop_p >= 10 && input$sample_size * (1 - pop_p) >= 10) {
        p <- p + stat_function(
          fun = dnorm,
          args = list(mean = pop_p, sd = theoretical_sd),
          color = "black", size = 1.2, linetype = "dotted"
        )
      }
    })

    # --- Render Summary Statistics ---
    output$summaryStats <- renderPrint({
      num_samples <- length(rv$sample_props)
      pop_p <- input$pop_prop
      n_size <- input$sample_size

      cat("Population Parameter:\\n")
      cat("  Proportion (p): ", pop_p, "\\n\\n")

      cat("Sampling Distribution Statistics:\\n")
      cat("  Number of samples drawn: ", num_samples, "\\n")

      if (num_samples > 1) {
        mean_of_props <- mean(rv$sample_props)
        sd_of_props <- sd(rv$sample_props)
        theoretical_sd <- sqrt(pop_p * (1 - pop_p) / n_size)

        cat("  Mean of sample proportions: ", round(mean_of_props, 4), "\\n")
        cat("  Std dev of sample proportions (SE): ", round(sd_of_props, 4), "\\n\\n")

        cat("Theoretical (CLT) Values:\\n")
        cat("  Theoretical Mean: ", pop_p, "\\n")
        cat("  Theoretical Std Dev (SE): ", round(theoretical_sd, 4), "\\n\\n")

        cat("Normality Condition Check (CLT):\\n")
        cat("  n*p = ", round(n_size * pop_p, 2), " (must be >= 10)\\n")
        cat("  n*(1-p) = ", round(n_size * (1 - pop_p), 2), " (must be >= 10)\\n")

      } else {
        cat("  Draw more samples to calculate statistics.\\n")
      }
    })

  })
}
