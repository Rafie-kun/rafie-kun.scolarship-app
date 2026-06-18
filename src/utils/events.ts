// Safe Event Dispatcher to prevent Cross-Origin Iframe DOM Security Exceptions
export function dispatchProfileUpdate(updatedProfile: any) {
  // Always dispatch on the current local window context, which is same-origin and safe
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
    }
  } catch (e) {
    console.warn("Local event dispatch failed", e);
  }
  
  // Safely attempt the parent window dispatch, handling cross-origin blockages gracefully
  try {
    if (typeof window !== 'undefined' && window.parent) {
      let parentWindow: any = null;
      try {
        parentWindow = window.parent;
      } catch (e) {
        // Accessing window.parent under cross-origin blocks
      }

      if (parentWindow && parentWindow !== window) {
        try {
          // Check for dispatchEvent property under strict try-catch block
          if ('dispatchEvent' in parentWindow) {
            parentWindow.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
          } else {
            parentWindow.postMessage({ type: 'profile-updated', detail: updatedProfile }, '*');
          }
        } catch (e) {
          // If we are cross-origin, reading properties or dispatchEvent throws.
          // Safely fallback to HTML5 postMessage which is explicitly designed to work across partitions
          try {
            parentWindow.postMessage({ type: 'profile-updated', detail: updatedProfile }, '*');
          } catch (postErr) {
            // Completely quiet block
          }
        }
      }
    }
  } catch (err) {
    // Cross-origin iframe boundaries prevent standard communication
  }
}
