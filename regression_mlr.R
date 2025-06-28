# RShinyStapplet/regression_mlr.R

# UI function for the 'Multiple Linear Regression' applet
regression_mlr_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Multiple Linear Regression", id = ns("appTitle")),
      windowTitle = "Multiple Linear Regression"
    ),
    sidebarLayout(
      sidebarPanel(
        id = ns("sidebarPanel"),
        role = "form",
        "aria-labelledby" = ns("dataHeading"),

        h3("Data Input", id = ns("dataHeading")),
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
                        "Fuel Efficiency (mtcars)" = "mtcars",
                        "House Prices (Boston)" = "boston"
                      ))
        ),

        # Conditional panel for custom data
        conditionalPanel(
          condition = "input.data_source == 'custom'",
          ns = ns,
          checkboxInput(ns("has_header"), "Data includes a header row", value = TRUE),
          textAreaInput(ns("custom_data"), "Paste your data here:",
                        placeholder = "Example:\nprice,sqft,bedrooms,bathrooms\n250000,1500,3,2\n300000,1800,3,2.5\n...",
                        rows = 10),
          p("Data should be comma-separated, tab-separated, or space-separated.", class = "text-muted")
        ),

        hr(role = "separator"),
        h3("Variable Selection"),
        # Dynamic UI for selecting response variable
        uiOutput(ns("response_var_ui")),
        # Dynamic UI for selecting explanatory variables
        uiOutput(ns("explanatory_vars_ui")),

        hr(role = "separator"),
        h3("Analysis Options"),
        checkboxInput(ns("show_summary"), "Show Model Summary", value = TRUE),
        checkboxInput(ns("show_residuals"), "Show Residuals vs. Fitted Plot", value = TRUE),
        checkboxInput(ns("show_pairs"), "Show Pairs Plot", value = FALSE),
        checkboxInput(ns("show_stats"), "Show Descriptive Statistics", value = FALSE)
      ),
      mainPanel(
        id = ns("mainPanel"),
        role = "main",
        # Model Summary Output
        conditionalPanel(
          condition = "input.show_summary", ns = ns,
          div(class = "results-box",
              h4("Regression Model Summary", id = ns("modelSummaryHeading")),
              verbatimTextOutput(ns("model_summary"))
          )
        ),
        # Residual Plot Output
        conditionalPanel(
          condition = "input.show_residuals", ns = ns,
          div(class = "plot-container",
              h4("Residuals vs. Fitted Values Plot", id = ns("residualPlotHeading")),
              plotOutput(ns("residual_plot"))
          )
        ),
        # Pairs Plot Output
        conditionalPanel(
          condition = "input.show_pairs", ns = ns,
          div(class = "plot-container",
              h4("Pairs Plot of Variables", id = ns("pairsPlotHeading")),
              plotOutput(ns("pairs_plot"))
          )
        ),
        # Descriptive Statistics Output
        conditionalPanel(
          condition = "input.show_stats", ns = ns,
          div(class = "results-box",
              h4("Descriptive Statistics", id = ns("descStatsHeading")),
              verbatimTextOutput(ns("descriptive_stats"))
          )
        )
      )
    )
  )
}

# Server function for the 'Multiple Linear Regression' applet
regression_mlr_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Pre-defined Sample Datasets ---
    sample_datasets <- list(
      mtcars = mtcars[, c("mpg", "wt", "hp", "qsec")],
      boston = as.data.frame(MASS::Boston[, c("medv", "lstat", "rm", "age")])
    )


    # --- Reactive Logic ---

    # Main reactive expression for the dataset being used for analysis
    active_data <- reactive({
      if (input$data_source == "custom") {
        req(input$custom_data)
        tryCatch({
          df <- read.table(text = input$custom_data, header = input$has_header,
                           sep = ",", stringsAsFactors = FALSE, fill = TRUE,
                           blank.lines.skip = TRUE)
          # A simple heuristic to try other separators if comma fails
          if (ncol(df) < 2) {
             df <- read.table(text = input$custom_data, header = input$has_header,
                           stringsAsFactors = FALSE, fill = TRUE, blank.lines.skip = TRUE)
          }
          # Keep only numeric columns
          df[sapply(df, is.numeric)]
        }, error = function(e) {
          return(NULL)
        })
      } else {
        sample_datasets[[input$sample_data_name]]
      }
    })

    # Get column names from the active data
    data_colnames <- reactive({
      df <- active_data()
      req(df)
      colnames(df)
    })

    # --- Dynamic UI Rendering ---

    # Render UI for selecting the response variable (Y)
    output$response_var_ui <- renderUI({
      cols <- data_colnames()
      req(cols)
      selectInput(ns("response_var"), "Response Variable (Y):",
                  choices = cols, selected = cols[1])
    })

    # Render UI for selecting explanatory variables (X)
    output$explanatory_vars_ui <- renderUI({
      cols <- data_colnames()
      req(cols, input$response_var)
      # Exclude the response variable from the choices
      explanatory_choices <- setdiff(cols, input$response_var)
      checkboxGroupInput(ns("explanatory_vars"), "Explanatory Variables (X):",
                         choices = explanatory_choices,
                         selected = explanatory_choices[1])
    })

    # --- Model Fitting ---

    # Reactive expression for the linear model
    model <- reactive({
      df <- active_data()
      req(df, input$response_var, input$explanatory_vars, length(input$explanatory_vars) > 0)

      # Construct the formula string
      formula_str <- paste(input$response_var, "~", paste(input$explanatory_vars, collapse = " + "))
      lm(as.formula(formula_str), data = df)
    })

    # --- Render Outputs ---

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
        geom_point(color = "#1e40af", size = 3, alpha = 0.7) +
        geom_hline(yintercept = 0, linetype = "dashed", color = "#dc2626", linewidth = 1) +
        labs(
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
      req(df, input$response_var, input$explanatory_vars)
      selected_cols <- c(input$response_var, input$explanatory_vars)
      # Ensure selected columns exist in the dataframe
      df_subset <- df[, intersect(selected_cols, colnames(df)), drop = FALSE]
      req(ncol(df_subset) > 0)

      cat("--- Summary Statistics ---\n")
      print(summary(df_subset))

      if (ncol(df_subset) > 1) {
        cat("\n--- Correlation Matrix ---\n")
        print(round(cor(df_subset, use = "complete.obs"), 3))
      }
    })

    # Pairs Plot
    output$pairs_plot <- renderPlot({
        df <- active_data()
        req(df, input$response_var, input$explanatory_vars)
        selected_cols <- c(input$response_var, input$explanatory_vars)
        df_subset <- df[, intersect(selected_cols, colnames(df)), drop = FALSE]
        req(ncol(df_subset) > 1)

        # Use GGally for a more informative pairs plot if available
        if (requireNamespace("GGally", quietly = TRUE)) {
            p <- GGally::ggpairs(df_subset,
                upper = list(continuous = GGally::wrap("cor", size = 4)),
                lower = list(continuous = GGally::wrap("points", alpha = 0.5, size=2)),
                diag = list(continuous = GGally::wrap("densityDiag", alpha = 0.5))
            ) + theme_minimal()
            p
        } else {
            # Fallback to base R pairs plot
            pairs(df_subset, pch = 19, col = alpha("#1e40af", 0.7),
                  main = "Pairs Plot of Selected Variables")
        }
    })
  })
}
