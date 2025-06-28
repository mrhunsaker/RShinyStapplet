# dist_discrete_random.R

library(shiny)
library(ggplot2)
library(BrailleR)
library(dplyr)

# UI for the Discrete Random Variable Applet
dist_discrete_random_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title
    h2("Discrete Random Variable"),
    p("Define a discrete probability distribution to calculate its mean, standard deviation, and find probabilities."),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        # Input for number of values
        div(class = "form-group",
            tags$label("Number of distinct values:", `for` = ns("num_values")),
            numericInput(ns("num_values"), label = NULL, value = 5, min = 2, max = 20),
            tags$p(id = ns("num_values_desc"), class = "sr-only", "Enter the total count of unique values in your distribution, from 2 to 20."),
            tags$script(paste0("document.getElementById('", ns("num_values"), "').setAttribute('aria-describedby', '", ns("num_values_desc"), "')"))
        ),
        hr(),
        # Dynamic UI for values and probabilities
        uiOutput(ns("value_prob_inputs")),
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
            numericInput(ns("prob_x_value"), label = NULL, value = 0),
            tags$p(id = ns("prob_x_desc"), class = "sr-only", "Enter the specific value of x to use in the probability calculation."),
            tags$script(paste0("document.getElementById('", ns("prob_x_value"), "').setAttribute('aria-describedby', '", ns("prob_x_desc"), "')"))
        ),
      ),
      mainPanel(
        # Outputs
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h3("Summary Statistics"),
            uiOutput(ns("summary_stats"))
        ),
        div(class = "plot-container",
            plotOutput(ns("dist_plot")),
            tags$script(paste0("document.getElementById('", ns("dist_plot"), "').setAttribute('aria-label', 'A bar chart showing the discrete probability distribution.')")),
            p(id = ns("dist_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("dist_plot_desc_text")))
        ),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h3("Calculated Probability"),
            textOutput(ns("calculated_prob"))
        )
      )
    )
  )
}

# Server logic for the Discrete Random Variable Applet
dist_discrete_random_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Dynamic UI for value and probability inputs
    output$value_prob_inputs <- renderUI({
      num <- as.integer(input$num_values)
      if (is.na(num) || num < 2) {
        return(p("Please enter a valid number of values (at least 2).", style = "color: red;"))
      }

      # Create a list of tag elements
      input_tags <- lapply(1:num, function(i) {
        fluidRow(
          column(6, numericInput(ns(paste0("x_val_", i)), label = paste("Value", i, "(x)"), value = i-1)),
          column(6, numericInput(ns(paste0("p_val_", i)), label = paste("Prob.", i, "P(x)"), value = 1/num, min = 0, max = 1, step = 0.01))
        )
      })
      do.call(tagList, input_tags)
    })

    # Reactive expression to create a data frame from inputs
    dist_data <- reactive({
      req(input$num_values)
      num <- as.integer(input$num_values)

      values <- sapply(1:num, function(i) input[[paste0("x_val_", i)]])
      probs <- sapply(1:num, function(i) input[[paste0("p_val_", i)]])

      # Ensure inputs are not NULL and are numeric
      if (any(sapply(values, is.null)) || any(sapply(probs, is.null))) {
        return(NULL)
      }
      if (!is.numeric(values) || !is.numeric(probs)) {
        return(NULL)
      }

      data.frame(x = values, p = probs)
    })

    # Calculate summary statistics (Mean and SD)
    output$summary_stats <- renderUI({
      df <- dist_data()
      if (is.null(df) || nrow(df) == 0) {
        return(p("Enter values and probabilities to see summary statistics."))
      }

      # Validation
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6) {
        return(p(paste("Error: Probabilities must sum to 1. Current sum:", round(total_prob, 4)), style = "color: red;"))
      }
      if (any(df$p < 0, na.rm = TRUE)) {
        return(p("Error: Probabilities cannot be negative.", style = "color: red;"))
      }

      # Calculations
      mean_val <- sum(df$x * df$p, na.rm = TRUE)
      variance <- sum((df$x - mean_val)^2 * df$p, na.rm = TRUE)
      sd_val <- sqrt(variance)

      tagList(
        p(strong("Mean (μ):"), round(mean_val, 4)),
        p(strong("Standard Deviation (σ):"), round(sd_val, 4))
      )
    })

    # Generate the probability distribution plot
    output$dist_plot <- renderPlot({
      df <- dist_data()
      req(df)

      # Check if probabilities sum to 1 for plotting
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return(NULL) # Don't plot if data is invalid
      }

      ggplot(df, aes(x = factor(x), y = p)) +
        geom_col(fill = "#1d4ed8", alpha = 0.7) +
        labs(title = "Probability Distribution",
             x = "Value (x)",
             y = "Probability P(x)") +
        theme_minimal(base_size = 14) +
        theme(
          plot.title = element_text(hjust = 0.5, face = "bold"),
          axis.text.x = element_text(angle = 45, hjust = 1)
        )
    })

    # Text description for the probability distribution plot
    output$dist_plot_desc_text <- renderText({
      df <- dist_data()
      req(df)
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return("Invalid probability distribution: probabilities must sum to 1 and be non-negative.")
      }

      # Calculate stats for description
      mean_val <- sum(df$x * df$p, na.rm = TRUE)
      variance <- sum((df$x - mean_val)^2 * df$p, na.rm = TRUE)
      sd_val <- sqrt(variance)

      # Create a list of the value-probability pairs
      pairs <- paste(sprintf("P(X=%.2f) = %.3f", df$x, df$p), collapse=", ")

      desc <- paste(
        "This is a bar chart representing a discrete probability distribution.",
        sprintf("The distribution has a calculated mean of %.4f and a standard deviation of %.4f.", mean_val, sd_val),
        "The x-axis shows the distinct values (x) the random variable can take, and the y-axis shows the probability of each value.",
        "The specific probabilities are:", pairs, ".",
        collapse=" "
      )
      return(desc)
    })

    # Calculate and display the requested probability
    output$calculated_prob <- renderText({
      df <- dist_data()
      req(df, input$prob_x_value)

      # Validation
      total_prob <- sum(df$p, na.rm = TRUE)
      if (abs(total_prob - 1.0) > 1e-6 || any(df$p < 0, na.rm = TRUE)) {
        return("Cannot calculate probability due to invalid distribution.")
      }

      x_val <- input$prob_x_value
      prob <- 0

      # Calculate probability based on selected type
      prob <- switch(input$prob_type,
        "eq" = sum(df$p[df$x == x_val], na.rm = TRUE),
        "lt" = sum(df$p[df$x < x_val], na.rm = TRUE),
        "le" = sum(df$p[df$x <= x_val], na.rm = TRUE),
        "gt" = sum(df$p[df$x > x_val], na.rm = TRUE),
        "ge" = sum(df$p[df$x >= x_val], na.rm = TRUE)
      )

      # Format the output string
      op_string <- switch(input$prob_type,
        "eq" = "=", "lt" = "<", "le" = "≤", "gt" = ">", "ge" = "≥"
      )

      paste0("P(X ", op_string, " ", x_val, ") = ", round(prob, 4))
    })
  })
}
