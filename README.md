# Weather Sensor Benchmark

A Nostr-based application for comparing weather sensors across multiple weather stations.

## Features

- **Multi-Station Support**: Track and compare data from multiple weather stations
- **Sensor Comparison**: Create custom comparisons to benchmark specific sensors
- **Real-Time Data**: Automatically fetches latest sensor readings from Nostr relays
- **Dual Time Ranges**: 
  - Last Hour (1-minute intervals)
  - Last 24 Hours (15-minute intervals)
- **Dual View Modes**:
  - Chart View: Visual line graphs for trend analysis
  - Table View: Statistical comparison (min, max, avg, latest)
- **Persistent Comparisons**: All comparisons are saved to localStorage

## How It Works

The application queries the Nostr relay `wss://relay.samt.st` for:

1. **Weather Station Metadata** (kind 16158): Station information, available sensors
2. **Sensor Readings** (kind 4223): Time-series sensor data

### Supported Sensor Types

- `temp`: Temperature (°C)
- `humidity`: Humidity (%)
- `pm1`, `pm25`, `pm10`: Particulate matter (µg/m³)
- `air_quality`: Air quality (raw analog 0-1023)

## Usage

### Creating a Comparison

1. Click "New Comparison" button
2. Enter a descriptive name (e.g., "Temperature Sensors Comparison")
3. Click "Create Comparison"

### Adding Sensors to a Comparison

1. Within a comparison, click "Add Sensor"
2. Select a weather station from the dropdown
3. Select a sensor from that station
4. Click "Add Sensor"
5. Repeat to add more sensors (you can add the same sensor type from different stations)

### Viewing Data

- **Time Range Toggle**: Switch between "Last Hour" and "Last 24 Hours"
- **View Tabs**: Switch between "Chart View" and "Table View"
- **Chart View**: Line graph showing sensor readings over time
- **Table View**: Statistical summary (data points, min, max, avg, latest)

### Managing Comparisons

- **Remove Sensor**: Click the × on a sensor badge
- **Delete Comparison**: Click the trash icon in the comparison header

## Data Freshness

- Weather station metadata: Cached for 5 minutes
- Sensor readings: Cached for 30 seconds
- Queries timeout after 10 seconds

## Weather Station Setup

To publish data to this relay, use the [Nostr Weather Station](https://github.com/samthomson/weather) project with ESP8266 or ESP32 hardware.

## Technical Details

### Nostr Event Kinds

- **Kind 16158** (Replaceable): Weather station metadata
  - Tags: `name`, `g` (geohash), `power`, `connectivity`, `sensor`
  
- **Kind 4223** (Regular): Sensor readings
  - Tags: `t` (weather), `a` (station reference), sensor data tags

### Architecture

- **React 18** with TypeScript
- **Nostrify** for Nostr protocol integration
- **Recharts** for data visualization
- **TanStack Query** for data fetching and caching
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

---

Vibed with [Shakespeare](https://shakespeare.diy)
