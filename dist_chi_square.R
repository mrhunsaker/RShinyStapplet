# StappletSHiny/dist_chi_square.R

# UI function for the 'Chi-Square Distribution' calculator
dist_chi_square_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Chi-Square Distribution Calculator", id = "appTitle"),
      windowTitle = "Chi-Square Distribution Calculator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "complementary",
        h3("Distribution Parameters", id = "paramsHeading"),
        div(
          class = "form-group",
          tags$label(id = ns("df_label"), "Degrees of Freedom (df):"),
          htmltools::tagQuery(
            sliderInput(ns("df"), NULL,
                        min = 1, max = 50, value = 10, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("df_label"))$all()
        ),
        hr(role = "separator"),
        h3("Probability Calculation", id = "probCalcHeading"),
        div(
          class = "form-group",
          tags$label(id = ns("prob_type_label"), "Select Probability Type:"),
          htmltools::tagQuery(
            radioButtons(ns("prob_type"), NULL,
                         choices = c("P(X < x)" = "lt",
                                     "P(X > x)" = "gt",
                                     "P(x1 < X < x2)" = "between"),
                         selected = "gt")
          )$find("fieldset")$addAttrs("aria-labelledby" = ns("prob_type_label"))$all()
        ),
        conditionalPanel(
          condition = "input.prob_type != 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("x_val_label"), "X Value (critical value):"),
            htmltools::tagQuery(
              numericInput(ns("x_val"), NULL, value = 18.31, step = 0.1, min = 0)
            )$find("input")$addAttrs("aria-labelledby" = ns("x_val_label"))$all()
          )
        ),
        conditionalPanel(
          condition = "input.prob_type == 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("x1_val_label"), "X1 Value:"),
            htmltools::tagQuery(
              numericInput(ns("x1_val"), NULL, value = 3.94, step = 0.1, min = 0)
            )$find("input")$addAttrs("aria-labelledby" = ns("x1_val_label"))$all()
          ),
          div(
            class = "form-group",
            tags$label(id = ns("x2_val_label"), "X2 Value:"),
            htmltools::tagQuery(
              numericInput(ns("x2_val"), NULL, value = 18.31, step = 0.1, min = 0)
            )$find("input")$addAttrs("aria-labelledby" = ns("x2_val_label"))$all()
          )
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        div(class = "plot-container",
          htmltools::tagQuery(
            plotOutput(ns("distPlot"))
          )$find("img")$addAttrs(
              role = "img",
              "aria-label" = "Plot of the chi-square distribution with the selected degrees of freedom. The shaded area represents the calculated probability."
          )$all(),
          p(id = ns("distPlot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("distPlot_desc_text"))),
          p(id = "plotDesc", class = "sr-only", "A plot of the Chi-Square distribution with the specified degrees of freedom and shaded area representing the calculated probability.")
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

# Server function for the 'Chi-Square Distribution' calculator
dist_chi_square_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive values to store plot and probability
    results <- reactiveValues(plot = NULL, probability = NULL, prob_text = NULL)

    # Observe inputs and trigger calculations
    observe({
      # Ensure df is a valid number before proceeding
      req(is.numeric(input$df))
      df_val <- input$df
      prob_type <- input$prob_type

      # Distribution data
      max_x <- max(qchisq(0.999, df = df_val), 30)
      start_x <- if (df_val <= 2) 1e-4 else 0
      dist_data <- data.frame(x = seq(start_x, max_x, length.out = 500))
      dist_data$y <- dchisq(dist_data$x, df = df_val)

      # Probability calculation
      prob <- NULL
      prob_text_part <- ""

      if (prob_type == "lt") {
        req(input$x_val)
        if (input$x_val >= 0) {
          prob <- pchisq(input$x_val, df = df_val)
          prob_text_part <- paste("X <", input$x_val)
        }
      } else if (prob_type == "gt") {
        req(input$x_val)
        if (input$x_val >= 0) {
          prob <- 1 - pchisq(input$x_val, df = df_val)
          prob_text_part <- paste("X >", input$x_val)
        }
      } else if (prob_type == "between") {
        req(input$x1_val, input$x2_val)
        if (input$x1_val < input$x2_val && input$x1_val >= 0) {
          prob <- pchisq(input$x2_val, df = df_val) - pchisq(input$x1_val, df = df_val)
          prob_text_part <- paste(input$x1_val, "< X <", input$x2_val)
        } else {
          prob <- "Error: X1 must be less than X2."
        }
      }

      if (is.numeric(prob)) {
        results$probability <- sprintf("P(%s) = %.4f", prob_text_part, prob)
      } else {
        results$probability <- prob
      }

      # Plot generation
      p <- ggplot(dist_data, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(title = paste("Chi-Square Distribution (df =", df_val, ")"),
             x = "Chi-Square Value", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))

      # Shading logic
      if (prob_type == "lt" && !is.null(input$x_val) && input$x_val >= 0) {
        shade_data <- subset(dist_data, x <= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "gt" && !is.null(input$x_val) && input$x_val >= 0) {
        shade_data <- subset(dist_data, x >= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
        shade_data <- subset(dist_data, x >= input$x1_val & x <= input$x2_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#84cc16", alpha = 0.5) +
                 geom_vline(xintercept = c(input$x1_val, input$x2_val), color = "#ef4444", linetype = "dashed")
      }

      results$plot <- p
    })

    # Render the plot
    output$distPlot <- renderPlot({
      req(results$plot)
      results$plot
    })

    # Render the probability result
    output$probabilityResult <- renderText({
      req(results$probability)
      results$probability
    })
  })
}
