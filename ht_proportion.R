# StappletSHiny/ht_proportion.R

# UI function for the 'Hypothesis Test for a Population Proportion' applet
ht_proportion_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Hypothesis Test for a Population Proportion (One-Proportion z-Test)", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Population Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",

        h3("Hypothesis Parameters", id = "paramsHeading"),
        # Null Hypothesis Proportion
        div(
          class = "form-group",
          tags$label(id = ns("p0_label"), "Null Hypothesis Proportion (p\u2080):"),
          htmltools::tagQuery(
            numericInput(ns("p0"), NULL, value = 0.5, min = 0, max = 1, step = 0.01)
          )$find("input")$addAttrs("aria-labelledby" = ns("p0_label"))$all()
        ),
        # Alternative Hypothesis
        div(
          class = "form-group",
          tags$label(id = ns("alternative_label"), "Alternative Hypothesis:"),
          htmltools::tagQuery(
            selectInput(ns("alternative"), NULL,
                        choices = c("Not equal to p\u2080 (Two-sided)" = "two.sided",
                                    "Less than p\u2080 (Left-sided)" = "less",
                                    "Greater than p\u2080 (Right-sided)" = "greater"),
                        selected = "two.sided")
          )$find("select")$addAttrs("aria-labelledby" = ns("alternative_label"))$all()
        ),

        hr(role = "separator"),
        h3("Sample Data"),
        # Number of Successes
        div(
          class = "form-group",
          tags$label(id = ns("successes_label"), "Number of Successes (x):"),
          htmltools::tagQuery(
            numericInput(ns("successes"), NULL, value = 25, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("successes_label"))$all()
        ),
        # Sample Size
        div(
          class = "form-group",
          tags$label(id = ns("n_label"), "Sample Size (n):"),
          htmltools::tagQuery(
            numericInput(ns("n"), NULL, value = 50, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n_label"))$all()
        ),
        # Significance Level
        div(
          class = "form-group",
          tags$label(id = ns("alpha_label"), "Significance Level (\u03B1):"),
          htmltools::tagQuery(
            sliderInput(ns("alpha"), NULL, min = 0.01, max = 0.20, value = 0.05, step = 0.01)
          )$find("input")$addAttrs("aria-labelledby" = ns("alpha_label"))$all()
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("testPlot"), height = "350px")
            )$find("img")$addAttrs(
                role = "img",
                "aria-labelledby" = ns("plotDescription")
            )$all(),
            p(class = "sr-only", role = "status", "aria-live" = "polite", textOutput(ns("plotDescription")))
        ),
        div(class = "results-box",
            h3("Test Results", id = ns("resultsHeading")),
            htmltools::tagQuery(
                uiOutput(ns("results"))
            )$find("output")$addAttrs("aria-labelledby" = ns("resultsHeading"))$all()
        )
      )
    )
  )
}

# Server function for the 'Hypothesis Test for a Population Proportion' applet
ht_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to perform the hypothesis test
    test_results <- reactive({
      req(input$n > 0, input$successes >= 0, input$successes <= input$n)

      p0 <- input$p0
      x <- input$successes
      n <- input$n
      alpha <- input$alpha
      alternative <- input$alternative

      # Check conditions
      expected_successes <- n * p0
      expected_failures <- n * (1 - p0)
      conditions_met <- expected_successes >= 10 && expected_failures >= 10

      # Perform calculations
      p_hat <- x / n
      se <- sqrt(p0 * (1 - p0) / n)
      z_stat <- (p_hat - p0) / se

      # Calculate p-value
      p_value <- switch(alternative,
        "two.sided" = 2 * pnorm(-abs(z_stat)),
        "less" = pnorm(z_stat),
        "greater" = 1 - pnorm(z_stat)
      )

      # Formulate conclusion
      conclusion <- ifelse(p_value < alpha,
                           paste0("Reject the null hypothesis (p-value = ", sprintf("%.4f", p_value), " < \u03B1 = ", alpha, ")."),
                           paste0("Fail to reject the null hypothesis (p-value = ", sprintf("%.4f", p_value), " \u2265 \u03B1 = ", alpha, ").")
      )

      list(
        p0 = p0,
        p_hat = p_hat,
        n = n,
        x = x,
        z_stat = z_stat,
        p_value = p_value,
        alpha = alpha,
        alternative = alternative,
        conditions_met = conditions_met,
        expected_successes = expected_successes,
        expected_failures = expected_failures,
        conclusion = conclusion
      )
    })

    # Render the plot
    output$testPlot <- renderPlot({
      res <- test_results()

      # Create data for the standard normal curve
      curve_data <- data.frame(x = seq(-4, 4, length.out = 400))
      curve_data$y <- dnorm(curve_data$x)

      p <- ggplot(curve_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", size = 1) +
        labs(title = "Normal Distribution of z-statistic under H\u2080",
             x = "z-statistic", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))

      # Shade the p-value area
      shade_data <- switch(res$alternative,
        "less" = subset(curve_data, x <= res$z_stat),
        "greater" = subset(curve_data, x >= res$z_stat),
        "two.sided" = subset(curve_data, x >= abs(res$z_stat) | x <= -abs(res$z_stat))
      )

      p <- p + geom_area(data = shade_data, aes(y = y), fill = "#fbbf24", alpha = 0.6) +
        geom_vline(xintercept = res$z_stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        annotate("text", x = res$z_stat, y = 0, label = paste("z =", round(res$z_stat, 2)), vjust = 1.5, color = "#dc2626", fontface = "bold")

    })


    # Render the results text
    output$results <- renderUI({
      res <- test_results()

      # Format hypotheses
      h0 <- paste0("H\u2080: p = ", res$p0)
      ha <- switch(res$alternative,
        "two.sided" = paste0("H\u2090: p \u2260 ", res$p0),
        "less" = paste0("H\u2090: p < ", res$p0),
        "greater" = paste0("H\u2090: p > ", res$p0)
      )

      # Condition check text
      condition_text <- if (res$conditions_met) {
        paste0("Conditions met: n*p\u2080 = ", round(res$expected_successes, 1), " \u2265 10 and n*(1-p\u2080) = ", round(res$expected_failures, 1), " \u2265 10.")
      } else {
        paste0("Warning: Conditions not met. n*p\u2080 = ", round(res$expected_successes, 1), " or n*(1-p\u2080) = ", round(res$expected_failures, 1), " is less than 10. The z-test may not be reliable.")
      }

      tagList(
        tags$p(strong("Hypotheses:")),
        tags$ul(
          tags$li(h0),
          tags$li(ha)
        ),
        tags$p(strong("Conditions:")),
        tags$p(condition_text, style = if(!res$conditions_met) "color: red;" else ""),
        tags$p(strong("Sample Statistics:")),
        tags$ul(
          tags$li(paste0("Sample Proportion (\u0175): ", round(res$p_hat, 4))),
          tags$li(paste0("Sample Size (n): ", res$n))
        ),
        tags$p(strong("Test Statistic:")),
        tags$ul(
          tags$li(paste0("z-statistic: ", round(res$z_stat, 3))),
          tags$li(paste0("p-value: ", sprintf("%.4f", res$p_value)))
        ),
        tags$p(strong("Conclusion:")),
        tags$p(res$conclusion, style = "font-weight: bold; color: #0f766e;")
      )
    })

    # Screen reader description
    output$plotDescription <- renderText({
      req(test_results())
      res <- test_results()
      paste("A plot of the standard normal distribution showing the results of the one-proportion z-test.",
            "The calculated z-statistic is", round(res$z_stat, 2), ".",
            "The area corresponding to the p-value of", sprintf("%.4f", res$p_value), "is shaded.",
            "The conclusion is to", res$conclusion)
    })

  })
}
