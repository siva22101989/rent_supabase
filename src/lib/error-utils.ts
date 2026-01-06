export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred.";

  const message = (error.message || "").toLowerCase();
  
  // Specific Supabase/Auth API errors
  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password. Please check your details.";
  }
  
  if (message.includes("user already registered") || message.includes("already exists")) {
    return "This email is already linked to an account. Try logging in.";
  }
  
  if (message.includes("password should be at least")) {
    return "Password is too short. Please use at least 6 characters.";
  }
  
  if (message.includes("rate limit exceeded") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  
  if (message.includes("popup closed") || message.includes("cancelled")) {
    return "Login cancelled.";
  }

  if (message.includes("network request failed") || message.includes("fetch failed")) {
      return "We can't reach the server. Please check your internet connection.";
  }

  // Fallback for technical strings we might not want to show raw
  if (message.includes("authapi") || message.includes("database")) {
      return "Something went wrong on our end. Please try again later.";
  }

  // Return original message if it seems safe/readable, otherwise default
  return error.message || "Something went wrong. Please try again.";
}
