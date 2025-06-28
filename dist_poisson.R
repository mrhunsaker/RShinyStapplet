# dist_poisson.R

library(shiny)
library(ggplot2)
library(dplyr)

# UI for the Poisson Distribution Applet
dist_poisson_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title
    h2("Poisson Distribution"),
    p("Visualize a Poisson distribution and calculate probabilities for a given mean."),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        # Input for mean (lambda)
        div(class = "form-group",
            tags$label("Mean (λ):", `for` = ns("lambda")),
            numericInput(ns("lambda"), label = NULL, value = 5, min = 0.1, step = 0.1),
            tags$p(id = ns("lambda_desc"), class = "sr-only", "Enter the average number of events (lambda) for the Poisson distribution. Must be greater than 0."),
            tags$script(paste0("document.getElementById('", ns("lambda"), "').setAttribute('aria-describedby', '", ns("lambda_desc"), "')"))
        ),
        hr(),
        h3("Calculate Probability"),
        p("Find the probability for a given value of X."),
        # Inputs for probability calculation
        div(class = "form-group",
            tags$label("Type of Probability:", `for` = ns("prob_type")),
            selectInput(ns("prob_type"), label = NULL,
                        choices = c("P(X = x)" = "eq",
                                    "P(X < x)" = "lt",
                                    "P(X <= x)" = "le",
                                    "P(X > x)" = "gt",
                                    "P(X >= x)" = "ge")),
            tags$p(id = ns("prob_type_desc"), class = "sr-only", "Select the inequality for the probability calculation."),
            tags$script(paste0("document.getElementById('", ns("prob_type"), "').setAttribute('aria-describedby', '", ns("prob_type_desc"), "')"))
        ),
        div(class = "form-group",
            tags$label("Value of x:", `for` = ns("prob_x_value")),
            numericInput(ns("prob_x_value"), label = NULL, value = 0, min = 0),
            tags$p(id = ns("prob_x_desc"), class = "sr-only", "Enter the specific value of x to use in the probability calculation."),
            tags$script(paste0("document.getElementById('", ns("prob_x_value"), "').setAttribute('aria-describedby', '", ns("prob_x_desc"), "')"))
        ),
      ),
      mainPanel(
        # Outputs
        div(class = "plot-container",
            plotOutput(ns("dist_plot")),
            tags$script(paste0("document.getElementById('", ns("dist_plot"), "').setAttribute('aria-label', 'A bar chart showing the Poisson probability distribution. The area for the calculated probability is highlighted in red.')")),
            uiOutput(ns("plot_desc"))
        ),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h3("Calculated Probability"),
            textOutput(ns("calculated_prob"))
        )
      )
    )
  )
}

# Server logic for the Poisson Distribution Applet
dist_poisson_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive expression for distribution data
    dist_data <- reactive({
      req(input$lambda, input$lambda > 0)
      lambda <- input$lambda

      # Determine a reasonable upper limit for x
      max_x <- qpois(0.9999, lambda)
      if (max_x < 20) max_x <- 20 # Ensure a minimum range
      x_vals <- 0:max_x

      data.frame(
        x = x_vals,
        p = dpois(x_vals, lambda)
      )
    })

    # Generate the probability distribution plot
    output$dist_plot <- renderPlot({
      df <- dist_data()
      req(df, input$prob_x_value >= 0)

      x_val <- floor(input$prob_x_value) # Use integer value for x

      # Add a column for highlighting based on the selected probability type
      df <- df %>%
        mutate(highlight = case_when(
          input$prob_type == "eq" & x == x_val ~ "yes",
          input$prob_type == "lt" & x < x_val ~ "yes",
          input$prob_type == "le" & x <= x_val ~ "yes",
          input$prob_type == "gt" & x > x_val ~ "yes",
          input$prob_type == "ge" & x >= x_val ~ "yes",
          TRUE ~ "no"
        ))

      ggplot(df, aes(x = x, y = p, fill = highlight)) +
        geom_col(alpha = 0.8) +
        scale_fill_viridis_d(option = "D", begin = 0.2, end = 0.8, direction = 1, guide = "none") +
        labs(title = paste("Poisson Distribution with λ =", input$lambda),
             x = "Number of Events (x)",
             y = "Probability P(x)") +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold")
        )
    })

    # Calculate and display the requested probability
    output$calculated_prob <- renderText({
      req(input$lambda, input$lambda > 0, input$prob_x_value >= 0)

      lambda <- input$lambda
      x_val <- floor(input$prob_x_value)
      prob <- 0

      # Calculate probability based on selected type
      prob <- switch(input$prob_type,
        "eq" = dpois(x_val, lambda),
        "lt" = ppois(x_val - 1, lambda),
        "le" = ppois(x_val, lambda),
        "gt" = ppois(x_val, lambda, lower.tail = FALSE),
        "ge" = ppois(x_val - 1, lambda, lower.tail = FALSE)
      )

      # Format the output string
      op_string <- switch(input$prob_type,
        "eq" = "=", "lt" = "<", "le" = "≤", "gt" = ">", "ge" = "≥"
      )

      paste0("P(X ", op_string, " ", x_val, ") = ", round(prob, 5))
    })
  })
}
