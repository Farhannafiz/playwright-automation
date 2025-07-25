Feature: Validate Bill Calculation Equation with API and Frontend

  Scenario: Validate Bill Calculation Equation with API and Frontend
    Given I launch the Pathao Food website
    When I locate myself and go to the first restaurant
    And I add the first item to the cart
    And I proceed to checkout
    Then the bill values should match between frontend, API, and calculation
