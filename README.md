# NYC Fresh Finder  

A collaborative project by **Emily**, **Michael**, and **Satyam**.

NYC Fresh Finder is a web application designed to help NYC residents locate **healthy**, **affordable**, and **accessible** food options. Through user-submitted item cards with prices and store details, interactive mapping, and community resources, the platform supports informed food choices, especially in areas affected by food deserts.

---

## Table of Contents
- [Project Overview](#project-overview)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Ethical Considerations](#ethical-considerations)  
- [Team Roles](#team-roles)  
- [Challenges & Lessons Learned](#challenges--lessons-learned)  
- [Future Work](#future-work)  
- [Presentation Slides](#presentation-slides)  
- [Getting Started](#getting-started)  
- [License](#license)

---

## Project Overview

Many NYC residents face difficulty accessing fresh groceries. Corner stores lack produce, and supermarkets may be costly or require long transit trips.

NYC Fresh Finder provides:  
- Real-time food access visibility  
- Community resource mapping  
- User-submitted item cards with prices and store details  
- Food desert identification  
- Store reviews and ratings  

The mission is to make healthy food accessible for everyone.

---

## Features

- Interactive Map highlighting food deserts and fresh food locations  
- User-Submitted Item Cards (users log prices and details of grocery items they see in stores)  
- Community Programs & Resources (pantries, farmers markets, etc.)  
- User Reviews for local grocery stores  

---

## Tech Stack

### Frontend
- HTML, CSS, JavaScript  
- Leaflet.js  
- Responsive design  

### Backend
- Node.js  
- Express.js  
- PostgreSQL database  
- REST APIs + authentication  

### Data Processing
- Python (Pandas, NumPy, GeoPandas)  
- Dataset cleaning & formatting  
- Food desert heatmap generation  

---

## Ethical Considerations

- Unverified User Data: Item card submissions may be inaccurate  
- Data Security: User accounts and submissions must be protected  
- Accessibility: Requires future support for non-English speakers  

---

## Team Roles

### Emily — Project Lead, Data Analysis, Frontend Development
- Originated the NYC Fresh Finder idea and project vision  
- Led project planning, task breakdown, and timeline creation  
- Cleaned, formatted, and structured large NYC food datasets  
- Implemented interactive map features and UI components  

### Michael — Backend Development
- Designed PostgreSQL database schema  
- Built REST APIs and server-side logic  
- Developed authentication and data storage layers  

### Satyam — Frontend Development
- Created initial UI prototype and layout  
- Implemented reviews and item cards  
- Contributed to user interface design and interactions  

---

## Challenges & Lessons Learned

**Time Constraints**  
The team faced significant time pressure in the final weeks, requiring rapid implementation, coordination, and debugging.

**Data Limitations**  
NYC datasets were more limited than expected. This required creative redesigns, workarounds, and adjusting feature scope.

---

## Future Work

- Income-Based Affordability View (not completed in the initial build)  
- Broader datasets beyond NYC  
- Stronger authentication and security enhancements  
- More advanced comparison page  
- Multilingual accessibility  
- Optional real-time store inventory integration  

---

## Presentation Slides 
[NYC Fresh Finder Slides](./NYCFreshFinder_Final_Presentation.pdf).

---

## Getting Started

### Prerequisites
- Node.js  
- PostgreSQL  
- Python 3.x  

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/nyc-fresh-finder.git
cd nyc-fresh-finder

# Install backend dependencies
npm install

# Add environment variables
cp .env.example .env

# Start backend
npm start
