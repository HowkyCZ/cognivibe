# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
