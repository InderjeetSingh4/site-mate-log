export const mapDatabaseError = (error: { code?: string; message?: string }): string => {
  console.error("Database error:", error);

  if (error.code === "PGRST301" || error.message?.includes("row-level security")) {
    return "You do not have permission to perform this action.";
  }
  if (error.message?.includes("violates")) {
    return "The data you submitted is invalid.";
  }
  if (error.code === "23505") {
    return "This record already exists.";
  }

  return "An unexpected error occurred. Please try again.";
};
