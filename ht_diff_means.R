# StappletSHiny/ht_diff_means.R

# UI function for the 'Hypothesis Test for a Difference in Population Means' applet
ht_diff_means_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Hypothesis Test for a Difference in Means (Two-Sample t-Test)"),
      windowTitle = "Hypothesis Test for a Difference in Means"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        h3("Data Input Method"),
        radioButtons(ns("input_type"), "Choose how to provide data:",
                     choices = c("Enter Summary Statistics" = "summary",
                                 "Paste Raw Data" = "raw"),
                     selected = "summary"),
        hr(role = "separator"),

        # --- Conditional UI for Summary Statistics ---
        conditionalPanel(
          condition = "input.input_type == 'summary'", ns = ns,
          h4("Group 1 Summary"),
          numericInput(ns("mean1"), "Sample Mean (x̄₁)", value = 22, min = 0),
          numericInput(ns("sd1"), "Sample SD (s₁)", value = 5, min = 0),
          numericInput(ns("n1"), "Sample Size (n₁)", value = 30, min = 2),
          hr(),
          h4("Group 2 Summary"),
          numericInput(ns("mean2"), "Sample Mean (x̄₂)", value = 20, min = 0),
          numericInput(ns("sd2"), "Sample SD (s₂)", value = 4, min = 0),
          numericInput(ns("n2"), "Sample Size (n₂)", value = 35, min = 2)
        ),

        # --- Conditional UI for Raw Data ---
        conditionalPanel(
          condition = "input.input_type == 'raw'", ns = ns,
          h4("Group 1 Data"),
          textAreaInput(ns("raw1"), "Paste data (one value per line)",
                        value = "25\n20\n23\n28\n19\n24\n26", rows = 5),
          hr(),
          h4("Group 2 Data"),
          textAreaInput(ns("raw2"), "Paste data (one value per line)",
                        value = "18\n21\n22\n19\n17\n20\n23", rows = 5)
        ),

        hr(role = "separator"),
        h3("Hypothesis Test Parameters"),
        numericInput(ns("h0_diff"), "Null Hypothesis (μ₁ - μ₂)", value = 0),
        selectInput(ns("alternative"), "Alternative Hypothesis",
                    choices = c("Two-sided (μ₁ ≠ μ₂)" = "two.sided",
                                "Greater than (μ₁ > μ₂)" = "greater",
                                "Less than (μ₁ < μ₂)" = "less")),
        sliderInput(ns("conf_level"), "Confidence Level for CI", min = 0.80, max = 0.99, value = 0.95, step = 0.01),
        checkboxInput(ns("pooled"), "Assume equal variances (use pooled SE)?", value = FALSE)
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        fluidRow(
          column(6,
            div(class = "plot-container",
              h4("Data Visualization", style = "text-align: center;", id = ns("dataPlot_label")),
              htmltools::tagQuery(
                plotOutput(ns("dataPlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("dataPlot_label"))$all()
            )
          ),
          column(6,
            div(class = "plot-container",
              h4("Test Distribution", style = "text-align: center;", id = ns("testPlot_label")),
              htmltools::tagQuery(
                plotOutput(ns("testPlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("testPlot_label"))$all()
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h3("Test Results", id = ns("testResult_label")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("testResult"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("testResult_label"))$all()
            )
          )
        )
      )
    )
  )
}

# Server function for the 'Hypothesis Test for a Difference in Population Means' applet
ht_diff_means_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to perform the t-test
    test_results <- eventReactive(
      # Re-run when any input changes
      list(input$input_type, input$mean1, input$sd1, input$n1, input$mean2, input$sd2, input$n2,
           input$raw1, input$raw2, input$h0_diff, input$alternative, input$conf_level, input$pooled),
      {
        if (input$input_type == "raw") {
          # --- Raw Data Input ---
          data1 <- as.numeric(na.omit(read.csv(text = input$raw1, header = FALSE)$V1))
          data2 <- as.numeric(na.omit(read.csv(text = input$raw2, header = FALSE)$V1))

          if (length(data1) < 2 || length(data2) < 2) {
            return(list(error = "Please provide at least 2 numeric values for each group."))
          }

          # Use the built-in t.test function
          res <- t.test(x = data1, y = data2,
                        mu = input$h0_diff,
                        alternative = input$alternative,
                        conf.level = input$conf_level,
                        var.equal = input$pooled)

          return(list(
            t_stat = res$statistic,
            df = res$parameter,
            p_value = res$p.value,
            ci = res$conf.int,
            x_bar1 = mean(data1), x_bar2 = mean(data2),
            s1 = sd(data1), s2 = sd(data2),
            n1 = length(data1), n2 = length(data2),
            raw_data = list(data1 = data1, data2 = data2)
          ))

        } else {
          # --- Summary Statistics Input ---
          x_bar1 <- input$mean1; s1 <- input$sd1; n1 <- input$n1
          x_bar2 <- input$mean2; s2 <- input$sd2; n2 <- input$n2

          if (is.na(n1) || is.na(n2) || n1 < 2 || n2 < 2 || is.na(s1) || is.na(s2) || s1 <= 0 || s2 <= 0) {
            return(list(error = "Sample sizes must be >= 2 and standard deviations must be > 0."))
          }

          diff_means <- x_bar1 - x_bar2

          if (input$pooled) {
            # Pooled variance calculation
            df <- n1 + n2 - 2
            s_p_sq <- ((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / df
            se <- sqrt(s_p_sq * (1/n1 + 1/n2))
          } else {
            # Welch-Satterthwaite (unpooled) calculation
            se_term1 <- s1^2 / n1
            se_term2 <- s2^2 / n2
            se <- sqrt(se_term1 + se_term2)
            df <- (se_term1 + se_term2)^2 / ( (se_term1^2 / (n1 - 1)) + (se_term2^2 / (n2 - 1)) )
          }

          t_stat <- (diff_means - input$h0_diff) / se

          p_value <- switch(input$alternative,
            "two.sided" = 2 * pt(abs(t_stat), df, lower.tail = FALSE),
            "greater" = pt(t_stat, df, lower.tail = FALSE),
            "less" = pt(t_stat, df, lower.tail = TRUE)
          )

          alpha <- 1 - input$conf_level
          t_crit <- qt(1 - alpha / 2, df)
          margin_error <- t_crit * se
          ci <- c(diff_means - margin_error, diff_means + margin_error)

          return(list(
            t_stat = t_stat, df = df, p_value = p_value, ci = ci,
            x_bar1 = x_bar1, x_bar2 = x_bar2, s1 = s1, s2 = s2, n1 = n1, n2 = n2
          ))
        }
      }
    )

    # --- Render Plots ---
    output$dataPlot <- renderPlot({
      res <- test_results()
      if (!is.null(res$error)) return(NULL)

      if (input$input_type == "raw" && !is.null(res$raw_data)) {
        df <- data.frame(
          value = c(res$raw_data$data1, res$raw_data$data2),
          group = factor(rep(c("Group 1", "Group 2"), c(res$n1, res$n2)))
        )
        ggplot(df, aes(x = group, y = value, fill = group)) +
          geom_boxplot(alpha = 0.7) +
          labs(x = "Group", y = "Value", title = "Side-by-Side Boxplots") +
          scale_fill_viridis_d(option = "D", end = 0.85) +
          theme_minimal() + theme(legend.position = "none")
      } else {
        # For summary stats, plot means with CI
        df <- data.frame(
          group = c("Group 1", "Group 2"),
          mean = c(res$x_bar1, res$x_bar2),
          se = c(res$s1 / sqrt(res$n1), res$s2 / sqrt(res$n2))
        )
        df$ci_low <- df$mean - 1.96 * df$se
        df$ci_high <- df$mean + 1.96 * df$se

        ggplot(df, aes(x = group, y = mean, color = group)) +
          geom_point(size = 4) +
          geom_errorbar(aes(ymin = ci_low, ymax = ci_high), width = 0.2, size = 1) +
          labs(x = "Group", y = "Mean +/- 1.96*SE", title = "Sample Means and Standard Errors") +
          scale_color_viridis_d(option = "D", end = 0.85) +
          theme_minimal() + theme(legend.position = "none")
      }
    })

    output$testPlot <- renderPlot({
      res <- test_results()
      if (is.null(res) || !is.null(res$error) || is.infinite(res$df)) return(NULL)

      t_stat <- res$t_stat
      df <- res$df

      x_lim <- max(4, abs(t_stat) + 1)
      x_vals <- seq(-x_lim, x_lim, length.out = 500)
      y_vals <- dt(x_vals, df)

      plot_data <- data.frame(x = x_vals, y = y_vals)

      p <- ggplot(plot_data, aes(x, y)) +
        geom_line(color = "#1e40af", size = 1) +
        labs(title = paste0("t-Distribution with df = ", round(df, 2)),
             x = "t-statistic", y = "Density") +
        geom_vline(xintercept = t_stat, color = "#dc2626", linetype = "dashed", size = 1.2) +
        theme_minimal()

      # Shading for p-value
      if (input$alternative == "two.sided") {
        p <- p + geom_area(data = subset(plot_data, x >= abs(t_stat)), aes(y = y), fill = "#ef4444", alpha = 0.5) +
                 geom_area(data = subset(plot_data, x <= -abs(t_stat)), aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else if (input$alternative == "greater") {
        p <- p + geom_area(data = subset(plot_data, x >= t_stat), aes(y = y), fill = "#ef4444", alpha = 0.5)
      } else {
        p <- p + geom_area(data = subset(plot_data, x <= t_stat), aes(y = y), fill = "#ef4444", alpha = 0.5)
      }
      p
    })

    # --- Render Results ---
    output$testResult <- renderPrint({
      res <- test_results()
      if (is.null(res)) return(cat("Enter data and parameters to see results."))
      if (!is.null(res$error)) return(cat(res$error))

      cat("--- Test Summary ---\n")
      cat("Null Hypothesis (H₀): μ₁ - μ₂ =", input$h0_diff, "\n")
      alt_symbol <- switch(input$alternative, "two.sided" = "≠", "greater" = ">", "less" = "<")
      cat("Alternative (Hₐ):   μ₁ - μ₂", alt_symbol, input$h0_diff, "\n")
      cat("Test Type: Two-sample t-test", ifelse(input$pooled, "(pooled)", "(Welch)"), "\n\n")

      cat("--- Results ---\n")
      cat("t-statistic:", round(res$t_stat, 4), "\n")
      cat("Degrees of Freedom (df):", round(res$df, 4), "\n")
      cat("P-value:", format.pval(res$p_value, digits = 4, eps = 0.0001), "\n\n")

      cat(paste0("--- ", input$conf_level * 100, "% Confidence Interval for μ₁ - μ₂ ---\n"))
      cat("(", round(res$ci[1], 4), ", ", round(res$ci[2], 4), ")\n\n")

      cat("--- Sample Statistics ---\n")
      cat(sprintf("%-10s %-10s %-10s %-10s\n", "Group", "Mean", "Std Dev", "Size"))
      cat(sprintf("%-10s %-10.3f %-10.3f %-10d\n", "Group 1", res$x_bar1, res$s1, res$n1))
      cat(sprintf("%-10s %-10.3f %-10.3f %-10d\n", "Group 2", res$x_bar2, res$s2, res$n2))
    })
  })
}
