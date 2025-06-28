# ui.R (User Interface)
library(shiny)
library(ggplot2)

ui <- fluidPage(
  tags$head(
    # Load Inter font from Google Fonts
    tags$link(href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap", rel="stylesheet"),
    # Custom CSS for styling with rounded corners, consistent design, and screen reader visibility
    tags$style(HTML("
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc; /* Tailwind gray-50 */
        color: #1e293b; /* Tailwind slate-800 */
        padding: 20px;
      }
      .container-fluid {
        max-width: 900px;
        margin: auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 12px; /* Rounded corners */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Tailwind shadow-md */
      }
      .well {
        background-color: #e2e8f0; /* Tailwind slate-200 */
        border: none;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .form-group label {
        font-weight: 600;
        margin-bottom: 8px;
        color: #334155; /* Tailwind slate-700 */
      }
      .form-control {
        border-radius: 6px;
        border: 1px solid #cbd5e1; /* Tailwind slate-300 */
        padding: 8px 12px;
        width: 100%;
      }
      .slider-input {
        margin-top: 10px;
      }
      h2 {
        color: #0f172a; /* Tailwind slate-900 */
        font-weight: 600;
        margin-bottom: 20px;
        text-align: center;
      }
      h3 {
        color: #0f172a;
        font-weight: 600;
        margin-bottom: 15px;
      }
      .plot-container {
        margin-top: 30px;
        border: 1px solid #e2e8f0; /* Tailwind slate-200 */
        border-radius: 8px;
        padding: 10px;
        background-color: #f0f4f8; /* Tailwind slate-100 */
      }
      .results-box {
        background-color: #e0f2f2; /* Light cyan, similar to Tailwind cyan-100 */
        border: 1px solid #2dd4bf; /* Tailwind teal-400 */
        border-radius: 8px;
        padding: 15px;
        margin-top: 20px;
        color: #0f766e; /* Tailwind teal-800 */
        font-weight: 500;
      }
      .radio-inline { /* Default Shiny radio-inline might still be used, but inline = FALSE helps */
        margin-right: 15px;
      }
      /* Screen-reader-only class to visually hide content but keep it accessible */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    "))
  ),
  # Application Title with window title for browser tab
  titlePanel(
    h2("Normal Distribution Calculator", id = "appTitle"),
    windowTitle = "Normal Distribution Calculator"
  ),
  sidebarLayout(
    sidebarPanel(
      id = "sidebarPanel",
      role = "complementary", # ARIA role for supplementary content
      "aria-labelledby" = "paramsHeading", # Labelled by the heading inside
      h3("Distribution Parameters", id = "paramsHeading"),
      # Input for Mean with ARIA label
      div(
        class = "form-group",
        tags$label(for = "mean", "Mean (\u03BC):"),
        sliderInput("mean", NULL, # NULL for label as we use tags$label
                    min = -10, max = 10, value = 0, step = 0.5,
                    width = "100%",
                    "aria-label" = "Mean of the normal distribution, mu, slider input")
      ),
      # Input for Standard Deviation with ARIA label
      div(
        class = "form-group",
        tags$label(for = "sd", "Standard Deviation (\u03C3):"),
        sliderInput("sd", NULL, # NULL for label as we use tags$label
                    min = 0.1, max = 5, value = 1, step = 0.1,
                    width = "100%",
                    "aria-label" = "Standard deviation of the normal distribution, sigma, slider input")
      ),
      hr(role = "separator"), # Horizontal rule with ARIA role for separation

      h3("Probability Calculation", id = "probCalcHeading"),
      # Radio buttons for probability type with ARIA attributes
      div(
        class = "form-group",
        tags$label(for = "prob_type", "Select Probability Type:", class = "control-label"),
        radioButtons("prob_type", NULL, # NULL for label as we use tags$label
                     choices = c("P(X < x)" = "lt",
                                 "P(X > x)" = "gt",
                                 "P(x1 < X < x2)" = "between"),
                     selected = "lt",
                     inline = FALSE, # Make them block for better keyboard navigation and screen readers
                     "aria-labelledby" = "probCalcHeading",
                     "aria-describedby" = "probTypeHelp" # Provides additional description
        ),
        p(id = "probTypeHelp", class = "sr-only", "Choose to calculate probability for X less than a value, X greater than a value, or X between two values.")
      ),

      # Input for X value (for less than or greater than) with ARIA label
      conditionalPanel(
        condition = "input.prob_type != 'between'",
        div(
          class = "form-group",
          tags$label(for = "x_val", "X Value:"),
          numericInput("x_val", NULL, value = 0, step = 0.1, width = "100%",
                       "aria-label" = "Value of X for probability calculation")
        )
      ),
      # Inputs for X1 and X2 values (for between) with ARIA labels
      conditionalPanel(
        condition = "input.prob_type == 'between'",
        div(
          class = "form-group",
          tags$label(for = "x1_val", "X1 Value:"),
          numericInput("x1_val", NULL, value = -1, step = 0.1, width = "100%",
                       "aria-label" = "First X value for probability between")
        ),
        div(
          class = "form-group",
          tags$label(for = "x2_val", "X2 Value:"),
          numericInput("x2_val", NULL, value = 1, step = 0.1, width = "100%",
                       "aria-label" = "Second X value for probability between")
        )
      )
    ),
    mainPanel(
      id = "mainPanel",
      role = "main", # ARIA role for the main content area
      "aria-labelledby" = "appTitle", # Labelled by the main application title
      div(class = "plot-container",
        # Plot for sighted users
        plotOutput("normalPlot",
                   "aria-labelledby" = "plotTitle plotDescription", # Points to visual title and hidden description
                   role = "img" # ARIA role for an image
                   ),
        # Screen-reader only description of the plot using BrailleR
        p(id = "plotDescription", class = "sr-only", role = "status", "aria-live" = "polite", textOutput("brailleRDescription"))
      ),
      div(class = "results-box",
        h3("Calculated Probability:", id = "probResultHeading"),
        textOutput("probabilityResult",
                   "aria-labelledby" = "probResultHeading",
                   role = "status", "aria-live" = "polite") # ARIA live region for dynamic announcements
      )
    )
  )
)

# server.R (Server Logic)
server <- function(input, output) {

  # Load BrailleR package (ensure it's installed: install.packages("BrailleR"))
  library(BrailleR)

  # Reactive expression to generate the normal distribution data
  # This recalculates whenever mean or sd inputs change
  distribution_data <- reactive({
    req(input$mean, input$sd) # Ensure inputs exist
    x <- seq(input$mean - 4 * input$sd, input$mean + 4 * input$sd, length.out = 500)
    y <- dnorm(x, mean = input$mean, sd = input$sd)
    data.frame(x = x, y = y)
  })

  # Reactive expression to calculate the probability
  # This recalculates whenever mean, sd, prob_type, x_val, x1_val, or x2_val change
  calculated_probability <- reactive({
    req(input$mean, input$sd, input$prob_type) # Ensure inputs exist
    mean_val <- input$mean
    sd_val <- input$sd
    prob_type <- input$prob_type

    if (prob_type == "lt") {
      req(input$x_val)
      pnorm(input$x_val, mean = mean_val, sd = sd_val)
    } else if (prob_type == "gt") {
      req(input$x_val)
      1 - pnorm(input$x_val, mean = mean_val, sd = sd_val)
    } else if (prob_type == "between") {
      req(input$x1_val, input$x2_val)
      if (input$x1_val >= input$x2_val) {
        return("Error: X1 must be less than X2. Please adjust the values.")
      }
      pnorm(input$x2_val, mean = mean_val, sd = sd_val) - pnorm(input$x1_val, mean = mean_val, sd = sd_val)
    }
  })

  # Reactive expression to generate the ggplot object
  # This is separated so it can be used by both renderPlot and BrailleR description
  plot_object_reactive <- reactive({
    df <- distribution_data()
    plot_mean <- input$mean
    plot_sd <- input$sd
    prob_type <- input$prob_type

    p <- ggplot(df, aes(x = x, y = y)) +
      geom_line(color = "#1e40af", linewidth = 1) + # Tailwind blue-700
      geom_vline(xintercept = plot_mean, linetype = "dashed", color = "#dc2626") + # Tailwind red-600 for mean
      labs(title = paste("Normal Distribution (\u03BC =", plot_mean, ", \u03C3 =", plot_sd, ")"),
           x = "X", y = "Density") +
      theme_minimal() +
      theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold", color = "#0f172a"),
            axis.title = element_text(size = 12, color = "#334155"),
            axis.text = element_text(size = 10, color = "#475569"),
            panel.grid.major = element_line(color = "#cbd5e1", linetype = "dotted"),
            panel.grid.minor = element_blank())

    # Add shaded area for probability based on selection
    if (prob_type == "lt" && !is.null(input$x_val)) {
      x_shade <- seq(min(df$x), input$x_val, length.out = 100)
      y_shade <- dnorm(x_shade, mean = plot_mean, sd = plot_sd)
      p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y),
                         fill = "#60a5fa", alpha = 0.5) # Tailwind blue-400
    } else if (prob_type == "gt" && !is.null(input$x_val)) {
      x_shade <- seq(input$x_val, max(df$x), length.out = 100)
      y_shade <- dnorm(x_shade, mean = plot_mean, sd = plot_sd)
      p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y),
                         fill = "#fbbf24", alpha = 0.5) # Tailwind amber-400
    } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
      x_shade <- seq(input$x1_val, input$x2_val, length.out = 100)
      y_shade <- dnorm(x_shade, mean = plot_mean, sd = plot_sd)
      p <- p + geom_area(data = data.frame(x = x_shade, y = y_shade), aes(x = x, y = y),
                         fill = "#84cc16", alpha = 0.5) # Tailwind lime-500
    }

    # Add vertical lines for X values if applicable
    if (prob_type != "between" && !is.null(input$x_val)) {
      p <- p + geom_vline(xintercept = input$x_val, linetype = "solid", color = "#ef4444", linewidth = 0.8) # Tailwind red-500
    } else if (prob_type == "between" && !is.null(input$x1_val) && !is.null(input$x2_val) && input$x1_val < input$x2_val) {
      p <- p + geom_vline(xintercept = input$x1_val, linetype = "solid", color = "#ef4444", linewidth = 0.8) +
               geom_vline(xintercept = input$x2_val, linetype = "solid", color = "#ef4444", linewidth = 0.8)
    }

    p # Return the ggplot object
  })

  # Render the normal distribution plot for visual users
  output$normalPlot <- renderPlot({
    plot_object_reactive()
  })

  # Render the calculated probability
  output$probabilityResult <- renderText({
    prob <- calculated_probability()
    if (is.numeric(prob)) {
      # Construct the probability text based on the selected type
      prob_text_part <- ""
      if (input$prob_type == "lt") {
        prob_text_part <- paste("X less than", input$x_val)
      } else if (input$prob_type == "gt") {
        prob_text_part <- paste("X greater than", input$x_val)
      } else if (input$prob_type == "between") {
        prob_text_part <- paste("X between", input$x1_val, "and", input$x2_val)
      }
      paste("The calculated probability is: P(", prob_text_part, ") = ", sprintf("%.4f", prob))
    } else {
      prob # Display error message for X1 > X2
    }
  })

  # Generate BrailleR description for screen readers
  output$brailleRDescription <- renderText({
    plot_for_description <- plot_object_reactive()

    # Use a temporary file for the plot to be processed by BrailleR
    temp_plot_file <- tempfile(fileext = ".png")
    # Open a PNG device, print the plot to it, then close it.
    # This makes the plot available in a file format for BrailleR.
    # A larger resolution might help BrailleR generate a more detailed description.
    png(temp_plot_file, width = 800, height = 600, res = 100)
    print(plot_for_description)
    dev.off()

    # Get the description from BrailleR using alttext=TRUE which returns the string
    braille_desc <- tryCatch({
      # Suppress warnings and messages that BrailleR might print to console,
      # focusing on capturing only the descriptive text.
      suppressWarnings(suppressMessages(VI(Plot = temp_plot_file, alttext = TRUE)))
    }, error = function(e) {
      paste("Error generating plot description:", e$message)
    })

    # Clean up the temporary file
    unlink(temp_plot_file)

    # Provide a fallback message if BrailleR returns an empty or NULL description
    if (is.null(braille_desc) || nchar(braille_desc) == 0) {
      return("A detailed description of the normal distribution plot, including its shape, mean, standard deviation, and shaded probability area, will be provided here for screen readers.")
    } else {
      return(braille_desc)
    }
  })
}

# Combine UI and Server to run the app
shinyApp(ui = ui, server = server)
