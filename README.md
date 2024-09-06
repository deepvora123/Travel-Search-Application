# Travel Search Web Application

## Overview

This project is a travel search web application designed to help users find the **best round-trip flights + hotel combinations** based on:
- **Origin city**
- **Number of nights** for the stay
- **Budget**

The application compares trips across multiple destinations, optimizing the results for the best possible trip within the user's budget. It returns the results sorted by a calculated **trip score**, which represents the "best" trip combination.

## Data Structure

- **Flights**: Stored in `flights.json`. It contains details such as:
  - `from`: Departure city
  - `to`: Destination city
  - `stops`: Layover cities
  - `price`: Cost of the flight
  - `departure_time`: Time of departure
  - `arrival_time`: Time of arrival

- **Hotels**: Stored in `hotels.json`. It contains:
  - `name`: Name of the hotel
  - `address`: Address of the hotel (helps identify the destination city)
  - `stars`: Hotel star rating
  - `rating`: User rating (out of 10)
  - `amenities`: List of amenities (e.g., Wi-Fi, pool, restaurant)
  - `price_per_night`: Cost per night

## Key Features

1. **Flight Search**: The `getFlights(from, to)` function retrieves flights from a departure city (`from`) to a destination city (`to`). It leverages a caching mechanism to minimize repeated function calls.
  
2. **Hotel Search**: The `getHotels(destination)` function retrieves available hotels at a destination. Similar to flight searches, caching is used to optimize performance.

3. **Trip Calculation**: The application combines outbound flights, return flights, and available hotels to find the best trip. The "best" trip is determined based on a custom trip score formula.

## Trip Scoring System

The trip score is calculated using the following components:

### 1. **Flight Score**
- **Base Score**: All flights start with a base score of 100.
- **Price Factor**: The flight price reduces the score based on the formula: 
  ``` 
  priceScore = 100 - (flight.price / 10)
  ```
- **Stops Factor**: The number of stops negatively impacts the score:
  ```
  stopScore = 50 - (number of stops * 10)
  ```

### 2. **Hotel Score**
- **Base Score**: Hotels start with a base score of 100.
- **Star Rating**: Hotels gain points for their star rating:
  ```
  starScore = hotel.stars * 10
  ```
- **User Rating**: Hotels gain points based on user ratings:
  ```
  ratingScore = hotel.rating * 10
  ```
- **Price Factor**: The score decreases based on the price per night:
  ```
  priceScore = 100 - (hotel.price_per_night / 2)
  ```
- **Amenities Factor**: Each amenity adds points to the score:
  ```
  amenitiesScore = hotel.amenities.length * 5
  ```

### 3. **Overall Trip Score**
The overall trip score combines the flight and hotel scores using the following formula:
```
tripScore = (flightScore + hotelScore * nights) / (nights + 1)
```
This formula ensures that longer stays with better hotels receive higher scores.

## Optimization: Caching to Reduce Function Calls

### Problem: Costly Function Calls

According to the problem statement, the `getFlights()` and `getHotels()` functions are expensive in terms of both time and cost. Each call should be minimized to optimize the application's performance.

### Solution: Caching

To address this, **caching** is implemented using **JavaScript Maps** (`flightCache` and `hotelCache`), which store results from previous function calls and reuse them for subsequent searches.

- **Flight Cache**:
  - Key: A string in the format `"from-to"`.
  - Value: The list of flights matching the `from` and `to` parameters.
  
  Example:
  ```javascript
  if (!flightCache.has(cacheKey)) {
      const result = flights.filter(flight => flight.from === from && flight.to === to);
      flightCache.set(cacheKey, result);
  }
  ```

- **Hotel Cache**:
  - Key: The destination city code (e.g., `"JFK"`, `"LAX"`).
  - Value: The list of hotels in that destination.

  Example:
  ```javascript
  if (!hotelCache.has(destination)) {
      const result = hotels.filter(hotel => hotel.address.includes(cityName));
      hotelCache.set(destination, result);
  }
  ```

### Benefits of Caching

- **Reduces Redundant Calls**: The caching mechanism ensures that once a flight or hotel search is performed, it is stored and reused for future queries. This drastically reduces the number of calls to `getFlights()` and `getHotels()`, improving both performance and efficiency.
  
- **Improved Performance**: Since flight and hotel data are fetched only once per origin-destination pair or city, the time taken to return search results is minimized, making the application more responsive.

## How to Run the Application

1. **Dependencies**: Ensure you have access to a web browser to run this application.

2. **Steps**:
   - Clone the project or download the files.
   - Load the `index.html` file in a web browser.
   - Enter your origin, number of nights, and budget into the form and click **Search**.
   - The best trip combinations will be displayed based on the internal scoring system.

