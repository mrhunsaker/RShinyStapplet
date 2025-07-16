# Chi-Square Goodness-of-Fit Activity Module (Patched for Robustness)
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.

library(shiny)
library(ggplot2)
library(dplyr)
library(shinyjs)

# UI function for the Chi-Square Goodness-of-Fit Activity
activity_candy_chi_square_ui <- function(id) {
  ns <- NS(id)
  tagList(
    h2("Candy Color Chi-Square Goodness-of-Fit Test"),
    sidebarLayout(
      sidebarPanel(
        h4("Instructions"),
        p("Enter the observed counts for each candy color, and the claimed proportions (expected percentages)."),
        numericInput(ns("num_cat"), "Number of Categories", value = 6, min = 2, max = 12, step = 1),
        uiOutput(ns("category_inputs")),
        hr(),
        radioButtons(ns("input_mode"), "Input Mode", choices = c("Table" = "table", "Raw Data" = "raw"), selected = "table"),
        conditionalPanel(
          sprintf("input['%s'] == 'raw'", ns("input_mode")),
          textAreaInput(ns("raw_data"), "Paste raw color data (comma or space separated)", rows = 3),
          uiOutput(ns("raw_error"))
        ),
        actionButton(ns("run_sim"), "Run Simulation", class = "btn-primary"),
        numericInput(ns("num_sims"), "Number of Simulations", value = 1000, min = 100, max = 10000, step = 100)
      ),
      mainPanel(
        h3("Results"),
        uiOutput(ns("chi_square_result")),
        plotOutput(ns("sim_plot")),
        uiOutput(ns("plot_desc")),
        uiOutput(ns("p_value_result")),
        uiOutput(ns("sim_stats_ui"))
      )
    )
  )
}

# Server logic for the Chi-Square Goodness-of-Fit Activity
activity_candy_chi_square_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns # Namespace for module inputs/outputs

    # --- Dynamic UI for Categories ---
    output$category_inputs <- renderUI({
      num <- as.integer(input$num_cat)
      if (is.null(num) || is.na(num) || num < 2) {
        return()
      }
      defaults <- list(
        names = c("Blue", "Orange", "Green", "Yellow", "Red", "Brown"),
        props = c(0.24, 0.20, 0.16, 0.14, 0.13, 0.13),
        counts = c(10, 8, 7, 6, 6, 5)
      )
      lapply(1:num, function(i) {
        fluidRow(
          column(4, tags$div(
            `aria-label` = paste("Color name for category", i),
            textInput(ns(paste0("cat_name_", i)), "Color", value = ifelse(i <= length(defaults$names), defaults$names[i], ""))
          )),
          column(4, tags$div(
            `aria-label` = paste("Claimed proportion for category", i),
            numericInput(ns(paste0("cat_prop_", i)), "Claimed %", value = ifelse(i <= length(defaults$props), defaults$props[i], NA), min = 0, max = 1, step = 0.01)
          )),
          column(4, tags$div(
            `aria-label` = paste("Observed count for category", i),
            numericInput(ns(paste0("cat_count_", i)), "Observed #", value = ifelse(i <= length(defaults$counts), defaults$counts[i], NA), min = 0)
          ))
        )
      })
    })

    # --- Raw Data Parsing ---
    raw_counts <- reactive({
      req(input$raw_data)
      cats <- unlist(strsplit(input$raw_data, "[,\\s]+"))
      cats <- cats[cats != ""]
      as.data.frame(table(cats), stringsAsFactors = FALSE)
    })

    # Displays error if not enough categories in raw data
    output$raw_error <- renderUI({
      df <- raw_counts()
      if (is.null(df) || nrow(df) < 2) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: At least two categories required. Please enter at least two distinct categories for analysis."),
            tags$span(class = "sr-only", "Form validation error: At least two categories required. This message is announced for screen reader users.")
          )
        )
      }
      ""
    })

    # --- Gather Data for Analysis ---
    input_data <- reactive({
      if (input$input_mode == "table") {
        req(input$num_cat)
        num <- as.integer(input$num_cat)
        names <- sapply(1:num, function(i) input[[paste0("cat_name_", i)]])
        props <- sapply(1:num, function(i) input[[paste0("cat_prop_", i)]])
        counts <- sapply(1:num, function(i) input[[paste0("cat_count_", i)]])
        if (is.null(names) || length(names) == 0 || any(is.null(names)) ||
          is.null(props) || length(props) == 0 || any(is.null(props)) ||
          is.null(counts) || length(counts) == 0 || any(is.null(counts))) {
          return(
            div(
              role = "status",
              `aria-live` = "assertive",
              style = "color: red; font-weight: bold;",
              tags$span("Error: All cells must be filled. Please enter a name, claimed proportion, and observed count for every category."),
              tags$span(class = "sr-only", "Form validation error: All cells must be filled. This message is announced for screen reader users.")
            )
          )
        }
        data.frame(
          category = names,
          claimed_prop = props,
          observed_count = counts,
          stringsAsFactors = FALSE
        )
      } else if (input$input_mode == "raw") {
        df <- raw_counts()
        if (is.null(df) || nrow(df) == 0) {
          return(NULL)
        }
        data.frame(
          category = df$cats,
          claimed_prop = rep(1 / nrow(df), nrow(df)), # Default: uniform claim if raw data
          observed_count = df$Freq,
          stringsAsFactors = FALSE
        )
      }
    })

    # --- Chi-Square Calculation ---
    observed_chi_square <- reactive({
      df <- input_data()
      req(df)
      # Validation checks
      if (is.null(df$category) || length(df$category) == 0) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: No categories detected. Please enter at least one category for analysis."),
            tags$span(class = "sr-only", "Form validation error: No categories detected. This message is announced for screen reader users.")
          )
        )
      }
      if (!is.null(df$category) && length(df$category) > 0 && any(duplicated(df$category))) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: Duplicate category names detected. Please ensure all categories have unique names."),
            tags$span(class = "sr-only", "Form validation error: Duplicate category names detected. This message is announced for screen reader users.")
          )
        )
      }
      if (is.null(df$claimed_prop) || length(df$claimed_prop) == 0 || abs(sum(df$claimed_prop) - 1) > 1e-6) {
        return(
          div(
            role = "status",
            `aria-live` = "assertive",
            style = "color: red; font-weight: bold;",
            tags$span("Error: Claimed proportions must sum to 1. Please adjust the claimed proportions so they add up to 100%."),
            tags$span(class = "sr-only", "Form validation error: Claimed proportions must sum to 1. This message is announced for screen reader users.")
          )
        )
      }
      total_observed <- sum(df$observed_count)
      if (is.null(df$observed_count) || length(df$observed_count) == 0 || total_observed == 0) {
        return("Enter observed counts.")
      }
      # Calculate expected counts for each category
      df <- df %>%
        mutate(expected_count = claimed_prop * total_observed)
      # Warn if expected count is too low for reliable chi-square test
      if (!is.null(df$expected_count) && length(df$expected_count) > 0 && any(df$expected_count < 5)) {
        showModal(
          modalDialog(
            title = "Warning",
            "At least one category has an expected count less than 5. The results of the Chi-Square test may not be reliable.",
            easyClose = TRUE,
            footer = NULL,
            tags$div(
              tabindex = "-1",
              role = "dialog",
              `aria-modal` = "true",
              `aria-labelledby` = "modalTitle",
              id = "modalDialog",
              tags$h2("Warning", id = "modalTitle", class = "sr-only")
            )
          )
        )
        observeEvent(input$run_sim, {
          removeModal()
          shinyjs::runjs("$('#run_sim').focus();")
        })
      }
      chi_square_val <- sum((df$observed_count - df$expected_count)^2 / df$expected_count)
      return(chi_square_val)
    })

    # Output: Display observed chi-square value or error
    output$chi_square_result <- renderUI({
      val <- observed_chi_square()
      if (is.character(val)) {
        val
      } else {
        strong(round(val, 3))
      }
    })

    # --- Simulation Logic ---
    sim_results <- eventReactive(input$run_sim, {
      df <- input_data()
      req(df)
      obs_chi <- observed_chi_square()
      if (is.character(obs_chi)) {
        showModal(
          modalDialog(
            title = "Input Error",
            obs_chi,
            easyClose = TRUE,
            footer = NULL,
            tags$div(
              tabindex = "-1",
              role = "dialog",
              `aria-modal` = "true",
              `aria-labelledby` = "modalErrorTitle",
              id = "modalErrorDialog",
              tags$h2("Input Error", id = "modalErrorTitle", class = "sr-only")
            )
          )
        )
        observeEvent(input$run_sim, {
          removeModal()
          shinyjs::runjs("$('#run_sim').focus();")
        })
        return(NULL)
      }
      n_sims <- input$num_sims
      total_observed <- sum(df$observed_count)
      claimed_props <- df$claimed_prop
      sim_counts <- rmultinom(n = n_sims, size = total_observed, prob = claimed_props)
      expected_counts <- total_observed * claimed_props
      sim_chi_squares <- apply(sim_counts, 2, function(sim_col) {
        sum((sim_col - expected_counts)^2 / expected_counts)
      })
      data.frame(chi_square = sim_chi_squares)
    })

    # --- Outputs ---
    output$sim_plot <- renderPlot({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(ggplot() +
          labs(title = "Distribution of Simulated χ² Values", subtitle = "Click 'Run Simulation' to generate this plot") +
          theme_minimal())
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
      p_val_area <- df_sim %>% filter(chi_square >= obs_chi)
      if (!is.null(p_val_area) && nrow(p_val_area) > 0) {
        p <- p + geom_histogram(data = p_val_area, aes(x = chi_square, y = ..density..), bins = 30, fill = "#ef4444", alpha = 0.8)
      }
      return(p)
    })

    output$plot_desc <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(p(
          class = "sr-only", `aria-live` = "polite",
          "The plot is empty. Run the simulation to generate results."
        ))
      }
      obs_chi <- observed_chi_square()
      mean_sim_chi <- mean(df_sim$chi_square)
      sd_sim_chi <- sd(df_sim$chi_square)
      p_value <- sum(df_sim$chi_square >= obs_chi) / nrow(df_sim)
      desc <- paste(
        sprintf("This histogram displays the distribution of %d simulated Chi-Square values generated from your input data.", input$num_sims),
        "The distribution is typically skewed right, as expected for Chi-Square statistics.",
        sprintf("The mean of the simulated distribution is %.2f, and the standard deviation is %.3f.", mean_sim_chi, sd_sim_chi),
        sprintf("A dashed red vertical line marks your observed Chi-Square value of %.3f.", obs_chi),
        "The region to the right of this line is shaded in red, representing simulated values greater than or equal to your observed value.",
        sprintf("The calculated p-value, representing the proportion of simulations as or more extreme than your observed value, is %.4f.", p_value),
        "Use this plot to visually compare your sample's result to what is expected under the null hypothesis."
      )
      p(class = "sr-only", `aria-live` = "polite", desc)
    })

    output$p_value_result <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(p("Run simulation to get p-value."))
      }
      obs_chi <- observed_chi_square()
      req(is.numeric(obs_chi))
      p_value <- sum(df_sim$chi_square >= obs_chi) / nrow(df_sim)
      div(
        role = "status",
        `aria-live` = "polite",
        strong(sprintf("Simulation p-value: %.4f", p_value)),
        tags$span(class = "sr-only", sprintf("Simulation p-value is %.4f. This message is announced for screen reader users.", p_value))
      )
    })

    output$sim_stats_ui <- renderUI({
      df_sim <- sim_results()
      if (is.null(df_sim)) {
        return(NULL)
      }
      mean_sim <- mean(df_sim$chi_square)
      sd_sim <- sd(df_sim$chi_square)
      tagList(
        h4("Simulation Summary"),
        tags$table(
          role = "table",
          tags$tr(
            tags$th("Mean Simulated χ²"),
            tags$th("SD Simulated χ²")
          ),
          tags$tr(
            tags$td(round(mean_sim, 3)),
            tags$td(round(sd_sim, 3))
          )
        ),
        tags$span(class = "sr-only", sprintf("Mean simulated chi-square value is %.3f. Standard deviation is %.3f.", mean_sim, sd_sim))
      )
    })
  })
}
