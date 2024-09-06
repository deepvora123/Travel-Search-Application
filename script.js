let flights = [];
let hotels = [];
let flightCache = new Map();
let hotelCache = new Map();

async function loadJSONData() {
    const flightsResponse = await fetch('flights.json');
    flights = await flightsResponse.json();
    const hotelsResponse = await fetch('hotels.json');
    hotels = await hotelsResponse.json();
}

function getFlights(from, to) {
    const cacheKey = `${from}-${to}`;
    if (!flightCache.has(cacheKey)) {
        const result = flights.filter(flight => flight.from === from && flight.to === to);
        flightCache.set(cacheKey, result);
    }
    return flightCache.get(cacheKey);
}

function getHotels(destination) {
    if (!hotelCache.has(destination)) {
        const cityName = {
            "JFK": "New York City",
            "LAX": "Los Angeles",
            "LHR": "London",
            "NRT": "Tokyo",
            "SYD": "Sydney"
        }[destination] || "";
        const result = hotels.filter(hotel => hotel.address.includes(cityName));
        hotelCache.set(destination, result);
    }
    return hotelCache.get(destination);
}

function calculateFlightScore(flight) {
    const baseScore = 100;
    const priceScore = 100 - (flight.price / 10);
    const stopScore = 50 - (flight.stops.length * 10);
    return baseScore + priceScore + stopScore;
}

function calculateHotelScore(hotel) {
    const baseScore = 100;
    const starScore = hotel.stars * 10;
    const ratingScore = hotel.rating * 10;
    const priceScore = 100 - (hotel.price_per_night / 2);
    const amenitiesScore = hotel.amenities.length * 5;
    return baseScore + starScore + ratingScore + priceScore + amenitiesScore;
}

function calculateTripScore(outboundFlight, inboundFlight, hotel, nights) {
    const flightScore = (calculateFlightScore(outboundFlight) + calculateFlightScore(inboundFlight)) / 2;
    const hotelScore = calculateHotelScore(hotel);
    return (flightScore + hotelScore * nights) / (nights + 1);
}

function findBestTrips(origin, nights, budget) {
    const destinations = ['LAX', 'JFK', 'LHR', 'NRT', 'SYD'].filter(dest => dest !== origin);
    let allTrips = [];

    destinations.forEach(destination => {
        getFlights(origin, destination);
        getFlights(destination, origin);
        getHotels(destination);
    });

    for (const destination of destinations) {
        const outboundFlights = getFlights(origin, destination);
        const inboundFlights = getFlights(destination, origin);
        const availableHotels = getHotels(destination);

        if (outboundFlights.length > 0 && inboundFlights.length > 0 && availableHotels.length > 0) {
            for (const outbound of outboundFlights) {
                for (const inbound of inboundFlights) {
                    for (const hotel of availableHotels) {
                        const totalCost = outbound.price + inbound.price + (hotel.price_per_night * nights);
                        if (totalCost <= budget) {
                            const tripScore = calculateTripScore(outbound, inbound, hotel, nights);
                            allTrips.push({
                                destination,
                                outbound,
                                inbound,
                                hotel,
                                totalCost,
                                score: tripScore
                            });
                        }
                    }
                }
            }
        }
    }

    return allTrips.sort((a, b) => b.score - a.score);
}

let allTrips = [];
let currentlyDisplayedTrips = 0;

function displayResults(trips, startIndex = 0, count = 10) {
    const resultsDiv = document.getElementById('results');

    if (startIndex === 0) {
        resultsDiv.innerHTML = '';
        currentlyDisplayedTrips = 0;
    }

    if (trips.length === 0) {
        resultsDiv.innerHTML = '<p>No trips found within your budget.</p>';
        return;
    }

    const endIndex = Math.min(startIndex + count, trips.length);

    for (let i = startIndex; i < endIndex; i++) {
        const trip = trips[i];
        const tripDiv = document.createElement('div');
        tripDiv.innerHTML = `
            <h3>Trip ${i + 1} to ${trip.destination}</h3>
            <p>Outbound Flight: ${trip.outbound.from} to ${trip.outbound.to} - $${trip.outbound.price}</p>
            <p>Inbound Flight: ${trip.inbound.from} to ${trip.inbound.to} - $${trip.inbound.price}</p>
            <p>Hotel: ${trip.hotel.name} - $${trip.hotel.price_per_night} per night</p>
            <p>Total Cost: $${trip.totalCost}</p>
            <p>Trip Score: ${trip.score.toFixed(2)}</p>
            <hr>
        `;
        resultsDiv.appendChild(tripDiv);
    }

    currentlyDisplayedTrips = endIndex;

    let seeMoreButton = document.getElementById('seeMoreButton');
    if (!seeMoreButton) {
        seeMoreButton = document.createElement('button');
        seeMoreButton.id = 'seeMoreButton';
        seeMoreButton.textContent = 'See More';
        seeMoreButton.addEventListener('click', () => displayResults(allTrips, currentlyDisplayedTrips, 10));
        resultsDiv.appendChild(seeMoreButton);
    }

    seeMoreButton.style.display = currentlyDisplayedTrips < trips.length ? 'block' : 'none';
}

document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const origin = document.getElementById('origin').value;
    const nights = parseInt(document.getElementById('nights').value);
    const budget = parseInt(document.getElementById('budget').value);
    allTrips = findBestTrips(origin, nights, budget);
    displayResults(allTrips);
});

loadJSONData();