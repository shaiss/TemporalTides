#!/usr/bin/env python3
"""
Script to split the monolithic world bible into modular files.
Extracts sections from deprecated/TEMPORAL_TIDES_WORLD_BIBLE.md
"""

import os
import re

# Read the source file
source_file = "../deprecated/TEMPORAL_TIDES_WORLD_BIBLE.md"
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define section mappings (start marker -> output file)
sections = {
    # Part I: Universe Fundamentals
    "## 2. Temporal Physics & Mechanics": {
        "file": "01_UniverseFundamentals/02_TemporalPhysics.md",
        "title": "Temporal Physics & Mechanics",
        "end": "## 3. Energy Systems & Dynamics"
    },
    "## 3. Energy Systems & Dynamics": {
        "file": "01_UniverseFundamentals/03_EnergySystems.md",
        "title": "Energy Systems & Dynamics",
        "end": "## 4. Cosmology & Reality Structure"
    },
    "## 4. Cosmology & Reality Structure": {
        "file": "01_UniverseFundamentals/04_Cosmology.md",
        "title": "Cosmology & Reality Structure",
        "end": "## 5. Philosophical Framework"
    },
    "## 5. Philosophical Framework": {
        "file": "01_UniverseFundamentals/05_Philosophy.md",
        "title": "Philosophical Framework",
        "end": "# PART II: CIVILIZATIONAL ELEMENTS"
    },
    
    # Part II: Civilizational Elements
    "## 6. Universal Timeline": {
        "file": "02_CivilizationalElements/01_UniversalTimeline.md",
        "title": "Universal Timeline",
        "end": "## 7. Technology & Artifacts"
    },
    "## 7. Technology & Artifacts": {
        "file": "02_CivilizationalElements/02_Technology.md",
        "title": "Technology & Artifacts",
        "end": "## 8. Cultural Framework"
    },
    "## 8. Cultural Framework": {
        "file": "02_CivilizationalElements/03_CulturalFramework.md",
        "title": "Cultural Framework",
        "end": "## 9. Terminology & Glossary"
    },
    "## 9. Terminology & Glossary": {
        "file": "02_CivilizationalElements/04_Terminology.md",
        "title": "Terminology & Glossary",
        "end": "# PART III: CHARACTER & LOCATION DETAILS"
    },
}

def extract_section(content, start_marker, end_marker):
    """Extract content between two markers"""
    start_pos = content.find(start_marker)
    if start_pos == -1:
        return None
    
    if end_marker:
        end_pos = content.find(end_marker, start_pos + len(start_marker))
        if end_pos == -1:
            return content[start_pos:]
        return content[start_pos:end_pos]
    return content[start_pos:]

def create_file_header(title, part, section_num):
    """Create standard file header"""
    return f"""# {title}

**{part} | Section {section_num}**

---

"""

def create_file_footer(filename):
    """Create standard file footer"""
    return """

---

*[Return to Index](../00_INDEX.md)*
"""

# Process each section
for start_marker, info in sections.items():
    print(f"Processing: {info['title']}")
    
    section_content = extract_section(content, start_marker, info.get('end'))
    
    if section_content:
        # Remove the header line (## X. Title) as we'll add our own
        section_content = '\n'.join(section_content.split('\n')[1:])
        
        # Determine part
        if "01_Universe" in info['file']:
            part = "Part I: Universe Fundamentals"
            section_num = info['file'].split('/')[1].split('_')[0]
        elif "02_Civil" in info['file']:
            part = "Part II: Civilizational Elements"
            section_num = info['file'].split('/')[1].split('_')[0]
        else:
            part = "Part III"
            section_num = "?"
        
        # Create full content
        full_content = create_file_header(info['title'], part, section_num)
        full_content += section_content.strip()
        full_content += create_file_footer(info['file'])
        
        # Write file
        output_path = info['file']
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print(f"  ✓ Created: {output_path}")
    else:
        print(f"  ✗ Could not find content for: {info['title']}")

print("\n✅ Part I and Part II extraction complete!")
print("Next: Character files need to be created manually (2 complete, 10 placeholders)")

