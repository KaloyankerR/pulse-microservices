package main

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Event struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CreatorID   string     `json:"creator_id"`
	StartDate   time.Time  `json:"start_date"`
	EndDate     time.Time  `json:"end_date"`
	Location    string     `json:"location"`
	EventType   string     `json:"event_type"`
	VirtualLink string     `json:"virtual_link"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	RsvpCounts  RsvpCounts `json:"rsvp_counts"`
	UserRsvp    string     `json:"user_rsvp"`
	Creator     *Creator   `json:"creator,omitempty"`
}

type Creator struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarUrl   string `json:"avatar_url"`
}

type RsvpCounts struct {
	Yes   int `json:"yes"`
	Maybe int `json:"maybe"`
	No    int `json:"no"`
}

type EventsResponse struct {
	Events      []Event `json:"events"`
	Page        int     `json:"page"`
	Size        int     `json:"size"`
	TotalEvents int     `json:"totalEvents"`
	TotalPages  int     `json:"totalPages"`
}

type CreateEventRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	StartDate   string `json:"start_date" binding:"required"`
	EndDate     string `json:"end_date" binding:"required"`
	Location    string `json:"location"`
	EventType   string `json:"event_type"`
	VirtualLink string `json:"virtual_link"`
	CreatorID   string `json:"creator_id"`
}

type RsvpRequest struct {
	Status string `json:"status" binding:"required"`
}

// Events storage - starts empty
var mockEvents = []Event{}

func main() {
	// Set Gin to release mode for production-like behavior
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Auth-Token")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "event-service"})
	})

	// API routes
	api := r.Group("/api")
	{
		events := api.Group("/events")
		{
			events.GET("", getEvents)
			events.POST("", createEvent)
			events.GET("/:id", getEventByID)
			events.PUT("/:id", updateEvent)
			events.DELETE("/:id", deleteEvent)
			events.POST("/:id/rsvp", rsvpToEvent)
			events.GET("/:id/attendees", getEventAttendees)
		}
	}

	port := ":8083"
	log.Printf("Event Service starting on port %s", port)
	log.Fatal(r.Run(port))
}

func getEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	// Calculate pagination
	totalEvents := len(mockEvents)
	totalPages := (totalEvents + size - 1) / size
	start := page * size
	end := start + size

	if start >= totalEvents {
		c.JSON(200, EventsResponse{
			Events:      []Event{},
			Page:        page,
			Size:        size,
			TotalEvents: totalEvents,
			TotalPages:  totalPages,
		})
		return
	}

	if end > totalEvents {
		end = totalEvents
	}

	events := mockEvents[start:end]

	c.JSON(200, EventsResponse{
		Events:      events,
		Page:        page,
		Size:        size,
		TotalEvents: totalEvents,
		TotalPages:  totalPages,
	})
}

func createEvent(c *gin.Context) {
	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid start date format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid end date format"})
		return
	}

	// Create new event
	newEvent := Event{
		ID:          fmt.Sprintf("%d", len(mockEvents)+1),
		Title:       req.Title,
		Description: req.Description,
		CreatorID:   req.CreatorID, // Use the creator_id from the request
		StartDate:   startDate,
		EndDate:     endDate,
		Location:    req.Location,
		EventType:   req.EventType,
		VirtualLink: req.VirtualLink,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		RsvpCounts:  RsvpCounts{Yes: 0, Maybe: 0, No: 0},
		UserRsvp:    "",
	}

	mockEvents = append(mockEvents, newEvent)
	c.JSON(201, newEvent)
}

func getEventByID(c *gin.Context) {
	id := c.Param("id")

	for _, event := range mockEvents {
		if event.ID == id {
			c.JSON(200, event)
			return
		}
	}

	c.JSON(404, gin.H{"error": "Event not found"})
}

func updateEvent(c *gin.Context) {
	id := c.Param("id")

	for i, event := range mockEvents {
		if event.ID == id {
			var req CreateEventRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "Invalid request", "message": err.Error()})
				return
			}

			// Parse dates
			startDate, err := time.Parse(time.RFC3339, req.StartDate)
			if err != nil {
				c.JSON(400, gin.H{"error": "Invalid start date format"})
				return
			}

			endDate, err := time.Parse(time.RFC3339, req.EndDate)
			if err != nil {
				c.JSON(400, gin.H{"error": "Invalid end date format"})
				return
			}

			// Update event
			mockEvents[i].Title = req.Title
			mockEvents[i].Description = req.Description
			mockEvents[i].StartDate = startDate
			mockEvents[i].EndDate = endDate
			mockEvents[i].Location = req.Location
			mockEvents[i].EventType = req.EventType
			mockEvents[i].VirtualLink = req.VirtualLink
			mockEvents[i].UpdatedAt = time.Now()

			c.JSON(200, mockEvents[i])
			return
		}
	}

	c.JSON(404, gin.H{"error": "Event not found"})
}

func deleteEvent(c *gin.Context) {
	id := c.Param("id")

	for i, event := range mockEvents {
		if event.ID == id {
			mockEvents = append(mockEvents[:i], mockEvents[i+1:]...)
			c.JSON(200, gin.H{"message": "Event deleted successfully"})
			return
		}
	}

	c.JSON(404, gin.H{"error": "Event not found"})
}

func rsvpToEvent(c *gin.Context) {
	id := c.Param("id")
	var req RsvpRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	for i, event := range mockEvents {
		if event.ID == id {
			// Update RSVP counts (simplified logic)
			if event.UserRsvp == "YES" {
				mockEvents[i].RsvpCounts.Yes--
			} else if event.UserRsvp == "MAYBE" {
				mockEvents[i].RsvpCounts.Maybe--
			} else if event.UserRsvp == "NO" {
				mockEvents[i].RsvpCounts.No--
			}

			if req.Status == "YES" {
				mockEvents[i].RsvpCounts.Yes++
			} else if req.Status == "MAYBE" {
				mockEvents[i].RsvpCounts.Maybe++
			} else if req.Status == "NO" {
				mockEvents[i].RsvpCounts.No++
			}

			mockEvents[i].UserRsvp = req.Status
			c.JSON(200, gin.H{"message": "RSVP updated successfully"})
			return
		}
	}

	c.JSON(404, gin.H{"error": "Event not found"})
}

func getEventAttendees(c *gin.Context) {
	id := c.Param("id")

	for _, event := range mockEvents {
		if event.ID == id {
			// Return empty attendees list
			attendees := []gin.H{}
			c.JSON(200, attendees)
			return
		}
	}

	c.JSON(404, gin.H{"error": "Event not found"})
}
