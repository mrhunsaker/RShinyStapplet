# StappletSHiny/tools_simulations.R

# UI function for the 'Simulations' tool
tools_simulations_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    titlePanel(
      h2("Probability Simulations", id = "appTitle"),
      windowTitle = "Probability Simulations"
    ),
    p("Perform simple probability simulations for flipping coins, rolling dice, and drawing cards from a deck."),

    tabsetPanel(
      id = ns("simulation_tabs"),
      type = "pills",

      # --- Coin Flip Panel ---
      tabPanel("Coin Flip",
        sidebarLayout(
          sidebarPanel(
            h3("Coin Flip Setup"),
            div(class = "form-group",
              tags$label(id = ns("num_flips_label"), "Number of Flips:"),
              numericInput(ns("num_flips"), NULL, value = 10, min = 1, max = 1000, step = 1)
            ),
            actionButton(ns("flip_coins"), "Flip Coins", class = "btn-primary", style = "width: 100%;")
          ),
          mainPanel(
            div(class = "plot-container",
              h4("Flip Results", id = ns("coinPlotHeading")),
              htmltools::tagQuery(
                plotOutput(ns("coinPlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("coinPlotHeading"))$all()
            ),
            div(class = "results-box",
              h4("Summary of Flips", id = ns("coinSummaryHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("coinSummary"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("coinSummaryHeading"))$all()
            )
          )
        )
      ),

      # --- Dice Roll Panel ---
      tabPanel("Dice Roll",
        sidebarLayout(
          sidebarPanel(
            h3("Dice Roll Setup"),
            div(class = "form-group",
              tags$label(id = ns("num_rolls_label"), "Number of Rolls:"),
              numericInput(ns("num_rolls"), NULL, value = 20, min = 1, max = 1000, step = 1)
            ),
            actionButton(ns("roll_dice"), "Roll Dice", class = "btn-primary", style = "width: 100%;")
          ),
          mainPanel(
            div(class = "plot-container",
              h4("Roll Results", id = ns("dicePlotHeading")),
              htmltools::tagQuery(
                plotOutput(ns("dicePlot"), height = "300px")
              )$find("img")$addAttrs("aria-labelledby" = ns("dicePlotHeading"))$all()
            ),
            div(class = "results-box",
              h4("Summary of Rolls", id = ns("diceSummaryHeading")),
              htmltools::tagQuery(
                verbatimTextOutput(ns("diceSummary"))
              )$find("pre")$addAttrs("aria-labelledby" = ns("diceSummaryHeading"))$all()
            )
          )
        )
      ),

      # --- Card Draw Panel ---
      tabPanel("Card Draw",
        sidebarLayout(
          sidebarPanel(
            h3("Card Draw Setup"),
            p(htmltools::tagQuery(
                textOutput(ns("deck_status"))
              )$find("output")$addAttrs("aria-labelledby" = ns("deck_status_label"))$all()
            ),
            hr(),
            div(class = "form-group",
              tags$label(id = ns("num_draw_label"), "Number of Cards to Draw:"),
              numericInput(ns("num_draw"), NULL, value = 5, min = 1, max = 52, step = 1)
            ),
            actionButton(ns("draw_cards"), "Draw Cards", class = "btn-primary", style = "width: 100%; margin-bottom: 10px;"),
            actionButton(ns("reset_deck"), "Reset Deck", class = "btn-danger", style = "width: 100%;")
          ),
          mainPanel(
            div(class = "results-box",
              h4("Drawn Cards"),
              # Using uiOutput to allow for more flexible rendering of cards
              uiOutput(ns("cardsDrawnOutput"))
            )
          )
        )
      )
    )
  )
}

# Server function for the 'Simulations' tool
tools_simulations_server <- function(id) {
  moduleServer(id, function(input, output, session) {

    # --- Reactive Values ---
    rv <- reactiveValues(
      # Coin values
      coin_flips = NULL,
      # Dice values
      dice_rolls = NULL,
      # Card values
      full_deck = character(),
      current_deck = character(),
      drawn_cards = NULL
    )

    # Initialize the deck of cards
    observe({
      suits <- c("Hearts", "Diamonds", "Clubs", "Spades")
      ranks <- c("2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace")
      deck <- paste(ranks, "of", rep(suits, each = 13))
      rv$full_deck <- deck
      rv$current_deck <- deck
    })


    # --- Coin Flip Logic ---
    observeEvent(input$flip_coins, {
      req(input$num_flips > 0)
      flips <- sample(c("Heads", "Tails"), size = input$num_flips, replace = TRUE)
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
      }
    })


    # --- Dice Roll Logic ---
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


    # --- Card Draw Logic ---
    output$deck_status <- renderText({
      paste("Cards remaining in deck:", length(rv$current_deck))
    })

    observeEvent(input$draw_cards, {
      req(input$num_draw > 0)
      num_to_draw <- min(input$num_draw, length(rv$current_deck)) # Can't draw more than what's left

      if (num_to_draw > 0) {
        drawn <- sample(rv$current_deck, size = num_to_draw, replace = FALSE)
        rv$drawn_cards <- drawn
        rv$current_deck <- setdiff(rv$current_deck, drawn) # Remove drawn cards from deck
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
      # Create a simple list of drawn cards
      tags$ul(
        lapply(rv$drawn_cards, tags$li)
      )
    })

  })
}
