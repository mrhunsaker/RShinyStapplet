######################################################################
#
# Copyright 2025 Michael Ryan Hunsaker, M.Ed., Ph.D.
#                <hunsakerconsulting@gmail.com>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
######################################################################
# Stapplet Activity - Sampling Sunflowers (Central Limit Theorem)
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# --- Load required libraries ---
library(shiny) # For building interactive web applications
library(ggplot2) # For creating plots
library(dplyr) # For data wrangling

# --- UI Definition for Sampling Sunflowers (CLT) Activity ---
# This function builds the user interface for the module, allowing users to:
# - Visualize a skewed population
# - Take random samples and observe their means
# - See the sampling distribution build and compare to the normal curve
# - View summary statistics and reset simulation
activity_sampling_sunflowers_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    h2("Activity: Sampling Sunflowers (The Central Limit Theorem)"),
    wellPanel(
      h3("Instructions"),
      p("This activity demonstrates the Central Limit Theorem (CLT), one of the most important concepts in statistics. The CLT states that if you take many random samples from any population (even a skewed one), the distribution of the means of those samples will be approximately normal."),
      tags$ol(
        tags$li("The top-left plot shows our population of 10,000 sunflower heights. Notice that this distribution is skewed to the right, not normal."),
        tags$li("Use the slider to set a sample size (n). This is how many sunflowers we'll pick in each sample."),
        tags$li("Click the 'Take 1 Sample' button. The top-right plot will show the heights from your single sample, and its mean will be plotted as one blue square on the bottom plot."),
        tags$li("Click the button multiple times to see the sampling distribution build. Use the 'Take 1000 Samples' button to speed things up."),
        tags$li("Observe how the bottom plot (the sampling distribution of the means) starts to look like a normal, bell-shaped curve, even though the original population was skewed! Notice also how its center is close to the population mean.")
      )
    ),
    fluidRow(
      column(
        4,
        h4("Controls"),
        # --- Sample size slider ---
        sliderInput(ns("sample_size"), "Sample Size (n):", min = 2, max = 100, value = 10),
        p(id = ns("n_desc"), class = "sr-only", "Set the number of sunflowers to pick in each random sample."),
        tags$script(paste0("document.getElementById('", ns("sample_size"), "').setAttribute('aria-describedby', '", ns("n_desc"), "')")),
        fluidRow(
          column(6, actionButton(ns("take_1"), "Take 1 Sample")),
          column(6, actionButton(ns("take_10"), "Take 10 Samples"))
        ),
        br(),
        fluidRow(
          column(6, actionButton(ns("take_100"), "Take 100 Samples")),
          column(6, actionButton(ns("take_1000"), "Take 1000 Samples", class = "btn-primary"))
        ),
        br(),
        actionButton(ns("reset"), "Reset Simulation", class = "btn-danger"),
        hr(),
        h4("Statistics"),
        # --- Display summary statistics ---
        div(
          class = "results-box", role = "status", `aria-live` = "polite",
          uiOutput(ns("stats_output"))
        )
        # To add export/download, insert downloadButton(ns("download_results"), "Download Results") here
      ),
      column(
        8,
        fluidRow(
          column(
            6,
            h5("Population of Sunflowers", align = "center"),
            plotOutput(ns("pop_plot"), height = "400px")
          ),
          column(
            6,
            h5("Most Recent Sample", align = "center"),
            plotOutput(ns("sample_plot"), height = "400px")
          )
        ),
        hr(),
        h5("Distribution of Sample Means", align = "center"),
        plotOutput(ns("sampling_dist_plot"), height = "400px"),
        tags$script(paste0("document.getElementById('", ns("sampling_dist_plot"), "').setAttribute('aria-label', 'A histogram of the means of all samples taken so far. A red dashed line shows the theoretical normal curve.')")),
        p(id = ns("sampling_dist_plot_desc"), class = "sr-only", `aria-live` = "polite", textOutput(ns("sampling_dist_plot_desc_text"))),
        uiOutput(ns("plot_desc"))
      )
    )
  )
}

# --- Server Logic for Sampling Sunflowers (CLT) Activity ---
# This function contains all reactive logic, simulation, and output rendering for the module.
activity_sampling_sunflowers_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- 1. Create the Population ---
    # Simulate a skewed population of sunflower heights using a gamma distribution
    set.seed(42)
    population_data <- data.frame(height = round(rgamma(10000, shape = 2, scale = 10) + 50))
    pop_mean <- mean(population_data$height)
    pop_sd <- sd(population_data$height)
    pop_n <- nrow(population_data)

    # --- 2. Reactive Values for Simulation State ---
    # Stores the means of all samples taken and the most recent sample
    sample_means <- reactiveVal(data.frame(mean = numeric(0)))
    last_sample <- reactiveVal(data.frame(height = numeric(0)))

    # --- 3. Simulation Logic ---
    # Function to take samples and update state
    take_samples <- function(num_to_take) {
      n <- input$sample_size
      if (is.null(input$sample_size) || trimws(as.character(input$sample_size)) == "") {
        # Don't show error until user enters sample size
        return()
      }
      if (n < 2 || n > pop_n) {
        showNotification("Sample size must be at least 2 and no more than population size.", type = "error")
        return()
      }
      new_means <- replicate(num_to_take, {
        sample_df <- population_data %>% sample_n(n)
        mean(sample_df$height)
      })
      last_sample_df <- population_data %>% sample_n(n)
      last_sample(last_sample_df)
      updated_means <- rbind(sample_means(), data.frame(mean = c(new_means, mean(last_sample_df$height))))
      sample_means(updated_means)
    }

    # --- Button handlers for taking samples ---
    observeEvent(input$take_1, {
      take_samples(0)
    })
    observeEvent(input$take_10, {
      take_samples(9)
    })
    observeEvent(input$take_100, {
      take_samples(99)
    })
    observeEvent(input$take_1000, {
      take_samples(999)
    })

    # --- Reset simulation state ---
    observeEvent(input$reset, {
      sample_means(data.frame(mean = numeric(0)))
      last_sample(data.frame(height = numeric(0)))
    })

    # --- Reset simulation when sample size changes ---
    observeEvent(input$sample_size, {
      sample_means(data.frame(mean = numeric(0)))
      last_sample(data.frame(height = numeric(0)))
    })

    # --- 4. Render Outputs ---
    # --- Population plot: histogram and density of sunflower heights ---
    output$pop_plot <- renderPlot(
      {
        ggplot(population_data, aes(x = height)) +
          geom_histogram(aes(y = ..density..), binwidth = 5, fill = "#f9a825", color = "white", alpha = 0.8) +
          geom_density(color = "#c77700", size = 1) +
          labs(x = "Height", y = "Density") +
          theme_minimal()
      },
      alt = "A histogram of the population data, showing a distribution skewed to the right."
    )

    # --- Most recent sample plot: histogram and mean line ---
    output$sample_plot <- renderPlot(
      {
        df <- last_sample()
        if (nrow(df) == 0) {
          return(ggplot() +
            labs(title = "Take a sample") +
            theme_void())
        }
        ggplot(df, aes(x = height)) +
          geom_histogram(binwidth = 5, fill = "#42a5f5", color = "white", alpha = 0.8) +
          geom_vline(aes(xintercept = mean(height)), color = "#0d47a1", size = 1.5, linetype = "dashed") +
          coord_cartesian(xlim = range(population_data$height)) +
          labs(x = "Height", y = "Count") +
          theme_minimal()
      },
      alt = "A histogram of the most recently taken sample."
    )

    # --- Sampling distribution plot: histogram and density of sample means ---
    output$sampling_dist_plot <- renderPlot(
      {
        df <- sample_means()
        if (nrow(df) == 0) {
          return(ggplot() +
            labs(title = "Distribution will build here") +
            theme_void())
        }
        p <- ggplot(df, aes(x = mean)) +
          geom_histogram(aes(y = ..density..), binwidth = 1, fill = "#29b6f6", color = "white", alpha = 0.8) +
          geom_density(color = "#0277bd", size = 1) +
          coord_cartesian(xlim = range(population_data$height)) +
          labs(x = "Sample Mean Height", y = "Density") +
          theme_minimal()
        # Overlay theoretical normal curve if enough samples
        if (nrow(df) > 1) {
          se <- pop_sd / sqrt(input$sample_size)
          p <- p + stat_function(fun = dnorm, args = list(mean = pop_mean, sd = se), color = "red", linetype = "dashed", size = 1)
        }
        p
      },
      alt = "A histogram of the means of all samples taken so far. A red dashed line shows the theoretical normal curve."
    )

    # --- Accessibility: Description for the sampling distribution plot ---
    output$sampling_dist_plot_desc_text <- renderText({
      df <- sample_means()
      if (nrow(df) == 0) {
        return("No samples have been taken yet, so there is no distribution to describe.")
      }
      mean_of_means <- mean(df$mean)
      sd_of_means <- sd(df$mean)
      se_theoretical <- pop_sd / sqrt(input$sample_size)
      shape_desc <- if (nrow(df) < 30) {
        "The shape of the distribution is still developing."
      } else if (input$sample_size < 30) {
        "The shape is becoming more symmetric and bell-shaped, but may still show some of the original population's skew."
      } else {
        "The shape is approximately normal and bell-shaped, as predicted by the Central Limit Theorem."
      }
      desc <- paste(
        sprintf("This histogram shows the distribution of %d sample means.", nrow(df)),
        shape_desc,
        sprintf("The distribution is centered at %.2f, which is close to the true population mean of %.2f.", mean_of_means, pop_mean),
        sprintf("The standard deviation of these sample means is %.2f.", sd_of_means),
        sprintf("A red dashed line shows the theoretical normal curve predicted by the Central Limit Theorem, which has a mean of %.2f and a standard error of %.2f.", pop_mean, se_theoretical),
        collapse = " "
      )
      return(desc)
    })

    # --- Statistics output: population, most recent sample, and sampling distribution ---
    output$stats_output <- renderUI({
      means_df <- sample_means()
      last_sample_df <- last_sample()
      tagList(
        strong("Population:"),
        p(paste("Mean =", round(pop_mean, 2), " SD =", round(pop_sd, 2), " N =", pop_n)),
        hr(),
        strong("Most Recent Sample:"),
        if (nrow(last_sample_df) > 0) {
          p(paste("Mean =", round(mean(last_sample_df$height), 2), " SD =", round(sd(last_sample_df$height), 2), " n =", nrow(last_sample_df)))
        } else {
          p("No sample taken yet.")
        },
        hr(),
        strong("Sampling Distribution of Means:"),
        if (nrow(means_df) > 0) {
          p(paste("Mean =", round(mean(means_df$mean), 2), " SD =", round(sd(means_df$mean), 2), " Samples =", nrow(means_df)))
        } else {
          p("No samples taken yet.")
        }
      )
    })

    # --- Accessibility: Description for the sampling distribution plot (screen reader) ---
    output$plot_desc <- renderUI({
      num_samples <- nrow(sample_means())
      if (num_samples > 0) {
        p(class = "sr-only", paste("The sampling distribution now contains", num_samples, "sample means. Its shape is becoming more normal."))
      } else {
        p(class = "sr-only", "The sampling distribution plot is currently empty.")
      }
    })

    # To add export/download, add a downloadHandler here and corresponding button in the UI
  })
}
