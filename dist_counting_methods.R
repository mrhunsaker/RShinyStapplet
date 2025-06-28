# dist_counting_methods.R

library(shiny)

# UI for the Counting Methods Applet
dist_counting_methods_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    # Title
    h2("Counting Methods"),
    p("Calculate permutations (when order matters) and combinations (when order does not matter)."),

    fluidRow(
      # Permutations Column
      column(6,
        wellPanel(
          h3("Permutations"),
          p("Find the number of ways to choose and arrange k items from a set of n items."),
          strong("Formula: P(n, k) = n! / (n - k)!"),
          hr(),
          div(class = "form-group",
              tags$label("Total number of items (n):", `for` = ns("perm_n")),
              numericInput(ns("perm_n"), label = NULL, value = 10, min = 0, step = 1),
              tags$p(id = ns("perm_n_desc"), class = "sr-only", "Enter the total number of items, n, for the permutation calculation."),
              tags$script(paste0("document.getElementById('", ns("perm_n"), "').setAttribute('aria-describedby', '", ns("perm_n_desc"), "')"))
          ),
          div(class = "form-group",
              tags$label("Number of items to choose (k):", `for` = ns("perm_k")),
              numericInput(ns("perm_k"), label = NULL, value = 3, min = 0, step = 1),
              tags$p(id = ns("perm_k_desc"), class = "sr-only", "Enter the number of items to choose, k, for the permutation calculation."),
              tags$script(paste0("document.getElementById('", ns("perm_k"), "').setAttribute('aria-describedby', '", ns("perm_k_desc"), "')"))
          ),
          div(class = "results-box", role = "status", `aria-live` = "polite",
              h4("Result"),
              htmlOutput(ns("perm_result"))
          )
        )
      ),
      # Combinations Column
      column(6,
        wellPanel(
          h3("Combinations"),
          p("Find the number of ways to choose k items from a set of n items."),
          strong("Formula: C(n, k) = n! / (k! * (n - k)!)"),
          hr(),
          div(class = "form-group",
              tags$label("Total number of items (n):", `for` = ns("comb_n")),
              numericInput(ns("comb_n"), label = NULL, value = 10, min = 0, step = 1),
              tags$p(id = ns("comb_n_desc"), class = "sr-only", "Enter the total number of items, n, for the combination calculation."),
              tags$script(paste0("document.getElementById('", ns("comb_n"), "').setAttribute('aria-describedby', '", ns("comb_n_desc"), "')"))
          ),
          div(class = "form-group",
              tags$label("Number of items to choose (k):", `for` = ns("comb_k")),
              numericInput(ns("comb_k"), label = NULL, value = 3, min = 0, step = 1),
              tags$p(id = ns("comb_k_desc"), class = "sr-only", "Enter the number of items to choose, k, for the combination calculation."),
              tags$script(paste0("document.getElementById('", ns("comb_k"), "').setAttribute('aria-describedby', '", ns("comb_k_desc"), "')"))
          ),
          div(class = "results-box", role = "status", `aria-live` = "polite",
              h4("Result"),
              htmlOutput(ns("comb_result"))
          )
        )
      )
    )
  )
}

# Server logic for the Counting Methods Applet
dist_counting_methods_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # --- Permutations Logic ---
    output$perm_result <- renderUI({
      n <- input$perm_n
      k <- input$perm_k

      # Validation
      if (is.na(n) || is.na(k) || !is.numeric(n) || !is.numeric(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
        return(p("Please enter non-negative integers for n and k.", style = "color: red;"))
      }
      if (k > n) {
        return(p("k cannot be greater than n.", style = "color: red;"))
      }

      # Calculation
      # Using choose() is more numerically stable for large numbers
      # P(n,k) = C(n,k) * k!
      # The gamma function is used for factorials to handle larger numbers
      result <- choose(n, k) * factorial(k)

      # Display result
      tagList(
        p(paste0("P(", n, ", ", k, ") = ", format(result, scientific = FALSE, big.mark = ",")))
      )
    })

    # --- Combinations Logic ---
    output$comb_result <- renderUI({
      n <- input$comb_n
      k <- input$comb_k

      # Validation
      if (is.na(n) || is.na(k) || !is.numeric(n) || !is.numeric(k) || n < 0 || k < 0 || floor(n) != n || floor(k) != k) {
        return(p("Please enter non-negative integers for n and k.", style = "color: red;"))
      }
      if (k > n) {
        return(p("k cannot be greater than n.", style = "color: red;"))
      }

      # Calculation using R's built-in `choose` function
      result <- choose(n, k)

      # Display result
      tagList(
        p(paste0("C(", n, ", ", k, ") = ", format(result, scientific = FALSE, big.mark = ",")))
      )
    })
  })
}
