import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Temporal Tides",
  description: "A narrative universe where time is subjective and mental health conditions are superpowers",
  base: '/TemporalTides/',
  
  vite: {
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.gif'],
  },
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Index', link: '/00_INDEX' },
      { text: 'Characters', link: '/03_Characters/Heroes/Vibrion' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Index', link: '/00_INDEX' }
        ]
      },
      {
        text: 'Universe Fundamentals',
        collapsed: false,
        items: [
          { text: 'Nature of Time', link: '/01_UniverseFundamentals/01_NatureOfTime' },
          { text: 'Temporal Physics', link: '/01_UniverseFundamentals/02_TemporalPhysics' },
          { text: 'Energy Systems', link: '/01_UniverseFundamentals/03_EnergySystems' },
          { text: 'Cosmology', link: '/01_UniverseFundamentals/04_Cosmology' },
          { text: 'Philosophy', link: '/01_UniverseFundamentals/05_Philosophy' }
        ]
      },
      {
        text: 'Civilizational Elements',
        collapsed: false,
        items: [
          { text: 'Universal Timeline', link: '/02_CivilizationalElements/01_UniversalTimeline' },
          { text: 'Technology', link: '/02_CivilizationalElements/02_Technology' },
          { text: 'Cultural Framework', link: '/02_CivilizationalElements/03_CulturalFramework' },
          { text: 'Terminology', link: '/02_CivilizationalElements/04_Terminology' }
        ]
      },
      {
        text: 'Characters',
        collapsed: false,
        items: [
          {
            text: 'Heroes',
            collapsed: false,
            items: [
              { text: 'Vibrion', link: '/03_Characters/Heroes/Vibrion' },
              { text: 'Leo Thompson', link: '/03_Characters/Heroes/Leo' },
              { text: 'Anne Parker', link: '/03_Characters/Heroes/Anne' },
              { text: 'Maya Johnson', link: '/03_Characters/Heroes/Maya' },
              { text: 'Eli Carter', link: '/03_Characters/Heroes/Eli' },
              { text: 'Dave Miller', link: '/03_Characters/Heroes/Dave' },
              { text: 'Iris Green', link: '/03_Characters/Heroes/Iris' }
            ]
          },
          {
            text: 'Mentors',
            collapsed: true,
            items: [
              { text: 'Dr. Volt', link: '/03_Characters/Mentors/DrVolt' },
              { text: 'Dr. Mental', link: '/03_Characters/Mentors/DrMental' }
            ]
          },
          {
            text: 'Antagonists',
            collapsed: true,
            items: [
              { text: 'Dr. Entropy', link: '/03_Characters/Antagonists/DrEntropy' },
              { text: 'Enigma Volt', link: '/03_Characters/Antagonists/EnigmaVolt' },
              { text: 'The Mentor', link: '/03_Characters/Antagonists/TheMentor' }
            ]
          }
        ]
      },
      {
        text: 'Locations',
        collapsed: true,
        items: [
          { text: 'Time Nexus', link: '/04_Locations/TimeNexus' },
          { text: 'Accelerated Quarter', link: '/04_Locations/AcceleratedQuarter' },
          { text: 'Baseline Metropolitan', link: '/04_Locations/BaselineMetropolitan' },
          { text: 'Contemplative Sanctuaries', link: '/04_Locations/ContemplativeSanctuaries' },
          { text: "Dr. Entropy's Lair", link: '/04_Locations/DrEntropysLair' },
          { text: 'Fractured Wastes', link: '/04_Locations/FracturedWastes' }
        ]
      },
      {
        text: 'Factions',
        collapsed: true,
        items: [
          { text: 'The Team', link: '/05_Factions/TheTeam' },
          { text: 'Temporal Research Council', link: '/05_Factions/TemporalResearchCouncil' },
          { text: "Dr. Entropy's Forces", link: '/05_Factions/EntropyForces' }
        ]
      },
      {
        text: 'Narrative Design',
        collapsed: true,
        items: [
          { text: 'Story Structure', link: '/06_Narrative/StoryStructure' },
          { text: 'Themes', link: '/06_Narrative/Themes' },
          { text: 'Chapter Breakdown', link: '/06_Narrative/ChapterBreakdown' },
          { text: 'Writing Guidelines', link: '/06_Narrative/WritingGuidelines' }
        ]
      },
      {
        text: 'Visual Design',
        collapsed: true,
        items: [
          { text: 'Overall Aesthetic', link: '/07_VisualDesign/OverallAesthetic' },
          { text: 'Temporal Visuals', link: '/07_VisualDesign/TemporalVisuals' },
          { text: 'Character Designs', link: '/07_VisualDesign/CharacterDesigns' },
          { text: 'Color Palettes', link: '/07_VisualDesign/ColorPalettes' }
        ]
      },
      {
        text: 'Audio Design',
        collapsed: true,
        items: [
          { text: 'Character Themes', link: '/08_AudioDesign/CharacterThemes' },
          { text: 'Temporal Soundscape', link: '/08_AudioDesign/TemporalSoundscape' },
          { text: 'Music Direction', link: '/08_AudioDesign/MusicDirection' }
        ]
      },
      {
        text: 'Gameplay Mechanics',
        collapsed: true,
        items: [
          { text: 'Core Loop', link: '/09_GameplayMechanics/CoreLoop' },
          { text: 'Character Gameplay', link: '/09_GameplayMechanics/CharacterGameplay' },
          { text: 'Puzzle Design', link: '/09_GameplayMechanics/PuzzleDesign' },
          { text: 'Team Mechanics', link: '/09_GameplayMechanics/TeamMechanics' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shaiss/TemporalTides' }
    ],

    search: {
      provider: 'local'
    }
  }
})
