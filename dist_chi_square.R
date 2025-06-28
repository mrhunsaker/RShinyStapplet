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
            "aria-labelledby" = ns("df_label")
          )$all(),
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

    # Reactive expression for distribution data
    distribution_data <- reactive({
      req(input$df)
      # Define a reasonable x-range, ensuring it's not infinite
      max_x <- max(qchisq(0.999, df = input$df), 30) # Ensure range is reasonable
      x <- seq(0, max_x, length.out = 500)
      y <- dchisq(x, df = input$df)
      data.frame(x = x, y = y)
    })

    # Reactive expression for probability calculation
    calculated_probability <- reactive({
      req(input$df, input$prob_type)
      df_val <- input$df
      prob_type <- input$prob_type

      if (prob_type == "lt") {
        req(input$x_val, input$x_val > 0)
        pchisq(input$x_val, df = df_val)
      } else if (prob_type == "gt") {
        req(input$x_val, input$x_val > 0)
        1 - pchisq(input$x_val, df = df_val)
      } else if (prob_type == "between") {
        req(input$x1_val, input$x2_val, input$x1_val > 0, input$x2_val > 0)
        if (input$x1_val >= input$x2_val) {
          return("Error: X1 must be less than X2.")
        }
        pchisq(input$x2_val, df = df_val) - pchisq(input$x1_val, df = df_val)
      }
    })

    # Render the plot
    output$distPlot <- renderPlot({
      df <- distribution_data()
      plot_df <- input$df
      prob_type <- input$prob_type

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(title = paste("Chi-Square Distribution (df =", plot_df, ")"),
             x = "Chi-Square Value", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))

      # Shaded area
      if (prob_type == "lt" && !is.null(input$x_val) && input$x_val > 0) {
        x_shade <- seq(min(df$x), input$x_val, length.out = 100)
        y_shade <- dchisq(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "gt" && !is.null(input$x_val) && input$x_val > 0) {
        x_shade <- seq(input$x_val, max(df$x), length.out = 100)
        y_shade <- dchisq(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, color = "#ef4444", linetype = "dashed")
      } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
        x_shade <- seq(input$x1_val, input$x2_val, length.out = 100)
        y_shade <- dchisq(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#84cc16", alpha = 0.5) +
                 geom_vline(xintercept = c(input$x1_val, input$x2_val), color = "#ef4444", linetype = "dashed")
      }

      p # Return plot
    })

    # Render the probability result
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- ""
        if (input$prob_type == "lt") {
          prob_text_part <- paste("X <", input$x_val)
        } else if (input$prob_type == "gt") {
          prob_text_part <- paste("X >", input$x_val)
        } else if (input$prob_type == "between") {
          prob_text_part <- paste(input$x1_val, "< X <", input$x2_val)
        }
        paste("P(", prob_text_part, ") = ", sprintf("%.4f", prob))
      } else {
        prob # Display error message
      }
    })
  })
}
