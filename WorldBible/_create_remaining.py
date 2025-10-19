#!/usr/bin/env python3
"""
Create framework files for Locations, Factions, Narrative, Visual, Audio, and Gameplay sections.
"""

import os

# LOCATIONS
locations = [
    ("TimeNexus.md", "The Time Nexus", "Central Hub & Team Headquarters", "Framework established"),
    ("DrEntropysLair.md", "Dr. Entropy's Lair", "Antagonist Base of Operations", "Outline only"),
    ("AcceleratedQuarter.md", "The Accelerated Quarter", "Urban Zone at 3.0 RFR", "Placeholder"),
    ("ContemplativeSanctuaries.md", "Contemplative Sanctuaries", "Dilated Zones for Meditation", "Placeholder"),
    ("FracturedWastes.md", "The Fractured Wastes", "Dangerous Chaotic Time Zone", "Placeholder"),
    ("BaselineMetropolitan.md", "Baseline Metropolitan", "Major City at Standard Time Flow", "Placeholder"),
]

for filename, name, description, status in locations:
    content = f"""# {name}

**Part IV: Locations**  
**Status:** 📝 {status.upper()}

---

## Quick Reference

**Location Type:** {description}  
**Temporal Classification:** [TO BE DEFINED]  
**Accessibility:** [TO BE DEFINED]

---

## Overview

{name} is a key location in the Temporal Tides universe. [Expand with full description]

---

## Sections to Complete

Following the [Location Guidelines](../../.cursor/rules/locations-worldbuilding.mdc), this entry should include:

### 1. Location Header
- Official name and colloquial names
- Location type
- Temporal classification
- Accessibility level
- First appearance in narrative

### 2. Overview
- One-sentence summary
- Significance to story/universe
- Atmosphere and feel

### 3. Physical Description
- Geography and terrain
- Architecture and structures
- Scale and scope
- Sensory details (visual, auditory, tactile)
- Visual style and color palette

### 4. Temporal Properties
- Time flow rate (RFR)
- Temporal anomalies present
- How different characters experience it
- Temporal history
- Dangers and benefits

### 5. History & Origin
- How/when it came to be
- Major events in its timeline
- Evolution over time
- Mysteries and legends

### 6. Inhabitants & Culture
- Population and demographics
- Social structure
- Cultural practices
- How residents adapt to temporal properties
- Notable figures

### 7. Function & Purpose
- Primary use
- Resources it provides
- Strategic value
- Story function

### 8. Points of Interest
- Key sub-locations
- Landmarks
- Hidden areas
- Gathering spots

### 9. Connections
- Access points
- Nearby locations
- Portal/wormhole links
- Relationships to other places

### 10. Gameplay/Narrative Elements
- Puzzles and challenges
- How abilities work differently here
- Plot hooks
- Mood and tone

---

**Cross-References:**
- [Temporal Physics](../../01_UniverseFundamentals/02_TemporalPhysics.md) - Zone classifications
- [The Team](../../05_Factions/TheTeam.md) - How team interacts with this location
- [Location Guidelines](../../.cursor/rules/locations-worldbuilding.mdc) - Development rules

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"04_Locations/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created location: {filename}")

# FACTIONS
factions = [
    ("TheTeam.md", "The Team", "Vibrion's assembled heroes", "Outline established"),
    ("TemporalResearchCouncil.md", "Temporal Research Council", "Governing body for temporal matters", "Placeholder"),
    ("EntropyForces.md", "Dr. Entropy's Forces", "Antagonist organization", "Placeholder"),
]

for filename, name, description, status in factions:
    content = f"""# {name}

**Part V: Factions & Organizations**  
**Status:** 📝 {status.upper()}

---

## Quick Reference

**Official Name:** {name}  
**Type:** {description}  
**Formation:** [TO BE DEFINED]  
**Current Status:** [TO BE DEFINED]

---

## Overview

[Brief description of the faction's role in the Temporal Tides universe]

---

## Sections to Complete

### 1. Organization Header
- Official and unofficial names
- Formation date
- Current status and size
- Primary base/headquarters
- Leadership structure

### 2. Purpose & Goals
- Primary mission
- Short-term objectives
- Long-term vision
- Methods and approach

### 3. History
- Founding story
- Major events and milestones
- Evolution over time
- Successes and failures

### 4. Membership
- Key members and roles
- Recruitment process
- Size and composition
- Requirements for joining

### 5. Structure & Hierarchy
- Leadership positions
- Organizational chart
- Decision-making process
- Internal factions or divisions

### 6. Resources
- Funding and finances
- Technology and equipment
- Territory or locations
- Alliances and connections

### 7. Philosophy & Culture
- Core beliefs and values
- Internal culture
- External reputation
- Symbols and traditions

### 8. Relationships
- Allies and enemies
- Neutral parties
- Historical conflicts
- Current diplomatic status

### 9. Story Role
- Narrative function
- Impact on plot
- Character connections
- Thematic significance

---

**Cross-References:**
- [Characters](../../03_Characters/) - Key members
- [Locations](../../04_Locations/) - Bases and territories
- [Universal Timeline](../../02_CivilizationalElements/01_UniversalTimeline.md) - Historical context

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"05_Factions/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created faction: {filename}")

# NARRATIVE
narrative_files = [
    ("StoryStructure.md", "Story Structure", "The Non-Linear Resonance Model", "Framework established"),
    ("Themes.md", "Themes & Motifs", "Core thematic elements", "Outline established"),
    ("ChapterBreakdown.md", "Chapter-by-Chapter Breakdown", "20-chapter structure detailed", "Placeholder"),
    ("WritingGuidelines.md", "Writing Guidelines", "Tone, voice, and style rules", "Placeholder"),
]

for filename, name, description, status in narrative_files:
    content = f"""# {name}

**Part VI: Narrative Design**  
**Status:** 📝 {status.upper()}

---

## Overview

{description}

---

## Content to Develop

[This section should contain detailed narrative guidance following the [Narrative Structure Guidelines](../../.cursor/rules/narrative-structure.mdc)]

---

## Key Elements

[Expand with specific content based on original world bible and narrative rules]

---

**Cross-References:**
- [Narrative Structure Rules](../../.cursor/rules/narrative-structure.mdc)
- [Characters](../../03_Characters/) - Character arcs
- [Philosophy](../../01_UniverseFundamentals/05_Philosophy.md) - Thematic foundations

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"06_Narrative/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created narrative: {filename}")

# VISUAL DESIGN
visual_files = [
    ("OverallAesthetic.md", "Overall Aesthetic", "Core visual principles", "Framework"),
    ("TemporalVisuals.md", "Temporal Visual Language", "How time distortions look", "Framework"),
    ("CharacterDesigns.md", "Character Designs", "Visual design for all characters", "Partial"),
    ("ColorPalettes.md", "Color Palettes", "Color schemes for characters and zones", "Partial"),
]

for filename, name, description, status in visual_files:
    content = f"""# {name}

**Part VII: Visual Design**  
**Status:** 📝 {status.upper()}

---

## Overview

{description}

---

## Content to Develop

[Visual design guidelines and specifications]

---

## Reference Materials

- Character portraits in `/assets/character_portraits/`
- [Character dossiers](../../03_Characters/) contain established visual designs
- Cinematic realism with subtle fantastical elements
- Temporal effects as environmental storytelling

---

**Cross-References:**
- [Characters](../../03_Characters/) - Individual character designs
- [Locations](../../04_Locations/) - Environmental designs
- [Temporal Physics](../../01_UniverseFundamentals/02_TemporalPhysics.md) - Visual representation of time distortions

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"07_VisualDesign/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created visual design: {filename}")

# AUDIO DESIGN
audio_files = [
    ("CharacterThemes.md", "Character Themes", "Musical themes for each character", "Partial"),
    ("TemporalSoundscape.md", "Temporal Soundscape", "How time sounds", "Framework"),
    ("MusicDirection.md", "Music Direction", "Overall audio direction", "Placeholder"),
]

for filename, name, description, status in audio_files:
    content = f"""# {name}

**Part VIII: Audio Design**  
**Status:** 📝 {status.upper()}

---

## Overview

{description}

---

## Content to Develop

[Audio design guidelines and specifications]

---

## Established Themes

**Vibrion:**
- Electronic rock + orchestral (Daft Punk + Hans Zimmer)
- Strong driving beat representing vibration
- Soaring melodic lines representing leadership

**Leo:**
- Indie folk with unexpected time signature changes
- Acoustic guitar with electronic elements
- Thoughtful, meandering, then suddenly crystallizes
- Artists like Sufjan Stevens, Bon Iver

[Additional characters to be developed]

---

**Cross-References:**
- [Characters](../../03_Characters/) - Individual themes
- [Temporal Physics](../../01_UniverseFundamentals/02_TemporalPhysics.md) - How time affects sound
- [Locations](../../04_Locations/) - Environmental soundscapes

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"08_AudioDesign/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created audio design: {filename}")

# GAMEPLAY
gameplay_files = [
    ("CoreLoop.md", "Core Gameplay Loop", "Character-switching, puzzle-solving, temporal manipulation", "Placeholder"),
    ("CharacterGameplay.md", "Character-Specific Gameplay", "How each ability translates to gameplay", "Placeholder"),
    ("PuzzleDesign.md", "Temporal Puzzle Design", "Types of puzzles and difficulty progression", "Placeholder"),
    ("TeamMechanics.md", "Team Mechanics", "How characters combine abilities", "Placeholder"),
]

for filename, name, description, status in gameplay_files:
    content = f"""# {name}

**Part IX: Gameplay Mechanics**  
**Status:** 📝 {status.upper()}

---

## Overview

{description}

---

## Content to Develop

[Gameplay mechanics and design specifications]

---

## Key Considerations

- Each character's neuro-temporal ability provides unique gameplay
- Temporal perception affects how players experience different zones
- Puzzle design must be accessible to various playstyles
- Team mechanics encourage understanding different perspectives

---

**Cross-References:**
- [Characters](../../03_Characters/) - Character abilities
- [Temporal Physics](../../01_UniverseFundamentals/02_TemporalPhysics.md) - Time manipulation mechanics
- [Locations](../../04_Locations/) - Zone-specific challenges

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"09_GameplayMechanics/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created gameplay: {filename}")

print("\n✅ All framework files created!")
print("   - 6 location files")
print("   - 3 faction files")
print("   - 4 narrative files")
print("   - 4 visual design files")
print("   - 3 audio design files")
print("   - 4 gameplay files")

