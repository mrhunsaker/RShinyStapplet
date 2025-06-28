# RShinyStapplet/ht_chi_gof.R

# UI function for the 'Chi-Square Goodness-of-Fit Test' applet
ht_chi_gof_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Chi-Square Goodness-of-Fit Test", id = ns("appTitle")),
      windowTitle = "Chi-Square Goodness-of-Fit Test"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        "aria-labelledby" = ns("paramsHeading"),
        h3("Test Parameters", id = ns("paramsHeading")),

        # Slider to determine the number of categories
        div(
          class = "form-group",
          tags$label(id = ns("num_cat_label"), "Number of Categories:"),
          htmltools::tagQuery(
            sliderInput(ns("num_cat"), NULL, min = 2, max = 8, value = 4, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("num_cat_label"))$all()
        ),

        hr(role = "separator"),

        # UI for observed counts, generated dynamically
        h4("Observed Counts"),
        p("Enter the observed frequency for each category.", id = ns("obs_help")),
        uiOutput(ns("observed_counts_ui")),

        hr(role = "separator"),

        # UI for expected proportions
        h4("Expected Proportions (Null Hypothesis)"),
        div(
          class = "form-group",
          radioButtons(ns("expected_type"), "Specify Expected Proportions:",
                       choices = c("Equal proportions for all categories" = "equal",
                                   "Custom proportions" = "custom"),
                       selected = "equal")
        ),
        # Dynamically generated UI for custom proportions
        conditionalPanel(
          condition = "input.expected_type == 'custom'",
          ns = ns,
          p("Enter expected proportions. They must sum to 1.", id = ns("custom_help")),
          uiOutput(ns("expected_props_ui"))
        ),

        hr(role = "separator"),
        actionButton(ns("calculate"), "Run Test", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        # Conditional panel to show results only after calculation
        conditionalPanel(
          condition = "input.calculate > 0",
          ns = ns,
          fluidRow(
            column(12,
              div(class = "results-box",
                h3("Test Results", id = ns("results_summary_heading")),
                htmltools::tagQuery(
                  verbatimTextOutput(ns("results_summary"))
                )$find("pre")$addAttrs("aria-labelledby" = ns("results_summary_heading"))$all()
              )
            )
          ),
          fluidRow(
            # Plot for contributions to the Chi-Square statistic
            column(6,
              div(class = "plot-container",
                h4("Contributions to Chi-Square Statistic", id = ns("contrib_heading"), style = "text-align: center;"),
                htmltools::tagQuery(
                  plotOutput(ns("contribution_plot"), height = "300px")
                )$find("img")$addAttrs("aria-labelledby" = ns("contrib_heading"))$all()
              )
            ),
            # Plot for the Chi-Square distribution and p-value
            column(6,
              div(class = "plot-container",
                h4("Chi-Square Distribution", id = ns("chi_sq_dist_heading"), style = "text-align: center;"),
                htmltools::tagQuery(
                  plotOutput(ns("chi_square_dist_plot"), height = "300px")
                )$find("img")$addAttrs("aria-labelledby" = ns("chi_sq_dist_heading"))$all()
              )
            )
          )
        ),
        # Initial message to guide the user
        conditionalPanel(
          condition = "input.calculate == 0",
          ns = ns,
          div(
            style = "text-align: center; margin-top: 50px;",
            h3("Ready to Test"),
            p("Enter your observed counts and expected proportions in the sidebar, then click 'Run Test' to see the results.", style = "font-size: 16px;")
          )
        )
      )
    )
  )
}

# Server function for the 'Chi-Square Goodness-of-Fit Test' applet
ht_chi_gof_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive value to store the results of the chi-square test
    test_results <- eventReactive(input$calculate, {
      num_cat <- input$num_cat

      # --- Gather Inputs ---
      # Gather observed counts from dynamic UI
      observed <- sapply(1:num_cat, function(i) {
        input[[paste0("obs_cat_", i)]]
      })

      # Validate observed counts
      if (any(is.na(observed)) || any(observed < 0)) {
        return(list(error = "Observed counts must be non-negative numbers."))
      }

      # Gather expected proportions
      if (input$expected_type == "equal") {
        proportions <- rep(1/num_cat, num_cat)
      } else {
        proportions <- sapply(1:num_cat, function(i) {
          input[[paste0("prop_cat_", i)]]
        })
        # Validate custom proportions
        if (any(is.na(proportions)) || any(proportions < 0)) {
          return(list(error = "Custom proportions must be non-negative numbers."))
        }
        if (abs(sum(proportions) - 1) > 1e-6) { # Check if sum is close to 1
          return(list(error = paste0("Custom proportions must sum to 1. Current sum: ", sum(proportions))))
        }
      }

      # --- Perform Test ---
      # Run the chi-square test, catching potential errors
      res <- tryCatch({
        chisq.test(x = observed, p = proportions)
      }, error = function(e) {
        list(error = e$message)
      })

      # Check for errors from the test itself
      if (!is.null(res$error)) {
        return(res)
      }

      # Check for warning about expected counts
      warning_msg <- NULL
      if (any(res$expected < 5)) {
        warning_msg <- "Warning: One or more expected counts are less than 5. The Chi-Square approximation may be inaccurate."
      }

      # --- Return Results ---
      list(
        statistic = res$statistic,
        p.value = res$p.value,
        df = res$parameter,
        observed = res$observed,
        expected = res$expected,
        residuals = res$residuals,
        warning = warning_msg,
        error = NULL
      )
    })

    # --- Dynamic UI Generation ---

    # Generate numeric inputs for observed counts
    output$observed_counts_ui <- renderUI({
      num_cat <- input$num_cat
      inputs <- lapply(1:num_cat, function(i) {
        div(class = "form-group shiny-input-container",
            tags$label(`for` = ns(paste0("obs_cat_", i)), paste("Category", i, "Count:")),
            numericInput(ns(paste0("obs_cat_", i)), NULL, value = 10, min = 0)
        )
      })
      do.call(tagList, inputs)
    })

    # Generate numeric inputs for custom proportions
    output$expected_props_ui <- renderUI({
      num_cat <- input$num_cat
      inputs <- lapply(1:num_cat, function(i) {
        div(class = "form-group shiny-input-container",
            tags$label(`for` = ns(paste0("prop_cat_", i)), paste("Category", i, "Proportion:")),
            numericInput(ns(paste0("prop_cat_", i)), NULL, value = round(1/num_cat, 2), min = 0, max = 1, step = 0.01)
        )
      })
      do.call(tagList, inputs)
    })

    # --- Render Outputs ---

    # Render the summary of test results
    output$results_summary <- renderPrint({
      results <- test_results()

      if (!is.null(results$error)) {
        cat("Error:", results$error)
        return()
      }

      cat("Chi-Square Goodness-of-Fit Test\n\n")
      cat("Null Hypothesis (H0): The observed data follows the specified proportions.\n")
      cat("Alternative Hypothesis (Ha): The observed data does not follow the specified proportions.\n\n")

      # Create and print a summary table
      summary_df <- data.frame(
        Category = 1:length(results$observed),
        Observed = results$observed,
        Expected = round(results$expected, 2),
        Contribution = round(results$residuals^2, 3)
      )
      print(summary_df, row.names = FALSE)

      cat("\n----------------------------------------\n")
      cat(sprintf("Chi-Square Statistic (χ²): %.4f\n", as.numeric(results$statistic)))
      cat(sprintf("Degrees of Freedom (df): %d\n", as.integer(results$df)))
      cat(sprintf("P-value: %.4f\n", as.numeric(results$p.value)))
      cat("----------------------------------------\n\n")

      # Provide a conclusion
      alpha <- 0.05
      cat(paste0("Conclusion (at α = ", alpha, "):\n"))
      if (results$p.value < alpha) {
        cat(paste0("Since the p-value (", round(results$p.value, 4), ") is less than ", alpha, ", we reject the null hypothesis.\n"))
        cat("There is significant evidence that the true proportions are different from the expected ones.\n")
      } else {
        cat(paste0("Since the p-value (", round(results$p.value, 4), ") is not less than ", alpha, ", we fail to reject the null hypothesis.\n"))
        cat("There is not enough evidence to conclude that the true proportions differ from the expected ones.\n")
      }

      # Display warning if applicable
      if (!is.null(results$warning)) {
        cat("\n", results$warning, "\n")
      }
    })

    # Render the plot of contributions to the chi-square statistic
    output$contribution_plot <- renderPlot({
      results <- test_results()
      req(!is.null(results) && is.null(results$error))

      df_contrib <- data.frame(
        Category = factor(1:length(results$observed)),
        Contribution = results$residuals^2
      )

      ggplot(df_contrib, aes(x = Category, y = Contribution, fill = Category)) +
        geom_bar(stat = "identity", color = "black") +
        labs(x = "Category", y = "Contribution to χ² Statistic",
             title = "Each Bar Shows (O-E)²/E") +
        theme_minimal() +
        theme(legend.position = "none", plot.title = element_text(hjust = 0.5))
    })

    # Render the plot of the chi-square distribution
    output$chi_square_dist_plot <- renderPlot({
      results <- test_results()
      req(!is.null(results) && is.null(results$error))

      df <- results$df
      stat <- results$statistic

      # Create a sequence for the x-axis
      x_max <- max(qchisq(0.999, df), stat * 1.2)
      x_vals <- seq(0, x_max, length.out = 400)
      y_vals <- dchisq(x_vals, df)

      plot_data <- data.frame(x = x_vals, y = y_vals)

      # Create data for the shaded p-value area
      shade_data <- subset(plot_data, x >= stat)

      ggplot(plot_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", size = 1) +
        geom_area(data = shade_data, aes(x = x, y = y), fill = "#fbbf24", alpha = 0.6) +
        geom_vline(xintercept = stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        labs(x = "Chi-Square Value", y = "Density",
             title = sprintf("df = %d, p-value = %.4f", df, results$p.value)) +
        annotate("text", x = stat, y = 0, label = sprintf("χ² = %.2f", stat), vjust = 1.5, hjust = if(stat > x_max/2) 1.1 else -0.1) +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5))
    })
  })
}
