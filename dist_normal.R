# RShinyStapplet/dist_normal.R

# UI function for the 'Normal Distribution' calculator
dist_normal_ui <- function(id) {
  ns <- NS(id) # Create a namespace

  fluidPage(
    # Application Title
    titlePanel(
      h2("Normal Distribution Calculator", id = ns("appTitle")),
      windowTitle = "Normal Distribution Calculator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "complementary",
        "aria-labelledby" = ns("paramsHeading"),

        h3("Distribution Parameters", id = ns("paramsHeading")),
        # Input for Mean
        div(
          class = "form-group",
          tags$label(`for` = ns("mean"), "Mean (μ):"),
          htmltools::tagQuery(
            sliderInput(ns("mean"), NULL,
                        min = -100, max = 100, value = 0, step = 1,
                        width = "100%")
          )$find("input")$addAttrs("aria-label" = "Mean of the normal distribution, mu, slider input")$all()
        ),
        # Input for Standard Deviation
        div(
          class = "form-group",
          tags$label(`for` = ns("sd"), "Standard Deviation (σ):"),
          htmltools::tagQuery(
            sliderInput(ns("sd"), NULL,
                        min = 0.1, max = 50, value = 10, step = 0.1,
                        width = "100%")
          )$find("input")$addAttrs("aria-label" = "Standard deviation of the normal distribution, sigma, slider input")$all()
        ),

        hr(role = "separator"),

        h3("Probability Calculation", id = ns("probCalcHeading")),
        # Radio buttons for probability type
        div(
          class = "form-group",
          tags$label(`for` = ns("prob_type"), "Select Probability Type:", class = "control-label"),
          htmltools::tagQuery(
            radioButtons(ns("prob_type"), NULL,
                         choices = c("P(X < x)" = "lt",
                                     "P(X > x)" = "gt",
                                     "P(x1 < X < x2)" = "between"),
                         selected = "lt",
                         inline = FALSE)
          )$find("fieldset")$addAttrs(
            "aria-labelledby" = ns("probCalcHeading"),
            "aria-describedby" = ns("probTypeHelp")
          )$all(),
          p(id = ns("probTypeHelp"), class = "sr-only", "Choose to calculate probability for X less than a value, X greater than a value, or X between two values.")
        ),

        # Input for X value
        conditionalPanel(
          condition = "input.prob_type != 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(`for` = ns("x_val"), "X Value:"),
            htmltools::tagQuery(
              numericInput(ns("x_val"), NULL, value = 0, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-label" = "Value of X for probability calculation")$all()
          )
        ),
        # Inputs for X1 and X2 values
        conditionalPanel(
          condition = "input.prob_type == 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(`for` = ns("x1_val"), "X1 Value:"),
            htmltools::tagQuery(
              numericInput(ns("x1_val"), NULL, value = -10, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-label" = "First X value for probability between")$all()
          ),
          div(
            class = "form-group",
            tags$label(`for` = ns("x2_val"), "X2 Value:"),
            htmltools::tagQuery(
              numericInput(ns("x2_val"), NULL, value = 10, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-label" = "Second X value for probability between")$all()
          )
        )
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        "aria-labelledby" = ns("appTitle"),
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("normalPlot"))
            )$find("img")$addAttrs(
                "aria-labelledby" = ns("plotTitle plotDescription"),
                role = "img"
            )$all(),
            p(id = ns("plotDescription"), class = "sr-only", role = "status", "aria-live" = "polite",
              htmltools::tagQuery(
                textOutput(ns("brailleRDescription"))
              )$find("output")$addAttrs("aria-labelledby" = ns("plotDescription"))$all()
            )
        ),
        div(class = "results-box",
            h3("Calculated Probability:", id = ns("probResultHeading")),
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

# Server function for the 'Normal Distribution' calculator
dist_normal_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Ensure BrailleR is available
    if (!requireNamespace("BrailleR", quietly = TRUE)) {
      # This message will appear in the R console
      message("BrailleR package not found. Plot descriptions for screen readers will be disabled.")
      message("Install it with: install.packages('BrailleR')")
    }

    # Reactive expression for distribution data
    distribution_data <- reactive({
      req(input$mean, input$sd)
      x <- seq(input$mean - 4 * input$sd, input$mean + 4 * input$sd, length.out = 500)
      y <- dnorm(x, mean = input$mean, sd = input$sd)
      data.frame(x = x, y = y)
    })

    # Reactive expression for probability calculation
    calculated_probability <- reactive({
      req(input$mean, input$sd, input$prob_type)
      mean_val <- input$mean
      sd_val <- input$sd

      switch(input$prob_type,
        "lt" = {
          req(input$x_val)
          pnorm(input$x_val, mean = mean_val, sd = sd_val)
        },
        "gt" = {
          req(input$x_val)
          pnorm(input$x_val, mean = mean_val, sd = sd_val, lower.tail = FALSE)
        },
        "between" = {
          req(input$x1_val, input$x2_val)
          if (input$x1_val >= input$x2_val) {
            return("Error: X1 must be less than X2.")
          }
          pnorm(input$x2_val, mean = mean_val, sd = sd_val) - pnorm(input$x1_val, mean = mean_val, sd = sd_val)
        }
      )
    })

    # Reactive expression for the ggplot object
    plot_object_reactive <- reactive({
      df <- distribution_data()
      plot_mean <- input$mean
      plot_sd <- input$sd

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        geom_vline(xintercept = plot_mean, linetype = "dashed", color = "#dc2626") +
        labs(title = paste("Normal Distribution (μ =", plot_mean, ", σ =", plot_sd, ")"),
             x = "X", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold", color = "#0f172a"),
              axis.title = element_text(size = 12, color = "#334155"),
              axis.text = element_text(size = 10, color = "#475569"))

      # Add shaded area
      if (input$prob_type == "lt" && !is.null(input$x_val)) {
        shade_data <- subset(df, x <= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, linetype = "solid", color = "#ef4444")
      } else if (input$prob_type == "gt" && !is.null(input$x_val)) {
        shade_data <- subset(df, x >= input$x_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5) +
                 geom_vline(xintercept = input$x_val, linetype = "solid", color = "#ef4444")
      } else if (input$prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
        shade_data <- subset(df, x >= input$x1_val & x <= input$x2_val)
        p <- p + geom_area(data = shade_data, aes(x = x, y = y), fill = "#84cc16", alpha = 0.5) +
                 geom_vline(xintercept = input$x1_val, linetype = "solid", color = "#ef4444") +
                 geom_vline(xintercept = input$x2_val, linetype = "solid", color = "#ef4444")
      }
      p
    })

    # Render the plot
    output$normalPlot <- renderPlot({
      plot_object_reactive()
    })

    # Render the probability result text
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- switch(input$prob_type,
          "lt" = paste("X <", input$x_val),
          "gt" = paste("X >", input$x_val),
          "between" = paste(input$x1_val, "< X <", input$x2_val)
        )
        paste0("P(", prob_text_part, ") = ", sprintf("%.4f", prob))
      } else {
        prob # Display error message
      }
    })

    # Generate BrailleR description
    output$brailleRDescription <- renderText({
      # Only run if BrailleR is installed
      if (!requireNamespace("BrailleR", quietly = TRUE)) {
        return("Install the BrailleR package to enable screen reader descriptions for plots.")
      }

      plot_for_desc <- plot_object_reactive()
      temp_plot_file <- tempfile(fileext = ".png")
      png(temp_plot_file, width = 800, height = 600, res = 100)
      print(plot_for_desc)
      dev.off()

      braille_desc <- tryCatch({
        suppressWarnings(suppressMessages(BrailleR::VI(Plot = temp_plot_file, alttext = TRUE)))
      }, error = function(e) {
        paste("Error generating plot description:", e$message)
      })

      unlink(temp_plot_file)

      if (is.null(braille_desc) || nchar(braille_desc) == 0) {
        "A detailed description of the plot is not available."
      } else {
        braille_desc
      }
    })
  })
}
