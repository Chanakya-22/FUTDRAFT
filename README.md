# FUTDRAFT

A football team-building and simulation platform inspired by modern Ultimate Team systems that combines intelligent draft generation, player-card mechanics, squad chemistry, match simulation engines, progression systems, and competitive gameplay into a mobile-first experience.

## Android Installation (Preview)

To test the current pre-release version of the application on an Android device or emulator:

1. Navigate to the latest release section of this repository.
2. Download the `FUTDRAFT.apk` file.
3. If installing on a physical device, permit installation from unknown sources in your Android security settings when prompted.

---

## Table of Contents

1. [Value Proposition](#value-proposition)
2. [System Architecture](#system-architecture)
3. [Application Workflow](#application-workflow)
4. [Core Gameplay Systems](#core-gameplay-systems)
5. [Draft Engine](#draft-engine)
6. [Match Simulation Engine](#match-simulation-engine)
7. [Card Pack System](#card-pack-system)
8. [Chemistry System](#chemistry-system)
9. [Player Progression](#player-progression)
10. [Data Layer](#data-layer)
11. [Technology Stack](#technology-stack)
12. [Hardware & Performance Benchmarks](#hardware--performance-benchmarks)
13. [Prerequisites](#prerequisites)
14. [Quick Start](#quick-start)
15. [Manual Setup](#manual-setup)
16. [Future Roadmap](#future-roadmap)
17. [API Reference](#api-reference)
18. [Environment Variables](#environment-variables)
19. [Project Structure](#project-structure)
20. [Versioning](#versioning)
21. [License](#license)

---

# Value Proposition

Traditional football games rely on static team selection and repetitive gameplay cycles.

FUTDRAFT introduces a more dynamic squad-building experience where:

- Every squad is unique
- Drafts generate different tactical combinations
- Player chemistry influences performance
- Match outcomes are simulation-driven
- Card rarity changes team potential
- Pack openings introduce probabilistic rewards
- Progression systems encourage long-term engagement

The goal is to create a football ecosystem where team-building decisions become as important as gameplay itself.

---

# System Architecture

```txt
User Interaction
        │
        ▼
┌─────────────────────────┐
│ React Native Frontend   │
│ Expo + TypeScript       │
│                         │
│ Squad UI               │
│ Draft Interface        │
│ Card Views             │
│ Match Screens          │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Application Layer       │
│                         │
│ Draft Engine            │
│ Match Simulation Engine │
│ Chemistry Engine        │
│ Pack System             │
│ Progression System      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Supabase Backend        │
│                         │
│ Player Database         │
│ User Data               │
│ Squad Saves             │
│ Match Statistics        │
│ Inventory               │
└──────────┬──────────────┘
           │
           ▼
     Persistent Storage
```

---

# Application Workflow

```txt
Launch Application
        │
        ▼

User Authentication
        │
        ▼

Generate Draft
        │
        ▼

Select Players
        │
        ▼

Build Squad
        │
        ▼

Calculate Chemistry
        │
        ▼

Save Squad
        │
        ▼

Start Match Simulation
        │
        ▼

Update Statistics
        │
        ▼

Rewards + Progression
```

---

# Core Gameplay Systems

FUTDRAFT consists of multiple connected gameplay modules.

### Squad Drafting

Randomized player generation constrained by formations.

### Match Simulations

Dynamic probability-based match calculations.

### Card Collection

Player acquisition through packs and rewards.

### Squad Chemistry

Relationship scores between players.

### Progression System

Long-term user progression and unlock systems.

### Competitive Modes

Ranked gameplay and leaderboards.

---

# Draft Engine

The current implementation generates players using positional requirements and automatically builds a valid squad structure.

Current implementation:

```txt
1 Goalkeeper
4 Defenders
3 Midfielders
3 Attackers
```

Draft generation pipeline:

```txt
Generate Draft Request
        │
        ▼

Query Supabase Player Data
        │
        ▼

Filter Players by Position
        │
        ▼

Random Selection
        │
        ▼

Validate Formation
        │
        ▼

Generate Final Squad
```

Future enhancements:

- Dynamic formations
- Captain selection
- Draft rounds
- Team chemistry previews
- Special event players
- Icons and Heroes
- AI-assisted recommendations

---

# Match Simulation Engine

The match engine will determine outcomes using player statistics and squad relationships.

Simulation factors:

| Attribute | Impact |
|-----------|---------|
| Rating | Overall player strength |
| Pace | Counter attacks |
| Shooting | Goal probability |
| Passing | Build-up quality |
| Dribbling | Chance creation |
| Defending | Defensive success |
| Physical | Ball retention |
| Chemistry | Team cohesion |

Simulation process:

```txt
Team Ratings
        │
        ▼

Chemistry Calculation
        │
        ▼

Attack Probability
        │
        ▼

Defensive Probability
        │
        ▼

Random Event Generation
        │
        ▼

Goal Simulation
        │
        ▼

Final Match Result
```

Example:

```txt
Squad A Rating: 88
Squad B Rating: 84

Chemistry:
Squad A → 95
Squad B → 80

Calculated Win Probability:

Squad A: 64%
Squad B: 36%
```

---

# Card Pack System

The pack-opening mechanism will implement weighted probabilities.

Card categories:

| Tier | Rating Range |
|--------|-------------|
| Bronze | 50–64 |
| Silver | 65–74 |
| Gold | 75–84 |
| Rare Gold | 85–89 |
| Special | 90+ |

Pack generation:

```txt
Open Pack
    │
    ▼

Generate Random Seed
    │
    ▼

Apply Probability Distribution
    │
    ▼

Select Card Tier
    │
    ▼

Select Player
    │
    ▼

Store Inventory
```

Planned pack types:

- Basic Pack
- Premium Pack
- Rare Pack
- Mega Pack
- Icon Pack
- Event Packs

---

# Chemistry System

Chemistry determines player compatibility.

Factors:

### Club Link

Players from the same club gain chemistry bonuses.

### League Link

Players from the same league receive moderate boosts.

### Nation Link

Players sharing nationality gain additional synergy.

### Position Compatibility

Out-of-position players reduce chemistry.

Formula:

```txt
Total Chemistry

=

Club Score
+
Nation Score
+
League Score
+
Position Score
```

Maximum chemistry:

```txt
100
```

---

# Player Progression

Long-term progression systems:

### User Leveling

Players earn XP after:

- Matches
- Draft completions
- Daily objectives
- Achievements

### Rewards

Unlockables:

- Coins
- Packs
- Stadium customization
- Player cards
- Cosmetic content

---

# Data Layer

Supabase manages:

- User accounts
- Player data
- Squad saves
- Match history
- Inventory
- Statistics
- Leaderboards

Example player schema:

```ts
{
id:number,
name:string,
rating:number,
position:string,
club:string,
nation:string,

pace:number,
shooting:number,
passing:number,
dribbling:number,
defending:number,
physical:number,

image_url:string
}
```

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Native |
| Mobile Framework | Expo |
| Language | TypeScript |
| Backend | Supabase |
| Database | PostgreSQL |
| State Management | React Hooks |
| Authentication | Supabase Auth |

---

# Hardware & Performance Benchmarks

Target device:

**iPhone 14 Plus**
**RTX 4060 Development Environment**

| Operation | Expected Time |
|------------|--------------|
| Draft Generation | < 1s |
| Squad Save | < 200ms |
| Match Simulation | < 500ms |
| Pack Opening | < 300ms |
| Player Search | < 100ms |

---

# Prerequisites

- Node.js 18+
- npm
- Expo CLI
- Supabase Project
- TypeScript

---

# Quick Start

```bash
git clone https://github.com/Chanakya-22/FUTDRAFT.git && cd FUTDRAFT && npm install && npx expo start
```

---

# Manual Setup

## Clone Repository

```bash
git clone https://github.com/Chanakya-22/FUTDRAFT.git

cd FUTDRAFT
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=

EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Start development server:

```bash
npx expo start
```

---

# Future Roadmap

## Phase 1

Core draft functionality

- Squad generation
- Player cards
- Selection system

---

## Phase 2

Gameplay mechanics

- Match simulation
- Chemistry engine
- Statistics

---

## Phase 3

Card systems

- Pack openings
- Inventory
- Rarity tiers

---

## Phase 4

Competitive systems

- Ranked matches
- Leaderboards
- Seasonal rewards

---

## Phase 5

Advanced features

- AI squad recommendations
- Transfer market
- Trading
- Online multiplayer
- Event cards

---

# API Reference

### Get Players

```txt
GET /players
```

Returns available players.

---

### Save Squad

```txt
POST /squad
```

Stores squad information.

---

### Match Simulation

```txt
POST /simulate
```

Runs match calculations.

---

### Open Pack

```txt
POST /packs/open
```

Generates player rewards.

---

# Environment Variables

| Variable | Description |
|------------|------------|
| EXPO_PUBLIC_SUPABASE_URL | Supabase project URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key |

---

# Project Structure

```txt
FUTDRAFT/

├── src/
│
├── api/
│   └── supabaseClient.ts
│
├── components/
│   └── Card/
│       └── PlayerCard.tsx
│
├── hooks/
│   └── useDraft.ts
│
├── screens/
│   └── DraftScreen.tsx
│
├── types/
│   └── index.ts
│
├── scripts/
│
├── App.tsx
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

---
The "Elevator Pitch"
"FUTDRAFT is a cross-platform mobile sports simulation application. The frontend is built using React Native and TypeScript, orchestrated by the Expo framework. For the backend architecture, I utilized Supabase (PostgreSQL) as a Backend-as-a-Service to handle real-time authentication, user states, and secure transactions. The app was compiled and distributed using Expo Application Services (EAS) for cloud-based CI/CD."

The Detailed Implementation (How you built it)
1. Frontend & State Management (The Client)

Tech: React Native, Expo, TypeScript, React Navigation.

Implementation: "I designed a premium, dark-mode 'glassmorphic' UI using custom LinearGradient layouts and expo-blur for native visual fidelity. Because the app requires complex game states (like managing active squads, opening packs, and simulating matches), I utilized React's Context API coupled with custom hooks (usePack, useMatchSim) to separate the game engine logic from the UI components. For performance, I implemented expo-image to heavily cache player assets and prevent network-heavy re-renders."

2. Backend Architecture (The Server)

Tech: Supabase (PostgreSQL), GoTrue Auth.

Implementation: "I moved away from local storage and implemented a cloud-first database. I used Supabase Auth, integrating it with React Native's AsyncStorage to ensure secure, persistent user sessions. To prevent client-side cheating (like users giving themselves infinite coins), the database handles economic transactions. I even wrote custom SQL Database Triggers—for example, automatically generating a starter wallet row in the user_balances table the millisecond a new user registers."

3. Local Testing & Development

Implementation: "During development, I leveraged the Expo Go client and the Android Studio Emulator. This allowed me to use Hot Module Replacement (fast refresh) to instantly see UI changes across different simulated devices without waiting for native compilations."

4. Building & Deployment (Production)

Tech: EAS (Expo Application Services), GitHub Releases.

Implementation: "To prepare for production, I injected my environment variables (like Supabase keys) securely into Expo's cloud vault using EAS Secrets. Instead of dealing with the massive overhead of local Android Studio Gradle builds, I utilized EAS Cloud Compilation. I triggered automated cloud builds via the EAS CLI to generate a signed, production-ready .apk binary. Finally, I established version control and distribution by hosting the binary via GitHub Releases for public beta testing."


# Versioning

This project follows Semantic Versioning.

Current release:

```txt
v1.0.0
```

---

# License

Apache License 2.0

Copyright 2026

Chanakya Jarubula
