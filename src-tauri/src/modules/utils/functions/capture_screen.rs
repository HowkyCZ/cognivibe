use std::path::PathBuf;

/// Capture the main display and save as a PNG file in the temp directory.
/// Returns the path to the saved file.
///
/// On macOS, uses Core Graphics + ImageIO via FFI.
/// Requires Screen Recording permission (already requested by the app).
#[tauri::command]
pub fn capture_screen() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        capture_screen_macos()
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Screen capture is only supported on macOS".to_string())
    }
}

#[cfg(target_os = "macos")]
fn capture_screen_macos() -> Result<String, String> {
    use std::ffi::c_void;

    // Core Graphics FFI types
    type CGWindowID = u32;
    type CGWindowListOption = u32;
    type CGWindowImageOption = u32;
    #[repr(C)]
    #[derive(Copy, Clone)]
    struct CGPoint { x: f64, y: f64 }
    #[repr(C)]
    #[derive(Copy, Clone)]
    struct CGSize { width: f64, height: f64 }
    #[repr(C)]
    #[derive(Copy, Clone)]
    struct CGRect { origin: CGPoint, size: CGSize }

    const K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY: CGWindowListOption = 1;
    const K_CG_NULL_WINDOW_ID: CGWindowID = 0;
    const K_CG_WINDOW_IMAGE_DEFAULT: CGWindowImageOption = 0;

    extern "C" {
        fn CGWindowListCreateImage(
            screenBounds: CGRect,
            listOption: CGWindowListOption,
            windowID: CGWindowID,
            imageOption: CGWindowImageOption,
        ) -> *const c_void; // CGImageRef

        fn CGImageRelease(image: *const c_void);

        // ImageIO framework
        fn CGImageDestinationCreateWithURL(
            url: *const c_void,         // CFURLRef
            type_: *const c_void,       // CFStringRef
            count: usize,
            options: *const c_void,     // CFDictionaryRef
        ) -> *mut c_void; // CGImageDestinationRef

        fn CGImageDestinationAddImage(
            dest: *mut c_void,      // CGImageDestinationRef
            image: *const c_void,   // CGImageRef
            properties: *const c_void, // CFDictionaryRef
        );

        fn CGImageDestinationFinalize(dest: *mut c_void) -> bool;

        // Core Foundation
        fn CFRelease(cf: *const c_void);
    }

    // Capture full screen (CGRect of zeros = entire display)
    let bounds = CGRect {
        origin: CGPoint { x: 0.0, y: 0.0 },
        size: CGSize { width: 0.0, height: 0.0 },
    };

    let image = unsafe {
        CGWindowListCreateImage(
            bounds,
            K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY,
            K_CG_NULL_WINDOW_ID,
            K_CG_WINDOW_IMAGE_DEFAULT,
        )
    };

    if image.is_null() {
        return Err("Failed to capture screen — is Screen Recording permission granted?".to_string());
    }

    // Create temp file path
    let temp_dir = std::env::temp_dir();
    let file_path: PathBuf = temp_dir.join("cognivibe_break_screenshot.png");

    // Convert path to CFURL
    let path_str = file_path.to_string_lossy();
    let result: Result<(), String> = unsafe {
        use core_foundation::base::TCFType;
        use core_foundation::string::CFString;
        use core_foundation::url::CFURL;

        let url = CFURL::from_path(&file_path, false)
            .ok_or_else(|| "Failed to create CFURL".to_string())?;

        let type_str = CFString::new("public.png");

        let dest = CGImageDestinationCreateWithURL(
            url.as_concrete_TypeRef() as *const c_void,
            type_str.as_concrete_TypeRef() as *const c_void,
            1,
            std::ptr::null(),
        );

        if dest.is_null() {
            CGImageRelease(image);
            return Err("Failed to create image destination".to_string());
        }

        CGImageDestinationAddImage(dest, image, std::ptr::null());

        let ok = CGImageDestinationFinalize(dest);
        CFRelease(dest as *const c_void);
        CGImageRelease(image);

        if !ok {
            return Err("Failed to finalize screenshot image".to_string());
        }

        Ok(())
    };

    result?;

    #[cfg(debug_assertions)]
    println!("[CAPTURE_SCREEN] Screenshot saved to: {}", path_str);

    Ok(file_path.to_string_lossy().to_string())
}
