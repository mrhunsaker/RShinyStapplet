# StappletSHiny/ci_diff_proportions.R

# UI function for the 'Confidence Interval for a Difference in Proportions' applet
ci_diff_proportions_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Confidence Interval for a Difference in Proportions (p₁ - p₂)", id = "appTitle"),
      windowTitle = "CI for a Difference in Proportions"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Sample Data", id = "paramsHeading"),

        # Sample 1 Inputs
        h4("Sample 1", style = "color: #1d4ed8;"),
        div(
          class = "form-group",
          tags$label(id = ns("n1_success_label"), "Number of Successes (x₁):"),
          htmltools::tagQuery(
            numericInput(ns("n1_success"), NULL, value = 50, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n1_success_label"))$all()
        ),
        div(
          class = "form-group",
          tags$label(id = ns("n1_total_label"), "Sample Size (n₁):"),
          htmltools::tagQuery(
            numericInput(ns("n1_total"), NULL, value = 100, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n1_total_label"))$all()
        ),

        hr(role = "separator"),

        # Sample 2 Inputs
        h4("Sample 2", style = "color: #1d4ed8;"),
        div(
          class = "form-group",
          tags$label(id = ns("n2_success_label"), "Number of Successes (x₂):"),
          htmltools::tagQuery(
            numericInput(ns("n2_success"), NULL, value = 40, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n2_success_label"))$all()
        ),
        div(
          class = "form-group",
          tags$label(id = ns("n2_total_label"), "Sample Size (n₂):"),
          htmltools::tagQuery(
            numericInput(ns("n2_total"), NULL, value = 100, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n2_total_label"))$all()
        ),

        hr(role = "separator"),

        # Confidence Level
        h3("Confidence Level"),
        div(
          class = "form-group",
          tags$label(id = ns("conf_level_label"), "Confidence Level:"),
          htmltools::tagQuery(
            sliderInput(ns("conf_level"), NULL, min = 0.80, max = 0.999, value = 0.95, step = 0.001)
          )$find("input")$addAttrs("aria-labelledby" = ns("conf_level_label"))$all()
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("intervalPlot"))
            )$find("img")$addAttrs(
                role = "img",
                "aria-label" = "Plot visualizing the confidence interval for the difference in proportions. A point shows the sample difference, and a horizontal bar represents the interval."
            )$all()
        ),
        div(class = "results-box",
            h3("Calculation Results", id = "resultsHeading"),
            uiOutput(ns("resultsText"), "aria-live" = "polite")
        ),
        div(class = "results-box", style = "margin-top: 20px; background-color: #fffbeb; border-color: #facc15;",
            h3("Conditions for Inference"),
            uiOutput(ns("conditionsText"), "aria-live" = "polite")
        )
      )
    )
  )
}

# Server function for the 'Confidence Interval for a Difference in Proportions' applet
ci_diff_proportions_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to perform calculations
    results <- reactive({
      # Input validation
      req(input$n1_total > 0, input$n2_total > 0)
      req(input$n1_success <= input$n1_total, input$n2_success <= input$n2_total)
      req(input$n1_success >= 0, input$n2_success >= 0)
      req(input$conf_level)

      # Sample statistics
      p_hat1 <- input$n1_success / input$n1_total
      p_hat2 <- input$n2_success / input$n2_total
      diff_p_hat <- p_hat1 - p_hat2

      # Standard Error
      se <- sqrt(p_hat1 * (1 - p_hat1) / input$n1_total + p_hat2 * (1 - p_hat2) / input$n2_total)

      # Critical value (z*)
      alpha <- 1 - input$conf_level
      z_star <- qnorm(1 - alpha / 2)

      # Margin of Error and Confidence Interval
      margin_error <- z_star * se
      lower_bound <- diff_p_hat - margin_error
      upper_bound <- diff_p_hat + margin_error

      # Check conditions (Success-Failure Condition)
      cond1 <- input$n1_success >= 10
      cond2 <- (input$n1_total - input$n1_success) >= 10
      cond3 <- input$n2_success >= 10
      cond4 <- (input$n2_total - input$n2_success) >= 10
      conditions_met <- all(cond1, cond2, cond3, cond4)

      list(
        p_hat1 = p_hat1, p_hat2 = p_hat2, diff_p_hat = diff_p_hat,
        se = se, z_star = z_star, margin_error = margin_error,
        lower_bound = lower_bound, upper_bound = upper_bound,
        conf_level = input$conf_level,
        n1_success = input$n1_success, n1_fail = input$n1_total - input$n1_success,
        n2_success = input$n2_success, n2_fail = input$n2_total - input$n2_success,
        conditions_met = conditions_met
      )
    })

    # Render the plot
    output$intervalPlot <- renderPlot({
      res <- results()
      df_plot <- data.frame(
        estimate = res$diff_p_hat,
        lower = res$lower_bound,
        upper = res$upper_bound
      )

      ggplot(df_plot, aes(x = estimate, y = 1)) +
        geom_vline(xintercept = 0, linetype = "dashed", color = "#dc2626", size = 1) +
        geom_errorbarh(aes(xmin = lower, xmax = upper), height = 0.1, size = 1.5, color = "#1e40af") +
        geom_point(size = 5, color = "#1e40af") +
        labs(
          title = paste0(res$conf_level * 100, "% Confidence Interval for p₁ - p₂"),
          x = "Difference in Proportions (p₁ - p₂)",
          y = NULL
        ) +
        theme_minimal() +
        theme(
          plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
          axis.text.y = element_blank(),
          axis.ticks.y = element_blank(),
          panel.grid.major.y = element_blank(),
          panel.grid.minor.y = element_blank()
        )
    })

    # Render the results text
    output$resultsText <- renderUI({
      res <- results()
      HTML(paste(
        "<b>Sample Proportions:</b>",
        sprintf("  • p̂₁ = %.4f (%d / %d)", res$p_hat1, input$n1_success, input$n1_total),
        sprintf("  • p̂₂ = %.4f (%d / %d)", res$p_hat2, input$n2_success, input$n2_total),
        "<b>Difference in Sample Proportions (p̂₁ - p̂₂):</b>",
        sprintf("  • %.4f", res$diff_p_hat),
        "<b>Standard Error (SE):</b>",
        sprintf("  • %.4f", res$se),
        "<b>Critical Value (z*):</b>",
        sprintf("  • %.3f for a %.1f%% confidence level", res$z_star, res$conf_level * 100),
        "<b>Margin of Error (ME):</b>",
        sprintf("  • z* × SE = %.4f", res$margin_error),
        "<b>Confidence Interval:</b>",
        sprintf("  • (%.4f, %.4f)", res$lower_bound, res$upper_bound),
        "<hr>",
        "<b>Interpretation:</b>",
        paste0("We are ", res$conf_level * 100, "% confident that the true difference in population proportions (p₁ - p₂) is between ",
               sprintf("%.4f", res$lower_bound), " and ", sprintf("%.4f", res$upper_bound), ".")
      , sep = "<br/>"))
    })

    # Render the conditions check
    output$conditionsText <- renderUI({
      res <- results()

      # Helper to create list items with icons
      check_item <- function(label, value, met) {
        icon <- if (met) "✔️" else "❌"
        color <- if (met) "green" else "red"
        sprintf("<li>%s %s = %d (must be ≥ 10)</li>", icon, label, value)
      }

      cond_list <- paste(
        check_item("Successes in Sample 1 (x₁)", res$n1_success, res$n1_success >= 10),
        check_item("Failures in Sample 1 (n₁-x₁)", res$n1_fail, res$n1_fail >= 10),
        check_item("Successes in Sample 2 (x₂)", res$n2_success, res$n2_success >= 10),
        check_item("Failures in Sample 2 (n₂-x₂)", res$n2_fail, res$n2_fail >= 10),
        sep = ""
      )

      status_msg <- if (res$conditions_met) {
        "<p style='color: green; font-weight: bold;'>The Success-Failure condition is met. The resulting confidence interval is reliable.</p>"
      } else {
        "<p style='color: red; font-weight: bold;'>Warning: The Success-Failure condition is not met. The results may not be reliable.</p>"
      }

      HTML(paste0("<ul>", cond_list, "</ul>", status_msg))
    })

  })
}
