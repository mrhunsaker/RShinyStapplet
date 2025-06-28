# StappletSHiny/ht_chi_ind.R

# UI function for the 'Chi-Square Test for Independence' applet
ht_chi_ind_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Chi-Square Test for Independence"),
      windowTitle = "Chi-Square Test for Independence"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "setupHeading",
        h3("Contingency Table Setup", id = "setupHeading"),
        # Input for number of rows
        div(
          class = "form-group",
          tags$label(id = ns("rows_label"), "Number of Rows (Categories of Var 1):"),
          htmltools::tagQuery(
            numericInput(ns("num_rows"), NULL, value = 2, min = 2, max = 5, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("rows_label"))$all()
        ),
        # Input for number of columns
        div(
          class = "form-group",
          tags$label(id = ns("cols_label"), "Number of Columns (Categories of Var 2):"),
          htmltools::tagQuery(
            numericInput(ns("num_cols"), NULL, value = 2, min = 2, max = 5, step = 1)
          )$find("input")$addAttrs("aria-labelledby" = ns("cols_label"))$all()
        ),
        hr(role = "separator"),
        h3("Enter Observed Counts"),
        # Dynamic UI for the table input
        uiOutput(ns("contingency_table_input")),
        hr(role = "separator"),
        actionButton(ns("calculate"), "Calculate Test Results", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Use a reactive value to control visibility of the results area
        uiOutput(ns("results_area"))
      )
    )
  )
}

# Server function for the 'Chi-Square Test for Independence' applet
ht_chi_ind_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Reactive value to store the results of the chi-square test
    results <- eventReactive(input$calculate, {
      req(input$num_rows, input$num_cols)

      # Create an empty matrix to hold the table values
      table_vals <- matrix(NA, nrow = input$num_rows, ncol = input$num_cols)

      # Populate the matrix with values from the dynamic UI
      for (i in 1:input$num_rows) {
        for (j in 1:input$num_cols) {
          input_id <- paste0("cell_", i, "_", j)
          # Ensure input is not NULL and is a number
          if (!is.null(input[[input_id]]) && is.numeric(input[[input_id]])) {
            table_vals[i, j] <- input[[input_id]]
          } else {
            # Return an error message if a cell is empty
            return(list(error = "All cells in the contingency table must have a numeric value."))
          }
        }
      }

      # Check for non-negative values
      if(any(table_vals < 0)) {
        return(list(error = "Counts cannot be negative."))
      }

      # Perform the chi-square test
      # Use tryCatch to handle potential errors from chisq.test
      test_output <- tryCatch({
        # Suppress warnings to capture them manually
        withCallingHandlers({
          chisq.test(table_vals, simulate.p.value = FALSE)
        }, warning = function(w) {
          # Store warning message in a custom field
          test_output_with_warning$warning_message <<- w$message
          invokeRestart("muffleWarning")
        })
      }, error = function(e) {
        return(list(error = paste("Error in chi-square calculation:", e$message)))
      })

      # A bit of a workaround to capture both result and warning
      test_output_with_warning <- test_output

      return(test_output_with_warning)
    })

    # Dynamic UI for contingency table input
    output$contingency_table_input <- renderUI({
      req(input$num_rows, input$num_cols)

      # Create a grid layout for the inputs
      grid <- div(style = paste0("display: grid; grid-template-columns: repeat(", input$num_cols, ", 1fr); grid-gap: 5px;"))

      input_tags <- lapply(1:(input$num_rows * input$num_cols), function(k) {
        i <- (k - 1) %/% input$num_cols + 1
        j <- (k - 1) %% input$num_cols + 1
        input_id <- ns(paste0("cell_", i, "_", j))
        numericInput(input_id, label = NULL, value = 10, min = 0)
      })

      do.call(div, c(list(style = paste0("display: grid; grid-template-columns: repeat(", input$num_cols, ", 1fr); grid-gap: 5px;")), input_tags))
    })

    # UI for the main results area, shown after calculation
    output$results_area <- renderUI({
      # Show this UI only after the calculate button has been pressed
      req(input$calculate > 0)

      ns <- session$ns # ensure namespace is available

      tagList(
        fluidRow(
          column(12,
            div(class = "plot-container",
              h4("Mosaic Plot of Observed Counts", style = "text-align: center;", id = ns("mosaicPlotHeading")),
              htmltools::tagQuery(
                plotOutput(ns("mosaicPlot"), height = "350px")
              )$find("img")$addAttrs("aria-labelledby" = ns("mosaicPlotHeading"))$all()
            )
          )
        ),
        fluidRow(
          column(6,
            div(class = "results-box",
              h4("Observed Counts", id = ns("observedTableHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("observedTable"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("observedTableHeading"))$all()
            )
          ),
          column(6,
            div(class = "results-box",
              h4("Expected Counts", id = ns("expectedTableHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("expectedTable"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("expectedTableHeading"))$all()
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
              h3("Chi-Square Test Results", id = ns("testResultsHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("testResults"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("testResultsHeading"))$all()
            )
          )
        )
      )
    })

    # Render the mosaic plot
    output$mosaicPlot <- renderPlot({
      res <- results()
      req(is.list(res) && is.null(res$error))

      observed_counts <- res$observed
      dimnames(observed_counts) <- list(
        paste("Var1-Cat", 1:nrow(observed_counts)),
        paste("Var2-Cat", 1:ncol(observed_counts))
      )

      graphics::mosaicplot(observed_counts, main = "Mosaic Plot of Observed vs. Expected Counts",
                           color = TRUE, shade = TRUE, xlab = "Variable 1", ylab = "Variable 2")
    })

    # Render the observed counts table
    output$observedTable <- renderPrint({
      res <- results()
      req(is.list(res) && is.null(res$error))
      cat("Observed Counts:\n")
      print(res$observed)
    })

    # Render the expected counts table
    output$expectedTable <- renderPrint({
      res <- results()
      req(is.list(res) && is.null(res$error))
      cat("Expected Counts (under independence):\n")
      print(round(res$expected, 2))
    })

    # Render the main test results
    output$testResults <- renderPrint({
      res <- results()

      if (!is.null(res$error)) {
        cat(res$error)
        return()
      }

      cat("Hypotheses:\n")
      cat("  H0: The two categorical variables are independent.\n")
      cat("  Ha: The two categorical variables are not independent (associated).\n\n")

      cat("Test Results:\n")
      cat("  Chi-Square Statistic (X-squared):", round(res$statistic, 4), "\n")
      cat("  Degrees of Freedom (df):", res$parameter, "\n")
      cat("  p-value:", format.p.val(res$p.value, digits = 4), "\n\n")

      alpha <- 0.05 # Standard significance level
      cat(paste0("Conclusion (at alpha = ", alpha, "):\n"))
      if (res$p.value < alpha) {
        cat("  Since the p-value is less than alpha, we reject the null hypothesis.\n")
        cat("  There is significant evidence to conclude that the variables are associated.\n")
      } else {
        cat("  Since the p-value is not less than alpha, we fail to reject the null hypothesis.\n")
        cat("  There is not significant evidence to conclude that the variables are associated.\n")
      }

      if (!is.null(res$warning_message)) {
        cat("\nWarning from R:\n  ", res$warning_message, "\n")
      }
    })
  })
}
