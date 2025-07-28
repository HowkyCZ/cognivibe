use sysinfo::{Process, System};

fn get_display_name(process: &Process, process_name: &str) -> String {
    // First, try to extract a better name from the executable path
    if let Some(exe_path) = process.exe() {
        if let Some(file_name) = exe_path.file_stem() {
            let exe_name = file_name.to_string_lossy();

            // If the exe name is more descriptive than the process name, use it
            if exe_name.len() > process_name.len() && exe_name.contains(process_name) {
                return exe_name.to_string();
            }

            // For common patterns, return the exe name
            if !exe_name.eq_ignore_ascii_case(process_name) {
                return format!("{} ({})", exe_name, process_name);
            }
        }
    }

    // Try to extract useful info from command line arguments
    let cmd_args = process.cmd();
    if cmd_args.len() > 1 {
        // Look for common patterns in command line that might give us a better name
        for arg in cmd_args.iter().skip(1) {
            let arg_str = arg.to_string_lossy();
            // Check for file arguments that might indicate what the app is working on
            if arg_str.ends_with(".txt")
                || arg_str.ends_with(".pdf")
                || arg_str.ends_with(".doc")
                || arg_str.ends_with(".docx")
                || arg_str.ends_with(".jpg")
                || arg_str.ends_with(".png")
                || arg_str.ends_with(".mp4")
                || arg_str.ends_with(".mp3")
            {
                if let Some(file_name) = std::path::Path::new(arg_str.as_ref()).file_name() {
                    return format!("{} - {}", process_name, file_name.to_string_lossy());
                }
            }

            // Check for --title or similar arguments
            if arg_str.starts_with("--title=") {
                return format!("{} - {}", process_name, &arg_str[8..]);
            }
        }
    }

    // Fallback to the original process name
    process_name.to_string()
}

fn is_system_process(process_name: &str, process: &Process) -> bool {
    let name_lower = process_name.to_lowercase();

    // Check if process is in system32 folder
    if let Some(exe_path) = process.exe() {
        let exe_path_str = exe_path.to_string_lossy().to_lowercase();
        if exe_path_str.contains("system32")
            || exe_path_str.contains("syswow64")
            || exe_path_str.contains("\\windows\\")
        {
            return true;
        }
    }

    // Check Windows system processes
    #[cfg(target_os = "windows")]
    {
        for sys_process in WINDOWS_SYSTEM_PROCESSES {
            if name_lower.contains(&sys_process.to_lowercase()) {
                return true;
            }
        }
    }

    // Check macOS system processes
    #[cfg(target_os = "macos")]
    {
        for sys_process in MACOS_SYSTEM_PROCESSES {
            if name_lower.contains(&sys_process.to_lowercase()) {
                return true;
            }
        }
    }

    // Check Linux system processes
    #[cfg(target_os = "linux")]
    {
        for sys_process in LINUX_SYSTEM_PROCESSES {
            if name_lower.contains(&sys_process.to_lowercase()) {
                return true;
            }
        }
    }

    // Additional platform-specific patterns

    // macOS patterns
    #[cfg(target_os = "macos")]
    if name_lower.starts_with("com.apple.") || 
       name_lower.ends_with("d") && name_lower.len() < 15 || // Many daemons end with 'd'
       name_lower.contains("xpc") ||
       name_lower.contains("framework")
    {
        return true;
    }

    // Linux patterns
    #[cfg(target_os = "linux")]
    if name_lower.starts_with("k") && name_lower.len() < 12 || // Kernel threads often start with 'k'
       name_lower.contains("systemd") ||
       name_lower.starts_with("[") && name_lower.ends_with("]") || // Kernel threads in brackets
       name_lower.ends_with("d") && name_lower.len() < 10
    {
        // Short daemon names
        return true;
    }

    false
}

#[tauri::command]
/// Retrieves a list of currently running applications on the system.
/// 
/// This function scans all running processes and filters them to return only
/// user applications (excluding system processes, background services, etc.).
/// It provides enhanced display names by extracting meaningful information
/// from executable paths and process arguments.
/// 
/// The returned data includes:
/// - Process ID (pid)
/// - Application name (enhanced for better readability)
/// - Memory usage information
/// - CPU usage statistics
/// 
/// This is used by the dashboard to show what applications the user is actively running.
/// 
/// # Returns
/// A vector of JSON objects containing application information
pub fn get_running_apps() -> Vec<serde_json::Value> {
    let mut system = System::new_all();
    system.refresh_all();

    let mut apps = Vec::new();
    for (pid, process) in system.processes() {
        // Filter out system processes and focus on user applications
        let process_name = process.name().to_string_lossy();

        // Skip if empty name
        if process_name.is_empty() {
            continue;
        } // Skip system and background processes
        if is_system_process(&process_name, process) {
            continue;
        } // All remaining processes are considered user applications

        // Try to get a better display name
        let display_name = get_display_name(process, &process_name);
        let exe_path = process.exe().map(|p| p.to_string_lossy().to_string());
        let app_info = serde_json::json!({
            "pid": pid.as_u32(),
            "name": process_name,
            "display_name": display_name,
            "cpu_usage": process.cpu_usage(),
            "memory": process.memory(),
            "start_time": process.start_time(),
            "run_time": process.run_time(),
            "exe": exe_path
        });

        apps.push(app_info);
    } // Sort by memory usage (descending) to show most resource-intensive apps first
    apps.sort_by(|a, b| {
        let mem_a = a["memory"].as_u64().unwrap_or(0);
        let mem_b = b["memory"].as_u64().unwrap_or(0);
        mem_b.cmp(&mem_a)
    });

    apps
}

// System process arrays
#[cfg(target_os = "windows")]
const WINDOWS_SYSTEM_PROCESSES: &[&str] = &[
    // Windows system processes
    "System",
    "svchost",
    "dwm",
    "winlogon",
    "csrss",
    "wininit",
    "smss",
    "lsass",
    "services",
    "spoolsv",
    "taskhost",
    "explorer",
    "audiodg",
    "conhost",
    "dllhost",
    "rundll32",
    "mmc",
    "WmiPrvSE",
    "SearchIndexer",
    "RuntimeBroker",
    "ctfmon",
    "taskhostw",
    "dwm",
    "fontdrvhost",
    "sihost",
    "ShellExperienceHost",
    "StartMenuExperienceHost",
    "SecurityHealthSystray",
    "SecurityHealthService",
    "MsMpEng",
    "NisSrv",
    "WinStore.App",
    "ApplicationFrameHost",
    "SystemSettings",
    "Calculator",
    "MicrosoftEdgeWebView2Setup",
    "msedgewebview2",
    "MicrosoftEdge",
    "WUDFHost",
    "LockApp",
    "UserOOBEBroker",
    "PerfWatson2",
    "TiWorker",
    // Common background services
    "wininet",
    "winhttp",
    "wuauserv",
    "bits",
    "cryptsvc",
    "dhcp",
    "dnscache",
    "eventlog",
    "gpsvc",
    "iphlpsvc",
    "lanmanserver",
    "lanmanworkstation",
    "netlogon",
    "nsi",
    "pcasvc",
    "power",
    "profSvc",
    "schedule",
    "seclogon",
    "sens",
    "themes",
    "winmgmt",
    "wuauserv",
    "WZCSVC",
    "xmlprov",
];

#[cfg(target_os = "macos")]
const MACOS_SYSTEM_PROCESSES: &[&str] = &[
    // macOS system processes and daemons
    "kernel_task",
    "launchd",
    "UserEventAgent",
    "cfprefsd",
    "distnoted",
    "notifyd",
    "syslogd",
    "kextd",
    "powerd",
    "configd",
    "mDNSResponder",
    "coreaudiod",
    "audio",
    "WindowServer",
    "loginwindow",
    "SystemUIServer",
    "Dock",
    "Finder",
    "ControlCenter",
    "NotificationCenter",
    "Spotlight",
    "mds",
    "mdworker",
    "spindump",
    "ReportCrash",
    "crashreporterd",
    "trustd",
    "securityd",
    "keychain",
    "CloudKeychainProxy",
    "cloudd",
    "bird",
    "syncdefaultsd",
    "CoreServicesUIAgent",
    "AirPlayXPCHelper",
    "BluetoothUIServer",
    "WiFiAgent",
    "networkd",
    "nsurlsessiond",
    "nehelper",
    "sharingd",
    "rapportd",
    "identityservicesd",
    "imagent",
    "soagent",
    "accountsd",
    "contactsd",
    "CalendarAgent",
    "remindd",
    "PhotosAgent",
    "MediaLibraryService",
    "QuickLookUIService",
    "SpeechSynthesisServer",
    "VoiceOver",
    "universalaccessd",
    "com.apple",
    "appleeventsd",
    "appleaccount",
    "assistantd",
    "siri",
    "tailspin",
    "kernel",
    "system",
    "mach",
    "xpc",
    "daemon",
    "agent",
    "helper",
    "service",
];

#[cfg(target_os = "linux")]
const LINUX_SYSTEM_PROCESSES: &[&str] = &[
    // Linux kernel and core processes
    "kernel",
    "kthreadd",
    "rcu_gp",
    "rcu_par_gp",
    "kworker",
    "migration",
    "ksoftirqd",
    "watchdog",
    "systemd",
    "kdevtmpfs",
    "netns",
    "rcu_tasks",
    "kauditd",
    "khungtaskd",
    "oom_reaper",
    "writeback",
    "kcompactd",
    "ksmd",
    "khugepaged",
    "crypto",
    "kintegrityd",
    "kblockd",
    "ata_sff",
    "md",
    "edac-poller",
    "devfreq_wq",
    "watchdogd",
    "kswapd",
    "kthrotld",
    "irq",
    "kmpath_rdacd",
    "kaluad",
    "kpsmoused",
    "scsi_eh",
    "scsi_tmf",
    "usb-storage",
    "i915",
    "ttm_swap",
    "nvidia-modeset",
    "nvidia-uvm",
    "nvidia-peermem",
    // Linux system daemons and services
    "init",
    "systemd",
    "dbus",
    "networkd",
    "resolved",
    "udevd",
    "rsyslog",
    "cron",
    "ssh",
    "sshd",
    "getty",
    "login",
    "polkit",
    "udisks",
    "upowerd",
    "bluetoothd",
    "wpa_supplicant",
    "dhclient",
    "NetworkManager",
    "ModemManager",
    "avahi",
    "cups",
    "pulseaudio",
    "pipewire",
    "wireplumber",
    "jack",
    "alsa",
    "gdm",
    "lightdm",
    "sddm",
    "Xorg",
    "wayland",
    "gnome",
    "kde",
    "plasma",
    "kwin",
    "mutter",
    "compiz",
    "notification",
    "gvfs",
    "at-spi",
    "accounts",
    "colord",
    "geoclue",
    "packagekit",
    "snap",
    "flatpak",
    "apparmor",
    "auditd",
    "fail2ban",
    "firewall",
    "iptables",
];
