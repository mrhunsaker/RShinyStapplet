# StappletSHiny/ht_diff_proportions.R

# UI function for the 'Hypothesis Test for a Difference in Proportions' applet
ht_diff_proportions_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Hypothesis Test for a Difference in Proportions (Two-Proportion z-Test)", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Difference in Proportions"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",
        h3("Test Parameters", id = "paramsHeading"),

        # Sample 1 Inputs
        h4("Sample 1", style = "color: #1d4ed8;"),
        div(
          class = "form-group",
          tags$label(id = ns("s1_success_label"), "Number of Successes (x1):"),
          htmltools::tagQuery(
            numericInput(ns("s1_success"), NULL, value = 50, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("s1_success_label"))$all()
        ),
        div(
          class = "form-group",
          tags$label(id = ns("s1_total_label"), "Total Sample Size (n1):"),
          htmltools::tagQuery(
            numericInput(ns("s1_total"), NULL, value = 100, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("s1_total_label"))$all()
        ),

        # Sample 2 Inputs
        h4("Sample 2", style = "color: #1d4ed8;"),
        div(
          class = "form-group",
          tags$label(id = ns("s2_success_label"), "Number of Successes (x2):"),
          htmltools::tagQuery(
            numericInput(ns("s2_success"), NULL, value = 40, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("s2_success_label"))$all()
        ),
        div(
          class = "form-group",
          tags$label(id = ns("s2_total_label"), "Total Sample Size (n2):"),
          htmltools::tagQuery(
            numericInput(ns("s2_total"), NULL, value = 100, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("s2_total_label"))$all()
        ),

        hr(role = "separator"),
        h3("Hypothesis"),
        p("Null Hypothesis (H\u2080): p\u2081 - p\u2082 = 0"),
        # Alternative Hypothesis
        div(
          class = "form-group",
          tags$label(id = ns("alternative_label"), "Alternative Hypothesis (H\u2090):"),
          htmltools::tagQuery(
            radioButtons(ns("alternative"), NULL,
                         choices = c("p\u2081 - p\u2082 \u2260 0" = "two.sided",
                                     "p\u2081 - p\u2082 > 0" = "greater",
                                     "p\u2081 - p\u2082 < 0" = "less"),
                         selected = "two.sided")
          )$find("fieldset")$addAttrs("aria-labelledby" = ns("alternative_label"))$all()
        ),
        actionButton(ns("run_test"), "Run Hypothesis Test", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
            h4("Sampling Distribution of p\u0302\u2081 - p\u0302\u2082 under H\u2080", style = "text-align: center;", id = ns("testPlot_label")),
            htmltools::tagQuery(
                plotOutput(ns("testPlot"), height = "300px")
            )$find("img")$addAttrs("aria-labelledby" = ns("testPlot_label"))$all()
        ),
        div(class = "results-box",
            h3("Test Results"),
            uiOutput(ns("resultsOutput"))
        )
      )
    )
  )
}

# Server function for the 'Hypothesis Test for a Difference in Proportions' applet
ht_diff_proportions_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive to store validation messages
    validation_results <- reactive({
      msg <- ""
      if (!is.null(input$s1_success) && !is.null(input$s1_total) && input$s1_success > input$s1_total) {
        msg <- "Error: Number of successes (x1) cannot be greater than the sample size (n1)."
      } else if (!is.null(input$s2_success) && !is.null(input$s2_total) && input$s2_success > input$s2_total) {
        msg <- "Error: Number of successes (x2) cannot be greater than the sample size (n2)."
      }
      return(msg)
    })

    # Perform the hypothesis test when the button is clicked
    test_results <- eventReactive(input$run_test, {
      # Require all inputs to be valid
      req(input$s1_success, input$s1_total, input$s2_success, input$s2_total,
          input$s1_success <= input$s1_total,
          input$s2_success <= input$s2_total)

      x <- c(input$s1_success, input$s2_success)
      n <- c(input$s1_total, input$s2_total)

      # Check success/failure conditions for normal approximation
      p_hat1 <- x[1] / n[1]
      p_hat2 <- x[2] / n[2]
      cond1 <- n[1] * p_hat1 >= 10 && n[1] * (1 - p_hat1) >= 10
      cond2 <- n[2] * p_hat2 >= 10 && n[2] * (1 - p_hat2) >= 10
      conditions_met <- cond1 && cond2

      # Use prop.test for calculation
      test <- prop.test(x, n, alternative = input$alternative, correct = FALSE) # correct=FALSE for standard z-test

      # Manual calculation for z-statistic visualization
      p_hat_pooled <- sum(x) / sum(n)
      se_pooled <- sqrt(p_hat_pooled * (1 - p_hat_pooled) * (1/n[1] + 1/n[2]))
      z_stat <- (p_hat1 - p_hat2) / se_pooled

      list(
        p_hat1 = p_hat1,
        p_hat2 = p_hat2,
        p_hat_pooled = p_hat_pooled,
        z_stat = z_stat,
        p_value = test$p.value,
        alternative = input$alternative,
        conditions_met = conditions_met
      )
    })

    # Render the plot of the test
    output$testPlot <- renderPlot({
      results <- test_results()
      z_stat <- results$z_stat
      alternative <- results$alternative

      # Create a data frame for the standard normal curve
      curve_data <- data.frame(x = seq(-4, 4, length.out = 400))
      curve_data$y <- dnorm(curve_data$x)

      p <- ggplot(curve_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", size = 1) +
        labs(title = paste("Z-statistic =", round(z_stat, 3), " | p-value =", format.pval(results$p_value, digits = 3)),
             x = "Z-score", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))

      # Shade the p-value area
      if (alternative == "less") {
        shade_data <- subset(curve_data, x <= z_stat)
        p <- p + geom_area(data = shade_data, aes(y = y), fill = "#60a5fa", alpha = 0.6)
      } else if (alternative == "greater") {
        shade_data <- subset(curve_data, x >= z_stat)
        p <- p + geom_area(data = shade_data, aes(y = y), fill = "#60a5fa", alpha = 0.6)
      } else { # two.sided
        shade_data1 <- subset(curve_data, x <= -abs(z_stat))
        shade_data2 <- subset(curve_data, x >= abs(z_stat))
        p <- p + geom_area(data = shade_data1, aes(y = y), fill = "#60a5fa", alpha = 0.6) +
                 geom_area(data = shade_data2, aes(y = y), fill = "#60a5fa", alpha = 0.6)
      }

      # Add a line for the z-statistic
      p <- p + geom_vline(xintercept = z_stat, color = "#dc2626", linetype = "dashed", size = 1.2)

      print(p)
    })

    # Render the results text
    output$resultsOutput <- renderUI({
      # Display validation error if it exists
      error_msg <- validation_results()
      if (nchar(error_msg) > 0) {
        return(tags$p(error_msg, style = "color: red; font-weight: bold;"))
      }

      # Wait for the button to be clicked
      req(input$run_test)

      results <- test_results()
      alpha <- 0.05 # Standard significance level

      # Conclusion text
      if (results$p_value < alpha) {
        conclusion <- paste0("Since the p-value (", format.pval(results$p_value, digits = 4), ") is less than \u03B1 = ", alpha, ", we reject the null hypothesis. There is significant evidence to suggest that the true population proportions are different.")
      } else {
        conclusion <- paste0("Since the p-value (", format.pval(results$p_value, digits = 4), ") is greater than \u03B1 = ", alpha, ", we fail to reject the null hypothesis. There is not enough evidence to suggest that the true population proportions are different.")
      }

      # Conditions warning
      conditions_warning <- ""
      if (!results$conditions_met) {
        conditions_warning <- "Warning: The success/failure condition (at least 10 successes and 10 failures in each group) is not met. The results of the z-test may not be reliable."
      }

      tagList(
        tags$table(class = "table table-striped",
          tags$tr(
            tags$th("Statistic"),
            tags$th("Value")
          ),
          tags$tr(
            tags$td("Sample 1 Proportion (p\u0302\u2081)"),
            tags$td(round(results$p_hat1, 4))
          ),
          tags$tr(
            tags$td("Sample 2 Proportion (p\u0302\u2082)"),
            tags$td(round(results$p_hat2, 4))
          ),
          tags$tr(
            tags$td("Pooled Proportion (p\u0302)"),
            tags$td(round(results$p_hat_pooled, 4))
          ),
          tags$tr(
            tags$td("Z-statistic"),
            tags$td(round(results$z_stat, 3))
          ),
          tags$tr(
            tags$td("P-value"),
            tags$td(format.pval(results$p_value, digits = 4, eps = 0.0001))
          )
        ),
        hr(),
        h4("Conclusion"),
        p(conclusion),
        if (nchar(conditions_warning) > 0) {
          p(strong(conditions_warning), style = "color: #d9534f;")
        }
      )
    })

  })
}
