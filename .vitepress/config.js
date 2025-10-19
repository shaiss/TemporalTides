import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Temporal Tides',
  description: 'A narrative universe where time is subjective and mental health conditions are superpowers',
  
  // Base path for GitHub Pages (repository name)
  base: '/TemporalTides/',
  
  // Source directory (explicit)
  srcDir: './',
  
  // Exclude directories from build
  srcExclude: ['deprecated/**', 'scripts/**', 'logs/**', 'node_modules/**', '.vitepress/cache/**', '.git/**'],
  
  // Clean URLs (removes .html extension)
  cleanUrls: true,
  
  // Last updated timestamp
  lastUpdated: true,
  
  // Ignore dead links (many are placeholders for future content)
  ignoreDeadLinks: true,
  
  // Head tags for better SEO and styling
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:title', content: 'Temporal Tides World Bible' }],
    ['meta', { property: 'og:description', content: 'Where time is subjective and mental health conditions are superpowers' }]
  ],

  themeConfig: {
    // Logo and site title
    logo: '/assets/logo.png',
    siteTitle: 'Temporal Tides',

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'World Bible', link: '/WorldBible/00_INDEX' },
      { 
        text: 'Quick Links',
        items: [
          { text: 'Characters', link: '/WorldBible/03_Characters/Heroes/Iris' },
          { text: 'Locations', link: '/WorldBible/04_Locations/TimeNexus' },
          { text: 'Fundamentals', link: '/WorldBible/01_UniverseFundamentals/01_NatureOfTime' }
        ]
      }
    ],

    // Sidebar configuration
    sidebar: {
      '/WorldBible/': [
        {
          text: '📚 World Bible Index',
          link: '/WorldBible/00_INDEX',
          items: []
        },
        {
          text: '🌌 Universe Fundamentals',
          collapsed: false,
          items: [
            { text: '01 - Nature of Time', link: '/WorldBible/01_UniverseFundamentals/01_NatureOfTime' },
            { text: '02 - Temporal Physics', link: '/WorldBible/01_UniverseFundamentals/02_TemporalPhysics' },
            { text: '03 - Energy Systems', link: '/WorldBible/01_UniverseFundamentals/03_EnergySystems' },
            { text: '04 - Cosmology', link: '/WorldBible/01_UniverseFundamentals/04_Cosmology' },
            { text: '05 - Philosophy', link: '/WorldBible/01_UniverseFundamentals/05_Philosophy' }
          ]
        },
        {
          text: '🏛️ Civilizational Elements',
          collapsed: false,
          items: [
            { text: '01 - Universal Timeline', link: '/WorldBible/02_CivilizationalElements/01_UniversalTimeline' },
            { text: '02 - Technology', link: '/WorldBible/02_CivilizationalElements/02_Technology' },
            { text: '03 - Cultural Framework', link: '/WorldBible/02_CivilizationalElements/03_CulturalFramework' },
            { text: '04 - Terminology', link: '/WorldBible/02_CivilizationalElements/04_Terminology' }
          ]
        },
        {
          text: '👥 Characters',
          collapsed: false,
          items: [
            {
              text: '⚡ Heroes',
              collapsed: false,
              items: [
                { text: 'Vibrion', link: '/WorldBible/03_Characters/Heroes/Vibrion' },
                { text: 'Leo Thompson', link: '/WorldBible/03_Characters/Heroes/Leo' },
                { text: 'Anne Parker', link: '/WorldBible/03_Characters/Heroes/Anne' },
                { text: 'Maya Johnson', link: '/WorldBible/03_Characters/Heroes/Maya' },
                { text: 'Eli Carter', link: '/WorldBible/03_Characters/Heroes/Eli' },
                { text: 'Dave Miller', link: '/WorldBible/03_Characters/Heroes/Dave' },
                { text: 'Iris Green', link: '/WorldBible/03_Characters/Heroes/Iris' }
              ]
            },
            {
              text: '🎓 Mentors',
              collapsed: true,
              items: [
                { text: 'Dr. Volt', link: '/WorldBible/03_Characters/Mentors/DrVolt' },
                { text: 'Dr. Mental', link: '/WorldBible/03_Characters/Mentors/DrMental' }
              ]
            },
            {
              text: '💀 Antagonists',
              collapsed: true,
              items: [
                { text: 'Dr. Entropy', link: '/WorldBible/03_Characters/Antagonists/DrEntropy' },
                { text: 'Enigma Volt', link: '/WorldBible/03_Characters/Antagonists/EnigmaVolt' },
                { text: 'The Mentor', link: '/WorldBible/03_Characters/Antagonists/TheMentor' }
              ]
            }
          ]
        },
        {
          text: '🗺️ Locations',
          collapsed: false,
          items: [
            { text: 'Time Nexus', link: '/WorldBible/04_Locations/TimeNexus' },
            { text: 'Chronopolis Central', link: '/WorldBible/04_Locations/ChronopolisCentral' },
            { text: 'The Interchange', link: '/WorldBible/04_Locations/TheInterchange' },
            { text: 'Baseline Metropolitan', link: '/WorldBible/04_Locations/BaselineMetropolitan' },
            { text: 'Accelerated Quarter', link: '/WorldBible/04_Locations/AcceleratedQuarter' },
            { text: 'Contemplative Sanctuaries', link: '/WorldBible/04_Locations/ContemplativeSanctuaries' },
            { text: 'Fractured Wastes', link: '/WorldBible/04_Locations/FracturedWastes' },
            { text: "Dr. Entropy's Lair", link: '/WorldBible/04_Locations/DrEntropysLair' }
          ]
        },
        {
          text: '🛡️ Factions & Organizations',
          collapsed: false,
          items: [
            { text: 'The Team', link: '/WorldBible/05_Factions/TheTeam' },
            { text: 'Temporal Research Council', link: '/WorldBible/05_Factions/TemporalResearchCouncil' },
            { text: "Entropy's Forces", link: '/WorldBible/05_Factions/EntropyForces' }
          ]
        },
        {
          text: '📖 Narrative Design',
          collapsed: true,
          items: [
            { text: 'Story Structure', link: '/WorldBible/06_Narrative/StoryStructure' },
            { text: 'Themes', link: '/WorldBible/06_Narrative/Themes' },
            { text: 'Chapter Breakdown', link: '/WorldBible/06_Narrative/ChapterBreakdown' },
            { text: 'Writing Guidelines', link: '/WorldBible/06_Narrative/WritingGuidelines' }
          ]
        },
        {
          text: '🎨 Visual Design',
          collapsed: true,
          items: [
            { text: 'Overall Aesthetic', link: '/WorldBible/07_VisualDesign/OverallAesthetic' },
            { text: 'Temporal Visuals', link: '/WorldBible/07_VisualDesign/TemporalVisuals' },
            { text: 'Character Designs', link: '/WorldBible/07_VisualDesign/CharacterDesigns' },
            { text: 'Color Palettes', link: '/WorldBible/07_VisualDesign/ColorPalettes' }
          ]
        },
        {
          text: '🎵 Audio Design',
          collapsed: true,
          items: [
            { text: 'Character Themes', link: '/WorldBible/08_AudioDesign/CharacterThemes' },
            { text: 'Temporal Soundscape', link: '/WorldBible/08_AudioDesign/TemporalSoundscape' },
            { text: 'Music Direction', link: '/WorldBible/08_AudioDesign/MusicDirection' }
          ]
        },
        {
          text: '🎮 Gameplay Mechanics',
          collapsed: true,
          items: [
            { text: 'Core Loop', link: '/WorldBible/09_GameplayMechanics/CoreLoop' },
            { text: 'Character Gameplay', link: '/WorldBible/09_GameplayMechanics/CharacterGameplay' },
            { text: 'Puzzle Design', link: '/WorldBible/09_GameplayMechanics/PuzzleDesign' },
            { text: 'Team Mechanics', link: '/WorldBible/09_GameplayMechanics/TeamMechanics' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shaiss/TemporalTides' }
    ],

    // Footer
    footer: {
      message: 'A world where time is subjective and mental health conditions are superpowers',
      copyright: 'Copyright © 2025 Temporal Tides'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/shaiss/TemporalTides/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

    // Local search
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 4,
              text: 2,
              titles: 1
            }
          }
        }
      }
    },

    // Outline (table of contents) configuration
    outline: {
      level: [2, 3],
      label: 'On This Page'
    },

    // Previous/Next links
    docFooter: {
      prev: 'Previous',
      next: 'Next'
    }
  }
})
