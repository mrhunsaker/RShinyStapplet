# StappletSHiny/dist_t.R

# UI function for the 't-Distribution' calculator applet
dist_t_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("t-Distribution Calculator", id = "appTitle"),
      windowTitle = "t-Distribution Calculator"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "complementary",
        "aria-labelledby" = "paramsHeading",

        h3("Distribution Parameters", id = "paramsHeading"),
        # Input for Degrees of Freedom (df)
        div(
          class = "form-group",
          tags$label(id = ns("df_label"), "Degrees of Freedom (df):"),
          htmltools::tagQuery(
            sliderInput(ns("df"), NULL,
                        min = 1, max = 100, value = 10, step = 1,
                        width = "100%")
          )$find("input")$addAttrs("aria-labelledby" = ns("df_label"))$all()
        ),

        hr(role = "separator"),

        h3("Probability Calculation", id = "probCalcHeading"),
        # Radio buttons for probability type
        div(
          class = "form-group",
          tags$label(id = ns("prob_type_label"), "Select Probability Type:"),
          htmltools::tagQuery(
            radioButtons(ns("prob_type"), NULL,
                         choices = c("P(T < t)" = "lt",
                                     "P(T > t)" = "gt",
                                     "P(t1 < T < t2)" = "between"),
                         selected = "lt",
                         inline = FALSE)
          )$find("fieldset")$addAttrs("aria-labelledby" = ns("prob_type_label"))$all()
        ),

        # Input for t-value (for less than or greater than)
        conditionalPanel(
          condition = "input.prob_type != 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("t_val_label"), "t-value:"),
            htmltools::tagQuery(
              numericInput(ns("t_val"), NULL, value = 0, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-labelledby" = ns("t_val_label"))$all()
          )
        ),
        # Inputs for t1 and t2 values (for between)
        conditionalPanel(
          condition = "input.prob_type == 'between'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("t1_val_label"), "t1-value:"),
            htmltools::tagQuery(
              numericInput(ns("t1_val"), NULL, value = -1, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-labelledby" = ns("t1_val_label"))$all()
          ),
          div(
            class = "form-group",
            tags$label(id = ns("t2_val_label"), "t2-value:"),
            htmltools::tagQuery(
              numericInput(ns("t2_val"), NULL, value = 1, step = 0.1, width = "100%")
            )$find("input")$addAttrs("aria-labelledby" = ns("t2_val_label"))$all()
          )
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        "aria-labelledby" = "appTitle",
        div(class = "plot-container",
          htmltools::tagQuery(
            plotOutput(ns("tPlot"))
          )$find("img")$addAttrs(
            "aria-labelledby" = ns("probCalcHeading"), # Use the probability calculation heading as label
            role = "img"
          )$all(),
          p(id = "plotDescription", class = "sr-only", role = "status", "aria-live" = "polite", textOutput(ns("brailleRDescription")))
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

# Server function for the 't-Distribution' calculator applet
dist_t_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Ensure BrailleR is available
    if (!requireNamespace("BrailleR", quietly = TRUE)) {
      # This is a fallback for environments where the package might not be installed.
      # The main app should handle this more gracefully.
      warning("BrailleR package not found. Screen reader descriptions will be unavailable.")
    }

    # Reactive expression for distribution data
    distribution_data <- reactive({
      req(input$df)
      # Define a dynamic range based on df to capture the tails
      x_range <- max(4, qt(0.999, df = input$df))
      x <- seq(-x_range, x_range, length.out = 500)
      y <- dt(x, df = input$df)
      data.frame(x = x, y = y)
    })

    # Reactive expression for probability calculation
    calculated_probability <- reactive({
      req(input$df, input$prob_type)
      df_val <- input$df
      prob_type <- input$prob_type

      if (prob_type == "lt") {
        req(input$t_val)
        pt(input$t_val, df = df_val)
      } else if (prob_type == "gt") {
        req(input$t_val)
        1 - pt(input$t_val, df = df_val)
      } else if (prob_type == "between") {
        req(input$t1_val, input$t2_val)
        if (input$t1_val >= input$t2_val) {
          return("Error: t1 must be less than t2.")
        }
        pt(input$t2_val, df = df_val) - pt(input$t1_val, df = df_val)
      }
    })

    # Reactive expression for the ggplot object
    plot_object_reactive <- reactive({
      df <- distribution_data()
      plot_df <- input$df
      prob_type <- input$prob_type

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_line(color = "#1e40af", linewidth = 1) +
        labs(title = paste("t-Distribution (df =", plot_df, ")"),
             x = "t-value", y = "Density") +
        theme_minimal() +
        theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold", color = "#0f172a"))

      # Add shaded area
      if (prob_type == "lt" && !is.null(input$t_val)) {
        x_shade <- seq(min(df$x), input$t_val, length.out = 100)
        y_shade <- dt(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#60a5fa", alpha = 0.5)
      } else if (prob_type == "gt" && !is.null(input$t_val)) {
        x_shade <- seq(input$t_val, max(df$x), length.out = 100)
        y_shade <- dt(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#fbbf24", alpha = 0.5)
      } else if (prob_type == "between" && !is.null(input$t1_val) && !is.null(input$t2_val) && input$t1_val < input$t2_val) {
        x_shade <- seq(input$t1_val, input$t2_val, length.out = 100)
        y_shade <- dt(x_shade, df = plot_df)
        p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y), fill = "#84cc16", alpha = 0.5)
      }

      # Add vertical lines for t-values
      if (prob_type != "between" && !is.null(input$t_val)) {
        p <- p + geom_vline(xintercept = input$t_val, linetype = "solid", color = "#ef4444", linewidth = 0.8)
      } else if (prob_type == "between" && !is.null(input$t1_val) && !is.null(input$t2_val) && input$t1_val < input$t2_val) {
        p <- p + geom_vline(xintercept = input$t1_val, linetype = "solid", color = "#ef4444", linewidth = 0.8) +
                 geom_vline(xintercept = input$t2_val, linetype = "solid", color = "#ef4444", linewidth = 0.8)
      }
      p # Return the plot object
    })

    # Render the plot
    output$tPlot <- renderPlot({
      plot_object_reactive()
    })

    # Render the probability result text
    output$probabilityResult <- renderText({
      prob <- calculated_probability()
      if (is.numeric(prob)) {
        prob_text_part <- ""
        if (input$prob_type == "lt") {
          prob_text_part <- paste("T <", input$t_val)
        } else if (input$prob_type == "gt") {
          prob_text_part <- paste("T >", input$t_val)
        } else if (input$prob_type == "between") {
          prob_text_part <- paste(input$t1_val, "< T <", input$t2_val)
        }
        paste("The calculated probability is: P(", prob_text_part, ") =", sprintf("%.4f", prob))
      } else {
        prob # Display error message
      }
    })

    # Generate BrailleR description
    output$brailleRDescription <- renderText({
      # This requires the BrailleR package to be installed
      if (!requireNamespace("BrailleR", quietly = TRUE)) {
        return("BrailleR package not installed, cannot generate plot description.")
      }

      plot_for_description <- plot_object_reactive()
      temp_plot_file <- tempfile(fileext = ".png")

      tryCatch({
        png(temp_plot_file, width = 800, height = 600, res = 100)
        print(plot_for_description)
        dev.off()

        braille_desc <- suppressWarnings(suppressMessages(BrailleR::VI(Plot = temp_plot_file, alttext = TRUE)))

        if (is.null(braille_desc) || nchar(braille_desc) == 0) {
          "A detailed description of the t-distribution plot will be provided here."
        } else {
          braille_desc
        }
      }, error = function(e) {
        paste("Error generating plot description:", e$message)
      }, finally = {
        unlink(temp_plot_file)
      })
    })
  })
}
