# StappletSHiny/tools_descriptive.R

# UI function for the 'Descriptive Statistics' tool
tools_descriptive_ui <- function(id) {
  ns <- NS(id) # Create a namespace
  fluidPage(
    # Application Title
    titlePanel(
      h2("Descriptive Statistics Calculator", id = "appTitle"),
      windowTitle = "Descriptive Statistics"
    ),
    sidebarLayout(
      sidebarPanel(
        id = "sidebarPanel",
        role = "form",
        "aria-labelledby" = "dataHeading",

        h3("Data Input", id = "dataHeading"),
        # Text area for data input
        div(
          class = "form-group",
          tags$label(id = ns("data_label"), "Enter your data (one value per line):"),
          htmltools::tagQuery(
            textAreaInput(ns("user_data"), NULL,
                          placeholder = "e.g.\n84\n92\n78\n...",
                          rows = 10)
          )$find("textarea")$addAttrs(
            "aria-labelledby" = ns("data_label"),
            "aria-describedby" = ns("data_help")
          )$all()
        ),
        p(id = ns("data_help"), class = "sr-only", "Enter each numerical data point on a new line. Non-numeric values will be ignored."),

        hr(role = "separator"),
        h3("Visualization Options"),
        # Select plot type
        div(
          class = "form-group",
          tags$label(id = ns("plot_type_label"), "Select Plot Type:"),
          htmltools::tagQuery(
            selectInput(ns("plot_type"), NULL,
                        choices = c("Histogram", "Boxplot", "Dotplot"),
                        selected = "Histogram")
          )$find("select")$addAttrs("aria-labelledby" = ns("plot_type_label"))$all()
        ),
        # Conditional panel for histogram bins
        conditionalPanel(
          condition = "input.plot_type == 'Histogram'",
          ns = ns,
          div(
            class = "form-group",
            tags$label(id = ns("hist_bins_label"), "Number of Bins for Histogram:"),
            htmltools::tagQuery(
              sliderInput(ns("hist_bins"), NULL, min = 1, max = 50, value = 10)
            )$find("input")$addAttrs("aria-labelledby" = ns("hist_bins_label"))$all()
          )
        )
      ),
      mainPanel(
        id = "mainPanel",
        role = "main",
        # Summary Statistics Output
        div(class = "results-box",
            h3("Summary Statistics", id = ns("summaryStatsHeading")),
            htmltools::tagQuery(
                verbatimTextOutput(ns("summaryStats"), placeholder = TRUE)
            )$find("pre")$addAttrs("aria-labelledby" = ns("summaryStatsHeading"))$all()
        ),
        # Plot Output
        div(class = "plot-container",
            htmltools::tagQuery(
                plotOutput(ns("descriptivePlot"), height = "400px")
            )$find("img")$addAttrs("aria-labelledby" = ns("summaryStatsHeading"))$all()
        )
      )
    )
  )
}

# Server function for the 'Descriptive Statistics' tool
tools_descriptive_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # Reactive expression to parse and clean the user's data
    parsed_data <- reactive({
      req(input$user_data) # Require data to be present
      # Split text by newlines, convert to numeric, and remove NAs
      data_vector <- as.numeric(unlist(strsplit(input$user_data, "\\s*\\n\\s*")))
      data_vector <- na.omit(data_vector)

      # Return NULL if no valid data points remain, to be checked downstream
      if (length(data_vector) == 0) {
        return(NULL)
      }
      data_vector
    })

    # --- Render Summary Statistics ---
    output$summaryStats <- renderPrint({
      data <- parsed_data()
      if (is.null(data) || length(data) < 1) {
        cat("Please enter valid numeric data to see statistics.")
        return()
      }

      cat("Count (n): ", length(data), "\n")
      cat("Mean:      ", round(mean(data), 4), "\n")
      cat("Std Dev:   ", round(sd(data), 4), "\n")
      cat("Median:    ", round(median(data), 4), "\n")
      cat("IQR:       ", round(IQR(data), 4), "\n")
      cat("Min:       ", round(min(data), 4), "\n")
      cat("Max:       ", round(max(data), 4), "\n\n")

      cat("Five-Number Summary (Min, Q1, Median, Q3, Max):\n")
      print(summary(data))
    })

    # --- Render Plot ---
    output$descriptivePlot <- renderPlot({
      data <- parsed_data()
      if (is.null(data) || length(data) < 1) {
        # Display a message if no data is available
        return(
          ggplot() +
          labs(title = "No valid data to plot",
               subtitle = "Please enter numeric data in the sidebar.") +
          theme_minimal() +
          theme(plot.title = element_text(hjust = 0.5, size=16),
                plot.subtitle = element_text(hjust = 0.5, size=12))
        )
      }

      df <- data.frame(value = data)
      plot_type <- input$plot_type

      if (plot_type == "Histogram") {
        ggplot(df, aes(x = value)) +
          geom_histogram(bins = input$hist_bins, fill = "#60a5fa", color = "white", alpha = 0.8) +
          labs(title = "Histogram of Your Data", x = "Value", y = "Frequency") +
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"))

      } else if (plot_type == "Boxplot") {
        ggplot(df, aes(y = value)) +
          geom_boxplot(fill = "#84cc16", color = "#3f6212", alpha = 0.8, width=0.5) +
          labs(title = "Boxplot of Your Data", y = "Value") +
          coord_flip() + # Horizontal boxplot is often easier to read
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"),
                axis.title.x = element_text(),
                axis.text.y = element_blank(), # No y-axis labels needed for single boxplot
                axis.ticks.y = element_blank())

      } else if (plot_type == "Dotplot") {
        ggplot(df, aes(x = value)) +
          geom_dotplot(binwidth = (max(data) - min(data)) / 30, fill = "#fbbf24", color = "#b45309", alpha = 0.9) +
          labs(title = "Dotplot of Your Data", x = "Value", y = "") +
          theme_minimal(base_size = 14) +
          theme(plot.title = element_text(hjust = 0.5, face = "bold"),
                axis.text.y = element_blank(),
                axis.ticks.y = element_blank())
      }
    })

  })
}
