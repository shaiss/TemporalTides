#!/usr/bin/env python3
"""
Extract character files from the deprecated world bible.
"""

import os

# Read source
source_file = "../deprecated/TEMPORAL_TIDES_WORLD_BIBLE.md"
with open(source_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract Vibrion (lines 1495-1802)
vibrion_content = ''.join(lines[1494:1802])  # -1 for 0-indexing
vibrion_file = """# Vibrion - Main Character & Team Leader

**Part III: Characters | Heroes**

---

"""  + vibrion_content + """

---

**Cross-References:**
- [Energy Systems](../../01_UniverseFundamentals/03_EnergySystems.md) - Vibrional frequencies explained
- [Technology](../../02_CivilizationalElements/02_Technology.md) - Alloy Chain Mesh costume
- [Dr. Volt](../Mentors/DrVolt.md) - Mentor relationship
- [Dr. Entropy](../Antagonists/DrEntropy.md) - Primary antagonist

---

*[Return to Index](../../00_INDEX.md)*
"""

with open("03_Characters/Heroes/Vibrion.md", 'w', encoding='utf-8') as f:
    f.write(vibrion_file)
print("✓ Created: Vibrion.md")

# Extract Leo (lines 1804-2064)
leo_content = ''.join(lines[1803:2064])
leo_file = """# Leo Thompson - ADD Analytical Specialist

**Part III: Characters | Heroes**

---

""" + leo_content + """

---

**Cross-References:**
- [The Nature of Time](../../01_UniverseFundamentals/01_NatureOfTime.md) - Class D Fragmented Perception
- [Vibrion](Vibrion.md) - Team leader, first to recruit Leo
- [Iris](Iris.md) - Shared appreciation for "impossible" thinking
- [Terminology](../../02_CivilizationalElements/04_Terminology.md) - Immersive Thought ability

---

*[Return to Index](../../00_INDEX.md)*
"""

with open("03_Characters/Heroes/Leo.md", 'w', encoding='utf-8') as f:
    f.write(leo_file)
print("✓ Created: Leo.md")

# Create placeholder files for other heroes
heroes_placeholders = [
    ("Anne.md", "Anne Parker", "Anxiety - Strategic Planner", "Foresight", "Class B (Accelerated)", "Anne_Parker.jpg"),
    ("Maya.md", "Maya Johnson", "Autism - Pattern Recognition Specialist", "Pattern Sense", "Class A (Standard with rhythmic component)", "Maya_Johnson.jpg"),
    ("Eli.md", "Eli Carter", "ADHD - Rapid Response Specialist", "Kinetic Rush", "Class B (Highly Variable - 'DJ turntable')", "Eli_Carter.jpg"),
    ("Dave.md", "Dave Miller", "Depression - Empathic Specialist", "Empathic Resonance", "Class C (Dilated - stretched moments)", "Dave_Miller.jpg"),
    ("Iris.md", "Iris Green", "Psychosis - Multi-Reality Specialist", "Visionary Insight", "Class E (Multi-Layered)", "Iris_Green.jpg"),
]

for filename, fullname, role, ability, temporal_sig, image in heroes_placeholders:
    content = f"""# {fullname} - {role}

**Part III: Characters | Heroes**  
**Status:** 📝 PLACEHOLDER - TO BE EXPANDED

---

## Quick Reference

**Full Name:** {fullname}  
**Primary Ability:** {ability}  
**Temporal Signature:** {temporal_sig}  
**Visual Reference:** ![{fullname}](../../../assets/character_portraits/{image})

**Brief Description:**
[Brief 2-3 sentence summary from original docs - to be expanded into full dossier]

---

## Sections to Complete

This character dossier should follow the same comprehensive structure as [Vibrion](Vibrion.md) and [Leo](Leo.md):

### Required Sections:
1. **Biography** - Origin, childhood, ability discovery, education, meeting the team
2. **Psychology & Personality** - Core traits, motivations, fears, coping mechanisms, growth arc
3. **Abilities & Skills** - Primary power (detailed), secondary skills, weaknesses
4. **Relationships** - With each team member, mentors, antagonists
5. **Temporal Profile** - Time perception, temporal abilities, paradox vulnerability
6. **Visual & Aesthetic Design** - Physical appearance, clothing, color palette, body language
7. **Voice & Communication** - Speech patterns, verbal tics, communication style, examples
8. **Cultural & Background** - Origin, socioeconomic background, education, cultural influences, hobbies
9. **Story Function** - Narrative role, thematic representation, arc type

---

**Cross-References:**
- [Character Development Guidelines](../../../.cursor/rules/character-development.mdc)
- [Vibrion](Vibrion.md) - Team leader
- [Leo](Leo.md) - Fellow team member
- [The Team](../../05_Factions/TheTeam.md) - Team dynamics

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"03_Characters/Heroes/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created placeholder: {filename}")

# Create mentor placeholders
mentors = [
    ("DrVolt.md", "Dr. Volt", "Temporal Physicist & Mentor", "Dr._Volt.jpg"),
    ("DrMental.md", "Dr. Mental", "Psycho-Temporal Therapist & Advisor", "Dr._Mental.jpg"),
]

for filename, name, role, image in mentors:
    content = f"""# {name} - {role}

**Part III: Characters | Mentors**  
**Status:** 📝 OUTLINE - TO BE EXPANDED

---

## Quick Reference

**Full Name:** {name} [First name TBD]  
**Age:** ~50-60s  
**Role:** {role}  
**Visual Reference:** ![{name}](../../../assets/character_portraits/{image})

---

## Key Information

[Brief background and role from original docs]

**Relationship to Story:**
- [Primary narrative function]
- [Key relationships]
- [Thematic significance]

---

## Sections to Complete

This should be expanded into a full mentor profile including:
- Complete background and history
- Personality and approach
- Relationship with each team member
- Contributions to team success
- Personal stakes in the conflict
- Visual design and voice

---

**Cross-References:**
- [Vibrion](../Heroes/Vibrion.md) - Primary mentee
- [The Team](../../05_Factions/TheTeam.md) - Team dynamics

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"03_Characters/Mentors/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created mentor placeholder: {filename}")

# Create antagonist placeholders
antagonists = [
    ("DrEntropy.md", "Dr. Entropy", "Primary Antagonist"),
    ("EnigmaVolt.md", "Enigma Volt", "Secondary Antagonist"),
    ("TheMentor.md", "The Mentor", "Mysterious Guide"),
]

for filename, name, role in antagonists:
    content = f"""# {name} - {role}

**Part III: Characters | Antagonists**  
**Status:** 📝 OUTLINE - TO BE EXPANDED

---

## Quick Reference

**Name:** {name}  
**Role:** {role}  
**Status:** TO BE DETAILED

---

## Key Information

[Brief outline from original docs - philosophy, abilities, motivation]

---

## Sections to Complete

Full antagonist profile should include:
- Complete background and origin
- Philosophy and ideology
- Powers and resources
- Organization and forces
- Relationship to protagonists
- Lair and base of operations
- Ultimate goals and methods
- Potential for complexity/redemption

---

**Cross-References:**
- [Vibrion](../Heroes/Vibrion.md) - Primary opposition
- [The Team](../../05_Factions/TheTeam.md) - Opposing force
- [Chronos Catalyst](../../02_CivilizationalElements/02_Technology.md) - Primary weapon

---

*[Return to Index](../../00_INDEX.md)*
"""
    with open(f"03_Characters/Antagonists/{filename}", 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created antagonist placeholder: {filename}")

print("\n✅ All character files created!")
print("   - 2 complete (Vibrion, Leo)")
print("   - 5 hero placeholders")
print("   - 2 mentor outlines")
print("   - 3 antagonist outlines")

