# StappletSHiny/regression_slr.R

# UI function for the 'Simple Linear Regression' applet
regression_slr_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Simple Linear Regression", id = "appTitle"),
      windowTitle = "Simple Linear Regression"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "dataHeading",

        h3("Data Input", id = "dataHeading"),
        # Selector for sample data or custom input
        selectInput(ns("data_source"), "Data Source:",
                    choices = c(
                      "Load Sample Data" = "sample",
                      "Paste Custom Data" = "custom"
                    ),
                    selected = "sample"),

        # Conditional panel for sample data
        conditionalPanel(
          condition = "input.data_source == 'sample'",
          ns = ns,
          selectInput(ns("sample_data_name"), "Choose a Sample Dataset:",
                      choices = c(
                        "Strong Positive Correlation" = "strong_pos",
                        "Weak Positive Correlation" = "weak_pos",
                        "Strong Negative Correlation" = "strong_neg",
                        "No Correlation" = "no_corr",
                        "Non-Linear" = "non_linear"
                      ))
        ),

        # Conditional panel for custom data
        conditionalPanel(
          condition = "input.data_source == 'custom'",
          ns = ns,
          textAreaInput(ns("custom_data"), "Paste two columns of data (x, y):",
                        placeholder = "Example:\n1, 5.2\n2, 7.8\n3, 9.1\n4, 12.5",
                        rows = 10),
          p("Data can be comma-separated, tab-separated, or space-separated.", class = "text-muted")
        ),

        hr(role = "separator"),
        h3("Analysis Options"),
        # Checkbox to show/hide the regression line
        checkboxInput(ns("show_line"), "Show Least-Squares Regression Line", value = TRUE),
        # Checkbox to show/hide the model summary
        checkboxInput(ns("show_summary"), "Show Model Summary & Coefficients", value = TRUE),
        # Checkbox to show/hide the residual plot
        checkboxInput(ns("show_residuals"), "Show Residual Plot", value = FALSE),
        # Checkbox to show/hide descriptive statistics
        checkboxInput(ns("show_stats"), "Show Descriptive Statistics", value = FALSE)
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Scatterplot Output
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("scatterplot"))
            )$find("img")$addAttrs(
                "aria-labelledby" = ns("appTitle")
            )$all()
        ),
        # Model Summary Output (conditionally shown)
        conditionalPanel(
          condition = "input.show_summary",
          ns = ns,
          div(class = "results-box",
              h4("Regression Model Summary", id = ns("modelSummaryHeading")),
              htmltools::tagQuery(
                  verbatimTextOutput(ns("model_summary"))
              )$find("pre")$addAttrs(
                  "aria-labelledby" = ns("modelSummaryHeading")
              )$all()
          )
        ),
        # Residual Plot Output (conditionally shown)
        conditionalPanel(
          condition = "input.show_residuals",
          ns = ns,
          div(class = "plot-container",
              h4("Residuals vs. Fitted Values Plot", id = ns("residualPlotHeading")),
              htmltools::tagQuery(
                  plotOutput(ns("residual_plot"))
              )$find("img")$addAttrs(
                  "aria-labelledby" = ns("residualPlotHeading")
              )$all()
          )
        ),
        # Descriptive Statistics Output (conditionally shown)
        conditionalPanel(
          condition = "input.show_stats",
          ns = ns,
          div(class = "results-box",
              h4("Descriptive Statistics", id = ns("descStatsHeading")),
              htmltools::tagQuery(
                  verbatimTextOutput(ns("descriptive_stats"))
              )$find("pre")$addAttrs(
                  "aria-labelledby" = ns("descStatsHeading")
              )$all()
          )
        )
      )
    )
  )
}

# Server function for the 'Simple Linear Regression' applet
regression_slr_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # --- Pre-defined Sample Datasets ---
    sample_datasets <- list(
      strong_pos = data.frame(x = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), y = c(2.1, 3.9, 6.2, 8.1, 9.8, 12.3, 14.1, 16.2, 18.0, 20.1)),
      weak_pos = data.frame(x = c(1:15), y = c(5, 3, 8, 6, 9, 11, 10, 14, 9, 15, 13, 18, 16, 20, 19)),
      strong_neg = data.frame(x = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), y = c(19.5, 17.8, 16.1, 13.9, 12.2, 10.1, 7.8, 6.1, 3.9, 2.2)),
      no_corr = data.frame(x = c(1:20), y = sample(1:20, 20, replace = TRUE)),
      non_linear = data.frame(x = c(1:10), y = c(1, 4, 9, 16, 25, 36, 49, 64, 81, 100) + rnorm(10, 0, 5))
    )

    # --- Reactive Logic ---

    # Reactive expression to parse user-pasted data
    parsed_data <- reactive({
      req(input$custom_data)
      # Use read.table to flexibly handle delimiters (comma, tab, space)
      tryCatch({
        df <- read.table(text = input$custom_data, header = FALSE,
                         col.names = c("x", "y"), stringsAsFactors = FALSE,
                         fill = TRUE, blank.lines.skip = TRUE)
        # Ensure data is numeric and remove rows with NAs
        df$x <- as.numeric(df$x)
        df$y <- as.numeric(df$y)
        na.omit(df)
      }, error = function(e) {
        # Return NULL if parsing fails, preventing app from crashing
        return(NULL)
      })
    })

    # Main reactive expression for the dataset being used for analysis
    active_data <- reactive({
      if (input$data_source == "custom") {
        return(parsed_data())
      } else {
        return(sample_datasets[[input$sample_data_name]])
      }
    })

    # Reactive expression for the linear model
    model <- reactive({
      df <- active_data()
      # Require at least 2 valid data points to fit a line
      req(df, nrow(df) >= 2)
      lm(y ~ x, data = df)
    })

    # --- Render Outputs ---

    # Scatterplot
    output$scatterplot <- renderPlot({
      df <- active_data()
      req(df)

      p <- ggplot(df, aes(x = x, y = y)) +
        geom_point(color = "#1e40af", size = 3, alpha = 0.8) +
        labs(
          title = "Scatterplot of Response (Y) vs. Explanatory (X)",
          x = "Explanatory Variable (X)",
          y = "Response Variable (Y)"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))

      # Conditionally add the regression line
      if (input$show_line && !is.null(model())) {
        p <- p + geom_smooth(method = "lm", se = FALSE, color = "#dc2626", formula = y ~ x)
      }
      p
    })

    # Model Summary
    output$model_summary <- renderPrint({
      req(model())
      summary(model())
    })

    # Residual Plot
    output$residual_plot <- renderPlot({
      req(model())

      res_df <- data.frame(
        fitted = fitted(model()),
        residuals = residuals(model())
      )

      p <- ggplot(res_df, aes(x = fitted, y = residuals)) +
        geom_point(color = "#1e40af", size = 3, alpha = 0.8) +
        geom_hline(yintercept = 0, linetype = "dashed", color = "#dc2626", size = 1) +
        labs(
          title = "Residuals vs. Fitted Values",
          x = "Fitted Values (Predicted Y)",
          y = "Residuals (Observed - Predicted)"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"))
      p
    })

    # Descriptive Statistics
    output$descriptive_stats <- renderPrint({
      df <- active_data()
      req(df, nrow(df) > 1)

      # Capture summary output to format it nicely
      x_summary <- capture.output(summary(df$x))
      y_summary <- capture.output(summary(df$y))

      # Build the output string
      paste(
        "--- Explanatory Variable (X) ---",
        paste(x_summary, collapse = "\\n"),
        paste("Standard Deviation:", round(as.numeric(sd(df$x, na.rm = TRUE)), 3)),
        "",
        "--- Response Variable (Y) ---",
        paste(y_summary, collapse = "\\n"),
        paste("Standard Deviation:", round(as.numeric(sd(df$y, na.rm = TRUE)), 3)),
        "",
        "--- Relationship ---",
        paste("Correlation (r):", round(cor(df$x, df$y, use = "complete.obs"), 3)),
        sep = "\\n"
      )
    })

  })
}
