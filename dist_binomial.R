# StappletSHiny/dist_binomial.R

# UI function for the 'Binomial Distribution' applet
dist_binomial_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Binomial Distribution Calculator", id = "appTitle"),
      windowTitle = "Binomial Distribution Calculator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",

        h3("Distribution Parameters", id = "paramsHeading"),
        # Input for Number of Trials (n)
        div(
          class = "form-group",
          tags$label(id = ns("n_trials_label"), "Number of Trials (n):"),
          htmltools::tagQuery(
            numericInput(ns("n_trials"), NULL, value = 10, min = 1, max = 1000, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("n_trials_label"))$all()
        ),
        # Input for Probability of Success (p)
        div(
          class = "form-group",
          tags$label(id = ns("p_success_label"), "Probability of Success (p):"),
          htmltools::tagQuery(
            sliderInput(ns("p_success"), NULL, min = 0, max = 1, value = 0.5, step = 0.01)
          )$find("input")$addAttrs("aria-labelledby" = ns("p_success_label"))$all()
        ),

        hr(role = "separator"),
        h3("Probability Calculation", id = "probCalcHeading"),
        # Radio buttons for probability type
        div(
          class = "form-group",
          tags$label(id = ns("prob_type_label"), "Select Probability Type:"),
          htmltools::tagQuery(
            radioButtons(ns("prob_type"), NULL,
                         choices = c("P(X = k)" = "exact",
                                     "P(X \u2264 k)" = "at_most",
                                     "P(X > k)" = "greater_than",
                                     "P(k1 \u2264 X \u2264 k2)" = "between"),
                         selected = "exact")
          )$find("fieldset")$addAttrs("aria-labelledby" = ns("prob_type_label"))$all()
        ),

        # Input for k value (for exact, at most, greater than)
        conditionalPanel(
          condition = "input.prob_type != 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("k_val_label"), "Value of k:"),
            htmltools::tagQuery(
              numericInput(ns("k_val"), NULL, value = 5, min = 0, step = 1)
            )$find("input")$addAttrs("aria-labelledby" = ns("k_val_label"))$all()
          )
        ),
        # Inputs for k1 and k2 values (for between)
        conditionalPanel(
          condition = "input.prob_type == 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("k1_val_label"), "Value of k1:"),
            htmltools::tagQuery(
              numericInput(ns("k1_val"), NULL, value = 4, min = 0, step = 1)
            )$find("input")$addAttrs("aria-labelledby" = ns("k1_val_label"))$all()
          ),
          div(
            class = "form-group",
            tags$label(id = ns("k2_val_label"), "Value of k2:"),
            htmltools::tagQuery(
              numericInput(ns("k2_val"), NULL, value = 6, min = 0, step = 1)
            )$find("input")$addAttrs("aria-labelledby" = ns("k2_val_label"))$all()
          )
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
          htmltools::tagQuery(
            plotOutput(ns("binomialPlot"))
          )$find("img")$addAttrs(
            role = "img",
            "aria-labelledby" = ns("probResultHeading")
          )$all()
        ),
        div(class = "results-box",
          h3("Calculated Probability:", id = "probResultHeading"),
          htmltools::tagQuery(
            textOutput(ns("probabilityResult"))
          )$find("output")$addAttrs(
            "aria-labelledby" = ns("probResultHeading"),
            role = "status",
            "aria-live" = "polite"
          )$all()
        )
      )
    )
  )
}

# Server function for the 'Binomial Distribution' applet
dist_binomial_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to generate the binomial distribution data
    distribution_data <- reactive({
      req(input$n_trials, input$p_success)
      n <- input$n_trials
      p <- input$p_success
      x <- 0:n
      y <- dbinom(x, size = n, prob = p)
      data.frame(x = x, y = y)
    })

    # Reactive expression to calculate the probability
    calculated_probability <- reactive({
      req(input$n_trials, input$p_success, input$prob_type)
      n <- input$n_trials
      p <- input$p_success
      prob_type <- input$prob_type

      if (prob_type == "exact") {
        req(input$k_val)
        if (input$k_val < 0 || input$k_val > n) return("Error: k must be between 0 and n.")
        dbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "at_most") {
        req(input$k_val)
        if (input$k_val < 0) return("Error: k must be non-negative.")
        pbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "greater_than") {
        req(input$k_val)
        if (input$k_val > n) return("Error: k cannot be greater than n.")
        1 - pbinom(input$k_val, size = n, prob = p)
      } else if (prob_type == "between") {
        req(input$k1_val, input$k2_val)
        if (input$k1_val > input$k2_val) return("Error: k1 must be less than or equal to k2.")
        if (input$k1_val < 0 || input$k2_val > n) return("Error: k values must be within the range [0, n].")
        pbinom(input$k2_val, size = n, prob = p) - pbinom(input$k1_val - 1, size = n, prob = p)
      }
    })

    # Render the binomial distribution plot
    output$binomialPlot <- renderPlot({
      df <- distribution_data()
      prob_type <- input$prob_type
      n <- input$n_trials
      p_val <- input$p_success

      # Determine which bars to shade
      df$shaded <- FALSE
      if (prob_type == "exact") {
        df$shaded[df$x == input$k_val] <- TRUE
      } else if (prob_type == "at_most") {
        df$shaded[df$x <= input$k_val] <- TRUE
      } else if (prob_type == "greater_than") {
        df$shaded[df$x > input$k_val] <- TRUE
      } else if (prob_type == "between" && input$k1_val <= input$k2_val) {
        df$shaded[df$x >= input$k1_val & df$x <= input$k2_val] <- TRUE
      }

      ggplot(df, aes(x = as.factor(x), y = y, fill = shaded)) +
        geom_col(color = "#1e40af", width = 0.7) +
        scale_fill_manual(values = c("FALSE" = "#60a5fa", "TRUE" = "#fbbf24"), guide = "none") +
        labs(
          title = paste("Binomial Distribution (n =", n, ", p =", p_val, ")"),
          x = "Number of Successes (k)",
          y = "Probability"
        ) +
        theme_minimal() +
        theme(
          plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
          axis.text.x = element_text(angle = 45, hjust = 1, size = ifelse(n > 40, 8, 10))
        )
    })

    # Render the calculated probability text
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- ""
        if (input$prob_type == "exact") {
          prob_text_part <- paste("X =", input$k_val)
        } else if (input$prob_type == "at_most") {
          prob_text_part <- paste("X \u2264", input$k_val)
        } else if (input$prob_type == "greater_than") {
          prob_text_part <- paste("X >", input$k_val)
        } else if (input$prob_type == "between") {
          prob_text_part <- paste(input$k1_val, "\u2264 X \u2264", input$k2_val)
        }
        paste("The calculated probability is: P(", prob_text_part, ") = ", sprintf("%.5f", prob))
      } else {
        prob # Display error message
      }
    })

  })
}
