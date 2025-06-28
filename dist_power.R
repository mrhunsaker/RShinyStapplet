# dist_power.R

library(shiny)
library(ggplot2)
library(dplyr)

# UI for the Power of a Significance Test Applet
dist_power_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title
    h2("Power of a Significance Test"),
    p("Explore the concept of statistical power by visualizing the relationship between the null and alternative hypotheses, the significance level (α), and the Type II error rate (β)."),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        h3("Test Parameters"),
        # Inputs for hypotheses
        div(class = "form-group",
            tags$label("Null Hypothesis Mean (μ₀):", `for` = ns("mu0")),
            numericInput(ns("mu0"), label = NULL, value = 100),
            tags$p(id = ns("mu0_desc"), class = "sr-only", "Enter the mean of the null hypothesis, mu-zero."),
            tags$script(paste0("document.getElementById('", ns("mu0"), "').setAttribute('aria-describedby', '", ns("mu0_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Alternative Hypothesis Mean (μₐ):", `for` = ns("mua")),
            numericInput(ns("mua"), label = NULL, value = 105),
            tags$p(id = ns("mua_desc"), class = "sr-only", "Enter the mean of the alternative hypothesis, mu-a."),
            tags$script(paste0("document.getElementById('", ns("mua"), "').setAttribute('aria-describedby', '", ns("mua_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Alternative Hypothesis:", `for` = ns("alternative")),
            selectInput(ns("alternative"), label = NULL,
                        choices = c("μ > μ₀ (Right-tailed)" = "greater",
                                    "μ < μ₀ (Left-tailed)" = "less",
                                    "μ ≠ μ₀ (Two-tailed)" = "two.sided")),
            tags$p(id = ns("alt_desc"), class = "sr-only", "Select the direction of the alternative hypothesis."),
            tags$script(paste0("document.getElementById('", ns("alternative"), "').setAttribute('aria-describedby', '", ns("alt_desc"), "')"))
        ),
        hr(),
        # Inputs for sample and population
        div(class = "form-group",
            tags$label("Population SD (σ):", `for` = ns("sigma")),
            numericInput(ns("sigma"), label = NULL, value = 15, min = 0.1),
            tags$p(id = ns("sigma_desc"), class = "sr-only", "Enter the population standard deviation, sigma."),
            tags$script(paste0("document.getElementById('", ns("sigma"), "').setAttribute('aria-describedby', '", ns("sigma_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Sample Size (n):", `for` = ns("n")),
            numericInput(ns("n"), label = NULL, value = 30, min = 2, step = 1),
            tags$p(id = ns("n_desc"), class = "sr-only", "Enter the sample size, n."),
            tags$script(paste0("document.getElementById('", ns("n"), "').setAttribute('aria-describedby', '", ns("n_desc"), "')"))
        ),
        hr(),
        # Input for significance level
        div(class = "form-group",
            tags$label("Significance Level (α):", `for` = ns("alpha")),
            sliderInput(ns("alpha"), label = NULL, min = 0.01, max = 0.20, value = 0.05, step = 0.01),
            tags$p(id = ns("alpha_desc"), class = "sr-only", "Adjust the significance level, alpha, for the test."),
            tags$script(paste0("document.getElementById('", ns("alpha"), "').setAttribute('aria-describedby', '", ns("alpha_desc"), "')"))
        )
      ),
      mainPanel(
        # Outputs
        div(class = "plot-container",
            plotOutput(ns("power_plot")),
            tags$script(paste0("document.getElementById('", ns("power_plot"), "').setAttribute('aria-label', 'A plot showing two distributions. The null hypothesis distribution is on the left, and the alternative is on the right. The rejection region (alpha) and Type II error region (beta) are shaded.')")),
            uiOutput(ns("plot_desc"))
        ),
        fluidRow(
          column(6,
            div(class = "results-box", role = "status", `aria-live` = "polite",
              h3("Calculated Values"),
              htmlOutput(ns("power_beta_results"))
            )
          ),
          column(6,
            div(class = "results-box", role = "status", `aria-live` = "polite",
              h3("Critical Value(s)"),
              htmlOutput(ns("critical_value_results"))
            )
          )
        )
      )
    )
  )
}

# Server logic for the Power Applet
dist_power_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive expression for derived calculations
    calculations <- reactive({
      req(input$mu0, input$mua, input$sigma, input$n, input$alpha)
      req(input$sigma > 0, input$n >= 2)

      mu0 <- input$mu0
      mua <- input$mua
      sigma <- input$sigma
      n <- input$n
      alpha <- input$alpha
      alternative <- input$alternative

      se <- sigma / sqrt(n)

      # Calculate critical value(s) based on the null hypothesis
      if (alternative == "greater") {
        cv1 <- qnorm(1 - alpha, mean = mu0, sd = se)
        cv2 <- NA
      } else if (alternative == "less") {
        cv1 <- qnorm(alpha, mean = mu0, sd = se)
        cv2 <- NA
      } else { # two.sided
        cv1 <- qnorm(alpha / 2, mean = mu0, sd = se)
        cv2 <- qnorm(1 - alpha / 2, mean = mu0, sd = se)
      }

      # Calculate Beta (Type II error) and Power based on the alternative hypothesis
      if (alternative == "greater") {
        beta <- pnorm(cv1, mean = mua, sd = se)
      } else if (alternative == "less") {
        beta <- pnorm(cv1, mean = mua, sd = se, lower.tail = FALSE)
      } else { # two.sided
        beta <- pnorm(cv2, mean = mua, sd = se) - pnorm(cv1, mean = mua, sd = se)
      }
      power <- 1 - beta

      list(
        se = se, cv1 = cv1, cv2 = cv2, beta = beta, power = power,
        mu0 = mu0, mua = mua, alpha = alpha, alternative = alternative
      )
    })

    # Render the power plot
    output$power_plot <- renderPlot({
      res <- calculations()

      # Define the x-axis range to show both distributions
      x_min <- min(res$mu0, res$mua) - 4 * res$se
      x_max <- max(res$mu0, res$mua) + 4 * res$se
      x_vals <- seq(x_min, x_max, length.out = 500)

      # Create data frame for plotting
      plot_data <- data.frame(
        x = x_vals,
        null_dist = dnorm(x_vals, mean = res$mu0, sd = res$se),
        alt_dist = dnorm(x_vals, mean = res$mua, sd = res$se)
      )

      p <- ggplot(plot_data, aes(x = x)) +
        # Null and Alternative distribution curves
        geom_line(aes(y = null_dist, color = "Null (H₀)"), size = 1) +
        geom_line(aes(y = alt_dist, color = "Alternative (Hₐ)"), size = 1) +
        labs(
          title = "Distribution of Sample Means under H₀ and Hₐ",
          x = "Sample Mean", y = "Density", color = "Hypothesis"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), legend.position = "bottom")

      # --- Shading Regions ---
      # Shade Alpha (Rejection region under H0)
      if (res$alternative == "greater") {
        p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
      } else if (res$alternative == "less") {
        p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
      } else {
        p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
        p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv2), aes(ymax = null_dist, ymin = 0), fill = "red", alpha = 0.5)
      }

      # Shade Beta (Type II error region under Ha)
      if (res$alternative == "greater") {
        p <- p + geom_ribbon(data = subset(plot_data, x <= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
      } else if (res$alternative == "less") {
        p <- p + geom_ribbon(data = subset(plot_data, x >= res$cv1), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
      } else {
        p <- p + geom_ribbon(data = subset(plot_data, x > res$cv1 & x < res$cv2), aes(ymax = alt_dist, ymin = 0), fill = "orange", alpha = 0.5)
      }

      # Add annotations for Power, Alpha, Beta
      p <- p +
        annotate("text", x = res$mua, y = max(plot_data$alt_dist) * 0.6, label = paste("Power\n", round(res$power, 3)), color = "#006400", size = 5, fontface = "bold") +
        annotate("text", x = res$cv1, y = max(plot_data$null_dist) * 0.8, label = paste("α =", res$alpha), color = "red", size = 5, hjust = if(res$alternative == "greater") -0.2 else 1.2) +
        annotate("text", x = res$mu0, y = max(plot_data$alt_dist) * 0.4, label = paste("β =", round(res$beta, 3)), color = "#E69F00", size = 5, fontface = "bold")

      p
    })

    # Render the power and beta results
    output$power_beta_results <- renderUI({
      res <- calculations()
      tagList(
        p(strong("Power (1 - β):"), round(res$power, 4)),
        p(strong("Type II Error (β):"), round(res$beta, 4))
      )
    })

    # Render the critical value results
    output$critical_value_results <- renderUI({
      res <- calculations()
      if (is.na(res$cv2)) {
        p(strong("Critical Value:"), round(res$cv1, 3))
      } else {
        tagList(
          p(strong("Lower Critical Value:"), round(res$cv1, 3)),
          p(strong("Upper Critical Value:"), round(res$cv2, 3))
        )
      }
    })
  })
}
