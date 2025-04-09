const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve index.html for the root path
app.get('/', (req, res) => {
    console.log('Serving index.html from:', __dirname + '/index.html');
    res.sendFile(__dirname + '/index.html');
});

// Ollama configuration
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

// Ollama API configuration
const FLIGHT_API_KEY = 'YOUR_FLIGHT_API_KEY'; // Replace with actual API key

// Amadeus API configuration
const AMADEUS_CLIENT_ID = 'YOUR_AMADEUS_CLIENT_ID';
const AMADEUS_CLIENT_SECRET = 'YOUR_AMADEUS_CLIENT_SECRET';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v2';

// OpenSky API configuration
const OPENSKY_BASE_URL = 'https://opensky-network.org/api';
const OPENSKY_USERNAME = 'schaller.v@northeastern.edu';
const OPENSKY_PASSWORD = 'MKTG4604Project';

// Mapping for question descriptions
const questionDescriptions = {
    question8: {
        adventure: "Seeking thrilling and adventurous experiences.",
        relaxation: "Looking for a peaceful and relaxing getaway.",
        romance: "Aiming for a romantic and intimate vacation.",
        culturalimmersion: "Interested in exploring and immersing in local cultures.",
        familybonding: "Focused on spending quality time with family."
    },
    question9: {
        comfortseekers: "Prefers comfort and familiarity during travel.",
        softexplorer: "Willing to explore but within a safe and controlled environment.",
        curiouswanderer: "Enjoys discovering new places with moderate challenges.",
        thrillchaser: "Seeks adrenaline-pumping and adventurous activities.",
        offgridadventurer: "Prefers remote and unconventional travel experiences."
    }
};

// Sample flight data
const sampleFlights = [
    'Delta|JFK-CDG|420',
    'United|JFK-LHR|420',
    'American|JFK-FRA|450',
    'Air France|JFK-CDG|420',
    'British Airways|JFK-LHR|420',
    'Lufthansa|JFK-FRA|450',
    'Delta|LAX-CDG|600',
    'United|LAX-LHR|600',
    'American|LAX-FRA|630',
    'Air France|LAX-CDG|600',
    'British Airways|LAX-LHR|600',
    'Lufthansa|LAX-FRA|630',
    'Delta|BOS-CDG|390',
    'United|BOS-LHR|390',
    'American|BOS-FRA|420',
    'Air France|BOS-CDG|390',
    'British Airways|BOS-LHR|390',
    'Lufthansa|BOS-FRA|420'
];

// Update the region airports to use IATA codes
const regionAirports = {
    'east coast usa': ['BOS', 'JFK', 'LGA', 'EWR', 'PHL'],
    'west coast usa': ['LAX', 'SFO', 'SEA', 'SAN', 'LAS'],
    'europe': ['LHR', 'CDG', 'FRA', 'AMS', 'MUC'],
    'asia': ['NRT', 'ICN', 'SIN', 'HKG', 'BKK'],
    'australia': ['SYD', 'MEL', 'BNE', 'PER', 'ADL'],
    'south america': ['GRU', 'EZE', 'SCL', 'LIM', 'BOG'],
    'africa': ['JNB', 'CAI', 'NBO', 'LAD', 'CMN']
};

// Curated list of possible routes
const POSSIBLE_ROUTES = {
    'BOS': { // Boston
        'europe': ['LHR', 'CDG', 'FRA', 'AMS', 'MUC', 'DUB', 'SNN'],
        'asia': ['NRT', 'ICN', 'SIN', 'HKG', 'BKK'],
        'australia': ['SYD', 'MEL', 'BNE'],
        'south america': ['GRU', 'EZE', 'SCL'],
        'africa': ['JNB', 'CAI'],
        'east coast usa': ['JFK', 'LGA', 'EWR', 'PHL', 'DCA', 'IAD'],
        'west coast usa': ['LAX', 'SFO', 'SEA', 'SAN', 'LAS']
    },
    'JFK': { // New York
        'europe': ['LHR', 'CDG', 'FRA', 'AMS', 'MUC', 'DUB', 'SNN'],
        'asia': ['NRT', 'ICN', 'SIN', 'HKG', 'BKK'],
        'australia': ['SYD', 'MEL', 'BNE'],
        'south america': ['GRU', 'EZE', 'SCL'],
        'africa': ['JNB', 'CAI'],
        'east coast usa': ['BOS', 'LGA', 'EWR', 'PHL', 'DCA', 'IAD'],
        'west coast usa': ['LAX', 'SFO', 'SEA', 'SAN', 'LAS']
    },
    'LAX': { // Los Angeles
        'europe': ['LHR', 'CDG', 'FRA', 'AMS', 'MUC'],
        'asia': ['NRT', 'ICN', 'SIN', 'HKG', 'BKK'],
        'australia': ['SYD', 'MEL', 'BNE'],
        'south america': ['GRU', 'EZE', 'SCL'],
        'east coast usa': ['BOS', 'JFK', 'LGA', 'EWR', 'PHL', 'DCA', 'IAD'],
        'west coast usa': ['SFO', 'SEA', 'SAN', 'LAS']
    }
};

// Routes
app.post('/api/search-flights', async (req, res) => {
    console.log('[API] Received search request:', req.body);
    try {
        const preferences = req.body.preferences;
        
        // Get flight recommendations
        console.log('[API] Getting flight recommendations...');
        const flights = await getFlightRecommendations(preferences);
        
        // Get destination recommendations
        console.log('[API] Getting destination recommendations...');
        let recommendations = await getDestinationRecommendations(flights, preferences);
        
        // Ensure recommendations is properly formatted
        if (!Array.isArray(recommendations)) {
            recommendations = [recommendations];
        }
        
        // Validate each recommendation
        recommendations = recommendations.map(rec => {
            // Ensure all required fields are present
            if (!rec.destination) rec.destination = "Unknown Destination";
            if (!rec.summary) rec.summary = "No summary available.";
            if (!rec.safety_rating) rec.safety_rating = 3;
            if (!rec.activities) rec.activities = [{ name: "No activities listed", description: "No description available." }];
            if (!rec.hotels) rec.hotels = [{ name: "No hotels listed", category: "Unknown" }];
            if (!rec.travel_tips) rec.travel_tips = ["No travel tips available."];
            if (!rec.travel_tips) rec.travel_tips = ["No travel tips available."];
            
            return rec;
        });
        
        console.log('[API] Sending response to client with recommendations:', recommendations);
        res.json({
            flights,
            recommendations
        });
    } catch (error) {
        console.error('[API] Error processing request:', {
            error: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).json({ 
            error: 'Failed to process flight search',
            details: error.message 
        });
    }
});

// Helper functions
async function getAirports(location) {
    try {
        const prompt = `Find the IATA codes of airports near ${location}. Return only the IATA codes of the airports, separated by commas. For example: BOS, JFK, EWR`;
        
        const response = await axios.post(OLLAMA_API_URL, {
            model: 'mistral',
            prompt: prompt,
            stream: false
        });

        return response.data.response.split(',').map(code => code.trim());
    } catch (error) {
        console.error('Error getting airports:', error);
        return ['BOS', 'JFK', 'EWR'];
    }
}

async function getPopularAirports() {
    return [
        'LHR', 'JFK', 'CDG', 'DXB', 'SIN',
        'HKG', 'ICN', 'NRT', 'AMS', 'FRA',
        'SYD', 'MEL', 'BNE', 'MIA', 'LAX',
        'YVR', 'YYZ', 'YUL', 'CPH', 'MUC'
    ];
}

async function searchFlights(originAirports, destinationAirports, year, season, month, flightTypes) {
    const flights = [];
    const targetDate = getTargetDate(year, season, month);
    const beginTime = Math.floor(targetDate.getTime() / 1000);
    const endTime = beginTime + 86400;

    try {
        const response = await axios.get(
            `${OPENSKY_BASE_URL}/flights/all?` +
            `begin=${beginTime}&` +
            `end=${endTime}`,
            {
                auth: {
                    username: OPENSKY_USERNAME,
                    password: OPENSKY_PASSWORD
                }
            }
        );

        if (response.data) {
            const validFlights = response.data.filter(flight => {
                const isOriginMatch = originAirports.includes(flight.origin);
                const isDestinationMatch = destinationAirports.includes(flight.destination);
                const connections = flight.stops || 0;
                const matchesType = matchesFlightType(connections, flightTypes);
                
                return isOriginMatch && isDestinationMatch && matchesType;
            });

            flights.push(...validFlights.map(flight => ({
                airline: flight.airline || 'Unknown Airline',
                flightNumber: flight.callsign || 'N/A',
                departure: {
                    airport: flight.origin,
                    time: new Date(flight.firstSeen * 1000).toLocaleTimeString(),
                    date: new Date(flight.firstSeen * 1000).toLocaleDateString()
                },
                arrival: {
                    airport: flight.destination,
                    time: new Date(flight.lastSeen * 1000).toLocaleTimeString(),
                    date: new Date(flight.lastSeen * 1000).toLocaleDateString()
                },
                connections: flight.stops || 0
            })));
        }
    } catch (error) {
        console.error('Error searching flights:', error);
    }

    return flights;
}

// async function getRecommendations(destination, luxuryLevel, activities, groupSize, idealVacation, adventureLevel) {
//     try {
//         const prompt = `Based on the following preferences, provide detailed recommendations for ${destination}:
//         - Travel Style: ${luxuryLevel || 'Not specified'}
//         - Group Size: ${groupSize || 'Not specified'}
//         - Preferred Activities: ${activities?.join(', ') || 'Not specified'}
//         - Ideal Vacation: ${idealVacation?.join(', ') || 'Not specified'}
//         - Travel Adventure Level: ${adventureLevel?.join(', ') || 'Not specified'}
        
//         Please provide:
//         1. 3-5 accommodation options matching the luxury level
//         2. 5-7 activities or attractions
//         3. 3-5 dining recommendations
//         4. Any special tips or considerations for the group size
        
//         Format the response in a clear, structured way.`;

//         const response = await axios.post(OLLAMA_API_URL, {
//             model: 'mistral',
//             prompt: prompt,
//             stream: false
//         });

//         return response.data.response;
//     } catch (error) {
//         console.error('Error getting recommendations:', error);
//         return 'Unable to generate recommendations at this time.';
//     }
// }

async function getRecommendations(destination, luxuryLevel, activities, groupSize, idealVacation, adventureLevel) {
    try {
        const prompt = `Based on the following preferences, provide detailed recommendations for ${destination}:
        - Travel Style: ${luxuryLevel || 'Not specified'}
        - Group Size: ${groupSize || 'Not specified'}
        - Preferred Activities: ${activities?.join(', ') || 'Not specified'}
        - Ideal Vacation: ${idealVacation?.join(', ') || 'Not specified'}
        - Travel Adventure Level: ${adventureLevel?.join(', ') || 'Not specified'}
        
        Please provide:
        1. 3-5 accommodation options matching the luxury level
        2. 5-7 activities or attractions
        3. 3-5 dining recommendations
        4. Any special tips or considerations for the group size
        
        Format the response in a clear, structured way.`;

        const response = await axios.post(OLLAMA_API_URL, {
            model: 'mistral',
            prompt: prompt,
            stream: false
        });

        return response.data.response;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return 'Unable to generate recommendations at this time.';
    }
}

function getTargetDate(year, season, month) {
    const date = new Date();
    date.setFullYear(parseInt(year));
    
    if (!season && !month) {
        date.setMonth(5); // June
    } else if (season && !month) {
        const seasonMonths = {
            'spring': 2, 'summer': 5, 'fall': 8, 'winter': 11
        };
        date.setMonth(seasonMonths[season.toLowerCase()]);
    } else if (month) {
        const monthMap = {
            'january': 0, 'february': 1, 'march': 2, 'april': 3,
            'may': 4, 'june': 5, 'july': 6, 'august': 7,
            'september': 8, 'october': 9, 'november': 10, 'december': 11
        };
        date.setMonth(monthMap[month.toLowerCase()]);
    }
    
    if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
    }
    
    return date;
}

function matchesFlightType(connections, flightTypes) {
    if (flightTypes.length === 0) return true;
    
    if (connections === 0 && flightTypes.includes('direct')) return true;
    if (connections === 1 && flightTypes.includes('1connection')) return true;
    if (connections > 1 && flightTypes.includes('multiple')) return true;
    
    return false;
}

// Function to get airport codes using Ollama
async function getAirportCodes(location) {
    try {
        console.log(`[Airport Lookup] Starting lookup for location: ${location}`);

        // If location is empty or undefined, return default airports
        if (!location || location.trim() === '') {
            console.log(`[Airport Lookup] No location provided, returning default airports`);
            return ['JFK', 'LAX', 'LHR', 'CDG', 'SIN'];
        }

        const normalizedLocation = location.toLowerCase().trim();
        
        // Check if it's a region
        if (regionAirports[normalizedLocation]) {
            console.log(`[Airport Lookup] Found region airports for ${location}:`, regionAirports[normalizedLocation]);
            return regionAirports[normalizedLocation];
        }

        // Check if it's a direct airport code (3 letters)
        if (/^[A-Z]{3}$/i.test(normalizedLocation)) {
            console.log(`[Airport Lookup] Location is already an airport code: ${normalizedLocation.toUpperCase()}`);
            return [normalizedLocation.toUpperCase()];
        }

        // If not a region, use Ollama to find specific airport codes
        const response = await axios.post(OLLAMA_API_URL, {
            model: "mistral",
            prompt: `You are a travel expert. Find the top 5 most popular IATA airport codes for airports near ${location}. 
            Consider only major international airports that handle the most passenger traffic.
            Return only the IATA codes separated by commas, without any additional text.
            Remember that IATA codes are 3 letters long.`,
            stream: false
        });
        
        // Extract just the IATA codes (3 letters)
        const codes = response.data.response.split(',')
            .map(code => code.trim().match(/[A-Z]{3}/)?.[0])
            .filter(code => code)
            .slice(0, 5);
            
        console.log(`[Airport Lookup] Found codes for ${location}:`, codes);
        
        // If no codes found, return default airports
        if (codes.length === 0) {
            console.log(`[Airport Lookup] No codes found for ${location}, returning default airports`);
            return ['JFK', 'LAX', 'LHR', 'CDG', 'SIN'];
        }
        
        return codes;
    } catch (error) {
        console.error('[Airport Lookup] Error:', {
            location,
            error: error.message,
            stack: error.stack
        });
        // Return default airports on error
        return ['JFK', 'LAX', 'LHR', 'CDG', 'SIN'];
    }
}

// Function to get Amadeus access token
async function getAmadeusToken() {
    try {
        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
            `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('[Amadeus] Error getting token:', error);
        return null;
    }
}

// Function to check if a route exists
async function checkRouteExists(origin, destination) {
    try {
        const token = await getAmadeusToken();
        if (!token) return false;

        const response = await axios.get(
            `${AMADEUS_BASE_URL}/shopping/flight-offers`,
            {
                params: {
                    originLocationCode: origin,
                    destinationLocationCode: destination,
                    departureDate: '2024-12-01', // Using a future date
                    adults: 1,
                    nonStop: false,
                    max: 1
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data.data.length > 0;
    } catch (error) {
        console.error('[Amadeus] Error checking route:', error);
        return false;
    }
}

// Function to get possible routes
async function getPossibleRoutes(origin, destination) {
    try {
        const originCodes = await getAirportCodes(origin);
        const destinationCodes = await getAirportCodes(destination);
        
        console.log('[Route Check] Checking possible routes between:', {
            origin: originCodes,
            destination: destinationCodes
        });

        const possibleRoutes = [];
        for (const originCode of originCodes) {
            for (const destCode of destinationCodes) {
                const exists = await checkRouteExists(originCode, destCode);
                if (exists) {
                    possibleRoutes.push({
                        origin: originCode,
                        destination: destCode
                    });
                }
            }
        }

        console.log('[Route Check] Found possible routes:', possibleRoutes);
        return possibleRoutes;
    } catch (error) {
        console.error('[Route Check] Error:', error);
        return [];
    }
}

// Function to get flight recommendations
async function getFlightRecommendations(preferences) {
    try {
        console.log('[Flight Search] Received preferences:', preferences);
        
        // Get airport codes for origin and destination
        const originCodes = await getAirportCodes(preferences.origin);
        const destinationCodes = await getAirportCodes(preferences.destination);
        
        console.log('[Flight Search] Airport codes:', {
            origin: originCodes,
            destination: destinationCodes
        });
        
        // Process the sample dataset
        const processedFlights = sampleFlights.map(flight => {
            const [airline, route, duration] = flight.split('|');
            const [origin, destination] = route.split('-');
            return {
                airline,
                origin,
                destination,
                duration: parseInt(duration)
            };
        });
        
        // Find matching flights
        let matchingFlights = processedFlights.filter(flight => 
            originCodes.includes(flight.origin) && destinationCodes.includes(flight.destination)
        );
        
        console.log('[Flight Search] Found matching flights:', matchingFlights.length);
        
        // If no direct flights found, try to find any flights to the destination
        if (matchingFlights.length === 0) {
            console.log('[Flight Search] No direct flights found, looking for any flights to destination');
            matchingFlights = processedFlights.filter(flight => 
                destinationCodes.includes(flight.destination)
            );
        }
        
        // If still no flights found, return some sample flights
        if (matchingFlights.length === 0) {
            console.log('[Flight Search] No flights found, returning sample flights');
            return [
                {
                    airline: 'Sample Airlines',
                    flightNumber: 'SA123',
                    departure: {
                        airport: originCodes[0] || 'JFK',
                        time: '10:00 AM'
                    },
                    arrival: {
                        airport: destinationCodes[0] || 'LAX',
                        time: '1:00 PM'
                    },
                    duration: 180,
                    price: 299,
                    stops: 0
                },
                {
                    airline: 'Sample Airlines',
                    flightNumber: 'SA456',
                    departure: {
                        airport: originCodes[0] || 'JFK',
                        time: '2:00 PM'
                    },
                    arrival: {
                        airport: destinationCodes[0] || 'LAX',
                        time: '5:00 PM'
                    },
                    duration: 180,
                    price: 399,
                    stops: 1
                }
            ];
        }
        
        // Process the matching flights into the required format
        const flights = matchingFlights.map(flight => {
            const departureTime = new Date();
            departureTime.setHours(10 + Math.floor(Math.random() * 10));
            
            const arrivalTime = new Date(departureTime);
            arrivalTime.setMinutes(arrivalTime.getMinutes() + flight.duration);
            
            return {
                airline: flight.airline,
                flightNumber: `${flight.airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`,
                departure: {
                    airport: flight.origin,
                    time: departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                arrival: {
                    airport: flight.destination,
                    time: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                duration: flight.duration,
                price: Math.floor(Math.random() * 500) + 200,
                stops: Math.floor(Math.random() * 2)
            };
        });
        
        // Filter based on flight type preference
        if (preferences.flightType === 'direct') {
            return flights.filter(flight => flight.stops === 0);
        } else if (preferences.flightType === 'connecting') {
            return flights.filter(flight => flight.stops > 0);
        }
        
        return flights;
    } catch (error) {
        console.error('[Flight Search] Error:', error);
        // Return sample flights on error
        return [
            {
                airline: 'Sample Airlines',
                flightNumber: 'SA123',
                departure: {
                    airport: 'JFK',
                    time: '10:00 AM'
                },
                arrival: {
                    airport: 'LAX',
                    time: '1:00 PM'
                },
                duration: 180,
                price: 299,
                stops: 0
            }
        ];
    }
}

// Function to get destination recommendations using Ollama
async function getDestinationRecommendations(flights, preferences) {
    try {
        console.log('[Recommendations] Generating recommendations for destinations:', flights);

        // Use the user's destination preference if available
        const userDestination = preferences.destination || '';
        console.log('[Recommendations] User destination preference:', userDestination);

       // Include descriptions for questions 8 and 9
        const question8Values = preferences.question8?.values?.join(', ') || 'Not specified';
        const question8Descriptions = preferences.question8?.descriptions?.join(', ') || 'Not specified';
        const question9Values = preferences.question9?.values?.join(', ') || 'Not specified';
        const question9Descriptions = preferences.question9?.descriptions?.join(', ') || 'Not specified';

        // Create a prompt for Ollama
        const prompt = `
        You are a travel expert. Based on the following user preferences, generate detailed travel recommendations:
        - Destination: ${userDestination || flights.map(f => f.arrival.airport).join(', ')}
        - Group Size: ${preferences.groupSize || 'Not specified'}
        - Travel Style: ${preferences.question6 || 'Not specified'}
        - Ideal Vacation: ${question8Values} Description: ${question8Descriptions}
        - Travel Adventure Level: ${question9Values} Description: ${question9Descriptions}
        - Preferred Activities: ${preferences.activities?.join(', ') || 'Not specified'}

        For each destination, provide:
        1. A brief summary of the destination (1-2 sentences).
        2. A safety rating (1-5 scale).
        3. 3-5 recommended activities or attractions based on ideal vacation and adventure level, with descriptions.
        4. 3-5 hotel options, categorized by luxury level (e.g., Budget, Mid-range, Luxury).
        5. 3-5 travel tips specific to the destination.


        Example Output:
        {
            "destination": "Paris",
            "summary": "Paris is known as the City of Light, offering iconic landmarks, rich history, and world-class cuisine.",
            "safety_rating": 4,
            "activities": [
                { "name": "Eiffel Tower Visit", "description": "Enjoy breathtaking, romantic views of Paris from the top of the Eiffel Tower." },
                { "name": "Louvre Museum", "description": "Explore the world's largest art museum, home to the Mona Lisa." }
            ],
            "hotels": [
                { "name": "Hotel Ritz", "category": "Luxury" },
                { "name": "Hotel Ibis", "category": "Budget" }
            ],
            "travel_tips": [
                "Learn basic French phrases to communicate with locals.",
                "Avoid tourist traps by exploring lesser-known neighborhoods like Le Marais."
            ]
        }

        Ensure the response is valid JSON.
        `;

        console.log('[Recommendations] Sending prompt to Ollama:', prompt);

        // Call Ollama API
        const response = await axios.post(OLLAMA_API_URL, {
            model: 'mistral',
            prompt: prompt,
            stream: false
        });

        console.log('[Recommendations] Received response from Ollama:', response.data);

        // Extract the response text
        let responseText = response.data.response;
        console.log('[Recommendations] Raw response text:', responseText);

        // Try to find JSON in the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
            console.log('[Recommendations] Extracted JSON from response:', responseText);
        }

        // Try to parse the JSON
        let recommendations;
        try {
            recommendations = JSON.parse(responseText);
            console.log('[Recommendations] Successfully parsed recommendations:', recommendations);
        } catch (parseError) {
            console.error('[Recommendations] Failed to parse JSON:', parseError);

            // Return fallback recommendations instead of throwing
            return generateFallbackRecommendations([userDestination], preferences);
        }

        // Ensure recommendations is an array
        if (!Array.isArray(recommendations)) {
            recommendations = [recommendations];
        }

        // Validate and fix each recommendation
        recommendations = recommendations.map(rec => {
            // Ensure all required fields are present
            if (!rec.destination) rec.destination = userDestination || "Unknown Destination";
            if (!rec.summary) rec.summary = "No summary available.";
            if (!rec.safety_rating) rec.safety_rating = 3;
            if (!rec.activities) rec.activities = [{ name: "No activities listed", description: "No description available." }];
            if (!rec.hotels) rec.hotels = [{ name: "No hotels listed", category: "Unknown" }];
            if (!rec.travel_tips) rec.travel_tips = ["No travel tips available."];

            return rec;
        });

        console.log('[Recommendations] Final recommendations:', recommendations);
        return recommendations;
    } catch (error) {
        console.error('[Recommendations] Error:', error);
        return generateFallbackRecommendations([preferences.destination], preferences);
    }
}

// Helper function to generate fallback recommendations
function generateFallbackRecommendations(destinations, preferences) {
    console.log('[Recommendations] Generating fallback recommendations for:', destinations);
    
    // Ensure destinations is an array
    if (!Array.isArray(destinations) || destinations.length === 0) {
        destinations = [preferences.destination || 'Paris'];
    }
    
    // Create fallback recommendations
    const fallbackRecommendations = destinations.map(destination => {
        return {
            destination: destination,
            summary: `A beautiful destination with many attractions and activities to enjoy.`,
            safety_rating: 4,
            activities: [
                {
                    name: "City Tour",
                    description: "Explore the city's main attractions and landmarks."
                },
                {
                    name: "Local Cuisine",
                    description: "Sample the local food and drinks."
                }
            ],
            hotels: [
                {
                    name: "Grand Hotel",
                    category: "Luxury"
                },
                {
                    name: "City Inn",
                    category: "Mid-range"
                }
            ],
            travel_tips: [
                "Always carry a map or use a GPS app.",
                "Learn a few basic phrases in the local language.",
                "Keep your valuables secure and be aware of your surroundings."
            ]
        };
    });
    
    console.log('[Recommendations] Generated fallback recommendations:', fallbackRecommendations);
    return fallbackRecommendations;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Server is running on http://localhost:${PORT}`);
    console.log(`[Server] Press Ctrl+C to stop the server`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
    } else {
        console.error(`[Server] Error starting server:`, err);
        process.exit(1);
    }
}); 