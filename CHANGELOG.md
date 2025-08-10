# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2025-08-10

### Added
- Support for uploading debug builds with retention policy
- Enhanced CI/CD workflow for debug build management

### Fixed
- Overflow handling in UI components
- Sticky navbar positioning and behavior
- Non-selectable text issues
- Smooth scroll functionality improvements

## [1.0.6] - 2025-08-09

### Added
- Enhanced input tracking system with new callback functions for button press/release, key press/release, mouse move, and wheel events
- New `get_is_measuring` function for better measurement state management
- Active window logging functionality with comprehensive window tracking
- Improved global input tracker with more robust event handling
- Enhanced minute logger with better tracking capabilities
- New tracker types and state management improvements
- macOS permissions handling improvements

### Changed
- Refactored input callback system with modular approach
- Enhanced start_global_input_tracker functionality
- Improved tracker module organization and structure
- Updated wavy background component
- Enhanced API configuration
- Updated constants and utility functions

### Fixed
- Removed deprecated color utilities
- Improved module organization and dependencies

## [1.0.5] - 2025-08-07

### Added
- Custom scrollbar styles for improved UI consistency
- New WideCircleChartCard component for metrics display
- Enhanced input tracking with new state management and measurement logic
- Color utilities for consistent logging across modules
- CircleChartCard component integration into DashboardPage

### Changed
- Updated multiple dependencies to latest versions:
  - @heroui/react from 2.8.0-beta.7 to 2.8.2
  - @heroui/theme from 2.4.17 to 2.4.20
  - framer-motion from 12.18.1 to 12.23.12
  - react from 19.1.0 to 19.1.1
  - react-dom from 19.1.0 to 19.1.1
  - tailwindcss from 4.1.10 to 4.1.11
- Enhanced UI with updated color themes
- Improved HelpButton component to accept className prop
- Redesigned current load card component
- Updated settings properties for clarity and consistency

### Fixed
- Removed displayName assignment from ActionCard component
- Cleaned up whitespace in run and focus_main_window functions
- Removed unused ModalFooter import from UserProfileModal
- General code formatting and comment cleanup

### Removed
- Redundant files cleanup
- Removed unnecessary stats card components
- Removed unnecessary logging statements

## [1.0.4] - 2025-07-31

### Added
- macOS permissions handling system with dedicated React hook
- Enhanced external URL handling with proper browser opening
- Brain icon fallback for user avatars
- New macOS-specific permission requests and status checking

### Fixed
- Function name corrections for URL opening functionality
- Proper external URL handling in default browser
- Updated Tauri plugin dependencies to latest versions
- Corrected rdev dependency to use rustdesk GitHub repository

### Changed
- Comprehensive code formatting across all Rust modules
- Moved functions into organized module structure
- Removed unused OAuth login buttons
- Cleanup of unused settings and measuring state commands
- Updated API configuration for user deletion functionality
- Changed UI dropdown components to modal implementations
- Enhanced macOS entitlements for better permission handling

### Dependencies
- Updated multiple Tauri plugins to latest versions
- Updated rdev dependency for better macOS compatibility
- Added new npm packages for macOS permissions handling

## [1.0.3] - 2025-07-25

### Added
- macOS code signing and notarization support
- Automatic certificate management in CI/CD pipeline
- Enhanced security for macOS app distribution

### Fixed
- Removed duplicate notarization process (now handled automatically by Tauri)
- Improved macOS build reliability with proper certificate verification

### Changed
- Updated GitHub Actions workflow for streamlined macOS signing
- Enhanced macOS distribution process for better user experience

## [1.0.2] - 2025-07-22

### Added
- Comprehensive macOS entitlements for full app functionality
- Input monitoring permissions for global input tracking
- System information access for performance monitoring
- Network client permissions for Supabase communication

### Fixed
- Bundle identifier changed from `com.cognivibe.app` to `com.cognivibe.desktop`
- Resolved macOS bundle extension conflicts
- Enhanced security posture with minimal required entitlements

### Changed
- Improved macOS compatibility and permission handling
- Streamlined entitlements for better security and functionality
- Updated app identifier for better platform compliance

## [1.0.1] - 2025-07-22

### Added
- Auto-updater modal with progress tracking
- Download progress visualization
- Automatic app restart after updates

### Fixed
- macOS M1 compatibility issues with input tracking
- TypeScript type safety for updater components
- Platform-specific build optimizations

### Changed
- Improved update notification user experience
- Enhanced error handling for update process
- Non-dismissible update modal for critical updates

## [1.0.0] - 2025-07-17

### Added
- Initial release of Cognivibe
- Cognitive performance measurement and tracking
- Dashboard with cognitive load charts
- Weekly assessment functionality
- User authentication and data persistence
- Dark theme interface
- Cross-platform support (Windows, macOS Intel, macOS ARM)
- Auto-updater functionality
- Deep linking support

### Features
- **Dashboard**: Real-time cognitive load monitoring and visualization
- **Assessments**: Weekly cognitive performance assessments
- **Data Visualization**: Charts and graphs to track progress over time
- **Settings**: Customizable app preferences and configurations
- **Authentication**: Secure user login and data synchronization
- **Responsive Design**: Modern, dark-themed interface
- **Cross-Platform**: Native desktop applications for Windows and macOS
- **Auto-Updates**: Automatic app updates through built-in updater
- **Deep Links**: Support for custom URL schemes (cognivibe://)

### Technical
- Built with Tauri 2.x for native performance
- React 19 frontend with TypeScript
- Supabase backend integration
- Vite build system
- Tailwind CSS for styling
- Recharts for data visualization
- Framer Motion for animations
