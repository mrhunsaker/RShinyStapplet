# StappletSHiny/ci_mean.R

# UI function for the 'Confidence Interval for a Population Mean' applet
ci_mean_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Confidence Interval for a Population Mean (t-Interval)", id = "appTitle"),
      windowTitle = "Confidence Interval for a Mean"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",

        h3("Population Parameters", id = "paramsHeading"),
        # Population Mean
        div(
          class = "form-group",
          tags$label(id = ns("pop_mean_label"), "Population Mean (\\u03BC):"),
          htmltools::tagQuery(
            sliderInput(ns("pop_mean"), NULL, min = 0, max = 200, value = 100)
          )$find("input")$addAttrs("aria-labelledby" = ns("pop_mean_label"))$all()
        ),
        # Population Standard Deviation
        div(
          class = "form-group",
          tags$label(id = ns("pop_sd_label"), "Population SD (\\u03C3):"),
          htmltools::tagQuery(
            sliderInput(ns("pop_sd"), NULL, min = 1, max = 50, value = 15)
          )$find("input")$addAttrs("aria-labelledby" = ns("pop_sd_label"))$all()
        ),

        hr(role = "separator"),

        # Sample Size
        div(
          class = "form-group",
          tags$label(id = ns("sample_size_label"), "Sample Size (n):"),
          htmltools::tagQuery(
            sliderInput(ns("sample_size"), NULL, min = 2, max = 100, value = 30)
          )$find("input")$addAttrs("aria-labelledby" = ns("sample_size_label"))$all()
        ),
        # Confidence Level
        div(
          class = "form-group",
          tags$label(id = ns("conf_level_label"), "Confidence Level:"),
          htmltools::tagQuery(
            selectInput(ns("conf_level"), NULL,
                        choices = c("90%" = 0.90, "95%" = 0.95, "98%" = 0.98, "99%" = 0.99),
                        selected = 0.95)
          )$find("select")$addAttrs("aria-labelledby" = ns("conf_level_label"))$all()
        ),

        hr(role = "separator"),
        # Action buttons for drawing samples
        p("Generate confidence intervals from new samples:"),
        div(
          style = "display: flex; justify-content: space-between; margin-bottom: 10px;",
          actionButton(ns("draw_one"), "Draw 1 Interval", class = "btn-primary"),
          actionButton(ns("draw_100"), "Draw 100 Intervals", class = "btn-primary")
        ),
        # Reset button
        actionButton(ns("reset"), "Reset", class = "btn-danger", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        fluidRow(
          # Population and Sample Plot
          column(6,
            div(class = "plot-container",
              h4("Population & Last Sample", style = "text-align: center;", id = ns("popPlotHeading")),
              htmltools::tagQuery(
                plotOutput(ns("populationPlot"), height = "250px")
              )$find("img")$addAttrs("aria-labelledby" = ns("popPlotHeading"))$all()
            )
          ),
          # Summary Statistics
          column(6,
            div(class = "results-box",
              h4("Simulation Summary", style = "text-align: center;", id = ns("summaryStatsHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("summaryStats"), placeholder = TRUE)
              )$find("pre")$addAttrs("aria-labelledby" = ns("summaryStatsHeading"))$all()
            )
          )
        ),
        # Confidence Intervals Plot
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Generated Confidence Intervals", style = "text-align: center;", id = ns("ciPlotHeading")),
              htmltools::tagQuery(
                plotOutput(ns("ciPlot"), height = "400px")
              )$find("img")$addAttrs("aria-labelledby" = ns("ciPlotHeading"))$all()
            )
          )
        )
      )
    )
  )
}

# Server function for the 'Confidence Interval for a Population Mean' applet
ci_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive values to store simulation data
    rv <- reactiveValues(
      population = numeric(),
      intervals = data.frame(
        id = integer(),
        mean = numeric(),
        lower = numeric(),
        upper = numeric(),
        captured = logical()
      ),
      last_sample = numeric()
    )

    # Generate the population when parameters change
    observe({
      req(input$pop_mean, input$pop_sd)
      rv$population <- rnorm(10000, mean = input$pop_mean, sd = input$pop_sd)
      # Reset intervals when population changes
      rv$intervals <- data.frame(id = integer(), mean = numeric(), lower = numeric(), upper = numeric(), captured = logical())
      rv$last_sample <- numeric()
    })

    # Function to draw samples and calculate CIs
    draw_and_calculate <- function(num_intervals) {
      req(rv$population, input$sample_size > 1, input$conf_level)

      pop_mean <- input$pop_mean
      sample_size <- input$sample_size
      conf_level <- as.numeric(input$conf_level)
      # Degrees of freedom for t-distribution
      df <- sample_size - 1
      # Critical t-value
      t_star <- qt(1 - (1 - conf_level) / 2, df)

      new_intervals <- replicate(num_intervals, {
        # Draw a sample
        current_sample <- sample(rv$population, size = sample_size, replace = TRUE)
        # Calculate sample stats
        x_bar <- mean(current_sample)
        s <- sd(current_sample)
        # Calculate margin of error
        margin_error <- t_star * (s / sqrt(sample_size))
        # Calculate CI
        lower_bound <- x_bar - margin_error
        upper_bound <- x_bar + margin_error
        # Check if it captured the true mean
        captured_mu <- (pop_mean >= lower_bound) && (pop_mean <= upper_bound)

        # Return a named vector
        c(mean = x_bar, lower = lower_bound, upper = upper_bound, captured = captured_mu)
      }, simplify = FALSE)

      # Update the last sample for plotting
      rv$last_sample <- sample(rv$population, size = sample_size, replace = TRUE)

      # Convert list of vectors to a data frame
      new_intervals_df <- as.data.frame(do.call(rbind, new_intervals))
      new_intervals_df$id <- (nrow(rv$intervals) + 1):(nrow(rv$intervals) + num_intervals)

      # Append to existing intervals
      rv$intervals <- rbind(rv$intervals, new_intervals_df)
    }

    # Event handlers for action buttons
    observeEvent(input$draw_one, { draw_and_calculate(1) })
    observeEvent(input$draw_100, { draw_and_calculate(100) })
    observeEvent(input$reset, {
      rv$intervals <- data.frame(id = integer(), mean = numeric(), lower = numeric(), upper = numeric(), captured = logical())
      rv$last_sample <- numeric()
    })

    # --- Render Plots ---

    # Population and Sample Plot
    output$populationPlot <- renderPlot({
      req(rv$population)
      df_pop <- data.frame(x = rv$population)

      p <- ggplot(df_pop, aes(x = x)) +
        geom_density(fill = "#60a5fa", alpha = 0.5) +
        geom_vline(xintercept = input$pop_mean, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Value", y = "Density", title = paste("Population (\\u03BC = ", input$pop_mean, ")")) +
        theme_minimal()

      if (length(rv$last_sample) > 0) {
        df_sample <- data.frame(x = rv$last_sample)
        p <- p + geom_histogram(data = df_sample, aes(x = x, y = ..density..),
                                fill = "#84cc16", alpha = 0.7, bins = 15)
      }
      p
    })

    # Confidence Intervals Plot
    output$ciPlot <- renderPlot({
      if (nrow(rv$intervals) == 0) {
        return(ggplot() + labs(title = "Draw a sample to generate a confidence interval") + theme_void())
      }

      # Display up to the last 100 intervals for clarity
      display_data <- tail(rv$intervals, 100)
      display_data$captured_factor <- factor(display_data$captured, levels = c("TRUE", "FALSE"))

      ggplot(display_data, aes(x = mean, y = id, xmin = lower, xmax = upper, color = captured_factor)) +
        geom_vline(xintercept = input$pop_mean, color = "#dc2626", linetype = "dashed", size = 1) +
        geom_errorbarh(height = 0.5, size = 0.8) +
        geom_point(size = 2) +
        scale_color_manual(values = c("TRUE" = "#1e40af", "FALSE" = "#ef4444"),
                           name = "Captured Pop. Mean?",
                           labels = c("Yes", "No"),
                           drop = FALSE) +
        labs(x = "Value", y = "Sample Number",
             title = "Confidence Intervals for \\u03BC") +
        theme_minimal() +
        theme(legend.position = "top")
    })

    # --- Render Summary Statistics ---
    output$summaryStats <- renderPrint({
      total_intervals <- nrow(rv$intervals)
      conf_level_pct <- paste0(as.numeric(input$conf_level) * 100, "%")

      cat("Confidence Level:", conf_level_pct, "\n\n")

      if (total_intervals == 0) {
        cat("No intervals generated yet.\n")
        return()
      }

      num_captured <- sum(rv$intervals$captured)
      percent_captured <- (num_captured / total_intervals) * 100

      cat("Total Intervals Generated:", total_intervals, "\n")
      cat("Number Capturing Pop. Mean:", num_captured, "\n")
      cat("Percent Captured:", sprintf("%.1f%%", percent_captured), "\n\n")

      cat("--- Last Interval Details ---\n")
      last_int <- tail(rv$intervals, 1)
      cat("Sample Mean:", round(last_int$mean, 2), "\n")
      cat(conf_level_pct, "CI: (", round(last_int$lower, 2), ", ", round(last_int$upper, 2), ")\n")
      cat("Captured Pop. Mean?", ifelse(last_int$captured, "Yes", "No"), "\n")
    })

  })
}
