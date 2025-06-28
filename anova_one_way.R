# StappletSHiny/anova_one_way.R

# UI function for the 'One-Way ANOVA' applet
anova_one_way_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("One-Way ANOVA Test", id = "appTitle"),
      windowTitle = "One-Way ANOVA"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",

        h3("Data Input & Settings", id = "paramsHeading"),
        # Text area for data input
        p("Enter data as two columns (Group,Value). Each entry should be on a new line."),
        textAreaInput(ns("data_input"),
                      label = "Paste Data:",
                      value = "GroupA,25\nGroupA,28\nGroupA,23\nGroupA,26\nGroupB,32\nGroupB,35\nGroupB,30\nGroupB,33\nGroupC,22\nGroupC,24\nGroupC,21\nGroupC,25",
                      rows = 10,
                      placeholder = "Example:\nGroupA,Value1\nGroupA,Value2\nGroupB,Value3..."),

        # Significance level
        sliderInput(ns("alpha"), "Significance Level (α)", min = 0.01, max = 0.10, value = 0.05, step = 0.01),

        # Action button
        actionButton(ns("run_analysis"), "Run ANOVA Analysis", class = "btn-primary", style = "width: 100%;")
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Boxplot visualization
        div(class = "plot-container",
            h4("Group Distributions", style = "text-align: center;"),
            htmltools::tagQuery(
              plotOutput(ns("boxPlot"))
            )$find("img")$addAttrs("aria-labelledby" = ns("appTitle"))$all()
        ),
        # Results boxes
        fluidRow(
          column(6,
            div(class = "results-box",
                h3("Descriptive Statistics"),
                tableOutput(ns("descriptiveStats"))
            )
          ),
          column(6,
            div(class = "results-box",
                h3("ANOVA Summary Table"),
                htmltools::tagQuery(
                  verbatimTextOutput(ns("anovaSummary"))
                )$find("pre")$addAttrs("aria-labelledby" = ns("appTitle"))$all()
            )
          )
        ),
        fluidRow(
          column(12,
            div(class = "results-box",
                h3("Conclusion"),
                htmltools::tagQuery(
                  textOutput(ns("conclusion"))
                )$find("output")$addAttrs("aria-labelledby" = ns("appTitle"))$all()
            )
          )
        )
      )
    )
  )
}

# Server function for the 'One-Way ANOVA' applet
anova_one_way_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive values to store results
    rv <- reactiveValues(
      data = NULL,
      anova_results = NULL,
      descriptive_stats = NULL,
      p_value = NULL
    )

    # Event handler for running the analysis
    observeEvent(input$run_analysis, {
      req(input$data_input)

      # Try to parse the data
      parsed_data <- tryCatch({
        df <- read.csv(text = input$data_input, header = FALSE, stringsAsFactors = TRUE, col.names = c("Group", "Value"))

        # Validate data frame structure
        if (ncol(df) != 2) {
          stop("Data must have exactly two columns: Group and Value.")
        }
        if (!is.numeric(df$Value)) {
          stop("The second column ('Value') must be numeric.")
        }
        if (length(unique(df$Group)) < 2) {
            stop("There must be at least two groups to perform an ANOVA test.")
        }
        df$Group <- as.factor(df$Group) # Ensure Group is a factor
        df
      }, error = function(e) {
        # Show error message to the user
        showNotification(paste("Error parsing data:", e$message), type = "error", duration = 10)
        return(NULL)
      })

      if (is.null(parsed_data)) {
        # Reset reactive values on error
        rv$data <- NULL
        rv$anova_results <- NULL
        rv$descriptive_stats <- NULL
        rv$p_value <- NULL
        return()
      }

      rv$data <- parsed_data

      # Calculate descriptive statistics using dplyr
      if (require(dplyr)) {
          rv$descriptive_stats <- parsed_data %>%
            group_by(Group) %>%
            summarise(
              N = n(),
              Mean = mean(Value, na.rm = TRUE),
              SD = sd(Value, na.rm = TRUE),
              Median = median(Value, na.rm = TRUE),
              .groups = 'drop'
            )
      }


      # Perform ANOVA
      anova_model <- aov(Value ~ Group, data = parsed_data)
      rv$anova_results <- summary(anova_model)
      rv$p_value <- rv$anova_results[[1]][["Pr(>F)"]][1]
    })

    # --- Render Outputs ---

    # Boxplot
    output$boxPlot <- renderPlot({
      if (is.null(rv$data)) {
        return(ggplot() + labs(title = "Please enter valid data and run the analysis.") + theme_void())
      }

      ggplot(rv$data, aes(x = Group, y = Value, fill = Group)) +
        geom_boxplot(alpha = 0.7, outlier.colour = "red") +
        geom_jitter(width = 0.1, alpha = 0.5, height = 0) +
        labs(title = "Comparison of Group Distributions", x = "Group", y = "Value") +
        theme_minimal(base_size = 14) +
        theme(legend.position = "none", plot.title = element_text(hjust = 0.5, face = "bold"))
    })

    # ANOVA Summary Table
    output$anovaSummary <- renderPrint({
      if (is.null(rv$anova_results)) {
        cat("Analysis has not been run yet.")
      } else {
        print(rv$anova_results)
      }
    })

    # Descriptive Statistics Table
    output$descriptiveStats <- renderTable({
      if (is.null(rv$descriptive_stats)) {
        return(NULL)
      }
      rv$descriptive_stats
    }, striped = TRUE, hover = TRUE, bordered = TRUE, digits = 3)

    # Conclusion Text
    output$conclusion <- renderText({
      req(rv$p_value, input$alpha)

      p_val <- rv$p_value
      alpha <- input$alpha

      if (p_val < alpha) {
        paste0("Since the p-value (", sprintf("%.4f", p_val), ") is less than the significance level α (", alpha, "), ",
               "we reject the null hypothesis. There is statistically significant evidence of a difference in means between at least two of the groups.")
      } else {
        paste0("Since the p-value (", sprintf("%.4f", p_val), ") is greater than or equal to the significance level α (", alpha, "), ",
               "we fail to reject the null hypothesis. There is not enough evidence to conclude that there is a significant difference in means among the groups.")
      }
    })
  })
}
