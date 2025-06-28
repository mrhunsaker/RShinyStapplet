# StappletSHiny/ci_diff_means.R

# UI function for the 'Confidence Interval for a Difference in Means' applet
ci_diff_means_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Confidence Interval for a Difference in Population Means (μ₁ - μ₂)", id = "appTitle"),
      windowTitle = "CI for a Difference in Means"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",

        h3("Data Input", id = "paramsHeading"),
        # Radio buttons to select data input method
        radioButtons(ns("input_method"), "Select Input Method:",
                     choices = c("Enter Raw Data" = "raw", "Enter Summary Statistics" = "summary"),
                     selected = "raw"),

        hr(role = "separator"),

        # Conditional panel for raw data input
        conditionalPanel(
          condition = "input.input_method == 'raw'",
          ns = ns,
          div(class = "form-group",
              tags$label(id = ns("data1_label"), "Data for Group 1 (comma-separated):"),
              htmltools::tagQuery(
                textAreaInput(ns("data1"), NULL, "23, 25, 28, 22, 26, 29, 24", rows = 3)
              )$find("textarea")$addAttrs("aria-labelledby" = ns("data1_label"))$all()
          ),
          div(class = "form-group",
              tags$label(id = ns("data2_label"), "Data for Group 2 (comma-separated):"),
              htmltools::tagQuery(
                textAreaInput(ns("data2"), NULL, "18, 20, 22, 19, 21, 23, 17", rows = 3)
              )$find("textarea")$addAttrs("aria-labelledby" = ns("data2_label"))$all()
          )
        ),

        # Conditional panel for summary statistics input
        conditionalPanel(
          condition = "input.input_method == 'summary'",
          ns = ns,
          h4("Group 1 Statistics"),
          numericInput(ns("n1"), "Sample Size (n₁):", value = 30, min = 2),
          numericInput(ns("mean1"), "Sample Mean (x̄₁):", value = 105),
          numericInput(ns("sd1"), "Sample SD (s₁):", value = 10, min = 0),
          hr(),
          h4("Group 2 Statistics"),
          numericInput(ns("n2"), "Sample Size (n₂):", value = 35, min = 2),
          numericInput(ns("mean2"), "Sample Mean (x̄₂):", value = 100),
          numericInput(ns("sd2"), "Sample SD (s₂):", value = 8, min = 0)
        ),

        hr(role = "separator"),
        h3("Confidence Interval Parameters"),
        # Slider for confidence level
        div(class = "form-group",
            tags$label(id = ns("conf_level_label"), "Confidence Level:"),
            htmltools::tagQuery(
              sliderInput(ns("conf_level"), NULL, min = 0.80, max = 0.99, value = 0.95, step = 0.01)
            )$find("input")$addAttrs("aria-labelledby" = ns("conf_level_label"))$all()
        ),
        # Checkbox for pooled variance (var.equal)
        checkboxInput(ns("pooled_var"), "Assume equal population variances (pooled t-interval)", value = FALSE),

        actionButton(ns("calculate"), "Calculate Interval", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",

        # Plot for visualizing data and CI
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("ciPlot"), height = "400px")
            )$find("img")$addAttrs("aria-labelledby" = ns("ciPlot_label"))$all(),
            h4("Confidence Interval Plot", id = ns("ciPlot_label"), class = "sr-only")
        ),

        # Results box
        div(class = "results-box",
            h3("Results", id = ns("ciResults_label")),
            htmltools::tagQuery(
                verbatimTextOutput(ns("ciResults"))
            )$find("pre")$addAttrs("aria-labelledby" = ns("ciResults_label"))$all()
        )
      )
    )
  )
}

# Server function for the 'Confidence Interval for a Difference in Means' applet
ci_diff_means_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive value to store the results
    results <- eventReactive(input$calculate, {
      conf_level <- input$conf_level
      pooled <- input$pooled_var

      if (input$input_method == "raw") {
        # --- Raw Data Calculation ---
        req(input$data1, input$data2)

        # Parse data, handle errors
        data1_vec <- try(as.numeric(unlist(strsplit(input$data1, "[,\\s]+"))), silent = TRUE)
        data2_vec <- try(as.numeric(unlist(strsplit(input$data2, "[,\\s]+"))), silent = TRUE)

        if (inherits(data1_vec, "try-error") || any(is.na(data1_vec)) || length(data1_vec) < 2) {
          return(list(error = "Invalid data for Group 1. Please enter at least two comma-separated numbers."))
        }
        if (inherits(data2_vec, "try-error") || any(is.na(data2_vec)) || length(data2_vec) < 2) {
          return(list(error = "Invalid data for Group 2. Please enter at least two comma-separated numbers."))
        }

        # Perform t-test
        test_result <- t.test(x = data1_vec, y = data2_vec, conf.level = conf_level, var.equal = pooled)

        return(list(
          result = test_result,
          data = data.frame(
            value = c(data1_vec, data2_vec),
            group = factor(rep(c("Group 1", "Group 2"), c(length(data1_vec), length(data2_vec))))
          )
        ))

      } else {
        # --- Summary Statistics Calculation ---
        req(input$n1, input$mean1, input$sd1, input$n2, input$mean2, input$sd2)
        if (input$n1 < 2 || input$n2 < 2 || input$sd1 < 0 || input$sd2 < 0) {
          return(list(error = "Sample sizes must be at least 2 and standard deviations must be non-negative."))
        }

        n1 <- input$n1; m1 <- input$mean1; s1 <- input$sd1
        n2 <- input$n2; m2 <- input$mean2; s2 <- input$sd2

        diff_mean <- m1 - m2
        alpha <- 1 - conf_level

        if (pooled) {
          # Pooled variance calculation
          df <- n1 + n2 - 2
          sp_sq <- ((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / df
          se <- sqrt(sp_sq * (1/n1 + 1/n2))
        } else {
          # Welch-Satterthwaite calculation
          se_sq1 <- s1^2 / n1
          se_sq2 <- s2^2 / n2
          se <- sqrt(se_sq1 + se_sq2)
          df <- (se_sq1 + se_sq2)^2 / ( (se_sq1^2 / (n1 - 1)) + (se_sq2^2 / (n2 - 1)) )
        }

        t_star <- qt(1 - alpha / 2, df)
        margin_error <- t_star * se

        lower_bound <- diff_mean - margin_error
        upper_bound <- diff_mean + margin_error

        # Mimic t.test object structure
        return(list(
          result = list(
            estimate = c("mean of x" = m1, "mean of y" = m2),
            conf.int = c(lower_bound, upper_bound),
            parameter = c("df" = df),
            method = if(pooled) "Two Sample t-test (pooled)" else "Welch Two Sample t-test"
          ),
          data = NULL # No raw data for plotting
        ))
      }
    })

    # Render the plot
    output$ciPlot <- renderPlot({
      res <- results()
      req(res)
      if (!is.null(res$error)) return(NULL)

      # Plot 1: Boxplots (only if raw data is available)
      p1 <- if (!is.null(res$data)) {
        ggplot(res$data, aes(x = group, y = value, fill = group)) +
          geom_boxplot(alpha = 0.7) +
          labs(title = "Data Distribution by Group", x = "Group", y = "Value") +
          scale_fill_manual(values = c("Group 1" = "#60a5fa", "Group 2" = "#84cc16")) +
          theme_minimal() +
          theme(legend.position = "none")
      } else {
        ggplot() + theme_void() + labs(title = "Data plot not available for summary statistics")
      }

      # Plot 2: Confidence Interval
      ci <- res$result$conf.int
      diff_mean <- res$result$estimate[1] - res$result$estimate[2]
      df_ci <- data.frame(
        estimate = diff_mean,
        lower = ci[1],
        upper = ci[2]
      )

      p2 <- ggplot(df_ci, aes(y = 1)) +
        geom_errorbarh(aes(xmin = lower, xmax = upper), height = 0.2, size = 1.5, color = "#1e40af") +
        geom_point(aes(x = estimate), size = 5, color = "#dc2626") +
        labs(
          title = paste0(input$conf_level * 100, "% Confidence Interval for Difference in Means"),
          x = "Difference (Group 1 - Group 2)",
          y = ""
        ) +
        theme_minimal() +
        theme(axis.text.y = element_blank(), axis.ticks.y = element_blank(), panel.grid.major.y = element_blank())

      # Combine plots
      gridExtra::grid.arrange(p1, p2, ncol = 1, heights = c(2, 1))
    })

    # Render the results text
    output$ciResults <- renderPrint({
      res <- results()
      req(res)

      if (!is.null(res$error)) {
        cat(res$error)
      } else {
        test_res <- res$result
        conf_level <- input$conf_level * 100
        diff_mean <- test_res$estimate[1] - test_res$estimate[2]
        ci <- test_res$conf.int
        margin_error <- (ci[2] - ci[1]) / 2

        cat(paste0("Method: ", test_res$method, "\n\n"))
        cat(paste0(conf_level, "% Confidence Interval for μ₁ - μ₂:\n"))
        cat(sprintf("  [%.4f, %.4f]\n\n", ci[1], ci[2]))

        cat("Point Estimate (x̄₁ - x̄₂): ", sprintf("%.4f\n", diff_mean))
        cat("Margin of Error: ", sprintf("%.4f\n", margin_error))
        cat("Degrees of Freedom: ", sprintf("%.3f\n", test_res$parameter["df"]))
      }
    })
  })
}
