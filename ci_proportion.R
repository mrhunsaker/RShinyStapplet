# StappletSHiny/ci_proportion.R

# UI function for the 'Confidence Interval for a Population Proportion' applet
ci_proportion_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Confidence Interval for a Population Proportion", id = "appTitle"),
      windowTitle = "CI for a Population Proportion"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",

        h3("Interval Parameters", id = "paramsHeading"),
        # Input for number of successes
        div(
          class = "form-group",
          tags$label(id = ns("successes_label"), "Number of Successes (x):"),
          htmltools::tagQuery(
            numericInput(ns("successes"), NULL, value = 45, min = 0, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("successes_label"))$all()
        ),
        # Input for number of trials
        div(
          class = "form-group",
          tags$label(id = ns("trials_label"), "Number of Trials (n):"),
          htmltools::tagQuery(
            numericInput(ns("trials"), NULL, value = 100, min = 1, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("trials_label"))$all()
        ),
        # Slider for confidence level
        div(
          class = "form-group",
          tags$label(id = ns("conf_level_label"), "Confidence Level (%):"),
          htmltools::tagQuery(
            sliderInput(ns("conf_level"), NULL, min = 80, max = 99.9, value = 95, step = 0.1)
          )$find("input")$addAttrs("aria-labelledby" = ns("conf_level_label"))$all()
        ),
        # Action button to trigger calculation
        actionButton(ns("calculate"), "Calculate Interval", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Plot Output
        div(class = "plot-container",
          h4("Confidence Interval Visualization", style = "text-align: center;", id = ns("ciPlot_label")),
          htmltools::tagQuery(
            plotOutput(ns("ciPlot"), height = "200px")
          )$find("img")$addAttrs("aria-labelledby" = ns("ciPlot_label"))$all()
        ),
        # Results Box
        div(class = "results-box",
          h3("Calculation Results", id = ns("resultsText_label")),
          htmltools::tagQuery(
            uiOutput(ns("resultsText"))
          )$find("output")$addAttrs("aria-labelledby" = ns("resultsText_label"))$all()
        )
      )
    )
  )
}

# Server function for the 'Confidence Interval for a Population Proportion' applet
ci_proportion_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Use eventReactive to trigger calculations only when the button is pressed
    calc_results <- eventReactive(input$calculate, {
      # Input validation
      req(input$successes, input$trials)
      if (input$successes > input$trials) {
        showNotification("Error: Number of successes (x) cannot be greater than the number of trials (n).", type = "error")
        return(NULL)
      }
      if (input$successes < 0 || input$trials <= 0) {
        showNotification("Error: Please enter non-negative successes and positive trials.", type = "error")
        return(NULL)
      }

      # Perform calculations
      x <- input$successes
      n <- input$trials
      conf_level <- input$conf_level / 100
      p_hat <- x / n
      alpha <- 1 - conf_level
      z_star <- qnorm(1 - alpha / 2)

      # Check conditions for z-interval
      condition_check <- (n * p_hat >= 10) && (n * (1 - p_hat) >= 10)

      se <- sqrt(p_hat * (1 - p_hat) / n)
      moe <- z_star * se
      ci_lower <- p_hat - moe
      ci_upper <- p_hat + moe

      # Create interpretation text
      interpretation <- paste0("We are ", input$conf_level, "% confident that the true population proportion of successes lies between ",
                               sprintf("%.4f", ci_lower), " and ", sprintf("%.4f", ci_upper), ".")

      # Return a list of results
      list(
        p_hat = p_hat,
        z_star = z_star,
        se = se,
        moe = moe,
        ci_lower = ci_lower,
        ci_upper = ci_upper,
        interpretation = interpretation,
        condition_check = condition_check,
        condition_text = if(condition_check) "The Large Counts Condition (np >= 10 and n(1-p) >= 10) is met." else "Warning: The Large Counts Condition is not met. The z-interval may not be reliable."
      )
    })

    # Render the confidence interval plot
    output$ciPlot <- renderPlot({
      results <- calc_results()
      req(results)

      df_plot <- data.frame(
        p_hat = results$p_hat,
        lower = results$ci_lower,
        upper = results$ci_upper
      )

      ggplot(df_plot, aes(x = p_hat, y = 1)) +
        geom_errorbarh(aes(xmin = lower, xmax = upper), height = 0.1, size = 1.5, color = "#1e40af") +
        geom_point(size = 5, color = "#dc2626") +
        labs(
          title = bquote("Point Estimate (" * hat(p) * ") and Confidence Interval"),
          x = "Proportion",
          y = NULL
        ) +
        theme_minimal() +
        theme(
          axis.text.y = element_blank(),
          axis.ticks.y = element_blank(),
          panel.grid.major.y = element_blank(),
          panel.grid.minor.y = element_blank(),
          plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
          axis.title = element_text(size = 12)
        ) +
        scale_x_continuous(limits = c(0, 1))
    })

    # Render the results text
    output$resultsText <- renderUI({
      results <- calc_results()
      req(results)

      # Add a warning style if condition is not met
      condition_style <- if (!results$condition_check) "color: #b91c1c; font-weight: bold;" else ""

      tagList(
        tags$p(strong("Sample Proportion (", HTML("&pcirc;"), "): "), sprintf("%.4f", results$p_hat)),
        tags$hr(),
        tags$p(strong("Critical Value (z*): "), sprintf("%.3f", results$z_star)),
        tags$p(strong("Standard Error (SE): "), sprintf("%.4f", results$se)),
        tags$p(strong("Margin of Error (ME): "), sprintf("%.4f", results$moe)),
        tags$hr(),
        tags$p(strong("Confidence Interval: "), paste0("[", sprintf("%.4f", results$ci_lower), ", ", sprintf("%.4f", results$ci_upper), "]")),
        tags$hr(),
        tags$p(strong("Interpretation: "), results$interpretation),
        tags$p(em(results$condition_text), style = condition_style)
      )
    })

  })
}
