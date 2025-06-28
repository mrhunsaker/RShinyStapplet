# StappletSHiny/dist_f.R

# UI function for the 'F-Distribution' calculator
dist_f_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("F-Distribution Calculator", id = "appTitle"),
      windowTitle = "F-Distribution Calculator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "complementary",

        h3("Distribution Parameters", id = "paramsHeading"),
        # Input for Numerator Degrees of Freedom (df1)
        div(
          class = "form-group",
          tags$label(id = ns("df1_label"), "Numerator Degrees of Freedom (df1):"),
          htmltools::tagQuery(
            sliderInput(ns("df1"), NULL,
                        min = 1, max = 100, value = 10, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("df1_label"))$all()
        ),
        # Input for Denominator Degrees of Freedom (df2)
        div(
          class = "form-group",
          tags$label(id = ns("df2_label"), "Denominator Degrees of Freedom (df2):"),
          htmltools::tagQuery(
            sliderInput(ns("df2"), NULL,
                        min = 1, max = 100, value = 20, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("df2_label"))$all()
        ),

        hr(role = "separator"),
        h3("Probability Calculation", id = "probCalcHeading"),
        # Radio buttons for probability type
        div(
          class = "form-group",
          tags$label(id = ns("prob_type_label"), "Select Probability Type:"),
          htmltools::tagQuery(
            radioButtons(ns("prob_type"), NULL,
                         choices = c("P(X > x)" = "gt", "P(X < x)" = "lt"),
                         selected = "gt",
                         inline = FALSE)
          )$find("fieldset")$addAttrs("aria-labelledby" = ns("prob_type_label"))$all()
        ),
        # Input for F-value
        div(
          class = "form-group",
          tags$label(id = ns("x_val_label"), "F-value (x):"),
          htmltools::tagQuery(
            numericInput(ns("x_val"), NULL, value = 1.5, step = 0.1, width = "100%")
          )$find("input")$addAttrs("aria-labelledby" = ns("x_val_label"))$all()
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        "aria-labelledby" = "appTitle",
        div(class = "plot-container",
          htmltools::tagQuery(
            plotOutput(ns("fPlot"))
          )$find("img")$addAttrs(
            role = "img",
            "aria-labelledby" = ns("plotDescription")
          )$all(),
          p(id = ns("plotDescription"), class = "sr-only", role = "status", "aria-live" = "polite", textOutput(ns("brailleRDescription")))
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

# Server function for the 'F-Distribution' calculator
dist_f_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    # Load BrailleR if not already loaded
    if (!require(BrailleR)) {
      # This is a fallback, ideally the package should be installed
      # install.packages("BrailleR")
      library(BrailleR)
    }

    # Reactive expression for distribution data
    distribution_data <- reactive({
      req(input$df1, input$df2, input$df1 > 0, input$df2 > 0)
      # Determine a reasonable x-range, e.g., up to the 0.999 quantile
      max_x <- qf(0.999, df1 = input$df1, df2 = input$df2)
      if (is.infinite(max_x) || max_x > 50) max_x <- 50 # Cap the range
      x <- seq(0, max_x, length.out = 500)
      y <- df(x, df1 = input$df1, df2 = input$df2)
      data.frame(x = x, y = y)
    })

    # Reactive expression for calculated probability
    calculated_probability <- reactive({
      req(input$df1, input$df2, input$prob_type, input$x_val)
      if (input$x_val < 0) return("Error: F-value cannot be negative.")

      prob <- switch(input$prob_type,
        "lt" = pf(input$x_val, df1 = input$df1, df2 = input$df2),
        "gt" = pf(input$x_val, df1 = input$df1, df2 = input$df2, lower.tail = FALSE)
      )
      prob
    })

    # Reactive expression for the ggplot object
    plot_object_reactive <- reactive({
      df <- distribution_data()
      plot_df1 <- input$df1
      plot_df2 <- input$df2
      prob_type <- input$prob_type
      x_val <- input$x_val

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(title = paste("F-Distribution (df1 =", plot_df1, ", df2 =", plot_df2, ")"),
             x = "F-value", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
              axis.title = element_text(size = 12),
              axis.text = element_text(size = 10))

      if (x_val >= 0) {
        # Add shaded area
        if (prob_type == "lt") {
          x_shade <- seq(min(df$x), x_val, length.out = 100)
          fill_color <- "#60a5fa" # blue
        } else { # gt
          x_shade <- seq(x_val, max(df$x), length.out = 100)
          fill_color <- "#fbbf24" # amber
        }
        y_shade <- df(x_shade, df1 = plot_df1, df2 = plot_df2)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y),
                           fill = fill_color, alpha = 0.6)

        # Add vertical line for the F-value
        p <- p + geom_vline(xintercept = x_val, linetype = "solid", color = "#ef4444", linewidth = 1)
      }
      p
    })

    # Render the plot
    output$fPlot <- renderPlot({
      plot_object_reactive()
    })

    # Render the probability result text
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- if (input$prob_type == "lt") {
          paste("X <", input$x_val)
        } else {
          paste("X >", input$x_val)
        }
        paste("P(", prob_text_part, ") = ", sprintf("%.4f", prob))
      } else {
        prob # Display error message
      }
    })

    # Generate BrailleR description
    output$brailleRDescription <- renderText({
      plot_obj <- plot_object_reactive()
      temp_plot_file <- tempfile(fileext = ".png")
      png(temp_plot_file, width = 800, height = 600, res = 100)
      print(plot_obj)
      dev.off()

      braille_desc <- tryCatch({
        suppressWarnings(suppressMessages(VI(Plot = temp_plot_file, alttext = TRUE)))
      }, error = function(e) {
        paste("Error generating plot description:", e$message)
      })

      unlink(temp_plot_file)

      if (is.null(braille_desc) || nchar(braille_desc) == 0) {
        "A detailed description of the F-distribution plot will be provided here."
      } else {
        return(braille_desc)
      }
    })
  })
}
