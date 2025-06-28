# StappletSHiny/ht_mean.R

# UI function for the 'Hypothesis Test for a Population Mean' applet
ht_mean_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Hypothesis Test for a Population Mean (t-Test)", id = "appTitle"),
      windowTitle = "Hypothesis Test for a Mean"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "paramsHeading",

        h3("Test Parameters", id = "paramsHeading"),
        # Data Input
        div(
          class = "form-group",
          tags$label(id = ns("data_label"), "Enter Sample Data:"),
          p("Enter numeric data, separated by commas, spaces, or newlines.", class = "text-muted", style = "font-size: 0.9em;"),
          htmltools::tagQuery(
            textAreaInput(ns("sample_data"), NULL,
                          rows = 5,
                          placeholder = "e.g., 25.1, 27.3, 24.8, 26.5, 25.9")
          )$find("textarea")$addAttrs("aria-labelledby" = ns("data_label"))$all()
        ),
        # Null Hypothesis Mean
        div(
          class = "form-group",
          tags$label(id = ns("null_mean_label"), "Null Hypothesis Mean (μ₀):"),
          htmltools::tagQuery(
            numericInput(ns("null_mean"), NULL, value = 25, step = 0.5)
          )$find("input")$addAttrs("aria-labelledby" = ns("null_mean_label"))$all()
        ),
        # Alternative Hypothesis
        div(
          class = "form-group",
          tags$label(id = ns("alt_hyp_label"), "Alternative Hypothesis:"),
          htmltools::tagQuery(
            selectInput(ns("alternative"), NULL,
                        choices = c("Two-sided (μ ≠ μ₀)" = "two.sided",
                                    "Less than (μ < μ₀)" = "less",
                                    "Greater than (μ > μ₀)" = "greater"),
                        selected = "two.sided")
          )$find("select")$addAttrs("aria-labelledby" = ns("alt_hyp_label"))$all()
        ),
        # Significance Level (Alpha)
        div(
          class = "form-group",
          tags$label(id = ns("alpha_label"), "Significance Level (α):"),
          htmltools::tagQuery(
            sliderInput(ns("alpha"), NULL, min = 0.01, max = 0.20, value = 0.05, step = 0.01)
          )$find("input")$addAttrs("aria-labelledby" = ns("alpha_label"))$all()
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Summary and Results
        fluidRow(
          column(6,
            div(class = "results-box",
              h4("Sample Summary", id = ns("summaryStats_label")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("summaryStats"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("summaryStats_label"))$all()
            )
          ),
          column(6,
            div(class = "results-box", style = "background-color: #eef2ff; border-color: #4f46e5; color: #312e81;",
              h4("Hypothesis Test Results", id = ns("testResults_label")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("testResults"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("testResults_label"))$all()
            )
          )
        ),
        # Plot
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("t-Distribution and Test Visualization", style = "text-align: center;", id = ns("distPlot_label")),
              htmltools::tagQuery(
                plotOutput(ns("distPlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("distPlot_label"))$all()
            )
          )
        ),
        # Conclusion
        fluidRow(
          column(12,
            div(class = "results-box", style = "margin-top: 15px; background-color: #fefce8; border-color: #eab308; color: #854d0e;",
              h4("Conclusion", id = ns("conclusion_label")),
              htmltools::tagQuery(
                htmlOutput(ns("conclusion"))
              )$find("div")$addAttrs("aria-labelledby" = ns("conclusion_label"))$all()
            )
          )
        )
      )
    )
  )
}

# Server function for the 'Hypothesis Test for a Population Mean' applet
ht_mean_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to parse and clean the input data
    parsed_data <- reactive({
      req(input$sample_data)
      # Split by commas, spaces, or newlines
      raw_vals <- unlist(strsplit(input$sample_data, "[,\\s\\n]+"))
      # Convert to numeric and remove non-finite values
      numeric_vals <- as.numeric(raw_vals)
      numeric_vals[!is.na(numeric_vals) & is.finite(numeric_vals)]
    })

    # Reactive expression to perform the t-test
    test_output <- reactive({
      data <- parsed_data()
      req(length(data) >= 2) # Need at least 2 data points for a t-test
      req(input$null_mean, input$alternative)

      t.test(data, mu = input$null_mean, alternative = input$alternative)
    })

    # --- Render Outputs ---

    # Sample Summary Statistics
    output$summaryStats <- renderPrint({
      data <- parsed_data()
      if (length(data) < 1) {
        cat("Please enter valid numeric data.")
      } else {
        cat("Sample Size (n): ", length(data), "\n")
        cat("Sample Mean (x̄): ", round(mean(data), 3), "\n")
        cat("Sample SD (s):   ", round(sd(data), 3), "\n")
      }
    })

    # Hypothesis Test Results
    output$testResults <- renderPrint({
      req(test_output())
      res <- test_output()
      cat("t-statistic: ", round(res$statistic, 3), "\n")
      cat("df:          ", round(res$parameter, 2), "\n")
      cat("p-value:     ", format.pval(res$p.value, digits = 4, eps = 0.0001))
    })

    # Conclusion Text
    output$conclusion <- renderUI({
      req(test_output(), input$alpha)
      res <- test_output()
      alpha <- input$alpha

      if (res$p.value < alpha) {
        HTML(paste0("Since the p-value (", format.pval(res$p.value, digits = 3), ") is less than the significance level α = ", alpha,
                    ", we <strong>reject the null hypothesis</strong>. There is statistically significant evidence to support the alternative hypothesis."))
      } else {
        HTML(paste0("Since the p-value (", format.pval(res$p.value, digits = 3), ") is not less than the significance level α = ", alpha,
                    ", we <strong>fail to reject the null hypothesis</strong>. There is not enough statistically significant evidence to support the alternative hypothesis."))
      }
    })

    # Distribution Plot
    output$distPlot <- renderPlot({
      req(test_output(), input$alpha)
      res <- test_output()
      df <- res$parameter
      t_stat <- res$statistic
      alpha <- input$alpha
      alternative <- input$alternative

      # Define plot range
      x_lim <- max(4, abs(t_stat) + 1)
      x_vals <- seq(-x_lim, x_lim, length.out = 400)
      y_vals <- dt(x_vals, df)
      plot_data <- data.frame(x = x_vals, y = y_vals)

      p <- ggplot(plot_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", size = 1) +
        labs(x = "t-score", y = "Density",
             title = paste("t-Distribution with", round(df, 2), "degrees of freedom")) +
        theme_minimal()

      # Shade the rejection region based on alpha
      if (alternative == "two.sided") {
        crit_val <- qt(1 - alpha / 2, df)
        p <- p + geom_area(data = subset(plot_data, x > crit_val | x < -crit_val),
                           aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else if (alternative == "less") {
        crit_val <- qt(alpha, df)
        p <- p + geom_area(data = subset(plot_data, x < crit_val),
                           aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else { # greater
        crit_val <- qt(1 - alpha, df)
        p <- p + geom_area(data = subset(plot_data, x > crit_val),
                           aes(y = y), fill = "#ef4444", alpha = 0.5)
      }

      # Add vertical line for the observed t-statistic
      p <- p + geom_vline(xintercept = t_stat, color = "#16a34a", linetype = "dashed", size = 1.2) +
        annotate("text", x = t_stat, y = max(y_vals) * 0.8,
                 label = paste("Observed t =", round(t_stat, 2)),
                 color = "#16a34a", vjust = -0.5, fontface = "bold")

      p
    })

  })
}
