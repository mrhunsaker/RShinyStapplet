# activity_candy_chi_square.R

library(shiny)
library(ggplot2)
library(dplyr)

# UI for the "M&M's/Skittles/Froot Loops" Chi-Square GOF Activity
activity_candy_chi_square_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title and Instructions
    h2("Activity: Chi-Square Goodness-of-Fit Test for Candy"),
    wellPanel(
      h3("Instructions"),
      p("This activity lets you test if a sample of categorical data (like the colors in a bag of candy) matches a claimed distribution (e.g., the percentages the candy company says they produce)."),
      tags$ol(
        tags$li("First, define the categories. Enter the number of colors you want to test."),
        tags$li("For each color, enter its name, the company's claimed proportion (as a decimal), and the actual count you observed in your sample bag."),
        tags$li("The app will calculate the 'Observed Chi-Square (χ²)' value from your data. This value measures the total difference between the company's claim and your data."),
        tags$li(strong("The Simulation:"), "To see if that χ² value is statistically large, we test the null hypothesis that your bag is a typical sample from the company's claimed distribution."),
        tags$ul(
          tags$li("We will create a new, simulated bag of candy *based on the company's claims* and calculate its χ² value."),
          tags$li("We repeat this process thousands of times to see what kind of χ² values we get when the null hypothesis is true."),
        ),
        tags$li("Click 'Run Simulation' to perform this process."),
        tags$li("The plot shows the distribution of simulated χ² values. The red line marks your bag's actual χ² value. The p-value is the proportion of simulated bags that had a χ² value as large or larger than yours, just by random chance.")
      )
    ),

    # Sidebar layout
    sidebarLayout(
      sidebarPanel(
        h4("Define Categories & Data"),
        div(class = "form-group",
            tags$label("Number of Categories (Colors):", `for` = ns("num_cat")),
            numericInput(ns("num_cat"), label = NULL, value = 6, min = 2, max = 10),
            tags$p(id = ns("num_cat_desc"), class = "sr-only", "Enter the number of distinct categories, like colors of candy, to test."),
            tags$script(paste0("document.getElementById('", ns("num_cat"), "').setAttribute('aria-describedby', '", ns("num_cat_desc"), "')"))
        ),
        hr(),
        uiOutput(ns("category_inputs")),
        hr(),
        h4("Run the Simulation"),
        div(class = "form-group",
            tags$label("Number of Simulations:", `for` = ns("num_sims")),
            numericInput(ns("num_sims"), label = NULL, value = 1000, min = 100, max = 10000, step = 100),
            tags$p(id = ns("num_sims_desc"), class = "sr-only", "Enter the number of times to create a simulated bag of candy."),
            tags$script(paste0("document.getElementById('", ns("num_sims"), "').setAttribute('aria-describedby', '", ns("num_sims_desc"), "')"))
        ),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        hr(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Observed Chi-Square (χ²)"),
            uiOutput(ns("chi_square_result"))
        ),
        br(),
        div(class = "results-box", role = "status", `aria-live` = "polite",
            h4("Simulation p-value"),
            uiOutput(ns("p_value_result"))
        )
      ),
      mainPanel(
        div(class = "plot-container",
            plotOutput(ns("sim_plot")),
            tags$script(paste0("document.getElementById('", ns("sim_plot"), "').setAttribute('aria-label', 'A histogram showing the distribution of simulated Chi-Square values. A red line indicates the observed Chi-Square value from the sample data.')")),
            uiOutput(ns("plot_desc"))
        )
      )
    )
  )
}

# Server logic for the Chi-Square GOF Activity
activity_candy_chi_square_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Dynamic UI for Categories ---
    output$category_inputs <- renderUI({
      num <- as.integer(input$num_cat)
      if (is.na(num) || num < 2) return()

      # Default values for M&Ms
      defaults <- list(
        names = c("Blue", "Orange", "Green", "Yellow", "Red", "Brown"),
        props = c(0.24, 0.20, 0.16, 0.14, 0.13, 0.13),
        counts = c(10, 8, 7, 6, 6, 5)
      )

      lapply(1:num, function(i) {
        fluidRow(
          column(4, textInput(ns(paste0("cat_name_", i)), "Color", value = defaults$names[i])),
          column(4, numericInput(ns(paste0("cat_prop_", i)), "Claimed %", value = defaults$props[i], min = 0, max = 1, step = 0.01)),
          column(4, numericInput(ns(paste0("cat_count_", i)), "Observed #", value = defaults$counts[i], min = 0))
        )
      })
    })

    # --- Reactive Data Handling ---
    # Gather all dynamic inputs into a reactive data frame
    input_data <- reactive({
      req(input$num_cat)
      num <- as.integer(input$num_cat)

      # Trigger reactivity when any of the inputs change
      sapply(1:num, function(i) {
        list(input[[paste0("cat_name_", i)]], input[[paste0("cat_prop_", i)]], input[[paste0("cat_count_", i)]])
      })

      isolate({
        names <- sapply(1:num, function(i) input[[paste0("cat_name_", i)]])
        props <- sapply(1:num, function(i) input[[paste0("cat_prop_", i)]])
        counts <- sapply(1:num, function(i) input[[paste0("cat_count_", i)]])

        if (any(sapply(c(names, props, counts), is.null))) return(NULL)

        data.frame(
          category = names,
          claimed_prop = props,
          observed_count = counts
        )
      })
    })

    # Calculate the observed Chi-Square statistic
    observed_chi_square <- reactive({
      df <- input_data()
      req(df)

      # Validation
      if (abs(sum(df$claimed_prop) - 1) > 1e-6) {
        return("Error: Claimed proportions must sum to 1.")
      }

      total_observed <- sum(df$observed_count)
      if (total_observed == 0) return("Enter observed counts.")

      df <- df %>%
        mutate(expected_count = claimed_prop * total_observed)

      if (any(df$expected_count < 5)) {
        showModal(modalDialog(title = "Warning", "At least one category has an expected count less than 5. The results of the Chi-Square test may not be reliable."))
      }

      chi_square_val <- sum((df$observed_count - df$expected_count)^2 / df$expected_count)
      return(chi_square_val)
    })

    output$chi_square_result <- renderUI({
      val <- observed_chi_square()
      if (is.character(val)) {
        p(val, style = "color: red;")
      } else {
        p(strong("χ² = "), round(val, 3))
      }
    })

    # --- Simulation Logic ---
    sim_results <- eventReactive(input$run_sim, {
      df <- input_data()
      req(df)

      obs_chi <- observed_chi_square()
      if (is.character(obs_chi)) {
        showModal(modalDialog(title = "Input Error", obs_chi, easyClose = TRUE))
        return(NULL)
      }

      n_sims <- input$num_sims
      total_observed <- sum(df$observed_count)
      claimed_props <- df$claimed_prop

      # Run simulation using rmultinom
      sim_counts <- rmultinom(n = n_sims, size = total_observed, prob = claimed_props)

      expected_counts <- total_observed * claimed_props

      # Calculate chi-square for each simulation (column)
      sim_chi_squares <- apply(sim_counts, 2, function(sim_col) {
        sum((sim_col - expected_counts)^2 / expected_counts)
      })

      data.frame(chi_square = sim_chi_squares)
    })

    # --- Outputs ---
    output$sim_plot <- renderPlot({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(ggplot() + labs(title = "Distribution of Simulated χ² Values", subtitle = "Click 'Run Simulation' to generate this plot") + theme_minimal())
      }

      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))

      p <- ggplot(df_sim, aes(x = chi_square)) +
        geom_histogram(aes(y = ..density..), bins = 30, fill = "#3b82f6", color = "white", alpha = 0.7) +
        geom_density(color = "#1d4ed8", size = 1) +
        geom_vline(xintercept = obs_chi, color = "#ef4444", size = 1.5, linetype = "dashed") +
        labs(
          title = "Distribution of Simulated χ² Values",
          subtitle = paste(input$num_sims, "simulated bags of candy"),
          x = "Simulated Chi-Square (χ²) Value",
          y = "Density"
        ) +
        theme_minimal(base_size = 14) +
        theme(plot.title = element_text(hjust = 0.5, face = "bold"), plot.subtitle = element_text(hjust = 0.5))

      # Shade p-value area
      p_val_area <- df_sim %>% filter(chi_square >= obs_chi)
      if (nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = chi_square, y = ..density..), bins = 30, fill = "#ef4444", alpha = 0.8)
      }
      p
    })

    output$p_value_result <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) return(p("Run simulation to get p-value."))

      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))

      p_value <- sum(df_sim$chi_square >= obs_chi) / nrow(df_sim)

      tagList(
        p(strong("p-value: "), round(p_value, 4)),
        p("The proportion of simulated bags with a χ² value as or more extreme than yours.")
      )
    })

    output$plot_desc <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) return(p(class = "sr-only", "Plot is empty. Run simulation."))

      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))
      p_value <- sum(df_sim$chi_square >= obs_chi) / nrow(df_sim)

      p(class = "sr-only", paste("Simulation complete. The histogram shows the distribution of chi-square values from random samples. Your observed value of", round(obs_chi, 3), "is marked with a red line. The p-value is", round(p_value, 4)))
    })

  })
}
