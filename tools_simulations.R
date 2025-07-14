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
# Stapplet Applet - Probability Simulations
# Author: Michael Ryan Hunsaker, M.Ed., Ph.D.
#    <hunsakerconsulting@gmail.com>
# Date: 2025-07-13
######################################################################

# Enhanced Probability Simulations Applet

tools_simulations_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    shinyjs::useShinyjs(),
    tags$head(
      tags$title("Probability Simulations"),
      tags$link(rel = "stylesheet", type = "text/css", href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css")
    ),
    titlePanel(
      h2("Probability Simulations", id = ns("mainHeading")),
      windowTitle = "Probability Simulations"
    ),
    tabsetPanel(
      id = ns("simulation_tabs"),
      type = "pills",
      tabPanel("Coin Flip",
        sidebarLayout(
          sidebarPanel(
            h3("Coin Flip Setup"),
            sliderInput(ns("heads_prob"), "Probability of Heads:", min = 0, max = 1, value = 0.5, step = 0.01),
            numericInput(ns("num_flips"), "Number of Flips:", value = 10, min = 1, max = 1000, step = 1),
            actionButton(ns("flip_coins"), "Flip Coins", class = "btn-primary", style = "width: 100%;"),
            hr(),
            downloadButton(ns("download_coin_summary"), "Download Summary"),
            downloadButton(ns("download_coin_data"), "Download Data"),
            downloadButton(ns("download_coin_plot"), "Download Plot")
          ),
          mainPanel(
            div(class = "plot-container",
              h4("Flip Results", id = ns("coinPlotHeading")),
              plotOutput(ns("coinPlot"), height = "300px")
            ),
            div(class = "results-box",
              h4("Summary of Flips", id = ns("coinSummaryHeading")),
              verbatimTextOutput(ns("coinSummary"))
            )
          )
        )
      ),
      tabPanel("Dice Roll",
        sidebarLayout(
          sidebarPanel(
            h3("Dice Roll Setup"),
            numericInput(ns("num_rolls"), "Number of Rolls:", value = 20, min = 1, max = 1000, step = 1),
            actionButton(ns("roll_dice"), "Roll Dice", class = "btn-primary", style = "width: 100%;"),
            hr(),
            downloadButton(ns("download_dice_summary"), "Download Summary"),
            downloadButton(ns("download_dice_data"), "Download Data"),
            downloadButton(ns("download_dice_plot"), "Download Plot")
          ),
          mainPanel(
            div(class = "plot-container",
              h4("Roll Results", id = ns("dicePlotHeading")),
              plotOutput(ns("dicePlot"), height = "300px")
            ),
            div(class = "results-box",
              h4("Summary of Rolls", id = ns("diceSummaryHeading")),
              verbatimTextOutput(ns("diceSummary"))
            )
          )
        )
      ),
      tabPanel("Card Draw",
        sidebarLayout(
          sidebarPanel(
            h3("Card Draw Setup"),
            textOutput(ns("deck_status")),
            hr(),
            numericInput(ns("num_draw"), "Number of Cards to Draw:", value = 5, min = 1, max = 52, step = 1),
            actionButton(ns("draw_cards"), "Draw Cards", class = "btn-primary", style = "width: 100%; margin-bottom: 10px;"),
            actionButton(ns("reset_deck"), "Reset Deck", class = "btn-danger", style = "width: 100%;"),
            hr(),
            downloadButton(ns("download_card_data"), "Download Drawn Cards")
          ),
          mainPanel(
            div(class = "results-box",
              h4("Drawn Cards"),
              uiOutput(ns("cardsDrawnOutput"))
            )
          )
        )
      )
    )
  )
}

tools_simulations_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns
    rv <- reactiveValues(
      coin_flips = NULL,
      dice_rolls = NULL,
      full_deck = character(),
      current_deck = character(),
      drawn_cards = NULL
    )

    observe({
      suits <- c("Hearts", "Diamonds", "Clubs", "Spades")
      ranks <- c("2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace")
      deck <- paste(ranks, "of", rep(suits, each = 13))
      rv$full_deck <- deck
      rv$current_deck <- deck
    })

    observeEvent(input$flip_coins, {
      req(input$num_flips > 0)
      flips <- sample(c("Heads", "Tails"), size = input$num_flips, replace = TRUE, prob = c(input$heads_prob, 1 - input$heads_prob))
      rv$coin_flips <- factor(flips, levels = c("Heads", "Tails"))
    })

    output$coinPlot <- renderPlot({
      if (is.null(rv$coin_flips)) {
        return(ggplot() + labs(title = "Flip coins to see results") + theme_void())
      }
      ggplot(data.frame(flips = rv$coin_flips), aes(x = flips, fill = flips)) +
        geom_bar(show.legend = FALSE) +
        scale_fill_viridis_d(option = "D", end = 0.85) +
        labs(x = "Outcome", y = "Count", title = paste("Results of", input$num_flips, "Coin Flips")) +
        theme_minimal(base_size = 14)
    })

    output$coinSummary <- renderPrint({
      if (is.null(rv$coin_flips)) {
        cat("No coins flipped yet.")
      } else {
        summary(rv$coin_flips)
        cat(sprintf("\nProportion Heads: %.3f", mean(rv$coin_flips == "Heads")))
      }
    })

    observeEvent(input$roll_dice, {
      req(input$num_rolls > 0)
      rolls <- sample(1:6, size = input$num_rolls, replace = TRUE)
      rv$dice_rolls <- factor(rolls, levels = 1:6)
    })

    output$dicePlot <- renderPlot({
      if (is.null(rv$dice_rolls)) {
        return(ggplot() + labs(title = "Roll dice to see results") + theme_void())
      }
      ggplot(data.frame(rolls = rv$dice_rolls), aes(x = rolls, fill = rolls)) +
        geom_bar(show.legend = FALSE) +
        labs(x = "Outcome", y = "Count", title = paste("Results of", input$num_rolls, "Dice Rolls")) +
        theme_minimal(base_size = 14)
    })

    output$diceSummary <- renderPrint({
      if (is.null(rv$dice_rolls)) {
        cat("No dice rolled yet.")
      } else {
        summary(rv$dice_rolls)
      }
    })

    output$deck_status <- renderText({
      paste("Cards remaining in deck:", length(rv$current_deck))
    })

    observeEvent(input$draw_cards, {
      req(input$num_draw > 0)
      num_to_draw <- min(input$num_draw, length(rv$current_deck))
      if (num_to_draw > 0) {
        drawn <- sample(rv$current_deck, size = num_to_draw, replace = FALSE)
        rv$drawn_cards <- drawn
        rv$current_deck <- setdiff(rv$current_deck, drawn)
      } else {
        rv$drawn_cards <- "No cards left in the deck to draw."
      }
    })

    observeEvent(input$reset_deck, {
      rv$current_deck <- rv$full_deck
      rv$drawn_cards <- NULL
    })

    output$cardsDrawnOutput <- renderUI({
      if (is.null(rv$drawn_cards)) {
        return(p("Draw some cards to see the results here."))
      }
      tags$ul(
        lapply(rv$drawn_cards, tags$li)
      )
    })
  })
}
